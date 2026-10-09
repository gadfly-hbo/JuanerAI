import {preparedConfirmationContext,validateMemberConfirmation,memberConfirmationDocuments} from '../../packages/product-core/member-preparation.ts';
import {browserProjectRoot,guardBrowserProjectDatabase,type BrowserProjectLease} from './browser-project-origin.ts';
import {prepareMembershipSidecar,assertMembershipSidecar,migrateMembershipSidecar} from './case-assistant.ts';
import {validateReviewDecision} from '../../packages/product-core/member-review.ts';
import type {FormalDecision,AssistantReport} from '../../packages/contracts/case-assistant.ts';
import {formalDecisionSections} from '../../packages/product-core/case-assistant.ts';
import type {MembershipReview,ReviewReceipt,ReviewSubmission} from '../../packages/product-core/member-review.ts';
import {decoded} from './member-task-codec.ts';
import {expressionReport,encodeTask,taskHash,type TaskComment} from '../../packages/product-core/member-task.ts';
import type {TaskGrant,TaskUsage,TaskAttempt} from '../../packages/product-core/member-task.ts';
import {validateTaskRows} from './member-task-codec.ts';
import {membershipSchema} from './member-analysis-schema.ts';
import {memberModelSchema,assertMemberModels} from './member-model.ts';
import {memberOperationSchema} from './member-operation-schema.ts';
import {assertMemberOperations,reserveMemberOperation,issueMemberOperation,settleMemberOperation,fenceMemberOperations} from './member-operation.ts';
import {memberSourceSchema,assertMemberSourceSets,resolveMemberPlanPreparation} from './member-source-store.ts';
import {analysisPlanIdentity,analysisArtifactVersion,analysisManifestVersion,validatePlanStart,validateMembershipPlan,validateAnalysisManifest,validateAnalysisEvidence,validateAnalysisOutput,analysisResult,analysisRatio,analysisJudgment,analysisRefutation,membershipFindingFacts,membershipJudgment,membershipHash,planOf,type MembershipPlan,type AnalysisRunManifest} from '../../packages/product-core/member-analysis.ts';
import { closeSync, constants, existsSync, fsyncSync, fstatSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { desktopAssistancePayload, validateDesktopAssistanceDraft } from '../../packages/product-core/xanthil-desktop-decision-case.ts';
import { dirname, join, resolve, isAbsolute } from 'node:path';

import { validateXanthilDesktopRequest, type CreateSessionRequest, type DesktopProjection, type SaveFormRequest, type SessionSummary } from '../../packages/contracts/xanthil-desktop-ipc.ts';
import type { DesktopAnalysisCandidates, DesktopAnalysisSettlement, DesktopConfirmedSnapshot, DesktopDecisionCaseStore, DesktopProjectOpen } from '../../packages/ports/xanthil-desktop-decision-case.ts';
import { canonicalDesktopJson, desktopConfirmationDocuments, desktopFinalReport, desktopReportExportProjection, desktopJudgment, prepareDesktopData, validateDesktopCalculationResult, validateDesktopDecisionForm, validateDesktopRunEvidence, validateDesktopRunManifest, type DesktopRunManifest, type DesktopFileDescriptor } from '../../packages/product-core/xanthil-desktop-decision-case.ts';

const APPLICATION_ID = 1480870705;
const USER_VERSION = 100;
const SCHEMA_VERSION = '1.0';
const SQLITE_HEADER = 'SQLite format 3\u0000';

/** Separate immutable Run3.0 file authority; no old Run1/2 adoption or scans. */
export function createLocalDesktopRunEvidenceStore(config: unknown) {return createDesktopRunEvidenceStore(config,false);}
function createDesktopRunEvidenceStore(config:unknown,pureReadback:boolean) {
  const projectRoot = projectRootFrom(config), root = join(projectRoot,'.xanthil','runs');
  // Only this live owner knows the exclusively published output prefix.
  // Reopening a Store never resumes an interrupted in-progress directory.
  const ownedProgress = new Map<string,AnalysisRunManifest>();
  const runId = (value: unknown): string => { if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) failure('VALIDATION_FAILED'); return value; };
  const signal = (value: unknown) => { if (!(value instanceof AbortSignal)) failure('VALIDATION_FAILED'); if (value.aborted) failure('CANCELLED'); };
  const absent = (path: string) => { try { lstatSync(path); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; } failure('RUN_ARTIFACT_FAILED'); };
  const directories = (base: string, relative: string, create = false) => {
    fileIdentity(base,true); let current = base;
    for (const part of relative.split('/').filter(Boolean)) { if (part === '.' || part === '..' || part.includes('\\')) failure('VALIDATION_FAILED'); current = join(current,part); try { fileIdentity(current,true); } catch(error) { if (!create || (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; mkdirSync(current,{mode:0o700}); syncDirectory(dirname(current)); } }
    return current;
  };
  const bytesAt = (base: string, path: string) => {
    if (path.startsWith('/') || path.split('/').some(x => !x || x === '.' || x === '..' || x.includes('\\'))) failure('VALIDATION_FAILED');
    const parts = path.split('/'); parts.pop(); directories(base,parts.join('/'));
    const target = join(base,path); fileIdentity(target); const fd = openSync(target,constants.O_RDONLY|constants.O_NOFOLLOW);
    try { return new Uint8Array(readFileSync(fd)); } finally { closeSync(fd); }
  };
  const verifyFile = (base: string, descriptor: DesktopFileDescriptor) => { const bytes = bytesAt(base,descriptor.path); if (digest(bytes) !== descriptor.sha256 || String(bytes.length) !== descriptor.byte_length) failure('INTEGRITY_BLOCKED'); return bytes; };
  const writeExclusive = (base: string, path: string, bytes: Uint8Array) => {
    const parent = dirname(path) === '.' ? base : directories(base,dirname(path),true), target = join(base,path);
    absent(target); const temporary = join(parent,`.${randomUUID()}.tmp`), fd = openSync(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
    try { writeFileSync(fd,bytes); fsyncSync(fd); } finally { closeSync(fd); }
    linkSync(temporary,target); unlinkSync(temporary); syncDirectory(parent);
    return {path,sha256:digest(bytes),byte_length:String(bytes.length)};
  };
  const manifest = (id: string) => {
    directories(projectRoot,'.xanthil/runs'); fileIdentity(join(root,id),true);
    const bytes = bytesAt(join(root,id),'run.json'), raw = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    let value: AnalysisRunManifest;
    try { value = validateAnalysisManifest(JSON.parse(raw)); if (canonicalDesktopJson(value) !== raw) failure('INTEGRITY_BLOCKED'); } catch { failure('INTEGRITY_BLOCKED'); }
    if (value.run_id !== id) failure('INTEGRITY_BLOCKED');
    return {value,bytes,sha256:digest(bytes),directory:join(root,id)};
  };
  const verifyReferenced = (value: AnalysisRunManifest, directory: string) => {
    for (const descriptor of Object.values(value.confirmation)) verifyFile(directory,descriptor);
    for (const descriptor of value.sources) verifyFile(projectRoot,descriptor);
    for (const descriptor of value.artifacts) verifyFile(directory,descriptor);
    if (value.evidence) verifyFile(directory,value.evidence);
  };
  const active = (id: string, expected: unknown) => {
    const current = manifest(id),progress=ownedProgress.get(id);
    if (!progress || current.value.status !== 'in_progress' || current.sha256 !== expected) failure('INTEGRITY_BLOCKED');
    const {artifacts:initialArtifacts,...initial}=current.value,{artifacts:progressArtifacts,...rest}=progress;
    if(initialArtifacts.length!==2||canonicalDesktopJson(initial)!==canonicalDesktopJson(rest)||canonicalDesktopJson(initialArtifacts)!==canonicalDesktopJson(progressArtifacts.slice(0,2)))failure('INTEGRITY_BLOCKED');
    verifyReferenced(progress,current.directory);return {...current,value:progress};
  };
  const replaceManifest = (current: ReturnType<typeof active>, value: AnalysisRunManifest) => {
    if(value.status==='in_progress')failure('INTEGRITY_BLOCKED');
    if (manifest(value.run_id).sha256 !== current.sha256) failure('INTEGRITY_BLOCKED');
    const bytes = new TextEncoder().encode(canonicalDesktopJson(value)), target = join(current.directory,'run.json'), temporary = join(current.directory,`.${randomUUID()}.manifest.tmp`);
    const fd = openSync(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
    try { writeFileSync(fd,bytes); fsyncSync(fd); } finally { closeSync(fd); }
    if (manifest(value.run_id).sha256 !== current.sha256) failure('INTEGRITY_BLOCKED');
    renameSync(temporary,target); syncDirectory(current.directory); ownedProgress.delete(value.run_id);return digest(bytes);
  };
  const bundle = (id: string) => {
    const current = manifest(id); if (current.value.status === 'in_progress') failure('INTEGRITY_BLOCKED'); verifyReferenced(current.value,current.directory);
    if(current.value.schema_version!=='3.0'){const check=pureReadback?openReadbackConnection(databasePath(projectRoot)):openConnection(databasePath(projectRoot),true);try{const persisted=planForRun(check,id),run=check.prepare('SELECT code_identity FROM analysis_runs WHERE run_id=?').get(id);if(membershipHash(persisted)!==membershipHash(current.value.execution_plan)||run?.code_identity!==current.value.method.code_identity)failure('INTEGRITY_BLOCKED');}finally{check.close();}}
    try {
      const results=current.value.artifacts.slice(2,4).map((descriptor,index)=>{
        const raw=new TextDecoder('utf-8',{fatal:true}).decode(verifyFile(current.directory,descriptor));
        const value=JSON.parse(raw);
        if(raw!==canonicalDesktopJson(value))failure('INTEGRITY_BLOCKED');
        return validateAnalysisOutput(value,current.value,index===0?2:3);
      });
      if(current.value.status==='succeeded'){
        if(results.length!==2||canonicalDesktopJson(results[0])!==canonicalDesktopJson(results[1]))failure('INTEGRITY_BLOCKED');
        const raw=new TextDecoder('utf-8',{fatal:true}).decode(verifyFile(current.directory,current.value.evidence!)),value=JSON.parse(raw);
        if(raw!==canonicalDesktopJson(value))failure('INTEGRITY_BLOCKED');
        const evidence=validateAnalysisEvidence(value,current.value,results[0]),publications=evidence.candidate_publications as UnknownRecord,aggregate=publications.aggregate as UnknownRecord,report=publications.report as UnknownRecord;
        for(const item of [aggregate,report.markdown,report.html] as UnknownRecord[])verifyFile(projectRoot,{path:text(item.locator),sha256:text(item.sha256),byte_length:text(item.byte_length)});
        const aggregateRaw=new TextDecoder('utf-8',{fatal:true}).decode(bytesAt(projectRoot,text(aggregate.locator)));
        if(aggregateRaw!==canonicalDesktopJson({schema_version:analysisArtifactVersion(planOf(current.value)),...analysisPlanIdentity(planOf(current.value)),artifact_id:aggregate.artifact_id,run_id:id,product_context:current.value.product_context,method:current.value.method,result:results[0]}))failure('INTEGRITY_BLOCKED');
      }
    }catch{failure('INTEGRITY_BLOCKED');}
    return Object.freeze({run_id:id,locator:`.xanthil/runs/${id}`,manifest:current.value,manifest_sha256:current.sha256,descriptors:[...Object.values(current.value.confirmation),...current.value.sources,...current.value.artifacts,...(current.value.evidence?[current.value.evidence]:[])]});
  };
  const guarded = async <T>(work: () => T | Promise<T>): Promise<T> => { try { return await work(); } catch(error) { const code = (error as {code?:string}).code; if (['RUN_CONTRACT_UNSUPPORTED','VALIDATION_FAILED','NOT_FOUND','INTEGRITY_BLOCKED','RUN_ARTIFACT_FAILED','CANCELLED'].includes(String(code))) throw error; failure('RUN_ARTIFACT_FAILED'); } };
  async function beginRun(input: unknown) { return guarded(async () => {
    const value = exactRecord(input,['run_id','initial_manifest','confirmation_files','code_assets','cancellation_signal']), id = runId(value.run_id); signal(value.cancellation_signal);
    const initial = validateAnalysisManifest(value.initial_manifest);
    if (initial.status !== 'in_progress' || initial.run_id !== id || initial.artifacts.length !== 2) failure('VALIDATION_FAILED');
    const confirmations = exactRecord(value.confirmation_files,['contract','binding','ir']), assets = exactRecord(value.code_assets,['primary_sql','python_verifier']);
    const readBytes = (input: unknown, descriptor: DesktopFileDescriptor) => { const file = exactRecord(input,['bytes','sha256','byte_length']); if (!(file.bytes instanceof Uint8Array) || digest(file.bytes) !== file.sha256 || String(file.bytes.length) !== file.byte_length || file.sha256 !== descriptor.sha256 || file.byte_length !== descriptor.byte_length) failure('VALIDATION_FAILED'); return new Uint8Array(file.bytes); };
    const contents = [...(['contract','binding','ir'] as const).map(key=>({path:initial.confirmation[key].path,bytes:readBytes(confirmations[key],initial.confirmation[key])})), ...(['primary_sql','python_verifier'] as const).map((key,index)=>({path:initial.artifacts[index].path,bytes:readBytes(assets[key],initial.artifacts[index])}))];
    const context = initial.product_context;
    const committed = await createLocalDesktopDecisionCaseStore({projectRoot}).readConfirmedSnapshot({project_id:context.project_id,session_id:context.session_id,case_id:context.case_id,revision_id:context.revision_id,confirmation_id:context.confirmation_id});
    if (committed.snapshot.snapshot_id !== context.snapshot_id) failure('INTEGRITY_BLOCKED');
    if(initial.schema_version!=='3.0'){validateMembershipPlan(initial.execution_plan,{members_bytes:committed.snapshot.members.bytes,orders_bytes:committed.snapshot.orders.bytes});const planDb=openConnection(databasePath(projectRoot),true);try{const persisted=planForRun(planDb,id);if(membershipHash(persisted)!==membershipHash(initial.execution_plan))failure('INTEGRITY_BLOCKED');}finally{planDb.close();}}
    for (const key of ['contract','binding','ir'] as const) if (committed.confirmation[`${key}_sha256`] !== initial.confirmation[key].sha256) failure('INTEGRITY_BLOCKED');
    for (const [index,key] of (['members','orders'] as const).entries()) if (committed.snapshot[key].sha256 !== initial.sources[index].sha256 || committed.snapshot[key].byte_length !== initial.sources[index].byte_length || committed.snapshot[key].display_name !== initial.sources[index].display_name) failure('INTEGRITY_BLOCKED');
    directories(projectRoot,'.xanthil/runs',true); absent(join(root,id));
    const stage = join(root,`.staging-${randomUUID()}`); mkdirSync(stage,{mode:0o700});
    for (const file of contents) { signal(value.cancellation_signal); writeExclusive(stage,file.path,file.bytes); }
    const bytes = new TextEncoder().encode(canonicalDesktopJson(initial)); writeExclusive(stage,'run.json',bytes); syncDirectory(stage); syncDirectory(root);
    signal(value.cancellation_signal); absent(join(root,id)); renameSync(stage,join(root,id)); syncDirectory(root);
    ownedProgress.set(id,initial);
    return {run_id:id,locator:`.xanthil/runs/${id}`,in_progress_manifest_sha256:digest(bytes)};
  }); }
  async function recordOutput(input: unknown, index: 2|3) { return guarded(() => {
    const value = exactRecord(input,['run_id','expected_in_progress_manifest_sha256','bytes','cancellation_signal']), id = runId(value.run_id); signal(value.cancellation_signal);
    const current = active(id,value.expected_in_progress_manifest_sha256); if (current.value.artifacts.length !== index || !(value.bytes instanceof Uint8Array)) failure('INTEGRITY_BLOCKED');
    const raw = new TextDecoder('utf-8',{fatal:true}).decode(value.bytes), output = JSON.parse(raw);
    if(canonicalDesktopJson(output)!==raw)failure('VALIDATION_FAILED');
    validateAnalysisOutput(output,current.value,index);
    const path = index===2?'outputs/duckdb.json':'outputs/python.json', descriptor = {artifact_id:index===2?'duckdb-result':'python-result',kind:index===2?'calculation_output':'verification_output',...writeExclusive(current.directory,path,value.bytes)};
    const updated = validateAnalysisManifest({...current.value,artifacts:[...current.value.artifacts,descriptor]});
    ownedProgress.set(id,updated);
    signal(value.cancellation_signal);
    return {descriptor,in_progress_manifest_sha256:current.sha256};
  }); }
  async function terminal(input: unknown, status: 'succeeded'|'failed'|'cancelled') { return guarded(() => {
    const value = exactRecord(input,['run_id','expected_in_progress_manifest_sha256','terminal_manifest','cancellation_signal',...(status==='succeeded'?['evidence_bytes','summary_bytes','evidence_document_bytes']:[])]), id = runId(value.run_id); signal(value.cancellation_signal);
    const current = active(id,value.expected_in_progress_manifest_sha256), next = validateAnalysisManifest(value.terminal_manifest);
    if (next.run_id !== id || next.status !== status) failure('VALIDATION_FAILED');
    const {status:nextStatus,ended_at,evidence,terminal_detail,artifacts,...nextBase} = next; void nextStatus; void ended_at; void evidence; void terminal_detail;
    const {status:oldStatus,artifacts:oldArtifacts,...oldBase} = current.value; void oldStatus;
    if (canonicalDesktopJson(nextBase) !== canonicalDesktopJson(oldBase) || canonicalDesktopJson(artifacts.slice(0,oldArtifacts.length)) !== canonicalDesktopJson(oldArtifacts)) failure('VALIDATION_FAILED');
    if (status==='succeeded') {
      if (oldArtifacts.length !== 4) failure('INTEGRITY_BLOCKED');
      for (const [key,descriptor] of [['evidence_bytes',next.evidence!],['summary_bytes',next.artifacts[4]],['evidence_document_bytes',next.artifacts[5]]] as const) { const bytes = value[key]; if (!(bytes instanceof Uint8Array) || digest(bytes)!==descriptor.sha256 || String(bytes.length)!==descriptor.byte_length) failure('VALIDATION_FAILED'); }
      const output = (index: 2|3) => validateAnalysisOutput(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(verifyFile(current.directory,oldArtifacts[index]))),current.value,index);
      const primary = output(2), independent = output(3);
      if (canonicalDesktopJson(primary) !== canonicalDesktopJson(independent)) failure('INTEGRITY_BLOCKED');
      const evidenceText = new TextDecoder('utf-8',{fatal:true}).decode(value.evidence_bytes as Uint8Array), evidenceValue = JSON.parse(evidenceText);
      if (canonicalDesktopJson(evidenceValue) !== evidenceText) failure('VALIDATION_FAILED');
      const evidence = validateAnalysisEvidence(evidenceValue,next,primary), publications = evidence.candidate_publications as UnknownRecord, aggregate = publications.aggregate as UnknownRecord, report = publications.report as UnknownRecord;
      for (const item of [aggregate,report.markdown,report.html] as UnknownRecord[]) verifyFile(projectRoot,{path:text(item.locator),sha256:text(item.sha256),byte_length:text(item.byte_length)});
      const aggregateBytes = bytesAt(projectRoot,text(aggregate.locator)), aggregateText = new TextDecoder('utf-8',{fatal:true}).decode(aggregateBytes);
      if (aggregateText !== canonicalDesktopJson({schema_version:analysisArtifactVersion(planOf(current.value)),...analysisPlanIdentity(planOf(current.value)),artifact_id:aggregate.artifact_id,run_id:id,product_context:next.product_context,method:next.method,result:primary})) failure('INTEGRITY_BLOCKED');
      signal(value.cancellation_signal); writeExclusive(current.directory,'evidence.json',value.evidence_bytes as Uint8Array); writeExclusive(current.directory,'summary.md',value.summary_bytes as Uint8Array); writeExclusive(current.directory,'evidence.md',value.evidence_document_bytes as Uint8Array);
    } else if (artifacts.length !== oldArtifacts.length) failure('VALIDATION_FAILED');
    signal(value.cancellation_signal); verifyReferenced(next,current.directory); replaceManifest(current,next); return bundle(id);
  }); }
  return Object.freeze({beginRun,recordDuckDbResult:(input:unknown)=>recordOutput(input,2),recordPythonResult:(input:unknown)=>recordOutput(input,3),succeedRun:(input:unknown)=>terminal(input,'succeeded'),failRun:(input:unknown)=>terminal(input,'failed'),cancelRun:(input:unknown)=>terminal(input,'cancelled'),readTerminalRun:(input:unknown)=>guarded(()=>{const value=exactRecord(input,['run_id']);return bundle(runId(value.run_id));})});
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

function sessionFingerprint(command: CreateSessionRequest): string {
  return createHash('sha256').update(JSON.stringify({ operation_kind: 'create_session', request: {
    contract_version: command.contract_version, project_id: command.project_id, display_name: command.display_name, case_name: command.case_name,
    fields: { question_text: command.fields.question_text, hypothesis_display_title: command.fields.hypothesis_display_title,
      business_context: command.fields.business_context, alternative_explanations: [...command.fields.alternative_explanations] },
  } })).digest('hex');
}

function saveFingerprint(command: SaveFormRequest): string {
  if (command.form.kind !== 'case_fields') failure('FORBIDDEN');
  return createHash('sha256').update(JSON.stringify({ operation_kind: 'save_form', request: {
    contract_version: command.contract_version, project_id: command.project_id, session_id: command.session_id, case_id: command.case_id, revision_id: command.revision_id, expected_row_version: command.expected_row_version,
    form: { kind: 'case_fields', fields: { question_text: command.form.fields.question_text, hypothesis_display_title: command.form.fields.hypothesis_display_title, business_context: command.form.fields.business_context, alternative_explanations: [...command.form.fields.alternative_explanations] } },
  } })).digest('hex');
}

function syncDirectory(path: string): void {
  fileIdentity(path, true);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
function confirmationChoice(row: UnknownRecord) {
  return {
    column_mapping: { member_id_column: text(row.member_id_column), member_group_column: row.member_group_column === null ? null : text(row.member_group_column), order_id_column: text(row.order_id_column), order_member_id_column: text(row.order_member_id_column), paid_at_column: text(row.paid_at_column), amount_column: text(row.amount_column), status_column: text(row.status_column), currency_column: text(row.currency_column) },
    comparison_period: { start_date: text(row.comparison_start_date), end_date: text(row.comparison_end_date) }, current_period: { start_date: text(row.current_start_date), end_date: text(row.current_end_date) },
    currency: 'CNY' as const, time_zone: 'Asia/Shanghai' as const, valid_statuses: JSON.parse(text(row.valid_statuses_json)) as string[], issue_treatments: JSON.parse(text(row.issue_treatments_json)) as {code: string; count: string; treatment: string}[], selected_group_mode: row.selected_group_mode as 'none' | 'mapped',
    ...(row.schema_version==='2.0'?{analysis_kind:'overall_change' as const}:{hypothesis_id:'current_repurchase_rate_lower_than_comparison' as const}), method_id: 'membership_repurchase_comparison' as const, method_version: '1.0' as const,
    authority_confirmed: true as const, issues_confirmed: true as const, plan_confirmed: true as const,
  };
}

function confirmedRowsIdentity(rows: Record<string, UnknownRecord[]>): void {
  if (rows.source_snapshots.length !== rows.input_confirmations.length) failure('INTEGRITY_BLOCKED');
  for (const row of rows.input_confirmations) {
    const snapshot = rows.source_snapshots.find(x => x.snapshot_id === row.snapshot_id), revision = rows.case_revisions.find(x => x.revision_id === row.revision_id);
    if (!snapshot || !revision || revision.confirmation_id !== row.confirmation_id || revision.snapshot_id !== row.snapshot_id || !['Ready','Review','NeedsAttention','Completed'].includes(String(revision.state))) failure('INTEGRITY_BLOCKED');
    for (const item of [row, snapshot]) if (!['project_id','session_id','case_id','revision_id'].every(key => item[key] === revision[key]) || !isTimestamp(item.created_at) || (item===row?!['1.0','2.0'].includes(String(item.schema_version)):item.schema_version!=='1.0')) failure('INTEGRITY_BLOCKED');
    if (![row.confirmation_id, snapshot.snapshot_id].every(id => typeof id === 'string' && UUID.test(id))) failure('INTEGRITY_BLOCKED');
    const choice = confirmationChoice(row);
    validateMemberConfirmation({ contract_version: row.schema_version, command_id: row.confirmation_id, project_id: row.project_id, session_id: row.session_id, case_id: row.case_id, revision_id: row.revision_id, expected_row_version: String(revision.row_version), inspection_token: row.confirmation_id, confirmation: choice });
    const context = { project_id: text(row.project_id), session_id: text(row.session_id), case_id: text(row.case_id), revision_id: text(row.revision_id), snapshot_id: text(row.snapshot_id), confirmation_id: text(row.confirmation_id) };
    const documents = memberConfirmationDocuments(context, choice);
    for (const name of ['contract', 'binding', 'ir'] as const) if (text(row[`${name}_json`]) !== Buffer.from(documents[`${name}_bytes`]).toString('utf8') || digest(text(row[`${name}_json`])) !== row[`${name}_sha256`]) failure('INTEGRITY_BLOCKED');
    if (row.valid_statuses_json !== canonicalDesktopJson(choice.valid_statuses) || row.issue_treatments_json !== canonicalDesktopJson(choice.issue_treatments) || snapshot.treatment_basis_json !== row.issue_treatments_json) failure('INTEGRITY_BLOCKED');
    for (const name of ['authority_confirmed_at','issues_confirmed_at','plan_confirmed_at']) if (row[name] !== row.created_at) failure('INTEGRITY_BLOCKED');
    if (snapshot.confirmed_at !== row.created_at || snapshot.created_at !== row.created_at) failure('INTEGRITY_BLOCKED');
    for (const role of ['members','orders']) {
      if (snapshot[`${role}_locator`] !== `${row.session_id}/010_draw/${row.snapshot_id}/${role}.csv` || typeof snapshot[`${role}_display_name`] !== 'string' || /[/\\\u0000-\u001f]/.test(String(snapshot[`${role}_display_name`])) || !snapshot[`${role}_display_name`] || snapshot[`${role}_read_at`] !== row.created_at || !/^[0-9a-f]{64}$/.test(String(snapshot[`${role}_sha256`]))) failure('INTEGRITY_BLOCKED');
    }
    const receipts = rows.command_receipts.filter(x => x.operation_kind === 'confirm_revision' && x.revision_id === row.revision_id);
    if (receipts.length !== 1 || receipts[0].result_kind !== 'input_confirmation' || receipts[0].result_id !== row.confirmation_id || receipts[0].completed_at !== row.created_at) failure('INTEGRITY_BLOCKED');
    const priorChanges = rows.command_receipts.filter(x => ['save_form','mark_integrity_blocked'].includes(String(x.operation_kind)) && x.revision_id === row.revision_id && BigInt(String(x.receipt_ordinal)) < BigInt(String(receipts[0].receipt_ordinal))).length;
    const request = { contract_version: row.schema_version, project_id: row.project_id, session_id: row.session_id, case_id: row.case_id, revision_id: row.revision_id, expected_row_version: String(priorChanges + 1), confirmation: choice };
    if (receipts[0].input_fingerprint !== digest(canonicalDesktopJson({ operation_kind: 'confirm_revision', request, sources: { members: snapshot.members_sha256, orders: snapshot.orders_sha256 } }))) failure('INTEGRITY_BLOCKED');
  }
}

type UnknownRecord = Record<string, unknown>;

const analysisMutations = ['save_form','confirm_revision','mark_integrity_blocked','start_analysis','settle_analysis','cancel_analysis','reconcile_interrupted','accept_finding','complete_case','record_model_disclosure','start_assistance','settle_assistance','cancel_assistance','dispose_assistance_draft'];
const ownerKeys = ['project_id','session_id','case_id','revision_id'] as const;
const analysisFingerprint = (operation_kind:string, command:UnknownRecord, detail:UnknownRecord = {}) => {
  const {command_id,...request}=command; void command_id;
  return digest(canonicalDesktopJson({operation_kind,request,...detail}));
};
function analysisRowsIdentity(rows: Record<string,UnknownRecord[]>): void {
  for (const run of rows.analysis_runs) {
    const revision=rows.case_revisions.find(x=>x.revision_id===run.revision_id), confirmation=rows.input_confirmations.find(x=>x.confirmation_id===run.confirmation_id);
    const deadlinePlan=rows.membership_plans?.find(p=>p.run_id===run.run_id);const runLimit=deadlinePlan?Number(JSON.parse(text(deadlinePlan.body_json)).task_context?.run_ms??300000):300000;
    if (!revision || !confirmation || !ownerKeys.every(k=>run[k]===revision[k]&&confirmation[k]===run[k]) || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(String(run.run_id)) || run.profile_id!=='personal-desktop' || run.method_id!=='membership_repurchase_comparison' || run.method_version!=='1.0' || !/^[0-9a-f]{64}$/.test(String(run.code_identity)) || !isTimestamp(run.started_at) || !isTimestamp(run.deadline_at) || Date.parse(run.deadline_at)-Date.parse(run.started_at)!==runLimit || !['3.0','4.0','5.0'].includes(String(run.run_contract_version)) || run.schema_version!=='1.0') failure('INTEGRITY_BLOCKED');
    const starts=rows.command_receipts.filter(x=>x.operation_kind==='start_analysis'&&x.result_id===run.run_id);
    if(starts.length!==1) failure('INTEGRITY_BLOCKED');
    const start=starts[0], prior=rows.command_receipts.filter(x=>x.revision_id===run.revision_id&&analysisMutations.includes(String(x.operation_kind))&&BigInt(String(x.receipt_ordinal))<BigInt(String(start.receipt_ordinal))).length;
    const planRow=rows.membership_plans?.find(p=>p.run_id===run.run_id),plan=planRow?validateMembershipPlan(JSON.parse(text(planRow.body_json))):undefined;
    if(run.run_contract_version!==analysisManifestVersion(plan))failure('INTEGRITY_BLOCKED');
    const command={contract_version:plan?.version==='2.0'?'3.0':plan?'2.0':'1.0',...(plan?{execution_plan:plan}:{}),command_id:start.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,run[k]])),expected_row_version:String(prior+1),confirmation_id:run.confirmation_id};
    if(start.result_kind!=='analysis_run'||start.completed_at!==run.started_at||start.input_fingerprint!==analysisFingerprint('start_analysis',command)) failure('INTEGRITY_BLOCKED');
    const ends=rows.command_receipts.filter(x=>['settle_analysis','cancel_analysis','reconcile_interrupted'].includes(String(x.operation_kind))&&x.result_id===run.run_id);
    const aggregate=rows.aggregate_artifacts.filter(x=>x.run_id===run.run_id), finding=rows.findings.filter(x=>x.run_id===run.run_id), report=rows.report_versions.filter(x=>x.state==='draft'&&finding.some(f=>f.finding_id===x.finding_id)&&!rows.membership_expressions?.some(e=>e.report_id===x.report_id)&&!rows.membership_model_reports?.some(e=>e.report_id===x.report_id));
    if(run.status==='Running') { if(ends.length||aggregate.length||finding.length||report.length||!['Ready','Review','Completed'].includes(String(revision.state))) failure('INTEGRITY_BLOCKED'); }
    else {
      if(ends.length!==1||ends[0].result_kind!=='analysis_run'||!isTimestamp(run.ended_at)||run.ended_at<run.started_at||ends[0].completed_at!==run.ended_at) failure('INTEGRITY_BLOCKED');
      if(run.status==='Succeeded') {
        if(aggregate.length!==1||finding.length!==1||report.length!==1||run.aggregate_id!==aggregate[0].artifact_id||run.run_locator!==`.xanthil/runs/${run.run_id}`||finding[0].aggregate_id!==run.aggregate_id||!['Review','Completed'].includes(String(revision.state))) failure('INTEGRITY_BLOCKED');
        for(const item of [...aggregate,...finding,...report]) if(!ownerKeys.every(k=>item[k]===run[k])||item.created_at!==run.ended_at||(finding.includes(item)?item.schema_version!==(plan?.version==='2.0'?'2.0':'1.0'):item.schema_version!=='1.0')) failure('INTEGRITY_BLOCKED');
        const a=aggregate[0], f=finding[0], r=report[0];
        if(![a.artifact_id,f.finding_id,r.report_id].every(x=>UUID.test(String(x)))||a.snapshot_id!==confirmation.snapshot_id||a.method_id!==run.method_id||a.method_version!==run.method_version||a.code_identity!==run.code_identity||a.locator!==`${run.session_id}/020_clean/${a.artifact_id}/aggregate.json`||r.state!=='draft'||BigInt(String(r.version_sequence))<1n||r.acceptance_id!==null||r.closure_id!==null||r.markdown_locator!==`${run.session_id}/060_reports/${r.report_id}/report.md`||r.html_locator!==`${run.session_id}/060_reports/${r.report_id}/report.html`) failure('INTEGRITY_BLOCKED');
        const metrics=analysisResult(JSON.parse(text(f.metrics_json)),plan);
        if(f.method_id!==run.method_id||f.method_version!==run.method_version||f.judgment!==analysisJudgment(metrics,plan)) failure('INTEGRITY_BLOCKED');
        const exactJson=(actual:unknown,expected:unknown)=>{if(actual!==canonicalDesktopJson(expected))failure('INTEGRITY_BLOCKED');};
        exactJson(f.metrics_json,metrics);
        exactJson(a.columns_json,['period','active_member_count','repeat_member_count','repeat_revenue_fen','repurchase_rate']);
        exactJson(a.measurement_meanings_json,{repeat_revenue_fen:'sum_of_second_and_later_valid_orders_in_period',repurchase_rate:'repeat_member_count/active_member_count'});
        exactJson(f.supporting_evidence_json,[`comparison_repurchase_rate=${analysisRatio(metrics.periods.comparison.repurchase_rate)}`,`current_repurchase_rate=${analysisRatio(metrics.periods.current.repurchase_rate)}`]);
        exactJson(f.refutation_json,analysisRefutation(metrics,plan));if(plan?.version==='2.0'){const facts=membershipFindingFacts(metrics,plan);exactJson(f.facts_json,facts);if(f.facts_sha256!==membershipHash(facts))failure('INTEGRITY_BLOCKED');}else if(f.facts_json!=null||f.facts_sha256!=null)failure('INTEGRITY_BLOCKED');
        exactJson(f.limitations_json,['association_not_causation','no_significance_test','confirmed_local_snapshot_only']);
        const evidenceRefs=[`${run.run_id}:duckdb-result`,`${run.run_id}:python-result`];
        exactJson(f.evidence_refs_json,evidenceRefs);exactJson(r.evidence_refs_json,evidenceRefs);
        exactJson(r.source_json,{schema_version:analysisArtifactVersion(plan),...analysisPlanIdentity(plan),run_id:run.run_id,finding_id:f.finding_id,...Object.fromEntries(ownerKeys.map(k=>[k,run[k]])),confirmation_id:confirmation.confirmation_id,snapshot_id:confirmation.snapshot_id,method:{id:run.method_id,version:run.method_version,code_identity:run.code_identity}});
        if(confirmation.selected_group_mode==='none'){
          if(a.group_pseudonym_map_json!==null||metrics.m2.status!==(plan&&!plan.methods.includes('M2')?'not_selected':'not_applicable'))failure('INTEGRITY_BLOCKED');
        }else{
          const groups=JSON.parse(text(a.group_pseudonym_map_json));
          if(!record(groups)||Object.values(groups).some(x=>typeof x!=='string'||!UUID.test(x))||new Set(Object.values(groups)).size!==Object.keys(groups).length)failure('INTEGRITY_BLOCKED');
          exactJson(a.group_pseudonym_map_json,groups);
          if(metrics.m2.status==='applicable'&&metrics.m2.groups.some(x=>!Object.values(groups).includes(x.group_id)))failure('INTEGRITY_BLOCKED');
        }
      } else if(aggregate.length||finding.length||report.length) failure('INTEGRITY_BLOCKED');
    }
  }
  if(rows.aggregate_artifacts.some(x=>!rows.analysis_runs.some(r=>r.run_id===x.run_id&&r.status==='Succeeded'))||rows.findings.some(x=>!rows.analysis_runs.some(r=>r.run_id===x.run_id&&r.status==='Succeeded'))||rows.report_versions.some(x=>!rows.findings.some(f=>f.finding_id===x.finding_id))) failure('INTEGRITY_BLOCKED');
  for(const revision of rows.case_revisions){const owned=rows.analysis_runs.filter(r=>r.revision_id===revision.revision_id);if(!owned.length)continue;const expected=rows.decision_closures.some(c=>c.revision_id===revision.revision_id)?'Completed':owned.some(r=>r.status==='Succeeded')?'Review':owned.some(r=>r.status==='Running')?'Ready':'NeedsAttention';if(revision.state!==expected)failure('INTEGRITY_BLOCKED');}
}

function failure(code: string): never {
  const error = Object.assign(new Error(code), { code });
  error.stack = code;
  throw error;
}

function nativeFailure(error: unknown, fallback?: string): never {
  const detail = error as { errcode?: number; code?: string };
  const primary = typeof detail?.errcode === 'number' ? detail.errcode & 255 : undefined;
  if (primary === 5 || primary === 6 || detail?.code === 'STORE_BUSY') failure('STORE_BUSY');
  if (fallback) failure(fallback);
  throw error;
}

function record(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactRecord(value: unknown, keys: readonly string[]): UnknownRecord {
  if (!record(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) failure('VALIDATION_FAILED');
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string') failure('VALIDATION_FAILED');
  return value;
}

function projectRootFrom(config: unknown): string {
  const value = exactRecord(config, ['projectRoot']);
  const projectRoot = text(value.projectRoot);
  if (!projectRoot.startsWith('/') || resolve(projectRoot) === '/') failure('VALIDATION_FAILED');
  return projectRoot;
}

function databasePath(projectRoot: string): string {
  return join(projectRoot, '.xanthil', 'desktop', 'state.sqlite');
}

function pragmaValue(db: DatabaseSync, name: string): unknown {
  return (db.prepare(`PRAGMA ${name}`).get() as UnknownRecord)[name];
}

function configure(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 0;');
}

/** The physical A1.2 database contract.  No migrations or optional tables exist. */
const schema = `
CREATE TABLE projects (
  project_id TEXT NOT NULL PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  schema_version TEXT NOT NULL CHECK(schema_version = '1.0')
);
CREATE TABLE product_sessions (
  session_id TEXT NOT NULL PRIMARY KEY,
  project_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode = 'professional'),
  case_id TEXT NOT NULL,
  current_revision_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(project_id, case_id),
  UNIQUE(project_id, session_id),
  UNIQUE(session_id, case_id),
  UNIQUE(project_id, session_id, case_id),
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, current_revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE case_revisions (
  revision_id TEXT NOT NULL PRIMARY KEY,
  project_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  revision_sequence INTEGER NOT NULL CHECK(revision_sequence > 0),
  state TEXT NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Ready','Review','NeedsAttention','Completed')),
  case_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  hypothesis_display_title TEXT NOT NULL,
  business_context TEXT NOT NULL DEFAULT '',
  alternative_explanations_json TEXT NOT NULL DEFAULT '[]',
  evidence_explanation_text TEXT NOT NULL DEFAULT '',
  previous_revision_id TEXT,
  snapshot_id TEXT,
  confirmation_id TEXT,
  current_finding_id TEXT,
  current_acceptance_id TEXT,
  current_closure_id TEXT,
  current_report_id TEXT,
  integrity_state TEXT NOT NULL DEFAULT 'ok' CHECK(integrity_state IN ('ok','integrity_blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK(row_version > 0),
  schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(project_id, session_id, case_id, revision_sequence),
  UNIQUE(project_id, session_id, case_id, revision_id),
  CHECK((revision_sequence = 1 AND previous_revision_id IS NULL) OR (revision_sequence > 1 AND previous_revision_id IS NOT NULL)),
  CHECK(state <> 'Draft' OR (snapshot_id IS NULL AND confirmation_id IS NULL AND current_finding_id IS NULL AND current_acceptance_id IS NULL AND current_closure_id IS NULL AND current_report_id IS NULL)),
  FOREIGN KEY(project_id, session_id, case_id) REFERENCES product_sessions(project_id, session_id, case_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(project_id, session_id, case_id, previous_revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, snapshot_id) REFERENCES source_snapshots(project_id, session_id, case_id, revision_id, snapshot_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, confirmation_id) REFERENCES input_confirmations(project_id, session_id, case_id, revision_id, confirmation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, current_finding_id) REFERENCES findings(project_id, session_id, case_id, revision_id, finding_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, current_acceptance_id) REFERENCES finding_acceptances(project_id, session_id, case_id, revision_id, acceptance_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, current_closure_id) REFERENCES decision_closures(project_id, session_id, case_id, revision_id, closure_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, current_report_id) REFERENCES report_versions(project_id, session_id, case_id, revision_id, report_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE input_confirmations (
  confirmation_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
  member_id_column TEXT NOT NULL, member_group_column TEXT, order_id_column TEXT NOT NULL, order_member_id_column TEXT NOT NULL, paid_at_column TEXT NOT NULL, amount_column TEXT NOT NULL, status_column TEXT NOT NULL, currency_column TEXT NOT NULL,
  comparison_start_date TEXT NOT NULL, comparison_end_date TEXT NOT NULL, current_start_date TEXT NOT NULL, current_end_date TEXT NOT NULL,
  currency TEXT NOT NULL CHECK(currency = 'CNY'), time_zone TEXT NOT NULL CHECK(time_zone = 'Asia/Shanghai'), valid_statuses_json TEXT NOT NULL CHECK(json_valid(valid_statuses_json) AND valid_statuses_json <> '[]'), issue_treatments_json TEXT NOT NULL CHECK(json_valid(issue_treatments_json)),
  selected_group_mode TEXT NOT NULL CHECK(selected_group_mode IN ('none','mapped')), hypothesis_id TEXT NOT NULL CHECK(hypothesis_id = 'current_repurchase_rate_lower_than_comparison'), method_id TEXT NOT NULL CHECK(method_id = 'membership_repurchase_comparison'), method_version TEXT NOT NULL CHECK(method_version = '1.0'),
  authority_confirmed_at TEXT NOT NULL, issues_confirmed_at TEXT NOT NULL, plan_confirmed_at TEXT NOT NULL, contract_json TEXT NOT NULL, contract_sha256 TEXT NOT NULL, binding_json TEXT NOT NULL, binding_sha256 TEXT NOT NULL, ir_json TEXT NOT NULL, ir_sha256 TEXT NOT NULL, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(revision_id), UNIQUE(project_id, session_id, case_id, revision_id, confirmation_id),
  CHECK((selected_group_mode = 'mapped' AND member_group_column IS NOT NULL) OR (selected_group_mode = 'none' AND member_group_column IS NULL)),
  CHECK(comparison_start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(comparison_start_date, '+0 days') IS comparison_start_date),
  CHECK(comparison_end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(comparison_end_date, '+0 days') IS comparison_end_date),
  CHECK(current_start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(current_start_date, '+0 days') IS current_start_date),
  CHECK(current_end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(current_end_date, '+0 days') IS current_end_date),
  CHECK(julianday(comparison_start_date) IS NOT NULL AND julianday(comparison_end_date) IS NOT NULL AND julianday(current_start_date) IS NOT NULL AND julianday(current_end_date) IS NOT NULL AND (julianday(comparison_end_date) <= julianday(current_start_date) OR julianday(current_end_date) <= julianday(comparison_start_date)) AND julianday(comparison_end_date) > julianday(comparison_start_date) AND julianday(current_end_date) > julianday(current_start_date) AND julianday(comparison_end_date) - julianday(comparison_start_date) = julianday(current_end_date) - julianday(current_start_date)),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, snapshot_id) REFERENCES source_snapshots(project_id, session_id, case_id, revision_id, snapshot_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE source_snapshots (
  snapshot_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL,
  members_locator TEXT NOT NULL, members_display_name TEXT NOT NULL, members_sha256 TEXT NOT NULL, members_byte_length INTEGER NOT NULL CHECK(members_byte_length >= 0), members_read_at TEXT NOT NULL,
  orders_locator TEXT NOT NULL, orders_display_name TEXT NOT NULL, orders_sha256 TEXT NOT NULL, orders_byte_length INTEGER NOT NULL CHECK(orders_byte_length >= 0), orders_read_at TEXT NOT NULL,
  included_member_count INTEGER NOT NULL CHECK(included_member_count >= 0), excluded_member_count INTEGER NOT NULL CHECK(excluded_member_count >= 0), included_order_count INTEGER NOT NULL CHECK(included_order_count >= 0), excluded_order_count INTEGER NOT NULL CHECK(excluded_order_count >= 0), treatment_basis_json TEXT NOT NULL, confirmed_at TEXT NOT NULL, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(revision_id), UNIQUE(project_id, session_id, case_id, revision_id, snapshot_id),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE aggregate_artifacts (
  artifact_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, run_id TEXT NOT NULL,
  method_id TEXT NOT NULL, method_version TEXT NOT NULL, code_identity TEXT NOT NULL, columns_json TEXT NOT NULL, measurement_meanings_json TEXT NOT NULL, group_pseudonym_map_json TEXT, locator TEXT NOT NULL, sha256 TEXT NOT NULL, byte_length INTEGER NOT NULL CHECK(byte_length >= 0), created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(run_id), UNIQUE(project_id, session_id, case_id, revision_id, artifact_id), CHECK(group_pseudonym_map_json IS NULL OR (json_valid(group_pseudonym_map_json) AND json_type(group_pseudonym_map_json) = 'object')),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, snapshot_id) REFERENCES source_snapshots(project_id, session_id, case_id, revision_id, snapshot_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, run_id) REFERENCES analysis_runs(project_id, session_id, case_id, revision_id, run_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE analysis_runs (
  run_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, confirmation_id TEXT NOT NULL,
  profile_id TEXT NOT NULL, method_id TEXT NOT NULL, method_version TEXT NOT NULL, code_identity TEXT NOT NULL, run_contract_version TEXT NOT NULL CHECK(run_contract_version = '3.0'), status TEXT NOT NULL CHECK(status IN ('Running','Succeeded','Failed','Cancelled')),
  started_at TEXT NOT NULL, deadline_at TEXT NOT NULL, ended_at TEXT, terminal_reason TEXT, run_locator TEXT, aggregate_id TEXT, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(project_id, session_id, case_id, revision_id, run_id),
  CHECK((status = 'Running' AND ended_at IS NULL AND terminal_reason IS NULL AND run_locator IS NULL AND aggregate_id IS NULL) OR (status = 'Succeeded' AND ended_at IS NOT NULL AND terminal_reason IS NULL AND run_locator IS NOT NULL AND aggregate_id IS NOT NULL) OR (status = 'Failed' AND ended_at IS NOT NULL AND terminal_reason IS NOT NULL AND terminal_reason IN ('source_changed','toolchain_unavailable','calculation_failed','validation_mismatch','run_artifact_failed','publication_failed','deadline_exceeded','interrupted','integrity_blocked') AND run_locator IS NULL AND aggregate_id IS NULL) OR (status = 'Cancelled' AND ended_at IS NOT NULL AND terminal_reason IS NOT NULL AND terminal_reason = 'user_cancelled' AND run_locator IS NULL AND aggregate_id IS NULL)),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, confirmation_id) REFERENCES input_confirmations(project_id, session_id, case_id, revision_id, confirmation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, aggregate_id) REFERENCES aggregate_artifacts(project_id, session_id, case_id, revision_id, artifact_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE model_disclosures (
  disclosure_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, action_kind TEXT NOT NULL CHECK(action_kind IN ('organize_question','explain_evidence','draft_candidates')), categories_json TEXT NOT NULL, aggregate_refs_json TEXT NOT NULL, payload_sha256 TEXT NOT NULL, requested_provider TEXT NOT NULL, requested_model TEXT NOT NULL, decision TEXT NOT NULL CHECK(decision IN ('accepted','refused')), free_text_confirmed_at TEXT, decided_at TEXT NOT NULL, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(project_id, session_id, case_id, revision_id, disclosure_id),
  CHECK((action_kind = 'organize_question' OR aggregate_refs_json <> '[]') AND NOT(decision = 'refused' AND free_text_confirmed_at IS NOT NULL)),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE assistance_attempts (
  attempt_id TEXT NOT NULL PRIMARY KEY, disclosure_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL,
  action_kind TEXT NOT NULL CHECK(action_kind IN ('organize_question','explain_evidence','draft_candidates')), profile_id TEXT NOT NULL, runtime_id TEXT NOT NULL, runtime_version TEXT NOT NULL, adapter_id TEXT NOT NULL, adapter_version TEXT NOT NULL, requested_provider TEXT NOT NULL, requested_model TEXT NOT NULL,
  actual_provider TEXT, actual_model TEXT, ended_at TEXT, terminal_reason TEXT, draft_id TEXT, status TEXT NOT NULL CHECK(status IN ('Running','Succeeded','Failed','Cancelled')), started_at TEXT NOT NULL, deadline_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(disclosure_id), UNIQUE(project_id, session_id, case_id, revision_id, attempt_id),
  CHECK((actual_provider IS NULL) = (actual_model IS NULL)),
  CHECK((status = 'Running' AND actual_provider IS NULL AND actual_model IS NULL AND ended_at IS NULL AND terminal_reason IS NULL AND draft_id IS NULL) OR (status = 'Succeeded' AND actual_provider IS NOT NULL AND actual_model IS NOT NULL AND ended_at IS NOT NULL AND terminal_reason IS NULL AND draft_id IS NOT NULL) OR (status = 'Failed' AND ended_at IS NOT NULL AND draft_id IS NULL AND terminal_reason IS NOT NULL AND terminal_reason IN ('provider_failed','validation_failed','deadline_exceeded','interrupted')) OR (status = 'Cancelled' AND actual_provider IS NULL AND actual_model IS NULL AND ended_at IS NOT NULL AND terminal_reason IS NOT NULL AND terminal_reason = 'user_cancelled' AND draft_id IS NULL)),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, disclosure_id) REFERENCES model_disclosures(project_id, session_id, case_id, revision_id, disclosure_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, draft_id) REFERENCES assistance_drafts(project_id, session_id, case_id, revision_id, draft_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE assistance_drafts (
  draft_id TEXT NOT NULL PRIMARY KEY, attempt_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, draft_kind TEXT NOT NULL CHECK(draft_kind IN ('question_fields','evidence_explanation','candidates')), generated_content_json TEXT NOT NULL, edited_content_json TEXT, disposition TEXT NOT NULL DEFAULT 'pending' CHECK(disposition IN ('pending','adopted','rejected')), target_form TEXT CHECK(target_form IN ('case_fields','evidence_explanation','decision_candidates')), decided_at TEXT, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(attempt_id), UNIQUE(project_id, session_id, case_id, revision_id, draft_id),
  CHECK((disposition = 'pending' AND target_form IS NULL AND decided_at IS NULL) OR (disposition = 'adopted' AND target_form IS NOT NULL AND decided_at IS NOT NULL) OR (disposition = 'rejected' AND target_form IS NULL AND decided_at IS NOT NULL)),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, attempt_id) REFERENCES assistance_attempts(project_id, session_id, case_id, revision_id, attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE findings (
  finding_id TEXT NOT NULL PRIMARY KEY, run_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, aggregate_id TEXT NOT NULL, judgment TEXT NOT NULL CHECK(judgment IN ('Confirmed','Rejected','Inconclusive')), metrics_json TEXT NOT NULL, supporting_evidence_json TEXT NOT NULL, refutation_json TEXT NOT NULL, limitations_json TEXT NOT NULL, evidence_refs_json TEXT NOT NULL, method_id TEXT NOT NULL, method_version TEXT NOT NULL, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(run_id), UNIQUE(project_id, session_id, case_id, revision_id, finding_id),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, run_id) REFERENCES analysis_runs(project_id, session_id, case_id, revision_id, run_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, aggregate_id) REFERENCES aggregate_artifacts(project_id, session_id, case_id, revision_id, artifact_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE finding_acceptances (
  acceptance_id TEXT NOT NULL PRIMARY KEY, finding_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, action TEXT NOT NULL CHECK(action = 'accept'), accepted_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(finding_id), UNIQUE(project_id, session_id, case_id, revision_id, acceptance_id),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, finding_id) REFERENCES findings(project_id, session_id, case_id, revision_id, finding_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE decision_forms (
  form_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, form_sequence INTEGER NOT NULL CHECK(form_sequence > 0), candidates_json TEXT NOT NULL DEFAULT '[]', route TEXT CHECK(route IN ('candidate_comparison','insufficient_evidence')), insufficient_reason TEXT, preferred_candidate_id TEXT, preferred_reason TEXT, disposition TEXT NOT NULL DEFAULT 'draft' CHECK(disposition IN ('draft','saved','not_adopted','deferred','more_evidence')), disposition_at TEXT, defer_until TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(revision_id, form_sequence), UNIQUE(project_id, session_id, case_id, revision_id, form_id),
  CHECK((route IS NULL AND disposition IN ('draft','not_adopted','deferred','more_evidence')) OR (route IS NOT NULL AND ((route = 'candidate_comparison' AND candidates_json <> '[]' AND (preferred_candidate_id IS NULL OR instr(candidates_json, preferred_candidate_id) > 0) AND (preferred_candidate_id IS NULL OR preferred_reason IS NOT NULL)) OR (route = 'insufficient_evidence' AND insufficient_reason IS NOT NULL AND preferred_candidate_id IS NULL AND preferred_reason IS NULL)))),
  CHECK((disposition = 'saved' AND route IS NOT NULL) OR disposition <> 'saved'), CHECK(defer_until IS NULL OR disposition = 'deferred'),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE decision_closures (
  closure_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, acceptance_id TEXT NOT NULL, form_id TEXT NOT NULL, route TEXT NOT NULL CHECK(route IN ('candidate_comparison','insufficient_evidence')), completed_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(acceptance_id), UNIQUE(project_id, session_id, case_id, revision_id, closure_id),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, acceptance_id) REFERENCES finding_acceptances(project_id, session_id, case_id, revision_id, acceptance_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, form_id) REFERENCES decision_forms(project_id, session_id, case_id, revision_id, form_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE report_versions (
  report_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL, finding_id TEXT NOT NULL, acceptance_id TEXT, closure_id TEXT, version_sequence INTEGER NOT NULL CHECK(version_sequence > 0), state TEXT NOT NULL CHECK(state IN ('draft','final','superseded')), markdown_locator TEXT NOT NULL, markdown_sha256 TEXT NOT NULL, markdown_byte_length INTEGER NOT NULL CHECK(markdown_byte_length >= 0), html_locator TEXT NOT NULL, html_sha256 TEXT NOT NULL, html_byte_length INTEGER NOT NULL CHECK(html_byte_length >= 0), source_json TEXT NOT NULL, evidence_refs_json TEXT NOT NULL, created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  UNIQUE(revision_id, version_sequence), UNIQUE(project_id, session_id, case_id, revision_id, report_id),
  CHECK((state = 'final' AND acceptance_id IS NOT NULL AND closure_id IS NOT NULL) OR (state = 'draft' AND acceptance_id IS NULL AND closure_id IS NULL) OR state = 'superseded'),
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, finding_id) REFERENCES findings(project_id, session_id, case_id, revision_id, finding_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, acceptance_id) REFERENCES finding_acceptances(project_id, session_id, case_id, revision_id, acceptance_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id, closure_id) REFERENCES decision_closures(project_id, session_id, case_id, revision_id, closure_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE command_receipts (
  command_id TEXT NOT NULL PRIMARY KEY, operation_kind TEXT NOT NULL CHECK(operation_kind IN ('initialize_project','create_session','create_draft_revision','save_form','confirm_revision','start_analysis','cancel_analysis','settle_analysis','record_model_disclosure','start_assistance','cancel_assistance','settle_assistance','dispose_assistance_draft','accept_finding','complete_case','export_report','mark_integrity_blocked','reconcile_interrupted')),
  project_id TEXT NOT NULL, session_id TEXT, case_id TEXT, revision_id TEXT, input_fingerprint TEXT NOT NULL, outcome TEXT NOT NULL CHECK(outcome IN ('succeeded','rejected')), result_kind TEXT CHECK(result_kind IN ('project','product_session','case_revision','input_confirmation','analysis_run','model_disclosure','assistance_attempt','assistance_draft','finding_acceptance','decision_form','decision_closure','report_version')), result_id TEXT, rejection_reason TEXT, completed_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'),
  CHECK((outcome = 'rejected' AND result_kind IS NULL AND result_id IS NULL AND rejection_reason IS NOT NULL) OR (outcome = 'succeeded' AND result_kind IS NOT NULL AND result_id IS NOT NULL AND rejection_reason IS NULL)),
  CHECK((operation_kind = 'initialize_project' AND session_id IS NULL AND case_id IS NULL AND revision_id IS NULL) OR (operation_kind <> 'initialize_project' AND session_id IS NOT NULL AND case_id IS NOT NULL AND revision_id IS NOT NULL)),
  CHECK((operation_kind = 'initialize_project' AND outcome = 'succeeded' AND result_kind = 'project' AND session_id IS NULL AND case_id IS NULL AND revision_id IS NULL) OR (operation_kind = 'create_session' AND outcome = 'succeeded' AND result_kind = 'product_session' AND session_id IS NOT NULL AND case_id IS NOT NULL AND revision_id IS NOT NULL) OR (operation_kind = 'create_draft_revision' AND outcome = 'succeeded' AND result_kind = 'case_revision') OR (operation_kind = 'save_form' AND outcome = 'succeeded' AND result_kind IN ('case_revision','decision_form')) OR (operation_kind = 'confirm_revision' AND outcome = 'succeeded' AND result_kind = 'input_confirmation') OR (operation_kind IN ('start_analysis','cancel_analysis','settle_analysis') AND outcome = 'succeeded' AND result_kind = 'analysis_run') OR (operation_kind = 'record_model_disclosure' AND outcome = 'succeeded' AND result_kind = 'model_disclosure') OR (operation_kind IN ('start_assistance','cancel_assistance','settle_assistance') AND outcome = 'succeeded' AND result_kind = 'assistance_attempt') OR (operation_kind = 'dispose_assistance_draft' AND outcome = 'succeeded' AND result_kind = 'assistance_draft') OR (operation_kind = 'accept_finding' AND outcome = 'succeeded' AND result_kind = 'finding_acceptance') OR (operation_kind = 'complete_case' AND outcome = 'succeeded' AND result_kind = 'decision_closure') OR (operation_kind = 'export_report' AND outcome = 'succeeded' AND result_kind = 'report_version') OR (operation_kind = 'mark_integrity_blocked' AND outcome = 'succeeded' AND result_kind = 'case_revision') OR (operation_kind = 'reconcile_interrupted' AND outcome = 'succeeded' AND result_kind IN ('analysis_run','assistance_attempt')) OR outcome = 'rejected'),
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id) REFERENCES product_sessions(project_id, session_id, case_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY(project_id, session_id, case_id, revision_id) REFERENCES case_revisions(project_id, session_id, case_id, revision_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE UNIQUE INDEX analysis_runs_one_running ON analysis_runs(revision_id) WHERE status = 'Running';
CREATE UNIQUE INDEX assistance_attempts_one_running ON assistance_attempts(revision_id) WHERE status = 'Running';
CREATE INDEX product_sessions_project_created ON product_sessions(project_id, created_at, session_id);
CREATE INDEX case_revisions_session_case_sequence ON case_revisions(session_id, case_id, revision_sequence);
CREATE INDEX report_versions_revision_sequence ON report_versions(revision_id, version_sequence);
CREATE INDEX decision_forms_revision_sequence ON decision_forms(revision_id, form_sequence);
`;

function fileIdentity(path: string, directory = false): string {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : !stat.isFile())) failure('SCHEMA_UNSUPPORTED');
  return JSON.stringify([stat.dev, stat.ino, stat.size, stat.mtimeMs]);
}

function optionalIdentity(path: string): string | null {
  try { return fileIdentity(path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    failure('SCHEMA_UNSUPPORTED');
  }
}

function assertContainedPath(path: string): void {
  // The selected Project itself and each child authority directory must be real
  // directories. OS ancestors outside the Project are not our authority.
  for (const directory of [dirname(dirname(dirname(path))), dirname(dirname(path)), dirname(path)]) fileIdentity(directory, true);
}

function prepareDatabaseDirectory(path: string): void {
  fileIdentity(dirname(dirname(dirname(path))), true);
  for (const directory of [dirname(dirname(path)), dirname(path)]) {
    try { fileIdentity(directory, true); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      mkdirSync(directory, { mode: 0o700 });
      fileIdentity(directory, true);
    }
  }
}

function rawPreflight(path: string): string {
  guardBrowserProjectDatabase(path);
  try {
    assertContainedPath(path);
    const identity = fileIdentity(path);
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile() || identity !== JSON.stringify([stat.dev, stat.ino, stat.size, stat.mtimeMs])) failure('SCHEMA_UNSUPPORTED');
      const header = Buffer.alloc(100);
      if (readSync(fd, header, 0, 100, 0) !== 100 || header.subarray(0, 16).toString('utf8') !== SQLITE_HEADER ||
          header[18] !== 1 || header[19] !== 1 || ![USER_VERSION,110,120].includes(header.readUInt32BE(60)) || header.readUInt32BE(68) !== APPLICATION_ID) failure('SCHEMA_UNSUPPORTED');
    } finally { closeSync(fd); }
    if (optionalIdentity(`${path}-wal`) !== null || optionalIdentity(`${path}-shm`) !== null) failure('SCHEMA_UNSUPPORTED');
    return JSON.stringify([fileIdentity(dirname(path), true), identity, optionalIdentity(`${path}-journal`)]);
  } catch { failure('SCHEMA_UNSUPPORTED'); }
}

const normalizedSql = (sql: string): string => sql.trim().replace(/\s+/g, ' ');
const expectedSchema = schema.split(';').map(normalizedSql).filter(Boolean).sort();
const schema110=schema.replace("CHECK(run_contract_version = '3.0')","CHECK(run_contract_version IN ('3.0','4.0'))")+membershipSchema;
const expectedP1Schema=schema110.split(';').map(normalizedSql).filter(Boolean).sort();
const schema120=schema110.replace("CHECK(run_contract_version IN ('3.0','4.0'))","CHECK(run_contract_version IN ('3.0','4.0','5.0'))")
 .replace(/CREATE TABLE input_confirmations \([\s\S]*?;\n/,table=>table.replace("hypothesis_id TEXT NOT NULL CHECK(hypothesis_id = 'current_repurchase_rate_lower_than_comparison')","hypothesis_id TEXT").replace("schema_version TEXT NOT NULL CHECK(schema_version = '1.0')","schema_version TEXT NOT NULL CHECK(schema_version IN ('1.0','2.0'))").replace('  UNIQUE(revision_id)',"  CHECK((schema_version='1.0' AND hypothesis_id IS NOT NULL AND hypothesis_id='current_repurchase_rate_lower_than_comparison') OR (schema_version='2.0' AND hypothesis_id IS NULL)),\n  UNIQUE(revision_id)"))
 .replace(/CREATE TABLE findings \([\s\S]*?;\n/,table=>table.replace("judgment IN ('Confirmed','Rejected','Inconclusive')","judgment IN ('Confirmed','Rejected','Inconclusive','Verified')").replace("schema_version TEXT NOT NULL CHECK(schema_version = '1.0')","schema_version TEXT NOT NULL CHECK(schema_version IN ('1.0','2.0')), facts_json TEXT, facts_sha256 TEXT").replace('  UNIQUE(run_id)',"  CHECK((schema_version='1.0' AND judgment IN ('Confirmed','Rejected','Inconclusive') AND facts_json IS NULL AND facts_sha256 IS NULL) OR (schema_version='2.0' AND judgment='Verified' AND facts_json IS NOT NULL AND json_valid(facts_json) AND facts_sha256 IS NOT NULL)),\n  UNIQUE(run_id)"))
 +memberOperationSchema+memberSourceSchema+memberModelSchema;
const expectedBrowserSchema=schema120.split(';').map(normalizedSql).filter(Boolean).sort();

function inspectReadOnly(db: DatabaseSync): void {
  let integrity: unknown;
  try { integrity = db.prepare('PRAGMA integrity_check').all(); }
  catch (error) { nativeFailure(error, 'INTEGRITY_BLOCKED'); }
  if (JSON.stringify(integrity) !== '[{"integrity_check":"ok"}]') failure('INTEGRITY_BLOCKED');
  const actual = db.prepare('SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL').all()
    .map((row) => normalizedSql(String(row.sql))).sort();
  const version=Number(pragmaValue(db,'user_version'));
  if (JSON.stringify(actual) !== JSON.stringify(version===120?expectedBrowserSchema:version===110?expectedP1Schema:expectedSchema)) failure('SCHEMA_UNSUPPORTED');
  assertExistingIdentity(db);
  if([110,120].includes(version))assertMembershipIdentity(db);
  if(version===120){assertMemberOperations(db);assertMemberSourceSets(db);assertMemberModels(db);}
}

function readOnlyPreflight(path: string): string {
  const before = rawPreflight(path);
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(path, { readOnly: true });
    inspectReadOnly(db);
  } catch (error) {
    if (['SCHEMA_UNSUPPORTED', 'FORBIDDEN', 'INTEGRITY_BLOCKED'].includes(String((error as NodeJS.ErrnoException).code))) throw error;
    nativeFailure(error, 'INTEGRITY_BLOCKED');
  } finally { db?.close(); }
  if (rawPreflight(path) !== before) failure('SCHEMA_UNSUPPORTED');
  return before;
}

function openReadbackConnection(path:string):DatabaseSync {
 rawPreflight(path);const db=new DatabaseSync(path,{readOnly:true});try{inspectReadOnly(db);return db;}catch(error){db.close();throw error;}
}
function openConnection(path: string, existing: boolean): DatabaseSync {
  if (existing) {
    rawPreflight(path);
    if (optionalIdentity(`${path}-journal`) !== null) {
      let recovery: DatabaseSync | undefined;
      try {
        recovery = new DatabaseSync(path);
        // SQLite defers page access until a read. This SELECT only triggers its
        // native rollback; no custom journal parsing or repair is performed.
        recovery.prepare('SELECT name FROM sqlite_schema LIMIT 1').get();
      } catch (error) { nativeFailure(error, 'INTEGRITY_BLOCKED'); }
      finally { recovery?.close(); }
    }
    const inspected = readOnlyPreflight(path);
    if (readOnlyPreflight(path) !== inspected) failure('SCHEMA_UNSUPPORTED');
    let db: DatabaseSync | undefined;
    try {
      db = new DatabaseSync(path);
      if (rawPreflight(path) !== inspected) failure('SCHEMA_UNSUPPORTED');
      inspectReadOnly(db);
      configure(db);
      return db;
    } catch (error) { db?.close(); nativeFailure(error); }
  }
  assertContainedPath(path);
  const db = new DatabaseSync(path);
  try { configure(db); return db; }
  catch (error) { db.close(); nativeFailure(error); }
}

function assertExistingIdentity(db: DatabaseSync): void {
  if (Number(pragmaValue(db, 'application_id')) !== APPLICATION_ID || ![USER_VERSION,110,120].includes(Number(pragmaValue(db, 'user_version')))) failure('SCHEMA_UNSUPPORTED');
  // Read the complete closed table set before classifying the current tuple.
  const tables = [...schema.matchAll(/CREATE TABLE ([a-z_]+)/g)].map(match => match[1]);
  const rows = Object.fromEntries(tables.map(table => {
    const statement = db.prepare(table === 'command_receipts' ? 'SELECT rowid AS receipt_ordinal,* FROM command_receipts ORDER BY rowid' : `SELECT * FROM ${table}`);
    statement.setReadBigInts(true);
    return [table, statement.all()];
  }));
  const projects = rows.projects;
  if (projects.length !== 1) failure('INTEGRITY_BLOCKED');
  const project = projects[0];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const timestamp = (value: unknown): boolean => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  if (typeof project.project_id !== 'string' || !uuid.test(project.project_id) || typeof project.display_name !== 'string' || !project.display_name.trim() || !timestamp(project.created_at) || project.schema_version !== SCHEMA_VERSION) failure('INTEGRITY_BLOCKED');
  const currentTables = ['projects', 'product_sessions', 'case_revisions', 'command_receipts', 'source_snapshots', 'input_confirmations','analysis_runs','aggregate_artifacts','findings','report_versions','finding_acceptances','decision_forms','decision_closures','model_disclosures','assistance_attempts','assistance_drafts'];
  if (tables.some(table => !currentTables.includes(table) && rows[table].length !== 0) || rows.command_receipts.some(row => !['initialize_project', 'create_session','create_draft_revision','export_report', ...analysisMutations].includes(String(row.operation_kind)))) failure('FORBIDDEN');
  for (const revision of rows.case_revisions) {
    if (!['Draft','Ready','Review','NeedsAttention','Completed'].includes(String(revision.state)) || (revision.state === 'Draft' ? revision.snapshot_id !== null || revision.confirmation_id !== null : revision.snapshot_id === null || revision.confirmation_id === null) || (['Review','Completed'].includes(String(revision.state)) ? revision.current_finding_id===null||revision.current_report_id===null : revision.current_finding_id!==null||revision.current_report_id!==null) || typeof revision.evidence_explanation_text !== 'string') failure('FORBIDDEN');
    const acceptances=rows.finding_acceptances.filter(a=>a.revision_id===revision.revision_id);
    const closedAcceptance=rows.decision_closures.find(c=>c.closure_id===revision.current_closure_id)?.acceptance_id;
    if(revision.current_acceptance_id!==(revision.state==='Completed'?closedAcceptance:acceptances.at(-1)?.acceptance_id??null))failure('INTEGRITY_BLOCKED');
    for(const acceptance of acceptances){
      const finding=rows.findings.find(f=>f.finding_id===acceptance.finding_id),receipts=rows.command_receipts.filter(r=>r.operation_kind==='accept_finding'&&r.result_id===acceptance.acceptance_id);
      if(!finding||!ownerKeys.every(k=>acceptance[k]===revision[k]&&finding[k]===acceptance[k])||!UUID.test(String(acceptance.acceptance_id))||acceptance.action!=='accept'||!isTimestamp(acceptance.accepted_at)||acceptance.schema_version!=='1.0'||receipts.length!==1)failure('INTEGRITY_BLOCKED');
      const receipt=receipts[0],prior=rows.command_receipts.filter(r=>r.revision_id===revision.revision_id&&analysisMutations.includes(String(r.operation_kind))&&BigInt(String(r.receipt_ordinal))<BigInt(String(receipt.receipt_ordinal))).length;
      const command={contract_version:'1.0',command_id:receipt.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),expected_row_version:String(prior+1),finding_id:finding.finding_id};
      if(receipt.result_kind!=='finding_acceptance'||receipt.completed_at!==acceptance.accepted_at||receipt.input_fingerprint!==analysisFingerprint('accept_finding',command))failure('INTEGRITY_BLOCKED');
    }
  }
  const foreignKeys = db.prepare('PRAGMA foreign_key_check');
  foreignKeys.setReadBigInts(true);
  if (foreignKeys.all().length !== 0 || rows.case_revisions.some(r=>!rows.product_sessions.some(s=>s.session_id===r.session_id&&s.case_id===r.case_id&&s.project_id===r.project_id))) failure('INTEGRITY_BLOCKED');
  const initial = rows.command_receipts.filter(row => row.operation_kind === 'initialize_project');
  if (initial.length !== 1) failure('INTEGRITY_BLOCKED');
  const receipt = initial[0];
  const expectedFingerprint = createHash('sha256').update(JSON.stringify({ operation_kind: 'initialize_project', request: { contract_version: '1.0', display_name: project.display_name } })).digest('hex');
  if (typeof receipt.command_id !== 'string' || !uuid.test(receipt.command_id) || receipt.project_id !== project.project_id || receipt.result_id !== project.project_id || receipt.result_kind !== 'project' || receipt.outcome !== 'succeeded' || receipt.rejection_reason !== null || receipt.session_id !== null || receipt.case_id !== null || receipt.revision_id !== null || receipt.input_fingerprint !== expectedFingerprint || !timestamp(receipt.completed_at) || receipt.completed_at !== project.created_at || receipt.schema_version !== SCHEMA_VERSION) failure('INTEGRITY_BLOCKED');
  for (const session of rows.product_sessions) {
    const revisions=rows.case_revisions.filter(r=>r.session_id===session.session_id).sort((a,b)=>BigInt(String(a.revision_sequence))<BigInt(String(b.revision_sequence))?-1:1);
    if (!revisions.length || revisions.at(-1)!.revision_id!==session.current_revision_id || session.project_id !== project.project_id || ![session.session_id, session.case_id, session.current_revision_id].every(id => typeof id === 'string' && uuid.test(id)) || session.mode !== 'professional' || typeof session.display_name !== 'string' || !session.display_name.trim() || session.schema_version !== SCHEMA_VERSION || !timestamp(session.created_at) || revisions[0].created_at !== session.created_at) failure('INTEGRITY_BLOCKED');
    for(const [index,revision]of revisions.entries()){
    if(!UUID.test(String(revision.revision_id))||revision.revision_sequence!==BigInt(index+1)||revision.previous_revision_id!==(index===0?null:revisions[index-1].revision_id)||!isTimestamp(revision.created_at)||!isTimestamp(revision.updated_at))failure('INTEGRITY_BLOCKED');
    let alternatives: unknown;
    try { alternatives = JSON.parse(String(revision.alternative_explanations_json)); } catch { failure('INTEGRITY_BLOCKED'); }
    if (typeof revision.case_name !== 'string' || !revision.case_name.trim() || typeof revision.question_text !== 'string' || typeof revision.hypothesis_display_title !== 'string' || typeof revision.business_context !== 'string' || !Array.isArray(alternatives) || alternatives.some(x => typeof x !== 'string' || !/[^\p{White_Space}]/u.test(x))) failure('INTEGRITY_BLOCKED');
    const creates = rows.command_receipts.filter(row => row.operation_kind === 'create_session' && row.session_id === session.session_id);
    if (creates.length !== 1) failure('INTEGRITY_BLOCKED');
    const created = creates[0];
    const expected = sessionFingerprint({ contract_version: '1.0', command_id: String(created.command_id), project_id: String(project.project_id), display_name: session.display_name, case_name: revision.case_name,
      fields: { question_text: revision.question_text, hypothesis_display_title: revision.hypothesis_display_title, business_context: revision.business_context, alternative_explanations: alternatives } });
    const saves = rows.command_receipts.filter(row => row.operation_kind === 'save_form' && row.revision_id === revision.revision_id);
    const questionAdoptions=rows.command_receipts.filter(r=>r.operation_kind==='dispose_assistance_draft'&&r.revision_id===revision.revision_id&&rows.assistance_drafts.some(d=>d.draft_id===r.result_id&&d.disposition==='adopted'&&d.target_form==='case_fields'));
    const marks = rows.command_receipts.filter(row => row.operation_kind === 'mark_integrity_blocked' && row.revision_id === revision.revision_id);
    const confirmations = rows.command_receipts.filter(row => row.operation_kind === 'confirm_revision' && row.revision_id === revision.revision_id);
    const analyses = rows.command_receipts.filter(row => ['start_analysis','settle_analysis','cancel_analysis','reconcile_interrupted','accept_finding','complete_case','record_model_disclosure','start_assistance','settle_assistance','cancel_assistance','dispose_assistance_draft'].includes(String(row.operation_kind)) && row.revision_id === revision.revision_id);
    if (revision.row_version !== BigInt(1 + saves.length + marks.length + confirmations.length + analyses.length)) failure('FORBIDDEN');
    if(index===0&&(!saves.length&&!questionAdoptions.length&&created.input_fingerprint!==expected||created.revision_id!==revision.revision_id))failure('FORBIDDEN');
    if(index>0){const previous=revisions[index-1],receipts=rows.command_receipts.filter(r=>r.operation_kind==='create_draft_revision'&&r.result_id===revision.revision_id);if(receipts.length!==1)failure('INTEGRITY_BLOCKED');const receipt=receipts[0],command={contract_version:'1.0',command_id:receipt.command_id,project_id:revision.project_id,session_id:revision.session_id,case_id:revision.case_id,revision_id:previous.revision_id,expected_row_version:String(previous.row_version)};
      if(receipt.revision_id!==previous.revision_id||receipt.result_kind!=='case_revision'||receipt.completed_at!==revision.created_at||receipt.input_fingerprint!==analysisFingerprint('create_draft_revision',command)||revision.case_name!==previous.case_name)failure('INTEGRITY_BLOCKED');
      if(!saves.length&&!questionAdoptions.length&&['question_text','hypothesis_display_title','business_context','alternative_explanations_json'].some(k=>revision[k]!==previous[k]))failure('INTEGRITY_BLOCKED');
    }
    const latest = saves.filter(r=>r.result_kind==='case_revision').at(-1);
    const latestQuestion=questionAdoptions.at(-1),questionIsLatest=latestQuestion&&(!latest||BigInt(String(latestQuestion.receipt_ordinal))>BigInt(String(latest.receipt_ordinal)));
    if(questionIsLatest){const draft=rows.assistance_drafts.find(d=>d.draft_id===latestQuestion.result_id)!,content=JSON.parse(text(draft.edited_content_json??draft.generated_content_json));
      if(revision.question_text!==content.question_text||revision.hypothesis_display_title!==content.hypothesis_display_title||revision.business_context!==content.business_context||canonicalDesktopJson(alternatives)!==canonicalDesktopJson(content.alternative_explanations))failure('INTEGRITY_BLOCKED');}
    const explanationAdoption=rows.command_receipts.filter(r=>r.operation_kind==='dispose_assistance_draft'&&r.revision_id===revision.revision_id&&rows.assistance_drafts.some(d=>d.draft_id===r.result_id&&d.disposition==='adopted'&&d.target_form==='evidence_explanation')).at(-1);
    const explanationIsLatest=explanationAdoption&&(!latest||BigInt(String(explanationAdoption.receipt_ordinal))>BigInt(String(latest.receipt_ordinal)));
    let hasCurrentExplanationSave=false;
    if(explanationIsLatest){const draft=rows.assistance_drafts.find(d=>d.draft_id===explanationAdoption.result_id)!,content=JSON.parse(text(draft.edited_content_json??draft.generated_content_json));if(revision.evidence_explanation_text!==content.evidence_explanation_text)failure('INTEGRITY_BLOCKED');hasCurrentExplanationSave=true;}
    if (latest) {
      const prior = rows.command_receipts.filter(row => analysisMutations.includes(String(row.operation_kind)) && row.revision_id === revision.revision_id && BigInt(String(row.receipt_ordinal)) < BigInt(String(latest.receipt_ordinal))).length;
      const expectedSave = saveFingerprint({ contract_version: '1.0', command_id: String(latest.command_id), project_id: String(project.project_id), session_id: String(session.session_id), case_id: String(session.case_id), revision_id: String(revision.revision_id), expected_row_version: String(prior + 1), form: { kind: 'case_fields', fields: { question_text: revision.question_text, hypothesis_display_title: revision.hypothesis_display_title, business_context: revision.business_context, alternative_explanations: alternatives } } });
      const expectedEvidence=analysisFingerprint('save_form',{contract_version:'1.0',command_id:latest.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),expected_row_version:String(prior+1),form:{kind:'evidence_explanation',evidence_explanation_text:revision.evidence_explanation_text}});
      hasCurrentExplanationSave=hasCurrentExplanationSave||latest.input_fingerprint===expectedEvidence;
      if (!questionIsLatest&&!explanationIsLatest&&![expectedSave,expectedEvidence].includes(String(latest.input_fingerprint)) || ![...saves,...marks,...confirmations,...analyses].some(row => BigInt(String(row.receipt_ordinal)) > BigInt(String(latest.receipt_ordinal))) && latest.completed_at !== revision.updated_at) failure('FORBIDDEN');
    }
    // Case-field saves never author an explanation. Without a matching Review
    // explanation save, only the exact creation value is supported: empty at
    // sequence one, or the immutable predecessor's copied value thereafter.
    if(!hasCurrentExplanationSave&&revision.evidence_explanation_text!==(index===0?'':revisions[index-1].evidence_explanation_text))failure('INTEGRITY_BLOCKED');
    if (created.result_id !== session.session_id || created.result_kind !== 'product_session' || created.completed_at !== session.created_at) failure('INTEGRITY_BLOCKED');
    if (revision.integrity_state === 'ok' ? marks.length !== 0 || !saves.length && !confirmations.length && !analyses.length && revision.updated_at !== revision.created_at : marks.length !== 1 || !timestamp(revision.updated_at)) failure('FORBIDDEN');
    }
  }
  for (const item of rows.command_receipts.filter(row => row.operation_kind !== 'initialize_project')) {
    const session = rows.product_sessions.find(row => row.session_id === item.session_id);
    if (!session || typeof item.command_id !== 'string' || !uuid.test(item.command_id) || item.project_id !== project.project_id || item.case_id !== session.case_id || !rows.case_revisions.some(r=>r.revision_id===item.revision_id&&r.session_id===session.session_id&&r.case_id===session.case_id) || item.outcome !== 'succeeded' || item.rejection_reason !== null || !timestamp(item.completed_at) || item.schema_version !== SCHEMA_VERSION || typeof item.input_fingerprint !== 'string' || !/^[0-9a-f]{64}$/.test(item.input_fingerprint)) failure('INTEGRITY_BLOCKED');
    if (item.operation_kind === 'save_form' && !(item.result_kind==='case_revision'&&item.result_id===item.revision_id||item.result_kind==='decision_form'&&rows.decision_forms.some(f=>f.form_id===item.result_id&&ownerKeys.every(k=>f[k]===item[k])))) failure('INTEGRITY_BLOCKED');
    if(item.operation_kind==='accept_finding'&&!rows.finding_acceptances.some(a=>a.acceptance_id===item.result_id&&ownerKeys.every(k=>a[k]===item[k])))failure('INTEGRITY_BLOCKED');
    if(item.operation_kind==='complete_case'&&!rows.decision_closures.some(c=>c.closure_id===item.result_id&&ownerKeys.every(k=>c[k]===item[k])))failure('INTEGRITY_BLOCKED');
    if(item.operation_kind==='export_report'&&(item.result_kind!=='report_version'||!rows.report_versions.some(r=>r.report_id===item.result_id&&ownerKeys.every(k=>r[k]===item[k]))))failure('INTEGRITY_BLOCKED');
    if(item.operation_kind==='record_model_disclosure'&&(item.result_kind!=='model_disclosure'||!rows.model_disclosures.some(r=>r.disclosure_id===item.result_id&&ownerKeys.every(k=>r[k]===item[k]))))failure('INTEGRITY_BLOCKED');
    if(['start_assistance','settle_assistance','cancel_assistance'].includes(String(item.operation_kind))&&(item.result_kind!=='assistance_attempt'||!rows.assistance_attempts.some(a=>a.attempt_id===item.result_id&&ownerKeys.every(k=>a[k]===item[k]))))failure('INTEGRITY_BLOCKED');
    if(item.operation_kind==='dispose_assistance_draft'&&(item.result_kind!=='assistance_draft'||!rows.assistance_drafts.some(d=>d.draft_id===item.result_id&&ownerKeys.every(k=>d[k]===item[k]))))failure('INTEGRITY_BLOCKED');
    if (item.operation_kind === 'mark_integrity_blocked') {
      const revision = rows.case_revisions.find(row => row.revision_id === item.revision_id)!;
      const expected = createHash('sha256').update(JSON.stringify({ operation_kind: 'mark_integrity_blocked', request: {
        project_id: item.project_id, session_id: item.session_id, case_id: item.case_id, revision_id: item.revision_id, expected_row_version: String(rows.command_receipts.filter(row => analysisMutations.includes(String(row.operation_kind)) && row.revision_id === item.revision_id && BigInt(String(row.receipt_ordinal)) < BigInt(String(item.receipt_ordinal))).length + 1), reason_code: 'INTEGRITY_BLOCKED',
      } })).digest('hex');
      if (item.result_kind !== 'case_revision' || item.result_id !== item.revision_id || item.completed_at !== revision.updated_at || item.input_fingerprint !== expected) failure('INTEGRITY_BLOCKED');
    }
  }
  if([110,120].includes(Number(pragmaValue(db,'user_version'))))rows.membership_plans=db.prepare('SELECT p.*,r.run_id FROM membership_run_plans r JOIN membership_plans p ON p.plan_id=r.plan_id').all();
  if(Number(pragmaValue(db,'user_version'))===120)rows.membership_model_reports=db.prepare('SELECT * FROM membership_model_reports').all();
  if([110,120].includes(Number(pragmaValue(db,'user_version'))))rows.membership_expressions=db.prepare("SELECT result_json FROM membership_receipts WHERE json_extract(result_json,'$.kind')='expression_report'").all().map(r=>JSON.parse(text(r.result_json)));
  try {
    for(const attempt of rows.assistance_attempts){
      const disclosure=rows.model_disclosures.find(d=>d.disclosure_id===attempt.disclosure_id),starts=rows.command_receipts.filter(r=>r.operation_kind==='start_assistance'&&r.result_id===attempt.attempt_id),ends=rows.command_receipts.filter(r=>['settle_assistance','cancel_assistance','reconcile_interrupted'].includes(String(r.operation_kind))&&r.result_id===attempt.attempt_id);
      if(!disclosure||disclosure.decision!=='accepted'||!ownerKeys.every(k=>attempt[k]===disclosure[k])||attempt.action_kind!==disclosure.action_kind||attempt.requested_provider!==disclosure.requested_provider||attempt.requested_model!==disclosure.requested_model||!UUID.test(String(attempt.attempt_id))||attempt.profile_id!=='personal-desktop'||!['runtime_id','runtime_version','adapter_id','adapter_version'].every(k=>typeof attempt[k]==='string'&&String(attempt[k]).trim())||!isTimestamp(attempt.started_at)||!isTimestamp(attempt.deadline_at)||Date.parse(String(attempt.deadline_at))-Date.parse(String(attempt.started_at))!==300000||attempt.schema_version!=='1.0'||starts.length!==1)failure('INTEGRITY_BLOCKED');
      const start=starts[0],prior=rows.command_receipts.filter(r=>r.revision_id===attempt.revision_id&&analysisMutations.includes(String(r.operation_kind))&&BigInt(String(r.receipt_ordinal))<BigInt(String(start.receipt_ordinal))).length;
      if(start.completed_at!==attempt.started_at||start.input_fingerprint!==analysisFingerprint('start_assistance',{contract_version:'1.0',command_id:start.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,attempt[k]])),expected_row_version:String(prior+1),disclosure_id:attempt.disclosure_id}))failure('INTEGRITY_BLOCKED');
      if(attempt.status==='Running'){if(ends.length||rows.analysis_runs.some(r=>r.revision_id===attempt.revision_id&&r.status==='Running'))failure('INTEGRITY_BLOCKED');}
      else{
        if(ends.length!==1||!isTimestamp(attempt.ended_at)||ends[0].completed_at!==attempt.ended_at)failure('INTEGRITY_BLOCKED');
        const draft=rows.assistance_drafts.find(d=>d.draft_id===attempt.draft_id);
        if(attempt.status==='Succeeded'&&(!draft||draft.attempt_id!==attempt.attempt_id||!ownerKeys.every(k=>draft[k]===attempt[k])||!String(attempt.actual_provider).trim()||!String(attempt.actual_model).trim()))failure('INTEGRITY_BLOCKED');
        const terminal=attempt.status==='Succeeded'?{status:'succeeded',draft_id:attempt.draft_id,actual_provider:attempt.actual_provider,actual_model:attempt.actual_model,draft_kind:draft!.draft_kind,generated_content:JSON.parse(text(draft!.generated_content_json))}:attempt.status==='Cancelled'?{status:'cancelled',reason:'user_cancelled'}:{status:'failed',reason:attempt.terminal_reason};
        const priorEnd=rows.command_receipts.filter(r=>r.revision_id===attempt.revision_id&&analysisMutations.includes(String(r.operation_kind))&&BigInt(String(r.receipt_ordinal))<BigInt(String(ends[0].receipt_ordinal))).length;
        const endCommand={contract_version:'1.0',command_id:ends[0].command_id,...Object.fromEntries(ownerKeys.map(k=>[k,attempt[k]])),expected_row_version:String(priorEnd+1)};
        if(ends[0].result_kind!=='assistance_attempt')failure('INTEGRITY_BLOCKED');
        const expectedEnd=ends[0].operation_kind==='reconcile_interrupted'
          ?analysisFingerprint('reconcile_interrupted',{command_id:ends[0].command_id,...Object.fromEntries(ownerKeys.map(k=>[k,attempt[k]])),target_kind:'assistance_attempt',target_id:attempt.attempt_id})
          :ends[0].operation_kind==='cancel_assistance'?analysisFingerprint('cancel_assistance',{...endCommand,attempt_id:attempt.attempt_id}):analysisFingerprint('settle_assistance',endCommand,{attempt_id:attempt.attempt_id,terminal});
        if(ends[0].input_fingerprint!==expectedEnd||ends[0].operation_kind==='reconcile_interrupted'&&(attempt.status!=='Failed'||attempt.terminal_reason!=='interrupted'))failure('INTEGRITY_BLOCKED');
      }
    }
    for(const draft of rows.assistance_drafts){
      const attempt=rows.assistance_attempts.find(a=>a.attempt_id===draft.attempt_id);
      if(!attempt||attempt.status!=='Succeeded'||attempt.draft_id!==draft.draft_id||!UUID.test(String(draft.draft_id))||!['pending','rejected','adopted'].includes(String(draft.disposition))||draft.target_form!==(draft.disposition==='adopted'?({question_fields:'case_fields',evidence_explanation:'evidence_explanation',candidates:'decision_candidates'} as Record<string,string>)[String(draft.draft_kind)]:null)||draft.created_at!==attempt.ended_at||draft.schema_version!=='1.0')failure('INTEGRITY_BLOCKED');
      const dispositions=rows.command_receipts.filter(r=>r.operation_kind==='dispose_assistance_draft'&&r.result_id===draft.draft_id);
      if(draft.disposition==='pending'){if(dispositions.length||draft.edited_content_json!==null||draft.decided_at!==null)failure('INTEGRITY_BLOCKED');}
      else{
        if(dispositions.length!==1||!isTimestamp(draft.decided_at)||dispositions[0].completed_at!==draft.decided_at)failure('INTEGRITY_BLOCKED');
        const r=dispositions[0],prior=rows.command_receipts.filter(x=>x.revision_id===draft.revision_id&&analysisMutations.includes(String(x.operation_kind))&&BigInt(String(x.receipt_ordinal))<BigInt(String(r.receipt_ordinal))).length;
        const command=validateXanthilDesktopRequest('disposeAssistanceDraft',{contract_version:'1.0',command_id:r.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,draft[k]])),expected_row_version:String(prior+1),draft_id:draft.draft_id,disposition:draft.disposition,edited_content:draft.edited_content_json===null?null:JSON.parse(text(draft.edited_content_json))});
        if(r.input_fingerprint!==analysisFingerprint('dispose_assistance_draft',command))failure('INTEGRITY_BLOCKED');
      }
      const content=JSON.parse(text(draft.generated_content_json));if(canonicalDesktopJson(content)!==draft.generated_content_json)failure('INTEGRITY_BLOCKED');
      validateDesktopAssistanceDraft(text(draft.draft_kind),content);
      if(draft.edited_content_json!==null)validateDesktopAssistanceDraft(text(draft.draft_kind),JSON.parse(text(draft.edited_content_json)));
      validateXanthilDesktopRequest('disposeAssistanceDraft',{contract_version:'1.0',command_id:draft.draft_id,...Object.fromEntries(ownerKeys.map(k=>[k,draft[k]])),expected_row_version:'1',draft_id:draft.draft_id,disposition:'rejected',edited_content:content});
      if(draft.draft_kind!==({organize_question:'question_fields',explain_evidence:'evidence_explanation',draft_candidates:'candidates'} as Record<string,string>)[String(attempt.action_kind)])failure('INTEGRITY_BLOCKED');
    }
    for(const disclosure of rows.model_disclosures){
      const receipt=rows.command_receipts.filter(r=>r.operation_kind==='record_model_disclosure'&&r.result_id===disclosure.disclosure_id);
      if(receipt.length!==1||!UUID.test(String(disclosure.disclosure_id))||!isTimestamp(disclosure.decided_at)||disclosure.created_at!==disclosure.decided_at||disclosure.schema_version!=='1.0'||!['accepted','refused'].includes(String(disclosure.decision))||!['organize_question','explain_evidence','draft_candidates'].includes(String(disclosure.action_kind))||!String(disclosure.requested_provider).trim()||!String(disclosure.requested_model).trim()||!/^[0-9a-f]{64}$/.test(String(disclosure.payload_sha256)))failure('INTEGRITY_BLOCKED');
      const categories=JSON.parse(text(disclosure.categories_json)),refs=JSON.parse(text(disclosure.aggregate_refs_json));
      const expectedCategories=disclosure.action_kind==='organize_question'?['action_schema_labels','user_authored_free_text','period_labels','aggregate_column_names']:['action_schema_labels','user_authored_free_text','verified_pseudonymous_aggregate','method_label',...(disclosure.action_kind==='draft_candidates'?['accepted_finding']:[])];
      if(canonicalDesktopJson(categories)!==canonicalDesktopJson(expectedCategories)||disclosure.free_text_confirmed_at!==(disclosure.decision==='accepted'?disclosure.decided_at:null))failure('INTEGRITY_BLOCKED');
      if(disclosure.action_kind==='organize_question'){if(canonicalDesktopJson(refs)!=='[]')failure('INTEGRITY_BLOCKED');}
      else if(!Array.isArray(refs)||refs.length!==1||!rows.aggregate_artifacts.some(a=>a.artifact_id===refs[0]&&ownerKeys.every(k=>a[k]===disclosure[k]))||canonicalDesktopJson(refs)!==disclosure.aggregate_refs_json)failure('INTEGRITY_BLOCKED');
      const r=receipt[0],prior=rows.command_receipts.filter(x=>x.revision_id===disclosure.revision_id&&analysisMutations.includes(String(x.operation_kind))&&BigInt(String(x.receipt_ordinal))<BigInt(String(r.receipt_ordinal))).length;
      const request={contract_version:'1.0',command_id:r.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,disclosure[k]])),expected_row_version:String(prior+1),payload_sha256:disclosure.payload_sha256,decision:disclosure.decision,free_text_confirmed:disclosure.decision==='accepted'};
      const detail={action_kind:disclosure.action_kind,categories,aggregate_refs:refs,requested_provider:disclosure.requested_provider,requested_model:disclosure.requested_model};
      if(r.completed_at!==disclosure.decided_at||r.input_fingerprint!==analysisFingerprint('record_model_disclosure',request,detail))failure('INTEGRITY_BLOCKED');
    }
    for(const revision of rows.case_revisions){
      const forms=rows.decision_forms.filter(f=>f.revision_id===revision.revision_id).sort((a,b)=>BigInt(String(a.form_sequence))<BigInt(String(b.form_sequence))?-1:1);
      for(const [index,form]of forms.entries()){
        if(!ownerKeys.every(k=>form[k]===revision[k])||!UUID.test(String(form.form_id))||form.form_sequence!==BigInt(index+1)||form.schema_version!=='1.0'||!isTimestamp(form.created_at)||!isTimestamp(form.updated_at)||form.disposition==='draft'&&form.disposition_at!==null||form.disposition!=='draft'&&form.disposition_at!==form.updated_at)failure('INTEGRITY_BLOCKED');
        const receipts=rows.command_receipts.filter(r=>r.operation_kind==='save_form'&&r.result_kind==='decision_form'&&r.result_id===form.form_id),last=receipts.at(-1);
        const adoptions=rows.command_receipts.filter(r=>r.operation_kind==='dispose_assistance_draft'&&ownerKeys.every(k=>r[k]===form[k])&&rows.assistance_drafts.some(d=>d.draft_id===r.result_id&&d.disposition==='adopted'&&d.target_form==='decision_candidates'));
        const latestAdoption=adoptions.at(-1),adoptionIsLatest=latestAdoption&&(!last||BigInt(String(latestAdoption.receipt_ordinal))>BigInt(String(last.receipt_ordinal)));
        if(adoptionIsLatest&&index===forms.length-1&&form.disposition==='draft'){
          const draft=rows.assistance_drafts.find(d=>d.draft_id===latestAdoption.result_id)!,content=exactRecord(JSON.parse(text(draft.edited_content_json??draft.generated_content_json)),['candidates']);
          // A candidate-only creation has never authorized a route or preference.
          // Later manual saves retain their separate receipt authority.
          if(!last&&['route','insufficient_reason','preferred_candidate_id','preferred_reason','defer_until'].some(k=>form[k]!==null))failure('INTEGRITY_BLOCKED');
          if(form.candidates_json!==canonicalDesktopJson(content.candidates)||latestAdoption.completed_at!==form.updated_at||!last&&(!adoptions.some(r=>r.completed_at===form.created_at)||form.form_sequence!==1n)||form.disposition_at!==null)failure('INTEGRITY_BLOCKED');
          const input=validateXanthilDesktopRequest('saveForm',{contract_version:'1.0',command_id:latestAdoption.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),expected_row_version:'1',form:{kind:'decision_closure',candidates:content.candidates,route:form.route,insufficient_reason:form.insufficient_reason,preferred_candidate_id:form.preferred_candidate_id,preferred_reason:form.preferred_reason,disposition:'draft',defer_until:null}});
          if(input.form.kind!=='decision_closure')failure('INTEGRITY_BLOCKED');validateDesktopDecisionForm(input.form);continue;
        }
        if(!last||receipts[0].completed_at!==form.created_at&&!adoptions.some(r=>r.completed_at===form.created_at&&BigInt(String(r.receipt_ordinal))<BigInt(String(receipts[0].receipt_ordinal)))||last.completed_at!==form.updated_at)failure('INTEGRITY_BLOCKED');
        const prior=rows.command_receipts.filter(r=>r.revision_id===revision.revision_id&&analysisMutations.includes(String(r.operation_kind))&&BigInt(String(r.receipt_ordinal))<BigInt(String(last.receipt_ordinal))).length;
        const command=validateXanthilDesktopRequest('saveForm',{contract_version:'1.0',command_id:last.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),expected_row_version:String(prior+1),form:{kind:'decision_closure',candidates:JSON.parse(text(form.candidates_json)),route:form.route,insufficient_reason:form.insufficient_reason,preferred_candidate_id:form.preferred_candidate_id,preferred_reason:form.preferred_reason,disposition:form.disposition,defer_until:form.defer_until}});
        if(command.form.kind!=='decision_closure')failure('INTEGRITY_BLOCKED');validateDesktopDecisionForm(command.form);
        if(canonicalDesktopJson(command.form.candidates)!==form.candidates_json||analysisFingerprint('save_form',command)!==last.input_fingerprint)failure('INTEGRITY_BLOCKED');
      }
    }
    for(const revision of rows.case_revisions){
      const closures=rows.decision_closures.filter(c=>c.revision_id===revision.revision_id),reports=rows.report_versions.filter(r=>r.revision_id===revision.revision_id).sort((a,b)=>BigInt(String(a.version_sequence))<BigInt(String(b.version_sequence))?-1:1);
      if(revision.current_closure_id!==(closures.at(-1)?.closure_id??null))failure('INTEGRITY_BLOCKED');
      for(const closure of closures){
        const acceptance=rows.finding_acceptances.find(a=>a.acceptance_id===closure.acceptance_id),form=rows.decision_forms.find(f=>f.form_id===closure.form_id),receipts=rows.command_receipts.filter(r=>r.operation_kind==='complete_case'&&r.result_id===closure.closure_id),report=reports.filter(r=>r.closure_id===closure.closure_id);
        if(!acceptance||!form||!ownerKeys.every(k=>closure[k]===revision[k]&&acceptance[k]===closure[k]&&form[k]===closure[k])||!UUID.test(String(closure.closure_id))||!isTimestamp(closure.completed_at)||closure.schema_version!=='1.0'||form.disposition!=='saved'||form.route!==closure.route||receipts.length!==1||report.length!==1)failure('INTEGRITY_BLOCKED');
        const receipt=receipts[0],prior=rows.command_receipts.filter(r=>r.revision_id===revision.revision_id&&analysisMutations.includes(String(r.operation_kind))&&BigInt(String(r.receipt_ordinal))<BigInt(String(receipt.receipt_ordinal))).length;
        if(receipt.result_kind!=='decision_closure'||receipt.completed_at!==closure.completed_at||receipt.input_fingerprint!==analysisFingerprint('complete_case',{contract_version:'1.0',command_id:receipt.command_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),expected_row_version:String(prior+1),acceptance_id:closure.acceptance_id,form_id:closure.form_id}))failure('INTEGRITY_BLOCKED');
        if(report[0].state!=='final'||report[0].acceptance_id!==acceptance.acceptance_id||report[0].finding_id!==acceptance.finding_id||report[0].created_at!==closure.completed_at)failure('INTEGRITY_BLOCKED');
      }
      for(const [index,report]of reports.entries()){
        if(report.version_sequence!==BigInt(index+1)||!UUID.test(String(report.report_id))||!ownerKeys.every(k=>report[k]===revision[k])||!isTimestamp(report.created_at)||report.schema_version!=='1.0'||report.markdown_locator!==`${report.session_id}/060_reports/${report.report_id}/report.md`||report.html_locator!==`${report.session_id}/060_reports/${report.report_id}/report.html`||![report.markdown_sha256,report.html_sha256].every(x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x)))failure('INTEGRITY_BLOCKED');
        if(report.state==='final'){
          const closure=closures.find(c=>c.closure_id===report.closure_id),finding=rows.findings.find(f=>f.finding_id===report.finding_id),run=finding&&rows.analysis_runs.find(r=>r.run_id===finding.run_id),confirmation=run&&rows.input_confirmations.find(c=>c.confirmation_id===run.confirmation_id);
          if(!closure||!finding||!run||!confirmation)failure('INTEGRITY_BLOCKED');
          const source={schema_version:'1.0',run_id:run.run_id,finding_id:finding.finding_id,...Object.fromEntries(ownerKeys.map(k=>[k,revision[k]])),confirmation_id:confirmation.confirmation_id,snapshot_id:confirmation.snapshot_id,method:{id:run.method_id,version:run.method_version,code_identity:run.code_identity},acceptance_id:closure.acceptance_id,form_id:closure.form_id,closure_id:closure.closure_id};
          if(['4.0','5.0'].includes(String(run.run_contract_version))){
            const receipt=db.prepare("SELECT result_json FROM membership_receipts WHERE json_extract(result_json,'$.report_id')=? AND json_extract(result_json,'$.kind')='human_review'").get(text(report.report_id));if(!receipt)failure('INTEGRITY_BLOCKED');const submitted=JSON.parse(text(receipt.result_json)),reviewRow=db.prepare('SELECT * FROM membership_reviews WHERE review_id=? AND version=?').get(submitted.review_id,submitted.review_version);if(!reviewRow)failure('INTEGRITY_BLOCKED');const review=decoded<MembershipReview>(reviewRow),parent=reports.find(p=>p.report_id===review.source.report_id);if(!parent||parent.state!=='draft'||parent.finding_id!==finding.finding_id||parent.markdown_sha256!==review.source.report_sha256||submitted.acceptance_id!==closure.acceptance_id||submitted.closure_id!==closure.closure_id)failure('INTEGRITY_BLOCKED');
            const expected={...JSON.parse(text(parent.source_json)),acceptance_id:closure.acceptance_id,form_id:closure.form_id,closure_id:closure.closure_id,review:{task_id:review.task_id,review_id:review.id,review_version:String(review.sequence),intent_id:review.intent_id,parent_report_id:review.source.report_id,parent_report_sha256:review.source.report_sha256}};if(report.source_json!==canonicalDesktopJson(expected))failure('INTEGRITY_BLOCKED');
          }else if(report.source_json!==canonicalDesktopJson(source))failure('INTEGRITY_BLOCKED');
          if(report.evidence_refs_json!==finding.evidence_refs_json)failure('INTEGRITY_BLOCKED');
        }else if(report.state!=='draft')failure('INTEGRITY_BLOCKED');
      }
      const current=reports.find(r=>r.report_id===revision.current_report_id);
      if(revision.state==='Completed'&&(!current||current.state!=='final'||current.closure_id!==revision.current_closure_id||current.acceptance_id!==revision.current_acceptance_id||current.finding_id!==revision.current_finding_id))failure('INTEGRITY_BLOCKED');
      if(revision.state==='Review'&&(!current||current.state!=='draft'||current.finding_id!==revision.current_finding_id))failure('INTEGRITY_BLOCKED');
    }
    confirmedRowsIdentity(rows); analysisRowsIdentity(rows);
  } catch { failure('INTEGRITY_BLOCKED'); }
}

