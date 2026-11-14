// The portfolio's backend: one Netlify Function (Functions v2) for every /api/* request and for /resume.pdf.
// Data lives in Netlify Blobs (lib/store.mjs). Only the site owner can sign in; there are no public accounts.
import { scryptSync, randomBytes, timingSafeEqual, createHmac, randomUUID } from 'node:crypto';
import { store } from '../../lib/store.mjs';
import { validResume, clean } from '../../lib/resume-format.mjs';
import { resumePdf } from '../../lib/resume-pdf.mjs';
import defaultResume from '../../lib/resume-default.mjs';
import defaultSkills from '../../lib/skills-default.mjs';
import starterBlogs from '../../lib/blogs-default.mjs';

// the first sign-in uses this password (given to the owner privately); change it in Dashboard › Account
const INITIAL_ADMIN = { email: 'marita.martha23@gmail.com', salt: '6bcd623ae9f12eb593626c174c59f991',
  hash: '529d93925ca5f557dd7066fd137fc44e234324e5f7684f6226dd8cf0c4b31e565168cec47f089fe3c8f13c83190280820cd6fa0f6426b54df3b634a15bcdafb9' };
const TOKEN_DAYS = 7;
const MAX_PDF = 4 * 1024 * 1024;

export const config = { path: ['/api/*', '/resume.pdf'] };

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  const m = req.method;
  try {
    if (path === '/resume.pdf') return resumeFile(url);
    const seg = path.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const [a, b, c] = seg;
    const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'local';

    // ---------- public
    if (a === 'health') return json({ ok: true, time: new Date().toISOString() });
    if (a === 'login' && m === 'POST') return login(req, ip);
    if (a === 'resume' && !b && m === 'GET') return json(await getResume());
    if (a === 'skills' && m === 'GET') return json(await getSkills());
    if (a === 'blogs' && m === 'GET' && !b) return json((await getBlogs()).filter(p => p.published !== false).map(summary));
    if (a === 'blogs' && m === 'GET' && b) { const p = (await getBlogs()).find(x => x.id === b && x.published !== false); return p ? json(p) : err(404, 'This article was not found.'); }
    if (a === 'messages' && !b && m === 'POST') return sendMessage(req, ip);

    // ---------- owner only
    const who = await auth(req);
    if (!who) return err(401, 'Please sign in again.');
    if (a === 'me') return json({ email: who.email });
    if (a === 'password' && m === 'POST') return changePassword(req);
    if (a === 'resume' && !b && m === 'PUT') return saveResume(req);
    if (a === 'resume' && b === 'upload' && m === 'POST') return uploadResume(req);
    if (a === 'resume' && b === 'use-editor' && m === 'POST') { await setMeta({ ...(await meta()), mode: 'generated' }); return json({ ok: true }); }
    if (a === 'resume' && b === 'status' && m === 'GET') return json(await meta());
    if (a === 'skills' && m === 'PUT') return saveSkills(req);
    if (a === 'admin' && b === 'blogs' && m === 'GET') return json(await getBlogs());
    if (a === 'blogs' && m === 'POST') return saveBlog(req, null);
    if (a === 'blogs' && b && m === 'PUT') return saveBlog(req, b);
    if (a === 'blogs' && b && m === 'DELETE') { await store.setJSON('blogs.json', (await getBlogs()).filter(p => p.id !== b)); return json({ ok: true }); }
    if (a === 'messages' && m === 'GET') return json(await getMessages());
    if (a === 'messages' && b && c === 'read' && m === 'POST') return markMessage(b, true);
    if (a === 'messages' && b && m === 'DELETE') { await store.setJSON('messages.json', (await getMessages()).filter(x => x.id !== b)); return json({ ok: true }); }
    return err(404, 'Not found.');
  } catch (e) {
    console.error(e);
    return err(500, 'Something went wrong on the server. Please try again.');
  }
};

// ---------------------------------------------------------------- helpers
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const err = (status, message) => json({ error: message }, status);
const body = async (req, limit = 200_000) => {
  const t = await req.text();
  if (t.length > limit) throw Object.assign(new Error('too large'), { status: 413 });
  try { return JSON.parse(t || '{}'); } catch { return {}; }
};
const b64 = (s) => Buffer.from(s).toString('base64url');
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

