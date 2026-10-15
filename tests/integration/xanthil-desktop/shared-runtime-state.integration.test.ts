import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,renameSync,existsSync,mkdirSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createRuntime} from 'pi-agent-runtime';
import type {ConversationCheckpoint} from 'pi-agent-runtime';
import {DatabaseSync} from 'node:sqlite';

for(const mode of ['finite','uncapped'] as const){
 test(`R2-STORE-01 ${mode}: known-zero callback is durable and releases exactly its real output reservation`,async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'r2-zero-')),state=createPersistentRuntimeState({projectRoot:root});
  const lease=mode==='uncapped'?await state.budgets.claimUncapped('task-a','run-a','fixed',{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}):await state.budgets.claim('task-a','run-a','fixed',{modelCalls:4,toolCalls:4,outputTokens:64,wallTimeMs:10000});
  await lease.reserveModelUpTo!(16);const before=lease.snapshot(),record=Reflect.get(lease,'recordModelUsage');assert.ok(typeof record==='function','new SDK observation mode needs a real persistent callback');
  await record(16,{inputTokens:5,outputTokens:0,final:true});assert.equal(lease.snapshot().inputTokens,5);assert.equal(lease.snapshot().outputTokens,0);if(mode==='uncapped')assert.equal(lease.snapshot().reservedOutputTokens,0);assert.equal(before.outputTokens,16);
  await assert.rejects(record(16,{inputTokens:5,outputTokens:0,final:true}),{reason:'STATE_FAILED'});await lease.release(0);
  const restored=createPersistentRuntimeState({projectRoot:root}).readAccounting('task-a')!;assert.equal(restored.usage.inputTokens,5);assert.equal(restored.usage.outputTokens,0);assert.equal(restored.reservations.length,0);assert.equal(restored.usage.modelCalls,1);
 });
 test(`R2-STORE-01 ${mode}: partial usage retains unknown reservation and confirmed lower bound across reopening`,async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'r2-partial-')),state=createPersistentRuntimeState({projectRoot:root});
  const lease=mode==='uncapped'?await state.budgets.claimUncapped('task-a','run-a','fixed',{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}):await state.budgets.claim('task-a','run-a','fixed',{modelCalls:4,toolCalls:4,outputTokens:64,wallTimeMs:10000});
  await lease.reserveModelUpTo!(16);const record=Reflect.get(lease,'recordModelUsage');assert.ok(typeof record==='function');await record(16,{inputTokens:7,outputTokens:20,final:false});assert.equal(lease.snapshot().inputTokens,7);assert.equal(lease.snapshot().outputTokens,20);if(mode==='uncapped')assert.equal(lease.snapshot().reservedOutputTokens,16);await lease.release(0);
  const restored=createPersistentRuntimeState({projectRoot:root}).readAccounting('task-a')!;assert.equal(restored.usage.inputTokens,7);assert.equal(restored.usage.outputTokens,20);assert.deepEqual(restored.reservations,[{owner:'run-a',tokens:16}]);
 });
 test(`R2-STORE-01 ${mode}: invalid observations and actual SQLite write failure leave prior accounting unchanged`,async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'r2-atomic-')),state=createPersistentRuntimeState({projectRoot:root});
  const lease=mode==='uncapped'?await state.budgets.claimUncapped('task-a','run-a','fixed',{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}):await state.budgets.claim('task-a','run-a','fixed',{modelCalls:4,toolCalls:4,outputTokens:64,wallTimeMs:10000});
  await lease.reserveModelUpTo!(16);const before=state.readAccounting('task-a'),record=Reflect.get(lease,'recordModelUsage');assert.ok(typeof record==='function');
  await assert.rejects(record(16,{inputTokens:-1,outputTokens:0,final:true}));await assert.rejects(Reflect.apply(record,lease,[16,{inputTokens:1,outputTokens:0,final:'true'}]));assert.deepEqual(state.readAccounting('task-a'),before);
  const db=new DatabaseSync(join(root,'.xanthil/desktop/pi-runtime.sqlite'));try{db.exec("CREATE TRIGGER r2_record_failed BEFORE UPDATE ON budgets BEGIN SELECT RAISE(FAIL,'synthetic unavailable'); END");}finally{db.close();}
  await assert.rejects(record(16,{inputTokens:8,outputTokens:0,final:true}));assert.deepEqual(createPersistentRuntimeState({projectRoot:root}).readAccounting('task-a'),before);assert.equal(lease.snapshot().outputTokens,16);
 });
}

test('R2-AUDIT-01: safe model and completed tool observations survive host reopening while raw or mismatched carriers fail closed',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'r2-audit-')),state=createPersistentRuntimeState({projectRoot:root}),signal=new AbortController().signal;
 const base={version:'1.0' as const,taskId:'task-a',runId:'run-a',at:'2026-10-14T00:00:00Z',provider:'synthetic',model:'observed',contextVersions:{}};
 const modelOutcome={model:{provider:'synthetic',id:'observed',protocol:'openai-completions' as const},responseModel:'reported-model',stop:'error' as const,category:'network' as const,physicalStatus:'unknown' as const,usageFinal:false,usage:{inputTokens:{kind:'unknown' as const,reported:7},outputTokens:{kind:'unknown' as const}},diagnostic:'UNKNOWN' as const};
 const modelEvent={...base,sequence:1,kind:'model.finished' as const,modelOutcome};await state.audit.append(modelEvent,signal);
 const invocation={sessionId:'session-a',branch:'main',operationId:'op-a',invocationId:'invoke-a',toolCallId:'call-a'},toolOutcome={name:'calculate',effect:'write' as const,status:'completed' as const,modelOutput:'rejected' as const,receiptId:'proof-1',resourceUnits:1,invocation,reason:'TOOL_FAILED' as const};
 const toolEvent={...base,sequence:2,kind:'tool.finished' as const,toolName:'calculate',toolFailed:true,session:{sessionId:invocation.sessionId,branch:invocation.branch,operationId:invocation.operationId},invocation,toolOutcome};await state.audit.append(toolEvent,signal);
 assert.deepEqual(createPersistentRuntimeState({projectRoot:root}).readAudit('task-a'),[modelEvent,toolEvent]);
 for(const bad of [{...modelEvent,sequence:3,modelOutcome:{...modelOutcome,prompt:'unapproved raw text'}},{...modelEvent,sequence:3,modelOutcome:{...modelOutcome,model:{...modelOutcome.model,id:'other'}}},{...toolEvent,sequence:3,toolOutcome:{...toolOutcome,invocation:{...invocation,invocationId:'other'}}},{...toolEvent,sequence:3,toolOutcome:{...toolOutcome,rawResult:'unapproved raw value'}}])await assert.rejects(state.audit.append(bad,signal),{reason:'AUDIT_FAILED'});
 assert.deepEqual(state.readAudit('task-a'),[modelEvent,toolEvent]);
});

test('R2-STORE-01 installed SDK v1 uses the production persistent callback and safe audit with known usage',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'r2-sdk-known-')),state=createPersistentRuntimeState({projectRoot:root}),model={provider:'synthetic',id:'observed',protocol:'openai-completions' as const,endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:16};let calls=0;
 const outcome={model:{provider:model.provider,id:model.id,protocol:model.protocol},responseModel:'reported-model',stop:'complete' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:5},outputTokens:{kind:'known' as const,value:3}},diagnostic:'COMPLETE' as const};
 const runtime=createRuntime({...state,model,modelObservations:'v1',authorize:async()=>true,transport:async()=>{calls++;return {content:[{kind:'text',text:'synthetic'}],stop:'complete',usage:{inputTokens:5,outputTokens:3},outcome};}});
 const result=await runtime.runText({taskId:'observed-task',prompt:'synthetic',limits:{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}});assert.equal(result.status,'succeeded');assert.equal(calls,1);assert.equal(result.usage.inputTokens,5);assert.equal(result.usage.outputTokens,3);assert.equal(result.usage.reservedOutputTokens,0);
 const reopened=createPersistentRuntimeState({projectRoot:root});assert.deepEqual(reopened.readAudit('observed-task').find(e=>e.kind==='model.finished')?.modelOutcome,outcome);assert.equal(reopened.readAccounting('observed-task')?.usage.inputTokens,5);
});

test('R2-AUDIT-02 installed SDK late known outcome preserves frozen UNKNOWN, full reserve and busy owner until actual idle',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'r2-sdk-late-')),state=createPersistentRuntimeState({projectRoot:root}),model={provider:'synthetic',id:'observed',protocol:'openai-completions' as const,endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:16};let calls=0,begin!:()=>void,finish!:()=>void;
 const started=new Promise<void>(resolve=>begin=resolve),gate=new Promise<void>(resolve=>finish=resolve),controller=new AbortController();
 const outcome={model:{provider:model.provider,id:model.id,protocol:model.protocol},responseModel:'reported-model',stop:'complete' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:5},outputTokens:{kind:'known' as const,value:3}},diagnostic:'COMPLETE' as const};
 const runtime=createRuntime({...state,model,modelObservations:'v1',authorize:async()=>true,transport:async()=>{calls++;begin();await gate;return {content:[{kind:'text',text:'late synthetic result'}],stop:'complete',usage:{inputTokens:5,outputTokens:3},outcome};}});
 const running=runtime.runText({taskId:'observed-task',prompt:'synthetic',signal:controller.signal,limits:{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}});
 await started;controller.abort();const result=await running,frozen=structuredClone(result);assert.equal(result.status,'cancelled');assert.equal(result.modelOutcome?.physicalStatus,'unknown');const held=state.readAccounting('observed-task')!;assert.ok(held.owner);await assert.rejects(state.budgets.claimUncapped('observed-task','other',held.configuration,{cumulative:'unlimited',maxOutputTokens:16,modelTimeoutMs:1000,toolTimeoutMs:1000,controlTimeoutMs:1000}),{reason:'TASK_BUSY'});
 finish();await runtime.waitForIdle('observed-task');assert.deepEqual(result,frozen);assert.equal(calls,1);
 const reopened=createPersistentRuntimeState({projectRoot:root}),accounting=reopened.readAccounting('observed-task')!;assert.equal(accounting.owner,null);assert.equal(accounting.usage.inputTokens,5);assert.equal(accounting.usage.outputTokens,16);assert.equal(accounting.usage.reservedOutputTokens,16);assert.ok(reopened.readAudit('observed-task').some(e=>e.kind==='model.finished'&&e.reason==='CANCELLED'&&e.modelOutcome?.physicalStatus==='response-received'&&e.modelOutcome.usage.inputTokens.kind==='known'&&e.modelOutcome.usage.inputTokens.value===5),'late terminal observation must persist after cancellation without refund or publication');
});

