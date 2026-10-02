import {installCollaborationClose} from '../../../apps/desktop/collaboration-window-close.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderSettings } from '../../../packages/application/provider-settings.ts';
import type { LocalCredentialStore } from '../../../packages/ports/provider-settings.ts';
const oldKey='synthetic-old-local-key', newKey='synthetic-new-local-key';
function fixture(initial: string|null=null) {
  let key=initial, reads=0, saves=0, deletes=0, calls=0;
  const store:LocalCredentialStore={async read(){reads++;return key===null?{status:'absent'}:{status:'found',key};},async save(value){saves++;key=value;},async delete(){deletes++;key=null;}};
  const settings=createProviderSettings({store,async probe(value,signal){calls++;assert.ok([oldKey,newKey].includes(value));assert.equal(signal.aborted,false);}});
  return {settings,store,get key(){return key;},set key(value){key=value;},counts:()=>({reads,saves,deletes,calls})};
}
test('PS-03 startup reads local state without a request or exposing saved key',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();assert.equal(f.settings.status().state,'configured');assert.equal(f.counts().calls,0);assert.ok(!JSON.stringify(f.settings.status()).includes(oldKey));assert.throws(()=>f.settings.taskCredential(),/AUTHORITY_REQUIRED/);
});
test('PS-02 successful explicit test is unsaved; exact input and proof required',async()=>{
 const f=fixture();await f.settings.initialize();const r=await f.settings.request({operation:'test',key:newKey});assert.equal(r.ok,true);assert.ok(r.proof);assert.equal(f.key,null);assert.equal(f.counts().calls,1);
 const wrong=await f.settings.request({operation:'save',key:oldKey,proof:r.proof!});assert.equal(wrong.ok,false);assert.equal(f.key,null);
 const r2=await f.settings.request({operation:'test',key:newKey});const saved=await f.settings.request({operation:'save',key:newKey,proof:r2.proof!});assert.equal(saved.ok,true);assert.equal(f.key,newKey);assert.equal(f.settings.status().state,'configured');assert.ok(!JSON.stringify(saved).includes(newKey));
});
test('PS-02 cancel invalidates proof and a duplicate or late test cannot enable save',async()=>{
 let finish!:()=>void,calls=0;const f=fixture();const s=createProviderSettings({store:f.store,probe:async()=>{calls++;await new Promise<void>(r=>finish=r);}});await s.initialize();
 const pending=s.request({operation:'test',key:newKey});await new Promise(r=>setImmediate(r));assert.equal((await s.request({operation:'test',key:newKey})).code,'MODEL_BUSY');await s.request({operation:'cancel'});finish();const result=await pending;assert.equal(result.ok,false);assert.equal(result.code,'CANCELLED');assert.equal(calls,1);assert.equal(f.key,null);assert.equal(s.status().busy,false);
});
for(const code of ['CREDENTIAL_INVALID','NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED'])test(`PS-04 ${code} replacement preserves old credential and category`,async()=>{
 const f=fixture(oldKey);const s=createProviderSettings({store:f.store,probe:async()=>{throw Object.assign(new Error('raw secret must not escape'),{code});}});await s.initialize();const result=await s.request({operation:'test',key:newKey});assert.equal(result.code,code);assert.equal(s.status().state,'configured');assert.equal(f.key,oldKey);assert.ok(!JSON.stringify(result).includes('raw secret'));
});
test('PS-04 uncertain save requires readback; verified commit succeeds, unknown read blocks',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();f.store.save=async v=>{f.key=v;throw Error('unknown outcome');};let r=await f.settings.request({operation:'test',key:newKey});assert.equal((await f.settings.request({operation:'save',key:newKey,proof:r.proof!})).ok,true);
 r=await f.settings.request({operation:'test',key:oldKey});f.store.read=async()=>{throw Error('denied');};const failed=await f.settings.request({operation:'save',key:oldKey,proof:r.proof!});assert.equal(failed.code,'KEYCHAIN_UNAVAILABLE');assert.equal(f.settings.access.snapshot().available,false);
});
test('PS-04 definite failed replacement retains verified old key without half activation',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const generation=f.settings.access.snapshot().generation;f.store.save=async()=>{throw Error('denied');};const r=await f.settings.request({operation:'test',key:newKey});assert.equal((await f.settings.request({operation:'save',key:newKey,proof:r.proof!})).code,'SAVE_FAILED');const lease=await f.settings.access.acquire(generation);assert.equal(f.settings.taskCredential(),oldKey);lease.release();
});
test('PS-05 admission locks synchronously through pending read and task; release clears private key',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();let finish!:()=>void;const read=f.store.read;f.store.read=async()=>{await new Promise<void>(r=>finish=r);return read();};const p=f.settings.access.acquire(f.settings.access.snapshot().generation);
 assert.equal((await f.settings.request({operation:'delete',confirmed:true})).code,'MODEL_BUSY');finish();const lease=await p;assert.equal(f.settings.taskCredential(),oldKey);assert.equal((await f.settings.request({operation:'test',key:newKey})).code,'MODEL_BUSY');lease.release();assert.throws(()=>f.settings.taskCredential(),/AUTHORITY_REQUIRED/);
});
test('PS-05 successful replacement/delete invalidate unstarted authorizations; old data is untouched',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const g=f.settings.access.snapshot().generation;const r=await f.settings.request({operation:'test',key:newKey});await f.settings.request({operation:'save',key:newKey,proof:r.proof!});await assert.rejects(f.settings.access.acquire(g),/CONFIGURATION_CHANGED/);assert.equal((await f.settings.request({operation:'delete',confirmed:true})).ok,true);assert.equal(f.settings.status().state,'unconfigured');assert.equal(f.key,null);assert.equal(f.counts().deletes,1);
});
test('PS-03/05 locked or externally replaced Keychain refuses admission and old authorization',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const g=f.settings.access.snapshot().generation;f.key=newKey;await assert.rejects(f.settings.access.acquire(g),/CONFIGURATION_CHANGED/);f.store.read=async()=>{throw Error('secret OS details');};await assert.rejects(f.settings.access.acquire(f.settings.access.snapshot().generation),/KEYCHAIN_UNAVAILABLE/);assert.equal(f.settings.status().state,'keychain_unavailable');
});
test('PS-02 closed protocol refuses extra fields and blank keys before side effects',async()=>{
 const f=fixture();await f.settings.initialize();for(const req of [{operation:'test',key:''},{operation:'test',key:newKey,endpoint:'evil'},{operation:'delete',confirmed:false},{operation:'save',key:newKey,proof:'unissued'}])assert.equal((await f.settings.request(req as never)).ok,false);assert.equal(f.counts().calls,0);assert.equal(f.counts().saves,0);assert.equal(f.counts().deletes,0);
});
test('PS-04 refresh cannot clear known authentication rejection; explicit saved-key test can',async()=>{
 const f=fixture(oldKey);let deny=true;const s=createProviderSettings({store:f.store,async probe(){if(deny)throw Object.assign(new Error('invalid'),{code:'CREDENTIAL_INVALID'});}});await s.initialize();await s.request({operation:'test',key:null});assert.equal(s.status().state,'credential_invalid');await s.request({operation:'refresh'});assert.equal(s.status().state,'credential_invalid');deny=false;await s.request({operation:'test',key:null});assert.equal(s.status().state,'configured');
});
test('PS-05 saving the same tested key still invalidates every unstarted authorization',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const generation=f.settings.access.snapshot().generation;const proof=await f.settings.request({operation:'test',key:oldKey});await f.settings.request({operation:'save',key:oldKey,proof:proof.proof!});await assert.rejects(f.settings.access.acquire(generation),/CONFIGURATION_CHANGED/);
});

