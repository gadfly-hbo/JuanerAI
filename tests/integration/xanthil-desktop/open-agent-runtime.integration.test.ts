import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as pi from '../../../adapters/agent-pi/xiaomi-local.ts';
import {createLocalAnalysisRequestLedger} from '../../../adapters/storage-local/member-operation.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

async function fixture(reply:(context:any,selected:any,options:any)=>any,primaryMissing=false,primaryEndpoint:'https://api.minimax.cn/anthropic'|'https://api.minimaxi.com/anthropic'|undefined=undefined,complex=false,backupMissing=false){
 const expectedEndpoint=primaryEndpoint??'https://api.minimaxi.com/anthropic';const factory=Reflect.get(pi,'createPiOpenAnalysisRuntime');assert.equal(typeof factory,'function','OA-RT01: real Pi multi-round runtime must exist');
 const installed=await pi.loadLocalPi();const specifier='@earendil-works/pi-coding-agent';const sdk=await import(specifier);const ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 const awaitDenied:Promise<unknown>[]=[];const root=mkdtempSync(join(browserEvidenceRoot,'open-runtime-')),ledger=createLocalAnalysisRequestLedger({projectRoot:root});let calls=0,executions=0,agents=0,allowed=true;
 const credentials=pi.createApprovedProviderCredentials({homeDirectory:'/synthetic',environment:{},readText:async path=>{assert.equal(path,'/synthetic/.pi/agent/auth.json','normal runtime must not read retired zcode');return JSON.stringify(primaryMissing?{}:{'minimax-cn':{key:'synthetic-primary'}});},backupStore:{read:async()=>backupMissing?{status:'absent'}:{status:'found',key:'synthetic-backup'}}});await credentials.refresh(true);
 const runtime=factory({ledger,credentials,primaryEndpoint,transport:async(url:any)=>{const u=new URL(String(url));assert.equal(u.search,'?beta=true');return new Response('{}',{status:401,headers:{'content-type':'application/json'}});},loadPi:async()=>({...installed,core:{...installed.core,Agent:class extends installed.core.Agent{constructor(options:any){agents++;super(options);}}},openAI:{streamSimple:stub},anthropic:{streamSimple:stub}})});
 function stub(selected:any,context:any,options:any){
  calls++;if(selected.provider==='minimax-cn'){assert.equal(options.interleavedThinking,false);assert.match(options.headers['User-Agent'],/^pi \(/);}
  assert.equal(options.maxRetries,0);assert.equal(options.maxRetryDelayMs,0);assert.equal(selected.api,selected.provider==='minimax-cn'?'anthropic-messages':'openai-completions');assert.equal(selected.baseUrl,selected.provider==='minimax-cn'?expectedEndpoint:'https://token-plan-cn.xiaomimimo.com/v1');
  assert.equal(typeof options.fetch,'function','OA-RT03: SDK transport must reject redirects and unapproved destinations');
  awaitDenied.push(options.fetch('https://unapproved.invalid/v1/chat/completions',{}).then(()=>assert.fail('unapproved network'),(e:any)=>assert.equal(e.code,'OUTBOUND_FORBIDDEN')));
  if(expectedEndpoint==='https://api.minimaxi.com/anthropic'&&selected.provider==='minimax-cn')awaitDenied.push(options.fetch(expectedEndpoint+'/v1/messages?beta=true',{}).then((r:any)=>assert.equal(r.status,401)));
  const stream=ai.createAssistantMessageEventStream();Promise.resolve(reply(context,selected,options)).then(body=>{const message={role:'assistant',api:selected.api,provider:selected.provider,model:selected.id,timestamp:Date.now(),usage:{input:12,output:3,cacheRead:0,cacheWrite:0,totalTokens:15,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}},...body};stream.push({type:message.stopReason==='error'?'error':'done',reason:message.stopReason,message,error:message});});return stream;
 }
 const input={identity:{task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:'a'.repeat(64),config_sha256:'b'.repeat(64)},prompt:'Sum the authorized synthetic amounts and explain the result.',system:'Use the supplied tool; do not guess.',signal:new AbortController().signal,authorize:()=>allowed,tools:[{name:'sum_selected',description:'Sum this task selected synthetic values',parameters:complex?{type:'object',properties:{entries:{type:'array',items:{type:'object',properties:{value:{type:'number'}},required:['value'],additionalProperties:false}}},required:['entries'],additionalProperties:false}:{type:'object',properties:{},additionalProperties:false},execute:async(args:any)=>{executions++;if(complex)assert.deepEqual(args,{entries:[{value:2},{value:4}]});return {sum:6,independently_verified:true};}}]};
 return {runtime:{collect:(task_id:string)=>runtime.collect!(task_id),run:async(value:any)=>{try{return await runtime.run(value);}finally{await Promise.all(awaitDenied);}}},input,ledger,calls:()=>calls,agents:()=>agents,executions:()=>executions,revoke:()=>{allowed=false;}};
}
test('R1-B1/OA-RT05/06: report edit uses a distinct durable operation, one shared extra request and completed checkpoint replay is passive',async()=>{
 let edits=0;
 const f=await fixture((context,model)=>{if(context.systemPrompt==='report editing'){assert.equal(model.provider,'xiaomi-token-plan-cn','SEP11 final interpretation must use approved MiMo');edits++;if(edits===1)return {stopReason:'error',errorMessage:'fetch failed',content:[]};return {stopReason:'stop',content:[{type:'text',text:'Edited report.'}]};}assert.equal(model.provider,'minimax-cn');return {stopReason:'stop',content:[{type:'text',text:'Analysis draft.'}]};});
 await f.runtime.run({...f.input,tools:[]});let checkpoint:any;
 const edit={...f.input,purpose:'report_edit' as const,prompt:'Compare the actual evidence and draft.',system:'report editing',tools:[],saveContinuation:async(x:any)=>{checkpoint=x;}};
 assert.equal((await f.runtime.run(edit)).text,'Edited report.');const rows=f.ledger.read(f.input.identity.task_id);assert.equal(rows.length,3);assert.equal(rows[0].operation_id===rows[1].operation_id,false);assert.equal(rows[1].operation_id,rows[2].operation_id);assert.deepEqual(rows.slice(1).map(r=>r.sequence),[1,2]);assert.deepEqual(rows.map(r=>r.provider),['minimax-cn','xiaomi-token-plan-cn','xiaomi-token-plan-cn']);assert.equal(f.executions(),0);
 assert.equal((await f.runtime.run({...edit,continuation:checkpoint})).text,'Edited report.');assert.equal(f.calls(),3);assert.equal(edits,2);assert.equal(f.ledger.read(f.input.identity.task_id).length,3);
});
test('OA-RT01/03: actual Pi Agent consumes tool result and makes the next model turn',async()=>{
 const f=await fixture(context=>{const result=context.messages.find((m:any)=>m.role==='toolResult');if(!result)return {stopReason:'toolUse',content:[{type:'toolCall',id:'sum-1',name:'sum_selected',arguments:{}}]};assert.match(JSON.stringify(result),/independently_verified/);return {stopReason:'stop',content:[{type:'text',text:'Verified sum: 6.'}]};});
 const result=await f.runtime.run(f.input);assert.equal(result.text,'Verified sum: 6.');assert.equal(f.calls(),2);assert.equal(f.executions(),1);assert.equal(result.tools.length,1);assert.equal(f.ledger.read(f.input.identity.task_id).length,2);
});
test('VC-09/OA-RT04: actual Pi yields after Application requests business input, without a second Provider call or ledger cancellation',async()=>{
 let waiting=false,checkpoint:any;
 const f=await fixture(context=>!context.messages.some((m:any)=>m.role==='toolResult')?{stopReason:'toolUse',content:[{type:'toolCall',id:'clarify-1',name:'sum_selected',arguments:{}}]}:{stopReason:'stop',content:[{type:'text',text:'unnecessary follow-up'}]});
 const result=await f.runtime.run({...f.input,shouldYield:()=>waiting,saveContinuation:async(x:any)=>{checkpoint=x;},tools:[{...f.input.tools[0],execute:async()=>{waiting=true;return {waiting_for_user:true,question:'Which business allocation rule applies?'};}}]});
 assert.equal(f.calls(),1);assert.equal(result.tools.length,1);assert.ok(checkpoint.messages.some((m:any)=>m.speaker==='tool'&&m.result.waiting_for_user));assert.equal(f.ledger.read(f.input.identity.task_id)[0].status,'succeeded');assert.equal(f.input.signal.aborted,false);
});
test('OA-RT05: temporary main failure gets exactly one backup request, no hidden SDK retry',async()=>{
 const f=await fixture((_context,model)=>model.provider==='minimax-cn'?{stopReason:'error',errorMessage:'fetch failed',content:[]}:{stopReason:'stop',content:[{type:'text',text:'Backup completed.'}]});const result=await f.runtime.run(f.input);assert.equal(result.text,'Backup completed.');assert.equal(f.calls(),2);assert.deepEqual(f.ledger.read(f.input.identity.task_id).map(x=>x.sequence),[1,2]);
});
test('OA-RT03: revoked authority prevents both outbound call and local tool execution',async()=>{
 const f=await fixture(()=>({stopReason:'stop',content:[{type:'text',text:'must not run'}]}));f.revoke();await assert.rejects(()=>f.runtime.run(f.input),{code:'AUTHORITY_REQUIRED'});assert.equal(f.calls(),0);assert.equal(f.executions(),0);assert.deepEqual(f.ledger.read(f.input.identity.task_id),[]);
});
test('OA-RT05: exhausted failure retains two actual calls and sanitized error',async()=>{
 const f=await fixture(()=>({stopReason:'error',errorMessage:'fetch failed synthetic-primary',content:[]}));await assert.rejects(()=>f.runtime.run(f.input),(e:any)=>e.code==='NETWORK_UNAVAILABLE'&&!JSON.stringify(e).includes('synthetic-primary'));assert.equal(f.calls(),2);assert.equal(f.ledger.read(f.input.identity.task_id).length,2);
});

