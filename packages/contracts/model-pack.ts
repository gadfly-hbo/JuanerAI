import { TextDecoder, TextEncoder } from 'node:util';

export type ModelPackIdentityV1 = Readonly<{ identity: 'juanerai.sales-demand-forecast'; version: string; artifact_sha256: string }>;
export type IdentityVersionV1 = Readonly<{ identity: string; version: string }>;
export type ModelPackArtifactV1 = Readonly<{ sha256: string; byte_size: number; model_signature_sha256: string }>;
export type ModelPackPermissionsV1 = Readonly<{ data: 'local_only'; network: 'none'; external_data: 'none'; mlflow_at_runtime: 'none'; training_workspace_at_runtime: 'none'; source_write: 'forbidden'; model_execution: 'local_only' }>;
export type ModelPackManifestV1 = Readonly<{ schema_version: '1.0'; package: Readonly<{ identity: 'juanerai.sales-demand-forecast'; version: string; artifact: ModelPackArtifactV1 }>; compatibility: Readonly<{ juanerai_contract_version: '1.0'; input_contract: 'sales-demand-forecast-input/1.0'; output_contract: 'sales-demand-forecast-output/1.0' }>; purpose: Readonly<{ approved_use: 'category_demand_forecast_28_day_planning_review'; prohibited_uses: readonly ['automatic_replenishment', 'automatic_pricing', 'automatic_marketing_or_outreach', 'customer_level_prediction', 'observed_outcome_claim', 'causal_claim', 'authorized_decision_claim', 'action_execution'] }>; io: Readonly<{ horizon_days: 28; minimum_history_days: 56; grain: 'utc_day_product_category'; supported_currency: string; supported_product_categories: readonly string[] }>; runtime: Readonly<{ execution: 'local'; deterministic: true; online_learning: false; runtime: IdentityVersionV1; dependencies: readonly IdentityVersionV1[] }>; permissions: ModelPackPermissionsV1; provenance: Readonly<{ controller_release_decision_id: string; released_at: string; mlflow_experiment_id: string; mlflow_run_id: string; registered_model_name: string; registered_model_version: string; training_data_sha256: string; training_code_revision: string; evaluation_evidence_sha256: string }>; evaluation: Readonly<{ contract: 'sales-demand-forecast-evaluation/1.0'; observed_order_count_relative_wape_improvement: string; observed_net_order_amount_relative_wape_improvement: string; observed_key_category_wape_regression_max_percentage_points: string; observed_interval_coverage: string; observed_summary_sha256: string }>; limitations: readonly string[]; confidence: Readonly<{ kind: 'prediction_interval'; nominal_coverage: '0.80'; evidence_sha256: string }>; license: Readonly<{ license_id: string; terms_sha256: string }>; revocation_policy: Readonly<{ release_status_contract: 'model-pack-release-status/1.0' }>; rollback: Readonly<{ previous_stable_package: ModelPackIdentityV1 | null; trigger_conditions: readonly string[] }> }>;
export type ModelPackReleaseStatusV1 = Readonly<{ schema_version: '1.0'; package: ModelPackIdentityV1; state: 'released' | 'revoked'; controller: Readonly<{ decision_id: string; evidence_id: string; decided_at: string }> }>;
export type ArtifactLocationVerificationV1 = Readonly<{ kind: 'controller_authorized_local_artifact_store'; controller_authorization_id: string; approved_store_id: string; evidence_sha256: string }>;
export type ArtifactObservationV1 = Readonly<{ schema_version: '1.0'; artifact_uri: string; location_verification: ArtifactLocationVerificationV1; sha256: string; byte_size: number; model_signature_sha256: string }>;
export type ModelPackReleaseInputV1 = Readonly<{ schema_version: '1.0'; stage: 'MP9_MODEL_RELEASED'; controller_release: Readonly<{ decision: 'model_released'; decision_id: string; decided_at: string; package_identity: 'juanerai.sales-demand-forecast'; package_version: string; artifact_sha256: string; evidence_sha256: string }>; mlflow: Readonly<{ experiment_id: string; run_id: string; registered_model_name: string; registered_model_version: string; artifact_uri: string }>; artifact: ModelPackArtifactV1; manifest: ModelPackManifestV1 }>;
export type CategoryDemandHistoryRowV1 = Readonly<{ business_date: string; product_category: string; order_count: number; gross_order_amount: string; discount_amount: string }>;
export type CategoryDemandInputV1 = Readonly<{ contract_version: '1.0'; as_of_date: string; currency: string; history: readonly CategoryDemandHistoryRowV1[] }>;
export type ConfirmedCategoryDemandSnapshotV1 = Readonly<{ snapshot_id: string; confirmed_at: string; sha256: string; input: CategoryDemandInputV1 }>;
export type PredictionInterval80V1 = Readonly<{ lower: string; upper: string }>;
export type CategoryDemandPredictionRowV1 = Readonly<{ business_date: string; product_category: string; predicted_order_count: string; predicted_net_order_amount: string; order_count_interval_80: PredictionInterval80V1; net_order_amount_interval_80: PredictionInterval80V1 }>;
export type CategoryDemandForecastV1 = Readonly<{ contract_version: '1.0'; as_of_date: string; currency: string; predictions: readonly CategoryDemandPredictionRowV1[] }>;
export type CategoryDemandForecastProvenanceV1 = Readonly<{ run_id: string; package: ModelPackIdentityV1; model: Readonly<{ controller_release_decision_id: string; mlflow_run_id: string; registered_model_name: string; registered_model_version: string }>; release_status: ModelPackReleaseStatusV1; input_snapshot: Readonly<{ snapshot_id: string; sha256: string; confirmed_at: string; as_of_date: string }>; runtime: IdentityVersionV1; adapter: IdentityVersionV1 }>;
export type CategoryDemandForecastResultV1 = Readonly<{ forecast: CategoryDemandForecastV1; provenance: CategoryDemandForecastProvenanceV1 }>;

