import {userInfo} from 'node:os';
import {join} from 'node:path';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {createMetricProcess} from '../../adapters/metric-factory/process.ts';
import {verifyMetricBundle} from '../../adapters/metric-factory/bundle.ts';
import {createMetricCopies} from '../../adapters/metric-factory/copies.ts';
import {createMetricDelivery} from '../../packages/application/metric-factory.ts';
import type {MetricWorkspace} from '../../packages/ports/metric-factory.ts';
/** Private adapter input. Secrets and SDK objects never enter the business Port. */
export type MetricModelAccess={configured():boolean;configuration(taskId:string):Promise<unknown>;authorize(request:Readonly<{taskId:string;kind:string;provider?:string;model?:string;endpoint?:string}>):Promise<boolean>;settled(taskId:string,known:boolean):Promise<void>};
export function createPersonalMetricWorkspace(options:{programRoot:string;manifestSha256:string;dataRoot:string;copiesRoot:string;reviewer?:string;model?:MetricModelAccess}):MetricWorkspace{
 const manifest=verifyMetricBundle(options.programRoot,options.manifestSha256);
 let check:()=>void=()=>{throw Error('MF_CONTROL_REQUIRED');};
 const delivery=createMetricDelivery(createMetricCopies(options.copiesRoot,manifest.sourceSnapshot),()=>check());
 const object=(x:unknown):Record<string,unknown>=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('MF_REQUEST_INVALID');return x as Record<string,unknown>;};
 const runtime=createMetricProcess({...options,reviewer:options.reviewer??userInfo().username,configured:()=>options.model?.configured()===true,owner:async(operation,value)=>{
  // Host session/control can be revoked independently of the plugin window.
  const x=object(value);
  if(operation==='settled'){if(typeof x.taskId!=='string'||typeof x.known!=='boolean')throw Error('MF_REQUEST_INVALID');await options.model?.settled(x.taskId,x.known);return true;}
  check();
  if(operation==='access')return true;
  if(operation==='model-config'){if(!options.model||typeof x.taskId!=='string')throw Error('MF_MODEL_UNAVAILABLE');const result=await options.model.configuration(x.taskId);check();return result;}
  if(operation==='authorize'){if(!options.model||typeof x.taskId!=='string'||typeof x.kind!=='string')return false;const allowed=await options.model.authorize(x as {taskId:string;kind:string});check();return allowed===true;}
  if(operation==='save'){
   for(const k of ['packageId','version','contentFingerprint','packageFingerprint','sha256','bytes'])if(typeof x[k]!=='string')throw Error('MF_PUBLICATION_INVALID');
   const bytes=Buffer.from(x.bytes as string,'base64');if(bytes.toString('base64')!==x.bytes)throw Error('MF_PUBLICATION_INVALID');
   return delivery.save({packageId:x.packageId as string,version:x.version as string,contentFingerprint:x.contentFingerprint as string,packageFingerprint:x.packageFingerprint as string,sha256:x.sha256 as string,bytes});
  }
  if(operation==='export'||operation==='saved'){
   if(typeof x.packageId!=='string'||typeof x.version!=='string'||typeof x.sha256!=='string'||!/^[a-f0-9]{64}$/.test(x.sha256))throw Error('MF_REQUEST_INVALID');
   let saved;try{saved=delivery.read(x.packageId,x.version);}catch(error){if(operation==='saved'&&['ENOENT','ENOTDIR'].includes((error as NodeJS.ErrnoException).code??''))return false;throw error;}
   if(saved.receipt.sha256!==x.sha256)throw Error('MF_COPY_CONFLICT');
   return operation==='saved'?true:{bytes:Buffer.from(saved.bytes).toString('base64'),filename:`${saved.receipt.packageId}-${saved.receipt.version}.sap.yaml`};
  }
  throw Error('MF_OPERATION_DENIED');
 }});
 return {async status(){try{verifyMetricBundle(options.programRoot,options.manifestSha256);return {available:true};}catch{return {available:false};}},async open(authority){authority();check=authority;const url=await runtime.launch();authority();return {url};},state:runtime.state,close:runtime.close};
}
export function readPersonalMetricDeployment(resources:string,userData:string,model?:MetricModelAccess):MetricWorkspace|undefined {
 const path=join(resources,'metric-factory-deployment.json');
 try{const stat=lstatSync(path);if(!stat.isFile()||stat.size>4096||realpathSync(path)!==path)throw Error('MF_DEPLOYMENT_INVALID');const x=JSON.parse(readFileSync(path,'utf8'));if(x.version!==1||! /^[a-f0-9]{64}$/.test(x.manifestSha256))throw Error('MF_DEPLOYMENT_INVALID');return createPersonalMetricWorkspace({programRoot:join(resources,'metric-factory'),manifestSha256:x.manifestSha256,dataRoot:join(userData,'metric-factory/workspace-owner'),copiesRoot:join(userData,'metric-factory/copies'),model});}
 catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return undefined;return {async status(){return {available:false};},async open(){throw Error('MF_BUNDLE_UNAVAILABLE');},async state(){return {active:false,unknown:false,requests:0};},async close(){}};}
}
