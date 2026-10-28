import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createRuntime,createSessionRuntime,createPiTransport,createExecutionTools,ToolOutputFailure,RuntimeFault,type Tool,type AuditEvent} from 'pi-agent-runtime';
import {createPiBusinessPersistence} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {createPiProfessionalAgent,professionalAgentLimits as limits,professionalRequestAdmission as admission} from '../../../adapters/agent-pi/professional-agent.ts';

const model={provider:'synthetic',id:'shared-current',protocol:'openai-completions' as const,endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};
function fresh(authorized:Parameters<typeof createPiBusinessPersistence>[0]['isAuthorized']=()=>true){
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'shared-')),task=randomUUID(),chain=randomUUID(),work={ref:task,chain,limit:1 as const},grant={work_id:task,command_id:chain,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1 as const},state=createPiBusinessPersistence({projectRoot:root,isAuthorized:authorized});state.bindBusinessWork(grant);
 return {root,task,chain,work,grant,state,file:join(root,'.juanerai/pi-v060/state.sqlite'),reopen:()=>createPiBusinessPersistence({projectRoot:root,isAuthorized:authorized})};
}
function reply(name?:string,args:Record<string,unknown>={},usage={prompt_tokens:7,completion_tokens:3,total_tokens:10}){
 const delta=name?{role:'assistant',tool_calls:[{index:0,id:'tool',type:'function',function:{name,arguments:JSON.stringify(args)}}]}:{role:'assistant',content:'owned synthetic result'};
 return new Response('data: '+JSON.stringify({id:'synthetic',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:name?'tool_calls':'stop'}],usage})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
async function native(f:ReturnType<typeof fresh>,fetch:typeof globalThis.fetch,tools:Tool[]){
 const transport=createPiTransport({model,apiKey:'offline-key-not-in-prompt',fetch});
 const engine=createSessionRuntime({model,transport,purposes:[{id:'analysis',mode:'agent',model,transport,tools}],budgets:f.state.budgets,audit:f.state.audit,storage:f.state.sessionStorage(async()=>true,f.task),bindOperation:f.state.bindOperation,contextAdmission:admission,authorize:async()=>true,reconcile:async()=> 'ready'}),session=await engine.create();f.state.selectSession(f.task,'analysis',session.id);
 return {engine,session,request:{taskId:f.task,work:f.work,sessionId:session.id,purpose:'analysis',prompt:'new owned synthetic input',limits,modelRecovery:{extraAttempts:1 as const},contextVersions:{scope:'b'.repeat(64),configuration:'a'.repeat(64),revision:'1'}}};
}

test('R2-STORE-01 current: known zero settles exactly once; acknowledged snapshots are detached and persisted',async()=>{
 const f=fresh(),lease=await f.state.budgets.claimUncapped!(f.task,'run','fixed',limits),n=await lease.reserveModelUpTo!(16);assert.equal(lease.snapshot().reservedOutputTokens,16);assert.ok(lease.recordModelUsage);
 await lease.recordModelUsage(n,{inputTokens:5,outputTokens:0,final:true});const copy=lease.snapshot();assert.equal(copy.inputTokens,5);assert.equal(copy.outputTokens,0);assert.equal(copy.reservedOutputTokens,0);copy.outputTokens=999;assert.equal(lease.snapshot().outputTokens,0);
 await assert.rejects(lease.recordModelUsage(n,{inputTokens:5,outputTokens:0,final:true}),{reason:'STATE_FAILED'});await lease.release(0);assert.equal(f.reopen().readAccounting(f.task)!.usage.modelCalls,1);assert.equal(f.reopen().readAccounting(f.task)!.reservations.length,0);
});

