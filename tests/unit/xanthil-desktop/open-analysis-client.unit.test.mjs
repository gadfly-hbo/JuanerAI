import {readJson} from '../../../apps/browser/read-json.mjs';
import {createWorkspaceClient} from '../../../apps/browser/client.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import {createQuickAnalysisClient,openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
test('MFUI-05/07: lost task asset choice reads the exact version receipt and never reissues selection or execution',async()=>{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id=crypto.randomUUID();let body,writes=0;const client=createQuickAnalysisClient({storage,control:'owned',request:async(_path,opt)=>{writes++;body=JSON.parse(opt.body);throw Error('lost reply');}});await assert.rejects(()=>client.selectMetricAsset(id,'1',{id:'net-sales-instance',version:'1.1.1'}));assert.equal(writes,1);let exact=false;const reopened=createQuickAnalysisClient({storage,request:async(_path,opt)=>{assert.equal(opt.method,undefined);return new Response(JSON.stringify({identity:{task_id:id,revision:'2'},revision_command_id:body.command_id,metric_asset_choice:{id:body.id,version:exact?'1.1.1':'1.1.0'},state:'ready'}));}});await assert.rejects(()=>reopened.recover());exact=true;const task=await reopened.recover();assert.equal(task.state,'ready');assert.equal(reopened.pending(),null);assert.equal(writes,1);});
test('MFUI-01/02/07: lost project decision recovers exact project command without resend; receipt download retry never executes',async()=>{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},project=crypto.randomUUID();let body,writes=0;const client=createQuickAnalysisClient({storage,control:'owned',request:async(_path,opt)=>{writes++;body=JSON.parse(opt.body);throw Error('lost reply');}});await assert.rejects(()=>client.assetCommand(project,{action:'approve',id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:true}));let same=false;const recovered=createQuickAnalysisClient({storage,request:async path=>new Response(JSON.stringify(path.endsWith('/metric-assets')?{project_id:same?project:crypto.randomUUID(),candidates:[]}: {command_id:body.command_id,result:{}}))});await assert.rejects(()=>recovered.recover());same=true;await recovered.recover();assert.equal(recovered.pending(),null);assert.equal(writes,1);let copies=0;const copy=createQuickAnalysisClient({request:async(path,opt)=>{assert.equal(opt.method,undefined);assert.ok(path.includes('/adoption-receipts/2/'));copies++;return copies===1?new Response('{}',{status:500}):new Response('{"task_id":"immutable"}',{headers:{'content-type':'application/json'}});}});const task=crypto.randomUUID(),outcome=crypto.randomUUID();await assert.rejects(()=>copy.copyAdoption(task,'2',outcome));assert.equal((await copy.copyAdoption(task,'2',outcome)).name,'JuanerAI-adoption-v2.receipt.json');assert.equal(copies,2);assert.equal(copy.pending(),null);});
test('RSUI-02/09: existing drawer shows current saved requirement meaning and methods before execution',()=>{
 const business={purpose:'解释经营变化',object:'本项目订单',scope:'两期',deliverables:['比较净额'],unknowns:['退款字段待核对']},task={identity:{task_id:crypto.randomUUID(),revision:'1',scope_sha256:'scope'},question:'旧初始问题',state:'ready',source:{sources:[]},requirement_draft:{revision:1,sequence:1,receipts:[{sequence:1}],content:{business,methods:['按订单关联核对'],evidence:['订单与退款资料'],previews:[]},history:[]}};
 const view=openTaskView(task);
 const context=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:view,drawer:true,detail:'context'});assert.match(context,/本项目订单/);assert.match(context,/已保存，还没开始分析/);assert.match(context,/退款字段待核对/);
 const plan=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:view,drawer:true,detail:'plan'});assert.match(plan,/按订单关联核对/);assert.match(plan,/订单与退款资料/);assert.match(plan,/还没开始分析/);
});
test('RSUI-06: framework expansion shows method/evidence changes and their review and execution impact',()=>{
 const business={purpose:'经营分析',object:'销售',scope:'本期',deliverables:['合计'],unknowns:[]};
 const task={identity:{task_id:crypto.randomUUID(),revision:'1',scope_sha256:'scope'},question:'经营分析',state:'ready',source:{sources:[]},requirement_draft:{revision:2,sequence:2,receipts:[{sequence:1},{sequence:2}],content:{business,methods:['平均'],evidence:['数量与订单'],previews:[]},history:[{revision:1,content:{business,methods:['合计'],evidence:['仅数量'],previews:[]}}]}};
 const view=openTaskView(task),html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:view,expanded:'requirement'});
 assert.match(html,/方案变化/);assert.match(html,/原：合计/);assert.match(html,/现：平均/);assert.match(html,/原：仅数量/);assert.match(html,/重新计算和核验/);assert.match(html,/方案已调整，请再看一下/);
});
test('RSUI-03/05: selected requirement materials expose an explicit save-only action',()=>{
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],pendingRequirementMaterials:2,readonly:false});assert.match(html,/data-action="requirement-material-save"/);assert.match(html,/保存资料/);
 const normal=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],pendingRequirementMaterials:0});assert.doesNotMatch(normal,/data-action="requirement-material-save"/);
});
test('RSUI-03/05: material save lost reply recovers exact acknowledgement with GET only',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id=crypto.randomUUID();let command,writes=0;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-materials');command=JSON.parse(options.body);writes++;throw Error('lost reply');}});
 assert.equal(typeof client.addRequirementMaterials,'function');await assert.rejects(()=>client.addRequirementMaterials(id,'1',[{source_id:crypto.randomUUID(),display_name:'private.csv',format:'csv',base64:'YQo='}]));assert.equal(writes,1);assert.ok(!JSON.stringify([...values.values()]).includes('private.csv'));
 let accepted=false;const reopened=createQuickAnalysisClient({storage,request:async(path,options)=>{assert.equal(options.method,undefined);return new Response(JSON.stringify({identity:{task_id:id},requirement_materials:accepted?[{command_id:command.command_id,analysis_revision:'2'}]:[]}));}});
 await assert.rejects(()=>reopened.recover());accepted=true;await reopened.recover();assert.equal(reopened.pending(),null);assert.equal(writes,1);
});
test('RSUI-05/07: review and start recover exact durable receipts without reposting',async()=>{
 for(const kind of ['review','start']){const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id=crypto.randomUUID();let command,writes=0;
  const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-'+kind);command=JSON.parse(options.body);writes++;throw Error('lost reply');}});const method=kind==='review'?'reviewRequirement':'startRequirement';assert.equal(typeof client[method],'function');await assert.rejects(()=>client[method](id,2));assert.equal(writes,1);
  let accepted=false;const reopened=createQuickAnalysisClient({storage,request:async(path,options)=>{assert.equal(options.method,undefined);assert.equal(path,'/v1/open-analysis/'+id);return new Response(JSON.stringify({identity:{task_id:id},requirement_reviews:kind==='review'&&accepted?[{command_id:command.command_id,revision:2,confirmed:true}]:[],requirement_execution:kind==='start'&&accepted?{command_id:command.command_id,revision:2}:undefined}));}});
  await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());accepted=true;await reopened.recover();assert.equal(reopened.pending(),null);assert.equal(writes,1);
 }
});
test('RSUI-01: new analysis exposes optional requirements entry; confirmed creation uses requirements mode without a run request',async()=>{
 const html=renderQuickAnalysisWorkbench({project:'本机项目',tasks:[],current:null,detail:'context',drawer:false,entryMode:'requirements'});assert.match(html,/先帮我理清需求/);assert.match(html,/data-entry-mode="requirements"[^>]*aria-pressed="true"/);
 let body;const client=createQuickAnalysisClient({control:'owned',request:async(path,options)=>{assert.equal(path,'/v1/open-analysis');body=JSON.parse(options.body);return new Response(JSON.stringify({identity:{task_id:body.command_id},entry_mode:'requirements',state:'ready',framework:null,outcome:null}));}});
 const task=await client.submit('先理清经营问题',[],{skill:'general',prompt:'professional'},null,'requirements');assert.equal(body.mode,'requirements');assert.equal(task.state,'ready');assert.equal(task.outcome,null);
});
test('RSUI-01/05: requirement dialogue retains identity only and lost reply recovery reads the same saved conversation',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';let writes=0,command;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-discussion');writes++;command=JSON.parse(options.body);throw Error('lost reply');}});
 assert.equal(typeof client.discussRequirement,'function');await assert.rejects(()=>client.discussRequirement(id,1,'private user clarification'));assert.equal(writes,1);assert.ok(!JSON.stringify([...values.values()]).includes('private user clarification'));
 let acknowledged=false;const reads=[],reopened=createQuickAnalysisClient({storage,request:async(path)=>{reads.push(path);return new Response(JSON.stringify({identity:{task_id:id},requirement_draft:{sequence:2,receipts:[{command_id:command.command_id,sequence:2}],conversation:acknowledged?[{command_id:command.command_id,sequence:2,user:{classification:'USER_SAID',text:'private user clarification'},assistant:{classification:'MODEL_PROPOSAL',text:'关键问题'}}]:[]}}));}});
 await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());acknowledged=true;await reopened.recover();assert.equal(reopened.pending(),null);assert.deepEqual(reads,['/v1/open-analysis/'+id,'/v1/open-analysis/'+id]);assert.equal(writes,1);
});
test('V12-03: lost draft save receipt survives refresh and recovery only reads exact sequence',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';let writes=0,command;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-draft');writes++;command=JSON.parse(options.body);throw Error('lost draft reply');}});
 assert.equal(typeof client.saveRequirementDraft,'function');
 await assert.rejects(()=>client.saveRequirementDraft(id,2,{business:{purpose:'private retained editor contents'}},'暂不分析'));assert.equal(writes,1);assert.equal(client.canWrite(),false);assert.ok(!JSON.stringify([...values.values()]).includes('private retained editor contents'));
 let acknowledged=false;const reads=[],reopened=createQuickAnalysisClient({storage,request:async path=>{reads.push(path);return new Response(JSON.stringify({identity:{task_id:id},requirement_draft:{sequence:3,receipts:acknowledged?[{command_id:command.command_id,sequence:3}]:[]}}));}});
 await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());acknowledged=true;await reopened.recover();assert.deepEqual(reads,['/v1/open-analysis/'+id,'/v1/open-analysis/'+id]);assert.equal(reopened.pending(),null);assert.equal(writes,1);
});
test('V12-03: rejected draft save permits retry, but unacknowledged success stays pending',async()=>{
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';let rejected=true;
 const client=createQuickAnalysisClient({control:'owned',request:async()=>new Response('{}',{status:rejected?409:200})});assert.equal(typeof client.saveRequirementDraft,'function');
 await assert.rejects(()=>client.saveRequirementDraft(id,0,{},'edit'));assert.equal(client.pending(),null);assert.equal(client.canWrite(),true);
 rejected=false;await assert.rejects(()=>client.saveRequirementDraft(id,0,{},'edit'));assert.ok(client.pending());assert.equal(client.canWrite(),false);
});
test('Q11-11/RT04: lost submission reply stays pending across refresh; recovery only reads exact task and never resends',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let writes=0,id;
 const first=createQuickAnalysisClient({control:'test-control',storage,request:async(_path,options)=>{writes++;id=JSON.parse(options.body).command_id;throw Error('synthetic lost reply');}});
 await assert.rejects(()=>first.submit('统计数量',[{source_id:'selected'}]));assert.equal(first.canWrite(),false);await assert.rejects(()=>first.submit('重复',[{source_id:'selected'}]));assert.equal(writes,1);
 const reads=[];const reopened=createQuickAnalysisClient({storage,request:async path=>{reads.push(path);return new Response(JSON.stringify(path.endsWith('/submission')?{version:'1.0',command_id:id,state:'accepted'}:{identity:{task_id:id},state:'running'}));}});const value=await reopened.recover();assert.equal(value.identity.task_id,id);assert.deepEqual(reads,['/v1/open-analysis/'+id+'/submission','/v1/open-analysis/'+id]);assert.equal(reopened.pending(),null);assert.equal(reopened.canWrite(),false);
});
test('Q11-11/C02: lost control cannot keep a writable UI or continue issuing commands',async()=>{
 const client=createQuickAnalysisClient({control:'stale',request:async()=>new Response('{}',{status:403})});await assert.rejects(()=>client.submit('数量',[]));assert.equal(client.canWrite(),false);
});

