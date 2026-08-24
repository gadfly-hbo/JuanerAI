import { createHash } from 'node:crypto';

import {
  admitCategoryDemandForecast,
  admitCategoryDemandInput,
  admitModelPackManifest,
  admitModelPackReleaseStatus,
  canonicalCategoryDemandInputBytes,
  modelPackError,
  MODEL_PACK_ERROR_CODES,
  type ArtifactObservationV1,
  type CategoryDemandForecastResultV1,
  type CategoryDemandInputV1,
  type ConfirmedCategoryDemandSnapshotV1,
  type IdentityVersionV1,
  type ModelPackIdentityV1,
  type ModelPackManifestV1,
  type ModelPackPermissionsV1,
  type ModelPackReleaseStatusV1,
} from '../contracts/model-pack.ts';

export type AnalyticalModelRuntimeBindingV1 = Readonly<{ runtime: IdentityVersionV1; adapter: IdentityVersionV1; dependencies: readonly IdentityVersionV1[]; permissions: ModelPackPermissionsV1 }>;
export type AnalyticalModelPreflightInputV1 = Readonly<{ expected_package: ModelPackIdentityV1; manifest_bytes: Uint8Array; artifact_observation: ArtifactObservationV1; release_status: unknown }>;
export type AnalyticalModelReadinessV1 = Readonly<{ package: ModelPackIdentityV1; manifest: ModelPackManifestV1; model: Readonly<{ controller_release_decision_id: string; mlflow_run_id: string; registered_model_name: string; registered_model_version: string }>; release_status: ModelPackReleaseStatusV1; runtime: IdentityVersionV1; adapter: IdentityVersionV1; dependencies: readonly IdentityVersionV1[]; permissions: ModelPackPermissionsV1 }>;
export type AnalyticalModelOpenRunInputV1 = Readonly<{ run_id: string; readiness: AnalyticalModelReadinessV1; snapshot: ConfirmedCategoryDemandSnapshotV1 }>;
export type LocalCategoryDemandPredictionRequestV1 = Readonly<{ run_id: string; input: CategoryDemandInputV1; cancellation_signal: AbortSignal; deadline_at: string }>;
export type LocalCategoryDemandPredictor = (request: LocalCategoryDemandPredictionRequestV1) => Promise<unknown>;
export type AnalyticalModelRun = Readonly<{ predict(input: Readonly<{ cancellation_signal: AbortSignal; deadline_at: string }>): Promise<CategoryDemandForecastResultV1> }>;
export type AnalyticalModelRuntime = Readonly<{ preflight(input: AnalyticalModelPreflightInputV1): Promise<AnalyticalModelReadinessV1>; openRun(input: AnalyticalModelOpenRunInputV1): Promise<AnalyticalModelRun> }>;