test('R2-STORE-01/SDK041-01 current: partial/over-limit observations preserve unknown reserve and prevent reopening',async()=>{
 const f=fresh(),lease=await f.state.budgets.claimUncapped!(f.task,'run','fixed',limits),n=await lease.reserveModelUpTo!(16);assert.ok(lease.recordModelUsage);await lease.recordModelUsage(n,{inputTokens:7,outputTokens:20,final:false});assert.equal(lease.snapshot().inputTokens,7);assert.equal(lease.snapshot().outputTokens,20);assert.equal(lease.snapshot().reservedOutputTokens,16);await lease.release(0);
 const account=f.reopen().readAccounting(f.task)!;assert.equal(account.usage.outputTokens,20);assert.equal(account.reservations.length,1);assert.equal(account.reservations[0]!.tokens,16);await assert.rejects(f.reopen().budgets.claimUncapped!(f.task,'other','fixed',limits),{reason:'TASK_BUSY'});
});

test('R2-STORE-01 current: invalid observations, overflow and actual SQL failure roll back accounting',async()=>{
 const f=fresh(),lease=await f.state.budgets.claimUncapped!(f.task,'run','fixed',limits),n=await lease.reserveModelUpTo!(4),before=f.state.readAccounting(f.task);assert.ok(lease.recordModelUsage);
 await assert.rejects(lease.recordModelUsage(n,{inputTokens:-1,outputTokens:0,final:true}));assert.deepEqual(f.state.readAccounting(f.task),before);await lease.reserveTool(Number.MAX_SAFE_INTEGER-1);const full=f.state.readAccounting(f.task);await assert.rejects(lease.reserveTool(1),{reason:'STATE_FAILED'});assert.deepEqual(f.state.readAccounting(f.task),full);
 const db=new DatabaseSync(f.file);db.exec("CREATE TRIGGER deny_budget BEFORE UPDATE ON records WHEN NEW.kind='budget' BEGIN SELECT RAISE(ABORT,'synthetic storage unavailable'); END");db.close();await assert.rejects(lease.recordModelUsage(n,{inputTokens:8,outputTokens:0,final:true}));assert.deepEqual(f.reopen().readAccounting(f.task),full);
});

test('RT12-01/03 current: owner, immutable config/limits, expiry and unsupported legacy migration cannot reset state',async()=>{
 let allowed=true;const f=fresh((_g,phase)=>phase==='record'||phase==='read'||allowed),lease=await f.state.budgets.claimUncapped!(f.task,'run','fixed',limits);await lease.reserveModelUpTo!(4);const before=f.state.readAccounting(f.task);
 await assert.rejects(f.reopen().budgets.claimUncapped!(f.task,'other','fixed',limits),{reason:'TASK_BUSY'});assert.throws(()=>f.state.bindBusinessWork({...f.grant,config_sha256:'c'.repeat(64)}),{reason:'CONFIGURATION_CHANGED'});assert.deepEqual(f.state.readAccounting(f.task),before);
 await assert.rejects(f.state.budgets.claimUncapped!(f.task,'other','changed',limits),{reason:'CONFIGURATION_CHANGED'});await assert.rejects(f.state.budgets.claimUncapped!(f.task,'other','fixed',{...limits,maxOutputTokens:16384}),{reason:'CONFIGURATION_CHANGED'});
 allowed=false;await assert.rejects(f.state.budgets.claimUncapped!(f.task,'other','fixed',limits),{reason:'AUTHORITY_REQUIRED'});assert.deepEqual(f.state.readAccounting(f.task),before);assert.equal(Object.hasOwn(f.state,'migrateConfiguration'),false);
 await assert.rejects(f.state.budgets.claim(f.task,'legacy','fixed',{modelCalls:1,toolCalls:1,outputTokens:10,wallTimeMs:1000}),{reason:'CAPABILITY_UNAVAILABLE'});await lease.release(0);await assert.rejects(lease.reserveTool(1),{reason:'STATE_FAILED'});
 const exp=fresh();assert.throws(()=>exp.state.bindBusinessWork({...exp.grant,command_id:randomUUID(),valid_until:new Date(Date.now()-1).toISOString()}),{reason:'AUTHORITY_REQUIRED'});
});