test('Q11-01/C03: professional mode uses approved six stages and exact same backend task, never legacy page or synthetic report',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const view={id:'task-live',title:'实际问题',status:'已保存',messages:[],materials:[],events:[],report:{state:'saved',text:'实际核验结果'},framework:null};const html=renderQuickAnalysisWorkbench({mode:'pro',stage:'report',tasks:[{id:view.id,title:view.title}],current:view,readonly:true});for(const text of ['新建分析','数据准备','本地处理','循证分析','报告','执行反馈'])assert.ok(html.includes(text),text+' stage must be real');assert.equal((html.match(/data-stage=/g)??[]).length,6);assert.ok(html.includes('task-live'));assert.ok(html.includes('实际核验结果'));assert.ok(!html.includes('<iframe'));
});


test('OA-08/Q11-10: lost acknowledgment is recovered by exact receipt read, with no repeated write',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let writes=0,command;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(_path,options)=>{writes++;command=JSON.parse(options.body);throw Error('lost receipt');}});
 assert.equal(typeof client.acknowledge,'function');await assert.rejects(()=>client.acknowledge('a'.repeat(8)+'-aaaa-aaaa-aaaa-'+'a'.repeat(12),{expected_revision:'1',outcome_id:'outcome',outcome_sha256:'b'.repeat(64)},'认可'));assert.equal(writes,1);assert.equal(client.canWrite(),false);
 const paths=[];const reopened=createQuickAnalysisClient({storage,request:async path=>{paths.push(path);return new Response(JSON.stringify(path.includes('/judgments/')?{saved:true,command_id:command.command_id}: {identity:{task_id:client.pending().task_id},state:'saved'}));}});await reopened.recover();assert.equal(paths.length,2);assert.ok(paths[0].endsWith('/judgments/'+command.command_id));assert.equal(reopened.pending(),null);assert.equal(writes,1);
});

test('Q11-09/11: child command transport requires control and lost reply recovery only reads collaboration state',async()=>{
 const storageMap=new Map(),storage={getItem:k=>storageMap.get(k),setItem:(k,v)=>storageMap.set(k,v),removeItem:k=>storageMap.delete(k)};const id=crypto.randomUUID();let writes=0;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async()=>{writes++;throw Error('lost');}});assert.equal(typeof client.collaborate,'function');await assert.rejects(()=>client.collaborate(id,'create',{version:'1.0',command_id:crypto.randomUUID(),kind:'subagent',task:'限制',confirmed:true}));assert.equal(writes,1);assert.equal(client.canWrite(),false);
 const pendingCommand=client.pending().command_id;const paths=[],restored=createQuickAnalysisClient({storage,request:async path=>{paths.push(path);return new Response(JSON.stringify(path.includes('/collaboration-receipts/')?{version:'1.0',task_id:id,command_id:client.pending().command_id,action:'create',status:'accepted'}:{identity:{task_id:id},state:'saved'}));}});await restored.recover();assert.deepEqual(paths,['/v1/open-analysis/'+id+'/collaboration-receipts/'+pendingCommand,'/v1/open-analysis/'+id]);assert.equal(writes,1);
});

test('Q11-09: follow-up carries selected material IDs, never accepts frontend material values as authority',async()=>{
 let body;const client=createQuickAnalysisClient({control:'owned',request:async(_path,options)=>{body=JSON.parse(options.body);return new Response(JSON.stringify({identity:{revision:'2'}}));}});await client.revise(crypto.randomUUID(),'1','结合采纳意见解释',null,undefined,['material-id']);assert.deepEqual(body.material_ids,['material-id']);assert.equal(Object.hasOwn(body,'context_materials'),false);
});

test('Q11-05/09: persisted adopted material is displayed as business text even when canonical store key order differs',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs');const material={version:'1.0',material_id:'material',result_sha256:'sha',classification:'MODEL',review:'user_adopted',value:{summary:'合计不能证明原因'}};const sorted=Object.fromEntries(Object.entries(material).reverse());const task={identity:{task_id:'task',revision:'2'},question:'解释',state:'saved',context_materials:[sorted],source:{sources:[]},checkpoint:{messages:[{speaker:'user',text:'JUANERAI_CONTEXT_MATERIALS_V1\n'+JSON.stringify([material])}]}};const view=openTaskView(task);assert.ok(view.messages[0].text.includes('合计不能证明原因'));assert.ok(!view.messages[0].text.includes('JUANERAI_CONTEXT_MATERIALS'));assert.ok(!view.messages[0].text.includes('material_id'));
});

test('Q11-03/05/10: membership view presents source-bound methods and verified metrics without exposing raw result JSON',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const facts={periods:{comparison:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'2000'},current:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'3000'}},changes:{},m2:{status:'not_selected'}};
 const plan={version:'1.4',goal:'比较会员复购',operation:'membership_compare',column:'D',unit:'CNY',membership:{methods:['M1'],bindings:[],semantics:{comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},valid_statuses:['paid'],time_zone:'Asia/Shanghai',currency:'CNY'}}};
 const task={identity:{task_id:'task-member',revision:'1'},state:'saved',question:'会员变化',source:{sources:[]},framework:{plan},outcome:{calculation:{value:JSON.stringify(facts),unit:'CNY'},verification:{grade:'independent_arithmetic'},explanation:{text:'收入变化是事实，原因仍需证据。'}}};const view=openTaskView(task);assert.equal(view.framework.method,'M1 总体复购变化');assert.equal(view.report.membership.periods.current.repeat_revenue_fen,'3000');assert.ok(!view.report.text.includes('"periods":'));
 for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({mode,stage:'report',expanded:mode==='quick'?'report':null,current:view,tasks:[],readonly:true});for(const word of ['活跃会员','复购会员','复购率','复购收入','20.00','30.00'])assert.ok(html.includes(word),word);assert.ok(!html.includes('membership_compare'));assert.ok(!html.includes('&quot;periods&quot;'));assert.ok(html.includes('收入变化是事实，原因仍需证据。'));}
});

test('OA-01/Q11-03: business drawer consumes saved Context and distinguishes user words, source observations and proposed method',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const task={identity:{task_id:'context-task',revision:'2'},question:'比较金额',state:'ready',source:{sources:[]},framework:{plan:{goal:'比较金额',operation:'sum',column:'B',unit:'CNY'},context:{question:{classification:'USER_SAID',text:'比较金额'},source_facts:[{classification:'SOURCE_FACT',display_name:'订单.csv',headers:[{value:'金额'}],data_rows:25}],proposal:{classification:'MODEL_PROPOSAL',plan:{goal:'合计金额'}},unknowns:['币种仍需确认']}}};
 const view=openTaskView(task);assert.equal(view.context.userText,'比较金额');assert.deepEqual(view.context.sources,[{name:'订单.csv',headers:['金额'],rows:25}]);assert.equal(view.context.proposedGoal,'合计金额');const html=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current:view,drawer:true,detail:'context'});for(const t of ['你的问题','资料事实','订单.csv','25','模型提议','合计金额','币种仍需确认'])assert.ok(html.includes(t),t);assert.ok(!html.includes('source_facts'));
});

 test('OA-S06/RT04: child lost reply cannot clear pending merely because the family exists; unknown receipt stays fenced',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},id=crypto.randomUUID();let body;const client=createQuickAnalysisClient({control:'owned',storage,request:async(_p,o)=>{body=JSON.parse(o.body);throw Error('lost');}});await assert.rejects(()=>client.collaborate(id,'send',{version:'1.0',child_id:crypto.randomUUID(),text:'澄清'}));assert.ok(body.command_id,'every child effect needs one exact receipt identity');const reopened=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({version:'1.0',task_id:id,command_id:body.command_id,action:'send',status:'unknown'}))});await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());assert.equal(reopened.canWrite(),false);
 });

test('OA-S04/Q11-12: safe parser next step reaches ordinary dialogue rather than a generic network/model error',async()=>{
 const client=createQuickAnalysisClient({control:'owned',request:async()=>new Response(JSON.stringify({error:'REQUEST_REJECTED',reason:'这是扫描PDF，请提供文字版或核对识别结果。'}),{status:400})});await assert.rejects(()=>client.submit('检查资料',[]),/扫描PDF/);assert.equal(client.pending(),null);
});

test('Q11-02/05: saved purpose/object/scope/deliverables and hypotheses appear in both existing context drawer and professional analysis without masquerading as facts',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const task={identity:{task_id:'business',revision:'1'},question:'分析差异',state:'ready',source:{sources:[]},framework:{plan:{goal:'核实差异',operation:'sum',column:'B',unit:'件'},context:{question:{text:'分析差异'},source_facts:[],proposal:{plan:{goal:'核实差异'}},unknowns:[],business:{classification:'MODEL_PROPOSAL',purpose:'弄清本轮差异',object:'当前记录',scope:'本期资料',deliverables:['差异报告'],hypotheses:[{classification:'MODEL_HYPOTHESIS',text:'记录范围可能不同'}],unknowns:[]}}}};const view=openTaskView(task);assert.equal(view.context.business.purpose,'弄清本轮差异');for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({project:'合成',tasks:[],current:view,drawer:true,detail:'context',mode,stage:'analysis'});for(const text of ['分析目的','分析对象','范围','交付','待验证假设','记录范围可能不同','模型提议'])assert.ok(html.includes(text),text);assert.ok(!html.includes('MODEL_HYPOTHESIS'));}
});

test('Q11-07: normal quick/pro plan and files expose actual saved first-ten-row Diff and qualified full derivation count, not fabricated preview rows',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const task={identity:{task_id:'mapped',revision:'1'},question:'映射汇总',state:'saved',source:{sources:[]},framework:{plan:{version:'1.5',goal:'明确映射',operation:'sum',column:'A',unit:'件',preview:[{row:2,changes:[{column:'A',before:'四',after:'4'}]}]}},outcome:{calculation:{value:'11',unit:'件',derivation:{rows:20}},explanation:{text:'11件'},verification:{grade:'independent_arithmetic'},outcome_id:'mapped-outcome'}};const view=openTaskView(task);assert.equal(view.framework.transformation.rows,20);const html=renderQuickAnalysisWorkbench({project:'合成',tasks:[],current:view,drawer:true,detail:'files'});for(const text of ['资料变换','前10行对照','原值','派生值','四','20','原资料保留'])assert.ok(html.includes(text),text);assert.ok(!html.includes('derived_inspection_sha256'));
});


test('Q11-05/07: normal browser explicitly requests preview representation and uses full row count',async()=>{
 let options;const client=createQuickAnalysisClient({request:async(path,value)=>{options=value;return {ok:true,json:async()=>({})};}});await client.read('task');assert.equal(options.headers['x-xanthil-view'],'browser-v1');
 const task={identity:{task_id:'task',revision:'1'},question:'数量',state:'ready',framework:null,outcome:null,source:{sources:[{display_name:'合成.csv',sheets:[{name:'CSV',full_data_rows:30,rows:[{cells:[{column:'A',value:'数量'}]},{cells:[{column:'A',value:'1'}]}]}]}]}};const view=openTaskView(task);assert.match(view.materials[0].summary,/30行/);assert.equal(view.materials[0].previews[0].total,30);assert.equal(view.materials[0].previews[0].rows.length,1);
});

