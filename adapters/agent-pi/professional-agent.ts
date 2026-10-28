import { taskHash } from '../../packages/product-core/member-task.ts';
import { requireReportMarkdown } from '../../packages/product-core/report-postprocessing.ts';
import { createHash } from 'node:crypto';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createSessionRuntime, createSubagentTool, loadHarnessResources, createPiTransport, RuntimeFault, type SessionRunRequest, type RunResult, type ModelConfig, type ModelTransport, type Tool, type JsonValue, type JsonObject, type AuditEvent, type SessionRuntime } from 'pi-agent-runtime';
import type { AnalysisPurpose, AnalysisAgent, AnalysisAgentTurn, AnalysisCompletion, AnalysisConversationView, AnalysisResourceRead, AnalysisResponse } from '../../packages/ports/analysis-agent.ts';
import type { AnalysisRuntimeDiagnostics, AnalysisDiagnosticCode } from '../../packages/ports/open-analysis-runtime.ts';
import type { OpenTaskIdentity } from '../../packages/ports/open-analysis-store.ts';
import { createAnalysisFiles } from './analysis-files.ts';
import { createPiBusinessPersistence } from './persistent-runtime-state.ts';
import type { createApprovedProviderCredentials } from './provider-credentials.ts';

/** Fixed deployment policy, not an alternate execution engine. */
export const professionalAgentLimits=Object.freeze({cumulative:'unlimited' as const,maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000});
export const professionalCommandSoftTimeoutMs=120000;
export const professionalRequestAdmission=Object.freeze({policyVersion:'juanerai-browser-unified-v1',protocolOverheadTokens:4096,safetyMarginTokens:8192});
export const professionalSdkIdentity=Object.freeze({version:'0.6.0-newarch.1-corrections.2',bytes:182898,sha256:'8b8fa686b9e978ba28ef3ce4eec9a49085cc32ef4f28cd067bcb2307ce09e6bd'});
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function taskReference(task:string,revision:string,purpose:AnalysisPurpose,independent?:Readonly<{computation_id:string;role:'independent_source'|'method_review'}>,contextId?:string){const h=hash({task,revision,purpose,...(contextId?{contextId}:{}),...(independent?{computation_subject:independent.computation_id,computation_role:independent.role}:{})});return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);}

