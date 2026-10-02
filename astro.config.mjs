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

  build: {
    // 'auto' (default): el CSS va en un archivo aparte, cacheable entre páginas.
    // Se probó 'always' (CSS dentro de cada HTML, sin viaje de red extra):
    // en Lighthouse celular dio PEOR (home: 89 y LCP 3,7 s contra 90 y 3,5 s),
    // porque el HTML pasa de ~10 a ~45 KB y retrasa todo lo demás.
    inlineStylesheets: 'auto',
  },

  // Fuentes servidas desde el propio sitio (reemplaza el <link> a Google Fonts).
  // Astro las descarga al compilar, genera los @font-face, hace preload y crea
  // una fuente de respaldo con métricas ajustadas para evitar saltos de diseño.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Mona Sans',
      cssVariable: '--font-mona-sans',
      weights: ['200 900'],
      // Solo "normal": medido en todas las páginas, Mona Sans nunca se usa en
      // cursiva. El original igual bajaba la cursiva (Google Fonts, ital 0..1).
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      weights: ['400 900'],
      // Solo "italic": Playfair aparece únicamente en los <span> en cursiva de
      // los títulos. Precargar 2 fuentes en vez de 4 ahorra ~77 KB en la carga.
      styles: ['italic'],
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
