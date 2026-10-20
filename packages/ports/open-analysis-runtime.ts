import type {AnalysisRequestIdentity} from './analysis-request-ledger.ts';
/** Reused PR103 trusted new-task input; never a model preference or migration. */
export type AnalysisHarnessFirstLoop=Readonly<{
 version:'v0.2';
  work_recovery?:'v1';
 request_admission:Readonly<{policy_version:string;protocol_overhead_tokens:number;safety_margin_tokens:number;image_tokens?:number}>;
}>;
export type AnalysisBusinessWork=Readonly<{version:'1';id:string;deadline_at:number}>|Readonly<{version:'2';id:string;deadline_at:null}>;
export type AnalysisTool=Readonly<{
 name:string;description:string;parameters:Readonly<Record<string,unknown>>;
 /** Optional live producer choices; execution still validates shape and current business authority. */
 modelParameters?:Readonly<Record<string,unknown>>;
 execute:(arguments_:Readonly<Record<string,unknown>>,signal:AbortSignal)=>Promise<unknown>;


 /** A read-only explanation/locator view; the complete verified business result stays in its owning record. */
 modelResult?:(result:unknown,signal:AbortSignal)=>Promise<unknown>;
}>;
export type AnalysisHistoryMessage=
 | Readonly<{speaker:'user';text:string}>
 | Readonly<{speaker:'assistant';text:string;calls:readonly Readonly<{id:string;name:string;arguments:Readonly<Record<string,unknown>>}>[]}>
 | Readonly<{speaker:'tool';call_id:string;name:string;result:unknown;failed:boolean}>;