test('Q11-10 actual document report separates attributed quotations and model interpretation without raw JSON or arithmetic seal',()=>{
 const task={identity:{task_id:'doc-task',revision:'1'},question:'总结访谈',state:'saved',source:{sources:[{source_id:'doc',display_name:'访谈.md',sheets:[]}]},framework:{plan:{version:'1.6',goal:'总结观点',operation:'source_quotes',references:[{source_id:'doc'}]}},outcome:{calculation:{value:JSON.stringify([{source_name:'访谈.md',position:'段落1',text:'客户认为等待过长。'}]),unit:'source quotation'},verification:{grade:'source_attribution'},explanation:{text:'小样本意见，不代表总体。来源等级source_attribution。'}}};
 const view=openTaskView(task);assert.equal(view.framework.method,'资料原文引用与来源核对');assert.equal(view.framework.binding,'访谈.md');assert.match(view.report.text,/段落1/);assert.match(view.report.text,/观点尚未验证/);assert.match(view.report.text,/小样本意见/);assert.doesNotMatch(view.report.text,/本地计算|独立算术核验|source_attribution|source_name/);
});

 test('OA-RT04/06: lost first submission reads exact receipt; explicit stop remains available while ordinary writes are fenced',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let writes=0,id;const c=createQuickAnalysisClient({control:'owned',storage,request:async(path,o)=>{writes++;if(path.endsWith('/stop-initial'))return new Response(JSON.stringify({command_id:id,state:'unknown'}));id=JSON.parse(o.body).command_id;throw Error('lost initial reply');}});await assert.rejects(()=>c.submit('检查資料',[]));assert.equal(c.pending().kind,'initial');assert.equal(c.canWrite(),false);assert.equal(c.canStop(),true);await c.stopInitial();assert.equal(writes,2);assert.ok(c.pending());let reads=0;const restored=createQuickAnalysisClient({storage,request:async()=>{reads++;return new Response(JSON.stringify({version:'1.0',command_id:id,state:'unknown'}));}});await assert.rejects(()=>restored.recover());assert.ok(restored.pending());assert.equal(restored.canStop(),false);const terminal=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({version:'1.0',command_id:id,state:'stopped'}))});assert.equal(await terminal.recover(),null);assert.equal(terminal.pending(),null);assert.equal(writes,2);assert.equal(reads,1);
 });


test('OA-S04/Q11-02: both confirmed modes show saved unfinished business proposal and unknowns without inventing a framework',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const business={classification:'MODEL_PROPOSAL',purpose:'核实销量变化',object:'所选订单',scope:'期间尚待确认',deliverables:['对比报告'],hypotheses:[{classification:'MODEL_HYPOTHESIS',text:'促销可能影响销量'}],unknowns:['比较期间未说明']};
 const view=openTaskView({identity:{task_id:'waiting-task',revision:'1'},question:'分析销量',state:'waiting',source:{sources:[]},framework:null,outcome:null,clarification:{text:'请说明两个期间。',business}});
 assert.deepEqual(view.context.business,business);assert.equal(view.framework,null);assert.equal(view.report,null);
 for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({mode,stage:'analysis',project:'本机',tasks:[],current:view,drawer:true,detail:'context'});for(const t of ['核实销量变化','所选订单','促销可能影响销量','比较期间未说明','请说明两个期间。'])assert.ok(html.includes(t),mode+': '+t);}
});

test('OA-08: lost report edit reply recovers exact receipt read-only and never resubmits',async()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},id=crypto.randomUUID();let command,writes=0;const client=createQuickAnalysisClient({control:'owned',storage,request:async(_p,o)=>{writes++;command=JSON.parse(o.body);throw Error('lost');}});await assert.rejects(()=>client.editReport(id,{expected_revision:'1',outcome_id:crypto.randomUUID(),outcome_sha256:'a'.repeat(64),expected_expression_version:0},'表述'));assert.equal(client.canWrite(),false);const paths=[];const reopened=createQuickAnalysisClient({storage,request:async p=>{paths.push(p);return new Response(JSON.stringify(p.includes('/report-edits/')?{saved:true,origin:'USER',task_id:id,command_id:command.command_id}:{identity:{task_id:id}}));}});await reopened.recover();assert.equal(writes,1);assert.equal(paths.length,2);assert.ok(paths[0].endsWith(command.command_id));assert.equal(reopened.pending(),null);});

test('OA-08/C03: ordinary report copy remains available when native formal review is not provided; genuine read errors never become fallback',async()=>{
 const paths=[];const client=createQuickAnalysisClient({request:async path=>{paths.push(path);return path.endsWith('/formal-review')?new Response('{}',{status:404}):new Response('保存的普通分析',{headers:{'content-type':'text/markdown'}});}});
 const copy=await client.copy('ordinary-task','2','ordinary-outcome');assert.equal(await copy.blob.text(),'保存的普通分析');assert.equal(copy.name,'JuanerAI-analysis-v2.md');assert.equal(paths.length,2);
 let calls=0;const failing=createQuickAnalysisClient({request:async()=>{calls++;return new Response('{}',{status:500});}});await assert.rejects(()=>failing.copy('ordinary-task','2','ordinary-outcome'));assert.equal(calls,1,'failed native read must not silently substitute another report');
});
test('OA-S01 B1: conversation reply is readable and saved without fake calculation, JSON or framework',()=>{const reply={version:'1.0',outcome_id:'reply',kind:'MODEL_CONVERSATION',text:'先明确分析对象。',verification:'not_performed',human_judgment:'not_recorded'};const t={version:'1.3',identity:{task_id:'task',revision:'1'},question:'怎么分析',state:'saved',source:{version:'1.0',sources:[]},framework:null,outcome:null,conversation_outcome:reply,checkpoint:{messages:[{speaker:'user',text:'怎么分析'},{speaker:'assistant',text:JSON.stringify({kind:'answer',text:reply.text}),calls:[]}]}};const view=openTaskView(t);assert.equal(view.framework,null);assert.equal(view.messages[1].text,reply.text);assert.ok(view.report);assert.match(view.report.text,/未.*核验/);assert.doesNotMatch(view.report.text,/独立算术核验|本地计算：/);});
test('OA-S05 B1/B2: settled empty-source reply may explicitly reconcile; missing reply or tool material stays UNKNOWN',()=>{const t={identity:{task_id:'text',revision:'1'},question:'q',source:{version:'1.0',sources:[]},state:'unknown',pending_stop_epoch:null,framework:null,outcome:null,checkpoint:{version:'1.0',turn:1,calculation:null,verification:null,messages:[{speaker:'user',text:'q'},{speaker:'assistant',text:JSON.stringify({kind:'answer',text:'一般建议，未核验数据。'}),calls:[]}]}};assert.equal(openTaskView(t,[]).resumable,true);assert.equal(openTaskView({...t,checkpoint:{...t.checkpoint,messages:[{speaker:'user',text:'q'}]}},[]).resumable,false);assert.equal(openTaskView(t,[{status:'unknown'}]).resumable,false);assert.equal(openTaskView({...t,checkpoint:{...t.checkpoint,messages:[...t.checkpoint.messages,{speaker:'assistant',text:'',calls:[{id:'x',name:'unresolved'}]}]}},[]).resumable,false);});

function scopeTask(revision='1',filter=null){
 const source={sources:[{source_id:'sales',sha256:'a'.repeat(64),display_name:'销售.xlsx',sheets:[{sheet_id:'current',name:'本期',state:'visible',rows:[{row:1,cells:[{column:'A',value:'地区'},{column:'B',value:'品类'},{column:'C',value:'金额'}]}]}]}]};
 const plan={version:'1.2',goal:'按地区汇总金额',source_id:'sales',sheet_id:'current',operation:'sum',column:'C',unit:'元',numeric_mode:'decimal',group_by:'A',filters:filter?[{column:'B',operator:'eq',value:filter}]:[]};
 return {identity:{task_id:'scope-task',revision},question:'按地区汇总金额',state:'ready',source,framework:{plan},history:[]};
}
test('Q11-03/05: actual plan drawer shows exact file/sheet/metric/group/conjunctive filters; no inference from question',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const task=scopeTask('1','Coffee');task.question='看看全部，不要按这个文本推断实际过滤';task.framework.plan.filters.push({column:'C',operator:'ge',value:'10'});
 const before=structuredClone(task),view=openTaskView(task),html=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current:view,drawer:true,detail:'plan'});
 for(const text of ['销售.xlsx','本期','金额','地区','品类 等于 Coffee','金额 大于或等于 10','同时满足'])assert.ok(html.includes(text),text+' must come from consumed IR');assert.doesNotMatch(html,/source_id|sheet_id|group_by|&quot;filters&quot;/);assert.deepEqual(task,before);
});

test('Q11-03/12: consecutive scope revisions show before/after and obsolete result impact in existing execution/history surface',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const old=scopeTask('1'),current=scopeTask('2','Coffee');old.state='saved';old.outcome={explanation:{text:'旧范围解释'},calculation:{value:'100',unit:'元',groups:[{key:'东区',value:'100',rows:3}]},verification:{grade:'independent_arithmetic'}};current.history=[old];const before=structuredClone(current),view=openTaskView(current);
 const html=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current:view,drawer:true,detail:'execution'});
 for(const text of ['版本 1 → 2','无筛选条件','品类 等于 Coffee','旧版分组图表','之前的数字仅供对照','需要重新计算和核验'])assert.ok(html.includes(text),text);assert.deepEqual(current,before);assert.equal(view.report,null);
 current.outcome={...old.outcome,explanation:{text:'本次Coffee解释'}};assert.match(renderQuickAnalysisWorkbench({tasks:[],current:openTaskView(current),drawer:true,detail:'execution'}),/这版结果已保存/);
});

test('Q11-05: union inputs retain their own sheet/field/filter and explicit exclusions; no misleading synthetic union sheet',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const t=scopeTask();t.source.sources[0].sheets.push({...structuredClone(t.source.sources[0].sheets[0]),sheet_id:'previous',name:'比较期'},{sheet_id:'unused',name:'备注',rows:[]});const first=t.framework.plan;t.framework.plan={...first,version:'1.3',combination:'union_all',inputs:[first,{...first,sheet_id:'previous',group_by:null,filters:[{column:'B',operator:'ne',value:'Tea'}]}]};const html=renderQuickAnalysisWorkbench({tasks:[],current:openTaskView(t),drawer:true,detail:'plan'});for(const text of ['本期','比较期','逐行追加，不去重','不分组','品类 不等于 Tea','已选但未纳入本方案','备注'])assert.ok(html.includes(text),text);assert.doesNotMatch(html,/Explicit union_all/);
});
test('Q11-03/12: pending framework exposes only known revision changes; expression edits do not manufacture a new scope revision',async()=>{
 const {renderQuickAnalysisWorkbench,renderRevisionImpact}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const old=scopeTask(),t=scopeTask('2');t.question='仅看 Coffee';t.framework=null;t.history=[old];let html=renderQuickAnalysisWorkbench({tasks:[],current:openTaskView(t),drawer:true,detail:'plan'});assert.match(html,/本版方案尚未形成/);assert.match(html,/原：按地区汇总金额/);assert.doesNotMatch(html,/品类 等于 Coffee/);assert.match(html,/修改范围不等于已重新计算/);
 const onlyEdit=scopeTask();onlyEdit.report_edits=[{expression_version:1,text:'<script>说明</script>'}];assert.deepEqual(openTaskView(onlyEdit).versions,[]);assert.equal(onlyEdit.identity.revision,'1');const xss=renderRevisionImpact({revision:'1',nextRevision:'2',changes:[{label:'<img>',before:'<script>',after:'<svg>'}],impacts:['<iframe>'],status:'<script>'});assert.doesNotMatch(xss,/<img|<script|<svg|<iframe/);assert.match(xss,/&lt;script&gt;/);
});
test('Q11-12: three revisions compare adjacent versions, saved successor/UNKNOWN and changed same-name source stay honest',()=>{
 const a=scopeTask('1'),b=scopeTask('2','Coffee'),c=scopeTask('3','Tea');c.history=[a,b];c.state='unknown';c.source.sources[0].sha256='b'.repeat(64);const v=openTaskView(c);assert.equal(v.versions[0].nextRevision,'2');assert.equal(v.versions[1].nextRevision,'3');assert.ok(v.versions[0].changes.some(x=>x.after==='品类 等于 Coffee'));assert.ok(v.versions[1].changes.some(x=>x.before==='品类 等于 Coffee'&&x.after==='品类 等于 Tea'));assert.ok(v.versions[1].changes.some(x=>x.label==='资料版本'));assert.match(v.versions[1].status,/请求还没确认/);
});

