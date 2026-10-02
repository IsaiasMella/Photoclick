# Verificación visual

Herramientas (en `tools/`):

| Herramienta | Qué mide | Por qué |
|---|---|---|
| `compare.mjs` | Capturas de página completa + **pixelmatch** (umbral 0.1) y la altura de cada página | Diferencias que se ven |
| `computed-styles.mjs` | `getComputedStyle` de **todos** los elementos y sus `::before`/`::after`, con **JS desactivado** | Detecta cualquier regla que cambió de ganador, sin el ruido de carruseles ni animaciones |
| `css-swap-test.mjs` | Arma una copia de `referencia/` con el CSS nuevo en lugar del original | Aísla el CSS: mismo HTML y mismo JS, solo cambian los estilos |

Cómo se estabilizan las capturas: se recorre la página con scroll para disparar las animaciones y el lazy-load, se vuelve arriba, se esperan 3,5 s y se fuerza el estado final de las animaciones de aparición (`.wow` visible) **en los dos lados por igual**. Los carruseles (Swiper), los videos y los títulos de GSAP siguen generando ruido; por eso siempre se mide también el **original contra sí mismo**.

---

## Paso 0 — Copia local contra la demo en línea

| Página | 1440 px | 390 px | Altura |
|---|---|---|---|
| index-slider | 0,02 % | 4,95 % (carrusel) | igual |
| about | 0 % | 0 % | igual |
| blog | 0 % | 0 % | igual |
| contact | 0 % | 0 % | igual |

---

## Fase 2 — Sistema de diseño (CSS nuevo sobre el HTML original)

### A. Estilos computados: original contra CSS nuevo

**18 páginas × 5 anchos (1440, 1024, 991, 767 y 390 px) → 0 diferencias.**

En la primera corrida aparecieron 720 diferencias, todas por **una misma causa**: la regla responsive `.section-sub-heading .section-sub-title { margin-bottom: 10px }` (≤1024 px). En el original ganaba porque estaba al final, en la sección 32. Al moverla junto a `section-title.css`, pasó a perder contra una regla de `why-choose-us.css` de igual especificidad. Se reubicó en `why-choose-us.css`, con un comentario que lo explica. Después de eso: 0 diferencias.

También se probó y se descartó agregar `color-scheme: dark` al `:root`. Cambiaba el color por defecto de los controles nativos, y el original no lo declara.

### B. Píxeles (modo oscuro = el original)

La columna "Ruido" es el original comparado contra sí mismo; "CSS nuevo" es el original contra la copia con el CSS nuevo.

| Página | Ancho | Altura orig. / nueva | Ruido | CSS nuevo |
|---|---|---|---|---|
| about.html | 390 | 9400 / 9400 ✅ | 0.023 % | **0.168 %** |
| about.html | 1440 | 7807 / 7807 ✅ | 0.058 % | **0 %** |
| blog-single.html | 390 | 3519 / 3519 ✅ | 0 % | **0 %** |
| blog-single.html | 1440 | 3153 / 3153 ✅ | 0 % | **0 %** |
| blog.html | 390 | 4020 / 4020 ✅ | 0 % | **0 %** |
| blog.html | 1440 | 2612 / 2612 ✅ | 0 % | **0 %** |
| contact.html | 390 | 3027 / 3027 ✅ | 0 % | **0 %** |
| contact.html | 1440 | 3148 / 3148 ✅ | 0 % | **0 %** |
| faqs.html | 390 | 4908 / 4908 ✅ | 0 % | **0 %** |
| faqs.html | 1440 | 4521 / 4521 ✅ | 0.041 % | **0.041 %** |
| index-slider.html | 390 | 15200 / 15200 ✅ | 3.354 % | **0.064 %** |
| index-slider.html | 1440 | 12035 / 12035 ✅ | 0.016 % | **0.367 %** |
| index.html | 390 | 15200 / 15200 ✅ | 0.256 % | **0.31 %** |
| index.html | 1440 | 12035 / 12035 ✅ | 0.529 % | **0.433 %** |
| portfolio-single.html | 390 | 4837 / 4837 ✅ | 0 % | **0 %** |
| portfolio-single.html | 1440 | 4674 / 4674 ✅ | 0 % | **0 %** |
| service-single.html | 390 | 4979 / 4979 ✅ | 0 % | **0 %** |
| service-single.html | 1440 | 4028 / 4028 ✅ | 0 % | **0 %** |
| services.html | 390 | 8078 / 8078 ✅ | 0.152 % | **3.202 %** |
| services.html | 1440 | 6250 / 6250 ✅ | 0.3 % | **0.316 %** |
| team-single.html | 390 | 4863 / 4863 ✅ | 0 % | **0 %** |
| team-single.html | 1440 | 3318 / 3318 ✅ | 0 % | **0 %** |
| testimonials.html | 390 | 8787 / 8787 ✅ | 0.459 % | **0.207 %** |
| testimonials.html | 1440 | 6324 / 6324 ✅ | 1.38 % | **1.551 %** |

