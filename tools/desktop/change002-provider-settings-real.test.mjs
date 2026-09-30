import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {BOUNDS,verifyReceipt,armNativeStage,recordHelperTerminal} from './change002-provider-settings-real.mjs';
const require=createRequire(import.meta.url),guard=require('./change002-provider-settings-real-guard.cjs');
const model={provider:'xiaomi-token-plan-cn',id:'mimo-v2.6-pro',baseUrl:'https://token-plan-cn.xiaomimimo.com/v1',api:'openai-completions'};
const options={apiKey:'synthetic-fake-key',env:{},maxTokens:128,maxRetries:0};
test('PS host guard permits only fixed probe and closed approved context; rejects data, routing, retries and unknown stages',()=>{
 const c={systemPrompt:'',tools:[],messages:[{role:'user',content:'Reply with OK.'}]},p={helpers:[]};
 assert.match(guard.validate('probe',p,model,c,options),/^[a-f0-9]{64}$/);
 for(const bad of ['Read this case','Reply with OK. /Users/private','synthetic-fake-key'])assert.throws(()=>guard.validate('probe',p,model,{...c,messages:[{role:'user',content:bad}]},options));
 assert.throws(()=>guard.validate('probe',p,{...model,baseUrl:'https://example.invalid'},c,options));assert.throws(()=>guard.validate('probe',p,model,c,{...options,maxRetries:1}));assert.throws(()=>guard.validate('idle',p,model,c,options));
 const context={source:'synthetic'},plan={case_system:'system',case:{task:'task',answer:'answer',owner:{revision_id:'r'},payload:JSON.stringify(context),tool_results:[null,{evidence:'synthetic'}]}};
 const payload={authorized_context:context,current_attempt_history:[],visible_message:'',authorized_tool_result:{evidence:'synthetic'}};
 const cc={systemPrompt:'system',tools:[],messages:[{role:'user',content:JSON.stringify(payload)}]};assert.match(guard.validate('case-complete',plan,model,cc,{...options,maxTokens:2048}),/^[a-f0-9]{64}$/);
 assert.throws(()=>guard.validate('case-complete',plan,model,{...cc,messages:[{role:'user',content:JSON.stringify({...payload,authorized_tool_result:null})}]},{...options,maxTokens:2048}));
});
test('PS real receipt binds exact command, plan and finite authorized bounds',()=>{
 const p={real_argv:['node','runner','execute']},r={approved:true,existing_user_authorization:true,plan_sha256:'a'.repeat(64),argv:p.real_argv,bounds:BOUNDS,synthetic_only:true,credential_channel:'stdin'};
 verifyReceipt(r,p,'a'.repeat(64));for(const patch of [{approved:false},{credential_channel:'argv'},{bounds:{...BOUNDS,requests:9}},{argv:['other']},{synthetic_only:false}])assert.throws(()=>verifyReceipt({...r,...patch},p,'a'.repeat(64)));
 assert.equal(BOUNDS.reserved_total_tokens,2*16384+2048+128);assert.equal(BOUNDS.credits_upper_bound,2*16384*300+(2048+128)*600);
});
test('PS host guard wraps actual installed Pi request builder; idle and repeat are denied without network',async()=>{
 const sdk=await import('@earendil-works/pi-coding-agent'),net=await import('node:net');const original={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,stream:sdk.ModelRuntime.prototype.streamSimple};
 try{
  await guard.install(process.cwd(),{helpers:[]},true);
  const {probeLocalXiaomi}=await import('../../adapters/agent-pi/xiaomi-local.ts');
  await assert.rejects(probeLocalXiaomi('synthetic-fake-key',new AbortController().signal));assert.equal(globalThis.psRealControl.read().requests,0);
  assert.throws(()=>globalThis.psRealControl.arm('case-stop'));assert.throws(()=>globalThis.psRealControl.arm('case-complete'));assert.throws(()=>globalThis.psRealControl.arm('organize_question'));assert.throws(()=>globalThis.psRealControl.arm('explain_evidence')); 
  globalThis.psRealControl.arm('probe');await probeLocalXiaomi('synthetic-fake-key',new AbortController().signal);assert.equal(globalThis.psRealControl.read().requests,1);assert.equal(globalThis.psRealControl.read().fetches,1);
  await assert.rejects(probeLocalXiaomi('synthetic-fake-key',new AbortController().signal));assert.throws(()=>globalThis.psRealControl.arm('probe'));assert.equal(globalThis.psRealControl.read().fetches,1);
 }finally{globalThis.fetch=original.fetch;net.Socket.prototype.connect=original.connect;sdk.ModelRuntime.prototype.streamSimple=original.stream;delete globalThis.psRealControl;}
});

