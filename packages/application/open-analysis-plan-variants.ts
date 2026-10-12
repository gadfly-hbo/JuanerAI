import {membershipRecord} from '../product-core/member-analysis.ts';
import {openAnalysisProposal,type OpenAnalysisIR} from '../product-core/open-analysis-ir.ts';

function fail(code:string):never{throw Object.assign(new Error(code),{code});}

/** A reference inherits a checked recipe, never business defaults or authority. */
export function openAnalysisPlanVariants(plan:OpenAnalysisIR,reference:string,raw:unknown):Record<string,unknown>[] {
 if(!Array.isArray(raw)||!raw.length||raw.length>24)fail('PLAN_INVALID');
 const base=plan.version==='1.8'?plan.base:plan;
 if(!base||!['1.1','1.2','1.3','1.7','1.9'].includes(base.version))fail('METHOD_UNAVAILABLE');
 return raw.map(value=>{
  const variant=membershipRecord(value,['base_plan_ref','goal','changes']);
  if(variant.base_plan_ref!==reference)fail('CANDIDATE_REFERENCE_INVALID');
  if(typeof variant.goal!=='string'||!variant.goal.trim()||variant.goal.length>2000||!Array.isArray(variant.changes)||!variant.changes.length||variant.changes.length>32)fail('PLAN_INVALID');
  const proposal=structuredClone(openAnalysisProposal(plan));delete proposal.context_sha256;
  const editable=plan.version==='1.8'?proposal.base as Record<string,unknown>:proposal;
  delete editable.context_sha256;editable.goal=variant.goal;
  const inputs=Array.isArray(editable.inputs)?editable.inputs as Record<string,unknown>[]:[editable];const seen=new Set<number>();
  for(const value of variant.changes){
   if(!value||typeof value!=='object'||Array.isArray(value))fail('PLAN_INVALID');
   const fields=['column','group_by','filters'].filter(field=>Object.hasOwn(value,field));
   const change=membershipRecord(value,['input_index',...fields]);
   if(!fields.length||!Number.isSafeInteger(change.input_index)||Number(change.input_index)<0||Number(change.input_index)>=inputs.length||seen.has(Number(change.input_index)))fail('PLAN_INVALID');
   seen.add(Number(change.input_index));const input=inputs[Number(change.input_index)]!;
   for(const field of fields)input[field]=structuredClone(change[field]);
  }
  return proposal;
 });
}