for(const purpose of [undefined,'report_edit'] as const)test(`SEP11/OA-RT04/06: stopping ${purpose??'analysis'} retains UNKNOWN then accounts a late result without publication`,async()=>{
 let finish:(x:any)=>void=()=>undefined,started:()=>void=()=>undefined;const began=new Promise<void>(resolve=>{started=resolve;});
 const f=await fixture(()=>{started();return new Promise(resolve=>{finish=resolve;});});const controller=new AbortController();
 const running=f.runtime.run({...f.input,purpose,...(purpose?{tools:[]}:{}),signal:controller.signal});const rejected=assert.rejects(running,{code:'CANCELLED'});await began;controller.abort();await rejected;
 const pending=f.ledger.read(f.input.identity.task_id);assert.equal(pending.length,1);assert.equal(pending[0].status,'unknown');assert.equal(pending[0].calls,1);
 finish({stopReason:'stop',content:[{type:'text',text:'late result'}]});await new Promise(resolve=>setImmediate(resolve));
 const late=f.ledger.read(f.input.identity.task_id);assert.equal(late[0].status,'cancelled');assert.equal(late[0].publishable,false);assert.deepEqual(late[0].usage.output_tokens,{kind:'known',value:'3'});assert.equal(f.calls(),1);
});

test('SEP11: unavailable MiMo cannot use MiniMax for final interpretation; no request is issued',async()=>{
 const f=await fixture(()=>({stopReason:'stop',content:[{type:'text',text:'must not run'}]}),false,undefined,false,true);
 await assert.rejects(()=>f.runtime.run({...f.input,purpose:'report_edit',tools:[]}),{code:'CREDENTIAL_UNAVAILABLE'});
 assert.equal(f.calls(),0);assert.deepEqual(f.ledger.read(f.input.identity.task_id),[]);
});
test('SEP11: report purpose cannot execute tools or a third model request',async()=>{
 const f=await fixture((_context,model)=>{assert.equal(model.provider,'xiaomi-token-plan-cn');return {stopReason:'error',errorMessage:'fetch failed',content:[]};});
 await assert.rejects(()=>f.runtime.run({...f.input,purpose:'report_edit'}),{code:'TOOL_POLICY_VIOLATION'});
 assert.equal(f.calls(),0);assert.equal(f.executions(),0);
 await assert.rejects(()=>f.runtime.run({...f.input,purpose:'report_edit',tools:[]}),{code:'NETWORK_UNAVAILABLE'});
 assert.equal(f.calls(),2);assert.deepEqual(f.ledger.read(f.input.identity.task_id).map(r=>[r.provider,r.sequence]),[['xiaomi-token-plan-cn',1],['xiaomi-token-plan-cn',2]]);
});

