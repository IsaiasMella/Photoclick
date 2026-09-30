# PLAN — Reconstrucción de Photoclick en Astro

> Estado: **esperando aprobación**. No se escribió código de la app todavía.
> Rama de trabajo: `rebuild/astro` (la rama `main` no se toca).

---

## 0. Estado del Paso 0 (ya hecho)

- La demo completa está descargada en `referencia/`: **18 páginas HTML**, 8 CSS, 18 JS, 113 imágenes, 4 fuentes de Font Awesome y los 3 videos, que estaban en otro dominio (`demo.awaikenthemes.com`) y ahora apuntan a `images/`.
- Saqué de la copia local `theme-panel-dynamic.js`. Es el panel comercial de la demo: carga Google Tag Manager y hace un chequeo de licencia. **No es parte de la plantilla que se vende.**
- Comparé con capturas de página completa la original en línea contra la copia servida en local:

| Página | 1440 px | 390 px |
|---|---|---|
| index-slider | 0,02 % | 4,95 % (el slider está en otra foto) |
| about | 0,00 % | 0,00 % |
| blog | 0,00 % | 0,00 % |
| contact | 0,00 % | 0,00 % |

  La altura es la misma en todas. **La copia local es fiel.**

### Línea base de rendimiento (Lighthouse 13, celular, demo en línea)

| Métrica | Original |
|---|---|
| Performance | **56 / 100** |
| LCP (Largest Contentful Paint) | **8,3 s** |
| Speed Index | **10,8 s** |
| FCP | 3,3 s |
| TBT | 230 ms |
| CLS | 0,046 |
| Peso total | **7,98 MB** |
| SEO | 58 / 100 (sin `description` y con `lang="zxx"`) |
| Accesibilidad | 86 / 100 |

El informe completo está en `docs/lighthouse/original-index-slider-mobile.json`. Este es el número contra el que se va a comparar la versión nueva.

---

## 1. Tecnología de origen (Fase 1.1)

**No es Tailwind.** No aparece `/*! tailwindcss`, `@layer` ni `--tw-*`. **No hay bundler** (ni Vite ni Webpack): es una plantilla HTML estática de ThemeForest, hecha "a mano", con librerías sueltas cargadas por `<link>` y `<script>`. Por lo tanto **no se agrega Tailwind.**

| Pieza | Versión | Peso | Para qué se usa en realidad |
|---|---|---|---|
| Bootstrap CSS | 5.3.3 | 232 KB | grid, navbar, accordion, `form-control` y unas 6 utilidades |
| Bootstrap JS | 5.3.3 | 60 KB | solo `collapse` (el accordion de FAQs) |
| jQuery | 3.7.1 | 87 KB | lo usan casi todos los plugins |
| Swiper | 11.0.5 | 148 KB + 18 KB | 3 sliders (hero con fundido, testimonios y logos) |
| GSAP + ScrollTrigger + SplitText | 3.13 / 3.12.5 | 123 KB | animación de títulos por letra, revelado de imágenes y cursor |
| WOW.js + animate.css | 1.3 / — | 8 KB + **73 KB** | usa **una sola** animación: `fadeInUp` (361 veces) |
| Font Awesome | 7.2.0 | 75 KB + ~400 KB de fuentes | **11 íconos** en todo el sitio |
| Magnific Popup | 1.x | 21 KB + 7 KB | visor de fotos (galería) y popup de YouTube |
| Isotope | 3.x | 35 KB | filtro de la galería de bodas (masonry) |
| SlickNav | 1.x | 21 KB + 2,5 KB | menú de celular |
| jquery.mb.YTPlayer | — | 64 KB | **no se usa**: el marcado está comentado, pero el script se carga en las 18 páginas |
| counterUp + Waypoints | — | 10 KB | contadores y barras de habilidades |
| parallaxie | — | 2 KB | parallax de fondos (solo en pantallas de más de 1024 px) |
| validator (Bootstrap Validator) | — | 8 KB | validación del formulario de contacto |
| SmoothScroll | 1.5.1 | 24 KB | suaviza la rueda del mouse |
| magiccursor | — | 4 KB + 7 KB | cursor personalizado ("View", "Play", "Drag") |
| Google Fonts | Mona Sans + Playfair Display (variables) | — | bloquea el renderizado |

