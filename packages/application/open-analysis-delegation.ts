import {validateDelegationBusinessQuestion,automaticDelegationAggregate,automaticDelegationProjection,delegationActions,delegationReferencePaths,delegationInstructionSchema} from '../product-core/open-analysis-delegation-instruction.ts';
import {taskHash} from '../product-core/member-task.ts';
import type {OpenAnalysisCollaboration} from '../ports/open-analysis-collaboration.ts';
import type {OpenAnalysisStore,OpenTaskIdentity} from '../ports/open-analysis-store.ts';
import type {OwnerRef} from '../contracts/xanthil-desktop-ipc.ts';
import type {AssistantSource} from '../contracts/case-assistant.ts';
import type {AutomaticDelegationInstruction,ChildResult} from '../contracts/case-collaboration.ts';
import type {createCaseAssistantApplication} from './case-assistant.ts';

function fail(code:string,safe_details?:Record<string,unknown>):never{throw Object.assign(new Error(code),{code,stack:code,...(safe_details?{safe_details}:{})});}
function command(value:unknown){const d=taskHash(value);return [d.slice(0,8),d.slice(8,12),'4'+d.slice(13,16),'a'+d.slice(17,20),d.slice(20,32)].join('-');}

function returnedModelResult(entry:unknown):ChildResult|undefined{
 if(!entry||typeof entry!=='object'||Reflect.get(entry,'classification')!=='MODEL')return;
 const result=Reflect.get(entry,'result');
 if(!result||typeof result!=='object'||typeof result.id!=='string'||!Number.isSafeInteger(result.version)||result.version<1||typeof result.sha256!=='string'||!/^[a-f0-9]{64}$/.test(result.sha256)||result.value?.kind!=='result'||typeof result.value.summary!=='string'||!Array.isArray(result.value.references)||!Array.isArray(result.value.limitations)||!Array.isArray(result.value.unknowns))return;
 return result as ChildResult;
}
const resultValuePath=(result:ChildResult)=>`collaboration-result/${result.id}/${result.version}/${result.sha256}/value.txt`;

/** Private model view of acknowledged Case results. Canonical results and status
 * rows remain owned by the existing Case store; this is not a result repository. */
export function projectOpenDelegationResultsForModel(entries:readonly unknown[]){
 if(Buffer.byteLength(JSON.stringify(entries))<=65536)return entries;
 return entries.map(entry=>{
  const result=returnedModelResult(entry);if(!result||Buffer.byteLength(JSON.stringify(result.value))<=8192)return entry;
  return {...entry as Record<string,unknown>,result:{...result,value:{kind:'saved_result_view',...Buffer.byteLength(result.value.summary)<=8192?{summary:result.value.summary}:{},references:result.value.references,limitations_count:result.value.limitations.length,unknowns_count:result.value.unknowns.length,full_value:{path:resultValuePath(result),offset:1},classification:'MODEL',instruction:'完整意见、限制与未知保留在原Case结果；用原生read读取，不把MODEL意见当独立核验或正式决定。'}}};
 });
}

/** Reads only an exact result still present in the caller's freshly authorized
 * result set. The path is a business locator, never a filesystem capability. */
export function readOpenDelegationResultForModel(entries:readonly unknown[],location:string){
 const result=entries.map(returnedModelResult).find(result=>result&&resultValuePath(result)===location);if(!result)fail('ENOENT');
 const text=JSON.stringify({classification:'MODEL',result_id:result.id,result_version:result.version,result_sha256:result.sha256,value:result.value}),parts=[...text],lines=[JSON.stringify({kind:'saved_model_result_json',classification:'MODEL',result_id:result.id,result_version:result.version,result_sha256:result.sha256,unicode_code_points:parts.length,instruction:'既有真实Case结果的完整MODEL意见JSON，不是独立核验或正式决定。'})];
 for(let start=0;start<parts.length;start+=512)lines.push(JSON.stringify({start,text:parts.slice(start,start+512).join('')}));
 return lines.join('\n');
}

