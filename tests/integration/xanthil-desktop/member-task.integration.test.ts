
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { join } from "node:path";

import { createMembershipTaskApplication } from "../../../packages/application/member-task.ts";
import { createLocalMembershipTaskStore } from "../../../adapters/storage-local/member-task.ts";
import { desktopTestIds } from "../../fixtures/xanthil-desktop/desktop-fixtures.ts";




import { fixturePlan } from "../../fixtures/xanthil-desktop/member-analysis.ts";
import { writeFileSync, readFileSync } from "node:fs";



import type { MembershipTaskStore } from "../../../packages/ports/member-task.ts";




import { blankTaskFixture, prepareTaskFixture, syntheticProfile, authorizedTaskFixture, reviewChoiceFixture } from '../../fixtures/xanthil-desktop/member-task-test-support.ts';
test('P1-A-ENTRY-01 unfinished task binds one real professional Case before files, authorization or model effects',async()=>{
 const f=await blankTaskFixture(),task=createMembershipTaskApplication({desktop:f.desktop,project_id:desktopTestIds.project,store:createLocalMembershipTaskStore(f.root)});const result=await task.create('核实会员复购是否下降',randomUUID()) as unknown as {task_id:string;owner:{case_id:string};case:{revision:{state:string}}};
 assert.match(String(result.task_id),/^[a-f0-9-]{36}$/,'quick task must have a durable identity');assert.equal(result.case.revision.state,'Draft');assert.equal((await f.desktop.listSessions({project_id:desktopTestIds.project})).length,1);
});
test('P1-A-PREPARE-01 actual inspection persists explicit preparation without confirming or executing',async()=>{const f=await prepareTaskFixture();const p=await f.app.prepare(f.created.task_id,f.input);assert.ok(p.prepared,'inspected explicit configuration must become durable preparation');assert.equal(p.case.confirmation,null);assert.equal(p.case.runs.length,0);assert.equal(p.grants.length,0);assert.equal(p.usage.length,0);assert.deepEqual((await createLocalMembershipTaskStore(f.root).read(p.task_id)).prepared,p.prepared);assert.equal(p.prepared.owner.case_id,p.owner.case_id);});
test('P1-A-GRANT-01 explicit authorization persists recipient and scope without starting work',async()=>{const f=await prepareTaskFixture();const p=await f.app.prepare(f.created.task_id,f.input);const app=createMembershipTaskApplication({...({desktop:f.desktop,project_id:desktopTestIds.project,store:f.store,profile:syntheticProfile()} as Parameters<typeof createMembershipTaskApplication>[0])});const a=await app.authorize(p.task_id,{fingerprint:p.prepared!.fingerprint,source_files:f.input.source_files,authority_confirmed:true,text_consent:false});assert.equal(a.grants.length,1,'authorization must persist a grant separately from Attempts');assert.equal(a.usage.length,0,'permission-only creation has no local physical reservation');assert.equal(a.usage.length,0);assert.equal(a.grants[0].selected_text,null);assert.equal(a.grants[0].prepared.fingerprint,p.prepared!.fingerprint);});

test('P1-A-AUTHORITY-01 activated task cannot bypass its grant/reservation through professional analysis admission',async()=>{const f=await authorizedTaskFixture(async()=>({kind:'report',text:'unused'}));const p=await f.app.read(f.id);const plan={...fixturePlan({members_bytes:f.input.source_files.members.bytes,orders_bytes:f.input.source_files.orders.bytes}),owner:p.owner,confirmation_id:p.case.confirmation!.confirmation_id,snapshot_id:p.case.snapshot!.snapshot_id};await assert.rejects(()=>f.desktop.startAnalysis({contract_version:'2.0',command_id:randomUUID(),...p.owner,expected_row_version:p.case.revision!.row_version,confirmation_id:plan.confirmation_id,execution_plan:plan}),{code:'AUTHORITY_REQUIRED'});assert.equal((await f.app.read(f.id)).case.runs.length,0);});




