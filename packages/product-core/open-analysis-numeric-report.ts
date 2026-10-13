import {netSalesMetrics} from './metric-assets.ts';
import {traceOpenJoinIR} from './open-analysis-join.ts';
import {taskHash} from './member-task.ts';
import {groundedReportFacts,reportPlan,reportFactFragmentLabel} from './open-analysis-report-review.ts';
import type {OpenNumericReport,OpenNumericValue} from '../ports/open-analysis-numeric-report.ts';
import type {OpenAnalysisRun} from '../ports/open-analysis-runtime.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';

type Fraction={n:bigint;d:bigint};
type NumericInput={verified_calculations:readonly any[]};
type Context={includeAssetLabels?:boolean;identity:OpenAnalysisRun['identity'];sources:MemberSourceInspection;includeCorrectTrace?:boolean;includeNativePercentUnits?:boolean;includeNegatedSubjects?:boolean;includeModifiedSubjects?:boolean;includeBriefNegation?:boolean;includeModalNegation?:boolean;includeConciseFacts?:boolean;includeAssertionOnly?:boolean;includeMeasureParameters?:boolean;includeStructuredReferences?:boolean;includeTrace?:boolean;includeScopeCheck?:boolean;includeSequentialScopes?:boolean;scopeEvidence?:NumericInput;includePresentationCheck?:boolean;includeClaimCheck?:boolean|'legacy'|'single'};
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

