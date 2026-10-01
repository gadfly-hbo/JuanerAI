import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixedXiaomiModel,assistantPrompt,validateAssistantOutput,XIAOMI_CREDIT_RESERVATION} from './case-assistant.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
/** SDK error text is classified in memory, never returned, logged or retained. */
export function localConnectionError(error:unknown):string {
 const x=error as {status?:number;code?:unknown;message?:unknown};
 if(['CREDENTIAL_INVALID','NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED','CANCELLED','OUTBOUND_FORBIDDEN','PROVIDER_USAGE_INVALID','VALIDATION_FAILED'].includes(String(x?.code)))return String(x.code);
 const message=String(x?.message??error??'');
 if(x?.status===401||x?.status===403||/\b(?:401|403)\b|invalid.?api.?key|authentication|unauthorized/i.test(message))return 'CREDENTIAL_INVALID';
 if(x?.status===429||/\b429\b|quota|insufficient.*(?:credit|balance)|rate.?limit/i.test(message))return 'QUOTA_EXCEEDED';
 if(/timeout|timed out|ETIMEDOUT/i.test(message))return 'CONNECTION_TIMEOUT';
 if(/ECONN|ENOTFOUND|EAI_AGAIN|network|fetch failed|connection error/i.test(message))return 'NETWORK_UNAVAILABLE';
 return 'CONNECTION_FAILED';
}
export async function loadLocalPi(){
 const specifier='@earendil-works/pi-coding-agent';const sdk=await import(specifier);
 if(sdk.VERSION!=='0.84.2')fail('RUNTIME_UNAVAILABLE');const root=sdk.getPackageDir(),nested=join(root,'node_modules','@earendil-works');
 for(const name of ['pi-agent-core','pi-ai'])if(JSON.parse(await readFile(join(nested,name,'package.json'),'utf8')).version!=='0.84.2')fail('RUNTIME_UNAVAILABLE');
 const core=await import(pathToFileURL(join(nested,'pi-agent-core/dist/index.js')).href);
 const {AuthStorage}=await import(pathToFileURL(join(root,'dist/core/auth-storage.js')).href);
 const models=await sdk.ModelRuntime.create({credentials:AuthStorage.inMemory(),allowModelNetwork:false,refreshOnCreate:false,modelsPath:null});
 return {core,models};
}
/** Exactly one installed Pi Agent/ModelRuntime request. No resource/session discovery or tools. */
export async function runLocalXiaomiText(input:{key:string;text:string;system:string;signal:AbortSignal;maxOutput:number;timeoutMs:number;jsonObject?:boolean}){
 if(!input.key||/[\r\n\0]/.test(input.key)||Buffer.byteLength(input.key)>4096)fail('CREDENTIAL_INVALID');
 if(!Number.isInteger(input.maxOutput)||input.maxOutput<1||input.maxOutput>2048||input.timeoutMs<1||input.timeoutMs>60000)fail('VALIDATION_FAILED');
 if(Buffer.byteLength(input.text)+Buffer.byteLength(input.system)>12000||input.text.includes(input.key)||input.system.includes(input.key))fail('OUTBOUND_FORBIDDEN');
 const deadline=new AbortController(),timer=setTimeout(()=>deadline.abort(),input.timeoutMs),signal=AbortSignal.any([input.signal,deadline.signal]);
 let agent:{abort():void;prompt(input:unknown):Promise<void>;state:{messages:Record<string,unknown>[]}}|undefined;
 const abort=()=>agent?.abort();signal.addEventListener('abort',abort,{once:true});
 try{
  const {core,models}=await loadLocalPi();if(signal.aborted)fail(input.signal.aborted?'CANCELLED':'CONNECTION_TIMEOUT');
  const model=structuredClone(fixedXiaomiModel);let issued=false;
  agent=new core.Agent({initialState:{model,systemPrompt:input.system,tools:[],thinkingLevel:'off'},toolExecution:'sequential',shouldStopAfterTurn:()=>true,
   streamFn:(selected:typeof model,context:unknown,options:Record<string,unknown>)=>{
    if(issued||signal.aborted)fail('CANCELLED');issued=true;
    return models.streamSimple(selected,context,{...options,maxTokens:input.maxOutput,maxRetries:0,maxRetryDelayMs:0,signal,apiKey:input.key,env:{},
     onPayload:(body:unknown,m:typeof model)=>{if(input.jsonObject===true)(body as Record<string,unknown>).response_format={type:'json_object'};const payload=JSON.stringify(body);if(m.id!==model.id||m.provider!==model.provider||m.baseUrl!==model.baseUrl||m.api!==model.api||Buffer.byteLength(payload)>16000||payload.includes(input.key))fail('OUTBOUND_FORBIDDEN');},
    });
   }});
  const cancelled=new Promise<never>((_,reject)=>{const check=()=>reject(Object.assign(new Error('cancelled'),{code:input.signal.aborted?'CANCELLED':'CONNECTION_TIMEOUT'}));if(signal.aborted)check();else signal.addEventListener('abort',check,{once:true});});
  await Promise.race([agent!.prompt({role:'user',content:input.text,timestamp:Date.now()}),cancelled]);
  if(signal.aborted)fail(input.signal.aborted?'CANCELLED':'CONNECTION_TIMEOUT');
  const m=agent!.state.messages.at(-1);
  if(!m||m.role!=='assistant'||m.stopReason!=='stop')fail(localConnectionError(m?.errorMessage));
  if(m.provider!==model.provider||m.model!==model.id||!Array.isArray(m.content)||m.content.some(b=>b.type!=='text'&&b.type!=='thinking'))fail('VALIDATION_FAILED');
  const text=m.content.filter(b=>b.type==='text').map(b=>b.text??'').join('');if(text.includes(input.key))fail('OUTBOUND_FORBIDDEN');
  const u=m.usage as {input:number;cacheRead:number;cacheWrite:number;output:number;totalTokens:number};
  if(!u||[u.input,u.cacheRead,u.cacheWrite,u.output,u.totalTokens].some(x=>!Number.isSafeInteger(x)||x<0)||u.output>input.maxOutput||u.input+u.cacheRead+u.cacheWrite>16384||u.totalTokens!==u.input+u.cacheRead+u.cacheWrite+u.output)fail('PROVIDER_USAGE_INVALID');
  return {text,cost_microunits:((u.input+u.cacheRead+u.cacheWrite)*300+u.output*600)*1000000};
 }catch(error){fail(signal.aborted?(input.signal.aborted?'CANCELLED':'CONNECTION_TIMEOUT'):localConnectionError(error));}
 finally{clearTimeout(timer);signal.removeEventListener('abort',abort);agent?.abort();}
}
export async function probeLocalXiaomi(key:string,signal:AbortSignal){
 const result=await runLocalXiaomiText({key,text:'Reply with OK.',system:'',signal,maxOutput:128,timeoutMs:30000});
 if(result.text.trim()!=='OK.'&&result.text.trim()!=='OK')fail('CONNECTION_FAILED');
}

export function createPiStoredCaseAssistantRuntime(credential:()=>string):import('../../packages/ports/case-assistant.ts').CaseAssistantRuntime{
 return {async turn(input){
  if(input.provider!==fixedXiaomiModel.provider||input.model!==fixedXiaomiModel.id)fail('AUTHORITY_REQUIRED');
  if(input.cost_reservation_microunits<XIAOMI_CREDIT_RESERVATION)fail('BUDGET_EXHAUSTED');
  const result=await runLocalXiaomiText({key:credential(),text:input.payload,system:assistantPrompt(input),signal:input.signal,maxOutput:2048,timeoutMs:60000});
  let output:import('../../packages/contracts/case-assistant.ts').AssistantTurnResult['output'];
  try{output=JSON.parse(result.text);}catch{fail('VALIDATION_FAILED');}
  output=validateAssistantOutput(input,output);
  if(result.cost_microunits>input.cost_reservation_microunits)fail('PROVIDER_USAGE_INVALID');
  return {provider:input.provider,model:input.model,cost_microunits:result.cost_microunits,output};
 }};
}
