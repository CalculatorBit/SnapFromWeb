// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import favicons from 'astro-favicons';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  trailingSlash: 'always',
  integrations: [sitemap(), react(), favicons()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: node({
    mode: 'standalone'
  })
});