test('R2-AUDIT-01/RT12-04 current: safe neutral facts are durable/idempotent; raw content or mismatched metadata refuse',async()=>{
 const f=fresh(),signal=new AbortController().signal,event:AuditEvent={version:'1.0',taskId:f.task,runId:'safe',sequence:1,kind:'session.control',at:new Date().toISOString(),provider:model.provider,model:model.id,contextVersions:{scope:'a'.repeat(64)},session:{sessionId:'session',branch:'main',operationId:'operation'},invocation:{sessionId:'session',branch:'main',operationId:'operation',invocationId:'invoke',toolCallId:'call'}};
 await f.state.audit.append(event,signal);await f.state.audit.append(event,signal);assert.deepEqual(f.reopen().readAudit(f.task),[event]);
 for(const mutation of [{...event,sequence:2,prompt:'private input'},{...event,sequence:2,session:{...event.session,content:'private'}},{...event,sequence:2,invocation:{...event.invocation,operationId:'other'}},{...event,sequence:2,contextVersions:{scope:'private source contents'}},{...event,at:'invalid'},{...event,sequence:1,toolName:'conflicting'}])await assert.rejects(f.state.audit.append(mutation as AuditEvent,signal),{reason:'AUDIT_FAILED'});assert.deepEqual(f.state.readAudit(f.task),[event]);
});

test('SDK040-02 current: actual product writer excludes another host and cancelled acquisition, without clearing records',async()=>{
 const f=fresh(),storage=f.state.sessionStorage(async()=>true,f.task),signal=new AbortController().signal,writer=await storage.acquireWriter(signal);const other=f.reopen().sessionStorage(async()=>true,f.task);
 await assert.rejects(other.acquireWriter(signal),{reason:'TASK_BUSY'});await writer.release();await assert.rejects(other.acquireWriter(AbortSignal.abort()),{reason:'CANCELLED'});const reopened=await other.acquireWriter(signal);await reopened.release();assert.deepEqual(f.state.readAudit(f.task),[]);
});

for(const mode of ['matched','plain','invocation','name','effect','resource','audit-fault'] as const)test(`READ-CARRIER-004-CARRIER current ${mode}: only trusted matching actual read/receipt survives`,async()=>{
 const f=fresh(),path=join(f.root,'owned.txt');writeFileSync(path,'owned material',{flag:'wx',mode:0o600});let calls=0,effects=0;
 const tool:Tool={name:'read',effect:'read',description:'Read owned synthetic material',parameters:{type:'object',properties:{},additionalProperties:false},resourceUnits:1,execute:async(_args,_signal,context)=>{
  effects++;const bytes=readFileSync(path);if(mode==='plain')throw Object.assign(Error('PRIVATE_DETAIL_MUST_NOT_LEAK'),{failureCategory:'permission_denied',receiptId:'caller-forged',outcome:{status:'completed'}});assert.ok(context);const {sessionId,branch,operationId,invocationId,toolCallId}=context;
  throw new ToolOutputFailure({name:mode==='name'?'other':'read',effect:mode==='effect'?'write':'read',status:'completed',modelOutput:'failed',resourceUnits:mode==='resource'?3:1,failureCategory:'permission_denied',receiptId:createHash('sha256').update(bytes).digest('hex'),invocation:{sessionId,branch,operationId,invocationId:mode==='invocation'?'foreign':invocationId,toolCallId}});
 }};
 if(mode==='audit-fault'){const db=new DatabaseSync(f.file);db.exec("CREATE TRIGGER deny_tool_ack BEFORE INSERT ON records WHEN NEW.kind='audit' AND json_extract(NEW.body,'$.kind')='tool.finished' BEGIN SELECT RAISE(ABORT,'synthetic audit fault'); END");db.close();}
 const {engine,request}=await native(f,async()=>{calls++;return reply('read');},[tool]);
 const result=await engine.run({...request,tools:[tool]});await engine.waitForIdle(f.task);assert.notEqual(result.status,'succeeded');assert.equal(calls,1,JSON.stringify(result));assert.equal(effects,1,JSON.stringify(result));assert.equal(result.usage.inputTokens,7);assert.equal(result.usage.outputTokens,3);const outcome=result.toolOutcomes?.[0],audit=f.state.readAudit(f.task);
 if(mode==='matched'||mode==='audit-fault'){assert.equal(outcome?.status,'completed');assert.equal(outcome.failureCategory,'permission_denied');assert.equal(outcome.receiptId,createHash('sha256').update(readFileSync(path)).digest('hex'));if(mode==='audit-fault'){assert.equal(result.status==='succeeded'?undefined:result.reason,'AUDIT_FAILED');assert.equal(audit.filter(e=>e.kind==='tool.finished').length,0);}else assert.equal(audit.findLast(e=>e.kind==='tool.finished')?.toolOutcome?.failureCategory,'permission_denied');}
 else{assert.equal(outcome?.status,'unknown');assert.equal(outcome.failureCategory,undefined);assert.equal(outcome.receiptId,undefined);}assert.equal(JSON.stringify(audit).includes('PRIVATE_DETAIL_MUST_NOT_LEAK'),false);
});

