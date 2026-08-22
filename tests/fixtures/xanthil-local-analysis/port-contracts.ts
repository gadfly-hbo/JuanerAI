import assert from 'node:assert/strict';

import type { ArtifactDescriptor, PlainRecord, RunManifest } from '../../../packages/product-core/local-analysis.ts';
import type {
  AgentAnalysisRuntime,
  AgentAnalysisSession,
  AnalysisAsset,
  ConfirmedContract,
  LocalAnalysisExecution,
  RunArtifactStore,
} from '../../../packages/ports/local-analysis.ts';

import { approvedToolNames } from './public-seams.ts';
import {
  approvedModel,
  expectedAnalysisInput,
  expectedAnalysisProposal,
  expectedConfirmedContract,
  expectedDiscoveryContext,
  expectedFindingContext,
  expectedFindingProposal,
  fixtureByteSize,
  fixtureSha256,
  referenceOracle,
  sha256,
} from './fixture-oracle.ts';

type TestRecord = Record<string, unknown>;
type TestEvent = TestRecord & { type: string; message?: TestRecord };
type TestTool = { name: string; execute: (toolCallId: string, params: unknown, cancellationSignal?: AbortSignal) => unknown; executionMode?: string; parameters?: TestRecord };
type SdkRequest = TestRecord & { custom_tools: readonly TestTool[]; system_prompt: string };
type EventListener = (event: TestEvent) => unknown;
type EventMutator = (event: TestEvent, context: { promptCount: number }) => TestEvent | readonly TestEvent[] | null | undefined;
type FactoryOptions = {
  proposal?: unknown;
  finding?: unknown;
  actualModel?: TestRecord;
  observedActiveToolNames?: readonly string[];
  discoveryText?: string;
  executionText?: string;
  onRequest?: (request: SdkRequest) => void;
  onFacadeCall?: (method: string, details: TestRecord) => void;
  eventMutator?: EventMutator;
  toolProtocolMutation?: string;
};
type EventLog = TestRecord & { event: string };
type AgentDoubleOptions = {
  events?: EventLog[];
  onExecute?: () => unknown;
  requirePromptContexts?: boolean;
  proposal?: unknown;
  driveTurn?: (input: { execution_tools: readonly { tool_name: keyof typeof boundedToolResults; invoke: (request: unknown) => Promise<unknown> }[]; invoke: (index: number, request?: TestRecord) => Promise<unknown> }) => unknown;
  runtimeResult?: unknown;
  preflightResult?: unknown;
};
type ExecutionDoubleOptions = {
  events?: EventLog[];
  onProfile?: () => unknown;
  onCalculate?: (input: TestRecord) => unknown;
  onValidate?: (input?: TestRecord) => unknown;
};
type PreflightFixtureInput = Parameters<LocalAnalysisExecution['preflightApprovedFixture']>[0];
type ProfileFixtureInput = Parameters<LocalAnalysisExecution['profileApprovedFixture']>[0];
type CalculateMetricsInput = Parameters<LocalAnalysisExecution['calculateMemberRepurchaseMetrics']>[0];
type ValidateMetricsInput = Parameters<LocalAnalysisExecution['validateMemberRepurchaseMetrics']>[0];
type ArtifactWriteInput =
  | Parameters<RunArtifactStore['beginRun']>[0]
  | Parameters<RunArtifactStore['commitConfirmedContract']>[0]
  | Parameters<RunArtifactStore['appendAsset']>[0]
  | Parameters<RunArtifactStore['replaceManifest']>[0]
  | Parameters<RunArtifactStore['commitSuccess']>[0];
type ArtifactState = { manifest: RunManifest; assets: AnalysisAsset[]; confirmed: boolean; contract?: unknown; evidence?: unknown };
type ExpectedArtifactRun = {
  run_id: string;
  contract: ConfirmedContract;
  contractBytes: Buffer;
  initialManifest: RunManifest;
  assets: AnalysisAsset[];
  evidence: PlainRecord;
  evidenceBytes: Buffer;
  summary: string;
  evidenceDocument: string;
  descriptorById: Record<string, ArtifactDescriptor>;
  persistedAssetById: Record<string, ArtifactDescriptor & { bytes: Uint8Array }>;
  succeededManifest: RunManifest;
  failedManifest: RunManifest;
  cancelledManifest: RunManifest;
};

function isArtifactCommand(value: TestRecord): value is ArtifactWriteInput & TestRecord {
  return typeof value.run_id === 'string' && value.cancellation_signal instanceof AbortSignal;
}

function requiredRecord(value: unknown): TestRecord {
  if (!isRecord(value)) throw new Error('test record required');
  return value;
}

function isRecord(value: unknown): value is TestRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function activeCancellationSignal() {
  return new AbortController().signal;
}

export async function invokeNegativeOperationalPort(callable: unknown, args: readonly unknown[]): Promise<unknown> {
  assert.equal(typeof callable, 'function', 'negative operational Port target must be callable');
  return (callable as (...args: unknown[]) => unknown)(...args);
}

export function artifactMutatorInput<T extends TestRecord>(input: T, cancellation_signal: AbortSignal = activeCancellationSignal()): T & { cancellation_signal: AbortSignal } {
  return { ...input, cancellation_signal };
}
export const canonicalQueryBytes = Buffer.from(`WITH windowed AS (
  SELECT order_id, member_id, ordered_on,
    CASE
      WHEN ordered_on BETWEEN DATE '2026-08-01' AND DATE '2026-08-07' THEN 'baseline'
      WHEN ordered_on BETWEEN DATE '2026-08-08' AND DATE '2026-08-14' THEN 'recent'
    END AS window_id
  FROM member_orders
), member_orders_by_window AS (
  SELECT window_id, member_id, count(DISTINCT order_id) AS member_order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id, member_id
), member_counts AS (
  SELECT window_id,
    count(*) AS active_member_count,
    count(*) FILTER (WHERE member_order_count >= 2) AS repeat_purchaser_count
  FROM member_orders_by_window
  GROUP BY window_id
), order_counts AS (
  SELECT window_id, count(DISTINCT order_id) AS order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id
)
SELECT orders.window_id, orders.order_count,
  members.active_member_count, members.repeat_purchaser_count
FROM order_counts AS orders
JOIN member_counts AS members USING (window_id)
ORDER BY orders.window_id;
`, 'utf8');
export const canonicalScriptBytes = Buffer.from(`import csv
import json
import sys

WINDOWS = {
    "baseline": ("2026-08-01", "2026-08-07"),
    "recent": ("2026-08-08", "2026-08-14"),
}

def calculate(path):
    with open(path, "r", encoding="utf-8", newline="") as source:
        rows = list(csv.DictReader(source))
    result = {}
    for window_id, (start_date, end_date) in WINDOWS.items():
        selected = [row for row in rows if start_date <= row["ordered_on"] <= end_date]
        members = {}
        for row in selected:
            members.setdefault(row["member_id"], set()).add(row["order_id"])
        result[window_id] = {
            "order_count": len({row["order_id"] for row in selected}),
            "active_member_count": len(members),
            "repeat_purchaser_count": sum(len(order_ids) >= 2 for order_ids in members.values()),
        }
    return result

print(json.dumps(calculate(sys.argv[1]), separators=(",", ":"), sort_keys=True))
`, 'utf8');

