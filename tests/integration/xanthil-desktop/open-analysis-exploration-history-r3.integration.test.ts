import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';

test('VC-10/11: historical exploration retains real earlier same-scope semantic provenance during revision',()=>{
 const f=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/exploration-history-r3-synthetic.json',import.meta.url),'utf8'));
 const root=mkdtempSync(join(browserEvidenceRoot,'r3-exploration-history-')),store=createLocalOpenAnalysisStore({projectRoot:root});
 const identity={...f.identity,revision:'1'};store.create({identity,question:f.earlier_question,source:f.source});store.finish(store.begin(identity.task_id),'failed');
 const second={...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
 store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:'1',preferences:undefined,identity:second,question:f.exploration_question});
 const lease=store.begin(identity.task_id),frame={...f.exploration.framework,identity:second},exploration={...f.exploration,identity:second,framework:frame};
 store.saveFramework(lease,frame);
 // Seed an already collected synthetic persisted record; no Python execution or admission is claimed by this readback test.
 const seed=store.read(identity.task_id)!;seed.explorations=[exploration];
 const fixtureDb=new DatabaseSync(join(root,'.xanthil','desktop','open-analysis.sqlite'));
 fixtureDb.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(seed),taskHash(seed),identity.task_id);fixtureDb.close();
 store.finish(lease,'failed');
 const before=store.read(identity.task_id)!;assert.equal(before.explorations!.length,1);
 const third={...second,revision:'3',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
 store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:'2',preferences:undefined,identity:third,question:'保留历史，修订本轮方案；尚未重新执行。'});
 const saved=createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id)!;
 assert.deepEqual(saved.history![1]!.explorations,before.explorations);assert.equal(saved.explorations,undefined);
 assert.equal(saved.history![1]!.explorations![0]!.verification,'not_performed');
 // A different scope or a later message must not rescue old semantic evidence.
 const db=new DatabaseSync(join(root,'.xanthil','desktop','open-analysis.sqlite'));
 for(const kind of ['foreign_scope','future_revision']){
  const changed=structuredClone(saved);
  if(kind==='foreign_scope'){changed.history![0]!.source={...f.source,sources:[...f.source.sources].reverse()};changed.history![0]!.identity.scope_sha256=taskHash(changed.history![0]!.source);}
  else{changed.history![0]!.question='早期消息没有金额单位说明';changed.question=f.earlier_question;}
  db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(changed),taskHash(changed),identity.task_id);
  assert.throws(()=>store.read(identity.task_id),{code:'CONTEXT_CHANGED'});
 }
 db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(saved),taskHash(saved),identity.task_id);db.close();
 assert.deepEqual(store.read(identity.task_id)!.history![1]!.explorations,before.explorations);
});


test('VC-10/11: saved report preview retains earlier semantic provenance after its base becomes history',async()=>{
 const {executeOpenAnalysisIR}=await import('../../../packages/product-core/open-analysis-ir.ts');const {verifyOpenAnalysisIntegerSum}=await import('../../../adapters/analytics-duckdb/open-analysis-verification.ts');const {compileNumericReport}=await import('../../../packages/product-core/open-analysis-numeric-report.ts');
 const f=JSON.parse(readFileSync(new URL('../../fixtures/xanthil-desktop/exploration-history-r3-synthetic.json',import.meta.url),'utf8'));const root=mkdtempSync(join(browserEvidenceRoot,'r3-report-history-')),store=createLocalOpenAnalysisStore({projectRoot:root}),identity={...f.identity,revision:'1'};store.create({identity,question:f.earlier_question,source:f.source});store.finish(store.begin(identity.task_id),'failed');const second={...identity,revision:'2',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:'1',preferences:undefined,identity:second,question:f.exploration_question});const lease=store.begin(identity.task_id),frame={...f.exploration.framework,identity:second};store.saveFramework(lease,frame);const calculation=executeOpenAnalysisIR(frame.plan,f.source),verification=verifyOpenAnalysisIntegerSum(frame.plan,calculation,f.source),evidence={verified_calculations:[{execution_plan:frame.plan,calculation,verification}]},report=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:[],interpretation:'Arithmetic evidence only; causes unknown.'}]}),evidence,{identity:second,sources:f.source});const outcome={version:'1.0' as const,outcome_id:randomUUID(),identity:second,framework:frame.plan,calculation,verification,numeric_report:report,explanation:{kind:'MODEL_EXPLANATION' as const,text:report.text},human_judgment:'not_recorded' as const};store.saveOutcome(lease,outcome);
 const reportId=randomUUID(),reportIdentity={...second,run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};store.reservePreview(identity.task_id,{version:'1.0',command_id:reportId,baseline_identity:second,identity:reportIdentity,question:'Explain saved report only',preferences:{skill:'general',prompt:'professional'}});store.completePreview(identity.task_id,reportId,{state:'answered',framework:null,text:report.text,failure_code:null,report:{outcome_id:outcome.outcome_id,outcome_sha256:taskHash(outcome),numeric_report:report}});const before=store.read(identity.task_id)!;
 const third={...second,revision:'3',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};store.revise(identity.task_id,{command_id:randomUUID(),expected_revision:'2',preferences:undefined,identity:third,question:'Prepare next version without changing old facts'});const saved=createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id)!;assert.deepEqual(saved.history![1]!.outcome,before.outcome);assert.deepEqual(saved.revision_previews!.find(p=>p.command_id===reportId)!.report,before.revision_previews![0]!.report);const tampered=structuredClone(saved);tampered.history![0]!.question='Missing earlier evidence';tampered.question=f.earlier_question;const db=new DatabaseSync(join(root,'.xanthil','desktop','open-analysis.sqlite'));db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(tampered),taskHash(tampered),identity.task_id);assert.throws(()=>store.read(identity.task_id),{code:'CONTEXT_CHANGED'});db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(JSON.stringify(saved),taskHash(saved),identity.task_id);db.close();assert.deepEqual(store.read(identity.task_id)!.history![1]!.outcome,before.outcome);
});
