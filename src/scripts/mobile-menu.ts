/**
 * mobile-menu.ts — Abre y cierra el menú de celular (.slicknav_*).
 *
 * Reemplaza a jquery.slicknav.js (21 KB + jQuery 87 KB). El DOM ya viene
 * renderizado desde Header.astro; este script solo alterna clases y anima
 * la altura, igual que SlickNav (duración 200 ms, su valor por defecto).
 *
 * Accesibilidad añadida: aria-expanded, cierre con Escape y foco devuelto
 * al botón.
 */
import { durations } from './motion';

const SLIDE_MS = durations.menuSlide;

function slide(el: HTMLElement, open: boolean) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.classList.toggle('slicknav_hidden', !open);
  if (reduce) return;
  const h = el.scrollHeight;
  el.animate(
    open ? [{ height: '0px', overflow: 'hidden' }, { height: `${h}px`, overflow: 'hidden' }]
         : [{ height: `${h}px`, overflow: 'hidden', display: 'block' }, { height: '0px', overflow: 'hidden', display: 'block' }],
    { duration: SLIDE_MS, easing: 'ease' },
  );
}

function init() {
  const btn = document.querySelector<HTMLAnchorElement>('.navbar-toggle .slicknav_btn');
  const nav = document.getElementById('mobile-menu');
  if (!btn || !nav) return;

  const setOpen = (open: boolean) => {
    btn.classList.toggle('slicknav_open', open);
    btn.classList.toggle('slicknav_collapsed', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    slide(nav, open);
  };

  btn.addEventListener('click', (e) => {
    e.preventDefault(); // el href="#mobile-menu" es solo el respaldo sin JS
    setOpen(!btn.classList.contains('slicknav_open'));
  });
  // role="button" en un <a>: la barra espaciadora también tiene que activarlo.
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); btn.click(); }
  });

  nav.querySelectorAll<HTMLButtonElement>('.slicknav_row').forEach((row) => {
    row.addEventListener('click', () => {
      const li = row.parentElement!;
      const sub = li.querySelector<HTMLElement>(':scope > ul')!;
      const open = !li.classList.contains('slicknav_open');
      li.classList.toggle('slicknav_open', open);
      li.classList.toggle('slicknav_collapsed', !open);
      row.setAttribute('aria-expanded', String(open));
      slide(sub, open);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.classList.contains('slicknav_open')) {
      setOpen(false);
      btn.focus();
    }
  });
}

init();