const assetContracts = Object.freeze({
  'Q-001': Object.freeze({ category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' }),
  'O-001': Object.freeze({ category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' }),
  'S-001': Object.freeze({ category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' }),
  'O-002': Object.freeze({ category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' }),
});
const manifestArtifactOrder = Object.freeze(['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE']);

const boundedToolResults = Object.freeze({
  profile_approved_fixture: Object.freeze({
    source_id: 'SRC-001',
    fixture_version: 'member-orders-v1',
    row_count: 20,
    columns: Object.freeze(['order_id', 'member_id', 'ordered_on']),
    date_coverage: Object.freeze({ start_date: '2026-08-01', end_date: '2026-08-14' }),
  }),
  calculate_member_repurchase_metrics: Object.freeze({ ...referenceOracle, calculation_kind: 'sql' }),
  validate_member_repurchase_metrics: Object.freeze({ ...referenceOracle, calculation_kind: 'python_validation' }),
});

export function expectedBoundedToolResult(tool_name: string) {
  if (tool_name === 'profile_approved_fixture') return structuredClone(boundedToolResults.profile_approved_fixture);
  if (tool_name === 'calculate_member_repurchase_metrics') return structuredClone(boundedToolResults.calculate_member_repurchase_metrics);
  if (tool_name === 'validate_member_repurchase_metrics') return structuredClone(boundedToolResults.validate_member_repurchase_metrics);
  throw new Error('unsupported bounded test tool');
}

function exactKeys(value: unknown, keys: readonly string[]): value is TestRecord {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.entries(value).some(([entryKey, entryValue]) => entryKey === key && entryValue !== undefined && entryValue !== null));
}

function artifactDescriptor(asset: { artifact_id: string; category: string; path: string; media_type: string; bytes: Uint8Array }) {
  return {
    artifact_id: asset.artifact_id,
    category: asset.category,
    path: asset.path,
    media_type: asset.media_type,
    byte_size: asset.bytes.byteLength,
    sha256: sha256(asset.bytes),
  };
}

export function expectedArtifactRun(run_id: string, started_at = '2026-08-20T00:00:00.000Z'): ExpectedArtifactRun {
  const contract = expectedConfirmedContract(run_id, started_at);
  const contractBytes = Buffer.from(JSON.stringify(contract), 'utf8');
  const initialManifest: RunManifest = {
    schema_version: '2.0',
    run_id,
    analysis_kind: 'analyst_assistant',
    status: 'in_progress',
    started_at,
    product: { id: 'xanthil', version: '1.0.0' },
    runtime: { id: 'pi', version: '0.84.2' },
    adapter: { id: 'agent-pi', version: '1.0.0' },
    profile: { id: 'personal' },
    model: { ...approvedModel },
    contract: { path: 'analysis-contract.json', sha256: sha256(contractBytes) },
    sources: [{
      source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256,
      byte_size: fixtureByteSize, read_at: started_at, fixture_version: 'member-orders-v1',
    }],
    artifacts: [],
  };
  const assets: AnalysisAsset[] = [
    { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: Buffer.from(canonicalQueryBytes) },
    { artifact_id: 'O-001', category: 'output', path: 'outputs/O-001.json', media_type: 'application/json', bytes: Buffer.from(JSON.stringify({ ...referenceOracle, calculation_kind: 'sql' }), 'utf8') },
    { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: Buffer.from(canonicalScriptBytes) },
    { artifact_id: 'O-002', category: 'output', path: 'outputs/O-002.json', media_type: 'application/json', bytes: Buffer.from(JSON.stringify({ ...referenceOracle, calculation_kind: 'python_validation' }), 'utf8') },
  ];
  const finding = expectedFindingProposal();
  const evidence: PlainRecord = {
    schema_version: '1.0', run_id, findings: [finding],
    evidence_items: [{ evidence_id: 'E-001', description: 'Exact deterministic calculation.', source_ids: ['SRC-001'], artifact_ids: ['Q-001', 'S-001', 'O-001', 'O-002'] }],
  };
  const summary = `${expectedAnalysisProposal().question}\n66.7%\n11.1%\n-55.6 pp\nsupported\ntiny and synthetic; window-local; no causal or business-impact claim`;
  const evidenceDocument = `F-001\nSRC-001\nQ-001\nS-001\nO-001\nO-002\n${fixtureSha256}`;
  const evidenceBytes = Buffer.from(JSON.stringify(evidence), 'utf8');
  const summaryAsset = { artifact_id: 'DOC-SUMMARY', category: 'summary', path: 'summary.md', media_type: 'text/markdown', bytes: Buffer.from(summary, 'utf8') };
  const evidenceDocumentAsset = { artifact_id: 'DOC-EVIDENCE', category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown', bytes: Buffer.from(evidenceDocument, 'utf8') };
  const descriptorById: Record<string, ArtifactDescriptor> = Object.fromEntries([...assets, summaryAsset, evidenceDocumentAsset].map((asset) => [asset.artifact_id, artifactDescriptor(asset)]));
  const persistedAssetById: Record<string, ArtifactDescriptor & { bytes: Uint8Array }> = Object.fromEntries([...assets, summaryAsset, evidenceDocumentAsset].map((asset) => [asset.artifact_id, { ...artifactDescriptor(asset), bytes: Buffer.from(asset.bytes) }]));
  const succeededManifest: RunManifest = {
    ...initialManifest,
    status: 'succeeded',
    ended_at: '2026-08-20T00:01:00.000Z',
    evidence: { path: 'evidence.json', sha256: sha256(evidenceBytes) },
    artifacts: manifestArtifactOrder.map((id) => descriptorById[id]),
  };
  const fixture = {
    run_id, contract, contractBytes, initialManifest, assets, evidence, evidenceBytes, summary, evidenceDocument,
    descriptorById, persistedAssetById,
    succeededManifest,
  };
  return {
    ...fixture,
    failedManifest: expectedTerminalManifest(fixture, 'failed'),
    cancelledManifest: expectedTerminalManifest(fixture, 'cancelled'),
  };
}

export function expectedTerminalManifest(fixture: Pick<ExpectedArtifactRun, 'initialManifest' | 'descriptorById'>, status: 'failed' | 'cancelled', artifactIds: readonly string[] = []): RunManifest {
  if (!['failed', 'cancelled'].includes(status)) throw new Error('unsupported test terminal status');
  const terminal_detail = status === 'failed'
    ? { stage: 'artifact_finalize', error_code: 'ARTIFACT_WRITE_FAILED' }
    : { stage: 'analysis_python' };
  return {
    ...fixture.initialManifest,
    status,
    ended_at: '2026-08-20T00:01:00.000Z',
    terminal_detail,
    artifacts: manifestArtifactOrder.filter((artifact_id) => artifactIds.includes(artifact_id)).map((artifact_id) => fixture.descriptorById[artifact_id]),
  };
}

function record(events: EventLog[] | undefined, event: string, details: TestRecord = {}) {
  if (events) events.push({ event, ...details });
}

function assertExecutionToolDescriptors(executionTools: unknown): asserts executionTools is readonly { tool_name: keyof typeof boundedToolResults; invoke: (request: unknown) => Promise<unknown> }[] {
  if (!Array.isArray(executionTools)) throw new Error('execution tools must be an array');
  assert.deepEqual(executionTools.map(({ tool_name }) => tool_name), approvedToolNames);
  for (const descriptor of executionTools) {
    assert.equal(Object.isFrozen(descriptor), true);
    assert.deepEqual(Object.keys(descriptor).sort(), ['invoke', 'tool_name']);
    assert.equal(typeof descriptor.invoke, 'function');
  }
}

export function createAgentRuntimeDouble(options?: AgentDoubleOptions): AgentAnalysisRuntime;
export function createAgentRuntimeDouble({
  events,
  onExecute,
  proposal = expectedAnalysisProposal(),
  driveTurn,
  runtimeResult,
  preflightResult,
}: AgentDoubleOptions = {}): AgentAnalysisRuntime | TestRecord {
  return {
    async preflightModel({ model }: { model?: TestRecord } = {}) {
      if (!model || model.provider !== approvedModel.provider || model.model_id !== approvedModel.model_id || Object.keys(model).length !== 2) throw new Error('MODEL_UNAVAILABLE');
      const observed = preflightResult ?? Object.freeze({
        runtime: Object.freeze({ id: 'pi', version: '0.84.2' }),
        adapter: Object.freeze({ id: 'agent-pi', version: '1.0.0' }),
        model: Object.freeze({ provider: approvedModel.provider, model_id: approvedModel.model_id }),
      });
      record(events, 'runtime.preflightModel', { model: structuredClone(model), observed: structuredClone(observed) });
      return observed;
    },
    async openSession({ model, discovery_tools, execution_tools }: { model?: TestRecord; discovery_tools: readonly unknown[]; execution_tools: unknown }) {
      if (!model || model.provider !== approvedModel.provider || model.model_id !== approvedModel.model_id) throw new Error('MODEL_UNAVAILABLE');
      assert.deepEqual(discovery_tools, []);
      assertExecutionToolDescriptors(execution_tools);
      const session = 'session-001';
      record(events, 'runtime.openSession', { session, model: structuredClone(model), discovery_tools: [...discovery_tools], execution_tools });
      let confirmed = false;
      let phase = 'created';
      return {
        async discover(input: TestRecord) {
          if (phase === 'cancelled') throw new Error('CANCELLED');
          if (phase !== 'created') throw new Error('PROTOCOL_FAILURE');
          assert.equal(Object.isFrozen(input), true);
          assert.deepEqual(input, { discovery_context: expectedDiscoveryContext() });
          assert.equal(Object.isFrozen(input.discovery_context), true);
          record(events, 'runtime.discover', { session, input: structuredClone(input) });
          phase = 'discovered';
          return structuredClone(proposal);
        },
        async execute({ confirmed_contract, finding_context, cancellation_signal, deadline_seconds = 300, ...extra }: TestRecord & { deadline_seconds?: number } = {}) {
          if (phase === 'cancelled') throw new Error('CANCELLED');
          if (phase !== 'discovered') throw new Error('PROTOCOL_FAILURE');
          const confirmedContract = confirmed_contract === undefined ? undefined : requiredRecord(confirmed_contract);
          if (typeof confirmedContract?.run_id !== 'string' || !uuidV7Pattern.test(confirmedContract.run_id)) throw new Error('CONFIRMATION_REQUIRED');
          if (Object.keys(extra).length) throw new Error('PROTOCOL_FAILURE');
          assert.equal(Object.isFrozen(finding_context), true);
          assert.deepEqual(finding_context, expectedFindingContext());
          if (deadline_seconds > 300) throw new Error('TIMEOUT');
          if (!(cancellation_signal instanceof AbortSignal) || cancellation_signal.aborted) {
            phase = 'cancelled';
            throw new Error('CANCELLED');
          }
          confirmed = true;
          phase = 'executing';
          record(events, 'runtime.execute.begin', { session, confirmed_contract, finding_context, cancellation_signal, deadline_seconds });
          if (onExecute) await onExecute();
          const invoke = async (index: number, request: TestRecord = { correlation_id: `call-00${index + 1}`, arguments: {} }) => {
            const descriptor = execution_tools[index];
            if (!descriptor) throw new Error('TOOL_POLICY_VIOLATION');
            record(events, 'runtime.tool.invoke.begin', { session, tool_name: descriptor.tool_name, correlation_id: request?.correlation_id });
            const result = await descriptor.invoke(request);
            assert.deepEqual(result, boundedToolResults[descriptor.tool_name]);
            assert.equal(Object.hasOwn(result, 'canonical_asset'), false);
            assert.equal(Object.hasOwn(result, 'bytes'), false);
            record(events, 'runtime.tool.invoke.end', { session, tool_name: descriptor.tool_name, correlation_id: request?.correlation_id });
            return result;
          };
          if (driveTurn) await driveTurn({ execution_tools, invoke });
          else for (let index = 0; index < execution_tools.length; index += 1) await invoke(index);
          if (phase === 'cancelled' || cancellation_signal.aborted) {
            phase = 'cancelled';
            throw new Error('CANCELLED');
          }
          record(events, 'runtime.execute.end', { session });
          phase = 'completed';
          return runtimeResult
            ? structuredClone(runtimeResult)
            : { actual_model: structuredClone(model), finding: expectedFindingProposal() };
        },
        async cancel() {
          if (phase !== 'completed' && phase !== 'cancelled') phase = 'cancelled';
          record(events, 'runtime.cancel', { session, was_confirmed: confirmed });
          return { cancelled: true, was_confirmed: confirmed };
        },
      };
    },
  };
}

// This is an opaque deterministic SDK-construction dependency, not a Runtime
// Port double and not a Pi session.  It exercises the Adapter's translation
// boundary without loading credentials, a provider, or the SDK prompt path.
export function createDeterministicSdkSessionFactory({
  proposal = expectedAnalysisProposal(),
  finding = expectedFindingProposal(),
  actualModel = approvedModel,
  observedActiveToolNames,
  discoveryText = JSON.stringify(proposal),
  executionText = JSON.stringify({ finding }),
  onRequest,
  onFacadeCall,
  eventMutator,
  toolProtocolMutation,
}: FactoryOptions = {}) {
  const requests: SdkRequest[] = [];
  const calls: TestRecord[] = [];
  const factory = async (request: SdkRequest) => {
    requests.push(request);
    onRequest?.(request);
    let listener: EventListener | undefined;
    let disposed = false;
    let activeTools: string[] = [];
    let promptCount = 0;
    const report = (method: string, details: TestRecord = {}) => {
      calls.push({ method, ...details });
      onFacadeCall?.(method, details);
    };
    const emit = (event: TestEvent) => {
      if (!listener) throw new Error('listener unavailable');
      const mutated = eventMutator?.(event, { promptCount });
      const projected = mutated === undefined ? event : mutated;
      if (projected === null) return;
      for (const admitted of Array.isArray(projected) ? projected : [projected]) {
        const result = listener(Object.freeze(admitted));
        if (result !== undefined) throw new Error('listener must return undefined');
      }
    };
    const assertLive = () => {
      if (disposed) throw new Error('facade disposed');
    };
    const facade = {
      subscribe(nextListener: EventListener) {
        assertLive();
        if (arguments.length !== 1 || typeof nextListener !== 'function' || listener) throw new Error('invalid subscribe');
        listener = nextListener;
        report('subscribe');
        return function unsubscribe() {
          if (arguments.length !== 0) throw new Error('invalid unsubscribe');
          listener = undefined;
          report('unsubscribe');
        };
      },
      setActiveTools(names: readonly string[]) {
        assertLive();
        if (arguments.length !== 1 || !Object.isFrozen(names) || !Array.isArray(names)) throw new Error('invalid active tools');
        activeTools = [...names];
        report('setActiveTools', { names: activeTools });
        const observed = observedActiveToolNames === undefined || activeTools.length === 0
          ? activeTools : observedActiveToolNames;
        return Object.freeze({ active_tool_names: Object.freeze([...observed]) });
      },
      async prompt(text: string, options: TestRecord) {
        assertLive();
        if (arguments.length !== 2 || typeof text !== 'string' || !text || !Object.isFrozen(options)
          || JSON.stringify(options) !== JSON.stringify({ expandPromptTemplates: false })) throw new Error('invalid prompt');
        promptCount += 1;
        report('prompt', { text, options, promptCount });
        if (promptCount === 1) {
          if (activeTools.length) throw new Error('Discovery tools must be inactive');
          emit({ type: 'message_update', assistantMessageEvent: Object.freeze({ type: 'text_delta', delta: 'non-authoritative' }) });
          emit({ type: 'message_end', message: Object.freeze({ role: 'assistant', content: Object.freeze([Object.freeze({ type: 'text', text: discoveryText })]), stopReason: 'stop' }) });
        } else if (promptCount === 2) {
          if (JSON.stringify(activeTools) !== JSON.stringify(approvedToolNames)) throw new Error('Execution tools must be active in order');
          for (let index = 0; index < request.custom_tools.length; index += 1) {
            const tool = request.custom_tools[index];
            const toolCallId = `call-00${index + 1}`;
            emit({ type: 'tool_execution_start', toolCallId, toolName: tool.name, args: Object.freeze({}) });
            if (toolProtocolMutation === 'tool-end-before-settlement' && index === 0) {
              const pendingResult = tool.execute(toolCallId, Object.freeze({}), new AbortController().signal);
              emit({ type: 'tool_execution_end', toolCallId, toolName: tool.name, result: Object.freeze({ content: Object.freeze([Object.freeze({ type: 'text', text: JSON.stringify(expectedBoundedToolResult(tool.name)) })]), details: Object.freeze({}) }), isError: false });
              await pendingResult;
              continue;
            }
            if (toolProtocolMutation === 'terminal-before-tool-settlement' && index === 0) {
              const pendingResult = tool.execute(toolCallId, Object.freeze({}), new AbortController().signal);
              emit({ type: 'message_end', message: Object.freeze({ role: 'assistant', content: Object.freeze([Object.freeze({ type: 'text', text: JSON.stringify({ finding }) })]), stopReason: 'stop' }) });
              emit({ type: 'agent_end', willRetry: false });
              emit({ type: 'agent_settled' });
              const result = await pendingResult;
              emit({ type: 'tool_execution_end', toolCallId, toolName: tool.name, result, isError: false });
              return Object.freeze({ settled: true });
            }
            const result = await tool.execute(toolCallId, Object.freeze({}), new AbortController().signal);
            emit({ type: 'tool_execution_end', toolCallId, toolName: tool.name, result, isError: false });
          }
          emit({ type: 'message_end', message: Object.freeze({ role: 'assistant', content: Object.freeze([Object.freeze({ type: 'text', text: executionText })]), stopReason: 'stop' }) });
        } else throw new Error('unexpected prompt');
        emit({ type: 'agent_end', willRetry: false });
        emit({ type: 'agent_settled' });
        return Object.freeze({ settled: true });
      },
      getActualModel() {
        assertLive();
        if (arguments.length !== 0 || promptCount === 0) throw new Error('model unavailable');
        report('getActualModel');
        return Object.freeze({ ...actualModel });
      },
      async abort() {
        assertLive();
        if (arguments.length !== 0) throw new Error('invalid abort');
        report('abort');
        return Object.freeze({ aborted: true });
      },
      async waitForIdle() {
        assertLive();
        if (arguments.length !== 0) throw new Error('invalid idle');
        report('waitForIdle');
        return Object.freeze({ idle: true });
      },
      dispose() {
        if (arguments.length !== 0) throw new Error('invalid dispose');
        disposed = true;
        listener = undefined;
        report('dispose');
        return Object.freeze({ disposed: true });
      },
    };
    return Object.freeze(facade);
  };
  return Object.freeze({ sdkSessionFactory: factory, requests, calls });
}

// A deterministic construction dependency for TASK-005 Adapter contract
// mutations.  It is deliberately an SDK-facade script, not a Runtime Port
// double: the Adapter remains responsible for all translation and admission
// decisions.  Each named mutation alters exactly one facade boundary while
// retaining a complete effect ledger for negative assertions.
export function createPiAdapterScenario({ mutation = 'none', rawCause = 'credential=forbidden-sdk-path' }: { mutation?: string; rawCause?: string } = {}) {
  const effects: string[] = [];
  let enteredPrompt: (() => void) | undefined;
  let releasePrompt: (() => void) | undefined;
  let enteredTool: (() => void) | undefined;
  let releaseTool: (() => void) | undefined;
  let enteredBusinessCallback: (() => void) | undefined;
  let releaseBusinessCallback: (() => void) | undefined;
  const promptEntered = new Promise<void>((resolve) => { enteredPrompt = resolve; });
  const promptRelease = new Promise<void>((resolve) => { releasePrompt = resolve; });
  const toolEntered = new Promise<void>((resolve) => { enteredTool = resolve; });
  const toolRelease = new Promise<void>((resolve) => { releaseTool = resolve; });
  const businessCallbackEntered = new Promise<void>((resolve) => { enteredBusinessCallback = resolve; });
  const businessCallbackRelease = new Promise<void>((resolve) => { releaseBusinessCallback = resolve; });
  const postDisposeAttempts: string[] = [];
  const recordEffect = (effect: string) => effects.push(effect);
  const control = createDeterministicSdkSessionFactory({
    actualModel: mutation === 'actual-model-mismatch' ? { provider: 'ambient-default', model_id: 'raw-secret-model' } : approvedModel,
    eventMutator(event: TestEvent, context: { promptCount: number }) {
      if (mutation === 'missing-message-end' && event.type === 'message_end') return null;
      if (mutation === 'stream-ended-without-finish-reason' && event.type === 'message_end') return { ...event, message: { ...(event.message ?? {}), stopReason: undefined } };
      if (mutation === 'missing-agent-end' && event.type === 'agent_end') return null;
      if (mutation === 'missing-agent-settled' && event.type === 'agent_settled') return null;
      if (mutation === 'assistant-wrong-role' && event.type === 'message_end') return { ...event, message: { ...(event.message ?? {}), role: 'tool' } };
      if (mutation === 'wrong-stop-reason' && event.type === 'message_end') return { ...event, message: { ...(event.message ?? {}), stopReason: 'length' } };
      if (mutation === 'malformed-final-json' && event.type === 'message_end') return { ...event, message: { ...(event.message ?? {}), content: Object.freeze([Object.freeze({ type: 'text', text: '{bad json' })]) } };
      if (mutation === 'duplicate-final-assistant-result' && event.type === 'message_end') return [event, event];
      if (mutation === 'will-retry' && event.type === 'agent_end') return { ...event, willRetry: true };
      if (mutation === 'reordered-terminal-events' && event.type === 'message_end') return [{ type: 'agent_end', willRetry: false }, event];
      if (mutation === 'compaction-activity' && event.type === 'agent_end') return [{ type: 'compaction' }, event];
      if (mutation === 'queued-continuation-activity' && event.type === 'agent_end') return [{ type: 'queued_continuation' }, event];
      if (mutation === 'discovery-tool-event' && context.promptCount === 1 && event.type === 'message_update') return [{ type: 'tool_execution_start', toolCallId: 'call-001', toolName: approvedToolNames[0], args: Object.freeze({}) }, event];
      if (mutation === 'unknown-tool-name' && event.type === 'tool_execution_start') return { ...event, toolName: 'forbidden_tool' };
      if (mutation === 'reordered-approved-tools' && event.type === 'tool_execution_start') return { ...event, toolName: approvedToolNames[2] };
      if (mutation === 'duplicate-tool-call-id' && event.type.startsWith('tool_execution_')) return { ...event, toolCallId: 'call-001' };
      if (mutation === 'empty-correlation-id' && event.type.startsWith('tool_execution_')) return { ...event, toolCallId: '' };
      if (mutation === 'non-empty-tool-arguments' && event.type === 'tool_execution_start') return { ...event, args: Object.freeze({ injected: true }) };
      if (mutation === 'tool-start-end-call-id-mismatch' && event.type === 'tool_execution_end') return { ...event, toolCallId: 'other-call' };
      if (mutation === 'tool-start-end-name-mismatch' && event.type === 'tool_execution_end') return { ...event, toolName: 'other-tool' };
      if (mutation === 'tool-is-error' && event.type === 'tool_execution_end') return { ...event, isError: true };
      if (mutation === 'tool-event-after-terminal-closure' && context.promptCount === 2 && event.type === 'agent_settled') return [event, { type: 'tool_execution_start', toolCallId: 'late-call', toolName: approvedToolNames[0], args: Object.freeze({}) }];
      if (mutation === 'late-terminal-event' && context.promptCount === 1 && event.type === 'agent_settled') return [event, { type: 'message_end', message: Object.freeze({ role: 'assistant', content: Object.freeze([Object.freeze({ type: 'text', text: JSON.stringify({ finding: expectedFindingProposal() }) })]), stopReason: 'stop' }) }];
      return event;
    },
    onFacadeCall(method: string) { recordEffect(method); },
    toolProtocolMutation: mutation === 'tool-end-before-settlement'
      ? 'tool-end-before-settlement'
      : mutation === 'terminal-before-tool-settlement'
        ? 'terminal-before-tool-settlement'
        : undefined,
  });
  const originalFactory = control.sdkSessionFactory;
  const sdkSessionFactory = async (request: SdkRequest) => {
    recordEffect('factory');
    if (mutation === 'factory-raw-rejection') throw new Error(rawCause);
    const factoryRequest = mutation === 'in-flight-execution-tool'
      ? Object.freeze({
        ...request,
        custom_tools: Object.freeze(request.custom_tools.map((tool: TestTool, index: number) => index === 0 ? Object.freeze({
          ...tool,
          async execute(...args: [string, unknown, AbortSignal?]) { enteredTool?.(); await toolRelease; return tool.execute(...args); },
        }) : tool)),
      })
      : request;
    const facade = await originalFactory(factoryRequest);
    if (mutation === 'facade-missing-subscribe') {
      const { subscribe, ...rest } = facade;
      return Object.freeze(rest);
    }
    if (mutation === 'non-function-unsubscribe-return') return Object.freeze({
      ...facade,
      subscribe(listener: EventListener) { facade.subscribe(listener); return Object.freeze({ not: 'a function' }); },
    });
    if (mutation === 'listener-non-undefined-return') return Object.freeze({
      ...facade,
      subscribe(listener: EventListener) { return facade.subscribe(() => { listener(Object.freeze({ type: 'message_update', assistantMessageEvent: Object.freeze({ type: 'text_delta', delta: 'x' }) })); return 'not undefined'; }); },
    });
    if (mutation === 'listener-throw') return Object.freeze({
      ...facade,
      subscribe(listener: EventListener) { return facade.subscribe(() => { listener(Object.freeze({ type: 'message_update', assistantMessageEvent: Object.freeze({ type: 'text_delta', delta: 'x' }) })); throw new Error(rawCause); }); },
    });
    if (mutation === 'facade-extra-method') return Object.freeze({ ...facade, retry: () => undefined });
    if (mutation === 'facade-not-frozen') return { ...facade };
    const nonFrozenStatusMethods = Object.freeze({
      'non-frozen-set-active-tools-status': 'setActiveTools',
      'non-frozen-prompt-status': 'prompt',
      'non-frozen-get-actual-model-status': 'getActualModel',
      'non-frozen-abort-status': 'abort',
      'non-frozen-wait-for-idle-status': 'waitForIdle',
      'non-frozen-dispose-status': 'dispose',
    });
    const extraFieldStatusMethods = Object.freeze({
      'extra-field-set-active-tools-status': 'setActiveTools',
      'extra-field-prompt-status': 'prompt',
      'extra-field-get-actual-model-status': 'getActualModel',
      'extra-field-abort-status': 'abort',
      'extra-field-wait-for-idle-status': 'waitForIdle',
      'extra-field-dispose-status': 'dispose',
    });
    const nonFrozenStatusMethod = Object.entries(nonFrozenStatusMethods).find(([key]) => key === mutation)?.[1];
    if (nonFrozenStatusMethod === 'setActiveTools') return Object.freeze({
      ...facade,
      setActiveTools(names: readonly string[]) { return { ...facade.setActiveTools(names) }; },
    });
    if (nonFrozenStatusMethod === 'prompt') return Object.freeze({
      ...facade,
      async prompt(text: string, options: TestRecord) { return { ...(await facade.prompt(text, options)) }; },
    });
    if (nonFrozenStatusMethod === 'getActualModel') return Object.freeze({
      ...facade,
      getActualModel() { return { ...facade.getActualModel() }; },
    });
    if (nonFrozenStatusMethod === 'abort') return Object.freeze({
      ...facade,
      async abort() { return { ...(await facade.abort()) }; },
    });
    if (nonFrozenStatusMethod === 'waitForIdle') return Object.freeze({
      ...facade,
      async waitForIdle() { return { ...(await facade.waitForIdle()) }; },
    });
    if (nonFrozenStatusMethod === 'dispose') return Object.freeze({
      ...facade,
      dispose() { return { ...facade.dispose() }; },
    });
    const extraFieldStatusMethod = Object.entries(extraFieldStatusMethods).find(([key]) => key === mutation)?.[1];
    if (extraFieldStatusMethod === 'setActiveTools') return Object.freeze({
      ...facade,
      setActiveTools(names: readonly string[]) { return Object.freeze({ ...facade.setActiveTools(names), extra_status: true }); },
    });
    if (extraFieldStatusMethod === 'prompt') return Object.freeze({
      ...facade,
      async prompt(text: string, options: TestRecord) { return Object.freeze({ ...(await facade.prompt(text, options)), extra_status: true }); },
    });
    if (extraFieldStatusMethod === 'getActualModel') return Object.freeze({
      ...facade,
      getActualModel() { return Object.freeze({ ...facade.getActualModel(), extra_identity: true }); },
    });
    if (extraFieldStatusMethod === 'abort') return Object.freeze({
      ...facade,
      async abort() { return Object.freeze({ ...(await facade.abort()), extra_status: true }); },
    });
    if (extraFieldStatusMethod === 'waitForIdle') return Object.freeze({
      ...facade,
      async waitForIdle() { return Object.freeze({ ...(await facade.waitForIdle()), extra_status: true }); },
    });
    if (extraFieldStatusMethod === 'dispose') return Object.freeze({
      ...facade,
      dispose() { return Object.freeze({ ...facade.dispose(), extra_status: true }); },
    });
    if (mutation === 'wrong-set-active-tools-status') return Object.freeze({
      ...facade,
      setActiveTools(names: readonly string[]) { facade.setActiveTools(names); return Object.freeze({ active_tool_names: Object.freeze([approvedToolNames[0]]) }); },
    });
    if (mutation === 'wrong-prompt-status') return Object.freeze({
      ...facade,
      async prompt(text: string, options: TestRecord) { await facade.prompt(text, options); return Object.freeze({ settled: false }); },
    });
    if (mutation === 'sync-prompt-status') return Object.freeze({
      ...facade,
      prompt(text: string, options: TestRecord) { void facade.prompt(text, options).catch(() => undefined); return Object.freeze({ settled: true }); },
    });
    if (mutation === 'wrong-get-actual-model-status') return Object.freeze({
      ...facade,
      getActualModel() { facade.getActualModel(); return Object.freeze({ provider: approvedModel.provider, model_id: approvedModel.model_id, extra: true }); },
    });
    if (mutation === 'actual-model-mismatch-execution') {
      let modelReads = 0;
      return Object.freeze({
        ...facade,
        getActualModel() {
          modelReads += 1;
          if (modelReads === 1) return facade.getActualModel();
          facade.getActualModel();
          return Object.freeze({ provider: 'ambient-default', model_id: 'raw-secret-model' });
        },
      });
    }
    if (mutation === 'wrong-abort-status') return Object.freeze({
      ...facade,
      async abort() { await facade.abort(); return Object.freeze({ aborted: false }); },
    });
    if (mutation === 'wrong-wait-for-idle-status') return Object.freeze({
      ...facade,
      async waitForIdle() { await facade.waitForIdle(); return Object.freeze({ idle: false }); },
    });
    if (mutation === 'wrong-dispose-status') return Object.freeze({
      ...facade,
      dispose() { facade.dispose(); return Object.freeze({ disposed: false }); },
    });
    if (mutation === 'prompt-raw-rejection') return Object.freeze({
      ...facade,
      async prompt() { throw new Error(rawCause); },
    });
    if (mutation === 'in-flight-discovery-prompt') return Object.freeze({
      ...facade,
      async prompt(text: string, options: TestRecord) { enteredPrompt?.(); await promptRelease; return facade.prompt(text, options); },
    });
    const postDisposeMethod = mutation.startsWith('post-dispose-') ? mutation.slice('post-dispose-'.length) : undefined;
    if (postDisposeMethod) return Object.freeze({
      ...facade,
      dispose() {
        const status = facade.dispose();
        postDisposeAttempts.push(postDisposeMethod);
        if (postDisposeMethod === 'subscribe') facade.subscribe(() => undefined);
        if (postDisposeMethod === 'setActiveTools') facade.setActiveTools(Object.freeze([]));
        if (postDisposeMethod === 'prompt') void facade.prompt('post-dispose', Object.freeze({ expandPromptTemplates: false })).catch(() => undefined);
        if (postDisposeMethod === 'getActualModel') facade.getActualModel();
        if (postDisposeMethod === 'abort') void facade.abort().catch(() => undefined);
        if (postDisposeMethod === 'waitForIdle') void facade.waitForIdle().catch(() => undefined);
        throw new Error('facade disposed');
      },
    });
    return facade;
  };
  return Object.freeze({
    mutation,
    sdkSessionFactory,
    effects,
    requests: control.requests,
    calls: control.calls,
    async waitForPrompt() { await promptEntered; },
    releasePrompt() { releasePrompt?.(); },
    async waitForTool() { await toolEntered; },
    releaseTool() { releaseTool?.(); },
    async holdBusinessCallback() { enteredBusinessCallback?.(); await businessCallbackRelease; },
    async waitForBusinessCallback() { await businessCallbackEntered; },
    releaseBusinessCallback() { releaseBusinessCallback?.(); },
    postDisposeAttempts,
    count(effect: string) { return effects.filter((value) => value === effect).length; },
  });
}

export function createLocalAnalysisExecutionDouble(options?: ExecutionDoubleOptions): LocalAnalysisExecution;
export function createLocalAnalysisExecutionDouble({ events, onProfile, onCalculate, onValidate }: ExecutionDoubleOptions = {}) {
  return {
    async preflightApprovedFixture({ source }: PreflightFixtureInput) {
      const fixture = expectedAnalysisInput().fixture;
      if (!source || JSON.stringify(source) !== JSON.stringify(fixture)) throw new Error('FIXTURE_MISMATCH');
      const identity = Object.freeze({
        source_id: 'SRC-001', kind: fixture.kind, path: fixture.path, sha256: fixture.sha256,
        byte_size: fixtureByteSize, fixture_version: fixture.version, read_at: '2026-08-20T00:00:00.000Z',
      });
      record(events, 'analysis.preflightApprovedFixture', { source: structuredClone(source), identity: structuredClone(identity) });
      return identity;
    },
    async profileApprovedFixture({ source, run_id, confirmed_contract, ...extra }: ProfileFixtureInput) {
      if (Object.keys(extra).length || !uuidV7Pattern.test(run_id) || confirmed_contract?.run_id !== run_id || source.path !== 'member-orders-v1.csv' || source.sha256 !== expectedAnalysisInput().fixture.sha256 || source.kind !== 'csv') throw new Error('SOURCE_BOUNDARY_VIOLATION');
      record(events, 'analysis.profileApprovedFixture', { run_id, confirmed_contract });
      if (onProfile) await onProfile();
      return {
        source_id: 'SRC-001',
        fixture_version: source.version,
        columns: ['order_id', 'member_id', 'ordered_on'],
        row_count: 20,
        date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' },
      };
    },
    async calculateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, deadline_seconds, cancellation_signal, ...extra }: CalculateMetricsInput) {
      if (cancellation_signal?.aborted) throw new Error('CANCELLED');
      if (!Number.isInteger(deadline_seconds) || deadline_seconds < 0 || deadline_seconds > 30) throw new Error('ANALYSIS_EXECUTION_FAILED');
      if (deadline_seconds === 0) throw new Error('TIMEOUT');
      if (Object.keys(extra).length || !uuidV7Pattern.test(run_id) || confirmed_contract?.run_id !== run_id || source?.sha256 !== expectedAnalysisInput().fixture.sha256 || source?.path !== 'member-orders-v1.csv' || source?.kind !== 'csv') throw new Error('ANALYSIS_EXECUTION_FAILED');
      record(events, 'analysis.calculateMemberRepurchaseMetrics', { run_id, confirmed_contract, deadline_seconds, cancellation_signal });
      if (onCalculate) await onCalculate({ cancellation_signal, run_id, confirmed_contract });
      return {
        result: { ...referenceOracle, calculation_kind: 'sql' },
        canonical_asset: {
          artifact_id: 'Q-001',
          category: 'query',
          path: 'queries/Q-001.sql',
          media_type: 'application/sql',
          bytes: Buffer.from(canonicalQueryBytes),
        },
      };
    },
    async validateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, sql_result, deadline_seconds, cancellation_signal, ...extra }: ValidateMetricsInput) {
      if (cancellation_signal?.aborted) throw new Error('CANCELLED');
      if (!Number.isInteger(deadline_seconds) || deadline_seconds < 0 || deadline_seconds > 30) throw new Error('ANALYSIS_EXECUTION_FAILED');
      if (deadline_seconds === 0) throw new Error('TIMEOUT');
      if (Object.keys(extra).length || !uuidV7Pattern.test(run_id) || confirmed_contract?.run_id !== run_id || source?.sha256 !== expectedAnalysisInput().fixture.sha256 || source?.path !== 'member-orders-v1.csv' || source?.kind !== 'csv') throw new Error('ANALYSIS_EXECUTION_FAILED');
      if (sql_result && JSON.stringify(sql_result) !== JSON.stringify({ ...referenceOracle, calculation_kind: 'sql' })) throw new Error('VALIDATION_FAILED');
      record(events, 'analysis.validateMemberRepurchaseMetrics', { run_id, confirmed_contract, deadline_seconds, cancellation_signal });
      if (onValidate) await onValidate({ cancellation_signal, run_id, confirmed_contract, sql_result });
      return {
        result: { ...referenceOracle, calculation_kind: 'python_validation' },
        canonical_asset: {
          artifact_id: 'S-001',
          category: 'script',
          path: 'scripts/S-001.py',
          media_type: 'text/plain',
          bytes: Buffer.from(canonicalScriptBytes),
        },
      };
    },
  };
}

export function createRunArtifactStoreDouble(options?: { events?: EventLog[] }): RunArtifactStore;
export function createRunArtifactStoreDouble({ events }: { events?: EventLog[] } = {}) {
  const runs = new Map<string, ArtifactState>();
  const command = <T extends ArtifactWriteInput>(input: T, keys: readonly string[]): T => {
    if (!exactKeys(input, [...keys, 'cancellation_signal']) || !isArtifactCommand(input) || !uuidV7Pattern.test(input.run_id)
      || input.cancellation_signal.aborted) throw new Error('ARTIFACT_WRITE_FAILED');
    return input;
  };
  const existing = (run_id: string): ArtifactState => {
    const state = runs.get(run_id);
    if (!state) throw new Error('ARTIFACT_WRITE_FAILED');
    return state;
  };
  return {
    async preflightRunRoot() {
      const result = Object.freeze({ ready: true });
      record(events, 'artifact.preflightRunRoot', { result: structuredClone(result) });
      return result;
    },
    async beginRun(input: Parameters<RunArtifactStore['beginRun']>[0]) {
      const { run_id, initial_manifest, cancellation_signal } = command(input, ['run_id', 'initial_manifest']);
      if (runs.has(run_id)) throw new Error('RUN_COLLISION');
      if (!exactKeys(initial_manifest, ['schema_version', 'run_id', 'analysis_kind', 'status', 'started_at', 'product', 'runtime', 'adapter', 'profile', 'model', 'contract', 'sources', 'artifacts'])
        || initial_manifest.schema_version !== '2.0' || initial_manifest.run_id !== run_id || initial_manifest.status !== 'in_progress'
        || initial_manifest.analysis_kind !== 'analyst_assistant' || !Array.isArray(initial_manifest.sources) || initial_manifest.sources.length !== 1
        || !Array.isArray(initial_manifest.artifacts) || initial_manifest.artifacts.length !== 0) throw new Error('ARTIFACT_WRITE_FAILED');
      runs.set(run_id, { manifest: structuredClone(initial_manifest), assets: [], confirmed: false });
      record(events, 'artifact.beginRun', { run_id, initial_manifest: structuredClone(initial_manifest), cancellation_signal });
      return { run_id };
    },
    async commitConfirmedContract(input: Parameters<RunArtifactStore['commitConfirmedContract']>[0]) {
      const { run_id, contract, cancellation_signal } = command(input, ['run_id', 'contract']);
      const state = existing(run_id);
      if (!exactKeys(contract, ['schema_version', 'run_id', 'confirmed_at', 'original_question', 'question', 'objective', 'source_ids', 'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints'])
        || contract.schema_version !== '1.0' || contract.run_id !== run_id) throw new Error('CONTRACT_VERSION_UNSUPPORTED');
      const bytes = Buffer.from(JSON.stringify(contract), 'utf8');
      if (state.manifest.contract.path !== 'analysis-contract.json' || state.manifest.contract.sha256 !== sha256(bytes)) throw new Error('ARTIFACT_WRITE_FAILED');
      state.confirmed = true;
      state.contract = structuredClone(contract);
      record(events, 'artifact.commitConfirmedContract', { run_id, contract: structuredClone(contract), cancellation_signal });
      return { committed: true, descriptor: { path: 'analysis-contract.json', byte_size: bytes.byteLength, sha256: sha256(bytes) } };
    },
    async appendAsset(input: Parameters<RunArtifactStore['appendAsset']>[0]) {
      const { run_id, asset, cancellation_signal } = command(input, ['run_id', 'asset']);
      const state = existing(run_id);
      if (!asset) throw new Error('ARTIFACT_WRITE_FAILED');
      const contract = Object.entries(assetContracts).find(([artifactId]) => artifactId === asset.artifact_id)?.[1];
      if (!state.confirmed || state.manifest.status !== 'in_progress' || !contract || !exactKeys(asset, ['artifact_id', 'category', 'path', 'media_type', 'bytes']) || asset.category !== contract.category || asset.path !== contract.path || asset.media_type !== contract.media_type || !(asset.bytes instanceof Uint8Array) || state.assets.some((entry) => entry.artifact_id === asset.artifact_id)) throw new Error('ARTIFACT_WRITE_FAILED');
      const snapshot = { ...asset, bytes: Buffer.from(asset.bytes) };
      state.assets.push(snapshot);
      record(events, 'artifact.appendAsset', { run_id, artifact_id: asset.artifact_id, asset: snapshot, cancellation_signal });
      return {
        appended: true,
        descriptor: artifactDescriptor(snapshot),
      };
    },
    async replaceManifest(input: Parameters<RunArtifactStore['replaceManifest']>[0]) {
      const { run_id, next_manifest, cancellation_signal } = command(input, ['run_id', 'next_manifest']);
      const state = existing(run_id);
      if (state.manifest.status !== 'in_progress') throw new Error('TERMINAL_IMMUTABLE');
      if (!next_manifest) throw new Error('ARTIFACT_WRITE_FAILED');
      if (!exactKeys(next_manifest, next_manifest.status === 'in_progress'
        ? ['schema_version', 'run_id', 'analysis_kind', 'status', 'started_at', 'product', 'runtime', 'adapter', 'profile', 'model', 'contract', 'sources', 'artifacts']
        : ['schema_version', 'run_id', 'analysis_kind', 'status', 'started_at', 'product', 'runtime', 'adapter', 'profile', 'model', 'contract', 'sources', 'artifacts', 'ended_at', 'terminal_detail'])
        || next_manifest.schema_version !== '2.0' || next_manifest.run_id !== run_id || !['in_progress', 'failed', 'cancelled'].includes(next_manifest.status)) throw new Error('ARTIFACT_WRITE_FAILED');
      const retainedDescriptors = manifestArtifactOrder
        .map((artifact_id) => state.assets.find((asset) => asset.artifact_id === artifact_id))
        .filter((asset): asset is AnalysisAsset => asset !== undefined)
        .map(artifactDescriptor);
      if (!['failed', 'cancelled'].includes(next_manifest.status)
        ? next_manifest.artifacts.length !== 0
        : JSON.stringify(next_manifest.artifacts) !== JSON.stringify(retainedDescriptors)) throw new Error('ARTIFACT_WRITE_FAILED');
      state.manifest = structuredClone(next_manifest);
      record(events, 'artifact.replaceManifest', {
        run_id,
        status: next_manifest.status,
        terminal_detail: next_manifest.terminal_detail,
        manifest: structuredClone(next_manifest), cancellation_signal,
      });
      return { replaced: true };
    },
    async commitSuccess(input: Parameters<RunArtifactStore['commitSuccess']>[0]) {
      const { run_id, next_manifest, evidence, summary, evidence_document, cancellation_signal } = command(input, ['run_id', 'next_manifest', 'evidence', 'summary', 'evidence_document']);
      const state = existing(run_id);
      if (!state.confirmed || state.manifest.status !== 'in_progress' || next_manifest?.schema_version !== '2.0' || next_manifest?.run_id !== run_id || next_manifest?.status !== 'succeeded'
        || !Array.isArray(next_manifest.artifacts) || next_manifest.artifacts.map(({ artifact_id }) => artifact_id).join(',') !== 'Q-001,S-001,O-001,O-002,DOC-SUMMARY,DOC-EVIDENCE'
        || evidence?.run_id !== run_id || typeof summary !== 'string' || !summary || typeof evidence_document !== 'string' || !evidence_document) throw new Error('ARTIFACT_WRITE_FAILED');
      const summaryAsset = { artifact_id: 'DOC-SUMMARY', category: 'summary', path: 'summary.md', media_type: 'text/markdown', bytes: Buffer.from(summary, 'utf8') };
      const evidenceDocumentAsset = { artifact_id: 'DOC-EVIDENCE', category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown', bytes: Buffer.from(evidence_document, 'utf8') };
      const persistedAssets = [...state.assets, summaryAsset, evidenceDocumentAsset];
      const indexedDescriptors = manifestArtifactOrder.map((artifact_id) => {
        const persisted = persistedAssets.find((asset) => asset.artifact_id === artifact_id);
        if (!persisted) throw new Error('ARTIFACT_WRITE_FAILED');
        return artifactDescriptor(persisted);
      });
      if (JSON.stringify(next_manifest.artifacts) !== JSON.stringify(indexedDescriptors)) throw new Error('ARTIFACT_WRITE_FAILED');
      state.assets = persistedAssets;
      state.manifest = structuredClone(next_manifest);
      state.evidence = structuredClone(evidence);
      record(events, 'artifact.commitSuccess', { run_id, next_manifest: structuredClone(next_manifest), evidence: structuredClone(evidence), summary, evidence_document, cancellation_signal });
      return { committed: true, success_manifest_is_last: true };
    },
    async readTerminalRun(input: Parameters<RunArtifactStore['readTerminalRun']>[0]) {
      if (!exactKeys(input, ['run_id']) || typeof input.run_id !== 'string' || !uuidV7Pattern.test(input.run_id)) throw new Error('ARTIFACT_WRITE_FAILED');
      const { run_id } = input;
      const state = existing(run_id);
      if (!['succeeded', 'failed', 'cancelled'].includes(state.manifest.status)) throw new Error('ARTIFACT_WRITE_FAILED');
      const assets = state.manifest.artifacts.map((descriptor) => {
        const persisted = state.assets.find((asset) => asset.artifact_id === descriptor.artifact_id);
        if (!persisted || JSON.stringify(artifactDescriptor(persisted)) !== JSON.stringify(descriptor)) throw new Error('ARTIFACT_WRITE_FAILED');
        return { ...descriptor, bytes: Buffer.from(persisted.bytes) };
      });
      record(events, 'artifact.readTerminalRun', { run_id });
      return { manifest: structuredClone(state.manifest), assets };
    },
  };
}

export function createRunArtifactFaultDouble() {
  const base = createRunArtifactStoreDouble();
  return {
    ...base,
    async commitSuccess() { throw new Error('ARTIFACT_WRITE_FAILED'); },
  };
}

type AgentRuntimeFactory = () => AgentAnalysisRuntime | Promise<AgentAnalysisRuntime>;
type LocalAnalysisExecutionFactory = () => LocalAnalysisExecution | Promise<LocalAnalysisExecution>;
type RunArtifactStoreFactory = () => RunArtifactStore | Promise<RunArtifactStore>;

export async function runAgentRuntimeContract(createRuntime: AgentRuntimeFactory) {
  const runtime = await createRuntime();
  const model = { ...approvedModel };
  const calls: { tool_name: string; correlation_id: unknown }[] = [];
  const executionTools: Parameters<AgentAnalysisRuntime['openSession']>[0]['execution_tools'] = Object.freeze(approvedToolNames.map((tool_name, index) => Object.freeze({
    tool_name,
    async invoke(input: TestRecord) {
      assert.deepEqual(Object.keys(input).sort(), ['arguments', 'correlation_id']);
      assert.equal(input.correlation_id, `call-00${index + 1}`);
      assert.deepEqual(input.arguments, {});
      calls.push({ tool_name, correlation_id: input.correlation_id });
      return expectedBoundedToolResult(tool_name);
    },
  })));
  await assert.rejects(() => invokeNegativeOperationalPort(runtime.openSession, [{ model: { provider: 'ambient-default', model_id: 'other' }, discovery_tools: [], execution_tools: executionTools }]), /MODEL_UNAVAILABLE/);
  await assert.rejects(() => invokeNegativeOperationalPort(runtime.openSession, [{ model: undefined, discovery_tools: [], execution_tools: executionTools }]), /MODEL_UNAVAILABLE/);
  await assert.rejects(() => invokeNegativeOperationalPort(runtime.openSession, [{ model, discovery_tools: [], execution_tools: approvedToolNames }]));
  const sdkLeakingTools = executionTools.map((descriptor, index) => index === 0 ? Object.freeze({ ...descriptor, parameters: {} }) : descriptor);
  await assert.rejects(() => invokeNegativeOperationalPort(runtime.openSession, [{ model, discovery_tools: [], execution_tools: sdkLeakingTools }]));
  await runtime.preflightModel(Object.freeze({ model: Object.freeze(model) }));
  const session = await runtime.openSession({ model, discovery_tools: [], execution_tools: executionTools });
  assert.deepEqual(await session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() })), expectedAnalysisProposal());
  const runId = '0198d943-8b71-7a11-9abc-0000000000a1';
  const contract = expectedConfirmedContract(runId, '2026-08-20T00:00:00.000Z');
  const abort = new AbortController();
  assert.deepEqual(
    await session.execute({ confirmed_contract: contract, finding_context: expectedFindingContext(), cancellation_signal: abort.signal, deadline_seconds: 300 }),
    { actual_model: model, finding: expectedFindingProposal() },
  );
  assert.deepEqual(calls, approvedToolNames.map((tool_name, index) => ({ tool_name, correlation_id: `call-00${index + 1}` })));
  await assert.rejects(() => invokeNegativeOperationalPort(session.execute, [{ confirmed_contract: contract, finding_context: expectedFindingContext(), cancellation_signal: abort.signal, deadline_seconds: 300, sdk_call_id: 'sdk-001' }]), /PROTOCOL_FAILURE/);
  await assert.rejects(() => invokeNegativeOperationalPort(session.execute, [{ confirmed_contract: contract, finding_context: expectedFindingContext(), cancellation_signal: abort.signal, deadline_seconds: 301 }]), /TIMEOUT|PROTOCOL_FAILURE/);
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: true });
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: true });
  await assert.rejects(() => invokeNegativeOperationalPort(session.execute, [{ confirmed_contract: contract, finding_context: expectedFindingContext(), cancellation_signal: abort.signal }]), /PROTOCOL_FAILURE/);
}

