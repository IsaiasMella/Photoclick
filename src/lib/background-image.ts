/**
 * background-image.ts — Imágenes de FONDO optimizadas (decisión D9 del plan).
 *
 * <Image /> de astro:assets optimiza <img>, pero varios fondos del diseño
 * están en el CSS (hero, cabecera de página, CTA). Un url() en CSS queda sin
 * optimizar. Solución:
 *   1. getImage() genera AVIF y WebP en dos anchos (escritorio y celular).
 *   2. Se pasan al CSS como custom properties en el atributo style.
 *   3. El CSS del componente las usa: background-image: var(--x-bg-image, url(original))
 *
 * Next.js: no hay equivalente directo (next/image no hace fondos); se suele
 * resolver con un <Image fill> posicionado detrás del contenido.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** Ancho de escritorio y de celular (el celular ≤767px usa la versión chica). */
const WIDTHS = { lg: 1920, sm: 828 } as const;

async function imageSet(src: ImageMetadata, width: number) {
  const w = Math.min(width, src.width);
  const [avif, webp] = await Promise.all([
    getImage({ src, width: w, format: 'avif', quality: 60 }),
    getImage({ src, width: w, format: 'webp', quality: 75 }),
  ]);
  return `image-set(url("${avif.src}") type("image/avif"), url("${webp.src}") type("image/webp"))`;
}

/**
 * Devuelve el valor del atributo style con dos variables:
 *   --{name}-bg-image     (escritorio)
 *   --{name}-bg-image-sm  (celular, lo usa el @media de --bp-sm)
 */
export async function backgroundImageStyle(
  name: string,
  src: ImageMetadata,
  /**
   * false → sin versión chica para celular. Obligatorio cuando el CSS del
   * componente NO usa background-size: cover (p. ej. .cta-box): ahí la foto se
   * pinta a su tamaño natural, y achicarla cambiaría el encuadre y la haría
   * repetirse.
   */
  { mobile = true }: { mobile?: boolean } = {},
): Promise<string> {
  const lg = await imageSet(src, WIDTHS.lg);
  if (!mobile) return `--${name}-bg-image: ${lg};`;
  const sm = await imageSet(src, WIDTHS.sm);
  return `--${name}-bg-image: ${lg}; --${name}-bg-image-sm: ${sm};`;
}

export interface PreloadLink {
  href: string;
  media: string;
}

/**
 * Enlaces <link rel="preload"> para el fondo que es el LCP de la página
 * (hero o cabecera de página).
 *
 * Por qué: una imagen que solo aparece en el CSS se descubre tarde (primero
 * hay que bajar y aplicar el CSS). Lighthouse lo marcaba ("Request is
 * discoverable in initial document: no"). Con el preload, el navegador la pide
 * apenas lee el HTML, en paralelo con el CSS.
 * Se precarga solo la AVIF (si el navegador no la soporta, ignora el preload
 * por el atributo type) y una por ancho de pantalla (media), para no bajar dos.
 * Las URLs son las mismas que usa backgroundImageStyle (getImage las cachea).
 */
export async function backgroundPreloadLinks(src: ImageMetadata): Promise<PreloadLink[]> {
  const [lg, sm] = await Promise.all([
    getImage({ src, width: Math.min(WIDTHS.lg, src.width), format: 'avif', quality: 60 }),
    getImage({ src, width: Math.min(WIDTHS.sm, src.width), format: 'avif', quality: 60 }),
  ]);
  // --bp-sm: 767px (mismo corte que el @media que elige la versión chica)
  return [
    { href: sm.src, media: '(max-width: 767px)' },
    { href: lg.src, media: '(min-width: 768px)' },
  ];
}
