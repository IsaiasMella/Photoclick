/**
 * cursor.ts — Cursor personalizado (círculo dorado que sigue al mouse y
 * muestra "View", "Play" o "Drag"). Porte de magiccursor.js sin jQuery.
 *
 * Contrato del marcado (igual al original):
 *   data-cursor="-opaque"      agrega esa clase al cursor al pasar por encima
 *   data-cursor-text="View"    muestra ese texto dentro del cursor
 *   data-cursor-stick="#id"    el cursor se "pega" al centro de un elemento
 *
 * Solo se activa con mouse (pointer: fine). En pantallas táctiles no hay
 * cursor que seguir, aunque el original lo creaba igual.
 */
import { eases } from './motion';

const SPEED = 0.7;
const VISIBLE_TIMEOUT = 300;

export async function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const { gsap } = await import('gsap');

  const el = document.createElement('div');
  el.className = 'cb-cursor';
  el.setAttribute('aria-hidden', 'true');
  const text = document.createElement('div');
  text.className = 'cb-cursor-text';
  el.append(text);
  document.body.append(el);

  let visible = false;
  let visibleTimer: ReturnType<typeof setTimeout> | undefined;
  let stick: { x: number; y: number } | null = null;
  let pos = { x: -innerWidth, y: -innerHeight };

  const move = (x = pos.x, y = pos.y, duration?: number) => {
    gsap.to(el, { x, y, force3D: true, overwrite: true, ease: eases.cursor, duration: visible ? (duration ?? SPEED) : 0 });
  };
  const show = () => {
    if (visible) return;
    clearTimeout(visibleTimer);
    el.classList.add('-visible');
    visibleTimer = setTimeout(() => (visible = true));
  };
  const hide = () => {
    clearTimeout(visibleTimer);
    el.classList.remove('-visible');
    visibleTimer = setTimeout(() => (visible = false), VISIBLE_TIMEOUT);
  };
  move(-innerWidth, -innerHeight, 0);

  const body = document.body;
  body.addEventListener('mouseleave', hide);
  body.addEventListener('mouseenter', show);
  body.addEventListener(
    'mousemove',
    (e) => {
      pos = stick
        ? { x: stick.x - (stick.x - e.clientX) * 0.15, y: stick.y - (stick.y - e.clientY) * 0.15 }
        : { x: e.clientX, y: e.clientY };
      move();
      show();
    },
    { passive: true },
  );
  body.addEventListener('mousedown', () => el.classList.add('-active'));
  body.addEventListener('mouseup', () => el.classList.remove('-active'));

  /** Delegación con mouseover/mouseout (equivale a los .on('mouseenter', selector) de jQuery). */
  const hover = (selector: string, enter: (t: HTMLElement) => void, leave: (t: HTMLElement) => void) => {
    body.addEventListener('mouseover', (e) => {
      const t = (e.target as Element).closest<HTMLElement>(selector);
      if (t && !t.contains(e.relatedTarget as Node | null)) enter(t);
    });
    body.addEventListener('mouseout', (e) => {
      const t = (e.target as Element).closest<HTMLElement>(selector);
      if (t && !t.contains(e.relatedTarget as Node | null)) leave(t);
    });
  };

  hover('a, input, textarea, button', () => el.classList.add('-pointer'), () => el.classList.remove('-pointer'));
  hover('iframe', hide, show);
  hover(
    '[data-cursor]',
    (t) => el.classList.add(t.dataset['cursor'] ?? ''),
    (t) => el.classList.remove(t.dataset['cursor'] ?? ''),
  );
  hover(
    '[data-cursor-text]',
    (t) => {
      text.textContent = t.dataset['cursorText'] ?? '';
      el.classList.add('-text');
    },
    () => el.classList.remove('-text'),
  );
  hover(
    '[data-cursor-stick]',
    (t) => {
      const target = document.querySelector<HTMLElement>(t.dataset['cursorStick'] ?? '');
      if (!target) return;
      const r = target.getBoundingClientRect();
      stick = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      move(stick.x, stick.y, 5);
    },
    () => (stick = null),
  );
}
