import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
import {parseDesktopCsv} from '../../../packages/product-core/xanthil-desktop-decision-case.ts';
import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import type {MemberSourceInspector} from '../../../packages/ports/member-source.ts';
import {createOpenAnalysisWorkspace} from '../../../packages/application/open-analysis-workspace.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import {createQuickAnalysisClient} from '../../../apps/browser/quick-analysis-client.mjs';

const inspect:MemberSourceInspector=async({sources})=>({version:'1.0',sources:sources.map(s=>{const csv=parseDesktopCsv(s.bytes);return {source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:createHash('sha256').update(s.bytes).digest('hex'),byte_length:String(s.bytes.length),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:[csv.headers,...csv.rows].map((r,i)=>({row:i+1,cells:r.map((v,j)=>({column:String.fromCharCode(65+j),type:'string',value:v}))}))}]};})});

for(const pagePolling of [false,true])test('MU01/02: eight native-read versions, durable receipts and no replay'+(pagePolling?' with concurrent page observations':''), {timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'mu-read-')),source_id=randomUUID(),bytes=Buffer.from('item,amount\nA,17\nB,29\n'),sha=createHash('sha256').update(bytes).digest('hex');
 const counts=new Map<number,number>(),commands:{command_id:string;message:string}[]=[],failures:string[]=[];let taskId='',currentTurn=0,totalCalls=0;
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'deepseek-flash',credentials:{withCredential:async(provider,run)=>{assert.equal(provider,'deepseek');return run({provider,model:'deepseek-flash',endpoint:'https://api.deepseek.com',key:'owned-offline-key-never-sent-to-network'});}},inspect,judgmentReview:false,onFailure:code=>{failures.push(code);console.log(JSON.stringify({failure:code,turn:currentTurn}));},fetch:async(_url,init)=>{
  totalCalls++;const dto=JSON.parse(String(init!.body)),prompt=JSON.stringify(dto.messages);assert.match(prompt,new RegExp('MU_TURN_'+currentTurn));await delay(pagePolling?25:0);
  const n=(counts.get(currentTurn)??0)+1;counts.set(currentTurn,n);
  if(n===1)return offlineResponse(totalCalls,[{name:'read',args:{path:join(root,'analyses',taskId,'020_clean/source/catalog.txt')}},{name:'read',args:{path:join(root,'analyses',taskId,'020_clean/source',source_id,sha,'sheet/csv/table.txt')}}]);
  assert.equal(n,2);return offlineResponse(totalCalls,[],'# Current understanding '+currentTurn+'\n\nSCR: respect the latest user correction. Binding: authorized CSV, CNY. IR: keep unknowns and save this discussion; no analysis has started. MU_REPLY_'+currentTurn);
 }});
 try{
  const task=await app.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Discuss this synthetic CSV; the user may refine scope and units over many turns.',confirmed:true,sources:[{source_id,display_name:'synthetic.csv',format:'csv',bytes}]});taskId=task.identity.task_id;
  for(currentTurn=1;currentTurn<=8;currentTurn++){
   const command={version:'1.0',command_id:randomUUID(),expected_sequence:currentTurn-1,message:'MU_TURN_'+currentTurn+': keep this actual user condition; only discuss the approved sample.'};commands.push(command);
   await app.discussRequirement(taskId,command);
   for(let poll=0;poll<100&&(app.read(taskId).requirement_draft?.sequence??0)<currentTurn;poll++){
    if(pagePolling)await Promise.all([app.sessionControl(taskId,{version:'1.0',expected_revision:app.read(taskId).identity.revision,command:{kind:'snapshot'}}),app.requirementDiscussionReceipt(taskId,command.command_id)].map(read=>read.catch(error=>{assert.equal(error.reason,'TASK_BUSY','only the native documented transient read contention may be retried as a read');})));
    await delay(10);
   }
   const saved=app.read(taskId),facts=await app.diagnostics(taskId);console.log(JSON.stringify({checkpoint:'saved-version',expected:currentTurn,actual:saved.requirement_draft?.sequence,modelAttempts:facts.meter?.model_attempts,unconfirmed:facts.unconfirmed_effects,failures}));
   writeFileSync(join(root,'turn-'+currentTurn+'.json'),JSON.stringify({saved,facts,counts:[...counts],failures},null,2));
   assert.equal(saved.requirement_draft?.sequence,currentTurn,'each completed multi-turn response must become the next durable requirement version');await app.waitForIdle();
   assert.match(saved.requirement_draft!.content.text,new RegExp('MU_REPLY_'+currentTurn));assert.equal(saved.requirement_draft!.conversation!.length,currentTurn);assert.equal(saved.requirement_execution,undefined);
   for(const [i,prior] of commands.entries())assert.equal(saved.requirement_draft!.conversation![i]!.user.text,prior.message);
   const receipt=await app.requirementDiscussionReceipt(taskId,command.command_id);assert.equal(receipt.state,'saved');const before=totalCalls;await app.discussRequirement(taskId,command);await app.waitForIdle();assert.equal(totalCalls,before,'same command only reads its durable receipt');
  }
  assert.deepEqual(failures,[]);assert.equal(totalCalls,16);assert.equal((await app.diagnostics(taskId)).unconfirmed_effects,false);
 }finally{if(taskId)await app.stop(taskId);await app.close();}
});

