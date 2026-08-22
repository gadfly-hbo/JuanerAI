import type {
  AnalysisProposal,
  ArtifactDescriptor,
  Finding,
  MemberRepurchaseMetrics,
  PlainRecord,
  ReadableTerminalRunManifest,
  RunManifest,
  SourceDescriptor,
} from '../product-core/local-analysis.ts';

export type ModelIdentity = Readonly<{ provider: string; model_id: string }>;
export type RuntimeReadiness = Readonly<{
  runtime: Readonly<{ id: string; version: string }>;
  adapter: Readonly<{ id: string; version: string }>;
  model: ModelIdentity;
}>;
export type ConfirmedContract = PlainRecord & { run_id: string };
export type AnalysisSource = PlainRecord & { version: string; kind: string; sha256: string; path: string };
export type ExecutionTool = Readonly<{
  tool_name: string;
  invoke(request: Readonly<{ correlation_id: string; arguments: Readonly<Record<string, never>> }>): Promise<unknown>;
}>;
export type AgentAnalysisSession = {
  discover(input: Readonly<{ discovery_context: PlainRecord }>): Promise<AnalysisProposal>;
  execute(input: Readonly<{
    confirmed_contract: ConfirmedContract;
    finding_context: PlainRecord;
    cancellation_signal: AbortSignal;
    deadline_seconds: number;
  }>): Promise<Readonly<{ actual_model: ModelIdentity; finding: Finding }>>;
  cancel(): Promise<Readonly<{ cancelled: boolean; was_confirmed: boolean }>>;
};
export type AgentAnalysisRuntime = {
  preflightModel(input: Readonly<{ model: ModelIdentity }>): Promise<RuntimeReadiness>;
  openSession(input: Readonly<{ model: ModelIdentity; discovery_tools: readonly never[]; execution_tools: readonly ExecutionTool[] }>): Promise<AgentAnalysisSession>;
};

export type AnalysisAsset = Readonly<{ artifact_id: string; category: string; path: string; media_type: string; bytes: Uint8Array }>;
export type AnalysisEnvelope = Readonly<{ result: MemberRepurchaseMetrics & { calculation_kind: string }; canonical_asset: AnalysisAsset }>;
export type LocalAnalysisExecution = {
  preflightApprovedFixture(input: Readonly<{ source: AnalysisSource }>): Promise<SourceDescriptor>;
  profileApprovedFixture(input: Readonly<{ source: AnalysisSource; run_id: string; confirmed_contract: ConfirmedContract }>): Promise<PlainRecord>;
  calculateMemberRepurchaseMetrics(input: Readonly<{ source: AnalysisSource; run_id: string; confirmed_contract: ConfirmedContract; deadline_seconds: number; cancellation_signal: AbortSignal }>): Promise<AnalysisEnvelope>;
  validateMemberRepurchaseMetrics(input: Readonly<{ source: AnalysisSource; run_id: string; confirmed_contract: ConfirmedContract; sql_result: MemberRepurchaseMetrics & { calculation_kind: string }; deadline_seconds: number; cancellation_signal: AbortSignal }>): Promise<AnalysisEnvelope>;
};

export type RunArtifactStore = {
  preflightRunRoot(): Promise<Readonly<{ ready: boolean }>>;
  beginRun(input: Readonly<{ run_id: string; initial_manifest: RunManifest; cancellation_signal: AbortSignal }>): Promise<Readonly<{ run_id: string }>>;
  commitConfirmedContract(input: Readonly<{ run_id: string; contract: ConfirmedContract; cancellation_signal: AbortSignal }>): Promise<Readonly<{ committed: boolean; descriptor: Readonly<{ path: string; byte_size: number; sha256: string }> }>>;
  appendAsset(input: Readonly<{ run_id: string; asset: AnalysisAsset; cancellation_signal: AbortSignal }>): Promise<Readonly<{ appended: boolean; descriptor: ArtifactDescriptor }>>;
  replaceManifest(input: Readonly<{ run_id: string; next_manifest: RunManifest; cancellation_signal: AbortSignal }>): Promise<Readonly<{ replaced: boolean }>>;
  commitSuccess(input: Readonly<{ run_id: string; next_manifest: RunManifest; evidence: PlainRecord; summary: string; evidence_document: string; cancellation_signal: AbortSignal }>): Promise<Readonly<{ committed: boolean; success_manifest_is_last: boolean }>>;
  readTerminalRun(input: Readonly<{ run_id: string }>): Promise<Readonly<{ manifest: ReadableTerminalRunManifest; assets: readonly AnalysisAsset[] }>>;
};

function fail(): never {
  throw new Error('INVALID_PORT_IMPLEMENTATION');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function admitPort<T extends object>(implementation: unknown, methods: readonly string[]): asserts implementation is T {
  if (!isRecord(implementation)) fail();
  const keys = Object.keys(implementation);
  if (keys.length !== methods.length || keys.some((key) => !methods.includes(key)) || methods.some((method) => typeof implementation[method] !== 'function')) fail();
}

export function defineAgentAnalysisRuntime(implementation: unknown): AgentAnalysisRuntime {
  admitPort<AgentAnalysisRuntime>(implementation, ['preflightModel', 'openSession']);
  return Object.freeze({ preflightModel: implementation.preflightModel, openSession: implementation.openSession });
}

export function defineLocalAnalysisExecution(implementation: unknown): LocalAnalysisExecution {
  admitPort<LocalAnalysisExecution>(implementation, ['preflightApprovedFixture', 'profileApprovedFixture', 'calculateMemberRepurchaseMetrics', 'validateMemberRepurchaseMetrics']);
  return Object.freeze({ preflightApprovedFixture: implementation.preflightApprovedFixture, profileApprovedFixture: implementation.profileApprovedFixture, calculateMemberRepurchaseMetrics: implementation.calculateMemberRepurchaseMetrics, validateMemberRepurchaseMetrics: implementation.validateMemberRepurchaseMetrics });
}

export function defineRunArtifactStore(implementation: unknown): RunArtifactStore {
  admitPort<RunArtifactStore>(implementation, ['preflightRunRoot', 'beginRun', 'commitConfirmedContract', 'appendAsset', 'replaceManifest', 'commitSuccess', 'readTerminalRun']);
  return Object.freeze({ preflightRunRoot: implementation.preflightRunRoot, beginRun: implementation.beginRun, commitConfirmedContract: implementation.commitConfirmedContract, appendAsset: implementation.appendAsset, replaceManifest: implementation.replaceManifest, commitSuccess: implementation.commitSuccess, readTerminalRun: implementation.readTerminalRun });
}
