import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import * as IR from '../../../packages/product-core/open-analysis-ir.ts';import {compileOpenAnalysisContext} from '../../../packages/product-core/open-analysis-context.ts';import {taskHash} from '../../../packages/product-core/member-task.ts';
const source_id=randomUUID(),source:any={version:'1.0',sources:[{source_id,display_name:'经营.csv',format:'csv',sha256:'a'.repeat(64),byte_length:'70',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'金额'},{column:'B',type:'string',value:'商品'},{column:'C',type:'string',value:'地区'}]},{row:2,cells:[{column:'A',type:'number',value:'10'},{column:'B',type:'string',value:'Coffee'},{column:'C',type:'string',value:'北'}]},{row:3,cells:[{column:'A',type:'number',value:'99'},{column:'B',type:'string',value:'Tea'},{column:'C',type:'string',value:'南'}]}]}]}]},question='分析Coffee的经营表现',context=compileOpenAnalysisContext({version:'1.1',goal:question,source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'元',group_by:null,filters:[{column:'B',operator:'eq',value:'Coffee'}]},question,source),frame:any={version:'1.0',origin:'MODEL_PROPOSAL',identity:{},context,plan:{...IR.compileOpenAnalysisIR(context.proposal.plan,source),context_sha256:taskHash(context)}};
const raw={goal:'观察地区分布及绘图',bindings:[{source_id,sheet_id:'csv',columns:['金额','地区'],filters:[]}]};
test('R1-CODE01/RV04/05: exploration IR physically materializes only source-bound columns and baseline scope before Python sees input',()=>{
 const compile=Reflect.get(IR,'compileOpenExplorationIR');assert.equal(typeof compile,'function','real generated analysis requires a consumed IR, not a prompt-only capability');const result=compile(raw,source,frame);
 assert.equal(result.plan.kind,'exploration');assert.equal(result.plan.context_sha256,taskHash(context));assert.equal(result.plan.snapshot_sha256,taskHash(result.snapshot));assert.equal(result.snapshot.sources.length,1);const rows=result.snapshot.sources[0].sheets[0].rows;assert.equal(rows.length,2);assert.deepEqual(rows[1].cells.map((c:any)=>c.value),['10','北']);assert.equal(JSON.stringify(rows).includes('Tea'),false);assert.equal(rows.some((r:any)=>r.cells.some((c:any)=>c.value==='99')),false);
 assert.throws(()=>compile({...raw,bindings:[{...raw.bindings[0],source_id:randomUUID()}]},source,frame));assert.throws(()=>compile({...raw,bindings:[{...raw.bindings[0],columns:['不存在']}]},source,frame));assert.equal(source.sources[0].sheets[0].rows.length,3);
});

test('R1-CODE01: implicit membership or relationship scope cannot expose unfiltered full rows as an exploratory snapshot',()=>{const compile=Reflect.get(IR,'compileOpenExplorationIR');for(const extra of [{membership:{semantics:{valid_statuses:['paid']}}}])assert.throws(()=>compile(raw,source,{...frame,plan:{...frame.plan,...extra}}),{code:'EXPLORATION_SCOPE_UNAVAILABLE'});});

test('R1-CODE01: exported exploratory chart values retain provenance and never inherit independent fact grade',async()=>{const report=await import('../../../packages/product-core/open-analysis-report.ts');const format=Reflect.get(report,'openAnalysisExplorationsText');assert.equal(typeof format,'function');const text=format([{plan:{goal:'地区探索'},value:{summary:'探索观察',observations:['原因未识别'],charts:[{title:'地区分布',type:'bar',unit:'元',points:[{label:'北',value:49}]}]},verification:'not_performed',receipt:{code_sha256:'c'.repeat(64)}}]);assert.match(text,/尚未独立核验/);assert.match(text,/北.*49/);assert.ok(text.includes('c'.repeat(64)));assert.doesNotMatch(text,/全部.*核验通过/);});

