/**
 * lightbox.ts — Visor de fotos y popup de YouTube.
 * Reemplaza a Magnific Popup 1.1 (jquery.magnific-popup.min.js).
 *
 * Lo importan los componentes con fotos ampliables o botón de video:
 *   <script>import '@/scripts/lightbox';</script>
 *
 * Engancha (mismo marcado que el original):
 *   .gallery-items a[href]  → galería de imágenes (delegado: cualquier <a>
 *                             dentro de .gallery-items). El href es la foto
 *                             grande; la miniatura es el <img> de adentro.
 *   a.popup-video[href]     → video de YouTube (o Vimeo) en un iframe.
 *
 * Genera EXACTAMENTE el DOM de Magnific Popup (verificado contra el original
 * con Playwright), para que aplique src/styles/vendor/magnific-popup.css sin
 * cambios:
 *
 *   <body>
 *     <div class="mfp-bg mfp-with-zoom mfp-ready"></div>
 *     <div class="mfp-wrap mfp-gallery mfp-auto-cursor mfp-with-zoom mfp-ready" tabindex="-1">
 *       <div class="mfp-container mfp-s-ready mfp-image-holder">
 *         <div class="mfp-content">
 *           <div class="mfp-figure">
 *             <div class="mfp-close"></div>
 *             <figure>
 *               <img class="mfp-img">
 *               <figcaption><div class="mfp-bottom-bar">
 *                 <div class="mfp-title"></div><div class="mfp-counter">1 of 9</div>
 *               </div></figcaption>
 *             </figure>
 *           </div>
 *         </div>
 *         <div class="mfp-preloader">Loading...</div>
 *         <button class="mfp-arrow mfp-arrow-left mfp-prevent-close"></button>
 *         <button class="mfp-arrow mfp-arrow-right mfp-prevent-close"></button>
 *       </div>
 *       <button class="mfp-close">×</button>
 *     </div>
 *
 * Comportamiento copiado de function.js + defaults del plugin:
 *   Galería: closeBtnInside false (× arriba a la derecha de la ventana),
 *     mainClass mfp-with-zoom, verticalFit (max-height = alto de la ventana),
 *     gallery con loop, precarga de las 2 siguientes, clic en la foto → la
 *     siguiente, contador "N of M", zoom de 300 ms desde la miniatura al abrir
 *     y hacia la miniatura al cerrar.
 *   Video: mainClass mfp-fade, removalDelay 160 ms, sin preloader,
 *     fixedContentPos true, × dentro del marco del video.
 *   Los dos: clic en el fondo cierra; Esc cierra; ← → navegan.
 *
 * Añadido (accesibilidad): role="dialog" + aria-modal + aria-label en
 * .mfp-wrap, trampa de foco con Tab (el plugin solo devolvía el foco si se
 * escapaba), foco devuelto al enlace que abrió el visor, aria-label en los
 * botones y alt de la foto grande = alt de la miniatura.
 *
 * Diferencias a propósito:
 *   - El plugin solo hacía el zoom si la foto grande ya estaba en caché (en
 *     el original siempre lo estaba: miniatura y foto grande eran el mismo
 *     archivo). Acá la miniatura es una versión optimizada y la grande otro
 *     archivo, así que: se precarga al pasar el mouse / enfocar el enlace y,
 *     si todavía no llegó al abrir, se muestra "Loading..." y el zoom se hace
 *     cuando llega. A la vista queda igual que el original.
 *   - Con prefers-reduced-motion no hay zoom (abre y cierra en el momento).
 *   - En celulares el plugin no fijaba la ventana (fixedContentPos 'auto');
 *     acá siempre se fija: es más simple y evita que la página de atrás se mueva.
 */

import { durations } from './motion';

