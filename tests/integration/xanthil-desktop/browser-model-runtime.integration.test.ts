import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {createPiStoredCaseAssistantRuntime} from '../../../adapters/agent-pi/xiaomi-local.ts';
const policy=():import('../../../packages/product-core/member-operation.ts').OperationPolicy=>({version:'1.0',id:randomUUID(),revision:'1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',purpose:'membership_analysis',consumption_policy:{mode:'uncapped_metered'},model_retries:1,preparation_corrections:1,approval_reference:'synthetic-controller-decision',max_input_bytes:12000,call_output_tokens:2048,call_ms:60000,process_seconds:4});
const request=():import('../../../packages/product-core/member-model.ts').MembershipModelTurn=>({version:'2.0',context:{task_id:randomUUID(),operation_id:randomUUID(),execution_id:randomUUID(),epoch:0},policy:policy(),payload:{version:'2.0',stage:'clarify',source_set_sha256:'a'.repeat(64),selected_text:'核实两期复购变化',structure:[{source_id:randomUUID(),sheets:[{sheet_id:'csv',columns:[{name:'member_id',types:['string']}]}]}],semantics:null,result:null,diagnostic:null},signal:new AbortController().signal});
test('BF-R02/03/07 E05-c: explicit membership2 uses installed Pi fixed request and measured token usage',async t=>{
 let calls=0,keys=0,wire:Record<string,unknown>={};const runtime=createPiStoredCaseAssistantRuntime(()=>{keys++;return 'synthetic-membership2-key';}),turn=Reflect.get(runtime,'membershipTurn');assert.equal(typeof turn,'function','E05-c: explicit membership2 consumer is missing');
 const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline network forbidden'));
 t.mock.method(globalThis,'fetch',async(url:unknown,options:{body:string})=>{calls++;assert.equal(String(url),'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');wire=JSON.parse(options.body);const chunk={id:'offline-membership2',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'question',text:'请确认两期日期与有效订单状态。'})},finish_reason:'stop'}],usage:{prompt_tokens:12,completion_tokens:3,total_tokens:15}};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const input=request(),result=await turn(input);assert.equal(calls,1);assert.equal(keys,1);assert.equal(result.version,'2.0');assert.deepEqual(result.context,input.context);assert.deepEqual(result.usage.input_tokens,{kind:'known',value:'12'});assert.deepEqual(result.usage.output_tokens,{kind:'known',value:'3'});assert.equal(result.output.kind,'question');assert.deepEqual(wire.response_format,{type:'json_object'});assert.equal(wire.tools,undefined);assert.equal(wire.model,'mimo-v2.6-pro');assert.equal(JSON.stringify(wire).includes('synthetic-membership2-key'),false);
 const evidence=Reflect.get(runtime,'describeMembershipOutcome');assert.equal(evidence(result)!.physical_status,'settled');assert.deepEqual(evidence(result)!.context,input.context);assert.equal(evidence({...result}),null,'copied result is not trusted physical provenance');
 for(const bad of [{...input,version:'99'},{...input,policy:{...input.policy,model:'other'}},{...input,payload:{...input.payload,rows:[['secret']]}},{...input,payload:{...input.payload,selected_text:'/private/secret'}}])await assert.rejects(()=>Reflect.apply(turn,runtime,[bad]));assert.equal(calls,1);assert.equal(keys,1,'invalid material is rejected before credential access');
});

test('BF-R07 E05-c: cancellation retains pending transport until terminal stream evidence, not merely abort',async t=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier),{pathToFileURL}=await import('node:url'),{join}=await import('node:path'),ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 let entered!:()=>void,finish!:()=>void;const ready=new Promise<void>(r=>entered=r);
 t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',(model:Record<string,unknown>)=>{const stream=ai.createAssistantMessageEventStream();finish=()=>stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:JSON.stringify({kind:'question',text:'late'})}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:2,totalTokens:12,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});entered();return stream;});
 const runtime=createPiStoredCaseAssistantRuntime(()=> 'synthetic-cancel-key'),turn=Reflect.get(runtime,'membershipTurn'),describe=Reflect.get(runtime,'describeMembershipOutcome'),abort=new AbortController(),input={...request(),signal:abort.signal};let returned=false;
 const pending=turn(input).catch((e:unknown)=>e).finally(()=>{returned=true;});await ready;abort.abort();await new Promise(r=>setTimeout(r,20));assert.equal(returned,false);finish();const failure=await pending;assert.ok(failure instanceof Error);assert.equal(Reflect.get(failure,'code'),'CANCELLED');assert.equal(describe(failure)!.physical_status,'settled');assert.deepEqual(describe(failure)!.context,input.context);assert.equal(describe({code:'CANCELLED',physical_status:'settled'}),null);
});

