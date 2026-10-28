import type {OpenComputationArtifact,OpenSourceCoverage} from './open-analysis-code.ts';
/** Actual source-only independent execution and its bounded claim coverage.
 * It does not certify company meaning, causality or arbitrary algorithm validity. */
export type OpenAnalysisVerification=Readonly<{
 version:'1.0';grade:'independent_arithmetic'|'source_attribution';inspection_sha256:string;result_sha256:string;
 asset_context:import('./metric-assets.ts').OpenMetricEvidenceContext|null;semantic_context:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment|null;unit_bindings:readonly import('./open-analysis-code.ts').OpenComputationUnitBinding[];unit_questions:readonly string[];independent:OpenComputationArtifact;coverage:readonly OpenSourceCoverage[];
 method:Readonly<{primary:string;independent:string;rationale:string;assessment:'NON_AUTHOR_METHOD_REVIEW';review:OpenComputationMethodReview}>;
 discrepancies:readonly Readonly<{path:string;primary:string;independent:string}>[];
 limits:readonly string[];
}>;

export type OpenComputationMethodReview=Readonly<{
 version:'1.0';subject_sha256:string;reads:readonly import('./analysis-agent.ts').AnalysisResourceRead[];reviewer:Readonly<{completion_id:string;computation_id:string;role:'method_review';provider:string;model:string}>;
 claims:readonly Readonly<{path:string;asset_conformance?:Readonly<{verdict:'supported'|'insufficient'|'conflict';reason:string}>;applicability:Readonly<{verdict:'supported'|'insufficient'|'conflict';reason:string}>;independence:Readonly<{verdict:'supported'|'insufficient'|'conflict';reason:string}>;coverage:Readonly<{verdict:'supported'|'insufficient'|'conflict';reason:string}>;primary_code_lines:readonly number[];independent_code_lines:readonly number[];limitations:readonly string[]}>[];
}>;
