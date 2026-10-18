import {createPersonalDecisionWorkspace,type createPersonalDecisionRuntime} from './decision-platform.ts';
import {createPersonalReportStudioWorkspace,type createPersonalReportStudioRuntime} from './report-studio.ts';
import {createLocalOpenAnalysisStore} from '../../adapters/storage-local/open-analysis.ts';
import {createOpenDocumentSourceInspector,createOpenSelectedSourceInspector} from '../../adapters/analytics-duckdb/open-document-source.ts';
import {join,resolve} from 'node:path';
import {realpathSync,lstatSync} from 'node:fs';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {registerCreatedBrowserProject,reopenBrowserProject,listBrowserProjects,type BrowserProjectLease} from '../../adapters/storage-local/browser-project-origin.ts';
import {randomUUID} from 'node:crypto';
import {createFreshBrowserProjectStore,createReopenedBrowserProjectStore,fenceReopenedBrowserProject,createLocalDesktopRunEvidenceStore,createOpenMemberSourceStore} from '../../adapters/storage-local/desktop-state.ts';
import {createLocalMembershipTaskStore} from '../../adapters/storage-local/member-task.ts';
import {createMemberSourcePreparation} from '../../adapters/analytics-duckdb/member-source-inspection.ts';
import {createMeteredMembershipAnalysisExecution} from '../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../packages/application/xanthil-desktop-decision-case.ts';
import {createMembershipTaskApplication} from '../../packages/application/member-task.ts';
import {createMemberSourcesApplication} from '../../packages/application/member-sources.ts';
import {createMemberPreparationApplication} from '../../packages/application/member-preparation.ts';
import {createMembershipModelApplication,createMembershipWorkflow,createPreparedMembershipAnalysis} from '../../packages/application/member-model.ts';
import {createMembershipPolicyAccess} from '../../packages/application/provider-settings.ts';
import {createBrowserMembershipWorkspaceApplication,createOpenMemberCaseAdmission} from '../../packages/application/browser-membership.ts';
import {startBrowserMembershipServer} from '../../apps/browser/local-server.ts';
import type {MembershipPolicyStore,LocalModelAccess} from '../../packages/ports/provider-settings.ts';
import type {CaseAssistantRuntime} from '../../packages/ports/case-assistant.ts';
import {createPersonalOpenAnalysisWorkspace} from './open-analysis.ts';
export {createPersonalOpenAnalysisWorkspace};

