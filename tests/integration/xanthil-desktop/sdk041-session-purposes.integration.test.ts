import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createPiSessionOpenAnalysisRuntime} from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import type {OpenAnalysisRun} from '../../../packages/ports/open-analysis-runtime.ts';
import {createPiTransport,type ModelTransport} from 'pi-agent-runtime';
function fixture(){
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-purposes-')),seen:string[]=[];
 const transport:ModelTransport=async r=>{seen.push(r.model.id);return {content:[{kind:'text',text:'synthetic reply'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};};
 const make=()=>createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:transport});
 const input:OpenAnalysisRun={identity:{task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},prompt:'synthetic question',system:'synthetic scope',tools:[],signal:new AbortController().signal,authorize:()=>true};
 return {root,seen,make,input};
}
test('SDK041-FIX01 preparation-only control and host reconstruction read its actual native history without requests',async()=>{
 const f=fixture(),runtime=f.make();await runtime.run({...f.input,purpose:'proposal_prepare'});
 for(const r of [runtime,f.make()]){const view=await r.sessionControl!({identity:f.input.identity,command:{kind:'snapshot'},signal:f.input.signal,authorize:()=>true});assert.ok(view.view?.history?.some(h=>h.preview.includes('synthetic question')));}
 assert.equal(f.seen.length,1);
});
test('SDK041-FIX01 report is a fixed no-tool native session and survives host reconstruction',async()=>{
 const f=fixture(),runtime=f.make();await runtime.run(f.input);await runtime.run({...f.input,purpose:'report_edit',prompt:'synthetic report'});
 const state=createPersistentRuntimeState({projectRoot:f.root}),session=state.readSelectedSession(f.input.identity.task_id,'report_edit');assert.ok(session,'report must own native JSONL');
 const view=await f.make().sessionControl!({identity:f.input.identity,command:{kind:'snapshot'},signal:f.input.signal,authorize:()=>true});assert.ok(view.view?.history?.some(h=>h.preview.includes('synthetic report')));
 assert.deepEqual(f.seen,['MiniMax-M3','mimo-v2.6-flash']);
 await runtime.run({...f.input,purpose:'report_edit',prompt:'synthetic report revision'});assert.equal(state.readSelectedSession(f.input.identity.task_id,'report_edit'),session);assert.equal(f.seen.length,3);
});
test('SDK041-FIX01 active preparation controls use business authority rather than a different operation identity',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-active-purpose-'));let release!:()=>void,entered!:()=>void;
 const hold=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{entered();await hold;return {content:[{kind:'text',text:'saved preparation'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}});
 const f=fixture(),actual={...f.input.identity,run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
 const run=runtime.run({...f.input,identity:actual,purpose:'proposal_prepare'});await ready;
 try{
  const input={identity:f.input.identity,command:{kind:'snapshot'} as const,signal:f.input.signal,authorize:()=>true};
  const read=await runtime.sessionControl!(input);assert.ok(read.view?.operationId);
  await assert.rejects(runtime.sessionControl!({...input,identity:{...input.identity,grant_id:randomUUID()}}),{code:'TASK_BUSY'});
  await assert.rejects(runtime.sessionControl!({...input,purpose:'analysis'}),{code:'NATIVE_SESSION_NOT_FOUND'});
 }finally{release();await run;}
});

test('SDK041-FIX03 no-tool report never instructs the model to use the business dispatcher or read Skill files',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-report-policy-'));let calls=0;let reportSystem='';
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;
  if(request.model.id==='mimo-v2.6-flash'){
   const system=request.messages.filter(m=>m.role==='system').map(m=>m.text).join('\n');
   reportSystem=system;
  }
  return {content:[{kind:'text',text:'synthetic supplied result'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};
 }});
 const f=fixture();await runtime.run(f.input);await runtime.run({...f.input,purpose:'report_edit',tools:[]});assert.equal(calls,2);assert.equal(reportSystem.includes('Use analysis_tool with the business tool name'),false);assert.ok(reportSystem.includes('This purpose has no tools'));assert.ok(reportSystem.includes('Do not request or simulate file reads'));
});

