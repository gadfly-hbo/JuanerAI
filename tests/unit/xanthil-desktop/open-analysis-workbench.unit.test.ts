import test,{before} from 'node:test';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import assert from 'node:assert/strict';
import * as workspace from '../../../apps/browser/quick-analysis-workbench.mjs';
import type {QuickAnalysisWorkbenchState,QuickAnalysisTaskView} from '../../../apps/browser/quick-analysis-workbench.mjs';
function render(input:QuickAnalysisWorkbenchState){const fn=Reflect.get(workspace,'renderQuickAnalysisWorkbench');assert.equal(typeof fn,'function','Q11-01: confirmed quick workbench must consume actual task view');return fn(input);}

test('UI-A01/02: initial requests and running Agents visibly indicate activity without fictional progress',()=>{
 const pending=render({project:'本机',tasks:[],current:null,detail:'context',drawer:false,pending:true});assert.match(pending,/class="agent-spinner"/);assert.match(pending,/aria-busy="true"/);assert.match(pending,/正在处理/);assert.doesNotMatch(pending,/\d+%|剩余\d+秒/);
 for(const mode of ['quick','pro'] as const){const view=progressiveFixture();view.taskState='running';view.operationActive=true;view.report=null;const html=render({project:'本机',tasks:[],current:view,detail:'context',drawer:false,mode,stage:'analysis'});assert.match(html,/class="agent-spinner"/);assert.match(html,/role="status"[^>]*aria-live="polite"/);assert.match(html,/正在分析/);}
});

test('UI-A02/03: saved, waiting, failed, stopped and UNKNOWN are distinct and never pretend to be running',()=>{
 for(const [taskState,label]of [['saved','已保存'],['waiting','等待'],['failed','未完成'],['stopped','已停止'],['unknown','未确认|还没确认']] as const){const view=progressiveFixture();view.taskState=taskState;const html=render({project:'本机',tasks:[],current:view,detail:'context',drawer:false});assert.match(html,new RegExp(label));assert.doesNotMatch(html,/class="agent-spinner"/);assert.match(html,/aria-busy="false"/);}
});

test('UI-A01/02: requirement replies and report postprocessing do not display an idle or completed label while active',()=>{
 const view=progressiveFixture();view.taskState='ready';view.report=null;view.requirementDraft={sequence:4,revision:4,history:[],conversation:[],content:{version:'2.0',text:'Saved version four.'}};
 view.status='准备分析';const pending=render({project:'本机',tasks:[],current:view,detail:'context',drawer:false,pending:true});assert.match(pending,/class="agent-spinner"/);assert.match(pending,/正在处理/);assert.doesNotMatch(pending,/>准备分析</,'do not contradict the active feedback with an obsolete idle label');assert.match(pending,/<button[^>]+data-action="requirement-start"[^>]*disabled/,'pending new understanding cannot start the older version');
 for(const state of ['checking','reviewing','revising','rechecking']){view.operationActive=true;view.content={postprocessing:{state,report_version:1,notice:'只报告实际覆盖范围',notes:[],numbers:[],uncovered:[],numeric_limitations:[],review:null,versions:[],source_sha256:'source',report_sha256:'report'}};view.report={state:'saved',text:'R0已保存'};const html=render({project:'本机',tasks:[],current:view,detail:'context',drawer:false});assert.match(html,/class="agent-spinner"/);assert.match(html,/aria-busy="true"/);assert.match(html,/<button[^>]+data-action="stop"[^>]*>停止/,'R0 being saved does not remove the existing stop action for an active review');assert.doesNotMatch(html,/100%/);}
});
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



 test('OA-RT04: first pending material read exposes existing Stop action without enabling ordinary writes',()=>{const html=render({project:'本机',tasks:[],current:null,detail:'context',drawer:false,pending:true,readonly:true,stoppable:true});assert.match(html,/<button[^>]+data-action="stop"[^>]*>停止/);assert.doesNotMatch(html,/<button[^>]+data-action="stop"[^>]+disabled/);assert.match(html,/<button[^>]+disabled[^>]*>发送/);});







function progressiveFixture():any{return {id:'t',title:'退款后净额',taskState:'saved',status:'本轮成果已保存',messages:[],materials:[],events:[],planEditable:true,context:{summary:'净额',unknowns:[],semantics:{version:'1.0',scope:'current_task',definitions:[{dimension:'metric',value:'净额',classification:'MODEL_CANDIDATE'}],conflicts:[]}},framework:{goal:'净额',method:'求和',binding:'订单.csv',revision:'1'},computations:[{id:'net',method:'扣除退款的程序观察',summary:'45.5 元；该原始产物尚未独立核验',classification:'MODEL_COMPUTATION',verification:'not_performed',scope:[{label:'当前原件',value:'订单.csv'}],evidence:{execution_id:'net'}}],findings:[{id:'f',claim:'净额45.5元',value:'45.5',unit:'元',support:{description:'当前资料独立核验'},counterevidence:{description:'尚未取得'},limitations:['不能据此证明原因']}],report:{state:'saved',text:'净额45.5元'}};}


