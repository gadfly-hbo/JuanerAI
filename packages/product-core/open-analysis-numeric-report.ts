import {computationSourceAttribution,computationClaimValue,computationNumber,validateIndependentComputation} from './open-computation.ts';
import {hashFiniteJson} from './member-task.ts';
import type {OpenNumericReport,OpenNumericValue} from '../ports/open-analysis-numeric-report.ts';
import type {OpenTaskIdentity} from '../ports/open-analysis-store.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';

type Fraction={n:bigint;d:bigint};
type NumericInput={verified_calculations:readonly import('../ports/open-analysis-store.ts').OpenQualifiedComputation[]};
type Context={includeAssetLabels?:boolean;identity:OpenTaskIdentity;sources:MemberSourceInspection;includeCorrectTrace?:boolean;includeNativePercentUnits?:boolean;includeNegatedSubjects?:boolean;includeModifiedSubjects?:boolean;includeBriefNegation?:boolean;includeModalNegation?:boolean;includeConciseFacts?:boolean;includeAssertionOnly?:boolean;includeMeasureParameters?:boolean;includeStructuredReferences?:boolean;includeTrace?:boolean;includeScopeCheck?:boolean;includeSequentialScopes?:boolean;scopeEvidence?:NumericInput;includePresentationCheck?:boolean;includeClaimCheck?:boolean|'legacy'|'single'};
const error=(code='REPORT_EVIDENCE_INVALID'):never=>{throw Object.assign(new Error(code),{code});};
const record=(v:any,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
const literal=(v:unknown)=>String(v).replace(/[<>|\r\n]/g,c=>({'<':'&lt;','>':'&gt;','|':'\\|','\r':' ','\n':' '})[c]!);
function rational(n:bigint,d:bigint):Fraction{
 if(d<=0n)error();let a=n<0n?-n:n,b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};
}
function parse(value:unknown):Fraction{
 const s=String(value);if(s.length>2000)error();
 if(/^-?\d+\/[1-9]\d*$/.test(s)){const [n,d]=s.split('/');return rational(BigInt(n!),BigInt(d!));}
 if(!/^-?\d+(\.\d+)?$/.test(s))error();const [whole,tail='']=s.split('.'),d=10n**BigInt(tail.length);return rational(BigInt(whole!)*d+(s.startsWith('-')?-1n:1n)*BigInt(tail||'0'),d);
}
const exact=(f:Fraction)=>f.d===1n?String(f.n):f.n+'/'+f.d;
function display(value:Fraction,decimals:number,percent:boolean){
 const multiplier=10n**BigInt(decimals)*(percent?100n:1n),scaled=(value.n<0n?-value.n:value.n)*multiplier;
 const quotient=scaled/value.d,remainder=scaled%value.d,rounded=quotient+(remainder*2n>=value.d?1n:0n);
 // The displayed rounding must satisfy the quotient/remainder relation.
 if(quotient*value.d+remainder!==scaled||remainder<0n||remainder>=value.d)error();
 const digits=rounded.toString().padStart(decimals+1,'0'),text=(value.n<0n&&rounded!==0n?'-':'')+(decimals?digits.slice(0,-decimals)+'.'+digits.slice(-decimals):digits);
 return text+(percent?'%':'');
}

/** Algebraic inverse check, intentionally separate from primary expression evaluation. */
export function verifyNumericOperation(op:string,a:Fraction,b:Fraction,result:Fraction){
 const {n:x,d:p}=a,{n:y,d:q}=b,{n:z,d:r}=result;
 if(op==='add')return z*p*q-x*r*q===y*r*p; // result - left = right
 if(op==='subtract')return z*p*q+y*r*p===x*r*q; // result + right = left
 if(op==='multiply')return x===0n?z===0n:z*p*q===x*y*r;
 if(op==='divide')return y!==0n&&z*y*p===x*r*q; // result * right = left
 return false;
}