test('R1-CODE01: refund exploration physically narrows refund rows to eligible filtered order IDs',()=>{const src:any={version:'1.0',sources:[{...source.sources[0],sheets:[{...source.sources[0].sheets[0],rows:[{row:1,cells:[{column:'A',type:'string',value:'订单号'},{column:'B',type:'string',value:'金额'},{column:'C',type:'string',value:'商品'}]},{row:2,cells:[{column:'A',type:'string',value:'O1'},{column:'B',type:'number',value:'10'},{column:'C',type:'string',value:'Coffee'}]},{row:3,cells:[{column:'A',type:'string',value:'O2'},{column:'B',type:'number',value:'99'},{column:'C',type:'string',value:'Tea'}]}]}]},{source_id:randomUUID(),display_name:'退款.csv',format:'csv',sha256:'b'.repeat(64),byte_length:'20',sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[{row:1,cells:[{column:'A',type:'string',value:'退款号'},{column:'B',type:'string',value:'原订单号'},{column:'C',type:'string',value:'退款金额'}]},{row:2,cells:[{column:'A',type:'string',value:'R1'},{column:'B',type:'string',value:'O1'},{column:'C',type:'number',value:'2'}]},{row:3,cells:[{column:'A',type:'string',value:'R2'},{column:'B',type:'string',value:'O2'},{column:'C',type:'number',value:'20'}]}]}]}]},proposal={version:'1.7',goal:'Coffee净额',unit:'元',numeric_mode:'integer',inputs:[{source_id,sheet_id:'csv',column:'B',group_by:null,filters:[{column:'C',operator:'eq',value:'Coffee'}]},{source_id:src.sources[1].source_id,sheet_id:'csv',column:'C',group_by:null,filters:[]}],join:{kind:'refund_net',order_key:'A',refund_order_key:'B',refund_id:'A'}},context=compileOpenAnalysisContext(proposal,question,src),frame:any={version:'1.0',origin:'MODEL_PROPOSAL',identity:{},context,plan:{...IR.compileOpenAnalysisIR(context.proposal.plan,src),context_sha256:taskHash(context)}};const result=IR.compileOpenExplorationIR({goal:'净额分析',bindings:[{source_id,sheet_id:'csv',columns:['A','B'],filters:[]},{source_id:src.sources[1].source_id,sheet_id:'csv',columns:['A','B','C'],filters:[]}]},src,frame);assert.equal(result.snapshot.sources[0].sheets[0].rows.length,2);assert.equal(result.snapshot.sources[1].sheets[0].rows.length,2);assert.equal(JSON.stringify(result.snapshot).includes('R2'),false);assert.equal(JSON.stringify(result.snapshot).includes('O2'),false);});

test('R1-BASIS02: backend resolves real evidence reference, LLM need not mechanically transcribe text',async()=>{const {compileOpenSemanticInterpretation,semanticMessageId}=await import('../../../packages/product-core/open-analysis-semantics.ts');const task_id=randomUUID(),text='先比较两期Coffee销售，使用人民币元。',message_id=semanticMessageId(task_id,text);const result=compileOpenSemanticInterpretation({interpretations:[{dimension:'unit',value:'人民币元',status:'clear',evidence:[{message_id}]}],conflicts:[]},{task_id,messages:[{message_id,text}],inspection:source});assert.equal(result.definitions[0].interpretation!.evidence[0].quote,text);assert.equal(result.definitions[0].classification,'USER_INTERPRETED');assert.throws(()=>compileOpenSemanticInterpretation({interpretations:[{dimension:'unit',value:'元',status:'clear',evidence:[{message_id:randomUUID()}]}],conflicts:[]},{task_id,messages:[{message_id,text}]}),{code:'SEMANTIC_CONFIRMATION_INVALID'});const sourced=compileOpenSemanticInterpretation({interpretations:[{dimension:'filter',value:'只看Coffee',status:'clear',evidence:[{source:{source_id,source_sha256:'a'.repeat(64),sheet_id:'csv',row:2,column:'B'}}]}],conflicts:[]},{task_id,messages:[{message_id,text}],inspection:source});assert.equal(sourced.definitions[0].interpretation!.evidence[0].quote,'Coffee');assert.equal(sourced.definitions[0].classification,'SOURCE_INTERPRETED');});

