// Owner dashboard: résumé editor (publish → page + PDF, or upload a PDF), blogs, messages, skills, account.
import { api, esc, token, setToken, fmtDate, resumeHtml, textHtml } from './common.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#dash-main');
if (!token()) location.replace('/login');

const toast = (msg) => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 4200); };
const fail = (e) => { if (e.status === 401) { setToken(''); location.replace('/login'); return; } toast(e.message); };
const busy = async (btn, fn) => { btn.disabled = true; try { await fn(); } catch (e) { fail(e); } finally { btn.disabled = false; } };
const IMAGES = ['', 'img/founder1.jpg', 'img/founder2.jpg', 'img/founder3.jpg', 'img/coding.jpg', 'img/desk.jpg', 'img/skills1.jpg', 'img/contactme.jpg', 'img/sup.jpg', 'img/ritaA.jpg', 'img/marita.jpeg', 'img/proj-marita.jpg', 'img/proj-ums.jpg', 'img/proj-rita.jpg', 'img/rita-centre.jpg'];

$('[data-logout]').addEventListener('click', (e) => { e.preventDefault(); setToken(''); location.replace('/login'); });
window.addEventListener('hashchange', show);
api('me').then(() => { show(); refreshUnread(); }).catch(fail);

function show() {
  const tab = (location.hash.slice(1) || 'resume');
  $$('[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  ({ resume, blogs, messages, skills, account }[tab] || resume)();
  window.scrollTo(0, 0);
}
async function refreshUnread() {
  try { const n = (await api('messages')).filter(m => !m.read).length; const b = $('[data-unread]'); b.textContent = n; b.hidden = !n; } catch { /* ignore */ }
}

// ---------------------------------------------------------------- résumé
async function resume() {
  main.onclick = null;
  main.innerHTML = '<p class="empty">Loading the résumé…</p>';
  let r, st;
  try { [r, st] = await Promise.all([api('resume'), api('resume/status')]); } catch (e) { return fail(e); }
  const mode = { default: 'the first version (not yet published from here)', generated: 'built from the editor below', uploaded: 'a PDF you uploaded' }[st.mode] || st.mode;
  main.innerHTML = `
  <div class="panel">
    <div class="row" style="justify-content:space-between"><div><h2 style="margin:0">Résumé</h2><p class="muted small" style="margin:4px 0 0">Visitors download: <b>${esc(mode)}</b>${st.updated ? ` · last published ${esc(st.updated)}` : ''}</p></div>
      <div class="row"><a class="btn sm ghost" href="/resume" target="_blank">Open résumé page</a><a class="btn sm ghost" href="/resume.pdf?view" target="_blank">Open PDF</a></div></div>
  </div>
  <form class="panel" data-rform>
    <h2>Edit and publish</h2>
    <p class="help">Change anything, then press <b>Publish</b>: the résumé page and the downloadable PDF update straight away.<br>
      In a section: a line starting with <code>## </code> is a job or project title (add <code> | dates</code>), a line starting with <code>- </code> is a bullet point, web addresses become links.</p>
    <div class="grid g2" style="gap:0 18px">
      <div class="field"><label>Full name</label><input type="text" name="name" value="${esc(r.name)}" required></div>
      <div class="field"><label>Headline</label><input type="text" name="headline" value="${esc(r.headline)}"></div>
      <div class="field"><label>Location</label><input type="text" name="location" value="${esc(r.location)}"></div>
      <div class="field"><label>Email</label><input type="email" name="email" value="${esc(r.email)}"></div>
      <div class="field"><label>Phone numbers (separate with commas)</label><input type="text" name="phones" value="${esc((r.phones || []).join(', '))}"></div>
      <div class="field"><label>Links (one per line: Label | https://…)</label><textarea name="links" rows="3" style="min-height:90px">${esc((r.links || []).map(l => `${l.label} | ${l.url}`).join('\n'))}</textarea></div>
    </div>
    <div data-sections></div>
    <div class="row" style="margin:6px 0 18px"><button type="button" class="btn sm ghost" data-add-section><i class="fas fa-plus"></i> Add a section</button></div>
    <div class="row"><button class="btn" type="submit"><i class="fas fa-cloud-arrow-up"></i> Publish résumé</button><button type="button" class="btn ghost" data-preview><i class="fas fa-eye"></i> Preview</button></div>
  </form>
  <div class="panel" data-preview-box hidden><h2>Preview</h2><div class="resume-doc" style="box-shadow:none"></div></div>
  <form class="panel" data-upload>
    <h2>Or upload your own PDF</h2>
    <p class="muted small">If you made your résumé in Word or Canva, upload the PDF and visitors will download that file instead (the page still shows the editor version).</p>
    <div class="row"><input type="file" name="file" accept="application/pdf" required style="max-width:360px"><button class="btn sm" type="submit"><i class="fas fa-upload"></i> Upload PDF</button>
      ${st.mode === 'uploaded' ? '<button type="button" class="btn sm ghost" data-use-editor>Use the editor version again</button>' : ''}</div>
  </form>`;
  const secBox = $('[data-sections]');
  const secHtml = (s) => `<div class="sec-edit"><div class="row" style="justify-content:space-between;margin-bottom:10px"><input type="text" data-stitle value="${esc(s.title)}" placeholder="Section title" style="max-width:420px">
      <span class="row"><button type="button" class="btn sm ghost" data-up title="Move up">↑</button><button type="button" class="btn sm ghost" data-down title="Move down">↓</button><button type="button" class="btn sm danger" data-del title="Remove section"><i class="fas fa-trash"></i></button></span></div>
      <textarea data-sbody>${esc(s.body)}</textarea></div>`;
  secBox.innerHTML = r.sections.map(secHtml).join('');
  secBox.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const box = b.closest('.sec-edit');
    if (b.matches('[data-del]') && confirm('Remove this section?')) box.remove();
    if (b.matches('[data-up]') && box.previousElementSibling) box.parentNode.insertBefore(box, box.previousElementSibling);
    if (b.matches('[data-down]') && box.nextElementSibling) box.parentNode.insertBefore(box.nextElementSibling, box);
  });
  $('[data-add-section]').addEventListener('click', () => { secBox.insertAdjacentHTML('beforeend', secHtml({ title: 'New section', body: '## Title | dates\n- What you did' })); });
  const collect = () => {
    const f = $('[data-rform]'), v = (n) => f.elements[n].value;
    return { name: v('name'), headline: v('headline'), location: v('location'), email: v('email'), phones: v('phones').split(',').map(x => x.trim()).filter(Boolean),
      links: v('links').split('\n').map(l => l.split('|')).filter(p => p.length >= 2).map(([label, ...u]) => ({ label: label.trim(), url: u.join('|').trim() })),
      sections: $$('.sec-edit', secBox).map(x => ({ title: $('[data-stitle]', x).value, body: $('[data-sbody]', x).value })) };
  };
  $('[data-preview]').addEventListener('click', () => { const p = $('[data-preview-box]'); p.hidden = false; $('.resume-doc', p).innerHTML = resumeHtml(collect()); p.scrollIntoView({ behavior: 'smooth' }); });
  $('[data-rform]').addEventListener('submit', (e) => { e.preventDefault(); busy($('button[type=submit]', e.target), async () => { const res = await api('resume', { method: 'PUT', body: collect() }); toast(res.message); resume(); }); });
  $('[data-upload]').addEventListener('submit', (e) => {
    e.preventDefault(); const file = e.target.elements.file.files[0];
    if (!file) return toast('Choose a PDF file first.');
    if (file.size > 4 * 1024 * 1024) return toast('The PDF is too large (4 MB at most).');
    busy($('button[type=submit]', e.target), async () => { const res = await api('resume/upload', { method: 'POST', raw: file, headers: { 'content-type': 'application/pdf' } }); toast(res.message); resume(); });
  });
  $('[data-use-editor]')?.addEventListener('click', (e) => busy(e.target, async () => { await api('resume/use-editor', { method: 'POST' }); toast('Visitors now download the editor version.'); resume(); }));
}

