import type {Authorization,AssistantSource,MembershipAuthorization} from '../contracts/case-assistant.ts';
import type {CollaborationReference,ChildResultValue} from '../contracts/case-collaboration.ts';
import type {MembershipTaskStore} from '../ports/member-task.ts';
import type {DesktopDecisionCaseStore} from '../ports/xanthil-desktop-decision-case.ts';
import {parseDesktopCsv} from '../product-core/xanthil-desktop-decision-case.ts';
import {membershipHash} from '../product-core/member-analysis.ts';
import {approvedMembershipPolicy} from '../product-core/member-model-policy.ts';
import {closed,fail,outbound,protectText,encodeTask,taskHash,totals} from '../product-core/member-task.ts';
export type RetainedMembershipDependencies={store:MembershipTaskStore;desktop:Pick<DesktopDecisionCaseStore,'readProjection'>;sourceStore:Pick<DesktopDecisionCaseStore,'readConfirmedSnapshot'>};
/** Material/privacy qualification only. The existing Case authorization and public
 * SDK own admission and runtime facts; no second Task grant or resource balance. */
export function createRetainedMembershipAccess(deps:RetainedMembershipDependencies,clock:()=>Date,permission:{isAuthorized:(id:string)=>boolean;revoke:(a:Authorization)=>Promise<void>}){
 async function snapshot(source:AssistantSource){
  const origin=source.membership_origin;if(origin)closed(origin,['version','task_id','prepared_sha256']);if(!origin||origin.version!=='2.0')fail('AUTHORITY_REQUIRED');
  const state=await deps.store.read(origin.task_id);if(encodeTask(state.owner)!==encodeTask(source.owner)||state.status!=='closed')fail('SOURCE_CHANGED');
  const projection=await deps.desktop.readProjection(state.owner),finding=projection.findings.find(f=>f.finding_id===source.finding_id);
  if(projection.revision?.state!=='Completed'||projection.revision.row_version!==source.row_version||projection.revision.current_report_id!==source.report.report_id||projection.session?.current_revision_id!==source.owner.revision_id||!projection.confirmation||!finding?.run_id)fail('SOURCE_CHANGED');
  const plan=await deps.store.retainedPlan(origin.task_id,finding.run_id),fingerprint=plan.version==='2.0'?plan.preparation.sha256:state.prepared?.fingerprint;
  if(!fingerprint||fingerprint!==origin.prepared_sha256||encodeTask(plan.owner)!==encodeTask(state.owner))fail('SOURCE_CHANGED');
  const saved=await deps.sourceStore.readConfirmedSnapshot({...state.owner,confirmation_id:projection.confirmation.confirmation_id});
  const contract=JSON.parse(new TextDecoder().decode(saved.confirmation.contract_bytes)),binding=JSON.parse(new TextDecoder().decode(saved.confirmation.binding_bytes));
  if(membershipHash({column_mapping:binding,comparison_period:contract.comparison_period,current_period:contract.current_period,currency:contract.currency,time_zone:contract.time_zone,valid_statuses:contract.valid_statuses,selected_group_mode:contract.selected_group_mode})!==membershipHash(plan.parameters))fail('SOURCE_CHANGED');
  const protectedValues=[...Object.values(source.owner),source.finding_id,source.acceptance_id,source.closure_id,source.aggregate.artifact_id,source.report.report_id,...source.evidence_refs,...source.candidates.map(c=>c.candidate_id)];
  const counts:{members:string;orders:string}={members:'',orders:''};
  for(const [role,columns]of [['members',[plan.parameters.column_mapping.member_id_column,plan.parameters.column_mapping.member_group_column]],['orders',[plan.parameters.column_mapping.order_id_column,plan.parameters.column_mapping.order_member_id_column]]] as const){if(saved.snapshot[role].sha256!==plan.sources[role].sha256)fail('SOURCE_CHANGED');const csv=parseDesktopCsv(saved.snapshot[role].bytes);counts[role]=String(csv.rows.length);protectedValues.push(...csv.headers,saved.snapshot[role].display_name);for(const row of csv.rows){if(role==='members')protectedValues.push(...row);else for(const col of columns)if(col)protectedValues.push(row[csv.headers.indexOf(col)]);}}
  const metrics=JSON.parse(source.aggregate.content),material=outbound({version:'1.0',source_sha256:fingerprint,methods:plan.methods,semantics:{metric:'membership_repurchase_comparison',currency:plan.parameters.currency,time_zone:plan.parameters.time_zone,comparison_period:plan.parameters.comparison_period,current_period:plan.parameters.current_period,status_meanings:'explicitly_confirmed_local'},preparation:counts,selected_text:null,result:{periods:metrics.periods,changes:metrics.changes},tool_result:'verified'});
  const text=(value:string)=>{protectText(value,protectedValues);outbound({...material,selected_text:value});if(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b|(?:groups?|分组|群组|组别).{0,30}\d/i.test(value))fail('OUTBOUND_FORBIDDEN');return value;};return {state,material,text};
 }
 function refs(a:Authorization):CollaborationReference[]{return a.collaboration?[...a.collaboration.allowed_references]:[{kind:'case',id:a.source.owner.case_id,revision_id:a.source.owner.revision_id,version:null,sha256:null},...a.source.evidence_refs.map(id=>({kind:'evidence' as const,id,revision_id:a.source.owner.revision_id,version:null,sha256:null})),{kind:'finding',id:a.source.finding_id,revision_id:a.source.owner.revision_id,version:null,sha256:null},...a.source.candidates.map(c=>({kind:'candidate' as const,id:c.candidate_id,revision_id:a.source.owner.revision_id,version:null,sha256:null}))];}
 function aliases(a:Authorization){return refs(a).map((r,i)=>({...r,id:'reference-'+(i+1),revision_id:'current',sha256:null}));}
 async function safeValue(source:AssistantSource,value:ChildResultValue){const s=await snapshot(source);s.text(value.summary);value.limitations.forEach(s.text);value.unknowns.forEach(s.text);return value;}
 async function restrict(a:Authorization,session_id:string):Promise<Authorization>{
  const s=await snapshot(a.source);if(a.config?.provider!==approvedMembershipPolicy.provider||a.config.model!==approvedMembershipPolicy.model)fail('CONFIGURATION_CHANGED');
  const context=JSON.parse(a.payload),selected_history=[...a.selected_history,...(context.inherited_history??[])].map((e:{kind:string;text:string})=>({kind:e.kind,text:e.kind==='tool'?encodeTask(s.material):s.text(e.text)}));
  const materials=context.selected_materials??[],results=a.collaboration?.selected_results??[];for(const m of materials)await safeValue(a.source,m.result.value);for(const r of results)await safeValue(a.source,r.value);
  const created_at=clock().toISOString(),membership:MembershipAuthorization={version:'2.0',task_id:s.state.task_id,epoch:s.state.epoch,source_sha256:taskHash(a.source),policy_sha256:taskHash(approvedMembershipPolicy),purpose:a.collaboration?.kind??'assistant',session_id,created_at,expires_at:null,local_usage:totals(s.state.usage)};
  const task=context.task===undefined||context.task===null?null:s.text(context.task),payload=JSON.stringify({contract_version:'2.0',source:'current',task,initial_text:s.text(a.initial_text),material:s.material,selected_history,selected_reports:a.selected_reports.map((_,i)=>({reference:'report-'+(i+1),material:s.material})),selected_materials:materials.map((m:{result:{value:ChildResultValue}})=>({classification:'MODEL',summary:m.result.value.summary,limitations:m.result.value.limitations,unknowns:m.result.value.unknowns})),selected_results:results.map(r=>({summary:r.value.summary,limitations:r.value.limitations,unknowns:r.value.unknowns})),allowed_references:aliases(a),tools:a.tools});
  return {...a,membership,payload,categories:['P1 两期总体指标','本次同意的文本','本次选择的安全摘要','原任务本地计算记录（模型用量另查 SDK）']};
 }
 async function check(a:Authorization){const m=a.membership;if(m)closed(m,['version','task_id','epoch','source_sha256','policy_sha256','purpose','session_id','created_at','expires_at','local_usage']);if(!m||m.version!=='2.0'||m.source_sha256!==taskHash(a.source)||m.policy_sha256!==taskHash(approvedMembershipPolicy))fail('AUTHORITY_REQUIRED');if(m.expires_at&&clock().getTime()>=Date.parse(m.expires_at)){await permission.revoke(a);fail('GRANT_EXPIRED');}try{const s=await snapshot(a.source);if(s.state.epoch!==m.epoch)fail('SOURCE_CHANGED');return s;}catch(error){await permission.revoke(a);throw error;}}
 async function guard(a:Authorization){const s=await check(a);if(!permission.isAuthorized(a.id))fail('INTERRUPTED');return s;}
 async function tool(a:Authorization){return (await guard(a)).material;}
 return {restrict,check,guard,revoke:permission.revoke,tool,safeValue};
}
