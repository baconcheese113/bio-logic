import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    svelte({ inspector: false }),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        prototypes: resolve(__dirname, 'prototypes/index.html'),
        'svelte-lab-avatar': resolve(__dirname, 'prototypes/svelte-lab-avatar/index.html'),
      },
    },
  },
});