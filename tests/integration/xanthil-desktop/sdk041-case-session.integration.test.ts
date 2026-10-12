import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import * as native from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import type {ModelTransport} from 'pi-agent-runtime';
test('SDK041-FIX02 new retained membership calls use native sessions and the authoritative task ledger without private Pi',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-retained-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const create=Reflect.get(native,'createPiSessionCaseRuntime');assert.equal(typeof create,'function','retained production consumer must support shared Task authority');
 const transport:ModelTransport=async request=>{calls++;assert.equal(request.model.id,'mimo-v2.6-pro');return {content:[{kind:'text',text:JSON.stringify({kind:'question',text:'请补充期间'})}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};};
 const runtime=create({projectRoot:root,ledger,credential:()=>assert.fail('controlled offline transport cannot read credentials'),modelTransport:transport});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const policy={version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'existing synthetic permission',max_input_bytes:12000,call_output_tokens:2048,call_ms:30000,process_seconds:10};
 const payload={version:'2.0',stage:'clarify',source_set_sha256:null,selected_text:'解释会员变化',structure:[],semantics:null,result:null,diagnostic:null};
 for(let i=0;i<2;i++){
  const operation=randomUUID(),context={task_id:identity.task_id,operation_id:operation,execution_id:randomUUID(),epoch:0};
  const result=await runtime.membershipTurn({version:'2.0',context,policy,payload,signal:new AbortController().signal,runtime_authority:{identity:{...identity,run_id:context.execution_id,attempt_id:context.execution_id,operation_id:operation,scope_sha256:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),config_sha256:createHash('sha256').update(JSON.stringify(policy)).digest('hex')},authorize:()=>true,previous_calls:0}});
  assert.equal(result.usage.input_tokens.value,'5','each turn must meter only its own physical requests');assert.equal(result.usage.output_tokens.value,'3');assert.equal(result.output.text,'请补充期间');assert.equal(runtime.describeMembershipOutcome(result).physical_status,'settled');
 }
 assert.equal(calls,2);assert.equal(ledger.read(identity.task_id).length,2);assert.ok(ledger.read(identity.task_id).every(r=>r.model==='mimo-v2.6-pro'&&r.status==='succeeded'));
 assert.ok(createPersistentRuntimeState({projectRoot:root}).readSession(identity.task_id,'retained_case'));
});

test('SDK041-FIX02 foreign membership Task authority is rejected before any physical request',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-foreign-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=native.createPiSessionCaseRuntime({projectRoot:root,ledger,credential:()=>assert.fail('no credential read'),modelTransport:async()=>{calls++;throw Error('must not dispatch');}});
 const execution=randomUUID(),context={task_id:randomUUID(),operation_id:randomUUID(),execution_id:execution,epoch:0};
 const payload={version:'2.0',stage:'clarify',source_set_sha256:null,selected_text:'解释会员变化',structure:[],semantics:null,result:null,diagnostic:null};
 const policy={version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'existing synthetic permission',max_input_bytes:12000,call_output_tokens:2048,call_ms:30000,process_seconds:10};
 const identity={task_id:randomUUID(),revision:'1',run_id:execution,attempt_id:execution,operation_id:context.operation_id,grant_id:randomUUID(),scope_sha256:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),config_sha256:createHash('sha256').update(JSON.stringify(policy)).digest('hex')};
 await assert.rejects(runtime.membershipTurn!({version:'2.0',context,policy,payload,signal:new AbortController().signal,runtime_authority:{identity,authorize:()=>true,previous_calls:0}}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,0);assert.equal(ledger.read(identity.task_id).length,0);
});

