/**
 * format.ts — Utilidades de presentación de las páginas de detalle (Agente B).
 *
 * Vive junto a los componentes de detalle porque solo lo usan ellos
 * (src/lib es de la base compartida).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Fecha de un post con el formato del original: "11 May, 2026".
 * Se usa UTC porque `z.coerce.date()` interpreta "2026-01-15" como medianoche
 * UTC; con la hora local, en husos negativos se mostraría el día anterior.
 */
export function formatPostDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${date.getUTCFullYear()}`;
}

/** Fecha ISO (AAAA-MM-DD) para el atributo datetime de <time>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface Heading {
  title: string;
  accent?: string;
}

/**
 * Título del <h1> de un detalle, partido en texto + palabra final en cursiva
 * (el <span> del original: "Pre-wedding <span>photography</span>").
 * Si la entrada define `heading` en el frontmatter se usa tal cual; si no,
 * la última palabra del título pasa a ser el acento.
 */
export function splitHeading(title: string, heading?: { title: string; accent?: string | undefined }): Heading {
  // Sin claves con valor undefined: así se puede pasar con {...heading} a
  // PageHeader (el proyecto usa exactOptionalPropertyTypes).
  if (heading) return heading.accent ? { title: heading.title, accent: heading.accent } : { title: heading.title };
  const i = title.trim().lastIndexOf(' ');
  if (i === -1) return { title };
  return { title: title.slice(0, i), accent: title.slice(i + 1) };
}