/** Shared local project assembly; callers own transport and trusted path selection. */
export async function createPersonalBrowserMembershipWorkspace(config:{projectRoot:string;display_name:string;reportStudio?:ReturnType<typeof createPersonalReportStudioRuntime>;decisionPlatform?:ReturnType<typeof createPersonalDecisionRuntime>;originDirectory?:string;mode?:'create'|'reopen';toolchain:{pythonExecutable:string;pythonVersion:string;duckdbExecutable:string;duckdbVersion:string};model:{runtime?:CaseAssistantRuntime;createRuntime?:(context:Readonly<{projectRoot:string}>)=>CaseAssistantRuntime;access:LocalModelAccess;policy:MembershipPolicyStore};openModel?:Pick<Parameters<typeof createPersonalOpenAnalysisWorkspace>[0],'createRuntime'|'authorizeConfiguration'|'requireSemanticAssessment'|'metricAssetDisclosureAllowed'>&{inspect?:import('../../packages/ports/member-source.ts').MemberSourceInspector;documentReader?:{pythonExecutable:string;sofficeExecutable?:string;imageExecutable?:string}}}){
 const {projectRoot,toolchain}=config;let lease:BrowserProjectLease|undefined;let closing:Promise<{unresolved:number}>|null=null;
 if(config.mode==='reopen'){if(!config.originDirectory)throw Object.assign(new Error('EXISTING_PROJECT_ACTIVATION_CLOSED'),{code:'EXISTING_PROJECT_ACTIVATION_CLOSED'});lease=reopenBrowserProject(config.originDirectory,projectRoot);}
 const guard=<T extends object>(target:T,rejectClosed=false):T=>new Proxy({...target},{get(object,key){const value=Reflect.get(object,key);return typeof value==='function'?(...args:unknown[])=>{lease?.check();if(rejectClosed&&closing)throw Object.assign(Error('SERVICE_CLOSED'),{code:'SERVICE_CLOSED'});return Reflect.apply(value,object,args);}:value;}});
 try{
 const project_id=lease?.project_id??randomUUID(),desktopStore=guard(lease?createReopenedBrowserProjectStore(lease):createFreshBrowserProjectStore({projectRoot})),store=guard(createLocalMembershipTaskStore(projectRoot)),analysis=createMeteredMembershipAnalysisExecution(toolchain),preparationRuntime=createMemberSourcePreparation({pythonExecutable:toolchain.pythonExecutable,pythonVersion:toolchain.pythonVersion}),desktop=createXanthilDesktopDecisionCaseApplication({store:desktopStore,analysisExecution:analysis,runEvidenceStore:createLocalDesktopRunEvidenceStore({projectRoot}),assistanceRuntime:null,modelAccess:config.model.access,clock:()=>new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}:{at_epoch_ms:number;callback:()=>void}){const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
 await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:project_id,display_name:config.display_name});
 if(lease)fenceReopenedBrowserProject(lease);else if(config.originDirectory)lease=registerCreatedBrowserProject(config.originDirectory,projectRoot,project_id);
 const runtime=config.model.createRuntime?.({projectRoot})??config.model.runtime;if(!runtime)throw Object.assign(Error('RUNTIME_UNAVAILABLE'),{code:'RUNTIME_UNAVAILABLE'});
 const tasks=createMembershipTaskApplication({desktop,store,project_id}),policy=createMembershipPolicyAccess(config.model.policy,config.model.access),application=createMembershipModelApplication({store,runtime,modelAccess:config.model.access,policy:async()=>(await policy.read()).policy,preparation:createMemberPreparationApplication(store,preparationRuntime),advance:createPreparedMembershipAnalysis({store,desktop})}),workflow=createMembershipWorkflow(application),workspace=createBrowserMembershipWorkspaceApplication({store,tasks,project_id,sources:createMemberSourcesApplication(store,preparationRuntime.inspectSources),models:{policy,application,workflow}});
 const open=config.openModel?createPersonalOpenAnalysisWorkspace({...config.openModel,project_id,projectRoot,toolchain,inspect:config.openModel.inspect??(config.openModel.documentReader?createOpenSelectedSourceInspector({tables:preparationRuntime.inspectSources,documents:createOpenDocumentSourceInspector({...config.openModel.documentReader,projectRoot})}):preparationRuntime.inspectSources)}):undefined;
 const reportStudio=open&&config.reportStudio?guard(createPersonalReportStudioWorkspace({projectRoot,projectId:project_id,runtime:config.reportStudio,readTask:id=>{if(closing)throw Object.assign(Error('SERVICE_CLOSED'),{code:'SERVICE_CLOSED'});lease?.check();try{return open.read(id);}catch(error){if((error as {code?:string}).code==='NOT_FOUND')return null;throw error;}}}),true):undefined;
 const decisionPlatform=open&&config.decisionPlatform?guard(createPersonalDecisionWorkspace({projectRoot,projectId:project_id,runtime:config.decisionPlatform,check:()=>{lease?.check();if(closing)throw Error('SERVICE_CLOSED');},readTask:id=>{try{return open.read(id);}catch(error){if((error as {code?:string}).code==='NOT_FOUND')return null;throw error;}},reportCopy:open.reportCopy,...(reportStudio?{studio:reportStudio}:{})}),true):undefined;
 const memberOrigins=open?guard(createOpenMemberSourceStore({projectRoot}),true):undefined;
 const formalMember=open?createOpenMemberCaseAdmission({project_id,read:id=>{if(closing)throw Object.assign(Error('SERVICE_CLOSED'),{code:'SERVICE_CLOSED'});lease?.check();return open.read(id);},desktop,reviewStore:memberOrigins,findingForOrigin:id=>memberOrigins!.findingForOrigin(id),publishFinding:input=>{if(closing)throw Object.assign(Error('SERVICE_CLOSED'),{code:'SERVICE_CLOSED'});return memberOrigins!.publishFinding(input);},findingReceipt:id=>memberOrigins!.findingReceipt(id),readCurrentFacts:id=>{if(closing)throw Object.assign(Error('SERVICE_CLOSED'),{code:'SERVICE_CLOSED'});return memberOrigins!.currentFindingFacts(id);},persistSource:input=>memberOrigins!.admit(input)}):undefined;
 return {store,workspace,open,formalMember,reportStudio,decisionPlatform,project_id,async close(){if(closing)return closing;await decisionPlatform?.leave();closing=(async()=>{await open?.close();await workspace.closeWork?.();let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([workflow.collect(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);}finally{if(timer)clearTimeout(timer);}let unresolved=0;for(const task of await store.listBrowserTasks(project_id))unresolved+=(await store.readOperations({task_id:task.task_id})).totals.unresolved;lease?.close();return {unresolved};})();return closing;}};
 }catch(error){lease?.close();throw error;}
}

