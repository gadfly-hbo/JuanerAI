import test from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../../../apps/browser/quick-analysis-workbench.mjs';
import type {QuickAnalysisWorkbenchState,QuickAnalysisTaskView} from '../../../apps/browser/quick-analysis-workbench.mjs';
function render(input:QuickAnalysisWorkbenchState){const fn=Reflect.get(workspace,'renderQuickAnalysisWorkbench');assert.equal(typeof fn,'function','Q11-01: confirmed quick workbench must consume actual task view');return fn(input);}
test('Q11-01/05/06: confirmed sidebar, conversation and drawer render actual state with textual brand',()=>{
 const html=render({project:'本机项目',tasks:[{id:'task-a',title:'订单金额分析'}],current:{id:'task-a',title:'订单金额分析',status:'等待必要信息',messages:[{role:'user',text:'分析这些订单的金额'},{role:'assistant',text:'请说明金额字段的单位。'}],framework:null,report:null,materials:[],events:[]},detail:'context',drawer:true});
 for(const cls of ['sidebar','thread','drawer','composer-wrap','brand-slogan'])assert.match(html,new RegExp(`class="[^"\\n]*${cls}`));
 assert.match(html,/持续做出更好的决策/);assert.match(html,/请说明金额字段的单位/);assert.match(html,/订单金额分析/);assert.doesNotMatch(html,/<img|iframe|合成审核|销售变化分析/);
});
test('Q11-04/11/12: UNKNOWN is read-only recovery, never a continue or fake completion',()=>{
 const html=render({project:'项目',tasks:[],current:{id:'task-a',title:'待核对',status:'UNKNOWN',messages:[],framework:null,report:null,materials:[],events:[]},detail:'execution',drawer:true});
 assert.match(html,/上次请求还没确认/);assert.match(html,/查看保存结果/);assert.doesNotMatch(html,/已完成|继续执行|100%/);assert.match(html,/<button[^>]+disabled[^>]*>发送/);
});
test('Q11-01/06: user text and report are escaped; expanded work stays in the same task',()=>{
 const html=render({project:'<img src=x>',tasks:[],current:{id:'task-a',title:'<script>alert(1)</script>',status:'已保存',messages:[],framework:null,report:{text:'<img onerror=run()>',state:'saved'},materials:[],events:[]},detail:'evidence',drawer:true,expanded:'report'});
 assert.doesNotMatch(html,/<script|<img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/返回对话/);assert.match(html,/报告已保存/);assert.match(html,/&lt;img onerror=run\(\)&gt;/);
});

test('Q11-05/06: PX004 uses actual hypotheses and child state without invented supported claims',()=>{
const view:QuickAnalysisTaskView={id:'t',title:'核实变化',status:'已保存',messages:[],framework:null,report:{text:'指标算术已核验；原因仍待验证',state:'saved'},materials:[],events:[],context:{summary:'变化',unknowns:[],business:{purpose:'核实变化',object:'会员',scope:'两期',deliverables:['报告'],hypotheses:[{text:'权益可能到期 <script>'}]}},collaboration:[{id:'c',title:'核对权益',status:'Stopped',pending:false,summary:'尚无结果',returned:false,review:null}]};
const h=render({mode:'pro',stage:'analysis',project:'本机',tasks:[],current:view,detail:'context',drawer:false});
assert.match(h,/class="hypo"/);assert.match(h,/待验证 · 模型提议/);assert.match(h,/class="subagent-card"/);assert.match(h,/已停止/);assert.match(h,/data-child="c"/);assert.doesNotMatch(h,/已支持|<script>/);

});

 test('OA-RT04: first pending material read exposes existing Stop action without enabling ordinary writes',()=>{const html=render({project:'本机',tasks:[],current:null,detail:'context',drawer:false,pending:true,readonly:true,stoppable:true});assert.match(html,/<button[^>]+data-action="stop"[^>]*>停止/);assert.doesNotMatch(html,/<button[^>]+data-action="stop"[^>]+disabled/);assert.match(html,/<button[^>]+disabled[^>]*>发送/);});