test('Q11-03/12: unchanged consumed scope does not falsely claim that a follow-up already changed filters or necessarily repeats arithmetic',()=>{
 const old=scopeTask();old.outcome={explanation:{text:'原解释'},calculation:{value:'10',unit:'元'},verification:{grade:'independent_arithmetic'}};const next=scopeTask('2');next.question='解释这个发现';next.history=[old];const v=openTaskView(next).versions[0];assert.match(v.impacts.join('\n'),/分析范围与上一版相同/);assert.doesNotMatch(v.impacts.join('\n'),/需重新计算和核验/);
});

for(const action of ['read','task','search'])test('Q11-02/11: late saved read cannot replace newer running conversation or stop passive reply collection ('+action+')',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const elements=[];const element=()=>{const e={value:'',children:[],append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};const listeners={},app={innerHTML:'',addEventListener:(name,fn)=>{listeners[name]=fn;}};let poll,dispose,release,releaseTask,hold=false,holdTask=false,writes=0;
 const task=(revision,state)=>({identity:{task_id:'synthetic-task',revision},question:'问题'+revision,state,source:{sources:[]},checkpoint:null,framework:null,outcome:null,conversation_outcome:state==='saved'?{text:'回复'+revision,kind:'MODEL_CONVERSATION'}:null,preferences:{skill:'general',prompt:'professional'}});let current=task('1','running');
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_name,fn)=>{dispose=fn;}};
  globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,options)=>{if(options?.method==='POST')writes++;let value;
   if(path==='/v1/open-analysis/methods')value={skills:[],prompts:[]};
   else if(path==='/v1/open-analysis'){if(hold){hold=false;const snapshot=task('1','saved');await new Promise(resolve=>{release=resolve;});value=[snapshot];}else value=[current];}
   else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else if(path.endsWith('/synthetic-task')&&holdTask){holdTask=false;const snapshot=current;await new Promise(resolve=>{releaseTask=resolve;});value=snapshot;}else value=current;
   return new Response(JSON.stringify(value));
  };
  await startQuickWorkspace({control:'owned'});click({task:'synthetic-task'});await settle();
  hold=true;poll();await settle();assert.equal(typeof release,'function');current=task('2','running');click(action==='task'?{task:'synthetic-task'}:{action:'read'});await settle();assert.match(app.innerHTML,/问题2/);
  release();await settle();assert.match(app.innerHTML,/问题2/);assert.doesNotMatch(app.innerHTML,/回复1/,'late previous saved state must not halt the newer running poll');
  current=task('2','saved');poll();await settle();assert.match(app.innerHTML,/回复2/,'saved reply appears without Stop or another submission');assert.equal(writes,0,'collection remains read-only');
  holdTask=true;current=task('3','running');click({task:'synthetic-task'});await settle();current=task('4','running');if(action==='search'){click({action:'read'});await settle();click({action:'search'});await settle();const result=elements.find(e=>e.textContent==='问题4');assert.ok(result,'real search result must exist');await result.onclick();}else click({task:'synthetic-task'});await settle();releaseTask();await settle();assert.match(app.innerHTML,/问题4/);assert.doesNotMatch(app.innerHTML,/问题3/,'older direct read must not overwrite latest selection');
  holdTask=true;current=task('5','running');click({task:'synthetic-task'});await settle();click({action:'new'});await settle();releaseTask();await settle();assert.doesNotMatch(app.innerHTML,/<h1>问题5/,'late selection cannot restore a task after New Analysis');
  holdTask=true;current=task('6','running');click({task:'synthetic-task'});await settle();const beforeHide=app.innerHTML;dispose();releaseTask();await settle();assert.equal(app.innerHTML,beforeHide,'pagehide prevents late direct-read rendering');assert.equal(writes,0);

 }finally{dispose?.();Object.assign(globalThis,prior);}
});

for(const action of ['read','resume','stop','revise','initial'])for(const destination of ['task','new','pagehide',...(action==='initial'?['receipt']:[])])test('Q11-04: late '+action+' receipt preserves '+destination+' and does not replay',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const task=id=>({identity:{task_id:id,revision:'1'},question:id===a?'旧会话A':'新会话B',state:id===a&&action==='resume'?'stopped':id===a&&action==='stop'?'running':'saved',source:{sources:[]},framework:null,outcome:null,conversation_outcome:{text:id===a?'回答A':'回答B',kind:'MODEL_CONVERSATION'}});
 const listeners={},app={innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},elements=[];
 const element=()=>{const e={value:'',children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};
 let hold=false,release,dispose,writes=0;const values=new Map(action==='read'?[['juanerai.open.pending.v1',JSON.stringify({task_id:a})]]:[]);
 const settle=async()=>{for(let i=0;i<16;i++)await new Promise(setImmediate);};const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  globalThis.fetch=async(path,o)=>{if(o?.method==='POST')writes++;let result;
   if(path.endsWith('/methods'))result={skills:[],prompts:[]};else if(path.endsWith('/collaboration')||path.endsWith('/requests'))result=[];
   else if(path==='/v1/open-analysis'&&o?.method!=='POST')result=[task(a),task(b)];else if(path.endsWith('/submission'))result={version:'1.0',command_id:path.split('/').at(-2),state:'reading'};else result=task(path.includes(b)?b:a);
   if(hold&&((action==='read'&&path.endsWith(a))||o?.method==='POST')){hold=false;await new Promise(resolve=>{release=resolve;});}
   return new Response(JSON.stringify(result));
  };
  await startQuickWorkspace({control:'owned'});if(action!=='initial'){click({task:a});await settle();}
  hold=true;
  if(action==='revise'||action==='initial'){
   listeners.input({target:{id:'analysis-message',value:'追问'}});
   listeners.submit({preventDefault(){},target:{matches:s=>s==='[data-form="message"]'}});await settle();
   if(action==='initial')void elements.find(e=>e.textContent==='同意并开始分析').onclick();
  }else click({action});
  await settle();assert.equal(typeof release,'function');if(destination==='receipt'){click({action:'read'});await settle();assert.match(app.innerHTML,/资料读取或停止还没确认/);}else{click({task:b});await settle();assert.match(app.innerHTML,/<h1>新会话B/);}
  if(destination==='new'){click({action:'new'});await settle();}else if(destination==='pagehide')dispose();const before=app.innerHTML;release();await settle();if(destination==='receipt'){assert.match(app.innerHTML,/回答A/);assert.doesNotMatch(app.innerHTML,/资料读取或停止还没确认/,'successful receipt must replace the previous pending notice');}else if(destination==='task')assert.match(app.innerHTML,/<h1>新会话B/,'late A receipt must not replace newer task B');else if(destination==='pagehide')assert.equal(app.innerHTML,before,'pagehide forbids late rendering');else{assert.match(app.innerHTML,/<h1>今天，想弄清什么/);assert.doesNotMatch(app.innerHTML,/<h1>旧会话A/,'late receipt cannot restore task after New Analysis');}assert.equal(writes,action==='read'?0:1,'no replay or extra request');
 }finally{release?.();dispose?.();Object.assign(globalThis,prior);}
});

test('FM-AX1/2/3: persisted historical display chooses its exact facts while newest failure remains visible',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const old=scopeTask('1'),latest=scopeTask('2','Coffee');old.state='saved';old.outcome={outcome_id:'old',explanation:{text:'旧范围'},calculation:{value:'100',unit:'元'},verification:{grade:'independent_arithmetic'}};latest.state='failed';latest.history=[old];latest.display_revision='1';
 const before=structuredClone(latest),view=openTaskView(latest);assert.equal(view.displayRevision,'1');assert.equal(view.latestRevision,'2');assert.equal(view.report.revision,'1');assert.match(view.status,/历史成果/);assert.match(view.status,/未完成/);
 for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({mode,stage:'report',tasks:[],current:view});assert.match(html,/正在查看旧版本 1/);assert.match(html,/data-version="2"/);assert.doesNotMatch(html,/data-action="judgment"(?![^>]*disabled)/);}
 assert.deepEqual(latest,before);
});

test('FM-A04: evidence focus selects the exact finding and objection drafts preserve target version without executing',async()=>{
 const {findingObjectionDraft}=await import('../../../apps/browser/quick-analysis-client.mjs');
 assert.equal(typeof findingObjectionDraft,'function');const task=scopeTask('2');task.outcome={identity:{run_id:'run'},outcome_id:'result',framework:{goal:'分组销售'},calculation:{value:'30',unit:'元',rows:2,groups:[{key:'东区',value:'10',rows:1},{key:'西区',value:'20',rows:1}]},verification:{grade:'independent_arithmetic',plan_sha256:'plan',inspection_sha256:'inspection',result_sha256:'result-sha',method:'reverse_source'},explanation:{text:'解释'}};
 const before=structuredClone(task),view=openTaskView(task),finding=view.findings[2];
 const draft=findingObjectionDraft(task,finding.id);assert.match(draft,/版本 2/);assert.match(draft,/西区/);assert.match(draft,/20/);assert.doesNotMatch(draft,/result:group-1|对应发现|成果：|计划：/);assert.deepEqual(task,before);
 assert.throws(()=>findingObjectionDraft({...task,display_revision:'1'},finding.id),/历史/);assert.throws(()=>findingObjectionDraft(task,'obsolete'),/版本/);
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 view.focusedFinding=finding;const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:view,drawer:true,detail:'evidence'});assert.match(html,/本条发现的已核验值 · 西区/);assert.match(html,/20 元/);assert.match(html,/尚未取得/);
});
test('FM-AX1/RT04: lost preview and adoption replies recover exact receipts by read without duplicate execution',async()=>{
 for(const action of ['previewRevision','adoptRevision']){let writes=0,command,kind;const id='11111111-1111-4111-a111-111111111111',preview='22222222-2222-4222-a222-222222222222',saved={identity:{task_id:id,revision:'2'},revision_previews:[],confirmed_plan:null};const client=createQuickAnalysisClient({control:'owned',request:async(url,options={})=>{if(options.method==='POST'){writes++;const body=JSON.parse(options.body);command=body.command_id;kind=url.endsWith('/preview')?'preview':'adopt';if(kind==='preview')saved.revision_previews=[{command_id:command,baseline_identity:{revision:'1'},question:'仅看Coffee',state:'ready'}];else saved.confirmed_plan={command_id:command,preview_command_id:preview,revision:'2'};throw Error('lost response');}return new Response(JSON.stringify(saved));}});
 assert.equal(typeof client[action],'function');await assert.rejects(()=>action==='previewRevision'?client.previewRevision(id,'1','仅看Coffee'):client.adoptRevision(id,'1',preview));assert.ok(client.pending());await client.recover();assert.equal(client.pending(),null);assert.equal(writes,1);
 }
});
test('FM-AX1/A02: real proposal appears in existing plan drawer with before/after scope and explicit adoption, never as new verified facts',async()=>{
 const task=scopeTask('1'),candidate=structuredClone(task.framework);candidate.plan.filters=[{column:'B',operator:'eq',value:'Coffee'}];candidate.plan.goal='仅看Coffee';task.revision_previews=[{command_id:'proposal',baseline_identity:task.identity,question:'仅看Coffee',state:'ready',framework:candidate,text:'仅看Coffee，需要重新计算。'}];
 const view=openTaskView(task);assert.equal(view.preview.command_id,'proposal');assert.ok(view.preview.changes.some(c=>c.after.includes('Coffee')));assert.equal(view.displayRevision,'1');assert.equal(view.preview.state,'ready');const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');for(const mode of ['quick','pro']){const html=renderQuickAnalysisWorkbench({mode,stage:'analysis',tasks:[],current:view,drawer:true,detail:'plan'});assert.match(html,/查看修改影响/);assert.match(html,/Coffee/);assert.match(html,/采纳并重新计算/);assert.match(html,/新方案准备好了/);assert.doesNotMatch(html,/这版结果已保存/);}
});

