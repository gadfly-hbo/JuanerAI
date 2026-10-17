// RS-TRIAL-CONTROL-01: actual installed SDK/executors, no real Provider or credentials.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,readdir,cp} from 'node:fs/promises';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import {randomUUID,createHash} from 'node:crypto';
const program=process.env.JUANERAI_REPORT_STUDIO_SOURCE,evidence=process.env.JUANERAI_REPORT_STUDIO_TRIAL_EVIDENCE;assert(program&&evidence&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=p=>import(pathToFileURL(join(program,p)).href);
const {SessionHost}=await load('dist/agent/session-host.js'),{MIMO_FLASH}=await load('dist/agent/model.js');
const {RuntimeFault,createPiTransport}=await load('node_modules/pi-agent-runtime/dist/index.js'),{FileBudgetStore}=await load('dist/agent/budget-store.js');
const {createTrialControl}=await import(process.env.RS_TRIAL_CONTROL_MODULE??'./trial-control.mjs');
const nativeFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('UNEXPECTED_NETWORK');};
const complete={content:[{kind:'text',text:'合成完成'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};
const call=(name,args,id=randomUUID())=>({kind:'tool',id,name,arguments:args});
const tools=(...content)=>({...complete,content,stop:'tools'});
const read=()=>call('read',{path:'materials.json'}),write=()=>call('write',{path:'late-write.txt',content:'forbidden after stop'});
async function fixture(t,replies,options={}){
 const dir=join(evidence,randomUUID());await mkdir(dir,{recursive:true});await writeFile(join(dir,'materials.json'),'[]');
 const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),requireLooks:false,...options});let count=0;
 const transport=gate.wrap(async request=>{count++;return typeof replies==='function'?replies(request,count):replies[count-1]??complete;});
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(program,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport,builtin:{authorize:async()=>true,toolObserver:gate.observer}});
 gate.attach(host);t.after(async()=>{await host.waitForIdle();await host.close();gate.dispose();await writeFile(join(dir,'observation.json'),JSON.stringify({provider_calls:0,gate:gate.summary(),wire_requests:count,usage:new FileBudgetStore(join(dir,'agent-budget.json')).usageOf(host.taskId)},null,2));});
 return {dir,gate,host,get count(){return count;}};
}
async function run(f){await f.host.send('仅合成离线控制验证');const result=await f.host.currentResult();await f.host.waitForIdle();f.gate.observeResult?.(result);return result;}
test('AC-TC3 soft read failure stops same-batch write with the installed SDK',async t=>{
 const f=await fixture(t,[tools(call('read',{path:'missing.md'}),write()),complete]);await run(f);
 await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'tool_failed');
});
test('AC-TC2 32 physical dispatches allowed; denied 33rd keeps SDK reservation',async t=>{
 const f=await fixture(t,()=>tools(read()));await run(f);assert.equal(f.count,32);assert.equal(f.gate.summary().stop.reason,'dispatch_limit');
 const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);assert.equal(usage.toolCalls,32);assert.equal(usage.modelCalls,33);assert(usage.reservedOutputTokens>0);
});
test('AC-TC2 96 tools allowed; prospective 97th whole batch rejected before write',async t=>{
 const f=await fixture(t,[tools(...Array.from({length:96},read)),tools(write())]);await run(f);
 assert.equal(f.count,2);assert.equal(f.gate.summary().executed_tools,96);assert.equal(f.gate.summary().stop.reason,'tool_limit');
 await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 const g=await fixture(t,[tools(write(),...Array.from({length:96},read))]);await run(g);assert.equal(g.gate.summary().executed_tools,0);await assert.rejects(()=>readFile(join(g.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC2 exact 1800000ms cutoff blocks late reply, using clock starting at zero',async t=>{
 let now=0,deadline;const f=await fixture(t,()=>{now=1800000;return tools(write());},{now:()=>now,timers:{set(fn,ms){assert.equal(ms,1800000);deadline=fn;return 1;},clear(){}}});
 await run(f);assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'deadline');assert.equal(typeof deadline,'function');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC2 real timer cancels physical in-flight synthetic transport; late reply cannot write',async t=>{
 let aborted=false;const f=await fixture(t,async request=>{await new Promise(resolve=>{request.signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true});});return tools(write());},{deadlineMs:40});
 await run(f);assert(aborted);assert.equal(f.gate.summary().stop.reason,'deadline');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC3 Bash nonzero, hard QA and render failure each stop same-batch write',async t=>{
 for(const first of [call('bash',{command:'exit 7'}),call('qa_deck',{}),call('render_deck',{expected_slides:2})]){
  const f=await fixture(t,[tools(first,write())]);await run(f);assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'tool_failed');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 }
});
test('AC-TC3 transport exception prevents all further dispatch and retains unknown',async t=>{
 const f=await fixture(t,()=>{throw Error('synthetic transport exception');});await run(f);assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'transport_failure');
 assert(new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId).reservedOutputTokens>0);await assert.rejects(()=>f.gate.wrap(async()=>assert.fail('no retry'))({}));
});
test('AC-TC3 original SDK name/schema/duplicate-ID failures remain failures and stop recovery',async t=>{
 for(const batch of [[write(),call('functions.read',{})],[write(),call('render_deck',{expected_slides:'bad'})],[write(),call('read',{path:'materials.json'},'same'),call('read',{path:'materials.json'},'same')]]){
  const f=await fixture(t,[tools(...batch)]);const r=await run(f);await writeFile(join(f.dir,'sdk-rejection.json'),JSON.stringify({names:batch.map(c=>c.name),reason:r.reason,status:r.status,control:f.gate.summary()}));assert.equal(r.reason,'INVALID_TOOL');assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'run_failed');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 }
});
test('AC-TC2 wrong model/provider/output rejected before physical transport',async()=>{
 const model={...MIMO_FLASH,input:['text','image']};for(const override of [{provider:'minimax-cn'},{id:'other'},{maxOutputTokens:32768},{endpoint:'https://other.invalid'},{protocol:'other'}]){
  const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),requireLooks:false});await assert.rejects(()=>gate.wrap(async()=>assert.fail('no wire'))({model:{...model,...override},signal:new AbortController().signal,messages:[]}));assert.equal(gate.summary().forwarded,0);assert.equal(gate.summary().stop.reason,'model_outside_scope');gate.dispose();
 }
});
test('AC-TC4 outline/image purpose, duplicate/third look and premature export blocked before same-batch effect',async t=>{
 for(const outside of [call('propose_outline',{pages:[{title:'x',page_type:'cover'}]}),call('look_page',{page:'page_03'}),call('export_deck',{})]){
  const f=await fixture(t,[tools(write(),outside)],{requireLooks:true});await run(f);assert(f.gate.summary().stopped);await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 }
 const f=await fixture(t,[tools(write(),call('look_page',{page:'page_01'}),call('look_page',{page:'page_01'}))],{requireLooks:true});await run(f);assert.equal(f.gate.summary().stop.reason,'look_outside_scope');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC3 user abort cancels in-flight synthetic transport; first failure remains first',async t=>{
 let entered;const ready=new Promise(r=>entered=r),f=await fixture(t,async request=>{entered();await new Promise(r=>request.signal.addEventListener('abort',r,{once:true}));throw Error('cancelled synthetic');});
 await f.host.send('合成取消');await ready;await f.host.control({kind:'abort'});const r=await f.host.currentResult();await f.host.waitForIdle();f.gate.observeResult(r);assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'cancelled');
});
const html=(title,body)=>`<!doctype html><html><meta charset="utf-8"><body style="margin:0;background:#10233f;color:white;font:32px Arial;width:1280px;height:720px"><h1>${title}</h1><p>${body}</p></body></html>`;
const deckFiles={
 'deck/pages/page_01.mjs':'// headline: 合成测试数据\nexport function buildSlide(p){const s=p.addSlide();s.addText("合成测试数据 100 120 135",{x:1,y:1,w:11,h:1,fontSize:30});s.addText("非业务事实；来源：合成验收材料",{x:1,y:3,w:11,h:1,fontSize:20});}',
 'deck/pages/page_02.mjs':'// headline: 适用边界\nexport function buildSlide(p){const s=p.addSlide();s.addText("适用边界",{x:1,y:1,w:11,h:1,fontSize:30});s.addText("仅用于工具接入诊断，不证明原因、利润、增长或业务行动。",{x:1,y:3,w:11,h:2,fontSize:20});}',
 'deck/pages/page_01.html':html('合成测试数据','100 / 120 / 135；非业务事实；来源：合成验收材料'),
 'deck/pages/page_02.html':html('适用边界','仅用于工具接入诊断，不证明原因、利润、增长或业务行动。'),
 'deck/deck.mjs':'import PptxGenJS from "pptxgenjs";import {buildSlide as one} from "./pages/page_01.mjs";import {buildSlide as two} from "./pages/page_02.mjs";const p=new PptxGenJS();p.layout="LAYOUT_WIDE";one(p);two(p);await p.writeFile({fileName:"deck/deck.pptx"});',
};
const build=()=>tools(...Object.entries(deckFiles).map(([path,content])=>call('write',{path,content})),call('render_deck',{expected_slides:2}),call('qa_deck',{}));
test('AC-TC4 actual tool JPEGs must reach next SDK model request; post-check writes stop before effect',async t=>{
 const f=await fixture(t,(_request,n)=>n===1?build():n===2?tools(call('look_page',{page:'page_01'}),call('look_page',{page:'page_02'})):tools(write()),{requireLooks:true});
 await run(f);assert.equal(f.count,3);assert.equal(f.gate.summary().images_delivered,true);assert.equal(f.gate.summary().stop.reason,'post_check_write');assert.deepEqual(f.gate.summary().look_pages,['page_01','page_02']);await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC4 missing either page prevents model completion; image metadata cannot be replaced by text',async t=>{
 const f=await fixture(t,(_r,n)=>n===1?build():n===2?tools(call('look_page',{page:'page_01'})):complete,{requireLooks:true});await run(f);assert.equal(f.gate.summary().stop.reason,'required_checks_missing');assert.equal(f.gate.summary().images_delivered,false);
});
test('AC-TC4 export format outside three formats rejected before executor',async t=>{
 const f=await fixture(t,[tools(call('export_deck',{formats:['pptx','docx']}))]);await run(f);assert.equal(f.gate.summary().executed_tools,0);assert.equal(f.gate.summary().stop.reason,'export_format');
});
test('AC-TC6 actual SDK two-page build, JPEG delivery, model export and normal UI three downloads',async t=>{
 const {startBuiltinStudio}=await load('dist/juanerai/server.js'),{createBuiltinAgentHosts}=await load('dist/agent/builtin-hosts.js');
 const {createStudioConfiguration}=await load('dist/juanerai/configuration.js'),{WorkspaceStore}=await load('dist/storage/workspace.js'),{proposeOutline}=await load('dist/agent/outline.js');
 const data=join(evidence,randomUUID()),id='proj_trial',owner='a'.repeat(64);await mkdir(data,{recursive:true});
 const {assertStudioDataVersion}=await load('dist/juanerai/version.js');await assertStudioDataVersion(data,'synthetic-018');
 const credentials={async read(){return 'synthetic-not-a-provider-key';},async save(){},async remove(){}};
 await createStudioConfiguration({dataRoot:data,credentials,canChange:async()=>true,newId:randomUUID}).save('xiaomi-token-plan-cn','synthetic-not-a-provider-key',0);
 const store=new WorkspaceStore(data);await store.createProject({project_id:id,title:'离线合成两页验收'});await proposeOutline(join(data,id),[{title:'合成测试数据',page_type:'content'},{title:'适用边界',page_type:'content'}],[]);
 const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED')});let agents,policy,physical=0,receivedImages=0,service,browser;
 t.after(async()=>{if(browser){let index=0;for(const page of browser.contexts().flatMap(c=>c.pages())){const name='last-state-'+index++;await page.screenshot({path:join(data,name+'.png'),fullPage:true}).catch(()=>{});await writeFile(join(data,name+'.html'),await page.content()).catch(()=>{});}await browser.close();}if(service)await service.ownerLost();gate.dispose();await writeFile(join(data,'trial-result.json'),JSON.stringify({provider_calls:0,gate:gate.summary(),physical,receivedImages,operations:policy?.projectOperations(id)},null,2));});
 service=await startBuiltinStudio({dataRoot:data,webDist:join(program,'web-dist'),ownerToken:owner,pluginVersion:'synthetic-018'},{credentials,createHosts(config){
  policy=config.policy;gate.bindPolicy(policy,id);
  agents=createBuiltinAgentHosts({...config,toolObserver:project=>{assert.equal(project,id);return gate.observer;},makeTransport:(model,key)=>gate.wrap(createPiTransport({model,apiKey:key,fetch:async(url,init)=>{
   assert.equal(new URL(url).origin,'https://token-plan-cn.xiaomimimo.com');const body=JSON.parse(init.body);assert.equal(body.model,'mimo-v2.6-flash');assert.equal(body.max_tokens??body.max_completion_tokens,16384);
   physical++;let next;
   if(physical===1)next=build();else if(physical===2)next=tools(call('look_page',{page:'page_01'}),call('look_page',{page:'page_02'}));
   else {receivedImages=body.messages.flatMap(m=>Array.isArray(m.content)?m.content:[]).filter(c=>c.type==='image_url').length;assert.equal(receivedImages,2);next=physical===3?tools(call('export_deck',{formats:['pptx','html','pdf']})):complete;}
   const calls=next.content.filter(c=>c.kind==='tool'),chunk={id:'synthetic',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta:calls.length?{role:'assistant',tool_calls:calls.map((c,index)=>({index,id:c.id,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}))}:{role:'assistant',content:'page_01与page_02合成检查完成'},finish_reason:calls.length?'tool_calls':'stop'}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}};
   return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
  }}))});return agents;
 }});
 const host=await agents.get(id);gate.attach(host);policy.setMode(0,true);
 assert.equal(new URL(service.origin).hostname,'127.0.0.1');const endpoint=await nativeFetch(service.origin+'/api/builtin/bridge/bootstrap',{method:'POST',redirect:'error',headers:{'x-studio-owner':owner,'content-type':'application/json'},body:'{}'});assert.equal(endpoint.status,200);const bootstrap=await endpoint.json();
 const {chromium}=await load('node_modules/playwright/index.mjs');browser=await chromium.launch();const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
 const external=[];await context.route('**/*',route=>{if(new URL(route.request().url()).origin===service.origin)return route.continue();external.push('blocked');return route.abort();});
 await page.goto(service.origin+'/?project='+id+'#bootstrap='+bootstrap.token);await page.getByRole('button',{name:/按此框架生成/}).waitFor({timeout:5000});
 const boundary=await (await page.request.get(service.origin+'/api/builtin/browser/projects/'+id+'/permissions')).json();policy.grant(id,0,{...boundary.boundary,recipients_sha256:createHash('sha256').update(JSON.stringify(boundary.recipients)).digest('hex'),materials:[],allow_prompt:true,allow_screenshots:true,allow_network:true},{recipients_sha256:createHash('sha256').update(JSON.stringify(boundary.recipients)).digest('hex'),materials:[]});
 await page.getByRole('button',{name:/按此框架生成/}).click();
 await page.getByRole('tab',{name:'成果（2 页）',exact:true}).waitFor({timeout:15000});await page.getByRole('tab',{name:'成果（2 页）',exact:true}).click();
 await page.getByRole('button',{name:'下载 PPTX',exact:true}).waitFor({timeout:15000});
 await host.currentResult();await host.waitForIdle();await new Promise(r=>setTimeout(r,30));assert.equal(gate.summary().model_complete,true,JSON.stringify(gate.summary()));assert.equal(gate.summary().stopped,false,JSON.stringify(gate.summary()));
 const exports=[];
 for(const format of ['pptx','html','pdf'])await gate.localExport(format,async()=>{
  const response=page.waitForResponse(r=>r.url()===service.origin+'/api/projects/'+id+'/export'&&r.request().method()==='POST');await page.getByRole('button',{name:'下载 '+format.toUpperCase(),exact:true}).click();const result=await response;assert.equal(result.status(),200);const value=await result.json();assert.equal(value.ok,true);const record=value.exports.find(e=>e.format===format);assert(record);await page.locator('a[href*="'+record.export_id+'"]:visible').waitFor();
  const download=page.waitForEvent('download');await page.locator('a[href*="'+record.export_id+'"]:visible').click({noWaitAfter:true});const file=await download;await file.saveAs(join(data,'download.'+format));
  const saved=JSON.parse(await readFile(join(data,id,'exports',record.export_id+'.json'),'utf8')),bytes=await readFile(join(data,'download.'+format)),original=await readFile(join(data,id,saved.artifact_path));assert(bytes.length>0);assert.deepEqual(bytes,original);assert.equal(createHash('sha256').update(bytes).digest('hex'),saved.artifact_hash);exports.push({format,bytes:bytes.length,sha256:saved.artifact_hash});await new Promise(r=>setTimeout(r,30));
 });
 assert.equal(physical,4);assert.equal(receivedImages,2);assert.equal(gate.summary().model_exports,1);assert.equal(gate.summary().main_admissions,1);assert.deepEqual(external,[]);assert(gate.summary().declarations_unchanged);
 const JSZip=(await load('node_modules/jszip/lib/index.js')).default,zip=await JSZip.loadAsync(await readFile(join(data,'download.pptx')));assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,2);
 const {extractText}=await load('node_modules/unpdf/dist/index.mjs'),pdf=await extractText(new Uint8Array(await readFile(join(data,'download.pdf'))),{mergePages:true});assert.equal(pdf.totalPages,2);assert.match(pdf.text,/100/);assert.match(pdf.text,/135/);assert.match(pdf.text.normalize('NFKC'),/适用边界/);
 const exportedHtml=await readFile(join(data,'download.html'),'utf8'),htmlPage=await context.newPage();await htmlPage.setContent(exportedHtml);assert.equal(await htmlPage.locator('section').count(),2);const exportedText=(await Promise.all(htmlPage.frames().map(frame=>frame.locator('body').innerText()))).join('\n');assert.match(exportedText,/100.*120.*135/s);assert.match(exportedText,/适用边界/);await htmlPage.close();
 gate.finishScene();
 assert(gate.summary().qa_flags.includes('digit_guard'),'synthetic advisory flag must remain disclosed, not silently erased or converted into hard failure');
 await page.screenshot({path:join(data,'ui-three-exports.png'),fullPage:true});await writeFile(join(data,'exports-readback.json'),JSON.stringify(exports,null,2));
 const ledger=JSON.parse(await readFile(join(data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(ledger.usage.modelCalls,4);assert.equal(ledger.usage.reservedOutputTokens,0);assert.equal(ledger.active,false);
});
async function policyFixture(t){
 const dir=join(evidence,randomUUID());await mkdir(dir,{recursive:true});const {createReportStudioPolicy}=await load('dist/juanerai/policy.js');
 const policy=createReportStudioPolicy({dataRoot:dir,now:()=>new Date().toISOString()}),id='proj_policy',boundary={recipients_sha256:'a'.repeat(64),materials:[]};
 policy.setMode(0,true);policy.grant(id,0,{...boundary,allow_prompt:true,allow_screenshots:true,allow_network:true},boundary);
 const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),requireLooks:false});t.after(()=>gate.dispose());
 return {dir,policy,id,boundary,gate};
}
const successful={outcome:'succeeded',physical_settled:true,usage_known:true,sdk_run_id:null};
async function completeGate(gate){await gate.wrap(async()=>complete)({model:{...MIMO_FLASH,input:['text','image']},signal:new AbortController().signal,messages:[]});}
test('AC-TC3 existing UNKNOWN is not reconciled; original admission failure also closes temporary control',async t=>{
 const f=await policyFixture(t),op=f.policy.begin(f.id,randomUUID(),'main',f.boundary);f.policy.finish(op.operation_id,{...successful,outcome:'failed',usage_known:false});const old=f.policy.operation(op.operation_id);
 f.gate.bindPolicy(f.policy,f.id);assert.throws(()=>f.policy.begin(f.id,randomUUID(),'main',f.boundary),/RS_PROJECT_PENDING/);assert.deepEqual(f.policy.operation(op.operation_id),old);assert.equal(f.gate.summary().stopped,true);
});
test('AC-TC4 only target main once; image purpose and another project denied without original effects',async t=>{
 for(const kind of ['image','other-project','second-main']){
  const f=await policyFixture(t);f.gate.bindPolicy(f.policy,f.id);
  if(kind==='second-main'){const op=f.policy.begin(f.id,randomUUID(),'main',f.boundary);f.policy.finish(op.operation_id,successful);}
  const before=f.policy.projectOperations(f.id);assert.throws(()=>f.policy.begin(kind==='other-project'?'proj_other':f.id,randomUUID(),kind==='image'?'image':'main',f.boundary));assert.deepEqual(f.policy.projectOperations(f.id),before);assert(f.gate.summary().stopped);
 }
});
test('AC-TC4 unpaired UI export and duplicate format rejected; local failure blocks following format',async t=>{
 for(const branch of ['unpaired','duplicate','failed']){
  const f=await policyFixture(t);f.gate.bindPolicy(f.policy,f.id);await completeGate(f.gate);
  if(branch==='unpaired')assert.throws(()=>f.policy.begin(f.id,randomUUID(),'export',f.boundary));
  else {
   const work=async()=>{const op=f.policy.begin(f.id,randomUUID(),'export',f.boundary);f.policy.finish(op.operation_id,{...successful,outcome:branch==='failed'?'failed':'succeeded'});};
   if(branch==='failed')await assert.rejects(()=>f.gate.localExport('pptx',work));
   else {await f.gate.localExport('pptx',work);await assert.rejects(()=>f.gate.localExport('pptx',()=>assert.fail('duplicate export must not execute')));}
  }
  assert(f.gate.summary().stopped);await assert.rejects(()=>f.gate.localExport('pdf',()=>assert.fail('no subsequent effect')));
 }
});
test('AC-TC2 cutoff remains active after model completion and blocks UI export',async()=>{
 let now=0;const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),requireLooks:false,now:()=>now,timers:{set:()=>1,clear(){}}});await completeGate(gate);now=1800000;
 await assert.rejects(()=>gate.localExport('pptx',()=>assert.fail('expired UI export')));assert.equal(gate.summary().stop.reason,'deadline');gate.dispose();
});
test('AC-TC4 two unrelated image payloads cannot satisfy the look results hash proof',async()=>{
 const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED')});
 const context={signal:new AbortController().signal,stop(){}};
 gate.observer.after({...context,name:'render_deck',args:{},outcome:{kind:'returned',value:{ok:true,slides:2}}});
 for(const page of ['page_01','page_02'])gate.observer.after({...context,name:'look_page',args:{page},outcome:{kind:'returned',value:{content:[{kind:'image',mimeType:'image/jpeg',data:Buffer.from(page).toString('base64')}],details:{source:'agent-html'}}}});
 await assert.rejects(()=>gate.wrap(async()=>complete)({model:{...MIMO_FLASH,input:['text','image']},signal:context.signal,messages:[{role:'user',images:[{data:'d3Jvbmc=',mimeType:'image/jpeg'},{data:'d3Jvbmc=',mimeType:'image/jpeg'}]}]}));assert.equal(gate.summary().images_delivered,false);assert.equal(gate.summary().stop.reason,'required_checks_missing');gate.dispose();
});
test('AC-TC6 same task/config resumes with 2048+16384 synthetic old reservations unchanged',async t=>{
 const f=await fixture(t,[complete]);await run(f);await f.host.close();f.gate.dispose();const path=join(f.dir,'agent-budget.json'),ledger=JSON.parse(await readFile(path,'utf8')),old=ledger.tasks[f.host.taskId];old.usage.reservedOutputTokens=18432;old.usage.outputTokens+=18432;await writeFile(path,JSON.stringify(ledger));const baseline=structuredClone(old),gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),requireLooks:false});let requests=0;
 const host=await SessionHost.create({projectRoot:f.dir,skillsDir:join(program,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport:gate.wrap(async()=>++requests===1?tools(read()):complete),builtin:{authorize:async()=>true,toolObserver:gate.observer}});gate.attach(host);t.after(async()=>{await host.waitForIdle();await host.close();gate.dispose();});const result=await run({host,gate});assert.equal(result.status,'succeeded');assert.equal(host.taskId,f.host.taskId);assert.equal(host.sessionId,f.host.sessionId);
 const next=JSON.parse(await readFile(path,'utf8')).tasks[host.taskId];assert.equal(next.configuration,baseline.configuration);assert.deepEqual(next.limits,baseline.limits);assert.equal(next.usage.reservedOutputTokens,18432);assert.equal(next.usage.modelCalls,baseline.usage.modelCalls+2);assert.equal(next.usage.toolCalls,baseline.usage.toolCalls+1);assert.equal(next.usage.outputTokens,baseline.usage.outputTokens+6);
});
test('AC-TC2 pinned Pi MiMo transport 503 has one wire attempt and no recovery retry',async t=>{
 let wire=0;const transport=createPiTransport({model:{...MIMO_FLASH,input:['text','image']},apiKey:'synthetic-not-a-provider-key',fetch:async()=>{wire++;return new Response('{"error":{"message":"synthetic unavailable"}}',{status:503,headers:{'content-type':'application/json'}});}});
 const f=await fixture(t,request=>transport(request));await run(f);assert.equal(wire,1);assert.equal(f.count,1);assert.equal(f.gate.summary().stop.reason,'transport_failure');assert.equal(new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId).toolCalls,0);
});
test('AC-TC2 deadline aborts actual owned Bash child before its late write and next tool',async t=>{
 const f=await fixture(t,[tools(call('bash',{command:'sleep 2; printf forbidden > shell-late.txt'}),write())],{deadlineMs:150});await run(f);
 assert.equal(f.gate.summary().stop.reason,'deadline');assert.equal(f.gate.summary().executed_tools,1);await assert.rejects(()=>readFile(join(f.dir,'shell-late.txt')),{code:'ENOENT'});await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-TC4 wrong rendered page count stops before same-batch following write',async t=>{
 const files={...deckFiles,'deck/deck.mjs':deckFiles['deck/deck.mjs'].replace('two(p);','two(p);two(p);')};
 const f=await fixture(t,[tools(...Object.entries(files).map(([path,content])=>call('write',{path,content})),call('render_deck',{expected_slides:2}),write())]);await run(f);assert.equal(f.gate.summary().stop.reason,'page_count');await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
