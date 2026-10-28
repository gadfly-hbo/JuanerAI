import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import * as adapter from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {createAnalysisFiles} from '../../../adapters/agent-pi/analysis-files.ts';

test('RF01/D05: native Task files preserve complete UTF8, named reports and read-only source authority',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'report-')),controller=new AbortController(),signal=controller.signal;let authorized=true;
 const config={cwd:root,reportPath:'draft/report-test.json',signal,authorize:()=>authorized,materials:[{path:join(root,'020_clean/source.txt'),content:'approved original'}]};
 const files=await createAnalysisFiles(config),tool=(name:string)=>files.tools.find(t=>t.name===name)!;
 const content=JSON.stringify({section:'合成内容'.repeat(3000),tail:'报告尾部'});
 await tool('write').execute({path:'reports/analyst-chosen.md',content},signal);
 assert.equal(readFileSync(join(root,'reports/analyst-chosen.md'),'utf8'),content);
 await tool('edit').execute({path:'reports/analyst-chosen.md',edits:[{oldText:'报告尾部',newText:'局部编辑后的完整尾部'}]},signal);
 assert.equal(readFileSync(join(root,'reports/analyst-chosen.md'),'utf8'),content.replace('报告尾部','局部编辑后的完整尾部'));
 const reopened=await createAnalysisFiles(config);
 const readback=await reopened.tools.find(t=>t.name==='read')!.execute({path:'reports/analyst-chosen.md',offset:1,limit:1},signal);
 assert.ok(JSON.stringify(readback).includes('合成内容'));
 await tool('write').execute({path:'draft/report-test.json',content},signal);
 assert.deepEqual(await files.report(),{text:content,sha256:(await import('node:crypto')).createHash('sha256').update(content).digest('hex')});
 await tool('write').execute({path:'draft/analysis.py',content:'# unexecuted draft'},signal);
 assert.ok(JSON.stringify(await tool('read').execute({path:'draft/analysis.py'},signal)).includes('# unexecuted draft')); 
 await assert.rejects(()=>tool('write').execute({path:'draft/report-test.json',content:'x'.repeat(1_048_577)},signal));
 assert.equal((await files.report()).text,content);
 assert.ok(JSON.stringify(await tool('read').execute({path:join(root,'020_clean/source.txt')},signal)).includes('approved original'));
 await assert.rejects(()=>tool('write').execute({path:join(root,'020_clean/source.txt'),content:'replacement'},signal));
 const canary=join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'canary-'+randomUUID());writeFileSync(canary,'unchanged');symlinkSync(canary,join(root,'linked.md'));
 await assert.rejects(()=>tool('write').execute({path:'linked.md',content:'outside'},signal));
 await assert.rejects(()=>tool('write').execute({path:'../outside.md',content:'outside'},signal));
 assert.equal(readFileSync(canary,'utf8'),'unchanged');
 authorized=false;await assert.rejects(()=>tool('write').execute({path:'reports/revoked.md',content:'revoked'},signal));
 authorized=true;controller.abort();await assert.rejects(()=>tool('read').execute({path:join(root,'020_clean/source.txt')},signal));
 assert.ok(!files.tools.some(t=>['bash','exec'].includes(t.name)));
});

test('AP01-02/03: native files have no virtual fallback and reject replacement, another Task, symlinks and read-only writes',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'absolute-guards-')),path=join(root,'020_clean/source/owned.txt'),controller=new AbortController();
 const files=await createAnalysisFiles({cwd:root,reportPath:'060_reports/draft.md',signal:controller.signal,authorize:()=>true,materials:[{path,content:'current authorized data'}]}),read=files.tools.find(t=>t.name==='read')!,write=files.tools.find(t=>t.name==='write')!;
 assert.match(JSON.stringify(await read.execute({path},controller.signal)),/current authorized data/);
 await assert.rejects(()=>read.execute({path:'source/owned.txt'},controller.signal),'relative virtual alias is not an alternative data source');
 const other=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'other-task-')),foreign=join(other,'private.txt');writeFileSync(foreign,'outside scope');
 await assert.rejects(()=>read.execute({path:foreign},controller.signal));
 await assert.rejects(()=>write.execute({path,content:'replacement'},controller.signal));
 writeFileSync(path,'changed since publication');await assert.rejects(()=>read.execute({path},controller.signal));
 (await import('node:fs')).unlinkSync(path);symlinkSync(foreign,path);await assert.rejects(()=>read.execute({path},controller.signal));
 assert.equal(readFileSync(foreign,'utf8'),'outside scope');
 controller.abort();await assert.rejects(()=>read.execute({path},controller.signal));
});

