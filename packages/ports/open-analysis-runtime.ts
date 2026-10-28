export type AnalysisTool=Readonly<{
 name:string;description:string;effect:'read'|'write';parameters:Readonly<Record<string,unknown>>;
 execute:(arguments_:Readonly<Record<string,unknown>>,signal:AbortSignal,invocation?:Readonly<{id:string;refuse?:(code:string,reason:string)=>never;resource_reads?:readonly import('./analysis-agent.ts').AnalysisResourceRead[]}>)=>Promise<unknown>;


 /** A read-only explanation/locator view; the complete verified business result stays in its owning record. */
 modelResult?:(result:unknown,signal:AbortSignal)=>Promise<unknown>;
}>;
export type AnalysisDiagnosticCode='COMPLETE'|'WAITING'|'QUOTA_EXCEEDED'|'RATE_LIMITED'|'MODEL_UNAVAILABLE'|'NETWORK_UNCONFIRMED'|'CREDENTIAL_INVALID'|'CONTEXT_LIMIT'|'OUTPUT_INCOMPLETE'|'REQUEST_REJECTED'|'INVALID_RESULT'|'SAFETY_BLOCKED'|'AUTHORITY_REQUIRED'|'CONFIGURATION_CHANGED'|'CANCELLED'|'SAVE_UNCONFIRMED'|'EFFECT_UNCONFIRMED'|'TOOL_DELIVERY_FAILED'|'CAPABILITY_UNAVAILABLE'|'UNKNOWN';

export type AnalysisFileFailureCategory='not_found'|'not_directory'|'is_directory'|'permission_denied'|'invalid'|'not_supported'|'cancelled'|'timeout'|'limit_exceeded'|'unknown';

export type AnalysisRuntimeDiagnostics=Readonly<{
 version:'1.0';task_id:string;revision:string;recording:'observed'|'not_started'|'legacy'|'unavailable';unconfirmed_effects:boolean;
 configuration_sha256?:string;
 meter?:Readonly<{model_attempts:number;tool_calls:number;recorded_input_tokens:number;charged_output_tokens:number;unconfirmed_output_tokens:number;resource_units:number}>;
 last_run?:Readonly<{code:AnalysisDiagnosticCode;at:string;model:Readonly<{provider:string;name:string}>}>;
 observations:readonly (
  Readonly<{kind:'model';observation_id:string;at:string;model:Readonly<{provider:string;name:string}>;reported_model?:string;code:AnalysisDiagnosticCode;physical_state:'not_sent'|'response_received'|'unknown';http_status?:number;usage_final:boolean;input_tokens:import('../product-core/member-operation.ts').Meter;output_tokens:import('../product-core/member-operation.ts').Meter;request_id?:string;after_stop:boolean}>
  |Readonly<{kind:'tool';observation_id:string;at:string;name:string;completion:'not_started'|'started'|'partial'|'completed'|'unknown';code?:string;delivery:'pending'|'ready'|'rejected'|'failed';resource_units:number;receipt_id?:string;invocation_id?:string;file_failure_category?:AnalysisFileFailureCategory;after_stop?:boolean}>
 )[];
}>;
