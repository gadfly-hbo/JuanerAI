import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {writeFileSync,mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createRuntime,createSessionRuntime,createPiTransport,inspectWork} from 'pi-agent-runtime';

async function readLockFixture(unknownUsage=false){
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f03-')),work=randomUUID(),task=randomUUID(),state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});let calls=0,snapshot:()=>unknown=()=>assert.fail('real SDK lease required');
 state.bindBusinessWork({work_id:work,command_id:task,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
 const budgets={...state.budgets,claimUncapped:new Proxy(state.budgets.claimUncapped!,{async apply(target,thisArg,args){const lease=await Reflect.apply(target,thisArg,args);snapshot=()=>lease.snapshot();return lease;}})};
 const model={provider:'synthetic',id:'read-lock',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768},runtime=createRuntime({model,transport:createPiTransport({model,apiKey:'synthetic',fetch:async()=>{
  calls++;return new Response('data: '+JSON.stringify({id:'read-lock',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'Synthetic actual SDK result'},finish_reason:'stop'}],...(unknownUsage?{}:{usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }}),budgets,audit:state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'read-lock',protocolOverheadTokens:4096,safetyMarginTokens:8192}});
 let result:unknown;try{result=await runtime.runText({taskId:task,work:{ref:work,chain:task,limit:1},prompt:'Isolated read-lock fixture',limits:{cumulative:'unlimited',maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1}});}catch(error){result=error;}await runtime.waitForIdle(task);
 assert.equal(calls,1);if(!unknownUsage)assert.equal((result as {status:string}).status,'succeeded');
 else assert.ok(state.readAccounting(task)!.reservations.length>0,'actual missing final usage retains its native reservation');
 writeFileSync(join(root,'F03-SEED.json'),JSON.stringify({task,work,result,account:state.readAccounting(task),audit:state.readAudit(task)},null,2)+'\n');
 return {root,work,task,state,calls:()=>calls,snapshot:()=>snapshot()};
}

async function underReadLock<T>(root:string,tag:string,hold:300|1400,read:()=>T|Promise<T>):Promise<T>{
 const child=fork(new URL('../../fixtures/xanthil-desktop/sqlite-read-lock.mjs',import.meta.url),[root,String(hold),tag],{silent:true,timeout:5000}),messages:Record<string,number|string>[]=[];let stdout='',stderr='';child.stdout!.on('data',b=>stdout+=b);child.stderr!.on('data',b=>stderr+=b);child.on('message',m=>messages.push(m as Record<string,number|string>));
 const closed=once(child,'close');void closed.catch(()=>undefined);let value:T|undefined,error:unknown,started=0,finished=0;
 try{
  const [message]=await Promise.race([once(child,'message'),closed.then(()=>{throw Error('lock worker ended before lock: '+stderr);})]);assert.equal((message as {kind:string}).kind,'locked');
  started=Date.now();try{value=await read();}catch(e){error=e;}finished=Date.now();
 }finally{
  const [exit,signal]=await closed;writeFileSync(join(root,'LOCK-READER-'+tag+'.json'),JSON.stringify({pid:process.pid,child_pid:child.pid,started,finished,error_code:(error as {code?:string})?.code,error_reason:(error as {reason?:string})?.reason,messages,stdout,stderr,exit,signal},null,2)+'\n');assert.equal(exit,0,stderr);assert.equal(signal,null);
 }
 const released=messages.find(m=>m.kind==='released')!;assert.notEqual(child.pid,process.pid);assert.ok(released);assert.ok(started<Number(released.before_commit_at),'actual read must overlap the held SQLite lock');
 if(error)throw error;return value!;
}

for(const reader of ['snapshot','account','audit','work-account','work-audit','public-work'] as const)test('D006-R001-F03 real cross-process transient read lock: '+reader,{timeout:15000},async()=>{
 const f=await readLockFixture(),read=()=>reader==='snapshot'?f.snapshot():reader==='account'?f.state.readAccounting(f.task):reader==='audit'?f.state.readAudit(f.task):reader==='work-account'?f.state.readWorkAccounting(f.work):reader==='work-audit'?f.state.readWorkAudit(f.work):inspectWork(f.state.budgets.work!,{ref:f.work,chain:f.task,limit:1});
 const before=await read(),account=f.state.readAccounting(f.task),audit=f.state.readAudit(f.task);assert.deepEqual(await underReadLock(f.root,reader,300,read),before);assert.deepEqual(f.state.readAccounting(f.task),account);assert.deepEqual(f.state.readAudit(f.task),audit);assert.equal(f.calls(),1,'reading never sends another model request');
});

for(const unknownUsage of [false,true])test('D006-R001-F03 exhausted real lock fails closed without replay or reserve release '+unknownUsage,{timeout:15000},async()=>{
 const f=await readLockFixture(unknownUsage),account=f.state.readAccounting(f.task),audit=f.state.readAudit(f.task);
 await assert.rejects(()=>underReadLock(f.root,'exhausted',1400,()=>f.state.readAccounting(f.task)),{reason:'STATE_FAILED'});
 assert.deepEqual(f.state.readAccounting(f.task),account);assert.deepEqual(f.state.readAudit(f.task),audit);assert.equal(f.calls(),1);if(unknownUsage)assert.ok(account!.reservations.length>0);
});

test('D006-R001-F03 actual SQL failure is not an empty account/audit or success',()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f03-sql-'));mkdirSync(join(root,'.juanerai/pi-v060'),{recursive:true});new DatabaseSync(join(root,'.juanerai/pi-v060/state.sqlite')).close();
 const state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true}),task=randomUUID();
 for(const read of [()=>state.readAccounting(task),()=>state.readAudit(task),()=>state.readWorkAccounting(task)])assert.throws(read,{reason:'STATE_FAILED'});
});
test('D006-R001-F03 actual SQLite COMMIT can remove its journal during normal path inspection',{timeout:15000},async()=>{
 const f=await readLockFixture(),fs=(await import('node:fs')).default,{syncBuiltinESMExports}=await import('node:module'),journal=join(f.root,'.juanerai/pi-v060/state.sqlite-journal'),before=f.state.readAccounting(f.task),audit=f.state.readAudit(f.task);
 const exists=fs.existsSync,lstat=fs.lstatSync;let observed=0;
 const release=()=>{
  if(observed||!exists(journal))return;observed++;writeFileSync(join(f.root,'JOURNAL-ALLOW-COMMIT'),'allow',{flag:'wx',mode:0o600});
  const start=Date.now();while(!exists(join(f.root,'JOURNAL-COMMITTED'))){if(Date.now()-start>3000)throw Error('REAL_CHILD_COMMIT_MISSING');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}
  assert.equal(exists(journal),false);
 };
 try{
  // Delegate unchanged native results. Only schedule the other process's real
  // COMMIT between the actual metadata operations; no fake errors or retries.
  fs.existsSync=new Proxy(exists,{apply(target,self,args){const value=Reflect.apply(target,self,args);if(args[0]===journal&&value)release();return value;}});
  assert.ok(Reflect.set(fs,'lstatSync',new Proxy(lstat,{apply(target,self,args){if(args[0]===journal)release();return Reflect.apply(target,self,args);}})));syncBuiltinESMExports();
  assert.deepEqual(await underReadLock(f.root,'journal-race',300,()=>f.state.readAccounting(f.task)),before);assert.equal(observed,1);
 }finally{fs.existsSync=exists;assert.ok(Reflect.set(fs,'lstatSync',lstat));syncBuiltinESMExports();}
 assert.deepEqual(f.state.readAccounting(f.task),before);assert.deepEqual(f.state.readAudit(f.task),audit);assert.equal(f.calls(),1);
});