test('R1-UX01/UI-RV02: stopped and saved views do not display stop; a current run still can be stopped',()=>{
 const current=progressiveFixture();for(const taskState of ['saved','stopped','ready','waiting'] as const){current.taskState=taskState;const html=render({project:'Mini',tasks:[],current,drawer:false,detail:'context',stoppable:true});assert.doesNotMatch(html,/data-action="stop"/);}
 current.taskState='running';assert.match(render({project:'Mini',tasks:[],current,drawer:false,detail:'execution',stoppable:true}),/data-action="stop"/);
});




test('Q11-UX-R02: screenshot net-refund reply renders safe headings, emphasis and real table, with completed process inspectable',()=>{
 const current:QuickAnalysisTaskView={id:'refund',title:'销售额扣除退款后是多少',status:'本轮成果已保存',taskState:'saved',framework:null,materials:[],events:[],messages:[{role:'user',text:'销售额扣除退款后是多少'},{role:'assistant',text:'先读取资料。'},{role:'assistant',text:'先核对业务含义。'},{role:'assistant',text:'## 核验结果\n\n**净额：45.50 元**\n\n| 项目 | 数值（元） |\n| --- | --- |\n| 订单 | 50.75 |\n| 退款 | 5.25 |\n\n### 限制\n- 仅对应本次资料。\n<img src=x onerror=run()>\n[危险](javascript:run())'}],report:{state:'saved',text:'## 核验结果\n\n**净额：45.50 元**\n\n| 项目 | 数值（元） |\n| --- | --- |\n| 订单 | 50.75 |\n| 退款 | 5.25 |'}};
 const html=render({project:'Mini',tasks:[],current,detail:'context',drawer:false});assert.match(html,/<strong>净额：45.50 元<\/strong>/);assert.match(html,/<th[^>]*>项目<\/th>/);assert.match(html,/<td>5.25<\/td>/);assert.match(html,/先读取资料/);assert.doesNotMatch(html,/<details class="analysis-disclosure">/);assert.doesNotMatch(html,/<img|<script|href="javascript:/);assert.match(html,/&lt;img/);
 const report=render({project:'Mini',tasks:[],current,detail:'context',drawer:false,expanded:'report'});assert.match(report,/<table>/);assert.match(report,/<strong>净额：45.50 元<\/strong>/);
 const live=render({project:'Mini',tasks:[],current:{...current,taskState:'running',report:null},detail:'context',drawer:false});assert.match(live,/先读取资料/);assert.match(live,/先核对业务含义/);assert.match(live,/销售额扣除退款后是多少/);assert.doesNotMatch(live,/<details class="analysis-disclosure">/,'natural dialogue remains visible during execution');
});
















test('PL01/02: readable requirements remain a proposal until one explicit confirmation/start',()=>{
 const current:any={id:'language',title:'比较净销售额',status:'准备分析',taskState:'ready',materials:[],events:[],messages:[],framework:null,report:null,requirementDraft:{revision:2,reviewed:false,executed:false,staleResult:false,history:[],content:{version:'2.0',text:'SCR：只看 Coffee，比较两期净销售额。Binding：订单和退款。IR：保留归属未知，不认证净额。'}}};
 for(const mode of ['quick','pro'] as const){const html=render({project:'我的项目',tasks:[],mode,stage:'home',current,detail:'context',drawer:false,expanded:'requirement'});assert.match(html,/本次分析需求三核心/);assert.match(html,/只看 Coffee，比较两期净销售额/);assert.match(html,/已保存/);assert.match(html,/尚未确认/);assert.doesNotMatch(html,/data-action="requirement-review"/);assert.match(html,/<button[^>]+data-action="requirement-start"[^>]*>按当前理解分析/);assert.doesNotMatch(html,/data-action="requirement-start"[^>]*disabled/);assert.doesNotMatch(html,/用户已确认本版|核验通过/);}
});





test('UI-A02/F001: durable pending labels are not live operations; UNKNOWN and missing observations never become running',()=>{
 for(const operationActive of [false,undefined])for(const kind of ['analysis','suggestion','postprocessing']){
  const view=progressiveFixture();view.operationActive=operationActive;
  if(kind==='analysis')view.taskState='running';
  else if(kind==='suggestion')view.content={suggestion:{status:'generating'}};
  else view.content={postprocessing:{state:'reviewing',report_version:1,notice:'coverage unchanged',notes:[],numbers:[],uncovered:[],numeric_limitations:[],review:null,versions:[],source_sha256:'source',report_sha256:'report'}};
  const html=render({project:'Mini',tasks:[],current:view,detail:'context',drawer:false});assert.match(html,/data-agent-state="unknown"/);assert.match(html,/保存状态待确认/);assert.doesNotMatch(html,/class="agent-spinner"/);assert.match(html,/aria-busy="false"/);
 }
 const view=progressiveFixture();view.taskState='unknown';view.operationActive=true;view.content={suggestion:{status:'generating'}};const html=render({project:'Mini',tasks:[],current:view,detail:'context',drawer:false});assert.match(html,/data-agent-state="unknown"/);assert.doesNotMatch(html,/class="agent-spinner"/);
});
