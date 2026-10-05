import assert from 'node:assert/strict';
import test from 'node:test';
import {startWorkspace} from '../../../apps/browser/workspace.mjs';
test('BF-R04 UI03: rendered template identifies inspected rows including headers',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const node={},app={innerHTML:'',querySelector:()=>node,querySelectorAll:()=>[]};
 try{
  globalThis.document={createElement:()=>({}),head:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
  globalThis.fetch=async path=>new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:false,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:{id:'source',sources:[{display_name:'订单.xlsx',format:'xlsx',sheets:[{name:'比较期',row_count:3},{name:'本期',row_count:3}]}]},material_grant:null,task:{status:'idle',reviews:[]},case:{project:{display_name:'合成项目'},revision:{state:'Draft'},reports:[{finding_id:'finding',review_content:{markdown_text:'saved report'}}],findings:[{finding_id:'finding',metrics:JSON.stringify({periods:{comparison:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'2000'},current:{active_member_count:'2',repeat_member_count:'1',repurchase_rate:{numerator:'1',denominator:'2'},repeat_revenue_fen:'3000'}}})}]},operations:{totals:{calls:'0',local_runs:'2',unresolved:0}}}));
  await startWorkspace({control:'memory'});assert.match(app.innerHTML,/比较期 · 已读取 3 行（含表头）/);assert.match(app.innerHTML,/本期 · 已读取 3 行（含表头）/);assert.ok(app.innerHTML.includes("<th>复购率（精确分数）</th><td>1/2</td><td>1/2</td>"));assert.match(app.innerHTML,/本地执行（准备与计算） 2 次/);
 }finally{Object.assign(globalThis,original);}
});

test('BF-R04/06/09: upload, clarification and human fields survive synchronous busy render',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 try{for(const kind of ['upload','clarification','review']){
  let nodes={};const posted=[],app={set innerHTML(_html){nodes={};},querySelector:s=>nodes[s]??={value:'',files:[]},querySelectorAll:()=>[]};
  const review={id:'review',sequence:1,sha256:'review-hash',intent_id:'review-intent',fields:{actor:'',questions:'',closure:{insufficient_reason:'',disposition:'saved'}}};
  globalThis.document={createElement:()=>({}),head:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
  globalThis.fetch=async(path,options)=>{if(options?.method==='POST'){posted.push(JSON.parse(options.body));return new Response('{}');}return new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:true,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:{id:'source',sources:[]},material_grant:null,model:{current:true,answerable:true,execution_id:'execution',question:'需要补充'},task:{task_id:'task',epoch:0,row_version:1,status:'idle',reviews:kind==='review'?[review]:[]},case:{project:{display_name:'合成项目'},revision:{state:kind==='review'?'Review':'Draft'},reports:kind==='review'?[{report_id:'report',state:'draft'}]:[],findings:[]},operations:{totals:{calls:'0',local_runs:'0',unresolved:0}}}));};
  await startWorkspace({control:'memory'});
  if(kind==='upload'){app.querySelector('#files').files=[{name:'synthetic.csv',size:4,async arrayBuffer(){return new Uint8Array([97,10,49,10]).buffer;}}];app.querySelector('#files').onchange();}
  else if(kind==='clarification'){app.querySelector('#clarification-reply').value='paid表示已支付';app.querySelector('#clarification-form').onsubmit({preventDefault(){}});}
  else{app.querySelector('#review-actor').value='合成审阅人';app.querySelector('#review-reason').value='只闭合描述性分析';app.querySelector('#review-questions').value='继续调查原因';app.querySelector('#review-form').onsubmit({preventDefault(){},submitter:{value:'analysis'}});}
  await new Promise(setImmediate);await new Promise(setImmediate);
  if(kind==='upload'){assert.equal(posted.length,1);assert.equal(posted[0].sources[0].display_name,'synthetic.csv');assert.equal(posted[0].sources[0].base64,'YQoxCg==');}
  else if(kind==='clarification'){assert.equal(posted.length,1);assert.equal(posted[0].reply,'paid表示已支付');}
  else{assert.equal(posted.length,2);assert.equal(posted[0].fields.actor,'合成审阅人');assert.equal(posted[0].fields.closure.insufficient_reason,'只闭合描述性分析');assert.equal(posted[0].fields.questions,'继续调查原因');assert.equal(posted[1].outcome,'analysis');}
 }}finally{Object.assign(globalThis,original);}
});

test('BF-R10 UI08: download remains available read-only and visibly disables during pending work',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};let release;
 const pending=new Promise(resolve=>{release=resolve;}),nodes={},app={innerHTML:'',querySelector:s=>nodes[s]??={},querySelectorAll:()=>[]};
 try{
  globalThis.document={createElement:()=>({click(){},remove(){}}),head:{append(){}},body:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
  globalThis.fetch=async path=>{if(path.endsWith('/copy')){await pending;return new Response('<html>saved report</html>',{headers:{'content-type':'text/html'}});}return new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:false,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:null,material_grant:null,task:{status:'closed',reviews:[]},case:{project:{display_name:'合成项目'},revision:{state:'Completed'},reports:[{report_id:'report',state:'final'}],findings:[]},operations:{totals:{calls:'3',local_runs:'2',unresolved:0}}}));};
  await startWorkspace({control:null});assert.match(app.innerHTML,/<button id="download-report"\s*>/);const done=app.querySelector('#download-report').onclick();try{assert.match(app.innerHTML,/<button id="download-report" disabled>/);}finally{release();await done;}assert.match(app.innerHTML,/已请求下载副本，请检查浏览器下载列表；尚未确认文件已保存到磁盘。/);
 }finally{release();Object.assign(globalThis,original);}
});

