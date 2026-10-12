import test from 'node:test';
import assert from 'node:assert/strict';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
const source={sources:[{source_id:'s1',display_name:'经营.csv',sheets:[{sheet_id:'sheet1',name:'本期',rows:[{cells:[{column:'A',value:'金额'},{column:'B',value:'地区'},{column:'C',value:'次数'}]}]}]},{source_id:'s2',display_name:'台账.csv',sheets:[{sheet_id:'sheet2',name:'上期',rows:[{cells:[{column:'A',value:'台账金额'},{column:'B',value:'对象'}]}]}]}]};
const binding={source_id:'s1',sheet_id:'sheet1',column:'A',group_by:'B',filters:[]};
const task=plan=>({identity:{task_id:'r3',revision:'1'},question:'经营分析',state:'ready',source,framework:{plan},history:[]});
test('VU-01/02: existing plan drawer displays actual weights, denominator, both periods, rounding and reconciliation without a new page',()=>{
 const weighted=openTaskView(task({...binding,version:'1.9',operation:'weighted_mean',weight_column:'C',goal:'weighted',unit:'元'}));assert.match(JSON.stringify(weighted.framework.scope),/次数/);assert.match(JSON.stringify(weighted.framework.scope),/加权平均/);
 const inputs=[binding,{source_id:'s2',sheet_id:'sheet2',column:'A',group_by:'B',filters:[]}];for(const [plan,expected] of [[{version:'2.0',operation:'group_share',...binding,input_unit:'元',unit:'%'},'分母'],[{version:'2.1',operation:'group_change',...binding,inputs,comparison_label:'上期',current_label:'本期',unit:'元'},'台账金额'],[{version:'2.2',operation:'proportional_allocation',...binding,inputs,unit:'元',rounding:{decimals:2,method:'largest_remainder',tie_break:'object_key'}},'余数'],[{version:'2.3',operation:'reconcile',...binding,inputs,unit:'元',left_label:'实际',right_label:'台账',grain:'one_row_per_key',cardinality:'one_to_one'},'一对一']]){const view=openTaskView(task({...plan,goal:'经营分析'}));assert.match(JSON.stringify(view.framework.scope),new RegExp(expected));const html=renderQuickAnalysisWorkbench({tasks:[],current:view,drawer:true,detail:'plan'});assert.match(html,/检查详情|分析方案/);assert.ok(!html.includes('<iframe'));}
});

test('VU-02/03: current and historical percent proofs show units in the existing report and evidence drawer',()=>{
 for(const display of ['54.55','54.55%']){
 const number={id:'F1',label:'北区金额占比',value:'600/11',display,unit:'%',currency:null,grade:'independent_arithmetic',status:'verified',scope:'同范围经营收入',references:[],limitations:[]};
 const html=renderQuickAnalysisWorkbench({tasks:[],current:{identity:{task_id:'r3',revision:'1'},question:'地区占比',state:'saved',report:{state:'saved',revision:'1',text:'北区['+display+'](juanerai-number:F1)'},numericValues:[number]},expanded:'report',drawer:true,detail:'number',number:'F1'});
 assert.match(html,/54\.55%<\/button>/);assert.doesNotMatch(html,/54\.55%%/);
 }
});

test('VC10/VU05/06: current executed scope and lifecycle are distinct from preserved preparation background in both modes',()=>{
 const original=task({...binding,version:'1.9',operation:'weighted_mean',weight_column:'C',goal:'东部加权',unit:'元'});
 original.framework.context={proposal:{plan:original.framework.plan},question:{text:'仅准备，等待开始'},business:{purpose:'仅准备，不计算，等待开始',object:'经营',scope:'东/西',deliverables:['准备方案'],hypotheses:[],execution_scope:[{...binding,filters:[{column:'B',operator:'eq',value:'东'}]}]},semantics:{definitions:[{dimension:'population',value:'东/西',classification:'MODEL_CANDIDATE'}],conflicts:[]}};
 const before=JSON.stringify(original);
 for(const state of ['waiting','saved']){const current={...original,state};const view=openTaskView(current);assert.ok(view.context.execution);assert.match(JSON.stringify(view.context.execution.scope),/地区 等于 东/);assert.equal(view.context.semantics.definitions[0].value,'东/西');for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({mode,tasks:[],current:view,drawer:true,detail:'context',stage:'analysis'});assert.match(html,/当前执行范围/);assert.match(html,/形成方案时的说明/);assert.match(html,new RegExp(state==='saved'?'本轮成果已保存':'需要你补充说明'));assert.match(html,/原始资料与方案含义/);}}
 assert.equal(JSON.stringify(original),before);
});
