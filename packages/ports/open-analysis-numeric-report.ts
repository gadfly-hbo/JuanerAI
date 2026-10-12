import type {OpenAnalysisRun} from './open-analysis-runtime.ts';

/** Business evidence carried by the existing immutable Outcome, not a second store. */
export type OpenNumericValue=Readonly<{
 id:string;label:string;value:string|null;display:string;unit:string;currency:string|null;
 grade:'independent_arithmetic'|'derived_formula'|'source_attribution'|'not_performed'|'assumption';
 status:'verified'|'not_applicable'|'unverified';scope:string;references:readonly string[];
 plan_sha256:string|null;result_sha256:string|null;source_sha256:string;proof_sha256:string;
 calculation_trace?:Readonly<{expression:string;limitation:string}>;expression?:unknown;limitations:readonly string[];
}>;
export type OpenNumericReport=Readonly<{
 version:'1.0';reference_contract?:'1.1'|'1.2'|'1.3'|'1.4'|'1.5';trace_format?:'1.1';scope_sequence?:'1.0';scope_contract?:'1.1'|'1.2'|'1.3'|'1.4'|'1.5'|'1.6'|'1.7'|'1.8'|'1.9'|'2.0';identity:OpenAnalysisRun['identity'];document:unknown;
 values:readonly OpenNumericValue[];issues:readonly Readonly<{code:string;reference:string|null}>[];
 status:'complete'|'partial';text:string;report_sha256:string;
}>;