test('P1-A-SOURCE-01 selected-byte drift and unconfigured activation reject before confirmation/grant/model effects',async()=>{const f=await prepareTaskFixture(),p=await f.app.prepare(f.created.task_id,f.input);const input={fingerprint:p.prepared!.fingerprint,source_files:f.input.source_files,authority_confirmed:true,text_consent:false};await assert.rejects(()=>f.app.authorize(f.created.task_id,input),{code:'AUTHORITY_REQUIRED'});const a=createMembershipTaskApplication({desktop:f.desktop,project_id:desktopTestIds.project,store:f.store,profile:syntheticProfile()});await assert.rejects(()=>a.authorize(p.task_id,{...input,source_files:{...input.source_files,orders:{...input.source_files.orders,bytes:new TextEncoder().encode('changed')}}}),{code:'SOURCE_CHANGED'});const after=await a.read(p.task_id);assert.equal(after.grants.length,0);assert.equal(after.case.confirmation,null);});


test('P1-A-BOUNDARY-01 professional view cannot expose legacy outbound or scope mutations for an activated task',async()=>{const f=await prepareTaskFixture();const p=await f.app.read(f.created.task_id);assert.equal(p.case.capabilities.can_prepare_assistance,false,'the legacy disclosure surface must not bypass the closed membership outbound boundary');assert.equal(p.case.capabilities.can_create_draft_revision,false);await assert.rejects(()=>f.desktop.createDraftRevision({contract_version:'1.0',command_id:randomUUID(),...p.owner,expected_row_version:p.case.revision!.row_version}),{code:'FORBIDDEN'});});











test('P1-A-CONFIG-02 same version cannot change status meaning or mapping; explicit new version retains old readback',async()=>{
 const f=await prepareTaskFixture();await f.app.prepare(f.created.task_id,f.input);const next=await f.app.create('新的问题',randomUUID());
 const changed={...f.input,scenario:{...f.input.scenario,status_meanings:{paid:'Changed synthetic meaning'}}};
 await assert.rejects(()=>f.app.prepare(next.task_id,changed),{code:'CONFIGURATION_CHANGED'});
 await assert.rejects(()=>f.app.prepare(next.task_id,{...f.input,methods:['M1','M2']}),{code:'CONFIGURATION_CHANGED'});
 const remapped={...f.input.selection,column_mapping:{...f.input.selection.column_mapping,member_group_column:'member_id'}};
 const inspection=await f.app.inspect(next.task_id,f.input.source_files,remapped);
 await assert.rejects(()=>f.app.prepare(next.task_id,{...f.input,selection:remapped,issue_treatments:inspection.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}))}),{code:'CONFIGURATION_CHANGED'});
 const versioned=await f.app.prepare(next.task_id,{...changed,scenario:{...changed.scenario,revision:'2'}});assert.equal(versioned.prepared!.scenario.revision,'2');assert.equal((await f.app.read(f.created.task_id)).prepared!.scenario.revision,'1');
});




























test('P1-B-FORMAL-02 actual same-filesystem formal choice preserves distinct P1 provenance and Expected',async()=>{
 const f=await reviewChoiceFixture(),p=await f.app.submitReview(f.id,f.command),receipt=p.review_receipts.at(-1)!;assert.equal(p.case.revision!.state,'Completed');assert.ok(receipt.decision_id);assert.ok(receipt.expected_id);
 const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');const history=await createLocalCaseAssistantStore({projectRoot:f.root}).formalHistory(p.owner);assert.equal(history.decisions.length,1);const d=history.decisions[0];assert.equal(d.id,receipt.decision_id);assert.equal(d.outcome_id,receipt.expected_id);assert.equal(d.report_id,receipt.report_id);assert.equal(d.fields.owner,'合成责任人');assert.equal((d as any).origin.kind,'membership_review');assert.equal('draft_id' in d,false);assert.deepEqual(d.fields.outcome,(f.review.fields.decision as any).outcome);assert.equal(history.reports.length,1);assert.equal(history.reports[0].markdown,p.case.reports.at(-1)!.review_content!.markdown_text);assert.deepEqual((await f.app.submitReview(f.id,f.command)).review_receipts,p.review_receipts);
 const db=new DatabaseSync(join(f.root,'.xanthil','desktop','case-assistant.sqlite'));assert.equal(db.prepare('PRAGMA user_version').get()!.user_version,102);assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='attempts'").get(),undefined,'retired model attempt authority is absent');assert.equal(db.prepare('SELECT count(*) n FROM drafts').get()!.n,0);db.close();
});

