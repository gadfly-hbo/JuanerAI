import type {OpenTaskIdentity} from './open-analysis-store.ts';

/** A real, source-bound unqualified output. Program-provided grade/proof fields have no authority. */
export type OpenComputationArtifact=Readonly<{version:'1.0';execution_id:string;identity:OpenTaskIdentity;code_sha256:string;source_sha256:string;input_sha256:string;work_id:string;context:import('../product-core/open-analysis-context.ts').OpenAnalysisContext;value:unknown;receipt:Readonly<Record<string,unknown>>;classification:'MODEL_COMPUTATION';verification:'not_performed';claims:readonly OpenComputationClaim[];method:string}>;

/** Describes what to check before execution, never an algorithm/operator plan or proof. */
export type OpenComputationClaim=Readonly<{path:string;label:string;question:string;unit:string;conditions:readonly string[];qualification?:'arithmetic'|'source_attribution';required_semantics?:readonly import('../product-core/open-analysis-semantics.ts').OpenSemanticDimension[]}>;
export type OpenSourceCoverage=Readonly<{claim_path:string;source_id:string;sheet_id:string;columns:readonly string[];rows:readonly number[]}>;

export type OpenComputationUnitBinding=Readonly<{claim_path:string;unit:string;basis:import('../product-core/open-analysis-semantics.ts').OpenSemanticAssessment}>;
