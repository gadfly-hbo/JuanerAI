import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import type {BrowserMembershipReadback} from '../../../packages/ports/browser-membership.ts';
import type {ReportStudioHttpServices} from '../../../apps/browser/report-studio-http.ts';
const projectId='00000001-1111-4111-a111-111111111111';
test('RS-RETURN-01 only the closed source return query serves the public shell, never data or control',async t=>{
 const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback,workspace:{} as NonNullable<Parameters<typeof startBrowserMembershipServer>[0]['workspace']>});t.after(()=>server.close());
 const path=`/?report-studio-project=${projectId}&report-studio-task=00000002-1111-4111-a111-111111111111&report-studio-revision=1`;const response=await fetch(server.origin+path);assert.equal(response.status,200);assert.match(response.headers.get('content-type')!,/text\/html/);assert.equal((await fetch(server.origin+'/v1/projects')).status,401);
 for(const bad of [path+'&control=forbidden',path.replace('revision=1','revision=0'),path.replace('task=00000002','task=%2F00000002'),path.replace('/?','/other?')])assert.equal((await fetch(server.origin+bad)).status,404);
});
test('RS-HOST-HTTP-01 missing bundle is honest and protected actions never dispatch without control',async t=>{
 const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback});t.after(()=>server.close());
 const post=(path:string,body:unknown,headers={})=>fetch(server.origin+path,{method:'POST',headers:{origin:server.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const boot=await post('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control;
 assert.equal((await fetch(server.origin+'/v1/report-studio/status')).status,401);
 let r=await fetch(server.origin+'/v1/report-studio/status',{headers:{cookie}});assert.equal(r.status,200);assert.deepEqual(await r.json(),{state:'unavailable',reason:'not_bundled'});
 assert.equal((await post('/v1/report-studio/independent',{}, {cookie})).status,403);
 assert.notEqual((await post('/v1/report-studio/independent',{}, {cookie,'x-xanthil-control':control})).status,200);
});
test('RS-HOST-HTTP-01 explicit project boundary cannot change while opening',async t=>{
 let active=projectId,calls=0;const workspace={projectId,open:async()=>{calls++;active='another';return {url:'synthetic-must-not-publish'};}};
 const services={runtime:{status:async()=>({state:'unavailable',reason:'missing'}),launch:async()=>{calls++;return 'synthetic';}},project:(id:string)=>{if(id!==active)throw Object.assign(Error('RS_TARGET_CHANGED'),{code:'RS_TARGET_CHANGED'});return workspace;}} as unknown as ReportStudioHttpServices;
 const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback,reportStudio:services});t.after(()=>server.close());
 const post=(path:string,body:unknown,headers={})=>fetch(server.origin+path,{method:'POST',headers:{origin:server.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const boot=await post('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control;
 const path='/v1/report-studio/projects/'+projectId+'/open',body={task_id:'00000002-1111-4111-a111-111111111111',revision:'1',materials:['conclusion']};
 assert.equal((await post(path,body,{cookie})).status,403);assert.equal(calls,0);
 assert.equal((await post(path,body,{cookie,'x-xanthil-control':control,'sec-fetch-site':'cross-site'})).status,403);assert.equal(calls,0);
 const result=await post(path,body,{cookie,'x-xanthil-control':control});assert.notEqual(result.status,200);assert.equal(calls,1);assert(!JSON.stringify(await result.json()).includes('synthetic-must-not-publish'));
});

test('RS-HOST-HTTP-01 supplier underscore export identity reaches delivery and receipt, other paths stay closed',async t=>{
 const association='00000002-1111-4111-a111-111111111111',receipt={saved:'synthetic'},workspace={projectId,deliver:async(id:string,exportId:string)=>{assert.equal(id,association);assert.equal(exportId,'exp_Synthetic_1');return receipt;},receipt:()=>receipt};
 const services={runtime:{},project:()=>workspace} as unknown as ReportStudioHttpServices;
 const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback,reportStudio:services});t.after(()=>server.close());
 const post=(path:string,body:unknown,headers={})=>fetch(server.origin+path,{method:'POST',headers:{origin:server.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const boot=await post('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control,base='/v1/report-studio/projects/'+projectId+'/associations/'+association+'/exports/exp_Synthetic_1';
 let response=await post(base+'/deliver',{}, {cookie,'x-xanthil-control':control});assert.equal(response.status,200);assert.deepEqual(await response.json(),receipt);
 response=await fetch(server.origin+base+'/receipt',{headers:{cookie}});assert.equal(response.status,200);assert.deepEqual(await response.json(),receipt);
 assert.equal((await fetch(server.origin+'/v1/other_endpoint',{headers:{cookie}})).status,404);
 assert.equal((await fetch(server.origin+base.replace('exp_Synthetic_1','exp%2Fescape')+'/receipt',{headers:{cookie}})).status,404);
});
