import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import type {
  ArtifactLocationVerificationV1,
  ArtifactObservationV1,
  CategoryDemandForecastProvenanceV1,
  CategoryDemandForecastResultV1,
  CategoryDemandForecastV1,
  CategoryDemandHistoryRowV1,
  CategoryDemandInputV1,
  CategoryDemandPredictionRowV1,
  ConfirmedCategoryDemandSnapshotV1,
  IdentityVersionV1,
  ModelPackArtifactV1,
  ModelPackContractError,
  ModelPackErrorCode,
  ModelPackIdentityV1,
  ModelPackManifestV1,
  ModelPackPermissionsV1,
  ModelPackReleaseInputV1,
  ModelPackReleaseStatusV1,
  PredictionInterval80V1,
} from '../../../packages/contracts/model-pack.ts';

import {
  artifactObservationFixture,
  assertFixtureHealth,
  canonicalBytes,
  categoryOrder,
  clone,
  dateAt,
  expectedPackageFixture,
  forecastFixture,
  hash,
  inputFixture,
  manifestFixture,
  releaseInputFixture,
  releaseStatusFixture,
  type RecordValue,
} from '../../fixtures/model-pack-contract-enabler/model-pack-fixtures.ts';
import {
  createDeterministicModelPackPackageDriver,
  runModelPackPackageContract,
} from '../../fixtures/model-pack-contract-enabler/model-pack-package-driver.ts';

const packageModuleUrl = new URL('../../../packages/contracts/model-pack.ts', import.meta.url);

type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type Equal<Left, Right> = IsAny<Left> extends true ? true : IsAny<Right> extends true ? true :
  (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2) ?
    ((<Value>() => Value extends Right ? 1 : 2) extends (<Value>() => Value extends Left ? 1 : 2) ? true : false) : false;
type Assert<Value extends true> = Value;
type ExactKeys<Value, Keys extends PropertyKey> = string extends keyof Value ? true : Equal<keyof Value, Keys>;
type PackageSurface = typeof import('../../../packages/contracts/model-pack.ts');
type PackageSignatureAssertions = [
  Assert<Equal<PackageSurface['MODEL_PACK_IDENTITY'], 'juanerai.sales-demand-forecast'>>,
  Assert<Equal<PackageSurface['MODEL_PACK_CONTRACT_VERSION'], '1.0'>>,
  Assert<Equal<PackageSurface['MODEL_PACK_ERROR_CODES'], readonly ModelPackErrorCode[]>>,
  Assert<Equal<PackageSurface['serializeModelPackManifest'], (manifest: ModelPackManifestV1) => Uint8Array>>,
  Assert<Equal<PackageSurface['admitModelPackManifest'], (input: Readonly<{ manifest_bytes: Uint8Array; artifact_observation: ArtifactObservationV1; expected_package: ModelPackIdentityV1 }>) => ModelPackManifestV1>>,
  Assert<Equal<PackageSurface['serializeModelPackReleaseInput'], (release_input: ModelPackReleaseInputV1) => Uint8Array>>,
  Assert<Equal<PackageSurface['admitModelPackReleaseInput'], (input: Readonly<{ release_input_bytes: Uint8Array; artifact_observation: ArtifactObservationV1; expected_package: ModelPackIdentityV1 }>) => ModelPackReleaseInputV1>>,
  Assert<Equal<PackageSurface['admitModelPackReleaseStatus'], (input: Readonly<{ release_status: unknown; expected_package: ModelPackIdentityV1 }>) => ModelPackReleaseStatusV1>>,
  Assert<Equal<PackageSurface['admitCategoryDemandInput'], (input: Readonly<{ candidate: unknown; manifest: ModelPackManifestV1 }>) => CategoryDemandInputV1>>,
  Assert<Equal<PackageSurface['canonicalCategoryDemandInputBytes'], (input: Readonly<{ admitted_input: CategoryDemandInputV1; manifest: ModelPackManifestV1 }>) => Uint8Array>>,
  Assert<Equal<PackageSurface['admitCategoryDemandForecast'], (input: Readonly<{ candidate: unknown; manifest: ModelPackManifestV1; admitted_input: CategoryDemandInputV1 }>) => CategoryDemandForecastV1>>,
  Assert<Equal<PackageSurface['modelPackError'], (code: ModelPackErrorCode) => ModelPackContractError>>,
  Assert<ExactKeys<ModelPackIdentityV1, 'identity' | 'version' | 'artifact_sha256'>>,
  Assert<ExactKeys<IdentityVersionV1, 'identity' | 'version'>>,
  Assert<ExactKeys<ModelPackArtifactV1, 'sha256' | 'byte_size' | 'model_signature_sha256'>>,
  Assert<ExactKeys<ModelPackPermissionsV1, 'data' | 'network' | 'external_data' | 'mlflow_at_runtime' | 'training_workspace_at_runtime' | 'source_write' | 'model_execution'>>,
  Assert<ExactKeys<ModelPackManifestV1, 'schema_version' | 'package' | 'compatibility' | 'purpose' | 'io' | 'runtime' | 'permissions' | 'provenance' | 'evaluation' | 'limitations' | 'confidence' | 'license' | 'revocation_policy' | 'rollback'>>,
  Assert<ExactKeys<ModelPackReleaseStatusV1, 'schema_version' | 'package' | 'state' | 'controller'>>,
  Assert<ExactKeys<ArtifactLocationVerificationV1, 'kind' | 'controller_authorization_id' | 'approved_store_id' | 'evidence_sha256'>>,
  Assert<ExactKeys<ArtifactObservationV1, 'schema_version' | 'artifact_uri' | 'location_verification' | 'sha256' | 'byte_size' | 'model_signature_sha256'>>,
  Assert<ExactKeys<ModelPackReleaseInputV1, 'schema_version' | 'stage' | 'controller_release' | 'mlflow' | 'artifact' | 'manifest'>>,
  Assert<ExactKeys<CategoryDemandHistoryRowV1, 'business_date' | 'product_category' | 'order_count' | 'gross_order_amount' | 'discount_amount'>>,
  Assert<ExactKeys<CategoryDemandInputV1, 'contract_version' | 'as_of_date' | 'currency' | 'history'>>,
  Assert<ExactKeys<ConfirmedCategoryDemandSnapshotV1, 'snapshot_id' | 'confirmed_at' | 'sha256' | 'input'>>,
  Assert<ExactKeys<PredictionInterval80V1, 'lower' | 'upper'>>,
  Assert<ExactKeys<CategoryDemandPredictionRowV1, 'business_date' | 'product_category' | 'predicted_order_count' | 'predicted_net_order_amount' | 'order_count_interval_80' | 'net_order_amount_interval_80'>>,
  Assert<ExactKeys<CategoryDemandForecastV1, 'contract_version' | 'as_of_date' | 'currency' | 'predictions'>>,
  Assert<ExactKeys<CategoryDemandForecastProvenanceV1, 'run_id' | 'package' | 'model' | 'release_status' | 'input_snapshot' | 'runtime' | 'adapter'>>,
  Assert<ExactKeys<CategoryDemandForecastResultV1, 'forecast' | 'provenance'>>,
  Assert<Equal<ModelPackManifestV1['schema_version'], '1.0'>>,
  Assert<Equal<ModelPackPermissionsV1['network'], 'none'>>,
  Assert<Equal<CategoryDemandInputV1['history'][number], CategoryDemandHistoryRowV1>>,
  Assert<Equal<CategoryDemandForecastV1['predictions'][number], CategoryDemandPredictionRowV1>>,
  Assert<Equal<CategoryDemandForecastResultV1['provenance'], CategoryDemandForecastProvenanceV1>>,
];
void (0 as unknown as PackageSignatureAssertions);

