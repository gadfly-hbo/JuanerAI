import {captureAnalysisToolContracts} from './analysis-tool-contracts.ts';
import {relative,isAbsolute} from 'node:path';
import {createExecutionTools,type Tool,type JsonValue} from 'pi-agent-runtime';
import type {AnalysisRuntimeDiagnostics,AnalysisDiagnosticCode} from '../../packages/ports/open-analysis-runtime.ts';
import {createAnalysisCodeDraft} from './analysis-code-draft.ts';
import {resolve} from 'node:path';
import {firstLoopBusinessTools,firstLoopToolView} from './first-loop-tools.ts';
import {nativeDelegationWire} from './native-delegation-wire.ts';
import {Check} from 'typebox/value';
import type {TSchema} from 'typebox';
import {closedTerminalJson,desktopAssistanceSystemPrompt} from './desktop-assistance-codec.ts';
import {canonicalDesktopJson,validateDesktopAssistancePayload,validateDesktopAssistanceDraft} from '../../packages/product-core/xanthil-desktop-decision-case.ts';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readdirSync,readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {createSessionRuntime,createPiTransport,loadHarnessResources,admitModelRequest,RuntimeFault,ProviderFailure,ModelFailure,type ContextAdmissionPolicy,type ModelOutcome,type ModelTransport,type ModelConfig,type SessionRuntime} from 'pi-agent-runtime';
import {createApprovedProviderCredentials} from './provider-credentials.ts';
import {assistantPrompt,validateAssistantOutput} from './case-assistant.ts';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {membershipModelTurn,membershipModelPrompt,membershipModelOutput,membershipModelResultHash} from '../../packages/product-core/member-model.ts';
import {createPersistentRuntimeState,approvedUncappedAnalysisLimits,approvedFirstLoopAnalysisLimits} from './persistent-runtime-state.ts';
import {createSharedAnalysisTool,createNativeBusinessTools} from './open-analysis.ts';
import type {OpenAnalysisRuntime,OpenAnalysisRun,AnalysisHistoryMessage,AnalysisSessionView} from '../../packages/ports/open-analysis-runtime.ts';
import type {AnalysisRequestLedger} from '../../packages/ports/analysis-request-ledger.ts';

const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const primary:ModelConfig={provider:'minimax-cn',id:'MiniMax-M3',protocol:'anthropic-messages',endpoint:'https://api.minimaxi.com/anthropic',contextWindow:200000,maxOutputTokens:4096};
const retained:ModelConfig={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-pro',protocol:'openai-completions',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:2048};
const backup:ModelConfig={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-flash',protocol:'openai-completions',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',contextWindow:1048576,maxOutputTokens:4096};
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}

function observedTokens(value:ModelOutcome['usage']['inputTokens'],final:boolean):import('../../packages/product-core/member-operation.ts').Meter{
 if(final&&value.kind==='known')return {kind:'known',value:String(value.value)};
 const lower=value.kind==='known'?value.value:value.reported;
 return {kind:'unknown',reason:lower===undefined?'provider_not_reported':'provider_partial',...lower===undefined?{}:{known_lower_bound:String(lower)}};
}
function unconfirmedReply(model:ModelConfig):ModelOutcome{
 return {model:{provider:model.provider,id:model.id,protocol:model.protocol},stop:'unknown',category:'invalid-output',physicalStatus:'unknown',usageFinal:false,usage:{inputTokens:{kind:'unknown'},outputTokens:{kind:'unknown'}},diagnostic:'UNKNOWN'};
}

