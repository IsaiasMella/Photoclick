/**
 * load-when-near.ts — Descarga un comportamiento recién cuando su sección se
 * acerca a la pantalla.
 *
 * Por qué: si cada sección importa su script directamente, el navegador pide
 * TODOS los scripts de la página al cargar (Swiper, Isotope, el visor…) con
 * prioridad alta, compitiendo con la foto del hero y las fuentes. Lighthouse
 * en celular lo penalizaba en el LCP. Así, lo que está abajo se baja cuando
 * hace falta; lo que ya está en pantalla (el slider del hero) se baja enseguida.
 *
 * Next.js: equivale a `dynamic(() => import(...), { ssr: false })` disparado
 * por un IntersectionObserver.
 */
export function loadWhenNear(selector: string, load: () => Promise<unknown>, rootMargin = '800px') {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    void load();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void load();
    },
    { rootMargin },
  );
  els.forEach((el) => io.observe(el));
}