test('OA-RT02/05: configured backup with genuinely missing primary is the original request, not a fabricated retry',async()=>{
 const f=await fixture((_context,model)=>{assert.equal(model.provider,'xiaomi-token-plan-cn');return {stopReason:'stop',content:[{type:'text',text:'Backup original request.'}]};},true);
 const result=await f.runtime.run(f.input);assert.equal(result.text,'Backup original request.');assert.equal(f.calls(),1);const rows=f.ledger.read(f.input.identity.task_id);assert.equal(rows[0].provider,'xiaomi-token-plan-cn');assert.equal(rows[0].sequence,1);assert.equal(rows[0].calls,1);
});

test('OA-RT01/03: explicitly authorized fixed deep-research endpoint is bound at composition without changing default',async()=>{const f=await fixture((_context,model)=>{assert.equal(model.provider,'minimax-cn');assert.equal(model.baseUrl,'https://api.minimaxi.com/anthropic');return {stopReason:'stop',content:[{type:'text',text:'Fixed reference endpoint.'}]};},false,'https://api.minimaxi.com/anthropic');const result=await f.runtime.run(f.input);assert.equal(result.text,'Fixed reference endpoint.');assert.equal(f.calls(),1);});

// Uses a task-owned loopback fixture only; no Provider or credential access.
test('OA-RT01: installed SDK transport decodes compressed responses with its matching dispatcher',async()=>{
 const {createServer}=await import('node:http');const {gzipSync}=await import('node:zlib');
 const installed=await pi.loadLocalPi();const transport=Reflect.get(installed,'transport');assert.equal(typeof transport,'function','SDK transport must use its matching installed HTTP decoder');
 const expected='data: {"type":"message_stop"}\n\n',compressed=gzipSync(expected);
 const server=createServer((_request,response)=>{response.writeHead(200,{'content-type':'text/event-stream','content-encoding':'gzip'});response.end(compressed);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const address=server.address();assert.ok(address&&typeof address==='object');const response=await transport(`http://127.0.0.1:${address.port}/synthetic`,{signal:AbortSignal.timeout(5000),redirect:'error'});assert.equal(response.status,200);assert.equal(await response.text(),expected);}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('OA-RT04/06: durable Pi conversation continues after an observed tool without replaying that tool',async()=>{
 const f=await fixture(context=>{assert.equal(context.messages.filter((m:any)=>m.role==='toolResult').length,1);return {stopReason:'stop',content:[{type:'text',text:'Continued from verified 6.'}]};});let saved:any;
 const continuation={version:'1.0' as const,turn:1,messages:[{speaker:'user' as const,text:f.input.prompt},{speaker:'assistant' as const,text:'',calls:[{id:'sum-1',name:'sum_selected',arguments:{}}]},{speaker:'tool' as const,call_id:'sum-1',name:'sum_selected',result:{sum:6,independently_verified:true},failed:false}]};
 const result=await f.runtime.run({...f.input,continuation,saveContinuation:async(x:any)=>{saved=x;}});assert.equal(result.text,'Continued from verified 6.');assert.equal(f.executions(),0);assert.equal(f.calls(),1);assert.equal(saved.turn,2);assert.equal(saved.messages.at(-1).text,result.text);
});


test('OA-RT04: runtime collection waits for owned physical response and accounting without dispatch',async()=>{
 let finish!:(value:any)=>void,ready!:()=>void;const began=new Promise<void>(resolve=>ready=resolve);
 const f=await fixture(()=>{ready();return new Promise(resolve=>finish=resolve);});const control=new AbortController();
 const rejected=assert.rejects(f.runtime.run({...f.input,signal:control.signal}),{code:'CANCELLED'});await began;control.abort();await rejected;
 let collected=false;const collecting=f.runtime.collect(f.input.identity.task_id).then(()=>collected=true);await new Promise(resolve=>setImmediate(resolve));assert.equal(collected,false);
 finish({stopReason:'stop',content:[{type:'text',text:'not publishable'}]});await collecting;
 assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.status,'cancelled');assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.publishable,false);assert.equal(f.calls(),1);assert.equal(f.executions(),0);
});


test('OA-S06/RT03: one composed runtime cannot issue concurrent parent and child requests',async()=>{
 let ready!:()=>void;const finishes:((value:any)=>void)[]=[];const began=new Promise<void>(resolve=>ready=resolve);const f=await fixture(()=>{ready();return new Promise(resolve=>finishes.push(resolve));});
 const running=f.runtime.run(f.input);await began;const child={...f.input,identity:{...f.input.identity,task_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()}};
 // Release every owned fixture even on a causal failure.
 let forbidden:Promise<unknown>|undefined;try{forbidden=f.runtime.run(child);await assert.rejects(Promise.race([forbidden,new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(Error('CONCURRENT_REQUEST_ACCEPTED'),{code:'CONCURRENT_REQUEST_ACCEPTED'})),200))]),{code:'TASK_BUSY'});assert.equal(f.calls(),1);assert.deepEqual(f.ledger.read(child.identity.task_id),[]);}finally{for(const finish of finishes)finish({stopReason:'stop',content:[{type:'text',text:'parent complete'}]});await Promise.allSettled([running,...(forbidden?[forbidden]:[])]);}
});


