import assert from 'node:assert/strict';
import test from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';

test('BF-R08/11: local service open issues bounded read sessions without stealing page control',async()=>{
 const credential=randomBytes(32).toString('hex');let selected=0,settings=0;
 const server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,service:{credential,async stop(){},async projects(){return {projects:[],current:null};},async select(){selected++;return {project_id:randomUUID()};},async settings(){settings++;return {ok:true,value:{configured:false}};}}} as never);
 const call=async(path:string,method='GET',body?:unknown,headers:Record<string,string>={})=>{const r=await fetch(server.origin+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,cookie:r.headers.get('set-cookie'),body:await r.json()};};
 const local={'x-xanthil-service':credential};
 try{
  const opened=await call('/v1/service/open','POST',{},local);assert.equal(opened.status,200,'normal local open must work without Electron');
  assert.match(opened.body.token,/^[a-f0-9]{64}$/);
  for(const bad of [{...local,origin:server.origin},{...local,cookie:'anything=1'},{...local,'sec-fetch-site':'same-origin'},{'x-xanthil-service':'wrong'}])assert.equal((await call('/v1/service/open','POST',{},bad)).status,403);
  const boot=await call('/v1/bootstrap','POST',{token:opened.body.token},{origin:server.origin});assert.equal(boot.status,200);assert.equal(boot.body.control,null);assert.match(boot.cookie!,/HttpOnly; SameSite=Strict/);assert.doesNotMatch(boot.cookie!,/Domain|Max-Age|Expires/i);
  assert.equal((await call('/v1/bootstrap','POST',{token:opened.body.token},{origin:server.origin})).status,401);
  const cookie=boot.cookie!.split(';')[0],auth={cookie,origin:server.origin};
  assert.equal((await call('/v1/projects','GET',undefined,{cookie})).status,200);assert.equal(settings,0);
  const chosen=await call('/v1/projects/select','POST',{version:'1.0',command_id:randomUUID(),name:'Synthetic'},auth);assert.equal(chosen.status,200);assert.equal(typeof chosen.body.control,'string');assert.equal(selected,1);
  const second=await call('/v1/service/open','POST',{},local),boot2=await call('/v1/bootstrap','POST',{token:second.body.token},{origin:server.origin});assert.equal(boot2.body.control,null);
  const auth2={cookie:boot2.cookie!.split(';')[0],origin:server.origin};
  assert.equal((await call('/v1/projects/select','POST',{name:'Other'},auth2)).status,403);assert.equal(selected,1);
  assert.equal((await call('/v1/projects','GET',undefined,{cookie})).status,200,'new session preserves earlier read access');
  assert.equal((await call('/v1/settings','POST',{operation:'refresh'},auth2)).status,403);assert.equal(settings,0);
  assert.equal((await call('/v1/settings','POST',{operation:'read'},{...auth,'x-xanthil-control':chosen.body.control})).status,200);assert.equal(settings,1);
  const reselected=await call('/v1/projects/select','POST',{version:'1.0',command_id:randomUUID(),project_id:chosen.body.project.project_id},{...auth,'x-xanthil-control':chosen.body.control});assert.equal(reselected.status,200);assert.equal(reselected.body.control,chosen.body.control);assert.equal(selected,2);
 }finally{await server.close();}
});

test('BF-R08/11: private service identity excludes duplicate writers and rejects replaced records',async()=>{
 const origins=await import('../../../adapters/storage-local/browser-project-origin.ts'),acquire=Reflect.get(origins,'acquireBrowserServiceIdentity'),read=Reflect.get(origins,'readBrowserServiceIdentity');assert.equal(typeof acquire,'function');assert.equal(typeof read,'function');
 const {mkdtempSync,mkdirSync,readFileSync,renameSync,writeFileSync,lstatSync}=await import('node:fs'),{join}=await import('node:path'),{browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'service-identity-')),directory=join(root,'private');mkdirSync(directory,{mode:0o700});
 const owner=acquire(directory);assert.throws(()=>acquire(directory));owner.publish('http://127.0.0.1:12345');const value=read(directory);assert.equal(value.origin,'http://127.0.0.1:12345');assert.equal(value.credential,owner.credential);assert.equal(lstatSync(join(directory,'service.json')).mode&0o777,0o600);
 const path=join(directory,'service.json'),bytes=readFileSync(path);renameSync(path,path+'.original');writeFileSync(path,bytes,{mode:0o600});assert.throws(()=>owner.check());owner.close();
});

