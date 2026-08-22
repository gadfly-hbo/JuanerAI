import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';

import { approvedModel, approvedQuestion, calculateFixtureOracle, canonicalFixtureBytes, fixtureByteSize, fixtureSha256, parseClosedFixture, referenceOracle, sha256 } from '../../fixtures/xanthil-local-analysis/fixture-oracle.ts';
import {
  approvedQuestionEvent,
  assertCliBoundaryError,
  cancelledCliResult,
  capturedOutput,
  createCliApplicationDouble,
  deferred,
  failedCliResult,
  frozenEvent,
  structuredInput,
  successfulCliResult,
} from '../../fixtures/xanthil-local-analysis/cli-profile-harness.ts';
import { createAgentRuntimeDouble, createLocalAnalysisExecutionDouble, createRunArtifactStoreDouble } from '../../fixtures/xanthil-local-analysis/port-contracts.ts';
import { loadPublicSeam, requiredExport } from '../../fixtures/xanthil-local-analysis/public-seams.ts';
import type { LocalAnalysisSuccess } from '../../../packages/application/local-analysis.ts';

// case:deterministic-cli-journey case:unavailable-cli-commands

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredRecord(value: unknown, key: string): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value[key])) throw new Error(`expected test record ${key}`);
  return value[key];
}

function requiredArray(value: unknown, key: string): unknown[] {
  if (!isRecord(value) || !Array.isArray(value[key])) throw new Error(`expected test array ${key}`);
  return value[key];
}

function isSuccessfulCliResult(value: unknown): value is LocalAnalysisSuccess & { status: 'succeeded' } {
  return isRecord(value) && value.status === 'succeeded' && 'run' in value && 'metrics' in value && 'finding' in value;
}

function requiredSuccessfulCliResult(value: unknown): LocalAnalysisSuccess & { status: 'succeeded' } {
  if (!isSuccessfulCliResult(value)) throw new Error('expected successful CLI result');
  return value;
}

function createDeterministicDeadlineScheduler() {
  const scheduled: Array<{ input: { at_epoch_ms: number; callback: () => unknown }; handle: { cancel(): undefined }; readonly cancelCalls: number }> = [];
  const scheduler = Object.freeze({
    schedule(input: { at_epoch_ms: number; callback: () => unknown }) {
      assert.equal(Object.isFrozen(input), true);
      assert.deepEqual(Object.keys(input).sort(), ['at_epoch_ms', 'callback']);
      assert.equal(Number.isSafeInteger(input.at_epoch_ms), true);
      assert.equal(typeof input.callback, 'function');
      let cancelCalls = 0;
      const handle = Object.freeze({ cancel() { cancelCalls += 1; return undefined; } });
      scheduled.push(Object.freeze({ input, handle, get cancelCalls() { return cancelCalls; } }));
      return handle;
    },
  });
  return Object.freeze({ scheduler, scheduled });
}

async function deterministicApplication() {
  const createLocalAnalysisApplication = requiredExport(await loadPublicSeam('application'), 'createLocalAnalysisApplication');
  const deadline = createDeterministicDeadlineScheduler();
  const application = createLocalAnalysisApplication({
    agentRuntime: createAgentRuntimeDouble(), localAnalysisExecution: createLocalAnalysisExecutionDouble(), runArtifactStore: createRunArtifactStoreDouble(),
    model: approvedModel, profile: Object.freeze({ id: 'personal' }),
    clock: () => new Date('2026-08-20T00:00:00.000Z'),
    deadlineScheduler: deadline.scheduler,
  });
  return Object.freeze({ application, deadline });
}

test('TEST-XCLI-013 deterministic substitute [AC-XCLI-001-01, AC-XCLI-002-01, AC-XCLI-002-03, AC-XCLI-005-01, AC-XCLI-006-01, AC-XCLI-007-02, AC-XCLI-011-01, AC-XCLI-012-01, AC-XCLI-015-01, AC-XCLI-016-01] drives the approved interactive scenario through the CLI entry', async () => {
  const cli = await loadPublicSeam('cli');
  const { output, events } = capturedOutput();
  const pendingInput = deferred();
  const interaction = [approvedQuestionEvent(), frozenEvent({ type: 'confirm' })];
  let interactionIndex = 0;
  const deterministic = await deterministicApplication();
  const result = requiredSuccessfulCliResult(await requiredExport(cli, 'runXanthil')({
    input: inputWithNext(() => interactionIndex < interaction.length ? Promise.resolve(interaction[interactionIndex++]) : pendingInput.promise), output, application: deterministic.application,
  }));
  assert.equal(result.run.status, 'succeeded');
  assert.deepEqual(result.metrics, referenceOracle);
  assert.equal(result.run.sources[0].sha256, fixtureSha256);
  assert.ok(events.length > 0);
  assert.equal(deterministic.deadline.scheduled.length, 1);
  assert.equal(deterministic.deadline.scheduled[0].input.at_epoch_ms, Date.parse('2026-08-20T00:00:00.000Z') + 300000);
  assert.equal(deterministic.deadline.scheduled[0].cancelCalls, 1);
});

test('TEST-XCLI-020 [AC-XCLI-014-03, AC-XCLI-016-04] rejects unavailable resume, list, delete, repair, and Action commands at the CLI boundary', async () => {
  const cli = await loadPublicSeam('cli');
  for (const command of ['resume', 'list', 'delete', 'repair', 'decision', 'recommend', 'action']) {
    await assert.rejects(
      () => requiredExport(cli, 'runXanthil')({ input: structuredInput([frozenEvent({ type: 'question', question: command })]), output: capturedOutput().output, application: { start() { throw new Error('must not start'); } } }),
      (error) => error instanceof Error && error.message === 'CLI_INPUT_INVALID',
    );
  }
});

