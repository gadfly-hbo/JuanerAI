// Fixed supplier SDK integration. Synthetic transport only; no Provider or credentials.
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const {createSessionRuntime}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);
const {FileBudgetStore}=await import(pathToFileURL(join(root,'dist/agent/budget-store.js')).href);const {JsonlAuditSink}=await import(pathToFileURL(join(root,'dist/agent/audit.js')).href);const {UNLIMITED_LIMITS}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const {createBuiltinImagePurpose}=await import(pathToFileURL(join(root,'dist/agent/builtin-image-purpose.js')).href);
const image={data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',mimeType:'image/png'};
test('RS-IMAGE-03 actual fixed SDK and MiniMax serializer carry the authorized image in the first request without tool selection',async t=>{
 const {createRuntime,createPiTransport}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);
 const {MINIMAX_M3}=await import(pathToFileURL(join(root,'dist/agent/model.js')).href);
 const dir=await mkdtemp(join(tmpdir(),'studio-initial-image-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const model={...MINIMAX_M3,maxOutputTokens:2048},bodies=[],budgets=new FileBudgetStore(join(dir,'budget.json'));
 const transport=createPiTransport({model,apiKey:'synthetic-not-a-provider-key',fetch:async(input,init)=>{
  bodies.push(JSON.parse(init?.body??await input.text()));const events=[
   {type:'message_start',message:{id:'synthetic-image',type:'message',role:'assistant',model:model.id,content:[],stop_reason:null,usage:{input_tokens:2,output_tokens:0}}},
   {type:'content_block_start',index:0,content_block:{type:'text',text:''}},
   {type:'content_block_delta',index:0,delta:{type:'text_delta',text:'合成图片描述'}},
   {type:'content_block_stop',index:0},
   {type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:3}},
   {type:'message_stop'}];
  return new Response(events.map(e=>'event: '+e.type+'\ndata: '+JSON.stringify(e)+'\n\n').join(''),{status:200,headers:{'content-type':'text/event-stream'}});
 }});
 const stage=createBuiltinImagePurpose({model,transport,authorizeRead:async()=>true}),runtime=createRuntime({model,transport,purposes:[stage.purpose],authorize:async()=>true,budgets,audit:new JsonlAuditSink(join(dir,'audit.jsonl'))});
 const result=await stage.run(runtime,'synthetic-initial-image',image,UNLIMITED_LIMITS,new AbortController().signal);await runtime.waitForIdle('synthetic-initial-image');
 assert.equal(bodies.length,1);const sent=bodies[0].messages.flatMap(m=>Array.isArray(m.content)?m.content:[]).filter(c=>c.type==='image');
 assert.equal(sent.length,1,'authorized image must be present in first actual Provider payload even when model selects no tool');assert.equal(sent[0].source.data,image.data);assert.equal(sent[0].source.media_type,image.mimeType);
 assert.equal(result.result.status,'succeeded',JSON.stringify(result));assert.equal(result.read,true);assert.equal(result.result.value,'合成图片描述');
 assert.equal(budgets.usageOf('synthetic-initial-image').modelCalls,1);assert.equal(budgets.usageOf('synthetic-initial-image').toolCalls,0);assert.equal(budgets.usageOf('synthetic-initial-image').reservedOutputTokens,0);assert(!(await readFile(join(dir,'audit.jsonl'),'utf8')).includes(image.data));
});

test('RS-IMAGE-03 larger images retain legacy tool admission and existing size guard; SDK tool-size failure is not success',async()=>{
 const {createRuntime}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);const large={mimeType:'image/png',data:'A'.repeat(4194308)};let calls=0;
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:2048,input:['text','image']};
 const transport=async request=>{calls++;const sent=request.messages.flatMap(m=>m.images??[]);assert.equal(sent.length,0,'SDK rejects the legacy oversized tool result before it can reach the model');if(calls>1)return {content:[{kind:'text',text:'未读取较大图片'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};return {content:[{kind:'tool',id:'large-image',name:'read_authorized_image',arguments:{}}],stop:'tools',usage:{inputTokens:2,outputTokens:3}};};
 const stage=createBuiltinImagePurpose({model,transport,authorizeRead:async()=>true}),runtime=createRuntime({model,transport,purposes:[stage.purpose],authorize:async()=>true,audit:{async append(){}}});
 const result=await stage.run(runtime,'synthetic-large-image',large,UNLIMITED_LIMITS,new AbortController().signal);assert.equal(result.read,true,'legacy tool still reads the approved input');assert.equal(result.result.status,'failed','reading locally does not override the SDK delivery failure');assert.equal(calls,1);
 await assert.rejects(()=>stage.run(runtime,'synthetic-oversize',{...large,data:'A'.repeat(32*1024*1024+4)},UNLIMITED_LIMITS,new AbortController().signal),/RS_IMAGE_INVALID/);assert.equal(calls,1);
});
test('RS-POLICY-01 image purpose uses same actual SDK task/config/ledger, reads authorized image and preserves text-only fallback',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'studio-image-stage-'));await mkdir(join(dir,'session'));t.after(()=>rm(dir,{recursive:true,force:true}));const taskId='task_synthetic',budgets=new FileBudgetStore(join(dir,'budget.json'));let calls=0,grant=true;
 const transport=async req=>{calls++;const vision=req.messages.some(m=>m.images?.length);return {content:req.maxOutputTokens===2048&&!vision?[{kind:'tool',id:'read-1',name:'read_authorized_image',arguments:{}}]:[{kind:'text',text:vision?'合成图片描述':'合成主会话'}],stop:req.maxOutputTokens===2048&&!vision?'tools':'complete',usage:{inputTokens:2,outputTokens:3}};};
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,input:['text','image']},fallback={...model,id:'text-only',input:['text']};
 const stage=createBuiltinImagePurpose({model,transport,authorizeRead:async()=>grant});assert.equal(stage.purpose.tools.length,1);
 const runtime=createSessionRuntime({model,transport,fallbacks:[{model:fallback,transport}],purposes:[{id:'ppt-build',mode:'agent',model,transport,fallbacks:[{model:fallback,transport}],tools:[]},stage.purpose],authorize:async()=>grant,budgets,audit:new JsonlAuditSink(join(dir,'audit.jsonl')),bindOperation:async()=>{},reconcile:async()=> 'ready',storage:{directory:join(dir,'session'),cwd:dir,policyVersion:'synthetic',authorize:async()=>true,acquireWriter:async()=>({async release(){}})}});
 const session=await runtime.create(),main=()=>runtime.run({taskId,sessionId:session.id,purpose:'ppt-build',prompt:'合成主任务',tools:[],limits:UNLIMITED_LIMITS,modelRecovery:{extraAttempts:1}});
 assert.equal((await main()).status,'succeeded');const value=await stage.run(runtime,taskId,image,UNLIMITED_LIMITS,new AbortController().signal);assert.equal(value.result.status,'succeeded',JSON.stringify(value));assert.equal(value.read,true);assert.equal(value.result.value,'合成图片描述');assert.equal((await main()).status,'succeeded');await runtime.waitForIdle(taskId);assert.equal(calls,3);assert.equal(budgets.usageOf(taskId).modelCalls,3);
 grant=false;await assert.rejects(()=>stage.run(runtime,taskId,image,UNLIMITED_LIMITS,new AbortController().signal));assert.equal(calls,3);
 const audit=await readFile(join(dir,'audit.jsonl'),'utf8');assert(!audit.includes(image.data));const rows=audit.trim().split('\n').map(JSON.parse);assert(rows.filter(e=>e.kind==='model.admitted').every(e=>e.taskId===taskId));
});

