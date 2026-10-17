import {join,isAbsolute,resolve} from 'node:path';
import {constants} from 'node:fs';
import {open,realpath} from 'node:fs/promises';
import {membershipRecord as closed} from '../../packages/product-core/member-analysis.ts';
import {randomUUID} from 'node:crypto';
import type {ReportStudioBundleIdentity} from '../../packages/contracts/report-studio.ts';
import {parseReportStudioOwnerRequest,parseReportStudioOwnerValue,type ReportStudioOwnerRequest,type ReportStudioOwnerValue,type ReportStudioOwnerDelivery} from '../../packages/contracts/report-studio.ts';
import type {OpenStoredTask} from '../../packages/ports/open-analysis-store.ts';
import type {ReportStudioGateway} from '../../packages/ports/report-studio.ts';
import {verifyReportStudioBundle} from '../../adapters/report-studio/bundle.ts';
import {createReportStudioProcess} from '../../adapters/report-studio/process.ts';
import {createReportStudioStore} from '../../adapters/report-studio/store.ts';
import {createReportStudioWorkspace} from '../../packages/application/report-studio.ts';
function fail():never{throw Object.assign(new Error('RS_MODULE_UNAVAILABLE'),{code:'RS_MODULE_UNAVAILABLE'});}
/** Concrete personal composition, never a runtime selector or plugin registry. */
export function createPersonalReportStudioRuntime(config:{bundleRoot:string;identity:ReportStudioBundleIdentity;dataRoot:string}) {
 const {bundleRoot,dataRoot}=config,identity=structuredClone(config.identity);
 let ownerRequest:((request:ReportStudioOwnerRequest)=>Promise<ReportStudioOwnerValue>)|null=null;
 let instance:ReturnType<typeof createReportStudioProcess>|null=null,pending:ReturnType<ReturnType<typeof createReportStudioProcess>['start']>|null=null;
 const status=()=>verifyReportStudioBundle(bundleRoot,identity);
 function start(){
   if(pending)return pending;
   const live=instance?.current();if(live)return Promise.resolve(live);
   pending=(async()=>{
     if((await status()).state!=='ready')fail();
     instance??=createReportStudioProcess({node:join(bundleRoot,'bin/node'),entry:join(bundleRoot,'studio/dist/juanerai/entry.js'),programRoot:join(bundleRoot,'studio'),dataRoot,webDist:join(bundleRoot,'studio/web-dist'),browserRoot:join(bundleRoot,'browser'),pluginVersion:identity.version,sourceCommit:identity.source_commit,ownerRequest:async request=>{if(!ownerRequest)fail();return ownerRequest(request);}});
     return instance.start();
   })().finally(()=>{pending=null;});return pending;
 }
 async function launch(projectId?:string){
   if(projectId!==undefined&&!/^[A-Za-z0-9_-]{1,128}$/.test(projectId))fail();
   const session=await start(),token=await session.gateway.bootstrap();
   return session.origin+'/'+(projectId?'?project='+projectId:'')+'#bootstrap='+token;
 }
 async function close(){if(pending){try{await pending;}catch{}}await instance?.close();}
 async function lifecycle(){if(pending)await pending;return instance?instance.lifecycle():{intent:'none' as const,pending:false,request_count:0,configuration_unknown:false,operations:[]};}
 async function exitIntent(intent:'wait'|'stop'|'cancel'){if(pending)await pending;return instance?instance.exitIntent(intent):{intent:'none' as const,pending:false,request_count:0,configuration_unknown:false,operations:[]};}
 async function observeProject(id:string){if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))fail();const live=instance?.current();return live?live.gateway.project(id):undefined;}
 return {status,start,launch,close,lifecycle,exitIntent,observeProject,connectOwner(request:(request:ReportStudioOwnerRequest)=>Promise<ReportStudioOwnerValue>){if(ownerRequest||instance||pending)fail();ownerRequest=request;}};
}

/** Exact host project boundary. The shared instance keeps its own editable data. */
export function createPersonalReportStudioWorkspace(config:{projectRoot:string;projectId:string;readTask(id:string):OpenStoredTask|null;runtime:ReturnType<typeof createPersonalReportStudioRuntime>}) {
 const store=createReportStudioStore({projectRoot:config.projectRoot,projectId:config.projectId}),runtime=config.runtime;
 const studio:ReportStudioGateway={
   ensureProject:async a=>(await runtime.start()).gateway.ensureProject(a),
   project:async id=>(await runtime.start()).gateway.project(id),
   savedExport:async(id,exportId)=>(await runtime.start()).gateway.savedExport(id,exportId),
 };
 const workspace=createReportStudioWorkspace({projectId:config.projectId,readTask:config.readTask,store,studio,newId:randomUUID,now:()=>new Date().toISOString()});
 return {projectId:config.projectId,status:runtime.status,catalog:workspace.catalog,sourceAssociation:(taskId:string,revision:string)=>store.sourceAssociation(taskId,revision),
   currentRevision:(taskId:string)=>config.readTask(taskId)?.identity.revision??null,
   async open(taskId:string,revision:string,materials:readonly string[]){const association=await workspace.open(taskId,revision,materials);return {association,url:await runtime.launch(association.studio_project_id)};},
   async continueProject(id:string){const association=await workspace.continueProject(id);return {association,url:await runtime.launch(association.studio_project_id)};},
   async deliveryViews(taskId:string){
     const rows=workspace.deliveries(taskId),states=new Map<string,Promise<'available'|'missing'|'unknown'|'not_checked'>>();
     for(const row of rows)if(!states.has(row.association_id))states.set(row.association_id,(async()=>{
       try{const a=store.association(row.association_id);if(!a||a.state!=='ready')return 'unknown';const p=await runtime.observeProject(a.studio_project_id);if(p===undefined)return 'not_checked';if(p===null)return 'missing';return p.project_id===a.studio_project_id&&p.association_id===a.association_id&&p.snapshot_sha256===a.snapshot.snapshot_sha256?'available':'unknown';}catch{return 'unknown';}
     })());
     return Promise.all(rows.map(async row=>({...row,studio_project_state:await states.get(row.association_id)!})));
   },
   independent:()=>runtime.launch(),deliver:workspace.deliver,receipt:workspace.receipt,deliveries:workspace.deliveries,copy:workspace.copy};
}

