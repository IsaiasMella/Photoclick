# Errores comunes (y dónde los evita este código)

Cada caso explica el problema, cómo se nota y **el lugar exacto** del código donde se evita. Los números de línea son los de esta versión; si cambian, buscá el texto citado.

---

## 1. Flash del tema (FOUC de modo oscuro/claro)

**Problema:** si el tema guardado se aplica con JS después de pintar (en un `useEffect`, en un script diferido), quien eligió tema claro ve la página oscura una fracción de segundo en cada carga.

**Dónde se evita:**
- `src/components/global/ThemeScript.astro:24`: `localStorage.getItem('theme')` dentro de un `<script is:inline>`. Es **bloqueante y en línea a propósito**: Astro no lo empaqueta ni lo difiere.
- `src/layouts/BaseLayout.astro:48`: `<ThemeScript />` va **antes** que las fuentes y el CSS en el `<head>`. Cuando el navegador pinta, `<html data-theme>` ya está puesto.
- `src/styles/tokens.css:177`: `:root[data-theme="light"]` redefine solo tokens: no hay JS que cambie estilos uno por uno.

**En Next:** es lo que hace `next-themes` con un script en `app/layout.tsx` y `suppressHydrationWarning`.

## 2. Flash y salto de fuentes (FOUT/FOIT + CLS)

**Problema:** con `<link>` a Google Fonts la carga es bloqueante y viene de otro dominio. Al llegar la fuente real, el texto cambia de ancho y alto y empuja todo (CLS). Si se precargan caras que no se usan, compiten con la imagen principal.

**Dónde se evita:**
- `astro.config.mjs:27`, `fonts: [...]`: Astro descarga las fuentes al compilar, las sirve desde el mismo sitio y genera una **fuente de respaldo con métricas ajustadas** (`size-adjust`, `ascent-override`…, ver `fallbacks`, línea 37). Mientras carga, el texto ya ocupa lo mismo que con la fuente final.
- `astro.config.mjs`, `styles: ['normal']` (Mona Sans) y `styles: ['italic']` (Playfair): se declaran y precargan **solo** las dos caras que usa el diseño (medido en todas las páginas). Antes eran 4 (156 KB con prioridad alta).
- `src/layouts/BaseLayout.astro`: `<Font cssVariable="…" preload />`, antes del CSS en el `<head>`.
- `src/scripts/text-animations.ts:33`: `await document.fonts.ready` antes de partir los títulos en letras. Si SplitText mide con la fuente de respaldo, los cortes de línea quedan mal.
- `src/styles/vendor/icons.css:48`: los glifos de íconos que pide el CSS usan `font-display: block` (como Font Awesome): mejor invisibles un instante que un cuadrado vacío.

## 3. Saltos de diseño (CLS) por imágenes

**Problema:** una imagen sin `width`/`height` mide 0 hasta que llega y después empuja el contenido. Al revés, con `width`/`height` pero sin `height: auto`, el atributo fija la altura y deforma la foto (le gana al `aspect-ratio` del CSS).

**Dónde se evita:**
- Todas las imágenes usan `<Image />` de `astro:assets`, que escribe `width`/`height` reales (`docs/CONTRATOS.md` §1.3).
- `src/styles/components/base.css:71`: `img { height: auto; }` con el comentario de por qué. Así se reserva el espacio y manda el CSS del autor.
- `src/styles/components/hero.css:128`, "Añadido (CLS)": el círculo "Book your date" tenía `width: 100%` dentro de un `<a>` inline-block, así que medía 0 hasta que llegaba el SVG y movía el hero **74 px** (Lighthouse: CLS 0,044 → 0). Lo resuelve un ancho fijo que da el mismo resultado final.
- `src/components/sections/Hero.astro:110`: ese círculo, y la primera foto del slider, con `loading="eager"`. Están en la primera pantalla: con `lazy` llegan tarde.
- `src/components/sections/IntroVideo.astro:33` (y `OurPackages.astro`): `poster` en los `<video preload="none">`, para que no quede un hueco negro hasta que se reproducen.

## 4. JavaScript de más

**Problema:** cargar todas las librerías en todas las páginas (el original: ~1,1 MB de CSS+JS bloqueantes, incluido un plugin de YouTube que no se usaba) o pedir los scripts de secciones que están fuera de pantalla con prioridad alta.

**Dónde se evita:**
- `src/scripts/global.ts:43` y siguientes: `loadWhenNear(selector, () => import(...))` para sliders, visor, galería, formulario, acordeón y contadores. Cada uno se descarga **solo** si su sección existe y está a menos de 800 px de la pantalla (`src/scripts/load-when-near.ts`).
- `src/scripts/global.ts:32`: `afterLoadIdle()`. GSAP (~50 KB) se pide después de `load`, cuando el navegador está libre.
- `src/scripts/smooth-scroll.ts`: el scroll suave solo con mouse, en `requestIdleCallback`.
- `src/components/global/Icon.astro`: los íconos son SVG escritos **al compilar**. Al navegador no llega ni JS ni fuentes de íconos.
- `src/styles/vendor/bootstrap.scss`: solo los módulos de Bootstrap que el HTML usa.
- `src/components/global/Header.astro`: el menú de celular viene en el HTML. El script solo abre y cierra (antes: SlickNav + jQuery clonaban el menú al cargar).

## 5. Animaciones que esconden contenido si falla el JS