test('FM-A01: actual stored no-frame clarification meaning is projected; source-header facts are not promoted to business confirmation',()=>{const semantics={version:'1.0',scope:'current_task',definitions:[{dimension:'metric',value:'净销售额',classification:'MODEL_CANDIDATE',user_quote:null,user_question:null}],conflicts:[{dimension:'metric',question:'订单额还是净销售额？',alternatives:['订单额','净销售额'],state:'unresolved',selected:null,resolution_quote:null,user_question:null}]};const task={identity:{task_id:'t',revision:'1'},question:'分析销售',state:'waiting',source:{sources:[]},framework:null,outcome:null,clarification:{text:'订单额还是净销售额？',semantics}};const view=openTaskView(task);assert.deepEqual(view.context.semantics,semantics);assert.equal(view.context.sources.length,0);assert.equal(view.context.semantics.definitions[0].classification,'MODEL_CANDIDATE');});

test('FM-A03: visible partial scope belongs to its actual earlier step, while latest failure stays failed and has no final report',()=>{const source={sources:[{source_id:'s',display_name:'数量.csv',sheets:[{sheet_id:'CSV',name:'CSV',rows:[{cells:[{column:'A',value:'数量'}]}]}]}]},identity={task_id:'t',revision:'2',run_id:'r',scope_sha256:'scope'},plan={version:'1.0',goal:'数量汇总',source_id:'s',sheet_id:'CSV',operation:'sum',column:'A',unit:'件'},step={version:'1.0',step_id:'checked-step',saved:true,identity,framework:{plan},calculation:{value:'10',unit:'件',rows:2},verification:{grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:'p',result_sha256:'result'}};const view=openTaskView({identity,question:'先汇总，再看中位数',state:'failed',source,framework:{plan:{...plan,goal:'中位数尚未完成'}},outcome:null,verified_steps:[step]});assert.match(view.status,/未完成/);assert.equal(view.report,null);assert.equal(view.partials.length,1);assert.equal(view.partials[0].goal,'数量汇总');assert.equal(view.partials[0].value,'10');assert.ok(view.partials[0].scope.some(r=>r.value==='数量.csv / CSV'));assert.equal(view.partials[0].evidence.step_id,'checked-step');assert.equal(view.partials[0].evidence.run_id,'r');});
test('UI-RV04/FUI04: grouped checked partial results show business labels and values while a failed task remains incomplete',()=>{
 const identity={task_id:'t',revision:'1',run_id:'r',scope_sha256:'scope'},groups=[{key:'北',value:'500',rows:3},{key:'南',value:'550',rows:3}],plan={version:'1.0',goal:'按地区',source_id:'s',sheet_id:'CSV',operation:'sum',column:'A',group_by:'B',unit:'元'},source={sources:[{source_id:'s',display_name:'订单.csv',sheets:[{sheet_id:'CSV',name:'CSV',rows:[{cells:[{column:'A',value:'金额'},{column:'B',value:'地区'}]}]}]}]};
 const calculation={value:JSON.stringify(groups),groups,unit:'元',rows:6},step={saved:true,step_id:'step',identity,framework:{plan},calculation,verification:{grade:'independent_arithmetic'}};
 const view=openTaskView({identity,question:'地区表现',state:'failed',source,framework:{plan},outcome:null,verified_steps:[step]});
 assert.equal(view.partials[0].value,'北：500；南：550');assert.equal(view.partials[0].unit,'元');assert.match(view.status,/未完成/);assert.equal(view.report,null);assert.equal(calculation.value,JSON.stringify(groups),'raw verified result is not rewritten');
});

test('FM-A03/FM-X: historical partial facts can be selected while the latest version stays UNKNOWN; no old whole-task success is fabricated',()=>{const source={sources:[{source_id:'s',display_name:'数量.csv',sheets:[{sheet_id:'CSV',name:'CSV',rows:[{cells:[{column:'A',value:'数量'}]}]}]}]},oldIdentity={task_id:'t',revision:'1',run_id:'old-run',scope_sha256:'scope'},plan={version:'1.0',goal:'数量汇总',source_id:'s',sheet_id:'CSV',operation:'sum',column:'A',unit:'件'},step={version:'1.0',step_id:'old-step',saved:true,identity:oldIdentity,framework:{plan},calculation:{value:'10',unit:'件',rows:2},verification:{grade:'independent_arithmetic',method:'bigint_source_recheck',plan_sha256:'p',result_sha256:'result'}};const old={identity:oldIdentity,question:'旧范围',state:'stopped',source,framework:{plan},outcome:null,verified_steps:[step]},latest={identity:{...oldIdentity,revision:'2',run_id:'new-run'},question:'新范围',state:'unknown',source,framework:null,outcome:null,verified_steps:[],history:[old],display_revision:'1'};const view=openTaskView(latest);assert.equal(view.historical,true);assert.match(view.status,/正在核对上次请求/);assert.equal(view.report,null);assert.equal(view.partials[0].id,'old-step');assert.equal(view.partials[0].evidence.revision,'1');assert.equal(view.versions[0].hasResult,true);});

test('FM-A05: reuse is an exact reference on ordinary initial command; lost receipt only reads',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};let body,writes=0;const ref={version:'1.0',source_task_id:crypto.randomUUID(),source_revision:'2',plan_sha256:'a'.repeat(64)};
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{writes++;body=JSON.parse(options.body);throw Error('lost');}});await assert.rejects(()=>client.submit('本期',[],null,ref));assert.deepEqual(body.reuse_plan,ref);assert.equal(Object.hasOwn(body,'recipe'),false);const id=client.pending().task_id,paths=[];const fresh=createQuickAnalysisClient({storage,request:async path=>{paths.push(path);return new Response(JSON.stringify(path.endsWith('/submission')?{version:'1.0',command_id:id,state:'accepted'}:{identity:{task_id:id},state:'saved'}));}});await fresh.recover();assert.equal(writes,1);assert.deepEqual(paths,['/v1/open-analysis/'+id+'/submission','/v1/open-analysis/'+id]);
});
test('FM-A05: only backend-advertised confirmed qualified recipe has the accepted UI action',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const t={identity:{task_id:'task',revision:'2'},state:'saved',question:'数量',source:{sources:[]},framework:{plan:{version:'1.0',goal:'数量',operation:'sum',unit:'件',source_id:'source',sheet_id:'csv',column:'A'}},confirmed_plan:{revision:'2'},outcome:{framework:{operation:'sum'},explanation:{text:'20'},calculation:{value:'20',rows:1,unit:'件'},verification:{grade:'independent_arithmetic'}},plan_reuse_supported:true};const view=openTaskView(t);assert.equal(view.planReusable,true);const html=renderQuickAnalysisWorkbench({mode:'quick',project:'本项目',tasks:[],current:view,drawer:true,detail:'plan'});assert.match(html,/查看可沿用的方案/);assert.equal(openTaskView({...t,plan_reuse_supported:undefined}).planReusable,false);assert.equal(openTaskView({...t,state:'unknown'}).planReusable,false);
});

test('FM-A02/03: human step plan shows real dependencies, qualified facts and honest unsupported branch in existing scheme drawer',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs'),{renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const a='a',b='b',identity={task_id:'task',revision:'1',run_id:'run',scope_sha256:'scope'},plan={goal:'订单总额',operation:'sum',source_id:'source',sheet_id:'csv',column:'A',unit:'元'};const task={identity,question:'销售额',state:'waiting',source:{sources:[]},framework:{plan,steps:{version:'1.0',steps:[{step_id:a,title:'订单总额',depends_on:[],hypotheses:[],required_evidence:['订单资料'],limitations:['不是净额'],framework:{plan},unavailable_reason:null},{step_id:b,title:'退款关联',depends_on:[a],hypotheses:[],required_evidence:['退款唯一关联'],limitations:['未计算净额'],framework:null,unavailable_reason:'METHOD_UNAVAILABLE'}]}},verified_steps:[{saved:true,step_id:'receipt',identity,framework:{plan},calculation:{value:'10',unit:'元',rows:2},verification:{grade:'independent_arithmetic',plan_sha256:'hash'}}]};const view=openTaskView(task);assert.equal(view.framework.steps[0].status,'verified');assert.equal(view.framework.steps[1].status,'unsupported');const html=renderQuickAnalysisWorkbench({mode:'quick',project:'本项目',tasks:[],current:view,drawer:true,detail:'plan'});assert.match(html,/订单总额/);assert.match(html,/退款唯一关联/);assert.match(html,/方法尚未支持/);assert.match(html,/不是净额/);
});

test('FM-A03: cancellation lost receipt reads exact scope revision or ready preparation, never resends',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},id=crypto.randomUUID(),step_id=crypto.randomUUID();let writes=0,body;const client=createQuickAnalysisClient({control:'owned',storage,request:async(_path,options)=>{writes++;body=JSON.parse(options.body);throw Error('lost');}});await assert.rejects(()=>client.cancelStep(id,'1',step_id,'先保留总额'));assert.equal(body.confirmed,true);assert.equal(body.step_id,step_id);const command_id=client.pending().command_id;const fresh=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({identity:{task_id:id,revision:'1'},revision_previews:[{command_id,baseline_identity:{revision:'1'},state:'ready',question:'取消退款关联。理由：先保留总额。仅继续保留步骤；原问题尚未完整交付。'}]}))});const task=await fresh.recover();assert.equal(task.identity.revision,'1','prepared cancellation is not accepted scope');assert.equal(fresh.pending(),null);assert.equal(writes,1);
});

test('FUI-02: visible bound calculation labels use actual source headers, never physical column letters',()=>{const task={identity:{task_id:'task',revision:'1'},question:'核对销售额',state:'waiting',source:{sources:[{source_id:'source',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{row:1,cells:[{column:'C',value:'实付金额',type:'string'}]}]}]}]},framework:{plan:{version:'1.2',goal:'核对销售额',operation:'sum',unit:'元',source_id:'source',sheet_id:'csv',column:'C',group_by:null,filters:[]}}};assert.equal(openTaskView(task).framework.binding,'实付金额 · 元');});

test('FM-A04: objection submission carries exact finding reference and lost reply readback never resends it',async()=>{let body,writes=0;const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},id=crypto.randomUUID(),objection={finding_id:crypto.randomUUID()+':metric'};const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{body=JSON.parse(options.body);writes++;throw Error('lost');}});await assert.rejects(()=>client.previewRevision(id,'1','核对这条发现的范围',null,undefined,objection));assert.deepEqual(body.objection,objection);const reopened=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({identity:{task_id:id,revision:'1'},revision_previews:[{command_id:client.pending().command_id,state:'ready',baseline_identity:{revision:'1'},question:'核对这条发现的范围',objection}],state:'saved'}))});await reopened.recover();assert.equal(writes,1);assert.equal(reopened.pending(),null);});

test('FM-A04: recovered objection receipt with another finding remains pending and never repeats write',async()=>{const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},id=crypto.randomUUID();let writes=0;const client=createQuickAnalysisClient({control:'owned',storage,request:async()=>{writes++;throw Error('lost');}});await assert.rejects(()=>client.previewRevision(id,'1','范围异议',null,undefined,{finding_id:'exact:metric'}));const reopened=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({identity:{task_id:id,revision:'1'},revision_previews:[{command_id:client.pending().command_id,baseline_identity:{revision:'1'},question:'范围异议',objection:{finding_id:'another:metric'},state:'ready'}]}))});await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());assert.equal(writes,1);});

