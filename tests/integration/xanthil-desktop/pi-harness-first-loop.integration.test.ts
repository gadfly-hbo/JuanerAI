import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync,appendFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createPiSessionOpenAnalysisRuntime} from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import type {ModelTransport} from 'pi-agent-runtime';
import * as productAdapter from '../../../adapters/agent-pi/open-analysis.ts';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {Check} from 'typebox/value';
import type {TSchema} from 'typebox';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import {ProviderFailure,ModelFailure,createSessionRuntime,type Tool,type JsonObject} from 'pi-agent-runtime';
import {createLocalOpenAnalysisCodeExecution} from '../../../adapters/analytics-duckdb/open-analysis-code.ts';
import {compileOpenAnalysisIR,executeOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';

const supervisedHostSkip=process.platform==='darwin'&&process.env.JUANERAI_OPEN_CODE_HOST_TEST==='1'
  ?false:'requires macOS and JUANERAI_OPEN_CODE_HOST_TEST=1';

test('FL-H3: physical-attempt boundaries run through the installed SDK and real product Adapter',{timeout:20000},()=>{
  const environment:NodeJS.ProcessEnv={...process.env,JUANERAI_TEST_EVIDENCE_DIR:browserEvidenceRoot};
  delete environment.XANTHIL_REAL_PI_ACCEPTANCE;
  // A fresh child runner must not inherit Node's recursive-run sentinel.
  delete environment.NODE_TEST_CONTEXT;
  const child=spawnSync(process.execPath,['--experimental-test-module-mocks','--test',
    fileURLToPath(new URL('../../fixtures/xanthil-desktop/harness-physical-attempts.mjs',import.meta.url))],
    {cwd:fileURLToPath(new URL('../../../',import.meta.url)),env:environment,encoding:'utf8',timeout:15000});
  const output=child.stdout+'\n'+child.stderr;
  writeFileSync(join(browserEvidenceRoot,'h3-physical-child-'+randomUUID()+'.log'),output);
  assert.equal(child.error,undefined,output);assert.equal(child.status,0,output);
  assert.match(output,/pass 16\b/);assert.match(output,/skipped 0\b/);
});

test('FL-A02/A04: the delivered batch barrier rejects a later invalid evidence call before any business executor',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-batch-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  let requests=0,effects=0;
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',nativeObjectArguments:true,
    credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(request):Promise<import('pi-agent-runtime').ModelReply>=>{
      requests++;
      if(requests>2)throw new Error('hidden dispatch after structural correction exhausted');
      return {content:[
        {kind:'tool',id:'inspect-'+requests,name:'inspect_selected',arguments:{}},
        {kind:'tool',id:'evidence-'+requests,name:'read_analysis_evidence',arguments:{required_plans:[{sheet_id:'secret-unapproved-value'}]}},
      ] satisfies import('pi-agent-runtime').ModelContent[],stop:'tools',usage:{inputTokens:3,outputTokens:2}};
    }});
  const id=identity();let failure:unknown;
  await runtime.run({identity:id,nativeBusinessTools:true,recoverInvalidArguments:true,
    prompt:'Synthetic batch; no business data',system:'Use only supplied tools',signal:new AbortController().signal,authorize:()=>true,
    tools:[{name:'inspect_selected',description:'Synthetic inspection',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {inspected:true};}},
      {name:'read_analysis_evidence',description:'Synthetic complete evidence contract',parameters:{type:'object',properties:{required_plans:{type:'array',items:{type:'object',properties:{sheet_id:{type:'string'},group_by:{anyOf:[{type:'string'},{type:'null'}]}},required:['sheet_id','group_by'],additionalProperties:false}}},required:['required_plans'],additionalProperties:false},execute:async()=>{effects++;return {};}}],
  }).catch(error=>{failure=error;});
  assert.equal(effects,0,'a structurally invalid batch must never enter its otherwise valid first executor');
  assert.equal(requests,2,'one structural correction, then a real shared stop');
  assert.ok(failure,'exhaustion cannot be reported as a successful business run');
  const state=createPersistentRuntimeState({projectRoot:root}),events=state.readAudit(id.task_id);
  const admissions=events.filter(e=>e.kind==='tool.prepared');
  assert.equal(admissions.length,4);
  assert.deepEqual(admissions.map(e=>e.toolAdmission?.disposition),['deferred','rejected','deferred','rejected']);
  assert.equal(state.readAccounting(id.task_id)!.usage.toolCalls,0);
  assert.equal(JSON.stringify(events).includes('secret-unapproved-value'),false);
  assert.equal(runtime.readDiagnostics!(id).last_run?.code,'REQUEST_REJECTED','a known pre-effect rejection is not an UNKNOWN effect');
});

test('FL-A06: product snapshot consumes passive facts, preserves bytes and reports corrupt tails without repair',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-passive-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',
    credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{calls++;return {content:[{kind:'text',text:'Synthetic only'}],stop:'complete',usage:{inputTokens:2,outputTokens:2}};}});
  const id=identity(),signal=new AbortController().signal;
  await runtime.run({identity:id,prompt:'No tools',system:'Synthetic',tools:[],signal,authorize:()=>true});
  const files=readdirSync(root,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl')).map(f=>join(root,f));
  assert.ok(files.length);
  const before=files.map(f=>readFileSync(f)),state=createPersistentRuntimeState({projectRoot:root});
  const audit=state.readAudit(id.task_id),rows=ledger.read(id.task_id);
  const result=await runtime.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>true});
  assert.equal(result.facts?.availability,'available');
  assert.deepEqual(state.readAudit(id.task_id),audit,'passive fact reads must not append audit or acquire a writer');
  assert.deepEqual(ledger.read(id.task_id),rows);
  files.forEach((f,i)=>assert.deepEqual(readFileSync(f),before[i]));
  appendFileSync(files[0]!, '\n{"synthetic_broken_tail":');
  const broken=readFileSync(files[0]!);
  const corrupt=await runtime.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>true});
  assert.equal(corrupt.facts?.availability,'corrupt');
  assert.deepEqual(readFileSync(files[0]!),broken,'a read must not repair the native tail');
  assert.equal(calls,1);
});

