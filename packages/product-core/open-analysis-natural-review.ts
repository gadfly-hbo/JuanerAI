import {membershipRecord as closed} from './member-analysis.ts';
import {hashFiniteJson} from './member-task.ts';
import {judgmentPremises} from './open-analysis-judgment-conditions.ts';
import {validateReviewedContent} from './open-analysis-reviewed-content.ts';
import type {JudgmentSnapshot,JudgmentClaimReview,JudgmentRound} from '../ports/open-analysis-judgment-review.ts';

// JR109: finite host invariants. Language correspondence and usefulness are
// model judgments, never consequences of these references or a method label.
function fail(code='JUDGMENT_DOCUMENT_INVALID'):never{throw Object.assign(new Error(code),{code});}
const string=(v:unknown):string=>{if(typeof v!=='string'||!v.trim()||v.length>3000)fail();return v as string;};
const strings=(v:unknown):string[]=>{if(!Array.isArray(v)||v.length>32)fail();return (v as unknown[]).map(string);};
export function naturalRequirements(s:JudgmentSnapshot){
 const statements=[{origin:'current_question',text:s.followup_question??s.question},
  ...(s.context.business_context?.business?.deliverables??[]).map(text=>({origin:'framework_deliverable',text}))];
 return statements.map((v,i)=>({id:'R'+(i+1),...v}));
}
export const naturalReviewSystem='你是独立审查者。仅可读取已批准资源，不得写报告、执行新计算或业务行动。逐条审阅本次完整自然业务内容，包括正文、策略九字段、来源和当前需求。识别错误、遗漏、附加行动、条件前提混淆及错误数值用途；保留正确有限观察与完整有据可选建议。方法名、结构标签、形成者与另一Agent同意均不证明语义。逐项需求给实际当前claim引用与fulfilled/incomplete判断，不能只说complete。人的选择不改变条件，不执行业务行动。只返回本次JSON合同；不生成新的提案文字。';
export function naturalReviewPrompt(s:JudgmentSnapshot){
 if(!['1.3','1.4'].includes(s.document?.version??''))fail();
 return 'JuanerAI.conclusion-strategy-review.v1\n'+JSON.stringify({
  guarantee_boundary:'C007-GB-20261017-v0.1; host H and model semantic Q remain distinct',
  snapshot_sha256:hashFiniteJson(s),requirements:naturalRequirements(s),
  source_draft:{text:s.document!.draft,authority:'MODEL source only; not qualified delivery'},
  current_proposal:{units:s.document!.units.map((u,i)=>({id:s.claims[i]!.id,...u}))},
  condition_witnesses:judgmentPremises(s,s.document?.version!=='1.4'),
  snapshot:{identity:s.identity,claims:s.claims,context:s.context,evidence:s.evidence,report:s.report,unavailable:s.unavailable},
  current_user_input:{condition_source_catalog:s.condition_source_catalog??[],question:s.question,current_followup:s.followup_question,history:s.question_history,answers:s.condition_inputs},
  output_contract:{version:'1.2',snapshot_sha256:hashFiniteJson(s),completeness:{verdict:'complete|incomplete',reason:'审查覆盖说明'},
   requirement_coverage:'每个requirements.id一行：requirement_id,claim_ids(实际当前ID),verdict(fulfilled|incomplete)。缺项不能由来源原稿补齐。',
   claims:'每个当前ID恰好一行，完整claim_id,kind(conclusion|strategy),level(observation|hypothesis),verdict(supported|conditional|insufficient|conflict),evidence_refs,counterevidence,reason,limitations,conditions,strategy；strategy逐字等于该受审单元字段。conditions只引用当前宿主见证id/text/source_quote/state。正文与所有字段都实际审阅。若单元content.actor_links存在，另给actor_correspondence数组，每个premise_id恰好一行verdict:same/different/unknown，独立判断原始USER前后句是否指向同一主体，不因提案自报/引用/称谓而认证。'}
 });
}