test('RPN-T10 TEST-XCLI-013 [AC-XCLI-009-01, AC-XCLI-009-03, AC-XCLI-015-01] transports an exact current 2.0 Application success manifest', async () => {
  const cli = await loadPublicSeam('cli');
  const result = successfulCliResult();
  result.run = {
    ...result.run,
    schema_version: '2.0',
    product: { id: 'xanthil', version: '1.0.0' },
    runtime: { id: 'pi', version: '0.84.2' },
    adapter: { id: 'agent-pi', version: '1.0.0' },
    profile: { id: 'personal' },
  };
  const scenario = createCliApplicationDouble({ confirmResult: result });
  const output = capturedOutput();
  const observed = await requiredExport(cli, 'runXanthil')({
    input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' })]), output: output.output, application: scenario.application,
  });
  assert.deepEqual(observed, { status: 'succeeded', ...result });
  assert.deepEqual((observed as { run: unknown }).run, result.run);
});

test('TASK-006 helper health constructs the frozen one-shot input and synchronous output doubles', async () => {
  const input = structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'eof' })]);
  assert.deepEqual(Object.keys(input), []);
  assert.deepEqual(Object.getOwnPropertySymbols(input), [Symbol.asyncIterator]);
  const iterator = input[Symbol.asyncIterator]();
  assert.deepEqual(Object.keys(iterator), ['next']);
  assert.deepEqual(await iterator.next(), approvedQuestionEvent());
  const { output, events } = capturedOutput();
  assert.equal(output.write(frozenEvent({ type: 'ready', scenario: 'member-analysis-v1' })), undefined);
  assert.deepEqual(events, [{ type: 'ready', scenario: 'member-analysis-v1' }]);
  const tracked = trackedInput([approvedQuestionEvent()]);
  const iteratorFactory = Object.getOwnPropertyDescriptor(tracked.input, Symbol.asyncIterator)?.value;
  if (typeof iteratorFactory !== 'function') throw new Error('tracked input must expose an async iterator');
  assert.deepEqual(await iteratorFactory().next(), approvedQuestionEvent());
  assert.deepEqual(tracked.effects(), { requests: 1, nextCalls: 1 });
});

test('TASK-006 TEST-XCLI-013 [AC-XCLI-001-01, AC-XCLI-002-01, AC-XCLI-002-03, AC-XCLI-011-01, AC-XCLI-012-01, AC-XCLI-015-01] renders the closed deterministic success journey in causal order', async () => {
  const cli = await loadPublicSeam('cli');
  assert.deepEqual(Object.keys(cli), ['runXanthil']);
  const scenario = createCliApplicationDouble();
  const originalProposal = structuredClone(scenario.proposal);
  const originalResult = successfulCliResult();
  const originalResultSnapshot = structuredClone(originalResult);
  const resultScenario = createCliApplicationDouble({ proposal: scenario.proposal, confirmResult: originalResult });
  const { output, events } = capturedOutput();
  const result = requiredSuccessfulCliResult(await requiredExport(cli, 'runXanthil')({
    input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' })]), output, application: resultScenario.application,
  }));
  assert.deepEqual(resultScenario.effects.start, [{ question: 'Do recent member operations show a problem?', source: { version: 'member-orders-v1', kind: 'csv', sha256: fixtureSha256, path: 'member-orders-v1.csv' } }]);
  assert.equal(resultScenario.effects.discover, 1);
  assert.deepEqual(resultScenario.effects.confirm, [scenario.proposal]);
  assert.equal(resultScenario.effects.cancel, 0);
  assert.deepEqual(result, { status: 'succeeded', ...originalResult });
  assert.deepEqual(events.map((event) => event.type), ['ready', 'proposal', 'awaiting_confirmation', 'progress', 'terminal']);
  assert.deepEqual(events.at(-1), {
    type: 'terminal', status: 'succeeded', run_id: originalResult.run.run_id,
    oracle: { baseline_rate: '2/3', recent_rate: '1/9', delta_pp: '-500/9' }, finding_id: 'F-001', source_sha256: fixtureSha256,
    limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'], evidence_path: 'evidence.json', summary_path: 'summary.md',
  });
  assertFrozenClosed(result, ['status', 'run', 'metrics', 'finding']);
  assertFrozenClosed(events[0], ['type', 'scenario']);
  assertFrozenClosed(events[1], ['type', 'proposal']);
  const renderedProposal = events[1].proposal;
  if (!isRecord(renderedProposal)) throw new Error('expected rendered proposal record');
  if (!isRecord(scenario.proposal)) throw new Error('expected scenario proposal record');
  assertFrozenClosed(renderedProposal, Object.keys(scenario.proposal));
  assertFrozenClosed(events[2], ['type']);
  assertFrozenClosed(events[3], ['type', 'stage']);
  assertFrozenClosed(events[4], ['type', 'status', 'run_id', 'oracle', 'finding_id', 'source_sha256', 'limitations', 'evidence_path', 'summary_path']);
  assertDeepFrozen(result);
  events.forEach(assertDeepFrozen);
  assert.notStrictEqual(events[1].proposal, scenario.proposal);
  assert.notStrictEqual(result.run, originalResult.run);
  assert.notStrictEqual(result.metrics, originalResult.metrics);
  assert.notStrictEqual(result.finding, originalResult.finding);
  assert.equal(Object.isFrozen(scenario.proposal), false);
  assert.equal(Object.isFrozen(originalResult.run), false);
  assert.deepEqual(scenario.proposal, originalProposal);
  assert.deepEqual(originalResult, originalResultSnapshot);
});