**Problema:** el patrón "ocultar con CSS y mostrar con JS" (WOW.js, `opacity: 0` hasta que entra en pantalla) deja la página **en blanco** si el JS no carga, tarda o tira un error. Lo mismo pasa con un preloader que solo se va por JS.

**Dónde se evita:**
- `src/styles/animations.css:38`: `.js-reveal .wow:not(.animated) { visibility: hidden }`. Solo se oculta si `<html>` tiene `.js-reveal`.
- `src/components/global/ThemeScript.astro`: esa clase la pone el script del `<head>`, y **no** la pone con `prefers-reduced-motion`.
- `src/scripts/reveal-on-scroll.ts:18`: si no hay `.js-reveal` o no existe `IntersectionObserver`, marca todo como visible.
- `src/components/global/Preloader.astro:30`: `<noscript>` lo oculta sin JS. `src/styles/components/preloader.css:73`: **red de seguridad** que lo oculta a los 3 s aunque el JS se rompa a mitad de camino.
- `tools/smoke-test.mjs`, prueba "Sin JS: nada queda oculto": lo verifica en cada corrida.

## 6. Estilos que se pisan (la cascada)

**Problema:** al separar un CSS compilado en archivos, cambia el orden de las reglas. Dos reglas con la **misma especificidad** sobre el mismo elemento las decide el orden: si se mueve una, cambia cuál gana. Tampoco hay que agregar especificidad sin querer.

**Dónde se evita:**
- `src/styles/index.css:18` y siguientes: los `@import` siguen **el orden de las secciones del `custom.css` original**. El comentario del encabezado avisa que no se reordene.
- `src/layouts/BaseLayout.astro`: Bootstrap → plugins → `index.css`, el mismo orden que los `<link>` del original.
- `src/styles/components/why-choose-us.css:202`, comentario "Cascada:": la única regla responsive que, junto a su componente, perdía contra una regla posterior. Vive en el archivo posterior.
- `src/styles/vendor/slicknav.css:201`: `:where(...)` deja la especificidad en 0 para el reset del `<button>` del menú. Así las reglas del autor siguen ganando (con especificidad normal, el reset las pisaba y el menú cambiaba de color y tamaño).
- **No** se usan los `<style>` con alcance de Astro (agregan `[data-astro-cid]` y suben la especificidad): ver `ARQUITECTURA.md`.
- **Verificación:** `tools/computed-styles.mjs` compara `getComputedStyle` de todos los elementos con JS apagado. Dio 0 diferencias en 18 páginas × 5 anchos (`VERIFICACION.md`).

## 7. Fondos CSS sin optimizar y LCP tardío

**Problema:** una foto que está en `background-image` de un CSS no la optimiza ningún `<Image>`, y el navegador la descubre recién cuando aplicó el CSS. Si es el elemento más grande de la pantalla (el LCP), retrasa toda la métrica.

**Dónde se evita:**
- `src/lib/background-image.ts:34`, `backgroundImageStyle()`: AVIF/WebP en dos tamaños, pasados al CSS como custom properties (`--hero-bg-image`, `-sm`).
- `src/lib/background-image.ts:68`, `backgroundPreloadLinks()`, y `PreloadBackground.astro`: `<link rel="preload" fetchpriority="high">` con `media`, para bajar solo la versión que corresponde a la pantalla.
- **Trampa:** `src/components/sections/CtaBox.astro:21`, `{ mobile: false }`. Si el CSS del autor no usa `background-size: cover`, la foto se pinta a su tamaño natural: achicarla cambia el encuadre y se repite. Lo mostró la comparación de píxeles en celular.

## 8. `<script>` de componente en el lugar equivocado

**Problema (específico de Astro):** un `<script>` dentro de un componente se inserta **donde se usa el componente**. Si el componente va dentro de un contenedor del diseño, el `<script>` pasa a ser el último hijo y rompe selectores como `ul:last-child { margin-bottom: 0 }`. Pasó en `.section-footer-text`: +15 px de alto en 4 páginas.

**Dónde se evita:** `src/scripts/global.ts:43`. Ningún componente de sección o tarjeta tiene `<script>`: todo se carga desde `global.ts`. El comentario de esa línea cuenta el caso.

## 9. Accesibilidad que el original rompía

- `src/styles/a11y.css:5`: `:focus-visible` con contorno. El original tenía `a:focus { outline: 0 }` (`base.css:83`) y no se veía dónde estaba el foco con teclado.
- `src/layouts/BaseLayout.astro`: `viewport` sin `maximum-scale=1` (el original impedía hacer zoom).
- `src/styles/a11y.css:35`: `prefers-reduced-motion` desactiva las animaciones.
- Imágenes de contenido con `alt` descriptivo (el original tenía `alt=""` en todas), ids únicos en los acordeones y `aria-expanded`/`aria-controls` en el menú y las FAQs.

## 10. Medir mal (errores de la propia verificación)

Errores que se cometieron durante la reconstrucción y que vale la pena recordar:
- **Un build fallido que parece exitoso:** filtrar la salida con `grep` escondió un error y se midió un `dist/` viejo. Hay que revisar el código de salida (`.tmp/rebuild.ps1` lo imprime).
- **En Windows**, los servidores de preview bloquean `dist/` (`EPERM` en el build): hay que cerrarlos antes de compilar.
- **Chromium headless** no entrega los `IntersectionObserver` durante un `page.evaluate` largo: `tools/compare.mjs` scrollea paso a paso desde Node.
- **Imágenes `lazy`** que no llegan a pedirse en un scroll rápido: `compare.mjs` las fuerza antes de capturar, en los dos lados.
