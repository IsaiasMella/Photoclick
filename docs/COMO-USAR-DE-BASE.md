# Cómo usar este proyecto de base para un diseño propio

La idea es separar **lo que es de Photoclick** (su estética) de **lo que es de cualquier sitio bien hecho** (estructura, contenido, SEO y rendimiento). Lo segundo se queda igual; lo primero se reemplaza.

> **Licencia:** Photoclick es una plantilla comercial de Awaiken (ThemeForest). Las fotos, el texto, el logo y el diseño visual (el CSS del autor) son de ellos. Para un sitio propio hay que reemplazarlos. La arquitectura, las herramientas y el código de infraestructura de este repo no dependen de la plantilla.

## Lo que se CAMBIA (la identidad visual)

| Qué | Archivo(s) | Cómo |
|---|---|---|
| **Paleta** | `src/styles/tokens.css`, nivel 1 (primitivos) | Cambiar `--color-*`. Si se respeta el nivel 2 (semánticos), los componentes no se tocan |
| **Roles de color** | `tokens.css`, nivel 2 | Solo si el diseño nuevo tiene otros roles (p. ej. un `--accent-2`) |
| **Tema claro** | `tokens.css`, bloque `:root[data-theme="light"]` e "islas oscuras" | Redefinir los semánticos. Si el diseño nuevo no pone texto sobre fotos, las islas se pueden borrar |
| **Tipografías** | `astro.config.mjs` (`fonts`, con `styles` y `weights`) + `--font-family-*` en `tokens.css` | Nombre de la familia, pesos y estilos usados. **Precargá solo las caras de la primera pantalla** |
| **Escalas** | `tokens.css`: `--text-*`, `--space-*`, `--radius-*`, `--duration-*` | Photoclick tiene 16 tamaños de texto porque se copió el original valor por valor. Para algo nuevo conviene una escala corta (6–8 tamaños, p. ej. con `clamp()`) |
| **Breakpoints** | Los comentarios `/* --bp-* */` en cada `@media` + `src/scripts/motion.ts` | Las `@media` no aceptan `var()`: hay que cambiar el número en cada una. Si se arranca de cero, mejor mobile-first (`min-width`) |
| **CSS de componentes** | `src/styles/components/*.css` | Es el CSS del autor: **se reescribe**. Conviene conservar un archivo por componente, con encabezado y los `@media` al final |
| **Marcado de secciones** | `src/components/sections/*`, `cards/*`, `ui/*`, `detail/*` | Las clases y la estructura son las del original. Se reescriben con el diseño nuevo, conservando el patrón: la sección recibe props, lee la colección y renderiza tarjetas |
| **Contenido** | `src/content/**`, `src/data/site.ts` | Texto, fotos, menú, contacto y redes |
| **Imágenes y videos** | `src/assets/images/`, `public/videos/` | Las de la plantilla son de Awaiken |
| **Logo y favicon** | `src/assets/images/logo.svg`, `public/favicon.png` | |
| **Íconos** | `src/components/global/Icon.astro` | Agregar o quitar imports de `@fortawesome/*-svg-icons`, o cambiar de set (cualquier SVG en `[ancho, alto, …, path]` sirve) |
| **Glifos en CSS** | `src/assets/fonts/fa-solid-900-subset.woff2` + `vendor/icons.css` | Solo si el CSS nuevo usa `content: '\f…'`. Si no, se borran los dos |
| **Interactividad del diseño** | `sliders.ts`, `lightbox.ts`, `gallery-filter.ts`, `cursor.ts`, `text-animations.ts` | Tienen los parámetros de Photoclick: se ajustan o se borran según el diseño |
| **Bootstrap** | `src/styles/vendor/bootstrap.scss` | Si el diseño nuevo no usa la grilla de Bootstrap, se saca (y `bootstrap` y `sass` del `package.json`) |

## Lo que QUEDA IGUAL (la infraestructura)

| Qué | Archivo(s) | Por qué sirve en cualquier sitio |
|---|---|---|
| **Estructura de carpetas** | todo `src/` | Separa datos, layout, componentes, scripts y estilos. Ver `ARQUITECTURA.md` |
| **Layout y `<head>`** | `src/layouts/BaseLayout.astro` | El orden correcto: tema → fuentes → SEO → CSS. Así no hay flashes |
| **Sin flash de tema** | `ThemeScript.astro`, `ThemeToggle.astro` | Script bloqueante mínimo + `data-theme` + `localStorage` |
| **SEO** | `Seo.astro`, `astro.config.mjs` (`site`, sitemap) | title, description, canonical, Open Graph, sitemap y `noindex` en el 404 |
| **Content Collections** | `src/content.config.ts` | Cambian los campos, el patrón no: zod + `image()` + `getCollection` |
| **Rutas centralizadas** | `src/data/site.ts` → `routes` | Ningún componente escribe una URL a mano |
| **Rutas dinámicas y paginación** | `pages/*/[slug].astro`, `pages/blog/[...page].astro`, `ui/Pagination.astro` | `getStaticPaths` + `paginate()` |
| **Imágenes optimizadas** | `<Image>` de `astro:assets`, `src/lib/background-image.ts`, `PreloadBackground.astro` | AVIF/WebP, `srcset`, `width`/`height`, fondos CSS optimizados y precarga del LCP |
| **JS bajo demanda** | `src/scripts/global.ts`, `load-when-near.ts` | Cada comportamiento se baja cuando hace falta |
| **Aparición al scroll sin riesgo** | `reveal-on-scroll.ts`, `animations.css`, la clase `.js-reveal` | Si falla el JS, no se oculta nada |
| **Preloader seguro** (si se quiere uno) | `Preloader.astro` + `preloader.css` | `DOMContentLoaded`, `<noscript>` y red de seguridad de 3 s. Se apaga con `site.preloader = false` |
| **Accesibilidad** | `src/styles/a11y.css`, skip-link en `BaseLayout` | Foco visible, `prefers-reduced-motion`, `.sr-only` |
| **Tokens de movimiento para JS** | `src/scripts/motion.ts` | El mismo criterio que `tokens.css`, para GSAP y Web Animations |
| **Herramientas de verificación** | `tools/*` | Funcionan contra cualquier par de URLs: comparar con un diseño de Figma exportado, con la versión anterior o con producción |

## Paso a paso sugerido para un diseño nuevo

1. **Contenido primero:** escribir los `.md`/`.json` del sitio nuevo y adaptar los esquemas en `content.config.ts`. Si falta un campo, el build avisa.
2. **Tokens:** paleta (primitivos), roles (semánticos), tipografías, escalas. Probar los dos temas.
3. **Layout global:** `Header`, `Footer` y `PageHeader`, con su CSS en `styles/components/`.
4. **Una sección a la vez:** el componente `.astro` y su `.css`, importado en `styles/index.css` (el orden de los `@import` = el orden de la cascada).
5. **Interactividad:** solo la que el diseño pida, registrada en `global.ts` con `loadWhenNear`.
6. **Medir:** `npm run build`, `node tools/smoke-test.mjs` (adaptado) y Lighthouse con `node tools/lh-summary.mjs`.
7. **Borrar lo de Photoclick que no se use:** `referencia/`, `vendor/slicknav.css`, `vendor/magnific-popup.css`, `vendor/cursor.css`, el subconjunto de fuente de íconos, `tools/extract-content.mjs` y `tools/css-swap-test.mjs`.
