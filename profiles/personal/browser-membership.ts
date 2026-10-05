import {join,resolve} from 'node:path';
import {realpathSync,lstatSync} from 'node:fs';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {registerCreatedBrowserProject,reopenBrowserProject,listBrowserProjects,type BrowserProjectLease} from '../../adapters/storage-local/browser-project-origin.ts';
import {randomUUID} from 'node:crypto';
import {createFreshBrowserProjectStore,createReopenedBrowserProjectStore,fenceReopenedBrowserProject,createLocalDesktopRunEvidenceStore} from '../../adapters/storage-local/desktop-state.ts';
import {createLocalMembershipTaskStore} from '../../adapters/storage-local/member-task.ts';
import {createMemberSourcePreparation} from '../../adapters/analytics-duckdb/member-source-inspection.ts';
import {createMeteredMembershipAnalysisExecution} from '../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../packages/application/xanthil-desktop-decision-case.ts';
import {createMembershipTaskApplication} from '../../packages/application/member-task.ts';
import {createMemberSourcesApplication} from '../../packages/application/member-sources.ts';
import {createMemberPreparationApplication} from '../../packages/application/member-preparation.ts';
import {createMembershipModelApplication,createMembershipWorkflow,createPreparedMembershipAnalysis} from '../../packages/application/member-model.ts';
import {createMembershipPolicyAccess} from '../../packages/application/provider-settings.ts';
import {createBrowserMembershipWorkspaceApplication} from '../../packages/application/browser-membership.ts';
import {startBrowserMembershipServer} from '../../apps/browser/local-server.ts';
import type {MembershipPolicyStore,LocalModelAccess} from '../../packages/ports/provider-settings.ts';
import type {CaseAssistantRuntime} from '../../packages/ports/case-assistant.ts';

/** Shared local project assembly; callers own transport and trusted path selection. */
export async function createPersonalBrowserMembershipWorkspace(config:{projectRoot:string;display_name:string;originDirectory?:string;mode?:'create'|'reopen';toolchain:{pythonExecutable:string;pythonVersion:string;duckdbExecutable:string;duckdbVersion:string};model:{runtime:CaseAssistantRuntime;access:LocalModelAccess;policy:MembershipPolicyStore}}){
 const {projectRoot,toolchain}=config;let lease:BrowserProjectLease|undefined;
 if(config.mode==='reopen'){if(!config.originDirectory)throw Object.assign(new Error('EXISTING_PROJECT_ACTIVATION_CLOSED'),{code:'EXISTING_PROJECT_ACTIVATION_CLOSED'});lease=reopenBrowserProject(config.originDirectory,projectRoot);}
 const guard=<T extends object>(target:T):T=>new Proxy({...target},{get(object,key){const value=Reflect.get(object,key);return typeof value==='function'?(...args:unknown[])=>{lease?.check();return Reflect.apply(value,object,args);}:value;}});
 try{
 const project_id=lease?.project_id??randomUUID(),desktopStore=guard(lease?createReopenedBrowserProjectStore(lease):createFreshBrowserProjectStore({projectRoot})),store=guard(createLocalMembershipTaskStore(projectRoot)),analysis=createMeteredMembershipAnalysisExecution(toolchain),preparationRuntime=createMemberSourcePreparation({pythonExecutable:toolchain.pythonExecutable,pythonVersion:toolchain.pythonVersion}),desktop=createXanthilDesktopDecisionCaseApplication({store:desktopStore,analysisExecution:analysis,runEvidenceStore:createLocalDesktopRunEvidenceStore({projectRoot}),assistanceRuntime:null,modelAccess:config.model.access,clock:()=>new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}:{at_epoch_ms:number;callback:()=>void}){const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
 await desktop.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:project_id,display_name:config.display_name});
 if(lease)fenceReopenedBrowserProject(lease);else if(config.originDirectory)lease=registerCreatedBrowserProject(config.originDirectory,projectRoot,project_id);
 const tasks=createMembershipTaskApplication({desktop,store,project_id}),policy=createMembershipPolicyAccess(config.model.policy,config.model.access),application=createMembershipModelApplication({store,runtime:config.model.runtime,modelAccess:config.model.access,policy:async()=>(await policy.read()).policy,preparation:createMemberPreparationApplication(store,preparationRuntime),advance:createPreparedMembershipAnalysis({store,desktop})}),workflow=createMembershipWorkflow(application),workspace=createBrowserMembershipWorkspaceApplication({store,tasks,project_id,sources:createMemberSourcesApplication(store,preparationRuntime.inspectSources),models:{policy,application,workflow}});
 let closing:Promise<{unresolved:number}>|null=null;
 return {store,workspace,project_id,async close(){if(closing)return closing;closing=(async()=>{await workspace.closeWork?.();let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([workflow.collect(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);}finally{if(timer)clearTimeout(timer);}let unresolved=0;for(const task of await store.listBrowserTasks(project_id))unresolved+=(await store.readOperations({task_id:task.task_id})).totals.unresolved;lease?.close();return {unresolved};})();return closing;}};
 }catch(error){lease?.close();throw error;}
}

