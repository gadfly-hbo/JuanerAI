import type { Server } from 'node:http';
import {requestRuntimeAuthorization} from './runtime-channel.ts';
import type {RuntimeAdmission} from './runtime-authorization.ts';
import { isAbsolute } from 'node:path';
import { protectDecisionPlatformIngress } from './ingress.ts';

/** Called only by a fixed, host-owned composition entry. No credential discovery. */
export function runDecisionPlatformChild(config: {
 sourceCommit:string;
 start(dataRoot:string, track:<T>(work:()=>Promise<T>)=>Promise<T>,authorize:(request:RuntimeAdmission,signal:AbortSignal)=>Promise<boolean>):Server;
 canClose():boolean;
 readProjects?():unknown;
 readBoard?(projectId:string):unknown;
 runtimeState?(projectId?:string):{active:boolean;unknown:boolean};
}):void {
 if(!process.send||!process.connected)throw new Error('DP_OWNER_REQUIRED');
 let server:Server|undefined,access:ReturnType<typeof protectDecisionPlatformIngress>|undefined;
 let nonce='',active=0,requests=0,quiet=false,quiescing=false;
 function reply(value:object){if(process.connected)process.send?.(value,()=>{});}
 const track=async<T>(work:()=>Promise<T>):Promise<T>=>{
  if(quiescing)throw new Error('DP_STOPPING');active++;
  try{return await work();}finally{active--;}
 };
 process.once('message',(raw:unknown)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('DP_OWNER_REQUIRED');
  const m=raw as Record<string,unknown>;
  if(m.type!=='initialize'||typeof m.nonce!=='string'||!/^[a-f0-9]{64}$/.test(m.nonce)
   ||typeof m.ownerToken!=='string'||!/^[a-f0-9]{64}$/.test(m.ownerToken)
   ||typeof m.dataRoot!=='string'||!isAbsolute(m.dataRoot)||m.sourceCommit!==config.sourceCommit)throw new Error('DP_OWNER_REQUIRED');
  nonce=m.nonce;
  server=config.start(m.dataRoot,track,(request,signal)=>requestRuntimeAuthorization(nonce,request,signal));
  try{access=protectDecisionPlatformIngress(server,m.ownerToken);}catch(error){server.close();throw error;}
  server.prependListener('request',(_req,res)=>{
   requests++;let done=false;
   const end=()=>{if(!done){done=true;requests--;}};res.once('finish',end);res.once('close',end);
  });
  server.once('error',()=>{access?.revoke();process.exitCode=1;process.disconnect?.();});
  server.once('listening',()=>{
   const address=server!.address();
   if(!address||typeof address==='string'||address.address!=='127.0.0.1')throw new Error('DP_LOOPBACK_REQUIRED');
   reply({type:'ready',nonce,pid:process.pid,sourceCommit:config.sourceCommit,origin:`http://127.0.0.1:${address.port}`});
  });
  process.on('message',(raw:unknown)=>{
   if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
   const m=raw as Record<string,unknown>;if(m.nonce!==nonce)return;
   if(m.type==='projects'&&typeof m.id==='string'){try{if(!config.readProjects)throw Error();reply({type:'projects-result',nonce,id:m.id,value:config.readProjects()});}catch{reply({type:'projects-result',nonce,id:m.id,failed:true});}return;}
   if(m.type==='board'&&typeof m.id==='string'){
    try{if(typeof m.projectId!=='string'||!/^[a-f0-9-]{36}$/.test(m.projectId)||!config.readBoard)throw Error();reply({type:'board-result',nonce,id:m.id,value:config.readBoard(m.projectId)});}
    catch{reply({type:'board-result',nonce,id:m.id,failed:true});}return;
   }
   if(m.type==='runtime-state'&&typeof m.id==='string'){
    const valid=m.projectId===undefined||typeof m.projectId==='string'&&/^[a-f0-9-]{36}$/.test(m.projectId);
    reply({type:'runtime-state-result',nonce,id:m.id,value:valid?config.runtimeState?.(m.projectId as string|undefined)??{active:false,unknown:true}:{active:false,unknown:true}});return;
   }
   if(m.type==='quiesce'){
    if(active||requests||!config.canClose()){reply({type:'quiesced',nonce,busy:true});return;}
    if(quiescing)return;
    quiescing=true;access!.revoke();
    server!.close(error=>{if(error){reply({type:'quiesced',nonce,failed:true});return;}quiet=true;reply({type:'quiesced',nonce});});
    server!.closeIdleConnections();
   }
   if(m.type==='shutdown'&&quiet)process.disconnect?.();
  });
 });
 process.on('disconnect',()=>{access?.revoke();server?.close();server?.closeIdleConnections();});
}