test('RT12-CK03: actual SDK answer checkpoint survives host reconstruction without another model request',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-checkpoint-'));let calls=0;
 type Checkpoints={saveCheckpoint?:(operation:string,c:Readonly<ConversationCheckpoint>,signal:AbortSignal)=>Promise<void>;readCheckpoint?:(operation:string,task:string)=>ConversationCheckpoint|undefined};
 const state:ReturnType<typeof createPersistentRuntimeState>&Checkpoints=createPersistentRuntimeState({projectRoot:root});
 const model={provider:'synthetic',id:'checkpoint',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000};
 const transport=async()=>{calls++;return {content:[{kind:'text' as const,text:'1050 CNY'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:2}};};
 const limits={modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:10000};
 const first=await createRuntime({...state,model,transport,authorize:async()=>true}).runAgent({taskId:'task-a',prompt:'Synthetic net',limits,tools:[],saveCheckpoint:async(c,s)=>{await state.saveCheckpoint?.('operation-a',c,s);}});
 assert.equal(first.status,'succeeded');assert.equal(calls,1);
 const reconstructed:ReturnType<typeof createPersistentRuntimeState>&Checkpoints=createPersistentRuntimeState({projectRoot:root});
 const saved=reconstructed.readCheckpoint?.('operation-a','task-a');
 assert.ok(saved,'host must acknowledge an actual durable checkpoint, not a no-op callback');
 assert.equal(saved.state,'completed');assert.equal(saved.messages.at(-1)?.text,'1050 CNY');
 const resumed=await createRuntime({...reconstructed,model,transport,authorize:async()=>true}).runAgent({taskId:'task-a',prompt:'',limits,tools:[],checkpoint:saved,saveCheckpoint:async(c,s)=>{await reconstructed.saveCheckpoint?.('operation-a',c,s);}});
 assert.equal(resumed.status,'succeeded');assert.equal(calls,1);assert.equal(resumed.usage.modelCalls,1);
});

test('RT12-CK03: cancelled, foreign-task and oversized checkpoint writes preserve the acknowledged original',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-checkpoint-denied-'));
 const state=createPersistentRuntimeState({projectRoot:root}),signal=new AbortController().signal;
 const original:ConversationCheckpoint={version:'1.0',taskId:'task-a',state:'waiting',messages:[{role:'user',text:'Synthetic clarification'}]};
 await state.saveCheckpoint('operation-a',original,signal);
 await assert.rejects(state.saveCheckpoint('operation-a',{...original,messages:[]},AbortSignal.abort()),{reason:'CANCELLED'});
 await assert.rejects(state.saveCheckpoint('operation-a',{...original,taskId:'task-b'},signal),{reason:'STATE_FAILED'});
 await assert.rejects(state.saveCheckpoint('operation-a',{...original,messages:[{role:'user',text:'x'.repeat(2*1024*1024)}]},signal),{reason:'STATE_FAILED'});
 assert.deepEqual(state.readCheckpoint('operation-a','task-a'),original);
 assert.throws(()=>state.readCheckpoint('operation-a','task-b'),{reason:'STATE_FAILED'});
 const copy=state.readCheckpoint('operation-a','task-a')!;copy.messages[0].text='Mutated by caller';
 assert.deepEqual(state.readCheckpoint('operation-a','task-a'),original);
 assert.deepEqual(state.readAudit('task-a'),[],'private conversation is not audit metadata');
 const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));
 try{db.prepare('UPDATE checkpoints SET body=? WHERE operation_id=?').run('{}','operation-a');}finally{db.close();}
 assert.throws(()=>state.readCheckpoint('operation-a','task-a'),{reason:'STATE_FAILED'});
});

test('RT12-CK03: SDK waiting checkpoint resumes after host reconstruction and consumes the tool result once',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-checkpoint-waiting-'));let calls=0,effects=0;
 const model={provider:'synthetic',id:'checkpoint',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000};
 const tool={name:'clarify',description:'Synthetic business waiting',effect:'read' as const,resourceUnits:1,parameters:{type:'object' as const,properties:{}},execute:async()=>{effects++;return {question:'Specify currency and unit'};}};
 const transport:import('pi-agent-runtime').ModelTransport=async(request)=>{calls++;if(calls===1)return {content:[{kind:'tool',id:'clarify-1',name:'clarify',arguments:{}}],stop:'tools',usage:{inputTokens:1,outputTokens:2}};assert.ok(request.messages.some(m=>m.role==='user'&&m.text==='万，人民币'));assert.equal(request.messages.filter(m=>m.toolId==='clarify-1').length,1);return {content:[{kind:'text',text:'Unit clarified'}],stop:'complete',usage:{inputTokens:1,outputTokens:2}};};
 const limits={modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:10000};
 const firstState=createPersistentRuntimeState({projectRoot:root});
 const first=await createRuntime({...firstState,model,transport,authorize:async()=>true}).runAgent({taskId:'task-a',prompt:'Synthetic net',limits,tools:[tool],shouldYield:()=>effects===1,saveCheckpoint:(c,s)=>firstState.saveCheckpoint('operation-a',c,s)});
 assert.equal(first.status,'waiting');assert.equal(calls,1);assert.equal(effects,1);
 const nextState=createPersistentRuntimeState({projectRoot:root});
 const resumed=await createRuntime({...nextState,model,transport,authorize:async()=>true}).runAgent({taskId:'task-a',prompt:'万，人民币',limits,tools:[tool],checkpoint:nextState.readCheckpoint('operation-a','task-a'),saveCheckpoint:(c,s)=>nextState.saveCheckpoint('operation-a',c,s)});
 assert.equal(resumed.status,'succeeded');assert.equal(calls,2);assert.equal(effects,1);assert.equal(resumed.usage.modelCalls,2);assert.equal(resumed.usage.toolCalls,1);
});

test('RT12-CK03: v2 store migration retains acknowledged accounting and audit while adding checkpoints',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-checkpoint-v2-'));
 const state=createPersistentRuntimeState({projectRoot:root});
 const limits={modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:10000};
 const first=await state.budgets.claim('task-a','run-a','fixed',limits);
 await first.reserveModelUpTo!(10);await first.settleModel(10,3);await first.reserveTool(1);await first.release(100);
 const event={version:'1.0' as const,taskId:'task-a',runId:'run-a',sequence:1,kind:'run.started' as const,at:'2026-10-09T00:00:00Z',provider:'synthetic',model:'checkpoint',contextVersions:{}};
 await state.audit.append(event,new AbortController().signal);
 // The retained v2 schema has budgets and audit only. Remove solely the new
 // table in this synthetic fixture to exercise the real upgrade transaction.
 const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));
 try{db.exec('DROP TABLE checkpoints; PRAGMA user_version=2;');}finally{db.close();}
 const reconstructed=createPersistentRuntimeState({projectRoot:root});
 const second=await reconstructed.budgets.claim('task-a','run-b','fixed',limits);
 assert.deepEqual(second.snapshot(),{modelCalls:1,toolCalls:1,outputTokens:3,resourceUnits:2,activeMs:100});
 assert.deepEqual(reconstructed.readAudit('task-a'),[event]);
 await reconstructed.saveCheckpoint('operation-a',{version:'1.0',taskId:'task-a',state:'waiting',messages:[]},new AbortController().signal);
 assert.equal(reconstructed.readCheckpoint('operation-a','task-a')?.state,'waiting');
 await second.release(0);
});

test('RT12-CK03: unresolved, corrupt or failed historical read cannot create a zero budget',async()=>{
 const limits={modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:10000};
 const usage={modelCalls:2,toolCalls:3,outputTokens:20,resourceUnits:5,activeMs:100};
 const invalid=[
  {fingerprint:'a'.repeat(64),reconciled:false,usage},
  {fingerprint:'bad',reconciled:true,usage},
  {fingerprint:'a'.repeat(64),reconciled:true,usage:{...usage,toolCalls:-1}},
  {fingerprint:'a'.repeat(64),reconciled:true,usage:{...usage,outputTokens:NaN}},
 ];
 for(const historical of invalid){
  const root=mkdtempSync(join(browserEvidenceRoot,'shared-history-denied-'));
  await assert.rejects(createPersistentRuntimeState({projectRoot:root,historicalUsage:()=>historical}).budgets.claim('task-a','run-a','fixed',limits),{reason:'STATE_FAILED'});
  const lease=await createPersistentRuntimeState({projectRoot:root,historicalUsage:()=>({fingerprint:'b'.repeat(64),reconciled:true,usage})}).budgets.claim('task-a','run-b','fixed',limits);
  assert.deepEqual(lease.snapshot(),usage);await lease.release(0);
 }
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-history-unreadable-'));
 await assert.rejects(createPersistentRuntimeState({projectRoot:root,historicalUsage:()=>{throw Error('unavailable');}}).budgets.claim('task-a','run-a','fixed',limits),{reason:'STATE_FAILED'});
 const lease=await createPersistentRuntimeState({projectRoot:root,historicalUsage:()=>({fingerprint:'b'.repeat(64),reconciled:true,usage})}).budgets.claim('task-a','run-b','fixed',limits);
 assert.deepEqual(lease.snapshot(),usage);await lease.release(0);
});

test('RT12-CK03: imported exhausted history denies the next model and tool admission',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-history-exhausted-'));
 const usage={modelCalls:2,toolCalls:3,outputTokens:20,resourceUnits:5,activeMs:100};
 const lease=await createPersistentRuntimeState({projectRoot:root,historicalUsage:()=>({fingerprint:'c'.repeat(64),reconciled:true,usage})}).budgets.claim('task-a','run-a','fixed',{modelCalls:2,toolCalls:3,outputTokens:20,wallTimeMs:10000});
 await assert.rejects(lease.reserveModelUpTo!(1),{reason:'BUDGET_EXHAUSTED'});
 await assert.rejects(lease.reserveTool(1),{reason:'BUDGET_EXHAUSTED'});
 assert.deepEqual(lease.snapshot(),usage);await lease.release(0);
});

