import { createHash, randomBytes } from 'node:crypto';

import { createLocalAnalysisDomain } from '../product-core/local-analysis.ts';
import type {
  AnalysisProposal,
  ArtifactDescriptor,
  Finding,
  MemberRepurchaseMetrics,
  PlainRecord,
  RunManifest,
} from '../product-core/local-analysis.ts';
import {
  defineAgentAnalysisRuntime,
  defineLocalAnalysisExecution,
  defineRunArtifactStore,
} from '../ports/local-analysis.ts';
import type {
  AgentAnalysisRuntime,
  AgentAnalysisSession,
  AnalysisAsset,
  AnalysisEnvelope,
  AnalysisSource,
  ConfirmedContract,
  ExecutionTool,
  LocalAnalysisExecution,
  ModelIdentity,
  RuntimeReadiness,
  RunArtifactStore,
} from '../ports/local-analysis.ts';

export type DeadlineHandle = Readonly<{ cancel(): unknown }>;
export type DeadlineScheduler = Readonly<{ schedule(input: Readonly<{ at_epoch_ms: number; callback(): undefined }>): DeadlineHandle }>;
export type LocalAnalysisApplicationDependencies = Readonly<{
  agentRuntime: AgentAnalysisRuntime;
  localAnalysisExecution: LocalAnalysisExecution;
  runArtifactStore: RunArtifactStore;
  model: ModelIdentity;
  profile: Readonly<{ id: string }>;
  clock(): Date;
  deadlineScheduler: DeadlineScheduler;
}>;
export type LocalAnalysisSuccess = Readonly<{ metrics: MemberRepurchaseMetrics; finding: Finding; run: RunManifest }>;
export type LocalAnalysisTerminal = LocalAnalysisSuccess | Readonly<{ run: RunManifest }> | Readonly<{ status: 'cancelled' }>;
export type LocalAnalysisHandle = Readonly<{
  discover(): Promise<AnalysisProposal>;
  confirm(candidate: unknown): Promise<LocalAnalysisTerminal | undefined>;
  cancel(): Promise<LocalAnalysisTerminal | undefined>;
}>;
export type LocalAnalysisApplication = Readonly<{ start(input: unknown): Promise<LocalAnalysisHandle> }>;

type XanthilError = Error & { code: string; stage: string | undefined };
type MutableToolState = {
  index: number;
  correlations: Set<string>;
  sqlResult: MemberRepurchaseMetrics | undefined;
  artifacts: ArtifactDescriptor[];
};

const modelIdentity = Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
const fixtureIdentity = Object.freeze({ version: 'member-orders-v1', kind: 'csv', sha256: 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0', path: 'member-orders-v1.csv' });
const sourceDescriptor = Object.freeze({ source_id: 'SRC-001', kind: 'csv', path: fixtureIdentity.path, sha256: fixtureIdentity.sha256, byte_size: 530, fixture_version: fixtureIdentity.version });
const approvedTools = Object.freeze(['profile_approved_fixture', 'calculate_member_repurchase_metrics', 'validate_member_repurchase_metrics']);
const manifestArtifactOrder = Object.freeze(['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE']);
const approvedQuestion = 'Do recent member operations show a problem?';
const clarifiedQuestion = 'Between 2026-08-08 and 2026-08-14, did the window-local repurchase-member rate decline versus 2026-08-01 through 2026-08-07?';
const productIdentity = Object.freeze({ id: 'xanthil', version: '1.0.0' });
const semverPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*))(?:\.(?:(?:0|[1-9]\d*)|(?:\d*[A-Za-z-][0-9A-Za-z-]*)))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function fail(code: string, stage?: string): never {
  const error: XanthilError = Object.assign(new Error(code), { code, stage });
  throw error;
}

function isRecord(value: unknown): value is PlainRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function closedObject(value: unknown, keys: readonly string[], code = 'VALIDATION_FAILED'): asserts value is PlainRecord {
  if (!isRecord(value)) fail(code);
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key) || value[key] === null || value[key] === undefined) || keys.some((key) => !Object.hasOwn(value, key))) fail(code);
}