for(const kind of ['journal-symlink','database-hardlink'] as const)test('D006-R001-F03 existing unsafe path still refuses: '+kind,async()=>{
 const f=await readLockFixture(),fs=await import('node:fs'),file=join(f.root,'.juanerai/pi-v060/state.sqlite');
 if(kind==='journal-symlink')fs.symlinkSync(join(f.root,'unapproved-missing'),file+'-journal');else fs.linkSync(file,join(f.root,'database-extra-link'));
 assert.throws(()=>f.state.readAccounting(f.task),{reason:'STATE_FAILED'});assert.equal(f.calls(),1);
});

import * as persistence from '../../../adapters/agent-pi/persistent-runtime-state.ts';

test('D03: public persistent work survives reopening and shares one extra across legitimate purposes',async()=>{
 const create=Reflect.get(persistence,'createPiBusinessPersistence');
 assert.equal(typeof create,'function','the product must provide the approved public durable primitives');
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'d-work-'));
 const work=randomUUID(),a=randomUUID(),b=randomUUID();
 const authority={work_id:work,command_id:a,task_id:a,config_sha256:'a'.repeat(64),purposes:['analysis','report'],recovery_limit:1 as const};
 const state=create({projectRoot:root,isAuthorized:()=>true});
 state.bindBusinessWork(authority);
 state.bindBusinessWork({...authority,command_id:b,task_id:b});
 const model={provider:'synthetic',id:'d-persistence',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};
 let requests=0;
 const transport=createPiTransport({model,apiKey:'synthetic-not-a-credential',fetch:async()=>{
  requests++;
  if(requests!==2)return new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});
  return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'DONE'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 const options=(s:ReturnType<typeof create>)=>({model,transport,budgets:s.budgets,audit:s.audit,authorize:async()=>true,contextAdmission:{policyVersion:'d-offline-window',protocolOverheadTokens:4096,safetyMarginTokens:8192}});
 const request=(id:string)=>({taskId:id,work:{ref:work,chain:id,limit:1 as const},prompt:'Synthetic; no business data',limits:{cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1 as const}});
 const first=await createRuntime(options(state)).runText(request(a));
 assert.equal(first.status,'succeeded',JSON.stringify(first));assert.equal(requests,2);
 const reopened=create({projectRoot:root,isAuthorized:()=>true});
 const second=await createRuntime(options(reopened)).runText(request(b));
 assert.notEqual(second.status,'succeeded');assert.equal(requests,3,'the second normal request counts, a second recovery never sends');
 const facts=await inspectWork(reopened.budgets.work!,request(b).work);
 assert.equal(facts!.consumed,1);assert.equal(facts!.grants,1);assert.equal(facts!.knownExtraSent,1);
 assert.equal(reopened.readAccounting(a)!.usage.modelCalls,2);assert.equal(reopened.readAccounting(b)!.usage.modelCalls,1);
 assert.equal(reopened.readAudit(a).filter((x:unknown)=>Reflect.get(x as object,'kind')==='model.finished').length,2);
});

