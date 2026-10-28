import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {decision} from '../../fixtures/case-assistant/fixtures.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {createPiBusinessPersistence} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import {DatabaseSync} from 'node:sqlite';

test('D07/MA/CA: retained Case uses the same public Pi executor, then human adoption saves and reopens exact formal facts',{timeout:30000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'c-')),base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root,assertCompleted:(...args)=>agent.assertCompleted(...args)});
 const source=await store.readSource(base.owner);assert.equal(source.eligible,true);let calls=0;
 const fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id],outcome:{...decision.outcome,applicable:false,not_applicable_reason:'未执行现实行动',reassess_trigger:'新证据',reassess_owner:'合成人'}};
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:()=>true,
  credentials:{withCredential:async(_provider,run)=>run({key:'synthetic',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro'})},
  fetch:async(_url,init)=>{const dto=JSON.parse(String(init!.body));calls++;assert.equal(dto.model,'mimo-v2.6-pro');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
   const delta=calls===1?{role:'assistant',tool_calls:[{index:0,id:'proposal',type:'function',function:{name:'propose_decision',arguments:JSON.stringify(fields)}}]}:{role:'assistant',content:'MODEL草稿已经提出，等待人审。'};
   return new Response('data: '+JSON.stringify({id:'case-offline',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:calls===1?'tool_calls':'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
  }});
 const app=createCaseAssistantApplication({store,config:{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',authorized:true},clock:()=>new Date(),agent});
 assert.equal(typeof Reflect.get(app,'start'),'function','retained Case needs its new professional execution entry, not a restored attempt controller');
 try{
  const linked=await app.link(source.owner,'合成保留 Case',randomUUID()),id=linked.session.id;
  const authorization=await app.prepare(id,'根据已核验 Case 提出有条件的无行动草稿');assert.deepEqual(authorization.blockers,[]);
  await app.start(id,authorization.id,true);await app.waitForIdle();const p=await app.read(id);
  assert.equal(calls,2);assert.equal(p.decisions.length,0);assert.equal(p.drafts.length,1);assert.equal(p.drafts[0]!.status,'pending');
  const draft=p.drafts[0]!,command=randomUUID(),adopted=await app.adopt(id,draft.id,draft.version,'合成人',command);
  assert.equal(adopted.decisions.length,1);assert.deepEqual(adopted.decisions[0]!.fields,fields);
  assert.deepEqual((await app.adopt(id,draft.id,draft.version,'合成人',command)).decisions,adopted.decisions);
  const before=calls;await app.close();const reopened=createLocalCaseAssistantStore({projectRoot:root});
  assert.deepEqual((await reopened.formalHistory(source.owner)).decisions,adopted.decisions);assert.equal(calls,before);
 }finally{await app.close();await agent.waitForIdle();}
});

for(const wrongScope of [false,true])test('D006-F01 actual Case Application/native scope '+(wrongScope?'refuses publication':'qualifies pending proposal'),async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f01-')),base=await completedCase(root);let calls=0,fields:typeof decision;
 const store=createLocalCaseAssistantStore({projectRoot:root,assertCompleted:(...args)=>raw.assertCompleted(...args)});
 const raw=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:(w,p)=>store.authorizesWork(w,p),fetch:async()=>offlineResponse(++calls,calls===1?[{name:'propose_decision',args:fields}]:[],'MODEL proposal only')});
 const agent=wrongScope?{...raw,advance:(turn:Parameters<typeof raw.advance>[0])=>raw.advance({...turn,identity:{...turn.identity,scope_sha256:'c'.repeat(64)}})}:raw;
 const app=createCaseAssistantApplication({store,config:{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',authorized:true},clock:()=>new Date(),agent});
 try{
  const linked=await app.link(base.owner,'Current synthetic evidence',randomUUID()),id=linked.session.id,a=await app.prepare(id,'根据已核验凭证提出无行动草稿');assert.deepEqual(a.blockers,[]);
  fields={...decision,choice:'no_action',candidate_id:null,evidence_refs:a.source.evidence_refs,finding_refs:[a.source.finding_id],outcome:{...decision.outcome,applicable:false,not_applicable_reason:'没有现实行动',reassess_trigger:'新证据',reassess_owner:'合成人'}};
  let error:unknown;try{await app.start(id,a.id,true);await app.waitForIdle();}catch(e){error=e;}
  const current=await app.read(id),binding=(await store.readBusinessAuthorization(id))!,state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true}),audit=state.readWorkAudit(binding.work_id),runs=audit.filter(e=>e.kind==='run.finished');
  assert.equal(calls,2);assert.equal(runs.length,1);assert.equal(runs[0]!.contextVersions.scope,wrongScope?'c'.repeat(64):binding.identity.scope_sha256);
  assert.equal(runs[0]!.contextVersions.configuration,binding.identity.config_sha256);assert.equal(runs[0]!.contextVersions.revision,binding.identity.revision);
  assert.equal((await raw.diagnostics(binding.identity,'retained_case')).meter!.unconfirmed_output_tokens,0);
  writeFileSync(join(root,'F01-ACTUAL-FACTS.json'),JSON.stringify({wrongScope,error_code:(error as {code?:string})?.code,binding,audit,drafts:current.drafts,decisions:current.decisions},null,2));
  assert.equal(current.decisions.length,0,'qualification never adopts a formal decision');
  if(wrongScope){assert.equal((error as {code?:string})?.code,'EFFECT_UNCONFIRMED');assert.equal(current.drafts.length,0);}
  else{assert.equal(error,undefined);assert.equal(current.drafts.length,1);assert.equal(current.drafts[0]!.status,'pending');}
 }finally{await app.close();await raw.waitForIdle();await base.app.close?.(undefined);}
});

function barrier(){let enter!:()=>void,release!:()=>void;return {entered:new Promise<void>(r=>enter=r),gate:new Promise<void>(r=>release=r),enter:()=>enter(),release:()=>release()};}
for(const phase of ['immediate','source','before-create','committed','committed-ack'] as const)test('D006-F02 real link/close boundary '+phase,async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f02-')),base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),gate=barrier();
 const readSource=store.readSource,create=store.createSession;let created:string|undefined;
 if(phase==='source')store.readSource=async(...args)=>{const value=await readSource(...args);gate.enter();await gate.gate;return value;};
 if(phase==='before-create'||phase==='committed'||phase==='committed-ack')store.createSession=async(...args)=>{
  if(phase==='before-create'){gate.enter();await gate.gate;return create(...args);}
  const value=await create(...args);created=value.id;gate.enter();await gate.gate;if(phase==='committed-ack')throw Object.assign(Error('synthetic committed ACK unavailable'),{code:'RESULT_PENDING'});return value;
 };
 const app=createCaseAssistantApplication({store,config:null,clock:()=>new Date()});
 try{
  const pending=app.link(base.owner,'Close race',randomUUID());void pending.catch(()=>undefined);
  if(phase!=='immediate')await gate.entered;
  let closed=false;const closing=app.close().then(()=>{closed=true;});void closing.catch(()=>undefined);
  if(phase!=='immediate'){await new Promise<void>(r=>setImmediate(r));assert.equal(closed,false,'close must settle its admitted creation, not return before commit/ACK');gate.release();}
  await closing;const settled=await Promise.allSettled([pending]),sessions=await store.listSessions(base.owner.project_id),facts=await Promise.all(sessions.map(async s=>({id:s.id,lifecycle:await store.readLifecycle(s.id)})));
  assert.ok(facts.every(s=>!s.lifecycle.open));assert.equal(sessions.length,created?1:0);
  if(phase==='committed-ack')assert.equal(settled[0]!.status,'rejected','readback of a committed receipt cannot erase the original ACK error');
  await assert.rejects(()=>app.link(base.owner,'After close',randomUUID()),{code:'INTERRUPTED'});
  const reopened=createLocalCaseAssistantStore({projectRoot:root}),passive=createCaseAssistantApplication({store:reopened,config:null,clock:()=>new Date()});
  for(const s of sessions){await passive.read(s.id);assert.equal((await reopened.readLifecycle(s.id)).open,false);}
  if(created){const life=await reopened.readLifecycle(created);assert.equal((await passive.reopenSession(created,life.epoch)).open,true);await passive.closeSession(created);}
  await passive.close();writeFileSync(join(root,'F02-CLOSE-FACTS.json'),JSON.stringify({phase,created,settled:settled.map(s=>s.status),facts,sessions},null,2));
 }finally{gate.release();await app.close();await base.app.close?.(undefined);}
});

test('D006-F02 actual SQLite COMMIT ACK loss retains receipt and closes committed Session without replay',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f02ack-')),base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),app=createCaseAssistantApplication({store,config:null,clock:()=>new Date()}),command=randomUUID(),exec=DatabaseSync.prototype.exec;let lost=false;
 DatabaseSync.prototype.exec=function(sql:string){
  if(sql==='COMMIT'&&!lost&&this.prepare('PRAGMA database_list').all().some(row=>row.file===join(root,'.xanthil/desktop/case-assistant.sqlite'))&&this.prepare('SELECT 1 FROM receipts WHERE id=?').get(command)){
   Reflect.apply(exec,this,[sql]);lost=true;throw Object.assign(Error('actual durable COMMIT ACK unavailable'),{code:'RESULT_PENDING'});
  }return Reflect.apply(exec,this,[sql]);
 };
 try{await assert.rejects(()=>app.link(base.owner,'Commit ACK',command),{code:'RESULT_PENDING'});assert.equal(lost,true);await app.close();const sessions=await store.listSessions(base.owner.project_id);assert.equal(sessions.length,1);assert.equal((await store.readLifecycle(sessions[0]!.id)).open,false);
  const db=new DatabaseSync(join(root,'.xanthil/desktop/case-assistant.sqlite'),{readOnly:true});try{const receipts=db.prepare('SELECT * FROM receipts WHERE id=?').all(command);assert.equal(receipts.length,1);assert.equal(receipts[0]!.result,sessions[0]!.id);writeFileSync(join(root,'F02-ACK-FACTS.json'),JSON.stringify({lost,sessions,receipts},null,2));}finally{db.close();}
 }finally{DatabaseSync.prototype.exec=exec;await app.close();await base.app.close?.(undefined);}
});

test('D006-F02 unknown creation ACK/readback never claims close success; explicit close reads existing receipt only',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f02unknown-')),base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),app=createCaseAssistantApplication({store,config:null,clock:()=>new Date()}),create=store.createSession,read=store.readLinkedSession;let writes=0,unavailable=true;
 store.createSession=async(...args)=>{writes++;await create(...args);throw Object.assign(Error('committed creation ACK unknown'),{code:'RESULT_PENDING'});};
 store.readLinkedSession=async(...args)=>{if(unavailable)throw Object.assign(Error('receipt storage unavailable'),{code:'INTEGRITY_BLOCKED'});return read(...args);};
 try{
  const pending=app.link(base.owner,'Unknown receipt',randomUUID());await assert.rejects(pending,{code:'RESULT_PENDING'});
  await assert.rejects(()=>app.close(),{code:'RESULT_PENDING'});const sessions=await store.listSessions(base.owner.project_id);assert.equal(sessions.length,1);assert.equal((await store.readLifecycle(sessions[0]!.id)).open,true,'unknown close is not fabricated as closed');
  unavailable=false;await app.close();assert.equal((await store.readLifecycle(sessions[0]!.id)).open,false);assert.equal(writes,1,'only readback/close, never replay of the committed creation');
  writeFileSync(join(root,'F02-UNKNOWN-READBACK.json'),JSON.stringify({writes,sessions,lifecycle:await store.readLifecycle(sessions[0]!.id)},null,2));
 }finally{unavailable=false;await app.close();await base.app.close?.(undefined);}
});

test('D006-F02 normal link receipt/conflict and concurrent close preserve existing Session lifecycle',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'f02normal-')),base=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),app=createCaseAssistantApplication({store,config:null,clock:()=>new Date()}),command=randomUUID();
 try{
  const first=await app.link(base.owner,'Normal link',command),second=await app.link(base.owner,'Normal link',command);assert.equal(first.session.id,second.session.id);assert.equal((await store.readLifecycle(first.session.id)).open,true);
  await assert.rejects(()=>app.link(base.owner,'Conflicting title',command),{code:'COMMAND_CONFLICT'});assert.equal(await store.readLinkedSession(command,base.owner,'Conflicting title'),null);assert.equal((await store.listSessions(base.owner.project_id)).length,1);
  await Promise.all([app.close(),app.close()]);assert.equal((await store.readLifecycle(first.session.id)).open,false);assert.equal((await store.readLifecycle(first.session.id)).epoch,1,'concurrent close settles the same boundary once');
 }finally{await app.close();await base.app.close?.(undefined);}
});
