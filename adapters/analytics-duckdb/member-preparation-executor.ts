import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants,closeSync,fstatSync,lstatSync,mkdirSync,openSync,readFileSync,readdirSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {PreparationContext} from '../../packages/ports/member-preparation.ts';
import {membershipRecord,membershipUuid} from '../../packages/product-core/member-analysis.ts';

const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
const failureEvidence=new WeakMap<Error,{physical_status:'not_started'|'settled'|'unknown';syntax_rejected?:true;operation_context:Readonly<{task_id:string;operation_id:string;execution_id:string;epoch:number}>|null}>();
/** Only locally issued Adapter errors carry trusted settlement; plain caller/model objects do not. */
export function describePreparationFailure(error:unknown){return error instanceof Error&&failureEvidence.has(error)?structuredClone(failureEvidence.get(error)!):null;}
const successEvidence=new WeakMap<object,{operation_context:PreparationContext|null;receipt_sha256:string}>();
export function describePreparationSuccess(result:unknown){return result!==null&&typeof result==='object'&&successEvidence.has(result)?structuredClone(successEvidence.get(result)!):null;}
const helper=fileURLToPath(new URL('./member-preparation-supervisor.py',import.meta.url));

/** Untrusted output admission is separate from isolation and independent conversion qualification. */
function readFixedOutputs(directory:string,identity:{dev:number;ino:number},expected:readonly string[]){
 const dir=lstatSync(directory);if(!dir.isDirectory()||dir.isSymbolicLink()||dir.dev!==identity.dev||dir.ino!==identity.ino)fail('PREPARATION_OUTPUT_INVALID');
 const names=readdirSync(directory).sort();if(JSON.stringify(names)!==JSON.stringify([...expected].sort()))fail('PREPARATION_OUTPUT_INVALID');
 const read=(name:string)=>{let fd:number|undefined;try{
  fd=openSync(join(directory,name),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const s=fstatSync(fd);
  if(!s.isFile()||s.nlink!==1||s.size<1||s.size>1048576)fail('PREPARATION_OUTPUT_INVALID');
  const bytes=readFileSync(fd),after=fstatSync(fd);if(bytes.length!==s.size||after.size!==s.size||after.mtimeMs!==s.mtimeMs||after.ino!==s.ino)fail('PREPARATION_OUTPUT_INVALID');return bytes;
 }catch{fail('PREPARATION_OUTPUT_INVALID');}finally{if(fd!==undefined)closeSync(fd);}};
 return Object.fromEntries(expected.map(name=>[name,read(name)]));
}

export function readPreparationOutputs(directory:string,identity:{dev:number;ino:number}){
 const files=readFixedOutputs(directory,identity,['members.csv','orders.csv']);
 return {members_bytes:files['members.csv']!,orders_bytes:files['orders.csv']!};
}
export function readAnalysisCodeOutput(directory:string,identity:{dev:number;ino:number}){
 const bytes=readFixedOutputs(directory,identity,['result.json'])['result.json']!;
 try{return {bytes,value:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as unknown};}catch{fail('PREPARATION_OUTPUT_INVALID');}
}
type OutputContract<T>={read:(directory:string,identity:{dev:number;ino:number})=>T;describe:(candidate:T)=>Record<string,{sha256:string;byte_length:number}>;diagnostics?:boolean};
/** One isolation/settlement mechanism; output contracts are selected only by the Profile. */
function createControlledExecutor<T>(pythonExecutable:string,pythonVersion:string,output:OutputContract<T>,formats:readonly string[]=['csv','xlsx']){return async(input:unknown)=>{
 const physical:{status:'not_started'|'settled'|'unknown';syntax_rejected?:true}={status:'not_started'};
 let operation_context:Readonly<{task_id:string;operation_id:string;execution_id:string;epoch:number}>|null=null;
 try {
 const hasContext=!!input&&typeof input==='object'&&Object.hasOwn(input,'operation_context');
 const x=membershipRecord(input,['version','sources','code','code_sha256','run_directory','cancellation_signal',...(hasContext?['operation_context']:[])]);
 if(hasContext){const c=membershipRecord(x.operation_context,['task_id','operation_id','execution_id','epoch']);if(!membershipUuid(c.task_id)||!membershipUuid(c.operation_id)||!membershipUuid(c.execution_id)||!Number.isSafeInteger(c.epoch)||Number(c.epoch)<0)fail('PREPARATION_IDENTITY_INVALID');operation_context={task_id:c.task_id,operation_id:c.operation_id,execution_id:c.execution_id,epoch:Number(c.epoch)};}
 if(!(x.cancellation_signal instanceof AbortSignal))fail('PREPARATION_IDENTITY_INVALID');
 const signal=x.cancellation_signal;if(signal.aborted)fail('CANCELLED');
 if(x.version!=='1.0'||typeof x.code!=='string'||Buffer.byteLength(x.code)>65536||!x.code||hash(x.code)!==x.code_sha256||typeof x.run_directory!=='string'||!isAbsolute(x.run_directory)||!Array.isArray(x.sources)||x.sources.length<1||x.sources.length>32)fail('PREPARATION_IDENTITY_INVALID');
 const code=x.code,root=x.run_directory,ids=new Set<string>();let total=0;
 const sources=x.sources.map(value=>{
  const s=membershipRecord(value,['source_id','display_name','format','bytes','sha256']);
  if(!membershipUuid(s.source_id)||ids.has(s.source_id)||!formats.includes(String(s.format))||typeof s.display_name!=='string'||!(s.bytes instanceof Uint8Array)||!s.bytes.length||s.bytes.length>8*1024*1024||hash(s.bytes)!==s.sha256)fail('PREPARATION_IDENTITY_INVALID');
  ids.add(s.source_id);const bytes=Buffer.from(s.bytes);total+=bytes.length;return {source_id:s.source_id,format:String(s.format),bytes,sha256:hash(bytes)};
 });
 if(total>32*1024*1024)fail('PREPARATION_IDENTITY_INVALID');
 if(process.platform!=='darwin')fail('ISOLATION_UNAVAILABLE');
 // Reject symlinked ancestors and reuse of old runs before any payload is possible.
 try{if(realpathSync(dirname(root))!==dirname(root))fail('PREPARATION_DIRECTORY_INVALID');mkdirSync(root,{mode:0o700});}catch{fail('PREPARATION_DIRECTORY_INVALID');}
 const inputDir=join(root,'input'),outputDir=join(root,'output');mkdirSync(inputDir,{mode:0o700});mkdirSync(outputDir,{mode:0o700});
 const outputIdentity=lstatSync(outputDir);
 const snapshots=sources.map((s,i)=>{const path=join(inputDir,`${i}.${s.format}`);writeFileSync(path,s.bytes,{flag:'wx',mode:0o400});return {source_id:s.source_id,path,sha256:s.sha256,byte_length:s.bytes.length};});
 writeFileSync(join(root,'payload.py'),code,{flag:'wx',mode:0o400});
 const request={version:'1.0',...(output.diagnostics?{analysis_diagnostics:true}:{}),python_version:pythonVersion,sources:snapshots,code_sha256:hash(code),helper_sha256:hash(readFileSync(helper)),output_directory:outputDir,...(operation_context?{operation_context}:{})};
 writeFileSync(join(root,'request.json'),JSON.stringify(request)+'\n',{flag:'wx',mode:0o400});
 await new Promise<void>((resolve,reject)=>{
  physical.status='unknown';
  const child=spawn(pythonExecutable,['-I','-B',helper,root],{stdio:['pipe','pipe','pipe'],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'}});
  let failure:string|undefined,payloadPid:number|undefined,compileRejected=false,protocol='',diagnostics='',closed=false;
  const killPayload=()=>{if(payloadPid!==undefined)try{process.kill(payloadPid,'SIGKILL');}catch{/* absence is checked by supervisor in normal settlement */}};
  const abort=()=>{failure??='CANCELLED';child.stdin.end();};
  const timer=setTimeout(()=>{failure??='PREPARATION_SUPERVISOR_TIMEOUT';killPayload();child.kill('SIGKILL');},8000);
  child.stdin.on('error',()=>{});signal.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',(data:Buffer)=>{
   protocol+=data.toString();if(protocol.length>16384){failure='PREPARATION_PROTOCOL_INVALID';killPayload();child.kill('SIGKILL');return;}
   let end:number;while((end=protocol.indexOf('\n'))>=0){const line=protocol.slice(0,end);protocol=protocol.slice(end+1);try{
    const e=JSON.parse(line);if(e.event==='compile_rejected'&&Object.keys(e).length===1&&!compileRejected&&payloadPid===undefined){compileRejected=true;physical.syntax_rejected=true;continue;}if(compileRejected)throw Error();if(e.event!=='child_created'||payloadPid!==undefined||!Number.isSafeInteger(e.pid)||e.pid<2)throw Error();payloadPid=e.pid;
    if(failure||signal.aborted)child.stdin.end();else child.stdin.write('go\n');
   }catch{failure='PREPARATION_PROTOCOL_INVALID';killPayload();child.kill('SIGKILL');}}
  });
  child.stderr.on('data',(data:Buffer)=>{if(diagnostics.length<65536)diagnostics+=data.toString().slice(0,65536-diagnostics.length);});
  child.on('error',()=>{failure??='ISOLATION_UNAVAILABLE';});
  child.on('close',(exit,termination)=>{
   closed=true;clearTimeout(timer);signal.removeEventListener('abort',abort);child.stdin.destroy();
   writeFileSync(join(root,'supervisor-process.json'),JSON.stringify({exit,signal:termination,failure,payload_pid:payloadPid,stderr:diagnostics})+'\n',{flag:'wx'});
   let settled=false;try{const result=JSON.parse(readFileSync(join(root,'outcome.json'),'utf8'));settled=payloadPid!==undefined&&result.physical_settled===true&&result.child_pid===payloadPid;}catch{/* abnormal supervisor exit remains unknown */}
   if(settled)physical.status='settled';else if(child.pid===undefined||compileRejected&&payloadPid===undefined&&exit===65&&termination===null&&!failure&&!protocol.trim())physical.status='not_started';
   if(exit!==0||failure){if(!settled)killPayload();reject(Object.assign(new Error(failure??(exit===78?'ISOLATION_UNAVAILABLE':'PREPARATION_EXECUTION_FAILED')),{code:failure??(exit===78?'ISOLATION_UNAVAILABLE':'PREPARATION_EXECUTION_FAILED')}));}else resolve();
  });
  if(signal.aborted&&!closed)abort();
 });
 if(signal.aborted)fail('CANCELLED');
 const outcome=JSON.parse(readFileSync(join(root,'outcome.json'),'utf8'));

 if(physical.status!=='settled'||outcome.version!=='1.0'||outcome.status!=='exited'||outcome.exit_code!==0||outcome.physical_settled!==true||outcome.policy_installed!==true||outcome.failure!==null)fail('PREPARATION_EXECUTION_FAILED');
 for(const s of snapshots)if(hash(readFileSync(s.path))!==s.sha256)fail('PREPARATION_SOURCE_CHANGED');
 const candidate=output.read(outputDir,outputIdentity);
 const receipt={version:'1.0',status:'unqualified',...(operation_context?{operation_context}:{}),request_sha256:hash(readFileSync(join(root,'request.json'))),code_sha256:hash(code),helper_sha256:request.helper_sha256,policy_sha256:hash(readFileSync(join(root,'policy.sb'))),outcome_sha256:hash(readFileSync(join(root,'outcome.json'))),sources:snapshots.map(({source_id,sha256,byte_length})=>({source_id,sha256,byte_length})),outputs:output.describe(candidate)};
 writeFileSync(join(root,'unqualified-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o400});
 const result={candidate,receipt};successEvidence.set(result,{operation_context,receipt_sha256:taskHash(receipt)});return result;
 } catch(error) {
  const code=typeof (error as {code?:unknown})?.code==='string'?String((error as {code:string}).code):'PREPARATION_EXECUTION_FAILED';
  let safe_details:unknown;if(output.diagnostics&&physical.status==='settled'){try{const directory=(input as {run_directory:string}).run_directory;const details=JSON.parse(readFileSync(join(directory,'payload.stderr'),'utf8'));if(['NameError','KeyError','TypeError','ValueError','IndexError','PermissionError','SyntaxError','ZeroDivisionError','OtherError'].includes(details.category)&&(!Object.hasOwn(details,'identifier')||/^[A-Za-z_][A-Za-z0-9_]{0,79}$/.test(details.identifier)))safe_details={category:details.category,...(Object.hasOwn(details,'identifier')?{identifier:details.identifier}:{}),...(Number.isInteger(details.payload_line)&&details.payload_line>=1&&details.payload_line<=65536?{payload_line:details.payload_line}:{})};}catch{}}
  const failure=Object.assign(new Error(code),{code,physical_status:physical.status,operation_context,...(safe_details?{safe_details}:{})});
  failureEvidence.set(failure,{physical_status:physical.status,...(physical.status==='not_started'&&physical.syntax_rejected?{syntax_rejected:true as const}:{}),operation_context});throw failure;
 }
};}

export function createMemberPreparationExecutor(pythonExecutable:string,pythonVersion:string){
 return createControlledExecutor(pythonExecutable,pythonVersion,{read:readPreparationOutputs,describe:c=>({members:{sha256:hash(c.members_bytes),byte_length:c.members_bytes.length},orders:{sha256:hash(c.orders_bytes),byte_length:c.orders_bytes.length}})});
}
export function createAnalysisCodeExecutor(pythonExecutable:string,pythonVersion:string){
 return createControlledExecutor(pythonExecutable,pythonVersion,{read:readAnalysisCodeOutput,diagnostics:true,describe:c=>({result:{sha256:hash(c.bytes),byte_length:c.bytes.length}})},['json']);
}
