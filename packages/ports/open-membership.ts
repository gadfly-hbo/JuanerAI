import type {OpenTaskIdentity} from './open-analysis-store.ts';
import type {MemberSourceInspection} from './member-source.ts';
import type {OpenMembershipFramework} from '../product-core/open-membership.ts';
import type {MembershipResult} from '../product-core/member-analysis.ts';
export type OpenMembershipEnvelope=Readonly<{schema_version:'4.0';run_id:string;implementation:'duckdb_primary'|'python_independent';method:Readonly<{id:string;version:string;code_identity:string}>;method_contract_sha256:string;materialization:Readonly<{primary_sql_sha256:string;python_verifier_sha256:string}>;result:MembershipResult}>;
export type OpenMembershipProof=Readonly<{version:'1.0';grade:'independent_arithmetic';inspection_sha256:string;result_sha256:string;method:'native_member_source_recheck';limits:readonly string[];native_evidence:Readonly<{physical_run_id:string;task_run_id:string;attempt_id:string;code_identity:string;materialization_sha256:string;primary_sha256:string;independent_sha256:string;group_labels:Readonly<Record<string,string>>;primary:OpenMembershipEnvelope;independent:OpenMembershipEnvelope}>}>;
/** Current genuine domain evidence, not a wrapper around the retired OpenIR/scalar result. */
export type OpenMembershipRecord=Readonly<{version:'1.0';identity:OpenTaskIdentity;framework:OpenMembershipFramework;metrics:MembershipResult;verification:OpenMembershipProof}>;
export type OpenMembershipExecution=(input:Readonly<{identity:OpenTaskIdentity;framework:OpenMembershipFramework;inspection:MemberSourceInspection;signal:AbortSignal;isAuthorized:()=>boolean;readSource:()=>Promise<MemberSourceInspection>}>)=>Promise<OpenMembershipRecord>;
