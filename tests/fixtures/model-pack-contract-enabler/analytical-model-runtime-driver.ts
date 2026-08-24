import assert from 'node:assert/strict';
import { mock } from 'node:test';
import type {
  AnalyticalModelOpenRunInputV1,
  AnalyticalModelPreflightInputV1,
  AnalyticalModelReadinessV1,
  AnalyticalModelRun,
  AnalyticalModelRuntime,
  AnalyticalModelRuntimeBindingV1,
  LocalCategoryDemandPredictionRequestV1,
  LocalCategoryDemandPredictor,
} from '../../../packages/ports/analytical-model-runtime.ts';
import type {
  CategoryDemandForecastResultV1,
  CategoryDemandInputV1,
  ModelPackErrorCode,
} from '../../../packages/contracts/model-pack.ts';

import {
  FIXED_EPOCH_MS,
  artifactObservationFixture,
  bindingFixture,
  canonicalBytes,
  clone,
  deepFreeze,
  expectedPackageFixture,
  forecastFixture,
  inputFixture,
  manifestFixture,
  releaseStatusFixture,
  sha256,
  snapshotFixture,
} from './model-pack-fixtures.ts';

export type IssuedPrediction = Readonly<{
  run_id: string;
  input: CategoryDemandInputV1;
  cancellation_signal: AbortSignal;
  deadline_at: string;
}>;

export type AnalyticalModelRuntimeHarness = Readonly<{
  runtime: AnalyticalModelRuntime;
  control: Readonly<{
    waitForIssue(): Promise<IssuedPrediction>;
    fulfill(candidate: unknown): void;
    reject(reason: unknown): void;
    issueCount(): number;
  }>;
}>;

export type ControlledPredictor = Readonly<{
  predictor: LocalCategoryDemandPredictor;
  control: AnalyticalModelRuntimeHarness['control'];
}>;

type RuntimeError = Error & { name: 'ModelPackContractError'; code: ModelPackErrorCode };
type UnknownRecord = Record<string, unknown>;

const runtimeError = (code: ModelPackErrorCode): RuntimeError => {
  const error = new Error(code) as RuntimeError;
  error.name = 'ModelPackContractError';
  error.code = code;
  return error;
};

const exactKeys = (value: unknown, keys: readonly string[]): value is UnknownRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key)));

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

function assertError(error: unknown, code: ModelPackErrorCode): true {
  assert.equal(error instanceof Error, true);
  assert.equal((error as Error).name, 'ModelPackContractError');
  assert.equal((error as Error).message, code);
  assert.equal((error as { code?: unknown }).code, code);
  assert.equal('cause' in (error as object), false);
  return true;
}

export function createControlledPredictor(): ControlledPredictor {
  let issued: IssuedPrediction | undefined;
  let settle: ((value: unknown) => void) | undefined;
  let fail: ((reason: unknown) => void) | undefined;
  let wake: ((value: IssuedPrediction) => void) | undefined;
  let count = 0;
  const control = Object.freeze({
    waitForIssue: () => issued ? Promise.resolve(issued) : new Promise<IssuedPrediction>((resolve) => { wake = resolve; }),
    fulfill(candidate: unknown) {
      if (!settle) throw new Error('predictor was not issued');
      settle(candidate);
    },
    reject(reason: unknown) {
      if (!fail) throw new Error('predictor was not issued');
      fail(reason);
    },
    issueCount: () => count,
  });
  return Object.freeze({
    control,
    predictor(request: LocalCategoryDemandPredictionRequestV1) {
      count += 1;
      const observation = Object.freeze({ ...request });
      issued = observation;
      wake?.(observation);
      return new Promise((resolve, reject) => {
        settle = resolve;
        fail = reject;
      });
    },
  });
}

