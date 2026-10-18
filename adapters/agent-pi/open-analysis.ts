import {release} from 'node:os';
import {setImmediate as yieldIO} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {loadLocalPi,localConnectionError} from './xiaomi-local.ts';
import type {createApprovedProviderCredentials} from './provider-credentials.ts';
import type {AnalysisRequestLedger} from '../../packages/ports/analysis-request-ledger.ts';
import {analysisRequestReasons,type AnalysisRequestReason} from '../../packages/ports/analysis-request-ledger.ts';
import type {OpenAnalysisRuntime,OpenAnalysisRun,AnalysisHistoryMessage} from '../../packages/ports/open-analysis-runtime.ts';
import type {OperationUsage} from '../../packages/product-core/member-operation.ts';
import {ToolOutputFailure,type Tool,type JsonValue} from 'pi-agent-runtime';
import {Check,Errors} from 'typebox/value';
import type {TSchema} from 'typebox';
export {createPiSessionOpenAnalysisRuntime} from './native-open-analysis.ts';

/** Identify only an explicit trusted-schema array-count discriminator; never guess a branch from rejected values. */
function conditionalArrayLimits(schema:any,value:unknown){
 if(!Array.isArray(schema?.anyOf)||!value||typeof value!=='object'||Array.isArray(value))return undefined;
 for(const [selector,base]of Object.entries(schema.properties??{}) as [string,any][]){
  const array=Reflect.get(value,selector);if(base?.type!=='array'||!Array.isArray(array)||!Number.isSafeInteger(base.maxItems))continue;
  const allowed:({count:number;index:number;maximum_items:Record<string,number>}|undefined)[]=schema.anyOf.map((branch:any,index:number)=>{const bounds=branch.properties?.[selector];if(bounds?.type!=='array'||!Number.isSafeInteger(bounds.minItems)||bounds.minItems<1||bounds.minItems!==bounds.maxItems)return undefined;
   const maximum_items:Record<string,number>={};for(const [key,bound]of Object.entries(branch.properties) as [string,any][])if(key!==selector&&schema.properties[key]?.type==='array'&&bound.type==='array'&&Number.isSafeInteger(bound.maxItems)&&bound.maxItems>=1)maximum_items[key]=bound.maxItems;
   return Object.keys(maximum_items).length?{count:bounds.minItems,index,maximum_items}:undefined;
  });
  if(allowed.some(row=>!row)||new Set(allowed.map(row=>row!.count)).size!==allowed.length)continue;
  const rows=allowed.filter((row):row is NonNullable<typeof row>=>!!row),fields=Object.keys(rows[0]!.maximum_items);
  if(rows.some(row=>fields.some(key=>!Object.hasOwn(row.maximum_items,key))||Object.keys(row.maximum_items).length!==fields.length))continue;
  const actual_totals:Record<string,{items_per_selection:number;selected_references:number;maximum:number}>={};
  for(const key of fields){const paths=Reflect.get(value,key);if(Array.isArray(paths))actual_totals[key]={items_per_selection:paths.length,selected_references:array.length*paths.length,maximum:Math.max(...rows.map(row=>row.count*row.maximum_items[key]!))};}
  return {selector,actual_count:array.length,maximum_items:base.maxItems,allowed_counts:rows.map(({index,...row})=>row),actual_totals};
 }
 return undefined;
}

