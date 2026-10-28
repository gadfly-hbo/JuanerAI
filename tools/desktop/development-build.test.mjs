import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createServer,build,resolveConfig} from 'vite';
const require=createRequire(import.meta.url);
const Generator=require('@electron-forge/plugin-vite/dist/ViteConfig.js').default;
const forge=require('../../forge.config.cjs');


import {runInNewContext} from 'node:vm';
import ts from 'typescript';


import {mkdtempSync,readFileSync,mkdirSync,cpSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import * as nodeUrl from 'node:url';
import {desktopRuntimeResources} from './runtime-resources.mjs';
test('RS-MAIN-COMPAT-036: actual server fingerprint and new workbench stylesheet resolve entirely inside emitted resources',async()=>{
 const plugin=desktopRuntimeResources();plugin.buildStart();
 const executor='adapters/analytics-duckdb/member-preparation-executor.ts',server='apps/browser/local-server.ts';
 for(const file of [executor,server,'adapters/analytics-duckdb/open-document-source.ts'])plugin.transform(readFileSync(file,'utf8'),resolve(file));
 const emitted=[];plugin.generateBundle.call({emitFile(asset){emitted.push(asset);}},{},{});
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'bui-resource-closure-'));
 for(const file of emitted){const target=join(root,file.fileName);mkdirSync(dirname(target),{recursive:true});require('node:fs').writeFileSync(target,file.source);}
 const source=readFileSync(server,'utf8'),statement=source.split('\n').find(line=>line.includes('const workbenchVersion='));assert.ok(statement);
 const originalURL=nodeUrl.pathToFileURL(join(root,'xanthil-resources',server)).href;
 const result=runInNewContext(statement.replaceAll('import.meta.url','resourceURL')+';workbenchVersion',{resourceURL:originalURL,Date,process:{pid:1,version:process.version},createHash,readFileSync,URL});
 assert.equal(result.contract,'BUI-20261015-004');assert.equal(Object.keys(result.source_sha256).length,7);
 for(const [file,digest]of Object.entries(result.source_sha256))assert.equal(digest,createHash('sha256').update(readFileSync(file)).digest('hex'));
 assert.deepEqual(readFileSync(join(root,'xanthil-resources/apps/browser/browser-workbench.css')),readFileSync('apps/browser/browser-workbench.css'));
});
test('BF-R11 Q4: normal development and production Main builds resolve byte-identical fixed resources without source checkout or services',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'normal-resources-'));
 for(const production of [false,true]){
  const generator=new Generator(forge.plugins[0].config,process.cwd(),production),outDir=join(root,production?'production':'development');mkdirSync(outDir);
  for(const original of await generator.getBuildConfigs()){
   const config={...original,configFile:false,define:{...original.define},build:{...original.build,outDir,emptyOutDir:false}};
   assert.equal((await resolveConfig(config,'build')).build.watch,null);const output=await build(config);assert.equal(typeof output.close,'undefined');
  }
  const resources=join(root,production?'packaged-Resources':'unused-Resources');mkdirSync(resources);if(production)cpSync(join(outDir,'xanthil-resources'),join(resources,'xanthil-resources'),{recursive:true,errorOnExist:true,force:false});
  const seen=[],entry=join(outDir,'main.cjs'),app={isPackaged:production,getPath:()=>join(root,'appdata'),setName(){},setPath(){},setAppLogsPath(){},requestSingleInstanceLock:()=>false,quit(){}};
  runInNewContext(readFileSync(entry,'utf8'),{exports:{},__filename:entry,__dirname:outDir,URL,Buffer,AbortController,TextEncoder,TextDecoder,process:{...process,resourcesPath:resources,env:{JUANERAI_DESKTOP_DEV_ROOT:join(root,'owned-dev')},execPath:'/synthetic/Electron'},require:id=>{
   if(id==='electron')return {app};if(id==='node:url')return {...nodeUrl,fileURLToPath(value){const path=nodeUrl.fileURLToPath(value);seen.push(path);return path;},pathToFileURL(value){seen.push(value);return nodeUrl.pathToFileURL(value);}};
   if(id==='node:child_process')return {spawn(){assert.fail('no child processes');},execFile(){assert.fail('no helper or Provider');}};if(id.startsWith('.')){assert.ok(resolve(dirname(entry),id).startsWith(outDir+'/'));return createRequire(entry)(id);}return require(id);
  },setTimeout(){assert.fail('no runtime scheduling');},clearTimeout(){},console});
  const base=join(production?resources:outDir,'xanthil-resources'),supervisor=join(base,'adapters/analytics-duckdb/member-preparation-supervisor.py'),browserModule=join(base,'apps/browser/local-server.ts');assert.ok(seen.includes(supervisor),'actual compiled helper consumer resolves file path');assert.ok(seen.includes(browserModule),'actual compiled server binds bundle resource base');
  const manifest=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));assert.equal(manifest.files.length,22);
  for(const f of manifest.files){const bytes=readFileSync(join(base,f.path));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.deepEqual(bytes,readFileSync(f.path));}
  for(const relative of ['index.html','bootstrap.mjs','workspace.mjs','client.mjs','styles.css','../desktop/assets/juanerai-logo-slogan.png'])assert.deepEqual(readFileSync(new URL(relative,nodeUrl.pathToFileURL(browserModule))),readFileSync(join('apps/browser',relative)));
 }
 assert.ok(forge.packagerConfig.extraResource.includes('.vite/build/xanthil-resources'));assert.ok(forge.packagerConfig.extraResource.includes('build/xanthil-toolchain-deployment.json'));assert.equal(forge.packagerConfig.asar,true);
});
test('BF-R11 Q4: resource assembly refuses missing duplicate and changed consumers',()=>{
 const make=()=>{const p=desktopRuntimeResources();p.buildStart();return p;},code='const url=import.meta.url;',executor=resolve('adapters/analytics-duckdb/member-preparation-executor.ts'),server=resolve('apps/browser/local-server.ts');
 assert.throws(()=>make().generateBundle.call({emitFile(){}},{},{}),/missing runtime resource consumer/);
 const duplicate=make();duplicate.transform(code,executor);assert.throws(()=>duplicate.transform(code,executor),/duplicate resource module/);
 for(const text of ['no URL','import.meta.url','import.meta.url;import.meta.url;import.meta.url'])assert.throws(()=>make().transform(text,server),/resource module URL shape changed/);
 const occupied=make();occupied.transform(code,executor);occupied.transform(readFileSync(server,'utf8'),server);occupied.transform(readFileSync('adapters/analytics-duckdb/open-document-source.ts','utf8'),resolve('adapters/analytics-duckdb/open-document-source.ts'));assert.throws(()=>occupied.generateBundle.call({emitFile(){}},{},{'xanthil-resources/adapters/analytics-duckdb/member-preparation-supervisor.py':{}}),/duplicate runtime resource/);
});