function defineDeterministicRuntimeDouble(input: Readonly<{
  binding: AnalyticalModelRuntimeBindingV1;
  predictor: LocalCategoryDemandPredictor;
}>): AnalyticalModelRuntime {
  const binding = deepFreeze(clone(input.binding));
  const admittedReadiness = new WeakSet<object>();

  const runtime: AnalyticalModelRuntime = Object.freeze({
    async preflight(candidate: AnalyticalModelPreflightInputV1) {
      if (!exactKeys(candidate, ['expected_package', 'manifest_bytes', 'artifact_observation', 'release_status'])) {
        throw runtimeError('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      }
      if (!(candidate.manifest_bytes instanceof Uint8Array)
        || !same(candidate.expected_package, expectedPackageFixture())
        || !same(candidate.artifact_observation, artifactObservationFixture())) {
        throw runtimeError('MODEL_PACK_IDENTITY_MISMATCH');
      }
      if (!same(Array.from(candidate.manifest_bytes), Array.from(canonicalBytes(manifestFixture())))) {
        throw runtimeError('MODEL_PACK_CONTRACT_INVALID');
      }
      if (!same(candidate.release_status, releaseStatusFixture()) && !same(candidate.release_status, releaseStatusFixture('revoked'))) {
        throw runtimeError('MODEL_PACK_CONTRACT_INVALID');
      }
      if ((candidate.release_status as UnknownRecord).state === 'revoked') throw runtimeError('MODEL_PACK_REVOKED');
      const manifest = manifestFixture();
      const manifestRuntime = manifest.runtime as UnknownRecord;
      if (!same(manifestRuntime.runtime, binding.runtime)
        || !same(manifestRuntime.dependencies, binding.dependencies)
        || !same(manifest.permissions, binding.permissions)) {
        throw runtimeError('MODEL_PACK_RUNTIME_INCOMPATIBLE');
      }
      const provenance = manifest.provenance as UnknownRecord;
      const readiness = deepFreeze({
        package: clone(expectedPackageFixture()),
        manifest: clone(manifest),
        model: {
          controller_release_decision_id: provenance.controller_release_decision_id,
          mlflow_run_id: provenance.mlflow_run_id,
          registered_model_name: provenance.registered_model_name,
          registered_model_version: provenance.registered_model_version,
        },
        release_status: clone(candidate.release_status),
        runtime: clone(binding.runtime),
        adapter: clone(binding.adapter),
        dependencies: clone(binding.dependencies),
        permissions: clone(binding.permissions),
      }) as unknown as AnalyticalModelReadinessV1;
      admittedReadiness.add(readiness as object);
      return readiness;
    },

    async openRun(candidate: AnalyticalModelOpenRunInputV1) {
      if (!exactKeys(candidate, ['run_id', 'readiness', 'snapshot'])
        || typeof candidate.run_id !== 'string'
        || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(candidate.run_id)
        || !candidate.readiness
        || typeof candidate.readiness !== 'object'
        || !admittedReadiness.has(candidate.readiness as object)) {
        throw runtimeError('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      }
      const snapshot = candidate.snapshot as unknown as UnknownRecord;
      if (!exactKeys(snapshot, ['snapshot_id', 'confirmed_at', 'sha256', 'input'])
        || !same(snapshot.input, inputFixture())) {
        throw runtimeError('MODEL_PACK_INPUT_INVALID');
      }
      if (snapshot.sha256 !== sha256(canonicalBytes(snapshot.input))) {
        throw runtimeError('ANALYTICAL_MODEL_INPUT_CHANGED');
      }
      const capturedReadiness = candidate.readiness;
      const capturedSnapshot = deepFreeze(clone(snapshot));
      const runId = candidate.run_id;
      let started = false;

      const run: AnalyticalModelRun = Object.freeze({
        async predict(call: Readonly<{ cancellation_signal: AbortSignal; deadline_at: string }>) {
          if (started) throw runtimeError('ANALYTICAL_MODEL_RUN_ALREADY_STARTED');
          started = true;
          if (!exactKeys(call, ['cancellation_signal', 'deadline_at'])
            || !(call.cancellation_signal instanceof AbortSignal)
            || typeof call.deadline_at !== 'string'
            || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(call.deadline_at)
            || new Date(call.deadline_at).toISOString() !== call.deadline_at) {
            throw runtimeError('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
          }
          const signal = call.cancellation_signal;
          const deadline = Date.parse(call.deadline_at);
          if (signal.aborted) throw runtimeError('ANALYTICAL_MODEL_CANCELLED');
          if (Date.now() >= deadline) throw runtimeError('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');

          const request = Object.freeze({ run_id: runId, input: capturedSnapshot.input as CategoryDemandInputV1, cancellation_signal: signal, deadline_at: call.deadline_at });
          let predictorPromise: Promise<unknown>;
          try {
            predictorPromise = Promise.resolve(input.predictor(request));
          } catch {
            predictorPromise = Promise.reject(undefined);
          }

          return new Promise<CategoryDemandForecastResultV1>((resolve, reject) => {
            let terminal = false;
            const finishError = (code: ModelPackErrorCode) => {
              if (terminal) return;
              terminal = true;
              clearTimeout(timer);
              signal.removeEventListener('abort', onAbort);
              reject(runtimeError(code));
            };
            const finishSuccess = (result: CategoryDemandForecastResultV1) => {
              if (terminal) return;
              terminal = true;
              clearTimeout(timer);
              signal.removeEventListener('abort', onAbort);
              resolve(result);
            };
            const onAbort = () => finishError('ANALYTICAL_MODEL_CANCELLED');
            signal.addEventListener('abort', onAbort, { once: true });
            const timer = setTimeout(() => {
              if (signal.aborted) finishError('ANALYTICAL_MODEL_CANCELLED');
              else finishError('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
            }, Math.max(0, deadline - Date.now()));

            predictorPromise.then((candidateForecast) => {
              if (terminal) return;
              if (signal.aborted) return finishError('ANALYTICAL_MODEL_CANCELLED');
              if (Date.now() >= deadline) return finishError('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
              if (!same(candidateForecast, forecastFixture(capturedSnapshot.input as UnknownRecord))) {
                return finishError('MODEL_PACK_OUTPUT_INVALID');
              }
              if (signal.aborted) return finishError('ANALYTICAL_MODEL_CANCELLED');
              if (Date.now() >= deadline) return finishError('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
              const readinessRecord = capturedReadiness as unknown as UnknownRecord;
              const manifest = readinessRecord.manifest as UnknownRecord;
              const provenance = manifest.provenance as UnknownRecord;
              finishSuccess(deepFreeze({
                forecast: clone(candidateForecast),
                provenance: {
                  run_id: runId,
                  package: clone(readinessRecord.package),
                  model: {
                    controller_release_decision_id: provenance.controller_release_decision_id,
                    mlflow_run_id: provenance.mlflow_run_id,
                    registered_model_name: provenance.registered_model_name,
                    registered_model_version: provenance.registered_model_version,
                  },
                  release_status: clone(readinessRecord.release_status),
                  input_snapshot: { snapshot_id: capturedSnapshot.snapshot_id, sha256: capturedSnapshot.sha256, confirmed_at: capturedSnapshot.confirmed_at, as_of_date: (capturedSnapshot.input as UnknownRecord).as_of_date },
                  runtime: clone(readinessRecord.runtime),
                  adapter: clone(readinessRecord.adapter),
                },
              }) as unknown as CategoryDemandForecastResultV1);
            }, () => {
              if (terminal) return;
              if (signal.aborted) finishError('ANALYTICAL_MODEL_CANCELLED');
              else if (Date.now() >= deadline) finishError('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
              else finishError('ANALYTICAL_MODEL_RUNTIME_FAILED');
            });
          });
        },
      });
      return run;
    },
  });
  return runtime;
}

export async function createDeterministicAnalyticalModelRuntimeHarness(): Promise<AnalyticalModelRuntimeHarness> {
  const controlled = createControlledPredictor();
  return Object.freeze({
    runtime: defineDeterministicRuntimeDouble({ binding: bindingFixture() as unknown as AnalyticalModelRuntimeBindingV1, predictor: controlled.predictor }),
    control: controlled.control,
  });
}

async function openHarnessRun(harness: AnalyticalModelRuntimeHarness, runId: string): Promise<AnalyticalModelRun> {
  const readiness = await harness.runtime.preflight({
    expected_package: expectedPackageFixture() as never,
    manifest_bytes: canonicalBytes(manifestFixture()),
    artifact_observation: artifactObservationFixture() as never,
    release_status: releaseStatusFixture(),
  });
  return harness.runtime.openRun({ run_id: runId, readiness, snapshot: snapshotFixture() as never });
}

const deadlineAt = (offsetMs: number) => new Date(FIXED_EPOCH_MS + offsetMs).toISOString();

export async function runAnalyticalModelRuntimeContract(
  createHarness: () => Promise<AnalyticalModelRuntimeHarness>,
): Promise<void> {
  mock.timers.enable({ apis: ['Date', 'setTimeout'], now: FIXED_EPOCH_MS });
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => { unhandled.push(reason); };
  process.on('unhandledRejection', onUnhandled);
  try {
    const harness = await createHarness();
    assert.deepEqual(Object.keys(harness), ['runtime', 'control']);
    assert.deepEqual(Object.keys(harness.runtime), ['preflight', 'openRun']);
    assert.deepEqual(Object.keys(harness.control), ['waitForIssue', 'fulfill', 'reject', 'issueCount']);
    assert.equal(harness.control.issueCount(), 0);

    const readiness = await harness.runtime.preflight({ expected_package: expectedPackageFixture() as never, manifest_bytes: canonicalBytes(manifestFixture()), artifact_observation: artifactObservationFixture() as never, release_status: releaseStatusFixture() });
    assert.deepEqual(Object.keys(readiness), ['package', 'manifest', 'model', 'release_status', 'runtime', 'adapter', 'dependencies', 'permissions']);
    assert.deepEqual(readiness.runtime, (bindingFixture() as UnknownRecord).runtime);
    assert.deepEqual(readiness.release_status, releaseStatusFixture());
    assert.equal(Object.isFrozen(readiness), true);
    assert.equal(harness.control.issueCount(), 0, 'preflight does not issue prediction');

    let revokedCall: Promise<unknown> | undefined;
    assert.doesNotThrow(() => {
      revokedCall = harness.runtime.preflight({ expected_package: expectedPackageFixture() as never, manifest_bytes: canonicalBytes(manifestFixture()), artifact_observation: artifactObservationFixture() as never, release_status: releaseStatusFixture('revoked') });
    });
    assert.ok(revokedCall instanceof Promise);
    await assert.rejects(revokedCall, (error) => assertError(error, 'MODEL_PACK_REVOKED'));

    const run = await harness.runtime.openRun({ run_id: 'driver-success-001', readiness, snapshot: snapshotFixture() as never });
    assert.deepEqual(Object.keys(run), ['predict']);
    assert.equal(harness.control.issueCount(), 0, 'openRun does not issue prediction');
    const signal = new AbortController();
    const success = run.predict({ cancellation_signal: signal.signal, deadline_at: deadlineAt(10_000) });
    const issued = await harness.control.waitForIssue();
    assert.deepEqual(Object.keys(issued), ['run_id', 'input', 'cancellation_signal', 'deadline_at']);
    assert.equal(issued.run_id, 'driver-success-001');
    assert.equal(issued.cancellation_signal, signal.signal);
    assert.equal(issued.deadline_at, deadlineAt(10_000));
    assert.deepEqual(issued.input, inputFixture());
    harness.control.fulfill(forecastFixture());
    const result = await success;
    assert.deepEqual(Object.keys(result), ['forecast', 'provenance']);
    assert.deepEqual(Object.keys(result.provenance), ['run_id', 'package', 'model', 'release_status', 'input_snapshot', 'runtime', 'adapter']);
    assert.deepEqual(result.forecast, forecastFixture());
    assert.deepEqual(result.provenance.release_status, releaseStatusFixture());
    await assert.rejects(run.predict({ cancellation_signal: new AbortController().signal, deadline_at: 'not-a-deadline' }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUN_ALREADY_STARTED'));
    assert.equal(harness.control.issueCount(), 1);

    const driftHarness = await createHarness();
    const driftReadiness = await driftHarness.runtime.preflight({ expected_package: expectedPackageFixture() as never, manifest_bytes: canonicalBytes(manifestFixture()), artifact_observation: artifactObservationFixture() as never, release_status: releaseStatusFixture() });
    const driftedSnapshot = clone(snapshotFixture()) as UnknownRecord;
    driftedSnapshot.sha256 = '0'.repeat(64);
    await assert.rejects(driftHarness.runtime.openRun({ run_id: 'driver-drift-001', readiness: driftReadiness, snapshot: driftedSnapshot as never }), (error) => assertError(error, 'ANALYTICAL_MODEL_INPUT_CHANGED'));
    assert.equal(driftHarness.control.issueCount(), 0);

    const cancelledBefore = await createHarness();
    const cancelledRun = await openHarnessRun(cancelledBefore, 'driver-cancelled-before');
    const cancelledSignal = new AbortController();
    cancelledSignal.abort();
    await assert.rejects(cancelledRun.predict({ cancellation_signal: cancelledSignal.signal, deadline_at: deadlineAt(0) }), (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
    assert.equal(cancelledBefore.control.issueCount(), 0);

    const expiredBefore = await createHarness();
    const expiredRun = await openHarnessRun(expiredBefore, 'driver-expired-before');
    await assert.rejects(expiredRun.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(0) }), (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED'));
    assert.equal(expiredBefore.control.issueCount(), 0);

    const postIssueCancel = await createHarness();
    const postIssueCancelRun = await openHarnessRun(postIssueCancel, 'driver-cancel-after');
    const postIssueAbort = new AbortController();
    const postIssueTerminal = postIssueCancelRun.predict({ cancellation_signal: postIssueAbort.signal, deadline_at: deadlineAt(1_000) });
    await postIssueCancel.control.waitForIssue();
    postIssueAbort.abort();
    await assert.rejects(postIssueTerminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
    postIssueCancel.control.fulfill(forecastFixture());

    const deadlineHarness = await createHarness();
    const deadlineRun = await openHarnessRun(deadlineHarness, 'driver-deadline-after');
    const deadlineAbort = new AbortController();
    const deadlineTerminal = deadlineRun.predict({ cancellation_signal: deadlineAbort.signal, deadline_at: deadlineAt(1_000) });
    await deadlineHarness.control.waitForIssue();
    mock.timers.tick(1_000);
    await assert.rejects(deadlineTerminal, (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED'));
    deadlineAbort.abort();
    deadlineHarness.control.reject({ raw: 'late deadline rejection' });

    mock.timers.setTime(FIXED_EPOCH_MS);
    const bothHarness = await createHarness();
    const bothRun = await openHarnessRun(bothHarness, 'driver-both-pending');
    const bothAbort = new AbortController();
    const bothTerminal = bothRun.predict({ cancellation_signal: bothAbort.signal, deadline_at: deadlineAt(1_000) });
    await bothHarness.control.waitForIssue();
    bothAbort.abort();
    mock.timers.tick(1_000);
    await assert.rejects(bothTerminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
    bothHarness.control.fulfill(forecastFixture());

    mock.timers.setTime(FIXED_EPOCH_MS);
    const rejectedHarness = await createHarness();
    const rejectedRun = await openHarnessRun(rejectedHarness, 'driver-rejection');
    const rejectedTerminal = rejectedRun.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) });
    await rejectedHarness.control.waitForIssue();
    rejectedHarness.control.reject({ credential: 'secret', cause: new Error('/private/raw/path') });
    await assert.rejects(rejectedTerminal, (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_FAILED'));

    const invalidHarness = await createHarness();
    const invalidRun = await openHarnessRun(invalidHarness, 'driver-invalid-output');
    const invalidTerminal = invalidRun.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) });
    await invalidHarness.control.waitForIssue();
    invalidHarness.control.fulfill({ ...forecastFixture(), provenance: { caller: true } });
    await assert.rejects(invalidTerminal, (error) => assertError(error, 'MODEL_PACK_OUTPUT_INVALID'));

    const finalCheckHarness = await createHarness();
    const finalCheckRun = await openHarnessRun(finalCheckHarness, 'driver-final-check');
    const finalCheckAbort = new AbortController();
    const finalCheckTerminal = finalCheckRun.predict({ cancellation_signal: finalCheckAbort.signal, deadline_at: deadlineAt(10_000) });
    await finalCheckHarness.control.waitForIssue();
    finalCheckHarness.control.fulfill(forecastFixture());
    finalCheckAbort.abort();
    await assert.rejects(finalCheckTerminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));

    const repeatedResults: CategoryDemandForecastResultV1[] = [];
    for (const runId of ['driver-repeat-001', 'driver-repeat-002']) {
      const repeatHarness = await createHarness();
      const repeatRun = await openHarnessRun(repeatHarness, runId);
      const repeatTerminal = repeatRun.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) });
      await repeatHarness.control.waitForIssue();
      repeatHarness.control.fulfill(forecastFixture());
      repeatedResults.push(await repeatTerminal);
    }
    assert.deepEqual(repeatedResults[0]?.forecast, repeatedResults[1]?.forecast);
    const firstProvenance = clone(repeatedResults[0]?.provenance) as unknown as UnknownRecord;
    const secondProvenance = clone(repeatedResults[1]?.provenance) as unknown as UnknownRecord;
    delete firstProvenance.run_id;
    delete secondProvenance.run_id;
    assert.deepEqual(firstProvenance, secondProvenance);
    assert.notEqual(repeatedResults[0]?.provenance.run_id, repeatedResults[1]?.provenance.run_id);

    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(unhandled, []);
  } finally {
    process.off('unhandledRejection', onUnhandled);
    mock.timers.reset();
  }
}
