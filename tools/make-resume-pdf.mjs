// Writes assets/MarthaRekeraho_Resume.pdf from lib/resume-default.mjs (the copy served until a résumé is published from the dashboard).
import { writeFileSync } from 'node:fs';
import resume from '../lib/resume-default.mjs';
import { resumePdf } from '../lib/resume-pdf.mjs';
const updated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const bytes = resumePdf(resume, { updated });
writeFileSync(new URL('../site/assets/MarthaRekeraho_Resume.pdf', import.meta.url), bytes);
console.log('site/assets/MarthaRekeraho_Resume.pdf', Math.round(bytes.length / 1024), 'KB');
