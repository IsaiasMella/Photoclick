# Photoclick en Astro

Reconstrucción de la plantilla **Photoclick** (Awaiken, ThemeForest) en **Astro 7 + TypeScript estricto**. Mismo diseño, píxel por píxel, con código tokenizado, por componentes y unas **3 veces más rápido en celular** (Lighthouse: 45 → 92 en la home, 4,65 → 0,71 MB).

```bash
npm install
npm run dev       # http://localhost:5520
npm run build     # astro check + sitio estático en dist/
npm run preview   # http://localhost:5521
npm run ref       # la plantilla original (referencia/) en http://localhost:5510
```

## Documentación (`docs/`)

| Archivo | Para qué |
|---|---|
| [INFORME.md](docs/INFORME.md) | Resumen: qué quedó idéntico, qué parecido y por qué, qué no se verificó |
| [RENDIMIENTO.md](docs/RENDIMIENTO.md) | Lighthouse antes y después |
| [ARQUITECTURA.md](docs/ARQUITECTURA.md) | Mapa de carpetas, flujo del contenido, equivalencias con React/Next y orden de lectura |
| [TOKENS.md](docs/TOKENS.md) | Cada token de diseño: qué es, dónde se usa y cómo cambiarlo |
| [ERRORES-COMUNES.md](docs/ERRORES-COMUNES.md) | Flash de tema y de fuentes, CLS, JS de más, cascada… y dónde se evita cada uno |
| [COMPILADO-VS-FUENTE.md](docs/COMPILADO-VS-FUENTE.md) | Tres ejemplos del antes y el después |
| [COMO-USAR-DE-BASE.md](docs/COMO-USAR-DE-BASE.md) | Qué cambiar para un diseño propio y qué queda igual |
| [VERIFICACION.md](docs/VERIFICACION.md) | Cómo se comparó contra el original, con resultados |
| [PLAN.md](docs/PLAN.md) · [DECISIONES.md](docs/DECISIONES.md) | El plan aprobado y cada decisión con su motivo |

> **Licencia:** el diseño, los textos y las imágenes son de Awaiken (ThemeForest). Sirve para estudiar y para mostrárselo al autor. Para publicarlo hace falta la licencia, o reemplazarlos.
