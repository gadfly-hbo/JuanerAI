import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {executeOpenAnalysisIR} from './open-analysis-ir.ts';
import {validateNumericReport} from './open-analysis-numeric-report.ts';
import {createJudgmentSnapshot,judgmentQuestionHistory,validateJudgmentReview,validateReviewUpdates,deliveredJudgmentReview} from './open-analysis-judgment-review.ts';
import {qualifyOpenMemberReviewSource,openMemberFindingFacts,validateOpenMemberSourceRecord,openMemberOriginCommand,type OpenMemberSourceRecord,type OpenMemberFindingFacts,type OpenMemberReviewSource} from './open-membership.ts';
import type {OpenStoredTask} from '../ports/open-analysis-store.ts';

export type ReviewedAnalysisSource=Readonly<{version:'1.0';kind:'open_analysis_evidence';task_id:string;revision:string;task_run_id:string;attempt_id:string;outcome_id:string;outcome_sha256:string;scope_sha256:string;plan_sha256:string;result_sha256:string;report_sha256:string;review_sha256:string;review_snapshot_sha256:string;review_state:string;numeric_status:'complete'|'partial';expression_version:string;expression_sha256:string|null}>;
export type ReviewedAnalysisSourceRecord=Readonly<{version:'1.1';origin_id:string;command_id:string;owner:OpenMemberSourceRecord['owner'];source:ReviewedAnalysisSource;task:OpenStoredTask;created_at:string;sha256:string}>;
export type AnalysisReviewSourceRecord=OpenMemberSourceRecord|ReviewedAnalysisSourceRecord;
export type ReviewedAnalysisFindingFacts=Readonly<{version:'3.1';judgment:'Verified';verification_scope:'numeric_values_only';owner:OpenMemberSourceRecord['owner'];origin:Readonly<{kind:'open_analysis_source';origin_id:string;source_record_sha256:string}>;source:ReviewedAnalysisSource;metrics:Readonly<{values:readonly unknown[];numeric_status:'complete'|'partial'}>;judgment_review:Readonly<{state:string;review_sha256:string;snapshot_sha256:string;limitations:readonly string[]}>;causal_claim:'not_verified'}>;
export type AnalysisReviewFindingFacts=OpenMemberFindingFacts|ReviewedAnalysisFindingFacts;
function fail(code='SOURCE_UNQUALIFIED'):never{throw Object.assign(new Error(code),{code,stack:code});}
const same=(a:unknown,b:unknown)=>taskHash(a)===taskHash(b);

