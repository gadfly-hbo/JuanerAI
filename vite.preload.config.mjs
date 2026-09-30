import { explicitDesktopRestart } from './tools/desktop/development-vite.mjs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [explicitDesktopRestart()],
  build: {
    // Main and Preload changes become active only after an explicit restart.
    watch: null,
    rollupOptions: {
      external: ['electron'],
    },
  },
});
