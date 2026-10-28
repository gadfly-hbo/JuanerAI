import {offlineResponse,offlineAnthropicResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import * as service from '../../../apps/browser/service-main.ts';
import {browserServiceEnvironment} from '../../../tools/browser/service-environment.ts';
import {createPiProfessionalAgent,professionalAgentLimits,professionalCommandSoftTimeoutMs,professionalRequestAdmission} from '../../../adapters/agent-pi/professional-agent.ts';
import type {AnalysisPurpose} from '../../../packages/ports/analysis-agent.ts';
const fresh=()=>mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ne-'));
function text(model:string,content='owned completed'){
 if(model==='MiniMax-M3'){
  const events=[['message_start',{type:'message_start',message:{id:'ne-owned',type:'message',role:'assistant',content:[],model,usage:{input_tokens:7,output_tokens:0}}}],['content_block_start',{type:'content_block_start',index:0,content_block:{type:'text',text:''}}],['content_block_delta',{type:'content_block_delta',index:0,delta:{type:'text_delta',text:content}}],['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:3}}],['message_stop',{type:'message_stop'}]];
  return new Response(events.map(([e,d])=>'event: '+e+'\ndata: '+JSON.stringify(d)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
 }
 return new Response('data: '+JSON.stringify({id:'ne-owned',object:'chat.completion.chunk',model,choices:[{index:0,delta:{role:'assistant',content},finish_reason:'stop'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
function setup(selected:'MiniMax-M3'|'mimo-v2.6-flash'|'deepseek-flash'='mimo-v2.6-flash',fetch?:typeof globalThis.fetch,modelRecoveryLimit?:number){
 const dtos:{url:string;body:any}[]=[],root=fresh(),agent=createPiProfessionalAgent({projectRoot:root,analysisModel:selected,modelRecoveryLimit,authorizeWork:()=>true,credentials:{withCredential:async(provider,run)=>{assert.ok(provider==='minimax-cn'||provider==='xiaomi-token-plan-cn'||provider==='deepseek');return run({key:'offline-ne-key-not-in-messages',provider,model:provider==='minimax-cn'?'MiniMax-M3':provider==='deepseek'?'deepseek-flash':'mimo-v2.6-flash',endpoint:provider==='minimax-cn'?'https://api.minimaxi.com/anthropic':provider==='deepseek'?'https://api.deepseek.com':'https://token-plan-cn.xiaomimimo.com/v1'});}},fetch:async(url,init)=>{dtos.push({url:String(url),body:JSON.parse(String(init!.body))});return fetch?fetch(url,init):text(dtos.at(-1)!.body.model);}});
 return {root,agent,dtos,async identity(){return {task_id:randomUUID(),operation_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),grant_id:randomUUID()};}};
}
const turn=(identity:Awaited<ReturnType<ReturnType<typeof setup>['identity']>>,purpose:AnalysisPurpose='analysis')=>({identity,command_id:randomUUID(),purpose,prompt:'owned offline parameter check',system:'no business data or expected answer',capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});
const realTimer=globalThis.setTimeout;
async function until(ready:()=>boolean){const limit=performance.now()+3000;while(!ready()){if(performance.now()>limit)assert.fail('fixture did not reach actual transport');await new Promise<void>(r=>realTimer(r,1));}}

test('NE01 current closed non-secret deployment locator rejects missing/unknown/mismatch/link/malformed before execution',()=>{
 const read=Reflect.get(service,'readIndependentBrowserDeployment');assert.equal(typeof read,'function');const root=fresh(),file=join(root,'launch.json'),good={version:'2.0',profile_root:root,analysis:{analysisModel:'mimo-v2.6-flash',judgmentReviewAllowed:true}};
 for(const bad of [{...good,version:'1.0'},{...good,profile_root:root+'/foreign'},{...good,credentials:'forbidden'},{...good,analysis:{}},{...good,analysis:{...good.analysis,analysisModel:'other'}},{...good,analysis:{...good.analysis,analysisModel:'MiniMax-M3.1-Flash'}},{...good,analysis:{...good.analysis,judgmentReviewAllowed:'true'}},{...good,analysis:{...good.analysis,review60Tasks:[]}}]){writeFileSync(file,JSON.stringify(bad));assert.throws(()=>read(file,root),{code:'WEB_ANALYSIS_CONFIGURATION_INVALID'});}
  writeFileSync(file,'{');assert.throws(()=>read(file,root));writeFileSync(file,JSON.stringify(good));assert.deepEqual(read(file,root),{...good.analysis,toolCorrectionLimit:5,modelRecoveryLimit:3});const m3={...good,analysis:{...good.analysis,analysisModel:'MiniMax-M3'}};writeFileSync(file,JSON.stringify(m3));assert.deepEqual(read(file,root),{...m3.analysis,toolCorrectionLimit:5,modelRecoveryLimit:3});assert.throws(()=>read(undefined,root));const link=join(root,'link');symlinkSync(file,link);assert.throws(()=>read(link,root));writeFileSync(file,' '.repeat(65537));assert.throws(()=>read(file,root));
});
test('NE01 normal launcher forwards only explicit deployment and existing toolchain fields',()=>{
 const env=browserServiceEnvironment('/synthetic/root',{PATH:'/usr/bin:/bin',JUANERAI_BROWSER_CONFIG:'/synthetic/launch.json',LLM_API_KEY:'must-not-inherit',NODE_OPTIONS:'must-not-inherit'});assert.equal(env.JUANERAI_BROWSER_CONFIG,'/synthetic/launch.json');assert.equal(env.LLM_API_KEY,undefined);assert.equal(env.NODE_OPTIONS,undefined);
});
test('SM02 normal launcher forwards only the directed official DeepSeek key and no arbitrary environment',()=>{
 const env=browserServiceEnvironment('/synthetic/root',{DEEPSEEK_API_KEY:'synthetic-directed-only',DEEPSEEK_BASE_URL:'https://unapproved.invalid',VOLCENGINE_API_KEY:'must-not-inherit',LLM_API_KEY:'must-not-inherit',NODE_OPTIONS:'must-not-inherit'});
 assert.equal(env.DEEPSEEK_API_KEY,'synthetic-directed-only');for(const key of ['DEEPSEEK_BASE_URL','VOLCENGINE_API_KEY','LLM_API_KEY','NODE_OPTIONS'])assert.equal(env[key],undefined);
});
for(const selected of ['MiniMax-M3','mimo-v2.6-flash','deepseek-flash'] as const)test('NE02 actual Adapter/C/codecs fixed purposes and role caps '+selected,async()=>{
 const f=setup(selected),identity=await f.identity();
 const purposes:AnalysisPurpose[]=['analysis','requirement_design','report_edit','conclusion_strategy_review','retained_case','desktop_draft','membership'];
 for(const purpose of purposes){const r=await f.agent.advance(turn(identity,purpose));assert.equal(r.text,'owned completed');await f.agent.assertCompleted(identity,r.completion);}
 assert.deepEqual(f.dtos.map(r=>r.body.model),[selected,selected,selected==='deepseek-flash'?selected:'mimo-v2.6-pro',selected==='deepseek-flash'?selected:'mimo-v2.6-flash','mimo-v2.6-pro',selected,'mimo-v2.6-pro']);
 for(const r of f.dtos){assert.equal(r.body.max_tokens??r.body.max_completion_tokens,32768);if(r.body.model.startsWith('mimo')){assert.equal(r.url,'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');assert.deepEqual(r.body.thinking,{type:'disabled'});}else if(r.body.model==='deepseek-flash'){assert.equal(r.url,'https://api.deepseek.com/chat/completions');assert.deepEqual(r.body.thinking,{type:'disabled'});}else{assert.equal(r.url,'https://api.minimaxi.com/anthropic/v1/messages?beta=true');assert.deepEqual(r.body.thinking,{type:'disabled'},'current public native Harness default, no extra host thinking override');}}
 assert.equal((await f.agent.diagnostics(identity)).meter!.model_attempts,7);assert.equal(identity.config_sha256,await f.agent.configuration());const other=setup(selected==='mimo-v2.6-flash'?'MiniMax-M3':'mimo-v2.6-flash');assert.notEqual(await other.agent.configuration(),identity.config_sha256);
});
for(const selected of ['MiniMax-M3','mimo-v2.6-flash'] as const)test('NE02 backup output cap follows candidate role '+selected,async()=>{
 let n=0;const f=setup(selected,async(_url,init)=>{const dto=JSON.parse(String(init!.body));if(++n===1)return new Response(JSON.stringify({error:{code:'unavailable'},usage:{prompt_tokens:0,completion_tokens:0}}),{status:503,headers:{'content-type':'application/json'}});return text(dto.model);});
 await f.agent.advance(turn(await f.identity()));assert.equal(f.dtos.length,2);assert.deepEqual(f.dtos.map(r=>r.body.max_tokens??r.body.max_completion_tokens),[32768,16384]);
});
for(const purpose of ['analysis','report_edit','conclusion_strategy_review','membership','retained_case','desktop_draft'] as const)test('NE03 current '+purpose+' exceeds old300 total; each model still600 seconds',async t=>{
 const f=setup('mimo-v2.6-flash',async(_url,init)=>{entered=true;await new Promise<void>(r=>release=r);return text(JSON.parse(String(init!.body)).model);}),identity=await f.identity();let entered=false,release!:()=>void;
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});let elapsed=0;t.mock.method(performance,'now',()=>elapsed);
 const request=turn(identity,purpose);let pending=f.agent.advance(request);try{await until(()=>entered);elapsed+=301000;t.mock.timers.tick(301000);release();assert.equal((await pending).text,'owned completed');
 entered=false;pending=f.agent.advance({...request,command_id:randomUUID()});const outcome=pending.then(()=>null,e=>e);await until(()=>entered);elapsed+=600001;t.mock.timers.tick(600001);release();assert.ok(await outcome);await f.agent.waitForIdle();const calls=f.dtos.length;await assert.rejects(()=>f.agent.advance(request));assert.equal(f.dtos.length,calls,'same command and late effect cannot replay');assert.equal((await f.agent.diagnostics(identity)).meter!.model_attempts,2);
 }finally{release?.();await pending.catch(()=>undefined);await f.agent.waitForIdle();t.mock.timers.reset();}
});
for(const boundary of ['cancel','revoke','expiry'] as const)test('NE04 '+boundary+' denies late publication, keeps meter and no replay',async t=>{
 let entered=false,release!:()=>void,permission=true;const f=setup('mimo-v2.6-flash',async(_url,init)=>{entered=true;await new Promise<void>(r=>release=r);return text(JSON.parse(String(init!.body)).model,'late must not publish');}),identity=await f.identity(),controller=new AbortController(),expires=Date.now()+50000;
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});const request={...turn(identity),signal:controller.signal,authorize:()=>permission&&Date.now()<expires};const pending=f.agent.advance(request).then(()=>null,e=>e);
 try{await until(()=>entered);await assert.rejects(()=>f.agent.advance({...request,command_id:randomUUID()}));assert.equal(f.dtos.length,1);if(boundary==='cancel')controller.abort();else if(boundary==='revoke')permission=false;else t.mock.timers.tick(50001);release();assert.ok(await pending);await f.agent.waitForIdle();await assert.rejects(()=>f.agent.advance(request));assert.equal(f.dtos.length,1);assert.equal((await f.agent.diagnostics(identity)).meter!.model_attempts,1);}finally{release?.();controller.abort();await pending;await f.agent.waitForIdle();t.mock.timers.reset();}
});
for(const ms of [299999,300001])test('NE04 actual native tool hard300000 '+ms,async t=>{
 let calls=0,entered=false,release!:()=>void;const f=setup('mimo-v2.6-flash',async(_url,init)=>++calls===1?new Response('data: '+JSON.stringify({id:'owned',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:'owned',type:'function',function:{name:'read_owned',arguments:'{}'}}]},finish_reason:'tool_calls'}],usage:{prompt_tokens:7,completion_tokens:3,total_tokens:10}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}}):text(JSON.parse(String(init!.body)).model)),identity=await f.identity(),controller=new AbortController();
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});let elapsed=0;t.mock.method(performance,'now',()=>elapsed);
 const pending=f.agent.advance({...turn(identity),signal:controller.signal,capabilities:async()=>[{name:'read_owned',effect:'read' as const,description:'owned read',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{entered=true;await new Promise<void>(r=>release=r);return {read:true};}}]}).then(value=>({value,error:null}),error=>({value:null,error}));
 try{await until(()=>entered);elapsed+=ms;t.mock.timers.tick(ms);release();const result=await pending;if(ms<300000){assert.equal(result.error,null);assert.equal(result.value!.text,'owned completed');assert.equal(calls,2);}else{assert.ok(result.error);assert.equal(calls,1);}await f.agent.waitForIdle();assert.equal((await f.agent.diagnostics(identity)).meter!.tool_calls,1);}finally{release?.();controller.abort();await pending;await f.agent.waitForIdle();t.mock.timers.reset();}
});
test('NE04 control uses30000 independently of model600000 and sends nothing after control expiry',async t=>{
 const f=setup(),identity=await f.identity();t.mock.timers.enable({apis:['setTimeout']});const timer=globalThis.setTimeout;let fired=false;
 t.mock.method(globalThis,'setTimeout',((callback:()=>void,ms?:number,...args:unknown[])=>{const handle=timer(callback,ms,...args);if(ms===30000&&!fired){fired=true;queueMicrotask(()=>t.mock.timers.tick(30001));}return handle;}) as typeof setTimeout);
 await assert.rejects(()=>f.agent.advance(turn(identity)));await f.agent.waitForIdle();assert.equal(fired,true);assert.equal(f.dtos.length,0);assert.equal(professionalAgentLimits.modelTimeoutMs,600000);assert.equal(professionalCommandSoftTimeoutMs,120000);
});
for(const backup of [false,true])test('NE05 exact candidate R1 prevents out-of-window '+(backup?'fallback':'primary')+' send',async()=>{
 const f=setup(backup?'mimo-v2.6-flash':'MiniMax-M3',async()=>new Response(JSON.stringify({error:{code:'unavailable'},usage:{prompt_tokens:0,completion_tokens:0}}),{status:503,headers:{'content-type':'application/json'}})),identity=await f.identity();await assert.rejects(()=>f.agent.advance({...turn(identity),prompt:'x'.repeat(backup?960000:640000)}));assert.equal(f.dtos.length,backup?1:0);assert.equal(professionalRequestAdmission.protocolOverheadTokens,4096);assert.equal(professionalRequestAdmission.safetyMarginTokens,8192);
});

