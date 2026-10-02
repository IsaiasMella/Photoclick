// ==========================================================================
// diff-regions.mjs — ¿DÓNDE está la diferencia? Lee el *_diff.png de
// compare.mjs y lista las franjas verticales (cada 100 px) con más píxeles
// distintos. Opcional: arma un recorte A|B lado a lado de la peor franja.
//
// Uso: node tools/diff-regions.mjs <prefijo> [--crop salida.png]
//   prefijo = .tmp/f4-dark/about_html_1440_dark   (sin _A/_B/_diff.png)
// ==========================================================================
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [prefix, flag, cropOut] = process.argv.slice(2);
const d = PNG.sync.read(fs.readFileSync(`${prefix}_diff.png`));
const bands = new Map();
for (let y = 0; y < d.height; y++) {
  let c = 0;
  for (let x = 0; x < d.width; x++) {
    const i = (y * d.width + x) * 4;
    if (d.data[i] > 200 && d.data[i + 1] < 80) c++; // pixelmatch pinta en rojo lo distinto
  }
  if (c) bands.set(Math.floor(y / 100) * 100, (bands.get(Math.floor(y / 100) * 100) || 0) + c);
}
const top = [...bands].sort((a, b) => b[1] - a[1]).slice(0, 8);
for (const [y, c] of top) console.log(`y=${String(y).padStart(5)}–${y + 100}  ${(100 * c / (100 * d.width)).toFixed(1)} % de la franja`);
if (flag === '--crop' && top.length) {
  const A = PNG.sync.read(fs.readFileSync(`${prefix}_A.png`)), B = PNG.sync.read(fs.readFileSync(`${prefix}_B.png`));
  const y0 = Math.max(0, top[0][0] - 150), h = Math.min(500, A.height - y0, B.height - y0);
  const o = new PNG({ width: A.width * 2, height: h });
  PNG.bitblt(A, o, 0, y0, A.width, h, 0, 0); PNG.bitblt(B, o, 0, y0, B.width, h, A.width, 0);
  fs.writeFileSync(cropOut, PNG.sync.write(o));
}
