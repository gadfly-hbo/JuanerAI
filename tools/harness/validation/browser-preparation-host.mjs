/** Host-only causal suite for E03-c. --check is pure fixture/static validation, never sandbox_init.
 * This script is copied with its transitive local source closure into a hash-locked bundle.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {closeSync,existsSync,fstatSync,lstatSync,mkdirSync,openSync,readFileSync,readdirSync,rmSync,rmdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createMemberSourcePreparation} from '../../../adapters/analytics-duckdb/member-source-inspection.ts';
import {createDuckDbPythonDesktopLocalAnalysisExecution} from '../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {browserBindingFixture,browserCandidateFixture} from '../../../tests/fixtures/xanthil-desktop/browser-sources.ts';
import {fixturePlan} from '../../../tests/fixtures/xanthil-desktop/member-analysis.ts';
import {fixedCases,fixedPayload,fixedPreparationSources,unixDirectory} from '../../../tests/fixtures/xanthil-desktop/preparation-isolation-payloads.mjs';
const self=fileURLToPath(import.meta.url),bin=process.env.JUANERAI_TOOLCHAIN_BIN;
assert.ok(bin&&bin.startsWith('/'),'explicit fixed toolchain');
const python=join(bin,'python3'),sha=x=>createHash('sha256').update(x).digest('hex');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const hashFile=p=>({path:p,bytes:readFileSync(p).length,sha256:sha(readFileSync(p))});
const sources=fixedPreparationSources;
const observedPython=()=>{
 const r=spawnSync(python,['-I','-B','-c','import sys; print(".".join(map(str,sys.version_info[:3])))'],{env:{PATH:'/usr/bin:/bin'},timeout:5000,encoding:'utf8'});
 assert.equal(r.status,0);assert.equal(r.stdout.trim(),'3.14.4');return r.stdout.trim();
};
const preparationRequest=(name,root,signal)=>{const code=fixedPayload(name);return {version:'1.0',sources:sources(),code,code_sha256:sha(code),run_directory:root,cancellation_signal:signal};};
const adapter=()=>createMemberSourcePreparation({pythonExecutable:python,pythonVersion:'3.14.4'});
const events=p=>existsSync(p)?readFileSync(p,'utf8').split('\n').flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}}):[];
const alive=pid=>{try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;throw e;}};
async function until(predicate,ms){const end=Date.now()+ms;while(Date.now()<end){const value=predicate();if(value)return value;await pause(10);}throw Error('bounded observation timeout');}

async function oneCase(name,caseRoot){
 assert.ok(Object.hasOwn(fixedCases,name));
 if(name==='inherited_fd'){assert.ok(fstatSync(3).isFile());save(join(caseRoot,'inherited-canary.json'),{fd:3,sha256:sha(readFileSync(3))});}
 const controller=new AbortController(),request=preparationRequest(name,join(caseRoot,'execution'),controller.signal);
 const cleanSources=request.sources.map(({sha256,...s})=>s);
 let monitor;
 if(['cancel','late'].includes(name))monitor=setInterval(()=>{
  if(events(join(request.run_directory,'payload.stdout')).some(e=>e.event==='attempt')){controller.abort();clearInterval(monitor);}
 },10);
 let result;
 try{
  const executed=await adapter().executePreparation(request);
  let qualification;
  try{qualification=await adapter().qualifySources({sources:cleanSources,bindings:browserBindingFixture(cleanSources),candidate:executed.candidate,cancellation_signal:new AbortController().signal,deadline_seconds:10});}
  catch(error){result={status:'qualification_rejected',code:error.code,receipt:executed.receipt};}
  if(!result){
   assert.deepEqual(executed.candidate.members_bytes,browserCandidateFixture().members_bytes);
   assert.deepEqual(executed.candidate.orders_bytes,browserCandidateFixture().orders_bytes);
   result={status:'qualified',receipt:executed.receipt,qualification};
   if(name==='health'){
    const analysis=createDuckDbPythonDesktopLocalAnalysisExecution({duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2',pythonExecutable:python,pythonVersion:'3.14.4'});
    const plan=fixturePlan(executed.candidate),implementation=await analysis.describeImplementation({execution_plan:plan});
    const input={run_id:'01991a00-0000-7000-8000-000000000051',expected_code_identity:implementation.code_identity,contract:{...plan.parameters,schema_version:'2.0',execution_plan:plan},snapshot:executed.candidate,group_pseudonym_map:{North:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',South:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},cancellation_signal:new AbortController().signal,deadline_seconds:30};
    save(join(caseRoot,'analysis-input.json'),{...input,cancellation_signal:'not_serialized',snapshot:{members_base64:Buffer.from(input.snapshot.members_bytes).toString('base64'),orders_base64:Buffer.from(input.snapshot.orders_bytes).toString('base64')}});
    const primary=await analysis.calculate(input),independent=await analysis.verify(input);
    assert.deepEqual(primary.result,independent.result);assert.equal(primary.result.m2.status,'not_selected');
    assert.equal(primary.result.periods.comparison.repeat_revenue_fen,'2000');assert.equal(primary.result.periods.current.repeat_revenue_fen,'3000');
    result.analysis={plan,primary,independent};
   }
  }
 }catch(error){result={status:'rejected',code:error.code??'CHECK_FAILED',message:String(error.message)};}
 finally{if(monitor)clearInterval(monitor);}
 save(join(caseRoot,'case-result.json'),result);
}

async function suite(runRoot){
 assert.equal(process.platform,'darwin');assert.equal(process.version,'v26.0.0');observedPython();
 mkdirSync(runRoot,{mode:0o700});
 const summary={version:'1.0',status:'RUNNING',started:new Date().toISOString(),node:process.version,python:'3.14.4',runs:[],unix_connections:0,limits:{whole_seconds:150,case_seconds:8,memory_test_allocation_bytes:134217728}};
 let server,active,wholeExpired=false,endpointCreated=false;
 const owned=new Set(),kill=pid=>{if(owned.has(pid))try{process.kill(pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}};
 const terminate=()=>{wholeExpired=true;for(const pid of owned)kill(pid);};
 const timer=setTimeout(terminate,150000);process.on('SIGTERM',terminate);process.on('SIGINT',terminate);
 try{
  // Fixed endpoint, exclusive create. Never remove a pre-existing socket/directory.
  mkdirSync(unixDirectory,{mode:0o700});endpointCreated=true;
  server=createServer(socket=>{summary.unix_connections++;socket.destroy();});
  await new Promise((r,j)=>{server.once('error',j);server.listen(join(unixDirectory,'s'),r);});
  const fixedInputs={sources:sources().map(({bytes,...s})=>({...s,bytes_base64:Buffer.from(bytes).toString('base64')})),payloads:Object.keys(fixedCases).map(name=>({name,code:fixedPayload(name),sha256:sha(fixedPayload(name))})),canary:'TASK_OWNED_CANARY_NOT_A_CREDENTIAL\n',unix_endpoint:join(unixDirectory,'s')};
  if(process.env.JUANERAI_FROZEN_INPUTS)assert.deepEqual(fixedInputs,JSON.parse(readFileSync(process.env.JUANERAI_FROZEN_INPUTS,'utf8')));
  save(join(runRoot,'inputs.json'),fixedInputs);
  for(const name of Object.keys(fixedCases)){
   if(wholeExpired)throw Error('whole-run deadline');
   const root=join(runRoot,name);mkdirSync(root);const execution=join(root,'execution');
   const canary=join(root,'canary.txt');writeFileSync(canary,'TASK_OWNED_CANARY_NOT_A_CREDENTIAL\n',{flag:'wx',mode:0o600});const canaryBefore=hashFile(canary);
   const inherited=name==='inherited_fd'?openSync(canary,'r'):undefined;
   const child=spawn(process.execPath,[self,'--case',name,root],{stdio:inherited===undefined?['ignore','pipe','pipe']:['ignore','pipe','pipe',inherited],env:{PATH:bin+':/usr/bin:/bin',JUANERAI_TOOLCHAIN_BIN:bin,LANG:'en_US.UTF-8'}});
   if(inherited!==undefined)closeSync(inherited);
   active=child;owned.add(child.pid);let stdout='',stderr='',timedOut=false;
   child.stdout.on('data',c=>{stdout+=c;if(stdout.length>65536)kill(child.pid);});child.stderr.on('data',c=>{stderr+=c;if(stderr.length>65536)kill(child.pid);});
   const completion=new Promise((r,j)=>{child.once('error',j);child.once('close',(exit,signal)=>r({exit,signal}));});
   const perCase=setTimeout(()=>{timedOut=true;kill(child.pid);for(const pid of owned)kill(pid);},8000);
   let crashObserved=false;
   const poll=setInterval(()=>{
    for(const e of events(join(execution,'supervision.jsonl'))){if(e.event==='supervisor_ready')owned.add(e.pid);if(e.event==='child_created')owned.add(e.child_pid);}
    if(!crashObserved&&['parent_crash','supervisor_crash'].includes(name)&&events(join(execution,'payload.stdout')).some(e=>e.event==='attempt')){
     crashObserved=true;
     if(name==='parent_crash')kill(child.pid);
     else {const supervisor=events(join(execution,'supervision.jsonl')).find(e=>e.event==='supervisor_ready');assert.ok(supervisor);kill(supervisor.pid);}
    }
   },10);
   const processResult=await completion;clearTimeout(perCase);clearInterval(poll);active=undefined;
   writeFileSync(join(root,'case.stdout'),stdout,{flag:'wx'});writeFileSync(join(root,'case.stderr'),stderr,{flag:'wx'});
   save(join(root,'process.json'),{...processResult,timedOut,crashObserved});
   assert.equal(timedOut,false,'case deadline is a failure, not isolation PASS');
   const audit=events(join(execution,'supervision.jsonl'));
   const created=audit.find(e=>e.event==='child_created'),supervisor=audit.find(e=>e.event==='supervisor_ready');assert.ok(created&&supervisor);
   owned.add(created.child_pid);owned.add(supervisor.pid);
   if(name==='parent_crash')await until(()=>existsSync(join(execution,'outcome.json')),2000);
   await until(()=>!alive(created.child_pid)&&!alive(supervisor.pid),2000);
   owned.delete(created.child_pid);owned.delete(supervisor.pid);owned.delete(child.pid);
   const payload=events(join(execution,'payload.stdout'));
   assert.ok(audit.some(e=>e.event==='policy_installed'),'native policy channel must precede any claims');
   assert.deepEqual(payload[0],{event:'allowed_work_completed',members:2,orders:6});
   if(name!=='health')assert.deepEqual(payload[1],{event:'attempt',case:name},'negative core operation must actually be reached');
   assert.deepEqual(hashFile(canary),canaryBefore);assert.equal(summary.unix_connections,0);
   const request=JSON.parse(readFileSync(join(execution,'request.json'),'utf8'));
   for(const s of request.sources)assert.equal(sha(readFileSync(s.path)),s.sha256);
   assert.equal(request.code_sha256,sha(fixedPayload(name)));
   const outcome=existsSync(join(execution,'outcome.json'))?JSON.parse(readFileSync(join(execution,'outcome.json'),'utf8')):null;
   const result=existsSync(join(root,'case-result.json'))?JSON.parse(readFileSync(join(root,'case-result.json'),'utf8')):null;
   const good=['health','native_read','source_write','inherited_fd','unix_python','unix_native','process_signal'].includes(name);
   if(good){assert.equal(processResult.exit,0);assert.equal(outcome.failure,null);assert.equal(outcome.physical_settled,true);assert.equal(result.status,'qualified');}
   else if(name==='wrong_conversion'){assert.equal(result.status,'qualification_rejected');assert.equal(result.code,'CONVERSION_UNQUALIFIED');}
   else {
    assert.equal(existsSync(join(execution,'unqualified-receipt.json')),false,'no partial/late output receipt');
    if(name==='parent_crash'){assert.equal(crashObserved,true);assert.equal(outcome.failure,'PARENT_CLOSED');assert.equal(result,null);}
    else {assert.equal(result.status,'rejected');if(name==='supervisor_crash')assert.equal(crashObserved,true);}
   }
   if(['native_read','source_write','unix_python','unix_native','process_signal'].includes(name))assert.ok(payload.some(e=>e.event==='denied'&&[1,13].includes(e.errno)));
   if(name==='inherited_fd'){assert.deepEqual(payload.find(e=>e.event==='closed_fds').fds,Array.from({length:29},(_,i)=>i+3));assert.equal(JSON.parse(readFileSync(join(root,'inherited-canary.json'),'utf8')).sha256,canaryBefore.sha256);}
   if(['memory','native_memory'].includes(name)){assert.equal(outcome.failure,'MEMORY_LIMIT');assert.ok(outcome.peak_resident_bytes>96*1024*1024);assert.ok(outcome.peak_resident_bytes<192*1024*1024);}
   if(name==='stream'){assert.equal(outcome.failure,'STREAM_LIMIT');assert.ok(lstatSync(join(execution,'payload.stdout')).size<=65536);}
   if(name==='wall')assert.equal(outcome.failure,'WALL_LIMIT');
   if(name==='cpu'){assert.equal(outcome.failure,'CPU_LIMIT');assert.equal(outcome.exit_code,-9,'trusted CPU monitor killed child ignoring SIGXCPU');assert.ok(outcome.observed_cpu_seconds>=2&&outcome.observed_cpu_seconds<3);assert.ok(outcome.elapsed_seconds<4);assert.ok(outcome.cpu_seconds>=1.8&&outcome.cpu_seconds<3);}
   if(name==='file'){assert.equal(outcome.exit_code,24);assert.ok(payload.some(e=>e.event==='file_limit'&&e.errno===27));assert.ok(lstatSync(join(execution,'output','orders.csv')).size<=1048576);}
   if(name==='child_crash')assert.equal(outcome.exit_code,23);
   if(['cancel','late'].includes(name)){assert.equal(result.code,'CANCELLED');assert.equal(outcome.failure,'PARENT_CLOSED');await pause(250);assert.equal(existsSync(join(execution,'output','late.txt')),false);}
   summary.runs.push({name,status:'PASS',process:processResult,outcome,result_path:result?join(root,'case-result.json'):null,canary:canaryBefore,payload_sha256:request.code_sha256,policy:hashFile(join(execution,'policy.sb'))});
   save(join(root,'assertions.json'),summary.runs.at(-1));console.log(`PASS ${name}`);
  }
  summary.status='FOUR_AREA_SYNTHETIC_SUITE_PASS';
 }catch(error){summary.status='FAIL';summary.error=String(error.stack??error);process.exitCode=1;}
 finally{
  clearTimeout(timer);process.removeListener('SIGTERM',terminate);process.removeListener('SIGINT',terminate);for(const pid of owned)kill(pid);
  if(active)await new Promise(r=>active.once('close',r));
  if(server)await new Promise(r=>server.close(r));
  try {if(endpointCreated){if(existsSync(join(unixDirectory,'s')))rmSync(join(unixDirectory,'s'));if(readdirSync(unixDirectory).length===0)rmdirSync(unixDirectory);}}catch(error){summary.cleanup_error=String(error);summary.status='FAIL';}
  if(owned.size)try{await until(()=>[...owned].every(pid=>!alive(pid)),2000);}catch(error){summary.cleanup_error=String(error);summary.status='FAIL';}
  summary.ended=new Date().toISOString();summary.whole_deadline_exceeded=wholeExpired;
  summary.cleanup={endpoint_absent:!existsSync(unixDirectory),unsettled_owned_pids:[...owned].filter(alive)};
  if(summary.cleanup.unsettled_owned_pids.length)summary.status='FAIL';
  if(summary.status!=='FOUR_AREA_SYNTHETIC_SUITE_PASS')process.exitCode=1;
  save(join(runRoot,'result.json'),summary);console.log(JSON.stringify({status:summary.status,results:join(runRoot,'result.json')}));
 }
}

const [mode,...args]=process.argv.slice(2);
if(mode==='--case')await oneCase(args[0],args[1]);
else if(mode==='--check'){
 observedPython();const codes=Object.keys(fixedCases).map(fixedPayload);
 // Existing bundle directory is a deliberate pre-launch stop, after all product identity checks.
 // No fake executor or policy receipt: this invokes the same request producer/consumer as --case.
 for(const name of Object.keys(fixedCases)){
  await assert.rejects(()=>adapter().executePreparation(preparationRequest(name,dirname(self),new AbortController().signal)),{code:process.platform==='darwin'?'PREPARATION_DIRECTORY_INVALID':'ISOLATION_UNAVAILABLE'});
 };
 const r=spawnSync(python,['-I','-B','-c','import ast,json,sys; [ast.parse(x) for x in json.load(sys.stdin)]; print("fixed payload syntax valid; no execution")'],{input:JSON.stringify(codes),env:{PATH:'/usr/bin:/bin'},encoding:'utf8',timeout:5000});assert.equal(r.status,0,r.stderr);
 const fixtures=sources();assert.equal(fixtures.length,3);assert.deepEqual(browserCandidateFixture().members_bytes.toString(),'member_id,member_group\nm1,North\nm2,South\n');
 console.log(JSON.stringify({status:'STATIC_AND_ACTUAL_ADMISSION_ONLY',policy_executed:false,cases:Object.keys(fixedCases),payloads:codes.map(sha),stdout:r.stdout}));
}else if(mode==='--run'&&args.length===1)await suite(resolve(args[0]));
else throw Error('use --check, or reviewed host --run ABSENT_TASK_RUN_DIRECTORY');