test('RS-IMAGE-03 admitted vision transport attaches exact authorized image and rechecks revocation/cancellation',async()=>{
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:2048,input:['text','image']};
 for(const scenario of ['revoked','cancelled','different','attachment','late-cancel']){
  let checks=0,calls=0;const abort=new AbortController();
  const stage=createBuiltinImagePurpose({model,authorizeRead:async()=>++checks===1||scenario!=='revoked',transport:async outbound=>{calls++;assert.deepEqual(outbound.messages.flatMap(m=>m.images??[]),[image]);if(scenario==='late-cancel')abort.abort();return {content:[{kind:'text',text:'synthetic'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};}});
  const runtime={async runAgent(request){assert.equal(request.images,undefined,'fixed mixed-purpose plan must not receive initial images for unrelated text-only purposes');if(scenario==='cancelled')abort.abort();await stage.purpose.transport({model,messages:[{role:'user',text:'synthetic',...(scenario==='attachment'?{}:{images:[scenario==='different'?{...image,data:'aW1hZ2U='}:image]})}],maxOutputTokens:2048,signal:abort.signal});return {status:'succeeded',value:'synthetic'};}};
  if(['revoked','cancelled','different'].includes(scenario)){
   await assert.rejects(()=>stage.run(runtime,'synthetic-guard',image,UNLIMITED_LIMITS,abort.signal),scenario==='revoked'?/RS_IMAGE_PERMISSION_REQUIRED/:scenario==='different'?/RS_IMAGE_INVALID/:/RS_IMAGE_CANCELLED/);assert.equal(calls,0);
  }else{const result=await stage.run(runtime,'synthetic-guard',image,UNLIMITED_LIMITS,abort.signal);assert.equal(calls,1);assert.equal(result.read,scenario==='attachment',scenario+' must reflect the actual authorized transport attachment and cancellation');}
 }
});

test('RS-POLICY-01 rejects invalid or cancelled inputs before runtime and rechecks permission at image read',async()=>{
 let authorizations=0,runs=0;
 const stage=createBuiltinImagePurpose({model:{provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,input:['text','image']},transport:async()=>{throw Error('unexpected transport');},authorizeRead:async()=>++authorizations===1});
 const cancelled=new AbortController();cancelled.abort();const runtime={async runAgent(){runs++;await assert.rejects(()=>stage.purpose.tools[0].execute({}),/RS_IMAGE_PERMISSION_REQUIRED/);return {status:'blocked',reason:'AUTHORITY_REQUIRED'};}};
 await assert.rejects(()=>stage.run(runtime,'synthetic',image,UNLIMITED_LIMITS,cancelled.signal),/RS_IMAGE_CANCELLED/);
 for(const invalid of [{...image,data:''},{...image,data:'not base64'},{...image,data:'AB=='},{...image,mimeType:'text/html'}])await assert.rejects(()=>stage.run(runtime,'synthetic',invalid,UNLIMITED_LIMITS,new AbortController().signal),/RS_IMAGE_INVALID/);
 assert.equal(authorizations,0);assert.equal(runs,0);
 const denied=await stage.run(runtime,'synthetic',image,UNLIMITED_LIMITS,new AbortController().signal);assert.equal(denied.read,false);assert.equal(denied.result.status,'blocked');assert.equal(runs,1);assert.equal(authorizations,2);
 await assert.rejects(()=>stage.purpose.tools[0].execute({}),/RS_IMAGE_PERMISSION_REQUIRED/);
});

test('RS-POLICY-01 has a single image slot and clears it after a failed SDK run',async()=>{
 let release;const gate=new Promise(r=>{release=r;});let entered;const ready=new Promise(r=>{entered=r;});
 const stage=createBuiltinImagePurpose({model:{provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,input:['text','image']},transport:async()=>{throw Error('unexpected transport');},authorizeRead:async()=>true});
 const runtime={async runAgent(){entered();await gate;throw Error('synthetic SDK failure');}};
 const run=stage.run(runtime,'synthetic',image,UNLIMITED_LIMITS,new AbortController().signal);await ready;
 await assert.rejects(()=>stage.run(runtime,'synthetic',image,UNLIMITED_LIMITS,new AbortController().signal),/RS_IMAGE_BUSY/);release();await assert.rejects(()=>run,/synthetic SDK failure/);
 const next=await stage.run({async runAgent(){return {status:'succeeded',value:'no image read'};}},'synthetic',image,UNLIMITED_LIMITS,new AbortController().signal);assert.equal(next.read,false);assert.equal(next.result.status,'succeeded');
});

test('RS-POLICY-01 actual supplier SessionHost shares main/image budget and requires built-in admission',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);
 assert.equal(typeof SessionHost.prototype.describeImage,'function','SessionHost must expose the fixed metered image stage');
 const dir=await mkdtemp(join(tmpdir(),'studio-session-image-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 let calls=0,allowed=true;
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
 const transport=async req=>{calls++;const vision=req.messages.some(m=>m.images?.length);return {content:req.maxOutputTokens===2048&&!vision?[{kind:'tool',id:'read-1',name:'read_authorized_image',arguments:{}}]:[{kind:'text',text:vision?'合成会话图片描述':'合成主会话'}],stop:req.maxOutputTokens===2048&&!vision?'tools':'complete',usage:{inputTokens:2,outputTokens:3}};};
 const opts={projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport};
 await assert.rejects(()=>SessionHost.create(opts),/RS_BUILTIN_ADMISSION_REQUIRED/);
 const host=await SessionHost.create({...opts,builtin:{authorize:async()=>allowed,image:{model,transport}}});t.after(()=>host.close());
 await host.send('合成主任务');await host.currentResult();await host.waitForIdle();
 const side=await host.describeImage(image,new AbortController().signal);assert.equal(side.result.status,'succeeded');assert.equal(side.read,true);assert.equal(side.result.value,'合成会话图片描述');await host.waitForIdle();
 await host.send('继续合成主任务');await host.currentResult();await host.waitForIdle();assert.equal(calls,3);
 const budget=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8'));assert(JSON.stringify(budget).includes(host.taskId));const audit=await readFile(join(dir,'agent-audit.jsonl'),'utf8');assert(!audit.includes(image.data));
 allowed=false;await assert.rejects(()=>host.describeImage(image,new AbortController().signal),/RS_IMAGE_PERMISSION_REQUIRED/);assert.equal(calls,3);assert.equal(host.isBusy(),false);
});

test('RS-POLICY-01 fixed supplier professional skill is loaded despite historical name/directory warning',async()=>{
 const {loadHarnessResources}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);
 const resources=await loadHarnessResources({cwd:root,sources:[{kind:'skills',path:join(root,'assets/skills/ppt'),version:'synthetic-fixed-source'}],authorize:async()=>true});
 assert.equal(resources.skills.length,1);assert.equal(resources.skills[0].name,'ppt-report');assert.match(resources.skills[0].content,/原真数据/);assert.deepEqual(resources.diagnostics.map(d=>d.kind),['invalid_metadata']);
});

