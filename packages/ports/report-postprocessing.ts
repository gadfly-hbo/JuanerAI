import type {OpenTaskIdentity} from './open-analysis-store.ts';
import type {AnalysisCompletion} from './analysis-agent.ts';

export type ReportPostState='checking'|'reviewing'|'revising'|'rechecking'|'completed'|'failed'|'stopped'|'unknown';
/** Business evidence attached to an already saved report, never a Session or recovery balance. */
export type ReportNumberClaim=Readonly<{id:string;start:number;end:number;kind:'source'|'derived'|'assumption'|'context';definition:string;unit:string;scope:string;source_paths:readonly string[];prerequisites:readonly string[];format_quote:string|null}>;
export type ReportNumberInventory=Readonly<{report_sha256:string;claims:readonly ReportNumberClaim[];limitations:readonly string[];uncovered:readonly Readonly<{start:number;end:number;text:string}>[]}>;
export type ReportNumberResult=Readonly<{claim_id:string;status:'independent_consistent'|'difference'|'unverified';reported:string;recomputed:string|null;unrounded:string|null;unit:string;delta:string|null;reason:string}>;
export type ReportNumberProof=Readonly<{subject:string;completion:AnalysisCompletion;bindings:readonly Readonly<{claim_id:string;result_ref:string;computed_unit?:string}>[];method_completion:AnalysisCompletion;method_review:Readonly<{subject_sha256:string;claims:readonly Readonly<{id:string;applicability:'supported'|'insufficient'|'conflict';independence:'supported'|'insufficient'|'conflict';coverage:'supported'|'insufficient'|'conflict';reason:string}>[];limitations:readonly string[]}>}>;
export type ReportReviewEvidence=Readonly<{kind:'number';id:string}|{kind:'condition';quote:string}|{kind:'source';path:string;row:number;column:string}>;
export type ReportReviewClaim=Readonly<{id:string;kind:'conclusion'|'strategy';start:number;end:number;verdict:'supported'|'conditional'|'insufficient'|'conflict';reason:string;evidence:readonly ReportReviewEvidence[];conditions:readonly Readonly<{text:string;proposed_status:'met'|'unmet'|'unknown';status:'met'|'unmet'|'unknown';evidence:readonly ReportReviewEvidence[]}>[];limitations:readonly string[];eligible:boolean}>;
export type ReportTextReview=Readonly<{report_sha256:string;numeric_sha256:string;phase:'initial'|'recheck';reviewed_paragraphs:readonly Readonly<{id:string;sha256:string}>[];claims:readonly ReportReviewClaim[];uncovered:readonly string[];limitations:readonly string[];completion:AnalysisCompletion}>;
export type ReportPostEdition=Readonly<{version:number;text:string;sha256:string;inventory:ReportNumberInventory|null;numbers:readonly ReportNumberResult[];numeric_proof:ReportNumberProof|null;reused_number_ids:readonly string[];review:ReportTextReview|null}>;
export type ReportPostprocessing=Readonly<{
 version:'1.0';identity:OpenTaskIdentity;outcome_id:string;basis_sha256:string;
 notes:readonly Readonly<{role:'coordinator'|'source'|'method'|'review'|'revision';text:string;completion:AnalysisCompletion}>[];
 state:ReportPostState;revision_attempted:boolean;editions:readonly ReportPostEdition[];failure_code:string|null;
}>;