const ERROR_CODES = [
  'MODEL_PACK_CONTRACT_INVALID',
  'MODEL_PACK_CONTRACT_UNSUPPORTED',
  'MODEL_PACK_IDENTITY_MISMATCH',
  'MODEL_PACK_ARTIFACT_MISMATCH',
  'MODEL_PACK_PERMISSION_DENIED',
  'MODEL_PACK_LICENSE_INVALID',
  'MODEL_PACK_REVOKED',
  'MODEL_PACK_RUNTIME_INCOMPATIBLE',
  'MODEL_PACK_INPUT_INVALID',
  'MODEL_PACK_OUTPUT_INVALID',
  'MODEL_PACK_RELEASE_REQUIRED',
  'MODEL_PACK_RELEASE_REFERENCE_INVALID',
  'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH',
  'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE',
  'ANALYTICAL_MODEL_INPUT_CHANGED',
  'ANALYTICAL_MODEL_RUN_ALREADY_STARTED',
  'ANALYTICAL_MODEL_CANCELLED',
  'ANALYTICAL_MODEL_DEADLINE_EXCEEDED',
  'ANALYTICAL_MODEL_RUNTIME_FAILED',
] as const satisfies readonly ModelPackErrorCode[];

type ContractModule = Record<string, unknown>;
type Mutation = Readonly<{ name: string; mutate(value: RecordValue): unknown; code: ModelPackErrorCode }>;

function assertError(error: unknown, code: ModelPackErrorCode): true {
  assert.equal(error instanceof Error, true);
  assert.equal((error as Error).name, 'ModelPackContractError');
  assert.equal((error as Error).message, code);
  assert.equal((error as { code?: unknown }).code, code);
  assert.deepEqual(Object.keys(error as object).sort(), ['code', 'name']);
  assert.equal('cause' in (error as object), false);
  const publicText = JSON.stringify(error);
  for (const forbidden of ['file:', '/private/', 'credential', 'secret', 'mlflow', 'stack', 'raw reason']) assert.equal(publicText.includes(forbidden), false);
  return true;
}

function fn(module: ContractModule, name: string): (value: unknown) => unknown {
  return module[name] as (value: unknown) => unknown;
}

function remove(value: RecordValue, key: string): RecordValue {
  const copy = clone(value);
  delete copy[key];
  return copy;
}

function replaceChild(value: RecordValue, key: string, patch: RecordValue): RecordValue {
  return { ...clone(value), [key]: { ...(clone(value)[key] as RecordValue), ...patch } };
}

function mutateManifestChild(value: RecordValue, key: string, mutate: (child: RecordValue) => unknown): RecordValue {
  const copy = clone(value);
  copy[key] = mutate(copy[key] as RecordValue);
  return copy;
}

async function runMutationCases(
  t: TestContext,
  cases: readonly Mutation[],
  base: () => RecordValue,
  invoke: (candidate: unknown) => unknown,
): Promise<void> {
  for (const entry of cases) {
    await t.test(entry.name, () => {
      const candidate = entry.mutate(base());
      assert.throws(() => invoke(candidate), (error) => assertError(error, entry.code));
    });
  }
}

test('TEST-MPC-004 package driver health: exact observation, defensive bytes, forecast, and repeat determinism', async () => {
  assertFixtureHealth();
  await runModelPackPackageContract(async () => createDeterministicModelPackPackageDriver());
});

