import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {assistantText} from './case-assistant.ts';
import {reviewFields,validateReviewDecision,type ReviewFields,type ReviewReceipt} from './member-review.ts';
import type {OpenMemberFindingFacts,OpenMemberFindingReceipt,OpenMemberSourceRecord} from './open-membership.ts';
export type NativeMemberReviewSource=Readonly<{version:'1.0';kind:'native_member_finding';origin_id:string;source_record_sha256:string;owner:OpenMemberSourceRecord['owner'];task_id:string;task_revision:string;task_run_id:string;attempt_id:string;outcome_id:string;outcome_sha256:string;case_row_version:string;finding_id:string;report_id:string;report_version:string;report_sha256:string;evidence_refs:readonly string[]}>;
export type NativeMemberReview=Readonly<{version:'2.0';id:string;sequence:number;intent_id:string;source:NativeMemberReviewSource;baseline_decision_id:string|null;fields:ReviewFields;created_at:string;sha256:string}>;
function fail(code='VALIDATION_FAILED'):never{throw Object.assign(Error(code),{code,stack:code});}
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v),sequence=(v:unknown)=>typeof v==='string'&&/^[1-9]\d*$/.test(v);
export function validateNativeMemberReview(raw:unknown):NativeMemberReview{
 const x=closed(raw,['version','id','sequence','intent_id','source','baseline_decision_id','fields','created_at','sha256']),s=closed(x.source,['version','kind','origin_id','source_record_sha256','owner','task_id','task_revision','task_run_id','attempt_id','outcome_id','outcome_sha256','case_row_version','finding_id','report_id','report_version','report_sha256','evidence_refs']),o=closed(s.owner,['project_id','session_id','case_id','revision_id']);
 if(x.version!=='2.0'||![x.id,x.intent_id,...Object.values(o),s.origin_id,s.task_id,s.task_run_id,s.attempt_id,s.outcome_id,s.finding_id,s.report_id].every(membershipUuid)||s.version!=='1.0'||s.kind!=='native_member_finding'||![s.source_record_sha256,s.outcome_sha256,s.report_sha256].every(hash)||![s.task_revision,s.case_row_version,s.report_version].every(sequence)||!Number.isSafeInteger(x.sequence)||Number(x.sequence)<1||x.baseline_decision_id!==null&&!membershipUuid(x.baseline_decision_id)||typeof x.created_at!=='string'||!Number.isFinite(Date.parse(x.created_at))||new Date(x.created_at).toISOString()!==x.created_at||!Array.isArray(s.evidence_refs)||taskHash(s.evidence_refs)!==taskHash([`open-member:${s.origin_id}:primary`,`open-member:${s.origin_id}:independent`,`open-member:${s.origin_id}:source`]))fail();
 const checked=raw as NativeMemberReview;reviewFields(checked.fields,checked.source);const {sha256,...body}=checked;if(sha256!==taskHash(body))fail('INTEGRITY_BLOCKED');return structuredClone(checked);
}
export function createNativeMemberReview(input:{id:string;intent_id:string;sequence:number;facts:OpenMemberFindingFacts;publication:OpenMemberFindingReceipt;report:{report_id:string;version:string;sha256:string};baseline_decision_id:string|null;created_at:string;fields?:ReviewFields}):NativeMemberReview{
 const {facts:f,publication:p,report:r}=input;
 if(f.version!=='3.0'||p.kind!=='native_member_finding'||!p.saved||taskHash(f.owner)!==taskHash(p.owner)||f.origin.origin_id!==p.origin_id||f.origin.source_record_sha256!==p.source_record_sha256||r.report_id!==p.report_id)fail('SOURCE_CHANGED');
 const source:NativeMemberReviewSource={version:'1.0',kind:'native_member_finding',origin_id:p.origin_id,source_record_sha256:p.source_record_sha256,owner:p.owner,task_id:f.source.task_id,task_revision:f.source.revision,task_run_id:f.source.task_run_id,attempt_id:f.source.attempt_id,outcome_id:f.source.outcome_id,outcome_sha256:f.source.outcome_sha256,case_row_version:p.row_version,finding_id:p.finding_id,report_id:p.report_id,report_version:r.version,report_sha256:r.sha256,evidence_refs:[`open-member:${p.origin_id}:primary`,`open-member:${p.origin_id}:independent`,`open-member:${p.origin_id}:source`]};
 const fields=input.fields??{actor:'',questions:'',decision:null,closure:{kind:'decision_closure',candidates:[],route:'insufficient_evidence',insufficient_reason:'本版会员指标已独立核验。描述性差异不能证明原因，也未验证业务方案的收益、风险与适用条件；本轮尚无业务选择。',preferred_candidate_id:null,preferred_reason:null,disposition:'draft',defer_until:null}};
 const body={version:'2.0' as const,id:input.id,sequence:input.sequence,intent_id:input.intent_id,source,baseline_decision_id:input.baseline_decision_id,fields,created_at:input.created_at};return validateNativeMemberReview({...body,sha256:taskHash(body)});
}
/** Only an explicitly submitted whole human review can reach a formal effect. */
export function nativeReviewSubmission(raw:unknown,outcome:'analysis'|'more_evidence'|'choice'){
 const review=validateNativeMemberReview(raw);if(!assistantText(review.fields.actor))fail('AUTHORITY_REQUIRED');
 if(outcome==='more_evidence'){if(!assistantText(review.fields.questions)||review.fields.decision!==null)fail('EVIDENCE_REQUIRED');return {review,closure:null,decision:null};}
 if(outcome==='analysis'){if(review.fields.decision!==null||review.fields.closure.route!=='insufficient_evidence'||review.fields.closure.candidates.length||review.fields.closure.preferred_candidate_id!==null)fail('DECISION_REQUIRED');return {review,closure:review.fields.closure,decision:null};}
 if(outcome!=='choice')fail();const decision=validateReviewDecision(review.fields.decision,{evidence_refs:review.source.evidence_refs,finding_id:review.source.finding_id,candidates:review.fields.closure.candidates});return {review,closure:review.fields.closure,decision};
}

export type NativeMemberReviewSaveReceipt=Readonly<{version:'1.0';kind:'native_member_review_saved';command_id:string;review:NativeMemberReview}>;
export type NativeMemberReviewSubmitReceipt=Omit<ReviewReceipt,'kind'>&Readonly<{kind:'native_human_review';command_id:string}>;