test('R1-EVOLVE02: independent subtotal keeps unit bindings and business scope without pretending to be the net formula',async()=>{
 const {assertOpenExecutionEvolution}=await import('../../../packages/product-core/open-analysis-evolution.ts');
 const order={...frame.plan,column:'A',filters:[]},refund={...order,source_id:randomUUID(),source_sha256:'b'.repeat(64),column:'C'};
 const base={...frame,plan:{...order,version:'1.8',base:{...order,version:'1.7',inputs:[order,refund],join:{kind:'refund_net',order_key:'A',refund_order_key:'B',refund_id:'A'}},measure:{currency:'CNY',inputs:[{source_id:order.source_id,sheet_id:'csv',column:'A',scale:'1'},{source_id:refund.source_id,sheet_id:'csv',column:'C',scale:'1'}],output_label:'元',output_scale:'1'}}};
 const next={...frame,plan:{...refund,version:'1.8',base:refund,measure:{...base.plan.measure,inputs:[base.plan.measure.inputs[1]]}}};
 assert.doesNotThrow(()=>assertOpenExecutionEvolution(base,base,next));
 assert.throws(()=>assertOpenExecutionEvolution(base,base,{...next,plan:{...next.plan,measure:{...next.plan.measure,currency:'USD'}}}),{code:'FRAMEWORK_REVISION_REQUIRED'});
 const filtered={...base,plan:{...base.plan,base:{...base.plan.base,inputs:[{...order,filters:[{column:'C',operator:'eq',value:'Coffee'}]},refund]}}};
 assert.throws(()=>assertOpenExecutionEvolution(filtered,filtered,next),{code:'FRAMEWORK_REVISION_REQUIRED'});
});

test('R1-CODE04: safe chart projection accepts ancillary JSON without rendering it or changing the raw output',async()=>{
 const {validateOpenExplorationValue}=await import('../../../packages/product-core/open-analysis-exploration.ts');
 const raw={summary:'探索',observations:['尚未核验'],charts:[{title:'实际净额',type:'bar',unit:'元',points:[{label:'北',value:80,orders:1,html:'<script>must not render</script>'}],extra:'unrendered'}],attachments:{opinion:'not a fact'}};
 const saved=JSON.stringify(raw),result=validateOpenExplorationValue(raw);
 assert.deepEqual(result,{summary:'探索',observations:['尚未核验'],charts:[{title:'实际净额',type:'bar',unit:'元',points:[{label:'北',value:80}]}]});assert.equal(JSON.stringify(raw),saved);
 assert.throws(()=>validateOpenExplorationValue({...raw,charts:[{...raw.charts[0],points:[{label:'北',value:'80'}]}]}));
 assert.throws(()=>validateOpenExplorationValue({...raw,charts:[{...raw.charts[0],type:'html'}]}));
 assert.throws(()=>validateOpenExplorationValue({...raw,summary:undefined}));
});

test('R1-CODE05: finite fractional exploration persists through existing task codec without changing business-number rules',async()=>{
 const {validateOpenExplorationValue}=await import('../../../packages/product-core/open-analysis-exploration.ts');
 const value=validateOpenExplorationValue({summary:'探索比例',observations:[],charts:[{title:'占比',type:'bar',unit:'%',points:[{label:'北',value:53.48837209302326}]}]});
 assert.equal(value.charts[0]!.points[0]!.value,'53.48837209302326');assert.equal(taskHash(value).length,64);assert.deepEqual(validateOpenExplorationValue(value),value);
 assert.throws(()=>taskHash({business_value:53.48837209302326}));
});

