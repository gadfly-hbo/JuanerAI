// Host acceptance observer/guard only. Not shipped. Never logs credentials or SDK errors.
const {createHash}=require('node:crypto');
const sha=x=>createHash('sha256').update(x).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const demand=(v,code)=>{if(!v)throw Error(code);};
// Bounded structural diagnostics only: never model text, arbitrary keys or SDK errors.
exports.responseShape=(message,key)=>{
 const text=Array.isArray(message?.content)?message.content.filter(b=>b.type==='text'&&typeof b.text==='string').map(b=>b.text).join(''):'';
 if(key&&text.includes(key))return {blocked:true};
 const known=['draft_kind','draft_content','question_text','hypothesis_display_title','business_context','alternative_explanations','evidence_explanation_text','candidates','title','evidence_basis','risk_or_refutation','applicability_conditions','future_validation_metric'];
 const shape=(value,depth=0)=>{
  if(depth>5)return {type:'depth_limit'};
  if(value===null)return {type:'null'};
  if(Array.isArray(value))return {type:'array',length:value.length,items:value.slice(0,3).map(v=>shape(v,depth+1))};
  if(typeof value==='object')return {type:'object',fields:Object.fromEntries(known.filter(k=>Object.hasOwn(value,k)).map(k=>[k,shape(value[k],depth+1)])),unknown_fields:Object.keys(value).some(k=>!known.includes(k))};
  if(typeof value==='string')return {type:'string',nonblank:/[^\p{White_Space}]/u.test(value)};
  return {type:typeof value};
 };
 const trimmed=text.trimStart(),category=!trimmed?'empty':/^```/.test(trimmed)?'fenced_json':/^[{[]/.test(trimmed)?'json_parse_error':'non_json_prefix';
 let json={type:'invalid',category};if(Buffer.byteLength(text)<=32768)try{json=shape(JSON.parse(text));}catch{}
 return {stop_reason:['stop','length','toolUse','error','aborted'].includes(message?.stopReason)?message.stopReason:'unknown',bytes:Buffer.byteLength(text),sha256:sha(text),json};
};
exports.validate=(stage,plan,model,context,options)=>{
 demand(model.provider==='xiaomi-token-plan-cn'&&model.id==='mimo-v2.6-pro'&&model.baseUrl==='https://token-plan-cn.xiaomimimo.com/v1'&&model.api==='openai-completions','PS_REAL_MODEL');
 demand(same(context.tools,[])&&context.messages.length===1&&context.messages[0].role==='user'&&options.maxRetries===0&&same(options.env,{}),'PS_REAL_REQUEST');
 const text=context.messages[0].content;
 demand(typeof text==='string'&&!text.includes(options.apiKey)&&!context.systemPrompt.includes(options.apiKey)&&!/(?:\/Users\/|\/private\/|file:\/\/)/.test(text),'PS_REAL_DATA');
 if(stage==='probe')demand(text==='Reply with OK.'&&context.systemPrompt===''&&options.maxTokens===128,'PS_REAL_PROBE');
 else if(stage==='case-stop'||stage==='case-complete'){
  demand(context.systemPrompt===plan.case_system&&options.maxTokens===2048,'PS_REAL_CASE_SYSTEM');
  const body=JSON.parse(text);
  demand(same(Object.keys(body),['authorized_context','current_attempt_history','visible_message','authorized_tool_result']),'PS_REAL_CASE_SHAPE');
  demand(same(body.authorized_context,JSON.parse(plan.case.payload))&&([plan.case.task,plan.case.answer].includes(body.visible_message)||(body.visible_message===''&&body.authorized_tool_result!==null)),'PS_REAL_CASE_CONTEXT');
  demand(plan.case.tool_results.some(x=>same(x,body.authorized_tool_result)),'PS_REAL_TOOL_RESULT');
  demand(Array.isArray(body.current_attempt_history)&&body.current_attempt_history.every(e=>['user','question','advice','tool'].includes(e.kind)&&e.source_revision===plan.case.owner.revision_id),'PS_REAL_HISTORY');
  demand(body.current_attempt_history.filter(e=>e.kind==='user').every(e=>[plan.case.task,plan.case.answer].includes(e.text)),'PS_REAL_USER');
 }else{
  const item=plan.helpers.find(x=>x.action===stage);
  demand(item&&text===item.payload&&context.systemPrompt===plan.helper_system&&options.maxTokens===2048,'PS_REAL_HELPER');
 }
 demand(Buffer.byteLength(text)+Buffer.byteLength(context.systemPrompt)<=12000,'PS_REAL_SIZE');
 return sha(text);
};
exports.validatePayload=(stage,body,options)=>{
 demand(body.model==='mimo-v2.6-pro'&&body.max_completion_tokens===options.maxTokens&&body.thinking?.type==='disabled'&&!body.tools,'PS_REAL_PAYLOAD');
 demand(same(body.response_format,stage==='draft_candidates'?{type:'json_object'}:undefined),'PS_REAL_JSON_MODE');
};
exports.install=async(appRoot,plan,synthetic)=>{
 const {pathToFileURL}=require('node:url'),{join}=require('node:path');
 const sdk=await import(pathToFileURL(join(appRoot,'node_modules/@earendil-works/pi-coding-agent/dist/index.js')).href);
 demand(sdk.VERSION==='0.84.2','PS_REAL_SDK');
 const original=sdk.ModelRuntime.prototype.streamSimple,originalFetch=globalThis.fetch;
 let stage='idle',total=0,fetches=0;const counts={},records=[],armed=new Set(),admitted=new Map();
 const caps={probe:1,draft_candidates:1};
 if(synthetic)require('node:net').Socket.prototype.connect=function(){throw Error('PS_SYNTHETIC_SOCKET_FORBIDDEN');};
 globalThis.fetch=async(url,init)=>{
  demand(String(url)==='https://token-plan-cn.xiaomimimo.com/v1/chat/completions'&&init?.method?.toUpperCase()==='POST','PS_REAL_ENDPOINT');
  const hash=sha(init.body),entry=admitted.get(hash);demand(entry,'PS_REAL_UNADMITTED_FETCH');admitted.delete(hash);fetches++;
  if(!synthetic)return originalFetch(url,{...init,redirect:'error'});
  const item=plan.helpers.find(x=>x.action===entry.stage);
  const output=entry.stage==='probe'?'OK.':item?JSON.stringify(item.synthetic_output):JSON.stringify(entry.stage==='case-stop'||entry.index===1?{kind:'question',text:'Who owns this synthetic decision?'}:entry.index===2?{kind:'tool',tool:'read_evidence',revision_id:plan.case.owner.revision_id}:{kind:'draft',fields:plan.case.synthetic_fields});
  const chunk={id:'synthetic',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:output},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:entry.stage==='probe'?2:100,total_tokens:entry.stage==='probe'?102:200}};
  return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 };
 sdk.ModelRuntime.prototype.streamSimple=function(model,context,options){
  demand(caps[stage]&&total<2&&(counts[stage]??0)<caps[stage],'PS_REAL_CAP');
  const text_hash=exports.validate(stage,plan,model,context,options),current=stage,index=(counts[stage]??0)+1;
  counts[stage]=index;total++;const record={stage,index,text_sha256:text_hash,max_output:options.maxTokens};records.push(record);
  const stream=original.call(this,model,context,{...options,onPayload:(body,m)=>{
   options.onPayload?.(body,m);exports.validatePayload(current,body,options);
   record.response_format=body.response_format??null;const text=JSON.stringify(body);demand(!text.includes(options.apiKey)&&Buffer.byteLength(text)<=16000,'PS_REAL_PAYLOAD_DATA');admitted.set(sha(text),{stage:current,index});
  }});
  stream.result().then(message=>{record.response_shape=exports.responseShape(message,options.apiKey);const u=message.usage;if(u&&[u.input,u.cacheRead,u.cacheWrite,u.output].every(x=>Number.isSafeInteger(x)&&x>=0)){record.usage={input:u.input,cacheRead:u.cacheRead,cacheWrite:u.cacheWrite,output:u.output};record.credits_upper_bound=(u.input+u.cacheRead+u.cacheWrite)*300+u.output*600;}else record.usage_unknown=true;},()=>{record.usage_unknown=true;});
  return stream;
 };
 globalThis.psRealControl={arm(next){demand(next==='idle'||caps[next]&&!armed.has(next),'PS_REAL_REPEAT');stage=next;if(next!=='idle')armed.add(next);},read(){return {requests:total,fetches,counts:{...counts},records:structuredClone(records),synthetic};}};
};
