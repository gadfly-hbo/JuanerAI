import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  approvedModel,
  expectedAnalysisInput,
  expectedAnalysisProposal,
  expectedConfirmedContract,
  expectedDiscoveryContext,
  expectedFindingContext,
  expectedFindingProposal,
  canonicalFixtureBytes,
  calculateFixtureOracle,
  fixtureByteSize,
  fixtureSha256,
  parseClosedFixture,
  referenceOracle,
  sha256,
} from '../../fixtures/xanthil-local-analysis/fixture-oracle.ts';
import {
  canonicalQueryBytes,
  canonicalScriptBytes,
  createAgentRuntimeDouble,
  createLocalAnalysisExecutionDouble,
  createRunArtifactStoreDouble,
  artifactMutatorInput,
  expectedArtifactRun,
  expectedTerminalManifest,
  invokeNegativeOperationalPort,
  uuidV7Pattern,
} from '../../fixtures/xanthil-local-analysis/port-contracts.ts';
import { approvedToolNames, loadPublicSeam, requiredExport } from '../../fixtures/xanthil-local-analysis/public-seams.ts';
import type { LocalAnalysisSuccess, LocalAnalysisTerminal } from '../../../packages/application/local-analysis.ts';
import type { AgentAnalysisRuntime, LocalAnalysisExecution, RunArtifactStore } from '../../../packages/ports/local-analysis.ts';

// case:analysis-gate-negative-matrix case:preflight-confirmation-matrix case:deterministic-use-case
// case:pi-readiness-no-call case:duckdb-python-business-operations case:personal-composition-no-write
// case:authorized-install-only case:actual-target-and-artifact-scan

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const approvedRootManifest = Object.freeze({
  private: true,
  type: 'module',
  packageManager: 'npm@11.12.1',
  engines: Object.freeze({ node: '>=22.19.0' }),
  dependencies: Object.freeze({
    '@earendil-works/pi-coding-agent': '0.84.2',
    typebox: '1.3.7',
  }),
  scripts: Object.freeze({
    typecheck: 'tsc -p tsconfig.json --noEmit',
    test: 'tools/harness/validation/run',
  }),
  devDependencies: Object.freeze({
    '@types/node': '22.19.19',
    typescript: '5.9.3',
  }),
});
const approvedTsconfig = Object.freeze({
  compilerOptions: Object.freeze({
    strict: true,
    noEmit: true,
    target: 'ESNext',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    allowImportingTsExtensions: true,
    erasableSyntaxOnly: true,
    verbatimModuleSyntax: true,
    isolatedModules: true,
    moduleDetection: 'force',
    noUncheckedSideEffectImports: true,
    types: ['node'],
  }),
  files: Object.freeze([
    'packages/product-core/local-analysis.ts',
    'packages/ports/local-analysis.ts',
    'packages/application/local-analysis.ts',
    'adapters/agent-pi/local-analysis.ts',
    'adapters/analytics-duckdb/local-analysis.ts',
    'adapters/storage-local/local-analysis.ts',
    'profiles/personal/local-analysis.ts',
    'apps/cli/xanthil.ts',
    'tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts',
    'tests/unit/xanthil-local-analysis/coverage-map.test.ts',
    'tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts',
    'tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts',
    'tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.ts',
    'tests/fixtures/xanthil-local-analysis/cli-profile-harness.ts',
    'tests/fixtures/xanthil-local-analysis/coverage-map.ts',
    'tests/fixtures/xanthil-local-analysis/fixture-oracle.ts',
    'tests/fixtures/xanthil-local-analysis/pi-sdk-failure-child.ts',
    'tests/fixtures/xanthil-local-analysis/pi-sdk-failure-hook.ts',
    'tests/fixtures/xanthil-local-analysis/pi-sdk-failure-sdk.ts',
    'tests/fixtures/xanthil-local-analysis/port-contracts.ts',
    'tests/fixtures/xanthil-local-analysis/public-seams.ts',
    'apps/console/xanthil-console.ts',
    'packages/application/run-evidence-query.ts',
    'packages/product-core/run-evidence.ts',
    'packages/ports/run-evidence-reader.ts',
    'adapters/storage-local/run-evidence-reader.ts',
    'profiles/personal/console.ts',
    'tests/unit/run-evidence-console/run-evidence.unit.test.ts',
    'tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts',
    'tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts',
    'tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts',
    'tests/fixtures/run-evidence-console/run-evidence-fixtures.ts',
    'tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts',
    'tests/fixtures/run-evidence-console/console-harness.ts',
    'tests/fixtures/run-evidence-console/coverage-map.ts',
  ]),
});
const forbiddenRepositoryConfigurationNames = new Set([
  'bun.lock', 'bun.lockb', 'deno.json', 'deno.jsonc', 'npm-shrinkwrap.json',
  'package-lock.json', 'package.json', 'pipfile', 'pipfile.lock', 'pnpm-lock.yaml',
  'poetry.lock', 'pyproject.toml', 'requirements-dev.txt', 'requirements.txt',
  'setup.cfg', 'setup.py', 'tsconfig.json', 'webpack.config.js', 'webpack.config.mjs',
  'yarn.lock',
]);

type TestRecord = Record<string, unknown>;
type EventLog = TestRecord & {
  event: string;
  cancellation_signal?: AbortSignal;
  status?: string;
  run_id?: string;
  initial_manifest?: TestRecord & { sources?: readonly (TestRecord & { read_at?: string })[] };
  next_manifest?: TestRecord;
  manifest?: TestRecord;
  terminal_detail?: TestRecord;
  contract?: TestRecord;
  execution_tools?: readonly TestRecord[];
};
type Deferred = { promise: Promise<unknown>; resolve: (value?: unknown) => void; reject: (reason?: unknown) => void };
type ApplicationOptions = {
  events?: EventLog[];
  agentRuntime?: unknown;
  localAnalysisExecution?: unknown;
  runArtifactStore?: unknown;
  clock?: unknown;
  deadlineScheduler?: unknown;
  model?: unknown;
  includeModel?: boolean;
  includeDeadlineScheduler?: boolean;
};
type ArtifactStoreDouble = ReturnType<typeof createRunArtifactStoreDouble>;
type ArtifactMutatorName = 'beginRun' | 'commitConfirmedContract' | 'appendAsset' | 'replaceManifest' | 'commitSuccess';
type DeferredPair = { started: Deferred; gate: Deferred };
type ScheduledDeadline = {
  input: { at_epoch_ms: number; callback: () => unknown };
  handle: { cancel: () => undefined };
  fire: () => unknown;
  readonly cancelled: boolean;
  readonly cancelCalls: number;
};
type VirtualDeadlineControl = { scheduler: { schedule(input: ScheduledDeadline['input']): ScheduledDeadline['handle'] }; scheduled: readonly ScheduledDeadline[] };
type PendingConfiguration = (events: EventLog[], started: Deferred, gate: Deferred) => { localAnalysisExecution: unknown };
type InvalidSchedulerCase = readonly [string, () => { deadlineScheduler?: unknown; includeDeadlineScheduler?: boolean; scheduleCalls: () => number }];
type RealAnalysisContext = Awaited<ReturnType<typeof createRealAnalysis>>;
type AnalysisFailureContext = RealAnalysisContext & { input: CalculateMetricsInput };
type AnalysisFailureCase = readonly [string, (context: AnalysisFailureContext) => Promise<{ input: CalculateMetricsInput }>];
type MappedFailureCase = readonly [string, string, string, (events: EventLog[]) => ApplicationOptions, string];
type ArtifactFixture = ReturnType<typeof expectedArtifactRun>;
type ArtifactMutationCase = readonly [string, (asset: ArtifactFixture['assets'][number]) => TestRecord];
type ArtifactOperationCase = readonly [string, (store: ArtifactStoreDouble, fixture: ArtifactFixture) => Promise<unknown>];
type ClosedArtifactCommandCase = readonly [string, (store: ArtifactStoreDouble) => Promise<{ fixture: ArtifactFixture; invoke: () => Promise<unknown> }>];
type PhysicalPreflightCase = readonly [string, (context: Pick<RealAnalysisContext, 'parent' | 'workspaceRoot'>) => Promise<void>, string];
type AgentDoubleOptions = NonNullable<Parameters<typeof createAgentRuntimeDouble>[0]>;
type DriveTurn = Exclude<AgentDoubleOptions['driveTurn'], undefined>;
type ExpectedToolCalls = { profile: number; calculate: number; validate: number };
type PreflightRejectionCase = readonly [string, TestRecord, RegExp];
type PiFailureCase = readonly [string, string, TestRecord];
type PiFactoryInputCase = readonly [string, unknown];
type ProfileConfig = { workspaceRoot?: string; runRoot?: string; provider?: string; modelId?: string } & Record<PropertyKey, unknown>;

function isTestRecord(value: unknown): value is TestRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredRecord(value: unknown, label: string): TestRecord {
  if (!isTestRecord(value)) throw new Error(`${label} must be a record`);
  return value;
}

function hasRunTerminal(value: LocalAnalysisTerminal | undefined): value is Exclude<LocalAnalysisTerminal, Readonly<{ status: 'cancelled' }>> {
  return value !== undefined && 'run' in value;
}

function requiredRunTerminal(value: LocalAnalysisTerminal | undefined, label: string): Exclude<LocalAnalysisTerminal, Readonly<{ status: 'cancelled' }>> {
  if (!hasRunTerminal(value)) throw new Error(`${label} must include a run`);
  return value;
}

function isSuccessfulTerminal(value: LocalAnalysisTerminal | undefined): value is LocalAnalysisSuccess {
  return hasRunTerminal(value) && 'metrics' in value && 'finding' in value;
}

function requiredSuccessfulTerminal(value: LocalAnalysisTerminal | undefined, label: string): LocalAnalysisSuccess {
  if (!isSuccessfulTerminal(value)) throw new Error(`${label} must be successful`);
  return value;
}

function requiredEvent(events: readonly EventLog[], predicate: (event: EventLog) => boolean, label: string): EventLog {
  const event = events.find(predicate);
  if (!event) throw new Error(label);
  return event;
}

function requiredLastEvent(events: readonly EventLog[], predicate: (event: EventLog) => boolean, label: string): EventLog {
  const event = events.findLast(predicate);
  if (!event) throw new Error(label);
  return event;
}

function requiredAbortSignal(value: unknown, label: string): AbortSignal {
  if (!(value instanceof AbortSignal)) throw new Error(label);
  return value;
}

function firstScheduledDeadline(values: readonly ScheduledDeadline[]): ScheduledDeadline {
  const scheduled = values.at(0);
  if (!scheduled) throw new Error('deadline must be scheduled');
  return scheduled;
}

function recordEntry(value: unknown, key: string): unknown {
  return requiredRecord(value, 'test record')[key];
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(label);
  return value;
}

function requiredBytes(value: unknown, label: string): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(label);
  return value;
}

function errorEntry(value: unknown, key: string): unknown {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return undefined;
  return Reflect.get(value, key);
}

function exactVersion(output: string, label: string, expected: string) {
  const match = output.trim().match(/(?:^|[^0-9])(\d+)\.(\d+)\.(\d+)(?:\s|$)/);
  assert.ok(match, `${label} must report a semantic version`);
  assert.equal(`${match[1]}.${match[2]}.${match[3]}`, expected, `${label} version must be exact`);
}

function atLeastVersion(output: string, label: string, minimum: string) {
  const match = output.trim().match(/(?:^|[^0-9])(\d+)\.(\d+)\.(\d+)(?:\s|$)/);
  assert.ok(match, `${label} must report a semantic version`);
  const actual = [Number(match[1]), Number(match[2]), Number(match[3])];
  const required = minimum.split('.').map(Number);
  const comparison = actual.findIndex((part, index) => part !== required[index]);
  assert.ok(comparison === -1 || actual[comparison] > required[comparison], `${label} must satisfy >=${minimum}`);
}

function assertApprovedRootManifest(manifest: unknown) {
  assert.deepEqual(manifest, approvedRootManifest, 'root package.json must be the approved closed object');
}

function assertApprovedLock(lock: TestRecord, manifest: TestRecord) {
  assert.equal(typeof lock, 'object');
  const packages = requiredRecord(lock.packages, 'npm lock packages');
  const root = requiredRecord(packages[''], 'npm lock root');
  assert.deepEqual(root.dependencies, manifest.dependencies, 'lock root must mirror exact direct dependencies');
  assert.deepEqual(root.devDependencies, manifest.devDependencies, 'lock root must mirror exact direct dev dependencies');
  assert.equal(requiredRecord(packages['node_modules/@earendil-works/pi-coding-agent'], 'Pi lock entry').version, '0.84.2');
  assert.equal(requiredRecord(packages['node_modules/typebox'], 'typebox lock entry').version, '1.3.7');
  assert.equal(requiredRecord(packages['node_modules/@types/node'], 'Node types lock entry').version, '22.19.19');
  assert.equal(requiredRecord(packages['node_modules/typescript'], 'TypeScript lock entry').version, '5.9.3');
}

function assertProjectLocalResolution(resolved: string, packageName: string) {
  const localPrefix = join(repositoryRoot, 'node_modules') + sep;
  assert.ok(resolved.startsWith(localPrefix), `${packageName} must resolve from the project-local node_modules tree`);
}

async function runVersionCommand(command: string, args: readonly string[]) {
  const { stdout, stderr } = await execFileAsync(command, args, { cwd: repositoryRoot, encoding: 'utf8' });
  return `${stdout}${stderr}`.trim();
}

async function findRepositoryConfigurationFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const candidate = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...await findRepositoryConfigurationFiles(candidate));
    else if (forbiddenRepositoryConfigurationNames.has(entry.name)) paths.push(candidate);
  }
  return paths;
}

function controlledClock(iso = '2026-08-20T00:00:00.000Z') {
  let milliseconds = Date.parse(iso);
  const clock = () => new Date(milliseconds);
  clock.advance = (delta: number) => { milliseconds += delta; };
  return clock;
}

// Test-private deterministic composition dependency for R3.  It never uses a
// host timer; later deadline leaves can fire the retained synchronous callback
// at a deliberate virtual instant.
function createVirtualDeadlineScheduler(events?: EventLog[]): VirtualDeadlineControl {
  const scheduled: ScheduledDeadline[] = [];
  const scheduler = Object.freeze({
    schedule(input: { at_epoch_ms: number; callback: () => unknown }) {
      assert.equal(Object.isFrozen(input), true);
      assert.deepEqual(Object.keys(input).sort(), ['at_epoch_ms', 'callback']);
      assert.equal(Number.isSafeInteger(input.at_epoch_ms), true);
      assert.equal(typeof input.callback, 'function');
      events?.push({ event: 'deadline.schedule', at_epoch_ms: input.at_epoch_ms });
      let cancelled = false;
      let cancelCalls = 0;
      const cancel = () => {
        cancelCalls += 1;
        if (!cancelled) cancelled = true;
        return undefined;
      };
      const handle = Object.freeze({ cancel });
      scheduled.push({ input, handle, fire: () => input.callback(), get cancelled() { return cancelled; }, get cancelCalls() { return cancelCalls; } });
      return handle;
    },
  });
  return Object.freeze({ scheduler, scheduled });
}

function createDeferred(): Deferred {
  let resolve: (value?: unknown) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<unknown>((nextResolve, nextReject) => { resolve = nextResolve; reject = nextReject; });
  return { promise, resolve, reject };
}

async function microtaskCheckpoint() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function observeSettlement(promise: Promise<unknown>) {
  const observation: { settled: boolean; value: unknown; error: unknown } = { settled: false, value: undefined, error: undefined };
  promise.then(
    (value) => { observation.settled = true; observation.value = value; },
    (error) => { observation.settled = true; observation.error = error; },
  );
  return observation;
}

function assertLogicalTimeout(observation: { settled: boolean; value: unknown; error: unknown }) {
  assert.equal(observation.settled, true, 'deadline callback must settle the public confirmation path without awaiting pending work');
  assert.equal(observation.value, undefined, 'expiry must not return a terminal run or success claim');
  assert.ok(observation.error, 'expiry must reject with the logical timeout');
  assert.match(String(errorEntry(observation.error, 'code') ?? errorEntry(observation.error, 'message')), /TIMEOUT/);
}

function eventNames(events: readonly EventLog[]) {
  return events.map(({ event }) => event);
}

function assertOrderedEvents(events: readonly EventLog[], expected: readonly string[]) {
  const names = eventNames(events);
  let cursor = -1;
  for (const event of expected) {
    cursor = names.indexOf(event, cursor + 1);
    assert.notEqual(cursor, -1, `${event} must occur after ${expected[Math.max(0, expected.indexOf(event) - 1)]}`);
  }
}

function noExecutionSideEffects(events: readonly EventLog[]) {
  assert.equal(events.some(({ event }) => [
    'analysis.profileApprovedFixture',
    'analysis.calculateMemberRepurchaseMetrics',
    'analysis.validateMemberRepurchaseMetrics',
    'artifact.beginRun',
    'artifact.commitConfirmedContract',
    'artifact.appendAsset',
    'artifact.replaceManifest',
    'artifact.commitSuccess',
    'runtime.execute.begin',
  ].includes(event)), false);
}

async function createApplication({
  events = [],
  agentRuntime = createAgentRuntimeDouble({ events }),
  localAnalysisExecution = createLocalAnalysisExecutionDouble({ events }),
  runArtifactStore = createRunArtifactStoreDouble({ events }),
  clock = controlledClock(),
  deadlineScheduler = createVirtualDeadlineScheduler().scheduler,
  model = approvedModel,
  includeModel = true,
  includeDeadlineScheduler = true,
}: ApplicationOptions = {}) {
  const createLocalAnalysisApplication = requiredExport(await loadPublicSeam('application'), 'createLocalAnalysisApplication');
  const dependencies: TestRecord = { agentRuntime, localAnalysisExecution, runArtifactStore, model, clock, deadlineScheduler };
  if (!includeModel) delete dependencies.model;
  if (!includeDeadlineScheduler) delete dependencies.deadlineScheduler;
  return createLocalAnalysisApplication(dependencies);
}

test('TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-01, AC-XCLI-001-02, AC-XCLI-013-01] accepts the closed virtual deadline scheduler at Application composition', async () => {
  const control = createVirtualDeadlineScheduler();
  assert.equal(Object.isFrozen(control.scheduler), true);
  assert.deepEqual(Object.keys(control.scheduler), ['schedule']);
  const application = await createApplication({ deadlineScheduler: control.scheduler });
  assert.deepEqual(Object.keys(application).sort(), ['start']);
  assert.equal(typeof application.start, 'function');
  assert.deepEqual(control.scheduled, []);
});

const invalidSchedulerCases: readonly InvalidSchedulerCase[] = [
  ['missing', () => ({ includeDeadlineScheduler: false, scheduleCalls: () => 0 })],
  ['null', () => ({ deadlineScheduler: null, scheduleCalls: () => 0 })],
  ['non_plain', () => ({ deadlineScheduler: [], scheduleCalls: () => 0 })],
  ['missing_schedule', () => ({ deadlineScheduler: Object.freeze({}), scheduleCalls: () => 0 })],
  ['non_function_schedule', () => ({ deadlineScheduler: Object.freeze({ schedule: null }), scheduleCalls: () => 0 })],
  ['extra_field', () => { let calls = 0; return { deadlineScheduler: Object.freeze({ schedule() { calls += 1; }, inspect() {} }), scheduleCalls: () => calls }; }],
  ['symbol_field', () => { let calls = 0; const value: { schedule(): void } & Record<symbol, unknown> = { schedule() { calls += 1; } }; value[Symbol('inspect')] = true; return { deadlineScheduler: Object.freeze(value), scheduleCalls: () => calls }; }],
  ['inherited_schedule', () => { let calls = 0; return { deadlineScheduler: Object.freeze(Object.create({ schedule() { calls += 1; } })), scheduleCalls: () => calls }; }],
];

for (const [label, createInvalidScheduler] of invalidSchedulerCases) {
  test(`TASK-010 R3 TEST-XCLI-009 rejects deadlineScheduler ${label} before schedule, Runtime, Session, Discovery, or Artifact effects`, async () => {
    const events: EventLog[] = [];
    const { deadlineScheduler, includeDeadlineScheduler = true, scheduleCalls } = createInvalidScheduler();
    const dependencies = { events, deadlineScheduler, includeDeadlineScheduler };
    await assert.rejects(() => createApplication(dependencies), /VALIDATION_FAILED|MODEL_UNAVAILABLE/);
    assert.equal(scheduleCalls(), 0);
    assert.equal(events.length, 0);
  });
}

async function createInstrumentedApplication() {
  const events: EventLog[] = [];
  return { events, application: await createApplication({ events }) };
}

function cloneProposal() {
  return structuredClone(expectedAnalysisProposal());
}