export const MODEL_PACK_IDENTITY: 'juanerai.sales-demand-forecast' = 'juanerai.sales-demand-forecast';
export const MODEL_PACK_CONTRACT_VERSION: '1.0' = '1.0';
export type ModelPackErrorCode = 'MODEL_PACK_CONTRACT_INVALID' | 'MODEL_PACK_CONTRACT_UNSUPPORTED' | 'MODEL_PACK_IDENTITY_MISMATCH' | 'MODEL_PACK_ARTIFACT_MISMATCH' | 'MODEL_PACK_PERMISSION_DENIED' | 'MODEL_PACK_LICENSE_INVALID' | 'MODEL_PACK_REVOKED' | 'MODEL_PACK_RUNTIME_INCOMPATIBLE' | 'MODEL_PACK_INPUT_INVALID' | 'MODEL_PACK_OUTPUT_INVALID' | 'MODEL_PACK_RELEASE_REQUIRED' | 'MODEL_PACK_RELEASE_REFERENCE_INVALID' | 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH' | 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE' | 'ANALYTICAL_MODEL_INPUT_CHANGED' | 'ANALYTICAL_MODEL_RUN_ALREADY_STARTED' | 'ANALYTICAL_MODEL_CANCELLED' | 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED' | 'ANALYTICAL_MODEL_RUNTIME_FAILED';
export const MODEL_PACK_ERROR_CODES: readonly ModelPackErrorCode[] = Object.freeze(['MODEL_PACK_CONTRACT_INVALID', 'MODEL_PACK_CONTRACT_UNSUPPORTED', 'MODEL_PACK_IDENTITY_MISMATCH', 'MODEL_PACK_ARTIFACT_MISMATCH', 'MODEL_PACK_PERMISSION_DENIED', 'MODEL_PACK_LICENSE_INVALID', 'MODEL_PACK_REVOKED', 'MODEL_PACK_RUNTIME_INCOMPATIBLE', 'MODEL_PACK_INPUT_INVALID', 'MODEL_PACK_OUTPUT_INVALID', 'MODEL_PACK_RELEASE_REQUIRED', 'MODEL_PACK_RELEASE_REFERENCE_INVALID', 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH', 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE', 'ANALYTICAL_MODEL_INPUT_CHANGED', 'ANALYTICAL_MODEL_RUN_ALREADY_STARTED', 'ANALYTICAL_MODEL_CANCELLED', 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED', 'ANALYTICAL_MODEL_RUNTIME_FAILED']);
export type ModelPackContractError = Error & Readonly<{ name: 'ModelPackContractError'; code: ModelPackErrorCode }>;

type RecordValue = Record<string, unknown>;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const sha = /^[0-9a-f]{64}$/;
const semver = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const decimal = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
const utcDate = /^\d{4}-\d{2}-\d{2}$/;
const utcInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const prohibited = ['automatic_replenishment', 'automatic_pricing', 'automatic_marketing_or_outreach', 'customer_level_prediction', 'observed_outcome_claim', 'causal_claim', 'authorized_decision_claim', 'action_execution'];
const errorCarriers = new WeakSet<object>();

const createModelPackError = (code: ModelPackErrorCode, trusted: boolean): ModelPackContractError => {
  const error = new Error(code) as ModelPackContractError;
  Object.defineProperty(error, 'name', { value: 'ModelPackContractError', enumerable: true });
  Object.defineProperty(error, 'code', { value: code, enumerable: true });
  if (trusted) errorCarriers.add(error);
  return error;
};
export function modelPackError(code: ModelPackErrorCode): ModelPackContractError { return createModelPackError(code, false); }
const trustedModelPackError = (code: ModelPackErrorCode): ModelPackContractError => createModelPackError(code, true);
const fail = (code: ModelPackErrorCode): never => { throw trustedModelPackError(code); };
const modelPackErrorCode = (reason: unknown): ModelPackErrorCode | undefined => {
  if (!reason || typeof reason !== 'object' || !errorCarriers.has(reason)) return undefined;
  try {
    const name = Object.getOwnPropertyDescriptor(reason, 'name')?.value;
    const code = Object.getOwnPropertyDescriptor(reason, 'code')?.value;
    const message = Object.getOwnPropertyDescriptor(reason, 'message')?.value;
    return name === 'ModelPackContractError' && message === code && typeof code === 'string' && MODEL_PACK_ERROR_CODES.includes(code as ModelPackErrorCode) ? code as ModelPackErrorCode : undefined;
  } catch { return undefined; }
};
const sanitized = <T>(code: ModelPackErrorCode, operation: () => T): T => {
  try { return operation(); } catch (reason) { throw trustedModelPackError(modelPackErrorCode(reason) ?? code); }
};
const record = (value: unknown, keys: readonly string[], code: ModelPackErrorCode): RecordValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value as object, key))) return fail(code);
  return value as RecordValue;
};
const string = (value: unknown, code: ModelPackErrorCode): string => typeof value === 'string' ? value : fail(code);
const nonempty = (value: unknown, code: ModelPackErrorCode): string => {
  const output = string(value, code);
  return output.length > 0 && output.trim() === output && !/[\p{Cc}]/u.test(output) ? output : fail(code);
};
const businessIdentity = (value: unknown, code: ModelPackErrorCode): string => {
  const output = nonempty(value, code);
  return /^(latest|alias)$/i.test(output) || /[\\/]/.test(output) ? fail(code) : output;
};
const governedIdentity = (value: unknown, code: ModelPackErrorCode): string => {
  const output = businessIdentity(value, code);
  return Array.from(output).length <= 256 && !/[\p{C}@]/u.test(output) ? output : fail(code);
};
const checksum = (value: unknown, code: ModelPackErrorCode): string => sha.test(string(value, code)) ? value as string : fail(code);
const stableVersion = (value: unknown, code: ModelPackErrorCode): string => semver.test(string(value, code)) ? value as string : fail(code);
const exact = <T>(value: unknown, expected: T, code: ModelPackErrorCode): T => value === expected ? expected : fail(code);
const date = (value: unknown, code: ModelPackErrorCode): string => {
  const output = string(value, code);
  return utcDate.test(output) && new Date(`${output}T00:00:00.000Z`).toISOString().slice(0, 10) === output ? output : fail(code);
};
const instant = (value: unknown, code: ModelPackErrorCode): string => {
  const output = string(value, code);
  return utcInstant.test(output) && new Date(output).toISOString() === output ? output : fail(code);
};
const safePositive = (value: unknown, code: ModelPackErrorCode): number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : fail(code);
const nonnegative = (value: unknown, code: ModelPackErrorCode): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fail(code);
const decimalString = (value: unknown, code: ModelPackErrorCode): string => decimal.test(string(value, code)) ? value as string : fail(code);
const compareDecimalStrings = (left: string, right: string): number => {
  const [leftInteger, leftFraction = ''] = left.split('.'); const [rightInteger, rightFraction = ''] = right.split('.');
  if (leftInteger.length !== rightInteger.length) return leftInteger.length < rightInteger.length ? -1 : 1;
  if (leftInteger !== rightInteger) return leftInteger < rightInteger ? -1 : 1;
  const length = Math.max(leftFraction.length, rightFraction.length); const leftDigits = leftFraction.padEnd(length, '0'); const rightDigits = rightFraction.padEnd(length, '0');
  return leftDigits === rightDigits ? 0 : leftDigits < rightDigits ? -1 : 1;
};
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as object)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};
const detached = <T>(value: T): T => deepFreeze(structuredClone(value));
const idsEqual = (a: ModelPackIdentityV1, b: ModelPackIdentityV1): boolean => a.identity === b.identity && a.version === b.version && a.artifact_sha256 === b.artifact_sha256;
const identity = (candidate: unknown, code: ModelPackErrorCode, stable = true): ModelPackIdentityV1 => {
  const value = record(candidate, ['identity', 'version', 'artifact_sha256'], code);
  return { identity: exact(value.identity, MODEL_PACK_IDENTITY, code), version: stable ? stableVersion(value.version, code) : nonempty(value.version, code), artifact_sha256: checksum(value.artifact_sha256, code) };
};
const identityVersion = (candidate: unknown, code: ModelPackErrorCode): IdentityVersionV1 => {
  const value = record(candidate, ['identity', 'version'], code);
  const identityValue = governedIdentity(value.identity, code);
  return { identity: identityValue, version: stableVersion(value.version, code) };
};
const artifact = (candidate: unknown, code: ModelPackErrorCode): ModelPackArtifactV1 => {
  const value = record(candidate, ['sha256', 'byte_size', 'model_signature_sha256'], code);
  return { sha256: checksum(value.sha256, code), byte_size: safePositive(value.byte_size, code), model_signature_sha256: checksum(value.model_signature_sha256, code) };
};
const permissions = (candidate: unknown, code: ModelPackErrorCode): ModelPackPermissionsV1 => {
  const keys = ['data', 'network', 'external_data', 'mlflow_at_runtime', 'training_workspace_at_runtime', 'source_write', 'model_execution'] as const;
  try {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return fail('MODEL_PACK_PERMISSION_DENIED');
    const names = Reflect.ownKeys(candidate);
    if (names.length !== keys.length || names.some((name) => typeof name !== 'string' || !keys.includes(name as typeof keys[number])) || !keys.every((key) => Object.hasOwn(candidate, key))) return fail('MODEL_PACK_PERMISSION_DENIED');
    const value = candidate as RecordValue;
    if (value.data !== 'local_only' || value.network !== 'none' || value.external_data !== 'none' || value.mlflow_at_runtime !== 'none' || value.training_workspace_at_runtime !== 'none' || value.source_write !== 'forbidden' || value.model_execution !== 'local_only') return fail('MODEL_PACK_PERMISSION_DENIED');
    return { data: 'local_only', network: 'none', external_data: 'none', mlflow_at_runtime: 'none', training_workspace_at_runtime: 'none', source_write: 'forbidden', model_execution: 'local_only' };
  } catch { return fail('MODEL_PACK_PERMISSION_DENIED'); }
};
const closedArray = (candidate: unknown): candidate is unknown[] => {
  if (!Array.isArray(candidate)) return false;
  const keys = Reflect.ownKeys(candidate);
  return keys.length === candidate.length + 1 && Object.hasOwn(candidate, 'length') && Array.from({ length: candidate.length }, (_, index) => Object.hasOwn(candidate, index)).every(Boolean);
};
const categories = (candidate: unknown, code: ModelPackErrorCode): readonly string[] => {
  if (!closedArray(candidate) || candidate.length === 0) return fail(code);
  const values = candidate.map((entry) => nonempty(entry, code));
  if (new Set(values).size !== values.length || values.some((entry) => { const scalars = Array.from(entry); return entry.normalize('NFC') !== entry || scalars.length > 128 || scalars.some((scalar) => scalar.length === 1 && scalar.charCodeAt(0) >= 0xd800 && scalar.charCodeAt(0) <= 0xdfff) || /[\\/]/.test(entry) || entry === '.' || entry === '..'; })) return fail(code);
  return values;
};
const stringList = (candidate: unknown, code: ModelPackErrorCode): readonly string[] => {
  if (!closedArray(candidate) || candidate.length === 0) return fail(code);
  return candidate.map((entry) => nonempty(entry, code));
};

