import {metricAssetFrameworkParameters} from '../../../packages/contracts/metric-asset-tools.ts';
import {assetProposal} from '../../fixtures/metric-assets.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {createRuntime,type ModelRequest} from 'pi-agent-runtime';
import * as adapter from '../../../adapters/agent-pi/open-analysis.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import type {OpenAnalysisRun,AnalysisTool} from '../../../packages/ports/open-analysis-runtime.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

const model={provider:'synthetic',id:'example',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:4000,maxOutputTokens:50};
const limits={modelCalls:10,toolCalls:10,outputTokens:1000,wallTimeMs:10000};
function input(tools:readonly AnalysisTool[],signal=new AbortController().signal):OpenAnalysisRun{
 return {tools,signal,prompt:'synthetic',system:'synthetic',authorize:()=>true,identity:{task_id:'a',revision:'1',run_id:'a',attempt_id:'a',operation_id:'a',grant_id:'a',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)}};
}
function gateway(current:()=>OpenAnalysisRun){
 const factory=Reflect.get(adapter,'createSharedAnalysisTool');assert.equal(typeof factory,'function','V12-RT: stable SDK boundary must dispatch only the current authorized business tools');return factory(current);
}

test('V12-RT: installed SDK consumes actual local result; current catalog changes do not reset pinned task',async()=>{
 let calls=0,localCalls=0;const schema={type:'object',properties:{amount:{type:'number'}},required:['amount'],additionalProperties:false};
 let current=input([{name:'calculate',description:'first bound source',parameters:schema,execute:async args=>{localCalls++;return {total:Number(args.amount)*2};}}]);
 const tool=gateway(()=>current),state=createPersistentRuntimeState({projectRoot:mkdtempSync(join(browserEvidenceRoot,'shared-dispatch-'))});
 const transport=async(request:ModelRequest)=>{
  calls++;if(calls%2===1)return {content:[{kind:'tool' as const,id:'call-'+calls,name:tool.name,arguments:{name:current.tools[0].name,arguments_json:JSON.stringify({amount:calls===1?20:30})}}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:5}};
  assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes(calls===2?'40':'60')),'SDK must observe the local result, not a replayed answer');
  return {content:[{kind:'text' as const,text:calls===2?'40':'60'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:5}};
 };
 const runtime=createRuntime({...state,model,transport,authorize:async()=>true,purposes:[{id:'analysis',mode:'agent',model,transport,tools:[tool]}]});
 const first=await runtime.runAgent({taskId:'same-task',purpose:'analysis',prompt:'first actual local calculation',limits,tools:[tool]});
 assert.equal(first.status,'succeeded');if(first.status==='succeeded')assert.equal(first.value,'40');
 current=input([{name:'recalculate',description:'new current scope; original tool is no longer available',parameters:schema,execute:async args=>{localCalls++;return {total:Number(args.amount)*2};}}]);
 const second=await runtime.runAgent({taskId:'same-task',purpose:'analysis',prompt:'recalculate current scope',limits,tools:[tool]});
 assert.equal(second.status,'succeeded');if(second.status==='succeeded')assert.equal(second.value,'60');
 assert.equal(localCalls,2);assert.equal(second.usage.modelCalls,4);assert.equal(second.usage.toolCalls,2);assert.equal(second.usage.outputTokens,20);
});

test('V12-RT: original nested schema rejects coercion, unknown fields and widened tool names before effects',async()=>{
 let effects=0;
 const tool:AnalysisTool={name:'calculate',description:'current only',parameters:{type:'object',properties:{operation:{enum:['sum']},rows:{type:'array',items:{type:'object',properties:{value:{type:'number'}},required:['value'],additionalProperties:false}}},required:['operation','rows'],additionalProperties:false},execute:async args=>{effects++;return args;}};
 const current=input([tool]),dispatch=gateway(()=>current),signal=new AbortController().signal;
 for(const value of [{operation:'sum',rows:[{value:'1'}]},{operation:'invented',rows:[]},{operation:'sum',rows:[{value:1,grant:true}]},{operation:'sum',rows:[],authorized:true}])await assert.rejects(dispatch.execute({name:'calculate',arguments_json:JSON.stringify(value)},signal),{code:'TOOL_ARGUMENT_INVALID'});
 await assert.rejects(dispatch.execute({name:'not-in-current-catalog',arguments_json:'{}'},signal),{code:'TOOL_POLICY_VIOLATION'});
 await assert.rejects(dispatch.execute({name:'calculate',arguments_json:'{broken'},signal),{code:'TOOL_ARGUMENT_INVALID'});
 assert.equal(effects,0);
 const exact={operation:'sum',rows:[{value:1.25}]};assert.deepEqual(await dispatch.execute({name:'calculate',arguments_json:JSON.stringify(exact)},signal),exact);assert.equal(effects,1);
});

