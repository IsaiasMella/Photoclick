/**
 * global.ts — Comportamientos presentes en TODAS las páginas.
 *
 * Lo importa BaseLayout.astro una sola vez. Astro lo empaqueta como módulo
 * (type="module" → diferido: no bloquea el render). Los comportamientos de
 * secciones puntuales (sliders, lightbox, galería filtrable, contadores,
 * formulario) viven en su propio archivo y se descargan desde acá, recién
 * cuando su sección se acerca (más abajo): una página sin slider no descarga
 * Swiper.
 *
 * Equivalente en Next.js: un <ClientProviders> en el layout con useEffect,
 * pero sin hidratar React: acá es JS plano sobre HTML estático.
 */
import { initReveal } from './reveal-on-scroll';
import { initTextAnimations } from './text-animations';
import { initParallax } from './parallax';
import { initCursor } from './cursor';
import { initSmoothScroll } from './smooth-scroll';
import { loadWhenNear } from './load-when-near';

function afterLoadIdle(fn: () => void) {
  const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

initReveal();
initParallax();
// GSAP (~50 KB) se pide recién con el navegador libre después de "load": así no
// compite por la red con la foto del hero y las fuentes (LCP en celular).
// El texto ya está visible en el HTML; la animación arranca apenas llega.
afterLoadIdle(() => void initTextAnimations());
void initCursor();
initSmoothScroll();

// Comportamientos de secciones puntuales: se descargan cuando la sección se
// acerca a la pantalla (ver load-when-near.ts). Una página sin slider nunca
// baja Swiper; una home lo baja enseguida porque el slider del hero ya se ve.
//
// Además, ningún componente lleva su propio script: si lo tuviera, Astro lo
// insertaría en ese lugar del HTML y rompería selectores del autor como
// ".section-footer-text ul:last-child" (pasó: +15 px de alto).
loadWhenNear('.hero-image-slider, .testimonial-slider, .company-supports-slider', () => import('./sliders'));
loadWhenNear('video[data-lazy-video]', () => import('./lazy-video'));
loadWhenNear('.gallery-items, a.popup-video', () => import('./lightbox'));
loadWhenNear('.wedding-gallery-item-boxes', () => import('./gallery-filter'));
loadWhenNear('#contactForm', () => import('./contact-form'));
loadWhenNear('[data-bs-toggle="collapse"]', () => import('./accordion'));
loadWhenNear('.counter, .skills-progress-bar', () => import('./counters'));