test('SDK041-FIX04 retained Case explicitly asks for raw closed JSON without Markdown wrapping',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-case-json-'));let system='';
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{system=request.messages.filter(m=>m.role==='system').map(m=>m.text).join('\n');return {content:[{kind:'text',text:'{"kind":"question","text":"Synthetic question"}'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}});
 const f=fixture();await runtime.run({...f.input,purpose:'retained_case',tools:[]});assert.ok(system.includes('Return exactly one raw JSON object'));assert.ok(system.includes('No Markdown, code fences, prefix, or suffix'));
});

test('SDK041-FIX05 child Cases never replace root report control after host reconstruction',async()=>{
 const f=fixture(),runtime=f.make();await runtime.run(f.input);await runtime.run({...f.input,purpose:'report_edit',prompt:'root report input'});
 for(let i=0;i<2;i++)await runtime.run({...f.input,purpose:'retained_case',conversation_id:randomUUID(),prompt:'unselected child '+i});
 for(const r of [runtime,f.make()]){const view=await r.sessionControl!({identity:f.input.identity,command:{kind:'snapshot'},signal:f.input.signal,authorize:()=>true});assert.ok(view.view?.history?.some(h=>h.preview.includes('root report input')));assert.equal(view.view?.history?.some(h=>h.preview.includes('unselected child')),false);}
 assert.equal(f.seen.length,4);
});

