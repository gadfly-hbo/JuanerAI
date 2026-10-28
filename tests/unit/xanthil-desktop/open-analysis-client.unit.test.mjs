import {readJson} from '../../../apps/browser/read-json.mjs';
import {createWorkspaceClient} from '../../../apps/browser/client.mjs';
import test,{before} from 'node:test';
const currentHtml=(task,detail='plan',extra={})=>renderQuickAnalysisWorkbench({project:'本机合成项目',tasks:[],current:openTaskView(task),drawer:true,detail,...extra});
import assert from 'node:assert/strict';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import {createQuickAnalysisClient,openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
test('MFUI-05/07: lost task asset choice reads the exact version receipt and never reissues selection or execution',async()=>{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id=crypto.randomUUID();let body,writes=0;const client=createQuickAnalysisClient({storage,control:'owned',request:async(_path,opt)=>{writes++;body=JSON.parse(opt.body);throw Error('lost reply');}});await assert.rejects(()=>client.selectMetricAsset(id,'1',{id:'net-sales-instance',version:'1.1.1'}));assert.equal(writes,1);let exact=false;const reopened=createQuickAnalysisClient({storage,request:async(_path,opt)=>{assert.equal(opt.method,undefined);return new Response(JSON.stringify({identity:{task_id:id,revision:'2'},revision_command_id:body.command_id,metric_asset_choice:{id:body.id,version:exact?'1.1.1':'1.1.0'},state:'ready'}));}});await assert.rejects(()=>reopened.recover());exact=true;const task=await reopened.recover();assert.equal(task.state,'ready');assert.equal(reopened.pending(),null);assert.equal(writes,1);});
test('MFUI-01/02/07: lost project decision recovers exact project command without resend; receipt download retry never executes',async()=>{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},project=crypto.randomUUID();let body,writes=0;const client=createQuickAnalysisClient({storage,control:'owned',request:async(_path,opt)=>{writes++;body=JSON.parse(opt.body);throw Error('lost reply');}});await assert.rejects(()=>client.assetCommand(project,{action:'approve',id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:true}));let same=false;const recovered=createQuickAnalysisClient({storage,request:async path=>new Response(JSON.stringify(path.endsWith('/metric-assets')?{project_id:same?project:crypto.randomUUID(),candidates:[]}: {command_id:body.command_id,result:{}}))});await assert.rejects(()=>recovered.recover());same=true;await recovered.recover();assert.equal(recovered.pending(),null);assert.equal(writes,1);});
test('RSUI-02/09: saved readable three-core body is visible in both context and plan without machine forms',()=>{
 const body='SCR：解释经营变化。Binding：本项目订单与退款资料，按订单关联核对，退款字段待核对。IR：两期比较，缺口保留。';
 const task={identity:{task_id:crypto.randomUUID(),revision:'1',scope_sha256:'scope'},question:'旧初始问题',state:'ready',source:{sources:[]},requirement_draft:{revision:1,sequence:1,receipts:[{sequence:1}],content:{version:'2.0',text:body},history:[]}};
 for(const detail of ['context','plan']){const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:openTaskView(task),drawer:true,detail});assert.match(html,/本项目订单/);assert.match(html,/退款字段待核对/);assert.match(html,/按订单关联核对/);assert.doesNotMatch(html,/data-action="requirement-review"/);}
});
test('RSUI-06: current and prior readable bodies stay inspectable and never self-confirm',()=>{
 const task={identity:{task_id:crypto.randomUUID(),revision:'1',scope_sha256:'scope'},question:'经营分析',state:'ready',source:{sources:[]},requirement_draft:{revision:2,sequence:2,receipts:[{sequence:1},{sequence:2}],content:{version:'2.0',text:'现：平均，数量与订单资料。'},history:[{revision:1,content:{version:'2.0',text:'原：合计，仅数量。'}}]}};
 const html=renderQuickAnalysisWorkbench({mode:'quick',tasks:[],current:openTaskView(task),expanded:'requirement'});assert.match(html,/现：平均/);assert.match(html,/原：合计/);assert.match(html,/仅数量/);assert.doesNotMatch(html,/用户已确认本版/);assert.match(html,/按当前理解分析/);
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
test('RSUI-05/07: one confirmation/start recovers its exact durable receipt without reposting',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id=crypto.randomUUID();let command,writes=0;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-start');command=JSON.parse(options.body);writes++;throw Error('lost reply');}});assert.equal(client.reviewRequirement,undefined);await assert.rejects(()=>client.startRequirement(id,2,{expected_analysis_revision:'3',scope_sha256:'b'.repeat(64)}));assert.equal(writes,1);assert.equal(command.version,'2.0');assert.equal(command.expected_analysis_revision,'3');
 let accepted=false;const reopened=createQuickAnalysisClient({storage,request:async(path,options)=>{assert.equal(options.method,undefined);assert.equal(path,'/v1/open-analysis/'+id);return new Response(JSON.stringify({identity:{task_id:id},requirement_execution:accepted?{command_id:command.command_id,revision:2}:undefined}));}});await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());accepted=true;await reopened.recover();assert.equal(reopened.pending(),null);assert.equal(writes,1);
});
test('RSUI-01: new analysis begins with natural discussion; creation uses requirements mode without a run request',async()=>{
 const html=renderQuickAnalysisWorkbench({project:'本机项目',tasks:[],current:null,detail:'context',drawer:false,entryMode:'requirements'});assert.match(html,/资料和条件可以边聊边补充/);assert.doesNotMatch(html,/data-entry-mode=/);
 let body;const client=createQuickAnalysisClient({control:'owned',request:async(path,options)=>{assert.equal(path,'/v1/open-analysis');body=JSON.parse(options.body);return new Response(JSON.stringify({identity:{task_id:body.command_id},entry_mode:'requirements',state:'ready',framework:null,outcome:null}));}});
 const task=await client.submit('先理清经营问题',[],{skill:'general',prompt:'professional'},'requirements');assert.equal(body.mode,'requirements');assert.equal(task.state,'ready');assert.equal(task.outcome,null);
});
test('RSUI-01/05: requirement dialogue retains identity only and lost reply recovery reads the same saved conversation',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';let writes=0,command;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{assert.equal(path,'/v1/open-analysis/'+id+'/requirement-discussion');writes++;command=JSON.parse(options.body);throw Error('lost reply');}});
 assert.equal(typeof client.discussRequirement,'function');await assert.rejects(()=>client.discussRequirement(id,1,'private user clarification'));assert.equal(writes,1);assert.ok(!JSON.stringify([...values.values()]).includes('private user clarification'));
 let acknowledged=false;const reads=[],reopened=createQuickAnalysisClient({storage,request:async(path)=>{reads.push(path);return new Response(JSON.stringify({identity:{task_id:id},requirement_draft:{sequence:2,receipts:[{command_id:command.command_id,sequence:2}],conversation:acknowledged?[{command_id:command.command_id,sequence:2,user:{classification:'USER_SAID',text:'private user clarification'},assistant:{classification:'MODEL_PROPOSAL',text:'关键问题'}}]:[]}}));}});
 await assert.rejects(()=>reopened.recover());assert.ok(reopened.pending());acknowledged=true;await reopened.recover();assert.equal(reopened.pending(),null);assert.deepEqual(reads,['/v1/open-analysis/'+id,'/v1/open-analysis/'+id+'/requirement-discussion-receipts/'+command.command_id,'/v1/open-analysis/'+id]);assert.equal(writes,1);
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




test('OA-08/Q11-10: lost acknowledgment is recovered by exact receipt read, with no repeated write',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let writes=0,command;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(_path,options)=>{writes++;command=JSON.parse(options.body);throw Error('lost receipt');}});
 assert.equal(typeof client.acknowledge,'function');await assert.rejects(()=>client.acknowledge('a'.repeat(8)+'-aaaa-aaaa-aaaa-'+'a'.repeat(12),{expected_revision:'1',outcome_id:'outcome',outcome_sha256:'b'.repeat(64)},'认可'));assert.equal(writes,1);assert.equal(client.canWrite(),false);
 const paths=[];const reopened=createQuickAnalysisClient({storage,request:async path=>{paths.push(path);return new Response(JSON.stringify(path.includes('/judgments/')?{saved:true,command_id:command.command_id}: {identity:{task_id:client.pending().task_id},state:'saved'}));}});await reopened.recover();assert.equal(paths.length,2);assert.ok(paths[0].endsWith('/judgments/'+command.command_id));assert.equal(reopened.pending(),null);assert.equal(writes,1);
});











 

