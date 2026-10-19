import {withLongAnalysisArtifacts} from '../../packages/application/open-analysis-long-artifact.ts';
import {createLocalAnalysisDraftStore} from '../../adapters/storage-local/open-analysis-draft.ts';
import {join} from 'node:path';
import {createProjectMetricAssetStore} from '../../adapters/storage-local/metric-assets.ts';
import {setImmediate as yieldIO} from 'node:timers/promises';
import {createOpenAnalysisDelegation} from '../../packages/application/open-analysis-delegation.ts';
import {randomUUID} from 'node:crypto';
import {createLocalCaseAssistantStore} from '../../adapters/storage-local/case-assistant.ts';
import {createOpenAnalysisCollaborationSource} from '../../adapters/storage-local/open-analysis-collaboration.ts';
import {createOpenAnalysisCollaborationRuntime} from '../../adapters/agent-pi/open-analysis-collaboration.ts';
import {createCaseAssistantApplication} from '../../packages/application/case-assistant.ts';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import {createLocalOpenAnalysisCodeExecution} from '../../adapters/analytics-duckdb/open-analysis-code.ts';
import {createLocalOpenMembershipExecution} from '../../adapters/analytics-duckdb/open-membership.ts';
import {createOpenAnalysisWorkspace} from '../../packages/application/open-analysis-workspace.ts';
import {createLocalOpenAnalysisStore} from '../../adapters/storage-local/open-analysis.ts';
import {createLocalAnalysisRequestLedger} from '../../adapters/storage-local/analysis-request-ledger.ts';
import {verifyOpenAnalysisIntegerSum} from '../../adapters/analytics-duckdb/open-analysis-verification.ts';
import type {OpenAnalysisRuntime} from '../../packages/ports/open-analysis-runtime.ts';
import type {AnalysisRequestLedger} from '../../packages/ports/analysis-request-ledger.ts';
import type {MemberSourceInspector} from '../../packages/ports/member-source.ts';
export function createPersonalOpenAnalysisWorkspace(config:{longArtifacts?:Readonly<{enabled:(task:string)=>boolean;reportMs:(task:string)=>60000|120000}>;onFailure?:(code:string)=>void;judgmentReview?:boolean;metricAssetDisclosureAllowed?:boolean;requireSemanticAssessment?:boolean;project_id?:string;toolchain?:{pythonExecutable:string;pythonVersion:string;duckdbExecutable?:string;duckdbVersion?:string};projectRoot:string;runtime?:OpenAnalysisRuntime;createRuntime?:(ledger:AnalysisRequestLedger,context:Readonly<{projectRoot:string;reviewPolicyForTask:(task_id:string)=>boolean}>)=>OpenAnalysisRuntime;inspect:MemberSourceInspector;authorizeConfiguration:()=>Promise<{config_sha256:string}>}){
 const ledger=createLocalAnalysisRequestLedger({projectRoot:config.projectRoot}),store=createLocalOpenAnalysisStore({projectRoot:config.projectRoot});
 const baseRuntime=config.runtime??config.createRuntime?.(ledger,{projectRoot:config.projectRoot,reviewPolicyForTask:id=>store.read(id)?.review_policy==='conclusion_strategy_v1'})??fail('RUNTIME_UNAVAILABLE');
 const runtime=config.longArtifacts?withLongAnalysisArtifacts({runtime:baseRuntime,store:createLocalAnalysisDraftStore({root:join(config.projectRoot,'.juanerai','analysis-drafts-v1')}),...config.longArtifacts}):baseRuntime;
 const project_id=config.project_id??randomUUID(),source=createOpenAnalysisCollaborationSource({project_id,store,allowQualifiedSteps:true,modelEvidenceView:runtime.selectedMaterialRead==='v1'});
 const collaborationStore=createLocalCaseAssistantStore({projectRoot:config.projectRoot,openSource:source.read,collaborationPolicy:'open_analysis_v13'});
 const recovery=collaborationStore.interruptAll(new Date().toISOString());
 let delegation:ReturnType<typeof createOpenAnalysisDelegation>;
 const childRuntime=createOpenAnalysisCollaborationRuntime({runtime,authorizeSource:owner=>!!source.read(owner)?.eligible,collaboration:id=>delegation.child(id)});
 const assistant=createCaseAssistantApplication({store:collaborationStore,runtime:childRuntime,collaborationPolicy:'open_analysis_v13',openTaskIdentity:owner=>{const task=store.read(owner.case_id);if(!task||!['running','saved'].includes(task.state)||task.pending_stop_epoch!==null)fail('AUTHORITY_REQUIRED');return task.identity;},clock:()=>new Date(),config:{provider:'minimax-cn',model:'MiniMax-M3',authorized:true,consumption_policy:'uncapped_metered',authorized_recipients:[{provider:'minimax-cn',model:'MiniMax-M3'},{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'}],runtime_id:'pi',runtime_version:runtime.historyOwnership==='runtime'?'0.86.1':'0.84.2',adapter_version:runtime.historyOwnership==='runtime'?'sdk041-native-1.0':'1.1',limits:{turns:1,execution_ms:1,waiting_ms:86400000,cost_microunits:1,turn_cost_microunits:1,currency:'USD'}}});
 delegation=createOpenAnalysisDelegation({store,assistant,source,project_id,importHistory:(id,value)=>collaborationStore.importOpenHistory(id,value,new Date().toISOString())});
 const metricAssets=createProjectMetricAssetStore({projectRoot:config.projectRoot,projectId:project_id});
 const workspace=createOpenAnalysisWorkspace({...config,metricAssets,collaboration:delegation.root,beforeResume,readSavedReportOpinions:async identity=>{await recovery;const current=store.read(identity.task_id);if(!current||current.state!=='saved'||current.pending_stop_epoch!==null||taskHash(current.identity)!==taskHash(identity))fail('AUTHORIZATION_STALE');await beforeResume(identity.task_id);return delegation.root.results(identity);},reviewReport:true,numericReport:true,executeMembership:config.toolchain?.duckdbExecutable&&config.toolchain.duckdbVersion?createLocalOpenMembershipExecution({...config.toolchain,duckdbExecutable:config.toolchain.duckdbExecutable,duckdbVersion:config.toolchain.duckdbVersion}):undefined,executeCode:config.toolchain?createLocalOpenAnalysisCodeExecution({...config.toolchain,projectRoot:config.projectRoot}):undefined,store,ledger,runtime,verify:verifyOpenAnalysisIntegerSum});
 function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
 function linkCommand(command:string){const d=taskHash({purpose:'open-collaboration-parent',command});return `${d.slice(0,8)}-${d.slice(8,12)}-4${d.slice(13,16)}-a${d.slice(17,20)}-${d.slice(20,32)}`;}
 async function assertChild(task_id:string,id:string){const relation=await collaborationStore.readChild(id);if(!relation||relation.source.open_origin?.task_id!==task_id)fail('NOT_FOUND');return relation;}
 const stopping=new Set<Promise<void>>();
 async function stopFamily(task_id:string){await recovery;for(const session of await assistant.list(project_id)){if(session.source.case_id===task_id&&!await assistant.isChild(session.id))await assistant.closeSession(session.id,true);}await runtime.collect?.(task_id);}
 function stop(task_id:string){const current=workspace.stop(task_id);const issued=stopFamily(task_id).finally(()=>stopping.delete(issued));stopping.add(issued);return current;}
 async function beforeResume(task_id:string){await Promise.all([...stopping]);const current=store.read(task_id);if(!current)fail('NOT_FOUND');for(const session of await assistant.list(project_id)){if(session.source.case_id!==task_id||await assistant.isChild(session.id))continue;const p=await assistant.readParent(session.id);if(p.source.open_origin?.run_id!==current.identity.run_id)continue;if(!p.lifecycle.open)await assistant.reopenSession(session.id,p.lifecycle.epoch);}}
 async function collect(){await workspace.collect();await Promise.all([...stopping]);}
 async function collaboration(task_id:string){
  await recovery;await yieldIO();const current=workspace.read(task_id),parents=[];
  for(const session of await assistant.list(project_id)){await yieldIO();if(await assistant.isChild(session.id))continue;const p=await assistant.readParent(session.id);if(p.source.open_origin?.task_id!==task_id||p.source.open_origin.run_id!==current.identity.run_id)continue;
   const children:Awaited<ReturnType<typeof assistant.readCollaboration>>[]=[];
   async function descend(parent:string){for(const relation of (await assistant.readParent(parent)).children){await yieldIO();children.push(await assistant.readCollaboration(relation.child_session_id));await descend(relation.child_session_id);}}
   await descend(session.id);
   const trace={created:[] as import('../../packages/ports/open-analysis-runtime.ts').AnalysisCollaborationTrace['created'][number][],consumed:[] as import('../../packages/ports/open-analysis-runtime.ts').AnalysisCollaborationTrace['consumed'][number][],unavailable:[] as string[],human_created:[] as string[]};
   const authorize=()=>{const latest=store.read(task_id);return !!latest&&latest.identity.run_id===current.identity.run_id&&latest.identity.scope_sha256===current.identity.scope_sha256;};
   if(runtime.collaborationTrace)for(const conversation_id of [undefined,...children.map(c=>c.session.id)]){
    try{const saved=await runtime.collaborationTrace({identity:current.identity,conversation_id,signal:new AbortController().signal,authorize});trace.created.push(...saved.created);trace.consumed.push(...saved.consumed);}
    catch(error){const code=String((error as {code?:string}).code??'');if(!['TASK_BUSY','NATIVE_SESSION_NOT_FOUND','AUTHORITY_REQUIRED'].includes(code))throw error;trace.unavailable.push(conversation_id??task_id);}
   }
   for(const child of children){const command=child.relation.creation_command_id;if(command){const receipt=await collaborationStore.readOpenCommand(task_id,command);if(receipt?.action==='create'&&receipt.status==='accepted')trace.human_created.push(child.session.id);}}
   parents.push({parent_session_id:session.id,parent:p,children,requests:ledger.read(task_id),trace});
  }return parents;
 }
 async function performCollaborationCommand(task_id:string,action:string,raw:unknown){
  await recovery;const current=workspace.read(task_id);const x=closed(raw,action==='create'?['version','command_id','kind','task','confirmed',...(raw&&typeof raw==='object'&&Reflect.get(raw,'kind')==='fork'?['cutoff_id','history_ids']:[])]:action==='start'?['version','child_id','text','confirmed']:action==='stop'?['version','child_id']:action==='send'?['version','child_id','text']:action==='return'?['version','child_id','target','command_id']:['version','parent_id','target','command_id','disposition','reason','confirmed']);if(x.version!=='1.0')fail('VALIDATION_FAILED');
  if(action==='create'){
   if(!membershipUuid(x.command_id)||x.confirmed!==true||!['subagent','fork'].includes(String(x.kind))||typeof x.task!=='string'||!x.task.trim()||x.task.length>12000)fail('AUTHORITY_REQUIRED');
   if(x.kind==='fork'&&(!membershipUuid(x.cutoff_id)||!Array.isArray(x.history_ids)||x.history_ids.some(id=>!membershipUuid(id))))fail('VALIDATION_FAILED');
   const owner=source.owner(task_id),parent=await assistant.link(owner,current.question,linkCommand(task_id+owner.revision_id));
   await collaborationStore.importOpenHistory(parent.session.id,source.read(owner)!,new Date().toISOString());
   const prior=await assistant.readParent(parent.session.id),previous=prior.children.find(c=>c.creation_command_id===x.command_id);if(previous){if(previous.task!==x.task||previous.kind!==x.kind||x.kind==='fork'&&(previous.cutoff_id!==x.cutoff_id||taskHash(previous.selected_history.map(e=>e.id))!==taskHash(x.history_ids)))fail('COMMAND_CONFLICT');return collaboration(task_id);}
   const preview=await assistant.prepareChild(parent.session.id,x.kind as 'subagent'|'fork',String(x.task),x.kind==='fork'?x.cutoff_id as string:null,x.kind==='fork'?x.history_ids as string[]:[],[current.outcome!.outcome_id],true,x.command_id);
   await assistant.createChild(parent.session.id,preview.id,x.command_id,true);
  }else if(action==='review'){
   if(!membershipUuid(x.parent_id)||!membershipUuid(x.command_id)||!['adopted','declined'].includes(String(x.disposition)))fail('VALIDATION_FAILED');const p=await assistant.read(String(x.parent_id));if(p.source.open_origin?.task_id!==task_id)fail('NOT_FOUND');await assistant.reviewResult(String(x.parent_id),x.target as Parameters<typeof assistant.reviewResult>[1],String(x.command_id),x.disposition as 'adopted'|'declined',String(x.reason),x.confirmed===true);
  }else{
   if(!membershipUuid(x.child_id))fail('VALIDATION_FAILED');const id=String(x.child_id);if(['start','send'].includes(action)&&(typeof x.text!=='string'||!x.text.trim()||x.text.length>12000))fail('VALIDATION_FAILED');const relation=await assertChild(task_id,id);if(['start','send'].includes(action)&&relation.source.open_origin?.run_id!==current.identity.run_id)fail('AUTHORIZATION_STALE');
   if(action==='stop'){await assistant.stop(id);await assistant.closeSession(id,true);}
   else if(action==='start'){
    if(x.confirmed!==true)fail('AUTHORITY_REQUIRED');const old=await assistant.read(id);if(['Succeeded','Running','Waiting'].includes(old.attempts.at(-1)?.status??'')){if(old.attempts.at(-1)?.authorization.initial_text===x.text)return collaboration(task_id);if(['Running','Waiting'].includes(old.attempts.at(-1)!.status))fail('TASK_BUSY');}const approved=await config.authorizeConfiguration();if(approved.config_sha256!==current.identity.config_sha256)fail('CONFIG_CHANGED');
    if(ledger.pending?.().length)fail('PHYSICAL_PENDING');const lifecycle=await assistant.lifecycle(id);if(!lifecycle.open)await assistant.reopenSession(id,lifecycle.epoch);const authorization=await assistant.prepareCollaboration(id,String(x.text),[],[],true);await assistant.start(id,authorization.id,true);
   }else if(action==='send')await assistant.send(id,String(x.text));
   else if(action==='return'){if(!membershipUuid(x.command_id))fail('VALIDATION_FAILED');await assistant.returnResult(id,x.target as Parameters<typeof assistant.returnResult>[1],String(x.command_id));}
   else fail('VALIDATION_FAILED');
  }
  return collaboration(task_id);
 }
 async function collaborationReceipt(task_id:string,command_id:string){await recovery;workspace.read(task_id);if(!membershipUuid(command_id))fail('VALIDATION_FAILED');return collaborationStore.readOpenCommand(task_id,command_id);}
 async function collaborationCommand(task_id:string,action:string,raw:unknown){
  await recovery;const current=workspace.read(task_id);if(!raw||typeof raw!=='object'||!['create','start','stop','send','return','review'].includes(action))fail('VALIDATION_FAILED');
  if(!Object.hasOwn(raw,'command_id'))return performCollaborationCommand(task_id,action,raw);
  const command_id=Reflect.get(raw,'command_id');if(!membershipUuid(command_id))fail('VALIDATION_FAILED');
  const fields=action==='create'?['kind','task','confirmed',...(Reflect.get(raw,'kind')==='fork'?['cutoff_id','history_ids']:[])]:action==='start'?['child_id','text','confirmed']:action==='stop'?['child_id']:action==='send'?['child_id','text']:action==='return'?['child_id','target']:['parent_id','target','disposition','reason','confirmed'];
  closed(raw,['version','command_id',...fields]);const command={project_id,command_id,task_id,action,body:raw};
  if(await collaborationStore.reserveOpenCommand(command)==='accepted')return collaboration(task_id);
  const body=['start','stop','send'].includes(action)?Object.fromEntries(Object.entries(raw).filter(([k])=>k!=='command_id')):raw;
  const value=await performCollaborationCommand(task_id,action,body);await collaborationStore.finishOpenCommand(command);return value;
 }
 async function adoptedMaterials(task_id:string,material_ids:unknown){
  if(!Array.isArray(material_ids)||material_ids.length>32||new Set(material_ids).size!==material_ids.length||material_ids.some(id=>!membershipUuid(id)))fail('VALIDATION_FAILED');
  const current=workspace.read(task_id);
  const groups=await collaboration(task_id),selected=groups.flatMap(g=>g.parent.materials).filter(m=>material_ids.includes(m.id));if(selected.length!==material_ids.length)fail('AUTHORITY_REQUIRED');
  const materials=material_ids.map(id=>{const m=selected.find(m=>m.id===id)!;if(m.classification!=='MODEL'||m.review.disposition!=='adopted'||m.review.material_id!==m.id||m.review.result_id!==m.result.id||m.review.result_sha256!==m.result.sha256||m.result.source.open_origin?.task_id!==task_id||m.result.source.open_origin.run_id!==current.identity.run_id||m.result.source.open_origin.scope_sha256!==current.identity.scope_sha256)fail('AUTHORIZATION_STALE');return {version:'1.0' as const,material_id:m.id,result_id:m.result.id,result_version:m.result.version,result_sha256:m.result.sha256,source_task_id:task_id,source_revision:current.identity.revision,scope_sha256:current.identity.scope_sha256,classification:'MODEL' as const,review:'user_adopted' as const,value:m.result.value};});
  return materials;
 }
 async function revise(task_id:string,raw:unknown){
  if(!raw||typeof raw!=='object'||!Object.hasOwn(raw,'material_ids'))return workspace.revise(task_id,raw);
  const {material_ids,...command}=raw as Record<string,unknown>;if(!Array.isArray(material_ids)||material_ids.length>32||new Set(material_ids).size!==material_ids.length||material_ids.some(id=>!membershipUuid(id)))fail('VALIDATION_FAILED');
  const current=workspace.read(task_id),index=current.revision_commands?.indexOf(String(command.command_id))??-1,receipt=current.revision_command_id===command.command_id?current:index>=0?current.history![index]:null;
  if(receipt){if(taskHash((receipt.context_materials??[]).map(m=>m.material_id))!==taskHash(material_ids))fail('COMMAND_CONFLICT');return workspace.revise(task_id,command,receipt.context_materials??[]);}
  const materials=await adoptedMaterials(task_id,material_ids);
  return workspace.revise(task_id,command,materials);
 }
 async function previewRevision(task_id:string,raw:unknown){if(!raw||typeof raw!=='object'||!Object.hasOwn(raw,'material_ids'))return workspace.previewRevision(task_id,raw);
  const {material_ids,...command}=raw as Record<string,unknown>;if(!Array.isArray(material_ids)||material_ids.length>32||new Set(material_ids).size!==material_ids.length||material_ids.some(id=>!membershipUuid(id)))fail('VALIDATION_FAILED');
  const prior=workspace.read(task_id).revision_previews?.find(p=>p.command_id===command.command_id);if(prior){if(taskHash((prior.context_materials??[]).map(m=>m.material_id))!==taskHash(material_ids))fail('COMMAND_CONFLICT');return workspace.previewRevision(task_id,command,prior.context_materials??[]);}
  return workspace.previewRevision(task_id,command,await adoptedMaterials(task_id,material_ids));
 }
 return {...workspace,metricAssetCommandReceipt:(id:string)=>metricAssets.receipt(id),metricAssets:()=>({project_id,candidates:metricAssets.list(),current:metricAssets.approved()}),metricAssetCommand(raw:unknown){if(!raw||typeof raw!=='object')fail('VALIDATION_FAILED');const action=Reflect.get(raw,'action');if(action==='import'){const x=closed(raw,['action','bytes',...(Object.hasOwn(raw,'registry')?['registry']:[])]);if(!(x.bytes instanceof Uint8Array)||x.registry!==undefined&&!(x.registry instanceof Uint8Array))fail('VALIDATION_FAILED');return metricAssets.importCandidate(x.bytes,x.registry as Uint8Array|undefined);}const x=closed(raw,['action','command_id','id','version','owner','confirmed',...(action==='approve'?['use_for_new_tasks']:[])]);if(x.confirmed!==true||!['approve','revoke'].includes(String(action)))fail('AUTHORITY_REQUIRED');const {action:ignored,confirmed,...command}=x;void ignored;void confirmed;if(action==='approve')return metricAssets.approve(command as Parameters<typeof metricAssets.approve>[0]);metricAssets.revoke(command as Parameters<typeof metricAssets.revoke>[0]);return {revoked:true};},stop,collect,revise,previewRevision,collaborationSource:(task_id:string)=>source.read(source.owner(task_id)),physicalPending:()=>ledger.pending?.().length??0,collaboration,collaborationCommand,collaborationReceipt,async close(){await recovery;await assistant.close();await workspace.close();await Promise.all([...stopping]);},requests:(task_id:string)=>ledger.read(task_id)};
}