test('FL-A05/A06: reopening passive facts cannot replace the fixed tool registry for a later authorized turn',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-passive-reopen-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
  const options={projectRoot:root,ledger,firstLoop:'v0.2' as const,credentials:createApprovedProviderCredentials({environment:{}}),
    modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{calls++;return calls===1?{content:[{kind:'tool',id:'first-inspection',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}}:{content:[{kind:'text',text:'Synthetic settled turn'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}};
  const id=identity(),input={identity:id,prompt:'Synthetic same Task',system:'No external effects',signal:new AbortController().signal,authorize:()=>true,
    tools:[{name:'inspect_selected',description:'Synthetic fixed inspection',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;return {inspected:true};}}]};
  await createPiSessionOpenAnalysisRuntime(options).run(input);
  const reopened=createPiSessionOpenAnalysisRuntime(options);
  const snapshot=await reopened.sessionControl!({identity:id,command:{kind:'snapshot'},signal:input.signal,authorize:()=>true});
  assert.equal(snapshot.facts?.availability,'available');assert.equal(calls,2);
  await reopened.run(input);assert.equal(calls,3);assert.equal(effects,1,'the already completed effect is never replayed');
});

test('FL-A12: attempting opt-in on a consumed legacy Task cannot add a new Session owner or recovery attempt',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-no-migration-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
  const options={projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{calls++;return {content:[{kind:'text',text:'Synthetic legacy Task'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}};
  const id=identity(),input={identity:id,nativeBusinessTools:true,prompt:'Synthetic legacy protocol',system:'No effects',tools:[],signal:new AbortController().signal,authorize:()=>true};
  await createPiSessionOpenAnalysisRuntime(options).run(input);
  const state=createPersistentRuntimeState({projectRoot:root}),before=state.readAudit(id.task_id);
  assert.ok(state.readSession(id.task_id,'analysis_native'));assert.equal(state.readSession(id.task_id,'analysis_objects'),undefined);
  await assert.rejects(()=>createPiSessionOpenAnalysisRuntime({...options,firstLoop:'v0.2'}).run(input),{code:'CONFIGURATION_CHANGED'});
  assert.equal(state.readSession(id.task_id,'analysis_objects'),undefined,'rejection must precede a new-contract Session selection');
  assert.deepEqual(state.readAudit(id.task_id),before,'legacy recovery/abort is not part of this opt-in attempt');assert.equal(calls,1);
});

test('FL-A12: opt-in session controls cannot fork, navigate or stop a legacy Task',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-legacy-control-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0;
  const options={projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{calls++;return {content:[{kind:'text',text:'Synthetic legacy control boundary'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};}};
  const id=identity(),signal=new AbortController().signal;
  await createPiSessionOpenAnalysisRuntime(options).run({identity:id,nativeBusinessTools:true,prompt:'Synthetic legacy Task',system:'No effects',tools:[],signal,authorize:()=>true});
  const snapshot=(directory:string):unknown=>readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).map(entry=>[entry.name,entry.isDirectory()?snapshot(join(directory,entry.name)):createHash('sha256').update(readFileSync(join(directory,entry.name))).digest('hex')]);
  const before=snapshot(root),runtime=createPiSessionOpenAnalysisRuntime({...options,firstLoop:'v0.2'});
  const facts=await runtime.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>true});
  assert.equal(facts.facts?.availability,'available');
  for(const command of [{kind:'fork'},{kind:'navigate',entryId:randomUUID(),summarize:false},{kind:'abort'},{kind:'steer',text:'Synthetic next input'},{kind:'followUp',text:'Synthetic follow-up'},{kind:'nextRun',text:'Synthetic next run'},{kind:'cancelQueued',entryId:randomUUID()}] as const){
    await assert.rejects(()=>runtime.sessionControl!({identity:id,command,signal,authorize:()=>true}),{code:'CONFIGURATION_CHANGED'});
    assert.deepEqual(snapshot(root),before,'legacy storage must stay byte-identical before any mutating control');
  }
  assert.equal(calls,1);
});

test('FL-A12: the opt-in runtime does not expose legacy migration or private recovery as a new-task capability',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-no-recovery-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}})});
  const input={identity:identity(),signal:new AbortController().signal,authorize:()=>true,approval:'a'.repeat(64),expectedAccounting:'b'.repeat(64),expectedLedger:'c'.repeat(64)};
  await assert.rejects(()=>runtime.migrateReportThinking(input),{code:'CAPABILITY_UNAVAILABLE'});
  await assert.rejects(()=>runtime.recoverCancelledReport({...input,target:{session:'synthetic',branch:'main',operation:'synthetic'},provePhysicalStop:()=>null}),{code:'CAPABILITY_UNAVAILABLE'});
  await assert.rejects(()=>runtime.recoverInterruptedStop({...input,expectedLock:'d'.repeat(64),arguments:{step_id:'synthetic'},provePreExecution:()=>null}),{code:'CAPABILITY_UNAVAILABLE'});
  assert.equal(await runtime.reconcileStopped!({identity:input.identity,signal:input.signal,authorize:input.authorize}),false);
});

test('FL-A03: native interpretation is local, strict evidence and leading zeros remain unchanged across a mixed batch',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-policies-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  let calls=0;const accepted:unknown[]=[];
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}}),
    modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{
      calls++;return calls<=2?{content:[{kind:'tool',id:'meaning-'+calls,name:'interpret_meaning',arguments:{sheet_id:1,group_by:null}},
        {kind:'tool',id:'strict-'+calls,name:'read_analysis_evidence',arguments:{sheet_id:calls===1?1:'01',group_by:null}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}}:
        {content:[{kind:'text',text:'Synthetic policies checked'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};
    }});
  const parameters={type:'object',properties:{sheet_id:{type:'string',enum:['1','01']},group_by:{anyOf:[{type:'string'},{type:'null'}]}},required:['sheet_id','group_by'],additionalProperties:false};
  const id=identity();await runtime.run({identity:id,prompt:'Synthetic policy',system:'No data inference',signal:new AbortController().signal,authorize:()=>true,
    tools:['interpret_meaning','read_analysis_evidence'].map(name=>({name,description:'Synthetic policy '+name,parameters,execute:async args=>{accepted.push({name,args});return {checked:true};}}))});
  assert.deepEqual(accepted,[{name:'interpret_meaning',args:{sheet_id:'1',group_by:null}},{name:'read_analysis_evidence',args:{sheet_id:'01',group_by:null}}]);
  const facts=createPersistentRuntimeState({projectRoot:root}).readAudit(id.task_id).flatMap(e=>e.toolAdmission?[e.toolAdmission]:[]);
  assert.deepEqual(facts.slice(0,2).map(f=>f.disposition),['deferred','rejected']);
  assert.equal(facts[0]!.correctionsUsed,0);assert.equal(calls,3);
});

