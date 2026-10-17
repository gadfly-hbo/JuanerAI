// Supplier Pi Adapter. No SDK model, session, or result crosses the owner HTTP/IPC contract.
import {createPiTransport,RuntimeFault,type ModelConfig,type ModelTransport} from 'pi-agent-runtime';
import {randomUUID,createHash} from 'node:crypto';
import {lstat,realpath,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {SessionHost} from './session-host.js';
import type {ToolExecutionObserver} from './builtin-tool-observer.js';
import {MINIMAX_M3,MIMO_FLASH} from './model.js';
import {BUILTIN_IMAGE_MAX_OUTPUT_TOKENS} from './builtin-image-purpose.js';
import type {createReportStudioPolicy,StudioPermissionBoundary} from '../juanerai/policy.js';
import type {createStudioConfiguration} from '../juanerai/configuration.js';
import type {StudioProvider} from '../juanerai/credentials.js';

type Configuration={dataRoot:string;skillsDir:string;policy:ReturnType<typeof createReportStudioPolicy>;configuration:ReturnType<typeof createStudioConfiguration>;boundary(id:string):Promise<StudioPermissionBoundary>;projectExists(id:string):Promise<boolean>;admissionAllowed?():boolean;makeTransport?:(model:ModelConfig,key:string)=>ModelTransport;toolObserver?(projectId:string):ToolExecutionObserver|undefined};
function fail(code:string):never{throw Object.assign(new Error(code),{code,statusCode:code==='RS_NOT_FOUND'?404:409});}

/** Persist once; a pre-existing ledger keeps its original immutable purpose plan. */
async function imagePlan(projectRoot:string):Promise<'minimax-v1'|'dual-v2'|'dual-v3'> {
 const file=join(projectRoot,'.agent-model-plan.json');
 async function read(){
  try{
   const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size>1024)fail('RS_MODEL_PLAN_INVALID');
   const value=JSON.parse(await readFile(file,'utf8'));
   if(Object.keys(value).sort().join(',')!=='image_plan,schema_version'||value.schema_version!=='1'||!['minimax-v1','dual-v2','dual-v3'].includes(value.image_plan))fail('RS_MODEL_PLAN_INVALID');
   return value.image_plan as 'minimax-v1'|'dual-v2'|'dual-v3';
  }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;fail('RS_MODEL_PLAN_INVALID');}
 }
 const old=await read();if(old)return old;
 let plan:'minimax-v1'|'dual-v2'|'dual-v3'='dual-v3';
 try{await lstat(join(projectRoot,'agent-budget.json'));plan='minimax-v1';}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')fail('RS_MODEL_PLAN_INVALID');}
 try{await writeFile(file,JSON.stringify({schema_version:'1',image_plan:plan})+'\n',{flag:'wx',mode:0o600});}
 catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')fail('RS_MODEL_PLAN_INVALID');}
 const persisted=await read();if(!persisted)fail('RS_MODEL_PLAN_INVALID');return persisted;
}