/** Catalog contains only actual current proof identities, never a model's claimed grade. */
export function numericReportFacts(evidence:NumericInput,context:Context):OpenNumericValue[]{
 if(taskHash(context.sources)!==context.identity.scope_sha256)error('SOURCE_CHANGED');
 const facts:OpenNumericValue[]=[];
 for(const f of groundedReportFacts(evidence)){
  const original=evidence.verified_calculations.find(p=>taskHash(p.execution_plan)===taskHash(f.execution_plan)),p=original?.execution_plan,c=original?.calculation,v=original?.verification;
  if(!p||!c||!v||v.plan_sha256!==taskHash(p)||c.plan_sha256!==taskHash(p)||v.result_sha256!==taskHash(c)||v.inspection_sha256!==context.identity.scope_sha256||c.inspection_sha256!==context.identity.scope_sha256||v.value!==c.value||v.rows!==c.rows||!['independent_arithmetic','source_attribution'].includes(v.grade))error();
  const joined=p.version==='1.8'?p.base:p;const trace=context.includeTrace!==false&&joined?.version==='1.7'?traceOpenJoinIR(joined,context.sources,p.measure):null;if(trace&&(trace.result.value!==c.value||p.unit!==c.unit))error('VERIFICATION_FAILED');
  const scope=reportPlan(p,context.sources)+(f.group_key!==null?' · '+literal(f.group_key):''),currency=p.asset_analysis?.parameters.currency??p.measure?.currency??p.membership?.semantics?.currency??null;
  const add=(value:unknown,path:string[],unit:string,grade:OpenNumericValue['grade'],shown?:string,visibleLabel?:string)=>{
   const notApplicableFormula=joined?.version==='2.4'&&value===null||joined?.version==='2.1'&&path.at(-1)==='贡献占比'&&value==='null'&&c.comparison?.total_change==='0'||joined?.version==='2.0'&&value==='null'&&c.relation?.total==='0'||joined?.version==='1.9'&&value==='null'&&(f.group_key===null?c.weighted?.weight_total:c.weighted?.groups?.find((g:{key:string;weight_total:string})=>g.key===f.group_key)?.weight_total)==='0';
   let parsed:Fraction|null=null;if(grade!=='source_attribution'&&!notApplicableFormula){try{parsed=parse(value);}catch{return;}}
   const normalized=parsed?exact(parsed):String(value),id=f.reference_id+(path.length?'/'+path.join('/'):'');
   const amount=parsed&&path.at(-1)?.endsWith('_fen')?rational(parsed.n,parsed.d*100n):parsed;
   const raw=notApplicableFormula?null:amount?exact(amount):normalized;
   const weighted=context.includeTrace!==false&&joined?.version==='1.9'?c.weighted:null,operand=weighted?.groups?.find((x:{key:string;numerator:string;weight_total:string})=>x.key===(f.group_key??''))??(f.group_key===null?weighted:null);
   const weightedTrace=operand?{expression:'Σ(数值 × 权重) / Σ权重 = ('+operand.numerator+') / ('+operand.weight_total+')'+(p.measure?' × '+p.measure.inputs[0]!.scale+' / '+p.measure.output_scale:'')+(notApplicableFormula?'：权重总额为零，不适用':' = '+f.value+' '+unit),limitation:'本项分子、权重总额和结果均由原资料独立重算核对；不证明权重业务选择、资料完整性或因果。'}:null;
   const shareAmount=c.relation?.amounts?.groups?.find((g:{key:string;value:string})=>g.key===f.group_key),shareTrace=context.includeTrace!==false&&joined?.version==='2.0'&&shareAmount?{expression:'分组金额 ('+shareAmount.value+') / 总体金额 ('+c.relation!.total+') × 100'+(notApplicableFormula?'：分母为0，不适用':' = '+f.value+' %'),limitation:'按同一实际来源与筛选重核各分组及总体金额，再独立检查比例关系；不证明外部总体完整、业务定义或因果。'}:null;
   const compared=joined?.version==='2.1'?c.comparison?.groups?.find((g:{key:string})=>g.key===f.group_key):null,comparisonTrace=context.includeTrace!==false&&compared?{expression:path.at(-1)==='贡献占比'?'分组变化 ('+compared.change+') / 总体变化 ('+c.comparison.total_change+') × 100'+(notApplicableFormula?'：总变化为零，不适用':' = '+raw+' %'):path.length?'本项原资料聚合与变化关系已独立检查：'+raw+' '+unit:(context.includeCorrectTrace===false?'('+compared.current+') − ('+compared.baseline+')':'(('+compared.current+') − ('+compared.baseline+'))')+(p.measure?' × '+p.measure.inputs[0]!.scale+' / '+p.measure.output_scale:'')+' = '+raw+' '+unit,limitation:'两侧原资料分别独立重算，差额、分组加总关系与贡献比例经检查；贡献不是因果证明，业务口径与资料完整性仍有边界。'}:null;
   const allocationWeight=joined?.version==='2.2'?c.allocation?.weights?.groups?.find((g:{key:string})=>g.key===f.group_key):null,allocationTrace=context.includeTrace!==false&&allocationWeight?{expression:'成本池 ('+c.allocation.pool.value+') × 对象权重 ('+allocationWeight.value+') / 权重总额 ('+c.allocation.weight_total+') → '+raw+' '+unit+'；保留'+joined.rounding.decimals+'位小数，最大余数分配，余数相同按对象键排序',limitation:'成本池与权重从原资料独立重核；逐对象比例、余数分配与总额守恒均检查。业务分摊依据及税务合规不在本核验范围。'}:null;
   const reconciled=joined?.version==='2.3'?c.reconciliation?.entries?.find((e:{key:string})=>e.key===f.group_key):null,reconciliationTrace=context.includeTrace!==false&&reconciled?{expression:(context.includeCorrectTrace===false?(reconciled.left??'无左侧匹配记录')+' − '+(reconciled.right??'无右侧匹配记录'):'(('+ (reconciled.left??'0') +') − ('+(reconciled.right??'0')+'))')+(p.measure?' × '+p.measure.inputs[0]!.scale+' / '+p.measure.output_scale:'')+' = '+raw+' '+unit+'；状态 '+({matched:'匹配且金额一致',difference:'匹配但金额不同',left_only:'左侧独有／右侧漏配',right_only:'右侧独有／左侧漏配'}[reconciled.state as 'matched'|'difference'|'left_only'|'right_only']),limitation:'左右原资料按键独立核对金额、行数和差额；无匹配记录只是差额计算中的缺项，不冒称实际金额为零。差异结果可靠不等于账目一致。'}:null;
   const component=trace?.components.find(x=>x.key===(f.group_key??'')),calculation_trace=reconciliationTrace??allocationTrace??comparisonTrace??shareTrace??weightedTrace??(component?{expression:component.gross+' − '+component.refund+' = '+component.net+' '+unit,limitation:'这是同范围主计算分解，不是新增独立核验；净额另有原始资料独立重算凭证。'}:null);
   facts.push({...(calculation_trace?{calculation_trace}:{}),id,label:visibleLabel??scope+(path.length?' · '+path.join(' / '):''),value:raw,display:notApplicableFormula?(joined?.version==='2.4'?'证据不足（支付队列分母为零）':joined?.version==='2.1'?'不适用（总体变化为零）':joined?.version==='2.0'?'不适用（总体金额为零）':'不适用（权重总额为零）'):shown??(amount?display(amount,amount.d===1n?0:2,false)+(unit==='%'&&context.includeNativePercentUnits!==false?'%':''):literal(raw)),unit:amount&&path.at(-1)?.endsWith('_fen')?'元':unit,currency,grade,status:notApplicableFormula?'not_applicable':'verified',scope,references:[],plan_sha256:taskHash(p),result_sha256:taskHash(c),source_sha256:context.identity.scope_sha256,proof_sha256:taskHash({identity:context.identity,plan:p,result:c,verification:v,group:f.group_key,path}),limitations:[...(joined?.version==='2.0'&&(c.relation?.amounts?.groups?.some((g:{value:string})=>g.value.startsWith('-'))||c.relation?.total?.startsWith('-'))?['含负金额或负分母，金额占比可为负或超出100%；不是人数／互斥市场份额。']:[]),...(reconciled?[c.reconciliation.balanced?'当前选定键与金额一致；不证明外部账目完整。':'两表存在金额差异或漏配，账目不一致；核验仅确认实际差异。']:[]),grade==='source_attribution'?'只核对来源原文，不证明观点、算术或因果。':'独立算术一致不证明业务定义、资料完整性或因果。']});
  };
  if(joined?.version==='2.4'){
   const analysis=c.asset_analysis;if(!analysis||f.group_key!==null)error('VERIFICATION_FAILED');
   const units=(name:string)=>name==='refund_rate'?'比值':['order_count','refunded_order_count'].includes(name)?'单':String(f.unit);
   const metrics=(values:Record<string,string|null>,path:string[],label:string)=>{for(const name of netSalesMetrics)if(Object.hasOwn(values,name)){const metric=joined.asset_analysis.asset.metrics.find((m:{name:string;display_name:string})=>m.name===name);if(!metric)error('VERIFICATION_FAILED');add(values[name],[...path,name],units(name),'independent_arithmetic',undefined,context.includeAssetLabels===false?undefined:label+' · '+literal(metric.display_name));}};
   metrics(analysis.total.metrics,['总体'],'总体');
   for(const [i,bucket] of analysis.weekly.entries())metrics(bucket.metrics,['周',String(i)],'周 '+literal(bucket.label));
   for(const [i,bucket] of analysis.periods.entries()){metrics(bucket.metrics,['期间',String(i)],literal(bucket.label));for(const group of bucket.groups)metrics(group.metrics,['期间',String(i),'category',group.key],literal(bucket.label)+' · 分类 '+literal(group.key));}
   for(const group of analysis.total.groups)metrics(group.metrics,['总体','category',group.key],'总体 · 分类 '+literal(group.key));
   metrics(analysis.delta,['描述性变化'],'描述性变化');
   for(const group of analysis.group_delta)metrics(group,['描述性变化','category',group.key],'描述性变化 · 分类 '+literal(group.key));
   for(const fact of facts.filter(x=>x.plan_sha256===taskHash(p))){const index=facts.indexOf(fact);facts[index]={...fact,limitations:[...analysis.limitations,...fact.limitations]};}
   continue;
  }
  if(joined?.version==='2.1'){const group=c.comparison?.groups?.find((g:{key:string})=>g.key===f.group_key);if(!group)error('VERIFICATION_FAILED');const convert=(s:string)=>{const q=parse(s);return p.measure?exact(rational(q.n*BigInt(p.measure.inputs[0]!.scale),q.d*BigInt(p.measure.output_scale))):s;};add(f.value,[],String(f.unit),'independent_arithmetic');add(convert(group.baseline),['比较期金额'],String(f.unit),'independent_arithmetic');add(convert(group.current),['本期金额'],String(f.unit),'independent_arithmetic');add(group.share,['贡献占比'],'%','independent_arithmetic');continue;}
  if(v.grade==='source_attribution'){add(f.value,[],String(f.unit),'source_attribution');continue;}
  const walk=(value:any,path:string[],depth:number)=>{
   if(depth>12)error();if(value&&typeof value==='object'){
    if(record(value,['numerator','denominator'])&&Object.hasOwn(value,'numerator')&&Object.hasOwn(value,'denominator')){if(String(value.denominator)==='0')return;add(value.numerator+'/'+value.denominator,path,'比值','independent_arithmetic');return;}
    for(const [key,item] of Object.entries(value))walk(item,[...path,key],depth+1);return;
   }
   add(value,path,path.at(-1)?.includes('member_count')?'人':String(f.unit),'independent_arithmetic');
  };
  let parsed:any=f.value;if(typeof f.value==='string'&&/^[\[{]/.test(f.value))try{parsed=JSON.parse(f.value);}catch{}walk(parsed,[],0);
 }
 if(facts.length>512)error();return facts;
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
 return {id:raw.id,label:literal(raw.label),value:evaluated.value?exact(evaluated.value):null,display:text,unit,currency:evaluated.currency,grade:'derived_formula',status:evaluated.value?'verified':'not_applicable',scope:'派生于 '+[...references].map(id=>values.find(v=>v.id===id)!.label).join('；'),references:[...references],plan_sha256:null,result_sha256:null,source_sha256:context.identity.scope_sha256,proof_sha256:taskHash({identity:context.identity,expression:raw.expression,inputs:[...references].map(id=>values.find(v=>v.id===id)),exact:evaluated.value?exact(evaluated.value):null,format:raw.format,decimals:raw.decimals}),expression:structuredClone(raw.expression),limitations:[...limitations,'只核对操作数、公式、单位及显示舍入；不新增独立原始资料或因果证明。']};
}

/** Actual same-basis coordinates, never model-assigned scope names. */
export function scopedNumericReportComparisons(evidence:NumericInput,context:Context){
 const values=numericReportFacts(evidence,context),unique=new Set<string>(),items:any[]=[];
 const field=(p:any,column:string)=>{const source=context.sources.sources.find(s=>s.source_id===p.source_id),sheet=source?.sheets.find(s=>s.sheet_id===p.sheet_id);return {key:[p.source_id,p.sheet_id,column].join('/'),field:[source?.display_name,sheet?.name,sheet?.rows.find(r=>r.row===1)?.cells.find(c=>c.column===column)?.value??column].join('／')};};
 for(const fact of groundedReportFacts(evidence)){
  const value=values.find(v=>v.id===fact.reference_id);if(!value||value.grade!=='independent_arithmetic'||value.status!=='verified')continue;
  const coords=new Map<string,{key:string;field:string;value:string}>();let valid=true;
  const add=(p:any,column:string,v:unknown)=>{if(typeof v!=='string'||!p.source_id||!p.sheet_id){valid=false;return;}const f=field(p,column),old=coords.get(f.key);if(old&&old.value!==v)valid=false;coords.set(f.key,{...f,value:v});};
  // Binding/context digests identify a particular plan, not a mathematical
  // measure. Their validity was checked above; retain source identity and all
  // executable method/measure/mapping parameters in the comparable basis.
  const basis=(p:any):any=>{const {goal,group_by,filters,binding_sha256,context_sha256,...rest}=p;
   for(const f of filters??[])if(f.operator==='eq')add(p,f.column,f.value);
   return {...rest,...(filters?{filters:filters.filter((f:any)=>f.operator!=='eq')}:{}),...(p.inputs?{inputs:p.inputs.map(basis)}:{}),...(p.base?{base:basis(p.base)}:{})};
  };
  const bound=basis(fact.execution_plan),base=fact.execution_plan.base??fact.execution_plan,primary=base.inputs?.[0]??base,group=base.group_by??primary.group_by;
  if(group){const columns=Array.isArray(group)?group:[group];let key:any=fact.group_key;try{if(typeof key==='string'&&/^[\[{]/.test(key))key=JSON.parse(key);}catch{valid=false;}
   const keys=columns.length===1&&typeof key==='string'?[key]:Array.isArray(key)?key:[];
   if(keys.length!==columns.length)valid=false;else columns.forEach((c:any,i:number)=>typeof c==='string'?add(primary,c,keys[i]):valid=false);
  }else if(fact.group_key!==null)valid=false;
  if(!valid)continue;
  const coordinates=[...coords.values()].sort((a,b)=>a.key.localeCompare(b.key)),signature=taskHash({bound,unit:value.unit,currency:value.currency}),identity=taskHash({signature,coordinates,value:value.value});
  if(unique.has(identity))continue;unique.add(identity);items.push({value,signature,coordinates,method:base.join?.kind??base.operation??base.version});
 }
 const comparisons:any[]=[],derivations:any[]=[];let truncated=false;
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  let left=items[i],right=items[j];if(left.signature!==right.signature||left.coordinates.length!==right.coordinates.length||left.coordinates.some((c:any,k:number)=>c.key!==right.coordinates[k]?.key))continue;
  const changed=left.coordinates.filter((c:any,k:number)=>c.value!==right.coordinates[k].value);if(changed.length!==1)continue;
  if(derivations.length>=32){truncated=true;continue;}
  // Deterministic textual ordering is presentation, not inferred time or value
  // priority. The actual left/right coordinates remain explicit in the catalog.
  if(changed[0].value>right.coordinates.find((c:any)=>c.key===changed[0].key).value)[left,right]=[right,left];
  const axis=left.coordinates.find((c:any)=>c.key===changed[0].key),other=right.coordinates.find((c:any)=>c.key===axis.key),fixed=left.coordinates.filter((c:any)=>c.key!==axis.key),id='D'+(derivations.length+1),rateID='D'+(derivations.length+2);
  const method=({refund_net:'订单金额减关联退款',sum:'求和',count:'行数',mean:'均值',weighted_mean:'加权平均',min:'最小值',max:'最大值'} as Record<string,string>)[left.method]??String(left.method);
  const label=method+'；'+fixed.map((c:any)=>c.field.split('／').at(-1)+'='+c.value).join('；')+'；'+axis.field.split('／').at(-1)+'：'+other.value+' 减 '+axis.value;
  if(label.length>180){truncated=true;continue;}
  const difference={id,label:label+' 差额',expression:{op:'subtract',left:{reference:right.value.id},right:{reference:left.value.id}},format:'number',decimals:2};
  const rate={id:rateID,label:label+' 相对前列变化率',expression:{op:'divide',left:{reference:id},right:{reference:left.value.id}},format:'percent',decimals:2};
  const d=derive(difference,values,context),r=derive(rate,[...values,d],context);
  derivations.push(difference,rate);comparisons.push({left:left.value.id,right:right.value.id,method:left.method,fixed_coordinates:fixed,changed_coordinate:{field:axis.field,left:axis.value,right:other.value},difference:d,rate:r});
 }
 return {comparisons,derivations,truncated};
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
function reportScopeTerms(evidence:NumericInput){
 const terms=new Map<string,string[]>();
 const leaves=(p:any):any[]=>p.base?leaves(p.base):p.inputs?p.inputs.flatMap(leaves):[p];
 for(const f of groundedReportFacts(evidence)){
  let group:unknown=f.group_key;try{if(typeof group==='string'&&/^[\[{]/.test(group))group=JSON.parse(group);}catch{}
  const keys=(group===null?[]:Array.isArray(group)?group:group&&typeof group==='object'?Object.values(group):[group]).filter(x=>typeof x==='string').map(String);
  const filters=leaves(f.execution_plan).flatMap(p=>(p.filters??[]).filter((x:any)=>x.operator==='eq').map((x:any)=>String(x.value)));
  terms.set(f.reference_id,[...new Set([...keys,...filters])]);
 }
 return terms;
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
function reportScopeAxes(evidence:NumericInput){
 const axes=new Map<string,Set<string>>();
 const add=(value:unknown,p:any,column:unknown)=>{
  if(typeof value!=='string'||typeof column!=='string'||!p.source_id||!p.sheet_id)return;
  const axis=p.source_id+'/'+p.sheet_id+'/'+column,set=axes.get(value)??new Set<string>();set.add(axis);axes.set(value,set);
 };
 const leaves=(p:any):any[]=>p.base?leaves(p.base):p.inputs?p.inputs.flatMap(leaves):[p];
 for(const fact of groundedReportFacts(evidence)){
  const fields=leaves(fact.execution_plan),field=fields[0],group=field?.group_by;
  let key:any=fact.group_key;try{if(typeof key==='string'&&/^[\[{]/.test(key))key=JSON.parse(key);}catch{}
  const columns=Array.isArray(group)?group:group?[group]:[];
  if(columns.length===1&&typeof key==='string')add(key,field,columns[0]);
  else if(Array.isArray(key)&&key.length===columns.length)key.forEach((value,index)=>add(value,field,columns[index]));
  // Object group layouts have no positional guarantee: keep the old check.
  for(const f of fields)for(const filter of f.filters??[])if(filter.operator==='eq')add(String(filter.value),f,filter.column);
 }
 return axes;
}
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
 const content=context.includePresentationCheck===false?text as string:(text as string).replace(/(?<![A-Za-z0-9_/{])([FD][1-9]\d{0,2}(?:\/[A-Za-z0-9_]+)*)(?![A-Za-z0-9_/}])/g,(token,id)=>permitted(id)?'{{'+id+'}}':token);if(context.includeScopeCheck!==false&&/\{\{[^{}]+\}\}\s*(?:万元|元|美元|人民币|%|％|百分点|人|笔|件)/.test(content))error('NUMERIC_UNIT_CONFLICT');if(context.includeScopeCheck!==false)assertReportScope(content,values,terms,sequentialScopesEnabled(context)?reportScopeAxes(context.scopeEvidence!):undefined);let residual=content.replace(/\{\{([^{}]+)\}\}/g,(_all,id:string)=>{if(!permitted(id))error('NUMERIC_REFERENCE_INVALID');return '';});
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
 const catalog=scopedNumericReportComparisons(evidence,context),selected=new Set<string>(doc.interpretations.flatMap((i:any)=>i.fact_refs));
 const values=numericReportFacts(evidence,context),issues:{code:string;reference:string|null}[]=[],seen=new Set(values.map(v=>v.id));
 for(const d of catalog.derivations.filter(d=>selected.has(d.id)||catalog.derivations.some(r=>selected.has(r.id)&&r.expression?.left?.reference===d.id))){
  if(seen.has(d.id))error('NUMERIC_REFERENCE_INVALID');values.push(derive(d,values,context));seen.add(d.id);
 }
 const paragraphs:string[]=[];
 for(const section of doc.interpretations){
  for(const id of section.fact_refs){const v=values.find(v=>v.id===id);if(!v){issues.push({code:'NUMERIC_REFERENCE_INVALID',reference:id});continue;}
   const grade=v.status==='not_applicable'?'不适用':v.grade==='independent_arithmetic'?'本项独立算术核验一致':v.grade==='derived_formula'?'公式关系已检查':'来源对应，观点未核验';
   paragraphs.push(literal(context.includeConciseFacts===false?v.label:reportFactFragmentLabel(v,evidence,context.sources))+'：['+literal(v.display)+(v.unit==='%'||v.status==='not_applicable'?'':' '+literal(v.unit))+'](juanerai-number:'+encodeURIComponent(v.id)+')。'+grade+'。',...v.limitations.map(literal),'');
  }
  if(section.interpretation.trim())try{
   // A passed guard is not semantic verification: this lane remains MODEL.
   if(/\{\{|juanerai-number:/.test(section.interpretation))error('REPORT_UNBOUND_NUMBER');
   if(context.includeConciseFacts!==false&&context.includeAssertionOnly!==false&&/所有数字(?:均|都)?(?:已|经)[^。；]*独立[^。；]*核验/.test(section.interpretation))error('REPORT_UNSUPPORTED_CLAIM');
   const prose=interpretationText(section.interpretation,[],values,{...context,scopeEvidence:evidence,includeModalNegation:true,includeAssertionOnly:context.includeConciseFacts!==false&&context.includeAssertionOnly!==false},reportScopeTerms(evidence));
   paragraphs.push('### AI解读 · 分析解释与推导','以下是模型的解释或建议，尚未作独立语义或因果核验。',prose,'');
  }catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:null});}
 }
 const text=['## 已核验事实','','数字、口径和范围来自本次实际计算；检查等级只适用于相应数字。','',...paragraphs,...(issues.length?['## 报告检查缺口','','部分引用或表述缺少相符依据，未采用；有效计算仍保留。']:[])].join('\n');
 const result={version:'1.0' as const,...(context.includeAssetLabels!==false&&evidence.verified_calculations.some(p=>p.execution_plan.version==='2.4')?{asset_label_format:'1.0' as const}:{}),reference_contract:context.includeConciseFacts===false?'1.3' as const:context.includeAssertionOnly===false?'1.4' as const:'1.5' as const,trace_format:'1.1' as const,scope_sequence:'1.0' as const,scope_contract:'2.0' as const,identity:structuredClone(context.identity),document:structuredClone(doc),values,issues,status:issues.length?'partial' as const:'complete' as const,text};
 return {...result,report_sha256:taskHash(result)};
}

export function compileNumericReport(raw:string,evidence:NumericInput,context:Context):OpenNumericReport{
 let doc:any;try{doc=JSON.parse(raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/,'$1'));}catch{error();}
 if(doc?.version==='1.5')return compileFactFragmentReport(doc,evidence,context);
 if(doc?.version==='1.4'){
  if(!record(doc,['version','status','interpretations'])||doc.status!=='ready'||!Array.isArray(doc.interpretations)||!doc.interpretations.length||doc.interpretations.length>32||doc.interpretations.some((i:any)=>!record(i,['interpretation'])||typeof i.interpretation!=='string'))error();
  const catalog=scopedNumericReportComparisons(evidence,context),selected=new Set<string>();
  const interpretations=doc.interpretations.map((i:any)=>{const references=[...new Set<string>([...i.interpretation.matchAll(/\{\{([^{}]+)\}\}/g)].map((m:any)=>m[1]))];references.forEach(id=>selected.add(id));return {interpretation:i.interpretation,references};});
  // A selected rate owns its difference dependency; all expressions and labels
  // come from the current compiled catalog, not a repair of the model document.
  const derivations=catalog.derivations.filter(d=>selected.has(d.id)||catalog.derivations.some(r=>selected.has(r.id)&&r.expression?.left?.reference===d.id));
  const compiled=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations,interpretations}),evidence,{...context,includeBriefNegation:context.includeBriefNegation!==false});
  const {report_sha256,...base}=compiled;
  const split=base.text.indexOf('## 分析解释与推导'),text=base.text.slice(0,split)+base.text.slice(split).replace(/\[([^\]\n]+)\]\(juanerai-number:([^)]*)\)/g,(link,_display,id)=>{const v=base.values.find(v=>v.id===decodeURIComponent(id));return v?link+'（范围：'+literal(v.label)+'）':link;});
  const result={...base,reference_contract:context.includeBriefNegation===false?'1.1' as const:'1.2' as const,document:structuredClone(doc),text};return {...result,report_sha256:taskHash(result)};
 }
 if(!record(doc,['version','status','interpretations','derivations'])||doc.version!=='1.3'||doc.status!=='ready'||!Array.isArray(doc.interpretations)||!doc.interpretations.length||doc.interpretations.length>32||!Array.isArray(doc.derivations)||doc.derivations.length>32)error();
 context={...context,scopeEvidence:evidence};
 const values=numericReportFacts(evidence,context),issues:{code:string;reference:string|null}[]=[],seen=new Set(values.map(v=>v.id));
 for(const raw of doc.derivations){
  try{if(seen.has(raw.id))error('NUMERIC_REFERENCE_INVALID');seen.add(raw.id);const derived=derive(raw,values,context);if(context.includePresentationCheck!==false)interpretationText(raw.label+' {{'+derived.id+'}}',[derived.id], [...values,derived],context,reportScopeTerms(evidence));values.push(derived);}
  catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:typeof raw?.id==='string'?raw.id:null});}
 }
 const parameters=new Map<string,string[]>();if(context.includeStructuredReferences!==false)for(const f of groundedReportFacts(evidence)){
  const p=f.execution_plan.version==='1.8'?f.execution_plan.base:f.execution_plan,tokens:string[]=[];
  if(p.version==='2.2'&&Number.isInteger(p.rounding?.decimals)&&p.rounding.decimals>=0&&p.rounding.decimals<=6)tokens.push(p.rounding.decimals+'位小数');
  if(context.includeMeasureParameters!==false&&f.execution_plan.measure){
   const measure=f.execution_plan.measure,scales=[...new Set<string>(measure.inputs.map((input:{scale:string})=>input.scale))];
   const bound=(name:string,value:string)=>{for(const verb of ['为','是','=',':','：'])tokens.push(name+verb+value);};
   bound('输出倍率',measure.output_scale);
   if(scales.length===1){bound('输入倍率',scales[0]!);if(scales[0]===measure.output_scale)bound('输入倍率与输出倍率均',scales[0]!);}
  }
  parameters.set(f.reference_id,tokens.sort((a,b)=>b.length-a.length));
 }
 const paragraphs:string[]=[];
 for(const item of doc.interpretations){
  try{if(!record(item,['references','interpretation'])||!Array.isArray(item.references)||item.references.length>32||item.references.some((id:unknown)=>typeof id!=='string'||!values.some(v=>v.id===id)))error('NUMERIC_REFERENCE_INVALID');paragraphs.push(interpretationText(item.interpretation,item.references,values,context,reportScopeTerms(evidence),parameters));}
  catch(e){issues.push({code:String((e as {code?:string}).code??'REPORT_EVIDENCE_INVALID'),reference:null});}
 }
 const base=values.filter(v=>v.grade!=='derived_formula'),derived=values.filter(v=>v.grade==='derived_formula');
 const rows=base.map(v=>`| ${v.label} | [${literal(v.display)}](juanerai-number:${encodeURIComponent(v.id)}) | ${literal(v.unit)} | ${v.grade==='source_attribution'?'来源对应核对':'本行范围独立核算一致'} |`);
 const important=[...new Set(values.flatMap(v=>v.limitations.filter(l=>l.startsWith('两表存在')||l.startsWith('含负金额'))))];
 const text=['## 已核验事实','','仅核对下列当前资料、口径与范围；不代表整个报告或因果通过。','','| 实际范围 | 结果 | 单位 | 检查范围 |','| --- | --- | --- | --- |',...rows,'',...(important.length?[...important,'']:[]),...(derived.length?['## 派生公式已核验','',...derived.map(v=>`${v.label}：[${literal(v.display)+(v.unit==='%'||v.status==='not_applicable'?'':' '+literal(v.unit))}](juanerai-number:${encodeURIComponent(v.id)})${v.status==='not_applicable'?'（分母为零或输入不适用）':''}。${v.limitations.filter(l=>!l.startsWith('只核对')).join('')}`),'']:[]), '## 分析解释与推导','','以下为 Agent 的解释、假说和限制，未作独立语义或因果核验。','',...paragraphs,...(issues.length?['','## 报告检查缺口','','部分数值主张或公式缺少相符依据，未采用；已有效的计算结果保留，可查看数字依据与执行记录。']:[])].join('\n');
 const result={version:'1.0' as const,...(context.includeAssetLabels!==false&&evidence.verified_calculations.some(p=>p.execution_plan.version==='2.4')?{asset_label_format:'1.0' as const}:{}),...(sequentialScopesEnabled(context)?{scope_sequence:'1.0' as const}:{}),...(context.includeCorrectTrace!==false?{trace_format:'1.1' as const}:{}),...(context.includeScopeCheck!==false?{scope_contract:context.includePresentationCheck===false?'1.1' as const:context.includeClaimCheck===false?'1.2' as const:context.includeClaimCheck==='legacy'?'1.3' as const:context.includeClaimCheck==='single'?'1.4' as const:context.includeStructuredReferences===false?'1.5' as const:context.includeNativePercentUnits===false?'1.6' as const:context.includeNegatedSubjects===false?'1.7' as const:context.includeModifiedSubjects===false?'1.8' as const:context.includeMeasureParameters===false?'1.9' as const:'2.0' as const}:{}),identity:structuredClone(context.identity),document:structuredClone(doc),values,issues,status:issues.length?'partial' as const:'complete' as const,text};
 return {...result,report_sha256:taskHash(result)};
}