function derive(raw:any,values:readonly OpenNumericValue[],context:Context):OpenNumericValue{
 if(!record(raw,['id','label','expression','format','decimals'])||!/^D[1-9]\d{0,2}$/.test(raw.id)||typeof raw.label!=='string'||!raw.label.trim()||raw.label.length>200||!['number','percent'].includes(raw.format)||!Number.isInteger(raw.decimals)||raw.decimals<0||raw.decimals>6)error();
 const references=new Set<string>(),limitations:string[]=[];let count=0;
 type Evaluated={value:Fraction|null;unit:string;currency:string|null};
 const evalExpression=(e:any,depth:number):Evaluated=>{
  if(++count>64||depth>8)error();
  if(record(e,['reference'])&&typeof e.reference==='string'){
   const f=values.find(f=>f.id===e.reference);if(!f)throw new Error('NUMERIC_REFERENCE_INVALID');if(!['independent_arithmetic','derived_formula'].includes(f.grade)||f.source_sha256!==context.identity.scope_sha256)error();references.add(f.id);
   let value=f.value===null?null:parse(f.value),unit=f.unit;
   const moneyScale=({'元':1n,'人民币元':1n,'万元':10000n,'人民币万元':10000n} as Record<string,bigint>)[unit];
   if(moneyScale){unit='元';if(value)value=rational(value.n*moneyScale,value.d);}
   if(unit==='%'){unit='比值';if(value&&f.grade!=='derived_formula')value=rational(value.n,value.d*100n);}
   return {value,unit,currency:f.currency};
  }
  if(!record(e,['op','left','right'])||!['add','subtract','multiply','divide'].includes(e.op))error();
  const a=evalExpression(e.left,depth+1),b=evalExpression(e.right,depth+1);
  if(['add','subtract'].includes(e.op)&&(a.unit!==b.unit||a.currency!==b.currency))error('NUMERIC_UNIT_CONFLICT');
  let unit=a.unit,currency=a.currency;
  if(e.op==='divide'){
   if(a.unit===b.unit&&a.currency===b.currency){unit='比值';currency=null;}
   else if(b.unit!=='比值')error('NUMERIC_UNIT_CONFLICT');
  }
  if(e.op==='multiply'){
   if(a.unit==='比值'){unit=b.unit;currency=b.currency;}else if(b.unit!=='比值')error('NUMERIC_UNIT_CONFLICT');
  }
  if(!a.value||!b.value)return {value:null,unit,currency};
  const x=a.value,y=b.value;if(e.op==='divide'&&y.n===0n){limitations.push('基期或分母为零，增长率／比例不适用。');return {value:null,unit,currency};}
  if(e.op==='divide'&&y.n<0n)limitations.push('分母为负；公式数值不自动表示业务改善，需结合基数解释。');
  const result=e.op==='add'?rational(x.n*y.d+y.n*x.d,x.d*y.d):e.op==='subtract'?rational(x.n*y.d-y.n*x.d,x.d*y.d):e.op==='multiply'?rational(x.n*y.n,x.d*y.d):rational(x.n*y.d*(y.n<0n?-1n:1n),x.d*(y.n<0n?-y.n:y.n));
  if(!verifyNumericOperation(e.op,x,y,result))error('DERIVED_VERIFICATION_FAILED');
  return {value:result,unit,currency};
 };
 const evaluated=evalExpression(raw.expression,0);if(raw.format==='percent'&&evaluated.unit!=='比值')error('NUMERIC_UNIT_CONFLICT');
 const text=evaluated.value?display(evaluated.value,raw.decimals,raw.format==='percent'):'不适用',unit=raw.format==='percent'?'%':evaluated.unit;
 return {id:raw.id,label:literal(raw.label),value:evaluated.value?exact(evaluated.value):null,display:text,unit,currency:evaluated.currency,grade:'derived_formula',status:evaluated.value?'verified':'not_applicable',scope:'派生于 '+[...references].map(id=>values.find(v=>v.id===id)!.label).join('；'),references:[...references],plan_sha256:null,result_sha256:null,source_sha256:context.identity.scope_sha256,proof_sha256:hashFiniteJson({identity:context.identity,expression:raw.expression,inputs:[...references].map(id=>values.find(v=>v.id===id)),exact:evaluated.value?exact(evaluated.value):null,format:raw.format,decimals:raw.decimals}),expression:structuredClone(raw.expression),limitations:[...limitations,'只核对操作数、公式、单位及显示舍入；不新增独立原始资料或因果证明。']};
}