test('FL-A05: a stopped correction stays terminal after reopen and native Fork without a hidden request',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-terminal-fork-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,effects=0;
  const options={projectRoot:root,ledger,firstLoop:'v0.2' as const,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{
    calls++;if(calls>2)throw Error('hidden request');return {content:[{kind:'tool',id:'bad-'+calls,name:'read_analysis_evidence',arguments:{}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}};
  }};
  const id=identity(),signal=new AbortController().signal,input={identity:id,prompt:'Synthetic terminal',system:'No effects',signal,authorize:()=>true,
    tools:[{name:'read_analysis_evidence',description:'Synthetic required field',parameters:{type:'object',properties:{group_by:{type:'null'}},required:['group_by'],additionalProperties:false},execute:async()=>{effects++;return {};}}]};
  await assert.rejects(()=>createPiSessionOpenAnalysisRuntime(options).run(input),{code:'INVALID_TOOL'});
  const reopened=createPiSessionOpenAnalysisRuntime(options);
  await reopened.sessionControl!({identity:id,command:{kind:'fork'},signal,authorize:()=>true});
  const snapshot=await reopened.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>true});
  assert.equal(snapshot.facts?.availability,'available');
  if(snapshot.facts?.availability==='available'){assert.equal(snapshot.facts.admission.availability,'known');if(snapshot.facts.admission.availability==='known')assert.equal(snapshot.facts.admission.terminal,true);}
  await assert.rejects(()=>reopened.run(input),{code:'INVALID_TOOL'});
  assert.equal(calls,2);assert.equal(effects,0);
  assert.equal(createPersistentRuntimeState({projectRoot:root}).readAccounting(id.task_id)!.usage.modelCalls,2);
});

test('FL-A06: the active product exposes busy facts without writer acquisition or model dispatch',{timeout:5000},async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-busy-facts-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  let enter!:()=>void,release!:()=>void,calls=0;
  const entered=new Promise<void>(r=>enter=r),gate=new Promise<void>(r=>release=r);
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async()=>{
    calls++;enter();await gate;return {content:[{kind:'text' as const,text:'Synthetic settled'}],stop:'complete' as const,usage:{inputTokens:1,outputTokens:1}};
  }});
  const id=identity(),signal=new AbortController().signal,pending=runtime.run({identity:id,prompt:'Synthetic active readback',system:'No effects',signal,authorize:()=>true,tools:[]});
  await entered;
  try{const state=createPersistentRuntimeState({projectRoot:root}),before=state.readAudit(id.task_id);
    const result=await runtime.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>true});
    assert.equal(result.facts?.availability,'busy');assert.equal(result.view,undefined);assert.equal(calls,1);assert.deepEqual(state.readAudit(id.task_id),before);
    await assert.rejects(()=>runtime.sessionControl!({identity:id,command:{kind:'snapshot'},signal,authorize:()=>false}),{code:'AUTHORITY_REQUIRED'});
  }finally{release();await pending;}
});

for(const scenario of ['hook','stale-view','upper-bound'] as const)test('FL-A02/A03: same installed SDK and product audit reject '+scenario+' before effects',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-sdk-boundary-')),state=createPersistentRuntimeState({projectRoot:root});
  let calls=0,effects=0,version='phase-1';
  const tools:Tool[]=['first','second'].map(name=>({name,description:'Synthetic '+name,effect:'write',resourceUnits:1,executionMode:'sequential',
    parameters:{type:'object',properties:{value:{type:'string',enum:['A']}},required:['value'],additionalProperties:false},execute:async()=>{effects++;return {};}}));
  const runtime=createSessionRuntime({model:{provider:'minimax-cn',id:'MiniMax-M3',protocol:'anthropic-messages',endpoint:'https://api.minimaxi.com/anthropic',contextWindow:200000,maxOutputTokens:32768},
    transport:async()=>{calls++;if(scenario==='stale-view')version='phase-2';return {content:[{kind:'tool',id:'boundary-first',name:'first',arguments:{value:'A'}},{kind:'tool',id:'boundary-second',name:'second',arguments:{value:scenario==='upper-bound'?'B':'A'}}],stop:'tools',usage:{inputTokens:1,outputTokens:1}};},
    budgets:state.budgets,audit:state.audit,storage:state.sessionStorage(async()=>true),bindOperation:state.bindOperation,reconcile:async()=> 'ready',authorize:async()=>true,
    harness:{extensionVersion:'synthetic-boundaries-v1'},
    extensions:scenario==='hook'?{beforeTool:async input=>input.name==='second'?{arguments:{value:'secret-hook-replacement'}}:undefined}:{},
    toolAdmission:{policyVersion:'synthetic-boundaries-v1',correctionLimit:0,view:async()=>({version,tools:tools.map(t=>({name:t.name,parameters:scenario==='upper-bound'?{type:'object',properties:{value:{type:'string',enum:['A','B']}},required:['value'],additionalProperties:false}:t.parameters}))})},
  });
  const session=await runtime.create(),taskId=randomUUID();
  state.selectSession(taskId,'analysis',session.id);
  const result=await runtime.run({sessionId:session.id,taskId,prompt:'Synthetic boundary',tools,
    contextVersions:{scope:'a'.repeat(64),configuration:'b'.repeat(64),revision:'1'},
    limits:{cumulative:'unlimited',maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000}});
  assert.equal(result.status,'failed');assert.equal(effects,0);assert.equal(calls,1);
  assert.equal(state.readAccounting(taskId)!.usage.toolCalls,0);
  assert.equal(JSON.stringify(state.readAudit(taskId)).includes('secret-hook-replacement'),false);
  assert.ok(result.toolAdmissions?.some(f=>f.disposition==='rejected'));
});

test('FL-A09: the same persistent native loop writes, edits and reads the complete draft before its business consumer',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-native-program-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,consumed='';
  const expected='# synthetic section\n'.repeat(350)+'value=10\n';
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',
    credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async():Promise<import('pi-agent-runtime').ModelReply>=>{
      calls++;assert.ok(calls<=5);
      const content:import('pi-agent-runtime').ModelReply['content']=calls===1?[{kind:'tool',id:'write',name:'write',arguments:{path:'draft/analysis.py',content:'# PLACEHOLDER\n'}}]
        :calls===2?[{kind:'tool',id:'edit',name:'edit',arguments:{path:'draft/analysis.py',edits:[{oldText:'# PLACEHOLDER\n',newText:expected}]}}]
        :calls===3?[{kind:'tool',id:'read',name:'read',arguments:{path:'draft/analysis.py'}}]
        :calls===4?[{kind:'tool',id:'calculate',name:'calculate_and_verify',arguments:{code_path:'draft/analysis.py'}}]
        :[{kind:'text',text:'Synthetic consumer finished'}];
      return {content,stop:calls<5?'tools':'complete',usage:{inputTokens:3,outputTokens:3}};
    }});
  const id=identity();await runtime.run({identity:id,prompt:'Build a synthetic bounded draft',system:'No shell',signal:new AbortController().signal,authorize:()=>true,
    tools:[{name:'calculate_and_verify',description:'Consume the complete program',parameters:{type:'object',properties:{code_path:{type:'string',enum:['draft/analysis.py']}},required:['code_path'],additionalProperties:false},execute:async(args,signal)=>{const draft=await runtime.readCodeDraft!({task_id:id.task_id,path:String(args.code_path),signal});consumed=draft.code;return {complete_program_sha256:draft.code_sha256};}}]});
  assert.equal(consumed,expected);assert.equal(calls,5);
  const events=createPersistentRuntimeState({projectRoot:root}).readAudit(id.task_id);
  assert.deepEqual(events.filter(e=>e.kind==='tool.admitted').map(e=>e.toolName),['write','edit','read','calculate_and_verify']);
  await assert.rejects(()=>runtime.readCodeDraft!({task_id:id.task_id,path:'draft/analysis.py',signal:new AbortController().signal}));
});

