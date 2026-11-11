// Prints cv-src/visual.html to public/cv/Tjorven_Florin_CV_Design.pdf with headless Chrome.
// Usage: node scripts/cv-pdf.mjs
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = resolve(root, 'public/cv/Tjorven_Florin_CV_Design.pdf');

execFileSync(chrome, [
  '--headless', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=5000',
  `--print-to-pdf=${out}`, `file://${resolve(root, 'cv-src/visual.html')}`,
], { stdio: 'inherit' });
console.log(`cv-pdf: wrote ${out}`);
