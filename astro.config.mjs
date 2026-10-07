// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

// Dépôt de projet GitHub Pages : https://<user>.github.io/woordjes/
// Si tu changes de dépôt ou de compte, adapte `site` et `base` ici (et le README).
const site = 'https://anthonyrichir.github.io';
const base = '/woordjes';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    AstroPWA({
      // Mise à jour silencieuse du service worker : les élèves ont toujours la dernière version.
      registerType: 'autoUpdate',
      manifest: {
        name: 'Woordjes',
        short_name: 'Woordjes',
        description: 'Woordjes – Mot à Mot : révise ton vocabulaire néerlandais avec Uiltje le hibou.',
        lang: 'fr',
        start_url: `${base}/`,
        scope: `${base}/`,
        display: 'standalone',
        orientation: 'any',
        background_color: '#FFF8EC',
        theme_color: '#6C4AB6',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache de tout le site statique. Les leçons CSV sont intégrées dans les pages
        // au moment du build, donc elles sont précachées avec le HTML/JS : 100 % hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: `${base}/`,
        // Les polices Google sont mises en cache à la première visite pour l'usage hors ligne.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-files', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
