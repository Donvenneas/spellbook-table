// Contrast of every skin's text on its panels (design items 467-469). No packages: the stylesheets are read as text.
// For each skin (and its light version where it has one) the tokens are read from public/css/skins.css, with the
// Grimoire tokens from public/css/style.css underneath, and each pair below must reach WCAG AA for normal text
// (4.5:1). Panels carry a texture under a dark (or light) wash, so the panel's flat token stands for the ground.
// Brass Meridian's life plate (dark ink on brass) is checked against the plate's darkest band.
//
// Run: node tests/skins-contrast.mjs            (prints the table, fails below 4.5:1)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'css');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const style = strip(readFileSync(join(pub, 'style.css'), 'utf8')), skins = strip(readFileSync(join(pub, 'skins.css'), 'utf8'));

// the declarations of a block whose selector is exactly `sel`
function block(css, sel) {
  const at = css.indexOf(sel + ' {');
  if (at < 0) return {};
  const body = css.slice(at + sel.length + 2, css.indexOf('\n}', at));
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const hex = v => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v || '');
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const grimoire = block(style, ':root');
const looks = [
  ['Nightspire', ':root[data-skin="nightspire"]'], ['Nightspire light', ':root[data-skin="nightspire"][data-theme="light"]', ':root[data-skin="nightspire"]'],
  ['Highkeep', ':root[data-skin="highkeep"]'], ['Highkeep light', ':root[data-skin="highkeep"][data-theme="light"]', ':root[data-skin="highkeep"]'],
  ['Brass Meridian', ':root[data-skin="brass"]'], ['Brass Meridian light', ':root[data-skin="brass"][data-theme="light"]', ':root[data-skin="brass"]'],
  ['Vellum night', ':root[data-skin="vellum"]'], ['Plain', ':root[data-skin="plain"]'],
];
const PAIRS = [['--text', '--panel'], ['--muted', '--panel'], ['--gold-hi', '--panel'], ['--text', '--panel-2'], ['--muted', '--panel-2'], ['--muted', '--bg'], ['--gold-hi', '--bg'], ['--accent', '--panel']];
let failed = 0;
const rows = [];
for (const [name, sel, under] of looks) {
  const t = { ...grimoire, ...(under ? block(skins, under) : {}), ...block(skins, sel) };
  for (const [fg, bg] of PAIRS) {
    const a = hex(t[fg]), b = hex(t[bg]);
    if (!a || !b) { rows.push([name, `${fg} on ${bg}`, 'not a plain color', '']); continue; }
    const r = ratio(a, b), ok = r >= 4.5;
    if (!ok) failed++;
    rows.push([name, `${fg} on ${bg}`, r.toFixed(2), ok ? 'ok' : 'FAIL']);
  }
}
// Brass Meridian's life plate (bm-lifeplate.svg): ink and low life on its darkest band, the LIFE label on its lightest
for (const [what, a, b] of [['life ink on the plate', '#241706', '#c9a45e'], ['low life on the plate', '#6e1208', '#c9a45e'], ['life label on the plate', '#5a3d14', '#f8e6b0']]) {
  const r = ratio(hex(a), hex(b)), ok = r >= 4.5;
  if (!ok) failed++;
  rows.push(['Brass Meridian', what, r.toFixed(2), ok ? 'ok' : 'FAIL']);
}
for (const r of rows) console.log(`  ${r[3].padEnd(4)} ${r[0].padEnd(22)} ${r[1].padEnd(22)} ${r[2]}`);
if (failed) { console.log(`Skin contrast: ${failed} pair(s) under 4.5:1.`); process.exit(1); }
console.log(`Skin contrast: all ${rows.length} pairs reach 4.5:1.`);
