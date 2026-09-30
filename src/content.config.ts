/**
 * content.config.ts — Content Collections con esquemas zod.
 *
 * Equivalente en Next.js: una carpeta de .md/.json + un parser con zod que
 * valida el frontmatter en build. Acá Astro lo hace solo, con tipos
 * autogenerados: `getCollection('posts')` devuelve entradas ya tipadas y
 * un campo faltante rompe el build (no llega un `undefined` a producción).
 *
 * `image()` convierte la ruta relativa del frontmatter en un objeto que
 * entiende <Image /> de astro:assets (con width/height reales), así cada
 * imagen del contenido se optimiza y nunca produce saltos de diseño.
 *
 * El contenido lo migró tools/extract-content.mjs desde el HTML original.
 */
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';


/**
 * Campos AGREGADOS por el Agente B (Fase 3) para las páginas de detalle.
 * Todos son opcionales o tienen default: una entrada sin ellos sigue siendo
 * válida y su detalle simplemente omite ese bloque.
 *
 * Por qué hay bloques en el frontmatter y no todo en el cuerpo Markdown:
 * Markdown no optimiza las imágenes escritas como <img> HTML, y la sintaxis
 * ![](...) las envuelve en un <p> que rompe el marcado del diseño. Las fotos
 * y los ítems con ícono van tipados acá (image() → astro:assets); el texto
 * corrido (párrafos, citas, listas) va en el cuerpo Markdown.
 */

/** <h1> del detalle partido en texto + palabra en cursiva (<span>). Si falta, se usa el título. */
const heading = z.object({ title: z.string(), accent: z.string().optional() }).optional();

/** Colecciones con página de detalle → un .md por entrada (el cuerpo es la página). */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Texto corto de la tarjeta (.service-item). */
      summary: z.string(),
      icon: image(),
      image: image(),
      /** Posición en listados (el original no ordena por fecha). */
      order: z.number().int(),
      heading,
      /** Bloque "What we offer" (.service-offer-box). Los íconos los pone la plantilla. */
      offer: z
        .object({
          title: z.string().default('What we'),
          accent: z.string().default('offer'),
          text: z.string(),
          items: z.array(z.string()),
        })
        .optional(),
      /** Bloque "Why choose us" (.service-why-choose-box). */
      whyChoose: z
        .object({
          title: z.string().default('Why choose'),
          accent: z.string().default('us'),
          text: z.string(),
          points: z.array(z.string()).default([]),
          images: z.array(image()).default([]),
        })
        .optional(),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/portfolio' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Etiqueta sobre la foto ("Bridal", "Wedding"…). */
      category: z.string(),
      image: image(),
      order: z.number().int(),
      heading,
      /** Ficha del sidebar del detalle ("Portfolio Information"). */
      client: z.string().optional(),
      duration: z.string().optional(),
      location: z.string().optional(),
      /** Bloque "Creative vision behind the shoot" (.portfolio-creative-box). */
      creative: z
        .object({
          title: z.string().default('Creative vision behind'),
          accent: z.string().default('the shoot'),
          text: z.string(),
          image: image(),
          points: z.array(z.string()).default([]),
          note: z.string().optional(),
        })
        .optional(),
      /** Galería al pie del detalle (.portfolio-image-gallary-box). */
      gallery: z.array(image()).default([]),
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      pubDate: z.coerce.date(),
      author: z.string().default('Admin'),
      tags: z.array(z.string()).default([]),
      /** Para SEO; si falta se usa el título. */
      description: z.string().optional(),
      heading,
    }),
});

const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      image: image(),
      order: z.number().int(),
      heading,
      /** Lista de contacto del detalle (.team-about-content). */
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      experience: z.string().optional(),
      /** Bloque "Expertise & role" (.team-experience-info). Los íconos los pone la plantilla. */
      expertise: z
        .object({
          title: z.string().default('Expertise &'),
          accent: z.string().default('role'),
          text: z.string(),
          items: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
          note: z.string().optional(),
        })
        .optional(),
      /** Bloque "Working skill" (.team-skill-box). percent: 0–100. */
      skillImage: image().optional(),
      skills: z.array(z.object({ title: z.string(), percent: z.number().min(0).max(100) })).default([]),
    }),
});

/** Colecciones sin página propia → un solo JSON con todas las entradas. */
const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      quote: z.string(),
      avatar: image(),
      rating: z.number().int().min(1).max(5),
      order: z.number().int(),
    }),
});

const faqs = defineCollection({
  loader: file('src/content/faqs.json'),
  schema: z.object({
    /** Título del grupo en /faqs, partido en texto + palabra en cursiva (<span>). */
    group: z.string(),
    groupAccent: z.string(),
    groupOrder: z.number().int(),
    order: z.number().int(),
    question: z.string(),
    answer: z.string(),
    /** true → aparece en el acordeón de la home, /about, /services… */
    featured: z.boolean(),
  }),
});

const gallery = defineCollection({
  loader: file('src/content/gallery.json'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      /** 'wedding' = galería filtrable de la home · 'photos' = /image-gallery */
      album: z.enum(['wedding', 'photos']),
      /** Clases de filtro del original (pre-wedding, engagement, haldi). */
      filters: z.array(z.string()).default([]),
      category: z.string().optional(),
      title: z.string().optional(),
      order: z.number().int(),
    }),
});

const videos = defineCollection({
  loader: file('src/content/videos.json'),
  schema: ({ image }) =>
    z.object({
      url: z.url(),
      thumbnail: image(),
      order: z.number().int(),
    }),
});

const packages = defineCollection({
  loader: file('src/content/packages.json'),
  schema: z.object({
    title: z.string(),
    price: z.string(),
    description: z.string(),
    order: z.number().int(),
  }),
});

export const collections = { services, portfolio, posts, team, testimonials, faqs, gallery, videos, packages };

