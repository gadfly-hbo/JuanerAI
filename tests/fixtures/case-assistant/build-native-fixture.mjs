import {build} from 'vite';
await build({configFile:false,build:{lib:{entry:'tests/fixtures/case-assistant/native-synthetic-main.ts',formats:['cjs'],fileName:()=> 'native-synthetic-main.cjs'},outDir:'build/case-assistant-tests',emptyOutDir:false,rollupOptions:{external:['electron',/^node:/,/^@earendil-works\//]}}});