test('MU02/03/04: a settled failed save after several versions is terminal, preserves history and never resends on readback',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'mu-save-'));let calls=0,writes=0;const failures:string[]=[];
 const options={projectRoot:root,project_id:randomUUID(),analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,inspect,judgmentReview:false,fetch:async()=>offlineResponse(++calls,[],'Readable requirement version '+calls+'; unknowns affect only dependent conclusions.')};
 const profile=createPersonalOpenAnalysisWorkspace(options),real=createLocalOpenAnalysisStore({projectRoot:root}),store={...real,saveRequirementDraft:(...args:Parameters<typeof real.saveRequirementDraft>)=>{if(++writes===3)throw Object.assign(new Error('Owned synthetic pre-commit save failure'),{code:'SYNTHETIC_SAVE_FAILED'});return real.saveRequirementDraft(...args);}};
 const app=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store,inspect,judgmentReview:false,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()}),onFailure:code=>failures.push(code)}),unused=async():Promise<never>=>assert.fail('unrelated membership operation');
 const server=await startBrowserMembershipServer({open:{...profile,...app},store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{
  const boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{'content-type':'application/json',origin:server.origin},body:JSON.stringify({token:server.bootstrap})}),cookie=boot.headers.get('set-cookie')!.split(';')[0]!,control=(await boot.json()).control;
  const storage=new Map<string,string>(),browserStorage={getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>{storage.set(key,value);},removeItem:(key:string)=>{storage.delete(key);}},request:typeof fetch=(path,options={})=>fetch(server.origin+String(path),{...options,headers:{...options.headers,cookie,origin:server.origin}});
  let client=createQuickAnalysisClient({control,storage:browserStorage,request});
  const t=await app.submit({version:'1.0',command_id:randomUUID(),mode:'requirements',question:'Discuss and refine this need over many rounds.',confirmed:true,sources:[]});
  for(let turn=1;turn<=2;turn++){await client.discussRequirement(t.identity.task_id,turn-1,'Condition '+turn);await app.waitForIdle();await client.list();assert.equal(client.pending(),null);assert.equal(app.read(t.identity.task_id).requirement_draft!.sequence,turn);}
  await client.discussRequirement(t.identity.task_id,2,'Keep this actual third condition even when save fails.');const operation=client.pending()!;await app.waitForIdle();
  assert.deepEqual(failures,['SYNTHETIC_SAVE_FAILED']);assert.equal(app.read(t.identity.task_id).requirement_draft!.sequence,2);assert.equal((await app.diagnostics(t.identity.task_id)).unconfirmed_effects,false);
  const receipt=await app.requirementDiscussionReceipt(t.identity.task_id,operation.command_id!);writeFileSync(join(root,'failure-receipt.json'),JSON.stringify({receipt,task:app.read(t.identity.task_id),calls},null,2));assert.equal(receipt.state,'failed','completed native response without a committed business version must not remain a completed/pending save');assert.equal(receipt.settled,true);assert.equal(receipt.code,'REQUIREMENT_SAVE_FAILED');
  client=createQuickAnalysisClient({control,storage:browserStorage,request});await client.list();assert.equal(client.pending(),null,'passive page readback reaches the same terminal receipt, without resending');assert.equal(client.lastDiscussionFailure()?.code,'REQUIREMENT_SAVE_FAILED');assert.equal(calls,3);
  for(let turn=3;turn<=8;turn++){await client.discussRequirement(t.identity.task_id,turn-1,'Explicit normal follow-up '+turn);await app.waitForIdle();await client.list();assert.equal(client.pending(),null);assert.equal(app.read(t.identity.task_id).requirement_draft!.sequence,turn);}
  const saved=app.read(t.identity.task_id),before=await app.diagnostics(t.identity.task_id);assert.equal(saved.requirement_draft!.conversation!.length,8);assert.equal(saved.requirement_inputs!.length,9);assert.equal(saved.requirement_inputs![2]!.statements[0],'Keep this actual third condition even when save fails.');assert.equal(saved.requirement_execution,undefined);
  await app.close();await profile.close();const reopened=createPersonalOpenAnalysisWorkspace(options);try{assert.deepEqual(reopened.read(t.identity.task_id),saved);assert.deepEqual((await reopened.diagnostics(t.identity.task_id)).meter,before.meter);assert.equal(calls,9);}finally{await reopened.close();}
 }finally{await app.waitForIdle();await server.close();await app.close();await profile.close();}
});

