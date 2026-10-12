import type {OpenAnalysisRun} from './open-analysis-runtime.ts';
import type {MemberSourceInspection} from './member-source.ts';
import type {OpenAnalysisIR,OpenAnalysisValue} from '../product-core/open-analysis-ir.ts';
import type {OpenAnalysisVerification} from './open-analysis-verifier.ts';
export type OpenMembershipExecution=(input:Readonly<{identity:OpenAnalysisRun['identity'];plan:OpenAnalysisIR;inspection:MemberSourceInspection;signal:AbortSignal;isAuthorized:()=>boolean;readSource:()=>Promise<MemberSourceInspection>}>)=>Promise<Readonly<{calculation:OpenAnalysisValue;verification:OpenAnalysisVerification}>>;