/** Diagnostic filtering only: full trusted-schema Check still decides admission. */
function relevantArgumentErrors(schema:TSchema,value:unknown){
 const selections:{schema:string;instance:string;index:number}[]=[];const branchErrors:ReturnType<typeof Errors>=[];
 const token=(key:string)=>key.replace(/~/g,'~0').replace(/\//g,'~1');
 const visit=(raw:any,v:unknown,path:string,instance:string,depth:number)=>{
  if(!raw||typeof raw!=='object'||depth>24)return;
  if(Array.isArray(raw.anyOf)){
   const version=v&&typeof v==='object'&&!Array.isArray(v)?Reflect.get(v,'version'):undefined;
   const matches=raw.anyOf.flatMap((branch:any,index:number)=>version!==undefined&&Array.isArray(branch.properties?.version?.enum)&&branch.properties.version.enum.includes(version)?[index]:[]);
   const cardinality=conditionalArrayLimits(raw,v);if(!matches.length&&cardinality){const matching=cardinality.allowed_counts.findIndex(row=>row.count===cardinality.actual_count);if(matching>=0)matches.push(matching);else if(cardinality.actual_count>cardinality.maximum_items||cardinality.actual_count<raw.properties[cardinality.selector].minItems){selections.push({schema:path+'/anyOf/',instance,index:-1});return;}}
   if(matches.length===1){const index=matches[0],branchPath=path+'/anyOf/'+index;selections.push({schema:path+'/anyOf/',instance,index});branchErrors.push(...Errors(raw.anyOf[index] as TSchema,v).map(error=>({...error,instancePath:instance+error.instancePath,schemaPath:branchPath+error.schemaPath.slice(1)})));visit(raw.anyOf[index],v,branchPath,instance,depth+1);return;}
  }
  if(raw.properties&&v&&typeof v==='object'&&!Array.isArray(v))for(const [key,child]of Object.entries(raw.properties))if(Object.hasOwn(v,key))visit(child,Reflect.get(v,key),path+'/properties/'+token(key),instance+'/'+token(key),depth+1);
  if(raw.items&&Array.isArray(v))v.forEach((item,index)=>visit(raw.items,item,path+'/items',instance+'/'+index,depth+1));
 };
 visit(schema,value,'#','',0);
 return [...Errors(schema,value),...branchErrors].filter(error=>selections.every(selection=>{
  if(error.instancePath!==selection.instance&&!error.instancePath.startsWith(selection.instance+'/')||!error.schemaPath.startsWith(selection.schema))return true;
  return Number(error.schemaPath.slice(selection.schema.length).split('/')[0])===selection.index;
 })).slice(0,12);
}

/** Fixed SDK metadata; the Application's current tool subset remains authoritative. */
export function createSharedAnalysisTool(current:()=>OpenAnalysisRun,modelTurn?:()=>number,preserveEffects=false):Tool {
 const rejected=new WeakMap<OpenAnalysisRun,Set<string>>(),feedbackTurn=new WeakMap<OpenAnalysisRun,number>();
 return {
  name:'analysis_tool',description:'Execute one currently authorized JuanerAI business tool. Use the current task tool catalog; arguments_json must encode its exact arguments.',
  effect:'write',resourceUnits:1,executionMode:'sequential',
  parameters:{type:'object',properties:{name:{type:'string',minLength:1},arguments_json:{type:'string',maxLength:262144}},required:['name','arguments_json'],additionalProperties:false},
  async execute(args,signal,invocation){
   const input=current(),assertAuthority=()=>{if(signal.aborted||input.signal.aborted)fail('CANCELLED');if(!input.authorize())fail('AUTHORITY_REQUIRED');if(current()!==input)fail('TASK_CHANGED');};
   assertAuthority();
   // Synchronous business batches must leave a turn for native storage, stop and page IO.
   await yieldIO();assertAuthority();
   // Only an Application-confirmed delegation queue may accept additional delegates.
   // Other business yields leave later calls in this native batch unexecuted.
   // Preserve that state in history instead of disguising it as a tool failure.
   if(input.shouldYield?.()&&!(args.name==='delegate_analysis'&&input.canQueueDelegation?.()))return {status:'deferred',code:'ANALYSIS_YIELD',executed:false,instruction:'当前运行已等待后续处理；本操作尚未执行。续接后根据实际返回结果决定是否仍需调用，不自动重放。'};
   if(Object.keys(args).length!==2||typeof args.name!=='string'||typeof args.arguments_json!=='string'||Buffer.byteLength(args.arguments_json)>262144)fail('TOOL_ARGUMENT_INVALID');
   const candidates=input.tools.filter(t=>t.name===args.name);if(candidates.length!==1)fail('TOOL_POLICY_VIOLATION');
   const tool=candidates[0];
   // A model has not observed feedback from another call in its own response.
   // Delay the remaining batch, without resetting the one-correction counter.
   if(modelTurn&&feedbackTurn.get(input)===modelTurn())return {status:'deferred',code:'AWAITING_ARGUMENT_FEEDBACK',executed:false,instruction:'本条回复前面的参数需要纠正；余下操作尚未执行。先在下一轮读取实际反馈，再明确提交仍需执行的正确参数，不自动重放。'};
   const reject=(issues:readonly Readonly<{path:string;keyword:string;schema_path?:string;required_properties?:string[];position?:number;line?:number;column?:number}>[]):JsonValue=>{
    assertAuthority();const names=rejected.get(input)??new Set<string>();
    if(!input.recoverInvalidArguments||names.has(tool.name))fail('TOOL_ARGUMENT_INVALID');
    names.add(tool.name);rejected.set(input,names);if(modelTurn)feedbackTurn.set(input,modelTurn());
    const structured=issues.map(issue=>{
     // Resolve only the trusted schema pointer, never inspect or repair rejected input.
     let expected:unknown=tool.parameters;
     for(const token of (issue.schema_path?.startsWith('#/')?issue.schema_path.slice(2).split('/'):[])){
      const key=token.replace(/~1/g,'/').replace(/~0/g,'~');
      expected=expected&&typeof expected==='object'&&Object.hasOwn(expected,key)?Reflect.get(expected,key):undefined;
     }
     return {...issue,...((issue.schema_path==='#'||issue.schema_path?.startsWith('#/'))&&expected&&typeof expected==='object'&&Buffer.byteLength(JSON.stringify(expected))<=8192?{expected_schema:expected as JsonValue}:{})};
    });
    const cardinality=conditionalArrayLimits(tool.parameters,decoded);
    return {status:'invalid_arguments',code:'TOOL_ARGUMENT_INVALID',executed:false,issues:structured,...(cardinality?{conditional_array_limits:cardinality}:{}),remaining_corrections:1,instruction:'该工具参数未通过当前schema，业务操作没有执行。按问题路径和expected_schema给出的字段结构，由你明确纠正一次；数组须提交数组，整数须提交整数；只纠正实际报错部分，保留其余已正确字段。可空字段若列在required中，也必须显式保留null，不能省略。提交前核对完整当前工具schema，避免纠正一处却删除另一处必要字段。不把结构纠正当业务含义确认。不能添加权限、猜资料或把失败当已核验。'};
   };
   let decoded:unknown;try{decoded=JSON.parse(args.arguments_json);}catch(error){
    // Never forward parser text: it can contain source fragments or secrets.
    const message=error instanceof SyntaxError?error.message:'',position=/\bposition (\d+)\b/.exec(message),location=/\bline (\d+) column (\d+)\b/.exec(message);
    return reject([{path:'/',keyword:'valid_json',...(position?{position:Number(position[1])}:{}),...(location?{line:Number(location[1]),column:Number(location[2])}:{})}]);
   }
   if(!decoded||typeof decoded!=='object'||Array.isArray(decoded))return reject([{path:'/',keyword:'object'}]);
   let valid=false;try{valid=Check(tool.parameters as TSchema,decoded);}catch{fail('TOOL_ARGUMENT_INVALID');}
   if(!valid)return reject(relevantArgumentErrors(tool.parameters as TSchema,decoded).map(e=>({path:e.instancePath,keyword:e.keyword,schema_path:e.schemaPath,...(e.keyword==='required'&&Array.isArray(e.params.requiredProperties)?{required_properties:e.params.requiredProperties.filter((v):v is string=>typeof v==='string').slice(0,32)}:{})})));
   assertAuthority();const result=await tool.execute(decoded as Readonly<Record<string,unknown>>,AbortSignal.any([signal,input.signal]));
   try{assertAuthority();
   // Normalize only the platform JSON boundary, never tool arguments or business numbers.
   let text:string|undefined;try{text=JSON.stringify(result,(_key,value)=>{if(typeof value==='number'&&!Number.isFinite(value)||typeof value==='function'||typeof value==='symbol')fail('TOOL_RESULT_INVALID');return value;});}catch{fail('TOOL_RESULT_INVALID');}if(text===undefined)fail('TOOL_RESULT_INVALID');
   // A successfully executed and publishable original operation resolves its structural feedback.
   // Keep the batch observation marker; failures and deferred calls never reach this point.
   // Program generation/correction keeps its separately bounded existing allowance.
   if(!['explore_with_python','correct_exploration_code'].includes(tool.name))rejected.get(input)?.delete(tool.name);
   return JSON.parse(text) as JsonValue;
   }catch(error){
    if(preserveEffects){const code=(error as {code?:string}).code;throw new ToolOutputFailure({name:'analysis_tool',effect:'write',status:'completed',modelOutput:'failed',resourceUnits:1,...invocation?{invocation}:{}},code==='CANCELLED'?'CANCELLED':code==='AUTHORITY_REQUIRED'?'AUTHORITY_REQUIRED':'TOOL_FAILED');}throw error;
   }
  },
 };
}

// Preserve malformed provider arguments losslessly for hashing/checkpointing.
// Decoding never validates or accepts them; the original tool validator still runs.
const rawArgumentsKey='__juanerai_untrusted_arguments_json';
function checkpointArguments(value:Record<string,unknown>):Record<string,unknown>{
 const fractional=(v:unknown):boolean=>typeof v==='number'?!Number.isSafeInteger(v):Array.isArray(v)?v.some(fractional):v!==null&&typeof v==='object'?Object.values(v).some(fractional):false;
 return fractional(value)||Object.hasOwn(value,rawArgumentsKey)?{[rawArgumentsKey]:JSON.stringify(value)}:value;
}
function restoreArguments(value:Record<string,unknown>):Record<string,unknown>{
 return Object.keys(value).length===1&&typeof value[rawArgumentsKey]==='string'?JSON.parse(value[rawArgumentsKey] as string):value;
}
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const failureReason=(code:string):AnalysisRequestReason=>analysisRequestReasons.find(r=>r===code)??'REQUEST_FAILED';
function operation(base:string,turn:number){const h=hash({base,turn});return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
function usage(message:any,began:number):OperationUsage{
 const u=message?.usage,valid=u&&[u.input,u.cacheRead,u.cacheWrite,u.output].every(x=>Number.isSafeInteger(x)&&x>=0),reported=valid&&(u.input+u.cacheRead+u.cacheWrite+u.output)>0;
 return {input_tokens:reported?{kind:'known',value:String(u.input+u.cacheRead+u.cacheWrite)}:{kind:'unknown',reason:'provider_not_reported'},output_tokens:reported?{kind:'known',value:String(u.output)}:{kind:'unknown',reason:'provider_not_reported'},active_ms:{kind:'known',value:String(Math.max(0,Math.floor(performance.now()-began)))},wait_ms:{kind:'known',value:'0'}};
}
/** Pi types, protocol mapping and secrets remain entirely inside this Adapter. */
/** Bounded schema diagnostics only; the installed validator remains authoritative. */
function parameterTypeIssues(schema:unknown,value:unknown){
 const issues:{path:string;expected:string;actual:string}[]=[];
 const type=(v:unknown)=>v===null?'null':Array.isArray(v)?'array':typeof v;
 const walk=(raw:any,v:any,path:string,depth:number)=>{
  if(!raw||depth>24||issues.length>=16)return;
  if(Array.isArray(raw.anyOf)){
   const branches=raw.anyOf;
   const matching=(key:string)=>v&&typeof v==='object'?branches.filter((b:any)=>Array.isArray(b.properties?.[key]?.enum)&&b.properties[key].enum.includes(v[key])):[];
   const exact=matching('version'),method=matching('operation');
   const selected=exact.length===1?exact[0]:method.length===1?method[0]:null;
   if(selected){walk(selected,v,path,depth+1);return;}
   const compatible=branches.filter((b:any)=>b.type===type(v)||b.type==='integer'&&type(v)==='number');
   if(compatible.length===1)walk(compatible[0],v,path,depth+1);
   return;
  }
  if(typeof raw.type==='string'&&raw.type!==type(v)&&!(raw.type==='integer'&&type(v)==='number')){issues.push({path,expected:raw.type,actual:type(v)});return;}
  if(raw.type==='object'&&v&&type(v)==='object'){
   for(const key of raw.required??[])if(!Object.hasOwn(v,key)&&issues.length<16)issues.push({path:path+'.'+key,expected:'required',actual:'missing'});
   if(raw.additionalProperties===false)for(const key of Object.keys(v))if(!Object.hasOwn(raw.properties??{},key)&&issues.length<16)issues.push({path:path+'.'+key,expected:'not allowed',actual:'present'});
   for(const [key,child]of Object.entries(raw.properties??{}))if(Object.hasOwn(v,key))walk(child,v[key],path+'.'+key,depth+1);
  }
  if(raw.type==='array'&&Array.isArray(v))for(let n=0;n<v.length&&issues.length<16;n++)walk(raw.items,v[n],path+'['+n+']',depth+1);
 };
 walk(schema,value,'$',0);return issues;
}

/** Retain fixed protocol metadata only; SDK text is inspected in memory and discarded. */
export function sanitizedProviderFailure(error:unknown){
 const message=String((error as {message?:unknown})?.message??error??'');
 const status=message.match(/^(?:API Error:\s*)?([45]\d{2})\b/),code=message.match(/(?:"status_code"\s*:\s*|API Error:\s*)(\d{1,5})\b/);
 const type=['invalid_request_error','authentication_error','permission_error','not_found_error','rate_limit_error','api_error','overloaded_error'].find(x=>message.includes('"'+x+'"'))??null;
 return {http_status:status?Number(status[1]):null,provider_code:code?Number(code[1]):null,error_type:type};
}
export function createPiOpenAnalysisRuntime(config:{ledger:AnalysisRequestLedger;credentials:ReturnType<typeof createApprovedProviderCredentials>;loadPi?:typeof loadLocalPi;maxModelTurns?:number;primaryEndpoint?:'https://api.minimax.cn/anthropic'|'https://api.minimaxi.com/anthropic';transport?:typeof globalThis.fetch;onFailureDiagnostic?:(event:Readonly<{request_id:string;provider:string;http_status:number|null;provider_code:number|null;error_type:string|null}>)=>void}):OpenAnalysisRuntime{
 // Optional bound belongs only to a specifically bounded verification command.
 // Production stops on task outcome/permission/explicit stop, not a new budget cap.
 const maxTurns=config.maxModelTurns;if(maxTurns!==undefined&&(!Number.isSafeInteger(maxTurns)||maxTurns<1))fail('VALIDATION_FAILED');
 const primaryEndpoint=config.primaryEndpoint??'https://api.minimaxi.com/anthropic';if(!['https://api.minimax.cn/anthropic','https://api.minimaxi.com/anthropic'].includes(primaryEndpoint))fail('OUTBOUND_FORBIDDEN');
 const active=new Set<string>();const pending=new Map<string,Set<Promise<unknown>>>();
 const track=(task:string,promise:Promise<unknown>)=>{let set=pending.get(task);if(!set){set=new Set();pending.set(task,set);}set.add(promise);void promise.finally(()=>{set!.delete(promise);if(!set!.size)pending.delete(task);}).catch(()=>undefined);};
 return {async collect(task_id:string){const requests=[...(pending.get(task_id)??[])];if(!requests.length)return;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([Promise.allSettled(requests),new Promise(resolve=>timer=setTimeout(resolve,5000))]);}finally{if(timer)clearTimeout(timer);}},async run(input:OpenAnalysisRun){
  const assertAuthority=()=>{if(input.signal.aborted)fail('CANCELLED');if(!input.authorize())fail('AUTHORITY_REQUIRED');};assertAuthority();
  if(input.purpose==='report_edit'&&input.tools.length)fail('TOOL_POLICY_VIOLATION');
  if(active.size||pending.size||config.ledger.pending?.().length)fail('TASK_BUSY');active.add(input.identity.task_id);
  let agent:any;const observations:{name:string;result:unknown}[]=[];let turn=input.continuation?.turn??0;let terminalError='';
  const abort=()=>{config.ledger.stop(input.identity.task_id);agent?.abort();};input.signal.addEventListener('abort',abort,{once:true});
  try{
   const {core,models,openAI,anthropic,transport,validateToolArguments}=await (config.loadPi??loadLocalPi)();assertAuthority();
   const main=models.getModel('minimax-cn','MiniMax-M3');if(!main)fail('RUNTIME_UNAVAILABLE');
   // Approved R1 uses the previously authorized minimaxi Anthropic endpoint by default.
   const primary={...structuredClone(main),api:'anthropic-messages',baseUrl:primaryEndpoint};
   const backup={id:'mimo-v2.6-flash',name:'MiMo v2.6 Flash',provider:'xiaomi-token-plan-cn',api:'openai-completions',baseUrl:'https://token-plan-cn.xiaomimimo.com/v1',reasoning:true,input:['text','image'],contextWindow:1048576,maxTokens:131072,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},compat:{supportsStrictMode:true,requiresReasoningContentOnAssistantMessages:true,thinkingFormat:'deepseek'}};
   // SEP11: same Pi Runtime and ledger; only the final no-tool interpretation
   // uses the existing MiMo configuration. Do not fall back to a known-bad
   // MiniMax interpretation when MiMo is unavailable. Analysis keeps its route.
   const status=config.credentials.status();const first=input.purpose==='report_edit'?(status.backup.state==='configured'?backup:null):status.primary.state==='configured'?primary:status.primary.state==='missing'&&status.backup.state==='configured'?backup:null;if(!first)fail('CREDENTIAL_UNAVAILABLE');
   const nested=new Set((input.purpose==='proposal_prepare'?input.tools.filter(t=>t.name==='set_analysis_steps'):input.tools).filter(t=>Object.values((t.parameters as any).properties??{}).some((p:any)=>p.type==='array'||p.type==='object'||p.anyOf?.some((x:any)=>x.type==='object'||x.type==='array'))).map(t=>t.name));
   const decode=(name:string,args:any)=>{if(!nested.has(name)||!Object.hasOwn(args??{},'arguments_json'))return args;if(Object.keys(args).length!==1||typeof args.arguments_json!=='string'||Buffer.byteLength(args.arguments_json)>262144)fail('TOOL_ARGUMENT_INVALID');let value:any;try{value=JSON.parse(args.arguments_json);}catch{fail('TOOL_ARGUMENT_INVALID');}if(!value||typeof value!=='object'||Array.isArray(value))fail('TOOL_ARGUMENT_INVALID');return value;};
   const historyArguments=(name:string,args:any)=>{try{return decode(name,args);}catch{return {invalid_arguments_json:typeof args?.arguments_json==='string'?args.arguments_json:JSON.stringify(args)};}};
   const encode=(name:string,args:any)=>nested.has(name)?{arguments_json:typeof args?.invalid_arguments_json==='string'?args.invalid_arguments_json:JSON.stringify(args)}:args;
   const history=(messages:any[]):AnalysisHistoryMessage[]=>messages.filter(m=>m.role!=='assistant'||!['error','aborted'].includes(m.stopReason)).map(m=>{
    if(m.role==='user')return {speaker:'user',text:typeof m.content==='string'?m.content:m.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('')};
    if(m.role==='assistant')return {speaker:'assistant',text:m.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join(''),calls:m.content.filter((c:any)=>c.type==='toolCall').map((c:any)=>({id:c.id,name:c.name,arguments:checkpointArguments(historyArguments(c.name,c.arguments))}))};
    if(m.role==='toolResult'){const text=m.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('');let result:unknown;try{result=JSON.parse(text);}catch{result=text;}return {speaker:'tool',call_id:m.toolCallId,name:m.toolName,result,failed:m.isError===true};}
    fail('CONVERSATION_INVALID');
   });
   const restore=(messages:readonly AnalysisHistoryMessage[])=>messages.map(m=>m.speaker==='user'?{role:'user',content:m.text,timestamp:0}:m.speaker==='tool'?{role:'toolResult',toolCallId:m.call_id,toolName:m.name,content:[{type:'text',text:JSON.stringify(m.result)}],details:null,isError:m.failed,timestamp:0}:{role:'assistant',content:[...(m.text?[{type:'text',text:m.text}]:[]),...m.calls.map(c=>({type:'toolCall',id:c.id,name:c.name,arguments:encode(c.name,restoreArguments(c.arguments))}))],api:first.api,provider:first.provider,model:first.id,usage:{input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},stopReason:m.calls.length?'toolUse':'stop',timestamp:0});
   const streamFn=async(_selected:unknown,context:any,options:any)=>{
    if(input.shouldYield?.())fail('ANALYSIS_YIELD');
    assertAuthority();const ordinal=++turn;if(maxTurns!==undefined&&ordinal-(input.continuation?.turn??0)>maxTurns){terminalError='STEP_LIMIT';fail(terminalError);}
    const inputHash=hash({system:context.systemPrompt,tools:input.tools.map(t=>({name:t.name,description:t.description,parameters:t.parameters})),messages:history(context.messages)});
    for(let extra=0;extra<=1;extra++){
     assertAuthority();const selected=extra===0?first:backup;
     const stream=await config.credentials.withCredential(selected.provider,async discovered=>{
      if(discovered.provider!==selected.provider||discovered.model!==selected.id||!(discovered.provider==='minimax-cn'?['https://api.minimax.cn/anthropic','https://api.minimaxi.com/anthropic']:['https://token-plan-cn.xiaomimimo.com/v1']).includes(discovered.endpoint))fail('OUTBOUND_FORBIDDEN');
      const credential={...discovered,endpoint:selected.baseUrl};
      assertAuthority();const request=config.ledger.reserve({...input.identity,operation_id:operation(input.purpose==='report_edit'?operation(input.identity.operation_id,-1):input.identity.operation_id,ordinal),input_sha256:inputHash,provider:credential.provider,model:credential.model as 'MiniMax-M3'|'mimo-v2.6-flash'});
      const deadline=new AbortController(),timer=setTimeout(()=>deadline.abort(),30000),signal=AbortSignal.any([input.signal,deadline.signal]);const began=performance.now();
      let physical:any;let result:Promise<any>|undefined;let abortWait:()=>void=()=>undefined;
      try{
       assertAuthority();config.ledger.issue(request.request_id);
       physical=(selected.provider==='minimax-cn'?anthropic:openAI).streamSimple(selected,context,{...options,signal,apiKey:credential.key,...(credential.provider==='minimax-cn'?{interleavedThinking:false,headers:{'User-Agent':`pi (${process.platform} ${release()}; ${process.arch})`}}:{}),env:{},maxTokens:4096,maxRetries:0,maxRetryDelayMs:0,fetch:async(url:string|URL|Request,init:RequestInit)=>{
        assertAuthority();const target=new URL(typeof url==='string'?url:url instanceof URL?url.href:url.url);
        if(target.origin!==new URL(credential.endpoint).origin||target.pathname!==new URL(credential.endpoint).pathname+(credential.provider==='minimax-cn'?'/v1/messages':'/chat/completions')||(target.search!==''&&!(credential.provider==='minimax-cn'&&target.search==='?beta=true'))||target.username||target.password)fail('OUTBOUND_FORBIDDEN');
        // M3's current Anthropic compatibility route matches the successful
        // installed reference SDK's fixed beta query; no other query is admitted.
        if(credential.provider==='minimax-cn')target.search='?beta=true';
        const outbound=typeof url==='object'&&!(url instanceof URL)?new Request(target,url):target;
        return (config.transport??transport)(outbound,{...init,redirect:'error'});
       },onPayload:(body:unknown,model:any)=>{
        assertAuthority();const payload=JSON.stringify(body);if(model.provider!==credential.provider||model.id!==credential.model||model.baseUrl!==credential.endpoint||model.api!==(credential.provider==='minimax-cn'?'anthropic-messages':'openai-completions')||Buffer.byteLength(payload)>1048576||payload.includes(credential.key))fail('OUTBOUND_FORBIDDEN');
       }});
       result=physical.result();track(input.identity.task_id,result!);
       const aborted=new Promise<never>((_resolve,reject)=>{abortWait=()=>reject(Object.assign(new Error('CANCELLED'),{code:'CANCELLED'}));if(signal.aborted)abortWait();else signal.addEventListener('abort',abortWait,{once:true});});
       const message=await Promise.race([result,aborted]);
       const timedOut=deadline.signal.aborted&&!input.signal.aborted;
       const success=!signal.aborted&&!['error','aborted'].includes(message.stopReason)&&Array.isArray(message.content)&&message.content.length>0,code=timedOut?'CONNECTION_TIMEOUT':success?'':localConnectionError(message.errorMessage),temporary=(!signal.aborted||timedOut)&&['NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED'].includes(code);
       if(!success&&config.onFailureDiagnostic){try{config.onFailureDiagnostic({request_id:request.request_id,provider:credential.provider,...sanitizedProviderFailure(message.errorMessage)});}catch{/* Observability does not alter request outcome. */}}
       const settled=config.ledger.settle(request.request_id,{status:success?'succeeded':temporary?'temporary_failure':'failed',reason:success?'REQUEST_SUCCEEDED':failureReason(timedOut?'CONNECTION_TIMEOUT':signal.aborted?'CANCELLED':code),usage:usage(message,began)});
       assertAuthority();if(success&&!settled.publishable)fail('CANCELLED');
       if(!success){if(temporary&&extra===0)return null;fail(timedOut?'CONNECTION_TIMEOUT':signal.aborted?'CANCELLED':code);}
       if(JSON.stringify(message.content).includes(credential.key))fail('OUTBOUND_FORBIDDEN');return physical;
      }catch(error){
       // A deadline is eligible for the shared extra request only when the
       // owned SDK response has ended. Never issue over an UNKNOWN response.
       if(deadline.signal.aborted&&!input.signal.aborted&&result&&input.authorize()){
        let collectionTimer:ReturnType<typeof setTimeout>|undefined;
        const collected=await Promise.race([result.then((message:any)=>({settled:true as const,message}),()=>({settled:true as const,message:null})),new Promise<{settled:false}>(resolve=>collectionTimer=setTimeout(()=>resolve({settled:false}),5000))]);
        if(collectionTimer)clearTimeout(collectionTimer);
        const current=config.ledger.read(input.identity.task_id).find(r=>r.request_id===request.request_id);
        if(collected.settled&&current?.status==='issued'){
         config.ledger.settle(request.request_id,{status:'temporary_failure',reason:'CONNECTION_TIMEOUT',usage:usage(collected.message,began)});
         assertAuthority();if(extra===0)return null;terminalError='CONNECTION_TIMEOUT';fail(terminalError);
        }
       }
       const state=config.ledger.read(input.identity.task_id).find(r=>r.request_id===request.request_id);
       if(state?.status==='issued')config.ledger.settle(request.request_id,{status:physical?'unknown':'failed',reason:physical?'REQUEST_UNCONFIRMED':'REQUEST_FAILED',usage:usage(null,began)});
       if(result){const account=(late:any)=>{try{const r=config.ledger.read(input.identity.task_id).find(x=>x.request_id===request.request_id);if(r?.status==='unknown')config.ledger.settle(request.request_id,{status:signal.aborted?'cancelled':'failed',usage:usage(late,began)});}catch{/* Durable UNKNOWN remains if late accounting cannot be saved. */}};track(input.identity.task_id,result.then(account,()=>account(null)));}
       const code=deadline.signal.aborted&&!input.signal.aborted?'CONNECTION_TIMEOUT':String((error as {code?:unknown}).code??'');terminalError=['AUTHORITY_REQUIRED','CANCELLED','OUTBOUND_FORBIDDEN','PHYSICAL_PENDING','OPERATION_COMPLETE','OPERATION_CONFLICT','RETRY_EXHAUSTED','RETRY_FORBIDDEN','STOPPED','NETWORK_UNAVAILABLE','QUOTA_EXCEEDED','CONNECTION_TIMEOUT','CREDENTIAL_INVALID'].includes(code)?code:localConnectionError(error);fail(terminalError);
      }finally{clearTimeout(timer);signal.removeEventListener('abort',abortWait);}
     });
     if(stream)return stream;
    }
    fail('RETRY_EXHAUSTED');
   };
   if(!input.tools.length){
    if(input.continuation?.messages.some(m=>m.speaker==='tool'||m.speaker==='assistant'&&m.calls.length))fail('CONVERSATION_INVALID');
    const messages=input.continuation?restore(input.continuation.messages):[{role:'user',content:input.prompt,timestamp:Date.now()}];
    let last:any=messages.at(-1);
    if(last?.role!=='assistant'){
     const stream=await streamFn(first,{systemPrompt:input.system,messages},{signal:input.signal});last=await stream.result();assertAuthority();
     if(last?.stopReason!=='stop'||last.content.some((c:any)=>c.type==='toolCall'))fail('ANALYSIS_INCOMPLETE');
     messages.push(last);
     if(input.saveContinuation){await input.saveContinuation({version:'1.0',turn,messages:history(messages)});assertAuthority();}
    }
    assertAuthority();if(last?.role!=='assistant'||last.stopReason!=='stop')fail('ANALYSIS_INCOMPLETE');
    const text=last.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('');if(/<\/?think\b/i.test(text))fail('THINKING_CHANNEL_INVALID');
    return {text,provider:last.provider,model:last.model,tools:observations};
   }
   agent=new core.Agent({initialState:{messages:input.continuation?restore(input.continuation.messages):[],model:first,systemPrompt:input.system,thinkingLevel:'off',tools:input.tools.map(tool=>({name:tool.name,label:tool.name,description:tool.description+(nested.has(tool.name)?' 参数必须通过arguments_json提供一个完整JSON字符串，不使用XML/item包装。字符串内业务参数遵循：'+JSON.stringify(tool.parameters):''),...(input.purpose==='proposal_prepare'?{prepareArguments:(args:Record<string,unknown>)=>{let original:Record<string,unknown>|undefined;try{original=decode(tool.name,args);validateToolArguments(tool,{name:tool.name,arguments:original});}catch(error){throw Object.assign(new Error(JSON.stringify({code:'TOOL_ARGUMENT_INVALID',calculation_performed:false,parameters:tool.parameters,parameter_issues:parameterTypeIssues(tool.parameters,original??args),validation_detail:String((error as {message?:unknown}).message??'Invalid business parameters'),instruction:'未执行。parameter_issues先列所选方法的字段类型与缺失问题；version须按schema作为字符串，filters须作为数组。当前parameters包含所有支持的版本；anyOf其他分支错误不代表所选方法不可用。按所选version的required字段修正原参数（无分组时明确group_by:null），再提交；不自动修复或重试。'})),{code:'TOOL_ARGUMENT_INVALID',stack:'TOOL_ARGUMENT_INVALID'});}return args;}}:{}),parameters:nested.has(tool.name)?{type:'object',properties:{arguments_json:{type:'string',description:'完整业务参数JSON对象的序列化字符串；不得把对象字段放在arguments_json之外。'}},required:['arguments_json'],additionalProperties:false}:tool.parameters,execute:async(_id:string,args:Record<string,unknown>,signal:AbortSignal)=>{
    assertAuthority();let decoded:Record<string,unknown>;try{decoded=decode(tool.name,args);}catch(error){if((error as {code?:unknown}).code!=='TOOL_ARGUMENT_INVALID')throw error;throw Object.assign(new Error(JSON.stringify({code:'TOOL_ARGUMENT_INVALID',calculation_performed:false,parameters:tool.parameters,instruction:'未执行。arguments_json必须是一个完整、可解析的JSON对象字符串，不加额外括号，不提交compiled Binding/receipt。按parameters提交业务参数；若工具无必填参数且方案已绑定，可提交空对象{}。错误参数原样保留，没有自动修复或内部重试。'})),{code:'TOOL_ARGUMENT_INVALID',stack:'TOOL_ARGUMENT_INVALID'});}let original:Record<string,unknown>;try{original=validateToolArguments(tool,{name:tool.name,arguments:decoded});}catch(error){throw Object.assign(new Error(JSON.stringify({code:'TOOL_ARGUMENT_INVALID',calculation_performed:false,parameters:tool.parameters,parameter_issues:parameterTypeIssues(tool.parameters,decoded),validation_detail:String((error as {message?:unknown}).message??'Invalid business parameters'),instruction:'未执行。parameter_issues先列所选方法的字段类型与缺失问题；不得把字符串版本改成数字或空数组改成字符串。以上parameters是当前完整业务参数规范，不能从anyOf某个分支的错误推断其他版本或方法不受支持。按所选version对应的结构修正参数；不添加该分支没有的字段。原错误参数与失败保留，没有自动修复或内部重试。'})),{code:'TOOL_ARGUMENT_INVALID',stack:'TOOL_ARGUMENT_INVALID'});}const result=await tool.execute(original,AbortSignal.any([input.signal,signal]));assertAuthority();const text=JSON.stringify(result);if(text===undefined||Buffer.byteLength(text)>1048576)fail('TOOL_RESULT_INVALID');observations.push({name:tool.name,result:structuredClone(result)});return {content:[{type:'text',text}],details:null};
   }}))},toolExecution:'sequential',streamFn});
   let committedTurn=input.continuation?.turn??0;
   const persist=async()=>{if(input.saveContinuation){assertAuthority();await input.saveContinuation({version:'1.0',turn:committedTurn,messages:history(agent.state.messages)});assertAuthority();}};
   agent.subscribe(async(event:any)=>{if(event.type!=='message_end'||event.message.role==='assistant'&&['error','aborted'].includes(event.message.stopReason)||input.signal.aborted)return;if(event.message.role==='assistant')committedTurn=turn;await persist();});
   if(input.continuation?.messages.length){
    const last=agent.state.messages.at(-1);
    if(last.role==='assistant'&&last.stopReason==='toolUse'){
     for(const call of last.content.filter((c:any)=>c.type==='toolCall')){assertAuthority();const tool=agent.state.tools.find((t:any)=>t.name===call.name);if(!tool)fail('METHOD_UNAVAILABLE');const result=await tool.execute(call.id,validateToolArguments(tool,call),input.signal);agent.appendMessage({role:'toolResult',toolCallId:call.id,toolName:call.name,content:result.content,details:null,isError:false,timestamp:Date.now()});await persist();}
    }
    const current=agent.state.messages.at(-1);if(current.role==='user'&&current.content!==input.prompt)await agent.prompt({role:'user',content:input.prompt,timestamp:Date.now()});else if(current.role!=='assistant')await agent.continue();
   }else await agent.prompt({role:'user',content:input.prompt,timestamp:Date.now()});assertAuthority();if(terminalError)fail(terminalError);
   if(input.shouldYield?.()){await persist();return {text:'',tools:observations};}
   const last=agent.state.messages.at(-1);if(last?.role!=='assistant'||last.stopReason!=='stop')fail('ANALYSIS_INCOMPLETE');
   const text=last.content.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('');if(/<\/?think\b/i.test(text))fail('THINKING_CHANNEL_INVALID');
   return {text,provider:last.provider,model:last.model,tools:observations};
  }finally{input.signal.removeEventListener('abort',abort);agent?.abort();active.delete(input.identity.task_id);}
 }};
}


