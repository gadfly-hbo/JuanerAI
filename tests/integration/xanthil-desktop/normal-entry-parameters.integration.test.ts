import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPiTransport} from 'pi-agent-runtime';
import type {ModelRequest,ModelReply} from 'pi-agent-runtime';
import {createPiSessionOpenAnalysisRuntime} from '../../../adapters/agent-pi/native-open-analysis.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/analysis-request-ledger.ts';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {withLongAnalysisArtifacts} from '../../../packages/application/open-analysis-long-artifact.ts';
import {createLocalAnalysisDraftStore} from '../../../adapters/storage-local/open-analysis-draft.ts';
import {browserServiceEnvironment} from '../../../tools/browser/service-environment.ts';
import {createIndependentBrowserOpenModel,readIndependentBrowserLaunchOptions,independentBrowserRequestAdmission} from '../../../apps/browser/service-main.ts';
import {ModelFailure,ProviderFailure} from 'pi-agent-runtime';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {createQuickAnalysisClient} from '../../../apps/browser/quick-analysis-client.mjs';
import {createPersistentRuntimeState} from '../../../adapters/agent-pi/persistent-runtime-state.ts';

function anthropicText(text='synthetic completed'){
 const events=[['message_start',{type:'message_start',message:{id:'ne-offline',type:'message',role:'assistant',content:[],model:'MiniMax-M3',usage:{input_tokens:10,output_tokens:0}}}],['content_block_start',{type:'content_block_start',index:0,content_block:{type:'text',text:''}}],['content_block_delta',{type:'content_block_delta',index:0,delta:{type:'text_delta',text}}],['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:10}}],['message_stop',{type:'message_stop'}]];
 return new Response(events.map(([e,d])=>'event: '+e+'\ndata: '+JSON.stringify(d)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
}
test('NE02 unified shared-work primary cap reaches installed SDK and actual Provider codec',async()=>{
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-cap-')),ledger=createLocalAnalysisRequestLedger({projectRoot});
 const identity={task_id:randomUUID(),operation_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};
 const bodies:Record<string,unknown>[]=[];
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(request:ModelRequest)=>createPiTransport({model:request.model,apiKey:'synthetic-offline-only',modelObservations:'v1',fetch:async(_url,init)=>{bodies.push(JSON.parse(String(init!.body)));return anthropicText();}})(request)};
 const runtime=createPiSessionOpenAnalysisRuntime(selection);
 const result=await runtime.run({identity,prompt:'Synthetic parameter contract only.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true});
 assert.equal(result.text,'synthetic completed');assert.equal(bodies.length,1);
 assert.equal(bodies[0]!.max_tokens,32768,'new shared work must not retain the old4096 output projection');
 assert.equal(bodies[0]!.model,'MiniMax-M3');assert.equal(ledger.read(identity.task_id).length,1);
});

const identityFor=()=>({task_id:randomUUID(),operation_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()});
const observedReply=(request:ModelRequest,text='synthetic completed'):ModelReply=>({stop:'complete',content:[{kind:'text',text}],usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'complete',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}});
// Fixture I/O readiness uses real time; advancing the mocked product clock here
// would change the model/tool/control boundary being measured.
const realTimer=globalThis.setTimeout;
async function until(ready:()=>boolean){
 const deadline=performance.now()+10000;
 while(!ready()){
  if(performance.now()>=deadline)throw Error('synthetic transport never entered within fixture I/O readiness bound');
  await new Promise<void>(resolve=>realTimer(resolve,1));
 }
}
test('NE03 same shared work exceeds old300 seconds across settled requests without reset',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-cumulative-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor();
 let entered=false,release:()=>void=()=>{};
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:(r:ModelRequest)=>new Promise<ModelReply>(resolve=>{entered=true;release=()=>resolve(observedReply(r));})};
 const runtime=createPiSessionOpenAnalysisRuntime(selection),input={identity,prompt:'One synthetic request.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true};
 for(const ms of [160000,160000]){
  entered=false;const pending=runtime.run(input);const guarded=pending.catch(error=>{throw error;});await until(()=>entered);t.mock.timers.tick(ms);release();
  assert.equal((await guarded).text,'synthetic completed');
 }
 assert.equal(ledger.read(identity.task_id).length,2);
 assert.ok(ledger.read(identity.task_id).every(r=>r.status==='succeeded'));
});
test('NE03 long-artifact wrapper keeps the uncapped work policy after old300 seconds',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-stage-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor();
 let entered=false,release:()=>void=()=>{};
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:(r:ModelRequest)=>new Promise<ModelReply>(resolve=>{entered=true;release=()=>resolve(observedReply(r));})};
 const native=createPiSessionOpenAnalysisRuntime(selection),runtime=withLongAnalysisArtifacts({runtime:native,store:createLocalAnalysisDraftStore({root:join(projectRoot,'drafts')}),enabled:()=>true,reportMs:()=>60000});
 const pending=runtime.run({identity,prompt:'One synthetic request.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true});
 const guarded=pending.catch(error=>{throw error;});await until(()=>entered);t.mock.timers.tick(301000);release();assert.equal((await guarded).text,'synthetic completed');
});
test('NE01 normal launcher forwards only the explicit configuration locator',()=>{
 const env=browserServiceEnvironment('/synthetic/root',{PATH:'/usr/bin:/bin',JUANERAI_BROWSER_CONFIG:'/synthetic/launch.json',LLM_API_KEY:'must-not-inherit',NODE_OPTIONS:'must-not-inherit'});
 assert.equal(env.JUANERAI_BROWSER_CONFIG,'/synthetic/launch.json');
 assert.equal(env.LLM_API_KEY,undefined);assert.equal(env.NODE_OPTIONS,undefined);
});
function openAIText(model:string,text='synthetic completed'){
 const chunks=[{id:'ne-synthetic',object:'chat.completion.chunk',model,choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:null}]},{id:'ne-synthetic',object:'chat.completion.chunk',model,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}}];
 return new Response(chunks.map(x=>'data: '+JSON.stringify(x)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
test('NE01 closed startup configuration rejects missing, foreign, extra, symlink and malformed choices',()=>{
 const root=mkdtempSync(join(browserEvidenceRoot,'ne-config-')),file=join(root,'launch.json'),value={version:'1.0',profile_root:root,analysis:{newTaskPolicy:'unified-v1'}};
 assert.throws(()=>readIndependentBrowserLaunchOptions(undefined,root),{code:'WEB_ANALYSIS_CONFIGURATION_INVALID'});
 for(const bad of [{...value,profile_root:root+'/foreign'},{...value,credentials:'not allowed'},{...value,analysis:{}},{...value,analysis:{newTaskPolicy:'unified-v1',model:'different'}}]){writeFileSync(file,JSON.stringify(bad));assert.throws(()=>readIndependentBrowserLaunchOptions(file,root),{code:'WEB_ANALYSIS_CONFIGURATION_INVALID'});}
 writeFileSync(file,'{');assert.throws(()=>readIndependentBrowserLaunchOptions(file,root));writeFileSync(file,JSON.stringify(value));
 const options=readIndependentBrowserLaunchOptions(file,root);assert.equal(options.judgmentReviewAllowed,true);assert.deepEqual(options.harnessFirstLoop?.request_admission,independentBrowserRequestAdmission);assert.equal(options.harnessFirstLoop?.work_recovery,'v1');
 const link=join(root,'link.json');symlinkSync(file,link);assert.throws(()=>readIndependentBrowserLaunchOptions(link,root));
});
test('NE01/02 startup-fixed GB purposes bind a fresh UUID before first request and reach the actual codecs',async()=>{
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-purposes-')),file=join(projectRoot,'launch.json');writeFileSync(file,JSON.stringify({version:'1.0',profile_root:projectRoot,analysis:{newTaskPolicy:'unified-v1'}}));
 const credentials=createApprovedProviderCredentials({environment:{LLM_API_KEY:'synthetic-offline-only',LLM_MODEL:'MiniMax-M3',LLM_BASE_URL:'https://api.minimaxi.com/anthropic'},backupStore:{async read(){return {status:'found',key:'synthetic-offline-only'};}}});
 const bodies:Record<string,unknown>[]=[],models:string[]=[];
 const model=createIndependentBrowserOpenModel({options:readIndependentBrowserLaunchOptions(file,projectRoot),credentials,documentReader:{pythonExecutable:'/synthetic/not-invoked'},modelTransport:request=>createPiTransport({model:request.model,apiKey:'synthetic-offline-only',modelObservations:'v1',fetch:async(_url,init)=>{bodies.push(JSON.parse(String(init!.body)));models.push(request.model.id);return request.model.protocol==='anthropic-messages'?anthropicText():openAIText(request.model.id);}})(request)});
 const approval=await model.authorizeConfiguration(),identity={...identityFor(),config_sha256:approval.config_sha256},ledger=createLocalAnalysisRequestLedger({projectRoot});
 const runtime=model.createRuntime(ledger,{projectRoot,reviewPolicyForTask:id=>id===identity.task_id});
 for(const purpose of ['analysis','report_edit','conclusion_strategy_review'] as const){try{const r=await runtime.run({identity,...(purpose==='analysis'?{}:{purpose}),prompt:'Synthetic parameter observation '+purpose,system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true});assert.equal(r.text,'synthetic completed');}catch(error){assert.fail(purpose+': '+String(error));}}
 assert.deepEqual(models,['MiniMax-M3','mimo-v2.6-pro','mimo-v2.6-flash']);
 for(const body of bodies)assert.equal(body.max_tokens??body.max_completion_tokens,32768);
 for(const body of bodies.slice(1))assert.deepEqual(body.thinking,{type:'disabled'});
 assert.equal((await model.authorizeConfiguration()).config_sha256,identity.config_sha256);
 const disclosed=createIndependentBrowserOpenModel({options:{...readIndependentBrowserLaunchOptions(file,projectRoot),metricAssetDisclosureAllowed:true},credentials,documentReader:{pythonExecutable:'/synthetic/not-invoked'}});
 assert.notEqual((await disclosed.authorizeConfiguration()).config_sha256,identity.config_sha256,'permission changes cannot share a configuration identity');
 const legacy=createIndependentBrowserOpenModel({options:{},credentials,documentReader:{pythonExecutable:'/synthetic/not-invoked'}});assert.notEqual((await legacy.authorizeConfiguration()).config_sha256,identity.config_sha256);
});
test('NE02 primary and fallback caps follow candidate roles when Flash is the existing selected primary',async()=>{
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-role-caps-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor(),seen:number[]=[],fallbackBodies:Record<string,unknown>[]=[];
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,analysisModel:'mimo-v2.6-flash' as const,mimoThinking:'off' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(r:ModelRequest)=>{seen.push(r.maxOutputTokens);if(seen.length===1)throw new ProviderFailure('unavailable',{model:{provider:r.model.provider,id:r.model.id,protocol:r.model.protocol},stop:'error',category:'unavailable',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'});return createPiTransport({model:r.model,apiKey:'synthetic-offline-only',modelObservations:'v1',fetch:async(_url,init)=>{fallbackBodies.push(JSON.parse(String(init!.body)));return r.model.protocol==='anthropic-messages'?anthropicText():openAIText(r.model.id);}})(r);}};
 const runtime=createPiSessionOpenAnalysisRuntime(selection);let failure:unknown;try{await runtime.run({identity,prompt:'Synthetic role-cap fault.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true});}catch(error){failure=error;}assert.deepEqual(seen,[32768,16384]);if(failure)throw failure;assert.equal(fallbackBodies.length,1);assert.equal(fallbackBodies[0]!.max_tokens??fallbackBodies[0]!.max_completion_tokens,16384);
});
test('NE01 actual normal launcher child, HTTP control and product client create a fresh routed Task',{skip:process.platform!=='darwin',timeout:30000},async()=>{
 const base=mkdtempSync(join(browserEvidenceRoot,'ne-normal-launch-')),root=join(base,'runtime'),config=join(base,'launch.json'),fixture=fileURLToPath(new URL('../../fixtures/xanthil-desktop/normal-entry-offline.mjs',import.meta.url)),invoke=promisify(execFile);
 writeFileSync(config,JSON.stringify({version:'1.0',profile_root:root,analysis:{newTaskPolicy:'unified-v1'}}));
 const env={...process.env,JUANERAI_DESKTOP_DEV_ROOT:root,JUANERAI_BROWSER_CONFIG:config};
 const entry=(action:string)=>invoke(process.execPath,['--import',fixture,'tools/browser/entry.mjs',action,...(action==='start'?['--no-open']:[])],{env,timeout:20000});
 let owned=false;
 try{
  await entry('start');owned=true;
  const record=JSON.parse(readFileSync(join(root,'user-data/web-service/service.json'),'utf8'));
  const open=await fetch(record.origin+'/v1/service/open',{method:'POST',headers:{'content-type':'application/json','x-xanthil-service':record.credential},body:'{}'});assert.equal(open.status,200);
  const boot=await fetch(record.origin+'/v1/bootstrap',{method:'POST',headers:{origin:record.origin,'content-type':'application/json'},body:JSON.stringify({token:(await open.json()).token})});assert.equal(boot.status,200);
  const cookie=boot.headers.get('set-cookie')!.split(';')[0]!,headers={cookie,origin:record.origin,'content-type':'application/json'};
  const session=await(await fetch(record.origin+'/v1/session',{headers})).json();
  const claim=await fetch(record.origin+'/v1/control',{method:'POST',headers,body:JSON.stringify({version:'1.0',command_id:randomUUID(),generation:session.generation,confirmed:true})});assert.equal(claim.status,200);
  const project=await fetch(record.origin+'/v1/projects/select',{method:'POST',headers:{...headers,'x-xanthil-control':(await claim.json()).control},body:JSON.stringify({version:'1.0',command_id:randomUUID(),name:'Independent synthetic normal-entry check'})});assert.equal(project.status,200);
  const control=(await project.json()).control;
  const request:typeof fetch=async(input,init)=>{const h=new Headers(init?.headers);h.set('cookie',cookie);h.set('origin',record.origin);return fetch(new URL(String(input),record.origin),{...init,headers:h});};
  const client=createQuickAnalysisClient({request,control});assert.ok('submit' in client&&typeof client.submit==='function');assert.ok('stop' in client&&typeof client.stop==='function');const task=await client.submit('独立合成入口参数检查，不形成业务成果。',[]);
  assert.match(task.identity.task_id,/^[a-f0-9-]{36}$/);assert.equal(task.review_policy,'conclusion_strategy_v1');
  let dtos:{body:Record<string,unknown>}[]=[];
  for(let i=0;i<300;i++){try{dtos=readFileSync(join(root,'synthetic-provider.jsonl'),'utf8').trim().split('\n').map(x=>JSON.parse(x));if(dtos.length)break;}catch{}await new Promise(resolve=>setTimeout(resolve,10));}
  assert.ok(dtos.length);assert.equal(dtos[0]!.body.model,'MiniMax-M3');assert.equal(dtos[0]!.body.max_tokens,32768);
  const version=await(await request('/v1/workbench-version')).json();assert.equal(version.node,process.version);assert.notEqual(version.pid,process.pid);
  const frontend=await(await request('/workspace.mjs')).text();assert.equal(frontend,readFileSync('apps/browser/workspace.mjs','utf8'));
  writeFileSync(join(base,'normal-entry-readback.json'),JSON.stringify({pid:version.pid,node:version.node,source_sha256:version.source_sha256,task_id:task.identity.task_id,config_sha256:task.identity.config_sha256,first_model:dtos[0]!.body.model,output:dtos[0]!.body.max_tokens,root},null,2));
  await client.stop(task.identity.task_id);
 }finally{if(owned)await entry('stop');}
});

for(const purpose of ['analysis','proposal_prepare','report_edit','conclusion_strategy_review'] as const)
test('NE03/04 '+purpose+' crosses old short walls but keeps the600-second physical protection',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-model-wall-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor();let delayed=false,entered=false,release:()=>void=()=>{},calls=0;
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,reviewPolicy:()=>true,reportThinking:'off' as const,reportPro60ForTask:()=>true,judgmentReviewTimeoutForTask:()=>60000 as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:(r:ModelRequest)=>{calls++;if(!delayed)return Promise.resolve(observedReply(r));return new Promise<ModelReply>(resolve=>{entered=true;release=()=>resolve(observedReply(r));});}};
 const runtime=createPiSessionOpenAnalysisRuntime(selection),input={identity,prompt:'Synthetic bounded request.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true};
 if(['report_edit','conclusion_strategy_review'].includes(purpose))await runtime.run(input);
 delayed=true;
 let pending=runtime.run({...input,...(purpose==='analysis'?{}:{purpose})});await until(()=>entered);t.mock.timers.tick(301000);release();assert.equal((await pending).text,'synthetic completed');
 entered=false;pending=runtime.run({...input,...(purpose==='analysis'?{}:{purpose}),prompt:'Second synthetic request must expire.'});const outcome=pending.then(()=>null,error=>error);await until(()=>entered);t.mock.timers.tick(600001);release();assert.ok(await outcome,'a single physical request must still stop');await runtime.collect?.(identity.task_id);
 const count=calls;await assert.rejects(()=>runtime.run({...input,...(purpose==='analysis'?{}:{purpose})}));assert.equal(calls,count,'an unknown/late timed-out physical effect cannot cause a new dispatch');
});
for(const boundary of ['cancel','revoke','expiry'] as const)test('NE04 uncapped work preserves '+boundary+' and refuses late publication',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-authority-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor(),controller=new AbortController(),expires=Date.now()+50000;let permission=true,entered=false,release:()=>void=()=>{},calls=0;
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:(r:ModelRequest)=>new Promise<ModelReply>(resolve=>{calls++;entered=true;release=()=>resolve(observedReply(r,'late must not publish'));})};
 const runtime=createPiSessionOpenAnalysisRuntime(selection),input={identity,prompt:'Synthetic authority boundary.',system:'No business task.',tools:[],signal:controller.signal,authorize:()=>permission&&(boundary!=='expiry'||Date.now()<expires)};
 const result=runtime.run(input).then(()=>null,error=>error);await until(()=>entered);
 await assert.rejects(()=>runtime.run(input));assert.equal(calls,1,'unsettled physical occupancy cannot be bypassed');
 if(boundary==='cancel')controller.abort();else if(boundary==='revoke')permission=false;else t.mock.timers.tick(50001);
 release();assert.ok(await result);await runtime.collect?.(identity.task_id);await assert.rejects(()=>runtime.run(input));assert.equal(calls,1);
});
test('NE07 legacy work deadline and new work policy coexist without reinterpreting records',async t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-compat-')),oldIdentity=identityFor(),newIdentity=identityFor(),legacy=createPersistentRuntimeState({projectRoot});
 const old=legacy.businessWork.begin({identity:oldIdentity}),original=legacy.businessWork.read(old.id);assert.equal(old.version,'1');
 const modern=createPersistentRuntimeState({projectRoot,runPolicy:'unified-v1'}),current=modern.businessWork.begin({identity:newIdentity});assert.equal(current.version,'2');assert.equal(current.deadline_at,null);
 assert.deepEqual(modern.businessWork.read(old.id),original);assert.throws(()=>modern.businessWork.begin({identity:oldIdentity}));assert.throws(()=>legacy.businessWork.begin({identity:newIdentity}));
 t.mock.timers.setTime(Date.now()+301000);assert.equal(modern.businessWork.allowed(old.id),false);assert.equal(modern.businessWork.allowed(current.id),true);assert.deepEqual(modern.businessWork.read(old.id),original);
});
for(const elapsed of [299999,300001])test('NE04 tool hard wall remains300 seconds: '+elapsed,async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-tool-wall-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor(),controller=new AbortController();let entered=false,release:()=>void=()=>{},calls=0;
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(r:ModelRequest)=>{calls++;const reply=observedReply(r);return calls===1?{...reply,stop:'tools' as const,content:[{kind:'tool' as const,id:randomUUID(),name:'read_analysis_evidence',arguments:{}}],outcome:{...reply.outcome!,stop:'tools' as const}}:reply;}};
 const runtime=createPiSessionOpenAnalysisRuntime(selection),tools=[{name:'read_analysis_evidence',description:'Synthetic read only; no external effect.',parameters:{type:'object',properties:{},required:[],additionalProperties:false},execute:()=>new Promise(resolve=>{entered=true;release=()=>resolve({synthetic:true});})}];
 const outcome=runtime.run({identity,prompt:'Exercise the one synthetic read tool.',system:'No business task.',tools,signal:controller.signal,authorize:()=>true}).then(value=>({value,error:null}),error=>({value:null,error}));
 try{
  await until(()=>entered);t.mock.timers.tick(elapsed);release();const result=await outcome;
  if(elapsed<300000){assert.equal(result.error,null);assert.equal(result.value?.text,'synthetic completed');assert.equal(calls,2);}else{assert.ok(result.error);assert.equal(calls,1);}
 }finally{controller.abort();release();await outcome;await runtime.collect?.(identity.task_id);}
});
test('NE04 actual Adapter/SDK control operation uses30 seconds and cannot dispatch after expiry',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});
 const original=globalThis.setTimeout;let fired=false,calls=0;
 t.mock.method(globalThis,'setTimeout',((callback:()=>void,delay?:number,...args:unknown[])=>{const timer=original(callback,delay,...args);if(delay===30000&&!fired){fired=true;queueMicrotask(()=>t.mock.timers.tick(30001));}return timer;}) as typeof setTimeout);
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-control-wall-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor();
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(r:ModelRequest)=>{calls++;return observedReply(r);}};
 const runtime=createPiSessionOpenAnalysisRuntime(selection);await assert.rejects(runtime.run({identity,prompt:'Synthetic control expiry.',system:'No business task.',tools:[],signal:new AbortController().signal,authorize:()=>true}));assert.equal(fired,true);assert.equal(calls,0);
});
for(const backup of [false,true])test('NE05 R1 checks '+(backup?'the smaller fallback window before second send':'the primary window with32768 output reservation'),async()=>{
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-r1-window-')),ledger=createLocalAnalysisRequestLedger({projectRoot}),identity=identityFor();let calls=0;
 const selection={projectRoot,ledger,firstLoop:'v0.2' as const,sharedWorkRecovery:'v1' as const,runPolicy:'unified-v1' as const,...(backup?{analysisModel:'mimo-v2.6-flash' as const}:{}),r1r4:{contextAdmission:{policyVersion:independentBrowserRequestAdmission.policy_version,protocolOverheadTokens:independentBrowserRequestAdmission.protocol_overhead_tokens,safetyMarginTokens:independentBrowserRequestAdmission.safety_margin_tokens}},credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async(r:ModelRequest)=>{calls++;assert.equal(r.model.contextWindow,1048576);throw new ProviderFailure('unavailable',{model:{provider:r.model.provider,id:r.model.id,protocol:r.model.protocol},stop:'error',category:'unavailable',physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'});}};
 const runtime=createPiSessionOpenAnalysisRuntime(selection);await assert.rejects(runtime.run({identity,prompt:'x'.repeat(backup?960000:640000),system:'Synthetic context window boundary.',tools:[],signal:new AbortController().signal,authorize:()=>true}));assert.equal(calls,backup?1:0);assert.equal(ledger.read(identity.task_id).length,backup?1:0);
});
test('NE05 unified selection cannot omit R1 or the shared accounting contract',()=>{
 const projectRoot=mkdtempSync(join(browserEvidenceRoot,'ne-required-policy-')),ledger=createLocalAnalysisRequestLedger({projectRoot});
 const base={projectRoot,ledger,firstLoop:'v0.2' as const,runPolicy:'unified-v1' as const,credentials:createApprovedProviderCredentials({environment:{}})};
 assert.throws(()=>createPiSessionOpenAnalysisRuntime({...base,sharedWorkRecovery:'v1'}));
 assert.throws(()=>createPiSessionOpenAnalysisRuntime({...base,r1r4:{contextAdmission:{policyVersion:'ne-offline-fixture',protocolOverheadTokens:128,safetyMarginTokens:512}}}));
});
test('NE07 legacy draft bytes retain short deadlines while explicit new drafts have no aggregate timer',()=>{
 let clock=1000000;const root=mkdtempSync(join(browserEvidenceRoot,'ne-draft-compat-')),store=createLocalAnalysisDraftStore({root,now:()=>clock}),binding={task_id:randomUUID(),operation_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64),kind:'report' as const};
 const legacy=store.begin(binding,{max_bytes:262144,usual_ms:60000,recovery_ms:120000,full_deadline:clock+300000}),legacyBytes=readFileSync(join(root,legacy.id+'.json'));
 const currentBinding={...binding,task_id:randomUUID()},current=store.begin(currentBinding,{max_bytes:262144,timing:'unlimited'});clock+=301000;
 const reopened=createLocalAnalysisDraftStore({root,now:()=>clock});assert.throws(()=>reopened.check(binding,legacy.id));reopened.check(currentBinding,current.id);
 reopened.write(currentBinding,current.id,'synthetic complete');assert.equal(reopened.read(currentBinding,current.id).text,'synthetic complete');assert.deepEqual(readFileSync(join(root,legacy.id+'.json')),legacyBytes);
 assert.throws(()=>reopened.begin(binding,{max_bytes:262144,timing:'unlimited'}));assert.deepEqual(readFileSync(join(root,legacy.id+'.json')),legacyBytes);
});