test('OA-S04/Q11-12: safe parser next step reaches ordinary dialogue rather than a generic network/model error',async()=>{
 const client=createQuickAnalysisClient({control:'owned',request:async()=>new Response(JSON.stringify({error:'REQUEST_REJECTED',reason:'这是扫描PDF，请提供文字版或核对识别结果。'}),{status:400})});await assert.rejects(()=>client.submit('检查资料',[]),/扫描PDF/);assert.equal(client.pending(),null);
});






test('Q11-05/07: normal browser explicitly requests preview representation and uses full row count',async()=>{
 let options;const client=createQuickAnalysisClient({request:async(path,value)=>{options=value;return {ok:true,json:async()=>({})};}});await client.read('task');assert.equal(options.headers['x-xanthil-view'],'browser-v1');
 const task={identity:{task_id:'task',revision:'1'},question:'数量',state:'ready',framework:null,outcome:null,source:{sources:[{display_name:'合成.csv',sheets:[{name:'CSV',state:'visible',full_data_rows:30,rows:[{cells:[{column:'A',value:'数量'}]},{cells:[{column:'A',value:'1'}]}]}]}]}};const view=openTaskView(task);assert.match(view.materials[0].summary,/30行/);assert.equal(view.materials[0].previews[0].total,30);assert.equal(view.materials[0].previews[0].rows.length,1);
});



 test('OA-RT04/06: lost first submission reads exact receipt; explicit stop remains available while ordinary writes are fenced',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};let writes=0,id;const c=createQuickAnalysisClient({control:'owned',storage,request:async(path,o)=>{writes++;if(path.endsWith('/stop-initial'))return new Response(JSON.stringify({command_id:id,state:'unknown'}));id=JSON.parse(o.body).command_id;throw Error('lost initial reply');}});await assert.rejects(()=>c.submit('检查資料',[]));assert.equal(c.pending().kind,'initial');assert.equal(c.canWrite(),false);assert.equal(c.canStop(),true);await c.stopInitial();assert.equal(writes,2);assert.ok(c.pending());let reads=0;const restored=createQuickAnalysisClient({storage,request:async()=>{reads++;return new Response(JSON.stringify({version:'1.0',command_id:id,state:'unknown'}));}});await assert.rejects(()=>restored.recover());assert.ok(restored.pending());assert.equal(restored.canStop(),false);const terminal=createQuickAnalysisClient({storage,request:async()=>new Response(JSON.stringify({version:'1.0',command_id:id,state:'stopped'}))});assert.equal(await terminal.recover(),null);assert.equal(terminal.pending(),null);assert.equal(writes,2);assert.equal(reads,1);
 });