**Diagnóstico de rendimiento:** cada página carga **~1,1 MB de CSS y JS** y ~400 KB de fuentes de íconos, todo bloqueante. Encima, un *preloader* tapa la página hasta el evento `load`, es decir, hasta que bajan **todas** las imágenes. Por eso el LCP es de 8,3 s. Las imágenes son JPG/PNG sin versiones responsive.

---

## 2. CSS: qué es de la herramienta y qué escribió el autor (Fase 1.2)

| Archivo | Origen | Qué hago |
|---|---|---|
| `bootstrap.min.css` | librería | **No se copia.** Se instala `bootstrap@5.3` por npm y se compila con Sass **solo lo que se usa** (reboot, grid, containers, navbar, nav, collapse, accordion, forms y las utilidades usadas). |
| `swiper-bundle.min.css` | librería | Sale del paquete npm `swiper@11` (solo los módulos core, fade y autoplay). |
| `all.min.css` (Font Awesome) | librería | **Se reemplaza** por SVG en línea generados al compilar, con los datos oficiales de `@fortawesome/free-*-svg-icons@7`. Cero fuentes de íconos. |
| `animate.css` | librería | **Se reemplaza** por el único `@keyframes fadeInUp` que se usa (unas 15 líneas). |
| `magnific-popup.css`, `slicknav.min.css`, `mousecursor.css` | plugin, pero con reglas que el autor ajustó | Se reescriben tokenizados, porque el JS de reemplazo genera **las mismas clases** (`.mfp-*`, `.slicknav_*`, `.cb-cursor`). |
| `custom.css` (97 KB, **sin minificar**, 5874 líneas, 32 secciones) | **autor** | Es el código fuente real. Se divide en archivos por componente y se tokeniza. |

---

## 3. Inventario (Fase 1.3)

### 3.1 Tokens que ya existen (`:root` de custom.css)

```
--primary-color: #FFFFFF        --accent-color: #D9C18A (dorado)
--secondary-color: #FFFFFF0A    --white-color: #FFFFFF
--bg-color: #080808             --divider-color: #FFFFFF1A
--text-color: #FFFFFFCC         --dark-divider-color: #FFFFFF00
--error-color: rgb(230,87,87)   --default-font: "Mona Sans"
--accent-font: "Playfair Display"
```

**Error del original:** `--black-color` se usa en `::selection`, pero nunca se define. Lo documento y lo defino.

### 3.2 Valores repetidos a mano que tienen que ser tokens

| Tipo | Valores detectados (cantidad de usos) | Token propuesto |
|---|---|---|
| Overlays | `rgba(8,8,8,0.80)` ×5, `0.56` ×5, `0.50` ×2, `0.00` ×6 | `--overlay-strong/medium/soft/none`, derivados de `--color-ink-950` |
| Tamaños de fuente | 14, 16, 18 (×42), 20 (×34), 22, 24, 26, 28, 30, 34, 36, 40, 46, 48, 52, 76 px | escala `--font-size-xs…7xl` |
| Radios | 14 px (×53), 10 px, 8 px, 6 px, 5 px, 120 px, 1000 px, 50 % | `--radius-sm/md/lg/xl/pill/full` |
| Duraciones | 0.1s, 0.3s (×10), 0.4s (×30), 0.5s, 0.6s, 600 ms | `--duration-instant/fast/base/slow/slower` |
| Curvas | `ease-in-out` (casi todo), `ease-out`, `linear` + GSAP `power2.out`, `back.out`, `expo.out` | `--ease-standard/out/linear` (y constantes TS para GSAP) |
| Desenfoque (*glassmorphism*) | `blur(30px)` ×24, `blur(10px)` ×6, `blur(15px)` ×2 | `--blur-sm/md/lg` |
| Breakpoints | 1440, 1024, 991, 767 px (desktop-first, `max-width`) | `--bp-*` como documentación, más constantes TS. Las media queries **no aceptan `var()`**: se escriben literales, cada una con un comentario que referencia el token. |
| Espaciados | `padding` y `margin` de secciones: 100 px, 50 px, 30 px… (a relevar al detalle en la Fase 2) | escala `--space-*` y `--section-padding` |
| Sombras | casi ninguna (`box-shadow: none`) | no hace falta token |