test('BF-R07 E05-c: unobserved stream failure remains unknown; prelaunch cancellation is not started',async t=>{
 const specifier='@earendil-works/pi-coding-agent',sdk=await import(specifier);let calls=0;t.mock.method(sdk.ModelRuntime.prototype,'streamSimple',()=>{calls++;throw new Error('synthetic unobserved transport');});
 const runtime=createPiStoredCaseAssistantRuntime(()=> 'synthetic-unknown-key'),turn=Reflect.get(runtime,'membershipTurn'),describe=Reflect.get(runtime,'describeMembershipOutcome');const failure=await turn(request()).catch((e:unknown)=>e);assert.equal(calls,1);assert.equal(describe(failure)!.physical_status,'unknown');
 const abort=new AbortController();abort.abort();const stopped=await turn({...request(),signal:abort.signal}).catch((e:unknown)=>e);assert.equal(calls,1);assert.equal(describe(stopped)!.physical_status,'not_started');assert.deepEqual(describe(stopped)!.usage.input_tokens,{kind:'known',value:'0'});
});

test('BF-R07 E05-c: missing provider usage remains unknown rather than zero or configured budget',async t=>{
 const net=await import('node:net');t.mock.method(net.Socket.prototype,'connect',()=>assert.fail('offline network forbidden'));t.mock.method(globalThis,'fetch',async()=>{const chunk={id:'missing-usage',object:'chat.completion.chunk',created:0,model:'mimo-v2.6-pro',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify({kind:'question',text:'请确认期间。'})},finish_reason:'stop'}]};return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});});
 const runtime=createPiStoredCaseAssistantRuntime(()=> 'synthetic-unknown-usage-key'),result=await Reflect.get(runtime,'membershipTurn')(request());assert.equal(result.usage.input_tokens.kind,'unknown');assert.equal(result.usage.output_tokens.kind,'unknown');assert.equal(result.usage.active_ms.kind,'known');
});


