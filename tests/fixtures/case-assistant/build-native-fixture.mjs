import {build,loadConfigFromFile,mergeConfig} from 'vite';
import {createRequire} from 'node:module';import {mkdtempSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
// Current production Forge Main composition only; no Electron process or installer.
const root=process.cwd(),require=createRequire(import.meta.url),{getConfig}=require('../../../node_modules/@electron-forge/plugin-vite/dist/config/vite.main.config.js');
const env={root,mode:'production',command:'build'},loaded=await loadConfigFromFile(env,'vite.main.config.mjs');if(!loaded)throw Error('MAIN_CONFIG_REQUIRED');
const output=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'main-build-'));
await build(mergeConfig(getConfig({...env,forgeConfig:{renderer:[]},forgeConfigSelf:{entry:'apps/browser/installed-main.ts',target:'main'}},loaded.config),{configFile:false,build:{outDir:output,emptyOutDir:false}}));
writeFileSync(join(output,'BUILD-OBSERVED.json'),JSON.stringify({root,output,entry:'apps/browser/installed-main.ts',kind:'component-build-only',Electron:'NOT_RUN',Provider:'NOT_RUN'},null,2)+'\n');