test('FUI-03: checked member partial facts show business metrics, never raw Runtime result JSON',()=>{const identity={task_id:'task',revision:'1',run_id:'run',scope_sha256:'scope'},period={active_member_count:'1',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'1'},repeat_revenue_fen:'3000'},task={identity,question:'会员复购',state:'failed',source:{sources:[]},verified_steps:[{saved:true,step_id:'step',identity,framework:{plan:{version:'1.4',goal:'核对会员复购',unit:'CNY'}},calculation:{value:JSON.stringify({periods:{comparison:period,current:period},changes:{},m2:{status:'not_selected'}}),unit:'CNY',rows:4},verification:{grade:'independent_arithmetic',method:'python_member_source_recheck'}}]};const view=openTaskView(task);assert.match(view.partials[0].value,/本期/);assert.match(view.partials[0].value,/复购收入.*30.00元/);assert.doesNotMatch(view.partials[0].value,/repeat_revenue_fen|"periods"/);assert.equal(view.report,null);});

test('FM-A03: step view consumes exact current running/checking/UNKNOWN receipts without promoting pending dependency',()=>{const identity={task_id:'task',revision:'2',run_id:'current',scope_sha256:'scope'},step_id=crypto.randomUUID(),dep=crypto.randomUUID(),plan={version:'1.1',goal:'数量',source_id:'source',sheet_id:'csv',operation:'sum',column:'A',unit:'件',group_by:null,filters:[]},step=(id,deps)=>({step_id:id,title:'核对数量',depends_on:deps,hypotheses:[],required_evidence:['当前数量'],limitations:['原因未证实'],framework:{plan},unavailable_reason:null}),task={identity,epoch:2,question:'数量',state:'running',source:{sources:[]},framework:{plan,steps:{version:'1.0',steps:[step(step_id,[]),step(dep,[step_id])]}},step_events:[{identity,epoch:2,seq:1,step_id,phase:'running',code:null},{identity,epoch:2,seq:2,step_id,phase:'checking',code:null}]};const view=openTaskView(task);assert.equal(view.framework.steps[0].status,'checking');assert.equal(view.framework.steps[1].status,'blocked');assert.ok(view.events.some(e=>e.summary.includes('核对计算与依据')));const unknown=openTaskView({...task,state:'unknown',step_events:[...task.step_events,{identity,epoch:2,seq:3,step_id,phase:'unknown',code:'STOP_REQUESTED'}]});assert.equal(unknown.framework.steps[0].status,'unknown');assert.equal(unknown.report,null);const late=openTaskView({...task,step_events:[...task.step_events,{identity:{...identity,run_id:'obsolete'},epoch:1,seq:3,step_id,phase:'verified',code:null}]});assert.equal(late.framework.steps[0].status,'checking');});

test('FM-A03: resolved prerequisite clears obsolete blocked projection while preserving actual event history',()=>{const identity={task_id:'task',revision:'1',run_id:'run',scope_sha256:'scope'},a=crypto.randomUUID(),b=crypto.randomUUID(),plan={version:'1.1',goal:'数量',source_id:'source',sheet_id:'csv',operation:'sum',column:'A',unit:'件',group_by:null,filters:[]},step=(id,depends_on)=>({step_id:id,title:'数量',depends_on,hypotheses:[],required_evidence:[],limitations:[],framework:{plan},unavailable_reason:null}),task={identity,epoch:1,question:'数量',state:'running',source:{sources:[]},framework:{plan,steps:{version:'1.0',steps:[step(a,[]),step(b,[a])]}},verified_steps:[{saved:true,identity,step_id:'proof',framework:{plan},calculation:{value:'10',rows:2,unit:'件'},verification:{grade:'independent_arithmetic'}}],step_events:[{identity,epoch:1,seq:1,step_id:b,phase:'blocked',code:'STEP_BLOCKED'}]};task.framework.steps.steps[1].framework.plan={...plan,goal:'平均',operation:'mean'};const view=openTaskView(task);assert.equal(view.framework.steps[0].status,'verified');assert.equal(view.framework.steps[1].status,'pending');assert.ok(view.events.some(e=>e.summary.includes('等待前一步完成核验')));});

test('Q11-UX-R02: slow passive read survives subsequent timer ticks and publishes reply without Stop or dispatch',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});
 let poll,dispose,hold=false,reads=0,writes=0;const releases=[];
 const task=state=>({identity:{task_id:'slow-task',revision:'1'},question:'慢速回复',state,source:{sources:[]},framework:null,outcome:null,conversation_outcome:state==='saved'?{text:'自动收回的回复',kind:'MODEL_CONVERSATION'}:null});let current=task('running');
 const settle=async()=>{for(let i=0;i<16;i++)await new Promise(setImmediate);};
 try{
  globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{if(o?.method==='POST')writes++;let value;if(path.endsWith('/methods'))value={skills:[],prompts:[]};else if(path==='/v1/open-analysis'){reads++;value=[current];if(hold)await new Promise(resolve=>releases.push(resolve));}else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else value=current;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{task:'slow-task'}})}});await settle();
  hold=true;current=task('saved');const before=reads;poll();await settle();poll();await settle();poll();await settle();
  const overlapping=reads-before;releases.shift()();await settle();
  assert.match(app.innerHTML,/自动收回的回复/,'a completed read must publish even when slower than the poll interval');assert.equal(overlapping,1,'passive timer must not pile up or invalidate its own reads');assert.equal(writes,0,'no Stop or provider-producing write');
 }finally{hold=false;for(const resolve of releases)resolve();await settle();dispose?.();Object.assign(globalThis,prior);}
});

test('Q11-UX-R02: persisted final conversation reply appears even when continuation only has user/earlier messages',()=>{
 const base={identity:{task_id:'conversation',revision:'2'},question:'第二轮',state:'saved',source:{sources:[]},checkpoint:{messages:[{speaker:'user',text:'第一轮'},{speaker:'assistant',text:'旧回复'},{speaker:'user',text:'第二轮'}]},conversation_outcome:{text:'本轮已保存的最终回复',kind:'MODEL_CONVERSATION'}};
 const view=openTaskView(base);assert.equal(view.messages.at(-1).text,'本轮已保存的最终回复');assert.equal(view.messages.filter(m=>m.text==='本轮已保存的最终回复').length,1);
 base.checkpoint.messages.push({speaker:'assistant',text:JSON.stringify({kind:'answer',text:'本轮已保存的最终回复'})});const complete=openTaskView(base);assert.equal(complete.messages.filter(m=>m.text==='本轮已保存的最终回复').length,1,'canonical outcome and JSON checkpoint must not duplicate final reply');
});


test('Q11-UX-C03: composer answers explicit waiting clarification despite a proposed framework; ordinary plan changes still preview',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}}),settle=async()=>{for(let i=0;i<24;i++)await new Promise(setImmediate);};
 try{for(const [state,clarification,expected] of [['waiting',{text:'金额单位和币种？'},'revise'],['saved',null,'preview'],['waiting',null,'preview']]){
  const listeners={},app={innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},id=crypto.randomUUID(),writes=[];
  const task={identity:{task_id:id,revision:'1'},question:'销售额扣除退款后是多少',state,source:{sources:[]},revision_preview_supported:true,clarification,framework:{plan:{version:'1.1',goal:'销售净额',operation:'sum',source_id:'source',sheet_id:'CSV',column:'C',unit:'待确认',filters:[],group_by:null}}};
  globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener(){}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{let value;if(o?.method==='POST'){const body=JSON.parse(o.body);writes.push({path,body});value={...task,state:'running',revision_previews:[{command_id:body.command_id,baseline_identity:{revision:'1'},question:body.question,state:'preparing'}]};}else if(path.endsWith('/methods'))value={skills:[],prompts:[]};else if(path==='/v1/open-analysis')value=[task];else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else value=task;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{task:id}})}});await settle();
  listeners.input({target:{id:'analysis-message',value:'万，人民币'}});listeners.submit({target:{matches:selector=>selector==='[data-form="message"]'},preventDefault(){}});await settle();
  assert.equal(writes.length,1);assert.equal(writes[0].path,'/v1/open-analysis/'+id+'/'+expected,`${state} clarification=${!!clarification} must use ${expected}`);assert.equal(writes[0].body.question,'万，人民币');assert.equal(writes[0].body.expected_revision,'1');assert.equal(writes[0].body.sources,undefined,'same approved materials');assert.doesNotMatch(app.innerHTML,/万，人民币<\/textarea>/,'accepted message must clear composer');
 }}finally{Object.assign(globalThis,prior);}
});

test('Q11-UX-C03: a clarification answer does not rename the analysis goal',()=>{
 const identity={task_id:'task',revision:'2'},source={sources:[]},original={identity:{...identity,revision:'1'},question:'销售额扣除退款后是多少',state:'waiting',clarification:{text:'单位和币种？'},source};
 const current={identity,question:'万，人民币',state:'saved',source,history:[original],conversation_outcome:{text:'45.50 万元人民币',kind:'MODEL_CONVERSATION'}};assert.equal(openTaskView(current).title,original.question);
 assert.equal(openTaskView({...current,history:[{...original,state:'saved',clarification:null}]}).title,'万，人民币','ordinary revised goals retain their own title');
});

test('R1-UX02: existing unselected projects open normally, project methods load only after explicit selection',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const elements=[],listeners={},app={innerHTML:'',addEventListener:(n,fn)=>listeners[n]=fn};
 const element=()=>{const e={children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};let selected=false,methods=0,writes=0;
 try{globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener(){}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{let value;if(path==='/v1/projects')value={projects:[{project_id:'existing',display_name:'现有项目'}],current:null};else if(path==='/v1/projects/select'){assert.equal(JSON.parse(o.body).project_id,'existing');selected=true;writes++;value={control:'project-owned'};}else if(path.endsWith('/methods')){methods++;if(!selected)return new Response('{}',{status:400});value={skills:[],prompts:[]};}else if(path==='/v1/open-analysis')value=[];else throw Error(path);return new Response(JSON.stringify(value));};
 await assert.doesNotReject(()=>startQuickWorkspace({service:true,control:'service-owned'}));assert.equal(methods,0);assert.equal(writes,0);assert.ok(elements.some(e=>e.textContent==='现有项目'));
 await elements.find(e=>e.textContent==='现有项目').onclick();assert.equal(writes,1);assert.equal(methods,1);assert.match(app.innerHTML,/现有项目/);
 }finally{Object.assign(globalThis,prior);}
});


test('R1-DIALOGUE01/UI-RV01/06: answered natural followup appears as central dialogue without revision impact or new verified facts',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');const identity={task_id:crypto.randomUUID(),revision:'1',scope_sha256:'a'.repeat(64)},task={identity,question:'数量分析',state:'saved',source:{sources:[]},framework:null,outcome:null,conversation_outcome:{text:'此前说明',outcome_id:crypto.randomUUID()},revision_previews:[{command_id:crypto.randomUUID(),baseline_identity:identity,state:'answered',question:'先等我整理好资料',text:'好的，准备好再继续。',framework:null}],report_edits:[],history:[]};
 const before=structuredClone(task),view=openTaskView(task);assert.deepEqual(view.messages.slice(-2),[{role:'user',text:'先等我整理好资料'},{role:'assistant',text:'好的，准备好再继续。'}]);assert.equal(view.preview.state,'answered');assert.deepEqual(task,before);const html=renderQuickAnalysisWorkbench({current:view,tasks:[],mode:'quick',readonly:false});assert.match(html,/好的，准备好再继续/);assert.doesNotMatch(html,/查看修改影响|采纳并重新计算|拟采用的方案/);assert.equal(view.framework,null);assert.equal(view.report.conversation,true);
});


