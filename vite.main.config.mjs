import { defineConfig } from 'vite';

export default defineConfig({
  build: {
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