test('FL-A02/A10: a proposal stage cannot expose draft writes from its fixed Task upper bound',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-proposal-view-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let names:string[]=[];
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
    names=request.messages.flatMap(m=>m.tools??[]).map(t=>t.name);
    return {content:[{kind:'text',text:'Synthetic proposal only'}],stop:'complete',usage:{inputTokens:1,outputTokens:1}};
  }});
  const tool=(name:string)=>({name,description:'Synthetic '+name,parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>({})});
  await runtime.run({purpose:'proposal_prepare',identity:identity(),prompt:'Prepare, do not calculate',system:'Synthetic',signal:new AbortController().signal,authorize:()=>true,
    capabilityTools:[tool('inspect_selected'),tool('calculate_and_verify')],tools:[tool('inspect_selected')]});
  assert.ok(names.includes('inspect_selected'));for(const name of ['write','edit','calculate_and_verify'])assert.equal(names.includes(name),false,name+' is not granted by the proposal stage');
});

test('FL-A11/A16: actual Browser workspace consumes full schemas, native preparation, code, independent verification, save and reopen',{timeout:20000,skip:supervisedHostSkip},async()=>{
  const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts');
  const {createMemberSourceInspector}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
  const {createLocalOpenAnalysisStore}=await import('../../../adapters/storage-local/open-analysis.ts');
  const {startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts');
  const {createQuickAnalysisClient,openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs');
  const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-product-')),id=randomUUID(),sid=randomUUID();
  const captured:unknown[]=[],contractCycle:{call:number;name:string;schema:unknown}[]=[];let calls=0;
  const program='# complete synthetic program\n'.repeat(350)+
    'x=json.load(open(SOURCES[0]))\nrows=x["inspection"]["sources"][0]["sheets"][0]["rows"][1:]\n'+
    'values=[int(next(c["value"] for c in row["cells"] if c["column"]=="A")) for row in rows]\n'+
    'json.dump({"value":str(sum(values)),"rows":len(rows)},open(os.path.join(OUTPUT,"result.json"),"w"))\n';
  const createRuntime=(ledger:ReturnType<typeof createLocalAnalysisRequestLedger>)=>{const native=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',
    credentials:createApprovedProviderCredentials({environment:{}}),
    r1r4:{contextAdmission:{policyVersion:'synthetic-joint-first-loop-v02',protocolOverheadTokens:512,safetyMarginTokens:8192}},
    modelTransport:async(request):Promise<import('pi-agent-runtime').ModelReply>=>{
      calls++;captured.push(request.messages);
      if([6,12,13,15].includes(calls))for(const tool of request.messages.flatMap(m=>m.tools??[]))if(['read_analysis_evidence','calculate_and_verify'].includes(tool.name))contractCycle.push({call:calls,name:tool.name,schema:tool.parameters});
      let content:import('pi-agent-runtime').ModelReply['content'],stop:import('pi-agent-runtime').ModelReply['stop']='tools';
      const proposal:JsonObject={version:'1.1',goal:'Synthetic quantity sum',source_id:sid,sheet_id:'csv',operation:'sum',column:'A',unit:'items',group_by:null,filters:[]};
      const call=(name:string,args:JsonObject)=>[{kind:'tool' as const,id:'joint-'+calls,name,arguments:args}];
      if(calls===1)content=call('inspect_selected',{});
      else if(calls===2)content=call('describe_business',{purpose:'Synthetic quantity sum',object:'Selected quantity records',scope:'Only the selected CSV',deliverables:['Independently verified sum'],hypotheses:[],unknowns:[],execution_scope:[{source_id:sid,sheet_id:'csv',filters:[]}]});
      else if(calls===3)content=call('interpret_meaning',{interpretations:[{dimension:'unit',value:'items',status:'clear',unscaled_unit:{input_label:'items',output_label:'items'},evidence:[{source:{source_id:sid,sheet_id:'csv',row:'1',column:'A'}}]}],conflicts:[]});
      else if(calls===4)content=call('set_framework',{goal:'Synthetic quantity sum',source_id:sid,sheet_id:'csv',operation:'sum',column:'A',unit:'items',group_mode:'none',filters:[]});
      else if(calls===5)content=call('read_tool_contract',{name:'read_analysis_evidence'});
      else if(calls===6){const {group_by,...missing}=proposal;void group_by;content=call('read_analysis_evidence',{required_plans:[missing]});}
      else if(calls===7)content=call('read_analysis_evidence',{required_plans:[proposal]});
      else if(calls===8)content=call('write',{path:'draft/analysis.py',content:'# FINAL_PROGRAM\n'});
      else if(calls===9)content=call('edit',{path:'draft/analysis.py',edits:[{oldText:'# FINAL_PROGRAM\n',newText:program}]});
      else if(calls===10)content=call('read',{path:'draft/analysis.py'});
      else if(calls===11)content=call('read_tool_contract',{name:'calculate_and_verify'});
      else if(calls===12)content=call('read_tool_contract',{name:'read_analysis_evidence'});
      else if(calls===13)content=call('read_analysis_evidence',{required_plans:[proposal]});
      else if(calls===14)content=call('read_tool_contract',{name:'calculate_and_verify'});
      else if(calls===15)content=call('calculate_and_verify',{code_path:'draft/analysis.py'});
      else {
        stop='complete';
        const message=request.messages.findLast(m=>m.text.includes('JuanerAI.report-edit.v1\n'))?.text;
        if(message){const data=JSON.parse(message.slice(message.indexOf('JuanerAI.report-edit.v1\n')+'JuanerAI.report-edit.v1\n'.length));content=[{kind:'text',text:JSON.stringify({version:'1.5',status:'ready',interpretations:[{fact_refs:[data.numeric_facts[0].reference_id],interpretation:'Synthetic quantities do not establish business causes.'}]})}];}
        else content=[{kind:'text',text:'The selected quantity sum is 10, independently verified; no business cause or action is established.'}];
      }
      if(calls>18)throw Error('Unexpected product dispatch');
      return {content,stop,usage:{inputTokens:7,outputTokens:3},outcome:{model:request.model,stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};
    }});
    const run=native.run;return {...native,run:async(input:Parameters<typeof run>[0])=>{
      const nonJson:string[]=[];const scan=(v:unknown,path:string):void=>{if(v===undefined||typeof v==='function'||typeof v==='symbol'){nonJson.push(path+':'+typeof v);return;}if(v&&typeof v==='object'){if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype)nonJson.push(path+':prototype');for(const [k,x]of Object.entries(v))scan(x,path+'/'+k);}};
      for(const tool of input.capabilityTools??input.tools)scan(tool.parameters,tool.name);
      writeFileSync(join(root,'joint-product-contracts.json'),JSON.stringify({nonJson,tools:input.tools.map(({execute,modelResult,...t})=>t),upper:input.capabilityTools?.map(({execute,modelResult,...t})=>t)}));
      return run(input);
    }};
  };
  const options={projectRoot:root,project_id:randomUUID(),requireSemanticAssessment:true,
    toolchain:{pythonExecutable:'/opt/homebrew/bin/python3',pythonVersion:'3.14.4'},
    inspect:createMemberSourceInspector('/opt/homebrew/bin/python3'),authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),createRuntime};
  let open=createPersonalOpenAnalysisWorkspace(options),server:Awaited<ReturnType<typeof startBrowserMembershipServer>>|undefined;
  try{
    server=await startBrowserMembershipServer({store:{} as never,workspace:{} as never,open});
    const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})});
    assert.equal(boot.status,200);const cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control;
    const client=createQuickAnalysisClient({control,request:(path,init)=>fetch(server!.origin+String(path),{...init,headers:{...init?.headers,cookie,origin:server!.origin}})});
    const command={version:'1.0',command_id:id,question:'Compute the sum of the selected quantity. The unit is items.',confirmed:true,sources:[{source_id:sid,display_name:'synthetic.csv',format:'csv',base64:Buffer.from('quantity\n7\n3\n').toString('base64')}]};
    const submit=(headers:Record<string,string>)=>fetch(server!.origin+'/v1/open-analysis',{method:'POST',headers:{origin:server!.origin,'content-type':'application/json',cookie,...headers},body:JSON.stringify(command)});
    assert.equal((await submit({})).status,403);assert.equal((await submit({'x-xanthil-control':control,'sec-fetch-site':'cross-site'})).status,403);assert.equal(calls,0);
    assert.equal((await submit({'x-xanthil-control':control})).status,200);
    await open.collect();const task=open.read(id),state=createPersistentRuntimeState({projectRoot:root});
    writeFileSync(join(root,'joint-product-before-assertions.json'),JSON.stringify({task,calls,captured,contractCycle,audit:state.readAudit(id),accounting:state.readAccounting(id)}));
    const evidenceFirst=contractCycle.find(c=>c.call===6&&c.name==='read_analysis_evidence');
    const calculationFirst=contractCycle.find(c=>c.call===12&&c.name==='calculate_and_verify');
    const evidenceReturned=contractCycle.find(c=>c.call===13&&c.name==='read_analysis_evidence');
    const calculationReturned=contractCycle.find(c=>c.call===15&&c.name==='calculate_and_verify');
    assert.ok(evidenceFirst&&calculationFirst,'both large actual Application contracts must be disclosed');
    assert.ok(Buffer.byteLength(JSON.stringify(evidenceFirst.schema))>8192&&Buffer.byteLength(JSON.stringify(calculationFirst.schema))>8192);
    assert.ok(evidenceReturned,'B-FL-FOCUS-01: repeat disclosure must focus evidence after evidence -> calculation -> evidence');
    assert.deepEqual(evidenceReturned.schema,evidenceFirst.schema,'repeat disclosure preserves the complete actual schema');
    assert.deepEqual(calculationReturned?.schema,calculationFirst.schema);
    assert.equal(contractCycle.some(c=>c.call===13&&c.name==='calculate_and_verify'),false,'focus does not expose all large schemas');
    assert.equal(state.readAudit(id).filter(e=>e.toolName==='read_analysis_evidence'&&e.toolOutcome?.status==='completed').length,2,'both legal evidence calls execute exactly once');
    assert.equal(task.state,'saved');assert.equal(task.outcome!.calculation.value,'10');
    assert.equal(task.outcome!.verification.grade,'independent_arithmetic');
    const codeRoot=join(root,'.juanerai','open-code'),admissions=readdirSync(codeRoot).filter(f=>/^[a-f0-9-]{36}\.json$/.test(f));
    assert.equal(admissions.length,1);const admission=JSON.parse(readFileSync(join(codeRoot,admissions[0]!),'utf8'));
    assert.equal(admission.code_sha256,createHash('sha256').update(program).digest('hex'));
    assert.equal(JSON.parse(readFileSync(join(codeRoot,admission.execution_id+'.qualified.json'),'utf8')).status,'qualified');
    assert.ok(Buffer.byteLength(program)>4096&&Buffer.byteLength(program)<=65536);
    assert.deepEqual(createLocalOpenAnalysisStore({projectRoot:root}).read(id),task);
    assert.ok(state.readAudit(id).some(e=>e.toolAdmission?.name==='read_analysis_evidence'&&e.toolAdmission.disposition==='rejected'));
    assert.ok(state.readAudit(id).some(e=>e.toolName==='edit'&&e.toolOutcome?.status==='completed'));
    assert.ok(captured.some(messages=>JSON.stringify(messages).includes('GOAL_COMPLETION_REVIEW')));
    const http=await client.read(id),diagnostics=await client.diagnostics(id),view=openTaskView(http,[],diagnostics);
    const html=renderQuickAnalysisWorkbench({project:'Synthetic first loop',tasks:[{id,title:view.title}],current:view,detail:'execution',drawer:true,mode:'quick',stage:'analysis',readonly:true});
    assert.ok(http.outcome);assert.equal(http.outcome.calculation.value,'10');assert.ok(html.includes('10'));
    assert.ok(html.includes('参数未通过，本次未执行'),'UI must consume the actual pre-effect rejection separately from execution');
    const snapshot=await client.sessionControl(id,task.identity.revision,{kind:'snapshot'});
    assert.equal(snapshot.facts?.availability,'available');
    writeFileSync(join(root,'joint-product-http-ui.json'),JSON.stringify({http,diagnostics,view}));writeFileSync(join(root,'joint-product-ui.html'),html);
    const count=calls;await server.close();server=undefined;await open.close();open=createPersonalOpenAnalysisWorkspace(options);
    assert.deepEqual(open.read(id).outcome,task.outcome);assert.equal(calls,count,'reopening a saved product must not dispatch a model');
    const reopened=await open.sessionControl(id,{version:'1.0',expected_revision:task.identity.revision,command:{kind:'snapshot'}});assert.equal(reopened.facts?.availability,'available');assert.equal(calls,count);
  }finally{await server?.close();await open.close();}
});

