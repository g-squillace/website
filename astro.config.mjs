// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.guidosquillace.it',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'www.datocms-assets.com' }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
