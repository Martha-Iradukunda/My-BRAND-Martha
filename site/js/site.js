// Public pages: menu, scroll reveal, and the parts that come from the API (skills, blogs, résumé, contact form, sign-in).
import { api, esc, token, setToken, notice, fmtDate, textHtml, resumeHtml } from './common.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------------------------------------------------------------- every page
const burger = $('.burger'), menu = $('#menu');
burger?.addEventListener('click', () => { const open = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); });
$$('[data-year]').forEach(e => { e.textContent = new Date().getFullYear(); });
if (token()) $$('[data-login-link]').forEach(a => { a.textContent = 'Dashboard'; a.href = '/dashboard/'; });
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }) : null;
const watch = (root = document) => $$('.reveal:not(.in)', root).forEach(el => io ? io.observe(el) : el.classList.add('in'));
watch();

// ---------------------------------------------------------------- pages
const page = document.body.dataset.page;

if (page === 'skills') {
  const fill = () => $$('.fill[data-level]').forEach(f => requestAnimationFrame(() => { f.style.width = f.dataset.level + '%'; }));
  api('skills').then(s => {
    if (s.intro) $('[data-skills-intro]').textContent = s.intro;
    $('[data-bars]').innerHTML = s.bars.map(b => `<div class="bar"><div class="info"><span>${esc(b.name)}</span><span>${b.level}%</span></div><div class="track"><div class="fill" data-level="${b.level}"></div></div></div>`).join('');
    if (s.soft?.length) $('[data-soft]').innerHTML = s.soft.map(x => `<span class="chip">${esc(x)}</span>`).join('');
    setTimeout(fill, 150);
  }).catch(fill);
}

if (page === 'blogs') {
  const box = $('[data-posts]');
  api('blogs').then(list => {
    box.innerHTML = list.length ? list.map(p => `<a class="card post reveal" href="/blog?id=${encodeURIComponent(p.id)}">
      <div class="cover" style="background-image:url('${esc(p.image ? (p.image.startsWith('http') ? p.image : '/' + p.image) : '/img/mylogo.png')}')"></div>
      <div class="in"><span class="date">${esc(fmtDate(p.date))}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}${p.excerpt.length >= 220 ? '…' : ''}</p><span class="btn sm" style="align-self:flex-start">Read more</span></div></a>`).join('')
      : '<p class="empty">No articles yet. Come back soon!</p>';
    watch(box);
  }).catch(e => { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; });
}

if (page === 'blog') {
  const box = $('[data-article]');
  const id = new URLSearchParams(location.search).get('id');
  if (!id) box.innerHTML = '<p class="empty">This article was not found.</p>';
  else api('blogs/' + encodeURIComponent(id)).then(p => {
    document.title = `${p.title} · Martha Iradukunda`;
    box.innerHTML = `${p.image ? `<div class="cover" style="background-image:url('${esc(p.image.startsWith('http') ? p.image : '/' + p.image)}')"></div>` : ''}
      <span class="eyebrow">${esc(fmtDate(p.date))}</span><h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">${esc(p.title)}</h1><div class="content">${textHtml(p.body)}</div>`;
  }).catch(e => { box.innerHTML = `<p class="empty">${esc(e.status === 404 ? 'This article was not found.' : e.message)}</p>`; });
}

if (page === 'resume') {
  const box = $('[data-resume]');
  api('resume').then(r => {
    box.innerHTML = resumeHtml(r);
    if (r.updated) $('[data-resume-updated]').textContent = 'Last updated ' + r.updated;
  }).catch(e => { box.innerHTML = `<p class="empty">${esc(e.message)} You can still <a href="/resume.pdf">download the PDF</a>.</p>`; });
}

if (page === 'contacts') {
  const form = $('[data-contact-form]'), out = $('[data-form-notice]', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (!d.name.trim() || !d.message.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { notice(out, 'Please give your name, a valid email and a message.'); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true;
    try { const r = await api('messages', { method: 'POST', body: d }); notice(out, r.message, true); form.reset(); }
    catch (err) { notice(out, err.message); }
    finally { btn.disabled = false; }
  });
}

if (page === 'login') {
  if (token()) location.replace('/dashboard/');
  const form = $('[data-login-form]'), out = $('[data-form-notice]', form);
  $('[data-show-password]').addEventListener('change', (e) => { $('#l-pass').type = e.target.checked ? 'text' : 'password'; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const btn = $('button[type=submit]', form); btn.disabled = true; notice(out, '');
    try { const r = await api('login', { method: 'POST', body: d }); setToken(r.token); location.replace('/dashboard/'); }
    catch (err) { notice(out, err.message); btn.disabled = false; }
  });
}
