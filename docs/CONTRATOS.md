# Contratos entre subagentes (Fase 3)

Este archivo es la **fuente de verdad** para trabajar en paralelo. Si un contrato no alcanza, **no lo cambies**: anotalo en tu resumen final y seguí con una solución local.

## 0. Entorno compartido (ya funcionando)

| Qué | Dónde |
|---|---|
| Original servido | `http://localhost:5510/<archivo>.html` (`npm run ref` si se cae) |
| Sitio nuevo (dev, con HMR) | `http://localhost:5520/` (`npx astro dev --port 5520` en segundo plano si se cae). **No lo mates, lo comparten todos.** |
| Capturas + píxeles | `node tools/compare.mjs --a http://localhost:5510/ --b http://localhost:5520/ --out .tmp/<tu-agente> --pages "about.html=about/"` |
| Diff de marcado de una sección | `node tools/section-diff.mjs .about-us http://localhost:5510/index.html http://localhost:5520/` |
| Estilos computados | `node tools/computed-styles.mjs http://localhost:5510/ http://localhost:5520/ <pag-orig> <anchos>` (solo sirve si las rutas coinciden; si no, usá compare.mjs) |
| Chequeo de tipos | `npx astro check` (0 errores, 0 advertencias) |

**Mapa de rutas** (original → nuevo):

| Original | Nuevo |
|---|---|
| index.html / index-slider.html / index-video.html | `/` · `/index-slider/` · `/index-video/` |
| about.html · services.html · blog.html · portfolio.html · team.html | `/about/` · `/services/` · `/blog/` · `/portfolio/` · `/team/` |
| service-single.html | `/services/pre-wedding-photography/` |
| blog-single.html | `/blog/how-to-pose-naturally-for-your-wedding-photos/` |
| portfolio-single.html | `/portfolio/achieve-fitness-goal-natural/` |
| team-single.html | `/team/elena-rossi/` |
| testimonials.html · image-gallery.html · video-gallery.html · faqs.html · contact.html · 404.html | `/testimonials/` · `/image-gallery/` · `/video-gallery/` · `/faqs/` · `/contact/` · `/404/` |

## 1. Reglas para todos

1. **Mismo marcado y mismas clases que el original.** Copiá la estructura de `referencia/*.html` (sin los comentarios `<!-- X Start -->`). No renombres clases ni agregues wrappers: el CSS ya está terminado y verificado (Fase 2) y depende de esa estructura.
2. **No toques CSS** salvo lo que se indica en tu sección. Si algo se ve distinto, casi siempre es el marcado.
3. **Imágenes:** siempre con `import { Image } from 'astro:assets'` y un `src` importado (`import foto from '@/assets/images/x.jpg'`) o el campo `image()` de la colección. Nunca `<img src="/...">` suelto. Para fotos grandes pasá `widths` + `sizes` realistas según la columna de Bootstrap (ej.: `widths={[400, 800, 1200]} sizes="(max-width: 767px) 100vw, 33vw"`). La primera imagen visible (hero) va con `loading="eager"` y `fetchpriority="high"`; el resto, lazy (el default).
   - `alt`: descriptivo en fotos de contenido (el original tenía `alt=""` en todo). `alt=""` solo en imágenes decorativas (íconos al lado de un texto que ya lo dice, fondos, comillas).
   - SVG decorativos también con `<Image>` (Astro los pasa tal cual y agrega width/height).
4. **Íconos Font Awesome:** `import Icon from '@/components/global/Icon.astro'` → `<Icon name="solid:star" class="fa" />` (genera el mismo `<i class="fa fa-solid fa-star">`). Si necesitás un ícono que no está en `Icon.astro`, anotalo en el resumen y usá el más parecido.
5. **Delays de animación:** el original usa `data-wow-delay` = `0.2s × índice` en los listados (`0` sin atributo, `0.2s`, `0.4s`…). Reproducilo con `delay(i)` de `@/lib/wow` (ver §2).
6. **Rutas:** nunca escribas `about.html`. Usá `routes` de `@/data/site` (`routes.about`, `routes.service(slug)`…).
7. **Contenido:** los listados salen de `getCollection()`, ordenados por `order` (o por `pubDate` descendente en posts). No escribas a mano textos que ya están en `src/content/`.
8. **JS:** ningún componente escribe lógica en línea. Los comportamientos viven en `src/scripts/` (Agente D) y el componente solo los importa: `<script>import '@/scripts/sliders';</script>`. Astro deduplica: aunque 3 componentes importen lo mismo, se carga una sola vez.
9. **Accesibilidad:** `<button>` para acciones y `<a>` para navegación; `aria-label` en enlaces que solo tienen un ícono; ids únicos en la página (el original repetía `id="accordion"`/`collapse1` en varios acordeones: generalos únicos).
10. **Comentarios:** encabezado de cada componente con qué es, dónde se usa, qué props recibe y cualquier decisión (por qué difiere del original). En español.
11. **Nada de `git commit`.** Al terminar, devolvé un resumen: archivos creados, decisiones, qué verificaste (con los % de `compare.mjs`) y qué quedó pendiente.