### 3.3 Componentes (agrupados por prefijo de clase)

**Globales, en las 18 páginas:** `preloader`, `main-header` / `header-sticky` / `navbar` / `main-menu` / `responsive-menu` (SlickNav), `page-header` (título + breadcrumb con parallax, en las 15 páginas internas) y `main-footer` (`footer-header`, `footer-newsletter-form`, `about-footer`, `footer-links`, `footer-working-hour-list`, `footer-contact-list`, `footer-copyright`). Además: `btn-default` / `btn-highlighted`, `section-title` y `readmore-btn`.

**Secciones de la home (varias se reutilizan en páginas internas):**

| Sección | Aparece en |
|---|---|
| `hero` (3 variantes: imagen, `hero-slider-layout` y `hero-video`) | index, index-slider, index-video |
| `about-us` (+ `about-us-counter-box`) | homes, about |
| `our-services` / `service-item` | homes, services (6 ítems) |
| `why-choose-us` | homes, services, testimonials |
| `intro-video` (video de fondo + popup de YouTube) | homes, about, services, testimonials |
| `our-portfolio` / `portfolio-item` | homes, portfolio (6) |
| `our-packages` (con video) | homes |
| `our-wedding-gallery` (filtro isotope + lightbox) | homes, testimonials |
| `our-faqs` (`faq-cta-*` + `faq-accordion`) | homes, about, services, testimonials |
| `our-testimonials` / `testimonial-slider` | homes, about, services |
| `cta-box` (parallax) | homes |
| `our-blog` / `post-item` | homes, blog (6) |
| `our-team` / `team-item` | about, team (6) |

**Páginas con plantilla propia:** `page-service-single`, `page-portfolio-single`, `page-single-post`, `page-team-single` (con `skills-progress-bar`), `page-gallery`, `page-video-gallery`, `page-faqs` (sidebar + 5 accordions), `page-contact-us` (formulario) y `error-page`.

### 3.4 Interactividad

| Qué | Original | Reemplazo propuesto |
|---|---|---|
| Header fijo al scrollear (clases `hide` / `active`) | jQuery | TS vanilla, con scroll pasivo y `requestAnimationFrame` |
| Menú de celular | SlickNav (jQuery) | TS vanilla que genera **el mismo DOM** `.slicknav_*`, con `aria-expanded` y cierre con Escape |
| Submenús de escritorio | CSS `:hover` | igual, más `:focus-within` para navegar con teclado |
| Sliders | Swiper 11 | Swiper 11 por npm, importando solo `Autoplay` y `EffectFade` |
| Accordion de FAQs | Bootstrap collapse | módulo `bootstrap/js/dist/collapse` (el mismo comportamiento, ~8 KB) |
| Visor de fotos y popup de YouTube | Magnific Popup (jQuery) | lightbox propio en TS que genera el DOM `.mfp-*`: teclado (←, →, Esc), trampa de foco, zoom desde la miniatura |
| Filtro de galería | Isotope masonry | `isotope-layout` por npm, cargado **solo** en las páginas con galería. Evalúo reemplazarlo por CSS + FLIP si da idéntico; lo decido en la Fase 3 y lo anoto. |
| Aparición al scrollear | WOW.js + animate.css | `IntersectionObserver` + `@keyframes fadeInUp`, respetando `data-wow-delay`. **Sin JS, el contenido se ve** (no queda oculto). |
| Títulos animados por letra (`text-anime-style-1/2/3`, `text-effect`) | GSAP SplitText | GSAP 3.13 + SplitText por npm (desde 3.13 son gratis), cargado con import dinámico |
| Revelado de imágenes (`.reveal`) | GSAP ScrollTrigger | igual, por npm |
| Contadores y barras de habilidades | counterUp + Waypoints | `IntersectionObserver` + `requestAnimationFrame` |
| Parallax de fondos | parallaxie (jQuery) | TS vanilla (solo en más de 1024 px, como el original) |
| Cursor personalizado | magiccursor (jQuery + GSAP) | TS + GSAP, desactivado en pantallas táctiles |
| Scroll suave de la rueda | SmoothScroll.js | ver la decisión D4 |
| Validación del formulario | Bootstrap Validator (jQuery) | validación nativa del navegador, con los mismos mensajes y el mismo marcado `.help-block.with-errors` |
| Tema claro/oscuro | **no existe** (el sitio solo es oscuro) | ver la decisión D1 |