test('OA-08: same report surface separates escaped USER expression from original checked facts in both modes',()=>{const current:QuickAnalysisTaskView={id:'t',title:'数量',status:'已保存',messages:[],framework:null,report:{state:'saved',text:'已核验10件',expression:{origin:'USER',expression_version:2,text:'用户措辞 <script>坏</script>'}},materials:[],events:[]};for(const mode of ['quick','pro'] as const){const html=render({mode,stage:'report',project:'本机',tasks:[],current,detail:'evidence',drawer:false,expanded:'report'});assert.match(html,/修改报告表达/);assert.match(html,/已核验10件/);assert.match(html,/用户修改的报告表达/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);}});

test('FM-A01/FUI-01: task-only definitions and real pending conflict appear in confirmed quick and professional locations without invented project authority',()=>{const current:any={id:'t',title:'销售分析',status:'需要补充说明',messages:[],framework:null,report:null,materials:[],events:[],context:{summary:'销售分析',unknowns:[],semantics:{version:'1.0',scope:'current_task',definitions:[{dimension:'metric',value:'净销售额',classification:'MODEL_CANDIDATE',user_quote:null,user_question:null}],conflicts:[{dimension:'metric',question:'订单额还是净销售额？',alternatives:['订单额','净销售额'],state:'unresolved',selected:null,resolution_quote:null,user_question:null}]}}};for(const mode of ['quick','pro'] as const){const html=render({mode,stage:'analysis',project:'本机',tasks:[],current,detail:'context',drawer:true});assert.match(html,/仅用于这次分析/);assert.match(html,/指标/);assert.match(html,/模型候选/);assert.match(html,/口径冲突 · 待确认/);assert.match(html,/订单额还是净销售额/);assert.match(html,/依赖计算尚未执行/);assert.doesNotMatch(html,/项目v2|企业标准已更新|计算已完成/);}current.context.semantics.conflicts[0]={...current.context.semantics.conflicts[0],state:'resolved',selected:'净销售额',resolution_quote:'本次使用净销售额',user_question:'本次使用净销售额'};const html=render({project:'本机',tasks:[],current,detail:'context',drawer:true});assert.match(html,/本次已选择/);assert.match(html,/本次使用净销售额/);assert.doesNotMatch(html,/口径冲突 · 待确认/);});

test('FM-A03/FUI-03: qualified partial results remain inspectable beside a real failed task, no final report or whole-task completion',()=>{const current:any={id:'t',title:'多步核对',status:'分析未完成，请查看执行记录',messages:[],framework:null,report:null,materials:[],events:[],partials:[{id:'step',goal:'已核对数量',value:'10',unit:'件',grade:'independent_arithmetic',scope:[{label:'来源 / 工作表',value:'数量.csv / CSV'}],evidence:{step_id:'step',revision:'1',run_id:'r',plan_sha256:'plan',result_sha256:'result'}}]};for(const mode of ['quick','pro'] as const){const html=render({mode,stage:'analysis',project:'本机',tasks:[],current,detail:'evidence',drawer:true});assert.match(html,/已核验的部分成果/);assert.match(html,/不代表整项分析完成/);assert.match(html,/数量.csv \/ CSV/);assert.match(html,/已核对的计算结果/);assert.match(html,/10/);assert.match(html,/data-step="step"/);assert.doesNotMatch(html,/报告已保存|整项分析已完成/);}current.focusedStep=current.partials[0];const focused=render({project:'本机',tasks:[],current,detail:'evidence',drawer:true});assert.match(focused,/数量.csv \/ CSV/);assert.match(focused,/部分成果的计算依据/);assert.match(focused,/result/);});

