// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // URL pública: la usan el sitemap y las URLs canónicas / Open Graph.
  // Se puede sobreescribir con la variable de entorno SITE_URL al desplegar.
  site: process.env.SITE_URL ?? 'https://photoclick.example.com',

  // URLs limpias con barra final (/about/). Equivale a trailingSlash de Next.
  trailingSlash: 'always',

  integrations: [sitemap()],

  // Fuentes servidas desde el propio sitio (reemplaza el <link> a Google Fonts).
  // Astro las descarga al compilar, genera los @font-face, hace preload y crea
  // una fuente de respaldo con métricas ajustadas para evitar saltos de diseño.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Mona Sans',
      cssVariable: '--font-mona-sans',
      weights: ['200 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      weights: ['400 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['serif'],
    },
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Bootstrap 5.3 todavía usa @import y funciones globales de Sass que
          // Dart Sass marca como obsoletas. Son avisos de la librería (no de
          // nuestro código), así que se silencian para que el build quede limpio.
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        },
      },
    },
  },
});