function validateManifest(candidate: unknown): ModelPackManifestV1 {
  const value = record(candidate, ['schema_version', 'package', 'compatibility', 'purpose', 'io', 'runtime', 'permissions', 'provenance', 'evaluation', 'limitations', 'confidence', 'license', 'revocation_policy', 'rollback'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(value.schema_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED');
  const packageValue = record(value.package, ['identity', 'version', 'artifact'], 'MODEL_PACK_CONTRACT_INVALID');
  const packageIdentity = exact(packageValue.identity, MODEL_PACK_IDENTITY, 'MODEL_PACK_CONTRACT_INVALID');
  const packageVersion = stableVersion(packageValue.version, 'MODEL_PACK_CONTRACT_INVALID');
  const packageArtifact = artifact(packageValue.artifact, 'MODEL_PACK_CONTRACT_INVALID');
  const compatibility = record(value.compatibility, ['juanerai_contract_version', 'input_contract', 'output_contract'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(compatibility.juanerai_contract_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED'); exact(compatibility.input_contract, 'sales-demand-forecast-input/1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED'); exact(compatibility.output_contract, 'sales-demand-forecast-output/1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED');
  const purpose = record(value.purpose, ['approved_use', 'prohibited_uses'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(purpose.approved_use, 'category_demand_forecast_28_day_planning_review', 'MODEL_PACK_CONTRACT_INVALID');
  if (!closedArray(purpose.prohibited_uses) || purpose.prohibited_uses.length !== prohibited.length || purpose.prohibited_uses.some((entry, i) => entry !== prohibited[i])) return fail('MODEL_PACK_CONTRACT_INVALID');
  const io = record(value.io, ['horizon_days', 'minimum_history_days', 'grain', 'supported_currency', 'supported_product_categories'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(io.horizon_days, 28, 'MODEL_PACK_CONTRACT_INVALID'); exact(io.minimum_history_days, 56, 'MODEL_PACK_CONTRACT_INVALID'); exact(io.grain, 'utc_day_product_category', 'MODEL_PACK_CONTRACT_INVALID');
  const currency = nonempty(io.supported_currency, 'MODEL_PACK_CONTRACT_INVALID'); if (!/^[A-Za-z0-9._-]+$/.test(currency)) return fail('MODEL_PACK_CONTRACT_INVALID');
  const supportedCategories = categories(io.supported_product_categories, 'MODEL_PACK_CONTRACT_INVALID');
  const runtime = record(value.runtime, ['execution', 'deterministic', 'online_learning', 'runtime', 'dependencies'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(runtime.execution, 'local', 'MODEL_PACK_CONTRACT_INVALID'); exact(runtime.deterministic, true, 'MODEL_PACK_CONTRACT_INVALID'); if (runtime.online_learning !== false) return fail('MODEL_PACK_PERMISSION_DENIED');
  if (!closedArray(runtime.dependencies)) return fail('MODEL_PACK_CONTRACT_INVALID');
  const runtimeIdentity = identityVersion(runtime.runtime, 'MODEL_PACK_CONTRACT_INVALID'); const dependencies = runtime.dependencies.map((entry) => identityVersion(entry, 'MODEL_PACK_CONTRACT_INVALID'));
  const permissionValues = permissions(value.permissions, 'MODEL_PACK_CONTRACT_INVALID');
  const provenance = record(value.provenance, ['controller_release_decision_id', 'released_at', 'mlflow_experiment_id', 'mlflow_run_id', 'registered_model_name', 'registered_model_version', 'training_data_sha256', 'training_code_revision', 'evaluation_evidence_sha256'], 'MODEL_PACK_CONTRACT_INVALID');
  const p = { controller_release_decision_id: governedIdentity(provenance.controller_release_decision_id, 'MODEL_PACK_CONTRACT_INVALID'), released_at: instant(provenance.released_at, 'MODEL_PACK_CONTRACT_INVALID'), mlflow_experiment_id: governedIdentity(provenance.mlflow_experiment_id, 'MODEL_PACK_CONTRACT_INVALID'), mlflow_run_id: governedIdentity(provenance.mlflow_run_id, 'MODEL_PACK_CONTRACT_INVALID'), registered_model_name: governedIdentity(provenance.registered_model_name, 'MODEL_PACK_CONTRACT_INVALID'), registered_model_version: governedIdentity(provenance.registered_model_version, 'MODEL_PACK_CONTRACT_INVALID'), training_data_sha256: checksum(provenance.training_data_sha256, 'MODEL_PACK_CONTRACT_INVALID'), training_code_revision: governedIdentity(provenance.training_code_revision, 'MODEL_PACK_CONTRACT_INVALID'), evaluation_evidence_sha256: checksum(provenance.evaluation_evidence_sha256, 'MODEL_PACK_CONTRACT_INVALID') };
  const evaluation = record(value.evaluation, ['contract', 'observed_order_count_relative_wape_improvement', 'observed_net_order_amount_relative_wape_improvement', 'observed_key_category_wape_regression_max_percentage_points', 'observed_interval_coverage', 'observed_summary_sha256'], 'MODEL_PACK_CONTRACT_INVALID');
  exact(evaluation.contract, 'sales-demand-forecast-evaluation/1.0', 'MODEL_PACK_CONTRACT_INVALID');
  const e = { observed_order_count_relative_wape_improvement: decimalString(evaluation.observed_order_count_relative_wape_improvement, 'MODEL_PACK_CONTRACT_INVALID'), observed_net_order_amount_relative_wape_improvement: decimalString(evaluation.observed_net_order_amount_relative_wape_improvement, 'MODEL_PACK_CONTRACT_INVALID'), observed_key_category_wape_regression_max_percentage_points: decimalString(evaluation.observed_key_category_wape_regression_max_percentage_points, 'MODEL_PACK_CONTRACT_INVALID'), observed_interval_coverage: decimalString(evaluation.observed_interval_coverage, 'MODEL_PACK_CONTRACT_INVALID'), observed_summary_sha256: checksum(evaluation.observed_summary_sha256, 'MODEL_PACK_CONTRACT_INVALID') };
  if (compareDecimalStrings(e.observed_order_count_relative_wape_improvement, '0.05') < 0 || compareDecimalStrings(e.observed_net_order_amount_relative_wape_improvement, '0.10') < 0 || compareDecimalStrings(e.observed_key_category_wape_regression_max_percentage_points, '5') > 0 || compareDecimalStrings(e.observed_interval_coverage, '0.70') < 0 || compareDecimalStrings(e.observed_interval_coverage, '0.90') > 0) return fail('MODEL_PACK_CONTRACT_INVALID');
  const limitationValues = stringList(value.limitations, 'MODEL_PACK_CONTRACT_INVALID');
  const confidence = record(value.confidence, ['kind', 'nominal_coverage', 'evidence_sha256'], 'MODEL_PACK_CONTRACT_INVALID'); exact(confidence.kind, 'prediction_interval', 'MODEL_PACK_CONTRACT_INVALID'); exact(confidence.nominal_coverage, '0.80', 'MODEL_PACK_CONTRACT_INVALID'); const confidenceEvidence = checksum(confidence.evidence_sha256, 'MODEL_PACK_CONTRACT_INVALID');
  const license = record(value.license, ['license_id', 'terms_sha256'], 'MODEL_PACK_CONTRACT_INVALID'); const licenseId = governedIdentity(license.license_id, 'MODEL_PACK_LICENSE_INVALID'); const termsSha = checksum(license.terms_sha256, 'MODEL_PACK_LICENSE_INVALID');
  const revocation = record(value.revocation_policy, ['release_status_contract'], 'MODEL_PACK_CONTRACT_INVALID'); exact(revocation.release_status_contract, 'model-pack-release-status/1.0', 'MODEL_PACK_CONTRACT_INVALID');
  const rollback = record(value.rollback, ['previous_stable_package', 'trigger_conditions'], 'MODEL_PACK_CONTRACT_INVALID'); const previous = rollback.previous_stable_package === null ? null : identity(rollback.previous_stable_package, 'MODEL_PACK_CONTRACT_INVALID'); const triggerConditions = stringList(rollback.trigger_conditions, 'MODEL_PACK_CONTRACT_INVALID');
  return detached({ schema_version: '1.0', package: { identity: packageIdentity, version: packageVersion, artifact: packageArtifact }, compatibility: { juanerai_contract_version: '1.0', input_contract: 'sales-demand-forecast-input/1.0', output_contract: 'sales-demand-forecast-output/1.0' }, purpose: { approved_use: 'category_demand_forecast_28_day_planning_review', prohibited_uses: prohibited as unknown as ModelPackManifestV1['purpose']['prohibited_uses'] }, io: { horizon_days: 28, minimum_history_days: 56, grain: 'utc_day_product_category', supported_currency: currency, supported_product_categories: supportedCategories }, runtime: { execution: 'local', deterministic: true, online_learning: false, runtime: runtimeIdentity, dependencies }, permissions: permissionValues, provenance: p, evaluation: { contract: 'sales-demand-forecast-evaluation/1.0', ...e }, limitations: limitationValues, confidence: { kind: 'prediction_interval', nominal_coverage: '0.80', evidence_sha256: confidenceEvidence }, license: { license_id: licenseId, terms_sha256: termsSha }, revocation_policy: { release_status_contract: 'model-pack-release-status/1.0' }, rollback: { previous_stable_package: previous, trigger_conditions: triggerConditions } }) as ModelPackManifestV1;
}

const canonical = (value: unknown): Uint8Array => encoder.encode(JSON.stringify(value));
function parseCanonical(bytes: Uint8Array, validator: (value: unknown) => unknown): unknown {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)) return fail('MODEL_PACK_CONTRACT_INVALID');
  let text: string; let parsed: unknown;
  try { text = decoder.decode(bytes); parsed = JSON.parse(text); } catch { return fail('MODEL_PACK_CONTRACT_INVALID'); }
  const admitted = validator(parsed); const expected = decoder.decode(canonical(admitted));
  if (text !== expected) return fail('MODEL_PACK_CONTRACT_INVALID');
  return admitted;
}
const validateObservation = (candidate: unknown, code: ModelPackErrorCode, release = false): ArtifactObservationV1 => {
  try {
    const value = record(candidate, ['schema_version', 'artifact_uri', 'location_verification', 'sha256', 'byte_size', 'model_signature_sha256'], code); exact(value.schema_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED');
    const uri = string(value.artifact_uri, code); if (release) validateFileUri(uri); else if (!uri.startsWith('file:')) return fail(code);
    const location = record(value.location_verification, ['kind', 'controller_authorization_id', 'approved_store_id', 'evidence_sha256'], release ? 'MODEL_PACK_RELEASE_REFERENCE_INVALID' : code);
    const lcode = release ? 'MODEL_PACK_RELEASE_REFERENCE_INVALID' as const : code; exact(location.kind, 'controller_authorized_local_artifact_store', lcode);
    return detached({ schema_version: '1.0', artifact_uri: uri, location_verification: { kind: 'controller_authorized_local_artifact_store', controller_authorization_id: governedIdentity(location.controller_authorization_id, lcode), approved_store_id: governedIdentity(location.approved_store_id, lcode), evidence_sha256: checksum(location.evidence_sha256, lcode) }, sha256: checksum(value.sha256, code), byte_size: safePositive(value.byte_size, code), model_signature_sha256: checksum(value.model_signature_sha256, code) }) as ArtifactObservationV1;
  } catch (reason) { throw trustedModelPackError(modelPackErrorCode(reason) ?? (release ? 'MODEL_PACK_RELEASE_REFERENCE_INVALID' : code)); }
};
function validateFileUri(value: string): void {
  try { const parsed = new URL(value); if (parsed.protocol !== 'file:' || parsed.host || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.href !== value || !parsed.pathname.startsWith('/') || parsed.pathname.includes('//') || parsed.pathname.split('/').some((part) => part === '.' || part === '..' || /%2e/i.test(part) || /^(latest|alias)$/i.test(part))) fail('MODEL_PACK_RELEASE_REFERENCE_INVALID'); } catch (error) { if ((error as { code?: unknown }).code === 'MODEL_PACK_RELEASE_REFERENCE_INVALID') throw error; fail('MODEL_PACK_RELEASE_REFERENCE_INVALID'); }
}

export function serializeModelPackManifest(manifest: ModelPackManifestV1): Uint8Array { return sanitized('MODEL_PACK_CONTRACT_INVALID', () => canonical(validateManifest(manifest))); }
export function admitModelPackManifest(input: Readonly<{ manifest_bytes: Uint8Array; artifact_observation: ArtifactObservationV1; expected_package: ModelPackIdentityV1 }>): ModelPackManifestV1 {
  return sanitized('MODEL_PACK_CONTRACT_INVALID', () => {
    const call = record(input, ['manifest_bytes', 'artifact_observation', 'expected_package'], 'MODEL_PACK_CONTRACT_INVALID'); const manifest = parseCanonical(call.manifest_bytes as Uint8Array, validateManifest) as ModelPackManifestV1; const expected = identity(call.expected_package, 'MODEL_PACK_IDENTITY_MISMATCH');
    const actual: ModelPackIdentityV1 = { identity: manifest.package.identity, version: manifest.package.version, artifact_sha256: manifest.package.artifact.sha256 }; if (!idsEqual(actual, expected)) return fail('MODEL_PACK_IDENTITY_MISMATCH');
    const observation = validateObservation(call.artifact_observation, 'MODEL_PACK_ARTIFACT_MISMATCH'); if (observation.sha256 !== manifest.package.artifact.sha256 || observation.byte_size !== manifest.package.artifact.byte_size || observation.model_signature_sha256 !== manifest.package.artifact.model_signature_sha256) return fail('MODEL_PACK_ARTIFACT_MISMATCH'); return manifest;
  });
}

function validateRelease(candidate: unknown): ModelPackReleaseInputV1 {
  if (!candidate || typeof candidate !== 'object' || (candidate as RecordValue).stage !== 'MP9_MODEL_RELEASED') return fail('MODEL_PACK_RELEASE_REQUIRED');
  if (!(candidate as RecordValue).controller_release || typeof (candidate as RecordValue).controller_release !== 'object' || ((candidate as RecordValue).controller_release as RecordValue).decision !== 'model_released') return fail('MODEL_PACK_RELEASE_REQUIRED');
  const value = record(candidate, ['schema_version', 'stage', 'controller_release', 'mlflow', 'artifact', 'manifest'], 'MODEL_PACK_CONTRACT_INVALID');
  if (value.stage !== 'MP9_MODEL_RELEASED') return fail('MODEL_PACK_RELEASE_REQUIRED'); exact(value.schema_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED');
  const controller = record(value.controller_release, ['decision', 'decision_id', 'decided_at', 'package_identity', 'package_version', 'artifact_sha256', 'evidence_sha256'], 'MODEL_PACK_CONTRACT_INVALID'); if (controller.decision !== 'model_released') return fail('MODEL_PACK_RELEASE_REQUIRED');
  const manifest = validateManifest(value.manifest); const controllerRelease = { decision: 'model_released' as const, decision_id: governedIdentity(controller.decision_id, 'MODEL_PACK_CONTRACT_INVALID'), decided_at: instant(controller.decided_at, 'MODEL_PACK_CONTRACT_INVALID'), package_identity: governedIdentity(controller.package_identity, 'MODEL_PACK_CONTRACT_INVALID'), package_version: stableVersion(controller.package_version, 'MODEL_PACK_CONTRACT_INVALID'), artifact_sha256: checksum(controller.artifact_sha256, 'MODEL_PACK_CONTRACT_INVALID'), evidence_sha256: checksum(controller.evidence_sha256, 'MODEL_PACK_CONTRACT_INVALID') };
  const mlflow = record(value.mlflow, ['experiment_id', 'run_id', 'registered_model_name', 'registered_model_version', 'artifact_uri'], 'MODEL_PACK_CONTRACT_INVALID'); const registryVersion = string(mlflow.registered_model_version, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'); if (!/^[1-9][0-9]*$/.test(registryVersion)) return fail('MODEL_PACK_RELEASE_REFERENCE_INVALID'); const artifactUri = string(mlflow.artifact_uri, 'MODEL_PACK_RELEASE_REFERENCE_INVALID'); validateFileUri(artifactUri);
  const acceptedMlflow = { experiment_id: governedIdentity(mlflow.experiment_id, 'MODEL_PACK_CONTRACT_INVALID'), run_id: governedIdentity(mlflow.run_id, 'MODEL_PACK_CONTRACT_INVALID'), registered_model_name: governedIdentity(mlflow.registered_model_name, 'MODEL_PACK_CONTRACT_INVALID'), registered_model_version: registryVersion, artifact_uri: artifactUri };
  const releaseArtifact = artifact(value.artifact, 'MODEL_PACK_CONTRACT_INVALID');
  if (controllerRelease.decision_id !== manifest.provenance.controller_release_decision_id || controllerRelease.decided_at !== manifest.provenance.released_at || controllerRelease.package_identity !== manifest.package.identity || controllerRelease.package_version !== manifest.package.version || controllerRelease.artifact_sha256 !== manifest.package.artifact.sha256 || controllerRelease.evidence_sha256 !== manifest.provenance.evaluation_evidence_sha256 || acceptedMlflow.experiment_id !== manifest.provenance.mlflow_experiment_id || acceptedMlflow.run_id !== manifest.provenance.mlflow_run_id || acceptedMlflow.registered_model_name !== manifest.provenance.registered_model_name || acceptedMlflow.registered_model_version !== manifest.provenance.registered_model_version || releaseArtifact.sha256 !== manifest.package.artifact.sha256 || releaseArtifact.byte_size !== manifest.package.artifact.byte_size || releaseArtifact.model_signature_sha256 !== manifest.package.artifact.model_signature_sha256) return fail('MODEL_PACK_RELEASE_EVIDENCE_MISMATCH');
  return detached({ schema_version: '1.0', stage: 'MP9_MODEL_RELEASED', controller_release: controllerRelease, mlflow: acceptedMlflow, artifact: releaseArtifact, manifest }) as ModelPackReleaseInputV1;
}
export function serializeModelPackReleaseInput(release_input: ModelPackReleaseInputV1): Uint8Array { return sanitized('MODEL_PACK_CONTRACT_INVALID', () => canonical(validateRelease(release_input))); }
export function admitModelPackReleaseInput(input: Readonly<{ release_input_bytes: Uint8Array; artifact_observation: ArtifactObservationV1; expected_package: ModelPackIdentityV1 }>): ModelPackReleaseInputV1 {
  return sanitized('MODEL_PACK_CONTRACT_INVALID', () => {
    const call = record(input, ['release_input_bytes', 'artifact_observation', 'expected_package'], 'MODEL_PACK_CONTRACT_INVALID'); const release = parseCanonical(call.release_input_bytes as Uint8Array, validateRelease) as ModelPackReleaseInputV1; const expected = identity(call.expected_package, 'MODEL_PACK_IDENTITY_MISMATCH'); const actual: ModelPackIdentityV1 = { identity: release.manifest.package.identity, version: release.manifest.package.version, artifact_sha256: release.manifest.package.artifact.sha256 }; if (!idsEqual(actual, expected)) return fail('MODEL_PACK_IDENTITY_MISMATCH');
    const observation = validateObservation(call.artifact_observation, 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH', true); if (observation.artifact_uri !== release.mlflow.artifact_uri || observation.sha256 !== release.artifact.sha256 || observation.byte_size !== release.artifact.byte_size || observation.model_signature_sha256 !== release.artifact.model_signature_sha256) return fail('MODEL_PACK_RELEASE_EVIDENCE_MISMATCH'); return release;
  });
}
export function admitModelPackReleaseStatus(input: Readonly<{ release_status: unknown; expected_package: ModelPackIdentityV1 }>): ModelPackReleaseStatusV1 {
  return sanitized('MODEL_PACK_CONTRACT_INVALID', () => {
    const call = record(input, ['release_status', 'expected_package'], 'MODEL_PACK_CONTRACT_INVALID'); const value = record(call.release_status, ['schema_version', 'package', 'state', 'controller'], 'MODEL_PACK_CONTRACT_INVALID'); exact(value.schema_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED'); const statusPackage = record(value.package, ['identity', 'version', 'artifact_sha256'], 'MODEL_PACK_CONTRACT_INVALID'); const packageValue = { identity: governedIdentity(statusPackage.identity, 'MODEL_PACK_CONTRACT_INVALID') as ModelPackIdentityV1['identity'], version: stableVersion(statusPackage.version, 'MODEL_PACK_CONTRACT_INVALID'), artifact_sha256: checksum(statusPackage.artifact_sha256, 'MODEL_PACK_CONTRACT_INVALID') }; const expected = identity(call.expected_package, 'MODEL_PACK_IDENTITY_MISMATCH'); if (!idsEqual(packageValue, expected)) return fail('MODEL_PACK_IDENTITY_MISMATCH'); if (value.state !== 'released' && value.state !== 'revoked') return fail('MODEL_PACK_CONTRACT_INVALID'); const controller = record(value.controller, ['decision_id', 'evidence_id', 'decided_at'], 'MODEL_PACK_CONTRACT_INVALID'); return detached({ schema_version: '1.0', package: packageValue, state: value.state, controller: { decision_id: governedIdentity(controller.decision_id, 'MODEL_PACK_CONTRACT_INVALID'), evidence_id: governedIdentity(controller.evidence_id, 'MODEL_PACK_CONTRACT_INVALID'), decided_at: instant(controller.decided_at, 'MODEL_PACK_CONTRACT_INVALID') } }) as ModelPackReleaseStatusV1;
  });
}

export function admitCategoryDemandInput(input: Readonly<{ candidate: unknown; manifest: ModelPackManifestV1 }>): CategoryDemandInputV1 {
  return sanitized('MODEL_PACK_INPUT_INVALID', () => {
    const call = record(input, ['candidate', 'manifest'], 'MODEL_PACK_INPUT_INVALID'); const manifest = validateManifest(call.manifest); const value = record(call.candidate, ['contract_version', 'as_of_date', 'currency', 'history'], 'MODEL_PACK_INPUT_INVALID'); exact(value.contract_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED'); const asOf = date(value.as_of_date, 'MODEL_PACK_INPUT_INVALID'); if (value.currency !== manifest.io.supported_currency || !closedArray(value.history)) return fail('MODEL_PACK_INPUT_INVALID'); const rows = value.history.map((candidate) => { const row = record(candidate, ['business_date', 'product_category', 'order_count', 'gross_order_amount', 'discount_amount'], 'MODEL_PACK_INPUT_INVALID'); const gross = decimalString(row.gross_order_amount, 'MODEL_PACK_INPUT_INVALID'); const discount = decimalString(row.discount_amount, 'MODEL_PACK_INPUT_INVALID'); if (compareDecimalStrings(discount, gross) > 0) return fail('MODEL_PACK_INPUT_INVALID'); return { business_date: date(row.business_date, 'MODEL_PACK_INPUT_INVALID'), product_category: nonempty(row.product_category, 'MODEL_PACK_INPUT_INVALID'), order_count: nonnegative(row.order_count, 'MODEL_PACK_INPUT_INVALID'), gross_order_amount: gross, discount_amount: discount }; });
    const categoriesValue = manifest.io.supported_product_categories; const historyDays = rows.length / categoriesValue.length; if (!Number.isInteger(historyDays) || historyDays < manifest.io.minimum_history_days) return fail('MODEL_PACK_INPUT_INVALID'); const start = Date.parse(`${asOf}T00:00:00.000Z`) - (historyDays - 1) * 86400000; const expected = [] as Array<[string, string]>; for (let day = 0; day < historyDays; day += 1) for (const category of categoriesValue) expected.push([new Date(start + day * 86400000).toISOString().slice(0, 10), category]); if (rows.some((row, index) => row.business_date !== expected[index]?.[0] || row.product_category !== expected[index]?.[1])) return fail('MODEL_PACK_INPUT_INVALID'); return detached({ contract_version: '1.0', as_of_date: asOf, currency: manifest.io.supported_currency, history: rows }) as CategoryDemandInputV1;
  });
}
export function canonicalCategoryDemandInputBytes(input: Readonly<{ admitted_input: CategoryDemandInputV1; manifest: ModelPackManifestV1 }>): Uint8Array { return sanitized('MODEL_PACK_CONTRACT_INVALID', () => { const call = record(input, ['admitted_input', 'manifest'], 'MODEL_PACK_CONTRACT_INVALID'); return canonical(admitCategoryDemandInput({ candidate: call.admitted_input, manifest: call.manifest as ModelPackManifestV1 })); }); }
export function admitCategoryDemandForecast(input: Readonly<{ candidate: unknown; manifest: ModelPackManifestV1; admitted_input: CategoryDemandInputV1 }>): CategoryDemandForecastV1 {
  return sanitized('MODEL_PACK_OUTPUT_INVALID', () => {
    const call = record(input, ['candidate', 'manifest', 'admitted_input'], 'MODEL_PACK_OUTPUT_INVALID'); const manifest = validateManifest(call.manifest); const admittedInput = admitCategoryDemandInput({ candidate: call.admitted_input, manifest }); const value = record(call.candidate, ['contract_version', 'as_of_date', 'currency', 'predictions'], 'MODEL_PACK_OUTPUT_INVALID'); exact(value.contract_version, '1.0', 'MODEL_PACK_CONTRACT_UNSUPPORTED'); if (value.as_of_date !== admittedInput.as_of_date || value.currency !== admittedInput.currency || !closedArray(value.predictions)) return fail('MODEL_PACK_OUTPUT_INVALID'); const rows = value.predictions.map((candidate) => { const row = record(candidate, ['business_date', 'product_category', 'predicted_order_count', 'predicted_net_order_amount', 'order_count_interval_80', 'net_order_amount_interval_80'], 'MODEL_PACK_OUTPUT_INVALID'); const interval = (candidateInterval: unknown): PredictionInterval80V1 => { const intervalValue = record(candidateInterval, ['lower', 'upper'], 'MODEL_PACK_OUTPUT_INVALID'); const lower = decimalString(intervalValue.lower, 'MODEL_PACK_OUTPUT_INVALID'); const upper = decimalString(intervalValue.upper, 'MODEL_PACK_OUTPUT_INVALID'); if (compareDecimalStrings(lower, upper) > 0) return fail('MODEL_PACK_OUTPUT_INVALID'); return { lower, upper }; }; return { business_date: date(row.business_date, 'MODEL_PACK_OUTPUT_INVALID'), product_category: nonempty(row.product_category, 'MODEL_PACK_OUTPUT_INVALID'), predicted_order_count: decimalString(row.predicted_order_count, 'MODEL_PACK_OUTPUT_INVALID'), predicted_net_order_amount: decimalString(row.predicted_net_order_amount, 'MODEL_PACK_OUTPUT_INVALID'), order_count_interval_80: interval(row.order_count_interval_80), net_order_amount_interval_80: interval(row.net_order_amount_interval_80) }; });
    const start = Date.parse(`${admittedInput.as_of_date}T00:00:00.000Z`); const expected: Array<[string, string]> = []; for (let day = 1; day <= 28; day += 1) for (const category of manifest.io.supported_product_categories) expected.push([new Date(start + day * 86400000).toISOString().slice(0, 10), category]); if (rows.length !== expected.length || rows.some((row, index) => row.business_date !== expected[index]?.[0] || row.product_category !== expected[index]?.[1])) return fail('MODEL_PACK_OUTPUT_INVALID'); return detached({ contract_version: '1.0', as_of_date: admittedInput.as_of_date, currency: admittedInput.currency, predictions: rows }) as CategoryDemandForecastV1;
  });
}