for(const operation of ['cancel','close'] as const)test(`F3 PS-02/03 ${operation} during old-key read revokes proof before any write`,async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const proof=await f.settings.request({operation:'test',key:newKey});let release!:()=>void;const read=f.store.read;f.store.read=async()=>{await new Promise<void>(r=>release=r);return read();};
 const save=f.settings.request({operation:'save',key:newKey,proof:proof.proof!});await new Promise(r=>setImmediate(r));if(operation==='close')f.settings.close();else await f.settings.request({operation:'cancel'});f.store.read=read;release();const result=await save;
 assert.equal(f.counts().saves,0,'revoked proof cannot issue store.save');assert.equal(f.key,oldKey);assert.equal(result.ok,false);assert.equal(f.settings.status().busy,false);
});
for(const temporary of ['NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED'])test(`F4 PS-04 invalid saved identity survives ${temporary} and Keychain recovery`,async()=>{
 const f=fixture(oldKey);let code:string|null='CREDENTIAL_INVALID',denied=false;const read=f.store.read;f.store.read=async()=>{if(denied)throw Error('synthetic denial');return read();};const s=createProviderSettings({store:f.store,async probe(){if(code)throw Object.assign(Error('synthetic'),{code});}});await s.initialize();
 await s.request({operation:'test',key:null});code=temporary;await s.request({operation:'test',key:null});denied=true;await s.request({operation:'refresh'});denied=false;await s.request({operation:'refresh'});assert.equal(s.status().state,'credential_invalid');assert.equal(s.access.snapshot().available,false);await assert.rejects(s.access.acquire(s.status().generation),/CREDENTIAL_INVALID/);
 code=null;await s.request({operation:'test',key:null});assert.equal(s.access.snapshot().available,true);const lease=await s.access.acquire(s.status().generation);lease.release();s.close();
});
test('F3 issued save commits honestly after cancel, without pretending rollback',async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const proof=await f.settings.request({operation:'test',key:newKey});let release!:()=>void;f.store.save=async v=>{await new Promise<void>(r=>release=r);f.key=v;};const saving=f.settings.request({operation:'save',key:newKey,proof:proof.proof!});await new Promise(r=>setImmediate(r));await f.settings.request({operation:'cancel'});release();assert.equal((await saving).ok,true);assert.equal(f.key,newKey);
});