test('P1-B-ATOMIC-01 faults before and after each formal effect roll back both databases and preserve review',async()=>{
 const f=await reviewChoiceFixture();const {cpSync,mkdirSync}=await import('node:fs');const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');
 const points=['files_prepared','before_acceptance','after_acceptance','before_form','after_form','before_closure','after_closure','before_report','after_report','before_completed','after_completed','before_sidecar_migration','after_sidecar_migration','before_decisions','after_decisions','before_reports','after_reports','before_head','after_head','before_receipt','after_receipt','before_task_close','after_task_close','before_commit','after_commit'];
 for(const point of points){const root=join(f.root+'-faults',point);mkdirSync(root,{recursive:true});cpSync(f.root,root,{recursive:true});const input={task_id:f.id,review_id:f.review.id,review_version:f.review.sequence,review_sha256:f.review.sha256,intent_id:f.review.intent_id,outcome:'choice' as const,at:new Date().toISOString()};let reached=false;
 const store=createLocalMembershipTaskStore(root,{formalFault(p){if(p===point){reached=true;throw Error('synthetic '+point);}}});await assert.rejects(()=>store.submitReview(input));assert.ok(reached,point);
 const readback=createLocalMembershipTaskStore(root),state=await readback.read(f.id),db=new DatabaseSync(join(root,'.xanthil/desktop/state.sqlite'));const committed=point==='after_commit';for(const table of ['finding_acceptances','decision_closures'])assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get()!.n,committed?1:0,point+':'+table);assert.equal(db.prepare('SELECT count(*) n FROM report_versions').get()!.n,committed?2:1);db.close();assert.equal(state.review_receipts.length,committed?1:0);assert.deepEqual(state.reviews,f.before.reviews);const history=await createLocalCaseAssistantStore({projectRoot:root}).formalHistory(state.owner);assert.equal(history.decisions.length,committed?1:0,point+':sidecar');assert.equal(history.reports.length,committed?1:0);
 const retried=await readback.submitReview(input);assert.equal(retried.review_receipts.length,1);assert.equal((await createLocalCaseAssistantStore({projectRoot:root}).formalHistory(state.owner)).decisions.length,1);
 }
});

