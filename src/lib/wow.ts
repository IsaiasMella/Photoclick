/**
 * wow.ts — Delay escalonado de las animaciones de aparición.
 *
 * Los listados del original usan data-wow-delay = 0.2s × índice
 * (el primero sin atributo, después 0.2s, 0.4s, 0.6s…).
 * Uso: <div class="service-item wow fadeInUp" data-wow-delay={delay(i)}>
 */
export function delay(index: number, step = 0.2): string | undefined {
  if (index <= 0) return undefined;
  const s = Math.round(index * step * 10) / 10;
  return `${s}s`;
}
