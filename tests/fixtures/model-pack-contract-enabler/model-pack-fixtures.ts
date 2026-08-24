import { createHash } from 'node:crypto';

export const FIXED_EPOCH_MS = Date.parse('2026-08-24T00:00:00.000Z');
export const encoder = new TextEncoder();
export const sha256 = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');

export type RecordValue = Record<string, unknown>;

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export const hash = (letter: string) => letter.repeat(64);
export const categoryOrder = Object.freeze(['beverages', 'snacks'] as const);

export function manifestFixture(): RecordValue {
  return deepFreeze({
    schema_version: '1.0',
    package: { identity: 'juanerai.sales-demand-forecast', version: '1.0.0', artifact: { sha256: hash('a'), byte_size: 1024, model_signature_sha256: hash('b') } },
    compatibility: { juanerai_contract_version: '1.0', input_contract: 'sales-demand-forecast-input/1.0', output_contract: 'sales-demand-forecast-output/1.0' },
    purpose: { approved_use: 'category_demand_forecast_28_day_planning_review', prohibited_uses: ['automatic_replenishment', 'automatic_pricing', 'automatic_marketing_or_outreach', 'customer_level_prediction', 'observed_outcome_claim', 'causal_claim', 'authorized_decision_claim', 'action_execution'] },
    io: { horizon_days: 28, minimum_history_days: 56, grain: 'utc_day_product_category', supported_currency: 'USD', supported_product_categories: [...categoryOrder] },
    runtime: { execution: 'local', deterministic: true, online_learning: false, runtime: { identity: 'juanerai.local-sales-runtime', version: '1.0.0' }, dependencies: [{ identity: 'juanerai.forecast-kernel', version: '1.0.0' }] },
    permissions: { data: 'local_only', network: 'none', external_data: 'none', mlflow_at_runtime: 'none', training_workspace_at_runtime: 'none', source_write: 'forbidden', model_execution: 'local_only' },
    provenance: { controller_release_decision_id: 'decision-001', released_at: '2026-08-24T00:00:00.000Z', mlflow_experiment_id: 'experiment-001', mlflow_run_id: 'run-001', registered_model_name: 'sales-demand-forecast', registered_model_version: '1', training_data_sha256: hash('c'), training_code_revision: 'revision-001', evaluation_evidence_sha256: hash('d') },
    evaluation: { contract: 'sales-demand-forecast-evaluation/1.0', observed_order_count_relative_wape_improvement: '0.06', observed_net_order_amount_relative_wape_improvement: '0.11', observed_key_category_wape_regression_max_percentage_points: '4', observed_interval_coverage: '0.80', observed_summary_sha256: hash('e') },
    limitations: ['planning review only'],
    confidence: { kind: 'prediction_interval', nominal_coverage: '0.80', evidence_sha256: hash('f') },
    license: { license_id: 'Apache-2.0', terms_sha256: hash('1') },
    revocation_policy: { release_status_contract: 'model-pack-release-status/1.0' },
    rollback: { previous_stable_package: null, trigger_conditions: ['controller revocation'] },
  });
}

export function expectedPackageFixture(): RecordValue {
  return deepFreeze({ identity: 'juanerai.sales-demand-forecast', version: '1.0.0', artifact_sha256: hash('a') });
}

export function artifactObservationFixture(): RecordValue {
  return deepFreeze({
    schema_version: '1.0',
    artifact_uri: 'file:///var/juanerai-artifacts/sales-demand-forecast-1.0.0/model.bin',
    location_verification: { kind: 'controller_authorized_local_artifact_store', controller_authorization_id: 'authorization-001', approved_store_id: 'store-001', evidence_sha256: hash('2') },
    sha256: hash('a'),
    byte_size: 1024,
    model_signature_sha256: hash('b'),
  });
}

export function releaseStatusFixture(state: 'released' | 'revoked' = 'released'): RecordValue {
  return deepFreeze({ schema_version: '1.0', package: expectedPackageFixture(), state, controller: { decision_id: 'decision-001', evidence_id: 'evidence-001', decided_at: '2026-08-24T00:00:00.000Z' } });
}

