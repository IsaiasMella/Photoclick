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
export async function backgroundImageStyle(name: string, src: ImageMetadata): Promise<string> {
  const [lg, sm] = await Promise.all([imageSet(src, WIDTHS.lg), imageSet(src, WIDTHS.sm)]);
  return `--${name}-bg-image: ${lg}; --${name}-bg-image-sm: ${sm};`;
}