test('OA-08/C03: current saved report copy uses one direct route; errors never select a different report',async()=>{
 const paths=[];const client=createQuickAnalysisClient({request:async path=>{paths.push(path);return path.endsWith('/formal-review')?new Response('{}',{status:404}):new Response('保存的普通分析',{headers:{'content-type':'text/markdown'}});}});
 const copy=await client.copy('ordinary-task','2','ordinary-outcome');assert.equal(await copy.blob.text(),'保存的普通分析');assert.equal(copy.name,'JuanerAI-analysis-v2.md');assert.equal(paths.length,1);assert.ok(!paths.some(p=>p.includes('formal-review')));
 let calls=0;const failing=createQuickAnalysisClient({request:async()=>{calls++;return new Response('{}',{status:500});}});await assert.rejects(()=>failing.copy('ordinary-task','2','ordinary-outcome'));assert.equal(calls,1,'failed native read must not silently substitute another report');
});
test('OA-S01 B1: conversation reply is readable and saved without fake calculation, JSON or framework',()=>{const reply={version:'1.0',outcome_id:'reply',kind:'MODEL_ANALYSIS_REPORT',text:'先明确分析对象。',verification:'not_performed',human_judgment:'not_recorded'};const t={version:'1.3',identity:{task_id:'task',revision:'1'},question:'怎么分析',state:'saved',source:{version:'1.0',sources:[]},framework:null,outcome:null,model_report:reply,checkpoint:{messages:[{speaker:'user',text:'怎么分析'},{speaker:'assistant',text:JSON.stringify({kind:'answer',text:reply.text}),calls:[]}]}};const view=openTaskView(t);assert.equal(view.framework,null);assert.equal(view.messages[1].text,reply.text);assert.ok(view.report);assert.match(view.report.text,/未.*核验/);assert.doesNotMatch(view.report.text,/独立算术核验|本地计算：/);});