type DelegationCatalog=Awaited<ReturnType<ReturnType<typeof createDelegationMaterialReferences>['read']>>;
// Native producer rewrites advisory argument guidance. Read identity binds real
// material/label/authority views, not those non-authoritative wire instructions.
const delegationCatalogIdentity=(catalog:DelegationCatalog)=>taskHash(catalog.map(m=>({material_id:m.material_id,label:m.label,verification:m.verification,actions:m.instruction_contract?.actions??[],views:m.views,...m.views.length?{}:{reference_paths:m.instruction_contract?.reference_paths??[]}})));
const delegationCatalogPath=(catalog:DelegationCatalog)=>`delegation-materials/${delegationCatalogIdentity(catalog)}/catalog.txt`;
export function projectOpenDelegationCatalogForModel(catalog:DelegationCatalog){
 if(Buffer.byteLength(JSON.stringify(catalog))<=65536)return catalog;
 return {kind:'material_catalog_view',materials:catalog.map(m=>({material_id:m.material_id,label_preview:[...m.label].slice(0,160).join(''),label_truncated:[...m.label].length>160,verification:m.verification,actions:m.instruction_contract?.actions??[],views_count:m.views.length})),full_catalog:{path:delegationCatalogPath(catalog),offset:1},instruction:'全部真实材料仍列在此；用原生read读取当前完整目录的label/views/view_ref/路径，再明确选择。目录不是必选清单，读取不创建子任务或增加资料权限。'};
}
export function readOpenDelegationCatalogForModel(catalog:DelegationCatalog,location:string){
 if(delegationCatalogPath(catalog)!==location)fail('ENOENT');
 const text=JSON.stringify(catalog),parts=[...text],lines=[JSON.stringify({kind:'delegation_material_catalog_json',catalog_identity_sha256:delegationCatalogIdentity(catalog),content_sha256:taskHash(catalog),materials_count:catalog.length,unicode_code_points:parts.length,instruction:'当前原目录完整JSON，按start连接text；短ref/views身份只适用同一当前授权。参数以本轮真实工具声明或read_tool_contract为准；目录中的旧业务格式说明不增加参数或资料权限。'})];
 for(let start=0;start<parts.length;start+=512)lines.push(JSON.stringify({start,text:parts.slice(start,start+512).join('')}));
 return lines.join('\n');
}