test('V12-RT: revoked, stopped, business waiting and changed run deny dispatch and late publication',async()=>{
 let effects=0,authorized=true,waiting=false;let release!:(v:unknown)=>void;let entered!:()=>void,started=new Promise<void>(resolve=>entered=resolve);
 const controller=new AbortController();let current={...input([{name:'calculate',description:'local',parameters:{type:'object',additionalProperties:false},execute:async()=>{effects++;entered();return new Promise(resolve=>release=resolve);}}],controller.signal),authorize:()=>authorized,shouldYield:()=>waiting};
 const dispatch=gateway(()=>current),args={name:'calculate',arguments_json:'{}'},signal=new AbortController().signal;
 authorized=false;await assert.rejects(dispatch.execute(args,signal),{code:'AUTHORITY_REQUIRED'});authorized=true;
 waiting=true;const deferred=await dispatch.execute(args,signal);assert.equal(Reflect.get(deferred as object,'code'),'ANALYSIS_YIELD');assert.equal(Reflect.get(deferred as object,'status'),'deferred');assert.equal(Reflect.get(deferred as object,'executed'),false);waiting=false;assert.equal(effects,0);
 const pending=dispatch.execute(args,signal);await started;current={...current};release({total:42});await assert.rejects(pending,{code:'TASK_CHANGED'});
 started=new Promise<void>(resolve=>entered=resolve);const late=dispatch.execute(args,signal);await started;controller.abort();release({total:42});await assert.rejects(late,{code:'CANCELLED'});
 await assert.rejects(dispatch.execute(args,signal),{code:'CANCELLED'});assert.equal(effects,2);
});

test('V12-RT: duplicate current names cannot choose an arbitrary executor',async()=>{
 let effects=0;const tool={name:'same',description:'local',parameters:{type:'object'},execute:async()=>{effects++;return {};}};
 const current=input([tool,{...tool,description:'different'}]);await assert.rejects(gateway(()=>current).execute({name:'same',arguments_json:'{}'},new AbortController().signal),{code:'TOOL_POLICY_VIOLATION'});assert.equal(effects,0);
});

test('V12-RT: non-finite computed number cannot be silently normalized to null',async()=>{
 const current=input([{name:'calculate',description:'local',parameters:{type:'object'},execute:async()=>({total:Infinity})}]);
 await assert.rejects(gateway(()=>current).execute({name:'calculate',arguments_json:'{}'},new AbortController().signal),{code:'TOOL_RESULT_INVALID'});
});

