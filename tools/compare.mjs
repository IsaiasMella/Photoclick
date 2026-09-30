// ==========================================================================
// compare.mjs — Capturas de página completa + comparación de píxeles.
//
// Uso:
//   node tools/compare.mjs --a <baseA> --b <baseB> --out <carpeta>
//        [--pages "about.html,blog.html=blog/"]   (A=B: ruta distinta en B)
//        [--widths 1440,390] [--theme light]
//
// Cada página se recorre con scroll (para disparar animaciones de aparición y
// lazy-load), se vuelve arriba, se espera y se captura con las animaciones CSS
// congeladas. Diferencia = % de píxeles distintos (pixelmatch, umbral 0.1)
// sobre el alto común. También reporta los dos altos: si difieren, hay un
// salto de diseño real (no ruido).
// ==========================================================================
import { chromium } from 'playwright';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1]]);
  return acc;
}, []));
const baseA = args.a, baseB = args.b, out = args.out || '.tmp/compare';
export const DEFAULT_PAGES = ['index.html', 'index-slider.html', 'about.html', 'services.html', 'service-single.html',
  'blog.html', 'blog-single.html', 'portfolio.html', 'portfolio-single.html', 'team.html', 'team-single.html',
  'testimonials.html', 'image-gallery.html', 'video-gallery.html', 'faqs.html', 'contact.html', '404.html', 'index-video.html'];
const pages = (args.pages ? args.pages.split(',') : DEFAULT_PAGES).map((p) => {
  const [a, b] = p.split('=');
  return { a, b: b ?? a };
});
const widths = (args.widths || '1440,390').split(',').map(Number);
const theme = args.theme || 'dark';
fs.mkdirSync(out, { recursive: true });

async function shoot(browser, url, width, file) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  if (theme === 'light') {
    await ctx.addInitScript(() => {
      try { localStorage.setItem('theme', 'light'); } catch {}
      document.documentElement.dataset.theme = 'light';
    });
  }
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  if (theme === 'light') await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(3500);
  // Estado final de las animaciones de aparición, igual en A y en B. WOW.js
  // (original) y reveal-on-scroll (nuevo) dejan ocultos los elementos que no
  // "vio" durante el scroll rápido; eso es ruido, no diferencia de diseño.
  await page.addStyleTag({ content: '.wow{visibility:visible!important;animation:none!important;opacity:1!important}' });
  // Elementos que NO existen en el original: el botón de tema (añadido, D1) y
  // la barra de desarrollo de Astro (solo en `astro dev`).
  await page.addStyleTag({ content: '.theme-toggle,astro-dev-toolbar{display:none!important}' });
  await page.waitForTimeout(300);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  await ctx.close();
  return height;
}

function diff(a, b, outFile) {
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
  const crop = (img) => { const p = new PNG({ width: w, height: h }); PNG.bitblt(img, p, 0, 0, w, h, 0, 0); return p; };
  const a2 = crop(A), b2 = crop(B), d = new PNG({ width: w, height: h });
  const n = pixelmatch(a2.data, b2.data, d.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(outFile, PNG.sync.write(d));
  return { pct: Number((100 * n / (w * h)).toFixed(3)), ha: A.height, hb: B.height };
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined }) // PW_CHROMIUM_PATH: Chromium ya instalado (entornos sin descarga);
const rows = [];
const jobs = pages.flatMap((p) => widths.map((w) => ({ p, w })));
// 3 comparaciones en paralelo: más rápido sin saturar la máquina.
async function worker() {
  while (jobs.length) {
    const { p, w } = jobs.shift();
    const tag = `${p.a.replace(/\W+/g, '_')}_${w}_${theme}`;
    const fa = `${out}/${tag}_A.png`, fb = `${out}/${tag}_B.png`;
    await shoot(browser, baseA + p.a, w, fa);
    await shoot(browser, baseB + p.b, w, fb);
    const r = diff(fa, fb, `${out}/${tag}_diff.png`);
    rows.push({ page: p.a, width: w, theme, ...r });
    console.log(`${p.a.padEnd(22)} ${String(w).padStart(4)}px ${theme}  alto A=${r.ha} B=${r.hb}${r.ha !== r.hb ? ' ⚠' : ''}  diff=${r.pct}%`);
  }
}
await Promise.all([worker(), worker(), worker()]);
await browser.close();
rows.sort((x, y) => x.page.localeCompare(y.page) || x.width - y.width);
fs.writeFileSync(`${out}/results-${theme}.json`, JSON.stringify(rows, null, 2));