test('R1-FOCUS02/UI-RV02: overall agreed North scope remains visible beside January method slice',async()=>{
 const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const source={sources:[{source_id:'s',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'订单明细',rows:[{row:1,cells:[{column:'A',value:'金额'},{column:'B',value:'地区'},{column:'C',value:'期间'}]}]}]}]};
 const task={identity:{task_id:'task',revision:'1'},question:'比较两期北区销售',state:'waiting',source,framework:{plan:{version:'1.2',goal:'一月北区销售',operation:'sum',unit:'元',source_id:'s',sheet_id:'csv',column:'A',group_by:null,filters:[{column:'B',operator:'eq',value:'北'},{column:'C',operator:'eq',value:'2026-01'}]},context:{question:{text:'比较两期北区销售'},source_facts:[],proposal:{plan:{goal:'一月北区销售'}},business:{purpose:'两期比较',object:'北区订单',scope:'北区全部期间',deliverables:['比较报告'],hypotheses:[],unknowns:[],execution_scope:[{source_id:'s',sheet_id:'csv',filters:[{column:'B',operator:'eq',value:'北'}]}]}}}};
 const view=openTaskView(task),whole=view.framework.scope.filter(r=>r.label==='本次分析整体范围');
 assert.deepEqual(whole,[{label:'本次分析整体范围',value:'订单.csv / 订单明细；地区 等于 北'}]);
 assert.ok(view.framework.scope.some(r=>r.label==='筛选条件（同时满足）'&&r.value.includes('期间 等于 2026-01')));
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:view,drawer:true,detail:'plan'});assert.match(html,/本次分析整体范围/);assert.match(html,/订单明细；地区 等于 北/);assert.match(html,/期间 等于 2026-01/);
 const legacy=openTaskView({...task,framework:{...task.framework,context:{...task.framework.context,business:{...task.framework.context.business,execution_scope:undefined}}}});assert.equal(legacy.framework.scope.some(r=>r.label==='本次分析整体范围'),false);
});


test('R1-UX05: inline detail controls open the real existing drawer without issuing writes',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;}};let dispose,writes=0;
 const element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});
 const task={identity:{task_id:'detail-task',revision:'1'},question:'分析执行失败',state:'failed',source:{sources:[]},framework:null,outcome:null,checkpoint:null,preferences:{skill:'general',prompt:'professional'}};
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};
  globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,options)=>{if(options?.method==='POST')writes++;const value=path.endsWith('/methods')?{skills:[],prompts:[]}:path==='/v1/open-analysis'?[task]:path.endsWith('/collaboration')||path.endsWith('/requests')?[]:task;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});click({task:'detail-task'});await settle();
  for(const detail of ['execution','files','evidence']){
   click({detail});await settle();assert.doesNotMatch(app.innerHTML,/<aside[^>]*id="analysis-drawer"[^>]*hidden/,'inline '+detail+' opens drawer');assert.match(app.innerHTML,new RegExp('id="detail-'+detail+'"[^>]*aria-selected="true"'));click({action:'drawer-close'});await settle();assert.match(app.innerHTML,/<aside[^>]*id="analysis-drawer"[^>]*hidden/);
  }
  assert.equal(writes,0,'inspection never issues model or execution commands');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});

test('R1-B1-SEP04: partial proof presents actual execution scope instead of certifying a model goal',()=>{
 const identity={task_id:'task',revision:'1',run_id:'run',scope_sha256:'scope'},source={sources:[{source_id:'orders',display_name:'订单.csv',sheets:[{sheet_id:'csv',name:'CSV',rows:[{cells:[{column:'A',value:'订单金额'},{column:'B',value:'地区'}]}]}]}]},plan={version:'1.2',goal:'独立核验Tea退款合计0元',operation:'sum',source_id:'orders',sheet_id:'csv',column:'A',unit:'元',filters:[{column:'B',operator:'eq',value:'北'}],group_by:null};
 const task={identity,question:'经营分析',state:'failed',source,framework:{plan},outcome:null,verified_steps:[{saved:true,step_id:'receipt',identity,framework:{plan},calculation:{value:'350',unit:'元',rows:2},verification:{grade:'independent_arithmetic'}}]};
 const view=openTaskView(task),html=renderQuickAnalysisWorkbench({mode:'quick',project:'本项目',tasks:[],current:view,drawer:false});
 const partial=html.slice(html.indexOf("<h2>已核验的部分成果"),html.indexOf("data-detail=\"execution\""));assert.match(partial,/已核验的部分成果/);assert.doesNotMatch(partial,/独立核验Tea退款合计0元/);assert.match(partial,/订单金额/);assert.match(html,/地区.*北/);assert.match(html,/350/);assert.match(html,/查看这一步的依据/);assert.equal(view.partials[0].goal,plan.goal,'original model goal remains in the underlying history');
});


test('R1/UI-RV03-06: saved report default keeps findings and major limitations while full facts remain expandable and professional',async()=>{
 const {openTaskView}=await import('../../../apps/browser/quick-analysis-client.mjs');const {renderQuickAnalysisWorkbench}=await import('../../../apps/browser/quick-analysis-workbench.mjs');
 const text='## 已核验事实\n\n| 实际计算范围 | 结果 | 单位 | 核验范围 |\n| --- | --- | --- | --- |\n| 北区1月 | 230 | 元 | 独立算术核验 |\n| 南区2月 | 350 | 元 | 独立算术核验 |\n\n## 分析解释与推导\n\n以下为 Agent 对事实的解释、假说和限制，未作独立语义或因果核验。\n\n范围对比：北区1月与2月，后列减前列40元（结果推导）。\n\n两地相对位次变化；不能推断因果。\n\n## 未完成的范围\n\n没有对应记录的切片未核验，不按零值解释。';
 const task={identity:{task_id:'report',revision:'1'},question:'比较净额',state:'saved',source:{sources:[]},outcome:{calculation:{value:'350',unit:'元'},verification:{grade:'independent_arithmetic'},explanation:{text}}};const view=openTaskView(task);
 assert.match(view.messages.at(-1).text,/两地相对位次变化/);assert.match(view.messages.at(-1).text,/不能推断因果/);assert.match(view.messages.at(-1).text,/不按零值解释/);assert.ok(!view.messages.at(-1).text.includes('| 实际计算范围 |'));assert.ok(!view.messages.at(-1).text.includes('范围对比：'));assert.equal(view.report.text,text);
 const basic=renderQuickAnalysisWorkbench({mode:'quick',current:view,tasks:[],readonly:true});assert.ok(!basic.includes('实际计算范围'));assert.match(basic,/展开报告/);
 for(const settings of [{mode:'quick',expanded:'report'},{mode:'pro',stage:'report'}]){const html=renderQuickAnalysisWorkbench({...settings,current:view,tasks:[],readonly:true});assert.match(html,/实际计算范围/);assert.match(html,/230/);assert.match(html,/350/);assert.match(html,/不按零值解释/);}
});


