import {randomUUID} from 'node:crypto';
import {bindQualifiedPreparation} from '../product-core/member-preparation.ts';
import {membershipBytesHash,membershipHash,validateMembershipPlan} from '../product-core/member-analysis.ts';
import {membershipRecord as closed,membershipUuid} from '../product-core/member-analysis.ts';
import {taskHash,fail} from '../product-core/member-task.ts';
import {membershipAnalysisProposal,membershipModelResultHash} from '../product-core/member-model.ts';
import type {CaseAssistantRuntime} from '../ports/case-assistant.ts';
import type {LocalModelAccess} from '../ports/provider-settings.ts';
import type {MemberModelStore} from '../ports/member-model.ts';
/** Existing Runtime/shared model slot; exact immutable material is constructed by the durable Store. */
export function createMembershipModelApplication(deps:{store:MemberModelStore;runtime:CaseAssistantRuntime;modelAccess:LocalModelAccess;policy:()=>Promise<import('../product-core/member-operation.ts').OperationPolicy>;preparation?:ReturnType<typeof import('./member-preparation.ts').createMemberPreparationApplication>;advance?:ReturnType<typeof createPreparedMembershipAnalysis>}){
 const unresolved=new Map<string,{release():void}>();
 async function once(input:unknown,signal:AbortSignal){
  const x=closed(input,['task_id','grant_id','stage']);if(!membershipUuid(x.task_id)||!membershipUuid(x.grant_id)||!['clarify','generate_preparation','correct_preparation','explain'].includes(String(x.stage))||!(signal instanceof AbortSignal))fail();if(signal.aborted)fail('CANCELLED');if(!deps.runtime.membershipTurn||!deps.runtime.describeMembershipOutcome)fail('RUNTIME_UNAVAILABLE');
  const configured=await deps.policy();
  const lease=await deps.modelAccess.acquire(deps.modelAccess.snapshot().generation,{session_id:null,label:'会员多来源分析'});let retained=false;
  try{const attempt=await deps.store.beginMemberModel({...x,policy_sha256:taskHash(configured)});if(attempt.result)return attempt.result;const context=attempt.context;retained=true;unresolved.set(context.execution_id,lease);let returned:unknown,result;
   try{result=await deps.runtime.membershipTurn({version:'2.0',context,policy:attempt.policy,payload:attempt.payload,signal});returned=result;}catch(error){returned=error;}
   let proof=deps.runtime.describeMembershipOutcome(returned);if(proof&&(taskHash(proof.context)!==taskHash(context)||result&&proof.result_sha256!==membershipModelResultHash(result)))proof=null;
   if(proof&&proof.physical_status!=='unknown'){retained=false;unresolved.delete(context.execution_id);}
   const raw=(returned as {code?:unknown})?.code,failure_code=result?null:typeof raw==='string'&&/^[A-Z0-9_]{1,80}$/.test(raw)?raw:'CONNECTION_FAILED';
   const settled=await deps.store.finishMemberModel({task_id:context.task_id,execution_id:context.execution_id,proof,result:proof?result??null:null,failure_code:proof?failure_code:'MODEL_PROVENANCE_INVALID'});
   if(settled.status==='unknown'){unresolved.set(context.execution_id,lease);retained=true;fail('PHYSICAL_PENDING');}
   if(!settled.result)fail(settled.status==='stopped'?'CANCELLED':settled.failure_code??'MODEL_FAILED');return settled.result;
  }finally{if(!retained)lease.release();}
 }
 async function run(input:unknown,signal:AbortSignal){try{return await once(input,signal);}catch(error){if(signal.aborted||!['NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT'].includes(String((error as {code?:unknown}).code)))throw error;return once(input,signal);}}
 const application={async answer(input:unknown){const x=input as {policy_sha256?:unknown};if(x?.policy_sha256!==taskHash(await deps.policy()))fail('MODEL_POLICY_CHANGED');return deps.store.answerMemberQuestion(input);},async authorize(input:unknown){const x=closed(input,['version','command_id','task_id','source_set_id','expected_row_version','epoch','policy_sha256','disclose_question','disclose_structure','confirmed',...(Object.hasOwn(input as object,'disclose_verified_result')?['disclose_verified_result']:[])]);if(x.confirmed!==true)fail('AUTHORITY_REQUIRED');const policy=await deps.policy();if(x.policy_sha256!==taskHash(policy))fail('MODEL_POLICY_CHANGED');const {confirmed,policy_sha256,...selection}=x;void confirmed;void policy_sha256;return deps.store.authorizeMemberModel({...selection,policy,expires_at:new Date(Date.now()+3600000).toISOString()});},run,async prepare(input:unknown,signal:AbortSignal){const x=closed(input,['task_id','grant_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.grant_id))fail();if(!deps.preparation)fail('RUNTIME_UNAVAILABLE');let result=await run({...x,stage:'generate_preparation'},signal);let saved=await deps.store.readMemberModel({task_id:x.task_id,execution_id:result.context.execution_id});if(saved.status!=='succeeded'||!saved.result||membershipModelResultHash(saved.result)!==membershipModelResultHash(result))fail('MODEL_PROVENANCE_INVALID');let output=saved.result.output;if(output.kind==='question')return {status:'waiting' as const,result:saved.result};if(output.kind!=='preparation')fail('OUTBOUND_FORBIDDEN');let prepared;
   const execute=()=>deps.preparation!.prepare({version:'1.0',task_id:x.task_id,source_set_id:saved.source_set_id,grant_id:x.grant_id,bindings:output.kind==='preparation'?output.bindings:[],code:output.kind==='preparation'?output.code:''},signal);
   try{prepared=await execute();}catch(error){
    if(signal.aborted||!['CONVERSION_UNQUALIFIED','PREPARATION_OUTPUT_INVALID'].includes(String((error as {code?:string}).code)))throw error;
    result=await run({...x,stage:'correct_preparation'},signal);
    saved=await deps.store.readMemberModel({task_id:x.task_id,execution_id:result.context.execution_id});
    if(saved.status!=='succeeded'||!saved.result||membershipModelResultHash(saved.result)!==membershipModelResultHash(result))fail('MODEL_PROVENANCE_INVALID');
    output=saved.result.output;if(output.kind==='question')return {status:'waiting' as const,result:saved.result};if(output.kind!=='preparation')fail('OUTBOUND_FORBIDDEN');
    prepared=await execute();
   }
   if(!deps.advance)return {status:'prepared' as const,result:saved.result,preparation:prepared};const advanced=await deps.advance({task_id:x.task_id,grant_id:x.grant_id,execution_id:saved.context.execution_id,preparation_execution_id:prepared.context.execution_id},signal);if(advanced.status==='waiting')return {...advanced,result:saved.result,preparation:prepared};try{const explanation=await run({...x,stage:'explain'},signal);if(explanation.output.kind==='report')await deps.store.publishMemberExplanation({task_id:x.task_id,execution_id:explanation.context.execution_id});return {status:explanation.output.kind==='report'?'explained' as const:'waiting' as const,result:explanation,preparation:prepared,run_id:advanced.run_id};}catch(error){if((error as {code?:string}).code==='MATERIAL_AUTHORITY_REQUIRED')return {status:'waiting' as const,reason:'verified_result_authorization_required',result:saved.result,preparation:prepared,run_id:advanced.run_id};throw error;}},async continue(input:unknown,signal:AbortSignal){const x=closed(input,['task_id','grant_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.grant_id))fail();const current=await deps.store.readCurrentMemberAnalysis({task_id:x.task_id});if(!current)return application.prepare(input,signal);try{const result=await run({...x,stage:'explain'},signal);if(result.output.kind==='report')await deps.store.publishMemberExplanation({task_id:x.task_id,execution_id:result.context.execution_id});return {status:result.output.kind==='report'?'explained' as const:'waiting' as const,result,run_id:current.run_id};}catch(error){if((error as {code?:string}).code==='MATERIAL_AUTHORITY_REQUIRED')return {status:'waiting' as const,reason:'verified_result_authorization_required',run_id:current.run_id};throw error;}},unresolvedExecutions:()=>[...unresolved.keys()]};
 return application;
}

/** In-memory lifetime owner only. Construction never enumerates or resumes persisted work. */
export function createMembershipWorkflow(application:ReturnType<typeof createMembershipModelApplication>){
 const jobs=new Map<string,{grant_id:string;abort:AbortController;done:Promise<void>}>(),failures=new Map<string,string>();let closing=false;
 return {
  start(input:unknown){const x=closed(input,['task_id','grant_id','source_set_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.grant_id)||x.source_set_id!==null&&!membershipUuid(x.source_set_id))fail();if(closing)fail('SERVICE_CLOSING');const task_id=x.task_id,grant_id=x.grant_id,prior=jobs.get(task_id);if(prior){if(prior.grant_id!==grant_id)fail('PHYSICAL_PENDING');return;}
   const abort=new AbortController();failures.delete(task_id);
   const done=Promise.resolve().then(async()=>{if(x.source_set_id===null)await application.run({task_id,grant_id,stage:'clarify'},abort.signal);else await application.continue({task_id,grant_id},abort.signal);}).catch(error=>{const code=(error as {code?:unknown})?.code;failures.set(task_id,typeof code==='string'&&/^[A-Z0-9_]{1,80}$/.test(code)?code:'WORKFLOW_FAILED');}).finally(()=>{jobs.delete(task_id);});
   jobs.set(task_id,{grant_id,abort,done});
  },
  stop(task_id:string){jobs.get(task_id)?.abort.abort();},
  close(){closing=true;for(const job of jobs.values())job.abort.abort();},
  async collect(){await Promise.all([...jobs.values()].map(job=>job.done));return {failures:Object.fromEntries(failures),unresolved:application.unresolvedExecutions()};},
  pending:()=>[...jobs.keys()],
 };
}

/** Canonical qualified columns and the bounded M1 method are system facts;
 * periods and valid-status meanings are taken only from attributed model output. */
export function compilePreparedMembershipSemantics(value:unknown,payload:import('../product-core/member-model.ts').MembershipModelPayload,execution_id:string){
 if(value===undefined)return null;
 if(!membershipUuid(execution_id))fail('MODEL_PROVENANCE_INVALID');
 const proposal=membershipAnalysisProposal(value,payload);
 const selection={column_mapping:{member_id_column:'member_id',member_group_column:null,order_id_column:'order_id',order_member_id_column:'order_member_id',paid_at_column:'paid_at',amount_column:'amount',status_column:'status',currency_column:'currency'},comparison_period:proposal.comparison_period,current_period:proposal.current_period,currency:proposal.currency,time_zone:proposal.time_zone,valid_statuses:proposal.statuses.map(s=>s.value),selected_group_mode:'none' as const};
 const scenario={version:'1.0' as const,id:execution_id,revision:'1',maintainer:'Xanthil system-derived M1 interpretation',metric:'membership_repurchase_comparison' as const,currency:proposal.currency,time_zone:proposal.time_zone,status_meanings:Object.fromEntries(proposal.statuses.map(s=>[s.value,s.meaning])),quality_policy:'desktop_six_treatments_v1' as const,verification:'python_independent_exact' as const};
 return {selection,scenario};
}

/** Explicitly invoked continuation; constructing it never scans or resumes work. */
export function createPreparedMembershipAnalysis(deps:{store:MemberModelStore&import('../ports/member-preparation.ts').MemberPreparationStore&import('../ports/member-task.ts').MembershipTaskStore;desktop:ReturnType<typeof import('./xanthil-desktop-decision-case.ts').createXanthilDesktopDecisionCaseApplication>}){
 return async(input:unknown,signal:AbortSignal)=>{
  const x=closed(input,['task_id','execution_id','grant_id','preparation_execution_id']);if(!Object.values(x).every(membershipUuid))fail();if(signal.aborted)fail('CANCELLED');
  const saved=await deps.store.readMemberModelForPreparation({task_id:String(x.task_id),execution_id:String(x.execution_id),grant_id:String(x.grant_id)}),output=saved.result!.output;
  const compiled=output.kind==='preparation'?compilePreparedMembershipSemantics(output.analysis,saved.payload,String(x.execution_id)):null;
  if(!compiled)return {status:'waiting' as const,reason:'semantic_clarification_required'};
  const qualified=await deps.store.readQualifiedPreparation({task_id:String(x.task_id),execution_id:String(x.preparation_execution_id)}),preparation=bindQualifiedPreparation(qualified.preparation);
  if(saved.source_set_id!==preparation.source_set_id||saved.payload.source_set_sha256!==preparation.source_set_sha256||String(saved.context.epoch)!==preparation.epoch||output.kind!=='preparation'||membershipHash(output.bindings)!==qualified.preparation.bindings_sha256||membershipBytesHash(Buffer.from(output.code))!==preparation.code_sha256)fail('SOURCE_CHANGED');
  const task=await deps.store.read(String(x.task_id)),current=await deps.desktop.readProjection(task.owner);if(membershipHash(task.owner)!==membershipHash(preparation.owner)||!current.revision)fail('SOURCE_CHANGED');
  const title=current.revision.hypothesis_display_title,intent={version:saved.payload.clarifications?.length?'2.0' as const:'1.0' as const,...(saved.payload.clarifications?.length?{clarification_sha256:saved.payload.clarifications.at(-1)!.sha256}:{}),analysis_kind:'overall_change' as const,question_sha256:membershipBytesHash(Buffer.from(current.revision.question_text)),user_hypothesis:title.trim()?title:null},authority={task_id:String(x.task_id),grant_id:String(x.grant_id),epoch:String(task.epoch),...(String(task.epoch)!==preparation.epoch?{resume_preparation_sha256:preparation.sha256}:{})},context={version:'2.0' as const,intent,authority,preparation};
  const resolved=await deps.store.readPlanPreparation(context);if((['members_bytes','orders_bytes'] as const).some(role=>membershipBytesHash(resolved.candidate[role])!==membershipBytesHash(qualified.candidate[role])))fail('SOURCE_CHANGED');
  for(const run of current.runs.filter(r=>r.run_contract_version==='5.0')){const prior=await deps.store.reviewPlan(String(x.task_id),run.run_id);if(prior.version==='2.0'&&prior.preparation.sha256===preparation.sha256&&membershipHash(prior.parameters)===membershipHash(compiled.selection)&&membershipHash(prior.intent)===membershipHash(intent)){if(run.status==='Succeeded')return {status:'analysed' as const,run_id:run.run_id};fail(run.status==='Running'?'PHYSICAL_PENDING':'RETRY_EXHAUSTED');}}
  const source_files={members:{display_name:'members.csv',bytes:qualified.candidate.members_bytes},orders:{display_name:'orders.csv',bytes:qualified.candidate.orders_bytes}},base={contract_version:'1.0' as const,...task.owner,expected_row_version:current.revision.row_version,source_files};
  const initial=await deps.desktop.inspectImportFiles(base),inspection=await deps.desktop.inspectImportFiles({...base,inspection_token:initial.inspection_token,configuration:compiled.selection});if(signal.aborted)fail('CANCELLED');
  const ready=await deps.desktop.confirmPreparedRevision({command:{...base,contract_version:'2.0',command_id:randomUUID(),inspection_token:inspection.inspection_token,confirmation:{...compiled.selection,issue_treatments:inspection.reviewable_issues.map(i=>({code:i.code,count:i.count,treatment:i.treatment_options[0]})),analysis_kind:'overall_change',method_id:'membership_repurchase_comparison',method_version:'1.0',authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}},preparation_context:context});
  const plan=validateMembershipPlan({version:'2.0',id:randomUUID(),owner:task.owner,confirmation_id:ready.confirmation!.confirmation_id,snapshot_id:ready.snapshot!.snapshot_id,scenario:compiled.scenario,scenario_sha256:membershipHash(compiled.scenario),contract_sha256:membershipHash(compiled.selection),binding_sha256:membershipHash(compiled.selection.column_mapping),sources:preparation.normalized,methods:['M1'],parameters:compiled.selection,verification:'python_independent_exact',intent,preparation,authority},qualified.candidate);
  if(signal.aborted)fail('CANCELLED');let projection=await deps.desktop.startAnalysis({contract_version:'3.0',command_id:randomUUID(),...task.owner,expected_row_version:ready.revision!.row_version,confirmation_id:plan.confirmation_id,execution_plan:plan});const run_id=projection.runs.at(-1)!.run_id;
  const cancel=()=>{void deps.desktop.readProjection(task.owner).then(p=>deps.desktop.cancelAnalysis({contract_version:'1.0',command_id:randomUUID(),...task.owner,expected_row_version:p.revision!.row_version,run_id})).catch(()=>undefined);};signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
  try{while(projection.runs.find(r=>r.run_id===run_id)?.status==='Running'){projection=await deps.desktop.waitForProjection({...task.owner,projection_token:projection.projection_token});await new Promise(resolve=>setTimeout(resolve,25));}if(signal.aborted)fail('CANCELLED');if(projection.runs.find(r=>r.run_id===run_id)?.status!=='Succeeded')fail('CALCULATION_FAILED');return {status:'analysed' as const,run_id};}finally{signal.removeEventListener('abort',cancel);}
 };
}
