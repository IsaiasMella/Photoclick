# Decisiones

Registro de las decisiones que tomé sin consultar, con el motivo de cada una.

## Paso 0

- **Saqué `theme-panel-dynamic.js` de la copia local.** Lo sirve `demo.awaikenthemes.com`: carga Google Tag Manager, el panel de venta de la demo y un aviso de licencia. No forma parte de la plantilla ni de su diseño, así que no hace falta para compararla.
- **Los videos quedaron en `referencia/images/`.** El HTML publicado los pide a otro dominio (`demo.awaikenthemes.com/assets/videos/`). Reescribí esas rutas a `images/`, que es donde la plantilla los espera según los comentarios del propio HTML. Así la copia funciona sin conexión.
- **`referencia/` no va al repositorio** (`.gitignore`). Son 17 MB de fotos y código de una plantilla comercial. Es material de comparación, no se publica.