for(const repeat of [false,true])test(`V13-ARGUMENT-CORRECTION03: successful original operation resolves structural feedback; later repeat=${repeat} remains bounded`,async()=>{
 let turns=0;const effects:number[]=[];
 const current={...input([{name:'calculate',description:'actual original executor',parameters:{type:'object',properties:{quantity:{type:'number'}},required:['quantity'],additionalProperties:false},execute:async args=>{effects.push(Number(args.quantity));return {quantity:args.quantity};}}]),recoverInvalidArguments:true};
 const tool=adapter.createSharedAnalysisTool(()=>current,()=>turns);
 const state=createPersistentRuntimeState({projectRoot:mkdtempSync(join(browserEvidenceRoot,'structural-correction-'))});
 const transport=async(request:ModelRequest)=>{
  turns++;
  if(turns===2||turns===4){assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('invalid_arguments')));assert.deepEqual(effects,turns===2?[]:[7]);}
  if(turns===3)assert.deepEqual(effects,[7]);
  if(turns===5){assert.deepEqual(effects,[7,11]);return {content:[{kind:'text' as const,text:'both actual results observed'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:5}};}
  const args=turns===2?{quantity:7}:turns===4&&!repeat?{quantity:11}:{};
  return {content:[{kind:'tool' as const,id:'call-'+turns,name:tool.name,arguments:{name:'calculate',arguments_json:JSON.stringify(args)}}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:5}};
 };
 const runtime=createRuntime({...state,model,transport,authorize:async()=>true,purposes:[{id:'analysis',mode:'agent',model,transport,tools:[tool]}]});
 const result=await runtime.runAgent({taskId:'structural-corrections',purpose:'analysis',prompt:'perform two separate exact operations',limits,tools:[tool]});
 assert.equal(result.status,repeat?'failed':'succeeded');assert.deepEqual(effects,repeat?[7]:[7,11]);assert.equal(result.usage.modelCalls,repeat?4:5);assert.equal(result.usage.toolCalls,4);
});