for (const [event, reason] of [
  [frozenEvent({ type: 'reject' }), 'rejected'],
  [frozenEvent({ type: 'edit' }), 'edit_not_supported'],
  [frozenEvent({ type: 'eof' }), 'eof'],
  [frozenEvent({ type: 'interrupt' }), 'interrupted'],
] satisfies ReadonlyArray<readonly [import('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts').CliEvent, string]>) {
  test(`TASK-006 TEST-XCLI-003 [AC-XCLI-002-03, AC-XCLI-002-04] cancels exactly once before confirmation for ${event.type}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    const { output, events } = capturedOutput();
    const result = await requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), event]), output, application: scenario.application });
    assert.deepEqual(result, { status: 'cancelled', reason });
    assert.equal(scenario.effects.confirm.length, 0);
    assert.equal(scenario.effects.cancel, 1);
    assert.deepEqual(events.map(({ type }) => type), ['ready', 'proposal', 'awaiting_confirmation', 'terminal']);
    assert.deepEqual(events.at(-1), { type: 'terminal', status: 'cancelled', reason });
    assertDeepFrozen(result);
    events.forEach(assertDeepFrozen);
  });
}

for (const [event, reason] of [[frozenEvent({ type: 'eof' }), 'eof'], [frozenEvent({ type: 'interrupt' }), 'interrupted']] satisfies ReadonlyArray<readonly [import('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts').CliEvent, string]>) {
  test(`TASK-006 TEST-XCLI-015 [AC-XCLI-013-02, AC-XCLI-013-04] post-confirmation ${event.type} wins the single-event race and discards late success`, async () => {
    const cli = await loadPublicSeam('cli');
    const confirmationStarted = deferred<void>();
    const cancellationStarted = deferred<void>();
    const lateSuccess = deferred();
    const scenario = createCliApplicationDouble({
      confirm: () => { confirmationStarted.resolve(); return lateSuccess.promise; },
      cancel: () => { cancellationStarted.resolve(); return cancelledCliResult(); },
    });
    const { output, events } = capturedOutput();
    const running = requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), event]), output, application: scenario.application });
    await confirmationStarted.promise;
    await cancellationStarted.promise;
    lateSuccess.resolve(successfulCliResult());
    const result = await running;
    assert.deepEqual(result, { status: 'cancelled', run: cancelledCliResult().run });
    assert.equal(scenario.effects.confirm.length, 1);
    assert.equal(scenario.effects.cancel, 1);
    assert.deepEqual(events.map(({ type }) => type), ['ready', 'proposal', 'awaiting_confirmation', 'progress', 'terminal']);
    assert.deepEqual(events.at(-1), { type: 'terminal', status: 'cancelled', reason });
    assertDeepFrozen(result);
    events.forEach(assertDeepFrozen);
  });
}

test('TASK-006 TEST-XCLI-015 [AC-XCLI-013-02, AC-XCLI-013-04] rejects a post-confirmation non-cancellation interaction without a second Application call', async () => {
  const cli = await loadPublicSeam('cli');
  const pending = deferred();
  const scenario = createCliApplicationDouble({ confirm: () => pending.promise });
  const { output } = capturedOutput();
  const running = requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), frozenEvent({ type: 'reject' })]), output, application: scenario.application });
  await assert.rejects(running, (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
  assert.equal(scenario.effects.confirm.length, 1);
  assert.equal(scenario.effects.cancel, 0);
});

test('TASK-006 TEST-XCLI-018 [AC-XCLI-010-02, AC-XCLI-012-03, AC-XCLI-013-01] maps a failed Application terminal without rendering a success claim', async () => {
  const cli = await loadPublicSeam('cli');
  const applicationResult = failedCliResult();
  const scenario = createCliApplicationDouble({ confirmResult: applicationResult });
  const { output, events } = capturedOutput();
  const result = await requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' })]), output, application: scenario.application });
  assert.deepEqual(result, { status: 'failed', run: applicationResult.run });
  assert.deepEqual(events.at(-1), { type: 'terminal', status: 'failed', stage: 'artifact_finalize', code: 'ARTIFACT_WRITE_FAILED' });
  assert.equal(events.some((event) => event.type === 'terminal' && event.status === 'succeeded'), false);
  assertDeepFrozen(result);
  events.forEach(assertDeepFrozen);
});

function inputWithNext(next: () => Promise<unknown>) {
  const iterator = Object.freeze(Object.assign(Object.create(null), { next }));
  return Object.freeze(Object.defineProperty({}, Symbol.asyncIterator, { value() { return iterator; } }));
}

function trackedInput(events: readonly unknown[], { iterator = undefined, extraSymbol = undefined }: { iterator?: unknown; extraSymbol?: symbol } = {}) {
  let requests = 0;
  let nextCalls = 0;
  const selectedIterator = iterator ?? Object.freeze(Object.assign(Object.create(null), {
    next() {
      nextCalls += 1;
      return Promise.resolve(events[nextCalls - 1] ?? frozenEvent({ type: 'eof' }));
    },
  }));
  const input = {};
  Object.defineProperty(input, Symbol.asyncIterator, { value() { requests += 1; return selectedIterator; } });
  if (extraSymbol) Object.defineProperty(input, extraSymbol, { value: true, enumerable: true, writable: true, configurable: true });
  return { input: Object.freeze(input), effects: () => ({ requests, nextCalls }) };
}

function assertFrozenClosed(value: object, keys: readonly string[]) {
  assert.equal(Object.isFrozen(value), true);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort());
}

function assertDeepFrozen(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeepFrozen(nested);
}

for (const [label, event] of [
  ['unknown event type', frozenEvent({ type: 'resume' })],
  ['event with an unknown field', frozenEvent({ type: 'question', question: 'Do recent member operations show a problem?', source: 'override.csv' })],
  ['confirm before proposal', frozenEvent({ type: 'confirm' })],
  ['duplicate question after proposal', frozenEvent({ type: 'question', question: 'Do recent member operations show a problem?' })],
] satisfies ReadonlyArray<readonly [string, import('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts').CliEvent]>) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-014-03, AC-XCLI-016-04] rejects input-event mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    const events = event.type === 'confirm' || event.type === 'resume'
      ? [event]
      : [approvedQuestionEvent(), event];
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput(events), output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.confirm.length, 0);
    assert.equal(scenario.effects.cancel, 0);
  });
}

test('TASK-006 TEST-XCLI-020 [AC-XCLI-014-02, AC-XCLI-014-03] maps a rejected input read without forwarding its raw cause', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  const raw = new Error('/private/credential=secret');
  await assert.rejects(
    () => requiredExport(cli, 'runXanthil')({ input: inputWithNext(() => Promise.reject(raw)), output: capturedOutput().output, application: scenario.application }),
    (error) => assertCliBoundaryError(error, 'INPUT_READ_FAILED') === undefined,
  );
  assert.equal(scenario.effects.start.length, 0);
});

test('TASK-006 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-014-02] sanitizes an Application preflight failure into the closed terminal/result pair', async () => {
  const cli = await loadPublicSeam('cli');
  const raw = Object.assign(new Error('/private/workspace token=secret'), { code: 'FIXTURE_MISMATCH' });
  const scenario = createCliApplicationDouble({ startError: raw });
  const { output, events } = capturedOutput();
  const result = await requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output, application: scenario.application });
  assert.deepEqual(result, { status: 'failed', failure: { stage: 'preflight', code: 'FIXTURE_MISMATCH' } });
  assert.deepEqual(events, [
    { type: 'ready', scenario: 'member-analysis-v1' },
    { type: 'terminal', status: 'failed', stage: 'preflight', code: 'FIXTURE_MISMATCH' },
  ]);
  assert.equal(JSON.stringify(events).includes('secret'), false);
  assert.equal(JSON.stringify(events).includes('/private/'), false);
  assertDeepFrozen(result);
  events.forEach(assertDeepFrozen);
});

for (const [label, handle] of [
  ['missing discover', Object.freeze({ confirm() {}, cancel() {} })],
  ['unknown handle field', Object.freeze({ discover() {}, confirm() {}, cancel() {}, extra: true })],
  ['non-callable cancel', Object.freeze({ discover() {}, confirm() {}, cancel: true })],
]) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects Application handle mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const application = Object.freeze({ async start() { return handle; } });
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application }), (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined);
  });
}

for (const [label, makeInput] of [
  ['missing input', () => undefined],
  ['null input', () => null],
  ['raw async generator', async function* () { yield approvedQuestionEvent(); }],
  ['unknown input own field', () => Object.freeze({ extra: true, [Symbol.asyncIterator]: () => ({ next: async () => approvedQuestionEvent() }) })],
] satisfies ReadonlyArray<readonly [string, () => unknown]>) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects ${label} before Application start`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: makeInput(), output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const question of ['', 'resume', 'list', 'delete', 'repair', 'decision', 'recommend', 'action']) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects unavailable or alternate question ${JSON.stringify(question)} before Application start`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([frozenEvent({ type: 'question', question })]), output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const [label, output, code] of [
  ['missing writer', {}, 'CLI_OUTPUT_INVALID'],
  ['asynchronous writer', Object.freeze({ write() { return Promise.resolve(); } }), 'OUTPUT_WRITE_FAILED'],
  ['throwing writer', Object.freeze({ write() { throw new Error('credential=/secret'); } }), 'OUTPUT_WRITE_FAILED'],
] satisfies ReadonlyArray<readonly [string, unknown, string]>) {
  test(`TASK-006 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-014-02] rejects ${label} before Application start`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output, application: scenario.application }), (error) => assertCliBoundaryError(error, code) === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const application of [undefined, null, {}, { start: 1 }, { start() {}, extra: true }]) {
  test('TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects a closed-Application-surface mutation before start', async () => {
    const cli = await loadPublicSeam('cli');
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application }), (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined);
  });
}

for (const key of ['provider', 'model', 'path', 'runRoot', 'tools']) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-014-03, AC-XCLI-016-04] rejects caller-supplied ${key} before Application start`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application: scenario.application, [key]: 'caller-value' }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