test('D03: NS-01 releases only L1 not-sent reservation; lawful L2 can send once, then no replay',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'d-ns01-'));
 const state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 const work=randomUUID(),a=randomUUID(),b=randomUUID(),signal=new AbortController().signal;
 for(const id of [a,b])state.bindBusinessWork({work_id:work,command_id:id,task_id:id,config_sha256:'a'.repeat(64),purposes:['analysis','report'],recovery_limit:1});
 const durable=state.budgets.work!;let replay:(()=>Promise<unknown>)|undefined,replayed=false;
 const wrapped={read:durable.read,atomic:async<T>(binding:Parameters<typeof durable.atomic>[0],transition:(record:import('pi-agent-runtime').JsonObject|undefined)=>{record:import('pi-agent-runtime').JsonObject;value:T},callSignal:AbortSignal)=>{
  const value=await durable.atomic(binding,transition,callSignal);
  if(binding.action==='settle'&&binding.work.chain===a)replay=()=>durable.atomic(binding,transition,callSignal);
  if(binding.action==='prepare'&&binding.work.chain===b&&(await inspectWork(durable,binding.work))?.grants===2){const before=await inspectWork(durable,binding.work);await replay!();assert.deepEqual(await inspectWork(durable,binding.work),before);replayed=true;}
  return value;
 }};
 const model={provider:'synthetic',id:'d-ns01',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};let requests=0,extraChecks=0;
 const transport=createPiTransport({model,apiKey:'synthetic',fetch:async()=>{requests++;if(requests<3)return new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'L2'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
 const make=()=>createRuntime({model,transport,budgets:{...state.budgets,work:wrapped},audit:state.audit,contextAdmission:{policyVersion:'d-window',protocolOverheadTokens:4096,safetyMarginTokens:8192},authorize:async action=>!(action.kind==='model'&&action.modelAttempt?.work.chain===a&&action.modelAttempt.kind==='recovery'&&++extraChecks===2)});
 const request=(id:string)=>({taskId:id,work:{ref:work,chain:id,limit:1 as const},prompt:'synthetic',signal,limits:{cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1 as const}});
 assert.notEqual((await make().runText(request(a))).status,'succeeded');
 const released=(await inspectWork(durable,request(a).work))!;assert.deepEqual([released.grants,released.consumed,released.unknown,released.reserved,released.knownExtraSent],[1,0,0,0,0]);assert.ok(released.stoppedChains.includes(a));assert.equal(requests,1);
 assert.equal((await make().runText(request(b))).status,'succeeded');
 const final=(await inspectWork(durable,request(b).work))!;assert.deepEqual([final.grants,final.consumed,final.unknown,final.reserved,final.knownExtraSent],[2,1,0,0,1]);assert.ok(final.stoppedChains.includes(a));assert.equal(replayed,true);assert.equal(requests,3);
 assert.notEqual((await make().runText(request(a))).status,'succeeded');assert.equal(requests,3);
});

test('D03: unauthorized bindings, changed roots and unsafe audit content never become durable grants or facts',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR!,'d-persist-gates-')),id=randomUUID();let allowed=true;
 const state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>allowed});
 const grant={work_id:randomUUID(),command_id:id,task_id:id,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1 as const};
 state.bindBusinessWork(grant);state.bindBusinessWork(grant);
 assert.throws(()=>state.bindBusinessWork({...grant,work_id:randomUUID()}));allowed=false;
 assert.throws(()=>state.bindBusinessWork({...grant,command_id:randomUUID()}));allowed=true;
 const event={version:'1.0' as const,taskId:id,runId:randomUUID(),sequence:1,kind:'run.started' as const,at:new Date().toISOString(),provider:'synthetic',model:'offline',contextVersions:{scope:'a'.repeat(64)}};
 await assert.rejects(()=>state.audit.append({...event,rawPrompt:'UNAPPROVED_SYNTHETIC_CONTENT'} as typeof event,new AbortController().signal));
 assert.deepEqual(state.readAudit(id),[]);
});

