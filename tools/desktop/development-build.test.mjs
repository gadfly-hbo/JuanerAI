import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createServer,build,resolveConfig} from 'vite';
const require=createRequire(import.meta.url);
const Generator=require('@electron-forge/plugin-vite/dist/ViteConfig.js').default;
const forge=require('../../forge.config.cjs');
test('DEV-01/03 installed Forge emits real Main/Preload with bounded development URL and no watchers',async t=>{
 const generator=new Generator(forge.plugins[0].config,process.cwd(),false);
 const server=await createServer({...((await generator.getRendererConfig())[0]),configFile:false});await server.listen();t.after(()=>server.close());
 for(const cfg of await generator.getBuildConfigs()){
  const resolved=await resolveConfig({...cfg,configFile:false},'build');assert.equal(resolved.build.watch,null);
  const output=await build({...cfg,configFile:false});assert.equal(typeof output.close,'undefined','build must not return a watcher');
 }
 const main=await readFile('.vite/build/main.cjs','utf8');
 assert.match(main,/http:\/\/localhost:5173/);assert.match(main,/http:\/\/127\.0\.0\.1:5173/);
 assert.match(main,/development-keychain\/xanthil-keychain/);
 assert.match(await readFile('.vite/build/preload.js','utf8'),/xanthil-desktop:v1/);
});

import {runInNewContext} from 'node:vm';
import ts from 'typescript';
test('DEV-01 compatible HMR does not render a new entry component before Fast Refresh',async()=>{
 const source=await readFile('apps/desktop/renderer.tsx','utf8');
 const offset=source.indexOf("const root = document.getElementById('root');");assert.ok(offset>0);
 const entry=ts.transpileModule(source.slice(offset),{compilerOptions:{jsx:ts.JsxEmit.React,jsxFactory:'element',target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replaceAll('import.meta','moduleMeta').replace('export {};','');
 const data={};let roots=0;const renders=[];
 const evaluate=hot=>runInNewContext(entry,{moduleMeta:{hot},document:{getElementById:()=>({})},window:{xanthilDesktopApi:{}},createRoot:()=>{roots++;return {render:node=>renders.push(node)};},element:type=>({type}),XanthilDesktopApp:function App(){}});
 evaluate({data});const initial=renders[0];evaluate({data});
 assert.equal(roots,1);assert.equal(renders.length,1,'entry must leave updates to Fast Refresh, avoiding an early remount');assert.equal(renders[0],initial);
 evaluate(undefined);assert.equal(roots,2);assert.equal(renders.length,2,'packaged initial mount remains intact');
});

import {mkdtempSync,readFileSync,mkdirSync,cpSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import * as nodeUrl from 'node:url';
import {desktopRuntimeResources} from './runtime-resources.mjs';
test('BF-R11 Q4: normal development and production Main builds resolve byte-identical fixed resources without source checkout or services',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'normal-resources-'));
 for(const production of [false,true]){
  const generator=new Generator(forge.plugins[0].config,process.cwd(),production),outDir=join(root,production?'production':'development');mkdirSync(outDir);
  for(const original of await generator.getBuildConfigs()){
   const config={...original,configFile:false,define:{...original.define,...(!production?{MAIN_WINDOW_VITE_DEV_SERVER_URL:JSON.stringify('http://localhost:5173')}:{})},build:{...original.build,outDir,emptyOutDir:false}};
   assert.equal((await resolveConfig(config,'build')).build.watch,null);const output=await build(config);assert.equal(typeof output.close,'undefined');
  }
  const resources=join(root,production?'packaged-Resources':'unused-Resources');mkdirSync(resources);if(production)cpSync(join(outDir,'xanthil-resources'),join(resources,'xanthil-resources'),{recursive:true,errorOnExist:true,force:false});
  const seen=[],entry=join(outDir,'main.cjs'),app={isPackaged:production,getPath:()=>join(root,'appdata'),setName(){},setPath(){},setAppLogsPath(){},requestSingleInstanceLock:()=>false,quit(){}};
  runInNewContext(readFileSync(entry,'utf8'),{exports:{},__filename:entry,__dirname:outDir,URL,Buffer,AbortController,TextEncoder,TextDecoder,process:{...process,resourcesPath:resources,env:{JUANERAI_DESKTOP_DEV_ROOT:join(root,'owned-dev')},execPath:'/synthetic/Electron'},require:id=>{
   if(id==='electron')return {app};if(id==='node:url')return {...nodeUrl,fileURLToPath(value){const path=nodeUrl.fileURLToPath(value);seen.push(path);return path;},pathToFileURL(value){seen.push(value);return nodeUrl.pathToFileURL(value);}};
   if(id==='node:child_process')return {spawn(){assert.fail('no child processes');},execFile(){assert.fail('no helper or Provider');}};return require(id);
  },setTimeout(){assert.fail('no runtime scheduling');},clearTimeout(){},console});
  const base=join(production?resources:outDir,'xanthil-resources'),supervisor=join(base,'adapters/analytics-duckdb/member-preparation-supervisor.py'),browserModule=join(base,'apps/browser/local-server.ts');assert.ok(seen.includes(supervisor),'actual compiled helper consumer resolves file path');assert.ok(seen.includes(browserModule),'actual compiled server binds bundle resource base');
  const manifest=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));assert.equal(manifest.files.length,7);
  for(const f of manifest.files){const bytes=readFileSync(join(base,f.path));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.deepEqual(bytes,readFileSync(f.path));}
  for(const relative of ['index.html','bootstrap.mjs','workspace.mjs','client.mjs','styles.css','../desktop/assets/juanerai-logo-slogan.png'])assert.deepEqual(readFileSync(new URL(relative,nodeUrl.pathToFileURL(browserModule))),readFileSync(join('apps/browser',relative)));
 }
 assert.ok(forge.packagerConfig.extraResource.includes('.vite/build/xanthil-resources'));assert.ok(forge.packagerConfig.extraResource.includes('build/xanthil-toolchain-deployment.json'));assert.equal(forge.packagerConfig.asar,true);
});
test('BF-R11 Q4: resource assembly refuses missing duplicate and changed consumers',()=>{
 const make=()=>{const p=desktopRuntimeResources();p.buildStart();return p;},code='const url=import.meta.url;',executor=resolve('adapters/analytics-duckdb/member-preparation-executor.ts'),server=resolve('apps/browser/local-server.ts');
 assert.throws(()=>make().generateBundle.call({emitFile(){}},{},{}),/missing runtime resource consumer/);
 const duplicate=make();duplicate.transform(code,executor);assert.throws(()=>duplicate.transform(code,executor),/duplicate resource module/);
 for(const text of ['no URL','import.meta.url;import.meta.url'])assert.throws(()=>make().transform(text,server),/resource module URL shape changed/);
 const occupied=make();occupied.transform(code,executor);occupied.transform(code,server);assert.throws(()=>occupied.generateBundle.call({emitFile(){}},{},{'xanthil-resources/adapters/analytics-duckdb/member-preparation-supervisor.py':{}}),/duplicate runtime resource/);
});