function createCollisionStore(events: EventLog[]) {
  return {
    async preflightRunRoot() {
      events.push({ event: 'artifact.preflightRunRoot' });
      return Object.freeze({ ready: true });
    },
    async beginRun({ run_id }: { run_id: string }) {
      assert.match(run_id, uuidV7Pattern);
      events.push({ event: 'artifact.beginRun.collision', run_id });
      throw new Error('RUN_COLLISION');
    },
    async commitConfirmedContract() { assert.fail('collision must stop before contract persistence'); },
    async appendAsset() { assert.fail('collision must stop before asset append'); },
    async replaceManifest() { assert.fail('collision must not mutate the collided run'); },
    async commitSuccess() { assert.fail('collision must not finalize'); },
    async readTerminalRun() { assert.fail('collision must not read or merge the collided run'); },
  };
}

function createSignalObservingArtifactStore(events: EventLog[]) {
  const base = createRunArtifactStoreDouble({ events });
  return {
    preflightRunRoot: base.preflightRunRoot,
    async beginRun(input: Parameters<RunArtifactStore['beginRun']>[0]) {
      events.push({ event: 'artifact.beginRun.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.beginRun(input);
    },
    async commitConfirmedContract(input: Parameters<RunArtifactStore['commitConfirmedContract']>[0]) {
      events.push({ event: 'artifact.commitConfirmedContract.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.commitConfirmedContract(input);
    },
    async appendAsset(input: Parameters<RunArtifactStore['appendAsset']>[0]) {
      events.push({ event: 'artifact.appendAsset.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.appendAsset(input);
    },
    async replaceManifest(input: Parameters<RunArtifactStore['replaceManifest']>[0]) {
      events.push({ event: 'artifact.replaceManifest.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.replaceManifest(input);
    },
    async commitSuccess(input: Parameters<RunArtifactStore['commitSuccess']>[0]) {
      events.push({ event: 'artifact.commitSuccess.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.commitSuccess(input);
    },
    readTerminalRun: base.readTerminalRun,
  } satisfies RunArtifactStore;
}

test('TASK-010 R3 TEST-XCLI-008 [AC-XCLI-013-01, AC-XCLI-013-02] sends the one live attempt AbortSignal to every Artifact mutator', async () => {
  const events: EventLog[] = [];
  const runArtifactStore = createSignalObservingArtifactStore(events);
  const application = await createApplication({ events, runArtifactStore });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  let confirmationError;
  try {
    await handle.confirm(proposal);
  } catch (error) {
    confirmationError = error;
  }
  const admissions = events.filter(({ event }) => event.endsWith('.admission'));
  const firstAdmission = requiredEvent(admissions, () => true, 'beginRun admission must be recorded');
  assert.deepEqual(admissions.map(({ event }) => event), [
    'artifact.beginRun.admission',
    'artifact.commitConfirmedContract.admission',
    'artifact.appendAsset.admission',
    'artifact.appendAsset.admission',
    'artifact.appendAsset.admission',
    'artifact.appendAsset.admission',
    'artifact.commitSuccess.admission',
  ]);
  const attemptSignal = requiredAbortSignal(firstAdmission.cancellation_signal, 'beginRun must receive the attempt signal');
  assert.equal(attemptSignal.aborted, false);
  assert.equal(admissions.every(({ cancellation_signal }) => cancellation_signal === attemptSignal), true);
  assert.equal(confirmationError, undefined);
});

function createPendingArtifactStore(events: EventLog[], pendingMethod: ArtifactMutatorName, deferred: DeferredPair) {
  const base = createRunArtifactStoreDouble({ events });
  let pending = false;
  return {
    preflightRunRoot: base.preflightRunRoot,
    readTerminalRun: base.readTerminalRun,
    async beginRun(input: Parameters<RunArtifactStore['beginRun']>[0]) {
      events.push({ event: 'artifact.beginRun.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      if (pendingMethod === 'beginRun' && !pending) {
        pending = true;
        deferred.started.resolve();
        await deferred.gate.promise;
      }
      return base.beginRun(input);
    },
    async commitConfirmedContract(input: Parameters<RunArtifactStore['commitConfirmedContract']>[0]) {
      events.push({ event: 'artifact.commitConfirmedContract.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      if (pendingMethod === 'commitConfirmedContract' && !pending) {
        pending = true;
        deferred.started.resolve();
        await deferred.gate.promise;
      }
      return base.commitConfirmedContract(input);
    },
    async appendAsset(input: Parameters<RunArtifactStore['appendAsset']>[0]) {
      events.push({ event: 'artifact.appendAsset.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      if (pendingMethod === 'appendAsset' && !pending) {
        pending = true;
        deferred.started.resolve();
        await deferred.gate.promise;
      }
      return base.appendAsset(input);
    },
    async replaceManifest(input: Parameters<RunArtifactStore['replaceManifest']>[0]) {
      events.push({ event: 'artifact.replaceManifest.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      if (pendingMethod === 'replaceManifest' && !pending) {
        pending = true;
        deferred.started.resolve();
        await deferred.gate.promise;
      }
      return base.replaceManifest(input);
    },
    async commitSuccess(input: Parameters<RunArtifactStore['commitSuccess']>[0]) {
      events.push({ event: 'artifact.commitSuccess.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      if (pendingMethod === 'commitSuccess' && !pending) {
        pending = true;
        deferred.started.resolve();
        await deferred.gate.promise;
      }
      return base.commitSuccess(input);
    },
  } satisfies RunArtifactStore;
}

function createPendingCommitSuccessStore(events: EventLog[], deferred: DeferredPair, settlement: string) {
  const base = createRunArtifactStoreDouble({ events });
  return {
    preflightRunRoot: base.preflightRunRoot,
    readTerminalRun: base.readTerminalRun,
    async beginRun(input: Parameters<RunArtifactStore['beginRun']>[0]) {
      events.push({ event: 'artifact.beginRun.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.beginRun(input);
    },
    async commitConfirmedContract(input: Parameters<RunArtifactStore['commitConfirmedContract']>[0]) {
      events.push({ event: 'artifact.commitConfirmedContract.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.commitConfirmedContract(input);
    },
    async appendAsset(input: Parameters<RunArtifactStore['appendAsset']>[0]) {
      events.push({ event: 'artifact.appendAsset.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.appendAsset(input);
    },
    async replaceManifest(input: Parameters<RunArtifactStore['replaceManifest']>[0]) {
      events.push({ event: 'artifact.replaceManifest.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      return base.replaceManifest(input);
    },
    async commitSuccess(input: Parameters<RunArtifactStore['commitSuccess']>[0]) {
      events.push({ event: 'artifact.commitSuccess.admission', cancellation_signal: requiredAbortSignal(recordEntry(input, 'cancellation_signal'), 'Artifact admission must contain its cancellation signal') });
      deferred.started.resolve();
      await deferred.gate.promise;
      if (settlement === 'without_success') {
        events.push({ event: 'artifact.commitSuccess.settled_without_success' });
        throw new Error('ARTIFACT_WRITE_FAILED');
      }
      return base.commitSuccess(input);
    },
  } satisfies RunArtifactStore;
}

test('TASK-010 R3 TEST-XCLI-015 [AC-XCLI-013-01, AC-XCLI-013-02] deadline atomically aborts a permanently pending Runtime and settles TIMEOUT', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const executeStarted = createDeferred();
  const executeGate = createDeferred();
  const agentRuntime = createAgentRuntimeDouble({ events, onExecute: async () => { executeStarted.resolve(); await executeGate.promise; } });
  const application = await createApplication({ events, agentRuntime, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  const observed = observeSettlement(confirmation);
  await executeStarted.promise;
  const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'runtime.execute.begin', 'runtime execution admission must be recorded').cancellation_signal, 'runtime execution admission must contain its cancellation signal');
  assert.equal(control.scheduled[0].fire(), undefined);
  await microtaskCheckpoint();
  const checkpoint = { ...observed };
  const abortedAtCheckpoint = signal.aborted;
  executeGate.resolve();
  await confirmation.catch(() => undefined);
  assert.equal(abortedAtCheckpoint, true, 'deadline must abort the shared attempt signal');
  assertLogicalTimeout(checkpoint);
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest' || event === 'artifact.commitSuccess'), false);
  assert.equal(events.filter(({ event }) => event === 'runtime.cancel').length, 1);
  assert.equal(control.scheduled[0].cancelCalls, 1);
});

for (const pendingMethod of ['beginRun', 'commitConfirmedContract', 'appendAsset', 'commitSuccess'] as const) {
  test(`TASK-010 R3 TEST-XCLI-016 [AC-XCLI-013-01, AC-XCLI-013-02] deadline prevents late ${pendingMethod} publication and settles TIMEOUT`, async () => {
    const events: EventLog[] = [];
    const control = createVirtualDeadlineScheduler(events);
    const deferred = { started: createDeferred(), gate: createDeferred() };
    const runArtifactStore = createPendingArtifactStore(events, pendingMethod, deferred);
    const application = await createApplication({ events, runArtifactStore, deadlineScheduler: control.scheduler });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    const confirmation = handle.confirm(await handle.discover());
    const observed = observeSettlement(confirmation);
    await deferred.started.promise;
    const admissionsBeforeDeadline = events.filter(({ event }) => event.endsWith('.admission')).map(({ event }) => event);
    assert.equal(control.scheduled[0].fire(), undefined);
    await microtaskCheckpoint();
    const admissions = events.filter(({ event }) => event.endsWith('.admission'));
    const firstAdmission = requiredEvent(admissions, () => true, 'Artifact admission must be recorded');
    const checkpoint = { ...observed };
    const abortedAtCheckpoint = requiredAbortSignal(firstAdmission.cancellation_signal, 'Artifact admission must contain its cancellation signal').aborted;
    const admissionsAtCheckpoint = admissions.map(({ event }) => event);
    const publicationsAtCheckpoint = events.filter(({ event }) => event.startsWith('artifact.')).map(({ event }) => event);
    deferred.gate.resolve();
    await confirmation.catch(() => undefined);
    assert.equal(abortedAtCheckpoint, true, 'deadline must abort the only Artifact attempt signal');
    assertLogicalTimeout(checkpoint);
    assert.deepEqual(admissionsAtCheckpoint, admissionsBeforeDeadline, 'deadline winner must start no new publication unit');
    assert.deepEqual(events.filter(({ event }) => event.startsWith('artifact.')).map(({ event }) => event), publicationsAtCheckpoint, 'late settled Artifact work must not regain publication admission');
    assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest'), false, 'expiry must not write a terminal manifest');
    assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false, 'late work must not publish success');
    assert.equal(control.scheduled[0].cancelCalls, 1);
  });
}

test('TASK-010 R3 TEST-XCLI-016 [AC-XCLI-013-01, AC-XCLI-013-02] deadline prevents late terminal replaceManifest publication', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const deferred = { started: createDeferred(), gate: createDeferred() };
  const runArtifactStore = createPendingArtifactStore(events, 'replaceManifest', deferred);
  const agentRuntime = createAgentRuntimeDouble({ events, runtimeResult: { actual_model: { provider: 'wrong', model_id: 'wrong' }, finding: expectedFindingProposal() } });
  const application = await createApplication({ events, runArtifactStore, agentRuntime, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  const observed = observeSettlement(confirmation);
  await deferred.started.promise;
  const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'artifact.beginRun.admission', 'Artifact admission must be recorded').cancellation_signal, 'Artifact admission must contain its cancellation signal');
  assert.equal(control.scheduled[0].fire(), undefined);
  await microtaskCheckpoint();
  const checkpoint = { ...observed };
  const abortedAtCheckpoint = signal.aborted;
  deferred.gate.resolve();
  await confirmation.catch(() => undefined);
  assert.equal(abortedAtCheckpoint, true, 'deadline must abort before a terminal replacement can linearize');
  assertLogicalTimeout(checkpoint);
  assert.equal(events.filter(({ event }) => event === 'artifact.replaceManifest.admission').length, 1);
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest'), false, 'late terminal replacement must not linearize');
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
  assert.equal(control.scheduled[0].cancelCalls, 1);
});

for (const [label, configure] of [
  ['native execution-tool callback', (events, started, gate) => ({
    localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onProfile: async () => { started.resolve(); await gate.promise; } }),
  })],
  ['LocalAnalysisExecution calculate', (events, started, gate) => ({
    localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onCalculate: async () => { started.resolve(); await gate.promise; } }),
  })],
  ['LocalAnalysisExecution validate', (events, started, gate) => ({
    localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onValidate: async () => { started.resolve(); await gate.promise; } }),
  })],
] satisfies readonly (readonly [string, PendingConfiguration])[]) {
  test(`TASK-010 R3 TEST-XCLI-015 [AC-XCLI-013-01, AC-XCLI-013-02] deadline settles TIMEOUT while ${label} is permanently pending`, async () => {
    const events: EventLog[] = [];
    const control = createVirtualDeadlineScheduler(events);
    const started = createDeferred();
    const gate = createDeferred();
    const application = await createApplication({ events, deadlineScheduler: control.scheduler, ...configure(events, started, gate) });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    const confirmation = handle.confirm(await handle.discover());
    const observed = observeSettlement(confirmation);
    await started.promise;
    const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'runtime.execute.begin', 'runtime execution admission must be recorded').cancellation_signal, 'runtime execution admission must contain its cancellation signal');
    assert.equal(control.scheduled[0].fire(), undefined);
    await microtaskCheckpoint();
    const checkpoint = { ...observed };
    const abortedAtCheckpoint = signal.aborted;
    const publicationsAtCheckpoint = events.filter(({ event }) => event.startsWith('artifact.')).map(({ event }) => event);
    const toolEventsAtCheckpoint = eventNames(events);
    gate.resolve();
    await confirmation.catch(() => undefined);
    assert.equal(abortedAtCheckpoint, true);
    assertLogicalTimeout(checkpoint);
    if (label === 'native execution-tool callback') {
      assert.equal(toolEventsAtCheckpoint.includes('runtime.tool.invoke.begin'), true);
      assert.equal(toolEventsAtCheckpoint.includes('runtime.tool.invoke.end'), false);
    }
    assert.deepEqual(events.filter(({ event }) => event.startsWith('artifact.')).map(({ event }) => event), publicationsAtCheckpoint);
    assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest' || event === 'artifact.commitSuccess'), false);
    assert.equal(control.scheduled[0].cancelCalls, 1);
  });
}

test('TASK-010 R3 TEST-XCLI-015 [AC-XCLI-013-01, AC-XCLI-013-02] user cancel leaves the deadline signal live until expiry and cancels its handle once', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const started = createDeferred();
  const gate = createDeferred();
  const agentRuntime = createAgentRuntimeDouble({ events, onExecute: async () => { started.resolve(); await gate.promise; } });
  const application = await createApplication({ events, agentRuntime, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await started.promise;
  const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'runtime.execute.begin', 'runtime execution admission must be recorded').cancellation_signal, 'runtime execution admission must contain its cancellation signal');
  const cancellation = handle.cancel();
  await microtaskCheckpoint();
  const signalAbortedBeforeDeadline = signal.aborted;
  gate.resolve();
  const cancelled = await cancellation.catch(() => undefined);
  const confirmationResult = await confirmation.catch(() => undefined);
  assert.equal(signalAbortedBeforeDeadline, false, 'user cancellation must not abort the deadline signal before expiry');
  assert.equal(events.filter(({ event }) => event === 'runtime.cancel').length, 1);
  const terminals = events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled');
  assert.equal(terminals.length, 1);
  assert.deepEqual(confirmationResult, cancelled);
  assert.equal(control.scheduled[0].cancelCalls, 1, 'each resolved attempt path cancels its deadline handle exactly once');
});

test('TASK-010 R3 TEST-XCLI-015 [AC-XCLI-013-01, AC-XCLI-013-02] expiry wins a user-cancel versus pending Runtime race without a terminal replacement', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const started = createDeferred();
  const gate = createDeferred();
  const agentRuntime = createAgentRuntimeDouble({ events, onExecute: async () => { started.resolve(); await gate.promise; } });
  const application = await createApplication({ events, agentRuntime, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  const observed = observeSettlement(confirmation);
  await started.promise;
  const cancellation = handle.cancel();
  assert.equal(control.scheduled[0].fire(), undefined);
  await microtaskCheckpoint();
  const checkpoint = { ...observed };
  gate.resolve();
  await cancellation.catch(() => undefined);
  await confirmation.catch(() => undefined);
  assertLogicalTimeout(checkpoint);
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest'), false);
  assert.equal(control.scheduled[0].cancelCalls, 1);
});

test('TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-01, AC-XCLI-001-02] starts only after strict run-root, fixture, and model preflight order', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await handle.discover();
  assert.deepEqual(eventNames(events).slice(0, 5), [
    'artifact.preflightRunRoot',
    'analysis.preflightApprovedFixture',
    'runtime.preflightModel',
    'runtime.openSession',
    'runtime.discover',
  ]);
  await handle.cancel();
});

test('TASK-010 R3 TEST-XCLI-009 copies the preflight source read_at byte-for-byte into the confirmed initial manifest', async () => {
  const events: EventLog[] = [];
  const localAnalysisExecution: TestRecord = { ...createLocalAnalysisExecutionDouble({ events }) };
  const preflightReadAt = '2026-01-02T03:04:05.678Z';
  const preflight = createLocalAnalysisExecutionDouble({ events }).preflightApprovedFixture;
  localAnalysisExecution.preflightApprovedFixture = async (input: Parameters<LocalAnalysisExecution['preflightApprovedFixture']>[0]) => Object.freeze({ ...requiredRecord(await preflight(input), 'preflight source'), read_at: preflightReadAt });
  const clock = controlledClock('2026-08-20T00:00:00.000Z');
  const application = await createApplication({ events, localAnalysisExecution, clock });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await handle.confirm(await handle.discover());
  const begin = requiredEvent(events, ({ event }) => event === 'artifact.beginRun', 'Artifact beginRun must be recorded');
  const initialManifest = requiredRecord(begin.initial_manifest, 'initial manifest');
  const sources = initialManifest.sources;
  if (!Array.isArray(sources)) throw new Error('initial manifest sources must be an array');
  const source = requiredRecord(sources[0], 'initial manifest source');
  assert.equal(source.read_at, preflightReadAt);
  assert.notEqual(source.read_at, clock().toISOString());
});

for (const [label, override, expectedEvents, expectedCode] of [
  ['run_root_unfrozen', async () => ({ ready: true }), [], 'RUN_ROOT_UNSAFE'],
  ['run_root_null', async () => null, [], 'RUN_ROOT_UNSAFE'],
  ['fixture_extra_member', async () => Object.freeze({ source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256, byte_size: 530, fixture_version: 'member-orders-v1', read_at: '2026-01-02T03:04:05.678Z', extra: true }), ['artifact.preflightRunRoot'], 'FIXTURE_MISMATCH'],
  ['fixture_nonplain', async () => [], ['artifact.preflightRunRoot'], 'FIXTURE_MISMATCH'],
  ['fixture_invalid_read_at', async () => Object.freeze({ source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256, byte_size: 530, fixture_version: 'member-orders-v1', read_at: 'not-rfc3339' }), ['artifact.preflightRunRoot'], 'FIXTURE_MISMATCH'],
  ['model_unfrozen', async () => ({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }), ['artifact.preflightRunRoot', 'analysis.preflightApprovedFixture'], 'MODEL_UNAVAILABLE'],
  ['model_wrong_value', async () => Object.freeze({ provider: 'minimax-cn', model_id: 'wrong' }), ['artifact.preflightRunRoot', 'analysis.preflightApprovedFixture'], 'MODEL_UNAVAILABLE'],
] satisfies readonly (readonly [string, () => Promise<unknown>, readonly string[], string])[]) {
  test(`TASK-010 R3 TEST-XCLI-009 rejects ${label} closed preflight result before the next capability`, async () => {
    const events: EventLog[] = [];
    const runtime: TestRecord = { ...createAgentRuntimeDouble({ events }) };
    const analysis: TestRecord = { ...createLocalAnalysisExecutionDouble({ events }) };
    const store: TestRecord = { ...createRunArtifactStoreDouble({ events }) };
    if (label.startsWith('run_root')) store.preflightRunRoot = override;
    if (label.startsWith('fixture')) analysis.preflightApprovedFixture = override;
    if (label.startsWith('model')) runtime.preflightModel = override;
    const application = await createApplication({ events, agentRuntime: runtime, localAnalysisExecution: analysis, runArtifactStore: store });
    await assert.rejects(() => application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture }), new RegExp(expectedCode));
    assert.deepEqual(eventNames(events), expectedEvents);
  });
}

test('TASK-010 R3 TEST-XCLI-009 maps post-confirm profile SOURCE_CHANGED without a Finding or success', async () => {
  const events: EventLog[] = [];
  const baseAnalysis = createLocalAnalysisExecutionDouble({ events, onProfile: () => { throw new Error('SOURCE_CHANGED'); } });
  const analysis: TestRecord = {
    ...baseAnalysis,
    async preflightApprovedFixture(input: Parameters<LocalAnalysisExecution['preflightApprovedFixture']>[0]) {
      const preflight = await baseAnalysis.preflightApprovedFixture(input);
      return Object.freeze({ ...requiredRecord(preflight, 'preflight source'), read_at: '2026-01-02T03:04:05.678Z' });
    },
  };
  const application = await createApplication({ events, localAnalysisExecution: analysis });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  const result = requiredRunTerminal(await handle.confirm(proposal), 'source-change terminal');
  assert.equal(result.run.status, 'failed');
  assert.deepEqual(result.run.terminal_detail, { stage: 'source_read', error_code: 'SOURCE_CHANGED' });
  assert.equal(result.run.sources[0].read_at, '2026-01-02T03:04:05.678Z');
  assert.equal(Object.hasOwn(result, 'finding'), false);
  assert.equal(events.some(({ event }) => event === 'runtime.execute.end' || event === 'artifact.commitSuccess'), false);
});

test('TASK-010 R3 TEST-XCLI-015 schedules one absolute 300-second attempt before beginRun and cancels it once on success', async () => {
  const events: EventLog[] = [];
  const clock = controlledClock('2026-08-20T00:00:00.000Z');
  const control = createVirtualDeadlineScheduler(events);
  const application = await createApplication({ events, clock, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  assert.deepEqual(control.scheduled, []);
  await handle.confirm(await handle.discover());
  assert.equal(control.scheduled.length, 1);
  const scheduled = firstScheduledDeadline(control.scheduled);
  const { input, handle: deadlineHandle } = scheduled;
  assert.equal(Object.isFrozen(input), true);
  assert.deepEqual(Object.keys(input).sort(), ['at_epoch_ms', 'callback']);
  assert.equal(input.at_epoch_ms, Date.parse('2026-08-20T00:00:00.000Z') + 300_000);
  assert.equal(input.callback.length, 0);
  assert.equal(scheduled.cancelled, true);
  assert.equal(scheduled.cancelCalls, 1);
  assert.equal(events.filter(({ event }) => event === 'deadline.schedule').length, 1);
  assert.ok(eventNames(events).indexOf('deadline.schedule') < eventNames(events).indexOf('artifact.beginRun'));
  assert.equal(deadlineHandle.cancel.length, 0);
  assert.equal(deadlineHandle.cancel(), undefined);
  assert.equal(deadlineHandle.cancel(), undefined);
  assert.equal(scheduled.cancelCalls, 3);
});

for (const [code, target, prefix] of [
  ['RUN_ROOT_UNSAFE', 'runArtifactStore', []],
  ['FIXTURE_NOT_FOUND', 'localAnalysisExecution', ['artifact.preflightRunRoot']],
  ['FIXTURE_MISMATCH', 'localAnalysisExecution', ['artifact.preflightRunRoot']],
  ['SOURCE_BOUNDARY_VIOLATION', 'localAnalysisExecution', ['artifact.preflightRunRoot']],
  ['CONTRACT_VERSION_UNSUPPORTED', 'localAnalysisExecution', ['artifact.preflightRunRoot']],
  ['RUNTIME_UNAVAILABLE', 'agentRuntime', ['artifact.preflightRunRoot', 'analysis.preflightApprovedFixture']],
  ['MODEL_UNAVAILABLE', 'agentRuntime', ['artifact.preflightRunRoot', 'analysis.preflightApprovedFixture']],
] satisfies readonly (readonly [string, 'runArtifactStore' | 'localAnalysisExecution' | 'agentRuntime', readonly string[]])[]) {
  test(`TASK-010 R3 TEST-XCLI-009 maps ${code} at its preflight boundary with zero later effects`, async () => {
    const events: EventLog[] = [];
    const agentRuntime = createAgentRuntimeDouble({ events });
    const localAnalysisExecution = createLocalAnalysisExecutionDouble({ events });
    const runArtifactStore = createRunArtifactStoreDouble({ events });
    if (target === 'runArtifactStore') runArtifactStore.preflightRunRoot = async () => { throw new Error(code); };
    if (target === 'localAnalysisExecution') localAnalysisExecution.preflightApprovedFixture = async () => { events.push({ event: 'analysis.preflightApprovedFixture' }); throw new Error(code); };
    if (target === 'agentRuntime') agentRuntime.preflightModel = async () => { events.push({ event: 'runtime.preflightModel' }); throw new Error(code); };
    const application = await createApplication({ events, agentRuntime, localAnalysisExecution, runArtifactStore });
    await assert.rejects(() => application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture }), new RegExp(code));
    assert.deepEqual(eventNames(events), [...prefix, ...(target === 'runArtifactStore' ? [] : [target === 'localAnalysisExecution' ? 'analysis.preflightApprovedFixture' : 'runtime.preflightModel'])]);
    noExecutionSideEffects(events);
    assert.equal(events.some(({ event }) => ['runtime.openSession', 'runtime.discover'].includes(event)), false);
  });
}

function createCommitFailureStore(events: EventLog[]) {
  const store = createRunArtifactStoreDouble({ events });
  return {
    ...store,
    async commitSuccess() {
      events.push({ event: 'artifact.commitSuccess.failed' });
      throw new Error('ARTIFACT_WRITE_FAILED');
    },
  };
}

async function expectMappedFailure(promise: Promise<unknown>, events: readonly EventLog[], stage: string, errorCode: string) {
  let result: unknown;
  let caught: unknown;
  try {
    result = await promise;
  } catch (error) {
    caught = error;
  }
  const terminal = events.findLast(({ event, status }) => event === 'artifact.replaceManifest' && status === 'failed');
  const resultRecord = result === null || typeof result !== 'object' || Array.isArray(result) ? undefined : requiredRecord(result, 'mapped result');
  const resultRun = resultRecord?.run === undefined ? undefined : requiredRecord(resultRecord.run, 'mapped result run');
  if (resultRun) {
    assert.equal(resultRun.status, 'failed');
    assert.deepEqual(resultRun.terminal_detail, { stage, error_code: errorCode });
  } else if (terminal) {
    assert.deepEqual(terminal.terminal_detail, { stage, error_code: errorCode });
  } else {
    assert.match(String(errorEntry(caught, 'message')), new RegExp(`${stage}.*${errorCode}|${errorCode}.*${stage}`));
  }
}

async function expectCancelled(promise: Promise<unknown>) {
  try {
    const result = await promise;
    const resultRecord = requiredRecord(result, 'cancelled result');
    const run = resultRecord.run === undefined ? undefined : requiredRecord(resultRecord.run, 'cancelled result run');
    assert.equal(run?.status ?? resultRecord.status, 'cancelled');
  } catch (error) {
    assert.match(String(errorEntry(error, 'message')), /CANCELLED/);
  }
}

function assertCancelledTerminal(events: readonly EventLog[], stage: string) {
  const terminals = events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled');
  assert.equal(terminals.length, 1);
  const terminal = requiredEvent(terminals, () => true, 'cancelled terminal must be recorded');
  const terminalDetail = requiredRecord(terminal.terminal_detail, 'cancelled terminal detail');
  const terminalManifest = requiredRecord(terminal.manifest, 'cancelled terminal manifest');
  assert.deepEqual(terminalDetail, { stage });
  assert.equal(Object.hasOwn(terminalDetail, 'error_code'), false);
  assert.equal(Object.hasOwn(terminalManifest, 'evidence'), false);
  assert.equal(Object.hasOwn(terminalManifest, 'success'), false);
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
}

test('TASK-010 R3 TEST-XCLI-015 [AC-XCLI-013-01, AC-XCLI-013-02] stable model failure cancels its scheduled deadline exactly once', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const agentRuntime = createAgentRuntimeDouble({
    events,
    runtimeResult: { actual_model: { provider: 'wrong-provider', model_id: 'wrong-model' }, finding: expectedFindingProposal() },
  });
  const application = await createApplication({ events, agentRuntime, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await expectMappedFailure(handle.confirm(await handle.discover()), events, 'runtime', 'MODEL_EXECUTION_FAILED');
  assert.equal(control.scheduled.length, 1);
  assert.equal(control.scheduled[0].cancelCalls, 1);
  assert.equal(events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'failed').length, 1);
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
  assert.equal(events.filter(({ event }) => event === 'artifact.beginRun').length, 1);
});

async function isolatedDirectory(t: { after(callback: () => void): void }, prefix: string, childName: string) {
  const parent = await mkdtemp(join(tmpdir(), prefix));
  const root = join(parent, childName);
  await mkdir(root);
  t.after(() => rm(parent, { recursive: true, force: true }));
  return { parent, root };
}

async function createRealAnalysis(t: { after(callback: () => void): void }) {
  const { parent, root: workspaceRoot } = await isolatedDirectory(t, 'xanthil-analysis-', 'workspace');
  await writeFile(join(workspaceRoot, 'member-orders-v1.csv'), await canonicalFixtureBytes());
  const module = await loadPublicSeam('analysisAdapter');
  const execution = requiredExport(module, 'createDuckDbPythonLocalAnalysisExecution')({ workspaceRoot });
  return { parent, workspaceRoot, execution };
}

async function createRealArtifactStore(t: { after(callback: () => void): void }) {
  const { parent, root: runRoot } = await isolatedDirectory(t, 'xanthil-artifact-', 'runs');
  const module = await loadPublicSeam('artifactAdapter');
  const store = requiredExport(module, 'createLocalRunArtifactStore')({ runRoot });
  return { parent, runRoot, store };
}

async function beginArtifactFixture(store: ArtifactStoreDouble, run_id = '0198d943-8b71-7a11-9abc-0000000000a1', cancellation_signal = new AbortController().signal) {
  const fixture = expectedArtifactRun(run_id);
  await store.beginRun(artifactMutatorInput({ run_id, initial_manifest: fixture.initialManifest }, cancellation_signal));
  return fixture;
}

async function confirmArtifactFixture(store: ArtifactStoreDouble, run_id = '0198d943-8b71-7a11-9abc-0000000000a1', cancellation_signal = new AbortController().signal) {
  const fixture = await beginArtifactFixture(store, run_id, cancellation_signal);
  await store.commitConfirmedContract(artifactMutatorInput({ run_id, contract: fixture.contract }, cancellation_signal));
  return fixture;
}

async function listTree(root: string) {
  const result: string[] = [];
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      result.push(`${relative(root, path)}${entry.isDirectory() ? '/' : ''}`);
      if (entry.isDirectory()) await visit(path);
    }
  }
  await visit(root);
  return result;
}

type CalculateMetricsInput = Parameters<LocalAnalysisExecution['calculateMemberRepurchaseMetrics']>[0];
type ValidateMetricsInput = Parameters<LocalAnalysisExecution['validateMemberRepurchaseMetrics']>[0];

function analysisPortInput(): CalculateMetricsInput;
function analysisPortInput(overrides: Partial<CalculateMetricsInput>): CalculateMetricsInput;
function analysisPortInput(overrides: TestRecord): TestRecord;
function analysisPortInput(overrides: TestRecord = {}): CalculateMetricsInput | TestRecord {
  const run_id = '0198d943-8b71-7a11-9abc-0000000000a1';
  return {
    source: expectedAnalysisInput().fixture,
    run_id,
    confirmed_contract: expectedConfirmedContract(run_id, '2026-08-20T00:00:00.000Z'),
    deadline_seconds: 30,
    cancellation_signal: new AbortController().signal,
    ...overrides,
  };
}

function analysisValidationInput(sql_result: ValidateMetricsInput['sql_result'], cancellation_signal = new AbortController().signal): ValidateMetricsInput {
  const input = analysisPortInput();
  return { ...input, sql_result, cancellation_signal };
}

function analysisPreflightInput(source = expectedAnalysisInput().fixture) {
  return Object.freeze({ source: Object.freeze({ ...source }) });
}

function assertSanitizedAdapterError(error: unknown) {
  assert.match(String(errorEntry(error, 'code') ?? errorEntry(error, 'message')), /FIXTURE_NOT_FOUND|FIXTURE_MISMATCH|SOURCE_CHANGED|SOURCE_BOUNDARY_VIOLATION|CONTRACT_VERSION_UNSUPPORTED|ANALYSIS_EXECUTION_FAILED|VALIDATION_FAILED|TIMEOUT|CANCELLED|ARTIFACT_WRITE_FAILED|RUN_COLLISION|TERMINAL_IMMUTABLE/);
  assert.equal(/stdout|stderr|duckdb|python|spawn|ENOENT|EACCES|\/private\/|\/tmp\//i.test(String(errorEntry(error, 'stack') ?? errorEntry(error, 'message'))), false);
  return true;
}

test('task-003 application helper health: proposal oracle and arbitrary UUIDv7 Artifact double are deterministic', async () => {
  const proposal = expectedAnalysisProposal();
  assert.deepEqual(approvedModel, { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.equal(proposal.fixture.byte_size, 530);
  assert.equal(proposal.metrics.length, 5);
  assert.deepEqual(proposal.constraints.approved_tools_only, approvedToolNames);
  for (const run_id of ['0198d943-8b71-7a11-9abc-0000000000c3', '0198d943-8b71-7a11-8abc-0000000000d4']) {
    const store = createRunArtifactStoreDouble();
    const fixture = expectedArtifactRun(run_id);
    const cancellation_signal = new AbortController().signal;
    assert.deepEqual(await store.beginRun(artifactMutatorInput({ run_id, initial_manifest: fixture.initialManifest }, cancellation_signal)), { run_id });
    await store.commitConfirmedContract(artifactMutatorInput({ run_id, contract: fixture.contract }, cancellation_signal));
  }
  const events: EventLog[] = [];
  const run_id = '0198d943-8b71-7a11-babc-0000000000e5';
  const store = createRunArtifactStoreDouble({ events });
  const fixture = expectedArtifactRun(run_id);
  const cancellation_signal = new AbortController().signal;
  await store.beginRun(artifactMutatorInput({ run_id, initial_manifest: fixture.initialManifest }, cancellation_signal));
  await store.commitConfirmedContract(artifactMutatorInput({ run_id, contract: fixture.contract }, cancellation_signal));
  await store.replaceManifest(artifactMutatorInput({ run_id, next_manifest: fixture.cancelledManifest }, cancellation_signal));
  const cancelled = requiredEvent(events, ({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled', 'cancelled terminal must be recorded');
  const cancelledManifest = requiredRecord(cancelled.manifest, 'cancelled manifest');
  const cancelledDetail = requiredRecord(cancelledManifest.terminal_detail, 'cancelled terminal detail');
  assert.equal(cancelledManifest.status, 'cancelled');
  assert.deepEqual(cancelledDetail, { stage: 'analysis_python' });
  assert.equal(Object.hasOwn(cancelledDetail, 'error_code'), false);
  assert.equal(Object.hasOwn(cancelledManifest, 'evidence'), false);
  assert.equal(Object.hasOwn(cancelledManifest, 'success'), false);
});

test('TASK-003B TEST-XCLI-008 success uses a complete initial manifest and run-explicit stateless Artifact commands', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'artifact success terminal');
  const writerEvents = events.filter(({ event }) => event.startsWith('artifact.'));
  const begin = requiredEvent(writerEvents, ({ event }) => event === 'artifact.beginRun', 'Artifact beginRun must be recorded');
  const initialManifest = requiredRecord(begin.initial_manifest, 'initial manifest');
  assert.deepEqual(initialManifest, expectedArtifactRun(result.run.run_id, requiredString(initialManifest.started_at, 'initial manifest started_at must be a string')).initialManifest);
  assert.equal(writerEvents.filter(({ run_id }) => run_id !== undefined).every(({ run_id }) => run_id === result.run.run_id), true);
  const success = requiredEvent(writerEvents, ({ event }) => event === 'artifact.commitSuccess', 'Artifact success must be recorded');
  const successManifest = requiredRecord(success.next_manifest, 'success manifest');
  const domain = requiredExport(await loadPublicSeam('core'), 'createLocalAnalysisDomain')();
  assert.deepEqual(domain.validateRunManifest(successManifest), successManifest);
  assert.equal(successManifest.run_id, result.run.run_id);
  const successArtifacts = successManifest.artifacts;
  assert.ok(Array.isArray(successArtifacts), 'success manifest artifacts must be an array');
  assert.deepEqual(successArtifacts.map((asset) => requiredRecord(asset, 'success artifact').artifact_id), ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE']);
  assert.equal(requiredLastEvent(writerEvents, () => true, 'Artifact writer event must be recorded').event, 'artifact.commitSuccess');
});

test('TASK-003B TEST-XCLI-015 post-analysis failure retains exactly all four successfully appended descriptors', async () => {
  const events: EventLog[] = [];
  const agentRuntime = createAgentRuntimeDouble({
    events,
    runtimeResult: { actual_model: approvedModel, finding: { ...expectedFindingProposal(), confidence: 1 } },
  });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await expectMappedFailure(handle.confirm(await handle.discover()), events, 'validation', 'VALIDATION_FAILED');
  const begin = requiredEvent(events, ({ event }) => event === 'artifact.beginRun', 'Artifact beginRun must be recorded');
  const terminal = requiredEvent(events, ({ event, status }) => event === 'artifact.replaceManifest' && status === 'failed', 'failed terminal must be recorded');
  assert.equal(terminal.run_id, begin.run_id);
  const terminalManifest = requiredRecord(terminal.manifest, 'failed terminal manifest');
  const beginManifest = requiredRecord(begin.initial_manifest, 'initial manifest');
  const beginRunId = requiredString(begin.run_id, 'beginRun event must contain run_id');
  assert.deepEqual(Object.keys(terminalManifest).sort(), [...Object.keys(beginManifest), 'ended_at', 'terminal_detail'].sort());
  assert.equal(terminalManifest.run_id, beginRunId);
  const fixture = expectedArtifactRun(beginRunId, requiredString(beginManifest.started_at, 'initial manifest started_at must be a string'));
  assert.deepEqual(terminalManifest.artifacts, ['Q-001', 'S-001', 'O-001', 'O-002'].map((artifact_id) => fixture.descriptorById[artifact_id]));
  assert.equal(Object.hasOwn(terminalManifest, 'evidence'), false);
});

test('TASK-003B TEST-XCLI-015 Python-validation cancellation retains exactly Q-001 and O-001 descriptors', async () => {
  const events: EventLog[] = [];
  const started = createDeferred();
  const release = createDeferred();
  const localAnalysisExecution = createLocalAnalysisExecutionDouble({
    events,
    onValidate: async () => { started.resolve(); await release.promise; },
  });
  const application = await createApplication({ events, localAnalysisExecution });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await Promise.race([started.promise, confirmation]);
  const cancellation = handle.cancel();
  release.resolve();
  await cancellation;
  await expectCancelled(confirmation);
  const begin = requiredEvent(events, ({ event }) => event === 'artifact.beginRun', 'Artifact beginRun must be recorded');
  const terminal = requiredEvent(events, ({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled', 'cancelled terminal must be recorded');
  assert.equal(terminal.run_id, begin.run_id);
  const terminalManifest = requiredRecord(terminal.manifest, 'cancelled terminal manifest');
  const beginManifest = requiredRecord(begin.initial_manifest, 'initial manifest');
  const beginRunId = requiredString(begin.run_id, 'beginRun event must contain run_id');
  assert.deepEqual(Object.keys(terminalManifest).sort(), [...Object.keys(beginManifest), 'ended_at', 'terminal_detail'].sort());
  const fixture = expectedArtifactRun(beginRunId, requiredString(beginManifest.started_at, 'initial manifest started_at must be a string'));
  assert.deepEqual(terminalManifest.artifacts, ['Q-001', 'O-001'].map((artifact_id) => fixture.descriptorById[artifact_id]));
  assert.deepEqual(events.filter(({ event }) => event === 'artifact.appendAsset').map((entry) => entry.artifact_id), ['Q-001', 'O-001']);
  assert.equal(Object.hasOwn(terminalManifest, 'evidence'), false);
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
});

const invalidModelDependencies: readonly (readonly [string, Pick<ApplicationOptions, 'includeModel' | 'model'>])[] = [
  ['missing model', { includeModel: false }],
  ['ambient provider model', { model: { provider: 'ambient-default', model_id: 'MiniMax-M3' } }],
  ['Mimo has no fallback', { model: { provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' } }],
  ['wrong model id', { model: { provider: 'minimax-cn', model_id: 'other-model' } }],
  ['unknown model field', { model: { ...approvedModel, thinking_level: 'ambient' } }],
];

for (const [label, modelDependency] of invalidModelDependencies) {
  test(`TASK-003 TEST-XCLI-009 rejects ${label} before runtime openSession or run allocation`, async () => {
    const events: EventLog[] = [];
    const agentRuntime = {
      async openSession() {
        events.push({ event: 'runtime.openSession.unexpected' });
        assert.fail('invalid Application model dependency must fail before opening a runtime session');
      },
    };
    let caught: unknown;
    try {
      const application = await createApplication({ events, agentRuntime, ...modelDependency });
      await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    } catch (error) {
      caught = error;
    }
    assert.match(String(errorEntry(caught, 'message')), /MODEL_UNAVAILABLE|INVALID_MODEL_CONFIGURATION|VALIDATION_FAILED/);
    assert.deepEqual(events, []);
  });
}

test('TASK-003 TEST-XCLI-003 complete closed Analysis Gate proposal matches every approved semantic field', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  assert.deepEqual(proposal, expectedAnalysisProposal());
  assert.deepEqual(Object.keys(proposal).sort(), Object.keys(expectedAnalysisProposal()).sort());
  noExecutionSideEffects(events);
});

test('TASK-009 TEST-XCLI-009 [AC-XCLI-002-01, AC-XCLI-006-01, AC-XCLI-013-02] passes the two exact deeply frozen non-output prompt contexts through the Runtime Port', async () => {
  const events: EventLog[] = [];
  const agentRuntime = createAgentRuntimeDouble({ events, requirePromptContexts: true });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  await handle.confirm(proposal);
  const discovery = requiredEvent(events, ({ event }) => event === 'runtime.discover', 'runtime discovery must be recorded');
  const execution = requiredEvent(events, ({ event }) => event === 'runtime.execute.begin', 'runtime execution admission must be recorded');
  assert.deepEqual(discovery.input, { discovery_context: expectedDiscoveryContext() });
  assert.deepEqual(execution.finding_context, expectedFindingContext());
  assert.equal(Object.hasOwn(discovery.input.discovery_context, 'fixture'), false);
  assert.equal(Object.hasOwn(execution.finding_context, 'finding'), false);
});

function reverseObjectMembers(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseObjectMembers);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).reverse().map(([key, child]) => [key, reverseObjectMembers(child)]));
  }
  return value;
}

test('TASK-009 R4 TEST-XCLI-009 [AC-XCLI-007-06, R4-AC-004-01] Application accepts semantically identical reordered model objects, but preserves array order as semantic', async () => {
  const events: EventLog[] = [];
  const reorderedProposal = reverseObjectMembers(expectedAnalysisProposal());
  const reorderedFinding = reverseObjectMembers(expectedFindingProposal());
  const agentRuntime = createAgentRuntimeDouble({
    events,
    proposal: reorderedProposal,
    runtimeResult: { actual_model: approvedModel, finding: reorderedFinding },
  });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'reordered terminal');
  assert.deepEqual(result.finding, expectedFindingProposal());
  assert.deepEqual(result.run.model, approvedModel);

  const arrayReorderedRuntime = createAgentRuntimeDouble({
    proposal: { ...expectedAnalysisProposal(), source_ids: [...expectedAnalysisProposal().source_ids].reverse().concat('SRC-002') },
  });
  const invalidApplication = await createApplication({ agentRuntime: arrayReorderedRuntime });
  const invalidHandle = await invalidApplication.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await assert.rejects(() => invalidHandle.discover(), /VALIDATION_FAILED|INVALID_ANALYSIS_PROPOSAL/);
});

test('TASK-009 R4 TEST-XCLI-009 [AC-XCLI-007-04, R4-AC-001-03, R4-AC-004-02] records only MiniMax-M3 as actual model and run provenance; Mimo never activates as fallback', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'model terminal');
  assert.deepEqual(result.run.model, { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.deepEqual(requiredEvent(events, ({ event }) => event === 'runtime.openSession', 'runtime session opening must be recorded').model, { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  await assert.rejects(
    () => createApplication({ model: { provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' } }),
    /MODEL_UNAVAILABLE|INVALID_MODEL_CONFIGURATION|VALIDATION_FAILED/,
  );
});

async function readPiAdapterProductionSource() {
  return readFile(fileURLToPath(new URL('../../../adapters/agent-pi/local-analysis.ts', import.meta.url)), 'utf8');
}

test('TASK-009 R4 TEST-XCLI-011 [AC-XCLI-007-04, R4-AC-001-01] production source binds only the approved MiniMax-M3 identity', async () => {
  const source = await readPiAdapterProductionSource();
  assert.match(source, /const PROVIDER = 'minimax-cn';/);
  assert.match(source, /const MODEL_ID = 'MiniMax-M3';/);
  assert.equal(/xiaomi-token-plan-cn|mimo-v2\.5-pro/.test(source), false);
});

test('TASK-009 R4 TEST-XCLI-011 [AC-XCLI-007-04, R4-AC-001-01] production source performs exactly one explicit local-only ModelRuntime refresh', async () => {
  const source = await readPiAdapterProductionSource();
  assert.match(source, /ModelRuntime\.create\(\{ allowModelNetwork: false, refreshOnCreate: false \}\)/);
  assert.equal((source.match(/runtime\.refresh\(\{ allowNetwork: false \}\)/g) ?? []).length, 1);
});

test('TASK-009 R4 TEST-XCLI-011 [R4-AC-001-01, R4-AC-001-03] production source remains retry-free and has no finish-reason bypass or fallback branch', async () => {
  const source = await readPiAdapterProductionSource();
  assert.match(source, /retry:\s*\{ enabled: false, maxRetries: 0 \}/);
  assert.equal(/supportsFinishReason\s*:\s*false|fallbackModel|fallback_model|retry\s*:\s*true/.test(source), false);
});

test('TASK-009 R4 TEST-XCLI-011 [AC-XCLI-007-06, R4-AC-003-01, R4-AC-003-02] production source derives both closed response templates without fixture business literals', async () => {
  const source = await readPiAdapterProductionSource();
  assert.match(source, /response_template/);
  assert.match(source, /copy_response_template_values_exactly_after_tools_succeed:\s*true/);
  assert.equal(/c0d1c3d2|member-orders|F-001|E-001|repurchase-member rate declined/.test(source), false);
});

const invalidRuntimeProposals: readonly (readonly [string, () => unknown])[] = [
  ['missing_metrics', () => { const value: TestRecord = { ...cloneProposal() }; delete value.metrics; return value; }],
  ['unknown_field', () => ({ ...cloneProposal(), inferred_default: true })],
  ['null_fixture', () => ({ ...cloneProposal(), fixture: null })],
  ['changed_formula', () => { const value = cloneProposal(); value.metrics[3].definition = 'recent orders / all members'; return value; }],
];

for (const [label, proposal] of invalidRuntimeProposals) {
  test(`TASK-003 TEST-XCLI-003 rejects runtime proposal ${label} before presenting the Analysis Gate`, async () => {
    const events: EventLog[] = [];
    const agentRuntime = createAgentRuntimeDouble({ events, proposal: proposal() });
    const application = await createApplication({ events, agentRuntime });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    await assert.rejects(() => handle.discover(), /VALIDATION_FAILED|INVALID_ANALYSIS_PROPOSAL/);
    noExecutionSideEffects(events);
  });
}

const proposalRejections: readonly (readonly [string, () => unknown])[] = [
  ['empty_confirmation', () => ''],
  ['missing_objective', () => { const value: TestRecord = { ...cloneProposal() }; delete value.objective; return value; }],
  ['edited_question', () => ({ ...cloneProposal(), question: 'changed semantics' })],
  ['edited_fixture_identity', () => ({ ...cloneProposal(), fixture: { ...cloneProposal().fixture, sha256: '0'.repeat(64) } })],
  ['edited_window', () => { const value = cloneProposal(); value.time_windows[1].start_date = '2026-08-09'; return value; }],
  ['edited_grain', () => { const value = cloneProposal(); value.metrics[0].grain = 'member'; return value; }],
  ['edited_population', () => { const value = cloneProposal(); value.metrics[0].population = 'all_known_members'; return value; }],
  ['edited_formula', () => { const value = cloneProposal(); value.metrics[3].definition = 'caller supplied rate'; return value; }],
  ['edited_signal', () => ({ ...cloneProposal(), signal_rule: { comparison: 'recent_lte_baseline', supported_status: 'supported' } })],
  ['edited_output', () => ({ ...cloneProposal(), output_requirements: { ...cloneProposal().output_requirements, evidence: false } })],
  ['edited_constraint', () => ({ ...cloneProposal(), constraints: { ...cloneProposal().constraints, network_tools: true } })],
  ['unknown_field', () => ({ ...cloneProposal(), model_invented_default: true })],
];

for (const [label, invalidProposal] of proposalRejections) {
  test(`TASK-003 TEST-XCLI-003 Analysis Gate rejects ${label} without execution side effects`, async () => {
    const events: EventLog[] = [];
    const application = await createApplication({ events });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    await handle.discover();
    await assert.rejects(() => handle.confirm(invalidProposal()), /CONFIRMATION_REQUIRED|VALIDATION_FAILED/);
    noExecutionSideEffects(events);
  });
}

test('TASK-003 TEST-XCLI-003 cancel before confirmation is idempotent and creates no run', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await handle.discover();
  const first = await handle.cancel();
  const second = await handle.cancel();
  assert.deepEqual(second, first);
  assert.equal(events.filter(({ event }) => event === 'runtime.cancel').length, 1);
  assert.equal(events.some(({ event }) => ['artifact.beginRun', 'artifact.commitConfirmedContract', 'artifact.appendAsset', 'artifact.replaceManifest', 'artifact.commitSuccess'].includes(event)), false);
  await expectCancelled(handle.confirm(expectedAnalysisProposal()));
});

const preflightRejections: readonly PreflightRejectionCase[] = [
  ['source_traversal', { ...expectedAnalysisInput().fixture, path: '../member-orders-v1.csv' }, /SOURCE_BOUNDARY_VIOLATION/],
  ['source_absolute', { ...expectedAnalysisInput().fixture, path: '/outside/member-orders-v1.csv' }, /SOURCE_BOUNDARY_VIOLATION/],
  ['fixture_hash', { ...expectedAnalysisInput().fixture, sha256: '0'.repeat(64) }, /FIXTURE_MISMATCH/],
  ['fixture_version', { ...expectedAnalysisInput().fixture, version: 'member-orders-v2' }, /CONTRACT_VERSION_UNSUPPORTED/],
  ['unknown_source_field', { ...expectedAnalysisInput().fixture, filesystem_path: '/tmp/orders.csv' }, /SOURCE_BOUNDARY_VIOLATION|VALIDATION_FAILED/],
];

for (const [label, source, error] of preflightRejections) {
  test(`TASK-003 TEST-XCLI-009 preflight rejects ${label} before runtime, rows, analysis, or run allocation`, async () => {
    const events: EventLog[] = [];
    const application = await createApplication({ events });
    await assert.rejects(() => application.start({ question: expectedAnalysisInput().question, source }), error);
    assert.deepEqual(events, []);
  });
}

test('TASK-003 TEST-XCLI-010 observes same-session stages, exact three tools, single writer, and success-last ordering', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'ordered terminal');
  assertOrderedEvents(events, [
    'runtime.openSession',
    'runtime.discover',
    'artifact.beginRun',
    'artifact.commitConfirmedContract',
    'runtime.execute.begin',
    'runtime.tool.invoke.begin',
    'analysis.profileApprovedFixture',
    'runtime.tool.invoke.end',
    'runtime.tool.invoke.begin',
    'analysis.calculateMemberRepurchaseMetrics',
    'artifact.appendAsset',
    'artifact.appendAsset',
    'runtime.tool.invoke.end',
    'runtime.tool.invoke.begin',
    'analysis.validateMemberRepurchaseMetrics',
    'artifact.appendAsset',
    'artifact.appendAsset',
    'runtime.tool.invoke.end',
    'runtime.execute.end',
    'artifact.commitSuccess',
  ]);
  const runtimeEvents = events.filter(({ event }) => event.startsWith('runtime.'));
  assert.deepEqual([...new Set(runtimeEvents.map(({ session }) => session).filter(Boolean))], ['session-001']);
  const openSession = requiredEvent(events, ({ event }) => event === 'runtime.openSession', 'runtime session opening must be recorded');
  assert.deepEqual(openSession.model, approvedModel);
  const executionTools = openSession.execution_tools;
  if (!Array.isArray(executionTools)) throw new Error('runtime session must record execution tools');
  assert.deepEqual(executionTools.map((descriptor) => requiredRecord(descriptor, 'execution tool').tool_name), approvedToolNames);
  for (const descriptor of executionTools) {
    const tool = requiredRecord(descriptor, 'execution tool');
    assert.equal(Object.isFrozen(tool), true);
    assert.deepEqual(Object.keys(tool).sort(), ['invoke', 'tool_name']);
  }
  const runtimeExecution = requiredEvent(events, ({ event }) => event === 'runtime.execute.begin', 'runtime execution admission must be recorded');
  assert.equal(runtimeExecution.deadline_seconds, 300);
  for (const operation of ['profileApprovedFixture', 'calculateMemberRepurchaseMetrics', 'validateMemberRepurchaseMetrics']) {
    assert.equal(events.filter(({ event }) => event === `analysis.${operation}`).length, 1, operation);
  }
  const executionContract = requiredRecord(runtimeExecution.confirmed_contract, 'runtime confirmed contract');
  assert.equal(executionContract.run_id, result.run.run_id);
  assert.deepEqual(executionContract, expectedConfirmedContract(result.run.run_id, '2026-08-20T00:00:00.000Z'));
  assert.equal(Object.hasOwn(executionContract, 'fixture'), false);
  for (const analysisEvent of events.filter(({ event }) => ['analysis.profileApprovedFixture', 'analysis.calculateMemberRepurchaseMetrics', 'analysis.validateMemberRepurchaseMetrics'].includes(event))) {
    assert.equal(analysisEvent.run_id, result.run.run_id);
    assert.deepEqual(analysisEvent.confirmed_contract, executionContract);
  }
  const invocations = events.filter(({ event }) => event === 'runtime.tool.invoke.begin');
  assert.deepEqual(invocations.map(({ tool_name }) => tool_name), approvedToolNames);
  assert.equal(new Set(invocations.map(({ correlation_id }) => correlation_id)).size, 3);
  const appendEvents = events.filter(({ event }) => event === 'artifact.appendAsset');
  const appendIds = appendEvents.map(({ artifact_id }) => artifact_id);
  assert.deepEqual(appendIds, ['Q-001', 'O-001', 'S-001', 'O-002']);
  const appendAssets = appendEvents.map((entry) => requiredRecord(entry.asset, 'artifact append asset'));
  assert.deepEqual(appendAssets[0], { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: canonicalQueryBytes });
  assert.deepEqual(appendAssets[2], { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: canonicalScriptBytes });
  assert.deepEqual(JSON.parse(Buffer.from(requiredBytes(appendAssets[1]?.bytes, 'SQL output bytes must be bytes')).toString('utf8')), { ...referenceOracle, calculation_kind: 'sql' });
  assert.deepEqual(JSON.parse(Buffer.from(requiredBytes(appendAssets[3]?.bytes, 'Python output bytes must be bytes')).toString('utf8')), { ...referenceOracle, calculation_kind: 'python_validation' });
  assert.deepEqual(appendEvents.slice(1, 4).filter(({ artifact_id }) => typeof artifact_id === 'string' && artifact_id.startsWith('O-')).map((entry) => {
    const asset = requiredRecord(entry.asset, 'artifact append asset');
    return { artifact_id: asset.artifact_id, category: asset.category, path: asset.path, media_type: asset.media_type };
  }), [
    { artifact_id: 'O-001', category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' },
    { artifact_id: 'O-002', category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' },
  ]);
  const analyticalCalls = events.filter(({ event }) => event === 'analysis.calculateMemberRepurchaseMetrics' || event === 'analysis.validateMemberRepurchaseMetrics');
  const firstAnalyticalCall = analyticalCalls.at(0);
  const secondAnalyticalCall = analyticalCalls.at(1);
  if (!firstAnalyticalCall || !secondAnalyticalCall) throw new Error('two analytical calls must be recorded');
  assert.equal(runtimeExecution.cancellation_signal, firstAnalyticalCall.cancellation_signal);
  assert.equal(firstAnalyticalCall.cancellation_signal, secondAnalyticalCall.cancellation_signal);
  const contractEvent = requiredEvent(events, ({ event }) => event === 'artifact.commitConfirmedContract', 'confirmed contract persistence must be recorded');
  assert.deepEqual(contractEvent.contract, executionContract);
  const writerEvents = events.filter(({ event }) => [
    'artifact.beginRun',
    'artifact.commitConfirmedContract',
    'artifact.appendAsset',
    'artifact.replaceManifest',
    'artifact.commitSuccess',
  ].includes(event));
  assert.equal(requiredLastEvent(writerEvents, () => true, 'artifact writer event must be recorded').event, 'artifact.commitSuccess');
  assert.deepEqual(result.metrics, referenceOracle);
  assert.equal(result.finding.finding_id, 'F-001');
  assert.equal(result.finding.status, 'supported');
  assert.equal(result.run.status, 'succeeded');
});

const protocolViolations: readonly (readonly [string, DriveTurn, ExpectedToolCalls])[] = [
  ['out-of-order callback', async ({ invoke }) => invoke(1), { profile: 0, calculate: 0, validate: 0 }],
  ['duplicate callback and correlation', async ({ invoke }) => { await invoke(0); await invoke(0); }, { profile: 1, calculate: 0, validate: 0 }],
  ['malformed empty correlation', async ({ invoke }) => invoke(0, { correlation_id: '', arguments: {} }), { profile: 0, calculate: 0, validate: 0 }],
  ['unknown callback arguments', async ({ invoke }) => invoke(0, { correlation_id: 'call-001', arguments: { path: 'model-selected.csv' } }), { profile: 0, calculate: 0, validate: 0 }],
];

for (const [label, driveTurn, expectedCalls] of protocolViolations) {
  test(`TASK-003 TEST-XCLI-006 rejects ${label} before an unapproved Analysis Adapter call`, async () => {
    const events: EventLog[] = [];
    const agentRuntime = createAgentRuntimeDouble({ events, driveTurn });
    const application = await createApplication({ events, agentRuntime });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    await expectMappedFailure(handle.confirm(await handle.discover()), events, 'runtime', 'TOOL_POLICY_VIOLATION');
    assert.equal(events.filter(({ event }) => event === 'analysis.profileApprovedFixture').length, expectedCalls.profile);
    assert.equal(events.filter(({ event }) => event === 'analysis.calculateMemberRepurchaseMetrics').length, expectedCalls.calculate);
    assert.equal(events.filter(({ event }) => event === 'analysis.validateMemberRepurchaseMetrics').length, expectedCalls.validate);
    assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
  });
}

test('TASK-003 TEST-XCLI-006 rejects a late post-terminal descriptor invocation before Analysis or Artifact work', async () => {
  const events: EventLog[] = [];
  let lateInvoke: ((request: unknown) => Promise<unknown>) | undefined;
  const agentRuntime = createAgentRuntimeDouble({
    events,
    driveTurn: async ({ execution_tools, invoke }) => {
      const lastTool = execution_tools.at(2);
      if (!lastTool) throw new Error('third execution tool must exist');
      lateInvoke = lastTool.invoke;
      for (let index = 0; index < execution_tools.length; index += 1) await invoke(index);
    },
  });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'attempt terminal');
  assert.equal(result.run.status, 'succeeded');
  const analysisCount = events.filter(({ event }) => event.startsWith('analysis.')).length;
  const artifactCount = events.filter(({ event }) => event.startsWith('artifact.')).length;
  const invokeAfterTerminal = lateInvoke;
  if (!invokeAfterTerminal) throw new Error('late invocation must be retained');
  await assert.rejects(() => invokeAfterTerminal({ correlation_id: 'call-004', arguments: {} }), /TOOL_POLICY_VIOLATION|PROTOCOL_FAILURE|TERMINAL_IMMUTABLE/);
  assert.equal(events.filter(({ event }) => event.startsWith('analysis.')).length, analysisCount);
  assert.equal(events.filter(({ event }) => event.startsWith('artifact.')).length, artifactCount);
});

test('TASK-003 TEST-XCLI-007 analytical calls receive exact 30-second budget and one cancellation signal', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await handle.confirm(await handle.discover());
  const analyticalCalls = events.filter(({ event }) => event === 'analysis.calculateMemberRepurchaseMetrics' || event === 'analysis.validateMemberRepurchaseMetrics');
  assert.equal(analyticalCalls.length, 2);
  for (const call of analyticalCalls) {
    assert.equal(call.deadline_seconds, 30);
    assert.equal(typeof call.cancellation_signal?.aborted, 'boolean');
  }
  assert.equal(analyticalCalls[0].cancellation_signal, analyticalCalls[1].cancellation_signal);
});

test('TASK-003 TEST-XCLI-009 generates a fresh UUIDv7 for each new attempt', async () => {
  const runIds = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const application = await createApplication();
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'attempt terminal');
    assert.match(result.run.run_id, uuidV7Pattern);
    runIds.push(result.run.run_id);
  }
  assert.equal(new Set(runIds).size, 2);
});

test('TASK-003 TEST-XCLI-009 keeps the generated UUIDv7 consistent through one attempt', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'run-id terminal');
  assert.match(result.run.run_id, uuidV7Pattern);
  const runIds = events.filter(({ event }) => event.startsWith('artifact.')).map(({ run_id }) => run_id).filter(Boolean);
  assert.deepEqual([...new Set(runIds)], [result.run.run_id]);
  const contractEvent = requiredEvent(events, ({ event }) => event === 'artifact.commitConfirmedContract', 'confirmed contract persistence must be recorded');
  assert.equal(requiredRecord(contractEvent.contract, 'persisted contract').run_id, result.run.run_id);
});

test('TASK-003 TEST-XCLI-009 collision fails closed after one allocation attempt with no retry or execution', async () => {
  const events: EventLog[] = [];
  const application = await createApplication({ events, runArtifactStore: createCollisionStore(events) });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  await assert.rejects(() => handle.confirm(proposal), /RUN_COLLISION/);
  assert.equal(events.filter(({ event }) => event === 'artifact.beginRun.collision').length, 1);
  assert.equal(events.some(({ event }) => event.startsWith('runtime.execute') || ['analysis.profileApprovedFixture', 'analysis.calculateMemberRepurchaseMetrics', 'analysis.validateMemberRepurchaseMetrics'].includes(event)), false);
});

test('TASK-010 R3 TEST-XCLI-015 cancel after run creation is idempotent and rejects late runtime output', async () => {
  const events: EventLog[] = [];
  const executeStarted = createDeferred();
  const executeRelease = createDeferred();
  const agentRuntime = createAgentRuntimeDouble({ events, onExecute: async () => { executeStarted.resolve(); await executeRelease.promise; } });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await Promise.race([executeStarted.promise, confirmation]);
  const cancellation = handle.cancel();
  executeRelease.resolve();
  const first = await cancellation;
  const second = await handle.cancel();
  assert.deepEqual(second, first);
  await expectCancelled(confirmation);
  assert.equal(events.filter(({ event }) => event === 'runtime.cancel').length, 1);
  assertCancelledTerminal(events, 'runtime');
  const executionStart = events.findIndex(({ event }) => event === 'runtime.execute.begin');
  assert.equal(events.slice(executionStart + 1).some(({ event }) => event.startsWith('analysis.')), false);
});

test('TASK-010 R3 TEST-XCLI-015 cancel during validation keeps the deadline signal live and terminalizes once', async () => {
  const events: EventLog[] = [];
  const validateStarted = createDeferred();
  const validateRelease = createDeferred();
  const localAnalysisExecution = createLocalAnalysisExecutionDouble({
    events,
    onValidate: async () => {
      validateStarted.resolve();
      await validateRelease.promise;
    },
  });
  const control = createVirtualDeadlineScheduler(events);
  const application = await createApplication({ events, localAnalysisExecution, deadlineScheduler: control.scheduler });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await Promise.race([validateStarted.promise, confirmation]);
  const analyticalCalls = events.filter(({ event }) => event === 'analysis.calculateMemberRepurchaseMetrics' || event === 'analysis.validateMemberRepurchaseMetrics');
  assert.equal(analyticalCalls.length, 2);
  const firstAnalyticalCall = analyticalCalls.at(0);
  const secondAnalyticalCall = analyticalCalls.at(1);
  if (!firstAnalyticalCall || !secondAnalyticalCall) throw new Error('two analytical calls must be recorded');
  assert.equal(firstAnalyticalCall.cancellation_signal, secondAnalyticalCall.cancellation_signal);
  const cancellation = handle.cancel();
  await microtaskCheckpoint();
  assert.equal(requiredAbortSignal(firstAnalyticalCall.cancellation_signal, 'analytical call must record its cancellation signal').aborted, false);
  validateRelease.resolve();
  const first = await cancellation;
  await expectCancelled(confirmation);
  const second = await handle.cancel();
  assert.deepEqual(second, first);
  assert.equal(events.filter(({ event }) => event === 'runtime.cancel').length, 1);
  assert.equal(control.scheduled[0].cancelCalls, 1);
  assert.equal(events.filter(({ event }) => event === 'analysis.validateMemberRepurchaseMetrics').length, 1);
  assertCancelledTerminal(events, 'analysis_python');
  const terminalIndex = events.findIndex(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled');
  assert.equal(events.slice(terminalIndex + 1).some(({ event }) => event.startsWith('runtime.execute') || event.startsWith('runtime.tool.invoke') || event.startsWith('analysis.') || event === 'artifact.appendAsset'), false);
});

for (const pendingMethod of ['beginRun', 'commitConfirmedContract', 'appendAsset'] as const) {
  test(`TASK-010 R3 TEST-XCLI-017 [AC-XCLI-013-01, AC-XCLI-013-02] user cancellation closes admission during pending ${pendingMethod} and leaves one cancelled terminal`, async () => {
    const events: EventLog[] = [];
    const control = createVirtualDeadlineScheduler(events);
    const deferred = { started: createDeferred(), gate: createDeferred() };
    const runArtifactStore = createPendingArtifactStore(events, pendingMethod, deferred);
    const application = await createApplication({ events, runArtifactStore, deadlineScheduler: control.scheduler });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    const confirmation = handle.confirm(await handle.discover());
    await deferred.started.promise;
    const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event.endsWith('.admission'), 'Artifact admission must be recorded').cancellation_signal, 'Artifact admission must contain its cancellation signal');
    const normalAdmissionsBeforeCancel = events
      .filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission')
      .map(({ event }) => event);
    const cancellation = handle.cancel();
    await microtaskCheckpoint();
    assert.equal(signal.aborted, false, 'user cancellation must leave the absolute-deadline signal live before expiry');
    assert.deepEqual(
      events.filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission').map(({ event }) => event),
      normalAdmissionsBeforeCancel,
      'user cancellation must immediately close future normal publication admission while issued work is pending',
    );
    deferred.gate.resolve();
    let cancelled;
    let cancellationError;
    let confirmed;
    let confirmationError;
    try { cancelled = await cancellation; } catch (error) { cancellationError = error; }
    try { confirmed = await confirmation; } catch (error) { confirmationError = error; }
    const normalAdmissionsAfterSettlement = events
      .filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission')
      .map(({ event }) => event);
    const cancelledTerminals = events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled');
    assert.equal(cancellationError, undefined, 'cancel must resolve to the cancelled result, never a competing failure');
    assert.equal(confirmationError, undefined, 'confirm must converge rather than reject after user cancellation');
    assert.deepEqual(confirmed, cancelled, 'confirm and cancel must converge on the one cancelled result');
    assert.equal(hasRunTerminal(cancelled) ? cancelled.run.status : cancelled?.status, 'cancelled');
    assert.equal(cancelledTerminals.length, 1, 'a run that linearizes around user cancellation must not remain visible in_progress');
    assert.deepEqual(normalAdmissionsAfterSettlement, normalAdmissionsBeforeCancel, 'settled pending work must not admit another normal publication');
    assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false, 'user cancellation cannot publish success');
    assert.equal(events.some(({ event }) => event === 'runtime.execute.begin'), pendingMethod === 'appendAsset', 'Runtime must not start after cancellation before runtime admission');
    assert.equal(control.scheduled[0].cancelCalls, 1);
  });
}

test('TASK-010 R3 TEST-XCLI-017 [AC-XCLI-013-01, AC-XCLI-013-02] user cancellation during admitted commitSuccess converges to succeeded when final manifest linearizes first', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const deferred = { started: createDeferred(), gate: createDeferred() };
  const application = await createApplication({
    events,
    runArtifactStore: createPendingCommitSuccessStore(events, deferred, 'success'),
    deadlineScheduler: control.scheduler,
  });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await deferred.started.promise;
  const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'artifact.commitSuccess.admission', 'commitSuccess admission must be recorded').cancellation_signal, 'commitSuccess admission must contain its cancellation signal');
  const normalAdmissionsBeforeCancel = events
    .filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission')
    .map(({ event }) => event);
  const cancellation = handle.cancel();
  await microtaskCheckpoint();
  assert.equal(signal.aborted, false, 'user cancellation must leave the absolute-deadline signal live before expiry');
  assert.deepEqual(
    events.filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission').map(({ event }) => event),
    normalAdmissionsBeforeCancel,
    'cancellation must not admit a later normal persistence unit while commitSuccess is issued',
  );
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest.admission'), false, 'cancellation must not compete with the issued commitSuccess terminal');
  deferred.gate.resolve();
  const [confirmed, cancelled] = await Promise.all([confirmation, cancellation]);
  assert.deepEqual(confirmed, cancelled, 'confirm and cancel must converge on the linearized succeeded result');
  assert.equal(requiredSuccessfulTerminal(confirmed, 'linearized success terminal').run.status, 'succeeded');
  assert.equal(events.filter(({ event }) => event === 'artifact.commitSuccess').length, 1);
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest'), false, 'a linearized success is the sole terminal manifest');
  assert.equal(control.scheduled[0].cancelCalls, 1);
});

test('TASK-010 R3 TEST-XCLI-017 [AC-XCLI-013-01, AC-XCLI-013-02] user cancellation during admitted commitSuccess writes one cancelled terminal only after no-success settlement', async () => {
  const events: EventLog[] = [];
  const control = createVirtualDeadlineScheduler(events);
  const deferred = { started: createDeferred(), gate: createDeferred() };
  const application = await createApplication({
    events,
    runArtifactStore: createPendingCommitSuccessStore(events, deferred, 'without_success'),
    deadlineScheduler: control.scheduler,
  });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const confirmation = handle.confirm(await handle.discover());
  await deferred.started.promise;
  const signal = requiredAbortSignal(requiredEvent(events, ({ event }) => event === 'artifact.commitSuccess.admission', 'commitSuccess admission must be recorded').cancellation_signal, 'commitSuccess admission must contain its cancellation signal');
  const normalAdmissionsBeforeCancel = events
    .filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission')
    .map(({ event }) => event);
  const cancellation = handle.cancel();
  await microtaskCheckpoint();
  assert.equal(signal.aborted, false, 'user cancellation must leave the absolute-deadline signal live before expiry');
  assert.deepEqual(
    events.filter(({ event }) => event.endsWith('.admission') && event !== 'artifact.replaceManifest.admission').map(({ event }) => event),
    normalAdmissionsBeforeCancel,
    'cancellation must not admit a later normal persistence unit while commitSuccess is issued',
  );
  assert.equal(events.some(({ event }) => event === 'artifact.replaceManifest.admission'), false, 'cancelled terminal admission must await no-success settlement');
  deferred.gate.resolve();
  const [confirmed, cancelled] = await Promise.all([confirmation, cancellation]);
  const settledWithoutSuccess = events.findIndex(({ event }) => event === 'artifact.commitSuccess.settled_without_success');
  const cancelledTerminal = events.findIndex(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled');
  assert.deepEqual(confirmed, cancelled, 'confirm and cancel must converge on the cancelled terminal result');
  assert.equal(requiredRunTerminal(confirmed, 'linearized cancelled terminal').run.status, 'cancelled');
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false, 'the failed issued commitSuccess must not publish success');
  assert.equal(events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'cancelled').length, 1);
  assert.ok(settledWithoutSuccess !== -1);
  assert.ok(cancelledTerminal > settledWithoutSuccess, 'the exceptional cancelled terminal must follow no-success settlement');
  assert.equal(control.scheduled[0].cancelCalls, 1);
});

// replaceManifest is not a normal admission window: it is the single terminal
// publication that the preceding four cases require after a cancelled run.

test('TASK-003 TEST-XCLI-015 enforces the 300-second post-confirmation budget without real waiting', async () => {
  const events: EventLog[] = [];
  const clock = controlledClock();
  const agentRuntime = createAgentRuntimeDouble({ events, onExecute: () => clock.advance(301_000) });
  const application = await createApplication({ events, agentRuntime, clock });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await expectMappedFailure(handle.confirm(await handle.discover()), events, 'execution', 'TIMEOUT');
  assert.equal(events.some(({ event }) => ['analysis.profileApprovedFixture', 'analysis.calculateMemberRepurchaseMetrics', 'analysis.validateMemberRepurchaseMetrics'].includes(event)), false);
});

const mappedFailures: readonly MappedFailureCase[] = [
  ['runtime_model_failure', 'runtime', 'MODEL_EXECUTION_FAILED', (events) => ({ agentRuntime: createAgentRuntimeDouble({ events, onExecute: () => { throw new Error('MODEL_EXECUTION_FAILED'); } }) }), 'runtime.execute.begin'],
  ['source_invalid', 'source_read', 'SOURCE_INVALID', (events) => ({ localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onProfile: () => { throw new Error('SOURCE_INVALID'); } }) }), 'analysis.profileApprovedFixture'],
  ['sql_timeout_at_30_seconds', 'analysis_sql', 'TIMEOUT', (events) => ({ localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onCalculate: () => { throw new Error('TIMEOUT'); } }) }), 'analysis.calculateMemberRepurchaseMetrics'],
  ['sql_failure', 'analysis_sql', 'ANALYSIS_EXECUTION_FAILED', (events) => ({ localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onCalculate: () => { throw new Error('ANALYSIS_EXECUTION_FAILED'); } }) }), 'analysis.calculateMemberRepurchaseMetrics'],
  ['python_failure', 'analysis_python', 'ANALYSIS_EXECUTION_FAILED', (events) => ({ localAnalysisExecution: createLocalAnalysisExecutionDouble({ events, onValidate: () => { throw new Error('ANALYSIS_EXECUTION_FAILED'); } }) }), 'analysis.validateMemberRepurchaseMetrics'],
  ['artifact_finalize_failure', 'artifact_finalize', 'ARTIFACT_WRITE_FAILED', (events) => ({ runArtifactStore: createCommitFailureStore(events) }), 'artifact.commitSuccess.failed'],
];