import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
for(const saveFault of ['before_commit','after_commit'] as const)test('UI-A02/F001: report-edit activity, '+saveFault+' save fault and passive reopen keep truthful facts',async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'mu-report-'));let calls=0,release!:()=>void,entered!:()=>void;const errors:string[]=[],gate=new Promise<void>(r=>release=r),entry=new Promise<void>(r=>entered=r);
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,inspect:async()=>({version:'1.0' as const,sources:[]}),judgmentReview:false,fetch:async()=>{const n=++calls;if(n===3){entered();await gate;}return offlineResponse(n,[],n===3?'Clearer paragraph; no new fact.':'# Limited synthetic report\n\nNo source data or independent verification.');}};
 const profile=createPersonalOpenAnalysisWorkspace(options),real=createLocalOpenAnalysisStore({projectRoot:root});
 const store={...real,reportContentCommand:(...args:Parameters<NonNullable<typeof real.reportContentCommand>>)=>{if(args[1]&&typeof args[1]==='object'&&Reflect.get(args[1],'action')==='complete'){if(saveFault==='after_commit')real.reportContentCommand!(...args);throw Object.assign(Error('owned synthetic result-save fault'),{code:'SYNTHETIC_RESULT_SAVE_FAILED'});}return real.reportContentCommand!(...args);}};
 const app=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store,inspect:options.inspect,judgmentReview:false,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()}),onFailure:c=>errors.push(c)}),unused=async():Promise<never>=>assert.fail('unrelated membership operation');
 const startServer=(open:typeof profile)=>startBrowserMembershipServer({open,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 const server=await startServer({...profile,...app});
 async function cookieAt(origin:string,token:string){const b=await fetch(origin+'/v1/bootstrap',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(b.status,200);return b.headers.get('set-cookie')!.split(';')[0]!;}
 async function observe(origin:string,cookie:string,id:string,facts:Awaited<ReturnType<typeof app.diagnostics>>){const response=await fetch(origin+'/v1/open-analysis/'+id,{headers:{cookie,'x-xanthil-view':'browser-v1'}});assert.equal(response.status,200);const task=await response.json();return {task,html:renderQuickAnalysisWorkbench({project:'offline',tasks:[],current:openTaskView(task,facts),detail:'context',drawer:false,expanded:'report'})};}
 try{
  const cookie=await cookieAt(server.origin,server.bootstrap),task=await app.submit({version:'1.0',command_id:randomUUID(),question:'Give a limited readable result without source data.',confirmed:true,sources:[]}),id=task.identity.task_id;await app.start(id);await app.waitForIdle();const original=app.reportContent(id)!,command_id=randomUUID();assert.equal(app.read(id).state,'saved');
  await app.reportContentCommand(id,{version:'1.0',command_id,expected_content_sha256:original.sha256,action:'suggest',instruction:'Clarify the first paragraph, preserving all limits.'});await entry;
  const live=await observe(server.origin,cookie,id,await app.diagnostics(id));assert.equal(live.task.operation_active,true);assert.match(live.html,/正在生成报告改写建议/);assert.match(live.html,/aria-busy="true"/);
  release();await app.waitForIdle();const facts=await app.diagnostics(id),finished=await observe(server.origin,cookie,id,facts);assert.equal(calls,3);assert.deepEqual(errors,['SYNTHETIC_RESULT_SAVE_FAILED']);assert.equal(facts.unconfirmed_effects,false);assert.equal(finished.task.operation_active,false);assert.equal(app.reportContent(id)!.text,original.text);assert.equal(app.reportContent(id)!.suggestion!.instruction,'Clarify the first paragraph, preserving all limits.');assert.equal(app.reportContent(id)!.suggestion!.status,saveFault==='before_commit'?'generating':'ready');
  assert.doesNotMatch(finished.html,/正在生成报告改写建议|正在生成，尚未保存建议/);assert.doesNotMatch(finished.html,/class="agent-spinner"/);if(saveFault==='before_commit')assert.match(finished.html,/保存.*确认/);else assert.match(finished.html,/Clearer paragraph; no new fact/);
  const meter=facts.meter;await app.close();await profile.close();await server.close();const reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen must not resend')}),readServer=await startServer(reopened);
  try{const reopenedFacts=await reopened.diagnostics(id),readback=await observe(readServer.origin,await cookieAt(readServer.origin,readServer.bootstrap),id,reopenedFacts);assert.equal(readback.task.operation_active,false);assert.deepEqual(reopenedFacts.meter,meter);assert.equal(calls,3);assert.doesNotMatch(readback.html,/class="agent-spinner"|正在生成报告改写建议/);if(saveFault==='before_commit')assert.match(readback.html,/保存.*确认/);else assert.match(readback.html,/Clearer paragraph; no new fact/);writeFileSync(join(root,'readback.json'),JSON.stringify({saveFault,calls,errors,task:readback.task,facts:reopenedFacts},null,2));}finally{await readServer.close();await reopened.close();}
 }finally{release();await app.waitForIdle();await server.close();await app.close();await profile.close();}
});

test('UI-A02/C01: settled postprocessing failure and reopen never claim live checking',{timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'post-'));let calls=0,saves=0;const errors:string[]=[];
 const options={projectRoot:root,analysisModel:'mimo-v2.6-flash' as const,credentials:offlineCredentials,inspect:async()=>({version:'1.0' as const,sources:[]}),judgmentReview:true,fetch:async()=>offlineResponse(++calls,[],'# 合成有限报告\n\n尚无资料和独立核验；不认证原因与现实行动。')};
 const profile=createPersonalOpenAnalysisWorkspace(options),real=createLocalOpenAnalysisStore({projectRoot:root});
 const app=createOpenAnalysisWorkspace({agent:profile.professionalAgent,store:{...real,saveReportPostprocessing:(...args:Parameters<NonNullable<typeof real.saveReportPostprocessing>>)=>{if(++saves>1)throw Object.assign(Error('independent postcheck saving fault'),{code:'V002_POST_SAVE_FAILED'});return real.saveReportPostprocessing!(...args);}},inspect:options.inspect,judgmentReview:true,authorizeConfiguration:async()=>({config_sha256:await profile.professionalAgent.configuration()}),onFailure:c=>errors.push(c)});
 const unused=async():Promise<never>=>assert.fail('unrelated operation'),server=await startBrowserMembershipServer({open:{...profile,...app},store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 try{
  const b=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})});assert.equal(b.status,200);const cookie=b.headers.get('set-cookie')!.split(';')[0]!;
  const t=await app.submit({version:'1.0',command_id:randomUUID(),question:'保留缺口，保存有限报告后进行既有审查。',confirmed:true,sources:[]}),id=t.identity.task_id;await app.start(id);await app.waitForIdle();
  const facts=await app.diagnostics(id),response=await fetch(server.origin+'/v1/open-analysis/'+id,{headers:{cookie,'x-xanthil-view':'browser-v1'}});assert.equal(response.status,200);const task=await response.json(),view=openTaskView(task,facts);
  const state={project:'independent synthetic',tasks:[],current:view,drawer:false,detail:'context' as const,expanded:'report' as const},html=renderQuickAnalysisWorkbench(state),pro=renderQuickAnalysisWorkbench({...state,mode:'pro' as const,stage:'report' as const});
  assert.equal(calls,3);assert.equal(Reflect.get(task,'operation_active'),false);assert.equal(facts.unconfirmed_effects,false);assert.equal(task.state,'saved');assert.equal(task.report_postprocessing.state,'checking');assert.deepEqual(errors,['V002_POST_SAVE_FAILED']);assert.equal(saves,3);
  writeFileSync(join(root,'RESULT.json'),JSON.stringify({root,calls,saves,errors,task,facts,html,pro},null,2));writeFileSync(join(root,'actual.html'),html);
  console.log(JSON.stringify({root,calls,saves,errors,activity:task.operation_active,unconfirmed:facts.unconfirmed_effects,feedback:html.match(/<div class="agent-activity".*?<\/div>/)?.[0],summary:html.match(/<p role="status">[^<]*报告版本[^<]*<\/p>/g)}));
  await app.close();await profile.close();await server.close();
  const reopened=createPersonalOpenAnalysisWorkspace({...options,fetch:async()=>assert.fail('passive reopen cannot resend')});
  const readServer=await startBrowserMembershipServer({open:reopened,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
  try {
   const boot=await fetch(readServer.origin+'/v1/bootstrap',{method:'POST',headers:{origin:readServer.origin,'content-type':'application/json'},body:JSON.stringify({token:readServer.bootstrap})});const rcookie=boot.headers.get('set-cookie')!.split(';')[0]!;
   const readback=await (await fetch(readServer.origin+'/v1/open-analysis/'+id,{headers:{cookie:rcookie,'x-xanthil-view':'browser-v1'}})).json(),rf=await reopened.diagnostics(id);
   assert.deepEqual(reopened.read(id),app.read(id));assert.deepEqual(rf.meter,facts.meter);assert.equal(calls,3);assert.equal(readback.operation_active,false);
   const rh=renderQuickAnalysisWorkbench({...state,current:openTaskView(readback,rf)});writeFileSync(join(root,'REOPEN.json'),JSON.stringify({readback,facts:rf,html:rh,calls},null,2));
   console.log(JSON.stringify({reopen:true,root,calls,activity:readback.operation_active,post:readback.report_postprocessing.state,summary:rh.match(/<p role="status">[^<]*报告版本[^<]*<\/p>/g)}));
   assert.doesNotMatch(rh,/数字后核验中|结论与策略审查中|合并修订中|全文重审中/,'passive reopen must retain the same truthful inactive status');assert.match(rh,/保存.*确认/);
  } finally {await readServer.close();await reopened.close();}
  assert.match(html,/data-agent-state="unknown"/);assert.doesNotMatch(html,/class="agent-spinner"/);
  for(const h of [html,pro])assert.doesNotMatch(h,/数字后核验中|结论与策略审查中|合并修订中|全文重审中/,'an ended owning operation with failed saving cannot still claim postprocessing is in progress');
  for(const phase of ['checking','reviewing','revising','rechecking'])for(const owner of [false,undefined,true]){const current={...view,operationActive:owner,content:{...view.content!,postprocessing:{...view.content!.postprocessing!,state:phase}}};const shown=renderQuickAnalysisWorkbench({...state,current});if(owner===true)assert.match(shown,/数字后核验中|结论与策略审查中|合并修订中|全文重审中/);else{assert.doesNotMatch(shown,/数字后核验中|结论与策略审查中|合并修订中|全文重审中/);assert.match(shown,/保存.*确认/);}}
 }finally{await server.close();await app.waitForIdle();await app.close();await profile.close();}
});


