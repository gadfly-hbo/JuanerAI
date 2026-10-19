import {taskHash} from './member-task.ts';
import {compileNumericReport,numericReportFacts,scopedNumericReportComparisons} from './open-analysis-numeric-report.ts';
import type {AnalysisHistoryMessage} from '../ports/open-analysis-runtime.ts';
/** Current authorized receipts only; no Store history or private instruction crosses this seam. */
export function reportCollaborationOpinions(receipts:readonly unknown[]){
 return receipts.map((raw:any)=>{
  if(!raw||raw.classification!=='MODEL')fail();
  if(raw.result){
   const result=raw.result,value=result.value;
   if(typeof result.id!=='string'||typeof result.child_session_id!=='string'||value?.kind!=='result'||typeof value.summary!=='string'||!Array.isArray(value.limitations)||!Array.isArray(value.unknowns)||[...value.limitations,...value.unknowns].some(v=>typeof v!=='string'))fail();
   return {classification:'MODEL',verification:'not_performed',state:'returned',child_id:result.child_session_id,result_id:result.id,summary:value.summary,limitations:value.limitations,unknowns:value.unknowns};
  }
  if(typeof raw.child_id!=='string'||!['Running','Waiting','Failed','Stopped','Interrupted','Unknown'].includes(raw.state)||(raw.reason!==null&&typeof raw.reason!=='string'))fail();
  return {classification:'MODEL',verification:'not_performed',state:raw.state,child_id:raw.child_id,reason:raw.reason};
 });
}
export const reportEditMarker='JuanerAI.report-edit.v1\n';
/** Audit checkpoint keeps the draft; the model receives only current grounded material. */
export function reportEditModelPrompt(auditPrompt:string){
 const body=JSON.parse(auditPrompt.slice(reportEditMarker.length));
 const {draft,...material}=body;
 if(typeof draft!=='string')fail();
 if(['1.3','1.4','1.5'].includes(material.output_contract)){
  const facts=numericReportFacts(body.evidence,{identity:body.identity,sources:body.sources});
  const bound=new Map(groundedReportFacts(body.evidence).map(f=>{const base=f.execution_plan.base??f.execution_plan;return [f.reference_id,{scope_context:reportScopeContext(f,body.sources),calculation_kind:base.join?.kind??base.operation??base.version,...(material.output_contract==='1.5'?{bound_parameters:{join:base.join??null,numeric_mode:base.numeric_mode??null,...(base.join?.kind==='refund_net'?{refund_period_attribution:'matched_order_group',refund_relationship:'each_refund_matches_unique_order_multiple_refunds_accumulate'}:{})}}:{})}];}));
  const catalog=['1.4','1.5'].includes(material.output_contract)?scopedNumericReportComparisons(body.evidence,{identity:body.identity,sources:body.sources}):null;
  return reportEditMarker+JSON.stringify({version:material.version,output_contract:material.output_contract,...(material.output_contract==='1.5'?{fact_fragments:[...facts,...catalog!.comparisons.flatMap((c:any)=>[c.difference,c.rate])].map(f=>({reference_id:f.id,label:reportFactFragmentLabel(f,body.evidence,body.sources),value:f.value,display:f.display,unit:f.unit,grade:f.grade,status:f.status,limitations:f.limitations}))}:{}),...(catalog?{comparison_facts:catalog.comparisons.map(({difference,rate,...scope}:any)=>({...scope,difference:{reference_id:difference.id,label:difference.label,value:difference.value,display:difference.display,unit:difference.unit,grade:difference.grade,status:difference.status,limitations:difference.limitations},rate:{reference_id:rate.id,label:rate.label,value:rate.value,display:rate.display,unit:rate.unit,grade:rate.grade,status:rate.status,limitations:rate.limitations}})),comparison_catalog:{truncated:catalog.truncated,meaning:'right minus left; not causal proof'}}:{}),execution_status:facts.length?'has_verified_calculations':'no_verified_calculations',report_action:'explain_current_results',question:material.question,...(Array.isArray(material.question_history)?{question_history:material.question_history}:{}),numeric_facts:facts.map(f=>({reference_id:f.id,scope:f.scope,...bound.get(f.id.split('/')[0]!),value:f.value,unit:f.unit,currency:f.currency,grade:f.grade,limitations:f.limitations,...(f.calculation_trace?{calculation_trace:f.calculation_trace}:{})})),source_summary:body.sources.sources.map((s:any)=>({name:s.display_name,sheets:s.sheets.map((t:any)=>({name:t.name,fields:(t.rows.find((r:any)=>r.row===1)?.cells??[]).map((c:any)=>({column:c.column,name:c.value}))}))})),explorations:(body.explorations??[]).map((e:any)=>({verification:'not_performed',...(e.total_check?{total_check:e.total_check}:{}),charts:e.value?.charts??[]})),unavailable_calculations:body.unavailable_calculations??[],collaboration:(body.collaboration??[]).map(({child_id,result_id,...opinion}:any)=>opinion)});
 }
 if(material.output_contract==='1.2'){
  delete material.evidence;
  const actualPlan=(p:any):any=>{const {goal,...actual}=p;return {...actual,...(actual.inputs?{inputs:actual.inputs.map(actualPlan)}:{}),...(actual.base?{base:actualPlan(actual.base)}:{})};};
  material.grounded_facts=material.grounded_facts.map(({goal,...fact}:any)=>{const base=fact.execution_plan.base??fact.execution_plan;return {...fact,execution_plan:actualPlan(fact.execution_plan),actual_scope:reportPlan(fact.execution_plan,material.sources),scope_context:reportScopeContext(fact,material.sources),calculation_kind:base.join?.kind??base.operation};});
  material.comparison_facts=reportComparisonFacts(material.grounded_facts);
  material.unavailable_calculations=(material.unavailable_calculations??[]).map((item:any)=>({execution_plan:actualPlan(item.execution_plan),actual_scope:reportPlan(item.execution_plan,material.sources),code:item.code,verification:'not_performed',instruction:'实际筛选无可纳入记录，不等于金额为零或独立核验通过。保留限制，不把其他切片凭证抵作本切片。'}));
  material.source_summary=material.sources.sources.map((source:any)=>({name:source.display_name,sheets:source.sheets.map((sheet:any)=>({name:sheet.name,data_rows:Math.max(0,sheet.rows.length-1)}))}));
  delete material.sources;
  material.explorations=(material.explorations??[]).map((exploration:any)=>({verification:'not_performed',classification:exploration.classification,plan_sha256:exploration.plan_sha256,charts:exploration.value?.charts??[]}));
 }
 return reportEditMarker+JSON.stringify({...material,draft_sha256:taskHash(draft)});
}
export function reportExplorationObservations(messages:readonly AnalysisHistoryMessage[]){
 return messages.filter((m):m is Extract<AnalysisHistoryMessage,{speaker:'tool'}>=>m.speaker==='tool'&&!m.failed&&['explore_with_python','correct_exploration_code'].includes(m.name)).map(m=>m.result).filter(result=>{
  if(!result||typeof result!=='object'||Array.isArray(result))return false;
  return Reflect.get(result,'verification')==='not_performed'&&Reflect.get(result,'value')!==undefined&&Reflect.get(result,'classification')==='MODEL_EXPLORATION'&&typeof Reflect.get(result,'plan_sha256')==='string'&&!Object.hasOwn(result,'status');
 });
}
export function isOwnedReportEditMessage(message:AnalysisHistoryMessage,task_id:string){if(message.speaker!=='user'||!message.text.startsWith(reportEditMarker))return false;try{const value=JSON.parse(message.text.slice(reportEditMarker.length));return value?.version==='1.0'&&value.identity?.task_id===task_id;}catch{return false;}}
/** Never return internal report-edit inputs or structured output through a browser projection. */
export function reportUserHistory(messages:readonly AnalysisHistoryMessage[],task_id:string){const visible:AnalysisHistoryMessage[]=[];for(let i=0;i<messages.length;i++){const m=messages[i]!;if(i>0&&isOwnedReportEditMessage(m,task_id)){const body=JSON.parse((m as Extract<AnalysisHistoryMessage,{speaker:'user'}>).text.slice(reportEditMarker.length));const last=visible.at(-1);if(last?.speaker==='assistant'&&last.text===body.draft)visible.pop();if(messages[i+1]?.speaker==='assistant')i++;continue;}visible.push(m);}return visible;}
function fail():never{throw Object.assign(new Error('REPORT_EVIDENCE_INVALID'),{code:'REPORT_EVIDENCE_INVALID'});}
function sameValue(a:unknown,b:unknown){
 if(String(a)===String(b))return true;
 const rational=(v:unknown)=>{const s=String(v);if(s.length>2000)return null;if(/^-?\d+\/\d+$/.test(s)){const [n,d]=s.split('/').map(BigInt);return d!>0n?[n!,d!]:null;}if(!/^-?\d+(\.\d+)?$/.test(s))return null;const [whole,part='']=s.split('.');return [BigInt(whole!)*10n**BigInt(part.length)+(whole!.startsWith('-')?-1n:1n)*BigInt(part||'0'),10n**BigInt(part.length)];};
 const x=rational(a),y=rational(b);return !!x&&!!y&&x[0]!*y[1]===y[0]!*x[1];
}
export function groundedReportFacts(evidence:{verified_calculations:readonly any[]}){
 const facts=evidence.verified_calculations.flatMap(f=>f.calculation.groups?.length?f.calculation.groups.map((g:any)=>({goal:f.goal,operation:f.operation,filters:f.filters,group_by:f.group_by,execution_plan:f.execution_plan,group_key:g.key,value:g.value,unit:f.calculation.unit,grade:f.verification.grade})): [{goal:f.goal,operation:f.operation,filters:f.filters,group_by:f.group_by,execution_plan:f.execution_plan,group_key:null,value:f.calculation.value,unit:f.calculation.unit,grade:f.verification.grade}]);
 return facts.map((f:any,i:number)=>({reference_id:'F'+(i+1),...f}));
}
/** References are checked; editing never supplies an independent verification grade. */
export function checkedReportEdit(raw:string,evidence:{verified_calculations:readonly any[]},contract?:{version:'1.2'|'1.3';sources:any;identity?:import('../ports/open-analysis-runtime.ts').OpenAnalysisRun['identity'];unavailableCalculations?:readonly import('./open-analysis-ir.ts').OpenAnalysisIR[]}):string{
 if(contract?.version==='1.3'){if(!contract.identity)fail();return compileNumericReport(raw,evidence,{identity:contract.identity,sources:contract.sources}).text;}
 let x:any;try{x=JSON.parse(raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/,'$1'));}catch{fail();}
 if(contract){const report=assembledReport(x,evidence,contract.sources);return report+(contract.unavailableCalculations?.length?'\n\n## 未完成的范围\n\n'+contract.unavailableCalculations.map(p=>`${reportPlan(p,contract.sources)}：实际筛选没有可纳入记录；本范围未形成计算与独立核验结果，不按零值解释。`).join('\n\n'):'');}
 if(!x||Array.isArray(x)||Object.keys(x).some(k=>!['version','status','text','claims'].includes(k))||!['1.0','1.1'].includes(x.version)||x.status!=='ready'||typeof x.text!=='string'||!x.text.trim()||x.text.length>100000||!Array.isArray(x.claims)||x.claims.length<1||x.claims.length>128)fail();
 const grounded=groundedReportFacts(evidence);
 for(const claim of x.claims){
  if(x.version==='1.1'){
   if(!claim||Array.isArray(claim)||Object.keys(claim).some(k=>!['reference_id','value','path'].includes(k))||typeof claim.value!=='string')fail();
   const fact=grounded.find(f=>f.reference_id===claim.reference_id);if(!fact)fail();let value:unknown=fact.value;
   if(claim.path!==undefined){if(!Array.isArray(claim.path)||claim.path.length>12||claim.path.some((p:unknown)=>typeof p!=='string'||['__proto__','prototype','constructor'].includes(p)))fail();if(claim.path.length){let structured:unknown;try{structured=JSON.parse(String(value));}catch{/* Scalar facts have no nested leaf. */}if(structured!==null&&typeof structured==='object'){value=structured;for(const p of claim.path){if(!value||typeof value!=='object'||!Object.hasOwn(value,p))fail();value=Reflect.get(value,p);}}}}
   if(value===undefined||value===null||!sameValue(value,claim.value))fail();continue;
  }
  if(!claim||Array.isArray(claim)||Object.keys(claim).some(k=>!['plan_sha256','group_key','value','grade','path'].includes(k))||typeof claim.value!=='string'||!(claim.group_key===null||typeof claim.group_key==='string'))fail();
  const fact=evidence.verified_calculations.find(f=>f.plan_sha256===claim.plan_sha256);if(!fact||fact.verification.grade!==claim.grade)fail();
  let value:unknown=claim.group_key===null?fact.calculation.value:fact.calculation.groups?.find((g:any)=>g.key===claim.group_key)?.value;
  if(claim.path!==undefined){if(!Array.isArray(claim.path)||claim.path.length>12||claim.path.some((p:unknown)=>typeof p!=='string'||['__proto__','prototype','constructor'].includes(p)))fail();if(claim.path.length){try{value=JSON.parse(String(value));}catch{fail();}for(const p of claim.path){if(!value||typeof value!=='object'||!Object.hasOwn(value,p))fail();value=Reflect.get(value,p);}}}
  if(value===undefined||value===null||!sameValue(value,claim.value))fail();
 }
 return x.text;
}
/** A new report owns quantitative/proof presentation; legacy raw reports stay readable. */
function assembledReport(x:any,evidence:{verified_calculations:readonly any[]},sources:any):string{
 const record=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
 if(!record(x,['version','status','interpretations','comparisons'])||x.version!=='1.2'||x.status!=='ready'||!Array.isArray(x.interpretations)||x.interpretations.length<1||x.interpretations.length>32||!Array.isArray(x.comparisons)||x.comparisons.length>32)fail();
 const facts=groundedReportFacts(evidence),used=new Set<string>();
 const fact=(id:unknown)=>{const f=facts.find(f=>f.reference_id===id);if(!f||!['independent_arithmetic','source_attribution'].includes(f.grade)||!f.execution_plan||typeof f.unit!=='string'||f.value===undefined)fail();used.add(f.reference_id);return f;};
 const interpretation=(text:unknown)=>{if(typeof text!=='string'||!text.trim()||text.length>4000)fail();return reportLiteral(text);};
 const insights=x.interpretations.map((item:any)=>{if(!record(item,['references','interpretation'])||!Array.isArray(item.references)||item.references.length>32)fail();item.references.forEach(fact);return interpretation(item.interpretation);});
 const comparisons=x.comparisons.map((item:any)=>{if(!record(item,['before','after','interpretation']))fail();const before=fact(item.before),after=fact(item.after);if(before.unit!==after.unit||before.grade!=='independent_arithmetic'||after.grade!=='independent_arithmetic')fail();const difference=reportDifference(before.value,after.value);interpretation(item.interpretation);return `范围对比：${reportPlan(before.execution_plan,sources)}${before.group_key!==null?' · '+reportLiteral(before.group_key):''} 与 ${reportPlan(after.execution_plan,sources)}${after.group_key!==null?' · '+reportLiteral(after.group_key):''}；数值 ${reportLiteral(before.value)} 与 ${reportLiteral(after.value)} ${reportLiteral(before.unit)}；后列减前列的差额 ${difference} ${reportLiteral(before.unit)}（结果推导，不是新增独立核验）。`;});
 // Even qualitative-only explanations do not hide the actual executed facts.
 const displayed=used.size?facts.filter(f=>used.has(f.reference_id)):facts;
 const rows=displayed.map(f=>{fact(f.reference_id);return `| ${reportPlan(f.execution_plan,sources)}${f.group_key!==null?' · '+reportLiteral(f.group_key):''} | ${reportFactValue(f)} | ${reportLiteral(f.unit)} | ${f.grade==='source_attribution'?'本行原文引用的来源归属核对':'本行范围的独立算术核验'} |`;});
 return `## 已核验事实\n\n仅下列实际范围按各行标明的方式核对，不代表整份报告、其他切片或因果判断通过。\n\n| 实际计算范围 | 结果 | 单位 | 核验范围 |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n## 分析解释与推导\n\n以下为 Agent 对事实的解释、假说和限制，未作独立语义或因果核验。\n\n${[...comparisons,...insights].join('\n\n')}`;
}
function reportFactValue(f:any){if(f.grade!=='source_attribution')return reportLiteral(f.value);let quotes:any;try{quotes=JSON.parse(f.value);}catch{fail();}if(!Array.isArray(quotes)||!quotes.length)fail();return quotes.map(q=>{if(typeof q.source_name!=='string'||typeof q.position!=='string'||typeof q.text!=='string')fail();return reportLiteral(q.source_name)+' · '+reportLiteral(q.position)+'：'+reportLiteral(q.text);}).join('；');}
function reportLiteral(value:unknown){return String(value).replace(/[\r\n]+/g,' ').replace(/[\\`*_{}\[\]<>#|]/g,'\\$&');}
export function reportPlan(plan:any,sources:any):string{
 if(plan.version==='2.4'){const a=plan.asset_analysis,p=a.parameters;return '净销售复盘 · '+reportLiteral(a.asset.id)+'@'+reportLiteral(a.asset.version)+' · '+reportLiteral(p.window.start)+' 至 '+reportLiteral(p.window.end)+'（结束不含） · 自然周/周一 · '+reportLiteral(p.timezone)+' · '+reportLiteral(p.currency)+' · 观察截止 '+reportLiteral(p.observed_at)+' · 退款金额按'+(a.asset.metrics.find((m:any)=>m.name==='refund_amount').caliber_switches.refund_to_payment_period?'支付':'完成')+'期间归属 · 退款率保持同一支付队列 · 描述性差额不证明因果';}

 if(plan.version==='2.3')return '多表核对（左减右）：'+reportLiteral(plan.left_label)+' '+reportPlan(plan.inputs[0],sources)+'；'+reportLiteral(plan.right_label)+' '+reportPlan(plan.inputs[1],sources)+'；各表一行一键，精确键一对一匹配；检查差异不等于账目一致';
 if(plan.version==='2.2')return '比例成本分摊：成本池 '+reportPlan(plan.inputs[0],sources)+'；对象与权重 '+reportPlan(plan.inputs[1],sources)+'；按权重比例，输出 '+reportLiteral(plan.unit)+'，小数位 '+plan.rounding.decimals+'；最大余数分配，余数相同按对象键排序；逐对象与合计核对，不证明业务或税务合规';
 if(plan.version==='2.1')return '可加总分组变化：'+reportPlan(plan.inputs[1],sources)+'（'+reportLiteral(plan.current_label)+'） − '+reportPlan(plan.inputs[0],sources)+'（'+reportLiteral(plan.comparison_label)+'）；贡献分母为同范围全部分组的总变化，不是原因证明';
 if(plan.version==='2.0')return reportPlan(plan.base,sources)+' · 各分组金额占比（分母：同一来源与筛选总体的金额总额；原金额单位 '+reportLiteral(plan.input_unit)+'，输出%）';
 if(plan.operation==='source_quotes')return (plan.references??[]).map((r:any)=>reportField(r,sources)+' · 原文第'+reportLiteral(r.row)+'行').join('；')+' · 原文引用';
 if(plan.base&&plan.measure){const measure=plan.measure;return `${reportPlan(plan.base,sources)}；币种 ${reportLiteral(measure.currency)}，输入倍率 ${measure.inputs.map((i:any)=>reportField(i,sources)+' × '+reportLiteral(i.scale)).join('，')}；输出倍率 ${reportLiteral(measure.output_scale)}（${reportLiteral(measure.output_label)}）`;}
 const source=sources?.sources?.find((s:any)=>s.source_id===plan.source_id),sheet=source?.sheets?.find((s:any)=>s.sheet_id===plan.sheet_id);
 const column=(id:string)=>reportLiteral(sheet?.rows?.find((r:any)=>r.row===1)?.cells?.find((c:any)=>c.column===id)?.value??id);
 const scope=`${reportLiteral(source?.display_name??'当前资料')}／${reportLiteral(sheet?.name??'当前工作表')}`;
 const operations:Record<string,string>={sum:'求和',count:'数据行计数',min:'最小值',max:'最大值',mean:'均值',weighted_mean:'加权平均',membership_compare:'两期会员比较',source_quotes:'原文引用'};
 const filters=(plan.filters??[]).map((f:any)=>`${column(f.column)} ${({eq:'=',ne:'≠',ge:'≥',le:'≤'} as Record<string,string>)[f.operator]??reportLiteral(f.operator)} ${reportLiteral(f.value)}`).join('，');
 const own=`${scope} · ${column(plan.column??'')} ${operations[plan.operation]??reportLiteral(plan.operation)}${plan.weight_column?' · 权重 '+column(plan.weight_column):''}${plan.group_by?' · 按'+column(plan.group_by)+'分组':''}${filters?' · '+filters:' · 无额外筛选'}`;
 if(plan.join?.kind==='refund_net'&&plan.inputs?.length===2){const [left,right]=plan.inputs;return `${reportPlan(left,sources)} − 关联至本范围订单的${reportField(right,sources)}合计（${reportField({...left,column:plan.join.order_key},sources)} = ${reportField({...right,column:plan.join.refund_order_key},sources)}；每笔退款匹配唯一订单，同一订单的不同退款累计扣减）`;}
 if(plan.inputs?.length)return `${plan.inputs.map((p:any)=>reportPlan(p,sources)).join('；')} · 合并后${operations[plan.operation]??reportLiteral(plan.operation)}`;
 if(plan.base)return `${reportPlan(plan.base,sources)} · 当前派生后${own}`;
 return own;
}
function reportField(field:any,sources:any){const source=sources?.sources?.find((s:any)=>s.source_id===field.source_id),sheet=source?.sheets?.find((s:any)=>s.sheet_id===field.sheet_id);return `${reportLiteral(source?.display_name??'当前资料')}／${reportLiteral(sheet?.name??'当前工作表')}／${reportLiteral(sheet?.rows?.find((r:any)=>r.row===1)?.cells?.find((c:any)=>c.column===field.column)?.value??field.column)}`;}
/** Actual coordinates, never an inferred business period or a model-assigned goal. */
function reportScopeContext(fact:any,sources:any){
 const plan=fact.execution_plan,base=plan.base??plan,field=base.inputs?.[0]??base,group=base.group_by??field.group_by;
 const filters:any[]=[];
 const collect=(p:any)=>{for(const f of p.filters??[])filters.push({field:reportField({...p,column:f.column},sources),operator:f.operator,value:f.value});if(p.base)collect(p.base);for(const input of p.inputs??[])collect(input);};collect(plan);
 return {group_field:group?reportField({...field,column:group},sources):null,group_value:fact.group_key,filters:[...new Map(filters.map(f=>[JSON.stringify(f),f])).values()]};
}
/** Display only: full binding and proof remain in the value's original scope. */
export function reportFactFragmentLabel(value:{id:string;label:string},evidence:any,sources:any){
 if(value.id.startsWith('D'))return value.label.replace(/;+/g,';').replace(/；+/g,'；');
 const fact=groundedReportFacts(evidence).find(f=>f.reference_id===value.id.split('/')[0]);if(!fact)return value.label;
 if(fact.execution_plan.version==='2.4')return value.label;
 const plan=fact.execution_plan,base=plan.version==='1.8'?plan.base:plan,kind=base.join?.kind??base.operation??base.version;
 const names:Record<string,string>={refund_net:'订单金额减关联退款',sum:'求和',count:'数据行计数',mean:'均值',min:'最小值',max:'最大值',weighted_mean:'加权平均',membership_compare:'会员比较','2.0':'金额占比','2.1':'分组变化','2.2':'比例成本分摊','2.3':'多表核对',source_quotes:'资料原文对应'};
 if(!names[kind])return value.label;
 const field=base.inputs?.[0]??base,measure=['sum','mean','min','max','weighted_mean'].includes(kind)?reportField(field,sources).split('／').at(-1)+' ':'';
 const scope=reportScopeContext(fact,sources),coordinates=scope.filters.map((f:any)=>f.field+' '+(({eq:'=',ne:'≠',ge:'≥',le:'≤'} as Record<string,string>)[f.operator]??f.operator)+' '+reportLiteral(f.value));
 if(scope.group_value!==null)coordinates.push((scope.group_field?.split('／').at(-1)??'分组')+'='+reportLiteral(scope.group_value));
 const suffix=value.id.split('/').slice(1).join(' / ');
 return measure+names[kind]+(coordinates.length?' · '+coordinates.join('；'):' · 本次选定范围')+(suffix?' · '+suffix:'');
}
/** Linear-size neighboring comparisons; no time-axis inference or new verification. */
function reportComparisonFacts(facts:any[]){
 const previous=new Map<string,any>(),comparisons:any[]=[];
 for(const right of facts){
  if(right.grade!=='independent_arithmetic'||String(right.value).length>2000||!/^\-?\d+(?:\.\d+|\/[1-9]\d*)?$/.test(String(right.value)))continue;
  const key=JSON.stringify([right.unit,right.scope_context.group_field]);const left=previous.get(key);previous.set(key,right);
  if(!left)continue;
  const difference=reportDifference(left.value,right.value);
  comparisons.push({left:left.reference_id,right:right.reference_id,numeric_relation:difference==='0'?'equal':difference.startsWith('-')?'greater':'less',right_minus_left:difference,unit:right.unit,derivation:'from_scoped_facts_not_new_independent_proof'});
 }
 return comparisons;
}
function reportDifference(before:unknown,after:unknown){
 const number=(v:unknown)=>{const s=String(v);if(s.length>2000)fail();if(/^-?\d+\/\d+$/.test(s)){const [n,d]=s.split('/').map(BigInt);if(d!<=0n)fail();return [n!,d!] as const;}if(!/^-?\d+(\.\d+)?$/.test(s))fail();const [whole,part='']=s.split('.');return [BigInt(whole!)*10n**BigInt(part.length)+(s.startsWith('-')?-1n:1n)*BigInt(part||'0'),10n**BigInt(part.length)] as const;};
 const [bn,bd]=number(before),[an,ad]=number(after);let n=an*bd-bn*ad,d=ad*bd;const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;const divisor=gcd(n<0n?-n:n,d);n/=divisor;d/=divisor;if(d===1n)return String(n);
 let remaining=d,scale=0;while(remaining%2n===0n){remaining/=2n;scale++;}let fives=0;while(remaining%5n===0n){remaining/=5n;fives++;}scale=Math.max(scale,fives);if(remaining!==1n)return `${n}/${d}`;const scaled=n*10n**BigInt(scale)/d,abs=(scaled<0n?-scaled:scaled).toString().padStart(scale+1,'0');return `${scaled<0n?'-':''}${abs.slice(0,-scale)}.${abs.slice(-scale)}`.replace(/0+$/,'').replace(/\.$/,'');
}
export function reportEditTail(messages:readonly AnalysisHistoryMessage[],identity:unknown){
 for(let index=messages.length-1;index>0;index--){const m=messages[index];if(m?.speaker!=='user'||!m.text.startsWith(reportEditMarker))continue;let body:any;try{body=JSON.parse(m.text.slice(reportEditMarker.length));}catch{continue;}if(body?.version!=='1.0'||!body.identity||taskHash(body.identity)!==taskHash(identity))continue;if(typeof body.draft!=='string'||messages.length-index>2||messages[index+1]?.speaker==='user'||messages[index+1]?.speaker==='tool')fail();return {index,body,messages:messages.slice(index)};}
 return null;
}
/** Only active-context projection changes. Archived checkpoints keep the original draft/edit. */
export function reportAnalysisHistory(messages:readonly AnalysisHistoryMessage[],identity:unknown):readonly AnalysisHistoryMessage[]{
 const result:AnalysisHistoryMessage[]=[];
 for(let index=0;index<messages.length;index++){
  const m=messages[index]!;if(index>0&&m.speaker==='user'&&m.text.startsWith(reportEditMarker)){
   let body:any;try{body=JSON.parse(m.text.slice(reportEditMarker.length));}catch{result.push(m);continue;}
   if(body?.version==='1.0'&&body.identity&&taskHash(body.identity)!==taskHash(identity)&&body.identity.task_id===(identity as any).task_id){
    const answer=messages[index+1];if(answer?.speaker==='assistant'&&!answer.calls.length){let text:string;try{text=checkedReportEdit(answer.text,body.evidence,['1.2','1.3'].includes(body.output_contract)?{version:body.output_contract,sources:body.sources,identity:body.identity}:undefined);}catch{text='上一版报告整理未完成；其真实计算和失败记录保留，不当作整份报告通过。';}if(result.at(-1)?.speaker==='assistant'&&(result.at(-1) as any).text===body.draft)result.pop();result.push({speaker:'assistant',text,calls:[]});index++;}continue;
   }
  }result.push(m);
 }return result;
}
export const reportEditSystem='报告用业务语言说明单位、范围和实际意见；不要复述内部任务/结果编号、revision或输入输出倍率配置。所有数字仍须使用核验事实引用或真实推导占位，不用裸数字解释配置。输出是严格JSON：所有字符串中的ASCII双引号、反斜杠和换行必须按JSON转义；正文引用使用中文“”而非裸ASCII双引号。只输出完整JSON对象，不输出Markdown围栏或前后说明。你负责报告中的业务解释和推导，不负责输出事实表、事实数字或核验认证。后台从当前真实execution_plan、计算结果及凭证直接生成已核验事实，不接受模型填写数字、单位、等级或整篇报告。根据当前用户目标、grounded_facts中真实公式与范围、资料概要及实际图表判断业务意义、提出假说与限制；本环节不重新分析原始单元格，也不复述未经核验的探索概括。对范围、变化方向与组成的概括须由所引用的当前事实直接支持；缺少交叉切片时明确不能判断，不能把总体变化写成某子类内部变化，不能把部分贡献写成全部贡献；goal只是模型命名，真正公式由execution_plan定义。解释只属于模型意见，不能宣称自己或整篇报告核验通过；Python输出/自检不是独立证明，相关性不等于因果。不要重复事实表、数字演算或认证文字；需要引用数量变化时选择真实before/after引用，后台计算差额并明确为结果推导。不要求新的计算、用户逐步确认或权限。返回单一JSON对象：version="1.2",status="ready"或"blocked",interpretations=[{references:[grounded_facts真实F1等引用],interpretation:中文业务解释、假说或限制}],comparisons=[{before:"F1",after:"F2",interpretation:此比较的业务含义与限制}]。所有interpretation是普通文字，不放Markdown表格/标题、事实数值列表、核验等级或自我认证，不把观察作为已证明的原因。scope_context是后台依据实际执行计划给出的分组字段、当前组值与筛选范围，不是模型推断。calculation_kind来自真实公式：refund_net是扣减退款后的净额；sum仅按实际范围字段求和，不能因事实名字或重复引用变成另一口径。comparison_facts为后台对同单位同分组字段的相邻事实给出的精确数值关系，left/right为展示次序，numeric_relation为left相对right的equal/less/greater；equal就是相等，不能写成高低差。right_minus_left是结果推导，不是新独立核验，也不代表时间先后。每段引用实际相符的口径，不把相同口径重复计算讲成净额与毛额。before/after只是两个引用的展示次序，不保证时间先后。同一分组字段下不同group_value通常是不同类别的横向累计差异；不能从这两个值推断各类别跨期变化方向。要描述各类别的跨期变化，必须分别引用各类别在两个期间的真实事实；缺少时说尚不能判断。不把两个月扩写成一个季度，不扩大任何实际观察区间。仅比较相同单位、业务含义可比较且范围明确的两个数值；非数值或不相容结果不比较。可以不比较，comparisons=[]；缺少独立依据的假说references=[]并明确尚需验证。至少一段interpretation。以用户目标为中心，通常输出3到5段主要发现及重大限制，最多3项有业务价值的比较，解释正文约600到1200中文字。后台已显示事实表，不要为每个引用重复同样的限制，不堆砌审计术语；优先说明能支持的发现、业务含义与下一步线索。references等字段只在JSON结构中填写，解释正文使用业务来源和范围名称，不写字段操作说明。before和after只能逐字填写grounded_facts.reference_id的短ID，例如字符串"F1"，不能填说明句、数值或"F1（说明）"；示例：comparisons:[{before:"F1",after:"F2",interpretation:"这两个范围的数值存在差异，其原因仍需进一步分析。"}]。每项只用指定字段，禁止顶层text/claims或模型自填value/grade/单位。有任何可支持的期间比较、类别比较或限定性解释时status=ready，保留有效事实并明确当前缺口；不能因缺少所有维度的笛卡尔交叉切片就拒绝全部现有成果。缺少某交叉证据只限制对应的变化/组成/原因结论，不阻断已经有据的其他结论。只有完全无法给出有依据且不自认证的解释才status=blocked；仍只使用指定字段，不增加blocked_reason。不输出内部字段名、UUID或引用标签到解释文字。';