test('PS Electron stage admission uses the supplied second callback argument, never the Electron module',async()=>{
 const stages=[],module={app:{},BrowserWindow:{}};
 globalThis.psRealControl={arm(stage){assert.equal(typeof stage,'string');stages.push(stage);}};
 try{const app={async evaluate(callback,argument){return callback(module,argument);}};await armNativeStage(app,'probe');await armNativeStage(app,'idle');assert.deepEqual(stages,['probe','idle']);}
 finally{delete globalThis.psRealControl;}
});

test('PS real response diagnostics retain types and known keys without response text, unknown property names or credentials',()=>{
 assert.equal(typeof guard.responseShape,'function');
 const secret='synthetic-diagnostic-secret';
 const value={draft_kind:'question_fields',draft_content:{question_text:'Synthetic private text',hypothesis_display_title:'Title',business_context:'Context',alternative_explanations:'wrong string'},'unknown-private-property':'hidden'};
 const message={stopReason:'stop',content:[{type:'text',text:JSON.stringify(value)}],errorMessage:secret};
 const shape=guard.responseShape(message,secret),encoded=JSON.stringify(shape);
 assert.equal(shape.json.fields.draft_content.fields.alternative_explanations.type,'string');
 assert.equal(shape.json.unknown_fields,true);
 for(const forbidden of ['Synthetic private text','unknown-private-property','hidden',secret])assert.equal(encoded.includes(forbidden),false);
 assert.deepEqual(guard.responseShape({content:[{type:'text',text:secret}]},secret),{blocked:true});
 assert.equal(guard.responseShape({stopReason:'stop',content:[{type:'text',text:'{malformed'}]},secret).json.type,'invalid');
});


test('PS helper terminal projection is retained before an unsuccessful Attempt assertion',async()=>{
 const projection={attempts:[{status:'Failed',terminal_reason:'validation_failed'}],assistance_drafts:[],closures:[]},saved=[];
 await assert.rejects(recordHelperTerminal(projection,{action:'organize_question',baseline:{closures:[]}},async(name,value)=>saved.push({name,value})),/Succeeded/);
 assert.deepEqual(saved,[{name:'organize_question-terminal.json',value:projection}]);
 assert.equal(BOUNDS.requests,2);assert.equal(BOUNDS.case_requests,0);assert.equal(BOUNDS.helper_requests,1);assert.equal(BOUNDS.retries,0);
});

test('PS invalid response classifications disclose no model text and never repair or parse a wrapper',()=>{
 for(const [text,expected]of [['```json\n{}\n```','fenced_json'],['Here is the answer: {}','non_json_prefix'],['{broken','json_parse_error'],['','empty']]){
  const out=guard.responseShape({stopReason:'stop',content:[{type:'text',text}]},'synthetic-secret');
  assert.equal(out.json.type,'invalid');assert.equal(out.json.category,expected);assert.equal(JSON.stringify(out).includes(text)&&text.length>0,false);
 }
});

test('PS real wire guard admits native JSON mode only for candidate and preserves exact mode before fetch',()=>{
 const body={model:'mimo-v2.6-pro',max_completion_tokens:2048,thinking:{type:'disabled'},response_format:{type:'json_object'}};
 guard.validatePayload('draft_candidates',body,{maxTokens:2048});
 for(const response_format of [undefined,{type:'text'},{type:'json_object',extra:true}])assert.throws(()=>guard.validatePayload('draft_candidates',{...body,response_format},{maxTokens:2048}));
 assert.throws(()=>guard.validatePayload('probe',body,{maxTokens:2048}));
 guard.validatePayload('probe',{...body,response_format:undefined},{maxTokens:2048});
});
