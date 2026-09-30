/**
 * gallery-alt.ts — Texto alternativo de las fotos gallery-1…9.
 *
 * Lo usan /image-gallery (fotos) y /video-gallery (miniaturas de video).
 * El original tenía alt="" en todas y las colecciones `gallery` y `videos`
 * no tienen un campo `alt` (src/content es de otro agente). Mientras tanto,
 * el texto se busca por el número de archivo (gallery-N), que se conserva
 * en la URL de la imagen tanto en dev como en el build (`gallery-3.HASH.jpg`).
 *
 * Mejora pendiente: agregar `alt: z.string().optional()` a esos dos esquemas
 * y mover estos textos al JSON; entonces este archivo se borra.
 */
import type { ImageMetadata } from 'astro';

const alts: Record<string, string> = {
  '1': 'Bride and groom embracing in a field of wildflowers',
  '2': 'Couple in traditional Indian attire smiling at each other at their engagement',
  '3': 'Couple laughing and hugging at their haldi ceremony',
  '4': 'Groom embracing the bride among pink flowers',
  '5': 'Bride and groom touching foreheads under the trees',
  '6': 'Bride and groom with a bouquet in front of a vintage car',
  '7': 'Bride and groom posing in a white colonnade',
  '8': 'Groom holding the bride close in front of a rustic barn',
  '9': 'Bride and groom embracing on a stone bridge',
};

/** Alt de una foto de la galería; texto genérico si no está en la tabla. */
export function galleryAlt(image: ImageMetadata): string {
  const n = /gallery-(\d+)/.exec(image.src)?.[1];
  return (n && alts[n]) || 'Wedding photograph';
}
