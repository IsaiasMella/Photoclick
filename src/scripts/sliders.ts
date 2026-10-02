/**
 * sliders.ts — Carruseles de la plantilla (reemplaza a swiper-bundle.min.js del CDN).
 *
 * Lo carga src/scripts/global.ts con loadWhenNear() cuando la sección se acerca
 * a la pantalla (ningún componente lo importa directo; ver load-when-near.ts).
 *
 * Engancha (mismo marcado que el original):
 *   .hero-image-slider .swiper        → hero de index-slider (fundido)
 *   .testimonial-slider .swiper       → testimonios (1 / 2 / 3 por vista)
 *   .company-supports-slider .swiper  → logos (no aparece en ninguna página
 *                                        del original, pero function.js lo
 *                                        inicializa: se deja por si se usa)
 *
 * Por qué Swiper de npm y no el bundle: el bundle (≈150 KB) trae los 20
 * módulos; acá se importan solo los que la plantilla usa:
 *   - Autoplay y EffectFade (los que piden los parámetros de function.js).
 *   - A11y: el bundle lo trae ACTIVADO por defecto, así que el original ya
 *     generaba aria-label "1 / 3", role="group" y la región aria-live. Se
 *     conserva para que el DOM y la accesibilidad sean los mismos.
 *
 * Los parámetros son IDÉNTICOS a function.js (ver SLIDERS abajo). La única
 * diferencia a propósito: con prefers-reduced-motion no hay autoplay (los
 * carruseles se pueden seguir arrastrando). Criterio WCAG 2.2.2.
 */
import Swiper from 'swiper';
import { Autoplay, EffectFade, A11y } from 'swiper/modules';
import type { SwiperOptions } from 'swiper/types';
// Estilos de la región aria-live (en el original venían dentro de swiper-bundle.css).
// El núcleo y el fundido ya los importa BaseLayout.astro.
import 'swiper/css/a11y';

/**
 * Configuración de cada slider, copiada de function.js.
 * Tiempos en milisegundos (speed = duración de la transición entre slides;
 * autoplay.delay = tiempo que se queda quieto cada slide).
 * Los breakpoints de Swiper son "min-width" en px.
 */
const SLIDERS: Record<string, SwiperOptions> = {
  /* Hero Image Slider JS */
  '.hero-image-slider .swiper': {
    effect: 'fade',
    slidesPerView: 1,
    speed: 1000, // fundido de 1 s
    spaceBetween: 0,
    loop: true,
    autoplay: { delay: 4000 }, // cambia cada 4 s
  },
  /* Company Support Slider JS */
  '.company-supports-slider .swiper': {
    slidesPerView: 2,
    speed: 2000,
    spaceBetween: 20,
    loop: true,
    autoplay: { delay: 5000 },
    breakpoints: {
      767: { slidesPerView: 4 },
      1440: { slidesPerView: 5 },
    },
  },
  /* testimonial Slider JS */
  '.testimonial-slider .swiper': {
    slidesPerView: 1,
    speed: 1500,
    spaceBetween: 30,
    loop: true,
    autoplay: { delay: 5000 },
    breakpoints: {
      768: { slidesPerView: 2 },
      1025: { slidesPerView: 3 },
    },
  },
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initSliders() {
  for (const [selector, options] of Object.entries(SLIDERS)) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      // Evita inicializar dos veces (p. ej. si el módulo se evaluara de nuevo con HMR).
      if (el.classList.contains('swiper-initialized')) return;
      const swiper = new Swiper(el, { ...options, modules: [Autoplay, EffectFade, A11y] });
      if (!options.autoplay) return;
      // Sin autoplay para quien pidió menos movimiento. Se detiene (en vez de
      // no configurarlo) para conservar el delay propio si después se reanuda.
      if (reducedMotion.matches) swiper.autoplay.stop();
      // Si la preferencia cambia con la página abierta, se respeta en el momento.
      reducedMotion.addEventListener('change', (e) => {
        if (e.matches) swiper.autoplay.stop();
        else swiper.autoplay.start();
      });
    });
  }
}

initSliders();