test('OA-RT06: successful runtime result waits for its durable continuation receipts',async()=>{
 const f=await fixture(()=>({stopReason:'stop',content:[{type:'text',text:'saved after checkpoint'}]}));let committed=false;
 await f.runtime.run({...f.input,saveContinuation:async()=>{await new Promise(resolve=>setTimeout(resolve,30));committed=true;}});assert.equal(committed,true,'returning text alone is not a checkpoint save receipt');
});

test('OA-RT05: settled physical deadline uses exactly one shared extra request; late output cannot publish',async t=>{
 let began!:()=>void;const issued=new Promise<void>(r=>began=r);let first=true;
 const f=await fixture((_context,_model,options)=>{if(!first)return {stopReason:'stop',content:[{type:'text',text:'one extra completed'}]};first=false;began();return new Promise(resolve=>options.signal.addEventListener('abort',()=>resolve({stopReason:'stop',content:[{type:'text',text:'late original'}]}),{once:true}));});
 t.mock.timers.enable({apis:['setTimeout']});
 const run=f.runtime.run(f.input);await issued;t.mock.timers.tick(30000);const result=await run;
 assert.equal(result.text,'one extra completed');assert.equal(f.calls(),2);const rows=f.ledger.read(f.input.identity.task_id);assert.deepEqual(rows.map(r=>r.sequence),[1,2]);assert.equal(rows[0]!.reason,'CONNECTION_TIMEOUT');assert.equal(rows[0]!.status,'temporary_failure');assert.equal(rows[0]!.publishable,false);assert.equal(rows[1]!.status,'succeeded');
});

test('OA-RT04/05: deadline with physically unresolved response retains UNKNOWN and forbids extra request',async t=>{
 let began!:()=>void,finish!:(x:any)=>void;const issued=new Promise<void>(r=>began=r);
 const f=await fixture(()=>{began();return new Promise(resolve=>finish=resolve);});t.mock.timers.enable({apis:['setTimeout']});
 const run=f.runtime.run(f.input),rejected=assert.rejects(run,{code:'CONNECTION_TIMEOUT'});await issued;t.mock.timers.tick(30000);
 for(let i=0;i<10;i++)await Promise.resolve();t.mock.timers.tick(5000);await rejected;
 assert.equal(f.calls(),1);assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.status,'unknown');
 finish({stopReason:'stop',content:[{type:'text',text:'late'}]});await f.runtime.collect(f.input.identity.task_id);assert.equal(f.calls(),1);assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.publishable,false);
});

