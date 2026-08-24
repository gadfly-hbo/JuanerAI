import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
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
  ConfirmedCategoryDemandSnapshotV1,
  IdentityVersionV1,
  ModelPackErrorCode,
  ModelPackPermissionsV1,
} from '../../../packages/contracts/model-pack.ts';

import {
  FIXED_EPOCH_MS,
  artifactObservationFixture,
  bindingFixture,
  clone,
  expectedPackageFixture,
  forecastFixture,
  hash,
  inputFixture,
  manifestFixture,
  releaseStatusFixture,
  snapshotFixture,
  type RecordValue,
} from '../../fixtures/model-pack-contract-enabler/model-pack-fixtures.ts';
import {
  createControlledPredictor,
  createDeterministicAnalyticalModelRuntimeHarness,
  runAnalyticalModelRuntimeContract,
  type AnalyticalModelRuntimeHarness,
} from '../../fixtures/model-pack-contract-enabler/analytical-model-runtime-driver.ts';

const runtimeModuleUrl = new URL('../../../packages/ports/analytical-model-runtime.ts', import.meta.url);
const packageModuleUrl = new URL('../../../packages/contracts/model-pack.ts', import.meta.url);

type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type Equal<Left, Right> = IsAny<Left> extends true ? true : IsAny<Right> extends true ? true :
  (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2) ?
    ((<Value>() => Value extends Right ? 1 : 2) extends (<Value>() => Value extends Left ? 1 : 2) ? true : false) : false;
type Assert<Value extends true> = Value;
type ExactKeys<Value, Keys extends PropertyKey> = string extends keyof Value ? true : Equal<keyof Value, Keys>;
type RuntimeSurface = typeof import('../../../packages/ports/analytical-model-runtime.ts');
type RuntimeSignatureAssertions = [
  Assert<ExactKeys<AnalyticalModelRuntimeBindingV1, 'runtime' | 'adapter' | 'dependencies' | 'permissions'>>,
  Assert<ExactKeys<AnalyticalModelPreflightInputV1, 'expected_package' | 'manifest_bytes' | 'artifact_observation' | 'release_status'>>,
  Assert<ExactKeys<AnalyticalModelReadinessV1, 'package' | 'manifest' | 'model' | 'release_status' | 'runtime' | 'adapter' | 'dependencies' | 'permissions'>>,
  Assert<ExactKeys<AnalyticalModelOpenRunInputV1, 'run_id' | 'readiness' | 'snapshot'>>,
  Assert<ExactKeys<LocalCategoryDemandPredictionRequestV1, 'run_id' | 'input' | 'cancellation_signal' | 'deadline_at'>>,
  Assert<Equal<AnalyticalModelRuntimeBindingV1['runtime'], IdentityVersionV1>>,
  Assert<Equal<AnalyticalModelRuntimeBindingV1['permissions'], ModelPackPermissionsV1>>,
  Assert<Equal<AnalyticalModelPreflightInputV1['release_status'], unknown>>,
  Assert<Equal<AnalyticalModelReadinessV1['permissions'], ModelPackPermissionsV1>>,
  Assert<Equal<AnalyticalModelOpenRunInputV1['snapshot'], ConfirmedCategoryDemandSnapshotV1>>,
  Assert<Equal<LocalCategoryDemandPredictor, (request: LocalCategoryDemandPredictionRequestV1) => Promise<unknown>>>,
  Assert<Equal<AnalyticalModelRun['predict'], (input: Readonly<{ cancellation_signal: AbortSignal; deadline_at: string }>) => Promise<CategoryDemandForecastResultV1>>>,
  Assert<Equal<AnalyticalModelRuntime['preflight'], (input: AnalyticalModelPreflightInputV1) => Promise<AnalyticalModelReadinessV1>>>,
  Assert<Equal<AnalyticalModelRuntime['openRun'], (input: AnalyticalModelOpenRunInputV1) => Promise<AnalyticalModelRun>>>,
  Assert<Equal<RuntimeSurface['defineAnalyticalModelRuntime'], (input: Readonly<{ binding: AnalyticalModelRuntimeBindingV1; predictor: LocalCategoryDemandPredictor }>) => AnalyticalModelRuntime>>,
];
void (0 as unknown as RuntimeSignatureAssertions);

type RuntimeModule = Readonly<{ defineAnalyticalModelRuntime(input: unknown): AnalyticalModelRuntime }>;
type ContractModule = Readonly<{
  serializeModelPackManifest(input: unknown): Uint8Array;
  modelPackError(code: ModelPackErrorCode): Error;
}>;

function assertError(error: unknown, code: ModelPackErrorCode): true {
  assert.equal(error instanceof Error, true);
  assert.equal((error as Error).name, 'ModelPackContractError');
  assert.equal((error as Error).message, code);
  assert.equal((error as { code?: unknown }).code, code);
  assert.deepEqual(Object.keys(error as object).sort(), ['code', 'name']);
  assert.equal('cause' in (error as object), false);
  const text = JSON.stringify(error);
  for (const forbidden of ['file:', '/private/', 'credential', 'secret', 'mlflow', 'stack', 'raw']) assert.equal(text.includes(forbidden), false);
  return true;
}

