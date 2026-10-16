// Isolated Main build/VM/resource fixture. No .app packaging, Electron launch,
// user data, service activation, credentials or Provider.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import * as nodeURL from 'node:url';
import {build} from 'vite';
const require=createRequire(import.meta.url);
const Generator=require('@electron-forge/plugin-vite/dist/ViteConfig.js').default;
test('RS-MAIN-COMPAT-036/M06: actual installed-entry build binds closed resources without source checkout or launching services',async()=>{
 assert.equal(process.env.JUANERAI_REPORT_STUDIO_PACKAGE,'1');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR,'installed-resource-build-')),out=join(root,'out');
 const generator=new Generator({build:[{entry:'apps/browser/installed-main.ts',config:'vite.main.config.mjs',target:'main'}],renderer:[]},process.cwd(),true);
 const [config]=await generator.getBuildConfigs();
 const output=await build({...config,configFile:false,build:{...config.build,outDir:out,emptyOutDir:false}});
 assert.equal(typeof output.close,'undefined','no build watcher');
 const base=join(out,'xanthil-resources'),manifest=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));
 assert.equal(manifest.files.length,24);assert.equal(new Set(manifest.files.map(x=>x.path)).size,24);
 for(const row of manifest.files){const bytes=readFileSync(join(base,row.path));assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);assert.deepEqual(bytes,readFileSync(row.path));}
 const server='apps/browser/local-server.ts',statement=readFileSync(server,'utf8').split('\n').find(line=>line.includes('const workbenchVersion='));
 const version=runInNewContext(statement.replaceAll('import.meta.url','resourceURL')+';workbenchVersion',{resourceURL:nodeURL.pathToFileURL(join(base,server)).href,readFileSync,createHash,process:{pid:1,version:process.version},Date,URL});
 for(const [file,digest]of Object.entries(version.source_sha256))assert.equal(digest,createHash('sha256').update(readFileSync(file)).digest('hex'));
 const seen=[];let quits=0;const app={isPackaged:true,getPath:()=>join(root,'synthetic-appdata'),setPath(){},setAppLogsPath(){},on(){},requestSingleInstanceLock:()=>false,quit(){quits++;}};
 runInNewContext(readFileSync(join(out,'main.cjs'),'utf8'),{exports:{},__filename:join(out,'main.cjs'),__dirname:out,URL,Buffer,AbortController,TextEncoder,TextDecoder,console,process:{...process,resourcesPath:out,env:{},execPath:'/synthetic/Electron'},require:id=>{
  if(id==='electron')return {app};
  if(id==='node:url')return {...nodeURL,pathToFileURL(path){seen.push(path);return nodeURL.pathToFileURL(path);}};
  if(id==='node:child_process')return {spawn(){assert.fail('no child/service');},execFile(){assert.fail('no helper/Provider');},execFileSync(){assert.fail('no helper/Provider');}};
  if(id.startsWith('.')){assert.ok(resolve(out,id).startsWith(out+'/'));return createRequire(join(out,'main.cjs'))(id);}
  return require(id);
 },setTimeout(){assert.fail('no runtime scheduling');},clearTimeout(){}});
 assert.equal(quits,1);assert.ok(seen.includes(join(base,server)));assert.ok(seen.includes(join(base,'apps/browser/service-main.ts')));
});