// ---------------------------------------------------------------- blogs
async function blogs(editId) {
  main.innerHTML = '<p class="empty">Loading…</p>';
  let list; try { list = await api('admin/blogs'); } catch (e) { return fail(e); }
  const p = typeof editId === 'string' ? list.find(x => x.id === editId) : null;
  main.innerHTML = `
  <form class="panel" data-bform>
    <h2>${p ? 'Edit article' : 'Write a new article'}</h2>
    <div class="field"><label>Title</label><input type="text" name="title" value="${esc(p?.title)}" required maxlength="160"></div>
    <div class="field"><label>Cover picture</label><select name="image">${IMAGES.map(i => `<option value="${i}"${(p?.image || '') === i ? ' selected' : ''}>${i ? i.replace('img/', '') : 'No picture'}</option>`).join('')}</select></div>
    <div class="field"><label>Text</label><textarea name="body" rows="14" required>${esc(p?.body)}</textarea>
      <p class="muted small">Leave an empty line between paragraphs. Start a line with "- " for a bullet point. Web addresses become links.</p></div>
    <label style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" name="published" ${p?.published === false ? '' : 'checked'} style="width:auto"> Published (visible on the website)</label>
    <div class="row" style="margin-top:16px"><button class="btn" type="submit"><i class="fas fa-floppy-disk"></i> ${p ? 'Save changes' : 'Publish article'}</button>
      ${p ? '<button type="button" class="btn ghost" data-cancel>Cancel</button>' : ''}<button type="button" class="btn ghost" data-bpreview>Preview</button></div>
    <div data-bprev hidden class="article" style="margin-top:20px;border-top:1px solid var(--line);padding-top:20px"></div>
  </form>
  <div class="panel"><h2>Articles (${list.length})</h2>
    <table><thead><tr><th>Title</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td><b>${esc(x.title)}</b></td><td class="small">${esc(fmtDate(x.date))}</td><td class="small">${x.published === false ? 'Hidden' : 'Published'}</td>
      <td class="row" style="justify-content:flex-end"><a class="btn sm ghost" href="/blog?id=${encodeURIComponent(x.id)}" target="_blank">View</a><button class="btn sm ghost" data-edit="${esc(x.id)}">Edit</button><button class="btn sm danger" data-delete="${esc(x.id)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    ${list.length ? '' : '<tr><td colspan="4" class="muted">No articles yet.</td></tr>'}</tbody></table></div>`;
  const f = $('[data-bform]');
  f.addEventListener('submit', (e) => { e.preventDefault(); busy($('button[type=submit]', f), async () => {
    const body = { title: f.elements.title.value, image: f.elements.image.value, body: f.elements.body.value, published: f.elements.published.checked };
    const res = await api(p ? 'blogs/' + p.id : 'blogs', { method: p ? 'PUT' : 'POST', body }); toast(res.message); blogs();
  }); });
  $('[data-cancel]')?.addEventListener('click', () => blogs());
  $('[data-bpreview]').addEventListener('click', () => { const b = $('[data-bprev]'); b.hidden = false; b.innerHTML = `<h1 style="font-size:1.8rem">${esc(f.elements.title.value)}</h1>${textHtml(f.elements.body.value)}`; });
  main.onclick = onBlogClick;
  function onBlogClick(e) {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-delete]');
    if (ed) blogs(ed.dataset.edit);
    if (del && confirm('Delete this article? This cannot be undone.')) busy(del, async () => { await api('blogs/' + del.dataset.delete, { method: 'DELETE' }); toast('Article deleted.'); blogs(); });
  }
}

