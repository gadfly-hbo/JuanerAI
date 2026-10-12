import type {OperationUsage} from '../product-core/member-operation.ts';
export const analysisRequestReasons=['REQUEST_RESERVED','REQUEST_ISSUED','REQUEST_SUCCEEDED','REQUEST_FAILED','REQUEST_CANCELLED','REQUEST_UNCONFIRMED','NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED','CREDENTIAL_INVALID','AUTHORITY_REQUIRED','OUTBOUND_FORBIDDEN','CONNECTION_FAILED','STOPPED','CANCELLED','ANALYSIS_INCOMPLETE','PROVIDER_USAGE_INVALID'] as const;
export type AnalysisRequestReason=typeof analysisRequestReasons[number];
export type AnalysisRequestIdentity=Readonly<{
 task_id:string;revision:string;run_id:string;attempt_id:string;operation_id:string;grant_id:string;
 scope_sha256:string;config_sha256:string;input_sha256:string;
 provider:'minimax-cn'|'xiaomi-token-plan-cn';model:'MiniMax-M3'|'mimo-v2.6-flash'|'mimo-v2.6-pro';
}>;
export type AnalysisRequest=AnalysisRequestIdentity&Readonly<{
 version:'1.0'|'1.1';reason?:AnalysisRequestReason;request_id:string;sequence:number;epoch:number;calls:number;
 status:'reserved'|'issued'|'succeeded'|'temporary_failure'|'failed'|'cancelled'|'unknown';
 started_at:string|null;ended_at:string|null;usage:OperationUsage;publishable:boolean;
}>;
export interface AnalysisRequestLedger {
 /** Read-only project-wide physical occupants, including durable UNKNOWN. */
 pending?():readonly AnalysisRequest[];
 reserve(input:AnalysisRequestIdentity):AnalysisRequest;
 issue(request_id:string):AnalysisRequest;
 settle(request_id:string,result:{status:'succeeded'|'temporary_failure'|'failed'|'cancelled'|'unknown';reason?:AnalysisRequestReason;usage:OperationUsage}):AnalysisRequest;
 read(task_id:string):readonly AnalysisRequest[];
 stop(task_id:string):void;
 resume(task_id:string):void;
}