for(const backup of [false,true])test(`OA-RT01/06: single auxiliary pi-ai ${backup?'backup':'primary'} shares accounting without an Agent`,async()=>{
 const f=await fixture(()=>({stopReason:'stop',content:[{type:'text',text:'Auxiliary explanation.'}]}),backup);let saved:any;
 const result=await f.runtime.run({...f.input,tools:[],saveContinuation:async(x:any)=>saved=x});
 assert.equal(result.text,'Auxiliary explanation.');assert.equal(f.agents(),0);assert.equal(f.calls(),1);assert.equal(f.executions(),0);assert.deepEqual(result.tools,[]);assert.equal(saved.turn,1);assert.equal(saved.messages.at(-1).text,result.text);assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.status,'succeeded');
 const reread=await f.runtime.run({...f.input,tools:[],continuation:saved});assert.equal(reread.text,result.text);assert.equal(f.calls(),1);assert.equal(f.agents(),0);
});
test('OA-RT01/03: auxiliary cannot restore tool authority or execute invented tools',async()=>{
 const f=await fixture(()=>({stopReason:'toolUse',content:[{type:'toolCall',id:'x',name:'sum_selected',arguments:{}}]}));
 await assert.rejects(()=>f.runtime.run({...f.input,tools:[],continuation:{version:'1.0',turn:0,messages:[{speaker:'assistant',text:'',calls:[{id:'x',name:'sum_selected',arguments:{}}]}]}}),{code:'CONVERSATION_INVALID'});assert.equal(f.calls(),0);
 await assert.rejects(()=>f.runtime.run({...f.input,tools:[]}),{code:'ANALYSIS_INCOMPLETE'});assert.equal(f.agents(),0);assert.equal(f.executions(),0);assert.equal(f.calls(),1);
});
test('OA-RT04/06: auxiliary stop accounts late response without publication or another request',async()=>{
 let finish!:(x:any)=>void,ready!:()=>void;const began=new Promise<void>(r=>ready=r);const f=await fixture(()=>{ready();return new Promise(r=>finish=r);});const stop=new AbortController();
 const rejected=assert.rejects(f.runtime.run({...f.input,tools:[],signal:stop.signal}),{code:'CANCELLED'});await began;stop.abort();await rejected;assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.status,'unknown');
 finish({stopReason:'stop',content:[{type:'text',text:'late auxiliary'}]});await f.runtime.collect(f.input.identity.task_id);assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.publishable,false);assert.equal(f.calls(),1);assert.equal(f.agents(),0);
});
test('OA-RT05: auxiliary temporary failure shares exactly one backup request',async()=>{
 const f=await fixture((_c,m)=>m.provider==='minimax-cn'?{stopReason:'error',errorMessage:'fetch failed',content:[]}:{stopReason:'stop',content:[{type:'text',text:'Auxiliary recovered.'}]});
 assert.equal((await f.runtime.run({...f.input,tools:[]})).text,'Auxiliary recovered.');assert.equal(f.calls(),2);assert.equal(f.agents(),0);assert.deepEqual(f.ledger.read(f.input.identity.task_id).map(r=>r.sequence),[1,2]);
});


test('OA-RT06/FM-A02: malformed fractional tool arguments persist without becoming accepted business parameters; normal correction still executes',async()=>{const {taskHash}=await import('../../../packages/product-core/member-task.ts');let executed=0,saved:any;const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length)return {stopReason:'toolUse',content:[{type:'toolCall',id:'bad-version',name:'sum_selected',arguments:{version:1.2}}]};if(results.length===1){assert.equal(results[0].isError,true);return {stopReason:'toolUse',content:[{type:'toolCall',id:'correct-version',name:'sum_selected',arguments:{version:'1.1'}}]};}return {stopReason:'stop',content:[{type:'text',text:'Only corrected arguments executed.'}]};});const tool={...f.input.tools[0],parameters:{type:'object',properties:{version:{type:'string',enum:['1.1']}},required:['version'],additionalProperties:false},execute:async(args:any)=>{assert.equal(args.version,'1.1');executed++;return {sum:6};}};const result=await f.runtime.run({...f.input,tools:[tool],saveContinuation:async(x:any)=>{taskHash(x);saved=x;}});assert.equal(result.text,'Only corrected arguments executed.');assert.equal(executed,1);assert.equal(f.calls(),3);const first=saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length);assert.equal(JSON.parse(first.calls[0].arguments.__juanerai_untrusted_arguments_json).version,1.2);const receipt=saved.messages.find((m:any)=>m.speaker==='tool');assert.equal(receipt.failed,true);const g=await fixture(context=>{const original=context.messages.find((m:any)=>m.role==='assistant'&&m.content.some((c:any)=>c.type==='toolCall'));assert.equal(original.content.find((c:any)=>c.type==='toolCall').arguments.version,1.2);return {stopReason:'stop',content:[{type:'text',text:'Original malformed request remains refused.'}]};});const end=saved.messages.findIndex((m:any)=>m.speaker==='tool')+1;await g.runtime.run({...g.input,continuation:{version:'1.0',turn:1,messages:saved.messages.slice(0,end)}});assert.equal(g.executions(),0);});

test('R1-RT-CODEC01: nested transport arguments decode to original business tool and checkpoint, never provider wrapper',async()=>{let saved:any;const f=await fixture(context=>{if(!context.messages.some((m:any)=>m.role==='toolResult')){assert.deepEqual(Object.keys(context.tools[0].parameters.properties),['arguments_json']);return {stopReason:'toolUse',content:[{type:'toolCall',id:'nested',name:'sum_selected',arguments:{arguments_json:JSON.stringify({entries:[{value:2},{value:4}]})}}]};}return {stopReason:'stop',content:[{type:'text',text:'Observed 6'}]};},false,'https://api.minimax.cn/anthropic',true);const result=await f.runtime.run({...f.input,saveContinuation:async(x:any)=>saved=x});assert.equal(result.text,'Observed 6');assert.equal(f.executions(),1);assert.deepEqual(saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments,{entries:[{value:2},{value:4}]});assert.equal(JSON.stringify(saved).includes('arguments_json'),false);});

