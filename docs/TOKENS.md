# Tokens de diseño

Todos viven en **`src/styles/tokens.css`**. Se organizan en tres niveles:

1. **Primitivos:** valores crudos (paleta y escalas). Los colores primitivos **no** se usan en componentes. Las escalas neutras (espaciado, tipo, radios, tiempos) sí, porque no dependen del tema.
2. **Semánticos:** el *rol* de cada color (`--background`, `--accent`…). Los componentes usan estos. El **tema claro** redefine solo este nivel.
3. **De componente:** ninguno hizo falta. Los pocos valores propios de un componente están en su archivo con su justificación.

La columna **Usos** cuenta cuántas veces aparece `var(--token)` en `src/styles/` (sin contar `tokens.css`), y entre paréntesis los archivos que más lo usan.

## Cómo cambiar algo

| Quiero… | Cambio… |
|---|---|
| Otro color de acento | `--color-gold-300` (y `--color-gold-500` para el tema claro) |
| Otro fondo / color de texto | `--color-ink-950` / `--color-white-a80` (o los semánticos `--background`, `--foreground`) |
| Otras tipografías | `fonts` en `astro.config.mjs` (nombre y `cssVariable`) y `--font-family-sans` / `--font-family-serif` |
| Más aire entre secciones | La escala `--space-*` (todo el sitio usa múltiplos de 5 px) |
| Tarjetas más o menos redondeadas | `--radius-xl` (es el de casi todas las tarjetas e imágenes) |
| Animaciones más rápidas o lentas | `--duration-*` (CSS) y `src/scripts/motion.ts` (JS) |
| Otro breakpoint | **No alcanza con el token**: las `@media` no aceptan `var()`. Buscá el comentario `/* --bp-lg */` (etc.) arriba de cada `@media` y cambiá el número. También en `motion.ts` → `breakpoints` |

## 1. Primitivos

### Paleta

| Token | Valor | Qué es | Usos |
|---|---|---|---|
| `--color-white` | `#FFFFFF` | Blanco | 0 directos: alimenta a `--foreground-strong`, `--on-image` y `--surface-highlight` |
| `--color-ink-950` | `#080808` | Negro cálido del fondo | 1 (footer, tema claro): alimenta a `--background`, `--overlay` y `--on-accent` |
| `--color-gold-300` | `#D9C18A` | Dorado de acento | 0: alimenta a `--accent` |
| `--color-gold-500` | `#A8864A` | Dorado más oscuro (solo tema claro) | 0: `--accent` en claro |
| `--color-paper-50` | `#F7F4EE` | Papel (solo tema claro) | 0: `--background` en claro |
| `--color-red-400` | `rgb(230 87 87)` | Rojo de error | 0: `--danger` |
| `--color-white-a00 / a04 / a10 / a30 / a80` | blanco al 0 / 4 / 10 / 30 / 80 % | Transparencias del original (hex de 8 dígitos) | `a30`: 1 (base) |
| `--color-ink-a00 / a04 / a10 / a50 / a56 / a80` | negro al 0 / 4 / 10 / 50 / 56 / 80 % | Velos sobre fotos y bordes del tema claro | vía `--overlay-*` |

### Tipografía

| Token | Valor | Usos |
|---|---|---|
| `--font-family-sans` | Mona Sans (variable `--font-mona-sans` de la API de fuentes) | vía `--font-body` |
| `--font-family-serif` | Playfair Display (`--font-playfair`) | vía `--font-display` |
| `--text-xs` | 14px | 9 (services, footer, forms) |
| `--text-sm` | 16px | 26 (blog-single, header, packages): tamaño del cuerpo |
| `--text-md` | 18px | 42 (blog-single, footer, faqs): **el más usado** |
| `--text-lg` | 20px | 34 (packages, blog-single, faqs) |
| `--text-xl` | 22px | 2 |
| `--text-2xl` | 24px | 3 |
| `--text-3xl` | 26px | 4 |
| `--text-4xl` | 28px | 3 |
| `--text-5xl` | 30px | 1 |
| `--text-6xl` | 34px | 1 |
| `--text-7xl` | 36px | 4 |
| `--text-8xl` | 40px | 2 |
| `--text-9xl` | 46px | 4: h2 de sección |
| `--text-10xl` | 48px | 1 |
| `--text-11xl` | 52px | 1 |
| `--text-display` | 76px | 3: h1 del hero y de las cabeceras |
| `--font-weight-regular / medium / semibold / bold / black` | 400 / 500 / 600 / 700 / 900 | 9 / 8 / 22 / 1 / 6 |
| `--leading-none / tight / snug / normal / relaxed / loose` | 1 / 1.2 / 1.3 / 1.4 / 1.5 / 1.6 em | 8 / 3 / 2 / 5 / 10 / 1 |
| `--tracking-tight` | -0.02em | 5: títulos grandes |

La escala tipográfica es **la del original, valor por valor** (16 tamaños). Una escala propia más corta sería más prolija, pero cambiaría el diseño. Para un proyecto nuevo conviene reducirla (ver `COMO-USAR-DE-BASE.md`).

### Espaciado: `--space-N` = N × 5 px

