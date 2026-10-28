import type {AnalysisTool,AnalysisRuntimeDiagnostics} from './open-analysis-runtime.ts';
import type {OpenTaskIdentity} from './open-analysis-store.ts';

export type AnalysisPurpose='analysis'|'requirement_design'|'report_edit'|'report_revision'|'conclusion_strategy_review'|'retained_case'|'desktop_draft'|'membership';
/** Product intent and professional capabilities; no SDK messages, Session or queue structure. */
export type AnalysisAgentTurn=Readonly<{
 /** Trusted business ancestry; omission means the current analysis Task root. */
 work_id?:string;
 /** A fresh conversational context within this same business Task/work. */
 isolated?:true;
 /** Pi chooses these business delegations; the Adapter only assembles them. */
 delegations?:readonly AnalysisDelegation[];
 /** Actual computation being checked from original sources in an independent native context. No primary answer/program is supplied. */
 computation_context?:Readonly<{computation_id:string;role:'independent_source'|'method_review'}>;
 /** Host-materialized authorized originals only, in an isolated verification workspace. */
 verification_inputs?:readonly Readonly<{path:string;content:string;sha256:string}>[];
 identity:OpenTaskIdentity;command_id:string;purpose:AnalysisPurpose;prompt:string;system:string;
 /** Current persisted presentation preference; a resource selection, not a model/permission route. */
 presentation?:'brief'|'professional';
 /** Select an existing conversation position without summarization or model generation. */
 position?:Readonly<{id:string}>;
 /** Record actual native-consumed human words, independently of assistant delivery. Metadata only, never model parameters or queue authority. */
 recordUserInputs?:(inputs:readonly string[])=>Promise<void>;
 capabilities:()=>Promise<readonly AnalysisTool[]>;
 /** Approved physical files in this Task/independent workspace, prepared before the first request. */
 materials?:readonly Readonly<{path:string;content:string}>[];
 authorizeResources?:(signal:AbortSignal,path?:string)=>Promise<void>;
 authorize:()=>boolean;signal:AbortSignal;
}>;
/** Opaque completion locator, not a host terminal state or a recovery grant. */
export type AnalysisExecutionFact=Readonly<{invocation_id:string;command:string;output:string;exit_code:number;inputs:readonly Readonly<{path:string;sha256:string}>[];artifacts:readonly Readonly<{path:string;sha256:string;content:string|null}>[];/** Changed/new files sealed after the settled execution, distinct from the program snapshot above. */outputs?:readonly Readonly<{path:string;sha256:string;content:string|null}>[]}>;
export type AnalysisCompletion=Readonly<{id:string;command_id:string;work_id:string;purpose:AnalysisPurpose;context_id?:string;recorded_values?:readonly Readonly<{invocation_id:string;tool_name:string;value:unknown}>[];resource_reads?:readonly AnalysisResourceRead[];executions?:readonly AnalysisExecutionFact[];computation_context?:Readonly<{computation_id:string;role:'independent_source'|'method_review'}>}>;
export type AnalysisResponse=Readonly<{text:string;provider:string;model:string;completion:AnalysisCompletion}>;
export type AnalysisDelegation=Readonly<{
 name:string;description:string;parameters:Readonly<Record<string,unknown>>;
 /** No execution here. Supply trusted resources/question; never author history. */
 prepare:(args:Readonly<Record<string,unknown>>,signal:AbortSignal,invocation:Readonly<{id:string;refuse:(code:string,reason:string)=>never}>)=>Promise<Readonly<{turn:AnalysisAgentTurn;complete:(response:AnalysisResponse)=>Promise<unknown>}>>;
}>;
/** Business conversation positions are opaque. Availability is never an empty queue proof. */
export type AnalysisConversationCommand=Readonly<{kind:'observe';command_id?:string}|{kind:'branch'}|{kind:'supplement'|'follow_up'|'defer';text:string}|{kind:'withdraw';id:string}>;
export type AnalysisConversationView=Readonly<{availability:'available'|'busy'|'unavailable'|'corrupt';request?:Readonly<{command_id:string;state:'running'|'completed'|'failed'|'unconfirmed'|'unavailable';settled:boolean;code?:string}>;accepted_input?:Readonly<{id:string}>;withdrawn_input?:Readonly<{id:string;accepted:boolean}>;busy?:boolean;completed?:boolean;position?:string|null;messages?:readonly Readonly<{id:string;role:string;text:string}>[];pending?:readonly Readonly<{id:string;kind:string}>[]}>;
export interface AnalysisAgent{
 configuration():Promise<string>;
 recipient(purpose:AnalysisPurpose):Readonly<{provider:string;model:string}>;
 advance(turn:AnalysisAgentTurn):Promise<Readonly<{text:string;provider:string;model:string;completion:AnalysisCompletion}>>;
 assertCompleted(identity:OpenTaskIdentity,completion:AnalysisCompletion):Promise<void>;
 assertInvocation(input:Readonly<{identity:OpenTaskIdentity;command_id:string;work_id:string;purpose:AnalysisPurpose;resource_reads?:readonly AnalysisResourceRead[];computation_context?:Readonly<{computation_id:string;role:'independent_source'|'method_review'}>;name:string;id:string}>):Promise<void>;
 diagnostics(identity:OpenTaskIdentity,purpose?:AnalysisPurpose):Promise<AnalysisRuntimeDiagnostics>;
 conversation(input:Readonly<{identity:OpenTaskIdentity;purpose:AnalysisPurpose;work_id?:string;command:AnalysisConversationCommand;authorize:()=>boolean;signal:AbortSignal}>):Promise<AnalysisConversationView>;
 waitForIdle(scope?:Readonly<{task_id:string;revision:string;purpose:AnalysisPurpose}>):Promise<void>;
}

/** Delivered native resource ranges, bound to completed SDK public tool receipts.
 * Standard business locators/hashes only; no Session format or queue authority. */
export type AnalysisResourceRead=Readonly<{path:string;sha256:string;first_line:number;last_line:number;invocation_id:string}>;
