// AC-OBS-01–04: pinned SDK and real supplier executors; synthetic transport only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createHash} from 'node:crypto';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE,evidence=process.env.JUANERAI_REPORT_STUDIO_OBSERVER_EVIDENCE;
assert(root&&evidence&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=p=>import(pathToFileURL(join(root,p)).href);
const {SessionHost}=await load('dist/agent/session-host.js'),{MIMO_FLASH}=await load('dist/agent/model.js');
const {FileBudgetStore}=await load('dist/agent/budget-store.js');
globalThis.fetch=async()=>{throw Error('UNEXPECTED_NETWORK');};
const call=(name,args)=>({kind:'tool',id:randomUUID(),name,arguments:args});
const read=()=>call('read',{path:'missing.md'}),write=()=>call('write',{path:'late-write.txt',content:'synthetic effect'});
function softFailure(value){
 if(!value||typeof value!=='object')return false;
 if(value.ok===false||value.isError===true)return true;
 if(typeof value.exitCode==='number'&&value.exitCode!==0)return true;
 if(Array.isArray(value))return value.some(softFailure);
 if(value.kind==='text'){try{return softFailure(JSON.parse(value.text));}catch{return false;}}
 return Object.entries(value).some(([k,v])=>k!=='text'&&softFailure(v));
}
async function fixture(t,{observer,batch=[read(),write()],authorize=async()=>true,transport:customTransport}={}){
 const dir=join(evidence,randomUUID());await mkdir(dir,{recursive:true});let requests=0;
 const receipts=[],transport=async input=>{requests++;return customTransport?customTransport(input,requests):{content:requests===1?batch:[{kind:'text',text:'done'}],stop:requests===1?'tools':'complete',usage:{inputTokens:2,outputTokens:3}};};
 const host=await SessionHost.create({projectRoot:dir,skillsDir:join(root,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport,builtin:{authorize,toolObserver:observer,beforeRun:async()=>randomUUID(),afterRun:async(_id,r)=>{receipts.push(r);}}});
 t.after(async()=>{await host.waitForIdle();await host.close();await writeFile(join(dir,'observation.json'),JSON.stringify({synthetic:true,provider_calls:0,requests,receipts},null,2));});
 return {dir,host,receipts,get requests(){return requests;}};
}
async function run(f){await f.host.send('合成离线接缝验证');const result=await f.host.currentResult();await f.host.waitForIdle();await new Promise(r=>setImmediate(r));return result;}
test('AC-OBS-01 soft read failure stops the actual SDK batch before write',async t=>{
 const events=[],f=await fixture(t,{observer:{before(e){events.push('before:'+e.name);},after(e){events.push('after:'+e.name);if(e.outcome.kind==='returned'&&softFailure(e.outcome.value))e.stop();}}});
 await run(f);assert.deepEqual(events,['before:read','after:read']);assert.equal(f.requests,1);
 await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 assert.equal(new FileBudgetStore(join(f.dir,'agent-budget.json')).usageOf(f.host.taskId).toolCalls,1);
});
test('AC-OBS-01 asynchronous before refusal or stop prevents the first effect',async t=>{
 for(const mode of ['throw','stop']){
  const f=await fixture(t,{batch:[write()],observer:{async before(e){await new Promise(r=>setImmediate(r));if(mode==='throw')throw Error('synthetic observer refusal');e.stop();}}});
  await run(f);assert.equal(f.requests,1);await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 }
});
test('AC-OBS-01 after refusal stops before a second actual executor',async t=>{
 let after=0;const f=await fixture(t,{batch:[write(),call('write',{path:'second.txt',content:'forbidden'})],observer:{after(){after++;throw Error('synthetic after failure');}}});
 await run(f);assert.equal(after,1);assert.equal(await readFile(join(f.dir,'late-write.txt'),'utf8'),'synthetic effect');
 await assert.rejects(()=>readFile(join(f.dir,'second.txt')),{code:'ENOENT'});assert.equal(f.requests,1);
});
test('AC-OBS-04 real Bash nonzero is observed and stops the same batch',async t=>{
 let failure=false;const f=await fixture(t,{batch:[call('bash',{command:'exit 7'}),write()],observer:{after(e){if(e.outcome.kind==='returned'&&softFailure(e.outcome.value)){failure=true;e.stop();}}}});
 await run(f);assert(failure);assert.equal(f.requests,1);await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
});
test('AC-OBS-02 observer cannot bypass SDK authority or invalid tool schema',async t=>{
 for(const opts of [{authorize:async effect=>effect!=='code_network',batch:[call('bash',{command:'echo forbidden > late-write.txt'})]},{batch:[call('write',{path:'late-write.txt'})]}]){
  let before=0;const f=await fixture(t,{...opts,observer:{before(){before++;}}});await run(f);assert.equal(before,0);
  await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});
 }
});
test('AC-OBS-02 unchanged declarations and immutable configuration survive same ledger reopen',async t=>{
 const f=await fixture(t,{batch:[write()]});await run(f);
 const file=join(f.dir,'agent-budget.json'),old=JSON.parse(await readFile(file,'utf8')).tasks[f.host.taskId];
 const definitions=JSON.stringify(f.host.defaultTools().map(({execute,...rest})=>rest)),session=f.host.sessionId;await f.host.close();
 let before=0,after=0;const host=await SessionHost.create({projectRoot:f.dir,skillsDir:join(root,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport:async()=>({content:[{kind:'tool',id:randomUUID(),name:'read',arguments:{path:'late-write.txt'}}],stop:'tools',usage:{inputTokens:2,outputTokens:3}}),builtin:{authorize:async()=>true,toolObserver:{before(){before++;},after(e){after++;e.stop();}}}});
 t.after(async()=>{await host.waitForIdle();await host.close();});assert.equal(host.taskId,f.host.taskId);assert.equal(host.sessionId,session);
 assert.equal(JSON.stringify(host.defaultTools().map(({execute,...rest})=>rest)),definitions);
 await run({host});assert.equal(before,1);assert.equal(after,1);const next=JSON.parse(await readFile(file,'utf8')).tasks[host.taskId];
 assert.equal(next.configuration,old.configuration);assert.deepEqual(next.limits,old.limits);assert.equal(next.usage.modelCalls,old.usage.modelCalls+1);assert.equal(next.usage.toolCalls,old.usage.toolCalls+1);assert.equal(next.usage.reservedOutputTokens,old.usage.reservedOutputTokens);
});
test('AC-OBS-04 unknown model reservation is retained and not repaired by adding an observer',async t=>{
 const f=await fixture(t,{transport:async()=>{throw Error('synthetic missing usage');}});await run(f);const file=join(f.dir,'agent-budget.json');
 const old=JSON.parse(await readFile(file,'utf8')).tasks[f.host.taskId];assert(old.usage.reservedOutputTokens>0);await f.host.close();
 const host=await SessionHost.create({projectRoot:f.dir,skillsDir:join(root,'assets/skills/ppt'),model:{...MIMO_FLASH,input:['text','image']},transport:async()=>{throw Error('must not dispatch');},builtin:{authorize:async()=>true,toolObserver:{}}});
 await host.close();const next=JSON.parse(await readFile(file,'utf8')).tasks[f.host.taskId];assert.deepEqual(next,old);
});
test('AC-OBS-03 absent observer preserves soft failure self-correction and free write',async t=>{
 const f=await fixture(t);assert.equal((await run(f)).status,'succeeded');assert.equal(f.requests,2);
 assert.equal(await readFile(join(f.dir,'late-write.txt'),'utf8'),'synthetic effect');
});
test('AC-OBS-01 builtin composition injects observer before SDK executor capture',async t=>{
 const {createBuiltinAgentHosts}=await load('dist/agent/builtin-hosts.js'),{createReportStudioPolicy}=await load('dist/juanerai/policy.js'),{createStudioConfiguration}=await load('dist/juanerai/configuration.js');
 const data=join(evidence,randomUUID()),id='proj_composition';await mkdir(join(data,id),{recursive:true});const keys=new Map();
 const policy=createReportStudioPolicy({dataRoot:data,now:()=>new Date().toISOString()});
 const configuration=createStudioConfiguration({dataRoot:data,newId:randomUUID,canChange:async()=>true,credentials:{async read(p){return keys.get(p)??null;},async save(p,k){keys.set(p,k);},async remove(p){keys.delete(p);}}});
 const boundary=async()=>({recipients_sha256:createHash('sha256').update(JSON.stringify((await configuration.status()).providers)).digest('hex'),materials:[]});let calls=0,observed=0;
 const hosts=createBuiltinAgentHosts({dataRoot:data,skillsDir:join(root,'assets/skills/ppt'),policy,configuration,boundary,projectExists:async p=>p===id,toolObserver(p){assert.equal(p,id);return {after(e){observed++;if(e.outcome.kind==='returned'&&softFailure(e.outcome.value))e.stop();}};},makeTransport:()=>async()=>{calls++;return {content:[read(),write()],stop:'tools',usage:{inputTokens:2,outputTokens:3}};}});
 t.after(()=>hosts.ownerLost());await configuration.save('xiaomi-token-plan-cn','synthetic-only-key',0);policy.setMode(0,true);policy.grant(id,0,{...await boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await boundary());
 const host=await hosts.get(id);await run({host});assert.equal(calls,1);assert.equal(observed,1);await assert.rejects(()=>readFile(join(data,id,'late-write.txt')),{code:'ENOENT'});
 assert.equal(policy.projectOperations(id).at(-1).physical_settled,true);
});
test('AC-OBS-02 original arguments, invocation, result and thrown error retain identity',async()=>{
 const {observeToolExecutions}=await load('dist/agent/builtin-tool-observer.js');
 const args={synthetic:true},invocation={},value={ok:false},error=Error('synthetic executor failure'),signal=new AbortController().signal;
 let stops=0,seen;const tool={name:'synthetic',async execute(a,s,i){assert.equal(a,args);assert.equal(s,signal);assert.equal(i,invocation);assert.equal(this,tool);return value;}};
 assert.equal(observeToolExecutions([tool],undefined,()=>{})[0],tool);
 const [wrapped]=observeToolExecutions([tool],{after(e){seen=e.outcome;}},()=>stops++);
 assert.equal(await wrapped.execute(args,signal,invocation),value);assert.equal(seen.value,value);assert.equal(stops,0);
 const [throwing]=observeToolExecutions([{...tool,async execute(){throw error;}}],{after(e){assert.equal(e.outcome.kind,'threw');assert.equal(e.outcome.error,error);throw Error('secondary observer failure');}},()=>stops++);
 await assert.rejects(()=>throwing.execute(args,signal,invocation),e=>e===error);assert.equal(stops,1);
});
test('AC-OBS-04 abort while awaiting before observer prevents effect after it resumes',async t=>{
 let entered,release;const ready=new Promise(r=>entered=r),hold=new Promise(r=>release=r);t.after(()=>release());
 const f=await fixture(t,{batch:[write()],observer:{async before(){entered();await hold;}}});
 await f.host.send('合成取消');await ready;await f.host.control({kind:'abort'});release();await f.host.currentResult();await f.host.waitForIdle();
 await assert.rejects(()=>readFile(join(f.dir,'late-write.txt')),{code:'ENOENT'});assert.equal(f.requests,1);
});