test('R1-RT-CODEC01: malformed JSON is a durable failed tool, no side effect; next corrected argument may execute',async()=>{let saved:any;const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length)return {stopReason:'toolUse',content:[{type:'toolCall',id:'malformed',name:'sum_selected',arguments:{arguments_json:'{"entries":['}}]};if(results.length===1){assert.equal(results[0].isError,true);const feedback=JSON.parse(results[0].content[0].text);assert.equal(feedback.code,'TOOL_ARGUMENT_INVALID');assert.equal(feedback.calculation_performed,false);assert.deepEqual(feedback.parameters,f.input.tools[0].parameters);return {stopReason:'toolUse',content:[{type:'toolCall',id:'corrected',name:'sum_selected',arguments:{arguments_json:'{"entries":[{"value":2},{"value":4}]}'}}]};}return {stopReason:'stop',content:[{type:'text',text:'Corrected 6'}]};},false,'https://api.minimax.cn/anthropic',true);const r=await f.runtime.run({...f.input,saveContinuation:async(x:any)=>saved=x});assert.equal(r.text,'Corrected 6');assert.equal(f.executions(),1);assert.ok(saved.messages.some((m:any)=>m.speaker==='tool'&&m.failed));assert.equal(saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments.invalid_arguments_json,'{"entries":[');});

test('R1-RT07: actual installed Agent default composition uses approved minimaxi without an endpoint override',async()=>{const f=await fixture((_c,model)=>{assert.equal(model.baseUrl,'https://api.minimaxi.com/anthropic');return {stopReason:'stop',content:[{type:'text',text:'Current default recipient.'}]};});assert.equal((await f.runtime.run(f.input)).text,'Current default recipient.');assert.equal(f.calls(),1);});


test('VC-08/09: nested business schema rejection returns current parameters without accepting or rewriting invalid arguments',async()=>{
 let checkpoint:any;
 const f=await fixture(context=>{
  const results=context.messages.filter((m:any)=>m.role==='toolResult');
  if(!results.length)return {stopReason:'toolUse',content:[{type:'toolCall',id:'bad-shape',name:'sum_selected',arguments:{arguments_json:JSON.stringify({entries:[{value:2},{value:4}],unsupported:true})}}]};
  if(results.length===1){assert.equal(results[0].isError,true);const feedback=JSON.parse(results[0].content[0].text);assert.equal(feedback.code,'TOOL_ARGUMENT_INVALID');assert.equal(feedback.calculation_performed,false);assert.deepEqual(feedback.parameters.properties.entries.items.required,['value']);assert.equal(feedback.parameters.additionalProperties,false);assert.equal(f.executions(),0);return {stopReason:'toolUse',content:[{type:'toolCall',id:'correct-shape',name:'sum_selected',arguments:{arguments_json:JSON.stringify({entries:[{value:2},{value:4}]})}}]};}
  return {stopReason:'stop',content:[{type:'text',text:'Only corrected parameters executed.'}]};
 },false,'https://api.minimaxi.com/anthropic',true);
 assert.equal((await f.runtime.run({...f.input,saveContinuation:async(x:any)=>{checkpoint=x;}})).text,'Only corrected parameters executed.');
 assert.equal(f.executions(),1);assert.equal(f.calls(),3);assert.equal(f.ledger.read(f.input.identity.task_id).length,3);
 assert.equal(checkpoint.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments.unsupported,true);
});


test('VC-10 native preparation: original nested schema and actual arguments reach tools once without a JSON carrier',async()=>{
 let saved:any,observed:any;const f=await fixture(context=>{observed=context.tools[0];if(!context.messages.some((m:any)=>m.role==='toolResult'))return {stopReason:'toolUse',content:[{type:'toolCall',id:'native-nested',name:'sum_selected',arguments:context.tools[0].parameters.properties.arguments_json?{arguments_json:JSON.stringify({entries:[{value:2},{value:4}]})}:{entries:[{value:2},{value:4}]}}]};return {stopReason:'stop',content:[{type:'text',text:'Observed accepted tool result.'}]};},false,undefined,true);
 const r=await f.runtime.run({...f.input,purpose:'proposal_prepare',saveContinuation:async(x:any)=>{saved=x;}});assert.deepEqual(observed.parameters,f.input.tools[0].parameters);assert.doesNotMatch(observed.description,/arguments_json|字符串内业务参数/);assert.equal(r.text,'Observed accepted tool result.');assert.equal(f.executions(),1);assert.equal(f.calls(),2);assert.deepEqual(saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments,{entries:[{value:2},{value:4}]});assert.equal(JSON.stringify(saved).includes('arguments_json'),false);
});

