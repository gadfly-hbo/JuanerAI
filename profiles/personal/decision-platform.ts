import {randomUUID} from 'node:crypto';
import {createDecisionPlatformProcess,type DecisionProcessConfig} from '../../adapters/decision-platform/process.ts';
import {createDecisionStore} from '../../adapters/decision-platform/store.ts';
import {createDecisionGateway} from '../../adapters/decision-platform/gateway.ts';
import {createDecisionEffectsGateway} from '../../adapters/decision-platform/effects-gateway.ts';
import {createDecisionMaterialPolicy} from '../../adapters/decision-platform/material-policy.ts';
import {createDecisionRuntimeAuthorization} from '../../adapters/decision-platform/runtime-authorization.ts';
import {calibrationDigest,readRuntimeState} from '../../adapters/decision-platform/extraction-scope.ts';
import {createDecisionWorkspace} from '../../packages/application/decision-platform.ts';
import {createDecisionEffects} from '../../packages/application/decision-effects.ts';
import {createDecisionSources} from '../../packages/application/decision-sources.ts';
import type {DecisionRecipient,DecisionMaterialScope,DecisionCommand,SavedDecisionReport} from '../../packages/ports/decision-platform.ts';
const key=(s:SavedDecisionReport)=>JSON.stringify(s);
type Board=Record<string,unknown>&{project:{id:string;title:string;purpose:string};actionItems:Record<string,unknown>[];reports:Record<string,unknown>[]};
export function createPersonalDecisionRuntime(config:Omit<DecisionProcessConfig,'authorize'|'canStop'>&{recipients:readonly DecisionRecipient[];verifyMaterials():Promise<void>;history?:{board(id:string):unknown;projects():unknown}}){
 const projects=new Map<string,{authorize:ReturnType<typeof createDecisionRuntimeAuthorization>;pending():boolean;revoke():void}>();
 const process=createDecisionPlatformProcess({...config,authorize:async r=>{for(const p of projects.values())if(await p.authorize.authorize(r))return true;return false;},canStop:async()=>![...projects.values()].some(p=>p.pending())});
 async function historical(kind:'board'|'projects',id?:string):Promise<unknown>{
  if(process.state()!=='unknown'){try{if(process.state()!=='ready')await config.verifyMaterials();const live=await process.start();return kind==='board'?live.readBoard(id!):live.readProjects();}catch(error){if(process.state()!=='unknown')throw error;}}
  if(!config.history)throw Error('DP_PROCESS_UNKNOWN');await config.verifyMaterials();return kind==='board'?config.history.board(id!):config.history.projects();
 }
 return {recipients:structuredClone(config.recipients),dataRoot:config.dataRoot,
  readBoard:(id:string)=>historical('board',id),readProjects:()=>historical('projects'),
  async inspectState(id:string){if(process.state()==='unknown')return {...readRuntimeState(config.dataRoot,id),active:false,unknown:true};if(process.state()!=='ready')await config.verifyMaterials();return(await process.start()).runtimeState(id);},
  async start(){if(process.state()!=='ready')await config.verifyMaterials();return process.start();},
  attach(id:string,value:{authorize:ReturnType<typeof createDecisionRuntimeAuthorization>;pending():boolean;revoke():void}){projects.get(id)?.revoke();projects.set(id,value);},
  async close(){await process.close();for(const p of projects.values())p.revoke();},
  state:process.state,
 };
}
export function createPersonalDecisionWorkspace(config:Parameters<typeof createDecisionSources>[0]&{projectRoot:string;runtime:ReturnType<typeof createPersonalDecisionRuntime>;check():void}){
 const sources=createDecisionSources(config),store=createDecisionStore(config),authority=createDecisionRuntimeAuthorization(store),grants=new Map<string,ReturnType<ReturnType<typeof createDecisionMaterialPolicy>['grant']>>(),tasks=new Set<string>(),runtime=config.runtime;
 const session=()=>{config.check();return runtime.start();};
 const readBoard=async(projectId:string)=>{const board=await runtime.readBoard(projectId) as Board;config.check();return board;};
 async function teach(taskId:string){const p=store.binding(taskId)?.pluginProjectId;if(!p)return undefined;const b=await readBoard(p);
  // Fixed upstream projection supplies the exact calibration snapshot; do not reconstruct it in host business code.
  if(!Object.hasOwn(b,'hostCalibration'))throw Error('DP_TEACH_UNAVAILABLE');return b.hostCalibration;
 }
 async function scope(source:SavedDecisionReport):Promise<DecisionMaterialScope>{return {report:source,teachSha256:calibrationDigest(await teach(source.taskId)),recipients:runtime.recipients};}
 async function authorize(source:SavedDecisionReport,pluginProjectId:string|null){config.check();if(!grants.get(key(source))?.allows(await scope(source)))throw Error('DP_PERMISSION_REQUIRED');if(pluginProjectId){const state=await runtime.inspectState(pluginProjectId);if(state.active||state.unknown)throw Error('DP_BUSY_OR_UNKNOWN');}}
 const gateway={async findProject(marker:string){return(await access()).findProject!(marker);},async createProject(title:string,marker:string){return(await access()).createProject(title,marker);},async project(id:string){return(await access()).project(id);},async uploadReport(p:string,n:string,c:Uint8Array){return(await access()).uploadReport(p,n,c);},async report(p:string,n:string){return(await access()).report(p,n);}};
 async function access(){if(runtime.state()==='idle')await session();return createDecisionGateway({dataRoot:runtime.dataRoot,projects:()=>runtime.readProjects(),board:readBoard,request:async(...args)=>(await session()).request(...args)});}
 const workspace=createDecisionWorkspace({projectId:config.projectId,store,gateway,authorize,newId:randomUUID,now:()=>new Date().toISOString(),prepareExtraction:async link=>{const grant=grants.get(key(link.source));if(!grant)throw Error('DP_PERMISSION_REQUIRED');authority.permit(link.id,grant);}});
 const effects=createDecisionEffects({store,gateway:createDecisionEffectsGateway({store,board:readBoard,state:async p=>runtime.inspectState(p),request:async(...args)=>(await session()).request(...args)}),now:()=>new Date().toISOString(),authorize:async(taskId,command)=>{config.check();if(!config.readTask(taskId))throw Error('DP_SOURCE_MISSING');if(command.type==='extract'){const saved=store.report(command.reportLinkId);if(!saved||saved.link.source.taskId!==taskId)throw Error('DP_SOURCE_MISSING');await authorize(saved.link.source,store.binding(taskId)?.pluginProjectId??null);const grant=grants.get(key(saved.link.source));if(!grant)throw Error('DP_PERMISSION_REQUIRED');authority.permit(saved.link.id,grant);}}});
 runtime.attach(config.projectId,{authorize:authority,pending:()=>store.bindings().some(b=>store.pending(b.taskId).length>0),revoke(){for(const g of grants.values())g.revoke();grants.clear();}});
 return {projectId:config.projectId,
  async leave(){for(const b of store.bindings())if(runtime.state()!=='idle'&&b.pluginProjectId&&(await runtime.inspectState(b.pluginProjectId)).active)throw Error('DP_BUSY_OR_UNKNOWN');for(const g of grants.values())g.revoke();grants.clear();},
  catalog(taskId:string){config.check();tasks.add(taskId);return sources.catalog(taskId);},
  async permission(taskId:string,selectionId:string){config.check();const {selection}=sources.selected(selectionId,taskId);const value=await scope(selection.source);return {selection,scope:value,allowed:grants.get(key(selection.source))?.allows(value)??false};},
  async grant(taskId:string,selectionId:string,expected:DecisionMaterialScope){config.check();const {selection}=sources.selected(selectionId,taskId),current=await scope(selection.source);if(JSON.stringify(expected)!==JSON.stringify(current))throw Error('DP_PERMISSION_CHANGED');grants.set(key(selection.source),createDecisionMaterialPolicy().grant({...current,expiresAt:Number.MAX_SAFE_INTEGER}));return {allowed:true};},
  revoke(taskId:string){config.check();for(const [k,g] of grants)if(JSON.parse(k).taskId===taskId){g.revoke();grants.delete(k);}return {allowed:false};},
  async send(taskId:string,selectionId:string,operationId:string){config.check();tasks.add(taskId);const {selection,content}=sources.selected(selectionId,taskId);return workspace.send({operationId,source:selection.source,content,title:selection.title});},
  async board(taskId:string){config.check();tasks.add(taskId);const binding=store.binding(taskId),reports=store.reports(taskId),operations=store.pending(taskId);if(!binding?.pluginProjectId)return {view:null,reports,operations,state:{active:false,unknown:operations.length>0}};
   const raw=await readBoard(binding.pluginProjectId),{hostCalibration,...view}=raw;void hostCalibration;
   view.project={...raw.project,purpose:'讨论分析结论，记录决定与执行反馈'};view.modelChain={available:runtime.recipients.length>0,providers:runtime.recipients.map(r=>({provider:r.provider,model:r.model}))};
   const state=await runtime.inspectState(binding.pluginProjectId);return {view,reports,operations,state:{active:state.active,unknown:state.unknown||operations.length>0}};},
  write(taskId:string,operationId:string,command:DecisionCommand){config.check();tasks.add(taskId);return effects.write(operationId,taskId,command);},
  reconcile(taskId:string,operationId:string){config.check();const op=store.intent(operationId);if(!op||op.taskId!==taskId)throw Error('DP_OPERATION_CONFLICT');return op.kind==='project'?workspace.reconcileProject(operationId):op.kind==='upload'?workspace.reconcile(operationId):effects.reconcile(operationId);},
 };
}