test('RT12-03: reopened task retains model/token/tool/time usage and exhausts without resetting',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-budget-'));
 const limits={modelCalls:2,toolCalls:2,outputTokens:100,wallTimeMs:1000};
 const first=await createPersistentRuntimeState({projectRoot:root}).budgets.claim('task-a','run-a','configuration-a',limits);
 assert.equal(await first.reserveModelUpTo!(80),80);
 await first.settleModel(80,30);await first.reserveTool(1);await first.release(400);
 const second=await createPersistentRuntimeState({projectRoot:root}).budgets.claim('task-a','run-b','configuration-a',limits);
 assert.deepEqual(second.snapshot(),{modelCalls:1,toolCalls:1,outputTokens:30,resourceUnits:2,activeMs:400});
 assert.equal(await second.reserveModelUpTo!(80),70);
 await assert.rejects(second.reserveModelUpTo!(1),{reason:'BUDGET_EXHAUSTED'});
 await second.release(600);
 await assert.rejects(createPersistentRuntimeState({projectRoot:root}).budgets.claim('task-a','run-c','configuration-a',limits),{reason:'BUDGET_EXHAUSTED'});
});

test('RT12-01/03: same business task changing actual route is rejected, never resets its counters',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-route-'));const state=createPersistentRuntimeState({projectRoot:root});let calls=0;
 const model={provider:'synthetic',id:'main',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000};
 const transport=async()=>{calls++;return {content:[{kind:'text' as const,text:'answer'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};};
 const limits={modelCalls:10,toolCalls:0,outputTokens:1000,wallTimeMs:1000};
 const first=await createRuntime({...state,model,transport,authorize:async()=>true}).runText({taskId:'task-a',prompt:'first',limits});
 assert.equal(first.status,'succeeded');
 const second=await createRuntime({...state,model:{...model,id:'report-backup'},transport,authorize:async()=>true}).runText({taskId:'task-a',prompt:'report',limits});
 assert.equal(second.status,'blocked');assert.equal(second.reason,'CONFIGURATION_CHANGED');assert.equal(calls,1);
});

test('RT12-04: unsafe audit context closes admission before a model request',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-audit-fail-'));
 const state=createPersistentRuntimeState({projectRoot:root});let calls=0;
 const model={provider:'synthetic',id:'example',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000};
 const runtime=createRuntime({...state,model,authorize:async()=>true,transport:async()=>{calls++;return {content:[{kind:'text',text:'answer'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}});
 const result=await runtime.runText({taskId:'task-a',prompt:'synthetic',contextVersions:{scope:'private source contents'},limits:{modelCalls:2,toolCalls:0,outputTokens:100,wallTimeMs:1000}});
 assert.equal(result.status,'failed');assert.equal(result.reason,'AUDIT_FAILED');assert.equal(calls,0);
});

test('RT12-03/04: actual SDK Agent consumes a tool result and meters both physical requests',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-agent-'));const state=createPersistentRuntimeState({projectRoot:root});let tools=0,turns=0;
 const runtime=createRuntime({...state,model:{provider:'synthetic',id:'example',protocol:'openai-completions',endpoint:'https://example.invalid/v1',contextWindow:1000,maxOutputTokens:50},authorize:async()=>true,
  transport:async request=>{
   turns++;if(turns===1)return {content:[{kind:'tool',id:'read-proof',name:'read_proof',arguments:{}}],stop:'tools',usage:{inputTokens:5,outputTokens:10}};
   assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('local-result-42')));
   return {content:[{kind:'text',text:'local-result-42'}],stop:'complete',usage:{inputTokens:10,outputTokens:5}};
  }});
 const result=await runtime.runAgent({taskId:'task-a',prompt:'synthetic',limits:{modelCalls:4,toolCalls:2,outputTokens:200,wallTimeMs:1000},tools:[{name:'read_proof',description:'Read a synthetic local proof',effect:'read',parameters:{type:'object',properties:{},additionalProperties:false},resourceUnits:1,execute:async()=>{tools++;return {proof:'local-result-42'};}}]});
 assert.equal(result.status,'succeeded');assert.equal(tools,1);assert.equal(turns,2);assert.equal(result.usage.modelCalls,2);assert.equal(result.usage.toolCalls,1);assert.equal(result.usage.outputTokens,15);
 assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit('task-a').filter(e=>e.kind==='model.admitted').length,2);
});

test('RT12-04: SDK actual text execution uses durable audit and cumulative budget',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-consumer-'));
 const state=createPersistentRuntimeState({projectRoot:root});
 const audit=Reflect.get(state,'audit');assert.equal(typeof audit?.append,'function','persistent audit is required before execution');
 const limits={modelCalls:2,toolCalls:0,outputTokens:100,wallTimeMs:1000};
 const model={provider:'synthetic',id:'example',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000,maxOutputTokens:50};
 const runtime=createRuntime({model,budgets:state.budgets,audit,authorize:async()=>true,
  transport:async()=>({content:[{kind:'text',text:'synthetic answer'}],stop:'complete',usage:{inputTokens:10,outputTokens:7}})});
 const result=await runtime.runText({taskId:'task-a',prompt:'synthetic',contextVersions:{scope:'a'.repeat(64)},limits});
 assert.equal(result.status,'succeeded');assert.equal(result.usage.modelCalls,1);assert.equal(result.usage.outputTokens,7);
 const read=Reflect.get(state,'readAudit');assert.equal(typeof read,'function');
 assert.deepEqual(read('task-a').map((e:{kind:string})=>e.kind),['run.started','model.admitted','model.finished','run.finished']);
 assert.equal(JSON.stringify(read('task-a')).includes('synthetic answer'),false);
});

test('RT12-03: live/crashed ownership blocks another instance and stale leases cannot write',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-ownership-'));
 const limits={modelCalls:3,toolCalls:3,outputTokens:200,wallTimeMs:1000};
 const state=createPersistentRuntimeState({projectRoot:root});
 const first=await state.budgets.claim('task-a','run-a','config',limits);
 await first.reserveModelUpTo!(80);
 const reopened=createPersistentRuntimeState({projectRoot:root});
 await assert.rejects(reopened.budgets.claim('task-a','run-b','config',limits),{reason:'TASK_BUSY'});
 await first.release(10);
 const second=await reopened.budgets.claim('task-a','run-b','config',limits);
 assert.equal(second.snapshot().outputTokens,80,'unconfirmed reservation is not refunded');
 await assert.rejects(first.reserveTool(1),{reason:'TASK_BUSY'});
 await second.release(10);
});

test('RT12-03: changed limits/configuration cannot silently reset the same business task',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-config-'));
 const limits={modelCalls:3,toolCalls:3,outputTokens:200,wallTimeMs:1000};
 const store=createPersistentRuntimeState({projectRoot:root}).budgets;
 const lease=await store.claim('task-a','run-a','config-a',limits);await lease.release(1);
 await assert.rejects(store.claim('task-a','run-b','config-b',limits),{reason:'CONFIGURATION_CHANGED'});
 await assert.rejects(store.claim('task-a','run-b','config-a',{...limits,outputTokens:1000}),{reason:'CONFIGURATION_CHANGED'});
});

test('RT12-03: known usage settles once; failed tool admission changes no counters',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-settlement-'));
 const limits={modelCalls:3,toolCalls:1,outputTokens:200,wallTimeMs:1000,resourceUnits:3};
 const lease=await createPersistentRuntimeState({projectRoot:root}).budgets.claim('task-a','run-a','config',limits);
 await lease.reserveModelUpTo!(100);await lease.settleModel(100,40);
 await assert.rejects(lease.settleModel(100,40),{reason:'STATE_FAILED'});
 await lease.reserveTool(2);const before=lease.snapshot();
 await assert.rejects(lease.reserveTool(1),{reason:'BUDGET_EXHAUSTED'});
 assert.deepEqual(lease.snapshot(),before);await lease.release(1);
});

test('RT12-01/03: declared analysis/report purposes share durable task budget across reconstruction',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-purposes-'));let calls=0;const providers:string[]=[];
 const model={provider:'synthetic-main',id:'main',protocol:'openai-completions' as const,endpoint:'https://example.invalid/v1',contextWindow:1000,maxOutputTokens:20};
 const transport=async(request: {model:{provider:string}})=>{calls++;providers.push(request.model.provider);return {content:[{kind:'text' as const,text:'verified synthetic result'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:3}};};
 const purposes=[{id:'analysis',mode:'agent' as const,model,transport,tools:[]},{id:'report',mode:'text' as const,model:{...model,provider:'synthetic-report',id:'report'},transport}];
 const options={model,transport,purposes,authorize:async()=>true};const limits={modelCalls:2,toolCalls:2,outputTokens:100,wallTimeMs:1000};
 const first=await createRuntime({...options,...createPersistentRuntimeState({projectRoot:root})}).runAgent({taskId:'task-a',purpose:'analysis',prompt:'Calculate',tools:[],limits});
 assert.equal(first.status,'succeeded');
 const second=await createRuntime({...options,...createPersistentRuntimeState({projectRoot:root})}).runText({taskId:'task-a',purpose:'report',prompt:'Explain',limits});
 assert.equal(second.status,'succeeded');assert.deepEqual(providers,['synthetic-main','synthetic-report']);assert.equal(second.usage.modelCalls,2);assert.equal(second.usage.outputTokens,6);
 const third=await createRuntime({...options,...createPersistentRuntimeState({projectRoot:root})}).runText({taskId:'task-a',purpose:'report',prompt:'Again',limits});
 assert.equal(third.status!=='succeeded'&&third.reason,'BUDGET_EXHAUSTED');assert.equal(calls,2);
 assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit('task-a').filter(e=>e.kind==='model.admitted').length,2);
});

test('RT12-03: lease snapshot is a safe acknowledged copy and requires no storage IO',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-snapshot-'));const limits={modelCalls:2,toolCalls:1,outputTokens:100,wallTimeMs:1000};
 const lease=await createPersistentRuntimeState({projectRoot:root}).budgets.claim('task-a','run-a','config',limits);
 await lease.reserveModelUpTo!(20);await lease.settleModel(20,5);
 const file=join(root,'.xanthil','desktop','pi-runtime.sqlite'),saved=file+'.preserved';renameSync(file,saved);
 try {const snapshot=lease.snapshot();assert.equal(snapshot.outputTokens,5);snapshot.outputTokens=999;assert.equal(lease.snapshot().outputTokens,5);}
 finally {if(existsSync(file))renameSync(file,file+'.fault-created');renameSync(saved,file);await lease.release(1);}
});

