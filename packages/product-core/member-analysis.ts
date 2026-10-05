import {validatePreparationPlanBinding,preparationAuthority,type PreparationPlanBinding} from './member-preparation.ts';
import {createHash} from 'node:crypto';
import {canonicalDesktopJson, desktopMetricChanges, desktopRuleFailure, prepareDesktopData, validateDesktopCalculationResult, type DesktopCalculationResult, type DesktopMetricPeriod, type DesktopSelection} from './xanthil-desktop-decision-case.ts';
import type {OwnerRef} from '../contracts/xanthil-desktop-ipc.ts';

export const membershipHash=(value:unknown)=>createHash('sha256').update(canonicalDesktopJson(value)).digest('hex');
export const membershipBytesHash=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
export function membershipRecord(value:unknown,keys:readonly string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))desktopRuleFailure();
 return value as Record<string,unknown>;
}
export const membershipUuid=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x);
export type MembershipScenario=Readonly<{version:'1.0';id:string;revision:string;maintainer:string;metric:'membership_repurchase_comparison';currency:'CNY';time_zone:'Asia/Shanghai';status_meanings:Readonly<Record<string,string>>;quality_policy:'desktop_six_treatments_v1';verification:'python_independent_exact'}>;
export type LegacyMembershipPlan=Readonly<{task_context?:Readonly<{task_id:string;grant_id:string;epoch:string;reservation_id:string;run_ms:string;process_seconds:string}>;version:'1.0';id:string;owner:OwnerRef;confirmation_id:string;snapshot_id:string;scenario:MembershipScenario;scenario_sha256:string;contract_sha256:string;binding_sha256:string;sources:Readonly<{members:Readonly<{sha256:string;byte_length:string}>;orders:Readonly<{sha256:string;byte_length:string}>}>;methods:readonly ('M1'|'M2')[];parameters:DesktopSelection;verification:'python_independent_exact'}>;
export type MembershipAnalysisIntent=Readonly<{version:'1.0'|'2.0';clarification_sha256?:string;analysis_kind:'overall_change';question_sha256:string;user_hypothesis:string|null}>;
export function membershipAnalysisIntent(value:unknown):MembershipAnalysisIntent{
 const clarified=(value as {version?:unknown})?.version==='2.0',i=membershipRecord(value,['version','analysis_kind','question_sha256','user_hypothesis',...(clarified?['clarification_sha256']:[])]);if(clarified&&(typeof i.clarification_sha256!=='string'||!/^[a-f0-9]{64}$/.test(i.clarification_sha256))||!['1.0','2.0'].includes(String(i.version))||i.analysis_kind!=='overall_change'||typeof i.question_sha256!=='string'||!/^[a-f0-9]{64}$/.test(i.question_sha256)||i.user_hypothesis!==null&&(typeof i.user_hypothesis!=='string'||!i.user_hypothesis.trim()||i.user_hypothesis.length>2000))desktopRuleFailure();return structuredClone(value) as MembershipAnalysisIntent;
}
export type PreparedMembershipPlan=Omit<LegacyMembershipPlan,'version'|'task_context'|'methods'>&Readonly<{version:'2.0';intent:MembershipAnalysisIntent;task_context?:never;methods:readonly ('M1'|'M2')[];preparation:PreparationPlanBinding;authority:Readonly<{task_id:string;grant_id:string;epoch:string;resume_preparation_sha256?:string}>}>;
export type MembershipPlan=LegacyMembershipPlan|PreparedMembershipPlan;
export type MembershipSnapshot=Readonly<{members_bytes:Uint8Array;orders_bytes:Uint8Array}>;
export type PlannedSelection=DesktopSelection&Readonly<{schema_version:'2.0'|'3.0';execution_plan:MembershipPlan}>;
const selectionKeys=['column_mapping','comparison_period','current_period','currency','time_zone','valid_statuses','selected_group_mode'] as const;
export function membershipSelection(input:unknown):DesktopSelection{
 const p=membershipRecord(input,selectionKeys);
 membershipRecord(p.column_mapping,['member_id_column','member_group_column','order_id_column','order_member_id_column','paid_at_column','amount_column','status_column','currency_column']);
 for(const key of ['comparison_period','current_period'])membershipRecord(p[key],['start_date','end_date']);
 return structuredClone(input) as DesktopSelection;
}
function validateLegacyMembershipPlan(input:unknown,snapshot?:MembershipSnapshot,selection?:DesktopSelection):LegacyMembershipPlan{
 const p=membershipRecord(input,['version','id','owner','confirmation_id','snapshot_id','scenario','scenario_sha256','contract_sha256','binding_sha256','sources','methods','parameters','verification',...((input as MembershipPlan)?.task_context?['task_context']:[])]);
 if(p.task_context){const c=membershipRecord(p.task_context,['task_id','grant_id','epoch','reservation_id','run_ms','process_seconds']);if(![c.task_id,c.grant_id,c.reservation_id].every(membershipUuid)||typeof c.epoch!=='string'||! /^(0|[1-9]\d*)$/.test(c.epoch)||!['run_ms','process_seconds'].every(k=>typeof c[k]==='string'&&/^[1-9]\d*$/.test(c[k] as string)&&Number.isSafeInteger(Number(c[k])))||Number(c.run_ms)>300000||Number(c.process_seconds)>30)desktopRuleFailure();}
 const owner=membershipRecord(p.owner,['project_id','session_id','case_id','revision_id']);
 if(p.version!=='1.0'||![p.id,p.confirmation_id,p.snapshot_id,...Object.values(owner)].every(membershipUuid)||p.verification!=='python_independent_exact'||!['["M1"]','["M1","M2"]'].includes(JSON.stringify(p.methods)))desktopRuleFailure();
 const scenario=membershipRecord(p.scenario,['version','id','revision','maintainer','metric','currency','time_zone','status_meanings','quality_policy','verification']);
 if(scenario.version!=='1.0'||!membershipUuid(scenario.id)||typeof scenario.revision!=='string'||! /^[1-9]\d*$/.test(scenario.revision)||typeof scenario.maintainer!=='string'||!scenario.maintainer.trim()||scenario.metric!=='membership_repurchase_comparison'||scenario.currency!=='CNY'||scenario.time_zone!=='Asia/Shanghai'||scenario.quality_policy!=='desktop_six_treatments_v1'||scenario.verification!==p.verification)desktopRuleFailure();
 const parameters=membershipSelection(p.parameters);
 if(membershipHash(scenario)!==p.scenario_sha256||membershipHash(parameters)!==p.contract_sha256||membershipHash(parameters.column_mapping)!==p.binding_sha256||selection&&membershipHash(selection)!==p.contract_sha256)desktopRuleFailure('SOURCE_CHANGED');
 const meanings=scenario.status_meanings;if(!meanings||typeof meanings!=='object'||Array.isArray(meanings)||!Array.isArray(parameters.valid_statuses)||parameters.valid_statuses.some(s=>!Object.hasOwn(meanings,s)||typeof (meanings as Record<string,unknown>)[s]!=='string'||!(meanings as Record<string,string>)[s].trim()))desktopRuleFailure();
 if((p.methods as string[]).includes('M2')&&(parameters.selected_group_mode!=='mapped'||parameters.column_mapping.member_group_column===null))desktopRuleFailure();
 const sources=membershipRecord(p.sources,['members','orders']);
 for(const role of ['members','orders'] as const){const d=membershipRecord(sources[role],['sha256','byte_length']);if(typeof d.sha256!=='string'||! /^[0-9a-f]{64}$/.test(d.sha256)||typeof d.byte_length!=='string'||! /^[1-9]\d*$/.test(d.byte_length))desktopRuleFailure();if(snapshot){const bytes=snapshot[`${role}_bytes`];if(!(bytes instanceof Uint8Array)||membershipBytesHash(bytes)!==d.sha256||String(bytes.length)!==d.byte_length)desktopRuleFailure('SOURCE_CHANGED');}}
 if(snapshot)prepareDesktopData(snapshot,parameters); // qualification only; Python still computes independently from source bytes
 return structuredClone(input) as LegacyMembershipPlan;
}
export function validateMembershipPlan(input:unknown,snapshot?:MembershipSnapshot,selection?:DesktopSelection):MembershipPlan{
 if((input as {version?:unknown})?.version!=='2.0')return validateLegacyMembershipPlan(input,snapshot,selection);
 const p=membershipRecord(input,['version','id','owner','confirmation_id','snapshot_id','scenario','scenario_sha256','contract_sha256','binding_sha256','sources','methods','parameters','verification','preparation','authority','intent']);
 const {preparation,authority,intent,...base}=p,checkedIntent=membershipAnalysisIntent(intent),qualified=validatePreparationPlanBinding(preparation),a=preparationAuthority(authority,qualified);
 const legacy=validateLegacyMembershipPlan({...base,version:'1.0'},snapshot,selection);
 if(JSON.stringify(legacy.methods)!=='["M1"]'||!membershipUuid(a.task_id)||!membershipUuid(a.grant_id)||typeof a.epoch!=='string'||!/^(0|[1-9]\d*)$/.test(a.epoch)||!Number.isSafeInteger(Number(a.epoch))||a.task_id!==qualified.task_id||membershipHash(legacy.owner)!==membershipHash(qualified.owner)||membershipHash(legacy.sources)!==membershipHash(qualified.normalized))desktopRuleFailure('SOURCE_CHANGED');
 const {task_context,...preparedBase}=legacy;void task_context;
 return {...preparedBase,version:'2.0',intent:checkedIntent,methods:['M1'],preparation:qualified,authority:a};
}
export function plannedSelection(input:unknown,snapshot:MembershipSnapshot):PlannedSelection{
 const c=membershipRecord(input,[...selectionKeys,'schema_version','execution_plan']);if(c.schema_version!=='2.0'&&c.schema_version!=='3.0')desktopRuleFailure();
 const selection=membershipSelection(Object.fromEntries(selectionKeys.map(k=>[k,c[k]])));
 const plan=validateMembershipPlan(c.execution_plan,snapshot,selection);if(c.schema_version!==(plan.version==='2.0'?'3.0':'2.0'))desktopRuleFailure();
 return {...selection,schema_version:c.schema_version,execution_plan:plan};
}
export type MembershipPeriod=Omit<DesktopMetricPeriod,'repurchase_rate'>&Readonly<{repurchase_rate:DesktopMetricPeriod['repurchase_rate']|'not_applicable'}>;
export type MembershipResult=Readonly<{periods:Readonly<{comparison:MembershipPeriod;current:MembershipPeriod}>;changes:Omit<DesktopCalculationResult['changes'],'repurchase_rate'>&Readonly<{repurchase_rate:Readonly<{absolute_delta:DesktopCalculationResult['changes']['repurchase_rate']['absolute_delta']|'not_applicable';relative_change:DesktopCalculationResult['changes']['repurchase_rate']['relative_change']}>}>;m2:DesktopCalculationResult['m2']|Readonly<{status:'not_selected'}>}>;
export function validateMembershipResult(input:unknown,plan:MembershipPlan):MembershipResult{
 const r=membershipRecord(input,['periods','changes','m2']),periods=membershipRecord(r.periods,['comparison','current']);
 const legacyPeriods={} as Record<'comparison'|'current',DesktopMetricPeriod>;
 let unavailable=false;
 for(const name of ['comparison','current'] as const){const p=membershipRecord(periods[name],['active_member_count','repeat_member_count','repurchase_rate','repeat_revenue_fen']);const zero=p.active_member_count==='0';if(zero){if(p.repurchase_rate!=='not_applicable')desktopRuleFailure();unavailable=true;}else if(p.repurchase_rate==='not_applicable')desktopRuleFailure();legacyPeriods[name]={...p,repurchase_rate:zero?{numerator:'0',denominator:'1'}:p.repurchase_rate} as DesktopMetricPeriod;}
 const changes=desktopMetricChanges(legacyPeriods.comparison,legacyPeriods.current),expected={...changes,repurchase_rate:unavailable?{absolute_delta:'not_applicable',relative_change:'not_applicable'}:changes.repurchase_rate};
 if(membershipHash(r.changes)!==membershipHash(expected))desktopRuleFailure();
 const m2=r.m2 as MembershipResult['m2'];if(!plan.methods.includes('M2')){if(canonicalDesktopJson(m2)!=='{"status":"not_selected"}')desktopRuleFailure();}else if(unavailable){if(canonicalDesktopJson(m2)!=='{"status":"not_applicable"}')desktopRuleFailure();}else if(m2?.status!=='applicable')desktopRuleFailure();
 validateDesktopCalculationResult({periods:legacyPeriods,changes,m2:!plan.methods.includes('M2')||unavailable?{status:'not_applicable'}:m2});
 if(legacyPeriods.comparison.active_member_count==='0'&&legacyPeriods.current.active_member_count==='0')desktopRuleFailure();
 return structuredClone(input) as MembershipResult;
}
export function membershipComparisonDirection(result:Pick<MembershipResult,'periods'>):'decrease'|'increase'|'equal'|'not_comparable'{
 const a=result.periods.comparison,b=result.periods.current;if(a.active_member_count==='0'||b.active_member_count==='0'||a.repurchase_rate==='not_applicable'||b.repurchase_rate==='not_applicable')return 'not_comparable';
 const delta=BigInt(b.repurchase_rate.numerator)*BigInt(a.repurchase_rate.denominator)-BigInt(a.repurchase_rate.numerator)*BigInt(b.repurchase_rate.denominator);return delta<0n?'decrease':delta>0n?'increase':'equal';
}
export type MembershipFindingFacts=Readonly<{version:'2.0';comparison_direction:ReturnType<typeof membershipComparisonDirection>;verification_status:'verified';intent:MembershipAnalysisIntent}>;
export function membershipFindingFacts(result:MembershipResult,plan:MembershipPlan):MembershipFindingFacts{
 if(plan.version!=='2.0')desktopRuleFailure();validateMembershipResult(result,plan);return {version:'2.0',comparison_direction:membershipComparisonDirection(result),verification_status:'verified',intent:membershipAnalysisIntent(plan.intent)};
}
export const analysisJudgment=(result:MembershipResult,plan?:MembershipPlan)=>plan?.version==='2.0'?'Verified':membershipJudgment(result);
export const analysisRefutation=(result:MembershipResult,plan?:MembershipPlan)=>plan?.version==='2.0'?(membershipComparisonDirection(result)==='not_comparable'?'active_member_denominator_is_zero':'descriptive_change_does_not_establish_cause'):(membershipJudgment(result)==='Confirmed'?'association_does_not_establish_cause':membershipJudgment(result)==='Rejected'?'current_rate_is_not_lower':'active_member_denominator_is_zero');
export function membershipJudgment(result:MembershipResult):'Confirmed'|'Rejected'|'Inconclusive'{
 const a=result.periods.comparison.repurchase_rate,b=result.periods.current.repurchase_rate;
 return result.periods.comparison.active_member_count==='0'||result.periods.current.active_member_count==='0'||a==='not_applicable'||b==='not_applicable'?'Inconclusive':BigInt(b.numerator)*BigInt(a.denominator)<BigInt(a.numerator)*BigInt(b.denominator)?'Confirmed':'Rejected';
}