test('V13-ARGUMENT-CORRECTION03: same-response deferred call and invalid original result do not resolve correction',async()=>{
 let turn=1,effects=0;
 const current={...input([{name:'calculate',description:'unpublishable original result',parameters:{type:'object',properties:{quantity:{type:'number'}},required:['quantity'],additionalProperties:false},execute:async()=>{effects++;return {total:Infinity};}}]),recoverInvalidArguments:true};
 const dispatch=adapter.createSharedAnalysisTool(()=>current,()=>turn),signal=new AbortController().signal;
 const call=(args:object)=>dispatch.execute({name:'calculate',arguments_json:JSON.stringify(args)},signal);
 assert.equal(Reflect.get(await call({}) as object,'status'),'invalid_arguments');
 assert.equal(Reflect.get(await call({quantity:7}) as object,'code'),'AWAITING_ARGUMENT_FEEDBACK');assert.equal(effects,0);
 turn++;await assert.rejects(call({quantity:7}),{code:'TOOL_RESULT_INVALID'});assert.equal(effects,1);
 turn++;await assert.rejects(call({}),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(effects,1);
});

test('V13-NATIVE-JSON02: malformed text, non-object JSON, oversized transport and unknown names never reach original consumer',async()=>{
 let effects=0;const current={...input([{name:'calculate_and_verify',description:'exact local consumer',parameters:{type:'object',properties:{quantity:{type:'integer'}},required:['quantity'],additionalProperties:false},execute:async args=>{effects++;return args;}}]),recoverInvalidArguments:true};
 const native=adapter.createNativeBusinessTools(()=>current).find(t=>t.name==='calculate_and_verify')!,signal=new AbortController().signal;
 const first=await native.execute({arguments_json:'{broken'},signal);assert.equal(Reflect.get(first as object,'status'),'invalid_arguments');assert.equal(effects,0);
 await assert.rejects(()=>native.execute({arguments_json:'[]'},signal),{code:'TOOL_ARGUMENT_INVALID'});
 await assert.rejects(()=>native.execute({arguments_json:' '.repeat(262145)},signal),{code:'TOOL_ARGUMENT_INVALID'});
 assert.deepEqual(await native.execute({arguments_json:JSON.stringify({quantity:7})},signal),{quantity:7});assert.equal(effects,1);
 const absent=adapter.createNativeBusinessTools(()=>current).find(t=>t.name==='execute_step')!;await assert.rejects(()=>absent.execute({arguments_json:'{}'},signal),{code:'TOOL_POLICY_VIOLATION'});assert.equal(effects,1);
});


test('V13-FAIR126 / RT04: IO progresses before local effect and revocation at that boundary blocks it',async()=>{
 let effects=0,io=false;const local:AnalysisTool={name:'local',description:'actual local effect',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{assert.equal(io,true,'a batch must not starve native storage and page IO');effects++;return {accepted:true};}};
 let current=input([local]);const dispatch=gateway(()=>current),signal=new AbortController().signal;setImmediate(()=>{io=true});
 assert.deepEqual(await dispatch.execute({name:'local',arguments_json:'{}'},signal),{accepted:true});assert.equal(effects,1);
 let authorized=true;current={...input([local]),authorize:()=>authorized};setImmediate(()=>{authorized=false});
 await assert.rejects(()=>dispatch.execute({name:'local',arguments_json:'{}'},signal),{code:'AUTHORITY_REQUIRED'});assert.equal(effects,1);
 const controller=new AbortController();current=input([local],controller.signal);setImmediate(()=>controller.abort());
 await assert.rejects(()=>dispatch.execute({name:'local',arguments_json:'{}'},signal),{code:'CANCELLED'});assert.equal(effects,1);
 current=input([local]);setImmediate(()=>{current=input([local])});await assert.rejects(()=>dispatch.execute({name:'local',arguments_json:'{}'},signal),{code:'TASK_CHANGED'});assert.equal(effects,1);
});


test('MF-03 native SDK catalog exposes approved asset tools and consumes their actual results',async()=>{
 let effects=0,turns=0,authorized=true;
 const schema={type:'object',properties:{asset_id:{type:'string'},version:{type:'string'}},required:['asset_id','version'],additionalProperties:false};
 const current={...input([
  {name:'read_project_metric_asset',description:'host-approved six definitions only',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>({asset_id:'approved',version:'1.1.0'})},
  {name:'set_metric_asset_framework',description:'bind original current asset',parameters:schema,execute:async args=>{effects++;return {bound:args};}},
 ]),authorize:()=>authorized};
 const tools=adapter.createNativeBusinessTools(()=>current);
 for(const name of current.tools.map(t=>t.name))assert.ok(tools.some(t=>t.name===name),'native SDK must advertise '+name);
 const state=createPersistentRuntimeState({projectRoot:mkdtempSync(join(browserEvidenceRoot,'metric-native-dispatch-'))});
 const transport=async(request:ModelRequest)=>{
  turns++;
  if(turns===1)return {content:[{kind:'tool' as const,id:'asset-read',name:'read_project_metric_asset',arguments:{}}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:5}};
  if(turns===2){assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('1.1.0')));return {content:[{kind:'tool' as const,id:'asset-bind',name:'set_metric_asset_framework',arguments:{asset_id:'approved',version:'1.1.0'}}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:5}};}
  assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('bound')));return {content:[{kind:'text' as const,text:'actual asset binding observed'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:5}};
 };
 const runtime=createRuntime({...state,model,transport,authorize:async()=>true,purposes:[{id:'analysis',mode:'agent',model,transport,tools}]});
 const result=await runtime.runAgent({taskId:'asset-task',purpose:'analysis',prompt:'consume approved asset',limits,tools});
 assert.equal(result.status,'succeeded');assert.equal(effects,1);assert.equal(turns,3);
 const bind=tools.find(t=>t.name==='set_metric_asset_framework')!;
 await assert.rejects(bind.execute({asset_id:'approved',version:'1.1.0',grant:true},current.signal),{code:'TOOL_ARGUMENT_INVALID'});
 authorized=false;await assert.rejects(bind.execute({asset_id:'approved',version:'1.1.0'},current.signal),{code:'AUTHORITY_REQUIRED'});assert.equal(effects,1);
});


test('MF-BIND-02 asset channel parameters reject empty exclusions before effects and permit one explicit omission',async()=>{
 let effects=0;const p=assetProposal(),args={goal:p.goal,unit:p.unit,bindings:p.bindings,parameters:p.parameters};const current={...input([{name:'set_metric_asset_framework',description:'current approved asset',parameters:metricAssetFrameworkParameters,execute:async a=>{effects++;return {bound:a};}}]),recoverInvalidArguments:true};
 const native=adapter.createNativeBusinessTools(()=>current).find(t=>t.name==='set_metric_asset_framework')!,signal=new AbortController().signal;
 const rejected=await native.execute({...args,parameters:{...args.parameters,internal_values:[]}},signal);assert.equal(Reflect.get(rejected as object,'status'),'invalid_arguments');assert.equal(effects,0,'unsupported empty exclusions must not reach the source-bound consumer');
 const accepted=await native.execute(args,signal);assert.deepEqual(Reflect.get(accepted as object,'bound'),args);assert.equal(effects,1);
});
