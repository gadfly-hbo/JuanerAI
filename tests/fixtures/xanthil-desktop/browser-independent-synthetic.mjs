/** Fixed host-only credential and in-memory Provider boundary. No product result substitution. */
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {Socket} from 'node:net';
import {fixedPayload} from './preparation-isolation-payloads.mjs';
import {browserBindingFixture} from './browser-sources.ts';
const root=dirname(process.env.JUANERAI_DESKTOP_DEV_ROOT);
assert.ok(root.endsWith('/run-001'));
const watchdog=setTimeout(()=>{process.kill(process.pid,'SIGTERM');setTimeout(()=>process.kill(process.pid,'SIGKILL'),5000).unref();},Math.max(1,JSON.parse(readFileSync(join(root,'host-deadline.json'))).expires-Date.now()));watchdog.unref();
const path=join(root,'synthetic-readback.json');
let state=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{reads:0,saves:0,deletes:0,probes:0,calls:0,payloads:[],configured:false};
const save=()=>writeFileSync(path,JSON.stringify(state,null,2));save();writeFileSync(join(root,'service-pid.json'),JSON.stringify({pid:process.pid}));
const connect=Socket.prototype.connect;Socket.prototype.connect=function(...args){const v=Array.isArray(args[0])?args[0][0]:args[0],host=typeof v==='object'?v.host:args[1];assert.ok(['127.0.0.1','localhost','::1'].includes(host),'only owned loopback');return connect.apply(this,args);};
export function createMacOsCredentialStore(){return {async read(){state.reads++;save();return state.configured?{status:'found',key:'synthetic-web-key-0001'}:{status:'absent'};},async save(key){assert.equal(key,'synthetic-web-key-0001');state.configured=true;state.saves++;save();},async delete(){state.configured=false;state.deletes++;save();}};}
globalThis.fetch=async(url,request)=>{
 assert.equal(String(url),'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');
 const body=JSON.parse(request.body),content=body.messages.find(m=>m.role==='user').content;
 let text;
 if(content==='Reply with OK.'){state.probes++;assert.equal(state.probes,1);text='OK.';}
 else{
  const payload=JSON.parse(content);state.payloads.push(payload);state.calls++;save();if(root.includes('/browser-independent-unknown-host-')){assert.equal(state.calls,1,'UNKNOWN must not redispatch');return new Promise(()=>{});}assert.ok(state.calls<=3);
  let result;if(state.calls===1){assert.equal(payload.stage,'generate_preparation');result={kind:'question',text:'paid表示什么有效状态？'};}
  else if(state.calls===2){assert.equal(payload.stage,'generate_preparation');assert.deepEqual(payload.clarifications.map(c=>c.reply),['paid表示已支付']);result={kind:'preparation',bindings:browserBindingFixture(payload.structure),code:fixedPayload('health'),analysis:{currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},period_evidence:'2026-01-01至2026-01-29与2026-02-01至2026-03-01',statuses:[{value:'paid',meaning:'已支付',evidence:'paid表示已支付'}]}};}
  else{assert.equal(payload.stage,'explain');assert.equal(payload.verification.status,'verified');assert.deepEqual(payload.structure,[]);assert.equal(payload.selected_text,null);result={kind:'report',text:'两期总体复购率持平。总体计算已独立核验，尚不能据此判断原因或策略有效。'};}
  text=JSON.stringify(result);
 }
 save();const chunk={id:'synthetic-independent-web',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:12,total_tokens:32}};
 return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
};