test('TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects a second iterator request without repeating Application work', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  const input = structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' })]);
  await requiredExport(cli, 'runXanthil')({ input, output: capturedOutput().output, application: scenario.application });
  await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input, output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
  assert.equal(scenario.effects.start.length, 1);
  assert.equal(scenario.effects.discover, 1);
  assert.equal(scenario.effects.confirm.length, 1);
  assert.equal(scenario.effects.cancel, 0);
});

for (const [label, makeInput, code] of [
  ['missing iterator next', () => trackedInput([], { iterator: Object.freeze(Object.create(null)) }).input, 'CLI_INPUT_INVALID'],
  ['extra iterator method', () => trackedInput([], { iterator: Object.freeze(Object.assign(Object.create(null), { next() { return Promise.resolve(approvedQuestionEvent()); }, extra() {} })) }).input, 'CLI_INPUT_INVALID'],
  ['non-callable iterator next', () => trackedInput([], { iterator: Object.freeze(Object.assign(Object.create(null), { next: true })) }).input, 'CLI_INPUT_INVALID'],
  ['synchronous iterator result', () => trackedInput([], { iterator: Object.freeze(Object.assign(Object.create(null), { next() { return approvedQuestionEvent(); } })) }).input, 'CLI_INPUT_INVALID'],
  ['synchronous iterator throw', () => trackedInput([], { iterator: Object.freeze(Object.assign(Object.create(null), { next() { throw new Error('raw-secret'); } })) }).input, 'INPUT_READ_FAILED'],
  ['unknown input symbol', () => trackedInput([], { extraSymbol: Symbol('ambient') }).input, 'CLI_INPUT_INVALID'],
  ['non-frozen event', () => trackedInput([{ type: 'question', question: 'Do recent member operations show a problem?' }]).input, 'CLI_INPUT_INVALID'],
] satisfies ReadonlyArray<readonly [string, () => unknown, string]>) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects iterator protocol mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: makeInput(), output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, code) === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const event of [
  frozenEvent({ type: 'reject', extra: true }),
  frozenEvent({ type: 'edit', extra: true }),
  frozenEvent({ type: 'eof', extra: true }),
  frozenEvent({ type: 'interrupt', extra: true }),
]) {
  test(`TASK-006 TEST-XCLI-003 [AC-XCLI-002-03, AC-XCLI-002-04] rejects terminal event extra field: ${event.type}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), event]), output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.cancel, 0);
    assert.equal(scenario.effects.confirm.length, 0);
  });
}

test('TASK-006 TEST-XCLI-003 [AC-XCLI-002-03, AC-XCLI-002-04] consumes no duplicate terminal interaction after cancellation', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  const input = trackedInput([approvedQuestionEvent(), frozenEvent({ type: 'reject' }), frozenEvent({ type: 'interrupt' })]);
  const { output, events } = capturedOutput();
  const result = await requiredExport(cli, 'runXanthil')({ input: input.input, output, application: scenario.application });
  assert.deepEqual(result, { status: 'cancelled', reason: 'rejected' });
  assert.equal(scenario.effects.cancel, 1);
  assert.deepEqual(input.effects(), { requests: 1, nextCalls: 2 });
  assert.equal(events.filter(({ type }) => type === 'terminal').length, 1);
});

test('TASK-006 TEST-XCLI-015 [AC-XCLI-013-02, AC-XCLI-013-04] stops reading input when confirmation settles first', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  const input = trackedInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), frozenEvent({ type: 'interrupt' })]);
  const result = requiredSuccessfulCliResult(await requiredExport(cli, 'runXanthil')({ input: input.input, output: capturedOutput().output, application: scenario.application }));
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(input.effects(), { requests: 1, nextCalls: 2 });
  assert.equal(scenario.effects.cancel, 0);
});

test('TASK-008 TEST-XCLI-015 confirmation result wins an already-requested post-confirmation interrupt race', async () => {
  const cli = await loadPublicSeam('cli');
  const confirmationStarted = deferred<void>();
  const confirmedResult = deferred<unknown>();
  const postConfirmationInputRequested = deferred<void>();
  const postConfirmationInput = deferred();
  const scenario = createCliApplicationDouble({
    confirm: () => { confirmationStarted.resolve(); return confirmedResult.promise; },
  });
  let nextCall = 0;
  const input = inputWithNext(() => {
    nextCall += 1;
    if (nextCall === 1) return Promise.resolve(approvedQuestionEvent());
    if (nextCall === 2) return Promise.resolve(frozenEvent({ type: 'confirm' }));
    postConfirmationInputRequested.resolve();
    return postConfirmationInput.promise;
  });
  const running = requiredExport(cli, 'runXanthil')({ input, output: capturedOutput().output, application: scenario.application });
  await confirmationStarted.promise;
  await postConfirmationInputRequested.promise;
  confirmedResult.resolve(successfulCliResult());
  postConfirmationInput.resolve(frozenEvent({ type: 'interrupt' }));
  const result = requiredSuccessfulCliResult(await running);
  assert.equal(result.status, 'succeeded');
  assert.equal(scenario.effects.cancel, 0);
});

test('TASK-006 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-014-02] maps a scalar writer result exactly to OUTPUT_WRITE_FAILED', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  const output = Object.freeze({ write() { return 1; } });
  await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'OUTPUT_WRITE_FAILED') === undefined);
  assert.equal(scenario.effects.start.length, 0);
});

test('TASK-006 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-014-02] maps a malformed output surface exactly to CLI_OUTPUT_INVALID', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: Object.freeze({ write() {}, extra: true }), application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_OUTPUT_INVALID') === undefined);
  assert.equal(scenario.effects.start.length, 0);
});

test('TASK-006 TEST-XCLI-009 [AC-XCLI-001-01, AC-XCLI-001-02] passes only the immutable CLI-owned canonical source descriptor to Application start', async () => {
  const cli = await loadPublicSeam('cli');
  const scenario = createCliApplicationDouble();
  await requiredExport(cli, 'runXanthil')({
    input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'reject' })]), output: capturedOutput().output, application: scenario.application,
  });
  const [start] = scenario.effects.start;
  if (!isRecord(start) || !isRecord(start.source)) throw new Error('expected CLI start record');
  assertFrozenClosed(start.source, ['version', 'kind', 'sha256', 'path']);
  assert.deepEqual(start.source, { version: 'member-orders-v1', kind: 'csv', sha256: fixtureSha256, path: 'member-orders-v1.csv' });
});

for (const [label, makeInput] of [
  ['IteratorResult wrapper', () => inputWithNext(() => Promise.resolve(Object.freeze({ value: approvedQuestionEvent(), done: false })))],
  ['null direct Event', () => inputWithNext(() => Promise.resolve(null))],
  ['primitive direct Event', () => inputWithNext(() => Promise.resolve('question'))],
  ['non-plain direct Event', () => inputWithNext(() => Promise.resolve(Object.freeze(Object.assign(Object.create(null), approvedQuestionEvent()))))],
  ['pre-question eof', () => structuredInput([frozenEvent({ type: 'eof' })])],
  ['pre-question interrupt', () => structuredInput([frozenEvent({ type: 'interrupt' })])],
] satisfies ReadonlyArray<readonly [string, () => unknown]>) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-002-04] rejects direct-event protocol mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    const { output, events } = capturedOutput();
    await assert.rejects(
      () => requiredExport(cli, 'runXanthil')({ input: makeInput(), output, application: scenario.application }),
      (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined,
    );
    assert.deepEqual(events, []);
    assert.deepEqual(scenario.effects, { start: [], discover: 0, confirm: [], cancel: 0 });
  });
}

const cliOuterEnvelopeNegativeMatrix: readonly (readonly [string, unknown, string])[] = [
  ['null outer envelope', null, 'CLI_INPUT_INVALID'],
  ['null-prototype outer envelope', Object.assign(Object.create(null), { input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application: createCliApplicationDouble().application }), 'CLI_INPUT_INVALID'],
  ['inherited outer envelope', Object.create({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application: createCliApplicationDouble().application }), 'CLI_INPUT_INVALID'],
  ['outer symbol field', Object.assign({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application: createCliApplicationDouble().application }, { [Symbol('ambient')]: true }), 'CLI_INPUT_INVALID'],
];

for (const [label, invocation, code] of cliOuterEnvelopeNegativeMatrix) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-001-02, AC-XCLI-016-04] rejects closed outer-envelope mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    await assert.rejects(() => requiredExport(cli, 'runXanthil')(invocation), (error) => assertCliBoundaryError(error, code) === undefined);
  });
}

for (const [label, input] of [
  ['inherited async iterator', Object.freeze(Object.create({ [Symbol.asyncIterator]() { return { next() { return Promise.resolve(approvedQuestionEvent()); } }; } }))],
  ['null-prototype input', Object.freeze(Object.assign(Object.create(null), { [Symbol.asyncIterator]() { return { next() { return Promise.resolve(approvedQuestionEvent()); } }; } }))],
]) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-001-02] rejects closed input-envelope mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input, output: capturedOutput().output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_INPUT_INVALID') === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const [label, output] of [
  ['inherited writer', Object.freeze(Object.create({ write() {} }))],
  ['null-prototype writer', Object.freeze(Object.assign(Object.create(null), { write() {} }))],
  ['symbol writer field', Object.freeze(Object.assign({ write() {} }, { [Symbol('ambient')]: true }))],
]) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-001-02] rejects closed output-envelope mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const scenario = createCliApplicationDouble();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_OUTPUT_INVALID') === undefined);
    assert.equal(scenario.effects.start.length, 0);
  });
}

for (const [label, application] of [
  ['inherited start', Object.freeze(Object.create({ start() {} }))],
  ['null-prototype Application', Object.freeze(Object.assign(Object.create(null), { start() {} }))],
  ['symbol Application field', Object.freeze(Object.assign({ start() {} }, { [Symbol('ambient')]: true }))],
]) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-001-02] rejects closed Application-envelope mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application }), (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined);
  });
}

function invalidApplicationRunMutation(label: string, mutate: (candidate: Record<string, unknown>) => unknown) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-003-01, AC-XCLI-003-02] rejects invalid complete Application result: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const candidateValue: unknown = successfulCliResult();
    if (!isRecord(candidateValue)) throw new Error('expected complete result record');
    const candidate = candidateValue;
    const confirmResult = mutate(candidate);
    const scenario = createCliApplicationDouble({ confirmResult });
    const input = trackedInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), frozenEvent({ type: 'interrupt' })]);
    const { output, events } = capturedOutput();
    await assert.rejects(
      () => requiredExport(cli, 'runXanthil')({ input: input.input, output, application: scenario.application }),
      (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined,
    );
    assert.equal(scenario.effects.confirm.length, 1);
    assert.equal(scenario.effects.cancel, 0);
    assert.deepEqual(input.effects(), { requests: 1, nextCalls: 2 });
    assert.equal(events.some((event) => event.type === 'terminal' && event.status === 'succeeded'), false);
  });
}

for (const [label, mutate] of [
  ['null result', () => null],
  ['primitive result', () => 1],
  ['non-plain result', (result) => Object.assign(Object.create(null), result)],
  ['missing run', (result) => { delete result.run; return result; }],
  ['extra result field', (result) => ({ ...result, ambient: true })],
  ['legacy current manifest version', (result) => {
    const run = requiredRecord(result, 'run');
    run.schema_version = '1.0';
    run.runtime = { xanthil_version: '1.0.0', pi_adapter_version: '1.0.0', pi_version: '0.84.2' };
    delete run.product;
    delete run.adapter;
    delete run.profile;
    return result;
  }],
  ['unknown current manifest version', (result) => { requiredRecord(result, 'run').schema_version = '3.0'; return result; }],
  ['in-progress manifest', (result) => { const run = requiredRecord(result, 'run'); run.status = 'in_progress'; delete run.ended_at; delete run.evidence; return result; }],
  ['wrong manifest run ID', (result) => { requiredRecord(result, 'run').run_id = 'not-a-uuidv7'; return result; }],
  ['wrong source checksum', (result) => { requiredRecord({ entry: requiredArray(requiredRecord(result, 'run'), 'sources')[0] }, 'entry').sha256 = '0'.repeat(64); return result; }],
  ['wrong artifact descriptor', (result) => { requiredRecord({ entry: requiredArray(requiredRecord(result, 'run'), 'artifacts')[0] }, 'entry').path = 'outputs/O-001.json'; return result; }],
  ['wrong evidence descriptor', (result) => { requiredRecord(requiredRecord(result, 'run'), 'evidence').path = 'other-evidence.json'; return result; }],
  ['forbidden terminal detail on success', (result) => { requiredRecord(result, 'run').terminal_detail = { stage: 'execution' }; return result; }],
  ['non-canonical metrics', (result) => { requiredRecord(requiredRecord(result, 'metrics'), 'baseline').repurchase_member_rate = { numerator: 1, denominator: 2 }; return result; }],
  ['non-canonical Finding', (result) => { requiredRecord(result, 'finding').finding_id = 'F-002'; return result; }],
] satisfies ReadonlyArray<readonly [string, (candidate: Record<string, unknown>) => unknown]>) invalidApplicationRunMutation(label, mutate);

for (const [label, makeResult] of [
  ['failed manifest missing terminal detail', () => { const result = failedCliResult(); delete result.run.terminal_detail; return result; }],
  ['failed manifest extra field', () => ({ ...failedCliResult(), ambient: true })],
  ['cancelled manifest wrong status', () => { const result = cancelledCliResult(); result.run.status = 'failed'; return result; }],
  ['cancelled manifest invalid terminal detail', () => { const result = cancelledCliResult(); requiredRecord(result.run, 'terminal_detail').error_code = 'CANCELLED'; return result; }],
] satisfies ReadonlyArray<readonly [string, () => unknown]>) invalidApplicationRunMutation(label, makeResult);

for (const [label, mutate] of [
  ['missing proposal field', (proposal: Record<string, unknown>) => { delete proposal.constraints; return proposal; }],
  ['extra proposal field', (proposal: Record<string, unknown>) => ({ ...proposal, ambient: true })],
  ['wrong proposal semantic value', (proposal: Record<string, unknown>) => { proposal.question = 'alternate question'; return proposal; }],
] satisfies ReadonlyArray<readonly [string, (proposal: Record<string, unknown>) => unknown]>) {
  test(`TASK-006 TEST-XCLI-009 [AC-XCLI-002-01, AC-XCLI-003-01] rejects invalid discovered proposal: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const proposalValue: unknown = structuredClone(createCliApplicationDouble().proposal);
    if (!isRecord(proposalValue)) throw new Error('expected proposal test record');
    const proposal = mutate(proposalValue);
    const scenario = createCliApplicationDouble({ proposal });
    const { output, events } = capturedOutput();
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' })]), output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined);
    assert.equal(scenario.effects.confirm.length, 0);
    assert.equal(events.some((event) => event.type === 'proposal' || event.type === 'awaiting_confirmation'), false);
  });
}