const identity = () => ({task_id:randomUUID(), revision:'1', run_id:randomUUID(),
  attempt_id:randomUUID(), operation_id:randomUUID(), grant_id:randomUUID(),
  scope_sha256:'a'.repeat(64), config_sha256:'b'.repeat(64)});

test('FL-A14: the isolated new-task consumer uses the approved output and runtime limits in the actual installed Session', async () => {
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-limits-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});
  let calls=0;
  let observed:Parameters<ModelTransport>[0]|undefined;
  const transport:ModelTransport=async request => {
    calls++;
    observed=request;
    return {content:[{kind:'text',text:'x'.repeat(5001)}],stop:'complete',usage:{inputTokens:7,outputTokens:5001}};
  };
  const config={projectRoot:root,ledger,credentials:createApprovedProviderCredentials({environment:{}}),
    modelTransport:transport,firstLoop:'v0.2' as const};
  const runtime=createPiSessionOpenAnalysisRuntime(config), id=identity();
  let failure:unknown;
  const result=await runtime.run({identity:id,prompt:'Synthetic configuration only',system:'No business effects',
    tools:[],signal:new AbortController().signal,authorize:()=>true}).catch(error=>{failure=error;return undefined;});
  assert.ok(observed,'the real installed SDK must reach the transport');
  assert.equal(observed.model.id,'MiniMax-M3');
  assert.equal(observed.model.maxOutputTokens,32768);
  assert.equal(observed.maxOutputTokens,32768);
  if(failure)throw failure;
  assert.ok(result);
  assert.equal(result.text.length,5001);
  assert.equal(calls,1);
  const accounting=createPersistentRuntimeState({projectRoot:root}).readAccounting(id.task_id)!;
  assert.deepEqual(accounting.limits,{cumulative:'unlimited',maxOutputTokens:32768,
    modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000});
  assert.equal(accounting.usage.reservedOutputTokens,0);
  assert.equal(accounting.usage.outputTokens,5001);
  assert.equal(ledger.pending!().length,0);
});

