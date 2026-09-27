/**
 * The version-one Desktop transport contract.  This module deliberately owns
 * only structured-clone business values; it has no Electron, filesystem,
 * runtime, or provider dependency.
 */
export const XANTHIL_DESKTOP_CONTRACT_VERSION = '1.0' as const;

export type ContractVersion = typeof XANTHIL_DESKTOP_CONTRACT_VERSION;
export type UUIDv4 = string;
export type UUIDv7 = string;

export type ContractVersionRequest = Readonly<{ contract_version: ContractVersion }>;
export type CommandRequest = ContractVersionRequest & Readonly<{ command_id: UUIDv4 }>;
export type ProjectReference = Readonly<{ project_id: UUIDv4 }>;
export type SessionReference = ProjectReference & Readonly<{ session_id: UUIDv4 }>;
export type OwnerRef = Readonly<{
  project_id: UUIDv4;
  session_id: UUIDv4;
  case_id: UUIDv4;
  revision_id: UUIDv4;
}>;
export type RevisionGuard = OwnerRef & Readonly<{ expected_row_version: string }>;
export type RevisionCommand = CommandRequest & RevisionGuard;

export type CaseFieldsInput = Readonly<{
  question_text: string;
  hypothesis_display_title: string;
  business_context: string;
  alternative_explanations: readonly string[];
}>;

export type DecisionCandidateInput = Readonly<{
  candidate_id: UUIDv4;
  title: string;
  evidence_basis: string;
  risk_or_refutation: string;
  applicability_conditions: string;
  future_validation_metric: string;
}>;

export type SaveFormInput =
  | Readonly<{ kind: 'case_fields'; fields: CaseFieldsInput }>
  | Readonly<{ kind: 'evidence_explanation'; evidence_explanation_text: string }>
  | Readonly<{
    kind: 'decision_closure';
    candidates: readonly DecisionCandidateInput[];
    route: null | 'candidate_comparison' | 'insufficient_evidence';
    insufficient_reason: null | string;
    preferred_candidate_id: null | UUIDv4;
    preferred_reason: null | string;
    disposition: 'draft' | 'saved' | 'not_adopted' | 'deferred' | 'more_evidence';
    defer_until: null | string;
  }>;

export type AssistanceDraftContent =
  | CaseFieldsInput
  | Readonly<{ evidence_explanation_text: string }>
  | Readonly<{ candidates: readonly DecisionCandidateInput[] }>;

export type ConfirmationInput = Readonly<{
  column_mapping: Readonly<{
    member_id_column: null | string;
    member_group_column: null | string;
    order_id_column: null | string;
    order_member_id_column: null | string;
    paid_at_column: null | string;
    amount_column: null | string;
    status_column: null | string;
    currency_column: null | string;
  }>;
  comparison_period: Readonly<{ start_date: string; end_date: string }>;
  current_period: Readonly<{ start_date: string; end_date: string }>;
  currency: 'CNY';
  time_zone: 'Asia/Shanghai';
  valid_statuses: readonly string[];
  issue_treatments: readonly Readonly<{ code: string; count: string; treatment: string }>[];
  selected_group_mode: 'none' | 'mapped';
  hypothesis_id: 'current_repurchase_rate_lower_than_comparison';
  method_id: 'membership_repurchase_comparison';
  method_version: '1.0';
  authority_confirmed: true;
  issues_confirmed: true;
  plan_confirmed: true;
}>;