export function validateNumericReport(report:OpenNumericReport,evidence:NumericInput,context:Context){
 if(report.asset_label_format!==undefined&&report.asset_label_format!=='1.0')error('NUMERIC_REPORT_CHANGED');
 context={...context,includeAssetLabels:report.asset_label_format==='1.0'};
 if((report.document as any)?.version==='1.5'){const actual=compileNumericReport(JSON.stringify(report.document),evidence,{...context,includeConciseFacts:report.reference_contract!=='1.3',includeAssertionOnly:report.reference_contract==='1.5'});if(taskHash(actual)!==taskHash(report))error('NUMERIC_REPORT_CHANGED');return actual;}
 const actual=compileNumericReport(JSON.stringify(report.document),evidence,{...context,includeBriefNegation:report.reference_contract==='1.2',includeSequentialScopes:report.scope_sequence==='1.0',includeCorrectTrace:report.trace_format==='1.1',includeMeasureParameters:report.scope_contract==='2.0',includeModifiedSubjects:['1.9','2.0'].includes(report.scope_contract??''),includeNegatedSubjects:['1.8','1.9','2.0'].includes(report.scope_contract??''),includeNativePercentUnits:['1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeStructuredReferences:['1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeTrace:report.values.some(v=>Object.hasOwn(v,'calculation_trace')),includeScopeCheck:['1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includePresentationCheck:['1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??''),includeClaimCheck:report.scope_contract==='1.3'?'legacy':report.scope_contract==='1.4'?'single':['1.5','1.6','1.7','1.8','1.9','2.0'].includes(report.scope_contract??'')});if(taskHash(actual)!==taskHash(report))error('NUMERIC_REPORT_CHANGED');return actual;
}

export const numericReportEditSystem=`你是JuanerAI报告解读者。本轮不能执行工具或重新调用模型。业务理解和计算已经在前面的Agent分析中完成；当前提供的numeric_facts是已实际计算的结果，不能把问题中的历史准备要求当作当前未计算状态。你结合当前numeric_facts的真实scope、单位、数值和限制组织自然报告，说明支持的发现、不能确认的原因与下一步。已有calculation_trace给出真实核算关系及限制；据此说明分子分母、贡献和分摊，不凭感觉断言缺少分组或总额未经检查。numeric_facts中的calculation_kind是已绑定的实际计算方法，scope_context是实际分组和筛选；source_summary.fields是本次根任务选定资料的真实表头。不是所有事实都相同口径，引用实际scope；不要把毛额说成净额、类别差异说成跨期变化或相关性说成因果。只有当前输入实际提供explorations时才说明该探索的verification=not_performed及限制；未提供探索时不得虚构探索图表或探索状态。探索不是核验事实；没有原因字段时索要需要的资料，不编造退货原因。 collaboration来自本次真实协作回执：只有state=returned才是已返回模型观点，可结合summary及其limitations/unknowns完善报告，但不是独立证据。子调查的缺项只表示其选定材料范围，不能据此声称根资料也缺项；先与source_summary.fields和numeric_facts核对。局部筛选金额不得冒称总体金额；若总体值未提供就说明限制，不把局部值换名。Failed、Interrupted、Unknown、Waiting、Running没有成功意见，不得编造回流、采纳、子任务结论或全体共识；没有返回意见时保留真实数字，并简明说明协作未完成。最终报告不得用question中的委派要求或根草稿假装已有回流。
单次输出预算有限，应把输出集中在完整的最终JSON：从第一个字符开始直接写JSON，不写英文/中文推理、草稿、演算思路、Let me produce或格式说明。先确保回答当前问题必需的解释与重大限制完整；只声明实际需要的派生公式，不为每份事实重复演算或逐组铺同类解释，已有基础事实由后台展示。保持简洁，不因省篇幅删除重要限制或替数字换口径。严格只输出完整JSON，无围栏或前后说明：{"version":"1.3","status":"ready","derivations":[],"interpretations":[{"references":[],"interpretation":"自然中文"}]}。解释通常3到5段，答案优先，重要限制简短，不反复铺审计术语。references填写实际numeric_facts.reference_id或本报告前面已声明的派生D引用。每段references必须包含本段所有占位引用；即使数值在上一段出现，本段再次使用仍要列出。按每种方法分别写简短解释，不合并成整篇核验认证。execution_status与report_action描述当前实际动作，question中的历史准备、等待和采纳要求只用于理解分析意图，不代表当前尚未执行或需再次采纳。业务数值必须用{{F1}}或{{D1}}这样的引用占位，后台替换为实际值和单位；不能自填金额、比例、数量、核验等级或模型口算的结果。真实日期/订单号可正常表达，其他数值使用引用。方法配置的输入输出倍率、小数精度、节点计数等不是业务数值引用，不在解释里另填数字；需要时说“按已绑定单位和精度”，实际精度留在可检查的方法范围中。每个不同范围的基础数值分成独立短句或逗号分句；实际期间/分组标签必须和引用scope一致，不能交换。不要在占位后重复单位或百分号。叙述直接使用实际方法或范围名称，不写带数字的节点、步骤或事实序号；技术编号不属于业务发现。方法名称不改变指标的业务含义：不因加权平均、除法或单位相同而将收入改称单价，解释必须符合当前事实的指标定义。
需要差额、比例、增长率时请求通用公式，例如derivations:[{"id":"D1","label":"净额差额","expression":{"op":"subtract","left":{"reference":"F2"},"right":{"reference":"F1"}},"format":"number","decimals":2},{"id":"D2","label":"净额增长率","expression":{"op":"divide","left":{"reference":"D1"},"right":{"reference":"F1"}},"format":"percent","decimals":2}]。op仅add/subtract/multiply/divide；每个操作只有left/right；叶只有reference，不自填数字。各操作数必须有当前同单位/币种真实依据；format=percent只用于无量纲比值。decimals为0到6，通常金额/百分比用2。若用户不需要比较，derivations=[]。不可只为填示例而选择F1/F2，实际期间与类别由scope决定，没有时间顺序的依据就不写增长率。
interpretation可以说“本期净额{{F2}}，比上期增加{{D1}}，增长率{{D2}}，原因需要更多资料”。references和每个占位必须逐字复制当前numeric_facts.reference_id或已声明的派生ID；不得用空字符串、截断ID或自行拼接子路径。只有当前目录实际存在带斜线的ID时才完整复制该ID，不能套用示例。加权来源以该项实际execution_plan和scope为准，不能与另一计算的分摊权重混用。假说和解释可以没有references，但明确是待证意见；不得用未核验的具体数字包装假说。模型意见、守恒检查、探索运行成功都不是独立核算；不能称整份报告或全部数字核验通过。即使有缺口，也输出可支持的事实解释并说明限制，不抛弃已有有效结果，不要求用户逐数字再次确认。所有字段仅使用指定格式，不能添加text/claims/comparisons/value/grade等替代输出。JSON字符串的引号、反斜杠与换行正确转义。`;

/** Current producer-owned references; the legacy prompt remains for old checkpoints. */
export const scopedNumericReportEditSystem=`你是JuanerAI报告解读者，只解释当前真实成果，不调用工具，不重新计算。numeric_facts是当前实际计算并检查的事实，scope_context和calculation_kind给出真实范围及方法。comparison_facts仅包含后台按同一来源、方法、指标、单位和相同维度筛选出的可比较事实；changed_coordinate明确两侧，fixed_coordinates是不变范围。difference和rate由后台计算并核对，right减left，rate以left为基数，不自动代表时间增长或经营改善。没有目录引用的差额不能口算或自行拼公式；目录若truncated只是有限覆盖，不能说没有其他可能比较。
选择回答用户最需要的事实和对比，通常三到五段，答案优先，重要限制简短。每个业务数字必须使用当前numeric_facts.reference_id或comparison_facts.difference/reference_id、rate/reference_id的{{引用}}占位。占位将呈现后台绑定的范围名称、数值和单位，因此不要在占位前后另写金额、单位或重命名其范围。不同范围分成独立短句或逗号分句；日期与真实分组名称须和所选引用一致。引用逐字复制，不拼ID，不写数值字面量、模型自算、derivations或重复references清单。没有直接引用的订单/退款拆分值不要口算，改说明实际计算关系和限制。毛额不能称净额，局部不能称总体，地区差异不能称跨期变化。数字依据已经核对不代表解释、因果、资料完整性或整份报告被核验。
source_summary.fields是根任务实际选定资料表头。字段清单留在资料检查中，不在解释里重写“资料无某字段”的清单；缺少因果依据时说明尚不能判断原因，以及需要什么业务记录，而不是猜测现有表头。collaboration只有state=returned是本次已返回的MODEL观点，可以据此解释或提出待证假说，但不是独立证据。子调查缺少字段只表示其选定子集，不据此说根资料缺少该字段；先核对根表头。Failed、Interrupted、Unknown、Waiting、Running不等于成功，不能编造回流或共识。没有原因资料时准确说明无法判断原因及需要的资料，不编造原因。只在当前提供explorations时说明其未核验边界，不虚构探索、图表或策略收益。question中的历史准备或委派要求仅表示目标，不能当作当前未计算或尚无意见。
严格从第一个字符输出完整JSON，无推理、草稿、围栏或前后解释：{"version":"1.4","status":"ready","interpretations":[{"interpretation":"当前结果{{F1}}，可比较变化{{D1}}。原因仍需其他资料。"}]}。示例ID不是默认选择，实际由当前范围目录决定。只用version/status/interpretations，每段仅interpretation；不要输出text/claims/comparisons/references/value/grade/derivations。可以给不带具体数字的待证解释及建议，明确不是原因证明或实际行动。保留有效部分和重要限制，不要求用户逐数字确认。JSON正确转义，单次输出有限，直接写完整简洁报告。`;

/** Current producer owns quantitative prose. Legacy prompts stay checkpoint-bound. */
export const factFragmentReportEditSystem=`你是JuanerAI报告解读者，只解释本次实际成果，不调用工具，不重新计算。fact_fragments是后台将呈现的完整数字事实：指标名称、来源、范围、值和单位不能由你重命名。选择回答当前问题需要的fact_refs，按重要性组织段落；差额和比例只选当前比较目录的引用，不口算或自行拼公式。每段后台先呈现所选完整事实，再呈现你的interpretation。
numeric_facts.bound_parameters是本次实际执行的参数，不是候选：已明确的关联规则、数值模式、期间归属不能说成未知或未声明。source_summary.fields是当前根资料的已知字段；不能把已存在的商品等维度称为缺失。存在维度不等于存在原因证据，可以说明缺少原因依据。collaboration是局部材料下的MODEL意见，若其旧限制与当前执行参数或根表头不同，以当前真实参数及表头为准，不把子意见的未知照抄成主报告待补证。退款净额独立核算已经重新检查关联退款；没有单独的退款汇总凭证时可说明未单独核算汇总，不能说净额的退款环节未核对。
interpretation只写不带具体数字、不带占位符的中文解释、待证假说、限制或建议。不要重新叙述数值、范围比较或核验等级，数字事实由后台完整呈现。若要说明另一项数字，选择其引用，不在解释里改名。不得把毛额称净额、局部称总体、类别差异称跨期变化；证据不足准确说明未知和需要的业务记录，不编造原因。模型解释不是已验证的事实、因果、资料完整性或行动，不称整份报告通过。source_summary只表示根任务选定表头；子调查缺项不等于根资料缺项。collaboration只有returned是已返回MODEL观点，仍非独立证据；不编造失败或UNKNOWN任务的结果。历史准备或委派要求不表示当前没计算。保留有效部分和重要限制；不适用就如实说明，不把缺项称零。
仅输出完整JSON，无草稿、思考、围栏或前后说明：{"version":"1.5","status":"ready","interpretations":[{"fact_refs":["F1","D1"],"interpretation":"原因尚不能确定，需要补充业务记录。"}]}。只用上述字段。每段fact_refs可空，interpretation可空，但不能同时空。实际引用须逐字复制当前fact_fragments中的reference_id，不套用示例ID、截断或拼接。通常三到五段，答案优先，解释简洁，先保证完整JSON。不得添加自由label、value、grade、derivations、references字段，不填金额、比例或数量字面值，不在interpretation使用{{引用}}。`;

/** Portable copy keeps same checked identities; local interactive URLs become readable values. */
export function numericReportCopy(report:OpenNumericReport){
 const text=report.text.replace(/\[([^\]\n]+)\]\(juanerai-number:[^)]+\)/g,'$1');
 return text+'\n\n## 数字依据与检查范围\n\n'+report.values.map(v=>[
  '### '+v.label,v.display+(v.unit==='%'||v.status==='not_applicable'?'':' '+v.unit),'精确值：'+(v.value??'不适用'),
  '检查：'+({independent_arithmetic:'独立算术',derived_formula:'派生公式',source_attribution:'来源对应',not_performed:'未核验',assumption:'业务假设'}[v.grade]),
  '范围：'+v.scope,'版本：'+report.identity.revision,...(v.calculation_trace?['计算：'+v.calculation_trace.expression,v.calculation_trace.limitation]:[]),
  ...(v.expression?['公式：'+JSON.stringify(v.expression),'输入：'+v.references.map(id=>{const x=report.values.find(x=>x.id===id);return x?x.label+' = '+x.value+' '+x.unit:id;}).join('；')]:[]),
  '材料身份：'+v.source_sha256,'计划身份：'+(v.plan_sha256??'派生于输入'),'结果身份：'+(v.result_sha256??'派生于输入'),'核验身份：'+v.proof_sha256,...v.limitations,''
 ].join('\n')).join('\n')+'\n报告身份：'+report.report_sha256+'\n';
}