for (const [label, stage, errorCode, dependencies, failingEvent] of mappedFailures) {
  test(`TASK-003 TEST-XCLI-015 maps ${label} to stable ${stage}/${errorCode} without retry`, async () => {
    const events: EventLog[] = [];
    const application = await createApplication({ events, ...dependencies(events) });
    const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
    await expectMappedFailure(handle.confirm(await handle.discover()), events, stage, errorCode);
    assert.equal(events.filter(({ event }) => event === failingEvent).length, 1);
    assert.equal(events.filter(({ event, status }) => event === 'artifact.replaceManifest' && status === 'failed').length, 1);
    assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
  });
}

test('TASK-003 TEST-XCLI-010 rejects an internally invalid Port result instead of publishing caller-independent oracle output', async () => {
  const events: EventLog[] = [];
  const base = createLocalAnalysisExecutionDouble({ events });
  const localAnalysisExecution = {
    ...base,
    async calculateMemberRepurchaseMetrics(input: Parameters<typeof base.calculateMemberRepurchaseMetrics>[0]) {
      const envelope = await base.calculateMemberRepurchaseMetrics(input);
      return {
        ...envelope,
        result: {
          ...envelope.result,
          baseline: { ...envelope.result.baseline, order_count: -1 },
        },
      };
    },
  };
  const application = await createApplication({ events, localAnalysisExecution });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await expectMappedFailure(handle.confirm(await handle.discover()), events, 'validation', 'VALIDATION_FAILED');
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
});