test('AP01-01/03: clean directory accepts Pi-owned derived drafts while authorized input views remain immutable',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'clean-draft-')),signal=new AbortController().signal,source=join(root,'020_clean/source/table.txt');
 const files=await createAnalysisFiles({cwd:root,reportPath:'060_reports/draft.md',signal,authorize:()=>true,materials:[{path:source,content:'authorized source view'}]}),write=files.tools.find(t=>t.name==='write')!,read=files.tools.find(t=>t.name==='read')!,draft=join(root,'020_clean/agent-notes.csv');
 await write.execute({path:draft,content:'unverified_note\nneeds checking\n'},signal);
 assert.match(JSON.stringify(await read.execute({path:draft},signal)),/needs checking/);
 await assert.rejects(()=>write.execute({path:source,content:'replace approved data'},signal));
 assert.equal(readFileSync(source,'utf8'),'authorized source view');
});

test('RF01: actual public Agent writes a freely named report and another purpose reads it without local computation',async()=>{
 const {offlineCredentials}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'files-agent-'));let calls=0;
 const report='# Actual native file contract\nUnverified synthetic fixture.\n';
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async(_url,init)=>{
  const body=JSON.parse(String(init!.body));calls++;
  const call=calls===1?{name:'write',args:{path:'reports/freely-named.md',content:report}}:calls===3?{name:'read',args:{path:'reports/freely-named.md'}}:null;
  if(calls===4)assert.ok(JSON.stringify(body.messages).includes('Actual native file contract'));
  const delta=call?{role:'assistant',tool_calls:[{index:0,id:'native-file-'+calls,type:'function',function:{name:call.name,arguments:JSON.stringify(call.args)}}]}:{role:'assistant',content:calls===2?'Analysis artifact written.':report};
  const item={id:'native-file',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:call?'tool_calls':'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}};
  return new Response('data: '+JSON.stringify(item)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const turn={identity,work_id:identity.task_id,prompt:'Synthetic native file behavior',system:'No computation',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[]};
 const analysis=await agent.advance({...turn,command_id:randomUUID(),purpose:'analysis'});await agent.assertCompleted(identity,analysis.completion);
 const formed=await agent.advance({...turn,command_id:randomUUID(),purpose:'report_edit'});await agent.assertCompleted(identity,formed.completion);
 assert.equal(formed.text,report);assert.equal(calls,4);assert.equal((await agent.diagnostics(identity)).unconfirmed_effects,false);await agent.waitForIdle();
});

test('D01/D02: real product Agent uses the exact public SDK; one schema reaches DTO, native preparation and executor',async()=>{
 const create=adapter.createPiProfessionalAgent;assert.equal(typeof create,'function','normal product assembly needs its thin public SDK Adapter');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'agent-'));let calls=0,effects=0;
 const schema={type:'object',properties:{choice:{type:'string',enum:['order','refund']},groups:{type:'array',items:{type:'object',properties:{name:{type:'string'},column:{anyOf:[{type:'null'},{type:'string'}]}},required:['name','column'],additionalProperties:false}}},required:['choice','groups'],additionalProperties:false};
 const agent=create({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>true,credentials:{withCredential:async(_provider,run)=>run({key:'synthetic',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',model:'mimo-v2.6-flash',provider:'xiaomi-token-plan-cn'})},fetch:async(_url,init)=>{
  calls++;const dto=JSON.parse(String(init!.body));assert.equal(dto.model,'mimo-v2.6-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  assert.deepEqual(dto.tools.find((x:any)=>x.function.name==='select_scope').function.parameters,schema);
  const delta=calls===1?{role:'assistant',tool_calls:[{index:0,id:'selected',type:'function',function:{name:'select_scope',arguments:JSON.stringify({choice:'order',groups:[{name:'all',column:null}]})}}]}:{role:'assistant',content:'Synthetic done'};
  return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:calls===1?'tool_calls':'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const turn={identity,command_id:identity.operation_id,purpose:'analysis' as const,prompt:'Synthetic scope; no business data',system:'Choose a permitted scope',signal:new AbortController().signal,authorize:()=>true,capabilities:async()=>[{name:'select_scope',description:'Select an explicit business scope',effect:'write' as const,parameters:schema,execute:async(args:unknown)=>{assert.deepEqual(args,{choice:'order',groups:[{name:'all',column:null}]});effects++;return {accepted:true,saved:false};}}]};
 const result=await agent.advance(turn);
 assert.equal(result.text,'Synthetic done');assert.equal(calls,2);assert.equal(effects,1);
 await agent.assertCompleted(identity,result.completion);
 for(const changed of [{scope_sha256:'b'.repeat(64)},{task_id:randomUUID()},{revision:'2'}])await assert.rejects(()=>agent.assertCompleted({...identity,...changed},result.completion),{code:'EFFECT_UNCONFIRMED'});
 await assert.rejects(()=>agent.assertCompleted({...identity,config_sha256:'b'.repeat(64)},result.completion),{code:'CONFIGURATION_CHANGED'});
 for(const changed of [{work_id:randomUUID()},{command_id:randomUUID()}])await assert.rejects(()=>agent.assertCompleted(identity,{...result.completion,...changed}),{code:'EFFECT_UNCONFIRMED'});
 const conversation=await agent.conversation({identity,purpose:'analysis',command:{kind:'observe'},authorize:()=>true,signal:new AbortController().signal});
 assert.equal(conversation.availability,'available');assert.equal(conversation.busy,false);
 assert.ok(conversation.messages);assert.ok(conversation.messages.some((m:{role:string;text:string})=>m.role==='assistant'&&m.text==='Synthetic done'));
 assert.equal(calls,2,'passive conversation observation cannot call the Provider');
 await assert.rejects(()=>agent.assertCompleted(identity,{...result.completion,id:randomUUID()}),{code:'EFFECT_UNCONFIRMED'});
 const diagnostics=await agent.diagnostics(identity);assert.ok(diagnostics.meter);assert.equal(diagnostics.meter.model_attempts,2);assert.equal(diagnostics.meter.unconfirmed_output_tokens,0);
 const observed=diagnostics.observations.filter((item:any)=>item.kind==='model');
 assert.deepEqual(observed.map((item:any)=>item.input_tokens),[{kind:'known',value:'3'},{kind:'known',value:'3'}]);
 assert.deepEqual(observed.map((item:any)=>item.output_tokens),[{kind:'known',value:'2'},{kind:'known',value:'2'}]);
 await agent.waitForIdle();
 await assert.rejects(()=>agent.advance(turn),{code:'AUTHORITY_REQUIRED'});
 assert.equal(calls,2,'the same approved business command cannot acquire a fresh native operation');
});

test('D08/SDK040-02 explicit deferred input exposes a native acknowledgement and can be withdrawn without model IO',{timeout:10000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'agent-'));let entered!:()=>void,release!:()=>void,calls=0;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>true,credentials:{withCredential:async(_provider,run)=>run({key:'offline-queue-key-never-in-messages',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',model:'mimo-v2.6-flash',provider:'xiaomi-token-plan-cn'})},fetch:async()=>{calls++;entered();await gate;return new Response('data: '+JSON.stringify({id:'queued',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'synthetic settled'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()},signal=new AbortController().signal,scope={identity,purpose:'analysis' as const,authorize:()=>true,signal};
 const running=agent.advance({...scope,command_id:identity.operation_id,prompt:'synthetic',system:'synthetic',capabilities:async()=>[]});
 try{await began;const queued=await agent.conversation({...scope,command:{kind:'defer',text:'合成的下一条用户指令'}});assert.equal(calls,1);assert.ok(queued.accepted_input?.id,'explicit input must return the public native queue acknowledgement, even when snapshot availability is unknown');
  await agent.conversation({...scope,command:{kind:'withdraw',id:queued.accepted_input!.id}});assert.equal(calls,1);release();await running;await agent.waitForIdle();assert.equal(calls,1);
 }finally{release();await running.catch(()=>undefined);await agent.waitForIdle();}
});

test('D08 concurrent denied admission cannot replace the actual owner native control/settlement handle',{timeout:10000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'agent-handles-'));let calls=0,entered!:()=>void,release!:()=>void;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),controller=new AbortController();
 const {offlineCredentials,offlineResponse}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>true,credentials:offlineCredentials,fetch:async()=>{calls++;entered();await gate;return offlineResponse(calls);}}),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()},turn={identity,command_id:identity.operation_id,purpose:'analysis' as const,prompt:'owned first operation',system:'owned scope',capabilities:async()=>[],authorize:()=>true,signal:controller.signal};
 const first=agent.advance(turn);let rejected:unknown;void first.catch(error=>{rejected=error;});
 try{await began;await assert.rejects(()=>agent.advance({...turn,command_id:randomUUID(),signal:new AbortController().signal}));assert.equal(calls,1);
  const wait=agent.waitForIdle();let idle=false;void wait.then(()=>idle=true);await new Promise<void>(r=>setImmediate(r));assert.equal(idle,false,'a rejected concurrent SDK instance is not the issued owner settlement handle');
  const scope={identity,purpose:'analysis' as const,authorize:()=>true,signal:new AbortController().signal},queued=await agent.conversation({...scope,command:{kind:'defer',text:'owned deferred instruction'}});assert.ok(queued.accepted_input?.id);await agent.conversation({...scope,command:{kind:'withdraw',id:queued.accepted_input.id}});
  controller.abort();await first.catch(()=>undefined);assert.ok(rejected);await new Promise<void>(r=>setImmediate(r));assert.equal(idle,false);assert.equal((await agent.diagnostics(identity)).unconfirmed_effects,true);
  release();await wait;assert.equal(idle,true);assert.equal(calls,1);assert.equal((await agent.diagnostics(identity)).meter!.model_attempts,1);
 }finally{release();controller.abort();await first.catch(()=>undefined);await agent.waitForIdle();}
});

