/**
 * global.ts — Comportamientos presentes en TODAS las páginas.
 *
 * Lo importa BaseLayout.astro una sola vez. Astro lo empaqueta como módulo
 * (type="module" → diferido: no bloquea el render). Los comportamientos de
 * secciones puntuales (sliders, lightbox, galería filtrable, contadores,
 * formulario) viven en su propio archivo y los importa el componente que los
 * usa: una página sin slider no descarga Swiper.
 *
 * Equivalente en Next.js: un <ClientProviders> en el layout con useEffect,
 * pero sin hidratar React: acá es JS plano sobre HTML estático.
 */
import { initReveal } from './reveal-on-scroll';
import { initTextAnimations } from './text-animations';
import { initParallax } from './parallax';
import { initCursor } from './cursor';
import { initSmoothScroll } from './smooth-scroll';

initReveal();
initParallax();
void initTextAnimations();
void initCursor();
initSmoothScroll();