## 2. Utilidades comunes (ya existen, no las edites)

| Módulo | Qué da |
|---|---|
| `@/data/site` | `site` (contacto, redes, horarios, `formEndpoint`), `routes`, `mainNav`, `detailExamples` |
| `@/lib/background-image` | `backgroundImageStyle(nombre, imagen)` → string para `style` con `--{nombre}-bg-image(-sm)` (fondos CSS optimizados) |
| `@/lib/wow` | `delay(i)` → `'0.2s'`/`undefined`, para `data-wow-delay={delay(i)}` |
| `@/components/global/Icon.astro` | ícono SVG en línea (ver §1.4) |
| `@/components/global/PageHeader.astro` | `<PageHeader title accent crumbs />` o con slot (meta del post) |
| `@/layouts/BaseLayout.astro` | `<BaseLayout title description image type noindex>` (props de SEO) |

## 3. Agente A — Secciones de la home, tarjetas y las 3 home

**Archivos propios:** `src/components/sections/*`, `src/components/cards/*`, `src/pages/index.astro`, `src/pages/index-slider.astro`, `src/pages/index-video.astro`.
**Puede tocar CSS:** no. **No puede tocar:** todo lo demás.

Cada sección es un `.astro` que renderiza **el bloque completo** (el `<div class="about-us">…</div>`). Props (todas opcionales salvo que se indique; los defaults = texto del original en index.html):

| Componente | Clase raíz | Props | Datos |
|---|---|---|---|
| `sections/Hero.astro` | `.hero` | `variant: 'image' \| 'slider' \| 'video'` (**obligatoria**) | Fondo con `backgroundImageStyle('hero', …)` en la variante image |
| `sections/AboutUs.astro` | `.about-us` | `button?: { label, href }` (default "More About us" → about; en /about es "View all portfolio" → portfolio) | — |
| `sections/OurServices.astro` | `.our-services` | `limit = 3` | colección `services` |
| `sections/WhyChooseUs.astro` | `.why-choose-us` | — | — |
| `sections/IntroVideo.astro` | `.intro-video` | — | video `/videos/photoclick-intro-video.mp4` |
| `sections/OurPortfolio.astro` | `.our-portfolio` | `limit = 3` | colección `portfolio` |
| `sections/OurPackages.astro` | `.our-packages` | — | colección `packages` |
| `sections/WeddingGallery.astro` | `.our-wedding-gallery` | — | `gallery` con `album === 'wedding'` |
| `sections/OurFaqs.astro` | `.our-faqs` | — | `faqs` con `featured` |
| `sections/Testimonials.astro` | `.our-testimonials` | `limit = 4` | `testimonials` |
| `sections/CtaBox.astro` | `.cta-box` | — | fondo con `backgroundImageStyle('cta', …)` |
| `sections/OurBlog.astro` | `.our-blog` | `limit = 3` | `posts` |
| `sections/OurTeam.astro` | `.our-team` | `limit = 3` | `team` |
| `cards/ServiceItem.astro` | `.service-item` | `entry` (de `services`), `index` | |
| `cards/PortfolioItem.astro` | `.portfolio-item` | `entry` (de `portfolio`), `index` | enlaza a `routes.project(entry.id)` |
| `cards/PostItem.astro` | `.post-item` | `entry` (de `posts`), `index` | |
| `cards/TeamItem.astro` | `.team-item` | `entry` (de `team`), `index` | |
| `cards/TestimonialItem.astro` | `.testimonial-item` | `entry`, `index`, `animate = false` (en /testimonials lleva `wow fadeInUp`; en el slider no) | |
| `cards/FaqAccordion.astro` | `.faq-accordion` | `items` (entradas de `faqs`), `id` (**obligatorio**, único) | lo usan OurFaqs, /faqs y los detalles |