/** Two existing consumers; a reviewed sum is never relabelled as M1/M2. */
export function qualifyAnalysisReviewSource(task:OpenStoredTask):OpenMemberReviewSource|ReviewedAnalysisSource{
 if(task.framework?.plan.version==='1.4'&&!task.review_policy)return qualifyOpenMemberReviewSource(task);
 const o=task.outcome,frame=task.framework,report=o?.numeric_report,review=deliveredJudgmentReview(task);
 if(task.state!=='saved'||task.pending_stop_epoch!==null||task.review_policy!=='conclusion_strategy_v1'||!o||!frame||!report||!review||!['completed','failed'].includes(review.state))fail();
 if(!same(o.identity,task.identity)||!same(frame.identity,task.identity)||!same(o.framework,frame.plan)||task.identity.scope_sha256!==taskHash(task.source))fail('SOURCE_CHANGED');
 const base=(frame.plan as any).base??frame.plan;if(frame.plan.version!=='2.4'&&base.operation!=='sum')fail();
 if(!same(executeOpenAnalysisIR(o.framework,task.source),o.calculation)||o.verification.grade!=='independent_arithmetic'||o.verification.plan_sha256!==taskHash(o.framework)||o.verification.inspection_sha256!==task.identity.scope_sha256||o.verification.result_sha256!==taskHash(o.calculation)||o.verification.value!==o.calculation.value||o.verification.rows!==o.calculation.rows)fail('VERIFICATION_FAILED');
 const facts=new Map((task.verified_steps??[]).filter(s=>same(s.identity,task.identity)).map(s=>[taskHash(s.framework.plan),{execution_plan:s.framework.plan,calculation:s.calculation,verification:s.verification}]));facts.set(taskHash(o.framework),{execution_plan:o.framework,calculation:o.calculation,verification:o.verification});
 for(const f of facts.values())if(!same(executeOpenAnalysisIR(f.execution_plan,task.source),f.calculation)||f.verification.plan_sha256!==taskHash(f.execution_plan)||f.verification.inspection_sha256!==task.identity.scope_sha256||f.verification.result_sha256!==taskHash(f.calculation))fail('VERIFICATION_FAILED');
 const evidence={verified_calculations:[...facts.values()]};validateNumericReport(report,evidence,{identity:task.identity,sources:task.source});
 const initial=o.judgment_review!;const snapshot=createJudgmentSnapshot({identity:task.identity,question:task.question,snapshotVersion:initial.snapshot.version,...(['1.3','1.4'].includes(initial.snapshot.document?.version??'')?{document:initial.snapshot.document}:{}),conditionSourceReferences:initial.snapshot.condition_source_catalog!==undefined,...(initial.snapshot.question_history?{question_history:judgmentQuestionHistory(task)}:{}),context:frame.context??null,binding:o.framework,evidence,report,sources:task.source,opinions:initial.snapshot.opinions,unavailable:initial.snapshot.unavailable});validateJudgmentReview(initial,snapshot,task.source);validateReviewUpdates(task);if(o.explanation.text!==initial.delivery)fail('SOURCE_CHANGED');
 const currentReport=validateNumericReport(review.snapshot.report,evidence,{identity:task.identity,sources:task.source}),edit=task.report_edits?.at(-1);
 return {version:'1.0',kind:'open_analysis_evidence',task_id:task.identity.task_id,revision:task.identity.revision,task_run_id:task.identity.run_id,attempt_id:task.identity.attempt_id,outcome_id:o.outcome_id,outcome_sha256:taskHash(o),scope_sha256:task.identity.scope_sha256,plan_sha256:taskHash(o.framework),result_sha256:taskHash(o.calculation),report_sha256:currentReport.report_sha256,review_sha256:review.review_sha256,review_snapshot_sha256:review.snapshot_sha256,review_state:review.state,numeric_status:report.status==='partial'||currentReport.status==='partial'?'partial':'complete',expression_version:String(edit?.expression_version??0),expression_sha256:edit?taskHash(edit):null};
}
export function analysisOriginCommand(owner:OpenMemberSourceRecord['owner'],source:OpenMemberReviewSource|ReviewedAnalysisSource){
 if(source.kind==='open_member_evidence')return openMemberOriginCommand(owner,source);
 const h=taskHash({kind:'reviewed_analysis_source',version:'1.0',owner,source});return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
}
export function validateAnalysisSourceRecord(input:unknown):AnalysisReviewSourceRecord{
 const raw=input as AnalysisReviewSourceRecord;
 if(raw.version==='1.0')return validateOpenMemberSourceRecord(raw);
 closed(raw,['version','origin_id','command_id','owner','source','task','created_at','sha256']);closed(raw.owner,['project_id','session_id','case_id','revision_id']);
 if(raw.version!=='1.1'||![raw.origin_id,raw.command_id,...Object.values(raw.owner)].every(membershipUuid)||typeof raw.created_at!=='string'||!Number.isFinite(Date.parse(raw.created_at))||new Date(raw.created_at).toISOString()!==raw.created_at)fail();
 const source=qualifyAnalysisReviewSource(raw.task),{sha256,...body}=raw;
 if(source.kind!=='open_analysis_evidence'||!same(source,raw.source)||raw.command_id!==analysisOriginCommand(raw.owner,source)||sha256!==taskHash(body))fail('SOURCE_CHANGED');return raw;
}
export function analysisReviewFindingFacts(raw:AnalysisReviewSourceRecord):AnalysisReviewFindingFacts{
 const record=validateAnalysisSourceRecord(raw);if(record.version==='1.0')return openMemberFindingFacts(record);
 const o=record.task.outcome!,r=deliveredJudgmentReview(record.task)!;
 return {version:'3.1',judgment:'Verified',verification_scope:'numeric_values_only',owner:record.owner,origin:{kind:'open_analysis_source',origin_id:record.origin_id,source_record_sha256:taskHash(record)},source:record.source,metrics:{values:r.snapshot.report.values.map(({id,label,value,unit,grade,status,scope,proof_sha256})=>({id,label,value,unit,grade,status,scope,proof_sha256})),numeric_status:record.source.numeric_status},judgment_review:{state:r.state,review_sha256:r.review_sha256,snapshot_sha256:r.snapshot_sha256,limitations:['Verified仅指所列数字核验范围；模型审查不构成语义/因果事实认证。',...r.rounds.at(-1)?.claims.flatMap(c=>[c.reason,...c.limitations])??[]]},causal_claim:'not_verified'};
}
export function validateAnalysisReviewFindingFacts(raw:unknown,record:AnalysisReviewSourceRecord){const expected=analysisReviewFindingFacts(record);if(!same(raw,expected))fail('VERIFICATION_FAILED');return expected;}
/** Existing private Finding carrier; the method identity comes from actual execution. */
export function analysisFindingStorageFacts(record:AnalysisReviewSourceRecord){
 const facts=analysisReviewFindingFacts(record);
 if(record.version==='1.0'){const m=closed(record.task.outcome!.verification.native_evidence!.primary.method,['id','version','code_identity']);if(typeof m.id!=='string'||typeof m.version!=='string')fail('VERIFICATION_FAILED');return {metrics:facts.metrics,method:{id:m.id,version:m.version},limitations:['算术核验不证明模型解释、假设或因果。']};}
 return {metrics:facts.metrics,method:{id:record.task.outcome!.calculation.method,version:record.task.outcome!.framework.version},limitations:(facts as ReviewedAnalysisFindingFacts).judgment_review.limitations};
}
