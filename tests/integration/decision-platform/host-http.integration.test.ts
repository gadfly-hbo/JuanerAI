import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import type {BrowserMembershipReadback} from '../../../packages/ports/browser-membership.ts';import type {DecisionHttpServices} from '../../../apps/browser/decision-platform-http.ts';
test('DP-HOST-02: session, origin and control precede all plugin operations; no raw proxy',async t=>{
 const projectId=randomUUID(),taskId=randomUUID();let calls=0;const workspace={projectId,catalog:()=>{calls++;return [];},board:async()=>{calls++;return {view:null};},send:async()=>{calls++;return {saved:true};}};
 const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback,decisionPlatform:{project:(id:string)=>{assert.equal(id,projectId);return workspace;}} as unknown as DecisionHttpServices});t.after(()=>server.close());
 const base='/v1/decision-platform/projects/'+projectId+'/tasks/'+taskId;
 const post=(path:string,body:unknown,headers:Record<string,string>={})=>fetch(server.origin+path,{method:'POST',headers:{origin:server.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await fetch(server.origin+base+'/board')).status,401);const boot=await post('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control;
 assert.equal((await fetch(server.origin+base+'/board',{headers:{cookie}})).status,200);assert.equal(calls,1);
 const body={operationId:randomUUID(),selectionId:randomUUID()};assert.equal((await post(base+'/send',body,{cookie})).status,403);assert.equal(calls,1);
 assert.equal((await post(base+'/send',body,{cookie,'x-xanthil-control':control,origin:'https://example.invalid'})).status,403);assert.equal(calls,1);
 assert.equal((await post(base+'/send',body,{cookie,'x-xanthil-control':control})).status,200);assert.equal(calls,2);
 for(const path of ['/api/actions',base+'/delete',base+'/board?scan=true','/v1/decision-platform/proxy'])assert.notEqual((await fetch(server.origin+path,{headers:{cookie}})).status,200);
});
