import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,readFileSync,existsSync} from 'node:fs';
import {request} from 'node:http';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../adapters/deep-research/bundle.mjs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createPersonalResearchRuntime} from '../../../profiles/personal/deep-research.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
test('DR R01/R06: actual host reports unavailable module, retains copy read and denies stale control',async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-http-'))),projectId=randomUUID(),taskId=randomUUID();let host;
 const research=createPersonalResearchRuntime({hostOrigin:()=>host.origin});host=await startBrowserMembershipServer({store:{},deepResearch:{task:(project,task,checkControl)=>research.task({root,projectId:project,taskId:task,checkControl,check(){assert.equal(project,projectId);assert.equal(task,taskId);}})}});t.after(async()=>{await research.close();await host.close();});
 const post=(path,body,headers={})=>fetch(host.origin+path,{method:'POST',headers:{origin:host.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const boot=await post('/v1/bootstrap',{token:host.bootstrap}),cookie=boot.headers.get('set-cookie').split(';')[0],control=(await boot.json()).control,base=`/v1/deep-research/projects/${projectId}/tasks/${taskId}`;
 assert.equal((await post(base+'/open',{}, {cookie,'x-xanthil-control':'stale'})).status,403);
 assert.equal((await post(base+'/open',{}, {cookie,'x-xanthil-control':control})).status,503);
 assert.equal((await fetch(host.origin+base+'/state',{headers:{cookie}})).status,503);
 const copies=await fetch(host.origin+base+'/copies',{headers:{cookie}});assert.equal(copies.status,200);assert.deepEqual(await copies.json(),[]);
});

test('DR R10/C04: revoke during body or export denies new copy writes; current control can retry',{skip:!process.env.DR_BUNDLE_ROOT},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-http-revoke-'))),projectId=randomUUID(),taskId=randomUUID(),programRoot=process.env.DR_BUNDLE_ROOT;let host,bodyArrived;
 const research=createPersonalResearchRuntime({programRoot,manifestSha256:sha256(readFileSync(join(programRoot,'manifest.json'))),hostOrigin:()=>host.origin,fixtureModule:fileURLToPath(new URL('../../fixtures/deep-research/adapters.mjs',import.meta.url)),authorize:async()=>true});
 host=await startBrowserMembershipServer({store:{},deepResearch:{task:(project,task,checkControl)=>{bodyArrived?.();return research.task({root,projectId:project,taskId:task,checkControl,check(){assert.equal(project,projectId);assert.equal(task,taskId);}});}}});
 const originalFetch=globalThis.fetch;t.after(async()=>{globalThis.fetch=originalFetch;await research.close();await host.close();});
 const post=(path,body,headers={})=>originalFetch(host.origin+path,{method:'POST',headers:{origin:host.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const boot=await post('/v1/bootstrap',{token:host.bootstrap}),cookie=boot.headers.get('set-cookie').split(';')[0];let control=(await boot.json()).control,generation=0;
 const base=`/v1/deep-research/projects/${projectId}/tasks/${taskId}`,headers=()=>({cookie,'x-xanthil-control':control});
 const takeover=async()=>{const r=await post('/v1/control',{version:'1.0',confirmed:true,generation,command_id:randomUUID()},{cookie});assert.equal(r.status,200);({control,generation}=await r.json());};
 const launch=await post(base+'/open',{},headers());assert.equal(launch.status,200);const u=new URL((await launch.json()).url);
 const session=await originalFetch(u.origin+'/bridge/session',{method:'POST',headers:{origin:u.origin,'content-type':'application/json'},body:JSON.stringify({token:u.hash.slice(1)})});
 const childCookie=session.headers.get('set-cookie').split(';')[0],view=(await session.json()).view;
 const json=async(path,body)=>{const r=await originalFetch(u.origin+path,{method:body===undefined?'GET':'POST',headers:{origin:u.origin,cookie:childCookie,'x-research-view':view,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});assert.equal(r.status,200);return r.json();};
 const p=await json('/api/projects',{module:'industry',goal:'撤权合成验证',scope:{summary:'s',queries:[]}}),path='/api/projects/'+p.id;
 await json(path+'/runs',{request:{id:'req-revoke',module:'industry',goal:'合成',scope:{summary:'s',queries:[]}}});
 const wait=async predicate=>{for(let i=0;i<100;i++){const r=(await json(path)).runs[0];if(predicate(r))return r;await new Promise(r=>setTimeout(r,25));}throw Error('gate timeout');};
 for(const kind of ['plan','outline']){const r=await wait(r=>r?.gate?.kind===kind&&r.status==='awaiting-confirmation'),gate=await json(path+`/runs/${r.id}/gate`);await json(path+`/runs/${r.id}/gate/confirm`,{payload:gate.payload});}
 const run=await wait(r=>['limited','published'].includes(r?.status));await json(path+'/publish',{runId:run.id});
 const version={projectId:p.id,runId:run.id,version:1},commandId=randomUUID(),copyRoot=join(root,'.juanerai/deep-research',taskId,'copies');
 let release,entered;const held=new Promise(r=>{release=r;}),exportStarted=new Promise(r=>{entered=r;});
 globalThis.fetch=async(url,init)=>{const response=await originalFetch(url,init);if(String(url).endsWith('/versions/1/export')){entered();await held;}return response;};
 const saving=post(base+'/save',{commandId,...version},headers());await exportStarted;await takeover();release();
 assert.equal((await saving).status,403);assert.equal((await (await originalFetch(host.origin+base+'/copies',{headers:{cookie}})).json()).length,0);
 assert.deepEqual(JSON.parse(readFileSync(join(copyRoot,'command-'+commandId+'.json'))),{version});
 globalThis.fetch=originalFetch;
 const retry=await post(base+'/save',{commandId,...version},headers());assert.equal(retry.status,200);const copy=await retry.json();
 assert.equal((await (await originalFetch(host.origin+base+'/receipts/'+commandId,{headers:{cookie}})).json()).id,copy.id);
 assert.equal((await (await post(base+'/save',{commandId:randomUUID(),...version},headers())).json()).id,copy.id);
 // Hold an actual HTTP body until the host has captured the old control grant.
 const slowCommand=randomUUID(),body=JSON.stringify({commandId:slowCommand,...version});let started;const arrived=new Promise(r=>{started=r;});bodyArrived=started;
 let req;const slow=new Promise((resolve,reject)=>{req=request(host.origin+base+'/save',{method:'POST',headers:{origin:host.origin,'content-type':'application/json','content-length':Buffer.byteLength(body),...headers()}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.write(body.slice(0,8));});
 await arrived;bodyArrived=undefined;await takeover();req.end(body.slice(8));assert.equal(await slow,403);assert.equal(existsSync(join(copyRoot,'command-'+slowCommand+'.json')),false);
 assert.equal((await (await originalFetch(host.origin+base+'/copies',{headers:{cookie}})).json()).length,1);
 assert.equal((await (await post(base+'/save',{commandId:slowCommand,...version},headers())).json()).id,copy.id);
});
