# Informe final

Reconstrucción de la demo **Photoclick** (Awaiken, ThemeForest: HTML + Bootstrap 5.3 + jQuery + 15 plugins) en **Astro 7.3 + TypeScript estricto**, tokenizada, por componentes y con contenido en Content Collections.

Rama `rebuild/astro`. El detalle de cada parte está en `ARQUITECTURA.md`, `TOKENS.md`, `VERIFICACION.md`, `RENDIMIENTO.md`, `ERRORES-COMUNES.md`, `COMPILADO-VS-FUENTE.md` y `COMO-USAR-DE-BASE.md`.

## En números

| | Original | Reconstrucción |
|---|---|---|
| Páginas | 18 HTML escritos a mano | 38 generadas (18 equivalentes + 20 detalles reales de cada servicio, proyecto, post e integrante) |
| CSS que baja el navegador | 8 archivos, ~510 KB sin comprimir (Bootstrap completo + 6 plugins + custom) | 1 archivo, 180 KB sin comprimir (35 KB con gzip) |
| JS | ~1,1 MB entre CSS y JS bloqueantes, con jQuery | ~10 KB propios + Swiper, GSAP e Isotope **solo donde se usan** y cuando la sección se acerca |
| Fuentes | Google Fonts (4 caras, bloqueante) + Font Awesome (~400 KB) | 2 caras propias precargadas + 1 subconjunto de íconos de **776 bytes** |
| Rendimiento en celular (home) | 45, LCP 9,0 s, 4,65 MB | **92**, LCP 3,3 s, **0,71 MB** |
| Accesibilidad / SEO / Buenas prácticas | 84 / 91 / 96 | **100 / 100 / 100** |
| `astro check` / `npm run build` | — | 0 errores, 0 advertencias |

## Qué quedó IDÉNTICO

- **El CSS del autor, regla por regla.** Con el HTML original y el CSS nuevo compilado, `getComputedStyle` de **todos** los elementos (y sus `::before`/`::after`) da **0 diferencias** en las 18 páginas × 5 anchos (1440, 1024, 991, 767 y 390 px).
- **La altura de todas las páginas** en 1440 y 390 px, salvo las dos excepciones de contenido de abajo.
- **El marcado y las clases** de cada sección: comparado con `tools/section-diff.mjs`. Solo cambian las URLs, las imágenes (`<img>` → AVIF/WebP con `srcset`) y los atributos de accesibilidad agregados.
- **Header, footer, cabecera de página y menú de celular abierto:** 0,000 % de diferencia de píxeles.
- **El comportamiento:** sliders (mismos parámetros de `function.js`), visor de fotos y de YouTube con el mismo DOM `.mfp-*`, filtro con Isotope, acordeón de Bootstrap, contadores, barras de habilidades, cursor, parallax, scroll suave, aparición al scroll y animaciones de texto con GSAP. Las 14 pruebas de `tools/smoke-test.mjs` pasan.

## Qué quedó PARECIDO (y por qué)

| Diferencia | Dónde | Por qué |
|---|---|---|
| El sidebar del detalle de servicio lista **6** servicios (el original, 5 escritos a mano) | `/services/<slug>/` | Sale de la colección: son los 6 reales. En celular la página queda **55 px** más alta; en escritorio no cambia |
| El título del detalle de portfolio es el del proyecto ("Achieve Fitness Goal Natural") y no el fijo del original ("Bridal portrait photography") | `/portfolio/<slug>/` | Cada proyecto tiene su página. En celular el título ocupa una línea más: +22 px |
| "location" → "locations" (servicios, home) y el cargo de Elena Rossi | home, `/about/` | El dato existe una sola vez en la colección; se usó el texto del listado |
| Paginación del blog: se ve "1" y las flechas deshabilitadas (el original mostraba "1 2 3" falsos) | `/blog/` | D5: paginación real con 6 posts por página |
| Etiquetas del post: "Modern Poses" en vez de "Morder Poses" | detalles de post | Error de tipeo del original |
| Diferencia de píxeles de fondo, 0,1 – 1,3 % en todas las páginas | todo el sitio | Recompresión de las fotos (AVIF/WebP) y antialiasing de los íconos (SVG en vez de fuente). Las alturas y los estilos computados coinciden |
| Fotogramas distintos en videos, sliders y títulos de GSAP (hasta ~8 % en algunas capturas) | homes, about, services, testimonials | Movimiento: el ruido del original contra sí mismo llega a 3,4 %. Además, el video diferido sale negro en la captura de página completa cuando queda pausado fuera de pantalla (artefacto de Chromium headless; en el navegador se ve, comprobado con una captura de la sección) |
| Botón flotante de tema (abajo a la izquierda) | todas | D1: el único elemento agregado. Las comparaciones lo ocultan |
| La animación de los títulos arranca unos milisegundos después | todas | GSAP se descarga después de `load`, para no competir con el LCP. El texto está visible desde el primer pintado |
| Los videos decorativos arrancan al entrar en pantalla (antes: al cargar) | intro y paquetes | D8: 6,5 MB que ya no bajan en la carga inicial. Tienen póster con el primer fotograma, así que se ven igual |
| El preloader se va al terminar el HTML (antes: al terminar la última imagen) | todas | D2: era la causa principal del LCP de 9 s |