test('SDK041-FIX05 active child Case cannot expose child history through parent controls',async()=>{
 const f=fixture();let release!:()=>void,entered!:()=>void;const hold=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:f.root,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{entered();await hold;return {content:[{kind:'text',text:'private child reply'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}});
 const run=runtime.run({...f.input,purpose:'retained_case',conversation_id:randomUUID(),prompt:'child'});await ready;
 try{await assert.rejects(runtime.sessionControl!({identity:f.input.identity,command:{kind:'snapshot'},signal:f.input.signal,authorize:()=>true}),{code:'TASK_BUSY'});}finally{release();await run;}
});


test('V13-MT01 opt-in MiMo tool-analysis thinking profile reaches SDK while report and defaults remain unchanged',async()=>{
 const f=fixture(),models:Parameters<ModelTransport>[0]['model'][]=[],wire:Record<string,unknown>[]=[];
 const config={projectRoot:f.root,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),credentials:createApprovedProviderCredentials({environment:{}}),analysisModel:'mimo-v2.6-flash' as const,mimoThinking:'off' as const,modelTransport:async(request:Parameters<ModelTransport>[0])=>{models.push(request.model);return createPiTransport({model:request.model,apiKey:'synthetic',fetch:async(_url,init)=>{wire.push(JSON.parse(String(init?.body)));const chunks=[{choices:[{index:0,delta:{role:'assistant',content:'synthetic supplied reply'},finish_reason:null}]},{choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}];return new Response(chunks.map(v=>'data: '+JSON.stringify(v)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}})(request);}};
 const runtime=createPiSessionOpenAnalysisRuntime(config);await runtime.run(f.input);await runtime.run({...f.input,purpose:'report_edit'});
 assert.equal(models[0]?.id,'mimo-v2.6-flash');assert.equal(models[0]?.reasoning,true);assert.equal(Reflect.get(models[0]!,'thinkingProtocol'),'mimo-chat');
 assert.equal(models[1]?.id,'mimo-v2.6-flash');assert.equal(Reflect.get(models[1]!,'thinkingProtocol'),undefined);
 assert.deepEqual(wire[0]?.thinking,{type:'disabled'});assert.equal(wire[0]?.reasoning_effort,undefined);assert.equal(wire[1]?.thinking,undefined);
 const defaults=fixture();await defaults.make().run(defaults.input);assert.deepEqual(defaults.seen,['MiniMax-M3']);
});


test('V13-MT02 invalid or misplaced MiMo thinking option is rejected before runtime creation',()=>{
 for(const option of [{analysisModel:'mimo-v2.6-flash',mimoThinking:'enabled'},{mimoThinking:'off'}]){
  const f=fixture();const config={projectRoot:f.root,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),credentials:createApprovedProviderCredentials({environment:{}}),...option};
  assert.throws(()=>Reflect.apply(createPiSessionOpenAnalysisRuntime,undefined,[config]),{code:'INVALID_REQUEST'});
 }
});


test('V13-MT02 old MiMo Task refuses mapped configuration without clearing prior usage',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0;
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),analysisModel:'mimo-v2.6-flash' as const,modelTransport:async()=>{calls++;return {content:[{kind:'text' as const,text:'synthetic reply'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}};
 await createPiSessionOpenAnalysisRuntime(config).run(f.input);const old=ledger.read(f.input.identity.task_id);
 await assert.rejects(createPiSessionOpenAnalysisRuntime({...config,mimoThinking:'off'}).run(f.input),{code:'CONFIGURATION_CHANGED'});
 assert.equal(calls,1);assert.deepEqual(ledger.read(f.input.identity.task_id),old);
});

for(const purpose of ['analysis','proposal_prepare'] as const)test(`V13-NATIVE-OBJECT01 ${purpose}: native schema and objects reach original consumer, results survive restart and no-tool report`,async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,effects=0;const exact={references:[{row:2,labels:['人民币万元','中文\n"value"'],optional:null}]};
 const parameters={type:'object',properties:{references:{type:'array',items:{type:'object',properties:{row:{type:'integer'},labels:{type:'array',items:{type:'string'}},optional:{anyOf:[{type:'string'},{type:'null'}]}},required:['row','labels','optional'],additionalProperties:false}}},required:['references'],additionalProperties:false};
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async(request:Parameters<ModelTransport>[0])=>{
  calls++;if(request.model.id==='mimo-v2.6-flash'){assert.equal(request.messages.flatMap(m=>m.tools??[]).length,0);return {content:[{kind:'text' as const,text:'verified supplied report'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}
  const tools=request.messages.flatMap(m=>m.tools??[]);assert.equal(tools.some(t=>t.name==='analysis_tool'),false);assert.deepEqual(tools.find(t=>t.name==='interpret_meaning')?.parameters,parameters,'Provider sees the original nested contract, not JSON text');
  if(calls===1)return {content:[{kind:'tool' as const,id:'native-object',name:'interpret_meaning',arguments:exact}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:1}};
  assert.ok(request.messages.some(m=>m.role==='tool'&&JSON.parse(m.text).value===7));return {content:[{kind:'text' as const,text:'actual 7 consumed'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};
 }};
 const input={...f.input,purpose,nativeBusinessTools:true,tools:[{name:'interpret_meaning',description:'Original nested consumer',parameters,execute:async(args:Readonly<Record<string,unknown>>)=>{assert.deepEqual(args,exact);effects++;return {value:7};}}]};
 await createPiSessionOpenAnalysisRuntime(config).run(input);assert.equal(effects,1);assert.equal(calls,2);
 const reconstructed=createPiSessionOpenAnalysisRuntime({...config,nativeObjectArguments:false});const view=await reconstructed.sessionControl!({identity:f.input.identity,purpose,signal:f.input.signal,authorize:()=>true,command:{kind:'snapshot'}});assert.ok(view.view?.history?.some(m=>m.preview.includes('actual 7 consumed')));assert.equal(calls,2);
 await reconstructed.run({...input,purpose:'report_edit',tools:[]});assert.equal(calls,3);assert.equal(effects,1);assert.equal(ledger.read(f.input.identity.task_id).length,3);assert.equal(ledger.pending().length,0);
});
test('V13-NATIVE-OBJECT02 existing legacy Task keeps registered JSON purpose set after trusted opt-in',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0;
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(request:Parameters<ModelTransport>[0])=>{calls++;assert.ok(request.messages.flatMap(m=>m.tools??[]).some(t=>t.name==='analysis_tool'));return {content:[{kind:'text' as const,text:'legacy preserved'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}};
 await createPiSessionOpenAnalysisRuntime(config).run({...f.input,purpose:'proposal_prepare'});const before=ledger.read(f.input.identity.task_id);
 await createPiSessionOpenAnalysisRuntime({...config,nativeObjectArguments:true}).run({...f.input,purpose:'proposal_prepare'});assert.equal(calls,2);assert.deepEqual(ledger.read(f.input.identity.task_id)[0],before[0]);
});

for(const mode of ['correct','invalid-again','revoked','unavailable'] as const)test(`V13-NATIVE-OBJECT03 ${mode}: original schema and authority still fence direct objects`,async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root});let calls=0,effects=0,authorized=true;
 const parameters={type:'object',properties:{rows:{type:'array',items:{type:'integer'}}},required:['rows'],additionalProperties:false};
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),nativeObjectArguments:true,modelTransport:async(request:Parameters<ModelTransport>[0])=>{
  calls++;assert.ok(request.messages.flatMap(m=>m.tools??[]).every(t=>t.name==='interpret_meaning'));
  if(calls===3){assert.ok(request.messages.some(m=>m.role==='tool'&&JSON.parse(m.text).value===7));return {content:[{kind:'text' as const,text:'actual 7'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}
  if(calls===2){const feedback=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1)!.text);assert.equal(feedback.status,'invalid_arguments');assert.equal(feedback.executed,false);assert.equal(effects,0);if(mode==='revoked')authorized=false;}
  return {content:[{kind:'tool' as const,id:'direct-'+calls,name:mode==='unavailable'?'calculate_and_verify':'interpret_meaning',arguments:{rows:calls===1||mode==='invalid-again'?['7']:[7]}}],stop:'tools' as const,usage:{inputTokens:1,outputTokens:1}};
 }};
 const input={...f.input,recoverInvalidArguments:true,authorize:()=>authorized,tools:[{name:'interpret_meaning',description:'original schema',parameters,execute:async(args:Readonly<Record<string,unknown>>)=>{assert.deepEqual(args,{rows:[7]});effects++;return {value:7};}}]};
 if(mode==='correct'){await createPiSessionOpenAnalysisRuntime(config).run(input);assert.equal(effects,1);assert.equal(calls,3);}else{await assert.rejects(createPiSessionOpenAnalysisRuntime(config).run(input));assert.equal(effects,0);assert.equal(calls,mode==='unavailable'?1:2);}
 assert.equal(ledger.pending().length,0);assert.equal(ledger.read(f.input.identity.task_id).length,calls);
});


test('V13-REPORT132 explicit report thinking-off reaches installed SDK wire without changing analysis or tools',async()=>{
 const f=fixture(),models:Parameters<ModelTransport>[0]['model'][]=[],wire:Record<string,unknown>[]=[];
 const runtime=Reflect.apply(createPiSessionOpenAnalysisRuntime,undefined,[{projectRoot:f.root,ledger:createLocalAnalysisRequestLedger({projectRoot:f.root}),credentials:createApprovedProviderCredentials({environment:{}}),reportThinking:'off',modelTransport:async(request:Parameters<ModelTransport>[0])=>{
  models.push(request.model);if(request.model.id==='MiniMax-M3')return {content:[{kind:'text',text:'actual analysis'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};
  assert.equal(request.messages.flatMap(m=>m.tools??[]).length,0);assert.equal(request.maxOutputTokens,4096);
  return createPiTransport({model:request.model,apiKey:'synthetic',fetch:async(_url,init)=>{wire.push(JSON.parse(String(init?.body)));return new Response('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content:'complete report'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}})(request);
 }}]);
 await runtime.run(f.input);await runtime.run({...f.input,purpose:'report_edit'});
 assert.equal(models[0]?.id,'MiniMax-M3');assert.equal(Reflect.get(models[0]!,'thinkingProtocol'),undefined);
 assert.deepEqual(wire[0]?.thinking,{type:'disabled'});assert.equal(wire[0]?.reasoning_effort,undefined);
});


test('V13-REPORT132 sameTask explicit migration uses actual SDK fingerprints and retains native JSONL/accounting',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),state=createPersistentRuntimeState({projectRoot:f.root});
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>({content:[{kind:'text' as const,text:'synthetic report'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}})};
 const original=createPiSessionOpenAnalysisRuntime(config);await original.run(f.input);await original.run({...f.input,purpose:'report_edit'});
 const before=state.readAccounting(f.input.identity.task_id)!,oldRows=ledger.read(f.input.identity.task_id),oldSession=state.readSelectedSession(f.input.identity.task_id,'report_edit');
 const crypto=await import('node:crypto'),hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const adjusted=Reflect.apply(createPiSessionOpenAnalysisRuntime,undefined,[{...config,reportThinking:'off'}]);
 await assert.rejects(adjusted.run({...f.input,purpose:'report_edit'}),{code:'CONFIGURATION_CHANGED'});assert.deepEqual(state.readAccounting(f.input.identity.task_id),before);
 const migrate=Reflect.get(adjusted,'migrateReportThinking');assert.equal(typeof migrate,'function','only explicit trusted migration may change report configuration');
 const receipt=await migrate({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,approval:'c'.repeat(64),expectedAccounting:hash(before),expectedLedger:hash(oldRows)});
 assert.equal(receipt.from,before.configuration);assert.notEqual(receipt.to,receipt.from);assert.deepEqual(state.readAccounting(f.input.identity.task_id)!.usage,before.usage);assert.deepEqual(ledger.read(f.input.identity.task_id),oldRows);
 assert.equal(state.readSelectedSession(f.input.identity.task_id,'report_edit'),oldSession);
 await adjusted.run({...f.input,purpose:'report_edit'});assert.equal(ledger.read(f.input.identity.task_id).length,3);assert.deepEqual(ledger.read(f.input.identity.task_id).slice(0,2),oldRows);assert.equal(state.readSelectedSession(f.input.identity.task_id,'report_edit'),oldSession);
 await assert.rejects(original.run({...f.input,purpose:'report_edit'}),{code:'CONFIGURATION_CHANGED'});
});


for(const mode of ['revoked','wrong-grant','stale-accounting','stale-ledger','physical-pending','native-drift'] as const)test(`V13-REPORT132 ${mode}: explicit migration denies before changing state or sending a model request`,async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),state=createPersistentRuntimeState({projectRoot:f.root});let calls=0;
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return {content:[{kind:'text' as const,text:'old reply'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}};
 await createPiSessionOpenAnalysisRuntime(config).run(f.input);const before=state.readAccounting(f.input.identity.task_id)!,oldRows=ledger.read(f.input.identity.task_id);
 const crypto=await import('node:crypto'),hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const actualLedger=mode==='physical-pending'?{...ledger,pending:()=>[oldRows[0]!]}:ledger;
 const adjusted=createPiSessionOpenAnalysisRuntime({...config,ledger:actualLedger,reportThinking:'off'});let approvals=0;const nativeDirectory=join(f.root,'.xanthil','desktop','pi-sessions'),nested=readdirSync(nativeDirectory,{recursive:true}).filter((n):n is string=>typeof n==='string'&&n.endsWith('.jsonl'));assert.ok(nested.length);
 await assert.rejects(adjusted.migrateReportThinking({identity:mode==='wrong-grant'?{...f.input.identity,grant_id:randomUUID()}:f.input.identity,signal:f.input.signal,authorize:()=>{approvals++;if(mode==='native-drift'&&approvals===2){mkdirSync(join(nativeDirectory,'additional-lane'));writeFileSync(join(nativeDirectory,'additional-lane','retained.jsonl'),readFileSync(join(nativeDirectory,nested[0]!)));}return mode!=='revoked';},approval:'c'.repeat(64),expectedAccounting:mode==='stale-accounting'?'f'.repeat(64):hash(before),expectedLedger:mode==='stale-ledger'?'e'.repeat(64):hash(oldRows)}),mode==='native-drift'?{code:'TASK_UNCONFIRMED'}:undefined);
 assert.equal(calls,1);assert.deepEqual(state.readAccounting(f.input.identity.task_id),before);assert.deepEqual(ledger.read(f.input.identity.task_id),oldRows);
});

test('V13-REPORT132 actual native queued input prevents configuration migration and remains withdrawable',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),state=createPersistentRuntimeState({projectRoot:f.root});let entered!:()=>void,finish!:()=>void;const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>finish=r);let calls=0;
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;entered();await gate;return {content:[{kind:'text' as const,text:'old reply'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};}};
 const old=createPiSessionOpenAnalysisRuntime(config),running=old.run(f.input);await ready;
 const queued=await old.sessionControl!({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,command:{kind:'nextRun',text:'queued investigation'}});finish();await running;
 const before=state.readAccounting(f.input.identity.task_id)!,oldRows=ledger.read(f.input.identity.task_id),crypto=await import('node:crypto'),hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const adjusted=createPiSessionOpenAnalysisRuntime({...config,reportThinking:'off'});
 await assert.rejects(adjusted.migrateReportThinking({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,approval:'c'.repeat(64),expectedAccounting:hash(before),expectedLedger:hash(oldRows)}),{code:'TASK_UNCONFIRMED'});
 assert.equal(calls,1);assert.deepEqual(state.readAccounting(f.input.identity.task_id),before);assert.deepEqual(ledger.read(f.input.identity.task_id),oldRows);
 const view=await old.sessionControl!({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,command:{kind:'snapshot'}});assert.equal(view.view?.queued[0]?.entryId,queued.entryId);
 assert.equal((await old.sessionControl!({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,command:{kind:'cancelQueued',entryId:queued.entryId!}})).cancelled,true);assert.equal(calls,1);
});

test('V13-REPORT132 a terminated model failure retains unknown usage during explicit migration',async()=>{
 const f=fixture(),ledger=createLocalAnalysisRequestLedger({projectRoot:f.root}),state=createPersistentRuntimeState({projectRoot:f.root});let requests=0;
 const config={projectRoot:f.root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{requests++;if(request.model.id==='MiniMax-M3')return {content:[{kind:'text' as const,text:'analysis'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};throw Object.assign(Error('synthetic closed failure'),{code:'OUTBOUND_FORBIDDEN'});}};
 const old=createPiSessionOpenAnalysisRuntime(config);await old.run(f.input);await assert.rejects(old.run({...f.input,purpose:'report_edit'}));
 for(const row of ledger.read(f.input.identity.task_id).filter(r=>r.status==='unknown'))ledger.settle(row.request_id,{status:'failed',usage:row.usage});
 const before=state.readAccounting(f.input.identity.task_id)!,rows=ledger.read(f.input.identity.task_id),crypto=await import('node:crypto'),hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 assert.ok(before.reservations.length>0);assert.ok(rows.some(r=>r.status==='failed'&&r.usage.output_tokens.kind==='unknown'));
 const adjusted=createPiSessionOpenAnalysisRuntime({...config,reportThinking:'off'});
 await adjusted.migrateReportThinking({identity:f.input.identity,signal:f.input.signal,authorize:()=>true,approval:'c'.repeat(64),expectedAccounting:hash(before),expectedLedger:hash(rows)});
 assert.equal(requests,2);assert.deepEqual(state.readAccounting(f.input.identity.task_id)!.reservations,before.reservations);assert.deepEqual(state.readAccounting(f.input.identity.task_id)!.usage,before.usage);assert.deepEqual(ledger.read(f.input.identity.task_id),rows);
});
