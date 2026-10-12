import {validateXanthilDesktopRequest} from '../contracts/xanthil-desktop-ipc.ts';
import {desktopConfirmationDocuments,canonicalDesktopJson} from './xanthil-desktop-decision-case.ts';
import {membershipBytesHash,membershipRecord,membershipUuid,membershipAnalysisIntent,type MembershipAnalysisIntent} from './member-analysis.ts';
import {fail,taskHash} from './member-task.ts';
import {memberSourceBindings,type SourceQualification} from './member-source-qualification.ts';
import type {SelectedMemberSources} from './member-source-set.ts';
import type {PreparationContext,PreparationAttempt} from '../ports/member-preparation.ts';
export type NormalizedMemberData=Readonly<{members_bytes:Uint8Array;orders_bytes:Uint8Array}>;
export type PreparationReceipt=Readonly<{version:'1.0';status:'unqualified';operation_context:PreparationContext;request_sha256:string;code_sha256:string;helper_sha256:string;policy_sha256:string;outcome_sha256:string;sources:readonly Readonly<{source_id:string;sha256:string;byte_length:number}>[];outputs:Readonly<Record<'members'|'orders',Readonly<{sha256:string;byte_length:number}>>>}>;
export type QualifiedMemberPreparation=Readonly<{version:'1.0';id:string;status:'qualified';owner:SelectedMemberSources['owner'];context:PreparationContext;source_set_id:string;source_set_sha256:string;previous_execution_id:string|null;bindings_sha256:string;code_sha256:string;extraction_version:'1.0';receipt:PreparationReceipt;receipt_sha256:string;qualification:SourceQualification;lineage_sha256:string;stages:Readonly<{extraction:'verified';execution:'settled';conversion:'qualified'}>;sha256:string}>;
const digest=(value:unknown)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function preparationContext(value:unknown):PreparationContext {
 const c=membershipRecord(value,['task_id','operation_id','execution_id','epoch']);
 if(!membershipUuid(c.task_id)||!membershipUuid(c.operation_id)||!membershipUuid(c.execution_id)||!Number.isSafeInteger(c.epoch)||Number(c.epoch)<0)fail('INTEGRITY_BLOCKED');
 return {task_id:c.task_id,operation_id:c.operation_id,execution_id:c.execution_id,epoch:Number(c.epoch)};
}
export function preparationAttempt(value:unknown):PreparationAttempt {
 const a=membershipRecord(value,['version','context','source_set_id','source_set_sha256','previous_execution_id','bindings','code_sha256','status','failure_code','physical_status']);
 preparationContext(a.context);memberSourceBindings(a.bindings);
 if(a.previous_execution_id!==null&&!membershipUuid(a.previous_execution_id))fail('INTEGRITY_BLOCKED');
 if(a.version!=='1.0'||!membershipUuid(a.source_set_id)||!digest(a.source_set_sha256)||!digest(a.code_sha256)||!['issued','failed','unknown','stopped','qualified'].includes(String(a.status))||!['not_started','settled','unknown'].includes(String(a.physical_status))||a.failure_code!==null&&(typeof a.failure_code!=='string'||!/^[A-Z0-9_]{1,80}$/.test(a.failure_code)))fail('INTEGRITY_BLOCKED');
 return structuredClone(value) as PreparationAttempt;
}
export function preparationReceipt(value:unknown):PreparationReceipt {
 const r=membershipRecord(value,['version','status','operation_context','request_sha256','code_sha256','helper_sha256','policy_sha256','outcome_sha256','sources','outputs']);
 preparationContext(r.operation_context);
 if(r.version!=='1.0'||r.status!=='unqualified'||!Array.isArray(r.sources)||r.sources.length<1||r.sources.length>32)fail('INTEGRITY_BLOCKED');
 for(const k of ['request_sha256','code_sha256','helper_sha256','policy_sha256','outcome_sha256'])if(!digest(r[k]))fail('INTEGRITY_BLOCKED');
 const ids=new Set();for(const v of r.sources){const s=membershipRecord(v,['source_id','sha256','byte_length']);if(!membershipUuid(s.source_id)||ids.has(s.source_id)||!digest(s.sha256)||!Number.isSafeInteger(s.byte_length)||Number(s.byte_length)<1)fail('INTEGRITY_BLOCKED');ids.add(s.source_id);}
 const outputs=membershipRecord(r.outputs,['members','orders']);for(const role of ['members','orders']){const d=membershipRecord(outputs[role],['sha256','byte_length']);if(!digest(d.sha256)||!Number.isSafeInteger(d.byte_length)||Number(d.byte_length)<1||Number(d.byte_length)>1048576)fail('INTEGRITY_BLOCKED');}
 return structuredClone(value) as PreparationReceipt;
}
export function normalizedMemberData(value:unknown):NormalizedMemberData {
 const c=membershipRecord(value,['members_bytes','orders_bytes']);
 if(!(c.members_bytes instanceof Uint8Array)||!(c.orders_bytes instanceof Uint8Array)||!c.members_bytes.length||!c.orders_bytes.length||c.members_bytes.length>1048576||c.orders_bytes.length>1048576)fail('CONVERSION_UNQUALIFIED');
 return {members_bytes:Buffer.from(c.members_bytes),orders_bytes:Buffer.from(c.orders_bytes)};
}
export function assertPreparationCandidate(receipt:PreparationReceipt,candidate:NormalizedMemberData) {
 for(const role of ['members','orders'] as const)if(receipt.outputs[role].sha256!==membershipBytesHash(candidate[`${role}_bytes`])||receipt.outputs[role].byte_length!==candidate[`${role}_bytes`].length)fail('PREPARATION_PROVENANCE_INVALID');
}
export function qualifiedMemberPreparation(value:unknown):QualifiedMemberPreparation {
 const p=membershipRecord(value,['version','id','status','owner','context','source_set_id','source_set_sha256','previous_execution_id','bindings_sha256','code_sha256','extraction_version','receipt','receipt_sha256','qualification','lineage_sha256','stages','sha256']);
 if(p.previous_execution_id!==null&&!membershipUuid(p.previous_execution_id))fail('INTEGRITY_BLOCKED');
 if(p.version!=='1.0'||p.status!=='qualified'||p.extraction_version!=='1.0'||!membershipUuid(p.id)||!membershipUuid(p.source_set_id))fail('INTEGRITY_BLOCKED');
 const owner=membershipRecord(p.owner,['project_id','session_id','case_id','revision_id']);if(Object.values(owner).some(v=>!membershipUuid(v)))fail('INTEGRITY_BLOCKED');
 const context=preparationContext(p.context),receipt=preparationReceipt(p.receipt),q=p.qualification as SourceQualification;
 const stages=membershipRecord(p.stages,['extraction','execution','conversion']);if(stages.extraction!=='verified'||stages.execution!=='settled'||stages.conversion!=='qualified')fail('INTEGRITY_BLOCKED');
 for(const k of ['source_set_sha256','bindings_sha256','code_sha256','receipt_sha256','lineage_sha256','sha256'])if(!digest(p[k]))fail('INTEGRITY_BLOCKED');
 const {sha256,...body}=p;
 if(taskHash(body)!==sha256||taskHash(receipt)!==p.receipt_sha256||taskHash(context)!==taskHash(receipt.operation_context)||receipt.code_sha256!==p.code_sha256||!q||q.version!=='1.0'||q.status!=='qualified'||q.bindings_sha256!==p.bindings_sha256||taskHash(q.lineage)!==p.lineage_sha256)fail('INTEGRITY_BLOCKED');
 return structuredClone(value) as QualifiedMemberPreparation;
}

