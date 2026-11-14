// Browser check (headless Chrome/Edge): every page on desktop and phone — no JavaScript errors, no failed requests to
// the site, nothing wider than the screen — then the contact form, signing in and every dashboard tab, publishing the résumé.
//   node tests/site-check.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.log('Chrome/Edge not found: skipped'); process.exit(0); }
const data = mkdtempSync(join(tmpdir(), 'mi-site-'));
const PASS = 'site-check-' + randomBytes(4).toString('hex'), EMAIL = 'owner@example.test', salt = randomBytes(16).toString('hex');
mkdirSync(join(data, 'auth'), { recursive: true });
writeFileSync(join(data, 'auth/admin.json'), JSON.stringify({ email: EMAIL, salt, hash: scryptSync(PASS, salt, 64).toString('hex') }));
const port = 9800 + Math.floor(Math.random() * 150), B = `http://127.0.0.1:${port}`;
const srv = spawn(process.execPath, ['tools/dev-server.mjs', String(port)], { env: { ...process.env, LOCAL_DATA_DIR: data }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok, no) => { srv.stdout.on('data', d => String(d).includes('Portfolio on') && ok()); setTimeout(() => no(new Error('server did not start')), 15000); });

const dport = 9300 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mi-chrome-'))}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 60 && !ws; i++) { try { const t = (await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json()).find(x => x.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl); } catch { } if (!ws) await sleep(250); }
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(), waiters = []; let errors = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (!m.method) return;
  for (const w of [...waiters]) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m); }
  const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') errors.push('JS error: ' + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').split('\n')[0]);
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') errors.push('console.error: ' + (p.args || []).map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Network.responseReceived' && p.response.url.startsWith(B) && p.response.status >= 400 && !/\/api\/(login|me)/.test(p.response.url)) errors.push(`HTTP ${p.response.status} ${p.response.url.replace(B, '')}`);
  if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
const go = async (path) => { const l = new Promise(r => waiters.push({ method: 'Page.loadEventFired', resolve: r })); await send('Page.navigate', { url: B + path }); await Promise.race([l, sleep(15000)]); await sleep(700); };
const until = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 200) { if (await ev(expr)) return true; await sleep(200); } return false; };
for (const d of ['Page', 'Runtime', 'Network']) await send(d + '.enable');

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('  FAIL', name, extra); } };
const pages = ['/', '/about', '/skills', '/portifolio', '/blogs', '/blog?id=two-computers', '/contacts', '/resume', '/login', '/nope'];
try {
  for (const [label, w, h, mobile] of [['desktop', 1366, 860, false], ['phone', 390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    for (const p of pages) {
      errors = []; await go(p);
      const wide = await ev('document.documentElement.scrollWidth - innerWidth');
      check(`${label} ${p}: no errors`, errors.filter(e => !(p === '/nope' && e.includes('404'))).length === 0, errors.join(' | '));
      check(`${label} ${p}: fits the screen`, wide <= 1, `${wide}px too wide`);
    }
    if (mobile) {
      await go('/');
      await ev(`document.querySelector('.burger').click()`);
      check('phone menu opens', await ev(`getComputedStyle(document.querySelector('#menu')).display !== 'none'`));
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 860, deviceScaleFactor: 1, mobile: false });
  // content that comes from the API
  await go('/skills'); check('skills bars filled', await until(`[...document.querySelectorAll('.fill')].length > 5 && parseFloat(document.querySelector('.fill').style.width) > 0`));
  await go('/blogs'); check('blogs listed', await until(`document.querySelectorAll('.post').length >= 3`));
  await go('/resume'); check('résumé shown with UMS live link', await until(`!!document.querySelector('.resume-doc a[href="https://ums-whpz.onrender.com"]')`));
  check('résumé download link', await ev(`document.querySelector('[data-resume-download]').getAttribute('href') === '/resume.pdf'`));
  // contact form
  await go('/contacts');
  await ev(`(() => { const f = document.querySelector('[data-contact-form]'); f.name.value = 'Browser Test'; f.email.value = 'browser@example.test'; f.message.value = 'Hello from the browser check'; f.querySelector('button').click(); })()`);
  check('contact form sends', await until(`document.querySelector('.notice.ok')?.textContent.includes('Thank you')`));
  // sign in through the form
  await go('/login');
  errors = [];
  await ev(`(() => { const f = document.querySelector('[data-login-form]'); f.email.value = '${EMAIL}'; f.password.value = 'wrong-one'; f.querySelector('button').click(); })()`);
  check('wrong password shows an error', await until(`document.querySelector('.notice.bad')?.textContent.includes('Wrong')`));
  await ev(`(() => { const f = document.querySelector('[data-login-form]'); f.password.value = '${PASS}'; f.querySelector('button').click(); })()`);
  check('sign in opens the dashboard', await until(`location.pathname === '/dashboard/' && !!document.querySelector('[data-rform]')`, 10000));
  // every tab
  for (const [tab, sel] of [['blogs', '[data-bform]'], ['messages', 'table'], ['skills', '[data-sform]'], ['account', '[data-aform]'], ['resume', '[data-rform]']]) {
    errors = [];
    await ev(`location.hash = '${tab}'`);
    check(`dashboard ${tab} tab`, await until(`!!document.querySelector('#dash-main ${sel}')`) && errors.length === 0, errors.join(' | '));
  }
  check('message from the contact form is in the dashboard', await (async () => { await ev(`location.hash = 'messages'`); return until(`document.querySelector('#dash-main').textContent.includes('Browser Test')`); })());
  // publish the résumé from the editor
  await ev(`location.hash = 'resume'`); await until(`!!document.querySelector('[data-rform]')`);
  await ev(`document.querySelector('[data-preview]').click()`);
  check('résumé preview', await until(`!!document.querySelector('[data-preview-box] .rname')`));
  await ev(`(() => { const t = document.querySelector('[data-sbody]'); t.value += '\\nPublished by the browser check.'; document.querySelector('[data-rform] button[type=submit]').click(); })()`);
  check('résumé published from the dashboard', await until(`document.querySelector('.toast')?.textContent.includes('Published')`, 10000));
  await go('/resume'); check('public résumé shows the change', await until(`document.querySelector('.resume-doc').textContent.includes('Published by the browser check')`));
  // write an article
  await go('/dashboard/#blogs'); await until(`!!document.querySelector('[data-bform]')`);
  await ev(`(() => { const f = document.querySelector('[data-bform]'); f.title.value = 'Browser check article'; f.body.value = 'Hello world.'; f.querySelector('button[type=submit]').click(); })()`);
  check('article published from the dashboard', await until(`document.querySelector('#dash-main').textContent.includes('Browser check article')`));
  await go('/blogs'); check('article visible on the blog', await until(`document.body.textContent.includes('Browser check article')`));
  await go('/'); check('menu shows Dashboard when signed in', await ev(`document.querySelector('[data-login-link]').textContent === 'Dashboard'`));
} finally {
  ws.close(); chrome.kill(); srv.kill(); rmSync(data, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