test('RT12-CK03: first SDK claim preserves reconciled historical use and reconstruction never seeds it twice',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'shared-history-'));let reads=0;
 const historical={fingerprint:'a'.repeat(64),reconciled:true,usage:{modelCalls:3,toolCalls:7,outputTokens:41,resourceUnits:10,activeMs:400}};
 const options={projectRoot:root,historicalUsage:(task:string)=>{assert.equal(task,'task-a');reads++;return historical;}};
 const limits={modelCalls:4,toolCalls:8,outputTokens:100,wallTimeMs:10000};
 const first=await createPersistentRuntimeState(options).budgets.claim('task-a','run-a','fixed',limits);
 assert.deepEqual(first.snapshot(),historical.usage);
 await first.reserveModelUpTo!(20);await first.settleModel(20,5);await first.reserveTool(1);await first.release(1);
 const second=await createPersistentRuntimeState(options).budgets.claim('task-a','run-b','fixed',limits);
 assert.equal(second.snapshot().modelCalls,4);assert.equal(second.snapshot().toolCalls,8);assert.equal(second.snapshot().outputTokens,46);assert.equal(reads,1);
 await assert.rejects(second.reserveModelUpTo!(1),{reason:'BUDGET_EXHAUSTED'});await second.release(1);
});


test('SDK040-02 safe native identity metadata is durable audit, not private content',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-audit-')); const signal=new AbortController().signal;
 const event={version:'1.0' as const,taskId:'task-a',runId:'run-native',sequence:1,kind:'session.control' as const,at:'2026-10-09T00:00:00Z',provider:'synthetic',model:'native',contextVersions:{},session:{sessionId:'session-a',branch:'main',operationId:'operation-a'},invocation:{sessionId:'session-a',branch:'main',operationId:'operation-a',invocationId:'invocation-a',toolCallId:'call-a'},toolFailed:false};
 await createPersistentRuntimeState({projectRoot:root}).audit.append(event,signal);
 assert.deepEqual(createPersistentRuntimeState({projectRoot:root}).readAudit('task-a'),[event]);
 const invalid={...event,sequence:2,session:{...event.session,content:'raw private prompt'}};
 await assert.rejects(createPersistentRuntimeState({projectRoot:root}).audit.append(invalid,signal),{reason:'AUDIT_FAILED'});
 assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit('task-a').length,1);
});


test('SDK040-02 native operation ownership survives reconstruction, refuses rebinding and retains budget',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-bind-')), signal=new AbortController().signal;
 type Native={selectSession?:(task:string,purpose:string,session:string)=>void;readSession?:(task:string,purpose:string)=>string|undefined;bindOperation?:(x:{sessionId:string;branch:string;operationId:string;taskId:string;purpose?:string},s:AbortSignal)=>Promise<void>;readBinding?:(operation:string)=>unknown};
 const state:ReturnType<typeof createPersistentRuntimeState>&Native=createPersistentRuntimeState({projectRoot:root});
 assert.equal(typeof state.selectSession,'function','native session needs acknowledged host ownership');
 state.selectSession!('task-a','analysis','session-a');
 const binding={sessionId:'session-a',branch:'main',operationId:'operation-a',taskId:'task-a',purpose:'analysis'};
 await state.bindOperation!(binding,signal);await state.bindOperation!(binding,signal);
 const next:ReturnType<typeof createPersistentRuntimeState>&Native=createPersistentRuntimeState({projectRoot:root});
 assert.equal(next.readSession!('task-a','analysis'),'session-a');assert.deepEqual(next.readBinding!('operation-a'),binding);
 await assert.rejects(next.bindOperation!({...binding,taskId:'task-b'},signal),{reason:'STATE_FAILED'});
 await assert.rejects(next.bindOperation!({...binding,operationId:'denied'},AbortSignal.abort()),{reason:'CANCELLED'});
 assert.equal(next.readBinding!('denied'),undefined);
 assert.throws(()=>next.selectSession!('task-b','analysis','session-a'),{reason:'STATE_FAILED'});
 const limits={modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:10000};
 const first=await state.budgets.claim('task-a','run-a','fixed',limits);await first.reserveModelUpTo!(10);await first.settleModel(10,3);await first.release(100);
 const lease=await next.budgets.claim('task-a','run-b','fixed',limits);assert.equal(lease.snapshot().modelCalls,1);assert.equal(lease.snapshot().outputTokens,3);await lease.release(0);
});


test('SDK040-02 project session writer excludes reconstructed hosts and native history survives without execution',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-writer-'));
 type Host={sessionStorage?:(authorize:import('pi-agent-runtime').SessionStorage['authorize'])=>import('pi-agent-runtime').SessionStorage};
 const state:ReturnType<typeof createPersistentRuntimeState>&Host=createPersistentRuntimeState({projectRoot:root});
 assert.equal(typeof state.sessionStorage,'function','host must enforce dedicated session root ownership');
 const storage=state.sessionStorage!(async()=>true),signal=new AbortController().signal;
 const writer=await storage.acquireWriter(signal);
 const next:ReturnType<typeof createPersistentRuntimeState>&Host=createPersistentRuntimeState({projectRoot:root});
 await assert.rejects(next.sessionStorage!(async()=>true).acquireWriter(signal),{reason:'TASK_BUSY'});await writer.release();
 await assert.rejects(storage.acquireWriter(AbortSignal.abort()),{reason:'CANCELLED'});
 const {createSessionRuntime}=await import('pi-agent-runtime');let calls=0;
 const opts={...state,storage,model:{provider:'synthetic',id:'native',protocol:'openai-completions' as const,endpoint:'https://example.invalid',contextWindow:8192},transport:async()=>{calls++;return {content:[{kind:'text' as const,text:'saved'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};},authorize:async()=>true,reconcile:async()=> 'ready' as const};
 const runtime=createSessionRuntime(opts),session=await runtime.create();state.selectSession('task-a','analysis',session.id);
 const result=await runtime.run({sessionId:session.id,taskId:'task-a',prompt:'synthetic',tools:[],limits:{modelCalls:10,toolCalls:5,outputTokens:100,wallTimeMs:10000}});
 assert.equal(result.status,'succeeded');assert.equal(calls,1);
 const reopened=createSessionRuntime({...opts,storage:next.sessionStorage!(async()=>true),budgets:next.budgets,audit:next.audit,bindOperation:next.bindOperation});
 assert.ok((await reopened.history(session.id)).some(e=>e.message?.text==='saved'));assert.equal(calls,1);
});


test('SDK040-01 production analysis Adapter uses persistent native context and real tool feedback',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-analysis-'));
 const module=await import('../../../adapters/agent-pi/open-analysis.ts');
 const factory=Reflect.get(module,'createPiSessionOpenAnalysisRuntime');assert.equal(typeof factory,'function','production adapter must offer actual shared SessionRuntime consumption');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
 const transport:import('pi-agent-runtime').ModelTransport=async(request)=>{calls++;
  if(calls===1)return {content:[{kind:'tool',id:'calc-1',name:'analysis_tool',arguments:{name:'calculate',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:1,outputTokens:2}};
  assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('1050')));return {content:[{kind:'text',text:calls===2?'1050 CNY':'previous verified 1050'}],stop:'complete',usage:{inputTokens:1,outputTokens:2}};
 };
 const identity={task_id:'04000000-0000-4000-a000-000000000001',revision:'1',run_id:'04000000-0000-4000-a000-000000000002',attempt_id:'04000000-0000-4000-a000-000000000003',operation_id:'04000000-0000-4000-a000-000000000004',grant_id:'04000000-0000-4000-a000-000000000005',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const config={projectRoot:root,ledger,modelTransport:transport,credentials:createApprovedProviderCredentials({environment:{}})};
 const input={identity,prompt:'compute synthetic net',system:'fixed synthetic business scope',signal:new AbortController().signal,authorize:()=>true,tools:[{name:'calculate',description:'Independent fixture net calculation',parameters:{type:'object',properties:{}},execute:async()=>{effects++;return {net:1050,verified:true};}}]};
 assert.equal((await factory(config).run(input)).text,'1050 CNY');assert.equal(effects,1);
 const reconstructed=factory(config);assert.equal((await reconstructed.run({...input,prompt:'use previous result'})).text,'previous verified 1050');assert.equal(effects,1);assert.equal(calls,3);
 assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,3);
});


test('SDK040-03 business wait keeps native tool feedback, explicit answer continues; report text shares task budget',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-wait-'));
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0,waiting=false;
 const modelTransport:import('pi-agent-runtime').ModelTransport=async request=>{calls++;
  if(calls===1)return {content:[{kind:'tool',id:'clarify-1',name:'analysis_tool',arguments:{name:'clarify',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:1,outputTokens:2}};
  if(request.model.provider==='xiaomi-token-plan-cn')return {content:[{kind:'text',text:'MiMo interpretation'}],stop:'complete',usage:{inputTokens:1,outputTokens:2}};
  assert.ok(request.messages.some(m=>m.role==='tool'&&m.text.includes('currency')));assert.ok(request.messages.some(m=>m.role==='user'&&m.text.includes('CNY')&&m.text.includes('<skill')));return {content:[{kind:'text',text:'confirmed CNY'}],stop:'complete',usage:{inputTokens:1,outputTokens:2}};
 };
 const config={projectRoot:root,ledger,modelTransport,credentials:createApprovedProviderCredentials({environment:{}})};
 const identity={task_id:'04000000-0000-4000-a000-000000000011',revision:'1',run_id:'04000000-0000-4000-a000-000000000012',attempt_id:'04000000-0000-4000-a000-000000000013',operation_id:'04000000-0000-4000-a000-000000000014',grant_id:'04000000-0000-4000-a000-000000000015',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,prompt:'synthetic currency?',system:'business scope',signal:new AbortController().signal,authorize:()=>true,shouldYield:()=>waiting,tools:[{name:'clarify',description:'Ask a business question',parameters:{type:'object',properties:{}},execute:async()=>{effects++;waiting=true;return {question:'currency?'};}}]};
 assert.equal((await createPiSessionOpenAnalysisRuntime(config).run(input)).text,'');assert.equal(calls,1);assert.equal(effects,1);
 waiting=false;assert.equal((await createPiSessionOpenAnalysisRuntime(config).run({...input,prompt:'CNY'})).text,'confirmed CNY');assert.equal(calls,2);assert.equal(effects,1);
 const report=await createPiSessionOpenAnalysisRuntime(config).run({...input,purpose:'report_edit',prompt:'interpret known verified output',tools:[]});assert.equal(report.text,'MiMo interpretation');
 assert.equal(calls,3);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,3);
});


