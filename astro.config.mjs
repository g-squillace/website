// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.guidosquillace.it',
  trailingSlash: 'ignore',
  output: 'static',
  adapter: netlify(),
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'www.datocms-assets.com' }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