test('VC-10 native preparation: rejected extra parameters remain failed history; only model correction executes',async()=>{
 let saved:any,feedbackText:string;const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length)return {stopReason:'toolUse',content:[{type:'toolCall',id:'native-invalid',name:'sum_selected',arguments:{entries:[{value:2},{value:4}],unsupported:true}}]};if(results.length===1){assert.equal(results[0].isError,true);assert.equal(f.executions(),0);feedbackText=results[0].content[0].text;return {stopReason:'toolUse',content:[{type:'toolCall',id:'native-corrected',name:'sum_selected',arguments:{entries:[{value:2},{value:4}]}}]};}return {stopReason:'stop',content:[{type:'text',text:'Corrected tool observed.'}]};},false,undefined,true);
 const result=await f.runtime.run({...f.input,purpose:'proposal_prepare',saveContinuation:async(x:any)=>{saved=x;}});const feedback=JSON.parse(feedbackText!);assert.equal(feedback.code,'TOOL_ARGUMENT_INVALID');assert.equal(feedback.calculation_performed,false);assert.deepEqual(feedback.parameters.properties.entries.items.required,['value']);assert.equal(result.text,'Corrected tool observed.');assert.equal(f.executions(),1);assert.equal(f.calls(),3);assert.ok(saved.messages.some((m:any)=>m.speaker==='tool'&&m.failed));const original=saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments;assert.deepEqual(original,{entries:[{value:2},{value:4}],unsupported:true});
});


test('VC-10 native preparation: supported IR anyOf rejection preserves full schema and missing field; corrected original plan binds once',async()=>{
 let carrierSeen=false;
 const {openAnalysisProposalSchema}=await import('../../../packages/product-core/open-analysis-proposal-schema.ts');let feedbackText:string,saved:any,executed=0;
 const bad={version:'1.9',goal:'Weighted income',unit:'CNY',source_id:'synthetic-source',sheet_id:'csv',column:'A',weight_column:'B',operation:'weighted_mean',filters:[]};
 const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length){carrierSeen=!!context.tools[0].parameters.properties.arguments_json;return {stopReason:'toolUse',content:[{type:'toolCall',id:'missing-group',name:'set_analysis_steps',arguments:context.tools[0].parameters.properties.arguments_json?{arguments_json:JSON.stringify({plan:bad})}:{plan:bad}}]};}if(results.length===1){feedbackText=results[0].content[0].text;return {stopReason:'toolUse',content:[{type:'toolCall',id:'explicit-no-group',name:'set_analysis_steps',arguments:context.tools[0].parameters.properties.arguments_json?{arguments_json:JSON.stringify({plan:{...bad,group_by:null}})}:{plan:{...bad,group_by:null}}}]};}return {stopReason:'stop',content:[{type:'text',text:'Bound only after correction.'}]};});
 const tool={name:'set_analysis_steps',description:'Actual existing IR schema',parameters:{type:'object',properties:{plan:openAnalysisProposalSchema},required:['plan'],additionalProperties:false},execute:async(args:any)=>{assert.deepEqual(args,{plan:{...bad,group_by:null}});executed++;return {bound:true,calculation_performed:false};}};
 await f.runtime.run({...f.input,purpose:'proposal_prepare',tools:[tool],saveContinuation:async(x:any)=>{saved=x;}});assert.equal(carrierSeen,true,'multi-step preparation must advertise existing lossless JSON carrier');const feedback=JSON.parse(feedbackText!);assert.equal(feedback.code,'TOOL_ARGUMENT_INVALID');assert.equal(feedback.calculation_performed,false);assert.deepEqual(feedback.parameters,tool.parameters);assert.equal(executed,1);const rejected=saved.messages.find((m:any)=>m.speaker==='assistant'&&m.calls.length).calls[0].arguments;assert.deepEqual(rejected,{plan:bad});assert.ok(saved.messages.some((m:any)=>m.speaker==='tool'&&m.failed));assert.equal(f.calls(),3);
});

test('VC-10 native anyOf feedback identifies field types in the selected method without coercion',async()=>{
 let carrierSeen=false;
 const {openAnalysisProposalSchema}=await import('../../../packages/product-core/open-analysis-proposal-schema.ts');let feedbackText:string,executed=0;
 const valid={version:'2.0',goal:'Share',source_id:'synthetic-source',sheet_id:'csv',column:'A',group_by:'C',operation:'group_share',unit:'%',input_unit:'CNY',filters:[]};const bad={...valid,version:2,filters:''};
 const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length){carrierSeen=!!context.tools[0].parameters.properties.arguments_json;return {stopReason:'toolUse',content:[{type:'toolCall',id:'wrong-types',name:'set_analysis_steps',arguments:context.tools[0].parameters.properties.arguments_json?{arguments_json:JSON.stringify({plan:bad})}:{plan:bad}}]};}if(results.length===1){feedbackText=results[0].content[0].text;return {stopReason:'toolUse',content:[{type:'toolCall',id:'correct-types',name:'set_analysis_steps',arguments:context.tools[0].parameters.properties.arguments_json?{arguments_json:JSON.stringify({plan:valid})}:{plan:valid}}]};}return {stopReason:'stop',content:[{type:'text',text:'Bound corrected share.'}]};});
 const tool={name:'set_analysis_steps',description:'Actual existing IR',parameters:{type:'object',properties:{plan:openAnalysisProposalSchema},required:['plan'],additionalProperties:false},execute:async(args:any)=>{assert.deepEqual(args,{plan:valid});executed++;return {bound:true};}};
 await f.runtime.run({...f.input,purpose:'proposal_prepare',tools:[tool]});assert.equal(carrierSeen,true,'multi-step preparation must advertise existing lossless JSON carrier');const feedback=JSON.parse(feedbackText!);assert.ok(feedback.parameter_issues.some((x:any)=>x.path==='$.plan.version'&&x.expected==='string'&&x.actual==='number'));assert.ok(feedback.parameter_issues.some((x:any)=>x.path==='$.plan.filters'&&x.expected==='array'&&x.actual==='string'));assert.equal(executed,1);assert.equal(f.calls(),3);assert.equal(bad.version,2);assert.equal(bad.filters,'');
});

