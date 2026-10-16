// RS-TRIAL-REV-01: approved 021 temporary acceptance only, installed SDK, synthetic data.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import {randomUUID,createHash} from 'node:crypto';
import {readFileSync as readFileSyncForTest} from 'node:fs';
import {createTrialControl,bindTrialReconciliation} from './trial-control.mjs';
const program=process.env.JUANERAI_REPORT_STUDIO_SOURCE,evidence=process.env.JUANERAI_REPORT_STUDIO_TRIAL_EVIDENCE;assert(program&&evidence&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=p=>import(pathToFileURL(join(program,p)).href);
const {SessionHost}=await load('dist/agent/session-host.js'),{MIMO_FLASH}=await load('dist/agent/model.js'),{RuntimeFault,createPiTransport}=await load('node_modules/pi-agent-runtime/dist/index.js'),{renderDeckTool}=await load('dist/agent/tools/render-deck-tool.js');
const nativeFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('UNEXPECTED_NETWORK');};
const complete={content:[{kind:'text',text:'page_01/page_02 当前版本内容、遮挡/溢出、对齐、可读性检查通过'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};
const call=(name,args,id=randomUUID())=>({kind:'tool',id,name,arguments:args});const tools=(...content)=>({...complete,content,stop:'tools'});
const edit=(cycle=0)=>call('edit',{path:'deck/pages/page_01.mjs',edits:[{oldText:'// cycle: '+cycle,newText:'// cycle: '+(cycle+1)}]});
const render=()=>call('render_deck',{expected_slides:2}),qa=()=>call('qa_deck',{}),looks=()=>tools(call('look_page',{page:'page_01'}),call('look_page',{page:'page_02'}));
const html=text=>`<!doctype html><meta charset="utf-8"><body style="width:1280px;height:720px;color:#10233f;font:30px Arial">${text}</body>`;
const files={
 'materials.json':'[]','outline.json':JSON.stringify({confirmed:true,confirmed_pages:[{},{}]}),
 'deck/pages/page_01.mjs':'// cycle: 0\n// headline: 合成测试数据\nexport function buildSlide(p){const s=p.addSlide();s.addText("合成测试数据",{x:1,y:1,w:11,h:1,fontSize:30});s.addText("100 120 135；非业务事实；来源：合成材料",{x:1,y:3,w:11,h:1,fontSize:20});}',
 'deck/pages/page_02.mjs':'// headline: 适用边界\nexport function buildSlide(p){const s=p.addSlide();s.addText("适用边界",{x:1,y:1,w:11,h:1,fontSize:30});s.addText("仅诊断，不证明原因、利润、增长或业务行动",{x:1,y:3,w:11,h:1,fontSize:20});}',
 'deck/pages/page_01.html':html('合成测试数据 100 120 135；非业务事实；来源：合成材料'),
 'deck/pages/page_02.html':html('适用边界 仅诊断，不证明原因、利润、增长或业务行动'),
 'deck/deck.mjs':'import P from "pptxgenjs";import {buildSlide as a} from "./pages/page_01.mjs";import {buildSlide as b} from "./pages/page_02.mjs";const p=new P();p.layout="LAYOUT_WIDE";a(p);b(p);await p.writeFile({fileName:"deck/deck.pptx"});'
};
// Exact 021 startup lock set, retained for the 023 saveExport/touch regression.
const realLockedPaths=['.agent-model-plan.json','deck/deck.mjs','materials.json','outline.json','project.json','sources/src_8a2f0a94.assets.json','sources/src_8a2f0a94.extract.md','sources/src_8a2f0a94.json','sources/src_8a2f0a94__synthetic-material-013.md'];
const sourceText='合成材料，仅离线测试：100、120、135；不证明原因、利润、增长或业务行动。';
const lockedSourceFiles={
 'sources/src_8a2f0a94__synthetic-material-013.md':sourceText,
 'sources/src_8a2f0a94.extract.md':sourceText,
 'sources/src_8a2f0a94.assets.json':JSON.stringify({claims:[],evidence:[],tables:[],notes:[],confirmations:[]}),
 'sources/src_8a2f0a94.json':JSON.stringify({source_id:'src_8a2f0a94',version:'v1',logical_key:'source:local:synthetic-material-013',filename:'synthetic-material-013.md',media_type:'text/markdown',kind:'markdown',file_hash:createHash('sha256').update(sourceText).digest('hex'),size:Buffer.byteLength(sourceText),imported_at:'2026-10-16T00:00:00.000Z',parse_status:'parsed',has_data:true})
};
async function fixture(t,replies,options={}){
 const dir=join(evidence,randomUUID());await mkdir(dir,{recursive:true});for(const [name,value] of Object.entries(files)){await mkdir(join(dir,name,'..'),{recursive:true});await writeFile(join(dir,name),value);}
 assert.equal((await renderDeckTool(dir).execute({expected_slides:2},new AbortController().signal)).ok,true);
 const {requestTransform,lockedPaths= ['deck/deck.mjs','outline.json','materials.json'],...gateOptions}=options;
 if(lockedPaths.includes('project.json')){const {WorkspaceStore}=await load('dist/storage/workspace.js');await new WorkspaceStore(join(dir,'..')).createProject({project_id:dir.split('/').at(-1),title:'025离线项目',brand:{primary:'#10233f'}});for(const [name,value]of Object.entries({...lockedSourceFiles,'.agent-model-plan.json':'{}'})){await mkdir(join(dir,name,'..'),{recursive:true});await writeFile(join(dir,name),value);}}
 const gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),correction:{projectRoot:dir,program,lockedPaths},...gateOptions});let count=0;
 const wrapped=gate.wrap(async request=>{count++;return typeof replies==='function'?replies(request,count):replies[count-1]??complete;});
 const transport=request=>wrapped(requestTransform?requestTransform(request,count):request);
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(program,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport,builtin:{authorize:async()=>true,toolObserver:gate.observer}});gate.attach(host);
 t.after(async()=>{await host.waitForIdle();await host.close();gate.dispose();await writeFile(join(dir,'observation.json'),JSON.stringify({provider_calls:0,wire_requests:count,gate:gate.summary()},null,2));});return {dir,gate,host,get count(){return count;}};
}
async function run(f){await f.host.send('合成021版本控制验证');const result=await f.host.currentResult();await f.host.waitForIdle();f.gate.observeResult(result);return result;}
test('AC-REV1 two bounded comment correction cycles recheck identical JPEGs using current tool results',async t=>{
 const f=await fixture(t,(_r,n)=>n===1?tools(edit()):n===2?tools(render(),qa()):n===3?looks():n===4?tools(edit(1)):n===5?tools(render(),qa()):n===6?looks():n===7?tools(call('export_deck',{formats:['pptx']})):complete);
 const result=await run(f);assert.equal(result.status,'succeeded',JSON.stringify(f.gate.summary()));assert.equal(f.count,8);assert.equal(f.gate.summary().revision.cycle,2);assert.equal(f.gate.summary().revision.look_history.length,4);
 const rows=f.gate.summary().revision.look_history;assert.equal(rows[0].image_sha256,rows[2].image_sha256);assert.equal(rows[1].image_sha256,rows[3].image_sha256);assert(f.gate.summary().images_delivered);assert(f.gate.summary().declarations_unchanged);
});
test('AC-REV2 ninth write and non-page paths/Bash/third look are rejected before any same-batch writes',async t=>{
 for(const outside of [call('write',{path:'deck/deck.mjs',content:'forbidden'}),call('write',{path:'../outside.txt',content:'forbidden'}),call('write',{path:'deck/pages/../deck.mjs',content:'forbidden'}),call('bash',{command:'exit 0'}),call('look_page',{page:'page_03'})]){
  const f=await fixture(t,[tools(edit(),outside)]);await run(f);assert(f.gate.summary().stopped);assert.match(await readFile(join(f.dir,'deck/pages/page_01.mjs'),'utf8'),/cycle: 0/);assert.equal(f.gate.summary().executed_tools,0);
 }
 const f=await fixture(t,[tools(...Array.from({length:9},()=>call('write',{path:'deck/pages/page_01.html',content:files['deck/pages/page_01.html']})))]);await run(f);assert.equal(f.gate.summary().stop.reason,'revision_write_limit');assert.equal(f.gate.summary().executed_tools,0);
});
const firstCycle=n=>n===1?tools(render(),qa()):n===2?looks():null;
test('AC-REV2 third cycle and repeated render/QA/duplicate look are rejected',async t=>{
 const f=await fixture(t,(_r,n)=>firstCycle(n)??(n===3?tools(edit()):n===4?tools(render(),qa()):n===5?looks():tools(edit(1))));await run(f);assert.equal(f.count,6);assert.equal(f.gate.summary().stop.reason,'revision_cycle_limit');assert.match(await readFile(join(f.dir,'deck/pages/page_01.mjs'),'utf8'),/cycle: 1/);
 for(const next of [tools(render(),render()),tools(render(),qa(),qa()),tools(render(),qa(),call('look_page',{page:'page_01'}),call('look_page',{page:'page_01'}))]){
  const f=await fixture(t,[next]);await run(f);assert.equal(f.gate.summary().executed_tools,0);assert(f.gate.summary().stopped);
 }
});
test('AC-REV3 edits invalidate all previous checks; missing render/QA/new look prevents export/completion',async t=>{
 for(const suffix of [[edit(),call('export_deck',{})],[edit(),call('look_page',{page:'page_01'})],[edit(),render(),call('look_page',{page:'page_01'})]]){
  const f=await fixture(t,(_r,n)=>firstCycle(n)??tools(...suffix));await run(f);assert(f.gate.summary().stopped);assert.match(await readFile(join(f.dir,'deck/pages/page_01.mjs'),'utf8'),/cycle: 0/);
 }
 for(const last of [tools(call('look_page',{page:'page_01'})),tools()]){
  const f=await fixture(t,(_r,n)=>n===1?tools(render(),qa()):n===2?last:complete);await run(f);assert.equal(f.gate.summary().model_complete,false);assert(f.gate.summary().stopped);
 }
});
test('AC-REV3 old identical images cannot replace missing current-cycle tool images',async t=>{
 const f=await fixture(t,(_r,n)=>firstCycle(n)??(n===3?tools(edit()):n===4?tools(render(),qa()):n===5?looks():complete),{requestTransform(request,count){
  if(count!==5)return request;let seen=0;const messages=[...request.messages].reverse().map(m=>m.role==='tool'&&m.toolName==='look_page'&&seen++<2?{...m,images:[]}:m).reverse();return {...request,messages};
 }});await run(f);assert.equal(f.count,5);assert.equal(f.gate.summary().stop.reason,'revision_images_not_delivered');assert.equal(f.gate.summary().model_complete,false);
});
test('AC-REV3 outside-observer artifact changes and changed facts stop before export',async t=>{
 let fixtureRef;const f=await fixture(t,async(_r,n)=>{if(firstCycle(n))return firstCycle(n);await writeFile(join(fixtureRef.dir,'deck/pages/page_01.html'),files['deck/pages/page_01.html']+' ');return tools(call('export_deck',{}));});fixtureRef=f;
 await run(f);assert.equal(f.gate.summary().stop.reason,'revision_artifact_changed');assert.equal(f.gate.summary().model_exports,0);
 const g=await fixture(t,[tools(call('edit',{path:'deck/pages/page_01.mjs',edits:[{oldText:'100 120 135',newText:'101 120 135'}]}),render(),qa())]);await run(g);assert.equal(g.gate.summary().stop.reason,'revision_content_changed');assert.equal(g.gate.summary().executed_tools,2);
});
test('AC-REV4 unresolved headline remains disclosed and prevents final completion/export',async t=>{
 const f=await fixture(t,(_r,n)=>n===1?tools(call('edit',{path:'deck/pages/page_01.mjs',edits:[{oldText:'// headline: 合成测试数据',newText:'// headline: 未上页结论'}]}),render(),qa()):n===2?looks():complete);
 await run(f);assert.equal(f.gate.summary().stop.reason,'revision_final_checks');assert(f.gate.summary().qa_flags.includes('headline_check'));assert.equal(f.gate.summary().model_complete,false);
});
test('AC-REV4 UI export requires explicit current-version review and rejects later file changes',async t=>{
 for(const branch of ['missing','changed']){
  const f=await fixture(t,(_r,n)=>firstCycle(n)??complete);await run(f);assert(f.gate.summary().model_complete);
  if(branch==='changed'){await f.gate.approveVisualReview(Object.fromEntries(['page_01','page_02'].map(p=>[p,{content:true,overlap:true,alignment:true,readability:true}])));await writeFile(join(f.dir,'deck/pages/page_01.html'),files['deck/pages/page_01.html']+' ');}
  await assert.rejects(()=>f.gate.localExport('pptx',()=>assert.fail('no local effect')));assert(f.gate.summary().stopped);
 }
});
test('AC-REV5 original SDK names/schema/IDs and soft failure still stop same-batch effects',async t=>{
 for(const next of [tools(edit(),call('functions.read',{})),tools(edit(),call('render_deck',{expected_slides:'bad'})),tools(edit(),call('read',{path:'materials.json'},'same'),call('read',{path:'materials.json'},'same'))]){
  const f=await fixture(t,[next]);const result=await run(f);assert.equal(result.reason,'INVALID_TOOL');assert.match(await readFile(join(f.dir,'deck/pages/page_01.mjs'),'utf8'),/cycle: 0/);assert.equal(f.count,1);
 }
 const f=await fixture(t,[tools(call('read',{path:'missing.md'}),edit())]);await run(f);assert.equal(f.gate.summary().stop.reason,'tool_failed');assert.match(await readFile(join(f.dir,'deck/pages/page_01.mjs'),'utf8'),/cycle: 0/);
});
test('AC-REV5 correction mode retains dispatch/tool/deadline bounds and SDK unknown reservation',async t=>{
 const read=()=>call('read',{path:'materials.json'}),f=await fixture(t,()=>tools(read()));await run(f);assert.equal(f.count,32);assert.equal(f.gate.summary().stop.reason,'dispatch_limit');const ledger=JSON.parse(await readFile(join(f.dir,'agent-budget.json'),'utf8'));assert(ledger.tasks[f.host.taskId].usage.reservedOutputTokens>0);
 const g=await fixture(t,[tools(...Array.from({length:97},read))]);await run(g);assert.equal(g.gate.summary().executed_tools,0);assert.equal(g.gate.summary().stop.reason,'tool_limit');
 const h=await fixture(t,async request=>{await new Promise(r=>request.signal.addEventListener('abort',r,{once:true}));throw Error('synthetic deadline');},{deadlineMs:40});await run(h);assert.equal(h.gate.summary().stop.reason,'deadline');assert.equal(h.count,1);
});
const diagnoseActiveMs=process.env.RS_DIAG_LOCAL_ACTIVE_MS==='1';
test('AC-REV6 '+(diagnoseActiveMs?'DIAGNOSTIC_PROPOSED_ACTIVE_MS_EXCEPTION_NOT_021_PASS: UI reconciliation and same-task three downloads':'strict021 refuses local active time and does not start a new main'),async t=>{
 const {startBuiltinStudio}=await load('dist/juanerai/server.js'),{createBuiltinAgentHosts}=await load('dist/agent/builtin-hosts.js'),{createStudioConfiguration}=await load('dist/juanerai/configuration.js'),{WorkspaceStore}=await load('dist/storage/workspace.js'),{proposeOutline}=await load('dist/agent/outline.js'),{assertStudioDataVersion}=await load('dist/juanerai/version.js');
 const data=join(evidence,randomUUID()),id='proj_revision',dir=join(data,id),owner='b'.repeat(64),hash=b=>createHash('sha256').update(b).digest('hex');await mkdir(data,{recursive:true});await assertStudioDataVersion(data,'synthetic-021');
 const credentials={async read(){return 'synthetic-no-provider-key';},async save(){},async remove(){}};
 await createStudioConfiguration({dataRoot:data,credentials,canChange:async()=>true,newId:randomUUID}).save('xiaomi-token-plan-cn','synthetic-no-provider-key',0);
 const store=new WorkspaceStore(data);await store.createProject({project_id:id,title:'021离线同账验收'});await proposeOutline(dir,[{title:'合成测试数据',page_type:'content'},{title:'适用边界',page_type:'content'}],[]);
 for(const [name,value] of Object.entries(files))if(name!=='outline.json'){await mkdir(join(dir,name,'..'),{recursive:true});await writeFile(join(dir,name),value);}
 for(const [name,value]of Object.entries(lockedSourceFiles)){await mkdir(join(dir,name,'..'),{recursive:true});await writeFile(join(dir,name),value);}
 const realInput=process.env.JUANERAI_REPORT_STUDIO_TRIAL_INPUTS;
 if(realInput)assert.deepEqual([...realLockedPaths].sort(),JSON.parse(await readFile(realInput,'utf8')).locked_paths.sort(),'integration must retain the exact real startup lock set');
 assert.equal((await renderDeckTool(dir).execute({expected_slides:2},new AbortController().signal)).ok,true);
 let service,agents,policy,browser,gate,reconciliationGuard,retainedOperation,stage='seed',seedWire=0,wire=0,reconcileOnly=true;const serialized=[];
 const {chromium}=await load('node_modules/playwright/index.mjs');browser=await chromium.launch();
 t.after(async()=>{for(const context of browser.contexts())for(const page of context.pages()){await page.screenshot({path:join(data,'last-ui.png'),fullPage:true}).catch(()=>{});await writeFile(join(data,'last-ui.html'),await page.content()).catch(()=>{});}await browser.close();if(service)await service.ownerLost();gate?.dispose();await writeFile(join(data,'integration-result.json'),JSON.stringify({provider_calls:0,seed_wire:seedWire,new_wire:wire,gate:gate?.summary(),reconciliation:reconciliationGuard?.summary(),serialized_images:serialized,operations:policy?.projectOperations(id)},null,2));});
 async function start(){
  gate=createTrialControl({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),...(stage==='revision'?{correction:{projectRoot:dir,program,lockedPaths:realLockedPaths}}:{})});
  service=await startBuiltinStudio({dataRoot:data,webDist:join(program,'web-dist'),ownerToken:owner,pluginVersion:'synthetic-021'},{credentials,createHosts(config){
   policy=config.policy;if(stage==='revision')reconciliationGuard=bindTrialReconciliation(policy,{operation:retainedOperation,readBudget:()=>JSON.parse(readFileSyncForTest(join(dir,'agent-budget.json'))).tasks['task_'+id],stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED'),onDeny:reason=>gate.stop(reason),maxActiveMsDelta:diagnoseActiveMs?60000:0});gate.bindPolicy(policy,id);agents=createBuiltinAgentHosts({...config,toolObserver:()=>gate.observer,makeTransport:(model,key)=>{
   const controlled=gate.wrap(createPiTransport({model,apiKey:key,fetch:async(_url,init)=>{
    const body=JSON.parse(init.body);assert.equal(body.model,'mimo-v2.6-flash');assert.equal(body.max_tokens??body.max_completion_tokens,16384);let next,n;
    if(stage==='seed'){n=++seedWire;next=n===1?tools(render(),qa()):n===2?looks():tools(edit());}
    else {assert.equal(reconcileOnly,false,'reconciliation must never reach physical transport');n=++wire;next=n===1?tools(edit()):n===2?tools(render(),qa()):n===3?looks():n===4?tools(edit(1)):n===5?tools(render(),qa()):n===6?looks():n===7?tools(call('export_deck',{formats:['pptx','html','pdf']})):complete;}
    const images=body.messages.flatMap(m=>Array.isArray(m.content)?m.content:[]).filter(c=>c.type==='image_url').map(c=>hash(Buffer.from(c.image_url.url.split(',')[1],'base64')));serialized.push({stage,n,image_sha256:images});
    const calls=next.content.filter(c=>c.kind==='tool'),delta=calls.length?{role:'assistant',tool_calls:calls.map((c,index)=>({index,id:c.id,type:'function',function:{name:c.name,arguments:JSON.stringify(c.arguments)}}))}:{role:'assistant',content:complete.content[0].text};
    const chunk={id:'synthetic',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta,finish_reason:calls.length?'tool_calls':'stop'}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}};
    return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
   }}));return reconciliationGuard?reconciliationGuard.wrap(controlled):controlled;}});return agents;
  }});const host=await agents.get(id);gate.attach(host);return host;
 }
 async function pageFor(){
  const context=await browser.newContext({acceptDownloads:true});await context.route('**/*',r=>new URL(r.request().url()).origin===service.origin?r.continue():r.abort());
  const bootstrap=await nativeFetch(service.origin+'/api/builtin/bridge/bootstrap',{method:'POST',headers:{'x-studio-owner':owner,'content-type':'application/json'},body:'{}'});assert.equal(bootstrap.status,200);const value=await bootstrap.json(),page=await context.newPage();await page.goto(service.origin+'/?project='+id+'#bootstrap='+value.token);return page;
 }
 const seedHost=await start();policy.setMode(0,true);const page=await pageFor();await page.getByRole('button',{name:/按此框架生成/}).waitFor({timeout:15000});
 const boundaryResponse=await page.request.get(service.origin+'/api/builtin/browser/projects/'+id+'/permissions'),boundary=await boundaryResponse.json();await writeFile(join(data,'permission-readback.json'),JSON.stringify({status:boundaryResponse.status(),value:boundary},null,2));assert.equal(boundaryResponse.status(),200);assert(Array.isArray(boundary.recipients));policy.grant(id,0,{...boundary.boundary,allow_prompt:true,allow_screenshots:true,allow_network:true},boundary.boundary);
 await page.getByRole('button',{name:/按此框架生成/}).click();await page.getByRole('button',{name:'核对运行状态',exact:true}).waitFor({timeout:15000});await seedHost.currentResult();await seedHost.waitForIdle();
 const old=structuredClone(policy.projectOperations(id).at(-1));retainedOperation=old;assert.equal(old.state,'unknown');assert.equal(old.physical_settled,true);assert.equal(old.usage_known,false);assert.equal(seedWire,3);const sessionId=seedHost.sessionId;
 await page.context().close();await service.ownerLost();gate.dispose();service=null;
 const before=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(before.usage.reservedOutputTokens,16384);await writeFile(join(data,'retained-unknown-before.json'),JSON.stringify({operation:old,budget:before},null,2));
 stage='revision';const host=await start(),next=await pageFor();assert.equal(host.sessionId,sessionId);assert.equal(host.taskId,'task_'+id);
 const recovered=next.waitForResponse(r=>r.url()===service.origin+'/api/projects/'+id+'/agent/recover'&&r.request().method()==='POST');await next.getByRole('button',{name:'核对运行状态',exact:true}).click();const recoveryResponse=await recovered;assert.equal(wire,0);
 if(!diagnoseActiveMs){
  assert.notEqual(recoveryResponse.status(),200);const strict=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8')).tasks['task_'+id];
  const counters=b=>['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'].map(k=>b.usage[k]);assert.deepEqual(counters(strict),counters(before));assert(strict.usage.activeMs>before.usage.activeMs);assert.deepEqual(policy.operation(old.operation_id),old);assert.equal(gate.summary().main_admissions,0);assert.equal(gate.summary().stop.reason,'reconciliation_active_ms');
  await writeFile(join(data,'strict-boundary-stopped.json'),JSON.stringify({original_zero_active_ms_positive_still_failed:true,guard_stopped_before_main:true,provider_calls:0,before:before.usage,after:strict.usage},null,2));return;
 }
 assert.equal(recoveryResponse.status(),200);await next.getByRole('button',{name:'核对运行状态',exact:true}).waitFor({state:'hidden',timeout:15000});
 const settled=policy.operation(old.operation_id);assert.equal(settled.state,'stopped');assert.equal(settled.usage_known,false);assert.equal(settled.physical_settled,true);assert.deepEqual({...settled,state:old.state,updated_at:old.updated_at},old);
 const reconciled=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8')).tasks['task_'+id];await writeFile(join(data,'reconciliation-readback.json'),JSON.stringify({diagnostic_exception_only:diagnoseActiveMs,provider_calls:wire,before:before.usage,after:reconciled.usage,active_ms_delta:reconciled.usage.activeMs-before.usage.activeMs,original_unknown_preserved:settled.usage_known===false},null,2));
 const counters=value=>Object.fromEntries(['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'].map(k=>[k,value[k]]));assert.deepEqual(counters(reconciled.usage),counters(before.usage));assert(reconciled.usage.activeMs>=before.usage.activeMs&&reconciled.usage.activeMs-before.usage.activeMs<=60000); // Proposed022 only; original strict positive FAIL preserved in integration002.
 assert.equal(reconciled.configuration,before.configuration);assert.deepEqual(reconciled.limits,before.limits);
 reconcileOnly=false;await next.getByPlaceholder('描述要做的 PPT，或对当前结果提出修改……').fill('仅021合成有界续作');const sent=next.waitForResponse(r=>r.url()===service.origin+'/api/projects/'+id+'/chat'&&r.request().method()==='POST');await next.getByRole('button',{name:'发送',exact:true}).click();assert.equal((await sent).status(),200);
 await next.getByRole('tab',{name:'成果（2 页）',exact:true}).waitFor({timeout:20000});const result=await host.currentResult();await host.waitForIdle();await writeFile(join(data,'continued-result.json'),JSON.stringify(result,null,2));assert.equal(gate.summary().stopped,false,JSON.stringify(gate.summary()));assert.equal(gate.summary().model_complete,true);assert.equal(wire,8);assert.equal(policy.projectOperations(id).at(-1).usage_known,true);
 assert(serialized.find(x=>x.stage==='revision'&&x.n===7).image_sha256.length>=6,'serialized request must retain historical plus both fresh cycles');
 const settledMain=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8')).tasks['task_'+id],wireBeforeExports=wire;
 await gate.approveVisualReview(Object.fromEntries(['page_01','page_02'].map(p=>[p,{content:true,overlap:true,alignment:true,readability:true}])));
 await next.getByRole('tab',{name:'成果（2 页）',exact:true}).click();const exports=[];
 for(const format of ['pptx','html','pdf'])await gate.localExport(format,async()=>{
  const response=next.waitForResponse(r=>r.url()===service.origin+'/api/projects/'+id+'/export'&&r.request().method()==='POST');await next.getByRole('button',{name:'下载 '+format.toUpperCase(),exact:true}).click();assert.equal((await response).status(),200);const value=await (await response).json(),entry=value.exports.find(e=>e.format===format);assert(entry);
  const link=next.locator('a[href*="'+entry.export_id+'"]:visible');await link.waitFor();const download=next.waitForEvent('download');await link.click({noWaitAfter:true});await (await download).saveAs(join(data,'download.'+format));
  const record=JSON.parse(await readFile(join(dir,'exports',entry.export_id+'.json'),'utf8')),bytes=await readFile(join(data,'download.'+format));assert.deepEqual(bytes,await readFile(join(dir,record.artifact_path)));assert.equal(hash(bytes),record.artifact_hash);exports.push({format,bytes:bytes.length,sha256:hash(bytes)});await new Promise(r=>setTimeout(r,30));
 });
 gate.finishScene();assert.equal(gate.summary().main_admissions,1);assert.equal(gate.summary().revision.cycle,2);
 const JSZip=(await load('node_modules/jszip/lib/index.js')).default,zip=await JSZip.loadAsync(await readFile(join(data,'download.pptx')));assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,2);
 const {extractText}=await load('node_modules/unpdf/dist/index.mjs'),pdf=await extractText(new Uint8Array(await readFile(join(data,'download.pdf'))),{mergePages:true});assert.equal(pdf.totalPages,2);assert.match(pdf.text,/100/);assert.match(pdf.text.normalize('NFKC'),/适用边界/);
 const htmlPage=await next.context().newPage();await htmlPage.setContent(await readFile(join(data,'download.html'),'utf8'));assert.equal(await htmlPage.locator('section').count(),2);await htmlPage.close();
 const after=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(after.configuration,before.configuration);assert.deepEqual(after.limits,before.limits);assert.equal(after.usage.reservedOutputTokens,16384);assert.equal(after.usage.modelCalls,before.usage.modelCalls+8);assert.equal(after.active,false);assert.equal(policy.operation(old.operation_id).usage_known,false);
 assert.deepEqual(after,settledMain,'local UI exports must not invoke models/tools or change any SDK task meter');assert.equal(wire,wireBeforeExports);
 assert.equal(gate.summary().revision.metadata_exports.length,3);assert(gate.summary().revision.artifact_versions.every(v=>Object.hasOwn(v.files,'project.json')));
 await writeFile(join(data,'exports-readback.json'),JSON.stringify({exports,before,reconciled,after,same_session:true,reconciliation_provider_calls:0},null,2));
});
test('AC-REV7 reconciliation guard preserves six counters and budget; strict mode refuses active time, proposed cap remains bounded',()=>{
 function fixture(cap=0){
  let op={operation_id:'synthetic-operation',kind:'main',state:'unknown',physical_settled:true,usage_known:false},budget={configuration:'fixed',limits:{maxOutputTokens:32768},usage:{modelCalls:3,toolCalls:4,inputTokens:4,outputTokens:16390,reservedOutputTokens:16384,resourceUnits:8,activeMs:700}},effects=0;
  const policy={operation:()=>op,reconcile(){effects++;op={...op,state:'stopped'};return op;},begin(){effects++;return 'admitted';}};
  const guard=bindTrialReconciliation(policy,{operation:structuredClone(op),readBudget:()=>budget,maxActiveMsDelta:cap,stopFault:()=>Error('SCOPE_DENIED')});return {policy,guard,budget,get effects(){return effects;}};
 }
 for(const branch of ['transport','main','other-operation','time','cap','counter','reserve','configuration','limits']){
  const f=fixture(branch==='cap'?60000:0);
  if(branch==='transport')assert.throws(()=>f.guard.wrap(()=>assert.fail('no transport'))({}));
  else if(branch==='main')assert.throws(()=>f.policy.begin('target'));
  else if(branch==='other-operation')assert.throws(()=>f.policy.reconcile('other'));
  else {if(branch==='time')f.budget.usage.activeMs+=1;if(branch==='cap')f.budget.usage.activeMs+=60001;if(branch==='counter')f.budget.usage.modelCalls++;if(branch==='reserve')f.budget.usage.reservedOutputTokens--;if(branch==='configuration')f.budget.configuration='changed';if(branch==='limits')f.budget.limits.maxOutputTokens=16384;assert.throws(()=>f.policy.reconcile('synthetic-operation'));}
  assert.equal(f.effects,0);assert.equal(f.guard.summary().reconciled,false);
 }
 const f=fixture(60000);f.budget.usage.activeMs+=15;f.policy.reconcile('synthetic-operation');assert.equal(f.guard.summary().active_ms_delta,15);assert.equal(f.guard.summary().usage_known,false);assert.equal(f.budget.usage.reservedOutputTokens,16384);assert.equal(f.policy.begin('target'),'admitted');assert.throws(()=>f.policy.reconcile('synthetic-operation'));assert.equal(f.effects,2);
});

