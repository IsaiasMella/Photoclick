/**
 * parallax.ts — Fondos con parallax (.parallaxie), porte de parallaxie.js.
 *
 * Mismo cálculo que el plugin: background-attachment fixed, y la posición
 * vertical se corre al scrollear:  y = (top del elemento − scroll) × (1 − speed).
 * El original solo lo activaba en pantallas de más de 1024 px; igual acá.
 * Diferencia: un único listener pasivo + requestAnimationFrame (el plugin
 * recalculaba en cada evento de scroll, por elemento).
 */
import { breakpoints } from './motion';

const SPEED = 0.55; // function.js: parallaxie({ speed: 0.55, offset: 0 })

export function initParallax() {
  const els = [...document.querySelectorAll<HTMLElement>('.parallaxie')];
  if (!els.length || window.innerWidth <= breakpoints.lg) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
  const place = () => {
    for (const el of els) {
      const y = (top(el) - window.scrollY) * (1 - SPEED);
      el.style.backgroundPosition = `center ${y}px`;
    }
  };

  for (const el of els) {
    el.style.backgroundSize = 'cover';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundAttachment = 'fixed';
  }
  place();

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        place();
        ticking = false;
      });
    },
    { passive: true },
  );
}