test('BF-R04/06 E05-f: preparation proposal covers every disclosed sheet exactly once; periods are real and bounded',async()=>{
 const {membershipModelOutput,membershipModelPayload}=await import('../../../packages/product-core/member-model.ts');
 const members={member_id:'member_id',member_group:'member_group'},orders={order_id:'order_id',order_member_id:'order_member_id',paid_at:'paid_at',amount:'amount',status:'status',currency:'currency'};
 const a=randomUUID(),b=randomUUID(),binding=[{source_id:a,sheet_id:'csv',role:'members',columns:members},{source_id:b,sheet_id:'sheet1',role:'orders',columns:orders},{source_id:b,sheet_id:'sheet2',role:'orders',columns:orders}];
 const payload={...request().payload,stage:'generate_preparation' as const,structure:[{source_id:a,sheets:[{sheet_id:'csv',columns:Object.keys(members).map(name=>({name,types:['string']}))}]},{source_id:b,sheets:['sheet1','sheet2'].map(sheet_id=>({sheet_id,columns:Object.keys(orders).map(name=>({name,types:['string']}))}))}]};
 const proposal={kind:'preparation',bindings:binding,code:'pass'};assert.deepEqual(membershipModelOutput(proposal,payload),proposal);
 for(const bindings of [binding.slice(0,2),[...binding,binding[0]],[binding[0]],binding.map((v,i)=>i===2?{...v,sheet_id:'missing'}:v)])assert.throws(()=>membershipModelOutput({...proposal,bindings},payload),'incomplete/duplicate/foreign sheet cannot reach executor');
 const semantics={metric:'membership_repurchase_comparison',currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-02-01'},current_period:{start_date:'2026-03-01',end_date:'2026-04-01'},status_meanings:'explicitly_confirmed_local'};
 assert.deepEqual(membershipModelPayload({...payload,semantics}).semantics,semantics);
 for(const change of [{comparison_period:{start_date:'2026-02-30',end_date:'2026-03-31'}},{current_period:{start_date:'2026-03-01',end_date:'2026-03-31'}},{current_period:{start_date:'2026-01-15',end_date:'2026-02-15'}},{current_period:{start_date:'2026-03-01',end_date:'2026-03-01'}}])assert.throws(()=>membershipModelPayload({...payload,semantics:{...semantics,...change}}));
 assert.deepEqual(membershipModelPayload({...payload,semantics:{...semantics,current_period:{start_date:'2025-12-01',end_date:'2026-01-01'}}}).semantics,{...semantics,current_period:{start_date:'2025-12-01',end_date:'2026-01-01'}},'existing non-overlap contract imposes no chronological ordering');
 assert.equal(membershipModelPayload(payload).semantics,null,'missing semantics is not defaulted');
});


test('BF-R01/04 E05-j: bounded analysis proposal attributes necessary semantics to actual selected text',async()=>{
 const {membershipModelOutput}=await import('../../../packages/product-core/member-model.ts'),a=randomUUID(),b=randomUUID(),members={member_id:'member_id',member_group:'member_group'},orders={order_id:'order_id',order_member_id:'order_member_id',paid_at:'paid_at',amount:'amount',status:'status',currency:'currency'},text='比较2026-01-01至2026-02-01与2026-03-01至2026-04-01，均不含结束日；paid表示已支付的有效订单。';
 const payload={...request().payload,stage:'generate_preparation' as const,selected_text:text,structure:[{source_id:a,sheets:[{sheet_id:'csv',columns:Object.keys(members).map(name=>({name,types:['string']}))}]},{source_id:b,sheets:[{sheet_id:'csv',columns:Object.keys(orders).map(name=>({name,types:['string']}))}]}]};
 const analysis={currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-02-01'},current_period:{start_date:'2026-03-01',end_date:'2026-04-01'},period_evidence:text.split('；')[0],statuses:[{value:'paid',meaning:'已支付的有效订单',evidence:'paid表示已支付的有效订单'}]},proposal={kind:'preparation',bindings:[{source_id:a,sheet_id:'csv',role:'members',columns:members},{source_id:b,sheet_id:'csv',role:'orders',columns:orders}],code:'pass',analysis};
 assert.deepEqual(membershipModelOutput(proposal,payload),proposal);
 for(const changed of [{...analysis,period_evidence:'not selected'},{...analysis,current_period:{start_date:'2026-03-01',end_date:'2026-03-31'}},{...analysis,statuses:[analysis.statuses[0],analysis.statuses[0]]},{...analysis,statuses:[{...analysis.statuses[0],evidence:'invented status meaning'}]},{...analysis,currency:'USD'},{...analysis,hypothesis:'decline'}])assert.throws(()=>membershipModelOutput({...proposal,analysis:changed},payload));
 assert.throws(()=>membershipModelOutput(proposal,{...payload,selected_text:null}));const {analysis:omitted,...without}=proposal;void omitted;assert.equal(Object.hasOwn(membershipModelOutput(without,payload),'analysis'),false,'missing semantics remains absent');
});

test('BF-R01/02 P1: compilation binds four explicit dates and latest clarification instead of trusting an accurate quote',async()=>{
 const {membershipAnalysisProposal}=await import('../../../packages/product-core/member-model.ts'),{compilePreparedMembershipSemantics}=await import('../../../packages/application/member-model.ts');
 const text='比较2026-01-01至2026-01-29与2026-02-01至2026-03-01；paid表示已支付。',p={...request().payload,stage:'generate_preparation' as const,selected_text:text},a={currency:'CNY',time_zone:'Asia/Shanghai',comparison_period:{start_date:'2026-01-01',end_date:'2026-01-29'},current_period:{start_date:'2026-02-01',end_date:'2026-03-01'},period_evidence:text.split('；')[0],statuses:[{value:'paid',meaning:'已支付',evidence:'paid表示已支付'}]};
 assert.deepEqual(compilePreparedMembershipSemantics(a,p,randomUUID())!.selection.comparison_period,a.comparison_period);
 const wrong={...a,comparison_period:{start_date:'2024-01-01',end_date:'2024-01-29'},current_period:{start_date:'2024-02-01',end_date:'2024-02-29'}};
 for(const value of [wrong,{...a,comparison_period:a.current_period,current_period:a.comparison_period}]){assert.throws(()=>membershipAnalysisProposal(value,p));assert.throws(()=>compilePreparedMembershipSemantics(value,p,randomUUID()));}
 const clarification={sha256:'b'.repeat(64),reply:'改为比较2025-01-01至2025-01-29与2025-02-01至2025-03-01'};
 assert.throws(()=>membershipAnalysisProposal(a,{...p,clarifications:[clarification]}),'old quote cannot override latest answer');
 for(const selected_text of ['比较最近两期；paid表示已支付。','可能比较2026-01-01至2026-01-29或2026-02-01至2026-03-01；paid表示已支付。'])assert.throws(()=>compilePreparedMembershipSemantics({...a,period_evidence:selected_text.split('；')[0]},{...p,selected_text},randomUUID()));
 const latest={...a,comparison_period:{start_date:'2025-01-01',end_date:'2025-01-29'},current_period:{start_date:'2025-02-01',end_date:'2025-03-01'},period_evidence:clarification.reply};assert.deepEqual(membershipAnalysisProposal(latest,{...p,clarifications:[clarification]}),latest);
});