/** Only this Adapter consumes SDK sessions. Business state and effects remain in the Application. */
type ReportThinkingMigrationInput=Readonly<{identity:OpenAnalysisRun['identity'];signal:AbortSignal;authorize:()=>boolean;approval:string;expectedAccounting:string;expectedLedger:string}>;
type CancelledReportInput=ReportThinkingMigrationInput&Readonly<{target:Readonly<{session:string;branch:string;operation:string}>;provePhysicalStop:()=>Readonly<{identity:OpenAnalysisRun['identity'];request_id:string;process_closed:boolean;physical_closed:boolean;stop_receipt_sha256:string;process_exit_sha256:string}>|null}>;
type InterruptedStopInput=ReportThinkingMigrationInput&Readonly<{expectedLock:string;arguments:Readonly<{step_id:string}>;provePreExecution:()=>Readonly<{task_sha256:string;step_id:string;identity:OpenAnalysisRun['identity']}>|null}>;
export function createPiSessionOpenAnalysisRuntime(config:{runPolicy?:'unified-v1';sharedWorkRecovery?:'v1';r1r4?:Readonly<{contextAdmission:ContextAdmissionPolicy}>;firstLoop?:'v0.2';projectRoot:string;longArtifactsForTask?:(task_id:string)=>boolean;ledger:AnalysisRequestLedger;credentials:ReturnType<typeof createApprovedProviderCredentials>;reviewPolicy?:(task_id:string)=>boolean;reportPro60ForTask?:(task_id:string)=>boolean;reportTimeoutForTask?:(task_id:string)=>60000|120000|undefined;judgmentReviewModelForTask?:(task_id:string)=>'MiniMax-M3'|'mimo-v2.6-pro'|undefined;judgmentReviewThinkingForTask?:(task_id:string)=>boolean;judgmentReviewTimeoutForTask?:(task_id:string)=>30000|60000;modelTransport?:ModelTransport;fetch?:typeof globalThis.fetch;legacyCredential?:()=>string;modelTimeoutMs?:number;preparationSnapshots?:'v1';analysisModel?:'MiniMax-M3'|'mimo-v2.6-flash';mimoThinking?:'off';reportThinking?:'off';nativeObjectArguments?:boolean}):OpenAnalysisRuntime&{migrateLongArtifacts:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;recoverCancelledReport:(input:CancelledReportInput)=>Promise<Readonly<{status:'aborted';operation:string;reconciliation:string}>>;recoverInterruptedStop:(input:InterruptedStopInput)=>Promise<Readonly<{status:'aborted';operation:string;reconciliation:string}>>;migrateReportTimeout:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateReportPro60:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateReportThinking:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateJudgmentReviewModel:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateJudgmentReviewTimeout:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateJudgmentReviewProOff:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateJudgmentReviewPro:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>;migrateJudgmentReviewThinking:(input:ReportThinkingMigrationInput)=>Promise<Readonly<{from:string;to:string;approval:string;reconciliation:string;accounting:string}>>}{
 if(config.firstLoop!==undefined&&config.firstLoop!=='v0.2')fail('INVALID_REQUEST');
 const firstLoop=config.firstLoop==='v0.2';
 const unified=config.runPolicy==='unified-v1';
 if(config.runPolicy!==undefined&&(!unified||!firstLoop||config.sharedWorkRecovery!=='v1'||!config.r1r4))fail('INVALID_REQUEST');
 const preparation=config.preparationSnapshots==='v1';
 if(config.preparationSnapshots!==undefined&&(config.preparationSnapshots!=='v1'||!config.r1r4))fail('INVALID_REQUEST');
 const observesModels=config.r1r4!==undefined,admissionPolicy=config.r1r4?Object.freeze(structuredClone(config.r1r4.contextAdmission)):undefined;
 const modelObservations=observesModels?{modelObservations:'v1' as const}:{};
 const sharedWork=config.sharedWorkRecovery==='v1';
 // Fixed harness.5 uses public ModelAttempt for the selected shared work; it does not implement the unpublished115 workPolicy.
 // Reject the affected selection, never silently lose its durable recovery guard.
 if(config.longArtifactsForTask&&config.sharedWorkRecovery!=='v1')fail('CAPABILITY_UNAVAILABLE');
 if(config.sharedWorkRecovery!==undefined&&(config.sharedWorkRecovery!=='v1'||!firstLoop||!observesModels))fail('INVALID_REQUEST');
 if(config.nativeObjectArguments!==undefined&&typeof config.nativeObjectArguments!=='boolean')fail('INVALID_REQUEST');
 const nativeObjects=config.nativeObjectArguments===true;
 const reviewEnabled=(input:Pick<OpenAnalysisRun,'identity'|'judgmentReview'>)=>config.reviewPolicy?config.reviewPolicy(input.identity.task_id):input.judgmentReview===true;
 if(config.modelTimeoutMs!==undefined&&(!Number.isSafeInteger(config.modelTimeoutMs)||(unified||firstLoop&&!sharedWork?config.modelTimeoutMs!==600000:config.modelTimeoutMs!==30000&&config.modelTimeoutMs!==60000)))fail('INVALID_REQUEST');
 if(config.analysisModel!==undefined&&config.analysisModel!=='MiniMax-M3'&&config.analysisModel!=='mimo-v2.6-flash')fail('INVALID_REQUEST');
 if(config.mimoThinking!==undefined&&(config.mimoThinking!=='off'||config.analysisModel!=='mimo-v2.6-flash'))fail('INVALID_REQUEST');
 if(config.reportThinking!==undefined&&config.reportThinking!=='off')fail('INVALID_REQUEST');
 // Trusted composition choice, captured once and included in SDK's immutable Task purpose configuration.
 const primaryModel:ModelConfig=unified||firstLoop&&!sharedWork?{...primary,maxOutputTokens:32768}:primary;
 const backupModel:ModelConfig=unified||firstLoop&&!sharedWork?{...backup,maxOutputTokens:16384}:backup;
 const analysisPrimary=unified?{...backupModel,maxOutputTokens:32768}:backupModel;
 const analysisModel:ModelConfig=config.analysisModel==='mimo-v2.6-flash'?(config.mimoThinking==='off'?{...analysisPrimary,reasoning:true,thinkingProtocol:'mimo-chat'}:analysisPrimary):primaryModel;
 const reportPrimary=unified?{...backupModel,maxOutputTokens:32768}:backupModel;
 const retainedModel=unified?{...retained,maxOutputTokens:32768}:retained;
 const legacyReportModel:ModelConfig=config.reportThinking==='off'?{...reportPrimary,reasoning:true,thinkingProtocol:'mimo-chat'}:reportPrimary;
 const reportPro60=(task:string)=>{const value=config.reportPro60ForTask?.(task);if(value!==undefined&&typeof value!=='boolean')fail('INVALID_REQUEST');if(value===true&&(config.reportThinking!=='off'||!unified&&config.modelTimeoutMs!==undefined||config.reviewPolicy?.(task)!==true||config.judgmentReviewTimeoutForTask?.(task)!==60000||config.judgmentReviewModelForTask?.(task)!==undefined||config.judgmentReviewThinkingForTask?.(task)===true))fail('AUTHORITY_REQUIRED');return value===true;};
 const reportTimeout=(task:string)=>{const value=config.reportTimeoutForTask?.(task);if(value!==undefined&&value!==60000&&value!==120000)fail('INVALID_REQUEST');if(value!==undefined&&!reportPro60(task))fail('AUTHORITY_REQUIRED');return unified?600000:value??(reportPro60(task)?60000:reviewTimeout(task)===60000?30000:limits.modelTimeoutMs);};
 const analysisCandidates=config.analysisModel==='mimo-v2.6-flash'?[analysisModel,unified?{...primaryModel,maxOutputTokens:16384}:primaryModel]:[analysisModel,backupModel];
 const reportModel=(task:string):ModelConfig=>reportPro60(task)?{...legacyReportModel,id:'mimo-v2.6-pro'}:legacyReportModel;
 const reportCandidates=(task:string)=>reportPro60(task)?[reportModel(task)]:[reportModel(task),unified?{...primaryModel,maxOutputTokens:16384}:primaryModel];
 const judgmentThinking=(task:string)=>{const value=config.judgmentReviewThinkingForTask?.(task);if(value!==undefined&&typeof value!=='boolean')fail('INVALID_REQUEST');return value===true;};
 const judgmentModel=(task:string):ModelConfig=>{const selected=config.judgmentReviewModelForTask?.(task),thinking=judgmentThinking(task);if(selected!==undefined&&!['MiniMax-M3','mimo-v2.6-pro'].includes(selected)||thinking&&selected==='MiniMax-M3')fail('INVALID_REQUEST');const model:ModelConfig=selected==='MiniMax-M3'?primary:selected==='mimo-v2.6-pro'?{...backup,id:'mimo-v2.6-pro',reasoning:true,thinkingProtocol:'mimo-chat'}:thinking?{...backup,reasoning:true,thinkingProtocol:'mimo-chat'}:legacyReportModel;return unified?{...model,maxOutputTokens:32768}:model;};
 const baseLimits=unified||firstLoop&&!sharedWork?approvedFirstLoopAnalysisLimits:approvedUncappedAnalysisLimits;
 const limits=Object.freeze({...baseLimits,modelTimeoutMs:config.modelTimeoutMs??baseLimits.modelTimeoutMs});
 const reviewTimeout=(task:string)=>{const value=config.judgmentReviewTimeoutForTask?.(task);if(value!==undefined&&value!==30000&&value!==60000)fail('INVALID_REQUEST');if(value===60000&&(!unified&&config.modelTimeoutMs!==undefined||config.reviewPolicy?.(task)!==true||(judgmentModel(task).id!=='mimo-v2.6-pro'&&(judgmentModel(task).id!==backup.id||judgmentThinking(task)))))fail('AUTHORITY_REQUIRED');return value??30000;};
 const taskLimits=(task:string)=>{if(unified)return limits;const scoped=firstLoop&&!sharedWork&&config.reviewPolicy?.(task)===true?Object.freeze({...limits,maxOutputTokens:4096}):limits;return reportTimeout(task)===120000?Object.freeze({...scoped,modelTimeoutMs:120000}):reviewTimeout(task)===60000?Object.freeze({...scoped,modelTimeoutMs:60000}):scoped;};
 const state=createPersistentRuntimeState({projectRoot:config.projectRoot,...(unified?{runPolicy:config.runPolicy}:{}),historicalUsage:task=>{
  const rows=config.ledger.read(task);
  // Existing physical history needs explicit reconciliation; never synthesize a zero ledger.
  return {fingerprint:hash(rows),reconciled:rows.length===0,usage:{modelCalls:0,toolCalls:0,outputTokens:0,resourceUnits:0,activeMs:0}};
 }});
 let cancelledReportCheck:((task:string,session:string,branch:string,operation:string)=>boolean)|undefined;
 let interruptedProof:{owner:string;operation:string;invocation:string;digest:string}|undefined;
 let current:OpenAnalysisRun|undefined,delegationCorrectionPending=false,modelTurn=0,knownIdleAbort=false,migrationRetiring=false;const runtimes=new Map<string,SessionRuntime>();
 const observations:{name:string;result:unknown}[]=[],discoveredContracts=new Map<string,string>();let contractDisclosureTurn:number|undefined;
 const live=()=>{if(!current)fail('AUTHORITY_REQUIRED');return current;};
 const currentWork=()=>state.businessWork.begin(live());
 const workAudit={append:async(event:Parameters<typeof state.audit.append>[0],signal:AbortSignal)=>{const id=state.businessWork.findRun(event.taskId,event.runId)??currentWork().id;await state.appendWorkAudit(id,event,signal);}};
 // Idle readbacks borrow authorization context, not the writer slot. Finish that
 // context before admitting a new writer; real writers still reject overlap.
 let readCompletion:Promise<void>|undefined;
 function beginRead(){let resolve!:()=>void;readCompletion=new Promise<void>(done=>{resolve=done;});return ()=>{readCompletion=undefined;resolve();};}
 async function awaitReads(signal:AbortSignal){
  while(readCompletion){
   if(signal.aborted)fail('CANCELLED');let abort!:()=>void;
   try{await Promise.race([readCompletion,new Promise<never>((_,reject)=>{abort=()=>reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'}));signal.addEventListener('abort',abort,{once:true});})]);}
   finally{if(abort)signal.removeEventListener('abort',abort);}
  }
 }

const candidateIdentity=(model:ModelConfig)=>hash([model.provider,model.id,model.protocol,model.endpoint,model.contextWindow,model.maxOutputTokens,model.reasoning??false,model.thinkingProtocol??null,model.input??['text'],model.deferred??false,model.proxyEndpoint??null]);
const candidateAllowed=(model:ModelConfig)=>((current?.purpose==='retained_case')?[retainedModel]:current?.purpose==='conclusion_strategy_review'?[judgmentModel(current.identity.task_id)]:current?.purpose==='report_edit'?(reviewEnabled(current)?[reportModel(current.identity.task_id)]:reportCandidates(current.identity.task_id)):current&&reviewEnabled(current)?[analysisModel]:analysisCandidates).some(candidate=>candidateIdentity(candidate)===candidateIdentity(model));
let modelAdmission:{task:string;run:string;sequence:number}|undefined;
const modelReceipts=new Map<string,{request_id:string;input_sha256:string;provider:string;model:string}>();
const audit:typeof state.audit={async append(event,signal){
  const key=modelAdmission?.task===event.taskId&&modelAdmission.run===event.runId?modelAdmission.run+':'+modelAdmission.sequence:undefined,receipt=key?modelReceipts.get(key):undefined;
  const linked=observesModels&&event.kind==='model.finished'&&event.digest===undefined&&receipt&&receipt.provider===event.provider&&receipt.model===event.model;
  await (sharedWork?workAudit:state.audit).append(linked?{...event,digest:requestReceiptDigest(receipt)}:event,signal);
  if(event.kind==='model.admitted')modelAdmission={task:event.taskId,run:event.runId,sequence:event.sequence};
  if(linked&&key&&!signal.aborted)modelReceipts.delete(key);
 }};
 const transport:ModelTransport=async request=>{
  delegationCorrectionPending=false;modelTurn++;
  const input=live();if(migrationRetiring)throw new RuntimeFault('AUTHORITY_REQUIRED');if(request.signal.aborted||input.signal.aborted||!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');
  // The SDK fixes its capability declarations for Task identity; the trusted Provider projection advertises only this phase.
  const contracts=firstLoop?captureAnalysisToolContracts(input.tools,true):input.tools;
  const modelRequest=!firstLoop&&nativeBusinessPhase(input)?{...request,messages:request.messages.map(m=>m.tools?{...m,tools:m.tools.filter(t=>t.name==='read'&&observesModels&&!!input.readSelectedMaterial||contracts.some(allowed=>allowed.name===t.name)).map(t=>{
   if(t.name==='read')return t;
   const business=contracts.find(allowed=>allowed.name===t.name)!,parameters=business.modelParameters??business.parameters;
   if(objectMode(input))return {...t,description:business.description,parameters:structuredClone(parameters) as import('pi-agent-runtime').JsonObject};
   const large=input.toolDiscovery&&Buffer.byteLength(JSON.stringify(parameters))>8192,deferred=large&&discoveredContracts.get(t.name)!==hash(parameters);
   // Reuse the compatible Adapter's object/array selection; transport never repairs the business object.
   const structured=Object.values((parameters as {properties?:Record<string,{type?:string;anyOf?:{type?:string}[]}>}).properties??{}).some(p=>p.type==='array'||p.type==='object'||p.anyOf?.some(x=>x.type==='object'||x.type==='array')),jsonText=large||structured;
   return {...t,description:business.description+(jsonText?' 本原生命名工具仅用arguments_json传输完整业务JSON对象的序列化字符串，不用XML/item包装；字符串内参数遵循工具描述或read_tool_contract返回的原始schema，后台不修复。':'')+(jsonText&&!large?' 原始业务参数合同：'+JSON.stringify(parameters):'')+(deferred?' 先使用read_tool_contract读取当前完整业务合同；此传输声明不代替业务校验或执行授权。':''),parameters:(jsonText?{type:'object',properties:{arguments_json:{type:'string',maxLength:262144,description:'Exact serialized original business JSON object. Use the supplied original contract or read_tool_contract; preserve all required fields and actual arrays/nulls.'}},required:['arguments_json'],additionalProperties:false}:structuredClone(parameters)) as import('pi-agent-runtime').JsonObject};
  })}:m)}:request;
  const reviewJson=input.purpose==='conclusion_strategy_review'&&reviewEnabled(input)&&request.model.provider===backup.provider&&[backup.id,'mimo-v2.6-pro'].includes(request.model.id);
  const provider=request.model.provider;if(provider!=='minimax-cn'&&provider!=='xiaomi-token-plan-cn')fail('OUTBOUND_FORBIDDEN');
  if(observesModels&&!candidateAllowed(request.model))throw new ModelFailure({model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'error',category:'invalid-request',physicalStatus:'not-sent',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'},'AUTHORITY_REQUIRED');
  const purposeProtection=unified?600000:input.purpose==='report_edit'?reportTimeout(input.identity.task_id):input.purpose==='conclusion_strategy_review'?(reviewTimeout(input.identity.task_id)===60000?60000:limits.modelTimeoutMs):limits.modelTimeoutMs,purposeDeadline=purposeProtection<taskLimits(input.identity.task_id).modelTimeoutMs?new AbortController():undefined;let expired=false;const deadline=purposeDeadline?setTimeout(()=>{expired=true;purposeDeadline.abort();},purposeProtection):undefined;
  const boundedRequest={...modelRequest,maxOutputTokens:input.purpose==='retained_case'?Math.min(modelRequest.maxOutputTokens,retainedModel.maxOutputTokens!):modelRequest.maxOutputTokens,signal:AbortSignal.any([request.signal,input.signal,...(purposeDeadline?[purposeDeadline.signal]:[])])};
  if(observesModels&&!admissionPolicy)throw new ModelFailure({model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop:'error',category:'invalid-request',physicalStatus:'not-sent',usageFinal:true,usage:{inputTokens:{kind:'known',value:0},outputTokens:{kind:'known',value:0}},diagnostic:'REQUEST_FAILED'},'CAPABILITY_UNAVAILABLE');
  if(admissionPolicy)admitModelRequest(boundedRequest,admissionPolicy);
  const receipt=config.ledger.reserve({...input.identity,operation_id:randomUUID(),input_sha256:hash(boundedRequest.messages),provider,model:request.model.id as 'MiniMax-M3'|'mimo-v2.6-flash'|'mimo-v2.6-pro'});
  if(observesModels&&modelAdmission?.task===input.identity.task_id)modelReceipts.set(modelAdmission.run+':'+modelAdmission.sequence,{request_id:receipt.request_id,input_sha256:receipt.input_sha256,provider:receipt.provider,model:receipt.model});
  const began=performance.now();config.ledger.issue(receipt.request_id);
  try{
   const result=config.modelTransport?await config.modelTransport(boundedRequest):input.purpose==='retained_case'?await (async()=>{if(input.purpose!=='retained_case'||!config.legacyCredential)fail('AUTHORITY_REQUIRED');const key=config.legacyCredential();if(!key||request.messages.some(m=>m.text.includes(key)))fail('OUTBOUND_FORBIDDEN');return createPiTransport({model:retainedModel,apiKey:key,fetch:config.fetch,...modelObservations})(boundedRequest);})():await config.credentials.withCredential(provider,async credential=>{
    if(credential.endpoint!==request.model.endpoint||credential.model!==request.model.id&&!((reviewJson||input.purpose==='report_edit'&&reportPro60(input.identity.task_id))&&request.model.id==='mimo-v2.6-pro'&&credential.model===backup.id))fail('OUTBOUND_FORBIDDEN');
    // Use the SDK's existing host-controlled fetch leaf. No new transport,
    // provider, retry or reply repair: JSON mode only constrains wire syntax.
    const fetchReview:typeof globalThis.fetch=async(url,init)=>{
     const target=url instanceof Request?url.url:String(url);if(target!==backup.endpoint+'/chat/completions'||init?.method?.toUpperCase()!=='POST'||typeof init.body!=='string')fail('OUTBOUND_FORBIDDEN');
     let body:Record<string,unknown>;try{body=JSON.parse(init.body);}catch{fail('OUTBOUND_FORBIDDEN');}
     if(body!.model!==request.model.id||Array.isArray(body!.tools)&&body!.tools.length||body!.response_format!==undefined)fail('OUTBOUND_FORBIDDEN');
     return (config.fetch??globalThis.fetch)(url,{...init,body:JSON.stringify({...body!,response_format:{type:'json_object'}})});
    };
    const call=createPiTransport({model:request.model,apiKey:credential.key,fetch:reviewJson?fetchReview:config.fetch,...modelObservations});return call(boundedRequest);
   });
   if(observesModels&&!result.outcome)throw new ModelFailure(unconfirmedReply(request.model),'INVALID_OUTPUT');
   const outcome=observesModels&&result.outcome?new ModelFailure(result.outcome).outcome:undefined;
   if(outcome&&(outcome.model.provider!==request.model.provider||outcome.model.id!==request.model.id||outcome.model.protocol!==request.model.protocol||outcome.stop!==result.stop||(outcome.usage.inputTokens.kind==='known'&&outcome.usage.inputTokens.value!==result.usage.inputTokens)||(outcome.usage.outputTokens.kind==='known'&&outcome.usage.outputTokens.value!==result.usage.outputTokens)||outcome.physicalStatus==='not-sent'))throw new ModelFailure(unconfirmedReply(request.model),'INVALID_OUTPUT');
   if(outcome?.physicalStatus==='unknown')throw new ModelFailure({...outcome,usageFinal:false});
   // The retained business contract requires one complete JSON value. A native
   // Agent summary cannot turn a truncated structured response into that value.
   if(outcome&&result.stop==='length'&&(sharedWork||reviewEnabled(input)||input.purpose==='retained_case'||input.purpose==='report_edit'&&input.prompt.startsWith('JuanerAI.report-edit.v1\n')))throw new ModelFailure(outcome,'INVALID_OUTPUT');
   if(expired){if(outcome)throw new ModelFailure(outcome,'DEADLINE_EXCEEDED');throw new RuntimeFault('DEADLINE_EXCEEDED');}
   const cancelled=request.signal.aborted||input.signal.aborted||!input.authorize();
   const settled=config.ledger.settle(receipt.request_id,{status:cancelled?'cancelled':'succeeded',reason:cancelled?'REQUEST_CANCELLED':'REQUEST_SUCCEEDED',usage:{input_tokens:outcome?observedTokens(outcome.usage.inputTokens,outcome.usageFinal):{kind:'known',value:String(result.usage.inputTokens)},output_tokens:outcome?observedTokens(outcome.usage.outputTokens,outcome.usageFinal):{kind:'known',value:String(result.usage.outputTokens)},active_ms:{kind:'known',value:String(Math.floor(performance.now()-began))},wait_ms:{kind:'known',value:'0'}}});
   if(!settled.publishable||request.signal.aborted||input.signal.aborted||!input.authorize()){if(outcome)throw new ModelFailure(outcome,'CANCELLED');throw new RuntimeFault('CANCELLED');}return result;
  }catch(error){
   const row=config.ledger.read(input.identity.task_id).find(r=>r.request_id===receipt.request_id);
   const carrier=observesModels&&(error instanceof ModelFailure||error instanceof ProviderFailure)?error.outcome:undefined;
   const outcome=carrier&&carrier.model.provider===request.model.provider&&carrier.model.id===request.model.id&&carrier.model.protocol===request.model.protocol?carrier:undefined;
   const unconfirmed=observesModels&&(!outcome||outcome.physicalStatus==='unknown');
   if(row&&['issued','reserved'].includes(row.status))config.ledger.settle(receipt.request_id,{status:unconfirmed?'unknown':expired?'cancelled':error instanceof ProviderFailure?'temporary_failure':request.signal.aborted?'cancelled':outcome?'failed':'unknown',reason:unconfirmed?'REQUEST_UNCONFIRMED':expired?'REQUEST_CANCELLED':error instanceof ProviderFailure?'REQUEST_FAILED':request.signal.aborted?'REQUEST_CANCELLED':outcome?'REQUEST_FAILED':'REQUEST_UNCONFIRMED',usage:{input_tokens:outcome?observedTokens(outcome.usage.inputTokens,outcome.usageFinal):{kind:'unknown',reason:'provider_not_reported'},output_tokens:outcome?observedTokens(outcome.usage.outputTokens,outcome.usageFinal):{kind:'unknown',reason:'provider_not_reported'},active_ms:{kind:'known',value:String(Math.floor(performance.now()-began))},wait_ms:{kind:'known',value:'0'}}});throw error;
  }finally{if(deadline)clearTimeout(deadline);}
 };
 // A durable owner selects the immutable registry. Opt-in never migrates an existing Task.
 const objectMode=(input:OpenAnalysisRun)=>firstLoop||['analysis_objects','proposal_objects'].some(p=>!!state.readSession(input.identity.task_id,p))||nativeObjects&&!state.hasNativeSession(input.identity.task_id);
 const nativeMode=(input:OpenAnalysisRun)=>objectMode(input)||!!state.readSession(input.identity.task_id,'analysis_native')||!!input.nativeBusinessTools&&!state.hasNativeSession(input.identity.task_id);
 let longIdentityOverride:boolean|undefined;
 const longMode=(input:OpenAnalysisRun)=>longIdentityOverride??config.longArtifactsForTask?.(input.identity.task_id)===true;
 const nativeBusinessPhase=(input:OpenAnalysisRun)=>longMode(input)&&input.purpose==='report_edit'||((input.purpose??'analysis')==='analysis'&&nativeMode(input))||(input.purpose==='proposal_prepare'&&objectMode(input));
 const sessionOwner=(input:OpenAnalysisRun)=>{const purpose=input.purpose??'analysis',owner=purpose==='analysis'?(objectMode(input)?'analysis_objects':nativeMode(input)?'analysis_native':purpose):purpose==='proposal_prepare'&&objectMode(input)?'proposal_objects':purpose;return input.conversation_id&&input.conversation_id!==input.identity.task_id?owner+':'+input.conversation_id:owner;};
 const owns=(task:string,session:string)=>!!current&&(current.purpose==='retained_case'||current.conversation_id?state.ownsSession(task,sessionOwner(current),session):['analysis','analysis_native','analysis_objects','proposal_objects','proposal_prepare','report_edit',...(reviewEnabled(current)?['conclusion_strategy_review']:[])].some(p=>state.ownsSession(task,p,session)));
 const requestReceiptDigest=(receipt:{request_id:string;input_sha256:string;provider:string;model:string})=>hash([receipt.request_id,receipt.input_sha256,receipt.provider,receipt.model]);
 const modelDiagnostic=(outcome:ModelOutcome):AnalysisDiagnosticCode=>outcome.diagnostic==='OUTPUT_LIMIT'?'OUTPUT_INCOMPLETE':outcome.diagnostic==='CONTEXT_LIMIT'?'CONTEXT_LIMIT':outcome.diagnostic==='CANCELLED'?'CANCELLED':outcome.category?({'quota':'QUOTA_EXCEEDED','rate-limit':'RATE_LIMITED','unavailable':'MODEL_UNAVAILABLE','network':'NETWORK_UNCONFIRMED','authentication':'CREDENTIAL_INVALID','invalid-request':'REQUEST_REJECTED','invalid-output':'INVALID_RESULT','safety':'SAFETY_BLOCKED','context':'CONTEXT_LIMIT','unknown':'UNKNOWN'} as const)[outcome.category]:outcome.diagnostic==='COMPLETE'?'COMPLETE':'UNKNOWN';
 const readFailureCategory=(value:unknown):import('../../packages/ports/open-analysis-runtime.ts').AnalysisFileFailureCategory=>{switch(value){case 'not_found':case 'not_directory':case 'is_directory':case 'permission_denied':case 'invalid':case 'not_supported':case 'cancelled':case 'timeout':case 'limit_exceeded':return value;default:return 'unknown';}};
 const invocationKey=(invocation:NonNullable<Parameters<Tool['execute']>[2]>)=>JSON.stringify([invocation.sessionId,invocation.branch,invocation.operationId,invocation.invocationId,invocation.toolCallId]);
 const sharedToolProducers=new Map<string,string|undefined>();
 const tool=createSharedAnalysisTool(live,()=>modelTurn,observesModels),nativeTools=createNativeBusinessTools(live,()=>modelTurn,(name,args,signal)=>{
  const input=live();if(signal.aborted||input.signal.aborted)fail('CANCELLED');if(!input.authorize())fail('AUTHORITY_REQUIRED');
  // Availability and business yields remain the dispatcher's authority; never expose an unavailable contract.
  const candidates=input.tools.filter(t=>t.name===name);if(candidates.length!==1||input.shouldYield?.()||!nativeBusinessPhase(input)||!input.toolDiscovery)return undefined;
  if(contractDisclosureTurn===modelTurn)return {status:'deferred',code:'AWAITING_TOOL_CONTRACT',executed:false,instruction:'Previous operation returned its exact contract without execution. Observe that feedback in the next model turn and explicitly submit any still-needed operation; no automatic replay.'};
  const business=candidates[0],parameters=business.modelParameters??business.parameters;if(Buffer.byteLength(JSON.stringify(parameters))<=8192||discoveredContracts.get(name)===hash(parameters))return undefined;
  // Correct original submissions need no discovery gate; the dispatcher still enforces every business and authority check.
  try{if(Check(business.parameters as TSchema,args))return undefined;}catch{fail('TOOL_ARGUMENT_INVALID');}
  discoveredContracts.set(name,hash(parameters));contractDisclosureTurn=modelTurn;
  const result={status:'tool_contract',name,description:business.description,parameters:parameters as import('pi-agent-runtime').JsonObject,executed:false,instruction:'Exact current contract returned; original arguments were not validated or executed. In the next model turn explicitly submit parameters matching this contract. No business result or verification has occurred.'};observations.push({name,result});return result;
 },config.longArtifactsForTask?['build_artifact']:[],observesModels);
 const legacyNativeTools=nativeTools.filter(t=>t.name!=='build_artifact');
 const artifactDirectory=resolve(config.projectRoot,'selected-analysis-materials'),artifactPath=resolve(artifactDirectory,'draft/report.json');
  function artifactFile(){const input=live();if(!sharedWork||input.purpose!=='report_edit'||!input.artifactFile||input.signal.aborted||!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');return input.artifactFile;}
  const artifactFileTools=sharedWork?createExecutionTools({cwd:artifactDirectory,policyVersion:'juanerai-report-file-v1',resolvePath:async location=>{artifactFile();const path=resolve(artifactDirectory,location);if(path!==artifactPath)throw new RuntimeFault('AUTHORITY_REQUIRED');return path;},read:async(path,signal)=>{if(path!==artifactPath)throw new RuntimeFault('AUTHORITY_REQUIRED');return artifactFile().read(signal);},stat:async(path,signal)=>{if(path!==artifactPath)throw new RuntimeFault('AUTHORITY_REQUIRED');return {path,name:'report.json',kind:'file',size:(await artifactFile().read(signal)).byteLength,modifiedAt:0};},write:async(path,bytes,signal)=>{if(path!==artifactPath)throw new RuntimeFault('AUTHORITY_REQUIRED');await artifactFile().write(bytes,signal);},exec:async()=>{throw new RuntimeFault('CAPABILITY_UNAVAILABLE');}},['read','write','edit']):[];
  const completeArtifact:Tool={name:'complete_artifact',description:'Submit the complete current report file for business sealing. The host binds its identity and version; this does not qualify its numbers, review or delivery.',parameters:{type:'object',properties:{},required:[],additionalProperties:false},effect:'write',resourceUnits:1,executionMode:'sequential',policyVersion:'juanerai-report-completion-v1',execute:async(args,signal)=>{artifactFile();const tool=live().tools.find(t=>t.name==='complete_artifact');if(!tool)throw new RuntimeFault('AUTHORITY_REQUIRED');return await tool.execute(args,signal) as JsonValue;}};
  const reportTools=()=>longMode(live())?[...nativeTools.filter(t=>t.name==='build_artifact'),...(sharedWork?[...artifactFileTools,completeArtifact]:[])]:[];
 const currentNativeTools=()=>[...(longMode(live())?nativeTools:legacyNativeTools),...readTools];

const materialDirectory=resolve(config.projectRoot,'selected-analysis-materials');
function materialLocation(path:string){const location=relative(materialDirectory,path);if(isAbsolute(location)||location==='..'||location.startsWith('../')||!location.startsWith('source/')&&! /^evidence\/[a-f0-9]{64}\/facts\.txt$/.test(location)&&! /^meaning\/[a-f0-9]{64}\/assessment\.txt$/.test(location)&&! /^exploration\/[a-f0-9-]{36}\/[a-f0-9]{64}\/result\.txt$/.test(location)&&! /^collaboration\/[a-f0-9]{64}\/context\.txt$/.test(location)&&! /^collaboration-result\/[a-f0-9-]{36}\/[1-9][0-9]*\/[a-f0-9]{64}\/value\.txt$/.test(location)&&! /^delegation-materials\/[a-f0-9]{64}\/catalog\.txt$/.test(location)&&! /^analysis-plan\/[a-f0-9]{64}\/plan\.txt$/.test(location)&&! /^analysis-steps\/[a-f0-9]{64}\/steps\.txt$/.test(location)&&!(preparation&&/^preparation\/[a-f0-9-]{36}\/[a-f0-9]{64}\/(semantics|business|framework|candidates)\.txt$/.test(location)))throw new RuntimeFault('AUTHORITY_REQUIRED');return location;}
async function readMaterial(path:string,signal:AbortSignal){
  const input=live(),check=()=>{if(current!==input||signal.aborted||input.signal.aborted)throw new RuntimeFault('CANCELLED');if(!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');};check();if(!input.readSelectedMaterial)throw new RuntimeFault('CAPABILITY_UNAVAILABLE');
  let text:string;try{text=await input.readSelectedMaterial(materialLocation(path),signal);}catch(error){const code=(error as {code?:string}).code;if(code==='AUTHORITY_REQUIRED'||code==='SOURCE_CHANGED')throw new RuntimeFault('AUTHORITY_REQUIRED');if(code==='CANCELLED')throw new RuntimeFault('CANCELLED');throw error;}check();return Buffer.from(text);
 }
function readDiagnostics(identity:OpenAnalysisRun['identity']):AnalysisRuntimeDiagnostics{
  const events=state.readAudit(identity.task_id).filter(e=>e.contextVersions.scope===identity.scope_sha256&&e.contextVersions.configuration===identity.config_sha256&&e.contextVersions.revision===identity.revision),accounting=state.readAccounting(identity.task_id),requests=config.ledger.read(identity.task_id),observations:AnalysisRuntimeDiagnostics['observations'][number][]=[];
  for(const event of events){
   const observation_id=event.runId+':'+event.sequence;
   if(event.kind==='tool.prepared'&&event.toolAdmission){const f=event.toolAdmission;observations.push({kind:'admission',observation_id,at:event.at,call_id:f.callId,name:f.name,status:f.disposition,...f.code?{code:f.code}:{},corrections_used:f.correctionsUsed,terminal:f.terminal,stage_version:f.viewVersion});}
   if(event.kind==='model.finished'&&event.modelOutcome){const out=event.modelOutcome,matched=event.digest?requests.filter(r=>requestReceiptDigest(r)===event.digest):[];observations.push({kind:'model',observation_id,at:event.at,model:{provider:out.model.provider,name:out.model.id},...out.responseModel?{reported_model:out.responseModel}:{},code:modelDiagnostic(out),physical_state:out.physicalStatus==='not-sent'?'not_sent':out.physicalStatus==='response-received'?'response_received':'unknown',...out.httpStatus!==undefined?{http_status:out.httpStatus}:{},usage_final:out.usageFinal,input_tokens:observedTokens(out.usage.inputTokens,out.usageFinal&&out.physicalStatus!=='unknown'),output_tokens:observedTokens(out.usage.outputTokens,out.usageFinal&&out.physicalStatus!=='unknown'),...matched.length===1?{request_id:matched[0]!.request_id}:{},after_stop:['CANCELLED','DEADLINE_EXCEEDED'].includes(event.reason??'')});}
   if(event.kind==='tool.finished'&&event.toolOutcome){const out=event.toolOutcome;observations.push({kind:'tool',observation_id,at:event.at,name:out.name,completion:out.status,delivery:out.modelOutput,resource_units:out.resourceUnits,...out.name==='read'&&(out.failureCategory!==undefined||out.modelOutput==='failed')?{file_failure_category:readFailureCategory(out.failureCategory)}:{},...['CANCELLED','DEADLINE_EXCEEDED'].includes(event.reason??out.reason??'')?{after_stop:true}:{},...out.receiptId?{receipt_id:out.receiptId}:{},...out.invocation?{invocation_id:out.invocation.invocationId}:{}});}
  }
  // Opt-in SDK INVALID_TOOL is a safe structural/view rejection, including
  // an empty-call batch with no tool.prepared event. Physical/effect facts stay separate.
  const last=events.findLast(e=>e.kind==='run.finished');let code:AnalysisDiagnosticCode='UNKNOWN';
  if(last){const model=events.findLast(e=>e.runId===last.runId&&e.kind==='model.finished'),tool=events.findLast(e=>e.runId===last.runId&&e.kind==='tool.finished');
   if(!last.reason)code='COMPLETE';else if(last.reason==='MODEL_FAILED'&&model?.modelOutcome)code=modelDiagnostic(model.modelOutcome);else if(last.reason==='INVALID_REQUEST'&&model?.reason==='INVALID_REQUEST'&&model.modelOutcome)code=modelDiagnostic(model.modelOutcome);else if(firstLoop&&last.reason==='INVALID_TOOL'&&hasUnconfirmedEffects(identity.task_id))code='EFFECT_UNCONFIRMED';else if(last.reason==='INVALID_TOOL'&&(firstLoop||events.some(e=>e.runId===last.runId&&e.toolAdmission?.terminal)))code='REQUEST_REJECTED';else if(last.reason==='TOOL_FAILED')code=events.some(e=>e.runId===last.runId&&e.toolAdmission?.terminal)?'REQUEST_REJECTED':tool?.toolOutcome?.status==='unknown'?'EFFECT_UNCONFIRMED':'TOOL_DELIVERY_FAILED';else code=({'BUSINESS_WAIT':'WAITING','DEFERRED':'WAITING','AUTHORITY_REQUIRED':'AUTHORITY_REQUIRED','CONFIGURATION_CHANGED':'CONFIGURATION_CHANGED','CANCELLED':'CANCELLED','DEADLINE_EXCEEDED':'CANCELLED','AUDIT_FAILED':'SAVE_UNCONFIRMED','STATE_FAILED':'SAVE_UNCONFIRMED','INVALID_REQUEST':'REQUEST_REJECTED','INVALID_OUTPUT':'INVALID_RESULT','CAPABILITY_UNAVAILABLE':'CAPABILITY_UNAVAILABLE'} as Partial<Record<string,AnalysisDiagnosticCode>>)[last.reason]??'UNKNOWN';}
  return {version:'1.0',task_id:identity.task_id,revision:identity.revision,recording:observations.length?'observed':events.length?'legacy':'unavailable',unconfirmed_effects:hasUnconfirmedEffects(identity.task_id),...accounting?{configuration_sha256:accounting.configuration,meter:{model_attempts:accounting.usage.modelCalls,tool_calls:accounting.usage.toolCalls,recorded_input_tokens:accounting.usage.inputTokens??0,charged_output_tokens:accounting.usage.outputTokens,unconfirmed_output_tokens:accounting.usage.reservedOutputTokens??accounting.reservations.reduce((sum,r)=>sum+r.tokens,0),resource_units:accounting.usage.resourceUnits}}:{},...last?{last_run:{code,at:last.at,model:{provider:last.provider,name:last.model}}}:{},observations};
 }
const readTools=observesModels?createExecutionTools({cwd:materialDirectory,policyVersion:preparation?'juanerai-analysis-material-v16-preparation':'juanerai-analysis-material-v15',resolvePath:async path=>{const input=live();if(input.signal.aborted||!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');const resolved=resolve(materialDirectory,path);materialLocation(resolved);return resolved;},read:readMaterial,stat:async(path,signal)=>({path,name:path.split('/').at(-1)!,kind:'file',size:(await readMaterial(path,signal)).byteLength,modifiedAt:0}),write:async()=>{throw new RuntimeFault('CAPABILITY_UNAVAILABLE');},exec:async()=>{throw new RuntimeFault('CAPABILITY_UNAVAILABLE');}},['read']):[];
 const codeDraft=firstLoop?createAnalysisCodeDraft({cwd:resolve(config.projectRoot,'selected-analysis-materials'),signal:()=>live().signal,authorize:()=>live().authorize(),authorizeWrite:()=>live().tools.some(t=>t.name==='calculate_and_verify')&&!live().shouldYield?.()&&(!sharedWork||state.businessWork.allowed(currentWork().id)),resolveReadPath:path=>{if(!live().readSelectedMaterial)throw new RuntimeFault('AUTHORITY_REQUIRED');materialLocation(path);},readMaterial,...(sharedWork?{storage:{read:()=>state.businessWork.codeDraft(currentWork().id),write:(bytes:Uint8Array)=>state.businessWork.writeCodeDraft(currentWork().id,bytes)}}:{})}):undefined;
 const firstLoopNativeTools=()=>((live().capabilityTools??live().tools).some(t=>t.name==='calculate_and_verify')?codeDraft!.tools:readTools);
 const firstLoopRegistries=new Map<string,ReturnType<typeof firstLoopBusinessTools>>();
 const firstLoopRegistered=()=>{const id=live().identity.task_id;let tools=firstLoopRegistries.get(id);if(!tools){if(!live().tools.length&&!live().capabilityTools?.length&&live().prompt==='')return [];tools=[...firstLoopBusinessTools(live,longMode(live())?live().tools.filter(t=>t.name==='build_artifact'&&!(live().capabilityTools??live().tools).some(c=>c.name===t.name)):[]),...firstLoopNativeTools()].map(modelOutputTool);firstLoopRegistries.set(id,tools);}return tools;};
function modelOutputTool(original:Tool):Tool{
  if(!observesModels)return original;
  return {...original,...original.name==='analysis_tool'?{execute:async(args,signal,invocation)=>{const key=invocation?invocationKey(invocation):undefined,producer=live().tools.find(t=>t.name===args.name);if(key)sharedToolProducers.set(key,producer?.name);try{return await original.execute(args,signal,invocation);}catch(error){if(key)sharedToolProducers.delete(key);throw error;}}}:{},modelOutput:{policyVersion:preparation?'juanerai-business-model-output-v16-preparation':'juanerai-business-model-output-v15',maxBytes:1048576,project:async({value,signal,invocation})=>{
   const key=invocation?invocationKey(invocation):undefined;try{const input=live(),check=()=>{if(current!==input||signal.aborted||input.signal.aborted)throw new RuntimeFault('CANCELLED');if(!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');};check();if(firstLoop&&original.name==='read_tool_contract'){
    const name=value&&typeof value==='object'&&!Array.isArray(value)?Reflect.get(value,'name'):undefined,producer=input.tools.find(t=>t.name===name);
    if(!producer||hash(Reflect.get(value as object,'parameters'))!==hash(producer.modelParameters??producer.parameters))throw new RuntimeFault('INVALID_OUTPUT');
    return {value:{name:producer.name,status:'contract_presented',executed:false,contract_sha256:hash(producer.modelParameters??producer.parameters),instruction:'The next native tool view presents the complete current schema. Submit its actual object parameters; this receipt is not business execution or saving.'}};
   }if(original.name==='analysis_tool'&&(!key||!sharedToolProducers.has(key)))throw new RuntimeFault('INVALID_OUTPUT');const name=original.name==='analysis_tool'?sharedToolProducers.get(key!):original.name,producer=input.tools.find(t=>t.name===name),projected=producer?.modelResult?await producer.modelResult(value,signal):value;check();return {value:projected as JsonValue};}finally{if(key)sharedToolProducers.delete(key);}
  }}};
 }
 const selectedTools=()=>firstLoop?firstLoopRegistered():(nativeBusinessPhase(live())?currentNativeTools():[tool,...readTools]).map(modelOutputTool);
 function cancelledModelProof(input:OpenAnalysisRun,session:string,operation:string){
  const id=input.identity,binding=state.readBinding(operation),accounting=state.readAccounting(id.task_id),rows=config.ledger.read(id.task_id),audit=state.readAudit(id.task_id);
  if(!binding||binding.taskId!==id.task_id||binding.sessionId!==session||binding.branch!=='main'||binding.purpose!==sessionOwner(input)||!accounting||accounting.owner!==null||state.readWriterLock()||config.ledger.pending?.().length)return null;
  const events=audit.filter(e=>e.session?.operationId===operation),admissions=events.filter(e=>e.kind==='model.admitted'),admission=admissions[0];
  if(admissions.length!==1||!admission||events.some(e=>e.kind.startsWith('tool.')||e.kind==='model.finished'||e.kind==='run.finished')||events.some(e=>e.session?.sessionId!==session||e.session.branch!=='main'||e.contextVersions.revision!==admission.contextVersions.revision||! /^[1-9][0-9]*$/.test(e.contextVersions.revision)||! /^[1-9][0-9]*$/.test(id.revision)||BigInt(e.contextVersions.revision)>BigInt(id.revision)||e.contextVersions.scope!==id.scope_sha256||e.contextVersions.configuration!==id.config_sha256))return null;
  const matches=rows.filter(r=>(['task_id','grant_id','scope_sha256','config_sha256'] as const).every(k=>r[k]===id[k])&&r.revision===admission.contextVersions.revision&&r.status==='cancelled'&&['REQUEST_CANCELLED','STOPPED'].includes(r.reason??'')&&!r.publishable&&/^[a-f0-9]{64}$/.test(r.input_sha256)&&/^[a-f0-9]{64}$/.test(admission.digest??'')&&r.provider===admission.provider&&r.model===admission.model&&r.usage.input_tokens.kind==='unknown'&&r.usage.output_tokens.kind==='unknown'&&r.started_at!==null&&r.ended_at!==null&&Number.isFinite(Date.parse(r.started_at))&&Number.isFinite(Date.parse(r.ended_at))&&Date.parse(r.started_at)>=Date.parse(admission.at)&&Date.parse(r.ended_at)>=Date.parse(r.started_at));
  if(matches.length!==1||accounting.reservations.filter(r=>r.owner===admission.runId&&r.tokens===limits.maxOutputTokens).length!==1)return null;
  const storage=state.sessionStorage(async()=>true),paths=readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('_'+session+'.jsonl'));
  if(paths.length!==1)return null;const file=paths[0]!;
  for(let i=1;i<=file.split('/').length;i++)if(lstatSync(join(storage.directory,...file.split('/').slice(0,i))).isSymbolicLink())return null;
  const path=join(storage.directory,file);if(!lstatSync(path).isFile())return null;const prefix=readFileSync(path);
  const nativeSafe=()=>{try{const values=new Map<string,unknown>();for(const line of readFileSync(path,'utf8').trim().split('\n'))for(const entry of [JSON.parse(line)].flat(Infinity))if(entry?.kind==='value'&&entry.op==='set')values.set(entry.namespace+':'+entry.key,entry.value);const lane=values.get('pi.lane.state:main') as {currentOperationId?:string;inbox?:unknown[]}|undefined;return lane?.currentOperationId===operation&&Array.isArray(lane.inbox)&&lane.inbox.length===0;}catch{return false;}};
  const unchanged=()=>!input.signal.aborted&&input.authorize()&&!config.ledger.pending?.().length&&hash(config.ledger.read(id.task_id))===hash(rows)&&hash(state.readAccounting(id.task_id)?.reservations)===hash(accounting.reservations)&&hash(state.readAudit(id.task_id).slice(0,audit.length))===hash(audit)&&readFileSync(path).subarray(0,prefix.length).equals(prefix);
  if(!nativeSafe()||!unchanged())return null;
  return {check:(task:string,s:string,branch:string,op:string)=>task===id.task_id&&s===session&&branch==='main'&&op===operation&&nativeSafe()&&unchanged(),unchanged,accounting};
 }
 function knownClosedEffects(taskId:string,sessionId:string,branch:string,operationId:string):boolean{
  const input=current;if(!input||taskId!==input.identity.task_id||input.signal.aborted||!input.authorize()||config.ledger.pending?.().length)return false;
  if(knownIdleAbort&&cancelledReportCheck)return cancelledReportCheck(taskId,sessionId,branch,operationId);
  const binding=state.readBinding(operationId),accounting=state.readAccounting(taskId);
  if(!binding||binding.taskId!==taskId||binding.sessionId!==sessionId||binding.branch!==branch||binding.purpose!==sessionOwner(input)||!accounting)return false;
  if(accounting.owner!==null){
   const ownerEvents=state.readAudit(taskId).filter(e=>e.runId===accounting.owner);
   if(!(interruptedProof?.owner===accounting.owner&&interruptedProof.operation===operationId)&&(!knownIdleAbort||ownerEvents.length!==1||ownerEvents[0]!.kind!=='run.started'||ownerEvents[0]!.contextVersions.revision!==input.identity.revision||ownerEvents[0]!.contextVersions.scope!==input.identity.scope_sha256||ownerEvents[0]!.contextVersions.configuration!==input.identity.config_sha256))return false;
  }
  const retainedRows=config.ledger.read(taskId).filter(r=>r.run_id===input.identity.run_id&&r.attempt_id===input.identity.attempt_id);
  if(!retainedRows.length||retainedRows.some(r=>!['succeeded','failed'].includes(r.status)||r.usage.input_tokens.kind!=='known'||r.usage.output_tokens.kind!=='known'||r.status==='failed'&&(r.usage.input_tokens.value!=='0'||r.usage.output_tokens.value!=='0')||(['task_id','revision','grant_id','scope_sha256','config_sha256'] as const).some(k=>r[k]!==input.identity[k])))return false;
  const events=state.readAudit(taskId).filter(e=>e.session?.operationId===operationId);
  // A resumed business Attempt can retain earlier fully settled native operations.
  // Keep their ledger rows; only receipts ending before this exact native admission are historical.
  const firstAdmission=events.find(e=>e.kind==='model.admitted');if(!firstAdmission)return false;
  const began=Date.parse(firstAdmission.at);if(!Number.isFinite(began))return false;
  const rows=retainedRows.filter(r=>r.started_at===null||r.ended_at===null||!Number.isFinite(Date.parse(r.started_at))||!Number.isFinite(Date.parse(r.ended_at))||Date.parse(r.ended_at)<Date.parse(r.started_at)||Date.parse(r.ended_at)>=began);
  if(!rows.length||rows.some(r=>r.status!=='succeeded'))return false;
  if(!events.length||events.some(e=>e.session?.sessionId!==sessionId||e.session?.branch!==branch||e.contextVersions.revision!==input.identity.revision||e.contextVersions.scope!==input.identity.scope_sha256||e.contextVersions.configuration!==input.identity.config_sha256)||accounting.reservations.some(r=>events.some(e=>e.runId===r.owner)))return false;
  const models=new Map<number,(typeof events)[number]>(),tools=new Set<string>(),physicalReceipts=new Set<string>();let modelCompletions=0;
  for(const e of events){
   if(e.kind==='model.admitted'){if(e.attempt===undefined||models.has(e.attempt))return false;models.set(e.attempt,e);}
   else if(e.kind==='model.finished'){
    const admitted=e.attempt===undefined?undefined:models.get(e.attempt);if(!admitted)return false;
    const matching=rows.filter(r=>r.provider===e.provider&&r.model===e.model&&r.started_at!==null&&r.ended_at!==null&&Date.parse(r.started_at)>=Date.parse(admitted.at)&&Date.parse(r.ended_at)<=Date.parse(e.at));
    if(matching.length!==1||physicalReceipts.has(matching[0]!.request_id))return false;physicalReceipts.add(matching[0]!.request_id);models.delete(e.attempt!);modelCompletions++;
   }
   else if(e.kind==='tool.admitted'){if(!e.invocation||tools.has(e.invocation.invocationId))return false;tools.add(e.invocation.invocationId);}
   else if(e.kind==='tool.finished'){if(!e.invocation||e.toolFailed||!tools.delete(e.invocation.invocationId))return false;}
  }
  if(interruptedProof?.operation===operationId){const unresolved=events.filter(e=>e.kind==='tool.admitted'&&tools.has(e.invocation?.invocationId??''));if(unresolved.length!==1||unresolved[0]!.runId!==interruptedProof.owner||unresolved[0]!.toolName!=='execute_step'||unresolved[0]!.digest!==interruptedProof.digest||unresolved[0]!.invocation?.invocationId!==interruptedProof.invocation)return false;tools.delete(interruptedProof.invocation);}
  return modelCompletions===rows.length&&modelCompletions>0&&models.size===0&&tools.size===0;
 }
 async function sdk(fingerprint?:{report:ModelConfig;review?:ModelConfig;reviewThinking?:boolean;capture:(configuration:string)=>void},reportOverride?:ModelConfig,recovery?:ReturnType<typeof state.interruptedAbortLease>){
  const inspecting=firstLoop&&live().prompt===''&&!live().tools.length&&!live().capabilityTools?.length;
  const objects=objectMode(live()),direct=nativeMode(live()),key=firstLoop?'harness5:'+live().identity.task_id:(longMode(live())?'long-artifact-v1:':'')+(objects?'objects':direct?'native':'legacy')+(reviewEnabled(live())?':review:'+reviewTimeout(live().identity.task_id)+':'+judgmentModel(live().identity.task_id).id+(judgmentThinking(live().identity.task_id)?':thinking':''):'')+(reportPro60(live().identity.task_id)?':report-pro60':'')+(reportTimeout(live().identity.task_id)===120000?':report-timeout120':''),existing=runtimes.get(key);if(existing&&!fingerprint&&!reportOverride&&!recovery)return existing;
  const resources=await loadHarnessResources({cwd:config.projectRoot,sources:[{kind:'skills',path:fileURLToPath(new URL('./resources/skills',import.meta.url)),version:'juanerai-methods-1.0'},{kind:'templates',path:fileURLToPath(new URL('./resources/templates',import.meta.url)),version:'juanerai-prompts-1.0'}],authorize:async(source,signal)=>!signal.aborted&&['skills','templates'].includes(source.kind)&&source.path===fileURLToPath(new URL('./resources/'+source.kind,import.meta.url))});
  if(resources.diagnostics.length)fail('PROFESSIONAL_RESOURCE_INVALID');
  const created=createSessionRuntime({model:analysisModel,transport,...modelObservations,...(sharedWork?{modelAttempts:'v1' as const}:{}),...(admissionPolicy?{contextAdmission:admissionPolicy}:{}),...(firstLoop?{toolAdmission:{policyVersion:'juanerai-harness-first-loop-v02',correctionLimit:1 as const,view:async({signal})=>{const input=live();if(signal.aborted||input.signal.aborted||!input.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');return firstLoopToolView(input,input.artifactFile?artifactFileTools:['report_edit','retained_case','conclusion_strategy_review'].includes(input.purpose??'')?[]:input.tools.some(t=>t.name==='calculate_and_verify')?firstLoopNativeTools():input.readSelectedMaterial?readTools:[],[...discoveredContracts.keys()].at(-1));}}}:{}),budgets:fingerprint?{...state.budgets,async claimUncapped(_task,_owner,configuration){fingerprint.capture(configuration);throw new RuntimeFault('CONFIGURATION_CHANGED');}}:recovery?.budgets??state.budgets,audit,
   purposes:[{id:'analysis',mode:'agent',model:analysisModel,transport,...(observesModels&&!reviewEnabled(live())?{fallbacks:analysisCandidates.slice(1).map(model=>({model,transport}))}:{}),tools:firstLoop?firstLoopRegistered():(direct?currentNativeTools():[tool,...readTools]).map(modelOutputTool)},{id:'proposal_prepare',mode:'agent',model:analysisModel,transport,...(observesModels&&!reviewEnabled(live())?{fallbacks:analysisCandidates.slice(1).map(model=>({model,transport}))}:{}),tools:firstLoop?firstLoopRegistered():(objects?currentNativeTools():[tool,...readTools]).map(modelOutputTool)},{id:'report_edit',mode:'agent',model:fingerprint?.report??reportOverride??reportModel(live().identity.task_id),transport,...(observesModels&&!reviewEnabled(live())?{fallbacks:reportCandidates(live().identity.task_id).slice(1).map(model=>({model,transport}))}:{}),tools:reportTools()},{id:'retained_case',mode:'agent',model:retainedModel,transport,tools:[]},...(reviewEnabled(live())?[{id:'conclusion_strategy_review',mode:'agent' as const,model:fingerprint?.review??judgmentModel(live().identity.task_id),...((fingerprint?fingerprint.reviewThinking:judgmentThinking(live().identity.task_id))?{thinkingLevel:'low' as const}:{}),transport,tools:[]}]:[])],
      harness:{skills:resources.skills,templates:resources.templates,retry:{enabled:false,maxRetries:0,baseDelayMs:0},compaction:{enabled:true,reserveTokens:16384,keepRecentTokens:8192},steeringMode:'one-at-a-time',followUpMode:'one-at-a-time'},
   storage:recovery?.storage??state.sessionStorage(async(action,signal)=>!signal.aborted&&!!current&&!current.signal.aborted&&current.authorize()&&(!action.sessionId||owns(current!.identity.task_id,action.sessionId))),
   bindOperation:async(binding,signal)=>{const input=live();if(binding.taskId!==input.identity.task_id||(binding.purpose??'analysis')!==(input.purpose??'analysis'))fail('AUTHORITY_REQUIRED');await state.bindOperation({...binding,purpose:sessionOwner(input)},signal);},
   reconcile:async(input,signal)=>{
    if(signal.aborted||!current||input.taskId!==current.identity.task_id||!current.authorize())return 'denied';
    if(config.ledger.pending?.().length)return 'unknown';
    if(!owns(input.taskId,input.sessionId))return 'denied';
    // An interrupted native operation requires a matching durable effect receipt; bindings alone are insufficient.
    if(input.open.length&&(!knownIdleAbort||!input.open.every(open=>knownClosedEffects(input.taskId,input.sessionId,open.branch,open.operationId))))return 'unknown';
    for(const open of input.open){const binding=state.readBinding(open.operationId);if(!binding||binding.taskId!==input.taskId||binding.sessionId!==input.sessionId||binding.branch!==open.branch)return 'unknown';}
    return 'ready';
   },
   authorize:async(action,signal)=>{
    if(!current||signal.aborted||current.signal.aborted||action.taskId!==current.identity.task_id||!current.authorize()||(action.kind==='model'||action.kind==='publish')&&current.shouldYield?.())return false;
    if(observesModels&&action.kind==='model'&&!candidateAllowed(action.request.model))return false;
    if(!sharedWork)return true;
    const work=currentWork();
    if(action.kind!=='model')return state.businessWork.allowed(work.id);
    const attempt=action.modelAttempt;
    if(!attempt||!state.businessWork.authorize(work.id,action.taskId,action.runId,attempt))return false;
    // Recovery summaries have their own ID; the draft binds recovery to the failed request.
    return current.artifactWork?.admit({logicalId:attempt.kind==='recovery'?attempt.recovery.logicalRequestId:attempt.logicalRequestId,recovery:attempt.kind==='recovery'})??true;
   },
  });const engine:SessionRuntime=created;if(!inspecting&&!fingerprint&&!reportOverride&&!recovery)runtimes.set(key,engine);return engine;
 }
 async function migratePurposeConfiguration(input:ReportThinkingMigrationInput,kind:'report-thinking'|'judgment-model'|'judgment-thinking'|'judgment-pro'|'judgment-timeout'|'judgment-pro-off'|'judgment-flash'|'report-pro60'|'report-timeout'|'long-artifacts'){if(firstLoop)fail('CAPABILITY_UNAVAILABLE');
  while(readCompletion)await awaitReads(input.signal);
  if(current||config.ledger.pending?.().length)fail('TASK_BUSY');
  if(config.reportThinking!=='off'||config.analysisModel&&config.analysisModel!=='MiniMax-M3'||input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-thinking'&&(!reviewEnabled(input)||judgmentModel(input.identity.task_id).id!==backup.id))fail('AUTHORITY_REQUIRED');
  if(kind!=='judgment-thinking'&&kind!=='judgment-pro'&&kind!=='judgment-timeout'&&judgmentThinking(input.identity.task_id))fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-model'&&(!reviewEnabled(input)||judgmentModel(input.identity.task_id).id!==primary.id))fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-pro'&&(!reviewEnabled(input)||judgmentModel(input.identity.task_id).id!=='mimo-v2.6-pro'||!judgmentThinking(input.identity.task_id)))fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-flash'&&(!reviewEnabled(input)||judgmentModel(input.identity.task_id).id!==backup.id||reviewTimeout(input.identity.task_id)!==60000))fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-pro-off'&&(!reviewEnabled(input)||judgmentModel(input.identity.task_id).id!=='mimo-v2.6-pro'||judgmentThinking(input.identity.task_id)||reviewTimeout(input.identity.task_id)!==60000))fail('AUTHORITY_REQUIRED');
  if(kind==='report-pro60'&&(!reportPro60(input.identity.task_id)||judgmentModel(input.identity.task_id).id!==backup.id||judgmentThinking(input.identity.task_id)||reviewTimeout(input.identity.task_id)!==60000))fail('AUTHORITY_REQUIRED');
  if(kind==='long-artifacts'&&config.longArtifactsForTask?.(input.identity.task_id)!==true)fail('AUTHORITY_REQUIRED');
  if(kind==='report-timeout'&&reportTimeout(input.identity.task_id)!==120000)fail('AUTHORITY_REQUIRED');
  if(kind==='judgment-timeout'&&reviewTimeout(input.identity.task_id)!==60000)fail('AUTHORITY_REQUIRED');
  if([input.approval,input.expectedAccounting,input.expectedLedger].some(v=>!/^[a-f0-9]{64}$/.test(v)))fail('INVALID_REQUEST');
  const task=input.identity.task_id,report=reportModel(task),targetLimits=taskLimits(task),sourceLimits=kind==='report-timeout'?Object.freeze({...targetLimits,modelTimeoutMs:60000}):kind==='judgment-timeout'?limits:targetLimits,accounting=state.readAccounting(task),rows=config.ledger.read(task);
  if(!accounting||accounting.owner!==null||hash(accounting)!==input.expectedAccounting||hash(rows)!==input.expectedLedger||JSON.stringify(accounting.limits)!==JSON.stringify(sourceLimits))fail('CONFIGURATION_CHANGED');
  if(rows.some(r=>r.ended_at===null||['reserved','issued'].includes(r.status)))fail('TASK_UNCONFIRMED');
  if(!rows.length||(['task_id','revision','run_id','attempt_id','grant_id','scope_sha256','config_sha256'] as const).some(k=>rows.at(-1)![k]!==input.identity[k]))fail('AUTHORITY_REQUIRED');
  const storage=state.sessionStorage(async()=>true);
  const nativeDigest=()=>{const files=readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl')).sort();if(!files.length)fail('NATIVE_SESSION_NOT_FOUND');return hash(files.map(f=>{const path=join(storage.directory,f),st=lstatSync(path);for(let i=1;i<=f.split('/').length;i++){if(lstatSync(join(storage.directory,...f.split('/').slice(0,i))).isSymbolicLink())fail('STATE_FAILED');}if(!st.isFile()||st.isSymbolicLink())fail('STATE_FAILED');return [f,createHash('sha256').update(readFileSync(path)).digest('hex')];}));};
  const originalNative=nativeDigest(),bindings=state.readNativeBindings(task),audit=state.readAudit(task),checks:unknown[]=[];
  current={identity:input.identity,purpose:'report_edit',prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
  let migrationCheck='configuration';
  try{
   // Let the installed SDK produce both identities; no copied hash algorithm,
   // admission, audit, session operation, or Provider call occurs in this dry claim.
   const identity=async(report:ModelConfig,review?:ModelConfig,reviewThinking=false,identityLimits=targetLimits,long?:boolean)=>{let captured:string|undefined;longIdentityOverride=long;try{const engine=await sdk({report,review,reviewThinking,capture:v=>captured=v});const result=await engine.run({taskId:task,purpose:'report_edit',sessionId:bindings[0]!.sessionId,prompt:'',tools:reportTools(),...(longMode(live())?{workId:task+':migration'}:{}),limits:identityLimits,modelRecovery:{extraAttempts:1},signal:input.signal});if(result.status==='succeeded'||result.reason!=='CONFIGURATION_CHANGED'||!captured)fail('STATE_FAILED');return captured;}finally{longIdentityOverride=undefined;}};
   // Only explicitly approved review-route edges, including Flash-off → Pro-on;
   // the immutable current fingerprint must match the exact installed SDK source.
   const enabled=(kind==='judgment-thinking'||kind==='judgment-pro'||kind==='judgment-timeout')&&judgmentThinking(task);
   const from=kind==='long-artifacts'?await identity(report,judgmentModel(task),judgmentThinking(task),sourceLimits,false):kind==='report-timeout'?await identity(report,judgmentModel(task),false,sourceLimits):kind==='report-pro60'?await identity(legacyReportModel,judgmentModel(task)):kind==='judgment-flash'?await identity(report,{...backup,id:'mimo-v2.6-pro',reasoning:true,thinkingProtocol:'mimo-chat'}):kind==='judgment-pro-off'?await identity(report,judgmentModel(task),true):kind==='judgment-timeout'?await identity(report,judgmentModel(task),true,sourceLimits):kind==='report-thinking'?await identity(backup):kind==='judgment-thinking'?await identity(report,enabled?primary:report,!enabled):await identity(report,report),to=kind==='long-artifacts'?await identity(report,judgmentModel(task),judgmentThinking(task),targetLimits,true):kind==='report-thinking'?await identity(report):await identity(report,judgmentModel(task),enabled);
   if(accounting.configuration!==from||from===to)fail('CONFIGURATION_CHANGED');
   for(const reservation of accounting.reservations){
    migrationCheck='model-reservation:'+reservation.owner;
    const end=audit.findLast(e=>e.runId===reservation.owner&&e.kind==='run.finished');
    if(!end?.session||kind==='report-thinking'&&!['MODEL_FAILED','STATE_FAILED'].includes(end.reason??''))fail('TASK_UNCONFIRMED');
    const events=audit.filter(e=>e.runId===reservation.owner),admissions=events.filter(e=>e.kind==='model.admitted'),openTools=new Set<string>();
    if(!admissions.length)fail('TASK_UNCONFIRMED');
    for(const event of events){if(event.kind==='tool.admitted'){if(!event.invocation||openTools.has(event.invocation.invocationId))fail('TASK_UNCONFIRMED');openTools.add(event.invocation.invocationId);}else if(event.kind==='tool.finished'){if(!event.invocation||event.toolFailed||!openTools.delete(event.invocation.invocationId))fail('TASK_UNCONFIRMED');}}
    if(openTools.size)fail('TASK_UNCONFIRMED');
    // A later explicit ledger reconciliation may stamp ended_at after the
    // native failure. Known active_ms retains the actual request interval;
    // unknown model usage stays reserved, while unknown tool effects deny.
    const physical=rows.filter(r=>['cancelled','failed'].includes(r.status)&&r.usage.output_tokens.kind==='unknown'&&r.started_at!==null&&r.ended_at!==null&&r.provider===end.provider&&r.model===end.model&&r.revision===end.contextVersions.revision&&r.scope_sha256===end.contextVersions.scope&&r.config_sha256===end.contextVersions.configuration&&r.usage.active_ms.kind==='known'&&admissions.some((admission,i)=>{const began=Date.parse(r.started_at!),closed=began+Number(r.usage.active_ms.kind==='known'?r.usage.active_ms.value:NaN),boundary=Date.parse(admissions[i+1]?.at??end.at);return began>=Date.parse(admission.at)&&began<boundary&&Number.isFinite(closed)&&closed>=began&&closed<=boundary&&closed<=Date.parse(r.ended_at!);}));
    if(kind==='report-thinking'){if(physical.length!==1)fail('TASK_UNCONFIRMED');}
    else{
     // A succeeded logical run can retain usage from its failed first physical
     // request. Prove terminal failure and physical closure per admission;
     // preserve the exact reservation instead of treating unknown tokens as zero.
     const closed=rows.filter(r=>['cancelled','failed','temporary_failure'].includes(r.status)&&r.usage.output_tokens.kind==='unknown'&&r.started_at!==null&&r.ended_at!==null&&r.usage.active_ms.kind==='known'&&admissions.some(admission=>{
      const finished=events.find(e=>e.kind==='model.finished'&&e.at>=admission.at&&e.attempt===admission.attempt&&e.session?.operationId===admission.session?.operationId),began=Date.parse(r.started_at!),closed=began+Number(r.usage.active_ms.kind==='known'?r.usage.active_ms.value:NaN);
      return !!finished?.reason&&r.provider===admission.provider&&r.model===admission.model&&r.revision===admission.contextVersions.revision&&r.scope_sha256===admission.contextVersions.scope&&r.config_sha256===admission.contextVersions.configuration&&began>=Date.parse(admission.at)&&Number.isFinite(closed)&&closed>=began&&closed<=Date.parse(finished.at)&&closed<=Date.parse(r.ended_at!);
     }));
     if(reservation.tokens!==limits.maxOutputTokens||closed.length!==accounting.reservations.filter(r=>r.owner===reservation.owner).length)fail('TASK_UNCONFIRMED');
    }
   }
   const retiring:{binding:(typeof bindings)[number];identity:OpenAnalysisRun['identity'];purpose:'analysis';operationId:string}[]= [];
   const unique=new Map(bindings.map(b=>[b.sessionId+':'+b.branch,b]));
   if(!unique.size)fail('NATIVE_SESSION_NOT_FOUND');
   for(const binding of unique.values()){
    migrationCheck='native-terminal:'+binding.sessionId+':'+binding.branch;
    const owner=binding.purpose??'analysis',base=owner.split(':')[0]!,purpose=base==='analysis_objects'||base==='analysis_native'?'analysis':base==='proposal_objects'?'proposal_prepare':base;
    if(!['analysis','proposal_prepare','report_edit','retained_case','conclusion_strategy_review'].includes(purpose))fail('STATE_FAILED');
    current={...current!,identity:input.identity,nativeBusinessTools:true,purpose:purpose==='analysis'?undefined:purpose as 'proposal_prepare'|'report_edit'|'retained_case'|'conclusion_strategy_review',conversation_id:owner.includes(':')?owner.slice(owner.indexOf(':')+1):undefined};
    const engine=await sdk(),view=await engine.inspect(binding.sessionId,binding.branch,input.signal);if(kind==='long-artifacts'&&view.pending)fail('TASK_UNCONFIRMED');
    let result:unknown;
    if(view.pending){
     // Explicit safe migration can terminate only an older child with exact,
     // physically settled effects. It cannot resume its business investigation.
     if(purpose!=='analysis'||!owner.includes(':'))fail('TASK_UNCONFIRMED');
     const operation=state.readBinding(view.pending.operationId),events=audit.filter(e=>e.session?.operationId===view.pending!.operationId),first=events.find(e=>e.kind==='model.admitted');
     if(!operation||operation.sessionId!==binding.sessionId||operation.branch!==binding.branch||operation.purpose!==owner||!first||!/^[0-9]+$/.test(first.contextVersions.revision??'')||Number(first.contextVersions.revision)>=Number(input.identity.revision))fail('TASK_UNCONFIRMED');
     const physical=rows.filter(r=>r.revision===first.contextVersions.revision&&r.scope_sha256===first.contextVersions.scope&&r.config_sha256===first.contextVersions.configuration&&r.grant_id===input.identity.grant_id&&r.started_at!==null&&Date.parse(r.started_at)>=Date.parse(first.at));
     if(!physical.length||new Set(physical.map(r=>r.run_id+':'+r.attempt_id)).size!==1)fail('TASK_UNCONFIRMED');
     const row=physical[0]!,historical={...input.identity,revision:row.revision,run_id:row.run_id,attempt_id:row.attempt_id,operation_id:row.operation_id,scope_sha256:row.scope_sha256,config_sha256:row.config_sha256};
     current={...current!,identity:historical,nativeBusinessTools:true};
     if(!knownClosedEffects(task,binding.sessionId,binding.branch,view.pending.operationId))fail('TASK_UNCONFIRMED');
     retiring.push({binding,identity:historical,purpose:'analysis',operationId:view.pending.operationId});result={status:'known-effects-awaiting-explicit-abort',operationId:view.pending.operationId};
    }else{
     const last=audit.findLast(e=>e.session?.sessionId===binding.sessionId&&e.session.branch===binding.branch&&e.kind==='run.finished');
     if(!last?.session)fail('TASK_UNCONFIRMED');
     result=await engine.result(binding.sessionId,last.session.operationId,input.signal);
     if(!result||!['completed','declined','aborted','failed'].includes((result as {status:string}).status))fail('TASK_UNCONFIRMED');
    }
    let queue:unknown;
    migrationCheck='native-queue:'+binding.sessionId+':'+binding.branch;
    try{
     const snapshot=await engine.control({taskId:task,purpose,sessionId:binding.sessionId,branch:binding.branch,signal:input.signal,command:{kind:'snapshot'}});
     if(!snapshot.snapshot||(snapshot.snapshot.operationId&&snapshot.snapshot.operationId!==view.pending?.operationId)||snapshot.snapshot.queued.length)fail('TASK_UNCONFIRMED');queue=snapshot.snapshot.queued;
    }catch(error){
     if(!(error instanceof RuntimeFault)||error.reason!=='AUTHORITY_REQUIRED')throw error;
     // SDK0.4.3 writes queue authority only after a queue command. For a
     // never-queued lane it refuses reconstruction snapshots. Prove no queue
     // admission from its complete fail-closed control audit, not an invented
     // empty queue or ownership. Unknown control digests forbid migration.
     const readControls=[{kind:'snapshot'},{kind:'snapshot',includeContent:false},{kind:'snapshot',includeContent:true},{kind:'abort'}].map(hash);
     const controls=audit.filter(e=>e.kind==='session.control'&&e.session?.sessionId===binding.sessionId&&e.session.branch===binding.branch);
     if(controls.some(e=>!e.digest||!readControls.includes(e.digest)))fail('TASK_UNCONFIRMED');
     queue={kind:'no-queue-admission',controlAudit:hash(controls),sdk:'0.4.3'};
    }
    checks.push({session:binding.sessionId,branch:binding.branch,result,queue});
   }
   // Preflight every lane before stopping any of them. Native abort adds its
   // own durable receipts; it is never a JSONL rewrite or a Provider request.
   const stops:unknown[]=[];
   if(nativeDigest()!==originalNative||hash(config.ledger.read(task))!==input.expectedLedger||hash(state.readNativeBindings(task))!==hash(bindings))fail('TASK_UNCONFIRMED');
   for(const retire of retiring){
    migrationCheck='native-stop:'+retire.binding.sessionId;
    if(input.signal.aborted||!input.authorize()||hash(config.ledger.read(task))!==input.expectedLedger||config.ledger.pending?.().length)fail('TASK_UNCONFIRMED');
    current={identity:retire.identity,conversation_id:retire.binding.purpose!.slice(retire.binding.purpose!.indexOf(':')+1),nativeBusinessTools:true,prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
    const engine=await sdk(undefined,backup),view=await engine.inspect(retire.binding.sessionId,retire.binding.branch,input.signal);
    if(view.pending?.operationId!==retire.operationId||!knownClosedEffects(task,retire.binding.sessionId,retire.binding.branch,retire.operationId))fail('TASK_UNCONFIRMED');
    migrationRetiring=true;knownIdleAbort=true;
    try{
     const stopped=await engine.run({taskId:task,purpose:'analysis',sessionId:retire.binding.sessionId,tools:selectedTools(),prompt:'',system:'显式停止已核账的旧子操作，不恢复或重放业务。',contextVersions:{revision:retire.identity.revision,scope:retire.identity.scope_sha256,configuration:retire.identity.config_sha256},limits:sourceLimits,modelRecovery:{extraAttempts:1},signal:input.signal,operation:'abort'});
     const terminal=await engine.result(retire.binding.sessionId,retire.operationId,input.signal);
     if(stopped.status!=='cancelled'||stopped.reason!=='CANCELLED'||terminal?.status!=='aborted'||(await engine.inspect(retire.binding.sessionId,retire.binding.branch,input.signal)).pending)fail('TASK_UNCONFIRMED');
     stops.push({session:retire.binding.sessionId,operation:retire.operationId,identity:retire.identity,terminal});
    }finally{migrationRetiring=false;knownIdleAbort=false;}
   }
   const afterStops=state.readAccounting(task)!;
   if(!afterStops||afterStops.owner!==null||afterStops.configuration!==from||hash(afterStops.reservations)!==hash(accounting.reservations)||Object.entries(accounting.usage).some(([key,value])=>key==='activeMs'?afterStops.usage.activeMs<Number(value):afterStops.usage[key as keyof typeof accounting.usage]!==value))fail('TASK_UNCONFIRMED');
   migrationCheck='exclusive-writer-recheck';
   const checkedNative=nativeDigest(),checkedBindings=hash(state.readNativeBindings(task)),checkedAudit=hash(state.readAudit(task)),reconciliation=hash({ledger:input.expectedLedger,nativeBefore:originalNative,nativeAfter:checkedNative,checks,stops,audit:checkedAudit,...(['report-pro60','report-timeout'].includes(kind)?{purposeProtection:{reportModel:'mimo-v2.6-pro',reportThinking:'off',reportTimeoutMs:reportTimeout(task),generationTimeoutMs:30000,reviewModel:'mimo-v2.6-flash',reviewThinking:'off',reviewTimeoutMs:60000}}:{}),controlActiveMs:afterStops.usage.activeMs-accounting.usage.activeMs,...(['judgment-timeout','report-timeout'].includes(kind)?{resourcePolicy:{before:sourceLimits,after:targetLimits,reportTimeoutMs:reportTimeout(task),reviewTimeoutMs:60000,otherPurposeTimeoutMs:30000}}:{})});
   const writer=await storage.acquireWriter(input.signal);
   try{
    if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
    if(config.ledger.pending?.().length||hash(config.ledger.read(task))!==input.expectedLedger||hash(state.readAudit(task))!==checkedAudit||nativeDigest()!==checkedNative||hash(state.readNativeBindings(task))!==checkedBindings)fail('TASK_UNCONFIRMED');
    return state.migrateConfiguration({task,from,to,expectedAccounting:hash(afterStops),approval:input.approval,reconciliation,...(kind==='judgment-timeout'?{reviewTimeoutMs:60000 as const}:kind==='report-timeout'?{reportTimeoutMs:120000 as const}:{})});
   }finally{await writer.release();}
  }catch(error){if(error instanceof Error)Object.assign(error,{migrationCheck});throw error;}finally{current=undefined;}
 }
 function hasUnconfirmedEffects(task:string){
  const events=state.readAudit(task),observedRuns=new Set(events.filter(e=>e.modelOutcome||e.toolOutcome).map(e=>e.runId)),pending=new Set<string>(),latest=new Map<string,NonNullable<ReturnType<typeof state.readAudit>[number]['toolOutcome']>>();
  for(const event of events){const key=event.invocation?.invocationId??event.runId+':'+event.toolName;if(event.kind==='tool.admitted'&&event.toolName!=='read'&&observedRuns.has(event.runId))pending.add(key);if(event.kind==='tool.finished'){pending.delete(key);if(event.toolOutcome)latest.set(key,event.toolOutcome);}}
  return sharedWork&&state.businessWork.hasUnconfirmed(task)||pending.size>0||[...latest.values()].some(outcome=>outcome.effect!=='read'&&outcome.status==='unknown');
 }
 return {historyOwnership:'runtime',...(sharedWork?{artifactFiles:'v1' as const}:{}),readDiagnostics,...(preparation?{preparationSnapshots:'v1' as const}:{}),...(observesModels?{selectedMaterialRead:'v1' as const}:{}),...(config.sharedWorkRecovery?{openBusinessWork:async(input:Parameters<NonNullable<OpenAnalysisRuntime['openBusinessWork']>>[0])=>{if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');if(config.ledger.read(input.identity.task_id).length&&!state.hasNativeSession(input.identity.task_id))fail('LEGACY_TASK_RECONCILIATION_REQUIRED');return state.businessWork.begin(input);}}:{}),...(observesModels?{hasUnconfirmedEffects}:{}),...(firstLoop?{codeDraft:'v1' as const,readCodeDraft:async(input:Readonly<{task_id:string;path:string;signal:AbortSignal}>)=>{if(!current||current.identity.task_id!==input.task_id||input.signal.aborted||!current.authorize()||!current.tools.some(t=>t.name==='calculate_and_verify')||current.shouldYield?.()||input.path!=='draft/analysis.py')throw new RuntimeFault('AUTHORITY_REQUIRED');return codeDraft!.readProgram();}}:{}),reviewAdmissionRetrySafe(id){try{
  if(current||!membershipUuid(id.task_id)||config.reviewPolicy?.(id.task_id)!==true||config.ledger.pending?.().length||state.readWriterLock())return false;
  const accounting=state.readAccounting(id.task_id),audit=state.readAudit(id.task_id),last=audit.at(-1),model=judgmentModel(id.task_id);
  if(!accounting||accounting.owner!==null||hash(accounting.limits)!==hash(taskLimits(id.task_id))||!last||last.kind!=='run.started'||last.attempt!==0||last.session||last.provider!==model.provider||last.model!==model.id||last.contextVersions.scope!==id.scope_sha256||last.contextVersions.configuration!==id.config_sha256||last.contextVersions.revision!==id.revision||audit.filter(e=>e.runId===last.runId).length!==1)return false;
  const began=Date.parse(last.at),rows=config.ledger.read(id.task_id);if(!Number.isFinite(began)||!rows.length||rows.some(r=>!['succeeded','failed','cancelled','temporary_failure'].includes(r.status)||!r.started_at||!r.ended_at||!Number.isFinite(Date.parse(r.started_at))||!Number.isFinite(Date.parse(r.ended_at))||Date.parse(r.started_at)>began||Date.parse(r.ended_at)>began))return false;
  const session=state.readSelectedSession(id.task_id,'conclusion_strategy_review');if(!session)return false;
  const storage=state.sessionStorage(async()=>false),paths=readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('_'+session+'.jsonl'));if(paths.length!==1)return false;
  const relative=paths[0]!;for(let i=1;i<=relative.split('/').length;i++)if(lstatSync(join(storage.directory,...relative.split('/').slice(0,i))).isSymbolicLink())return false;
  const path=join(storage.directory,relative),stat=lstatSync(path);if(!stat.isFile()||stat.mtimeMs>began)return false;
  const values=new Map<string,unknown>();for(const line of readFileSync(path,'utf8').trim().split('\n'))for(const e of [JSON.parse(line)].flat(Infinity))if(e?.kind==='value'){const key=e.namespace+':'+e.key;if(e.op==='set')values.set(key,e.value);else if(e.op==='delete')values.delete(key);}
  const lane=values.get('pi.lane.state:main') as {currentOperationId?:string|null;inbox?:unknown[]}|undefined;
  return lane?.currentOperationId===null&&Array.isArray(lane.inbox)&&lane.inbox.length===0&&![...values.keys()].some(k=>k.startsWith('pi.op.meta:'));
 }catch{return false;}},async recoverCancelledReport(input){if(firstLoop)fail('CAPABILITY_UNAVAILABLE');
  while(readCompletion)await awaitReads(input.signal);
  if(current||input.signal.aborted||!input.authorize()||config.ledger.pending?.().length)fail('AUTHORITY_REQUIRED');
  if([input.approval,input.expectedAccounting,input.expectedLedger].some(v=>!/^[a-f0-9]{64}$/.test(v)))fail('INVALID_REQUEST');
  const id=input.identity,target=input.target,task=id.task_id,accounting=state.readAccounting(task),rows=config.ledger.read(task),audit=state.readAudit(task),proof=input.provePhysicalStop();
  if(!accounting||accounting.owner!==null||state.readWriterLock()||hash(accounting)!==input.expectedAccounting||hash(rows)!==input.expectedLedger||!proof||!proof.process_closed||!proof.physical_closed||hash(proof.identity)!==hash(id)||[proof.stop_receipt_sha256,proof.process_exit_sha256].some(v=>!/^[a-f0-9]{64}$/.test(v)))fail('TASK_UNCONFIRMED');
  const binding=state.readBinding(target.operation),events=audit.filter(e=>e.session?.operationId===target.operation),admissions=events.filter(e=>e.kind==='model.admitted'),row=rows.find(r=>r.request_id===proof.request_id),admission=admissions[0];
  if(!binding||binding.taskId!==task||binding.purpose!=='report_edit'||binding.sessionId!==target.session||binding.branch!==target.branch||state.readSelectedSession(task,'report_edit')!==target.session||admissions.length!==1||!admission||events.some(e=>e.kind==='model.finished'||e.kind==='run.finished'||e.kind.startsWith('tool.'))||events.some(e=>e.session?.sessionId!==target.session||e.session.branch!==target.branch||e.contextVersions.revision!==id.revision||e.contextVersions.scope!==id.scope_sha256||e.contextVersions.configuration!==id.config_sha256))fail('TASK_UNCONFIRMED');
  if(!row||row.status!=='cancelled'||!['REQUEST_CANCELLED','STOPPED'].includes(row.reason??'')||row.publishable||row.usage.input_tokens.kind!=='unknown'||row.usage.output_tokens.kind!=='unknown'||row.input_sha256!==admission.digest||row.provider!==admission.provider||row.model!==admission.model||(['task_id','revision','run_id','attempt_id','grant_id','scope_sha256','config_sha256'] as const).some(k=>row[k]!==id[k])||!row.started_at||!row.ended_at||!Number.isFinite(Date.parse(row.started_at))||!Number.isFinite(Date.parse(row.ended_at))||Date.parse(row.started_at)<Date.parse(admission.at)||Date.parse(row.ended_at)<Date.parse(row.started_at)||accounting.reservations.filter(r=>r.owner===admission.runId&&r.tokens===limits.maxOutputTokens).length!==1)fail('TASK_UNCONFIRMED');
  const allowedControls=[{kind:'snapshot'},{kind:'snapshot',includeContent:false},{kind:'snapshot',includeContent:true},{kind:'abort'}].map(hash);
  if(audit.some(e=>e.kind==='session.control'&&e.session?.sessionId===target.session&&(!e.digest||!allowedControls.includes(e.digest))))fail('TASK_UNCONFIRMED');
  const storage=state.sessionStorage(async()=>true),paths=readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl'));
  const prefix=new Map(paths.map(f=>{for(let i=1;i<=f.split('/').length;i++)if(lstatSync(join(storage.directory,...f.split('/').slice(0,i))).isSymbolicLink())fail('STATE_FAILED');const path=join(storage.directory,f);if(!lstatSync(path).isFile())fail('STATE_FAILED');return [f,readFileSync(path)] as const;}));
  const selected=paths.filter(f=>f.endsWith('_'+target.session+'.jsonl'));if(selected.length!==1)fail('TASK_UNCONFIRMED');
  // The SDK inspect API does not expose an idle lane's inbox. This read-only
  // compatibility check inspects persisted native metadata; it never writes or drives it.
  const nativeSafe=()=>{try{const values=new Map<string,unknown>();for(const line of readFileSync(join(storage.directory,selected[0]!),'utf8').trim().split('\n'))for(const entry of [JSON.parse(line)].flat(Infinity)){if(entry?.kind==='value'&&entry.op==='set')values.set(entry.namespace+':'+entry.key,entry.value);}const lane=values.get('pi.lane.state:'+target.branch) as {currentOperationId?:string;inbox?:unknown[]}|undefined,settings=values.get('pi.lane.config:'+target.branch) as {activeToolNames?:unknown[]}|undefined;return lane?.currentOperationId===target.operation&&Array.isArray(lane.inbox)&&lane.inbox.length===0&&Array.isArray(settings?.activeToolNames)&&settings.activeToolNames.length===0;}catch{return false;}};
  const unchanged=()=>!input.signal.aborted&&input.authorize()&&!config.ledger.pending?.().length&&hash(config.ledger.read(task))===input.expectedLedger&&hash(input.provePhysicalStop())===hash(proof)&&hash(state.readAudit(task).slice(0,audit.length))===hash(audit)&&[...prefix].every(([f,bytes])=>readFileSync(join(storage.directory,f)).subarray(0,bytes.length).equals(bytes));
  if(!nativeSafe()||!unchanged())fail('TASK_UNCONFIRMED');
  current={identity:id,purpose:'report_edit',prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
  cancelledReportCheck=(t,s,b,o)=>t===task&&s===target.session&&b===target.branch&&o===target.operation&&unchanged()&&nativeSafe()&&hash(state.readAccounting(task)?.reservations)===hash(accounting.reservations);
  try{
   const engine=await sdk(),view=await engine.inspect(target.session,target.branch,input.signal);
   if(view.pending?.operationId!==target.operation||view.pending.kind!=='run'||!unchanged()||state.readAccounting(task)?.owner!==null||state.readWriterLock())fail('TASK_UNCONFIRMED');
   const reconciliation=hash({approval:input.approval,proof,target,identity:id,accounting:input.expectedAccounting,ledger:input.expectedLedger,audit:hash(audit),native:[...prefix].map(([f,bytes])=>[f,createHash('sha256').update(bytes).digest('hex')])});
   // Save the authorized reconciliation intent before ending the native lane.
   // Its real aborted result is the completion receipt; never fabricate a model finish.
   await state.audit.append({version:'1.0',taskId:task,runId:randomUUID(),sequence:1,kind:'session.control',at:new Date().toISOString(),provider:row.provider,model:row.model,contextVersions:{revision:id.revision,scope:id.scope_sha256,configuration:id.config_sha256},digest:hash({approval:input.approval,reconciliation,phase:'requested'}),reason:'CANCELLED',session:{sessionId:target.session,branch:target.branch,operationId:target.operation}},input.signal);
   if(!unchanged())fail('TASK_UNCONFIRMED');
   migrationRetiring=true;knownIdleAbort=true;
   const result=await engine.run({taskId:task,purpose:'report_edit',sessionId:target.session,branch:target.branch,tools:[],prompt:'',system:'仅结束已物理取消的无工具报告，不重放模型、工具或业务。',contextVersions:{revision:id.revision,scope:id.scope_sha256,configuration:id.config_sha256},limits:taskLimits(input.identity.task_id),modelRecovery:{extraAttempts:1},signal:input.signal,operation:'abort'});
   const terminal=await engine.result(target.session,target.operation,input.signal),after=state.readAccounting(task);
   if(!unchanged()||result.status!=='cancelled'||result.reason!=='CANCELLED'||terminal?.status!=='aborted'||(await engine.inspect(target.session,target.branch,input.signal)).pending||after?.owner!==null||state.readWriterLock()||hash(after.reservations)!==hash(accounting.reservations)||Object.entries(accounting.usage).some(([k,v])=>k==='activeMs'?after.usage.activeMs<Number(v):after.usage[k as keyof typeof after.usage]!==v))fail('TASK_UNCONFIRMED');
   return {status:'aborted',operation:target.operation,reconciliation};
  }finally{cancelledReportCheck=undefined;migrationRetiring=false;knownIdleAbort=false;current=undefined;}
 },async recoverInterruptedStop(input){if(firstLoop)fail('CAPABILITY_UNAVAILABLE');
  while(readCompletion)await awaitReads(input.signal);
  if(current||input.signal.aborted||!input.authorize()||config.ledger.pending?.().length)fail('AUTHORITY_REQUIRED');
  if([input.approval,input.expectedAccounting,input.expectedLedger,input.expectedLock].some(v=>!/^[a-f0-9]{64}$/.test(v))||Object.keys(input.arguments).length!==1||typeof input.arguments.step_id!=='string')fail('INVALID_REQUEST');
  const task=input.identity.task_id,accounting=state.readAccounting(task),rows=config.ledger.read(task),proof=input.provePreExecution();
  if(!accounting?.owner||hash(accounting)!==input.expectedAccounting||hash(rows)!==input.expectedLedger||!proof||!/^[a-f0-9]{64}$/.test(proof.task_sha256)||proof.step_id!==input.arguments.step_id||hash(proof.identity)!==hash(input.identity))fail('TASK_UNCONFIRMED');
  const audit=state.readAudit(task),events=audit.filter(e=>e.runId===accounting.owner),admitted=events.filter(e=>e.kind==='tool.admitted'&&!events.some(f=>f.kind==='tool.finished'&&f.invocation?.invocationId===e.invocation?.invocationId));
  const lock=state.readWriterLock(),starts=events.filter(e=>e.kind==='run.started'),firstModel=events.find(e=>e.kind==='model.admitted');
  if(!lock||hash(lock)!==input.expectedLock||starts.length!==1||!firstModel||Date.parse(lock.created_at)<Date.parse(starts[0]!.at)||Date.parse(lock.created_at)>Date.parse(firstModel.at)||starts[0]!.contextVersions?.revision!==input.identity.revision||starts[0]!.contextVersions?.scope!==input.identity.scope_sha256||starts[0]!.contextVersions?.configuration!==input.identity.config_sha256)fail('TASK_UNCONFIRMED');
  if(events.some(e=>e.kind==='run.finished')||admitted.length!==1||!admitted[0]!.invocation||admitted[0]!.toolName!=='execute_step'||admitted[0]!.digest!==hash(input.arguments))fail('TASK_UNCONFIRMED');
  const event=admitted[0]!,native=event.invocation!,binding=state.readBinding(native.operationId);
  current={identity:input.identity,nativeBusinessTools:true,prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
  interruptedProof={owner:accounting.owner,operation:native.operationId,invocation:native.invocationId,digest:event.digest!};
  try{
   if(!binding||binding.taskId!==task||binding.purpose!==sessionOwner(current)||!knownClosedEffects(task,native.sessionId,native.branch,native.operationId))fail('TASK_UNCONFIRMED');
   const storage=state.sessionStorage(async()=>true),prefix=new Map(readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl')).map(f=>{for(let i=1;i<=f.split('/').length;i++)if(lstatSync(join(storage.directory,...f.split('/').slice(0,i))).isSymbolicLink())fail('STATE_FAILED');const path=join(storage.directory,f);if(!lstatSync(path).isFile())fail('STATE_FAILED');return [f,readFileSync(path)] as const;}));if(!prefix.size)fail('TASK_UNCONFIRMED');
   const nativeDigest=()=>hash(readdirSync(storage.directory,{recursive:true}).filter((f):f is string=>typeof f==='string'&&f.endsWith('.jsonl')).sort().map(f=>[f,createHash('sha256').update(readFileSync(join(storage.directory,f))).digest('hex')])),beforeNative=nativeDigest(),bindings=hash(state.readNativeBindings(task));
   const recheck=()=>!input.signal.aborted&&input.authorize()&&hash(input.provePreExecution())===hash(proof)&&hash(config.ledger.read(task))===input.expectedLedger&&!config.ledger.pending?.().length;
   if(!recheck()||hash(state.readAudit(task))!==hash(audit)||hash(state.readNativeBindings(task))!==bindings||nativeDigest()!==beforeNative)fail('TASK_UNCONFIRMED');
   const reconciliation=hash({proof,identity:input.identity,invocation:native,audit:hash(audit),native:beforeNative,ledger:input.expectedLedger,bindings}),recovery=state.interruptedAbortLease({businessIdentity:hash(input.identity),task,expectedOwner:accounting.owner,expectedAccounting:input.expectedAccounting,expectedLock:input.expectedLock,approval:input.approval,reconciliation,signal:input.signal,authorize:recheck});
   const engine=await sdk(undefined,undefined,recovery),view=await engine.inspect(native.sessionId,native.branch,input.signal);
   if(view.pending?.kind!=='run'||view.pending.operationId!==native.operationId)fail('TASK_UNCONFIRMED');
   const history=await engine.history(native.sessionId,native.branch,input.signal),calls=history.flatMap(e=>e.message?.calls??[]).filter(c=>c.id===native.toolCallId);
   if(calls.length!==1||calls[0]!.name!=='execute_step'||hash(calls[0]!.arguments)!==event.digest)fail('TASK_UNCONFIRMED');
   const allowedControls=[{kind:'snapshot'},{kind:'snapshot',includeContent:false},{kind:'snapshot',includeContent:true},{kind:'abort'}].map(hash);
   if(audit.some(e=>e.kind==='session.control'&&e.session?.sessionId===native.sessionId&&e.session.branch===native.branch&&(!e.digest||!allowedControls.includes(e.digest))))fail('TASK_UNCONFIRMED');
   if(!recheck()||hash(state.readAudit(task))!==hash(audit)||hash(state.readNativeBindings(task))!==bindings||nativeDigest()!==beforeNative)fail('TASK_UNCONFIRMED');
   migrationRetiring=true;knownIdleAbort=true;
   const stopped=await engine.run({taskId:task,purpose:'analysis',sessionId:native.sessionId,branch:native.branch,tools:selectedTools(),prompt:'',system:'仅停止已证明尚未计算的中断操作，不重放。',contextVersions:{revision:input.identity.revision,scope:input.identity.scope_sha256,configuration:input.identity.config_sha256},limits:taskLimits(input.identity.task_id),modelRecovery:{extraAttempts:1},signal:input.signal,operation:'abort'});
   const terminal=await engine.result(native.sessionId,native.operationId,input.signal);
   if(!recheck()||stopped.status!=='cancelled'||stopped.reason!=='CANCELLED'||terminal?.status!=='aborted'||(await engine.inspect(native.sessionId,native.branch,input.signal)).pending)fail('TASK_UNCONFIRMED');
   for(const [f,bytes]of prefix)if(!readFileSync(join(storage.directory,f)).subarray(0,bytes.length).equals(bytes))fail('STATE_FAILED');
   recovery.finish(hash(terminal));return {status:'aborted',operation:native.operationId,reconciliation};
  }finally{interruptedProof=undefined;migrationRetiring=false;knownIdleAbort=false;current=undefined;}
 },migrateLongArtifacts:input=>migratePurposeConfiguration(input,'long-artifacts'),migrateReportTimeout:input=>migratePurposeConfiguration(input,'report-timeout'),migrateReportPro60:input=>migratePurposeConfiguration(input,'report-pro60'),migrateReportThinking:input=>migratePurposeConfiguration(input,'report-thinking'),migrateJudgmentReviewModel:input=>migratePurposeConfiguration(input,judgmentModel(input.identity.task_id).id===backup.id?'judgment-flash':'judgment-model'),migrateJudgmentReviewTimeout:input=>migratePurposeConfiguration(input,'judgment-timeout'),migrateJudgmentReviewProOff:input=>migratePurposeConfiguration(input,'judgment-pro-off'),migrateJudgmentReviewPro:input=>migratePurposeConfiguration(input,'judgment-pro'),migrateJudgmentReviewThinking:input=>migratePurposeConfiguration(input,'judgment-thinking'),async reconcileStopped(input){
  if(firstLoop)return false;
  while(readCompletion)await awaitReads(input.signal);
  if(current||input.signal.aborted||!input.authorize())return false;
  const id=input.identity,rows=config.ledger.read(id.task_id);
  if(config.ledger.pending?.().length)return false;
  const relevant=rows.filter(r=>r.run_id===id.run_id&&r.attempt_id===id.attempt_id);
  if(!relevant.length||relevant.some(r=>['reserved','issued','unknown'].includes(r.status)||r.revision!==id.revision||r.scope_sha256!==id.scope_sha256||r.config_sha256!==id.config_sha256||r.grant_id!==id.grant_id))return false;
  const accountingBefore=state.readAccounting(id.task_id),stop=accountingBefore?.interruptedStops?.at(-1);
  if(stop?.outcome==='stopped'&&stop.businessIdentity===hash(id)){
   if(accountingBefore!.owner!==null||state.readWriterLock())return false;
   const audit=state.readAudit(id.task_id),events=audit.filter(e=>e.runId===stop.owner),unfinished=events.filter(e=>e.kind==='tool.admitted'&&!events.some(f=>f.kind==='tool.finished'&&f.invocation?.invocationId===e.invocation?.invocationId)),event=unfinished[0];
   if(unfinished.length!==1||!event?.invocation||event.toolName!=='execute_step'||!event.digest||event.contextVersions.revision!==id.revision||event.contextVersions.scope!==id.scope_sha256||event.contextVersions.configuration!==id.config_sha256||!audit.some(e=>e.runId===stop.controlOwner&&e.kind==='run.finished'&&e.reason==='CANCELLED'&&e.session?.sessionId===event.invocation!.sessionId&&e.session.branch===event.invocation!.branch))return false;
   current={identity:id,nativeBusinessTools:true,prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};interruptedProof={owner:stop.owner,operation:event.invocation.operationId,invocation:event.invocation.invocationId,digest:event.digest};
   try{
    if(!knownClosedEffects(id.task_id,event.invocation.sessionId,event.invocation.branch,event.invocation.operationId))return false;
    const engine=await sdk(),terminal=await engine.result(event.invocation.sessionId,event.invocation.operationId,input.signal),view=await engine.inspect(event.invocation.sessionId,event.invocation.branch,input.signal);
    return !input.signal.aborted&&input.authorize()&&terminal?.status==='aborted'&&hash(terminal)===stop.terminal&&!view.pending&&hash(state.readAccounting(id.task_id))===hash(accountingBefore)&&hash(config.ledger.read(id.task_id))===hash(rows)&&hash(state.readAudit(id.task_id))===hash(audit);
   }finally{interruptedProof=undefined;current=undefined;}
  }
  const audit=state.readAudit(id.task_id),last=audit.filter(e=>e.kind==='run.finished'&&e.contextVersions.revision===id.revision&&e.contextVersions.scope===id.scope_sha256&&e.contextVersions.configuration===id.config_sha256).at(-1);
  if(!last?.session||!['STATE_FAILED','MODEL_FAILED'].includes(last.reason??''))return false;
  const binding=state.readBinding(last.session.operationId);
  if(!binding||binding.taskId!==id.task_id||binding.sessionId!==last.session.sessionId||binding.branch!==last.session.branch||!['analysis','analysis_native','analysis_objects','report_edit','conclusion_strategy_review'].includes(binding.purpose??'analysis'))return false;
  const events=audit.filter(e=>e.runId===last.runId),pending=new Set<string>();
  for(const e of events){if(e.kind==='tool.admitted'){if(!e.invocation)return false;pending.add(e.invocation.invocationId);}else if(e.kind==='tool.finished'){if(!e.invocation||e.toolFailed||!pending.delete(e.invocation.invocationId))return false;}}
  if(pending.size)return false;
  // A trusted host may close an observed, physically finished model failure
  // while its token usage remains unknown. Never refund or settle that reserve.
  const accounting=state.readAccounting(id.task_id),closed=[last];
  if(!accounting||accounting.owner!==null)return false;
  if(accounting?.reservations.length){
   // A current non-dispatch failure can be settled precisely while an older
   // physically closed model failure still retains its unknown usage charge.
   // The older revision is accounting history, never current execution authority.
   const latestAdmission=events.filter(e=>e.kind==='model.admitted').at(-1);
   const currentNonissued=last.reason==='STATE_FAILED'&&latestAdmission&&relevant.filter(r=>r.status==='failed'&&r.reason==='REQUEST_FAILED'&&r.usage.input_tokens.kind==='known'&&r.usage.input_tokens.value==='0'&&r.usage.output_tokens.kind==='known'&&r.usage.output_tokens.value==='0'&&r.provider===last.provider&&r.model===last.model&&r.started_at!==null&&r.ended_at!==null&&Date.parse(r.started_at)>=Date.parse(latestAdmission.at)&&Date.parse(r.started_at)<=Date.parse(last.at)&&Date.parse(r.ended_at)>=Date.parse(last.at)).length===1;
   if(last.reason!=='MODEL_FAILED'&&!currentNonissued)return false;
   const receipts=new Set<string>();
   for(const reservation of accounting.reservations){
    const end=audit.findLast(e=>e.runId===reservation.owner&&e.kind==='run.finished');
    if(!end?.session||end.contextVersions.scope!==id.scope_sha256||end.contextVersions.configuration!==id.config_sha256)return false;
    const owner=state.readBinding(end.session.operationId);
    // A read-only report may close after a deadline and a nonissued extra request.
    // Its physical usage stays unknown; only the separately proven nonissued reserve is settled.
    if(end.reason==='STATE_FAILED'&&owner?.purpose==='report_edit'){
     const ownerEvents=audit.filter(e=>e.runId===end.runId),ownerRows=rows.filter(r=>r.revision===end.contextVersions.revision&&r.scope_sha256===id.scope_sha256&&r.config_sha256===id.config_sha256&&r.grant_id===id.grant_id);
     const admissions=ownerEvents.filter(e=>e.kind==='model.admitted'),finished=ownerEvents.filter(e=>e.kind==='model.finished');
     if(!('cumulative' in accounting.limits)||owner.taskId!==id.task_id||owner.sessionId!==end.session.sessionId||owner.branch!==end.session.branch||ownerEvents.some(e=>e.kind.startsWith('tool.'))||admissions.length!==2||admissions[0]!.attempt!==1||admissions[1]!.attempt!==2||finished.length!==1||finished[0]!.attempt!==1||finished[0]!.reason!=='DEADLINE_EXCEEDED'||accounting.reservations.filter(r=>r.owner===end.runId).length!==1||reservation.tokens!==accounting.limits.maxOutputTokens)return false;
     const zero=ownerRows.filter(r=>r.status==='failed'&&r.reason==='REQUEST_FAILED'&&r.usage.input_tokens.kind==='known'&&r.usage.input_tokens.value==='0'&&r.usage.output_tokens.kind==='known'&&r.usage.output_tokens.value==='0'&&r.provider===end.provider&&r.model===end.model&&r.input_sha256===admissions[1]!.digest&&r.started_at!==null&&r.ended_at!==null&&Date.parse(r.started_at)>=Date.parse(admissions[1]!.at)&&Date.parse(r.started_at)<=Date.parse(end.at)&&Date.parse(r.ended_at)>=Date.parse(end.at));if(zero.length!==1)return false;
     const matches=ownerRows.filter(r=>r.status==='cancelled'&&r.reason==='REQUEST_CANCELLED'&&r.usage.input_tokens.kind==='unknown'&&r.usage.output_tokens.kind==='unknown'&&r.provider===end.provider&&r.model===end.model&&r.input_sha256===admissions[0]!.digest&&r.started_at!==null&&r.ended_at!==null&&Date.parse(r.started_at)>=Date.parse(admissions[0]!.at)&&Date.parse(r.started_at)<=Date.parse(finished[0]!.at)&&Date.parse(r.ended_at)>=Date.parse(r.started_at)&&Date.parse(r.ended_at)<=Date.parse(finished[0]!.at));
     if(matches.length!==1||receipts.has(matches[0]!.request_id))return false;receipts.add(matches[0]!.request_id);if(end.runId!==last.runId)closed.push(end);continue;
    }
    if(end.reason!=='MODEL_FAILED')return false;
    const modelPending=new Map<number,typeof end>(),toolPending=new Set<string>();
    for(const e of audit.filter(e=>e.runId===reservation.owner)){
     if(e.kind==='model.admitted'){if(e.attempt===undefined)return false;modelPending.set(e.attempt,e);}
     else if(e.kind==='model.finished'){if(e.attempt===undefined)return false;modelPending.delete(e.attempt);}
     else if(e.kind==='tool.admitted'){if(!e.invocation)return false;toolPending.add(e.invocation.invocationId);}
     else if(e.kind==='tool.finished'){if(!e.invocation||e.toolFailed||!toolPending.delete(e.invocation.invocationId))return false;}
    }
    if(toolPending.size||modelPending.size!==1)return false;
    const admission=[...modelPending.values()][0]!;
    const matches=rows.filter(r=>r.revision===end.contextVersions.revision&&r.scope_sha256===id.scope_sha256&&r.config_sha256===id.config_sha256&&r.grant_id===id.grant_id&&r.status==='failed'&&r.reason==='REQUEST_FAILED'&&r.usage.input_tokens.kind==='unknown'&&r.usage.output_tokens.kind==='unknown'&&r.provider===end.provider&&r.model===end.model&&r.started_at!==null&&r.ended_at!==null&&Date.parse(r.started_at)>=Date.parse(admission.at)&&Date.parse(r.started_at)<=Date.parse(end.at)&&Date.parse(r.ended_at)>=Date.parse(end.at));
    if(matches.length!==1||receipts.has(matches[0]!.request_id))return false;
    receipts.add(matches[0]!.request_id);
    if(!owner||owner.taskId!==id.task_id||owner.sessionId!==end.session.sessionId||owner.branch!==end.session.branch||!['analysis','analysis_native','analysis_objects'].includes(owner.purpose??'analysis'))return false;
    if(end.runId!==last.runId)closed.push(end);
   }
  }
  current={identity:id,prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
  try{const engine=await sdk();for(const end of closed){const s=end.session!,view=await engine.inspect(s.sessionId,s.branch,input.signal),result=await engine.result(s.sessionId,s.operationId,input.signal);if(input.signal.aborted||!input.authorize()||view.pending||result?.status!=='failed'||result.kind!=='run'||result.operationId!==s.operationId)return false;}return true;}
  finally{current=undefined;}
 },async collaborationTrace(input){
  while(readCompletion)await awaitReads(input.signal);
  if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
  if(current)fail('TASK_BUSY');
  if(input.conversation_id!==undefined&&!membershipUuid(input.conversation_id))fail('AUTHORITY_REQUIRED');
  const rootPurpose=state.readSession(input.identity.task_id,'analysis_objects')?'analysis_objects':state.readSession(input.identity.task_id,'analysis_native')?'analysis_native':'analysis',owner=input.conversation_id&&input.conversation_id!==input.identity.task_id?rootPurpose+':'+input.conversation_id:rootPurpose;
  const session=state.readSelectedSession(input.identity.task_id,owner);if(!session)fail('NATIVE_SESSION_NOT_FOUND');
  current={identity:input.identity,conversation_id:input.conversation_id,prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};const releaseRead=beginRead();
  try{
   const engine=await sdk(),entries=await engine.history(session,undefined,input.signal);
   if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
   const created:import('../../packages/ports/open-analysis-runtime.ts').AnalysisCollaborationTrace['created'][number][]=[],consumed:import('../../packages/ports/open-analysis-runtime.ts').AnalysisCollaborationTrace['consumed'][number][]=[];
   const calls=new Map<string,{name:string;arguments:Record<string,unknown>;position:number}>();let position=0;
   let pending:{child_id:string;result_id:string}[]=[];
   for(const entry of entries){
    const m=entry.message;
    if(m?.role==='user'||m?.role==='assistant'||entry.kind==='compaction'||entry.kind==='branch_summary')position++;
    if(m?.role==='assistant'){
     if(m.text.trim()||(m.calls?.length??0)>0){for(const ref of pending)consumed.push({...ref,history_position:position});pending=[];}
     for(const call of m.calls??[]){
      if(call.name==='analysis_tool'&&typeof call.arguments.name==='string'&&typeof call.arguments.arguments_json==='string'){try{const args=JSON.parse(call.arguments.arguments_json);if(args&&typeof args==='object'&&!Array.isArray(args))calls.set(call.id,{name:call.arguments.name,arguments:args,position});}catch{}}
      else if(nativeTools.some(t=>t.name===call.name)){
       const args=call.arguments;
       if(Object.keys(args).length===1&&typeof args.arguments_json==='string'){
        try{const decoded:unknown=JSON.parse(args.arguments_json);if(decoded&&typeof decoded==='object'&&!Array.isArray(decoded))calls.set(call.id,{name:call.name,arguments:decoded as Record<string,unknown>,position});}catch{}
       }else calls.set(call.id,{name:call.name,arguments:args,position});
      }
     }
    }else if(m?.role==='tool'&&!m.toolFailed){
     const call=calls.get(m.toolId??'');if(!call)continue;let value:unknown;try{value=JSON.parse(m.text);}catch{continue;}
     if(call.name==='delegate_analysis'&&value&&typeof value==='object'&&!Array.isArray(value)){
      const v=value as Record<string,unknown>,a=call.arguments;
      const material=v.material_id??a.material_id;
      if(v.state==='queued'&&membershipUuid(v.child_id)&&membershipUuid(material)&&(a.kind==='fork'||a.kind==='subagent'))created.push({child_id:v.child_id as string,material_id:material as string,kind:a.kind,history_position:call.position});
     }else if(call.name==='read_delegation_results'&&Array.isArray(value)){
      for(const raw of value){const r=raw?.result;if(raw?.classification==='MODEL'&&membershipUuid(r?.id)&&membershipUuid(r?.child_session_id))pending.push({child_id:r.child_session_id,result_id:r.id});}
     }
    }
   }
   return {created,consumed};
  }finally{current=undefined;releaseRead();}
 },async sessionControl(input){
  while(readCompletion)await awaitReads(input.signal);
  if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
  if(current&&sessionOwner(current).includes(':'))fail('TASK_BUSY');
  const purpose=input.purpose??(current?(current.purpose??'analysis'):state.readLatestPurpose(input.identity.task_id)??'analysis'),owner=purpose==='analysis'?(state.readSession(input.identity.task_id,'analysis_objects')?'analysis_objects':state.readSession(input.identity.task_id,'analysis_native')?'analysis_native':purpose):purpose==='proposal_prepare'&&state.readSession(input.identity.task_id,'proposal_objects')?'proposal_objects':purpose,sessionId=state.readSelectedSession(input.identity.task_id,owner);
  if(purpose==='conclusion_strategy_review'&&!reviewEnabled(input))fail('AUTHORITY_REQUIRED');
  if(!sessionId)fail('NATIVE_SESSION_NOT_FOUND');
  if(current&&(purpose!==(current.purpose??'analysis')||(['task_id','revision','grant_id','scope_sha256','config_sha256'] as const).some(key=>current!.identity[key]!==input.identity[key])))fail('TASK_BUSY');
  const prior=current;
  if(!prior)current={identity:input.identity,artifactWork:input.artifactWork,purpose:purpose==='analysis'?undefined:purpose as 'proposal_prepare'|'report_edit'|'retained_case'|'conclusion_strategy_review',prompt:'',system:'',tools:[],signal:input.signal,authorize:input.authorize};
  const releaseRead=!prior&&input.command.kind==='snapshot'?beginRead():()=>undefined;
  try{
   const engine=await sdk();
   if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
   if(firstLoop){
    const raw=await engine.inspectFacts({taskId:input.identity.task_id,purpose,sessionId,signal:input.signal});
    if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
    if(input.command.kind==='snapshot'){
     if(raw.availability!=='available')return {facts:{availability:raw.availability,...raw.reason?{reason:raw.reason}:{}}};
     const facts:import('../../packages/ports/open-analysis-runtime.ts').AnalysisSessionFacts={availability:'available',session_id:raw.sessionId,branch:raw.branch,tip_id:raw.tipId,...raw.terminal?{terminal:{operation_id:raw.terminal.operationId,status:raw.terminal.status}}:{},queue:raw.queue.availability==='known'?{availability:'known',entries:raw.queue.entries.map(e=>({entry_id:e.entryId,kind:e.kind}))}:{availability:'unknown'},admission:raw.admission.availability==='unknown'?{availability:'unknown'}:{availability:'known',terminal:raw.admission.terminal,corrections:raw.admission.corrections.map(c=>({...c})),facts:raw.admission.facts.map(f=>({call_id:f.callId,name:f.name,status:f.disposition,...f.code?{code:f.code}:{},corrections_used:f.correctionsUsed,terminal:f.terminal,stage_version:f.viewVersion}))}};
     return {facts};
    }
    if(raw.availability!=='available')fail('TASK_UNCONFIRMED');
    if(raw.admission.availability!=='known'||raw.admission.policyVersion!=='juanerai-harness-first-loop-v02')fail('CONFIGURATION_CHANGED');
    if(input.command.kind==='abort'&&!prior)return {};
   }
   if(input.command.kind==='fork'){
    const created=await engine.fork(sessionId,undefined,input.signal);
    if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
    state.registerFork(input.identity.task_id,owner,sessionId,created.id);return {sessionId:created.id};
   }
   if(input.command.kind==='navigate'){
    const result=await engine.run({taskId:input.identity.task_id,purpose,sessionId,tools:purpose==='report_edit'?reportTools():['retained_case','conclusion_strategy_review'].includes(purpose)?[]:selectedTools(),prompt:'',system:'仅整理本任务已有对话，不新增计算、授权或业务结论。',contextVersions:{scope:input.identity.scope_sha256,configuration:input.identity.config_sha256,revision:input.identity.revision},limits:taskLimits(input.identity.task_id),modelRecovery:{extraAttempts:1 as const},signal:input.signal,operation:'navigate',targetEntryId:input.command.entryId,summarize:input.command.summarize});if(result.status!=='succeeded')throw Object.assign(new Error(result.reason),{code:observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='OUTPUT_LIMIT'?'OUTPUT_INCOMPLETE':observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='CONTEXT_LIMIT'?'CONTEXT_LIMIT':result.reason,...(observesModels&&result.modelOutcome?{diagnostic:result.modelOutcome.diagnostic}:('diagnostic' in result?{diagnostic:result.diagnostic}:{}))});return {};
   }
   if(input.command.kind==='abort'&&!prior){
    const pending=(await engine.inspect(sessionId,undefined,input.signal)).pending;
    if(!pending)return {};
    const proof=purpose==='analysis'?cancelledModelProof(current!,sessionId,pending.operationId):null;
    if(!proof&&!knownClosedEffects(input.identity.task_id,sessionId,'main',pending.operationId))fail('TASK_UNCONFIRMED');
    cancelledReportCheck=proof?.check;knownIdleAbort=true;migrationRetiring=!!proof;
    try{
     const result=await engine.run({taskId:input.identity.task_id,purpose,sessionId,tools:selectedTools(),prompt:'',system:'显式停止已核账的中断操作，不执行或重放任何工具。',contextVersions:{scope:input.identity.scope_sha256,configuration:input.identity.config_sha256,revision:input.identity.revision},limits:taskLimits(input.identity.task_id),modelRecovery:{extraAttempts:1 as const},signal:input.signal,operation:'abort'});
     if(result.status!=='cancelled'||result.reason!=='CANCELLED'||(await engine.inspect(sessionId,undefined,input.signal)).pending)fail('TASK_UNCONFIRMED');
     if(proof&&(!proof.unchanged()||(await engine.result(sessionId,pending.operationId,input.signal))?.status!=='aborted'))fail('TASK_UNCONFIRMED');
     return {};
    }finally{cancelledReportCheck=undefined;knownIdleAbort=false;migrationRetiring=false;}
   }
   let reply:{entryId?:string;cancelled?:boolean;snapshot?:Pick<import('pi-agent-runtime').HarnessSnapshot,'branch'|'tipId'|'operationId'|'queued'|'activeTools'|'faulted'>},queueAvailable=true;
   try{reply=await engine.control({taskId:input.identity.task_id,purpose,sessionId,signal:input.signal,command:input.command});}
   catch(error){
    // SDK persists queue authority only after enqueue. Inspect owned history without inventing a known empty queue.
    if(input.command.kind!=='snapshot'||!(error instanceof RuntimeFault)||error.reason!=='AUTHORITY_REQUIRED')throw error;
    const status=await engine.inspect(sessionId,undefined,input.signal);queueAvailable=false;
    reply={snapshot:{branch:status.branch,tipId:status.tipId,operationId:status.pending?.operationId??null,queued:[],activeTools:[],faulted:!!status.pending}};
   }
   if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
   const snapshot=reply.snapshot;
   const history=snapshot&&!prior?(await engine.history(sessionId,snapshot.branch,input.signal)).flatMap<NonNullable<AnalysisSessionView['history']>[number]>(e=>{
    const role=e.message?.role;
    if(role==='user'||role==='assistant')return [{entryId:e.id,role,preview:e.message!.text.slice(0,120)}];
    if(e.kind==='compaction'||e.kind==='branch_summary')return [{entryId:e.id,role:'summary' as const,preview:(e.summary??'已保存的对话摘要').slice(0,120)}];
    return [];
   }):undefined;
   return {...reply.entryId?{entryId:reply.entryId}:{},...reply.cancelled!==undefined?{cancelled:reply.cancelled}:{},...snapshot?{view:{branch:snapshot.branch,tipId:snapshot.tipId,operationId:snapshot.operationId,queued:snapshot.queued,activeTools:snapshot.activeTools,faulted:snapshot.faulted,history,queueAvailable}}:{}};
  }finally{if(!prior)current=undefined;releaseRead();}
 },async collect(task){if(!runtimes.size)return;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([Promise.all([...runtimes.values()].map(engine=>engine.waitForIdle(task))),new Promise<void>(resolve=>timer=setTimeout(resolve,5000))]);}finally{if(timer)clearTimeout(timer);}},async run(input){
  while(readCompletion)await awaitReads(input.signal);
  if(current||config.ledger.pending?.().length)fail('TASK_BUSY');if(observesModels&&hasUnconfirmedEffects(input.identity.task_id))fail('TASK_UNCONFIRMED');if(input.conversation_id!==undefined&&(!membershipUuid(input.conversation_id)||input.purpose!==undefined&&input.purpose!=='retained_case'))fail('AUTHORITY_REQUIRED');if(input.continuation)fail('LEGACY_TASK_RECONCILIATION_REQUIRED');
  if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');if(input.purpose==='conclusion_strategy_review'&&!reviewEnabled(input))fail('AUTHORITY_REQUIRED');if(['report_edit','retained_case','conclusion_strategy_review'].includes(input.purpose??'')&&((input.tools.length&&!(input.purpose==='report_edit'&&longMode(input)&&input.artifactWork&&input.tools.length===1&&['build_artifact','complete_artifact'].includes(input.tools[0]?.name??'')))||input.sessionAdvance))fail('TOOL_POLICY_VIOLATION');
  if(!sharedWork)codeDraft?.clear();observations.length=0;discoveredContracts.clear();contractDisclosureTurn=undefined;delegationCorrectionPending=false;
  const wireTools=!firstLoop&&objectMode(input)?input.tools.map(nativeDelegationWire):input.tools;
  const delegated={...input,tools:wireTools.map(t=>({...t,execute:async(args:Readonly<Record<string,unknown>>,signal:AbortSignal)=>{if(t.name==='delegate_analysis'&&delegationCorrectionPending){const result={status:'deferred',created:false,executed:false,reason:'awaiting_model_correction',instruction:'同批后续委派尚未执行；先读取前一条指令的纠正反馈，在下一次模型回复中明确纠正，不自动重放。'};observations.push({name:t.name,result});return result;}let result=await t.execute(args,signal);
   if(t.name==='read_tool_contract'&&result&&typeof result==='object'&&!Array.isArray(result)&&Reflect.get(result,'executed')===false){const declared=wireTools.find(tool=>tool.name===args.name),original=input.tools.find(tool=>tool.name===args.name);if(declared&&original&&Reflect.get(result,'name')===args.name&&hash(Reflect.get(result,'parameters'))===hash(original.modelParameters??original.parameters))result={...result,description:declared.description,parameters:declared.modelParameters??declared.parameters};}
   if(t.name==='read_delegation_materials'&&Array.isArray(result)){
    const delegate=wireTools.find(tool=>tool.name==='delegate_analysis'),original=input.tools.find(tool=>tool.name==='delegate_analysis');
    if(delegate&&original&&delegate.parameters!==original.parameters){
     const producer=delegate.modelParameters as {properties?:Record<string,unknown>}|undefined;
     let focused=!!producer?.properties?.view_refs&&!producer.properties.material_ids;
     // A real legacy catalog can change advisory producer metadata only, never execution authority.
     if(focused&&result.length&&result.some(m=>!Array.isArray(m?.views)||!m.views.length)){
      const legacy=nativeDelegationWire({...original,modelParameters:original.parameters});
      for(const owned of [delegate,current!.tools.find(tool=>tool.name==='delegate_analysis')!]){Reflect.set(owned,'modelParameters',legacy.modelParameters??legacy.parameters);Reflect.set(owned,'description',legacy.description);}
      focused=false;
     }
     result=result.map(material=>{
      if(!material||typeof material!=='object'||!material.instruction_contract)return material;
      if(focused)return {...material,instruction_contract:{actions:material.instruction_contract.actions,maximum_materials:8,maximum_references:12,index_selection:'Use only the declared flat action and view_refs. Select actual view_ref values displayed in this catalog. Each maps exactly to its material and scope; choose distinct unique views, at most8 materials/12 actual references. No guessing, implicit selection or parameter repair.'}};
      return {...material,instruction_contract:{...material.instruction_contract,index_selection:'Use the declared flat native fields action, material_ids, reference_paths and completion_reference_paths. Choose real common paths from this catalog. Objects include actual descendants. At most12 references across all selected materials; no indices or nested instruction.'}};
     });
    }
   }
   if(t.name==='read_tool_contract'&&result&&typeof result==='object'&&!Array.isArray(result)&&Reflect.get(result,'executed')===false&&Reflect.get(result,'name')===args.name){
    const business=wireTools.find(tool=>tool.name===args.name),parameters=Reflect.get(result,'parameters');
    if(business&&parameters&&typeof parameters==='object'&&hash(parameters)===hash(business.modelParameters??business.parameters)){if(firstLoop)discoveredContracts.delete(business.name);discoveredContracts.set(business.name,hash(business.modelParameters??business.parameters));}
   }
   if(t.name==='delegate_analysis'&&result&&typeof result==='object'&&Reflect.get(result,'status')==='needs_instruction_correction')delegationCorrectionPending=true;observations.push({name:t.name,result});return result;}}))};current=delegated;let physicalContext:Promise<void>|undefined,workTimer:ReturnType<typeof setTimeout>|undefined,deadlineControl:AbortController|undefined;
  try{
   if(sharedWork){const scope=currentWork();if(scope.deadline_at!==null){if(Date.now()>=scope.deadline_at)fail('ARTIFACT_STAGE_DEADLINE');deadlineControl=new AbortController();workTimer=setTimeout(()=>deadlineControl!.abort(),Math.max(1,scope.deadline_at-Date.now()));input={...input,signal:AbortSignal.any([input.signal,deadlineControl.signal])};current={...delegated,signal:input.signal};}}
    const purpose=input.purpose??'analysis',engine=await sdk();
   const request={taskId:input.identity.task_id,purpose,prompt:input.prompt,
    system:input.system+(purpose==='conclusion_strategy_review'&&judgmentModel(input.identity.task_id).provider===backup.provider?'\nProvider wire uses response_format=json_object. Return one complete JSON object; business schema and judgments remain independently checked.':'')+(purpose==='retained_case'?'\nReturn exactly one raw JSON object matching the supplied business contract. No Markdown, code fences, prefix, or suffix.':'')+(['retained_case','conclusion_strategy_review'].includes(purpose)||purpose==='report_edit'&&!longMode(input)?'\nThis purpose has no tools. All required business content is supplied in this request. Do not request or simulate file reads, Skill loading, tool calls, or analysis execution. Treat the Skill catalog as background reference only. Return the requested business response directly.':(objectMode(input)?'\nUse the currently declared native business tools with their original JSON object parameters, actual arrays and explicit nulls. Do not encode business objects into arguments_json or use analysis_tool/XML wrappers. Full schema, business evidence and effect authorization still apply.':nativeBusinessPhase(input)?'\nUse the native named business tools with their declared wire parameters. For any tool declared with arguments_json, submit one exact serialized business JSON object string matching its supplied original contract or read_tool_contract. Pure scalar and empty tools use their declared direct business object. Do not use analysis_tool, XML/item wrappers, or invented defaults.':'\nUse analysis_tool with the business tool name and arguments_json containing its exact JSON arguments.')+(input.toolDiscovery?' Specific parameter schemas are available through read_tool_contract({name:business_tool_name}); read the current contract before using unfamiliar parameters. The catalog is not execution permission.':'')+(objectMode(input)?' Native declarations expose the complete current authorized business parameter contracts. No parameter repair or automatic replay.':nativeBusinessPhase(input)?input.toolDiscovery?' Native declarations contain full small original contracts in their descriptions, direct scalar/empty parameters and an exact JSON-string transport for nested object/array or large business contracts. Read large original contracts with read_tool_contract; valid original arguments proceed through full checks without a discovery gate. First unfamiliar invalid parameters return only the exact contract, executed:false. Observe that contract and explicitly submit corrected parameters in the next turn. Preserve required fields; no operation is automatically replayed.':' The current native tool declarations provide complete original business contracts. For structured tools the contract is in the description and the wire field is arguments_json.': ' Current authorized business tools:\n'+JSON.stringify(input.tools.map(t=>({name:t.name,description:t.description,...(input.toolDiscovery&&t.name!=='read_tool_contract'?{}:{parameters:t.parameters})}))))),
    contextVersions:{scope:input.identity.scope_sha256,configuration:input.identity.config_sha256,revision:input.identity.revision},limits:taskLimits(input.identity.task_id),modelRecovery:{extraAttempts:1 as const},signal:input.signal};
   let result,ownedSession:string|undefined;
   if(['report_edit','conclusion_strategy_review'].includes(purpose)&&!['analysis','analysis_native','analysis_objects','proposal_objects','proposal_prepare'].some(p=>state.readSession(input.identity.task_id,p)))fail('LEGACY_TASK_RECONCILIATION_REQUIRED');
   const owner=sessionOwner(input);let session=state.readSelectedSession(input.identity.task_id,owner);
   const parent=firstLoop&&['report_edit','conclusion_strategy_review'].includes(purpose)?(state.readSelectedSession(input.identity.task_id,'analysis_objects')??state.readSelectedSession(input.identity.task_id,'proposal_objects')):undefined;
   if(firstLoop&&state.hasNativeSession(input.identity.task_id)){const proofSession=session??parent;if(!proofSession)fail('CONFIGURATION_CHANGED');const facts=await engine.inspectFacts({taskId:input.identity.task_id,purpose:session?purpose:state.readSelectedSession(input.identity.task_id,'analysis_objects')===parent?'analysis':'proposal_prepare',sessionId:proofSession,signal:input.signal});if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');if(facts.availability!=='available')fail('TASK_UNCONFIRMED');if(facts.admission.availability!=='known'||facts.admission.policyVersion!=='juanerai-harness-first-loop-v02')fail('CONFIGURATION_CHANGED');}
   if(!session){if(config.ledger.read(input.identity.task_id).length&&!state.hasNativeSession(input.identity.task_id))fail('LEGACY_TASK_RECONCILIATION_REQUIRED');if(firstLoop&&['report_edit','conclusion_strategy_review'].includes(purpose)&&!parent)fail('LEGACY_TASK_RECONCILIATION_REQUIRED');const created=parent?await engine.fork(parent,undefined,input.signal):await engine.create(input.signal);state.selectSession(input.identity.task_id,owner,created.id);session=created.id;}
   if(!firstLoop&&purpose==='analysis'&&!input.sessionAdvance&&!input.conversation_id){
    const previous=await engine.inspect(session,undefined,input.signal);
    if(previous.pending){
     const proof=cancelledModelProof(input,session,previous.pending.operationId);if(proof){
     cancelledReportCheck=proof.check;knownIdleAbort=true;migrationRetiring=true;
     try{
      const stopped=await engine.run({...request,sessionId:session,tools:selectedTools(),prompt:'',system:'仅结束已物理取消且无工具效果的模型操作；不执行或重放模型、工具、排队消息。',operation:'abort'}),terminal=await engine.result(session,previous.pending.operationId,input.signal),after=state.readAccounting(input.identity.task_id);
      if(stopped.status!=='cancelled'||stopped.reason!=='CANCELLED'||terminal?.status!=='aborted'||(await engine.inspect(session,undefined,input.signal)).pending||!proof.unchanged()||!after||after.owner!==null||state.readWriterLock()||Object.entries(proof.accounting.usage).some(([k,v])=>k==='activeMs'?after.usage.activeMs<Number(v):after.usage[k as keyof typeof after.usage]!==v))fail('TASK_UNCONFIRMED');
     }finally{cancelledReportCheck=undefined;knownIdleAbort=false;migrationRetiring=false;}
     }
    }
   }
   if(['report_edit','conclusion_strategy_review'].includes(purpose)||purpose==='proposal_prepare'&&reviewEnabled(input)){
    // Short fact IDs belong to this report's evidence, never an earlier report.
    // A reviewed task's preparation also carries its current explicit business
    // context; earlier tool receipts cannot choose this operation's effect.
    // Native navigation preserves old entries and the fixed session/Task ledger.
    const previous=await engine.inspect(session,undefined,input.signal);
    if(previous.pending)fail('TASK_UNCONFIRMED');
    if(previous.tipId!==null){
     if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
     const isolated=await engine.run({...request,sessionId:session,tools:purpose==='proposal_prepare'?selectedTools():purpose==='report_edit'?reportTools():[],prompt:'',operation:'navigate',targetEntryId:null,summarize:false});
     if(isolated.status!=='succeeded')fail(isolated.reason);
    }
   }
   ownedSession=session;result=await engine.run({...request,sessionId:session,tools:purpose==='report_edit'?reportTools():['retained_case','conclusion_strategy_review'].includes(purpose)?[]:selectedTools(),...(input.sessionAdvance?{operation:input.sessionAdvance.kind,...(input.sessionAdvance.kind==='navigate'?{targetEntryId:input.sessionAdvance.entryId,summarize:input.sessionAdvance.summarize}:{})}:['report_edit','retained_case','conclusion_strategy_review'].includes(purpose)?{operation:'prompt' as const}:purpose==='proposal_prepare'?{operation:'template' as const,resourceName:input.preferences?.prompt??'professional',templateArguments:[input.prompt]}:{operation:'skill' as const,resourceName:input.preferences?.skill??'general'})});
   // Terminal cancellation/timeout may be observed before physical cleanup.
   // Keep this authorization context and writer ownership until the SDK settles.
   const idle=engine.waitForIdle(input.identity.task_id);
   if(result.status!=='succeeded'&&config.ledger.pending?.().length){
    // Surface the terminal result without claiming an unresolved physical model
    // has stopped. The same context keeps new writes fenced until actual idle.
    physicalContext=idle;throw Object.assign(new Error(result.reason),{code:observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='OUTPUT_LIMIT'?'OUTPUT_INCOMPLETE':observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='CONTEXT_LIMIT'?'CONTEXT_LIMIT':result.reason,...(observesModels&&result.modelOutcome?{diagnostic:result.modelOutcome.diagnostic}:('diagnostic' in result?{diagnostic:result.diagnostic}:{}))});
   }
   await idle;
   const history:AnalysisHistoryMessage[]=[];
   const callsById=new Map<string,string>();
   if(ownedSession)for(const entry of await engine.history(ownedSession,undefined,input.signal)){
    const message=entry.message;if(!message)continue;
    if(message.role==='user')history.push({speaker:'user',text:message.text});
    else if(message.role==='assistant'){
     for(const call of message.calls??[])callsById.set(call.id,call.name==='analysis_tool'&&typeof call.arguments.name==='string'?call.arguments.name:call.name);
     history.push({speaker:'assistant',text:message.text,calls:(message.calls??[]).map(c=>({id:c.id,name:c.name,arguments:c.arguments}))});
    }
    else if(message.role==='tool'){
     // Flatten only our acknowledged business dispatcher; this is evidence, never a recovery input.
     let value:unknown;try{value=JSON.parse(message.text);}catch{value=message.text;}
     history.push({speaker:'tool',call_id:message.toolId??entry.id,name:callsById.get(message.toolId??'')??message.toolName??'analysis_tool',result:value,failed:message.toolFailed??false});
    }
   }
   if(result.status!=='succeeded'){
    if(input.shouldYield?.()&&input.authorize()&&!input.signal.aborted)return {text:'',history,tools:[...observations]};
    throw Object.assign(new Error(result.reason),{code:observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='OUTPUT_LIMIT'?'OUTPUT_INCOMPLETE':observesModels&&(sharedWork||reviewEnabled(input))&&result.modelOutcome?.diagnostic==='CONTEXT_LIMIT'?'CONTEXT_LIMIT':result.reason,...(observesModels&&result.modelOutcome?{diagnostic:result.modelOutcome.diagnostic}:('diagnostic' in result?{diagnostic:result.diagnostic}:{}))});
   }
   return {text:result.value,history,provider:result.modelOutcome?.model.provider??(purpose==='conclusion_strategy_review'?judgmentModel(input.identity.task_id).provider:purpose==='report_edit'||purpose==='retained_case'?backup.provider:analysisModel.provider),model:result.modelOutcome?.model.id??(purpose==='conclusion_strategy_review'?judgmentModel(input.identity.task_id).id:purpose==='report_edit'?reportModel(input.identity.task_id).id:purpose==='retained_case'?retained.id:analysisModel.id),tools:[...observations]};
  }catch(error){if(deadlineControl?.signal.aborted)throw Object.assign(new Error('ARTIFACT_STAGE_DEADLINE'),{code:'ARTIFACT_STAGE_DEADLINE',provider_reason:(error as {code?:string}).code??null});if(observesModels&&error instanceof RuntimeFault)fail(error.reason);throw error;}finally{if(physicalContext){const owner=current;void physicalContext.then(()=>{if(workTimer)clearTimeout(workTimer);if(current===owner)current=undefined;},()=>{if(workTimer)clearTimeout(workTimer);/* Unknown cleanup retains the writer fence. */});}else{if(workTimer)clearTimeout(workTimer);current=undefined;}}

 }};
}

/** Compatibility business outputs, with native ownership and the same authoritative Task ledger. */
export function createPiSessionCaseRuntime(config:{projectRoot:string;ledger:AnalysisRequestLedger;credential:()=>string;modelTransport?:ModelTransport}):import('../../packages/ports/case-assistant.ts').CaseAssistantRuntime{
 const credentials=createApprovedProviderCredentials({environment:{}}),runtime=createPiSessionOpenAnalysisRuntime({...config,credentials,legacyCredential:config.credential}),state=createPersistentRuntimeState({projectRoot:config.projectRoot});
 const outcomes=new WeakMap<object,import('../../packages/product-core/member-model.ts').MembershipPhysicalOutcome>();
 function authority(value:import('../../packages/ports/case-assistant.ts').RuntimeTaskAuthority|undefined){if(!value||!value.authorize()||!Number.isSafeInteger(value.previous_calls)||value.previous_calls<0)fail('AUTHORITY_REQUIRED');if(value.previous_calls>0&&!state.hasNativeSession(value.identity.task_id))fail('LEGACY_TASK_RECONCILIATION_REQUIRED');return value;}
 async function text(a:import('../../packages/ports/case-assistant.ts').RuntimeTaskAuthority,prompt:string,system:string,signal:AbortSignal){const prior=new Set(config.ledger.read(a.identity.task_id).map(r=>r.request_id));const result=await runtime.run({purpose:'retained_case',...a.conversation_id?{conversation_id:a.conversation_id}:{},identity:a.identity,prompt,system,signal,authorize:a.authorize,tools:[]});const rows=config.ledger.read(a.identity.task_id).filter(r=>!prior.has(r.request_id)&&r.run_id===a.identity.run_id&&r.attempt_id===a.identity.attempt_id);return {result,rows};}
 return {taskAuthority:'shared_session',describeMembershipOutcome(value){return value!==null&&typeof value==='object'?outcomes.has(value)?structuredClone(outcomes.get(value)!):null:null;},async membershipTurn(raw){
  const a=authority(raw.runtime_authority),{runtime_authority,...body}=raw;void runtime_authority;const input=membershipModelTurn(body);if(a.identity.task_id!==input.context.task_id||a.identity.operation_id!==input.context.operation_id||a.identity.run_id!==input.context.execution_id||a.identity.attempt_id!==input.context.execution_id||a.identity.revision!==String(input.context.epoch+1)||a.identity.scope_sha256!==hash(input.payload)||a.identity.config_sha256!==hash(input.policy))fail('AUTHORITY_REQUIRED');const prior=new Set(config.ledger.read(a.identity.task_id).map(r=>r.request_id));const began=performance.now();
  const usage=():import('../../packages/product-core/member-operation.ts').OperationUsage=>{const rows=config.ledger.read(a.identity.task_id).filter(r=>!prior.has(r.request_id)&&r.run_id===a.identity.run_id&&r.attempt_id===a.identity.attempt_id);const tokens=(key:'input_tokens'|'output_tokens')=>rows.every(r=>r.usage?.[key].kind==='known')?{kind:'known' as const,value:String(rows.reduce((n,r)=>n+BigInt(r.usage![key].kind==='known'?r.usage![key].value:'0'),0n))}:{kind:'unknown' as const,reason:'provider_not_reported'};return {input_tokens:tokens('input_tokens'),output_tokens:tokens('output_tokens'),active_ms:{kind:'known',value:String(Math.floor(performance.now()-began))},wait_ms:{kind:'known',value:'0'}};};
  try{const {result}=await text(a,JSON.stringify(input.payload),membershipModelPrompt,input.signal);let parsed;try{parsed=JSON.parse(result.text);}catch{fail('VALIDATION_FAILED');}const value={version:'2.0' as const,context:input.context,provider:input.policy.provider,model:input.policy.model,output:membershipModelOutput(parsed,input.payload),usage:usage()};outcomes.set(value,{context:input.context,physical_status:'settled',usage:value.usage,result_sha256:membershipModelResultHash(value)});return value;}catch(error){const value=Object.assign(new Error('REQUEST_FAILED'),{code:String((error as {code?:string}).code??'REQUEST_FAILED'),stack:'REQUEST_FAILED'}),pending=config.ledger.read(a.identity.task_id).some(r=>['reserved','issued','unknown'].includes(r.status));outcomes.set(value,{context:input.context,physical_status:pending?'unknown':'settled',usage:usage(),result_sha256:null});throw value;}
 },async turn(input){const a=authority(input.runtime_authority);if(input.provider!==retained.provider||input.model!==retained.id)fail('AUTHORITY_REQUIRED');const {result,rows}=await text(a,input.payload,assistantPrompt(input),input.signal);let parsed;try{parsed=JSON.parse(result.text);}catch{fail('VALIDATION_FAILED');}const output=validateAssistantOutput(input,parsed);const known=rows.every(r=>r.usage?.input_tokens.kind==='known'&&r.usage.output_tokens.kind==='known');const cost=known?rows.reduce((n,r)=>n+(Number(r.usage!.input_tokens.kind==='known'?r.usage!.input_tokens.value:0)*300+Number(r.usage!.output_tokens.kind==='known'?r.usage!.output_tokens.value:0)*600)*1000000,0):null;if(cost!==null&&!Number.isSafeInteger(cost))fail('PROVIDER_USAGE_INVALID');return {provider:retained.provider,model:retained.id,cost_microunits:cost,output};}};
}

/** Existing disclosed professional drafts; native sessions, no new business authority. */
export function createPiSessionDecisionAssistanceRuntime(config:{projectRoot:string;ledger:AnalysisRequestLedger;credential:()=>string;modelTransport?:ModelTransport}):import('../../packages/ports/local-analysis.ts').DecisionAssistanceRuntime{
 const runtime=createPiSessionOpenAnalysisRuntime({...config,credentials:createApprovedProviderCredentials({environment:{}}),legacyCredential:config.credential}),state=createPersistentRuntimeState({projectRoot:config.projectRoot});let ready=false,active:AbortController|undefined;
 return {taskAuthority:'shared_session',async preflightSelection(input){ready=input.requested_provider===retained.provider&&input.requested_model===retained.id;return {runtime_id:'pi',runtime_version:'0.86.1',adapter_id:'pi-agent-runtime',adapter_version:'0.4.3',...input,ready};},async cancel(){active?.abort();return {cancelled:true};},async executeAssistance(input){
  const a=input.runtime_authority;if(!a||!a.authorize()||!Number.isSafeInteger(a.previous_calls)||a.previous_calls<0)fail('AUTHORITY_REQUIRED');
  if(a.previous_calls>0&&!state.hasNativeSession(a.identity.task_id))fail('LEGACY_TASK_RECONCILIATION_REQUIRED');
  if(!ready||input.requested_provider!==retained.provider||input.requested_model!==retained.id)fail('PROVIDER_UNAVAILABLE');
  if(!(input.payload_bytes instanceof Uint8Array)||createHash('sha256').update(input.payload_bytes).digest('hex')!==input.payload_sha256||a.identity.scope_sha256!==input.payload_sha256||a.identity.config_sha256!==hash({requested_provider:input.requested_provider,requested_model:input.requested_model}))fail('AUTHORITY_REQUIRED');
  if(!Number.isInteger(input.deadline_seconds)||input.deadline_seconds<0||input.deadline_seconds>300)fail('VALIDATION_FAILED');if(active)fail('TASK_BUSY');if(input.cancellation_signal.aborted)fail('CANCELLED');if(input.deadline_seconds===0)fail('DEADLINE_EXCEEDED');
  const prompt=new TextDecoder('utf-8',{fatal:true}).decode(input.payload_bytes),payload=closedTerminalJson(prompt);if(canonicalDesktopJson(payload)!==prompt||payload.action_kind!==input.action_kind)fail('VALIDATION_FAILED');validateDesktopAssistancePayload(payload);
  const control=new AbortController();active=control;const signal=AbortSignal.any([control.signal,input.cancellation_signal,AbortSignal.timeout(Math.min(30000,input.deadline_seconds*1000))]);
  try{const result=await runtime.run({purpose:'retained_case',identity:a.identity,prompt,system:desktopAssistanceSystemPrompt,tools:[],signal,authorize:a.authorize});if(signal.aborted||!a.authorize())fail('CANCELLED');const output=closedTerminalJson(result.text),expected=({organize_question:'question_fields',explain_evidence:'evidence_explanation',draft_candidates:'candidates'} as const)[input.action_kind];if(Object.keys(output).length!==2||output.draft_kind!==expected||!Object.hasOwn(output,'draft_content'))fail('VALIDATION_FAILED');validateDesktopAssistanceDraft(String(output.draft_kind),output.draft_content,true);return {actual_provider:retained.provider,actual_model:retained.id,draft_kind:expected,draft_content:output.draft_content as import('../../packages/ports/local-analysis.ts').RuntimeAssistanceDraftContent};}finally{active=undefined;}
 }};
}