function createSchema(db: DatabaseSync, version:100|120): void {
  db.exec(`PRAGMA application_id = ${APPLICATION_ID}; PRAGMA user_version = ${version};`);
  db.exec(version===120?schema120:schema);
}

export function createLocalDesktopDecisionCaseStore(config: unknown): DesktopDecisionCaseStore {
 return createDesktopStore(config,100);
}

/** Exclusive new-directory creation only. Existing project activation is deliberately absent. */
export function createFreshBrowserProjectStore(config:unknown):DesktopDecisionCaseStore{
 const c=exactRecord(config,['projectRoot']),root=text(c.projectRoot);
 if(!isAbsolute(root)||resolve(root)!==root)failure('VALIDATION_FAILED');
 try{mkdirSync(root,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')failure('EXISTING_PROJECT_ACTIVATION_CLOSED');throw error;}
 return createDesktopStore(config,120);
}

/** Only an origin-checked, OS-held native lease can enter the fresh120 reopen path. */
export function createReopenedBrowserProjectStore(lease:BrowserProjectLease):DesktopDecisionCaseStore{
 const projectRoot=browserProjectRoot(lease),store=createDesktopStore({projectRoot},120,false,lease);
 return new Proxy({...store},{get(target,key){const value=Reflect.get(target,key);return typeof value==='function'?(...args:unknown[])=>{lease.check();return Reflect.apply(value,target,args);}:value;}});
}

export function fenceReopenedBrowserProject(lease:BrowserProjectLease):void{
 const root=browserProjectRoot(lease);
 withBrowserMembershipState(root,true,db=>{
  const at=new Date().toISOString();
  for(const task of db.prepare('SELECT task_id,status FROM membership_tasks').all()){
   const taskId=String(task.task_id);fenceMemberOperations(db,taskId);
   for(const row of db.prepare('SELECT grant_id,body_json FROM membership_grants WHERE task_id=? AND revoked_at IS NULL').all(taskId)){const next={...JSON.parse(String(row.body_json)),revoked_at:at};db.prepare('UPDATE membership_grants SET revoked_at=?,body_json=?,body_sha256=? WHERE grant_id=?').run(at,encodeTask(next),taskHash(next),String(row.grant_id));}
   if(!['closed','stopped','interrupted'].includes(String(task.status)))db.prepare("UPDATE membership_tasks SET status='interrupted',epoch=epoch+1,row_version=row_version+1 WHERE task_id=?").run(taskId);
  }
  for(const row of db.prepare("SELECT execution_id FROM membership_operation_usage WHERE phase='issued'").all()){
   const execution_id=String(row.execution_id);db.prepare("UPDATE membership_operation_usage SET phase='unresolved' WHERE execution_id=?").run(execution_id);
   for(const table of ['membership_model_attempts','membership_preparation_attempts']){const saved=db.prepare(`SELECT body_json FROM ${table} WHERE execution_id=?`).get(execution_id);if(saved){const next={...JSON.parse(String(saved.body_json)),status:'unknown',failure_code:'INTERRUPTED'};db.prepare(`UPDATE ${table} SET body_json=?,body_sha256=? WHERE execution_id=?`).run(encodeTask(next),taskHash(next),execution_id);}}
  }
 });
}

export function createBrowserDesktopReadback(projectRoot:string) {
 const store=createDesktopStore({projectRoot},120,true);return {readProjection:store.readProjection,readReportExport:store.readReportExport};
}
function createDesktopStore(config: unknown, initializationVersion:100|120, pureReadback=false,reopenLease?:BrowserProjectLease): DesktopDecisionCaseStore {
  const projectRoot = projectRootFrom(config);
  const path = databasePath(projectRoot);
  let resultPending = false;
  // Live, private preparations bind exactly the verified bytes handed to Main.
  // Weak identity neither persists a destination nor recreates a preparation on reopen.
  const preparedExports=new WeakMap<object,{command_id:string;owner:string;report_id:string;sha256:string;byte_length:string;media_type:string}>();

  async function openProject(input: unknown): Promise<DesktopProjectOpen> {
    const command = exactRecord(input, ['contract_version', 'command_id', 'proposed_project_id', 'display_name', 'initialized_at', 'input_fingerprint']);
    const commandId = text(command.command_id);
    const projectId = text(command.proposed_project_id);
    const displayName = text(command.display_name);
    const createdAt = text(command.initialized_at);
    const fingerprint = text(command.input_fingerprint);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    if (command.contract_version !== SCHEMA_VERSION || !uuid.test(commandId) || !uuid.test(projectId) || !displayName.trim() || displayName !== displayName.trim()) failure('VALIDATION_FAILED');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt) failure('VALIDATION_FAILED');
    if (fingerprint !== createHash('sha256').update(JSON.stringify({ operation_kind: 'initialize_project', request: { contract_version: '1.0', display_name: displayName } })).digest('hex')) failure('VALIDATION_FAILED');
    const existing = optionalIdentity(path) !== null;
    if(existing&&initializationVersion===120&&!reopenLease)failure('EXISTING_PROJECT_ACTIVATION_CLOSED');
    if(reopenLease){reopenLease.check();if(!existing||projectId!==reopenLease.project_id)failure('EXISTING_PROJECT_ACTIVATION_CLOSED');}
    if (!existing) {
      for (const suffix of ['-wal', '-shm', '-journal']) if (optionalIdentity(path + suffix) !== null) failure('SCHEMA_UNSUPPORTED');
      prepareDatabaseDirectory(path);
    }
    const db = openConnection(path, existing);
    try {
      if (existing) {
        assertExistingIdentity(db);
        const project = db.prepare('SELECT project_id, display_name FROM projects').get() as UnknownRecord;
        if (typeof project.project_id !== 'string' || typeof project.display_name !== 'string') failure('INTEGRITY_BLOCKED');
        resultPending = false;
        return Object.freeze({ opened: true, initialized: false, project_id: project.project_id, display_name: project.display_name, schema_version: SCHEMA_VERSION, projection_token: 'project-opened' });
      }
      db.exec('BEGIN IMMEDIATE');
      try {
        createSchema(db,initializationVersion);
        db.prepare('INSERT INTO projects(project_id, display_name, created_at, schema_version) VALUES (?, ?, ?, ?)').run(projectId, displayName, createdAt, SCHEMA_VERSION);
        db.prepare("INSERT INTO command_receipts(command_id, operation_kind, project_id, session_id, case_id, revision_id, input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version) VALUES (?, 'initialize_project', ?, NULL, NULL, NULL, ?, 'succeeded', 'project', ?, NULL, ?, ?)").run(commandId, projectId, fingerprint, projectId, createdAt, SCHEMA_VERSION);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
      return Object.freeze({ opened: true, initialized: true, project_id: projectId, display_name: displayName, schema_version: SCHEMA_VERSION, projection_token: 'project-opened' });
    } catch (error) { nativeFailure(error); }
    finally { db.close(); }
  }

  async function createSession(input: unknown): Promise<DesktopProjection> {
    if (resultPending) failure('RESULT_PENDING');
    const value = exactRecord(input, ['command', 'ids', 'created_at', 'input_fingerprint']);
    const command = validateXanthilDesktopRequest('createSession', value.command);
    const ids = exactRecord(value.ids, ['session_id', 'case_id', 'revision_id', 'operation_id']);
    if (!Object.values(ids).every(id => typeof id === 'string' && UUID.test(id)) || new Set(Object.values(ids)).size !== 4 || !isTimestamp(value.created_at) || command.display_name !== command.display_name.trim() || !command.display_name || command.case_name !== command.case_name.trim() || !command.case_name || value.input_fingerprint !== sessionFingerprint(command)) failure('VALIDATION_FAILED');
    const fingerprint = text(value.input_fingerprint), createdAt = value.created_at;
    const owner = { project_id: command.project_id, session_id: text(ids.session_id), case_id: text(ids.case_id), revision_id: text(ids.revision_id) };
    const receiptOwner = (db: DatabaseSync) => {
      const receipt = db.prepare('SELECT * FROM command_receipts WHERE command_id = ?').get(command.command_id);
      if (!receipt) return undefined;
      if (receipt.operation_kind !== 'create_session' || receipt.input_fingerprint !== fingerprint || receipt.project_id !== command.project_id) failure('COMMAND_CONFLICT');
      if (receipt.outcome !== 'succeeded' || receipt.result_kind !== 'product_session' || receipt.result_id !== receipt.session_id) failure('INTEGRITY_BLOCKED');
      return { project_id: text(receipt.project_id), session_id: text(receipt.session_id), case_id: text(receipt.case_id), revision_id: text(receipt.revision_id) };
    };
    let db: DatabaseSync | undefined = openConnection(path, true);
    let prior: ReturnType<typeof receiptOwner>;
    try {
      if (!db.prepare('SELECT project_id FROM projects WHERE project_id = ?').get(command.project_id)) failure('NOT_FOUND');
      prior = receiptOwner(db);
    } finally { db.close(); db = undefined; }
    if (prior) return readProjection(prior);

    const stagingRoot = join(dirname(path), 'staging'), stage = join(stagingRoot, text(ids.operation_id)), target = join(projectRoot, owner.session_id);
    const requireAbsent = (candidate: string) => {
      try { lstatSync(candidate); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
      failure('COMMAND_CONFLICT');
    };
    try {
      assertContainedPath(path);
      requireAbsent(target); // Includes empty directories and dangling symlinks.
      try { fileIdentity(stagingRoot, true); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; mkdirSync(stagingRoot, { mode: 0o700 }); syncDirectory(dirname(path)); }
      mkdirSync(stage, { mode: 0o700 });
      for (const leaf of ['010_draw', '020_clean', '060_reports']) { mkdirSync(join(stage, leaf), { mode: 0o700 }); syncDirectory(join(stage, leaf)); }
      syncDirectory(stage); syncDirectory(stagingRoot);
      requireAbsent(target);
      // No await between collision check and rename under the approved sole
      // Application writer. This is not an adversarial OS no-replace primitive.
      renameSync(stage, target); syncDirectory(stagingRoot); syncDirectory(projectRoot);
      db = openConnection(path, true);
      db.exec('BEGIN IMMEDIATE');
      let committing = false;
      try {
        const duplicate = receiptOwner(db);
        if (duplicate) { db.exec('ROLLBACK'); db.close(); db = undefined; return readProjection(duplicate); }
        db.prepare("INSERT INTO product_sessions(session_id, project_id, display_name, mode, case_id, current_revision_id, created_at, schema_version) VALUES (?, ?, ?, 'professional', ?, ?, ?, '1.0')").run(owner.session_id, owner.project_id, command.display_name, owner.case_id, owner.revision_id, createdAt);
        db.prepare("INSERT INTO case_revisions(revision_id, project_id, session_id, case_id, revision_sequence, state, case_name, question_text, hypothesis_display_title, business_context, alternative_explanations_json, created_at, updated_at, schema_version) VALUES (?, ?, ?, ?, 1, 'Draft', ?, ?, ?, ?, ?, ?, ?, '1.0')").run(owner.revision_id, owner.project_id, owner.session_id, owner.case_id, command.case_name, command.fields.question_text, command.fields.hypothesis_display_title, command.fields.business_context, JSON.stringify(command.fields.alternative_explanations), createdAt, createdAt);
        db.prepare("INSERT INTO command_receipts(command_id, operation_kind, project_id, session_id, case_id, revision_id, input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version) VALUES (?, 'create_session', ?, ?, ?, ?, ?, 'succeeded', 'product_session', ?, NULL, ?, '1.0')").run(command.command_id, owner.project_id, owner.session_id, owner.case_id, owner.revision_id, fingerprint, owner.session_id, createdAt);
        committing = true;
        db.exec('COMMIT');
      } catch (error) {
        try { db?.exec('ROLLBACK'); } catch { /* COMMIT may already be durable. */ }
        db?.close(); db = undefined;
        if (!committing) throw error;
        let recovered: ReturnType<typeof receiptOwner>;
        let readback: DatabaseSync | undefined;
        try {
          rawPreflight(path);
          readback = new DatabaseSync(path, { readOnly: true });
          inspectReadOnly(readback);
          recovered = receiptOwner(readback);
        } catch { resultPending = true; failure('RESULT_PENDING'); }
        finally { readback?.close(); }
        if (!recovered) failure('PUBLICATION_FAILED');
        return readProjection(recovered);
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (['COMMAND_CONFLICT', 'RESULT_PENDING', 'SCHEMA_UNSUPPORTED', 'FORBIDDEN', 'INTEGRITY_BLOCKED', 'NOT_FOUND'].includes(String(code))) throw error;
      nativeFailure(error, 'PUBLICATION_FAILED');
    } finally { db?.close(); }
    return readProjection(owner);
  }

  async function listSessions(input: unknown): Promise<readonly SessionSummary[]> {
    const value = exactRecord(input, ['project_id']);
    const projectId = text(value.project_id);
    if (!existsSync(path)) failure('NOT_FOUND');
    const db = openConnection(path, true);
    try {
      assertExistingIdentity(db);
      const project = db.prepare('SELECT project_id FROM projects WHERE project_id = ?').get(projectId) as UnknownRecord | undefined;
      if (project === undefined) failure('NOT_FOUND');
      return Object.freeze((db.prepare('SELECT session_id, display_name, mode, case_id, current_revision_id, created_at FROM product_sessions WHERE project_id = ? ORDER BY created_at, session_id').all(projectId) as unknown[]).map((row) => {
        const session = row as UnknownRecord;
        if (session.mode !== 'professional') failure('INTEGRITY_BLOCKED');
        return Object.freeze({
          session_id: text(session.session_id),
          display_name: text(session.display_name),
          mode: 'professional' as const,
          case_id: text(session.case_id),
          current_revision_id: text(session.current_revision_id),
          created_at: text(session.created_at),
        });
      }));
    } finally { db.close(); }
  }

  async function saveForm(input: unknown): Promise<DesktopProjection> {
    if (resultPending) failure('RESULT_PENDING');
    if(record(input)&&record(input.command)&&record(input.command.form)&&input.command.form.kind!=='case_fields')return saveReviewForm(input);
    const value = exactRecord(input, ['command', 'completed_at', 'input_fingerprint']);
    if (record(value.command) && record(value.command.form) && value.command.form.kind !== 'case_fields') failure('FORBIDDEN');
    const command = validateXanthilDesktopRequest('saveForm', value.command);
    if (command.form.kind !== 'case_fields') failure('FORBIDDEN');
    const fingerprint = saveFingerprint(command);
    if (value.input_fingerprint !== fingerprint || !isTimestamp(value.completed_at)) failure('VALIDATION_FAILED');
    const owner = { project_id: command.project_id, session_id: command.session_id, case_id: command.case_id, revision_id: command.revision_id };
    const projection = await readProjection(owner);
    if (projection.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (projection.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    const findReceipt = (connection: DatabaseSync) => {
      const receipt = connection.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);
      if (receipt && (receipt.operation_kind !== 'save_form' || receipt.input_fingerprint !== fingerprint || receipt.project_id !== owner.project_id || receipt.session_id !== owner.session_id || receipt.case_id !== owner.case_id || receipt.revision_id !== owner.revision_id)) failure('COMMAND_CONFLICT');
      return receipt;
    };
    let db: DatabaseSync | undefined = openConnection(path, true), committing = false;
    try {
      if (findReceipt(db)) { db.close(); db = undefined; return readProjection(owner); }
      db.exec('BEGIN IMMEDIATE');
      const currentSession = db.prepare('SELECT current_revision_id FROM product_sessions WHERE project_id=? AND session_id=? AND case_id=?').get(owner.project_id,owner.session_id,owner.case_id);
      if(currentSession?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');
      const statement = db.prepare('SELECT row_version, integrity_state, state FROM case_revisions WHERE project_id=? AND session_id=? AND case_id=? AND revision_id=?'); statement.setReadBigInts(true);
      const row = statement.get(owner.project_id, owner.session_id, owner.case_id, owner.revision_id);
      if (!row) failure('NOT_FOUND');
      if (String(row.row_version) !== command.expected_row_version) failure('ROW_VERSION_CONFLICT');
      if (row.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
      if (!['Draft','Ready'].includes(String(row.state))) failure('FORBIDDEN');
      if (db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(owner.revision_id)) failure('BUSY');
      if (row.row_version === 9223372036854775807n) failure('VALIDATION_FAILED');
      db.prepare('UPDATE case_revisions SET question_text=?, hypothesis_display_title=?, business_context=?, alternative_explanations_json=?, row_version=row_version+1, updated_at=? WHERE revision_id=?').run(command.form.fields.question_text, command.form.fields.hypothesis_display_title, command.form.fields.business_context, JSON.stringify(command.form.fields.alternative_explanations), value.completed_at, owner.revision_id);
      db.prepare("INSERT INTO command_receipts(command_id, operation_kind, project_id, session_id, case_id, revision_id, input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version) VALUES (?, 'save_form', ?, ?, ?, ?, ?, 'succeeded', 'case_revision', ?, NULL, ?, '1.0')").run(command.command_id, owner.project_id, owner.session_id, owner.case_id, owner.revision_id, fingerprint, owner.revision_id, value.completed_at);
      committing = true; db.exec('COMMIT');
    } catch (error) {
      try { db?.exec('ROLLBACK'); } catch { /* Preserve possibly committed receipt. */ }
      db?.close(); db = undefined;
      if (!committing) { if (['COMMAND_CONFLICT', 'ROW_VERSION_CONFLICT', 'STALE_REVISION', 'NOT_FOUND', 'INTEGRITY_BLOCKED', 'VALIDATION_FAILED', 'FORBIDDEN', 'BUSY'].includes(String((error as { code?: string }).code))) throw error; nativeFailure(error, 'PUBLICATION_FAILED'); }
      let check: DatabaseSync | undefined, receipt: UnknownRecord | undefined;
      try { rawPreflight(path); check = new DatabaseSync(path, { readOnly: true }); inspectReadOnly(check); receipt = findReceipt(check); }
      catch { resultPending = true; failure('RESULT_PENDING'); }
      finally { check?.close(); }
      if (!receipt) failure('PUBLICATION_FAILED');
    } finally { db?.close(); }
    return readProjection(owner);
  }

  async function readConfirmedSnapshot(input: unknown): Promise<DesktopConfirmedSnapshot> {
    const value = exactRecord(input, ['project_id','session_id','case_id','revision_id','confirmation_id']);
    if (!Object.values(value).every(id => typeof id === 'string' && UUID.test(id))) failure('VALIDATION_FAILED');
    const owner = { project_id: text(value.project_id), session_id: text(value.session_id), case_id: text(value.case_id), revision_id: text(value.revision_id) };
    const projection = await readProjection(owner);
    if (projection.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if (!projection.confirmation || projection.confirmation.confirmation_id !== value.confirmation_id) failure('NOT_FOUND');
    const db = openConnection(path, true);
    try {
      const row = db.prepare('SELECT * FROM input_confirmations WHERE confirmation_id=?').get(text(value.confirmation_id))!;
      const query = db.prepare('SELECT * FROM source_snapshots WHERE snapshot_id=?'); query.setReadBigInts(true); const snapshot = query.get(text(row.snapshot_id))!;
      const source = (role: 'members' | 'orders') => {
        const root = join(projectRoot, owner.session_id, '010_draw', text(snapshot.snapshot_id));
        for (const directory of [projectRoot,join(projectRoot,owner.session_id),dirname(root),root]) fileIdentity(directory, true);
        const destination = join(root, `${role}.csv`); fileIdentity(destination);
        const fd = openSync(destination, constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
          const bytes = new Uint8Array(readFileSync(fd));
          if (BigInt(bytes.length) !== snapshot[`${role}_byte_length`] || digest(bytes) !== snapshot[`${role}_sha256`]) failure('INTEGRITY_BLOCKED');
          return Object.freeze({ display_name: text(snapshot[`${role}_display_name`]), bytes, sha256: text(snapshot[`${role}_sha256`]), byte_length: String(snapshot[`${role}_byte_length`]) });
        } finally { closeSync(fd); }
      };
      const link=Number(pragmaValue(db,'user_version'))===120?db.prepare('SELECT context_json,context_sha256 FROM membership_confirmation_preparations WHERE confirmation_id=?').get(text(value.confirmation_id)):undefined;
      const context=link?preparedConfirmationContext(JSON.parse(text(link.context_json))):null;
      if(link&&taskHash(context)!==link.context_sha256)failure('INTEGRITY_BLOCKED');
      const resolved=context?resolveMemberPlanPreparation(db,projectRoot,context,false):undefined,preparation=resolved?.preparation;
      return Object.freeze({ ...(preparation?{preparation}:{}),...(resolved?.clarifications?{clarifications:resolved.clarifications}:{}),confirmation: Object.freeze({ contract_bytes: new TextEncoder().encode(text(row.contract_json)), binding_bytes: new TextEncoder().encode(text(row.binding_json)), ir_bytes: new TextEncoder().encode(text(row.ir_json)), contract_sha256: text(row.contract_sha256), binding_sha256: text(row.binding_sha256), ir_sha256: text(row.ir_sha256) }), snapshot: Object.freeze({ snapshot_id: text(snapshot.snapshot_id), members: source('members'), orders: source('orders') }) });
    } catch (error) { nativeFailure(error, 'INTEGRITY_BLOCKED'); }
    finally { db.close(); }
  }

  async function publishConfirmation(input: unknown): Promise<DesktopProjection> {
    if (resultPending) failure('RESULT_PENDING');
    const value = exactRecord(input, ['command','ids','source_files','contract_bytes','binding_bytes','ir_bytes','counts','treatment_basis','completed_at','input_fingerprint',...(input&&typeof input==='object'&&Object.hasOwn(input,'preparation_context')?['preparation_context']:[])]);
    const command = validateMemberConfirmation(value.command), choice = command.confirmation;
    const preparation_context=value.preparation_context===undefined?null:preparedConfirmationContext(value.preparation_context);if((command.contract_version==='2.0')!==!!preparation_context)failure('AUTHORITY_REQUIRED');
    const ids = exactRecord(value.ids, ['snapshot_id','confirmation_id','operation_id']);
    if (!Object.values(ids).every(id => typeof id === 'string' && UUID.test(id)) || new Set(Object.values(ids)).size !== 3 || !isTimestamp(value.completed_at)) failure('VALIDATION_FAILED');
    const owner = { project_id: command.project_id, session_id: command.session_id, case_id: command.case_id, revision_id: command.revision_id };
    const files = exactRecord(value.source_files, ['members','orders']);
    const source = (candidate: unknown) => {
      const item = exactRecord(candidate, ['display_name','bytes']);
      if (!(item.bytes instanceof Uint8Array) || typeof item.display_name !== 'string' || !item.display_name || /[/\\\u0000-\u001f]/.test(item.display_name) || ['.','..'].includes(item.display_name)) failure('VALIDATION_FAILED');
      return { display_name: item.display_name, bytes: new Uint8Array(item.bytes), sha256: digest(item.bytes) };
    };
    const members = source(files.members), orders = source(files.orders);
    const prepared = prepareDesktopData({ members_bytes: members.bytes, orders_bytes: orders.bytes }, choice);
    const treatments = prepared.reviewable_issues.map(issue => ({ code: issue.code, count: issue.count, treatment: issue.treatment_options[0] }));
    if (canonicalDesktopJson(value.counts) !== canonicalDesktopJson(prepared.counts) || canonicalDesktopJson(value.treatment_basis) !== canonicalDesktopJson(treatments) || canonicalDesktopJson(choice.issue_treatments) !== canonicalDesktopJson(treatments)) failure('VALIDATION_FAILED');
    const documents = memberConfirmationDocuments({ ...owner, snapshot_id: text(ids.snapshot_id), confirmation_id: text(ids.confirmation_id) }, choice);
    for (const name of ['contract','binding','ir'] as const) if (!(value[`${name}_bytes`] instanceof Uint8Array) || !Buffer.from(value[`${name}_bytes`] as Uint8Array).equals(documents[`${name}_bytes`])) failure('VALIDATION_FAILED');
    const { command_id, inspection_token, ...request } = command; void command_id; void inspection_token;
    const fingerprint = digest(canonicalDesktopJson({ operation_kind: 'confirm_revision', request, sources: { members: members.sha256, orders: orders.sha256 } }));
    if (value.input_fingerprint !== fingerprint) failure('VALIDATION_FAILED');
    const guardPreparation=(db:DatabaseSync)=>{
      const fresh=Number(pragmaValue(db,'user_version'))===120;
      const task=fresh&&db.prepare('SELECT task_id FROM membership_tasks WHERE project_id=? AND session_id=? AND case_id=?').get(owner.project_id,owner.session_id,owner.case_id);
      const selected=task&&db.prepare('SELECT source_set_id FROM membership_source_sets WHERE task_id=?').get(text(task.task_id));
      if(selected&&!preparation_context)failure('AUTHORITY_REQUIRED');
      if(preparation_context){const actual=resolveMemberPlanPreparation(db,projectRoot,preparation_context,true);if(canonicalDesktopJson(actual.preparation.owner)!==canonicalDesktopJson(owner)||digest(actual.candidate.members_bytes)!==members.sha256||digest(actual.candidate.orders_bytes)!==orders.sha256)failure('SOURCE_CHANGED');}
    };
    const findReceipt = (db: DatabaseSync) => {
      const receipt = db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);
      if (receipt && (receipt.operation_kind !== 'confirm_revision' || receipt.input_fingerprint !== fingerprint || receipt.project_id !== owner.project_id || receipt.session_id !== owner.session_id || receipt.case_id !== owner.case_id || receipt.revision_id !== owner.revision_id)) failure('COMMAND_CONFLICT');
      if(receipt&&Number(pragmaValue(db,'user_version'))===120){
        const link=db.prepare('SELECT context_json,context_sha256 FROM membership_confirmation_preparations WHERE confirmation_id=?').get(text(receipt.result_id));
        if(link?(!preparation_context||link.context_sha256!==taskHash(preparation_context)||link.context_json!==encodeTask(preparation_context)):!!preparation_context)failure('COMMAND_CONFLICT');
      }
      return receipt;
    };
    let db: DatabaseSync | undefined = openConnection(path, true);
    try { if (findReceipt(db)) { db.close(); db = undefined; return readProjection(owner); } guardPreparation(db); }
    finally { db?.close(); db = undefined; }
    const projection = await readProjection(owner);
    if (projection.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (projection.revision?.integrity_state !== 'ok') failure('INTEGRITY_BLOCKED');
    if (projection.revision.row_version !== command.expected_row_version) failure('STALE_REVISION');
    if (projection.revision.state !== 'Draft' || !(preparation_context?[projection.revision.question_text]:[projection.revision.question_text, projection.revision.hypothesis_display_title]).every(x => /[^\p{White_Space}]/u.test(x))) failure('VALIDATION_FAILED');
    const parent = join(projectRoot, owner.session_id, '010_draw'), target = join(parent, text(ids.snapshot_id));
    const staging = join(dirname(path), 'staging'), stage = join(staging, text(ids.operation_id));
    const absent = (candidate: string) => { try { lstatSync(candidate); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; } failure('COMMAND_CONFLICT'); };
    let committing = false;
    try {
      if(preparation_context){db=openConnection(path,true);db.exec('BEGIN IMMEDIATE');if(findReceipt(db)){db.exec('ROLLBACK');db.close();db=undefined;return readProjection(owner);}guardPreparation(db);}
      fileIdentity(projectRoot, true); fileIdentity(join(projectRoot, owner.session_id), true); fileIdentity(parent, true); fileIdentity(staging, true); absent(target);
      mkdirSync(stage, { mode: 0o700 });
      for (const [name, file] of [['members',members],['orders',orders]] as const) {
        const destination = join(stage, `${name}.csv`), fd = openSync(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
        try { writeFileSync(fd, file.bytes); fsyncSync(fd); } finally { closeSync(fd); }
        if (digest(readFileSync(destination)) !== file.sha256) failure('PUBLICATION_FAILED');
      }
      syncDirectory(stage); syncDirectory(staging); absent(target);
      renameSync(stage, target); syncDirectory(staging); syncDirectory(parent);
      if(!db){db = openConnection(path, true); db.exec('BEGIN IMMEDIATE');}
      guardPreparation(db);
      if (findReceipt(db)) { db.exec('ROLLBACK'); db.close(); db = undefined; return readProjection(owner); }
      const query = db.prepare('SELECT r.*,s.current_revision_id FROM case_revisions r JOIN product_sessions s USING(project_id,session_id,case_id) WHERE r.revision_id=?'); query.setReadBigInts(true);
      const row = query.get(owner.revision_id);
      if (!row || row.current_revision_id !== owner.revision_id || row.project_id !== owner.project_id || row.session_id !== owner.session_id || row.case_id !== owner.case_id || String(row.row_version) !== command.expected_row_version) failure('STALE_REVISION');
      if (row.state !== 'Draft' || row.integrity_state !== 'ok' || row.row_version === 9223372036854775807n) failure('VALIDATION_FAILED');
      const insert = (table: string, values: Record<string, string | bigint | null>) => { const keys = Object.keys(values); db!.prepare(`INSERT INTO ${table}(${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(values)); };
      const timestamp = value.completed_at;
      insert('source_snapshots', { snapshot_id: text(ids.snapshot_id), ...owner,
        members_locator: `${owner.session_id}/010_draw/${ids.snapshot_id}/members.csv`, members_display_name: members.display_name, members_sha256: members.sha256, members_byte_length: BigInt(members.bytes.length), members_read_at: timestamp,
        orders_locator: `${owner.session_id}/010_draw/${ids.snapshot_id}/orders.csv`, orders_display_name: orders.display_name, orders_sha256: orders.sha256, orders_byte_length: BigInt(orders.bytes.length), orders_read_at: timestamp,
        included_member_count: BigInt(prepared.counts.included_member_count), excluded_member_count: BigInt(prepared.counts.excluded_member_count), included_order_count: BigInt(prepared.counts.included_order_count), excluded_order_count: BigInt(prepared.counts.excluded_order_count), treatment_basis_json: canonicalDesktopJson(treatments), confirmed_at: timestamp, created_at: timestamp, schema_version: '1.0' });
      insert('input_confirmations', { confirmation_id: text(ids.confirmation_id), ...owner, snapshot_id: text(ids.snapshot_id), ...choice.column_mapping,
        comparison_start_date: choice.comparison_period.start_date, comparison_end_date: choice.comparison_period.end_date, current_start_date: choice.current_period.start_date, current_end_date: choice.current_period.end_date,
        currency: choice.currency, time_zone: choice.time_zone, valid_statuses_json: canonicalDesktopJson(choice.valid_statuses), issue_treatments_json: canonicalDesktopJson(choice.issue_treatments), selected_group_mode: choice.selected_group_mode, hypothesis_id: 'hypothesis_id' in choice?choice.hypothesis_id:null, method_id: choice.method_id, method_version: choice.method_version,
        authority_confirmed_at: timestamp, issues_confirmed_at: timestamp, plan_confirmed_at: timestamp,
        contract_json: Buffer.from(documents.contract_bytes).toString('utf8'), contract_sha256: digest(documents.contract_bytes), binding_json: Buffer.from(documents.binding_bytes).toString('utf8'), binding_sha256: digest(documents.binding_bytes), ir_json: Buffer.from(documents.ir_bytes).toString('utf8'), ir_sha256: digest(documents.ir_bytes), created_at: timestamp, schema_version: command.contract_version });
      if(preparation_context)db.prepare('INSERT INTO membership_confirmation_preparations VALUES(?,?,?,?,?)').run(text(ids.confirmation_id),preparation_context.authority.task_id,preparation_context.preparation.id,encodeTask(preparation_context),taskHash(preparation_context));
      db.prepare("UPDATE case_revisions SET state='Ready',snapshot_id=?,confirmation_id=?,row_version=row_version+1,updated_at=? WHERE revision_id=?").run(text(ids.snapshot_id), text(ids.confirmation_id), timestamp, owner.revision_id);
      db.prepare("INSERT INTO command_receipts(command_id,operation_kind,project_id,session_id,case_id,revision_id,input_fingerprint,outcome,result_kind,result_id,rejection_reason,completed_at,schema_version) VALUES (?,'confirm_revision',?,?,?,?,?,'succeeded','input_confirmation',?,NULL,?,'1.0')").run(command.command_id, owner.project_id, owner.session_id, owner.case_id, owner.revision_id, fingerprint, text(ids.confirmation_id), timestamp);
      committing = true; db.exec('COMMIT');
    } catch (error) {
      try { db?.exec('ROLLBACK'); } catch { /* COMMIT may already be durable. */ }
      db?.close(); db = undefined;
      if (!committing) { if (['COMMAND_CONFLICT','STALE_REVISION','VALIDATION_FAILED','INTEGRITY_BLOCKED','SCHEMA_UNSUPPORTED','AUTHORITY_REQUIRED','SOURCE_CHANGED','PHYSICAL_PENDING','NOT_FOUND'].includes(String((error as {code?: string}).code))) throw error; nativeFailure(error, 'PUBLICATION_FAILED'); }
      let check: DatabaseSync | undefined, receipt: UnknownRecord | undefined;
      try { rawPreflight(path); check = new DatabaseSync(path, { readOnly: true }); inspectReadOnly(check); receipt = findReceipt(check); }
      catch { resultPending = true; failure('RESULT_PENDING'); }
      finally { check?.close(); }
      if (!receipt) failure('PUBLICATION_FAILED');
    } finally { db?.close(); }
    return readProjection(owner);
  }

  async function waitForProjection(input: unknown): Promise<DesktopProjection> {
    const request = exactRecord(input, ['project_id', 'session_id', 'case_id', 'revision_id', 'projection_token']);
    const owner = { project_id: text(request.project_id), session_id: text(request.session_id), case_id: text(request.case_id), revision_id: text(request.revision_id) };
    const token = text(request.projection_token), parts = token.split(':');
    if (parts.length !== 4 || parts[0] !== owner.project_id || parts[1] !== owner.revision_id || !/^[1-9][0-9]*$/.test(parts[2]) || !UUID.test(parts[3])) failure('VALIDATION_FAILED');
    const db = openConnection(path, true);
    try { if (!db.prepare("SELECT command_id FROM command_receipts WHERE command_id=? AND project_id=? AND session_id=? AND case_id=? AND (revision_id=? OR (operation_kind='create_draft_revision' AND result_id=?))").get(parts[3], owner.project_id, owner.session_id, owner.case_id, owner.revision_id,owner.revision_id)) failure('NOT_FOUND'); }
    finally { db.close(); }
    // A named one-shot current read, not a polling loop or automatic retry.
    return readProjection(owner);
  }

  async function createDraftRevision(input:unknown):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command','ids','created_at','input_fingerprint']),command=validateXanthilDesktopRequest('createDraftRevision',value.command),ids=exactRecord(value.ids,['revision_id']);
    const fingerprint=analysisFingerprint('create_draft_revision',command);if(!UUID.test(String(ids.revision_id))||!isTimestamp(value.created_at)||value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const receipt=(db:DatabaseSync)=>{const r=db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);if(r&&(r.operation_kind!=='create_draft_revision'||r.input_fingerprint!==fingerprint||!ownerKeys.every(k=>r[k]===command[k])))failure('COMMAND_CONFLICT');return r;};
    let db:DatabaseSync|undefined=openConnection(path,true),committing=false,newRevision=text(ids.revision_id);
    try{
      const prior=receipt(db);if(prior){newRevision=text(prior.result_id);}else{
        db.exec('BEGIN IMMEDIATE');const again=receipt(db);if(again){newRevision=text(again.result_id);db.exec('ROLLBACK');}else{
          const stmt=db.prepare('SELECT * FROM case_revisions WHERE project_id=? AND session_id=? AND case_id=? AND revision_id=?');stmt.setReadBigInts(true);const old=stmt.get(...ownerKeys.map(k=>command[k]));
          const session=db.prepare('SELECT current_revision_id FROM product_sessions WHERE session_id=? AND project_id=? AND case_id=?').get(command.session_id,command.project_id,command.case_id);
          if(explicitMembershipTask(db,command.case_id))failure('FORBIDDEN');
          if(!old||session?.current_revision_id!==command.revision_id||String(old.row_version)!==command.expected_row_version)failure('STALE_REVISION');if(old.revision_sequence===9223372036854775807n)failure('VALIDATION_FAILED');
          // Referenced-file damage belongs to the old revision. A clean Draft
          // carries fields, not its snapshot/confirmation/output authority.
          for(const directory of [join(projectRoot,command.session_id),...['010_draw','020_clean','060_reports'].map(leaf=>join(projectRoot,command.session_id,leaf))])try{fileIdentity(directory,true);}catch{failure('INTEGRITY_BLOCKED');}
          if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id))failure('BUSY');
          db.prepare("INSERT INTO case_revisions(revision_id,project_id,session_id,case_id,revision_sequence,state,case_name,question_text,hypothesis_display_title,business_context,alternative_explanations_json,evidence_explanation_text,previous_revision_id,created_at,updated_at,row_version,schema_version) VALUES(?,?,?,?,?,'Draft',?,?,?,?,?,?,?,?,?,1,'1.0')").run(newRevision,command.project_id,command.session_id,command.case_id,BigInt(String(old.revision_sequence))+1n,text(old.case_name),text(old.question_text),text(old.hypothesis_display_title),text(old.business_context),text(old.alternative_explanations_json),text(old.evidence_explanation_text),command.revision_id,text(value.created_at),text(value.created_at));
          db.prepare('UPDATE product_sessions SET current_revision_id=? WHERE session_id=?').run(newRevision,command.session_id);
          db.prepare("INSERT INTO command_receipts VALUES(?,'create_draft_revision',?,?,?,?,?,'succeeded','case_revision',?,NULL,?,'1.0')").run(command.command_id,...ownerKeys.map(k=>command[k]),fingerprint,newRevision,text(value.created_at));
          committing=true;db.exec('COMMIT');
        }
      }
    }catch(error){
      try{db?.exec('ROLLBACK');}catch{/* COMMIT may already be durable. */}db?.close();db=undefined;
      if(!committing){if(['COMMAND_CONFLICT','STALE_REVISION','INTEGRITY_BLOCKED','BUSY','VALIDATION_FAILED','FORBIDDEN'].includes(String((error as{code?:string}).code)))throw error;nativeFailure(error,'PUBLICATION_FAILED');}
      let check:DatabaseSync|undefined;try{rawPreflight(path);check=new DatabaseSync(path,{readOnly:true});inspectReadOnly(check);const r=receipt(check);if(!r)failure('PUBLICATION_FAILED');newRevision=text(r.result_id);}catch(error){if((error as{code?:string}).code==='PUBLICATION_FAILED')throw error;resultPending=true;failure('RESULT_PENDING');}finally{check?.close();}
    }finally{db?.close();}
    return readProjection({project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:newRevision});
  }

  async function analysisTransaction(command: UnknownRecord, operation: string, fingerprint: string, completedAt: string, resultId: string, mutate: (db:DatabaseSync, revision:UnknownRecord)=>string|void, resultKind='analysis_run'): Promise<DesktopProjection> {
    if(resultPending) failure('RESULT_PENDING');
    const owner=Object.fromEntries(ownerKeys.map(k=>[k,text(command[k])])) as {project_id:string;session_id:string;case_id:string;revision_id:string};
    const receipt=(db:DatabaseSync)=>{const row=db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(text(command.command_id));if(row&&(row.operation_kind!==operation||row.input_fingerprint!==fingerprint||!ownerKeys.every(k=>row[k]===owner[k]))) failure('COMMAND_CONFLICT');return row;};
    let db:DatabaseSync|undefined=openConnection(path,true), committing=false;
    try {
      if(receipt(db)) {db.close();db=undefined;return readProjection(owner);}
      const activating=operation==='start_analysis'&&command.contract_version==='2.0'&&Number(pragmaValue(db,'user_version'))===100;
      if(activating)db.exec('PRAGMA foreign_keys=OFF');
      db.exec('BEGIN IMMEDIATE');
      if(activating)migrateMembership(db);
      if(receipt(db)) {db.exec('ROLLBACK');db.close();db=undefined;return readProjection(owner);}
      const stmt=db.prepare('SELECT * FROM case_revisions WHERE project_id=? AND session_id=? AND case_id=? AND revision_id=?');stmt.setReadBigInts(true);
      const revision=stmt.get(...ownerKeys.map(k=>owner[k]));
      const current=db.prepare('SELECT current_revision_id FROM product_sessions WHERE project_id=? AND session_id=? AND case_id=?').get(owner.project_id,owner.session_id,owner.case_id);
      if(!revision||current?.current_revision_id!==owner.revision_id||String(revision.row_version)!==command.expected_row_version) failure('STALE_REVISION');
      if(revision.integrity_state!=='ok') failure('INTEGRITY_BLOCKED');
      if(revision.row_version===9223372036854775807n) failure('VALIDATION_FAILED');
      if(['start_assistance','record_model_disclosure','save_form','accept_finding','complete_case','dispose_assistance_draft'].includes(operation)&&explicitMembershipTask(db,owner.case_id))failure('FORBIDDEN');
      resultId=mutate(db,revision)??resultId;
      db.prepare('UPDATE case_revisions SET row_version=row_version+1,updated_at=? WHERE revision_id=?').run(completedAt,owner.revision_id);
      db.prepare("INSERT INTO command_receipts(command_id,operation_kind,project_id,session_id,case_id,revision_id,input_fingerprint,outcome,result_kind,result_id,rejection_reason,completed_at,schema_version) VALUES(?,?,?,?,?,?,?,'succeeded',?,?,NULL,?,'1.0')").run(text(command.command_id),operation,...ownerKeys.map(k=>owner[k]),fingerprint,resultKind,resultId,completedAt);
      if(operation==='start_analysis'&&command.contract_version!=='1.0')inspectReadOnly(db);
      committing=true;db.exec('COMMIT');
    } catch(error) {
      try{db?.exec('ROLLBACK');}catch{/* The native response may be lost after durable COMMIT. */}db?.close();db=undefined;
      if(!committing) {
        if(['COMMAND_CONFLICT','STALE_REVISION','INTEGRITY_BLOCKED','FORBIDDEN','NOT_FOUND','BUSY','VALIDATION_FAILED','DEADLINE_EXCEEDED','AUTHORITY_REQUIRED'].includes(String((error as {code?:string}).code)))throw error;
        nativeFailure(error,'PUBLICATION_FAILED');
      }
      let check:DatabaseSync|undefined, found:UnknownRecord|undefined;
      try{rawPreflight(path);check=new DatabaseSync(path,{readOnly:true});inspectReadOnly(check);found=receipt(check);}
      catch{resultPending=true;failure('RESULT_PENDING');}finally{check?.close();}
      if(!found) failure('PUBLICATION_FAILED');
    } finally{db?.close();}
    return readProjection(owner);
  }

  async function requestAssistanceCancellation(input:Parameters<DesktopDecisionCaseStore['requestAssistanceCancellation']>[0]):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','completed_at','input_fingerprint']),command=validateXanthilDesktopRequest('cancelAssistance',value.command),fingerprint=analysisFingerprint('cancel_assistance',command);
    if(!isTimestamp(value.completed_at)||value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    return analysisTransaction(command,'cancel_assistance',fingerprint,input.completed_at,command.attempt_id,(db)=>{
      const attempt=db.prepare('SELECT * FROM assistance_attempts WHERE attempt_id=?').get(command.attempt_id);if(!attempt||!ownerKeys.every(k=>attempt[k]===command[k]))failure('NOT_FOUND');if(attempt.status!=='Running')failure('FORBIDDEN');
      db.prepare("UPDATE assistance_attempts SET status='Cancelled',ended_at=?,terminal_reason='user_cancelled' WHERE attempt_id=?").run(input.completed_at,command.attempt_id);
    },'assistance_attempt');
  }

  async function disposeAssistanceDraft(input:Parameters<DesktopDecisionCaseStore['disposeAssistanceDraft']>[0]):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','form_id','completed_at','input_fingerprint']),command=validateXanthilDesktopRequest('disposeAssistanceDraft',value.command),fingerprint=analysisFingerprint('dispose_assistance_draft',command);
    if(!isTimestamp(value.completed_at)||value.input_fingerprint!==fingerprint||!UUID.test(String(value.form_id)))failure('VALIDATION_FAILED');
    return analysisTransaction(command,'dispose_assistance_draft',fingerprint,input.completed_at,command.draft_id,(db,revision)=>{
      const draft=db.prepare('SELECT * FROM assistance_drafts WHERE draft_id=?').get(command.draft_id);if(!draft||!ownerKeys.every(k=>draft[k]===command[k]))failure('NOT_FOUND');if(draft.disposition!=='pending')failure('FORBIDDEN');
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id))failure('BUSY');
      const edited=command.edited_content===null?null:canonicalDesktopJson(command.edited_content);
      if(command.edited_content!==null)validateDesktopAssistanceDraft(text(draft.draft_kind),command.edited_content);
      let target:string|null=null;
      if(command.disposition==='adopted'){
        const source=command.edited_content??JSON.parse(text(draft.generated_content_json));
        const {draft_id,disposition,edited_content,...guard}=command;void draft_id;void disposition;void edited_content;
        if(draft.draft_kind==='question_fields'){
          if(!['Draft','Ready'].includes(String(revision.state)))failure('FORBIDDEN');
          const content=exactRecord(source,['question_text','hypothesis_display_title','business_context','alternative_explanations']);validateXanthilDesktopRequest('saveForm',{...guard,form:{kind:'case_fields',fields:content}});
          target='case_fields';db.prepare('UPDATE case_revisions SET question_text=?,hypothesis_display_title=?,business_context=?,alternative_explanations_json=? WHERE revision_id=?').run(text(content.question_text),text(content.hypothesis_display_title),text(content.business_context),canonicalDesktopJson(content.alternative_explanations),command.revision_id);
        }else if(draft.draft_kind==='evidence_explanation'){
          if(revision.state!=='Review')failure('FORBIDDEN');const content=exactRecord(source,['evidence_explanation_text']);validateXanthilDesktopRequest('saveForm',{...guard,form:{kind:'evidence_explanation',...content}});
          target='evidence_explanation';db.prepare('UPDATE case_revisions SET evidence_explanation_text=? WHERE revision_id=?').run(text(content.evidence_explanation_text),command.revision_id);
        }else if(draft.draft_kind==='candidates'){
          if(!['Review','Completed'].includes(String(revision.state)))failure('FORBIDDEN');
          const latestFinding=db.prepare('SELECT finding_id FROM findings WHERE revision_id=? ORDER BY rowid DESC LIMIT 1').get(command.revision_id),acceptance=latestFinding&&db.prepare('SELECT acceptance_id FROM finding_acceptances WHERE revision_id=? AND finding_id=?').get(command.revision_id,text(latestFinding.finding_id));
          if(!acceptance||revision.state==='Completed'&&db.prepare('SELECT closure_id FROM decision_closures WHERE acceptance_id=?').get(text(acceptance.acceptance_id)))failure('AUTHORITY_REQUIRED');
          const content=exactRecord(source,['candidates']),stmt=db.prepare('SELECT * FROM decision_forms WHERE revision_id=? ORDER BY form_sequence DESC LIMIT 1');stmt.setReadBigInts(true);const current=stmt.get(command.revision_id);
          if(current&&current.disposition!=='draft')failure('FORBIDDEN');
          const form=validateXanthilDesktopRequest('saveForm',{...guard,form:{kind:'decision_closure',candidates:content.candidates,route:current?.route??null,insufficient_reason:current?.insufficient_reason??null,preferred_candidate_id:current?.preferred_candidate_id??null,preferred_reason:current?.preferred_reason??null,disposition:'draft',defer_until:null}}).form;
          if(form.kind!=='decision_closure')failure('VALIDATION_FAILED');validateDesktopDecisionForm(form);target='decision_candidates';
          if(current)db.prepare('UPDATE decision_forms SET candidates_json=?,updated_at=? WHERE form_id=?').run(canonicalDesktopJson(form.candidates),input.completed_at,text(current.form_id));
          else db.prepare("INSERT INTO decision_forms(form_id,project_id,session_id,case_id,revision_id,form_sequence,candidates_json,disposition,created_at,updated_at,schema_version) VALUES(?,?,?,?,?,1,?,'draft',?,?,'1.0')").run(input.form_id,...ownerKeys.map(k=>command[k]),canonicalDesktopJson(form.candidates),input.completed_at,input.completed_at);
        }else failure('FORBIDDEN');
      }
      db.prepare('UPDATE assistance_drafts SET disposition=?,edited_content_json=?,target_form=?,decided_at=? WHERE draft_id=?').run(command.disposition,edited,target,input.completed_at,command.draft_id);
    },'assistance_draft');
  }

  async function checkAssistanceAdmission(input:Parameters<DesktopDecisionCaseStore['checkAssistanceAdmission']>[0]):Promise<DesktopProjection|null>{
    const command=validateXanthilDesktopRequest('startAssistance',input),db=openConnection(path,true);
    try{const receipt=db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);if(!receipt)return null;
      if(receipt.operation_kind!=='start_assistance'||receipt.input_fingerprint!==analysisFingerprint('start_assistance',command)||!ownerKeys.every(k=>receipt[k]===command[k]))failure('COMMAND_CONFLICT');
      return readProjection({project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id});
    }finally{db.close();}
  }

  async function admitAssistance(input:Parameters<DesktopDecisionCaseStore['admitAssistance']>[0]):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','attempt_id','runtimeSelection','started_at','deadline_at','input_fingerprint']),command=validateXanthilDesktopRequest('startAssistance',value.command),selection=exactRecord(value.runtimeSelection,['runtime_id','runtime_version','adapter_id','adapter_version','requested_provider','requested_model','ready']),fingerprint=analysisFingerprint('start_assistance',command);
    if(!UUID.test(String(value.attempt_id))||!isTimestamp(value.started_at)||!isTimestamp(value.deadline_at)||Date.parse(text(value.deadline_at))-Date.parse(text(value.started_at))!==300000||selection.ready!==true||Object.entries(selection).some(([k,v])=>k!=='ready'&&(typeof v!=='string'||!v.trim()))||value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const prior=await checkAssistanceAdmission(command);if(prior)return prior;
    const projection=await readProjection({project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id}),d=projection.disclosures.find(d=>d.disclosure_id===command.disclosure_id);if(!d)failure('NOT_FOUND');
    const payload=desktopAssistancePayload(projection,d.action_kind);if(digest(new TextEncoder().encode(payload.payload_text))!==d.payload_sha256)failure('PAYLOAD_STALE');
    return analysisTransaction(command,'start_assistance',fingerprint,input.started_at,input.attempt_id,(db)=>{
      const disclosure=db.prepare('SELECT * FROM model_disclosures WHERE disclosure_id=?').get(command.disclosure_id);if(!disclosure||!ownerKeys.every(k=>disclosure[k]===command[k]))failure('NOT_FOUND');
      if(disclosure.decision!=='accepted'||disclosure.requested_provider!==selection.requested_provider||disclosure.requested_model!==selection.requested_model)failure('FORBIDDEN');
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND (status='Running' OR disclosure_id=?)").get(command.revision_id,command.disclosure_id))failure('BUSY');
      db.prepare("INSERT INTO assistance_attempts(attempt_id,disclosure_id,project_id,session_id,case_id,revision_id,action_kind,profile_id,runtime_id,runtime_version,adapter_id,adapter_version,requested_provider,requested_model,status,started_at,deadline_at,schema_version) VALUES(?,?,?,?,?,?,?,'personal-desktop',?,?,?,?,?,?,'Running',?,?,'1.0')").run(input.attempt_id,command.disclosure_id,...ownerKeys.map(k=>command[k]),text(disclosure.action_kind),text(selection.runtime_id),text(selection.runtime_version),text(selection.adapter_id),text(selection.adapter_version),text(selection.requested_provider),text(selection.requested_model),input.started_at,input.deadline_at);
    },'assistance_attempt');
  }

  async function settleAssistance(input:Parameters<DesktopDecisionCaseStore['settleAssistance']>[0]):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','attempt_id','completed_at','input_fingerprint','terminal']),command=exactRecord(value.command,['contract_version','command_id',...ownerKeys,'expected_row_version']),terminal=input.terminal;
    validateXanthilDesktopRequest('cancelAssistance',{...command,attempt_id:input.attempt_id});if(!isTimestamp(value.completed_at))failure('VALIDATION_FAILED');
    const keys=terminal.status==='succeeded'?['status','draft_id','actual_provider','actual_model','draft_kind','generated_content']:['status','reason'];exactRecord(terminal,keys);
    if(terminal.status==='succeeded'){validateDesktopAssistanceDraft(terminal.draft_kind,terminal.generated_content);validateXanthilDesktopRequest('disposeAssistanceDraft',{...command,draft_id:terminal.draft_id,disposition:'rejected',edited_content:terminal.generated_content});if(!terminal.actual_provider.trim()||!terminal.actual_model.trim())failure('VALIDATION_FAILED');}
    else if(terminal.status==='failed'?!['provider_failed','validation_failed','deadline_exceeded','interrupted'].includes(terminal.reason):terminal.status!=='cancelled'||terminal.reason!=='user_cancelled')failure('VALIDATION_FAILED');
    const fingerprint=analysisFingerprint('settle_assistance',command,{attempt_id:input.attempt_id,terminal});if(fingerprint!==value.input_fingerprint)failure('VALIDATION_FAILED');
    const owner={project_id:text(command.project_id),session_id:text(command.session_id),case_id:text(command.case_id),revision_id:text(command.revision_id)},projection=await readProjection(owner),existing=projection.attempts.find(a=>a.attempt_id===input.attempt_id);if(!existing)failure('NOT_FOUND');if(existing.status!=='Running')return projection;
    return analysisTransaction(command,'settle_assistance',fingerprint,input.completed_at,input.attempt_id,(db)=>{
      const attempt=db.prepare('SELECT * FROM assistance_attempts WHERE attempt_id=?').get(input.attempt_id);if(!attempt||!ownerKeys.every(k=>attempt[k]===command[k]))failure('NOT_FOUND');if(attempt.status!=='Running')failure('FORBIDDEN');
      if(terminal.status==='succeeded'){
        if(Date.parse(input.completed_at)>=Date.parse(text(attempt.deadline_at)))failure('DEADLINE_EXCEEDED');
        if(terminal.draft_kind!==({organize_question:'question_fields',explain_evidence:'evidence_explanation',draft_candidates:'candidates'} as Record<string,string>)[text(attempt.action_kind)])failure('VALIDATION_FAILED');
        db.prepare("INSERT INTO assistance_drafts(draft_id,attempt_id,project_id,session_id,case_id,revision_id,draft_kind,generated_content_json,disposition,created_at,schema_version) VALUES(?,?,?,?,?,?,?,?,'pending',?,'1.0')").run(terminal.draft_id,input.attempt_id,...ownerKeys.map(k=>text(command[k])),terminal.draft_kind,canonicalDesktopJson(terminal.generated_content),input.completed_at);
        db.prepare("UPDATE assistance_attempts SET status='Succeeded',actual_provider=?,actual_model=?,ended_at=?,draft_id=? WHERE attempt_id=?").run(terminal.actual_provider,terminal.actual_model,input.completed_at,terminal.draft_id,input.attempt_id);
      }else db.prepare('UPDATE assistance_attempts SET status=?,ended_at=?,terminal_reason=? WHERE attempt_id=?').run(terminal.status==='failed'?'Failed':'Cancelled',input.completed_at,terminal.reason,input.attempt_id);
    },'assistance_attempt');
  }

  async function recordDisclosure(input:Parameters<DesktopDecisionCaseStore['recordDisclosure']>[0]):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command','disclosure_id','preview','decided_at','input_fingerprint']),command=validateXanthilDesktopRequest('decideAssistanceDisclosure',value.command),preview=input.preview;
    exactRecord(preview,['preview_token','action_kind','categories','aggregate_refs','payload_text','payload_sha256','requested_provider','requested_model','irretractability_notice','cost_notice','free_text_present']);
    if(!UUID.test(String(value.disclosure_id))||!isTimestamp(value.decided_at)||preview.preview_token!==command.preview_token||preview.payload_sha256!==command.payload_sha256||digest(new TextEncoder().encode(preview.payload_text))!==preview.payload_sha256)failure('VALIDATION_FAILED');
    const {preview_token,...semantic}=command;void preview_token;
    const detail={action_kind:preview.action_kind,categories:preview.categories,aggregate_refs:preview.aggregate_refs,requested_provider:preview.requested_provider,requested_model:preview.requested_model},fingerprint=analysisFingerprint('record_model_disclosure',semantic,detail),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    if(input.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const check=openConnection(path,true);try{const r=check.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);if(r){if(r.operation_kind!=='record_model_disclosure'||r.input_fingerprint!==fingerprint||!ownerKeys.every(k=>r[k]===command[k]))failure('COMMAND_CONFLICT');return readProjection(owner);}}finally{check.close();}
    const projection=await readProjection(owner);if(projection.revision?.row_version!==command.expected_row_version)failure('STALE_REVISION');
    const allowed=desktopAssistancePayload(projection,preview.action_kind);
    if(allowed.payload_text!==preview.payload_text||canonicalDesktopJson(allowed.categories)!==canonicalDesktopJson(preview.categories)||canonicalDesktopJson(allowed.aggregate_refs)!==canonicalDesktopJson(preview.aggregate_refs)||allowed.free_text_present!==preview.free_text_present)failure('PAYLOAD_STALE');
    if(command.free_text_confirmed!==(command.decision==='accepted'&&allowed.free_text_present))failure('AUTHORITY_REQUIRED');
    return analysisTransaction(command,'record_model_disclosure',fingerprint,input.decided_at,input.disclosure_id,(db)=>{
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id))failure('BUSY');
      db.prepare("INSERT INTO model_disclosures VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'1.0')").run(input.disclosure_id,...ownerKeys.map(k=>command[k]),preview.action_kind,canonicalDesktopJson(preview.categories),canonicalDesktopJson(preview.aggregate_refs),preview.payload_sha256,preview.requested_provider,preview.requested_model,command.decision,command.free_text_confirmed?input.decided_at:null,input.decided_at,input.decided_at);
    },'model_disclosure');
  }

  async function checkReportExport(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const command=validateXanthilDesktopRequest('exportReport',input),db=openConnection(path,true);
    try{
      const receipt=db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);
      if(!receipt){
        const report=db.prepare('SELECT report_id FROM report_versions WHERE report_id=? AND project_id=? AND session_id=? AND case_id=? AND revision_id=?').get(command.report_id,...ownerKeys.map(k=>command[k]));if(!report)failure('NOT_FOUND');
        const session=db.prepare('SELECT current_revision_id FROM product_sessions WHERE project_id=? AND session_id=? AND case_id=?').get(command.project_id,command.session_id,command.case_id);if(session?.current_revision_id!==command.revision_id)failure('STALE_REVISION');
        return null;
      }
      if(receipt.operation_kind!=='export_report'||receipt.result_kind!=='report_version'||receipt.result_id!==command.report_id||!ownerKeys.every(k=>receipt[k]===command[k]))failure('COMMAND_CONFLICT');
      return {status:'already_recorded' as const,report_id:command.report_id};
    }finally{db.close();}
  }

  async function readReportExport(input:unknown){
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command_id',...ownerKeys,'report_id','format']);if(value.format!=='markdown'&&value.format!=='html')failure('VALIDATION_FAILED');
    if(![value.command_id,value.report_id,...ownerKeys.map(k=>value[k])].every(x=>UUID.test(String(x))))failure('VALIDATION_FAILED');
    const owner={project_id:text(value.project_id),session_id:text(value.session_id),case_id:text(value.case_id),revision_id:text(value.revision_id)},projection=await readProjection(owner),report=projection.reports.find(r=>r.report_id===value.report_id);
    if(!report)failure('NOT_FOUND');if(projection.session?.current_revision_id!==owner.revision_id)failure('STALE_REVISION');
    const markdown=value.format==='markdown',leaf=markdown?'report.md':'report.html',sha=markdown?report.markdown_sha256:report.html_sha256,length=markdown?report.markdown_byte_length:report.html_byte_length;
    let stored:Uint8Array|null=null;const omitted:string[]=[];
    try{stored=verifiedPublication(`${owner.session_id}/060_reports/${report.report_id}/${leaf}`,sha,length);}catch{omitted.push(`unavailable_or_damaged_report:${report.report_id}:${leaf}`);}
    let bytes:Uint8Array;
    if(report.state==='final'&&projection.revision?.integrity_state==='ok'&&stored)bytes=stored;
    else{
      let material:Awaited<ReturnType<DesktopDecisionCaseStore['readReportContext']>>|null=null;
      try{material=await committedReportMaterial(owner,projection,report.finding_id);}catch{omitted.push(`unavailable_or_damaged_run_material:${report.finding_id}`);}
      if(projection.revision?.integrity_state!=='ok')omitted.push('revision_integrity_blocked:referenced_sources_or_outputs_not_all_verified');
      // Stored HTML is never parsed/executed or mislabeled as Markdown.
      let verifiedText:string|null=null;try{const raw=verifiedPublication(`${owner.session_id}/060_reports/${report.report_id}/report.md`,report.markdown_sha256,report.markdown_byte_length);verifiedText=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{if(!omitted.some(x=>x.endsWith(':report.md')))omitted.push(`unavailable_or_damaged_report:${report.report_id}:report.md`);}
      bytes=desktopReportExportProjection(projection,report.report_id,value.format,verifiedText,material,omitted);
    }
    const prepared=Object.freeze({report_id:report.report_id,suggested_file_name:`xanthil-report-${report.report_id}.${markdown?'md':'html'}`,media_type:markdown?'text/markdown;charset=utf-8' as const:'text/html;charset=utf-8' as const,bytes,sha256:digest(bytes),byte_length:String(bytes.length)});
    preparedExports.set(prepared,{command_id:text(value.command_id),owner:JSON.stringify(ownerKeys.map(k=>owner[k])),report_id:report.report_id,sha256:prepared.sha256,byte_length:prepared.byte_length,media_type:prepared.media_type});
    return prepared;
  }

  async function recordReportExport(input:Parameters<DesktopDecisionCaseStore['recordReportExport']>[0]){
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command','prepared','descriptor','completed_at','input_fingerprint']),command=validateXanthilDesktopRequest('exportReport',value.command),descriptor=exactRecord(value.descriptor,['display_name','media_type','sha256','byte_length']);
    const format=descriptor.media_type==='text/markdown;charset=utf-8'?'markdown':descriptor.media_type==='text/html;charset=utf-8'?'html':null;
    if(!format||typeof descriptor.display_name!=='string'||!descriptor.display_name.endsWith(format==='markdown'?'.md':'.html')||/[/\\\u0000-\u001f]/.test(descriptor.display_name)||!/^[0-9a-f]{64}$/.test(String(descriptor.sha256))||!/^(0|[1-9][0-9]*)$/.test(String(descriptor.byte_length))||!isTimestamp(value.completed_at))failure('VALIDATION_FAILED');
    const fingerprint=analysisFingerprint('export_report',command,{descriptor});if(value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const receipt=(db:DatabaseSync)=>{const r=db.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);if(r&&(r.operation_kind!=='export_report'||r.result_kind!=='report_version'||r.result_id!==command.report_id||r.input_fingerprint!==fingerprint||!ownerKeys.every(k=>r[k]===command[k])))failure('COMMAND_CONFLICT');return r;};
    const result={status:'written' as const,report_id:command.report_id,file_name:descriptor.display_name,media_type:input.descriptor.media_type,sha256:text(descriptor.sha256),byte_length:text(descriptor.byte_length)};
    let db:DatabaseSync|undefined=openConnection(path,true),committing=false;
    try{
      if(receipt(db))return result;
      const prepared=preparedExports.get(input.prepared);
      if(!prepared||prepared.command_id!==command.command_id||prepared.owner!==JSON.stringify(ownerKeys.map(k=>command[k]))||prepared.report_id!==command.report_id||prepared.sha256!==descriptor.sha256||prepared.byte_length!==descriptor.byte_length||prepared.media_type!==descriptor.media_type||!(input.prepared.bytes instanceof Uint8Array)||digest(input.prepared.bytes)!==prepared.sha256||String(input.prepared.bytes.length)!==prepared.byte_length)failure('INTEGRITY_BLOCKED');
      db.exec('BEGIN IMMEDIATE');if(receipt(db)){db.exec('ROLLBACK');return result;}
      const session=db.prepare('SELECT current_revision_id FROM product_sessions WHERE project_id=? AND session_id=? AND case_id=?').get(command.project_id,command.session_id,command.case_id);if(session?.current_revision_id!==command.revision_id)failure('STALE_REVISION');
      if(!db.prepare('SELECT report_id FROM report_versions WHERE report_id=? AND project_id=? AND session_id=? AND case_id=? AND revision_id=?').get(command.report_id,...ownerKeys.map(k=>command[k])))failure('NOT_FOUND');
      db.prepare("INSERT INTO command_receipts VALUES(?,'export_report',?,?,?,?,?,'succeeded','report_version',?,NULL,?,'1.0')").run(command.command_id,...ownerKeys.map(k=>command[k]),fingerprint,command.report_id,text(value.completed_at));
      committing=true;db.exec('COMMIT');
    }catch(error){
      try{db?.exec('ROLLBACK');}catch{/* Native write and/or COMMIT may already have happened. */}db?.close();db=undefined;
      if(!committing){if(['COMMAND_CONFLICT','INTEGRITY_BLOCKED','STALE_REVISION','NOT_FOUND'].includes(String((error as{code?:string}).code)))throw error;nativeFailure(error,'PUBLICATION_FAILED');}
      let check:DatabaseSync|undefined;try{rawPreflight(path);check=new DatabaseSync(path,{readOnly:true});inspectReadOnly(check);if(!receipt(check))failure('PUBLICATION_FAILED');}catch(error){if((error as{code?:string}).code==='PUBLICATION_FAILED')throw error;resultPending=true;failure('RESULT_PENDING');}finally{check?.close();}
    }finally{db?.close();}
    return result;
  }

  async function readReportContext(input:unknown){
    const value=exactRecord(input,[...ownerKeys,'finding_id']),owner={project_id:text(value.project_id),session_id:text(value.session_id),case_id:text(value.case_id),revision_id:text(value.revision_id)};
    const projection=await readProjection(owner),finding=projection.findings.find(f=>f.finding_id===value.finding_id);if(!finding)failure('NOT_FOUND');if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    return committedReportMaterial(owner,projection,finding.finding_id);
  }
  async function committedReportMaterial(owner:{project_id:string;session_id:string;case_id:string;revision_id:string},projection:DesktopProjection,findingId:string){
    const finding=projection.findings.find(f=>f.finding_id===findingId);if(!finding)failure('NOT_FOUND');
    const bundle=await createLocalDesktopRunEvidenceStore({projectRoot}).readTerminalRun({run_id:finding.run_id}),manifest=bundle.manifest;
    if(manifest.schema_version!=='3.0')failure('FORBIDDEN');
    if(manifest.status!=='succeeded'||!ownerKeys.every(k=>manifest.product_context[k]===owner[k]))failure('INTEGRITY_BLOCKED');
    const decoded=(d:{path:string;sha256:string;byte_length:string})=>new TextDecoder('utf-8',{fatal:true}).decode(verifiedPublication(`${bundle.locator}/${d.path}`,d.sha256,d.byte_length));
    const primary=manifest.artifacts.find(a=>a.artifact_id==='primary-query'),python=manifest.artifacts.find(a=>a.artifact_id==='independent-verifier');
    if(primary?.path!=='assets/primary.sql'||python?.path!=='assets/verify.py')failure('INTEGRITY_BLOCKED');
    return {manifest,contract_text:decoded(manifest.confirmation.contract),binding_text:decoded(manifest.confirmation.binding),ir_text:decoded(manifest.confirmation.ir),primary_sql:decoded(primary),python_verifier:decoded(python)};
  }

  async function completeCase(input:Parameters<DesktopDecisionCaseStore['completeCase']>[0]):Promise<DesktopProjection>{
    if(resultPending)failure('RESULT_PENDING');const value=exactRecord(input,['command','ids','report','completed_at','input_fingerprint']),command=validateXanthilDesktopRequest('completeCase',value.command),ids=exactRecord(value.ids,['closure_id','report_id','operation_id']),report=exactRecord(value.report,['markdown_bytes','html_bytes','source','evidence_refs']);
    const fingerprint=analysisFingerprint('complete_case',command),owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id};
    if(!Object.values(ids).every(x=>UUID.test(String(x)))||!isTimestamp(value.completed_at)||value.input_fingerprint!==fingerprint||!(report.markdown_bytes instanceof Uint8Array)||!(report.html_bytes instanceof Uint8Array))failure('VALIDATION_FAILED');
    const probe=openConnection(path,true);try{const prior=probe.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(command.command_id);if(prior){if(prior.operation_kind!=='complete_case'||prior.input_fingerprint!==fingerprint||!ownerKeys.every(k=>prior[k]===command[k]))failure('COMMAND_CONFLICT');return await readProjection(owner);}}finally{probe.close();}
    const projection=await readProjection(owner),acceptance=projection.acceptances.find(a=>a.acceptance_id===command.acceptance_id),form=projection.forms.find(f=>f.form_id===command.form_id);
    if(projection.session?.current_revision_id!==owner.revision_id||projection.revision?.row_version!==command.expected_row_version)failure('STALE_REVISION');
    if(projection.revision.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');if(!acceptance||!form)failure('NOT_FOUND');
    if(form.disposition!=='saved'||projection.forms.at(-1)?.form_id!==form.form_id||projection.closures.some(c=>c.acceptance_id===acceptance.acceptance_id)||projection.runs.some(r=>r.status==='Running'))failure('FORBIDDEN');
    const material=await readReportContext({...owner,finding_id:acceptance.finding_id}),expected=desktopFinalReport(projection,command.acceptance_id,command.form_id,text(ids.closure_id),value.completed_at,material);
    if(digest(report.markdown_bytes)!==digest(expected.markdown_bytes)||digest(report.html_bytes)!==digest(expected.html_bytes)||canonicalDesktopJson(report.source)!==canonicalDesktopJson(expected.source)||canonicalDesktopJson(report.evidence_refs)!==canonicalDesktopJson(expected.evidence_refs))failure('VALIDATION_FAILED');
    const absent=(target:string)=>{try{lstatSync(target);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}failure('PUBLICATION_FAILED');};
    const staging=join(dirname(path),'staging'),stage=join(staging,text(ids.operation_id)),parent=join(projectRoot,owner.session_id,'060_reports'),target=join(parent,text(ids.report_id));
    fileIdentity(staging,true);fileIdentity(join(projectRoot,owner.session_id),true);fileIdentity(parent,true);absent(target);mkdirSync(stage,{mode:0o700});
    for(const [name,bytes]of [['report.md',report.markdown_bytes],['report.html',report.html_bytes]] as const){const fd=openSync(join(stage,name),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}
    syncDirectory(stage);syncDirectory(staging);absent(target);renameSync(stage,target);syncDirectory(parent);syncDirectory(staging);
    const markdown={locator:`${owner.session_id}/060_reports/${ids.report_id}/report.md`,sha256:digest(report.markdown_bytes),byte_length:String(report.markdown_bytes.length)},html={locator:`${owner.session_id}/060_reports/${ids.report_id}/report.html`,sha256:digest(report.html_bytes),byte_length:String(report.html_bytes.length)};
    return analysisTransaction(command,'complete_case',fingerprint,value.completed_at,text(ids.closure_id),(db,revision)=>{
      const accepted=db.prepare('SELECT * FROM finding_acceptances WHERE acceptance_id=?').get(command.acceptance_id),saved=db.prepare('SELECT * FROM decision_forms WHERE form_id=?').get(command.form_id),last=db.prepare('SELECT form_id FROM decision_forms WHERE revision_id=? ORDER BY form_sequence DESC LIMIT 1').get(command.revision_id);
      if(!accepted||!saved||!ownerKeys.every(k=>accepted[k]===command[k]&&saved[k]===command[k])||saved.disposition!=='saved'||last?.form_id!==saved.form_id||db.prepare('SELECT closure_id FROM decision_closures WHERE acceptance_id=?').get(command.acceptance_id))failure('FORBIDDEN');
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id))failure('BUSY');
      verifiedPublication(markdown.locator,markdown.sha256,markdown.byte_length);verifiedPublication(html.locator,html.sha256,html.byte_length);
      const sequence=db.prepare('SELECT max(version_sequence) n FROM report_versions WHERE revision_id=?');sequence.setReadBigInts(true);const next=BigInt(String(sequence.get(command.revision_id)?.n??0))+1n;if(next>9223372036854775807n)failure('VALIDATION_FAILED');
      db.prepare("INSERT INTO decision_closures VALUES(?,?,?,?,?,?,?,?,?,'1.0')").run(text(ids.closure_id),...ownerKeys.map(k=>command[k]),command.acceptance_id,command.form_id,text(saved.route),text(value.completed_at));
      db.prepare("INSERT INTO report_versions VALUES(?,?,?,?,?,?,?,?,?,'final',?,?,?,?,?,?,?,?,?,'1.0')").run(text(ids.report_id),...ownerKeys.map(k=>command[k]),text(accepted.finding_id),command.acceptance_id,text(ids.closure_id),next,markdown.locator,markdown.sha256,BigInt(markdown.byte_length),html.locator,html.sha256,BigInt(html.byte_length),canonicalDesktopJson(report.source),canonicalDesktopJson(report.evidence_refs),text(value.completed_at));
      db.prepare("UPDATE case_revisions SET state='Completed',current_finding_id=?,current_acceptance_id=?,current_closure_id=?,current_report_id=? WHERE revision_id=?").run(text(accepted.finding_id),command.acceptance_id,text(ids.closure_id),text(ids.report_id),command.revision_id);
    },'decision_closure');
  }

  async function saveReviewForm(input:unknown):Promise<DesktopProjection>{
    if(!record(input))failure('VALIDATION_FAILED');const candidate=validateXanthilDesktopRequest('saveForm',input.command),isDecision=candidate.form.kind==='decision_closure';
    const value=exactRecord(input,['command','completed_at','input_fingerprint',...(isDecision?['form_id']:[])]),command=candidate,form=command.form;
    if(form.kind==='case_fields')failure('VALIDATION_FAILED');
    if(form.kind==='decision_closure')validateDesktopDecisionForm(form);
    const fingerprint=analysisFingerprint('save_form',command);
    if(!isTimestamp(value.completed_at)||value.input_fingerprint!==fingerprint||isDecision&&!UUID.test(String(value.form_id)))failure('VALIDATION_FAILED');
    const owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id},projection=await readProjection(owner);
    if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    return analysisTransaction(command,'save_form',fingerprint,value.completed_at,isDecision?text(value.form_id):command.revision_id,(db,revision)=>{
      if(!['Review','Completed'].includes(String(revision.state)))failure('FORBIDDEN');
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id))failure('BUSY');
      if(form.kind==='evidence_explanation'){if(revision.state!=='Review')failure('FORBIDDEN');db.prepare('UPDATE case_revisions SET evidence_explanation_text=? WHERE revision_id=?').run(form.evidence_explanation_text,command.revision_id);return;}
      if(revision.state==='Completed'&&!db.prepare('SELECT a.acceptance_id FROM finding_acceptances a JOIN findings f ON f.finding_id=a.finding_id AND f.project_id=a.project_id AND f.session_id=a.session_id AND f.case_id=a.case_id AND f.revision_id=a.revision_id WHERE a.project_id=? AND a.session_id=? AND a.case_id=? AND a.revision_id=? AND NOT EXISTS(SELECT 1 FROM decision_closures c WHERE c.acceptance_id=a.acceptance_id)').get(...ownerKeys.map(k=>command[k])))failure('FORBIDDEN');
      const stmt=db.prepare('SELECT * FROM decision_forms WHERE revision_id=? ORDER BY form_sequence DESC LIMIT 1');stmt.setReadBigInts(true);const latest=stmt.get(command.revision_id),at=text(value.completed_at),dispositionAt=form.disposition==='draft'?null:at;
      const values=[canonicalDesktopJson(form.candidates),form.route,form.insufficient_reason,form.preferred_candidate_id,form.preferred_reason,form.disposition,dispositionAt,form.defer_until,at];
      if(latest?.disposition==='draft'){
        db.prepare('UPDATE decision_forms SET candidates_json=?,route=?,insufficient_reason=?,preferred_candidate_id=?,preferred_reason=?,disposition=?,disposition_at=?,defer_until=?,updated_at=? WHERE form_id=?').run(...values,text(latest.form_id));return text(latest.form_id);
      }
      const sequence=latest?BigInt(String(latest.form_sequence))+1n:1n;if(sequence>9223372036854775807n)failure('VALIDATION_FAILED');
      db.prepare("INSERT INTO decision_forms(form_id,project_id,session_id,case_id,revision_id,form_sequence,candidates_json,route,insufficient_reason,preferred_candidate_id,preferred_reason,disposition,disposition_at,defer_until,updated_at,created_at,schema_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'1.0')").run(text(value.form_id),...ownerKeys.map(k=>command[k]),sequence,...values,at);return text(value.form_id);
    },isDecision?'decision_form':'case_revision');
  }

  async function acceptFinding(input:unknown):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','acceptance_id','accepted_at','input_fingerprint']),command=validateXanthilDesktopRequest('acceptFinding',value.command),fingerprint=analysisFingerprint('accept_finding',command);
    if(!UUID.test(String(value.acceptance_id))||!isTimestamp(value.accepted_at)||value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const owner={project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id},projection=await readProjection(owner);
    if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    return analysisTransaction(command,'accept_finding',fingerprint,value.accepted_at,text(value.acceptance_id),(db,revision)=>{
      if(!db.prepare('SELECT finding_id FROM findings WHERE finding_id=? AND project_id=? AND session_id=? AND case_id=? AND revision_id=?').get(command.finding_id,...ownerKeys.map(k=>command[k])))failure('NOT_FOUND');
      if(db.prepare('SELECT r.run_contract_version FROM analysis_runs r JOIN findings f ON f.run_id=r.run_id WHERE f.finding_id=?').get(command.finding_id)?.run_contract_version!=='3.0')failure('FORBIDDEN');
      if(!['Review','Completed'].includes(String(revision.state))||db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)||db.prepare('SELECT acceptance_id FROM finding_acceptances WHERE finding_id=?').get(command.finding_id))failure('FORBIDDEN');
      db.prepare("INSERT INTO finding_acceptances VALUES(?,?,?,?,?,?,'accept',?,'1.0')").run(text(value.acceptance_id),command.finding_id,...ownerKeys.map(k=>command[k]),text(value.accepted_at));
      if(revision.state!=='Completed'){
        const report=db.prepare("SELECT report_id FROM report_versions WHERE finding_id=? AND state='draft'").get(command.finding_id);if(!report)failure('INTEGRITY_BLOCKED');
        db.prepare('UPDATE case_revisions SET current_acceptance_id=?,current_finding_id=?,current_report_id=? WHERE revision_id=?').run(text(value.acceptance_id),command.finding_id,text(report.report_id),command.revision_id);
      }
    },'finding_acceptance');
  }

  async function admitAnalysis(input:unknown):Promise<DesktopProjection> {
    const value=exactRecord(input,['command','ids','started_at','deadline_at','profile_id','method_id','method_version','code_identity','input_fingerprint']);
    const command=validatePlanStart(value.command), ids=exactRecord(value.ids,['run_id']);
    const fingerprint=analysisFingerprint('start_analysis',command);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(String(ids.run_id))||!isTimestamp(value.started_at)||!isTimestamp(value.deadline_at)||Date.parse(value.deadline_at)-Date.parse(value.started_at)!==Number(command.contract_version!=='1.0'?command.execution_plan.task_context?.run_ms??300000:300000)||value.profile_id!=='personal-desktop'||value.method_id!=='membership_repurchase_comparison'||value.method_version!=='1.0'||!/^[0-9a-f]{64}$/.test(String(value.code_identity))||value.input_fingerprint!==fingerprint) failure('VALIDATION_FAILED');
    return analysisTransaction(command,'start_analysis',fingerprint,value.started_at,text(ids.run_id),(db,revision)=>{
      assertTaskRunAdmission(db,command.contract_version!=='1.0'?command.execution_plan:undefined,command,text(value.started_at));
      if(!['Ready','NeedsAttention','Review','Completed'].includes(String(revision.state))||revision.confirmation_id!==command.confirmation_id) failure('FORBIDDEN');
      if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(command.revision_id)) failure('BUSY');
      if(db.prepare("SELECT attempt_id FROM assistance_attempts WHERE revision_id=? AND status='Running'").get(command.revision_id)) failure('BUSY');
      db.prepare("INSERT INTO analysis_runs(run_id,project_id,session_id,case_id,revision_id,confirmation_id,profile_id,method_id,method_version,code_identity,run_contract_version,status,started_at,deadline_at,ended_at,terminal_reason,run_locator,aggregate_id,schema_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,'Running',?,?,NULL,NULL,NULL,NULL,'1.0')").run(text(ids.run_id),...ownerKeys.map(k=>command[k]),command.confirmation_id,text(value.profile_id),text(value.method_id),text(value.method_version),text(value.code_identity),command.contract_version==='3.0'?'5.0':command.contract_version==='2.0'?'4.0':'3.0',text(value.started_at),text(value.deadline_at));
      if(command.contract_version!=='1.0')persistMembershipPlan(db,command.execution_plan,text(ids.run_id));
      if(command.contract_version==='3.0'){const plan=command.execution_plan;if(plan.version!=='2.0')failure('VALIDATION_FAILED');const usage=reserveMemberOperation(db,{task_id:plan.authority.task_id,grant_id:plan.authority.grant_id,kind:'analysis',stage:'calculate',input_sha256:taskHash({preparation_sha256:plan.preparation.sha256,contract_sha256:plan.contract_sha256,intent:plan.intent,methods:plan.methods,code_identity:value.code_identity})});if(usage.phase!=='reserved')failure('ANALYSIS_ALREADY_COMPLETED');issueMemberOperation(db,{task_id:usage.task_id,execution_id:usage.execution_id});db.prepare('INSERT INTO membership_analysis_operations VALUES(?,?,?)').run(text(ids.run_id),usage.execution_id,membershipHash(plan));}
      if(!['Review','Completed'].includes(String(revision.state)))db.prepare("UPDATE case_revisions SET state='Ready' WHERE revision_id=?").run(command.revision_id);
    });
  }

  const verifiedPublication=(locator:string,sha256:string,length:string)=>{
    if(locator.startsWith('/')||locator.split('/').some(x=>!x||x==='.'||x==='..'||x.includes('\\'))) failure('INTEGRITY_BLOCKED');
    let current=projectRoot;fileIdentity(current,true);const segments=locator.split('/');
    for(const segment of segments.slice(0,-1)){current=join(current,segment);fileIdentity(current,true);}
    const target=join(projectRoot,locator);fileIdentity(target);const fd=openSync(target,constants.O_RDONLY|constants.O_NOFOLLOW);
    try{const bytes=new Uint8Array(readFileSync(fd));if(digest(bytes)!==sha256||String(bytes.length)!==length)failure('INTEGRITY_BLOCKED');return bytes;}finally{closeSync(fd);}
  };
  async function publishAnalysisSuccessCandidates(input: DesktopAnalysisCandidates) {
    if(resultPending)failure('RESULT_PENDING');
    const value=exactRecord(input,[...ownerKeys,'expected_row_version','run_id','operation_id','aggregate','report']);
    const owner=Object.fromEntries(ownerKeys.map(k=>[k,text(value[k])])) as {project_id:string;session_id:string;case_id:string;revision_id:string};
    const projection=await readProjection(owner),run=projection.runs.find(x=>x.run_id===value.run_id);
    if(projection.revision?.integrity_state!=='ok')failure('INTEGRITY_BLOCKED');
    if(projection.revision.row_version!==value.expected_row_version)failure('STALE_REVISION');
    if(!run||run.status!=='Running')failure('FORBIDDEN');
    const aggregate=exactRecord(value.aggregate,['artifact_id','bytes','method_id','method_version','code_identity','columns','measurement_meanings','group_pseudonym_map']),report=exactRecord(value.report,['report_id','markdown_bytes','html_bytes','source','evidence_refs']);
    if(![value.operation_id,aggregate.artifact_id,report.report_id].every(x=>UUID.test(String(x)))||!(aggregate.bytes instanceof Uint8Array)||!(report.markdown_bytes instanceof Uint8Array)||!(report.html_bytes instanceof Uint8Array)||aggregate.method_id!==run.method_id||aggregate.method_version!==run.method_version||aggregate.code_identity!==run.code_identity)failure('VALIDATION_FAILED');
    const check=openConnection(path,true);let plan:MembershipPlan|undefined;try{plan=planForRun(check,run.run_id);assertTaskRunAdmission(check,plan,owner,new Date().toISOString(),run.run_id);}finally{check.close();}
    const parsed=exactRecord(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(aggregate.bytes)),['schema_version','artifact_id','run_id','product_context','method','result',...(plan?['plan_sha256']:[]),...(plan?.version==='2.0'?['preparation_sha256']:[])]);
    const result=analysisResult(parsed.result,plan);if(plan&&parsed.plan_sha256!==membershipHash(plan)||plan?.version==='2.0'&&parsed.preparation_sha256!==plan.preparation.sha256)failure('INTEGRITY_BLOCKED');
    const context={...owner,confirmation_id:projection.confirmation!.confirmation_id,snapshot_id:projection.snapshot!.snapshot_id};
    if(canonicalDesktopJson(parsed)!==new TextDecoder().decode(aggregate.bytes)||parsed.schema_version!==analysisArtifactVersion(plan)||parsed.artifact_id!==aggregate.artifact_id||parsed.run_id!==run.run_id||canonicalDesktopJson(parsed.product_context)!==canonicalDesktopJson(context)||canonicalDesktopJson(parsed.method)!==canonicalDesktopJson({id:run.method_id,version:run.method_version,code_identity:run.code_identity}))failure('VALIDATION_FAILED');
    if(projection.confirmation!.selected_group_mode==='none'?aggregate.group_pseudonym_map!==null:aggregate.group_pseudonym_map===null)failure('VALIDATION_FAILED');
    if(!Array.isArray(aggregate.columns)||aggregate.columns.some(x=>typeof x!=='string')||!record(aggregate.measurement_meanings)||Object.values(aggregate.measurement_meanings).some(x=>typeof x!=='string')||!record(report.source)||!Array.isArray(report.evidence_refs)||report.evidence_refs.some(x=>typeof x!=='string'))failure('VALIDATION_FAILED');
    if(aggregate.group_pseudonym_map!==null){if(!record(aggregate.group_pseudonym_map)||Object.values(aggregate.group_pseudonym_map).some(x=>!UUID.test(String(x)))||new Set(Object.values(aggregate.group_pseudonym_map)).size!==Object.keys(aggregate.group_pseudonym_map).length)failure('VALIDATION_FAILED');const expected=(result.m2 as {groups?:{group_id:string}[]}).groups?.map(x=>x.group_id)??[];if(expected.some(x=>!Object.values(aggregate.group_pseudonym_map as UnknownRecord).includes(x)))failure('VALIDATION_FAILED');}
    const absent=(target:string)=>{try{lstatSync(target);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}failure('PUBLICATION_FAILED');};
    const staging=join(dirname(path),'staging');fileIdentity(staging,true);const stage=join(staging,text(value.operation_id));mkdirSync(stage,{mode:0o700});
    const publish=(leaf:string,id:string,files:Readonly<Record<string,Uint8Array>>)=>{
      const parent=join(projectRoot,owner.session_id,leaf),target=join(parent,id),work=join(stage,leaf);fileIdentity(join(projectRoot,owner.session_id),true);fileIdentity(parent,true);absent(target);mkdirSync(work,{mode:0o700});
      for(const [name,bytes]of Object.entries(files)){const fd=openSync(join(work,name),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}
      syncDirectory(work);syncDirectory(stage);absent(target);renameSync(work,target);syncDirectory(parent);
      return Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,{locator:`${owner.session_id}/${leaf}/${id}/${name}`,sha256:digest(bytes),byte_length:String(bytes.length)}]));
    };
    const a=publish('020_clean',text(aggregate.artifact_id),{'aggregate.json':aggregate.bytes})['aggregate.json'];
    const r=publish('060_reports',text(report.report_id),{'report.md':report.markdown_bytes,'report.html':report.html_bytes});
    return {published:true as const,aggregatePublication:{artifact_id:text(aggregate.artifact_id),...a,columns:input.aggregate.columns,measurement_meanings:input.aggregate.measurement_meanings,group_pseudonym_map:input.aggregate.group_pseudonym_map},reportPublication:{report_id:text(report.report_id),markdown:r['report.md'],html:r['report.html'],source:input.report.source,evidence_refs:input.report.evidence_refs}};
  }

  async function settleAnalysis(input:DesktopAnalysisSettlement):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','run_id','terminal','completed_at','input_fingerprint',...(input.membership_meter?['membership_meter']:[])]);
    const command=exactRecord(value.command,['contract_version','command_id',...ownerKeys,'expected_row_version']);
    const runId=text(value.run_id), terminal=exactRecord(value.terminal, input.terminal.status==='succeeded'?['status','runBundle','aggregatePublication','finding','reportPublication']:['status','reason']);
    validateXanthilDesktopRequest('cancelAnalysis',{...command,run_id:runId});
    if(!isTimestamp(value.completed_at)||!['succeeded','failed','cancelled'].includes(String(terminal.status)))failure('VALIDATION_FAILED');
    const fingerprint=analysisFingerprint('settle_analysis',command,{run_id:runId,terminal,...(input.membership_meter?{membership_meter:input.membership_meter}:{})});if(value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const owner=Object.fromEntries(ownerKeys.map(k=>[k,text(command[k])])) as {project_id:string;session_id:string;case_id:string;revision_id:string};
    if(input.terminal.status==='succeeded'){
      const t=input.terminal, bundle=await createLocalDesktopRunEvidenceStore({projectRoot}).readTerminalRun({run_id:runId});
      if(canonicalDesktopJson(t.runBundle)!==canonicalDesktopJson(bundle)||bundle.manifest.status!=='succeeded'||bundle.manifest.ended_at!==value.completed_at||!ownerKeys.every(k=>bundle.manifest.product_context[k]===owner[k]))failure('INTEGRITY_BLOCKED');
      const findingPlan=planOf(bundle.manifest);exactRecord(t.finding,['finding_id','judgment','metrics','supporting_evidence','refutation','limitations','evidence_refs',...(findingPlan?.version==='2.0'?['facts']:[])]);if(findingPlan?.version==='2.0'&&canonicalDesktopJson(t.finding.facts)!==canonicalDesktopJson(membershipFindingFacts(t.finding.metrics,findingPlan)))failure('INTEGRITY_BLOCKED');
      const aggregate=t.aggregatePublication, report=t.reportPublication;
      const a=verifiedPublication(aggregate.locator,aggregate.sha256,aggregate.byte_length);
      verifiedPublication(report.markdown.locator,report.markdown.sha256,report.markdown.byte_length);verifiedPublication(report.html.locator,report.html.sha256,report.html.byte_length);
      const parsed=JSON.parse(new TextDecoder().decode(a));
      if(aggregate.locator!==`${owner.session_id}/020_clean/${aggregate.artifact_id}/aggregate.json`||report.markdown.locator!==`${owner.session_id}/060_reports/${report.report_id}/report.md`||report.html.locator!==`${owner.session_id}/060_reports/${report.report_id}/report.html`||canonicalDesktopJson(parsed.result)!==canonicalDesktopJson(t.finding.metrics)||t.finding.judgment!==analysisJudgment(t.finding.metrics,planOf(bundle.manifest))||!UUID.test(t.finding.finding_id))failure('VALIDATION_FAILED');
      const evidenceBytes=verifiedPublication(`${bundle.locator}/evidence.json`,bundle.manifest.evidence!.sha256,bundle.manifest.evidence!.byte_length);
      const evidence=validateAnalysisEvidence(JSON.parse(new TextDecoder().decode(evidenceBytes)),bundle.manifest,t.finding.metrics);
      const candidate=exactRecord(evidence.candidate_publications,['aggregate','report']);
      if(canonicalDesktopJson(candidate.aggregate)!==canonicalDesktopJson({artifact_id:aggregate.artifact_id,locator:aggregate.locator,sha256:aggregate.sha256,byte_length:aggregate.byte_length})||canonicalDesktopJson(candidate.report)!==canonicalDesktopJson({report_id:report.report_id,markdown:report.markdown,html:report.html}))failure('INTEGRITY_BLOCKED');
    }
    const settleMeter=(db:DatabaseSync,preparedPlan:Extract<MembershipPlan,{version:'2.0'}>)=>{
      const meter=exactRecord(input.membership_meter,['version','run_id','plan_sha256','physical','usage']),link=db.prepare('SELECT * FROM membership_analysis_operations WHERE run_id=?').get(runId);
      if(!link||meter.version!=='1.0'||meter.run_id!==runId||meter.plan_sha256!==membershipHash(preparedPlan)||link.plan_sha256!==meter.plan_sha256||!['settled','unresolved'].includes(String(meter.physical)))failure('INTEGRITY_BLOCKED');
      if(input.terminal.status==='succeeded'&&meter.physical!=='settled')failure('PHYSICAL_PENDING');
      settleMemberOperation(db,{task_id:preparedPlan.authority.task_id,execution_id:link.execution_id,physical:meter.physical,outcome:input.terminal.status==='succeeded'?'succeeded':input.terminal.status==='cancelled'?'stopped':'permanent_failure',usage:meter.usage});
    };
    // Cancellation/reconciliation already owns the sole product terminal receipt.
    // A late trusted process outcome may only settle its exact linked operation.
    if(input.membership_meter&&input.terminal.status!=='succeeded'){
      if(resultPending)failure('RESULT_PENDING');
      const db=openConnection(path,true);let committed=false,late=false;
      try{
        db.exec('BEGIN IMMEDIATE');
        const run=db.prepare('SELECT * FROM analysis_runs WHERE run_id=?').get(runId);
        if(!run||!ownerKeys.every(k=>run[k]===owner[k]))failure('NOT_FOUND');
        if(run.status!=='Running'){
          const preparedPlan=planForRun(db,runId);
          if(preparedPlan?.version!=='2.0'||!['Cancelled','Failed'].includes(text(run.status)))failure('FORBIDDEN');
          if((run.status==='Cancelled')!==(input.terminal.status==='cancelled')||text(value.completed_at)<text(run.ended_at))failure('VALIDATION_FAILED');
          const revision=db.prepare('SELECT row_version FROM case_revisions WHERE revision_id=?').get(owner.revision_id);
          if(String(revision?.row_version)!==command.expected_row_version)failure('STALE_REVISION');
          settleMeter(db,preparedPlan);inspectReadOnly(db);late=true;
          committed=true;db.exec('COMMIT');
        }else db.exec('ROLLBACK');
      }catch(error){try{db.exec('ROLLBACK');}catch{}if(committed){resultPending=true;failure('RESULT_PENDING');}throw error;}finally{db.close();}
      if(late)return readProjection(owner);
    }
    return analysisTransaction(command,'settle_analysis',fingerprint,value.completed_at,runId,(db,revision)=>{
      const run=db.prepare('SELECT * FROM analysis_runs WHERE run_id=?').get(runId);if(!run||!ownerKeys.every(k=>run[k]===owner[k]))failure('NOT_FOUND');if(text(value.completed_at)<text(run.started_at))failure('VALIDATION_FAILED');
      const preparedPlan=planForRun(db,runId);if(run.status!=='Running')failure('FORBIDDEN');
      if(preparedPlan?.version==='2.0')settleMeter(db,preparedPlan);else if(input.membership_meter)failure('FORBIDDEN');
      if(input.terminal.status==='succeeded'){
        assertTaskRunAdmission(db,planForRun(db,runId),owner,text(value.completed_at),runId);
        const t=input.terminal,a=t.aggregatePublication,r=t.reportPublication,f=t.finding;
        if(text(value.completed_at)>=text(run.deadline_at))failure('DEADLINE_EXCEEDED');
        db.prepare("INSERT INTO aggregate_artifacts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'1.0')").run(a.artifact_id,...ownerKeys.map(k=>owner[k]),text(revision.snapshot_id),runId,text(run.method_id),text(run.method_version),text(run.code_identity),canonicalDesktopJson(a.columns),canonicalDesktopJson(a.measurement_meanings),a.group_pseudonym_map===null?null:canonicalDesktopJson(a.group_pseudonym_map),a.locator,a.sha256,BigInt(a.byte_length),text(value.completed_at));
        const findingColumns=['finding_id','run_id',...ownerKeys,'aggregate_id','judgment','metrics_json','supporting_evidence_json','refutation_json','limitations_json','evidence_refs_json','method_id','method_version','created_at','schema_version'],findingValues=[f.finding_id,runId,...ownerKeys.map(k=>owner[k]),a.artifact_id,f.judgment,canonicalDesktopJson(f.metrics),canonicalDesktopJson(f.supporting_evidence),canonicalDesktopJson(f.refutation),canonicalDesktopJson(f.limitations),canonicalDesktopJson(f.evidence_refs),text(run.method_id),text(run.method_version),text(value.completed_at),f.facts?'2.0':'1.0'];
        if(f.facts){findingColumns.push('facts_json','facts_sha256');findingValues.push(canonicalDesktopJson(f.facts),membershipHash(f.facts));}db.prepare(`INSERT INTO findings(${findingColumns.join(',')}) VALUES(${findingColumns.map(()=>'?').join(',')})`).run(...findingValues);
        const sequenceQuery=db.prepare('SELECT max(version_sequence) n FROM report_versions WHERE revision_id=?');sequenceQuery.setReadBigInts(true);const sequence=BigInt(String(sequenceQuery.get(text(command.revision_id))?.n??0))+1n;if(sequence>9223372036854775807n)failure('VALIDATION_FAILED');
        db.prepare("INSERT INTO report_versions VALUES(?,?,?,?,?,?,NULL,NULL,?,'draft',?,?,?,?,?,?,?,?,?,'1.0')").run(r.report_id,...ownerKeys.map(k=>owner[k]),f.finding_id,sequence,r.markdown.locator,r.markdown.sha256,BigInt(r.markdown.byte_length),r.html.locator,r.html.sha256,BigInt(r.html.byte_length),canonicalDesktopJson(r.source),canonicalDesktopJson(r.evidence_refs),text(value.completed_at));
        db.prepare("UPDATE analysis_runs SET status='Succeeded',ended_at=?,run_locator=?,aggregate_id=? WHERE run_id=?").run(text(value.completed_at),t.runBundle.locator,a.artifact_id,runId);
        if(revision.current_acceptance_id===null&&revision.state!=='Completed')db.prepare("UPDATE case_revisions SET state='Review',current_finding_id=?,current_report_id=? WHERE revision_id=?").run(f.finding_id,r.report_id,owner.revision_id);
      }else{
        const t=input.terminal;if(!['source_changed','toolchain_unavailable','calculation_failed','validation_mismatch','run_artifact_failed','publication_failed','deadline_exceeded','interrupted','integrity_blocked','user_cancelled'].includes(t.reason)||t.status==='failed'&&t.reason==='user_cancelled'||t.status==='cancelled'&&t.reason!=='user_cancelled')failure('VALIDATION_FAILED');
        db.prepare('UPDATE analysis_runs SET status=?,ended_at=?,terminal_reason=? WHERE run_id=?').run(t.status==='failed'?'Failed':'Cancelled',text(value.completed_at),t.reason,runId);if(revision.current_finding_id===null)db.prepare("UPDATE case_revisions SET state='NeedsAttention' WHERE revision_id=?").run(owner.revision_id);
      }
    });
  }

  async function requestAnalysisCancellation(input:unknown):Promise<DesktopProjection>{
    const value=exactRecord(input,['command','completed_at','input_fingerprint']),command=validateXanthilDesktopRequest('cancelAnalysis',value.command);
    const fingerprint=analysisFingerprint('cancel_analysis',command);
    if(!isTimestamp(value.completed_at)||value.input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    return analysisTransaction(command,'cancel_analysis',fingerprint,value.completed_at,command.run_id,(db,revision)=>{
      const run=db.prepare('SELECT * FROM analysis_runs WHERE run_id=?').get(command.run_id);
      if(!run||!ownerKeys.every(k=>run[k]===command[k]))failure('NOT_FOUND');
      if(run.status!=='Running')failure('FORBIDDEN');if(value.completed_at!<text(run.started_at))failure('VALIDATION_FAILED');
      db.prepare("UPDATE analysis_runs SET status='Cancelled',ended_at=?,terminal_reason='user_cancelled' WHERE run_id=?").run(text(value.completed_at),command.run_id);
      if(revision.current_finding_id===null)db.prepare("UPDATE case_revisions SET state='NeedsAttention' WHERE revision_id=?").run(command.revision_id);
    });
  }

  async function reconcileInterrupted(input:unknown):Promise<DesktopProjection>{
    const value=exactRecord(input,['command_id',...ownerKeys,'target_kind','target_id','completed_at','input_fingerprint']);
    if(!['analysis_run','assistance_attempt'].includes(String(value.target_kind))||!isTimestamp(value.completed_at)||![value.command_id,...ownerKeys.map(k=>value[k])].every(x=>UUID.test(String(x))))failure('VALIDATION_FAILED');
    const {completed_at,input_fingerprint,...request}=value,fingerprint=analysisFingerprint('reconcile_interrupted',request);
    if(input_fingerprint!==fingerprint)failure('VALIDATION_FAILED');
    const owner=Object.fromEntries(ownerKeys.map(k=>[k,text(value[k])])) as {project_id:string;session_id:string;case_id:string;revision_id:string};
    const current=await readProjection(owner),target=value.target_kind==='analysis_run'?current.runs.find(x=>x.run_id===value.target_id):current.attempts.find(x=>x.attempt_id===value.target_id);if(!target)failure('NOT_FOUND');
    if(target.status!=='Running')return current;
    const command={contract_version:'1.0',command_id:value.command_id,...owner,expected_row_version:current.revision!.row_version};
    return analysisTransaction(command,'reconcile_interrupted',fingerprint,text(completed_at),text(value.target_id),(db,revision)=>{
      const table=value.target_kind==='analysis_run'?'analysis_runs':'assistance_attempts',id=value.target_kind==='analysis_run'?'run_id':'attempt_id';
      const actual=db.prepare(`SELECT status,started_at FROM ${table} WHERE ${id}=?`).get(text(value.target_id));if(actual?.status!=='Running')failure('FORBIDDEN');
      if(text(completed_at)<text(actual.started_at))failure('VALIDATION_FAILED');
      db.prepare(`UPDATE ${table} SET status='Failed',ended_at=?,terminal_reason='interrupted' WHERE ${id}=?`).run(text(completed_at),text(value.target_id));
      if(value.target_kind==='analysis_run'&&revision.current_finding_id===null)db.prepare("UPDATE case_revisions SET state='NeedsAttention' WHERE revision_id=?").run(owner.revision_id);
    },text(value.target_kind));
  }

  async function readProjection(input: unknown): Promise<DesktopProjection> {
    const owner = exactRecord(input, ['project_id', 'session_id', 'case_id', 'revision_id']);
    const projectId = text(owner.project_id);
    const sessionId = text(owner.session_id);
    const caseId = text(owner.case_id);
    const revisionId = text(owner.revision_id);
    if (!existsSync(path)) failure('NOT_FOUND');
    const db = pureReadback ? openReadbackConnection(path) : openConnection(path, true);
    try {
      assertExistingIdentity(db);
      const project = db.prepare('SELECT project_id FROM projects WHERE project_id = ?').get(projectId);
      if (project === undefined) failure('NOT_FOUND');
      const session = db.prepare('SELECT * FROM product_sessions WHERE project_id = ? AND session_id = ? AND case_id = ?').get(projectId, sessionId, caseId);
      if (session === undefined) failure('NOT_FOUND');
      const currentRevision = session.current_revision_id === revisionId;
      let damaged = false, directoryDamaged = false;
      for (const directory of [join(projectRoot, sessionId), ...['010_draw', '020_clean', '060_reports'].map(leaf => join(projectRoot, sessionId, leaf))]) {
        try { fileIdentity(directory, true); } catch { damaged = true; directoryDamaged = true; }
      }
      const revisionQuery = db.prepare('SELECT * FROM case_revisions WHERE project_id=? AND session_id=? AND case_id=? AND revision_id = ?'); revisionQuery.setReadBigInts(true);
      const revision = revisionQuery.get(projectId,sessionId,caseId,revisionId);
      if (!revision) failure('NOT_FOUND');
      const confirmationRow = revision.confirmation_id === null ? undefined : db.prepare('SELECT * FROM input_confirmations WHERE confirmation_id=?').get(text(revision.confirmation_id));
      const snapshotQuery = db.prepare('SELECT * FROM source_snapshots WHERE snapshot_id=?'); snapshotQuery.setReadBigInts(true);
      const snapshotRow = revision.snapshot_id === null ? undefined : snapshotQuery.get(text(revision.snapshot_id));
      if (snapshotRow) {
        try {
          const root = join(projectRoot, sessionId, '010_draw', text(snapshotRow.snapshot_id));
          fileIdentity(join(projectRoot, sessionId, '010_draw'), true); fileIdentity(root, true);
          for (const role of ['members','orders']) {
            const destination = join(root, `${role}.csv`); fileIdentity(destination);
            const fd = openSync(destination, constants.O_RDONLY | constants.O_NOFOLLOW);
            try { const bytes = readFileSync(fd); if (BigInt(bytes.length) !== snapshotRow[`${role}_byte_length`] || digest(bytes) !== snapshotRow[`${role}_sha256`]) failure('INTEGRITY_BLOCKED'); }
            finally { closeSync(fd); }
          }
        } catch { damaged = true; }
      }
      const projectRow = db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectId)!;
      const receipt = db.prepare("SELECT command_id FROM command_receipts WHERE operation_kind<>'export_report' AND project_id=? AND session_id=? AND case_id=? AND (revision_id=? OR (operation_kind='create_draft_revision' AND result_id=?)) ORDER BY rowid DESC LIMIT 1").get(projectId, sessionId, caseId, revisionId,revisionId)!;
      const queryRows=(table:string)=>{const statement=db.prepare(`SELECT * FROM ${table} WHERE revision_id=? ORDER BY rowid`);statement.setReadBigInts(true);return statement.all(revisionId);};
      const runRows=queryRows('analysis_runs'),findingRows=queryRows('findings'),reportRows=queryRows('report_versions');
      const readableRuns=new Map<string,{manifest:AnalysisRunManifest;locator:string}>();
      const reportContents=new Map<string,NonNullable<DesktopProjection['reports'][number]['review_content']>>();
      for(const run of runRows.filter(x=>x.status==='Succeeded')) {
        try{
          const bundle=await createDesktopRunEvidenceStore({projectRoot},pureReadback).readTerminalRun({run_id:run.run_id});
          if(bundle.manifest.status!=='succeeded'||bundle.locator!==run.run_locator||bundle.manifest.ended_at!==run.ended_at)failure('INTEGRITY_BLOCKED');
          const a=db.prepare('SELECT * FROM aggregate_artifacts WHERE artifact_id=?').get(text(run.aggregate_id))!;
          verifiedPublication(text(a.locator),text(a.sha256),String(a.byte_length));
          readableRuns.set(text(run.run_id),bundle);
        }catch{damaged=true;}
      }
      for(const report of reportRows)try{
        const markdown=verifiedPublication(text(report.markdown_locator),text(report.markdown_sha256),String(report.markdown_byte_length));
        verifiedPublication(text(report.html_locator),text(report.html_sha256),String(report.html_byte_length));
        const finding=findingRows.find(f=>f.finding_id===report.finding_id),run=finding&&readableRuns.get(text(finding.run_id));
        if(!finding||!run)failure('INTEGRITY_BLOCKED');
        const evidence=(['duckdb-result','python-result','run-summary','run-evidence'] as const).map(artifactId=>{
          const descriptor=run.manifest.artifacts.find(x=>x.artifact_id===artifactId);if(!descriptor)failure('INTEGRITY_BLOCKED');
          const bytes=verifiedPublication(`${run.locator}/${descriptor.path}`,descriptor.sha256,descriptor.byte_length);
          return {evidence_ref:`${finding.run_id}:${artifactId}`,title:({'duckdb-result':'DuckDB 主计算','python-result':'Python 独立复算','run-summary':'Run 摘要','run-evidence':'Run 证据'})[artifactId],media_type:artifactId==='duckdb-result'||artifactId==='python-result'?'application/json' as const:'text/plain' as const,content:new TextDecoder('utf-8',{fatal:true}).decode(bytes)};
        });
        reportContents.set(text(report.report_id),{markdown_text:new TextDecoder('utf-8',{fatal:true}).decode(markdown),evidence});
      }catch{damaged=true;}
      const attemptRows=queryRows('assistance_attempts'),workRunning=runRows.some(r=>r.status==='Running')||attemptRows.some(a=>a.status==='Running');
      // Affordances are structural, not a Runtime-readiness claim; commands recheck admission.
      const taskOwned=explicitMembershipTask(db,caseId);
      const assistanceEligible=!taskOwned&&currentRevision&&!damaged&&revision.integrity_state==='ok'&&(['Draft','Ready'].includes(String(revision.state))&&findingRows.length===0||revision.state==='Review');
      return Object.freeze<DesktopProjection>({ contract_version: '1.0', projection_token: `${projectId}:${revisionId}:${revision.row_version}:${receipt.command_id}`,
        project: { project_id: projectId, display_name: text(projectRow.display_name), schema_version: '1.0', write_state: 'ready' },
        session: { session_id: sessionId, project_id: projectId, display_name: text(session.display_name), mode: 'professional', case_id: caseId, current_revision_id: text(session.current_revision_id), created_at: text(session.created_at) },
        revision: { revision_id: revisionId, revision_sequence: String(revision.revision_sequence), state: text(revision.state), case_name: text(revision.case_name), question_text: text(revision.question_text), hypothesis_display_title: text(revision.hypothesis_display_title), business_context: text(revision.business_context), alternative_explanations: JSON.parse(text(revision.alternative_explanations_json)), evidence_explanation_text: text(revision.evidence_explanation_text), previous_revision_id: revision.previous_revision_id===null?null:text(revision.previous_revision_id), snapshot_id: revision.snapshot_id === null ? null : text(revision.snapshot_id), confirmation_id: revision.confirmation_id === null ? null : text(revision.confirmation_id), current_finding_id: revision.current_finding_id===null?null:text(revision.current_finding_id), current_acceptance_id: revision.current_acceptance_id===null?null:text(revision.current_acceptance_id), current_closure_id: revision.current_closure_id===null?null:text(revision.current_closure_id), current_report_id: revision.current_report_id===null?null:text(revision.current_report_id), integrity_state: damaged ? 'integrity_blocked' : text(revision.integrity_state), created_at: text(revision.created_at), updated_at: text(revision.updated_at), row_version: String(revision.row_version) },
        confirmation: confirmationRow ? (() => { const { authority_confirmed, issues_confirmed, plan_confirmed, ...choice } = confirmationChoice(confirmationRow); void authority_confirmed; void issues_confirmed; void plan_confirmed; return { confirmation_id: text(confirmationRow.confirmation_id), snapshot_id: text(confirmationRow.snapshot_id), ...choice, authority_confirmed_at: text(confirmationRow.authority_confirmed_at), issues_confirmed_at: text(confirmationRow.issues_confirmed_at), plan_confirmed_at: text(confirmationRow.plan_confirmed_at) }; })() : null,
        snapshot: snapshotRow ? { snapshot_id: text(snapshotRow.snapshot_id), members: { display_name: text(snapshotRow.members_display_name), sha256: text(snapshotRow.members_sha256), byte_length: String(snapshotRow.members_byte_length) }, orders: { display_name: text(snapshotRow.orders_display_name), sha256: text(snapshotRow.orders_sha256), byte_length: String(snapshotRow.orders_byte_length) }, included_member_count: String(snapshotRow.included_member_count), excluded_member_count: String(snapshotRow.excluded_member_count), included_order_count: String(snapshotRow.included_order_count), excluded_order_count: String(snapshotRow.excluded_order_count), treatment_basis: text(snapshotRow.treatment_basis_json), confirmed_at: text(snapshotRow.confirmed_at) } : null,
        runs:runRows.map(r=>({run_id:text(r.run_id),profile_id:text(r.profile_id),method_id:text(r.method_id),method_version:text(r.method_version),code_identity:text(r.code_identity),run_contract_version:text(r.run_contract_version),status:text(r.status),started_at:text(r.started_at),deadline_at:text(r.deadline_at),ended_at:r.ended_at===null?null:text(r.ended_at),terminal_reason:r.terminal_reason===null?null:text(r.terminal_reason),aggregate_id:r.aggregate_id===null?null:text(r.aggregate_id),evidence_available:!damaged&&r.status==='Succeeded'})),
        disclosures:queryRows('model_disclosures').map(r=>({disclosure_id:text(r.disclosure_id),action_kind:text(r.action_kind),categories:JSON.parse(text(r.categories_json)),aggregate_refs:JSON.parse(text(r.aggregate_refs_json)),payload_sha256:text(r.payload_sha256),requested_provider:text(r.requested_provider),requested_model:text(r.requested_model),decision:text(r.decision),free_text_confirmed_at:r.free_text_confirmed_at===null?null:text(r.free_text_confirmed_at),decided_at:text(r.decided_at),created_at:text(r.created_at)})), attempts:queryRows('assistance_attempts').map(r=>({attempt_id:text(r.attempt_id),disclosure_id:text(r.disclosure_id),action_kind:text(r.action_kind),profile_id:text(r.profile_id),runtime_id:text(r.runtime_id),runtime_version:text(r.runtime_version),adapter_id:text(r.adapter_id),adapter_version:text(r.adapter_version),requested_provider:text(r.requested_provider),requested_model:text(r.requested_model),actual_provider:r.actual_provider===null?null:text(r.actual_provider),actual_model:r.actual_model===null?null:text(r.actual_model),status:text(r.status),started_at:text(r.started_at),deadline_at:text(r.deadline_at),ended_at:r.ended_at===null?null:text(r.ended_at),terminal_reason:r.terminal_reason===null?null:text(r.terminal_reason),draft_id:r.draft_id===null?null:text(r.draft_id)})),
        assistance_drafts:queryRows('assistance_drafts').map(r=>({draft_id:text(r.draft_id),attempt_id:text(r.attempt_id),draft_kind:text(r.draft_kind),generated_content:JSON.parse(text(r.generated_content_json)),edited_content:r.edited_content_json===null?null:JSON.parse(text(r.edited_content_json)),disposition:text(r.disposition),target_form:r.target_form===null?null:text(r.target_form),decided_at:r.decided_at===null?null:text(r.decided_at),created_at:text(r.created_at)})),
        findings:findingRows.map(f=>({finding_id:text(f.finding_id),run_id:text(f.run_id),aggregate_id:text(f.aggregate_id),...(f.schema_version==='2.0'?{facts:JSON.parse(text(f.facts_json))}:{}),judgment:text(f.judgment),metrics:text(f.metrics_json),supporting_evidence:JSON.parse(text(f.supporting_evidence_json)),refutation:JSON.parse(text(f.refutation_json)),limitations:JSON.parse(text(f.limitations_json)),evidence_refs:JSON.parse(text(f.evidence_refs_json)),method_id:text(f.method_id),method_version:text(f.method_version),created_at:text(f.created_at)})),acceptances: queryRows('finding_acceptances').map(a=>({acceptance_id:text(a.acceptance_id),finding_id:text(a.finding_id),action:text(a.action),accepted_at:text(a.accepted_at)})), forms: queryRows('decision_forms').map(f=>({form_id:text(f.form_id),form_sequence:String(f.form_sequence),candidates:JSON.parse(text(f.candidates_json)),route:f.route as null|'candidate_comparison'|'insufficient_evidence',insufficient_reason:f.insufficient_reason===null?null:text(f.insufficient_reason),preferred_candidate_id:f.preferred_candidate_id===null?null:text(f.preferred_candidate_id),preferred_reason:f.preferred_reason===null?null:text(f.preferred_reason),disposition:text(f.disposition),disposition_at:f.disposition_at===null?null:text(f.disposition_at),defer_until:f.defer_until===null?null:text(f.defer_until),created_at:text(f.created_at),updated_at:text(f.updated_at)})), closures: queryRows('decision_closures').map(c=>({closure_id:text(c.closure_id),acceptance_id:text(c.acceptance_id),form_id:text(c.form_id),route:text(c.route),completed_at:text(c.completed_at)})),
        reports:reportRows.map(r=>({report_id:text(r.report_id),finding_id:text(r.finding_id),acceptance_id:r.acceptance_id===null?null:text(r.acceptance_id),closure_id:r.closure_id===null?null:text(r.closure_id),version_sequence:String(r.version_sequence),state:text(r.state),markdown_sha256:text(r.markdown_sha256),markdown_byte_length:String(r.markdown_byte_length),html_sha256:text(r.html_sha256),html_byte_length:String(r.html_byte_length),source:text(r.source_json),evidence_refs:JSON.parse(text(r.evidence_refs_json)),created_at:text(r.created_at),review_content:reportContents.get(text(r.report_id))??null})),
        capabilities: { can_create_draft_revision: !taskOwned&&currentRevision && !directoryDamaged&&!workRunning, can_select_import: !taskOwned&&currentRevision && !damaged && revision.integrity_state === 'ok' && revision.state === 'Draft' && !workRunning, can_confirm_revision: !taskOwned&&currentRevision && !damaged && revision.integrity_state === 'ok' && revision.state === 'Draft' && !workRunning, can_start_analysis: !taskOwned&&currentRevision && !damaged&&revision.integrity_state==='ok'&&['Ready','NeedsAttention','Review','Completed'].includes(String(revision.state))&&!workRunning, can_cancel_analysis: currentRevision && !damaged&&revision.integrity_state==='ok'&&runRows.some(r=>r.status==='Running'), can_prepare_assistance: assistanceEligible && !workRunning, can_start_assistance: assistanceEligible && !workRunning && queryRows('model_disclosures').some(d=>d.decision==='accepted'&&!attemptRows.some(a=>a.disclosure_id===d.disclosure_id)), can_cancel_assistance: currentRevision && !damaged && revision.integrity_state==='ok' && attemptRows.some(a=>a.status==='Running'), can_dispose_assistance_draft: assistanceEligible && !workRunning && queryRows('assistance_drafts').some(d=>d.disposition==='pending'), can_accept_finding: currentRevision&&!damaged&&revision.integrity_state==='ok'&&['Review','Completed'].includes(String(revision.state))&&!workRunning&&findingRows.some(f=>runRows.find(r=>r.run_id===f.run_id)?.run_contract_version==='3.0'&&!queryRows('finding_acceptances').some(a=>a.finding_id===f.finding_id)), can_save_case_fields: !taskOwned&&currentRevision && !damaged && revision.integrity_state === 'ok'&&['Draft','Ready'].includes(String(revision.state))&&!workRunning, can_save_evidence_explanation: !taskOwned&&currentRevision&&!damaged&&revision.integrity_state==='ok'&&revision.state==='Review'&&!workRunning, can_save_decision_closure: !taskOwned&&currentRevision&&!damaged&&revision.integrity_state==='ok'&&(revision.state==='Review'||revision.state==='Completed'&&queryRows('finding_acceptances').some(a=>!queryRows('decision_closures').some(c=>c.acceptance_id===a.acceptance_id)))&&!workRunning, can_complete_case: !taskOwned&&currentRevision&&!damaged&&revision.integrity_state==='ok'&&!workRunning&&queryRows('decision_forms').at(-1)?.disposition==='saved'&&queryRows('finding_acceptances').some(a=>!queryRows('decision_closures').some(c=>c.acceptance_id===a.acceptance_id)), can_export_report: currentRevision&&!directoryDamaged&&reportRows.length>0 },
      });
    } finally { db.close(); }
  }

  async function markIntegrityBlocked(input: unknown): Promise<Record<string, unknown>> {
    if (resultPending) failure('RESULT_PENDING');
    const command = exactRecord(input, ['command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'reason_code', 'completed_at', 'input_fingerprint']);
    const owner = { project_id: text(command.project_id), session_id: text(command.session_id), case_id: text(command.case_id), revision_id: text(command.revision_id) };
    const request = { ...owner, expected_row_version: command.expected_row_version, reason_code: command.reason_code };
    const expected = createHash('sha256').update(JSON.stringify({ operation_kind: 'mark_integrity_blocked', request })).digest('hex');
    if (![command.command_id, ...Object.values(owner)].every(id => typeof id === 'string' && UUID.test(id)) || !/^[1-9][0-9]*$/.test(String(command.expected_row_version)) || command.reason_code !== 'INTEGRITY_BLOCKED' || !isTimestamp(command.completed_at) || command.input_fingerprint !== expected) failure('VALIDATION_FAILED');
    const projection = await readProjection(owner);
    if (projection.session?.current_revision_id !== owner.revision_id) failure('STALE_REVISION');
    if (projection.revision?.integrity_state !== 'integrity_blocked') failure('VALIDATION_FAILED');
    let db: DatabaseSync | undefined = openConnection(path, true);
    let committing = false;
    try {
      db.exec('BEGIN IMMEDIATE');
      const statement = db.prepare('SELECT row_version, integrity_state FROM case_revisions WHERE revision_id = ?'); statement.setReadBigInts(true);
      const row = statement.get(owner.revision_id);
      if (row?.integrity_state === 'integrity_blocked') { db.exec('ROLLBACK'); db.close(); db = undefined; return projection; }
      if (!row || String(row.row_version) !== command.expected_row_version) failure('ROW_VERSION_CONFLICT');
      if (row.row_version === 9223372036854775807n) failure('VALIDATION_FAILED');
      db.prepare("UPDATE case_revisions SET integrity_state='integrity_blocked', row_version=row_version+1, updated_at=? WHERE revision_id=?").run(command.completed_at, owner.revision_id);
      db.prepare("INSERT INTO command_receipts(command_id, operation_kind, project_id, session_id, case_id, revision_id, input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version) VALUES (?, 'mark_integrity_blocked', ?, ?, ?, ?, ?, 'succeeded', 'case_revision', ?, NULL, ?, '1.0')").run(text(command.command_id), owner.project_id, owner.session_id, owner.case_id, owner.revision_id, expected, owner.revision_id, command.completed_at);
      committing = true; db.exec('COMMIT');
    } catch (error) {
      try { db?.exec('ROLLBACK'); } catch { /* A response may be lost after durable COMMIT. */ }
      db?.close(); db = undefined;
      if (!committing) nativeFailure(error, 'INTEGRITY_BLOCKED');
      let check: DatabaseSync | undefined;
      let receipt: UnknownRecord | undefined;
      try {
        rawPreflight(path); check = new DatabaseSync(path, { readOnly: true }); inspectReadOnly(check);
        receipt = check.prepare('SELECT * FROM command_receipts WHERE command_id=?').get(text(command.command_id));
        if (receipt && (receipt.input_fingerprint !== expected || receipt.result_id !== owner.revision_id || receipt.operation_kind !== 'mark_integrity_blocked')) failure('INTEGRITY_BLOCKED');
      } catch { resultPending = true; failure('RESULT_PENDING'); }
      finally { check?.close(); }
      if (!receipt) failure('INTEGRITY_BLOCKED');
    } finally { db?.close(); }
    return readProjection(owner);
  }

  return Object.freeze({
    createDraftRevision,
    recordDisclosure,
    checkAssistanceAdmission,
    admitAssistance,
    settleAssistance,
    requestAssistanceCancellation,
    disposeAssistanceDraft,
    requestAnalysisCancellation,
    reconcileInterrupted,
    checkReportExport,
    readReportExport,
    recordReportExport,
    readReportContext,
    completeCase,
    acceptFinding,
    admitAnalysis,
    publishAnalysisSuccessCandidates,
    settleAnalysis,
    readConfirmedSnapshot,
    publishConfirmation,
    saveForm,
    waitForProjection,
    createSession,
    openProject,
    listSessions,
    readProjection,
    markIntegrityBlocked,
  });
}

function migrateMembership(db:DatabaseSync):void{
 if(Number(pragmaValue(db,'user_version'))!==100)failure('SCHEMA_UNSUPPORTED');
 const tables=[...schema.matchAll(/CREATE TABLE ([a-z_]+)/g)].map(m=>m[1]);
 const originals=tables.map(table=>{const q=db.prepare(`SELECT * FROM ${table} ORDER BY rowid`);q.setReadBigInts(true);return {table,rows:q.all()};});
 for(const table of tables)db.exec(`DROP TABLE ${table}`);
 db.exec(schema110);
 for(const {table,rows}of originals)for(const row of rows){const names=Object.keys(row);db.prepare(`INSERT INTO ${table}(${names.join(',')}) VALUES(${names.map(()=>'?').join(',')})`).run(...Object.values(row));}
 db.exec('PRAGMA user_version=110');
}
function projectRootForDb(db:DatabaseSync):string {
 const main=db.prepare('PRAGMA database_list').all().find(r=>r.name==='main'),path=main&&String(main.file);if(!path||!path.endsWith('/.xanthil/desktop/state.sqlite'))failure('INTEGRITY_BLOCKED');return dirname(dirname(dirname(path)));
}
function assertPreparedPlan(db:DatabaseSync,plan:MembershipPlan,active:boolean,owningRunId?:string) {
 if(plan.version!=='2.0')return;
 const context={version:'2.0',intent:plan.intent,preparation:plan.preparation,authority:plan.authority};
 resolveMemberPlanPreparation(db,projectRootForDb(db),context,active,owningRunId);
 const confirmation=db.prepare('SELECT context_json,context_sha256 FROM membership_confirmation_preparations WHERE confirmation_id=?').get(plan.confirmation_id);
 if(!confirmation||confirmation.context_json!==encodeTask(context)||confirmation.context_sha256!==taskHash(context))failure('SOURCE_CHANGED');
}
function planForRun(db:DatabaseSync,runId:string):MembershipPlan|undefined{
 if(Number(pragmaValue(db,'user_version'))===100)return undefined;
 const row=db.prepare('SELECT p.body_json,p.body_sha256 FROM membership_plans p JOIN membership_run_plans r ON r.plan_id=p.plan_id WHERE r.run_id=?').get(runId);
 if(!row)return undefined;const plan=validateMembershipPlan(JSON.parse(text(row.body_json)));if(membershipHash(plan)!==row.body_sha256||canonicalDesktopJson(plan)!==row.body_json)failure('INTEGRITY_BLOCKED');if(plan.version==='2.0'){assertPreparedPlan(db,plan,false);const link=db.prepare('SELECT task_id,preparation_id FROM membership_plan_preparations WHERE plan_id=?').get(plan.id);if(!link||link.task_id!==plan.authority.task_id||link.preparation_id!==plan.preparation.id)failure('INTEGRITY_BLOCKED');}return plan;
}
export function membershipReviewPlan(db:DatabaseSync,taskId:string,runId:string):MembershipPlan {
 const plan=planForRun(db,runId),task=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(taskId);
 if(!plan||!task||!ownerKeys.slice(0,3).every(k=>plan.owner[k]===task[k]))failure('SOURCE_CHANGED');
 if(plan.version==='2.0'){
  if(plan.authority.task_id!==taskId||['stopped','interrupted','closed'].includes(String(task.status)))failure('AUTHORITY_REQUIRED');
  const row=db.prepare('SELECT m.body_json FROM membership_model_grants m JOIN membership_operation_grants g ON g.grant_id=m.grant_id WHERE m.task_id=? AND g.revoked=0 AND g.epoch=? ORDER BY m.rowid DESC LIMIT 1').get(taskId,task.epoch);
  if(!row)failure('AUTHORITY_REQUIRED');const material=JSON.parse(String(row.body_json)),resumed=String(task.epoch)!==plan.authority.epoch;
  if(resumed&&material.reuse?.run_id!==runId)failure('AUTHORITY_REQUIRED');
  resolveMemberPlanPreparation(db,projectRootForDb(db),{version:'2.0',intent:plan.intent,preparation:plan.preparation,authority:{...plan.authority,grant_id:material.grant_id,epoch:String(task.epoch),...(resumed?{resume_preparation_sha256:plan.preparation.sha256}:{})}},true);
 }
 return plan;
}
function persistMembershipPlan(db:DatabaseSync,input:MembershipPlan,runId:string):void{
 const plan=validateMembershipPlan(input),owner=ownerKeys.map(k=>plan.owner[k]);assertPreparedPlan(db,plan,true);
 const c=db.prepare('SELECT * FROM input_confirmations WHERE confirmation_id=?').get(plan.confirmation_id),source=db.prepare('SELECT * FROM source_snapshots WHERE snapshot_id=?').get(plan.snapshot_id);
 if(!c||!source||!ownerKeys.every(k=>c[k]===plan.owner[k]&&source[k]===plan.owner[k])||c.snapshot_id!==plan.snapshot_id)failure('INTEGRITY_BLOCKED');
 const contract=JSON.parse(text(c.contract_json)),selection={column_mapping:JSON.parse(text(c.binding_json)),comparison_period:contract.comparison_period,current_period:contract.current_period,currency:contract.currency,time_zone:contract.time_zone,valid_statuses:contract.valid_statuses,selected_group_mode:contract.selected_group_mode};
 if(membershipHash(selection)!==plan.contract_sha256)failure('SOURCE_CHANGED');
 for(const role of ['members','orders'] as const)if(source[`${role}_sha256`]!==plan.sources[role].sha256||String(source[`${role}_byte_length`])!==plan.sources[role].byte_length)failure('SOURCE_CHANGED');
 const config=db.prepare('SELECT * FROM membership_configs WHERE config_id=? AND version=?').get(plan.scenario.id,plan.scenario.revision);
 if(config){if(config.body_sha256!==plan.scenario_sha256)failure('COMMAND_CONFLICT');}else db.prepare('INSERT INTO membership_configs VALUES(?,?,?,?)').run(plan.scenario.id,plan.scenario.revision,canonicalDesktopJson(plan.scenario),plan.scenario_sha256);
 let task=db.prepare('SELECT * FROM membership_tasks WHERE project_id=? AND session_id=? AND case_id=?').get(...owner.slice(0,3));
 if(!task){const taskId=randomUUID();db.prepare("INSERT INTO membership_tasks VALUES(?,?,?,?,?,1,0,'idle')").run(taskId,...owner);task=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(taskId)!;}
 if(task.current_revision_id!==plan.owner.revision_id)db.prepare('UPDATE membership_tasks SET current_revision_id=?,row_version=row_version+1 WHERE task_id=?').run(plan.owner.revision_id,text(task.task_id));
 const prior=db.prepare('SELECT body_sha256 FROM membership_plans WHERE plan_id=?').get(plan.id);
 if(prior){if(prior.body_sha256!==membershipHash(plan))failure('COMMAND_CONFLICT');}else db.prepare('INSERT INTO membership_plans VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(plan.id,text(task.task_id),...owner,plan.confirmation_id,plan.snapshot_id,plan.scenario.id,plan.scenario.revision,canonicalDesktopJson(plan),membershipHash(plan));
 if(plan.version==='2.0')db.prepare('INSERT INTO membership_plan_preparations VALUES(?,?,?) ON CONFLICT(plan_id) DO NOTHING').run(plan.id,plan.authority.task_id,plan.preparation.id);
 db.prepare('INSERT INTO membership_run_plans VALUES(?,?,?,?,?,?)').run(runId,plan.id,...owner);
}
function assertMembershipIdentity(db:DatabaseSync):void{
 validateTaskRows(db);
 if(db.prepare('PRAGMA foreign_key_check').all().length)failure('INTEGRITY_BLOCKED');
 const plans=db.prepare('SELECT * FROM membership_plans').all();
 for(const row of plans){const p=validateMembershipPlan(JSON.parse(text(row.body_json)));if(p.id!==row.plan_id||membershipHash(p)!==row.body_sha256||canonicalDesktopJson(p)!==row.body_json||!ownerKeys.every(k=>row[k]===p.owner[k])||row.confirmation_id!==p.confirmation_id||row.snapshot_id!==p.snapshot_id||row.config_id!==p.scenario.id||row.config_version!==p.scenario.revision)failure('INTEGRITY_BLOCKED');
 const config=db.prepare('SELECT * FROM membership_configs WHERE config_id=? AND version=?').get(p.scenario.id,p.scenario.revision);if(!config||config.body_json!==canonicalDesktopJson(p.scenario)||config.body_sha256!==p.scenario_sha256)failure('INTEGRITY_BLOCKED');
 const c=db.prepare('SELECT * FROM input_confirmations WHERE confirmation_id=?').get(p.confirmation_id)!;const a=JSON.parse(text(c.contract_json));const parameters={column_mapping:JSON.parse(text(c.binding_json)),comparison_period:a.comparison_period,current_period:a.current_period,currency:a.currency,time_zone:a.time_zone,valid_statuses:a.valid_statuses,selected_group_mode:a.selected_group_mode};if(membershipHash(parameters)!==p.contract_sha256)failure('INTEGRITY_BLOCKED');
 const snapshot=db.prepare('SELECT * FROM source_snapshots WHERE snapshot_id=?').get(p.snapshot_id)!;for(const role of ['members','orders'] as const)if(snapshot[`${role}_sha256`]!==p.sources[role].sha256||String(snapshot[`${role}_byte_length`])!==p.sources[role].byte_length)failure('INTEGRITY_BLOCKED');
 }
 for(const c of db.prepare('SELECT * FROM membership_configs').all())if(!plans.some(p=>p.config_id===c.config_id&&p.config_version===c.version)&&!db.prepare("SELECT command_id FROM membership_receipts WHERE json_extract(result_json,'$.kind')='prepared' AND json_extract(result_json,'$.prepared.scenario.id')=? AND json_extract(result_json,'$.prepared.scenario.revision')=?").get(text(c.config_id),text(c.version)))failure('INTEGRITY_BLOCKED');
 for(const task of db.prepare('SELECT * FROM membership_tasks').all())if(!UUID.test(text(task.task_id))||!plans.some(p=>p.task_id===task.task_id)&&!db.prepare('SELECT command_id FROM membership_receipts WHERE task_id=?').get(text(task.task_id))||!db.prepare('SELECT revision_id FROM case_revisions WHERE revision_id=? AND project_id=? AND session_id=? AND case_id=?').get(text(task.current_revision_id),text(task.project_id),text(task.session_id),text(task.case_id)))failure('INTEGRITY_BLOCKED');
 const links=db.prepare('SELECT r.*,a.run_contract_version FROM membership_run_plans r JOIN analysis_runs a ON a.run_id=r.run_id').all();
 if(links.some(l=>!['4.0','5.0'].includes(String(l.run_contract_version)))||plans.some(p=>!links.some(l=>l.plan_id===p.plan_id)))failure('INTEGRITY_BLOCKED');
 for(const run of db.prepare("SELECT run_id FROM analysis_runs WHERE run_contract_version IN ('4.0','5.0')").all())if(!planForRun(db,text(run.run_id)))failure('INTEGRITY_BLOCKED');
}

/** Adapter-private transaction access; never crosses a business Port or renderer. */
export function appendMembershipRevision(db:DatabaseSync,taskId:string,input:{revision_id:string;expected_revision_id:string;expected_case_version:string;at:string}):void{
 const task=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(taskId),query=db.prepare('SELECT * FROM case_revisions WHERE revision_id=?');query.setReadBigInts(true);const old=query.get(input.expected_revision_id);
 const session=task&&db.prepare('SELECT * FROM product_sessions WHERE session_id=?').get(text(task.session_id));if(!task||!old||!session||task.current_revision_id!==old.revision_id||session.current_revision_id!==old.revision_id||String(old.row_version)!==input.expected_case_version||!UUID.test(input.revision_id)||!isTimestamp(input.at))failure('STALE_REVISION');
 if(db.prepare("SELECT run_id FROM analysis_runs WHERE revision_id=? AND status='Running'").get(input.expected_revision_id))failure('BUSY');
 const command={contract_version:'1.0',command_id:randomUUID(),project_id:text(task.project_id),session_id:text(task.session_id),case_id:text(task.case_id),revision_id:input.expected_revision_id,expected_row_version:input.expected_case_version};
 db.prepare("INSERT INTO case_revisions(revision_id,project_id,session_id,case_id,revision_sequence,state,case_name,question_text,hypothesis_display_title,business_context,alternative_explanations_json,evidence_explanation_text,previous_revision_id,created_at,updated_at,row_version,schema_version) VALUES(?,?,?,?,?,'Draft',?,?,?,?,?,?,?,?,?,1,'1.0')").run(input.revision_id,task.project_id,task.session_id,task.case_id,BigInt(String(old.revision_sequence))+1n,text(old.case_name),text(old.question_text),text(old.hypothesis_display_title),text(old.business_context),text(old.alternative_explanations_json),text(old.evidence_explanation_text),input.expected_revision_id,input.at,input.at);
 db.prepare('UPDATE product_sessions SET current_revision_id=? WHERE session_id=?').run(input.revision_id,task.session_id);
 db.prepare('UPDATE membership_tasks SET current_revision_id=? WHERE task_id=?').run(input.revision_id,taskId);
 db.prepare("INSERT INTO command_receipts VALUES(?,'create_draft_revision',?,?,?,?,?,'succeeded','case_revision',?,NULL,?,'1.0')").run(command.command_id,...ownerKeys.map(k=>command[k]),analysisFingerprint('create_draft_revision',command),input.revision_id,input.at);
}

export function appendMembershipExpression(projectRoot:string,db:DatabaseSync,taskId:string,input:{comment_id:string;attempt_id:string;grant_id:string;epoch:number;text:string;at:string}):void{
 const t=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(taskId),row=db.prepare('SELECT * FROM membership_comments WHERE comment_id=? AND task_id=?').get(input.comment_id,taskId),a=db.prepare('SELECT * FROM membership_attempts WHERE attempt_id=? AND task_id=?').get(input.attempt_id,taskId),g=db.prepare('SELECT * FROM membership_grants WHERE grant_id=? AND task_id=?').get(input.grant_id,taskId);
 if(!t||!row||!a||!g||g.revoked_at||t.epoch!==input.epoch||g.epoch!==input.epoch||!['issued','settled'].includes(text(a.status))||['stopped','closed','interrupted'].includes(text(t.status)))failure('INTERRUPTED');
 const c=decoded<TaskComment>(row),grant=decoded<TaskGrant>(g),originalGrant=db.prepare('SELECT * FROM membership_grants WHERE grant_id=?').get(text(a.grant_id));if(!originalGrant||decoded<TaskGrant>(originalGrant).prepared.fingerprint!==grant.prepared.fingerprint||c.resolution?.intent!=='expression'||c.resolution.text!==input.text)failure('SOURCE_CHANGED');if(!c.text_consent||c.result_report_id||Date.parse(input.at)>=Date.parse(grant.expires_at)||decoded<TaskAttempt>(a).comment_id!==c.id)failure('AUTHORITY_REQUIRED');
 const parent=db.prepare('SELECT * FROM report_versions WHERE report_id=?').get(c.report_id),revision=db.prepare('SELECT * FROM case_revisions WHERE revision_id=?').get(text(t.current_revision_id));
 if(!parent||!revision||revision.current_report_id!==c.report_id||parent.revision_id!==revision.revision_id||parent.markdown_sha256!==c.report_sha256||revision.integrity_state!=='ok'||revision.state!=='Review')failure('SOURCE_CHANGED');
 const session=join(projectRoot,text(t.session_id)),reports=join(session,'060_reports'),parentDir=join(reports,c.report_id);for(const dir of [projectRoot,session,reports,parentDir])fileIdentity(dir,true);
 const parentPath=join(parentDir,'report.md');fileIdentity(parentPath);const fd=openSync(parentPath,constants.O_RDONLY|constants.O_NOFOLLOW);let bytes:Buffer;try{bytes=readFileSync(fd);}finally{closeSync(fd);}if(digest(bytes)!==parent.markdown_sha256||String(bytes.length)!==String(parent.markdown_byte_length))failure('INTEGRITY_BLOCKED');
 if(typeof input.text!=='string'||!input.text.trim())failure('VALIDATION_FAILED');const body=expressionReport(new TextDecoder('utf-8',{fatal:true}).decode(bytes),input.text),id=randomUUID(),target=join(reports,id);mkdirSync(target,{mode:0o700});
 for(const [name,content] of [['report.md',body.markdown],['report.html',body.html]]){const fd=openSync(join(target,name),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,content);fsyncSync(fd);}finally{closeSync(fd);}}syncDirectory(target);syncDirectory(reports);
 const seq=db.prepare('SELECT max(version_sequence) n FROM report_versions WHERE revision_id=?').get(text(t.current_revision_id))!.n;const next=BigInt(String(seq))+1n;
 db.prepare("INSERT INTO report_versions VALUES(?,?,?,?,?,?,NULL,NULL,?,'draft',?,?,?,?,?,?,?,?,?,'1.0')").run(id,t.project_id,t.session_id,t.case_id,t.current_revision_id,parent.finding_id,next,`${t.session_id}/060_reports/${id}/report.md`,digest(body.markdown),Buffer.byteLength(body.markdown),`${t.session_id}/060_reports/${id}/report.html`,digest(body.html),Buffer.byteLength(body.html),parent.source_json,parent.evidence_refs_json,input.at);
 const updated={...c,result_report_id:id};db.prepare('UPDATE membership_comments SET body_json=?,body_sha256=? WHERE comment_id=?').run(encodeTask(updated),taskHash(updated),c.id);
 const receipt={kind:'expression_report',comment_id:c.id,parent_report_id:c.report_id,report_id:id,text:input.text,at:input.at};db.prepare('INSERT INTO membership_receipts VALUES(?,?,?,NULL,NULL,?)').run(randomUUID(),taskId,taskHash(receipt),encodeTask(receipt));
 db.prepare('UPDATE case_revisions SET current_report_id=? WHERE revision_id=?').run(id,t.current_revision_id);
}

/** C6's state half: actual existing acceptance/form/closure relations and receipts. */
export function appendMembershipReview(projectRoot:string,db:DatabaseSync,r:MembershipReview,input:ReviewSubmission,fault:(point:string)=>void=()=>{}):ReviewReceipt{
 const revision=db.prepare('SELECT * FROM case_revisions WHERE revision_id=?').get(r.source.owner.revision_id),parent=db.prepare('SELECT * FROM report_versions WHERE report_id=?').get(r.source.report_id),finding=db.prepare('SELECT * FROM findings WHERE finding_id=?').get(r.source.finding_id),plan=membershipReviewPlan(db,r.task_id,r.source.run_id);
 if(!revision||!parent||!finding||revision.state!=='Review'||revision.current_finding_id!==r.source.finding_id||revision.current_report_id!==r.source.report_id||String(revision.row_version)!==r.source.case_row_version||parent.markdown_sha256!==r.source.report_sha256||String(parent.version_sequence)!==r.source.report_version||finding.run_id!==r.source.run_id||!plan||membershipHash(plan)!==r.source.plan_sha256)failure('SOURCE_CHANGED');
 if(!['analysis','choice'].includes(input.outcome)||plan.version==='2.0'&&input.outcome!=='analysis')failure('FORBIDDEN');
 const form=r.fields.closure;validateDesktopDecisionForm(form);if(form.disposition!=='saved')failure('VALIDATION_FAILED');
 const evidence=JSON.parse(text(finding.evidence_refs_json)) as string[];
 const attached=db.prepare('PRAGMA database_list').all().some(d=>d.name==='assistant'),head=attached?db.prepare('SELECT decision_id FROM assistant.heads WHERE source=?').get(encodeTask(r.source.owner))?.decision_id??null:null;if(head!==r.baseline_decision_id)failure('STALE_DECISION');
 const decision=input.outcome==='choice'?validateReviewDecision(r.fields.decision,{evidence_refs:evidence,finding_id:r.source.finding_id,candidates:form.candidates}):null;
 if(form.route==='candidate_comparison'&&form.candidates.some(c=>!evidence.some(ref=>c.evidence_basis.includes(ref))))failure('EVIDENCE_REQUIRED');
 const owner=r.source.owner,acceptance_id=randomUUID(),form_id=randomUUID(),closure_id=randomUUID(),report_id=randomUUID();
 const baseDir=join(projectRoot,owner.session_id,'060_reports');for(const dir of [projectRoot,join(projectRoot,owner.session_id),baseDir,join(baseDir,r.source.report_id)])fileIdentity(dir,true);
 const oldPath=join(baseDir,r.source.report_id,'report.md');fileIdentity(oldPath);const fd=openSync(oldPath,constants.O_RDONLY|constants.O_NOFOLLOW);let bytes:Buffer;try{bytes=readFileSync(fd);}finally{closeSync(fd);}if(digest(bytes)!==parent.markdown_sha256||String(bytes.length)!==String(parent.markdown_byte_length))failure('INTEGRITY_BLOCKED');
 const formal:FormalDecision|null=decision?{id:randomUUID(),outcome_id:randomUUID(),report_id,sequence:head?Number(JSON.parse(text(db.prepare('SELECT body FROM assistant.decisions WHERE id=?').get(String(head))!.body)).sequence)+1:1,source:owner,source_report_id:r.source.report_id,previous_id:head as string|null,fields:decision,actor:r.fields.actor,adopted_at:input.at,origin:{kind:'membership_review',task_id:r.task_id,review_id:r.id,review_version:r.sequence,intent_id:r.intent_id}}:null;
 const rows=[`人工审阅人：${r.fields.actor}`,`审阅时间：${input.at}`,form.route==='insufficient_evidence'?`证据不足：${form.insufficient_reason}`:'候选比较',...form.candidates.flatMap(c=>[c.title,`证据：${c.evidence_basis}`,`风险与反证：${c.risk_or_refutation}`,`适用条件：${c.applicability_conditions}`,`未来验证：${c.future_validation_metric}`]),...(form.preferred_candidate_id?[`偏好：${form.candidates.find(c=>c.candidate_id===form.preferred_candidate_id)!.title}`,`理由：${form.preferred_reason}`]:[]),`保留问题：${r.fields.questions}`,...(formal?formalDecisionSections(formal).flatMap(s=>[s.title,...s.rows.map(([k,v])=>k+'：'+v)]):['本次仅结束分析，未记录正式业务决策。'])];
 const markdown=new TextDecoder('utf-8',{fatal:true}).decode(bytes)+'\n\n## 人工审阅与分析闭合\n\n'+rows.join('\n\n')+'\n',html='<!doctype html><meta charset="utf-8"><pre>'+markdown.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</pre>',target=join(baseDir,report_id);mkdirSync(target,{mode:0o700});
 for(const [name,content] of [['report.md',markdown],['report.html',html]]){const fd=openSync(join(target,name),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,content);fsyncSync(fd);}finally{closeSync(fd);}}syncDirectory(target);syncDirectory(baseDir);
 fault('files_prepared');let version=BigInt(r.source.case_row_version);const receipt=(operation:string,details:object,kind:string,id:string)=>{const command={contract_version:'1.0',command_id:randomUUID(),...owner,expected_row_version:String(version),...details};db.prepare("INSERT INTO command_receipts VALUES(?,?,?,?,?,?,?,'succeeded',?, ?,NULL,?,'1.0')").run(command.command_id,operation,...ownerKeys.map(k=>owner[k]),analysisFingerprint(operation,command),kind,id,input.at);version++;};
 fault('before_acceptance');db.prepare("INSERT INTO finding_acceptances VALUES(?,?,?,?,?,?,'accept',?,'1.0')").run(acceptance_id,r.source.finding_id,...ownerKeys.map(k=>owner[k]),input.at);receipt('accept_finding',{finding_id:r.source.finding_id},'finding_acceptance',acceptance_id);fault('after_acceptance');
 const seq=Number(db.prepare('SELECT max(form_sequence) n FROM decision_forms WHERE revision_id=?').get(owner.revision_id)?.n??0)+1;
 fault('before_form');db.prepare("INSERT INTO decision_forms VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'1.0')").run(form_id,...ownerKeys.map(k=>owner[k]),seq,canonicalDesktopJson(form.candidates),form.route,form.insufficient_reason,form.preferred_candidate_id,form.preferred_reason,form.disposition,input.at,form.defer_until,input.at,input.at);receipt('save_form',{form},'decision_form',form_id);fault('after_form');
 fault('before_closure');db.prepare("INSERT INTO decision_closures VALUES(?,?,?,?,?,?,?,?,?,'1.0')").run(closure_id,...ownerKeys.map(k=>owner[k]),acceptance_id,form_id,form.route,input.at);receipt('complete_case',{acceptance_id,form_id},'decision_closure',closure_id);fault('after_closure');
 const provenance={...JSON.parse(text(parent.source_json)),acceptance_id,form_id,closure_id,review:{task_id:r.task_id,review_id:r.id,review_version:String(r.sequence),intent_id:r.intent_id,parent_report_id:r.source.report_id,parent_report_sha256:r.source.report_sha256}};
 const reportSeq=Number(db.prepare('SELECT max(version_sequence) n FROM report_versions WHERE revision_id=?').get(owner.revision_id)!.n)+1;
 fault('before_report');db.prepare("INSERT INTO report_versions VALUES(?,?,?,?,?,?,?,?,?,'final',?,?,?,?,?,?,?,?,?,'1.0')").run(report_id,...ownerKeys.map(k=>owner[k]),r.source.finding_id,acceptance_id,closure_id,reportSeq,`${owner.session_id}/060_reports/${report_id}/report.md`,digest(markdown),Buffer.byteLength(markdown),`${owner.session_id}/060_reports/${report_id}/report.html`,digest(html),Buffer.byteLength(html),canonicalDesktopJson(provenance),parent.evidence_refs_json,input.at);fault('after_report');
 fault('before_completed');db.prepare("UPDATE case_revisions SET state='Completed',current_acceptance_id=?,current_closure_id=?,current_report_id=?,row_version=?,updated_at=? WHERE revision_id=?").run(acceptance_id,closure_id,report_id,version,input.at,owner.revision_id);fault('after_completed');
 if(formal){
  fault('before_sidecar_migration');migrateMembershipSidecar(db,owner.project_id);fault('after_sidecar_migration');
  const report:AssistantReport={id:report_id,decision_id:formal.id,source_revision:owner.revision_id,sequence:reportSeq,original_report_id:r.source.report_id,markdown,html,markdown_sha256:digest(markdown),html_sha256:digest(html),created_at:input.at};
  for(const [table,value] of [['decisions',formal],['reports',report]] as const){fault('before_'+table);const body=encodeTask(value);db.prepare(`INSERT INTO assistant.${table} VALUES(?,?,?,?)`).run(value.id,encodeTask(owner),body,digest(body));fault('after_'+table);}
  fault('before_head');db.prepare('INSERT OR REPLACE INTO assistant.heads VALUES(?,?)').run(encodeTask(owner),formal.id);fault('after_head');
 }
 return {...input,kind:'human_review',acceptance_id,closure_id,report_id,decision_id:formal?.id??null,expected_id:formal?.outcome_id??null};
}

export function withMembershipState<T>(projectRoot:string,write:boolean,work:(db:DatabaseSync)=>T,formal?:{project_id:string;choice:boolean;fault?:(point:string,db:DatabaseSync)=>void}):T{
 const sidecar=formal?(formal.choice?prepareMembershipSidecar(projectRoot,formal.project_id):join(projectRoot,'.xanthil','desktop','case-assistant.sqlite')):null;
 const db=openConnection(databasePath(projectRoot),true);let committing=false;
 try{
  if(!write)return work(db);
  if(formal){if(pragmaValue(db,'journal_mode')!=='delete'||Number(pragmaValue(db,'synchronous'))!==2)failure('INTEGRITY_BLOCKED');if(sidecar&&existsSync(sidecar)){fileIdentity(sidecar);if(lstatSync(sidecar).dev!==lstatSync(databasePath(projectRoot)).dev)failure('INTEGRITY_BLOCKED');db.prepare('ATTACH DATABASE ? AS assistant').run(sidecar);db.exec('PRAGMA assistant.synchronous=FULL');assertMembershipSidecar(db,formal.project_id,'assistant');}}
  const activating=Number(pragmaValue(db,'user_version'))===100;if(activating)db.exec('PRAGMA foreign_keys=OFF');
  db.exec('BEGIN IMMEDIATE');formal?.fault?.('transaction_started',db);if(activating)migrateMembership(db);const result=work(db);inspectReadOnly(db);if(formal&&db.prepare('PRAGMA database_list').all().some(d=>d.name==='assistant'))assertMembershipSidecar(db,formal.project_id,'assistant');formal?.fault?.('before_commit',db);committing=true;db.exec('COMMIT');formal?.fault?.('after_commit',db);return result;
 }catch(error){try{db.exec('ROLLBACK');}catch{}if(committing)failure('RESULT_PENDING');throw error;}finally{db.close();}
}

/** Browser ledger GET uses an actual read-only connection and cannot run recovery mutations. */
export function withBrowserMembershipState<T>(projectRoot:string,write:boolean,work:(db:DatabaseSync)=>T):T{
 const checked=(db:DatabaseSync)=>{if(Number(pragmaValue(db,'user_version'))!==120)failure('EXISTING_PROJECT_ACTIVATION_CLOSED');return work(db);};
 if(write)return withMembershipState(projectRoot,true,checked);
 const path=databasePath(projectRoot);rawPreflight(path);const db=new DatabaseSync(path,{readOnly:true});
 try{inspectReadOnly(db);return checked(db);}finally{db.close();}
}

function assertTaskRunAdmission(db:DatabaseSync,plan:MembershipPlan|undefined,owner:{project_id:string;session_id:string;case_id:string;revision_id:string},at:string,owningRunId?:string){
 if(plan?.version==='2.0'){assertPreparedPlan(db,plan,true,owningRunId);if(!ownerKeys.every(k=>plan.owner[k]===owner[k as keyof typeof owner]))failure('SOURCE_CHANGED');return;}
 if(![110,120].includes(Number(pragmaValue(db,'user_version')))){if(plan?.task_context)failure('AUTHORITY_REQUIRED');return;}
 const task=db.prepare('SELECT * FROM membership_tasks WHERE project_id=? AND session_id=? AND case_id=?').get(owner.project_id,owner.session_id,owner.case_id);
 const explicit=task&&db.prepare("SELECT command_id FROM membership_receipts WHERE task_id=? AND json_extract(result_json,'$.kind')='task_created'").get(text(task.task_id));
 if(!explicit&&!plan?.task_context)return;
 const c=plan?.task_context;if(!c||!task||task.task_id!==c.task_id||String(task.epoch)!==c.epoch||task.current_revision_id!==owner.revision_id||!['running','waiting'].includes(text(task.status)))failure('AUTHORITY_REQUIRED');
 const gr=db.prepare('SELECT * FROM membership_grants WHERE grant_id=? AND task_id=?').get(c.grant_id,c.task_id),ur=db.prepare('SELECT * FROM membership_usage WHERE reservation_id=? AND task_id=? AND grant_id=?').get(c.reservation_id,c.task_id,c.grant_id);
 if(!gr||!ur)failure('AUTHORITY_REQUIRED');const g=decoded<TaskGrant>(gr),u=decoded<TaskUsage>(ur);
 const ar=db.prepare('SELECT * FROM membership_attempts WHERE attempt_id=? AND task_id=? AND grant_id=?').get(u.attempt_id,c.task_id,c.grant_id);if(!ar)failure('AUTHORITY_REQUIRED');const a=decoded<TaskAttempt>(ar);
 if(g.revoked_at||String(g.epoch)!==c.epoch||Date.parse(at)>=Date.parse(g.expires_at)||a.status!=='running'||u.kind!=='analysis'||u.status!=='issued'||u.local_runs!==1||u.source_sha256!==g.prepared.fingerprint||c.run_ms!==String(g.profile.run_ms)||c.process_seconds!==String(g.profile.process_seconds)||membershipHash(g.prepared.selection)!==plan!.contract_sha256||membershipHash(g.prepared.scenario)!==plan!.scenario_sha256||JSON.stringify(g.prepared.methods)!==JSON.stringify(plan!.methods))failure('AUTHORITY_REQUIRED');
}

function explicitMembershipTask(db:DatabaseSync,caseId:string):boolean{return [110,120].includes(Number(pragmaValue(db,'user_version')))&&!!db.prepare("SELECT t.task_id FROM membership_tasks t JOIN membership_receipts r ON r.task_id=t.task_id WHERE t.case_id=? AND json_extract(r.result_json,'$.kind')='task_created' LIMIT 1").get(caseId);}