test('D08 actual durable run admission without a readable account is observed UNKNOWN, never not-started',async()=>{
 const {createPiBusinessPersistence}=await import('../../../adapters/agent-pi/persistent-runtime-state.ts'),{offlineCredentials}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts'),{createHash}=await import('node:crypto');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'audit-')),agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>assert.fail('no provider operation')}),id=randomUUID(),identity={task_id:id,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const h=createHash('sha256').update(JSON.stringify({task:id,revision:'1',purpose:'analysis'})).digest('hex'),native=h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32),state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 state.bindBusinessWork({work_id:id,command_id:randomUUID(),task_id:native,config_sha256:identity.config_sha256,purposes:['analysis'],recovery_limit:1});
 await state.audit.append({version:'1.0',taskId:native,runId:randomUUID(),sequence:1,kind:'run.started',at:new Date().toISOString(),provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash',contextVersions:{scope:identity.scope_sha256,configuration:identity.config_sha256}},new AbortController().signal);
 const facts=await agent.diagnostics(identity,'analysis');assert.equal(facts.recording,'observed');assert.equal(facts.unconfirmed_effects,true);assert.equal(facts.meter,undefined);await agent.waitForIdle();
});

test('D006-F01 missing native context cannot qualify an actually completed public SDK operation',async()=>{
 const {createPiBusinessPersistence}=await import('../../../adapters/agent-pi/persistent-runtime-state.ts'),{createSessionRuntime,createPiTransport}=await import('pi-agent-runtime'),{createHash}=await import('node:crypto'),{offlineCredentials,offlineResponse}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'missing-context-')),agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>assert.fail('qualification never sends')}),state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()},command=randomUUID();
 // Same deterministic business-to-SDK reference format. The actual operation
 // below is emitted by the public fixed SDK, not a fabricated completion/audit.
 const ref=(task:string)=>{const h=createHash('sha256').update(JSON.stringify({task,revision:identity.revision,purpose:'analysis'})).digest('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);},task=ref(identity.task_id),chain=ref(command),model={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-flash',protocol:'openai-completions' as const,endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:32768};let calls=0;
 state.bindBusinessWork({work_id:identity.task_id,command_id:chain,task_id:task,config_sha256:identity.config_sha256,purposes:['analysis'],recovery_limit:1});
 const transport=createPiTransport({model,apiKey:'synthetic',fetch:async()=>offlineResponse(++calls)}),native=createSessionRuntime({model,transport,purposes:[{id:'analysis',mode:'agent',model,transport,tools:[]}],budgets:state.budgets,audit:state.audit,authorize:async()=>true,contextAdmission:adapter.professionalRequestAdmission,storage:state.sessionStorage(async()=>true,task),bindOperation:state.bindOperation,reconcile:async()=> 'ready'}),session=await native.create();state.selectSession(task,'analysis',session.id);
 const result=await native.run({sessionId:session.id,taskId:task,purpose:'analysis',work:{ref:identity.task_id,chain,limit:1},prompt:'Synthetic missing context counterexample',tools:[],limits:adapter.professionalAgentLimits,modelRecovery:{extraAttempts:1}});await native.waitForIdle(task);
 assert.equal(result.status,'succeeded',JSON.stringify(result));assert.equal(calls,1);assert.equal(state.readAccounting(task)!.reservations.length,0);assert.deepEqual(state.readAudit(task).find(e=>e.kind==='run.finished')!.contextVersions,{});
 await assert.rejects(()=>agent.assertCompleted(identity,{id:result.runId,command_id:command,work_id:identity.task_id,purpose:'analysis'}),{code:'EFFECT_UNCONFIRMED'});assert.equal(calls,1);
});

