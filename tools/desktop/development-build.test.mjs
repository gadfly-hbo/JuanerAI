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