Las **cards** las usan también los agentes B y C: respetá exactamente estas props.
Clases de comportamiento que el Agente D engancha: `.hero-image-slider .swiper`, `.testimonial-slider .swiper`, `.wedding-gallery-item-boxes` + `.our-wedding-gallery-nav a[data-filter]`, `.gallery-items a` (lightbox de imagen), `a.popup-video` (lightbox YouTube), `.counter`, `video[data-lazy-video]` (ver §6).

**Verificación:** las 3 home contra `index.html`, `index-slider.html` e `index-video.html` a 1440 y 390 px. Los sliders dependen de `src/scripts/sliders.ts` (Agente D): si todavía no existe, verificá primero el resto y volvé a comparar cuando aparezca.

## 4. Agente B — Contenido repetible: listados, paginación y detalles

**Archivos propios:** `src/pages/services/**`, `src/pages/portfolio/**`, `src/pages/blog/**`, `src/pages/team/**`, `src/components/ui/Pagination.astro`, `src/components/detail/*` (sidebars, bloques de detalle), el **cuerpo** (debajo del frontmatter) de `src/content/{services,portfolio,posts,team}/*.md` y **agregar campos** a los esquemas de esas 4 colecciones en `src/content.config.ts` (solo agregar, y solo opcionales o con default).
**No puede tocar:** sections/cards (Agente A), CSS, scripts, el resto de las páginas.

- `services/index.astro` = `services.html` (usa cards y secciones de A: `ServiceItem`, `IntroVideo`, `WhyChooseUs`, `OurFaqs`, `Testimonials`).
- `blog/[...page].astro` con `paginate()` de 6 por página (decisión D5: el bloque de paginación se muestra siempre; con 1 página, flechas deshabilitadas con `aria-disabled`). Página 2 en adelante: `/blog/page/2/`. Ajustá `routes.blogPage` si hace falta… **no**: ya existe en site.ts; usala.
- Detalles `[slug].astro` con `getStaticPaths()` sobre la colección. El marcado sale de la única página de detalle del original (`service-single.html`, etc.); el cuerpo del texto (`.service-entry`, `.post-entry`, `.portfolio-entry`, `.team-about-content`…) va al **cuerpo Markdown** de cada entrada (Markdown con HTML donde haga falta para las clases). Para las 5 entradas que el original no tiene, usá el mismo cuerpo del original adaptando solo título e imagen (es contenido de demostración) y anotalo.
- El sidebar del detalle de servicio lista **todos los servicios** desde la colección; el detalle de portfolio muestra la ficha desde el frontmatter (agregá campos si hace falta: `client`, `date`, `location`…); el detalle de post muestra autor y fecha reales (`pubDate` formateada como el original: `11 May, 2026`).
- Los FAQs de los detalles usan `cards/FaqAccordion.astro` (Agente A) con las FAQ `featured`.
- El formulario de team-single usa `ui/ContactForm.astro` (Agente C).

**Verificación:** los 4 listados y los 4 detalles de ejemplo (tabla §0) a 1440 y 390 px.

## 5. Agente C — Páginas fijas

**Archivos propios:** `src/pages/about.astro`, `testimonials.astro`, `image-gallery.astro`, `video-gallery.astro`, `faqs.astro`, `contact.astro`, `404.astro`, `src/components/ui/ContactForm.astro`, `src/components/ui/*` (salvo Pagination).
**No puede tocar:** sections/cards, CSS, scripts, las demás páginas.