test('F1 every Dock-created Main window revokes a delayed probe and closes model work',async()=>{
 const {readFileSync}=await import('node:fs'),{stripTypeScriptTypes}=await import('node:module'),{runInNewContext}=await import('node:vm'),{EventEmitter}=await import('node:events'),path=await import('node:path'),{fileURLToPath}=await import('node:url');
 const windows:Window[]=[];let settings:ReturnType<typeof createProviderSettings>,closes=0,confirmations=0,release!:()=>void;
 const app=Object.assign(new EventEmitter(),{isPackaged:true,requestSingleInstanceLock:()=>true,whenReady:()=>Promise.resolve(),quit(){}});
 class Window extends EventEmitter{destroyed=false;webContents={mainFrame:{},on(){},setWindowOpenHandler(){},session:{setPermissionCheckHandler(){},setPermissionRequestHandler(){}}};constructor(){super();windows.push(this);}static getAllWindows(){return windows.filter(w=>!w.destroyed);}loadFile(){return Promise.resolve();}focus(){}isDestroyed(){return this.destroyed;}close(){let prevented=false;this.emit('close',{preventDefault(){prevented=true;}});if(!prevented){this.destroyed=true;this.emit('closed');}}}
 const code=stripTypeScriptTypes(readFileSync('apps/desktop/main.ts','utf8'),{mode:'strip'}).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'').replaceAll('import.meta.url',JSON.stringify('file:///synthetic/apps/desktop/main.ts'));
 runInNewContext(code,{createMembershipTaskHandler:(await import('../../../apps/desktop/member-task-main.ts')).createMembershipTaskHandler,installCollaborationClose,...await import('../../../apps/desktop/development.ts'),electron:{app,BrowserWindow:Window,ipcMain:{handle(){}},dialog:{async showMessageBox(){confirmations++;return {response:0};}}},...path,fileURLToPath,URL,process:{execPath:'/synthetic/Xanthil',resourcesPath:'/synthetic/Resources',env:{}},setTimeout,clearTimeout,loadPersonalCaseAssistantActivation:()=>null,createMacOsCredentialStore:()=>({async read(){return {status:'found',key:'synthetic-window'};},async save(){assert.fail('no write');},async delete(){assert.fail();}}),probeLocalXiaomi:()=>new Promise<void>(r=>release=r),createProviderSettings:(v:Parameters<typeof createProviderSettings>[0])=>(settings=createProviderSettings(v)),createPersonalXanthilDesktopProfile:()=>({hasModelWork:()=>false,openProject(){},closeModelWork(){closes++;},getCaseAssistant:()=>({async close(){closes++;}})}),createCaseAssistantHandler:()=>()=>{},constants:{}});
 await new Promise(r=>setImmediate(r));
 for(let i=0;i<3;i++){
  const window=windows[i],pending=settings!.request({operation:'test',key:'synthetic-new'});await new Promise(r=>setImmediate(r));
  window.close();await new Promise(r=>setImmediate(r));assert.equal(confirmations,0,'connection probe has no collaboration close confirmation');assert.equal(window.destroyed,true,'native close awaits model cleanup');release();const result=await pending;
  assert.equal(result.ok,false,`window ${i+1} must invalidate late proof`);assert.equal(result.proof,undefined);assert.equal(closes,i+1);
  app.emit('activate');await new Promise(r=>setImmediate(r));
 }
 settings!.close();
});
for(const temporary of ['NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED'])test(`F4 previously valid key recovers after ${temporary}; old-generation failure cannot poison replacement`,async()=>{
 const f=fixture(oldKey);await f.settings.initialize();const generation=f.settings.status().generation;
 f.settings.reportTaskFailure(temporary,generation);await f.settings.request({operation:'refresh'});let lease=await f.settings.access.acquire(generation);lease.release();
 f.settings.reportTaskFailure('CREDENTIAL_INVALID',generation);const proof=await f.settings.request({operation:'test',key:newKey});assert.equal((await f.settings.request({operation:'save',key:newKey,proof:proof.proof!})).ok,true);
 f.settings.reportTaskFailure('CREDENTIAL_INVALID',generation);assert.equal(f.settings.status().state,'configured');lease=await f.settings.access.acquire(f.settings.status().generation);assert.equal(f.settings.taskCredential(),newKey);lease.release();
});


