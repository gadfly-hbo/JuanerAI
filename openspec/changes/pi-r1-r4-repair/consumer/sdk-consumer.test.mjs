// Offline, neutral consumer of the installed package. Never imports SDK source.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {mkdir,mkdtemp,writeFile,appendFile,open,symlink,link} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const root=process.env.SDK_CONSUMER_ROOT, evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR;
assert.ok(root&&evidence,'Set SDK_CONSUMER_ROOT (installed consumer) and SDK_CONSUMER_EVIDENCE_DIR (new persistent run directory)');
await mkdir(evidence,{recursive:true});
const entry=createRequire(resolve(root,'package.json')).resolve('pi-agent-runtime');
const sdk=await import(pathToFileURL(entry).href);
await writeFile(join(evidence,'resolution.json'),JSON.stringify({entry,node:process.version},null,2));
globalThis.fetch=async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');};
const signal=()=>new AbortController().signal;
const model={provider:'openai',id:'synthetic-primary',protocol:'openai-completions',endpoint:'https://offline.invalid/v1',contextWindow:200000,maxOutputTokens:4096};
const limits={cumulative:'unlimited',maxOutputTokens:4096,modelTimeoutMs:10000,toolTimeoutMs:10000,controlTimeoutMs:10000};
const reply=(stop='complete',text='synthetic complete')=>({content:[{kind:'text',text}],stop,usage:{inputTokens:7,outputTokens:3}});
async function session(name,transport,extra={}){
 const directory=await mkdtemp(join(evidence,name+'-')),events=[];
 const rt=sdk.createSessionRuntime({model,transport,budgets:sdk.createMemoryBudgetStore(),authorize:async()=>true,
  audit:{append:async e=>{events.push(e);await appendFile(join(directory,'audit.jsonl'),JSON.stringify(e)+'\n');}},
  storage:{directory:join(directory,'sessions'),cwd:directory,policyVersion:'synthetic-v1',authorize:async()=>true,acquireWriter:async()=>{const lock=await open(join(directory,'writer.lock'),'wx');return {release:async()=>{await lock.close();const {unlink}=await import('node:fs/promises');await unlink(join(directory,'writer.lock'));}};}},
  bindOperation:async value=>{await appendFile(join(directory,'bindings.jsonl'),JSON.stringify(value)+'\n');},reconcile:async()=> 'ready',
  harness:{retry:{enabled:false,maxRetries:0,baseDelayMs:0},compaction:{enabled:true,reserveTokens:16384,keepRecentTokens:8192}},...extra});
 const info=await rt.create();
 const run=async(tools=[])=>{const taskId=randomUUID();const result=await rt.run({sessionId:info.id,taskId,prompt:'offline synthetic consumer',purpose:extra.purposes?.[0].id,tools,limits,modelRecovery:{extraAttempts:1}});await rt.waitForIdle(taskId);await writeFile(join(directory,'result.json'),JSON.stringify({result,events},null,2));return result;};
 return {rt,run};
}

test('C01 native read: 2000 line pagination and path isolation (V05/V17)',async()=>{
 const dir=await mkdtemp(join(evidence,'read-'));
 await writeFile(join(dir,'rows.txt'),Array.from({length:2100},(_,i)=>`row-${i+1}`).join('\n'));
 const outside=join(evidence,randomUUID()+'.txt');await writeFile(outside,'synthetic outside');await symlink(outside,join(dir,'escape'));await link(outside,join(dir,'hardlink'));
 const env=await sdk.createLocalExecutionEnvironment({root:dir,policyVersion:'synthetic-v1',exclusiveWorkspace:true,maxFileBytes:2*1024*1024,maxOutputBytes:65536,timeoutMs:1000});
 const tools=sdk.createExecutionTools(env,['read']);assert.deepEqual(tools.map(t=>t.name),['read']);
 const read=tools[0];const a=await read.execute({path:'rows.txt'},signal()),b=await read.execute({path:'rows.txt',offset:2001,limit:100},signal());
 await writeFile(join(dir,'read-results.json'),JSON.stringify({a,b},null,2));
 assert.match(JSON.stringify(a),/row-2000/);assert.doesNotMatch(JSON.stringify(a),/row-2001/);assert.match(JSON.stringify(b),/row-2100/);
 for(const path of ['../'+outside.split('/').at(-1),outside,'escape','hardlink'])await assert.rejects(()=>read.execute({path},signal()));
});