test('SDK040-03 production professional skill and automatic compression enter subsequent model context',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-skill-'));
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0,summaries=0,consumed=false;
 const modelTransport:import('pi-agent-runtime').ModelTransport=async request=>{calls++;const text=request.messages.map(m=>m.text).join('\n');
  if(text.includes('context summarization assistant')){summaries++;return {content:[{kind:'text',text:'COMPACTED-BUSINESS: verified net 1050 CNY; cause unknown'}],stop:'complete',usage:{inputTokens:100,outputTokens:20}};}
  if(calls===1)assert.ok(text.includes('数字必须来自实际本地计算'),'actual professional content must enter native skill invocation');
  if(text.includes('COMPACTED-BUSINESS: verified net 1050 CNY; cause unknown'))consumed=true;
  return {content:[{kind:'text',text:'net 1050'}],stop:'complete',usage:{inputTokens:summaries?100:195000,outputTokens:2}};
 };
 const identity={task_id:'04000000-0000-4000-a000-000000000021',revision:'1',run_id:'04000000-0000-4000-a000-000000000022',attempt_id:'04000000-0000-4000-a000-000000000023',operation_id:'04000000-0000-4000-a000-000000000024',grant_id:'04000000-0000-4000-a000-000000000025',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const config={projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),modelTransport,credentials:createApprovedProviderCredentials({environment:{}})};
 const input={identity,prompt:'synthetic professional analysis',system:'business scope',signal:new AbortController().signal,authorize:()=>true,tools:[]};
 await createPiSessionOpenAnalysisRuntime(config).run(input);await createPiSessionOpenAnalysisRuntime(config).run({...input,prompt:'continue same task'});
 assert.ok(summaries>0);assert.equal(consumed,true);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,calls);
});

test('SDK040-03 selected professional resources use native skill and template expansion',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-selection-'));
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const seen:string[]=[];const modelTransport:import('pi-agent-runtime').ModelTransport=async request=>{seen.push(request.messages.map(m=>m.text).join('\n'));return {content:[{kind:'text',text:'selected'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),modelTransport,credentials:createApprovedProviderCredentials({environment:{}})});
 const identity={task_id:'04000000-0000-4000-a000-000000000031',revision:'1',run_id:'04000000-0000-4000-a000-000000000032',attempt_id:'04000000-0000-4000-a000-000000000033',operation_id:'04000000-0000-4000-a000-000000000034',grant_id:'04000000-0000-4000-a000-000000000035',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,prompt:'synthetic selected request',system:'business scope',signal:new AbortController().signal,authorize:()=>true,tools:[],preferences:{skill:'group-summary' as const,prompt:'brief' as const}};
 await runtime.run(input);assert.match(seen[0],/<skill name="group-summary"/);
 await runtime.run({...input,purpose:'proposal_prepare'});assert.ok(seen[1].includes('synthetic selected request'));assert.ok(seen[1].includes('用简短中文说明实际结果和必要限制'));assert.ok(!seen[1].includes('$1'));
});

test('SDK040-04 Application clarification uses native recovery without constructing a second protocol owner',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-application-wait-'));
 const {createOpenAnalysisApplication}=await import('../../../packages/application/open-analysis.ts');const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {taskHash}=await import('../../../packages/product-core/member-task.ts');
 const source={version:'1.0' as const,sources:[{source_id:'04000000-0000-4000-a000-000000000045',display_name:'synthetic.csv',format:'csv' as const,sha256:'a'.repeat(64),byte_length:'10',sheets:[{sheet_id:'csv',name:'CSV',state:'visible' as const,rows:[{row:1,cells:[{column:'A',type:'string' as const,value:'amount'}]},{row:2,cells:[{column:'A',type:'string' as const,value:'10'}]}]}]}]};
 const identity={task_id:'04000000-0000-4000-a000-000000000041',revision:'1',run_id:'04000000-0000-4000-a000-000000000042',attempt_id:'04000000-0000-4000-a000-000000000043',operation_id:'04000000-0000-4000-a000-000000000044',grant_id:'04000000-0000-4000-a000-000000000046',scope_sha256:taskHash(source),config_sha256:'b'.repeat(64)};
 let checkpoints=0,calls=0;
 const modelTransport:import('pi-agent-runtime').ModelTransport=async request=>{calls++;assert.ok(request.messages.some(m=>m.text.includes('CURRENT_BUSINESS_STATE')),'SDK041-REC02 current business evidence state must enter native context');return {content:[{kind:'tool',id:'ask-'+calls,name:'analysis_tool',arguments:{name:'ask_user',arguments_json:JSON.stringify({text:calls===1?'currency?':'remaining business question?'})}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}};};
 const config={projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),modelTransport,credentials:createApprovedProviderCredentials({environment:{}})};
 const options={runtime:createPiSessionOpenAnalysisRuntime(config),loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async(x:any)=>({saved:true,...x.identity}),verify:()=>{throw Error('not calculated');},saveOutcome:async(x:any)=>({saved:true,outcome_id:x.outcome_id,...x.identity}),saveClarification:async(x:any)=>({saved:true,...x.identity}),saveCheckpoint:async(x:any)=>{checkpoints++;return {saved:true,...x.identity};}};
 assert.equal((await createOpenAnalysisApplication(options).run({identity,question:'calculate',signal:new AbortController().signal})).state,'waiting');
 const next=createOpenAnalysisApplication({...options,runtime:createPiSessionOpenAnalysisRuntime(config),checkpoint:{version:'1.0' as const,turn:1,messages:[{speaker:'user' as const,text:'saved business evidence, not a replay protocol'}],calculation:null,verification:null},clarificationQuestion:'currency?'});
 assert.equal((await next.run({identity,question:'CNY',signal:new AbortController().signal})).state,'waiting');assert.equal(calls,2);assert.equal(checkpoints,0);
});

test('SDK040-02 native queued input can be inspected and withdrawn after Adapter reconstruction without a model call',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-queue-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0,entered!:()=>void,finish!:()=>void;const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>finish=r);const modelTransport:import('pi-agent-runtime').ModelTransport=async()=>{calls++;entered();await gate;return {content:[{kind:'text',text:'done'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};};
 const config={projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),modelTransport,credentials:createApprovedProviderCredentials({environment:{}})};const identity={task_id:'04000000-0000-4000-a000-000000000051',revision:'1',run_id:'04000000-0000-4000-a000-000000000052',attempt_id:'04000000-0000-4000-a000-000000000053',operation_id:'04000000-0000-4000-a000-000000000054',grant_id:'04000000-0000-4000-a000-000000000055',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};const runtime=createPiSessionOpenAnalysisRuntime(config),signal=new AbortController().signal;
 const running=runtime.run({identity,prompt:'synthetic',system:'scope',tools:[],signal,authorize:()=>true});await ready;assert.equal(typeof runtime.sessionControl,'function');
 const queued=await runtime.sessionControl!({identity,signal,authorize:()=>true,command:{kind:'nextRun',text:'synthetic queued question'}});assert.ok(queued.entryId);assert.equal(calls,1);finish();await running;
 const next=createPiSessionOpenAnalysisRuntime(config),view=await next.sessionControl!({identity,signal,authorize:()=>true,command:{kind:'snapshot'}});assert.ok(view.view?.queued.some(q=>q.entryId===queued.entryId));assert.equal(calls,1);
 assert.equal((await next.sessionControl!({identity,signal,authorize:()=>true,command:{kind:'cancelQueued',entryId:queued.entryId!}})).cancelled,true);assert.equal(calls,1);
 await assert.rejects(next.sessionControl!({identity,signal,authorize:()=>false,command:{kind:'nextRun',text:'not permitted'}}));
});