test('UI-A02/C02: known postprocessing UNKNOWN survives local HTTP pending',{timeout:15000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'pending-unknown-'));let calls=0,release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),arrived=new Promise<void>(r=>entered=r);
 const app=createPersonalOpenAnalysisWorkspace({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,inspect:async()=>({version:'1.0',sources:[]}),judgmentReview:true,fetch:async()=>{const n=++calls;if(n>=3)throw new TypeError('owned synthetic transport response lost');return offlineResponse(n,[],'# 合成有限报告\n\n未知来源与未核验限制保留；不认证原因与行动。');}});
 const unused=async():Promise<never>=>assert.fail('unrelated operation'),server=await startBrowserMembershipServer({open:app,store:{readBrowserReportCopy:unused,readBrowserTask:unused,readBrowserReceipt:unused,stopBrowserTask:unused}});
 let pendingPromise:Promise<unknown>|undefined;
 try{
  const b=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token:server.bootstrap})});assert.equal(b.status,200);const cookie=b.headers.get('set-cookie')!.split(';')[0]!,boot=await b.json();
  let hold=false,heldStatus:number|undefined;
  const request:typeof fetch=async(path,init)=>{const response=await fetch(server.origin+String(path),{...init,headers:{...(init?.headers??{}),origin:server.origin,cookie}});if(hold&&init?.method==='POST'&&String(path).endsWith('/report-content')){heldStatus=response.status;entered();await gate;}return response;};
  const client=createQuickAnalysisClient({request,control:boot.control,storage:null});
  const t=await app.submit({version:'1.0',command_id:randomUUID(),question:'保存有限报告，真实后处理传输失败须保留未知。',confirmed:true,sources:[]}),id=t.identity.task_id;await app.start(id);await app.waitForIdle();
  const task=await client.read(id),facts=await client.diagnostics(id),beforeTask=app.read(id),beforeCalls=calls;
  assert.equal(task.state,'saved');assert.ok(task.report_postprocessing);assert.equal(task.report_postprocessing.state,'unknown');assert.equal(task.pending_stop_epoch,null);assert.equal(Reflect.get(task,'operation_active'),false);assert.equal(facts.unconfirmed_effects,true);
  const view=openTaskView(task,facts),state={project:'independent synthetic',tasks:[],current:view,drawer:false,detail:'context' as const,expanded:'report' as const},before=renderQuickAnalysisWorkbench(state);assert.match(before,/data-agent-state="unknown"/);
  hold=true;pendingPromise=client.contentCommand(id,app.reportContent(id)!.sha256,'suggest',{instruction:'仅澄清文字，不增加事实。'}).catch(error=>({error:String(error)}));await arrived;
  assert.equal(heldStatus,400,'real Workspace refuses the forbidden attempt before dispatch');
  assert.ok(client.pending());assert.equal(calls,beforeCalls);assert.deepEqual(app.read(id),beforeTask);
  const during=renderQuickAnalysisWorkbench({...state,pending:!!client.pending(),pendingOperation:client.pending()}),pro=renderQuickAnalysisWorkbench({...state,mode:'pro' as const,stage:'report' as const,pending:!!client.pending(),pendingOperation:client.pending()});
  release();const outcome=await pendingPromise;assert.equal(client.pending(),null);assert.equal(calls,beforeCalls);
  const after=renderQuickAnalysisWorkbench({...state,pending:false});
  writeFileSync(join(root,'RESULT.json'),JSON.stringify({root,calls,heldStatus,task,facts,before,during,pro,after,outcome},null,2));writeFileSync(join(root,'during.html'),during);
  console.log(JSON.stringify({root,calls,heldStatus,state:task.state,post:task.report_postprocessing.state,owner:Reflect.get(task,'operation_active'),pendingStop:task.pending_stop_epoch,physicalUnknown:facts.unconfirmed_effects,before:before.match(/<div class="agent-activity".*?<\/div>/)?.[0],during:during.match(/<div class="agent-activity".*?<\/div>/)?.[0],after:after.match(/<div class="agent-activity".*?<\/div>/)?.[0]}));
  for(const html of [during,pro]){assert.match(html,/data-agent-state="unknown"/,'known postprocessing UNKNOWN must not be shadowed by a pending HTTP receipt');assert.doesNotMatch(html,/class="agent-spinner"/);}
 }finally{release();if(pendingPromise)await pendingPromise;await server.close();await app.waitForIdle();await app.close();}
});