## Qué NO se pudo tokenizar (y queda literal, a propósito)

- **319 de 2706 declaraciones** del CSS del autor conservan algún `px` literal:
  - geometría propia de un componente: `width`/`height`/`max-width` de íconos, avatares, círculos y alturas mínimas de secciones (≈190);
  - paddings con valores fuera de la escala de 5 px, como `17px 59px 17px 24px` en los botones (≈36);
  - bordes de 1 px y `background-size` de íconos.
  
  Convertirlos en tokens sería crear un token por uso, sin ganar nada. Cada archivo de componente es el lugar natural para cambiarlos.
- **Breakpoints:** las `@media` no aceptan `var()`. Van literales con el comentario `/* --bp-* */` del token al que corresponden.
- **CSS de plugins** (`vendor/slicknav.css`, `magnific-popup.css`, `cursor.css`, `icons.css`): son valores de los plugins, no del diseño. Quedan como estaban, con un comentario en el encabezado.
- **Bootstrap:** se compila con sus propias variables Sass. No se mapearon a los tokens porque el diseño solo usa su grilla y algunos componentes, y el CSS del autor los sobreescribe.
- **Colores literales en componentes: 0.** El único valor de color fuera de la paleta (`rgba(8,8,8,.72)`, texto del tema claro) está en `tokens.css` con su justificación de contraste.

## Qué NO se pudo verificar

- **Navegadores reales distintos de Chromium** (Safari y Firefox): todas las capturas y pruebas son con Chromium de Playwright. `image-set()` con `type()`, `:where()`, AVIF y `backdrop-filter` tienen buen soporte, pero no se probaron a mano.
- **El envío real de formularios:** no hay backend (el original tampoco tenía: `form-process.php` no existe). Queda configurable con `PUBLIC_FORM_ENDPOINT` (D6). Se verificó la validación y el mensaje de error; el `fetch` a un endpoint real, no.
- **La comparación por píxeles en tema claro** solo puede ser contra sí misma: el original no tiene tema claro. Se revisaron capturas a ojo y se corrigieron el texto sobre fotos (islas oscuras), el fondo del footer y el color heredado.
- **Lighthouse en una red real:** las mediciones son simuladas en local, iguales para el antes y el después. El LCP observado real (~150 ms) no representa un celular de verdad en 4G.
- **Las páginas 2+ del blog:** con 6 posts hay una sola página. `paginate()` y `routes.blogPage` están, pero `/blog/page/2/` no se pudo ver con contenido real.
- **El rendimiento en celular quedó en 92–93** en la home, el slider y about (objetivo: 95). Ver `RENDIMIENTO.md`: el límite es el diseño (varias fotos grandes en la primera pantalla de celular), no el código.

## Qué se decidió sin consultar

Todo está en `DECISIONES.md` con su justificación. Las más importantes:

1. **Las 10 decisiones del plan (D1–D10)**, aprobadas por el usuario con las opciones recomendadas: tema claro con botón flotante, preloader en `DOMContentLoaded`, íconos SVG, scroll suave diferido, paginación real, formularios configurables, YTPlayer eliminado, videos diferidos, fondos optimizados y SEO completo.
2. **CSS global en un solo punto de entrada**, sin estilos con alcance de Astro, para conservar la cascada.
3. **Isotope se mantuvo** (cargado bajo demanda) en lugar de un reemplazo propio: el masonry tiene redondeos propios difíciles de igualar.
4. **Comportamientos cargados desde `global.ts` con `loadWhenNear`**, y no con `<script>` en cada componente. Lo motivaron dos problemas reales: el `<script>` rompía un `:last-child` del autor (+15 px) y competía con el LCP.
5. **Subconjunto de Font Awesome** (776 B) para los glifos que el CSS del autor pide con `content:`, en vez de reescribir ese CSS.
6. **Solo las 2 caras de fuente usadas** (`styles` en la config de fuentes). Antes se declaraban y precargaban 4.
7. **El CSS en archivo externo** (`inlineStylesheets: 'auto'`): incrustarlo se probó y dio peor en celular.
8. **Correcciones pequeñas del original que no cambian el aspecto:**
   - el `</footer>` duplicado;
   - los ids repetidos en los acordeones;
   - `<a>` dentro de `<a>` en el menú de celular;
   - `--black-color` sin definir;
   - `lang="zxx"` y `maximum-scale=1`;
   - el foco invisible;
   - `alt` vacíos en fotos de contenido.
9. **Lighthouse medido en local** contra el original servido desde `referencia/`, para comparar en igualdad de condiciones. La medición contra la demo en línea queda como referencia.
10. **`referencia/` versionada** por pedido del usuario. El repositorio tiene que seguir siendo privado: es material de una plantilla comercial.

## Advertencia de licencia

Photoclick y sus imágenes son de **Awaiken / ThemeForest**. Este trabajo sirve para estudiar y para mostrarle al propio autor una versión que rinde mucho mejor. Publicarlo o usarlo para un cliente requiere la licencia de la plantilla, o reemplazar diseño, textos e imágenes (`COMO-USAR-DE-BASE.md`).
