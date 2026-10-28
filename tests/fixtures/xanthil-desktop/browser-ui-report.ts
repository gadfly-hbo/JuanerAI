import {offlineCredentials,offlineResponse} from './offline-professional-provider.ts';
import {nativeReport} from './native-report.ts';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
/** Current saved model report, never a fabricated qualified Outcome. */
export async function reportFixture(grouped=false,setup?:{root:string;project_id:string}){
 const actual=await nativeReport({root:setup?.root,projectId:setup?.project_id,csv:grouped?'数量,地区\n3,北区\n4,南区\n':'数量\n7\n'});
 const root=actual.root,store=createLocalOpenAnalysisStore({projectRoot:root}),id=actual.identity.task_id,content=()=>{const value=store.reportContent!(id);assert.ok(value);return value;},write=(action:string,fields:Record<string,unknown>={})=>store.reportContentCommand!(id,{version:'1.0',command_id:randomUUID(),expected_content_sha256:content().sha256,action,...fields});
 return {...actual,store,id,content,write};
}
export async function browserUIFixture(){
 const f=await reportFixture(true);let extra=0,additional=0,baseline=f.provider.requests();
 const open=createPersonalOpenAnalysisWorkspace({...f.configuration,fetch:async(_url,init)=>{extra++;const dto=JSON.parse(String(init!.body)),n=f.provider.requests()+additional+extra;if(JSON.stringify(dto.messages).includes('OWNED_UNCONFIRMED_FIXTURE')){writeFileSync(join(f.root,'OWNED-UNKNOWN-RESPONSE-BOUNDARY.json'),JSON.stringify({task:'owned isolated partial report Task',entered_synthetic_transport:true,response_lost:true,real_provider_requests:0}));throw Error('owned synthetic response lost after dispatch boundary');}return offlineResponse(n,[],'合成测试建议：更简洁地描述结果，原因仍需调查。');}});
 const otherIdentity={...f.identity,task_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};f.store.create({identity:otherIdentity,question:'另一个合成任务',source:f.source});f.store.finish(f.store.begin(otherIdentity.task_id),'failed');
 async function settleTask(id:string){const facts=await open.diagnostics(id);assert.equal(facts.unconfirmed_effects,false);assert.ok((facts.meter?.model_attempts??0)>0,'the current fixture already obtained real settled public SDK observations');}
 const server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,open}),register=Reflect.get(globalThis,Symbol.for('Mini.D006.ownedLoopback')) as ((origin:string)=>()=>void)|undefined,revoke=register?.(server.origin);
 const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
 const call=(path:string,body?:unknown,headers:Record<string,string>={})=>fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,...(body===undefined?{}:{origin:server.origin,'content-type':'application/json','x-xanthil-control':control}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
 async function markUnconfirmed(id:string){const task=open.read(id);let raised:unknown;try{await open.professionalAgent.advance({identity:task.identity,command_id:randomUUID(),purpose:'report_edit',prompt:'OWNED_UNCONFIRMED_FIXTURE',system:'仅验证本隔离Task实际请求结算未知时的报告编辑安全门；不计算或执行现实行动。',capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});}catch(error){raised=error;}await open.professionalAgent.waitForIdle();const facts=await open.diagnostics(id);writeFileSync(join(f.root,'OWNED-UNKNOWN-PROBE-'+id+'.json'),JSON.stringify({task_id:id,code:raised&&Reflect.get(raised as object,'code'),message:String(raised),facts,real_provider_requests:0},null,2));assert.ok(raised);assert.equal(facts.unconfirmed_effects,true,JSON.stringify({code:raised&&Reflect.get(raised as object,'code'),message:String(raised),last_run:facts.last_run,meter:facts.meter}));}
 return {...f,open,server,cookie,control,call,markUnconfirmed,settleTask,get baseline_calls(){return baseline;},calls:()=>f.provider.requests()+additional+extra,recordFixtureCalls(n:number){additional+=n;baseline+=n;},close:async()=>{await open.close();await server.close();revoke?.();}};
}
export async function partialReportTask(f:Awaited<ReturnType<typeof reportFixture>>&{recordFixtureCalls?:(n:number)=>void}){
 const partial=await nativeReport({root:f.root,projectId:f.configuration.project_id,question:'先说明当前数量，后续比较期间尚未明确。',text:'# 部分信息报告\n\n后续期间与条件未明确，相关判断尚未核验。'});f.recordFixtureCalls?.(partial.provider.requests());return {id:partial.identity.task_id,identity:partial.identity,content:()=>f.store.reportContent!(partial.identity.task_id)!};
}
