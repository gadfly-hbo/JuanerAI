import {readJudgmentOptionUnit} from './open-analysis-option-unit.ts';
import {hashFiniteJson} from './member-task.ts';
import type {JudgmentSnapshot,JudgmentCondition,JudgmentClaimReview} from '../ports/open-analysis-judgment-review.ts';

type Kind='data'|'time'|'cost'|'authority';
type State=JudgmentCondition['state'];
export type JudgmentPremise=Readonly<{id:string;kind:Kind;state:State;text:string;source_quote:string;source_id:string;owner:string;subject?:string;window?:string;window_source_id?:string;window_supported?:boolean;cost_limit?:string;cost_source_id?:string;mapping:'recognized'|'unproven'}>;
/** Optional subject particle within the already supported period grammar.
 * Period identity and material wording remain distinct; USER priority and
 * contradiction handling operate on this same key only for new snapshots. */
export function judgmentMaterialSubjectKey(value:string){return value.replace(/^(该期间|新期间|本期|上期|原范围)的/,'$1');}
/** One supported material-subject grammar for prose and generation views. */
export function judgmentSupportedMaterialSubject(value:string){return /^(?:该期间|新期间|本期|上期|原范围)(?:订单与退款)?资料$/.test(judgmentMaterialSubjectKey(value));}
/** Literal syntax only: this does not establish a material state. USER
 * witnesses and MODEL absence assertions are compared, never interchanged. */
export function judgmentDataStatement(part:string):{state:State;subject:string}|null{
 let m:RegExpMatchArray|null;
 if((m=part.match(/^(?:尚未|还未|未|没有)(?:导入|提供|取得)([^，,；;。]{1,45}(?:资料|数据))$/))||
    (m=part.match(/^([^，,；;。]{0,40}(?:资料|数据))(?:尚未|还未|未)(?:导入|提供|到位)$/)))return {state:'unmet',subject:m[1]!};
 if((m=part.match(/^([^，,；;。]{0,40}(?:资料|数据))(?:已|已经)(?:导入|提供|到位)$/))&&!/(?:并非|不是|没有|尚未|是否|能否)/.test(m[1]!))return {state:'met',subject:m[1]!};
 if((m=part.match(/^([^，,；;。]{0,40}(?:资料|数据))(?:是否(?:已经)?导入|能否提供|是否到位)(?:尚未确认|未知|不确定)?[？?]?$/)))return {state:'unknown',subject:m[1]!};
 return null;
}
/** This is a bounded USER-statement grammar, not an NLP truth oracle. Whole
 * predicates, polarity and clause scope must match; model prose is never input. */
