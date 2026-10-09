import assert from 'node:assert/strict';
import test from 'node:test';
import * as views from '../../../apps/browser/workspace.mjs';

// Minimal DOM double keeps the mounted analysis and account panel independent.
function panel(){let html='',nodes={};return {get innerHTML(){return html;},set innerHTML(value){html=value;nodes={};},querySelector(selector){if(!html.includes('id="'+selector.slice(1)+'"'))return null;return nodes[selector]??={value:'',focus(){}};},querySelectorAll(){return [];}};}
function serviceDom(){const account=panel(),analysis=panel(),notice=panel();let html='',nodes={};const app={get innerHTML(){return html+account.innerHTML+analysis.innerHTML+notice.innerHTML;},set innerHTML(value){html=value;nodes={};account.innerHTML='';analysis.innerHTML='';},querySelector(s){if(s==='#service-notice')return notice;if(s==='#account-panel')return account;if(s==='#analysis-workbench')return analysis;if(!html.includes('id="'+s.slice(1)+'"'))return account.querySelector(s)??analysis.querySelector(s);return nodes[s]??={value:'',focus(){}};},querySelectorAll(){return [];}};return app;}
test('BF-R01/11: service page offers projects and existing settings without reading credentials on load',async()=>{
 assert.equal(typeof views.startServiceWorkspace,'function');
 const original={document:globalThis.document,fetch:globalThis.fetch};let nodes={},html='',calls=[];
 const app=serviceDom();
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.fetch=async(path,options)=>{calls.push({path,options});return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:null}:path==='/v1/settings'?{ok:true,value:{configured:false,state:'unconfigured',busy:false}}:{generation:0}));};
  await views.startServiceWorkspace({control:null});assert.match(app.innerHTML,/新建项目/);assert.match(app.innerHTML,/你的分析工作台/);assert.doesNotMatch(app.innerHTML,/读取本机配置|测试连接|保存并启用/);assert.doesNotMatch(app.innerHTML,/type="file"/);assert.equal(calls.some(c=>c.options?.method==='POST'),false);
  app.querySelector('#project-name').value='保留输入';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);const submitted=calls.find(c=>c.path==='/v1/projects/select');assert.equal(JSON.parse(submitted.options.body).name,'保留输入','capture input before busy rendering');
 }finally{Object.assign(globalThis,original);}
});

test('BF-R08: uncertain project creation cannot create another project before exact readback',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};let nodes={},posts=0,html='';const stored=new Map();
 const app=serviceDom();
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};globalThis.fetch=async(path,options)=>{if(path==='/v1/projects/select'){posts++;throw Error('lost response');}if(path.startsWith('/v1/projects/commands/'))return new Response('null');return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:null}:path==='/v1/settings'?{ok:true,value:{configured:false}}:{generation:0}));};
  await views.startServiceWorkspace({control:null});app.querySelector('#project-name').value='one';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);
  app.querySelector('#project-name').value='two';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(posts,1);assert.match(app.innerHTML,/尚未确认/);
  await views.startServiceWorkspace({control:null});app.querySelector('#project-name').value='three';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(posts,1,'refresh cannot discard pending creation');
  app.querySelector('#service-refresh').onclick();await new Promise(setImmediate);await new Promise(setImmediate);assert.equal(posts,1);assert.equal(stored.size,1,'unknown response plus null receipt remains uncertain');assert.match(app.innerHTML,/尚未确认/);
 }finally{Object.assign(globalThis,original);}
});

test('BF-R08: superseded selection reads its saved receipt without retaining control or resending',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};let nodes={},html='',posts=0,receiptReads=0;
 const stored=new Map(),project_id=crypto.randomUUID();
 const app=serviceDom();
 try{
  globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
  globalThis.fetch=async(path,options)=>{
   if(path==='/v1/projects/select'){posts++;return new Response('{}',{status:403});}
   if(path.startsWith('/v1/projects/commands/')){receiptReads++;return new Response(JSON.stringify({project_id}));}
   return new Response(JSON.stringify(path==='/v1/projects'?{projects:[{project_id,display_name:'Saved'}],current:project_id}:path==='/v1/settings'?{ok:true,value:{configured:false}}:{generation:2,owned:true}));
  };
  await views.startServiceWorkspace({control:'old-control'});app.querySelector('#project-name').value='Saved';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);
  assert.match(app.innerHTML,/本页只读/,'403 must discard stale control in the visible service client');assert.match(app.innerHTML,/尚未确认/);assert.equal(posts,1);
  app.querySelector('#service-refresh').onclick();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(receiptReads,1);assert.equal(posts,1);assert.equal(stored.size,0);assert.match(app.innerHTML,/已读回保存项目/);assert.match(app.innerHTML,/本页只读/);
 }finally{Object.assign(globalThis,original);}
});

