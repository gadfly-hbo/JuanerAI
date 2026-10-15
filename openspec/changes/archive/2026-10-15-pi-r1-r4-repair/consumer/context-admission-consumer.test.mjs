// Prepared consumer: run only after fixed new package identity/installation checks.
// No SDK guard implementation or shim. Synthetic budgets are not product policy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR;
assert.ok(root&&evidence,'Use verified isolated installed consumer and fresh persistent evidence directory');
const entry=createRequire(resolve(root,'package.json')).resolve('pi-agent-runtime');
const sdk=await import(pathToFileURL(entry).href);
assert.equal(typeof sdk.admitModelRequest,'function','PENDING_FIXED_PACKAGE: intermediate guard absent from old 0.4.3; no replacement allowed');
assert.equal(typeof sdk.ContextAdmissionFailure,'function');
await mkdir(evidence,{recursive:true});
await writeFile(join(evidence,'admission-resolution.json'),JSON.stringify({entry,node:process.version,scope:'offline actual installed guard consumer; not Application wiring or product acceptance'},null,2));
globalThis.fetch=async()=>{throw Error('OFFLINE_NETWORK_FORBIDDEN');};
const policy={policyVersion:'synthetic-consumer-001',protocolOverheadTokens:512,safetyMarginTokens:8192};
const model={provider:'openai',id:'synthetic-primary',protocol:'openai-completions',endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:4096};
const request=(messages,extra={})=>({model:{...model},messages,maxOutputTokens:4096,signal:new AbortController().signal,...extra});
const closedSchema={type:'object',properties:{value:{type:'string'}},required:['value'],additionalProperties:false};

test('C06-API: final trusted schema rejection precedes physical reserve, issue and credential access (V06)',async()=>{
 const original=request([{role:'user',text:'synthetic'}]);sdk.admitModelRequest(original,policy);
 const final=request([{role:'system',text:'synthetic final phase',tools:[{name:'inspect_selected',description:'界'.repeat(900000),parameters:closedSchema}]},...original.messages]);
 let reserves=0,issues=0,credentials=0,wire=0;
 async function send(){sdk.admitModelRequest(final,policy);reserves++;issues++;credentials++;wire++;}
 await assert.rejects(send,error=>error instanceof sdk.ContextAdmissionFailure&&error.reason==='INVALID_REQUEST');
 assert.deepEqual({reserves,issues,credentials,wire},{reserves:0,issues:0,credentials:0,wire:0});
 // Boundary probe only: real product ledger assertions remain J02 pending.
});

test('C06-API: approved final schema reaches real Pi HTTP/SSE codec and known usage (V06/V08)',async()=>{
 const final=request([{role:'system',text:'合成最终声明',tools:[{name:'inspect_selected',description:'合成获准资料目录',parameters:closedSchema}]},{role:'user',text:'合成资料'}]);
 const admission=sdk.admitModelRequest(final,policy);assert.equal(admission.contextWindow,200000);assert.ok(Object.isFrozen(final));assert.ok(Object.isFrozen(final.messages));
 let calls=0;const send=sdk.createPiTransport({model:final.model,apiKey:'synthetic-not-real',fetch:async(_url,init)=>{
  calls++;const body=JSON.parse(init.body);assert.equal(body.model,model.id);assert.equal(body.tools[0].function.description,'合成获准资料目录');assert.deepEqual(body.tools[0].function.parameters,closedSchema);
  const chunk={id:'synthetic',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta:{role:'assistant',content:'ok'},finish_reason:'stop'}],usage:{prompt_tokens:5,completion_tokens:3,total_tokens:8}};
  return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 }});
 const reply=await send(final);assert.equal(calls,1);assert.equal(reply.stop,'complete');assert.equal(reply.usage.inputTokens,5);assert.equal(reply.usage.outputTokens,3);
 await writeFile(join(evidence,'admitted-codec.json'),JSON.stringify({admission,reply},null,2));
});

test('C06-API: smaller candidate rechecks complete retained tool tail and output reservation (V06/V09)',()=>{
 const messages=[{role:'user',text:'synthetic'},{role:'assistant',text:'',calls:[{id:'synthetic',name:'inspect_selected',arguments:{}}]},{role:'tool',text:'界\\"\\n'.repeat(50000),toolId:'synthetic',toolName:'inspect_selected'}];
 const large=request(messages,{model:{...model,id:'synthetic-large',contextWindow:1048576}});const admitted=sdk.admitModelRequest(large,policy);assert.equal(admitted.reservedOutputTokens,4096);
 assert.throws(()=>sdk.admitModelRequest(request(messages),policy),sdk.ContextAdmissionFailure);
});

test('C06-API: admitted nested projection is immutable and class instances are refused (V06/V14)',()=>{
 const final=request([{role:'system',text:'synthetic',tools:[{name:'inspect_selected',description:'synthetic',parameters:structuredClone(closedSchema)}]}]);sdk.admitModelRequest(final,policy);
 assert.throws(()=>{final.messages[0].tools[0].description='changed';},TypeError);
 class NonDataRequest{constructor(){Object.assign(this,request([{role:'user',text:'synthetic'}]));}}
 assert.throws(()=>sdk.admitModelRequest(new NonDataRequest(),policy),error=>error.reason==='INVALID_REQUEST');
});

test('C06-API: cancellation is not a window failure or permission to dispatch (V13)',()=>{
 const c=new AbortController();c.abort();assert.throws(()=>sdk.admitModelRequest(request([{role:'user',text:'synthetic'}],{signal:c.signal}),policy),error=>error.reason==='CANCELLED');
});

test('C06-API: image capability without verified image allowance refuses admission (V06)',()=>{
 const final=request([{role:'user',text:'synthetic',images:[{data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6VnQAAAAASUVORK5CYII=',mimeType:'image/png'}]}],{model:{...model,input:['text','image']}});
 assert.throws(()=>sdk.admitModelRequest(final,policy),error=>error.reason==='CAPABILITY_UNAVAILABLE');
});
