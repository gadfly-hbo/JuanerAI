import type {ChildResultValue,CollaborationReference} from '../contracts/case-collaboration.ts';
import {assistantFailure,assistantRecord,assistantText} from './case-assistant.ts';
/** The actual source Task question, observed when linked; no fabricated model event. */
export function sourceUserQuestion(source:import('../contracts/case-assistant.ts').AssistantSource,observedAt:string):import('../contracts/case-assistant.ts').AssistantEvent[]{
 const origin=source.open_origin;if(!origin)return [];
 return [{id:origin.task_id,attempt_id:origin.run_id,at:observedAt,kind:'user',text:source.case_name,tool:null,status:'SOURCE_USER_QUESTION_OBSERVED',source_revision:source.owner.revision_id}];
}
export const childResultParameters={type:'object',properties:{kind:{type:'string',enum:['result']},summary:{type:'string',minLength:1},references:{type:'array',minItems:1,items:{type:'object',properties:{kind:{type:'string',enum:['case','evidence','finding','candidate','aggregate','report','history','result']},id:{type:'string'},revision_id:{type:'string'},version:{anyOf:[{type:'null'},{type:'integer',minimum:1}]},sha256:{anyOf:[{type:'null'},{type:'string'}]}},required:['kind','id','revision_id','version','sha256'],additionalProperties:false}},limitations:{type:'array',items:{type:'string',minLength:1}},unknowns:{type:'array',items:{type:'string',minLength:1}}},required:['kind','summary','references','limitations','unknowns'],additionalProperties:false};
export function validateChildResult(value:unknown,allowed:readonly CollaborationReference[]):ChildResultValue{
 const r=assistantRecord(value,['kind','summary','references','limitations','unknowns']);
 if(r.kind!=='result'||!assistantText(r.summary)||!Array.isArray(r.references)||r.references.length===0||!Array.isArray(r.limitations)||!Array.isArray(r.unknowns)||r.limitations.length+r.unknowns.length===0)assistantFailure('CHILD_RESULT_INVALID');
 for(const text of [...r.limitations,...r.unknowns])if(!assistantText(text))assistantFailure('CHILD_RESULT_INVALID');
 const seen=new Set<string>();
 for(const ref of r.references){const v=assistantRecord(ref,['kind','id','revision_id','version','sha256']);
  if(!allowed.some(a=>a.kind===v.kind&&a.id===v.id&&a.revision_id===v.revision_id&&a.version===v.version&&a.sha256===v.sha256))assistantFailure('RESULT_OUTSIDE_AUTHORIZATION');
  const key=[v.kind,v.id,v.revision_id,v.version,v.sha256].join('|');if(seen.has(key))assistantFailure('CHILD_RESULT_INVALID');seen.add(key);
 }
 return structuredClone(value) as ChildResultValue;
}
