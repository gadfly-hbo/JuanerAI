import type {OpenAnalysisRun} from './open-analysis-runtime.ts';
import type {AutomaticDelegationInstruction} from '../contracts/case-collaboration.ts';

/** Business delegation boundary. Dispatch occurs only after the native run yields. */
export interface OpenAnalysisCollaboration {
 materials(identity:OpenAnalysisRun['identity']):Promise<readonly Readonly<{material_id:string;label:string;verification:string;instruction_contract?:Readonly<{actions:readonly string[];reference_paths:readonly string[];views?:readonly Readonly<{reference_paths:readonly string[];source_sha256:string;projection_sha256:string;value_kind:string;fields:readonly string[]}>[]}>}>[]>;
 queue(identity:OpenAnalysisRun['identity'],request:Readonly<{task:string;business_question?:string;material_id:string;kind:'fork'|'subagent';instruction?:Omit<AutomaticDelegationInstruction,'version'|'private_purpose'>;additional_materials?:readonly Readonly<{material_id:string;instruction:Omit<AutomaticDelegationInstruction,'version'|'private_purpose'>}>[]}>):Promise<Readonly<{child_id:string;state:'queued'|'returned'}>>;
 drain(identity:OpenAnalysisRun['identity'],signal:AbortSignal):Promise<void>;
 results(identity:OpenAnalysisRun['identity']):Promise<readonly unknown[]>;
}