// ---------------------------------------------------------------- messages
async function messages() {
  main.innerHTML = '<p class="empty">Loading…</p>';
  let list; try { list = await api('messages'); } catch (e) { return fail(e); }
  main.innerHTML = `<div class="panel"><h2>Messages (${list.length})</h2><p class="muted small">Sent from the contact form. Reply by email.</p>
    <table><thead><tr><th>From</th><th>Message</th><th>Date</th><th></th></tr></thead><tbody>
    ${list.map(m => `<tr class="${m.read ? '' : 'unread'}"><td><b>${esc(m.name)}</b><br><a class="small" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message')}">${esc(m.email)}</a></td>
      <td style="white-space:pre-wrap;max-width:520px">${esc(m.message)}</td><td class="small">${esc(fmtDate(m.date))}</td>
      <td class="row" style="justify-content:flex-end">${m.read ? '' : `<button class="btn sm ghost" data-read="${esc(m.id)}">Mark read</button>`}<button class="btn sm danger" data-mdel="${esc(m.id)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    ${list.length ? '' : '<tr><td colspan="4" class="muted">No messages yet.</td></tr>'}</tbody></table></div>`;
  main.onclick = (e) => {
    const r = e.target.closest('[data-read]'), d = e.target.closest('[data-mdel]');
    if (r) busy(r, async () => { await api(`messages/${r.dataset.read}/read`, { method: 'POST' }); main.onclick = null; messages(); refreshUnread(); });
    if (d && confirm('Delete this message?')) busy(d, async () => { await api('messages/' + d.dataset.mdel, { method: 'DELETE' }); main.onclick = null; messages(); refreshUnread(); });
  };
}