/** Flatten only actual qualified claim paths; no retired plan/operator walker. */
export function qualifiedReportValues(evidence:NumericInput,context:Pick<Context,'identity'|'sources'|'includeNativePercentUnits'>):OpenNumericValue[]{
 if(context.identity.scope_sha256!==hashFiniteJson(context.sources))error('SOURCE_CHANGED');
 if(!evidence||!Array.isArray(evidence.verified_calculations))error();const values:OpenNumericValue[]=[],seen=new Set<string>();
 for(const {calculation,verification} of evidence.verified_calculations){
  if(seen.has(calculation.execution_id)||hashFiniteJson(calculation.identity)!==hashFiniteJson(context.identity))error('REPORT_EVIDENCE_INVALID');seen.add(calculation.execution_id);
  validateIndependentComputation(calculation,verification,context.sources);
  for(const claim of calculation.claims){if(claim.qualification==='source_attribution'){const quote=computationSourceAttribution(calculation,claim,verification.coverage,context.sources);values.push({id:'F'+(values.length+1),label:literal(claim.label),value:quote.text,display:quote.source_name+'／'+quote.position+'：“'+quote.text+'”',unit:claim.unit,currency:null,grade:'source_attribution',status:'verified',scope:claim.conditions.join('；'),references:[],plan_sha256:null,result_sha256:hashFiniteJson(calculation.value),source_sha256:context.identity.scope_sha256,proof_sha256:hashFiniteJson(verification),limitations:['仅核对实际原文位置与文字对应；所引观点真实性、总体、数量与因果未核验。',...verification.limits]});continue;}if(computationClaimValue(calculation.value,claim.path)===null){values.push({id:'F'+(values.length+1),label:literal(claim.label),value:null,display:'不适用',unit:claim.unit,currency:null,grade:'not_performed',status:'not_applicable',scope:claim.conditions.join('；'),references:[],plan_sha256:null,result_sha256:hashFiniteJson(calculation.value),source_sha256:context.identity.scope_sha256,proof_sha256:hashFiniteJson({identity:context.identity,path:claim.path,primary:calculation.execution_id,independent:verification.independent.execution_id,value:null}),limitations:['两次实际产物在该路径均无数值；该项没有独立算术核验资格，不是零，也不单独证明业务不适用的原因。',...claim.conditions]});continue;}const value=computationNumber(calculation.value,claim.path),number=parse(value);values.push({id:'F'+(values.length+1),label:literal(claim.label),value:exact(number),display:(number.d===1n?String(number.n):number.n!==0n&&/^-?0(?:\.0+)?$/.test(display(number,6,false))?value:display(number,6,false))+(claim.unit==='%'&&context.includeNativePercentUnits!==false?'%':''),unit:claim.unit,currency:null,grade:'independent_arithmetic',status:'verified',scope:claim.conditions.join('；')||'当前同版获准原始资料；不作额外人群或期间外推',references:[],plan_sha256:null,result_sha256:hashFiniteJson(calculation.value),source_sha256:context.identity.scope_sha256,proof_sha256:hashFiniteJson(verification),calculation_trace:{expression:calculation.method+'；实际结果路径 '+claim.path,limitation:'该描述记录实际主方法；独立方法、适用理由和原始取证覆盖另随核验凭证保存。'},limitations:[...verification.limits]});}
 }
 return values;
}
function qualifiedReportScopeTerms(evidence:NumericInput){
 const terms=new Map<string,string[]>();let index=0;for(const item of evidence.verified_calculations)for(const c of item.calculation.claims)terms.set('F'+(++index),[...c.conditions]);return terms;
}
function qualifiedReportScopeAxes(evidence:NumericInput,sources:MemberSourceInspection){
 const axes=new Map<string,Set<string>>();
 for(const fact of evidence.verified_calculations)for(const claim of fact.calculation.claims)for(const condition of claim.conditions){
  const actual=axes.get(condition)??new Set<string>();
  for(const w of fact.verification.coverage.filter(w=>w.claim_path===claim.path)){const s=sources.sources.find(s=>s.source_id===w.source_id),sheet=s?.sheets.find(sh=>sh.sheet_id===w.sheet_id);for(const row of sheet?.rows.filter(r=>w.rows.includes(r.row))??[])for(const cell of row.cells)if(w.columns.includes(cell.column)&&cell.value===condition)actual.add(w.source_id+'/'+w.sheet_id+'/'+cell.column);}
  axes.set(condition,actual);
 }
 for(const [condition,actual]of axes)if(!actual.size)axes.set(condition,new Set(['declared_condition']));return axes;
}