test('TASK-003 TEST-XCLI-010 rejects an invalid runtime Finding after callbacks and before success', async () => {
  const events: EventLog[] = [];
  const agentRuntime = createAgentRuntimeDouble({
    events,
    runtimeResult: {
      actual_model: approvedModel,
      finding: { ...expectedFindingProposal(), confidence: 1 },
    },
  });
  const application = await createApplication({ events, agentRuntime });
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  await expectMappedFailure(handle.confirm(await handle.discover()), events, 'validation', 'VALIDATION_FAILED');
  assertOrderedEvents(events, ['runtime.execute.begin', 'analysis.profileApprovedFixture', 'analysis.calculateMemberRepurchaseMetrics', 'analysis.validateMemberRepurchaseMetrics', 'runtime.execute.end']);
  assert.equal(events.some(({ event }) => event === 'artifact.commitSuccess'), false);
});

test('TASK-004 TEST-XCLI-012 profiles the real canonical workspace with exact bounded metadata only', async (t) => {
  const { execution } = await createRealAnalysis(t);
  const input = analysisPortInput();
  const result = await execution.profileApprovedFixture({ source: input.source, run_id: input.run_id, confirmed_contract: input.confirmed_contract });
  assert.deepEqual(result, {
    source_id: 'SRC-001', fixture_version: 'member-orders-v1', row_count: 20,
    columns: ['order_id', 'member_id', 'ordered_on'],
    date_coverage: { start_date: '2026-08-01', end_date: '2026-08-14' },
  });
});

