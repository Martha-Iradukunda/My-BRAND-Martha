// Shared by the public pages (site.js) and the dashboard (dashboard.js): API calls, escaping, text → HTML, résumé layout.
import { blocks, parts } from './resume-format.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const linkify = (t) => parts(t).map(p => p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.text)}</a>` : esc(p.text)).join('');
const TOKEN = 'mi_token';
export const token = () => { try { return localStorage.getItem(TOKEN) || ''; } catch { return ''; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch { /* private mode */ } };

export async function api(path, { method = 'GET', body, raw, headers = {} } = {}) {
  const h = { ...headers };
  if (token()) h.authorization = 'Bearer ' + token();
  if (body !== undefined && !raw) h['content-type'] = 'application/json';
  let res;
  try { res = await fetch('/api/' + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) }); }
  catch { throw new Error('Could not reach the server. Check your internet connection and try again.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status });
  return data;
}

export function notice(el, text, ok) { if (!el) return; el.innerHTML = text ? `<div class="notice ${ok ? 'ok' : 'bad'}" role="${ok ? 'status' : 'alert'}">${esc(text)}</div>` : ''; }
export const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };

/** plain article text → paragraphs, lists and links */
export function textHtml(text) {
  let html = '', list = [];
  const flush = () => { if (list.length) { html += '<ul>' + list.map(l => `<li>${linkify(l)}</li>`).join('') + '</ul>'; list = []; } };
  for (const para of String(text).replace(/\r/g, '').split(/\n\s*\n/)) {
    for (const line of para.split('\n')) {
      const t = line.trim(); if (!t) continue;
      if (/^[-•*]\s+/.test(t)) list.push(t.replace(/^[-•*]\s+/, ''));
      else { flush(); html += `<p>${linkify(t)}</p>`; }
    }
    flush();
  }
  return html;
}

/** the résumé as HTML (same layout as the PDF) */
export function resumeHtml(r) {
  const contact = [r.location, ...(r.phones || [])].filter(Boolean).map(esc);
  if (r.email) contact.push(`<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`);
  let h = `<h1 class="rname">${esc(r.name)}</h1><p class="rcontact">${contact.join(' &nbsp;|&nbsp; ')}</p>`;
  if (r.links?.length) h += `<p class="rcontact">${r.links.map(l => `${esc(l.label)}: <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`).join(' &nbsp;|&nbsp; ')}</p>`;
  if (r.headline) h += `<p class="rhead">${esc(r.headline)}</p>`; else h += '<div class="rhead"></div>';
  for (const s of r.sections || []) {
    h += `<h2>${esc(s.title)}</h2>`;
    let list = [];
    const flush = () => { if (list.length) { h += '<ul>' + list.map(t => `<li>${linkify(t)}</li>`).join('') + '</ul>'; list = []; } };
    for (const b of blocks(s.body)) {
      if (b.type === 'bullet') { list.push(b.text); continue; }
      flush();
      h += b.type === 'entry' ? `<p class="entry">${linkify(b.title)}${b.meta ? ` <span>| ${esc(b.meta)}</span>` : ''}</p>` : `<p>${linkify(b.text)}</p>`;
    }
    flush();
  }
  return h;
}