test('VC-11 adopted current prompt reaches Pi when checkpoint ends in historical preparation user message',async()=>{
 let saved:any,observed:any[]=[];const original='准备方案，采纳前不计算',current='当前实际动作：已采纳，执行实际计算与独立核验。\n原始分析需求：'+original;
 const f=await fixture(context=>{observed=context.messages.filter((m:any)=>m.role==='user');return {stopReason:'stop',content:[{type:'text',text:'Current action received.'}]};});
 const result=await f.runtime.run({...f.input,prompt:current,continuation:{version:'1.0',turn:0,messages:[{speaker:'user',text:original}]},saveContinuation:async(x:any)=>{saved=x;}});assert.equal(observed[0].content,original,'retain original user source');assert.equal(observed.at(-1).content,current,'deliver current Application action instead of discarding prompt');assert.equal(result.text,'Current action received.');assert.equal(f.calls(),1);assert.equal(saved.messages[0].text,original);
 assert.equal((await f.runtime.run({...f.input,prompt:current,tools:[],continuation:saved})).text,result.text);assert.equal(f.calls(),1,'completed readback cannot call again');
});


test('OA-RT03/05: failure diagnostic retains only fixed protocol metadata, never raw error or credential text',async()=>{
 const sanitize=Reflect.get(await import('../../../adapters/agent-pi/open-analysis.ts'),'sanitizedProviderFailure');assert.equal(typeof sanitize,'function');
 assert.deepEqual(sanitize('400 {"error":{"type":"invalid_request_error"},"base_resp":{"status_code":2067}} secret-key material'),{http_status:400,provider_code:2067,error_type:'invalid_request_error'});
 assert.deepEqual(sanitize('secret-key 2067 arbitrary business text'),{http_status:null,provider_code:null,error_type:null});
});


test('OA-RT05: actual HTTP529 overloaded_error uses the single shared backup request; arbitrary rejection does not',async()=>{
 const f=await fixture((_context,model)=>model.provider==='minimax-cn'?{stopReason:'error',errorMessage:'529 {"error":{"type":"overloaded_error","message":"synthetic overload"}}',content:[]}:{stopReason:'stop',content:[{type:'text',text:'Backup after actual service overload.'}]});
 const result=await f.runtime.run(f.input);assert.equal(result.text,'Backup after actual service overload.');assert.equal(f.calls(),2);assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.status,'temporary_failure');assert.equal(f.ledger.read(f.input.identity.task_id)[0]!.reason,'NETWORK_UNAVAILABLE');
 const denied=await fixture(()=>({stopReason:'error',errorMessage:'400 invalid_request_error',content:[]}));await assert.rejects(()=>denied.runtime.run(denied.input),{code:'CONNECTION_FAILED'});assert.equal(denied.calls(),1);
});


test('VC-10 selected compound method reports unexpected compiled fields without accepting or auto stripping them',async()=>{
 const {openAnalysisProposalSchema}=await import('../../../packages/product-core/open-analysis-proposal-schema.ts');let feedbackText:string,executed=0;
 const operand={source_id:'synthetic-source',sheet_id:'csv',column:'A',group_by:'C',filters:[]};
 const valid={version:'2.1',goal:'Actual change',unit:'CNY',operation:'group_change',comparison_label:'before',current_label:'after',inputs:[operand,operand]};const bad={...valid,source_id:'compiled-copy',group_by:'C'};
 const f=await fixture(context=>{const results=context.messages.filter((m:any)=>m.role==='toolResult');if(!results.length)return {stopReason:'toolUse',content:[{type:'toolCall',id:'extra-fields',name:'set_analysis_steps',arguments:{arguments_json:JSON.stringify({plan:bad})}}]};if(results.length===1){feedbackText=results[0].content[0].text;assert.equal(executed,0);return {stopReason:'toolUse',content:[{type:'toolCall',id:'valid-proposal',name:'set_analysis_steps',arguments:{arguments_json:JSON.stringify({plan:valid})}}]};}return {stopReason:'stop',content:[{type:'text',text:'Only explicit correction accepted.'}]};});
 const tool={name:'set_analysis_steps',description:'Existing compound IR',parameters:{type:'object',properties:{plan:openAnalysisProposalSchema},required:['plan'],additionalProperties:false},execute:async(args:any)=>{assert.deepEqual(args,{plan:valid});executed++;return {bound:true};}};
 await f.runtime.run({...f.input,purpose:'proposal_prepare',tools:[tool]});const feedback=JSON.parse(feedbackText!);for(const key of ['source_id','group_by'])assert.ok(feedback.parameter_issues.some((x:any)=>x.path==='$.plan.'+key&&x.expected==='not allowed'&&x.actual==='present'));assert.equal(executed,1);assert.equal(f.calls(),3);assert.equal(bad.source_id,'compiled-copy');
});