/** Analysis contracts retain their decimal-string canonical format; resolve this exact reference in the Store. */
export type PreparationPlanBinding=Readonly<{id:string;sha256:string;owner:QualifiedMemberPreparation['owner'];source_set_id:string;source_set_sha256:string;task_id:string;execution_id:string;operation_id:string;epoch:string;code_sha256:string;receipt_sha256:string;qualification_sha256:string;lineage_sha256:string;normalized:Readonly<Record<'members'|'orders',Readonly<{sha256:string;byte_length:string}>>>}>;
export function bindQualifiedPreparation(value:QualifiedMemberPreparation):PreparationPlanBinding {
 const p=qualifiedMemberPreparation(value);
 return {id:p.id,sha256:p.sha256,owner:p.owner,source_set_id:p.source_set_id,source_set_sha256:p.source_set_sha256,task_id:p.context.task_id,execution_id:p.context.execution_id,operation_id:p.context.operation_id,epoch:String(p.context.epoch),code_sha256:p.code_sha256,receipt_sha256:p.receipt_sha256,qualification_sha256:p.qualification.qualification_sha256,lineage_sha256:p.lineage_sha256,normalized:p.qualification.normalized};
}
export function validatePreparationPlanBinding(value:unknown):PreparationPlanBinding {
 const p=membershipRecord(value,['id','sha256','owner','source_set_id','source_set_sha256','task_id','execution_id','operation_id','epoch','code_sha256','receipt_sha256','qualification_sha256','lineage_sha256','normalized']);
 const owner=membershipRecord(p.owner,['project_id','session_id','case_id','revision_id']);
 for(const v of [p.id,p.source_set_id,p.task_id,p.execution_id,p.operation_id,...Object.values(owner)])if(!membershipUuid(v))fail('INTEGRITY_BLOCKED');
 for(const k of ['sha256','source_set_sha256','code_sha256','receipt_sha256','qualification_sha256','lineage_sha256'])if(!digest(p[k]))fail('INTEGRITY_BLOCKED');
 if(typeof p.epoch!=='string'||!/^(0|[1-9]\d*)$/.test(p.epoch)||!Number.isSafeInteger(Number(p.epoch)))fail('INTEGRITY_BLOCKED');
 const normalized=membershipRecord(p.normalized,['members','orders']);for(const role of ['members','orders']){const d=membershipRecord(normalized[role],['sha256','byte_length']);if(!digest(d.sha256)||typeof d.byte_length!=='string'||!/^[1-9]\d*$/.test(d.byte_length)||Number(d.byte_length)>1048576)fail('INTEGRITY_BLOCKED');}
 return structuredClone(value) as PreparationPlanBinding;
}
export type PreparedConfirmationContext=Readonly<{version:'2.0';intent:MembershipAnalysisIntent;preparation:PreparationPlanBinding;authority:Readonly<{task_id:string;grant_id:string;epoch:string;resume_preparation_sha256?:string}>}>;
export function preparedConfirmationContext(value:unknown):PreparedConfirmationContext {
 const x=membershipRecord(value,['version','preparation','authority','intent']),intent=membershipAnalysisIntent(x.intent),preparation=validatePreparationPlanBinding(x.preparation),authority=preparationAuthority(x.authority,preparation);
 if(x.version!=='2.0'||!membershipUuid(authority.task_id)||!membershipUuid(authority.grant_id)||authority.task_id!==preparation.task_id)fail('AUTHORITY_REQUIRED');
 return {version:'2.0',intent,preparation,authority};
}

