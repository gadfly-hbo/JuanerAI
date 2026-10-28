import {validateIndependentComputation} from './open-computation.ts';
import {compileOpenAnalysisContext} from './open-analysis-context.ts';
import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {hashFiniteJson} from './member-task.ts';
import {validateNumericReport} from './open-analysis-numeric-report.ts';
import {createJudgmentSnapshot,judgmentQuestionHistory,validateJudgmentReview,deliveredJudgmentReview} from './open-analysis-judgment-review.ts';
import {qualifyOpenMemberReviewSource,openMemberFindingFacts,validateOpenMemberSourceRecord,openMemberOriginCommand,type OpenMemberSourceRecord,type OpenMemberFindingFacts,type OpenMemberReviewSource} from './open-membership.ts';
import type {OpenStoredTask} from '../ports/open-analysis-store.ts';

export type ReviewedAnalysisSource=Readonly<{version:'1.0';kind:'open_analysis_evidence';task_id:string;revision:string;task_run_id:string;attempt_id:string;outcome_id:string;outcome_sha256:string;scope_sha256:string;result_sha256:string;report_sha256:string;review_sha256:string;review_snapshot_sha256:string;review_state:string;numeric_status:'complete'|'partial';expression_version:string;expression_sha256:string|null}>;
export type ReviewedAnalysisSourceRecord=Readonly<{version:'1.1';origin_id:string;command_id:string;owner:OpenMemberSourceRecord['owner'];source:ReviewedAnalysisSource;task:OpenStoredTask;created_at:string;sha256:string}>;
export type AnalysisReviewSourceRecord=OpenMemberSourceRecord|ReviewedAnalysisSourceRecord;
export type ReviewedAnalysisFindingFacts=Readonly<{version:'3.1';judgment:'Verified';verification_scope:'numeric_values_only'|'per_claim_evidence';owner:OpenMemberSourceRecord['owner'];origin:Readonly<{kind:'open_analysis_source';origin_id:string;source_record_sha256:string}>;source:ReviewedAnalysisSource;metrics:Readonly<{values:readonly unknown[];numeric_status:'complete'|'partial'}>;judgment_review:Readonly<{state:string;review_sha256:string;snapshot_sha256:string;limitations:readonly string[]}>;causal_claim:'not_verified'}>;
export type AnalysisReviewFindingFacts=OpenMemberFindingFacts|ReviewedAnalysisFindingFacts;
function fail(code='SOURCE_UNQUALIFIED'):never{throw Object.assign(new Error(code),{code,stack:code});}
const same=(a:unknown,b:unknown)=>hashFiniteJson(a)===hashFiniteJson(b);

