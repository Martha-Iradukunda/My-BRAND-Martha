// Local copy of the Netlify setup for testing: static files with "pretty URLs" (/about → about.html), the redirects from
// netlify.toml, and the API function. Data goes to .data/ (or LOCAL_DATA_DIR).   node tools/dev-server.mjs [port]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = join(root, 'site');
process.env.LOCAL_DATA_DIR ||= join(root, '.data');
const api = (await import('../netlify/functions/api.mjs')).default;
const port = Number(process.argv[2] || process.env.PORT || 8888);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

// the [[redirects]] of netlify.toml (from → to, status)
const redirects = [];
const toml = readFileSync(join(root, 'netlify.toml'), 'utf8');
for (const blk of toml.split('[[redirects]]').slice(1)) {
  const from = /from\s*=\s*"([^"]+)"/.exec(blk)?.[1], to = /to\s*=\s*"([^"]+)"/.exec(blk)?.[1], status = Number(/status\s*=\s*(\d+)/.exec(blk)?.[1] || 301);
  if (from && to) redirects.push({ from, to, status });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let p = decodeURIComponent(url.pathname);
  if (p.startsWith('/api/') || p === '/resume.pdf') {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await api(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), { ip: req.socket.remoteAddress });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  const rd = redirects.find(r => r.from === p);
  if (rd && rd.status >= 300) { res.writeHead(rd.status, { location: rd.to }); res.end(); return; }
  if (rd) p = rd.to;
  let file = normalize(join(site, p));
  if (!file.startsWith(site)) { res.writeHead(403); res.end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  else if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(existsSync(join(site, '404.html')) ? readFileSync(join(site, '404.html')) : 'Not found'); return;
  }
  res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Portfolio on http://localhost:${port}  (data in ${process.env.LOCAL_DATA_DIR})`));