function nonQuantitativeLiterals(context:Context){
 const tokens=new Set<string>();
 for(const s of context.sources.sources)for(const sheet of s.sheets){
  const idColumns=new Set(sheet.rows[0]?.cells.filter(c=>/(?:编号|标识|订单号|退款号|^id$|_id$)/i.test(c.value)).map(c=>c.column));
  for(const row of sheet.rows.slice(1))for(const cell of row.cells){
   if(idColumns.has(cell.column)&&cell.value.trim())tokens.add(cell.value);
   const calendar=/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:[T ].*)?$/.exec(cell.value);
   if(calendar){const year=Number(calendar[1]),month=Number(calendar[2]),day=calendar[3]?Number(calendar[3]):null;
    if(year>0&&month>=1&&month<=12&&(day===null||day>=1&&day<=new Date(Date.UTC(year,month,0)).getUTCDate())){
     tokens.add(cell.value);tokens.add(year+'年');tokens.add(month+'月');
     tokens.add(year+'年'+month+'月');tokens.add(year+'年'+calendar[2]+'月');
     if(day!==null){tokens.add(year+'年'+month+'月'+day+'日');tokens.add(year+'年'+calendar[2]+'月'+calendar[3]+'日');}
    }
   }
  }
 }
 return [...tokens].sort((a,b)=>b.length-a.length);
}
function scopeAliases(value:string){
 const m=/^(\d{4})-(\d{2})$/.exec(value);if(!m)return [value];
 const month=Number(m[2]),zh=['','一','二','三','四','五','六','七','八','九','十','十一','十二'][month];
 return [value,m[1]+'年'+month+'月',month+'月',...(zh?[zh+'月']:[])];
}
function sequentialScopesEnabled(context:Context){
 return context.includeSequentialScopes!==false&&context.includeScopeCheck!==false&&context.includePresentationCheck!==false&&context.includeClaimCheck!==false&&context.includeClaimCheck!=='legacy'&&context.includeClaimCheck!=='single'&&context.includeStructuredReferences!==false&&context.includeNativePercentUnits!==false&&context.includeNegatedSubjects!==false&&context.includeModifiedSubjects!==false&&context.includeMeasureParameters!==false;
}
/** Coordinate identity comes from bound source columns, never inferred prose. */
/** Undefined preserves the old conservative check for ambiguous/postfix layouts. */
function sequentialScopeCheck(clause:string,aliases:{key:string;token:string}[],axes:Map<string,Set<string>>,actual:(id:string)=>string[]):boolean|undefined{
 const byToken=new Map<string,Set<string>>();
 for(const {key,token} of aliases){const keys=byToken.get(token)??new Set<string>();keys.add(key);byToken.set(token,keys);}
 if(!byToken.size)return true;
 const escape=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('\\{\\{([^{}]+)\\}\\}|'+[...byToken.keys()].map(escape).join('|'),'g');
 const active=new Map<string,string>(),pending=new Map<string,string>();let sawReference=false,sawLabel=false;
 for(const match of clause.matchAll(pattern)){
  if(match[1]){
   if(!sawLabel&&aliases.some(a=>clause.includes(a.token)))return undefined;
   if([...active.values()].some(key=>!actual(match[1]!).includes(key)))return false;
   sawReference=true;pending.clear();continue;
  }
  const keys=byToken.get(match[0])!;if(keys.size!==1)return undefined;
  const key=[...keys][0]!,dimensions=axes.get(key);if(dimensions?.size!==1)return undefined;
  const dimension=[...dimensions][0]!;
  if(pending.has(dimension)&&pending.get(dimension)!==key)return undefined;
  active.set(dimension,key);pending.set(dimension,key);sawLabel=true;
 }
 return sawReference&&pending.size===0?true:undefined;
}
function assertReportScope(content:string,values:readonly OpenNumericValue[],terms:Map<string,string[]>,axes?:Map<string,Set<string>>){
 const aliases=[...new Set([...terms.values()].flat())].flatMap(key=>scopeAliases(key).map(token=>({key,token}))).filter(x=>x.token).sort((a,b)=>b.token.length-a.token.length);
 const actual=(id:string,depth=0):string[]=>{if(depth>8)error();const base=id.split('/')[0]!,v=values.find(x=>x.id===id);return terms.has(base)?terms.get(base)!:v?.references.flatMap(ref=>actual(ref,depth+1))??[];};
 for(const clause of content.split(/[，,；;。\n、]/)){
  const ids=[...clause.matchAll(/\{\{([^{}]+)\}\}/g)].map(m=>m[1]!);if(!ids.length)continue;
  if(axes){const sequenced=sequentialScopeCheck(clause,aliases,axes,actual);if(sequenced===false)error('REPORT_SCOPE_CONFLICT');if(sequenced===true)continue;}
  let remaining=clause.replace(/\{\{[^{}]+\}\}/g,'');const mentioned=new Set<string>();
  for(const {key,token} of aliases)if(remaining.includes(token)){mentioned.add(key);remaining=remaining.split(token).join('');}
  for(const id of ids){const bound=actual(id);if([...mentioned].some(key=>!bound.includes(key)))error('REPORT_SCOPE_CONFLICT');}
 }
}
// Numerical proofs cannot grant certification of causal or business truth.
// Match the claim's subject/predicate rather than a list of sample sentences.
function unsupportedCertification(text:string,single=false,negatedSubjects=true,modifiedSubjects=true,briefNegation=false,modalNegation=false,assertionOnly=false){
 for(const clause of text.split(/[，,；;。！？!?\n]/)){
  const pattern=/(?:原因|因果(?:关系)?|业务(?:含义|口径|定义)|资料完整性|data completeness|causality|causes?|business (?:definition|meaning))([^，,；;。！？!?\n]*?)(?:验证|核验|证实|证明|verified|validated|proven|confirmed)/gi;
  const matches=single?[pattern.exec(clause)].filter(Boolean):[...clause.matchAll(pattern)];
  for(const claim of matches){
  // A negated copula before this subject also denies certification. It must
  // be adjacent: an earlier denial cannot hide a later affirmative claim.
  const prefix=clause.slice(0,claim!.index);
  if(modalNegation){const denial=prefix.match(/(?:不能|不可|无法|不得|不应)([\p{Script=Han}]{0,12})\s*$/u);if(denial&&!/(?:但|然而|且|并|已经|已被|通过|证实|证明|核验|验证)/.test(denial[1]??''))continue;}
  if(briefNegation&&/\u975e\s*$/.test(prefix))continue;
  if(negatedSubjects&&/(?:不是|并非|不构成|不代表|不能作为)\s*$/.test(prefix))continue;
  if(negatedSubjects&&modifiedSubjects){
   const negative=prefix.match(/(?:不是|并非|不构成|不代表|不能作为)((?:对|关于)[\p{Script=Han}]{0,12})?\s*$/u);
   // A nominal modifier may separate a denial from its subject. A contrast,
   // conjunction or certification predicate cannot carry that denial forward.
   if(negative&&!/(?:但|然而|且|并且|已经|已被|得到|完成|通过|证实|证明|核验|验证)/.test(negative[1]??''))continue;
  }
  const before=claim![1]!.replace(/不但|不仅|不只是/g,'');
  if(assertionOnly&&!/(?:已(?:经|被)?|经过|得到|完成|通过|\bis\b|\bare\b|\bhas been\b)/i.test(before))continue;
  // Negated, pending and interrogative claims are ordinary limitations, not
  // positive certifications. Do not hide an earlier affirmative predicate.
  if(!/(?:尚未|未|没有|不能|无法|不可|不得|不应|不代表|尚无|有待|待|需要|需|是否|能否|\bnot\b|pending|to be|needs?|cannot)/i.test(before))return true;
  }
 }
 return false;
}
function interpretationText(text:unknown,refs:readonly string[],values:readonly OpenNumericValue[],context:Context,terms:Map<string,string[]>,parameters:Map<string,string[]>=new Map()){
 if(typeof text!=='string'||!text.trim()||text.length>4000||/全部.{0,8}(?:已|独立)?核验|整份.{0,8}核验通过/.test(text))error('REPORT_UNSUPPORTED_CLAIM');
 if(context.includeScopeCheck!==false&&context.includePresentationCheck!==false&&context.includeClaimCheck!==false&&(context.includeClaimCheck==='legacy'?/(?:原因|因果(?:关系)?|业务(?:含义|口径|定义)|资料完整性)\s*(?:已经?|得到|完成)(?:独立)?(?:验证|核验|证实|证明)/.test(text as string):unsupportedCertification(text as string,context.includeClaimCheck==='single',context.includeNegatedSubjects!==false,context.includeModifiedSubjects!==false,context.includeBriefNegation===true,context.includeModalNegation===true,context.includeAssertionOnly===true)))error('REPORT_UNSUPPORTED_CLAIM');
 const permitted=(id:string)=>values.some(v=>v.id===id)&&(refs.includes(id)||context.includeStructuredReferences!==false&&refs.some(ref=>id.startsWith(ref+'/')));
 const content=context.includePresentationCheck===false?text as string:(text as string).replace(/(?<![A-Za-z0-9_/{])([FD][1-9]\d{0,2}(?:\/[A-Za-z0-9_]+)*)(?![A-Za-z0-9_/}])/g,(token,id)=>permitted(id)?'{{'+id+'}}':token);if(context.includeScopeCheck!==false&&/\{\{[^{}]+\}\}\s*(?:万元|元|美元|人民币|%|％|百分点|人|笔|件)/.test(content))error('NUMERIC_UNIT_CONFLICT');if(context.includeScopeCheck!==false)assertReportScope(content,values,terms,sequentialScopesEnabled(context)?qualifiedReportScopeAxes(context.scopeEvidence!,context.sources):undefined);let residual=content.replace(/\{\{([^{}]+)\}\}/g,(_all,id:string)=>{if(!permitted(id))error('NUMERIC_REFERENCE_INVALID');return '';});
 // Source-linked dates/identifiers are not quantities. Never accept a literal
 // amount/percentage as an ID merely because its digits also occur in data.
 if(/(?:\d|[零〇一二三四五六七八九十百千万亿])[\d.,零〇一二三四五六七八九十百千万亿]*\s*(?:元|万元|美元|人民币|%|％|百分点)/.test(residual))error('REPORT_UNBOUND_NUMBER');
 if(context.includeStructuredReferences!==false)for(const ref of refs)for(const token of parameters.get(ref.split('/')[0]!)??[])residual=residual.split(token).join('');
 for(const token of nonQuantitativeLiterals(context))residual=residual.split(token).join('');
 if(context.includePresentationCheck!==false)residual=residual.replace(/(^|\n)([ \t]*)(?:\d{1,3}[.)、．]|[（(]\d{1,3}[）)])(?=[ \t]*[^\d])/g,'$1$2').replace(/(?:版本|\bversion\s*|\bv)\s*\d+(?:\.\d+){0,3}(?=$|[\s，,；;。:：])/gi,'');
 if(/\d|[零〇一二三四五六七八九十百千万亿]+(?:人|笔|件|倍)/.test(residual))error('REPORT_UNBOUND_NUMBER');
 return literal(content).replace(/\{\{([^{}]+)\}\}/g,(_all,id:string)=>{
  const v=values.find(v=>v.id===id)!;return `[${literal(v.display)+(v.unit==='%'||v.status==='not_applicable'?'':' '+literal(v.unit))}](juanerai-number:${encodeURIComponent(id)})`;
 });
}