export function naturalRevisionPrompt(s:JudgmentSnapshot,round:JudgmentRound){
 return 'JuanerAI.review-revision.v1\n'+JSON.stringify({
  output_contract:'reviewable-revision/1.1',version:'1.1',snapshot_sha256:hashFiniteJson(s),
  requirements:naturalRequirements(s),source_draft:{text:s.document!.draft,authority:'MODEL source only'},
  current_proposal:{units:s.document!.units.map((u,i)=>({id:s.claims[i]!.id,...u}))},
  initial_review:round,condition_witnesses:judgmentPremises(s,s.document?.version!=='1.4'),
  current_evidence:{identity:s.identity,context:s.context,evidence:s.evidence,report:s.report,unavailable:s.unavailable},
  contract:'仅一次合并修订；根version,snapshot_sha256,changes，每项claim_id,unit；unit完整含kind,text,fact_refs,source_refs,method,strategy,content。保留原kind和原引用；只在已审范围纠正正文和字段/来源关系，补全有用解释、完整建议及必要条件，不使用宿主固定句库。不能修改真实计算/权限，无法有据修改则changes为空。对应重审消费这版全部字段。'
 });
}

/** Formal business words come only from the exact reviewed producer object.
 * The reviewer's newly written rationale stays in the immutable review record. */
export function naturalDelivery(s:JudgmentSnapshot,round:JudgmentRound|null,state:string){
 const lines=[s.facts_text,'','## 结论与建议审查','','基于当前证据的模型审查判断，不代表全面认证。'];
 if(state!=='completed'||!round){lines.push('本版审查尚未完成；保留有效事实，解释与建议尚未取得本版资格。');return lines.join('\n');}
 for(const [i,u] of s.document!.units.entries()){
  const c=round.claims.find(v=>v.claim_id===s.claims[i]!.id);if(!c)fail('JUDGMENT_IDENTITY_CONFLICT');
  const permitted=['supported','conditional'].includes(c.verdict)&&!c.qualification?.issues.length&&s.claims[i]!.numeric_eligible;
  lines.push('',`### ${{supported:'有支持',conditional:s.document?.version==='1.4'?'有条件支持':'有条件',insufficient:'证据不足',conflict:'存在冲突'}[c.verdict]}${c.kind==='strategy'?(c.qualification?.selectable?' · 可选择的建议':' · 当前不可采用'):''}`);
  if(permitted){lines.push(u.text);if(u.strategy)for(const [key,label] of Object.entries({goal:'目标',owner:'主体',authority:'权限',resources:'资源',cost:'成本',risk:'风险',alternatives:'替代选项',stop:'停止条件',observe:'观察方式'}))lines.push(label+'：'+Reflect.get(u.strategy,key));}
  else lines.push('本条存在未解决问题，不作为当前正式内容；原稿和实际审查记录保留。');
  for(const v of c.conditions)lines.push('用户条件来源（非独立事实认证）：'+v.source_quote+'；状态：'+v.state);
 }
 if(round.completeness?.verdict!=='complete')lines.push('','尚未完整交付：必要内容或条件未闭合，受影响建议不可选择；有效事实和观察保留。');
 if(s.report.status==='partial')lines.push('','数字检查仍为partial；本次文字审查不修复数字缺口。');
 return lines.join('\n');
}

