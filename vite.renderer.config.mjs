import { resolve } from 'node:path';
import { developmentServerBoundary, origin } from './tools/desktop/development-vite.mjs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'apps/desktop',
  publicDir: false,
  optimizeDeps: {noDiscovery:true,holdUntilCrawlEnd:false,include:['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom/client']},
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    allowedHosts: ['127.0.0.1'], cors: {origin},
    hmr: {host:'127.0.0.1',port:5173},
    fs: {strict:true,allow:[resolve('apps/desktop'),resolve('packages/product-core/case-assistant.ts'),resolve('node_modules/.vite'),resolve('node_modules/vite/dist/client')]},
  },
  build: {
    outDir: '../../.vite/renderer/main_window',
  },
  base: './',
  plugins: [react(), developmentServerBoundary()],
});