test('P1-B-ATOMIC-02 real process death and hot-journal recovery never split formal effects',async()=>{
 const f=await reviewChoiceFixture(),{cpSync,mkdirSync,existsSync}=await import('node:fs'),{spawnSync}=await import('node:child_process');const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');
 const fields={...f.review.fields,questions:'合成恢复证明。'.repeat(400000)};const saved=await f.app.saveReview(f.id,f.review.id,f.review.sequence,f.review.sha256,fields),r=saved.reviews.at(-1)!;let hot=0;
 for(const point of ['after_acceptance','after_completed','after_decisions','before_commit','after_commit']){const root=join(f.root+'-crashes',point);mkdirSync(root,{recursive:true});cpSync(f.root,root,{recursive:true});const input={task_id:f.id,review_id:r.id,review_version:r.sequence,review_sha256:r.sha256,intent_id:r.intent_id,outcome:'choice' as const,at:new Date().toISOString()},inputPath=join(root,'crash-input.json');writeFileSync(inputPath,JSON.stringify(input));
 const child=spawnSync(process.execPath,['tests/fixtures/xanthil-desktop/member-formal-crash.ts',root,inputPath,point],{cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:30000});writeFileSync(join(root,'crash-output.json'),JSON.stringify({status:child.status,signal:child.signal,stdout:child.stdout,stderr:child.stderr,error:child.error?.message}));assert.equal(child.signal,'SIGKILL',child.stderr);assert.ok(child.stdout.includes(point));
 const journals=['state.sqlite','case-assistant.sqlite'].map(n=>join(root,'.xanthil/desktop',n+'-journal'));for(const j of journals)if(existsSync(j)){const b=readFileSync(j);writeFileSync(join(root,j.endsWith('state.sqlite-journal')?'state-journal-header.bin':'assistant-journal-header.bin'),b.subarray(0,512));if(b.subarray(0,8).toString('hex')==='d9d505f920a163d7')hot++;}
 const store=createLocalMembershipTaskStore(root),state=await store.read(f.id),history=await createLocalCaseAssistantStore({projectRoot:root}).formalHistory(state.owner),committed=point==='after_commit';const db=new DatabaseSync(join(root,'.xanthil/desktop/state.sqlite'));assert.equal(db.prepare('SELECT count(*) n FROM finding_acceptances').get()!.n,committed?1:0,point);assert.equal(db.prepare('SELECT count(*) n FROM decision_closures').get()!.n,committed?1:0,point);db.close();assert.equal(state.review_receipts.length,committed?1:0);assert.equal(history.decisions.length,committed?1:0);assert.equal(history.reports.length,committed?1:0);assert.deepEqual(state.reviews,saved.reviews);assert.equal((await store.submitReview(input)).review_receipts.length,1);
 }assert.ok(hot>=2,'actual hot rollback journals must be observed, not just a killed process');
});

test('P1-B-ATOMIC-03 unknown submission locks new intents until explicit complete readback',async()=>{
 const f=await reviewChoiceFixture();let submits=0,unreadable=false;const store:MembershipTaskStore={...f.store,async submitReview(input){submits++;const result=await f.store.submitReview(input);unreadable=true;throw Object.assign(Error('synthetic response loss'),{code:'RESULT_PENDING'});},async read(id){if(unreadable)throw Object.assign(Error('synthetic unreadable result'),{code:'INTEGRITY_BLOCKED'});return f.store.read(id);}};
 const app=createMembershipTaskApplication({desktop:f.desktop,project_id:desktopTestIds.project,store});await assert.rejects(()=>app.submitReview(f.id,f.command),{code:'RESULT_PENDING'});await assert.rejects(()=>app.submitReview(f.id,{...f.command,intent_id:randomUUID()}),{code:'RESULT_PENDING'});assert.equal(submits,1);await assert.rejects(()=>app.read(f.id));unreadable=false;const p=await app.read(f.id);assert.equal(p.review_receipts.length,1);assert.equal(p.review_receipts[0].intent_id,f.review.intent_id);assert.equal(submits,1);
});
test('P1-B-ATOMIC-04 missing committed sidecar cannot be recreated or reported as a successful readback',async()=>{
 const f=await reviewChoiceFixture();await f.app.submitReview(f.id,f.command);const {renameSync,existsSync}=await import('node:fs');const path=join(f.root,'.xanthil/desktop/case-assistant.sqlite');renameSync(path,path+'.retained');
 const reopened=createLocalMembershipTaskStore(f.root);await assert.rejects(()=>reopened.read(f.id),{code:'INTEGRITY_BLOCKED'});await assert.rejects(()=>reopened.submitReview({task_id:f.id,review_id:f.review.id,review_version:f.review.sequence,review_sha256:f.review.sha256,intent_id:f.review.intent_id,outcome:'choice',at:new Date().toISOString()}));assert.equal(existsSync(path),false,'readback must not silently initialize replacement sidecar');
});







test('P1-B-FORMAL-BOUNDARY-01 source byte drift fences explicit formal submission',async()=>{
 const f=await reviewChoiceFixture(),snapshot=f.before.case.snapshot!;writeFileSync(join(f.root,f.before.owner.session_id,'010_draw',snapshot.snapshot_id,'orders.csv'),'synthetic drift');await assert.rejects(()=>f.app.submitReview(f.id,f.command),{code:'SOURCE_CHANGED'});assert.equal((await f.store.read(f.id)).review_receipts.length,0);
});