- `about.astro` = about.html (secciones de A: `AboutUs` con el botón "View all portfolio", `IntroVideo`, `OurTeam`, `OurFaqs`, `Testimonials`, más los bloques propios de about: "our approach"/"what we do" → creá `src/components/ui/OurApproach.astro` y similares).
- `faqs.astro`: sidebar + 5 grupos con `cards/FaqAccordion.astro` (un `id` distinto por grupo).
- `contact.astro` + `ui/ContactForm.astro`: el mismo marcado del formulario (`#contactForm`, `.help-block.with-errors`, `#msgSubmit`), `action={site.formEndpoint ?? '#'}`, `<label>` accesibles (si el original no tiene labels visibles, usá `.sr-only`). El comportamiento lo pone `src/scripts/contact-form.ts` (Agente D). El mapa: `<iframe loading="lazy" title="…">`.
- `404.astro`: `<BaseLayout noindex>`. Astro genera `404.html`.
- `image-gallery.astro`: `gallery` con `album === 'photos'`, contenedor `.gallery-items` (lightbox de D). `video-gallery.astro`: colección `videos` con `a.popup-video`.

**Verificación:** las 7 páginas a 1440 y 390 px.

## 6. Agente D — Interactividad

**Archivos propios:** `src/scripts/{sliders,lightbox,gallery-filter,counters,accordion,contact-form,lazy-video}.ts`, `src/styles/vendor/magnific-popup.css` (solo si hace falta) y páginas de prueba en `src/pages/dev/d-*.astro` (se borran al final).
**No puede tocar:** los `.astro` de los demás agentes ni el resto del CSS.

Cada script **se inicializa solo al importarse** y no hace nada si en la página no están sus elementos. Sin jQuery. TS estricto. Respetá `prefers-reduced-motion` donde tenga sentido (autoplay, conteos).

| Script | Reemplaza a | Engancha | Comportamiento (valores de `function.js`) |
|---|---|---|---|
| `sliders.ts` | swiper-bundle (CDN) | `.hero-image-slider .swiper`, `.testimonial-slider .swiper`, `.company-supports-slider .swiper` | Swiper 11 de npm importando solo `Autoplay` y `EffectFade`. Parámetros **idénticos** a function.js |
| `lightbox.ts` | Magnific Popup (jQuery) | `.gallery-items` (delegado a `a`, tipo imagen, galería con ← →, zoom desde la miniatura 300 ms) y `a.popup-video` (iframe de YouTube, `mfp-fade`) | Genera el **mismo DOM** `.mfp-*` para que aplique `magnific-popup.css`. Teclado (Esc, ←, →), trampa de foco, devolver el foco al cerrar, `role="dialog"`/`aria-modal` |
| `gallery-filter.ts` | Isotope | `.wedding-gallery-item-boxes` + `.our-wedding-gallery-nav li a[data-filter]` | Masonry + filtro con `.active-btn`. Importá `isotope-layout` de npm con `import()` dinámico (solo en páginas con galería) **o** reemplazalo por algo propio si queda idéntico; decidí y justificalo |
| `counters.ts` | counterUp + Waypoints | `.counter` (conteo 3000 ms, delay 6) y `.skills-progress-bar .skillbar .count-bar[data-percent]` (barra 2000 ms al entrar en pantalla, offset 70 %) | IntersectionObserver + requestAnimationFrame. El número final tiene que estar en el HTML (sin JS se ve el valor final) |
| `accordion.ts` | bootstrap.bundle | `[data-bs-toggle="collapse"]` | `import 'bootstrap/js/dist/collapse'` (trae su data-API): mismo comportamiento que el original |
| `contact-form.ts` | validator.js (jQuery) + AJAX | `#contactForm` | Validación nativa + mensajes en `.help-block.with-errors` como el plugin; envío `fetch` a `form.action` si es una URL real; si no hay endpoint, mostrar en `#msgSubmit` el mismo error que el original (clases `h4 text-danger`) |
| `lazy-video.ts` | — (nuevo) | `video[data-lazy-video]` | Los `<video autoplay muted loop>` de fondo (intro y paquetes) llegan con `preload="none"` y sin `autoplay`; este script los reproduce al entrar en pantalla (IntersectionObserver) y los pausa al salir. El video del hero de index-video NO usa esto (autoplay normal) |

Constantes de tiempo: agregalas a un objeto propio dentro de cada script **con comentario** (el archivo `src/scripts/motion.ts` es del orquestador; si querés que se centralicen, listalas en tu resumen).

**Verificación:** con páginas de prueba (`src/pages/dev/d-*.astro`) que copien el marcado mínimo del original, y comportamiento contra el original en el navegador (abrir lightbox, filtrar, contar). Cuando las páginas de A/B/C existan, probá ahí también.