test('TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-007-02] preflights one real canonical fixture read into a closed observed identity without analytical output', async (t) => {
  const { workspaceRoot, execution } = await createRealAnalysis(t);
  const input = analysisPreflightInput();
  const before = Date.now();
  const previousPath = process.env.PATH;
  let identity;
  try {
    process.env.PATH = '';
    identity = await execution.preflightApprovedFixture(input);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  }
  const after = Date.now();
  assert.equal(Object.isFrozen(input), true);
  assert.equal(Object.isFrozen(input.source), true);
  assert.equal(Object.isFrozen(identity), true);
  assert.deepEqual(Object.keys(identity).sort(), ['byte_size', 'fixture_version', 'kind', 'path', 'read_at', 'sha256', 'source_id']);
  assert.deepEqual({ ...identity, read_at: '<observed>' }, {
    source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256,
    byte_size: fixtureByteSize, fixture_version: 'member-orders-v1', read_at: '<observed>',
  });
  assert.match(identity.read_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.ok(Date.parse(identity.read_at) >= before && Date.parse(identity.read_at) <= after);
  assert.deepEqual(await readdir(workspaceRoot), ['member-orders-v1.csv']);
  for (const forbidden of ['bytes', 'rows', 'handle', 'process', 'output']) assert.equal(Object.hasOwn(identity, forbidden), false);
});

const fixturePreflightNegativeMatrix: readonly (readonly [string, unknown])[] = [
  ['missing outer input', undefined],
  ['null outer input', null],
  ['non-plain outer input', Object.create(null)],
  ['mutable outer input', { source: Object.freeze({ ...expectedAnalysisInput().fixture }) }],
  ['extra outer field', Object.freeze({ source: Object.freeze({ ...expectedAnalysisInput().fixture }), extra: true })],
  ['mutable inner source', Object.freeze({ source: { ...expectedAnalysisInput().fixture } })],
  ['extra source field', Object.freeze({ source: Object.freeze({ ...expectedAnalysisInput().fixture, extra: true }) })],
  ['missing source field', Object.freeze({ source: Object.freeze(Object.fromEntries(Object.entries(expectedAnalysisInput().fixture).filter(([key]) => key !== 'sha256'))) })],
];

for (const [label, input] of fixturePreflightNegativeMatrix) {
  test(`TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-007-02] rejects ${label} as a closed fixture preflight boundary`, async (t) => {
    const { workspaceRoot, execution } = await createRealAnalysis(t);
    await assert.rejects(() => invokeNegativeOperationalPort(execution.preflightApprovedFixture, [input]), /SOURCE_BOUNDARY_VIOLATION/);
    assert.deepEqual(await readdir(workspaceRoot), ['member-orders-v1.csv']);
  });
}

const physicalPreflightCases: readonly PhysicalPreflightCase[] = [
  ['missing physical fixture', async ({ workspaceRoot }) => rm(join(workspaceRoot, 'member-orders-v1.csv')), 'FIXTURE_NOT_FOUND'],
  ['declared SHA mismatch', async () => undefined, 'FIXTURE_MISMATCH'],
  ['physical byte-size mismatch', async ({ workspaceRoot }) => writeFile(join(workspaceRoot, 'member-orders-v1.csv'), Buffer.alloc(fixtureByteSize + 1, 0x61)), 'FIXTURE_MISMATCH'],
  ['mutated bytes', async ({ workspaceRoot }) => writeFile(join(workspaceRoot, 'member-orders-v1.csv'), Buffer.from('changed fixture\\n')), 'FIXTURE_MISMATCH'],
  ['malformed CSV semantics', async ({ workspaceRoot }) => writeFile(join(workspaceRoot, 'member-orders-v1.csv'), 'order_id,member_id,ordered_on\\nORD-001,M-001,not-a-date\\n', 'utf8'), 'FIXTURE_MISMATCH'],
  ['duplicate CSV semantics', async ({ workspaceRoot }) => writeFile(join(workspaceRoot, 'member-orders-v1.csv'), Buffer.concat([await canonicalFixtureBytes(), Buffer.from('ORD-001,M-001,2026-08-01\\n')])), 'FIXTURE_MISMATCH'],
  ['path traversal', async () => undefined, 'SOURCE_BOUNDARY_VIOLATION'],
  ['absolute path', async () => undefined, 'SOURCE_BOUNDARY_VIOLATION'],
  ['symlink escape', async ({ parent, workspaceRoot }) => { const target = join(workspaceRoot, 'member-orders-v1.csv'); const outside = join(parent, 'outside.csv'); await rm(target); await writeFile(outside, await canonicalFixtureBytes()); await symlink(outside, target); }, 'SOURCE_BOUNDARY_VIOLATION'],
  ['non-regular source', async ({ workspaceRoot }) => { const target = join(workspaceRoot, 'member-orders-v1.csv'); await rm(target); await mkdir(target); }, 'SOURCE_BOUNDARY_VIOLATION'],
  ['unsupported fixture version', async () => undefined, 'CONTRACT_VERSION_UNSUPPORTED'],
];

for (const [label, arrange, expected] of physicalPreflightCases) {
  test(`TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-007-02] maps ${label} at concrete fixture preflight with no analytical output`, async (t) => {
    const context = await createRealAnalysis(t);
    await arrange(context);
    let source = expectedAnalysisInput().fixture;
    if (label === 'declared SHA mismatch') source = { ...source, sha256: '0'.repeat(64) };
    if (label === 'path traversal') source = { ...source, path: '../member-orders-v1.csv' };
    if (label === 'absolute path') source = { ...source, path: join(context.workspaceRoot, 'member-orders-v1.csv') };
    if (label === 'unsupported fixture version') source = { ...source, version: 'member-orders-v2' };
    await assert.rejects(() => context.execution.preflightApprovedFixture(analysisPreflightInput(source)), new RegExp(expected));
    assert.deepEqual(await readdir(context.workspaceRoot), label === 'missing physical fixture' ? [] : ['member-orders-v1.csv']);
  });
}

test('TASK-010 R3 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-007-02] detects a physical fixture replacement after preflight as SOURCE_CHANGED without profile output', async (t) => {
  const { workspaceRoot, execution } = await createRealAnalysis(t);
  const preflight = await execution.preflightApprovedFixture(analysisPreflightInput());
  await writeFile(join(workspaceRoot, 'member-orders-v1.csv'), Buffer.from('replacement fixture\\n'));
  const input = analysisPortInput();
  await assert.rejects(
    () => execution.profileApprovedFixture({ source: input.source, run_id: input.run_id, confirmed_contract: input.confirmed_contract }),
    /SOURCE_CHANGED/,
  );
  assert.deepEqual(Object.keys(preflight).sort(), ['byte_size', 'fixture_version', 'kind', 'path', 'read_at', 'sha256', 'source_id']);
  assert.deepEqual(await readdir(workspaceRoot), ['member-orders-v1.csv']);
});

test('TASK-010 R3 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-007-02] maps post-confirm physical fixture deletion to SOURCE_CHANGED with no profile output or workspace write', async (t) => {
  const { workspaceRoot, execution } = await createRealAnalysis(t);
  const preflight = await execution.preflightApprovedFixture(analysisPreflightInput());
  await rm(join(workspaceRoot, 'member-orders-v1.csv'));
  const input = analysisPortInput();
  await assert.rejects(
    () => execution.profileApprovedFixture({ source: input.source, run_id: input.run_id, confirmed_contract: input.confirmed_contract }),
    /SOURCE_CHANGED/,
  );
  assert.deepEqual(Object.keys(preflight).sort(), ['byte_size', 'fixture_version', 'kind', 'path', 'read_at', 'sha256', 'source_id']);
  assert.deepEqual(await readdir(workspaceRoot), []);
});

test('TASK-004 TEST-XCLI-012 calculates the exact oracle with real DuckDB and frozen canonical SQL', async (t) => {
  const { execution } = await createRealAnalysis(t);
  const result = await execution.calculateMemberRepurchaseMetrics(analysisPortInput());
  assert.deepEqual(result, {
    result: { ...referenceOracle, calculation_kind: 'sql' },
    canonical_asset: { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: canonicalQueryBytes },
  });
});

test('TASK-004 TEST-XCLI-012 validates independently with real Python and frozen canonical script', async (t) => {
  const { execution } = await createRealAnalysis(t);
  const sql = await execution.calculateMemberRepurchaseMetrics(analysisPortInput());
  const result = await execution.validateMemberRepurchaseMetrics(analysisValidationInput(sql.result));
  assert.deepEqual(result, {
    result: { ...referenceOracle, calculation_kind: 'python_validation' },
    canonical_asset: { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: canonicalScriptBytes },
  });
  const { calculation_kind: sqlKind, ...sqlMetrics } = sql.result;
  const { calculation_kind: pythonKind, ...pythonMetrics } = result.result;
  assert.equal(sqlKind, 'sql');
  assert.equal(pythonKind, 'python_validation');
  assert.deepEqual(pythonMetrics, sqlMetrics);
});

test('TASK-004 TEST-XCLI-012 real analytical envelopes leak no rows, paths, process handles, or workspace outputs', async (t) => {
  const { workspaceRoot, execution } = await createRealAnalysis(t);
  const sql = await execution.calculateMemberRepurchaseMetrics(analysisPortInput());
  const python = await execution.validateMemberRepurchaseMetrics(analysisValidationInput(sql.result));
  assert.deepEqual(Object.keys(sql).sort(), ['canonical_asset', 'result']);
  assert.deepEqual(Object.keys(python).sort(), ['canonical_asset', 'result']);
  for (const envelope of [sql, python]) {
    const serialized = JSON.stringify({ ...envelope, canonical_asset: { ...envelope.canonical_asset, bytes: '<bounded-code>' } });
    assert.equal(/ORD-\d|M-\d|workspaceRoot|stdout|stderr|process|connection|engine|\/private\/|\/tmp\//.test(serialized), false);
  }
  assert.deepEqual(await readdir(workspaceRoot), ['member-orders-v1.csv']);
});

const analysisSourceFailures: readonly AnalysisFailureCase[] = [
  ['hash mismatch', async ({ input }) => ({ input: { ...input, source: { ...input.source, sha256: '0'.repeat(64) } } })],
  ['traversal source', async ({ input }) => ({ input: { ...input, source: { ...input.source, path: '../member-orders-v1.csv' } } })],
  ['absolute source', async ({ input, workspaceRoot }) => ({ input: { ...input, source: { ...input.source, path: join(workspaceRoot, 'member-orders-v1.csv') } } })],
  ['mutated bytes', async ({ input, workspaceRoot }) => { await writeFile(join(workspaceRoot, 'member-orders-v1.csv'), Buffer.from((await canonicalFixtureBytes()).toString('utf8').replace('M-001', 'M-099'))); return { input }; }],
  ['malformed fixture', async ({ input, workspaceRoot }) => { await writeFile(join(workspaceRoot, 'member-orders-v1.csv'), 'not,a,closed\nfixture\n', 'utf8'); return { input }; }],
  ['symlink escape', async ({ input, parent, workspaceRoot }) => { const source = join(workspaceRoot, 'member-orders-v1.csv'); const outside = join(parent, 'outside.csv'); await rm(source); await writeFile(outside, await canonicalFixtureBytes()); await symlink(outside, source); return { input }; }],
  ['non-regular source', async ({ input, workspaceRoot }) => { const source = join(workspaceRoot, 'member-orders-v1.csv'); await rm(source); await mkdir(source); return { input }; }],
];

for (const [label, arrange] of analysisSourceFailures) {
  test(`TASK-004 TEST-XCLI-015 fails closed for ${label} before analytical output`, async (t) => {
    const context = await createRealAnalysis(t);
    const { input } = await arrange({ ...context, input: analysisPortInput() });
    const invoke = ['mutated bytes', 'malformed fixture', 'symlink escape', 'non-regular source'].includes(label)
      ? () => context.execution.calculateMemberRepurchaseMetrics(input)
      : () => invokeNegativeOperationalPort(context.execution.calculateMemberRepurchaseMetrics, [input]);
    await assert.rejects(invoke, assertSanitizedAdapterError);
    assert.deepEqual(await readdir(context.workspaceRoot), ['member-orders-v1.csv']);
  });
}

for (const [label, forbidden] of [
  ['model SQL', { sql: 'SELECT * FROM read_csv_auto(?)' }],
  ['model Python', { script: 'import os' }],
  ['caller command', { command: 'sh' }],
  ['caller environment', { environment: { SECRET: 'not-permitted' } }],
  ['caller output path', { output_path: 'result.json' }],
  ['unknown field', { retries: 1 }],
] satisfies readonly (readonly [string, TestRecord])[]) {
  test(`TASK-004 TEST-XCLI-015 rejects ${label} at the closed Analysis Port`, async (t) => {
    const { execution } = await createRealAnalysis(t);
    await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [analysisPortInput(forbidden)]), assertSanitizedAdapterError);
  });
}

