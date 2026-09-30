// ==========================================================================
// extract-content.mjs — Extrae el contenido repetible del HTML original
// (referencia/) a Content Collections (src/content/).
//
// Por qué un script y no copiar a mano: son cientos de textos; transcribirlos
// introduce errores. Leyendo el DOM real con Playwright el contenido queda
// idéntico al original, letra por letra.
//
// Uso (con `npm run ref` corriendo en :5510):  node tools/extract-content.mjs
// Solo se corre una vez para migrar. Después, el contenido se edita en
// src/content/ como en cualquier sitio.
// ==========================================================================
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5510/';
const root = path.resolve(import.meta.dirname, '..');
const content = path.join(root, 'src', 'content');

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// images/foo.jpg (original) → ruta relativa desde el archivo de contenido.
const img = (src, fromDir) => src && path.relative(fromDir, path.join(root, 'src', 'assets', src.replace(/^images\//, 'images/'))).replaceAll('\\', '/');
const yaml = (obj) => Object.entries(obj).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : JSON.stringify(v)}`).join('\n');

function writeMd(collection, slug, data, body = '') {
  const dir = path.join(content, collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.md`), `---\n${yaml(data)}\n---\n${body}`);
}
function writeJson(name, items) {
  fs.mkdirSync(content, { recursive: true });
  fs.writeFileSync(path.join(content, `${name}.json`), JSON.stringify(items, null, 2) + '\n');
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined }) // PW_CHROMIUM_PATH: Chromium ya instalado (entornos sin descarga);
const page = await browser.newPage();
async function grab(file, fn) {
  await page.goto(BASE + file, { waitUntil: 'domcontentloaded' });
  return page.evaluate(fn);
}

// ---- Servicios (listado de /services) --------------------------------------
const services = await grab('services.html', () => [...document.querySelectorAll('.service-item')].map((e) => ({
  title: e.querySelector('h2').textContent.trim(),
  summary: e.querySelector('.service-item-content p').textContent.trim(),
  icon: e.querySelector('.icon-box img').getAttribute('src'),
  image: e.querySelector('.service-item-image img').getAttribute('src'),
})));
services.forEach((s, i) => {
  const dir = path.join(content, 'services');
  writeMd('services', slugify(s.title), { title: s.title, summary: s.summary, icon: img(s.icon, dir), image: img(s.image, dir), order: i + 1 });
});

// ---- Portfolio ------------------------------------------------------------
const portfolio = await grab('portfolio.html', () => [...document.querySelectorAll('.portfolio-item')].map((e) => ({
  title: e.querySelector('h2').textContent.trim(),
  category: e.querySelector('.portfolio-item-content ul li').textContent.trim(),
  image: e.querySelector('img').getAttribute('src'),
})));
portfolio.forEach((p, i) => {
  const dir = path.join(content, 'portfolio');
  writeMd('portfolio', slugify(p.title), { title: p.title, category: p.category, image: img(p.image, dir), order: i + 1 });
});

// ---- Posts ----------------------------------------------------------------
const posts = await grab('blog.html', () => [...document.querySelectorAll('.post-item')].map((e) => ({
  title: e.querySelector('h2').textContent.trim(),
  image: e.querySelector('img').getAttribute('src'),
})));
// El original no tiene fechas por post (la página de detalle muestra una fija).
// Se asignan fechas descendentes para que el orden del listado sea el mismo.
posts.forEach((p, i) => {
  const dir = path.join(content, 'posts');
  const d = new Date(Date.UTC(2026, 0, 15 - i * 2)).toISOString().slice(0, 10);
  writeMd('posts', slugify(p.title), { title: p.title, image: img(p.image, dir), pubDate: d, author: 'Admin', tags: ['Wedding', 'Photography'] });
});

// ---- Equipo ---------------------------------------------------------------
const team = await grab('team.html', () => [...document.querySelectorAll('.team-item')].map((e) => ({
  name: e.querySelector('h2').textContent.trim(),
  role: e.querySelector('.team-item-content p').textContent.trim(),
  image: e.querySelector('img').getAttribute('src'),
})));
team.forEach((t, i) => {
  const dir = path.join(content, 'team');
  writeMd('team', slugify(t.name), { name: t.name, role: t.role, image: img(t.image, dir), order: i + 1 });
});