test('BF-R06 D4: submit captures explicit aggregate consent before busy render rebuilds the form',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 try{for(const selected of [true,false]){
  let nodes={},posted,complete;const submitted=new Promise(resolve=>{complete=resolve;});
  const app={set innerHTML(_html){nodes={};},querySelector(selector){return nodes[selector]??=(selector.startsWith('#disclose-')?{checked:false}:{});},querySelectorAll:()=>[]};
  globalThis.document={createElement:()=>({}),head:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
  globalThis.fetch=async(path,options)=>{if(options?.method==='POST'){posted=JSON.parse(options.body);complete();return new Response('{}');}return new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:true,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:{id:'source',sources:[]},material_grant:null,task:{task_id:'task',epoch:0,row_version:1,status:'idle',reviews:[]},case:{project:{display_name:'合成项目'},revision:{state:'Draft'},reports:[],findings:[]},operations:{totals:{calls:'0',local_runs:'0',unresolved:0}}}));};
  await startWorkspace({control:'memory'});assert.equal(app.querySelector('#disclose-verified-result').checked,false,'never default consent');app.querySelector('#disclose-question').checked=true;app.querySelector('#disclose-verified-result').checked=selected;
  app.querySelector('#model-authorization').onsubmit({preventDefault(){}});await submitted;await new Promise(setImmediate);assert.equal(posted.disclose_question,true);assert.equal(posted.disclose_verified_result,selected);assert.equal(app.querySelector('#disclose-verified-result').checked,false,'busy render actually rebuilt unchecked controls');
 }}finally{Object.assign(globalThis,original);}
});

test('BF-R06/13 UI04/10: failed preparation overrides stale model-success advancement text',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch},node={},app={innerHTML:'',querySelector:()=>node,querySelectorAll:()=>[]};
 try{globalThis.document={createElement:()=>({}),head:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};globalThis.fetch=async path=>new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:true,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:null,material_grant:null,model:{current:true,status:'succeeded',answerable:false},preparation:{current:true,status:'failed',failure_code:'CONVERSION_UNQUALIFIED'},task:{status:'idle',reviews:[]},case:{project:{display_name:'合成项目'},revision:{state:'Draft'},reports:[],findings:[]},operations:{totals:{calls:'3',local_runs:'2',unresolved:0}}}));await startWorkspace({control:'memory'});assert.match(app.innerHTML,/当前：资料准备未通过核验/);assert.doesNotMatch(app.innerHTML,/模型输出已保存，继续按本地核验结果推进/);assert.match(app.innerHTML,/转换结果未通过独立核验，尚未用于计算/);assert.match(app.innerHTML,/模型调用 3 次/);
 }finally{Object.assign(globalThis,original);}
});

test('BF-R01/06/13 UI04/10: a current correction question stays visible beside failed preparation and submits exact answer',async()=>{
 const original={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 let nodes={},html='',posted;const app={get innerHTML(){return html;},set innerHTML(value){html=value;nodes={};},querySelector:s=>nodes[s]??={value:''},querySelectorAll:()=>[]};
 try{
  globalThis.document={createElement:()=>({}),head:{append(){}},getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
  globalThis.fetch=async(path,options)=>{if(options?.method==='POST'){posted=JSON.parse(options.body);return new Response('{}');}return new Response(JSON.stringify(path==='/v1/model-policy'?{sha256:'policy',available:true,policy:{model:'mimo-v2.6-pro'}}:path==='/v1/tasks'?{tasks:[{task_id:'task',question:'问题'}]}:{question:'问题',source_summary:null,material_grant:null,model:{current:true,status:'succeeded',stage:'correct_preparation',answerable:true,execution_id:'correction-question',question:'金额是否以元计？'},preparation:{current:true,status:'failed',failure_code:'CONVERSION_UNQUALIFIED'},task:{task_id:'task',epoch:0,row_version:2,status:'waiting',reviews:[]},case:{project:{display_name:'合成项目'},revision:{state:'Draft'},reports:[],findings:[]},operations:{totals:{calls:'3',local_runs:'1',unresolved:0}}}));};
  await startWorkspace({control:'memory'});assert.match(html,/金额是否以元计？/);assert.match(html,/<form id="clarification-form">/);assert.match(html,/当前：等待必要信息/);assert.match(html,/转换结果未通过独立核验/);assert.doesNotMatch(html,/模型输出已保存，继续按本地核验结果推进/);
  app.querySelector('#clarification-reply').value='金额以元计，保留原始金额';app.querySelector('#clarification-form').onsubmit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);assert.equal(posted.reply,'金额以元计，保留原始金额');assert.equal(posted.question_execution_id,'correction-question');
 }finally{Object.assign(globalThis,original);}
});
