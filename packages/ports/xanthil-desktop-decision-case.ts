import type { AcceptFindingRequest, CancelAnalysisRequest, CompleteCaseRequest, ConfirmRevisionRequest, CreateDraftRevisionRequest, CreateSessionRequest, DesktopProjection, ExportReportRequest, ExportValue, OwnerRef, RevisionCommand, SaveFormRequest, SessionSummary, StartAnalysisRequest } from '../contracts/xanthil-desktop-ipc.ts';
import type { DesktopCalculationResult, DesktopFileDescriptor, DesktopReportMaterial, DesktopRunArtifact, DesktopRunManifest, DesktopSelection } from '../product-core/xanthil-desktop-decision-case.ts';

export type DesktopRunBytes = Readonly<{bytes: Uint8Array; sha256: string; byte_length: string}>;
export type DesktopTerminalRunBundle = Readonly<{run_id: string; locator: string; manifest: DesktopRunManifest; manifest_sha256: string; descriptors: readonly DesktopFileDescriptor[]}>;
export type DesktopAnalysisDescription = Readonly<{method_id:string;method_version:string;code_identity:string;duckdb_version:string;python_version:string;primary_sql:DesktopRunBytes;python_verifier:DesktopRunBytes}>;
export type DesktopCalculationRequest = Readonly<{run_id:string;expected_code_identity:string;contract:DesktopSelection;snapshot:Readonly<{members_bytes:Uint8Array;orders_bytes:Uint8Array}>;group_pseudonym_map:Readonly<Record<string,string>>|null;cancellation_signal:AbortSignal;deadline_seconds:number}>;
export type DesktopCalculationOutput = Readonly<{schema_version:'1.0';run_id:string;implementation:'duckdb_primary'|'python_independent';method:Readonly<{id:string;version:string;code_identity:string}>;result:DesktopCalculationResult}>;
export type DesktopLocalAnalysisExecution = Readonly<{
  describeImplementation(input:Readonly<Record<string,never>>):Promise<DesktopAnalysisDescription>;
  calculate(input:DesktopCalculationRequest):Promise<DesktopCalculationOutput>;
  verify(input:DesktopCalculationRequest):Promise<DesktopCalculationOutput>;
}>;
type DesktopRunAppend = Readonly<{run_id:string;expected_in_progress_manifest_sha256:string;bytes:Uint8Array;cancellation_signal:AbortSignal}>;
type DesktopRunTerminal = Readonly<{run_id:string;expected_in_progress_manifest_sha256:string;terminal_manifest:DesktopRunManifest;cancellation_signal:AbortSignal}>;
export type DesktopRunEvidenceStore = Readonly<{
  beginRun(input:Readonly<{run_id:string;initial_manifest:DesktopRunManifest;confirmation_files:Readonly<{contract:DesktopRunBytes;binding:DesktopRunBytes;ir:DesktopRunBytes}>;code_assets:Readonly<{primary_sql:DesktopRunBytes;python_verifier:DesktopRunBytes}>;cancellation_signal:AbortSignal}>):Promise<Readonly<{run_id:string;locator:string;in_progress_manifest_sha256:string}>>;
  recordDuckDbResult(input:DesktopRunAppend):Promise<Readonly<{descriptor:DesktopRunArtifact;in_progress_manifest_sha256:string}>>;
  recordPythonResult(input:DesktopRunAppend):Promise<Readonly<{descriptor:DesktopRunArtifact;in_progress_manifest_sha256:string}>>;
  succeedRun(input:DesktopRunTerminal&Readonly<{evidence_bytes:Uint8Array;summary_bytes:Uint8Array;evidence_document_bytes:Uint8Array}>):Promise<DesktopTerminalRunBundle>;
  failRun(input:DesktopRunTerminal):Promise<DesktopTerminalRunBundle>;
  cancelRun(input:DesktopRunTerminal):Promise<DesktopTerminalRunBundle>;
  readTerminalRun(input:Readonly<{run_id:string}>):Promise<DesktopTerminalRunBundle>;
}>;