function mappedApplicationError(label: string, phase: 'start' | 'discover' | 'confirm', error: unknown, expected: Record<string, unknown>) {
  test(`TASK-006 TEST-XCLI-018 [AC-XCLI-010-02, AC-XCLI-013-01] maps ${label} to its exact sanitized terminal/result pair`, async () => {
    const cli = await loadPublicSeam('cli');
    const options = phase === 'start' ? { startError: error } : phase === 'discover' ? { discoverError: error } : { confirm: () => { throw error; } };
    const scenario = createCliApplicationDouble(options);
    const { output, events } = capturedOutput();
    const input = trackedInput(phase === 'confirm'
      ? [approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), frozenEvent({ type: 'interrupt' })]
      : [approvedQuestionEvent(), frozenEvent({ type: 'interrupt' })]);
    const result = await requiredExport(cli, 'runXanthil')({ input: input.input, output, application: scenario.application });
    assert.deepEqual(result, { status: 'failed', failure: expected });
    assert.deepEqual(events.at(-1), { type: 'terminal', status: 'failed', ...expected });
    assert.equal(events.some((event) => event.type === 'terminal' && event.status === 'succeeded'), false);
    if (phase === 'confirm') assert.equal(events.filter((event) => event.type === 'proposal').length, 1);
    else assert.equal(events.some((event) => event.type === 'proposal'), false);
    assert.equal(JSON.stringify({ result, events }).includes('raw-secret'), false);
    if (phase === 'start') {
      const firstStart = scenario.effects.start[0];
      assert.deepEqual(scenario.effects, { start: [{ question: 'Do recent member operations show a problem?', source: isRecord(firstStart) ? firstStart.source : undefined }], discover: 0, confirm: [], cancel: 0 });
      assert.deepEqual(input.effects(), { requests: 1, nextCalls: 1 });
    } else if (phase === 'discover') {
      assert.equal(scenario.effects.start.length, 1);
      assert.equal(scenario.effects.discover, 1);
      assert.equal(scenario.effects.confirm.length, 0);
      assert.equal(scenario.effects.cancel, 0);
      assert.deepEqual(input.effects(), { requests: 1, nextCalls: 1 });
    } else {
      assert.equal(scenario.effects.start.length, 1);
      assert.equal(scenario.effects.discover, 1);
      assert.equal(scenario.effects.confirm.length, 1);
      assert.equal(scenario.effects.cancel, 0);
      assert.deepEqual(input.effects(), { requests: 1, nextCalls: 2 });
    }
    assertDeepFrozen(result);
    events.forEach(assertDeepFrozen);
  });
}

