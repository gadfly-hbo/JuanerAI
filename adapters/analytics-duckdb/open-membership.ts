import {randomUUID} from 'node:crypto';
import {createDuckDbPythonDesktopLocalAnalysisExecution} from './xanthil-desktop-decision-case.ts';
import {membershipHash} from '../../packages/product-core/member-analysis.ts';
import {materializeOpenMembershipFramework,membershipGroupMap} from '../../packages/product-core/open-membership.ts';
import {executeOpenAnalysisIR} from '../../packages/product-core/open-analysis-ir.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import type {OpenMembershipExecution} from '../../packages/ports/open-membership.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
/** Existing native method, bound to the actual open task and fresh physical run.
 * No Case/Decision owner or authorization is manufactured for computation. */
export function createLocalOpenMembershipExecution(toolchain:{duckdbExecutable:string;duckdbVersion:string;pythonExecutable:string;pythonVersion:string}):OpenMembershipExecution{
 const adapter=createDuckDbPythonDesktopLocalAnalysisExecution(toolchain);
 return async input=>{
  const check=()=>{if(input.signal.aborted)fail('CANCELLED');if(!input.isAuthorized())fail('AUTHORITY_REQUIRED');};check();
  const plan=input.plan,frame=plan.membership;if(plan.version!=='1.4'||!frame||input.identity.scope_sha256!==taskHash(input.inspection))fail('SOURCE_CHANGED');
  const material=materializeOpenMembershipFramework(frame,input.inspection),implementation=await adapter.describeImplementation({methods:frame.methods});check();
  const run=randomUUID(),physical_run_id=run.slice(0,14)+'7'+run.slice(15),contract={...frame.selection,method_contract_version:'1.0',methods:frame.methods,method_contract_sha256:membershipHash({selection:frame.selection,methods:frame.methods})};
  const request={run_id:physical_run_id,expected_code_identity:implementation.code_identity,contract,snapshot:material.snapshot,group_pseudonym_map:membershipGroupMap(frame,input.inspection),cancellation_signal:input.signal,deadline_seconds:30};
  const group_labels=Object.fromEntries(Object.entries(request.group_pseudonym_map??{}).map(([label,id])=>[id,label]));
  const primary=await adapter.calculate(request);check();
  const reread=await input.readSource();check();if(taskHash(reread)!==plan.inspection_sha256)fail('SOURCE_CHANGED');const independentMaterial=materializeOpenMembershipFramework(frame,reread);
  const independent=await adapter.verify({...request,snapshot:independentMaterial.snapshot});check();
  if(taskHash(primary.result)!==taskHash(independent.result))fail('VERIFICATION_FAILED');
  const calculation=executeOpenAnalysisIR(plan,reread);if(taskHash(JSON.parse(calculation.value))!==taskHash(primary.result))fail('VERIFICATION_FAILED');
  return {calculation,verification:{version:'1.0',grade:'independent_arithmetic',method:'python_member_source_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(reread),result_sha256:taskHash(calculation),value:calculation.value,rows:calculation.rows,native_evidence:{physical_run_id,task_run_id:input.identity.run_id,attempt_id:input.identity.attempt_id,code_identity:implementation.code_identity,materialization_sha256:taskHash(frame.materialization),primary_sha256:taskHash(primary),independent_sha256:taskHash(independent),group_labels,primary,independent}}};
 };
}