test('D006-F01 actual pending and unknown-usage native runs cannot qualify publication',async()=>{
 const {createPiBusinessPersistence}=await import('../../../adapters/agent-pi/persistent-runtime-state.ts'),{offlineCredentials}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'unsettled-context-'));let entered!:()=>void,release!:()=>void,calls=0;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,fetch:async()=>{calls++;entered();await gate;return new Response('data: '+JSON.stringify({id:'unknown-usage',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'MODEL only; missing final usage'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()},command=randomUUID(),state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 const running=agent.advance({identity,command_id:command,work_id:identity.task_id,purpose:'analysis',prompt:'Synthetic unsettled request',system:'Synthetic',capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal});void running.catch(()=>undefined);
 try{await began;const started=state.readWorkAudit(identity.task_id).find(e=>e.kind==='run.started')!,completion={id:started.runId,command_id:command,work_id:identity.task_id,purpose:'analysis' as const};
  await assert.rejects(()=>agent.assertCompleted(identity,completion),{code:'EFFECT_UNCONFIRMED'});release();await running.catch(()=>undefined);await agent.waitForIdle();
  assert.ok(state.readAccounting(started.taskId)!.reservations.length>0,'unknown final usage remains reserved');await assert.rejects(()=>agent.assertCompleted(identity,completion),{code:'EFFECT_UNCONFIRMED'});assert.equal(calls,1);
 }finally{release();await running.catch(()=>undefined);await agent.waitForIdle();}
});

test('RV01/03: fresh revision route writes complete Markdown through actual Adapter and fixed SDK, without changing initial report route',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'rv-'));let sends=0,target='';
 const body='# 修订报告\n\n仅当前已提供样本；证据不足部分仍未核验。\n\n'+('正确有用内容。\n'.repeat(2000))+'报告完整尾部';
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,businessPolicy:{judgmentReview:true,metricDisclosure:false,postReportReview:true},fetch:async(_url,init)=>{
  sends++;const dto=JSON.parse(String(init!.body));assert.equal(dto.model,'mimo-v2.6-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  assert.equal(dto.tools.some((t:any)=>t.function.name==='bash'),false);
  for(const name of ['read','write','edit'])assert.ok(dto.tools.some((t:any)=>t.function.name===name));
  target=/本次指定成稿路径：([^。]+)。/.exec(JSON.stringify(dto.messages))![1];
  return sends===1?offlineResponse(sends,[{name:'write',args:{path:target,content:body}}]):offlineResponse(sends,[],'文件已形成；交由产品保存。');
 }});
 assert.deepEqual(agent.recipient('report_edit'),{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro'});
 assert.deepEqual(agent.recipient('report_revision'),{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const response=await agent.advance({identity,command_id:randomUUID(),purpose:'report_revision',isolated:true,prompt:'修订本版报告，保留限制。',system:'只修订已有报告，不新增计算或独立核验。',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[]});
 try{await agent.assertCompleted(identity,response.completion);assert.equal(response.completion.purpose,'report_revision');assert.equal(response.text,body);assert.equal(readFileSync(target,'utf8'),body);assert.equal(sends,2);const facts=await agent.diagnostics(identity);assert.equal(facts.meter?.model_attempts,2);assert.equal(facts.meter?.unconfirmed_output_tokens,0);assert.equal(facts.unconfirmed_effects,false);}finally{await agent.waitForIdle();}
});


test('RV01/03/04: native ambiguous edits still stop after five corrections; written draft effects and usage cannot be called a saved R1',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'rvbad-'));let calls=0,path='';
 const original='# 草稿\n\n重复文本\n\n重复文本';
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:()=>true,businessPolicy:{judgmentReview:true,metricDisclosure:false,postReportReview:true},fetch:async(_url,init)=>{
  calls++;const dto=JSON.parse(String(init!.body));path=/本次指定成稿路径：([^。]+)。/.exec(JSON.stringify(dto.messages))![1];
  return offlineResponse(calls,[calls===1?{name:'write',args:{path,content:original}}:{name:'edit',args:{path,edits:[{oldText:'重复文本',newText:'修改文本'}]}}]);
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 await assert.rejects(()=>agent.advance({identity,command_id:randomUUID(),purpose:'report_revision',isolated:true,prompt:'只修订当前报告',system:'不自签通过',capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal}),{code:'TOOL_FAILED'});
 await agent.waitForIdle();assert.equal(calls,7,'one initial write, six native edit refusals, no hidden extra send');
 assert.equal(readFileSync(path,'utf8'),original);
 const diagnostics=await agent.diagnostics(identity);assert.equal(diagnostics.meter!.model_attempts,7);assert.equal(diagnostics.meter!.unconfirmed_output_tokens,0);
 assert.equal(diagnostics.last_run!.code,'UNKNOWN','settled model usage does not certify the parent write effect delivered');
});