async function secret() {
  let s = await store.getJSON('auth/secret.json');
  if (!s?.key) { s = { key: randomBytes(32).toString('hex') }; await store.setJSON('auth/secret.json', s); }
  return s.key;
}
async function admin() { return (await store.getJSON('auth/admin.json')) || INITIAL_ADMIN; }
const check = (pw, a) => { const h = scryptSync(String(pw), a.salt, 64); const want = Buffer.from(a.hash, 'hex'); return h.length === want.length && timingSafeEqual(h, want); };

async function login(req, ip) {
  const key = 'auth/tries/' + createHmac('sha256', 'ip').update(ip).digest('hex').slice(0, 16) + '.json';
  const t = (await store.getJSON(key)) || { n: 0, at: 0 };
  if (t.n >= 8 && Date.now() - t.at < 15 * 60_000) return err(429, 'Too many attempts. Please wait 15 minutes and try again.');
  const { email = '', password = '' } = await body(req);
  const a = await admin();
  if (String(email).trim().toLowerCase() !== a.email.toLowerCase() || !check(password, a)) {
    await store.setJSON(key, { n: (Date.now() - t.at < 15 * 60_000 ? t.n : 0) + 1, at: Date.now() });
    await new Promise(r => setTimeout(r, 400));
    return err(401, 'Wrong email or password.');
  }
  await store.del(key);
  const payload = b64(JSON.stringify({ sub: a.email, exp: Date.now() + TOKEN_DAYS * 86400_000, v: a.hash.slice(0, 8) }));
  const sig = createHmac('sha256', await secret()).update(payload).digest('base64url');
  return json({ token: `${payload}.${sig}`, email: a.email });
}

async function auth(req) {
  const h = req.headers.get('authorization') || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = tok.split('.');
  if (!payload || !sig) return null;
  const want = createHmac('sha256', await secret()).update(payload).digest('base64url');
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  let p; try { p = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  const a = await admin();
  if (!p.exp || p.exp < Date.now() || p.v !== a.hash.slice(0, 8)) return null;   // a password change signs every device out
  return { email: a.email };
}

async function changePassword(req) {
  const { current = '', password = '', email } = await body(req);
  const a = await admin();
  if (!check(current, a)) return err(400, 'Your current password is not correct.');
  if (String(password).length < 10) return err(400, 'Use at least 10 characters for the new password.');
  const salt = randomBytes(16).toString('hex');
  const next = { email: (email && /.+@.+\..+/.test(email) ? String(email).trim() : a.email), salt, hash: scryptSync(String(password), salt, 64).toString('hex') };
  await store.setJSON('auth/admin.json', next);
  return json({ ok: true, message: 'Password changed. Please sign in again with the new password.' });
}

// ---------------------------------------------------------------- résumé
async function getResume() { return (await store.getJSON('resume.json')) || { ...defaultResume, updated: null }; }
async function meta() { return (await store.getJSON('resume-meta.json')) || { mode: 'default', updated: null }; }
async function setMeta(v) { await store.setJSON('resume-meta.json', v); }

async function saveResume(req) {
  const r = await body(req, 400_000);
  const problem = validResume(r);
  if (problem) return err(400, problem);
  const data = { ...clean(r), updated: today() };
  const pdf = resumePdf(data, { updated: data.updated });
  await store.setBytes('resume.pdf', pdf, { type: 'application/pdf' });
  await store.setJSON('resume.json', data);
  await setMeta({ mode: 'generated', updated: data.updated, size: pdf.length });
  return json({ ok: true, updated: data.updated, message: 'Published. Your résumé page and PDF are updated.' });
}

async function uploadResume(req) {
  const type = req.headers.get('content-type') || '';
  if (!type.includes('application/pdf')) return err(400, 'Please choose a PDF file.');
  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.length > MAX_PDF) return err(400, 'The PDF is too large (4 MB at most).');
  if (String.fromCharCode(...buf.slice(0, 5)) !== '%PDF-') return err(400, 'This file is not a valid PDF.');
  await store.setBytes('resume-uploaded.pdf', buf, { type: 'application/pdf' });
  const updated = today();
  await setMeta({ mode: 'uploaded', updated, size: buf.length });
  return json({ ok: true, updated, message: 'Uploaded. Visitors now download this PDF.' });
}

