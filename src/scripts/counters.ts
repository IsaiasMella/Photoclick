/**
 * counters.ts — Contadores y barras de habilidades.
 * Reemplaza a jquery.counterup.min.js + jquery.waypoints.min.js (y al
 * $.animate de las barras en function.js).
 *
 * Lo carga src/scripts/global.ts con loadWhenNear() cuando la sección se acerca
 * a la pantalla (ningún componente lo importa directo; ver load-when-near.ts).
 *
 * Engancha:
 *   .counter  → <span class="counter">500</span>+ (enteros, decimales como
 *               "4.9" y miles con coma como "58,900", igual que counterUp).
 *   .skills-progress-bar .skillbar .count-bar → barra que se llena hasta el
 *               porcentaje de data-percent="80%". En el original el atributo
 *               está en .skillbar (no en .count-bar); se leen los dos.
 *
 * Sin JS (o antes de entrar en pantalla) se ve el número FINAL, porque es el
 * texto del HTML: counterUp tampoco lo tocaba hasta que el elemento aparecía.
 * Las barras: si el componente las trae con style="width: 80%" (recomendado,
 * para que sin JS se vean llenas), este script las vuelve a 0 y las anima.
 *
 * Diferencias con el original (a propósito):
 *   - IntersectionObserver en vez de escuchar el scroll (Waypoints) y
 *     requestAnimationFrame en vez de 500 setTimeout encadenados.
 *   - Con prefers-reduced-motion no se anima: queda el valor final.
 */

import { durations } from './motion';

/** Tiempos copiados de function.js y de los defaults de los plugins. */
const COUNTER = {
  /** counterUp({ time: 3000 }): duración total del conteo (ms). Centralizado en motion.ts. */
  time: durations.counter,
  /** counterUp({ delay: 6 }): cada cuánto cambiaba el número (ms). Con
   *  time/delay sale la cantidad de pasos (500): el número avanza en esos
   *  mismos saltos, pero se pinta en cada frame. */
  delay: 6,
} as const;

const SKILL_BAR = {
  /** $.animate({ width }, 2000): duración del llenado (ms). Centralizado en motion.ts. */
  duration: durations.skillBar,
  /** Curva "swing" de jQuery = 0.5 − cos(p·π)/2 (= easeInOutSine). */
  easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
  /** Waypoint offset '70%': se dispara cuando el borde superior del bloque
   *  sube por encima del 70 % de la altura de la ventana → se recorta el
   *  30 % inferior del viewport. */
  rootMargin: '0px 0px -30% 0px',
} as const;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Contadores                                                          */
/* ------------------------------------------------------------------ */

/**
 * Lista de valores intermedios, con el mismo algoritmo de counterUp 1.0:
 * `divisions` pasos lineales; respeta decimales ("4.9" → "0.0" … "4.9") y
 * separador de miles con coma ("58,900").
 */
function buildSteps(text: string): string[] {
  const divisions = COUNTER.time / COUNTER.delay;
  const hasComma = /[0-9]+,[0-9]+/.test(text);
  const num = text.replace(/,/g, '');
  const isFloat = /^[0-9]+\.[0-9]+$/.test(num);
  const decimals = isFloat ? (num.split('.')[1] ?? '').length : 0;
  const value = Number(num);
  const steps: string[] = [];
  for (let i = divisions; i >= 1; i--) {
    let step = isFloat ? ((value / divisions) * i).toFixed(decimals) : String(Math.trunc((value / divisions) * i));
    if (hasComma) while (/(\d+)(\d{3})/.test(step)) step = step.replace(/(\d+)(\d{3})/, '$1,$2');
    steps.unshift(step);
  }
  return steps;
}

function runCounter(el: HTMLElement) {
  const final = (el.textContent ?? '').trim();
  // counterUp solo sabe contar números: si el texto no lo es, no se toca.
  if (!/^[0-9][0-9,]*(\.[0-9]+)?$/.test(final) || reducedMotion()) return;

  const steps = buildSteps(final);
  el.textContent = '0';
  let start: number | undefined;

  const tick = (now: number) => {
    // counterUp arrancaba con un setTimeout(delay): se respeta ese primer retardo.
    start ??= now + COUNTER.delay;
    const progress = Math.min(Math.max((now - start) / COUNTER.time, 0), 1);
    const index = Math.ceil(progress * steps.length) - 1;
    el.textContent = index < 0 ? '0' : (steps[index] ?? final);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('.counter');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  // Waypoint offset '100%': se dispara apenas el borde superior asoma por
  // abajo de la ventana. Una sola vez por elemento (this.destroy()).
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // Waypoints también disparaba si al cargar el elemento ya había quedado
      // por encima de la ventana (recarga con scroll): top < 0.
      if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) continue;
      io.unobserve(entry.target);
      runCounter(entry.target as HTMLElement);
    }
  });
  counters.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* Barras de habilidades                                               */
/* ------------------------------------------------------------------ */

function initSkillBars() {
  const groups = document.querySelectorAll<HTMLElement>('.skills-progress-bar');
  const bars = document.querySelectorAll<HTMLElement>('.skills-progress-bar .skillbar .count-bar');
  if (!groups.length || !bars.length) return;

  const percentOf = (bar: HTMLElement) =>
    bar.dataset['percent'] ?? bar.closest<HTMLElement>('.skillbar')?.dataset['percent'] ?? '';

  const fill = () => {
    bars.forEach((bar) => {
      const target = percentOf(bar);
      if (!target) return;
      bar.style.width = target;
      if (!reducedMotion()) {
        bar.animate([{ width: '0px' }, { width: target }], { duration: SKILL_BAR.duration, easing: SKILL_BAR.easing });
      }
    });
  };

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    fill();
    return;
  }

  // Punto de partida del original: barras vacías hasta que se disparan.
  bars.forEach((bar) => (bar.style.width = '0px'));

  // Como en function.js: el primer .skills-progress-bar que llega al 70 %
  // de la ventana llena TODAS las barras de la página (el handler recorría
  // $('.skillbar') completo). Solo la primera vez.
  let done = false;
  const io = new IntersectionObserver(
    (entries) => {
      if (done) return;
      const hit = entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0);
      if (!hit) return;
      done = true;
      io.disconnect();
      fill();
    },
    { rootMargin: SKILL_BAR.rootMargin },
  );
  groups.forEach((g) => io.observe(g));
}

initCounters();
initSkillBars();