export function releaseInputFixture(): RecordValue {
  return deepFreeze({
    schema_version: '1.0',
    stage: 'MP9_MODEL_RELEASED',
    controller_release: { decision: 'model_released', decision_id: 'decision-001', decided_at: '2026-08-24T00:00:00.000Z', package_identity: 'juanerai.sales-demand-forecast', package_version: '1.0.0', artifact_sha256: hash('a'), evidence_sha256: hash('d') },
    mlflow: { experiment_id: 'experiment-001', run_id: 'run-001', registered_model_name: 'sales-demand-forecast', registered_model_version: '1', artifact_uri: 'file:///var/juanerai-artifacts/sales-demand-forecast-1.0.0/model.bin' },
    artifact: clone((manifestFixture().package as RecordValue).artifact),
    manifest: manifestFixture(),
  });
}

export function dateAt(offset: number): string {
  return new Date(Date.UTC(2026, 5, 1 + offset)).toISOString().slice(0, 10);
}

export function inputFixture(): RecordValue {
  const history: RecordValue[] = [];
  for (let day = 0; day < 56; day += 1) {
    for (const [index, product_category] of categoryOrder.entries()) {
      history.push({ business_date: dateAt(day), product_category, order_count: 10 + index, gross_order_amount: index === 0 ? '100.00' : '50.00', discount_amount: index === 0 ? '10.00' : '0' });
    }
  }
  return deepFreeze({ contract_version: '1.0', as_of_date: dateAt(55), currency: 'USD', history });
}

export function forecastFixture(input: RecordValue = inputFixture()): RecordValue {
  const asOf = String(input.as_of_date);
  const next = Date.parse(`${asOf}T00:00:00.000Z`);
  const predictions: RecordValue[] = [];
  for (let day = 1; day <= 28; day += 1) {
    for (const [index, product_category] of categoryOrder.entries()) {
      predictions.push({ business_date: new Date(next + day * 86_400_000).toISOString().slice(0, 10), product_category, predicted_order_count: index === 0 ? '10' : '11', predicted_net_order_amount: index === 0 ? '90.00' : '50.00', order_count_interval_80: { lower: index === 0 ? '8' : '9', upper: index === 0 ? '12' : '13' }, net_order_amount_interval_80: { lower: index === 0 ? '80.00' : '40.00', upper: index === 0 ? '100.00' : '60.00' } });
    }
  }
  return deepFreeze({ contract_version: '1.0', as_of_date: asOf, currency: 'USD', predictions });
}

export function snapshotFixture(): RecordValue {
  const input = inputFixture();
  return deepFreeze({ snapshot_id: 'snapshot-001', confirmed_at: '2026-08-24T00:00:00.000Z', sha256: sha256(canonicalBytes(input)), input });
}

export function bindingFixture(): RecordValue {
  const manifest = manifestFixture();
  return deepFreeze({ runtime: clone((manifest.runtime as RecordValue).runtime), adapter: { identity: 'juanerai.local-predictor-adapter', version: '1.0.0' }, dependencies: clone((manifest.runtime as RecordValue).dependencies), permissions: clone(manifest.permissions) });
}

export function canonicalBytes(value: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(value));
}

export function assertFixtureHealth(): void {
  const manifest = manifestFixture();
  const input = inputFixture();
  const forecast = forecastFixture(input);
  const release = releaseInputFixture();
  assertDeepFrozen(manifest);
  assertDeepFrozen(input);
  assertDeepFrozen(forecast);
  assertDeepFrozen(release);
  if ((input.history as unknown[]).length !== 112) throw new Error('fixture input cardinality invalid');
  if ((forecast.predictions as unknown[]).length !== 56) throw new Error('fixture forecast cardinality invalid');
  if (String((input.history as RecordValue[]).at(-1)?.business_date) !== '2026-07-26') throw new Error('fixture history end invalid');
  if (String((forecast.predictions as RecordValue[])[0].business_date) !== '2026-07-27') throw new Error('fixture horizon start invalid');
  if (String((forecast.predictions as RecordValue[]).at(-1)?.business_date) !== '2026-08-23') throw new Error('fixture horizon end invalid');
  if (sha256(canonicalBytes(input)) !== String(snapshotFixture().sha256)) throw new Error('fixture snapshot invalid');
  if (String((release.controller_release as RecordValue).evidence_sha256) !== String((manifest.provenance as RecordValue).evaluation_evidence_sha256)) throw new Error('fixture release evidence invalid');
}

function assertDeepFrozen(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (!Object.isFrozen(value)) throw new Error('fixture is not deeply frozen');
  for (const child of Object.values(value as RecordValue)) assertDeepFrozen(child);
}
