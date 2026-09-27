import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'apps/desktop',
  build: {
    outDir: '../../.vite/renderer/main_window',
  },
  base: './',
  plugins: [react()],
});