export type SelectProjectRequest = CommandRequest;
export type ListSessionsRequest = ContractVersionRequest & ProjectReference;
export type OpenSessionRequest = ContractVersionRequest & SessionReference;
export type CreateSessionRequest = CommandRequest & ProjectReference & Readonly<{
  display_name: string;
  case_name: string;
  fields: CaseFieldsInput;
}>;
export type CreateDraftRevisionRequest = RevisionCommand;
export type InspectionConfiguration = Pick<ConfirmationInput, 'column_mapping' | 'comparison_period' | 'current_period' | 'currency' | 'time_zone' | 'valid_statuses' | 'selected_group_mode'>;
export type SelectImportFilesRequest = (ContractVersionRequest & RevisionGuard) | (ContractVersionRequest & RevisionGuard & Readonly<{ inspection_token: UUIDv4; configuration: InspectionConfiguration }>);
export type ConfirmRevisionRequest = RevisionCommand & Readonly<{
  inspection_token: UUIDv4;
  confirmation: ConfirmationInput;
}>;
export type StartAnalysisRequest = RevisionCommand & Readonly<{ confirmation_id: UUIDv4 }>;
export type CancelAnalysisRequest = RevisionCommand & Readonly<{ run_id: UUIDv7 }>;
export type PrepareAssistanceDisclosureRequest = ContractVersionRequest & RevisionGuard & Readonly<{
  action_kind: 'organize_question' | 'explain_evidence' | 'draft_candidates';
  requested_provider: string;
  requested_model: string;
}>;
export type DecideAssistanceDisclosureRequest = RevisionCommand & Readonly<{
  preview_token: UUIDv4;
  payload_sha256: string;
  decision: 'accepted' | 'refused';
  free_text_confirmed: boolean;
}>;
export type StartAssistanceRequest = RevisionCommand & Readonly<{ disclosure_id: UUIDv4 }>;
export type CancelAssistanceRequest = RevisionCommand & Readonly<{ attempt_id: UUIDv4 }>;
export type DisposeAssistanceDraftRequest = RevisionCommand & Readonly<{
  draft_id: UUIDv4;
  disposition: 'adopted' | 'rejected';
  edited_content: null | AssistanceDraftContent;
}>;
export type AcceptFindingRequest = RevisionCommand & Readonly<{ finding_id: UUIDv4 }>;
export type SaveFormRequest = RevisionCommand & Readonly<{ form: SaveFormInput }>;
export type CompleteCaseRequest = RevisionCommand & Readonly<{ acceptance_id: UUIDv4; form_id: UUIDv4 }>;
export type ExportReportRequest = CommandRequest & OwnerRef & Readonly<{ report_id: UUIDv4 }>;
export type ReadProjectionRequest = ContractVersionRequest & OwnerRef;
export type WaitForProjectionRequest = ContractVersionRequest & OwnerRef & Readonly<{ projection_token: string }>;

export type XanthilDesktopRequest =
  | SelectProjectRequest
  | ListSessionsRequest
  | OpenSessionRequest
  | CreateSessionRequest
  | CreateDraftRevisionRequest
  | SelectImportFilesRequest
  | ConfirmRevisionRequest
  | StartAnalysisRequest
  | CancelAnalysisRequest
  | PrepareAssistanceDisclosureRequest
  | DecideAssistanceDisclosureRequest
  | StartAssistanceRequest
  | CancelAssistanceRequest
  | DisposeAssistanceDraftRequest
  | AcceptFindingRequest
  | SaveFormRequest
  | CompleteCaseRequest
  | ExportReportRequest
  | ReadProjectionRequest
  | WaitForProjectionRequest;

export type DesktopFailureCode =
  | 'INVALID_REQUEST'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'STALE_REVISION'
  | 'COMMAND_CONFLICT'
  | 'VALIDATION_FAILED'
  | 'AUTHORITY_REQUIRED'
  | 'ISSUE_CONFIRMATION_REQUIRED'
  | 'BUSY'
  | 'STORE_BUSY'
  | 'RESULT_PENDING'
  | 'SCHEMA_UNSUPPORTED'
  | 'INTEGRITY_BLOCKED'
  | 'SOURCE_CHANGED'
  | 'TOOLCHAIN_UNAVAILABLE'
  | 'CALCULATION_FAILED'
  | 'VALIDATION_MISMATCH'
  | 'RUN_ARTIFACT_FAILED'
  | 'PUBLICATION_FAILED'
  | 'PAYLOAD_STALE'
  | 'PROVIDER_UNAVAILABLE'
  | 'CANCELLED'
  | 'DEADLINE_EXCEEDED'
  | 'INTERRUPTED';