test('P1-B-REVIEW-SHAPE-01 unknown nested fields cannot become persistent review authority',async()=>{
 const f=await reviewChoiceFixture();await assert.rejects(()=>f.app.saveReview(f.id,f.review.id,f.review.sequence,f.review.sha256,{...f.review.fields,decision:{...(f.review.fields.decision as any),outcome:{...(f.review.fields.decision as any).outcome,arbitrary_credential:'synthetic-denied'}}}),{code:'VALIDATION_FAILED'});assert.equal((await f.app.read(f.id)).reviews.length,f.before.reviews.length);
});

test('P1-B-ATOMIC-05 same-intent competing processes and conflict retries never duplicate formal effects',async()=>{
 const f=await reviewChoiceFixture(),{spawn}=await import('node:child_process');const input={task_id:f.id,review_id:f.review.id,review_version:f.review.sequence,review_sha256:f.review.sha256,intent_id:f.review.intent_id,outcome:'choice' as const,at:new Date().toISOString()},inputPath=join(f.root,'concurrent-input.json');writeFileSync(inputPath,JSON.stringify(input));
 const run=(index:number)=>new Promise<number|null>((resolve,reject)=>{const argv=['tests/fixtures/xanthil-desktop/member-formal-crash.ts',f.root,inputPath,'none'],child=spawn(process.execPath,argv,{cwd:process.cwd(),env:process.env});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('exit',(code,signal)=>{writeFileSync(join(f.root,`concurrent-${index}.json`),JSON.stringify({argv,code,signal,stdout,stderr}));resolve(code);});});
 const results=await Promise.all([run(1),run(2)]);assert.ok(results.includes(0));const store=createLocalMembershipTaskStore(f.root),read=await store.read(f.id);assert.equal(read.review_receipts.length,1);assert.equal((await store.submitReview(input)).review_receipts.length,1);await assert.rejects(()=>store.submitReview({...input,outcome:'analysis'}),{code:'COMMAND_CONFLICT'});const db=new DatabaseSync(join(f.root,'.xanthil/desktop/state.sqlite'));assert.equal(db.prepare('SELECT count(*) n FROM finding_acceptances').get()!.n,1);assert.equal(db.prepare('SELECT count(*) n FROM decision_closures').get()!.n,1);db.close();
});
test('P1-B-FORMAL-NEGATIVE-02 incomplete decisions guardrails and stale reviews have no formal effects',async()=>{
 const f=await reviewChoiceFixture();for(const patch of [{owner:''},{outcome:{...(f.review.fields.decision as any).outcome,dependencies:''}},{outcome:{...(f.review.fields.decision as any).outcome,guardrail_not_applicable_reason:''}}]){const p=await f.app.read(f.id),r=p.reviews.at(-1)!,saved=await f.app.saveReview(f.id,r.id,r.sequence,r.sha256,{...r.fields,decision:{...(f.review.fields.decision as any),...patch}}),next=saved.reviews.at(-1)!;await assert.rejects(()=>f.app.submitReview(f.id,{...f.command,review_version:next.sequence,review_sha256:next.sha256,intent_id:next.intent_id}),{code:'VALIDATION_FAILED'});assert.equal((await f.store.read(f.id)).review_receipts.length,0);}
 await assert.rejects(()=>f.app.submitReview(f.id,f.command),{code:'STALE_REVIEW'});assert.equal((await f.app.read(f.id)).case.acceptances.length,0);
});

test('P1-B-FORMAL-TIME-01 valid offset time is normalized without invalidating immutable review history',async()=>{
 const f=await reviewChoiceFixture(),d=f.review.fields.decision as any,fields={...f.review.fields,decision:{...d,confirmed_at:d.confirmed_at.replace('Z','+00:00')}};const saved=await f.app.saveReview(f.id,f.review.id,f.review.sequence,f.review.sha256,fields),r=saved.reviews.at(-1)!;const result=await f.app.submitReview(f.id,{...f.command,review_version:r.sequence,review_sha256:r.sha256,intent_id:r.intent_id});assert.equal(result.case.revision!.state,'Completed');assert.equal((result.reviews.at(-1)!.fields.decision as any).confirmed_at,fields.decision.confirmed_at);
});

