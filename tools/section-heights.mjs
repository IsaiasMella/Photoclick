// ==========================================================================
// section-heights.mjs — Alto de cada sección de primer nivel, A contra B.
//
// Cuando compare.mjs marca una página con distinta altura, esto dice QUÉ
// sección creció o se achicó (y cuántos px), sin mirar capturas.
// JS desactivado: mide el layout que sale del HTML + CSS.
//
// Uso: node tools/section-heights.mjs <urlA> <urlB> [ancho=1440]
// ==========================================================================
import { chromium } from 'playwright';

const [urlA, urlB, w = '1440'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });

async function measure(url) {
  const ctx = await browser.newContext({ viewport: { width: Number(w), height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    // Secciones = hijos de <body> (original) o de <main> (nuevo) + header/footer.
    const roots = [...document.body.children].flatMap((el) => (el.tagName === 'MAIN' ? [...el.children] : [el]));
    return roots
      .filter((el) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'A', 'BUTTON'].includes(el.tagName) && !el.classList.contains('preloader'))
      .map((el) => ({ name: (el.className || el.tagName).toString().split(' ')[0], h: Math.round(el.getBoundingClientRect().height * 10) / 10 }));
  });
  await ctx.close();
  return r;
}

const [A, B] = await Promise.all([measure(urlA), measure(urlB)]);
const n = Math.max(A.length, B.length);
for (let i = 0; i < n; i++) {
  const a = A[i], b = B[i];
  const d = a && b ? Math.round((b.h - a.h) * 10) / 10 : NaN;
  console.log(`${(a?.name ?? '-').padEnd(26)} ${String(a?.h ?? '-').padStart(8)}  ${(b?.name ?? '-').padEnd(26)} ${String(b?.h ?? '-').padStart(8)}  ${d ? (d > 0 ? '+' : '') + d + ' ⚠' : ''}`);
}
await browser.close();
