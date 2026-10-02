# Arquitectura

Guía para alguien que viene de **React / Next.js**. Lo esencial de Astro en una frase: **cada página se genera como HTML estático al compilar**. Los componentes `.astro` se parecen a Server Components de React que nunca llegan al navegador. El JavaScript del cliente se agrega a mano, solo donde hace falta.

## Mapa de carpetas

```
astro.config.mjs        Configuración: sitio, fuentes propias, sitemap, Sass, build
src/
  content.config.ts     Esquemas zod de las Content Collections (≈ tipos + validación del CMS)
  content/              EL CONTENIDO: .md (con página propia) y .json (sin página propia)
    services/ portfolio/ posts/ team/      → un .md por entrada; el cuerpo es el texto del detalle
    testimonials.json faqs.json gallery.json videos.json packages.json
  data/site.ts          Datos globales: rutas, menú, contacto, redes, horarios, opciones
  layouts/BaseLayout.astro   El <html> de todas las páginas (≈ app/layout.tsx)
  pages/                RUTEO POR ARCHIVOS (≈ app/ de Next)
    index.astro index-slider.astro index-video.astro      las 3 home
    about.astro testimonials.astro faqs.astro contact.astro 404.astro
    image-gallery.astro video-gallery.astro
    services/ portfolio/ team/   index.astro (listado) + [slug].astro (detalle)
    blog/[...page].astro (listado paginado) + blog/[slug].astro (detalle)
  components/
    global/    Header, Footer, PageHeader, Preloader, Seo, Icon, ThemeScript,
               ThemeToggle, PreloadBackground   (en todas las páginas)
    sections/  Bloques grandes de página: Hero, AboutUs, OurServices, WhyChooseUs,
               IntroVideo, OurPortfolio, OurPackages, WeddingGallery, OurFaqs,
               Testimonials, CtaBox, OurBlog, OurTeam, TrustedByList
    cards/     Una tarjeta = un ítem de colección: ServiceItem, PostItem, PortfolioItem,
               TeamItem, TestimonialItem, FaqAccordion
    detail/    Piezas de las páginas de detalle: sidebars, FAQs del detalle, format.ts
    ui/        Piezas de páginas fijas: ContactForm, Pagination, OurApproach, WhatWeDo…
  lib/         Utilidades de servidor (se ejecutan al compilar): fondos optimizados, delays
  scripts/     JavaScript DEL NAVEGADOR (TypeScript, sin jQuery)
    global.ts            punto de entrada: lo importa BaseLayout una sola vez
    load-when-near.ts    descarga cada comportamiento cuando su sección se acerca
    motion.ts            tiempos, curvas y breakpoints para JS (espejo de tokens.css)
    mobile-menu cursor parallax reveal-on-scroll text-animations smooth-scroll   (globales)
    sliders lightbox gallery-filter counters accordion contact-form lazy-video   (por sección)
  styles/      TODO el CSS (ver "Estilos")
  assets/      Imágenes y fuentes que pasan por el optimizador (import desde el código)
public/        Se copia tal cual: favicon, videos .mp4
tools/         Verificación: compare, computed-styles, section-diff, section-heights,
               diff-regions, smoke-test, css-swap-test, extract-content, lh-summary
referencia/    La demo original (solo para comparar; no se publica)
docs/          Esta documentación
```

## Equivalencias con React/Next

| Astro (acá) | Next.js |
|---|---|
| `src/pages/about.astro` | `app/about/page.tsx` |
| `src/pages/services/[slug].astro` + `getStaticPaths()` | `app/services/[slug]/page.tsx` + `generateStaticParams()` |
| `src/pages/blog/[...page].astro` + `paginate()` | `app/blog/page/[n]/page.tsx`, armado a mano |
| `src/layouts/BaseLayout.astro` | `app/layout.tsx` |
| Frontmatter `---` (código arriba del HTML) | El cuerpo de un Server Component (`async function Page() {…}`) |
| `Astro.props` | `props` |
| `<slot />` / `<slot name="x" />` | `children` / props de tipo ReactNode |
| `getCollection('posts')` | Leer archivos MDX + validar con zod (lo que hacía contentlayer) |
| `<Image />` de `astro:assets` | `next/image` |
| `fonts` en `astro.config.mjs` + `<Font />` | `next/font` |
| `Seo.astro` | `export const metadata` / `generateMetadata` |
| `@astrojs/sitemap` | `app/sitemap.ts` |
| `src/scripts/*.ts` importados por `global.ts` | Componentes `"use client"` con `useEffect`, pero **sin hidratar React**: JS plano sobre HTML ya renderizado |
| `import()` dentro de `loadWhenNear()` | `next/dynamic` disparado al entrar en pantalla |

