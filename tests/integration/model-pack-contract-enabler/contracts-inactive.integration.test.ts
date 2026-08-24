import assert from 'node:assert/strict';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  artifactObservationFixture,
  assertFixtureHealth,
  bindingFixture,
  expectedPackageFixture,
  manifestFixture,
  releaseStatusFixture,
  snapshotFixture,
} from '../../fixtures/model-pack-contract-enabler/model-pack-fixtures.ts';
import {
  createDeterministicModelPackPackageDriver,
  runModelPackPackageContract,
} from '../../fixtures/model-pack-contract-enabler/model-pack-package-driver.ts';
import {
  createDeterministicAnalyticalModelRuntimeHarness,
  runAnalyticalModelRuntimeContract,
} from '../../fixtures/model-pack-contract-enabler/analytical-model-runtime-driver.ts';

const packageModuleUrl = new URL('../../../packages/contracts/model-pack.ts', import.meta.url);
const runtimeModuleUrl = new URL('../../../packages/ports/analytical-model-runtime.ts', import.meta.url);

type Observer = Readonly<{
  hit(detail?: unknown): never;
  count(): number;
  assertNone(): void;
}>;

function createObserver(name: string): Observer {
  const details: unknown[] = [];
  return Object.freeze({
    hit(detail?: unknown): never {
      details.push(detail);
      throw new Error(`forbidden-effect:${name}`);
    },
    count: () => details.length,
    assertNone: () => assert.equal(details.length, 0, `${name} observer saw a forbidden effect`),
  });
}

function effectObservers(): Readonly<Record<'fetch' | 'filesystem' | 'process' | 'predictor' | 'registration' | 'profile' | 'cli', Observer>> {
  return Object.freeze({
    fetch: createObserver('fetch'),
    filesystem: createObserver('filesystem'),
    process: createObserver('process'),
    predictor: createObserver('predictor'),
    registration: createObserver('registration'),
    profile: createObserver('profile'),
    cli: createObserver('cli'),
  });
}

test('TEST-MPC-009 helper health: fixtures, drivers, and every forbidden-effect observer detect injection independently', async (t) => {
  assertFixtureHealth();
  await runModelPackPackageContract(async () => createDeterministicModelPackPackageDriver());
  await runAnalyticalModelRuntimeContract(createDeterministicAnalyticalModelRuntimeHarness);

  const observers = effectObservers();
  for (const [name, observer] of Object.entries(observers).filter(([name]) => name !== 'filesystem')) {
    await t.test(`TEST-MPC-009 observer-health:${name}:injected-effect-is-detected`, () => {
      assert.throws(() => observer.hit('injected'), new RegExp(`forbidden-effect:${name}`));
      assert.equal(observer.count(), 1);
    });
  }
  for (const method of ['readFile', 'readFileSync:late-or-third-target', 'stat', 'statSync', 'existsSync', 'open', 'openSync:non-nested-or-late-or-third-target']) {
    await t.test(`TEST-MPC-009 observer-health:filesystem:${method}:injected-effect-is-detected`, () => {
      const observer = createObserver('filesystem');
      assert.throws(() => observer.hit({ method }), /forbidden-effect:filesystem/);
      assert.equal(observer.count(), 1);
    });
  }
});

