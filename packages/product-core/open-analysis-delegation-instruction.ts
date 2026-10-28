import {taskHash} from './member-task.ts';
import type {AssistantSource,AssistantEvent} from '../contracts/case-assistant.ts';
import type {AutomaticDelegationInstruction} from '../contracts/case-collaboration.ts';

export const delegationActions={inspect_sources:'检查来源',check_consistency:'复核资料',check_limitations:'检查限制',challenge:'检查反证',explain:'解释证据',compare:'比较所选证据'} as const;
function fail(reason='invalid_instruction',details:Record<string,unknown>={}):never{throw Object.assign(new Error('DELEGATION_INSTRUCTION_INVALID'),{code:'DELEGATION_INSTRUCTION_INVALID',stack:'DELEGATION_INSTRUCTION_INVALID',safe_details:{reason,...details}});}
function record(raw:unknown):Record<string,unknown>{if(!raw||typeof raw!=='object'||Array.isArray(raw))fail();return raw as Record<string,unknown>;}
export function automaticDelegationAggregate(source:AssistantSource,instruction?:AutomaticDelegationInstruction){
 if(!source.aggregate||!source.eligible||source.current_revision_id!==source.owner.revision_id)fail('source_not_authorized');
 const original=source.aggregate;if(taskHash(original.content)!==original.sha256)fail('source_content_changed');
 let material:unknown;try{material=JSON.parse(original.content);}catch{fail('source_content_invalid');}
 if(!instruction)return structuredClone(original);
 validateAutomaticInstruction(instruction,source);
 const selected:Record<string,unknown>={};
 for(const path of instruction.reference_paths){
  const encoded=path.slice(1).split('/'),pieces=encoded.map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));let target=selected;
  for(let i=0;i<pieces.length;i++){
   const key=pieces[i]!;
   if(i===pieces.length-1)Object.defineProperty(target,key,{value:structuredClone(resolvePath(material,path)),enumerable:true,writable:true,configurable:true});
   else {if(!Object.hasOwn(target,key)){const prefix='/'+encoded.slice(0,i+1).join('/');Object.defineProperty(target,key,{value:Array.isArray(resolvePath(material,prefix))?[]:{},enumerable:true,writable:true,configurable:true});}const next=target[key];if(!next||typeof next!=='object')fail('reference_path_conflict');target=next as Record<string,unknown>;}
  }
 }
 const content=JSON.stringify(selected);
 return {...original,fields:Object.keys(selected),content,sha256:taskHash(content),source_sha256:original.sha256,projection:'selected_structured_material_v1'};
}

