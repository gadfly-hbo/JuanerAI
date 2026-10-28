import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build,loadConfigFromFile,mergeConfig} from 'vite';

/** Actual installed Forge Main composition; no Electron process/installer starts. */
test('D07 Main build retains Node platform and loads the exact installed public SDK instead of a bundled copy',{timeout:30000},async()=>{
 const output=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'build-')),root=process.cwd(),require=createRequire(import.meta.url);
 const {getConfig}=require('../../../node_modules/@electron-forge/plugin-vite/dist/config/vite.main.config.js');
 const env={root,mode:'production',command:'build' as const},loaded=await loadConfigFromFile(env,'vite.main.config.mjs');assert.ok(loaded);
 const config=getConfig({...env,forgeConfig:{renderer:[]},forgeConfigSelf:{entry:'apps/browser/installed-main.ts',target:'main'}},loaded.config);
 const logs:string[]=[];await build(mergeConfig(config,{configFile:false,build:{outDir:output,emptyOutDir:false},customLogger:{hasWarned:false,info:(m:string)=>{logs.push(m);},warn:(m:string)=>{logs.push(m);},warnOnce:(m:string)=>{logs.push(m);},error:(m:string)=>{logs.push(m);},clearScreen(){},hasErrorLogged:()=>false}}));
 const content=readFileSync(join(output,'main.cjs'),'utf8');assert.match(content,/require\(["']pi-agent-runtime["']\)/,'build must resolve the same fixed public C installation at runtime');assert.doesNotMatch(logs.join('\n'),/externalized for browser compatibility/,'actual Forge Main must use Node module conditions');
});
