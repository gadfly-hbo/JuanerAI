import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchBrowserClient} from '../../../apps/browser/deep-research-client.mjs';

test('DR R01/R05 F004-03: delayed save presentation remains with its originating task',async t=>{
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.textContent='';this.value='0';this.src='';this.isConnected=true;}
  append(...nodes){for(const n of nodes){if(typeof n==='object')n.parent=this;this.children.push(n);}}
  setAttribute(){}focus(){}cloneNode(){return new Element(this.tagName);}
  replaceWith(n){const p=this.parent,i=p.children.indexOf(this);p.children[i]=n;n.parent=p;this.isConnected=false;}
  replaceChildren(...nodes){for(const n of this.children)n.isConnected=false;this.children=[];this.append(...nodes);}
  querySelector(){return this.children.find(n=>n.dataset?.deepResearch);}
 }
 const old={document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch},bar=new Element('header'),app=new Element('main'),body=new Element('body'),storage=new Map();
 globalThis.document={head:new Element('head'),body,createElement:tag=>new Element(tag),getElementById:()=>app,querySelector:s=>s==='#app .topbar'?bar:bar.querySelector(),activeElement:null};
 globalThis.sessionStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 t.after(()=>{for(const [k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;});
 let current={projectId:'host-project',taskId:'A',title:'A'},release,entered;const waiting=new Promise(r=>{entered=r;}),result=new Promise(r=>{release=r;});const saves=[];
 globalThis.fetch=async path=>{let value;if(path.endsWith('/open'))value={url:'http://127.0.0.1:12345/#'+'a'.repeat(64)};else if(path.endsWith('/state'))value={unknown:false};else if(path.endsWith('/published'))value=[{projectId:'p-fixed',runId:'run',version:1}];else if(path.endsWith('/copies'))value=[];else if(path.includes('/receipts/'))value=null;else if(path.endsWith('/save')){saves.push(path);entered();value=await result;}else assert.fail(path);return {ok:true,json:async()=>value};};
 const client=createResearchBrowserClient({control:()=> 'current',context:()=>current});client.decorate();await client.open();const panelA=body.children[0],buttons=panelA.children[0].children,refresh=buttons.find(n=>n.textContent==='查询状态与版本'),save=buttons.find(n=>n.textContent==='保存所选版本到原任务');await refresh.onclick();const saving=save.onclick();await waiting;
 buttons[0].onclick();current={...current,taskId:'B',title:'B'};bar.replaceChildren();client.decorate();const entryB=bar.querySelector();await client.open();
 release({version:1,limitations:['synthetic'],bytes:123});await saving;
 assert.deepEqual(saves,['/v1/deep-research/projects/host-project/tasks/A/save']);assert.equal(entryB.textContent,'深度研究');assert.match(buttons.at(-1).textContent,/已保存 v1/);
 const panelB=body.children[1];assert.doesNotMatch(panelB.children[0].children.at(-1).textContent,/已保存/);panelB.children[0].children[0].onclick();current={...current,taskId:'A',title:'A'};bar.replaceChildren();client.decorate();await client.open();assert.equal(panelA.hidden,false);assert.match(buttons.at(-1).textContent,/已保存 v1/);
});