function progressiveFixture():any{return {id:'t',title:'退款后净额',taskState:'saved',status:'本轮成果已保存',messages:[],materials:[],events:[],planEditable:true,planReusable:true,context:{summary:'净额',unknowns:[],semantics:{version:'1.0',scope:'current_task',definitions:[{dimension:'metric',value:'净额',classification:'MODEL_CANDIDATE'}],conflicts:[]}},framework:{goal:'净额',method:'求和',binding:'订单.csv',revision:'1',steps:[{id:'net',title:'扣除退款',dependencies:[],status:'verified',scope:[],hypotheses:[],evidence:[],limitations:[]}]},partials:[{id:'net',goal:'扣除退款',value:'45.5',unit:'元',grade:'independent_arithmetic',scope:[],evidence:{}}],findings:[{id:'f',claim:'净额45.5元',value:'45.5',unit:'元',support:{description:'当前资料独立核验'},counterevidence:{description:'尚未取得'},limitations:['不能据此证明原因']}],report:{state:'saved',text:'净额45.5元'}};}
test('R1-UX01/UI-RV01: saved quick answer stays a conversation; full meaning, plan and steps are inspected on demand',()=>{
 const current=progressiveFixture();current.messages=[{role:'user',text:'销售额扣除退款是多少？'},{role:'assistant',text:'扣除退款后45.5元；不能据此证明原因。'}];
 const html=render({project:'Mini',tasks:[],current,drawer:false,detail:'context'}),thread=html.slice(html.indexOf('<div class="thread"'),html.indexOf('</div><aside class="same-task-assistant"'));
 assert.match(thread,/扣除退款后45.5元/);assert.match(thread,/不能据此证明原因/);assert.doesNotMatch(thread,/<h2>分析口径|<h2>分析方案|各步骤的核验成果|口径与方案/);
 const inspected=render({project:'Mini',tasks:[],current,drawer:true,detail:'plan'});assert.match(inspected,/已绑定资料/);assert.match(inspected,/扣除退款/);
});
test('R1-UX01/UI-RV05: default tools stay compact and optional methods/collaboration remain available through more',()=>{
 const current=progressiveFixture(),base={project:'Mini',tasks:[],current,drawer:false,detail:'context' as const},html=render(base),chips=html.slice(html.indexOf('<div class="tool-chips"'),html.indexOf('<label class="sr-only" for="analysis-message"'));
 assert.match(chips,/data-action="files"/);assert.match(chips,/data-action="more"/);assert.match(chips,/data-action="report"/);assert.doesNotMatch(chips,/data-action="skill"|data-action="prompt"|data-action="fork"|data-action="subagent"/);
 const more=render({...base,drawer:true,detail:'more' as any});for(const a of ['skill','prompt','fork','subagent','reuse-plan'])assert.match(more,new RegExp('data-action="'+a+'"'));
});
test('R1-UX01/UI-RV02: stopped and saved views do not display stop; a current run still can be stopped',()=>{
 const current=progressiveFixture();for(const taskState of ['saved','stopped','ready','waiting'] as const){current.taskState=taskState;const html=render({project:'Mini',tasks:[],current,drawer:false,detail:'context',stoppable:true});assert.doesNotMatch(html,/data-action="stop"/);}
 current.taskState='running';assert.match(render({project:'Mini',tasks:[],current,drawer:false,detail:'execution',stoppable:true}),/data-action="stop"/);
});
test('FM-UX-P01/R1-UX01: saved answer leads; prior meaning, plan, receipts and reuse stay inspectable at existing locations',()=>{
 const current=progressiveFixture(),base={project:'Mini',tasks:[],current,drawer:false,detail:'context' as const},html=render(base);
 assert.match(html,/data-analysis-moment="results"/);assert.match(html,/净额45.5元/);assert.match(html,/不能据此证明原因/);
 const context=render({...base,drawer:true,detail:'context'});assert.match(context,/分析口径/);assert.match(context,/模型候选/);
 const plan=render({...base,drawer:true,detail:'plan'});assert.match(plan,/分析方案/);assert.match(plan,/已绑定资料/);assert.match(plan,/查看可沿用的方案/);
 const receipts=render({...base,drawer:true,detail:'execution'});assert.match(receipts,/各步骤的核验成果/);assert.match(receipts,/独立算术核验/);assert.match(receipts,/data-step="net"/);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
});
test('FM-UX-P01: conflict, preview and UNKNOWN outrank a stale saved report; no success or hidden actionable conflict',()=>{
 const current=progressiveFixture();current.taskState='unknown';current.status='UNKNOWN';
 let html=render({project:'Mini',tasks:[],current,drawer:false,detail:'execution'});const thread=html.slice(html.indexOf('<div class="thread"'),html.indexOf('</div><aside class="same-task-assistant"'));
 assert.match(thread,/data-analysis-moment="execution"/);assert.doesNotMatch(thread,/净额45.5元|<h2>分析成果/);assert.match(thread,/扣除退款|部分成果/);
 current.taskState='saved';current.context.semantics.conflicts=[{dimension:'metric',question:'订单额还是净额？',alternatives:['订单额','净额'],state:'unresolved'}];html=render({project:'Mini',tasks:[],current,drawer:false,detail:'context'});assert.match(html,/data-analysis-moment="meaning"/);assert.match(html,/订单额还是净额？/);
 current.context.semantics.conflicts=[];current.preview={state:'waiting',text:'请说明修改后的期间'};html=render({project:'Mini',tasks:[],current,drawer:false,detail:'plan'});assert.match(html,/data-analysis-moment="amendment"/);assert.match(html,/请说明修改后的期间/);
});
test('FM-UX-P01: only a not-yet-executed current plan leads with proposal, professional six stages stay intact',()=>{
 const current=progressiveFixture();current.taskState='ready';current.report=null;current.findings=[];current.partials=[];current.framework.steps[0].status='pending';
 const html=render({project:'Mini',tasks:[],current,drawer:false,detail:'plan'});assert.match(html,/data-analysis-moment="plan"/);assert.match(html,/data-open="plan"/);
 const professional=render({mode:'pro',stage:'analysis',project:'Mini',tasks:[],current,drawer:false,detail:'plan'});assert.equal((professional.match(/data-stage=/g)??[]).length,6);assert.match(professional,/<h2>循证分析/);assert.match(professional,/分析方案/);
});

