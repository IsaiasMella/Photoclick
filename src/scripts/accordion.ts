/**
 * accordion.ts — Acordeones de FAQs (reemplaza a bootstrap.bundle / bootstrap.min.js).
 *
 * Lo importa cards/FaqAccordion.astro (y cualquier componente con un collapse):
 *   <script>import '@/scripts/accordion';</script>
 *
 * Engancha (data-API de Bootstrap 5, mismo marcado que el original):
 *   <button data-bs-toggle="collapse" data-bs-target="#collapse2"
 *           aria-expanded="false" aria-controls="collapse2">
 *   <div id="collapse2" class="accordion-collapse collapse" data-bs-parent="#accordion">
 *
 * El original cargaba el bundle completo de Bootstrap (≈80 KB con Popper)
 * solo para esto. El módulo collapse trae su data-API (un listener delegado
 * en document para [data-bs-toggle="collapse"]) y sus dependencias internas
 * (≈8 KB): mismo comportamiento, misma animación (la transición .collapsing
 * de 350 ms vive en el CSS de Bootstrap) y aria-expanded actualizado.
 *
 * No hay constantes propias: la duración la define el CSS (.collapsing
 * { transition: height .35s ease }) y Bootstrap la lee de ahí. Con
 * prefers-reduced-motion, Bootstrap ya anula la transición en su CSS.
 */
import 'bootstrap/js/dist/collapse';
