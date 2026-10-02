/**
 * lazy-video.ts — Videos de fondo que se reproducen solo cuando se ven.
 * (Nuevo: no existe en el original. Decisión D8 de docs/PLAN.md.)
 *
 * Lo carga src/scripts/global.ts con loadWhenNear() cuando la sección se acerca
 * a la pantalla (ningún componente lo importa directo; ver load-when-near.ts).
 *
 * Engancha:
 *   <video data-lazy-video muted playsinline loop preload="none">
 *     <source src="/videos/…mp4" type="video/mp4">
 *   </video>
 *
 * En el original eran <video autoplay muted loop>: los 3 MB de cada video se
 * descargaban al abrir la página aunque estuvieran muy abajo. Acá llegan con
 * preload="none" y sin autoplay; al entrar en pantalla se reproducen (el
 * navegador recién ahí los descarga) y al salir se pausan (ahorra CPU y
 * batería). A la vista es lo mismo: cuando el usuario llega, ya se mueve.
 *
 * El video del hero de index-video NO usa esto: está arriba de todo y lleva
 * autoplay normal.
 *
 * Con prefers-reduced-motion: se carga y se muestra el primer cuadro, pero
 * no se reproduce (WCAG 2.2.2: movimiento automático de más de 5 s).
 */

const LAZY_VIDEO = {
  /** Margen para empezar un poco antes de que asome (px por abajo y por
   *  arriba): así el primer cuadro ya está cuando el video entra. */
  rootMargin: '200px 0px',
} as const;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initLazyVideos() {
  const videos = document.querySelectorAll<HTMLVideoElement>('video[data-lazy-video]');
  if (!videos.length) return;

  const play = (video: HTMLVideoElement) => {
    // Muted es requisito para que el navegador permita reproducir sin gesto
    // del usuario. Se asegura la propiedad (el atributo solo fija el default).
    video.muted = true;
    if (reducedMotion.matches) {
      // Solo el primer cuadro: se pide cargar sin reproducir.
      if (video.preload === 'none') {
        video.preload = 'auto';
        video.load();
      }
      return;
    }
    // play() devuelve una promesa que se rechaza si el navegador lo bloquea
    // (ahorro de datos, etc.): no es un error de la página.
    video.play().catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    videos.forEach(play);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) play(video);
        else if (!video.paused) video.pause();
      }
    },
    { rootMargin: LAZY_VIDEO.rootMargin },
  );
  videos.forEach((v) => io.observe(v));

  // Si la preferencia cambia con la página abierta: pausar o reanudar los visibles.
  reducedMotion.addEventListener('change', () => {
    videos.forEach((v) => {
      if (reducedMotion.matches) v.pause();
      else {
        const r = v.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) play(v);
      }
    });
  });
}

initLazyVideos();

// Sin imports estáticos: esto lo marca como módulo (ámbito propio, no global).
export {};