mappedApplicationError('recognized start preflight error', 'start', Object.assign(new Error('raw-secret'), { code: 'FIXTURE_NOT_FOUND' }), { stage: 'preflight', code: 'FIXTURE_NOT_FOUND' });
mappedApplicationError('unknown raw start cause', 'start', new Error('raw-secret'), { stage: 'execution', code: 'INTERNAL_ERROR' });
mappedApplicationError('recognized discover preflight error', 'discover', Object.assign(new Error('raw-secret'), { code: 'MODEL_UNAVAILABLE' }), { stage: 'preflight', code: 'MODEL_UNAVAILABLE' });
mappedApplicationError('malformed discover stage/code pair', 'discover', Object.assign(new Error('raw-secret'), { stage: 'not-a-stage', code: 'NOT_A_CODE' }), { stage: 'execution', code: 'INTERNAL_ERROR' });
mappedApplicationError('no-run RUN_COLLISION at confirmation', 'confirm', Object.assign(new Error('raw-secret'), { code: 'RUN_COLLISION' }), { stage: 'preflight', code: 'RUN_COLLISION' });
mappedApplicationError('recognized post-confirmation pair', 'confirm', Object.assign(new Error('raw-secret'), { stage: 'validation', code: 'VALIDATION_FAILED' }), { stage: 'validation', code: 'VALIDATION_FAILED' });
mappedApplicationError('unknown raw confirmation cause', 'confirm', new Error('raw-secret'), { stage: 'execution', code: 'INTERNAL_ERROR' });

