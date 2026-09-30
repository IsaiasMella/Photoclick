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
