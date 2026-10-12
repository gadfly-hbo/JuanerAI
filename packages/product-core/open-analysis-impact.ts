import {taskHash} from './member-task.ts';
import {openAnalysisFindings} from '../contracts/open-analysis-findings.mjs';
import type {OpenStoredTask,OpenFrameworkCheckpoint,OpenTaskIdentity} from '../ports/open-analysis-store.ts';
/** Proposal impact, never permission, execution, invalidation or an acceptance receipt. */
export function openAnalysisRevisionImpact(task:OpenStoredTask,candidate:{baseline_identity:OpenTaskIdentity;question:string;framework:OpenFrameworkCheckpoint}){
 if(taskHash(candidate.baseline_identity)!==taskHash(task.identity))throw Object.assign(new Error('REVISION_CONFLICT'),{code:'REVISION_CONFLICT'});
 const before=task.framework?.plan,after=candidate.framework.plan;
 const fields:[string,unknown,unknown][]=[
  ['问题',task.question,candidate.question],['目标',before?.goal,after.goal],
  ['实际来源与工作表',before?{source_id:before.source_id,sheet_id:before.sheet_id,inputs:before.inputs??null,references:before.references??null,membership:before.membership?.bindings??null}:null,{source_id:after.source_id,sheet_id:after.sheet_id,inputs:after.inputs??null,references:after.references??null,membership:after.membership?.bindings??null}],
  ['计算方法',before?{version:before.version,operation:before.operation,numeric_mode:before.numeric_mode??null}:null,{version:after.version,operation:after.operation,numeric_mode:after.numeric_mode??null}],
  ['计算字段',before?.column,after.column],['单位',before?.unit,after.unit],['金额单位换算',before?.measure,after.measure],['分组字段',before?.group_by,after.group_by],['筛选条件',before?.filters,after.filters],
  ['业务口径与期间',before?.membership?.semantics,after.membership?.semantics],['业务理解',task.framework?.context?.business,candidate.framework.context?.business],
  ['口径快照',task.framework?.context?.semantics,candidate.framework.context?.semantics],['派生规则',before?.value_mappings,after.value_mappings]
 ];
 const changes=fields.filter(([,a,b])=>taskHash(a??null)!==taskHash(b??null)).map(([label,a,b])=>({label,before:a??null,after:b??null}));
 // Any unproven dependency is conservatively affected; do not reuse arithmetic merely because a model says it is unchanged.
 const changed=changes.length>0||taskHash(before??null)!==taskHash(after);
 return {version:'1.0' as const,baseline_revision:task.identity.revision,baseline_scope_sha256:task.identity.scope_sha256,baseline_plan_sha256:before?taskHash(before):null,candidate_plan_sha256:taskHash(after),status:'needs_adoption' as const,changes,recalculation:changed?'all_dependent_results' as const:'not_requested' as const,affected:{finding_ids:changed?openAnalysisFindings(task).map(f=>f.id):[],chart_outcome_id:changed&&task.outcome?.calculation.groups?.length?task.outcome.outcome_id:null,report_outcome_id:changed?(task.outcome??task.conversation_outcome)?.outcome_id??null:null},prior_result_unchanged:true as const,reason:changed?'尚未证明依赖完全不变；采纳后重新计算与独立核验，旧成果仅保留为历史。':'未发现已绑定方案差异；本预览仍不执行或授予权限。'};
}
