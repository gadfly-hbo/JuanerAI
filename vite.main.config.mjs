import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'apps/desktop/main.ts',
      fileName: () => '[name].cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'node:url'],
    },
  },
});