import {validateDesktopRunManifest,validateDesktopRunEvidence,type DesktopRunManifest} from './xanthil-desktop-decision-case.ts';
import {validateXanthilDesktopRequest,type StartAnalysisRequest} from '../contracts/xanthil-desktop-ipc.ts';
export type PlannedStart=Omit<StartAnalysisRequest,'contract_version'>&{contract_version:'2.0'|'3.0';execution_plan:MembershipPlan};
export function validatePlanStart(input:unknown):StartAnalysisRequest|PlannedStart{
 if(!['2.0','3.0'].includes(String((input as {contract_version?:unknown})?.contract_version)))return validateXanthilDesktopRequest('startAnalysis',input);
 const c=membershipRecord(input,['contract_version','command_id','project_id','session_id','case_id','revision_id','expected_row_version','confirmation_id','execution_plan']);
 const {execution_plan,...command}=c;validateXanthilDesktopRequest('startAnalysis',{...command,contract_version:'1.0'});
 const plan=validateMembershipPlan(execution_plan);if(c.contract_version!==(plan.version==='2.0'?'3.0':'2.0'))desktopRuleFailure();if(Object.entries(plan.owner).some(([k,v])=>c[k]!==v)||c.confirmation_id!==plan.confirmation_id)desktopRuleFailure('SOURCE_CHANGED');
 return {...c,execution_plan:plan} as PlannedStart;
}
export type PlannedRunManifest=Omit<DesktopRunManifest,'schema_version'>&{schema_version:'4.0';execution_plan:LegacyMembershipPlan};
export type PreparedRunManifest=Omit<DesktopRunManifest,'schema_version'>&{schema_version:'5.0';execution_plan:PreparedMembershipPlan;preparation_sha256:string};
export type AnalysisRunManifest=DesktopRunManifest|PlannedRunManifest|PreparedRunManifest;
export function validateAnalysisManifest(input:unknown):AnalysisRunManifest{
 const version=(input as {schema_version?:unknown})?.schema_version;
 if(version!=='4.0'&&version!=='5.0')return validateDesktopRunManifest(input);
 const {execution_plan,...rest}=input as PlannedRunManifest|PreparedRunManifest,plan=validateMembershipPlan(execution_plan);
 if(version!==(plan.version==='2.0'?'5.0':'4.0'))desktopRuleFailure();
 let legacy:Record<string,unknown>=rest;
 if(plan.version==='2.0'){const {preparation_sha256,...base}=legacy;if(preparation_sha256!==plan.preparation.sha256)desktopRuleFailure('SOURCE_CHANGED');legacy=base;}
 const base=validateDesktopRunManifest({...legacy,schema_version:'3.0'});
 if(Object.entries({...plan.owner,confirmation_id:plan.confirmation_id,snapshot_id:plan.snapshot_id}).some(([k,v])=>base.product_context[k as keyof typeof base.product_context]!==v))desktopRuleFailure();
 for(const [i,role] of (['members','orders'] as const).entries())if(base.sources[i].sha256!==plan.sources[role].sha256||base.sources[i].byte_length!==plan.sources[role].byte_length)desktopRuleFailure();
 return plan.version==='2.0'?{...base,schema_version:'5.0',execution_plan:plan,preparation_sha256:plan.preparation.sha256}:{...base,schema_version:'4.0',execution_plan:plan};
}
export const planOf=(manifest:AnalysisRunManifest)=>manifest.schema_version!=='3.0'?manifest.execution_plan:undefined;
export const analysisPlanIdentity=(plan?:MembershipPlan)=>plan?{plan_sha256:membershipHash(plan),...(plan.version==='2.0'?{preparation_sha256:plan.preparation.sha256}:{})}:{};
export const analysisArtifactVersion=(plan?:MembershipPlan)=>plan?.version==='2.0'?'3.0':plan?'2.0':'1.0';
export const analysisManifestVersion=(plan?:MembershipPlan)=>plan?.version==='2.0'?'5.0':plan?'4.0':'3.0';
export const analysisResult=(input:unknown,plan?:MembershipPlan)=>plan?validateMembershipResult(input,plan):validateDesktopCalculationResult(input);
export const analysisRatio=(x:MembershipPeriod['repurchase_rate'])=>x==='not_applicable'?'not_applicable':`${x.numerator}/${x.denominator}`;
export function validateAnalysisEvidence(input:unknown,manifest:AnalysisRunManifest,result:MembershipResult):Record<string,unknown>{
 if(manifest.schema_version==='3.0')return validateDesktopRunEvidence(input,manifest,result as DesktopCalculationResult);
 const e=membershipRecord(input,['schema_version','run_id','product_context','method','sources','calculations','equality','judgment','m2_applicability','candidate_publications','limitations','plan_sha256',...(manifest.schema_version==='5.0'?['preparation_sha256','finding_facts']:[])]);
 if(e.schema_version!==manifest.schema_version||e.plan_sha256!==membershipHash(manifest.execution_plan)||manifest.schema_version==='5.0'&&e.preparation_sha256!==manifest.preparation_sha256)desktopRuleFailure();
 // Reuse the descriptor/ownership contract, after checking the new result separately.
 validateMembershipResult(result,manifest.execution_plan);
 const normalized=structuredClone(result) as unknown as DesktopCalculationResult;
 const periods=Object.fromEntries(Object.entries(normalized.periods).map(([k,p])=>[k,{...p,repurchase_rate:p.active_member_count==='0'?{numerator:'0',denominator:'1'}:p.repurchase_rate}])) as DesktopCalculationResult['periods'];
 const legacy={...normalized,periods,changes:desktopMetricChanges(periods.comparison,periods.current),m2:result.m2.status==='not_selected'?{status:'not_applicable' as const}:result.m2};
 if(e.equality&&canonicalDesktopJson(e.equality)!==canonicalDesktopJson({status:'matched',result_sha256:membershipHash(result)})||e.judgment!==analysisJudgment(result,manifest.execution_plan)||e.m2_applicability!==result.m2.status)desktopRuleFailure();
 if(manifest.execution_plan.version==='2.0'&&membershipHash(e.finding_facts)!==membershipHash(membershipFindingFacts(result,manifest.execution_plan)))desktopRuleFailure();
 const {plan_sha256,preparation_sha256,finding_facts,...old}=e;void plan_sha256;void preparation_sha256;void finding_facts;
 validateDesktopRunEvidence({...old,judgment:membershipJudgment(result),schema_version:'3.0',equality:{status:'matched',result_sha256:membershipHash(legacy)},m2_applicability:legacy.m2.status},{...manifest,schema_version:'3.0'},legacy);
 return structuredClone(e);
}
export function validateAnalysisOutput(input:unknown,manifest:AnalysisRunManifest,index:2|3):MembershipResult{
 const plan=planOf(manifest),o=membershipRecord(input,['schema_version','run_id','implementation','method','result',...(plan?['plan_sha256','materialization']:[]),...(plan?.version==='2.0'?['preparation_sha256']:[])]);
 if(o.schema_version!==analysisArtifactVersion(plan)||o.run_id!==manifest.run_id||o.implementation!==(index===2?'duckdb_primary':'python_independent')||membershipHash(o.method)!==membershipHash(manifest.method))desktopRuleFailure();
 if(plan?.version==='2.0'&&o.preparation_sha256!==plan.preparation.sha256)desktopRuleFailure('SOURCE_CHANGED');
 if(plan&&(o.plan_sha256!==membershipHash(plan)||membershipHash(o.materialization)!==membershipHash({primary_sql_sha256:manifest.artifacts[0].sha256,python_verifier_sha256:manifest.artifacts[1].sha256})))desktopRuleFailure('SOURCE_CHANGED');
 return analysisResult(o.result,plan);
}
