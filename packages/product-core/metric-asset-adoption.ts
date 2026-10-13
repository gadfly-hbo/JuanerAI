import {taskHash} from './member-task.ts';
import {netSalesMetrics} from './metric-assets.ts';
import type {OpenAnalysisOutcome} from '../ports/open-analysis-store.ts';
export type MetricAssetAdoption=Readonly<{
 receipt:Readonly<{task_id:string;package:Readonly<{id:string;version:string;content_fingerprint:string;package_fingerprint:string}>;adopted_metrics:readonly Readonly<{name:string}>[];adopted_scenarios:readonly Readonly<{id:string}>[];issues_found:readonly Readonly<{kind:'trial_issue';metric:'refund_rate';detail:string}>[];computed_at:string}>;
 local:Readonly<{task_id:string;revision:string;run_id:string;outcome_id:string;owner:string;project_id:string;approval_command_id:string;definition_sha256:string;source_sha256:string;ir_sha256:string;calculation_sha256:string;verification_sha256:string;scope:'net_sales_review:category:week';completion:'complete'|'restricted_refund_rate'|'partial_refund_risk'}>;
}>;
function fail():never{throw Object.assign(new Error('ASSET_ADOPTION_INVALID'),{code:'ASSET_ADOPTION_INVALID'});}
/** Commit this value inside the original immutable outcome transaction. */
export function metricAssetAdoption(outcome:Omit<OpenAnalysisOutcome,'asset_adoption'>,computed_at:string):MetricAssetAdoption {
 const p=outcome.framework.asset_analysis,c=outcome.calculation,a=c.asset_analysis,v=outcome.verification;
 if(!p||!a||outcome.framework.version!=='2.4'||v.grade!=='independent_arithmetic'||v.plan_sha256!==taskHash(outcome.framework)||v.result_sha256!==taskHash(c)||v.inspection_sha256!==outcome.identity.scope_sha256||a.definition_sha256!==p.asset_approval.definition_sha256||a.asset_id!==p.asset.id||a.asset_version!==p.asset.version||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(computed_at)||!Number.isFinite(Date.parse(computed_at)))fail();
 const limited=a.total.metrics.refund_rate===null;
 const riskIncomplete=p.parameters.refund_guardrail_required&&[a.total,...a.weekly,...a.periods].some(b=>b.metrics.refund_rate===null||b.groups.some(g=>g.metrics.refund_rate===null));
 return {receipt:{task_id:`xanthil-${outcome.identity.task_id}-revision-${outcome.identity.revision}-run-${outcome.identity.run_id}`,package:{id:a.asset_id,version:a.asset_version,content_fingerprint:a.content_fingerprint,package_fingerprint:a.package_fingerprint},adopted_metrics:netSalesMetrics.map(name=>({name})),adopted_scenarios:riskIncomplete?[]:[{id:'net_sales_review'}],issues_found:riskIncomplete?[{kind:'trial_issue',metric:'refund_rate',detail:'所承诺的支付队列风险护栏存在零分母；净额部分结果已核验，风险判断未完成。'}]:limited?[{kind:'trial_issue',metric:'refund_rate',detail:'支付队列分母为零，退款率证据不足；净额受限报告不完成退款风险判断。'}]:[],computed_at},local:{task_id:outcome.identity.task_id,revision:outcome.identity.revision,run_id:outcome.identity.run_id,outcome_id:outcome.outcome_id,owner:p.asset_approval.owner,project_id:p.asset_approval.project_id,approval_command_id:p.asset_approval.command_id,definition_sha256:p.asset_approval.definition_sha256,source_sha256:outcome.identity.scope_sha256,ir_sha256:taskHash(outcome.framework),calculation_sha256:taskHash(c),verification_sha256:taskHash(v),scope:'net_sales_review:category:week',completion:riskIncomplete?'partial_refund_risk':limited?'restricted_refund_rate':'complete'}};
}
export function validateMetricAssetAdoption(outcome:OpenAnalysisOutcome):void {
 if(!outcome.asset_adoption||taskHash(metricAssetAdoption(outcome,outcome.asset_adoption.receipt.computed_at))!==taskHash(outcome.asset_adoption))fail();
}
