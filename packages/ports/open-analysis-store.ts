import type {OpenAnalysisPreferences} from '../product-core/open-analysis-methods.ts';
import type {MemberSourceInspection} from './member-source.ts';
import type {OpenAnalysisVerification} from './open-analysis-verifier.ts';
export type OpenTaskIdentity=Readonly<{
 task_id:string;revision:string;run_id:string;attempt_id:string;operation_id:string;grant_id:string;
 scope_sha256:string;config_sha256:string;
}>;
export type OpenAnalysisOutcome=Readonly<{membership?:import('./open-membership.ts').OpenMembershipRecord;judgment_review?:import('./open-analysis-judgment-review.ts').OpenJudgmentReview;asset_adoption?:import('../product-core/metric-asset-adoption.ts').MetricAssetAdoption;version:'1.0';outcome_id:string;identity:OpenTaskIdentity;computations:readonly OpenQualifiedComputation[];explanation:{kind:'MODEL_EXPLANATION';text:string};human_judgment:'not_recorded';numeric_report?:import('./open-analysis-numeric-report.ts').OpenNumericReport}>;
export type OpenModelAnalysisReport=Readonly<{version:'1.1';outcome_id:string;identity:OpenTaskIdentity;kind:'MODEL_ANALYSIS_REPORT';text:string;verification:'not_performed';human_judgment:'not_recorded';contract:import('../product-core/open-analysis-context.ts').OpenModelReportContract}>;
export type OpenConversationOutcome=Readonly<{version:'1.0';outcome_id:string;identity:OpenTaskIdentity;kind:'MODEL_CONVERSATION';text:string;verification:'not_performed';human_judgment:'not_recorded'}>;
export type OpenTaskLease=Readonly<{task_id:string;epoch:number;identity:OpenTaskIdentity}>;
export type OpenAnalysisJudgmentCommand=Readonly<{version:'1.0'|'1.1';command_id:string;expected_revision:string;outcome_id:string;outcome_sha256:string;content_sha256?:string;review_sha256?:string;value:'acknowledged';comment:string}>;
export type OpenAnalysisJudgment=OpenAnalysisJudgmentCommand&Readonly<{saved:true;task_id:string}>;
export type OpenReportEditCommand=Readonly<{version:'1.0';command_id:string;expected_revision:string;outcome_id:string;outcome_sha256:string;expected_expression_version:number;text:string}>;
export type OpenReportEdit=OpenReportEditCommand&Readonly<{saved:true;task_id:string;origin:'USER';expression_version:number}>;
export type OpenAnalysisClarification=Readonly<{version:'1.0';question_id:string;text:string;identity:OpenTaskIdentity;semantics?:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment;business?:import('../product-core/open-analysis-context.ts').OpenBusinessProposal}>;
export type OpenContextMaterial=Readonly<{version:'1.0';material_id:string;result_id:string;result_version:number;result_sha256:string;source_task_id:string;source_revision:string;scope_sha256:string;classification:'MODEL';review:'user_adopted';value:import('../contracts/case-collaboration.ts').ChildResultValue}>;
export type OpenVersionChoice=Readonly<{version:'1.0';command_id:string;expected_revision:string;target_revision:string}>;
export type OpenExplorationRecord=Readonly<{version:'1.0'|'1.1';total_check?:import('../product-core/open-analysis-exploration.ts').OpenExplorationTotalCheck;exploration_id:string;identity:OpenTaskIdentity;value:import('../product-core/open-analysis-exploration.ts').OpenExplorationValue;receipt:Readonly<Record<string,unknown>>;classification:'MODEL_EXPLORATION';verification:'not_performed'}>;
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
 requirement_inputs?:readonly import('../product-core/open-requirement-framework.ts').RequirementInput[];
 requirement_draft?:import('../product-core/open-requirement-framework.ts').RequirementDraft;
 explorations?:readonly OpenExplorationRecord[];
 identity:OpenTaskIdentity;question:string;source:MemberSourceInspection;
 state:'ready'|'running'|'unknown'|'stopped'|'failed'|'saved'|'waiting';epoch:number;pending_stop_epoch:number|null;
 display_revision?:string;version_choices?:readonly OpenVersionChoice[];
 report_edits?:readonly OpenReportEdit[];
 judgments?:readonly OpenAnalysisJudgment[];
 clarification?:OpenAnalysisClarification|null;
 context_materials?:readonly OpenContextMaterial[];
 preferences?:OpenAnalysisPreferences;
 revision_command_id?:string;
 revision_commands?:readonly string[];
 history?:readonly Omit<OpenStoredTask,'history'>[];
 model_report?:OpenModelAnalysisReport;
 report_postprocessing?:import('./report-postprocessing.ts').ReportPostprocessing;
 conversation_outcome:OpenConversationOutcome|null;
 outcome:OpenAnalysisOutcome|null;


 computation_records:readonly import('./open-analysis-code.ts').OpenComputationArtifact[];
}>;
export type OpenSubmissionReceipt=Readonly<{version:'1.0';command_id:string;input_sha256:string;epoch:number;state:'reading'|'unknown'|'stopped'|'failed'|'accepted'}>;
export interface OpenAnalysisStore {
 /** Actual Task directory, not a virtual resource namespace. */
 directory(task_id:string):string;
 reportContent?(task_id:string):ReturnType<typeof import('../product-core/browser-report-content.ts').projectReportContent>;
 reportContentCommand?(task_id:string,input:unknown):import('../product-core/browser-report-content.ts').ReportContentEvent;
 reportContentReceipt?(task_id:string,command_id:string):import('../product-core/browser-report-content.ts').ReportContentEvent|null;
 addRequirementMaterials(task_id:string,input:{command_id:string;input_sha256:string;expected_identity:OpenTaskIdentity;source:MemberSourceInspection;originals?:readonly import('./member-source.ts').MemberSourceFile[]}):OpenStoredTask;
 startRequirement(task_id:string,input:unknown):OpenStoredTask;
 configureRequirement(task_id:string,expected_identity:OpenTaskIdentity,config_sha256:string):OpenStoredTask;
 saveRequirementDraft(task_id:string,input:unknown):OpenStoredTask;
 recordRequirementInputs(task_id:string,input:{command_id:string;request_sha256:string;expected_identity:OpenTaskIdentity;complete:boolean;statements:readonly string[]}):OpenStoredTask;
 selectVersion(task_id:string,input:unknown):OpenStoredTask;
 reserveSubmission(command_id:string,input_sha256:string):OpenSubmissionReceipt;
 submission(command_id:string):OpenSubmissionReceipt|null;
 stopSubmission(command_id:string):OpenSubmissionReceipt;
 finishSubmission(command_id:string,epoch:number,state:'stopped'|'failed'):OpenSubmissionReceipt;
 recoverSubmissions():void;
 acknowledge(task_id:string,input:unknown):OpenAnalysisJudgment;
 judgmentReceipt(task_id:string,command_id:string):OpenAnalysisJudgment|null;
 list():readonly OpenStoredTask[];
 create(input:{originals?:readonly import('./member-source.ts').MemberSourceFile[];review_policy?:'conclusion_strategy_v1';identity:OpenTaskIdentity;question:string;source:MemberSourceInspection;preferences?:OpenAnalysisPreferences;metric_asset_choice?:MetricAssetChoice;entry_mode?:'requirements'}):OpenStoredTask;
 read(task_id:string):OpenStoredTask|null;
 begin(task_id:string):OpenTaskLease;
 revise(task_id:string,input:{command_id:string;expected_revision:string;expected_epoch:number;question:string;identity:OpenTaskIdentity;preferences:OpenAnalysisPreferences;metric_asset_choice?:MetricAssetChoice;source?:MemberSourceInspection;originals?:readonly import('./member-source.ts').MemberSourceFile[]}):OpenStoredTask;
 resume(task_id:string):OpenStoredTask;
 stop(task_id:string):OpenStoredTask;
 /** Called only at the service recovery boundary; never executes or renews a grant. */
 recover(task_id:string):OpenStoredTask;
 finish(lease:OpenTaskLease,state:'stopped'|'failed'):OpenStoredTask;
 saveReportPostprocessing?:(lease:OpenTaskLease,value:import('./report-postprocessing.ts').ReportPostprocessing)=>OpenStoredTask;
 saveModelReport?:(lease:OpenTaskLease,value:OpenModelAnalysisReport)=>{saved:true;outcome_id:string}&OpenTaskIdentity;
}


export type OpenQualifiedComputation=Readonly<{calculation:import('./open-analysis-code.ts').OpenComputationArtifact;verification:OpenAnalysisVerification}>;
