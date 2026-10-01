import type {ChildResultValue,CollaborationReference} from '../contracts/case-collaboration.ts';
import {assistantFailure,assistantRecord,assistantText} from './case-assistant.ts';
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