test('D06: production persistence supports sealed native Session, passive reopen and a later lawful prompt',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'session-')),task=randomUUID(),command=randomUUID();
 const state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 state.bindBusinessWork({work_id:task,command_id:command,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
 const model={provider:'synthetic',id:'d-session',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};let calls=0;
 const transport=createPiTransport({model,apiKey:'synthetic',fetch:async()=>{calls++;return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'SAVED'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
 const options={model,transport,budgets:state.budgets,audit:state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'d-window',protocolOverheadTokens:4096,safetyMarginTokens:8192},storage:state.sessionStorage(async()=>true,task),bindOperation:state.bindOperation,reconcile:async()=> 'ready' as const};
 const native=createSessionRuntime(options),session=await native.create();state.selectSession(task,'analysis',session.id);
 const request={sessionId:session.id,taskId:task,work:{ref:task,chain:command,limit:1 as const},prompt:'Synthetic isolated new Session',tools:[],limits:{cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1 as const}};
 const first=await native.run(request);assert.equal(first.status,'succeeded',JSON.stringify(first));assert.equal(calls,1);
 const before=state.readAccounting(task),audit=state.readAudit(task),reopened=createSessionRuntime(options);
 assert.equal((await reopened.list()).length,1);assert.ok((await reopened.history(session.id)).length);assert.equal(calls,1);assert.deepEqual(state.readAccounting(task),before);assert.deepEqual(state.readAudit(task),audit);
 const nextCommand=randomUUID();state.bindBusinessWork({work_id:task,command_id:nextCommand,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
 const second=await reopened.run({...request,work:{...request.work,chain:nextCommand},prompt:'A later lawful normal continuation'});assert.equal(second.status,'succeeded',JSON.stringify(second));assert.equal(calls,2);assert.equal(state.readAccounting(task)!.usage.modelCalls,2);
});

test('D01/D06: one public native Session accepts fixed purposes and new trusted normal commands without splitting its ledger',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'purposes-')),task=randomUUID(),first=randomUUID(),second=randomUUID();
 const state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 for(const command_id of [first,second])state.bindBusinessWork({work_id:task,task_id:task,command_id,config_sha256:'b'.repeat(64),purposes:['analysis','report_edit'],recovery_limit:1});
 const model={provider:'synthetic',id:'investigation',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};
 const report={...model,id:'report'};const seen:string[]=[];
 const transport=(selected:typeof model)=>createPiTransport({model:selected,apiKey:'synthetic',fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));seen.push(dto.model);assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'MODEL only'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 const options={model,transport:transport(model),purposes:[{id:'analysis',mode:'agent' as const,model,transport:transport(model)},{id:'report_edit',mode:'agent' as const,model:report,transport:transport(report)}],budgets:state.budgets,audit:state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'d-window',protocolOverheadTokens:4096,safetyMarginTokens:8192},storage:state.sessionStorage(async()=>true,task),bindOperation:state.bindOperation,reconcile:async()=> 'ready' as const};
 const engine=createSessionRuntime(options),session=await engine.create();state.selectSession(task,'analysis',session.id);
 const base={sessionId:session.id,taskId:task,prompt:'Synthetic current normal command',tools:[],limits:{cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1 as const}};
 for(const [purpose,chain] of [['analysis',first],['report_edit',second]]){
  const result=await engine.run({...base,purpose,work:{ref:task,chain:chain!,limit:1}});assert.equal(result.status,'succeeded',JSON.stringify(result));
 }
 assert.deepEqual(seen,['investigation','report']);assert.equal((await engine.list()).length,1);
 assert.equal(state.readAccounting(task)!.usage.modelCalls,2);assert.equal(state.readAccounting(task)!.reservations.length,0);
 const facts=await inspectWork(state.budgets.work!,{ref:task,chain:second,limit:1});assert.equal(facts!.grants,0);assert.equal(facts!.consumed,0);
});