function assertPromiseCall<T>(call: () => Promise<T>): Promise<T> {
  let promise: Promise<T> | undefined;
  assert.doesNotThrow(() => { promise = call(); });
  assert.ok(promise instanceof Promise);
  return promise;
}

function spoofedOrdinaryError(code: ModelPackErrorCode): Error & Readonly<{ code: ModelPackErrorCode }> {
  const error = new Error(code) as Error & { code: ModelPackErrorCode };
  error.name = 'ModelPackContractError';
  Object.defineProperty(error, 'code', { value: code, enumerable: true });
  return error;
}

function deadlineAt(offsetMs: number): string {
  return new Date(FIXED_EPOCH_MS + offsetMs).toISOString();
}

function preflightInput(contracts: ContractModule, releaseStatus: unknown = releaseStatusFixture()): AnalyticalModelPreflightInputV1 {
  return {
    expected_package: expectedPackageFixture() as never,
    manifest_bytes: contracts.serializeModelPackManifest(manifestFixture()),
    artifact_observation: artifactObservationFixture() as never,
    release_status: releaseStatus,
  };
}

async function openRun(runtime: AnalyticalModelRuntime, contracts: ContractModule, runId: string, snapshot = snapshotFixture()): Promise<AnalyticalModelRun> {
  const readiness = await runtime.preflight(preflightInput(contracts));
  return runtime.openRun({ run_id: runId, readiness, snapshot: snapshot as never });
}

function createHarness(runtimeModule: RuntimeModule): AnalyticalModelRuntimeHarness {
  const controlled = createControlledPredictor();
  return Object.freeze({
    runtime: runtimeModule.defineAnalyticalModelRuntime({ binding: bindingFixture(), predictor: controlled.predictor }),
    control: controlled.control,
  });
}

async function withMockTime(t: TestContext, body: () => Promise<void>): Promise<void> {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: FIXED_EPOCH_MS });
  try {
    await body();
  } finally {
    t.mock.timers.reset();
  }
}

test('TEST-MPC-008 Runtime driver/double health: complete observable shared suite', async () => {
  await runAnalyticalModelRuntimeContract(createDeterministicAnalyticalModelRuntimeHarness);
});