---

## 4. Arquitectura (Fase 1.4)

### 4.1 Stack
- **Astro 7.3.x** (última estable) con TypeScript `strict`.
- Dependencias: `bootstrap@5.3`, `sass` (solo para compilar el subconjunto de Bootstrap), `swiper@11`, `gsap@3.13+`, `@fortawesome/free-solid-svg-icons`, `free-regular` y `free-brands` (**solo se leen al compilar**: al navegador no llega JS), `isotope-layout` (si se mantiene) y `@astrojs/sitemap`. Todas tienen un equivalente en el original; ninguna es tecnología nueva.
- Fuentes: con la **API de fuentes de Astro** si está estable en la 7.x (descarga las fuentes, las sirve desde el mismo dominio, hace `preload` y genera fuentes de respaldo con métricas ajustadas, lo que evita saltos de diseño). Si no está estable, uso `@fontsource-variable/*`.
- Desarrollo y verificación: `playwright`, `pixelmatch`, `pngjs` y `@astrojs/check`.

### 4.2 Árbol de carpetas

```
src/
  styles/
    index.css               ← ÚNICO punto de entrada. Importa todo en el ORDEN de cascada original.
    tokens.css              ← 3 niveles: primitivos → semánticos → de componente
    fonts.css
    vendor/bootstrap.scss   ← subconjunto de Bootstrap 5.3 (reemplaza a bootstrap.min.css)
    base.css                ← html, body, tipografía, ::selection, scrollbar, botones
    components/             ← un archivo por componente, cada uno con sus @media
      header.css  footer.css  page-header.css  hero.css  about-us.css  services.css …
    vendor-overrides/       ← swiper.css, lightbox.css (.mfp-*), slicknav.css, cursor.css
  layouts/
    BaseLayout.astro        ← <head>, SEO, script del tema, fuentes, header, footer
  components/
    global/   Header, Footer, Preloader, PageHeader, Icon, Button, SectionTitle, Seo
    sections/ Hero*, AboutUs, OurServices, WhyChooseUs, IntroVideo, OurPortfolio,
              OurPackages, WeddingGallery, OurFaqs, Testimonials, CtaBox, OurBlog, OurTeam
    cards/    ServiceItem, PortfolioItem, PostItem, TeamItem, TestimonialItem
    ui/       Pagination, FaqAccordion, ContactForm, Breadcrumb
  content/                  ← Content Collections (Markdown y JSON)
    posts/ portfolio/ services/ team/ testimonials/ faqs/ gallery/ videos/ packages/
  content.config.ts         ← esquemas zod
  data/site.ts              ← navegación, datos de contacto, redes, horarios
  scripts/                  ← módulos TS chicos, uno por comportamiento
    header.ts mobile-menu.ts reveal-on-scroll.ts text-animations.ts sliders.ts
    lightbox.ts gallery-filter.ts counters.ts parallax.ts cursor.ts contact-form.ts
  pages/
    index.astro  index-slider.astro  index-video.astro  about.astro
    services/index.astro  services/[slug].astro
    portfolio/index.astro portfolio/[slug].astro
    blog/[...page].astro  blog/[slug].astro
    team/index.astro      team/[slug].astro
    testimonials.astro image-gallery.astro video-gallery.astro faqs.astro contact.astro 404.astro
public/  videos/*.mp4, favicon y los SVG que usa el CSS como fondo
tools/   compare.mjs (píxeles) y computed-styles.mjs (estilos computados)
referencia/  copia del original (NO se publica)
docs/
```

