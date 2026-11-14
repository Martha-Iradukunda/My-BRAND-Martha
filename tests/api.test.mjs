// Backend test: starts tools/dev-server.mjs on a free port with a throwaway data folder and checks every API feature.
//   node tests/api.test.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';

const data = mkdtempSync(join(tmpdir(), 'mi-api-'));
const PASS = 'test-password-' + randomBytes(4).toString('hex'), EMAIL = 'owner@example.test';
const salt = randomBytes(16).toString('hex');
mkdirSync(join(data, 'auth'), { recursive: true });
writeFileSync(join(data, 'auth/admin.json'), JSON.stringify({ email: EMAIL, salt, hash: scryptSync(PASS, salt, 64).toString('hex') }));
const port = 9500 + Math.floor(Math.random() * 300), B = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['tools/dev-server.mjs', String(port)], { env: { ...process.env, LOCAL_DATA_DIR: data }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok, no) => { srv.stdout.on('data', d => String(d).includes('Portfolio on') && ok()); setTimeout(() => no(new Error('server did not start')), 15000); });

let pass = 0, fail = 0, tok = '';
const check = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('  FAIL', name, extra); } };
const call = async (path, { method = 'GET', body, raw, type, auth = true } = {}) => {
  const h = {}; if (auth && tok) h.authorization = 'Bearer ' + tok;
  if (body !== undefined) h['content-type'] = 'application/json'; if (type) h['content-type'] = type;
  const r = await fetch(B + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined), redirect: 'manual' });
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, ct, headers: r.headers, data: ct.includes('json') ? await r.json() : new Uint8Array(await r.arrayBuffer()) };
};
const isPdf = (b) => b instanceof Uint8Array && String.fromCharCode(...b.slice(0, 5)) === '%PDF-';

