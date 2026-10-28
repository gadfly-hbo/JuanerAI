
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPiProfessionalAgent } from '../../../adapters/agent-pi/professional-agent.ts';
import type { AnalysisTool } from '../../../packages/ports/open-analysis-runtime.ts';
function response(n:number,calls:{name:string;args:unknown}[]=[],content='actual results observed'){
 const delta=calls.length?{role:'assistant',tool_calls:calls.map((c,index)=>({index,id:'call-'+n+'-'+index,type:'function',function:{name:c.name,arguments:JSON.stringify(c.args)}}))}:{role:'assistant',content};
 return new Response('data: '+JSON.stringify({id:'owned-'+n,object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:calls.length?'tool_calls':'stop'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
async function fixture(tools:()=>readonly AnalysisTool[],provider:(dto:any,n:number)=>Promise<Response>|Response){
 let n=0,allowed=true;const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'tools-')),controller=new AbortController(),agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>allowed,credentials:{withCredential:async(_p,run)=>run({key:'offline-tool-key-not-in-input',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash',endpoint:'https://token-plan-cn.xiaomimimo.com/v1'})},fetch:async(_u,init)=>provider(JSON.parse(String(init!.body)),++n)}),identity={task_id:randomUUID(),revision:'1',operation_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const turn={identity,command_id:identity.operation_id,purpose:'analysis' as const,prompt:'owned synthetic interface contract',system:'only current authorized tools',capabilities:async()=>tools(),authorize:()=>allowed,signal:controller.signal};
 return {root,agent,identity,turn,count:()=>n,revoke:()=>{allowed=false;},controller};
}
const nested={type:'object',properties:{operation:{type:'string',enum:['sum']},rows:{type:'array',items:{type:'object',properties:{value:{type:'number'}},required:['value'],additionalProperties:false}}},required:['operation','rows'],additionalProperties:false};
const rows={operation:'sum',rows:[{value:1.25}]};

test('V12-RT current: original nested schema reaches DTO/native prepare/executor and actual local result returns to Pi',async()=>{
 let effects=0;const tool:AnalysisTool={name:'calculate',effect:'write',description:'actual current calculation',parameters:nested,execute:async args=>{effects++;assert.deepEqual(args,rows);return {total:Number((args.rows as {value:number}[])[0]!.value)*2};}};
 const f=await fixture(()=>[tool],(dto,n)=>{assert.deepEqual(dto.tools.find((t:any)=>t.function.name==='calculate').function.parameters,nested);if(n===1)return response(n,[{name:'calculate',args:rows}]);assert.ok(dto.messages.some((m:any)=>m.role==='tool'&&m.content.includes('2.5')));return response(n);});
 const r=await f.agent.advance(f.turn);await f.agent.assertCompleted(f.identity,r.completion);assert.equal(effects,1);assert.equal(f.count(),2);assert.equal((await f.agent.diagnostics(f.identity)).meter!.tool_calls,1);
});
for(const mutation of [{operation:'sum',rows:[{value:'1'}]},{operation:'invented',rows:[]},{operation:'sum',rows:[{value:1,grant:true}]},{operation:'sum',rows:[],authorized:true}])test('V12-RT current native structural rejection, explicit valid correction '+JSON.stringify(mutation),async()=>{
 let effects=0;const f=await fixture(()=>[{name:'calculate',effect:'write',description:'current nested contract',parameters:nested,execute:async args=>{effects++;assert.deepEqual(args,rows);return args;}}],(dto,n)=>{if(n===1)return response(n,[{name:'calculate',args:mutation}]);if(n===2){assert.equal(effects,0);assert.match(JSON.stringify(dto.messages),/STRUCTURE_MISMATCH|invalid_arguments|Invalid arguments/i);return response(n,[{name:'calculate',args:rows}]);}return response(n);});
 await f.agent.advance(f.turn);assert.equal(effects,1);assert.equal(f.count(),3);
});
test('V13 current repeated invalid native arguments hard stop before effect; no host rewrite or fault extra',async()=>{
 let effects=0;const f=await fixture(()=>[{name:'calculate',effect:'write',description:'required number',parameters:{type:'object',properties:{n:{type:'number'}},required:['n'],additionalProperties:false},execute:async()=>{effects++;return {};}}],(_dto,n)=>response(n,[{name:'calculate',args:{}}]));await assert.rejects(()=>f.agent.advance(f.turn));assert.equal(effects,0);assert.equal(f.count(),6);assert.equal((await f.agent.diagnostics(f.identity)).meter!.model_attempts,6);
});
for(const failure of ['arbitrary','after-effect','nonfinite'] as const)test('V12 current '+failure+' cannot forge not-started or successful saved output',async()=>{
 let effects=0;const f=await fixture(()=>[{name:'effect',effect:'write',description:'owned effect',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;if(failure==='nonfinite')return {total:Infinity};throw Object.assign(Error('PRIVATE_FAILURE_TEXT'),{code:'CANDIDATE_REFERENCE_INVALID',facts:{effect_state:'not_started',saved:false}});}}],(_dto,n)=>response(n,[{name:'effect',args:{}}]));await assert.rejects(()=>f.agent.advance(f.turn));await f.agent.waitForIdle();assert.equal(effects,1);assert.equal(f.count(),1);const d=await f.agent.diagnostics(f.identity);assert.equal(d.meter!.tool_calls,1);assert.equal(d.unconfirmed_effects,failure!=='nonfinite');assert.doesNotMatch(JSON.stringify(d),/PRIVATE_FAILURE_TEXT/);assert.ok(d.observations.some(o=>o.kind==='tool'&&o.completion===(failure==='nonfinite'?'completed':'unknown')&&o.delivery==='failed'));
});
for(const boundary of ['revoke','cancel','stale-source'] as const)test('V12 current '+boundary+' before actual tool effect and after effect cannot publish',async()=>{
 let effects=0,f:Awaited<ReturnType<typeof fixture>>;f=await fixture(()=>[{name:'effect',effect:'write',description:'owned guarded effect',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{if(boundary==='stale-source')throw Object.assign(Error('SOURCE_CHANGED'),{code:'SOURCE_CHANGED'});effects++;return {};}}],(_dto,n)=>{if(boundary==='revoke')f.revoke();if(boundary==='cancel')f.controller.abort();return response(n,[{name:'effect',args:{}}]);});await assert.rejects(()=>f.agent.advance(f.turn));await f.agent.waitForIdle();assert.equal(effects,0);assert.equal(f.count(),1);
});
test('V12 current duplicate capability names reject before physical request, not arbitrary selection',async()=>{
 let effects=0;const t:AnalysisTool={name:'same',effect:'write',description:'owned',parameters:{type:'object'},execute:async()=>{effects++;return {};}};const f=await fixture(()=>[t,{...t,description:'other'}],(_dto,n)=>response(n));await assert.rejects(()=>f.agent.advance(f.turn),{code:'INVALID_REQUEST'});assert.equal(f.count(),0);assert.equal(effects,0);
});
test('V12 current same Task changed schema cannot reinterpret pinned configuration or dispatch the old tool',async()=>{
 let effects=0;const schema={type:'object',properties:{amount:{type:'number'}},required:['amount'],additionalProperties:false};let name='calculate';const f=await fixture(()=>[{name,effect:'write',description:'current only',parameters:schema,execute:async a=>{effects++;return {total:Number(a.amount)*2};}}],(dto,n)=>{assert.ok(dto.tools.some((t:any)=>t.function.name===name));if(n===1||n===3)return response(n,[{name,args:{amount:n===1?20:30}}]);assert.match(JSON.stringify(dto.messages),n===2?/40/:/60/);return response(n);});await f.agent.advance(f.turn);name='recalculate';await assert.rejects(()=>f.agent.advance({...f.turn,command_id:randomUUID()}));assert.equal(f.count(),2,'changed schema cannot silently reinterpret the existing SDK configuration');assert.equal(effects,1);
});





