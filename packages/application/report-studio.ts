import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
import {membershipUuid} from '../product-core/member-analysis.ts';
import {taskHash} from '../product-core/member-task.ts';
import {reportStudioMaterialCatalog, selectReportStudioMaterials} from './report-studio-source.ts';
import type {ReportStudioStore, ReportStudioGateway, ReportStudioAssociation, ReportStudioProjectIdentity} from '../ports/report-studio.ts';

function fail(code:string):never {throw Object.assign(new Error(code),{code});}
/** Host owns source and delivery; Studio owns editable work and its execution. */
export function createReportStudioWorkspace(config: {projectId:string;readTask(task_id:string):OpenStoredTask|null;store:ReportStudioStore;studio:ReportStudioGateway;newId():string;now():string}) {
  function catalog(task_id:string,revision:string) {
    if(!membershipUuid(task_id))fail('RS_SOURCE_UNAVAILABLE');
    const task=config.readTask(task_id);if(!task||task.identity.task_id!==task_id)fail('RS_SOURCE_UNAVAILABLE');
    return reportStudioMaterialCatalog(config.projectId,task,revision);
  }
  function association(id:string) {
    if(!membershipUuid(id))fail('RS_NOT_FOUND');
    const a=config.store.association(id);if(!a)fail('RS_NOT_FOUND');return a;
  }
  function target(a:ReportStudioAssociation) {
    const source=a.snapshot.source;
    const task=config.readTask(source.task_id);if(!task)fail('RS_TARGET_UNAVAILABLE');
    let current;
    try {current=reportStudioMaterialCatalog(config.projectId,task,source.revision);}catch{fail('RS_TARGET_UNAVAILABLE');}
    if(taskHash(current.source)!==taskHash(source))fail('RS_TARGET_CHANGED');
  }
  function sameProject(a:ReportStudioAssociation,p:ReportStudioProjectIdentity|null) {
    if(!p||p.project_id!==a.studio_project_id||p.association_id!==a.association_id||p.snapshot_sha256!==a.snapshot.snapshot_sha256)fail('RS_STUDIO_PROJECT_UNAVAILABLE');
  }
  async function continueProject(id:string):Promise<ReportStudioAssociation> {
    const a=association(id);target(a);
    if(a.state==='pending') {
      const project=await config.studio.ensureProject(a);sameProject(a,project);target(a);
      return config.store.ready(a.association_id);
    }
    sameProject(a,await config.studio.project(a.studio_project_id));target(a);return a;
  }
  async function open(task_id:string,revision:string,selected:readonly string[]) {
    const snapshot=selectReportStudioMaterials(catalog(task_id,revision),selected);
    let a=config.store.sourceAssociation(task_id,revision);
    if(a&&a.snapshot.snapshot_sha256!==snapshot.snapshot_sha256)fail('RS_ASSOCIATION_CONFLICT');
    if(!a) {
      const id=config.newId();
      a=config.store.prepare({association_id:id,studio_project_id:'proj_'+id.replaceAll('-',''),created_at:config.now(),snapshot});
    }
    return continueProject(a.association_id);
  }
  async function deliver(id:string,export_id:string) {
    const a=association(id), prior=config.store.delivery(id,export_id);
    // This is also recovery from a lost commit reply: read original bytes, never resubmit.
    if(prior)return config.store.copy(prior.delivery_id).record;
    if(a.state!=='ready')fail('RS_PROJECT_NOT_READY');target(a);
    sameProject(a,await config.studio.project(a.studio_project_id));
    const artifact=await config.studio.savedExport(a.studio_project_id,export_id);
    if(!artifact||artifact.project_id!==a.studio_project_id||artifact.export_id!==export_id)fail('RS_EXPORT_INVALID');
    target(a);
    const saved=config.store.deliver({delivery_id:config.newId(),association_id:id,export_id,format:artifact.format,created_at:artifact.created_at,
      artifact_sha256:artifact.artifact_sha256,bytes:artifact.content.byteLength,warnings:artifact.warnings},artifact.content);
    return config.store.copy(saved.delivery_id).record;
  }
  return {catalog,open,continueProject,deliver,
    receipt:(id:string,export_id:string)=>{association(id);const saved=config.store.delivery(id,export_id);return saved?config.store.copy(saved.delivery_id).record:null;},
    deliveries:(task_id:string)=>config.store.deliveries(task_id),copy:(delivery_id:string)=>config.store.copy(delivery_id)};
}
