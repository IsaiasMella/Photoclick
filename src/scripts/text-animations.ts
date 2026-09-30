/**
 * text-animations.ts — Títulos animados letra por letra y revelado de fotos.
 *
 * Porte fiel de function.js (bloques "Text Effect Animation" e "Image Reveal
 * Animation") sin jQuery. Mismos parámetros, mismas clases:
 *   .text-anime-style-1  palabras desde la derecha (x: 20), delay 0.5
 *   .text-anime-style-2  letras desde la derecha (x: 20), stagger 0.03
 *   .text-anime-style-3  letras con rebote (back.out), stagger 0.02
 *   .text-effect         letras que se "encienden" con el scroll (scrub)
 *   .reveal              cortina que descubre la imagen
 *
 * GSAP (+ ScrollTrigger + SplitText, gratis desde la 3.13) se carga con
 * import() dinámico SOLO si la página tiene alguno de esos elementos; si
 * no, no se descarga ni un byte.
 */
import { eases } from './motion';

const SELECTOR = '.text-anime-style-1, .text-anime-style-2, .text-anime-style-3, .text-effect, .reveal';

export async function initTextAnimations() {
  if (!document.querySelector(SELECTOR)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Igual que el original: se espera a las fuentes para que SplitText mida
  // las líneas con la tipografía final (si no, los cortes de línea saltan).
  await document.fonts.ready;

  document.querySelectorAll<HTMLElement>('.reveal').forEach((container) => {
    const image = container.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: container, toggleActions: 'play none none none' } });
    tl.set(container, { autoAlpha: 1 });
    tl.from(container, { duration: 1, xPercent: -100, ease: eases.reveal });
    if (image) tl.from(image, { duration: 1, xPercent: 100, scale: 1, delay: -1, ease: eases.reveal });
  });

  document.querySelectorAll<HTMLElement>('.text-effect').forEach((el) => {
    const split = new SplitText(el, { type: 'lines,words,chars', linesClass: 'split-line' });
    gsap.set(split.chars, { opacity: 0.3, x: -7 });
    gsap.to(split.chars, {
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 60%', scrub: 1 },
      x: 0, y: 0, opacity: 1, duration: 0.7, stagger: 0.2,
    });
  });

  document.querySelectorAll<HTMLElement>('.text-anime-style-1').forEach((el) => {
    const split = new SplitText(el, { type: 'chars, words' });
    gsap.from(split.words, {
      duration: 1, delay: 0.5, x: 20, autoAlpha: 0, stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll<HTMLElement>('.text-anime-style-2').forEach((el) => {
    const split = new SplitText(el, { type: 'chars, words' });
    gsap.from(split.chars, {
      duration: 1, delay: 0.1, x: 20, autoAlpha: 0, stagger: 0.03, ease: eases.reveal,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll<HTMLElement>('.text-anime-style-3').forEach((el) => {
    const split = new SplitText(el, { type: 'lines,words,chars', linesClass: 'split-line' });
    gsap.set(el, { perspective: 400 });
    gsap.set(split.chars, { opacity: 0, x: 50 });
    gsap.to(split.chars, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      x: 0, y: 0, rotateX: 0, opacity: 1, duration: 1, ease: eases.textBounce, stagger: 0.02,
    });
  });
}