export type DesktopFailure = Readonly<{
  code: DesktopFailureCode;
  message: string;
  what_did_not_happen: string;
  preserved_authority: string;
  recovery_action: string;
}>;

export type DesktopResult<Value> = Readonly<{ ok: true; value: Value }> | Readonly<{ ok: false; error: DesktopFailure }>;

export type SessionSummary = Readonly<{
  session_id: UUIDv4;
  display_name: string;
  mode: 'professional';
  case_id: UUIDv4;
  current_revision_id: UUIDv4;
  created_at: string;
}>;

export type ProjectOpenValue = Readonly<{
  project: Readonly<{
    project_id: UUIDv4;
    display_name: string;
    schema_version: '1.0';
    write_state: 'ready';
  }>;
  sessions: readonly SessionSummary[];
}>;

export type DesktopProjection = Readonly<{
  contract_version: ContractVersion;
  projection_token: string;
  project: Readonly<{ project_id: UUIDv4; display_name: string; schema_version: '1.0'; write_state: 'ready' }> | null;
  session: Readonly<{ session_id: UUIDv4; project_id: UUIDv4; display_name: string; mode: 'professional'; case_id: UUIDv4; current_revision_id: UUIDv4; created_at: string }> | null;
  revision: Readonly<{ revision_id: UUIDv4; revision_sequence: string; state: string; case_name: string; question_text: string; hypothesis_display_title: string; business_context: string; alternative_explanations: readonly string[]; evidence_explanation_text: null | string; previous_revision_id: null | UUIDv4; snapshot_id: null | UUIDv4; confirmation_id: null | UUIDv4; current_finding_id: null | UUIDv4; current_acceptance_id: null | UUIDv4; current_closure_id: null | UUIDv4; current_report_id: null | UUIDv4; integrity_state: string; created_at: string; updated_at: string; row_version: string }> | null;
  confirmation: Readonly<{ confirmation_id: UUIDv4; snapshot_id: UUIDv4; column_mapping: ConfirmationInput['column_mapping']; comparison_period: ConfirmationInput['comparison_period']; current_period: ConfirmationInput['current_period']; currency: 'CNY'; time_zone: 'Asia/Shanghai'; valid_statuses: readonly string[]; issue_treatments: ConfirmationInput['issue_treatments']; selected_group_mode: 'none' | 'mapped'; hypothesis_id: 'current_repurchase_rate_lower_than_comparison'; method_id: 'membership_repurchase_comparison'; method_version: '1.0'; authority_confirmed_at: string; issues_confirmed_at: string; plan_confirmed_at: string }> | null;
  snapshot: Readonly<{ snapshot_id: UUIDv4; members: Readonly<{ display_name: string; sha256: string; byte_length: string }>; orders: Readonly<{ display_name: string; sha256: string; byte_length: string }>; included_member_count: string; excluded_member_count: string; included_order_count: string; excluded_order_count: string; treatment_basis: string; confirmed_at: string }> | null;
  runs: readonly Readonly<{ run_id: UUIDv7; profile_id: string; method_id: string; method_version: string; code_identity: string; run_contract_version: string; status: string; started_at: string; deadline_at: string; ended_at: null | string; terminal_reason: null | string; aggregate_id: null | UUIDv4; evidence_available: boolean }>[];
  disclosures: readonly Readonly<{ disclosure_id: UUIDv4; action_kind: string; categories: readonly string[]; aggregate_refs: readonly string[]; payload_sha256: string; requested_provider: string; requested_model: string; decision: string; free_text_confirmed_at: null | string; decided_at: null | string; created_at: string }>[];
  attempts: readonly Readonly<{ attempt_id: UUIDv4; disclosure_id: UUIDv4; action_kind: string; profile_id: string; runtime_id: string; runtime_version: string; adapter_id: string; adapter_version: string; requested_provider: string; requested_model: string; actual_provider: null | string; actual_model: null | string; status: string; started_at: string; deadline_at: string; ended_at: null | string; terminal_reason: null | string; draft_id: null | UUIDv4 }>[];
  assistance_drafts: readonly Readonly<{ draft_id: UUIDv4; attempt_id: UUIDv4; draft_kind: string; generated_content: AssistanceDraftContent; edited_content: null | AssistanceDraftContent; disposition: string; target_form: null | string; decided_at: null | string; created_at: string }>[];
  findings: readonly Readonly<{ finding_id: UUIDv4; run_id: UUIDv7; aggregate_id: UUIDv4; judgment: string; metrics: string; supporting_evidence: readonly string[]; refutation: string; limitations: readonly string[]; evidence_refs: readonly string[]; method_id: string; method_version: string; created_at: string }>[];
  acceptances: readonly Readonly<{ acceptance_id: UUIDv4; finding_id: UUIDv4; action: string; accepted_at: string }>[];
  forms: readonly Readonly<{ form_id: UUIDv4; form_sequence: string; candidates: readonly DecisionCandidateInput[]; route: null | 'candidate_comparison' | 'insufficient_evidence'; insufficient_reason: null | string; preferred_candidate_id: null | UUIDv4; preferred_reason: null | string; disposition: string; disposition_at: null | string; defer_until: null | string; created_at: string; updated_at: string }>[];
  closures: readonly Readonly<{ closure_id: UUIDv4; acceptance_id: UUIDv4; form_id: UUIDv4; route: string; completed_at: string }>[];
  reports: readonly Readonly<{ report_id: UUIDv4; finding_id: UUIDv4; acceptance_id: null | UUIDv4; closure_id: null | UUIDv4; version_sequence: string; state: string; markdown_sha256: string; markdown_byte_length: string; html_sha256: string; html_byte_length: string; source: string; evidence_refs: readonly string[]; created_at: string; review_content: null | Readonly<{ markdown_text: string; evidence: readonly Readonly<{ evidence_ref: string; title: string; media_type: 'text/plain' | 'application/json'; content: string }>[] }> }>[];
  capabilities: Readonly<{
    can_create_draft_revision: boolean;
    can_select_import: boolean;
    can_confirm_revision: boolean;
    can_start_analysis: boolean;
    can_cancel_analysis: boolean;
    can_prepare_assistance: boolean;
    can_start_assistance: boolean;
    can_cancel_assistance: boolean;
    can_dispose_assistance_draft: boolean;
    can_accept_finding: boolean;
    can_save_case_fields: boolean;
    can_save_evidence_explanation: boolean;
    can_save_decision_closure: boolean;
    can_complete_case: boolean;
    can_export_report: boolean;
  }>;
}>;

