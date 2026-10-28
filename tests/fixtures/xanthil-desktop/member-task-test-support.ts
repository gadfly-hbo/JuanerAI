// Shared fresh synthetic fixtures only: importing this module registers no tests.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createU12ProjectAdmissionApplication } from "./desktop-contract-drivers.ts";
import { createXanthilDesktopDecisionCaseApplication } from "../../../packages/application/xanthil-desktop-decision-case.ts";
import { createMembershipTaskApplication } from "../../../packages/application/member-task.ts";
import { createLocalMembershipTaskStore } from "../../../adapters/storage-local/member-task.ts";
import { desktopTestIds } from "./desktop-fixtures.ts";
import { readSyntheticCsvPair } from "./desktop-fixtures.ts";
import { fixtureScenario, fixtureSelection,fixturePlan } from "./member-analysis.ts";
import { createLocalModelAccess } from "../../../packages/application/provider-settings.ts";
import { createLocalDesktopDecisionCaseStore } from "../../../adapters/storage-local/xanthil-desktop-decision-case.ts";
export async function blankTaskFixture(existingRoot?:string){const root=existingRoot??mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'member-task-'));const fixture=await createU12ProjectAdmissionApplication(root);const desktop=createXanthilDesktopDecisionCaseApplication({...fixture.dependencies,clock:()=>new Date()});await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:desktopTestIds.project,display_name:'合成任务项目'});return {root,fixture,desktop};}
export async function prepareTaskFixture(existingRoot?:string){const f=await blankTaskFixture(existingRoot),store=createLocalMembershipTaskStore(f.root),app=createMembershipTaskApplication({desktop:f.desktop,project_id:desktopTestIds.project,store});const created=await app.create('核实会员复购是否下降',randomUUID()),pair=await readSyntheticCsvPair();const source_files={members:{display_name:'members.csv',bytes:pair.members},orders:{display_name:'orders.csv',bytes:pair.orders}},selection=fixtureSelection(),scenario=fixtureScenario();const inspection=await app.inspect(created.task_id,source_files,selection);const input={source_files,selection,scenario,methods:['M1'],issue_treatments:inspection.reviewable_issues.map(x=>({code:x.code,count:x.count,treatment:x.treatment_options[0]}))};return {...f,store,app,created,input};}

export const syntheticProfile=()=>({version:'1.0',provider:'synthetic',model:'offline',activation:'synthetic_only',max_input_bytes:16000,max_output_bytes:8000,call_output_tokens:1000,total_output_tokens:10000,model_calls:10,call_ms:10000,total_active_ms:120000,wait_ms:10000,total_wait_ms:20000,local_runs:2,run_ms:20000,process_seconds:10,grant_ms:300000,cost:'unknown'} as const);
export async function authorizedTaskFixture(respond:(payload:string)=>Promise<unknown>,shared=createLocalModelAccess(true),methods:readonly string[]=['M1'],existingRoot?:string){
 const f=await prepareTaskFixture(existingRoot);f.input.methods=[...methods];const p=await f.app.prepare(f.created.task_id,f.input),profile=syntheticProfile();
 const app=createMembershipTaskApplication({...({desktop:f.desktop,project_id:desktopTestIds.project,store:f.store,profile,sourceStore:createLocalDesktopDecisionCaseStore({projectRoot:f.root})} as Parameters<typeof createMembershipTaskApplication>[0])});
 await app.authorize(p.task_id,{fingerprint:p.prepared!.fingerprint,source_files:f.input.source_files,authority_confirmed:true,text_consent:false});return {...f,app,id:p.task_id,shared};
}
export function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}
export async function until(predicate:()=>Promise<boolean>){for(let i=0;i<100;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,20));}assert.fail('bounded condition did not arrive');}

export async function reviewChoiceFixture(existingRoot?:string,methods:readonly string[]=['M1']){
 const f=await authorizedTaskFixture(async()=>assert.fail('manual formal review seed has no model producer'),createLocalModelAccess(true),methods,existingRoot);
 // This fixture explicitly exercises the retained local calculation permission,
 // not a model Runtime, fake completion or fabricated formal Finding.
 const a=await f.app.read(f.id),grant=a.grants.at(-1)!;assert.equal(a.case.runs.length,0);const started=performance.now(),usage:import('../../../packages/product-core/member-task.ts').TaskUsage={version:'1.0',id:randomUUID(),grant_id:grant.id,attempt_id:randomUUID(),kind:'analysis',status:'reserved',source_sha256:grant.prepared.fingerprint,payload_sha256:null,active_ms:grant.profile.run_ms,local_runs:1,at:new Date().toISOString()};
 let state=await f.store.commit(f.id,a.row_version,{usage,status:'running'});state=await f.store.commit(f.id,state.row_version,{usage:{...usage,status:'issued'}});
 const plan={...fixturePlan({members_bytes:f.input.source_files.members.bytes,orders_bytes:f.input.source_files.orders.bytes},methods),owner:a.owner,confirmation_id:a.case.confirmation!.confirmation_id,snapshot_id:a.case.snapshot!.snapshot_id,scenario:grant.prepared.scenario,scenario_sha256:(await import('../../../packages/product-core/member-task.ts')).taskHash(grant.prepared.scenario),task_context:{task_id:f.id,grant_id:grant.id,epoch:String(grant.epoch),reservation_id:usage.id,run_ms:String(grant.profile.run_ms),process_seconds:String(grant.profile.process_seconds)}};
 let projection=await f.desktop.startAnalysis({contract_version:'2.0',command_id:randomUUID(),...a.owner,expected_row_version:a.case.revision!.row_version,confirmation_id:plan.confirmation_id,execution_plan:plan});
 while(projection.runs.at(-1)?.status==='Running'){await new Promise(r=>setTimeout(r,5));projection=await f.desktop.readProjection(a.owner);}assert.equal(projection.runs.at(-1)?.status,'Succeeded','real local analysis/independent proof must complete before formal review');
 state=await f.store.read(f.id);await f.store.commit(f.id,state.row_version,{usage:{...usage,status:'settled',active_ms:Math.ceil(performance.now()-started)},status:'waiting'});
 const p=await f.app.openReview(f.id),r=p.reviews.at(-1)!;
 const fields={...r.fields,actor:'合成人员',closure:{...r.fields.closure,route:'insufficient_evidence' as const,insufficient_reason:'目前证据不足以选择行动',disposition:'saved' as const},decision:{choice:'no_action',candidate_id:null,rationale:'等待补充证据',owner:'合成责任人',confirmed_at:new Date().toISOString(),evidence_refs:p.case.findings[0].evidence_refs,finding_refs:[r.source.finding_id],alternatives:'已比较立即行动与等待',limitations:'活动影响尚未核对',defer_trigger:'',defer_owner:'',outcome:{applicable:false,baseline:'',baseline_source:'',observation_object:'',metric:'',expectation:'',observation_window:'',guardrails:'',dependencies:'等待活动核对',guardrail_applicable:false,guardrail_not_applicable_reason:'未执行任何行动',result_source:'',result_owner:'',assessment:'',assessment_owner:'',not_applicable_reason:'本次暂不行动',reassess_trigger:'获得活动核对结果',reassess_owner:'合成责任人'}}};
 const saved=await f.app.saveReview(f.id,r.id,r.sequence,r.sha256,fields),review=saved.reviews.at(-1)!;return {...f,before:saved,review,command:{review_id:review.id,review_version:review.sequence,review_sha256:review.sha256,intent_id:review.intent_id,outcome:'choice',confirmed:true}};
}
