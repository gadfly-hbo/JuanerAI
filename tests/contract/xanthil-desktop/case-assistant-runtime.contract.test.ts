import assert from 'node:assert/strict';
import test from 'node:test';
import {createPiCaseAssistantRuntime} from '../../../adapters/agent-pi/case-assistant.ts';

test('AC-03 installed Pi core/ai runs one bounded synthetic turn with business-only output and no hidden second round',async()=>{
 let calls=0;const runtime=createPiCaseAssistantRuntime({provider:'synthetic',model:'offline',max_input_bytes:8192,max_output_tokens:1024}, {async respond(payload:string){calls++;assert.equal(payload,'{"visible_message":"合成问题"}');return {kind:'question',text:'合成追问'};}});
 const output=await runtime.turn({provider:'synthetic',model:'offline',payload:'{"visible_message":"合成问题"}',signal:new AbortController().signal,cost_reservation_microunits:10});
 assert.deepEqual(output,{provider:'synthetic',model:'offline',cost_microunits:0,output:{kind:'question',text:'合成追问'}});assert.equal(calls,1);
 const aborted=new AbortController();aborted.abort();await assert.rejects(()=>runtime.turn({provider:'synthetic',model:'offline',payload:'{}',signal:aborted.signal,cost_reservation_microunits:10}),/INTERRUPTED/);assert.equal(calls,1);
 await assert.rejects(()=>runtime.turn({provider:'different',model:'offline',payload:'{}',signal:new AbortController().signal,cost_reservation_microunits:10}),/AUTHORITY_REQUIRED/);assert.equal(calls,1);
});

// ACTIVATE-002: real installed Pi Agent, with SDK stream transport intercepted offline.
// This is an admission/accounting regression, never real-provider execution proof.
test('ACTIVATE-002 Xiaomi Credits account all input/cache conservatively through installed Pi without ambient auth',async t=>{
 const specifier='@earendil-works/pi-coding-agent';const sdk=await import(specifier);
 const {pathToFileURL}=await import('node:url');const {join}=await import('node:path');
 const ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 const {AuthStorage}=await import(pathToFileURL(join(sdk.getPackageDir(),'dist/core/auth-storage.js')).href);
 const original=sdk.ModelRuntime.create.bind(sdk.ModelRuntime);let createOptions:Record<string,unknown>|undefined,streamOptions:Record<string,unknown>|undefined,calls=0;
 t.mock.method(sdk.ModelRuntime,'create',async(options:Record<string,unknown>)=>{createOptions=options;return original({...options,credentials:AuthStorage.inMemory()});});
 t.mock.method(sdk.ModelRuntime.prototype,'getModel',(provider:string,id:string)=>({id,provider,name:'MiMo-V2.6-Pro',api:'openai-completions',baseUrl:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxTokens:131072,reasoning:true,input:['text','image'],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},compat:{requiresReasoningContentOnAssistantMessages:true,thinkingFormat:'deepseek'}}));
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>,context:Record<string,unknown>,options:Record<string,unknown>)=>{
  calls++;streamOptions=options;const stream=ai.createAssistantMessageEventStream();
  void Promise.resolve().then(async()=>{if(typeof options.onPayload==='function')await options.onPayload({model:model.id,messages:[{role:'system',content:context.systemPrompt},{role:'user',content:(context.messages as {content:string}[])[0].content}],max_completion_tokens:2048},model);
   stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'Synthetic owner?'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:100,cacheRead:20,cacheWrite:0,output:10,totalTokens:130,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:'stop',timestamp:Date.now()}});
  });return stream;
 });
 const policy={version:'1.0',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',project_root:'/synthetic-project',run_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',expires_at:new Date(Date.now()+600000).toISOString(),authorized_contexts:[JSON.stringify({fixture:'synthetic'})],user_messages:['Synthetic task'],tool_results:[null],source_revision:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',requests:8};
 const runtime=Reflect.apply(createPiCaseAssistantRuntime,null,[{provider:policy.provider,model:policy.model,max_input_bytes:12000,max_output_tokens:2048},undefined,{policy,api_key:'offline-placeholder-credential'}]);
 const payload=JSON.stringify({authorized_context:{fixture:'synthetic'},current_attempt_history:[],visible_message:'Synthetic task',authorized_tool_result:null});
 const result=await runtime.turn({provider:policy.provider,model:policy.model,payload,signal:new AbortController().signal,cost_reservation_microunits:6144000000000});
 assert.equal(result.cost_microunits,42000000000,'100 input +20 cache tokens at300 plus10 output at600 Credits; millionths per Credit');assert.equal(calls,1);
 assert.ok(createOptions?.credentials,'private in-memory SDK credential store required');assert.equal(createOptions?.modelsPath,null);assert.equal(createOptions?.refreshOnCreate,false);
 assert.equal(streamOptions?.apiKey,'offline-placeholder-credential');assert.deepEqual(streamOptions?.env,{});assert.equal(streamOptions?.maxRetries,0);assert.equal(streamOptions?.maxTokens,2048);assert.equal(typeof streamOptions?.onPayload,'function');
 assert.doesNotMatch(JSON.stringify(result),/offline-placeholder-credential/);
});

