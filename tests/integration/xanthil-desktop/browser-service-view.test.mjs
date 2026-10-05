import assert from 'node:assert/strict';
import test from 'node:test';
import * as views from '../../../apps/browser/workspace.mjs';

test('BF-R01/11: service page offers projects and existing settings without reading credentials on load',async()=>{
 assert.equal(typeof views.startServiceWorkspace,'function');
 const original={document:globalThis.document,fetch:globalThis.fetch};let nodes={},html='',calls=[];
 const app={set innerHTML(value){html=value;nodes={};},get innerHTML(){return html;},querySelector:s=>nodes[s]??={value:''},querySelectorAll:()=>[]};
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.fetch=async(path,options)=>{calls.push({path,options});return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:null}:path==='/v1/settings'?{ok:true,value:{configured:false,state:'unconfigured',busy:false}}:{generation:0}));};
  await views.startServiceWorkspace({control:null});assert.match(html,/新建项目/);assert.match(html,/模型接入/);assert.doesNotMatch(html,/type="file"/);assert.equal(calls.some(c=>c.options?.method==='POST'),false);
  app.querySelector('#project-name').value='保留输入';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);const submitted=calls.find(c=>c.path==='/v1/projects/select');assert.equal(JSON.parse(submitted.options.body).name,'保留输入','capture input before busy rendering');
 }finally{Object.assign(globalThis,original);}
});

test('BF-R08: uncertain project creation cannot create another project before exact readback',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};let nodes={},posts=0,html='';const stored=new Map();
 const app={set innerHTML(value){html=value;nodes={};},querySelector:s=>nodes[s]??={value:''},querySelectorAll:()=>[]};
 try{globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};globalThis.fetch=async(path,options)=>{if(path==='/v1/projects/select'){posts++;throw Error('lost response');}if(path.startsWith('/v1/projects/commands/'))return new Response('null');return new Response(JSON.stringify(path==='/v1/projects'?{projects:[],current:null}:path==='/v1/settings'?{ok:true,value:{configured:false}}:{generation:0}));};
  await views.startServiceWorkspace({control:null});app.querySelector('#project-name').value='one';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);
  app.querySelector('#project-name').value='two';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(posts,1);assert.match(html,/尚未确认/);
  await views.startServiceWorkspace({control:null});app.querySelector('#project-name').value='three';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(posts,1,'refresh cannot discard pending creation');
  app.querySelector('#service-refresh').onclick();await new Promise(setImmediate);await new Promise(setImmediate);assert.equal(posts,1);assert.equal(stored.size,1,'unknown response plus null receipt remains uncertain');assert.match(html,/尚未确认/);
 }finally{Object.assign(globalThis,original);}
});

test('BF-R08: superseded selection reads its saved receipt without retaining control or resending',async()=>{
 const original={document:globalThis.document,fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage};let nodes={},html='',posts=0,receiptReads=0;
 const stored=new Map(),project_id=crypto.randomUUID();
 const app={set innerHTML(value){html=value;nodes={};},querySelector:s=>nodes[s]??={value:''},querySelectorAll:()=>[]};
 try{
  globalThis.document={head:{append(){}},createElement:()=>({}),getElementById:()=>app};globalThis.sessionStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
  globalThis.fetch=async(path,options)=>{
   if(path==='/v1/projects/select'){posts++;return new Response('{}',{status:403});}
   if(path.startsWith('/v1/projects/commands/')){receiptReads++;return new Response(JSON.stringify({project_id}));}
   return new Response(JSON.stringify(path==='/v1/projects'?{projects:[{project_id,display_name:'Saved'}],current:project_id}:path==='/v1/settings'?{ok:true,value:{configured:false}}:{generation:2,owned:true}));
  };
  await views.startServiceWorkspace({control:'old-control'});app.querySelector('#project-name').value='Saved';app.querySelector('#project-create').onsubmit({preventDefault(){}});await new Promise(setImmediate);
  assert.match(html,/本页只读/,'403 must discard stale control in the visible service client');assert.match(html,/尚未确认/);assert.equal(posts,1);
  app.querySelector('#service-refresh').onclick();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(receiptReads,1);assert.equal(posts,1);assert.equal(stored.size,0);assert.match(html,/已读回保存项目/);assert.match(html,/本页只读/);
 }finally{Object.assign(globalThis,original);}
});