for(const stop of ['cancel','timeout'] as const)test(`READ-CARRIER-004-LATE current ${stop}: public native tool keeps frozen UNKNOWN and separate late category`,{timeout:10000},async t=>{
 const f=fresh(),controller=new AbortController();let calls=0,reads=0,entered!:()=>void,release!:()=>void;const began=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);t.signal.addEventListener('abort',()=>{controller.abort();release();},{once:true});
 t.mock.timers.enable({apis:['setTimeout']});let elapsed=0;t.mock.method(performance,'now',()=>elapsed);
 const tools=createExecutionTools({cwd:f.root,policyVersion:'d-read-late',resolvePath:async p=>join(f.root,p),stat:async p=>({path:p,name:'owned.txt',kind:'file',size:1,modifiedAt:0}),read:async()=>{reads++;entered();await gate;throw Object.assign(new RuntimeFault(stop==='cancel'?'CANCELLED':'DEADLINE_EXCEEDED'),stop==='cancel'?{code:'ETIMEDOUT'}:{});},write:async()=>assert.fail('no write'),exec:async()=>assert.fail('no exec')},['read']);
 const {engine,request}=await native(f,async()=>{calls++;return reply('read',{path:'owned.txt'});},tools),running=engine.run({...request,signal:controller.signal,tools});
 try{await Promise.race([began,running.then(r=>assert.fail(JSON.stringify(r)))]);if(stop==='cancel')controller.abort();else{elapsed=300001;t.mock.timers.tick(300001);}const result=await running,frozen=JSON.stringify(result),early=result.toolOutcomes?.[0];assert.equal(result.status==='succeeded'?undefined:result.reason,stop==='cancel'?'CANCELLED':'DEADLINE_EXCEEDED');assert.equal(early?.status,'unknown');assert.equal(early.modelOutput,'pending');assert.equal(early.failureCategory,undefined);assert.equal(f.state.readAudit(f.task).filter(e=>e.kind==='tool.finished').length,0);release();await engine.waitForIdle(f.task);assert.equal(JSON.stringify(result),frozen);const late=f.state.readAudit(f.task).findLast(e=>e.kind==='tool.finished')?.toolOutcome;assert.equal(late?.status,'unknown');assert.equal(late.modelOutput,'failed');assert.equal(late.failureCategory,stop==='cancel'?'cancelled':'timeout');assert.deepEqual(late.invocation,early.invocation);assert.equal(calls,1);assert.equal(reads,1);assert.equal(result.usage.toolCalls,1);assert.equal(result.usage.inputTokens,7);assert.equal(result.usage.outputTokens,3);
 }finally{release();controller.abort();t.mock.timers.reset();await running.catch(()=>undefined);await engine.waitForIdle(f.task);}
});