test('BF-R08/11: expired bootstrap cannot authenticate, and private profile permissions are enforced',async()=>{
 const credential=randomBytes(32).toString('hex'),server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,service:{credential,async stop(){},async projects(){return {};},async select(){return {};},async settings(){return {};}}});
 const now=Date.now;try{const r=await fetch(server.origin+'/v1/service/open',{method:'POST',headers:{'content-type':'application/json','x-xanthil-service':credential},body:'{}'});const {token}=await r.json() as {token:string};const time=now();Date.now=()=>time+60001;const expired=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token})});assert.equal(expired.status,401);assert.equal(expired.headers.get('set-cookie'),null);}finally{Date.now=now;await server.close();}
 const {mkdtempSync,mkdirSync,chmodSync,symlinkSync}=await import('node:fs'),{join}=await import('node:path'),{browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts'),{acquireBrowserServiceIdentity,readBrowserServiceIdentity}=await import('../../../adapters/storage-local/browser-project-origin.ts');
 const root=mkdtempSync(join(browserEvidenceRoot,'service-permissions-')),directory=join(root,'private');mkdirSync(directory,{mode:0o700});const lease=acquireBrowserServiceIdentity(directory);lease.publish('http://127.0.0.1:12345');try{chmodSync(join(directory,'service.json'),0o644);assert.throws(()=>readBrowserServiceIdentity(directory),{code:'SERVICE_IDENTITY_INVALID'});assert.throws(()=>lease.check(),{code:'SERVICE_IDENTITY_INVALID'});}finally{lease.close();}
 symlinkSync(directory,join(root,'alias'));assert.throws(()=>acquireBrowserServiceIdentity(join(root,'alias')),{code:'SERVICE_IDENTITY_INVALID'});
});

for(const initiallyOwned of [false,true])test(`BF-R08: takeover fences pending project selection credential (${initiallyOwned?'existing owner':'first unowned selection'})`,async()=>{
 let entered!:()=>void,release!:()=>void;
 const ready=new Promise<void>(resolve=>{entered=resolve;}),gate=new Promise<void>(resolve=>{release=resolve;});
 const credential=randomBytes(32).toString('hex'),project_id=randomUUID(),command_id=randomUUID();let writes=0,selected=0;
 const server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,service:{credential,async stop(){},async projects(){return {projects:[],current:project_id};},async receipt(id){return id===command_id&&selected?{project_id}:null;},async select(){entered();await gate;selected++;return {project_id};},async settings(){writes++;return {ok:true};}}});
 const call=async(path:string,body?:unknown,headers:Record<string,string>={})=>{const r=await fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{...headers,...(body===undefined?{}:{'content-type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const session=async()=>{const open=await call('/v1/service/open',{}, {'x-xanthil-service':credential}),boot=await call('/v1/bootstrap',{token:open.body.token},{origin:server.origin});return {cookie:boot.cookie!,origin:server.origin};};
 try{
  const a=await session(),b=await session();let oldControl:string|undefined,generation=0;
  if(initiallyOwned){const owned=await call('/v1/control',{version:'1.0',command_id:randomUUID(),generation,confirmed:true},a);assert.equal(owned.status,200);oldControl=owned.body.control;generation=owned.body.generation;}
  const pending=call('/v1/projects/select',{version:'1.0',command_id,name:'Synthetic'}, {...a,...(oldControl?{'x-xanthil-control':oldControl}:{})});await ready;
  const takeover=await call('/v1/control',{version:'1.0',command_id:randomUUID(),generation,confirmed:true},b);assert.equal(takeover.status,200);release();
  const result=await pending;assert.equal(result.status,403,'superseded selection must not return the new control');assert.equal(result.body.control,undefined);
  assert.equal((await call('/v1/settings',{operation:'refresh'},{...a,...(oldControl?{'x-xanthil-control':oldControl}:{})})).status,403);assert.equal(writes,0);
  const receipt=await call('/v1/projects/commands/'+command_id,undefined,a);assert.equal(receipt.status,200);assert.deepEqual(receipt.body,{project_id},'already-admitted selection may persist; exact readback conveys no authority');assert.equal(selected,1);
  assert.equal((await call('/v1/settings',{operation:'refresh'},{...b,'x-xanthil-control':takeover.body.control})).status,200);assert.equal(writes,1);
 }finally{release();await server.close();}
});
