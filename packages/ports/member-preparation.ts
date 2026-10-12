import type {PreparedConfirmationContext,QualifiedMemberPreparation,NormalizedMemberData,PreparationReceipt} from '../product-core/member-preparation.ts';
import type {SourceQualification} from '../product-core/member-source-qualification.ts';
import type {OperationExecution} from '../product-core/member-operation.ts';
import type {SourceBinding} from '../product-core/member-source-qualification.ts';
import type {SelectedMemberSources} from '../product-core/member-source-set.ts';
import type {MemberSourceFile} from './member-source.ts';
export type PreparationContext=Readonly<{task_id:string;operation_id:string;execution_id:string;epoch:number}>;
export type PreparationFailure=Readonly<{physical_status:'not_started'|'settled'|'unknown';operation_context:PreparationContext|null}>;
export type PreparationAttempt=Readonly<{version:'1.0';context:PreparationContext;source_set_id:string;source_set_sha256:string;previous_execution_id:string|null;bindings:readonly SourceBinding[];code_sha256:string;status:'issued'|'failed'|'unknown'|'stopped'|'qualified';failure_code:string|null;physical_status:'not_started'|'settled'|'unknown'}>;
export interface MemberPreparationStore {
 readPlanPreparation(input:PreparedConfirmationContext):Promise<{preparation:QualifiedMemberPreparation;candidate:NormalizedMemberData;context:PreparedConfirmationContext}>;
 beginPreparation(input:{version:'1.0';task_id:string;source_set_id:string;grant_id:string;bindings:readonly SourceBinding[];code_sha256:string}):Promise<{attempt:PreparationAttempt;execution:OperationExecution;source_set:SelectedMemberSources;sources:readonly MemberSourceFile[];run_directory:string;prepared?:QualifiedMemberPreparation}>;
 failPreparation(input:{task_id:string;execution_id:string;failure:PreparationFailure|null;code:string}):Promise<PreparationAttempt>;
 completePreparation(input:{task_id:string;execution_id:string;receipt:PreparationReceipt;candidate:NormalizedMemberData;qualification:SourceQualification}):Promise<QualifiedMemberPreparation|null>;
 readQualifiedPreparation(input:{task_id:string;execution_id:string}):Promise<{preparation:QualifiedMemberPreparation;candidate:NormalizedMemberData}>;
 readPreparationAttempt(input:{task_id:string;execution_id:string}):Promise<PreparationAttempt>;
}
export interface MemberPreparationRuntime {
 executePreparation(input:unknown):Promise<unknown>;
 describePreparationSuccess(result:unknown):Readonly<{operation_context:PreparationContext|null;receipt_sha256:string}>|null;
 qualifySources(input:unknown):Promise<SourceQualification>;
 describePreparationFailure(error:unknown):PreparationFailure|null;
}
