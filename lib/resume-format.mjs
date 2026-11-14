// Turns a résumé section's plain text into blocks, shared by the web page, the admin preview and the PDF.
//   "## Heading | dates" → entry   ·   "- text" → bullet   ·   other lines → paragraph
export const URL_RE = /(https?:\/\/[^\s)]+[^\s).,;:!?])/g;

export function blocks(body = '') {
  const out = [];
  for (const raw of String(body).replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      const [title, ...rest] = line.slice(3).split(' | ');
      out.push({ type: 'entry', title: title.trim(), meta: rest.join(' | ').trim() });
    } else if (/^[-•*]\s+/.test(line)) out.push({ type: 'bullet', text: line.replace(/^[-•*]\s+/, '') });
    else out.push({ type: 'p', text: line });
  }
  return out;
}

/** split text into [{text, url?}] parts so links can be drawn or rendered */
export function parts(text = '') {
  const res = []; let last = 0;
  for (const m of String(text).matchAll(URL_RE)) {
    if (m.index > last) res.push({ text: text.slice(last, m.index) });
    res.push({ text: m[0], url: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) res.push({ text: text.slice(last) });
  return res;
}

/** a résumé object is complete and safe to save */
export function validResume(r) {
  if (!r || typeof r !== 'object') return 'Missing résumé.';
  if (!String(r.name || '').trim()) return 'The name is required.';
  if (!Array.isArray(r.sections) || !r.sections.length) return 'Add at least one section.';
  if (r.sections.length > 30) return 'Too many sections.';
  for (const s of r.sections) {
    if (!String(s.title || '').trim()) return 'Every section needs a title.';
    if (String(s.body || '').length > 20000) return `The section "${s.title}" is too long.`;
  }
  if (r.links && (!Array.isArray(r.links) || r.links.some(l => l.url && !/^https?:\/\//.test(l.url)))) return 'Links must start with https://';
  return '';
}

export function clean(r) {
  const s = (v, n = 300) => String(v ?? '').trim().slice(0, n);
  return {
    name: s(r.name, 120), headline: s(r.headline, 300), location: s(r.location, 120), email: s(r.email, 160),
    phones: (Array.isArray(r.phones) ? r.phones : String(r.phones || '').split(',')).map(p => s(p, 40)).filter(Boolean).slice(0, 4),
    links: (r.links || []).map(l => ({ label: s(l.label, 40), url: s(l.url, 300) })).filter(l => l.label && l.url).slice(0, 8),
    sections: r.sections.map(x => ({ title: s(x.title, 120), body: String(x.body || '').replace(/\r/g, '').slice(0, 20000) })),
  };
}