function models(selected:'MiniMax-M3'|'mimo-v2.6-flash'|'deepseek-flash',purpose:AnalysisPurpose){
 const m3:ModelConfig={provider:'minimax-cn',id:'MiniMax-M3',protocol:'anthropic-messages',endpoint:'https://api.minimaxi.com/anthropic',contextWindow:200000,maxOutputTokens:32768,reasoning:true};
 const flash:ModelConfig={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-flash',protocol:'openai-completions',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:32768,reasoning:true,thinkingProtocol:'mimo-chat'};
 const pro={...flash,id:'mimo-v2.6-pro'};
 const deepseek:ModelConfig={provider:'deepseek',id:'deepseek-flash',protocol:'openai-completions',endpoint:'https://api.deepseek.com',contextWindow:1000000,maxOutputTokens:32768,reasoning:true,input:['text']};
 // Selected DeepSeek covers the normal analysis/report/postcheck chain. The
 // separate retained/member routes and other model selections stay unchanged.
 if(purpose==='retained_case'||purpose==='membership')return [pro];
 if(selected==='deepseek-flash')return [deepseek];
 if(purpose==='report_edit')return [pro];
 if(purpose==='conclusion_strategy_review'||purpose==='report_revision')return [flash];
 if(purpose==='desktop_draft')return selected==='mimo-v2.6-flash'?[flash]:[m3];
 return selected==='mimo-v2.6-flash'?[flash,{...m3,maxOutputTokens:16384}]:[m3,{...flash,maxOutputTokens:16384}];
}
function fault(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
function code(event:AuditEvent|undefined):AnalysisDiagnosticCode{
 const category=event?.modelOutcome?.category;
 if(category==='quota')return 'QUOTA_EXCEEDED';if(category==='rate-limit')return 'RATE_LIMITED';if(category==='unavailable')return 'MODEL_UNAVAILABLE';if(category==='authentication')return 'CREDENTIAL_INVALID';if(category==='context')return 'CONTEXT_LIMIT';
 if(event?.modelOutcome?.diagnostic==='OUTPUT_LIMIT')return 'OUTPUT_INCOMPLETE';
 const reason=event?.reason;
 if(reason==='CANCELLED')return 'CANCELLED';if(reason==='AUTHORITY_REQUIRED')return 'AUTHORITY_REQUIRED';if(reason==='CONFIGURATION_CHANGED')return 'CONFIGURATION_CHANGED';if(reason==='INVALID_TOOL')return 'REQUEST_REJECTED';
 return reason?'UNKNOWN':'COMPLETE';
}

/** One public SDK call per requested business operation. No Agent loop, Session
 * parser, recovery classifier, phase unlock, parameter wrapper or retry here. */
export function createPiProfessionalAgent(config:{projectRoot:string;analysisModel:'MiniMax-M3'|'mimo-v2.6-flash'|'deepseek-flash';credentials:Pick<ReturnType<typeof createApprovedProviderCredentials>,'withCredential'>;fetch?:typeof globalThis.fetch;resourcesRoot?:string;toolCorrectionLimit?:number;modelRecoveryLimit?:number;businessPolicy?:Readonly<{judgmentReview:boolean;metricDisclosure:boolean;postReportReview?:boolean}>;authorizeWork:(workId:string,phase:'bind'|'advance'|'record'|'read')=>boolean}):AnalysisAgent{
 const toolCorrectionLimit=config.toolCorrectionLimit===undefined?5:config.toolCorrectionLimit,modelRecoveryLimit=config.modelRecoveryLimit===undefined?3:config.modelRecoveryLimit;
 if(!Number.isSafeInteger(toolCorrectionLimit)||toolCorrectionLimit<0||toolCorrectionLimit>5||!Number.isSafeInteger(modelRecoveryLimit)||modelRecoveryLimit<0||modelRecoveryLimit>3)fault('INVALID_REQUEST');
 const toolPolicy=Object.freeze({policyVersion:'juanerai-professional-native-v2',correctionLimit:toolCorrectionLimit});
 const runtimeDirectories=[resolve(dirname(process.execPath),'..'),'/Library/Developer/CommandLineTools/usr','/Library/Developer/CommandLineTools'].filter(path=>existsSync(path));
 const root=resolve(config.projectRoot),resourcesRoot=config.resourcesRoot??fileURLToPath(new URL('./resources/',import.meta.url));
 if(!['MiniMax-M3','mimo-v2.6-flash','deepseek-flash'].includes(config.analysisModel)||typeof config.authorizeWork!=='function')fault('AUTHORITY_REQUIRED');
 const state=createPiBusinessPersistence({projectRoot:root,isAuthorized:(g,phase)=>config.authorizeWork(g.work_id,phase)});
 const purposes:AnalysisPurpose[]=['analysis','requirement_design','report_edit','report_revision','conclusion_strategy_review','retained_case','desktop_draft','membership'];
 const skills=resolve(resourcesRoot,'skills'),templates=resolve(resourcesRoot,'templates');
 const skillDirectories=[skills,resolve(skills,'general')];
 const approvedResources=new Set([...skillDirectories,resolve(skills,'general/SKILL.md'),templates,resolve(templates,'brief.md'),resolve(templates,'professional.md')]);
 // Native loader probes these ignore files. Only their proven absence is
 // approved; creating one never silently grants permission to read its content.
 const absentProbes=new Set(skillDirectories.flatMap(path=>['.gitignore','.ignore','.fdignore'].map(name=>resolve(path,name))));
 const resources=loadHarnessResources({cwd:root,sources:[{kind:'skills',path:skills,version:'juanerai-approved-skills-v1'},{kind:'templates',path:templates,version:'juanerai-approved-templates-v1'}],authorize:async source=>(source.kind==='skills'&&source.version==='juanerai-approved-skills-v1'||source.kind==='templates'&&source.version==='juanerai-approved-templates-v1')&&(approvedResources.has(source.path)||absentProbes.has(source.path)&&!existsSync(source.path))}).then(value=>{if(value.diagnostics.length)throw new RuntimeFault('INVALID_REQUEST');return value;});
 const configuration=resources.then(value=>hash({sdk:professionalSdkIdentity,toolPolicy,modelRecoveryLimit,models:purposes.map(p=>({purpose:p,candidates:models(config.analysisModel,p)})),limits:professionalAgentLimits,commandSoftTimeoutMs:professionalCommandSoftTimeoutMs,contextAdmission:professionalRequestAdmission,resources:value.digest,capabilities:'juanerai-native-local-computation-v1',processLifecycle:'native-owned-group-foreground-v1',runtimeDirectories,reportArtifact:'markdown-v1',artifactOutputs:'native-workspace-v2',sourceAccess:'sdk-file-scope-v1',fileFeedback:'sdk-native-file-preconditions-v1',postReportSourcePaths:'isolated-input-v1',postReportEvidence:'sealed-results-v3',postReportRevision:'same-edition-recheck-v1',businessPolicy:config.businessPolicy??null,work:'opaque-sdk-atomic-v1'}));
 // Only live SDK handles for settlement; protocol/Session facts remain in Pi.
 const handles=new Map<string,SessionRuntime>(),liveHandles=new Map<SessionRuntime,string>();
 function fileDirectory(taskId:string,context?:AnalysisAgentTurn['computation_context']){
  return resolve(root,'analyses',taskId,...(context?['020_clean','independent',context.computation_id,context.role]:[]));
 }
 /** Reuse the public business audit's immutable Task association. This locates
  * native storage; it does not parse or mirror Pi's Session/queue state. */
 function recordedDirectory(task:string,fallback:string){
  const versions=state.readAudit(task).map(e=>e.contextVersions).filter(v=>v?.business_task);
  if(!versions.length)return fallback;
  const unique=new Set(versions.map(v=>JSON.stringify([v.business_task,v.computation_subject??null,v.computation_role_sha256??null])));
  if(unique.size!==1)fault('STATE_FAILED');const value=versions[0]!;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.business_task!))fault('STATE_FAILED');
  if(!value.computation_subject&&!value.computation_role_sha256)return fileDirectory(value.business_task!);
  const role=(['independent_source','method_review'] as const).find(role=>hash(role)===value.computation_role_sha256);
  if(!role||!value.computation_subject||!/^[a-f0-9-]{36}$/.test(value.computation_subject))fault('STATE_FAILED');
  return fileDirectory(value.business_task!,{computation_id:value.computation_subject,role});
 }
 async function nativeReader(task:string,purpose:AnalysisPurpose,work:string,cwd:string,authorize:()=>boolean=()=>false,passive=false){
  const loaded=await resources,model=models(config.analysisModel,purpose)[0]!;
  return (!passive&&handles.get(task))||createSessionRuntime({model,toolPolicy,transport:async()=>fault('AUTHORITY_REQUIRED'),contextAdmission:professionalRequestAdmission,budgets:state.budgets,audit:state.audit,authorize:async action=>authorize()&&(!passive||action.kind==='control'),
   harness:{extensionVersion:'juanerai-professional-native-v1',skills:loaded.skills,templates:loaded.templates,compaction:{enabled:true,reserveTokens:32768,keepRecentTokens:20000}},
   storage:{...state.sessionStorage(async(action)=>['read','list'].includes(action.kind)?config.authorizeWork(work,'read'):!passive&&authorize(),task),cwd:recordedDirectory(task,cwd)},bindOperation:state.bindOperation,reconcile:async()=> 'denied'});
 }
 async function inspectNative(task:string,purpose:AnalysisPurpose,work:string,logicalTask:string){
  const session=state.readSession(task,purpose);if(!session)return undefined;
  return (await nativeReader(task,purpose,work,fileDirectory(logicalTask))).inspectFacts({taskId:task,purpose,sessionId:session});
 }
 async function diagnostics(identity:OpenTaskIdentity,purpose?:AnalysisPurpose):Promise<AnalysisRuntimeDiagnostics>{
  const selected=purpose?[purpose]:purposes,base=selected.map(value=>({task_id:taskReference(identity.task_id,identity.revision,value),purpose:value}));
  const roots=new Set(base.flatMap(item=>state.readAudit(item.task_id).flatMap(e=>e.work?[e.work.ref]:e.modelAttempt?[e.modelAttempt.work.ref]:[])));if(roots.size>1)fault('AUTHORITY_REQUIRED');const work=[...roots][0]??identity.task_id;
  const related=state.readWorkTasks(work).flatMap(binding=>binding.purposes.filter(p=>selected.includes(p as AnalysisPurpose)).map(p=>({task_id:binding.task_id,purpose:p as AnalysisPurpose})));
  const taskPurposes=new Map([...base,...related].map(item=>[item.task_id,item.purpose])),tasks=[...taskPurposes.keys()];
  const accounts=tasks.map(task=>state.readAccounting(task)).filter(value=>value!==undefined);
  const events=tasks.flatMap(task=>state.readAudit(task)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.runId.localeCompare(b.runId)||a.sequence-b.sequence);
  const usage=accounts.reduce((sum,account)=>({modelCalls:sum.modelCalls+account.usage.modelCalls,toolCalls:sum.toolCalls+account.usage.toolCalls,inputTokens:sum.inputTokens+account.usage.inputTokens,outputTokens:sum.outputTokens+account.usage.outputTokens,reservedOutputTokens:sum.reservedOutputTokens+account.usage.reservedOutputTokens,resourceUnits:sum.resourceUnits+account.usage.resourceUnits}),{modelCalls:0,toolCalls:0,inputTokens:0,outputTokens:0,reservedOutputTokens:0,resourceUnits:0});
  const latest=[...events].reverse().find(e=>e.kind==='run.finished'),lastModel=[...events].reverse().find(e=>e.kind==='model.finished');
  const runCode=code(latest?.reason?latest:lastModel),causeCode=lastModel&&latest?.runId===lastModel.runId?code(lastModel):undefined;
  const diagnosticCode=runCode==='UNKNOWN'&&causeCode&&causeCode!=='COMPLETE'?causeCode:runCode;
  const native=await Promise.all(tasks.map((task,index)=>{const roots=new Set(state.readAudit(task).flatMap(event=>event.modelAttempt?[event.modelAttempt.work.ref]:[]));if(roots.size>1)fault('AUTHORITY_REQUIRED');return inspectNative(task,taskPurposes.get(task)!,[...roots][0]??work,identity.task_id);}));
  const neverStarted=!accounts.length&&!events.length&&!related.length&&native.every(facts=>facts===undefined);
  return {version:'1.0',task_id:identity.task_id,revision:identity.revision,recording:accounts.length||events.length?'observed':neverStarted?'not_started':'unavailable',configuration_sha256:identity.config_sha256,
   unconfirmed_effects:!accounts.length&&!neverStarted||accounts.some(account=>account.owner!==null||account.reservations.length>0)||native.some(facts=>facts&&(facts.availability!=='available'||facts.pending!==null))||events.some(e=>e.toolOutcome&&['unknown','partial','started'].includes(e.toolOutcome.status)),
   ...(accounts.length?{meter:{model_attempts:usage.modelCalls,tool_calls:usage.toolCalls,recorded_input_tokens:usage.inputTokens,charged_output_tokens:usage.outputTokens,unconfirmed_output_tokens:usage.reservedOutputTokens,resource_units:usage.resourceUnits}}:{}),
   ...(latest?{last_run:{code:diagnosticCode,at:latest.at,model:{provider:latest.provider,name:latest.model}}}:{}),
   observations:events.flatMap((event):AnalysisRuntimeDiagnostics['observations'][number][]=>{
    if(event.kind==='model.finished'&&event.modelOutcome){const o=event.modelOutcome;return [{kind:'model',observation_id:event.runId+':'+event.sequence,at:event.at,model:{provider:o.model.provider,name:o.model.id},...(o.responseModel?{reported_model:o.responseModel}:{}),code:code(event),physical_state:o.physicalStatus==='response-received'?'response_received':o.physicalStatus==='not-sent'?'not_sent':'unknown',...(o.httpStatus?{http_status:o.httpStatus}:{}),usage_final:o.usageFinal,input_tokens:o.usage.inputTokens.kind==='known'?{kind:'known',value:String(o.usage.inputTokens.value)}:{kind:'unknown',reason:'PROVIDER_USAGE_UNKNOWN'},output_tokens:o.usage.outputTokens.kind==='known'?{kind:'known',value:String(o.usage.outputTokens.value)}:{kind:'unknown',reason:'PROVIDER_USAGE_UNKNOWN'},after_stop:event.modelAttemptFact?.late??false}];}
    if(event.kind==='tool.finished'&&event.toolOutcome){const o=event.toolOutcome;return [{kind:'tool',observation_id:event.runId+':'+event.sequence,at:event.at,name:o.name,completion:o.status==='not-started'?'not_started':o.status,...(o.refusal?.code||o.reason?{code:o.refusal?.code??o.reason}:{}),delivery:o.modelOutput,...(o.receiptId?{receipt_id:o.receiptId}:{}),...(o.invocation?{invocation_id:o.invocation.invocationId}:{}),resource_units:o.resourceUnits,...(o.failureCategory?{file_failure_category:o.failureCategory}:{})}];}return [];
   }),
  };
 }
 async function assertCompleted(identity:OpenTaskIdentity,completion:AnalysisCompletion){
  if(identity.config_sha256!==await configuration||!purposes.includes(completion.purpose))fault('CONFIGURATION_CHANGED');
  const task=taskReference(identity.task_id,identity.revision,completion.purpose,completion.computation_context,completion.context_id),chain=taskReference(completion.command_id,identity.revision,completion.purpose,completion.computation_context);
  const events=state.readAudit(task).filter(event=>event.runId===completion.id),account=state.readAccounting(task),finished=events.find(event=>event.kind==='run.finished'),session=finished?.session;
  const modelFinished=new Map(events.filter(event=>event.kind==='model.finished'&&event.modelAttemptFact).map(event=>[event.modelAttemptFact!.attempt.physicalAttemptId,event.modelAttemptFact!]));
  const toolFinished=new Map(events.filter(event=>event.kind==='tool.finished'&&event.invocation).map(event=>[event.invocation!.invocationId,event.toolOutcome]));
  if(!finished||finished.reason||!session||!account||account.owner!==null||account.reservations.length||
   !/^[a-f0-9]{64}$/.test(identity.scope_sha256)||!events.some(event=>event.kind==='run.started')||events.some(event=>event.taskId!==task||event.contextVersions?.scope!==identity.scope_sha256||event.contextVersions?.configuration!==identity.config_sha256||event.contextVersions?.revision!==identity.revision||event.contextVersions?.isolated_context!==completion.context_id||event.contextVersions?.computation_subject!==completion.computation_context?.computation_id||event.contextVersions?.computation_role_sha256!==(completion.computation_context?hash(completion.computation_context.role):undefined))||
   !events.some(event=>event.work?.ref===completion.work_id&&event.work.chain===chain)||
   events.some(event=>event.kind==='model.admitted'&&event.modelAttempt&&!modelFinished.has(event.modelAttempt.physicalAttemptId)||event.kind==='tool.admitted'&&event.invocation&&!toolFinished.has(event.invocation.invocationId))||
   [...modelFinished.values()].some(fact=>!fact.terminal||fact.late||fact.outcome.physicalStatus==='unknown'||!fact.outcome.usageFinal)||
   [...toolFinished.values()].some(outcome=>!outcome||['started','partial','unknown'].includes(outcome.status)))fault('EFFECT_UNCONFIRMED');
  if(completion.resource_reads!==undefined){
   if(!Array.isArray(completion.resource_reads))fault('EFFECT_UNCONFIRMED');
   const groups=new Map<string,AnalysisResourceRead[]>();for(const read of completion.resource_reads){if(Object.keys(read).sort().join('|')!=='first_line|invocation_id|last_line|path|sha256'||typeof read.path!=='string'||!read.path||!/^[a-f0-9]{64}$/.test(read.sha256)||!Number.isSafeInteger(read.first_line)||!Number.isSafeInteger(read.last_line)||read.first_line<1||read.last_line<read.first_line)fault('EFFECT_UNCONFIRMED');groups.set(read.invocation_id,[...(groups.get(read.invocation_id)??[]),read]);}
   for(const [id,reads]of groups){const finished=events.find(e=>e.kind==='tool.finished'&&e.toolName==='read'&&e.invocation?.invocationId===id);if(finished?.toolOutcome?.status!=='completed'||finished.toolOutcome.modelOutput!=='ready'||finished.toolOutcome.receiptId!==taskHash(reads))fault('EFFECT_UNCONFIRMED');}
  }
  if(completion.recorded_values)for(const record of completion.recorded_values){const found=events.find(e=>e.kind==='tool.finished'&&e.toolName===record.tool_name&&e.invocation?.invocationId===record.invocation_id);if(found?.toolOutcome?.status!=='completed'||found.toolOutcome.modelOutput!=='ready'||found.toolOutcome.receiptId!==taskHash(record.value))fault('EFFECT_UNCONFIRMED');}
  if(completion.executions){const file=resolve(root,'.juanerai/post-report-executions',hash(completion.id)+'.json');let proof:any;try{proof=JSON.parse(readFileSync(file,'utf8'));}catch{fault('EFFECT_UNCONFIRMED');}if(hash(proof.identity)!==hash(identity)||hash(proof.completion)!==hash(completion))fault('EFFECT_UNCONFIRMED');}
  const engine=await nativeReader(task,completion.purpose,completion.work_id,fileDirectory(identity.task_id,completion.computation_context)),facts=await engine.inspectFacts({taskId:task,purpose:completion.purpose,sessionId:session.sessionId,branch:session.branch}),terminal=await engine.result(session.sessionId,session.operationId);
  // This qualifies this completed operation, never a future-run admission or
  // a claim that an unavailable queue snapshot is empty. Pi owns that queue.
  if(facts.availability!=='available'||facts.sessionId!==session.sessionId||facts.branch!==session.branch||facts.pending||terminal?.operationId!==session.operationId||terminal.status!=='completed')fault('EFFECT_UNCONFIRMED');
 }
 async function conversation(input:Parameters<AnalysisAgent['conversation']>[0]):Promise<AnalysisConversationView>{
  if(input.signal.aborted||!input.authorize())fault('AUTHORITY_REQUIRED');if(input.identity.config_sha256!==await configuration)fault('CONFIGURATION_CHANGED');
  const purpose=input.purpose,task=taskReference(input.identity.task_id,input.identity.revision,purpose),work=input.work_id??input.identity.task_id;
  let session=state.readSession(task,purpose);if(!session)return {availability:'unavailable'};
  // Observe through the existing non-executing SDK reader. Its metadata access
  // cannot occupy the live executor's Session control slot during final checks.
  // Steer/queue/fork continue to use the actual selected native execution handle.
  const command=input.command,engine=await nativeReader(task,purpose,work,fileDirectory(input.identity.task_id),input.authorize,command.kind==='observe');
  try{
  let receipt:Pick<AnalysisConversationView,'accepted_input'|'withdrawn_input'>={};
  if(command.kind==='branch'){
   const facts=await engine.inspectFacts({taskId:task,purpose,sessionId:session,signal:input.signal});
   if(facts.availability!=='available'||facts.pending||state.readAccounting(task)?.reservations.length)fault('EFFECT_UNCONFIRMED');
   if(!input.authorize())fault('AUTHORITY_REQUIRED');const previous=session;session=(await engine.fork(session,undefined,input.signal)).id;state.selectSession(task,purpose,session,previous);
  }else if(command.kind!=='observe'){
   const translated=command.kind==='withdraw'?{kind:'cancelQueued' as const,entryId:command.id}:{kind:command.kind==='supplement'?'steer' as const:command.kind==='defer'?'nextRun' as const:'followUp' as const,text:command.text};
   const ack=await engine.control({taskId:task,purpose,sessionId:session,command:translated,signal:input.signal});
   receipt={...(ack.entryId?{accepted_input:{id:ack.entryId}}:{}),...(command.kind==='withdraw'&&ack.cancelled!==undefined?{withdrawn_input:{id:command.id,accepted:ack.cancelled}}:{})};
  }
  const facts=await (command.kind==='observe'?(handles.get(task)??engine):engine).inspectFacts({taskId:task,purpose,sessionId:session,signal:input.signal});
  if(facts.availability!=='available')return {...receipt,availability:facts.availability};
  const history=await engine.history(session,facts.branch,input.signal);
  let request:AnalysisConversationView['request'];
  if(command.kind==='observe'&&command.command_id){
   const chain=taskReference(command.command_id,input.identity.revision,purpose),all=state.readAudit(task),runs=all.filter(e=>e.kind==='run.started'&&e.work?.chain===chain&&e.work.ref===work&&e.contextVersions?.scope===input.identity.scope_sha256&&e.contextVersions.configuration===input.identity.config_sha256&&e.contextVersions.revision===input.identity.revision);
   request={command_id:command.command_id,state:'unavailable',settled:false};
   if(runs.length===1){
    const events=all.filter(e=>e.runId===runs[0]!.runId),finished=events.find(e=>e.kind==='run.finished');
    if(!finished)request={...request,state:'running'};
    else if(finished.session){
     const terminal=await engine.result(finished.session.sessionId,finished.session.operationId,input.signal),physical=events.filter(e=>e.kind==='model.finished'&&e.modelAttemptFact),tools=events.filter(e=>e.kind==='tool.finished'&&e.invocation);
     const settled=!['AUDIT_FAILED','STATE_FAILED'].includes(finished.reason??'')&&terminal!==undefined&&terminal.operationId===finished.session.operationId&&!(await diagnostics(input.identity,purpose)).unconfirmed_effects&&physical.every(e=>e.modelAttemptFact!.terminal&&!e.modelAttemptFact!.late&&e.modelAttemptFact!.outcome.physicalStatus!=='unknown'&&e.modelAttemptFact!.outcome.usageFinal)&&events.every(e=>e.kind!=='model.admitted'||physical.some(f=>f.modelAttemptFact!.attempt.physicalAttemptId===e.modelAttempt?.physicalAttemptId))&&events.every(e=>e.kind!=='tool.admitted'||tools.some(f=>f.invocation!.invocationId===e.invocation?.invocationId&&!['started','partial','unknown'].includes(f.toolOutcome?.status??'unknown')));
     request={command_id:command.command_id,state:!settled?'unconfirmed':finished.reason||terminal!.status!=='completed'?'failed':'completed',settled,...(finished.reason?{code:finished.reason}:{})};
    }
   }
  }
  if(input.signal.aborted||!input.authorize())fault('AUTHORITY_REQUIRED');
  return {...receipt,...(request?{request}:{}),availability:'available',busy:facts.pending!==null,completed:facts.terminal?.status==='completed',position:facts.tipId,
   messages:history.map(entry=>({id:entry.id,role:entry.message?.role??'summary',text:entry.message?.text??entry.summary??''})),
   ...(facts.queue.availability==='known'?{pending:facts.queue.entries.map(entry=>({id:entry.entryId,kind:entry.kind}))}:{}),
  };
  }catch(error){
   // Passive observation may race a native writer. This is no receipt for a
   // model/tool/save effect. Mutating controls and authorization faults retain
   // their original failure and stop behavior; no operation is retried here.
   if(command.kind==='observe'&&error instanceof RuntimeFault){
    if(error.reason==='TASK_BUSY')return {availability:'busy'};
    if(error.reason==='STATE_FAILED')return {availability:'unavailable'};
   }
   throw error;
  }
 }
 async function assertInvocation(input:Parameters<AnalysisAgent['assertInvocation']>[0]){
  if(input.identity.config_sha256!==await configuration)fault('CONFIGURATION_CHANGED');
  const task=taskReference(input.identity.task_id,input.identity.revision,input.purpose,input.computation_context),chain=taskReference(input.command_id,input.identity.revision,input.purpose,input.computation_context);
  const events=state.readAudit(task),admitted=events.find(e=>e.kind==='tool.admitted'&&e.invocation?.invocationId===input.id&&e.toolName===input.name);
  if(!admitted||admitted.work?.ref!==input.work_id||admitted.work.chain!==chain||admitted.contextVersions.scope!==input.identity.scope_sha256||admitted.contextVersions.configuration!==input.identity.config_sha256||events.some(e=>e.runId===admitted.runId&&e.kind==='run.finished'))fault('AUTHORITY_REQUIRED');
 }
 type Prepared={engine:SessionRuntime;request:Omit<SessionRunRequest,'sessionId'>;finish:(result:RunResult<string>,session:string)=>Promise<AnalysisResponse>;task:string;purpose:AnalysisPurpose;input:AnalysisAgentTurn;check:()=>void};
 async function prepare(input:AnalysisAgentTurn):Promise<Prepared>{
   const check=()=>{if(input.signal.aborted)fault('CANCELLED');if(!input.authorize())fault('AUTHORITY_REQUIRED');};check();
   if(input.identity.config_sha256!==await configuration)fault('CONFIGURATION_CHANGED');if(input.presentation!==undefined&&(!['brief','professional'].includes(input.presentation)||input.position))fault('INVALID_REQUEST');check();
   if(input.computation_context&&(input.purpose!=='analysis'||input.position||Object.keys(input.computation_context).sort().join('|')!=='computation_id|role'||!['independent_source','method_review'].includes(input.computation_context.role)||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(input.computation_context.computation_id)))fault('INVALID_REQUEST');
   const loaded=await resources,purpose=input.purpose,task=taskReference(input.identity.task_id,input.identity.revision,purpose,input.computation_context,input.isolated?input.command_id:undefined),chain=taskReference(input.command_id,input.identity.revision,purpose,input.computation_context);
   if(input.isolated&&(input.position||input.presentation||!config.businessPolicy?.postReportReview))fault('AUTHORITY_REQUIRED');
   if(input.verification_inputs&&(!config.businessPolicy?.postReportReview||input.purpose!=='analysis'||input.computation_context?.role!=='independent_source'||input.position||input.presentation))fault('AUTHORITY_REQUIRED');
   const filesRoot=fileDirectory(input.identity.task_id,input.computation_context),reportPath=resolve(filesRoot,'060_reports','draft/report-'+hash(input.command_id)+'.md');
   const executions:import('../../packages/ports/analysis-agent.ts').AnalysisExecutionFact[]=[];let executionInvocation='';
   const businessValues=new Map<string,{invocation_id:string;tool_name:string;value:unknown}>();
   const readReceipts=new Map<string,AnalysisResourceRead[]>();let nativeRead:Readonly<{id:string;materials:Map<string,Buffer>}>|undefined;
   const compute=['analysis','membership','desktop_draft','retained_case'].includes(purpose)&&input.computation_context?.role!=='method_review';
   const resourceOptions={compute,commandSoftTimeoutMs:professionalCommandSoftTimeoutMs,runtimeDirectories,cwd:filesRoot,reportPath,signal:input.signal,materials:input.materials,authorizeResources:input.authorizeResources,
    ...(input.verification_inputs?{verificationInputs:input.verification_inputs}:{}),
    ...(compute?{onExecution:(fact:Omit<import('../../packages/ports/analysis-agent.ts').AnalysisExecutionFact,'invocation_id'>)=>{if(!executionInvocation)fault('EFFECT_UNCONFIRMED');executions.push({...fact,invocation_id:executionInvocation});}}:{}),
    authorize:()=>input.authorize(),skillFiles:loaded.files,
    onRead:(path:string,bytes:Uint8Array)=>{if(nativeRead)nativeRead.materials.set(path,Buffer.from(bytes));},
   };
   let files:Awaited<ReturnType<typeof createAnalysisFiles>>;try{files=await createAnalysisFiles(resourceOptions);}catch(error){if(error instanceof RuntimeFault)fault(error.reason);throw error;}
   const business=await input.capabilities();check();
   const businessTools:Tool[]=business.map(tool=>({name:tool.name,description:tool.description,parameters:tool.parameters as JsonObject,effect:tool.effect,resourceUnits:1,executionMode:'sequential',
    execute:async(args,signal,invocation)=>{check();const value=await tool.execute(args,signal,invocation?{id:invocation.invocationId,refuse:(code,reason)=>invocation.refuse({code,noPendingEffects:true,details:{reason}}),resource_reads:[...readReceipts.values()].flat()}:undefined) as JsonValue;if(input.isolated&&invocation)businessValues.set(invocation.invocationId,{invocation_id:invocation.invocationId,tool_name:tool.name,value});return value;},
    ...(tool.modelResult||input.isolated?{modelOutput:{policyVersion:'juanerai-business-projection-v1',maxBytes:1024*1024,project:async({value,signal}:{value:JsonValue;signal:AbortSignal})=>({value:tool.modelResult?await tool.modelResult(value,signal) as JsonValue:value,...(input.isolated?{receiptId:taskHash(value)}:{})})}}:{}),
   }));
   if(purpose==='conclusion_strategy_review'&&!(config.businessPolicy?.postReportReview&&input.isolated)&&businessTools.some(t=>t.effect!=='read'))fault('AUTHORITY_REQUIRED');
   const native=files.tools.filter(t=>t.name==='read'||compute||purpose==='report_edit'||purpose==='report_revision').map(tool=>{
    if(tool.name==='bash')return {...tool,execute:async(args:JsonObject,signal:AbortSignal,invocation:Parameters<Tool['execute']>[2])=>{if(!compute||!invocation)fault('AUTHORITY_REQUIRED');executionInvocation=invocation.invocationId;try{return await tool.execute(args,signal,invocation);}finally{executionInvocation='';}}};
    if(tool.name!=='read'||!(input.computation_context?.role==='method_review'||purpose==='conclusion_strategy_review'&&config.businessPolicy?.postReportReview))return tool;
    return {...tool,execute:async(args:JsonObject,signal:AbortSignal,invocation:Parameters<Tool['execute']>[2])=>{
     const capture={id:invocation?.invocationId??'',materials:new Map<string,Buffer>()};nativeRead=capture;
     try{const value=await tool.execute(args,signal,invocation),texts=(value as {content?:{kind:string;text?:string}[]}).content?.filter(c=>c.kind==='text').map(c=>c.text??'').join('\n')??'',reads:AnalysisResourceRead[]=[];
      if(capture.id)for(const [path,bytes]of capture.materials){
       const lines=bytes.toString('utf8').split('\n'),first=Number.isSafeInteger(args.offset)?Number(args.offset):1,limit=Number.isSafeInteger(args.limit)?Number(args.limit):lines.length;let prefix='',last=first-1;
       for(let i=first-1;i<lines.length&&i<first-1+limit;i++){const next=prefix+(i===first-1?'':'\n')+lines[i];if(!texts.startsWith(next))break;prefix=next;last=i+1;}
       if(last>=first)reads.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),first_line:first,last_line:last,invocation_id:capture.id});
      }
      readReceipts.set(capture.id,reads);return value;
     }finally{nativeRead=undefined;}
    },modelOutput:{policyVersion:'juanerai-current-read-evidence-v1',maxBytes:1_048_576,project:async({value,invocation}:{value:JsonValue;invocation?:Parameters<Tool['execute']>[2]})=>{const reads=readReceipts.get(invocation?.invocationId??'');return {value,...(reads?.length?{receiptId:taskHash(reads)}:{})};}}};
   });
   const delegated=(input.delegations??[]).map(definition=>{
    const pending=new Map<string,{child:Awaited<ReturnType<typeof prepare>>;complete:Awaited<ReturnType<typeof definition.prepare>>['complete']}>();
    return createSubagentTool({name:definition.name,description:definition.description,parameters:definition.parameters as JsonObject,policyVersion:'juanerai-post-report-subagents-v1',resourceUnits:1,
     prepare:async(args,signal,parent)=>{
      check();if(!config.businessPolicy?.postReportReview||!parent.invocation)fault('AUTHORITY_REQUIRED');
      const plan=await definition.prepare(args,signal,{id:parent.invocation.invocationId,refuse:(code,reason)=>parent.invocation!.refuse({code,noPendingEffects:true,details:{reason}})});
      if(plan.turn.identity!==input.identity&&hash(plan.turn.identity)!==hash(input.identity)||plan.turn.work_id!==undefined&&plan.turn.work_id!==(input.work_id??input.identity.task_id)||plan.turn.delegations?.length||plan.turn.position||plan.turn.presentation)fault('AUTHORITY_REQUIRED');
      const child=await prepare({...plan.turn,isolated:true,work_id:input.work_id??input.identity.task_id,signal,authorize:()=>input.authorize()&&plan.turn.authorize()});
      pending.set(parent.invocation.invocationId,{child,complete:plan.complete});return {runtime:child.engine,request:child.request};
     },modelOutput:{policyVersion:'juanerai-post-report-subagent-result-v1',maxBytes:1_048_576,project:async({value,invocation})=>{
      const id=invocation?.invocationId??'',plan=pending.get(id);if(!plan)fault('EFFECT_UNCONFIRMED');
      const packet=value as unknown as {session_id:string;result:RunResult<string>};
      const result=await plan.child.finish(packet.result,packet.session_id);pending.delete(id);
      return {value:await plan.complete(result) as JsonValue};
     }}});
   });
   const tools=[...businessTools,...native,...delegated];if(new Set(tools.map(t=>t.name)).size!==tools.length)fault('INVALID_REQUEST');
   const foreground=compute?'\n本机已装配Node与系统Python3标准库；当前没有声明第三方Python科学库或依赖安装权限。本次计算以前台命令运行，等待程序及正常工作进程结束并取得结果后再答复；不启动脱组后台服务或把仍在计算的任务称为完成。普通fork、管道和前台程序可用。命令退出成功仅是实际执行事实，不能自称独立核验通过。':'';
   const outputs='\n获准输出工作区：'+filesRoot+'\n所有新建或改写的程序、过程结果、核验笔记、报告及临时文件都必须留在此工作区内，并遵守已有只读与受保护资料边界。提供原生Bash时，其cwd、HOME和TMPDIR均为此工作区；临时文件使用TMPDIR或此处绝对路径，不使用全局/tmp或其他Task。当前工具与逐效果授权决定可执行操作；此路径说明不授予写入、Shell或网络权限，也不扩大独立子Agent的文件范围。';
   const system=(purpose==='report_edit'||purpose==='report_revision'?input.system+'\n本次指定成稿路径：'+reportPath+'。正文格式固定为UTF-8 Markdown；在此文件内用原生write/edit逐步形成完整报告，不写JSON元数据或摘要封套。文件存在时它是唯一成稿正文，最后的对话说明不能替代文件内容；未写文件时直接回复完整Markdown正文。正式保存由产品完成，不自称已保存或已核验；其他材料可另存为同Task辅助文件。':input.system)+outputs+files.accessDescription+foreground;
   const candidates=models(config.analysisModel,purpose);
   const transport=(model:ModelConfig):ModelTransport=>request=>config.credentials.withCredential(model.provider,async credential=>{
    check();if(credential.endpoint!==model.endpoint||model.provider==='minimax-cn'&&credential.model!==model.id)fault('AUTHORITY_REQUIRED');
    if(request.messages.some(m=>m.text.includes(credential.key)))fault('AUTHORITY_REQUIRED');
    return createPiTransport({model,apiKey:credential.key,...(config.fetch?{fetch:config.fetch}:{})})(request);
   });
   const model=candidates[0]!,selected={id:purpose,mode:'agent' as const,model,transport:transport(model),tools,thinkingLevel:model.protocol==='openai-completions'?'off' as const:undefined,...(candidates.length>1?{fallbacks:candidates.slice(1).map(model=>({model,transport:transport(model)}))}:{})};
   const work=input.work_id??input.identity.task_id;
   state.bindBusinessWork({work_id:work,command_id:chain,task_id:task,config_sha256:input.identity.config_sha256,purposes:[purpose],recovery_limit:modelRecoveryLimit});
   const engine=createSessionRuntime({model,transport:selected.transport,purposes:[selected],contextAdmission:professionalRequestAdmission,budgets:state.budgets,audit:state.audit,
    authorize:async(_action,signal)=>!signal.aborted&&!input.signal.aborted&&input.authorize(),
    toolPolicy,
    harness:{extensionVersion:'juanerai-professional-native-v1',skills:loaded.skills,templates:loaded.templates,compaction:{enabled:true,reserveTokens:32768,keepRecentTokens:20000}},
    storage:{...state.sessionStorage(async(action,signal)=>!signal.aborted&&(['read','list'].includes(action.kind)?config.authorizeWork(work,'read'):input.authorize()),task),cwd:filesRoot},bindOperation:async(binding,signal)=>{await state.bindOperation(binding,signal);state.selectSession(task,purpose,binding.sessionId);handles.set(task,engine);liveHandles.set(engine,task);void engine.waitForIdle(task).then(()=>liveHandles.delete(engine),()=>{});},
    reconcile:async()=>input.authorize()?(state.readWorkAccounting(work).some(account=>account.reservations.length>0)||state.readWorkAudit(work).some(event=>event.toolOutcome&&['started','partial','unknown'].includes(event.toolOutcome.status))?'unknown':'ready'):'denied',
   });
   const request:Omit<SessionRunRequest,'sessionId'>={taskId:task,purpose,work:{ref:work,chain,limit:modelRecoveryLimit},prompt:input.prompt,system,tools,...(input.position?{operation:'navigate' as const,targetEntryId:input.position.id,summarize:false}:input.presentation?{operation:'template' as const,resourceName:input.presentation,templateArguments:[input.prompt]}:{}),contextVersions:{...(input.isolated?{isolated_context:input.command_id}:{}),business_task:input.identity.task_id,scope:input.identity.scope_sha256,configuration:input.identity.config_sha256,revision:input.identity.revision,...(input.computation_context?{computation_subject:input.computation_context.computation_id,computation_role_sha256:hash(input.computation_context.role)}:{})},limits:professionalAgentLimits,modelRecovery:{extraAttempts:modelRecoveryLimit},signal:input.signal};
   async function finish(result:RunResult<string>,session:string){
   if(result.status!=='succeeded')throw Object.assign(new Error(result.reason),{code:result.reason,model_outcome:result.modelOutcome,tool_outcomes:result.toolOutcomes});
   const finishedReads=state.readAudit(task).filter(e=>e.runId===result.runId&&e.kind==='tool.finished'&&e.toolName==='read'&&e.toolOutcome?.status==='completed'&&e.toolOutcome.modelOutput==='ready');
   const resource_reads=finishedReads.flatMap(e=>{const r=readReceipts.get(e.invocation?.invocationId??'');return r&&e.toolOutcome?.receiptId===taskHash(r)?r:[];});
   const recorded_values=[...businessValues.values()].filter(v=>state.readAudit(task).some(e=>e.runId===result.runId&&e.kind==='tool.finished'&&e.invocation?.invocationId===v.invocation_id&&e.toolOutcome?.status==='completed'&&e.toolOutcome.modelOutput==='ready'&&e.toolOutcome.receiptId===taskHash(v.value)));
   const completion:AnalysisCompletion={id:result.runId,...(input.isolated?{recorded_values}:{}),...(input.isolated?{context_id:input.command_id}:{}),command_id:input.command_id,work_id:work,purpose,...(input.computation_context?.role==='method_review'||purpose==='conclusion_strategy_review'&&config.businessPolicy?.postReportReview?{resource_reads}:{}),...(input.computation_context?{computation_context:structuredClone(input.computation_context)}:{})};
   let text=result.value;if(purpose==='report_edit'||purpose==='report_revision'){await assertCompleted(input.identity,completion);try{text=(await files.report()).text;}catch(error){if(Reflect.get(error as object,'code')!=='ENOENT')throw error;}text=requireReportMarkdown(text);}
   if(executions.length||input.verification_inputs||config.businessPolicy?.postReportReview&&(input.isolated||input.computation_context||purpose==='conclusion_strategy_review')){
    await assertCompleted(input.identity,completion);const events=state.readAudit(task).filter(e=>e.runId===result.runId);
    for(const fact of executions)if(!events.some(e=>e.kind==='tool.finished'&&e.toolName==='bash'&&e.invocation?.invocationId===fact.invocation_id&&e.toolOutcome?.status==='completed'&&(e.toolOutcome.modelOutput==='ready'||fact.exit_code!==0&&e.toolOutcome.modelOutput==='failed'&&e.toolOutcome.refusal?.phase==='post-effect'&&e.toolOutcome.refusal.exitCode===fact.exit_code)))fault('EFFECT_UNCONFIRMED');
    const completed={...completion,...(executions.length||input.verification_inputs?{executions}:{})},directory=resolve(root,'.juanerai/post-report-executions'),file=resolve(directory,hash(completion.id)+'.json'),proof=JSON.stringify({identity:input.identity,completion:completed,text});mkdirSync(directory,{recursive:true,mode:0o700});writeFileSync(file,proof,{encoding:'utf8',mode:0o600,flag:'wx'});
    check();return {text,provider:result.modelOutcome?.model.provider??model.provider,model:result.modelOutcome?.model.id??model.id,completion:completed};
   }
   check();return {text,provider:result.modelOutcome?.model.provider??model.provider,model:result.modelOutcome?.model.id??model.id,completion};
   }
   return {engine,request,finish,task,purpose,input,check};
 }
 return Object.freeze({configuration:()=>configuration,recipient:(purpose:AnalysisPurpose)=>{if(!purposes.includes(purpose))fault('INVALID_REQUEST');const m=models(config.analysisModel,purpose)[0]!;return {provider:m.provider,model:m.id};},diagnostics,assertCompleted,assertInvocation,conversation,
  async advance(input:AnalysisAgentTurn){
   const plan=await prepare(input);const {engine,task,purpose,check}=plan;
   let session=input.isolated?undefined:state.readSession(task,purpose);if(!session){check();session=(await engine.create(input.signal)).id;state.selectSession(task,purpose,session);}
   const priorUserEntries=purpose==='requirement_design'?new Set((await engine.history(session,undefined,input.signal)).map(entry=>entry.id)):undefined;
   liveHandles.set(engine,task);const running=engine.run({...plan.request,sessionId:session});
   void engine.waitForIdle(task).then(()=>liveHandles.delete(engine),()=>{});
   const result=await running;
   if(priorUserEntries&&input.recordUserInputs){const words=(await engine.history(session,undefined,new AbortController().signal)).filter(entry=>!priorUserEntries.has(entry.id)&&entry.message?.role==='user'&&entry.message.text!==input.prompt).map(entry=>entry.message!.text);await input.recordUserInputs(words);}
   return plan.finish(result,session);
  },
  async waitForIdle(scope?:Parameters<AnalysisAgent['waitForIdle']>[0]){const selected=scope?taskReference(scope.task_id,scope.revision,scope.purpose):undefined;await Promise.all([...liveHandles].filter(([,task])=>selected===undefined||task===selected).map(([engine,task])=>engine.waitForIdle(task)));},
 });
}