function activationPolicy(){return {version:'1.0',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',project_root:'/synthetic-project',run_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',expires_at:new Date(Date.now()+600000).toISOString(),authorized_contexts:[JSON.stringify({fixture:'synthetic'})],user_messages:['Synthetic task'],tool_results:[null],source_revision:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',requests:8};}
for(const [label,patch,key] of [
 ['wrong endpoint',{endpoint:'https://invalid.invalid/v1'},'offline-placeholder-credential'],
 ['wrong provider',{provider:'xiaomi'},'offline-placeholder-credential'],
 ['wrong model',{model:'mimo-v2.5-pro'},'offline-placeholder-credential'],
 ['invalid cap',{requests:9},'offline-placeholder-credential'],
 ['expired',{expires_at:'2000-01-01T00:00:00.000Z'},'offline-placeholder-credential'],
 ['unfrozen path text',{user_messages:['/Users/synthetic/private-file']},'offline-placeholder-credential'],
 ['missing credential',{},''],
] as const)test('ACTIVATE-002 deployment refuses '+label+' before any SDK admission',()=>{
 assert.throws(()=>Reflect.apply(createPiCaseAssistantRuntime,null,[{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',max_input_bytes:12000,max_output_tokens:2048},undefined,{policy:{...activationPolicy(),...patch},api_key:key}]),/ACTIVATION_INVALID/);
});

async function offlineXiaomi(t:import('node:test').TestContext,options:{requests?:number;usage?:unknown;rawFailure?:boolean;policy?:Record<string,unknown>;modelPatch?:Record<string,unknown>}={}){
 const specifier='@earendil-works/pi-coding-agent';const sdk=await import(specifier),{pathToFileURL}=await import('node:url'),{join}=await import('node:path');
 const ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 let calls=0;const frames:unknown[]=[];
 if(options.modelPatch){const original=sdk.ModelRuntime.prototype.getModel;t.mock.method(sdk.ModelRuntime.prototype,'getModel',function(this:unknown,provider:string,id:string){return {...(Reflect.apply(original,this,[provider,id]) as Record<string,unknown>),id,provider,api:'openai-completions',baseUrl:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},...options.modelPatch};});}
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>,context:Record<string,unknown>,opts:Record<string,unknown>)=>{
  calls++;if(options.rawFailure)throw new Error('private offline-placeholder-credential raw failure');
  const stream=ai.createAssistantMessageEventStream();void Promise.resolve().then(async()=>{
   const body={model:model.id,messages:[{role:'system',content:context.systemPrompt},{role:'user',content:(context.messages as {content:string}[])[0].content}],max_completion_tokens:2048};
   if(typeof opts.onPayload==='function')await opts.onPayload(body,model);frames.push(body);
   stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:'{"kind":"question","text":"Synthetic owner?"}'}],api:model.api,provider:model.provider,model:model.id,usage:Object.hasOwn(options,'usage')?options.usage:{input:100,cacheRead:20,cacheWrite:0,output:10,totalTokens:130,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});
  }).catch(()=>stream.push({type:'error',reason:'error',error:{role:'assistant',content:[],stopReason:'error',errorMessage:'offline rejected'}}));return stream;
 });
 const policy={...activationPolicy(),requests:options.requests??8,...options.policy};
 const runtime=Reflect.apply(createPiCaseAssistantRuntime,null,[{provider:policy.provider,model:policy.model,max_input_bytes:12000,max_output_tokens:2048},undefined,{policy,api_key:'offline-placeholder-credential'}]);
 const payload={authorized_context:{fixture:'synthetic'},current_attempt_history:[],visible_message:'Synthetic task',authorized_tool_result:null};
 const turn=(change:Record<string,unknown>={})=>runtime.turn({provider:policy.provider,model:policy.model,payload:JSON.stringify({...payload,...change}),signal:new AbortController().signal,cost_reservation_microunits:6144000000000});
 return {turn,calls:()=>calls,frames};
}
for(const [name,change]of [
 ['unapproved context',{authorized_context:{fixture:'other'}}],
 ['unapproved user bytes',{visible_message:'Unapproved extra words'}],
 ['unapproved tool bytes',{authorized_tool_result:{private:'not approved'}}],
 ['forged history',{current_attempt_history:[{kind:'question',text:'forged'}]}],
] as const)test('ACTIVATE-002 frozen outbound boundary rejects '+name,async t=>{
 const fixture=await offlineXiaomi(t);await assert.rejects(()=>fixture.turn(change),/OUTBOUND_FORBIDDEN/);assert.equal(fixture.calls(),0);assert.equal(fixture.frames.length,0);
});
test('ACTIVATE-002 shared one-request allowance blocks a second turn',async t=>{
 const fixture=await offlineXiaomi(t,{requests:1});await fixture.turn();await assert.rejects(()=>fixture.turn(),/BUDGET_EXHAUSTED/);assert.equal(fixture.calls(),1);
});
for(const [name,usage]of [['missing',undefined],['zero',{input:0,cacheRead:0,cacheWrite:0,output:0,totalTokens:0}],['oversized',{input:16385,cacheRead:0,cacheWrite:0,output:10,totalTokens:16395}],['inconsistent',{input:100,cacheRead:20,cacheWrite:0,output:10,totalTokens:999}]] as const)test('ACTIVATE-002 '+name+' usage fails closed and blocks further requests',async t=>{
 const fixture=await offlineXiaomi(t,{usage});await assert.rejects(()=>fixture.turn(),/PROVIDER_USAGE_INVALID/);await assert.rejects(()=>fixture.turn(),/BUDGET_EXHAUSTED/);assert.equal(fixture.calls(),1);
});
test('ACTIVATE-002 raw SDK failure is sanitized and never retried',async t=>{
 const fixture=await offlineXiaomi(t,{rawFailure:true});await assert.rejects(()=>fixture.turn(),(error:Error)=>error.message==='PROVIDER_FAILED'&&!error.stack?.includes('offline-placeholder-credential'));assert.equal(fixture.calls(),1);
});