test('SDK040-04 authorized business revision keeps the same immutable Runtime and accumulated task budget',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-revision-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0;const modelTransport:import('pi-agent-runtime').ModelTransport=async()=>{calls++;return {content:[{kind:'text',text:'current revision'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};};const config={projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport};
 const identity={task_id:'04000000-0000-4000-a000-000000000061',revision:'1',run_id:'04000000-0000-4000-a000-000000000062',attempt_id:'04000000-0000-4000-a000-000000000063',operation_id:'04000000-0000-4000-a000-000000000064',grant_id:'04000000-0000-4000-a000-000000000065',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};const input={identity,prompt:'original scope',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await createPiSessionOpenAnalysisRuntime(config).run(input);
 await createPiSessionOpenAnalysisRuntime(config).run({...input,identity:{...identity,revision:'2',scope_sha256:'c'.repeat(64),run_id:'04000000-0000-4000-a000-000000000066'},prompt:'explicitly revised scope'});assert.equal(calls,2);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,2);assert.equal(config.ledger.read(identity.task_id).length,2);
});

test('SDK040-02 native conversation fork changes selected history, not task identity or accumulated budget',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-fork-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0;const modelTransport:import('pi-agent-runtime').ModelTransport=async request=>{calls++;if(calls===2)assert.ok(request.messages.some(m=>m.text.includes('original branch answer')));return {content:[{kind:'text',text:calls===1?'original branch answer':'fork answer'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};};const config={projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport};
 const identity={task_id:'04000000-0000-4000-a000-000000000071',revision:'1',run_id:'04000000-0000-4000-a000-000000000072',attempt_id:'04000000-0000-4000-a000-000000000073',operation_id:'04000000-0000-4000-a000-000000000074',grant_id:'04000000-0000-4000-a000-000000000075',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};const input={identity,prompt:'original',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true};const runtime=createPiSessionOpenAnalysisRuntime(config);
 await runtime.run(input);const original=createPersistentRuntimeState({projectRoot:root}).readSession(identity.task_id,'analysis');const fork=await runtime.sessionControl!({identity,signal:input.signal,authorize:()=>true,command:{kind:'fork'}});assert.ok(fork.sessionId);assert.notEqual(fork.sessionId,original);assert.equal(calls,1);
 const snapshot=await runtime.sessionControl!({identity,signal:input.signal,authorize:()=>true,command:{kind:'snapshot'}});assert.ok(snapshot.view?.history?.some(e=>e.role==='assistant'&&e.preview.includes('original branch answer')),'SDK041-UI01 actual native history must have selectable owned positions');
 await createPiSessionOpenAnalysisRuntime(config).run({...input,prompt:'explicitly continue copied conversation'});assert.equal(calls,2);assert.equal(config.ledger.read(identity.task_id).length,2);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,2);
});

test('SDK040-04 cancellation and revoked grant cannot publish a late physical result or reset task consumption',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-late-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let entered!:()=>void,finish!:()=>void,allowed=true;const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>finish=r),controller=new AbortController();const modelTransport:import('pi-agent-runtime').ModelTransport=async()=>{entered();await gate;return {content:[{kind:'text',text:'LATE-DO-NOT-PUBLISH'}],stop:'complete',usage:{inputTokens:1,outputTokens:2}};};
 const identity={task_id:'04000000-0000-4000-a000-000000000081',revision:'1',run_id:'04000000-0000-4000-a000-000000000082',attempt_id:'04000000-0000-4000-a000-000000000083',operation_id:'04000000-0000-4000-a000-000000000084',grant_id:'04000000-0000-4000-a000-000000000085',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport});let published=false;const promise=runtime.run({identity,prompt:'synthetic',system:'scope',tools:[],signal:controller.signal,authorize:()=>allowed}).then(()=>{published=true;});const rejected=assert.rejects(promise);await ready;allowed=false;ledger.stop(identity.task_id);controller.abort();finish();await rejected;await runtime.collect!(identity.task_id);
 assert.equal(published,false);assert.equal(ledger.read(identity.task_id).length,1);assert.equal(ledger.read(identity.task_id)[0].publishable,false);assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(identity.task_id).filter(e=>e.kind==='model.admitted').length,1);
});

test('SDK041-01 durable uncapped accounting preserves known input, over-limit output and unknown reservations across reopen',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'uncapped-durable-'));
 const limits={cumulative:'unlimited' as const,maxOutputTokens:4096,modelTimeoutMs:30000,toolTimeoutMs:60000,controlTimeoutMs:10000};
 const state=createPersistentRuntimeState({projectRoot:root});assert.equal(typeof state.budgets.claimUncapped,'function');
 const lease=await state.budgets.claimUncapped!('uncapped-task','run-1','configuration',limits);
 const first=await lease.reserveModelUpTo!(10);await lease.settleModelUsage(first,{inputTokens:37,outputTokens:12});
 await lease.reserveModelUpTo!(8);await lease.reserveTool(3);await lease.release(100);
 const next=await createPersistentRuntimeState({projectRoot:root}).budgets.claimUncapped!('uncapped-task','run-2','configuration',limits);
 assert.deepEqual(next.snapshot(),{modelCalls:2,toolCalls:1,inputTokens:37,outputTokens:20,reservedOutputTokens:8,resourceUnits:5,activeMs:100});
 await assert.rejects(state.budgets.claimUncapped!('uncapped-task','conflict','configuration',limits),{reason:'TASK_BUSY'});
 await next.release(0);
 await assert.rejects(state.budgets.claim('uncapped-task','old','configuration',{modelCalls:10,toolCalls:10,outputTokens:100,wallTimeMs:1000}),{reason:'CONFIGURATION_CHANGED'});
 const old=await state.budgets.claim('finite-task','old','finite-configuration',{modelCalls:1,toolCalls:1,outputTokens:100,wallTimeMs:1000});await old.reserveModel();await old.release(0);
 await assert.rejects(state.budgets.claimUncapped!('finite-task','switch','new-configuration',limits),{reason:'CONFIGURATION_CHANGED'});
});

test('SDK041-02 production Adapter shares exactly one extra physical request and keeps failure usage in the task ledger',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-one-extra-'));const {ProviderFailure}=await import('pi-agent-runtime');const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0;const ledger=createLocalAnalysisRequestLedger({projectRoot:root});const modelTransport:import('pi-agent-runtime').ModelTransport=async()=>{calls++;throw new ProviderFailure('unavailable');};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport});
 const identity={task_id:'04100000-0000-4000-a000-000000000001',revision:'1',run_id:'04100000-0000-4000-a000-000000000002',attempt_id:'04100000-0000-4000-a000-000000000003',operation_id:'04100000-0000-4000-a000-000000000004',grant_id:'04100000-0000-4000-a000-000000000005',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await assert.rejects(runtime.run({identity,prompt:'synthetic',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true}));
 assert.equal(calls,2);assert.equal(ledger.read(identity.task_id).length,2);assert.ok(ledger.read(identity.task_id).every(r=>r.status==='temporary_failure'&&r.usage.output_tokens.kind==='unknown'));
 const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{const v=JSON.parse(String(db.prepare('SELECT body FROM budgets WHERE task_id=?').get(identity.task_id)?.body));assert.equal(v.limits.cumulative,'unlimited');assert.equal(v.usage.modelCalls,2);assert.equal(v.usage.reservedOutputTokens,8192);assert.equal(v.usage.inputTokens,0);}finally{db.close();}
});

test('SDK041-01 uncapped overflow or invalid settlement cannot clear an unknown reservation or make accounting negative',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'uncapped-overflow-'));const state=createPersistentRuntimeState({projectRoot:root});const limits={cumulative:'unlimited' as const,maxOutputTokens:4096,modelTimeoutMs:30000,toolTimeoutMs:60000,controlTimeoutMs:10000};
 const lease=await state.budgets.claimUncapped('overflow-task','run','config',limits);await lease.reserveTool(Number.MAX_SAFE_INTEGER);
 await assert.rejects(lease.reserveTool(1),{reason:'STATE_FAILED'});assert.equal(lease.snapshot().toolCalls,1);assert.equal(lease.snapshot().resourceUnits,Number.MAX_SAFE_INTEGER);
 await lease.release(0);
 const clean=await state.budgets.claimUncapped('settle-task','run','config',limits),reserved=await clean.reserveModelUpTo(4);
 await assert.rejects(clean.settleModelUsage(reserved,{inputTokens:-1,outputTokens:2}),{reason:'INVALID_REQUEST'});
 assert.equal(clean.snapshot().reservedOutputTokens,4);await assert.rejects(clean.settleModel(reserved,0),{reason:'INVALID_REQUEST'});assert.equal(clean.snapshot().outputTokens,4);
 await clean.settleModelUsage(reserved,{inputTokens:7,outputTokens:6});assert.equal(clean.snapshot().outputTokens,6);assert.equal(clean.snapshot().reservedOutputTokens,0);await clean.release(0);
});

test('SDK041-03 real child process reopens native conversation and retains same task accounting',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-process-reopen-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const {execFileSync}=await import('node:child_process');
 const identity={task_id:'04100000-0000-4000-a000-000000000011',revision:'1',run_id:'04100000-0000-4000-a000-000000000012',attempt_id:'04100000-0000-4000-a000-000000000013',operation_id:'04100000-0000-4000-a000-000000000014',grant_id:'04100000-0000-4000-a000-000000000015',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={identity,prompt:'synthetic first message',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true};
 await createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>({content:[{kind:'text',text:'DISK-REOPEN-SYNTHETIC-ANSWER'}],stop:'complete',usage:{inputTokens:7,outputTokens:3}})}).run(input);
 const source=`import assert from 'node:assert/strict';import {createPiSessionOpenAnalysisRuntime} from ${JSON.stringify(new URL('../../../adapters/agent-pi/open-analysis.ts',import.meta.url).href)};import {createApprovedProviderCredentials} from ${JSON.stringify(new URL('../../../adapters/agent-pi/provider-credentials.ts',import.meta.url).href)};import {createLocalAnalysisRequestLedger} from ${JSON.stringify(new URL('../../../adapters/storage-local/analysis-request-ledger.ts',import.meta.url).href)};const root=${JSON.stringify(root)},identity=${JSON.stringify(identity)};let called=0;await createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{called++;assert.ok(request.messages.some(m=>m.text.includes('DISK-REOPEN-SYNTHETIC-ANSWER')));return {content:[{kind:'text',text:'continued'}],stop:'complete',usage:{inputTokens:9,outputTokens:4}};}}).run({identity,prompt:'explicit continuation',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true});assert.equal(called,1);`;
 execFileSync(process.execPath,['--input-type=module','-e',source],{timeout:10000,stdio:'pipe'});
 assert.equal(createLocalAnalysisRequestLedger({projectRoot:root}).read(identity.task_id).length,2);
 const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{const v=JSON.parse(String(db.prepare('SELECT body FROM budgets WHERE task_id=?').get(identity.task_id)?.body));assert.equal(v.usage.inputTokens,16);assert.equal(v.usage.outputTokens,7);assert.equal(v.usage.modelCalls,2);assert.equal(v.usage.reservedOutputTokens,0);}finally{db.close();}
});

test('SDK041-04 actual persistent ledger corruption prevents subsequent tool effects and successful publication',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-corrupt-gate-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');let effects=0,calls=0;
 const identity={task_id:'04100000-0000-4000-a000-000000000021',revision:'1',run_id:'04100000-0000-4000-a000-000000000022',attempt_id:'04100000-0000-4000-a000-000000000023',operation_id:'04100000-0000-4000-a000-000000000024',grant_id:'04100000-0000-4000-a000-000000000025',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;const db=new DatabaseSync(join(root,'.xanthil','desktop','pi-runtime.sqlite'));try{db.prepare('UPDATE budgets SET body=? WHERE task_id=?').run('{}',identity.task_id);}finally{db.close();}return {content:[{kind:'tool',id:'must-not-execute',name:'analysis_tool',arguments:{name:'synthetic_effect',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}};}});
 await assert.rejects(runtime.run({identity,prompt:'synthetic',system:'scope',tools:[{name:'synthetic_effect',description:'owned fixture',parameters:{type:'object',properties:{}},execute:async()=>{effects++;return {};}}],signal:new AbortController().signal,authorize:()=>true}),{code:'STATE_FAILED'});assert.equal(effects,0);assert.equal(calls,1);
});