function scopeTask(revision='1'){return structuredClone(revision==='1'?ui.a:revision==='2'?ui.b:ui.c);}










for(const action of ['read','task','search'])test('Q11-02/11: late saved read cannot replace newer running conversation or stop passive reply collection ('+action+')',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const elements=[];const element=()=>{const e={value:'',children:[],append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(name,fn)=>{listeners[name]=fn;}};let poll,dispose,release,releaseTask,hold=false,holdTask=false,writes=0;
 const task=(revision,state)=>({identity:{task_id:'synthetic-task',revision},question:'问题'+revision,state,source:{sources:[]},checkpoint:null,framework:null,outcome:null,model_report:state==='saved'?{text:'回复'+revision,kind:'MODEL_ANALYSIS_REPORT'}:null,preferences:{skill:'general',prompt:'professional'}});let current=task('1','running');
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_name,fn)=>{dispose=fn;}};
  globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,options)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(options.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(options?.method==='POST')writes++;let value;
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
 const task=id=>({identity:{task_id:id,revision:'1'},question:id===a?'旧会话A':'新会话B',state:id===a&&action==='resume'?'stopped':id===a&&action==='stop'?'running':'saved',source:{sources:[]},framework:null,outcome:null,model_report:{text:id===a?'回答A':'回答B',kind:'MODEL_ANALYSIS_REPORT'}});
 const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},elements=[];
 const element=()=>{const e={value:'',children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};
 let hold=false,release,dispose,writes=0;const values=new Map(action==='read'?[['juanerai.open.pending.v1',JSON.stringify({task_id:a})]]:[]);
 const settle=async()=>{for(let i=0;i<16;i++)await new Promise(setImmediate);};const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;let result;
   if(path.endsWith('/methods'))result={skills:[],prompts:[]};else if(path.endsWith('/collaboration')||path.endsWith('/requests'))result=[];
   else if(path==='/v1/open-analysis'&&o?.method!=='POST')result=[task(a),task(b)];else if(path.endsWith('/submission'))result={version:'1.0',command_id:path.split('/').at(-2),state:'reading'};else result=task(path.includes(b)?b:a);
   if(hold&&((action==='read'&&path.endsWith(a))||o?.method==='POST')){hold=false;await new Promise(resolve=>{release=resolve;});}
   return new Response(JSON.stringify(result));
  };
  await startQuickWorkspace({control:'owned'});if(action!=='initial'){click({task:a});await settle();}
  hold=true;
  if(action==='revise'||action==='initial'){
   listeners.input({target:{id:'analysis-message',style:{},scrollHeight:60,value:'追问'}});
   listeners.submit({preventDefault(){},target:{matches:s=>s==='[data-form="message"]'}});await settle();
   if(action==='initial')void elements.find(e=>e.textContent==='同意并理清需求').onclick();
  }else click({action});
  await settle();assert.equal(typeof release,'function');if(destination==='receipt'){click({action:'read'});await settle();assert.match(app.innerHTML,/资料读取或停止还没确认/);}else{click({task:b});await settle();assert.match(app.innerHTML,/<h1>新会话B/);}
  if(destination==='new'){click({action:'new'});await settle();}else if(destination==='pagehide')dispose();const before=app.innerHTML;release();await settle();if(destination==='receipt'){assert.match(app.innerHTML,/回答A/);assert.doesNotMatch(app.innerHTML,/资料读取或停止还没确认/,'successful receipt must replace the previous pending notice');}else if(destination==='task')assert.match(app.innerHTML,/<h1>新会话B/,'late A receipt must not replace newer task B');else if(destination==='pagehide')assert.equal(app.innerHTML,before,'pagehide forbids late rendering');else{assert.match(app.innerHTML,/<h1>今天，想弄清什么/);assert.doesNotMatch(app.innerHTML,/<h1>旧会话A/,'late receipt cannot restore task after New Analysis');}assert.equal(writes,action==='read'?0:action==='initial'&&destination==='receipt'?2:1,'one creation plus its normal discussion only; no replay');
 }finally{release?.();dispose?.();Object.assign(globalThis,prior);}
});