export function naturalQualification(s:JudgmentSnapshot,c:JudgmentClaimReview,index:number){
 const u=s.document!.units[index]!,content=validateReviewedContent(u.content),premises=judgmentPremises(s,s.document?.version!=='1.4'),issues:string[]=[],conditions:JudgmentClaimReview['conditions'][number][]=[],sourceIds=s.context.source_catalog.map(s=>s.source_id);
 const use=(id:string)=>{const p=premises.find(v=>v.id===id);if(!p||p.mapping!=='recognized'){issues.push('CONTENT_PREMISE_UNPROVEN');return;}
  if(!conditions.some(v=>v.id===id))conditions.push({id,text:p.text,source_quote:p.source_quote,state:p.state});};
 for(const m of content.materials){const p=premises.find(v=>v.id===m.premise_id);
  if(!p||p.kind!=='data'||p.mapping!=='recognized'||m.state!==p.state||m.source_id!==p.source_id||m.subject!==p.subject||m.scope_sha256!==s.identity.scope_sha256)issues.push('CONTENT_MATERIAL_CONFLICT');
  if(m.role==='prerequisite')use(m.premise_id);
 }
 const p=content.proposal;
 if(c.kind==='strategy'?!p:p!==null)issues.push('CONTENT_ACTION_UNPROVEN');
 if(p){
  if(p.statement!==u.strategy?.goal||p.owner!==u.strategy.owner||!p.objects.length||p.objects.some(v=>!sourceIds.includes(v)))issues.push('CONTENT_ACTION_UNPROVEN');
  for(const id of p.premise_ids)use(id);
  if(p.operation!=='passive')for(const kind of ['authority','time','cost']){
   const v=premises.find(v=>v.kind===kind);if(!v||!p.premise_ids.includes(v.id))issues.push('CONTENT_PREMISE_UNPROVEN');
   if(v&&['authority','time'].includes(kind)&&(s.document?.version==='1.4'||v.owner!==p.owner||content.actor_links?.some(a=>a.premise_id===v.id))){
    if(s.document?.version==='1.3'){issues.push('CONTENT_OWNER_CONFLICT');continue;}
    const link=content.actor_links?.find(a=>a.premise_id===v.id),catalog=s.condition_source_catalog??[],antecedent=catalog.find(a=>a.id===link?.actor_source_id),decision=c.actor_correspondence?.find(a=>a.premise_id===v.id);
    // A model back-reference is an interpretation, not a grant. The host
    // checks real current USER pointers and the independent review's decision.
    if(!link||!decision||decision.verdict==='unknown')issues.push('CONTENT_OWNER_UNKNOWN');
    else if(link.premise_source_id!==v.source_id||link.premise_owner!==v.owner||link.scope_sha256!==s.identity.scope_sha256||link.revision!==s.identity.revision||!antecedent||!antecedent.text.includes(link.actor_quote)||!v.source_quote.includes(v.owner)||decision.verdict==='different')issues.push('CONTENT_OWNER_CONFLICT');
   }
  }
 }
 const fraction=(s:string)=>{const [a,b='']=s.split('.');return {n:BigInt(a!+b),d:10n**BigInt(b.length)};};
 for(const q of content.quantities){const p=premises.find(v=>v.id===q.premise_id);
  const amounts=q.statement.match(/\d+(?:\.\d+)?/g)??[];
  if(!p||p.kind!=='cost'||p.mapping!=='recognized'||!p.cost_limit||q.use!=='ceiling'||q.source_id!==p.cost_source_id||q.scope_sha256!==s.identity.scope_sha256||q.unit!=='元'||q.statement!==u.strategy?.cost||q.owner!==u.strategy.owner||amounts.length!==1||fraction(amounts[0]!).n*fraction(q.value).d!==fraction(q.value).n*fraction(amounts[0]!).d)issues.push('CONTENT_QUANTITY_UNPROVEN');
  else{const a=fraction(q.value),b=fraction(p.cost_limit);if(a.n*b.d>b.n*a.d)issues.push('CONTENT_QUANTITY_UNPROVEN');}
 }
 if(u.strategy&&/[0-9]/.test(u.strategy.cost)&&!content.quantities.length)issues.push('CONTENT_QUANTITY_UNPROVEN');
 for(const v of c.conditions){const p=premises.find(p=>p.id===v.id);if(!p||hashFiniteJson({text:p.text,source_quote:p.source_quote,state:p.state})!==hashFiniteJson(vWithoutId(v)))issues.push('CONTENT_PREMISE_UNPROVEN');else use(p.id);}
 const eligible=!issues.length&&['supported','conditional'].includes(c.verdict),selectable=c.kind==='strategy'&&eligible&&(p?.operation==='passive'||conditions.length>0&&conditions.every(v=>v.state==='met'));
 return {conditions,qualification:{version:'1.0' as const,selectable,issues:[...new Set(issues)],explanation:issues.includes('CONTENT_OWNER_UNKNOWN')?'主体与本版条件的对应尚未证明，受影响建议待对应核对。':issues.length?'当前内容与已知来源或条件冲突，受影响建议不可采用。':null,alternative:c.strategy?.alternatives??'',capacity_refs:[...new Set(content.materials.map(v=>v.source_id))],premise_ids:conditions.map(v=>v.id),submitted_conditions:c.conditions}};
}
function vWithoutId(v:JudgmentClaimReview['conditions'][number]){return {text:v.text,source_quote:v.source_quote,state:v.state};}