**Lectura:**
- **Todas las alturas son idénticas.** No hay saltos de diseño.
- Las diferencias caen dentro del ruido del original, salvo en `services` a 390 px (3,2 %). La zona que difiere (y = 3150–3470 px) es el `<video>` del bloque *intro-video*: en la captura del CSS nuevo todavía no había pintado su primer fotograma y se ve el fondo negro con el botón PLAY. Es carga de red, no CSS. Lo confirma el punto A: 0 diferencias de estilos computados en esa página y en ese ancho.

### C. Tema claro (no existe en el original)

Se comparó contra sí mismo (ruido ≤ 0,85 % en 12 páginas) y se revisaron las capturas a ojo. La primera versión mostraba texto oscuro sobre las fotos (hero, portfolio, cabeceras). Se resolvió con **"islas oscuras"**: los contenedores que van sobre una fotografía vuelven a declarar los tokens semánticos del tema oscuro (`tokens.css`, al final del archivo). No hizo falta tocar ninguna regla de componente.

Capturas: `.tmp/f2-*` (no se versionan; se regeneran con los comandos de abajo).

```bash
npm run ref                                                     # original en :5510
node tools/css-swap-test.mjs && npx serve -l 5511 -n .tmp/css-swap
node tools/computed-styles.mjs http://localhost:5510/ http://localhost:5511/
node tools/compare.mjs --a http://localhost:5510/ --b http://localhost:5511/ --out .tmp/f2-swap
```

---

## Fase 4 — Verificación final del sitio completo (build de Astro contra el original)

Build de producción (`astro preview`, :5521) contra el original (`referencia/`, :5510). Son las 18 páginas a 1440 y 390 px. Las rutas nuevas se mapean al archivo original del que salen (los detalles, contra la única página de detalle del original).

**Método** (`tools/compare.mjs`, versión final):
- Scroll paso a paso desde Node. Así los comportamientos que se cargan bajo demanda (sliders, galería) se inicializan igual que con un usuario.
- Carga forzada de las imágenes `lazy` antes de capturar.
- Las animaciones de aparición, en su estado final.
- El botón de tema (agregado) oculto.

Columnas:
- **Ruido:** el original contra sí mismo. Es la variación normal por carruseles, videos y animaciones.
- **Oscuro:** el original contra el nuevo, en el tema por defecto (el del original).
- **Claro:** el nuevo contra sí mismo en tema claro. No hay original con qué compararlo.