test('FL-A14/R4 preparation: the actual primary and fallback retain routes and enforce 32768/16384 without another retry allowance',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-fallback-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root}),seen:{id:string;cap:number}[]=[];
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',
    credentials:createApprovedProviderCredentials({environment:{}}),
    r1r4:{contextAdmission:{policyVersion:'synthetic-first-loop-v02',protocolOverheadTokens:512,safetyMarginTokens:8192}},
    modelTransport:async request=>{
      seen.push({id:request.model.id,cap:request.maxOutputTokens});
      if(seen.length===1)throw new ProviderFailure('quota',{model:request.model,stop:'error',category:'quota',
        physicalStatus:'response-received',httpStatus:402,usageFinal:true,
        usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'});
      return {content:[{kind:'text',text:'synthetic fallback'}],stop:'complete',usage:{inputTokens:7,outputTokens:3},
        outcome:{model:request.model,stop:'complete',physicalStatus:'response-received',usageFinal:true,
          usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};
    }});
  const id=identity();await runtime.run({identity:id,prompt:'Synthetic fallback',system:'No effects',
    tools:[],signal:new AbortController().signal,authorize:()=>true});
  assert.deepEqual(seen,[{id:'MiniMax-M3',cap:32768},{id:'mimo-v2.6-flash',cap:16384}]);
  assert.equal(ledger.pending!().length,0);
  const state=createPersistentRuntimeState({projectRoot:root});
  assert.equal(state.readAccounting(id.task_id)!.usage.modelCalls,2);
  assert.equal(state.readAccounting(id.task_id)!.usage.reservedOutputTokens,0);
});

test('FL-A14 preparation: an actual model call remains admitted after 61 virtual seconds and the old Task configuration cannot be rebound',async t=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-clock-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root}),credentials=createApprovedProviderCredentials({environment:{}});
  let enter!:()=>void,release!:()=>void,observed:AbortSignal|undefined,calls=0;
  const entered=new Promise<void>(r=>enter=r),gate=new Promise<void>(r=>release=r);
  const modelTransport:ModelTransport=async request=>{calls++;observed=request.signal;enter();await gate;
    return {content:[{kind:'text',text:'synthetic after 61 seconds'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};};
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials,firstLoop:'v0.2',modelTransport});
  t.mock.timers.enable({apis:['setTimeout']});
  const id=identity(),input={identity:id,prompt:'Synthetic virtual clock',system:'No business total deadline applies',
    tools:[],signal:new AbortController().signal,authorize:()=>true};
  const pending=runtime.run(input);await entered;t.mock.timers.tick(61000);
  assert.equal(observed!.aborted,false,'the actual SDK model timer must not retain the old 30/60 second wall');
  release();const result=await pending;assert.equal(result.text,'synthetic after 61 seconds');
  t.mock.timers.reset();
  const legacy=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,credentials,modelTransport});
  await assert.rejects(()=>legacy.run({...input,identity:{...id,operation_id:randomUUID()}}),{code:'CONFIGURATION_CHANGED'});
  assert.equal(calls,1,'old configuration cannot continue the new Task or dispatch a model');
});

