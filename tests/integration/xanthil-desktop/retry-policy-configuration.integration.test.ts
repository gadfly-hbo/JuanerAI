import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {readIndependentBrowserDeployment} from '../../../apps/browser/service-main.ts';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';

const root=()=>mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'retry-config-'));
const text=(value='Synthetic only')=>new Response('data: '+JSON.stringify({id:randomUUID(),object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:value},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
const bad=()=>new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});
const credentials:Parameters<typeof createPiProfessionalAgent>[0]['credentials']={withCredential:async(provider,run)=>provider==='deepseek'?run({key:'synthetic-policy-only',provider,model:'deepseek-flash',endpoint:'https://api.deepseek.com'}):offlineCredentials.withCredential(provider,run)};
const toolCall=(id:string,name:string,args:Record<string,unknown>)=>new Response('data: '+JSON.stringify({id,object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id,type:'function',function:{name,arguments:JSON.stringify(args)}}]},finish_reason:'tool_calls'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});

test('DS01/02: selected DeepSeek covers every normal analysis purpose through actual SDK transport; old identity cannot send',async()=>{
 const projectRoot=root(),sent:string[]=[],recipients:string[]=[];
 const agent=createPiProfessionalAgent({projectRoot,analysisModel:'deepseek-flash',authorizeWork:()=>true,credentials:{withCredential:async(provider,run)=>{recipients.push(provider);return credentials.withCredential(provider,run);}},fetch:async(url,init)=>{
  const dto=JSON.parse(String(init!.body));sent.push(dto.model);assert.equal(new URL(String(url)).origin,'https://api.deepseek.com');assert.equal(dto.model,'deepseek-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);return text();
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const turn={identity,prompt:'Synthetic route contract only',system:'No business outcome',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[]};
 const purposes=['requirement_design','analysis','report_edit','conclusion_strategy_review','report_revision'] as const;
 try{
  for(const purpose of purposes){const result=await agent.advance({...turn,command_id:randomUUID(),purpose});await agent.assertCompleted(identity,result.completion);assert.deepEqual(agent.recipient(purpose),{provider:'deepseek',model:'deepseek-flash'});}
  assert.equal(sent.length,5);assert.deepEqual([...new Set(recipients)],['deepseek']);
  await assert.rejects(()=>agent.advance({...turn,identity:{...identity,config_sha256:'0'.repeat(64)},command_id:randomUUID(),purpose:'report_edit'}));assert.equal(sent.length,5,'wrong configuration fails before sending');
  assert.equal((await agent.diagnostics(identity)).meter!.model_attempts,5);
  for(const purpose of ['retained_case','membership'] as const)assert.deepEqual(agent.recipient(purpose),{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro'});
 }finally{await agent.waitForIdle();}
});

test('EN01 normal closed deployment defaults5/3 and accepts explicit smaller values; malformed policy rejected',()=>{
 const r=root(),file=join(r,'launch.json');
 const read=(extra:Record<string,unknown>={})=>{writeFileSync(file,JSON.stringify({version:'2.0',profile_root:r,analysis:{analysisModel:'deepseek-flash',judgmentReviewAllowed:true,...extra}}));return readIndependentBrowserDeployment(file,r);};
 assert.deepEqual(read(),{analysisModel:'deepseek-flash',judgmentReviewAllowed:true,toolCorrectionLimit:5,modelRecoveryLimit:3});
 assert.deepEqual(read({toolCorrectionLimit:1,modelRecoveryLimit:0}),{analysisModel:'deepseek-flash',judgmentReviewAllowed:true,toolCorrectionLimit:1,modelRecoveryLimit:0});
 for(const values of [{toolCorrectionLimit:6},{toolCorrectionLimit:-1},{toolCorrectionLimit:1.5},{toolCorrectionLimit:'5'},{modelRecoveryLimit:4},{modelRecoveryLimit:null},{modelRecoveryLimit:-1},{unknownRetry:3}])assert.throws(()=>read(values),{code:'WEB_ANALYSIS_CONFIGURATION_INVALID'});
});

test('EN01 effective policy enters configuration before first request; no credential or Provider read',async()=>{
 const projectRoot=root();let calls=0;
 const base={projectRoot,analysisModel:'deepseek-flash' as const,credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;return text();}};
 const make=(toolCorrectionLimit:number,modelRecoveryLimit:number)=>createPiProfessionalAgent({...base,toolCorrectionLimit,modelRecoveryLimit});
 const [normal,small,other]=await Promise.all([make(5,3).configuration(),make(1,3).configuration(),make(5,0).configuration()]);
 assert.notEqual(normal,small);assert.notEqual(normal,other);assert.equal(await createPiProfessionalAgent(base).configuration(),normal);assert.equal(calls,0);
 for(const bad of [{toolCorrectionLimit:6},{modelRecoveryLimit:4}])assert.throws(()=>createPiProfessionalAgent({...base,...bad}));
});

test('TC01/EN02 actual product Adapter accepts five native corrections and passive facts remain readable',async()=>{
 const projectRoot=root();let calls=0;
 const agent=createPiProfessionalAgent({projectRoot,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,toolCorrectionLimit:5,modelRecoveryLimit:3,fetch:async()=>++calls<=5?toolCall('missing-'+calls,'read',{}):text()});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const result=await agent.advance({identity,command_id:randomUUID(),purpose:'analysis',prompt:'Only synthetic interface exercise',system:'Do not claim computation',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[]});
 await agent.assertCompleted(identity,result.completion);assert.equal(calls,6);
 const facts=await agent.diagnostics(identity);assert.equal(facts.unconfirmed_effects,false);assert.equal(calls,6,'passive diagnostics cannot send');await agent.waitForIdle();
});

test('MR01/MR02 actual product persistence shares three faults across analysis and report',async()=>{
 const projectRoot=root();let calls=0,second=false;
 const agent=createPiProfessionalAgent({projectRoot,analysisModel:'deepseek-flash',credentials,authorizeWork:()=>true,toolCorrectionLimit:5,modelRecoveryLimit:3,fetch:async()=>{calls++;return !second&&calls===4?text():bad();}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const turn={identity,prompt:'Only synthetic interface exercise',system:'No business outcome',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[]};
 const main=await agent.advance({...turn,command_id:randomUUID(),purpose:'analysis'});await agent.assertCompleted(identity,main.completion);assert.equal(calls,4);
 second=true;await assert.rejects(()=>agent.advance({...turn,command_id:randomUUID(),purpose:'report_edit'}));assert.equal(calls,5,'one normal report request but no fourth extra');
 const facts=await agent.diagnostics(identity);assert.ok(facts.meter);assert.equal(facts.meter.model_attempts,5);assert.equal(facts.unconfirmed_effects,false);await agent.waitForIdle();
});
