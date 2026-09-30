# Traspaso: estado del trabajo (30/09/2026)

Rama: `rebuild/astro`, con 2 commits sobre `main`: Fase 2 y la base de la Fase 3. Nada está pusheado todavía.

## Hecho y verificado
- **Paso 0:** la demo completa está en `referencia/` (en `.gitignore`). La copia local es idéntica a la original: 0 % de diferencia salvo los carruseles.
- **Línea base de Lighthouse** (celular, demo en línea): Performance 56, LCP 8,3 s, 7,98 MB, SEO 58. Está en `docs/lighthouse/`.
- **Fase 1:** `docs/PLAN.md` (decisiones D1–D10 aprobadas por el usuario) y `docs/DECISIONES.md`.
- **Fase 2:**
  - `src/styles/`: `tokens.css` en 3 niveles, tema claro con "islas oscuras" y 36 archivos por componente, generados desde custom.css.
  - Subconjunto de Bootstrap 5.3.3 por Sass, CSS de plugins legible, `icons.css` (SVG + subconjunto de fuente de 776 B para los glifos de `content:`), `animations.css` (reemplaza a animate.css) y `a11y.css`.
  - **0 diferencias de estilos computados** en 18 páginas × 5 anchos. Resultados en `docs/VERIFICACION.md`.
- **Fase 3, base:**
  - `BaseLayout.astro`, `Seo`, `ThemeScript` (sin flash de tema), `Header` (menú de celular generado en el servidor, 0 % de diferencia abierto), `Footer`, `PageHeader`, `Preloader` (D2), `ThemeToggle` (D1), `Icon` (D3).
  - `src/data/site.ts`, `src/lib/{background-image,wow}.ts` y `src/content.config.ts`, con el contenido extraído del original (`tools/extract-content.mjs`).
  - Scripts globales en `src/scripts/`: reveal, text-animations (GSAP), cursor, parallax, smooth-scroll y mobile-menu.
- `astro check` da 0 errores y 0 advertencias.

## Pendiente
1. **Fase 3, subagentes:** los contratos están en `docs/CONTRATOS.md`. Hay 4 agentes (A: secciones y home · B: colecciones y detalles · C: páginas fijas · D: scripts). No llegué a lanzarlos.
2. Borrar `src/pages/dev/`.
3. **Fase 4:**
   - `npm run build` limpio.
   - Comparación final de las 18 páginas.
   - Lighthouse después de los cambios → `docs/RENDIMIENTO.md`.
   - Documentación: `ARQUITECTURA.md`, `TOKENS.md`, `ERRORES-COMUNES.md`, `COMPILADO-VS-FUENTE.md`, `COMO-USAR-DE-BASE.md` e `INFORME.md`.
   - Commit y push.

## Cosas que no son obvias
- El puerto 4321 lo usa otro proyecto del usuario. Puertos de este proyecto: referencia en **5510** (`npm run ref`), dev en **5520** y la copia de CSS de la Fase 2 en **5511**.
- En Node 24 + Windows con "ñ" en la ruta, `fs.cpSync` se cae: hay que copiar a mano.
- Los heredocs de bash con comillas fallan en silencio: conviene usar la herramienta Write.
- En los comentarios de `.astro`, no escribir el texto literal "&lt;script": rompe el escáner de Vite.
- El header "sticky" del original nunca se activa (su JS busca una clase que no existe en el HTML): no hay que portarlo.
- Las variantes de texto entre páginas (una "s" en services y el cargo de Elena) se resolvieron usando el texto del listado. **Falta anotarlo en `DECISIONES.md`.**
- Los scripts de migración de CSS (`migrate_css.py`, `cssparse.py`) quedaron en el scratchpad de la sesión; si hace falta regenerar, lo que se versiona es el resultado en `src/styles/`.
