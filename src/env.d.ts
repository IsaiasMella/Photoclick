/**
 * Declaraciones de tipos del proyecto.
 *
 * TypeScript 6 verifica también los imports "de efecto" (import 'x.css').
 * Swiper publica su CSS en subrutas sin tipos, así que se declaran acá.
 */
declare module 'swiper/css';
declare module 'swiper/css/*';

interface ImportMetaEnv {
  /** URL a la que se envían los formularios (decisión D6). Opcional. */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}
