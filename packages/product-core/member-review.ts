import type {MembershipDecisionFields} from '../contracts/case-assistant.ts';
import {validateAssistantDecision,assistantText} from './case-assistant.ts';
import type {OwnerRef,SaveFormInput} from '../contracts/xanthil-desktop-ipc.ts';
import {validateXanthilDesktopRequest} from '../contracts/xanthil-desktop-ipc.ts';
import {membershipUuid} from './member-analysis.ts';
import {closed,fail,taskHash} from './member-task.ts';

export type ReviewClosure=Extract<SaveFormInput,{kind:'decision_closure'}>;
export type ReviewFields={actor:string;questions:string;closure:ReviewClosure;decision:unknown|null};
export type ReviewSource={owner:OwnerRef;case_row_version:string;finding_id:string;run_id:string;plan_sha256:string;report_id:string;report_version:string;report_sha256:string};
export type MembershipReview={version:'1.0';id:string;sequence:number;task_id:string;source:ReviewSource;baseline_decision_id:string|null;intent_id:string;fields:ReviewFields;created_at:string;sha256:string};
export type ReviewSubmission={task_id:string;review_id:string;review_version:number;review_sha256:string;intent_id:string;outcome:'choice'|'analysis'|'more_evidence';at:string};
export type ReviewReceipt=ReviewSubmission&{kind:'human_review';acceptance_id:string|null;closure_id:string|null;decision_id:string|null;expected_id:string|null;report_id:string|null};
export function validateReviewReceipt(input:ReviewReceipt){closed(input,['task_id','review_id','review_version','review_sha256','intent_id','outcome','at','kind','acceptance_id','closure_id','decision_id','expected_id','report_id']);if(input.kind!=='human_review'||!['choice','analysis','more_evidence'].includes(input.outcome)||![input.task_id,input.review_id,input.intent_id].every(membershipUuid)||!Number.isSafeInteger(input.review_version)||input.review_version<1||!Number.isFinite(Date.parse(input.at)))fail();for(const key of ['acceptance_id','closure_id','report_id','decision_id','expected_id'] as const){const required=input.outcome==='choice'||input.outcome==='analysis'&&!['decision_id','expected_id'].includes(key);if(required?!membershipUuid(input[key]):input[key]!==null)fail();}return input;}
export function reviewFields(input:unknown,source:ReviewSource):ReviewFields{
 const v=closed(input,['actor','questions','closure','decision']);if(typeof v.actor!=='string'||typeof v.questions!=='string')fail();
 const closure=validateXanthilDesktopRequest('saveForm',{contract_version:'1.0',command_id:source.report_id,...source.owner,expected_row_version:source.case_row_version,form:v.closure}).form;if(closure.kind!=='decision_closure')fail();
 // An incomplete decision remains local draft data; formal validation is separate.
 if(v.decision!==null){const d=closed(v.decision,['choice','candidate_id','rationale','owner','confirmed_at','evidence_refs','finding_refs','alternatives','limitations','defer_trigger','defer_owner','outcome']);if(![null,'candidate','no_action','defer'].includes(d.choice as null)||d.candidate_id!==null&&!membershipUuid(d.candidate_id)||!['rationale','owner','confirmed_at','alternatives','limitations','defer_trigger','defer_owner'].every(k=>typeof d[k]==='string')||![d.evidence_refs,d.finding_refs].every(v=>Array.isArray(v)&&v.every(x=>typeof x==='string')))fail();
 const o=closed(d.outcome,['applicable','baseline','baseline_source','observation_object','metric','expectation','observation_window','guardrails','dependencies','guardrail_applicable','guardrail_not_applicable_reason','result_source','result_owner','assessment','assessment_owner','not_applicable_reason','reassess_trigger','reassess_owner']);if(Object.entries(o).some(([k,v])=>['applicable','guardrail_applicable'].includes(k)?v!==null&&typeof v!=='boolean':typeof v!=='string'))fail();}
 return structuredClone(input) as ReviewFields;
}
export function validateReview(input:MembershipReview):MembershipReview{
 closed(input,['version','id','sequence','task_id','source','baseline_decision_id','intent_id','fields','created_at','sha256']);const source=closed(input.source,['owner','case_row_version','finding_id','run_id','plan_sha256','report_id','report_version','report_sha256']);closed(source.owner,['project_id','session_id','case_id','revision_id']);
 if(input.version!=='1.0'||![input.id,input.task_id,input.intent_id,input.source.finding_id,input.source.report_id,...Object.values(input.source.owner)].every(membershipUuid)||!Number.isSafeInteger(input.sequence)||input.sequence<1||!Number.isFinite(Date.parse(input.created_at))||input.baseline_decision_id!==null&&!membershipUuid(input.baseline_decision_id))fail();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.source.run_id)||![input.source.plan_sha256,input.source.report_sha256,input.sha256].every(s=>/^[a-f0-9]{64}$/.test(s))||![input.source.case_row_version,input.source.report_version].every(s=>/^[1-9][0-9]*$/.test(s)))fail();
 const {sha256,...body}=input;if(taskHash(body)!==sha256)fail('SOURCE_CHANGED');reviewFields(input.fields,input.source);return input;
}

export function validateReviewDecision(input:unknown,context:Parameters<typeof validateAssistantDecision>[1]):MembershipDecisionFields{
 const d=closed(input,['choice','candidate_id','rationale','owner','confirmed_at','evidence_refs','finding_refs','alternatives','limitations','defer_trigger','defer_owner','outcome']);
 const o=closed(d.outcome,['applicable','baseline','baseline_source','observation_object','metric','expectation','observation_window','guardrails','dependencies','guardrail_applicable','guardrail_not_applicable_reason','result_source','result_owner','assessment','assessment_owner','not_applicable_reason','reassess_trigger','reassess_owner']);
 const {dependencies,guardrail_applicable,guardrail_not_applicable_reason,...legacy}=o;
 if(!assistantText(dependencies)||typeof guardrail_applicable!=='boolean'||typeof guardrail_not_applicable_reason!=='string'||(guardrail_applicable?!assistantText(o.guardrails)||guardrail_not_applicable_reason!=='':!assistantText(guardrail_not_applicable_reason)||o.guardrails!==''))fail();
 // Reuse legacy fact/reference/completeness validation; retain distinct explicit
 // guardrail inapplicability in the persisted P1 contract, never as a missing value.
 const checked=validateAssistantDecision({...d,outcome:{...legacy,guardrails:guardrail_applicable?o.guardrails:guardrail_not_applicable_reason}},context);
 return {...checked,outcome:{...checked.outcome,guardrails:o.guardrails as string,dependencies,guardrail_applicable,guardrail_not_applicable_reason}};
}