test('D03/R4 real separate processes share the product SQLite public work account and send at most one recovery',{timeout:20000},async()=>{
 const {execFile}=await import('node:child_process'),{readFileSync,readdirSync}=await import('node:fs'),{promisify}=await import('node:util');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'work-')),work=randomUUID(),a=randomUUID(),b=randomUUID();
 await Promise.all([[a,b],[b,a]].map(([task,other])=>promisify(execFile)(process.execPath,['--experimental-strip-types','tests/fixtures/xanthil-desktop/newarch-work-process.mjs',root,work,task!,other!],{timeout:15000,env:process.env})));
 const one=JSON.parse(readFileSync(join(root,'result-'+a+'.json'),'utf8')),two=JSON.parse(readFileSync(join(root,'result-'+b+'.json'),'utf8'));assert.notEqual(one.pid,two.pid);assert.equal(one.calls+two.calls,3);assert.equal(readdirSync(root).filter(name=>name.startsWith('main-')).length,2);assert.equal(readdirSync(root).filter(name=>name.startsWith('extra-')).length,1);
 const reopened=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true}),facts=await inspectWork(reopened.budgets.work!,{ref:work,chain:a,limit:1});assert.equal(facts!.consumed,1);assert.equal(facts!.knownExtraSent,1);assert.equal(facts!.grants,1);assert.equal(one.account.owner,null);assert.equal(two.account.owner,null);
});