**Por qué CSS global en un solo archivo de entrada y no `<style>` con alcance de Astro:** los estilos con alcance agregan `[data-astro-cid-…]` a los selectores. Eso sube la especificidad y cambia qué regla gana respecto del original. Para que quede idéntico, la cascada tiene que ser exactamente la misma: los archivos por componente se importan desde `index.css` en el mismo orden que las secciones de `custom.css`.

### 4.3 Equivalencias con React/Next

| Pieza en Astro | Equivalente en Next.js |
|---|---|
| `layouts/BaseLayout.astro` | `app/layout.tsx` |
| `pages/blog/[slug].astro` + `getStaticPaths()` | `app/blog/[slug]/page.tsx` + `generateStaticParams()` |
| `pages/blog/[...page].astro` + `paginate()` | `app/blog/page/[n]/page.tsx` armado a mano |
| Componente `.astro` (sin JS en el navegador) | Server Component |
| `<script>` dentro de un componente (Astro lo empaqueta y lo carga una sola vez) | `"use client"` + `useEffect`, pero sin hidratar el árbol |
| Content Collections + zod | carpeta de MDX + `contentlayer` / `zod` a mano |
| `astro:assets` `<Image>` / `getImage()` | `next/image` |
| API de fuentes / `fonts.css` | `next/font` |
| `styles/index.css` global | `globals.css` importado en el layout |
| `Seo.astro` | `export const metadata` / `generateMetadata` |
| `@astrojs/sitemap` | `app/sitemap.ts` |

### 4.4 Flujo del contenido
`src/content/*.md|json` → `content.config.ts` valida con zod → `getCollection()` en la página → las props bajan a `sections/*` y `cards/*` → HTML estático. Las imágenes del contenido se declaran con `image()` en el esquema, así `astro:assets` las optimiza (AVIF/WebP, `srcset` y `width`/`height` siempre presentes).

El contenido **no se tipea a mano**: lo extrae del HTML de `referencia/` un script (`tools/extract-content.mjs`), para no introducir errores de transcripción.

### 4.5 Rutas
URLs limpias (`/about/`, `/blog/<slug>/`). El script de comparación tiene una tabla que las mapea contra el original (`about.html` ↔ `/about/`, `blog-single.html` ↔ `/blog/<primer-post>/`, etc.). Cada listado genera **una página de detalle por ítem** (6 posts, 6 proyectos, 6 servicios, 6 integrantes del equipo), usando la plantilla de la única página de detalle que tiene el original.

---

## 5. Decisiones que necesito que apruebes

Van con mi recomendación. Si aprobás el plan sin comentarios, aplico las recomendadas.