/** Fixed names for the autonomous native protocol. Phase authority remains the current Application subset. */
export function createNativeBusinessTools(current:()=>OpenAnalysisRun,modelTurn?:()=>number,beforeArguments?:(name:string,args:Readonly<Record<string,unknown>>,signal:AbortSignal)=>JsonValue|undefined,preserveEffects=false):readonly Tool[]{
 const dispatcher=createSharedAnalysisTool(current,modelTurn,preserveEffects);
 const names=['ask_user','assess_meaning','bind_measurement','calculate_and_verify','correct_exploration_code','delegate_analysis','describe_business','describe_meaning','execute_step','explore_with_python','finish_result','inspect_selected','interpret_meaning','read_analysis_evidence','read_authorized_context','read_delegation_materials','read_delegation_results','read_project_metric_asset','read_tool_contract','rewrite_saved_report','set_analysis_steps','set_document_framework','set_framework','set_joined_framework','set_membership_framework','set_metric_asset_framework','set_multisource_framework'];
 return names.map(name=>({name,description:name==='read_tool_contract'?'Read the exact parameters for one currently authorized business tool. Arguments: {name: tool_name}. No execution or new permission.':'JuanerAI business operation '+name+'. Use the current phase catalog and read_tool_contract for exact parameters. Unavailable operations are rejected.',parameters:{type:'object',additionalProperties:true},effect:'write' as const,resourceUnits:1,executionMode:'sequential' as const,execute:async(args,signal,invocation)=>{
  const dispatch=async(text:string)=>{try{return await dispatcher.execute({name,arguments_json:text},signal,invocation);}catch(error){if(preserveEffects&&error instanceof ToolOutputFailure&&error.outcome.name==='analysis_tool')throw new ToolOutputFailure({...error.outcome,name},error.reason);throw error;}};
  // Reuse the existing exact JSON wire codec; never repair, coerce or replay business parameters.
  let original:Readonly<Record<string,unknown>>=args;let text=JSON.stringify(args);
  if(Object.keys(args).length===1&&typeof args.arguments_json==='string'){
   text=args.arguments_json;if(Buffer.byteLength(text)>262144)return dispatch(text);
   try{const decoded:unknown=JSON.parse(text);if(decoded&&typeof decoded==='object'&&!Array.isArray(decoded))original=decoded as Readonly<Record<string,unknown>>;else return dispatch(text);}catch{return dispatch(text);}
  }
  const discovery=beforeArguments?.(name,original,signal);if(discovery!==undefined)return discovery;
  return dispatch(text);
 }}));
}
export {captureAnalysisToolContracts} from './analysis-tool-contracts.ts';
export {createAnalysisCodeDraft} from './analysis-code-draft.ts';
