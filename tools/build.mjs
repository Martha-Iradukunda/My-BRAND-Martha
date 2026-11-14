// Builds site/*.html from src/pages/* + src/partials/* (same menu and footer on every page) and copies the shared
// résumé formatter for the browser. Run: npm run build   (Netlify runs it too; the output is also kept in git.)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const part = (n) => readFileSync(join(root, 'src/partials', n), 'utf8');
const head = part('head.html'), nav = part('nav.html'), footer = part('footer.html');
const version = String(Date.now()).slice(-7);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let n = 0;
for (const f of readdirSync(join(root, 'src/pages')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(root, 'src/pages', f), 'utf8');
  const m = /^<!--(\{[\s\S]*?\})-->\s*/.exec(src);
  if (!m) throw new Error(`${f}: missing the settings comment at the top`);
  const meta = JSON.parse(m[1]);
  const body = src.slice(m[0].length);
  const h = head.replace(/{{title}}/g, esc(meta.title)).replace(/{{description}}/g, esc(meta.description || '')).replace(/{{version}}/g, version)
    .replace('</head>', (meta.noindex ? '  <meta name="robots" content="noindex">\n' : '') + '</head>');
  const navHtml = nav.replace(`data-nav="${meta.active}"`, `data-nav="${meta.active}" class="active" aria-current="page"`);
  const html = meta.layout === 'bare'
    ? `${h}<body data-page="${meta.page}">\n${body}</body>\n</html>\n`
    : `${h}<body data-page="${meta.page}">\n${navHtml}<main id="main">\n${body}</main>\n${footer}</body>\n</html>\n`;
  const out = join(root, 'site', meta.out || f);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  n++;
}
copyFileSync(join(root, 'lib/resume-format.mjs'), join(root, 'site/js/resume-format.js'));
console.log(`${n} pages built into site/`);
