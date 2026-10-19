import {taskHash} from './member-task.ts';
import {judgmentPremises,judgmentActionMethods,judgmentDataStatement,judgmentMaterialSubjectKey,judgmentClauseView,recordAttributionAction,passiveJudgmentGoal} from './open-analysis-judgment-conditions.ts';
import type {JudgmentSnapshot,JudgmentClaimReview,JudgmentCondition,ReviewedContent} from '../ports/open-analysis-judgment-review.ts';

/** Private, unactivated JR107 content correspondence. References cannot create
 * facts: this checks only the actual host premises and current source scope.
 * Whether the prose expresses these relations remains a semantic obligation. */

function fail():never{throw Object.assign(new Error('JUDGMENT_CONTENT_INVALID'),{code:'JUDGMENT_CONTENT_INVALID'});}
function closed(x:unknown,keys:readonly string[]):Record<string,any>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==keys.length||keys.some(k=>!Object.hasOwn(x,k)))fail();return x as Record<string,any>;}
function string(x:unknown):asserts x is string{if(typeof x!=='string'||!x.trim()||x.length>3000)fail();}
function list(x:unknown):asserts x is any[]{if(!Array.isArray(x)||x.length>32)fail();}
export function validateReviewedContent(raw:unknown):ReviewedContent{
 const x=closed(raw,['materials','proposal','quantities',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'actor_links')?['actor_links']:[])]);list(x.materials);list(x.quantities);
 if(x.actor_links!==undefined){list(x.actor_links);const seen=new Set<string>();for(const value of x.actor_links){const a=closed(value,['premise_id','premise_source_id','premise_owner','actor_source_id','actor_quote','scope_sha256','revision']);for(const v of Object.values(a))string(v);if(seen.has(a.premise_id))fail();seen.add(a.premise_id);}}
 for(const value of x.materials){const m=closed(value,['statement','premise_id','source_id','subject','state','scope_sha256','role']);for(const v of Object.values(m))string(v);if(!['met','unmet','unknown'].includes(m.state)||!['statement','prerequisite'].includes(m.role))fail();}
 if(x.proposal!==null){const p=closed(x.proposal,['statement','operation','owner','objects','result','role','premise_ids']);for(const key of ['statement','operation','owner','result','role'])string(p[key]);for(const key of ['objects','premise_ids']){list(p[key]);for(const v of p[key])string(v);if(new Set(p[key]).size!==p[key].length)fail();}if(!['attribution','analysis','passive'].includes(p.operation)||!['matching_evidence','analysis','retained_analysis'].includes(p.result)||!['primary','alternative'].includes(p.role))fail();}
 for(const value of x.quantities){const q=closed(value,['field','statement','use','value','unit','owner','premise_id','source_id','scope_sha256']);for(const v of Object.values(q))string(v);if(q.field!=='cost'||!['ceiling','requirement','spent'].includes(q.use)||!/^\d+(?:\.\d+)?$/.test(q.value))fail();}
 return structuredClone(x) as ReviewedContent;
}
/** All comparisons are to current immutable host inputs. No canonical body,
 * method-label allowance, fixed amount, new user fact or inferred action. */