| Página original → nueva | Ancho | Alto orig. / nuevo | Ruido (orig. vs orig.) | **Oscuro: orig. vs nuevo** | Claro (nuevo vs nuevo) |
|---|---|---|---|---|---|
| 404.html → `/404` | 390 | 1765 / 1765 ✅ | 0.00 % | **0.79 %** | 0.00 % |
| 404.html → `/404` | 1440 | 2147 / 2147 ✅ | 0.00 % | **0.16 %** | 0.00 % |
| about.html → `/about/` | 390 | 9400 / 9400 ✅ | 0.69 % | **1.22 %** | 0.05 % |
| about.html → `/about/` | 1440 | 7807 / 7807 ✅ | 0.00 % | **7.82 %** | 0.09 % |
| blog-single.html → `/blog/how-to-pose-naturally-for-your-wedding-photos/` | 390 | 3519 / 3519 ✅ | 0.00 % | **0.55 %** | 0.00 % |
| blog-single.html → `/blog/how-to-pose-naturally-for-your-wedding-photos/` | 1440 | 3153 / 3153 ✅ | 0.00 % | **0.35 %** | 0.00 % |
| blog.html → `/blog/` | 390 | 4020 / 4020 ✅ | 0.00 % | **1.13 %** | 0.00 % |
| blog.html → `/blog/` | 1440 | 2612 / 2612 ✅ | 0.00 % | **0.68 %** | 0.00 % |
| contact.html → `/contact/` | 390 | 3027 / 3027 ✅ | 0.00 % | **0.82 %** | 0.00 % |
| contact.html → `/contact/` | 1440 | 3148 / 3148 ✅ | 0.00 % | **0.21 %** | 0.00 % |
| faqs.html → `/faqs/` | 390 | 4908 / 4908 ✅ | 0.00 % | **0.86 %** | 0.00 % |
| faqs.html → `/faqs/` | 1440 | 4521 / 4521 ✅ | 0.00 % | **0.28 %** | 0.00 % |
| image-gallery.html → `/image-gallery/` | 390 | 2238 / 2238 ✅ | 0.00 % | **0.69 %** | 0.00 % |
| image-gallery.html → `/image-gallery/` | 1440 | 2656 / 2656 ✅ | 0.00 % | **0.18 %** | 0.00 % |
| index-slider.html → `/index-slider/` | 390 | 15200 / 15200 ✅ | 0.08 % | **1.77 %** | 0.29 % |
| index-slider.html → `/index-slider/` | 1440 | 12035 / 12035 ✅ | 0.15 % | **1.77 %** | 0.51 % |
| index-video.html → `/index-video/` | 390 | 15200 / 15200 ✅ | 0.98 % | **2.67 %** | 0.59 % |
| index-video.html → `/index-video/` | 1440 | 12035 / 12035 ✅ | 1.13 % | **2.44 %** | 1.04 % |
| index.html → `/` | 390 | 15200 / 15200 ✅ | 0.28 % | **1.29 %** | 0.08 % |
| index.html → `/` | 1440 | 12035 / 12035 ✅ | 0.34 % | **1.79 %** | 0.51 % |
| portfolio-single.html → `/portfolio/achieve-fitness-goal-natural/` | 390 | 4837 / 4859 ⚠️ | 0.00 % | **23.32 %** | 0.00 % |
| portfolio-single.html → `/portfolio/achieve-fitness-goal-natural/` | 1440 | 4674 / 4674 ✅ | 0.00 % | **0.56 %** | 0.00 % |
| portfolio.html → `/portfolio/` | 390 | 3818 / 3818 ✅ | 0.00 % | **1.02 %** | 0.00 % |
| portfolio.html → `/portfolio/` | 1440 | 2474 / 2474 ✅ | 0.00 % | **0.75 %** | 0.00 % |
| service-single.html → `/services/pre-wedding-photography/` | 390 | 4979 / 5034 ⚠️ | 0.00 % | **23.35 %** | 0.00 % |
| service-single.html → `/services/pre-wedding-photography/` | 1440 | 4028 / 4028 ✅ | 0.00 % | **2.46 %** | 0.00 % |
| services.html → `/services/` | 390 | 8078 / 8078 ✅ | 0.20 % | **1.77 %** | 0.06 % |
| services.html → `/services/` | 1440 | 6250 / 6250 ✅ | 0.08 % | **1.66 %** | 1.90 % |
| team-single.html → `/team/elena-rossi/` | 390 | 4863 / 4863 ✅ | 0.00 % | **0.44 %** | 0.00 % |
| team-single.html → `/team/elena-rossi/` | 1440 | 3318 / 3318 ✅ | 0.00 % | **0.21 %** | 0.00 % |
| team.html → `/team/` | 390 | 3926 / 3926 ✅ | 0.00 % | **0.36 %** | 0.00 % |
| team.html → `/team/` | 1440 | 2461 / 2461 ✅ | 0.00 % | **0.14 %** | 0.00 % |
| testimonials.html → `/testimonials/` | 390 | 8787 / 8787 ✅ | 0.47 % | **1.64 %** | 0.06 % |
| testimonials.html → `/testimonials/` | 1440 | 6324 / 6324 ✅ | 0.32 % | **2.29 %** | 0.94 % |
| video-gallery.html → `/video-gallery/` | 390 | 4459 / 4459 ✅ | 0.00 % | **0.52 %** | 0.00 % |
| video-gallery.html → `/video-gallery/` | 1440 | 2656 / 2656 ✅ | 0.00 % | **0.14 %** | 0.00 % |

