import type {MembershipModelContext,MembershipModelPayload,MembershipModelResult,MembershipPhysicalOutcome} from '../product-core/member-model.ts';
import type {OperationPolicy} from '../product-core/member-operation.ts';
export type MemberModelAttempt={version:'1.0';context:MembershipModelContext;source_set_id:string|null;policy:OperationPolicy;payload:MembershipModelPayload;status:'issued'|'succeeded'|'failed'|'unknown'|'stopped';failure_code:string|null;result:MembershipModelResult|null};
export interface MemberModelStore {
 answerMemberQuestion(input:unknown):Promise<{grant_id:string;task_id:string;epoch:number;source_set_id:string|null;clarification_sha256:string;created:boolean}>;
 authorizeMemberModel(input:unknown):Promise<{grant_id:string;task_id:string;epoch:number;policy:OperationPolicy;created:boolean}>;
 beginMemberModel(input:unknown):Promise<MemberModelAttempt>;
 finishMemberModel(input:{task_id:string;execution_id:string;proof:MembershipPhysicalOutcome|null;result:MembershipModelResult|null;failure_code:string|null}):Promise<MemberModelAttempt>;
 readCurrentMemberAnalysis(input:{task_id:string}):Promise<{run_id:string}|null>;
 publishMemberExplanation(input:{task_id:string;execution_id:string}):Promise<{report_id:string}>;
 readMemberModelForPreparation(input:{task_id:string;execution_id:string;grant_id:string}):Promise<MemberModelAttempt>;
 readMemberModel(input:{task_id:string;execution_id:string}):Promise<MemberModelAttempt>;
}
