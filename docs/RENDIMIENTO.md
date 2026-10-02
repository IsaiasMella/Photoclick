# Rendimiento: antes y después

Medición con **Lighthouse 13.5** en la misma máquina, con el mismo servidor estático (`serve`, con gzip) y la misma configuración:
- **Celular:** Moto G simulado, 4G lento (1,6 Mbps, 150 ms) y CPU 4× más lenta.
- **Escritorio:** preset `desktop`.

| | Origen | Archivos |
|---|---|---|
| **Antes** | El original (`referencia/`) | `docs/lighthouse/antes-local-*.json` |
| **Después** | El build de Astro (`dist/`) | `docs/lighthouse/despues-local-*.json` |

Para regenerar la tabla: `node tools/lh-summary.mjs docs/lighthouse/antes-local-*.json docs/lighthouse/despues-local-*.json`.

## Resumen para el dueño

| Celular | Original | Nuevo | Mejora |
|---|---|---|---|
| Puntaje de rendimiento (home) | **45** | **93** | +48 puntos |
| LCP: cuándo se ve lo principal (home) | **9,0 s** | **3,2 s** | 2,8× más rápido |
| FCP: primer contenido (home) | 4,1 s | 1,2 s | 3,4× más rápido |
| Speed Index (home) | 5,1 s | 1,3 s | 3,9× más rápido |
| Bloqueo del hilo principal (home) | 755 ms | 29 ms | 26× menos |
| Peso de la home | **4,65 MB** | **0,71 MB** | 6,5× más liviana |
| Pedidos de red (home) | 77 | 35 | menos de la mitad |
| Accesibilidad / SEO / Buenas prácticas | 84 / 91 / 96 | **100 / 100 / 100** | |

**El mismo diseño, píxel por píxel** (ver `VERIFICACION.md`), cargando unas 3 veces más rápido en celular y pesando 6 veces menos.

## Tabla completa

| Página | Formato | Perf antes → después | LCP | FCP | Speed Index | TBT | CLS | Peso | Pedidos | A11y | SEO | BP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| index | celular | 45 → **93** | 9,0 → **3,2 s** | 4,1 → 1,2 s | 5,1 → 1,3 s | 755 → 29 ms | 0 → 0 | 4,65 → **0,71 MB** | 77 → 35 | 84 → 100 | 91 → 100 | 96 → 100 |
| index | escritorio | 91 → **100** | 1,7 → 0,7 s | 0,7 → 0,3 s | 1,3 → 0,4 s | 107 → 18 ms | 0 → 0 | 4,65 → 0,76 MB | 78 → 41 | 84 → 100 | 91 → 100 | 96 → 100 |
| index-slider | celular | 58 → **92** | 7,9 → **3,4 s** | 4,1 → 1,4 s | 6,5 → 1,4 s | 227 → 26 ms | 0 → 0 | 4,29 → 0,82 MB | 79 → 38 | 86 → 100 | 91 → 100 | 96 → 100 |
| index-slider | escritorio | 93 → **100** | 1,4 → 0,8 s | 0,7 → 0,3 s | 1,5 → 0,5 s | 84 → 21 ms | 0 → 0 | 4,29 → 1,01 MB | 79 → 44 | 85 → 100 | 91 → 100 | 96 → 100 |
| about | celular | 59 → **93** | 10,2 → **3,2 s** | 4,1 → 1,4 s | 6,0 → 1,4 s | 174 → 7 ms | 0 → 0 | 2,35 → 0,39 MB | 64 → 31 | 84 → 100 | 91 → 100 | 96 → 100 |
| about | escritorio | 91 → **100** | 1,9 → 0,7 s | 0,7 → 0,3 s | 1,1 → 0,4 s | 22 → 0 ms | 0 → 0 | 2,47 → 0,51 MB | 64 → 34 | 84 → 100 | 91 → 100 | 96 → 100 |
| blog | celular | 62 → **96** | 8,9 → **2,7 s** | 3,9 → 1,4 s | 5,9 → 1,4 s | 53 → 0 ms | 0 → 0 | 1,54 → 0,45 MB | 45 → 23 | 84 → 100 | 91 → 100 | 96 → 100 |
| blog | escritorio | 92 → **100** | 1,7 → 0,6 s | 0,7 → 0,4 s | 1,1 → 0,4 s | 0 → 0 ms | 0 → 0 | 1,54 → 0,34 MB | 45 → 26 | 82 → 100 | 91 → 100 | 96 → 100 |

> La demo **en línea** medía todavía peor (celular: 56 puntos, LCP 8,3 s, 7,98 MB; `docs/lighthouse/original-index-slider-mobile.json`), porque además carga el panel comercial y Google Tag Manager. La comparación justa es la local de arriba.

## Objetivos del plan

| Objetivo (`PLAN.md` §6) | Resultado |
|---|---|
| Performance ≥ 95 | ✅ escritorio (99–100) y blog en celular (96). ⚠️ home, slider y about en celular: 92–93 |
| LCP < 2,5 s | ✅ escritorio (0,6–0,8 s). ⚠️ celular simulado: 2,7–3,4 s |
| Home < 1,5 MB sin videos | ✅ 0,71 MB (slider: 0,82 MB) |

**Por qué el LCP de celular queda en 2,7–3,4 s.** Es un número **simulado**. Lighthouse reparte en una red de 1,6 Mbps todo lo que se pide con prioridad alta en la primera pantalla: el HTML, las 2 fuentes, la foto del hero y las primeras fotos visibles. En la misma corrida, el LCP **observado** (el que el navegador midió de verdad) es de **120–160 ms**. Para bajar más el simulado habría que cambiar el diseño: menos fotos visibles en la primera pantalla de celular, o un hero más liviano. Eso queda fuera de "idéntico al original".

## Qué hizo la diferencia (de mayor a menor impacto)

1. **El preloader ya no espera la última imagen** (D2). El original tapaba la página hasta el evento `load`, o sea, hasta que terminaba de bajar la última imagen de la página. Esa sola decisión explica la mayor parte de los 9 s de LCP. → `src/components/global/Preloader.astro`
2. **Imágenes optimizadas.** AVIF/WebP con `srcset` y tamaños por columna, `width`/`height` siempre y `lazy` fuera de la primera pantalla. Los fondos CSS también se optimizan (D9) y la foto del LCP se precarga. → `astro:assets`, `src/lib/background-image.ts`, `PreloadBackground.astro`
3. **Afuera ~1 MB de librerías:**
   - jQuery, Bootstrap JS completo, YTPlayer (no se usaba), animate.css (73 KB para una animación), Font Awesome (75 KB de CSS + ~400 KB de fuentes para 11 íconos), WOW, SlickNav, Magnific, Waypoints, counterUp y validator: reemplazados por ~10 KB de TypeScript propio o por SVG en línea.
   - Bootstrap CSS: de 232 KB a un subconjunto.
4. **JS cuando hace falta.**
   - Cada comportamiento se descarga cuando su sección se acerca a la pantalla (`load-when-near.ts`).
   - GSAP se pide después de `load`.
   - Los videos decorativos (6,5 MB) llegan con `preload="none"` y póster, y se reproducen al verse.
5. **Fuentes propias.** Servidas desde el mismo dominio y con métricas de respaldo, para que el texto no salte. Se precargan **solo las 2 caras que se usan** (el original pedía 4 a Google, de forma bloqueante).
6. **CLS = 0.** El círculo "Book your date" movía el hero 74 px al cargar. → `hero.css`, comentario "Añadido (CLS)"
