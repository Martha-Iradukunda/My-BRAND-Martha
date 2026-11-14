// Builds the résumé PDF (A4, real selectable text, clickable links) from the résumé data. Used by the API when the résumé
// is published from the dashboard, and by tools/make-resume-pdf.mjs for the copy shipped with the site.
import { jsPDF } from 'jspdf';
import { blocks, parts } from './resume-format.mjs';

const BLUE = [31, 78, 121];        // headings, like the original résumé
const ORANGE = [251, 117, 14];     // the site's accent (#fb750e), a thin rule under the header
const INK = [34, 34, 34];
const MUTED = [90, 90, 90];
const LINK = [20, 90, 170];

export function resumePdf(r, { updated } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: `${r.name} - Résumé`, author: r.name, subject: 'Résumé', creator: 'martha-iradukunda-brand.netlify.app' });
  const W = 210, H = 297, M = 15, R = W - M, maxW = R - M;
  let y = M;
  const page = () => { doc.addPage(); y = M; };
  const need = (h) => { if (y + h > H - 14) page(); };
  const font = (style, size, color) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
  const lh = (size) => size * 0.3528 * 1.32; // line height in mm for a font size in pt

  // write rich text (links) wrapped inside [x, x+width]; returns nothing, advances y
  const flow = (text, x, width, size, { style = 'normal', color = INK, align = 'left' } = {}) => {
    const tokens = [];
    for (const p of parts(text)) {
      if (p.url) { tokens.push({ t: p.text, url: p.url }); continue; }
      for (const w of p.text.split(/(\s+)/)) if (w) tokens.push({ t: w });
    }
    font(style, size, color);
    const lines = [[]]; let lineW = 0;
    for (const tk of tokens) {
      const space = /^\s+$/.test(tk.t);
      let tw = doc.getTextWidth(space ? ' ' : tk.t);
      if (space) { if (lines[lines.length - 1].length) { lines[lines.length - 1].push({ t: ' ', w: tw }); lineW += tw; } continue; }
      if (lineW + tw > width && lines[lines.length - 1].length) { trim(lines[lines.length - 1]); lines.push([]); lineW = 0; }
      // a single word or link longer than the line: cut it
      while (tw > width) {
        let n = tk.t.length; while (n > 1 && doc.getTextWidth(tk.t.slice(0, n)) > width - lineW) n--;
        lines[lines.length - 1].push({ t: tk.t.slice(0, n), url: tk.url, w: doc.getTextWidth(tk.t.slice(0, n)) });
        lines.push([]); lineW = 0; tk.t = tk.t.slice(n); tw = doc.getTextWidth(tk.t);
      }
      lines[lines.length - 1].push({ t: tk.t, url: tk.url, w: tw }); lineW += tw;
    }
    trim(lines[lines.length - 1]);
    const step = lh(size);
    for (const line of lines) {
      if (!line.length) continue;
      need(step);
      const total = line.reduce((s, k) => s + k.w, 0);
      let cx = align === 'center' ? x + (width - total) / 2 : x;
      for (const k of line) {
        if (k.url) {
          doc.setTextColor(...LINK); doc.text(k.t, cx, y + step * 0.75);
          doc.setDrawColor(...LINK); doc.setLineWidth(0.15); doc.line(cx, y + step * 0.82, cx + k.w, y + step * 0.82);
          doc.link(cx, y, k.w, step, { url: k.url });
          doc.setTextColor(...color);
        } else doc.text(k.t, cx, y + step * 0.75);
        cx += k.w;
      }
      y += step;
    }
  };
  function trim(line) { while (line.length && line[line.length - 1].t === ' ') line.pop(); }

  // header
  font('bold', 20, BLUE); doc.text(r.name.toUpperCase(), W / 2, y + 7, { align: 'center' }); y += 11;
  const contact = [r.location, ...(r.phones || []), r.email].filter(Boolean).join('  |  ');
  flow(contact, M, maxW, 9, { color: MUTED, align: 'center' });
  if (r.links?.length) flow(r.links.map(l => `${l.label}: ${l.url}`).join('  |  '), M, maxW, 9, { color: MUTED, align: 'center' });
  if (r.headline) { y += 1; flow(r.headline.toUpperCase(), M, maxW, 9, { style: 'bold', color: BLUE, align: 'center' }); }
  y += 2; doc.setDrawColor(...ORANGE); doc.setLineWidth(0.6); doc.line(M, y, R, y); y += 4;

  // sections
  for (const s of r.sections) {
    need(14);
    font('bold', 11, BLUE); doc.text(s.title.toUpperCase(), M, y + 4); y += 5.5;
    doc.setDrawColor(200, 210, 222); doc.setLineWidth(0.3); doc.line(M, y, R, y); y += 2.2;
    for (const b of blocks(s.body)) {
      if (b.type === 'entry') {
        need(10); y += 0.8;
        flow(b.title + (b.meta ? '  |  ' + b.meta : ''), M, maxW, 9.6, { style: 'bold', color: INK });
      } else if (b.type === 'bullet') {
        need(lh(9.3));
        font('normal', 9.3, INK); doc.text('•', M + 1.5, y + lh(9.3) * 0.75);
        flow(b.text, M + 5, maxW - 5, 9.3);
      } else flow(b.text, M, maxW, 9.3);
    }
    y += 2.5;
  }

  // footer on every page
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); font('normal', 7.5, MUTED);
    doc.text(`${r.name}  ·  Résumé${updated ? '  ·  Updated ' + updated : ''}`, M, H - 8);
    doc.text(`Page ${i} of ${n}`, R, H - 8, { align: 'right' });
  }
  return new Uint8Array(doc.output('arraybuffer'));
}