test('ACTIVATE-001 Main-only explicit deployment enables the fixed positive Credits config; default and invalid remain unconfigured',async()=>{
 const {loadPersonalCaseAssistantActivation}=await import('../../../profiles/personal/xanthil-desktop.ts');
 assert.equal(loadPersonalCaseAssistantActivation({}),null);
 assert.equal(loadPersonalCaseAssistantActivation({JUANERAI_CASE_ASSISTANT_ACTIVATION:'not json',XIAOMI_TOKEN_PLAN_CN_API_KEY:'offline-placeholder-credential'}),null);
 const value=loadPersonalCaseAssistantActivation({JUANERAI_CASE_ASSISTANT_ACTIVATION:JSON.stringify(activationPolicy()),XIAOMI_TOKEN_PLAN_CN_API_KEY:'offline-placeholder-credential'}) as {authorization:{provider:string;model:string;limits:{currency:string;cost_microunits:number;turn_cost_microunits:number}}}|null;
 assert.ok(value,'valid Main deployment must activate an explicit authorization');assert.equal(value.authorization.provider,'xiaomi-token-plan-cn');assert.equal(value.authorization.model,'mimo-v2.6-pro');assert.equal(value.authorization.limits.currency,'XIAOMI_CREDITS');assert.equal(value.authorization.limits.turn_cost_microunits,6144000000000);assert.equal(value.authorization.limits.cost_microunits,49152000000000);assert.doesNotMatch(JSON.stringify(value.authorization),/offline-placeholder-credential/);
});