/** Model selects identities; the producer owns every quantitative phrase. */
function compileFactFragmentReport(doc:any,evidence:NumericInput,context:Context):OpenNumericReport{
 if(!record(doc,['version','status','interpretations'])||doc.status!=='ready'||!Array.isArray(doc.interpretations)||!doc.interpretations.length||doc.interpretations.length>32||doc.interpretations.some((i:any)=>!record(i,['fact_refs','interpretation'])||!Array.isArray(i.fact_refs)||i.fact_refs.length>32||i.fact_refs.some((id:any)=>typeof id!=='string')||new Set(i.fact_refs).size!==i.fact_refs.length||typeof i.interpretation!=='string'||(!i.fact_refs.length&&!i.interpretation.trim())))error();
 const values=qualifiedReportValues(evidence,context),issues:{code:string;reference:string|null}[]=values.filter(v=>v.grade==='not_performed').map(v=>({code:'CLAIM_NOT_NUMERIC',reference:v.id})),seen=new Set(values.map(v=>v.id));
 const paragraphs:string[]=[];
 for(const section of doc.interpretations){
  for(const id of section.fact_refs){const v=values.find(v=>v.id===id);if(!v){issues.push({code:'NUMERIC_REFERENCE_INVALID',reference:id});continue;}
   const grade=v.status==='not_applicable'?'不适用':v.grade==='independent_arithmetic'?'本项独立算术核验一致':v.grade==='derived_formula'?'公式关系已检查':'来源对应，观点未核验';
   paragraphs.push(literal(context.includeConciseFacts===false?v.label:v.label)+'：['+literal(v.display)+(v.unit==='%'||v.status==='not_applicable'?'':' '+literal(v.unit))+'](juanerai-number:'+encodeURIComponent(v.id)+')。'+grade+'。',...v.limitations.map(literal),'');
  }
  if(section.interpretation.trim())try{
   // A passed guard is not semantic verification: this lane remains MODEL.
   if(/\{\{|juanerai-number:/.test(section.interpretation))error('REPORT_UNBOUND_NUMBER');
   if(context.includeConciseFacts!==false&&context.includeAssertionOnly!==false&&/所有数字(?:均|都)?(?:已|经)[^。；]*独立[^。；]*核验/.test(section.interpretation))error('REPORT_UNSUPPORTED_CLAIM');
   const prose=interpretationText(section.interpretation,[],values,{...context,scopeEvidence:evidence,includeModalNegation:true,includeAssertionOnly:context.includeConciseFacts!==false&&context.includeAssertionOnly!==false},qualifiedReportScopeTerms(evidence));
   paragraphs.push('### AI解读 · 分析解释与推导','以下是模型的解释或建议，尚未作独立语义或因果核验。',prose,'');
  }catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:null});}
 }
 const text=['## 已核验事实','','数字、口径和范围来自本次实际计算；检查等级只适用于相应数字。','',...paragraphs,...(issues.length?['## 报告检查缺口','','部分引用或表述缺少相符依据，未采用；有效计算仍保留。']:[])].join('\n');
 const result={version:'1.0' as const,...(context.includeAssetLabels!==false&&evidence.verified_calculations.some(f=>f.verification.asset_context!==null)?{asset_label_format:'1.0' as const}:{}),reference_contract:context.includeConciseFacts===false?'1.3' as const:context.includeAssertionOnly===false?'1.4' as const:'1.5' as const,trace_format:'1.1' as const,scope_sequence:'1.0' as const,scope_contract:'2.0' as const,identity:structuredClone(context.identity),document:structuredClone(doc),values,issues,status:issues.length?'partial' as const:'complete' as const,text};
 return {...result,report_sha256:hashFiniteJson(result)};
}