export function compileNaturalRound(raw:string,s:JudgmentSnapshot,phase:JudgmentRound['phase']):JudgmentRound{
 let value:unknown;try{value=JSON.parse(raw);}catch{fail();}
 const x=closed(value,['version','snapshot_sha256','completeness','requirement_coverage','claims']);
 if(x.version!=='1.2'||x.snapshot_sha256!==hashFiniteJson(s)||!Array.isArray(x.claims)||x.claims.length!==s.claims.length)fail('JUDGMENT_IDENTITY_CONFLICT');
 const cc=closed(x.completeness,['verdict','reason']);if(!['complete','incomplete'].includes(String(cc.verdict)))fail();string(cc.reason);
 const seen=new Set<string>(),allowed=new Set([...s.report.values.filter(v=>v.status==='verified').map(v=>v.id),'Q',...(s.condition_source_catalog??[]).map(v=>v.id)]);
 const claims=x.claims.map((raw:unknown)=>{
  const c=closed(raw,['claim_id','kind','level','verdict','evidence_refs','counterevidence','reason','limitations','conditions','strategy',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'actor_correspondence')?['actor_correspondence']:[])]),id=string(c.claim_id),index=s.claims.findIndex(v=>v.id===id),unit=s.document!.units[index];
  if(index<0||seen.has(id))fail('JUDGMENT_IDENTITY_CONFLICT');seen.add(id);
  if(!unit||c.kind!==(unit.kind==='strategy'?'strategy':'conclusion')||c.level!==(unit.kind==='strategy'?'hypothesis':'observation')||!['supported','conditional','insufficient','conflict'].includes(String(c.verdict))||hashFiniteJson(c.strategy)!==hashFiniteJson(unit.strategy))fail();
  const refs=strings(c.evidence_refs);if(refs.some(r=>!allowed.has(r)||![...unit.fact_refs,...unit.source_refs].includes(r))||unit.fact_refs.some(r=>!refs.includes(r))&&(s.document?.version==='1.3'||['supported','conditional'].includes(String(c.verdict))))fail('JUDGMENT_EVIDENCE_INVALID');
  if(!Array.isArray(c.conditions)||c.conditions.length>16)fail();
  const conditions=c.conditions.map(raw=>{const v=closed(raw,['id','text','source_quote','state']);return {id:string(v.id),text:string(v.text),source_quote:string(v.source_quote),state:string(v.state) as 'met'};});
  let actor_correspondence:JudgmentClaimReview['actor_correspondence'];
  if(c.actor_correspondence!==undefined){if(!Array.isArray(c.actor_correspondence))fail();const seenLinks=new Set<string>();actor_correspondence=c.actor_correspondence.map(raw=>{const a=closed(raw,['premise_id','verdict']),id=string(a.premise_id);if(seenLinks.has(id)||!unit.content?.actor_links?.some(l=>l.premise_id===id)||!['same','different','unknown'].includes(String(a.verdict)))fail('JUDGMENT_IDENTITY_CONFLICT');seenLinks.add(id);return {premise_id:id,verdict:a.verdict as 'same'};});}
  const row={...(actor_correspondence?{actor_correspondence}:{}),claim_id:id,kind:c.kind,level:c.level,verdict:c.verdict,evidence_refs:refs,counterevidence:strings(c.counterevidence),reason:string(c.reason),limitations:strings(c.limitations),conditions,strategy:c.strategy} as JudgmentClaimReview;
  const q=naturalQualification(s,row,index),verdict=q.qualification.issues.length||!s.claims[index]!.numeric_eligible?'insufficient':row.verdict==='insufficient'||row.verdict==='conflict'?row.verdict:q.conditions.some(v=>v.state==='unmet')?'conflict':q.conditions.some(v=>v.state==='unknown')?'conditional':row.verdict;
  return {...row,...q,verdict,qualification:{...q.qualification,selectable:q.qualification.selectable&&['supported','conditional'].includes(verdict)}};
 });
 const requirements=naturalRequirements(s),covered=new Set<string>();if(!Array.isArray(x.requirement_coverage)||x.requirement_coverage.length!==requirements.length)fail('JUDGMENT_CONTENT_INCOMPLETE');
 const coverage=x.requirement_coverage.map(raw=>{const v=closed(raw,['requirement_id','claim_ids','verdict']),id=string(v.requirement_id),ids=strings(v.claim_ids);if(!requirements.some(r=>r.id===id)||covered.has(id)||!['fulfilled','incomplete'].includes(String(v.verdict))||ids.some(id=>!seen.has(id))||v.verdict==='fulfilled'&&!ids.length)fail('JUDGMENT_CONTENT_INCOMPLETE');covered.add(id);return {requirement_id:id,claim_ids:ids,verdict:v.verdict as 'fulfilled'|'incomplete'};});
 const complete=cc.verdict==='complete'&&coverage.every(v=>v.verdict==='fulfilled'&&v.claim_ids.every(id=>['supported','conditional'].includes(claims.find(c=>c.claim_id===id)!.verdict)));
 if(!complete)for(const c of claims)if(c.kind==='strategy')c.qualification.selectable=false;
 return {phase,snapshot_sha256:hashFiniteJson(s),claims,completeness:{verdict:complete?'complete':'incomplete',reason:string(cc.reason)},requirement_coverage:coverage};
}
