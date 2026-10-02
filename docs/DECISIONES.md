# Decisiones

Registro de las decisiones que tomé sin consultar, con el motivo de cada una.

## Paso 0

- **Saqué `theme-panel-dynamic.js` de la copia local.** Lo sirve `demo.awaikenthemes.com`: carga Google Tag Manager, el panel de venta de la demo y un aviso de licencia. No forma parte de la plantilla ni de su diseño, así que no hace falta para compararla.
- **Los videos quedaron en `referencia/images/`.** El HTML publicado los pide a otro dominio (`demo.awaikenthemes.com/assets/videos/`). Reescribí esas rutas a `images/`, que es donde la plantilla los espera según los comentarios del propio HTML. Así la copia funciona sin conexión.
- **`referencia/` no va al repositorio** (`.gitignore`). Son 17 MB de fotos y código de una plantilla comercial. Es material de comparación, no se publica.

## Fase 3 y 4 (orquestador)

- **Variantes de texto entre páginas unificadas con el texto del listado.** El original repite algunos textos con pequeñas diferencias según la página: una "s" de más o de menos en un título de *services* y el cargo de Elena Rossi (distinto en `team.html` y en `team-single.html`). Como el contenido sale de una sola colección, cada dato existe una única vez; se tomó el texto del listado (`services.html`, `team.html`), que es el que ve más gente. Es la única diferencia de texto aceptada a propósito.
- **`referencia/` pasó a estar versionada** (el usuario la sacó del `.gitignore` para que la sesión en la nube pudiera compararla). Es material de una plantilla comercial: el repositorio tiene que seguir siendo privado. Antes de publicar el sitio o compartir el repo, conviene volver a ignorarla.
- **Herramientas con Chromium configurable** (`PW_CHROMIUM_PATH`). En la nube no se puede descargar el Chromium que pide Playwright 1.63; con la variable se usa el que ya está instalado. Sin la variable, todo funciona como antes.
- **Lighthouse "antes" medido en local.** La línea base de `docs/lighthouse/original-*.json` se midió contra la demo en línea (otra red, otro servidor, con el panel comercial). Para que la comparación sea justa, el "antes" y el "después" se midieron en la misma máquina, con el mismo Lighthouse (13.5, celular simulado y escritorio): el original servido desde `referencia/` y el build servido desde `dist/`, los dos con el mismo servidor estático (`serve`; ver "Fase 4"). La medición en línea queda como referencia histórica.

## Fase 3, cierre (integración del trabajo de los subagentes)

- **Ningún componente de sección o tarjeta tiene `<script>`: todo se carga desde `src/scripts/global.ts`.** Astro inserta el `<script>` de un componente en el lugar del HTML donde se usa el componente. El de `TrustedByList` quedaba como último hijo de `.section-footer-text`, rompía `.section-footer-text ul:last-child { margin-bottom: 0 }` y sumaba +15 px en 4 páginas. Lo detectó `tools/section-heights.mjs`.
- **Comportamientos bajo demanda (`loadWhenNear`).** Sliders, visor, galería, formulario, acordeón y contadores se descargan cuando su sección está a menos de 800 px de la pantalla. Si los importa cada componente, el navegador los pide todos al cargar, con prioridad alta y compitiendo con el LCP. El slider del hero se baja enseguida porque ya está en pantalla.
- **GSAP se descarga después de `load`.** El texto ya está visible en el HTML. La animación arranca un instante después, igual que en el original, que esperaba las fuentes.
- **El sidebar del detalle de servicio lista los 6 servicios** (el original tenía 5 escritos a mano). Es el dato real de la colección. Costo: +55 px en celular en esa página.
- **Etiquetas de los posts:** las del detalle del original ("Wedding Photography", "Candid Moments", "Modern Poses"). Se corrige el tipeo "Morder". En la extracción había quedado un relleno de 2 etiquetas, y eso achicaba la página 55 px en celular.
- **Íconos SVG con `vertical-align: -0.125em` (no `display: block`).** Con `block` el `<i>` perdía su línea base de texto y la fila de estrellas crecía 2 px. Es la misma solución que el SVG oficial de Font Awesome.
- **Póster en los videos diferidos.** Es el primer fotograma, sacado con ffmpeg y servido en WebP. Con `preload="none"` el `<video>` no muestra nada hasta reproducirse; el póster evita el hueco negro.
- **Fondo del CTA sin versión de celular** (`backgroundImageStyle(…, { mobile: false })`). El CSS del autor no usa `background-size: cover` en `.cta-box`: la foto se pinta a su tamaño natural, y achicarla cambiaba el encuadre y la hacía repetirse.
- **Tema claro: el footer recibe fondo oscuro propio y las islas reaplican `color`.** El footer no tiene foto detrás, y el `color` heredado viene ya calculado del `<body>`.

## Fase 4 (rendimiento)

- **El "después" de Lighthouse se midió con `serve` sobre `dist/`, no con `astro preview`.** Es el mismo servidor estático (con gzip) que se usó para el "antes". `astro preview` no comprime y habría perjudicado al sitio nuevo sin que eso tuviera que ver con el código.
- **Precarga de la foto del LCP** (`PreloadBackground.astro`): `<link rel="preload" fetchpriority="high">` con `media`, una versión para celular y otra para escritorio. Lighthouse marcaba que la imagen no se descubría en el HTML inicial.
- **Círculo "Book your date": `width: 200px` y `loading="eager"`.** Con `width: 100%` dentro de un `inline-block`, la caja medía 0 hasta que llegaba el SVG y movía el hero 74 px (CLS 0,044). El ancho fijo da el mismo resultado final en todos los breakpoints.
- **Solo las 2 caras de fuente que se usan** (`styles` en `astro.config.mjs`). Medido en todas las páginas: solo se usan Mona Sans normal y Playfair cursiva. Antes se declaraban y precargaban 4 (156 KB con prioridad alta, compitiendo con la foto del hero). Con `styles: ['normal']` / `['italic']`, Astro declara y precarga solo esas 2. (Durante la sesión se escribió un `FontPreload.astro` creyendo que `styles` no funcionaba; en realidad se había medido un build que había fallado. Se borró.)
- **CSS en archivo externo (`inlineStylesheets: 'auto'`).** Se probó incrustarlo en cada HTML (`'always'`) y dio peor en celular (89 contra 90, LCP 3,7 contra 3,5 s).
- **Comentarios HTML (`<!-- -->`) pasados a `{/* */}`** en los `.astro`, para que no lleguen al HTML publicado.
- **Objetivo de rendimiento en celular parcialmente cumplido** (92–96 contra la meta de 95). El LCP simulado (2,7–3,4 s) lo determina el diseño: varias fotos grandes en la primera pantalla. Bajarlo más exigía cambiarlo. Ver `RENDIMIENTO.md`.

## Verificación

- **`tools/compare.mjs` scrollea paso a paso desde Node.** Durante un `page.evaluate` largo, Chromium headless no entrega los `IntersectionObserver`, y los sliders cargados bajo demanda no se inicializaban en la captura: −77 px falsos.
- **`compare.mjs` fuerza la carga de las imágenes `lazy` antes de capturar**, en los dos lados. Si no, las que el scroll rápido salteó salían vacías.
- **Herramientas nuevas:** `tools/section-heights.mjs` (qué sección cambia de alto), `tools/diff-regions.mjs` (dónde está la diferencia de píxeles) y `tools/smoke-test.mjs` (toda la interactividad).