for (const stage of ['ready', 'proposal', 'awaiting_confirmation', 'progress', 'terminal']) {
  for (const [kind, writer] of [
    ['throw', () => { throw new Error('raw-secret'); }],
    ['scalar', () => 1],
    ['Promise', () => Promise.resolve()],
  ] satisfies ReadonlyArray<readonly [string, () => unknown]>) {
    test(`TASK-006 TEST-XCLI-018 [AC-XCLI-001-02, AC-XCLI-013-01] stops exactly at ${stage} when writer ${kind}s`, async () => {
      const cli = await loadPublicSeam('cli');
      const scenario = createCliApplicationDouble();
      const input = trackedInput([approvedQuestionEvent(), frozenEvent({ type: 'confirm' }), frozenEvent({ type: 'interrupt' })]);
      const events: import('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts').CliEvent[] = [];
      const output = Object.freeze({ write(event: import('../../fixtures/xanthil-local-analysis/cli-profile-harness.ts').CliEvent) { events.push(event); if (event.type === stage) return writer(); return undefined; } });
      await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: input.input, output, application: scenario.application }), (error) => assertCliBoundaryError(error, 'OUTPUT_WRITE_FAILED') === undefined);
      const terminalEvent = events.at(-1);
      if (!terminalEvent) throw new Error('expected writer event');
      assert.equal(terminalEvent.type, stage);
      assert.equal(events.filter((event) => event.type === stage).length, 1);
      if (stage === 'ready') assert.deepEqual(scenario.effects, { start: [], discover: 0, confirm: [], cancel: 0 });
      if (stage === 'proposal') { const firstStart = scenario.effects.start[0]; assert.deepEqual(scenario.effects, { start: [{ question: 'Do recent member operations show a problem?', source: isRecord(firstStart) ? firstStart.source : undefined }], discover: 1, confirm: [], cancel: 0 }); }
      if (stage === 'awaiting_confirmation') assert.equal(scenario.effects.confirm.length, 0);
      if (stage === 'progress') assert.equal(scenario.effects.confirm.length, 1);
      if (stage === 'terminal') assert.equal(scenario.effects.confirm.length, 1);
      assert.equal(input.effects().nextCalls, stage === 'ready' || stage === 'proposal' || stage === 'awaiting_confirmation' ? 1 : 2);
    });
  }
}