export async function runLocalAnalysisExecutionContract(createExecution: LocalAnalysisExecutionFactory) {
  const execution = await createExecution();
  const source = expectedAnalysisInput().fixture;
  const run_id = '0198d943-8b71-7a11-9abc-0000000000a1';
  const confirmed_contract = expectedConfirmedContract(run_id, '2026-08-20T00:00:00.000Z');
  const abort = new AbortController();
  const preflight = requiredRecord(await execution.preflightApprovedFixture(Object.freeze({ source: Object.freeze({ ...source }) })));
  assert.equal(Object.isFrozen(preflight), true);
  assert.deepEqual(Object.keys(preflight).sort(), ['byte_size', 'fixture_version', 'kind', 'path', 'read_at', 'sha256', 'source_id']);
  assert.deepEqual({ ...preflight, read_at: '<observed>' }, {
    source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256,
    byte_size: fixtureByteSize, fixture_version: 'member-orders-v1', read_at: '<observed>',
  });
  if (typeof preflight.read_at !== 'string') throw new Error('preflight read_at must be a string');
  assert.match(preflight.read_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(await execution.profileApprovedFixture({ source, run_id, confirmed_contract }), {
    source_id: 'SRC-001',
    fixture_version: 'member-orders-v1',
    columns: ['order_id', 'member_id', 'ordered_on'],
    row_count: 20,
    date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' },
  });
  const sql = await execution.calculateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, deadline_seconds: 30, cancellation_signal: abort.signal });
  assert.deepEqual(sql, {
    result: { ...referenceOracle, calculation_kind: 'sql' },
    canonical_asset: { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: canonicalQueryBytes },
  });
  assert.deepEqual(
    await execution.validateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, sql_result: sql.result, deadline_seconds: 30, cancellation_signal: abort.signal }),
    {
      result: { ...referenceOracle, calculation_kind: 'python_validation' },
      canonical_asset: { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: canonicalScriptBytes },
    },
  );
  for (const input of [{ source: { ...source, path: '../orders.csv' } }, { source: { ...source, sha256: '0'.repeat(64) } }, { source: { ...source, kind: 'json' } }, { source, sql: 'select * from orders' }, { source, script: 'import os' }, { source, command: 'sh' }, { source, environment: { SECRET: 'x' } }, { source, output_path: 'x' }]) {
    await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [{ run_id, confirmed_contract, deadline_seconds: 30, cancellation_signal: abort.signal, ...input }]), /SOURCE_BOUNDARY_VIOLATION|ANALYSIS_EXECUTION_FAILED/);
  }
  await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [{ source, run_id, confirmed_contract, cancellation_signal: abort.signal }]), /ANALYSIS_EXECUTION_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [{ source, run_id, confirmed_contract, deadline_seconds: -1, cancellation_signal: abort.signal }]), /ANALYSIS_EXECUTION_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [{ source, run_id, confirmed_contract, deadline_seconds: 0.5, cancellation_signal: abort.signal }]), /ANALYSIS_EXECUTION_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [{ source, run_id, confirmed_contract, deadline_seconds: 31, cancellation_signal: abort.signal }]), /ANALYSIS_EXECUTION_FAILED/);
  await assert.rejects(() => execution.calculateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, deadline_seconds: 0, cancellation_signal: abort.signal }), /TIMEOUT/);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(() => execution.calculateMemberRepurchaseMetrics({ source, run_id, confirmed_contract, deadline_seconds: 30, cancellation_signal: cancelled.signal }), /CANCELLED/);
  await assert.rejects(() => invokeNegativeOperationalPort(execution.validateMemberRepurchaseMetrics, [{ source, run_id, confirmed_contract, sql_result: { ...sql.result, signal: { status: 'contradicted' } }, deadline_seconds: 30, cancellation_signal: abort.signal }]), /VALIDATION_FAILED/);
}