test('TASK-004 TEST-XCLI-015 rejects an already-aborted analytical call before reading output', async (t) => {
  const { workspaceRoot, execution } = await createRealAnalysis(t);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(() => execution.calculateMemberRepurchaseMetrics(analysisPortInput({ cancellation_signal: abort.signal })), assertSanitizedAdapterError);
  await assert.rejects(() => execution.validateMemberRepurchaseMetrics(analysisValidationInput({ ...referenceOracle, calculation_kind: 'sql' }, abort.signal)), assertSanitizedAdapterError);
  assert.deepEqual(await readdir(workspaceRoot), ['member-orders-v1.csv']);
});

test('TASK-004 TEST-XCLI-015 treats required deadline_seconds zero as an immediate sanitized TIMEOUT', async (t) => {
  const { execution } = await createRealAnalysis(t);
  await assert.rejects(
    () => execution.calculateMemberRepurchaseMetrics(analysisPortInput({ deadline_seconds: 0 })),
    (error) => String(errorEntry(error, 'code') ?? errorEntry(error, 'message')) === 'TIMEOUT' && assertSanitizedAdapterError(error),
  );
});

for (const [label, deadline] of [['missing', undefined], ['negative', -1], ['non-integer', 0.5], ['over-limit', 31]]) {
  test(`TASK-004 TEST-XCLI-015 rejects ${label} analytical deadline before execution`, async (t) => {
    const { execution } = await createRealAnalysis(t);
    const input = analysisPortInput({ deadline_seconds: deadline });
    if (label === 'missing') delete input.deadline_seconds;
    await assert.rejects(() => invokeNegativeOperationalPort(execution.calculateMemberRepurchaseMetrics, [input]), assertSanitizedAdapterError);
  });
}

test('TASK-004 TEST-XCLI-016 beginRun creates only the contained UUIDv7 directory and exact in-progress run.json', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await beginArtifactFixture(store);
  assert.deepEqual(await listTree(runRoot), [`${fixture.run_id}/`, `${fixture.run_id}/run.json`]);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), Buffer.from(JSON.stringify(fixture.initialManifest), 'utf8'));
  assert.equal(JSON.stringify(fixture.initialManifest).includes(runRoot), false);
});

test('TASK-004 TEST-XCLI-016 commitConfirmedContract persists canonical bytes and matching checksum evidence', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await beginArtifactFixture(store);
  const result = await store.commitConfirmedContract(artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract }));
  assert.deepEqual(result, {
    committed: true,
    descriptor: { path: 'analysis-contract.json', byte_size: fixture.contractBytes.byteLength, sha256: sha256(fixture.contractBytes) },
  });
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'analysis-contract.json')), fixture.contractBytes);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), Buffer.from(JSON.stringify(fixture.initialManifest), 'utf8'));
});

test('TASK-004 TEST-XCLI-016 appendAsset writes exact fixed Q/O/S/O bytes and descriptors create-if-absent', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  const descriptors = [];
  for (const asset of fixture.assets) {
    const result = await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
    descriptors.push(result.descriptor);
    assert.deepEqual(result, {
      appended: true,
      descriptor: {
        artifact_id: asset.artifact_id, category: asset.category, path: asset.path, media_type: asset.media_type,
        byte_size: asset.bytes.byteLength, sha256: sha256(asset.bytes),
      },
    });
    assert.deepEqual(await readFile(join(runRoot, fixture.run_id, asset.path)), asset.bytes);
  }
  assert.deepEqual(descriptors.map(({ artifact_id }) => artifact_id), ['Q-001', 'O-001', 'S-001', 'O-002']);
});

test('TASK-004 TEST-XCLI-016 duplicate run collision preserves the complete prior run byte-for-byte', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await beginArtifactFixture(store);
  const before = await readFile(join(runRoot, fixture.run_id, 'run.json'));
  await assert.rejects(() => store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest })), /RUN_COLLISION/);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), before);
});

test('TASK-004 TEST-XCLI-016 duplicate asset collision preserves the first exact asset bytes', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  const asset = fixture.assets[0];
  await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
  const path = join(runRoot, fixture.run_id, asset.path);
  const before = await readFile(path);
  await assert.rejects(() => store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset: { ...asset, bytes: Buffer.from('changed') } })), /ARTIFACT_WRITE_FAILED/);
  assert.deepEqual(await readFile(path), before);
});

for (const [label, run_id] of [['traversal', '../outside'], ['absolute', '/outside'], ['non-UUIDv7', '018f6db0-4420-6123-8abc-123456789abc']]) {
  test(`TASK-004 TEST-XCLI-016 rejects ${label} run identity without creating a path`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
    await assert.rejects(() => store.beginRun(artifactMutatorInput({ run_id, initial_manifest: { ...fixture.initialManifest, run_id } })), assertSanitizedAdapterError);
    assert.deepEqual(await readdir(runRoot), []);
  });
}

const artifactMutationCases: readonly ArtifactMutationCase[] = [
  ['wrong category', (asset) => ({ ...asset, category: 'script' })],
  ['wrong path', (asset) => ({ ...asset, path: 'outputs/Q-001.sql' })],
  ['wrong media type', (asset) => ({ ...asset, media_type: 'text/plain' })],
  ['unknown asset field', (asset) => ({ ...asset, mode: 'overwrite' })],
];

for (const [label, mutate] of artifactMutationCases) {
  test(`TASK-004 TEST-XCLI-016 rejects ${label} before an Artifact file appears`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const fixture = await confirmArtifactFixture(store);
    await assert.rejects(() => invokeNegativeOperationalPort(store.appendAsset, [artifactMutatorInput({ run_id: fixture.run_id, asset: mutate(fixture.assets[0]) })]), assertSanitizedAdapterError);
    assert.equal(existsSync(join(runRoot, fixture.run_id, fixture.assets[0].path)), false);
  });
}

const artifactOperationCases: readonly ArtifactOperationCase[] = [
  ['missing command field', (store, fixture) => invokeNegativeOperationalPort(store.appendAsset, [artifactMutatorInput({ asset: fixture.assets[0] })])],
  ['unknown command field', (store, fixture) => invokeNegativeOperationalPort(store.appendAsset, [artifactMutatorInput({ run_id: fixture.run_id, asset: fixture.assets[0], overwrite: true })])],
  ['cross-run command', (store, fixture) => store.appendAsset(artifactMutatorInput({ run_id: '0198d943-8b71-7a11-9abc-0000000000b2', asset: fixture.assets[0] }))],
];

for (const [label, operation] of artifactOperationCases) {
  test(`TASK-004 TEST-XCLI-016 rejects ${label} at the stateless Artifact Port`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const fixture = await confirmArtifactFixture(store);
    await assert.rejects(() => operation(store, fixture), assertSanitizedAdapterError);
    assert.equal(existsSync(join(runRoot, fixture.run_id, fixture.assets[0].path)), false);
  });
}

const closedArtifactCommands: readonly ClosedArtifactCommandCase[] = [
  ['beginRun', async (store) => {
    const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
    return { fixture, invoke: () => invokeNegativeOperationalPort(store.beginRun, [artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest, cwd: '/ambient' })]) };
  }],
  ['commitConfirmedContract', async (store) => {
    const fixture = await beginArtifactFixture(store);
    return { fixture, invoke: () => invokeNegativeOperationalPort(store.commitConfirmedContract, [artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract, overwrite: true })]) };
  }],
  ['replaceManifest', async (store) => {
    const fixture = await beginArtifactFixture(store);
    return { fixture, invoke: () => invokeNegativeOperationalPort(store.replaceManifest, [artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.failedManifest, repair: true })]) };
  }],
  ['commitSuccess', async (store) => {
    const fixture = await confirmArtifactFixture(store);
    for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
    return {
      fixture,
      invoke: () => invokeNegativeOperationalPort(store.commitSuccess, [artifactMutatorInput({
        run_id: fixture.run_id, next_manifest: fixture.succeededManifest, evidence: fixture.evidence,
        summary: fixture.summary, evidence_document: fixture.evidenceDocument, fault_mode: true,
      })]),
    };
  }],
  ['readTerminalRun', async (store) => {
    const fixture = await beginArtifactFixture(store);
    await store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.cancelledManifest }));
    return { fixture, invoke: () => invokeNegativeOperationalPort(store.readTerminalRun, [{ run_id: fixture.run_id, repair: true }]) };
  }],
];

for (const [commandName, arrange] of closedArtifactCommands) {
  test(`TASK-004 TEST-XCLI-016 ${commandName} rejects an unknown outer command field without mutation`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const { fixture, invoke } = await arrange(store);
    const path = join(runRoot, fixture.run_id, 'run.json');
    const before = existsSync(path) ? await readFile(path) : undefined;
    await assert.rejects(invoke, assertSanitizedAdapterError);
    assert.deepEqual(existsSync(path) ? await readFile(path) : undefined, before);
  });
}

test('TASK-004 TEST-XCLI-016 rejects an asset-directory symlink escape without touching the outside target', async (t) => {
  const { parent, runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  const outside = join(parent, 'outside');
  await mkdir(outside);
  await symlink(outside, join(runRoot, fixture.run_id, 'queries'), 'dir');
  await assert.rejects(() => store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset: fixture.assets[0] })), assertSanitizedAdapterError);
  assert.deepEqual(await readdir(outside), []);
});

test('TASK-004 TEST-XCLI-016 rejects a pre-existing non-regular asset target without replacement', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  await mkdir(join(runRoot, fixture.run_id, 'queries'), { recursive: true });
  const target = join(runRoot, fixture.run_id, fixture.assets[0].path);
  await mkdir(target);
  await assert.rejects(() => store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset: fixture.assets[0] })), assertSanitizedAdapterError);
  assert.equal((await lstat(target)).isDirectory(), true);
});

test('TASK-004 TEST-XCLI-017 failed atomic manifest replacement preserves the prior valid run.json', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await beginArtifactFixture(store);
  const runDirectory = join(runRoot, fixture.run_id);
  const path = join(runDirectory, 'run.json');
  const before = await readFile(path);
  await chmod(runDirectory, 0o500);
  try {
    await assert.rejects(() => store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.failedManifest })), assertSanitizedAdapterError);
  } finally {
    await chmod(runDirectory, 0o700);
  }
  assert.deepEqual(await readFile(path), before);
});

test('TASK-004 TEST-XCLI-017 mismatched confirmed-contract checksum leaves the initial manifest unchanged', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
  const initial_manifest = { ...fixture.initialManifest, contract: { ...fixture.initialManifest.contract, sha256: '0'.repeat(64) } };
  await store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest }));
  const before = await readFile(join(runRoot, fixture.run_id, 'run.json'));
  await assert.rejects(() => store.commitConfirmedContract(artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract })), assertSanitizedAdapterError);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), before);
  assert.equal(existsSync(join(runRoot, fixture.run_id, 'analysis-contract.json')), false);
});

test('TASK-004 TEST-XCLI-017 commitSuccess writes Evidence and Markdown before publishing the exact succeeded manifest', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
  assert.equal(JSON.parse(await readFile(join(runRoot, fixture.run_id, 'run.json'), 'utf8')).status, 'in_progress');
  assert.deepEqual(await store.commitSuccess(artifactMutatorInput({
    run_id: fixture.run_id, next_manifest: fixture.succeededManifest, evidence: fixture.evidence,
    summary: fixture.summary, evidence_document: fixture.evidenceDocument,
  })), { committed: true, success_manifest_is_last: true });
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'evidence.json')), fixture.evidenceBytes);
  assert.equal(await readFile(join(runRoot, fixture.run_id, 'summary.md'), 'utf8'), fixture.summary);
  assert.equal(await readFile(join(runRoot, fixture.run_id, 'evidence.md'), 'utf8'), fixture.evidenceDocument);
  assert.deepEqual(JSON.parse(await readFile(join(runRoot, fixture.run_id, 'run.json'), 'utf8')), fixture.succeededManifest);
  assert.deepEqual(fixture.succeededManifest.artifacts.map(({ artifact_id }) => artifact_id), ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE']);
  assert.deepEqual(await store.readTerminalRun({ run_id: fixture.run_id }), {
    manifest: fixture.succeededManifest,
    assets: ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE'].map((artifact_id) => fixture.persistedAssetById[artifact_id]),
  });
});