for (const [label, handle] of [
  ['missing confirm', Object.freeze({ discover() {}, cancel() {} })],
  ['missing cancel', Object.freeze({ discover() {}, confirm() {} })],
  ['non-callable discover', Object.freeze({ discover: true, confirm() {}, cancel() {} })],
  ['non-callable confirm', Object.freeze({ discover() {}, confirm: true, cancel() {} })],
  ['inherited handle methods', Object.freeze(Object.create({ discover() {}, confirm() {}, cancel() {} }))],
  ['symbol handle field', Object.freeze(Object.assign({ discover() {}, confirm() {}, cancel() {} }, { [Symbol('ambient')]: true }))],
]) {
  test(`TASK-006 TEST-XCLI-020 [AC-XCLI-001-02, AC-XCLI-016-04] rejects Application handle mutation: ${label}`, async () => {
    const cli = await loadPublicSeam('cli');
    const application = Object.freeze({ async start() { return handle; } });
    await assert.rejects(() => requiredExport(cli, 'runXanthil')({ input: structuredInput([approvedQuestionEvent()]), output: capturedOutput().output, application }), (error) => assertCliBoundaryError(error, 'CLI_APPLICATION_INVALID') === undefined);
  });
}

test('TEST-XCLI-013 real Pi acceptance uses only the approved synthetic fixture and closed personal Profile', {
  skip: process.env.XANTHIL_REAL_PI_ACCEPTANCE === '1' ? false : 'set XANTHIL_REAL_PI_ACCEPTANCE=1 only for the Controller-authorized TASK-009 acceptance command',
}, async (t) => {
  const parent = await mkdtemp(join(tmpdir(), 'xanthil-real-pi-'));
  t.after(async () => { await rm(parent, { recursive: true, force: true }).catch(() => {}); });
  const workspaceRootPath = join(parent, 'workspace');
  const runRootPath = join(parent, 'runs');
  await mkdir(workspaceRootPath);
  await mkdir(runRootPath);
  const workspaceRoot = await realpath(workspaceRootPath);
  const runRoot = await realpath(runRootPath);
  const sourcePath = join(workspaceRoot, 'member-orders-v1.csv');
  const fixtureBytes = await canonicalFixtureBytes();
  assert.equal(fixtureBytes.byteLength, fixtureByteSize);
  assert.equal(sha256(fixtureBytes), fixtureSha256);
  await writeFile(sourcePath, fixtureBytes);

  const profileModule = await loadPublicSeam('personalProfile');
  const createProfile = requiredExport(profileModule, 'createPersonalLocalAnalysisProfile');
  const cli = await loadPublicSeam('cli');
  const pendingInput = deferred();
  const interaction = [frozenEvent({ type: 'question', question: approvedQuestion }), frozenEvent({ type: 'confirm' })];
  let interactionIndex = 0;
  const { output, events } = capturedOutput();
  let result: unknown;
  try {
    const { application } = createProfile({ workspaceRoot, runRoot, provider: approvedModel.provider, modelId: approvedModel.model_id });
    result = await requiredExport(cli, 'runXanthil')({
      input: inputWithNext(() => interactionIndex < interaction.length ? Promise.resolve(interaction[interactionIndex++]) : pendingInput.promise),
      output,
      application,
    });
  } catch {
    assert.fail('real Pi acceptance did not complete with a closed succeeded result');
  }

  const successfulResult = requiredSuccessfulCliResult(result);
  assert.equal(successfulResult.status, 'succeeded');
  assert.deepEqual(successfulResult.run.model, approvedModel);
  assert.equal(successfulResult.run.sources[0].sha256, fixtureSha256);
  assert.deepEqual(successfulResult.metrics, referenceOracle);
  assert.equal(successfulResult.finding.finding_id, 'F-001');
  assert.deepEqual(successfulResult.finding.limitations.length, 3);
  assert.deepEqual(events.map((event) => event.type), ['ready', 'proposal', 'awaiting_confirmation', 'progress', 'terminal']);
  const terminalEvent = events.at(-1);
  if (!terminalEvent) throw new Error('expected terminal event');
  assert.equal(terminalEvent.status, 'succeeded');
  assert.equal(JSON.stringify(events).includes('ORD-001'), false);

  const runDirectory = join(runRoot, successfulResult.run.run_id);
  const persistedRun = JSON.parse(await readFile(join(runDirectory, 'run.json'), 'utf8'));
  const evidence = JSON.parse(await readFile(join(runDirectory, 'evidence.json'), 'utf8'));
  const summary = await readFile(join(runDirectory, 'summary.md'), 'utf8');
  const evidenceDocument = await readFile(join(runDirectory, 'evidence.md'), 'utf8');
  assert.deepEqual(persistedRun, successfulResult.run);
  assert.equal(persistedRun.status, 'succeeded');
  assert.deepEqual(persistedRun.artifacts.map((asset: { artifact_id: string }) => asset.artifact_id), ['Q-001', 'S-001', 'O-001', 'O-002', 'DOC-SUMMARY', 'DOC-EVIDENCE']);
  assert.equal(evidence.findings[0].finding_id, 'F-001');
  assert.match(summary, /66\.7%/);
  assert.match(evidenceDocument, /SRC-001/);
  for (const asset of persistedRun.artifacts) {
    const bytes = await readFile(join(runDirectory, asset.path));
    assert.equal(bytes.byteLength, asset.byte_size);
    assert.equal(sha256(bytes), asset.sha256);
  }
  const sourceAfter = await readFile(sourcePath);
  assert.deepEqual(sourceAfter, fixtureBytes);
  assert.deepEqual(calculateFixtureOracle(parseClosedFixture(sourceAfter)), referenceOracle);
  assert.deepEqual((await readdir(runDirectory)).sort(), ['analysis-contract.json', 'evidence.json', 'evidence.md', 'outputs', 'queries', 'run.json', 'scripts', 'summary.md']);
});
