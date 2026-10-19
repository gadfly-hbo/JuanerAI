import type {OpenAnalysisPreferences} from '../product-core/open-analysis-methods.ts';
import type {OpenAnalysisRun,AnalysisTurnCheckpoint} from './open-analysis-runtime.ts';
import type {MemberSourceInspection} from './member-source.ts';
import type {OpenAnalysisIR,OpenAnalysisValue} from '../product-core/open-analysis-ir.ts';
import type {OpenAnalysisVerification} from './open-analysis-verifier.ts';
export type OpenTaskIdentity=OpenAnalysisRun['identity'];
export type OpenFrameworkCheckpoint=Readonly<{version:'1.0';execution_mode?:'agent_led';identity:OpenTaskIdentity;origin:'MODEL_PROPOSAL';plan:OpenAnalysisIR;context?:import('../product-core/open-analysis-context.ts').OpenAnalysisContext;steps?:import('../product-core/open-analysis-steps.ts').OpenAnalysisSteps}>;
export type OpenVerifiedStep=Readonly<{version:'1.0';step_id:string;identity:OpenTaskIdentity;framework:OpenFrameworkCheckpoint;calculation:OpenAnalysisValue;verification:OpenAnalysisVerification}>;
export type OpenAnalysisOutcome=Readonly<{judgment_review?:import('./open-analysis-judgment-review.ts').OpenJudgmentReview;asset_adoption?:import('../product-core/metric-asset-adoption.ts').MetricAssetAdoption;version:'1.0';outcome_id:string;identity:OpenTaskIdentity;framework:OpenAnalysisIR;calculation:OpenAnalysisValue;verification:OpenAnalysisVerification;explanation:{kind:'MODEL_EXPLANATION';text:string};human_judgment:'not_recorded';numeric_report?:import('./open-analysis-numeric-report.ts').OpenNumericReport}>;
export type OpenConversationOutcome=Readonly<{version:'1.0';outcome_id:string;identity:OpenTaskIdentity;kind:'MODEL_CONVERSATION';text:string;verification:'not_performed';human_judgment:'not_recorded'}>;
export type OpenTaskLease=Readonly<{task_id:string;epoch:number;identity:OpenTaskIdentity}>;
export type OpenAnalysisCheckpoint=AnalysisTurnCheckpoint & Readonly<{calculation:OpenAnalysisValue|null;verification:OpenAnalysisVerification|null}>;
export type OpenAnalysisJudgmentCommand=Readonly<{version:'1.0';command_id:string;expected_revision:string;outcome_id:string;outcome_sha256:string;value:'acknowledged';comment:string}>;
export type OpenAnalysisJudgment=OpenAnalysisJudgmentCommand&Readonly<{saved:true;task_id:string}>;
export type OpenReportEditCommand=Readonly<{version:'1.0';command_id:string;expected_revision:string;outcome_id:string;outcome_sha256:string;expected_expression_version:number;text:string}>;
export type OpenReportEdit=OpenReportEditCommand&Readonly<{saved:true;task_id:string;origin:'USER';expression_version:number}>;
export type OpenAnalysisClarification=Readonly<{version:'1.0';question_id:string;text:string;identity:OpenTaskIdentity;semantics?:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment;business?:import('../product-core/open-analysis-context.ts').OpenBusinessProposal}>;
export type OpenContextMaterial=Readonly<{version:'1.0';material_id:string;result_id:string;result_version:number;result_sha256:string;source_task_id:string;source_revision:string;scope_sha256:string;classification:'MODEL';review:'user_adopted';value:import('../contracts/case-collaboration.ts').ChildResultValue}>;
export type OpenVersionChoice=Readonly<{version:'1.0';command_id:string;expected_revision:string;target_revision:string}>;
export type OpenRevisionPreview=Readonly<{
 version:'1.0';command_id:string;objection?:import('../product-core/open-analysis-objection.ts').OpenFindingObjection;semantics?:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment;context_materials?:readonly OpenContextMaterial[];parent_preview_command_id?:string;baseline_identity:OpenTaskIdentity;baseline_sha256:string;identity:OpenTaskIdentity;question:string;preferences:OpenAnalysisPreferences;
 report?:Readonly<{outcome_id:string;outcome_sha256:string;numeric_report:import('./open-analysis-numeric-report.ts').OpenNumericReport}>;
 state:'preparing'|'ready'|'answered'|'waiting'|'failed'|'stopped'|'unknown';framework:OpenFrameworkCheckpoint|null;text:string|null;failure_code:string|null;
}>;
export type OpenStepEvent=Readonly<{version:'1.0';identity:OpenTaskIdentity;epoch:number;seq:number;step_id:string;phase:'blocked'|'unsupported'|'running'|'checking'|'verified'|'failed'|'stopped'|'unknown';code:string|null;receipt_step_id:string|null}>;
export type OpenExplorationRecord=Readonly<{version:'1.0'|'1.1';total_check?:import('../product-core/open-analysis-exploration.ts').OpenExplorationTotalCheck;exploration_id:string;identity:OpenTaskIdentity;framework:OpenFrameworkCheckpoint;plan:import('../product-core/open-analysis-exploration.ts').OpenExplorationIR;value:import('../product-core/open-analysis-exploration.ts').OpenExplorationValue;receipt:Readonly<Record<string,unknown>>;classification:'MODEL_EXPLORATION';verification:'not_performed'}>;
export type MetricAssetChoice=Readonly<{id:string;version:string}>;
export type OpenStoredTask=Readonly<{
 review_policy?:'conclusion_strategy_v1';
 review_checkpoint?:import('./open-analysis-judgment-review.ts').OpenJudgmentReview;
 review_updates?:readonly import('./open-analysis-judgment-review.ts').JudgmentReviewUpdate[];
 report_content_events?:readonly import('../product-core/browser-report-content.ts').ReportContentEvent[];
 metric_asset_choice?:MetricAssetChoice;
 requirement_reviews?:readonly import('../product-core/open-requirement-framework.ts').RequirementReview[];
 requirement_execution?:import('../product-core/open-requirement-framework.ts').RequirementExecution;
 requirement_materials?:readonly Readonly<{command_id:string;input_sha256:string;analysis_revision:string;scope_sha256:string}>[];
 entry_mode?:'requirements';
 requirement_draft?:import('../product-core/open-requirement-framework.ts').RequirementDraft;
 explorations?:readonly OpenExplorationRecord[];
 execution_evolution?:Readonly<{basis:OpenFrameworkCheckpoint;frames:readonly OpenFrameworkCheckpoint[]}>;
 step_events?:readonly OpenStepEvent[];
 reused_plan?:import('../product-core/open-analysis-plan-reuse.ts').OpenPlanReuse;
 delegation_selections?:readonly Readonly<{version:'1.1';selection_id:string;identity:OpenTaskIdentity;material_ids:readonly string[]}>[];
 verified_steps?:readonly (OpenVerifiedStep&Readonly<{saved:true}>)[];
 version:'1.0'|'1.1'|'1.2'|'1.3'|'1.4';identity:OpenTaskIdentity;question:string;source:MemberSourceInspection;
 state:'ready'|'running'|'unknown'|'stopped'|'failed'|'saved'|'waiting';epoch:number;pending_stop_epoch:number|null;
 confirmed_plan?:Readonly<{version:'1.0';command_id:string;preview_command_id:string;revision:string;plan_sha256:string;context_sha256:string|null;steps_sha256?:string}>|null;
 revision_previews?:readonly OpenRevisionPreview[];
 display_revision?:string;version_choices?:readonly OpenVersionChoice[];
 report_edits?:readonly OpenReportEdit[];
 judgments?:readonly OpenAnalysisJudgment[];
 clarification?:OpenAnalysisClarification|null;
 context_materials?:readonly OpenContextMaterial[];
 preferences?:OpenAnalysisPreferences;
 revision_command_id?:string;
 revision_commands?:readonly string[];
 history?:readonly Omit<OpenStoredTask,'history'>[];
 checkpoint?:OpenAnalysisCheckpoint|null;
 conversation_outcome?:OpenConversationOutcome|null;
 framework:OpenFrameworkCheckpoint|null;outcome:OpenAnalysisOutcome|null;


 preparation_snapshots?:readonly OpenPreparationSnapshot[];
}>;
export type OpenSubmissionReceipt=Readonly<{version:'1.0';command_id:string;input_sha256:string;epoch:number;state:'reading'|'unknown'|'stopped'|'failed'|'accepted'}>;
export interface OpenAnalysisStore {
 beginReviewUpdate?:(id:string,input:unknown)=>{lease:OpenTaskLease;update:import('./open-analysis-judgment-review.ts').JudgmentReviewUpdate};
 saveReviewUpdate?:(lease:OpenTaskLease,command_id:string,review:import('./open-analysis-judgment-review.ts').OpenJudgmentReview)=>OpenStoredTask;
 reconcileReviewUpdate?:(id:string,identity:OpenTaskIdentity)=>OpenStoredTask;
 saveJudgmentReview?:(lease:OpenTaskLease,value:import('./open-analysis-judgment-review.ts').OpenJudgmentReview)=>{saved:true}&OpenTaskIdentity;
 reportContent?(task_id:string):ReturnType<typeof import('../product-core/browser-report-content.ts').projectReportContent>;
 reportContentCommand?(task_id:string,input:unknown):import('../product-core/browser-report-content.ts').ReportContentEvent;
 reportContentReceipt?(task_id:string,command_id:string):import('../product-core/browser-report-content.ts').ReportContentEvent|null;
 addRequirementMaterials(task_id:string,input:{command_id:string;input_sha256:string;expected_identity:OpenTaskIdentity;source:MemberSourceInspection}):OpenStoredTask;
 reviewRequirement(task_id:string,input:unknown):OpenStoredTask;
 startRequirement(task_id:string,input:unknown):OpenStoredTask;
 configureRequirement(task_id:string,expected_identity:OpenTaskIdentity,config_sha256:string):OpenStoredTask;
 saveRequirementDraft(task_id:string,input:unknown):OpenStoredTask;
 saveExploration(lease:OpenTaskLease,value:OpenExplorationRecord):{saved:true}&OpenTaskIdentity;
 saveStepEvent(lease:OpenTaskLease,value:Omit<OpenStepEvent,'epoch'|'seq'>):{saved:true}&OpenTaskIdentity;
 registerDelegationSelection?(identity:OpenTaskIdentity,material_ids:readonly string[]):string;
 saveVerifiedStep(lease:OpenTaskLease,value:OpenVerifiedStep):{saved:true;step_id:string}&OpenTaskIdentity;
 reservePreview(task_id:string,input:unknown):OpenStoredTask;
 completePreview(task_id:string,command_id:string,input:unknown):OpenStoredTask;
 selectVersion(task_id:string,input:unknown):OpenStoredTask;
 reserveSubmission(command_id:string,input_sha256:string):OpenSubmissionReceipt;
 submission(command_id:string):OpenSubmissionReceipt|null;
 stopSubmission(command_id:string):OpenSubmissionReceipt;
 finishSubmission(command_id:string,epoch:number,state:'stopped'|'failed'):OpenSubmissionReceipt;
 recoverSubmissions():void;
 editReport(task_id:string,input:unknown):OpenReportEdit;
 reportEditReceipt(task_id:string,command_id:string):OpenReportEdit|null;
 acknowledge(task_id:string,input:unknown):OpenAnalysisJudgment;
 judgmentReceipt(task_id:string,command_id:string):OpenAnalysisJudgment|null;
 list():readonly OpenStoredTask[];
 create(input:{preparation?:'v1';review_policy?:'conclusion_strategy_v1';identity:OpenTaskIdentity;question:string;source:MemberSourceInspection;preferences?:OpenAnalysisPreferences;metric_asset_choice?:MetricAssetChoice;entry_mode?:'requirements';reused_plan?:import('../product-core/open-analysis-plan-reuse.ts').OpenPlanReuse}):OpenStoredTask;
 read(task_id:string):OpenStoredTask|null;
 begin(task_id:string):OpenTaskLease;
 revise(task_id:string,input:{command_id:string;expected_revision:string;question:string;identity:OpenTaskIdentity;preferences:OpenAnalysisPreferences;metric_asset_choice?:MetricAssetChoice;source?:MemberSourceInspection;context_materials?:readonly OpenContextMaterial[];adopt_preview_command_id?:string}):OpenStoredTask;
 /** Explicit settled-recovery reconciliation only; caller fences physical requests and current authority. */
 reconcileCheckpoint(task_id:string,identity:OpenTaskIdentity):OpenStoredTask;
 /** Called only after authoritative terminal Runtime/effect reconciliation. */
 reconcileFailure?(task_id:string,identity:OpenTaskIdentity):OpenStoredTask;
 resume(task_id:string):OpenStoredTask;
 saveCheckpoint(lease:OpenTaskLease,value:OpenAnalysisCheckpoint):{saved:true}&OpenTaskIdentity;
 stop(task_id:string):OpenStoredTask;
 /** Called only at the service recovery boundary; never executes or renews a grant. */
 recover(task_id:string):OpenStoredTask;
 finish(lease:OpenTaskLease,state:'stopped'|'failed'):OpenStoredTask;
 saveClarification(lease:OpenTaskLease,value:OpenAnalysisClarification):{saved:true}&OpenTaskIdentity;
 saveFramework(lease:OpenTaskLease,value:OpenFrameworkCheckpoint):{saved:true}&OpenTaskIdentity;
 saveConversationOutcome(lease:OpenTaskLease,value:OpenConversationOutcome):{saved:true;outcome_id:string}&OpenTaskIdentity;
 saveOutcome(lease:OpenTaskLease,value:OpenAnalysisOutcome):{saved:true;outcome_id:string}&OpenTaskIdentity;