export function judgmentPremises(snapshot:JudgmentSnapshot,legacyAliases=snapshot.document?.version!=='1.4'):readonly JudgmentPremise[]{
 const validOwner=(value:string)=>/^[A-Za-z0-9\u4e00-\u9fff]{0,16}负责人$/.test(value)&&!/(?:不是|并非|没有|不能|是否|能否|无法|不|未|若)/.test(value);
 const zeroHours=(value:string)=>/安排(?:这)?0+小时/.test(value);
 const catalog=snapshot.condition_source_catalog??[],rank={history:0,question:1,answer:2,followup:3,expression:4};
 const aliasRows=(legacyAliases?catalog:[]).flatMap(s=>/[“”\"「」]/.test(s.text)?[]:s.text.split(/[，,]/).flatMap(v=>{const owner=v.match(/^合成负责人是(.+负责人)$/)?.[1];return owner?[{owner,rank:rank[s.origin]}]:[];})),aliasRank=Math.max(-1,...aliasRows.map(v=>v.rank)),aliases=[...new Set(aliasRows.filter(v=>v.rank===aliasRank).map(v=>v.owner))];
 const selected=new Map<string,{premise:JudgmentPremise;rank:number;ambiguous:boolean}>();
 let statement='';
 const put=(kind:Kind,state:State,source:typeof catalog[number],owner='负责人',mapping:'recognized'|'unproven'='recognized',subject?:string)=>{
  if(owner==='负责人'&&aliases.length>1){mapping='unproven';state='unknown';}
  owner=owner==='负责人'&&aliases.length===1?aliases[0]!:owner;
  const key=kind==='data'?'data:'+(['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)?judgmentMaterialSubjectKey(subject??'*'):subject??'*'):kind,priority=rank[source.origin],old=selected.get(key),id='P-'+hashFiniteJson({identity:snapshot.identity,kind,owner,source_quote:source.text,...(kind==='data'?{subject:subject??'*',scope:snapshot.user_expression?snapshot.claims.map(c=>c.text):snapshot.followup_question??snapshot.question}:{})}).slice(0,20);
  // Availability-only updates do not revoke a separately stated window. Carry
  // only this actor's actual earlier USER window, with its own source pointer.
  const inherited=old?.premise.owner===owner&&old.premise.mapping==='recognized'?old.premise:undefined;
  const priorWindow=kind==='time'&&inherited?.window_supported?inherited:undefined,declaredWindow=kind==='time'&&mapping==='recognized'?statement.match(/未来([\d一二两三四五六七八九十]+)天/)?.[1]:undefined,window=declaredWindow??priorWindow?.window;
  const windowSupported=!!window&&state!=='unmet'&&(state==='met'&&!!declaredWindow||!!priorWindow&&(!declaredWindow||declaredWindow===priorWindow.window)),windowSource=declaredWindow&&(state==='met'||!windowSupported)?source.id:priorWindow?.window_source_id;
  const declaredCost=kind==='cost'&&mapping==='recognized'?statement.match(/^费用不超过(\d+(?:\.\d+)?)元$/)?.[1]:undefined,costLimit=declaredCost??(kind==='cost'?inherited?.cost_limit:undefined),costSource=declaredCost?source.id:inherited?.cost_source_id;
  const premise={id,kind,state,text:statement||source.text,source_quote:source.text,source_id:source.id,owner,mapping,...(subject?{subject}:{}),...(window?{window,window_source_id:windowSource,window_supported:windowSupported}:{}),...(costLimit?{cost_limit:costLimit,cost_source_id:costSource}:{})};
  if(!old||priority>old.rank)selected.set(key,{premise,rank:priority,ambiguous:false});
  else if(priority===old.rank){
   // Do not collapse different people or simultaneous contradictory statements.
   const quantity=(value:string)=>kind==='time'?value.match(/\d+小时/)?.[0]:kind==='cost'?value.match(/\d+(?:\.\d+)?元/)?.[0]:undefined;
   const a=quantity(old.premise.text),b=quantity(premise.text);
   const ambiguous=old.ambiguous||old.premise.state!==state||old.premise.owner!==owner||!!a&&!!b&&a!==b||!!old.premise.window&&!!declaredWindow&&old.premise.window!==declaredWindow;
   selected.set(key,{premise:ambiguous?{...premise,state:'unknown',mapping:'unproven'}:premise,rank:priority,ambiguous});
  }
 };
 for(const source of [...catalog].sort((a,b)=>rank[a.origin]-rank[b.origin])){
  const raw=source.text;
  // Quoted/conditional/reported statements are not actual resource assertions.
  if(/[“”「」『』"‘’]/.test(raw)||/^(?:如果|假如|假设|倘若|若|据说|听说|模型说|他说|她说)/.test(raw))continue;
  const qualifiedOnly=/(?:如果|除非|假设|前提是|倘若)/.test(raw)||/[（(][^）)]*(?:尚未确认|未知|不确定|能否|是否)[^）)]*[）)]/.test(raw);
  const affirmedAll=raw.split(/[，,（()）]/).some(value=>/^(?:资源均满足|均明确满足|资源\/权限条件均明确满足)$/.test(value.trim()));
  const mentioned=new Set<Kind>(),parsed=new Set<Kind>(),unresolved=new Set<Kind>();
  const plain=raw.replace(/[（(][^）)]*[）)]/g,'');
  // Split conjunctions only at explicit predicate boundaries; keep the source
  // quote intact for provenance. Parenthetical examples cannot supply evidence.
  const parts=plain.split(/[，,]|且(?=费用|预算)/).map(s=>s.replace(/^(?:但|而|现在|目前)/,'').trim());
  let owner='负责人';
  for(const part of parts){
   statement=part;
   const partKinds=new Set<Kind>(),mention=(kind:Kind)=>{mentioned.add(kind);partKinds.add(kind);};
   if(/^(?:只|仅)?(?:追问|询问|不重复追问|无需再问|不要再问|不再问)/.test(part))continue;
   if(/(?:选择|决定|愿意|打算|希望|想要|仅是[^，,；;。]*候选|例如)/.test(part))continue;
   if(/(?:工时|小时|安排)/.test(part))mention('time');
   if(/(?:费用|预算)/.test(part))mention('cost');
   if(/(?:资料|数据).*(?:导入|提供|到位)|(?:导入|提供).*(?:资料|数据)/.test(part))mention('data');
   if(/(?:没有|未获|无|有|拥有|能否|是否).*(?:权限|授权)|核对权限(?:尚未确认|未知)/.test(part))mention('authority');
   if(qualifiedOnly){for(const kind of partKinds)unresolved.add(kind);continue;}
   const before=new Map([...selected].map(([k,v])=>[k,v.premise]));
   let m:RegExpMatchArray|null;
   if((m=part.match(/^合成负责人是(.+负责人)$/)))owner=m[1]!;
   const data=judgmentDataStatement(part);if(data)put('data',data.state,source,'负责人','recognized',data.subject);

   // Explicit authority declarations, including a relative clause in a proposal:
   // the proposal is not chosen, but its independently stated USER authority is
   // still usable. Negated or hypothetical acquisition does not match.
   if(/^核对权限(?:尚未确认|未知)$/.test(part))put('authority','unknown',source,owner);
   else if((m=part.match(/^(.*?)在本[^，,；;。]*样例拥有核对权限$/))&&validOwner(m[1]||owner)){owner=m[1]||owner;put('authority','met',source,owner);}
   else if((m=part.match(/^(.*?)(?:明确)?有权限核对(?:所选|本[^，,；;。]*样例|这些合成)[^，,；;。]+$/))&&validOwner(m[1]||owner)){owner=m[1]||owner;put('authority','met',source,owner);}
   else if((m=part.match(/^(.*?)(?:没有|无|未获)(?:核对权限|权限核对[^，,；;。]+)$/))&&validOwner(m[1]||owner)){owner=m[1]||owner;put('authority','unmet',source,owner);}
   else if((m=part.match(/^可考虑由已获本[^，,；;。]*样例核对权限的(.+?负责人)核对[^，,；;。]+$/))){owner=m[1]!;put('authority','met',source,owner);}

   const time=part.match(/^(.*?)(能否|是否能|不能|无法|能够|可|能)(?:在)?((?:未来[\d一二两三四五六七八九十]+天)?安排(?:(?:这)?[\d一二两三四五六七八九十]+小时|工时))(尚未确认|现改为未知|仍未知|未知|[？?])?$/);
   if(time&&validOwner(time[1]||owner)){owner=time[1]||owner;const unparsed=/[一二两三四五六七八九十]+小时/.test(time[3]!),state:State=unparsed||time[4]||['能否','是否能'].includes(time[2]!)?'unknown':['不能','无法'].includes(time[2]!)||zeroHours(time[3]!)?'unmet':'met';put('time',state,source,owner,unparsed?'unproven':'recognized');}
   if(/^(?:费用|预算)(?:可满足|能满足|已满足)$/.test(part))put('cost','met',source);
   else if(/^(?:费用|预算)(?:不能满足|无法满足|不足)$/.test(part))put('cost','unmet',source);
   else if(/^(?:费用|预算)(?:是否可满足|尚未确认|未知)[？?]?$/.test(part))put('cost','unknown',source);
   else if(/^费用不超过\d+(?:\.\d+)?元$/.test(part)&&affirmedAll)put('cost','met',source);
   const changed=new Set<Kind>();for(const [key,v] of selected)if(before.get(key)!==v.premise){parsed.add(v.premise.kind);changed.add(v.premise.kind);}
   for(const kind of partKinds)if(!changed.has(kind))unresolved.add(kind);
  }
  statement='';
  for(const kind of mentioned)if(!parsed.has(kind)||unresolved.has(kind))put(kind,'unknown',source,owner,'unproven');
 }
 // A typed direct answer is already bound by the actual condition command. A
 // MODEL opinion/initial verdict must never be injected here as an answer.
 for(const input of snapshot.condition_inputs??[]){
  const found=[...selected.values()].find(v=>v.premise.id===input.condition.id||(v.premise.source_quote===input.condition.source_quote&&((v.premise.kind==='time'&&/^负责人(?:能否|是否能|可否)(?:在未来[\d一二两三四五六七八九十]+天)?安排(?:这?[\d一二两三四五六七八九十]+小时|工时)[？?]?$/.test(input.condition.text))||(v.premise.kind==='authority'&&/^能否在获准范围核对(?:订单|所选记录)[？?]?$/.test(input.condition.text)))));
  if(found&&(input.scope!=='known'||found.rank<rank.expression)){const key=[...selected].find(([,value])=>value===found)![0],state=found.premise.kind==='time'&&input.condition.state==='met'&&(zeroHours(found.premise.text)||zeroHours(input.condition.text))?'unmet':input.condition.state,boundWindow=input.condition.text.match(/未来([\d一二两三四五六七八九十]+)天/)?.[1],windowSupported=state!=='unmet'&&(found.premise.window_supported===true||state==='met'&&!!boundWindow&&boundWindow===found.premise.window);selected.set(key,{...found,premise:{...found.premise,state,text:input.condition.text,source_quote:input.condition.source_quote,...(found.premise.kind==='time'&&found.premise.window?{window_supported:windowSupported}:{})}});}
 }
 return [...selected.values()].map(v=>v.premise).sort((a,b)=>a.kind.localeCompare(b.kind));
}

/** One closed business expression shared by producer and qualification. No
 * condition, numeric result, permission or execution is supplied by this text. */
/** Only the current producer's exact option heading is presentation, never extra action content. */
export function judgmentOptionBody(snapshot:JudgmentSnapshot,value:string){
 if(snapshot.version==='1.12'){const unit=judgmentOptionExpression(snapshot,value);return unit?.text??value;}
 const prefix='## 可选建议（不自动执行）\n';
 return snapshot.version==='1.11'&&value.startsWith(prefix)?value.slice(prefix.length).trim():value;
}
export function recordQualificationExpression(snapshot:JudgmentSnapshot){
 const owner=judgmentPremises(snapshot).find(p=>p.kind==='authority')?.owner??'负责人';
 return {text:'可选择核对所选退款与订单归属，以收集可追溯的归属匹配证据；备选是仅保留当前分析并暂缓。风险是把分别汇总误当净额、盈利或原因；遇到无法匹配或涉及新增材料则停止并补证。该建议不自动核对、不排班、不签署，用户未选择时不触发任何后台动作。',strategy:{goal:'核对所选退款与订单归属',owner,authority:'本样例核对权限',resources:'所选资料及工时',cost:'沿用已给条件',risk:'把分别汇总误当净额、盈利或原因；无法匹配',alternatives:'仅保留分析并暂缓',stop:'无法匹配或涉及新增材料则停止并补证',observe:'可追溯匹配记录'}};
}

/** A typed presentation annotation can refer only to the same current USER
 * cost ceiling. Unknown field content remains the entire unproved candidate. */
export function judgmentOptionExpression(snapshot:JudgmentSnapshot,value:string){
 if(snapshot.version!=='1.12')return null;
 const unit=readJudgmentOptionUnit(value),expression=recordQualificationExpression(snapshot);
 if(!unit||unit.body.replace(/[ \t\r\n]/g,'')!==expression.text.replace(/[ \t\r\n]/g,''))return null;
 if(!unit.fields)return expression;
 for(const [key,expected] of Object.entries(expression.strategy)){
  const actual=unit.fields[key as keyof typeof unit.fields];if(actual===expected)continue;
  if(key!=='cost')return null;
  const annotation=actual.match(/^沿用已给条件（≤(\d+(?:\.\d+)?)[ \t]*元）$/),cost=judgmentPremises(snapshot).find(p=>p.kind==='cost');
  if(!annotation||cost?.mapping!=='recognized'||!cost.cost_source_id||annotation[1]!==cost.cost_limit)return null;
 }
 return {...expression,strategy:unit.fields};
}

/** Request-side structural reading only. Saved MODEL bytes are never changed.
 * Headings/labels supply no method; quoted, conditional and unknown clauses
 * must still pass the complete existing predicate and preservation rules. */
function markdownOptionLines(value:string){
 return value.split(/\n/).map(line=>line.trim().replace(/^[-*]\s+/,'').replace(/\*\*/g,'').replace(/[ \t\r]/g,''))
  .filter(line=>!/^#{1,6}(?:可选核对方案[（(]仅供参考，不自动执行[）)]|可选建议[（(]不自动执行[）)])$/.test(line));
}
function markdownOptionParts(value:string){
 return markdownOptionLines(value)
  .map(line=>line.replace(/^(?:备选[A-Z]|资源|风险|观察|停止)[：:]/,''))
  .flatMap(line=>line.split(/[，,。；;]|、(?=费用|预算)/)).filter(Boolean);
}
function markdownRecordSourceCovered(snapshot:JudgmentSnapshot,value:string){
 const owner=judgmentPremises(snapshot).find(p=>p.kind==='authority')?.owner??'负责人',premises=judgmentPremises(snapshot);
 const time=premises.find(p=>p.kind==='time'),cost=premises.find(p=>p.kind==='cost');
 // Count all source options before removing their labels, including passive
 // alternatives. This expression represents one action plus one alternative.
 if(markdownOptionLines(value).filter(line=>/^备选[A-Z][：:]/.test(line)).length!==2)return false;
 const parts=markdownOptionParts(value);
 const hoursPattern=/^(?:未来(\d+)天内可投入|可在未来(\d+)天安排)(\d+)小时$/,amountPattern=/^费用不超过(\d+(?:\.\d+)?)元$/;
 // This replacement represents one complete attribution option. Recognizing
 // each clause alone cannot justify discarding another option or supplying a
 // missing source constraint. Unknown/incomplete sources retain their text.
 const actions=parts.filter(part=>optionActionRule(owner).test(part));
 if(actions.length!==1||!recordAttributionAction(actions[0]!))return false;
 const required=[hoursPattern,amountPattern,/^目标是收集归属匹配证据$/,/^负责人拥有核对权限$/,/^资源均满足$/,
  /^把描述误当原因(?:或发生无法匹配)?$/,/^发生无法匹配或涉及新增材料的情况应停止并补证$/,
  /^过程需保留可追溯匹配记录$/,/^仅保留当前分别汇总分析并暂缓比较$/,/^避免跨表结论越界$/,
  /^本轮不选择、不实施、不签署$/];
 if(!required.every(rule=>parts.some(part=>rule.test(part))))return false;
 return parts.every(part=>{
  const hours=part.match(hoursPattern);
  if(hours)return !!time&&time.mapping==='recognized'&&time.window===(hours[1]??hours[2])&&time.text.match(/(?:安排|投入)(?:这)?(\d+)小时/)?.[1]===hours[3];
  const amount=part.match(amountPattern);
  if(amount)return !!cost&&cost.mapping==='recognized'&&amount[1]===cost.cost_limit;
  return optionActionRule(owner).test(part)||[
   /^(?:仅作可选建议|按用户授权与资源条件说明|本轮不选择、不实施、不签署)$/,
   /^目标是收集归属匹配证据$/,
   /^(?:负责人拥有核对权限|资源均满足)$/,
   /^把描述误当原因(?:或发生无法匹配)?$/,
   /^发生无法匹配或涉及新增材料的情况应停止并补证$/,
   /^过程需保留可追溯匹配记录$/,
   /^仅保留当前分别汇总分析并暂缓比较$/,
   /^避免跨表结论越界$/,
   /^如需启用备选[A-Z]$/,
   /^请明确告知采用并移交负责人$/,
   /^本轮不动既有事实、权限与版本$/,
  ].some(rule=>rule.test(part));
 });
}

/** A finite three-role source form: one action with capacity, one passive
 * alternative and one risk/stop/observation row. No prefix can erase a row.
 * This reads source roles only; it never rewrites a MODEL reply or grants facts. */
function compactRecordRows(value:string){
 const lines=value.split('\n').map(v=>v.trim()).filter(Boolean);
 if(!/^#{1,6} 可选核对建议（按本轮用户原话，不自动执行）$/.test(lines[0]??''))return null;
 if(lines.length!==4)return null;
 const action=lines[1]!.replace(/^[-*]\s+/,'').split(/[：:]/);
 const alternative=lines[2]!.match(/^[-*]\s+备选[：:](.+)$/),risk=lines[3]!.match(/^[-*]\s+风险[：:](.+)$/);
 return action.length===2&&alternative&&risk?{action:action[0]!,capacity:action[1]!,alternative:alternative[1]!,risk:risk[1]!}:null;
}
function compactRecordSourceCovered(snapshot:JudgmentSnapshot,value:string){
 const rows=compactRecordRows(value);if(!rows)return false;
 const premises=judgmentPremises(snapshot),owner=premises.find(p=>p.kind==='authority')?.owner??'负责人';
 if(!optionActionRule(owner).test(rows.action)||!recordAttributionAction(rows.action))return false;
 const capacity=rows.capacity.match(/^负责人拥有核对权限，可在未来(\d+)天安排(\d+)小时、费用不超过(\d+(?:\.\d+)?)元；目标是收集归属匹配证据。$/);
 const time=premises.find(p=>p.kind==='time'),cost=premises.find(p=>p.kind==='cost');
 return !!capacity&&time?.mapping==='recognized'&&time.window===capacity[1]&&time.text.match(/安排(?:这)?(\d+)小时/)?.[1]===capacity[2]&&cost?.mapping==='recognized'&&cost.cost_limit===capacity[3]&&
  rows.alternative==='仅保留分析与汇总，暂缓比较；不自动排班、签署或追加材料。'&&
  rows.risk==='把描述误当原因、匹配失败或需新增材料时停止并补证，以可追溯匹配记录观察完成情况。';
}

/** Full source coverage, not an action-prefix match. Unknown additional text
 * remains unchanged; the catalog must not silently remove a material limit. */
export function recordRevisionSourceCovered(snapshot:JudgmentSnapshot,value:string){
 if(snapshot.version==='1.12'&&judgmentOptionExpression(snapshot,value))return true;
 if(['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)){if(compactRecordRows(value))return compactRecordSourceCovered(snapshot,value);return recordRevisionSourceCovered({...snapshot,version:'1.9'},value);}
 if(snapshot.version==='1.9'&&/^#{1,6}\s*可选核对方案/m.test(value))return markdownRecordSourceCovered(snapshot,value);
 const owner=judgmentPremises(snapshot).find(p=>p.kind==='authority')?.owner??'负责人';
 const normalized=value.replace(/^\s*#{1,6}\s*可选建议[（(]不自动执行[）)]\s*$/gm,'').replace(/^\s*[-*]\s+/gm,'').replace(/\*\*|["“”]/g,'').replace(/[ \t\r]/g,'')
  .replace(/备选[：:]/g,'备选是').replace(/风险提示[：:]/g,'风险是')
  .replace(/如发生无法匹配或涉及新增材料[，,]停止并补证/g,'遇到无法匹配或涉及新增材料则停止并补证');
 const parts=normalized.split(/[，,。；;\n]/).filter(Boolean);
 return parts.length>0&&parts.every(part=>optionActionRule(owner).test(part)||optionActionRule(owner,true).test(part)||[
  /^(?:目标是|以)?收集(?:可追溯的)?(?:归属)?匹配证据$/,
  /^(?:以|观察)?可追溯(?:的)?(?:归属)?匹配记录(?:观察完成情况)?$/,
  /^(?:备选是)?仅保留(?:当前)?分析并暂缓(?:核对)?$/,
  /^(?:风险是)?把分别汇总误当净额、盈利或原因$/,
  /^遇到无法匹配或涉及新增材料则停止并补证$/,
  /^(?:该建议)?不自动核对、不排班、不签署$/,
  /^(?:以上仅作|只作为)可选建议$/,
  /^不自动执行或签署$/,
  /^用户未(?:在本轮)?选择(?:执行)?时(?:不触发任何后台动作)?$/,
  /^不触发任何后台动作$/,
  /^核对权限、工时与费用条件按本版既有见证理解$/,
  /^具体资源状态由核验记录呈现$/,
  /^资源均(?:明确)?满足$/,
 ].some(rule=>rule.test(part))||/^(?:负责人(?:拥有|已获)核对权限|可在未来\d+天安排\d+小时|费用不超过\d+(?:\.\d+)?元)$/.test(part)&&optionTextCovered(part,owner));
}

/** Null actor detects the action shape only; it grants no owner or permission. */
function optionActionRule(actor:string|null,analysis=false):RegExp{
 const owner=actor===null?'[^，,。；;\\n]{1,40}?':/^[A-Za-z0-9\u4e00-\u9fff]{0,16}负责人$/.test(actor)?`(?:负责人|${actor})`:'(?!)';
 const object='(?:所选|现有|原范围)?(?:退款与订单归属|订单与退款归属|退款归属|归属记录|异常记录|记录)';
 const inspect=`(?:核对|核查)${object}(?:并保留(?:可追溯)?匹配证据)?`;
 const analyze='(?:(?:资料|数据)(?:导入|到位)后)?(?:再)?(?:分析|计算|判断)(?:新期间|该期间|本期|所选)?(?:的)?(?:订单与退款|订单退款|订单|退款)(?:情况|金额)?';
 const action=analysis?analyze:`(?:${inspect}|收集所选退款与订单之间的归属匹配证据)`;
 return new RegExp(`^(?:可以|可选择|可考虑|可)?(?:先)?(?:由(?:已获本(?:合成)?样例核对权限的)?${owner})?${action}$`);
}
/** Classify the already-supported record grammar as a whole. Generic and
 * abnormal-record checks keep their own contract; the other existing record
 * targets are attribution methods, including their existing aliases. */
export function recordAttributionAction(value:string){
 const action=value.trim().replace(/[。.]$/,'');
 return optionActionRule(null).test(action)&&!/(?:核对|核查)(?:所选|现有|原范围)?(?:异常记录|记录)(?:并保留(?:可追溯)?匹配证据)?$/.test(action);
}
/** Source methods share qualification's complete action grammar. */
export function judgmentActionMethods(value:string,structured=false,compact=false){
 const methods=new Set<'attribution'|'record'|'analysis'>();
 const row=compact?compactRecordRows(value):null;if(row&&optionActionRule(null).test(row.action))methods.add(recordAttributionAction(row.action)?'attribution':'record');
 for(const part of structured?markdownOptionParts(value):value.split(/[，,。；;\n]/).map(v=>v.trim().replace(/^[-*]\s+/,'').replace(/\*\*/g,''))){
  if(optionActionRule(null).test(part))methods.add(recordAttributionAction(part)?'attribution':'record');
  if(optionActionRule(null,true).test(part))methods.add('analysis');
 }
 return [...methods];
}
export function judgmentActionPattern(structured=false,compact=false){
 const record=optionActionRule(null).source.slice(1,-1),analysis=optionActionRule(null,true).source.slice(1,-1);
 return `(?:^|[，,。；;\\n])\\s*(?:[-*]\\s*)?${structured?'(?:备选[ \t]*[A-Z][：:][ \t]*)?':''}(?:${record}|${analysis})(?=[，,。；;\\n]${compact?'|[：:]':''}|$)`;
}
export const passiveJudgmentGoal=/^(?:(?:仅|只)?(?:保留|保存)(?:原|本次|当前)?(?:分析结果|分析|结果)(?:[、，,]?(?:并)?暂缓)?|等待(?:本期|当前|新期间)?资料)$/;

// An entire bounded clause must be covered. A valid goal label is not a license
// for unknown business actions in the body, an alternative, or a resource field.
function optionTextCovered(value:string,actor:string,analysis=false):boolean{
 const owner=/^[A-Za-z0-9\u4e00-\u9fff]{0,16}负责人$/.test(actor)?`(?:负责人|${actor})`:'(?!)';
 const clauses=[
  optionActionRule(actor,analysis),
  /^(?:目标是)?(?:收集(?:归属)?匹配证据|保留(?:可追溯)?匹配证据)$/,
  /^(?:(?:备选是|与)(?:只|仅)?|(?:只|仅))?(?:保留|保存)(?:现有|原|本次|当前)?(?:分析结果|分析|结果)(?:[、]?(?:并)?暂缓(?:核对|比较)?)?$/,
  /^(?:不产生匹配证据|不启动核对|暂缓(?:核对|比较)?|不行动|我不愿意执行)$/,
  /^(?:我|本人)(?:现在)?(?:选择|决定)(?:核对|核查|暂缓|等待资料|不行动)(?:、不行动)?$/,
  new RegExp(`^(?:${owner})?(?:在本(?:合成)?样例)?(?:拥有|已获|明确有)?(?:核对(?:所选订单与退款记录的)?权限|权限核对所选(?:合成)?退款和订单记录)$`),
  new RegExp(`^(?:${owner}已获|依据已获)本(?:合成)?样例核对(?:所选(?:退款和订单|退款与订单|订单与退款)记录的)?权限(?:推进)?$`),
  /^(?:沿用已明确的本样例核对权限|本样例核对权限|获准范围内核对|未确认权限前不推进|不新增授权|不执行|不执行实际行动|不自动执行或签署|只作为可选建议)$/,
  /^(?:可)?(?:在)?未来[\d一二两三四五六七八九十]+天(?:安排|投入)(?:这)?\d+小时$/,
  new RegExp(String.raw`^(?:但)?${owner}(?:能否|是否能|不能|无法|能够|可|能)(?:在)?(?:未来[\d一二两三四五六七八九十]+天)?安排(?:(?:这)?\d+小时|工时)(?:现改为未知|尚未确认|仍未知|未知)?$`),
  /^(?:未来\d+天投入\d+小时|费用不超过\d+(?:\.\d+)?元)(?:仅是本样例候选)?$/,
  /^(?:费用可满足|费用能满足|费用已满足|资源均满足|均明确满足|沿用已给条件|无新增费用|无新增投入|无新增承诺|未确认|不承诺|不预设投入|仅限本合成样例条件|仅本样例候选条件|仅本样例候选|(?:为)?本样例候选上限|不引入新增材料|所选记录|工时待确认|已有获准记录|线索不代表原因|记录差异及证据|匹配记录)$/,
  /^(?:使用|仅使用|仅用|可用材料仅)?(?:现有)?(?:订单与退款两个(?:现有)?文件|订单与退款文件|这两个已给文件|这两个文件|两个文件|订单\.csv与退款\.csv两个文件|所选资料及工时|所选资料|新期间资料)(?:\s*[（(]本样例候选条件[）)])?$/,
  /^(?:可能)?(?:错把描述(?:性汇总)?当原因|把描述(?:性汇总)?误当原因)(?:或(?:发生)?(?:无法匹配|匹配失败))?(?:是风险)?$/,
  /^或(?:发生|出现)?(?:无法匹配|匹配失败)$/,
  /^(?:风险是)?(?:把描述误当原因或发生无法匹配|无法匹配|匹配失败|资料缺失)$/,
  /^(?:遇到)?(?:无法匹配|发现无法匹配)(?:或(?:涉及|需要|需)新增材料)?(?:时|则)停止(?:并)?补证$/,
  /^(?:新增材料|资料缺失|无法匹配|无核对权限)则停止$/,
  /^(?:以|观察|观察并记录)?可追溯(?:的)?(?:归属)?匹配(?:证据|记录)(?:观察完成情况)?$/,
  /^(?:只追问能否安排这\d+小时|资料和口径)$/,
 ];
 const parts=value.replace(/[（(]本样例候选条件[）)]/g,'').split(/[，,。；;\n]|[且、](?=费用|预算)/).map(v=>v.trim()).filter(Boolean);
 return parts.length>0&&parts.every(v=>clauses.some(rule=>rule.test(v)));
}

function passiveTextCovered(value:string):boolean{
 const parts=value.split(/[，,。；;\n]/).map(v=>v.trim()).filter(Boolean);
 return parts.length>0&&parts.every(v=>
  /^(?:仅|只)?(?:保留|保存)(?:现有|原|本次|当前)?(?:分析结果|分析|结果)(?:[、]?(?:并)?暂缓(?:核对|比较)?)?$/.test(v)||
  /^(?:等待(?:本期|当前|新期间)?资料|不产生匹配证据|不启动核对|暂缓(?:核对|比较)?|不行动|不执行|不执行实际行动|不自动执行或签署|不新增授权|已保存报告|无新增投入|无新增费用|待证据|继续补证|无新计算|保存结果|资料缺失|资料和口径)$/.test(v));
}

/** Only whole, bounded explanatory clauses are current eligibility reasons.
 * Other MODEL prose remains original history, not a newly endorsed action. */
const arrangementSupport=/^核对安排(?:有据|依据当前用户条件)$/;
function reviewExplanationCovered(value:string,arrangement:'qualified'|'pending'|null=null):boolean{
 const parts=value.split(/[，,。；;\n]/).map(v=>v.trim()).filter(Boolean);
 return parts.length>0&&parts.every(v=>
  arrangement==='qualified'&&(arrangementSupport.test(v)||v==='权限由用户说明')||
  arrangement==='pending'&&v==='核对安排待确认'||
  /^(?:实际汇总可作核对线索|有限观察保留|原因未认证)$/.test(v)||
  /^(?:当前)?(?:同口径)?(?:独立)?(?:核算|汇总|计算)(?:仅)?支持有限观察$/.test(v)||
  /^(?:非因果识别|非因果证明)$/.test(v)||
  /^(?:仍)?不保证(?:核对)?结果$/.test(v)||
  /^(?:本次核对|本次结果|当前证据)?(?:不|不能|不得|无法)(?:据此)?(?:授权|支持|证明|保证)(?:扩大促销|原因|因果|收益|结果)$/.test(v)||
  /^(?:本次核对)?(?:不|不能|不得|无法)(?:据此)?(?:扩大促销|自动执行|执行实际行动|签署)$/.test(v));
}
function explicitlyUnrelated(subject:string|undefined):boolean{
 return !!subject&&/^(?:(?:无关|不相关)(?:的)?|与(?:所选记录|原范围|本任务)(?:明确)?无关的)[^，,；;。]+(?:资料|数据)$/.test(subject);
}

/** Only covered relations may discard a material prerequisite. Unrecognized
 * subjects are not silently treated as unrelated to an actual record check. */
function materialRelation(subject:string|undefined,analysis:boolean):'related'|'unrelated'|'unproven'{
 if(explicitlyUnrelated(subject))return 'unrelated';
 if(!subject||/^(?:资料|数据)$/.test(subject)||/(?:核对|核查|分析)(?:所需|需要的)|所选|这些|现有|原范围|记录|订单|退款/.test(subject))return 'related';
 if(analysis&&/(?:新期间|该期间|本期)/.test(subject))return 'related';
 if(/^人事工资(?:资料|数据)$/.test(subject)||!analysis&&/^(?:新期间|该期间|本期)(?:资料|数据)$/.test(subject))return 'unrelated';
 return 'unproven';
}

const conclusionActionCue=/(?:建议|推荐)(?!$|条件|依据|资格|状态|原因|范围|所需|所依|的)|(?:可选择|可考虑|应当|应该|必须|务必|请|立即|马上|转而|改为|直接)|^(?:(?:因此|据此|所以|为此)?应|下一步|接下来|接着|优先|进一步|尽快|立刻)|^先(?:做|去|行|对|将|把|以|核对|核查|分析|计算|执行|启动|扩大|调整|优化)|(?:可以|可|能够)(?:先)?(?:核对|核查|分析|计算|扩大|增加|降低|提升|调整|执行|启动|投放)/;
function questionHasCommand(prefix:string):boolean{
 // Keep directive/polarity words; removing an actor label is only for cue
 // detection and never establishes that actor's authority.
 const view=prefix.replace(/^模型解释[：:]\s*/,'').replace(/^(?:当前|本轮|本次)(?:仍|尚)?/,'').replace(/由[A-Za-z0-9\u4e00-\u9fff]{0,16}?(?:负责人|经理|团队|人员|用户|部门|公司)/g,'');
 // A negated recommendation owns the entire known method/question bridge.
 // Do not let its embedded recommendation word reverse that polarity, and do
 // not exempt an unknown continuation or a separately asserted command.
 const actor='[A-Za-z0-9\\u4e00-\\u9fff]{0,16}?(?:负责人|经理|团队|人员|用户|部门|公司)';
 const denial=view.match(new RegExp(`^(?:${actor})?(?:不建议|不推荐|不应该|不应|不能|不得|无法)(.+)$`));
 if(denial&&!/^(?:不|未)/.test(denial[1]!)&&[false,true].some(analysis=>{
  const body=currentConclusionClause(denial[1]!).replace(new RegExp(`^${actor}`),''),method=new RegExp(optionActionRule(null,analysis).source.replace(/\$$/,'')).exec(body);
  return !!method&&/^(?:(?:再|以|用以)?(?:决定|判断|评估))?$/.test(body.slice(method[0].length));
 }))return false;
 // Reuse the exact accepted action grammar. A later question/decision does
 // not turn an instruction to inspect/analyse into an observation.
 const steps=view.split(/[：:]/).flatMap(value=>{
  const step=currentConclusionClause(value.trim()).replace(/^(?:重新|再次)/,'');
  return [step,step.replace(/^[A-Za-z0-9\u4e00-\u9fff]{0,16}?(?:负责人|经理|团队|人员|用户|部门|公司)/,'')];
 });
 const active=steps.some(step=>[false,true].some(analysis=>{
  const matched=new RegExp(optionActionRule(null,analysis).source.replace(/\$$/,'')).exec(step);
  return !!matched&&!/^(?:的)?(?:结果|情况|金额|差异|数据|范围|记录|说明|问题|流程|计划|方案|方法|原文引用)$/.test(step.slice(matched[0].length).trim());
 }));
 return conclusionActionCue.test(prefix)||conclusionActionCue.test(view)||/(?:建议|推荐|必须|务必|执行|启动|开展|扩大|投放)$/.test(view.trim())||active;
}

/** Classify the known business predicate, not a whitelist of its possible
 * subjects/adverbs. Only whole, bounded negative/question/history clauses can
 * exempt that predicate; unknown mixed contexts remain unproven. */
function conclusionBusinessAction(part:string,questionScope=false):boolean|null{
 const action=String.raw`(?:扩大|加大|开展|进行|实施|推进|执行|启动|调整|增加|减少|提高|提升|降低|缩减|优化|投放)[^，,。；;\n]{0,16}?(?:促销|营销|广告|供应链|投放|业务|策略|方案|活动|库存|价格|预算|折扣)`;
 const found=[...part.matchAll(new RegExp(action,'g'))];
 if(!found.length)return null;
 if(questionScope&&found.length===1&&new RegExp(`^(?:是否|能否)(?:应当|应该|应|可以|可)?${action}(?:属于|属)业务决策(?:范围)?$`).test(part))return false;
 const actor=String.raw`(?:(?:由)?[A-Za-z0-9\u4e00-\u9fff]{0,16}?(?:负责人|经理|团队|人员|用户|部门|公司))?`,aspect='(?:(?:继续|进一步|直接|立即|马上|先行|先|着手|开始|再|仍|主动|逐步|尝试))*';
 const scope='(?:(?:当前|本版|本轮|本次(?:核对|分析)?|本次结果|现有证据|当前证据)(?:仍|尚)?)?';
 const denial=new RegExp(`^${scope}${actor}(?:不能|不得|无法|不应该|不应|不宜|尚未|没有|并非|未|不)(?:据此)?(?:建议|推荐|授权|支持|证明|推断|外推|构成)?${actor}${aspect}${action}(?:规模|投入|范围|力度)?$`);
 // A whole question is not an affirmative action. Its evidence limitation may
 // be the next comma fragment; never let an independent command prefix hide
 // behind the question frame.
 const question=new RegExp(String.raw`^([^，,。；;\n]{0,40})(?:是否|能否)(?:应当|应该|应|可以|可)?${action}(?:[^，,。；;\n]{0,40}(?:尚无|没有|缺少|缺乏|无)[^，,。；;\n]{0,40}(?:依据|证据)(?:支持任何结论)?)?[？?]?$`),framing=part.match(question);
 const history=new RegExp(`^(?:原资料(?:原文)?|历史资料|原文|来源记录)(?:中)?(?:记载|写明|描述)(?:已|曾)?${action}(?:规模|投入|范围|力度)?$`);
 const questionSubject=/^(?:(?:本轮|当前|原范围|现有|该|本次|所选)(?:的)?)?(?:执行计划|执行方案|分析方案|问题|报告范围)$/;
 if(framing&&!questionHasCommand(framing[1]!)&&(found.length===1||questionSubject.test(framing[1]!)))return false;
 if(found.length!==1)return true;
 return !(denial.test(part)||history.test(part));
}
function currentConclusionClause(part:string):string{
 const connected=part.replace(/^(?:(?:随后|之后|然后|接着|同时|因此|据此|所以|为此|继而|接下来|并(?!非))(?:就)?)+/,'');
 if(/(?:是否|能否)/.test(connected))return connected.trim();
 return connected.replace(/^(?:可以|可)?由[A-Za-z0-9\u4e00-\u9fff]{0,16}?(?:负责人|经理|团队|人员|用户|部门|公司)/,'')
  .replace(/^(?:(?:继续|进一步|直接|立即|马上|先行|先|着手|开始|再|仍|主动|逐步|尝试))+/,'').trim();
}

/** Bounded affirmative proposal cues do not become observations by a MODEL
 * category label. Denials are whole clauses; a later positive clause is checked
 * separately. This is content gating, not a general semantic certification. */
/** Read-only semantic view of existing Markdown presentation. Never changes
 * MODEL bytes, strips a prose clause, supplies a witness or grants authority. */
function limitationPresentationClause(value:string){
 let view=value;
 for(;;){
  const next=currentConclusionClause(view.replace(/[*_`]/g,'').trim().replace(/^(?:(?:#{1,6}|[-+>]|\d{1,9}[.)])\s+)+/,''))
   .replace(/^(?:也|因此)/,'').replace(/^(?:当前事实为|本轮有效要求[：:])/,'').replace(/^(?:已知|待补证事项是)/,'').trim();
  if(next===view)return next;
  view=next;
 }
}
/** One current clause stream: all three semantic consumers see identical
 * boundaries, presentation, connective interpretation and list-member polarity. */
const evidenceLimitImplication=/^缺少证据就给出(?:净额|盈利|促销推荐)(?:(?:、|或)(?:净额|盈利|促销推荐))*会构成(?:错把描述当结论|错误)$/;
const limitationScope=String.raw`(?:(?:准备阶段|当前|本版|本轮|本次(?:核对|分析)?|现有证据|当前证据|本次结果)(?:仍|尚)?)?`;
const limitationDenialStart=String.raw`^${limitationScope}(?:不|不能|不得|无法|尚不能|未|没有)(?:据此)?`;
const limitationListStart=new RegExp(`${limitationDenialStart}(?:绑定|执行|生成|形成|核对|核查|分析|计算|开展)`);
const limitationDenial=new RegExp(`${limitationDenialStart}(?:建议|推荐|授权|支持|执行|扩大|核对|核查|分析|计算|生成|绑定|形成|推断|外推|构成)(?:立即|马上|进一步|尽快|优先|先)?(.+)$`);
export function judgmentClauseView(value:string){
 return value.split(/[，,。；;\n]|但是|然而|但|却|且|而是|、(?=没有新计算)/).flatMap(raw=>{
  const part=limitationPresentationClause(raw);
  // An exact existing limitation proposition owns its noun enumeration;
  // generic denial exemptions do not establish such a whole-clause meaning.
  if(limitationRoleClause(part,false)||evidenceLimitImplication.test(part))return [part];
  const members=part.split('、').map(limitationPresentationClause);
  // Known state propositions and affirmative actions are independent members,
  // regardless of a preceding denial. These are the existing role/data/action
  // parsers, not new witnesses. A single member cannot expand a list again.
  const independentMember=members.length>1&&members.slice(1).some(member=>limitationRoleClause(member,false)!==null||judgmentDataStatement(member)!==null||conclusionHasAction(member,true,true,true,true,true));
  return limitationListStart.test(part)||independentMember?members:[part];
 }).filter(Boolean);
}
/** A recognized refusal/status is not an active method's material prerequisite.
 * Unknown mixed clauses never inherit this predicate's exemption. */
function boundedLimitationDenial(part:string){
 if(conclusionBusinessAction(part,true)===true)return false;
 const denial=part.match(limitationDenial);
 return !!denial&&!conclusionActionCue.test(denial[1]!);
}
function conclusionHasAction(value:string,currentGrammar=false,negativeLists=false,questionScope=false,limitationRoles=false,roleContext=false):boolean{
 const cue=conclusionActionCue;
 const parts=roleContext?judgmentClauseView(value):value.split(currentGrammar?/[，,。；;\n]|但是|然而|但|却|且|而是/:/[，,。；;\n]|但是|然而|但|却|且/)
  .flatMap(part=>negativeLists&&/^(?:当前|本版|本轮|本次)?(?:未|没有)(?:绑定|执行|生成)/.test(part.trim())?part.split('、'):[part])
  .map(v=>v.trim().replace(/^#{1,6}\s+/,'').replace(/^\*\*(.*?)\*\*$/,'$1')).map(part=>currentGrammar?currentConclusionClause(part):part).filter(Boolean);
 return parts.some(part=>{
  if(/^(?:建议|行动建议|策略建议|下一步|结论|观察|有限观察|分析结论|建议条件|结论与建议)$/.test(part))return false;
  // Whole-clause scope statement only. A later or embedded affirmative action
  // is still checked; old snapshots retain their original classification.
  if(currentGrammar&&/^(?:促销|行动|策略)(?:建议|推荐)(?:属|属于)业务决策(?:范围)?$/.test(part))return false;
  if(negativeLists&&evidenceLimitImplication.test(part))return false;
  if(limitationRoles&&(roleContext?limitationRoleClause(part):limitationClause(part)))return false;
  if(arrangementSupport.test(part))return true;
  if(reviewExplanationCovered(part))return false;
  if(currentGrammar){const action=conclusionBusinessAction(part,questionScope);if(action!==null)return action;}
  if(/^(?:当前|本版|本轮)?(?:没有|暂无|尚无|尚未形成)(?:可采用的)?(?:行动|策略)?(?:建议|推荐|方案)$/.test(part))return false;
  if(roleContext&&boundedLimitationDenial(part))return false;
  if(!roleContext){const denial=part.match(/^(?:(?:当前|本版|本轮|本次(?:核对|分析)?|现有证据|当前证据|本次结果)(?:仍|尚)?)?(?:不|不能|不得|无法|尚不能|未)(?:据此)?(?:建议|推荐|授权|支持|执行|扩大|核对|分析|推断|外推|构成)(?:立即|马上|进一步|尽快|优先|先)?(.+)$/);
  if(denial&&!cue.test(denial[1]!))return false;}

  return optionActionRule(null).test(part)||optionActionRule(null,true).test(part)||cue.test(part)||/^(?:扩大|加大|投放|执行|启动|调整)(?:促销|营销|广告|供应链|投放|业务|策略|方案)|^(?:核对|核查)(?:所选|现有|原范围)|^(?:分析|计算)(?:新期间|该期间|本期)(?:订单|退款)/.test(part);
 });
}

/** A finite limitation proposition grammar. The subject and whole predicate
 * are checked together; a later command or unknown clause cannot inherit denial. */
function limitationClause(value:string):{subject?:string}|null{
 const v=value.trim().replace(/^(?:也|因此)/,'').replace(/^(?:当前事实为|本轮有效要求[：:])/,'');
 const missing=v.match(/^(?:已知|待补证事项是)?(.+)(?:尚未导入|尚未到位)$/);
 if(missing&&judgmentSupportedMaterialSubject(missing[1]!))return {subject:missing[1]!};
 if(/^(?:在资料补齐前|没有新计算|现有获准资料不覆盖该期间|现有获准资料只覆盖原范围|原有限观察仅保留为历史范围|不得借原有限观察外推|不能借历史范围外推|不构成任何期间结论或促销依据)$/.test(v))return {};
 const current='(?:该期间|新期间|本期)(?:的)?',noun='(?:订单与退款金额|净额|盈利|促销推荐)';
 if(new RegExp(`^${current}${noun}(?:(?:、|或)${noun})*均无法证明$`).test(v))return {};
 if(new RegExp(`^(?:在资料补齐前)?${current}结论与促销方案均维持证据不足$`).test(v))return {};
 return null;
}
/** New producer: bounded roles compose the already supported period/material
 * grammar with non-effecting question, evidence-limit and historical scopes.
 * An unrecognised clause never inherits the absence clause's exemption. */
function limitationRoleClause(value:string,includeDenial=true):{subject?:string}|null{
 const prepared=limitationPresentationClause(value),old=limitationClause(prepared);if(old)return old;
 const literal=judgmentDataStatement(prepared);
 if(literal?.state==='unmet'&&judgmentSupportedMaterialSubject(literal.subject))return {subject:literal.subject};
 if(includeDenial&&boundedLimitationDenial(prepared))return {};
 const v=prepared;
 const period='(?:该期间|新期间|本期)(?:的)?',amount='(?:订单与退款金额|金额|净额|盈利|促销推荐)';
 if(new RegExp(`^本轮(?:改问|要求)(?:的)?(?:是)?${period}订单与退款汇总(?:及${period}是否应扩大促销)?$`).test(v))return {};
 if(new RegExp(`^(?:当前)?不能给出${period}${amount}(?:[、或]${amount})*$`).test(v))return {};
 const field='(?:时间范围|方案引用|工具回执细节)';
 if(new RegExp(`^现有资料的${field}(?:[、与]${field})*未在本快照可核字段内逐项核实$`).test(v))return {};
 if(/^(?:不作(?:具体)?断言|原资料范围的观察仅作历史保留)$/.test(v)||new RegExp(`^不外推到${period}$`).test(v))return {};
 const negativeStatus='(?:未|没有)(?:执行(?:新的?)?计算|形成(?:新的?)?方案绑定|绑定(?:新的?)?方案)';
 if(new RegExp(`^${limitationScope}${negativeStatus}(?:、${negativeStatus})*$`).test(v))return {};
 const userAbsence=v.match(new RegExp(`^与用户所述未导入(${period}资料)(?:、没有新计算的状态一致)?$`));if(userAbsence)return {subject:userAbsence[1]!};
 if(/^没有新计算的状态一致$/.test(v))return {};
 const scopeField='(?:执行范围声明|方案引用清单)';
 if(new RegExp(`^${scopeField}(?:与${scopeField})*缺本快照可核依据$`).test(v))return {};
 if(new RegExp(`^${period}结论与促销判断均待${period}资料证据$`).test(v)||/^本项不认证(?:净额|盈利|原因)(?:[、或](?:净额|盈利|原因))*$/.test(v))return {};
 if(/^(?:不能|不可)(?:直接)?相减(?:得|得到)(?:净额|盈利)$/.test(v))return {};
 const formulaObject='(?:操作数|公式|显示舍入)';
 if(new RegExp(`^(?:状态间差额与变化率)?仅(?:核对|检查)${formulaObject}(?:[、与]${formulaObject})*$`).test(v))return {};
 const unsupported='(?:金额|净额|盈利|趋势|是否扩大促销的推荐)';
 if(new RegExp(`^${period}${unsupported}(?:[、及]${unsupported})*均不能据此外推$`).test(v))return {};
 if(new RegExp(`^需待${period}资料与成本、退款风险等证据另行核算$`).test(v))return {};
 return null;
}
function limitationAbsenceClauses(value:string,roleContext=false){return (roleContext?judgmentClauseView(value):value.split(/[，,。；;\n]|、(?=没有新计算)/)).filter(v=>v.trim()).map(v=>roleContext?limitationRoleClause(v):limitationClause(v));}
function limitationSubjectMatches(subject:string,p:JudgmentPremise,premises:readonly JudgmentPremise[]){
 if(p.kind!=='data'||p.mapping!=='recognized'||p.state!=='unmet'||!p.subject)return false;
 if(judgmentMaterialSubjectKey(subject)===judgmentMaterialSubjectKey(p.subject))return true;
 // Only the lone deictic target may share the existing generic/order-refund
 // wording. Distinct period witnesses never become aliases by normalization.
 const target=(v:string)=>/^(?:该期间|新期间)(?:的)?(?:订单与退款)?资料$/.test(v);
 const data=premises.filter(v=>v.kind==='data');
 return data.length===1&&target(subject)&&target(p.subject);
}
function limitationAbsenceContext(value:string,p:JudgmentPremise,premises:readonly JudgmentPremise[],roleContext=false){
 const clauses=limitationAbsenceClauses(value,roleContext);
 return clauses.length>0&&clauses.every(v=>v!==null)&&clauses.some(v=>v?.subject&&limitationSubjectMatches(v.subject,p,premises));
}

/** A missing-data premise describes this exact limitation, rather than a
 * requirement to make the limitation true. Other dependencies remain intact. */
function missingMaterialContext(value:string,p:JudgmentPremise){
 if(p.kind!=='data'||p.state!=='unmet'||!p.subject)return false;
 const subject=p.subject.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const absence=new RegExp(`^(?:当前事实为|本轮有效要求[：:])?(?:(?:尚未|未|没有)导入${subject}|${subject}(?:尚未|未|没有)导入)$`);
 return value.split(/[、，,。；;\n]/).some(v=>absence.test(v.trim()));
}
export function judgmentQualification(snapshot:JudgmentSnapshot,claim:JudgmentClaimReview,candidateText:string,sourceText=candidateText){
 const premises=judgmentPremises(snapshot),issues:string[]=[],conditions:JudgmentCondition[]=[],capacity_refs:string[]=[];
 if(claim.kind==='conclusion'&&conclusionHasAction(candidateText,['1.7','1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version),['1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version),['1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version),['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version),['1.11','1.12','1.13','1.14'].includes(snapshot.version)))issues.push('CONCLUSION_ACTION_UNPROVEN');
 if(!snapshot.user_expression){
  const action=(value:string)=>/^(?:暂缓|等待|不行动)/.test(value)?'defer':/^(?:核对|核查)/.test(value)?'inspect':null;
  const actual=(snapshot.followup_question??snapshot.question).split(/[。；\n]/).flatMap(value=>{if(/[“”\"「」]/.test(value))return [];const m=value.trim().match(/^(?:我|本人)(?:现在)?(?:选择|决定)(.+)$/);return m&&action(m[1]!)?[action(m[1]!)!]:[];});
  for(const m of [candidateText,...Object.values(claim.strategy??{})].join('\n').matchAll(/(?:用户|负责人|客户|业务方)(?:已经|已)(?:明确)?(?:选择|决定|采取|采纳|同意)([^。；\n]+)/g))if(!action(m[1]!)||!actual.includes(action(m[1]!)!))issues.push('HUMAN_CHOICE_UNSUPPORTED');
 }
 if(['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)&&claim.kind==='conclusion'){
  // Check every literal missing-material assertion with the same data syntax
  // as USER witnesses, independently of the finite positive prose classifier.
  // Parsing MODEL syntax never supplies a USER state or a new witness.
  const clauses=['1.11','1.12','1.13','1.14'].includes(snapshot.version)?judgmentClauseView(candidateText):candidateText.split(/[，,。；;\n]|、(?=没有新计算)/);
  const absent=clauses.map(v=>{
   const clause=['1.11','1.12','1.13','1.14'].includes(snapshot.version)?v:v.trim().replace(/^(?:也|因此)/,'').replace(/^(?:当前事实为|本轮有效要求[：:])/,'').replace(/^(?:已知|待补证事项是)/,''),literal=judgmentDataStatement(clause);
   // The same finite role parser that admits the prose must expose its absence
   // subject even when MODEL omits conditions. It supplies no USER witness.
   const subject=['1.11','1.12','1.13','1.14'].includes(snapshot.version)?limitationRoleClause(clause)?.subject:undefined;
   return literal?.state==='unmet'?literal:subject?{subject,state:'unmet' as const}:null;
  }).filter(v=>v?.state==='unmet');
  if(absent.some(v=>!premises.some(p=>limitationSubjectMatches(v!.subject,p,premises))))issues.push('CONDITION_RELATION_UNPROVEN');
 }
 const goal=claim.strategy?.goal??'',passive=passiveJudgmentGoal.test(goal),recordAction=!passive&&/^(?:(?:核对|核查)(?:所选|现有|原范围)?(?:退款与订单归属|订单与退款归属|退款归属|归属记录|异常记录|记录)(?:并保留(?:可追溯)?匹配证据)?|收集所选退款与订单之间的归属匹配证据)[。.]?$/.test(goal),analysisAction=!passive&&/^(?:(?:资料|数据)(?:导入|到位)后)?(?:再)?(?:分析|计算|判断)(?:新期间|该期间|本期|所选)?(?:的)?(?:订单与退款|订单退款|订单|退款)(?:情况|金额)?[。.]?$/.test(goal);
 if(passive&&!/^(?:(?:用户已(?:明确)?选择(?:暂缓|等待)(?:资料)?)[，,])?(?:本轮)?(?:可以|可选择)?(?:仅|只)?(?:保留|保存)(?:原|当前|本次|现有)?(?:分析结果|分析|结果)(?:[、，,]?(?:并)?暂缓)?[。.]?$/.test(candidateText.trim())&&!/^(?:可以|可选择)?等待(?:本期|当前|新期间)?资料[。.]?$/.test(candidateText.trim()))issues.push('OPTION_CONTENT_UNPROVEN');
 // Stable host witnesses, not model IDs or a model's rephrasing of USER text.
 for(const condition of claim.conditions){
  const p=premises.find(p=>p.id===condition.id&&p.source_quote===condition.source_quote&&p.text===condition.text);
  if(!p||p.mapping!=='recognized'||p.state!==condition.state)issues.push('CONDITION_WITNESS_MISMATCH');
  if(claim.kind==='conclusion'&&p?.mapping==='recognized'&&!(['1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)&&(['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)?limitationAbsenceContext(candidateText,p,premises,['1.11','1.12','1.13','1.14'].includes(snapshot.version)):missingMaterialContext(candidateText,p))&&!issues.includes('CONCLUSION_ACTION_UNPROVEN')))conditions.push({id:p.id,text:p.text,source_quote:p.source_quote,state:p.state});
 }
 if(claim.kind==='strategy'){
  const activeAction=recordAction||analysisAction;
  if(['1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)&&activeAction){const method=analysisAction?'analysis':recordAttributionAction(goal)?'attribution':'record';if(!judgmentActionMethods(sourceText,['1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version),['1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)).includes(method)||candidateText!==sourceText&&!recordRevisionSourceCovered(snapshot,sourceText))issues.push('OPTION_METHOD_SOURCE_UNPROVEN');}
  const authority=premises.find(p=>p.kind==='authority'),actor=(claim.strategy?.owner??'').replace(/^已获本[^，,；;。]*样例核对权限的/,'').replace(/[。.]$/,''),resolvedActor=actor==='负责人'?authority?.owner??actor:actor;
  if((recordAction||analysisAction)&&!/^[A-Za-z0-9\u4e00-\u9fff]{0,16}负责人$/.test(resolvedActor))issues.push('CONDITION_OWNER_MISMATCH');
  const data=premises.filter(p=>p.kind==='data');
  const required:Kind[]=[...(recordAction?['authority' as const]:[]),...(activeAction?(['time','cost'] as const).filter(k=>premises.some(p=>p.kind===k)):[])];
  for(const kind of required){const p=premises.find(p=>p.kind===kind);if(p?.mapping==='recognized')conditions.push({id:p.id,text:p.text,source_quote:p.source_quote,state:p.state});else issues.push('CONDITION_MAPPING_UNPROVEN');}
  const applicableData=recordAction||analysisAction?data.filter(p=>materialRelation(p.subject,analysisAction)!=='unrelated'):[];
  if(analysisAction&&!applicableData.length)issues.push('CONDITION_MAPPING_UNPROVEN');
  for(const p of applicableData){if(materialRelation(p.subject,analysisAction)==='unproven')issues.push('CONDITION_RELATION_UNPROVEN');if(p.mapping==='recognized')conditions.push({id:p.id,text:p.text,source_quote:p.source_quote,state:p.state});else issues.push('CONDITION_MAPPING_UNPROVEN');}
  if(premises.some(p=>(recordAction&&p.kind==='authority'||activeAction&&p.kind==='time')&&p.owner!==resolvedActor))issues.push('CONDITION_OWNER_MISMATCH');
  if(passive&&Object.entries(claim.strategy??{}).some(([key,value])=>key!=='owner'&&!passiveTextCovered(value)))issues.push('OPTION_CONTENT_UNPROVEN');
  const expression=['1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)?(judgmentOptionExpression(snapshot,candidateText)??recordQualificationExpression(snapshot)):null,closedRecord=!!expression&&judgmentOptionBody(snapshot,candidateText)===expression.text&&hashFiniteJson(claim.strategy)===hashFiniteJson(expression.strategy);
  const refundRecord=recordAction&&(recordAttributionAction(goal)||candidateText.split(/[，,。；;\n]/).some(v=>recordAttributionAction(v.trim().replace(/^[-*]\s+/,'').replace(/\*\*/g,''))));
  const contentCovered=closedRecord||!(['1.8','1.9','1.10','1.11','1.12','1.13','1.14'].includes(snapshot.version)&&refundRecord)&&[candidateText,...Object.entries(claim.strategy??{}).filter(([key])=>key!=='owner').map(([,value])=>value)].every(value=>optionTextCovered(value,resolvedActor,analysisAction));
  if((recordAction||analysisAction)&&!contentCovered)issues.push('OPTION_CONTENT_UNPROVEN');
  const proposalText=[candidateText,...Object.values(claim.strategy??{})].join('\n');
  if(activeAction){const time=premises.find(p=>p.kind==='time'),available=time?.text.match(/安排(?:这)?(\d+)小时/)?.[1],demands=[...proposalText.matchAll(/(\d+)小时/g)].map(m=>m[1]!);if(/[零〇一二两三四五六七八九十百千万亿点]+(?:个)?小时/.test(proposalText)||/小时/.test(proposalText)&&!demands.length)issues.push('RESOURCE_AMOUNT_UNPROVEN');if(demands.length&&(!available||demands.some(n=>BigInt(n)>BigInt(available))))issues.push('RESOURCE_AMOUNT_UNPROVEN');}
  if(activeAction){const time=premises.find(p=>p.kind==='time'),windows=[...proposalText.matchAll(/未来([\d零〇一二两三四五六七八九十百千万]+)天/g)].map(m=>m[1]!);if(windows.length&&time?.window_supported&&time.window_source_id)capacity_refs.push(time.window_source_id);if(windows.some(value=>value!==time?.window)||windows.length&&time?.state==='met'&&!time.window_supported)issues.push('RESOURCE_WINDOW_UNPROVEN');}
  if(activeAction){
   const costText=proposalText;if(/[零〇一二两三四五六七八九十百千万亿点]+(?:元|块|人民币)|\b(?:USD|RMB|CNY)\b|[¥￥]/i.test(costText))issues.push('RESOURCE_AMOUNT_UNPROVEN');
   const demands=[...costText.matchAll(/(\d+(?:\.\d+)?)元/g)].map(m=>m[1]!);
   const cost=premises.find(p=>p.kind==='cost'),bound=cost?.mapping==='recognized'?cost.cost_limit:undefined;
   const fraction=(v:string)=>{const [n,f='']=v.split('.');return {value:BigInt(n!+f),scale:10n**BigInt(f.length)};};
   const exceeds=(a:string,b:string)=>{const x=fraction(a),y=fraction(b);return x.value*y.scale>y.value*x.scale;};
   if(demands.length){if(cost?.cost_source_id)capacity_refs.push(cost.cost_source_id);if(!bound||demands.some(n=>exceeds(n,bound)))issues.push('RESOURCE_AMOUNT_UNPROVEN');}
  }
  // No inferred action or free-form optional choice can establish qualification.
  if(!recordAction&&!analysisAction&&!passive)issues.push('OPTION_MAPPING_UNPROVEN');
 }
 const explanations:Record<string,string>={OPTION_METHOD_SOURCE_UNPROVEN:'原条目未可靠提出对应方法或完整限制，不能由改写正文或策略目标新增可采用动作。',CONCLUSION_ACTION_UNPROVEN:'本项包含尚未按策略条件核对的行动建议，不能借结论类别取得支持；原核验事实保留。',HUMAN_CHOICE_UNSUPPORTED:'没有对应的本版用户选择声明，不能据此取得建议资格。',CONDITION_WITNESS_MISMATCH:'模型条件与本版用户条件来源不一致，不能作为已满足的前提。',CONDITION_MAPPING_UNPROVEN:'本项条件表达尚不能可靠映射为本版前提，未取得建议资格。',CONDITION_RELATION_UNPROVEN:'本版资料与该建议的适用关系尚未证明，不能默认为无关或满足。',CONDITION_OWNER_MISMATCH:'建议主体与条件来源中的负责人不一致。',OPTION_CONTENT_UNPROVEN:'本项正文或建议字段含尚未证明适用的动作或条件，不能凭目标标签取得资格。',OPTION_MAPPING_UNPROVEN:'本项建议动作不在当前可核对范围内，不能沿用其它动作的条件资格。',RESOURCE_AMOUNT_UNPROVEN:'所述投入没有得到本版用户资源或费用条件的支持。',RESOURCE_WINDOW_UNPROVEN:'所述安排窗口与本版用户工时来源未对应，不能借其它单位的数字取得期限支持。'};
 const selectable=claim.kind==='strategy'&&issues.length===0&&((passive&&claim.verdict==='supported')||(conditions.length>0&&conditions.every(c=>c.state==='met')&&['supported','conditional'].includes(claim.verdict)));
 const arrangement=claim.kind==='strategy'&&recordAction&&issues.length===0&&['supported','conditional'].includes(claim.verdict)?selectable?'qualified':conditions.some(c=>c.state==='unknown')&&!conditions.some(c=>c.state==='unmet')?'pending':null:null;
 const uncoveredReview=[claim.reason,...claim.limitations,...claim.counterevidence].some(value=>!reviewExplanationCovered(value,arrangement));
 const currentExplanation=conditions.some(c=>c.state==='unmet')?'本版所需条件明确不满足，当前不作为可采用建议。':conditions.some(c=>c.state==='unknown')?'本版仍有必要条件待确认，回答后先重审；人的选择不改变这些条件。':!['supported','conditional'].includes(claim.verdict)?'本项尚未取得可采用的审查支持；原模型说明及限制保留在审查记录中。':claim.kind==='conclusion'?'本项结论保留本版已核对的内容与限制；原模型说明不作为新增行动或资格依据。':passive?'本项仅保留既有分析或等待资料，不自动执行；是否采用由人决定。':'本项范围及所需条件与本版用户陈述一致；尚未执行，是否采用由人决定。';
 return {conditions,qualification:{version:'1.0' as const,selectable,issues:[...new Set(issues)],explanation:issues.length?explanations[issues[0]!]!:uncoveredReview?currentExplanation:null,alternative:passiveTextCovered(claim.strategy?.alternatives??'')&&claim.strategy?.alternatives?claim.strategy.alternatives:'仅保留已有分析并暂缓；待条件可核对后再决定。',capacity_refs:[...new Set(capacity_refs)],premise_ids:conditions.map(c=>c.id),submitted_conditions:claim.conditions}};
}