test('native fixture cleanup waits for captured child exit and records TERM/KILL as failure',async()=>{
 const {spawn}=await import('node:child_process'),{closeOwnedNativeProcess}=await import('../../fixtures/case-assistant/owned-native-cleanup.ts');
 const once=(emitter:{once(event:string,listener:()=>void):unknown},event:string)=>new Promise<void>(resolve=>{emitter.once(event,resolve);});
 const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});process.stdout.write('ready');setInterval(()=>{},1000)"],{env:{PATH:'/usr/bin:/bin'},stdio:['ignore','pipe','pipe']});
 await once(child.stdout!,'data');let record:any;
 try{await assert.rejects(()=>closeOwnedNativeProcess(child,async()=>{},async value=>{record=value;},100),/graceful exit timeout/);assert.deepEqual(record.signals,['SIGTERM','SIGKILL']);assert.equal(record.running,false);assert.equal(child.signalCode,'SIGKILL');assert.equal(record.pid,child.pid);assert.ok(record.error);}
 finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await once(child,'exit');}}
 const normal=spawn(process.execPath,['-e',"process.stdin.resume();process.stdout.write('ready');process.stdin.once('data',()=>process.exit(0))"],{env:{PATH:'/usr/bin:/bin'},stdio:['pipe','pipe','pipe']});await once(normal.stdout!,'data');
 await closeOwnedNativeProcess(normal,async()=>{normal.stdin!.write('close');},async value=>{record=value;});assert.deepEqual(record.signals,[]);assert.equal(record.exit,0);assert.equal(record.error,null);
});

test('F1 actual Profile distinguishes a settings probe from unfinished business work',async()=>{
 const {createPersonalXanthilDesktopProfile}=await import('../../../profiles/personal/xanthil-desktop.ts');let release!:()=>void;const settings=createProviderSettings({store:{async read(){return {status:'absent'};},async save(){assert.fail();},async delete(){assert.fail();}},probe:()=>new Promise<void>(r=>release=r)});await settings.initialize();
 const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:'/synthetic/unused.json'},assistanceConfig:null,clock:()=>new Date(),deadlineScheduler:{schedule(){assert.fail();}},providerSettings:settings});const pending=settings.request({operation:'test',key:'synthetic-test-only'});await new Promise(r=>setImmediate(r));assert.equal(settings.status().busy,true);try{assert.equal(profile.hasModelWork(),false,'a probe must not create a business task close confirmation');}finally{await settings.request({operation:'cancel'});release();await pending;}
});