function canonical(value: unknown): string | undefined {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function expectedProposal(): AnalysisProposal {
  return {
    schema_version: '1.0',
    original_question: approvedQuestion,
    question: clarifiedQuestion,
    objective: 'Compare the recent and baseline window-local repurchase-member rates using only fixture version member-orders-v1.',
    source_ids: ['SRC-001'],
    fixture: {
      source_id: 'SRC-001', version: fixtureIdentity.version, kind: fixtureIdentity.kind, path: fixtureIdentity.path, sha256: fixtureIdentity.sha256, byte_size: 530,
      columns: ['order_id', 'member_id', 'ordered_on'], date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' },
    },
    time_windows: [
      { window_id: 'baseline', start_date: '2026-08-01', end_date: '2026-08-07' },
      { window_id: 'recent', start_date: '2026-08-08', end_date: '2026-08-14' },
    ],
    metrics: [
      { metric_id: 'order_count', display_name: 'Order count', definition: 'count(distinct order_id)', grain: 'synthetic_order', population: 'orders_in_the_applicable_window', unit: 'orders' },
      { metric_id: 'active_member_count', display_name: 'Active-member count', definition: 'count(distinct member_id with at least one distinct order in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' },
      { metric_id: 'repeat_purchaser_count', display_name: 'Repeat-purchaser count', definition: 'count(distinct member_id with at least two distinct orders in the window)', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'members' },
      { metric_id: 'repurchase_member_rate', display_name: 'Repurchase-member rate', definition: 'repeat_purchaser_count / active_member_count', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'ratio' },
      { metric_id: 'repurchase_member_rate_delta_pp', display_name: 'Repurchase-member rate delta', definition: '(recent repurchase_member_rate - baseline repurchase_member_rate) * 100', grain: 'synthetic_order', population: 'members_with_orders_in_the_applicable_window', unit: 'percentage_points' },
    ],
    signal_rule: { comparison: 'recent_repurchase_member_rate_lt_baseline', supported_status: 'supported' },
    output_requirements: { finding: true, evidence: true, summary: true, canonical_sql: true, canonical_python_validation: true, structured_outputs: ['O-001', 'O-002'] },
    constraints: { synthetic_fixture_only: true, raw_row_model_egress: false, approved_tools_only: [...approvedTools], network_tools: false, generic_code_or_filesystem: false, decision_recommendation_or_action: false },
  };
}

function discoveryContext(): PlainRecord {
  const proposal = expectedProposal();
  return freezeDeep({
    protocol: { schema_version: '1.0', response_kind: 'analysis_proposal' },
    source: proposal.fixture,
    comparison: {
      original_question: proposal.original_question,
      question: proposal.question,
      objective: proposal.objective,
      time_windows: proposal.time_windows,
      metrics: proposal.metrics,
      signal_rule: proposal.signal_rule,
    },
    delivery: {
      output_requirements: proposal.output_requirements,
      constraints: proposal.constraints,
      proposal_field_order: [
        'schema_version', 'original_question', 'question', 'objective', 'source_ids', 'fixture',
        'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints',
      ],
    },
  });
}

function findingContext(): PlainRecord {
  return freezeDeep({
    protocol: { schema_version: '1.0', response_kind: 'finding_envelope' },
    identity: { finding_id: 'F-001', evidence_ids: ['E-001'] },
    interpretation: {
      statement: 'The window-local repurchase-member rate declined in this synthetic fixture.',
      required_status: 'supported',
      required_limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'],
      prohibited_categories: [
        'causal', 'statistical_significance', 'member_harm', 'recommendation', 'action', 'decision', 'prescriptive', 'real_world',
      ],
    },
  });
}

function confirmedContract(proposal: AnalysisProposal, run_id: string, confirmed_at: string): ConfirmedContract {
  const { fixture, schema_version, ...contract } = proposal;
  return { schema_version, run_id, confirmed_at, ...contract };
}

function uuidV7(clock: () => Date): string {
  const date = clock();
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) fail('VALIDATION_FAILED');
  let timestamp = date.getTime();
  const bytes = randomBytes(16);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp & 0xff;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  bytes[8] = 0x80 | (bytes[8] & 0x3f);
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function validateDeadlineScheduler(value: unknown): DeadlineScheduler {
  if (!isRecord(value) || !Object.isFrozen(value)) fail('VALIDATION_FAILED');
  if (Object.getOwnPropertySymbols(value).length !== 0 || !sameValue(Object.keys(value), ['schedule']) || typeof value.schedule !== 'function') fail('VALIDATION_FAILED');
  if (!isDeadlineScheduler(value)) fail('VALIDATION_FAILED');
  return value;
}

function isDeadlineScheduler(value: PlainRecord): value is DeadlineScheduler {
  return typeof value.schedule === 'function';
}

function closedFrozenResult(value: unknown, keys: readonly string[], code: string): PlainRecord {
  if (!isRecord(value) || !Object.isFrozen(value) || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  closedObject(value, keys, code);
  return value;
}

function isValidUtcRfc3339(value: unknown): value is string {
  const match = typeof value === 'string' && value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,9})?Z$/);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  return new Date(value).toISOString().startsWith(match[1]);
}

function validateRunRootPreflight(value: unknown): void {
  const result = closedFrozenResult(value, ['ready'], 'RUN_ROOT_UNSAFE');
  if (result.ready !== true) fail('RUN_ROOT_UNSAFE');
}

function validateFixturePreflight(value: unknown): Readonly<{ read_at: string }> & PlainRecord {
  const result = closedFrozenResult(value, ['source_id', 'kind', 'path', 'sha256', 'byte_size', 'fixture_version', 'read_at'], 'FIXTURE_MISMATCH');
  const { read_at, ...descriptor } = result;
  if (!sameValue(descriptor, sourceDescriptor) || !isValidUtcRfc3339(read_at)) fail('FIXTURE_MISMATCH');
  return resultWithReadAt(result);
}