| Token | px | Usos | Token | px | Usos |
|---|---|---|---|---|---|
| `--space-1` | 5 | 14 | `--space-10` | 50 | 8 |
| `--space-2` | 10 | 81 | `--space-12` | 60 | 54 |
| `--space-3` | 15 | 96 | `--space-16` | 80 | 4 |
| `--space-4` | 20 | 126 | `--space-18` | 90 | 10 |
| `--space-5` | 25 | 13 | `--space-20` | 100 | 1 |
| `--space-6` | 30 | **136** | `--space-24` | 120 | 28: padding vertical de secciones |
| `--space-8` | 40 | 46 | | | |

Se aplica a `margin`, `padding`, `gap` y desplazamientos (`top`/`left`…). Los valores que no son múltiplos de la escala (8, 12, 17 px…) quedaron literales: ver `INFORME.md`.

### Radios, desenfoque y movimiento

| Token | Valor | Usos |
|---|---|---|
| `--radius-xs / sm / md / lg` | 5 / 6 / 8 / 10 px | 2 / 2 / 4 / 13 |
| `--radius-xl` | 14px | **63**: tarjetas e imágenes |
| `--radius-2xl` | 120px | 2 (collage de about) |
| `--radius-pill` | 1000px | 10 (etiquetas, filtros) |
| `--radius-full` | 50% | 23 (círculos) |
| `--blur-sm / md / lg` | 10 / 15 / 30 px | 7 / 2 / 24: efecto "vidrio" (`backdrop-filter`) |
| `--duration-instant / fast / base / slow / slower` | 0.1 / 0.3 / **0.4** / 0.5 / 0.6 s | 1 / 12 / 31 / 4 / 7 |
| `--duration-spin` | 1.5s | 1 (anillo del preloader) |
| `--duration-rotate-slow` | 20s | 1 (círculo "Book your date") |
| `--duration-reveal` | 1s | 1 (aparición al scroll) |
| `--ease-in-out / out / linear` | — | 51 / 1 / 4 |
| `--bp-xxl / lg / md / sm` | 1440 / 1024 / 991 / 767 px | Documentación: las `@media` los repiten literales con un comentario |

## 2. Semánticos (tema oscuro = el original)

| Token | Valor (oscuro) | Valor (claro) | Qué representa | Usos |
|---|---|---|---|---|
| `--background` | ink-950 | paper-50 | Fondo de la página y "marcos" de fotos | 5 |
| `--foreground` | white-a80 | tinta al 72 % | Texto corrido | 2 + herencia desde `body` |
| `--foreground-strong` | white | ink-950 | Títulos, enlaces, íconos | 33 |
| `--accent` | gold-300 | gold-500 | Dorado: botones, detalles, cursivas | 51 |
| `--surface` | white-a04 | ink-a04 | Fondo de tarjetas "vidrio" | 28 |
| `--border` | white-a10 | ink-a10 | Divisores y bordes | 35 |
| `--border-subtle` | white-a00 | ink-a00 | `--dark-divider-color` del original (no lo usaba nadie; se conserva) | 0 |
| `--danger` | red-400 | — | Errores de formulario | 1 |
| `--on-accent` | ink-950 | — (constante) | Texto sobre el dorado o sobre blanco | 23 |
| `--on-image` | white | — (constante) | Texto sobre fotografías | 22 |
| `--surface-highlight` | white | — (constante) | Relleno de hover de los botones | 5 |
| `--overlay` / `-0` / `-50` / `-56` / `-80` | ink al 100 / 0 / 50 / 56 / 80 % | — (constantes) | Velos sobre fotos | 10 / 6 / 2 / 5 / 5 |
| `--font-body` / `--font-display` | sans / serif | — | Familia del cuerpo y de las cursivas de los títulos | 1 / 4 |

**Por qué `--on-image`, `--surface-highlight` y `--foreground-strong` son tres tokens si en el original eran uno solo (`--white-color`).** El autor usaba "blanco" para tres cosas distintas: texto sobre fotos, relleno de botones y títulos. En oscuro coinciden, pero en claro los títulos pasan a ser negros y el texto sobre fotos tiene que seguir blanco. Separarlos es lo que permite el tema claro.

### Islas oscuras (tema claro)

Al final de `tokens.css`, los contenedores que van **sobre una foto** (`.hero`, `.page-header`, `.cta-box`, tarjetas con texto encima de la imagen, el footer…) vuelven a declarar los semánticos del tema oscuro. Como las custom properties se heredan, todo lo de adentro "ve" el tema oscuro sin tocar ninguna regla de componente. Detalle: también reaplican `color`, porque el `color` heredado viene ya calculado del `<body>`.

## Tokens para JavaScript: `src/scripts/motion.ts`

| Constante | Valor | Dónde |
|---|---|---|
| `durations.menuSlide` | 200 ms | Menú de celular (default de SlickNav) |
| `durations.preloaderFade` | 600 ms | Salida del preloader (`fadeOut(600)` del original) |
| `durations.lightboxZoom` | 300 ms | Zoom del visor |
| `durations.counter` / `skillBar` | 3000 / 2000 ms | Contadores y barras |
| `eases.reveal / textBounce / cursor` | power2.out / back.out / expo.out | Curvas de GSAP |
| `breakpoints` | 1440 / 1024 / 991 / 767 | Espejo de `--bp-*` |

Los scripts de interactividad (sliders, visor, filtro) tienen además su propio objeto de constantes al principio del archivo, con los valores de `function.js`.
