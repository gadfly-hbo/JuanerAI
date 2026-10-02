import {validatePlanStart,validateMembershipPlan,validateAnalysisManifest,analysisResult,analysisRatio,membershipJudgment,membershipHash,type MembershipPlan,type AnalysisRunManifest} from '../product-core/member-analysis.ts';
import type { LocalModelAccess } from '../ports/provider-settings.ts';
import { createHash, randomUUID } from 'node:crypto';
import { desktopAssistancePayload, validateDesktopAssistanceDraft } from '../product-core/xanthil-desktop-decision-case.ts';
import type { DisclosurePreview } from '../contracts/xanthil-desktop-ipc.ts';
import { defineDecisionAssistanceRuntime } from '../ports/local-analysis.ts';
import { validateXanthilDesktopRequest, type ConfirmRevisionRequest, type DesktopProjection, type ImportInspection, type OwnerRef, type SessionSummary } from '../contracts/xanthil-desktop-ipc.ts';
import { canonicalDesktopJson, desktopConfirmationDocuments, desktopFinalReport, desktopJudgment, parseDesktopCsv, prepareDesktopData, validateDesktopCalculationResult, validateDesktopDecisionForm, validateDesktopRunManifest, type DesktopRunManifest } from '../product-core/xanthil-desktop-decision-case.ts';
import { defineDesktopDecisionCaseStore, defineDesktopLocalAnalysisExecution, defineDesktopRunEvidenceStore, type DesktopAnalysisSettlement, type DesktopDecisionCaseStore, type DesktopProjectOpen, type DesktopRunBytes, type DesktopSourcePair, type DesktopTerminalRunBundle } from '../ports/xanthil-desktop-decision-case.ts';

type Clock = () => Date;
type OpenProjectRequest = Readonly<{
  contract_version: '1.0';
  command_id: string;
  proposed_project_id: string;
  display_name: string;
}>;

export class DesktopApplicationError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.stack = code;
  }
}

function failure(code: string): never {
  throw new DesktopApplicationError(code);
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!record(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) failure('VALIDATION_FAILED');
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string') failure('VALIDATION_FAILED');
  return value;
}

function asProjectOpen(value: unknown): DesktopProjectOpen {
  const project = exactRecord(value, ['opened', 'initialized', 'project_id', 'display_name', 'schema_version', 'projection_token']);
  if (project.opened !== true || typeof project.initialized !== 'boolean' || project.schema_version !== '1.0') failure('INTEGRITY_BLOCKED');
  const projectId = text(project.project_id);
  const displayName = text(project.display_name);
  const projectionToken = text(project.projection_token);
  return Object.freeze({ opened: true, initialized: project.initialized, project_id: projectId, display_name: displayName, schema_version: '1.0', projection_token: projectionToken });
}

function sessionSummary(value: unknown): SessionSummary {
  const session = exactRecord(value, ['session_id', 'display_name', 'mode', 'case_id', 'current_revision_id', 'created_at']);
  if (session.mode !== 'professional') failure('INTEGRITY_BLOCKED');
  return Object.freeze({
    session_id: text(session.session_id),
    display_name: text(session.display_name),
    mode: 'professional',
    case_id: text(session.case_id),
    current_revision_id: text(session.current_revision_id),
    created_at: text(session.created_at),
  });
}