export type ImportInspection = Readonly<{
  inspection_token: UUIDv4;
  evaluation: Readonly<{ status: 'unconfigured' }> | Readonly<{ status: 'evaluated'; configuration: InspectionConfiguration }>;
  members: Readonly<{ display_name: string; sha256: string; byte_length: string; row_count: string; column_names: readonly string[] }>;
  orders: Readonly<{ display_name: string; sha256: string; byte_length: string; row_count: string; column_names: readonly string[] }>;
  column_mapping: Readonly<{ member_id_column: readonly string[]; member_group_column: readonly string[]; order_id_column: readonly string[]; order_member_id_column: readonly string[]; paid_at_column: readonly string[]; amount_column: readonly string[]; status_column: readonly string[]; currency_column: readonly string[] }>;
  blocking_issues: readonly Readonly<{ code: string; count: string; treatment_options: readonly string[] }>[];
  reviewable_issues: readonly Readonly<{ code: string; count: string; treatment_options: readonly string[] }>[];
  period_controls: Readonly<{ minimum_date: string | null; maximum_date: string | null; allowed_time_zone: 'Asia/Shanghai'; equal_duration_required: true }>;
  status_controls: Readonly<{ observed_statuses: readonly string[]; selected_valid_statuses: readonly string[] }>;
}>;

export type DisclosurePreview = Readonly<{
  preview_token: UUIDv4;
  action_kind: 'organize_question' | 'explain_evidence' | 'draft_candidates';
  categories: readonly string[];
  aggregate_refs: readonly string[];
  payload_text: string;
  payload_sha256: string;
  requested_provider: string;
  requested_model: string;
  irretractability_notice: string;
  cost_notice: null | string;
  free_text_present: boolean;
}>;

