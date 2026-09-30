/**
 * reveal-on-scroll.ts — Reemplazo de WOW.js (+ animate.css).
 *
 * Contrato del marcado (igual al original):
 *   <div class="wow fadeInUp" data-wow-delay="0.4s">
 *
 * WOW.js escuchaba el scroll y medía cada elemento en cada evento. Acá un
 * único IntersectionObserver avisa cuándo entra cada uno: cero trabajo en
 * el hilo principal mientras se scrollea.
 *
 * Los elementos solo están ocultos si <html> tiene .js-reveal (lo pone el
 * script del <head>). Si este archivo no carga, se ven igual (sin animar).
 */
export function initReveal(root: ParentNode = document) {
  const items = root.querySelectorAll<HTMLElement>('.wow:not(.animated)');
  if (!items.length) return;

  if (!document.documentElement.classList.contains('js-reveal') || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('animated'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = el.dataset['wowDelay'];
        if (delay) el.style.animationDelay = delay;
        el.classList.add('animated');
        io.unobserve(el);
      }
    },
    // WOW usaba offset 0: se anima apenas asoma el primer píxel.
    { rootMargin: '0px', threshold: 0 },
  );
  items.forEach((el) => io.observe(el));
}
