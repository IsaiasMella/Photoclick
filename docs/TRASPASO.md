# Traspaso: estado del trabajo (02/10/2026, cierre)

Rama **`rebuild/astro`** (la rama `main` no se toca).

## Estado: TERMINADO

- **Fases 0 a 4 completas.** Por dónde empezar a leer: `docs/INFORME.md` (resumen), `docs/RENDIMIENTO.md` (para el dueño) y `docs/ARQUITECTURA.md` (el código).
- `npm run build`: 38 páginas, sitemap, 0 errores y 0 advertencias. `astro check`: 0/0/0.
- Verificación final en `docs/VERIFICACION.md`:
  - **estilos computados:** 0 diferencias;
  - **alturas:** iguales salvo 2 diferencias de contenido documentadas;
  - **píxeles:** dentro del ruido;
  - **interactividad:** 14/14 pruebas.
- **Lighthouse en celular:** 45–62 → **92–96**. LCP de 7,9–10,2 s → 2,7–3,4 s. Peso de 4,65 → 0,71 MB.

## Si se retoma

- **Rendimiento en celular por encima de 95 en las home:** requiere cambiar el diseño de la primera pantalla de celular (menos fotos grandes visibles). Ver `RENDIMIENTO.md`.
- **Agregar `alt` a los esquemas `gallery` y `videos`**, y borrar `src/components/ui/gallery-alt.ts` (ver su encabezado).
- **Formularios:** configurar `PUBLIC_FORM_ENDPOINT` (Formspree, un endpoint propio…) y probar el envío real.
- **Antes de publicar o compartir el repo:** volver a ignorar `referencia/` (material comercial de Awaiken).

## Cómo levantar el entorno

- **Original:** `npm run ref` → http://localhost:5510/<pagina>.html (serve redirige `x.html` → `x`, es normal).
- **Dev:** `npm run dev` → http://localhost:5520. **El puerto 4321 es de otro proyecto del usuario: no se toca.**
- **Build + preview:** `npm run build && npm run preview` (:5521). Para Lighthouse se usó `npx serve -l 5522 dist`, el mismo servidor que el "antes".
- En Windows, **cerrá los servidores de preview antes de compilar**: bloquean `dist/` (`EPERM`). `.tmp/rebuild.ps1` lo hace solo, pero no está versionado.
- **Lighthouse en la nube:** `CHROME_PATH=/opt/pw-browsers/chromium` y `--chrome-flags="--headless=new --no-sandbox"`.

## Cosas que no son obvias

- En Node 24 + Windows con "ñ" en la ruta, `fs.cpSync` se cae: hay que copiar a mano.
- En los comentarios de `.astro`, no escribir el texto literal "&lt;script": rompe el escáner de Vite.
- **Comentarios en el HTML de los `.astro`: con `{/* */}`.** Los `<!-- -->` llegan al HTML publicado.
- **Ningún componente de sección o tarjeta debe tener `<script>`.** Se registran en `src/scripts/global.ts` con `loadWhenNear` (ver `ERRORES-COMUNES.md` §8).
- **Revisar el código de salida del build.** Un `grep` sobre la salida puede esconder un error y dejar un `dist/` viejo.
- **El header "sticky" del original nunca se activa:** no hay que portarlo.
- **La demo en línea bloquea descargas automáticas con un captcha:** usá `referencia/`.