/** Retained desktop companion composes the same project with its listener. */
export async function createPersonalBrowserMembershipProfile(config:Parameters<typeof createPersonalBrowserMembershipWorkspace>[0]){
 const project=await createPersonalBrowserMembershipWorkspace(config);
 try{const server=await startBrowserMembershipServer({store:project.store,workspace:project.workspace});let closing:Promise<{unresolved:number}>|undefined;
 return {origin:server.origin,bootstrap:server.bootstrap,project_id:project.project_id,close(){return closing??=(async()=>{try{await server.close();}finally{return await project.close();}})();}};
 }catch(error){await project.close();throw error;}
}

/** One service reuses one active project; HTTP receives only opaque ids and display names. */
export async function createPersonalBrowserServiceWorkspace(config:Omit<Parameters<typeof createPersonalBrowserMembershipWorkspace>[0],'projectRoot'|'display_name'|'mode'|'originDirectory'>&{originDirectory:string;projectsRoot:string}){
 const reject=(code='INVALID_REQUEST'):never=>{throw Object.assign(new Error(code),{code});};
 for(const root of [config.originDirectory,config.projectsRoot])if(resolve(root)!==root||realpathSync(root)!==root||!lstatSync(root).isDirectory()||lstatSync(root).isSymbolicLink())reject();
 let current:Awaited<ReturnType<typeof createPersonalBrowserMembershipWorkspace>>|null=null,busy=false,closed=false;
 const projectView=(p:{project_id:string;display_name:string})=>({project_id:p.project_id,display_name:p.display_name});
 const proxy=<T extends object>(part:'store'|'workspace')=>new Proxy({} as T,{get(_target,key){return (...args:unknown[])=>{if(!current||closed){if(part==='workspace'&&key==='closeWork')return;return reject('PROJECT_REQUIRED');}const target=current[part];const method=Reflect.get(target,key);if(typeof method!=='function')return reject();return Reflect.apply(method,target,args);};}});
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
   if(current){for(const task of await current.store.listBrowserTasks(current.project_id)){const operations=await current.store.readOperations({task_id:task.task_id});if(operations.totals.unresolved>0)reject('PROJECT_BUSY');}await current.close();current=null;}
   current=await createPersonalBrowserMembershipWorkspace({...config,projectRoot:registered?.root??root!,display_name:registered?.display_name??String(r.name),mode:registered?'reopen':'create'});
   return {project_id:current.project_id,display_name:registered?.display_name??String(r.name)};
  }finally{busy=false;}
 }
 return {projects,select,async receipt(id:string){if(!membershipUuid(id))reject();const found=listBrowserProjects(config.originDirectory).find(p=>p.root===join(config.projectsRoot,id));return found?projectView(found):null;},store:proxy<import('../../packages/ports/browser-membership.ts').BrowserMembershipReadback>('store'),workspace:proxy<import('../../packages/ports/browser-membership.ts').BrowserWorkspaceCommands>('workspace'),async close(){if(closed)return;closed=true;await current?.close();current=null;}};
}