test('RS-POLICY-01 actual SessionHost gates code/network and screenshot tools before execution',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);
 for(const [name,args,effect] of [['bash',{command:'printf SHOULD_NOT_RUN > sentinel.txt'},'code_network'],['render_deck',{},'code_network'],['look_page',{page:'page_01'},'screenshot']]){
  const dir=await mkdtemp(join(tmpdir(),'studio-denied-tool-'));t.after(()=>rm(dir,{recursive:true,force:true}));let calls=0;const effects=[];
  const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
  const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport:async()=>{calls++;return {content:[{kind:'tool',id:'denied-1',name,arguments:args}],stop:'tools',usage:{inputTokens:2,outputTokens:3}};},builtin:{authorize:async e=>{effects.push(e);return e!==effect;}}});
  t.after(()=>host.close());await host.send('合成工具拒绝测试');const result=await host.currentResult();await host.waitForIdle();assert.equal(result.status,'blocked',JSON.stringify(result));assert.equal(result.reason,'AUTHORITY_REQUIRED');assert.equal(calls,1);assert(effects.includes(effect));
  const audit=await readFile(join(dir,'agent-audit.jsonl'),'utf8');assert(!audit.includes('tool.admitted'));await assert.rejects(()=>readFile(join(dir,'sentinel.txt')),{code:'ENOENT'});
 }
});

