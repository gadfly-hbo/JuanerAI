import { approvedQuestion, expectedAnalysisProposal, expectedFindingProposal, fixtureSha256, referenceOracle } from './fixture-oracle.mjs';
import { expectedArtifactRun } from './port-contracts.mjs';

export const canonicalCliSource = Object.freeze({
  version: 'member-orders-v1', kind: 'csv', sha256: fixtureSha256, path: 'member-orders-v1.csv',
});

export function frozenEvent(value) {
  return Object.freeze(value);
}

export function structuredInput(events) {
  let requested = false;
  let index = 0;
  const iterator = Object.create(null);
  Object.defineProperty(iterator, 'next', {
    enumerable: true,
    value() {
      return Promise.resolve(events[index++] ?? frozenEvent({ type: 'eof' }));
    },
  });
  Object.freeze(iterator);
  const input = {};
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

export function capturedOutput({ result = undefined, throwError } = {}) {
  const events = [];
  return {
    events,
    output: Object.freeze({
      write(event) {
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
  return { run: structuredClone(expectedArtifactRun(run_id).failedManifest) };
}

export function cancelledCliResult(run_id = '0198d943-8b71-7a11-9abc-0000000000a1') {
  return { run: structuredClone(expectedArtifactRun(run_id).cancelledManifest) };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
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
} = {}) {
  const effects = { start: [], discover: 0, confirm: [], cancel: 0 };
  const handle = Object.freeze({
    async discover() {
      effects.discover += 1;
      if (discoverError) throw discoverError;
      return proposal;
    },
    async confirm(value) {
      effects.confirm.push(value);
      return confirm ? confirm(value, effects) : confirmResult;
    },
    async cancel() {
      effects.cancel += 1;
      return cancel ? cancel(effects) : cancelResult;
    },
  });
  const application = Object.freeze({
    async start(value) {
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

export function assertCliBoundaryError(error, expected) {
  if (!error || error.code !== expected) throw new Error(`expected ${expected}, got ${error?.code}`);
}
