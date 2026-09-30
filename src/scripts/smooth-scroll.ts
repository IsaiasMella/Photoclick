/**
 * smooth-scroll.ts — Scroll suave de la rueda del mouse (decisión D4).
 *
 * El original cargaba SmoothScroll.js (24 KB) de forma bloqueante en todas
 * las páginas y para todos. Acá se carga cuando el navegador está libre,
 * solo con mouse, y nunca con prefers-reduced-motion (a quien le molesta el
 * movimiento, el scroll "con inercia" le resulta incómodo).
 */
export function initSmoothScroll() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const load = () => void import('./vendor/smoothscroll.js');
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 3000 });
  else setTimeout(load, 1500);
}
