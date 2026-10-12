/** Host-only native selection/browser and memory transport; no product outcome substitution. */
import native from 'electron';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Socket} from 'node:net';
import {fixedPayload} from './preparation-isolation-payloads.mjs';
import {browserBindingFixture} from './browser-sources.ts';
const root=process.env.JUANERAI_COMPANION_SYNTHETIC_ROOT;
assert.ok(root&&resolve(root)===root&&root.endsWith('/run-001'));
for(const name of ['userData','cache','logs'])mkdirSync(join(root,name),{recursive:true,mode:0o700});
native.app.setName('Xanthil bounded synthetic companion');
native.app.setPath('userData',join(root,'userData'));
native.app.setPath('sessionData',join(root,'cache'));
native.app.setAppLogsPath(join(root,'logs'));
const connect=Socket.prototype.connect;
Socket.prototype.connect=function(...args){const first=args[0];const options=Array.isArray(first)?first[0]:first;const host=typeof options==='object'?options?.host:typeof args[1]==='string'?args[1]:undefined;assert.ok(host==='127.0.0.1'||host==='localhost'||host==='::1','Only owned loopback transport allowed');return connect.apply(this,args);};
let calls=0,reopenAttempts=0;const payloads=[];if(process.env.JUANERAI_COMPANION_SYNTHETIC_REOPEN==='1')writeFileSync(join(root,'reopen-transport-attempts.json'),JSON.stringify({attempts:0}),{flag:'wx'});
globalThis.fetch=async(url,request)=>{
 if(process.env.JUANERAI_COMPANION_SYNTHETIC_REOPEN==='1')writeFileSync(join(root,'reopen-transport-attempts.json'),JSON.stringify({attempts:++reopenAttempts}));
 assert.equal(String(url),'https://token-plan-cn.xiaomimimo.com/v1/chat/completions','Unexpected model endpoint');
 assert.notEqual(process.env.JUANERAI_COMPANION_SYNTHETIC_REOPEN,'1','reopen must not dispatch');const payload=JSON.parse(JSON.parse(request.body).messages.find(m=>m.role==='user').content);payloads.push(payload);calls++;assert.ok(calls<=3);
 if(process.env.JUANERAI_COMPANION_SYNTHETIC_HOLD==='1'){writeFileSync(join(root,'synthetic-model-readback.json'),JSON.stringify({calls,payloads},null,2));return new Promise(()=>{});}
 let output;
 if(calls===1){assert.equal(payload.stage,'generate_preparation');output={kind:'question',text:'paid表示什么有效状态？'};}
 else if(calls===2){assert.equal(payload.stage,'generate_preparation');assert.deepEqual(payload.clarifications.map(c=>c.reply),['paid表示已支付']);output={kind:'preparation',bindings:browserBindingFixture(payload.structure),code:fixedPayload('health'),analysis:{currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},period_evidence:'2026-01-01至2026-01-29与2026-02-01至2026-03-01',statuses:[{value:'paid',meaning:'已支付',evidence:'paid表示已支付'}]}};}
 else {assert.equal(payload.stage,'explain');assert.equal(payload.verification.status,'verified');assert.deepEqual(payload.structure,[]);assert.equal(payload.selected_text,null);output={kind:'report',text:'两期总体复购率持平。总体计算已独立核验，尚不能据此判断原因或策略有效。'};}
 writeFileSync(join(root,'synthetic-model-readback.json'),JSON.stringify({calls,payloads},null,2));
 const chunk={id:'synthetic-browser-'+calls,object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(output)},finish_reason:'stop'}],usage:{prompt_tokens:20,completion_tokens:12,total_tokens:32}};
 return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
};
export const app=native.app,BrowserWindow=native.BrowserWindow,ipcMain=native.ipcMain,Menu=native.Menu;
export const dialog={...native.dialog,async showOpenDialog(){return {canceled:false,filePaths:[join(root,'project')]};},async showSaveDialog(){return {canceled:false,filePath:join(root,'project')};},async showMessageBox(options){writeFileSync(join(root,'native-dialog.json'),JSON.stringify({message:options.message}));return {response:process.env.JUANERAI_COMPANION_SYNTHETIC_REOPEN==='1'?1:0};}};
export const shell={...native.shell,async openExternal(url){const target=new URL(url);assert.equal(target.hostname,'127.0.0.1');assert.equal(target.protocol,'http:');writeFileSync(join(root,'origin.json'),JSON.stringify({origin:target.origin}));const window=new BrowserWindow({width:1280,height:1000,show:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});window.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));window.webContents.session.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(target.origin+'/')&&!details.url.startsWith('blob:'+target.origin+'/')&&!details.url.startsWith('data:')}));window.webContents.session.on('will-download',(_event,item)=>{item.setSavePath(join(root,'downloaded-report.html'));});await window.loadURL(url);}};
export function createMacOsCredentialStore(){return {async read(){return {status:'found',key:'synthetic-non-secret-companion-key-0001'};},async save(){assert.fail('credential write forbidden');},async delete(){assert.fail('credential delete forbidden');}};}