/** Tiempos y textos del plugin (defaults de Magnific + opciones de function.js). */
const LIGHTBOX = {
  /** zoom.duration (function.js): duración del zoom de la miniatura (ms). Centralizado en motion.ts. */
  zoomDuration: durations.lightboxZoom,
  /** zoom.easing (default del plugin). */
  zoomEasing: 'ease-in-out',
  /** removalDelay del popup de video (function.js): el DOM se quita 160 ms
   *  después de cerrar (con .mfp-removing puesto) para permitir un fundido. */
  videoRemovalDelay: 160,
  /** El plugin agrega .mfp-ready y enfoca el visor en un setTimeout de 16 ms
   *  (un frame) para que las transiciones CSS arranquen desde el estado inicial. */
  frame: 16,
  /** gallery.preload [antes, después]: fotos que se precargan alrededor. */
  preload: [0, 2] as const,
  /** Textos por defecto del plugin (tClose, tPrev, tNext, tCounter, tLoading, tError). */
  text: {
    close: 'Close (Esc)',
    prev: 'Previous (Left arrow key)',
    next: 'Next (Right arrow key)',
    counter: (curr: number, total: number) => `${curr} of ${total}`,
    loading: 'Loading...',
    error: 'could not be loaded.',
    dialogImage: 'Image viewer',
    dialogVideo: 'Video player',
  },
  /** iframe.patterns del plugin: cómo transformar la URL en la del reproductor. */
  iframePatterns: [
    { index: 'youtube.com', id: 'v=', src: 'https://www.youtube.com/embed/%id%?autoplay=1' },
    { index: 'youtu.be/', id: 'youtu.be/', src: 'https://www.youtube.com/embed/%id%?autoplay=1' },
    { index: 'vimeo.com/', id: '/', src: 'https://player.vimeo.com/video/%id%?autoplay=1' },
  ],
} as const;

type Kind = 'image' | 'iframe';

interface Item {
  /** Enlace que representa al ítem (el que abrió, o el de la galería). */
  el: HTMLAnchorElement;
  src: string;
}