export function createBuiltinAgentHosts(config:Configuration) {
 const hosts=new Map<string,Promise<SessionHost>>(),secrets=new Set<{projectId:string;keys:Map<StudioProvider,string>;active():boolean}>(),removing=new Set<string>();let closed=false,resetting=false,losingOwner:Promise<void>|null=null;
 const listeners=new Map<string,{signal:AbortSignal;listener:()=>void}>(),stopFailures=new Set<string>();
 const imageInputs=new Map<string,{source_id:string;sha256:string}>();
 const reconciling=new Map<string,Promise<ReturnType<typeof config.policy.reconcile>>>();
 function cleanup(id:string){const value=listeners.get(id);if(value)value.signal.removeEventListener('abort',value.listener);listeners.delete(id);}
 async function requireExpectedBudget(id:string,projectRoot:string){
  if(!config.policy.projectOperations(id).some(op=>op.sdk_run_id!==null))return;
  try{const stat=await lstat(join(projectRoot,'agent-budget.json'));if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)fail('RS_USAGE_UNAVAILABLE');}
  catch{fail('RS_USAGE_UNAVAILABLE');}
 }
 async function create(id:string):Promise<SessionHost> {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))fail('RS_NOT_FOUND');const projectRoot=join(config.dataRoot,id),stat=await lstat(projectRoot);
  if(stat.isSymbolicLink()||!stat.isDirectory()||await realpath(projectRoot)!==resolve(projectRoot)||!await config.projectExists(id))fail('RS_NOT_FOUND');
  await requireExpectedBudget(id,projectRoot);
  const plan=await imagePlan(projectRoot);
   const keys=new Map<StudioProvider,string>();let operationId:string|null=null,host:SessionHost;const secret={projectId:id,keys,active:()=>operationId!==null};secrets.add(secret);
  const transport=(model:ModelConfig):ModelTransport=>async request=>{
   const key=keys.get(model.provider as StudioProvider);if(!key)throw new RuntimeFault('AUTHORITY_REQUIRED');
   return (config.makeTransport?.(model,key)??createPiTransport({model,apiKey:key}))(request);
  };
  const mimoMainModel:ModelConfig=plan==='dual-v3'?{...MIMO_FLASH,input:['text','image']}:MIMO_FLASH;
  const primary={model:MINIMAX_M3,transport:transport(MINIMAX_M3)},fallback={model:mimoMainModel,transport:transport(mimoMainModel)};
  const imageModel={...MINIMAX_M3,maxOutputTokens:BUILTIN_IMAGE_MAX_OUTPUT_TOKENS};
  const image={model:imageModel,transport:transport(imageModel)};
  const mimoImageModel={...MIMO_FLASH,input:['text','image'] as ModelConfig['input'],maxOutputTokens:BUILTIN_IMAGE_MAX_OUTPUT_TOKENS};
  const imageFallback=plan!=='minimax-v1'?{model:mimoImageModel,transport:transport(mimoImageModel)}:undefined;
  try{host=await SessionHost.create({projectRoot,skillsDir:config.skillsDir,...primary,fallbacks:[fallback],builtin:{
   toolObserver:config.toolObserver?.(id),
   chain:{primary,fallback,selection:'primary'},image,...(imageFallback?{imageFallback}:{}),
   async authorize(effect){
    if(effect==='abort')return true;
    if(effect==='local')return !closed&&!resetting;
    if(!operationId||closed||resetting||stopFailures.has(operationId)||!keys.size)return false;
    const op=config.policy.operation(operationId);if(op?.state!=='running')return false;
    const current=await config.boundary(id),image=imageInputs.get(id);
    if(op.kind==='image'&&(!image||!current.materials.some(m=>m.kind==='image'&&m.source_id===image.source_id&&m.sha256===image.sha256)))return false;
    const permission=config.policy.permissions(id,current);if(!permission.allowed)return false;
    if(effect==='code_network')return permission.allow_network;
    if(effect==='screenshot')return permission.allow_screenshots;
    return true;
   },
   async beforeRun(kind,signal){
    if(closed||resetting||removing.has(id)||reconciling.has(id)||config.admissionAllowed?.()===false)fail('RS_STUDIO_UNAVAILABLE');
    const boundary=await config.boundary(id);await requireExpectedBudget(id,projectRoot);if(closed||resetting||removing.has(id)||config.admissionAllowed?.()===false)fail('RS_STUDIO_UNAVAILABLE');const op=config.policy.begin(id,randomUUID(),kind,boundary);operationId=op.operation_id;
    const listener=()=>{try{config.policy.stop(op.operation_id);}catch{stopFailures.add(op.operation_id);}};
    listeners.set(op.operation_id,{signal,listener});signal.addEventListener('abort',listener,{once:true});if(signal.aborted)listener();
    try{
     const loaded=await config.configuration.load();if(signal.aborted)fail('RS_OPERATION_STOPPED');
     keys.clear();for(const [provider,key]of loaded)keys.set(provider,key);loaded.clear();
     if(kind==='image'&&!keys.has('minimax-cn')&&!imageFallback)fail('RS_IMAGE_PLAN_LEGACY');
     if(kind==='image'&&!imageInputs.has(id))fail('RS_IMAGE_PERMISSION_REQUIRED');
     if(kind==='image')host.selectBuiltinImage(keys.has('minimax-cn')?'primary':'fallback');
     host.selectBuiltinChain(keys.has('minimax-cn')?(keys.has('xiaomi-token-plan-cn')?'full':'primary'):'fallback');
     return op.operation_id;
    }catch(error){
     try{config.policy.finish(op.operation_id,{outcome:signal.aborted?'cancelled':'failed',physical_settled:true,usage_known:!stopFailures.has(op.operation_id),sdk_run_id:null});}
     finally{cleanup(op.operation_id);stopFailures.delete(op.operation_id);operationId=null;}
     throw error;
    }
   },
   async afterRun(id,receipt){
    try{config.policy.finish(id,{outcome:receipt.outcome,physical_settled:receipt.physical_settled,usage_known:receipt.operation_usage_known&&!stopFailures.has(id),sdk_run_id:receipt.sdk_run_id});}
    finally{cleanup(id);stopFailures.delete(id);operationId=null;}
   },
  }});}catch(error){keys.clear();secrets.delete(secret);throw error;}
  return host;
 }
 function get(id:string):Promise<SessionHost>{
  if(closed||resetting||removing.has(id))return Promise.reject(Object.assign(Error('RS_STUDIO_UNAVAILABLE'),{code:'RS_STUDIO_UNAVAILABLE'}));
  const old=hosts.get(id);if(old)return old;const pending=create(id);hosts.set(id,pending);void pending.catch(()=>{if(hosts.get(id)===pending)hosts.delete(id);});return pending;
 }
 async function isIdle(){if(removing.size||reconciling.size||config.policy.activeOperations().length)return false;for(const promise of hosts.values()){const host=await promise.catch(()=>null);if(host?.isBusy())return false;}return true;}
 async function remove(id:string,work:()=>Promise<void>){
  if(closed||resetting||removing.has(id)||reconciling.has(id))fail('RS_PROJECT_PENDING');removing.add(id);
  try{
   if(config.policy.projectOperations(id).some(op=>['running','stopping','unknown'].includes(op.state)))fail('RS_PROJECT_PENDING');
   const host=await hosts.get(id);if(closed||host?.isBusy())fail('RS_PROJECT_PENDING');await host?.close();hosts.delete(id);
   for(const secret of secrets)if(secret.projectId===id){secret.keys.clear();secrets.delete(secret);}
   await work();
  }finally{removing.delete(id);}
 }
 async function reset(){
  if(resetting)fail('RS_STUDIO_UNAVAILABLE');if(!await isIdle())fail('RS_PROJECT_PENDING');resetting=true;
  try{for(const promise of hosts.values()){const host=await promise.catch(()=>null);await host?.close();}hosts.clear();for(const secret of secrets)secret.keys.clear();secrets.clear();}
  finally{resetting=false;}
 }
 async function close(){if(losingOwner)return losingOwner;if(closed)return;await reset();closed=true;}
 async function stopOwned(){
  const owned=(await Promise.all([...hosts.values()].map(promise=>promise.catch(()=>null)))).filter((host):host is SessionHost=>host!==null);
  // Acknowledgement only. Physical settlement is observed separately; UNKNOWN
  // is never reconciled by a request to quit.
  for(const host of owned)if(host.isBusy())await host.control({kind:'abort'});
 }
 function ownerLost():Promise<void>{
  if(losingOwner)return losingOwner;if(closed)return Promise.resolve();closed=true;
  losingOwner=(async()=>{
   const owned=(await Promise.all([...hosts.values()].map(promise=>promise.catch(()=>null)))).filter((host):host is SessionHost=>host!==null);
   for(const host of owned)await host.control({kind:'abort'});
   await Promise.all(owned.map(host=>host.waitForIdle()));
   await Promise.allSettled([...reconciling.values()]);
   while(owned.some(host=>host.isBusy()))await new Promise(resolve=>setTimeout(resolve,5));
   for(const host of owned)await host.close();
   hosts.clear();for(const secret of secrets)secret.keys.clear();secrets.clear();
  })();return losingOwner;
 }
 function reconcile(id:string){
  const old=reconciling.get(id);if(old)return old;
  const work=(async()=>{
   const operation=config.policy.projectOperations(id).at(-1);
   if(!operation||operation.state!=='unknown'||!operation.physical_settled)fail('RS_RECONCILIATION_REQUIRED');
   if((operation.kind==='export'||operation.kind==='preview')&&operation.sdk_run_id===null)return config.policy.reconcile(operation.operation_id);
   const host=await get(id);await host.reconcileBudgetLease(operation.sdk_run_id,operation.operation_id,operation.kind);
   return config.policy.reconcile(operation.operation_id);
  })().finally(()=>reconciling.delete(id));
  reconciling.set(id,work);return work;
 }
 function clearIdleCredentials(){for(const secret of secrets)if(!secret.active())secret.keys.clear();}
 async function describeImage(id:string,sourceId:string,content:Buffer,mimeType:'image/png'|'image/jpeg'|'image/webp'|'image/gif'):Promise<string>{
  if(imageInputs.has(id))fail('RS_PROJECT_PENDING');const input={source_id:sourceId,sha256:createHash('sha256').update(content).digest('hex')},current=await config.boundary(id);
  if(!current.materials.some(m=>m.kind==='image'&&m.source_id===input.source_id&&m.sha256===input.sha256))fail('RS_IMAGE_PERMISSION_REQUIRED');
  if(imageInputs.has(id))fail('RS_PROJECT_PENDING');imageInputs.set(id,input);
  try{
   const host=await get(id),value=await host.describeImage({data:content.toString('base64'),mimeType},new AbortController().signal);
   if(!value.read||value.result.status!=='succeeded'||!value.result.value?.trim())fail('RS_IMAGE_UNDERSTANDING_UNCONFIRMED');return value.result.value;
  }finally{imageInputs.delete(id);}
 }
 return {hosts,get,isIdle,reset,close,stopOwned,ownerLost,reconcile,remove,clearIdleCredentials,describeImage};
}