export type ExportValue = Readonly<{status:'already_recorded';report_id:UUIDv4}> | Readonly<{
  status:'written';
  report_id: UUIDv4;
  file_name: string;
  media_type: 'text/html;charset=utf-8'|'text/markdown;charset=utf-8';
  sha256: string;
  byte_length: string;
}>;

export interface XanthilDesktopApi {
  selectProject(request: SelectProjectRequest): Promise<DesktopResult<ProjectOpenValue>>;
  listSessions(request: ListSessionsRequest): Promise<DesktopResult<readonly SessionSummary[]>>;
  openSession(request: OpenSessionRequest): Promise<DesktopResult<DesktopProjection>>;
  createSession(request: CreateSessionRequest): Promise<DesktopResult<DesktopProjection>>;
  createDraftRevision(request: CreateDraftRevisionRequest): Promise<DesktopResult<DesktopProjection>>;
  selectImportFiles(request: SelectImportFilesRequest): Promise<DesktopResult<ImportInspection>>;
  confirmRevision(request: ConfirmRevisionRequest): Promise<DesktopResult<DesktopProjection>>;
  startAnalysis(request: StartAnalysisRequest): Promise<DesktopResult<DesktopProjection>>;
  cancelAnalysis(request: CancelAnalysisRequest): Promise<DesktopResult<DesktopProjection>>;
  prepareAssistanceDisclosure(request: PrepareAssistanceDisclosureRequest): Promise<DesktopResult<DisclosurePreview>>;
  decideAssistanceDisclosure(request: DecideAssistanceDisclosureRequest): Promise<DesktopResult<DesktopProjection>>;
  startAssistance(request: StartAssistanceRequest): Promise<DesktopResult<DesktopProjection>>;
  cancelAssistance(request: CancelAssistanceRequest): Promise<DesktopResult<DesktopProjection>>;
  disposeAssistanceDraft(request: DisposeAssistanceDraftRequest): Promise<DesktopResult<DesktopProjection>>;
  acceptFinding(request: AcceptFindingRequest): Promise<DesktopResult<DesktopProjection>>;
  saveForm(request: SaveFormRequest): Promise<DesktopResult<DesktopProjection>>;
  completeCase(request: CompleteCaseRequest): Promise<DesktopResult<DesktopProjection>>;
  exportReport(request: ExportReportRequest): Promise<DesktopResult<ExportValue>>;
  readProjection(request: ReadProjectionRequest): Promise<DesktopResult<DesktopProjection>>;
  waitForProjection(request: WaitForProjectionRequest): Promise<DesktopResult<DesktopProjection>>;
}

export type XanthilDesktopMethod = keyof XanthilDesktopApi;
export type XanthilDesktopRequestFor<Method extends XanthilDesktopMethod> = Parameters<XanthilDesktopApi[Method]>[0];

type InputRecord = { readonly [key: string]: unknown };

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA_256 = /^[0-9a-f]{64}$/;
const POSITIVE_DECIMAL = /^(?:[1-9][0-9]*)$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function invalidRequest(): never {
  throw new Error('INVALID_REQUEST');
}

function isPlainRecord(value: unknown): value is InputRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactRecord(value: unknown, keys: readonly string[]): InputRecord {
  if (!isPlainRecord(value)) invalidRequest();
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== keys.length) invalidRequest();
  for (const key of keys) if (!Object.hasOwn(value, key)) invalidRequest();
  return value;
}

function stringValue(value: unknown, nonEmpty = false): string {
  if (typeof value !== 'string' || (nonEmpty && value.length === 0)) invalidRequest();
  return value;
}

function uuidV4(value: unknown): UUIDv4 {
  const id = stringValue(value, true);
  if (!UUID_V4.test(id)) invalidRequest();
  return id;
}

function uuidV7(value: unknown): UUIDv7 {
  const id = stringValue(value, true);
  if (!UUID_V7.test(id)) invalidRequest();
  return id;
}

function sha256(value: unknown): string {
  const hash = stringValue(value, true);
  if (!SHA_256.test(hash)) invalidRequest();
  return hash;
}