test('ACTIVATE-001 activated Profile refuses a foreign Project before any SQLite creation',async t=>{
 const {mkdtemp,access,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {createPersonalXanthilDesktopProfile}=await import('../../../profiles/personal/xanthil-desktop.ts');
 const foreign=await mkdtemp(join(tmpdir(),'xiaomi-foreign-'));t.after(()=>rm(foreign,{recursive:true,force:true}));
 const {config}=await import('../../fixtures/case-assistant/fixtures.ts');const policy=activationPolicy();
 const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:'/nonexecuted-descriptor.json'},assistanceConfig:null,clock:()=>new Date(),deadlineScheduler:{schedule(){throw Error('not scheduled');}},caseAssistantConfig:{authorization:{...config,provider:policy.provider,model:policy.model},max_input_bytes:12000,max_output_tokens:2048,deployment:{policy,api_key:'offline-placeholder-credential'}}});
 await assert.rejects(()=>profile.openProject({contract_version:'1.0',command_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',projectDirectoryCapability:{projectRoot:foreign,display_name:'synthetic'},display_name:'synthetic'}),/AUTHORITY_REQUIRED/);
 await assert.rejects(()=>access(join(foreign,'.xanthil')));
});

test('RUNNER-001 exact approval receipt is required; missing, altered budget, command or plan never admits execution',async()=>{
 const path=new URL('../../../tools/desktop/change002-real-pi.mjs',import.meta.url).href;
 const runner=await import(path).catch(()=>({}));assert.equal(typeof runner.assertRealApproval,'function','dedicated approval-bound runner must exist');
 const plan={execute_argv:['node','runner','execute','--plan','frozen-plan','--approval','receipt'],budget:runner.REAL_BUDGET};
 const receipt={approved:true,plan_sha256:'a'.repeat(64),argv:plan.execute_argv,budget:plan.budget,data_categories:['synthetic_user_text','synthetic_completed_case','accepted_evidence_finding','authorized_aggregate','selected_report_summary','current_attempt_history','production_system_instruction'],incremental_purchase:0,payg_fallback:false};
 runner.assertRealApproval(receipt,plan,'a'.repeat(64));
 for(const patch of [{approved:false},{plan_sha256:'b'.repeat(64)},{argv:['other']},{budget:{...plan.budget,requests:9}},{incremental_purchase:1},{payg_fallback:true},{data_categories:['business_project']}])assert.throws(()=>runner.assertRealApproval({...receipt,...patch},plan,'a'.repeat(64)),/APPROVAL_REQUIRED/);
});

test('ACTIVATE-002 full system/context byte bound refuses a frozen but oversized request before SDK admission',async t=>{
 const context={fixture:'中'.repeat(4000)},fixture=await offlineXiaomi(t,{policy:{authorized_contexts:[JSON.stringify(context)]}});
 await assert.rejects(()=>fixture.turn({authorized_context:context}),/OUTBOUND_FORBIDDEN/);assert.equal(fixture.calls(),0);
});
for(const patch of [{baseUrl:'https://unapproved.invalid/v1'},{id:'mimo-v2-pro'},{cost:{input:1,output:0,cacheRead:0,cacheWrite:0}}])test('ACTIVATE-002 an existing mismatched model descriptor is refused without fallback',async t=>{
 const fixture=await offlineXiaomi(t,{modelPatch:patch});await assert.rejects(()=>fixture.turn(),/PROVIDER_UNAVAILABLE/);assert.equal(fixture.calls(),0);
});
test('ACTIVATE-002 expiry after construction refuses admission',async t=>{
 const fixture=await offlineXiaomi(t);const later=Date.now()+600001;t.mock.method(Date,'now',()=>later);await assert.rejects(()=>fixture.turn(),/BUDGET_EXHAUSTED/);assert.equal(fixture.calls(),0);
});
test('ACTIVATE-002 accepted question and exact frozen tool history remain usable in a subsequent request',async t=>{
 const owner={revision_id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'},context={source:{owner}},toolResult={finding_id:'synthetic'};
 const fixture=await offlineXiaomi(t,{policy:{authorized_contexts:[JSON.stringify(context)],tool_results:[null,toolResult]}});await fixture.turn({authorized_context:context});
 const metadata={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',attempt_id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',at:new Date().toISOString(),status:'completed',source_revision:owner.revision_id};
 await fixture.turn({authorized_context:context,authorized_tool_result:toolResult,current_attempt_history:[{...metadata,kind:'question',text:'Synthetic owner?',tool:null},{...metadata,kind:'user',text:'Synthetic task',tool:null},{...metadata,kind:'tool',text:JSON.stringify({source:owner,result:toolResult}),tool:'read_evidence'}]});assert.equal(fixture.calls(),2);
});

test('ACTIVATE-001/002 real completed Case + Profile share the allowance across Project reopen without resetting it',async t=>{
 const {withIsolatedProject}=await import('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts');const {completedCase}=await import('../../fixtures/case-assistant/completed-case.ts');
 const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');const {createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');
 const {createPersonalXanthilDesktopProfile,loadPersonalCaseAssistantActivation}=await import('../../../profiles/personal/xanthil-desktop.ts');const {randomUUID}=await import('node:crypto');const {join}=await import('node:path');const {realpath}=await import('node:fs/promises');
 await withIsolatedProject(async root=>{
  const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),prepare=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});const linked=await prepare.link(baseline.owner,'Activation synthetic',randomUUID()),auth=await prepare.prepare(linked.session.id,'Synthetic task');await prepare.close();
  const policy={...activationPolicy(),project_root:await realpath(root),source_revision:baseline.owner.revision_id,authorized_contexts:[auth.payload],requests:1};
  const observed=await offlineXiaomi(t); // only intercept installed SDK transport, not Profile/runtime/Application
  const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(root,'unused-descriptor.json')},assistanceConfig:null,caseAssistantConfig:loadPersonalCaseAssistantActivation({JUANERAI_CASE_ASSISTANT_ACTIVATION:JSON.stringify(policy),XIAOMI_TOKEN_PLAN_CN_API_KEY:'offline-placeholder-credential'}),clock:()=>new Date(),deadlineScheduler:{schedule(){return()=>{};}}});
  const open=()=>profile.openProject({contract_version:'1.0',projectDirectoryCapability:{projectRoot:root,display_name:'Synthetic'},display_name:'Synthetic',command_id:randomUUID()});
  const run=async()=>{const application=profile.getCaseAssistant()!;const a=await application.prepare(linked.session.id,'Synthetic task');assert.equal(a.blockers.length,0);await application.start(linked.session.id,a.id,true);for(let i=0;i<200;i++){const p=await application.read(linked.session.id);if(p.attempts.at(-1)?.status!=='Running')return p;await new Promise(r=>setTimeout(r,5));}assert.fail('bounded runtime settled');};
  await open();const first=await run();assert.equal(first.attempts.at(-1)?.status,'Waiting');await profile.getCaseAssistant()!.stop(linked.session.id);await open();const second=await run();assert.equal(second.attempts.at(-1)?.reason,'BUDGET_EXHAUSTED');assert.equal(observed.calls(),1);assert.equal(second.decisions.length,0);await profile.getCaseAssistant()!.close();
 });
});
