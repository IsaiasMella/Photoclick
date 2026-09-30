/**
 * gallery-filter.ts — Galería de bodas filtrable (masonry + filtro por categoría).
 *
 * Lo importa sections/WeddingGallery.astro:
 *   <script>import '@/scripts/gallery-filter';</script>
 *
 * Engancha (mismo marcado que el original):
 *   .our-wedding-gallery-nav li a[data-filter="*" | ".pre-wedding" | …]
 *   .wedding-gallery-item-boxes > .wedding-gallery-item-box.pre-wedding.haldi …
 * El botón activo lleva .active-btn (el CSS lo pinta con el color de acento).
 *
 * DECISIÓN: se mantiene Isotope (isotope-layout de npm), cargado con import()
 * dinámico. Motivos:
 *   - Idéntico por construcción: el layout masonry con columnWidth: 1 decide
 *     la posición de cada ítem con sus propios redondeos (round/floor según el
 *     sobrante de píxeles) y anima con sus propios estilos (ocultar = opacity 0
 *     + scale(0.001), mover = transform, 0,4 s, y display:none al terminar).
 *     Un reemplazo con CSS + FLIP puede parecerse, pero en anchos con
 *     fracciones de píxel o en mitad de una animación interrumpida no da
 *     exactamente lo mismo.
 *   - No cuesta en la carga: el chunk (≈11 KB gzip, con sus dependencias
 *     outlayer/masonry/get-size) se pide DESPUÉS del evento load (como hacía
 *     function.js, que inicializaba en $window.on('load')), y solo en las
 *     páginas que tienen la galería. No bloquea el render ni el LCP; sin JS
 *     la grilla se ve igual (es una fila normal de Bootstrap).
 *   - Ya no depende de jQuery: se usa la API "vanilla" de Isotope.
 *
 * Con prefers-reduced-motion las transiciones duran 0 (filtra sin animar).
 */

/** Opciones copiadas de function.js + defaults de Isotope que importan. */
const GALLERY = {
  itemSelector: '.wedding-gallery-item-box',
  layoutMode: 'masonry',
  masonry: {
    // "use outer width of grid-sizer for columnWidth" (comentario original):
    // en la práctica, columnas de 1 px → cada ítem se acomoda por su ancho real.
    columnWidth: 1,
  },
  /** Default de Isotope: duración de mover / mostrar / ocultar. */
  transitionDuration: '0.4s',
} as const;

/** Parte de la API de Isotope que se usa (el paquete no trae tipos). */
interface IsotopeInstance {
  arrange(options: { filter: string }): void;
  layout(): void;
}
type IsotopeConstructor = new (element: Element, options: Record<string, unknown>) => IsotopeInstance;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function initGallery(grid: HTMLElement) {
  // El nav está en otra columna de la misma sección: se busca dentro de la sección.
  const scope = grid.closest('.our-wedding-gallery') ?? document;
  const buttons = Array.from(scope.querySelectorAll<HTMLAnchorElement>('.our-wedding-gallery-nav li a[data-filter]'));

  // @ts-expect-error -- isotope-layout no publica tipos (se tipa arriba lo que se usa).
  const mod = (await import('isotope-layout')) as { default: IsotopeConstructor };
  const Isotope = mod.default;

  const iso = new Isotope(grid, {
    ...GALLERY,
    transitionDuration: reducedMotion() ? 0 : GALLERY.transitionDuration,
  });

  // Accesibilidad (añadido): los enlaces "#" funcionan como botones de filtro.
  const markActive = (active: HTMLAnchorElement) => {
    buttons.forEach((b) => {
      b.classList.toggle('active-btn', b === active);
      b.setAttribute('aria-pressed', String(b === active));
    });
  };
  buttons.forEach((b) => {
    b.setAttribute('role', 'button');
    b.setAttribute('aria-pressed', String(b.classList.contains('active-btn')));
    b.addEventListener('click', (e) => {
      e.preventDefault();
      iso.arrange({ filter: b.dataset['filter'] ?? '*' });
      markActive(b);
    });
    // Un role="button" también se activa con la barra espaciadora.
    b.addEventListener('keydown', (e) => {
      if (e.key !== ' ') return;
      e.preventDefault();
      b.click();
    });
  });

  // function.js terminaba con $menuitem.isotope({ filter: "*" }).
  iso.arrange({ filter: '*' });

  // Si una imagen cambia de alto al cargar (lazy), se recalcula la grilla.
  grid.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', () => iso.layout(), { once: true });
  });
}

function start() {
  document.querySelectorAll<HTMLElement>('.wedding-gallery-item-boxes').forEach((grid) => {
    void initGallery(grid);
  });
}

// Como el original ($window.on('load')): después de que cargaron las imágenes.
if (document.querySelector('.wedding-gallery-item-boxes')) {
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

// Sin imports estáticos: esto lo marca como módulo (ámbito propio, no global).
export {};