export function defineDesktopLocalAnalysisExecution(implementation:unknown):DesktopLocalAnalysisExecution {
  const methods=['describeImplementation','calculate','verify'] as const;
  if(!isRecord(implementation)||Object.keys(implementation).length!==methods.length||methods.some(key=>typeof implementation[key]!=='function'))fail();
  return Object.freeze({describeImplementation:implementation.describeImplementation as DesktopLocalAnalysisExecution['describeImplementation'],calculate:implementation.calculate as DesktopLocalAnalysisExecution['calculate'],verify:implementation.verify as DesktopLocalAnalysisExecution['verify']});
}

export function defineDesktopRunEvidenceStore(implementation:unknown):DesktopRunEvidenceStore {
  const methods=['beginRun','recordDuckDbResult','recordPythonResult','succeedRun','failRun','cancelRun','readTerminalRun'] as const;
  if(!isRecord(implementation)||Object.keys(implementation).length!==methods.length||methods.some(key=>typeof implementation[key]!=='function'))fail();
  return Object.freeze({beginRun:implementation.beginRun as DesktopRunEvidenceStore['beginRun'],recordDuckDbResult:implementation.recordDuckDbResult as DesktopRunEvidenceStore['recordDuckDbResult'],recordPythonResult:implementation.recordPythonResult as DesktopRunEvidenceStore['recordPythonResult'],succeedRun:implementation.succeedRun as DesktopRunEvidenceStore['succeedRun'],failRun:implementation.failRun as DesktopRunEvidenceStore['failRun'],cancelRun:implementation.cancelRun as DesktopRunEvidenceStore['cancelRun'],readTerminalRun:implementation.readTerminalRun as DesktopRunEvidenceStore['readTerminalRun']});
}
export type DesktopAnalysisAdmission = Readonly<{command: StartAnalysisRequest; ids: Readonly<{run_id:string}>; started_at:string; deadline_at:string; profile_id:string; method_id:string; method_version:string; code_identity:string; input_fingerprint:string}>;
export type DesktopAggregatePublication = Readonly<{artifact_id:string; locator:string; sha256:string; byte_length:string; columns:readonly string[]; measurement_meanings:Readonly<Record<string,string>>; group_pseudonym_map:Readonly<Record<string,string>>|null}>;
export type DesktopReportPublication = Readonly<{report_id:string; markdown:Readonly<{locator:string;sha256:string;byte_length:string}>; html:Readonly<{locator:string;sha256:string;byte_length:string}>; source:Readonly<Record<string,unknown>>; evidence_refs:readonly string[]}>;
export type DesktopExportDescriptor=Readonly<{display_name:string;media_type:'text/html;charset=utf-8'|'text/markdown;charset=utf-8';sha256:string;byte_length:string}>;
export type DesktopPreparedExport=Readonly<{report_id:string;suggested_file_name:string;media_type:DesktopExportDescriptor['media_type'];bytes:Uint8Array;sha256:string;byte_length:string}>;
export type DesktopAnalysisCandidates = OwnerRef & Readonly<{expected_row_version:string;run_id:string;operation_id:string;
 aggregate:Readonly<{artifact_id:string;bytes:Uint8Array;method_id:string;method_version:string;code_identity:string;columns:readonly string[];measurement_meanings:Readonly<Record<string,string>>;group_pseudonym_map:Readonly<Record<string,string>>|null}>;
 report:Readonly<{report_id:string;markdown_bytes:Uint8Array;html_bytes:Uint8Array;source:Readonly<Record<string,unknown>>;evidence_refs:readonly string[]}>}>;
