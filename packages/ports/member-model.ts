import type {MembershipModelContext,MembershipModelPayload,MembershipModelResult,MembershipModelOutput} from '../product-core/member-model.ts';
import type {OperationPolicy,OperationExecution} from '../product-core/member-operation.ts';
import type {OpenTaskIdentity} from './open-analysis-store.ts';
import type {AnalysisAgent,AnalysisCompletion} from './analysis-agent.ts';
/** Saved MODEL material and optional public completion proof; never a run/attempt state. */
export type MemberModelProposal={version:'3.0';context:MembershipModelContext;grant_id:string;invocation_id:string;source_set_id:string|null;policy:OperationPolicy;payload:MembershipModelPayload;result:MembershipModelResult;completion:AnalysisCompletion|null};
export type MemberModelAuthorization={grant_id:string;command_id:string;work_id:string;identity:OpenTaskIdentity;payload:MembershipModelPayload;policy:OperationPolicy;disclose_verified_result:boolean;expires_at:string};
export type MemberModelProofs=Pick<AnalysisAgent,'assertCompleted'|'assertInvocation'>;
export interface MemberModelStore {
 readOperations?(input:{task_id:string}):Promise<{operations:readonly unknown[];usage:OperationExecution[];totals:{calls:string;local_runs:string;unresolved:number;input_tokens:{known:string;unknown:number};output_tokens:{known:string;unknown:number};active_ms:{known:string;unknown:number};wait_ms:{known:string;unknown:number}}}>;
 answerMemberQuestion(input:unknown):Promise<{grant_id:string;task_id:string;epoch:number;source_set_id:string|null;clarification_sha256:string;created:boolean}>;
 authorizeMemberModel(input:unknown):Promise<{grant_id:string;task_id:string;epoch:number;policy:OperationPolicy;created:boolean}>;
 memberModelIdentities(task_id:string):readonly {grant_id:string;identity:OpenTaskIdentity}[];
 memberModelAuthorization(grant_id:string):MemberModelAuthorization;
 memberModelAuthorized(grant_id:string):boolean;
 authorizesMemberWork(work_id:string,phase:'bind'|'advance'|'record'|'read'):boolean;
 recordMemberProposal(input:{grant_id:string;execution_id:string;invocation_id:string;payload:MembershipModelPayload;output:MembershipModelOutput}):Promise<MemberModelProposal>;
 completeMemberProposals(grant_id:string,completion:AnalysisCompletion):Promise<readonly MemberModelProposal[]>;
 readMemberVerifiedPayload(grant_id:string):Promise<MembershipModelPayload>;
 readCurrentMemberAnalysis(input:{task_id:string}):Promise<{run_id:string}|null>;
 publishMemberExplanation(input:{task_id:string;execution_id:string}):Promise<{report_id:string}>;
 readMemberModelForPreparation(input:{task_id:string;execution_id:string;grant_id:string}):Promise<MemberModelProposal>;
 readMemberModel(input:{task_id:string;execution_id:string}):Promise<MemberModelProposal>;
}
