# Traspaso: estado del trabajo (30/09/2026, segunda sesión)

Rama: **`rebuild/astro`** (pusheada). La rama `main` no se toca.

## Hecho
- Fases 1 y 2 completas (ver commits anteriores y `docs/VERIFICACION.md`).
- Base de la Fase 3: layout, header, footer, contenido y scripts globales.
- `referencia/` (la demo original) **ahora está versionada**: el usuario la sacó del `.gitignore`. El repositorio tiene que ser privado.
- Las herramientas de `tools/` aceptan `PW_CHROMIUM_PATH` (Chromium ya instalado; en la nube: `/opt/pw-browsers/chromium`).
- `tools/lh-summary.mjs`: resume informes de Lighthouse en tabla Markdown.
- **Lighthouse "antes" medido en local** (Lighthouse 13.5, original servido desde `referencia/`): `docs/lighthouse/antes-local-{index,index-slider,about,blog}-{mobile,desktop}.json`. En celular: Performance 45–62, LCP 7,9–10,2 s.
- `docs/DECISIONES.md`: ya están anotadas la unificación de textos ("s" de services y cargo de Elena → texto del listado), `referencia/` versionada, `PW_CHROMIUM_PATH` y el criterio de Lighthouse local.

## Fase 3: subagentes lanzados y FRENADOS a mitad de camino
Los 4 subagentes (A, B, C y D de `docs/CONTRATOS.md`) se frenaron por falta de tokens. **Su trabajo está commiteado tal como quedó, sin revisar.** `npx astro check` da 0 errores y 0 advertencias en ese estado, pero **nada está verificado visualmente todavía**.

Qué dejó cada uno (y lo que estaba haciendo al frenarse):
- **A** (secciones, cards, home): `src/components/sections/*` (incluye `TrustedByList.astro`, que no estaba en el contrato), `src/components/cards/*`, `src/pages/index*.astro`. Estaba escribiendo "las tres páginas" de la home: **revisá que `index.astro`, `index-slider.astro` e `index-video.astro` estén completas**.
- **B** (listados y detalles): `src/pages/{services,portfolio,blog,team}/**`, `src/components/ui/Pagination.astro`, `src/components/detail/*`, cuerpos Markdown de las 4 colecciones y campos agregados en `src/content.config.ts`. Iba a correr check y verificar las páginas: **falta la verificación**.
- **C** (páginas fijas): about, testimonials, image-gallery, video-gallery, faqs, contact, 404 y `src/components/ui/*` (ContactForm, OurApproach, WhatWeDo, SidebarCtaBox, `gallery-alt.ts`). Estaba por hacer la comparación final de las 7 páginas.
- **D** (scripts): `src/scripts/{sliders,lightbox,gallery-filter,counters,contact-form,accordion,lazy-video}.ts` y `src/pages/dev/d-[page].astro`. Estaba escribiendo `accordion.ts` y `lazy-video.ts`: **revisá que estén completos**.

## Pendiente
1. Revisar y terminar lo de cada agente (arriba). Verificar cada página con `compare.mjs` contra el original (1440 y 390 px) y medir el ruido.
2. Borrar `src/pages/dev/`.
3. Fase 4:
   - `npm run build` + `astro check` sin errores ni advertencias. Sitemap y SEO.
   - Comparación visual final de todo el sitio (1440 y 390 px, oscuro y claro) con el ruido (original contra sí mismo). Actualizar `docs/VERIFICACION.md`.
   - Lighthouse del build (`npx astro preview`) en las mismas 4 páginas y 2 formatos que el "antes" → `docs/RENDIMIENTO.md` con la tabla antes/después (`node tools/lh-summary.mjs ...`).
   - Documentación: `ARQUITECTURA.md`, `TOKENS.md`, `ERRORES-COMUNES.md` (con ubicación exacta en el código), `COMPILADO-VS-FUENTE.md` (3 ejemplos lado a lado), `COMO-USAR-DE-BASE.md` e `INFORME.md`.
   - Commit con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y push a `origin rebuild/astro`.

## Cómo levantar el entorno
- Original: `npm run ref` → http://localhost:5510/<pagina>.html (serve redirige `x.html` → `x`, es normal).
- Dev: `npx astro dev --port 5520` en segundo plano. **El puerto 4321 es de otro proyecto del usuario: no se toca.**
- Lighthouse en la nube: instalalo aparte (`npm i lighthouse@13` en una carpeta temporal) y corrélo con `CHROME_PATH=/opt/pw-browsers/chromium` y `--chrome-flags="--headless=new --no-sandbox"`.

## Cosas que no son obvias
- En Node 24 + Windows con "ñ" en la ruta, `fs.cpSync` se cae: hay que copiar a mano.
- Los heredocs de bash con comillas fallan en Windows: conviene usar la herramienta Write.
- En los comentarios de `.astro`, no escribir el texto literal "&lt;script": rompe el escáner de Vite.
- El header "sticky" del original nunca se activa (su JS busca una clase que no existe en el HTML): no hay que portarlo.
- La demo en línea (`html.awaikenthemes.com`) bloquea descargas automáticas con un captcha: usá `referencia/`.