test('FL-A14 preparation: the existing SDK total-request timer aborts at 600 seconds and retains unknown usage',{timeout:5000},async t=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-total-timeout-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let enter!:()=>void,calls=0,observed:AbortSignal|undefined;
  const entered=new Promise<void>(r=>enter=r);
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',
    r1r4:{contextAdmission:{policyVersion:'synthetic-first-loop-total-timeout-v02',protocolOverheadTokens:512,safetyMarginTokens:8192}},
    credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
      calls++;observed=request.signal;enter();
      return await new Promise<never>((_resolve,reject)=>request.signal.addEventListener('abort',()=>reject(new ModelFailure({
        model:request.model,stop:'cancelled',physicalStatus:'unknown',usageFinal:false,
        usage:{inputTokens:{kind:'unknown'},outputTokens:{kind:'unknown'}},diagnostic:'CANCELLED',
      })),{once:true}));
    }});
  t.mock.timers.enable({apis:['setTimeout']});
  const id=identity(),pending=runtime.run({identity:id,prompt:'Synthetic total timeout',system:'No earlier total business deadline',
    tools:[],signal:new AbortController().signal,authorize:()=>true});
  const failed=assert.rejects(pending,{code:'DEADLINE_EXCEEDED'});
  await entered;t.mock.timers.tick(599999);assert.equal(observed!.aborted,false);
  t.mock.timers.tick(1);await failed;assert.equal(observed!.aborted,true);assert.equal(calls,1);
  const usage=createPersistentRuntimeState({projectRoot:root}).readAccounting(id.task_id)!.usage;
  assert.equal(usage.reservedOutputTokens,32768,'an unknown timed-out request is not refunded');
});

test('FL-A14/A15 preparation: the existing SDK tool hard wall is 300 seconds and cannot erase a started effect',{timeout:5000},async t=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-tool-timeout-'));
  const ledger=createLocalAnalysisRequestLedger({projectRoot:root});let enter!:()=>void,calls=0,started=0,toolSignal:AbortSignal|undefined;
  const entered=new Promise<void>(r=>enter=r);
  const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,firstLoop:'v0.2',nativeObjectArguments:true,
    credentials:createApprovedProviderCredentials({environment:{}}),
    r1r4:{contextAdmission:{policyVersion:'synthetic-first-loop-tool-timeout-v02',protocolOverheadTokens:512,safetyMarginTokens:8192}},
    modelTransport:async request=>{
      calls++;return {content:[{kind:'tool',id:'one-started-effect',name:'calculate_and_verify',arguments:{}}],stop:'tools',
        usage:{inputTokens:7,outputTokens:2},outcome:{model:request.model,stop:'tools',physicalStatus:'response-received',
          usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:2}},diagnostic:'COMPLETE'}};
    }});
  t.mock.timers.enable({apis:['setTimeout']});
  const id=identity(),pending=runtime.run({identity:id,nativeBusinessTools:true,prompt:'Synthetic tool hard timeout',system:'No replay',
    signal:new AbortController().signal,authorize:()=>true,tools:[{name:'calculate_and_verify',description:'Synthetic started effect',
      parameters:{type:'object',properties:{},additionalProperties:false},execute:async(_args,signal)=>{
        started++;toolSignal=signal;enter();return await new Promise<never>((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('SYNTHETIC_UNCONFIRMED_EFFECT')),{once:true}));
      }}]});
  const failed=assert.rejects(pending,{code:'DEADLINE_EXCEEDED'});
  await entered;t.mock.timers.tick(299999);assert.equal(toolSignal!.aborted,false);
  t.mock.timers.tick(1);await failed;
  assert.equal(toolSignal!.aborted,true);assert.equal(started,1);assert.equal(calls,1);
  assert.equal(runtime.hasUnconfirmedEffects!(id.task_id),true);
  assert.equal(createPersistentRuntimeState({projectRoot:root}).readAudit(id.task_id).findLast(e=>e.toolOutcome)?.toolOutcome?.status,'unknown');
});

test('FL-A09/A10 preparation: real native write/edit/read finalize a bounded run-local program before supervised calculation and independent verification',{skip:supervisedHostSkip},async()=>{
  const create=Reflect.get(productAdapter,'createAnalysisCodeDraft');
  assert.equal(typeof create,'function','the product needs the restricted native draft consumer');
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-draft-'));
  let authorized=false;
  const controller=new AbortController();
  const draft=create({cwd:root,signal:controller.signal,authorize:()=>authorized}) as {
    tools:readonly Tool[];readProgram:()=>Readonly<{code:string;code_sha256:string}>;
  };
  const call=(name:string,args:JsonObject)=>draft.tools.find(t=>t.name===name)!.execute(args,controller.signal);
  await assert.rejects(()=>call('write',{path:'draft/analysis.py',content:'denied'}));
  assert.throws(()=>draft.readProgram());
  assert.deepEqual(readdirSync(root),[],'no business file is created by a denied draft');
  authorized=true;
  await call('write',{path:'draft/analysis.py',content:'# BUILD_INPUT\n# BUILD_RESULT\n'});
  await call('edit',{path:'draft/analysis.py',edits:[{oldText:'# BUILD_INPUT',newText:
    '# input section\n'.repeat(350)+'x=json.load(open(SOURCES[0]))\nrows=x["inspection"]["sources"][0]["sheets"][0]["rows"][1:]'}]});
  assert.deepEqual(readdirSync(root),[],'native draft edits are run-local and never execute a payload');
  await call('edit',{path:'draft/analysis.py',edits:[{oldText:'# BUILD_RESULT',newText:
    '# result section\n'.repeat(350)+'values=[int(next(c["value"] for c in row["cells"] if c["column"]=="A")) for row in rows]\njson.dump({"value":str(sum(values)),"rows":len(rows)},open(os.path.join(OUTPUT,"result.json"),"w"))'}]});
  await call('read',{path:'draft/analysis.py'});
  const program=draft.readProgram();
  assert.ok(Buffer.byteLength(program.code)>4096);
  assert.ok(Buffer.byteLength(program.code)<=65536);
  assert.doesNotMatch(program.code,/# BUILD_/);
  assert.deepEqual(readdirSync(root),[]);
  const sourceId=randomUUID(),inspection:MemberSourceInspection={version:'1.0',sources:[{
    source_id:sourceId,display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'8',
    sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[
      {row:1,cells:[{column:'A',type:'string',value:'quantity'}]},
      {row:2,cells:[{column:'A',type:'number',value:'7'}]},
      {row:3,cells:[{column:'A',type:'number',value:'3'}]},
    ]}],
  }]};
  const id={...identity(),scope_sha256:taskHash(inspection)};
  const plan=compileOpenAnalysisIR({version:'1.1',goal:'Synthetic quantity sum',source_id:sourceId,
    sheet_id:'csv',operation:'sum',column:'A',unit:'items',group_by:null,filters:[]},inspection);
  const execute=createLocalOpenAnalysisCodeExecution({projectRoot:root,pythonExecutable:'/opt/homebrew/bin/python3',pythonVersion:'3.14.4'});
  const executed=await execute({identity:id,plan,inspection,code:program.code,signal:controller.signal});
  const calculation=executeOpenAnalysisIR(plan,inspection);
  const verification=verifyOpenAnalysisIntegerSum(plan,calculation,inspection);
  assert.deepEqual(executed.value,{value:'10',rows:2});
  assert.equal(verification.value,'10');
  await execute.qualify!({identity:id,plan,inspection,calculation,verification,receipt:executed.receipt});
  authorized=false;
  assert.throws(()=>draft.readProgram());
  await assert.rejects(()=>call('write',{path:'draft/analysis.py',content:'late denied'}));
});

