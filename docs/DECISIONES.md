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
- **Lighthouse "antes" medido en local.** La línea base de `docs/lighthouse/original-*.json` se midió contra la demo en línea (otra red, otro servidor, con el panel comercial). Para que la comparación sea justa, el "antes" y el "después" se midieron en la misma máquina, con el mismo Lighthouse (13.5, celular simulado y escritorio): el original servido desde `referencia/` y el build servido con `astro preview`. La medición en línea queda como referencia histórica.