import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {config as caseConfig} from '../../fixtures/case-assistant/fixtures.ts';
import {withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
test('SDK041-FIX02 production Case Application advances two native turns on one uncapped Task and preserves physical usage',async()=>withIsolatedProject(async root=>{
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=native.createPiSessionCaseRuntime({projectRoot:root,ledger,credential:()=>assert.fail('no real credentials'),modelTransport:async()=>{calls++;return {content:[{kind:'text',text:JSON.stringify({kind:'question',text:'请补充你的判断'})}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};}});
 const config={...caseConfig,provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',consumption_policy:'uncapped_metered' as const,runtime_version:'0.86.1',adapter_version:'0.4.1',limits:{...caseConfig.limits,turns:1}};
 const app=createCaseAssistantApplication({store,runtime,config,clock:()=>new Date()});
 try{
  const linked=await app.link(baseline.owner,'共享 Case 合成',randomUUID()),id=linked.session.id;
  const auth=await app.prepare(id,'解释当前已核验资料',[],[],false);assert.equal(auth.source.open_origin,undefined);
  await app.start(id,auth.id,true);
  async function wait(turns:number){for(let i=0;i<200;i++){const p=await app.read(id);if(p.attempts.at(-1)?.status==='Waiting'&&p.attempts.at(-1)?.turns===turns)return p;await new Promise(r=>setTimeout(r,5));}assert.fail('Case did not reach expected native question');}
  await wait(1);await app.send(id,'只说明证据支持的事实');const p=await wait(2);
  assert.equal(calls,2);assert.equal(p.attempts.length,1);assert.equal(ledger.read(id).length,2);assert.ok(createPersistentRuntimeState({projectRoot:root}).readSession(id,'retained_case'));
 }finally{await app.close();}
}));

test('SDK041-FIX02 legacy physical UNKNOWN is preserved and rejects a new Session before credential or transport access',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-legacy-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const payload={version:'2.0',stage:'clarify',source_set_sha256:null,selected_text:'synthetic clarification',structure:[],semantics:null,result:null,diagnostic:null};
 const policy={version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'synthetic permission',max_input_bytes:12000,call_output_tokens:2048,call_ms:30000,process_seconds:10};
 const execution=randomUUID(),context={task_id:randomUUID(),operation_id:randomUUID(),execution_id:execution,epoch:0};
 const identity={task_id:context.task_id,revision:'1',run_id:execution,attempt_id:execution,operation_id:context.operation_id,grant_id:randomUUID(),scope_sha256:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),config_sha256:createHash('sha256').update(JSON.stringify(policy)).digest('hex')};
 const reserved=ledger.reserve({...identity,input_sha256:'c'.repeat(64),provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro'});ledger.issue(reserved.request_id);
 ledger.settle(reserved.request_id,{status:'unknown',usage:{input_tokens:{kind:'unknown',reason:'provider_not_reported'},output_tokens:{kind:'unknown',reason:'provider_not_reported'},active_ms:{kind:'known',value:'1'},wait_ms:{kind:'known',value:'0'}}});
 const before=structuredClone(ledger.read(identity.task_id));
 const runtime=native.createPiSessionCaseRuntime({projectRoot:root,ledger,credential:()=>assert.fail('no credential read'),modelTransport:async()=>{calls++;throw Error('must not dispatch');}});
 await assert.rejects(runtime.membershipTurn!({version:'2.0',context,policy,payload,signal:new AbortController().signal,runtime_authority:{identity,authorize:()=>true,previous_calls:1}}),{code:'LEGACY_TASK_RECONCILIATION_REQUIRED'});
 assert.equal(calls,0);assert.deepEqual(ledger.read(identity.task_id),before);assert.equal(createPersistentRuntimeState({projectRoot:root}).readSession(identity.task_id,'retained_case'),undefined);
});

test('SDK041-FIX02 child conversation shares Task usage but cannot observe an unselected parent conversation',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-case-isolation-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});const seen:string[]=[];
 const runtime=native.createPiSessionCaseRuntime({projectRoot:root,ledger,credential:()=>assert.fail('no credential read'),modelTransport:async r=>{seen.push(JSON.stringify(r.messages));return {content:[{kind:'text',text:JSON.stringify({kind:'question',text:'synthetic question'})}],stop:'complete',usage:{inputTokens:5,outputTokens:3}};}});
 const task=randomUUID(),base={task_id:task,revision:'1',grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},parentConversation=task,childConversation=randomUUID();
 for(const [conversation,text] of [[parentConversation,'PARENT_ONLY_DETAIL'],[childConversation,'CHILD_SUBSET_ONLY']] as const){
  const id=randomUUID(),authority={identity:{...base,run_id:id,attempt_id:id,operation_id:randomUUID()},conversation_id:conversation,authorize:()=>true,previous_calls:seen.length};
  await runtime.turn({payload:text,provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',signal:new AbortController().signal,cost_reservation_microunits:1,runtime_authority:authority});
 }
 assert.equal(seen.length,2);assert.ok(seen[0].includes('PARENT_ONLY_DETAIL'));assert.ok(seen[1].includes('CHILD_SUBSET_ONLY'));assert.equal(seen[1].includes('PARENT_ONLY_DETAIL'),false,'a shared budget does not grant parent conversation access');assert.equal(ledger.read(task).length,2);
});


test('SDK041-FIX02 professional auxiliary disclosure uses native sessions and the same ledger across attempts',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-professional-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const create=Reflect.get(native,'createPiSessionDecisionAssistanceRuntime');assert.equal(typeof create,'function');
 const payload={schema_version:'1.0',action_kind:'organize_question',question_text:'Explain member changes',hypothesis_display_title:'',business_context:'Synthetic only',alternative_explanations:[],comparison_period:null,current_period:null,aggregate_columns:['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']};
 const canonical=(await import('../../../packages/product-core/xanthil-desktop-decision-case.ts')).canonicalDesktopJson(payload),digest=createHash('sha256').update(canonical).digest('hex');
 const output={draft_kind:'question_fields',draft_content:{question_text:'Explain member changes',hypothesis_display_title:'',business_context:'Synthetic only',alternative_explanations:[]}};
 const runtime=create({projectRoot:root,ledger,credential:()=>assert.fail('offline must not read credentials'),modelTransport:async(request:Parameters<ModelTransport>[0])=>{calls++;assert.equal(request.model.id,'mimo-v2.6-pro');assert.ok(request.messages.some(m=>m.text.includes('Synthetic only')));return {content:[{kind:'text',text:JSON.stringify(output)}],stop:'complete',usage:{inputTokens:7,outputTokens:4}};}});
 const selected={requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'};
 assert.equal((await runtime.preflightSelection(selected)).runtime_version,'0.86.1');
 const task=randomUUID(),config=createHash('sha256').update(JSON.stringify(selected)).digest('hex');
 for(let i=0;i<2;i++){const attempt=randomUUID();const result=await runtime.executeAssistance({...selected,action_kind:'organize_question',payload_bytes:new TextEncoder().encode(canonical),payload_sha256:digest,cancellation_signal:new AbortController().signal,deadline_seconds:30,runtime_authority:{identity:{task_id:task,revision:randomUUID(),run_id:attempt,attempt_id:attempt,operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:digest,config_sha256:config},authorize:()=>true,previous_calls:i}});assert.deepEqual(result.draft_content,output.draft_content);}
 assert.equal(calls,2);assert.equal(ledger.read(task).length,2);assert.ok(createPersistentRuntimeState({projectRoot:root}).readSession(task,'retained_case'));
 await assert.rejects(runtime.executeAssistance({...selected,action_kind:'organize_question',payload_bytes:new TextEncoder().encode(canonical),payload_sha256:digest,cancellation_signal:new AbortController().signal,deadline_seconds:30}),{code:'AUTHORITY_REQUIRED'});assert.equal(calls,2);
});


test('SDK041-FIX02 professional withdrawn authority and old physical history cannot dispatch or clear accounting',async()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'sdk041-aux-denied-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
 const runtime=native.createPiSessionDecisionAssistanceRuntime({projectRoot:root,ledger,credential:()=>assert.fail('must not read credentials'),modelTransport:async()=>{calls++;throw Error('forbidden transport');}});
 const selected={requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'};await runtime.preflightSelection(selected);
 const identity={task_id:randomUUID(),revision:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)};
 const input={...selected,action_kind:'organize_question' as const,payload_bytes:new Uint8Array(),payload_sha256:'a'.repeat(64),cancellation_signal:new AbortController().signal,deadline_seconds:30};
 await assert.rejects(runtime.executeAssistance({...input,runtime_authority:{identity,authorize:()=>false,previous_calls:0}}),{code:'AUTHORITY_REQUIRED'});
 const old=ledger.reserve({...identity,input_sha256:'c'.repeat(64),provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro'});ledger.issue(old.request_id);const before=ledger.read(identity.task_id);
 await assert.rejects(runtime.executeAssistance({...input,runtime_authority:{identity,authorize:()=>true,previous_calls:1}}),{code:'LEGACY_TASK_RECONCILIATION_REQUIRED'});
 assert.equal(calls,0);assert.deepEqual(ledger.read(identity.task_id),before);assert.equal(createPersistentRuntimeState({projectRoot:root}).hasNativeSession(identity.task_id),false);
});