 savePreparation?:(owner:OpenPreparationOwner,input:OpenPreparationContent&Readonly<{producer:OpenPreparationProducer}>)=>OpenPreparationReceipt;
}


export type OpenPreparationProducer='assess_meaning'|'describe_meaning'|'interpret_meaning'|'bind_measurement'|'describe_business'|'set_framework'|'set_multisource_framework'|'set_joined_framework'|'set_membership_framework'|'set_document_framework'|'set_metric_asset_framework'|'set_analysis_steps'|'read_analysis_evidence';

export type OpenPreparationContent=Readonly<{semantics:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment|null;business:import('../product-core/open-analysis-context.ts').OpenBusinessProposal|null;framework:OpenFrameworkCheckpoint|null;candidate_plans:readonly OpenAnalysisIR[]}>;

export type OpenPreparationSnapshot=OpenPreparationContent&Readonly<{version:'1.0';snapshot_id:string;identity:OpenTaskIdentity;epoch:number;preview_command_id:string|null;previous_snapshot_id:string|null;producer:OpenPreparationProducer;created_at:string;content_sha256:string}>;

export type OpenPreparationOwner=OpenTaskLease&Readonly<{preview_command_id:string|null}>;

export type OpenPreparationReceipt=OpenTaskIdentity&Readonly<{saved:true;snapshot_id:string;content_sha256:string}>;