interface Offset {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface State {
  kind: Kind;
  items: Item[];
  index: number;
  bg: HTMLDivElement;
  wrap: HTMLDivElement;
  container: HTMLDivElement;
  content: HTMLDivElement;
  preloader: HTMLDivElement | null;
  /** Figura o marco del iframe que está adentro de .mfp-content. */
  current: HTMLElement | null;
  currentImg: HTMLImageElement | null;
  lastFocused: Element | null;
  htmlStyle: { overflow: string; marginRight: string };
  closing: boolean;
  zoomTimers: number[];
  animated: HTMLImageElement | null;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ZOOM_ENABLED = () => !reducedMotion();

let state: State | null = null;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const preloaded = new Set<string>();
function preloadImage(src: string) {
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  new Image().src = src;
}

/** Ancho de la barra de scroll (el plugin lo sumaba como margin-right a <html>). */
function scrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * _getOffset del plugin: posición en la VENTANA (position: fixed) del área
 * de contenido del elemento (sin padding arriba/abajo), con su ancho y alto.
 */
function offsetOf(node: HTMLElement): Offset {
  const rect = node.getBoundingClientRect();
  const cs = getComputedStyle(node);
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const br = parseFloat(cs.borderRightWidth) || 0;
  return {
    left: rect.left,
    top: rect.top + pt,
    width: rect.width - pl - pr - bl - br,
    height: node.offsetHeight - pt - pb,
  };
}

function applyOffset(node: HTMLElement, o: Offset) {
  node.style.left = `${o.left}px`;
  node.style.top = `${o.top}px`;
  node.style.width = `${o.width}px`;
  node.style.height = `${o.height}px`;
}

/** URL del reproductor según iframe.patterns (si no coincide, el href tal cual). */
function embedUrl(href: string): string {
  for (const p of LIGHTBOX.iframePatterns) {
    if (!href.includes(p.index)) continue;
    const id = href.slice(href.lastIndexOf(p.id) + p.id.length).split(/[?&#]/)[0] ?? '';
    return p.src.replace('%id%', id);
  }
  return href;
}

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter((n) => !n.hasAttribute('disabled') && n.getClientRects().length > 0);
}

/* ------------------------------------------------------------------ */
/* Apertura / cierre                                                   */
/* ------------------------------------------------------------------ */

function open(kind: Kind, items: Item[], index: number) {
  if (state) return;
  const isImage = kind === 'image';
  const mainClass = isImage ? 'mfp-with-zoom' : 'mfp-fade';

  const bg = el('div', `mfp-bg ${mainClass}`);
  const wrap = el(
    'div',
    ['mfp-wrap', isImage && items.length > 1 ? 'mfp-gallery' : '', isImage ? '' : 'mfp-close-btn-in', 'mfp-auto-cursor', mainClass]
      .filter(Boolean)
      .join(' '),
  );
  wrap.tabIndex = -1;
  // fixedContentPos: el visor se scrollea solo en vertical y la página queda quieta.
  wrap.style.overflow = 'hidden auto';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', isImage ? LIGHTBOX.text.dialogImage : LIGHTBOX.text.dialogVideo);

  const container = el('div', 'mfp-container');
  const content = el('div', 'mfp-content');
  container.append(content);
  wrap.append(container);

  let preloader: HTMLDivElement | null = null;
  if (isImage) {
    // preloader: true (default) en la galería; false en el video.
    preloader = el('div', 'mfp-preloader', LIGHTBOX.text.loading);
    container.append(preloader);
    if (items.length > 1) {
      const prev = el('button', 'mfp-arrow mfp-arrow-left mfp-prevent-close');
      const next = el('button', 'mfp-arrow mfp-arrow-right mfp-prevent-close');
      prev.type = next.type = 'button';
      prev.title = LIGHTBOX.text.prev;
      next.title = LIGHTBOX.text.next;
      prev.setAttribute('aria-label', 'Previous image');
      next.setAttribute('aria-label', 'Next image');
      prev.addEventListener('click', () => go(-1));
      next.addEventListener('click', () => go(1));
      container.append(prev, next);
    }
    // closeBtnInside: false → la × va al final de .mfp-wrap.
    wrap.append(closeButton());
  }

  // Bloquea el scroll de la página (como el plugin: overflow hidden en <html>
  // + margin-right del ancho de la barra para que el contenido no salte).
  const html = document.documentElement;
  const htmlStyle = { overflow: html.style.overflow, marginRight: html.style.marginRight };
  const sb = scrollbarWidth();
  html.style.overflow = 'hidden';
  if (sb > 0) html.style.marginRight = `${sb}px`;

  state = {
    kind,
    items,
    index,
    bg,
    wrap,
    container,
    content,
    preloader,
    current: null,
    currentImg: null,
    lastFocused: document.activeElement,
    htmlStyle,
    closing: false,
    zoomTimers: [],
    animated: null,
  };

  // El plugin los inserta al PRINCIPIO del body (prependTo).
  document.body.prepend(bg, wrap);
  wrap.addEventListener('click', onWrapClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('focusin', onFocusIn);
  window.addEventListener('resize', onResize);

  render(true);

  setTimeout(() => {
    if (!state || state.wrap !== wrap) return;
    bg.classList.add('mfp-ready');
    wrap.classList.add('mfp-ready');
    wrap.focus({ preventScroll: true });
  }, LIGHTBOX.frame);
}

function closeButton() {
  const btn = el('button', 'mfp-close', '×');
  btn.type = 'button';
  btn.title = LIGHTBOX.text.close;
  btn.setAttribute('aria-label', 'Close');
  return btn;
}

function close() {
  const s = state;
  if (!s || s.closing) return;
  s.closing = true;
  s.zoomTimers.forEach((t) => clearTimeout(t));
  s.animated?.remove();

  let delay = s.kind === 'iframe' ? LIGHTBOX.videoRemovalDelay : 0;

  // Zoom de salida: una copia de la miniatura va de la foto grande a la miniatura.
  const img = s.currentImg;
  const thumb = s.items[s.index]?.el.querySelector('img');
  if (s.kind === 'image' && ZOOM_ENABLED() && img && img.naturalWidth && thumb && s.current) {
    delay = LIGHTBOX.zoomDuration;
    const clone = animatedClone(thumb);
    applyOffset(clone, offsetOf(img));
    s.wrap.append(clone);
    s.current.style.visibility = 'hidden';
    setTimeout(() => applyOffset(clone, offsetOf(thumb)), LIGHTBOX.frame);
  }

  s.bg.classList.add('mfp-removing');
  s.wrap.classList.add('mfp-removing');
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('focusin', onFocusIn);
  window.removeEventListener('resize', onResize);

  const finish = () => {
    // Corta el video (el plugin ponía about:blank en el iframe al cerrar).
    s.wrap.querySelector('iframe')?.setAttribute('src', 'about:blank');
    s.bg.remove();
    s.wrap.remove();
    const html = document.documentElement;
    html.style.overflow = s.htmlStyle.overflow;
    html.style.marginRight = s.htmlStyle.marginRight;
    state = null;
    if (s.lastFocused instanceof HTMLElement) s.lastFocused.focus({ preventScroll: true });
  };
  if (delay) setTimeout(finish, delay);
  else finish();
}

function go(step: number) {
  const s = state;
  if (!s || s.closing || s.items.length < 2) return;
  // gallery.loop (default true): después de la última vuelve a la primera.
  s.index = (s.index + step + s.items.length) % s.items.length;
  s.zoomTimers.forEach((t) => clearTimeout(t));
  s.animated?.remove();
  render(false);
}

/* ------------------------------------------------------------------ */
/* Contenido                                                           */
/* ------------------------------------------------------------------ */

function setStatus(status: 'loading' | 'ready' | 'error') {
  const s = state;
  if (!s) return;
  // Mismo orden de clases que el plugin: mfp-container mfp-s-ready mfp-image-holder.
  s.container.className = `mfp-container mfp-s-${status} mfp-image-holder`;
}

function render(opening: boolean) {
  const s = state;
  if (!s) return;
  const item = s.items[s.index];
  if (!item) return;

  if (s.kind === 'iframe') {
    s.container.className = 'mfp-container mfp-iframe-holder';
    const scaler = el('div', 'mfp-iframe-scaler');
    const iframe = el('iframe', 'mfp-iframe');
    iframe.src = embedUrl(item.src);
    iframe.setAttribute('frameborder', '0');
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.title = item.el.getAttribute('title') || item.el.getAttribute('aria-label') || 'Video';
    // closeBtnInside (default true en iframe): la × va dentro del marco.
    scaler.append(closeButton(), iframe);
    s.content.replaceChildren(scaler);
    s.current = scaler;
    return;
  }

  // --- Imagen ---
  s.container.className = 'mfp-container mfp-image-holder';
  const figureBox = el('div', 'mfp-figure');
  const figure = el('figure');
  const img = el('img', 'mfp-img');
  const caption = el('figcaption');
  const bar = el('div', 'mfp-bottom-bar');
  const title = el('div', 'mfp-title', item.el.getAttribute('title') ?? '');
  const counter = el('div', 'mfp-counter', s.items.length > 1 ? LIGHTBOX.text.counter(s.index + 1, s.items.length) : '');
  bar.append(title, counter);
  caption.append(bar);
  figure.append(img, caption);
  // closeBtnInside: false → la plantilla del plugin deja este <div> vacío.
  figureBox.append(el('div', 'mfp-close'), figure);

  const thumb = item.el.querySelector('img');
  img.alt = thumb?.getAttribute('alt') ?? '';
  // verticalFit: la foto nunca es más alta que la ventana. (El plugin solo
  // restaba el padding en IE7/8, así que el valor es el alto completo.)
  img.style.maxHeight = `${window.innerHeight}px`;
  img.src = item.src;

  s.content.replaceChildren(figureBox);
  s.current = figureBox;
  s.currentImg = img;

  const zoomIn = opening && ZOOM_ENABLED() && !!thumb;
  // Al abrir con zoom, la foto queda invisible hasta que la copia animada llega.
  if (zoomIn) figureBox.style.visibility = 'hidden';

  const ready = () => {
    if (state !== s || s.currentImg !== img) return;
    figureBox.classList.remove('mfp-loading');
    setStatus('ready');
    if (zoomIn && thumb) zoomFrom(thumb, img, figureBox);
  };

  if (img.complete && img.naturalWidth) ready();
  else {
    figureBox.classList.add('mfp-loading');
    setStatus('loading');
    img.addEventListener('load', ready, { once: true });
    img.addEventListener(
      'error',
      () => {
        if (state !== s || s.currentImg !== img) return;
        setStatus('error');
        figureBox.style.visibility = 'visible';
        if (s.preloader) {
          // tError del plugin: '<a href="%url%">The image</a> could not be loaded.'
          const a = el('a', '', 'The image');
          a.href = item.src;
          s.preloader.replaceChildren(a, ` ${LIGHTBOX.text.error}`);
        }
      },
      { once: true },
    );
  }
  if (s.preloader && !s.preloader.querySelector('a')) s.preloader.textContent = LIGHTBOX.text.loading;

  // gallery.preload [0, 2]: se piden de antemano las siguientes.
  const [before, after] = LIGHTBOX.preload;
  for (let i = 1; i <= after; i++) preloadImage(s.items[(s.index + i) % s.items.length]?.src ?? '');
  for (let i = 1; i <= before; i++) preloadImage(s.items[(s.index - i + s.items.length) % s.items.length]?.src ?? '');
}

/** Copia de la miniatura que se anima (getElToAnimate del plugin). */
function animatedClone(thumb: HTMLImageElement): HTMLImageElement {
  const clone = thumb.cloneNode(false) as HTMLImageElement;
  clone.removeAttribute('style');
  clone.removeAttribute('class');
  clone.removeAttribute('loading');
  clone.className = 'mfp-animated-image';
  clone.alt = '';
  Object.assign(clone.style, {
    position: 'fixed',
    zIndex: '9999',
    left: '0',
    top: '0',
    backfaceVisibility: 'hidden',
    transition: `all ${LIGHTBOX.zoomDuration / 1000}s ${LIGHTBOX.zoomEasing}`,
  });
  if (state) state.animated = clone;
  return clone;
}

/** Zoom de entrada: miniatura → foto grande; al terminar se muestra la real. */
function zoomFrom(thumb: HTMLImageElement, img: HTMLImageElement, figureBox: HTMLElement) {
  const s = state;
  if (!s) return;
  const clone = animatedClone(thumb);
  applyOffset(clone, offsetOf(thumb));
  s.wrap.append(clone);
  s.zoomTimers.push(
    window.setTimeout(() => {
      applyOffset(clone, offsetOf(img));
      s.zoomTimers.push(
        window.setTimeout(() => {
          figureBox.style.visibility = 'visible';
          s.zoomTimers.push(
            window.setTimeout(() => {
              clone.remove();
              if (s.animated === clone) s.animated = null;
            }, LIGHTBOX.frame),
          );
        }, LIGHTBOX.zoomDuration),
      );
    }, LIGHTBOX.frame),
  );
}

/* ------------------------------------------------------------------ */
/* Eventos del visor                                                   */
/* ------------------------------------------------------------------ */

/** _checkIfClose del plugin (closeOnContentClick false, closeOnBgClick true). */
function onWrapClick(e: MouseEvent) {
  const s = state;
  const target = e.target as HTMLElement | null;
  if (!s || !target) return;

  // gallery.navigateByImgClick: clic en la foto → la siguiente.
  if (s.kind === 'image' && s.items.length > 1 && target.classList.contains('mfp-img')) {
    go(1);
    return;
  }
  if (target.closest('.mfp-prevent-close')) return;
  if (target.classList.contains('mfp-close') || target === s.preloader) {
    close();
    return;
  }
  const inContent = s.current ? s.current === target || s.current.contains(target) : false;
  if (!inContent) close();
}

function onKeydown(e: KeyboardEvent) {
  const s = state;
  if (!s) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
  } else if (e.key === 'ArrowLeft' && s.kind === 'image') {
    go(-1);
  } else if (e.key === 'ArrowRight' && s.kind === 'image') {
    go(1);
  } else if (e.key === 'Tab') {
    // Trampa de foco: Tab da la vuelta dentro del visor.
    const list = focusables(s.wrap);
    const first = list[0];
    const last = list[list.length - 1];
    if (!first || !last) {
      e.preventDefault();
      s.wrap.focus();
      return;
    }
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === s.wrap)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/** Si el foco se escapa (clic fuera, lector de pantalla), vuelve al visor. */
function onFocusIn(e: FocusEvent) {
  const s = state;
  if (!s || s.closing) return;
  const target = e.target as Node | null;
  if (target && target !== s.wrap && !s.wrap.contains(target)) s.wrap.focus({ preventScroll: true });
}

function onResize() {
  if (state?.currentImg) state.currentImg.style.maxHeight = `${window.innerHeight}px`;
}

/* ------------------------------------------------------------------ */
/* Enganche                                                            */
/* ------------------------------------------------------------------ */

function galleryItems(link: HTMLAnchorElement): { items: Item[]; index: number } | null {
  const gallery = link.closest('.gallery-items');
  if (!gallery) return null;
  const links = Array.from(gallery.querySelectorAll<HTMLAnchorElement>('a[href]'));
  return { items: links.map((a) => ({ el: a, src: a.href })), index: Math.max(links.indexOf(link), 0) };
}

function onDocumentClick(e: MouseEvent) {
  // Respeta Ctrl/Cmd/Shift + clic y el botón del medio (abrir en otra pestaña).
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return;

  if (link.classList.contains('popup-video')) {
    e.preventDefault();
    open('iframe', [{ el: link, src: link.href }], 0);
    return;
  }
  const g = galleryItems(link);
  if (g) {
    e.preventDefault();
    open('image', g.items, g.index);
  }
}

/** Precarga la foto grande cuando el usuario apunta o enfoca la miniatura. */
function onIntent(e: Event) {
  const link = (e.target as Element | null)?.closest?.('.gallery-items a[href]');
  if (link instanceof HTMLAnchorElement) preloadImage(link.href);
}

if (document.querySelector('.gallery-items a[href], a.popup-video[href]')) {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('pointerover', onIntent, { passive: true });
  document.addEventListener('focusin', onIntent);
}