export function qualifyReviewedContent(snapshot:JudgmentSnapshot,claim:JudgmentClaimReview,text:string,raw:unknown){
 const content=validateReviewedContent(raw),premises=judgmentPremises(snapshot),issues:string[]=[],conditions:JudgmentCondition[]=[],capacity_refs:string[]=[];
 const add=(id:string)=>{const p=premises.find(p=>p.id===id);if(!p||p.mapping!=='recognized'){issues.push('CONTENT_PREMISE_UNPROVEN');return;}if(!conditions.some(c=>c.id===p.id))conditions.push({id:p.id,text:p.text,source_quote:p.source_quote,state:p.state});};
 for(const m of content.materials){const p=premises.find(p=>p.id===m.premise_id);const actual=judgmentDataStatement(m.statement.replace(/[。.]$/,''));if(!actual||judgmentMaterialSubjectKey(actual.subject)!==judgmentMaterialSubjectKey(m.subject)||actual.state!==m.state||!text.includes(m.statement)||!p||p.kind!=='data'||p.mapping!=='recognized'||m.source_id!==p.source_id||m.subject!==p.subject||m.scope_sha256!==snapshot.identity.scope_sha256||m.state!==p.state)issues.push('CONTENT_MATERIAL_CONFLICT');else{capacity_refs.push(m.source_id);if(m.role==='prerequisite')add(p.id);}}
 for(const clause of judgmentClauseView(text)){const actual=judgmentDataStatement(clause);if(actual&&!content.materials.some(m=>judgmentMaterialSubjectKey(m.subject)===judgmentMaterialSubjectKey(actual.subject)&&m.state===actual.state))issues.push('CONTENT_MATERIAL_CONFLICT');}
 if(claim.kind==='conclusion'&&content.proposal!==null||claim.kind==='strategy'&&content.proposal===null)issues.push('CONTENT_ACTION_UNPROVEN');
 const p=content.proposal;
 if(p){
  const source_ids=reviewedContentSources(snapshot);
  if(!text.includes(p.statement)||claim.strategy?.goal!==p.statement||p.objects.some(id=>!source_ids.includes(id))||!p.objects.length||p.operation==='attribution'&&(p.result!=='matching_evidence'||p.objects.length!==2)||p.operation==='analysis'&&p.result!=='analysis'||p.operation==='passive'&&p.result!=='retained_analysis')issues.push('CONTENT_ACTION_UNPROVEN');
  const actualOperation=recordAttributionAction(p.statement)?'attribution':passiveJudgmentGoal.test(p.statement)?'passive':judgmentActionMethods(p.statement,true,true).includes('analysis')?'analysis':null;
  if(actualOperation!==p.operation)issues.push('CONTENT_ACTION_UNPROVEN');
  const requested=judgmentActionMethods(snapshot.followup_question??snapshot.question,true,true);
  if(p.role==='primary'&&requested.includes('attribution')&&p.operation!=='attribution')issues.push('CONTENT_PRIMARY_MISSING');
  for(const id of p.premise_ids)add(id);
  if(p.operation!=='passive')for(const kind of ['authority','time','cost']){const premise=premises.find(v=>v.kind===kind);if(!premise||!p.premise_ids.includes(premise.id))issues.push('CONTENT_PREMISE_UNPROVEN');}
  if(p.operation!=='passive'&&premises.some(v=>['authority','time'].includes(v.kind)&&v.owner!==p.owner)||p.owner!==claim.strategy?.owner)issues.push('CONTENT_OWNER_CONFLICT');
 }
 const fraction=(s:string)=>{const [a,b='']=s.split('.');return {value:BigInt(a!+b),scale:10n**BigInt(b.length)};};
 for(const q of content.quantities){
  const premise=premises.find(v=>v.id===q.premise_id),cost=claim.strategy?.cost,declared=reviewedCostCeiling(q.statement);
  if(!declared||declared.value!==q.value||declared.unit!==q.unit||q.use!=='ceiling'||q.statement!==cost||!premise||premise.kind!=='cost'||premise.mapping!=='recognized'||!premise.cost_limit||q.source_id!==premise.cost_source_id||q.scope_sha256!==snapshot.identity.scope_sha256||q.unit!=='元'||p&&q.owner!==p.owner)issues.push('CONTENT_QUANTITY_UNPROVEN');
  else{const a=fraction(q.value),b=fraction(premise.cost_limit);if(a.value*b.scale>b.value*a.scale)issues.push('CONTENT_QUANTITY_UNPROVEN');capacity_refs.push(q.source_id);}
 }
 if(claim.strategy&&/[0-9]/.test(claim.strategy.cost)&&!content.quantities.length)issues.push('CONTENT_QUANTITY_UNPROVEN');
 for(const c of claim.conditions){const actual=premises.find(p=>p.id===c.id);if(!actual||taskHash({text:actual.text,source_quote:actual.source_quote,state:actual.state})!==taskHash({text:c.text,source_quote:c.source_quote,state:c.state}))issues.push('CONTENT_PREMISE_UNPROVEN');}
 const eligible=issues.length===0&&['supported','conditional'].includes(claim.verdict),selectable=claim.kind==='strategy'&&eligible&&(p?.operation==='passive'||conditions.length>0&&conditions.every(c=>c.state==='met'));
 return {conditions,qualification:{version:'1.0' as const,selectable,issues:[...new Set(issues)],explanation:issues.length?'当前内容与同版来源、行动或资源关系不一致，未取得资格。':null,alternative:claim.strategy?.alternatives??'仅保留已有分析并暂缓；不执行行动。',capacity_refs:[...new Set(capacity_refs)],premise_ids:conditions.map(c=>c.id),submitted_conditions:claim.conditions}};
}

/** Source identity comes from actual bound computations, including earlier
 * independently checked steps, never only the last step's Context metadata. */
export function reviewedContentSources(snapshot:JudgmentSnapshot){
 const ids=new Set<string>();
 const visit=(plan:unknown)=>{if(!plan||typeof plan!=='object')return;const inputs=Reflect.get(plan,'inputs'),base=Reflect.get(plan,'base');
  if(Array.isArray(inputs)&&inputs.length){for(const input of inputs)visit(input);return;}
  if(base&&typeof base==='object'){visit(base);return;}
  const id=Reflect.get(plan,'source_id');if(typeof id==='string')ids.add(id);
 };
 for(const raw of snapshot.evidence.verified_calculations)if(raw&&typeof raw==='object')visit(Reflect.get(raw,'execution_plan'));
 return [...ids];
}
/** Existing bounded USER ceiling syntax and existing symbolic annotation.
 * No body equality, default amount or currency conversion. Other numerical
 * uses remain unproven; a declared ceiling label cannot turn spending into one. */
export function reviewedCostCeiling(statement:string){
 const literal=statement.match(/^费用不超过(\d+(?:\.\d+)?)元$/),annotation=statement.match(/^沿用已给条件（≤(\d+(?:\.\d+)?)[ \t]*元）$/);
 const value=literal?.[1]??annotation?.[1];return value?{value,unit:'元',use:'ceiling' as const}:null;
}