test('TEST-MPC-005..007 production Runtime target and every independent mutation leaf', async (t) => {
  const runtimeModule = await import(runtimeModuleUrl.href) as RuntimeModule;
  const contracts = await import(packageModuleUrl.href) as ContractModule;

  await t.test('TEST-MPC-005 Runtime module exact one-export surface', () => {
    assert.deepEqual(Object.keys(runtimeModule), ['defineAnalyticalModelRuntime']);
  });

  const factoryCases: readonly Readonly<{ name: string; candidate: unknown }>[] = [
    { name: 'TEST-MPC-005 factory:missing-binding-key', candidate: { predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:missing-predictor-key', candidate: { binding: bindingFixture() } },
    { name: 'TEST-MPC-005 factory:extra-key', candidate: { binding: bindingFixture(), predictor: async () => forecastFixture(), fallback: true } },
    { name: 'TEST-MPC-005 factory:binding-wrong-type', candidate: { binding: 'runtime', predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:binding-wrong-keys', candidate: { binding: { runtime: (bindingFixture() as RecordValue).runtime }, predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:runtime-binding-wrong-type', candidate: { binding: { ...bindingFixture(), runtime: 'runtime' }, predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:adapter-binding-wrong-type', candidate: { binding: { ...bindingFixture(), adapter: 'adapter' }, predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:dependencies-binding-wrong-type', candidate: { binding: { ...bindingFixture(), dependencies: {} }, predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:permissions-binding-wrong-type', candidate: { binding: { ...bindingFixture(), permissions: [] }, predictor: async () => forecastFixture() } },
    { name: 'TEST-MPC-005 factory:predictor-not-function', candidate: { binding: bindingFixture(), predictor: 'not-a-function' } },
    { name: 'TEST-MPC-005 factory:throwing-binding-getter-is-sanitized', candidate: { get binding() { throw new Error('raw Runtime binding getter secret'); }, predictor: async () => forecastFixture() } },
  ];
  for (const entry of factoryCases) await t.test(entry.name, () => assert.throws(() => runtimeModule.defineAnalyticalModelRuntime(entry.candidate), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE')));

  const factoryBindingValueCases: readonly Readonly<{ name: string; mutate(binding: RecordValue): void }>[] = [
    { name: 'TEST-MPC-005 factory:runtime-identity-path-like', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'bad/path'; } },
    { name: 'TEST-MPC-005 factory:runtime-identity-at-sign', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'runtime@1'; } },
    { name: 'TEST-MPC-005 factory:runtime-identity-Cf-zero-width-is-incompatible', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'runtime\u200Bhidden'; } },
    { name: 'TEST-MPC-005 factory:runtime-identity-credential-like-is-incompatible', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'user:secret@runtime'; } },
    { name: 'TEST-MPC-005 factory:runtime-identity-latest-is-incompatible', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'latest'; } },
    { name: 'TEST-MPC-005 factory:runtime-identity-alias-is-incompatible', mutate: (binding) => { (binding.runtime as RecordValue).identity = 'alias'; } },
    { name: 'TEST-MPC-005 factory:runtime-version-leading-zero', mutate: (binding) => { (binding.runtime as RecordValue).version = '01.0.0'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-path-like', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'bad/path'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-at-sign', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'adapter@1'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-Cf-zero-width-is-incompatible', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'adapter\u200Bhidden'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-credential-like-is-incompatible', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'user:secret@adapter'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-latest-is-incompatible', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'latest'; } },
    { name: 'TEST-MPC-005 factory:adapter-identity-alias-is-incompatible', mutate: (binding) => { (binding.adapter as RecordValue).identity = 'alias'; } },
    { name: 'TEST-MPC-005 factory:adapter-version-leading-zero', mutate: (binding) => { (binding.adapter as RecordValue).version = '01.0.0'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-path-like', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'bad/path'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-at-sign', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'dependency@1'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-Cf-zero-width-is-incompatible', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'dependency\u200Bhidden'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-credential-like-is-incompatible', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'user:secret@dependency'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-latest-is-incompatible', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'latest'; } },
    { name: 'TEST-MPC-005 factory:dependency-identity-alias-is-incompatible', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = 'alias'; } },
    { name: 'TEST-MPC-005 factory:dependency-version-leading-zero', mutate: (binding) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).version = '01.0.0'; } },
    { name: 'TEST-MPC-005 factory:permission-network-widened', mutate: (binding) => { (binding.permissions as RecordValue).network = 'allowed'; } },
  ];
  for (const entry of factoryBindingValueCases) {
    await t.test(entry.name, () => {
      const controlled = createControlledPredictor();
      const binding = clone(bindingFixture());
      entry.mutate(binding);
      assert.throws(() => runtimeModule.defineAnalyticalModelRuntime({ binding: binding as never, predictor: controlled.predictor }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
      assert.equal(controlled.control.issueCount(), 0);
    });
  }

  const governedIdentityPositions: readonly Readonly<{ name: string; set(binding: RecordValue, identity: string): void }>[] = [
    { name: 'Runtime', set: (binding, identity) => { (binding.runtime as RecordValue).identity = identity; } },
    { name: 'Adapter', set: (binding, identity) => { (binding.adapter as RecordValue).identity = identity; } },
    { name: 'dependency', set: (binding, identity) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = identity; } },
  ];
  for (const entry of governedIdentityPositions) {
    await t.test(`TEST-MPC-005 factory:${entry.name}-identity-valid-governed-control-constructs-without-issue`, () => {
      const controlled = createControlledPredictor();
      const binding = clone(bindingFixture());
      entry.set(binding, `${entry.name.toLowerCase()}-controlled-identity`);
      assert.doesNotThrow(() => runtimeModule.defineAnalyticalModelRuntime({ binding: binding as never, predictor: controlled.predictor }));
      assert.equal(controlled.control.issueCount(), 0);
    });
    for (const identity of ['runtime identity', '.', '..']) {
      await t.test(`TEST-MPC-005 factory:${entry.name}-identity-${JSON.stringify(identity)}-is-incompatible-without-issue`, () => {
        const controlled = createControlledPredictor();
        const binding = clone(bindingFixture());
        entry.set(binding, identity);
        assert.throws(() => runtimeModule.defineAnalyticalModelRuntime({ binding: binding as never, predictor: controlled.predictor }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
        assert.equal(controlled.control.issueCount(), 0);
      });
    }
  }

  await t.test('TEST-MPC-005 factory:dependencies-non-enumerable-own-key-is-incompatible', () => {
    const controlled = createControlledPredictor();
    const binding = clone(bindingFixture());
    Object.defineProperty(binding.dependencies as object, 'unexpected_dependency', { value: true });
    assert.throws(() => runtimeModule.defineAnalyticalModelRuntime({ binding: binding as never, predictor: controlled.predictor }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
    assert.equal(controlled.control.issueCount(), 0);
  });

  await t.test('TEST-MPC-005 factory:Runtime-binding-identity-256-accepted-and-257-rejected-synchronously', () => {
    const accepted = clone(bindingFixture()); (accepted.runtime as RecordValue).identity = 'r'.repeat(256);
    assert.doesNotThrow(() => runtimeModule.defineAnalyticalModelRuntime({ binding: accepted as never, predictor: async () => forecastFixture() }));
    const rejected = clone(accepted); (rejected.runtime as RecordValue).identity = 'r'.repeat(257);
    assert.throws(() => runtimeModule.defineAnalyticalModelRuntime({ binding: rejected as never, predictor: async () => forecastFixture() }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
  });

  const scalarIdentityPositions: readonly Readonly<{ name: string; set(binding: RecordValue, identity: string): void }>[] = [
    { name: 'Runtime', set: (binding, identity) => { (binding.runtime as RecordValue).identity = identity; } },
    { name: 'Adapter', set: (binding, identity) => { (binding.adapter as RecordValue).identity = identity; } },
    { name: 'dependency', set: (binding, identity) => { ((binding.dependencies as RecordValue[])[0] as RecordValue).identity = identity; } },
  ];
  for (const entry of scalarIdentityPositions) {
    await t.test(`TEST-MPC-005 factory:${entry.name}-identity-200-and-256-supplementary-scalars-accepted-257-rejected-synchronously`, () => {
      const controlled = createControlledPredictor();
      for (const count of [200, 256]) {
        const accepted = clone(bindingFixture());
        entry.set(accepted, '\u{1F642}'.repeat(count));
        assert.doesNotThrow(() => runtimeModule.defineAnalyticalModelRuntime({ binding: accepted as never, predictor: controlled.predictor }));
      }
      const rejected = clone(bindingFixture());
      entry.set(rejected, '\u{1F642}'.repeat(257));
      assert.throws(() => runtimeModule.defineAnalyticalModelRuntime({ binding: rejected as never, predictor: controlled.predictor }), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
      assert.equal(controlled.control.issueCount(), 0);
    });
  }

  await t.test('TEST-MPC-005 factory:detached-immutable-binding-and-no-construction-issue', async () => {
    const source = clone(bindingFixture());
    const controlled = createControlledPredictor();
    const runtime = runtimeModule.defineAnalyticalModelRuntime({ binding: source, predictor: controlled.predictor });
    (source.runtime as RecordValue).identity = 'spoofed-after-construction';
    const readiness = await runtime.preflight(preflightInput(contracts));
    assert.deepEqual(readiness.runtime, (bindingFixture() as RecordValue).runtime);
    assert.equal(Object.isFrozen(readiness), true);
    assert.equal(controlled.control.issueCount(), 0);
  });

  const preflightShapeCases: readonly Readonly<{ name: string; mutate(value: RecordValue): unknown; code: ModelPackErrorCode }>[] = [
    { name: 'TEST-MPC-005 preflight:wrong-Port-keys-missing-release-status', mutate: (v) => { delete v.release_status; return v; }, code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:wrong-Port-keys-extra-runtime-echo', mutate: (v) => ({ ...v, runtime: (bindingFixture() as RecordValue).runtime }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:wrong-Port-keys-extra-adapter-echo', mutate: (v) => ({ ...v, adapter: (bindingFixture() as RecordValue).adapter }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:wrong-Port-keys-extra-dependencies-echo', mutate: (v) => ({ ...v, dependencies: (bindingFixture() as RecordValue).dependencies }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:wrong-Port-keys-extra-permissions-echo', mutate: (v) => ({ ...v, permissions: (bindingFixture() as RecordValue).permissions }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:malformed-status', mutate: (v) => ({ ...v, release_status: { state: 'released' } }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-005 preflight:status-package-identity-conflict', mutate: (v) => ({ ...v, release_status: { ...releaseStatusFixture(), package: { ...expectedPackageFixture(), identity: 'other.package' } } }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-005 preflight:status-package-version-conflict', mutate: (v) => ({ ...v, release_status: { ...releaseStatusFixture(), package: { ...expectedPackageFixture(), version: '9.9.9' } } }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-005 preflight:status-Artifact-conflict', mutate: (v) => ({ ...v, release_status: { ...releaseStatusFixture(), package: { ...expectedPackageFixture(), artifact_sha256: hash('0') } } }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-005 preflight:revoked-status', mutate: (v) => ({ ...v, release_status: releaseStatusFixture('revoked') }), code: 'MODEL_PACK_REVOKED' },
  ];
  for (const entry of preflightShapeCases) {
    await t.test(entry.name, async () => {
      const harness = createHarness(runtimeModule);
      const candidate = entry.mutate(clone(preflightInput(contracts)) as unknown as RecordValue);
      await assert.rejects(assertPromiseCall(() => harness.runtime.preflight(candidate as never)), (error) => assertError(error, entry.code));
      assert.equal(harness.control.issueCount(), 0);
    });
  }

  await t.test('TEST-MPC-005 preflight:spoofed-named-ordinary-Error-accessor-is-sanitized', async () => {
    const harness = createHarness(runtimeModule);
    const candidate = { ...preflightInput(contracts), get manifest_bytes(): never { const spoofed = new Error('raw preflight accessor secret'); spoofed.name = 'ModelPackContractError'; throw spoofed; } };
    await assert.rejects(assertPromiseCall(() => harness.runtime.preflight(candidate as never)), (error) => {
      assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE');
      assert.equal((error as Error).message.includes('raw preflight accessor secret'), false);
      return true;
    });
    assert.equal(harness.control.issueCount(), 0);
  });

  await t.test('TEST-MPC-005 preflight:manifest-bytes-getter-spoofed-ordinary-Error-is-sanitized', async () => {
    const harness = createHarness(runtimeModule);
    const candidate = { ...preflightInput(contracts), get manifest_bytes(): never { throw spoofedOrdinaryError('MODEL_PACK_REVOKED'); } };
    await assert.rejects(assertPromiseCall(() => harness.runtime.preflight(candidate as never)), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
    assert.equal(harness.control.issueCount(), 0);
  });

  await t.test('TEST-MPC-005 preflight:artifact-observation-public-modelPackError-getter-is-sanitized-to-owning-Artifact-mismatch', async () => {
    const harness = createHarness(runtimeModule);
    const artifactObservation = clone(artifactObservationFixture());
    Object.defineProperty(artifactObservation, 'artifact_uri', {
      enumerable: true,
      get() { throw contracts.modelPackError('ANALYTICAL_MODEL_CANCELLED'); },
    });
    const candidate = { ...preflightInput(contracts), artifact_observation: artifactObservation };
    await assert.rejects(assertPromiseCall(() => harness.runtime.preflight(candidate as never)), (error) => assertError(error, 'MODEL_PACK_ARTIFACT_MISMATCH'));
    assert.equal(harness.control.issueCount(), 0);
  });

  const bindingCases: readonly Readonly<{ name: string; mutate(value: RecordValue): void; code: ModelPackErrorCode }>[] = [
    { name: 'TEST-MPC-005 preflight:manifest-runtime-identity-unequal', mutate: (m) => { ((m.runtime as RecordValue).runtime as RecordValue).identity = 'other-runtime'; }, code: 'MODEL_PACK_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:manifest-runtime-version-unequal', mutate: (m) => { ((m.runtime as RecordValue).runtime as RecordValue).version = '9.9.9'; }, code: 'MODEL_PACK_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:manifest-dependency-identity-unequal', mutate: (m) => { (((m.runtime as RecordValue).dependencies as RecordValue[])[0]).identity = 'other-dependency'; }, code: 'MODEL_PACK_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 preflight:manifest-dependency-version-unequal', mutate: (m) => { (((m.runtime as RecordValue).dependencies as RecordValue[])[0]).version = '9.9.9'; }, code: 'MODEL_PACK_RUNTIME_INCOMPATIBLE' },
  ];
  for (const entry of bindingCases) {
    await t.test(entry.name, async () => {
      const harness = createHarness(runtimeModule);
      const manifest = clone(manifestFixture());
      entry.mutate(manifest);
      const candidate = { ...preflightInput(contracts), manifest_bytes: contracts.serializeModelPackManifest(manifest) };
      await assert.rejects(assertPromiseCall(() => harness.runtime.preflight(candidate)), (error) => assertError(error, entry.code));
      assert.equal(harness.control.issueCount(), 0);
    });
  }

  await t.test('TEST-MPC-005 readiness:exact-keys-captured-values-deeply-immutable-and-no-leak', async () => {
    const harness = createHarness(runtimeModule);
    const readiness = await harness.runtime.preflight(preflightInput(contracts));
    assert.deepEqual(Object.keys(readiness), ['package', 'manifest', 'model', 'release_status', 'runtime', 'adapter', 'dependencies', 'permissions']);
    assert.deepEqual(Object.keys(readiness.model), ['controller_release_decision_id', 'mlflow_run_id', 'registered_model_name', 'registered_model_version']);
    assert.deepEqual(readiness.package, expectedPackageFixture());
    assert.deepEqual(readiness.release_status, releaseStatusFixture());
    assert.deepEqual(readiness.runtime, (bindingFixture() as RecordValue).runtime);
    assert.deepEqual(readiness.adapter, (bindingFixture() as RecordValue).adapter);
    assert.equal(JSON.stringify(readiness).includes('artifact_uri'), false);
    assert.throws(() => { (readiness.package as { version: string }).version = 'spoofed'; }, TypeError);
  });

  const openRunCases: readonly Readonly<{ name: string; mutate(value: RecordValue): unknown; code: ModelPackErrorCode }>[] = [
    { name: 'TEST-MPC-005 openRun:wrong-Run-keys-missing-run-id', mutate: (v) => { delete v.run_id; return v; }, code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 openRun:wrong-Run-keys-extra-binding', mutate: (v) => ({ ...v, binding: bindingFixture() }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 openRun:invalid-run-id', mutate: (v) => ({ ...v, run_id: '../run' }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 openRun:spoofed-readiness', mutate: (v) => ({ ...v, readiness: clone(v.readiness) }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 openRun:leaking-readiness-field', mutate: (v) => ({ ...v, readiness: { ...(v.readiness as RecordValue), mlflow_uri: 'file:///private/model' } }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
    { name: 'TEST-MPC-005 openRun:snapshot-SHA-drift', mutate: (v) => ({ ...v, snapshot: { ...(v.snapshot as RecordValue), sha256: hash('0') } }), code: 'ANALYTICAL_MODEL_INPUT_CHANGED' },
    { name: 'TEST-MPC-005 openRun:snapshot-wrong-keys', mutate: (v) => ({ ...v, snapshot: { ...(v.snapshot as RecordValue), source_path: '/private/data.csv' } }), code: 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' },
  ];
  for (const entry of openRunCases) {
    await t.test(entry.name, async () => {
      const harness = createHarness(runtimeModule);
      const readiness = await harness.runtime.preflight(preflightInput(contracts));
      const candidate = entry.mutate({ run_id: 'open-case-001', readiness, snapshot: snapshotFixture() } as RecordValue);
      await assert.rejects(assertPromiseCall(() => harness.runtime.openRun(candidate as never)), (error) => assertError(error, entry.code));
      assert.equal(harness.control.issueCount(), 0, 'openRun failure has no execution effect');
    });
  }

  await t.test('TEST-MPC-005 openRun:run-id-getter-spoofed-ordinary-Error-is-sanitized', async () => {
    const harness = createHarness(runtimeModule);
    const readiness = await harness.runtime.preflight(preflightInput(contracts));
    const candidate = { readiness, snapshot: snapshotFixture(), get run_id(): never { throw spoofedOrdinaryError('MODEL_PACK_REVOKED'); } };
    await assert.rejects(assertPromiseCall(() => harness.runtime.openRun(candidate as never)), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
    assert.equal(harness.control.issueCount(), 0);
  });

  await t.test('TEST-MPC-005 openRun:valid-captures-snapshot-and-causes-zero-issue', async () => {
    const harness = createHarness(runtimeModule);
    const run = await openRun(harness.runtime, contracts, 'open-valid-001');
    assert.deepEqual(Object.keys(run), ['predict']);
    assert.equal(harness.control.issueCount(), 0);
  });

  await t.test('TEST-MPC-005 openRun:different-Runtime-instance-readiness-binding-is-rejected', async () => {
    const first = createHarness(runtimeModule);
    const second = createHarness(runtimeModule);
    const foreignReadiness = await first.runtime.preflight(preflightInput(contracts));
    await assert.rejects(assertPromiseCall(() => second.runtime.openRun({ run_id: 'foreign-binding-001', readiness: foreignReadiness, snapshot: snapshotFixture() as never })), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
    assert.equal(first.control.issueCount(), 0);
    assert.equal(second.control.issueCount(), 0);
  });

  const predictShapeCases: readonly Readonly<{ name: string; candidate: unknown }>[] = [
    { name: 'TEST-MPC-005 predict:wrong-keys-missing-signal', candidate: { deadline_at: deadlineAt(1_000) } },
    { name: 'TEST-MPC-005 predict:wrong-keys-missing-deadline', candidate: { cancellation_signal: new AbortController().signal } },
    { name: 'TEST-MPC-005 predict:wrong-keys-extra-retry', candidate: { cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(1_000), retry: 1 } },
    { name: 'TEST-MPC-005 predict:wrong-signal-type', candidate: { cancellation_signal: {}, deadline_at: deadlineAt(1_000) } },
    { name: 'TEST-MPC-005 predict:invalid-deadline', candidate: { cancellation_signal: new AbortController().signal, deadline_at: '2026-08-24' } },
    { name: 'TEST-MPC-005 predict:non-UTC-deadline', candidate: { cancellation_signal: new AbortController().signal, deadline_at: '2026-08-24T08:00:01.000+08:00' } },
  ];
  for (const entry of predictShapeCases) {
    await t.test(entry.name, async (subtest) => withMockTime(subtest, async () => {
      const harness = createHarness(runtimeModule);
      const run = await openRun(harness.runtime, contracts, 'predict-shape-001');
      await assert.rejects(assertPromiseCall(() => run.predict(entry.candidate as never)), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
      assert.equal(harness.control.issueCount(), 0);
    }));
  }

  await t.test('TEST-MPC-005 predict:deadline-getter-spoofed-ordinary-Error-is-sanitized', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule);
    const run = await openRun(harness.runtime, contracts, 'predict-spoofed-deadline-001');
    const candidate = { cancellation_signal: new AbortController().signal, get deadline_at(): never { throw spoofedOrdinaryError('MODEL_PACK_REVOKED'); } };
    await assert.rejects(assertPromiseCall(() => run.predict(candidate as never)), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'));
    assert.equal(harness.control.issueCount(), 0);
  }));

  await t.test('TEST-MPC-005 predict:second-concurrent-call-loses-before-argument-validation-and-only-one-issue', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule);
    const run = await openRun(harness.runtime, contracts, 'one-shot-001');
    const first = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) });
    await harness.control.waitForIssue();
    await assert.rejects(assertPromiseCall(() => run.predict({ cancellation_signal: {} as AbortSignal, deadline_at: 'invalid' })), (error) => assertError(error, 'ANALYTICAL_MODEL_RUN_ALREADY_STARTED'));
    assert.equal(harness.control.issueCount(), 1);
    harness.control.fulfill(forecastFixture());
    await first;
  }));

  await t.test('TEST-MPC-005 predict:exact-request-same-signal-deadline-captured-input-and-valid-forecast-only', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule);
    const run = await openRun(harness.runtime, contracts, 'request-001');
    const abort = new AbortController();
    const deadline = deadlineAt(10_000);
    const prediction = run.predict({ cancellation_signal: abort.signal, deadline_at: deadline });
    const issued = await harness.control.waitForIssue();
    assert.deepEqual(Object.keys(issued), ['run_id', 'input', 'cancellation_signal', 'deadline_at']);
    assert.equal(issued.cancellation_signal, abort.signal);
    assert.equal(issued.deadline_at, deadline);
    assert.deepEqual(issued.input, inputFixture());
    harness.control.fulfill(forecastFixture());
    await prediction;
  }));

  await runTerminalCases(t, runtimeModule, contracts);
  await runResultCases(t, runtimeModule, contracts);

  await t.test('TEST-MPC-008 shared Runtime suite runs unchanged against production factory harness', async () => {
    await runAnalyticalModelRuntimeContract(async () => createHarness(runtimeModule));
  });
});

async function runTerminalCases(t: TestContext, runtimeModule: RuntimeModule, contracts: ContractModule): Promise<void> {
  await t.test('TEST-MPC-006 terminal:already-cancelled-plus-expired-cancellation-wins-without-issue', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-001'); const abort = new AbortController(); abort.abort();
    await assert.rejects(run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(0) }), (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED')); assert.equal(harness.control.issueCount(), 0);
  }));
  await t.test('TEST-MPC-006 terminal:expired-only-before-issue', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-002');
    await assert.rejects(run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(0) }), (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED')); assert.equal(harness.control.issueCount(), 0);
  }));
  await t.test('TEST-MPC-006 terminal:cancel-after-issue', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-003'); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); abort.abort();
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED')); assert.equal(harness.control.issueCount(), 1); harness.control.fulfill(forecastFixture());
  }));
  await t.test('TEST-MPC-006 terminal:deadline-after-issue-published-before-later-abort', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-004'); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); subtest.mock.timers.tick(1_000);
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED')); abort.abort(); harness.control.fulfill(forecastFixture());
  }));
  await t.test('TEST-MPC-006 terminal:cancel-and-deadline-both-pending-cancel-wins', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-005'); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); abort.abort(); subtest.mock.timers.tick(1_000);
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED')); harness.control.reject('late');
  }));
  await t.test('TEST-MPC-006 terminal:Adapter-rejection-wins-and-is-sanitized', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-006'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.reject({ credential: 'secret', uri: 'file:///private/model', cause: new Error('raw reason') });
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_FAILED'));
  }));
  await t.test('TEST-MPC-006 terminal:Adapter-synchronous-throw-wins-and-is-Promise-rejection', async (subtest) => withMockTime(subtest, async () => {
    const runtime = runtimeModule.defineAnalyticalModelRuntime({ binding: bindingFixture(), predictor: () => { throw new Error('raw synchronous secret'); } }); const run = await openRun(runtime, contracts, 'terminal-007');
    await assert.rejects(assertPromiseCall(() => run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) })), (error) => assertError(error, 'ANALYTICAL_MODEL_RUNTIME_FAILED'));
  }));
  await t.test('TEST-MPC-006 terminal:Adapter-rejection-loses-to-final-check-cancel', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-008'); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.reject(new Error('raw')); abort.abort();
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
  }));
  await t.test('TEST-MPC-006 terminal:Adapter-rejection-loses-to-final-check-deadline', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-009'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); harness.control.reject(new Error('raw')); subtest.mock.timers.tick(1_000);
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED'));
  }));
  await t.test('TEST-MPC-006 terminal:fulfillment-during-final-check-cancel-wins', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-010'); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill(forecastFixture()); abort.abort();
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
  }));
  await t.test('TEST-MPC-006 terminal:fulfillment-during-final-check-deadline-wins', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'terminal-011'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); harness.control.fulfill(forecastFixture()); subtest.mock.timers.tick(1_000);
    await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED'));
  }));
  for (const settlement of ['fulfill', 'reject'] as const) {
    await t.test(`TEST-MPC-006 terminal:late-${settlement}-is-consumed-with-no-unhandled-settlement`, async (subtest) => withMockTime(subtest, async () => {
      const unhandled: unknown[] = []; const listener = (reason: unknown) => { unhandled.push(reason); }; process.on('unhandledRejection', listener);
      try {
        const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, `terminal-late-${settlement}`); const abort = new AbortController(); const terminal = run.predict({ cancellation_signal: abort.signal, deadline_at: deadlineAt(1_000) }); await harness.control.waitForIssue(); abort.abort();
        await assert.rejects(terminal, (error) => assertError(error, 'ANALYTICAL_MODEL_CANCELLED'));
        if (settlement === 'fulfill') harness.control.fulfill(forecastFixture()); else harness.control.reject(new Error('late raw secret'));
        await Promise.resolve(); await Promise.resolve(); assert.deepEqual(unhandled, []); assert.equal(harness.control.issueCount(), 1);
      } finally { process.off('unhandledRejection', listener); }
    }));
  }
}