export function compileNumericReport(raw:string,evidence:NumericInput,context:Context):OpenNumericReport{
 let doc:any;try{doc=JSON.parse(raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/,'$1'));}catch{error();}
 if(doc?.version==='1.5')return compileFactFragmentReport(doc,evidence,context);
 if(doc?.version==='1.4'){
  if(!record(doc,['version','status','interpretations'])||doc.status!=='ready'||!Array.isArray(doc.interpretations)||!doc.interpretations.length||doc.interpretations.length>32||doc.interpretations.some((i:any)=>!record(i,['interpretation'])||typeof i.interpretation!=='string'))error();
  const selected=new Set<string>();
  const interpretations=doc.interpretations.map((i:any)=>{const references=[...new Set<string>([...i.interpretation.matchAll(/\{\{([^{}]+)\}\}/g)].map((m:any)=>m[1]))];references.forEach(id=>selected.add(id));return {interpretation:i.interpretation,references};});
  // This public presentation version references actual current facts only.
  const derivations:unknown[]=[];
  const compiled=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations,interpretations}),evidence,{...context,includeBriefNegation:context.includeBriefNegation!==false});
  const {report_sha256,...base}=compiled;
  const split=base.text.indexOf('## 分析解释与推导'),text=base.text.slice(0,split)+base.text.slice(split).replace(/\[([^\]\n]+)\]\(juanerai-number:([^)]*)\)/g,(link,_display,id)=>{const v=base.values.find(v=>v.id===decodeURIComponent(id));return v?link+'（范围：'+literal(v.label)+'）':link;});
  const result={...base,reference_contract:context.includeBriefNegation===false?'1.1' as const:'1.2' as const,document:structuredClone(doc),text};return {...result,report_sha256:hashFiniteJson(result)};
 }
 if(!record(doc,['version','status','interpretations','derivations'])||doc.version!=='1.3'||doc.status!=='ready'||!Array.isArray(doc.interpretations)||!doc.interpretations.length||doc.interpretations.length>32||!Array.isArray(doc.derivations)||doc.derivations.length>32)error();
 context={...context,scopeEvidence:evidence};
 const values=qualifiedReportValues(evidence,context),issues:{code:string;reference:string|null}[]=values.filter(v=>v.grade==='not_performed').map(v=>({code:'CLAIM_NOT_NUMERIC',reference:v.id})),seen=new Set(values.map(v=>v.id));
 for(const raw of doc.derivations){
  try{if(seen.has(raw.id))error('NUMERIC_REFERENCE_INVALID');seen.add(raw.id);const derived=derive(raw,values,context);if(context.includePresentationCheck!==false)interpretationText(raw.label+' {{'+derived.id+'}}',[derived.id], [...values,derived],context,qualifiedReportScopeTerms(evidence));values.push(derived);}
  catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:typeof raw?.id==='string'?raw.id:null});}
 }
 const paragraphs:string[]=[];
 for(const item of doc.interpretations){
  try{if(!record(item,['references','interpretation'])||!Array.isArray(item.references)||item.references.length>32||item.references.some((id:unknown)=>typeof id!=='string'||!values.some(v=>v.id===id)))error('NUMERIC_REFERENCE_INVALID');paragraphs.push(interpretationText(item.interpretation,item.references,values,context,qualifiedReportScopeTerms(evidence)));}
  catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:null});}
 }
 const base=values.filter(v=>v.grade!=='derived_formula'),derived=values.filter(v=>v.grade==='derived_formula');
 const rows=base.map(v=>`| ${v.label} | [${literal(v.display)}](juanerai-number:${encodeURIComponent(v.id)}) | ${literal(v.unit)} | ${v.grade==='source_attribution'?'来源对应核对':v.grade==='not_performed'?'未核验／无适用数值':'本行范围独立核算一致'} |`);
 const important=[...new Set(values.flatMap(v=>v.limitations.filter(l=>l.startsWith('两表存在')||l.startsWith('含负金额'))))];
 const text=['## 已核验事实','','仅核对下列当前资料、口径与范围；不代表整个报告或因果通过。','','| 实际范围 | 结果 | 单位 | 检查范围 |','| --- | --- | --- | --- |',...rows,'',...(important.length?[...important,'']:[]),...(derived.length?['## 派生公式已核验','',...derived.map(v=>`${v.label}：[${literal(v.display)+(v.unit==='%'||v.status==='not_applicable'?'':' '+literal(v.unit))}](juanerai-number:${encodeURIComponent(v.id)})${v.status==='not_applicable'?'（分母为零或输入不适用）':''}。${v.limitations.filter(l=>!l.startsWith('只核对')).join('')}`),'']:[]), '## 分析解释与推导','','以下为 Agent 的解释、假说和限制，未作独立语义或因果核验。','',...paragraphs,...(issues.length?['','## 报告检查缺口','','部分数值主张或公式缺少相符依据，未采用；已有效的计算结果保留，可查看数字依据与执行记录。']:[])].join('\n');
 const result={version:'1.0' as const,...(context.includeAssetLabels!==false&&evidence.verified_calculations.some(f=>f.verification.asset_context!==null)?{asset_label_format:'1.0' as const}:{}),...(sequentialScopesEnabled(context)?{scope_sequence:'1.0' as const}:{}),...(context.includeCorrectTrace!==false?{trace_format:'1.1' as const}:{}),...(context.includeScopeCheck!==false?{scope_contract:context.includePresentationCheck===false?'1.1' as const:context.includeClaimCheck===false?'1.2' as const:context.includeClaimCheck==='legacy'?'1.3' as const:context.includeClaimCheck==='single'?'1.4' as const:context.includeStructuredReferences===false?'1.5' as const:context.includeNativePercentUnits===false?'1.6' as const:context.includeNegatedSubjects===false?'1.7' as const:context.includeModifiedSubjects===false?'1.8' as const:context.includeMeasureParameters===false?'1.9' as const:'2.0' as const}:{}),identity:structuredClone(context.identity),document:structuredClone(doc),values,issues,status:issues.length?'partial' as const:'complete' as const,text};
 return {...result,report_sha256:hashFiniteJson(result)};
}