export type DesktopAnalysisSettlement = Readonly<{command:RevisionCommand;run_id:string;completed_at:string;input_fingerprint:string;
 terminal:Readonly<{status:'succeeded';runBundle:DesktopTerminalRunBundle;aggregatePublication:DesktopAggregatePublication;reportPublication:DesktopReportPublication;finding:Readonly<{finding_id:string;judgment:string;metrics:DesktopCalculationResult;supporting_evidence:readonly string[];refutation:string;limitations:readonly string[];evidence_refs:readonly string[]}>}>|Readonly<{status:'failed';reason:string}>|Readonly<{status:'cancelled';reason:'user_cancelled'}>}>;

export type DesktopSourcePair = Readonly<{ members: Readonly<{ display_name: string; bytes: Uint8Array }>; orders: Readonly<{ display_name: string; bytes: Uint8Array }> }>;
export type DesktopConfirmationPublication = Readonly<{
  command: ConfirmRevisionRequest;
  ids: Readonly<{ snapshot_id: string; confirmation_id: string; operation_id: string }>;
  source_files: DesktopSourcePair;
  contract_bytes: Uint8Array; binding_bytes: Uint8Array; ir_bytes: Uint8Array;
  counts: Readonly<{ included_member_count: string; excluded_member_count: string; included_order_count: string; excluded_order_count: string }>;
  treatment_basis: ConfirmRevisionRequest['confirmation']['issue_treatments'];
  completed_at: string; input_fingerprint: string;
}>;
export type DesktopConfirmedSnapshot = Readonly<{
  confirmation: Readonly<{ contract_bytes: Uint8Array; binding_bytes: Uint8Array; ir_bytes: Uint8Array; contract_sha256: string; binding_sha256: string; ir_sha256: string }>;
  snapshot: Readonly<{ snapshot_id: string; members: Readonly<{display_name: string; bytes: Uint8Array; sha256: string; byte_length: string}>; orders: Readonly<{display_name: string; bytes: Uint8Array; sha256: string; byte_length: string}> }>;
}>;

export type DesktopProjectOpen = Readonly<{
  opened: true;
  initialized: boolean;
  project_id: string;
  display_name: string;
  schema_version: '1.0';
  projection_token: string;
}>;