/** Coordinates business children around native idle boundaries; owns no model loop. */
export function createOpenAnalysisDelegation(config:{
 store:OpenAnalysisStore;assistant:ReturnType<typeof createCaseAssistantApplication>;
 source:{stepOwner:(task:string,step:string)=>OwnerRef;read:(owner:OwnerRef)=>AssistantSource|null;selectionOwner?:(task:string,materials:readonly string[])=>OwnerRef};
 project_id:string;importHistory?:(id:string,source:AssistantSource)=>Promise<void>;
}){
 function guard(identity:OpenTaskIdentity){
  const task=config.store.read(identity.task_id);
  if(!task||!['running','saved'].includes(task.state)||task.pending_stop_epoch!==null)fail('AUTHORITY_REQUIRED');
  for(const k of ['task_id','revision','run_id','grant_id','config_sha256'] as const)if(task.identity[k]!==identity[k])fail('AUTHORIZATION_STALE');
  return task;
 }
 async function parents(identity:OpenTaskIdentity,conversation?:string){
  guard(identity);
  if(conversation){const p=await config.assistant.read(conversation);if(p.source.open_origin?.task_id!==identity.task_id||p.source.open_origin.run_id!==identity.run_id||!p.source.eligible)fail('AUTHORIZATION_STALE');return [conversation];}
  const sessions=await config.assistant.list(config.project_id),ids:string[]=[];
  for(const s of sessions){if(await config.assistant.isChild(s.id))continue;const p=await config.assistant.read(s.id);if(p.source.open_origin?.task_id===identity.task_id&&p.source.open_origin.run_id===identity.run_id&&p.source.eligible)ids.push(s.id);}
  return ids;
 }
 async function assertCreationOpen(identity:OpenTaskIdentity,source:AssistantSource,instruction:AutomaticDelegationInstruction){
  // Material identity, not a shared JSON pointer or purpose wording, defines work.
  // Partition bundles so adding an independent material cannot hide stopped work.
  function work(source:AssistantSource,instruction:AutomaticDelegationInstruction){
   const ids=instruction.version==='1.1'?[...new Set(instruction.reference_paths.map(path=>path.split('/')[2]!))]:[source.open_origin?.outcome_id??source.report.report_id];
   return ids.map(id=>{const prefix=instruction.version==='1.1'?'/materials/'+id:'';return {id,instruction:{...instruction,reference_paths:instruction.reference_paths.filter(path=>!prefix||path.startsWith(prefix+'/')).map(path=>path.slice(prefix.length)),completion_reference_paths:instruction.completion_reference_paths.filter(path=>!prefix||path.startsWith(prefix+'/')).map(path=>path.slice(prefix.length))}};});
  }
  const requested=work(source,instruction);
  // Completion conditions cannot restore permission to work on stopped input.
  const overlaps=(a:AutomaticDelegationInstruction,b:AutomaticDelegationInstruction)=>a.action===b.action&&a.reference_paths.some(left=>b.reference_paths.some(right=>left===right||left.startsWith(right+'/')||right.startsWith(left+'/')));
  const seen=new Set<string>();
  async function inspect(parent:string){
   if(seen.has(parent))fail('COLLABORATION_CYCLE');seen.add(parent);
   const p=await config.assistant.readParent(parent);
   for(const relation of p.children){
    const child=await config.assistant.readCollaboration(relation.child_session_id);
    if(!child.lifecycle.open&&p.lifecycle.epoch<=relation.parent_epoch&&relation.automatic_instruction&&work(relation.source,relation.automatic_instruction).some(stopped=>requested.some(next=>next.id===stopped.id&&overlaps(stopped.instruction,next.instruction))))fail('DELEGATION_STOPPED');
    await inspect(child.session.id);
   }
  }
  for(const parent of await parents(identity))await inspect(parent);
 }
 function bind(conversation?:string):OpenAnalysisCollaboration{
  return {
   async materials(identity){
    const task=guard(identity);if(!conversation&&task.identity.scope_sha256!==identity.scope_sha256)fail('AUTHORIZATION_STALE');
    function material(source:AssistantSource,id:string,label:string,verification:string,allowed?:readonly string[]){
     const aggregate=automaticDelegationAggregate(source),body=JSON.parse(aggregate.content),actual=delegationReferencePaths(source).filter(path=>!allowed||allowed.some(ref=>path===ref||path.startsWith(ref+'/')));
     const roots=actual.filter(path=>!actual.some(parent=>path!==parent&&path.startsWith(parent+'/')));
     const views=roots.map(path=>{let value:unknown=body;for(const piece of path.slice(1).split('/'))value=Reflect.get(value as object,piece.replace(/~1/g,'/').replace(/~0/g,'~'));return {reference_paths:[path],source_sha256:aggregate.sha256,projection_sha256:taskHash({path,value}),value_kind:Array.isArray(value)?'array':value!==null&&typeof value==='object'?'object':'scalar',fields:value!==null&&typeof value==='object'?Object.keys(value):[]};});
     return {material_id:id,label,verification,instruction_contract:{actions:Object.keys(delegationActions),reference_paths:actual,views}};
    }
    if(conversation){const p=await config.assistant.readCollaboration(conversation);if(p.relation.automatic_instruction?.version==='1.1'){const instruction=p.relation.automatic_instruction,aggregate=automaticDelegationAggregate(p.relation.source,instruction),materials=JSON.parse(aggregate.content).materials as Record<string,unknown>;return Object.keys(materials).map(id=>{const selected=instruction.reference_paths.filter(path=>path.startsWith('/materials/'+id+'/')).map(path=>path.slice(('/materials/'+id).length));return material({...p.relation.source,open_origin:undefined,aggregate:{...aggregate,content:JSON.stringify(materials[id])}},id,'父任务明确选定的核验摘要','parent_selected',selected);});}return p.relation.selected_reports.map(r=>material(p.relation.source,r.id,'父任务选定的核验摘要','parent_selected'));}
    return (task.verified_steps??[]).filter(s=>s.identity.run_id===identity.run_id&&s.identity.revision===identity.revision).flatMap(s=>{const source=config.source.read(config.source.stepOwner(identity.task_id,s.step_id));return source?.eligible?[material(source,s.step_id,s.framework.plan.goal+' · '+s.framework.plan.operation+' · '+s.framework.plan.unit,s.verification.grade)]:[];});
   },
   async queue(identity,request){
    const rootTask=guard(identity);
    if(request.business_question!==undefined)validateDelegationBusinessQuestion(request.business_question,[rootTask.question,request.task]);if(!request.instruction)fail('DELEGATION_INSTRUCTION_REQUIRED');
    const selections=[{material_id:request.material_id,instruction:request.instruction},...(request.additional_materials??[])],catalog=await this.materials(identity);
    if(selections.length>8||new Set(selections.map(s=>s.material_id)).size!==selections.length)fail('RESULT_OUTSIDE_AUTHORIZATION');
    for(const selected of selections){const material=catalog.find(m=>m.material_id===selected.material_id);if(!material)fail('RESULT_OUTSIDE_AUTHORIZATION');if(conversation){const relation=(await config.assistant.readCollaboration(conversation)).relation;if(relation.automatic_instruction?.version==='1.1'&&selected.instruction.reference_paths.some(path=>!material.instruction_contract?.reference_paths.some(p=>path===p||path.startsWith(p+'/'))))fail('RESULT_OUTSIDE_AUTHORIZATION');}}
    // Diagnose the existing whole-selection contract before creating a source or parent.
    // Include all known conflicts so the single model correction can address them together.
    if(!Object.hasOwn(delegationActions,request.instruction.action))fail('DELEGATION_INSTRUCTION_INVALID');
    const issues:Record<string,unknown>[]=[];
    for(const [index,selected] of selections.entries())if(selected.instruction.action!==request.instruction.action)issues.push({reason:'mixed_material_actions',argument_path:`/additional_materials/${index-1}/instruction/action`,required_action:request.instruction.action});
    for(const field of ['reference_paths','completion_reference_paths'] as const){
     const count=selections.reduce((sum,s)=>sum+(Array.isArray(s.instruction[field])?s.instruction[field].length:0),0);
     if(count>12)issues.push({reason:'reference_count_exceeded',argument_path:'/instruction/'+field,maximum:12,actual_count:count});
    }
    if(issues.length)fail('DELEGATION_INSTRUCTION_INVALID',{reason:'invalid_material_selection',issues});
    let parent=conversation;
    if(!parent){const owner=config.source.selectionOwner?config.source.selectionOwner(identity.task_id,selections.map(s=>s.material_id)):selections.length===1?config.source.stepOwner(identity.task_id,request.material_id):undefined;if(!owner)fail('DELEGATION_SELECTION_UNAVAILABLE');parent=(await config.assistant.link(owner,'分析中的核验摘要',command({purpose:'delegation-parent',owner}))).session.id;const source=config.source.read(owner);if(!source?.eligible)fail('AUTHORIZATION_STALE');}
    const p=await config.assistant.readParent(parent),bundle=p.source.open_origin?.material_kind==='verified_bundle';
    const reference_paths=bundle?selections.flatMap(s=>s.instruction.reference_paths.map(path=>'/materials/'+s.material_id+path)).sort():request.instruction.reference_paths,completion_reference_paths=bundle?selections.flatMap(s=>s.instruction.completion_reference_paths.map(path=>'/materials/'+s.material_id+path)).sort():request.instruction.completion_reference_paths;
    if(selections.length>1&&!bundle)fail('RESULT_OUTSIDE_AUTHORIZATION');
    const projection=automaticDelegationProjection({action:request.instruction.action,reference_paths,completion_reference_paths,version:bundle?'1.1':'1.0',private_purpose:request.task,...(request.business_question!==undefined?{business_question:request.business_question}:{})},p.source,new Date().toISOString()),command_id=command({purpose:bundle?'delegate-analysis-v1.1':'delegate-analysis-v1',parent,kind:request.kind,task:projection.task,material:bundle?p.source.report.report_id:request.material_id});
    if(!p.lifecycle.open||!p.source.eligible)fail('PARENT_CLOSED');
    await assertCreationOpen(identity,p.source,projection.instruction);
    const prior=p.children.find(c=>c.creation_command_id===command_id);
    if(prior){const child=await config.assistant.readCollaboration(prior.child_session_id);if(!child.lifecycle.open)fail('SESSION_CLOSED');const attempt=child.attempts.at(-1);if(attempt&&attempt.status!=='Succeeded')fail(attempt.status==='Waiting'?'DELEGATION_WAITING':'DELEGATION_NOT_REPLAYABLE');const result=child.results.at(-1),returned=!!result&&child.deliveries.some(d=>d.result_id===result.id&&d.status==='returned');return {child_id:child.session.id,state:returned?'returned':'queued'};}
    const child=await config.assistant.queueChild(parent,request.kind,projection.task,[],[bundle?p.source.report.report_id:request.material_id],true,command_id,projection.instruction);
    guard(identity);return {child_id:child.session.id,state:'queued'};
   },
   async drain(identity,signal){
    for(const parent of await parents(identity,conversation)){
     const p=await config.assistant.readParent(parent);
     for(const relation of p.children){
      if(signal.aborted)fail('CANCELLED');guard(identity);
      let child=await config.assistant.readCollaboration(relation.child_session_id);
      if(!child.lifecycle.open)continue;
      if(!child.attempts.length){if(!relation.automatic_instruction)fail('DELEGATION_LEGACY_REVIEW_REQUIRED');const grant=await config.assistant.prepareCollaboration(child.session.id,relation.task,[],[]);if(grant.blockers.length)fail('AUTHORITY_REQUIRED');await config.assistant.start(child.session.id,grant.id,true);}
      await config.assistant.waitForIdle(child.session.id,signal);guard(identity);
      child=await config.assistant.readCollaboration(child.session.id);
      const result=child.results.at(-1);
      if(child.attempts.at(-1)?.status==='Succeeded'&&result)await config.assistant.returnResult(child.session.id,{result_id:result.id,result_version:result.version,result_sha256:result.sha256},command({purpose:'automatic-model-return',result_id:result.id,sha256:result.sha256}));
     }
    }
   },
   async results(identity){
    const output:unknown[]=[];
    for(const parent of await parents(identity,conversation)){
     // The durable result retains the complete selected source. Model consumers
     // already possess that material; return the complete opinion and provenance
     // without repeatedly embedding its source snapshot in their conversation.
     for(const material of await config.assistant.returnedResults(parent)){
      const projected=structuredClone(material),aggregate=projected.result.source.aggregate;
      if(aggregate){const {content:_body,...metadata}=aggregate;output.push({...projected,result:{...projected.result,source:{...projected.result.source,aggregate:metadata}},source_body:'omitted_from_model_view'});}
      else output.push(projected);
     }
     const p=await config.assistant.readParent(parent);
     for(const child of p.children){const state=await config.assistant.readCollaboration(child.child_session_id),attempt=state.attempts.at(-1);if(attempt&&attempt.status!=='Succeeded')output.push({classification:'MODEL',child_id:child.child_session_id,state:attempt.status,reason:attempt.reason,question:state.events.filter(e=>e.kind==='question').at(-1)?.text??null,verified:false});}
    }
    guard(identity);return output;
   },
  };
 }
 return {root:bind(),child:bind};
}