/** Retained desktop companion composes the same project with its listener. */
export async function createPersonalBrowserMembershipProfile(config:Parameters<typeof createPersonalBrowserMembershipWorkspace>[0]){
 const project=await createPersonalBrowserMembershipWorkspace(config);
 try{const server=await startBrowserMembershipServer({store:project.store,workspace:project.workspace,open:project.open,formalMember:project.formalMember});let closing:Promise<{unresolved:number}>|undefined;
 return {origin:server.origin,bootstrap:server.bootstrap,project_id:project.project_id,close(){return closing??=(async()=>{try{await server.close();}finally{return await project.close();}})();}};
 }catch(error){await project.close();throw error;}
}

/** One service reuses one active project; HTTP receives only opaque ids and display names. */
export async function createPersonalBrowserServiceWorkspace(config:Omit<Parameters<typeof createPersonalBrowserMembershipWorkspace>[0],'projectRoot'|'display_name'|'mode'|'originDirectory'>&{originDirectory:string;projectsRoot:string}){
 const reject=(code='INVALID_REQUEST'):never=>{throw Object.assign(new Error(code),{code});};
 for(const root of [config.originDirectory,config.projectsRoot])if(resolve(root)!==root||realpathSync(root)!==root||!lstatSync(root).isDirectory()||lstatSync(root).isSymbolicLink())reject();
 let current:Awaited<ReturnType<typeof createPersonalBrowserMembershipWorkspace>>|null=null,busy=false,closed=false;
 const studioOriginals=new Map<string,{root:string;workspace:ReturnType<typeof createPersonalReportStudioWorkspace>}>();
 function reportStudioOriginal(id:string){
  if(closed||!config.reportStudio||!membershipUuid(id))return reject('RS_TARGET_UNAVAILABLE');
  const registration=listBrowserProjects(config.originDirectory).find(project=>project.project_id===id);if(!registration)return reject('RS_TARGET_UNAVAILABLE');
  const cached=studioOriginals.get(id);if(cached){if(cached.root!==registration.root)return reject('RS_TARGET_CHANGED');return cached.workspace;}
  const root=registration.root,rootIdentity=lstatSync(root),store=createLocalOpenAnalysisStore({projectRoot:root});
  const check=()=>{
   if(closed)return reject('RS_TARGET_UNAVAILABLE');const match=listBrowserProjects(config.originDirectory).find(project=>project.project_id===id&&project.root===root);if(!match)return reject('RS_TARGET_UNAVAILABLE');
   const identity=lstatSync(root);if(identity.dev!==rootIdentity.dev||identity.ino!==rootIdentity.ino||identity.isSymbolicLink())return reject('RS_TARGET_CHANGED');
  };
  const target=createPersonalReportStudioWorkspace({projectRoot:root,projectId:id,runtime:config.reportStudio,readTask:taskId=>{check();return store.read(taskId);}});
  const workspace=new Proxy(target,{get(object,key){const value=Reflect.get(object,key);if(typeof value!=='function')return value;return(...args:unknown[])=>{check();const result=Reflect.apply(value,object,args);if(result instanceof Promise)return result.then(value=>{check();return value;});check();return result;};}});
  studioOriginals.set(id,{root,workspace});return workspace;
 }
 const projectView=(p:{project_id:string;display_name:string})=>({project_id:p.project_id,display_name:p.display_name});
 const proxy=<T extends object>(part:'store'|'workspace'|'open'|'formalMember')=>new Proxy({} as T,{get(_target,key){return (...args:unknown[])=>{if(!current||closed){if(part==='workspace'&&key==='closeWork')return;return reject('PROJECT_REQUIRED');}const target=current[part];if(!target)return reject('RUNTIME_UNAVAILABLE');const method=Reflect.get(target,key);if(typeof method!=='function')return reject();return Reflect.apply(method,target,args);};}});
 async function projects(){return {projects:listBrowserProjects(config.originDirectory).map(projectView),current:current?.project_id??null};}
 async function select(raw:unknown){
  if(closed||busy)reject('PROJECT_BUSY');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))reject();const r=raw as Record<string,unknown>,creating=Object.hasOwn(r,'name');
  if(Object.keys(r).sort().join()!==(creating?'command_id,name,version':'command_id,project_id,version')||r.version!=='1.0'||!membershipUuid(r.command_id))reject();
  if(creating&&(typeof r.name!=='string'||!r.name.trim()||r.name!==r.name.trim()||r.name.length>120||/[\\/\x00-\x1f]/.test(r.name)||r.name==='.'||r.name==='..'))reject();
  if(!creating&&!membershipUuid(r.project_id))reject();
  busy=true;try{
   const entries=listBrowserProjects(config.originDirectory),root=creating?join(config.projectsRoot,String(r.command_id)):null;
   const registered=entries.find(p=>creating?p.root===root:p.project_id===r.project_id);
   if(!creating&&!registered)reject('PROJECT_NOT_FOUND');
   if(creating&&registered&&registered.display_name!==r.name)reject('COMMAND_CONFLICT');
   if(current&&registered?.project_id===current.project_id)return projectView(registered);
   if(current){if(current.open?.physicalPending())reject('PROJECT_BUSY');if(current.open?.list().some(t=>['running','unknown'].includes(t.state)))reject('PROJECT_BUSY');for(const task of await current.store.listBrowserTasks(current.project_id)){const operations=await current.store.readOperations({task_id:task.task_id});if(operations.totals.unresolved>0)reject('PROJECT_BUSY');}await current.close();current=null;}
   current=await createPersonalBrowserMembershipWorkspace({...config,projectRoot:registered?.root??root!,display_name:registered?.display_name??String(r.name),mode:registered?'reopen':'create'});
   return {project_id:current.project_id,display_name:registered?.display_name??String(r.name)};
  }finally{busy=false;}
 }
 return {projects,select,researchContext(projectId:string,taskId:string){const selected=current;if(closed||!selected?.open||selected.project_id!==projectId||!membershipUuid(taskId))return reject('DR_TASK_UNAVAILABLE');const registration=listBrowserProjects(config.originDirectory).find(p=>p.project_id===projectId);if(!registration)return reject('DR_TASK_UNAVAILABLE');const check=()=>{if(closed||current!==selected)reject('DR_TASK_CHANGED');selected.open!.read(taskId);};check();return {root:registration.root,projectId,taskId,check};},decisionProject(id:string){const selected=current;if(closed||selected?.project_id!==id||!selected.decisionPlatform)return reject('DP_TARGET_CHANGED');return selected.decisionPlatform;},reportStudioOriginal,reportStudioProject(id:string){const selected=current,studio=selected?.reportStudio;if(closed||!selected||selected.project_id!==id||!studio)return reject('RS_TARGET_CHANGED');return studio;},async receipt(id:string){if(!membershipUuid(id))reject();const found=listBrowserProjects(config.originDirectory).find(p=>p.root===join(config.projectsRoot,id));return found?projectView(found):null;},store:proxy<import('../../packages/ports/browser-membership.ts').BrowserMembershipReadback>('store'),workspace:proxy<import('../../packages/ports/browser-membership.ts').BrowserWorkspaceCommands>('workspace'),open:config.openModel?proxy<ReturnType<typeof createPersonalOpenAnalysisWorkspace>>('open'):undefined,formalMember:config.openModel?proxy<ReturnType<typeof createOpenMemberCaseAdmission>>('formalMember'):undefined,async close(){if(closed)return;closed=true;await current?.close();current=null;studioOriginals.clear();}};
}