test('FM-A05: ordinary initial command retains its exact identity; lost receipt only reads',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};let body,writes=0;
 const client=createQuickAnalysisClient({control:'owned',storage,request:async(path,options)=>{writes++;body=JSON.parse(options.body);throw Error('lost');}});await assert.rejects(()=>client.submit('本期',[],null));const id=client.pending().task_id,paths=[];const fresh=createQuickAnalysisClient({storage,request:async path=>{paths.push(path);return new Response(JSON.stringify(path.endsWith('/submission')?{version:'1.0',command_id:id,state:'accepted'}:{identity:{task_id:id},state:'saved'}));}});await fresh.recover();assert.equal(writes,1);assert.deepEqual(paths,['/v1/open-analysis/'+id+'/submission','/v1/open-analysis/'+id]);
});


















test('Q11-UX-R02: slow passive read survives subsequent timer ticks and publishes reply without Stop or dispatch',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});
 let poll,dispose,hold=false,reads=0,writes=0;const releases=[];
 const task=state=>({identity:{task_id:'slow-task',revision:'1'},question:'慢速回复',state,source:{sources:[]},framework:null,outcome:null,model_report:state==='saved'?{text:'自动收回的回复',kind:'MODEL_ANALYSIS_REPORT'}:null});let current=task('running');
 const settle=async()=>{for(let i=0;i<16;i++)await new Promise(setImmediate);};
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;let value;if(path.endsWith('/methods'))value={skills:[],prompts:[]};else if(path==='/v1/open-analysis'){reads++;value=[current];if(hold)await new Promise(resolve=>releases.push(resolve));}else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else value=current;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{task:'slow-task'}})}});await settle();
  hold=true;current=task('saved');const before=reads;poll();await settle();poll();await settle();poll();await settle();
  const overlapping=reads-before;releases.shift()();await settle();
  assert.match(app.innerHTML,/自动收回的回复/,'a completed read must publish even when slower than the poll interval');assert.equal(overlapping,1,'passive timer must not pile up or invalidate its own reads');assert.equal(writes,0,'no Stop or provider-producing write');
 }finally{hold=false;for(const resolve of releases)resolve();await settle();dispose?.();Object.assign(globalThis,prior);}
});