test('Q11-UX-R02: screenshot net-refund reply renders safe headings, emphasis and real table, with completed process inspectable',()=>{
 const current:QuickAnalysisTaskView={id:'refund',title:'销售额扣除退款后是多少',status:'本轮成果已保存',taskState:'saved',framework:null,materials:[],events:[],messages:[{role:'user',text:'销售额扣除退款后是多少'},{role:'assistant',text:'先读取资料。'},{role:'assistant',text:'先核对业务含义。'},{role:'assistant',text:'## 核验结果\n\n**净额：45.50 元**\n\n| 项目 | 数值（元） |\n| --- | --- |\n| 订单 | 50.75 |\n| 退款 | 5.25 |\n\n### 限制\n- 仅对应本次资料。\n<img src=x onerror=run()>\n[危险](javascript:run())'}],report:{state:'saved',text:'## 核验结果\n\n**净额：45.50 元**\n\n| 项目 | 数值（元） |\n| --- | --- |\n| 订单 | 50.75 |\n| 退款 | 5.25 |'}};
 const html=render({project:'Mini',tasks:[],current,detail:'context',drawer:false});assert.match(html,/<strong>净额：45.50 元<\/strong>/);assert.match(html,/<th[^>]*>项目<\/th>/);assert.match(html,/<td>5.25<\/td>/);assert.match(html,/<details[^>]*>[\s\S]*查看对话过程[\s\S]*先读取资料/);assert.doesNotMatch(html,/<img|<script|href="javascript:/);assert.match(html,/&lt;img/);
 const report=render({project:'Mini',tasks:[],current,detail:'context',drawer:false,expanded:'report'});assert.match(report,/<table>/);assert.match(report,/<strong>净额：45.50 元<\/strong>/);
 const live=render({project:'Mini',tasks:[],current:{...current,taskState:'running',report:null},detail:'context',drawer:false});assert.match(live,/<details class="analysis-disclosure"><summary>查看对话过程<\/summary>[\s\S]*先读取资料/,'raw intermediate dialogue is still inspectable in an existing closed disclosure');const visibleLive=live.replace(/<details class="analysis-disclosure">[\s\S]*?<\/details>/g,'');assert.doesNotMatch(visibleLive,/先读取资料|先核对业务含义|净额：45.50/);assert.match(visibleLive,/销售额扣除退款后是多少/);
});

test('Q11-UX-C04: interpretation is visibly model understanding, never falsely labelled human confirmation',()=>{
 const current:any={id:'refund',title:'净额',status:'准备分析',taskState:'ready',messages:[],framework:null,report:null,materials:[],events:[],context:{summary:'净额',semantics:{definitions:[{dimension:'unit',value:'人民币万元',classification:'USER_INTERPRETED',user_quote:'万，人民币'}],conflicts:[{state:'resolved',selected:'人民币万元',resolution_quote:'万，人民币',interpretation_key:'source-linked'}]}}};const html=render({project:'Mini',tasks:[],current,detail:'context',drawer:true});assert.match(html,/根据你的说明理解/);assert.match(html,/本次理解/);assert.doesNotMatch(html,/本次已选择|你已明确选择/);
});

test('R1-CODE01/UI-RV04: generated chart is inspectable as unverified exploration, never inherits the report arithmetic grade',()=>{
 const current=progressiveFixture();current.explorations=[{id:'explore',goal:'观察分布',summary:'平方评分探索',observations:['仍需方法验算'],charts:[{title:'分布 <script>',type:'bar',unit:'分',points:[{label:'北',value:49}]}],sources:['经营.csv / CSV'],verification:'not_performed',code_sha256:'c'.repeat(64)}];
 const html=render({project:'Mini',tasks:[],current,drawer:false,detail:'context',expanded:'report'});assert.match(html,/探索图表/);assert.match(html,/尚未独立核验/);assert.match(html,/经营.csv \/ CSV/);assert.match(html,/49/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/查看执行与来源/);
 const base=render({project:'Mini',tasks:[],current,drawer:false,detail:'context'}),thread=base.slice(base.indexOf('<div class="thread"'),base.indexOf('<section class="workspace"'));assert.match(thread,/探索结果尚未独立核验/);assert.doesNotMatch(thread,/分布 &lt;script/);
});


test('R1-UX03/UI-RV06: complete revision bindings are inspectable inside a closed disclosure, not forced central modules',()=>{
 const current:any={id:'t',title:'销售分析',status:'已保存',messages:[],materials:[],events:[],framework:null,report:null,preview:{command_id:'c',state:'ready',question:'仅北区',text:'**范围缩小**，旧成果保留。',scope:[{label:'来源 / 工作表',value:'订单.csv / CSV'},{label:'筛选条件',value:'地区 等于 北'}],changes:[{label:'筛选条件',before:'无',after:'地区 等于 北'}],impacts:['需重新计算与核验'],goal:'北区销售',method:'求和'}};const html=render({mode:'quick',project:'Mini',detail:'context',drawer:false,tasks:[],current});
 assert.match(html,/<details><summary>查看拟采用方案与执行范围<\/summary>/);
 assert.match(html,/<strong>范围缩小<\/strong>/);assert.match(html,/地区 等于 北/);assert.match(html,/采纳并重新计算/);assert.doesNotMatch(html,/<details open/);
});


test('R1-UX06/RV05: model self-verification words remain explanation, distinct from actual arithmetic in quick/pro report',()=>{
 const current:QuickAnalysisTaskView={id:'t',title:'经营分析',status:'已保存',taskState:'saved',messages:[{role:'user',text:'经营分析'},{role:'assistant',text:'所有交叉切片已独立核验'}],framework:null,report:{text:'所有交叉切片已独立核验',state:'saved'},materials:[],events:[]};
 for(const input of [{mode:'quick'},{mode:'quick',expanded:'report'},{mode:'pro',stage:'report'}] as const){
  const html=render({project:'合成',tasks:[],current,detail:'context',drawer:false,...input});assert.match(html,/AI解读/);assert.match(html,/这是 AI 解读；数字的核验范围可查看证据/);assert.match(html,/所有交叉切片已独立核验/,'model original is retained, not silently rewritten');assert.doesNotMatch(html,/整份报告已核验|全部数字已由系统核验/);
 }
 const chat=render({project:'合成',tasks:[],detail:'context',drawer:false,current:{...current,report:{text:'好的，我们等等。',state:'saved',conversation:true},messages:[{role:'assistant',text:'好的，我们等等。'}]}});assert.doesNotMatch(chat,/这是 AI 解读；数字的核验范围可查看证据/,'ordinary chat does not gain report warnings');
});

test('NU01/02/03: checked report numbers open existing evidence drawer, formulas expose operands and return',()=>{
 const value={id:'F1',label:'一月净额',value:'430',display:'430',unit:'元',currency:'CNY',grade:'independent_arithmetic',status:'verified',scope:'订单与退款 / 一月',references:[],plan_sha256:'plan',result_sha256:'result',source_sha256:'source',proof_sha256:'proof',limitations:['算术一致不证明原因。']};
 const derived={...value,id:'D1',label:'差额',value:'190',display:'190.00',grade:'derived_formula',references:['F1','F2'],expression:{op:'subtract',left:{reference:'F2'},right:{reference:'F1'}}};
 const current:any={id:'r2',title:'净销售额',taskState:'saved',status:'已保存',framework:null,materials:[],events:[],messages:[{role:'assistant',text:'一月[430 元](juanerai-number:F1)，差额[190.00 元](juanerai-number:D1)。[伪造](juanerai-number:missing)'}],report:{text:'一月[430 元](juanerai-number:F1)',state:'saved'},numericValues:[value,{...value,id:'F2',label:'二月净额',value:'620',display:'620'},derived],focusedNumber:derived,numberReturn:'F1'};
 const base=render({project:'Mini',tasks:[],current,drawer:false,detail:'context'});
 assert.match(base,/data-number="F1"/);assert.match(base,/data-number="D1"/);assert.doesNotMatch(base,/data-number="missing"|<h3>数字依据/);
 const evidence=render({project:'Mini',tasks:[],current,drawer:true,detail:'evidence'});
 assert.match(evidence,/数字依据/);assert.match(evidence,/派生公式已核验/);assert.match(evidence,/data-number="F2"/);assert.match(evidence,/data-number-return="F1"/);assert.match(evidence,/source/);assert.match(evidence,/算术一致不证明原因/);
});


test('NU06: professional analysis and report use the same current numeric links, never expose protocol markers',()=>{
 const value={id:'F1',label:'净额',value:'430',display:'430',unit:'元',currency:'CNY',grade:'independent_arithmetic',status:'verified',scope:'实际订单与退款',references:[],plan_sha256:'plan',result_sha256:'result',source_sha256:'source',proof_sha256:'proof',limitations:[]};
 const current:any={id:'r2',title:'净额',taskState:'saved',status:'已保存',framework:null,materials:[],events:[],messages:[{role:'assistant',text:'净额[430 元](juanerai-number:F1)。'}],report:{text:'净额[430 元](juanerai-number:F1)。',state:'saved'},numericValues:[value]};
 for(const stage of ['analysis','report']){const html=render({mode:'pro',stage:stage as any,project:'Mini',tasks:[],current,drawer:false,detail:'context'});assert.match(html,/data-number="F1"/);assert.doesNotMatch(html,/juanerai-number:/);assert.equal((html.match(/data-stage=/g)??[]).length,6);}
});

test('PL01/02: saved requirements speak about the business, while confirmation and execution remain separate',()=>{
 const current:any={id:'language',title:'比较净销售额',status:'准备分析',taskState:'ready',materials:[],events:[],messages:[],framework:null,report:null,requirementDraft:{revision:2,reviewed:false,executed:false,staleResult:false,history:[],content:{business:{purpose:'只看 Coffee，比较两期净销售额。',object:'订单',scope:'两期 Coffee 订单',deliverables:['净销售额比较'],unknowns:[]},methods:['订单金额减关联退款'],evidence:['订单和退款'],previews:[]}}};
 for(const mode of ['quick','pro'] as const){
  const html=render({project:'我的项目',tasks:[],mode,stage:'home',current,detail:'context',drawer:false,expanded:'requirement'});
  assert.match(html,/我们准备这样分析/);assert.match(html,/只看 Coffee，比较两期净销售额/);assert.match(html,/已保存/);assert.match(html,/看看是否符合你的想法/);
  assert.match(html,/<button[^>]+data-action="requirement-review"[^>]*>确认方案/);
  assert.match(html,/<button[^>]+data-action="requirement-start"[^>]+disabled[^>]*>开始分析/);
  assert.doesNotMatch(html,/保存没有启动分析|整体审阅|待审阅的需求框架/);
 }
 const unacknowledged=render({project:'我的项目',tasks:[],current:{...current,requirementDraft:null},detail:'context',drawer:false});
 assert.doesNotMatch(unacknowledged,/已保存|确认方案/,'no saved framework without an acknowledged projection');
});


test('V13-UI04: current root sidebar locates actual child/grandchild dialogues within accepted PX006 layout',()=>{
 const html=render({project:'本机',tasks:[{id:'t',title:'净额分析'}],current:{id:'t',title:'净额分析',status:'正在分析',messages:[],framework:null,report:null,materials:[],events:[],collaboration:[{id:'c',title:'检查来源',parentId:'root',parentTitle:'主分析',depth:1,kind:'subagent',status:'Running',pending:false,returned:false,review:null},{id:'g',title:'核对单位',parentId:'c',parentTitle:'检查来源',depth:2,kind:'fork',status:'Succeeded',pending:false,returned:true,review:null}]},drawer:false,detail:'context'});
 const sidebar=html.match(/<nav class="sidebar"[\s\S]*?<\/nav>/)?.[0];assert.ok(sidebar);assert.match(sidebar,/data-child="c"/);assert.match(sidebar,/data-child="g"/);assert.match(sidebar,/孙任务|嵌套/);assert.match(sidebar,/检查来源/);assert.doesNotMatch(sidebar,/核验通过/);
});