function resolvePath(material:unknown,path:string):unknown{
 if(!path.startsWith('/')||path.length>512)fail('reference_path_must_be_json_pointer');let value=material;
 for(const segment of path.slice(1).split('/')){if(/~(?![01])/.test(segment))fail();const key=segment.replace(/~1/g,'/').replace(/~0/g,'~');if(!value||typeof value!=='object'||!Object.hasOwn(value,key))fail('reference_path_not_found');value=Reflect.get(value,key);}
 return value;
}
export function validateAutomaticInstruction(raw:unknown,source:AssistantSource):AutomaticDelegationInstruction{
 const x=record(raw);if(Object.keys(x).sort().join('|')!==['action','completion_reference_paths','private_purpose','reference_paths','version',...(Object.hasOwn(x,'business_question')?['business_question']:[])].sort().join('|')||!['1.0'].includes(String(x.version))||typeof x.action!=='string'||!Object.hasOwn(delegationActions,x.action)||typeof x.private_purpose!=='string'||!x.private_purpose.trim()||x.private_purpose.length>12000||!source.aggregate)fail();
 if(Object.hasOwn(x,'business_question'))validateDelegationBusinessQuestion(x.business_question,[x.private_purpose,source.case_name]);
 const material=JSON.parse(automaticDelegationAggregate(source).content);
 for(const field of ['reference_paths','completion_reference_paths']){const paths=x[field];if(!Array.isArray(paths)||!paths.length||paths.length>12||new Set(paths).size!==paths.length)fail();for(const [index,p] of paths.entries()){const details={argument_path:'/instruction/'+field+'/'+index,available_reference_paths:delegationReferencePaths(source)};if(typeof p!=='string')fail('invalid_instruction',details);try{resolvePath(material,p);}catch(error){fail((error as {safe_details?:{reason:string}}).safe_details?.reason??'invalid_instruction',details);}}}
 // Selecting an object already authorizes its real descendants. Full pointer segments
 // prevent a neighboring key with the same string prefix from joining that subset.
 for(const [index,p] of (x.completion_reference_paths as string[]).entries())if(!(x.reference_paths as string[]).some(selected=>p===selected||p.startsWith(selected+'/')))fail('completion_path_not_selected',{argument_path:'/instruction/completion_reference_paths/'+index,available_reference_paths:[...x.reference_paths as string[]]});
 return structuredClone(x) as AutomaticDelegationInstruction;
}
export function automaticDelegationProjection(raw:unknown,source:AssistantSource,at:string){
 const instruction=validateAutomaticInstruction(raw,source),material=JSON.parse(automaticDelegationAggregate(source).content);
 const task=(instruction.business_question?'业务子问题：'+instruction.business_question+'；':'')+delegationActions[instruction.action]+'：'+instruction.reference_paths.join('、')+'；完成后引用'+instruction.completion_reference_paths.join('、')+'说明发现、限制及待补证，不作为正式事实或决定。';
 const text=JSON.stringify({classification:'selected_authorized_material',material_id:source.aggregate.artifact_id,references:instruction.reference_paths.map(path=>({path,value:resolvePath(material,path)}))});
 const digest=taskHash({purpose:'automatic-selected-history-v1',owner:source.owner,text});
 const event:AssistantEvent={id:[digest.slice(0,8),digest.slice(8,12),'4'+digest.slice(13,16),'a'+digest.slice(17,20),digest.slice(20,32)].join('-'),attempt_id:source.owner.session_id,at,kind:'advice',text,tool:null,status:'authorized_material_projection',source_revision:source.owner.revision_id};
 return {instruction,task,history:event};
}
export function delegationReferencePaths(source:AssistantSource){
 const value:unknown=JSON.parse(automaticDelegationAggregate(source).content);
 const paths:string[]=[],pending:[unknown,string][]=[[value,'']];
 while(pending.length&&paths.length<64){const [v,prefix]=pending.shift()!;if(!v||typeof v!=='object')continue;const keys=Object.keys(v);if(prefix===''){const priority=['calculation','verification'];keys.sort((a,b)=>{const rank=(key:string)=>{const index=priority.indexOf(key);return index<0?priority.length:index;};return rank(a)-rank(b);});}for(const key of keys){const p=prefix+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1');if(p.length>512||paths.length>=64)continue;paths.push(p);pending.push([Reflect.get(v,key),p]);}}
 return paths;
}
export const delegationInstructionSchema={type:'object',properties:{action:{type:'string',enum:Object.keys(delegationActions)},reference_paths:{type:'array',description:'Choose a few relevant real catalog paths, at most 12. The catalog contains choices, not a required checklist. Selecting an object includes its real descendants; do not guess absent fields.',minItems:1,maxItems:12,items:{type:'string',pattern:'^/',minLength:1,maxLength:512}},completion_reference_paths:{type:'array',description:'Use a selected reference_path or a real descendant inside that selected object. Never use a sibling, missing field or unselected material.',minItems:1,maxItems:12,items:{type:'string',pattern:'^/',minLength:1,maxLength:512}}},required:['action','reference_paths','completion_reference_paths'],additionalProperties:false};

export function assertAutomaticDelegationSubset(parent:AutomaticDelegationInstruction|undefined,next:AutomaticDelegationInstruction|undefined){
 if(!parent)return;
 if(!next||next.reference_paths.some(path=>!parent.reference_paths.some(p=>path===p||path.startsWith(p+'/'))))throw Object.assign(new Error('RESULT_OUTSIDE_AUTHORIZATION'),{code:'RESULT_OUTSIDE_AUTHORIZATION',stack:'RESULT_OUTSIDE_AUTHORIZATION'});
}

/** Question wording cannot disguise the same ancestor action and exact material work. */
export function sameAutomaticDelegationWork(a:AutomaticDelegationInstruction|undefined,b:AutomaticDelegationInstruction|undefined){return !!a&&!!b&&a.action===b.action&&taskHash([...a.reference_paths].sort())===taskHash([...b.reference_paths].sort())&&taskHash([...a.completion_reference_paths].sort())===taskHash([...b.completion_reference_paths].sort());}

/** Validates the explicitly authorized field, not the truth or meaning of model text. */
export function validateDelegationBusinessQuestion(question:unknown,privateTexts:readonly unknown[]){if(typeof question!=='string'||!question.trim()||question.length>12000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(question)||privateTexts.some(raw=>typeof raw==='string'&&question.trim()===raw.trim()))fail('business_question_invalid');return question;}
