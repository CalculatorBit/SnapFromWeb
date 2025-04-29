// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import favicons from 'astro-favicons';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  trailingSlash: 'always',
  integrations: [sitemap(), react(), favicons()],
  vite: {
    plugins: [tailwindcss()]
  }
});