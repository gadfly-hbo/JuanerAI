import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';
import type {MemberSourceInspection} from '../../../packages/ports/member-source.ts';
import {checkedReportEdit,groundedReportFacts,reportEditTail,reportUserHistory,reportEditMarker,reportExplorationObservations,reportEditModelPrompt} from '../../../packages/product-core/open-analysis-report-review.ts';
import {validateOpenExplorationValue} from '../../../packages/product-core/open-analysis-exploration.ts';
import {createNativeBusinessTools} from '../../../adapters/agent-pi/open-analysis.ts';

test('R1-B1-SEP01: host renders real scoped facts and exact differences; model cannot supply a proof table',()=>{
 const evidence={verified_calculations:[{goal:'净额（模型误名）',execution_plan:{operation:'sum',column:'D',source_id:'orders',sheet_id:'csv',filters:[{column:'B',operator:'eq',value:'一月'}],group_by:null},calculation:{value:'430',unit:'元'},verification:{grade:'independent_arithmetic'}},{goal:'二月净额',execution_plan:{operation:'sum',column:'D',source_id:'orders',sheet_id:'csv',filters:[{column:'B',operator:'eq',value:'二月'}],group_by:null},calculation:{value:'620',unit:'元'},verification:{grade:'independent_arithmetic'}}]};
 const sources:any={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'B',value:'期间'},{column:'D',value:'金额'}]}]}]}]};
 const output={version:'1.2',status:'ready',interpretations:[{references:['F1','F2'],interpretation:'需结合交易数量、商品结构进一步判断增长原因。'}],comparisons:[{before:'F1',after:'F2',interpretation:'净额变化不能单独证明经营改善。'}]};
 const report=checkedReportEdit(JSON.stringify(output),evidence,{version:'1.2',sources});
 assert.match(report,/已核验事实/);assert.match(report,/订单.csv/);assert.match(report,/金额.*求和/);assert.doesNotMatch(report,/净额（模型误名）/);
 assert.match(report,/期间.*一月/);assert.match(report,/430/);assert.match(report,/620/);assert.match(report,/190/);assert.match(report,/结果推导/);assert.match(report,/分析解释/);
 assert.throws(()=>checkedReportEdit(JSON.stringify({version:'1.1',status:'ready',text:'所有交叉切片独立核验通过，南区增长主要来自Coffee。',claims:[{reference_id:'F1',value:'430'}]}),evidence,{version:'1.2',sources}),{code:'REPORT_EVIDENCE_INVALID'});
 for(const changed of [{...output,grade:'independent_arithmetic'},{...output,interpretations:[{references:['F9'],interpretation:'无真实依据'}]},{...output,comparisons:[{before:'F1',after:'F2',value:'350',interpretation:'错误差额'}]}])assert.throws(()=>checkedReportEdit(JSON.stringify(changed),evidence,{version:'1.2',sources}),{code:'REPORT_EVIDENCE_INVALID'});
 const incompatible={verified_calculations:evidence.verified_calculations.map((x,i)=>({...x,calculation:{...x.calculation,unit:i?'万元':'元'}}))};assert.throws(()=>checkedReportEdit(JSON.stringify(output),incompatible,{version:'1.2',sources}),{code:'REPORT_EVIDENCE_INVALID'});
});
test('R1-B1-SEP02: scoped refunds and amount multipliers appear from the actual measured IR',()=>{
 const left={operation:'sum',column:'D',source_id:'orders',sheet_id:'csv',filters:[{column:'B',operator:'eq',value:'一月'}],group_by:null},right={...left,source_id:'refunds',column:'C',filters:[]};
 const base={...left,inputs:[left,right],join:{kind:'refund_net',order_key:'A',refund_order_key:'B',refund_id:'A'}};
 const plan={...base,base,measure:{currency:'CNY',inputs:[{source_id:'orders',sheet_id:'csv',column:'D',scale:'10000'},{source_id:'refunds',sheet_id:'csv',column:'C',scale:'1'}],output_scale:'10000',output_label:'人民币万元'}};
 const evidence={verified_calculations:[{execution_plan:plan,calculation:{value:'91/2',unit:'人民币万元'},verification:{grade:'independent_arithmetic'}}]};
 const sources:any={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'A',value:'订单号'},{column:'B',value:'期间'},{column:'D',value:'订单金额'}]}]}]},{source_id:'refunds',display_name:'退款.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'B',value:'原订单号'},{column:'C',value:'退款金额'}]}]}]}]};
 const report=checkedReportEdit(JSON.stringify({version:'1.2',status:'ready',interpretations:[{references:['F1'],interpretation:'需观察退款集中情况。'}],comparisons:[]}),evidence,{version:'1.2',sources});
 assert.match(report,/关联至本范围订单/);assert.match(report,/订单号.*原订单号/);assert.match(report,/CNY/);assert.match(report,/订单金额.*10000/);assert.match(report,/退款金额.*1/);assert.match(report,/输出倍率.*10000/);
 assert.doesNotMatch(report,/一对一关联/,'multiple distinct refunds may reference the same unique order');assert.match(report,/每笔退款.*唯一订单.*累计/);
});
test('R1-B1-SEP06: grouped fact context names actual axis and category; arbitrary reference order is not time order',()=>{
 const plan={operation:'sum',column:'D',source_id:'orders',sheet_id:'csv',filters:[],group_by:'C'};
 const sources:any={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'C',value:'商品'},{column:'D',value:'金额'}]}]}]}]};
 const evidence={verified_calculations:[{execution_plan:plan,calculation:{groups:[{key:'Coffee',value:'800'},{key:'Tea',value:'250'}],unit:'元'},verification:{grade:'independent_arithmetic'}}]};
 const audit=reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.2',draft:'保留历史',evidence,grounded_facts:groundedReportFacts(evidence),sources});
 const body=JSON.parse(reportEditModelPrompt(audit).slice(reportEditMarker.length));
 assert.deepEqual(body.grounded_facts.map((f:any)=>f.scope_context),[{group_field:'订单.csv／CSV／商品',group_value:'Coffee',filters:[]},{group_field:'订单.csv／CSV／商品',group_value:'Tea',filters:[]}]);
 const report=checkedReportEdit(JSON.stringify({version:'1.2',status:'ready',interpretations:[{references:[],interpretation:'不同商品累计金额不能说明各自跨期方向。'}],comparisons:[{before:'F1',after:'F2',interpretation:'此比较仅为同范围不同商品的横向差异。'}]}),evidence,{version:'1.2',sources});
 assert.match(report,/范围对比/);assert.doesNotMatch(report,/Coffee.*→.*Tea/,'comparison of category totals must not imply temporal progression');
});
test('R1-B1-SEP08: report input supplies exact equality and net/gross basis rather than asking the editor to recalculate',()=>{
 const plan={operation:'sum',column:'D',source_id:'orders',sheet_id:'csv',filters:[],group_by:'C'};
 const sources:any={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'C',value:'地区'},{column:'D',value:'金额'}]}]}]}]};
 const evidence={verified_calculations:[{execution_plan:plan,calculation:{groups:[{key:'北',value:'550'},{key:'南',value:'550'}],unit:'元'},verification:{grade:'independent_arithmetic'}}]};
 const audit=reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.2',draft:'旧错误叙述',evidence,grounded_facts:groundedReportFacts(evidence),sources});
 const body=JSON.parse(reportEditModelPrompt(audit).slice(reportEditMarker.length));
 assert.equal(body.grounded_facts[0].calculation_kind,'sum');
 assert.deepEqual(body.comparison_facts,[{left:'F1',right:'F2',numeric_relation:'equal',right_minus_left:'0',unit:'元',derivation:'from_scoped_facts_not_new_independent_proof'}]);
 const netPlan={...plan,join:{kind:'refund_net'}};const netEvidence={verified_calculations:[{...evidence.verified_calculations[0],execution_plan:netPlan}]};
 const net=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.2',draft:'旧错误叙述',evidence:netEvidence,grounded_facts:groundedReportFacts(netEvidence),sources})).slice(reportEditMarker.length));assert.equal(net.grounded_facts[0].calculation_kind,'refund_net');
});
test('R1-B1-SEP08: structured independently checked method results remain reportable without invented scalar comparison',()=>{
 const plan={operation:'membership_compare',group_by:null,filters:[]},sources:any={sources:[]};
 const evidence={verified_calculations:[{execution_plan:plan,calculation:{value:'{"comparison":2,"current":3}',unit:'会员指标'},verification:{grade:'independent_arithmetic'}},{execution_plan:plan,calculation:{value:'{"comparison":4,"current":5}',unit:'会员指标'},verification:{grade:'independent_arithmetic'}}]};
 const body=JSON.parse(reportEditModelPrompt(reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.2',draft:'历史',evidence,grounded_facts:groundedReportFacts(evidence),sources})).slice(reportEditMarker.length));
 assert.equal(body.grounded_facts.length,2);assert.deepEqual(body.comparison_facts,[]);
});
test('R1-B1-SEP03: document attribution is preserved without upgrading to arithmetic or report proof',()=>{
 const evidence={verified_calculations:[{execution_plan:{operation:'source_quotes',references:[{source_id:'doc',sheet_id:'text',row:2,column:'B'}]},calculation:{value:JSON.stringify([{source_id:'private-id',source_sha256:'private-hash',source_name:'访谈.md',position:'第二段',text:'客户提出配送改进需求。'}]),unit:'原文引用'},verification:{grade:'source_attribution'}}]},sources:any={sources:[{source_id:'doc',display_name:'访谈.md',sheets:[{sheet_id:'text',name:'正文'}]}]};
 const report=checkedReportEdit(JSON.stringify({version:'1.2',status:'ready',interpretations:[{references:['F1'],interpretation:'样本有限，不能推广到总体。'}],comparisons:[]}),evidence,{version:'1.2',sources});
 assert.match(report,/访谈.md/);assert.match(report,/原文引用/);assert.match(report,/来源归属/);assert.doesNotMatch(report,/本行范围的独立算术核验/);assert.match(report,/样本有限/);assert.match(report,/第二段.*客户提出配送改进需求/);assert.doesNotMatch(report,/private-id|private-hash|source_sha256/);
});
test('R1-B1-SEP05: report model consumes actual scope without duplicated proof payload or misleading goal names',()=>{
 const plan={goal:'错误目标退款0元',operation:'sum',column:'A',filters:[{column:'B',operator:'eq',value:'北'}]},evidence={verified_calculations:[{goal:plan.goal,execution_plan:plan,calculation:{value:'350',unit:'元'},verification:{grade:'independent_arithmetic'}}]};
 const audit=reportEditMarker+JSON.stringify({version:'1.0',output_contract:'1.2',draft:'原草稿',evidence,grounded_facts:groundedReportFacts(evidence),sources:{sources:[{display_name:'订单.csv',sheets:[{name:'CSV',rows:[{row:1,cells:[{column:'A',value:'金额'}]},{row:2,cells:[{column:'A',value:'未重新分析的原始单元格'}]}]}]}]},explorations:[{verification:'not_performed',value:{summary:'模型未经核验的概括',observations:['错误原因猜测'],charts:[]}}]});
 const prompt=reportEditModelPrompt(audit),body=JSON.parse(prompt.slice(reportEditMarker.length));assert.doesNotMatch(prompt,/错误目标退款0元|原草稿/);assert.equal(body.evidence,undefined);assert.equal(body.grounded_facts[0].value,'350');assert.deepEqual(body.grounded_facts[0].execution_plan,{operation:'sum',column:'A',filters:plan.filters});assert.match(body.grounded_facts[0].actual_scope,/北/);assert.match(audit,/错误目标退款0元/,'raw audit is preserved');assert.doesNotMatch(prompt,/未重新分析的原始单元格|模型未经核验的概括|错误原因猜测/);assert.equal(body.source_summary[0].sheets[0].data_rows,1);assert.equal(body.sources,undefined);
});
const selected:MemberSourceInspection={version:'1.0',sources:[{source_id:randomUUID(),display_name:'observations.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'20',sheets:[{sheet_id:randomUUID(),name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'件数'}]},{row:2,cells:[{column:'A',type:'number',value:'4'}]},{row:3,cells:[{column:'A',type:'number',value:'7'}]}]}]}]};
const misleading='我独立核验了所有交叉切片，总数12。随后更正为11；交叉探索尚未独立核验。';
function scenario(kind:'correct'|'forged'|'blocked'|'cancelled'|'legacy'){
 const controller=new AbortController(),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(selected),config_sha256:'b'.repeat(64)};
 const calls:any[]=[],saved:any[]=[],checkpoints:any[]=[];let proof:any,executedPlan:any;
 const app=createOpenAnalysisApplication({reviewReport:true,agentLed:true,runtime:{run:async i=>{
  calls.push(i);
  if(i.purpose==='report_edit'){
   assert.equal(i.tools.length,0,'report editor cannot execute new analysis tools');assert.deepEqual(i.identity,identity);
   assert.doesNotMatch(i.prompt,/所有交叉切片/,'unverified draft must not contaminate the report assembly input');assert.match(i.prompt,/independent_arithmetic/);
   assert.ok(i.continuation?.messages.every(m=>!m.text.includes(misleading)));
   const editingBody=JSON.parse(i.prompt.slice(reportEditMarker.length));const {goal,...actualIR}=executedPlan;assert.equal(editingBody.evidence,undefined,'duplicate audit proof is not model input');assert.deepEqual(editingBody.grounded_facts[0].execution_plan,actualIR,'REF05/SEP05: actual execution fields remain, only model goal naming is omitted');
   const reply=kind==='legacy'?{version:'1.0',status:'ready',text:'所有交叉切片已独立核验。',claims:[{plan_sha256:proof.verification.plan_sha256,group_key:null,value:'11',grade:'independent_arithmetic'}]}:{version:'1.2',status:kind==='blocked'?'blocked':'ready',interpretations:[{references:[kind==='forged'?'F9':'F1'],interpretation:'交叉切片尚未独立核验，不能从本次总数凭证推出。'}],comparisons:[]};
   const text=JSON.stringify(reply);await i.saveContinuation?.({version:'1.0',turn:2,messages:[{speaker:'user',text:i.prompt},{speaker:'assistant',text,calls:[]}]});
   if(kind==='cancelled')controller.abort();return {text,tools:[]};
  }
  const tool=(n:string)=>i.tools.find(t=>t.name===n)!;
  await tool('set_framework').execute({goal:'件数合计',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
  proof=await tool('calculate_and_verify').execute({},i.signal);
  await i.saveContinuation?.({version:'1.0',turn:1,messages:[{speaker:'user',text:'合计多少？'},{speaker:'assistant',text:misleading,calls:[]}]});return {text:misleading,tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async x=>{executedPlan=x.plan;return {saved:true,...x.identity};},saveCheckpoint:async x=>{checkpoints.push(x);return {saved:true,...identity};},saveVerifiedStep:async x=>({saved:true,step_id:x.step_id,...identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async x=>{saved.push(x);return {saved:true,outcome_id:x.outcome_id,...identity};}});
 return {app,input:{identity,question:'合计多少？',signal:controller.signal},calls,saved,checkpoints};
}
test('R1-B1/RV05: misleading draft is preserved as evidence but current report consumes the real no-tool evidence edit',async()=>{
 const s=scenario('correct');await s.app.run(s.input);assert.equal(s.calls.length,2);assert.equal(s.saved.length,1);assert.doesNotMatch(s.saved[0].explanation.text,/总数12|我独立核验了所有/);assert.match(s.saved[0].explanation.text,/交叉切片尚未独立核验/);assert.equal(s.saved[0].verification.value,'11');assert.ok(s.checkpoints.some(c=>c.messages.some(m=>m.text===misleading)),'raw draft remains accessible');
});
for(const kind of ['forged','blocked','cancelled','legacy'] as const)test('R1-B1: '+kind+' report edit cannot publish a saved outcome',async()=>{
 const s=scenario(kind);await assert.rejects(()=>s.app.run(s.input),{code:kind==='cancelled'?'CANCELLED':'REPORT_EVIDENCE_INVALID'});assert.equal(s.saved.length,0);assert.equal(s.calls.length,2);
});
test('R1-B1: missing cross proof, changed grade and false subtotal cannot be certified by an editor',()=>{
 const evidence={verified_calculations:[{plan_sha256:'a'.repeat(64),calculation:{value:'1050',groups:[{key:'Coffee',value:'800'}]},verification:{grade:'independent_arithmetic'}}]};
 for(const change of [{plan_sha256:'b'.repeat(64),value:'350'},{grade:'report_verified'},{group_key:'Coffee',value:'850'}])assert.throws(()=>checkedReportEdit(JSON.stringify({version:'1.0',status:'ready',text:'错误报告',claims:[{plan_sha256:'a'.repeat(64),value:'1050',group_key:null,grade:'independent_arithmetic',...change}]}),evidence),{code:'REPORT_EVIDENCE_INVALID'});
 assert.equal(checkedReportEdit(JSON.stringify({version:'1.0',status:'ready',text:'真实总额1050，交叉探索未独立核验。',claims:[{plan_sha256:'a'.repeat(64),value:'1050.00',group_key:null,grade:'independent_arithmetic'}]}),evidence),'真实总额1050，交叉探索未独立核验。');
});
test('R1-B1: report editing tail is resumable only in its own identity and omitted from browser material projection',()=>{
 const identity={task_id:randomUUID(),revision:'1'},body={version:'1.0',identity,draft:'draft',evidence:{}};
 const messages=[{speaker:'user' as const,text:'需求'},{speaker:'assistant' as const,text:'draft',calls:[]},{speaker:'user' as const,text:reportEditMarker+JSON.stringify(body)},{speaker:'assistant' as const,text:'internal JSON',calls:[]}];
 assert.equal(reportEditTail(messages,identity)?.index,2);assert.equal(reportEditTail(messages,{...identity,revision:'2'}),null);assert.equal(reportUserHistory(messages,identity.task_id).length,1);assert.equal(reportUserHistory([{speaker:'user',text:reportEditMarker+JSON.stringify(body)}],identity.task_id).length,1,'real first user message is not a report checkpoint');
});
test('R1-B1-REF02: short references preserve actual scoped groups and reject invented values, grades and references',()=>{
 const evidence={verified_calculations:[{goal:'商品净额',filters:[{column:'期间',value:'二月'}],group_by:['商品'],calculation:{unit:'元',groups:[{key:'Coffee',value:'520'},{key:'Tea',value:'100'}]},verification:{grade:'independent_arithmetic'}},{goal:'总体净额',calculation:{unit:'元',value:'1050'},verification:{grade:'independent_arithmetic'}}]};
 const facts=groundedReportFacts(evidence);assert.equal(facts[0].reference_id,'F1');assert.equal(facts[0].group_key,'Coffee');assert.deepEqual(facts[0].filters,evidence.verified_calculations[0]!.filters);assert.equal(facts[2].reference_id,'F3');
 const report=(claim:any)=>JSON.stringify({version:'1.1',status:'ready',text:'二月 Coffee 净额520元；总体1050元。',claims:[claim]});
 assert.match(checkedReportEdit(report({reference_id:'F1',value:'520.00'}),evidence),/520/);
 for(const claim of [{reference_id:'F9',value:'520'},{reference_id:'F1',value:'800'},{reference_id:'F1',value:'520',grade:'report_verified'},{reference_id:'F1',value:'520',group_key:'Coffee'},{reference_id:'F3',value:'1050',path:['__proto__']}])assert.throws(()=>checkedReportEdit(report(claim),evidence),{code:'REPORT_EVIDENCE_INVALID'});
});
test('R1-RT19/RV05: output correction names missing field without accepting absent chart units',()=>{
 assert.throws(()=>validateOpenExplorationValue({summary:'实际输出',observations:[],charts:[{title:'图',type:'bar',points:[{label:'对象',value:11}]}]}),(e:any)=>e.code==='PREPARATION_OUTPUT_INVALID'&&e.safe_details.invalid_fields.some((f:any)=>f.path==='charts[0].unit'));
});
test('R1-RT19/RV05: code-only correction binds the unique owned pending input and cannot execute without it',async()=>{
 const base=scenario('correct');let executions=0;const identity=base.input.identity;
 const code:any=async()=>{throw Error('not used');};code.explore=async(r:any)=>{executions++;if(executions===1)throw Object.assign(Error('missing chart unit'),{code:'PREPARATION_OUTPUT_INVALID',safe_details:{invalid_fields:[{path:'charts[0].unit',expected:'required property'}]}});return {value:{summary:'实际计算',observations:[],charts:[{title:'分布',type:'bar',unit:'件',points:[{label:'合计',value:11}]}]},receipt:{classification:'MODEL_EXPLORATION',verification:'not_performed',execution_id:randomUUID()}};};
 const app=createOpenAnalysisApplication({agentLed:true,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
  const correction=i.tools.find(t=>t.name==='correct_exploration_code');assert.ok(correction,'same task opaque pending identity is host-owned');
  await i.tools.find(t=>t.name==='set_framework')!.execute({goal:'件数',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
  const failed:any=await i.tools.find(t=>t.name==='explore_with_python')!.execute({goal:'分布',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}],code:'generated'},i.signal);assert.equal(failed.remaining_corrections,1);assert.equal(failed.diagnostic.invalid_fields[0].path,'charts[0].unit');
  const value:any=await correction.execute({code:'corrected'},i.signal);assert.equal(value.verification,'not_performed');assert.equal(executions,2);await assert.rejects(()=>correction.execute({code:'third'},i.signal),{code:'CODE_STEP_UNRESOLVED'});return {text:'未取得额外执行权限。',tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async r=>({saved:true,outcome_id:r.outcome_id,...r.identity})});
 await assert.rejects(()=>app.run({...base.input,identity}),{code:'CODE_STEP_UNRESOLVED'});
});

test('R1-B1-REF04: corrected actual exploration reaches report input without its failed predecessor being promoted',()=>{
 const value={summary:'真实纠正后输出',observations:['实际观察'],charts:[]},receipt={execution_id:randomUUID(),verification:'not_performed'};
 const result={value,classification:'MODEL_EXPLORATION',plan_sha256:'a'.repeat(64),verification:'not_performed'};
 const messages:any[]=[{speaker:'tool',name:'explore_with_python',failed:false,result:{status:'needs_code_correction',code:'PREPARATION_EXECUTION_FAILED',verification:'not_performed'}},{speaker:'tool',name:'correct_exploration_code',failed:false,result},{speaker:'tool',name:'correct_exploration_code',failed:true,result},{speaker:'tool',name:'other',failed:false,result}];
 assert.deepEqual(reportExplorationObservations(messages),[result]);assert.equal(receipt.verification,'not_performed');
});
test('R1-RT23: explicit program lines preserve indentation and string escapes through the same single correction identity',async()=>{
 const base=scenario('correct'),executed:string[]=[],program=["x=json.load(open(SOURCES[0]))","label='a\\nb'","if x:","    pass"];
 const code:any=async()=>{throw Error('unused');};code.explore=async(r:any)=>{executed.push(r.code);if(executed.length===1)throw Object.assign(Error('first failure'),{code:'PREPARATION_EXECUTION_FAILED'});return {value:{summary:'真正返回',observations:[],charts:[]},receipt:{classification:'MODEL_EXPLORATION',verification:'not_performed',execution_id:randomUUID()}};};
 const app=createOpenAnalysisApplication({agentLed:true,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
  const tool=(n:string)=>i.tools.find(t=>t.name===n)!;await tool('set_framework').execute({goal:'数量',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
  const failed:any=await tool('explore_with_python').execute({goal:'探索',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}],code_lines:['invalid = [}']},i.signal);assert.equal(failed.remaining_corrections,1);
  await tool('correct_exploration_code').execute({code_lines:program},i.signal);assert.deepEqual(executed,['invalid = [}',program.join('\n')]);
  await assert.rejects(()=>tool('correct_exploration_code').execute({code_lines:['pass']},i.signal),{code:'CODE_STEP_UNRESOLVED'});return {text:'第三次不得执行',tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async r=>({saved:true,...r.identity})});
 await assert.rejects(()=>app.run(base.input),{code:'CODE_STEP_UNRESOLVED'});assert.equal(executed.length,2);
});
test('R1-RT23: ambiguous, malformed and oversized line programs never reach the physical executor',async()=>{
 for(const invalid of [{code:'pass',code_lines:['pass']},{code_lines:[]},{code_lines:[4]},{code_lines:['pass\npass']},{code_lines:['x'.repeat(65537)]}]){
  const base=scenario('correct');let physical=0;const code:any=async()=>{physical++;};code.explore=async()=>{physical++;throw Error('must not execute');};
  const app=createOpenAnalysisApplication({agentLed:true,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
   await i.tools.find(t=>t.name==='set_framework')!.execute({goal:'数量',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
   await i.tools.find(t=>t.name==='explore_with_python')!.execute({goal:'探索',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}],...invalid},i.signal);return {text:'不得发布',tools:[]};
  }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async()=>{throw Error('must not save');}});
  await assert.rejects(()=>app.run(base.input),(e:any)=>['VALIDATION_FAILED','CODE_INVALID','LOCAL_OPERATION_FAILED'].includes(e.code));assert.equal(physical,0);
 }
});

test('R1-B1-REF06: scalar short references tolerate safe redundant metadata without weakening numeric or object-path checks',()=>{
 const evidence={verified_calculations:[{goal:'净额',calculation:{value:'430'},verification:{grade:'independent_arithmetic'}}]},reply=(value:string,path:any)=>JSON.stringify({version:'1.1',status:'ready',text:'净额430元。',claims:[{reference_id:'F1',value,path}]});
 assert.equal(checkedReportEdit(reply('430',['verified_calculations','calculation','value']),evidence),'净额430元。');
 for(const [value,path] of [['620',['calculation']],['430',['__proto__']],['430',[1]],['430',Array(13).fill('x')]])assert.throws(()=>checkedReportEdit(reply(value as string,path),evidence),{code:'REPORT_EVIDENCE_INVALID'});
 const composite={verified_calculations:[{goal:'复合结果',calculation:{value:'{"net":430}'},verification:{grade:'independent_arithmetic'}}]};assert.equal(checkedReportEdit(reply('430',['net']),composite),'净额430元。');assert.throws(()=>checkedReportEdit(reply('430',['other']),composite),{code:'REPORT_EVIDENCE_INVALID'});
});

test('R1-RT21: repeated identical rejected binding stops while a changed real binding is allowed',async()=>{
 for(const repeat of [true,false]){
  const base=scenario('correct'),identity=base.input.identity;let calls=0,savedFrames=0;
  const app=createOpenAnalysisApplication({agentLed:true,runtime:{run:async i=>{const tool=i.tools.find(t=>t.name==='set_framework')!,args={goal:'件数',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'missing',unit:'件'};const first:any=await tool.execute(args,i.signal);assert.equal(first.code,'BINDING_NOT_FOUND');calls++;if(repeat){await assert.rejects(()=>tool.execute(args,i.signal),{code:'BINDING_CORRECTION_EXHAUSTED'});await assert.rejects(()=>tool.execute({...args,column:'A'},i.signal),{code:'BINDING_CORRECTION_EXHAUSTED'});}else {const value:any=await tool.execute({...args,column:'A'},i.signal);assert.equal(savedFrames,1);}return {text:'未计算',tools:[]};}},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async x=>{assert.equal(x.plan.column,'A');savedFrames++;return {saved:true,...x.identity};},verify:verifyOpenAnalysisIntegerSum,saveOutcome:async()=>{throw Error('no outcome');}});
  await assert.rejects(()=>app.run({...base.input,identity}),{code:repeat?'BINDING_CORRECTION_EXHAUSTED':'ANALYSIS_INCOMPLETE'});assert.equal(calls,1);
 }
});

test('R1-B1-SEP10: host comparison owns scope while Agent business interpretation remains separate',()=>{
 const plan={operation:'sum',column:'A',source_id:'orders',sheet_id:'csv',group_by:null,filters:[]};const evidence={verified_calculations:[{execution_plan:{...plan,filters:[{column:'B',operator:'eq',value:'北'}]},calculation:{value:'230',unit:'元'},verification:{grade:'independent_arithmetic'}},{execution_plan:{...plan,filters:[{column:'B',operator:'eq',value:'南'}]},calculation:{value:'350',unit:'元'},verification:{grade:'independent_arithmetic'}}]};const sources:any={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'A',value:'金额'},{column:'B',value:'地区'}]}]}]}]};
 const raw=JSON.stringify({version:'1.2',status:'ready',interpretations:[{references:['F1','F2'],interpretation:'进一步分析退款分布，不能由横向金额差推断因果。'}],comparisons:[{before:'F1',after:'F2',interpretation:'错误范围改称为同一南区两期。'}]});const report=checkedReportEdit(raw,evidence,{version:'1.2',sources});
 assert.doesNotMatch(report,/错误范围改称为同一南区两期/);assert.match(report,/北/);assert.match(report,/南/);assert.match(report,/230/);assert.match(report,/350/);assert.match(report,/120/);assert.match(report,/进一步分析退款分布/);assert.match(raw,/错误范围/,'raw supplied audit is not rewritten');
 assert.throws(()=>checkedReportEdit(raw.replace('错误范围改称为同一南区两期。',''),evidence,{version:'1.2',sources}),{code:'REPORT_EVIDENCE_INVALID'});
});

for(const ending of ['embedded','trailing_lf','trailing_cr'])test('V13-LINE01 '+ending+': native feedback rejects multiline code_lines before effects and accepts one explicit complete-source correction',async()=>{
 const base=scenario('correct');let effects=0;let executed='';const program='import json\nprint("synthetic")';
 const code:any=async()=>{throw Error('not used');};code.explore=async(r:any)=>{effects++;executed=r.code;return {value:{summary:'observed',observations:[],charts:[]},receipt:{classification:'MODEL_EXPLORATION',verification:'not_performed',execution_id:randomUUID()}};};
 const app=createOpenAnalysisApplication({agentLed:true,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
  await i.tools.find(t=>t.name==='set_framework')!.execute({goal:'件数',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
  let turn=1;const current={...i,recoverInvalidArguments:true};const native=createNativeBusinessTools(()=>current,()=>turn).find(t=>t.name==='explore_with_python')!;
  const args={goal:'观察',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}]};
  const malformed=ending==='embedded'?program:ending==='trailing_lf'?'pass\n':'pass\r';const feedback:any=await native.execute({...args,code_lines:[malformed]},i.signal);assert.equal(feedback.status,'invalid_arguments');assert.equal(feedback.executed,false);assert.equal(feedback.remaining_corrections,1);assert.ok(feedback.issues.some((x:any)=>x.path==='/code_lines/0'&&x.keyword==='pattern'));assert.equal(effects,0);
  turn++;const observed:any=await native.execute({...args,code:program},i.signal);assert.equal(observed.verification,'not_performed');assert.equal(executed,program);assert.equal(effects,1);
  turn++;await assert.rejects(()=>native.execute({...args,code_lines:[program]},i.signal),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(effects,1);const checked:any=await i.tools.find(t=>t.name==='calculate_and_verify')!.execute({},i.signal);assert.equal(checked.verification.grade,'independent_arithmetic');return {text:'observed',tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async r=>({saved:true,outcome_id:r.outcome_id,...r.identity})});
 await app.run(base.input);
});

for(const resolve of [false,true])test(`V13-SEM-FEEDBACK0${resolve?2:1}: persisted meaning conflicts identify the real blocker before exploration`,async()=>{
 const {compileOpenSemanticAssessment}=await import('../../../packages/product-core/open-analysis-context.ts');
 const question='以件数计算',identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(selected),config_sha256:'b'.repeat(64)},signal=new AbortController().signal;
 const semantics=compileOpenSemanticAssessment({definitions:[],conflicts:[{dimension:'metric',question:'件数还是金额？',alternatives:['件数','金额'],resolution_quote:null}]},question);
 let effects=0,frames=0;const code:any=async()=>{throw Error('not used');};code.explore=async()=>{effects++;return {value:{summary:'件数实际观察',observations:[],charts:[]},receipt:{classification:'MODEL_EXPLORATION',verification:'not_performed',execution_id:randomUUID()}};};
 const app=createOpenAnalysisApplication({agentLed:true,semanticAssessment:semantics,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
  const call=(name:string,args:any={})=>i.tools.find(t=>t.name===name)!.execute(args,i.signal);
  const frame=await call('set_framework',{goal:'件数合计',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'});
  assert.ok((frame as any).plan_sha256);assert.equal(frames,1);
  const request={goal:'件数观察',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}],code:'generated'};
  const held:any=await call('explore_with_python',request);assert.equal(held.code,'SEMANTIC_CONFLICT');assert.equal(held.next_tool,'interpret_meaning');assert.match(held.next_step,/件数还是金额/);assert.equal(held.calculation_performed,false);assert.equal(effects,0);
  if(!resolve){await call('ask_user',{text:'件数还是金额？'});return {text:'等待必要口径',tools:[]};}
  await call('assess_meaning',{definitions:[{dimension:'metric',value:question,user_quote:question}],conflicts:[]});
  const observed:any=await call('explore_with_python',request);assert.equal(observed.verification,'not_performed');assert.equal(effects,1);
  const checked:any=await call('calculate_and_verify');assert.equal(checked.calculation.value,'11');assert.equal(checked.verification.grade,'independent_arithmetic');return {text:'按件数计算并分别核验',tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>{frames++;return {saved:true,...r.identity};},saveClarification:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async r=>({saved:true,outcome_id:r.outcome_id,...r.identity})});
 const result=await app.run({identity,question,signal});assert.equal(result.state,resolve?'saved':'waiting');assert.equal(effects,resolve?1:0);
});


test('V13-LINE02: native line feedback explains CR/LF and explicit exact lines reach the same executor',async()=>{
 const base=scenario('correct'),program=["import json", "x=json.load(open(SOURCES[0]))", "label='a\\nb'", "if x:", "    pass"];let effects=0,executed='';
 const code:any=async()=>{throw Error('not used');};code.explore=async(r:any)=>{effects++;executed=r.code;return {value:{summary:'observed',observations:[],charts:[]},receipt:{classification:'MODEL_EXPLORATION',verification:'not_performed',execution_id:randomUUID()}};};
 const app=createOpenAnalysisApplication({agentLed:true,executeCode:code,saveExploration:async r=>({saved:true,...r.identity}),runtime:{run:async i=>{
  await i.tools.find(t=>t.name==='set_framework')!.execute({goal:'件数',source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,operation:'sum',column:'A',unit:'件'},i.signal);
  let turn=1;const current={...i,recoverInvalidArguments:true};const native=createNativeBusinessTools(()=>current,()=>turn).find(t=>t.name==='explore_with_python')!;const args={goal:'观察',bindings:[{source_id:selected.sources[0]!.source_id,sheet_id:selected.sources[0]!.sheets[0]!.sheet_id,columns:['A'],filters:[]}]};
  const feedback:any=await native.execute({...args,code_lines:program.map(line=>line+'\n')},i.signal);assert.equal(feedback.status,'invalid_arguments');assert.equal(effects,0);assert.match(feedback.issues[0].expected_schema.description,/CR\/LF/);assert.match(feedback.issues[0].expected_schema.description,/terminator/);
  turn++;const observed:any=await native.execute({...args,code_lines:program},i.signal);assert.equal(effects,1);assert.equal(executed,program.join('\n'));assert.equal(observed.verification,'not_performed');
  const correction=i.tools.find(t=>t.name==='correct_exploration_code')!;assert.match((correction.parameters as any).properties.code_lines.items.description,/CR\/LF/);
  turn++;await assert.rejects(()=>native.execute({...args,code_lines:['pass\r']},i.signal),{code:'TOOL_ARGUMENT_INVALID'});assert.equal(effects,1);await i.tools.find(t=>t.name==='calculate_and_verify')!.execute({},i.signal);return {text:'observed',tools:[]};
 }},loadSelectedSource:async()=>selected,isAuthorized:()=>true,saveFramework:async r=>({saved:true,...r.identity}),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async r=>({saved:true,outcome_id:r.outcome_id,...r.identity})});await app.run(base.input);
});