test('RS-POLICY-01 actual SessionHost keeps physical busy after abort until an uncooperative model settles',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const dir=await mkdtemp(join(tmpdir(),'studio-stop-physical-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 let stopReceipt;let admit,release;const admitted=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;});const watchdog=setTimeout(()=>release(),2500);t.after(()=>{clearTimeout(watchdog);release();});
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport:async()=>{admit();await gate;return {content:[{kind:'text',text:'synthetic late result'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};},builtin:{authorize:async()=>true,beforeRun:async()=>'synthetic-stop',afterRun:async(_id,receipt)=>{stopReceipt=receipt;}}});
 t.after(async()=>{release();await host.waitForIdle();await host.close();});await host.send('合成在途停止测试');await admitted;const result=host.currentResult();const stop=host.control({kind:'abort'});await new Promise(r=>setTimeout(r,50));assert.equal(host.isBusy(),true,'logical abort must not free physical busy');await assert.rejects(()=>host.close(),/RS_PROJECT_PENDING/);
 release();await stop;const settled=await result;await host.waitForIdle();assert(settled);assert(['cancelled','failed'].includes(settled.status),JSON.stringify(settled));assert.equal(settled.usageKnown,true,'raw SDK snapshot flag is not a Provider settlement receipt');await new Promise(r=>setTimeout(r,0));assert.equal(stopReceipt.physical_settled,true);assert.equal(stopReceipt.operation_usage_known,false);assert.equal(stopReceipt.cumulative_usage_known,false);
 const store=new FileBudgetStore(join(dir,'agent-budget.json'));assert.equal(store.usageOf(host.taskId).modelCalls,1);assert.equal(store.usageOf(host.taskId).reservedOutputTokens,32768);assert.equal(store.usageOf(host.taskId).outputTokens,32768,'cancelled request keeps its unresolved reservation despite a late reply');
});

test('RS-POLICY-01 actual failed transport with no usage retains UNKNOWN reservation and physical idle separately',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const dir=await mkdtemp(join(tmpdir(),'studio-unknown-usage-'));t.after(()=>rm(dir,{recursive:true,force:true}));let calls=0;
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport:async()=>{calls++;throw Error('synthetic no consumption receipt');},builtin:{authorize:async()=>true}});t.after(()=>host.close());
 await host.send('合成无用量回执失败');const result=await host.currentResult();await host.waitForIdle();assert.equal(result.usageKnown,true,'SDK usageKnown reports the available ledger snapshot, not settled Provider consumption');assert.equal(result.status,'failed');assert(calls>=1&&calls<=2);const usage=new FileBudgetStore(join(dir,'agent-budget.json')).usageOf(host.taskId);assert.equal(usage.modelCalls,calls);assert.equal(usage.reservedOutputTokens,32768*calls);assert.equal(usage.outputTokens,32768*calls);const {reportStudioConsumptionStatus}=await import(pathToFileURL(join(root,'dist/juanerai/policy.js')).href);assert.equal(typeof reportStudioConsumptionStatus,'function');assert.deepEqual(reportStudioConsumptionStatus(0,usage,result.usageKnown),{operation_usage_known:false,cumulative_usage_known:false,reserved_output_tokens:32768*calls});
});

