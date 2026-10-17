import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {openSync,closeSync,fstatSync,readFileSync,realpathSync,constants} from 'node:fs';
import {join} from 'node:path';
import type {RuntimeAdmission} from './runtime-authorization.ts';
import type {DecisionRecipient} from '../../packages/ports/decision-platform.ts';
const sha=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export const calibrationDigest=(value:unknown)=>sha(JSON.stringify(value??{dismissalReasons:[],manualAdditions:[]}));
export function modelRecipient(model:unknown):DecisionRecipient{
 if(!model||typeof model!=='object')throw Error('DP_RECIPIENT_INVALID');
 const m=model as Record<string,unknown>;
 if(typeof m.provider!=='string'||typeof m.id!=='string')throw Error('DP_RECIPIENT_INVALID');
 // Include the complete fixed model configuration, with stable property order.
 const stable=(v:unknown):unknown=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,stable(x)])):v;
 return {provider:m.provider,model:m.id,configurationSha256:sha(JSON.stringify(stable(model)))};
}
export type RuntimeState={active:boolean;unknown:boolean};
/** Read the existing plugin ledger; never release leases or replace its accounting. */
export function readRuntimeState(dataRoot:string,projectId?:string,ownedActive:ReadonlySet<string>=new Set()):RuntimeState{
 try{
  const raw=JSON.parse(readFileSync(join(dataRoot,'agent-ledger.json'),'utf8'));
  if(raw.version!==1||!raw.tasks||typeof raw.tasks!=='object'||Array.isArray(raw.tasks))throw Error();
  let active=false,unknown=false;
  for(const [id,value] of Object.entries(raw.tasks)){
   if(projectId&&!id.startsWith('extract:'+projectId+':'))continue;
   const v=value as {taskId:string;active:boolean;usage:{reservedOutputTokens:number}};
   if(v.taskId!==id||typeof v.active!=='boolean'||!Number.isFinite(v.usage?.reservedOutputTokens)||v.usage.reservedOutputTokens<0)throw Error();
   active ||= v.active;unknown ||= !ownedActive.has(id.split(':')[1])&&(v.active||v.usage.reservedOutputTokens>0);
  }
  return {active,unknown};
 }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {active:false,unknown:false};return {active:false,unknown:true};}
}
/** Wrap c11f8da's runner and pass authorize directly to composeAgent. SDK objects stay here. */
export function createDecisionExtractionScope(config:{dataRoot:string;authorize(request:RuntimeAdmission,signal:AbortSignal):Promise<boolean>;calibration(projectId:string):unknown}){
 type Scope={taskId:string;request:RuntimeAdmission;open:boolean};
 const scopes=new AsyncLocalStorage<Scope>(),active=new Set<string>();
 function file(projectId:string,name:string){
  const path=join(config.dataRoot,'projects',projectId,'reports',name);
  if(realpathSync(path)!==path)throw Error('DP_SOURCE_CHANGED');
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const before=fstatSync(fd);if(!before.isFile()||before.nlink!==1)throw Error('DP_SOURCE_CHANGED');const bytes=readFileSync(fd),after=fstatSync(fd);
   if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw Error('DP_SOURCE_CHANGED');return {sha256:sha(bytes),bytes:bytes.length};
  }finally{closeSync(fd);}
 }
 function state(projectId?:string):RuntimeState{const ledger=readRuntimeState(config.dataRoot,projectId,active);return {...ledger,active:ledger.active||(projectId?active.has(projectId):active.size>0)};}
 return {
  state,
  async run<T>(input:{taskId:string;reportName:string;calibration?:unknown},work:()=>Promise<T>):Promise<T>{
   const match=/^extract:([a-f0-9-]{36}):(source-[a-f0-9-]{36})$/.exec(input.taskId);
   if(!match||!['md','pdf','pptx'].some(ext=>input.reportName===match[2]+'.'+ext))throw Error('DP_SOURCE_INVALID');
   const projectId=match[1],current=state(projectId);if(current.active||current.unknown)throw Error('DP_BUSY_OR_UNKNOWN');
   const teachSha256=calibrationDigest(input.calibration);
   if(teachSha256!==calibrationDigest(config.calibration(projectId)))throw Error('DP_TEACH_CHANGED');
   const scope:Scope={taskId:input.taskId,open:true,request:{kind:'model',projectId,physicalName:input.reportName,...file(projectId,input.reportName),teachSha256,recipients:[]}};
   active.add(projectId);
   try{return await scopes.run(scope,work);}finally{scope.open=false;active.delete(projectId);}
  },
  async authorize(action:unknown,signal:AbortSignal):Promise<boolean>{
   try{
    const scope=scopes.getStore();if(!scope?.open||signal.aborted||!action||typeof action!=='object')return false;
    const a=action as {kind:string;taskId:string;request?:{model?:unknown}};
    if(a.taskId!==scope.taskId||!['model','publish'].includes(a.kind))return false;
    const current=()=>scope.open&&!signal.aborted&&calibrationDigest(config.calibration(scope.request.projectId))===scope.request.teachSha256
     &&file(scope.request.projectId,scope.request.physicalName).sha256===scope.request.sha256;
    if(!current())return false;
    const recipients=a.kind==='model'?[modelRecipient(a.request?.model)]:scope.request.recipients;
    if(!recipients.length)return false;
    if(!await config.authorize({...scope.request,kind:a.kind as 'model'|'publish',recipients},signal)||!current())return false;
    if(a.kind==='model')scope.request={...scope.request,recipients:[...scope.request.recipients,...recipients]};
    return true;
   }catch{return false;}
  },
 };
}