// ---- Testimonios ----------------------------------------------------------
const testimonials = await grab('testimonials.html', () => [...document.querySelectorAll('.testimonial-item')].map((e) => ({
  name: e.querySelector('.testimonial-item-author-content h2').textContent.trim(),
  role: e.querySelector('.testimonial-item-author-content p').textContent.trim(),
  quote: e.querySelector('.testimonial-item-content p').textContent.trim(),
  avatar: e.querySelector('.testimonial-item-author-image img').getAttribute('src'),
  rating: e.querySelectorAll('.testimonial-item-rating i').length,
})));
writeJson('testimonials', testimonials.map((t, i) => ({ id: slugify(t.name), ...t, avatar: img(t.avatar, content), order: i + 1 })));

// ---- FAQs (página /faqs: 5 grupos; la home usa los 4 primeros del grupo 1) --
const faqs = await grab('faqs.html', () => [...document.querySelectorAll('.page-faq-accordion')].flatMap((g, gi) => {
  const title = g.querySelector('.section-title h2');
  const group = title.childNodes[0].textContent.trim();
  const groupAccent = title.querySelector('span')?.textContent.trim() ?? '';
  return [...g.querySelectorAll('.accordion-item')].map((e, i) => ({
    group, groupAccent, groupOrder: gi + 1, order: i + 1,
    question: e.querySelector('.accordion-button').textContent.trim().replace(/^\d+\.\s*/, ''),
    answer: e.querySelector('.accordion-body p').textContent.trim(),
  }));
}));
const homeFaqs = await grab('index.html', () => [...document.querySelectorAll('.faq-accordion .accordion-item')].map((e) => ({
  question: e.querySelector('.accordion-button').textContent.trim().replace(/^\d+\.\s*/, ''),
  answer: e.querySelector('.accordion-body p').textContent.trim(),
})));
writeJson('faqs', faqs.map((f) => ({
  id: `${slugify(f.group)}-${f.order}`, ...f,
  featured: homeFaqs.some((h) => h.question === f.question && h.answer === f.answer),
})));
const missing = homeFaqs.filter((h) => !faqs.some((f) => f.question === h.question && f.answer === h.answer));
if (missing.length) console.warn('FAQs de la home que no están en /faqs:', missing);

// ---- Galería de bodas (home, filtrable) + galería de imágenes ------------------
const wedding = await grab('index.html', () => [...document.querySelectorAll('.wedding-gallery-item-box')].map((e) => ({
  filters: [...e.classList].filter((c) => !/^col-|wedding-gallery-item-box/.test(c)),
  image: e.querySelector('img').getAttribute('src'),
  category: e.querySelector('.gallery-item-content ul li')?.textContent.trim(),
  title: e.querySelector('.gallery-item-content h3')?.textContent.trim(),
})));
const photos = await grab('image-gallery.html', () => [...document.querySelectorAll('.photo-gallery img')].map((i) => i.getAttribute('src')));
writeJson('gallery', [
  ...wedding.map((w, i) => ({ id: `wedding-${i + 1}`, ...w, image: img(w.image, content), album: 'wedding', order: i + 1 })),
  ...photos.map((src, i) => ({ id: `photo-${i + 1}`, image: img(src, content), album: 'photos', order: i + 1 })),
]);

// ---- Videos ---------------------------------------------------------------
const videos = await grab('video-gallery.html', () => [...document.querySelectorAll('.video-gallery-image a')].map((a) => ({
  url: a.getAttribute('href'), thumbnail: a.querySelector('img').getAttribute('src'),
})));
writeJson('videos', videos.map((v, i) => ({ id: `video-${i + 1}`, ...v, thumbnail: img(v.thumbnail, content), order: i + 1 })));

// ---- Paquetes -------------------------------------------------------------
const packages = await grab('index.html', () => [...document.querySelectorAll('.our-package-item')].map((e) => {
  const t = e.querySelector('.our-package-item-title');
  return { title: t.querySelector('h3').textContent.trim(), price: t.lastElementChild.textContent.trim(), description: e.querySelector('p').textContent.trim() };
}));
writeJson('packages', packages.map((p, i) => ({ id: slugify(p.title), ...p, order: i + 1 })));

await browser.close();
console.log({ services: services.length, portfolio: portfolio.length, posts: posts.length, team: team.length,
  testimonials: testimonials.length, faqs: faqs.length, gallery: wedding.length + photos.length, videos: videos.length, packages: packages.length });
