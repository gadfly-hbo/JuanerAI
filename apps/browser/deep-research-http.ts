import type {IncomingMessage,ServerResponse} from 'node:http';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import type {createResearchWorkspace} from '../../packages/application/deep-research.ts';
export type ResearchHttpServices={task(projectId:string,taskId:string,checkControl:()=>void):ReturnType<typeof createResearchWorkspace>};
type Context={services?:ResearchHttpServices;canWrite:boolean;checkControl():void;json(req:IncomingMessage,maximum?:number):Promise<unknown>;reply(res:ServerResponse,status:number,value:unknown):void;reject(status:number):never};
/** Uses the existing host session and control authority, never a second browser grant. */
export async function deepResearchHttp(req:IncomingMessage,res:ServerResponse,deps:Context){
 const path=req.url??'';
 if(path==='/v1/deep-research/status'&&req.method==='GET'){deps.reply(res,200,{available:!!deps.services});return;}
 if(req.method!=='GET'&&!deps.canWrite)deps.reject(403);
 if(!deps.services)deps.reject(503);
 const route=/^\/v1\/deep-research\/projects\/([a-f0-9-]{36})\/tasks\/([a-f0-9-]{36})\/(open|state|published|copies|save|receipts\/[a-f0-9-]{36}|copies\/[a-f0-9]{64})$/.exec(path);
 if(!route||!membershipUuid(route[1])||!membershipUuid(route[2]))deps.reject(404);
 const available=async<T>(action:()=>Promise<T>):Promise<T>=>{try{return await action();}catch(error){if(error instanceof Error&&['DR_BUNDLE_UNAVAILABLE','DR_SERVICE_UNAVAILABLE','DR_START_FAILED','DR_START_TIMEOUT','DR_MANIFEST_MISMATCH','DR_BUNDLE_BYTES_MISMATCH'].includes(error.message))deps.reject(503);throw error;}};
 const task=deps.services.task(route[1],route[2],deps.checkControl),op=route[3];
 if(req.method==='POST'&&op==='open'){closed(await deps.json(req),[]);deps.checkControl();deps.reply(res,200,await available(()=>task.open()));return;}
 if(req.method==='GET'&&op==='state'){deps.reply(res,200,await available(()=>task.state()));return;}
 if(req.method==='GET'&&op==='published'){deps.reply(res,200,await available(()=>task.published()));return;}
 if(req.method==='GET'&&op==='copies'){deps.reply(res,200,task.copies());return;}
 if(req.method==='GET'&&op.startsWith('receipts/')){deps.reply(res,200,task.receipt(op.slice(9)));return;}
 if(req.method==='GET'&&op.startsWith('copies/')){const value=task.copy(op.slice(7));res.writeHead(200,{'content-type':'application/zip','content-disposition':'attachment; filename="research-v'+value.receipt.version+'.zip"','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox; frame-ancestors 'none'"});res.end(value.bytes);return;}
 if(req.method==='POST'&&op==='save'){
  const body=closed(await deps.json(req,8192),['commandId','projectId','runId','version']);
  if(!membershipUuid(body.commandId)||typeof body.projectId!=='string'||!/^p-[a-z0-9-]+$/.test(body.projectId)||typeof body.runId!=='string'||!body.runId||!Number.isSafeInteger(body.version)||Number(body.version)<1)deps.reject(400);
  deps.checkControl();
  deps.reply(res,200,await task.save(String(body.commandId),{projectId:body.projectId,runId:body.runId,version:Number(body.version)}));return;
 }
 deps.reject(405);
}
