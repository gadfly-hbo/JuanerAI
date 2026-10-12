import {membershipBytesHash,membershipRecord,membershipUuid} from '../product-core/member-analysis.ts';
import {memberSourceBindings} from '../product-core/member-source-qualification.ts';
import {normalizedMemberData,preparationReceipt,assertPreparationCandidate} from '../product-core/member-preparation.ts';
import {fail,taskHash} from '../product-core/member-task.ts';
import type {MemberPreparationStore,MemberPreparationRuntime,PreparationFailure} from '../ports/member-preparation.ts';

export function createMemberPreparationApplication(store:MemberPreparationStore,runtime:MemberPreparationRuntime) {
 return {async prepare(input:unknown,signal:AbortSignal) {
  const x=membershipRecord(input,['version','task_id','source_set_id','grant_id','bindings','code']);
  if(x.version!=='1.0'||!membershipUuid(x.task_id)||!membershipUuid(x.source_set_id)||!membershipUuid(x.grant_id)||typeof x.code!=='string'||!x.code||Buffer.byteLength(x.code)>65536||!(signal instanceof AbortSignal))fail();
  const bindings=memberSourceBindings(x.bindings),code=x.code;
  if(signal.aborted)fail('CANCELLED');
  const started=await store.beginPreparation({version:'1.0',task_id:x.task_id,source_set_id:x.source_set_id,grant_id:x.grant_id,bindings,code_sha256:membershipBytesHash(Buffer.from(code))});
  if(started.prepared)return started.prepared;
  let physical:PreparationFailure|null=null,prepared;
  try {
   const result=await runtime.executePreparation({version:'1.0',sources:started.sources.map(s=>({...s,sha256:membershipBytesHash(s.bytes)})),code,code_sha256:started.attempt.code_sha256,run_directory:started.run_directory,cancellation_signal:signal,operation_context:started.attempt.context});
   const evidence=runtime.describePreparationSuccess(result);
   if(!evidence||taskHash(evidence.operation_context)!==taskHash(started.attempt.context))fail('PREPARATION_PROVENANCE_INVALID');
   physical={physical_status:'settled',operation_context:started.attempt.context};
   const value=membershipRecord(result,['candidate','receipt']);
   if(taskHash(value.receipt)!==evidence.receipt_sha256)fail('PREPARATION_PROVENANCE_INVALID');
   const receipt=preparationReceipt(value.receipt),candidate=normalizedMemberData(value.candidate);assertPreparationCandidate(receipt,candidate);
   if(signal.aborted)fail('CANCELLED');
   const qualification=await runtime.qualifySources({sources:started.sources,bindings,candidate,cancellation_signal:signal,deadline_seconds:10});
   if(signal.aborted)fail('CANCELLED');
   prepared=await store.completePreparation({task_id:started.attempt.context.task_id,execution_id:started.attempt.context.execution_id,receipt,candidate,qualification});
  }catch(error){
   const raw=(error as {code?:unknown})?.code,code=typeof raw==='string'&&/^[A-Z0-9_]{1,80}$/.test(raw)?raw:'PREPARATION_EXECUTION_FAILED';
   await store.failPreparation({task_id:started.attempt.context.task_id,execution_id:started.attempt.context.execution_id,failure:physical??runtime.describePreparationFailure(error),code});
   fail(code);
  }
  if(!prepared)fail('CANCELLED');return prepared;
 }};
}