test('D03/ARL product atomic rejects a lost COMMIT acknowledgement and never lends its durable reservation to another chain',async()=>{
 const {DatabaseSync}=await import('node:sqlite'),root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'work-')),work=randomUUID(),a=randomUUID(),b=randomUUID(),state=persistence.createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});
 for(const task of [a,b])state.bindBusinessWork({work_id:work,command_id:task,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
 const model={provider:'synthetic',id:'ack-unknown',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};let calls=0,committed=false,inRecoveryClaim=false;const file=join(root,'.juanerai/pi-v060/state.sqlite'),exec=DatabaseSync.prototype.exec;
 const durable=state.budgets.work!,wrapped:import('pi-agent-runtime').WorkPersistence={read:durable.read,async atomic(binding,transition,signal){inRecoveryClaim=binding.action==='claim'&&calls===1;try{return await durable.atomic(binding,transition,signal);}finally{inRecoveryClaim=false;}}};
 const options={model,transport:createPiTransport({model,apiKey:'synthetic',fetch:async()=>{calls++;if(calls===1)return new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});throw Error('unexpected dispatch after unknown durable acknowledgement');}}),budgets:{...state.budgets,work:wrapped},audit:state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'d-ack',protocolOverheadTokens:4096,safetyMarginTokens:8192}},request=(task:string)=>({taskId:task,work:{ref:work,chain:task,limit:1 as const},prompt:'synthetic',limits:{cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1 as const}});
 try{
  DatabaseSync.prototype.exec=function(sql:string){if(!committed&&inRecoveryClaim&&sql==='COMMIT'&&this.prepare('PRAGMA database_list').all().some(row=>row.file===file)){Reflect.apply(exec,this,[sql]);committed=true;throw Error('synthetic ACK lost after durable COMMIT');}return Reflect.apply(exec,this,[sql]);};
  let result:unknown;try{result=await createRuntime(options).runText(request(a));}catch(error){result=error;}assert.ok(committed);assert.notEqual((result as {status?:string}).status,'succeeded');assert.equal(calls,1);
 }finally{DatabaseSync.prototype.exec=exec;}
 const facts=await inspectWork(state.budgets.work!,request(a).work);(await import('node:fs')).writeFileSync(join(root,'ACK-OBSERVED.json'),JSON.stringify({calls,committed,facts,account:state.readAccounting(a),audit:state.readAudit(a)},null,2));assert.ok(facts);assert.ok(facts!.reserved+facts!.unknown+facts!.consumed>0,'committed ownership survives the unknown ACK');
 const second=await createRuntime(options).runText(request(b));assert.notEqual(second.status,'succeeded');assert.equal(calls,1,'unknown durable ownership cannot become a new sending right');
});


/** Actual inode metadata at the native fs boundary replays the naturally captured
 * F01 race (diagnostic010). No manufactured Stats/errors, mock Store or SDK loop.
 * A real child COMMIT removes the opened journal; fstat observes that same inode
 * after unlink, as lstat naturally did in010. The next pathname lookup is native. */