try {
  // pages and old addresses
  for (const p of ['/', '/about', '/skills', '/portifolio', '/blogs', '/contacts', '/resume', '/login', '/dashboard/', '/blog?id=two-computers']) check('page ' + p, (await call(p)).status === 200);
  check('unknown page is 404', (await call('/nope')).status === 404);
  check('old /signup goes to /login', (await call('/signup')).headers.get('location') === '/login');
  check('old admin page redirects', (await call('/dashboard/adminstrator.html')).headers.get('location') === '/dashboard/');

  // public API
  check('health', (await call('/api/health')).data.ok === true);
  const r0 = await call('/api/resume');
  check('résumé has the UMS live address', JSON.stringify(r0.data).includes('https://ums-whpz.onrender.com') && !JSON.stringify(r0.data).includes('/poultry'));
  check('résumé has Marita Foundation and Rita links', JSON.stringify(r0.data).includes('https://marita-foundation.onrender.com') && JSON.stringify(r0.data).includes('/our-roots'));
  const pdf0 = await call('/resume.pdf');
  check('résumé PDF downloads', pdf0.status === 200 && isPdf(pdf0.data) && /attachment/.test(pdf0.headers.get('content-disposition')));
  check('résumé PDF opens in the browser with ?view', /inline/.test((await call('/resume.pdf?view')).headers.get('content-disposition')));
  const blogs = await call('/api/blogs');
  check('starter blogs listed', Array.isArray(blogs.data) && blogs.data.length >= 3);
  check('one blog opens', (await call('/api/blogs/two-computers')).data.title?.includes('two computers'));
  check('skills', (await call('/api/skills')).data.bars?.length > 5);

  // security
  check('owner pages need sign-in', (await call('/api/messages', { auth: false })).status === 401);
  check('forged token refused', (await call('/api/me', { auth: false, raw: undefined })).status === 401);
  check('wrong password refused', (await call('/api/login', { method: 'POST', body: { email: EMAIL, password: 'nope' } })).status === 401);
  const login = await call('/api/login', { method: 'POST', body: { email: EMAIL.toUpperCase(), password: PASS } });
  check('owner signs in', login.status === 200 && !!login.data.token); tok = login.data.token;
  check('me', (await call('/api/me')).data.email === EMAIL);

  // contact form → messages
  check('contact needs an email', (await call('/api/messages', { method: 'POST', auth: false, body: { name: 'A', email: 'bad', message: 'hi' } })).status === 400);
  check('contact message sent', (await call('/api/messages', { method: 'POST', auth: false, body: { name: 'Ama Visitor', email: 'ama@example.test', message: 'Hello Martha, can we work together?' } })).status === 200);
  check('bot message silently ignored', (await call('/api/messages', { method: 'POST', auth: false, body: { name: 'x', email: 'x@x.co', message: 'spam', website: 'http://spam' } })).status === 200);
  let msgs = (await call('/api/messages')).data;
  check('owner sees the message (and not the bot one)', msgs.length === 1 && msgs[0].read === false && msgs[0].name === 'Ama Visitor');
  check('mark read', (await call(`/api/messages/${msgs[0].id}/read`, { method: 'POST' })).status === 200 && (await call('/api/messages')).data[0].read === true);
  check('delete message', (await call('/api/messages/' + msgs[0].id, { method: 'DELETE' })).status === 200 && (await call('/api/messages')).data.length === 0);

  // blogs
  check('blog needs a title', (await call('/api/blogs', { method: 'POST', body: { title: '', body: 'x' } })).status === 400);
  check('new blog published', (await call('/api/blogs', { method: 'POST', body: { title: 'Test article', body: 'Hello\n\n- one\n- two', image: 'img/founder1.jpg' } })).status === 200);
  let all = (await call('/api/admin/blogs')).data; const mine = all.find(x => x.title === 'Test article');
  check('new blog is public', (await call('/api/blogs')).data.some(x => x.id === mine.id));
  check('edit + hide blog', (await call('/api/blogs/' + mine.id, { method: 'PUT', body: { title: 'Test article 2', body: 'Edited', published: false } })).status === 200);
  check('hidden blog not public', !(await call('/api/blogs')).data.some(x => x.id === mine.id) && (await call('/api/blogs/' + mine.id)).status === 404);
  check('bad image refused (kept empty)', (await call('/api/blogs/' + mine.id, { method: 'PUT', body: { title: 'T', body: 'B', image: 'javascript:alert(1)' } })).status === 200 && (await call('/api/admin/blogs')).data.find(x => x.id === mine.id).image === '');
  check('delete blog', (await call('/api/blogs/' + mine.id, { method: 'DELETE' })).status === 200 && !(await call('/api/admin/blogs')).data.some(x => x.id === mine.id));

  // résumé: publish from the editor
  const r = r0.data; r.sections.push({ title: 'Test section', body: '## New job | 2027\n- Did great work https://example.org' });
  check('résumé without a name refused', (await call('/api/resume', { method: 'PUT', body: { ...r, name: '' } })).status === 400);
  const pub = await call('/api/resume', { method: 'PUT', body: r });
  check('résumé published', pub.status === 200 && !!pub.data.updated);
  check('résumé page shows the new section', (await call('/api/resume')).data.sections.some(s => s.title === 'Test section'));
  const st = (await call('/api/resume/status')).data;
  check('status: built from the editor', st.mode === 'generated' && st.size > 1000);
  const pdf1 = await call('/resume.pdf');
  check('new PDF generated', isPdf(pdf1.data) && pdf1.data.length !== pdf0.data.length);
  // résumé: upload a PDF
  check('non-PDF upload refused', (await call('/api/resume/upload', { method: 'POST', raw: 'hello', type: 'application/pdf' })).status === 400);
  const fake = new TextEncoder().encode('%PDF-1.4\n% uploaded test file\n%%EOF');
  check('PDF uploaded', (await call('/api/resume/upload', { method: 'POST', raw: fake, type: 'application/pdf' })).status === 200);
  check('visitors get the uploaded PDF', (await call('/resume.pdf')).data.length === fake.length);
  check('back to the editor version', (await call('/api/resume/use-editor', { method: 'POST' })).status === 200 && (await call('/resume.pdf')).data.length === pdf1.data.length);

  // skills
  check('skills saved', (await call('/api/skills', { method: 'PUT', body: { intro: 'Hi', bars: [{ name: 'React', level: 140 }], soft: ['Teamwork'] } })).status === 200);
  check('skill level capped at 100', (await call('/api/skills')).data.bars[0].level === 100);

  // password change signs out everywhere
  check('short new password refused', (await call('/api/password', { method: 'POST', body: { current: PASS, password: 'short' } })).status === 400);
  check('wrong current password refused', (await call('/api/password', { method: 'POST', body: { current: 'x', password: 'a-long-new-password' } })).status === 400);
  check('password changed', (await call('/api/password', { method: 'POST', body: { current: PASS, password: 'a-long-new-password' } })).status === 200);
  check('old token no longer works', (await call('/api/me')).status === 401);
  tok = (await call('/api/login', { method: 'POST', body: { email: EMAIL, password: 'a-long-new-password' } })).data.token;
  check('sign in with the new password', !!tok && (await call('/api/me')).status === 200);

  // too many wrong passwords
  let last; for (let i = 0; i < 9; i++) last = await call('/api/login', { method: 'POST', body: { email: EMAIL, password: 'wrong' + i } });
  check('repeated wrong passwords are slowed down', last.status === 429);
} finally {
  srv.kill(); rmSync(data, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
