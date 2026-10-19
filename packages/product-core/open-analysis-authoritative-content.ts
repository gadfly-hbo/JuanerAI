import {membershipRecord} from './member-analysis.ts';
import {judgmentPremises} from './open-analysis-judgment-conditions.ts';
import {reviewedContentSources,qualifyReviewedContent} from './open-analysis-reviewed-content.ts';
import type {AuthoritativeMeaning,JudgmentSnapshot,JudgmentClaimReview,ReviewableUnit} from '../ports/open-analysis-judgment-review.ts';

/** JR108 experimental business-content projection. Raw MODEL prose remains in
 * the immutable unit, never an input to the authoritative presentation. This
 * is a bounded business vocabulary, not an arbitrary-language verifier. */
function fail():never{throw Object.assign(new Error('JUDGMENT_MEANING_INVALID'),{code:'JUDGMENT_MEANING_INVALID'});}
const partNames=['basis','proposal','risks','alternative','stops','observation'];
function choices(raw:unknown,allowed:readonly string[]):asserts raw is string[]{if(!Array.isArray(raw)||new Set(raw).size!==raw.length||raw.some(v=>typeof v!=='string'||!allowed.includes(v)))fail();}
export function validateAuthoritativeMeaning(raw:unknown):AuthoritativeMeaning{
 const m=membershipRecord(raw,['version','basis','risks','alternative','stops','observation','presentation']),b=membershipRecord(m.basis,['kind','source_ids']);
 if(m.version!=='1.0'||b.kind!=='separate_summaries'||!Array.isArray(b.source_ids)||b.source_ids.length!==2||new Set(b.source_ids).size!==2||b.source_ids.some(v=>typeof v!=='string'))fail();
 choices(m.risks,['unproven_net','unproven_profit','unproven_cause','unmatched_records']);choices(m.stops,['unmatched_records','new_material']);choices(m.presentation,partNames);
 if(![null,'defer_analysis'].includes(m.alternative as any)||![null,'traceable_matching'].includes(m.observation as any))fail();
 return structuredClone(raw) as AuthoritativeMeaning;
}
function sumLeaves(plan:unknown):boolean{
 if(!plan||typeof plan!=='object')return false;
 const inputs=Reflect.get(plan,'inputs'),base=Reflect.get(plan,'base');
 if(Array.isArray(inputs))return inputs.length>0&&inputs.every(sumLeaves);
 if(base&&typeof base==='object')return sumLeaves(base);
 return Reflect.get(plan,'operation')==='sum';
}
/** The MODEL chooses the actual predicates and their ordering. References and
 * predicates determine wording; no B05/B06 IDs, literal amount or banned-word
 * filtering occurs. Missing predicates are gaps, not host-authored defaults. */
export function authoritativeUnit(snapshot:JudgmentSnapshot,unit:ReviewableUnit){
 const m=validateAuthoritativeMeaning(unit.meaning),available=reviewedContentSources(snapshot),issues:string[]=[];
 if(m.basis.source_ids.some(id=>!available.includes(id))||!snapshot.evidence.verified_calculations.length||!snapshot.evidence.verified_calculations.every(v=>sumLeaves(Reflect.get(v as object,'execution_plan'))))issues.push('MEANING_BASIS_UNPROVEN');
 const predicates:Record<string,string>={basis:'所选资料分别汇总，独立算术核验只覆盖各自范围；尚未建立跨表归属，不能据此认证净额、盈利或原因。'};
 let strategy=unit.strategy;
 if(unit.kind==='strategy'){
  const p=unit.content?.proposal,required=['basis','proposal','risks','alternative','stops','observation'];
  if(!p||p.operation!=='attribution'||p.result!=='matching_evidence'||p.role!=='primary'||p.objects.length!==2||p.objects.some(id=>!m.basis.source_ids.includes(id)))issues.push('MEANING_ACTION_MISSING');
  if(required.some(k=>!m.presentation.includes(k as any))||!m.risks.includes('unmatched_records')||!['unproven_net','unproven_profit','unproven_cause'].every(k=>m.risks.includes(k as any))||m.alternative!=='defer_analysis'||!m.stops.includes('unmatched_records')||!m.stops.includes('new_material')||m.observation!=='traceable_matching')issues.push('MEANING_REQUIRED_CONTENT_MISSING');
  const premises=judgmentPremises(snapshot),time=premises.find(v=>v.kind==='time'&&p?.premise_ids.includes(v.id)),cost=unit.content?.quantities.find(v=>v.field==='cost');
  if(!time||!cost)issues.push('MEANING_REQUIRED_CONTENT_MISSING');
  predicates.proposal=p?`可选择由${p.owner}核对所选退款与订单归属，收集可追溯的匹配证据；实施仍须满足当前权限、工时与费用条件，不自动核对、排班或签署。`:'';
  const targets=m.risks.filter(v=>v!=='unmatched_records').map(v=>({unproven_net:'净额',unproven_profit:'盈利',unproven_cause:'原因'}[v])).join('、');
  predicates.risks=[targets?`风险是将分别汇总误认为${targets}已有依据`:'',m.risks.includes('unmatched_records')?'核对也可能无法匹配':''].filter(Boolean).join('；')+'。';
  predicates.alternative=m.alternative==='defer_analysis'?'也可仅保留当前分析并暂缓；人的选择不产生执行。':'';
  predicates.stops=m.stops.map(v=>v==='unmatched_records'?'无法匹配时停止并补证':'涉及新增资料时停止并补证').join('；')+'。';
  predicates.observation=m.observation==='traceable_matching'?'在当前给定窗口内观察核对是否完成、是否取得可追溯匹配记录；不保证收益。':'';
  strategy=p?{goal:p.statement,owner:p.owner,authority:'按当前已给核对权限',resources:'所选资料及当前给定工时',cost:cost?.statement??'费用条件尚未形成',risk:predicates.risks,alternatives:predicates.alternative,stop:predicates.stops,observe:predicates.observation}:unit.strategy;
 }else if(m.presentation.some(v=>v!=='basis')||m.risks.length||m.stops.length||m.alternative!==null||m.observation!==null)issues.push('MEANING_CONTENT_KIND_CONFLICT');
 const text=m.presentation.map(part=>predicates[part]??'').filter(Boolean).join('\n\n');
 if(!text)issues.push('MEANING_REQUIRED_CONTENT_MISSING');
 return {text,strategy,issues,explanation:predicates.basis};
}
export function qualifyAuthoritativeUnit(snapshot:JudgmentSnapshot,claim:JudgmentClaimReview,unit:ReviewableUnit){
 const projection=authoritativeUnit(snapshot,unit);
 // Existing concrete source/action/condition checks inspect original proposed
 // relations; their arbitrary wording never becomes formal output by itself.
 const original={...claim,strategy:unit.strategy},q=qualifyReviewedContent(snapshot,original,unit.text,unit.content),issues=[...q.qualification.issues,...projection.issues];
 return {...q,qualification:{...q.qualification,issues:[...new Set(issues)],selectable:q.qualification.selectable&&issues.length===0,explanation:issues.length?'尚未完整交付：业务内容、来源或条件存在缺口。':projection.explanation,alternative:projection.strategy?.alternatives??'仅保留当前分析并暂缓；不执行行动。'}};
}