export type AnalysisTurnCheckpoint=Readonly<{version:'1.0';turn:number;messages:readonly AnalysisHistoryMessage[]}>;
export type OpenAnalysisRun=Readonly<{
 /** Trusted Application construction admission; model cannot supply or alter it. */
 /** Existing trusted preview/condition/retry command; distinguishes separately authorized business operations. */
 business_operation_id?:string;
 artifactFile?:Readonly<{path:'draft/report.json';read:(signal:AbortSignal)=>Promise<Uint8Array>;write:(bytes:Uint8Array,signal:AbortSignal)=>Promise<void>}>;
 artifactWork?:Readonly<{id:string;admit:(input:Readonly<{logicalId:string;recovery:boolean}>)=>boolean}>;
 /** Same Runtime, separately metered no-tool report editing operation. */
 /** New task purpose configuration, fixed by trusted composition; never migrates old tasks. */
 judgmentReview?:true;
 purpose?:'report_edit'|'proposal_prepare'|'retained_case'|'conclusion_strategy_review';
 /** Stable business conversation; separate history, shared Task accounting. */
 conversation_id?:string;
 /** Explicit v1.3 opt-in: one rejected pre-effect parameter correction per tool/run. */
 recoverInvalidArguments?:boolean;
 /** v1.3 progressive business schema discovery; no extra tool authority. */
 toolDiscovery?:boolean;
 /** New autonomous Tasks opt into native named business tools; existing sessions retain their protocol. */
 nativeBusinessTools?:boolean;
 sessionAdvance?:Readonly<{kind:'resume'|'compact'}>|Readonly<{kind:'navigate';entryId:string|null;summarize:boolean}>;
 preferences?:Readonly<{skill:'general'|'group-summary';prompt:'professional'|'brief'}>;
 identity:Omit<AnalysisRequestIdentity,'input_sha256'|'provider'|'model'>;
 prompt:string;system:string;tools:readonly AnalysisTool[];signal:AbortSignal;
 /** Fixed trusted capability ceiling; current tools is the actual stage. */
 capabilityTools?:readonly AnalysisTool[];
 /** Application checks the current grant and immutable selected-material scope. */
 authorize:()=>boolean;
 /** The Application has reached a business waiting boundary; finish this turn before another request. */
 shouldYield?:()=>boolean;
 /** Only a pending delegation queue may admit more individually authorized delegate_analysis calls in this reply. */
 canQueueDelegation?:()=>boolean;
 continuation?:AnalysisTurnCheckpoint;
 saveContinuation?:(checkpoint:AnalysisTurnCheckpoint)=>Promise<void>;


 /** Derived text for current selected sources and their verified calculations only; never an arbitrary filesystem reader. */
 readSelectedMaterial?:(location:string,signal:AbortSignal)=>Promise<string>;
}>;
export type AnalysisCollaborationTrace=Readonly<{
 created:readonly Readonly<{child_id:string;material_id:string;kind:'fork'|'subagent';history_position:number}>[];
 consumed:readonly Readonly<{child_id:string;result_id:string;history_position:number}>[];
}>;
export type AnalysisAdmissionFact=Readonly<{
 call_id:string;name:string;status:'ready'|'rejected'|'deferred';code?:string;
 corrections_used:number;terminal:boolean;stage_version:string;
}>;
export type AnalysisSessionFacts=Readonly<{availability:'busy'|'unavailable'|'corrupt';reason?:string}>|Readonly<{
 availability:'available';session_id:string;branch:string;tip_id:string|null;
 terminal?:Readonly<{operation_id:string;status:'completed'|'declined'|'aborted'|'failed'}>;
 queue:Readonly<{availability:'unknown'}>|Readonly<{availability:'known';entries:readonly Readonly<{entry_id:string;kind:string}>[]}>;
 admission:Readonly<{availability:'unknown'}>|Readonly<{availability:'known';terminal:boolean;corrections:readonly Readonly<{name:string;used:number}>[];facts:readonly AnalysisAdmissionFact[]}>;
}>;
export interface OpenAnalysisRuntime {
 /** Native bounded report-file IO; completion is a separate business tool. */
 artifactFiles?:'v1';
  /** Trusted business command scope; reading/reopening it never resumes execution. */
  openBusinessWork?:(input:Readonly<{identity:OpenAnalysisRun['identity'];business_operation_id?:string;signal:AbortSignal;authorize:()=>boolean}>)=>Promise<AnalysisBusinessWork>;
 readonly codeDraft?:'v1';
 readCodeDraft?:(input:Readonly<{task_id:string;path:string;signal:AbortSignal}>)=>Promise<Readonly<{code:string;code_sha256:string}>>;
 /** Optional read-only host reconciliation signal; not a new SDK runtime or authority. */
 hasUnconfirmedEffects?:(task_id:string)=>boolean;
 /** Read-only proof for explicit retry of a review that failed before model admission. */
 reviewAdmissionRetrySafe?:(identity:OpenAnalysisRun['identity'])=>boolean;
 /** Explicit recovery only: native terminal failure plus settled effects, never a model claim. */
 reconcileStopped?:(input:Readonly<{identity:OpenAnalysisRun['identity'];signal:AbortSignal;authorize:()=>boolean}>)=>Promise<boolean>;
 /** Inspect acknowledged collaboration tools and their next model input; no execution or recovery. */
 collaborationTrace?:(input:Readonly<{identity:OpenAnalysisRun['identity'];conversation_id?:string;signal:AbortSignal;authorize:()=>boolean}>)=>Promise<AnalysisCollaborationTrace>;

 /** Runtime owns protocol recovery; Application checkpoints remain historical business evidence. */
 sessionControl?:(input:Readonly<{identity:OpenAnalysisRun['identity'];purpose?:'analysis'|'proposal_prepare';artifactWork?:OpenAnalysisRun['artifactWork'];command:AnalysisSessionCommand;signal:AbortSignal;authorize:()=>boolean}>)=>Promise<Readonly<{entryId?:string;cancelled?:boolean;view?:AnalysisSessionView;sessionId?:string;facts?:AnalysisSessionFacts}>>;
 readonly historyOwnership?:'runtime';
 /** Collect owned physical requests only; never dispatch or grant authority. */
 collect?:(task_id:string)=>Promise<void>;
 run(input:OpenAnalysisRun):Promise<Readonly<{text:string;assembled_artifact?:Readonly<{version:'1.0';kind:'report'|'revision';ref:import('./open-analysis-draft.ts').DraftRef}>;provider?:string;model?:string;history?:readonly AnalysisHistoryMessage[];tools:readonly {name:string;result:unknown}[]}>>;


