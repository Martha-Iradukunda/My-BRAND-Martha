// Storage. On Netlify: Netlify Blobs (nothing to set up, kept between deploys). On this computer (tools/dev-server.mjs, tests):
// a folder .data/ with the same keys, so everything can be tested without an account.
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

let backend = null;

async function open() {
  if (backend) return backend;
  if (!process.env.LOCAL_DATA_DIR) {
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore({ name: 'portfolio', consistency: 'strong' });
      backend = {
        getJSON: async (k) => (await store.get(k, { type: 'json' })) ?? null,
        setJSON: (k, v) => store.setJSON(k, v),
        getBytes: async (k) => { const b = await store.get(k, { type: 'arrayBuffer' }); return b ? new Uint8Array(b) : null; },
        setBytes: (k, v, meta = {}) => store.set(k, v, { metadata: meta }),
        del: (k) => store.delete(k),
        list: async (prefix) => (await store.list({ prefix })).blobs.map(b => b.key),
      };
      return backend;
    } catch (e) {
      if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) throw e;   // on Netlify, a real error
    }
  }
  const dir = process.env.LOCAL_DATA_DIR || join(process.cwd(), '.data');
  const file = (k) => join(dir, k.replace(/[^a-z0-9/_.-]/gi, '_'));
  const write = (k, buf) => { mkdirSync(dirname(file(k)), { recursive: true }); writeFileSync(file(k), buf); };
  backend = {
    getJSON: async (k) => existsSync(file(k)) ? JSON.parse(readFileSync(file(k), 'utf8')) : null,
    setJSON: async (k, v) => write(k, JSON.stringify(v)),
    getBytes: async (k) => existsSync(file(k)) ? new Uint8Array(readFileSync(file(k))) : null,
    setBytes: async (k, v) => write(k, Buffer.from(v)),
    del: async (k) => { if (existsSync(file(k))) rmSync(file(k)); },
    list: async (prefix) => { const d = dirname(file(prefix + 'x')); return existsSync(d) ? readdirSync(d).map(f => prefix.replace(/[^/]*$/, '') + f).filter(k => k.startsWith(prefix)) : []; },
  };
  return backend;
}

export const store = {
  getJSON: async (k) => (await open()).getJSON(k),
  setJSON: async (k, v) => (await open()).setJSON(k, v),
  getBytes: async (k) => (await open()).getBytes(k),
  setBytes: async (k, v, meta) => (await open()).setBytes(k, v, meta),
  del: async (k) => (await open()).del(k),
  list: async (p) => (await open()).list(p),
};