test('PRC01-07: a saved report keeps passively polling its in-flight postcheck, then stops after completion without a write',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});
 let poll,dispose,reads=0,writes=0;
 const task=state=>({identity:{task_id:'postcheck-task',revision:'1'},question:'已保存报告后核验',state:'saved',source:{sources:[]},outcome:null,model_report:{text:state==='completed'?'后台审查结果已收回':'已保存报告，后处理进行中',kind:'MODEL_ANALYSIS_REPORT'},report_postprocessing:{state}});let current=task('checking');
 const settle=async()=>{for(let i=0;i<20;i++)await new Promise(setImmediate);};
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;let value;if(path.endsWith('/methods'))value={skills:[],prompts:[]};else if(path==='/v1/open-analysis'){reads++;value=[current];}else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else value=current;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{task:'postcheck-task'}})}});await settle();
  const before=reads;current=task('completed');poll();await settle();assert.ok(reads>before,'saved is not proof that postcheck is idle');assert.match(app.innerHTML,/后台审查结果已收回/);const after=reads;poll();await settle();assert.equal(reads,after);assert.equal(writes,0);
 }finally{dispose?.();Object.assign(globalThis,prior);}
});






test('CW01/NR02: free requirements discussion retains its original goal; an ordinary explicit new goal keeps its own title',()=>{const original={identity:{task_id:'task',revision:'1'},source:{sources:[]},question:'销售额扣除退款后是多少'};const current={identity:{task_id:'task',revision:'2'},entry_mode:'requirements',question:'万，人民币',state:'saved',source:{sources:[]},history:[original],model_report:{text:'有限报告'}};assert.equal(openTaskView(current).title,original.question);assert.equal(openTaskView({...current,entry_mode:undefined,history:undefined}).title,'万，人民币');});

test('R1-UX02: existing unselected projects open normally, project methods load only after explicit selection',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const elements=[],listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,fn)=>listeners[n]=fn};
 const element=()=>{const e={children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;};let selected=false,methods=0,writes=0;
 try{globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener(){}};globalThis.sessionStorage={getItem:()=>null};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{let value;if(path==='/v1/projects')value={projects:[{project_id:'existing',display_name:'现有项目'}],current:null};else if(path==='/v1/projects/select'){assert.equal(JSON.parse(o.body).project_id,'existing');selected=true;writes++;value={control:'project-owned',project:{project_id:'existing',display_name:'现有项目'}};}else if(path.endsWith('/methods')){methods++;if(!selected)return new Response('{}',{status:400});value={skills:[],prompts:[]};}else if(path==='/v1/open-analysis')value=[];else throw Error(path);return new Response(JSON.stringify(value));};
 await assert.doesNotReject(()=>startQuickWorkspace({service:true,control:'service-owned'}));assert.equal(methods,0);assert.equal(writes,0);assert.ok(elements.some(e=>e.textContent==='现有项目'));
 await elements.find(e=>e.textContent==='现有项目').onclick();assert.equal(writes,1);assert.equal(methods,1);assert.match(app.innerHTML,/现有项目/);
 }finally{Object.assign(globalThis,prior);}
});








test('R1-UX05: inline detail controls open the real existing drawer without issuing writes',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;}};let dispose,writes=0;
 const element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});
 const task={identity:{task_id:'detail-task',revision:'1'},question:'分析执行失败',state:'failed',source:{sources:[]},framework:null,outcome:null,checkpoint:null,preferences:{skill:'general',prompt:'professional'}};
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};
  globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,options)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(options.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(options?.method==='POST')writes++;const value=path.endsWith('/methods')?{skills:[],prompts:[]}:path==='/v1/open-analysis'?[task]:path.endsWith('/collaboration')||path.endsWith('/requests')?[]:task;return new Response(JSON.stringify(value));};
  await startQuickWorkspace({control:'owned'});click({task:'detail-task'});await settle();
  for(const detail of ['execution','files','evidence']){
   click({detail});await settle();assert.doesNotMatch(app.innerHTML,/<aside[^>]*id="analysis-drawer"[^>]*hidden/,'inline '+detail+' opens drawer');assert.match(app.innerHTML,new RegExp('id="detail-'+detail+'"[^>]*aria-selected="true"'));click({action:'drawer-close'});await settle();assert.match(app.innerHTML,/<aside[^>]*id="analysis-drawer"[^>]*hidden/);
  }
  assert.equal(writes,0,'inspection never issues model or execution commands');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});







