import type {IncomingMessage,ServerResponse} from 'node:http';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import type {createPersonalReportStudioRuntime,createPersonalReportStudioWorkspace} from '../../profiles/personal/report-studio.ts';
export type ReportStudioHttpServices={unavailable:'not_bundled'|'invalid'}|{runtime:ReturnType<typeof createPersonalReportStudioRuntime>;project(id:string):ReturnType<typeof createPersonalReportStudioWorkspace>};
type Context={services?:ReportStudioHttpServices;canWrite:boolean;json(req:IncomingMessage,maximum?:number):Promise<unknown>;reply(res:ServerResponse,status:number,value:unknown):void;reject(status:number):never};
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
/** Called only after the existing host session/origin checks. No independent auth authority. */
export async function reportStudioHttp(req:IncomingMessage,res:ServerResponse,deps:Context):Promise<void>{
 const path=req.url??'',services=deps.services;
 if(path==='/v1/report-studio/status'&&req.method==='GET'){
   if(services&&'unavailable' in services){deps.reply(res,200,{state:'unavailable',reason:services.unavailable});return;}
   const status=await services?.runtime.status();
   deps.reply(res,200,!status?{state:'unavailable',reason:'not_bundled'}:status.state==='ready'?{state:'ready',version:status.manifest.version,source_commit:status.manifest.source_commit,protocol_version:status.manifest.protocol_version}:{state:'unavailable',reason:status.reason});return;
 }
 if(req.method!=='GET'&&!deps.canWrite)deps.reject(403);
 if(!services||'unavailable' in services)fail('RS_MODULE_UNAVAILABLE');
 if(path==='/v1/report-studio/independent'&&req.method==='POST'){closed(await deps.json(req),[]);deps.reply(res,200,{url:await services.runtime.launch()});return;}
 const route=/^\/v1\/report-studio\/projects\/([a-f0-9-]{36})\/(.+)$/.exec(path);if(!route||!membershipUuid(route[1]))deps.reject(404);
 const workspace=services.project(route[1]);if(workspace.projectId!==route[1])fail('RS_TARGET_CHANGED');
 const check=()=>{if(services.project(route[1])!==workspace)fail('RS_TARGET_CHANGED');};
 const send=(value:unknown)=>{check();deps.reply(res,200,value);};
 const tail=route[2],catalog=/^tasks\/([a-f0-9-]{36})\/revisions\/([1-9][0-9]*)\/catalog$/.exec(tail);
 if(catalog&&req.method==='GET'){if(!membershipUuid(catalog[1]))deps.reject(400);send({catalog:workspace.catalog(catalog[1],catalog[2]),association:workspace.sourceAssociation(catalog[1],catalog[2])});return;}
 if(tail==='open'&&req.method==='POST'){
   const body=closed(await deps.json(req,8192),['task_id','revision','materials']);
   if(!membershipUuid(body.task_id)||typeof body.revision!=='string'||!/^[1-9][0-9]*$/.test(body.revision)||!Array.isArray(body.materials)||!body.materials.length||body.materials.some(m=>!['conclusion','table'].includes(String(m))))deps.reject(400);
   check();send(await workspace.open(String(body.task_id),body.revision,body.materials as string[]));return;
 }
 const continueProject=/^associations\/([a-f0-9-]{36})\/open$/.exec(tail);
 if(continueProject&&req.method==='POST'){if(!membershipUuid(continueProject[1]))deps.reject(400);closed(await deps.json(req),[]);check();send(await workspace.continueProject(continueProject[1]));return;}
 const exportAction=/^associations\/([a-f0-9-]{36})\/exports\/([A-Za-z0-9_-]{1,128})\/(deliver|receipt)$/.exec(tail);
 if(exportAction){if(!membershipUuid(exportAction[1]))deps.reject(400);
   if(exportAction[3]==='receipt'&&req.method==='GET'){send(workspace.receipt(exportAction[1],exportAction[2]));return;}
   if(exportAction[3]==='deliver'&&req.method==='POST'){closed(await deps.json(req),[]);check();send(await workspace.deliver(exportAction[1],exportAction[2]));return;}
 }
 const deliveries=/^tasks\/([a-f0-9-]{36})\/deliveries$/.exec(tail);
 if(deliveries&&req.method==='GET'){if(!membershipUuid(deliveries[1]))deps.reject(400);send(await workspace.deliveryViews(deliveries[1]));return;}
 const copy=/^deliveries\/([a-f0-9-]{36})\/copy$/.exec(tail);
 if(copy&&req.method==='GET'){
   if(!membershipUuid(copy[1]))deps.reject(400);const value=workspace.copy(copy[1]);check();
   const types={pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',html:'text/html; charset=utf-8',pdf:'application/pdf'};
   res.writeHead(200,{'content-type':types[value.record.format],'content-disposition':`attachment; filename="report-${value.record.sequence}.${value.record.format}"`,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; sandbox; frame-ancestors 'none'; base-uri 'none'"});res.end(value.content);return;
 }
 deps.reject(404);
}
