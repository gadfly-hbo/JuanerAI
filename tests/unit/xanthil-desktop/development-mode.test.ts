import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

test('DEV-01 formal Main admits the Forge renderer development endpoint',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.match(source,/MAIN_WINDOW_VITE_DEV_SERVER_URL/);
 assert.match(source,/window\.loadURL\(/);
});
test('DEV-01 Main and Preload are built once and require explicit restart',async()=>{
 for(const path of ['vite.main.config.mjs','vite.preload.config.mjs']){
  const config=(await import('../../../'+path)).default;
  assert.equal(config.build.watch,null,path);
 }
});
test('DEV-02 development cannot auto-load production credentials or activation',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.equal(source.includes('development ? null : loadPersonalCaseAssistantActivation'),true);
 assert.equal(source.includes('createMacOsCredentialStore(credentialHelper)'),true);
});
test('DEV-03 renderer server is loopback-only with a fixed port and bounded filesystem',async()=>{
 const config=(await import(new URL('../../../vite.renderer.config.mjs',import.meta.url).href)).default;
 assert.equal(config.server?.host,'127.0.0.1');
 assert.equal(config.server?.port,5173);
 assert.equal(config.server?.strictPort,true);
 assert.equal(config.server?.fs?.strict,true);
 assert.equal(config.publicDir,false);
});
import {mkdtemp,mkdir,symlink,writeFile,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {developmentEndpoint,isDevelopmentFrame,prepareDevelopmentRoot,assertDevelopmentPath} from '../../../apps/desktop/development.ts';
test('DEV-03 packaged deployment ignores all compiled development inputs; development rejects wrong endpoints',()=>{
 for(const endpoint of ['https://evil.example','file:///tmp/a','http://127.0.0.1:5174','http://127.0.0.1:5173/evil','http://localhost:5173@evil/','http://[::1]:5173']){
  assert.equal(developmentEndpoint(true,endpoint),null);
  assert.throws(()=>developmentEndpoint(false,endpoint));
 }
 assert.equal(developmentEndpoint(false,'http://localhost:5173'),'http://127.0.0.1:5173/');
 assert.equal(developmentEndpoint(true,'http://localhost:5173'),null);
 for(const url of ['http://127.0.0.1:5174/','http://127.0.0.1:5173/evil','http://localhost:5173/','http://127.0.0.1:5173/?other','about:blank'])assert.equal(isDevelopmentFrame(url,'http://127.0.0.1:5173/'),false);
 assert.equal(isDevelopmentFrame('http://127.0.0.1:5173/','http://127.0.0.1:5173/'),true);
});
test('DEV-02 owned development root rejects existing unrelated data and escaped chooser capabilities',async()=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'desktop-dev-boundary-')));
 const dev=prepareDevelopmentRoot(join(root,'dev'));
 assert.deepEqual(prepareDevelopmentRoot(dev.root),dev);
 const project=join(dev.projects,'synthetic');await mkdir(project);assertDevelopmentPath(dev.projects,project);
 const original=join(root,'original');await mkdir(original);await writeFile(join(original,'sentinel'),'untouched');
 assert.throws(()=>prepareDevelopmentRoot(original));
 assert.throws(()=>assertDevelopmentPath(dev.projects,original));
 const escape=join(dev.projects,'escape');await symlink(original,escape);assert.throws(()=>assertDevelopmentPath(dev.projects,escape));
 assert.throws(()=>assertDevelopmentPath(dev.root,join(escape,'report.html'),true));
 assert.equal(await readFile(join(original,'sentinel'),'utf8'),'untouched');
});
test('DEV-04 daily Desktop command never packages, artifact checks stay explicit',async()=>{
 const {scripts}=JSON.parse(await readFile('package.json','utf8'));
 assert.equal(scripts['desktop:test'].includes('desktop:package'),false);
 assert.equal(typeof scripts['desktop:test:artifact'],'string');
 assert.equal(typeof scripts['desktop:test:native'],'string');
});
test('DEV-03 same-document report anchors retain valid development IPC',()=>{
 assert.equal(isDevelopmentFrame('http://127.0.0.1:5173/#evidence-1','http://127.0.0.1:5173/'),true);
});
test('DEV-02 development keeps the real settings capability with its own credential helper',async()=>{
 const source=await readFile('apps/desktop/main.ts','utf8');
 assert.equal(source.includes('development || caseAssistantConfig'),false,'development must not disable settings');
 assert.equal(source.includes('development-keychain/xanthil-keychain'),true);
 const swift=await readFile('adapters/credentials-macos/keychain.swift','utf8');
 assert.match(swift,/#if XANTHIL_DEVELOPMENT/);
 assert.match(swift,/com\.juanerai\.xanthil\.development\.xiaomi-token-plan-cn/);
});
test('DEV-04 npm test selects canonical portable checks and current daily Desktop additions',async()=>{
 const {scripts}=JSON.parse(await readFile('package.json','utf8'));
 assert.equal(scripts.test,'node tools/desktop/test-daily.mjs --all');
});

import {runInNewContext} from 'node:vm';
import {EventEmitter} from 'node:events';
test('BF-R11 DEV: real launcher preserves explicit browser flag through wrapper and installed Forge option',async()=>{
 const source=(await readFile('tools/desktop/development-start.mjs','utf8')).replace(/^import .*;\s*$/gm,'').replaceAll('import.meta.url',JSON.stringify('file:///synthetic/development-start.mjs')).replaceAll('await import(','await loadModule(');
 for(const flag of [['--xanthil-browser'],[]]){
  const effects:unknown[]=[],signals:unknown[]=[],timers:(()=>void)[]=[],child=Object.assign(new EventEmitter(),{pid:1234});
  const outer=Object.assign(new EventEmitter(),{argv:['node','script',...flag],execPath:'/fixed/node',env:{PATH:'/fixed',HOME:'/synthetic',JUANERAI_TOOLCHAIN_BIN:'/fixed',JUANERAI_DESKTOP_DEV_ROOT:'/owned/dev',SECRET:'not-forwarded'},exitCode:0,kill:(pid:number,signal:string)=>signals.push([pid,signal])});
  await runInNewContext('(async()=>{'+source+'})()',{process:outer,fileURLToPath:()=>'/synthetic/development-start.mjs',spawn:(executable:string,args:string[],options:unknown)=>{effects.push({executable,args,options});return child;},setTimeout:(fn:()=>void)=>timers.push(fn),console:{log(){},error(){}},loadModule:()=>assert.fail('outer must not import build/Forge')});
  const captured=effects[0] as {args:string[];options:{env:Record<string,string>}};assert.equal(captured.options.env.SECRET,undefined);assert.equal(captured.options.env.JUANERAI_DESKTOP_DEV_ROOT,'/owned/dev');
  outer.emit('SIGINT');outer.emit('SIGTERM');assert.deepEqual(signals,[[-1234,'SIGTERM']]);assert.equal(timers.length,1);timers[0]();assert.deepEqual(signals,[[-1234,'SIGTERM'],[-1234,'SIGKILL']]);child.emit('exit',7);assert.equal(outer.exitCode,7);
  let options:Record<string,unknown>|undefined;const imports:string[]=[];
  await runInNewContext('(async()=>{'+source+'})()',{process:{argv:['node','script','--forge',...flag],cwd:()=>'/synthetic'},loadModule:async(id:string)=>{imports.push(id);if(id.includes('prepare-toolchain'))return {};if(id.includes('build-keychain'))return {buildDevelopmentKeychainHelper(){imports.push('build-helper');}};assert.equal(id,'@electron-forge/core');return {api:{async start(value:Record<string,unknown>){options=value;}}};}});
  assert.deepEqual({outer:Array.from(captured.args),inner:options!.args?Array.from(options!.args as string[]):undefined},{outer:['/synthetic/development-start.mjs','--forge',...flag],inner:flag});assert.equal(options!.interactive,false);assert.equal(options!.dir,'/synthetic');assert.deepEqual(imports,['./prepare-toolchain-deployment.mjs','./build-keychain-helper.cjs','build-helper','@electron-forge/core']);
 }
 for(const args of [['--unknown'],['--xanthil-browser','--unknown'],['--xanthil-browser','--xanthil-browser']])for(const internal of [false,true]){
  let effects=0;await assert.rejects(()=>runInNewContext('(async()=>{'+source+'})()',{process:{argv:['node','script',...(internal?['--forge']:[]),...args],env:{}},spawn:()=>{effects++;},loadModule:()=>{effects++;},fileURLToPath:()=>'',console:{log(){}}}));assert.equal(effects,0,'invalid args rejected before effects');
 }
});
