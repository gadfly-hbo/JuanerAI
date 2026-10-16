// RS-DIAG-01: actual pinned SDK + supplier Host + MiMo SSE, entirely synthetic IO.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,mkdir,readdir,cp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {url as inspectorUrl} from 'node:inspector';
import {watchToolAdmission} from './tool-admission-probe.mjs';
import {createDiagnosticGate} from './diagnostic-gate.mjs';

const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;
assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=path=>import(pathToFileURL(join(root,path)).href);
const {SessionHost}=await load('dist/agent/session-host.js');
const {FileBudgetStore}=await load('dist/agent/budget-store.js');
const {MIMO_FLASH}=await load('dist/agent/model.js');
const {createPiTransport,RuntimeFault}=await load('node_modules/pi-agent-runtime/dist/index.js');
const sdkRoot=join(root,'node_modules/pi-agent-runtime');
const model={...MIMO_FLASH,input:['text','image']};
const pages=[{title:'合成第一页',page_type:'cover'},{title:'合成第二页',page_type:'content'}];
const call=(id,name,args)=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});
const write=id=>call(id,'write',{path:'must-not-write.txt',content:'synthetic-effect'});
const outline=id=>call(id,'propose_outline',{pages,questions:[]});
// Any accidental use of the default network must fail, including an unexpected recovery path.
globalThis.fetch=async()=>{throw Error('RS_DIAG_UNEXPECTED_NETWORK');};

