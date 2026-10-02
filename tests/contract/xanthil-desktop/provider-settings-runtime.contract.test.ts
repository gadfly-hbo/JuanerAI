import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {probeLocalXiaomi,localConnectionError} from '../../../adapters/agent-pi/xiaomi-local.ts';
import {createPersonalXanthilDesktopProfile} from '../../../profiles/personal/xanthil-desktop.ts';
import {validateDesktopAssistanceDraft} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {createProviderSettings} from '../../../packages/application/provider-settings.ts';
import {withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
test('PS-02 actual installed Pi probe has only fixed text, one bounded request, no tools or ambient auth',async t=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);let calls=0;
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>,context:Record<string,unknown>,opts:Record<string,unknown>)=>{
  calls++;assert.equal(model.baseUrl,'https://token-plan-cn.xiaomimimo.com/v1');assert.equal(model.id,'mimo-v2.6-pro');assert.equal(context.systemPrompt,'');assert.deepEqual(context.tools,[]);assert.equal((context.messages as {content:string}[])[0].content,'Reply with OK.');assert.equal(opts.maxTokens,128);assert.equal(opts.maxRetries,0);assert.deepEqual(opts.env,{});assert.equal(opts.apiKey,'synthetic-test-key');
  const stream=ai.createAssistantMessageEventStream();queueMicrotask(()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:'OK.'}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:2,totalTokens:12,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}}));return stream;
 });
 await probeLocalXiaomi('synthetic-test-key',new AbortController().signal);assert.equal(calls,1);const c=new AbortController();c.abort();await assert.rejects(probeLocalXiaomi('synthetic-test-key',c.signal),/CANCELLED/);assert.equal(calls,1);
});
test('PS-02 installed request builder disables thinking within the fixed 128-token probe cap',async t=>{
 const net=await import('node:net');let sockets=0,calls=0,endpoint='',body:Record<string,unknown>={};
 t.mock.method(net.Socket.prototype,'connect',()=>{sockets++;throw Error('PS_OFFLINE_SOCKET_FORBIDDEN');});
 t.mock.method(globalThis,'fetch',async(url:unknown,options:{body:string})=>{
  calls++;endpoint=String(url);body=JSON.parse(options.body);
  const chunk={id:'synthetic-probe',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:'OK.'},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:2,total_tokens:12}};
  return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 });
 await probeLocalXiaomi('synthetic-builder-key',new AbortController().signal);
 assert.equal(calls,1);assert.equal(sockets,0);assert.equal(endpoint,'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');
 assert.equal(body.model,'mimo-v2.6-pro');assert.equal(body.max_completion_tokens,128);assert.deepEqual(body.thinking,{type:'disabled'});
 assert.equal(body.response_format,undefined);assert.equal(body.tools,undefined);assert.deepEqual(body.messages,[{role:'user',content:'Reply with OK.'}]);
 assert.equal(JSON.stringify(body).includes('synthetic-builder-key'),false);
});
test('PS-04 SDK failure categories are fixed codes and never raw credentials',()=>{
 for(const [message,expected]of [['401 secret','CREDENTIAL_INVALID'],['403 secret','CREDENTIAL_INVALID'],['429 secret','QUOTA_EXCEEDED'],['fetch failed secret','NETWORK_UNAVAILABLE'],['request timeout secret','CONNECTION_TIMEOUT'],['unrecognized secret','CONNECTION_FAILED']])assert.equal(localConnectionError(new Error(message)),expected);
});
test('PS-06 normal Profile consumes the local shared capability on ordinary Project open',async()=>withIsolatedProject(async root=>{
 const settings=createProviderSettings({store:{async read(){return {status:'found',key:'synthetic-profile-key'};},async save(){assert.fail();},async delete(){assert.fail();}},async probe(){assert.fail('opening Project must not probe');}});await settings.initialize();
 const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(root,'absent.json')},assistanceConfig:null,caseAssistantConfig:null,providerSettings:settings,clock:()=>new Date(),deadlineScheduler:{schedule(){return {cancel(){}};}}});
 const opened=await profile.openProject({contract_version:'1.0',command_id:crypto.randomUUID(),display_name:'Synthetic',projectDirectoryCapability:{projectRoot:root,display_name:'Synthetic'}});assert.ok(opened.application);assert.ok(profile.getCaseAssistant());assert.equal(settings.status().busy,false);
}));
for(const action of ['organize_question','explain_evidence','draft_candidates'] as const)test(`PS-06 ${action} uses stored config only after its own exact disclosure`,async t=>withIsolatedProject(async root=>{
 const {createRealDesktopApplication,openConfirmedDesktopRevision}=await import('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts');
 const {createSessionCommand,desktopTestIds}=await import('../../fixtures/xanthil-desktop/desktop-fixtures.ts');
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 let payload='',calls=0;const originalStream=sdk.ModelRuntime.prototype.streamSimple;let wire:Record<string,unknown>={};
 const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>{throw Error('PS_OFFLINE_SOCKET_FORBIDDEN');});
 const draft=action==='organize_question'?{draft_kind:'question_fields',draft_content:{question_text:'Synthetic question',hypothesis_display_title:'Synthetic hypothesis',business_context:'Synthetic context',alternative_explanations:['Unknown']}}:action==='explain_evidence'?{draft_kind:'evidence_explanation',draft_content:{evidence_explanation_text:'Synthetic evidence; not causal.'}}:{draft_kind:'candidates',draft_content:{candidates:[{title:'Synthetic option',evidence_basis:'Disclosed evidence',risk_or_refutation:'Unknown',applicability_conditions:'Synthetic case',future_validation_metric:'Future metric'}]}};
 let responseText=JSON.stringify(draft);
 t.mock.method(globalThis,'fetch',async(_url:unknown,options:{body:string})=>{wire=JSON.parse(options.body);const chunk={id:'synthetic-helper',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:responseText},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',function(this:unknown,model:Record<string,unknown>,context:Record<string,unknown>,opts:Record<string,unknown>){
  // PS-06: inspect the actual transmitted protocol, not a fixture-only schema.
  const protocol=JSON.parse(String(context.systemPrompt));
  assert.deepEqual(Object.keys(protocol.response_templates),['organize_question','explain_evidence','draft_candidates']);
  const template=protocol.response_templates[action];
  assert.equal(template.draft_kind,draft.draft_kind);
  assert.deepEqual(Object.keys(template).sort(),['draft_content','draft_kind']);
  validateDesktopAssistanceDraft(template.draft_kind,template.draft_content,true);
  assert.deepEqual(Object.keys(template.draft_content).sort(),Object.keys(draft.draft_content).sort());
  assert.match(protocol.instruction,/JSON object/);assert.match(protocol.rules.join(' '),/no extra fields/i);
  calls++;assert.equal(opts.apiKey,'synthetic-shared-key');assert.equal(model.provider,'xiaomi-token-plan-cn');assert.equal(model.id,'mimo-v2.6-pro');assert.deepEqual(context.tools,[]);assert.equal(opts.maxRetries,0);payload=(context.messages as {content:string}[])[0].content;
  return originalStream.call(this,model,context,opts);
 });
 type Projection=import('../../../packages/contracts/xanthil-desktop-ipc.ts').DesktopProjection;
 let seed:Projection;
 if(action==='organize_question'){
  const base=await createRealDesktopApplication(root);const app=base.application as Record<string,(v:unknown)=>Promise<Projection>>;await app.openProject({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic'});seed=await app.createSession(createSessionCommand());
 }else{
  const setup=await openConfirmedDesktopRevision(root),app=setup.application as Record<string,(v:unknown)=>Promise<Projection>>,owner=setup.owner;seed=await app.startAnalysis({contract_version:'1.0',command_id:crypto.randomUUID(),...owner,expected_row_version:(setup.projection as unknown as Projection).revision!.row_version,confirmation_id:setup.confirmationId});
  for(let i=0;i<200&&seed.runs.some(r=>r.status==='Running');i++){await new Promise(r=>setTimeout(r,10));seed=await app.readProjection(owner);}assert.equal(seed.revision?.state,'Review');
  if(action==='draft_candidates')seed=await app.acceptFinding({contract_version:'1.0',command_id:crypto.randomUUID(),...owner,expected_row_version:seed.revision!.row_version,finding_id:seed.findings.at(-1)!.finding_id});
 }
 const settings=createProviderSettings({store:{async read(){return {status:'found',key:'synthetic-shared-key'};},async save(){assert.fail();},async delete(){assert.fail();}},async probe(){assert.fail();}});await settings.initialize();
 const profile=createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path:join(root,'absent.json')},assistanceConfig:null,caseAssistantConfig:null,providerSettings:settings,clock:()=>new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}:{at_epoch_ms:number;callback:()=>void}){const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
 const opened=await profile.openProject({contract_version:'1.0',command_id:crypto.randomUUID(),display_name:'Synthetic',projectDirectoryCapability:{projectRoot:root,display_name:'Synthetic'}}),app=opened.application;
 const owner={project_id:seed.session!.project_id,session_id:seed.session!.session_id,case_id:seed.session!.case_id,revision_id:seed.revision!.revision_id};let p=await app.readProjection(owner);const command=()=>({contract_version:'1.0' as const,command_id:crypto.randomUUID(),...owner,expected_row_version:p.revision!.row_version});
 const preview=await app.prepareAssistanceDisclosure({contract_version:'1.0',...owner,expected_row_version:p.revision!.row_version,action_kind:action,requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'});assert.equal(calls,0);
 p=await app.decideAssistanceDisclosure({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});assert.equal(calls,0);
 p=await app.startAssistance({...command(),disclosure_id:p.disclosures.at(-1)!.disclosure_id});
 for(let i=0;i<200&&p.attempts.at(-1)?.status==='Running';i++){await new Promise(r=>setTimeout(r,5));p=await app.readProjection(owner);}
 assert.deepEqual(wire.response_format,action==='draft_candidates'?{type:'json_object'}:undefined,'only candidate output uses native JSON mode');
 assert.equal(p.attempts.at(-1)?.status,'Succeeded');assert.equal(calls,1);assert.equal(payload,preview.payload_text);assert.equal(p.assistance_drafts.length,1);assert.equal(p.assistance_drafts[0].disposition,'pending');assert.equal(settings.status().busy,false);assert.equal(p.closures.length,seed.closures.length);await profile.getCaseAssistant()?.close();settings.close();
 if(action==='draft_candidates'){
  const {createPiDecisionAssistanceRuntime}=await import('../../../adapters/agent-pi/local-analysis.ts');
  const {createHash}=await import('node:crypto');
  const runtime=createPiDecisionAssistanceRuntime({provider:'xiaomi-token-plan-cn',model_id:'mimo-v2.6-pro'},undefined,()=> 'synthetic-shared-key');
  await runtime.preflightSelection({requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro'});
  for(const invalid of ['```json\n'+JSON.stringify(draft)+'\n```','{malformed',JSON.stringify({...draft,unexpected:true}),JSON.stringify({draft_kind:'candidates',draft_content:{candidates:[{title:'missing required fields'}]}})]){
   responseText=invalid;const before:number=calls;
   await assert.rejects(runtime.executeAssistance({action_kind:action,payload_bytes:Buffer.from(payload),payload_sha256:createHash('sha256').update(payload).digest('hex'),requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-pro',cancellation_signal:new AbortController().signal,deadline_seconds:30}));
   assert.equal(calls,before+1,'invalid JSON/schema never retries or repairs');assert.deepEqual(wire.response_format,{type:'json_object'});
  }
 }
}));

test('PS native fixture loads the installed SDK through require from a VM without an import callback',async()=>{
 const {createRequire}=await import('node:module'),{runInNewContext}=await import('node:vm'),net=await import('node:net');
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier);
 const original={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,stream:sdk.ModelRuntime.prototype.streamSimple};
 try{
  await runInNewContext('require(hook).install(root)',{require:createRequire(import.meta.url),hook:join(process.cwd(),'tests/fixtures/case-assistant/provider-settings-sdk.cjs'),root:process.cwd()});
  await probeLocalXiaomi('synthetic-loader-key',new AbortController().signal);
  assert.equal(Reflect.get(globalThis,'psCalls'),1);
 }finally{
  globalThis.fetch=original.fetch;net.Socket.prototype.connect=original.connect;sdk.ModelRuntime.prototype.streamSimple=original.stream;
  for(const name of ['psCalls','psMode','psRelease'])Reflect.deleteProperty(globalThis,name);
 }
});

for(const failure of [false,true])test(`P1-C4 stored Pi turn retains physical settlement after abort (${failure?'error':'done'})`,async t=>{
 const {runLocalXiaomiText}=await import('../../../adapters/agent-pi/xiaomi-local.ts'),specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 let enter!:()=>void,finish!:()=>void,calls=0;const entered=new Promise<void>(r=>enter=r);
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{calls++;const stream=ai.createAssistantMessageEventStream();finish=()=>stream.push(failure?{type:'error',reason:'error',error:{role:'assistant',content:[],stopReason:'error',errorMessage:'synthetic'}}:{type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:'late'}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:2,totalTokens:12,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});enter();return stream;});
 const abort=new AbortController();let settled=false;const pending=runLocalXiaomiText({key:'synthetic-test-key',text:'synthetic',system:'',signal:abort.signal,maxOutput:128,timeoutMs:30000}).catch(e=>e).finally(()=>{settled=true;});
 await entered;abort.abort();await new Promise(r=>setTimeout(r,20));const early=settled;finish();const result=await pending;assert.equal(early,false,'issued SDK turn still owns physical work after abort notification');assert.equal(result.code,'CANCELLED');assert.equal(calls,1);
});