export type PreparedConfirmationRequest=Omit<import('../contracts/xanthil-desktop-ipc.ts').ConfirmRevisionRequest,'contract_version'|'confirmation'>&{contract_version:'2.0';confirmation:Omit<import('../contracts/xanthil-desktop-ipc.ts').ConfirmRevisionRequest['confirmation'],'hypothesis_id'>&{analysis_kind:'overall_change'}};
export function validateMemberConfirmation(value:unknown):import('../contracts/xanthil-desktop-ipc.ts').ConfirmRevisionRequest|PreparedConfirmationRequest{
 if((value as {contract_version?:unknown})?.contract_version!=='2.0')return validateXanthilDesktopRequest('confirmRevision',value);
 const x=membershipRecord(value,['contract_version','command_id','project_id','session_id','case_id','revision_id','expected_row_version','inspection_token','confirmation']),choice=membershipRecord(x.confirmation,['column_mapping','comparison_period','current_period','currency','time_zone','valid_statuses','issue_treatments','selected_group_mode','analysis_kind','method_id','method_version','authority_confirmed','issues_confirmed','plan_confirmed']);
 if(choice.analysis_kind!=='overall_change')fail();const {analysis_kind,...rest}=choice;void analysis_kind;
 const checked=validateXanthilDesktopRequest('confirmRevision',{...x,contract_version:'1.0',confirmation:{...rest,hypothesis_id:'current_repurchase_rate_lower_than_comparison'}}),{hypothesis_id,...validated}=checked.confirmation;void hypothesis_id;
 return {...checked,contract_version:'2.0',confirmation:{...validated,analysis_kind:'overall_change'}};
}
export function memberConfirmationDocuments(context:Parameters<typeof desktopConfirmationDocuments>[0],choice:import('../contracts/xanthil-desktop-ipc.ts').ConfirmRevisionRequest['confirmation']|PreparedConfirmationRequest['confirmation']){
 if(!('analysis_kind' in choice))return desktopConfirmationDocuments(context,choice);
 const {analysis_kind,...rest}=choice,documents=desktopConfirmationDocuments(context,{...rest,hypothesis_id:'current_repurchase_rate_lower_than_comparison'}),legacy=JSON.parse(new TextDecoder().decode(documents.contract_bytes)),{hypothesis_id,...body}=legacy;void hypothesis_id;
 return {...documents,contract_bytes:new TextEncoder().encode(canonicalDesktopJson({...body,schema_version:'2.0',analysis_kind}))};
}

export function preparationAuthority(value:unknown,preparation:PreparationPlanBinding):PreparedConfirmationContext['authority']{
 const a=membershipRecord(value,['task_id','grant_id','epoch',...(Object.hasOwn(value as object,'resume_preparation_sha256')?['resume_preparation_sha256']:[])]);
 if(!membershipUuid(a.task_id)||!membershipUuid(a.grant_id)||a.task_id!==preparation.task_id||typeof a.epoch!=='string'||!/^(0|[1-9]\d*)$/.test(a.epoch)||!Number.isSafeInteger(Number(a.epoch)))fail('AUTHORITY_REQUIRED');
 if(Object.hasOwn(a,'resume_preparation_sha256')){if(a.resume_preparation_sha256!==preparation.sha256||Number(a.epoch)<Number(preparation.epoch))fail('AUTHORITY_REQUIRED');}
 else if(a.epoch!==preparation.epoch)fail('AUTHORITY_REQUIRED');
 return {task_id:a.task_id,grant_id:a.grant_id,epoch:a.epoch,...(Object.hasOwn(a,'resume_preparation_sha256')?{resume_preparation_sha256:String(a.resume_preparation_sha256)}:{})};
}