test('NU01: new analysis clears the old selected-file notice when it clears its draft materials',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;}};let dispose,input,writes=0;
 const element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){},click(){}});
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const click=dataset=>listeners.click({target:{closest:()=>({type:'button',dataset})}});
 try{
  globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:n=>{const x=element();if(n==='input')input=x;return x;},head:{append(){}},body:{append(){}}};
  globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
  globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;return new Response(JSON.stringify(path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
  await startQuickWorkspace({control:'owned'});click({action:'files'});await settle();
  input.files=[{name:'合成订单.csv',size:4,arrayBuffer:async()=>new TextEncoder().encode('A\n1\n').buffer}];input.onchange();await settle();
  assert.match(app.innerHTML,/已选定 合成订单.csv/);click({action:'new'});await settle();
  assert.doesNotMatch(app.innerHTML,/已选定 合成订单.csv/,'an empty new draft must not claim the prior file is selected');
  assert.match(app.innerHTML,/今天，想弄清什么/);assert.equal(writes,0,'resetting a draft never starts a model or carries a material grant');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});








test('UX61: saved source cards expand bounded real sheet rows, escape cells, never expose the eleventh row',()=>{
 const rows=[{cells:[{column:'A',value:'金额'}]},...Array.from({length:30},(_,i)=>({cells:[{column:'A',value:i===0?'<script>bad</script>':i===10?'hidden-eleventh':String(i)}]}))];
 const task={identity:{task_id:'preview',revision:'1'},question:'预览',state:'ready',source:{sources:[{source_id:'source',display_name:'订单.csv',sheets:[{name:'CSV',state:'visible',rows,full_data_rows:30}]}]}};
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
 const listeners={},elements=[],app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;},querySelector:()=>({focus(){}})};let dispose,writes=0;
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 try{
 globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:()=>{const e={value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;},head:{append(){}},body:{append(){}}};
 globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;return new Response(JSON.stringify(path==='/v1/projects'?{projects:[]}:path.endsWith('/metric-assets')?{project_id:'synthetic',candidates:[],current:null}:path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
 await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{action:'project'}})}});await settle();await elements.find(e=>e.textContent==='分析口径').onclick();await settle();
 listeners.change({target:{id:'asset-package',files:[{name:'1.1.0.sap.yaml'}]}});await settle();assert.match(app.innerHTML,/1\.1\.0\.sap\.yaml/);
 listeners.change({target:{id:'asset-registry',files:[{name:'index.yaml'}]}});await settle();assert.match(app.innerHTML,/index\.yaml/);assert.equal(writes,0);
 }finally{dispose?.();Object.assign(globalThis,prior);}
});


test('MFUI-03: successful project switch clears private import files and unsent draft; failed switch preserves them',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs');
 const keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const listeners={},elements=[],app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,f)=>{listeners[n]=f;},querySelector:()=>({focus(){}})};let dispose,current='first',failSwitch=true,writes=0;
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
 const action=async(name)=>{listeners.click({target:{closest:()=>({type:'button',dataset:{action:name}})}});await settle();};
 try{
 globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:()=>{const e={value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}};elements.push(e);return e;},head:{append(){}},body:{append(){}}};
 globalThis.sessionStorage={getItem:()=>null};globalThis.window={addEventListener:(_n,f)=>{dispose=f;}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'unavailable'}));}if(o?.method==='POST')writes++;if(path==='/v1/projects/select'){if(failSwitch)return new Response('{}',{status:409});current='second';return new Response(JSON.stringify({control:'owned-second',project:{project_id:'second',display_name:'项目二'}}));}return new Response(JSON.stringify(path==='/v1/projects'?{current,projects:[{project_id:'first',display_name:'项目一'},{project_id:'second',display_name:'项目二'}]}:path.endsWith('/metric-assets')?{project_id:current,candidates:[],current:null}:path.endsWith('/methods')?{skills:[],prompts:[]}:[]));};
 await startQuickWorkspace({control:'owned',service:true});await action('project');await elements.find(e=>e.textContent==='分析口径').onclick();await settle();
 listeners.change({target:{id:'asset-package',files:[{name:'first-private.sap.yaml'}]}});listeners.change({target:{id:'asset-registry',files:[{name:'first-private-index.yaml'}]}});listeners.input({target:{id:'analysis-message',style:{},scrollHeight:60,value:'项目一未发送的私有需求'}});await settle();
 await action('project');await elements.filter(e=>e.textContent==='项目二').at(-1).onclick();await settle();assert.match(app.innerHTML,/first-private\.sap\.yaml/,'failed switch must retain selected files');
 failSwitch=false;await action('project');await elements.filter(e=>e.textContent==='项目二').at(-1).onclick();await settle();assert.doesNotMatch(app.innerHTML,/项目一未发送的私有需求|项目暂时不能切换/,'new project must not inherit old draft or notice');
 await action('project');await elements.filter(e=>e.textContent==='分析口径').at(-1).onclick();await settle();assert.doesNotMatch(app.innerHTML,/first-private/,'new project must not inherit old import file selection');assert.equal(writes,2,'only explicit project switch attempts issue writes');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});