test('RS-CONFIG-01 fixed three existing chain variants and image purpose retain task configuration across credential availability',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const dir=await mkdtemp(join(tmpdir(),'studio-fixed-chain-'));t.after(()=>rm(dir,{recursive:true,force:true}));const used=[];
 const primary={provider:'synthetic',id:'primary',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']},fallback={...primary,id:'text-only',maxOutputTokens:16384,input:['text']};
 const transport=async request=>{used.push(request.model.id);return {content:[{kind:'text',text:'synthetic fixed chain'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};};
 for(const selection of ['primary','full','fallback']){
  const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model:primary,transport,fallbacks:[{model:fallback,transport}],builtin:{authorize:async()=>true,image:{model:primary,transport},chain:{primary:{model:primary,transport},fallback:{model:fallback,transport},selection}}});
  try{await host.send('合成既有模型链选择');const result=await host.currentResult();await host.waitForIdle();assert.equal(result.status,'succeeded',JSON.stringify(result));}finally{await host.close();}
 }
 assert.deepEqual(used,['primary','primary','text-only']);const budget=JSON.parse(await readFile(join(dir,'agent-budget.json'),'utf8'));const ledgers=Object.values(budget.tasks);assert.equal(ledgers.length,1);assert.equal(ledgers[0].usage.modelCalls,3);assert(!ledgers[0].pendingConfigMigration);
});

test('RS-POLICY-01 SessionHost lifecycle admits before SDK effects and settles after physical idle with neutral consumption receipt',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const dir=await mkdtemp(join(tmpdir(),'studio-lifecycle-hooks-'));t.after(()=>rm(dir,{recursive:true,force:true}));const order=[];let receipt;
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport:async()=>{order.push('model');return {content:[{kind:'text',text:'synthetic lifecycle'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};},builtin:{authorize:async()=>true,beforeRun:async(kind,signal)=>{assert.equal(kind,'main');assert.equal(signal.aborted,false);order.push('admitted');return 'synthetic-operation';},afterRun:async(id,value)=>{assert.equal(id,'synthetic-operation');order.push('settled');receipt=value;}}});t.after(()=>host.close());
 await host.send('合成生命周期');await host.currentResult();await host.waitForIdle();await new Promise(r=>setTimeout(r,0));assert.deepEqual(order,['admitted','model','settled']);assert.equal(receipt.physical_settled,true);assert.equal(receipt.operation_usage_known,true);assert.equal(receipt.cumulative_usage_known,true);assert.equal(receipt.reserved_output_tokens,0);assert.equal(receipt.outcome,'succeeded');assert.equal(typeof receipt.sdk_run_id,'string');
});