function positiveDecimal(value: unknown): string {
  const decimal = stringValue(value, true);
  if (!POSITIVE_DECIMAL.test(decimal)) invalidRequest();
  return decimal;
}

function isoDate(value: unknown): string {
  const date = stringValue(value, true);
  if (!ISO_DATE.test(date)) invalidRequest();
  return date;
}

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) invalidRequest();
  for (const item of value) stringValue(item);
  return value;
}

function contractVersion(value: InputRecord): void {
  if (value.contract_version !== XANTHIL_DESKTOP_CONTRACT_VERSION) invalidRequest();
}

function owner(value: InputRecord): void {
  uuidV4(value.project_id);
  uuidV4(value.session_id);
  uuidV4(value.case_id);
  uuidV4(value.revision_id);
}

function revisionGuard(value: InputRecord): void {
  owner(value);
  positiveDecimal(value.expected_row_version);
}

function revisionCommand(value: InputRecord): void {
  contractVersion(value);
  uuidV4(value.command_id);
  revisionGuard(value);
}

function caseFields(value: unknown): void {
  const fields = exactRecord(value, ['question_text', 'hypothesis_display_title', 'business_context', 'alternative_explanations']);
  stringValue(fields.question_text);
  stringValue(fields.hypothesis_display_title);
  stringValue(fields.business_context);
  // Predicate only: preserve meaningful text and its order exactly as supplied.
  if (stringArray(fields.alternative_explanations).some(item => !/[^\p{White_Space}]/u.test(item))) invalidRequest();
}

function decisionCandidate(value: unknown): void {
  const candidate = exactRecord(value, ['candidate_id', 'title', 'evidence_basis', 'risk_or_refutation', 'applicability_conditions', 'future_validation_metric']);
  uuidV4(candidate.candidate_id);
  stringValue(candidate.title);
  stringValue(candidate.evidence_basis);
  stringValue(candidate.risk_or_refutation);
  stringValue(candidate.applicability_conditions);
  stringValue(candidate.future_validation_metric);
}

function nullableString(value: unknown): void {
  if (value !== null) stringValue(value);
}

function nullableUuidV4(value: unknown): void {
  if (value !== null) uuidV4(value);
}

function oneOf(value: unknown, values: readonly string[]): void {
  if (typeof value !== 'string' || !values.includes(value)) invalidRequest();
}

function saveForm(value: unknown): void {
  if (!isPlainRecord(value) || typeof value.kind !== 'string') invalidRequest();
  switch (value.kind) {
    case 'case_fields': {
      const form = exactRecord(value, ['kind', 'fields']);
      caseFields(form.fields);
      return;
    }
    case 'evidence_explanation': {
      const form = exactRecord(value, ['kind', 'evidence_explanation_text']);
      stringValue(form.evidence_explanation_text);
      return;
    }
    case 'decision_closure': {
      const form = exactRecord(value, ['kind', 'candidates', 'route', 'insufficient_reason', 'preferred_candidate_id', 'preferred_reason', 'disposition', 'defer_until']);
      if (!Array.isArray(form.candidates)) invalidRequest();
      for (const candidate of form.candidates) decisionCandidate(candidate);
      if (form.route !== null) oneOf(form.route, ['candidate_comparison', 'insufficient_evidence']);
      nullableString(form.insufficient_reason);
      nullableUuidV4(form.preferred_candidate_id);
      nullableString(form.preferred_reason);
      oneOf(form.disposition, ['draft', 'saved', 'not_adopted', 'deferred', 'more_evidence']);
      if (form.defer_until !== null) isoDate(form.defer_until);
      return;
    }
    default:
      invalidRequest();
  }
}

function assistanceDraftContent(value: unknown): void {
  if (!isPlainRecord(value)) invalidRequest();
  const keys = Object.keys(value).sort();
  if (keys.length === 4 && keys.join('|') === 'alternative_explanations|business_context|hypothesis_display_title|question_text') {
    caseFields(value);
    return;
  }
  if (keys.length === 1 && keys[0] === 'evidence_explanation_text') {
    stringValue(value.evidence_explanation_text);
    return;
  }
  if (keys.length === 1 && keys[0] === 'candidates') {
    if (!Array.isArray(value.candidates)) invalidRequest();
    for (const candidate of value.candidates) decisionCandidate(candidate);
    return;
  }
  invalidRequest();
}