/** I2 composes Session, import and deterministic analysis; model and closure capabilities stay absent. */
export function createXanthilDesktopDecisionCaseApplication(dependencies: unknown) {
  const dependency = exactRecord(dependencies, ['store','analysisExecution','runEvidenceStore','assistanceRuntime','clock','deadlineScheduler',...(record(dependencies)&&Object.hasOwn(dependencies,'modelAccess')?['modelAccess']:[])]);
  const modelAccess=dependency.modelAccess as LocalModelAccess|undefined;
  const disclosureGenerations=new Map<string,number>();
  const assistance=dependency.assistanceRuntime===null?null:defineDecisionAssistanceRuntime(dependency.assistanceRuntime);
  if (typeof dependency.clock !== 'function') failure('VALIDATION_FAILED');
  const store = defineDesktopDecisionCaseStore(dependency.store);
  const clock = dependency.clock as Clock;
  let openedProjectId: string | undefined;
  let resultPending = false;
  const inspections = new Map<string, Readonly<{ guard: string; source_identity: string; inspection: ImportInspection }>>();
  const disclosures=new Map<string,{owner:OwnerRef;version:string;preview:DisclosurePreview;generation?:number}>();
  const analysis=defineDesktopLocalAnalysisExecution(dependency.analysisExecution);
  const runStore=defineDesktopRunEvidenceStore(dependency.runEvidenceStore);
  const scheduler=exactRecord(dependency.deadlineScheduler,['schedule']);
  if(typeof scheduler.schedule!=='function')failure('VALIDATION_FAILED');
  const activeRuns=new Map<string,{abort:AbortController;reason:string|null}>();
  type ModelWork={abort:AbortController;reason:string|null;release?:()=>void;physicalPending?:boolean;finished?:boolean};
  const activeAttempts=new Map<string,ModelWork>();
  const modelWork=new Set<ModelWork>();
  let modelClosed=false;
  function modelGuard(){if(modelClosed)failure('INTERRUPTED');}
  function releaseModelWork(work:ModelWork){
    if(!work.physicalPending){work.release?.();work.release=undefined;}
  }
  function closeModelWork(){
    modelClosed=true;disclosures.clear();disclosureGenerations.clear();
    for(const work of modelWork){work.reason='interrupted';work.abort.abort();releaseModelWork(work);}
    if(activeAttempts.size)void assistance?.cancel().catch(()=>undefined);
  }
  const timestamp=()=>{const now=clock();if(!(now instanceof Date)||!Number.isFinite(now.getTime()))failure('VALIDATION_FAILED');return now.toISOString();};
  const hash=(input:Uint8Array|string)=>createHash('sha256').update(input).digest('hex');
  const encode=(value:unknown)=>new TextEncoder().encode(canonicalDesktopJson(value));
  const bytes=(input:Uint8Array):DesktopRunBytes=>({bytes:input,sha256:hash(input),byte_length:String(input.length)});
  const fingerprint=(operation_kind:string,command:Record<string,unknown>,detail:Record<string,unknown>={})=>{const {command_id,...request}=command;void command_id;return hash(canonicalDesktopJson({operation_kind,request,...detail}));};

  async function prepareAssistanceDisclosure(input:unknown):Promise<DisclosurePreview>{
    modelGuard();
    if(resultPending)failure('RESULT_PENDING');
    const command=validateXanthilDesktopRequest('prepareAssistanceDisclosure',input),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    const projection=await readProjection(owner);if(projection.revision?.row_version!==command.expected_row_version)failure('STALE_REVISION');
    const allowed=desktopAssistancePayload(projection,command.action_kind),preview:DisclosurePreview=Object.freeze({preview_token:randomUUID(),action_kind:command.action_kind,...allowed,payload_sha256:hash(allowed.payload_text),requested_provider:command.requested_provider,requested_model:command.requested_model,irretractability_notice:'发送后的模型载荷无法撤回；取消仅阻止后续结果采用。',cost_notice:null});
    modelGuard();disclosures.set(preview.preview_token,{owner,version:command.expected_row_version,preview,generation:modelAccess?.snapshot().generation});return preview;
  }

  async function startAssistance(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('startAssistance',input),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    modelGuard();const control:ModelWork={abort:new AbortController(),reason:null};modelWork.add(control);
    let lease:{release():void}|undefined,transferred=false;
    try{
    if(modelAccess&&assistance)lease=await modelAccess.acquire(disclosureGenerations.get(command.disclosure_id)??-1,{session_id:owner.session_id,label:'专业模式辅助'});
    control.release=()=>lease?.release();modelGuard();
    const prior=await store.checkAssistanceAdmission(command);modelGuard();if(prior)return prior;
    const projection=await readProjection(owner),disclosure=projection.disclosures.find(d=>d.disclosure_id===command.disclosure_id);
    modelGuard();if(!disclosure)failure('NOT_FOUND');if(disclosure.decision!=='accepted')failure('AUTHORITY_REQUIRED');
    if(projection.revision?.row_version!==command.expected_row_version)failure('STALE_REVISION');
    const payload=desktopAssistancePayload(projection,disclosure.action_kind);
    if(hash(payload.payload_text)!==disclosure.payload_sha256||canonicalDesktopJson(payload.categories)!==canonicalDesktopJson(disclosure.categories)||canonicalDesktopJson(payload.aggregate_refs)!==canonicalDesktopJson(disclosure.aggregate_refs))failure('PAYLOAD_STALE');
    if(!assistance)failure('PROVIDER_UNAVAILABLE');
    const selection=await assistance.preflightSelection({requested_provider:disclosure.requested_provider,requested_model:disclosure.requested_model});
    modelGuard();exactRecord(selection,['runtime_id','runtime_version','adapter_id','adapter_version','requested_provider','requested_model','ready']);
    if(selection.ready!==true||selection.requested_provider!==disclosure.requested_provider||selection.requested_model!==disclosure.requested_model||Object.entries(selection).some(([k,v])=>k!=='ready'&&(typeof v!=='string'||!v.trim())))failure('PROVIDER_UNAVAILABLE');
    const attempt_id=randomUUID(),started_at=timestamp(),deadline_at=new Date(Date.parse(started_at)+300000).toISOString();
    let admitted:DesktopProjection;try{admitted=await store.admitAssistance({command,attempt_id,runtimeSelection:selection,started_at,deadline_at,input_fingerprint:fingerprint('start_assistance',command)});}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
    if(admitted.attempts.some(a=>a.attempt_id===attempt_id&&a.status==='Running')){
      activeAttempts.set(attempt_id,control);
      transferred=true;
      void executeAssistance(owner,attempt_id,payload.payload_text,control).catch(error=>{if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;}).finally(()=>{activeAttempts.delete(attempt_id);modelWork.delete(control);control.finished=true;releaseModelWork(control);});
    }
    return admitted;
    } finally {if(!transferred){modelWork.delete(control);lease?.release();}}
  }

  async function cancelAssistance(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('cancelAssistance',input);
    try{const projection=await store.requestAssistanceCancellation({command,completed_at:timestamp(),input_fingerprint:fingerprint('cancel_assistance',command)});
      const live=activeAttempts.get(command.attempt_id);if(live&&projection.attempts.find(a=>a.attempt_id===command.attempt_id)?.status==='Cancelled'){live.reason='user_cancelled';live.abort.abort();void assistance?.cancel().catch(()=>undefined);}return projection;
    }catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function disposeAssistanceDraft(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('disposeAssistanceDraft',input);
    try{return await store.disposeAssistanceDraft({command,form_id:randomUUID(),completed_at:timestamp(),input_fingerprint:fingerprint('dispose_assistance_draft',command)});}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function executeAssistance(owner:OwnerRef,attemptId:string,payloadText:string,control:ModelWork):Promise<void>{
    const before=await store.readProjection(owner),attempt=before.attempts.find(a=>a.attempt_id===attemptId)!;
    const deadline=Date.parse(attempt.deadline_at),scheduled=(scheduler.schedule as (v:{at_epoch_ms:number;callback:()=>void})=>{cancel():void})({at_epoch_ms:deadline,callback:()=>{control.reason='deadline_exceeded';control.abort.abort();void assistance!.cancel().catch(()=>undefined);}});
    const settle=async(terminal:Parameters<DesktopDecisionCaseStore['settleAssistance']>[0]['terminal'])=>{
      const current=await store.readProjection(owner),command={contract_version:'1.0' as const,command_id:randomUUID(),...owner,expected_row_version:current.revision!.row_version},completed_at=timestamp();
      if(terminal.status==='succeeded'&&control.abort.signal.aborted)terminal=control.reason==='user_cancelled'?{status:'cancelled',reason:'user_cancelled'}:{status:'failed',reason:control.reason==='interrupted'?'interrupted':'deadline_exceeded'};
      await store.settleAssistance({command,attempt_id:attemptId,terminal,completed_at,input_fingerprint:fingerprint('settle_assistance',command,{attempt_id:attemptId,terminal})});
    };
    const abortCode=()=>control.reason==='interrupted'?'INTERRUPTED':control.reason==='user_cancelled'?'CANCELLED':'DEADLINE_EXCEEDED';
    try{
      if(control.abort.signal.aborted)failure(abortCode());
      if(Date.parse(timestamp())>=deadline)failure('DEADLINE_EXCEEDED');
      const aborted=new Promise<never>((_,reject)=>{const check=()=>reject(new DesktopApplicationError(abortCode()));if(control.abort.signal.aborted)check();else control.abort.signal.addEventListener('abort',check,{once:true});});
      control.physicalPending=true;
      const issued=(async()=>assistance!.executeAssistance({action_kind:attempt.action_kind as 'organize_question',payload_bytes:new TextEncoder().encode(payloadText),payload_sha256:hash(payloadText),requested_provider:attempt.requested_provider,requested_model:attempt.requested_model,cancellation_signal:control.abort.signal,deadline_seconds:Math.max(0,Math.min(300,Math.floor((deadline-Date.parse(timestamp()))/1000)))}) )().finally(()=>{control.physicalPending=false;if(control.finished||control.abort.signal.aborted)releaseModelWork(control);});
      const output=await Promise.race([issued,aborted]);
      if(control.abort.signal.aborted)failure(abortCode());if(Date.parse(timestamp())>=deadline)failure('DEADLINE_EXCEEDED');
      exactRecord(output,['actual_provider','actual_model','draft_kind','draft_content']);if(!output.actual_provider.trim()||!output.actual_model.trim())failure('VALIDATION_FAILED');
      const expected={organize_question:'question_fields',explain_evidence:'evidence_explanation',draft_candidates:'candidates'}[attempt.action_kind];if(output.draft_kind!==expected)failure('VALIDATION_FAILED');
      validateDesktopAssistanceDraft(String(output.draft_kind),output.draft_content,true);
      let generated_content:import('../contracts/xanthil-desktop-ipc.ts').AssistanceDraftContent=output.draft_content as import('../contracts/xanthil-desktop-ipc.ts').AssistanceDraftContent;
      if(output.draft_kind==='candidates'){
        const content=exactRecord(output.draft_content,['candidates']);if(!Array.isArray(content.candidates))failure('VALIDATION_FAILED');
        generated_content={candidates:content.candidates.map(c=>{const x=exactRecord(c,['title','evidence_basis','risk_or_refutation','applicability_conditions','future_validation_metric']);return {candidate_id:randomUUID(),title:text(x.title),evidence_basis:text(x.evidence_basis),risk_or_refutation:text(x.risk_or_refutation),applicability_conditions:text(x.applicability_conditions),future_validation_metric:text(x.future_validation_metric)};})};
      }
      const draft_id=randomUUID();validateXanthilDesktopRequest('disposeAssistanceDraft',{contract_version:'1.0',command_id:randomUUID(),...owner,expected_row_version:'1',draft_id,disposition:'rejected',edited_content:generated_content});
      await settle({status:'succeeded',draft_id,actual_provider:output.actual_provider,actual_model:output.actual_model,draft_kind:output.draft_kind,generated_content});
    }catch(error){const code=String((error as{code?:string}).code??(error as Error).message);if(code==='RESULT_PENDING'){resultPending=true;throw error;}
      await settle(code==='CANCELLED'?{status:'cancelled',reason:'user_cancelled'}:{status:'failed',reason:code==='DEADLINE_EXCEEDED'?'deadline_exceeded':code==='INTERRUPTED'?'interrupted':['VALIDATION_FAILED','INVALID_REQUEST'].includes(code)?'validation_failed':'provider_failed'});
    }finally{scheduled.cancel();}
  }

  async function decideAssistanceDisclosure(input:unknown):Promise<DesktopProjection>{
    modelGuard();
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('decideAssistanceDisclosure',input),entry=disclosures.get(command.preview_token);
    if(!entry||Object.entries(entry.owner).some(([key,value])=>command[key as keyof typeof command]!==value)||entry.version!==command.expected_row_version||entry.preview.payload_sha256!==command.payload_sha256)failure('PAYLOAD_STALE');
    if(modelAccess&&entry.generation!==modelAccess.snapshot().generation)failure('CONFIGURATION_CHANGED');
    if(command.decision==='accepted'&&entry.preview.free_text_present&&!command.free_text_confirmed)failure('AUTHORITY_REQUIRED');
    const {preview_token,...semantic}=command;void preview_token;
    const preview=entry.preview,identity={action_kind:preview.action_kind,categories:preview.categories,aggregate_refs:preview.aggregate_refs,requested_provider:preview.requested_provider,requested_model:preview.requested_model};
    try{const disclosure_id=randomUUID();const result=await store.recordDisclosure({command,disclosure_id,preview,decided_at:timestamp(),input_fingerprint:fingerprint('record_model_disclosure',semantic,identity)});modelGuard();if(modelAccess&&command.decision==='accepted'){const actual=result.disclosures.find(d=>d.disclosure_id===disclosure_id);if(actual)disclosureGenerations.set(actual.disclosure_id,entry.generation!);}return result;}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function startAnalysis(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');if(!analysis||!runStore||!scheduler)failure('TOOLCHAIN_UNAVAILABLE');
    const command=validatePlanStart(input),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    const current=await readProjection(owner);if(current.session?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');if(current.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    const plan=command.contract_version==='2.0'?command.execution_plan:undefined;
    if(plan){const confirmed=await store.readConfirmedSnapshot({...owner,confirmation_id:command.confirmation_id});const c=JSON.parse(new TextDecoder().decode(confirmed.confirmation.contract_bytes)),binding=JSON.parse(new TextDecoder().decode(confirmed.confirmation.binding_bytes));const parameters={column_mapping:binding,comparison_period:c.comparison_period,current_period:c.current_period,currency:c.currency,time_zone:c.time_zone,valid_statuses:c.valid_statuses,selected_group_mode:c.selected_group_mode};validateMembershipPlan(plan,{members_bytes:confirmed.snapshot.members.bytes,orders_bytes:confirmed.snapshot.orders.bytes},parameters);if(plan.snapshot_id!==confirmed.snapshot.snapshot_id)failure('SOURCE_CHANGED');}
    const description=exactRecord(await analysis.describeImplementation(plan?{execution_plan:plan}:{}),['method_id','method_version','code_identity','duckdb_version','python_version','primary_sql','python_verifier']);
    const started_at=timestamp(),deadline_at=new Date(Date.parse(started_at)+Number(plan?.task_context?.run_ms??300000)).toISOString();
    const random=randomUUID().replaceAll('-',''),hex=Date.parse(started_at).toString(16).padStart(12,'0');
    const run_id=`${hex.slice(0,8)}-${hex.slice(8)}-7${random.slice(13,16)}-${random.slice(16,20)}-${random.slice(20)}`;
    let admitted:DesktopProjection;
    try{admitted=await store.admitAnalysis({command,ids:{run_id},started_at,deadline_at,profile_id:'personal-desktop',method_id:text(description.method_id),method_version:text(description.method_version),code_identity:text(description.code_identity),input_fingerprint:fingerprint('start_analysis',command)});}catch(error){if((error as {code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
    const actual=admitted.runs.find(r=>r.run_id===run_id);
    // A duplicate committed request resolves its original identity and never starts another process.
    if(actual?.status==='Running'&&!activeRuns.has(run_id)){
      const control={abort:new AbortController(),reason:null as string|null};activeRuns.set(run_id,control);
      void executeAnalysis(owner,admitted,description,control,plan).catch(error=>{if((error as {code?:string}).code==='RESULT_PENDING')resultPending=true;}).finally(()=>activeRuns.delete(run_id));
    }
    return admitted;
  }

  async function executeAnalysis(owner:OwnerRef,admitted:DesktopProjection,description:Record<string,unknown>,control:{abort:AbortController;reason:string|null},plan?:MembershipPlan):Promise<void>{
    const run=admitted.runs.at(-1)!,run_id=run.run_id,deadline=Date.parse(run.deadline_at),signal=control.abort.signal;
    let manifest:AnalysisRunManifest|undefined,manifestSha:string|undefined;
    const scheduled=(scheduler!.schedule as (input:{at_epoch_ms:number;callback:()=>void})=>{cancel():void})({at_epoch_ms:deadline,callback:()=>{control.reason='deadline_exceeded';control.abort.abort();}});
    if(!scheduled||typeof scheduled.cancel!=='function')failure('VALIDATION_FAILED');
    const check=()=>{if(Date.parse(timestamp())>=deadline){control.reason='deadline_exceeded';control.abort.abort();}if(control.abort.signal.aborted)failure(control.reason==='user_cancelled'?'CANCELLED':'DEADLINE_EXCEEDED');};
    const settle=async(terminal:DesktopAnalysisSettlement['terminal'],completed_at:string)=>{
      const current=await store.readProjection(owner),command={contract_version:'1.0' as const,command_id:randomUUID(),...owner,expected_row_version:current.revision!.row_version};
      const request={command,run_id,terminal,completed_at,input_fingerprint:fingerprint('settle_analysis',command,{run_id,terminal})};
      try{await store.settleAnalysis(request);}catch(error){if((error as {code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
    };
    try{
      check();const snapshot=await store.readConfirmedSnapshot({...owner,confirmation_id:admitted.confirmation!.confirmation_id});
      const contract={...JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(snapshot.confirmation.contract_bytes)),column_mapping:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(snapshot.confirmation.binding_bytes))};
      // The execution Port receives only the approved business selection, not identity metadata.
      const selection={column_mapping:contract.column_mapping,comparison_period:contract.comparison_period,current_period:contract.current_period,currency:contract.currency,time_zone:contract.time_zone,valid_statuses:contract.valid_statuses,selected_group_mode:contract.selected_group_mode};
      const raw={members_bytes:snapshot.snapshot.members.bytes,orders_bytes:snapshot.snapshot.orders.bytes},prepared=prepareDesktopData(raw,selection);
      const groups=[...new Set(prepared.member_groups.values())].filter((x):x is string=>x!==null);
      const group_pseudonym_map=selection.selected_group_mode==='none'?null:Object.fromEntries(groups.map(name=>[name,randomUUID()]));
      const confirmation_files={contract:bytes(snapshot.confirmation.contract_bytes),binding:bytes(snapshot.confirmation.binding_bytes),ir:bytes(snapshot.confirmation.ir_bytes)};
      const primary=exactRecord(description.primary_sql,['bytes','sha256','byte_length']),python=exactRecord(description.python_verifier,['bytes','sha256','byte_length']);
      if(!(primary.bytes instanceof Uint8Array)||!(python.bytes instanceof Uint8Array)||hash(primary.bytes)!==primary.sha256||hash(python.bytes)!==python.sha256||String(primary.bytes.length)!==primary.byte_length||String(python.bytes.length)!==python.byte_length)failure('INTEGRITY_BLOCKED');
      const descriptor=(path:string,input:Record<string,unknown>)=>({path,sha256:input.sha256,byte_length:input.byte_length});
      manifest=validateAnalysisManifest({schema_version:plan?'4.0':'3.0',...(plan?{execution_plan:plan}:{}),run_id,analysis_kind:'membership_repurchase_decision_case',status:'in_progress',started_at:run.started_at,
        product_context:{...owner,confirmation_id:admitted.confirmation!.confirmation_id,snapshot_id:snapshot.snapshot.snapshot_id},application:{id:'xanthil-desktop',version:'0.1.0'},profile:{id:'personal-desktop'},execution:{kind:'deterministic_local',model_usage:'none'},method:{id:run.method_id,version:run.method_version,code_identity:run.code_identity},tools:{duckdb_version:description.duckdb_version,python_version:description.python_version},
        confirmation:{contract:descriptor('analysis-contract.json',confirmation_files.contract),binding:descriptor('binding.json',confirmation_files.binding),ir:descriptor('ir.json',confirmation_files.ir)},
        sources:(['members','orders'] as const).map(role=>({role,snapshot_id:snapshot.snapshot.snapshot_id,...descriptor(`${owner.session_id}/010_draw/${snapshot.snapshot.snapshot_id}/${role}.csv`,snapshot.snapshot[role]),display_name:snapshot.snapshot[role].display_name,confirmed_at:admitted.snapshot!.confirmed_at})),
        artifacts:[{artifact_id:'primary-query',kind:'query',...descriptor('assets/primary.sql',primary)},{artifact_id:'independent-verifier',kind:'verifier',...descriptor('assets/verify.py',python)}]});
const begun=await runStore!.beginRun({run_id,initial_manifest:manifest,confirmation_files,code_assets:{primary_sql:bytes(primary.bytes),python_verifier:bytes(python.bytes)},cancellation_signal:signal});manifestSha=text(begun.in_progress_manifest_sha256);
      const request=()=>{check();return {run_id,expected_code_identity:run.code_identity,contract:plan?{...selection,schema_version:'2.0',execution_plan:plan}:selection,snapshot:raw,group_pseudonym_map,cancellation_signal:signal,deadline_seconds:Math.min(Number(plan?.task_context?.process_seconds??30),Math.max(0,Math.floor((deadline-Date.parse(timestamp()))/1000)))};};
      const duck=await analysis!.calculate(request());check();const primaryResult=analysisResult(duck.result,plan);
      const first=await runStore!.recordDuckDbResult({run_id,expected_in_progress_manifest_sha256:manifestSha,bytes:encode(duck),cancellation_signal:signal});manifestSha=text(first.in_progress_manifest_sha256);manifest=validateAnalysisManifest({...manifest,artifacts:[...manifest.artifacts,first.descriptor]});
      const verifier=await analysis!.verify(request());check();const independentResult=analysisResult(verifier.result,plan);
      const second=await runStore!.recordPythonResult({run_id,expected_in_progress_manifest_sha256:manifestSha,bytes:encode(verifier),cancellation_signal:signal});manifestSha=text(second.in_progress_manifest_sha256);manifest=validateAnalysisManifest({...manifest,artifacts:[...manifest.artifacts,second.descriptor]});
      if(canonicalDesktopJson(primaryResult)!==canonicalDesktopJson(independentResult))failure('VALIDATION_MISMATCH');
      const artifact_id=randomUUID(),report_id=randomUUID(),finding_id=randomUUID(),judgment=membershipJudgment(primaryResult),limitations=['association_not_causation','no_significance_test','confirmed_local_snapshot_only'];
      const evidence_refs=[`${run_id}:duckdb-result`,`${run_id}:python-result`], supporting_evidence=[`comparison_repurchase_rate=${analysisRatio(primaryResult.periods.comparison.repurchase_rate)}`,`current_repurchase_rate=${analysisRatio(primaryResult.periods.current.repurchase_rate)}`];
      const refutation=judgment==='Confirmed'?'association_does_not_establish_cause':judgment==='Rejected'?'current_rate_is_not_lower':'active_member_denominator_is_zero';
      const source={schema_version:plan?'2.0':'1.0',...(plan?{plan_sha256:membershipHash(plan)}:{}),run_id,finding_id,...manifest.product_context,method:manifest.method};
      const ratio=analysisRatio;
      const periods=primaryResult.periods;
      const provenance=`${plan?'Plan: '+plan.id+'\nPlan SHA-256: '+membershipHash(plan)+'\n':''}Run: ${run_id}\nProject: ${owner.project_id}\nSession: ${owner.session_id}\nCase: ${owner.case_id}\nRevision: ${owner.revision_id}\nConfirmation: ${manifest.product_context.confirmation_id}\nSnapshot: ${manifest.product_context.snapshot_id}\nMethod: ${run.method_id} / ${run.method_version}\nCode SHA-256: ${run.code_identity}\n${manifest.sources.map(s=>`${s.role} SHA-256: ${s.sha256}`).join('\n')}`;
      const readable=`# 会员复购分析 · 证据草稿\n\nH1：当前期复购率低于对比期\n判断：${judgment}\n未接受 · 未闭环 · 未导出\n\n## 两期指标\n\n| 指标 | 对比期 | 当前期 |\n|---|---:|---:|\n| 活跃成员（复购率分母） | ${periods.comparison.active_member_count} | ${periods.current.active_member_count} |\n| 复购成员 | ${periods.comparison.repeat_member_count} | ${periods.current.repeat_member_count} |\n| 复购率（精确分数） | ${ratio(periods.comparison.repurchase_rate)} | ${ratio(periods.current.repurchase_rate)} |\n| 复购收入（分） | ${periods.comparison.repeat_revenue_fen} | ${periods.current.repeat_revenue_fen} |\n\n支持与反证：两期有效订单按成员和时间排序，复购收入只计期内第二笔及以后的有效订单。${judgment==='Confirmed'?'当前期复购率较低，支持此关联假设。':judgment==='Rejected'?'当前期复购率不低于对比期，不支持此假设。':'至少一期活跃成员分母为零，不能作可比较判断。'}\n\n限制：关联不等于因果；不进行显著性检验；仅限已确认的本地快照。\n\n## 精确指标与变化\n\n\`\`\`json\n${canonicalDesktopJson(primaryResult)}\n\`\`\`\n\n## 来源与方法\n\n\`\`\`text\n${provenance}\n\`\`\`\n`;
      const projectedEvidence=[{id:'duckdb-result',title:'DuckDB 主计算',value:duck},{id:'python-result',title:'Python 独立复算',value:verifier}];
      const links=projectedEvidence.map(x=>`[${x.title}](#evidence-${run_id}-${x.id})`).join(' · ');
      const sections=projectedEvidence.map(x=>`## evidence-${run_id}-${x.id}\n\n${x.title}\n\n\`\`\`json\n${canonicalDesktopJson(x.value)}\n\`\`\`\n`).join('\n');
      const markdown=`${readable}\n## 证据回链\n\n${links}\n\n${sections}`;
      const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
      const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>会员复购分析 · 证据草稿</title><body><main><pre>${escape(readable)}</pre><nav aria-label="证据回链">${projectedEvidence.map(x=>`<a href="#evidence-${run_id}-${x.id}">${x.title}</a>`).join(' · ')}</nav>${projectedEvidence.map(x=>`<section id="evidence-${run_id}-${x.id}"><h2>${x.title}</h2><pre>${escape(canonicalDesktopJson(x.value))}</pre></section>`).join('')}</main></body></html>`;
      check();const current=await store.readProjection(owner);
      const publications=await store.publishAnalysisSuccessCandidates({...owner,expected_row_version:current.revision!.row_version,run_id,operation_id:randomUUID(),aggregate:{artifact_id,bytes:encode({schema_version:plan?'2.0':'1.0',...(plan?{plan_sha256:membershipHash(plan)}:{}),artifact_id,run_id,product_context:manifest.product_context,method:manifest.method,result:primaryResult}),method_id:run.method_id,method_version:run.method_version,code_identity:run.code_identity,columns:['period','active_member_count','repeat_member_count','repeat_revenue_fen','repurchase_rate'],measurement_meanings:{repeat_revenue_fen:'sum_of_second_and_later_valid_orders_in_period',repurchase_rate:'repeat_member_count/active_member_count'},group_pseudonym_map},report:{report_id,markdown_bytes:new TextEncoder().encode(markdown),html_bytes:new TextEncoder().encode(html),source,evidence_refs}});
      const a=publications.aggregatePublication,r=publications.reportPublication;
      const evidence={schema_version:plan?'4.0':'3.0',...(plan?{plan_sha256:membershipHash(plan)}:{}),run_id,product_context:manifest.product_context,method:manifest.method,sources:manifest.sources.map(({role,sha256})=>({role,sha256})),calculations:manifest.artifacts.slice(2),equality:{status:'matched',result_sha256:hash(canonicalDesktopJson(primaryResult))},judgment,m2_applicability:primaryResult.m2.status,candidate_publications:{aggregate:{artifact_id:a.artifact_id,locator:a.locator,sha256:a.sha256,byte_length:a.byte_length},report:{report_id:r.report_id,markdown:r.markdown,html:r.html}},limitations};
      const evidence_bytes=encode(evidence),summary_bytes=new TextEncoder().encode(markdown),evidence_document_bytes=new TextEncoder().encode(markdown),completed_at=timestamp();check();
      const terminal_manifest=validateAnalysisManifest({...manifest,status:'succeeded',ended_at:completed_at,artifacts:[...manifest.artifacts,{artifact_id:'run-summary',kind:'summary',...descriptor('summary.md',bytes(summary_bytes))},{artifact_id:'run-evidence',kind:'evidence_document',...descriptor('evidence.md',bytes(evidence_document_bytes))}],evidence:descriptor('evidence.json',bytes(evidence_bytes))});
      const bundle=await runStore!.succeedRun({run_id,expected_in_progress_manifest_sha256:manifestSha,terminal_manifest,evidence_bytes,summary_bytes,evidence_document_bytes,cancellation_signal:signal});
      // The Run terminal is irreversible; a later SQLite failure must not rewrite it.
      manifest=terminal_manifest;manifestSha=text(bundle.manifest_sha256);check();
      await settle({status:'succeeded',runBundle:bundle as unknown as DesktopTerminalRunBundle,aggregatePublication:a,reportPublication:r,finding:{finding_id,judgment,metrics:primaryResult,supporting_evidence,refutation,limitations,evidence_refs}},completed_at);
    }catch(error){
      const code=String((error as {code?:string}).code??'CALCULATION_FAILED');if(code==='RESULT_PENDING'){resultPending=true;throw error;}
      const mapping:Record<string,string>={SOURCE_CHANGED:'source_changed',TOOLCHAIN_UNAVAILABLE:'toolchain_unavailable',CALCULATION_FAILED:'calculation_failed',VALIDATION_MISMATCH:'validation_mismatch',RUN_ARTIFACT_FAILED:'run_artifact_failed',PUBLICATION_FAILED:'publication_failed',DEADLINE_EXCEEDED:'deadline_exceeded',INTEGRITY_BLOCKED:'integrity_blocked',CANCELLED:'user_cancelled'};
      const reason=control.reason??mapping[code]??'calculation_failed',completed_at=timestamp(),cancelled=reason==='user_cancelled';
      if(reason!=='deadline_exceeded'&&Date.parse(completed_at)<deadline&&manifest?.status==='in_progress'&&manifestSha){try{const terminal_manifest=validateAnalysisManifest({...manifest,status:cancelled?'cancelled':'failed',ended_at:completed_at,terminal_detail:{reason}});await runStore![cancelled?'cancelRun':'failRun']({run_id,expected_in_progress_manifest_sha256:manifestSha,terminal_manifest,cancellation_signal:new AbortController().signal});}catch{/* Preserve the incomplete file authority, never fabricate a terminal bundle. */}}
      const current=await store.readProjection(owner);
      if(current.runs.find(x=>x.run_id===run_id)?.status==='Running')await settle(cancelled?{status:'cancelled',reason:'user_cancelled'}:{status:'failed',reason},completed_at);
    }finally{scheduled.cancel();}
  }

  async function cancelAnalysis(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('cancelAnalysis',input);
    const current=await readProjection({project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id});
    if(current.session?.current_revision_id!==command.revision_id)failure('STALE_REVISION');
    try{
      const result=await store.requestAnalysisCancellation({command,completed_at:timestamp(),input_fingerprint:fingerprint('cancel_analysis',command)});
      const control=activeRuns.get(command.run_id);if(control){control.reason='user_cancelled';control.abort.abort();}
      return result;
    }catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function reconcileInterrupted(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const request=exactRecord(input,['command_id','project_id','session_id','case_id','revision_id','target_kind','target_id']);
    if(request.target_kind!=='analysis_run'&&request.target_kind!=='assistance_attempt')failure('FORBIDDEN');
    if((request.target_kind==='analysis_run'?activeRuns:activeAttempts).has(text(request.target_id)))failure('BUSY');
    const owner={project_id:text(request.project_id),session_id:text(request.session_id),case_id:text(request.case_id),revision_id:text(request.revision_id)};
    if(openedProjectId!==owner.project_id)failure('NOT_FOUND');
    const current=await store.readProjection(owner);if(current.session?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');
    try{return await store.reconcileInterrupted({...owner,command_id:text(request.command_id),target_kind:request.target_kind,target_id:text(request.target_id),completed_at:timestamp(),input_fingerprint:fingerprint('reconcile_interrupted',request)});}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function openProject(input: unknown): Promise<DesktopProjectOpen> {
    if(activeRuns.size||activeAttempts.size)failure('BUSY');
    const command = exactRecord(input, ['contract_version', 'command_id', 'proposed_project_id', 'display_name']) as OpenProjectRequest;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    if (command.contract_version !== '1.0' || typeof command.command_id !== 'string' || !uuid.test(command.command_id) || typeof command.proposed_project_id !== 'string' || !uuid.test(command.proposed_project_id) || typeof command.display_name !== 'string' || !command.display_name.trim()) failure('VALIDATION_FAILED');
    const displayName = command.display_name.trim();
    const now = clock();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) failure('VALIDATION_FAILED');
    const initializedAt = now.toISOString();
    const fingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'initialize_project', request: { contract_version: '1.0', display_name: displayName } })).digest('hex');
    const opened = asProjectOpen(await store.openProject({ ...command, display_name: displayName, initialized_at: initializedAt, input_fingerprint: fingerprint }));
    const sessions=await store.listSessions({ project_id: opened.project_id });
    openedProjectId = opened.project_id;
    resultPending = false;
    inspections.clear();
    for(const session of sessions){
      const owner={project_id:opened.project_id,session_id:session.session_id,case_id:session.case_id,revision_id:session.current_revision_id},projection=await store.readProjection(owner);
      for(const run of projection.runs.filter(r=>r.status==='Running'))await reconcileInterrupted({command_id:randomUUID(),...owner,target_kind:'analysis_run',target_id:run.run_id});
      for(const attempt of projection.attempts.filter(a=>a.status==='Running'))await reconcileInterrupted({command_id:randomUUID(),...owner,target_kind:'assistance_attempt',target_id:attempt.attempt_id});
    }
    return opened;
  }

  async function listSessions(input: unknown): Promise<readonly SessionSummary[]> {
    const request = exactRecord(input, ['project_id']);
    const projectId = text(request.project_id);
    if (openedProjectId === undefined || projectId !== openedProjectId) failure('NOT_FOUND');
    const sessions = await store.listSessions({ project_id: projectId });
    for (const session of sessions) await checkedProjection({ project_id: projectId, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id });
    return Object.freeze(sessions.map(sessionSummary));
  }

  async function checkedProjection(owner: OwnerRef): Promise<DesktopProjection> {
    const projection = await store.readProjection(owner);
    if (projection.revision?.integrity_state === 'integrity_blocked' && projection.session?.current_revision_id === owner.revision_id) {
      if (resultPending) failure('RESULT_PENDING');
      const request = { ...owner, expected_row_version: projection.revision.row_version, reason_code: 'INTEGRITY_BLOCKED' };
      const now = clock(); if (!(now instanceof Date) || !Number.isFinite(now.getTime())) failure('VALIDATION_FAILED');
      const input_fingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'mark_integrity_blocked', request })).digest('hex');
      try { await store.markIntegrityBlocked({ command_id: randomUUID(), ...request, completed_at: now.toISOString(), input_fingerprint }); }
      catch (error) { if ((error as { code?: string }).code === 'RESULT_PENDING') resultPending = true; throw error; }
      return store.readProjection(owner);
    }
    return projection;
  }

  async function readProjection(input: unknown) {
    const owner = exactRecord(input, ['project_id', 'session_id', 'case_id', 'revision_id']) as OwnerRef;
    if (openedProjectId === undefined || owner.project_id !== openedProjectId) failure('NOT_FOUND');
    const sessions = await store.listSessions({ project_id: owner.project_id });
    const current = sessions.find((session) => session.session_id === owner.session_id);
    if (current === undefined) failure('NOT_FOUND');
    if (current.case_id !== owner.case_id) failure('STALE_REVISION');
    try { return await checkedProjection(owner); } catch (error) { if ((error as { code?: string }).code === 'NOT_FOUND') failure('STALE_REVISION'); throw error; }
  }

  async function createSession(input: unknown) {
    if (resultPending) failure('RESULT_PENDING');
    const valid = validateXanthilDesktopRequest('createSession', input);
    if (openedProjectId === undefined || valid.project_id !== openedProjectId) failure('NOT_FOUND');
    if (!valid.display_name.trim() || !valid.case_name.trim()) failure('VALIDATION_FAILED');
    const command = { contract_version: valid.contract_version, command_id: valid.command_id, project_id: valid.project_id,
      display_name: valid.display_name.trim(), case_name: valid.case_name.trim(), fields: { question_text: valid.fields.question_text,
        hypothesis_display_title: valid.fields.hypothesis_display_title, business_context: valid.fields.business_context,
        alternative_explanations: [...valid.fields.alternative_explanations] } };
    const { command_id: omitted, ...request } = command;
    void omitted;
    const input_fingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'create_session', request })).digest('hex');
    const now = clock();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) failure('VALIDATION_FAILED');
    try {
      return await store.createSession({ command, ids: { session_id: randomUUID(), case_id: randomUUID(), revision_id: randomUUID(), operation_id: randomUUID() }, created_at: now.toISOString(), input_fingerprint });
    } catch (error) {
      if ((error as { code?: string }).code === 'RESULT_PENDING') resultPending = true;
      throw error;
    }
  }

  async function createDraftRevision(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('createDraftRevision',input);
    if(openedProjectId!==command.project_id)failure('NOT_FOUND');
    try{const next=await store.createDraftRevision({command,ids:{revision_id:randomUUID()},created_at:timestamp(),input_fingerprint:fingerprint('create_draft_revision',command)});inspections.delete(JSON.stringify({project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id}));return next;}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function openSession(input: unknown) {
    const request = validateXanthilDesktopRequest('openSession', input);
    const sessions = await listSessions({ project_id: request.project_id });
    const session = sessions.find(item => item.session_id === request.session_id);
    if (!session) failure('NOT_FOUND');
    return readProjection({ project_id: request.project_id, session_id: session.session_id, case_id: session.case_id, revision_id: session.current_revision_id });
  }

  async function checkReportExport(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('exportReport',input);if(command.project_id!==openedProjectId)failure('FORBIDDEN');return store.checkReportExport(command);
  }
  async function prepareReportExport(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command_id','project_id','session_id','case_id','revision_id','report_id','format']);if(value.project_id!==openedProjectId)failure('FORBIDDEN');
    if(value.format!=='markdown'&&value.format!=='html')failure('VALIDATION_FAILED');
    return store.readReportExport({command_id:text(value.command_id),project_id:text(value.project_id),session_id:text(value.session_id),case_id:text(value.case_id),revision_id:text(value.revision_id),report_id:text(value.report_id),format:value.format});
  }
  async function recordReportExport(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command','prepared','descriptor']),command=validateXanthilDesktopRequest('exportReport',value.command);if(command.project_id!==openedProjectId)failure('FORBIDDEN');
    const descriptor=exactRecord(value.descriptor,['display_name','media_type','sha256','byte_length']);if(descriptor.media_type!=='text/markdown;charset=utf-8'&&descriptor.media_type!=='text/html;charset=utf-8')failure('VALIDATION_FAILED');
    const normalized={display_name:text(descriptor.display_name),media_type:descriptor.media_type as 'text/markdown;charset=utf-8'|'text/html;charset=utf-8',sha256:text(descriptor.sha256),byte_length:text(descriptor.byte_length)};
    const prepared=value.prepared as Awaited<ReturnType<DesktopDecisionCaseStore['readReportExport']>>;
    try{return await store.recordReportExport({command,prepared,descriptor:normalized,completed_at:timestamp(),input_fingerprint:fingerprint('export_report',command,{descriptor:normalized})});}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function completeCase(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('completeCase',input),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    const projection=await readProjection(owner);if(projection.session?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    const acceptance=projection.acceptances.find(a=>a.acceptance_id===command.acceptance_id),form=projection.forms.find(f=>f.form_id===command.form_id);if(!acceptance||!form)failure('NOT_FOUND');
    if(form.disposition!=='saved')failure('FORBIDDEN');
    const material=await store.readReportContext({...owner,finding_id:acceptance.finding_id}),ids={closure_id:randomUUID(),report_id:randomUUID(),operation_id:randomUUID()},completed_at=timestamp();
    const report=desktopFinalReport(projection,command.acceptance_id,command.form_id,ids.closure_id,completed_at,material);
    try{return await store.completeCase({command,ids,report,completed_at,input_fingerprint:fingerprint('complete_case',command)});}catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function acceptFinding(input:unknown) {
    if(resultPending)failure('RESULT_PENDING');
    const command=validateXanthilDesktopRequest('acceptFinding',input),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    const projection=await readProjection(owner);
    if(projection.session?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');
    if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    try{return await store.acceptFinding({command,acceptance_id:randomUUID(),accepted_at:timestamp(),input_fingerprint:fingerprint('accept_finding',command)});}
    catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
  }

  async function saveForm(input: unknown) {
    if (resultPending) failure('RESULT_PENDING');
    const valid = validateXanthilDesktopRequest('saveForm', input);
    if(valid.form.kind==='decision_closure')validateDesktopDecisionForm(valid.form);
    const owner = { project_id: valid.project_id, session_id: valid.session_id, case_id: valid.case_id, revision_id: valid.revision_id };
    const current = await readProjection(owner);
    if (current.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (current.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if(valid.form.kind!=='case_fields'){
      try{return await store.saveForm({command:valid,completed_at:timestamp(),input_fingerprint:fingerprint('save_form',valid),...(valid.form.kind==='decision_closure'?{form_id:randomUUID()}:{})});}
      catch(error){if((error as{code?:string}).code==='RESULT_PENDING')resultPending=true;throw error;}
    }
    const request = { contract_version: valid.contract_version, ...owner, expected_row_version: valid.expected_row_version,
      form: { kind: 'case_fields' as const, fields: { question_text: valid.form.fields.question_text, hypothesis_display_title: valid.form.fields.hypothesis_display_title,
        business_context: valid.form.fields.business_context, alternative_explanations: [...valid.form.fields.alternative_explanations] } } };
    const now = clock(); if (!(now instanceof Date) || !Number.isFinite(now.getTime())) failure('VALIDATION_FAILED');
    const input_fingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'save_form', request })).digest('hex');
    try { return await store.saveForm({ command: { command_id: valid.command_id, ...request }, completed_at: now.toISOString(), input_fingerprint }); }
    catch (error) { const code = (error as { code?: string }).code; if (code === 'RESULT_PENDING') resultPending = true; if (code === 'ROW_VERSION_CONFLICT' || code === 'NOT_FOUND') failure('STALE_REVISION'); throw error; }
  }

  async function waitForProjection(input: unknown) {
    const value = exactRecord(input, ['project_id', 'session_id', 'case_id', 'revision_id', 'projection_token']);
    const owner = { project_id: text(value.project_id), session_id: text(value.session_id), case_id: text(value.case_id), revision_id: text(value.revision_id) };
    await readProjection(owner);
    try { return await store.waitForProjection({ ...owner, projection_token: text(value.projection_token) }); }
    catch (error) { if ((error as { code?: string }).code === 'NOT_FOUND') failure('STALE_REVISION'); throw error; }
  }

  // Main invokes this before native selection/read effects and again after the
  // asynchronous chooser. It is private Application admission, not another IPC.
  async function checkImportAdmission(input: unknown, kind: 'inspect' | 'confirm'): Promise<DesktopProjection | null> {
    if (resultPending) failure('RESULT_PENDING');
    const valid = kind === 'inspect' ? validateXanthilDesktopRequest('selectImportFiles', input) : validateXanthilDesktopRequest('confirmRevision', input);
    const owner = { project_id: valid.project_id, session_id: valid.session_id, case_id: valid.case_id, revision_id: valid.revision_id };
    const current = await readProjection(owner);
    if (current.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (current.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if (kind === 'confirm' && current.revision.state === 'Ready') {
      if (!current.confirmation) failure('INTEGRITY_BLOCKED');
      const snapshot = await store.readConfirmedSnapshot({ ...owner, confirmation_id: current.confirmation.confirmation_id });
      // Immutable local bytes reproduce the existing fingerprint. Only Store's
      // committed receipt permits replay; fresh/conflicting commands still fail.
      return publishConfirmed(validateXanthilDesktopRequest('confirmRevision', input), {
        members: { display_name: snapshot.snapshot.members.display_name, bytes: snapshot.snapshot.members.bytes },
        orders: { display_name: snapshot.snapshot.orders.display_name, bytes: snapshot.snapshot.orders.bytes },
      });
    }
    if (current.revision.row_version !== valid.expected_row_version) failure('STALE_REVISION');
    if (current.revision.state !== 'Draft') failure('FORBIDDEN');
    if ('inspection_token' in valid) {
      const previous = inspections.get(JSON.stringify(owner));
      if (!previous || previous.inspection.inspection_token !== valid.inspection_token) failure('SOURCE_CHANGED');
      if (previous.guard !== JSON.stringify({ ...owner, expected_row_version: valid.expected_row_version })) failure('STALE_REVISION');
      if (kind === 'confirm') {
        if (![current.revision.question_text, current.revision.hypothesis_display_title].every(value => /[^\p{White_Space}]/u.test(value))) failure('VALIDATION_FAILED');
        if (previous.inspection.evaluation.status !== 'evaluated') failure('ISSUE_CONFIRMATION_REQUIRED');
        const choice = validateXanthilDesktopRequest('confirmRevision', input).confirmation;
        const configuration = { column_mapping: choice.column_mapping, comparison_period: choice.comparison_period, current_period: choice.current_period, currency: choice.currency, time_zone: choice.time_zone, valid_statuses: choice.valid_statuses, selected_group_mode: choice.selected_group_mode };
        if (canonicalDesktopJson(configuration) !== canonicalDesktopJson(previous.inspection.evaluation.configuration)) failure('SOURCE_CHANGED');
        const treatments = previous.inspection.reviewable_issues.map(issue => ({ code: issue.code, count: issue.count, treatment: issue.treatment_options[0] }));
        if (canonicalDesktopJson(choice.issue_treatments) !== canonicalDesktopJson(treatments)) failure('ISSUE_CONFIRMATION_REQUIRED');
      }
    }
    return null;
  }

  async function inspectImportFiles(input: unknown): Promise<ImportInspection> {
    if (resultPending) failure('RESULT_PENDING');
    if (!record(input)) failure('VALIDATION_FAILED');
    const { source_files, ...publicInput } = input;
    const valid = validateXanthilDesktopRequest('selectImportFiles', publicInput);
    const owner = { project_id: valid.project_id, session_id: valid.session_id, case_id: valid.case_id, revision_id: valid.revision_id };
    const projection = await readProjection(owner);
    if (projection.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (projection.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if (projection.revision.state !== 'Draft') failure('FORBIDDEN');
    if (projection.revision.row_version !== valid.expected_row_version) failure('STALE_REVISION');
    const pair = exactRecord(source_files, ['members', 'orders']);
    const source = (value: unknown) => {
      const file = exactRecord(value, ['display_name', 'bytes']);
      if (typeof file.display_name !== 'string' || file.display_name.length === 0 || /[/\\\u0000-\u001f]/.test(file.display_name) || file.display_name === '.' || file.display_name === '..' || !(file.bytes instanceof Uint8Array)) failure('VALIDATION_FAILED');
      const bytes = new Uint8Array(file.bytes);
      return { display_name: file.display_name, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
    };
    const members = source(pair.members), orders = source(pair.orders);
    const sourceIdentity = JSON.stringify([members.display_name, members.sha256, orders.display_name, orders.sha256]);
    const key = JSON.stringify(owner), guard = JSON.stringify({ ...owner, expected_row_version: valid.expected_row_version });
    if ('inspection_token' in valid) {
      const previous = inspections.get(key);
      if (!previous || previous.inspection.inspection_token !== valid.inspection_token || previous.guard !== guard || previous.source_identity !== sourceIdentity) failure('SOURCE_CHANGED');
    }
    // Once a new attempt is accepted, earlier displayed consents cannot become current again.
    inspections.delete(key);
    const parsedMembers = parseDesktopCsv(members.bytes), parsedOrders = parseDesktopCsv(orders.bytes);
    const prepared = 'configuration' in valid ? prepareDesktopData({ members_bytes: members.bytes, orders_bytes: orders.bytes }, valid.configuration) : undefined;
    const metadata = (file: typeof members, parsed: typeof parsedMembers) => Object.freeze({ display_name: file.display_name, sha256: file.sha256, byte_length: String(file.bytes.length), row_count: String(parsed.rows.length), column_names: parsed.headers });
    const inspection: ImportInspection = Object.freeze({
      inspection_token: randomUUID(),
      evaluation: 'configuration' in valid ? Object.freeze({ status: 'evaluated', configuration: valid.configuration }) : Object.freeze({ status: 'unconfigured' }),
      members: metadata(members, parsedMembers), orders: metadata(orders, parsedOrders),
      column_mapping: Object.freeze({ member_id_column: parsedMembers.headers, member_group_column: parsedMembers.headers, order_id_column: parsedOrders.headers, order_member_id_column: parsedOrders.headers, paid_at_column: parsedOrders.headers, amount_column: parsedOrders.headers, status_column: parsedOrders.headers, currency_column: parsedOrders.headers }),
      blocking_issues: Object.freeze([]), reviewable_issues: prepared?.reviewable_issues ?? Object.freeze([]),
      period_controls: Object.freeze({ minimum_date: prepared?.local_dates[0] ?? null, maximum_date: prepared?.local_dates.at(-1) ?? null, allowed_time_zone: 'Asia/Shanghai', equal_duration_required: true }),
      status_controls: Object.freeze({ observed_statuses: prepared?.observed_statuses ?? Object.freeze([]), selected_valid_statuses: 'configuration' in valid ? valid.configuration.valid_statuses : Object.freeze([]) }),
    });
    inspections.set(key, Object.freeze({ guard, source_identity: sourceIdentity, inspection }));
    return inspection;
  }

  async function confirmRevision(input: unknown): Promise<DesktopProjection> {
    if (resultPending) failure('RESULT_PENDING');
    if (!record(input)) failure('VALIDATION_FAILED');
    if (record(input.confirmation)) {
      if (input.confirmation.authority_confirmed !== true) failure('AUTHORITY_REQUIRED');
      if (input.confirmation.issues_confirmed !== true || input.confirmation.plan_confirmed !== true) failure('ISSUE_CONFIRMATION_REQUIRED');
    }
    const { source_files, ...publicInput } = input;
    const valid = validateXanthilDesktopRequest('confirmRevision', publicInput);
    const owner = { project_id: valid.project_id, session_id: valid.session_id, case_id: valid.case_id, revision_id: valid.revision_id };
    const current = await readProjection(owner);
    if (current.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (current.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if (current.revision.state === 'Ready') {
      // Only the Store's exact committed receipt can authorize this replay;
      // a fresh command cannot publish into an already-confirmed revision.
      const pair = exactRecord(source_files, ['members','orders']);
      const file = (input: unknown) => { const value = exactRecord(input, ['display_name','bytes']); if (typeof value.display_name !== 'string' || !(value.bytes instanceof Uint8Array)) failure('VALIDATION_FAILED'); return { display_name: value.display_name, bytes: new Uint8Array(value.bytes) }; };
      return publishConfirmed(valid, { members: file(pair.members), orders: file(pair.orders) });
    }
    if (current.revision.row_version !== valid.expected_row_version) failure('STALE_REVISION');
    if (current.revision.state !== 'Draft') failure('FORBIDDEN');
    if (![current.revision.question_text, current.revision.hypothesis_display_title].every(value => /[^\p{White_Space}]/u.test(value))) failure('VALIDATION_FAILED');
    const previous = inspections.get(JSON.stringify(owner));
    if (!previous || previous.inspection.inspection_token !== valid.inspection_token) failure('SOURCE_CHANGED');
    if (previous.guard !== JSON.stringify({ ...owner, expected_row_version: valid.expected_row_version })) failure('STALE_REVISION');
    if (previous.inspection.evaluation.status !== 'evaluated') failure('ISSUE_CONFIRMATION_REQUIRED');
    const choice = valid.confirmation;
    const configuration = { column_mapping: choice.column_mapping, comparison_period: choice.comparison_period, current_period: choice.current_period, currency: choice.currency, time_zone: choice.time_zone, valid_statuses: choice.valid_statuses, selected_group_mode: choice.selected_group_mode };
    if (canonicalDesktopJson(configuration) !== canonicalDesktopJson(previous.inspection.evaluation.configuration)) failure('SOURCE_CHANGED');
    const expectedTreatments = previous.inspection.reviewable_issues.map(issue => ({ code: issue.code, count: issue.count, treatment: issue.treatment_options[0] }));
    if (canonicalDesktopJson(choice.issue_treatments) !== canonicalDesktopJson(expectedTreatments)) failure('ISSUE_CONFIRMATION_REQUIRED');
    const pair = exactRecord(source_files, ['members', 'orders']);
    const copy = (value: unknown, expected: ImportInspection['members']) => {
      const file = exactRecord(value, ['display_name', 'bytes']);
      if (!(file.bytes instanceof Uint8Array) || file.display_name !== expected.display_name || String(file.bytes.length) !== expected.byte_length || createHash('sha256').update(file.bytes).digest('hex') !== expected.sha256) failure('SOURCE_CHANGED');
      return { display_name: expected.display_name, bytes: new Uint8Array(file.bytes) };
    };
    const sources = { members: copy(pair.members, previous.inspection.members), orders: copy(pair.orders, previous.inspection.orders) };
    return publishConfirmed(valid, sources);
  }

  async function publishConfirmed(valid: ConfirmRevisionRequest, sources: DesktopSourcePair): Promise<DesktopProjection> {
    const owner = { project_id: valid.project_id, session_id: valid.session_id, case_id: valid.case_id, revision_id: valid.revision_id }, choice = valid.confirmation;
    const prepared = prepareDesktopData({ members_bytes: sources.members.bytes, orders_bytes: sources.orders.bytes }, choice);
    const ids = { snapshot_id: randomUUID(), confirmation_id: randomUUID(), operation_id: randomUUID() };
    const documents = desktopConfirmationDocuments({ ...owner, snapshot_id: ids.snapshot_id, confirmation_id: ids.confirmation_id }, choice);
    const now = clock(); if (!(now instanceof Date) || !Number.isFinite(now.getTime())) failure('VALIDATION_FAILED');
    const { command_id, inspection_token, ...request } = valid; void command_id; void inspection_token;
    const input_fingerprint = createHash('sha256').update(canonicalDesktopJson({ operation_kind: 'confirm_revision', request, sources: { members: createHash('sha256').update(sources.members.bytes).digest('hex'), orders: createHash('sha256').update(sources.orders.bytes).digest('hex') } })).digest('hex');
    try {
      const result = await store.publishConfirmation({ command: valid, ids, source_files: sources, ...documents, counts: prepared.counts, treatment_basis: choice.issue_treatments, completed_at: now.toISOString(), input_fingerprint });
      inspections.delete(JSON.stringify(owner));
      return result;
    } catch (error) { if ((error as { code?: string }).code === 'RESULT_PENDING') resultPending = true; throw error; }
  }

  return Object.freeze({ hasModelWork:()=>modelWork.size>0, closeModelWork, openProject, listSessions, readProjection, createSession, createDraftRevision, openSession, acceptFinding, completeCase, checkReportExport, prepareReportExport, recordReportExport, saveForm, waitForProjection, checkImportAdmission, inspectImportFiles, confirmRevision, startAnalysis, cancelAnalysis, reconcileInterrupted, prepareAssistanceDisclosure, decideAssistanceDisclosure, startAssistance, cancelAssistance, disposeAssistanceDraft });
}
