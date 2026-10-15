import {taskHash,encodeTask} from '../product-core/member-task.ts';
import {membershipRecord as closed,membershipUuid} from '../product-core/member-analysis.ts';
import type {OpenPreparationContent,OpenPreparationSnapshot,OpenTaskIdentity} from '../ports/open-analysis-store.ts';

export const preparationProducers=['assess_meaning','describe_meaning','interpret_meaning','bind_measurement','describe_business','set_framework','set_multisource_framework','set_joined_framework','set_membership_framework','set_document_framework','set_metric_asset_framework','set_analysis_steps','read_analysis_evidence'] as const;
export const preparationLimits=Object.freeze({snapshotBytes:16*1024*1024,totalBytes:64*1024*1024,snapshots:1000,candidates:64});
const identityKeys=['task_id','revision','run_id','attempt_id','operation_id','grant_id','scope_sha256','config_sha256'];
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function preparationHash(value:OpenPreparationContent&{identity:OpenTaskIdentity;epoch:number;preview_command_id:string|null}){
 const {identity,epoch,preview_command_id,semantics,business,framework,candidate_plans}=value;
 return taskHash({identity,epoch,preview_command_id,semantics,business,framework,candidate_plans});
}
export function validatePreparationEnvelope(value:OpenPreparationSnapshot){
 closed(value,['version','snapshot_id','identity','epoch','preview_command_id','previous_snapshot_id','producer','created_at','content_sha256','semantics','business','framework','candidate_plans']);
 const id=closed(value.identity,identityKeys);
 if(!['task_id','run_id','attempt_id','operation_id','grant_id'].every(k=>membershipUuid(id[k]))||typeof id.revision!=='string'||! /^[1-9]\d*$/.test(id.revision)||!['scope_sha256','config_sha256'].every(k=>typeof id[k]==='string'&&/^[a-f0-9]{64}$/.test(String(id[k]))))fail('INTEGRITY_BLOCKED');
 if(value.version!=='1.0'||!membershipUuid(value.snapshot_id)||!Number.isSafeInteger(value.epoch)||value.epoch<0||value.preview_command_id!==null&&!membershipUuid(value.preview_command_id)||value.previous_snapshot_id!==null&&!membershipUuid(value.previous_snapshot_id)||!preparationProducers.includes(value.producer)||typeof value.created_at!=='string'||! /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.created_at)||!Number.isFinite(Date.parse(value.created_at))||new Date(value.created_at).toISOString()!==value.created_at||value.content_sha256!==preparationHash(value))fail('INTEGRITY_BLOCKED');
 if(!Array.isArray(value.candidate_plans)||value.candidate_plans.length>preparationLimits.candidates||Buffer.byteLength(encodeTask(value))>preparationLimits.snapshotBytes)fail('PREPARATION_LIMIT');
}
export function samePreparationOwner(a:Pick<OpenPreparationSnapshot,'identity'|'epoch'|'preview_command_id'>,b:Pick<OpenPreparationSnapshot,'identity'|'epoch'|'preview_command_id'>){return taskHash(a.identity)===taskHash(b.identity)&&a.epoch===b.epoch&&a.preview_command_id===b.preview_command_id;}