/** Private model input projection; the business queue still checks actual paths and authority. */
export const delegationModelInstructionSchema={anyOf:[{type:'object',properties:{action:delegationInstructionSchema.properties.action,reference_indices:{type:'array',minItems:1,maxItems:12,uniqueItems:true,items:{type:'integer',minimum:0}},completion_reference_indices:{type:'array',minItems:1,maxItems:12,uniqueItems:true,items:{type:'integer',minimum:0}}},required:['action','reference_indices','completion_reference_indices'],additionalProperties:false},delegationInstructionSchema]};

/** Ephemeral model handles never grant or infer material authority. The queue rechecks it. */
export function createDelegationMaterialReferences(collaboration:OpenAnalysisCollaboration,identity:OpenTaskIdentity){
 const handles=new Map<string,string>(),references=new Map<string,string>(),paths=new Map<string,readonly string[]>();
 const views=new Map<string,{material_id:string;reference_paths:readonly string[];source_sha256:string;projection_sha256:string}>();let active=new Set<string>(),catalogRead=false;
 return {
  async read(){
   views.clear();active.clear();catalogRead=false;const materials=await collaboration.materials(identity);catalogRead=true;active=new Set(materials.map(m=>m.material_id));paths.clear();for(const m of materials)paths.set(m.material_id,[...(m.instruction_contract?.reference_paths??[])]);
   return materials.map(m=>{let handle=handles.get(m.material_id);if(!handle){handle='material:'+(handles.size+1);handles.set(m.material_id,handle);references.set(handle,m.material_id);}return {...m,material_id:handle,views:(m.instruction_contract?.views??[]).map(view=>{const view_ref='view:'+taskHash({identity,material_id:m.material_id,...view});views.set(view_ref,{material_id:m.material_id,reference_paths:[...view.reference_paths],source_sha256:view.source_sha256,projection_sha256:view.projection_sha256});return {...structuredClone(view),view_ref};}),...(m.instruction_contract?{instruction_contract:{...m.instruction_contract,index_selection:'With material_ids use reference_paths and completion_reference_paths common to the selected materials; indices are not valid in that format. With legacy material_id plus optional additional_materials, choose each material’s own reference_indices and completion_reference_indices as zero-based positions in its reference_paths array, or use explicit paths. Do not mix formats or indices with path fields; objects include real descendants.'}}:{})};});
  },
  async validateViewSelection(input:Readonly<Record<string,unknown>>){
   if(!Object.hasOwn(input,'view_refs'))return;
   const selected=this.resolveToolSelection(input),current=await collaboration.materials(identity);
   for(const ref of input.view_refs as string[]){const view=views.get(ref)!;const live=current.find(m=>m.material_id===view.material_id);if(!live?.instruction_contract?.views?.some(v=>v.source_sha256===view.source_sha256&&v.projection_sha256===view.projection_sha256&&taskHash(v.reference_paths)===taskHash(view.reference_paths)))fail('AUTHORIZATION_STALE');}
   return selected;
  },
  resolveToolSelection(input:Readonly<Record<string,unknown>>){
   if(Object.hasOwn(input,'view_refs')){
    if(['material_ids','material_id','additional_materials','instruction','reference_paths','completion_reference_paths'].some(k=>Object.hasOwn(input,k))||typeof input.action!=='string'||!Object.hasOwn(delegationActions,input.action))fail('DELEGATION_INSTRUCTION_INVALID');
    const refs=input.view_refs;if(!Array.isArray(refs)||!refs.length||refs.length>12||new Set(refs).size!==refs.length||refs.some(ref=>typeof ref!=='string'||!views.has(ref)))fail('DELEGATION_INSTRUCTION_INVALID');
    const grouped=new Map<string,string[]>();for(const ref of refs){const view=views.get(ref)!;this.resolve(view.material_id);grouped.set(view.material_id,[...(grouped.get(view.material_id)??[]),...view.reference_paths]);}
    if(grouped.size>8||[...grouped.values()].reduce((n,p)=>n+p.length,0)>12||[...grouped.values()].some(p=>new Set(p).size!==p.length))fail('DELEGATION_INSTRUCTION_INVALID');
    const selected=[...grouped].map(([material_id,p])=>({material_id,instruction:{action:input.action,reference_paths:p,completion_reference_paths:[...p]}}));return this.resolveSelection(selected[0]!.material_id,selected[0]!.instruction,selected.slice(1));
   }
   if(!Object.hasOwn(input,'material_ids'))return this.resolveSelection(input.material_id as string,input.instruction,input.additional_materials);
   if(Object.hasOwn(input,'material_id')||Object.hasOwn(input,'additional_materials'))fail('DELEGATION_INSTRUCTION_INVALID');
   const refs=input.material_ids;
   if(!Array.isArray(refs)||!refs.length||refs.length>8||refs.some(id=>typeof id!=='string')||new Set(refs).size!==refs.length)fail('DELEGATION_INSTRUCTION_INVALID');
   const ids=refs.map(id=>this.resolve(id));
   if(new Set(ids).size!==ids.length)fail('RESULT_OUTSIDE_AUTHORIZATION');
   const raw=input.instruction;
   if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('DELEGATION_INSTRUCTION_INVALID');
   const instruction=raw as Record<string,unknown>;
   if(Object.keys(instruction).sort().join('|')!=='action|completion_reference_paths|reference_paths'||typeof instruction.action!=='string'||!Object.hasOwn(delegationActions,instruction.action))fail('DELEGATION_INSTRUCTION_INVALID');
   const issues:Record<string,unknown>[]=[];
   for(const field of ['reference_paths','completion_reference_paths'] as const){
    const values=instruction[field];
    if(!Array.isArray(values)||!values.length||values.length>12||new Set(values).size!==values.length||values.some(path=>typeof path!=='string'))fail('DELEGATION_INSTRUCTION_INVALID');
    const count=ids.length*values.length;if(count>12)issues.push({reason:'reference_count_exceeded',argument_path:'/instruction/'+field,maximum:12,actual_count:count});
    for(const [index,id] of ids.entries())for(const [pathIndex,path] of values.entries())if(!(paths.get(id)??[]).includes(path))issues.push({reason:'reference_path_not_found',argument_path:'/instruction/'+field+'/'+pathIndex,material_position:index});
   }
   const selected=instruction.reference_paths as string[];
   if((instruction.completion_reference_paths as string[]).some(path=>!selected.some(ref=>path===ref||path.startsWith(ref+'/'))))issues.push({reason:'completion_outside_selected_references',argument_path:'/instruction/completion_reference_paths'});
   if(issues.length)fail('DELEGATION_INSTRUCTION_INVALID',{reason:'invalid_material_selection',issues,common_reference_paths:(paths.get(ids[0]!)??[]).filter(path=>ids.every(id=>paths.get(id)?.includes(path))),maximum_references_per_material:Math.floor(12/ids.length)});
   return this.resolveSelection(refs[0],instruction,refs.slice(1).map(material_id=>({material_id,instruction})));
  },
  resolveSelection(reference:string,instruction:unknown,additional:unknown){
   if(additional!==undefined&&(!Array.isArray(additional)||additional.length>7))fail('DELEGATION_INSTRUCTION_INVALID');
   const raw=[{material_id:reference,instruction},...((additional??[]) as {material_id:string;instruction:unknown}[])];
   for(const [index,value] of raw.entries())if(!value||typeof value!=='object'||typeof value.material_id!=='string'||index>0&&Object.keys(value).sort().join('|')!=='instruction|material_id')fail('DELEGATION_INSTRUCTION_INVALID');
   // Resolve every material identity before disclosing any instruction diagnostics.
   const ids=raw.map(value=>this.resolve(value.material_id)),issues:Record<string,unknown>[]=[];
   const inputs=raw.map(value=>value.instruction&&typeof value.instruction==='object'&&!Array.isArray(value.instruction)?value.instruction as Record<string,unknown>:null);
   const action=inputs[0]?.action;
   if(typeof action==='string'&&Object.hasOwn(delegationActions,action))for(let index=1;index<inputs.length;index++)if(inputs[index]?.action!==action)issues.push({reason:'mixed_material_actions',argument_path:`/additional_materials/${index-1}/instruction/action`,required_action:action});
   for(const field of ['reference','completion_reference'] as const){
    const count=inputs.reduce((sum,input)=>{const value=input?.[field+'_indices']??input?.[field+'_paths'];return sum+(Array.isArray(value)?value.length:0);},0);
    if(count>12)issues.push({reason:'reference_count_exceeded',argument_path:'/instruction/'+field+(inputs.some(input=>input&&Object.hasOwn(input,field+'_indices'))?'_indices':'_paths'),maximum:12,actual_count:count});
   }
   const selected=raw.map((value,index)=>{
    try{return {material_id:ids[index]!,instruction:this.resolveInstruction(value.material_id,value.instruction)};}
    catch(error){if((error as {code?:string}).code!=='DELEGATION_INSTRUCTION_INVALID')throw error;const details=(error as {safe_details?:Record<string,unknown>}).safe_details;
     issues.push({...details??{reason:'invalid_instruction'},argument_path:(index===0?'':`/additional_materials/${index-1}`)+String(details?.argument_path??'/instruction')});return null;}
   });
   if(issues.length)fail('DELEGATION_INSTRUCTION_INVALID',{reason:'invalid_material_selection',issues});
   return {material_id:selected[0]!.material_id,instruction:selected[0]!.instruction,additional_materials:selected.slice(1) as NonNullable<typeof selected[number]>[]};
  },
  resolveAdditional(raw:unknown){if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>7)fail('DELEGATION_INSTRUCTION_INVALID');return raw.map(value=>{if(!value||typeof value!=='object'||Object.keys(value).sort().join('|')!=='instruction|material_id'||typeof value.material_id!=='string')fail('DELEGATION_INSTRUCTION_INVALID');return {material_id:this.resolve(value.material_id),instruction:this.resolveInstruction(value.material_id,value.instruction)};});},
  resolve(reference:string){if(!catalogRead||!active.size)fail('DELEGATION_CATALOG_REQUIRED');const actual=references.get(reference)??reference;if(!active.has(actual))fail('RESULT_OUTSIDE_AUTHORIZATION');return actual;},
  resolveInstruction(reference:string,raw:unknown):Omit<import('../contracts/case-collaboration.ts').AutomaticDelegationInstruction,'version'|'private_purpose'>{
   const actual=this.resolve(reference);
   if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('DELEGATION_INSTRUCTION_INVALID');
   const input=raw as Record<string,unknown>;
   if(!Object.hasOwn(input,'reference_indices')&&!Object.hasOwn(input,'completion_reference_indices'))return input as unknown as Omit<import('../contracts/case-collaboration.ts').AutomaticDelegationInstruction,'version'|'private_purpose'>;
   if(Object.keys(input).sort().join('|')!==['action','completion_reference_indices','reference_indices'].join('|')||typeof input.action!=='string'||!Object.hasOwn(delegationActions,input.action))fail('DELEGATION_INSTRUCTION_INVALID');
   const available=paths.get(actual)??[];
   const select=(value:unknown,field:string):string[]=>{
    if(!Array.isArray(value)||!value.length||value.length>12||new Set(value).size!==value.length)fail('DELEGATION_INSTRUCTION_INVALID');
    const invalid=value.findIndex(i=>!Number.isSafeInteger(i)||i<0||i>=available.length);
    if(invalid>=0)fail('DELEGATION_INSTRUCTION_INVALID',{reason:'invalid_reference_index',argument_path:'/instruction/'+field+'/'+invalid,available_count:available.length});
    return value.map(i=>available[i]);
   };
   return {action:input.action as import('../contracts/case-collaboration.ts').AutomaticDelegationInstruction['action'],reference_paths:select(input.reference_indices,'reference_indices'),completion_reference_paths:select(input.completion_reference_indices,'completion_reference_indices')};
  },
 };
}

