import assert from 'node:assert/strict';
import {offlineResponse as wireResponse} from './offline-professional-provider.ts';
import {reportNumberOccurrences,reportParagraphs} from '../../../packages/product-core/report-postprocessing.ts';

/** Synthetic model responses only. Calculation still executes the real native tool against actual uploaded cells. */
export function postReportProvider(options:{initial:string;revision?:string;revisionFile?:boolean;resultFile?:boolean;omitComputedUnit?:boolean;stopAfterRevision?:boolean;malformedOutput?:boolean;execution?:'actual'|'hardcoded'|'none';method?:'supported'|'insufficient'|'conflict';reportedUnit?:string;omitReportedUnit?:boolean;partialMethod?:boolean;partialReview?:boolean;badReference?:boolean;reviewConflict?:boolean;missingDependent?:boolean;multivalue?:boolean;conditionDependency?:boolean;conditionNumber?:string;omitDependent?:boolean;uncoveredStrategy?:boolean;fileProgram?:boolean;unreadProgram?:boolean;contextDate?:boolean;alterProgramAfter?:boolean;conditionalStrategy?:boolean;notation?:string;trailingSourceCommand?:boolean;unavailableMethodReference?:boolean;malformedMethod?:boolean;delayedMethodReads?:'zero'|'partial'|'wrong-version';}){
 let calls=0,coordinatorStep=0,rootRevision=false;let activeText=options.initial,sourceAvailable=false;const turns=new Map<string,number>(),requests:{model:string;phase:string;review_phase?:string;body:any}[]=[];
 const fetch:typeof globalThis.fetch=async(_url,init)=>{
  calls++;const dto=JSON.parse(String(init!.body));assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  let phase='',value:any,n=0;
  const emit=(call:number,tools:any[],text='')=>{
   if(!tools.length&&phase==='report-full-review.v1'&&(n===2||options.badReference&&n===3)){const review=JSON.parse(text);return wireResponse(call,[...review.claims.map((args:any)=>({name:'record_review',args:options.partialReview?{kind:args.kind,paragraph_ref:args.paragraph_ref,quote:args.quote,verdict:args.verdict,reason:args.reason}:args})),...review.reviewed_paragraphs.map((paragraph_ref:string)=>({name:'record_reviewed',args:{paragraph_ref}}))]);}
   return wireResponse(call,tools,text);
  };
  if(calls===1){requests.push({model:dto.model,phase:'analysis',body:dto});return emit(calls,[],'当前样本已观察；原因尚未知。');}
  if(calls===2){assert.ok(!dto.tools.some((t:any)=>t.function.name==='bash'));requests.push({model:dto.model,phase:'report_edit',body:dto});return emit(calls,[],options.initial);}
  for(const message of [...dto.messages].reverse())if(message.role==='user'){
   const content=typeof message.content==='string'?message.content:(message.content??[]).filter((p:any)=>p.type==='text').map((p:any)=>p.text).join('\n');const match=/JuanerAI\.(report-[\w-]+\.v[12])\n/.exec(content);
   if(match){phase=match[1];value=JSON.parse(content.slice(match.index+match[0].length));break;}
  }
  assert.ok(phase);requests.push({model:dto.model,phase,...(value.phase?{review_phase:value.phase}:{}),body:dto});const key=phase+':'+(value.subject_id??'')+':'+(value.report_sha256??value.text??'');n=(turns.get(key)??0)+1;turns.set(key,n);
  if(phase==='report-postcheck.v1'||phase==='report-postcheck-recheck.v1'){
   if(phase==='report-postcheck-recheck.v1'&&n===1){coordinatorStep=1;activeText=value.text;}
   const packets:any[]=[];const scan=(v:any,depth=0)=>{if(depth>10)return;if(typeof v==='string'){try{scan(JSON.parse(v),depth+1);}catch{}}else if(Array.isArray(v))v.forEach(x=>scan(x,depth+1));else if(v&&typeof v==='object'){packets.push(v);Object.values(v).forEach(x=>scan(x,depth+1));}};
   dto.messages.filter((m:any)=>m.role==='tool').forEach((m:any)=>scan(m.content));
   const latest=(predicate:(v:any)=>boolean)=>[...packets].reverse().find(predicate);
   const invoke=(name:string)=>wireResponse(calls,[{name,args:{}}]);
   if(coordinatorStep===5){if(options.stopAfterRevision)return wireResponse(calls,[],'修订稿已保存，本次协调先结束。');const updated=latest(v=>v.accepted&&typeof v.text==='string'&&v.report_sha256);if(!updated||updated.text===activeText)return wireResponse(calls,[],'本轮合并意见已完成，未改变报告，限制仍保留。');value=updated;activeText=updated.text;coordinatorStep=0;}
   if(coordinatorStep===0){coordinatorStep=1;if(!sourceAvailable)return invoke('verify_numbers');}
   if(coordinatorStep===1){coordinatorStep=2;const completed=latest(v=>v.accepted&&v.executed);if((sourceAvailable||completed)&&(value.number_inventory?.uncovered.length??1)>0)return invoke('review_calculation');}
   if(coordinatorStep===2){coordinatorStep=3;return invoke('review_report');}
   if(coordinatorStep===3){const checked=latest(v=>v.accepted&&v.review&&v.numbers);const needs=checked&&(checked.numbers.some((n:any)=>n.status==='difference')||checked.review.uncovered.length||checked.review.claims.some((c:any)=>['insufficient','conflict'].includes(c.verdict)||c.verdict==='supported'&&!c.eligible));if(needs&&!rootRevision){rootRevision=true;coordinatorStep=5;return invoke('revise_report');}return wireResponse(calls,[],'本轮数字、结论及策略审查已结束；限制与未覆盖部分保留。');}
  }
  if(phase==='report-number-method-review.v1'&&n>2&&!options.malformedMethod&&!options.delayedMethodReads)return wireResponse(calls,[],'已依据实际程序、输出和来源逐项审查；语义判断不是确定性证明。');
  if(phase==='report-full-review.v1'&&n>2&&!options.badReference)return wireResponse(calls,[],'已逐项审查结论与策略，覆盖和条件以登记内容为准，不认证因果或未来收益。');
  const review=(claims:any[],limitations:string[]=[])=>JSON.stringify({reviewed_paragraphs:value.paragraphs.map((p:any)=>p.id),claims:claims.map(({id,start,end,...judgment})=>{void id;const quote=value.text.slice(start,end),p=reportParagraphs(value.text).find(p=>p.text.includes(quote));assert.ok(p,'fixture quote must belong to a real paragraph');return {...judgment,paragraph_ref:p.id,quote};}),uncovered:[],limitations});

  if(phase==='report-number-recompute.v1'){
   assert.ok(!JSON.stringify(dto.messages).includes('金额合计为'),'report answer never enters blind context');assert.equal(value.targets,undefined);assert.equal(value.report,undefined);
   // Fixture-local program output names, never transmitted as a product plan.
   value.targets=options.multivalue?[{id:'paid-amount',unit:'CNY'},{id:'row-count',unit:'笔'},{id:'paid-ratio',unit:'%',format_quote:'占比按百分数四舍五入保留两位小数'}]:[{id:'amount-total',unit:'CNY'}];
   if(options.execution==='none')return emit(calls,[],'模型口头声称已核验，但没有执行工具。');
   if(options.resultFile&&n===2)return emit(calls,[{name:'bash',args:{command:`/usr/bin/awk -F, 'NR>1{gsub(/"/,"",$2);s+=$2} END{printf "{\\"total\\":\\"%.0f\\"}\\n",s}' ${value.authorized_tables[0].path} > result.json; printf 'Calculation saved to result.json\\n'`,timeout:120}}]);
   if(n===1)return emit(calls,[{name:'read',args:{path:value.authorized_tables[0].path}}]);
   if(options.fileProgram&&n===2){const literal=JSON.stringify({values:[{claim_id:value.targets[0].id,value:'30',unit:'CNY',sources:[{path:'input/source-0.csv',rows:[2,3],columns:['B']}]}]});const code=options.execution==='hardcoded'?'BEGIN{print '+JSON.stringify(literal)+'}':String.raw`NR>1{gsub(/"/,"",$2);s+=$2} END{printf "{\"values\":[{\"claim_id\":\"CLAIM\",\"value\":\"%.0f\",\"unit\":\"CNY\",\"sources\":[{\"path\":\"input/source-0.csv\",\"rows\":[2,3],\"columns\":[\"B\"]}]}]}\n",s}`.replace('CLAIM',value.targets[0].id);return emit(calls,[{name:'write',args:{path:'checker.awk',content:code.replaceAll('input/source-0.csv',value.authorized_tables[0].path)}}]);}
   if(options.fileProgram&&n===3)return emit(calls,[{name:'bash',args:{command:'exec /usr/bin/awk -F, -f checker.awk '+value.authorized_tables[0].path,timeout:120}}]);
   if(options.fileProgram&&options.alterProgramAfter&&n===4)return emit(calls,[{name:'write',args:{path:'checker.awk',content:'changed after the completed execution; not the program that ran'}}]);
   if(n===2){let command=options.execution==='hardcoded'?`printf '%s' '{"values":[{"claim_id":"n1","value":"30","unit":"CNY","sources":[{"path":"input/source-0.csv","rows":[2,3],"columns":["B"]}]}]}'`:String.raw`exec /usr/bin/awk -F, 'NR>1{gsub(/"/,"",$2);s+=$2} END{printf "{\"values\":[{\"claim_id\":\"n1\",\"value\":\"%.0f\",\"unit\":\"CNY\",\"sources\":[{\"path\":\"input/source-0.csv\",\"rows\":[2,3],\"columns\":[\"B\"]}]}]}\n",s}' input/source-0.csv`;
    if(options.multivalue){const expressions:string[]=[];const values=value.targets.map((target:any)=>{const ratio=target.unit==='%';const amount=target.unit==='CNY';expressions.push(amount?'paid_amount':ratio?'paid*100/total':'total');if(ratio)expressions.push('paid*100/total');return {claim_id:target.id,value:ratio?'%.2f':'%.0f',unit:target.unit==='%'?'%%':target.unit,...(ratio?{unrounded_value:'%.10f',rounding_quote:target.format_quote}:{}),sources:[{path:'input/source-0.csv',rows:amount?[2,4]:[2,3,4],columns:amount?['B','C']:['C']}]};});const format=JSON.stringify({values})+'\n';command=`exec /usr/bin/awk -F, 'NR>1{gsub(/"/,"",$2);gsub(/"/,"",$3);total++;if($3=="paid"){paid++;paid_amount+=$2}} END{printf ${JSON.stringify(format)},${expressions.join(',')}}' input/source-0.csv`;}
    if(options.malformedOutput)command="printf '%s' 'completed but no result data'";
    command=command.replaceAll('n1',value.targets[0].id).replaceAll('input/source-0.csv',value.authorized_tables[0].path);return emit(calls,[{name:'bash',args:{command,timeout:120}}]);}
   if(options.trailingSourceCommand&&n===3)return emit(calls,[{name:'bash',args:{command:"printf '%s\\n' '源计算后的普通检查已完成；本行不是数字证据。'",timeout:120}}]);
   sourceAvailable=true;return emit(calls,[],'程序结束，资格由真实执行、来源及方法审查分别确定。');
  }
  if(phase==='report-number-method-review.v1'){
   if(options.malformedMethod&&n>=2)return wireResponse(calls,[{name:'record_method',args:{}}]);
   const mode=options.delayedMethodReads,first=mode==='zero'?1:2;
   if(mode){
    if(n>first+2)return wireResponse(calls,[],'先前证据不足未被登记；读完实际封存证据后完成方法对照。');
    if(mode==='wrong-version'&&n===1)return emit(calls,[{name:'read',args:{path:new URL('../../../adapters/agent-pi/resources/skills/general/SKILL.md',import.meta.url).pathname}}]);
    if(mode==='partial'&&n===1)return emit(calls,[{name:'read',args:{path:value.resources[0].path}}]);
    if(n===first+1)return emit(calls,value.resources.map((r:any)=>({name:'read',args:{path:r.path}})));
   }else if(n===1)return emit(calls,value.resources.filter((r:any)=>!options.unreadProgram||!r.path.includes('/files/')).map((r:any)=>({name:'read',args:{path:r.path}})));
   const verdict=options.method??(options.execution==='hardcoded'?'insufficient':'supported'),reason=verdict==='supported'?'实际命令读取获准CSV，计算范围和单位与报告对应，未用报告期待值。':'命令硬编码或覆盖证据不足，不能认定独立计算。';
   const comparisons:any[]=[];
   const select=(start:number,unit='CNY',extra:Record<string,unknown>={})=>{const ref='n'+reportNumberOccurrences(value.text).findIndex(n=>n.start===start);if(!value.number_candidates.some((n:any)=>n.ref===ref))return;const result=value.results.find((r:any)=>options.resultFile?r.evidence?.pointer==='/total':r.unit===unit);comparisons.push({number_ref:ref,result_ref:result?.ref??null,...(options.resultFile&&result?.evidence&&!options.omitComputedUnit?{computed_unit:unit}:{}),...(!options.omitReportedUnit?{reported_unit:options.reportedUnit??unit}:{}),applicability:verdict,independence:verdict,coverage:verdict,reason:!result&&value.limitations.length?value.limitations.join('；'):reason,...extra});};
   if(options.notation)for(const candidate of value.number_candidates)select(reportNumberOccurrences(value.text)[Number(candidate.ref.slice(1))].start);
   else if(options.multivalue){for(const [pattern,unit]of [[/金额合计为([0-9.]+)/,'CNY'],[/记录数为([0-9.]+)/,'笔'],[/已付占比为([0-9.]+)/,'%']] as const){const m=pattern.exec(value.text)!;select(m.index+m[0].indexOf(m[1]),unit);}}
   else{const m=/金额合计为([0-9.]+)/.exec(value.text);if(m)select(m.index+'金额合计为'.length);}
   if(options.missingDependent&&!options.omitDependent)select(value.text.indexOf('99'),'not-available',{result_ref:null,reason:'缺少另一范围资料及预测假设'});
   if(options.contextDate)select(value.text.lastIndexOf('2027'),'not-a-measurement',{result_ref:null,kind:'context',reason:'用户给定的复核年份须核对原文，不是计算指标。'});
   const packets=comparisons.map(args=>({name:'record_method',args:options.partialMethod?{number_ref:args.number_ref,reason:args.reason}:args}));
   if(options.unavailableMethodReference)for(const result_ref of ['out/real-output.json#count','out/real-output.json#amount'])packets.unshift({name:'record_method',args:{number_ref:value.number_candidates[0].ref,result_ref,reason:'根据真实程序给出可读方法意见；该文件定位尚未成为受信比较结果。'}});
   return wireResponse(calls,packets);
  }
  if(phase==='report-merged-revision.v2'){
   if(options.revisionFile){const path=/本次指定成稿路径：([^。]+)。/.exec(JSON.stringify(dto.messages))![1];if(n===1)return emit(calls,[{name:'write',args:{path,content:options.revision??options.initial}}]);return emit(calls,[],'已完成文件修订。');}
   return emit(calls,[],options.revision??options.initial);
  }
  assert.equal(phase,'report-full-review.v1');
  if(n===1&&value.source_catalog.length)return emit(calls,[{name:'read',args:{path:value.source_catalog[0].path}}]);
  if(options.multivalue)return emit(calls,[],review(value.number_inventory.claims.map((c:any)=>({id:'c-'+c.id,kind:'conclusion',start:c.start,end:c.end,verdict:options.reviewConflict?'conflict':'supported',reason:'只支持明确范围内的实际数字，不认证因果或行动。',evidence:[{kind:'number',id:c.id}],conditions:[],limitations:['只限本次合成资料']}))));
  const text=value.text,start=text.indexOf('金额'),end=text.indexOf('。',Math.max(0,start))+1,conflict=options.reviewConflict===true;
  if(options.notation)return emit(calls,[],JSON.stringify({reviewed_paragraphs:value.paragraphs.map((p:any)=>p.id),claims:value.paragraphs.map((p:any,i:number)=>({kind:'conclusion',paragraph_ref:p.id,quote:p.text,verdict:i===0?'conditional':'supported',reason:'只依据本项真实数字资格，不忽略符号或财务记法。',evidence:[{kind:'number',id:value.number_inventory.claims[i].id}],conditions:[],limitations:[]})),uncovered:[],limitations:[]}));
  if(options.conditionalStrategy){const at=text.indexOf('建议');return emit(calls,[],review([{id:'c1',kind:'conclusion',start,end,verdict:'supported',reason:'限于当前样本实际数字。',evidence:[{kind:'number',id:value.number_inventory.claims[0].id}],conditions:[],limitations:[]},{id:'s1',kind:'strategy',start:at,end:text.length,verdict:'conditional',reason:'仅建议补证，不能判断原因。',evidence:[{kind:'condition',quote:'原因不全也先保存报告'}],conditions:[{text:'实际取得原因资料',status:'unknown',evidence:[]}],limitations:[]} ]));}

  if(options.contextDate){const at=text.lastIndexOf('建议');return emit(calls,[],review([{id:'c1',kind:'conclusion',start,end,verdict:'supported',reason:'当前范围复算支持。',evidence:[{kind:'number',id:value.number_inventory.claims[0].id}],conditions:[],limitations:[]},{id:'s1',kind:'strategy',start:at,end:text.length,verdict:'supported',reason:'这是用户已给定的复核年份，不是计算所得业务数字，不执行现实行动。',evidence:[{kind:'condition',quote:'不执行业务行动'}],conditions:[],limitations:['只给出资料复核计划']}]));}
  if(options.uncoveredStrategy){const at=text.lastIndexOf('建议');return emit(calls,[],review([{id:'c1',kind:'conclusion',start,end,verdict:'supported',reason:'本范围金额已核验。',evidence:[{kind:'number',id:value.number_inventory.claims[0].id}],conditions:[],limitations:[]},{id:'s1',kind:'strategy',start:at,end:text.length,verdict:'supported',reason:'模型声称可以购买，但数字尚未覆盖。',evidence:[{kind:'condition',quote:'不执行业务行动'}],conditions:[],limitations:[]}]));}
  if(options.conditionDependency){const strategy=text.lastIndexOf('建议在该范围');assert.ok(strategy>=0);return emit(calls,[],review([{id:'c1',kind:'conclusion',start,end,verdict:'supported',reason:'当前范围实际复算支持。',evidence:[{kind:'number',id:value.number_inventory.claims[0].id}],conditions:[],limitations:[]},{id:'s1',kind:'strategy',start:strategy,end:text.length,verdict:'conditional',reason:'模型声称该金额足以购买设备；必须由真实条件资格约束。',evidence:[{kind:'condition',quote:'不执行业务行动'}],conditions:[{text:'所引用范围金额已被核验且充足',status:'met',evidence:[{kind:'number',id:value.number_inventory.claims[options.conditionNumber==='n1'?0:1].id}]}],limitations:[]}]));}
  return emit(calls,[],review(start>=0?[{id:'c1',kind:'conclusion',start,end:end>start?end:text.length,verdict:conflict?'conflict':'supported',reason:conflict?'该结论仍存在证据冲突；保留真实限制，不能直接采纳。':'限于当前样本的观察；实际数字资格必须另看独立执行证据。',evidence:value.number_inventory.claims[0]?[{kind:'number',id:options.badReference?'not-existing':value.number_inventory.claims[0].id}]:[{kind:'source',path:value.source_catalog[0].path,row:2,column:'B'}],conditions:[],limitations:['不是因果或行动认证。']}]:[],['仅当前保存全文的模型审查判断。']));
 };
 return {fetch,requests,calls:()=>calls};
}