test('C02 missing native read is not permission_denied (F10/V17)',async()=>{
 const dir=await mkdtemp(join(evidence,'missing-'));const env=await sdk.createLocalExecutionEnvironment({root:dir,policyVersion:'synthetic-v1',exclusiveWorkspace:true,maxFileBytes:1024,maxOutputBytes:1024,timeoutMs:1000});
 let error;try{await sdk.createExecutionTools(env,['read'])[0].execute({path:'missing.txt'},signal());}catch(e){error=e;}assert.ok(error,'missing file unexpectedly succeeded');await writeFile(join(dir,'failure.json'),JSON.stringify({name:error.name,message:error.message,code:error.code,reason:error.reason},null,2));assert.notEqual(error.code,'permission_denied','missing file must remain distinguishable from denied access');
});

test('C03 native Agent length can recover once with known usage (F02/V08)',async()=>{
 let calls=0;const s=await session('agent-length',async()=>++calls===1?reply('length','incomplete'):reply());const result=await s.run();
 assert.equal(result.status,'succeeded');assert.equal(calls,2);assert.equal(result.usageKnown,true);assert.equal(result.usage.inputTokens,14);assert.equal(result.usage.outputTokens,6);
});

test('C04 Worker rejects truncated JSON and never validates it (V08)',async()=>{
 let validations=0,calls=0;const runtime=sdk.createRuntime({model,transport:async()=>{calls++;return reply('length','{"value":');},budgets:sdk.createMemoryBudgetStore(),authorize:async()=>true,audit:{append:async()=>{}}});
 const result=await runtime.runWorker({taskId:randomUUID(),prompt:'synthetic',limits,modelRecovery:{extraAttempts:0},validate:()=>{validations++;return 1;}});
 await writeFile(join(evidence,'worker-result.json'),JSON.stringify(result,null,2));assert.equal(result.status,'failed');assert.equal(result.reason,'INVALID_OUTPUT');assert.equal(validations,0);assert.equal(calls,1);
});

test('C05 native purpose fallback retains task and executes tool only once (V09/V10)',async()=>{
 let primary=0,backup=0,effects=0;const tool={name:'synthetic_receipt',description:'Synthetic in-memory effect',parameters:{type:'object',properties:{}},effect:'write',resourceUnits:0,replay:'never',execute:async()=>{effects++;return {receipt:'effect-1'};}};
 const transport=async()=>{if(++primary===1)return {content:[{kind:'tool',id:'once',name:tool.name,arguments:{}}],stop:'tools',usage:{inputTokens:7,outputTokens:3}};throw new sdk.ProviderFailure('quota');};
 const fallback=async()=>{backup++;return reply();};
 const s=await session('fallback',transport,{purposes:[{id:'analysis',mode:'agent',model,transport,tools:[tool],fallbacks:[{model:{...model,id:'synthetic-backup',contextWindow:1048576},transport:fallback}]}]});const result=await s.run([tool]);
 assert.equal(result.status,'succeeded');assert.equal(primary,2);assert.equal(backup,1);assert.equal(effects,1);
});

test('C06 final Adapter projection must be admitted before wire dispatch (F01/V06)',async()=>{
 let oversizedWireCalls=0;
 const s=await session('projection',async request=>{
  // Reproduces the real host seam: Adapter replaces generic tool schemas after SDK projection.
  const final={...request,messages:[...request.messages,{role:'system',text:'界'.repeat(900000)}]};
  // Stand-in for wire dispatch; no network. New SDK must offer an agreed final-projection admission seam.
  if(Buffer.byteLength(JSON.stringify(final.messages))>200000*4)oversizedWireCalls++;
  return reply();
 });await s.run();assert.equal(oversizedWireCalls,0,'current API admits before host projection; SDK hook/guard agreement required');
});

test('C07 real pi-ai SSE codec preserves length and usage (V08 transport level)',async()=>{
 let requests=0;const transport=sdk.createPiTransport({model,apiKey:'synthetic-never-a-real-key',fetch:async(_url,init)=>{
  requests++;const body=JSON.parse(init.body);assert.equal(body.model,model.id);
  const chunks=[{id:'s1',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta:{role:'assistant',content:'partial'},finish_reason:null}]},{id:'s1',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta:{},finish_reason:'length'}],usage:{prompt_tokens:19,completion_tokens:4,total_tokens:23}}];
  return new Response(chunks.map(c=>'data: '+JSON.stringify(c)+'\n\n').join('')+'data: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 }});const result=await transport({model,messages:[{role:'user',text:'synthetic'}],maxOutputTokens:4096,signal:signal()});
 await writeFile(join(evidence,'codec-length.json'),JSON.stringify(result,null,2));assert.equal(requests,1);assert.equal(result.stop,'length');assert.equal(result.usage.inputTokens,19);assert.equal(result.usage.outputTokens,4);
});