test('SDK041-NEG01: persistent audit failure stops the production Adapter before a physical request',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-audit-fail-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');const state=createPersistentRuntimeState({projectRoot:root});state.readAudit('synthetic');const db=new DatabaseSync(join(root,'.xanthil/desktop/pi-runtime.sqlite'));db.exec("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON audit BEGIN SELECT RAISE(FAIL,'synthetic audit unavailable'); END");db.close();let calls=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return {content:[{kind:'text',text:'must not publish'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}}),identity={task_id:'04100000-0000-4000-a000-000000000111',revision:'1',run_id:'04100000-0000-4000-a000-000000000112',attempt_id:'04100000-0000-4000-a000-000000000113',operation_id:'04100000-0000-4000-a000-000000000114',grant_id:'04100000-0000-4000-a000-000000000115',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 await assert.rejects(runtime.run({identity,prompt:'synthetic',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true}));assert.equal(calls,0);
});
test('SDK041-NEG02: approved model timeout fences a physically pending request and refuses a parallel retry or late publication',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-timeout-'));const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');let calls=0,finish!:()=>void;const gate=new Promise<void>(r=>finish=r),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;await gate;return {content:[{kind:'text',text:'late'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}}),identity={task_id:'04100000-0000-4000-a000-000000000121',revision:'1',run_id:'04100000-0000-4000-a000-000000000122',attempt_id:'04100000-0000-4000-a000-000000000123',operation_id:'04100000-0000-4000-a000-000000000124',grant_id:'04100000-0000-4000-a000-000000000125',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},input={identity,prompt:'synthetic timeout',system:'scope',tools:[],signal:new AbortController().signal,authorize:()=>true};
 let timeout:ReturnType<typeof setTimeout>|undefined;const running=runtime.run(input);try{await assert.rejects(Promise.race([running,new Promise<never>((_,reject)=>timeout=setTimeout(()=>reject(Object.assign(new Error('CALLER_STILL_BLOCKED'),{code:'CALLER_STILL_BLOCKED'})),35000))]),{code:'DEADLINE_EXCEEDED'});assert.equal(calls,1);assert.ok(ledger.pending!().length);await assert.rejects(runtime.run(input),{code:'TASK_BUSY'});}finally{if(timeout)clearTimeout(timeout);finish();await running.catch(()=>{});await runtime.collect!(identity.task_id);}assert.equal(calls,1);assert.equal(ledger.read(identity.task_id)[0].publishable,false);assert.equal(ledger.read(identity.task_id)[0].status,'cancelled');
});


test('SDK041-NEG03: native JSONL save failure refuses the production tool effect and publication',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'native-save-failure-'));
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts');
 const {createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts');
 const {createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts');
 let calls=0,effects=0;
 const identity={task_id:'04100000-0000-4000-a000-000000000051',revision:'1',run_id:'04100000-0000-4000-a000-000000000052',attempt_id:'04100000-0000-4000-a000-000000000053',operation_id:'04100000-0000-4000-a000-000000000054',grant_id:'04100000-0000-4000-a000-000000000055',scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{
  calls++;
  if(calls===1)return {content:[{kind:'text',text:'synthetic saved history'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};
  const directory=join(root,'.xanthil','desktop','pi-sessions');
  const entry=readdirSync(directory,{recursive:true,withFileTypes:true}).find(e=>e.isFile()&&e.name.endsWith('.jsonl'));
  assert.ok(entry,'actual native file must exist before injecting a write failure');
  const file=join(entry.parentPath,entry.name);renameSync(file,file+'.preserved');mkdirSync(file);
  return {content:[{kind:'tool',id:'save-fault-call',name:'analysis_tool',arguments:{name:'effect',arguments_json:'{}'}}],stop:'tools',usage:{inputTokens:3,outputTokens:4}};
 }});
 const input={identity,prompt:'synthetic first',system:'synthetic scope',tools:[{name:'effect',description:'Synthetic read effect',parameters:{type:'object' as const,properties:{}},execute:async()=>{effects++;return {value:1};}}],signal:new AbortController().signal,authorize:()=>true};
 await runtime.run(input);
 await assert.rejects(runtime.run({...input,prompt:'synthetic next'}));
 assert.equal(calls,2);assert.equal(effects,0,'unsaved native model reply cannot cause a business tool effect');
});


test('V13-MIGRATE132 explicit idle configuration migration preserves unknown reserves, usage and old/new link across restart',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'report-config-migration-')),state=createPersistentRuntimeState({projectRoot:root});
 const limits={cumulative:'unlimited' as const,maxOutputTokens:4096,modelTimeoutMs:30000,toolTimeoutMs:60000,controlTimeoutMs:10000};
 const lease=await state.budgets.claimUncapped('task-a','run-old','a'.repeat(64),limits);await lease.reserveModelUpTo!(4096);await lease.reserveTool(1);await lease.release(20);
 const before=state.readAccounting('task-a')!;
 const crypto=await import('node:crypto');const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const input={task:'task-a',from:'a'.repeat(64),to:'b'.repeat(64),expectedAccounting:hash(before),approval:'c'.repeat(64),reconciliation:'d'.repeat(64)};
 const migrate=Reflect.get(state,'migrateConfiguration');assert.equal(typeof migrate,'function','explicit migration is required; claim must not silently change configuration');
 migrate(input);const next=createPersistentRuntimeState({projectRoot:root}).readAccounting('task-a')!;
 assert.deepEqual(next.usage,before.usage);assert.deepEqual(next.reservations,before.reservations);assert.equal(next.owner,null);assert.equal(next.configuration,input.to);
 assert.deepEqual(next.configurationHistory?.[0],{from:input.from,to:input.to,approval:input.approval,reconciliation:input.reconciliation,accounting:input.expectedAccounting});
 await assert.rejects(state.budgets.claimUncapped('task-a','run-stale',input.from,limits),{reason:'CONFIGURATION_CHANGED'});
 const resumed=await state.budgets.claimUncapped('task-a','run-new',input.to,limits);assert.deepEqual(resumed.snapshot(),before.usage);await resumed.release(0);
});

for(const mode of ['busy','stale','wrong-source','same-target','bad-approval'] as const)test(`V13-MIGRATE132 ${mode}: reject migration atomically without clearing history`,async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'report-config-migration-denied-')),state=createPersistentRuntimeState({projectRoot:root});
 const limits={cumulative:'unlimited' as const,maxOutputTokens:4096,modelTimeoutMs:30000,toolTimeoutMs:60000,controlTimeoutMs:10000};
 const lease=await state.budgets.claimUncapped('task-a','run-old','a'.repeat(64),limits);await lease.reserveModelUpTo!(4096);if(mode!=='busy')await lease.release(1);
 const before=state.readAccounting('task-a')!,crypto=await import('node:crypto'),hash=crypto.createHash('sha256').update(JSON.stringify(before)).digest('hex');
 const input={task:'task-a',from:mode==='wrong-source'?'e'.repeat(64):'a'.repeat(64),to:mode==='same-target'?'a'.repeat(64):'b'.repeat(64),expectedAccounting:mode==='stale'?'f'.repeat(64):hash,approval:mode==='bad-approval'?'missing':'c'.repeat(64),reconciliation:'d'.repeat(64)};
 const migrate=Reflect.get(state,'migrateConfiguration');assert.equal(typeof migrate,'function');assert.throws(()=>migrate(input));assert.deepEqual(state.readAccounting('task-a'),before);if(mode==='busy')await lease.release(0);
});


