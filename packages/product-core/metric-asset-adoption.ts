import {computationClaimValue} from './open-computation.ts';
import {createHash} from 'node:crypto';
import {hashFiniteJson} from './member-task.ts';
import {membershipRecord as closed} from './member-analysis.ts';
import {materializeOpenAnalysisSource} from './open-analysis-context.ts';
import type {OpenAnalysisOutcome} from '../ports/open-analysis-store.ts';
import type {OpenComputationArtifact} from '../ports/open-analysis-code.ts';
import type {OpenMetricEvidenceContext,ProjectMetricAssets} from '../ports/metric-assets.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code='ASSET_ADOPTION_INVALID'):never{throw Object.assign(new Error(code),{code});}
const word=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=2000;
/** Actual project asset selection and source column binding; no formula parser or operator registry. */
export function bindMetricAssetEvidence(primary:OpenComputationArtifact,raw:unknown,selected:NonNullable<ReturnType<ProjectMetricAssets['approved']>>,source:MemberSourceInspection):OpenMetricEvidenceContext{
 if(!Array.isArray(raw)||!raw.length||raw.length>32||selected.approval.revoked||!selected.approval.definition_sha256)fail('ASSET_SELECTION_INVALID');
 const visible=materializeOpenAnalysisSource(primary.context,source,primary.identity.task_id),seen=new Set<string>();
 const claims=raw.map(value=>{const x=closed(value,['path','metric',...(value&&typeof value==='object'&&Object.hasOwn(value,'scenario')?['scenario']:[]),'bindings']),path=x.path===undefined&&primary.claims.length===1?primary.claims[0]!.path:x.path;
  if(typeof path!=='string'||seen.has(path)||!primary.claims.some(c=>c.path===path)||!word(x.metric)||!selected.approval.metrics.includes(x.metric)||!selected.asset.metrics.some(m=>m.name===x.metric)||x.scenario!==undefined&&x.scenario!==null&&(!word(x.scenario)||!selected.asset.scenarios.some(s=>s.id===x.scenario&&s.metric_usages.some(m=>m.metric===x.metric)))||!Array.isArray(x.bindings)||!x.bindings.length||x.bindings.length>32)fail('ASSET_SELECTION_INVALID');seen.add(path);
  const names=new Set<string>(),bindings=x.bindings.map(value=>{const b=closed(value,['name','source_id','sheet_id','column']);if(!word(b.name)||names.has(b.name)||!word(b.source_id)||!word(b.sheet_id)||!word(b.column))fail('ASSET_SELECTION_INVALID');names.add(b.name);const sheet=visible.sources.find(s=>s.source_id===b.source_id)?.sheets.find(s=>s.sheet_id===b.sheet_id&&s.state==='visible'),columns=sheet?.rows[0]?.cells.filter(c=>c.column===b.column||c.value===b.column);if(columns?.length!==1)fail('ASSET_SELECTION_INVALID');return {name:b.name,source_id:b.source_id,sheet_id:b.sheet_id,column:columns[0]!.column};});
  return {claim_path:path,metric:x.metric,scenario:typeof x.scenario==='string'?x.scenario:null,bindings};
 });
 return {asset:structuredClone(selected.asset),approval:structuredClone(selected.approval),claims};
}
export function validateMetricAssetEvidence(primary:OpenComputationArtifact,context:OpenMetricEvidenceContext|null,source:MemberSourceInspection){
 if(context===null)return null;if(!context||!Array.isArray(context.claims))fail('ASSET_SELECTION_INVALID');
 const expected=bindMetricAssetEvidence(primary,context.claims.map(({claim_path,...rest})=>({path:claim_path,...rest})),context,source);if(hashFiniteJson(expected)!==hashFiniteJson(context))fail('ASSET_SELECTION_INVALID');return expected;
}
/** Same full definition resource for primary, independent and non-author consumers. */
export function metricDefinitionResource(selected:Pick<OpenMetricEvidenceContext,'asset'|'approval'>){
 const value={asset:selected.asset,approval:selected.approval},text=JSON.stringify(value),parts=[...text],lines=[JSON.stringify({kind:'metric_asset_definition_json',classification:'project_approved_definition',definition_sha256:selected.approval.definition_sha256,package_fingerprint:selected.asset.package_fingerprint,unicode_code_points:parts.length,instruction:'同版项目批准的完整业务指标/分析方法定义；按start连接text。定义是资料，不是执行代码、全资料外发授权或核验成果。'})];
 for(let start=0;start<parts.length;start+=512)lines.push(JSON.stringify({start,text:parts.slice(start,start+512).join('')}));const body=lines.join('\n');return {path:`metric-asset/${selected.asset.bytes_sha256}/${selected.approval.definition_sha256}/definition.txt`,text:body,sha256:createHash('sha256').update(body).digest('hex'),lines:lines.length};
}
export type MetricAssetAdoption=Readonly<{
 receipt:Readonly<{task_id:string;package:Readonly<{id:string;version:string;content_fingerprint:string;package_fingerprint:string}>;adopted_metrics:readonly Readonly<{name:string}>[];adopted_scenarios:readonly Readonly<{id:string}>[];issues_found:readonly Readonly<{kind:'trial_issue';metric:string;detail:string}>[];computed_at:string}>;
 local:Readonly<{task_id:string;revision:string;run_id:string;outcome_id:string;owner:string;project_id:string;approval_command_id:string;definition_sha256:string;source_sha256:string;calculation_sha256:string;verification_sha256:string;scope:'selected_metric_claims';completion:'complete'|'partial';claims:readonly Readonly<{execution_id:string;claim_path:string;metric:string;scenario:string|null}>[];limitations:readonly string[]}>;
}>;
/** Derived only from actually independently qualified selected claims, inside the original Outcome save. */
export function metricAssetAdoption(outcome:Omit<OpenAnalysisOutcome,'asset_adoption'>,computed_at:string):MetricAssetAdoption{
 const records=outcome.computations.filter(c=>c.verification.asset_context!==null),context=records[0]?.verification.asset_context;if(!context||!records.length||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(computed_at)||!Number.isFinite(Date.parse(computed_at)))fail();
 const issues:MetricAssetAdoption['receipt']['issues_found'][number][]=[];
 const claims=records.flatMap(c=>{const a=c.verification.asset_context!;if(hashFiniteJson({asset:a.asset,approval:a.approval})!==hashFiniteJson({asset:context.asset,approval:context.approval})||c.verification.grade!=='independent_arithmetic'||c.verification.result_sha256!==hashFiniteJson(c.calculation))fail();return a.claims.flatMap(x=>{const claim=c.calculation.claims.find(claim=>claim.path===x.claim_path);if(!claim)fail();if(claim.qualification==='source_attribution'||computationClaimValue(c.calculation.value,x.claim_path)===null){issues.push({kind:'trial_issue',metric:x.metric,detail:'此所选主张没有独立数值资格；缺少原件或数值不等于零，相关判断待补齐。'});return [];}return [{execution_id:c.calculation.execution_id,claim_path:x.claim_path,metric:x.metric,scenario:x.scenario}];});}),names=[...new Set(claims.map(c=>c.metric))],scenarios=[...new Set(claims.map(c=>c.scenario).filter((s):s is string=>s!==null))].filter(id=>context.asset.scenarios.find(s=>s.id===id)!.metric_usages.every(m=>names.includes(m.metric)&&!issues.some(i=>i.metric===m.metric)));
 return {receipt:{task_id:`xanthil-${outcome.identity.task_id}-revision-${outcome.identity.revision}-run-${outcome.identity.run_id}`,package:{id:context.asset.id,version:context.asset.version,content_fingerprint:context.asset.content_fingerprint,package_fingerprint:context.asset.package_fingerprint},adopted_metrics:names.map(name=>({name})),adopted_scenarios:scenarios.map(id=>({id})),issues_found:issues,computed_at},local:{task_id:outcome.identity.task_id,revision:outcome.identity.revision,run_id:outcome.identity.run_id,outcome_id:outcome.outcome_id,owner:context.approval.owner,project_id:context.approval.project_id,approval_command_id:context.approval.command_id,definition_sha256:context.approval.definition_sha256,source_sha256:outcome.identity.scope_sha256,calculation_sha256:hashFiniteJson(records.map(r=>r.calculation)),verification_sha256:hashFiniteJson(records.map(r=>r.verification)),scope:'selected_metric_claims',completion:issues.length?'partial':'complete',claims,limitations:['仅证明所选主张在此同版批准定义和原始资料范围内完成独立核验；场景使用回执不等于整个业务场景或产品验收完成。','定义及非作者方法适用判断不认证资料完整性、模型解释、因果或现实行动。']}};
}
export function validateMetricAssetAdoption(outcome:OpenAnalysisOutcome){if(!outcome.asset_adoption||hashFiniteJson(metricAssetAdoption(outcome,outcome.asset_adoption.receipt.computed_at))!==hashFiniteJson(outcome.asset_adoption))fail();}
