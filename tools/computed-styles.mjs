// ==========================================================================
// computed-styles.mjs — Compara los estilos COMPUTADOS de dos versiones de un
// mismo HTML, elemento por elemento (incluye ::before y ::after).
//
// Por qué además de las capturas: las capturas tienen "ruido" (sliders,
// animaciones). Esta prueba corre con JavaScript DESACTIVADO, así el DOM es
// idéntico en ambos lados y cualquier diferencia es 100 % culpa del CSS
// (por ejemplo, una regla que cambió de ganador al reordenar la cascada).
//
// Uso: node tools/computed-styles.mjs <baseA> <baseB> [paginas,coma] [anchos,coma]
//   ej: node tools/computed-styles.mjs http://localhost:5510/ http://localhost:5511/
// ==========================================================================
import { chromium } from 'playwright';
import fs from 'node:fs';

const [baseA, baseB, pagesArg, widthsArg] = process.argv.slice(2);
const ALL = ['index.html', 'index-slider.html', 'index-video.html', 'about.html', 'services.html', 'service-single.html',
  'blog.html', 'blog-single.html', 'portfolio.html', 'portfolio-single.html', 'team.html', 'team-single.html',
  'testimonials.html', 'image-gallery.html', 'video-gallery.html', 'faqs.html', 'contact.html', '404.html'];
const pages = pagesArg ? pagesArg.split(',') : ALL;
const widths = (widthsArg || '1440,1024,991,767,390').split(',').map(Number);

// Propiedades que no dependen del CSS del autor o que varían solas.
const IGNORE = /^(--|-webkit-locale|transition-behavior|view-transition|anchor|position-anchor|inset-area)/;

async function snapshot(browser, url, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  // Sin JS la fuente web igual carga; se espera a que esté lista para que los
  // anchos de texto sean comparables.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const data = await page.evaluate((ignoreSrc) => {
    const ignore = new RegExp(ignoreSrc);
    const out = [];
    const els = document.body.querySelectorAll('*');
    const path = (el) => {
      const parts = [];
      for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
        parts.unshift(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''));
      }
      return parts.join(' > ');
    };
    els.forEach((el, i) => {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && cs.content === 'none') continue;
        const obj = {};
        for (let k = 0; k < cs.length; k++) {
          const p = cs[k];
          if (ignore.test(p)) continue;
          // Las URLs se comparan sin el origen (cada versión corre en otro puerto).
          let v = cs.getPropertyValue(p).replace(/url\("https?:\/\/[^/]+/g, 'url("');
          // Elementos con animación CSS en curso (p. ej. el anillo del preloader):
          // su transform depende del instante de la captura.
          if ((p === 'transform') && cs.animationName !== 'none') v = '(animado)';
          obj[p] = v;
        }
        out.push({ i, pseudo, path: path(el), s: obj });
      }
    });
    return out;
  }, IGNORE.source);
  await ctx.close();
  return data;
}

const browser = await chromium.launch();
const report = [];
let total = 0;
for (const p of pages) {
  for (const w of widths) {
    const [A, B] = await Promise.all([snapshot(browser, baseA + p, w), snapshot(browser, baseB + p, w)]);
    const mapB = new Map(B.map((x) => [x.i + (x.pseudo || ''), x]));
    const diffs = [];
    for (const a of A) {
      const b = mapB.get(a.i + (a.pseudo || ''));
      if (!b) { diffs.push({ path: a.path, pseudo: a.pseudo, prop: '(pseudo ausente en B)' }); continue; }
      for (const [k, v] of Object.entries(a.s)) {
        if (b.s[k] !== v) diffs.push({ path: a.path, pseudo: a.pseudo, prop: k, a: v, b: b.s[k] });
      }
    }
    total += diffs.length;
    report.push({ page: p, width: w, elements: A.length, diffs });
    console.log(`${p.padEnd(22)} ${String(w).padStart(4)}px  elementos=${A.length}  diferencias=${diffs.length}`);
    for (const d of diffs.slice(0, 8)) console.log(`   · ${d.path}${d.pseudo || ''} | ${d.prop}: ${d.a} → ${d.b}`);
  }
}
await browser.close();
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync('.tmp/computed-styles-report.json', JSON.stringify(report, null, 1));
console.log(`\nTOTAL diferencias: ${total}  (detalle en .tmp/computed-styles-report.json)`);