test('RV01/04: revision uses the same durable work recovery balance and has no new fallback or fresh fault quota',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'rvbudget-'));let calls=0;
 const unavailable=()=>new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});
 const agent=adapter.createPiProfessionalAgent({projectRoot:root,analysisModel:'deepseek-flash',credentials:{withCredential:async(provider,run)=>provider==='deepseek'?run({provider,model:'deepseek-flash',endpoint:'https://api.deepseek.com',key:'synthetic-revision-quota-only'}):offlineCredentials.withCredential(provider,run)},authorizeWork:()=>true,businessPolicy:{judgmentReview:true,metricDisclosure:false,postReportReview:true},fetch:async()=>++calls===4?offlineResponse(calls,[],'本次正常观察完成。'):unavailable()});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 const base={identity,prompt:'合成用途核账',system:'不形成独立核验',capabilities:async()=>[],authorize:()=>true,signal:new AbortController().signal};
 await agent.advance({...base,command_id:randomUUID(),purpose:'analysis'});
 await assert.rejects(()=>agent.advance({...base,command_id:randomUUID(),purpose:'report_revision',isolated:true}));
 await agent.waitForIdle();assert.equal(calls,5,'a normal revision request is counted, no fourth fault send is granted');
 assert.equal((await agent.diagnostics(identity)).meter!.model_attempts,5);
});