test('P1-B-SIDECAR-01 sidecar 102 refuses unknown P1 provenance even with recomputed body hash',async()=>{
 const f=await reviewChoiceFixture();await f.app.submitReview(f.id,f.command);const {createHash}=await import('node:crypto');const db=new DatabaseSync(join(f.root,'.xanthil/desktop/case-assistant.sqlite'));const row=db.prepare('SELECT * FROM decisions').get()!,body=JSON.parse(String(row.body));body.origin.arbitrary_authority='denied';const raw=JSON.stringify(body);db.prepare('UPDATE decisions SET body=?,sha256=? WHERE id=?').run(raw,createHash('sha256').update(raw).digest('hex'),row.id);db.close();const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');await assert.rejects(()=>createLocalCaseAssistantStore({projectRoot:f.root}).formalHistory(f.before.owner));
});





test('P1-B-CLOSURE-01 candidate comparison requires supported complete candidates and complete applicable Expected',async()=>{
 const f=await reviewChoiceFixture(),d=f.review.fields.decision as any,ref=f.before.case.findings[0].evidence_refs[0],candidates=['合成方案甲','合成方案乙'].map(title=>({candidate_id:randomUUID(),title,evidence_basis:ref,risk_or_refutation:'关联不证明收益',applicability_conditions:'只适用于当前合成资料',future_validation_metric:'复购率'}));
 const fields={...f.review.fields,closure:{...f.review.fields.closure,route:'candidate_comparison' as const,candidates,insufficient_reason:null,preferred_candidate_id:candidates[0].candidate_id,preferred_reason:'合成条件下可先验证'},decision:{...d,choice:'candidate',candidate_id:candidates[0].candidate_id,outcome:{...d.outcome,applicable:true,baseline:'当前合成基线',baseline_source:ref,observation_object:'合成会员',metric:'复购率',expectation:'效果仍未知，需观察',observation_window:'合成后续观察期',result_source:'合成后续资料',result_owner:'合成结果责任人',assessment:'合成期末复核',assessment_owner:'合成复核人',not_applicable_reason:'',reassess_trigger:'',reassess_owner:'',guardrail_applicable:false,guardrail_not_applicable_reason:'本次仅记录方案，尚未授权行动'}}};
 const saved=await f.app.saveReview(f.id,f.review.id,f.review.sequence,f.review.sha256,fields),r=saved.reviews.at(-1)!;const result=await f.app.submitReview(f.id,{...f.command,review_version:r.sequence,review_sha256:r.sha256,intent_id:r.intent_id});assert.equal(result.case.forms[0].candidates.length,2);assert.equal(result.case.forms[0].preferred_candidate_id,candidates[0].candidate_id);assert.ok(result.case.reports.at(-1)!.review_content!.markdown_text.includes('合成结果责任人'));
});























 test('P1-B-ATOMIC-05: cold sidecar initialization preserves valid identity and refuses preexisting empty files',async()=>{
 const {prepareMembershipSidecar}=await import('../../../adapters/storage-local/case-assistant.ts');const f=await prepareTaskFixture(),path=join(f.root,'.xanthil/desktop/case-assistant.sqlite');writeFileSync(path,'');assert.throws(()=>prepareMembershipSidecar(f.root,desktopTestIds.project));assert.equal(readFileSync(path).length,0,'existing unqualified empty sidecar must not be repaired');
 const fresh=await prepareTaskFixture(),first=prepareMembershipSidecar(fresh.root,desktopTestIds.project);const original=readFileSync(first);assert.equal(prepareMembershipSidecar(fresh.root,desktopTestIds.project),first);assert.deepEqual(readFileSync(first),original);assert.throws(()=>prepareMembershipSidecar(fresh.root,randomUUID()));assert.deepEqual(readFileSync(first),original,'identity mismatch must preserve the original sidecar');
 });