// ---------------------------------------------------------------- skills
async function skills() {
  main.onclick = null;
  let s; try { s = await api('skills'); } catch (e) { return fail(e); }
  const row = (b) => `<div class="row" data-srow style="margin-bottom:8px"><input type="text" value="${esc(b.name)}" placeholder="Skill" style="flex:1;min-width:180px"><input type="number" min="0" max="100" value="${b.level}" style="width:100px"><span class="muted">%</span><button type="button" class="btn sm danger" data-sdel><i class="fas fa-trash"></i></button></div>`;
  main.innerHTML = `<form class="panel" data-sform><h2>Skills page</h2>
    <div class="field"><label>Introduction</label><textarea name="intro" rows="3" style="min-height:90px">${esc(s.intro)}</textarea></div>
    <label>Skill bars (name and level)</label><div data-srows>${s.bars.map(row).join('')}</div>
    <button type="button" class="btn sm ghost" data-sadd style="margin:6px 0 18px"><i class="fas fa-plus"></i> Add a skill</button>
    <div class="field"><label>Soft skills (separate with commas)</label><input type="text" name="soft" value="${esc((s.soft || []).join(', '))}"></div>
    <button class="btn" type="submit"><i class="fas fa-floppy-disk"></i> Save skills</button></form>`;
  const rows = $('[data-srows]');
  $('[data-sadd]').addEventListener('click', () => rows.insertAdjacentHTML('beforeend', row({ name: '', level: 70 })));
  rows.addEventListener('click', (e) => { if (e.target.closest('[data-sdel]')) e.target.closest('[data-srow]').remove(); });
  $('[data-sform]').addEventListener('submit', (e) => { e.preventDefault(); busy($('button[type=submit]', e.target), async () => {
    const bars = $$('[data-srow]', rows).map(r => { const [n, l] = $$('input', r); return { name: n.value, level: Number(l.value) }; });
    const res = await api('skills', { method: 'PUT', body: { intro: e.target.elements.intro.value, bars, soft: e.target.elements.soft.value.split(',').map(x => x.trim()).filter(Boolean) } });
    toast(res.message);
  }); });
}

// ---------------------------------------------------------------- account
async function account() {
  main.onclick = null;
  let me; try { me = await api('me'); } catch (e) { return fail(e); }
  main.innerHTML = `<form class="panel" data-aform style="max-width:560px"><h2>Account</h2>
    <p class="muted small">Signed in as <b>${esc(me.email)}</b>. Changing the password signs you out everywhere.</p>
    <div class="field"><label>Sign-in email</label><input type="email" name="email" value="${esc(me.email)}" required></div>
    <div class="field"><label>Current password</label><input type="password" name="current" autocomplete="current-password" required></div>
    <div class="field"><label>New password (at least 10 characters)</label><input type="password" name="password" autocomplete="new-password" minlength="10" required></div>
    <div class="field"><label>Repeat the new password</label><input type="password" name="again" autocomplete="new-password" required></div>
    <button class="btn" type="submit"><i class="fas fa-key"></i> Save</button></form>`;
  $('[data-aform]').addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target.elements;
    if (f.password.value !== f.again.value) return toast('The two new passwords are not the same.');
    busy($('button[type=submit]', e.target), async () => { const res = await api('password', { method: 'POST', body: { current: f.current.value, password: f.password.value, email: f.email.value } }); toast(res.message); setTimeout(() => { setToken(''); location.replace('/login'); }, 1800); });
  });
}