async function fixture(t,replies,{neutral=false,diagnostic=false}={}) {
  const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-tool-admission-')));
  await writeFile(join(dir,'materials.json'),'[]');
  let count=0,host;const receipts=[],requests=[];
  const probe=await watchToolAdmission({sdkRoot});
  const rawTransport=neutral?async()=>({content:replies[count++].map(c=>({kind:'tool',id:c.id,name:c.function.name,arguments:JSON.parse(c.function.arguments)})),stop:'tools',usage:{inputTokens:2,outputTokens:3}}):createPiTransport({model,apiKey:'synthetic-not-a-provider-key',fetch:async(_input,init)=>{
    const body=JSON.parse(init.body);requests.push(body);assert.equal(body.model,model.id);
    assert(body.tools.some(tool=>tool.function.name==='propose_outline'));
    const calls=replies[count++];assert(calls,'unexpected extra model request');
    const chunk={id:'synthetic-response',object:'chat.completion.chunk',created:1,model:model.id,
      choices:[{index:0,delta:calls.length?{role:'assistant',tool_calls:calls.map((c,index)=>({...c,index}))}:{role:'assistant',content:'合成完成'},finish_reason:calls.length?'tool_calls':'stop'}],
      usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}};
    return new Response('data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n',{status:200,headers:{'content-type':'text/event-stream'}});
  }});
  const diagnosticGate=diagnostic?createDiagnosticGate({stopFault:()=>new RuntimeFault('AUTHORITY_REQUIRED')}):null;
  const transport=diagnosticGate?diagnosticGate.wrap(rawTransport):rawTransport;
  host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model,transport,
    builtin:{authorize:async()=>true,...(diagnostic?{beforeRun:async()=> '11111111-1111-4111-a111-111111111111',afterRun:async(_id,receipt)=>{receipts.push(receipt);}}:{})}});
  t.after(async()=>{
    await host.waitForIdle();await host.close();await probe.close();
    const evidence=process.env.JUANERAI_REPORT_STUDIO_DIAG_EVIDENCE;
    if(evidence){
      const out=join(evidence,t.name.replace(/[^A-Za-z0-9_-]/g,'_'));await mkdir(out,{recursive:true});
      await cp(dir,join(out,'project'),{recursive:true,errorOnExist:true,force:false});
      const files=[];
      for(const entry of await readdir(dir,{recursive:true,withFileTypes:true}))if(entry.isFile()){
        const path=join(entry.parentPath,entry.name).slice(dir.length+1),bytes=await readFile(join(dir,path));
        assert.deepEqual(await readFile(join(out,'project',path)),bytes);
        files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
      }
      await writeFile(join(out,'result.json'),JSON.stringify({synthetic_only:true,network:neutral?'neutral reply; default fetch denied':'injected SSE; default fetch denied',events:probe.events,requests:count,usage:new FileBudgetStore(join(dir,'agent-budget.json')).usageOf(host.taskId),files},null,2)+'\n');
    }
    await rm(dir,{recursive:true,force:true});
  });
  return {dir,host,probe,receipts,requests,get count(){return count;}};
}
async function run(f){await f.host.send('只使用合成材料进行离线验证');const result=await f.host.currentResult();await f.host.waitForIdle();await new Promise(resolve=>setImmediate(resolve));return result;}
async function rejected(f,branch,requests=1,tools=0){
  const result=await run(f);assert.equal(result.status,'failed');assert.equal(result.reason,'INVALID_TOOL');
  assert.equal(f.count,requests);assert.equal(result.usageKnown,true);
  const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);
  assert.equal(usage.modelCalls,requests);assert.equal(usage.toolCalls,tools);assert.equal(usage.inputTokens,2*requests);assert.equal(usage.outputTokens,3*requests);assert.equal(usage.reservedOutputTokens,0);
  await assert.rejects(()=>readFile(join(f.dir,'must-not-write.txt')),{code:'ENOENT'});
  await assert.rejects(()=>readFile(join(f.dir,'outline.json')),{code:'ENOENT'});
  assert.deepEqual(f.probe.events.map(e=>e.branch),[branch],'must record the actual SDK rejection branch');
  assert(f.probe.events.every(e=>Object.keys(e).sort().join(',')==='branch,line,schema_version,sdk_sha256'));
}
test('RS-DIAG-01 undeclared tool rejects the complete batch before write',async t=>{
  const f=await fixture(t,[[write('synthetic-write'),call('synthetic-name','functions.propose_outline',{pages})]]);
  await rejected(f,'undeclared_tool_name');
});
test('RS-DIAG-01 invalid outline arguments reject the complete batch before write',async t=>{
  const f=await fixture(t,[[write('synthetic-write'),call('synthetic-args','propose_outline',{pages:'not-an-array'})]]);
  await rejected(f,'arguments_schema');
});
test('RS-DIAG-01 duplicate ID in the same neutral batch rejects before any write',async t=>{
  const f=await fixture(t,[[write('synthetic-same-id'),outline('synthetic-same-id')]],{neutral:true});
  await rejected(f,'duplicate_call_id');
});
test('RS-DIAG-01 duplicate ID across turns preserves the completed read but rejects the new outline',async t=>{
  const f=await fixture(t,[[call('synthetic-read','read',{path:'materials.json'})],[outline('synthetic-read')]]);
  await rejected(f,'duplicate_call_id',2,1);
});
test('RS-DIAG-01 valid MiMo serialized outline succeeds without a diagnostic rejection',async t=>{
  const f=await fixture(t,[[outline('synthetic-valid')],[]]);
  assert.equal((await run(f)).status,'succeeded');assert.equal(f.count,2);
  assert.equal(JSON.parse(await readFile(join(f.dir,'outline.json'),'utf8')).current.pages.length,2);
  assert.deepEqual(f.probe.events,[]);
});
test('RS-DIAG-01 a guessed skill path is a soft read failure, not an INVALID_TOOL schema rejection',async t=>{
  const f=await fixture(t,[[call('synthetic-guessed-path','read',{path:'./Xanthil.app/Contents/Resources/report-studio/studio/assets/skills/ppt/SKILL.md'})],[]]);
  assert.equal((await run(f)).status,'succeeded');assert.equal(f.count,2);
  const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);
  assert.equal(usage.toolCalls,1);assert.equal(usage.reservedOutputTokens,0);assert.deepEqual(f.probe.events,[]);
  let observed=false;
  for(const entry of await readdir(join(f.dir,'session'),{recursive:true,withFileTypes:true}))if(entry.isFile()){
    for(const line of (await readFile(join(entry.parentPath,entry.name),'utf8')).trim().split('\n')){
      const parsed=JSON.parse(line);
      for(const row of Array.isArray(parsed)?parsed:[parsed])if(row.message?.role==='toolResult'){
        const text=row.message.content.filter(c=>c.type==='text').map(c=>c.text).join('');
        if(text.includes('Host file operation failed'))observed=true;
      }
    }
  }
  assert.equal(observed,true,'the failed project-relative read reaches the existing soft tool error path');
});
test('RS-SKILL-01 actual SessionHost reads the exact bundled skill for the next model turn',async t=>{
  const path=join(root,'assets/skills/ppt/SKILL.md'),body=await readFile(path,'utf8');
  const f=await fixture(t,[[call('synthetic-fixed-skill','read',{path})],[]]);
  assert.equal((await run(f)).status,'succeeded');assert.equal(f.count,2);
  const outputs=[];
  for(const entry of await readdir(join(f.dir,'session'),{recursive:true,withFileTypes:true}))if(entry.isFile()){
    for(const line of (await readFile(join(entry.parentPath,entry.name),'utf8')).trim().split('\n')){
      const parsed=JSON.parse(line);
      for(const row of Array.isArray(parsed)?parsed:[parsed])if(row.message?.role==='toolResult')outputs.push(row.message.content.filter(c=>c.type==='text').map(c=>c.text).join(''));
    }
  }
  assert(outputs.some(text=>text.includes(body.trimEnd())),'native read must return the fixed skill bytes instead of a soft file failure');
  assert(f.requests.at(-1).messages.some(message=>message.role==='tool'&&typeof message.content==='string'&&message.content.includes(body.trimEnd())),'the subsequent MiMo transport receives the real skill text');
  assert.deepEqual(f.probe.events,[]);
});
for(const [name,args]of [
  ['missing required pages',{}],
  ['fewer than two pages',{pages:[pages[0]]}],
  ['more than twenty-four pages',{pages:Array.from({length:25},()=>pages[0])}],
  ['missing required page title',{pages:[{page_type:'cover'},pages[1]]}],
])test('RS-DIAG-01 schema rejects '+name,async t=>{
  const f=await fixture(t,[[write('synthetic-write'),call('synthetic-schema','propose_outline',args)]]);
  await rejected(f,'arguments_schema');
});
test('RS-DIAG-01 a new run may reuse a past ID without resetting its session or ledger',async t=>{
  const f=await fixture(t,[[outline('synthetic-reused')],[],[outline('synthetic-reused')],[]]);
  assert.equal((await run(f)).status,'succeeded');const session=f.host.sessionId;
  assert.equal((await run(f)).status,'succeeded');assert.equal(f.host.sessionId,session);
  const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);
  assert.equal(usage.modelCalls,4);assert.equal(usage.toolCalls,2);assert.equal(usage.reservedOutputTokens,0);
  assert.deepEqual(f.probe.events,[]);
});
test('RS-DIAG-01 diagnostics retain only the fixed branch and location, without argument values or an inspector port',async t=>{
  assert.equal(inspectorUrl(),undefined);
  const marker='synthetic-private-value-MUST-NOT-LEAK';
  const f=await fixture(t,[[call('synthetic-privacy','propose_outline',{pages:marker})]]);
  await rejected(f,'arguments_schema');
  assert(!JSON.stringify(f.probe.events).includes(marker));assert.equal(inspectorUrl(),undefined);
});
test('RS-DIAG-01 unrecognized SDK bytes fail before attaching a classifier',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'studio-diag-sdk-mismatch-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));await mkdir(join(dir,'dist'));
  await writeFile(join(dir,'dist/pi-adapter.js'),'synthetic unknown SDK bytes');
  await assert.rejects(()=>watchToolAdmission({sdkRoot:dir}),/RS_DIAG_SDK_MISMATCH/);
  assert.equal(inspectorUrl(),undefined);
});
for(const [name,tool]of [
  ['empty call ID',outline('')],
  ['non-object arguments',call('synthetic-null-args','propose_outline',null)],
])test('RS-DIAG-01 '+name+' fails the earlier reply-shape guard, not INVALID_TOOL',async t=>{
  const f=await fixture(t,[[tool]],{neutral:true}),result=await run(f);
  assert.equal(result.status,'failed');assert.equal(result.reason,'INVALID_OUTPUT');assert.equal(f.count,1);
  assert.deepEqual(f.probe.events,[]);
  await assert.rejects(()=>readFile(join(f.dir,'outline.json')),{code:'ENOENT'});
});

