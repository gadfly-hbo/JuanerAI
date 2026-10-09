import { desktopRuntimeResources } from './tools/desktop/runtime-resources.mjs';
import { explicitDesktopRestart } from './tools/desktop/development-vite.mjs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [explicitDesktopRestart(), desktopRuntimeResources()],
  build: {
    // Main and Preload changes become active only after an explicit restart.
    watch: null,
    lib: {
      entry: 'apps/desktop/main.ts',
      fileName: () => '[name].cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      // Pi resolves its ESM resources relative to import.meta.url. Load the
      // installed production closure instead of rewriting it into a CJS chunk.
      external: ['electron', 'node:url', '@earendil-works/pi-coding-agent'],
    },
  },
});
