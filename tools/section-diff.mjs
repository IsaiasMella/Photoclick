// ==========================================================================
// section-diff.mjs — Diferencias de MARCADO de una sección entre dos URLs.
//
// Sirve para (a) ver si una sección compartida cambia de una página a otra
// del original (→ qué props necesita el componente) y (b) comparar la versión
// nueva contra la original línea por línea.
// Corre con JS desactivado: compara el HTML tal cual sale del servidor.
//
// Uso: node tools/section-diff.mjs <selector> <urlA> <urlB>
//   ej: node tools/section-diff.mjs .about-us http://localhost:5510/index.html http://localhost:5520/
// ==========================================================================
import { chromium } from 'playwright';

const [selector, urlA, urlB] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();

async function lines(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return [`(no existe ${sel})`];
    return el.outerHTML
      .replace(/<!--.*?-->/gs, '')
      .replace(/\s(data-astro-[\w-]+|data-image-component)(="[^"]*")?/g, '') // atributos internos de Astro
      .replace(/\s+/g, ' ')
      .replace(/> </g, '>\n<')
      .split('\n');
  }, selector);
}

const A = await lines(urlA), B = await lines(urlB);
const setA = new Set(A), setB = new Set(B);
const onlyA = A.filter((x) => !setB.has(x)), onlyB = B.filter((x) => !setA.has(x));
console.log(`${selector}: ${A.length} vs ${B.length} líneas · distintas: ${onlyA.length} / ${onlyB.length}`);
console.log(`--- solo en A (${urlA})`); onlyA.forEach((x) => console.log('   ', x.slice(0, 220)));
console.log(`--- solo en B (${urlB})`); onlyB.forEach((x) => console.log('   ', x.slice(0, 220)));
await browser.close();
