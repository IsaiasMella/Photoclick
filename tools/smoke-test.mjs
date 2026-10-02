// ==========================================================================
// smoke-test.mjs — Prueba rápida de TODA la interactividad del sitio nuevo.
//
// Abre el build y ejercita cada comportamiento: si algo falla, lo dice con
// el nombre del caso. Complementa a las capturas (que ven el diseño pero no
// si un clic funciona).
//
// Uso: node tools/smoke-test.mjs [base=http://localhost:5521/]
// ==========================================================================
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:5521/';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const results = [];
const errors = [];

async function test(name, path, fn, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${path}: ${m.text()}`));
  try {
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await fn(page);
    results.push(['OK ', name]);
  } catch (e) {
    results.push(['FALLA', `${name} → ${e.message.split('\n')[0]}`]);
  }
  await page.close();
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

await test('Preloader desaparece', '', async (p) => {
  await p.waitForTimeout(800);
  assert(!(await p.$('.preloader')), 'el .preloader sigue en el DOM');
});

await test('Slider del hero (fundido + autoplay)', 'index-slider/', async (p) => {
  const first = await p.$eval('.hero-image-slider .swiper', (el) => el.classList.contains('swiper-initialized'));
  assert(first, 'Swiper no se inicializó');
  const a = await p.$eval('.hero-image-slider .swiper-slide-active', (el) => el.getAttribute('data-swiper-slide-index'));
  await p.waitForTimeout(5500);
  const b = await p.$eval('.hero-image-slider .swiper-slide-active', (el) => el.getAttribute('data-swiper-slide-index'));
  assert(a !== b, 'el autoplay no avanzó');
});

await test('Slider de testimonios (se carga al acercarse)', '', async (p) => {
  assert(!(await p.$eval('.testimonial-slider .swiper', (el) => el.classList.contains('swiper-initialized'))), 'Swiper se cargó antes de hacer falta');
  await p.locator('.our-testimonials').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  assert(await p.$eval('.testimonial-slider .swiper', (el) => el.classList.contains('swiper-initialized')), 'no inicializado');
});

await test('Acordeón FAQ abre y cierra', 'faqs/', async (p) => {
  const btn = (await p.$$('.faq-accordion .accordion-button.collapsed'))[0];
  const target = await btn.getAttribute('data-bs-target');
  await btn.click();
  await p.waitForTimeout(600);
  assert(await p.$eval(target, (el) => el.classList.contains('show')), 'no se abrió');
  assert((await btn.getAttribute('aria-expanded')) === 'true', 'aria-expanded no cambió');
});

await test('IDs únicos en /faqs', 'faqs/', async (p) => {
  const dup = await p.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    return ids.filter((x, i) => ids.indexOf(x) !== i);
  });
  assert(!dup.length, 'ids repetidos: ' + dup.join(', '));
});

await test('Filtro de la galería de bodas', '', async (p) => {
  await p.locator('.our-wedding-gallery').scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  const visible = () => p.$$eval('.wedding-gallery-item-box', (els) => els.filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 && getComputedStyle(e).opacity !== '0').length);
  const all = await visible();
  await p.click('.our-wedding-gallery-nav a[data-filter=".haldi"]');
  await p.waitForTimeout(1200);
  const haldi = await visible();
  assert(haldi < all, `el filtro no ocultó nada (${all} → ${haldi})`);
  assert(await p.$eval('.our-wedding-gallery-nav a[data-filter=".haldi"]', (a) => a.classList.contains('active-btn')), 'falta .active-btn');
});

await test('Visor de fotos: abre, navega con flecha y cierra con Esc', 'image-gallery/', async (p) => {
  await p.click('.gallery-items a >> nth=0');
  await p.waitForSelector('.mfp-wrap', { timeout: 3000 });
  const src1 = await p.$eval('.mfp-img', (i) => i.getAttribute('src'));
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(500);
  const src2 = await p.$eval('.mfp-img', (i) => i.getAttribute('src'));
  assert(src1 !== src2, 'la flecha no cambió de foto');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(800);
  assert(!(await p.$('.mfp-wrap')), 'Esc no cerró');
});

await test('Popup de video (YouTube en iframe)', 'video-gallery/', async (p) => {
  await p.click('a.popup-video >> nth=0');
  await p.waitForSelector('.mfp-iframe', { timeout: 3000 });
  const src = await p.$eval('.mfp-iframe', (f) => f.getAttribute('src'));
  assert(/youtube/.test(src), 'el iframe no es de YouTube: ' + src);
});

await test('Formulario de contacto: valida campos vacíos', 'contact/', async (p) => {
  await p.click('#contactForm [type=submit]');
  await p.waitForTimeout(400);
  const msgs = await p.$$eval('#contactForm .help-block.with-errors', (els) => els.filter((e) => e.textContent.trim()).length);
  assert(msgs > 0, 'no aparecieron mensajes de error');
});

await test('Contador termina en su valor final', 'about/', async (p) => {
  const el = p.locator('.counter').first();
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(3600);
  const txt = (await el.textContent()).trim();
  assert(/\d/.test(txt), 'contador vacío: ' + txt);
});

await test('Menú de celular abre, submenú y Esc', 'about/', async (p) => {
  await p.click('.navbar-toggle .slicknav_btn');
  await p.waitForTimeout(400);
  assert(await p.$eval('#mobile-menu', (n) => getComputedStyle(n).display !== 'none'), 'no abrió');
  await p.click('#mobile-menu .slicknav_row >> nth=0');
  await p.waitForTimeout(400);
  assert(await p.$eval('#mobile-menu .slicknav_parent', (li) => li.classList.contains('slicknav_open')), 'submenú no abrió');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  assert(await p.$eval('#mobile-menu', (n) => getComputedStyle(n).display === 'none'), 'Esc no cerró');
}, { width: 390, height: 800 });

await test('Botón de tema cambia y persiste', '', async (p) => {
  await p.click('[data-theme-toggle]');
  assert((await p.evaluate(() => document.documentElement.dataset.theme)) === 'light', 'no pasó a claro');
  await p.reload();
  assert((await p.evaluate(() => document.documentElement.dataset.theme)) === 'light', 'no persistió tras recargar');
});

await test('Sin JS: nada queda oculto', 'about/', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(base + 'about/');
  const hidden = await p.$$eval('.wow', (els) => els.filter((e) => getComputedStyle(e).visibility === 'hidden').length);
  const pre = await p.$eval('.preloader', (e) => getComputedStyle(e).display).catch(() => 'none');
  await ctx.close();
  assert(hidden === 0, `${hidden} elementos .wow ocultos`);
  assert(pre === 'none', 'el preloader tapa la página sin JS');
});

await test('Paginación del blog', 'blog/', async (p) => {
  assert(await p.$('.page-pagination'), 'no hay bloque de paginación');
});

await browser.close();
for (const [s, n] of results) console.log(s, n);
if (errors.length) { console.log('\nErrores de consola:'); [...new Set(errors)].forEach((e) => console.log('  ', e)); }
process.exitCode = results.some(([s]) => s === 'FALLA') ? 1 : 0;