| # | Tema | Recomendación |
|---|---|---|
| **D1** | **Modo claro.** El original solo es oscuro. | El oscuro queda como default e idéntico. Defino en `tokens.css` un tema claro que **solo redefine los tokens semánticos**. Se activa con un botón chico en el header (sería el único elemento nuevo del marcado) y queda guardado en `localStorage`. Un script en línea en el `<head>` lo aplica antes del primer pintado, así no hay flash. **No sigo `prefers-color-scheme` automáticamente**: si lo hiciera, el sitio se vería distinto al original para quien tenga el sistema en claro. La comparación del modo claro se hace contra sí mismo (no hay original con el cual compararlo). |
| **D2** | **Preloader.** Es la causa principal del LCP de 8,3 s: tapa todo hasta que baja la última imagen. | Mantenerlo visualmente, pero que se vaya en `DOMContentLoaded` (con un tope de 600 ms) y no con `load`. Si el JS falla, **nunca tapa la página**: lo oculta un `<noscript>` y además hay un tope por CSS. Queda una opción en `site.ts` para apagarlo. |
| **D3** | **Íconos.** Font Awesome (75 KB de CSS + ~400 KB de fuentes) para 11 íconos. | Componente `Icon.astro` que escribe el SVG en línea al compilar. Se conservan las clases `fa-solid fa-star` en el `<svg>`, para que el CSS del autor siga aplicando. |
| **D4** | **SmoothScroll.js.** Suaviza la rueda del mouse; cambia la sensación, no lo que se ve, y empeora la accesibilidad. | Portarlo como módulo que se carga cuando el navegador está libre (`requestIdleCallback`), **solo** con mouse y **desactivado** con `prefers-reduced-motion`. |
| **D5** | **Paginación del blog.** En el original es falsa (6 posts y los botones "1 2 3" sin destino). | Paginación real con `paginate()` de 6 posts por página. El bloque se muestra siempre (flechas deshabilitadas cuando no aplican), para que la altura quede igual. Con 6 posts se ve solo "1". Es la única diferencia visual que acepto a propósito. |
| **D6** | **Formularios.** El de contacto hace POST a `form-process.php`, que no existe. El newsletter no hace nada. | La misma validación y los mismos mensajes. El envío va a una URL configurable (`PUBLIC_FORM_ENDPOINT`). Si no está configurada, muestra el mensaje de error del original. Lo dejo documentado. |
| **D7** | **YTPlayer.** Se carga en 18 páginas y no se usa. | Eliminarlo. |
| **D8** | **Videos** (6,5 MB en total). | En `public/videos/` con `preload="none"` y se reproducen recién al entrar en pantalla. El del hero de `index-video` sí se carga al inicio. |
| **D9** | **Fondos por CSS** (hero, page-header, cta, faq). No los optimiza `astro:assets` si quedan en el CSS. | `getImage()` en el componente → custom property `--bg-image` en `style` → el CSS usa `var(--bg-image)`. Así también salen en AVIF/WebP. |
| **D10** | **SEO.** El original tiene `lang="zxx"` y `description` vacío. | `lang="en"` (el contenido está en inglés), `description`, canonical, Open Graph y sitemap por página. |

---

## 6. Plan de ejecución por fases

### Fase 2 — Sistema de diseño (yo)
1. Crear el proyecto Astro y los `tools/`.
2. `tokens.css` en 3 niveles, más `fonts.css`, `base.css`, el subconjunto de Bootstrap y un archivo por componente (con sus `@media` al lado).
3. **Riesgo de cascada:** la sección 32 ("Responsive") junta todos los `@media` al final. Si se mueven junto a cada componente, una regla responsive puede quedar **antes** de otra regla normal de igual especificidad en una sección posterior (por ejemplo, `.page-header` está en la sección 17) y perder. Para detectarlo, además de las capturas armo `tools/computed-styles.mjs`: carga cada página en el original y en la copia nueva, y compara `getComputedStyle` de **todos** los elementos en 1440, 1024, 991, 767 y 390 px. Es determinístico: no le afectan los carruseles.
4. **Verificación obligatoria:** copio `referencia/` a una carpeta temporal y reemplazo los CSS por el CSS nuevo compilado. Comparo contra el original en 10 páginas, a 1440 y 390 px. El "modo claro" en esta etapa es solo el tema nuevo, comparado contra sí mismo. También comparo el **original contra sí mismo** para medir el ruido. Todo queda en `docs/VERIFICACION.md`.