test('FL-A02/A03 preparation: actual Application evidence contracts retain complete nested required fields and their executor association', async () => {
  const capture=Reflect.get(productAdapter,'captureAnalysisToolContracts');
  assert.equal(typeof capture,'function','the Adapter must capture the actual trusted product contracts');
  const sourceId=randomUUID(),secondSourceId=randomUUID();
  const inspection:MemberSourceInspection={version:'1.0',sources:[sourceId,secondSourceId].map(source_id=>({source_id,
    display_name:'synthetic.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'20',
    sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[
      {row:1,cells:[{column:'A',type:'string',value:'amount'},{column:'B',type:'string',value:'region'}]},
      {row:2,cells:[{column:'A',type:'number',value:'7'},{column:'B',type:'string',value:'north'}]},
    ]}]}))};
  const id={...identity(),scope_sha256:taskHash(inspection)};
  let observed=0;
  const app=createOpenAnalysisApplication({agentLed:true,isAuthorized:()=>true,
    loadSelectedSource:async()=>inspection,
    saveFramework:async()=>assert.fail('capturing contracts cannot bind a framework'),
    saveOutcome:async()=>assert.fail('capturing contracts cannot save an Outcome'),
    verify:async()=>assert.fail('capturing contracts cannot verify numbers'),
    saveClarification:async()=>({saved:true,...id}),
    runtime:{run:async input=>{
      observed++;
      const contracts=capture(input.tools,true) as readonly (typeof input.tools[number]&{
        contract_sha256:string;argument_policy:'strict-v1'|'native-pi-v1';
      })[];
      assert.deepEqual(contracts.map(t=>t.name),input.tools.map(t=>t.name));
      for(const tool of contracts){
        assert.equal(tool.execute,input.tools.find(t=>t.name===tool.name)!.execute);
        assert.equal(tool.argument_policy,tool.name==='interpret_meaning'?'native-pi-v1':'strict-v1');
        assert.match(tool.contract_sha256,/^[a-f0-9]{64}$/);
        assert.ok(Object.isFrozen(tool.parameters));
      }
      const evidence=contracts.find(t=>t.name==='read_analysis_evidence')!;
      const proposal={version:'1.3',goal:'synthetic union',combination:'union_all',operation:'sum',
        unit:'items',numeric_mode:'integer',inputs:[sourceId,secondSourceId].map(source_id=>({source_id,sheet_id:'csv',column:'A',group_by:null,filters:[]}))};
      assert.equal(Check(evidence.parameters as TSchema,{required_plans:[proposal]}),true);
      const missing=structuredClone(proposal) as Record<string,unknown>;
      Reflect.deleteProperty((missing.inputs as Record<string,unknown>[])[0]!,'group_by');
      assert.equal(Check(evidence.parameters as TSchema,{required_plans:[missing]}),false);
      assert.equal(Check(evidence.parameters as TSchema,{required_plans:[{...proposal,extra:'not permitted'}]}),false);
      const question=contracts.find(t=>t.name==='ask_user')!;
      await question.execute({text:'Synthetic contract preparation only'},input.signal);
      return {text:'',tools:[]};
    }},
  });
  const result=await app.run({identity:id,question:'Inspect contracts without execution',signal:new AbortController().signal});
  assert.equal(result.state,'waiting');
  assert.equal(observed,1);
});

test('FL-A02 preparation: trusted snapshots preserve the exact schema, policy, executor and separate model derivation without mutation',()=>{
  const execute=async()=>({observed:true});
  const parameters={type:'object',properties:{sheet_id:{type:'string',enum:['01']}},required:['sheet_id'],additionalProperties:false};
  const modelParameters=structuredClone(parameters);
  const tools=[{name:'interpret_meaning',description:'Synthetic exact source choices',parameters,modelParameters,execute}];
  const legacy=productAdapter.captureAnalysisToolContracts(tools);
  const approved=productAdapter.captureAnalysisToolContracts(tools,true);
  assert.equal(legacy[0]!.argument_policy,'strict-v1');
  assert.equal(approved[0]!.argument_policy,'native-pi-v1');
  assert.notEqual(legacy[0]!.contract_sha256,approved[0]!.contract_sha256);
  assert.equal(approved[0]!.execute,execute);
  assert.deepEqual(approved[0]!.parameters,parameters);
  parameters.properties.sheet_id.enum.push('02');
  assert.deepEqual(Reflect.get(approved[0]!.parameters,'properties').sheet_id.enum,['01']);
  assert.notEqual(productAdapter.captureAnalysisToolContracts(tools,true)[0]!.contract_sha256,approved[0]!.contract_sha256);
  assert.throws(()=>productAdapter.captureAnalysisToolContracts([tools[0]!,tools[0]!],true),{code:'TOOL_POLICY_VIOLATION'});
});

test('FL-A09/A10 preparation: cancellation, revocation, traversal and oversize writes preserve the earlier draft and never create a business file',async()=>{
  const root=mkdtempSync(join(browserEvidenceRoot,'first-loop-draft-gates-'));
  const controller=new AbortController();let authorized=true;
  const draft=productAdapter.createAnalysisCodeDraft({cwd:root,signal:controller.signal,authorize:()=>authorized});
  const write=draft.tools.find(t=>t.name==='write')!;
  await write.execute({path:'draft/analysis.py',content:'valid = 7\n'},controller.signal);
  const before=draft.readProgram();
  await assert.rejects(()=>write.execute({path:'../escape.py',content:'escape'},controller.signal));
  await assert.rejects(()=>write.execute({path:'draft/analysis.py',content:'x'.repeat(65537)},controller.signal));
  assert.deepEqual(draft.readProgram(),before);
  authorized=false;await assert.rejects(()=>write.execute({path:'draft/analysis.py',content:'revoked'},controller.signal));
  authorized=true;assert.deepEqual(draft.readProgram(),before);
  controller.abort();await assert.rejects(()=>write.execute({path:'draft/analysis.py',content:'cancelled'},controller.signal));
  assert.throws(()=>draft.readProgram());
  const next=productAdapter.createAnalysisCodeDraft({cwd:root,signal:new AbortController().signal,authorize:()=>true});
  assert.throws(()=>next.readProgram(),'another run cannot silently restore an old draft');
  assert.deepEqual(readdirSync(root),[]);
});