test('TEST-MPC-001..003 production package target and every independent mutation leaf', async (t) => {
  const module = await import(packageModuleUrl.href) as ContractModule;
  const exactExports = ['MODEL_PACK_CONTRACT_VERSION', 'MODEL_PACK_ERROR_CODES', 'MODEL_PACK_IDENTITY', 'admitCategoryDemandForecast', 'admitCategoryDemandInput', 'admitModelPackManifest', 'admitModelPackReleaseInput', 'admitModelPackReleaseStatus', 'canonicalCategoryDemandInputBytes', 'modelPackError', 'serializeModelPackManifest', 'serializeModelPackReleaseInput'];

  await t.test('TEST-MPC-001 exact runtime export surface, constants, nine functions, and 19-code order', () => {
    assert.deepEqual(Object.keys(module).sort(), exactExports);
    assert.equal(module.MODEL_PACK_IDENTITY, 'juanerai.sales-demand-forecast');
    assert.equal(module.MODEL_PACK_CONTRACT_VERSION, '1.0');
    assert.deepEqual(module.MODEL_PACK_ERROR_CODES, ERROR_CODES);
    for (const name of exactExports.filter((name) => !name.startsWith('MODEL_PACK_'))) assert.equal(typeof module[name], 'function', name);
  });

  for (const code of ERROR_CODES) {
    await t.test(`TEST-MPC-001 error-carrier:${code}: exact sanitized enumerable shape`, () => {
      assertError(fn(module, 'modelPackError')(code), code);
    });
  }

  await t.test('TEST-MPC-001 manifest positive: canonical UTF-8, exact binding, detached immutable value, defensive bytes', () => {
    const caller = clone(manifestFixture()) as ModelPackManifestV1;
    const bytes = fn(module, 'serializeModelPackManifest')(caller) as Uint8Array;
    assert.deepEqual(bytes, canonicalBytes(manifestFixture()));
    const firstByte = bytes[0];
    bytes[0] = 0;
    const repeatedBytes = fn(module, 'serializeModelPackManifest')(manifestFixture()) as Uint8Array;
    assert.equal(repeatedBytes[0], firstByte);
    const admitted = fn(module, 'admitModelPackManifest')({ manifest_bytes: repeatedBytes, artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() }) as RecordValue;
    assert.deepEqual(admitted, manifestFixture());
    assert.notEqual(admitted, caller);
    assert.equal(Object.isFrozen(admitted), true);
    assert.equal('state' in admitted, false);
  });

  const manifestGovernedIdentityPositions: readonly Readonly<{ name: string; set(manifest: RecordValue, identity: string): void }>[] = [
    { name: 'Runtime', set: (manifest, identity) => { (((manifest.runtime as RecordValue).runtime) as RecordValue).identity = identity; } },
    { name: 'dependency', set: (manifest, identity) => { ((((manifest.runtime as RecordValue).dependencies as RecordValue[])[0]) as RecordValue).identity = identity; } },
  ];
  const validGovernedIdentities: readonly Readonly<{ name: string; identity: string }>[] = [
    { name: 'ordinary', identity: 'governed-identity' },
    { name: 'one-Unicode-scalar', identity: '\u{1F642}' },
    { name: '200-supplementary-plane-scalars', identity: '\u{1F642}'.repeat(200) },
    { name: '256-Unicode-scalars', identity: '\u{1F642}'.repeat(256) },
  ];
  const invalidGovernedIdentities: readonly Readonly<{ name: string; identity: string }>[] = [
    { name: 'internal-ASCII-whitespace', identity: 'governed identity' },
    { name: 'leading-whitespace', identity: ' governed-identity' },
    { name: 'trailing-whitespace', identity: 'governed-identity ' },
    { name: 'Unicode-whitespace-U+00A0', identity: 'governed\u00A0identity' },
    { name: 'exact-dot', identity: '.' }, { name: 'exact-dot-dot', identity: '..' },
    { name: 'forward-slash-path', identity: 'bad/path' }, { name: 'backslash-path', identity: 'bad\\path' },
    { name: 'at-sign', identity: 'governed@identity' }, { name: 'credential-like', identity: 'user:secret@governed' },
    { name: 'alias', identity: 'alias' }, { name: 'latest', identity: 'latest' },
    { name: 'Cc-control-U+0000', identity: 'governed\u0000identity' }, { name: 'Cf-format-U+200B', identity: 'governed\u200Bidentity' },
    { name: 'Cs-lone-surrogate-U+D800', identity: 'governed\uD800identity' }, { name: 'Cn-noncharacter-U+FDD0', identity: 'governed\uFDD0identity' },
    { name: 'Co-private-use-U+E000', identity: 'governed\uE000identity' }, { name: '257-Unicode-scalars', identity: '\u{1F642}'.repeat(257) },
  ];
  for (const entry of manifestGovernedIdentityPositions) {
    for (const identityCase of validGovernedIdentities) {
      await t.test(`TEST-MPC-001 manifest:${entry.name}-identity-${identityCase.name}-round-trips-through-serialization-and-canonical-byte-admission`, () => {
        const manifest = clone(manifestFixture());
        entry.set(manifest, identityCase.identity);
        const bytes = fn(module, 'serializeModelPackManifest')(manifest) as Uint8Array;
        assert.deepEqual(bytes, canonicalBytes(manifest));
        const admitted = fn(module, 'admitModelPackManifest')({ manifest_bytes: bytes, artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() }) as ModelPackManifestV1;
        assert.equal(entry.name === 'Runtime' ? admitted.runtime.runtime.identity : admitted.runtime.dependencies[0]?.identity, identityCase.identity);
      });
    }
    for (const identityCase of invalidGovernedIdentities) {
      await t.test(`TEST-MPC-001 manifest:${entry.name}-identity-${identityCase.name}-is-contract-invalid-at-serialization-and-canonical-byte-admission`, () => {
        const manifest = clone(manifestFixture());
        entry.set(manifest, identityCase.identity);
        assert.throws(() => fn(module, 'serializeModelPackManifest')(manifest), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
        assert.throws(() => fn(module, 'admitModelPackManifest')({ manifest_bytes: canonicalBytes(manifest), artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() }), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
      });
    }
  }

  const canonicalRawCases: readonly Readonly<{ name: string; bytes(): Uint8Array; code: ModelPackErrorCode }>[] = [
    { name: 'TEST-MPC-001 canonical-json:BOM', bytes: () => new Uint8Array([0xef, 0xbb, 0xbf, ...canonicalBytes(manifestFixture())]), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:malformed-UTF8', bytes: () => new Uint8Array([0xff]), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:malformed-JSON', bytes: () => new TextEncoder().encode('{'), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:whitespace', bytes: () => new TextEncoder().encode(` ${JSON.stringify(manifestFixture())}`), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:non-canonical-member-order', bytes: () => { const value = clone(manifestFixture()); const schema = value.schema_version; delete value.schema_version; return canonicalBytes({ package: value.package, schema_version: schema, ...remove(value, 'package') }); }, code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:duplicate-member', bytes: () => new TextEncoder().encode(JSON.stringify(manifestFixture()).replace('{"schema_version":"1.0",', '{"schema_version":"1.0","schema_version":"1.0",')), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:unknown-member', bytes: () => canonicalBytes({ ...manifestFixture(), unknown: true }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:missing-member', bytes: () => canonicalBytes(remove(manifestFixture(), 'license')), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:null-member', bytes: () => canonicalBytes({ ...manifestFixture(), license: null }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 canonical-json:wrong-type-member', bytes: () => canonicalBytes({ ...manifestFixture(), license: 'Apache-2.0' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
  ];
  for (const entry of canonicalRawCases) {
    await t.test(entry.name, () => assert.throws(() => fn(module, 'admitModelPackManifest')({ manifest_bytes: entry.bytes(), artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() }), (error) => assertError(error, entry.code)));
  }

  const manifestCases: Mutation[] = [
    { name: 'TEST-MPC-001 version:manifest-schema', mutate: (v) => ({ ...v, schema_version: '2.0' }), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-001 version:JuanerAI-contract', mutate: (v) => mutateManifestChild(v, 'compatibility', (c) => ({ ...c, juanerai_contract_version: '2.0' })), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-001 version:input-contract', mutate: (v) => mutateManifestChild(v, 'compatibility', (c) => ({ ...c, input_contract: 'sales-demand-forecast-input/2.0' })), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-001 version:output-contract', mutate: (v) => mutateManifestChild(v, 'compatibility', (c) => ({ ...c, output_contract: 'sales-demand-forecast-output/2.0' })), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-001 package-version:alias-latest', mutate: (v) => mutateManifestChild(v, 'package', (c) => ({ ...c, version: 'latest' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 package-version:range', mutate: (v) => mutateManifestChild(v, 'package', (c) => ({ ...c, version: '^1.0.0' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 package-version:prerelease', mutate: (v) => mutateManifestChild(v, 'package', (c) => ({ ...c, version: '1.0.0-rc.1' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 package-version:leading-zero', mutate: (v) => mutateManifestChild(v, 'package', (c) => ({ ...c, version: '01.0.0' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 purpose:wrong-approved-use', mutate: (v) => mutateManifestChild(v, 'purpose', (c) => ({ ...c, approved_use: 'automatic_replenishment' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 manifest:enumerable-throwing-package-getter-is-sanitized', mutate: (v) => { const candidate = clone(v); Object.defineProperty(candidate, 'package', { enumerable: true, get() { throw new Error('raw manifest package getter secret'); } }); return candidate; }, code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 manifest:enumerable-license-getter-Proxy-descriptor-throw-is-sanitized', mutate: (v) => { const candidate = clone(v); Object.defineProperty(candidate, 'license', { enumerable: true, get() { throw new Proxy(new Error('raw manifest license Proxy descriptor secret'), { getOwnPropertyDescriptor() { throw new Error('raw manifest license descriptor trap secret'); } }); } }); return candidate; }, code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 category:U+0085-control-is-rejected', mutate: (v) => mutateManifestChild(v, 'io', (c) => ({ ...c, supported_product_categories: ['beverages\u0085'] })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    ...manifestPurposeCases(),
    ...manifestPermissionCases(),
    { name: 'TEST-MPC-001 permission:extra-widened-filesystem-is-permission-denied', mutate: (v) => mutateManifestChild(v, 'permissions', (c) => ({ ...c, filesystem: 'all' })), code: 'MODEL_PACK_PERMISSION_DENIED' },
    { name: 'TEST-MPC-001 permission:missing-network-preserves-permission-denied-precedence', mutate: (v) => mutateManifestChild(v, 'permissions', (c) => remove(c, 'network')), code: 'MODEL_PACK_PERMISSION_DENIED' },
    { name: 'TEST-MPC-001 security:online-learning-enabled', mutate: (v) => mutateManifestChild(v, 'runtime', (c) => ({ ...c, online_learning: true })), code: 'MODEL_PACK_PERMISSION_DENIED' },
    { name: 'TEST-MPC-001 lifecycle:invalid-license-identity', mutate: (v) => mutateManifestChild(v, 'license', (c) => ({ ...c, license_id: '' })), code: 'MODEL_PACK_LICENSE_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:invalid-license-terms-checksum', mutate: (v) => mutateManifestChild(v, 'license', (c) => ({ ...c, terms_sha256: 'bad' })), code: 'MODEL_PACK_LICENSE_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:missing-limitations', mutate: (v) => remove(v, 'limitations'), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:empty-limitations', mutate: (v) => ({ ...v, limitations: [] }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:missing-confidence', mutate: (v) => remove(v, 'confidence'), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:missing-evaluation-evidence', mutate: (v) => remove(v, 'evaluation'), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:wrong-contract-identity', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, contract: 'sales-demand-forecast-evaluation/2.0' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:order-count-improvement-below-five-percent', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_order_count_relative_wape_improvement: '0.04' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:net-amount-improvement-below-ten-percent', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_net_order_amount_relative_wape_improvement: '0.09' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:key-category-regression-over-five-points', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_key_category_wape_regression_max_percentage_points: '6' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:interval-coverage-below-seventy-percent', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_interval_coverage: '0.69' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:interval-coverage-above-ninety-percent', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_interval_coverage: '0.91' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:non-canonical-observed-decimal', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_interval_coverage: '00.80' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:invalid-summary-checksum', mutate: (v) => mutateManifestChild(v, 'evaluation', (e) => ({ ...e, observed_summary_sha256: 'bad' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:invalid-provenance-evidence-checksum', mutate: (v) => mutateManifestChild(v, 'provenance', (p) => ({ ...p, evaluation_evidence_sha256: 'bad' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evaluation:invalid-release-date', mutate: (v) => mutateManifestChild(v, 'provenance', (p) => ({ ...p, released_at: '2026-08-24' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 confidence:wrong-nominal-coverage', mutate: (v) => mutateManifestChild(v, 'confidence', (c) => ({ ...c, nominal_coverage: '0.90' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 confidence:invalid-evidence-checksum', mutate: (v) => mutateManifestChild(v, 'confidence', (c) => ({ ...c, evidence_sha256: 'bad' })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:mutable-current-status-in-manifest', mutate: (v) => ({ ...v, state: 'released' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:missing-revocation-policy', mutate: (v) => remove(v, 'revocation_policy'), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:wrong-revocation-policy-identity', mutate: (v) => ({ ...v, revocation_policy: { release_status_contract: 'other/1.0' } }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:missing-rollback-trigger', mutate: (v) => mutateManifestChild(v, 'rollback', (c) => ({ ...c, trigger_conditions: [] })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 lifecycle:invalid-previous-package', mutate: (v) => mutateManifestChild(v, 'rollback', (c) => ({ ...c, previous_stable_package: { ...expectedPackageFixture(), version: 'latest' } })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evidence:training-rows-injected', mutate: (v) => ({ ...v, training_rows: [] }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 evidence:acceptance-actuals-injected', mutate: (v) => ({ ...v, acceptance_actuals: [] }), code: 'MODEL_PACK_CONTRACT_INVALID' },
  ];
  await runMutationCases(t, manifestCases, manifestFixture, (candidate) => fn(module, 'serializeModelPackManifest')(candidate));

  await t.test('TEST-MPC-001 manifest:public-modelPackError-license-getter-is-sanitized-to-owning-contract-invalid', () => {
    const candidate = clone(manifestFixture());
    Object.defineProperty(candidate, 'license', {
      enumerable: true,
      get() { throw fn(module, 'modelPackError')('ANALYTICAL_MODEL_CANCELLED'); },
    });
    assert.throws(() => fn(module, 'serializeModelPackManifest')(candidate), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });

  await t.test('TEST-MPC-001 lifecycle:limitations-Symbol-own-key-is-contract-invalid', () => {
    const candidate = clone(manifestFixture());
    const limitations = [...candidate.limitations as string[]];
    Object.defineProperty(limitations, Symbol('unexpected-limitation'), { value: true });
    candidate.limitations = limitations;
    assert.throws(() => fn(module, 'serializeModelPackManifest')(candidate), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });

  await t.test('TEST-MPC-001 evaluation:interval-coverage-exact-ninety-valid-and-precision-above-rejected', () => {
    const exactNinety = mutateManifestChild(manifestFixture(), 'evaluation', (evaluation) => ({ ...evaluation, observed_interval_coverage: '0.90' }));
    assert.deepEqual(fn(module, 'serializeModelPackManifest')(exactNinety), canonicalBytes(exactNinety));
    const aboveNinety = mutateManifestChild(manifestFixture(), 'evaluation', (evaluation) => ({ ...evaluation, observed_interval_coverage: '0.90000000000000001' }));
    assert.throws(() => fn(module, 'serializeModelPackManifest')(aboveNinety), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });

  const manifestBytes = fn(module, 'serializeModelPackManifest')(manifestFixture()) as Uint8Array;
  const expectedCases: Mutation[] = [
    { name: 'TEST-MPC-001 identity:expected-package-identity', mutate: (v) => ({ ...v, identity: 'other.package' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-001 identity:expected-package-version', mutate: (v) => ({ ...v, version: '9.9.9' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-001 identity:expected-package-checksum', mutate: (v) => ({ ...v, artifact_sha256: hash('0') }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
  ];
  await runMutationCases(t, expectedCases, expectedPackageFixture, (candidate) => fn(module, 'admitModelPackManifest')({ manifest_bytes: manifestBytes, artifact_observation: artifactObservationFixture(), expected_package: candidate }));
  const artifactCases: Mutation[] = [
    { name: 'TEST-MPC-001 artifact-observation:checksum', mutate: (v) => ({ ...v, sha256: hash('0') }), code: 'MODEL_PACK_ARTIFACT_MISMATCH' },
    { name: 'TEST-MPC-001 artifact-observation:byte-size', mutate: (v) => ({ ...v, byte_size: 1 }), code: 'MODEL_PACK_ARTIFACT_MISMATCH' },
    { name: 'TEST-MPC-001 artifact-observation:model-signature', mutate: (v) => ({ ...v, model_signature_sha256: hash('0') }), code: 'MODEL_PACK_ARTIFACT_MISMATCH' },
  ];
  await runMutationCases(t, artifactCases, artifactObservationFixture, (candidate) => fn(module, 'admitModelPackManifest')({ manifest_bytes: manifestBytes, artifact_observation: candidate, expected_package: expectedPackageFixture() }));

  await runReleaseStatusCases(t, module);
  await runInputCases(t, module);
  await runForecastCases(t, module);
  await runReleaseCases(t, module);
});

function manifestPurposeCases(): Mutation[] {
  const prohibited = (manifestFixture().purpose as RecordValue).prohibited_uses as string[];
  return [
    ...prohibited.map((use) => ({ name: `TEST-MPC-001 purpose:missing-prohibited-use:${use}`, mutate: (v: RecordValue) => mutateManifestChild(v, 'purpose', (c) => ({ ...c, prohibited_uses: (c.prohibited_uses as string[]).filter((entry) => entry !== use) })), code: 'MODEL_PACK_CONTRACT_INVALID' as const })),
    { name: 'TEST-MPC-001 purpose:extra-prohibited-use', mutate: (v) => mutateManifestChild(v, 'purpose', (c) => ({ ...c, prohibited_uses: [...c.prohibited_uses as string[], 'credit_decision'] })), code: 'MODEL_PACK_CONTRACT_INVALID' },
  ];
}

function manifestPermissionCases(): Mutation[] {
  const values: readonly [string, unknown][] = [['data', 'remote'], ['network', 'allowed'], ['external_data', 'allowed'], ['mlflow_at_runtime', 'allowed'], ['training_workspace_at_runtime', 'allowed'], ['source_write', 'allowed'], ['model_execution', 'remote']];
  return values.map(([field, widened]) => ({ name: `TEST-MPC-001 permission:widened-${field}`, mutate: (v: RecordValue) => mutateManifestChild(v, 'permissions', (c) => ({ ...c, [field]: widened })), code: 'MODEL_PACK_PERMISSION_DENIED' as const }));
}

async function runReleaseStatusCases(t: TestContext, module: ContractModule): Promise<void> {
  await t.test('TEST-MPC-001 release-status:released-positive-and-detached', () => {
    const source = clone(releaseStatusFixture());
    const admitted = fn(module, 'admitModelPackReleaseStatus')({ release_status: source, expected_package: expectedPackageFixture() });
    assert.deepEqual(admitted, releaseStatusFixture());
    assert.notEqual(admitted, source);
    assert.equal(Object.isFrozen(admitted), true);
  });
  await t.test('TEST-MPC-001 release-status:revoked-is-admitted-value-not-preflight', () => assert.deepEqual(fn(module, 'admitModelPackReleaseStatus')({ release_status: releaseStatusFixture('revoked'), expected_package: expectedPackageFixture() }), releaseStatusFixture('revoked')));
  const cases: Mutation[] = [
    { name: 'TEST-MPC-001 release-status:malformed-shape', mutate: () => ({ state: 'released' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:missing-package-version-is-malformed-not-identity-mismatch', mutate: (v) => ({ ...v, package: remove(v.package as RecordValue, 'version') }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:package-version-latest-is-malformed-not-identity-mismatch', mutate: (v) => replaceChild(v, 'package', { version: 'latest' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:package-Artifact-SHA-bad-is-malformed-not-identity-mismatch', mutate: (v) => replaceChild(v, 'package', { artifact_sha256: 'bad' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:unsupported-version', mutate: (v) => ({ ...v, schema_version: '2.0' }), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-001 release-status:wrong-package-identity', mutate: (v) => replaceChild(v, 'package', { identity: 'other.package' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-001 release-status:wrong-package-version', mutate: (v) => replaceChild(v, 'package', { version: '9.9.9' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-001 release-status:wrong-Artifact-binding', mutate: (v) => replaceChild(v, 'package', { artifact_sha256: hash('0') }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-001 release-status:missing-controller-decision-id', mutate: (v) => mutateManifestChild(v, 'controller', (c) => remove(c, 'decision_id')), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:missing-controller-evidence-id', mutate: (v) => mutateManifestChild(v, 'controller', (c) => remove(c, 'evidence_id')), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:missing-controller-decision-time', mutate: (v) => mutateManifestChild(v, 'controller', (c) => remove(c, 'decided_at')), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-001 release-status:invalid-controller-decision-time', mutate: (v) => replaceChild(v, 'controller', { decided_at: '2026-08-24' }), code: 'MODEL_PACK_CONTRACT_INVALID' },
  ];
  await runMutationCases(t, cases, releaseStatusFixture, (candidate) => fn(module, 'admitModelPackReleaseStatus')({ release_status: candidate, expected_package: expectedPackageFixture() }));
}

async function runInputCases(t: TestContext, module: ContractModule): Promise<void> {
  const manifest = manifestFixture();
  await t.test('TEST-MPC-002 input:valid-56-day-exact-order-and-defensive-canonical-bytes', () => {
    const source = clone(inputFixture());
    const admitted = fn(module, 'admitCategoryDemandInput')({ candidate: source, manifest });
    assert.deepEqual(admitted, inputFixture());
    assert.notEqual(admitted, source);
    const bytes = fn(module, 'canonicalCategoryDemandInputBytes')({ admitted_input: admitted, manifest }) as Uint8Array;
    assert.deepEqual(bytes, canonicalBytes(inputFixture()));
    bytes[0] = 0;
    assert.deepEqual(fn(module, 'canonicalCategoryDemandInputBytes')({ admitted_input: admitted, manifest }), canonicalBytes(inputFixture()));
  });
  await t.test('TEST-MPC-002 input:valid-57-consecutive-days-ending-as-of-in-complete-category-order', () => {
    const source = clone(inputFixture());
    const priorDay = categoryOrder.map((product_category, index) => ({ business_date: dateAt(-1), product_category, order_count: 10 + index, gross_order_amount: index === 0 ? '100.00' : '50.00', discount_amount: index === 0 ? '10.00' : '0' }));
    source.history = [...priorDay, ...(source.history as RecordValue[])];
    const admitted = fn(module, 'admitCategoryDemandInput')({ candidate: source, manifest }) as RecordValue;
    assert.equal(admitted.as_of_date, inputFixture().as_of_date);
    assert.deepEqual(admitted.history, source.history);
    assert.deepEqual(fn(module, 'canonicalCategoryDemandInputBytes')({ admitted_input: admitted, manifest }), canonicalBytes(source));
  });
  await t.test('TEST-MPC-002 input:65-supplementary-plane-scalars-is-a-valid-category', () => {
    const productCategory = '\u{1F642}'.repeat(65);
    const unicodeManifest = clone(manifestFixture());
    unicodeManifest.io = { ...(unicodeManifest.io as RecordValue), supported_product_categories: [productCategory] };
    const candidate = {
      contract_version: '1.0',
      as_of_date: dateAt(55),
      currency: 'USD',
      history: Array.from({ length: 56 }, (_, day) => ({ business_date: dateAt(day), product_category: productCategory, order_count: 10, gross_order_amount: '100.00', discount_amount: '10.00' })),
    };
    assert.deepEqual(fn(module, 'admitCategoryDemandInput')({ candidate, manifest: unicodeManifest }), candidate);
  });
  await t.test('TEST-MPC-002 canonical-input-bytes:extra-outer-key', () => {
    const admitted = fn(module, 'admitCategoryDemandInput')({ candidate: inputFixture(), manifest });
    assert.throws(() => fn(module, 'canonicalCategoryDemandInputBytes')({ admitted_input: admitted, manifest, extra: true }), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });
  await t.test('TEST-MPC-002 canonical-input-bytes:extra-own-Symbol-key', () => {
    const admitted = fn(module, 'admitCategoryDemandInput')({ candidate: inputFixture(), manifest });
    const candidate = { admitted_input: admitted, manifest };
    Object.defineProperty(candidate, Symbol('extra'), { value: true, enumerable: true });
    assert.throws(() => fn(module, 'canonicalCategoryDemandInputBytes')(candidate), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });
  await t.test('TEST-MPC-002 canonical-input-bytes:extra-non-enumerable-own-string-key', () => {
    const admitted = fn(module, 'admitCategoryDemandInput')({ candidate: inputFixture(), manifest });
    const candidate = { admitted_input: admitted, manifest };
    Object.defineProperty(candidate, 'extra', { value: true, enumerable: false });
    assert.throws(() => fn(module, 'canonicalCategoryDemandInputBytes')(candidate), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });
  const rowMutation = (mutate: (row: RecordValue) => unknown, index = 0) => (v: RecordValue) => ({ ...v, history: (v.history as RecordValue[]).map((row, current) => current === index ? mutate(row) : row) });
  const discontinuous = (v: RecordValue) => {
    const history = (v.history as RecordValue[]).filter((row) => row.business_date !== dateAt(20));
    const earlier = categoryOrder.map((product_category, index) => ({ business_date: dateAt(-1), product_category, order_count: 10 + index, gross_order_amount: '10', discount_amount: '0' }));
    return { ...v, history: [...earlier, ...history] };
  };
  const cases: Mutation[] = [
    { name: 'TEST-MPC-002 input:unsupported-contract-version', mutate: (v) => ({ ...v, contract_version: '2.0' }), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-002 input:fewer-than-56-days', mutate: (v) => ({ ...v, history: (v.history as unknown[]).slice(2) }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:history-does-not-end-at-as-of', mutate: (v) => ({ ...v, as_of_date: dateAt(56) }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:future-row', mutate: rowMutation((r) => ({ ...r, business_date: dateAt(56) }), 110), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:non-continuous-dates', mutate: discontinuous, code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:invalid-calendar-date', mutate: rowMutation((r) => ({ ...r, business_date: '2026-02-30' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:duplicate-date-category-row', mutate: (v) => ({ ...v, history: [...v.history as unknown[], clone((v.history as unknown[])[0])] }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:missing-date-category-row', mutate: (v) => ({ ...v, history: (v.history as unknown[]).slice(1) }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:category-drift', mutate: rowMutation((r) => ({ ...r, product_category: 'other' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:empty-category', mutate: rowMutation((r) => ({ ...r, product_category: '' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:free-text-like-category', mutate: rowMutation((r) => ({ ...r, product_category: 'uncurated free text' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:path-category', mutate: rowMutation((r) => ({ ...r, product_category: '../beverages' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:mixed-currency-token', mutate: (v) => ({ ...v, currency: 'USD/EUR' }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:wrong-currency', mutate: (v) => ({ ...v, currency: 'EUR' }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:unsafe-order-count', mutate: rowMutation((r) => ({ ...r, order_count: Number.MAX_SAFE_INTEGER + 1 })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:negative-order-count', mutate: rowMutation((r) => ({ ...r, order_count: -1 })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:negative-gross-amount', mutate: rowMutation((r) => ({ ...r, gross_order_amount: '-1' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:non-canonical-gross-amount', mutate: rowMutation((r) => ({ ...r, gross_order_amount: '01.0' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:negative-discount-amount', mutate: rowMutation((r) => ({ ...r, discount_amount: '-1' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:non-canonical-discount-amount', mutate: rowMutation((r) => ({ ...r, discount_amount: '1e2' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:discount-greater-than-gross', mutate: rowMutation((r) => ({ ...r, gross_order_amount: '1', discount_amount: '2' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:discount-greater-than-gross-above-safe-integer', mutate: rowMutation((r) => ({ ...r, gross_order_amount: '9007199254740992', discount_amount: '9007199254740993' })), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:wrong-row-order', mutate: (v) => { const history = [...v.history as unknown[]]; [history[0], history[1]] = [history[1], history[0]]; return { ...v, history }; }, code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:extra-top-level-field', mutate: (v) => ({ ...v, extra: true }), code: 'MODEL_PACK_INPUT_INVALID' },
    { name: 'TEST-MPC-002 input:extra-row-field', mutate: rowMutation((r) => ({ ...r, net_order_amount: '90' })), code: 'MODEL_PACK_INPUT_INVALID' },
  ];
  await runMutationCases(t, cases, inputFixture, (candidate) => fn(module, 'admitCategoryDemandInput')({ candidate, manifest }));
}

async function runForecastCases(t: TestContext, module: ContractModule): Promise<void> {
  const manifest = manifestFixture();
  const admittedInput = fn(module, 'admitCategoryDemandInput')({ candidate: inputFixture(), manifest });
  await t.test('TEST-MPC-002 forecast:valid-exact-28-day-result-only', () => assert.deepEqual(fn(module, 'admitCategoryDemandForecast')({ candidate: forecastFixture(), manifest, admitted_input: admittedInput }), forecastFixture()));
  const rowMutation = (mutate: (row: RecordValue) => unknown, index = 0) => (v: RecordValue) => ({ ...v, predictions: (v.predictions as RecordValue[]).map((row, current) => current === index ? mutate(row) : row) });
  const cases: Mutation[] = [
    { name: 'TEST-MPC-002 forecast:unsupported-contract-version', mutate: (v) => ({ ...v, contract_version: '2.0' }), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-002 forecast:first-date-not-next-day', mutate: rowMutation((r) => ({ ...r, business_date: dateAt(55) })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:not-28-day-horizon', mutate: (v) => ({ ...v, predictions: (v.predictions as unknown[]).slice(0, -2) }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:category-drift', mutate: rowMutation((r) => ({ ...r, product_category: 'other' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:currency-drift', mutate: (v) => ({ ...v, currency: 'EUR' }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:duplicate-row', mutate: (v) => ({ ...v, predictions: [...v.predictions as unknown[], clone((v.predictions as unknown[])[0])] }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:missing-row', mutate: (v) => ({ ...v, predictions: (v.predictions as unknown[]).slice(1) }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:extra-row', mutate: (v) => ({ ...v, predictions: [...v.predictions as unknown[], { ...(v.predictions as RecordValue[])[0], business_date: '2026-08-24' }] }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:negative-order-prediction', mutate: rowMutation((r) => ({ ...r, predicted_order_count: '-1' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:non-canonical-order-prediction', mutate: rowMutation((r) => ({ ...r, predicted_order_count: '01' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:negative-amount-prediction', mutate: rowMutation((r) => ({ ...r, predicted_net_order_amount: '-1' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:non-canonical-amount-prediction', mutate: rowMutation((r) => ({ ...r, predicted_net_order_amount: '1e2' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:reversed-order-interval', mutate: rowMutation((r) => ({ ...r, order_count_interval_80: { lower: '12', upper: '8' } })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:reversed-order-interval-above-safe-integer', mutate: rowMutation((r) => ({ ...r, order_count_interval_80: { lower: '9007199254740993', upper: '9007199254740992' } })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:reversed-amount-interval', mutate: rowMutation((r) => ({ ...r, net_order_amount_interval_80: { lower: '100', upper: '80' } })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:negative-interval-bound', mutate: rowMutation((r) => ({ ...r, order_count_interval_80: { lower: '-1', upper: '12' } })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:non-canonical-interval-bound', mutate: rowMutation((r) => ({ ...r, net_order_amount_interval_80: { lower: '080', upper: '100' } })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:wrong-row-order', mutate: (v) => { const predictions = [...v.predictions as unknown[]]; [predictions[0], predictions[1]] = [predictions[1], predictions[0]]; return { ...v, predictions }; }, code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:unknown-row-field', mutate: rowMutation((r) => ({ ...r, provider: 'forbidden' })), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:unknown-top-level-field', mutate: (v) => ({ ...v, generated_at: '2026-08-24T00:00:00.000Z' }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:caller-provenance-injected', mutate: (v) => ({ ...v, provenance: { run_id: 'attacker' } }), code: 'MODEL_PACK_OUTPUT_INVALID' },
    { name: 'TEST-MPC-002 forecast:predictor-provenance-injected', mutate: (v) => ({ ...v, mlflow_uri: 'file:///private/model' }), code: 'MODEL_PACK_OUTPUT_INVALID' },
  ];
  await runMutationCases(t, cases, forecastFixture, (candidate) => fn(module, 'admitCategoryDemandForecast')({ candidate, manifest, admitted_input: admittedInput }));
}

async function runReleaseCases(t: TestContext, module: ContractModule): Promise<void> {
  await t.test('TEST-MPC-003 release:authorized-normalized-local-file-URI-positive-and-detached', () => {
    const release = releaseInputFixture() as ModelPackReleaseInputV1;
    const bytes = fn(module, 'serializeModelPackReleaseInput')(release) as Uint8Array;
    assert.deepEqual(bytes, canonicalBytes(releaseInputFixture()));
    const admitted = fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: bytes, artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() });
    assert.deepEqual(admitted, releaseInputFixture());
    assert.notEqual(admitted, release);
  });

  await t.test('TEST-MPC-003 release-decision:exact-256-identity-valid-and-257-rejected', () => {
    const exactDecisionId = 'd'.repeat(256);
    const exact = mutateManifestChild(replaceChild(releaseInputFixture(), 'controller_release', { decision_id: exactDecisionId }), 'manifest', (manifest) => mutateManifestChild(manifest, 'provenance', (provenance) => ({ ...provenance, controller_release_decision_id: exactDecisionId })));
    assert.deepEqual(fn(module, 'serializeModelPackReleaseInput')(exact), canonicalBytes(exact));
    const tooLongDecisionId = 'd'.repeat(257);
    const tooLong = mutateManifestChild(replaceChild(releaseInputFixture(), 'controller_release', { decision_id: tooLongDecisionId }), 'manifest', (manifest) => mutateManifestChild(manifest, 'provenance', (provenance) => ({ ...provenance, controller_release_decision_id: tooLongDecisionId })));
    assert.throws(() => fn(module, 'serializeModelPackReleaseInput')(tooLong), (error) => assertError(error, 'MODEL_PACK_CONTRACT_INVALID'));
  });

  const validAlternateReleaseSingletons: readonly Readonly<{
    name: string;
    mutate(value: RecordValue): RecordValue;
  }>[] = [
    {
      name: 'TEST-MPC-003 release-singleton:alternate-valid-limitations-have-no-mismatch-oracle',
      mutate: (v) => mutateManifestChild(v, 'manifest', (m) => ({ ...m, limitations: ['forecast uncertainty requires analyst review'] })),
    },
    {
      name: 'TEST-MPC-003 release-singleton:alternate-valid-license-has-no-mismatch-oracle',
      mutate: (v) => mutateManifestChild(v, 'manifest', (m) => ({ ...m, license: { license_id: 'Commercial-2026', terms_sha256: hash('3') } })),
    },
    {
      name: 'TEST-MPC-003 release-singleton:alternate-valid-rollback-has-no-mismatch-oracle',
      mutate: (v) => mutateManifestChild(v, 'manifest', (m) => ({
        ...m,
        rollback: {
          previous_stable_package: {
            identity: 'juanerai.sales-demand-forecast',
            version: '0.9.0',
            artifact_sha256: hash('9'),
          },
          trigger_conditions: ['controller-directed rollback'],
        },
      })),
    },
  ];
  for (const entry of validAlternateReleaseSingletons) {
    await t.test(entry.name, () => {
      const candidate = entry.mutate(releaseInputFixture());
      assert.deepEqual(fn(module, 'serializeModelPackReleaseInput')(candidate), canonicalBytes(candidate));
    });
  }

  const encodedArtifactReferenceCases: readonly Readonly<{ name: string; artifactUri: string }>[] = [
    { name: 'encoded-forward-separator-uppercase', artifactUri: 'file:///var/juanerai-artifacts%2Fmodel.bin' },
    { name: 'encoded-forward-separator-lowercase', artifactUri: 'file:///var/juanerai-artifacts%2fmodel.bin' },
    { name: 'encoded-back-separator-uppercase', artifactUri: 'file:///var/juanerai-artifacts%5Cmodel.bin' },
    { name: 'encoded-back-separator-lowercase', artifactUri: 'file:///var/juanerai-artifacts%5cmodel.bin' },
    { name: 'encoded-alias-segment', artifactUri: 'file:///var/juanerai-artifacts/%61lias/model.bin' },
    { name: 'encoded-latest-segment-case-variant', artifactUri: 'file:///var/juanerai-artifacts/%6cATEST/model.bin' },
    { name: 'encoded-C0-control', artifactUri: 'file:///var/juanerai-artifacts/%00model.bin' },
    { name: 'encoded-C1-control-case-variant', artifactUri: 'file:///var/juanerai-artifacts/%c2%85model.bin' },
    { name: 'encoded-DEL-control', artifactUri: 'file:///var/juanerai-artifacts/%7Fmodel.bin' },
  ];
  for (const entry of encodedArtifactReferenceCases) {
    await t.test(`TEST-MPC-003 artifact-reference:${entry.name}-is-rejected-before-any-evidence-mismatch`, async (subtest) => {
      const invalidRelease = replaceChild(releaseInputFixture(), 'mlflow', { artifact_uri: entry.artifactUri });
      const invalidReleaseBytes = canonicalBytes(invalidRelease);
      const invalidObservation = { ...artifactObservationFixture(), artifact_uri: entry.artifactUri };
      await subtest.test('serialization', () => {
        assert.throws(() => fn(module, 'serializeModelPackReleaseInput')(invalidRelease), (error) => assertError(error, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'));
      });
      await subtest.test('admission:invalid-release-valid-observation', () => {
        assert.throws(() => fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: invalidReleaseBytes, artifact_observation: artifactObservationFixture(), expected_package: expectedPackageFixture() }), (error) => assertError(error, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'));
      });
      await subtest.test('admission:valid-release-invalid-observation', () => {
        assert.throws(() => fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: canonicalBytes(releaseInputFixture()), artifact_observation: invalidObservation, expected_package: expectedPackageFixture() }), (error) => assertError(error, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'));
      });
      await subtest.test('admission:matching-invalid-release-and-observation', () => {
        assert.throws(() => fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: invalidReleaseBytes, artifact_observation: invalidObservation, expected_package: expectedPackageFixture() }), (error) => assertError(error, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'));
      });
    });
  }

  const releaseCases: Mutation[] = [
    { name: 'TEST-MPC-003 release-version:unsupported-schema', mutate: (v) => ({ ...v, schema_version: '2.0' }), code: 'MODEL_PACK_CONTRACT_UNSUPPORTED' },
    { name: 'TEST-MPC-003 release-stage:MP7', mutate: (v) => ({ ...v, stage: 'MP7_MODEL_EVALUATED' }), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-stage:MP8', mutate: (v) => ({ ...v, stage: 'MP8_MODEL_APPROVED' }), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-stage:missing-MP9', mutate: (v) => remove(v, 'stage'), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-stage:wrong-MP9', mutate: (v) => ({ ...v, stage: 'MP9' }), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-decision:missing-controller-decision', mutate: (v) => mutateManifestChild(v, 'controller_release', (c) => remove(c, 'decision')), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-decision:wrong-controller-decision', mutate: (v) => replaceChild(v, 'controller_release', { decision: 'model_rejected' }), code: 'MODEL_PACK_RELEASE_REQUIRED' },
    { name: 'TEST-MPC-003 release-closed-shape:SDK-field-injected', mutate: (v) => ({ ...v, sdk: { installed: true } }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-003 release-closed-shape:Consumer-field-injected', mutate: (v) => ({ ...v, consumer: { completed: true } }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-003 release-closed-shape:product-completion-field-injected', mutate: (v) => ({ ...v, product_complete: true }), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-003 registry-version:latest', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_version: 'latest' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 registry-version:alias', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_version: 'champion' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 registry-version:zero', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_version: '0' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 registry-version:non-numeric', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_version: 'one' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 MLflow-Run:raw-path-identity-is-rejected', mutate: (v) => { const rawPath = '/private/model/run'; return mutateManifestChild(replaceChild(v, 'mlflow', { run_id: rawPath }), 'manifest', (manifest) => mutateManifestChild(manifest, 'provenance', (provenance) => ({ ...provenance, mlflow_run_id: rawPath }))); }, code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:raw-absolute-path', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: '/var/models/model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:raw-relative-path', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: '../model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    ...['http:', 'https:', 's3:', 'gs:', 'ftp:'].map((scheme) => ({ name: `TEST-MPC-003 artifact-reference:non-file-scheme:${scheme}`, mutate: (v: RecordValue) => replaceChild(v, 'mlflow', { artifact_uri: `${scheme}//example.invalid/model.bin` }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' as const })),
    { name: 'TEST-MPC-003 artifact-reference:non-absolute-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file:model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:non-normal-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file:///var//juanerai-artifacts/model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:credentialed-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file://user:pass@localhost/var/model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:query-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file:///var/model.bin?token=secret' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:fragment-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file:///var/model.bin#latest' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:traversal-file-URI', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file:///var/../private/model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 artifact-reference:non-local-authority', mutate: (v) => replaceChild(v, 'mlflow', { artifact_uri: 'file://remotehost/var/model.bin' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 cross-field:decision-id', mutate: (v) => replaceChild(v, 'controller_release', { decision_id: 'different-decision' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:decision-time', mutate: (v) => replaceChild(v, 'controller_release', { decided_at: '2026-08-24T00:00:01.000Z' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:package-identity', mutate: (v) => replaceChild(v, 'controller_release', { package_identity: 'other.package' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:package-version', mutate: (v) => replaceChild(v, 'controller_release', { package_version: '9.9.9' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:Artifact-checksum', mutate: (v) => replaceChild(v, 'controller_release', { artifact_sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:evaluation-evidence', mutate: (v) => replaceChild(v, 'controller_release', { evidence_sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:MLflow-experiment', mutate: (v) => replaceChild(v, 'mlflow', { experiment_id: 'other-experiment' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:MLflow-run', mutate: (v) => replaceChild(v, 'mlflow', { run_id: 'other-run' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:registered-model-name', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_name: 'other-model' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:registered-model-version', mutate: (v) => replaceChild(v, 'mlflow', { registered_model_version: '2' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:Artifact-object-checksum', mutate: (v) => replaceChild(v, 'artifact', { sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:Artifact-byte-size', mutate: (v) => replaceChild(v, 'artifact', { byte_size: 2048 }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:Artifact-model-Signature', mutate: (v) => replaceChild(v, 'artifact', { model_signature_sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 cross-field:permission-evidence', mutate: (v) => mutateManifestChild(v, 'manifest', (m) => mutateManifestChild(m, 'permissions', (p) => ({ ...p, network: 'allowed' }))), code: 'MODEL_PACK_PERMISSION_DENIED' },
    { name: 'TEST-MPC-003 release-evidence:invalid-empty-limitations-preserves-nested-code', mutate: (v) => mutateManifestChild(v, 'manifest', (m) => ({ ...m, limitations: [] })), code: 'MODEL_PACK_CONTRACT_INVALID' },
    { name: 'TEST-MPC-003 release-evidence:invalid-license-preserves-nested-code', mutate: (v) => mutateManifestChild(v, 'manifest', (m) => mutateManifestChild(m, 'license', (l) => ({ ...l, license_id: '' }))), code: 'MODEL_PACK_LICENSE_INVALID' },
    { name: 'TEST-MPC-003 release-evidence:invalid-rollback-preserves-nested-code', mutate: (v) => mutateManifestChild(v, 'manifest', (m) => mutateManifestChild(m, 'rollback', (r) => ({ ...r, trigger_conditions: [] }))), code: 'MODEL_PACK_CONTRACT_INVALID' },
  ];
  await runMutationCases(t, releaseCases, releaseInputFixture, (candidate) => fn(module, 'serializeModelPackReleaseInput')(candidate));

  await t.test('TEST-MPC-003 release-vs-observation:valid-release-URI-conflict-is-admission-only-mismatch', () => {
    const release = replaceChild(releaseInputFixture(), 'mlflow', {
      artifact_uri: 'file:///var/juanerai-artifacts/alternate/model.bin',
    });
    const bytes = fn(module, 'serializeModelPackReleaseInput')(release) as Uint8Array;
    assert.deepEqual(bytes, canonicalBytes(release));
    assert.throws(() => fn(module, 'admitModelPackReleaseInput')({
      release_input_bytes: bytes,
      artifact_observation: artifactObservationFixture(),
      expected_package: expectedPackageFixture(),
    }), (error) => assertError(error, 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH'));
  });

  const releaseBytes = fn(module, 'serializeModelPackReleaseInput')(releaseInputFixture()) as Uint8Array;
  const validAlternateObservationSingletons: readonly Readonly<{
    name: string;
    patch: RecordValue;
  }>[] = [
    {
      name: 'TEST-MPC-003 observation-singleton:alternate-valid-controller-authorization-has-no-mismatch-oracle',
      patch: { controller_authorization_id: 'authorization-002' },
    },
    {
      name: 'TEST-MPC-003 observation-singleton:alternate-valid-approved-store-has-no-mismatch-oracle',
      patch: { approved_store_id: 'store-002' },
    },
    {
      name: 'TEST-MPC-003 observation-singleton:alternate-valid-location-evidence-has-no-mismatch-oracle',
      patch: { evidence_sha256: hash('3') },
    },
  ];
  for (const entry of validAlternateObservationSingletons) {
    await t.test(entry.name, () => {
      const observation = replaceChild(artifactObservationFixture(), 'location_verification', entry.patch);
      assert.deepEqual(fn(module, 'admitModelPackReleaseInput')({
        release_input_bytes: releaseBytes,
        artifact_observation: observation,
        expected_package: expectedPackageFixture(),
      }), releaseInputFixture());
    });
  }
  const expectedCases: Mutation[] = [
    { name: 'TEST-MPC-003 expected-package:identity', mutate: (v) => ({ ...v, identity: 'other.package' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-003 expected-package:version', mutate: (v) => ({ ...v, version: '9.9.9' }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
    { name: 'TEST-MPC-003 expected-package:Artifact-checksum', mutate: (v) => ({ ...v, artifact_sha256: hash('0') }), code: 'MODEL_PACK_IDENTITY_MISMATCH' },
  ];
  await runMutationCases(t, expectedCases, expectedPackageFixture, (candidate) => fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: releaseBytes, artifact_observation: artifactObservationFixture(), expected_package: candidate }));

  const observationCases: Mutation[] = [
    { name: 'TEST-MPC-003 observation:Artifact-URI-conflict', mutate: (v) => ({ ...v, artifact_uri: 'file:///var/juanerai-artifacts/other/model.bin' }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 observation:checksum-conflict', mutate: (v) => ({ ...v, sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 observation:byte-size-conflict', mutate: (v) => ({ ...v, byte_size: 2048 }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 observation:model-Signature-conflict', mutate: (v) => ({ ...v, model_signature_sha256: hash('0') }), code: 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' },
    { name: 'TEST-MPC-003 observation:wrong-location-verification-kind', mutate: (v) => replaceChild(v, 'location_verification', { kind: 'unverified_local_path' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:lacks-controller-authorization', mutate: (v) => ({ ...v, location_verification: remove(v.location_verification as RecordValue, 'controller_authorization_id') }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:invalid-controller-authorization', mutate: (v) => replaceChild(v, 'location_verification', { controller_authorization_id: '' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:lacks-approved-store', mutate: (v) => ({ ...v, location_verification: remove(v.location_verification as RecordValue, 'approved_store_id') }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:invalid-approved-store', mutate: (v) => replaceChild(v, 'location_verification', { approved_store_id: '/var/artifacts' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:lacks-location-evidence', mutate: (v) => ({ ...v, location_verification: remove(v.location_verification as RecordValue, 'evidence_sha256') }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
    { name: 'TEST-MPC-003 observation:invalid-location-evidence', mutate: (v) => replaceChild(v, 'location_verification', { evidence_sha256: 'bad' }), code: 'MODEL_PACK_RELEASE_REFERENCE_INVALID' },
  ];
  await runMutationCases(t, observationCases, artifactObservationFixture, (candidate) => fn(module, 'admitModelPackReleaseInput')({ release_input_bytes: releaseBytes, artifact_observation: candidate, expected_package: expectedPackageFixture() }));
}
