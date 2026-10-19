import { desktopRuntimeResources } from './tools/desktop/runtime-resources.mjs';
import { explicitDesktopRestart } from './tools/desktop/development-vite.mjs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [explicitDesktopRestart(), desktopRuntimeResources()],
  build: {
    // Main and Preload changes become active only after an explicit restart.
    watch: null,
    lib: {
      entry: (process.env.JUANERAI_REPORT_STUDIO_PACKAGE==='1'||process.env.JUANERAI_DEEP_RESEARCH_PACKAGE==='1'||process.env.JUANERAI_METRIC_FACTORY_PACKAGE==='1')?'apps/browser/installed-main.ts':'apps/desktop/main.ts',
      fileName: () => (process.env.JUANERAI_REPORT_STUDIO_PACKAGE==='1'||process.env.JUANERAI_DEEP_RESEARCH_PACKAGE==='1'||process.env.JUANERAI_METRIC_FACTORY_PACKAGE==='1')?'main.cjs':'[name].cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      // Pi resolves its ESM resources relative to import.meta.url. Load the
      // installed production closure instead of rewriting it into a CJS chunk.
      external: ['electron', 'node:url', '@earendil-works/pi-coding-agent'],
    },
  },
});
