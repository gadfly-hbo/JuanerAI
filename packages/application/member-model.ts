import type {AnalysisTool} from '../ports/open-analysis-runtime.ts';
import {randomUUID} from 'node:crypto';
import {bindQualifiedPreparation} from '../product-core/member-preparation.ts';
import {membershipBytesHash,membershipHash,validateMembershipPlan} from '../product-core/member-analysis.ts';
import {membershipRecord as closed,membershipUuid} from '../product-core/member-analysis.ts';
import {taskHash,fail} from '../product-core/member-task.ts';
import {membershipAnalysisProposal,membershipModelOutput,membershipModelOutputSchema,membershipModelPrompt} from '../product-core/member-model.ts';
import type {MemberModelStore} from '../ports/member-model.ts';
export function createMembershipModelApplication(deps:{store:MemberModelStore;policy:()=>Promise<import('../product-core/member-operation.ts').OperationPolicy>;modelAccess?:import('../ports/provider-settings.ts').LocalModelAccess;agent?:import('../ports/analysis-agent.ts').AnalysisAgent;prepare?:ReturnType<typeof import('./member-preparation.ts').createMemberPreparationApplication>;analyse?:ReturnType<typeof createPreparedMembershipAnalysis>}){
 const active=new Map<string,{task_id:string;abort:AbortController;done:Promise<void>}>();
 function launch(grant_id:string){
  const agent=deps.agent;if(!agent)fail('CAPABILITY_UNAVAILABLE');const a=deps.store.memberModelAuthorization(grant_id);if(active.has(grant_id))return;
  const abort=new AbortController(),signal=abort.signal,authorize=()=>!signal.aborted&&deps.store.memberModelAuthorized(grant_id);
  const done=(async()=>{
   const generation=deps.modelAccess?.snapshot();if(generation&&!generation.available)fail('MODEL_NOT_CONFIGURED');const lease=generation?await deps.modelAccess!.acquire(generation.generation,{session_id:a.work_id,label:'会员分析'}):undefined;
   try{const result=await agent.advance({identity:a.identity,command_id:a.command_id,work_id:a.work_id,purpose:'membership',system:membershipModelPrompt,prompt:JSON.stringify(a.payload),signal,authorize,
    capabilities:async()=>{const tools:AnalysisTool[]=[
     {name:'propose_member_output',description:'提交有来源的MODEL问题、准备方案或获准已核验事实的解释，不产生正式决定。',effect:'write',parameters:membershipModelOutputSchema,async execute(args,toolSignal,invocation){
      if(!authorize()||toolSignal.aborted||!invocation)fail('AUTHORITY_REQUIRED');let raw:unknown=args;

      const payload=args.kind==='report'?await deps.store.readMemberVerifiedPayload(grant_id):deps.store.memberModelAuthorization(grant_id).payload,output=membershipModelOutput(raw,payload);
      const proposal=await deps.store.recordMemberProposal({grant_id,execution_id:randomUUID(),invocation_id:invocation.id,payload,output});return {accepted:true,saved:true,material:'MODEL',independent_verification:'not_performed',calculation_performed:false,proposal_id:proposal.context.execution_id};
     }},
     {name:'prepare_member_sources',description:'显式选择已保存准备提议，在本地执行受控Python并独立核对全部规范化来源。',effect:'write',parameters:{type:'object',additionalProperties:false,properties:{proposal_id:{type:'string',format:'uuid'}},required:['proposal_id']},async execute(args,toolSignal){
      if(!authorize()||!deps.prepare)fail('AUTHORITY_REQUIRED');const saved=await deps.store.readMemberModelForPreparation({task_id:a.work_id,execution_id:String(args.proposal_id),grant_id}),output=saved.result.output;if(output.kind!=='preparation'||!saved.source_set_id)fail('SOURCE_CHANGED');
      const prepared=await deps.prepare.prepare({version:'1.0',task_id:a.work_id,source_set_id:saved.source_set_id,grant_id,bindings:output.bindings,code:output.code},toolSignal);if(!prepared)fail('CANCELLED');return {preparation_execution_id:prepared.context.execution_id,sha256:prepared.sha256,conversion:'qualified'};
     }},
     {name:'analyse_member_preparation',description:'选择准备提议和真实已资格化预处理结果，消费完整IR、本地计算并独立核验M1。',effect:'write',parameters:{type:'object',additionalProperties:false,properties:{proposal_id:{type:'string',format:'uuid'},preparation_execution_id:{type:'string',format:'uuid'}},required:['proposal_id','preparation_execution_id']},async execute(args,toolSignal){if(!authorize()||!deps.analyse)fail('AUTHORITY_REQUIRED');return deps.analyse({task_id:a.work_id,execution_id:String(args.proposal_id),grant_id,preparation_execution_id:String(args.preparation_execution_id)},toolSignal);}},
     {name:'read_verified_result',description:'只读当前授权允许外发的独立核验总体事实；未授权或未核验时拒绝。',effect:'read',parameters:{type:'object',additionalProperties:false,properties:{}},async execute(){if(!authorize())fail('AUTHORITY_REQUIRED');return deps.store.readMemberVerifiedPayload(grant_id);}},
    ];return tools.filter(tool=>tool.name==='propose_member_output'||tool.name==='read_verified_result'?tool.name==='propose_member_output'||a.disclose_verified_result:a.payload.structure.length>0);}});
   if(!authorize())fail('CANCELLED');const proposals=await deps.store.completeMemberProposals(grant_id,result.completion);
   for(const p of proposals)if(p.result.output.kind==='report')await deps.store.publishMemberExplanation({task_id:a.work_id,execution_id:p.context.execution_id});
   }finally{lease?.release();}
  })();done.catch(()=>undefined);active.set(grant_id,{task_id:a.work_id,abort,done});
 }
 const application={
  stopWork(task_id:string){for(const work of active.values())if(work.task_id===task_id)work.abort.abort();},
  async waitForIdle(){const results=await Promise.allSettled([...active.values()].map(w=>w.done));await deps.agent?.waitForIdle();const failed=results.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;},
  async settle(){await Promise.allSettled([...active.values()].map(w=>w.done));await deps.agent?.waitForIdle();},
  async answer(input:unknown){const x=input as {policy_sha256?:unknown};if(x?.policy_sha256!==taskHash(await deps.policy()))fail('MODEL_POLICY_CHANGED');const saved=await deps.store.answerMemberQuestion(input);if(saved.created)launch(saved.grant_id);return saved;},
  async authorize(input:unknown){const x=closed(input,['version','command_id','task_id','source_set_id','expected_row_version','epoch','policy_sha256','disclose_question','disclose_structure','confirmed',...(Object.hasOwn(input as object,'disclose_verified_result')?['disclose_verified_result']:[])]);if(x.confirmed!==true)fail('AUTHORITY_REQUIRED');const policy=await deps.policy();if(x.policy_sha256!==taskHash(policy))fail('MODEL_POLICY_CHANGED');if(!deps.agent)fail('CAPABILITY_UNAVAILABLE');const {confirmed,policy_sha256,...selection}=x;void confirmed;void policy_sha256;
   const saved=await deps.store.authorizeMemberModel({...selection,policy,config_sha256:await deps.agent.configuration(),expires_at:new Date(Date.now()+3600000).toISOString()});if(saved.created)launch(saved.grant_id);return saved;}
 };return application;
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