function resultWithReadAt(value: PlainRecord): PlainRecord & { read_at: string } {
  if (!hasReadAt(value)) fail('FIXTURE_MISMATCH');
  return value;
}

function hasReadAt(value: PlainRecord): value is PlainRecord & { read_at: string } {
  return typeof value.read_at === 'string';
}

function validateRuntimeReadiness(value: unknown, requested: ModelIdentity): RuntimeReadiness {
  const result = closedFrozenResult(value, ['runtime', 'adapter', 'model'], 'MODEL_UNAVAILABLE');
  for (const node of ['runtime', 'adapter'] as const) {
    const provenance = closedFrozenResult(result[node], ['id', 'version'], 'MODEL_UNAVAILABLE');
    if (typeof provenance.id !== 'string' || provenance.id.length === 0 || typeof provenance.version !== 'string' || !semverPattern.test(provenance.version)) fail('MODEL_UNAVAILABLE');
  }
  const model = closedFrozenResult(result.model, ['provider', 'model_id'], 'MODEL_UNAVAILABLE');
  if (typeof model.provider !== 'string' || model.provider.length === 0 || typeof model.model_id !== 'string' || model.model_id.length === 0 || !sameValue(model, requested)) fail('MODEL_UNAVAILABLE');
  return result as RuntimeReadiness;
}

function validateProfileIdentity(value: unknown): Readonly<{ id: string }> {
  closedObject(value, ['id']);
  if (typeof value.id !== 'string' || value.id.length === 0) fail('PROFILE_INVALID');
  return value as Readonly<{ id: string }>;
}

function validateDeadlineHandle(value: unknown): DeadlineHandle {
  const result = closedFrozenResult(value, ['cancel'], 'VALIDATION_FAILED');
  if (typeof result.cancel !== 'function' || result.cancel.length !== 0) fail('VALIDATION_FAILED');
  if (!deadlineHandle(result)) fail('VALIDATION_FAILED');
  return result;
}

function deadlineHandle(value: PlainRecord): value is PlainRecord & DeadlineHandle {
  return typeof value.cancel === 'function';
}

function validateDependencies(dependencies: unknown): LocalAnalysisApplicationDependencies {
  closedObject(dependencies, ['agentRuntime', 'localAnalysisExecution', 'runArtifactStore', 'model', 'profile', 'clock', 'deadlineScheduler']);
  closedObject(dependencies.model, ['provider', 'model_id'], 'MODEL_UNAVAILABLE');
  if (!sameValue(dependencies.model, modelIdentity) || typeof dependencies.clock !== 'function') fail('MODEL_UNAVAILABLE');
  return {
    agentRuntime: defineAgentAnalysisRuntime(dependencies.agentRuntime),
    localAnalysisExecution: defineLocalAnalysisExecution(dependencies.localAnalysisExecution),
    runArtifactStore: defineRunArtifactStore(dependencies.runArtifactStore),
    model: freeze({ ...modelIdentity }),
    profile: validateProfileIdentity(dependencies.profile),
    clock: clockFunction(dependencies.clock),
    deadlineScheduler: validateDeadlineScheduler(dependencies.deadlineScheduler),
  };
}

function clockFunction(value: unknown): () => Date {
  if (!isClockFunction(value)) fail('MODEL_UNAVAILABLE');
  return value;
}

function isClockFunction(value: unknown): value is () => Date {
  return typeof value === 'function';
}

function validateStartInput(input: unknown): AnalysisSource {
  closedObject(input, ['question', 'source']);
  if (input.question !== approvedQuestion) fail('VALIDATION_FAILED');
  closedObject(input.source, ['version', 'kind', 'sha256', 'path'], 'SOURCE_BOUNDARY_VIOLATION');
  if (typeof input.source.path !== 'string' || input.source.path.startsWith('/') || input.source.path.split('/').includes('..')) fail('SOURCE_BOUNDARY_VIOLATION');
  if (input.source.path !== fixtureIdentity.path || input.source.kind !== fixtureIdentity.kind) fail('SOURCE_BOUNDARY_VIOLATION');
  if (input.source.sha256 !== fixtureIdentity.sha256) fail('FIXTURE_MISMATCH');
  if (input.source.version !== fixtureIdentity.version) fail('CONTRACT_VERSION_UNSUPPORTED');
  return freeze({ ...fixtureIdentity });
}

