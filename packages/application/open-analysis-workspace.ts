import { reportPostCopy, requireReportMarkdown } from '../product-core/report-postprocessing.ts';
import { postprocessSavedReport } from './report-postprocessing.ts';


import { readableOpenModelContext } from '../product-core/open-analysis-context.ts';









import { projectReportContent, reportContentCommand, resolveReportReferences } from '../product-core/browser-report-content.ts';



import { openAnalysisPreferences, openAnalysisMethodCatalog } from '../product-core/open-analysis-methods.ts';

import { randomUUID, createHash } from 'node:crypto';
import { membershipRecord as closed, membershipUuid } from '../product-core/member-analysis.ts';
import { hashFiniteJson } from '../product-core/member-task.ts';
import { unconfiguredRequirementHash, requirementUserStatements, requirementInputUnconfirmed } from '../product-core/open-requirement-framework.ts';

import type { OpenAnalysisStore, OpenStoredTask } from '../ports/open-analysis-store.ts';
import type { MemberSourceInspector, MemberSourceFile } from '../ports/member-source.ts';
import type { AnalysisAgent } from '../ports/analysis-agent.ts';
import { createOpenAnalysisApplication } from './open-analysis.ts';


import type { AnalysisPurpose, AnalysisAgentTurn } from '../ports/analysis-agent.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
/** No SDK or credential material crosses this Application boundary. */
export function createOpenAnalysisWorkspace(config:{agent:AnalysisAgent;onFailure?:(code:string)=>void;judgmentReview?:boolean;metricAssets?:import('../ports/metric-assets.ts').ProjectMetricAssets;metricAssetDisclosureAllowed?:boolean;store:OpenAnalysisStore;inspect:MemberSourceInspector;authorizeConfiguration:()=>Promise<{config_sha256:string}>}){
 let closing=false,busy=false;
 // Business operation cancellation handles only; Pi owns all Agent turns,
 // native operation/queue/Session state and physical execution facts.
 const active=new Map<string,{controller:AbortController;done:Promise<void>}>();
 const reading=new Set<{id?:string;controller:AbortController;done:Promise<void>}>();
 const submissions=new Map<string,{epoch:number;controller:AbortController}>();
 async function inspectSelected(files:readonly MemberSourceFile[],id?:string){
  if(closing)fail('SERVICE_CLOSED');const controller=new AbortController();let settle!:()=>void;
  if(id)submissions.get(id)!.controller=controller;const entry={id,controller,done:new Promise<void>(resolve=>{settle=resolve;})};reading.add(entry);
  try{const result=await config.inspect({sources:files,cancellation_signal:controller.signal,deadline_seconds:20});if(controller.signal.aborted||closing)fail('CANCELLED');return result;}
  finally{reading.delete(entry);settle();}
 }

 const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
 function read(id:string){const t=config.store.read(id);if(!t)fail('NOT_FOUND');return t;}
 async function diagnostics(id:string){return config.agent.diagnostics(read(id).identity);}
 async function settled(id:string){
  if(requirementInputUnconfirmed(read(id)))fail('TASK_UNCONFIRMED');const facts=await diagnostics(id);
  if(!['observed','not_started'].includes(facts.recording)||facts.unconfirmed_effects)fail('TASK_UNCONFIRMED');
 }
 async function generate(input:Omit<AnalysisAgentTurn,'capabilities'>){
  const output=await config.agent.advance({...input,capabilities:async()=>[]});
  if(!input.authorize()||input.signal.aborted)fail('CANCELLED');await config.agent.assertCompleted(input.identity,output.completion);
  return output.text;
 }
 async function materialReader(task:OpenStoredTask,authorize:()=>boolean,signal:AbortSignal){
  const prepared=await analysisApplication(task,authorize).prepare({identity:task.identity,question:task.question,signal});return {materials:prepared.materials,authorizeResources:prepared.authorizeResources};
 }
 function analysisApplication(before:OpenStoredTask,authorized:()=>boolean){
  return createOpenAnalysisApplication({materialRoot:config.store.directory(before.identity.task_id),metricAssets:config.metricAssets,metricAssetDisclosureAllowed:config.metricAssetDisclosureAllowed,metricAssetChoice:before.metric_asset_choice??null,
   ...(before.requirement_execution?{requirementInput:{revision:before.requirement_execution.revision,content:before.requirement_execution.content}}:{}),
   loadSelectedSource:async identity=>{if(!authorized()||hashFiniteJson(identity)!==hashFiniteJson(before.identity))fail('AUTHORITY_REQUIRED');return read(before.identity.task_id).source;},
   isAuthorized:identity=>authorized()&&hashFiniteJson(identity)===hashFiniteJson(before.identity),
  });
 }
 async function start(id:string){
  if(closing)fail('SERVICE_CLOSED');if(active.has(id)||busy)fail('TASK_BUSY');
  const before=read(id),approved=await config.authorizeConfiguration();
  if(closing)fail('SERVICE_CLOSED');if(approved.config_sha256!==before.identity.config_sha256||await config.agent.configuration()!==approved.config_sha256)fail('CONFIG_CHANGED');
  if(hashFiniteJson(read(id))!==hashFiniteJson(before))fail('REVISION_CONFLICT');
  const lease=config.store.begin(id),controller=new AbortController();
  const authorized=()=>{const now=read(id);return !closing&&!controller.signal.aborted&&now.pending_stop_epoch===null&&hashFiniteJson(now.identity)===hashFiniteJson(lease.identity)&&['running','saved'].includes(now.state);};
  const done=Promise.resolve().then(async()=>{
   try{
    const prepared=await analysisApplication(before,authorized).prepare({identity:lease.identity,question:before.question,signal:controller.signal});
    const digest=hashFiniteJson({kind:'explicit_analysis_command',identity:lease.identity,epoch:lease.epoch}),command_id=`${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
    const contract=await prepared.modelReportContract();
    const result=await config.agent.advance({identity:lease.identity,command_id,purpose:'analysis',presentation:before.preferences?.prompt??'professional',
     prompt:readableOpenModelContext(contract,before.requirement_execution?.user_statements??[]),
     system:'你是 JuanerAI 分析助手。依据用户原话、对话中确认的SCR/Binding/IR及获准企业资产，自主阅读资料、选择适用方法并表达观察与限制；不填写后台JSON、有限算子表或另一份计划。使用原生read/write/edit及获准bash；按问题自主编写程序并对获准clean资料真实计算，保存程序、实际输入和输出，不使用010_draw原始区。当前分析数字尚未独立核验，不认证因果、利润或业务行动。信息不全也能开始，只暂停依赖缺项的动作，保留具体补证方向。随后形成并保存报告，再开展获准的后核验与审查。',
     capabilities:async()=>[],materials:prepared.materials,authorizeResources:prepared.authorizeResources,authorize:authorized,signal:controller.signal});
    if(!authorized())fail('CANCELLED');await config.agent.assertCompleted(lease.identity,result.completion);
    const formed=await config.agent.advance({identity:lease.identity,command_id:randomUUID(),purpose:'report_edit',presentation:before.preferences?.prompt??'professional',
     prompt:readableOpenModelContext(contract,before.requirement_execution?.user_statements??[])+'\n\n本次实际分析回复：\n'+result.text+'\n\n作者本地计算执行事实：'+(result.completion.executions?.length?'已有'+result.completion.executions.length+'次真实命令执行，程序、来源及输出已记录；这不是独立核验。':'本次尚无已确认的本地计算执行。'),
     system:'依据同一份用户确认需求、可读SCR/Binding/IR、实际资料及分析形成完整中文Markdown报告；可用原生read按提供的实际路径读取资料及已写文件，不补填另一套计划。直接返回完整可读报告正文。说明资料范围、纳入排除、依据、未知、条件及具体补证建议。依据本次实际执行记录说明是否进行了作者本地计算；当前尚无独立数字核验，报告须明确未独立核验，不自称通过重算、独立审查或正式业务采纳；不得补造原因、利润或现实行动。信息不全只限制受影响判断，形成当前可用的有限报告。',
     capabilities:async()=>[],materials:prepared.materials,authorizeResources:prepared.authorizeResources,authorize:authorized,signal:controller.signal});
    if(!authorized())fail('CANCELLED');await config.agent.assertCompleted(lease.identity,formed.completion);await settled(id);
    if(hashFiniteJson(await prepared.modelReportContract())!==hashFiniteJson(contract))fail('CONTEXT_CHANGED');
    if(!config.store.saveModelReport)fail('CAPABILITY_UNAVAILABLE');config.store.saveModelReport(lease,{version:'1.1',outcome_id:randomUUID(),identity:lease.identity,kind:'MODEL_ANALYSIS_REPORT',text:requireReportMarkdown(formed.text),verification:'not_performed',human_judgment:'not_recorded',contract});
    if(config.judgmentReview===true){const task=read(id),postLease={...lease,epoch:task.epoch};await postprocessSavedReport({task,materialRoot:config.store.directory(id),agent:config.agent,save:value=>{config.store.saveReportPostprocessing!(postLease,value);},materials:prepared.materials,authorizeResources:prepared.authorizeResources,authorize:authorized,signal:controller.signal});}
   }catch(error){
    config.onFailure?.(String(Reflect.get(error as object,'code')??'LOCAL_OPERATION_FAILED'));
    await config.agent.waitForIdle();const facts=await diagnostics(id),current=read(id);
    if(facts.recording==='observed'&&!facts.unconfirmed_effects&&['running','unknown'].includes(current.state))config.store.finish(lease,controller.signal.aborted?'stopped':'failed');
    else if(current.state==='running')config.store.stop(id);
   }finally{active.delete(id);}
  });active.set(id,{controller,done});return read(id);
 }
 async function discussRequirement(id:string,raw:unknown){
  if(closing)fail('SERVICE_CLOSED');const x=closed(raw,['version','command_id','expected_sequence','message']);
  if(x.version!=='1.0'||!membershipUuid(x.command_id)||!Number.isSafeInteger(x.expected_sequence)||typeof x.message!=='string'||!x.message.trim()||x.message.length>12000)fail('DRAFT_INVALID');
  let before=read(id);const hash=hashFiniteJson(x),prior=before.requirement_draft?.conversation?.find(c=>c.command_id===x.command_id);
  if(prior){if(prior.request_sha256!==hash)fail('COMMAND_CONFLICT');return before;}
  if(active.has(id)||busy)fail('TASK_BUSY');if(before.state!=='ready'||before.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');if(before.entry_mode!=='requirements'||(before.requirement_draft?.sequence??0)!==x.expected_sequence)fail('REVISION_CONFLICT');
  await settled(id);const approval=await config.authorizeConfiguration();
  if(before.identity.config_sha256===unconfiguredRequirementHash)before=config.store.configureRequirement(id,before.identity,approval.config_sha256);
  if(before.identity.config_sha256!==approval.config_sha256)fail('CONFIG_CHANGED');
  const recordInputs=async(statements:readonly string[])=>{config.store.recordRequirementInputs(id,{command_id:String(x.command_id),request_sha256:hash,expected_identity:before.identity,complete:true,statements});};config.store.recordRequirementInputs(id,{command_id:String(x.command_id),request_sha256:hash,expected_identity:before.identity,complete:false,statements:[String(x.message)]});
  const controller=new AbortController(),authorized=()=>{const t=read(id);return !closing&&!controller.signal.aborted&&t.pending_stop_epoch===null&&t.state==='ready'&&hashFiniteJson(t.identity)===hashFiniteJson(before.identity)&&(t.requirement_draft?.sequence??0)===x.expected_sequence;};
  const done=Promise.resolve().then(async()=>{
   try{
    const prepared=await analysisApplication(before,authorized).prepare({identity:before.identity,question:before.question,signal:controller.signal});
    const materials=(await prepared.modelReportContract()).inputs.map(input=>input.table_path).join('\n');
    const result=await config.agent.advance({identity:before.identity,command_id:String(x.command_id),purpose:'requirement_design',recordUserInputs:recordInputs,prompt:'用户原始需求：\n'+before.question+'\n此前已保存用户原话（不是助手解释）：\n'+(before.requirement_draft||before.requirement_inputs?.length?requirementUserStatements(before.requirement_draft,undefined,before.requirement_inputs).join('\n'):'尚无')+'\n最近保存的助手理解（供本轮纠正，不代替用户原话或当前资料授权）：\n'+(before.requirement_draft?.content.text??'尚无')+'\n当前获准资源目录（原生read，实际绝对路径；没有资料也可开始讨论）：\n'+prepared.sourceCatalog+'\n当前获准资料路径：\n'+materials+'\n\n本次用户消息：\n'+x.message,system:'你是JuanerAI分析助手，与用户自然多轮交流分析需求。按需读取当前获准资料、项目批准指标体系和专业分析方法；不要一次复制全部资产。直接以可读文字说明本次业务理解，区分企业依据、用户明确条件、模型解释和具体缺口。随用户补充纠正，输出当前版本的SCR（问题及专业依据）、Binding（资料字段/单位/期间对应）和IR（目标、范围、预期交付、已知条件与未知），作为后续分析上下文，不是必须填写的JSON、算子表或执行步骤。只询问影响判断的关键歧义，已有条件不重复确认，信息不全也能讨论。只有用户实际确认的内容才称已确认；不得代用户确认、改企业资产或推断授权。当前是只整理需求的交流，保存文字不等于开始分析、计算、独立核验或行动。直接回复自然语言，无须调用提交框架工具。',
     capabilities:async()=>[],
     materials:prepared.materials,authorizeResources:prepared.authorizeResources,authorize:authorized,signal:controller.signal});
    if(!authorized())fail('CANCELLED');await config.agent.assertCompleted(before.identity,result.completion);if(!result.text.trim())fail('ASSISTANT_REPLY_EMPTY');
    config.store.saveRequirementDraft(id,{version:'1.0',command_id:x.command_id,expected_sequence:x.expected_sequence,message:x.message,content:{version:'2.0',text:result.text},discussion:{reply:result.text,request_sha256:hash}});
   }catch(error){config.onFailure?.(String(Reflect.get(error as object,'code')??'LOCAL_OPERATION_FAILED'));await config.agent.waitForIdle();}finally{active.delete(id);}
  });active.set(id,{controller,done});return read(id);
 }
 async function contentCommand(id:string,raw:unknown){
  if(closing)fail('SERVICE_CLOSED');if(active.has(id))fail('TASK_BUSY');const command=reportContentCommand(raw);
  if(['complete','fail'].includes(command.action))fail('AUTHORITY_REQUIRED');
  const prior=config.store.reportContentReceipt!(id,command.command_id);if(prior){if(hashFiniteJson(prior.command)!==hashFiniteJson(command))fail('COMMAND_CONFLICT');return prior;}
  await settled(id);const before=read(id);if(command.action==='suggest'){const approved=await config.authorizeConfiguration();if(approved.config_sha256!==before.identity.config_sha256)fail('CONFIG_CHANGED');}
  const event=config.store.reportContentCommand!(id,command);if(command.action!=='suggest')return event;
  const controller=new AbortController(),authorized=()=>!closing&&!controller.signal.aborted&&read(id).pending_stop_epoch===null&&hashFiniteJson(read(id).identity)===hashFiniteJson(before.identity);
  const done=Promise.resolve().then(async()=>{let generated=false;
   try{const reader=await materialReader(before,authorized,controller.signal),proposal=projectReportContent(read(id))!.suggestion!;
    const text=await generate({identity:before.identity,command_id:command.command_id,purpose:'report_edit',prompt:JSON.stringify({purpose:'bounded_paragraph_revision',original:proposal.original,instruction:command.instruction,verified_numbers:before.outcome?.numeric_report?.values??[],scope_sha256:before.identity.scope_sha256}),system:'只改写这一段解释文字，保留可追溯数字、核验范围、限制与用户原意；不增加计算、独立事实、因果或行动。只输出一个自然段，不代替人工采纳。',...reader,authorize:authorized,signal:controller.signal});generated=true;
    config.store.reportContentCommand!(id,{version:'1.0',command_id:randomUUID(),action:'complete',expected_content_sha256:command.expected_content_sha256,suggestion_id:command.command_id,text});
   }catch(error){config.onFailure?.(String(Reflect.get(error as object,'code')??'LOCAL_OPERATION_FAILED'));await config.agent.waitForIdle();const facts=await diagnostics(id);
    if(!generated&&!facts.unconfirmed_effects&&authorized())config.store.reportContentCommand!(id,{version:'1.0',command_id:randomUUID(),action:'fail',expected_content_sha256:command.expected_content_sha256,suggestion_id:command.command_id});
    // Completed-generation delivery failure or UNKNOWN stays pending for
    // trusted readback; never report no-effect or silently rerun the model.
   }finally{active.delete(id);}
  });active.set(id,{controller,done});return event;
 }
 return {
  start,diagnostics,discussRequirement,
  // Observation of the existing owning operation, never persisted or used to
  // admit/replay effects. Durable pending labels alone do not prove activity.
  operationActive(id:string){read(id);return active.has(id);},
  async requirementDiscussionReceipt(id:string,command_id:string){
   if(!membershipUuid(command_id))fail('VALIDATION_FAILED');const task=read(id);if(task.requirement_inputs?.some(r=>r.command_id===command_id&&!r.capture_complete))return {task_id:id,command_id,state:'unconfirmed' as const,settled:false,code:'REQUIREMENT_INPUT_UNCONFIRMED'};const saved=task.requirement_draft?.conversation?.find(c=>c.command_id===command_id);
   if(saved)return {task_id:id,command_id,state:'saved' as const,settled:true};
   for(const version of [task,...(task.history??[])].filter(t=>t.entry_mode==='requirements')){
    const view=await config.agent.conversation({identity:version.identity,purpose:'requirement_design',command:{kind:'observe',command_id},authorize:()=>!closing&&read(id).identity.task_id===id,signal:new AbortController().signal});
    if(view.request&&view.request.state!=='unavailable'){
     // Native completion confirms execution, not the business save. A reader
     // may arrive between those two facts; only the durable draft is "saved".
     if(view.request.state==='completed'&&view.request.settled)return active.has(id)
      ?{task_id:id,command_id,state:'running' as const,settled:false,code:'REQUIREMENT_SAVE_PENDING'}
      :{task_id:id,command_id,state:'failed' as const,settled:true,code:'REQUIREMENT_SAVE_FAILED'};
     return {task_id:id,...view.request};
    }
   }
   return {task_id:id,command_id,state:'unavailable' as const,settled:false};
  },
  async sessionControl(id:string,raw:unknown){
   if(closing)fail('SERVICE_CLOSED');const x=closed(raw,['version','expected_revision','command']),task=read(id);
   if(x.version!=='1.0'||x.expected_revision!==task.identity.revision)fail('REVISION_CONFLICT');
   const command=closed(x.command,['kind',...(x.command&&typeof x.command==='object'&&Object.hasOwn(x.command,'text')?['text']:[]),...(x.command&&typeof x.command==='object'&&Object.hasOwn(x.command,'entryId')?['entryId']:[]),...(x.command&&typeof x.command==='object'&&Object.hasOwn(x.command,'summarize')?['summarize']:[])]);
   if(!['snapshot','fork','navigate','steer','followUp','nextRun','cancelQueued'].includes(String(command.kind)))fail('VALIDATION_FAILED');
   if(task.entry_mode==='requirements'&&task.identity.config_sha256===unconfiguredRequirementHash&&command.kind==='snapshot')return {availability:'unavailable' as const};
   const authorize=()=>{const t=read(id);return !closing&&hashFiniteJson(t.identity)===hashFiniteJson(task.identity)&&t.pending_stop_epoch===null&&!['stopped','unknown'].includes(t.state);},signal=new AbortController().signal;
   if(command.kind!=='snapshot'&&!authorize())fail('AUTHORITY_REQUIRED');if(!['snapshot','cancelQueued'].includes(String(command.kind))&&!active.has(id)&&requirementInputUnconfirmed(task))fail('TASK_UNCONFIRMED');
   if(command.kind==='fork'||command.kind==='navigate'){if(active.has(id))fail('TASK_BUSY');await settled(id);}
   if(['steer','followUp','nextRun'].includes(String(command.kind))&&(typeof command.text!=='string'||!command.text.trim()||command.text.length>12000))fail('VALIDATION_FAILED');
   if(['cancelQueued','navigate'].includes(String(command.kind))&&(typeof command.entryId!=='string'||!command.entryId.trim()||command.entryId.length>200))fail('VALIDATION_FAILED');
   const readerAuthority=()=>!closing&&hashFiniteJson(read(id).identity)===hashFiniteJson(task.identity),purpose:AnalysisPurpose=task.entry_mode==='requirements'&&!task.requirement_execution?'requirement_design':'analysis';
   if(command.kind==='navigate'){
    if(command.summarize!==false)fail('AUTHORITY_REQUIRED');
    const view=await config.agent.conversation({identity:task.identity,purpose,command:{kind:'observe'},authorize:readerAuthority,signal});if(!view.messages?.some(m=>m.id===command.entryId))fail('NOT_FOUND');
     const reader=await materialReader(task,authorize,signal);
     const result=await config.agent.advance({identity:task.identity,command_id:randomUUID(),purpose,prompt:'',system:'',position:{id:String(command.entryId)},capabilities:async()=>[],...reader,authorize,signal});
    await config.agent.assertCompleted(task.identity,result.completion);
   }
   return config.agent.conversation({identity:task.identity,purpose,authorize:command.kind==='snapshot'?readerAuthority:authorize,signal,
    command:command.kind==='snapshot'||command.kind==='navigate'?{kind:'observe'}:command.kind==='fork'?{kind:'branch'}:command.kind==='cancelQueued'?{kind:'withdraw',id:String(command.entryId)}:{kind:command.kind==='steer'?'supplement':command.kind==='nextRun'?'defer':'follow_up',text:String(command.text)}});
  },
  async waitForIdle(){await Promise.all([...active.values()].map(value=>value.done));await config.agent.waitForIdle();},
  async stop(id:string){const task=config.store.stop(id),operation=active.get(id);operation?.controller.abort();
   if(!operation&&task.state==='unknown'&&task.pending_stop_epoch!==null){await settled(id);return config.store.finish({task_id:id,identity:task.identity,epoch:task.pending_stop_epoch},'stopped');}
   return task;
  },
  async resume(id:string){if(closing)fail('SERVICE_CLOSED');if(active.has(id))fail('TASK_BUSY');await settled(id);const task=config.store.resume(id);return task.entry_mode==='requirements'&&!task.requirement_execution?task:start(id);},
  reportContentCommand:contentCommand,
  
  
  async startRequirement(id:string,raw:unknown){if(closing)fail('SERVICE_CLOSED');if(active.has(id))fail('TASK_BUSY');if(!raw||typeof raw!=='object'||Reflect.get(raw,'version')!=='2.0')fail('AUTHORITY_REQUIRED');const x=closed(raw,['version','command_id','expected_revision','expected_analysis_revision','scope_sha256','confirmed']);if(x.confirmed!==true||!membershipUuid(x.command_id))fail('AUTHORITY_REQUIRED');let task=read(id);if(task.requirement_execution?.command_id===x.command_id){if(task.requirement_execution.request_sha256!==hashFiniteJson(x))fail('COMMAND_CONFLICT');return task;}if(['stopped','unknown'].includes(task.state)||task.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');if(task.identity.revision!==x.expected_analysis_revision||task.identity.scope_sha256!==x.scope_sha256)fail('REVISION_CONFLICT');if(!task.requirement_draft||task.requirement_draft.revision!==x.expected_revision)fail('REVISION_CONFLICT');await settled(id);if(task.identity.config_sha256===unconfiguredRequirementHash){const approved=await config.authorizeConfiguration();task=config.store.configureRequirement(id,task.identity,approved.config_sha256);}const started=config.store.startRequirement(id,raw);return started.state==='ready'?start(id):started;},
  async executeMetricAssetRevision(id:string,raw:unknown){const x=closed(raw,['version','command_id','expected_revision','confirmed']);if(x.version!=='1.0'||x.confirmed!==true||!membershipUuid(x.command_id))fail('AUTHORITY_REQUIRED');const task=read(id);if(task.identity.revision!==x.expected_revision||!task.metric_asset_choice)fail('REVISION_CONFLICT');return task.state==='ready'?start(id):task;},
  async addRequirementMaterials(id:string,raw:unknown){
   if(closing)fail('SERVICE_CLOSED');const x=closed(raw,['version','command_id','expected_revision','sources']);if(x.version!=='1.0'||!membershipUuid(x.command_id)||typeof x.expected_revision!=='string'||! /^[1-9]\d*$/.test(x.expected_revision)||!Array.isArray(x.sources)||!x.sources.length||x.sources.length>32)fail('SOURCE_INVALID');const task=read(id),files=x.sources as MemberSourceFile[],ids=new Set<string>();let size=0;
   for(const f of files){closed(f,['source_id','display_name','format','bytes']);if(!membershipUuid(f.source_id)||ids.has(f.source_id)||typeof f.display_name!=='string'||!f.display_name.trim()||f.display_name.length>200||!['csv','xlsx','md','pdf','docx','doc','pptx','ppt','png','jpg','jpeg'].includes(f.format)||!(f.bytes instanceof Uint8Array)||!f.bytes.length||f.bytes.length>8*1024*1024)fail('SOURCE_INVALID');ids.add(f.source_id);size+=f.bytes.length;}
   const hash=hashFiniteJson({version:x.version,command_id:x.command_id,expected_revision:x.expected_revision,sources:files.map(({source_id,display_name,format,bytes})=>({source_id,display_name,format,sha256:digest(bytes)}))}),prior=task.requirement_materials?.find(r=>r.command_id===x.command_id);
   if(prior){if(prior.input_sha256!==hash)fail('COMMAND_CONFLICT');return task;}if(task.identity.revision!==x.expected_revision)fail('REVISION_CONFLICT');if(task.entry_mode!=='requirements')fail('VALIDATION_FAILED');if(files.some(f=>task.source.sources.some(s=>s.source_id===f.source_id))||task.source.sources.length+files.length>32||size+task.source.sources.reduce((n,s)=>n+Number(s.byte_length),0)>32*1024*1024)fail('SOURCE_INVALID');
   if(busy)fail('TASK_BUSY');if(['running','unknown'].includes(task.state)||task.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');busy=true;
   try{const inspected=await inspectSelected(files);if(inspected.sources.length!==files.length||inspected.sources.some((s,i)=>s.source_id!==files[i]!.source_id||s.sha256!==digest(files[i]!.bytes)||s.display_name!==files[i]!.display_name||s.format!==files[i]!.format||Number(s.byte_length)!==files[i]!.bytes.length))fail('SOURCE_CHANGED');if(hashFiniteJson(read(id))!==hashFiniteJson(task))fail('REVISION_CONFLICT');return config.store.addRequirementMaterials(id,{command_id:String(x.command_id),input_sha256:hash,expected_identity:task.identity,originals:files,source:{version:'1.0',sources:[...task.source.sources,...inspected.sources]}});}finally{busy=false;}
  },
  saveRequirementDraft(id:string,raw:unknown){
   closed(raw,['version','command_id','expected_sequence','content','message']);
   if(closing)fail('SERVICE_CLOSED');read(id);
   if(busy||active.has(id)||submissions.has(id))fail('TASK_BUSY');
   
   return config.store.saveRequirementDraft(id,raw);
  },
  selectVersion:(id:string,raw:unknown)=>{if(closing)fail('SERVICE_CLOSED');return config.store.selectVersion(id,raw);},
  submission:(id:string)=>config.store.submission(id),
  reportContent:(id:string)=>projectReportContent(read(id)),
  reportContentReceipt:(id:string,command_id:string)=>config.store.reportContentReceipt!(id,command_id),
  resolveReferences:(id:string,raw:unknown)=>resolveReportReferences(read(id),raw),
  stopInitial(id:string){const receipt=config.store.stopSubmission(id);submissions.get(id)?.controller.abort();return receipt;},
  judgmentTarget(id:string){const t=read(id),o=t.outcome??t.model_report??t.conversation_outcome;if(t.state!=='saved'||!o)fail('NOT_FOUND');return {...(t.model_report&&t.report_postprocessing?{version:'1.1' as const,content_sha256:projectReportContent(t)!.sha256,review_sha256:hashFiniteJson(t.report_postprocessing)}:{}),expected_revision:t.identity.revision,outcome_id:o.outcome_id,outcome_sha256:hashFiniteJson(o)};},
  
  reportCopy(id:string,revision:string,outcome_id:string){if(!/^[1-9]\d*$/.test(revision)||!membershipUuid(outcome_id))fail('NOT_FOUND');const current=read(id),t=[current,...(current.history??[])].find(t=>t.identity.revision===revision&&t.model_report?.outcome_id===outcome_id);if(!t?.model_report)fail('NOT_FOUND');const content=projectReportContent(t)!;const text=['# JuanerAI 分析报告','',`版本 ${revision} · ${t.question}`,`报告内容 v${content.version} · ${content.confirmed?'已确认这版内容':'未确认'} · ${content.sha256}`,'','先保存的模型分析报告；数字与结论/建议的当前资格见后处理明细，不是正式业务决定。','',content.text,'',reportPostCopy(content.postprocessing),'',`资料快照：${t.identity.scope_sha256}`,`任务：${id}`,`成果：${outcome_id}`,''].join('\n');return {bytes:Buffer.from(text,'utf8'),media_type:'text/markdown; charset=utf-8',suggested_file_name:`JuanerAI-analysis-v${revision}.md`};},
  acknowledge:(id:string,raw:unknown)=>{if(closing)fail('SERVICE_CLOSED');return config.store.acknowledge(id,raw);},judgmentReceipt:(id:string,command_id:string)=>config.store.judgmentReceipt(id,command_id),methods:()=>config.judgmentReview?{...openAnalysisMethodCatalog,judgment_review_enabled:true}:openAnalysisMethodCatalog,list:()=>config.store.list(),read:(id:string)=>{const t=read(id);return t;},
  async submit(raw:unknown):Promise<OpenStoredTask>{
   if(closing)fail('SERVICE_CLOSED');const x=closed(raw,['version','command_id','question','confirmed','sources',...(Object.hasOwn(raw as object,'mode')?['mode']:[]),...(Object.hasOwn(raw as object,'preferences')?['preferences']:[])]);
   if(x.version!=='1.0'||!membershipUuid(x.command_id)||x.confirmed!==true)fail('AUTHORITY_REQUIRED');
   if(typeof x.question!=='string'||!x.question.trim()||x.question.length>12000||!Array.isArray(x.sources)||x.sources.length>32)fail('MATERIAL_REQUIRED');
   if(x.mode!==undefined&&!['analysis','requirements'].includes(String(x.mode)))fail('VALIDATION_FAILED');
   const preferences=openAnalysisPreferences(x.preferences);const files=x.sources as MemberSourceFile[];let size=0;const ids=new Set<string>();
   for(const file of files){closed(file,['source_id','display_name','format','bytes']);if(!membershipUuid(file.source_id)||ids.has(file.source_id)||typeof file.display_name!=='string'||!file.display_name.trim()||file.display_name.length>200||!['csv','xlsx','md','pdf','docx','doc','pptx','ppt','png','jpg','jpeg'].includes(file.format)||!(file.bytes instanceof Uint8Array)||file.bytes.length<1||file.bytes.length>8*1024*1024)fail('SOURCE_INVALID');ids.add(file.source_id);size+=file.bytes.length;}
   if(size>32*1024*1024)fail('SOURCE_INVALID');
   const existing=config.store.read(x.command_id);
   if(existing){if((existing.entry_mode??'analysis')!==(x.mode??'analysis'))fail('COMMAND_CONFLICT');if(hashFiniteJson(openAnalysisPreferences(existing.preferences))!==hashFiniteJson(preferences)||existing.question!==x.question||hashFiniteJson(existing.source.sources.map(s=>({source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:s.sha256})))!==hashFiniteJson(files.map(({source_id,display_name,format,bytes})=>({source_id,display_name,format,sha256:digest(bytes)}))))fail('COMMAND_CONFLICT');return existing;}
   if(busy)fail('TASK_BUSY');
   const hash=hashFiniteJson({version:x.version,command_id:x.command_id,question:x.question,confirmed:x.confirmed,...(x.mode!==undefined?{mode:x.mode}:{}),preferences,sources:files.map(({source_id,display_name,format,bytes})=>({source_id,display_name,format,sha256:digest(bytes)}))}),prior=config.store.submission(x.command_id);
   if(prior){if(prior.input_sha256!==hash)fail('COMMAND_CONFLICT');fail(prior.state==='stopped'?'CANCELLED':prior.state==='failed'?'SUBMISSION_FAILED':prior.state==='unknown'?'TASK_UNCONFIRMED':'TASK_BUSY');}
   const receipt=config.store.reserveSubmission(x.command_id,hash);submissions.set(x.command_id,{epoch:receipt.epoch,controller:new AbortController()});busy=true;
   const live=()=>{const r=config.store.submission(String(x.command_id));if(closing||!r||r.epoch!==receipt.epoch||r.state!=='reading')fail('CANCELLED');};
   try{
    const source=files.length?await inspectSelected(files,x.command_id):{version:'1.0' as const,sources:[]};live();
    if(source.sources.length!==files.length||source.sources.some((s,i)=>s.source_id!==files[i].source_id||s.display_name!==files[i].display_name||s.format!==files[i].format||s.sha256!==digest(files[i].bytes)))fail('SOURCE_CHANGED');
    const approval=x.mode==='requirements'?{config_sha256:unconfiguredRequirementHash}:await config.authorizeConfiguration();live();
    const identity={task_id:x.command_id,revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:hashFiniteJson(source),config_sha256:approval.config_sha256};
    return config.store.create({identity,question:x.question,source,originals:files,preferences,...(config.metricAssets?.approved()?{metric_asset_choice:{id:config.metricAssets.approved()!.asset.id,version:config.metricAssets.approved()!.asset.version}}:{}),...(x.mode==='requirements'?{entry_mode:'requirements' as const}:{})});
   }catch(error){try{config.store.finishSubmission(x.command_id,receipt.epoch,Reflect.get(error as object,'code')==='CANCELLED'?'stopped':'failed');}catch{/* New service ownership remains UNKNOWN. */}throw error;}finally{submissions.delete(x.command_id);busy=false;}
  },
  async revise(id:string,raw:unknown){
   const material=Object.hasOwn(raw as object,'sources');const x=closed(raw,['version','command_id','expected_revision','question',...(Object.hasOwn(raw as object,'preferences')?['preferences']:[]),...(material?['sources','confirmed']:[])]);if(material&&x.confirmed!==true)fail('AUTHORITY_REQUIRED');if(x.version!=='1.0'||!membershipUuid(x.command_id)||typeof x.expected_revision!=='string'||! /^[1-9]\d*$/.test(x.expected_revision)||typeof x.question!=='string'||!x.question.trim()||x.question.length>12000)fail('VALIDATION_FAILED');
   if(closing)fail('SERVICE_CLOSED');const task=read(id),preferences=openAnalysisPreferences(x.preferences??task.preferences);
   const files=material?x.sources as MemberSourceFile[]:null;if(files){if(!Array.isArray(files)||!files.length||files.length>32)fail('SOURCE_INVALID');let total=0;const ids=new Set<string>();for(const f of files){closed(f,['source_id','display_name','format','bytes']);if(!membershipUuid(f.source_id)||ids.has(f.source_id)||typeof f.display_name!=='string'||!f.display_name.trim()||f.display_name.length>200||!['csv','xlsx','md','pdf','docx','doc','pptx','ppt','png','jpg','jpeg'].includes(f.format)||!(f.bytes instanceof Uint8Array)||!f.bytes.length||f.bytes.length>8*1024*1024)fail('SOURCE_INVALID');ids.add(f.source_id);total+=f.bytes.length;}if(total>32*1024*1024)fail('SOURCE_INVALID');}
   if(task.revision_command_id===x.command_id||task.revision_commands?.includes(x.command_id)){const index=task.revision_commands?.indexOf(x.command_id)??-1;if((index>=0?task.history![index]!.question:task.question)!==x.question||hashFiniteJson(openAnalysisPreferences(index>=0?task.history![index]!.preferences:task.preferences))!==hashFiniteJson(preferences))fail('COMMAND_CONFLICT');if(files){const accepted=index>=0?task.history![index]!:task;for(const f of files){const s=accepted.source.sources.find(s=>s.source_id===f.source_id);if(!s||s.sha256!==digest(f.bytes)||s.display_name!==f.display_name||s.format!==f.format)fail('COMMAND_CONFLICT');}}return task;}
   if(task.identity.revision!==x.expected_revision)fail('REVISION_CONFLICT');if(!material&&task.question===x.question&&hashFiniteJson(openAnalysisPreferences(task.preferences))===hashFiniteJson(preferences))return task;if(busy)fail('TASK_BUSY');busy=true;
   try{const approval=await config.authorizeConfiguration();if(approval.config_sha256!==task.identity.config_sha256)fail('CONFIG_CHANGED');if(closing)fail('SERVICE_CLOSED');
    let source=task.source;if(files){const inspected=await inspectSelected(files);if(inspected.sources.length!==files.length||inspected.sources.some((s,i)=>s.source_id!==files[i]!.source_id||s.sha256!==digest(files[i]!.bytes)||s.display_name!==files[i]!.display_name||s.format!==files[i]!.format))fail('SOURCE_CHANGED');source={version:'1.0',sources:[...task.source.sources.filter(s=>!files.some(f=>f.source_id===s.source_id)),...inspected.sources]};if(source.sources.length>32||source.sources.reduce((n,s)=>n+Number(s.byte_length),0)>32*1024*1024)fail('SOURCE_INVALID');}
    const changed=hashFiniteJson(source)!==task.identity.scope_sha256;if(!changed&&task.question===x.question&&hashFiniteJson(preferences)===hashFiniteJson(openAnalysisPreferences(task.preferences)))return task;const identity={...task.identity,...(changed?{scope_sha256:hashFiniteJson(source),grant_id:randomUUID()}:{}),revision:String(Number(task.identity.revision)+1),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};return config.store.revise(id,{command_id:x.command_id,expected_revision:x.expected_revision,expected_epoch:task.epoch,question:x.question,identity,preferences,...(changed?{source,originals:files??undefined}: {})});
   }finally{busy=false;}
  },
  async selectMetricAsset(id:string,raw:unknown){
   const x=closed(raw,['version','command_id','expected_revision','id','asset_version','confirmed']);if(x.version!=='1.0'||x.confirmed!==true||!membershipUuid(x.command_id)||typeof x.id!=='string'||typeof x.asset_version!=='string')fail('AUTHORITY_REQUIRED');if(closing)fail('SERVICE_CLOSED');if(busy||active.has(id))fail('TASK_BUSY');const t=read(id),choice={id:x.id,version:x.asset_version};if(!config.metricAssets?.approved(choice.id,choice.version))fail('ASSET_APPROVAL_REQUIRED');
   const question=t.question;
   const prior=t.revision_command_id===x.command_id?t:t.history?.[t.revision_commands?.indexOf(String(x.command_id))??-1];if(prior){if(!prior.metric_asset_choice||hashFiniteJson(prior.metric_asset_choice)!==hashFiniteJson(choice))fail('COMMAND_CONFLICT');return t;}if(t.identity.revision!==x.expected_revision)fail('REVISION_CONFLICT');
   const controller=new AbortController();let finish!:()=>void;const done=new Promise<void>(resolve=>finish=resolve);active.set(id,{controller,done});busy=true;
   try{await settled(id);if(controller.signal.aborted)fail('CANCELLED');if(t.identity.config_sha256!==unconfiguredRequirementHash){const approval=await config.authorizeConfiguration();if(controller.signal.aborted)fail('CANCELLED');if(approval.config_sha256!==t.identity.config_sha256)fail('CONFIG_CHANGED');}if(closing)fail('SERVICE_CLOSED');if(hashFiniteJson(read(id).identity)!==hashFiniteJson(t.identity))fail('REVISION_CONFLICT');if(!config.metricAssets?.approved(choice.id,choice.version))fail('ASSET_APPROVAL_REVOKED');
    return config.store.revise(id,{command_id:x.command_id,expected_revision:String(x.expected_revision),expected_epoch:t.epoch,question,identity:{...t.identity,revision:String(Number(t.identity.revision)+1),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()},preferences:openAnalysisPreferences(t.preferences),metric_asset_choice:choice});
   }finally{busy=false;active.delete(id);finish();}
  },
  async close(){closing=true;for(const [id,entry] of active){config.store.stop(id);entry.controller.abort();}for(const [id,entry] of submissions){config.store.stopSubmission(id);entry.controller.abort();}for(const entry of reading)entry.controller.abort();let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([Promise.all([...reading].map(v=>v.done).concat([...active.values()].map(v=>v.done))),new Promise(r=>timer=setTimeout(r,5000))]);}finally{if(timer)clearTimeout(timer);}},
 };

}