/** Two existing consumers; a reviewed sum is never relabelled as M1/M2. */
export function qualifyAnalysisReviewSource(task:OpenStoredTask):OpenMemberReviewSource|ReviewedAnalysisSource{
 if(task.outcome?.membership&&!task.outcome.numeric_report)return qualifyOpenMemberReviewSource(task);
 const o=task.outcome,report=o?.numeric_report,review=deliveredJudgmentReview(task);
 if(task.state!=='saved'||task.pending_stop_epoch!==null||task.review_policy!=='conclusion_strategy_v1'||!o||!report||!review||!['completed','failed'].includes(review.state))fail();
 if(!same(o.identity,task.identity)||task.identity.scope_sha256!==hashFiniteJson(task.source))fail('SOURCE_CHANGED');
 if(!o.computations.length)fail('VERIFICATION_FAILED');
 for(const f of o.computations)validateIndependentComputation(f.calculation,f.verification,task.source);
 const evidence={verified_calculations:o.computations};validateNumericReport(report,evidence,{identity:task.identity,sources:task.source});
 const context=compileOpenAnalysisContext(task.question,task.source),binding=null;
 const initial=o.judgment_review!;const snapshot=createJudgmentSnapshot({identity:task.identity,question:task.question,context,binding,snapshotVersion:initial.snapshot.version,...(['1.3','1.4'].includes(initial.snapshot.document?.version??'')?{document:initial.snapshot.document}:{}),conditionSourceReferences:initial.snapshot.condition_source_catalog!==undefined,...(initial.snapshot.question_history?{question_history:judgmentQuestionHistory(task)}:{}),evidence,report,sources:task.source,opinions:initial.snapshot.opinions,unavailable:initial.snapshot.unavailable});validateJudgmentReview(initial,snapshot,task.source);if(task.review_updates?.length)fail('SOURCE_CHANGED');if(o.explanation.text!==initial.delivery)fail('SOURCE_CHANGED');
 const currentReport=validateNumericReport(review.snapshot.report,evidence,{identity:task.identity,sources:task.source}),edit=task.report_edits?.at(-1);
 return {version:'1.0',kind:'open_analysis_evidence',task_id:task.identity.task_id,revision:task.identity.revision,task_run_id:task.identity.run_id,attempt_id:task.identity.attempt_id,outcome_id:o.outcome_id,outcome_sha256:hashFiniteJson(o),scope_sha256:task.identity.scope_sha256,result_sha256:hashFiniteJson(o.computations),report_sha256:currentReport.report_sha256,review_sha256:review.review_sha256,review_snapshot_sha256:review.snapshot_sha256,review_state:review.state,numeric_status:report.status==='partial'||currentReport.status==='partial'?'partial':'complete',expression_version:String(edit?.expression_version??0),expression_sha256:edit?hashFiniteJson(edit):null};
}
export function analysisOriginCommand(owner:OpenMemberSourceRecord['owner'],source:OpenMemberReviewSource|ReviewedAnalysisSource){
 if(source.kind==='open_member_evidence')return openMemberOriginCommand(owner,source);
 const h=hashFiniteJson({kind:'reviewed_analysis_source',version:'1.0',owner,source});return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
}
export function validateAnalysisSourceRecord(input:unknown):AnalysisReviewSourceRecord{
 const raw=input as AnalysisReviewSourceRecord;
 if(raw.version==='1.0')return validateOpenMemberSourceRecord(raw);
 closed(raw,['version','origin_id','command_id','owner','source','task','created_at','sha256']);closed(raw.owner,['project_id','session_id','case_id','revision_id']);
 if(raw.version!=='1.1'||![raw.origin_id,raw.command_id,...Object.values(raw.owner)].every(membershipUuid)||typeof raw.created_at!=='string'||!Number.isFinite(Date.parse(raw.created_at))||new Date(raw.created_at).toISOString()!==raw.created_at)fail();
 const source=qualifyAnalysisReviewSource(raw.task),{sha256,...body}=raw;
 if(source.kind!=='open_analysis_evidence'||!same(source,raw.source)||raw.command_id!==analysisOriginCommand(raw.owner,source)||sha256!==hashFiniteJson(body))fail('SOURCE_CHANGED');return raw;
}
export function analysisReviewFindingFacts(raw:AnalysisReviewSourceRecord):AnalysisReviewFindingFacts{
 const record=validateAnalysisSourceRecord(raw);if(record.version==='1.0')return openMemberFindingFacts(record);
 const o=record.task.outcome!,r=deliveredJudgmentReview(record.task)!;
 return {version:'3.1',judgment:'Verified',verification_scope:r.snapshot.report.values.every(v=>v.grade==='independent_arithmetic'||v.grade==='derived_formula')?'numeric_values_only':'per_claim_evidence',owner:record.owner,origin:{kind:'open_analysis_source',origin_id:record.origin_id,source_record_sha256:hashFiniteJson(record)},source:record.source,metrics:{values:r.snapshot.report.values.map(({id,label,value,unit,grade,status,scope,proof_sha256})=>({id,label,value,unit,grade,status,scope,proof_sha256})),numeric_status:record.source.numeric_status},judgment_review:{state:r.state,review_sha256:r.review_sha256,snapshot_sha256:r.snapshot_sha256,limitations:['Verified只指逐项grade和status所列证据范围；原文对应不认证所引观点，未核验或不适用项不能升级。模型审查不构成语义/因果事实认证。',...r.rounds.at(-1)?.claims.flatMap(c=>[c.reason,...c.limitations])??[]]},causal_claim:'not_verified'};
}
export function validateAnalysisReviewFindingFacts(raw:unknown,record:AnalysisReviewSourceRecord){const expected=analysisReviewFindingFacts(record);if(!same(raw,expected))fail('VERIFICATION_FAILED');return expected;}
/** Existing private Finding carrier; the method identity comes from actual execution. */
export function analysisFindingStorageFacts(record:AnalysisReviewSourceRecord){
 const facts=analysisReviewFindingFacts(record);
 if(record.version==='1.0'){const m=closed(record.task.outcome!.membership!.verification.native_evidence.primary.method,['id','version','code_identity']);if(typeof m.id!=='string'||typeof m.version!=='string')fail('VERIFICATION_FAILED');return {metrics:facts.metrics,method:{id:m.id,version:m.version},limitations:['算术核验不证明模型解释、假设或因果。']};}
 return {metrics:facts.metrics,method:{id:'open_computation',version:'1.0'},limitations:(facts as ReviewedAnalysisFindingFacts).judgment_review.limitations};
}
