import {compileOpenExplorationIR,validateOpenExplorationValue} from '../../packages/product-core/open-analysis-exploration.ts';
import {mkdirSync,writeFileSync,realpathSync,readdirSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {taskHash} from '../../packages/product-core/member-task.ts';
import {compileOpenAnalysisIR,openAnalysisProposal,executeOpenAnalysisIR} from '../../packages/product-core/open-analysis-ir.ts';
import {verifyOpenAnalysisIntegerSum} from './open-analysis-verification.ts';
import type {OpenAnalysisCodeExecution} from '../../packages/ports/open-analysis-code.ts';
import {createAnalysisCodeExecutor,describePreparationFailure,describePreparationSuccess} from './member-preparation-executor.ts';
const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
/** Fixed selected snapshot, fixed output and the existing trusted isolation supervisor. */
export function createLocalOpenAnalysisCodeExecution(config:{projectRoot:string;pythonExecutable:string;pythonVersion:string}):OpenAnalysisCodeExecution{
 const execute=createAnalysisCodeExecutor(config.pythonExecutable,config.pythonVersion);
 const directory=join(config.projectRoot,'.juanerai','open-code');
 const read=(id:string,suffix:string)=>{if(!/^[a-f0-9-]{36}$/.test(id))fail('SAVE_UNCONFIRMED');const path=join(directory,id+suffix+'.json');return existsSync(path)?JSON.parse(readFileSync(path,'utf8')):null;};
 const step=(input:{plan:unknown;inspection:unknown})=>taskHash({plan:input.plan,inspection:input.inspection});
 const run:OpenAnalysisCodeExecution=async input=>{
  if(input.signal.aborted)fail('CANCELLED');
  if(taskHash(input.inspection)!==input.identity.scope_sha256||taskHash(compileOpenAnalysisIR(openAnalysisProposal(input.plan),input.inspection))!==taskHash(input.plan))fail('SOURCE_CHANGED');
  if(typeof input.code!=='string'||!input.code.trim()||Buffer.byteLength(input.code)>65536)fail('CODE_INVALID');
  mkdirSync(directory,{recursive:true,mode:0o700});
  if(realpathSync(directory)!==directory)fail('PREPARATION_DIRECTORY_INVALID');
  const prior=readdirSync(directory).filter(n=>/^[a-f0-9-]+\.json$/.test(n)).map(n=>JSON.parse(readFileSync(join(directory,n),'utf8'))).filter(x=>x.identity?.task_id===input.identity.task_id&&x.identity?.operation_id===input.identity.operation_id),step_sha256=step(input);
  for(const x of prior){const settled=read(x.execution_id,'.settled'),failed=read(x.execution_id,'.failed'),qualified=read(x.execution_id,'.qualified')??read(x.execution_id,'.explored');if(!settled&&(!failed||failed.physical_status==='unknown'))fail('EXECUTION_UNKNOWN');if(!qualified&&x.step_sha256!==step_sha256&&!prior.some(y=>y.step_sha256===x.step_sha256&&(read(y.execution_id,'.qualified')??read(y.execution_id,'.explored'))))fail('CODE_STEP_UNRESOLVED');}
  if(prior.filter(x=>x.step_sha256===step_sha256).length>=2)fail('CODE_CORRECTION_EXHAUSTED');
  const execution_id=randomUUID(),context={task_id:input.identity.task_id,operation_id:input.identity.operation_id,execution_id,epoch:0};
  const snapshot=Buffer.from(JSON.stringify({version:'1.0',plan:input.plan,inspection:input.inspection}));
  const run_directory=join(directory,execution_id),admission=join(directory,execution_id+'.json');
  // Admission survives interruption; missing final settlement remains UNKNOWN on readback.
  writeFileSync(admission,JSON.stringify({version:'1.1',identity:input.identity,execution_id,step_sha256,code_sha256:hash(input.code),snapshot_sha256:hash(snapshot),status:'issued'})+'\n',{flag:'wx',mode:0o600});
  try{
   const result=await execute({version:'1.0',sources:[{source_id:randomUUID(),display_name:'selected-analysis.json',format:'json',bytes:snapshot,sha256:hash(snapshot)}],code:input.code,code_sha256:hash(input.code),run_directory,cancellation_signal:input.signal,operation_context:context});
   const trusted=describePreparationSuccess(result);if(!trusted||taskHash(trusted.operation_context)!==taskHash(context))fail('SAVE_UNCONFIRMED');
   writeFileSync(join(directory,execution_id+'.settled.json'),JSON.stringify({version:'1.0',identity:input.identity,execution_id,status:'unqualified',receipt:result.receipt})+'\n',{flag:'wx',mode:0o600});
   return {value:result.candidate.value,receipt:{...result.receipt,execution_id,step_sha256}};
  }catch(error){
   const physical=describePreparationFailure(error),code=String((error as {code?:unknown})?.code??'LOCAL_OPERATION_FAILED');
   writeFileSync(join(directory,execution_id+'.failed.json'),JSON.stringify({version:'1.0',identity:input.identity,execution_id,code,physical_status:physical?.physical_status??'unknown'})+'\n',{flag:'wx',mode:0o600});
   if(!physical||physical.physical_status==='unknown')fail('EXECUTION_UNKNOWN');throw error;
  }
 };
 run.explore=async input=>{
  if(input.signal.aborted)fail('CANCELLED');if(taskHash(input.inspection)!==input.identity.scope_sha256)fail('SOURCE_CHANGED');
  const bound=compileOpenExplorationIR({goal:input.plan.goal,bindings:input.plan.bindings.map(({source_sha256,...rest})=>{void source_sha256;return rest;})},input.inspection,input.frame);
  if(taskHash(bound.plan)!==taskHash(input.plan))fail('SOURCE_CHANGED');if(typeof input.code!=='string'||!input.code.trim()||Buffer.byteLength(input.code)>65536)fail('CODE_INVALID');
  mkdirSync(directory,{recursive:true,mode:0o700});if(realpathSync(directory)!==directory)fail('PREPARATION_DIRECTORY_INVALID');
  const prior=readdirSync(directory).filter(n=>/^[a-f0-9-]+\.json$/.test(n)).map(n=>JSON.parse(readFileSync(join(directory,n),'utf8'))).filter(x=>x.identity?.task_id===input.identity.task_id&&x.identity?.operation_id===input.identity.operation_id),step_sha256=step(input);
  for(const x of prior){const settled=read(x.execution_id,'.settled'),failed=read(x.execution_id,'.failed'),done=read(x.execution_id,'.qualified')??read(x.execution_id,'.explored');if(!settled&&(!failed||failed.physical_status==='unknown'))fail('EXECUTION_UNKNOWN');if(!done&&x.step_sha256!==step_sha256&&!prior.some(y=>y.step_sha256===x.step_sha256&&(read(y.execution_id,'.qualified')??read(y.execution_id,'.explored'))))fail('CODE_STEP_UNRESOLVED');}
  if(prior.filter(x=>x.step_sha256===step_sha256&&!read(x.execution_id,'.explored')).length>=2)fail('CODE_CORRECTION_EXHAUSTED');const execution_id=randomUUID(),context={task_id:input.identity.task_id,operation_id:input.identity.operation_id,execution_id,epoch:0},snapshot=Buffer.from(JSON.stringify({version:'1.0',plan:input.plan,inspection:bound.snapshot}));
  writeFileSync(join(directory,execution_id+'.json'),JSON.stringify({version:'1.1',mode:'exploration',identity:input.identity,execution_id,step_sha256,code_sha256:hash(input.code),snapshot_sha256:hash(snapshot),status:'issued'})+'\n',{flag:'wx',mode:0o600});
  try{
   const result=await execute({version:'1.0',sources:[{source_id:randomUUID(),display_name:'selected-exploration.json',format:'json',bytes:snapshot,sha256:hash(snapshot)}],code:input.code,code_sha256:hash(input.code),run_directory:join(directory,execution_id),cancellation_signal:input.signal,operation_context:context});
   const trusted=describePreparationSuccess(result);if(!trusted||taskHash(trusted.operation_context)!==taskHash(context))fail('SAVE_UNCONFIRMED');
   writeFileSync(join(directory,execution_id+'.settled.json'),JSON.stringify({version:'1.0',identity:input.identity,execution_id,status:'unqualified',receipt:result.receipt})+'\n',{flag:'wx',mode:0o600});
   const value=validateOpenExplorationValue(result.candidate.value);writeFileSync(join(directory,execution_id+'.explored.json'),JSON.stringify({version:'1.0',identity:input.identity,execution_id,step_sha256,status:'explored',verification:'not_performed',plan_sha256:taskHash(input.plan),value_sha256:taskHash(value),value,receipt:result.receipt})+'\n',{flag:'wx',mode:0o600});
   return {value,receipt:{...result.receipt,execution_id,step_sha256,code_sha256:hash(input.code),snapshot_sha256:hash(snapshot),value_sha256:taskHash(value),classification:'MODEL_EXPLORATION',verification:'not_performed'}};
  }catch(error){const physical=describePreparationFailure(error),code=String((error as {code?:unknown})?.code??'LOCAL_OPERATION_FAILED');const settled=read(execution_id,'.settled');writeFileSync(join(directory,execution_id+'.failed.json'),JSON.stringify({version:'1.0',identity:input.identity,execution_id,code,physical_status:settled?'settled':physical?.physical_status??'unknown'})+'\n',{flag:'wx',mode:0o600});if(!settled&&(!physical||physical.physical_status==='unknown'))fail('EXECUTION_UNKNOWN');throw error;}
 };
 run.qualify=async input=>{
  if(realpathSync(directory)!==directory)fail('PREPARATION_DIRECTORY_INVALID');
  const id=String(input.receipt.execution_id),admission=read(id,''),settled=read(id,'.settled');
  if(!admission||!settled||taskHash(admission.identity)!==taskHash(input.identity)||admission.step_sha256!==step(input)||input.receipt.step_sha256!==admission.step_sha256||settled.status!=='unqualified')fail('SAVE_UNCONFIRMED');
  const {execution_id,step_sha256,...physical}=input.receipt;void execution_id;void step_sha256;if(taskHash(physical)!==taskHash(settled.receipt))fail('SAVE_UNCONFIRMED');
  const snapshot=readFileSync(join(directory,id,'input','0.json')),output=readFileSync(join(directory,id,'output','result.json'));
  if(hash(snapshot)!==admission.snapshot_sha256||hash(output)!==Reflect.get(physical as object,'outputs')?.result?.sha256)fail('SAVE_UNCONFIRMED');
  const expected=executeOpenAnalysisIR(input.plan,input.inspection),proof=await verifyOpenAnalysisIntegerSum(input.plan,input.calculation,input.inspection);
  if(taskHash(expected)!==taskHash(input.calculation)||taskHash(proof)!==taskHash(input.verification))fail('VERIFICATION_FAILED');
  const raw=JSON.parse(output.toString('utf8'));const normalize=(value:string)=>{if(typeof value!=='string'||value.length>2000)fail('VERIFICATION_FAILED');let n:bigint,d:bigint;if(/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value)){const [w,p='']=value.split('.');d=10n**BigInt(p.length);n=BigInt(w!)*d+(w!.startsWith('-')?-1n:1n)*BigInt(p||'0');}else if(/^-?(0|[1-9]\d*)\/[1-9]\d*$/.test(value)){const [a,b]=value.split('/');n=BigInt(a!);d=BigInt(b!);}else fail('VERIFICATION_FAILED');let a=n<0n?-n:n,b=d;while(b){const c=a%b;a=b;b=c;}n/=a;d/=a;return d===1n?n.toString():n+'/'+d;};
  if(raw.rows!==expected.rows)fail('VERIFICATION_FAILED');
  if(expected.groups){if(!Array.isArray(raw.groups)||taskHash(JSON.parse(raw.value))!==taskHash(raw.groups)||taskHash(raw.groups.map((g:{key:string;value:string;rows:number})=>({...g,value:normalize(g.value)})))!==taskHash(expected.groups))fail('VERIFICATION_FAILED');}else if(normalize(raw.value)!==expected.value||raw.groups!==undefined&&raw.groups!==null)fail('VERIFICATION_FAILED');
  const record={version:'1.0',identity:input.identity,execution_id:id,step_sha256:admission.step_sha256,status:'qualified',result_sha256:taskHash(input.calculation),verification_sha256:taskHash(input.verification)};
  const old=read(id,'.qualified');if(old){if(taskHash(old)!==taskHash(record))fail('SAVE_UNCONFIRMED');return;}
  writeFileSync(join(directory,id+'.qualified.json'),JSON.stringify(record)+'\n',{flag:'wx',mode:0o600});
 };
 return run;
}
