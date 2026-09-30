// Host regression boundary only. Never included in the production package.
const assert=require('node:assert/strict');
let observed={fetches:0,sockets:0,model:null,max_tokens:null,body_bytes:0};
exports.install=()=>{
 require('node:net').Socket.prototype.connect=function(){observed.sockets++;throw Error('NETWORK_FORBIDDEN');};
 globalThis.fetch=async(url,options)=>{
  observed.fetches++;assert.equal(observed.fetches,1,'one explicit request only');
  assert.equal(String(url),'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');
  const body=JSON.parse(options.body);assert.equal(body.model,'mimo-v2.6-pro');assert.equal(body.max_tokens??body.max_completion_tokens,2048);
  assert.equal(String(options.body).includes('offline-preview-placeholder'),false);
  assert.ok(Buffer.byteLength(options.body)<=12000);
  observed={...observed,model:body.model,max_tokens:body.max_tokens??body.max_completion_tokens,body_bytes:Buffer.byteLength(options.body)};
  const chunk={id:'offline',object:'chat.completion.chunk',created:0,model:body.model,choices:[{index:0,delta:{role:'assistant',content:'{"kind":"question","text":"Synthetic owner?"}'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}};
  return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 };
};
exports.read=()=>structuredClone(observed);