async function resumeFile(url) {
  const m = await meta();
  let bytes = null;
  if (m.mode === 'uploaded') bytes = await store.getBytes('resume-uploaded.pdf');
  if (!bytes && m.mode === 'generated') bytes = await store.getBytes('resume.pdf');
  if (!bytes) {   // nothing published yet: the copy shipped with the site
    const r = await fetch(new URL('/assets/MarthaRekeraho_Resume.pdf', url.origin));
    if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
  }
  if (!bytes) bytes = resumePdf(defaultResume, {});
  const inline = url.searchParams.has('view');
  return new Response(bytes, { headers: { 'content-type': 'application/pdf', 'cache-control': 'no-cache',
    'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="MarthaRekeraho_Resume.pdf"` } });
}

// ---------------------------------------------------------------- skills
async function getSkills() { return (await store.getJSON('skills.json')) || defaultSkills; }
async function saveSkills(req) {
  const s = await body(req);
  const bars = (Array.isArray(s.bars) ? s.bars : []).map(x => ({ name: String(x.name || '').trim().slice(0, 40), level: Math.max(0, Math.min(100, parseInt(x.level, 10) || 0)) })).filter(x => x.name).slice(0, 30);
  const tags = (Array.isArray(s.soft) ? s.soft : []).map(x => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 30);
  if (!bars.length) return err(400, 'Add at least one skill.');
  await store.setJSON('skills.json', { intro: String(s.intro || '').slice(0, 800), bars, soft: tags });
  return json({ ok: true, message: 'Skills saved.' });
}

// ---------------------------------------------------------------- blogs
async function getBlogs() {
  let list = await store.getJSON('blogs.json');
  if (!list) { list = starterBlogs; await store.setJSON('blogs.json', list); }
  return list.sort((x, y) => String(y.date).localeCompare(String(x.date)));
}
const summary = (p) => ({ id: p.id, title: p.title, date: p.date, image: p.image, excerpt: String(p.body).replace(/\s+/g, ' ').slice(0, 220) });
async function saveBlog(req, id) {
  const d = await body(req, 300_000);
  const title = String(d.title || '').trim().slice(0, 160), text = String(d.body || '').trim().slice(0, 50_000);
  if (!title || !text) return err(400, 'Give the article a title and some text.');
  const image = /^(img\/[a-z0-9._-]+|https:\/\/\S+)$/i.test(String(d.image || '')) ? String(d.image) : '';
  const list = await getBlogs();
  if (id) {
    const p = list.find(x => x.id === id); if (!p) return err(404, 'This article was not found.');
    Object.assign(p, { title, body: text, image, published: d.published !== false, edited: new Date().toISOString() });
  } else list.unshift({ id: randomUUID().slice(0, 8), title, body: text, image, published: d.published !== false, date: new Date().toISOString() });
  await store.setJSON('blogs.json', list);
  return json({ ok: true, message: id ? 'Article updated.' : 'Article published.' });
}

// ---------------------------------------------------------------- messages
async function getMessages() { return ((await store.getJSON('messages.json')) || []).sort((a, b) => String(b.date).localeCompare(String(a.date))); }
async function sendMessage(req, ip) {
  const d = await body(req, 20_000);
  if (d.website) return json({ ok: true, message: 'Thank you! Your message was sent.' });   // hidden field filled in: a bot
  const name = String(d.name || '').trim().slice(0, 120), email = String(d.email || '').trim().slice(0, 160), text = String(d.message || '').trim().slice(0, 5000);
  if (!name || !text || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(400, 'Please give your name, a valid email and a message.');
  const list = await getMessages();
  const hour = Date.now() - 3600_000, mine = createHmac('sha256', 'ip').update(ip).digest('hex').slice(0, 12);
  if (list.filter(x => x.src === mine && Date.parse(x.date) > hour).length >= 5) return err(429, 'You have sent several messages already. Please try again later.');
  list.unshift({ id: randomUUID().slice(0, 8), name, email, message: text, date: new Date().toISOString(), read: false, src: mine });
  await store.setJSON('messages.json', list.slice(0, 1000));
  return json({ ok: true, message: 'Thank you! Your message was sent. I will reply by email.' });
}
async function markMessage(id, read) {
  const list = await getMessages(); const x = list.find(y => y.id === id); if (!x) return err(404, 'Not found.');
  x.read = read; await store.setJSON('messages.json', list); return json({ ok: true });
}