test('H3-01 current real native write/edit/read survive one fault extra without replaying completed tools',async()=>{
 let physical=0;const f=setup('mimo-v2.6-flash',async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));physical++;
  if(physical===2)return new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});
  const call=physical===1?{name:'write',args:{path:'draft/analysis.py',content:'print(1)\n'}}:physical===3?{name:'edit',args:{path:'draft/analysis.py',edits:[{oldText:'print(1)',newText:'print(2)'}]}}:physical===4?{name:'read',args:{path:'draft/analysis.py'}}:undefined;
  if(physical===5)assert.match(JSON.stringify(dto.messages),/print\(2\)/,'Pi observes actual native read result');
  return dto.model==='MiniMax-M3'?offlineAnthropicResponse(physical,call,'native completed'):offlineResponse(physical,call?[call]:[],'native completed');
 });
 const identity=await f.identity(),result=await f.agent.advance(turn(identity));await f.agent.assertCompleted(identity,result.completion);assert.equal(physical,5);
 const diagnostic=await f.agent.diagnostics(identity),names=diagnostic.observations.filter(o=>o.kind==='tool').map(o=>o.name);
 assert.deepEqual(names,['write','edit','read']);assert.equal(diagnostic.meter!.model_attempts,5);assert.equal(diagnostic.meter!.unconfirmed_output_tokens,0);assert.equal(f.dtos[2]!.body.max_tokens,16384);
});
for(const accounting of ['known','unknown'] as const)test('H3-01/R4 explicitly configured limit1 '+accounting+' failed extra remains consumed; lawful independent purpose cannot receive another extra',async()=>{
 let physical=0;const f=setup('mimo-v2.6-flash',async(_url,init)=>{physical++;const dto=JSON.parse(String(init!.body));const usage=dto.model==='MiniMax-M3'?(accounting==='known'?{input_tokens:0,output_tokens:0}:{prompt_tokens:0,completion_tokens:0}):{prompt_tokens:0,completion_tokens:0};return new Response(JSON.stringify({error:{code:'unavailable'},usage}),{status:503,headers:{'content-type':'application/json'}});},1),identity=await f.identity();
 await assert.rejects(()=>f.agent.advance(turn(identity)));await f.agent.waitForIdle();assert.equal(physical,2);
 const before=await f.agent.diagnostics(identity);assert.equal(before.unconfirmed_effects,accounting==='unknown');
 await assert.rejects(()=>f.agent.advance(turn(identity,'report_edit')));await f.agent.waitForIdle();const after=await f.agent.diagnostics(identity);writeFileSync(join(f.root,'H3-RECOVERY-OBSERVED.json'),JSON.stringify({before,after},null,2));
 if(accounting==='known'){assert.equal(physical,3,'independent normal report chain counts; second fault extra never sends');assert.equal(after.meter!.model_attempts,3);assert.equal(after.meter!.unconfirmed_output_tokens,0);}
 else{assert.equal(physical,2,'UNKNOWN occupies original reserve; no new chain or replay');assert.equal(after.meter!.model_attempts,2);assert.equal(after.meter!.unconfirmed_output_tokens,16384);assert.deepEqual(after.observations,before.observations);}
});