for(const failure of ['audit-before-request','budget-before-tool'] as const)test(`SDK041-04/NEG01 current ${failure}: actual SQLite failure closes physical/tool admission`,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'shared-'));let calls=0,effects=0;
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>true,credentials:{withCredential:async(_p,run)=>run({key:'offline-key-not-in-any-input',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'})},fetch:async()=>{calls++;if(failure==='budget-before-tool'){const db=new DatabaseSync(join(root,'.juanerai/pi-v060/state.sqlite'));db.prepare("UPDATE records SET digest=? WHERE kind='budget'").run('0'.repeat(64));db.close();}return reply('effect');}});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:await agent.configuration()};
 // Create only the real public persistence, no model or forged admission.
 if(failure==='audit-before-request'){const state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});state.bindBusinessWork({work_id:'owned-initialization',command_id:'init',task_id:'init',config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});const db=new DatabaseSync(join(root,'.juanerai/pi-v060/state.sqlite'));db.exec("CREATE TRIGGER deny_audit BEFORE INSERT ON records WHEN NEW.kind='audit' BEGIN SELECT RAISE(ABORT,'synthetic audit unavailable'); END");db.close();}
 await assert.rejects(()=>agent.advance({identity,command_id:identity.operation_id,purpose:'analysis',prompt:'new owned input',system:'new owned scope',authorize:()=>true,signal:new AbortController().signal,capabilities:async()=>[{name:'effect',effect:'write',description:'Owned real effect',parameters:{type:'object',properties:{},additionalProperties:false},execute:async()=>{effects++;writeFileSync(join(root,'effect.txt'),'done',{flag:'wx'});return {saved:true};}}]}));await agent.waitForIdle();assert.equal(effects,0);assert.equal(calls,failure==='audit-before-request'?0:1);
});

test('NC04-AUDIT: native completed nonzero metadata is durable; invalid post-effect or unknown data still refuse',async()=>{
 const f=fresh(),signal=new AbortController().signal;
 const event:AuditEvent={version:'1.0',taskId:f.task,runId:'native-completed',sequence:1,kind:'tool.finished',at:new Date().toISOString(),provider:model.provider,model:model.id,contextVersions:{scope:'a'.repeat(64)},toolName:'bash',toolOutcome:{name:'bash',effect:'external',status:'completed',modelOutput:'failed',resourceUnits:1,reason:'TOOL_FAILED',refusal:{code:'EXECUTION_FAILED',phase:'post-effect',source:'sdk-native',exitCode:7}}};
 await f.state.audit.append(event,signal);await f.state.audit.append(event,signal);assert.deepEqual(f.reopen().readAudit(f.task),[event]);
 const bad=[
  {...event.toolOutcome!,refusal:{...event.toolOutcome!.refusal!,exitCode:0}},
  {...event.toolOutcome!,refusal:{...event.toolOutcome!.refusal!,exitCode:1.5}},
  {...event.toolOutcome!,refusal:{...event.toolOutcome!.refusal!,source:'host'}},
  {...event.toolOutcome!,refusal:{...event.toolOutcome!.refusal!,phase:'pre-effect'}},
  {...event.toolOutcome!,status:'unknown'},
  {...event.toolOutcome!,status:'not-started'},
  {...event.toolOutcome!,refusal:{...event.toolOutcome!.refusal!,raw:'unapproved data'}},
 ];
 for(const toolOutcome of bad)await assert.rejects(f.state.audit.append({...event,sequence:2,toolOutcome} as AuditEvent,signal),{reason:'AUDIT_FAILED'});
 assert.deepEqual(f.reopen().readAudit(f.task),[event]);
});