export function validateNumericReport(report:OpenNumericReport,evidence:NumericInput,context:Context){
 if(report.asset_label_format!==undefined&&report.asset_label_format!=='1.0')error('NUMERIC_REPORT_CHANGED');
 context={...context,includeAssetLabels:report.asset_label_format==='1.0'};
 if((report.document as any)?.version==='1.5'){const actual=compileNumericReport(JSON.stringify(report.document),evidence,{...context,includeConciseFacts:report.reference_contract!=='1.3',includeAssertionOnly:report.reference_contract==='1.5'});if(hashFiniteJson(actual)!==hashFiniteJson(report))error('NUMERIC_REPORT_CHANGED');return actual;}
 const actual=compileNumericReport(JSON.stringify(report.document),evidence,{...context,includeBriefNegation:report.reference_contract==='1.2',includeSequentialScopes:report.scope_sequence==='1.0',includeCorrectTrace:report.trace_format==='1.1',includeMeasureParameters:report.scope_contract==='2.0',includeModifiedSubjects:['1.9','2.0'].includes(report.scope_contract??''),includeNegatedSubjects:['1.8','1.9','2.0'].includes(report.scope_contract??''),includeNativePercentUnits:['1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeStructuredReferences:['1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeTrace:report.values.some(v=>Object.hasOwn(v,'calculation_trace')),includeScopeCheck:['1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includePresentationCheck:['1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeClaimCheck:report.scope_contract==='1.3'?'legacy':report.scope_contract==='1.4'?'single':['1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??'')});if(hashFiniteJson(actual)!==hashFiniteJson(report))error('NUMERIC_REPORT_CHANGED');return actual;
}



/** Current producer owns quantitative prose. Legacy prompts stay checkpoint-bound. */
export const factFragmentReportEditSystem=`你是JuanerAI报告解读者，只解释本次实际成果。可读取已批准资源、用原生写入/编辑组装报告草稿，不重新计算。fact_fragments是后台将呈现的完整数字事实：指标名称、来源、范围、值和单位不能由你重命名。选择回答当前问题需要的fact_refs，按重要性组织段落；差额和比例也须引用本次实际核验的主张；报告阶段不按标签、顺序或旧方法目录补造计算。每段后台先呈现所选完整事实，再呈现你的interpretation。
numeric_facts是本次真正成立的逐主张证据，scope、unit、calculation_trace及limitations共同限定其适用范围。缺少的计算不口算或补造，资料原字段只证明字段存在，不证明业务含义、归属或因果。collaboration只有returned才是已返回的MODEL意见，不能代替计算与独立核验；以当前实际源版本和核验凭证为准。不得预先断言特定订单、退款或关联已核对。
interpretation只写不带具体数字、不带占位符的中文解释、待证假说、限制或建议。不要重新叙述数值、范围比较或核验等级，数字事实由后台完整呈现。若要说明另一项数字，选择其引用，不在解释里改名。不得把毛额称净额、局部称总体、类别差异称跨期变化；证据不足准确说明未知和需要的业务记录，不编造原因。模型解释不是已验证的事实、因果、资料完整性或行动，不称整份报告通过。source_summary只表示根任务选定表头；子调查缺项不等于根资料缺项。collaboration只有returned是已返回MODEL观点，仍非独立证据；不编造失败或UNKNOWN任务的结果。历史准备或委派要求不表示当前没计算。保留有效部分和重要限制；不适用就如实说明，不把缺项称零。
仅输出完整JSON，无草稿、思考、围栏或前后说明：{"version":"1.5","status":"ready","interpretations":[{"fact_refs":["F1"],"interpretation":"原因尚不能确定，需要补充业务记录。"}]}。只用上述字段。每段fact_refs可空，interpretation可空，但不能同时空。实际引用须逐字复制当前fact_fragments中的reference_id，不套用示例ID、截断或拼接。通常三到五段，答案优先，解释简洁，先保证完整JSON。不得添加自由label、value、grade、derivations、references字段，不填金额、比例或数量字面值，不在interpretation使用{{引用}}。`;

/** Portable copy keeps same checked identities; local interactive URLs become readable values. */
export function numericReportCheckName(grade:OpenNumericValue['grade']){return {independent_arithmetic:'独立算术',derived_formula:'派生公式',source_attribution:'来源对应',not_performed:'未核验',assumption:'业务假设'}[grade];}
export function numericReportCopy(report:OpenNumericReport){
 const text=report.text.replace(/\[([^\]\n]+)\]\(juanerai-number:[^)]+\)/g,'$1');
 return text+'\n\n## 数字依据与检查范围\n\n'+report.values.map(v=>[
  '### '+v.label,v.display+(v.unit==='%'||v.status==='not_applicable'?'':' '+v.unit),'精确值：'+(v.value??'不适用'),
  '检查：'+numericReportCheckName(v.grade),
  '范围：'+v.scope,'版本：'+report.identity.revision,...(v.calculation_trace?['计算：'+v.calculation_trace.expression,v.calculation_trace.limitation]:[]),
  ...(v.expression?['公式：'+JSON.stringify(v.expression),'输入：'+v.references.map(id=>{const x=report.values.find(x=>x.id===id);return x?x.label+' = '+x.value+' '+x.unit:id;}).join('；')]:[]),
  '材料身份：'+v.source_sha256,'计划身份：'+(v.plan_sha256??'派生于输入'),'结果身份：'+(v.result_sha256??'派生于输入'),'核验身份：'+v.proof_sha256,...v.limitations,''
 ].join('\n')).join('\n')+'\n报告身份：'+report.report_sha256+'\n';
}
