// Private built-in child entry. The independently maintained standalone entry is unchanged.
import {z} from 'zod';
import {startBuiltinStudio} from './server.js';
import {parseReportStudioOwnerRequest,parseReportStudioOwnerValue,type ReportStudioOwnerRequest,type ReportStudioOwnerValue} from './contract.js';
const configuration=z.object({dataRoot:z.string(),webDist:z.string(),ownerToken:z.string().regex(/^[a-f0-9]{64}$/),pluginVersion:z.string().min(1)}).strict();
let service:Awaited<ReturnType<typeof startBuiltinStudio>>|null=null,closing=false,ownerLost=false;
const ownerPending=new Map<string,{request:ReportStudioOwnerRequest;resolve(value:ReportStudioOwnerValue):void;reject(error:Error):void;timer:ReturnType<typeof setTimeout>}>();
function ownerError(code='RS_OWNER_UNAVAILABLE'){return Object.assign(Error(code),{code});}
function requestOwner(raw:ReportStudioOwnerRequest):Promise<ReportStudioOwnerValue>{
 const request=parseReportStudioOwnerRequest(raw);if(ownerLost||!process.connected||ownerPending.size>=32||ownerPending.has(request.request_id))return Promise.reject(ownerError());
 return new Promise((resolve,reject)=>{
  const finish=(error:Error)=>{const pending=ownerPending.get(request.request_id);if(!pending)return;clearTimeout(pending.timer);ownerPending.delete(request.request_id);reject(error);};
  const timer=setTimeout(()=>finish(ownerError('RS_OWNER_REPLY_UNKNOWN')),45000);ownerPending.set(request.request_id,{request,resolve,reject,timer});
  try{process.send?.(request,error=>{if(error)finish(ownerError());});}catch{finish(ownerError());}
 });
}
process.on('message',raw=>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||(raw as {type?:unknown}).type!=='owner_reply')return;
 const reply=raw as Record<string,unknown>,id=reply.request_id;if(typeof id!=='string')return;const pending=ownerPending.get(id);if(!pending)return;
 clearTimeout(pending.timer);ownerPending.delete(id);
 try{
  const keys=Object.keys(reply).sort().join(',');if(reply.version!=='1'||(reply.ok===true?keys!=='ok,request_id,type,value,version':reply.ok!==false||keys!=='error,ok,request_id,type,version'))throw ownerError('RS_OWNER_CONTRACT_INVALID');
  if(reply.ok===false)throw ownerError(typeof reply.error==='string'&&/^RS_[A-Z0-9_]{1,80}$/.test(reply.error)?reply.error:'RS_OWNER_UNAVAILABLE');
  pending.resolve(parseReportStudioOwnerValue(reply.value,pending.request));
 }catch(error){pending.reject(ownerError(typeof (error as {code?:unknown})?.code==='string'&&/^RS_[A-Z0-9_]+$/.test((error as {code:string}).code)?(error as {code:string}).code:'RS_OWNER_CONTRACT_INVALID'));}
});
async function shutdown(code=0){
  if(closing)return;closing=true;
  try{
    if(ownerLost)await service?.ownerLost();
    else try{await service?.close();}catch(error){if(!ownerLost)throw error;await service?.ownerLost();}
  }catch{closing=false;return;}
  process.exit(code);
}
process.on('SIGTERM',()=>void shutdown());process.on('SIGINT',()=>void shutdown());process.once('disconnect',()=>{ownerLost=true;for(const pending of ownerPending.values()){clearTimeout(pending.timer);pending.reject(ownerError());}ownerPending.clear();void shutdown();});
if(!process.send||process.env['REPORT_STUDIO_BUILTIN']!=='1')process.exit(1);
process.once('message',async raw=>{
  try {
    service=await startBuiltinStudio(configuration.parse(raw),{requestOwner});
    if(ownerLost||!process.connected){ownerLost=true;await shutdown();return;}
    if(closing){await service.close();return;}
    process.send?.({type:'ready',origin:service.origin,protocol_version:'1',plugin_version:configuration.parse(raw).pluginVersion,source_commit:'74ebb609fd73cf263614ffc9301dafaafcec4230'},error=>{if(error){ownerLost=true;void shutdown();}});
  }catch{await shutdown(1);}
});