async function runResultCases(t: TestContext, runtimeModule: RuntimeModule, contracts: ContractModule): Promise<void> {
  await t.test('TEST-MPC-007 result:invalid-fulfilled-output-is-OUTPUT_INVALID-never-Runtime-failed', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'result-invalid'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill({ contract_version: '1.0', predictions: [] });
    await assert.rejects(terminal, (error) => assertError(error, 'MODEL_PACK_OUTPUT_INVALID'));
  }));
  await t.test('TEST-MPC-007 result:predictor-provenance-is-independently-OUTPUT_INVALID', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'result-injected'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill({ ...forecastFixture(), provenance: { attacker: true } });
    await assert.rejects(terminal, (error) => assertError(error, 'MODEL_PACK_OUTPUT_INVALID'));
  }));
  await t.test('TEST-MPC-007 result:fulfilled-forecast-Proxy-ownKeys-spoofed-ordinary-Error-is-OUTPUT_INVALID', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'result-spoofed-forecast'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill(new Proxy(forecastFixture(), { ownKeys() { throw spoofedOrdinaryError('MODEL_PACK_REVOKED'); } }));
    await assert.rejects(terminal, (error) => assertError(error, 'MODEL_PACK_OUTPUT_INVALID'));
  }));
  await t.test('TEST-MPC-007 result:exact-closed-Runtime-owned-provenance-captured-values-and-forbidden-content', async (subtest) => withMockTime(subtest, async () => {
    const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, 'result-exact'); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill(forecastFixture()); const result = await terminal;
    assert.deepEqual(Object.keys(result), ['forecast', 'provenance']);
    assert.deepEqual(Object.keys(result.provenance), ['run_id', 'package', 'model', 'release_status', 'input_snapshot', 'runtime', 'adapter']);
    assert.deepEqual(Object.keys(result.provenance.model), ['controller_release_decision_id', 'mlflow_run_id', 'registered_model_name', 'registered_model_version']);
    assert.deepEqual(Object.keys(result.provenance.input_snapshot), ['snapshot_id', 'sha256', 'confirmed_at', 'as_of_date']);
    assert.equal(result.provenance.run_id, 'result-exact');
    assert.deepEqual(result.provenance.package, expectedPackageFixture());
    assert.deepEqual(result.provenance.release_status, releaseStatusFixture());
    assert.deepEqual(result.provenance.runtime, (bindingFixture() as RecordValue).runtime);
    assert.deepEqual(result.provenance.adapter, (bindingFixture() as RecordValue).adapter);
    const text = JSON.stringify(result);
    for (const forbidden of ['artifact_uri', 'file:', '/private/', 'provider', 'sdk_error', 'tool', 'session', 'credential', 'generated_at', 'decision_claim', 'action']) assert.equal(text.toLowerCase().includes(forbidden), false);
  }));
  await t.test('TEST-MPC-007 determinism:separate-runs-identical-forecast-only-run-id-differs', async (subtest) => withMockTime(subtest, async () => {
    const results: CategoryDemandForecastResultV1[] = [];
    for (const runId of ['repeat-001', 'repeat-002']) {
      const harness = createHarness(runtimeModule); const run = await openRun(harness.runtime, contracts, runId); const terminal = run.predict({ cancellation_signal: new AbortController().signal, deadline_at: deadlineAt(10_000) }); await harness.control.waitForIssue(); harness.control.fulfill(forecastFixture()); results.push(await terminal);
    }
    assert.deepEqual(results[0]?.forecast, results[1]?.forecast);
    const left = clone(results[0]?.provenance) as unknown as RecordValue; const right = clone(results[1]?.provenance) as unknown as RecordValue; delete left.run_id; delete right.run_id; assert.deepEqual(left, right); assert.notEqual(results[0]?.provenance.run_id, results[1]?.provenance.run_id);
  }));
}