### Fase 3 — Base compartida (yo) y después 4 subagentes en paralelo
**Base (yo):** `BaseLayout` (head, SEO, script del tema, fuentes), `Header`, `Footer`, `Preloader`, `PageHeader`, `Icon`, `Button`, `SectionTitle`, `content.config.ts` y **todo el contenido extraído** (así los subagentes no se pisan con las colecciones), `data/site.ts` y los scripts globales (header, menú de celular, reveal, animaciones de texto, cursor, parallax y scroll suave).

**Subagentes (cada uno con archivos propios, archivos prohibidos, sin commits y con un resumen al final):**

| Agente | Es dueño de | No puede tocar |
|---|---|---|
| **A — Secciones de la home** | `components/sections/*`, `components/cards/*`, `styles/components/{hero,about-us,services,why-choose,intro-video,portfolio,packages,gallery,faqs,testimonials,cta,blog,team}.css` (solo para ajustes), `pages/index*.astro` | layout, global, content, scripts, las páginas de los otros agentes |
| **B — Contenido repetible** | `pages/{blog,portfolio,services,team}/**`, `components/ui/Pagination.astro`, plantillas de detalle y su CSS (service-single, portfolio-single, blog-single, team-single) | lo mismo + `sections/*` (los usa, pero no los edita) |
| **C — Páginas fijas** | `pages/{about,testimonials,image-gallery,video-gallery,faqs,contact,404}.astro`, `components/ui/{FaqAccordion,ContactForm}.astro` y su CSS | lo mismo |
| **D — Interactividad** | `scripts/{sliders,lightbox,gallery-filter,counters,contact-form}.ts` y `styles/vendor-overrides/*` | todos los `.astro` |

**Contrato entre agentes:** está escrito en `docs/CONTRATOS.md` antes de lanzarlos. Define props de cada sección, clases y atributos `data-*` que espera cada script. Los agentes B y C componen páginas con secciones del agente A usando ese contrato; si falta algo, lo anotan y yo lo integro.

Cada agente verifica sus páginas con `tools/compare.mjs` contra `referencia/`.

### Fase 4 — Cierre (yo)
Integrar y resolver conflictos. `astro check` y `npm run build` sin errores ni advertencias. Sitemap y SEO. Comparación visual final de las 18 páginas (y sus equivalentes de detalle), más la comparación de estilos computados. Documentación: `ARQUITECTURA.md`, `TOKENS.md`, `ERRORES-COMUNES.md`, `COMPILADO-VS-FUENTE.md`, `COMO-USAR-DE-BASE.md` e `INFORME.md`.

**Extra, pensado para tu reunión con el dueño:** `docs/RENDIMIENTO.md` con Lighthouse **antes y después** (celular y escritorio, varias páginas) y la tabla de peso por tipo de recurso. Objetivo: Performance ≥ 95, LCP < 2,5 s y peso de la home < 1,5 MB sin contar videos. Commit y push a `rebuild/astro`.

---

## 7. Riesgos conocidos

- **Diferencias de píxeles por animaciones.** Los sliders, GSAP y el cursor generan ruido. Se mitiga con la línea de ruido medida (original contra sí mismo) y con la comparación de estilos computados, que no depende de las animaciones.
- **SVG en vez de fuente de íconos.** Puede haber 1 o 2 px de diferencia en la línea base de las estrellas y las redes. Lo corrijo con CSS y lo documento si queda algo.
- **Imágenes AVIF/WebP.** El recomprimido genera diferencias mínimas de píxeles, por debajo del umbral de pixelmatch (0,1).
- **Isotope vs. reemplazo propio.** Si el reemplazo no queda idéntico, se mantiene Isotope.
- **Licencia.** Photoclick es una plantilla comercial de ThemeForest (Awaiken). Las fotos y el diseño son de ellos. Esto vale para estudiar y para mostrárselo al propio dueño; publicarlo o usarlo para un cliente requiere la licencia.