test('BF-UI01/06: explicit project entry refreshes saved local access before policy without a model test',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};let nodes={},html='',calls=[];
 const app=serviceDom();
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
 globalThis.fetch=async(path,options)=>{calls.push({path,options});return new Response(JSON.stringify(path==='/v1/projects'?{projects:[{project_id:'p',display_name:'会员分析'}],current:'p'}:path==='/v1/projects/select'?{control:'owned'}:path==='/v1/settings'?{ok:true,value:{configured:true,state:'ready'}}:path==='/v1/tasks'?{tasks:[]}:path==='/v1/model-policy'?{available:true,sha256:'policy',policy:{model:'test'}}:{generation:0}));};
 await views.startServiceWorkspace({control:'owned'});assert.equal(calls.some(c=>c.options.method==='POST'),false);
 app.querySelector('#entry-question').value='打开项目之前的问题';app.querySelector('#entry-question').oninput();await app.querySelector('#current-project').onclick();await new Promise(setImmediate);assert.equal(app.querySelector('#question').value,'打开项目之前的问题');
 const refreshIndex=calls.findIndex(c=>c.path==='/v1/settings'&&c.options.method==='POST');const policyIndex=calls.findIndex(c=>c.path==='/v1/model-policy');
 assert.ok(refreshIndex>=0,'deliberate entry must refresh saved access');assert.ok(policyIndex>refreshIndex);assert.deepEqual(JSON.parse(calls[refreshIndex].options.body),{operation:'refresh'});assert.equal(calls[refreshIndex].options.headers['x-xanthil-control'],'owned');assert.equal(calls.some(c=>c.options.body&&JSON.parse(c.options.body).operation==='test'),false);
 }finally{Object.assign(globalThis,original);}
});

test('BF-UI01/06: first-use enable is one explicit action, preserves the question and hides after save',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};const app=serviceDom(),calls=[];let configured=false;
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};
 globalThis.fetch=async(path,options)=>{const body=options.body?JSON.parse(options.body):null;calls.push({path,body});if(body?.operation==='save')configured=true;return new Response(JSON.stringify(path==='/v1/projects'?{projects:[{project_id:'p',display_name:'会员分析'}],current:'p'}:path==='/v1/settings'?body?.operation==='test'?{ok:true,proof:'synthetic-proof'}:{ok:true,value:{configured,state:configured?'ready':'unconfigured'}}:path==='/v1/tasks'?{tasks:[]}:path==='/v1/model-policy'?{available:configured,sha256:'policy',policy:{model:'test'}}:{generation:0}));};
 await views.startServiceWorkspace({control:'owned'});await app.querySelector('#current-project').onclick();
 assert.match(app.innerHTML,/只需设置一次/);assert.doesNotMatch(app.innerHTML,/读取本机配置|测试连接|保存并启用/);assert.equal(calls.some(c=>c.body?.operation==='test'),false);
 const question=app.querySelector('#question');question.value='会员为什么没有再次购买？';question.oninput();
 app.querySelector('#provider-api-key').value='synthetic-only-not-a-real-key';await app.querySelector('#enable-ai').onsubmit({preventDefault(){}});
 assert.deepEqual(calls.filter(c=>['test','save'].includes(c.body?.operation)).map(c=>c.body.operation),['test','save']);assert.equal(calls.find(c=>c.body?.operation==='save').body.proof,'synthetic-proof');
 assert.doesNotMatch(app.innerHTML,/id="provider-api-key"/);assert.match(app.innerHTML,/会员为什么没有再次购买？/);assert.doesNotMatch(app.innerHTML,/synthetic-only-not-a-real-key/);assert.equal(calls.some(c=>c.path.includes('model-authorization')),false);
 }finally{Object.assign(globalThis,original);}
});

test('BF-UI01/06: failed enable never saves, exposes no raw failure and keeps local work',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};const app=serviceDom(),posts=[];
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};globalThis.fetch=async(path,options)=>{const body=options.body?JSON.parse(options.body):null;if(body)posts.push(body);return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:'p'}:path==='/v1/settings'?body?.operation==='test'?{ok:false,code:'KEYCHAIN_UNAVAILABLE'}:{ok:true,value:{configured:false}}:path==='/v1/tasks'?{tasks:[]}:path==='/v1/model-policy'?{available:false,sha256:'policy',policy:{model:'test'}}:{generation:0}));};
 await views.startServiceWorkspace({control:'owned'});await app.querySelector('#current-project').onclick();app.querySelector('#provider-api-key').value='synthetic-test-value';await app.querySelector('#enable-ai').onsubmit({preventDefault(){}});
 assert.equal(posts.some(p=>p.operation==='save'),false);assert.match(app.innerHTML,/请解锁系统钥匙串后再试/);assert.doesNotMatch(app.innerHTML,/KEYCHAIN_UNAVAILABLE|synthetic-test-value/);assert.ok(app.querySelector('#question'));
 }finally{Object.assign(globalThis,original);}
});

test('BF-UI05: opening read-only workbench cannot refresh credentials or probe provider',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};const app=serviceDom(),posts=[];
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:()=>null};globalThis.fetch=async(path,options)=>{if(options.body)posts.push(JSON.parse(options.body));return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:'p'}:path==='/v1/settings'?{ok:true,value:{configured:false}}:path==='/v1/tasks'?{tasks:[]}:path==='/v1/model-policy'?{available:false,sha256:'policy',policy:{model:'test'}}:{generation:1,owned:true}));};await views.startServiceWorkspace({control:null});await app.querySelector('#current-project').onclick();assert.equal(posts.length,0);assert.match(app.innerHTML,/本页只读/);assert.doesNotMatch(app.innerHTML,/id="provider-api-key"/);
 }finally{Object.assign(globalThis,original);}
});