test('CW01-06: a ready requirements Task with an accepted reply pending keeps passive polling until the actual durable receipt',async()=>{
 const {startQuickWorkspace}=await import('../../../apps/browser/quick-analysis-client.mjs'),keys=['document','window','sessionStorage','fetch','setInterval','clearInterval'],prior=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 const id=crypto.randomUUID(),command_id=crypto.randomUUID(),listeners={},app={dataset:{},querySelectorAll:()=>[],querySelector:()=>null,innerHTML:'',addEventListener:(n,fn)=>{listeners[n]=fn;}},element=()=>({value:'',append(){},replaceChildren(){},setAttribute(){},addEventListener(){},showModal(){},close(){}});let poll,dispose,reads=0,writes=0;
 const pending={task_id:id,command_id,kind:'requirement-discussion',expected_sequence:0},storage=new Map([['juanerai.open.pending.v1',JSON.stringify(pending)]]),task={identity:{task_id:id,revision:'1'},entry_mode:'requirements',question:'一起讨论',state:'ready',source:{sources:[]}};
 const settle=async()=>{for(let i=0;i<20;i++)await new Promise(setImmediate);};
 try{globalThis.document={querySelector:()=>null,getElementById:()=>app,createElement:element,head:{append(){}},body:{append(){}}};globalThis.window={addEventListener:(_n,fn)=>{dispose=fn;}};globalThis.sessionStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};globalThis.setInterval=fn=>{poll=fn;return 1;};globalThis.clearInterval=()=>{};
 globalThis.fetch=async(path,o)=>{if(path.endsWith('/session-control')){assert.equal(JSON.parse(o.body).command.kind,'snapshot');return new Response(JSON.stringify({availability:'busy'}));}if(o?.method==='POST')writes++;let value;if(path.endsWith('/methods'))value={skills:[],prompts:[]};else if(path==='/v1/open-analysis'){reads++;value=[task];}else if(path.endsWith('/collaboration')||path.endsWith('/requests'))value=[];else value=task;return new Response(JSON.stringify(value));};
 await startQuickWorkspace({control:'owned'});listeners.click({target:{closest:()=>({type:'button',dataset:{task:id}})}});await settle();const before=reads;
 task.requirement_draft={revision:1,sequence:1,receipts:[{command_id,sequence:1}],content:{version:'2.0',text:'已保存的自然回复'},history:[],conversation:[{command_id,sequence:1,user:{classification:'USER_SAID',text:'一起讨论'},assistant:{classification:'MODEL_PROPOSAL',text:'已保存的自然回复'}}]};poll();await settle();
 assert.ok(reads>before,'ready is not proof that a requirements reply has finished');assert.match(app.innerHTML,/已保存的自然回复/);assert.equal(storage.has('juanerai.open.pending.v1'),false);assert.equal(writes,0,'passive reads never resubmit a Provider-producing operation');
 }finally{dispose?.();Object.assign(globalThis,prior);}
});