 /** A read model of acknowledged runtime observations; does not prove business Outcome persistence. */
 readDiagnostics?:(identity:OpenAnalysisRun['identity'])=>AnalysisRuntimeDiagnostics;

 /** Explicit new-Task capability; existing fixed Task configurations are not rebound. */
 readonly selectedMaterialRead?:'v1';

 /** Explicit new business Task preparation carrier; fixed product material/output policy identity. */
 readonly preparationSnapshots?:'v1';
}

export type AnalysisSessionCommand=Readonly<{kind:'fork'}>|Readonly<{kind:'navigate';entryId:string|null;summarize:boolean}>|Readonly<{kind:'snapshot'}>|Readonly<{kind:'steer'|'followUp'|'nextRun';text:string}>|Readonly<{kind:'cancelQueued';entryId:string}>|Readonly<{kind:'abort'}>;
export type AnalysisSessionView=Readonly<{branch:string;tipId:string|null;operationId:string|null;queued:readonly Readonly<{entryId:string;kind:string}>[];activeTools:readonly string[];faulted:boolean;queueAvailable?:boolean;history?:readonly Readonly<{entryId:string;role:'user'|'assistant'|'summary';preview:string}>[]}>;


export type AnalysisDiagnosticCode='COMPLETE'|'WAITING'|'QUOTA_EXCEEDED'|'RATE_LIMITED'|'MODEL_UNAVAILABLE'|'NETWORK_UNCONFIRMED'|'CREDENTIAL_INVALID'|'CONTEXT_LIMIT'|'OUTPUT_INCOMPLETE'|'REQUEST_REJECTED'|'INVALID_RESULT'|'SAFETY_BLOCKED'|'AUTHORITY_REQUIRED'|'CONFIGURATION_CHANGED'|'CANCELLED'|'SAVE_UNCONFIRMED'|'EFFECT_UNCONFIRMED'|'TOOL_DELIVERY_FAILED'|'CAPABILITY_UNAVAILABLE'|'UNKNOWN';

export type AnalysisFileFailureCategory='not_found'|'not_directory'|'is_directory'|'permission_denied'|'invalid'|'not_supported'|'cancelled'|'timeout'|'limit_exceeded'|'unknown';

export type AnalysisRuntimeDiagnostics=Readonly<{
 version:'1.0';task_id:string;revision:string;recording:'observed'|'legacy'|'unavailable';unconfirmed_effects:boolean;
 configuration_sha256?:string;
 meter?:Readonly<{model_attempts:number;tool_calls:number;recorded_input_tokens:number;charged_output_tokens:number;unconfirmed_output_tokens:number;resource_units:number}>;
 last_run?:Readonly<{code:AnalysisDiagnosticCode;at:string;model:Readonly<{provider:string;name:string}>}>;
 observations:readonly (
  Readonly<{kind:'model';observation_id:string;at:string;model:Readonly<{provider:string;name:string}>;reported_model?:string;code:AnalysisDiagnosticCode;physical_state:'not_sent'|'response_received'|'unknown';http_status?:number;usage_final:boolean;input_tokens:import('../product-core/member-operation.ts').Meter;output_tokens:import('../product-core/member-operation.ts').Meter;request_id?:string;after_stop:boolean}>
  |Readonly<{kind:'tool';observation_id:string;at:string;name:string;completion:'completed'|'unknown';delivery:'pending'|'ready'|'rejected'|'failed';resource_units:number;receipt_id?:string;invocation_id?:string;file_failure_category?:AnalysisFileFailureCategory;after_stop?:boolean}>
  |(AnalysisAdmissionFact&Readonly<{kind:'admission';observation_id:string;at:string}>)
 )[];
}>;