const diagnosticRequest=()=>({model,messages:[{role:'system',text:'synthetic',tools:['read','propose_outline','write'].map(name=>({name,description:'synthetic',parameters:{type:'object'}}))}],maxOutputTokens:16384,signal:new AbortController().signal});
const complete={content:[{kind:'text',text:'synthetic'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};
function gate(now=()=>0){return createDiagnosticGate({now,stopFault:()=>Error('RS_DIAG_SCOPE_STOP')});}
test('RS-DIAG-01 diagnostic gate permits at most six transport dispatches across wrappers',async()=>{
  const g=gate();let calls=0;
  for(let i=0;i<6;i++)await g.wrap(async()=>{calls++;return complete;})(diagnosticRequest());
  await assert.rejects(()=>g.wrap(async()=>{calls++;return complete;})(diagnosticRequest()),/RS_DIAG_SCOPE_STOP/);
  assert.equal(calls,6);assert.equal(g.summary().forwarded,6);
});
test('RS-DIAG-01 diagnostic gate never dispatches MiniMax or the image purpose',async()=>{
  let calls=0;
  for(const changed of [{...model,provider:'minimax-cn'}, {...model,maxOutputTokens:2048}]){
    const g=gate();await assert.rejects(()=>g.wrap(async()=>{calls++;return complete;})({...diagnosticRequest(),model:changed}),/RS_DIAG_SCOPE_STOP/);
  }
  assert.equal(calls,0);
});
test('RS-DIAG-01 diagnostic deadline stops later dispatches after ten minutes',async()=>{
  let time=0,calls=0;const g=gate(()=>time),send=g.wrap(async()=>{calls++;return complete;});
  await send(diagnosticRequest());time=600000;await assert.rejects(()=>send(diagnosticRequest()),/RS_DIAG_SCOPE_STOP/);assert.equal(calls,1);
});
test('RS-DIAG-01 diagnostic gate stops declared out-of-scope effects without repairing unknown names or bad arguments',async()=>{
  const g=gate(),request=diagnosticRequest(),outside={...complete,stop:'tools',content:[{kind:'tool',id:'synthetic-write',name:'write',arguments:{path:'x',content:'synthetic'}}]};
  await assert.rejects(()=>g.wrap(async()=>outside)(request),/RS_DIAG_SCOPE_STOP/);assert.equal(g.summary().stopped,true);
  for(const c of [{kind:'tool',id:'synthetic-unknown',name:'functions.propose_outline',arguments:{}},{kind:'tool',id:'synthetic-bad-args',name:'propose_outline',arguments:{pages:'bad'}}]){
    const reply={...complete,stop:'tools',content:[c]},isolated=gate();assert.equal(await isolated.wrap(async()=>reply)(request),reply,'original SDK receives the unchanged reply and owns its rejection');
  }
});
test('RS-SKILL-01 diagnostic stop metadata is closed, private and preserves the first reason',async()=>{
  const g=gate(),secret='NEVER_RETAIN_PRIVATE_ARGUMENT_OR_ID',request=diagnosticRequest();
  await assert.rejects(()=>g.wrap(async()=>({...complete,content:[{kind:'tool',id:secret,name:'write',arguments:{path:secret,content:secret}}]}))(request));
  const expected={forwarded:1,stopped:true,stop:{reason:'tool_outside_scope',phase:'reply',dispatch:1,tool:'write'}};
  assert.deepEqual(g.summary(),expected);
  await assert.rejects(()=>g.wrap(async()=>complete)(request));assert.deepEqual(g.summary(),expected);
  const snapshot=g.summary();if(snapshot.stop)snapshot.stop.reason=secret;
  assert.deepEqual(g.summary(),expected,'callers cannot change diagnostic state');
  assert(!JSON.stringify(g.summary()).includes(secret));
  const other=gate(),unknown=secret+'_unknown';request.messages[0].tools.push({name:unknown});
  await assert.rejects(()=>other.wrap(async()=>({...complete,content:[{kind:'tool',id:secret,name:unknown,arguments:{value:secret}}]}))(request));
  assert.equal(other.summary().stop.tool,'other');assert(!JSON.stringify(other.summary()).includes(secret));
});
test('RS-SKILL-01 diagnostic stop reasons distinguish cancellation, model, deadline and dispatch limit',async()=>{
  const stopped=gate(),abort=new AbortController();abort.abort('private abort cause');
  await assert.rejects(()=>stopped.wrap(async()=>complete)({...diagnosticRequest(),signal:abort.signal}));
  assert.deepEqual(stopped.summary().stop,{reason:'cancelled',phase:'request',dispatch:0,tool:null});
  const modelGate=gate();await assert.rejects(()=>modelGate.wrap(async()=>complete)({...diagnosticRequest(),model:{...model,provider:'private invalid provider'}}));
  assert.equal(modelGate.summary().stop.reason,'model_outside_scope');
  let time=0;const deadline=gate(()=>time),send=deadline.wrap(async()=>complete);await send(diagnosticRequest());time=600000;await assert.rejects(()=>send(diagnosticRequest()));assert.equal(deadline.summary().stop.reason,'deadline');
  const limited=gate(),forward=limited.wrap(async()=>complete);for(let i=0;i<6;i++)await forward(diagnosticRequest());await assert.rejects(()=>forward(diagnosticRequest()));assert.equal(limited.summary().stop.reason,'dispatch_limit');assert.equal(limited.summary().stop.dispatch,6);
});
test('RS-SKILL-01 diagnostic metadata never retains transport errors and stops late replies',async()=>{
  const marker='NEVER_RETAIN_TRANSPORT_PRIVATE_TEXT';
  const failed=gate(),error=Error(marker);await assert.rejects(()=>failed.wrap(async()=>{throw error;})(diagnosticRequest()),e=>e===error);
  assert.equal(failed.summary().stop.reason,'transport_failure');assert(!JSON.stringify(failed.summary()).includes(marker));
  let time=0;const late=gate(()=>time);await assert.rejects(()=>late.wrap(async()=>{time=600001;return complete;})(diagnosticRequest()));assert.equal(late.summary().stop.reason,'deadline');
  for(const name of ['write','edit','bash','render_deck','qa_deck','export_deck','look_page']){
    const g=gate(),request=diagnosticRequest();request.messages[0].tools.push({name});
    await assert.rejects(()=>g.wrap(async()=>({...complete,content:[{kind:'tool',name,id:marker,arguments:{value:marker}}]}))(request));
    assert.equal(g.summary().stop.tool,name);assert(!JSON.stringify(g.summary()).includes(marker));
  }
});
test('RS-DIAG-01 scoped diagnostic preserves the original SDK unknown-name branch',async t=>{
  const f=await fixture(t,[[call('synthetic-name','functions.propose_outline',{pages})]],{diagnostic:true});
  await rejected(f,'undeclared_tool_name');
});
test('RS-DIAG-01 scoped diagnostic denies a declared write before effects and retains unresolved SDK usage',async t=>{
  const f=await fixture(t,[[write('synthetic-outside')]],{diagnostic:true}),result=await run(f);
  assert.equal(result.reason,'AUTHORITY_REQUIRED');assert.equal(result.usageKnown,true);assert.equal(f.count,1);
  const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);
  assert.equal(usage.toolCalls,0);assert(usage.reservedOutputTokens>0);
  assert.equal(f.receipts.at(-1).operation_usage_known,false,'business consumption must use the durable reservation instead of trusting SDK usageKnown');
  await assert.rejects(()=>readFile(join(f.dir,'must-not-write.txt')),{code:'ENOENT'});assert.deepEqual(f.probe.events,[]);
});
test('RS-DIAG-01 six real-SDK dispatches are the boundary; a denied seventh admission is not a seventh wire request or a refund',async t=>{
  const f=await fixture(t,Array.from({length:7},(_,i)=>[call('synthetic-read-'+i,'read',{path:'materials.json'})]),{diagnostic:true});
  const result=await run(f);assert.equal(result.reason,'AUTHORITY_REQUIRED');assert.equal(f.count,6);
  const usage=new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId);
  assert.equal(usage.modelCalls,7);assert.equal(usage.toolCalls,6);assert.equal(usage.inputTokens,12);assert(usage.reservedOutputTokens>0);assert.equal(result.usageKnown,true);assert.equal(f.receipts.at(-1).operation_usage_known,false);assert.deepEqual(f.probe.events,[]);
});