test('TASK-004 TEST-XCLI-017 post-validation Markdown write obstruction preserves byte-identical in-progress run.json', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await confirmArtifactFixture(store);
  for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
  const runPath = join(runRoot, fixture.run_id, 'run.json');
  const before = await readFile(runPath);
  const obstructedMarkdown = join(runRoot, fixture.run_id, 'summary.md');
  await mkdir(obstructedMarkdown);
  await assert.rejects(() => store.commitSuccess(artifactMutatorInput({
    run_id: fixture.run_id, next_manifest: fixture.succeededManifest,
    evidence: fixture.evidence, summary: fixture.summary, evidence_document: fixture.evidenceDocument,
  })), assertSanitizedAdapterError);
  assert.deepEqual(await readFile(runPath), before);
  const visible = JSON.parse(await readFile(runPath, 'utf8'));
  assert.equal(visible.status, 'in_progress');
  assert.equal(Object.hasOwn(visible, 'evidence'), false);
  assert.equal(Object.hasOwn(visible, 'ended_at'), false);
  assert.equal((await lstat(obstructedMarkdown)).isDirectory(), true);
  await assert.rejects(() => store.readTerminalRun({ run_id: fixture.run_id }), assertSanitizedAdapterError);
});

for (const label of ['failed', 'cancelled'] as const) {
  test(`TASK-004 TEST-XCLI-018 ${label} replacement is terminal, immutable, and remains non-success`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const fixture = await confirmArtifactFixture(store);
    for (const asset of [fixture.assets[0], fixture.assets[1]]) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }));
    const next_manifest = expectedTerminalManifest(fixture, label, ['Q-001', 'O-001']);
    assert.deepEqual(await store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest })), { replaced: true });
    assert.deepEqual(JSON.parse(await readFile(join(runRoot, fixture.run_id, 'run.json'), 'utf8')), next_manifest);
    assert.deepEqual(await store.readTerminalRun({ run_id: fixture.run_id }), {
      manifest: next_manifest,
      assets: ['Q-001', 'O-001'].map((artifact_id) => fixture.persistedAssetById[artifact_id]),
    });
    await assert.rejects(() => store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest })), /TERMINAL_IMMUTABLE/);
    assert.equal(existsSync(join(runRoot, fixture.run_id, 'evidence.json')), false);
  });
}

test('TASK-004 TEST-XCLI-018 terminal read is byte-read-only and exposes no overwrite delete list or repair capability', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const fixture = await beginArtifactFixture(store);
  await store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.cancelledManifest }));
  const beforeTree = await listTree(runRoot);
  const beforeBytes = await readFile(join(runRoot, fixture.run_id, 'run.json'));
  assert.deepEqual(await store.readTerminalRun({ run_id: fixture.run_id }), { manifest: fixture.cancelledManifest, assets: [] });
  assert.deepEqual(await listTree(runRoot), beforeTree);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), beforeBytes);
  for (const capability of ['overwrite', 'delete', 'list', 'repair']) assert.equal(Object.hasOwn(store, capability), false);
});

test('TASK-004 TEST-XCLI-018 one store safely interleaves two explicit run identities without byte contamination', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  const left = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
  const right = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000b2', '2026-08-20T00:00:02.000Z');
  await store.beginRun(artifactMutatorInput({ run_id: left.run_id, initial_manifest: left.initialManifest }));
  await store.beginRun(artifactMutatorInput({ run_id: right.run_id, initial_manifest: right.initialManifest }));
  await store.commitConfirmedContract(artifactMutatorInput({ run_id: right.run_id, contract: right.contract }));
  await store.commitConfirmedContract(artifactMutatorInput({ run_id: left.run_id, contract: left.contract }));
  await store.appendAsset(artifactMutatorInput({ run_id: left.run_id, asset: left.assets[0] }));
  await store.appendAsset(artifactMutatorInput({ run_id: right.run_id, asset: right.assets[2] }));
  const leftTerminal = expectedTerminalManifest(left, 'failed', ['Q-001']);
  const rightTerminal = expectedTerminalManifest(right, 'cancelled', ['S-001']);
  await store.replaceManifest(artifactMutatorInput({ run_id: left.run_id, next_manifest: leftTerminal }));
  await store.replaceManifest(artifactMutatorInput({ run_id: right.run_id, next_manifest: rightTerminal }));
  assert.deepEqual(await store.readTerminalRun({ run_id: left.run_id }), { manifest: leftTerminal, assets: [left.persistedAssetById['Q-001']] });
  assert.deepEqual(await store.readTerminalRun({ run_id: right.run_id }), { manifest: rightTerminal, assets: [right.persistedAssetById['S-001']] });
  assert.deepEqual(await readFile(join(runRoot, left.run_id, left.assets[0].path)), left.assets[0].bytes);
  assert.deepEqual(await readFile(join(runRoot, right.run_id, right.assets[2].path)), right.assets[2].bytes);
});

async function artifactByteSnapshot(root: string) {
  const tree = await listTree(root);
  const files = [];
  for (const entry of tree) {
    if (!entry.endsWith('/')) files.push([entry, (await readFile(join(root, entry))).toString('base64')]);
  }
  return { tree, files };
}

async function preflightRealArtifactStore(store: Awaited<ReturnType<typeof createRealArtifactStore>>['store']) {
  const result = await store.preflightRunRoot();
  assert.deepEqual(result, { ready: true });
  assert.equal(Object.isFrozen(result), true);
}

test('TASK-010 R3 TEST-XCLI-008 [AC-XCLI-001-01, AC-XCLI-007-01] maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing', async (t) => {
  const { parent, runRoot, store } = await createRealArtifactStore(t);
  await preflightRealArtifactStore(store);
  for (const mode of ['missing', 'replaced', 'symlink', 'non-directory']) {
    await rm(runRoot, { recursive: true, force: true });
    if (mode === 'replaced') {
      await mkdir(runRoot);
    } else if (mode === 'symlink') {
      const outside = join(parent, `outside-${mode}`);
      await mkdir(outside);
      await symlink(outside, runRoot, 'dir');
    } else if (mode === 'non-directory') {
      await writeFile(runRoot, 'sentinel', 'utf8');
    }
    await assert.rejects(() => store.preflightRunRoot(), (error) => String(errorEntry(error, 'code') ?? errorEntry(error, 'message')) === 'RUN_ROOT_UNSAFE');
    if (mode === 'replaced') assert.deepEqual(await readdir(runRoot), []);
    if (mode === 'symlink') assert.deepEqual(await readdir(join(parent, `outside-${mode}`)), []);
  }
});

test('TASK-010 R3 TEST-XCLI-008 [AC-RRIF-001-01] accepts an owner-write/searchable mode-0300 physical run root', async (t) => {
  const { root: runRoot } = await isolatedDirectory(t, 'xanthil-mode-0300-', 'runs');
  await chmod(runRoot, 0o300);
  try {
    const probe = join(runRoot, 'owner-write-search-probe');
    await writeFile(probe, 'probe', 'utf8');
    await rm(probe);
    const module = await loadPublicSeam('artifactAdapter');
    const store = requiredExport(module, 'createLocalRunArtifactStore')({ runRoot });
    const result = await store.preflightRunRoot();
    assert.deepEqual(result, { ready: true });
    assert.equal(Object.isFrozen(result), true);
  } finally {
    await chmod(runRoot, 0o700);
  }
});