export function createPersonalReportStudioOwner(config:{origin():string;project(id:string):ReturnType<typeof createPersonalReportStudioWorkspace>}){
 const pending=new Map<string,Promise<ReportStudioOwnerDelivery>>(),unavailable=():ReportStudioOwnerValue=>({operation:'context',state:'unavailable',current_revision:null,return_url:null});
 function reject(code:string):never{throw Object.assign(Error(code),{code});}
 return async(raw:ReportStudioOwnerRequest):Promise<ReportStudioOwnerValue>=>{
  const request=parseReportStudioOwnerRequest(raw);let workspace:ReturnType<typeof createPersonalReportStudioWorkspace>;
  try{workspace=config.project(request.source.project_id);}catch(error){if(request.operation==='context'&&(error as {code?:string}).code==='RS_TARGET_UNAVAILABLE')return unavailable();throw error;}
  const a=workspace.sourceAssociation(request.source.task_id,request.source.revision);
  if(!a||a.state!=='ready')reject('RS_TARGET_UNAVAILABLE');
  if(a.association_id!==request.identity.association_id||a.studio_project_id!==request.identity.project_id||a.snapshot.snapshot_sha256!==request.identity.snapshot_sha256||Object.entries(a.snapshot.source).some(([key,value])=>Reflect.get(request.source,key)!==value))reject('RS_TARGET_CHANGED');
  const check=()=>{if(config.project(request.source.project_id)!==workspace)reject('RS_TARGET_CHANGED');};
  let value:ReportStudioOwnerValue;
  if(request.operation==='context'){
    const revision=workspace.currentRevision(request.source.task_id);if(revision===null)return unavailable();
    try{const source=workspace.catalog(request.source.task_id,request.source.revision).source;if(Object.entries(source).some(([key,value])=>Reflect.get(request.source,key)!==value))return unavailable();}
    catch(error){if(['RS_SOURCE_UNAVAILABLE','RS_REVISION_UNAVAILABLE'].includes((error as {code:string}).code))return unavailable();throw error;}
    const url=new URL(config.origin()+'/');url.searchParams.set('report-studio-project',request.source.project_id);url.searchParams.set('report-studio-task',request.source.task_id);url.searchParams.set('report-studio-revision',request.source.revision);
    value={operation:'context',state:revision===request.source.revision?'available':'updated',current_revision:revision,return_url:url.href};
  }else{
    const key=request.source.project_id+':'+a.association_id+':'+request.export_id;
    if(request.operation==='receipt'){
      const delivery=pending.has(key)?null:workspace.receipt(a.association_id,request.export_id!);value={operation:'receipt',state:pending.has(key)?'pending':delivery?'saved':'not_found',delivery};
    }else{
      let work=pending.get(key);
      if(!work){work=workspace.deliver(a.association_id,request.export_id!);pending.set(key,work);void work.then(()=>{if(pending.get(key)===work)pending.delete(key);},()=>{if(pending.get(key)===work)pending.delete(key);});}
      value={operation:'deliver',state:'saved',delivery:await work};
    }
  }
  check();return parseReportStudioOwnerValue(value,request);
 };
}

export async function readPersonalReportStudioDeployment(config:{resourcesRoot:string;userData:string}):Promise<{state:'not_bundled'|'invalid'}|{state:'configured';runtime:ReturnType<typeof createPersonalReportStudioRuntime>}>{
 try{
   if(!isAbsolute(config.resourcesRoot)||!isAbsolute(config.userData)||await realpath(config.resourcesRoot)!==resolve(config.resourcesRoot))return {state:'invalid'};
   const file=await open(join(config.resourcesRoot,'report-studio-deployment.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   let bytes:Buffer;
   try{const before=await file.stat();if(!before.isFile()||before.nlink!==1||before.size>4096)return {state:'invalid'};bytes=await file.readFile();const after=await file.stat();if(bytes.length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)return {state:'invalid'};}finally{await file.close();}
   const value=closed(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),['schema_version','module','bundle_relative_path','version','source_commit','protocol_version','manifest_sha256']);
   if(value.schema_version!=='1'||value.module!=='reports-factory'||value.bundle_relative_path!=='report-studio'||value.version!=='0.1.0-juanerai.1'||value.source_commit!=='74ebb609fd73cf263614ffc9301dafaafcec4230'||value.protocol_version!=='1'||typeof value.manifest_sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.manifest_sha256))return {state:'invalid'};
   return {state:'configured',runtime:createPersonalReportStudioRuntime({bundleRoot:join(config.resourcesRoot,'report-studio'),identity:{version:value.version,source_commit:value.source_commit,protocol_version:'1',manifest_sha256:value.manifest_sha256},dataRoot:join(config.userData,'report-studio')})};
 }catch(error){return {state:(error as NodeJS.ErrnoException).code==='ENOENT'?'not_bundled':'invalid'};}
}