function confirmation(value: unknown): void {
  const input = exactRecord(value, ['column_mapping', 'comparison_period', 'current_period', 'currency', 'time_zone', 'valid_statuses', 'issue_treatments', 'selected_group_mode', 'hypothesis_id', 'method_id', 'method_version', 'authority_confirmed', 'issues_confirmed', 'plan_confirmed']);
  inspectionConfiguration({ column_mapping: input.column_mapping, comparison_period: input.comparison_period, current_period: input.current_period, currency: input.currency, time_zone: input.time_zone, valid_statuses: input.valid_statuses, selected_group_mode: input.selected_group_mode });
  if (!Array.isArray(input.issue_treatments)) invalidRequest();
  for (const treatment of input.issue_treatments) {
    const item = exactRecord(treatment, ['code', 'count', 'treatment']);
    stringValue(item.code, true);
    positiveDecimal(item.count);
    stringValue(item.treatment, true);
  }
  if (input.hypothesis_id !== 'current_repurchase_rate_lower_than_comparison') invalidRequest();
  if (input.method_id !== 'membership_repurchase_comparison' || input.method_version !== '1.0') invalidRequest();
  if (input.authority_confirmed !== true || input.issues_confirmed !== true || input.plan_confirmed !== true) invalidRequest();
}

function inspectionConfiguration(value: unknown): void {
  const input = exactRecord(value, ['column_mapping', 'comparison_period', 'current_period', 'currency', 'time_zone', 'valid_statuses', 'selected_group_mode']);
  const mapping = exactRecord(input.column_mapping, ['member_id_column', 'member_group_column', 'order_id_column', 'order_member_id_column', 'paid_at_column', 'amount_column', 'status_column', 'currency_column']);
  for (const key of Object.keys(mapping)) if (mapping[key] !== null) stringValue(mapping[key], true);
  for (const period of [input.comparison_period, input.current_period]) {
    const dates = exactRecord(period, ['start_date', 'end_date']);
    isoDate(dates.start_date);
    isoDate(dates.end_date);
  }
  if (input.currency !== 'CNY' || input.time_zone !== 'Asia/Shanghai') invalidRequest();
  stringArray(input.valid_statuses);
  oneOf(input.selected_group_mode, ['none', 'mapped']);
}