test('NU01: new analysis clears the old selected-file notice when it clears its draft materials',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;}};let dispose,input,writes=0;
 const element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){},click(){}});
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={getElementById:()=>app,createElement:n=>{const x=element();if(n==='input')input=x;return x;},head:{append(){}},body:{append(){}}};
  globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{if(o?.method==='POST')writes++;return new Response(JSON.stringify(path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
  await startQuickWorkspace({control:'owned'});click({action:'files'});await settle();
  input.files=[{name:'合成订单.csv',size:4,arrayBuffer:async()=>new TextEncoder().encode('A\n1\n').buffer}];input.onchange();await settle();
  assert.match(app.innerHTML,/已选定 合成订单.csv/);click({action:'new'});await settle();
  assert.doesNotMatch(app.innerHTML,/已选定 合成订单.csv/,'an empty new draft must not claim the prior file is selected');
  assert.match(app.innerHTML,/今天，想弄清什么/);assert.equal(writes,0,'resetting a draft never starts a model or carries a material grant');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});


test('NR02/NU01: partial interpretation without numeric links cannot hide the current checked answer',()=>{
 const text='## 已核验事实\n\n| 实际范围 | 结果 | 单位 | 检查范围 |\n| --- | --- | --- | --- |\n| 当前A范围 | [80](juanerai-number:F1) | 元 | 本行范围独立核算一致 |\n| 当前B范围 | [270](juanerai-number:F2) | 元 | 本行范围独立核算一致 |\n\n## 派生公式已核验\n\n差额：[190.00 元](juanerai-number:D1)。\n\n## 分析解释与推导\n\n以下为 Agent 的解释、假说和限制，未作独立语义或因果核验。\n\n没有原因资料，不推断因果。\n\n## 报告检查缺口\n\n无源主张未采用。';
 const values=[['F1','80'],['F2','270'],['D1','190.00']].map(([id,display])=>({id,display,label:id,unit:'元',value:display}));
 const task={identity:{task_id:'partial',revision:'2'},question:'比较',state:'saved',source:{sources:[]},outcome:{calculation:{value:'270',unit:'元'},verification:{grade:'independent_arithmetic'},explanation:{text},numeric_report:{values,status:'partial'}}};
 const view=openTaskView(task);assert.match(view.messages.at(-1).text,/juanerai-number:F1/);assert.match(view.messages.at(-1).text,/juanerai-number:F2/);assert.match(view.messages.at(-1).text,/juanerai-number:D1/);assert.match(view.messages.at(-1).text,/无源主张未采用/);
 const html=renderQuickAnalysisWorkbench({mode:'quick',current:view,tasks:[],readonly:true});assert.match(html,/data-number="F1"/);assert.match(html,/data-number="D1"/);assert.equal(view.report.text,text,'presentation fallback does not mutate saved report or invent evidence');
});

test('NU01/NR08: partial report default is a compact bound answer, never the audit table',()=>{
 const text='## 已核验事实\n\n| 实际范围 | 结果 | 单位 | 检查范围 |\n| --- | --- | --- | --- |\n| 很长的范围与关联输入倍率 | [80](juanerai-number:F1) | 元 | 本行范围独立核算一致 |\n\n## 派生公式已核验\n\n差额：[190.00 元](juanerai-number:D1)。\n\n## 分析解释与推导\n\n以下为 Agent 的解释、假说和限制，未作独立语义或因果核验。\n\n原因资料缺失。\n\n## 报告检查缺口\n\n无源主张未采用。';
 const values=[{id:'F1',label:'本期净额',display:'80',unit:'元',grade:'independent_arithmetic',status:'verified'},{id:'D1',label:'差额',display:'190.00',unit:'元',grade:'derived_formula',status:'verified'}];
 const task={identity:{task_id:'compact',revision:'2'},question:'净额比较',state:'saved',source:{sources:[]},outcome:{calculation:{value:'80',unit:'元'},verification:{grade:'independent_arithmetic'},explanation:{text},numeric_report:{values,status:'partial'}}};
 const view=openTaskView(task),answer=view.messages.at(-1).text;assert.doesNotMatch(answer,/已核验事实|派生公式已核验|\| 实际范围|输入倍率|本行范围独立核算一致/);assert.ok(answer.length<450);assert.match(answer,/juanerai-number:F1/);assert.match(answer,/juanerai-number:D1/);assert.match(answer,/无源主张未采用/);
 const html=renderQuickAnalysisWorkbench({mode:'quick',current:view,tasks:[],readonly:true});assert.doesNotMatch(html,/<table/);assert.match(html,/data-number="F1"/);assert.match(html,/data-number="D1"/);assert.equal(view.report.text,text);
});

test('NR02/NU01: compact numeric answer preserves the distinguishing period before technical suffixes',()=>{
 const values=['2026-01','2026-02'].map((period,i)=>({id:'F'+(i+1),label:'订单.csv／CSV · 金额 求和 · 地区 = 北，商品 = Coffee，期间 = '+period+' − 关联退款.csv金额合计；币种CNY，输入倍率1',display:i?'270':'80',unit:'CNY',grade:'independent_arithmetic',status:'verified'}));
 const text='## 已核验事实\n'+values.map(v=>'['+v.display+'](juanerai-number:'+v.id+')').join('\n')+'\n## 分析解释与推导\n\n以下为 Agent 的解释、假说和限制，未作独立语义或因果核验。\n\n无原因资料。';
 const task={identity:{task_id:'period',revision:'2'},question:'比较两期',state:'saved',source:{sources:[]},outcome:{calculation:{value:'270',unit:'CNY'},verification:{grade:'independent_arithmetic'},explanation:{text},numeric_report:{values,status:'partial'}}};
 const answer=openTaskView(task).messages.at(-1).text;assert.match(answer,/2026-01/);assert.match(answer,/2026-02/);assert.doesNotMatch(answer,/输入倍率/);assert.match(answer,/− 关联退款/,'net calculation must not be presented as gross sum');
});

test('UX61: saved source cards expand bounded real sheet rows, escape cells, never expose the eleventh row',()=>{
 const rows=[{cells:[{column:'A',value:'金额'}]},...Array.from({length:30},(_,i)=>({cells:[{column:'A',value:i===0?'<script>bad</script>':i===10?'hidden-eleventh':String(i)}]}))];
 const task={identity:{task_id:'preview',revision:'1'},question:'预览',state:'ready',source:{sources:[{source_id:'source',display_name:'订单.csv',sheets:[{name:'CSV',rows,full_data_rows:30}]}]}};
 const html=renderQuickAnalysisWorkbench({tasks:[],drawer:true,detail:'files',current:openTaskView(task)});
 assert.match(html,/<summary[^>]*>[^]*订单.csv/);assert.match(html,/<table/);assert.match(html,/预览前 10 行[^]*共 30 行/);assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.ok(!html.includes('hidden-eleventh'));
});
test('UX60: both existing pane boundaries are keyboard-accessible separators; closed drawer has no active right divider',()=>{
 for(const drawer of [false,true]){const html=renderQuickAnalysisWorkbench({tasks:[],drawer,current:null});assert.match(html,/role="separator"[^]*aria-label="调整会话侧栏宽度"/);assert.match(html,/data-resize="right"[^>]*aria-label="调整检查详情宽度"/);assert.ok(html.includes('data-resize="right"')&&html.includes('aria-orientation="vertical"'));if(!drawer)assert.match(html,/data-resize="right"[^>]*hidden/);}
});
test('UX62: rail reserves requested plugin/account slots, sidebar collapses without deleting current conversation',()=>{
 const view={title:'原任务',messages:[{role:'user',text:'保持当前问题'}],materials:[],events:[]};const html=renderQuickAnalysisWorkbench({tasks:[],current:view,sidebarCollapsed:true});
 assert.match(html,/展开会话侧栏/);assert.match(html,/产品功能入口/);assert.match(html,/data-action="plugins"/);assert.match(html,/data-action="settings"/);assert.match(html,/data-action="account"/);assert.match(html,/保持当前问题/);assert.match(html,/sidebar-collapsed/);
});

test('VC-11 confirmed Application execution action stays durable but does not become a user bubble',()=>{
 const question='准备方案，采纳前不计算',prefix='当前实际动作：用户已经采纳方案并要求执行计算与独立核验。下列文字是准备阶段原始需求，用于确定分析意图；其中先准备、暂不计算及采纳后再算等阶段文字不覆盖已经发生的采纳动作。实际执行仍受当前获准资料、绑定范围及停止检查约束。\n采纳的原始分析要求：';
 const task={identity:{task_id:'synthetic-action',revision:'2'},question,state:'waiting',source:{sources:[]},confirmed_plan:{version:'1.0',revision:'2'},checkpoint:{messages:[{speaker:'user',text:question},{speaker:'user',text:prefix+question},{speaker:'assistant',text:'已实际核验300元。'},{speaker:'user',text:'当前实际动作：这个词是什么意思？'}]}};const before=structuredClone(task);
 const view=openTaskView(task);assert.deepEqual(view.messages,[{role:'user',text:question},{role:'assistant',text:'已实际核验300元。'},{role:'user',text:'当前实际动作：这个词是什么意思？'}]);assert.deepEqual(task,before,'durable record preserved');
 const unconfirmed=openTaskView({...task,confirmed_plan:null});assert.equal(unconfirmed.messages.length,4,'plain user text is not classified as product authority');
});

test('VC-10/12: current model report expression is projected without changing original outcome; foreign basis and historical versions are ignored',()=>{
 const identity={task_id:'report',revision:'2',run_id:'run',scope_sha256:'scope'},outcome={outcome_id:'original',calculation:{value:'10',unit:'件'},verification:{grade:'independent_arithmetic'},explanation:{text:'Original checked expression'},numeric_report:{identity,status:'partial',text:'Original checked expression',values:[]}},report={outcome_id:'original',numeric_report:{identity,status:'complete',text:'Current checked expression',values:[]}};
 const old={identity:{...identity,revision:'1',run_id:'old'},question:'Earlier question',state:'saved',source:{sources:[]},outcome:{...outcome,outcome_id:'old'}};
 const task={identity,question:'Current question',state:'saved',source:{sources:[]},outcome,history:[old],revision_previews:[{state:'answered',baseline_identity:identity,question:'Explain saved facts',text:report.numeric_report.text,report}]},before=structuredClone(task);
 assert.match(openTaskView(task).report.text,/Current checked expression/);assert.equal(openTaskView(task).numericReportStatus,'complete');assert.deepEqual(task,before);
 for(const invalid of [{...report,outcome_id:'foreign'},{...report,numeric_report:{...report.numeric_report,identity:{...identity,run_id:'foreign'}}}])assert.match(openTaskView({...task,revision_previews:[{...task.revision_previews[0],report:invalid}]}).report.text,/Original checked expression/);
 assert.match(openTaskView({...task,display_revision:'1'}).report.text,/Original checked expression/);
});

test('SDK041-UI01: execution drawer exposes owned conversation positions and branch controls without reclassifying business results',()=>{
 const current={title:'原分析',taskState:'saved',messages:[],materials:[],events:[]},nativeSession={branch:'owned-branch',tipId:'tip',operationId:null,queued:[],activeTools:[],faulted:false,history:[{entryId:'user-entry',role:'user',preview:'原需求'},{entryId:'tip',role:'assistant',preview:'已有回复'}]};
 const html=renderQuickAnalysisWorkbench({tasks:[],current,drawer:true,detail:'execution',nativeSession});
 assert.match(html,/data-action="session-fork"/);assert.match(html,/data-session-navigate="user-entry"/);assert.match(html,/原需求/);assert.match(html,/只调整后续对话/);
 const running=renderQuickAnalysisWorkbench({tasks:[],current:{...current,taskState:'unknown'},drawer:true,detail:'execution',nativeSession});assert.doesNotMatch(running,/data-action="session-fork"/);assert.doesNotMatch(running,/data-session-navigate=/);
});

test('P0-02: both consumers retain their GET options and visible HTTP failure messages',async()=>{
 for(const [create,call,path,headers,message] of [
  [createWorkspaceClient,c=>c.list(),'/v1/tasks',undefined,'暂时无法打开，请稍后重试。'],
  [createQuickAnalysisClient,c=>c.list(),'/v1/open-analysis',{'x-xanthil-view':'browser-v1'},'暂时无法打开，资料和已有结果仍保留，请稍后重试。']
 ]){
  const requests=[],payload=[];
  const client=create({request:async(p,options)=>{requests.push([p,options]);return {ok:true,json:async()=>payload};}});
  assert.equal(await call(client),payload);
  assert.deepEqual(requests,[[path,{credentials:'same-origin',cache:'no-store',...(headers?{headers}:{})}]]);
  let count=0;
  const failure=create({request:async()=>{count++;return {ok:false,json:()=>assert.fail('HTTP failure is not success JSON')};}});
  await assert.rejects(()=>call(failure),{message});assert.equal(count,1,'no retry');
 }
});

test('P0-02: network and parse failures remain failures, without retry or mutation',async()=>{
 for(const create of [createWorkspaceClient,createQuickAnalysisClient]){
  for(const parse of [false,true]){
   const failure=new Error(parse?'synthetic parse failure':'synthetic transport failure');let count=0;
   const client=create({request:async()=>{count++;if(!parse)throw failure;return {ok:true,json:async()=>{throw failure;}};}});
   await assert.rejects(()=>client.list(),error=>error===failure);assert.equal(count,1);
  }
 }
});

test('P0-02: shared leaf parses one successful GET, preserves caller options and does not add operation identity',async()=>{
 const headers={'x-xanthil-view':'browser-v1'},options={headers},value={state:'unknown'};let count=0;
 const result=await readJson(async(path,input)=>{count++;assert.equal(path,'/synthetic');assert.deepEqual(input,{credentials:'same-origin',cache:'no-store',headers});return {ok:true,json:async()=>value};},'/synthetic','failure',options);
 assert.equal(result,value);assert.equal(count,1);assert.deepEqual(options,{headers});
});

test('MFUI-01: selecting SAP and registry immediately shows selected names without sending or importing',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},elements=[],app={innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;},querySelector:()=>({focus(){}})};let dispose,writes=0;
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 try{
 globalThis.document={getElementById:()=>app,createElement:()=>{const e={value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;},head:{append(){}},body:{append(){}}};
 globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{if(o?.method==='POST')writes++;return new Response(JSON.stringify(path==='/v1/projects'?{projects:[]}:path.endsWith('/metric-assets')?{project_id:'synthetic',candidates:[],current:null}:path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
 await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{action:'project'}})}});await settle();await elements.find(e=>e.textContent==='分析口径').onclick();await settle();
 listeners.change({target:{id:'asset-package',files:[{name:'1.1.0.sap.yaml'}]}});await settle();assert.match(app.innerHTML,/1\.1\.0\.sap\.yaml/);
 listeners.change({target:{id:'asset-registry',files:[{name:'index.yaml'}]}});await settle();assert.match(app.innerHTML,/index\.yaml/);assert.equal(writes,0);
 }finally{dispose?.();Object.assign(globalThis,prior);}
});


test('MFUI-03: successful project switch clears private import files and unsent draft; failed switch preserves them',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},elements=[],app={innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;},querySelector:()=>({focus(){}})};let dispose,current='first',failSwitch=true,writes=0;
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const action=async(name)=>{listeners.click({target:{closest:()=>({type:'button',dataset:{action:name}})}});await settle();};
 try{
 globalThis.document={getElementById:()=>app,createElement:()=>{const e={value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;},head:{append(){}},body:{append(){}}};
 globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{if(o?.method==='POST')writes++;if(path==='/v1/projects/select'){if(failSwitch)return new Response('{}',{status:409});current='second';return new Response(JSON.stringify({control:'owned-second'}));}return new Response(JSON.stringify(path==='/v1/projects'?{current,projects:[{project_id:'first',display_name:'项目一'},{project_id:'second',display_name:'项目二'}]}:path.endsWith('/metric-assets')?{project_id:current,candidates:[],current:null}:path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
 await startQuickWorkspace({control:'owned',service:true});await action('project');await elements.find(e=>e.textContent==='分析口径').onclick();await settle();
 listeners.change({target:{id:'asset-package',files:[{name:'first-private.sap.yaml'}]}});listeners.change({target:{id:'asset-registry',files:[{name:'first-private-index.yaml'}]}});listeners.input({target:{id:'analysis-message',value:'项目一未发送的私有需求'}});await settle();
 await action('project');await elements.filter(e=>e.textContent==='项目二').at(-1).onclick();await settle();assert.match(app.innerHTML,/first-private\.sap\.yaml/,'failed switch must retain selected files');
 failSwitch=false;await action('project');await elements.filter(e=>e.textContent==='项目二').at(-1).onclick();await settle();assert.doesNotMatch(app.innerHTML,/项目一未发送的私有需求|项目暂时不能切换/,'new project must not inherit old draft or notice');
 await action('project');await elements.filter(e=>e.textContent==='分析口径').at(-1).onclick();await settle();assert.doesNotMatch(app.innerHTML,/first-private/,'new project must not inherit old import file selection');assert.equal(writes,2,'only explicit project switch attempts issue writes');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});