test('TEST-MPC-009 production target: import, serialization, validation, preflight, and openRun remain inactive', async () => {
  const observers = effectObservers();
  let filesystemObserver = observers.filesystem;
  const originalFetch = globalThis.fetch;
  const require = createRequire(import.meta.url);
  const filesystem = require('node:fs') as Record<string, unknown>;
  const childProcess = require('node:child_process') as Record<string, unknown>;
  const filesystemMethods = ['readFile', 'readFileSync', 'stat', 'statSync', 'existsSync', 'open', 'openSync'] as const;
  const processMethods = ['spawn', 'spawnSync', 'exec', 'execFile', 'fork'] as const;
  const originalFilesystemMethods = new Map<string, unknown>();
  const originalProcessMethods = new Map<string, unknown>();
  for (const method of filesystemMethods) {
    originalFilesystemMethods.set(method, filesystem[method]);
    if (method !== 'readFileSync') filesystem[method] = (...args: unknown[]) => filesystemObserver.hit({ method, args });
  }
  for (const method of processMethods) {
    originalProcessMethods.set(method, childProcess[method]);
    childProcess[method] = (...args: unknown[]) => observers.process.hit({ method, args });
  }
  const allowedSourceReads = new Set([fileURLToPath(packageModuleUrl), fileURLToPath(runtimeModuleUrl)]);
  const observedReadFileSyncTargets = new Set<string>();
  const observedNestedOpenSyncTargets = new Set<string>();
  let sourceImportsPending = true;
  let nestedReadFileSyncTarget: string | undefined;
  const originalReadFileSync = originalFilesystemMethods.get('readFileSync') as (...args: unknown[]) => unknown;
  const originalOpenSync = originalFilesystemMethods.get('openSync') as (...args: unknown[]) => unknown;
  const approvedSourceTarget = (args: readonly unknown[]): string | undefined => {
    const requestedPath = args[0];
    return typeof requestedPath === 'string'
      ? resolve(requestedPath)
      : requestedPath instanceof URL ? fileURLToPath(requestedPath) : undefined;
  };
  filesystem.readFileSync = (...args: unknown[]) => {
    const resolvedTarget = approvedSourceTarget(args);
    if (sourceImportsPending && resolvedTarget !== undefined && allowedSourceReads.has(resolvedTarget)) {
      observedReadFileSyncTargets.add(resolvedTarget);
      nestedReadFileSyncTarget = resolvedTarget;
      try {
        return originalReadFileSync(...args);
      } finally {
        nestedReadFileSyncTarget = undefined;
      }
    }
    return filesystemObserver.hit({ method: 'readFileSync', args });
  };
  filesystem.openSync = (...args: unknown[]) => {
    const resolvedTarget = approvedSourceTarget(args);
    const stack = new Error().stack ?? '';
    const nestedUnderCapturedReadFileSync = stack.includes('at readFileSync (node:fs:440:35)');
    if (sourceImportsPending && resolvedTarget !== undefined && allowedSourceReads.has(resolvedTarget) && (nestedReadFileSyncTarget === resolvedTarget || nestedUnderCapturedReadFileSync)) {
      observedReadFileSyncTargets.add(resolvedTarget);
      observedNestedOpenSyncTargets.add(resolvedTarget);
      return originalOpenSync(...args);
    }
    return filesystemObserver.hit({ method: 'openSync', args });
  };
  const observedOpenSync = filesystem.openSync as (...args: unknown[]) => unknown;
  const observedReadFileSync = filesystem.readFileSync as (...args: unknown[]) => unknown;
  syncBuiltinESMExports();
  globalThis.fetch = ((...args: unknown[]) => observers.fetch.hit(args)) as typeof fetch;

  try {
    assert.throws(() => observedOpenSync(fileURLToPath(packageModuleUrl), 'r'), /forbidden-effect:filesystem/, 'non-nested openSync is forbidden during the import window');
    assert.equal(filesystemObserver.count(), 1);
    filesystemObserver = createObserver('filesystem');
    assert.throws(() => observedReadFileSync('/private/third-source.ts'), /forbidden-effect:filesystem/, 'third readFileSync target is forbidden during the import window');
    assert.equal(filesystemObserver.count(), 1);
    filesystemObserver = createObserver('filesystem');
    let contracts: Record<string, (value: unknown) => unknown>;
    let runtimeModule: Record<string, (value: unknown) => unknown>;
    try {
      [contracts, runtimeModule] = await Promise.all([
        import(packageModuleUrl.href) as Promise<Record<string, (value: unknown) => unknown>>,
        import(runtimeModuleUrl.href) as Promise<Record<string, (value: unknown) => unknown>>,
      ]);
    } finally {
      sourceImportsPending = false;
    }
    assert.deepEqual([...observedReadFileSyncTargets].sort(), [...allowedSourceReads].sort(), 'first imports read exactly the two approved readFileSync source files');
    assert.deepEqual([...observedNestedOpenSyncTargets].sort(), [...allowedSourceReads].sort(), 'first imports open exactly the two approved source files only while nested under readFileSync');
    assert.throws(() => observedOpenSync(fileURLToPath(packageModuleUrl), 'r'), /forbidden-effect:filesystem/, 'late same-target openSync is forbidden after imports settle');
    assert.equal(filesystemObserver.count(), 1);
    filesystemObserver = createObserver('filesystem');
    assert.deepEqual(Object.keys(contracts).sort(), ['MODEL_PACK_CONTRACT_VERSION', 'MODEL_PACK_ERROR_CODES', 'MODEL_PACK_IDENTITY', 'admitCategoryDemandForecast', 'admitCategoryDemandInput', 'admitModelPackManifest', 'admitModelPackReleaseInput', 'admitModelPackReleaseStatus', 'canonicalCategoryDemandInputBytes', 'modelPackError', 'serializeModelPackManifest', 'serializeModelPackReleaseInput']);
    assert.deepEqual(Object.keys(runtimeModule), ['defineAnalyticalModelRuntime']);
    for (const forbiddenExport of ['register', 'activate', 'profile', 'cli', 'install', 'fallback', 'registry']) {
      assert.equal(Object.keys(contracts).some((key) => key.toLowerCase().includes(forbiddenExport)), false);
      assert.equal(Object.keys(runtimeModule).some((key) => key.toLowerCase().includes(forbiddenExport)), false);
    }

    const manifestBytes = contracts.serializeModelPackManifest(manifestFixture()) as Uint8Array;
    contracts.admitModelPackManifest({ manifest_bytes: manifestBytes, artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() });
    const runtime = runtimeModule.defineAnalyticalModelRuntime({
      binding: bindingFixture(),
      predictor: async (request: unknown) => observers.predictor.hit(request),
    }) as { preflight(value: unknown): Promise<unknown>; openRun(value: unknown): Promise<unknown> };
    const readiness = await runtime.preflight({ expected_package: expectedPackageFixture(), manifest_bytes: manifestBytes, artifact_observation: artifactObservationFixture(), release_status: releaseStatusFixture() });
    await runtime.openRun({ run_id: 'run-inactive-001', readiness, snapshot: snapshotFixture() });

    observers.registration.assertNone();
    observers.profile.assertNone();
    observers.cli.assertNone();
    observers.fetch.assertNone();
    filesystemObserver.assertNone();
    observers.process.assertNone();
    observers.predictor.assertNone();
  } finally {
    globalThis.fetch = originalFetch;
    for (const method of filesystemMethods) filesystem[method] = originalFilesystemMethods.get(method);
    for (const method of processMethods) childProcess[method] = originalProcessMethods.get(method);
    syncBuiltinESMExports();
  }
});