function validatedRequest(method: string, value: unknown): XanthilDesktopRequest {
  switch (method) {
    case 'selectProject': {
      const request = exactRecord(value, ['contract_version', 'command_id']);
      contractVersion(request); uuidV4(request.command_id); return request as SelectProjectRequest;
    }
    case 'listSessions': {
      const request = exactRecord(value, ['contract_version', 'project_id']);
      contractVersion(request); uuidV4(request.project_id); return request as ListSessionsRequest;
    }
    case 'openSession': {
      const request = exactRecord(value, ['contract_version', 'project_id', 'session_id']);
      contractVersion(request); uuidV4(request.project_id); uuidV4(request.session_id); return request as OpenSessionRequest;
    }
    case 'createSession': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'display_name', 'case_name', 'fields']);
      contractVersion(request); uuidV4(request.command_id); uuidV4(request.project_id); stringValue(request.display_name, true); stringValue(request.case_name, true); caseFields(request.fields); return request as CreateSessionRequest;
    }
    case 'createDraftRevision': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version']);
      revisionCommand(request); return request as CreateDraftRevisionRequest;
    }
    case 'selectImportFiles': {
      const configured = isPlainRecord(value) && (Object.hasOwn(value, 'inspection_token') || Object.hasOwn(value, 'configuration'));
      const request = exactRecord(value, ['contract_version', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', ...(configured ? ['inspection_token', 'configuration'] : [])]);
      if (configured) { uuidV4(request.inspection_token); inspectionConfiguration(request.configuration); }
      contractVersion(request); revisionGuard(request); return request as SelectImportFilesRequest;
    }
    case 'confirmRevision': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'inspection_token', 'confirmation']);
      revisionCommand(request); uuidV4(request.inspection_token); confirmation(request.confirmation); return request as ConfirmRevisionRequest;
    }
    case 'startAnalysis': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'confirmation_id']);
      revisionCommand(request); uuidV4(request.confirmation_id); return request as StartAnalysisRequest;
    }
    case 'cancelAnalysis': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'run_id']);
      revisionCommand(request); uuidV7(request.run_id); return request as CancelAnalysisRequest;
    }
    case 'prepareAssistanceDisclosure': {
      const request = exactRecord(value, ['contract_version', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'action_kind', 'requested_provider', 'requested_model']);
      contractVersion(request); revisionGuard(request); oneOf(request.action_kind, ['organize_question', 'explain_evidence', 'draft_candidates']); stringValue(request.requested_provider, true); stringValue(request.requested_model, true); return request as PrepareAssistanceDisclosureRequest;
    }
    case 'decideAssistanceDisclosure': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'preview_token', 'payload_sha256', 'decision', 'free_text_confirmed']);
      revisionCommand(request); uuidV4(request.preview_token); sha256(request.payload_sha256); oneOf(request.decision, ['accepted', 'refused']); if (typeof request.free_text_confirmed !== 'boolean') invalidRequest(); return request as DecideAssistanceDisclosureRequest;
    }
    case 'startAssistance': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'disclosure_id']);
      revisionCommand(request); uuidV4(request.disclosure_id); return request as StartAssistanceRequest;
    }
    case 'cancelAssistance': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'attempt_id']);
      revisionCommand(request); uuidV4(request.attempt_id); return request as CancelAssistanceRequest;
    }
    case 'disposeAssistanceDraft': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'draft_id', 'disposition', 'edited_content']);
      revisionCommand(request); uuidV4(request.draft_id); oneOf(request.disposition, ['adopted', 'rejected']); if (request.edited_content !== null) assistanceDraftContent(request.edited_content); return request as DisposeAssistanceDraftRequest;
    }
    case 'acceptFinding': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'finding_id']);
      revisionCommand(request); uuidV4(request.finding_id); return request as AcceptFindingRequest;
    }
    case 'saveForm': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'form']);
      revisionCommand(request); saveForm(request.form); return request as SaveFormRequest;
    }
    case 'completeCase': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'expected_row_version', 'acceptance_id', 'form_id']);
      revisionCommand(request); uuidV4(request.acceptance_id); uuidV4(request.form_id); return request as CompleteCaseRequest;
    }
    case 'exportReport': {
      const request = exactRecord(value, ['contract_version', 'command_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'report_id']);
      contractVersion(request); uuidV4(request.command_id); owner(request); uuidV4(request.report_id); return request as ExportReportRequest;
    }
    case 'readProjection': {
      const request = exactRecord(value, ['contract_version', 'project_id', 'session_id', 'case_id', 'revision_id']);
      contractVersion(request); owner(request); return request as ReadProjectionRequest;
    }
    case 'waitForProjection': {
      const request = exactRecord(value, ['contract_version', 'project_id', 'session_id', 'case_id', 'revision_id', 'projection_token']);
      contractVersion(request); owner(request); stringValue(request.projection_token, true); return request as WaitForProjectionRequest;
    }
    default:
      return invalidRequest();
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Validates exactly one named public request.  It does not select a channel,
 * dispatch a command, or perform any business effect.
 */
export function validateXanthilDesktopRequest<Method extends XanthilDesktopMethod>(method: Method, value: unknown): XanthilDesktopRequestFor<Method>;
export function validateXanthilDesktopRequest(method: string, value: unknown): XanthilDesktopRequest;
export function validateXanthilDesktopRequest(method: string, value: unknown): XanthilDesktopRequest {
  const request = validatedRequest(method, value);
  return deepFreeze(structuredClone(request)) as XanthilDesktopRequest;
}