export async function runArtifactStoreContract(createStore: RunArtifactStoreFactory) {
  const store = await createStore();
  const cancellation_signal = activeCancellationSignal();
  const runId = '0198d943-8b71-7a11-9abc-0000000000a1';
  const fixture = expectedArtifactRun(runId);
  const preflight = await store.preflightRunRoot();
  assert.deepEqual(preflight, { ready: true });
  assert.equal(Object.isFrozen(preflight), true);
  await assert.rejects(() => invokeNegativeOperationalPort(store.beginRun, [{ run_id: runId }]), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(store.beginRun, [{ run_id: runId, initial_manifest: fixture.initialManifest, cancellation_signal, ambient_root: '/tmp' }]), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(store.beginRun, [{ run_id: runId, initial_manifest: fixture.initialManifest }]), /ARTIFACT_WRITE_FAILED/);
  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  await assert.rejects(() => store.beginRun(artifactMutatorInput({ run_id: runId, initial_manifest: fixture.initialManifest }, alreadyAborted.signal)), /ARTIFACT_WRITE_FAILED/);
  const run = await store.beginRun(artifactMutatorInput({ run_id: runId, initial_manifest: fixture.initialManifest }, cancellation_signal));
  assert.deepEqual(run, { run_id: runId });
  await assert.rejects(() => invokeNegativeOperationalPort(store.commitConfirmedContract, [{ run_id: run.run_id, contract: fixture.contract, cancellation_signal, overwrite: true }]), /ARTIFACT_WRITE_FAILED/);
  assert.deepEqual(await store.commitConfirmedContract(artifactMutatorInput({ run_id: run.run_id, contract: fixture.contract }, cancellation_signal)), {
    committed: true,
    descriptor: { path: 'analysis-contract.json', byte_size: fixture.contractBytes.byteLength, sha256: sha256(fixture.contractBytes) },
  });
  const queryAsset = fixture.assets[0];
  const appended = await store.appendAsset(artifactMutatorInput({ run_id: runId, asset: queryAsset }, cancellation_signal));
  assert.deepEqual(appended, { appended: true, descriptor: artifactDescriptor(queryAsset) });
  await assert.rejects(() => invokeNegativeOperationalPort(store.appendAsset, [{ run_id: runId, asset: fixture.assets[1], cancellation_signal, overwrite: true }]), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => store.appendAsset(artifactMutatorInput({ run_id: '0198d943-8b71-7a11-9abc-0000000000b2', asset: fixture.assets[1] }, cancellation_signal)), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(store.appendAsset, [{ run_id: runId, asset: queryAsset }]), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => invokeNegativeOperationalPort(store.appendAsset, [artifactMutatorInput({ run_id: runId, asset: { artifact_id: 'O-001', category: 'output', path: '../outputs/O-001.json', media_type: 'application/json', bytes: Buffer.from('{}') } }, cancellation_signal)]), /ARTIFACT_WRITE_FAILED/);
  for (const asset of fixture.assets.slice(1)) await store.appendAsset(artifactMutatorInput({ run_id: runId, asset }, cancellation_signal));
  await assert.rejects(() => invokeNegativeOperationalPort(store.commitSuccess, [{
    run_id: runId, next_manifest: fixture.succeededManifest, evidence: fixture.evidence, cancellation_signal,
    summary: fixture.summary, evidence_document: fixture.evidenceDocument, fault_mode: true,
  }]), /ARTIFACT_WRITE_FAILED/);
  assert.deepEqual(await store.commitSuccess(artifactMutatorInput({
    run_id: runId,
    next_manifest: fixture.succeededManifest,
    evidence: fixture.evidence,
    summary: fixture.summary,
    evidence_document: fixture.evidenceDocument,
  }, cancellation_signal)), { committed: true, success_manifest_is_last: true });
  const terminal = await store.readTerminalRun({ run_id: runId });
  assert.deepEqual(terminal.manifest, fixture.succeededManifest);
  assert.deepEqual(terminal.assets, manifestArtifactOrder.map((artifact_id) => fixture.persistedAssetById[artifact_id]));
  await assert.rejects(() => invokeNegativeOperationalPort(store.readTerminalRun, [{ run_id: runId, repair: true }]), /ARTIFACT_WRITE_FAILED/);
  await assert.rejects(() => store.replaceManifest(artifactMutatorInput({ run_id: runId, next_manifest: fixture.failedManifest }, cancellation_signal)), /TERMINAL_IMMUTABLE/);
  await assert.rejects(() => store.beginRun(artifactMutatorInput({ run_id: runId, initial_manifest: fixture.initialManifest }, cancellation_signal)), /RUN_COLLISION/);
  await assert.rejects(() => store.readTerminalRun({ run_id: '0198d943-8b71-7a11-9abc-0000000000b2' }), /ARTIFACT_WRITE_FAILED/);

  const partial = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000b2', '2026-08-20T00:00:02.000Z');
  await store.beginRun(artifactMutatorInput({ run_id: partial.run_id, initial_manifest: partial.initialManifest }, cancellation_signal));
  await store.commitConfirmedContract(artifactMutatorInput({ run_id: partial.run_id, contract: partial.contract }, cancellation_signal));
  for (const asset of [partial.assets[0], partial.assets[1]]) await store.appendAsset(artifactMutatorInput({ run_id: partial.run_id, asset }, cancellation_signal));
  const partialTerminal = expectedTerminalManifest(partial, 'cancelled', ['Q-001', 'O-001']);
  await store.replaceManifest(artifactMutatorInput({ run_id: partial.run_id, next_manifest: partialTerminal }, cancellation_signal));
  assert.deepEqual(await store.readTerminalRun({ run_id: partial.run_id }), {
    manifest: partialTerminal,
    assets: ['Q-001', 'O-001'].map((artifact_id) => partial.persistedAssetById[artifact_id]),
  });
}

export async function runArtifactFaultContract(createStore: RunArtifactStoreFactory) {
  const store = await createStore();
  const cancellation_signal = activeCancellationSignal();
  const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000b2');
  const run = await store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest }, cancellation_signal));
  await store.commitConfirmedContract(artifactMutatorInput({ run_id: run.run_id, contract: fixture.contract }, cancellation_signal));
  for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: run.run_id, asset }, cancellation_signal));
  await assert.rejects(
    () => store.commitSuccess(artifactMutatorInput({ run_id: run.run_id, next_manifest: fixture.succeededManifest, evidence: fixture.evidence, summary: fixture.summary, evidence_document: fixture.evidenceDocument }, cancellation_signal)),
    /ARTIFACT_WRITE_FAILED/,
  );
}