test('V13-AC133: explicit dead-owner abort handoff preserves accounting, blocks ordinary admission and acknowledges only a native stop',async()=>{
 const {spawnSync}=await import('node:child_process'),{randomUUID,createHash}=await import('node:crypto');
 const root=mkdtempSync(join(browserEvidenceRoot,'interrupted-owner-')),owner=randomUUID(),task=randomUUID();
 const module=new URL('../../../adapters/agent-pi/persistent-runtime-state.ts',import.meta.url).href;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import {createPersistentRuntimeState,approvedUncappedAnalysisLimits} from ${JSON.stringify(module)};const s=createPersistentRuntimeState({projectRoot:${JSON.stringify(root)}});const l=await s.budgets.claimUncapped(${JSON.stringify(task)},${JSON.stringify(owner)},'a'.repeat(64),approvedUncappedAnalysisLimits);await l.reserveModelUpTo(17);await s.sessionStorage(async()=>true).acquireWriter(new AbortController().signal);`],{encoding:'utf8'});
 assert.equal(child.status,0,child.stderr);
 const state=createPersistentRuntimeState({projectRoot:root}),before=state.readAccounting(task)!,hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const stopState=state as typeof state & {readWriterLock():unknown;interruptedAbortLease(input:any):any};
 assert.equal(typeof stopState.interruptedAbortLease,'function','approved dead-owner stop cannot currently reach the installed SDK');
 const lock=stopState.readWriterLock(),recovery=stopState.interruptedAbortLease({businessIdentity:'e'.repeat(64),task,expectedOwner:owner,expectedAccounting:hash(before),expectedLock:hash(lock),approval:'b'.repeat(64),reconciliation:'c'.repeat(64),signal:new AbortController().signal,authorize:()=>true});
 await assert.rejects(state.budgets.claimUncapped(task,randomUUID(),before.configuration,before.limits as any));
 const lease=await recovery.budgets.claimUncapped(task,'native-stop-run',before.configuration,before.limits as any),writer=await recovery.storage.acquireWriter(new AbortController().signal);
 assert.equal(state.readAccounting(task)!.owner,'native-stop-run');assert.deepEqual(state.readAccounting(task)!.reservations,before.reservations);
 assert.equal(state.readAccounting(task)!.usage.activeMs,before.usage.activeMs,'dead-process downtime is not measured active execution');
 assert.equal((state.readAccounting(task) as any).interruptedStops[0].activeTime.status,'unknown');
 await writer.release();await lease.release(0);
 await assert.rejects(state.budgets.claimUncapped(task,randomUUID(),before.configuration,before.limits as any),'pending handoff must not allow normal execution');
 recovery.finish('d'.repeat(64));
 const after=state.readAccounting(task)!;for(const key of ['modelCalls','toolCalls','outputTokens','inputTokens','reservedOutputTokens','resourceUnits'] as const)assert.equal(after.usage[key],before.usage[key]);assert.deepEqual(after.reservations,before.reservations);assert.ok(after.usage.activeMs>=before.usage.activeMs);assert.equal(after.owner,null);
 assert.equal(stopState.readWriterLock(),null);assert.equal((after as any).interruptedStops[0].outcome,'stopped');assert.equal((after as any).interruptedStops[0].owner,owner);
 const resumed=await state.budgets.claimUncapped(task,randomUUID(),before.configuration,before.limits as any);await resumed.release(0);
});


for(const stop of ['cancel','timeout'] as const)test(`READ-CARRIER-004-LATE ${stop}: production persistent budget/audit keeps frozen UNKNOWN and independently acknowledged late read category`,async()=>{
 const {createSessionRuntime,createExecutionTools,RuntimeFault,admitModelRequest}=await import('pi-agent-runtime');const root=mkdtempSync(join(browserEvidenceRoot,'read-carrier-late-')),state=createPersistentRuntimeState({projectRoot:root}),task=(await import('node:crypto')).randomUUID(),source={version:'1.0' as const,sources:[]},identity={task_id:task,revision:'1',run_id:(await import('node:crypto')).randomUUID(),attempt_id:(await import('node:crypto')).randomUUID(),operation_id:(await import('node:crypto')).randomUUID(),grant_id:(await import('node:crypto')).randomUUID(),scope_sha256:(await import('../../../packages/product-core/member-task.ts')).taskHash(source),config_sha256:'b'.repeat(64)},controller=new AbortController(),events:unknown[]=[];let calls=0,reads=0,entered!:()=>void,release!:()=>void;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),model={provider:'synthetic',id:'read-carrier-late',protocol:'openai-completions' as const,endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:64},policy={policyVersion:'synthetic-read-carrier-late',protocolOverheadTokens:512,safetyMarginTokens:8192};const tools=createExecutionTools({cwd:root,policyVersion:'synthetic-read-late',resolvePath:async p=>join(root,p),stat:async p=>({path:p,name:'synthetic.txt',kind:'file' as const,size:1,modifiedAt:0}),read:async()=>{reads++;entered();await gate;throw Object.assign(new RuntimeFault(stop==='cancel'?'CANCELLED':'DEADLINE_EXCEEDED'),stop==='cancel'?{code:'ETIMEDOUT'}:{});},write:async()=>assert.fail(),exec:async()=>assert.fail()},['read']);const runtime=createSessionRuntime({...state,storage:state.sessionStorage(async()=>true),model,modelObservations:'v1',contextAdmission:policy,authorize:async()=>true,reconcile:async()=> 'ready',audit:{append:async(e,s)=>{await state.audit.append(e,s);events.push(e);}},transport:async request=>{admitModelRequest(request,policy);calls++;return {content:[{kind:'tool' as const,id:'late-read',name:'read',arguments:{path:'synthetic.txt'}}],stop:'tools' as const,usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:model.provider,id:model.id,protocol:model.protocol},stop:'tools' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:7},outputTokens:{kind:'known' as const,value:3}},diagnostic:'COMPLETE' as const}};}}),session=await runtime.create();state.selectSession(task,'analysis',session.id);const run=runtime.run({sessionId:session.id,taskId:task,prompt:'synthetic late read only',tools,contextVersions:{scope:identity.scope_sha256,configuration:identity.config_sha256,revision:identity.revision},signal:controller.signal,limits:{cumulative:'unlimited',maxOutputTokens:64,modelTimeoutMs:2000,toolTimeoutMs:stop==='timeout'?20:2000,controlTimeoutMs:2000},modelRecovery:{extraAttempts:1}});await began;if(stop==='cancel')controller.abort();const result=await run,snapshot=JSON.stringify(result),frozen=result.toolOutcomes?.[0];assert.equal(result.status==='succeeded'?undefined:result.reason,stop==='cancel'?'CANCELLED':'DEADLINE_EXCEEDED');assert.equal(frozen?.status,'unknown');assert.equal(frozen?.modelOutput,'pending');assert.equal(frozen?.failureCategory,undefined);assert.equal(state.readAudit(task).filter(e=>e.kind==='tool.finished').length,0);release();await runtime.waitForIdle(task);assert.equal(JSON.stringify(result),snapshot);const late=createPersistentRuntimeState({projectRoot:root}).readAudit(task).findLast(e=>e.kind==='tool.finished')!.toolOutcome!;assert.equal(late.failureCategory,stop==='cancel'?'cancelled':'timeout');assert.equal(late.status,'unknown');assert.equal(late.modelOutput,'failed');assert.deepEqual(late.invocation,frozen?.invocation);assert.equal(calls,1);assert.equal(reads,1);assert.equal(result.usage.inputTokens,7);assert.equal(result.usage.outputTokens,3);assert.equal(result.usage.toolCalls,1);
 const {createPiSessionOpenAnalysisRuntime}=await import('../../../adapters/agent-pi/open-analysis.ts'),{createLocalAnalysisRequestLedger}=await import('../../../adapters/storage-local/analysis-request-ledger.ts'),{createApprovedProviderCredentials}=await import('../../../adapters/agent-pi/provider-credentials.ts'),{createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts'),{openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const consumer=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger:createLocalAnalysisRequestLedger({projectRoot:root}),credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>assert.fail('late readback must not dispatch')}),diagnostics=consumer.readDiagnostics!(identity),observation=diagnostics.observations.find(o=>o.kind==='tool');assert.ok(observation&&observation.kind==='tool');assert.equal(observation.after_stop,true,'actual nested stopped reason must survive diagnostics');assert.equal(observation.file_failure_category,stop==='cancel'?'cancelled':'timeout');const store=createLocalOpenAnalysisStore({projectRoot:root});store.create({identity,question:'合成迟到read确认事实',source});const taskView=store.read(task)!,view=openTaskView(taskView,[],diagnostics),html=renderQuickAnalysisWorkbench({project:'合成迟到核对',tasks:[{id:task,title:view.title}],current:view,detail:'execution',drawer:true,mode:'quick',stage:'analysis',readonly:true});assert.ok(html.includes('停止后的确认事实，不发布或退款'));assert.equal(calls,1);assert.equal(reads,1);

});

for(const mode of ['matched','plain','invocation','name','effect','resource','audit-fault'] as const)test(`READ-CARRIER-004-CARRIER ${mode}: actual installed SDK and production audit preserve only trusted matching receipts/categories`,async()=>{
 const {createSessionRuntime,ToolOutputFailure,RuntimeFault}=await import('pi-agent-runtime');const root=mkdtempSync(join(browserEvidenceRoot,'read-carrier-matching-')),state=createPersistentRuntimeState({projectRoot:root}),task='synthetic-carrier-'+mode;let calls=0,effects=0;const model={provider:'synthetic',id:'read-matching',protocol:'openai-completions' as const,endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:64},tool={name:'read',effect:'read' as const,description:'synthetic receipt boundary',parameters:{type:'object'},resourceUnits:1,execute:async(_args:unknown,_signal:AbortSignal,invocation?:import('pi-agent-runtime').ToolExecutionContext)=>{effects++;if(mode==='plain')throw Object.assign(Error('SYNTHETIC_PRIVATE_DETAIL'),{code:'not_found',failureCategory:'not_found',outcome:{status:'completed',receiptId:'forged'}});throw new ToolOutputFailure({name:mode==='name'?'other':'read',effect:mode==='effect'?'write':'read',status:'completed',modelOutput:'failed',resourceUnits:mode==='resource'?3:1,failureCategory:'permission_denied',receiptId:'synthetic-receipt',...(invocation?{invocation:{...invocation,invocationId:mode==='invocation'?'other':invocation.invocationId}}:{})});}};const runtime=createSessionRuntime({...state,storage:state.sessionStorage(async()=>true),model,modelObservations:'v1',authorize:async()=>true,reconcile:async()=> 'ready',transport:async()=>{calls++;return {content:[{kind:'tool' as const,id:'one-read',name:'read',arguments:{}}],stop:'tools' as const,usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:model.provider,id:model.id,protocol:model.protocol},stop:'tools' as const,physicalStatus:'response-received' as const,usageFinal:true,usage:{inputTokens:{kind:'known' as const,value:7},outputTokens:{kind:'known' as const,value:3}},diagnostic:'COMPLETE' as const}};}}),session=await runtime.create();state.selectSession(task,'analysis',session.id);if(mode==='audit-fault'){const db=new DatabaseSync(join(root,'.xanthil/desktop/pi-runtime.sqlite'));db.exec("CREATE TRIGGER deny_tool_ack BEFORE INSERT ON audit WHEN json_extract(NEW.body,'$.kind')='tool.finished' BEGIN SELECT RAISE(ABORT,'synthetic audit fault'); END");db.close();}const result=await runtime.run({sessionId:session.id,taskId:task,prompt:'synthetic category and receipt only',tools:[tool],limits:{cumulative:'unlimited',maxOutputTokens:64,modelTimeoutMs:2000,toolTimeoutMs:2000,controlTimeoutMs:2000},modelRecovery:{extraAttempts:1}});await runtime.waitForIdle(task);assert.notEqual(result.status,'succeeded');assert.equal(calls,1);assert.equal(effects,1);assert.equal(result.usage.inputTokens,7);assert.equal(result.usage.outputTokens,3);const out=result.toolOutcomes?.[0],audit=createPersistentRuntimeState({projectRoot:root}).readAudit(task);if(mode==='matched'||mode==='audit-fault'){assert.equal(out?.failureCategory,'permission_denied');assert.equal(out?.status,'completed');assert.equal(out?.receiptId,'synthetic-receipt');if(mode==='matched')assert.equal(audit.findLast(e=>e.kind==='tool.finished')?.toolOutcome?.failureCategory,'permission_denied');else{assert.equal(result.status==='succeeded'?undefined:result.reason,'AUDIT_FAILED');assert.equal(audit.filter(e=>e.kind==='tool.finished').length,0);}}else{assert.equal(out?.failureCategory,undefined);assert.equal(out?.status,'unknown');assert.equal(out?.receiptId,undefined);}assert.ok(!JSON.stringify(audit).includes('SYNTHETIC_PRIVATE_DETAIL'));
});
