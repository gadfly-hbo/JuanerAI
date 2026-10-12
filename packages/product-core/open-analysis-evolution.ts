import type {OpenFrameworkCheckpoint} from '../ports/open-analysis-store.ts';
import type {OpenAnalysisIR} from './open-analysis-ir.ts';
import {taskHash} from './member-task.ts';
function fail():never{throw Object.assign(new Error('FRAMEWORK_REVISION_REQUIRED'),{code:'FRAMEWORK_REVISION_REQUIRED',stack:'FRAMEWORK_REVISION_REQUIRED'});}
function bindings(p:OpenAnalysisIR):readonly OpenAnalysisIR[]{return p.version==='2.2'?p.inputs!.flatMap(bindings):p.base?bindings(p.base).map(b=>p.measure?{...b,unit:p.measure.output_label}:b):p.inputs?p.inputs.flatMap(bindings):[p.version==='2.0'?{...p,unit:p.input_unit!}:p];}
/** A method can evolve, while the user/business contract and prior executable nodes stay fixed. */
export function assertOpenExecutionEvolution(basis:OpenFrameworkCheckpoint,previous:OpenFrameworkCheckpoint,next:OpenFrameworkCheckpoint){
 if(taskHash(basis.identity)!==taskHash(next.identity)||!basis.context||!next.context||basis.context.question.text!==next.context.question.text||basis.plan.inspection_sha256!==next.plan.inspection_sha256)fail();
 if(taskHash(basis.context.semantics??null)!==taskHash(next.context.semantics??null))fail();
 const business=(frame:OpenFrameworkCheckpoint)=>frame.context?.business?(({purpose,object,scope,deliverables,execution_scope})=>({purpose,object,scope,deliverables,...(execution_scope?{execution_scope}:{})}))(frame.context.business):null;
 if(taskHash(business(basis))!==taskHash(business(next)))fail();
 const ratioOnly=next.plan.version==='2.0'&&!!basis.context.business?.execution_scope&&next.plan.input_unit===basis.plan.measure?.output_label;
 const unscaledOnly=!next.plan.measure&&bindings(next.plan).every(b=>basis.context?.semantics?.definitions.find(d=>d.dimension==='unit')?.interpretation?.unit?.unscaled_inputs?.some(i=>{if(i.source_id!==b.source_id||i.sheet_id!==b.sheet_id||i.label!==b.unit)return false;const h=next.context!.source_facts.find(f=>f.source_id===i.source_id&&f.sheet_id===i.sheet_id)?.headers.filter(h=>h.column===i.column||h.value===i.column);return h?.length===1&&h[0]!.column===b.column;}));
 const countsOnly=!next.plan.measure&&bindings(next.plan).every(b=>b.operation==='count');
 const fixedScope=basis.context.business?.execution_scope;
 if(fixedScope)for(const bound of bindings(next.plan)){const anchor=fixedScope.find(a=>a.source_id===bound.source_id&&a.sheet_id===bound.sheet_id);if(!anchor||anchor.filters.some(f=>!(bound.filters??[]).some(g=>taskHash(f)===taskHash(g))))fail();}
 for(const bound of bindings(next.plan))for(const anchor of bindings(basis.plan).filter(a=>a.source_id===bound.source_id&&a.sheet_id===bound.sheet_id)){
  if(!countsOnly&&!unscaledOnly&&bound.unit!==anchor.unit||!fixedScope&&(anchor.filters??[]).some(f=>!(bound.filters??[]).some(g=>taskHash(f)===taskHash(g))))fail();
  if(anchor.value_mappings&&taskHash(anchor.value_mappings)!==taskHash(bound.value_mappings)||anchor.join&&taskHash(anchor.join)!==taskHash(bound.join))fail();
 }
 if(basis.plan.membership&&taskHash(basis.plan.membership)!==taskHash(next.plan.membership))fail();
 if(basis.plan.value_mappings&&taskHash(basis.plan.value_mappings)!==taskHash(next.plan.value_mappings))fail();
 if(basis.plan.measure&&!countsOnly&&!ratioOnly&&!unscaledOnly){
  const a=basis.plan.measure,b=next.plan.measure;
  if(!b||a.currency!==b.currency||a.output_label!==b.output_label||a.output_scale!==b.output_scale)fail();
  for(const input of b.inputs){const known=(fixedScope?basis.context.semantics?.definitions.find(d=>d.dimension==='unit')?.interpretation?.unit?.inputs??a.inputs:a.inputs).find(i=>{if(i.source_id!==input.source_id||i.sheet_id!==input.sheet_id)return false;if(i.column===input.column)return true;const headers=next.context!.source_facts.find(f=>f.source_id===i.source_id&&f.sheet_id===i.sheet_id)?.headers.filter(h=>h.column===i.column||h.value===i.column);return headers?.length===1&&headers[0]!.column===input.column;});if(!known||known.scale!==input.scale)fail();}
 }
 const base=(p:OpenAnalysisIR):OpenAnalysisIR=>p.base?base(p.base):p;
 const origin=base(basis.plan),target=base(next.plan);
 if(origin.join){
  if(target.join&&taskHash(origin.join)!==taskHash(target.join))fail();
  const order=origin.inputs?.[0],orderScope=order&&fixedScope?.find(b=>b.source_id===order.source_id&&b.sheet_id===order.sheet_id);
  if(!target.join&&((orderScope?.filters??order?.filters)?.length??0)>0&&bindings(target).some(b=>b.source_id===origin.inputs?.[1]?.source_id&&b.sheet_id===origin.inputs?.[1]?.sheet_id))fail();
 }
 
 for(const step of previous.steps?.steps??[]){const found=next.steps?.steps.find(s=>s.step_id===step.step_id);if(!found||taskHash(found)!==taskHash(step))fail();}
}
