/**
 * motion.ts — Tokens de movimiento para JavaScript.
 *
 * Las mismas duraciones y curvas de tokens.css, pero para las animaciones
 * que se hacen por JS (GSAP, Swiper, Web Animations). CSS y JS no comparten
 * variables en tiempo de compilación, así que se centralizan acá y se
 * documentan juntos en docs/TOKENS.md.
 */
export const durations = {
  /** Apertura del menú de celular (valor por defecto de SlickNav). */
  menuSlide: 200,
  /** Fundido del preloader al terminar de cargar (jQuery fadeOut(600)). */
  preloaderFade: 600,
  /** Lightbox: zoom de apertura (Magnific Popup, zoom.duration). */
  lightboxZoom: 300,
  /** Contadores: tiempo total de conteo (counterUp time: 3000). */
  counter: 3000,
  /** Barras de habilidades (jQuery animate 2000). */
  skillBar: 2000,
} as const;

/** Curvas de GSAP usadas por la plantilla. */
export const eases = {
  reveal: 'power2.out',
  textBounce: 'back.out',
  cursor: 'expo.out',
} as const;

/** Breakpoints (espejo de --bp-* en tokens.css). */
export const breakpoints = {
  xxl: 1440,
  lg: 1024,
  md: 991,
  sm: 767,
} as const;