export const additionalDelegationMaterialsSchema={type:'array',maxItems:7,items:{type:'object',properties:{material_id:{type:'string'},instruction:delegationModelInstructionSchema},required:['material_id','instruction'],additionalProperties:false}};

/** Compatible private tool wire: an explicit list shares real paths, never inferred materials. */
export const delegationToolSchema={type:'object',properties:{kind:{type:'string',enum:['fork','subagent']},task:{type:'string',minLength:1,maxLength:12000},action:delegationInstructionSchema.properties.action,view_refs:{type:'array',minItems:1,maxItems:12,uniqueItems:true,items:{type:'string',pattern:'^view:[a-f0-9]{64}$'},description:'Explicit views from the current material catalog; each maps to exactly its displayed paths. Do not mix with material/path/instruction fields.'},business_question:{type:'string',minLength:1,maxLength:12000,description:'A newly drafted concrete business subquestion within this Task and selected material scope. Do not copy local task/private purpose, root verbatim, unselected history or secrets. This question adds no material authority and is MODEL, not verified fact.'},instruction:delegationModelInstructionSchema,material_ids:{type:'array',minItems:1,maxItems:8,uniqueItems:true,items:{type:'string',minLength:1,maxLength:64},description:'Explicit handles from read_delegation_materials. A common action/reference_paths/completion_reference_paths applies to each; indices are not valid for this format. Choose only the required objects; all materials together have at most12 references.'},material_id:{type:'string',minLength:1,maxLength:64},additional_materials:additionalDelegationMaterialsSchema},required:['kind','task'],anyOf:[{required:['view_refs','action']},{required:['instruction','material_ids']},{required:['instruction','material_id']}],additionalProperties:false};

/** Closed arguments for either explicit view selection or the retained legacy wire. */
export function delegationArgumentKeys(input:Readonly<Record<string,unknown>>):string[]{
 return ['kind','task',...(Object.hasOwn(input,'business_question')?['business_question']:[]),...(Object.hasOwn(input,'view_refs')?['action','view_refs']:['instruction',...(Object.hasOwn(input,'material_ids')?['material_ids']:['material_id']),...(Object.hasOwn(input,'material_ids')&&Object.hasOwn(input,'material_id')?['material_id']:[]),...(Object.hasOwn(input,'additional_materials')?['additional_materials']:[])])];
}

/** Default producer projection; full legacy execution parameters remain above. */
export const delegationViewModelSchema={type:'object',properties:Object.fromEntries(['kind','task','business_question','action','view_refs'].map(key=>[key,Reflect.get(delegationToolSchema.properties,key)])),required:['kind','task','action','view_refs'],additionalProperties:false};