async function reviewedProject(t){
 const f=await fixture(t,(_r,n)=>firstCycle(n)??complete,{lockedPaths:realLockedPaths});await run(f);assert.equal(f.gate.summary().model_complete,true);
 await f.gate.approveVisualReview(Object.fromEntries(['page_01','page_02'].map(p=>[p,{content:true,overlap:true,alignment:true,readability:true}])));
 const {WorkspaceStore}=await load('dist/storage/workspace.js'),store=new WorkspaceStore(join(f.dir,'..')),id=f.dir.split('/').at(-1);
 const policy={begin(){return 'synthetic-export';},finish(_id,value){return value;}};f.gate.bindPolicy(policy,id);
 return {...f,policy,async save(){return store.saveExport(id,{revision_id:'deck',format:'pptx',artifact:await readFile(join(f.dir,'deck/deck.pptx')),checks:{},is_draft:false});},begin(){policy.begin(id,'synthetic-export','export',{});},finish(value={outcome:'succeeded',physical_settled:true,usage_known:true}){policy.finish('synthetic-export',value);}};
}
test('AC-NORMAL1 only settled normal WorkspaceStore export accepts updated_at with full real locks',async t=>{
 const f=await reviewedProject(t),before=JSON.parse(await readFile(join(f.dir,'project.json'),'utf8'));
 await f.gate.localExport('pptx',async()=>{f.begin();await f.save();f.finish();});
 const after=JSON.parse(await readFile(join(f.dir,'project.json'),'utf8'));assert.deepEqual({...after,updated_at:before.updated_at},before);assert(Date.parse(after.updated_at)>=Date.parse(before.updated_at));
 assert.deepEqual(f.gate.summary().local_exports,['pptx']);assert.equal(f.gate.summary().revision.metadata_exports.length,1);assert.equal(f.gate.summary().stopped,false);
});
test('AC-NORMAL2 project identity/title/brand/new fields and invalid/backward/future time remain protected',async t=>{
 for(const [key,value]of [['title','changed'],['brand',{primary:'#ff0000'}],['project_id','another-project'],['new_field',true],['updated_at','invalid'],['updated_at','2000-01-01T00:00:00.000Z'],['updated_at','2999-01-01T00:00:00.000Z']]){
  const f=await reviewedProject(t);
  await assert.rejects(()=>f.gate.localExport('pptx',async()=>{f.begin();await f.save();const p=join(f.dir,'project.json'),v=JSON.parse(await readFile(p,'utf8'));v[key]=value;await writeFile(p,JSON.stringify(v));f.finish();}));
  assert(f.gate.summary().stopped);assert.deepEqual(f.gate.summary().local_exports,[]);assert.equal(f.gate.summary().revision.metadata_exports.length,0);
 }
});
test('AC-NORMAL2 timestamp changes outside export or without successful known settlement never rebase',async t=>{
 for(const branch of ['before','unclaimed','unsettled','failed','unknown']){
  const f=await reviewedProject(t);let effects=0;
  if(branch==='before'){const p=join(f.dir,'project.json'),v=JSON.parse(await readFile(p,'utf8'));v.updated_at=new Date().toISOString();await writeFile(p,JSON.stringify(v));}
  await assert.rejects(()=>f.gate.localExport('pptx',async()=>{effects++;if(branch!=='unclaimed')f.begin();await f.save();if(!['unclaimed','unsettled'].includes(branch))f.finish({outcome:branch==='failed'?'failed':'succeeded',physical_settled:true,usage_known:branch!=='unknown'});}));
  if(branch==='before')assert.equal(effects,0);assert(f.gate.summary().stopped);assert.equal(f.gate.summary().revision.metadata_exports.length,0);
 }
});