function validateProfile(value: unknown): PlainRecord {
  const expected = { source_id: 'SRC-001', fixture_version: fixtureIdentity.version, columns: ['order_id', 'member_id', 'ordered_on'], row_count: 20, date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' } };
  if (!sameValue(value, expected)) fail('VALIDATION_FAILED', 'validation');
  if (!isRecord(value)) fail('VALIDATION_FAILED', 'validation');
  return value;
}

function validateEnvelope(value: AnalysisEnvelope, calculationKind: string, asset: Omit<AnalysisAsset, 'bytes'>): { result: MemberRepurchaseMetrics; canonical_asset: AnalysisAsset } {
  closedObject(value, ['result', 'canonical_asset']);
  closedObject(value.canonical_asset, ['artifact_id', 'category', 'path', 'media_type', 'bytes']);
  if (!(value.canonical_asset.bytes instanceof Uint8Array) || value.canonical_asset.bytes.byteLength === 0 || !sameValue({ ...value.canonical_asset, bytes: undefined }, { ...asset, bytes: undefined }) || value.result?.calculation_kind !== calculationKind) fail('VALIDATION_FAILED', 'validation');
  const { calculation_kind: _calculationKind, ...result } = value.result;
  return { result, canonical_asset: value.canonical_asset };
}

function outputAsset(artifact_id: string, result: unknown): AnalysisAsset {
  const bytes = Buffer.from(JSON.stringify(result), 'utf8');
  return { artifact_id, category: 'output', path: `outputs/${artifact_id}.json`, media_type: 'application/json', bytes };
}

function assetDescriptor(asset: AnalysisAsset): ArtifactDescriptor {
  return {
    artifact_id: asset.artifact_id,
    category: asset.category,
    path: asset.path,
    media_type: asset.media_type,
    byte_size: asset.bytes.byteLength,
    sha256: sha256(asset.bytes),
  };
}

function validateBeginResult(value: unknown, run_id: string): void {
  closedObject(value, ['run_id'], 'ARTIFACT_WRITE_FAILED');
  if (value.run_id !== run_id) fail('ARTIFACT_WRITE_FAILED');
}

function validateContractCommitResult(value: unknown, run_id: string, contract: ConfirmedContract, contractHash: string): void {
  const bytes = Buffer.from(JSON.stringify(contract), 'utf8');
  closedObject(value, ['committed', 'descriptor'], 'ARTIFACT_WRITE_FAILED');
  if (value.committed !== true) fail('ARTIFACT_WRITE_FAILED');
  closedObject(value.descriptor, ['path', 'byte_size', 'sha256'], 'ARTIFACT_WRITE_FAILED');
  if (value.descriptor.path !== 'analysis-contract.json' || value.descriptor.byte_size !== bytes.byteLength || value.descriptor.sha256 !== contractHash) fail('ARTIFACT_WRITE_FAILED');
}

function validateAppendResult(value: unknown, expected: ArtifactDescriptor): ArtifactDescriptor {
  closedObject(value, ['appended', 'descriptor'], 'ARTIFACT_WRITE_FAILED');
  if (value.appended !== true) fail('ARTIFACT_WRITE_FAILED');
  closedObject(value.descriptor, ['artifact_id', 'category', 'path', 'media_type', 'byte_size', 'sha256'], 'ARTIFACT_WRITE_FAILED');
  if (!sameValue(value.descriptor, expected)) fail('ARTIFACT_WRITE_FAILED');
  if (!isArtifactDescriptor(value.descriptor)) fail('ARTIFACT_WRITE_FAILED');
  return value.descriptor;
}

function isArtifactDescriptor(value: PlainRecord): value is ArtifactDescriptor {
  return typeof value.artifact_id === 'string' && typeof value.category === 'string' && typeof value.path === 'string'
    && typeof value.media_type === 'string' && typeof value.byte_size === 'number' && typeof value.sha256 === 'string';
}

function validateReplaceResult(value: unknown): void {
  closedObject(value, ['replaced'], 'ARTIFACT_WRITE_FAILED');
  if (value.replaced !== true) fail('ARTIFACT_WRITE_FAILED');
}

function validateSuccessResult(value: unknown): void {
  closedObject(value, ['committed', 'success_manifest_is_last'], 'ARTIFACT_WRITE_FAILED');
  if (value.committed !== true || value.success_manifest_is_last !== true) fail('ARTIFACT_WRITE_FAILED');
}

function errorField(error: unknown, field: 'code' | 'message' | 'stage'): unknown {
  if (error !== null && (typeof error === 'object' || typeof error === 'function') && field in error) return Reflect.get(error, field);
  return undefined;
}

function mappedError(error: unknown, fallbackStage: string, fallbackCode: string): { stage?: string; code: string } {
  const errorStage = errorField(error, 'stage');
  const errorCode = errorField(error, 'code');
  if (typeof errorStage === 'string' && errorStage && typeof errorCode === 'string' && errorCode) return { stage: errorStage, code: errorCode };
  const code = String(errorCode ?? errorField(error, 'message') ?? '');
  if (code === 'CANCELLED') return Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
  if (code === 'SOURCE_CHANGED') return Object.assign(new Error('SOURCE_CHANGED'), { stage: fallbackStage, code: 'SOURCE_CHANGED' });
  if (code === 'TIMEOUT') return Object.assign(new Error('TIMEOUT'), { stage: fallbackStage, code: 'TIMEOUT' });
  return Object.assign(new Error(fallbackCode), { stage: fallbackStage, code: fallbackCode });
}

export function createLocalAnalysisApplication(dependencies: unknown): LocalAnalysisApplication {
  const dependency = validateDependencies(dependencies);
  const core = createLocalAnalysisDomain();

  async function start(input: unknown): Promise<LocalAnalysisHandle> {
    const source = validateStartInput(input);
    validateRunRootPreflight(await dependency.runArtifactStore.preflightRunRoot());
    const preflightFixture = validateFixturePreflight(await dependency.localAnalysisExecution.preflightApprovedFixture(freeze({ source })));
    const preflightReadiness = validateRuntimeReadiness(await dependency.agentRuntime.preflightModel(freeze({ model: dependency.model })), dependency.model);
    let state: 'created' | 'discovered' | 'confirmed' | 'executing' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out' = 'created';
    let proposal: AnalysisProposal;
    let run: RunManifest;
    let contract: ConfirmedContract;
    let abortController: AbortController;
    let cancellation: Promise<LocalAnalysisTerminal | undefined> | undefined;
    let session: AgentAnalysisSession;
    let terminalResult: LocalAnalysisTerminal | undefined;
    let executionStartedAt: Date;
    let runtimeTurn: ReturnType<AgentAnalysisSession['execute']>;
    let activeStage = 'runtime';
    let deadlineHandle: DeadlineHandle;
    let deadlinePromise: Promise<never>;
    let rejectDeadline: (reason?: unknown) => void;
    let deadlineExpired = false;
    let deadlineClosed = false;
    let runtimeCancelPromise: Promise<unknown> | undefined;
    let runAllocated = false;
    let admittedWork: Promise<unknown> | undefined;
    const executionTools: ExecutionTool[] = [];
    const toolState: MutableToolState = { index: 0, correlations: new Set<string>(), sqlResult: undefined, artifacts: [] };

    function isCancelledState(): boolean {
      return state === 'cancelled';
    }

    function requireSqlResult(): MemberRepurchaseMetrics {
      if (!toolState.sqlResult) fail('VALIDATION_FAILED', 'validation');
      return toolState.sqlResult;
    }

    function retainedArtifacts(): ArtifactDescriptor[] {
      return manifestArtifactOrder.map((artifact_id) => toolState.artifacts.find((artifact) => artifact.artifact_id === artifact_id)).filter((artifact): artifact is ArtifactDescriptor => artifact !== undefined);
    }

    function timeoutError(): XanthilError {
      return Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT', stage: activeStage });
    }

    function closeDeadline(): void {
      if (!deadlineHandle || deadlineClosed) return;
      deadlineClosed = true;
      if (deadlineHandle.cancel() !== undefined) fail('VALIDATION_FAILED');
    }

    function requestRuntimeCancel(): Promise<unknown> | undefined {
      if (runtimeCancelPromise || !session) return runtimeCancelPromise;
      runtimeCancelPromise = Promise.resolve().then(() => session.cancel()).catch(() => undefined);
      return runtimeCancelPromise;
    }

    function requireAdmission(): void {
      if (deadlineExpired) throw timeoutError();
    }

    function requireNormalAdmission(): void {
      requireAdmission();
      if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
    }

    async function awaitAdmitted<T>(work: () => T | Promise<T>, { normal = true, onSettled }: { normal?: boolean; onSettled?: (value: T) => void } = {}): Promise<T> {
      if (normal) requireNormalAdmission();
      else requireAdmission();
      const pending = Promise.resolve().then(() => {
        if (normal) requireNormalAdmission();
        else requireAdmission();
        return work();
      });
      const issued = pending.then((value) => {
        onSettled?.(value);
        return value;
      });
      admittedWork = issued;
      try {
        const value = await Promise.race([issued, deadlinePromise]);
        requireAdmission();
        return value;
      } finally {
        if (admittedWork === issued) {
          admittedWork = undefined;
        }
      }
    }

    async function appendAsset(asset: AnalysisAsset): Promise<ArtifactDescriptor> {
      const descriptor = validateAppendResult(
        await awaitAdmitted(() => dependency.runArtifactStore.appendAsset(freeze({ run_id: run.run_id, asset, cancellation_signal: abortController.signal }))),
        assetDescriptor(asset),
      );
      if (toolState.artifacts.some((artifact) => artifact.artifact_id === descriptor.artifact_id)) fail('ARTIFACT_WRITE_FAILED');
      toolState.artifacts.push(descriptor);
      return descriptor;
    }

    function elapsedExceeded(startedAt: Date): boolean {
      return dependency.clock().valueOf() - startedAt.valueOf() > 300_000;
    }

    async function cancel(): Promise<LocalAnalysisTerminal | undefined> {
      if (cancellation) return cancellation;
      cancellation = (async () => {
        state = 'cancelled';
        requestRuntimeCancel();
        const issuedWork = admittedWork;
        if (issuedWork) {
          await Promise.race([issuedWork.catch(() => undefined), deadlinePromise]);
          requireAdmission();
        }
        if (runAllocated && !terminalResult) {
          const ended_at = dependency.clock().toISOString();
          const terminal = { ...run, status: 'cancelled', ended_at, terminal_detail: { stage: activeStage }, artifacts: retainedArtifacts() };
          core.validateRunManifest(terminal);
          validateReplaceResult(await awaitAdmitted(
            () => dependency.runArtifactStore.replaceManifest(freeze({ run_id: run.run_id, next_manifest: terminal, cancellation_signal: abortController.signal })),
            { normal: false },
          ));
          terminalResult = { run: terminal };
        }
        closeDeadline();
        return terminalResult ?? { status: 'cancelled' };
      })();
      return cancellation;
    }

    async function terminalFailure(stage: string, error_code: string): Promise<LocalAnalysisTerminal | undefined> {
      if (isCancelledState()) return cancellation;
      state = 'failed';
      if (!runAllocated || terminalResult) return undefined;
      const terminal = { ...run, status: 'failed', ended_at: dependency.clock().toISOString(), terminal_detail: { stage, error_code }, artifacts: retainedArtifacts() };
      try {
        core.validateRunManifest(terminal);
        validateReplaceResult(await awaitAdmitted(() => dependency.runArtifactStore.replaceManifest(freeze({ run_id: run.run_id, next_manifest: terminal, cancellation_signal: abortController.signal }))));
        terminalResult = { run: terminal };
      } catch {
        if (deadlineExpired) throw timeoutError();
        // The original mapped error remains authoritative when terminal persistence is unavailable.
      }
      return terminalResult;
    }

    function makeInvoke(index: number): ExecutionTool['invoke'] {
      return async (request) => {
        if (deadlineExpired) return new Promise(() => undefined);
        if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
        if (state !== 'executing' || abortController.signal.aborted) fail('TOOL_POLICY_VIOLATION', 'runtime');
        if (elapsedExceeded(executionStartedAt)) fail('TIMEOUT', 'execution');
        closedObject(request, ['correlation_id', 'arguments'], 'TOOL_POLICY_VIOLATION');
        if (typeof request.correlation_id !== 'string' || request.correlation_id.length === 0 || !sameValue(request.arguments, {}) || toolState.index !== index || toolState.correlations.has(request.correlation_id)) fail('TOOL_POLICY_VIOLATION', 'runtime');
        toolState.index += 1;
        toolState.correlations.add(request.correlation_id);
        if (index === 0) {
          activeStage = 'source_read';
          try {
            const profile = await awaitAdmitted(() => dependency.localAnalysisExecution.profileApprovedFixture({ source, run_id: run.run_id, confirmed_contract: contract }));
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            return validateProfile(profile);
          } catch (error) {
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            throw mappedError(error, 'source_read', String(errorField(error, 'message')) === 'SOURCE_INVALID' ? 'SOURCE_INVALID' : 'SOURCE_BOUNDARY_VIOLATION');
          }
        }
        if (index === 1) {
          activeStage = 'analysis_sql';
          try {
            const calculation = await awaitAdmitted(() => dependency.localAnalysisExecution.calculateMemberRepurchaseMetrics({ source, run_id: run.run_id, confirmed_contract: contract, deadline_seconds: 30, cancellation_signal: abortController.signal }));
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            const envelope = validateEnvelope(calculation, 'sql', { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' });
            try {
              core.validateFinding({
                finding: { finding_id: 'F-001', statement: 'The window-local repurchase-member rate declined in this synthetic fixture.', status: 'supported', evidence_ids: ['E-001'], limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'] },
                result: envelope.result,
              });
            } catch {
              fail('VALIDATION_FAILED', 'validation');
            }
            toolState.sqlResult = envelope.result;
            await appendAsset(envelope.canonical_asset);
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            await appendAsset(outputAsset('O-001', { ...envelope.result, calculation_kind: 'sql' }));
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            return { ...envelope.result, calculation_kind: 'sql' };
          } catch (error) {
            if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
            throw mappedError(error, 'analysis_sql', String(errorField(error, 'message')) === 'TIMEOUT' ? 'TIMEOUT' : String(errorField(error, 'message')) === 'VALIDATION_FAILED' ? 'VALIDATION_FAILED' : String(errorField(error, 'message')) === 'ARTIFACT_WRITE_FAILED' ? 'ARTIFACT_WRITE_FAILED' : 'ANALYSIS_EXECUTION_FAILED');
          }
        }
        activeStage = 'analysis_python';
        try {
          const validation = await awaitAdmitted(() => dependency.localAnalysisExecution.validateMemberRepurchaseMetrics({ source, run_id: run.run_id, confirmed_contract: contract, sql_result: { ...requireSqlResult(), calculation_kind: 'sql' }, deadline_seconds: 30, cancellation_signal: abortController.signal }));
          if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
          const envelope = validateEnvelope(validation, 'python_validation', { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' });
          if (!sameValue(envelope.result, toolState.sqlResult)) fail('VALIDATION_FAILED', 'validation');
          await appendAsset(envelope.canonical_asset);
          if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
          await appendAsset(outputAsset('O-002', { ...envelope.result, calculation_kind: 'python_validation' }));
          if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
          return { ...envelope.result, calculation_kind: 'python_validation' };
        } catch (error) {
          if (isCancelledState()) throw Object.assign(new Error('CANCELLED'), { code: 'CANCELLED' });
          throw mappedError(error, 'analysis_python', String(errorField(error, 'message')) === 'TIMEOUT' ? 'TIMEOUT' : String(errorField(error, 'message')) === 'VALIDATION_FAILED' ? 'VALIDATION_FAILED' : String(errorField(error, 'message')) === 'ARTIFACT_WRITE_FAILED' ? 'ARTIFACT_WRITE_FAILED' : 'ANALYSIS_EXECUTION_FAILED');
        }
      };
    }

    for (let index = 0; index < approvedTools.length; index += 1) executionTools.push(freeze({ tool_name: approvedTools[index], invoke: makeInvoke(index) }));
    const frozenTools = freeze(executionTools);
    session = await dependency.agentRuntime.openSession({ model: dependency.model, discovery_tools: freeze([]), execution_tools: frozenTools });

    return freeze({
      async discover() {
        if (state !== 'created') fail(isCancelledState() ? 'CANCELLED' : 'PROTOCOL_FAILURE');
        const candidate = await session.discover(freezeDeep({ discovery_context: discoveryContext() }));
        if (!sameValue(candidate, expectedProposal())) fail('INVALID_ANALYSIS_PROPOSAL');
        proposal = structuredClone(candidate);
        state = 'discovered';
        return proposal;
      },
      async confirm(candidate) {
        if (isCancelledState()) return cancellation;
        if (state === 'confirmed' || state === 'executing' || state === 'succeeded' || state === 'failed') fail('PROPOSAL_ALREADY_CONFIRMED');
        if (state !== 'discovered' || !sameValue(candidate, proposal)) fail('CONFIRMATION_REQUIRED');
        state = 'confirmed';
        const confirmedAt = dependency.clock();
        const run_id = uuidV7(dependency.clock);
        contract = confirmedContract(proposal, run_id, confirmedAt.toISOString());
        const contractHash = sha256(Buffer.from(JSON.stringify(contract), 'utf8'));
        abortController = new AbortController();
        deadlinePromise = new Promise((resolve, reject) => { rejectDeadline = reject; });
        deadlineHandle = validateDeadlineHandle(dependency.deadlineScheduler.schedule(freeze({
          at_epoch_ms: confirmedAt.valueOf() + 300000,
          callback: () => {
            if (deadlineExpired) return undefined;
            deadlineExpired = true;
            state = 'timed_out';
            abortController.abort();
            requestRuntimeCancel();
            closeDeadline();
            rejectDeadline(timeoutError());
            return undefined;
          },
        })));
        if (deadlineExpired) closeDeadline();
        run = {
          schema_version: '2.0', run_id, analysis_kind: 'analyst_assistant', status: 'in_progress', started_at: confirmedAt.toISOString(),
          product: { ...productIdentity }, runtime: { ...preflightReadiness.runtime }, adapter: { ...preflightReadiness.adapter }, profile: { ...dependency.profile }, model: { ...preflightReadiness.model },
          contract: { path: 'analysis-contract.json', sha256: contractHash }, sources: [{ ...sourceDescriptor, read_at: preflightFixture.read_at }], artifacts: [],
        };
        try {
          activeStage = 'contract_persist';
          core.validateRunManifest(run);
          validateBeginResult(await awaitAdmitted(
            () => dependency.runArtifactStore.beginRun(freeze({ run_id, initial_manifest: run, cancellation_signal: abortController.signal })),
            { onSettled: () => { runAllocated = true; } },
          ), run_id);
          validateContractCommitResult(
            await awaitAdmitted(() => dependency.runArtifactStore.commitConfirmedContract(freeze({ run_id, contract, cancellation_signal: abortController.signal }))),
            run_id,
            contract,
            contractHash,
          );
          requireNormalAdmission();
          state = 'executing';
          activeStage = 'runtime';
          executionStartedAt = dependency.clock();
          requireAdmission();
          runtimeTurn = session.execute({ confirmed_contract: contract, finding_context: findingContext(), cancellation_signal: abortController.signal, deadline_seconds: 300 });
          runtimeTurn.catch(() => undefined);
          const runtimeOutput = await awaitAdmitted(() => runtimeTurn);
          if (isCancelledState()) return cancellation;
          activeStage = 'runtime';
          if (elapsedExceeded(executionStartedAt)) fail('TIMEOUT', 'execution');
          closedObject(runtimeOutput, ['actual_model', 'finding']);
          if (!sameValue(runtimeOutput.actual_model, preflightReadiness.model)) fail('MODEL_EXECUTION_FAILED', 'runtime');
          let evidence;
          let summary;
          let evidence_document;
          try {
            core.validateFinding({ finding: runtimeOutput.finding, result: toolState.sqlResult });
            evidence = { schema_version: '1.0', run_id, findings: [runtimeOutput.finding], evidence_items: [{ evidence_id: 'E-001', description: 'Exact deterministic calculation.', source_ids: ['SRC-001'], artifact_ids: ['Q-001', 'S-001', 'O-001', 'O-002'] }] };
            summary = `${clarifiedQuestion}\n66.7%\n11.1%\n-55.6 pp\nsupported\ntiny and synthetic; window-local; no causal or business-impact claim`;
            evidence_document = `F-001\nSRC-001\nQ-001\nS-001\nO-001\nO-002\n${fixtureIdentity.sha256}`;
            core.validateEvidenceIndex({ evidence, catalog: { sources: [{ source_id: 'SRC-001', sha256: fixtureIdentity.sha256 }], artifacts: toolState.artifacts.map((artifact) => ({ artifact_id: artifact.artifact_id, sha256: artifact.sha256, observed_sha256: artifact.sha256 })) } });
            core.validateMarkdownProjection({ projection: { summary_md: summary, evidence_md: evidence_document }, result: toolState.sqlResult });
          } catch {
            fail('VALIDATION_FAILED', 'validation');
          }
          const evidenceBytes = Buffer.from(JSON.stringify(evidence), 'utf8');
          const summaryAsset = { artifact_id: 'DOC-SUMMARY', category: 'summary', path: 'summary.md', media_type: 'text/markdown', bytes: Buffer.from(summary, 'utf8') };
          const evidenceDocumentAsset = { artifact_id: 'DOC-EVIDENCE', category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown', bytes: Buffer.from(evidence_document, 'utf8') };
          const succeededRun = {
            ...run,
            status: 'succeeded',
            ended_at: dependency.clock().toISOString(),
            evidence: { path: 'evidence.json', sha256: sha256(evidenceBytes) },
            artifacts: [...retainedArtifacts(), assetDescriptor(summaryAsset), assetDescriptor(evidenceDocumentAsset)],
          };
          try {
            core.validateRunManifest(succeededRun);
            validateSuccessResult(await awaitAdmitted(
              () => dependency.runArtifactStore.commitSuccess(freeze({ run_id, next_manifest: succeededRun, evidence, summary, evidence_document, cancellation_signal: abortController.signal })),
              {
                onSettled: (value) => {
                  validateSuccessResult(value);
                  terminalResult = { metrics: toolState.sqlResult, finding: runtimeOutput.finding, run: succeededRun };
                },
              },
            ));
          } catch {
            fail('ARTIFACT_WRITE_FAILED', 'artifact_finalize');
          }
          closeDeadline();
          state = 'succeeded';
          return terminalResult;
        } catch (error) {
          if (deadlineExpired) {
            closeDeadline();
            throw timeoutError();
          }
          if (isCancelledState()) return cancellation;
          if (!runAllocated && String(errorField(error, 'message')) === 'RUN_COLLISION') {
            closeDeadline();
            throw error;
          }
          const mapped = mappedError(
            error,
            activeStage,
            String(errorField(error, 'message')) === 'MODEL_EXECUTION_FAILED'
              ? 'MODEL_EXECUTION_FAILED'
              : activeStage === 'contract_persist' && String(errorField(error, 'message')) === 'ARTIFACT_WRITE_FAILED'
                ? 'ARTIFACT_WRITE_FAILED'
                : 'VALIDATION_FAILED',
          );
          const stage = mapped.stage === 'analysis_sql' && mapped.code === 'ARTIFACT_WRITE_FAILED' ? 'artifact_finalize' : mapped.stage === 'analysis_python' && mapped.code === 'ARTIFACT_WRITE_FAILED' ? 'artifact_finalize' : mapped.stage ?? 'runtime';
          const code = mapped.code === 'ARTIFACT_WRITE_FAILED' ? 'ARTIFACT_WRITE_FAILED' : mapped.code;
          return Promise.race([
            terminalFailure(stage, code).then(() => {
              closeDeadline();
              if (terminalResult) return terminalResult;
              throw Object.assign(new Error(`${stage}:${code}`), { stage, code });
            }),
            deadlinePromise,
          ]);
        }
      },
      cancel,
    });
  }

  return freeze({ start });
}
