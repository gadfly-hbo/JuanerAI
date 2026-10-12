import test from 'node:test';
import assert from 'node:assert/strict';
import * as client from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
const child=(id,parent,kind='subagent')=>({session:{id,title:id},relation:{parent_session_id:parent,kind},attempts:[{id:'attempt-'+id,status:'Succeeded'}],lifecycle:{open:true,epoch:0},parent_lifecycle:{open:true,epoch:0},valid:true,results:[{id:'result-'+id,value:{summary:'意见 '+id}}],deliveries:[]});
const project=groups=>{assert.equal(typeof client.collaborationCards,'function');return client.collaborationCards(groups);};
const meaningState=(taskState,pending=false)=>({mode:'quick',tasks:[],pending,current:{id:'root',title:'分析',taskState,status:({running:'正在分析',unknown:'UNKNOWN',failed:'分析未完成',stopped:'已停止',waiting:'需要你的说明'})[taskState],messages:[],framework:null,report:null,materials:[],events:[],context:{semantics:{definitions:[],conflicts:[{state:'unresolved',question:'退款按哪个期间归属？',alternatives:['订单期间','退款期间']}]}}}});
test('V13-UI-STATE01 actual active and interrupted task states are not replaced by a user clarification prompt',()=>{
 for(const taskState of ['running','unknown','failed','stopped']){
  const html=renderQuickAnalysisWorkbench(meaningState(taskState));
  assert.match(html,/data-analysis-moment="execution"/);assert.doesNotMatch(html,/<h2>需要你的说明<\/h2>/);
 }
 const html=renderQuickAnalysisWorkbench(meaningState('waiting',true));
 assert.match(html,/data-analysis-moment="execution"/);assert.doesNotMatch(html,/<h2>需要你的说明<\/h2>/);
});
test('V13-UI-STATE02 genuine waiting asks the actual question; active conflicts stay inspectable in the context drawer',()=>{
 const waiting=renderQuickAnalysisWorkbench(meaningState('waiting'));
 assert.match(waiting,/data-analysis-moment="meaning"/);assert.match(waiting,/<h2>需要你的说明<\/h2>/);assert.match(waiting,/退款按哪个期间归属？/);assert.match(waiting,/订单期间 \/ 退款期间/);
 const active=renderQuickAnalysisWorkbench({...meaningState('running'),drawer:true,detail:'context'});
 assert.match(active,/data-analysis-moment="execution"/);assert.match(active,/口径冲突 · 待确认/);assert.match(active,/退款按哪个期间归属？/);assert.match(active,/订单期间 \/ 退款期间/);assert.doesNotMatch(active,/<h2>需要你的说明<\/h2>/);
});
test('V13-UI-COL01 root Task receipt associates real child Attempt; nested acknowledgment belongs to its actual parent',()=>{
 const a=child('a','root','fork'),b=child('b','a');b.deliveries=[{result_id:'result-b',parent_session_id:'a',status:'returned'}];
 const cards=project([{parent_session_id:'root',parent:{deliveries:[{result_id:'result-a',status:'returned'}],reviews:[]},children:[a,b],requests:[{task_id:'root-task',attempt_id:'attempt-b',status:'unknown'}]}]);
 assert.equal(cards[0].depth,1);assert.equal(cards[0].kind,'fork');assert.equal(cards[0].pending,false);assert.equal(cards[1].depth,2);assert.equal(cards[1].parentTitle,'a');assert.equal(cards[1].pending,true);assert.equal(cards[1].returned,true);assert.equal(cards[1].usable,false);
});
test('V13-UI-COL01 returned model opinion is available for analysis; closed descendants preserve history without claiming current success',()=>{
 const a=child('a','root');a.deliveries=[{result_id:'result-a',parent_session_id:'root',status:'returned'}];
 const groups=[{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a],requests:[]}];
 let cards=project(groups);assert.equal(cards[0].usable,true);
 const render=collaboration=>renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:{id:'root',title:'分析',status:'正在分析',messages:[],framework:null,report:null,materials:[],events:[],collaboration},drawer:true,detail:'execution'});
 let html=render(cards);assert.match(html,/已返回，供后续分析参考/);assert.doesNotMatch(html,/待审，未采纳/);
 a.lifecycle={open:false,epoch:1};a.valid=false;cards=project(groups);assert.equal(cards[0].usable,false);assert.equal(cards[0].closed,true);html=render(cards);assert.match(html,/已关闭/);assert.match(html,/保留历史意见/);assert.doesNotMatch(html,/已返回，供后续分析参考/);
});

 test('V13-UI-TRACE01 actual read-only trace distinguishes Agent initiation, returned-only and subsequent model use',()=>{
 const a=child('a','root');a.relation.task='复核退款';a.relation.aggregate={scope:'本版订单与退款汇总，不含明细'};a.relation.selected_reports=[{id:'material-a',summary:'合法摘要'}];a.deliveries=[{result_id:'result-a',parent_session_id:'root',status:'returned'}];
 const groups=[{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a],requests:[],trace:{created:[{child_id:'a',material_id:'material-a',kind:'subagent',history_position:4}],consumed:[],human_created:[]}}];
 let card=project(groups)[0];assert.equal(card.actor,'Agent');assert.equal(card.startedAt,4);assert.equal(card.usedAt,null);assert.equal(card.purpose,'复核退款');assert.match(card.materialScope,/订单与退款汇总/);
 groups[0].trace.consumed.push({child_id:'a',result_id:'result-a',history_position:8});card=project(groups)[0];assert.equal(card.usedAt,8);
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:{id:'root',title:'分析',status:'正在分析',messages:[],framework:null,report:null,materials:[],events:[],collaboration:[card]},drawer:true,detail:'execution'});assert.match(html,/Agent 发起/);assert.match(html,/第 8 条/);assert.match(html,/子意见不等于核验结论/);
 groups[0].trace.created=[];groups[0].trace.consumed=[];card=project(groups)[0];assert.equal(card.actor,'未确认');assert.equal(card.usedAt,null);
 });

 test('V13-UI-BUSINESS-TITLE01 automatic child and ancestor labels use selected business goal without exposing internal reference paths',()=>{
 const a=child('a','root'),b=child('b','a');
 for(const c of [a,b]){c.session.title='检查反证：/framework、/calculation；/binding_sha256';c.relation.task=c.session.title;c.relation.automatic_instruction={action:'challenge'};c.relation.aggregate={content:JSON.stringify({framework:{goal:'二月退款金额合计'}})};}
 a.deliveries=[{result_id:'result-a',parent_session_id:'root',status:'returned'}];
 const cards=project([{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a,b],requests:[]}]);
 assert.equal(cards[0].title,'检查反证：二月退款金额合计');assert.equal(cards[0].purpose,cards[0].title);assert.equal(cards[1].parentTitle,cards[0].title);assert.equal(cards[1].depth,2);assert.equal(cards[0].usable,true);
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:{id:'root',title:'分析',status:'正在分析',messages:[],framework:null,report:null,materials:[],events:[],collaboration:cards},drawer:true,detail:'execution'});assert.match(html,/二月退款金额合计/);assert.doesNotMatch(html,/\/framework|binding_sha256/);
 assert.match(a.session.title,/\/framework/);delete b.relation.aggregate;assert.equal(project([{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[b],requests:[]}])[0].title,'检查反证：所选证据');
 });

 test('V13-UI-BUSINESS-TITLE02 selected bundle shows real fields and scope, never unselected material meaning',()=>{
 const a=child('a','root');a.relation.automatic_instruction={action:'compare',reference_paths:['/materials/first/calculation','/materials/second/calculation']};a.relation.aggregate={content:JSON.stringify({materials:{first:{business_binding:{operation:'sum',unit:'CNY',inputs:[{display_name:'订单.csv',fields:[{column:'amount',name:'订单金额'}],filters:[{column:'period',value:'2026-01'}]}]}},second:{business_binding:{operation:'sum',unit:'CNY',inputs:[{display_name:'订单.csv',fields:[{column:'amount',name:'订单金额'}],filters:[{column:'period',value:'2026-02'}]}]}},private:{business_binding:{inputs:[{display_name:'UNSELECTED_PRIVATE'}]}}}})};a.relation.selected_reports=[{id:'bundle'}];
 const card=project([{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a],requests:[]}])[0];assert.equal(card.materials.length,2);assert.match(card.title,/订单金额/);assert.match(card.title,/2026-01/);assert.match(card.title,/2026-02/);assert.doesNotMatch(JSON.stringify(card),/UNSELECTED_PRIVATE|\/materials\/|binding_sha256/);
 });

 test('V13-UI-HANDOFF01 existing collaboration detail shows approved business question with private purpose excluded and markup escaped',()=>{
 const a=child('a','root');a.relation.automatic_instruction={action:'challenge',private_purpose:'LOCAL_PRIVATE_PURPOSE',business_question:'北区净额下降来自订单变化，还是退款扣减？<script>bad()</script>'};a.relation.task='LOCAL_PRIVATE_PURPOSE /framework';a.relation.aggregate={content:JSON.stringify({framework:{goal:'北区两期净额'}})};
 const card=project([{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a],requests:[]}])[0];
 assert.equal(card.title,'检查反证：北区两期净额');assert.equal(card.purpose,a.relation.automatic_instruction.business_question);assert.doesNotMatch(JSON.stringify(card),/LOCAL_PRIVATE_PURPOSE|\/framework/);
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:{id:'root',title:'分析',status:'正在分析',messages:[],framework:null,report:null,materials:[],events:[],collaboration:[card]},drawer:true,detail:'execution'});
 assert.match(html,/北区净额下降来自订单变化，还是退款扣减？/);assert.doesNotMatch(html,/<script>|LOCAL_PRIVATE_PURPOSE/);assert.match(html,/&lt;script&gt;/);
 delete a.relation.automatic_instruction.business_question;const historical=project([{parent_session_id:'root',parent:{deliveries:[],reviews:[]},children:[a],requests:[]}])[0];assert.equal(historical.purpose,historical.title);
 });