/** Current local decision-case storage; no model capability is supplied. */
export type DesktopDecisionCaseStore = Readonly<{
  requestAssistanceCancellation(input:Readonly<{command:import('../contracts/xanthil-desktop-ipc.ts').CancelAssistanceRequest;completed_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  disposeAssistanceDraft(input:Readonly<{command:import('../contracts/xanthil-desktop-ipc.ts').DisposeAssistanceDraftRequest;form_id:string;completed_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  checkAssistanceAdmission(input:import('../contracts/xanthil-desktop-ipc.ts').StartAssistanceRequest):Promise<DesktopProjection|null>;
  admitAssistance(input:Readonly<{command:import('../contracts/xanthil-desktop-ipc.ts').StartAssistanceRequest;attempt_id:string;runtimeSelection:import('./local-analysis.ts').AssistanceSelection;started_at:string;deadline_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  settleAssistance(input:Readonly<{command:RevisionCommand;attempt_id:string;completed_at:string;input_fingerprint:string;terminal:Readonly<{status:'succeeded';draft_id:string;actual_provider:string;actual_model:string;draft_kind:'question_fields'|'evidence_explanation'|'candidates';generated_content:import('../contracts/xanthil-desktop-ipc.ts').AssistanceDraftContent}>|Readonly<{status:'failed';reason:'provider_failed'|'validation_failed'|'deadline_exceeded'|'interrupted'}>|Readonly<{status:'cancelled';reason:'user_cancelled'}>}>):Promise<DesktopProjection>;
  recordDisclosure(input: Readonly<{command: import('../contracts/xanthil-desktop-ipc.ts').DecideAssistanceDisclosureRequest;disclosure_id:string;preview:import('../contracts/xanthil-desktop-ipc.ts').DisclosurePreview;decided_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  checkReportExport(input:ExportReportRequest):Promise<Extract<ExportValue,{status:'already_recorded'}>|null>;
  readReportExport(input:OwnerRef&Readonly<{command_id:string;report_id:string;format:'markdown'|'html'}>):Promise<DesktopPreparedExport>;
  recordReportExport(input:Readonly<{command:ExportReportRequest;prepared:DesktopPreparedExport;descriptor:DesktopExportDescriptor;completed_at:string;input_fingerprint:string}>):Promise<ExportValue>;
  readReportContext(input:OwnerRef&Readonly<{finding_id:string}>):Promise<DesktopReportMaterial>;
  completeCase(input:Readonly<{command:CompleteCaseRequest;ids:Readonly<{closure_id:string;report_id:string;operation_id:string}>;report:Readonly<{markdown_bytes:Uint8Array;html_bytes:Uint8Array;source:Readonly<Record<string,unknown>>;evidence_refs:readonly string[]}>;completed_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  acceptFinding(input:Readonly<{command:AcceptFindingRequest;acceptance_id:string;accepted_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  createDraftRevision(input:Readonly<{command:CreateDraftRevisionRequest;ids:Readonly<{revision_id:string}>;created_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  requestAnalysisCancellation(input:Readonly<{command:CancelAnalysisRequest;completed_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  reconcileInterrupted(input:OwnerRef&Readonly<{command_id:string;target_kind:'analysis_run'|'assistance_attempt';target_id:string;completed_at:string;input_fingerprint:string}>):Promise<DesktopProjection>;
  admitAnalysis(input: DesktopAnalysisAdmission): Promise<DesktopProjection>;
  publishAnalysisSuccessCandidates(input: DesktopAnalysisCandidates): Promise<Readonly<{published:true;aggregatePublication:DesktopAggregatePublication;reportPublication:DesktopReportPublication}>>;
  settleAnalysis(input: DesktopAnalysisSettlement): Promise<DesktopProjection>;
  publishConfirmation(input: DesktopConfirmationPublication): Promise<DesktopProjection>;
  readConfirmedSnapshot(input: OwnerRef & Readonly<{confirmation_id: string}>): Promise<DesktopConfirmedSnapshot>;
  saveForm(input: Readonly<{ command: SaveFormRequest; completed_at: string; input_fingerprint: string; form_id?:string }>): Promise<DesktopProjection>;
  waitForProjection(input: OwnerRef & Readonly<{ projection_token: string }>): Promise<DesktopProjection>;
  createSession(input: Readonly<{
    command: CreateSessionRequest;
    ids: Readonly<{ session_id: string; case_id: string; revision_id: string; operation_id: string }>;
    created_at: string;
    input_fingerprint: string;
  }>): Promise<DesktopProjection>;
  openProject(input: Readonly<{
    contract_version: '1.0';
    command_id: string;
    proposed_project_id: string;
    display_name: string;
    initialized_at: string;
    input_fingerprint: string;
  }>): Promise<DesktopProjectOpen>;
  listSessions(input: Readonly<{ project_id: string }>): Promise<readonly SessionSummary[]>;
  readProjection(input: OwnerRef): Promise<DesktopProjection>;
  markIntegrityBlocked(input: Readonly<{
    command_id: string;
    project_id: string;
    session_id: string;
    case_id: string;
    revision_id: string;
    expected_row_version: string;
    reason_code: string;
    completed_at: string;
    input_fingerprint: string;
  }>): Promise<Readonly<Record<string, unknown>>>;
}>;

function fail(): never {
  throw new Error('INVALID_PORT_IMPLEMENTATION');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function defineDesktopDecisionCaseStore(implementation: unknown): DesktopDecisionCaseStore {
  const methods = ['openProject', 'listSessions', 'readProjection', 'markIntegrityBlocked', 'createSession', 'saveForm', 'waitForProjection', 'publishConfirmation', 'readConfirmedSnapshot', 'admitAnalysis', 'publishAnalysisSuccessCandidates', 'settleAnalysis','requestAnalysisCancellation','reconcileInterrupted','createDraftRevision','acceptFinding','readReportContext','completeCase','checkReportExport','readReportExport','recordReportExport','recordDisclosure','checkAssistanceAdmission','admitAssistance','settleAssistance','requestAssistanceCancellation','disposeAssistanceDraft'] as const;
  if (!isRecord(implementation)) fail();
  const keys = Object.keys(implementation);
  if (keys.length !== methods.length || keys.some((key) => !methods.includes(key as (typeof methods)[number])) || methods.some((method) => typeof implementation[method] !== 'function')) fail();
  return Object.freeze({
    requestAssistanceCancellation:implementation.requestAssistanceCancellation as DesktopDecisionCaseStore['requestAssistanceCancellation'],
    disposeAssistanceDraft:implementation.disposeAssistanceDraft as DesktopDecisionCaseStore['disposeAssistanceDraft'],
    checkAssistanceAdmission:implementation.checkAssistanceAdmission as DesktopDecisionCaseStore['checkAssistanceAdmission'],
    admitAssistance:implementation.admitAssistance as DesktopDecisionCaseStore['admitAssistance'],
    settleAssistance:implementation.settleAssistance as DesktopDecisionCaseStore['settleAssistance'],
    recordDisclosure:implementation.recordDisclosure as DesktopDecisionCaseStore['recordDisclosure'],
    checkReportExport:implementation.checkReportExport as DesktopDecisionCaseStore['checkReportExport'],
    readReportExport:implementation.readReportExport as DesktopDecisionCaseStore['readReportExport'],
    recordReportExport:implementation.recordReportExport as DesktopDecisionCaseStore['recordReportExport'],
    readReportContext:implementation.readReportContext as DesktopDecisionCaseStore['readReportContext'],
    completeCase:implementation.completeCase as DesktopDecisionCaseStore['completeCase'],
    acceptFinding: implementation.acceptFinding as DesktopDecisionCaseStore['acceptFinding'],
    createDraftRevision: implementation.createDraftRevision as DesktopDecisionCaseStore['createDraftRevision'],
    requestAnalysisCancellation: implementation.requestAnalysisCancellation as DesktopDecisionCaseStore['requestAnalysisCancellation'],
    reconcileInterrupted: implementation.reconcileInterrupted as DesktopDecisionCaseStore['reconcileInterrupted'],
    admitAnalysis: implementation.admitAnalysis as DesktopDecisionCaseStore['admitAnalysis'],
    publishAnalysisSuccessCandidates: implementation.publishAnalysisSuccessCandidates as DesktopDecisionCaseStore['publishAnalysisSuccessCandidates'],
    settleAnalysis: implementation.settleAnalysis as DesktopDecisionCaseStore['settleAnalysis'],
    publishConfirmation: implementation.publishConfirmation as DesktopDecisionCaseStore['publishConfirmation'],
    readConfirmedSnapshot: implementation.readConfirmedSnapshot as DesktopDecisionCaseStore['readConfirmedSnapshot'],
    saveForm: implementation.saveForm as DesktopDecisionCaseStore['saveForm'],
    waitForProjection: implementation.waitForProjection as DesktopDecisionCaseStore['waitForProjection'],
    createSession: implementation.createSession as DesktopDecisionCaseStore['createSession'],
    openProject: implementation.openProject as DesktopDecisionCaseStore['openProject'],
    listSessions: implementation.listSessions as DesktopDecisionCaseStore['listSessions'],
    readProjection: implementation.readProjection as DesktopDecisionCaseStore['readProjection'],
    markIntegrityBlocked: implementation.markIntegrityBlocked as DesktopDecisionCaseStore['markIntegrityBlocked'],
  });
}