test('RS-POLICY-01 image lifecycle uses the same neutral admission and physical settlement hooks',async t=>{
 const {SessionHost}=await import(pathToFileURL(join(root,'dist/agent/session-host.js')).href);const dir=await mkdtemp(join(tmpdir(),'studio-image-hooks-'));t.after(()=>rm(dir,{recursive:true,force:true}));const order=[];let receipt;
 const model={provider:'synthetic',id:'vision',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:65536,maxOutputTokens:32768,reasoning:true,input:['text','image']};
 const transport=async req=>{order.push('model');const read=req.messages.some(m=>m.images?.length);return {content:read?[{kind:'text',text:'合成图片'}]:[{kind:'tool',id:'image-1',name:'read_authorized_image',arguments:{}}],stop:read?'complete':'tools',usage:{inputTokens:2,outputTokens:3}};};
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport,builtin:{authorize:async()=>true,image:{model,transport},beforeRun:async(kind)=>{assert.equal(kind,'image');order.push('admitted');return 'synthetic-image';},afterRun:async(id,value)=>{assert.equal(id,'synthetic-image');receipt=value;order.push('settled');}}});t.after(()=>host.close());
 const value=await host.describeImage(image,new AbortController().signal);assert.equal(value.read,true);assert.deepEqual(order,['admitted','model','settled']);assert.equal(receipt.operation_usage_known,true);assert.equal(receipt.physical_settled,true);
});


test('RS-IMAGE-04 actual fixed MiMo OpenAI serializer sends authorized image and shares text/image task after reopening',async t=>{
 const {createSessionRuntime,createPiTransport}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);
 const {MIMO_FLASH}=await import(pathToFileURL(join(root,'dist/agent/model.js')).href);
 const dir=await mkdtemp(join(tmpdir(),'studio-mimo-vision-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const model={...MIMO_FLASH,input:['text','image'],maxOutputTokens:2048},bodies=[];
 const transport=createPiTransport({model,apiKey:'synthetic-not-a-provider-key',fetch:async(input,init)=>{
  bodies.push(JSON.parse(init?.body??await input.text()));const chunk={id:'synthetic-mimo',object:'chat.completion.chunk',created:1,model:model.id,choices:[{index:0,delta:{role:'assistant',content:'合成图片100/120/135'},finish_reason:null}]};
  return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: '+JSON.stringify({...chunk,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
 }});
 for(let index=0;index<2;index++){
  const budgets=new FileBudgetStore(join(dir,'budget.json')),stage=createBuiltinImagePurpose({id:'image-understand-mimo',model,transport,authorizeRead:async()=>true});
  assert.equal(stage.purpose.id,'image-understand-mimo');
  await mkdir(join(dir,'session'),{recursive:true});const runtime=createSessionRuntime({model:MIMO_FLASH,transport,purposes:[{id:'main',mode:'agent',thinkingLevel:'off',model:MIMO_FLASH,transport:async()=>({content:[{kind:'text',text:'合成文字'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}}),tools:[]},stage.purpose],authorize:async()=>true,budgets,audit:new JsonlAuditSink(join(dir,'audit.jsonl')),bindOperation:async()=>{},reconcile:async()=> 'ready',storage:{directory:join(dir,'session'),cwd:dir,policyVersion:'synthetic',authorize:async()=>true,acquireWriter:async()=>({async release(){}})}});
  const session=await runtime.create(),mainResult=await runtime.run({sessionId:session.id,taskId:'task_mimo',purpose:'main',prompt:'合成文字',tools:[],limits:UNLIMITED_LIMITS,thinkingLevel:'off',modelRecovery:{extraAttempts:1}});assert.equal(mainResult.status,'succeeded',JSON.stringify(mainResult));
  const result=await stage.run(runtime,'task_mimo',image,UNLIMITED_LIMITS,new AbortController().signal);await runtime.waitForIdle('task_mimo');
  assert.equal(result.result.status,'succeeded',JSON.stringify(result));assert.equal(result.read,true);assert.match(result.result.value,/100\/120\/135/);assert.equal(budgets.usageOf('task_mimo').modelCalls,(index+1)*2);assert.equal(budgets.usageOf('task_mimo').reservedOutputTokens,0);
 }
 assert.equal(bodies.length,2);for(const body of bodies){assert.equal(body.model,'mimo-v2.6-flash');const images=body.messages.flatMap(m=>Array.isArray(m.content)?m.content:[]).filter(c=>c.type==='image_url');assert.equal(images.length,1);assert.equal(images[0].image_url.url,'data:'+image.mimeType+';base64,'+image.data);}
 assert(!(await readFile(join(dir,'audit.jsonl'),'utf8')).includes(image.data));
});