type RecordValue = Record<string, unknown>;
const identityPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const sha = /^[0-9a-f]{64}$/;
const stableVersionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const runtimeCarriers = new WeakSet<object>();
const error = (code: Parameters<typeof modelPackError>[0]): never => { const carrier = modelPackError(code); runtimeCarriers.add(carrier); throw carrier; };
const exactKeys = (value: unknown, keys: readonly string[]): value is RecordValue => Boolean(value && typeof value === 'object' && !Array.isArray(value) && Reflect.ownKeys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
const detached = <T>(value: T): T => {
  const copy = structuredClone(value);
  const freeze = (candidate: unknown): void => { if (candidate && typeof candidate === 'object' && !Object.isFrozen(candidate)) { for (const child of Object.values(candidate as object)) freeze(child); Object.freeze(candidate); } };
  freeze(copy); return copy;
};
const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
const carrierCode = (reason: unknown): Parameters<typeof modelPackError>[0] | undefined => {
  try {
    if (!reason || typeof reason !== 'object' || !runtimeCarriers.has(reason)) return undefined;
    const name = Object.getOwnPropertyDescriptor(reason, 'name')?.value;
    const code = Object.getOwnPropertyDescriptor(reason, 'code')?.value;
    const message = Object.getOwnPropertyDescriptor(reason, 'message')?.value;
    return name === 'ModelPackContractError' && message === code && typeof code === 'string' && MODEL_PACK_ERROR_CODES.includes(code as Parameters<typeof modelPackError>[0]) ? code as Parameters<typeof modelPackError>[0] : undefined;
  } catch { return undefined; }
};
const packageCall = <T>(operation: () => T, fallback: Parameters<typeof modelPackError>[0]): T => {
  try { return operation(); } catch (reason) {
    const code = reason && typeof reason === 'object'
      ? (() => { try { const value = Object.getOwnPropertyDescriptor(reason, 'code')?.value; return typeof value === 'string' && MODEL_PACK_ERROR_CODES.includes(value as Parameters<typeof modelPackError>[0]) ? value as Parameters<typeof modelPackError>[0] : undefined; } catch { return undefined; } })()
      : undefined;
    return error(code ?? fallback);
  }
};
const validIdentityVersion = (candidate: unknown): candidate is IdentityVersionV1 => exactKeys(candidate, ['identity', 'version']) && typeof candidate.identity === 'string' && candidate.identity.length > 0 && candidate.identity.length <= 256 && candidate.identity.trim() === candidate.identity && !/[\s\\/@\x00-\x1f\x7f]/.test(candidate.identity) && candidate.identity !== '.' && candidate.identity !== '..' && !/^(latest|alias)$/i.test(candidate.identity) && typeof candidate.version === 'string' && stableVersionPattern.test(candidate.version);
const validPermissions = (candidate: unknown): candidate is ModelPackPermissionsV1 => exactKeys(candidate, ['data', 'network', 'external_data', 'mlflow_at_runtime', 'training_workspace_at_runtime', 'source_write', 'model_execution']) && candidate.data === 'local_only' && candidate.network === 'none' && candidate.external_data === 'none' && candidate.mlflow_at_runtime === 'none' && candidate.training_workspace_at_runtime === 'none' && candidate.source_write === 'forbidden' && candidate.model_execution === 'local_only';
const validBinding = (candidate: unknown): candidate is AnalyticalModelRuntimeBindingV1 => exactKeys(candidate, ['runtime', 'adapter', 'dependencies', 'permissions']) && validIdentityVersion(candidate.runtime) && validIdentityVersion(candidate.adapter) && Array.isArray(candidate.dependencies) && candidate.dependencies.every(validIdentityVersion) && validPermissions(candidate.permissions);
const validInstant = (value: unknown): value is string => typeof value === 'string' && instantPattern.test(value) && new Date(value).toISOString() === value;

export function defineAnalyticalModelRuntime(input: Readonly<{ binding: AnalyticalModelRuntimeBindingV1; predictor: LocalCategoryDemandPredictor }>): AnalyticalModelRuntime {
  try {
    if (!exactKeys(input, ['binding', 'predictor']) || !validBinding(input.binding) || typeof input.predictor !== 'function') return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
    const binding = detached(input.binding);
    const predictor = input.predictor;
    const readinesses = new WeakSet<object>();
  const preflight = async (candidate: AnalyticalModelPreflightInputV1): Promise<AnalyticalModelReadinessV1> => {
    try {
      if (!exactKeys(candidate, ['expected_package', 'manifest_bytes', 'artifact_observation', 'release_status']) || !(candidate.manifest_bytes instanceof Uint8Array)) return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      const manifestBytes = candidate.manifest_bytes; const artifactObservation = candidate.artifact_observation; const expectedPackage = candidate.expected_package; const releaseStatus = candidate.release_status;
      const manifest = packageCall(() => admitModelPackManifest({ manifest_bytes: manifestBytes, artifact_observation: artifactObservation, expected_package: expectedPackage }), 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      const expected = { identity: manifest.package.identity, version: manifest.package.version, artifact_sha256: manifest.package.artifact.sha256 } as ModelPackIdentityV1;
      const status = packageCall(() => admitModelPackReleaseStatus({ release_status: releaseStatus, expected_package: expectedPackage }), 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      if (!same(expected, expectedPackage)) return error('MODEL_PACK_IDENTITY_MISMATCH');
      if (status.state === 'revoked') return error('MODEL_PACK_REVOKED');
      if (!same(manifest.runtime.runtime, binding.runtime) || !same(manifest.runtime.dependencies, binding.dependencies)) return error('MODEL_PACK_RUNTIME_INCOMPATIBLE');
      if (!same(manifest.permissions, binding.permissions)) return error('MODEL_PACK_PERMISSION_DENIED');
      const readiness = detached({ package: expected, manifest, model: { controller_release_decision_id: manifest.provenance.controller_release_decision_id, mlflow_run_id: manifest.provenance.mlflow_run_id, registered_model_name: manifest.provenance.registered_model_name, registered_model_version: manifest.provenance.registered_model_version }, release_status: status, runtime: binding.runtime, adapter: binding.adapter, dependencies: binding.dependencies, permissions: binding.permissions });
      readinesses.add(readiness as object); return readiness;
    } catch (reason) { throw modelPackError(carrierCode(reason) ?? 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'); }
  };
  const openRun = async (candidate: AnalyticalModelOpenRunInputV1): Promise<AnalyticalModelRun> => {
    try {
      if (!exactKeys(candidate, ['run_id', 'readiness', 'snapshot']) || typeof candidate.run_id !== 'string' || !identityPattern.test(candidate.run_id) || !candidate.readiness || typeof candidate.readiness !== 'object' || !readinesses.has(candidate.readiness as object)) return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      const snapshot = candidate.snapshot;
      if (!exactKeys(snapshot, ['snapshot_id', 'confirmed_at', 'sha256', 'input']) || typeof snapshot.snapshot_id !== 'string' || !identityPattern.test(snapshot.snapshot_id) || !validInstant(snapshot.confirmed_at) || typeof snapshot.sha256 !== 'string' || !sha.test(snapshot.sha256)) return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      const snapshotInput = snapshot.input;
      const admittedInput = packageCall(() => admitCategoryDemandInput({ candidate: snapshotInput, manifest: candidate.readiness.manifest }), 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      const actualSha = createHash('sha256').update(packageCall(() => canonicalCategoryDemandInputBytes({ admitted_input: admittedInput, manifest: candidate.readiness.manifest }), 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE')).digest('hex');
      if (actualSha !== snapshot.sha256) return error('ANALYTICAL_MODEL_INPUT_CHANGED');
      const capturedReadiness = detached(candidate.readiness); const capturedSnapshot = detached({ snapshot_id: snapshot.snapshot_id, confirmed_at: snapshot.confirmed_at, sha256: snapshot.sha256, input: admittedInput }); const runId = candidate.run_id;
      let started = false;
      return Object.freeze({ predict: async (call: Readonly<{ cancellation_signal: AbortSignal; deadline_at: string }>): Promise<CategoryDemandForecastResultV1> => {
        if (started) return Promise.reject(modelPackError('ANALYTICAL_MODEL_RUN_ALREADY_STARTED'));
        started = true;
        try {
          if (!exactKeys(call, ['cancellation_signal', 'deadline_at']) || !(call.cancellation_signal instanceof AbortSignal) || !validInstant(call.deadline_at)) return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
          const deadline = Date.parse(call.deadline_at); const signal = call.cancellation_signal;
          if (signal.aborted) return error('ANALYTICAL_MODEL_CANCELLED');
          if (Date.now() >= deadline) return error('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
          return await executePrediction(predictor, runId, capturedReadiness, capturedSnapshot, signal, call.deadline_at, deadline);
        } catch (reason) { throw modelPackError(carrierCode(reason) ?? 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'); }
      } });
    } catch (reason) { throw modelPackError(carrierCode(reason) ?? 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'); }
  };
    return Object.freeze({ preflight, openRun });
  } catch { return error('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'); }
}

async function executePrediction(predictor: LocalCategoryDemandPredictor, runId: string, readiness: AnalyticalModelReadinessV1, snapshot: ConfirmedCategoryDemandSnapshotV1, signal: AbortSignal, deadlineAt: string, deadline: number): Promise<CategoryDemandForecastResultV1> {
  return new Promise<CategoryDemandForecastResultV1>((resolve, reject) => {
    let settled = false; let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (outcome: () => CategoryDemandForecastResultV1 | never): void => { if (settled) return; settled = true; if (timer) clearTimeout(timer); signal.removeEventListener('abort', abort); try { resolve(outcome()); } catch (reason) { reject(reason); } };
    const fail = (code: Parameters<typeof modelPackError>[0]): void => finish(() => error(code));
    const abort = (): void => fail('ANALYTICAL_MODEL_CANCELLED');
    signal.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => fail('ANALYTICAL_MODEL_DEADLINE_EXCEEDED'), Math.max(0, deadline - Date.now()));
    let prediction: Promise<unknown>;
    try { prediction = Promise.resolve(predictor(Object.freeze({ run_id: runId, input: snapshot.input, cancellation_signal: signal, deadline_at: deadlineAt }))); } catch { prediction = Promise.reject(undefined); }
    prediction.then((candidate) => {
      if (settled) return;
      if (signal.aborted) return fail('ANALYTICAL_MODEL_CANCELLED');
      if (Date.now() >= deadline) return fail('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
      try {
        const forecast = packageCall(() => admitCategoryDemandForecast({ candidate, manifest: readiness.manifest, admitted_input: snapshot.input }), 'MODEL_PACK_OUTPUT_INVALID');
        if (signal.aborted) return fail('ANALYTICAL_MODEL_CANCELLED');
        if (Date.now() >= deadline) return fail('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
        finish(() => detached({ forecast, provenance: { run_id: runId, package: readiness.package, model: readiness.model, release_status: readiness.release_status, input_snapshot: { snapshot_id: snapshot.snapshot_id, sha256: snapshot.sha256, confirmed_at: snapshot.confirmed_at, as_of_date: snapshot.input.as_of_date }, runtime: readiness.runtime, adapter: readiness.adapter } }));
      } catch (reason) { fail(carrierCode(reason) ?? 'ANALYTICAL_MODEL_RUNTIME_FAILED'); }
    }, () => {
      if (settled) return;
      if (signal.aborted) return fail('ANALYTICAL_MODEL_CANCELLED');
      if (Date.now() >= deadline) return fail('ANALYTICAL_MODEL_DEADLINE_EXCEEDED');
      fail('ANALYTICAL_MODEL_RUNTIME_FAILED');
    });
  });
}