## Cómo fluye el contenido hasta la página

```
src/content/services/pre-wedding-photography.md
   │  frontmatter: title, summary, icon, image, order  (+ cuerpo Markdown)
   ▼
src/content.config.ts   ← zod valida al compilar; image() convierte la ruta en un ImageMetadata
   ▼
getCollection('services')   en la página o la sección (tipado: CollectionEntry<'services'>)
   ▼
sections/OurServices.astro  ordena por `order`, corta con `limit`
   ▼
cards/ServiceItem.astro     marcado del original + <Image> optimizada + delay(i)
   ▼
HTML estático en dist/     (las imágenes salen en AVIF/WebP con width/height)
```

Las páginas de detalle hacen lo mismo con `getStaticPaths()`: una ruta por entrada, y el cuerpo Markdown se renderiza con `render(entry)` → `<Content />`.

## Estilos

- **Un solo punto de entrada del CSS del autor:** `src/styles/index.css`. Importa `tokens.css`, `fonts.css` y los 36 archivos de `components/` **en el orden de la cascada original** (las secciones 02 → 31 de `custom.css`).
- Antes de eso, `BaseLayout.astro` importa Bootstrap (subconjunto, `vendor/bootstrap.scss`) y el CSS de plugins, **en el mismo orden que los `<link>` del original**.
- **No se usan los `<style>` con alcance de Astro.** Agregan `[data-astro-cid-…]` a los selectores, suben la especificidad y cambiarían qué regla gana respecto del original. En Next, equivale a elegir `globals.css` y no CSS Modules, y por el mismo motivo.
- Cada `@media` vive al final del archivo de su componente. La única regla que tuvo que quedar en otro archivo para no perder la cascada lleva un comentario `Cascada:` (`why-choose-us.css`).

## JavaScript

- **Un solo módulo de entrada:** `src/scripts/global.ts`. Astro lo empaqueta como `type="module"` (diferido: no bloquea el render).
- Lo que hay en todas las páginas se ejecuta de inmediato: la aparición al scroll, el parallax, el cursor y el scroll suave. Las animaciones de texto (GSAP) se descargan después de `load`.
- Lo que depende de una sección se descarga **solo si la sección existe y se acerca a la pantalla** (`loadWhenNear`).
- **Ningún componente de sección o tarjeta tiene `<script>` propio.** Solo los globales (`Header`, `Preloader`, `ThemeToggle`), que quedan directo dentro de `<body>`. Astro inserta el script donde está el componente, y dentro de un contenedor rompe selectores del autor como `:last-child`. Pasó, y lo detectó la comparación: ver `ERRORES-COMUNES.md` §8.
- Todo funciona sin JS: los elementos animados no se ocultan, el preloader no aparece, el menú de celular abre con `:target` y los enlaces de video llevan a YouTube.

## En qué orden leer el código

1. `docs/PLAN.md` (el porqué) y este archivo (el qué).
2. `src/styles/tokens.css`: el sistema de diseño en un archivo.
3. `src/layouts/BaseLayout.astro`: cómo se arma cada página (orden del `<head>` y de los estilos).
4. `src/data/site.ts` y `src/content.config.ts`: de dónde salen los datos.
5. `src/pages/index.astro`: una página es solo una lista de secciones.
6. `src/components/sections/OurServices.astro` → `cards/ServiceItem.astro`: el patrón sección → tarjeta → colección.
7. `src/pages/services/[slug].astro`: rutas dinámicas y Markdown.
8. `src/scripts/global.ts` → `load-when-near.ts` → algún comportamiento (`sliders.ts`).
9. `src/styles/index.css` → `components/services.css`: cómo se organiza el CSS del autor.
10. `docs/ERRORES-COMUNES.md`: las trampas que este código evita.

## Comandos

```bash
npm run dev        # desarrollo en http://localhost:5520
npm run build      # astro check + build estático en dist/
npm run preview    # sirve dist/ en http://localhost:5521
npm run ref        # sirve el original (referencia/) en http://localhost:5510
node tools/smoke-test.mjs                # prueba toda la interactividad
node tools/compare.mjs --a http://localhost:5510/ --b http://localhost:5521/ --out .tmp/x --pages "about.html=about/"
```
