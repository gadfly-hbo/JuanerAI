import {hashFiniteJson} from './member-task.ts';
import {compileOpenAnalysisContext,type OpenBusinessProposal} from './open-analysis-context.ts';
import type {OpenSemanticAssessment} from './open-analysis-semantics.ts';
import {openAnalysisFindings} from '../contracts/open-analysis-findings.mjs';
import type {OpenStoredTask,OpenTaskIdentity} from '../ports/open-analysis-store.ts';
/** Actual business proposal differences, never permission or result reuse authority. */
export function openAnalysisRevisionImpact(task:OpenStoredTask,candidate:{baseline_identity:OpenTaskIdentity;question:string;business?:OpenBusinessProposal|null;semantics?:OpenSemanticAssessment|null}){
 if(hashFiniteJson(candidate.baseline_identity)!==hashFiniteJson(task.identity))throw Object.assign(new Error('REVISION_CONFLICT'),{code:'REVISION_CONFLICT'});
 const before=compileOpenAnalysisContext(task.question,task.source),available=candidate.business!==undefined;
 const after=available?compileOpenAnalysisContext(candidate.question,task.source,candidate.business??undefined,candidate.semantics??undefined):null;
 const fields:[string,unknown,unknown][]=[['问题',task.question,candidate.question],...(after?[['实际来源与工作表',before.source_facts,after.source_facts],['业务理解',before.business??null,after.business??null],['业务口径',before.semantics??null,after.semantics??null]] as [string,unknown,unknown][]:[])];
 const changes=fields.filter(([,a,b])=>hashFiniteJson(a??null)!==hashFiniteJson(b??null)).map(([label,a,b])=>({label,before:a??null,after:b??null})),changed=changes.length>0||!available;
 return {version:'1.0' as const,baseline_revision:task.identity.revision,baseline_scope_sha256:task.identity.scope_sha256,status:available?'needs_adoption' as const:'impact_unavailable' as const,changes,recalculation:changed?'all_dependent_results' as const:'not_requested' as const,affected:{finding_ids:changed?openAnalysisFindings(task).map(f=>f.id):[],chart_outcome_id:changed&&task.outcome!==null?task.outcome.outcome_id:null,report_outcome_id:changed?(task.outcome??task.conversation_outcome)?.outcome_id??null:null},prior_result_unchanged:true as const,reason:!available?'真实范围与口径尚未形成，不得视为同范围或自动采纳。':changed?'真实问题、来源范围或口径改变；采纳后重新计算与独立核验，旧成果保留为历史。':'未发现当前提案的范围差异；这不授权复用核验或执行。'};
}