test('R1-EVOLVE03: same-scope count uses its own unit without weakening monetary or filter constraints',async()=>{
 const {assertOpenExecutionEvolution}=await import('../../../packages/product-core/open-analysis-evolution.ts');
 const order={...frame.plan,filters:[]};
 const basis={...frame,plan:{...order,version:'1.8',base:order,measure:{currency:'CNY',inputs:[{source_id,sheet_id:'csv',column:'A',scale:'1'}],output_label:'元',output_scale:'1'}}};
 const context=compileOpenAnalysisContext({version:'1.1',goal:'订单笔数',source_id,sheet_id:'csv',column:'B',operation:'count',unit:'笔',group_by:'C',filters:[]},question,source);
 const next={...frame,context,plan:{...IR.compileOpenAnalysisIR(context.proposal.plan,source),context_sha256:taskHash(context)}};
 assert.doesNotThrow(()=>assertOpenExecutionEvolution(basis,basis,next));
 const calculation=IR.executeOpenAnalysisIR(next.plan,source);assert.equal(calculation.groups.reduce((n:any,g:any)=>n+Number(g.value),0),2);
 assert.throws(()=>assertOpenExecutionEvolution(basis,basis,{...next,plan:{...next.plan,operation:'sum'}}),{code:'FRAMEWORK_REVISION_REQUIRED'});
 const filtered={...basis,plan:{...basis.plan,base:{...order,filters:[{column:'B',operator:'eq',value:'Coffee'}]}}};
 assert.throws(()=>assertOpenExecutionEvolution(filtered,filtered,next),{code:'FRAMEWORK_REVISION_REQUIRED'});
});


test('R1-RT13: same actual monetary field expressed by header survives method evolution with fixed scope',async()=>{
 const {assertOpenExecutionEvolution}=await import('../../../packages/product-core/open-analysis-evolution.ts');
 const measure={currency:'CNY',inputs:[{source_id,sheet_id:'csv',column:'金额',scale:'1'}],output_label:'元',output_scale:'1'};
 const semantics:any={version:'1.1',definitions:[{dimension:'unit',interpretation:{status:'clear',unit:measure}}],conflicts:[]};
 const business:any={classification:'MODEL_PROPOSAL',purpose:'经营分析',object:'订单',scope:'全部记录',deliverables:['分组报告'],hypotheses:[],unknowns:[],execution_scope:[{source_id,sheet_id:'csv',filters:[]}]};
 const make=(group_by:string|null)=>{const context=compileOpenAnalysisContext({version:'1.2',numeric_mode:'decimal',goal:'经营表现',source_id,sheet_id:'csv',operation:'sum',column:'A',unit:'元',group_by,filters:[]},question,source,business,semantics);return {...frame,context,plan:{...IR.compileOpenAnalysisIR(context.proposal.plan,source),context_sha256:taskHash(context)}};};
 const basis=make(null),next=make('C');assert.doesNotThrow(()=>assertOpenExecutionEvolution(basis,basis,next));
 assert.equal(IR.executeOpenAnalysisIR(next.plan,source).groups!.reduce((n,g)=>n+Number(g.value),0),109);
 assert.throws(()=>assertOpenExecutionEvolution(basis,basis,{...next,plan:{...next.plan,measure:{...next.plan.measure!,inputs:[{...next.plan.measure!.inputs[0]!,scale:'10000'}]}}}),{code:'FRAMEWORK_REVISION_REQUIRED'});
 assert.throws(()=>assertOpenExecutionEvolution(basis,basis,{...next,plan:{...next.plan,measure:{...next.plan.measure!,inputs:[{...next.plan.measure!.inputs[0]!,column:'B'}]}}}),{code:'FRAMEWORK_REVISION_REQUIRED'});
});