### Lectura

- **Alturas: 34 de 36 capturas son idénticas.** Las 2 que no lo son son diferencias de **contenido** aceptadas a propósito (`INFORME.md`), y solo en celular. El detalle de servicio lista los 6 servicios reales (+55 px) y el título del detalle de portfolio es el del proyecto, más largo (+22 px).
- **Píxeles:** en 33 de las 36 capturas la diferencia es de 0,1 a 2,7 %, cerca del ruido del original (hasta 1,1 %). La base de ~0,2–1 % que aparece aun en páginas sin movimiento viene de la **recompresión de las fotos** (AVIF/WebP en vez de JPG) y del antialiasing de los íconos SVG. Ninguna de las dos mueve nada de lugar.
- **`about.html` a 1440 px (7,8 %):** es una sola franja, el bloque *intro-video*. El video diferido (D8) estaba pausado fuera de pantalla en el momento de la captura de página completa, y Chromium headless lo pinta negro. Visto en el navegador muestra el póster o el video (comprobado con una captura de la sección sola). En el original no pasa porque su video nunca se pausa.
- **Detalles de servicio y portfolio a 390 px (23 %):** es la consecuencia de las alturas distintas de arriba. Desde ese punto, todo lo de abajo queda corrido.
- **Tema claro:** el ruido contra sí mismo es de 0–1,9 %, solo en páginas con sliders y videos. Las capturas se revisaron a ojo; ver la sección C de la Fase 2 para las correcciones (islas oscuras, fondo del footer, color heredado).

### Estilos computados y marcado

- La comparación de estilos computados (`tools/computed-styles.mjs`) de la Fase 2 sigue valiendo para el CSS. En la Fase 4 los cambios al CSS del autor fueron solo reglas agregadas y documentadas (`hero.css` "Añadido (CLS)", `footer.css` tema claro, `icons.css`).
- El marcado de cada sección se comparó con `tools/section-diff.mjs`, y las alturas por sección con `tools/section-heights.mjs`. Así se encontraron y corrigieron:
  - el `<script>` dentro de `.section-footer-text` (+15 px);
  - las estrellas SVG (+2 px);
  - las etiquetas de los posts (−55 px).

### Interactividad (`tools/smoke-test.mjs`): 14 de 14

Preloader · slider del hero (fundido + autoplay) · slider de testimonios (se carga al acercarse) · acordeón FAQ (abre y `aria-expanded`) · ids únicos · filtro de la galería · visor de fotos (abre, flecha, Esc) · popup de YouTube · validación del formulario · contador · menú de celular (abre, submenú, Esc) · botón de tema (cambia y persiste) · **sin JS no queda nada oculto** · paginación del blog. Sin errores de consola.

### Cómo repetirla

```bash
npm run build && npm run preview          # :5521
npm run ref                               # :5510
node tools/compare.mjs --a http://localhost:5510/ --b http://localhost:5521/ --out .tmp/final --pages "about.html=about/,blog.html=blog/"
node tools/section-heights.mjs http://localhost:5510/about.html http://localhost:5521/about/ 390
node tools/diff-regions.mjs .tmp/final/about_html_390_dark --crop .tmp/recorte.png
node tools/smoke-test.mjs http://localhost:5521/
```
