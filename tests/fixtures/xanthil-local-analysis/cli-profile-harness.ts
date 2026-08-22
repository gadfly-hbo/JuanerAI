import { approvedQuestion, expectedAnalysisProposal, expectedFindingProposal, fixtureSha256, referenceOracle } from './fixture-oracle.ts';
import { expectedArtifactRun } from './port-contracts.ts';

export const canonicalCliSource = Object.freeze({
  version: 'member-orders-v1', kind: 'csv', sha256: fixtureSha256, path: 'member-orders-v1.csv',
});

type CliEffects = {
  start: unknown[];
  discover: number;
  confirm: unknown[];
  cancel: number;
};

export type CliEvent = Record<string, unknown> & { type: string };
type OneShotIterator = { next(): Promise<CliEvent> };
type OneShotInput = { [Symbol.asyncIterator](): OneShotIterator };

type CliDoubleOptions = {
  proposal?: unknown;
  confirmResult?: unknown;
  cancelResult?: unknown;
  startError?: unknown;
  discoverError?: unknown;
  confirm?: (value: unknown, effects: CliEffects) => unknown;
  cancel?: (effects: CliEffects) => unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function recordEntry(value: unknown, key: string): unknown {
  if (!isRecord(value) || !Object.hasOwn(value, key)) throw new Error(`missing fixture entry ${key}`);
  return value[key];
}

export function frozenEvent<T extends CliEvent>(value: T): Readonly<T> {
  return Object.freeze(value);
}

export function structuredInput(events: readonly CliEvent[]): OneShotInput {
  let requested = false;
  let index = 0;
  const iterator: OneShotIterator = {
    next() {
      return Promise.resolve(events[index++] ?? frozenEvent({ type: 'eof' }));
    },
  };
  Object.setPrototypeOf(iterator, null);
  Object.freeze(iterator);
  const input: OneShotInput = {
    [Symbol.asyncIterator]() {
      throw new Error('one-shot input not initialized');
    },
  };
  Object.defineProperty(input, Symbol.asyncIterator, {
    enumerable: false,
    value() {
      if (requested) throw new Error('iterator requested twice');
      requested = true;
      return iterator;
    },
  });
  return Object.freeze(input);
}

export function capturedOutput({ result = undefined, throwError }: { result?: unknown; throwError?: unknown } = {}) {
  const events: CliEvent[] = [];
  return {
    events,
    output: Object.freeze({
      write(event: CliEvent) {
        events.push(event);
        if (throwError) throw throwError;
        return result;
      },
    }),
  };
}

export function successfulCliResult(run_id = '0198d943-8b71-7a11-9abc-0000000000a1') {
  const fixture = expectedArtifactRun(run_id);
  return {
    metrics: structuredClone(referenceOracle),
    finding: structuredClone(expectedFindingProposal()),
    run: structuredClone(fixture.succeededManifest),
  };
}

export function failedCliResult(run_id = '0198d943-8b71-7a11-9abc-0000000000a1') {
  const run = recordEntry(expectedArtifactRun(run_id), 'failedManifest');
  if (!isRecord(run)) throw new Error('expected failed manifest record');
  return { run: structuredClone(run) };
}

export function cancelledCliResult(run_id = '0198d943-8b71-7a11-9abc-0000000000a1') {
  const run = recordEntry(expectedArtifactRun(run_id), 'cancelledManifest');
  if (!isRecord(run)) throw new Error('expected cancelled manifest record');
  return { run: structuredClone(run) };
}

export function deferred<T = unknown>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

export function createCliApplicationDouble({
  proposal = expectedAnalysisProposal(),
  confirmResult = successfulCliResult(),
  cancelResult = { status: 'cancelled' },
  startError,
  discoverError,
  confirm,
  cancel,
}: CliDoubleOptions = {}) {
  const effects: CliEffects = { start: [], discover: 0, confirm: [], cancel: 0 };
  const handle = Object.freeze({
    async discover() {
      effects.discover += 1;
      if (discoverError) throw discoverError;
      return proposal;
    },
    async confirm(value: unknown) {
      effects.confirm.push(value);
      return confirm ? confirm(value, effects) : confirmResult;
    },
    async cancel() {
      effects.cancel += 1;
      return cancel ? cancel(effects) : cancelResult;
    },
  });
  const application = Object.freeze({
    async start(value: unknown) {
      effects.start.push(value);
      if (startError) throw startError;
      return handle;
    },
  });
  return { application, effects, handle, proposal };
}

export function approvedQuestionEvent() {
  return frozenEvent({ type: 'question', question: approvedQuestion });
}

export function assertCliBoundaryError(error: unknown, expected: string) {
  const code = isRecord(error) && Object.hasOwn(error, 'code') ? error.code : undefined;
  if (code !== expected) throw new Error(`expected ${expected}, got ${String(code)}`);
}