test('TASK-010 R3 TEST-XCLI-008 [AC-RRIF-001-02, AC-RRIF-001-03] linearizes root replacement at the live-acquisition boundary', async (t) => {
  const childSource = String.raw`
import assert from 'node:assert/strict';
import { mock } from 'node:test';

const { scenario, runRoot } = JSON.parse(process.env.XANTHIL_LINEARIZATION_CONFIG);
const actualFs = await import('node:fs');
let lstatCalls = 0;
let openCalls = 0;
let mutations = 0;
const lstatSync = (...args) => {
  lstatCalls += 1;
  if (scenario === 'before-live-acquisition' && lstatCalls === 2) {
    const stale = actualFs.lstatSync(...args);
    actualFs.rmSync(runRoot, { recursive: true, force: true });
    actualFs.mkdirSync(runRoot);
    mutations += 1;
    return stale;
  }
  return actualFs.lstatSync(...args);
};
const openSync = (...args) => {
  openCalls += 1;
  const descriptor = actualFs.openSync(...args);
  if (scenario === 'after-live-acquisition' && openCalls === 2) {
    actualFs.rmSync(runRoot, { recursive: true, force: true });
    actualFs.mkdirSync(runRoot);
    mutations += 1;
  }
  return descriptor;
};
await mock.module('node:fs', { exports: {
  closeSync: actualFs.closeSync,
  constants: actualFs.constants,
  fstatSync: actualFs.fstatSync,
  lstatSync,
  openSync,
  realpathSync: actualFs.realpathSync,
} });
const { createLocalRunArtifactStore } = await import('./adapters/storage-local/local-analysis.ts');
const store = createLocalRunArtifactStore({ runRoot });
if (scenario === 'before-live-acquisition') {
  let outcome;
  try { await store.preflightRunRoot(); } catch (error) { outcome = error; }
  assert.equal(lstatCalls, 2);
  assert.equal(mutations, 1);
  assert.deepEqual(actualFs.readdirSync(runRoot), []);
  assert.equal(outcome?.code, 'RUN_ROOT_UNSAFE');
  assert.equal(openCalls, 2);
} else if (scenario === 'after-live-acquisition') {
  const result = await store.preflightRunRoot();
  assert.deepEqual(result, { ready: true });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(lstatCalls, 2);
  assert.equal(openCalls, 2);
  assert.equal(mutations, 1);
  assert.deepEqual(actualFs.readdirSync(runRoot), []);
} else {
  throw new Error('unknown scenario');
}
console.log(JSON.stringify({ scenario, lstatCalls, openCalls, mutations }));
`;
  const failures: string[] = [];
  for (const scenario of ['before-live-acquisition', 'after-live-acquisition']) {
    const { root: runRoot } = await isolatedDirectory(t, `xanthil-linearization-${scenario}-`, 'runs');
    try {
      const { stdout, stderr } = await execFileAsync(process.execPath, ['--no-warnings', '--experimental-test-module-mocks', '--input-type=module', '--eval', childSource], {
        cwd: repositoryRoot,
        env: { XANTHIL_LINEARIZATION_CONFIG: JSON.stringify({ scenario, runRoot }) },
      });
      assert.equal(stderr, '');
      assert.deepEqual(JSON.parse(stdout), { scenario, lstatCalls: 2, openCalls: 2, mutations: 1 });
    } catch (error) {
      failures.push(`${scenario}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('TASK-010 R3 TEST-XCLI-008 [AC-XCLI-013-04] beginRun publishes a complete initial directory and manifest together', async (t) => {
  const { runRoot, store } = await createRealArtifactStore(t);
  await preflightRealArtifactStore(store);
  const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
  const signal = new AbortController().signal;
  assert.deepEqual(await store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest }, signal)), { run_id: fixture.run_id });
  assert.deepEqual(await listTree(runRoot), [`${fixture.run_id}/`, `${fixture.run_id}/run.json`]);
  assert.deepEqual(await readFile(join(runRoot, fixture.run_id, 'run.json')), Buffer.from(JSON.stringify(fixture.initialManifest), 'utf8'));
});

for (const operation of ['beginRun', 'commitConfirmedContract', 'appendAsset', 'replaceManifest', 'commitSuccess']) {
  test(`TASK-010 R3 TEST-XCLI-008 [AC-XCLI-013-04] already-aborted ${operation} produces ARTIFACT_WRITE_FAILED and no filesystem mutation`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    await preflightRealArtifactStore(store);
    const live = new AbortController().signal;
    const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
    if (operation !== 'beginRun') await store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest }, live));
    if (['appendAsset', 'replaceManifest', 'commitSuccess'].includes(operation)) await store.commitConfirmedContract(artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract }, live));
    if (operation === 'commitSuccess') for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }, live));
    const before = await artifactByteSnapshot(runRoot);
    const controller = new AbortController();
    controller.abort();
    const invoke = {
      beginRun: () => store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest }, controller.signal)),
      commitConfirmedContract: () => store.commitConfirmedContract(artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract }, controller.signal)),
      appendAsset: () => store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset: fixture.assets[0] }, controller.signal)),
      replaceManifest: () => store.replaceManifest(artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.failedManifest }, controller.signal)),
      commitSuccess: () => store.commitSuccess(artifactMutatorInput({ run_id: fixture.run_id, next_manifest: fixture.succeededManifest, evidence: fixture.evidence, summary: fixture.summary, evidence_document: fixture.evidenceDocument }, controller.signal)),
    }[operation];
    if (!invoke) throw new Error('artifact mutator must be selected');
    await assert.rejects(invoke, (error) => String(errorEntry(error, 'code') ?? errorEntry(error, 'message')) === 'ARTIFACT_WRITE_FAILED');
    assert.deepEqual(await artifactByteSnapshot(runRoot), before);
  });
}

for (const [label, signal] of [
  ['missing', undefined],
] satisfies readonly (readonly [string, AbortSignal | undefined])[]) {
  test(`TASK-010 R3 TEST-XCLI-008 [AC-XCLI-013-01] rejects ${label} cancellation_signal before every Artifact write`, async (t) => {
    const { runRoot, store } = await createRealArtifactStore(t);
    const live = new AbortController().signal;
    const fixture = expectedArtifactRun('0198d943-8b71-7a11-9abc-0000000000a1');
    const inputs: readonly (readonly [ArtifactMutatorName, TestRecord])[] = [
      ['beginRun', { run_id: fixture.run_id, initial_manifest: fixture.initialManifest }],
      ['commitConfirmedContract', { run_id: fixture.run_id, contract: fixture.contract }],
      ['appendAsset', { run_id: fixture.run_id, asset: fixture.assets[0] }],
      ['replaceManifest', { run_id: fixture.run_id, next_manifest: fixture.failedManifest }],
      ['commitSuccess', { run_id: fixture.run_id, next_manifest: fixture.succeededManifest, evidence: fixture.evidence, summary: fixture.summary, evidence_document: fixture.evidenceDocument }],
    ];
    for (const [operation, payload] of inputs) {
      await rm(runRoot, { recursive: true, force: true });
      await mkdir(runRoot);
      if (operation !== 'beginRun') await store.beginRun(artifactMutatorInput({ run_id: fixture.run_id, initial_manifest: fixture.initialManifest }, live));
      if (['appendAsset', 'replaceManifest', 'commitSuccess'].includes(operation)) await store.commitConfirmedContract(artifactMutatorInput({ run_id: fixture.run_id, contract: fixture.contract }, live));
      if (operation === 'commitSuccess') for (const asset of fixture.assets) await store.appendAsset(artifactMutatorInput({ run_id: fixture.run_id, asset }, live));
      const before = await artifactByteSnapshot(runRoot);
      const input = signal === undefined ? payload : { ...payload, cancellation_signal: signal };
      await assert.rejects(async () => invokeNegativeOperationalPort(store[operation], [input]), (error: unknown) => String(errorEntry(error, 'code') ?? errorEntry(error, 'message')) === 'ARTIFACT_WRITE_FAILED');
      assert.deepEqual(await artifactByteSnapshot(runRoot), before);
    }
  });
}

test('TEST-XCLI-003 [AC-XCLI-002-01, AC-XCLI-002-02, AC-XCLI-002-03, AC-XCLI-002-04] uses the Application Analysis Gate and observes no run before confirmation', async () => {
  const { application, events } = await createInstrumentedApplication();
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  assert.deepEqual(proposal, expectedAnalysisProposal());
  noExecutionSideEffects(events);
  await assert.rejects(() => handle.confirm(''), /CONFIRMATION_REQUIRED/);
  await assert.rejects(() => handle.confirm({ ...proposal, question: 'changed semantics' }), /CONFIRMATION_REQUIRED/);
  noExecutionSideEffects(events);
  const result = requiredSuccessfulTerminal(await handle.confirm(proposal), 'analysis-gate terminal');
  assert.equal(result.run.status, 'succeeded');
  await assert.rejects(() => handle.confirm(proposal), /PROPOSAL_ALREADY_CONFIRMED|TERMINAL_IMMUTABLE/);
});

test('TEST-XCLI-009 [AC-XCLI-001-01, AC-XCLI-001-02, AC-XCLI-002-01, AC-XCLI-002-02, AC-XCLI-002-03, AC-XCLI-002-04, AC-XCLI-003-01, AC-XCLI-003-02] integrates preflight and explicit confirmation through the Application use case', async () => {
  const application = await createApplication();
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const proposal = await handle.discover();
  assert.equal(proposal.fixture.sha256, fixtureSha256);
  const result = requiredSuccessfulTerminal(await handle.confirm(proposal), 'integrated terminal');
  assert.match(result.run.run_id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  for (const [label, source, error] of [
    ['traversal', { ...expectedAnalysisInput().fixture, path: '../member-orders-v1.csv' }, /SOURCE_BOUNDARY_VIOLATION/],
    ['absolute', { ...expectedAnalysisInput().fixture, path: '/outside/member-orders-v1.csv' }, /SOURCE_BOUNDARY_VIOLATION/],
    ['hash_mismatch', { ...expectedAnalysisInput().fixture, sha256: '0'.repeat(64) }, /FIXTURE_MISMATCH/],
    ['unsupported_version', { ...expectedAnalysisInput().fixture, version: 'member-orders-v2' }, /CONTRACT_VERSION_UNSUPPORTED/],
  ] satisfies readonly PreflightRejectionCase[]) await assert.rejects(() => application.start({ question: expectedAnalysisInput().question, source }), error, label);
});

test('TEST-XCLI-010 [AC-XCLI-003-03, AC-XCLI-004-01, AC-XCLI-005-01, AC-XCLI-006-01, AC-XCLI-010-01, AC-XCLI-011-01, AC-XCLI-012-01, AC-XCLI-012-02, AC-XCLI-015-01, AC-XCLI-015-02] completes the deterministic Application journey with exact aggregate results', async () => {
  const application = await createApplication();
  const handle = await application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  const result = requiredSuccessfulTerminal(await handle.confirm(await handle.discover()), 'deterministic terminal');
  assert.deepEqual(result.metrics, referenceOracle);
  assert.equal(result.finding.finding_id, 'F-001');
  assert.equal(result.finding.status, 'supported');
  assert.equal(result.run.sources[0].sha256, fixtureSha256);
});

async function isolatePiCodingAgentDirectory(t: import('node:test').TestContext, prefix: string) {
  const isolatedConfigRoot = await mkdtemp(join(tmpdir(), prefix));
  const previousConfigRoot = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = isolatedConfigRoot;
  t.after(async () => {
    if (previousConfigRoot === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousConfigRoot;
    await rm(isolatedConfigRoot, { recursive: true, force: true });
  });
  return isolatedConfigRoot;
}

function productionDefaultExecutionTools(): Parameters<AgentAnalysisRuntime['openSession']>[0]['execution_tools'] {
  return Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({ tool_name, invoke: async () => ({ accepted: true }) })));
}

async function assertPiReadinessOnly(configRoot: string, baseline?: readonly string[]) {
  const files = (await readdir(configRoot)).sort();
  assert.deepEqual(files, baseline ?? ['auth.json', 'models-store.json']);
  return files;
}

async function runProductionPiPreflightFailureCase(failureCase: string) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    '--import', join(repositoryRoot, 'tests/fixtures/xanthil-local-analysis/pi-sdk-failure-hook.ts'),
    join(repositoryRoot, 'tests/fixtures/xanthil-local-analysis/pi-sdk-failure-child.ts'),
  ], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, XANTHIL_TEST_PI_FAILURE_CASE: failureCase },
  });
  assert.equal(stderr, '');
  return JSON.parse(stdout);
}

for (const [failureCase, expectedCode, expectedSdk] of [
  ['sdk_import', 'RUNTIME_UNAVAILABLE', { create_calls: 0, refresh_calls: 0, get_model_calls: 0 }],
  ['runtime_create', 'RUNTIME_UNAVAILABLE', { create_calls: 1, refresh_calls: 0, get_model_calls: 0 }],
  ['local_refresh', 'RUNTIME_UNAVAILABLE', { create_calls: 1, refresh_calls: 1, get_model_calls: 0 }],
  ['model_absent', 'MODEL_UNAVAILABLE', { create_calls: 1, refresh_calls: 1, get_model_calls: 1 }],
  ['model_nonmatching', 'MODEL_UNAVAILABLE', { create_calls: 1, refresh_calls: 1, get_model_calls: 1 }],
] satisfies readonly PiFailureCase[]) {
  test(`TASK-010 R3 TEST-XCLI-019 [AC-XCLI-001-01, AC-XCLI-013-01] production-default Pi ${failureCase} preflight has closed failure classification and no Session/provider call`, async () => {
    const observed = await runProductionPiPreflightFailureCase(failureCase);
    assert.equal(observed.code, expectedCode);
    assert.deepEqual(observed.sdk, {
      ...expectedSdk,
      session_creations: 0,
      provider_calls: 0,
      credential_output: false,
    });
  });
}

test('TASK-010 R3 TEST-XCLI-011 production-default preflight then one inert open has no prompt, provider fetch, or session persistence', async (t) => {
  const isolatedConfigRoot = await isolatePiCodingAgentDirectory(t, 'xanthil-pi-config-');
  const previousFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error('network forbidden'); };
  t.after(() => { globalThis.fetch = previousFetch; });
  const adapter = await loadPublicSeam('agentAdapter');
  assert.deepEqual(Object.keys(adapter), ['createPiAgentAnalysisRuntime']);
  const createRuntime = requiredExport(adapter, 'createPiAgentAnalysisRuntime');
  const runtime = createRuntime({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.deepEqual(Object.keys(runtime), ['preflightModel', 'openSession']);
  const model = Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.deepEqual(await runtime.preflightModel(Object.freeze({ model })), model);
  assert.deepEqual(await runtime.preflightModel(Object.freeze({ model })), model);
  const readinessFiles = await assertPiReadinessOnly(isolatedConfigRoot);
  const session = await runtime.openSession(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }), discovery_tools: Object.freeze([]), execution_tools: productionDefaultExecutionTools() }));
  assert.deepEqual(Object.keys(session).sort(), ['cancel', 'discover', 'execute']);
  await assert.rejects(
    () => runtime.openSession(Object.freeze({ model, discovery_tools: Object.freeze([]), execution_tools: productionDefaultExecutionTools() })),
    /MODEL_UNAVAILABLE|PROTOCOL_FAILURE/,
  );
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: false });
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: false });
  assert.equal(fetchCalls, 0);
  await assertPiReadinessOnly(isolatedConfigRoot, readinessFiles);
});

const invalidProductionFactoryInputs: readonly PiFactoryInputCase[] = [
  ['missing factory config', undefined], ['null factory config', null], ['empty factory config', {}],
  ['factory config missing provider', { model_id: 'MiniMax-M3' }], ['factory config missing model ID', { provider: 'minimax-cn' }],
  ['ambient factory provider', { provider: 'ambient-default', model_id: 'MiniMax-M3' }], ['ambient factory model', { provider: 'minimax-cn', model_id: 'ambient-default' }],
  ['Mimo factory fallback', { provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' }],
  ['unknown factory field', { provider: 'minimax-cn', model_id: 'MiniMax-M3', ambient: true }],
];

for (const [title, input] of invalidProductionFactoryInputs) {
test(`TASK-005 TEST-XCLI-011 production-default mutation: ${title}`, async (t) => {
  const isolatedConfigRoot = await isolatePiCodingAgentDirectory(t, 'xanthil-pi-factory-');
  const adapter = await loadPublicSeam('agentAdapter');
  const createRuntime = requiredExport(adapter, 'createPiAgentAnalysisRuntime');
  assert.throws(() => createRuntime(input), /MODEL_UNAVAILABLE|PROTOCOL_FAILURE/);
  assert.deepEqual(await readdir(isolatedConfigRoot), []);
});
}

const invalidProductionOpenInputs: readonly PiFactoryInputCase[] = [
  ['missing openSession input', undefined], ['null openSession input', null], ['empty openSession input', {}],
  ['unknown openSession field', { model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' }, discovery_tools: [], execution_tools: productionDefaultExecutionTools(), ambient: true }],
  ['ambient openSession model', { model: { provider: 'ambient-default', model_id: 'MiniMax-M3' }, discovery_tools: [], execution_tools: productionDefaultExecutionTools() }],
  ['Mimo openSession fallback', { model: { provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' }, discovery_tools: [], execution_tools: productionDefaultExecutionTools() }],
  ['Discovery built-in tool', { model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' }, discovery_tools: ['built_in'], execution_tools: productionDefaultExecutionTools() }],
];

for (const [title, input] of invalidProductionOpenInputs) {
test(`TASK-005 TEST-XCLI-011 production-default mutation: ${title}`, async (t) => {
  const isolatedConfigRoot = await isolatePiCodingAgentDirectory(t, 'xanthil-pi-open-');
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  await runtime.preflightModel(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }) }));
  const readinessFiles = await assertPiReadinessOnly(isolatedConfigRoot);
  await assert.rejects(() => invokeNegativeOperationalPort(runtime.openSession, [input]), /MODEL_UNAVAILABLE|PROTOCOL_FAILURE|TOOL_POLICY_VIOLATION/);
  await assertPiReadinessOnly(isolatedConfigRoot, readinessFiles);
});
}

test('TASK-005 TEST-XCLI-011 production-default pre-prompt cancel is idempotent with zero persistence', async (t) => {
  const isolatedConfigRoot = await isolatePiCodingAgentDirectory(t, 'xanthil-pi-cancel-');
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  await runtime.preflightModel(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }) }));
  const readinessFiles = await assertPiReadinessOnly(isolatedConfigRoot);
  const session = await runtime.openSession({ model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' }, discovery_tools: [], execution_tools: productionDefaultExecutionTools() });
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: false });
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: false });
  await assertPiReadinessOnly(isolatedConfigRoot, readinessFiles);
});

test('TEST-XCLI-019 [AC-XCLI-016-01, AC-XCLI-016-02, AC-XCLI-016-03] composes only the personal local Profile without writing a run during composition', async () => {
  const temporaryParent = await mkdtemp(join(tmpdir(), 'xanthil-profile-'));
  const workspaceRoot = await realpath(temporaryParent);
  const runRoot = join(workspaceRoot, 'runs');
  try {
    await mkdir(runRoot);
    const profile = await loadPublicSeam('personalProfile');
    const createProfile = requiredExport(profile, 'createPersonalLocalAnalysisProfile');
    assert.doesNotThrow(() => createProfile({ workspaceRoot, runRoot, provider: 'minimax-cn', modelId: 'MiniMax-M3' }));
    assert.deepEqual(existsSync(runRoot) ? readdirSync(runRoot) : [], []);
  } finally {
    await rm(temporaryParent, { recursive: true, force: true });
  }
});

test('TASK-010 R3 TEST-XCLI-019 [AC-XCLI-013-01, AC-XCLI-013-02] Profile binds an ordinary one-shot host-timer deadline scheduler without composition effects', async () => {
  const source = await readFile(fileURLToPath(new URL('../../../profiles/personal/local-analysis.ts', import.meta.url)), 'utf8');
  assert.equal(source.includes('deadlineScheduler'), true);
  assert.equal(source.includes('setTimeout'), true);
  assert.equal(source.includes('clearTimeout'), true);
  assert.equal(source.includes('at_epoch_ms'), true);
  assert.equal(source.includes('Math.max(0'), true);
  assert.equal(source.includes('Object.freeze({ cancel })'), true);
});

async function createTask006Roots(t: import('node:test').TestContext) {
  const parent = await mkdtemp(join(tmpdir(), 'xanthil-task-006-profile-'));
  const workspaceRoot = join(parent, 'workspace');
  const runRoot = join(parent, 'runs');
  await mkdir(workspaceRoot);
  await mkdir(runRoot);
  t.after(() => rm(parent, { recursive: true, force: true }));
  return { parent, workspaceRoot: await realpath(workspaceRoot), runRoot: await realpath(runRoot) };
}

function validTask006ProfileConfig({ workspaceRoot, runRoot }: { workspaceRoot: string; runRoot: string }): ProfileConfig {
  return { workspaceRoot, runRoot, provider: 'minimax-cn', modelId: 'MiniMax-M3' };
}

test('TASK-006 TEST-XCLI-019 [AC-XCLI-001-01, AC-XCLI-014-01, AC-XCLI-016-01, AC-XCLI-016-03] returns only the frozen Profile application and creates no root, run, artifact, or output', async (t) => {
  const roots = await createTask006Roots(t);
  await writeFile(join(roots.workspaceRoot, 'member-orders-v1.csv'), await canonicalFixtureBytes());
  const profileModule = await loadPublicSeam('personalProfile');
  assert.deepEqual(Object.keys(profileModule), ['createPersonalLocalAnalysisProfile']);
  const profile = requiredExport(profileModule, 'createPersonalLocalAnalysisProfile');
  const composed = profile(validTask006ProfileConfig(roots));
  assert.equal(Object.isFrozen(composed), true);
  assert.equal(Object.getPrototypeOf(composed), Object.prototype);
  assert.deepEqual(Object.keys(composed), ['application']);
  assert.deepEqual(Object.getOwnPropertySymbols(composed), []);
  assert.equal(Object.isFrozen(composed.application), true);
  assert.equal(Object.getPrototypeOf(composed.application), Object.prototype);
  assert.deepEqual(Object.keys(composed.application), ['start']);
  assert.deepEqual(Object.getOwnPropertySymbols(composed.application), []);
  const handle = await composed.application.start({ question: expectedAnalysisInput().question, source: expectedAnalysisInput().fixture });
  assert.equal(Object.isFrozen(handle), true);
  assert.deepEqual(Object.keys(handle).sort(), ['cancel', 'confirm', 'discover']);
  assert.deepEqual(await handle.cancel(), { status: 'cancelled' });
  assert.deepEqual(await readdir(roots.workspaceRoot), ['member-orders-v1.csv']);
  assert.deepEqual(await readdir(roots.runRoot), []);
  assert.equal(existsSync(join(roots.workspaceRoot, '.xanthil')), false);
  assert.equal(existsSync(join(roots.runRoot, '.xanthil')), false);
});

for (const label of [
  'missing config', 'null config', 'missing workspaceRoot', 'missing runRoot', 'missing provider', 'missing modelId',
  'relative workspaceRoot', 'relative runRoot', 'unknown field', 'alternate provider', 'alternate model',
  'nonexistent workspaceRoot', 'nonexistent runRoot', 'workspace equals run root', 'filesystem root runRoot',
  'workspace symlink', 'run root symlink', 'alternate Adapter injection', 'workspace non-directory', 'run root non-directory',
  'non-plain null-prototype config', 'inherited config fields', 'symbol config field',
]) {
  test(`TASK-006 TEST-XCLI-019 [AC-XCLI-001-02, AC-XCLI-014-02, AC-XCLI-016-02] rejects Profile configuration mutation: ${label}`, async (t) => {
    const roots = await createTask006Roots(t);
    const config = validTask006ProfileConfig(roots);
    let input = config;
    if (label === 'missing config') {
      // no configuration
    } else if (label === 'null config') {
      // explicit null below
    } else if (label === 'missing workspaceRoot') delete config.workspaceRoot;
    else if (label === 'missing runRoot') delete config.runRoot;
    else if (label === 'missing provider') delete config.provider;
    else if (label === 'missing modelId') delete config.modelId;
    else if (label === 'relative workspaceRoot') config.workspaceRoot = 'workspace';
    else if (label === 'relative runRoot') config.runRoot = 'runs';
    else if (label === 'unknown field') config.unapproved = true;
    else if (label === 'alternate provider') config.provider = 'ambient-default';
    else if (label === 'alternate model') config.modelId = 'ambient-default';
    else if (label === 'nonexistent workspaceRoot') config.workspaceRoot = join(roots.parent, 'missing-workspace');
    else if (label === 'nonexistent runRoot') config.runRoot = join(roots.parent, 'missing-runs');
    else if (label === 'workspace equals run root') config.runRoot = roots.workspaceRoot;
    else if (label === 'filesystem root runRoot') config.runRoot = sep;
    else if (label === 'workspace symlink') {
      const linked = join(roots.parent, 'workspace-link');
      await symlink(roots.workspaceRoot, linked);
      config.workspaceRoot = linked;
    } else if (label === 'run root symlink') {
      const linked = join(roots.parent, 'runs-link');
      await symlink(roots.runRoot, linked);
      config.runRoot = linked;
    } else if (label === 'alternate Adapter injection') config.adapters = {};
    else if (label === 'workspace non-directory') {
      const file = join(roots.parent, 'workspace-file');
      await writeFile(file, 'not a directory');
      config.workspaceRoot = file;
    } else if (label === 'run root non-directory') {
      const file = join(roots.parent, 'runs-file');
      await writeFile(file, 'not a directory');
      config.runRoot = file;
    } else if (label === 'non-plain null-prototype config') input = Object.assign(Object.create(null), config);
    else if (label === 'inherited config fields') input = Object.create(config);
    else if (label === 'symbol config field') config[Symbol('ambient')] = true;
    const profileModule = await loadPublicSeam('personalProfile');
    const profile = requiredExport(profileModule, 'createPersonalLocalAnalysisProfile');
    assert.throws(() => profile(label === 'missing config' ? undefined : label === 'null config' ? null : input));
    assert.deepEqual(await readdir(roots.workspaceRoot), []);
    assert.deepEqual(await readdir(roots.runRoot), []);
    assert.equal(existsSync(join(roots.workspaceRoot, '.xanthil')), false);
    assert.equal(existsSync(join(roots.runRoot, '.xanthil')), false);
  });
}

test('TASK-006 TEST-XCLI-001 [AC-XCLI-004-01, AC-XCLI-004-02, AC-XCLI-005-01, AC-XCLI-016-01, AC-XCLI-016-04] verifies the sole canonical example bytes, schema, and reference oracle', async () => {
  const exampleRoot = join(repositoryRoot, 'examples', 'member-analysis');
  const source = join(exampleRoot, 'member-orders-v1.csv');
  const bytes = await readFile(source);
  assert.equal(bytes.byteLength, fixtureByteSize);
  assert.equal(sha256(bytes), fixtureSha256);
  const rows = parseClosedFixture(bytes);
  assert.equal(rows.length, 20);
  assert.deepEqual(calculateFixtureOracle(rows), referenceOracle);
  assert.deepEqual((await readdir(exampleRoot, { withFileTypes: true })).map((entry) => [entry.name, entry.isFile()]).sort(), [['member-orders-v1.csv', true]]);
});

test('TEST-XCLI-021 [AC-XCLI-001-01, AC-XCLI-007-01, AC-XCLI-008-01, AC-XCLI-016-01] enforces the reproducible project-local native TypeScript dependency, configuration, and engine contract', async () => {
  // Negative-first oracle health: these isolated values must fail before real root artifacts are read.
  assert.doesNotThrow(() => assertApprovedRootManifest(structuredClone(approvedRootManifest)));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, dependencies: { ...approvedRootManifest.dependencies, unexpected: '1.0.0' } }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, dependencies: { ...approvedRootManifest.dependencies, '@earendil-works/pi-coding-agent': '^0.84.2' } }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, dependencies: { ...approvedRootManifest.dependencies, typebox: '1.3.8' } }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, packageManager: 'pnpm@10.0.0' }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, devDependencies: { ...approvedRootManifest.devDependencies, typescript: '5.0.0' } }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, scripts: { build: 'compiler' } }));
  assert.throws(() => assertApprovedRootManifest({ ...approvedRootManifest, build: 'dist' }));

  const lockFixture = {
    lockfileVersion: 3,
    packages: {
      '': { dependencies: structuredClone(approvedRootManifest.dependencies), devDependencies: structuredClone(approvedRootManifest.devDependencies) },
      'node_modules/@earendil-works/pi-coding-agent': { version: '0.84.2' },
      'node_modules/typebox': { version: '1.3.7' },
      'node_modules/@types/node': { version: '22.19.19' },
      'node_modules/typescript': { version: '5.9.3' },
    },
  };
  assert.doesNotThrow(() => assertApprovedLock(lockFixture, approvedRootManifest));
  assert.throws(() => assertApprovedLock({ ...lockFixture, packages: { ...lockFixture.packages, '': { dependencies: { typebox: '1.3.7' } } } }, approvedRootManifest));
  assert.throws(() => assertApprovedLock({ ...lockFixture, packages: { ...lockFixture.packages, 'node_modules/typebox': { version: '1.3.8' } } }, approvedRootManifest));
  assert.throws(() => assertProjectLocalResolution('/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/index.js', '@earendil-works/pi-coding-agent'));
  assert.throws(() => atLeastVersion('v22.18.9', 'Node', '22.19.0'));
  assert.throws(() => exactVersion('11.12.0', 'npm', '11.12.1'));
  assert.throws(() => exactVersion('v1.5.1', 'DuckDB', '1.5.2'));
  assert.throws(() => atLeastVersion('Python 3.8.18', 'Python', '3.9.0'));

  const manifest = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'));
  assertApprovedRootManifest(manifest);
  const lock = JSON.parse(await readFile(join(repositoryRoot, 'package-lock.json'), 'utf8'));
  assertApprovedLock(lock, manifest);

  for (const [packageName, expectedVersion] of Object.entries({ ...approvedRootManifest.dependencies, ...approvedRootManifest.devDependencies })) {
    const resolutionTarget = packageName === '@types/node' ? `${packageName}/package.json` : packageName;
    assertProjectLocalResolution(fileURLToPath(import.meta.resolve(resolutionTarget)), packageName);
    const packageJsonPath = join(repositoryRoot, 'node_modules', packageName, 'package.json');
    const installedMetadata = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    assert.equal(installedMetadata.name, packageName);
    assert.equal(installedMetadata.version, expectedVersion);
  }

  atLeastVersion(await runVersionCommand(process.execPath, ['--version']), 'Node', '22.19.0');
  exactVersion(await runVersionCommand('npm', ['--version']), 'npm', '11.12.1');
  exactVersion(await runVersionCommand('duckdb', ['--version']), 'DuckDB', '1.5.2');
  atLeastVersion(await runVersionCommand('python3', ['--version']), 'Python', '3.9.0');

  const tsconfig = JSON.parse(await readFile(join(repositoryRoot, 'tsconfig.json'), 'utf8'));
  assert.deepEqual(tsconfig, approvedTsconfig, 'the root TypeScript configuration must be the approved closed object');

  const configurationFiles = await findRepositoryConfigurationFiles(repositoryRoot);
  assert.deepEqual(
    configurationFiles.map((path) => relative(repositoryRoot, path)).sort(),
    ['package-lock.json', 'package.json', 'tsconfig.json'],
    'the slice must have no alternative package manager, compiler/build, Python dependency, or ambient package declaration',
  );
});

test('TEST-XCLI-022 [AC-XCLI-016-01, AC-XCLI-016-04] keeps every closed-graph target in its native .ts path without compatibility or compiler/build artifacts', async () => {
  const targets = [
    new URL('../../../packages/product-core/local-analysis.ts', import.meta.url),
    new URL('../../../packages/ports/local-analysis.ts', import.meta.url),
    new URL('../../../packages/application/local-analysis.ts', import.meta.url),
    new URL('../../../adapters/agent-pi/local-analysis.ts', import.meta.url),
    new URL('../../../adapters/analytics-duckdb/local-analysis.ts', import.meta.url),
    new URL('../../../adapters/storage-local/local-analysis.ts', import.meta.url),
    new URL('../../../profiles/personal/local-analysis.ts', import.meta.url),
    new URL('../../../apps/cli/xanthil.ts', import.meta.url),
    new URL('../../unit/xanthil-local-analysis/local-analysis.unit.test.ts', import.meta.url),
    new URL('../../unit/xanthil-local-analysis/coverage-map.test.ts', import.meta.url),
    new URL('../../contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts', import.meta.url),
    new URL('../xanthil-local-analysis/local-analysis.integration.test.ts', import.meta.url),
    new URL('../../e2e/xanthil-local-analysis/local-analysis.e2e.test.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/coverage-map.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/fixture-oracle.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/pi-sdk-failure-child.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/pi-sdk-failure-hook.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/pi-sdk-failure-sdk.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/port-contracts.ts', import.meta.url),
    new URL('../../fixtures/xanthil-local-analysis/public-seams.ts', import.meta.url),
  ];
  for (const target of targets) assert.equal(existsSync(target), true);
  for (const target of targets) assert.equal(existsSync(new URL(target.href.replace(/\.ts$/, '.mjs'))), false);
  const names = await Promise.all(targets.map(async (target) => (await readdir(new URL('.', target))).map((name) => `${target.pathname}/${name}`)));
  assert.equal(names.flat().some((name) => /(^|\/)(dist|build)|\.mjs$/.test(name)), false);
});
