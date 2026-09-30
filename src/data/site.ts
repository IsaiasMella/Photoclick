/**
 * site.ts — Datos globales del sitio (lo que en el original estaba repetido
 * a mano en las 18 páginas: menú, pie, contacto, redes).
 *
 * Equivalente en Next.js: un `config/site.ts` importado por el layout.
 * Cambiar algo acá lo cambia en todas las páginas.
 */

/** Rutas del sitio en un solo lugar: nunca se escriben URLs sueltas en componentes. */
export const routes = {
  home: '/',
  homeVideo: '/index-video/',
  homeSlider: '/index-slider/',
  about: '/about/',
  services: '/services/',
  service: (slug: string) => `/services/${slug}/`,
  blog: '/blog/',
  blogPage: (n: number) => (n <= 1 ? '/blog/' : `/blog/page/${n}/`),
  post: (slug: string) => `/blog/${slug}/`,
  portfolio: '/portfolio/',
  project: (slug: string) => `/portfolio/${slug}/`,
  team: '/team/',
  member: (slug: string) => `/team/${slug}/`,
  testimonials: '/testimonials/',
  imageGallery: '/image-gallery/',
  videoGallery: '/video-gallery/',
  faqs: '/faqs/',
  contact: '/contact/',
  notFound: '/404/',
} as const;

/** Primer ítem de cada colección: a dónde apuntan los "… Details" del menú. */
export const detailExamples = {
  service: 'pre-wedding-photography',
  post: 'how-to-pose-naturally-for-your-wedding-photos',
  project: 'achieve-fitness-goal-natural',
  member: 'elena-rossi',
} as const;

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const mainNav: NavItem[] = [
  {
    label: 'Home',
    href: routes.home,
    children: [
      { label: 'Home - Main', href: routes.home },
      { label: 'Home - Video', href: routes.homeVideo },
      { label: 'Home - Slider', href: routes.homeSlider },
    ],
  },
  { label: 'About Us', href: routes.about },
  { label: 'Services', href: routes.services },
  { label: 'Blog', href: routes.blog },
  {
    label: 'Pages',
    href: '#',
    children: [
      { label: 'Service Details', href: routes.service(detailExamples.service) },
      { label: 'Blog Details', href: routes.post(detailExamples.post) },
      { label: 'Our Portfolio', href: routes.portfolio },
      { label: 'Portfolio Details', href: routes.project(detailExamples.project) },
      { label: 'Our Team', href: routes.team },
      { label: 'Team Details', href: routes.member(detailExamples.member) },
      { label: 'Testimonials', href: routes.testimonials },
      { label: 'Image Gallery', href: routes.imageGallery },
      { label: 'Video Gallery', href: routes.videoGallery },
      { label: 'FAQs', href: routes.faqs },
      { label: '404', href: routes.notFound },
    ],
  },
  { label: 'Contact Us', href: routes.contact },
];

export const site = {
  name: 'Photoclick',
  /** Título por defecto (el mismo <title> del original). */
  title: 'Photoclick - Wedding Photography HTML Template',
  description:
    'Photoclick captures love, emotions and timeless memories through creative and elegant wedding photography.',
  lang: 'en',
  /** D2 del plan: el preloader se puede apagar desde acá. */
  preloader: true,
  contact: {
    phone: '(123) 456 789',
    phoneHref: 'tel:123456789',
    email: 'info@domain.com',
    address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
  },
  hours: ['Monday - Saturday: 9:00 AM - 7:00 PM', 'Sunday: By Appointment'],
  /** Redes: `icon` es el nombre del ícono de Font Awesome (ver Icon.astro). */
  social: [
    { label: 'Pinterest', href: '#', icon: 'pinterest-p' },
    { label: 'X (Twitter)', href: '#', icon: 'x-twitter' },
    { label: 'Facebook', href: '#', icon: 'facebook-f' },
    { label: 'Instagram', href: '#', icon: 'instagram' },
  ],
  footer: {
    about:
      'Capturing love, emotions, and timeless memories through creative and elegant wedding photography. We turn your special moments.',
    quickLinks: [
      { label: 'Home', href: routes.home },
      { label: 'About Us', href: routes.about },
      { label: 'Our Services', href: routes.services },
      { label: 'portfolio', href: routes.portfolio },
      { label: 'Contact Us', href: routes.contact },
    ],
    /** El original apunta todos a service-single.html; acá, al primer servicio. */
    services: ['Wedding Photography', 'Candid Photography', 'Pre-Wedding Shoots', 'Drone Coverage', 'Album Designing'],
    copyright: 'Copyright © 2026 All Rights Reserved.',
  },
  /** D6 del plan: endpoint para formularios (contacto y newsletter). */
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined,
} as const;