async function detachedJournalCase(mode:'absent'|'regular'|'symlink'|'hardlink'|'directory'|'twice',action:'read'|'run'){
 const fs=(await import('node:fs')).default,{syncBuiltinESMExports}=await import('node:module'),f=await readLockFixture(),file=join(f.root,'.juanerai/pi-v060/state.sqlite'),journal=file+'-journal',canary=join(f.root,'F01-UNAPPROVED-CANARY.txt'),task=randomUUID();
 fs.writeFileSync(canary,'F01_UNAPPROVED_CANARY_MUST_NOT_CHANGE',{flag:'wx',mode:0o600});
 f.state.bindBusinessWork({work_id:f.work,command_id:task,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
 const child=fork(new URL('../../fixtures/xanthil-desktop/sqlite-journal-detach.mjs',import.meta.url),[f.root,mode],{silent:true,timeout:6000}),closed=once(child,'close');void closed.catch(()=>undefined);let stdout='',stderr='';child.stdout!.on('data',b=>stdout+=b);child.stderr!.on('data',b=>stderr+=b);
 const seedAccount=f.state.readAccounting(f.task),seedAudit=f.state.readAudit(f.task);let cleanupReleasedSecond=false;
 const original=fs.lstatSync,held:number[]=[],observations:{ino:number;nlink:number;mode:number;path:string;lookup:number}[]=[];let lookups=0,detached=0,dbBeforeReturn:Buffer|undefined,run:unknown,error:unknown,physical=0;
 const model={provider:'synthetic',id:'read-lock',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};
 try{
  const [ready]=await Promise.race([once(child,'message'),closed.then(()=>{throw Error('REAL_DETACH_CHILD_EARLY_EXIT '+stderr);})]);assert.equal((ready as {kind:string}).kind,'locked');assert.notEqual(child.pid,process.pid);
  assert.equal(Reflect.set(fs,'lstatSync',new Proxy(original,{apply(target,self,args){const actual=Reflect.apply(target,self,args);if(args[0]!==journal)return actual;lookups++;
   if(actual&&(detached===0||mode==='twice'&&detached===1)){
    assert.ok(actual.isFile());assert.equal(actual.nlink,1);const fd=fs.openSync(journal,'r');held.push(fd);const linked=fs.fstatSync(fd);assert.equal(linked.ino,actual.ino);assert.equal(linked.nlink,1);
    const cycle=detached++;fs.writeFileSync(join(f.root,'F01-ALLOW-COMMIT-'+cycle),'commit',{flag:'wx',mode:0o600});const until=Date.now()+3000;
    while(!fs.existsSync(join(f.root,'F01-COMMITTED-'+cycle))){if(Date.now()>until)throw Error('ACTUAL_F01_COMMIT_NOT_OBSERVED');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,2);}
    const removed=fs.fstatSync(fd);assert.equal(removed.ino,actual.ino);assert.equal(removed.nlink,0);assert.ok(removed.isFile());observations.push({ino:removed.ino,nlink:removed.nlink,mode:removed.mode,path:journal,lookup:lookups});dbBeforeReturn=fs.readFileSync(file);return removed;
   }
   if(actual)observations.push({ino:actual.ino,nlink:actual.nlink,mode:actual.mode,path:journal,lookup:lookups});return actual;
  }})),true);syncBuiltinESMExports();
  try{
   if(action==='read')run=f.state.readAccounting(f.task);
   else{
    const runtime=createRuntime({model,transport:createPiTransport({model,apiKey:'synthetic',fetch:async()=>{physical++;return new Response('data: '+JSON.stringify({id:'F01',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'normal new task'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}}),budgets:f.state.budgets,audit:f.state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'read-lock',protocolOverheadTokens:4096,safetyMarginTokens:8192}});
    run=await runtime.runText({taskId:task,work:{ref:f.work,chain:task,limit:1},prompt:'New synthetic lawful command',limits:{cumulative:'unlimited',maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1}});await runtime.waitForIdle(task);
   }
  }catch(e){error=e;}
 }finally{
  assert.equal(Reflect.set(fs,'lstatSync',original),true);syncBuiltinESMExports();for(const fd of held)fs.closeSync(fd);
  // A pre-fix guard may correctly refuse already at the first detached inode.
  // Finish only this test worker's pending net-zero SQL transaction; no runtime
  // operation or model/tool request is repeated. Record this as cleanup, not as
  // a second metadata observation delivered to the public guard.
  if(mode==='twice'&&detached===1&&!fs.existsSync(join(f.root,'F01-ALLOW-COMMIT-1'))){cleanupReleasedSecond=true;fs.writeFileSync(join(f.root,'F01-ALLOW-COMMIT-1'),'cleanup only',{flag:'wx',mode:0o600});}
  const [exit,signal]=await closed;fs.writeFileSync(join(f.root,'F01-DETACHED-'+mode+'-'+action+'.json'),JSON.stringify({root:f.root,parent_pid:process.pid,child_pid:child.pid,mode,action,lookups,detached,cleanupReleasedSecond,observations,physical_new_task:physical,run,error:error?{name:(error as Error).name,reason:(error as {reason?:string}).reason,message:(error as Error).message,stack:(error as Error).stack}:null,stdout,stderr,exit,signal,canary:fs.readFileSync(canary,'utf8')},null,2)+'\n');assert.equal(exit,0,stderr);assert.equal(signal,null);
 }
 assert.equal(fs.readFileSync(canary,'utf8'),'F01_UNAPPROVED_CANARY_MUST_NOT_CHANGE');assert.ok(mode==='twice'?detached>=1&&detached<=2:detached===1,'real unlinked inode must occur; indeterminate guards may refuse at the first or second observation, never retry indefinitely');
 if(mode==='absent'||mode==='regular'){
  assert.ifError(error);if(action==='read'){assert.deepEqual(run,f.state.readAccounting(f.task));assert.equal(physical,0);}
  else{assert.equal((run as {status:string}).status,'succeeded',JSON.stringify(run));assert.equal(physical,1);assert.equal(f.state.readAccounting(task)!.owner,null);assert.equal(f.state.readAccounting(task)!.reservations.length,0);assert.equal(f.state.readAccounting(task)!.usage.modelCalls,1);const fact=await inspectWork(f.state.budgets.work!,{ref:f.work,chain:task,limit:1});assert.deepEqual([fact!.consumed,fact!.knownExtraSent,fact!.grants],[0,0,0]);}
 }else{
  assert.equal(error,undefined);assert.notEqual((run as {status:string}).status,'succeeded');assert.equal((run as {reason:string}).reason,'STATE_FAILED');assert.equal(physical,0,'unsafe/indeterminate fresh path must refuse before any new physical request');assert.deepEqual((run as {modelAttempts:unknown[]}).modelAttempts,[]);assert.ok(dbBeforeReturn);if(mode==='twice'){assert.equal(f.state.readAccounting(task),undefined);assert.deepEqual(f.state.readAudit(task),[]);assert.deepEqual(f.state.readAccounting(f.task),seedAccount);assert.deepEqual(f.state.readAudit(f.task),seedAudit);if(detached===2)assert.notEqual(observations[0]!.ino,observations[1]!.ino);}else assert.deepEqual(fs.readFileSync(file),dbBeforeReturn,'no budget/audit/work write after the last actual COMMIT can escape this failed path guard');
 }
}

test('D008-F01: actual detached journal inode cannot reject a lawful public read',{timeout:12000},()=>detachedJournalCase('absent','read'));
for(const mode of ['absent','regular','symlink','hardlink','directory','twice'] as const)test('D008-F01: actual detached journal then '+mode+' pathname before native first send',{timeout:12000},()=>detachedJournalCase(mode,'run'));
test('D008-F01: detached main database remains forbidden and cannot be recreated or send',{timeout:12000},async()=>{
 const f=await readLockFixture(),fs=(await import('node:fs')).default,{syncBuiltinESMExports}=await import('node:module'),file=join(f.root,'.juanerai/pi-v060/state.sqlite'),original=fs.lstatSync,task=randomUUID();
 f.state.bindBusinessWork({work_id:f.work,command_id:task,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});let detached=0,physical=0,fd:number|undefined,result:unknown;
 try{
  assert.equal(Reflect.set(fs,'lstatSync',new Proxy(original,{apply(target,self,args){const s=Reflect.apply(target,self,args);if(args[0]===file&&s&&!detached){fd=fs.openSync(file,'r');fs.unlinkSync(file);const unlinked=fs.fstatSync(fd);assert.equal(unlinked.ino,s.ino);assert.equal(unlinked.nlink,0);detached++;return unlinked;}return s;}})),true);syncBuiltinESMExports();
  const model={provider:'synthetic',id:'read-lock',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768},runtime=createRuntime({model,transport:createPiTransport({model,apiKey:'synthetic',fetch:async()=>{physical++;throw Error('UNSAFE_MAIN_DATABASE_SENT');}}),budgets:f.state.budgets,audit:f.state.audit,authorize:async()=>true,contextAdmission:{policyVersion:'read-lock',protocolOverheadTokens:4096,safetyMarginTokens:8192}});
  result=await runtime.runText({taskId:task,work:{ref:f.work,chain:task,limit:1},prompt:'Unsafe new synthetic command',limits:{cumulative:'unlimited',maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1}});await runtime.waitForIdle(task);
 }finally{assert.equal(Reflect.set(fs,'lstatSync',original),true);syncBuiltinESMExports();if(fd!==undefined){fs.writeFileSync(join(f.root,'F01-UNLINKED-MAIN-STATIC-COPY.sqlite'),fs.readFileSync(fd),{flag:'wx',mode:0o600});fs.closeSync(fd);}fs.writeFileSync(join(f.root,'F01-MAIN-DETACHED-RESULT.json'),JSON.stringify({result,physical,detached,original_main_exists:fs.existsSync(file)}));}
 assert.equal(detached,1);assert.equal(physical,0);assert.equal((result as {reason:string}).reason,'STATE_FAILED');assert.equal(fs.existsSync(file),false,'guard cannot recreate/reset the detached main database');
});
