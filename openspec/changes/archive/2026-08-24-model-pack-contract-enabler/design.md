# Design: Model Pack Contract Enabler

## Design Summary

E adds two deep, inert shared modules and no composition root:

```text
canonical package/release bytes
        -> packages/contracts/model-pack.ts
        -> pure admission + exact business values
        -> package contract driver (double now, real P SDK later)

confirmed input + exact factory binding
        -> packages/ports/analytical-model-runtime.ts
        -> scenario Runtime / one-shot Run
        -> Runtime contract driver (double now, real C Adapter later)

profiles / CLI / product behavior: unchanged and inactive
```

The contract module owns business data, canonical serialization, pure validation, compatibility, and stable errors. The Port owns lifecycle and terminal-race semantics. Provider/SDK, filesystem/MLflow observation, Consumer Adapter, and Profile selection stay outside both.

## Exact Production Surface

All signatures in this section are normative. `Readonly` and `readonly` are
part of the public TypeScript contract. A validator accepts an `unknown` value
only where malformed caller or Adapter output is intentionally inside that
validator's boundary. Every returned record and array is a detached, deeply
immutable copy. Every returned `Uint8Array` is a fresh defensive copy; no
function retains a caller-owned byte array.

### `packages/contracts/model-pack.ts`

The module exports only the types and values named below. These are the complete
public v1 data shapes (the literal values and validation rules remain those in
the field-tree sections that follow):

```ts
export type ModelPackIdentityV1 = Readonly<{
  identity: 'juanerai.sales-demand-forecast';
  version: string;
  artifact_sha256: string;
}>;
export type IdentityVersionV1 = Readonly<{ identity: string; version: string }>;
export type ModelPackArtifactV1 = Readonly<{
  sha256: string;
  byte_size: number;
  model_signature_sha256: string;
}>;
export type ModelPackPermissionsV1 = Readonly<{
  data: 'local_only';
  network: 'none';
  external_data: 'none';
  mlflow_at_runtime: 'none';
  training_workspace_at_runtime: 'none';
  source_write: 'forbidden';
  model_execution: 'local_only';
}>;
export type ModelPackManifestV1 = Readonly<{
  schema_version: '1.0';
  package: Readonly<{
    identity: 'juanerai.sales-demand-forecast';
    version: string;
    artifact: ModelPackArtifactV1;
  }>;
  compatibility: Readonly<{
    juanerai_contract_version: '1.0';
    input_contract: 'sales-demand-forecast-input/1.0';
    output_contract: 'sales-demand-forecast-output/1.0';
  }>;
  purpose: Readonly<{
    approved_use: 'category_demand_forecast_28_day_planning_review';
    prohibited_uses: readonly [
      'automatic_replenishment',
      'automatic_pricing',
      'automatic_marketing_or_outreach',
      'customer_level_prediction',
      'observed_outcome_claim',
      'causal_claim',
      'authorized_decision_claim',
      'action_execution',
    ];
  }>;
  io: Readonly<{
    horizon_days: 28;
    minimum_history_days: 56;
    grain: 'utc_day_product_category';
    supported_currency: string;
    supported_product_categories: readonly string[];
  }>;
  runtime: Readonly<{
    execution: 'local';
    deterministic: true;
    online_learning: false;
    runtime: IdentityVersionV1;
    dependencies: readonly IdentityVersionV1[];
  }>;
  permissions: ModelPackPermissionsV1;
  provenance: Readonly<{
    controller_release_decision_id: string;
    released_at: string;
    mlflow_experiment_id: string;
    mlflow_run_id: string;
    registered_model_name: string;
    registered_model_version: string;
    training_data_sha256: string;
    training_code_revision: string;
    evaluation_evidence_sha256: string;
  }>;
  evaluation: Readonly<{
    contract: 'sales-demand-forecast-evaluation/1.0';
    observed_order_count_relative_wape_improvement: string;
    observed_net_order_amount_relative_wape_improvement: string;
    observed_key_category_wape_regression_max_percentage_points: string;
    observed_interval_coverage: string;
    observed_summary_sha256: string;
  }>;
  limitations: readonly string[];
  confidence: Readonly<{
    kind: 'prediction_interval';
    nominal_coverage: '0.80';
    evidence_sha256: string;
  }>;
  license: Readonly<{ license_id: string; terms_sha256: string }>;
  revocation_policy: Readonly<{
    release_status_contract: 'model-pack-release-status/1.0';
  }>;
  rollback: Readonly<{
    previous_stable_package: ModelPackIdentityV1 | null;
    trigger_conditions: readonly string[];
  }>;
}>;
export type ModelPackReleaseStatusV1 = Readonly<{
  schema_version: '1.0';
  package: ModelPackIdentityV1;
  state: 'released' | 'revoked';
  controller: Readonly<{
    decision_id: string;
    evidence_id: string;
    decided_at: string;
  }>;
}>;
export type ArtifactLocationVerificationV1 = Readonly<{
  kind: 'controller_authorized_local_artifact_store';
  controller_authorization_id: string;
  approved_store_id: string;
  evidence_sha256: string;
}>;
export type ArtifactObservationV1 = Readonly<{
  schema_version: '1.0';
  artifact_uri: string;
  location_verification: ArtifactLocationVerificationV1;
  sha256: string;
  byte_size: number;
  model_signature_sha256: string;
}>;
export type ModelPackReleaseInputV1 = Readonly<{
  schema_version: '1.0';
  stage: 'MP9_MODEL_RELEASED';
  controller_release: Readonly<{
    decision: 'model_released';
    decision_id: string;
    decided_at: string;
    package_identity: 'juanerai.sales-demand-forecast';
    package_version: string;
    artifact_sha256: string;
    evidence_sha256: string;
  }>;
  mlflow: Readonly<{
    experiment_id: string;
    run_id: string;
    registered_model_name: string;
    registered_model_version: string;
    artifact_uri: string;
  }>;
  artifact: ModelPackArtifactV1;
  manifest: ModelPackManifestV1;
}>;
export type CategoryDemandHistoryRowV1 = Readonly<{
  business_date: string;
  product_category: string;
  order_count: number;
  gross_order_amount: string;
  discount_amount: string;
}>;
export type CategoryDemandInputV1 = Readonly<{
  contract_version: '1.0';
  as_of_date: string;
  currency: string;
  history: readonly CategoryDemandHistoryRowV1[];
}>;
export type ConfirmedCategoryDemandSnapshotV1 = Readonly<{
  snapshot_id: string;
  confirmed_at: string;
  sha256: string;
  input: CategoryDemandInputV1;
}>;
export type PredictionInterval80V1 = Readonly<{ lower: string; upper: string }>;
export type CategoryDemandPredictionRowV1 = Readonly<{
  business_date: string;
  product_category: string;
  predicted_order_count: string;
  predicted_net_order_amount: string;
  order_count_interval_80: PredictionInterval80V1;
  net_order_amount_interval_80: PredictionInterval80V1;
}>;
export type CategoryDemandForecastV1 = Readonly<{
  contract_version: '1.0';
  as_of_date: string;
  currency: string;
  predictions: readonly CategoryDemandPredictionRowV1[];
}>;
export type CategoryDemandForecastProvenanceV1 = Readonly<{
  run_id: string;
  package: ModelPackIdentityV1;
  model: Readonly<{
    controller_release_decision_id: string;
    mlflow_run_id: string;
    registered_model_name: string;
    registered_model_version: string;
  }>;
  release_status: ModelPackReleaseStatusV1;
  input_snapshot: Readonly<{
    snapshot_id: string;
    sha256: string;
    confirmed_at: string;
    as_of_date: string;
  }>;
  runtime: IdentityVersionV1;
  adapter: IdentityVersionV1;
}>;
export type CategoryDemandForecastResultV1 = Readonly<{
  forecast: CategoryDemandForecastV1;
  provenance: CategoryDemandForecastProvenanceV1;
}>;

export const MODEL_PACK_IDENTITY: 'juanerai.sales-demand-forecast';
export const MODEL_PACK_CONTRACT_VERSION: '1.0';
export const MODEL_PACK_ERROR_CODES: readonly ModelPackErrorCode[];
export type ModelPackErrorCode =
  | 'MODEL_PACK_CONTRACT_INVALID'
  | 'MODEL_PACK_CONTRACT_UNSUPPORTED'
  | 'MODEL_PACK_IDENTITY_MISMATCH'
  | 'MODEL_PACK_ARTIFACT_MISMATCH'
  | 'MODEL_PACK_PERMISSION_DENIED'
  | 'MODEL_PACK_LICENSE_INVALID'
  | 'MODEL_PACK_REVOKED'
  | 'MODEL_PACK_RUNTIME_INCOMPATIBLE'
  | 'MODEL_PACK_INPUT_INVALID'
  | 'MODEL_PACK_OUTPUT_INVALID'
  | 'MODEL_PACK_RELEASE_REQUIRED'
  | 'MODEL_PACK_RELEASE_REFERENCE_INVALID'
  | 'MODEL_PACK_RELEASE_EVIDENCE_MISMATCH'
  | 'ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE'
  | 'ANALYTICAL_MODEL_INPUT_CHANGED'
  | 'ANALYTICAL_MODEL_RUN_ALREADY_STARTED'
  | 'ANALYTICAL_MODEL_CANCELLED'
  | 'ANALYTICAL_MODEL_DEADLINE_EXCEEDED'
  | 'ANALYTICAL_MODEL_RUNTIME_FAILED';
export type ModelPackContractError = Error & Readonly<{
  name: 'ModelPackContractError';
  code: ModelPackErrorCode;
}>;
```

The module exports exactly these nine functions:

```ts
export function serializeModelPackManifest(
  manifest: ModelPackManifestV1,
): Uint8Array;
export function admitModelPackManifest(input: Readonly<{
  manifest_bytes: Uint8Array;
  artifact_observation: ArtifactObservationV1;
  expected_package: ModelPackIdentityV1;
}>): ModelPackManifestV1;
export function serializeModelPackReleaseInput(
  release_input: ModelPackReleaseInputV1,
): Uint8Array;
export function admitModelPackReleaseInput(input: Readonly<{
  release_input_bytes: Uint8Array;
  artifact_observation: ArtifactObservationV1;
  expected_package: ModelPackIdentityV1;
}>): ModelPackReleaseInputV1;
export function admitModelPackReleaseStatus(input: Readonly<{
  release_status: unknown;
  expected_package: ModelPackIdentityV1;
}>): ModelPackReleaseStatusV1;
export function admitCategoryDemandInput(input: Readonly<{
  candidate: unknown;
  manifest: ModelPackManifestV1;
}>): CategoryDemandInputV1;
export function canonicalCategoryDemandInputBytes(input: Readonly<{
  admitted_input: CategoryDemandInputV1;
  manifest: ModelPackManifestV1;
}>): Uint8Array;
export function admitCategoryDemandForecast(input: Readonly<{
  candidate: unknown;
  manifest: ModelPackManifestV1;
  admitted_input: CategoryDemandInputV1;
}>): CategoryDemandForecastV1;
export function modelPackError(code: ModelPackErrorCode): ModelPackContractError;
```

All nine functions are synchronous and pure. On failure they synchronously
throw only `ModelPackContractError`; `name` is exactly
`ModelPackContractError`, `code` is exactly the selected closed code, and
`message` is exactly the code. `modelPackError` accepts no diagnostic/cause
argument. Public errors expose no `cause`, caller value, URI, path, credential,
SDK/MLflow object, raw rejection, or partial output. Serialization validates and
closes the supplied typed value before emitting canonical bytes. Admission of
manifest/release bytes first copies and parses those bytes, then checks the
supplied observation and expected binding; no observation callback exists.
Scenario input/forecast candidates stop at their respective pure validators.
Confirmed snapshots are closed by `openRun`; result/provenance is constructed
only by the Runtime from admitted forecast plus its captured bindings and is
never accepted from the predictor or caller.

It imports only Node standard-library hashing/byte facilities if required. It imports no Port, Adapter, Product Core, Application, Profile, SDK, MLflow, filesystem, HTTP, environment, process-spawn, external repository, or provider type. Validators return deeply immutable JuanerAI/standard-platform values and do not retain caller-owned mutable objects.

### `packages/ports/analytical-model-runtime.ts`

The module imports only types and pure admission functions from
`packages/contracts/model-pack.ts`. Its complete public surface is:

```ts
export type AnalyticalModelRuntimeBindingV1 = Readonly<{
  runtime: IdentityVersionV1;
  adapter: IdentityVersionV1;
  dependencies: readonly IdentityVersionV1[];
  permissions: ModelPackPermissionsV1;
}>;
export type AnalyticalModelPreflightInputV1 = Readonly<{
  expected_package: ModelPackIdentityV1;
  manifest_bytes: Uint8Array;
  artifact_observation: ArtifactObservationV1;
  release_status: unknown;
}>;
export type AnalyticalModelReadinessV1 = Readonly<{
  package: ModelPackIdentityV1;
  manifest: ModelPackManifestV1;
  model: Readonly<{
    controller_release_decision_id: string;
    mlflow_run_id: string;
    registered_model_name: string;
    registered_model_version: string;
  }>;
  release_status: ModelPackReleaseStatusV1;
  runtime: IdentityVersionV1;
  adapter: IdentityVersionV1;
  dependencies: readonly IdentityVersionV1[];
  permissions: ModelPackPermissionsV1;
}>;
export type AnalyticalModelOpenRunInputV1 = Readonly<{
  run_id: string;
  readiness: AnalyticalModelReadinessV1;
  snapshot: ConfirmedCategoryDemandSnapshotV1;
}>;
export type LocalCategoryDemandPredictionRequestV1 = Readonly<{
  run_id: string;
  input: CategoryDemandInputV1;
  cancellation_signal: AbortSignal;
  deadline_at: string;
}>;
export type LocalCategoryDemandPredictor = (
  request: LocalCategoryDemandPredictionRequestV1,
) => Promise<unknown>;
export type AnalyticalModelRun = Readonly<{
  predict(input: Readonly<{
    cancellation_signal: AbortSignal;
    deadline_at: string;
  }>): Promise<CategoryDemandForecastResultV1>;
}>;
export type AnalyticalModelRuntime = Readonly<{
  preflight(
    input: AnalyticalModelPreflightInputV1,
  ): Promise<AnalyticalModelReadinessV1>;
  openRun(input: AnalyticalModelOpenRunInputV1): Promise<AnalyticalModelRun>;
}>;
export function defineAnalyticalModelRuntime(input: Readonly<{
  binding: AnalyticalModelRuntimeBindingV1;
  predictor: LocalCategoryDemandPredictor;
}>): AnalyticalModelRuntime;
```

`defineAnalyticalModelRuntime` is the one production composition seam, not a
test hook. It synchronously validates the exact two-key input, exact closed
binding, and predictor function; any construction failure synchronously throws
`modelPackError('ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE')`. It copies and freezes
one immutable Runtime/Adapter/dependency/permission binding for that instance.
`preflight`, `openRun`, and `predict` never synchronously throw: every specified
failure rejects their returned Promise with a `ModelPackContractError`. They
never reject with a raw predictor/caller/SDK error.

The predictor receives exactly `run_id`, the captured admitted scenario input,
the same `AbortSignal` object supplied to `predict`, and the same admitted
absolute `deadline_at`; the factory adds no default deadline, clock, retry,
grace, registry, or alternate binding. The predictor may
fulfill with any locally obtained value because this is an untrusted Adapter
boundary; only a value admitted by `admitCategoryDemandForecast` may become
success. It may synchronously throw or reject with any reason; if that settlement
wins, the Runtime discards the reason and rejects with
`ANALYTICAL_MODEL_RUNTIME_FAILED`. This seam is used unchanged by E's
deterministic predictor double and by the future C Consumer Adapter's bound local
predictor. It cannot select, register, replace, fall back from, or hot-switch a
Runtime.

### Public call failure matrix

`MODEL_PACK_ERROR_CODES` is a frozen array containing each of the 19 codes once,
in the exact order shown by the `ModelPackErrorCode` union. Error precedence is
the normative sequence in the Specification. Applicable failures are closed as
follows; no function or operation invents another carrier or code:

| Boundary | Delivery | Applicable stable codes |
|---|---|---|
| `serializeModelPackManifest` | synchronous throw | contract invalid/unsupported, permission denied, or license invalid |
| `admitModelPackManifest` | synchronous throw | every serializer code, then identity mismatch or Artifact mismatch |
| `serializeModelPackReleaseInput` | synchronous throw | release required, contract invalid/unsupported, release-reference invalid, release-evidence mismatch only for conflicting fields with two values inside the release input, plus nested manifest codes |
| `admitModelPackReleaseInput` | synchronous throw | every release serializer code, then identity mismatch for the separate expected binding or release-evidence mismatch when the supplied observation's URI/SHA/size/model-Signature conflicts with its release/manifest counterpart; it does not remap those MP9 observation conflicts to Artifact mismatch |
| `admitModelPackReleaseStatus` | synchronous throw | contract invalid/unsupported or identity mismatch; both exact `released` and `revoked` are admitted values |
| `admitCategoryDemandInput` and `canonicalCategoryDemandInputBytes` | synchronous throw | contract unsupported or input invalid |
| `admitCategoryDemandForecast` | synchronous throw | contract unsupported or output invalid |
| `modelPackError` | returns carrier | no failure for an in-contract `ModelPackErrorCode`; an out-of-contract JavaScript value has no public contract |
| `defineAnalyticalModelRuntime` | synchronous throw | analytical Runtime incompatible |
| `preflight` | Promise rejection | applicable manifest/status/identity/Artifact/permission/Runtime codes, revoked, or analytical Runtime incompatible |
| `openRun` | Promise rejection | analytical Runtime incompatible for malformed/spoofed readiness or outer shape; contract unsupported/input invalid for snapshot input; input changed for snapshot SHA drift |
| first `predict` | Promise rejection | analytical Runtime incompatible for malformed exact call/deadline/signal; cancelled; deadline exceeded; Runtime failed; contract unsupported/output invalid |
| concurrent/later `predict` | Promise rejection | Run already started, before any other validation or effect |

An exact `revoked` status is therefore a valid closed status value and is
rejected only when `preflight` attempts to use it for readiness. An invalid
fulfilled predictor value is always classified by forecast admission and never
as Runtime failure.

The permission entry in the preflight row is defensive, not a second public
admission route. `ModelPackPermissionsV1` is one exact literal grant;
manifest serialization/admission rejects each missing or widened field as
`MODEL_PACK_PERMISSION_DENIED`, and the factory rejects a malformed binding as
`ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE`. No valid public call can therefore
produce an admitted manifest permission value unequal to a valid factory
binding.

## Canonical Serialization and Validation Rules

For every canonically serialized object, the property order in the normative
TypeScript declaration above is the required JSON member order, recursively.
Every object is closed and every declared field is required unless its type
explicitly includes `null`.

The observed evaluation values must satisfy the named versioned evaluation contract; otherwise manifest admission fails as `MODEL_PACK_CONTRACT_INVALID` even if a release decision claims success. This metadata records release evidence without accepting training history, actuals, folds, metric tables, or MLflow objects as Runtime input. `supported_currency`, category identities, version/identity strings, limitations, license, dependencies, evidence hashes, observed values, and rollback values have no default; MP9 must supply them.

Limitations, license, rollback, and the supplied observation's
`controller_authorization_id`, `approved_store_id`, and location-evidence SHA
are release-instance singletons. Their own closed-shape and business rules are
mandatory, but E has no second authoritative value for them. A different valid
singleton therefore remains valid at E and is not release-evidence mismatch.

Currency identity is a non-empty trimmed printable ASCII token without whitespace, slash, path separator, URI delimiter, control character, or secret. The contract does not invent a currency enum. Identity/version strings are trimmed printable business identifiers and cannot be paths, aliases, credentials, or free-form diagnostics.

`run_id` and `snapshot_id` match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. Controller decision/evidence, approved Artifact-store, MLflow Experiment/Run/model, Runtime, Adapter, dependency, license, and revision identities are 1-256 trimmed printable characters without control characters, credentials, raw filesystem paths, `latest`, or alias semantics. Every contract timestamp (`released_at`, `decided_at`, `confirmed_at`, `deadline_at`) is an exact valid UTC `YYYY-MM-DDTHH:mm:ss.sssZ` instant; no local offset or default current time is admitted.

The immutable manifest declares only which release-status contract must be enforced; it never embeds a mutable current status. Current release authority is the separately supplied closed `ModelPackReleaseStatusV1`.

The package triplet must exactly equal the admitted manifest and expected binding. This value has no locator, lookup, persistence, refresh, recovery, or activation operation. `admitModelPackReleaseStatus` only closes, validates, and deeply freezes the supplied value; preflight rejects a binding mismatch as `MODEL_PACK_IDENTITY_MISMATCH` and exact `revoked` state as `MODEL_PACK_REVOKED`.

## MP9 Release and Local Artifact Rules

`admitModelPackReleaseInput` receives the supplied `ArtifactObservationV1`; it has no locator callback and cannot dereference, read, fetch, stat, resolve, or discover anything. The Test driver supplies a deterministic observation. P later owns the observation Adapter/private implementation and must prove in its authorized private evidence that a local URI exists, resolves inside the Controller-approved Artifact-store root, and is outside training-workspace/cache/source paths before passing the observation to this same pure gate. The shared value names the approval/evidence but carries no private root path.

Release-evidence equality is mandatory only where the frozen values repeat:
Controller decision ID/time and package identity/version/Artifact SHA against
the manifest release binding; MLflow Experiment/Run/registered-model
name/version against manifest provenance; Controller evaluation-evidence SHA
against the manifest evaluation-evidence binding; Artifact SHA/size/model-
Signature across controller/release/manifest occurrences where present; and the
supplied observation's URI/SHA/size/model-Signature against the release or
manifest counterpart. The exact comparator pairs are determined by the public
field tree; no fixture value is an additional authority. The only admitted
locator is an exact canonical absolute local `file:` URI: the standard WHATWG `URL` parser
must accept it and serialize `.href` byte-for-byte to the supplied string, with
empty host/authority, username/password/query/fragment, an absolute pathname,
and no decoded dot/traversal, `latest`, or alias path component. It requires the
exact `controller_authorized_local_artifact_store` verification kind plus
valid non-empty controller-authorization, approved-store, and evidence
identities. These are supplied assertions, not E filesystem proof. Raw
POSIX/Windows paths, relative/non-normal `file:` URIs, and every non-`file`
scheme are `MODEL_PACK_RELEASE_REFERENCE_INVALID`. The URI remains MP9/Builder
provenance and is never emitted in Runtime output.

## Scenario Cross-field Rules

The last date equals `as_of_date`; the first date is at least 55 days earlier; every intervening UTC date exists. The category set exactly equals the manifest's non-empty ordered `supported_product_categories` and appears exactly once on every day. Each category identity is Unicode NFC, 1-128 Unicode scalar values, contains no control character or path separator, and is not `.` or `..`; the manifest value, not an invented global enum, is authoritative. Row order is date then the manifest category order. The Runtime derives `net_order_amount`; callers cannot supply it or any extra field.

`openRun` recalculates the canonical bytes and SHA, then captures its own deeply immutable value. A mismatch is input change, not a permissive re-confirmation.

The row set is the Cartesian product of the manifest's exact category order and the 28 dates immediately following `as_of_date`; rows are ordered date then manifest category order and there are no missing or extra rows.

No `generated_at`, random seed, MLflow URI, local path, Profile, vendor request, tool, session, partial result, or infrastructure diagnostic is added. The Profile belongs to A/product provenance after activation; E remains inactive.

## Preflight and Run Binding

Preflight passes `manifest_bytes`, `artifact_observation`, and
`expected_package` together to `admitModelPackManifest`; passes the supplied
`release_status` and the same expected binding to
`admitModelPackReleaseStatus`; rejects `revoked`; and returns the admitted
manifest plus exact model-release, release-status, Runtime, Adapter, dependency,
and permission binding. It performs no status lookup and constructs no service,
list, cache, watcher, registry, persistence, recovery, or Profile state. The
factory construction owns its actual Runtime/Adapter/dependency/permission
binding. Preflight compares the admitted manifest's Runtime and dependency
requirements directly with that binding and retains a defensive permission
equality check; callers do not echo or select those values. Runtime/dependency
mismatch uses `MODEL_PACK_RUNTIME_INCOMPATIBLE`. Manifest permission widening
is rejected earlier by serialization/admission as
`MODEL_PACK_PERMISSION_DENIED`, while a malformed factory permission binding is
`ANALYTICAL_MODEL_RUNTIME_INCOMPATIBLE`. Since both successful boundaries yield
the same exact literal grant, Test does not bypass admission or create a second
serializer/parser seam merely to reach the defensive branch. Environment
variables or Profile lookup cannot change the binding.

`AnalyticalModelOpenRunInputV1` contains `run_id`, the complete immutable readiness value, and confirmed snapshot. `openRun` validates equality with this Runtime instance's actual binding and captures the snapshot. It creates no model call, process, file read, network operation, or Profile state. The future Application/A composition must obtain and supply the current Controller-authoritative status for the preflight of each Run; E neither determines freshness nor keeps a cross-Run status cache or registry. The returned Run is one-shot and holds the only permitted execution binding, including the exact supplied release-status evidence admitted at preflight.

## Cancellation, Deadline, and Publication

The physical and Application-visible linearization point is the one-shot Run's private terminal decision:

1. `predict` validates its exact two-field input and atomically marks the Run started. A second/concurrent call loses immediately.
2. If `AbortSignal.aborted` is already true, cancellation terminalizes without issue. This also wins when the deadline is already expired.
3. Otherwise, if current time is at/after `deadline_at`, deadline terminalizes without issue.
4. The exact bound predictor is called once with the same `AbortSignal`. An abort listener, one standard `setTimeout` deadline timer, and predictor settlement contend; the Runtime adds no clock or scheduler dependency.
5. One atomic terminal outcome is published. Cancellation wins over deadline when both are observed before that publication; a terminal deadline published before a later abort remains final.
6. Predictor rejection or synchronous throw may publish Runtime failure only after a final cancellation/deadline check.
7. Predictor fulfillment is admitted through `admitCategoryDemandForecast`, then receives the same final cancellation/deadline check. Only then can the Runtime construct exact result/provenance and publish success.
8. Once terminal, all contenders lose permanently. Late fulfill/reject is consumed and discarded. No partial candidate becomes success; no retry, fallback, alternate Runtime, or recovery write is permitted.

The absolute bound is `deadline_at`, compared and scheduled with standard
`Date.now` and `setTimeout`; the caller abort signal may end earlier. E
introduces no default deadline, retry count, grace period, clock, or scheduler
hook.

## Exact Contract Driver Interfaces

The package/SDK driver is test authority, not a production package API:

```ts
type ModelPackPackageDriver = Readonly<{
  observeInstalledPackage(): Promise<Readonly<{
    manifest_bytes: Uint8Array;
    artifact: ArtifactObservationV1;
  }>>;
  predict(input: CategoryDemandInputV1): Promise<CategoryDemandForecastV1>;
}>;

declare function runModelPackPackageContract(
  createDriver: () => Promise<ModelPackPackageDriver>,
): Promise<void>;
```

E's driver factory returns a deterministic in-memory double. P later installs its exact MP9 SDK using P-private mechanics, then supplies a wrapper with the same two operations. The shared suite does not install, locate, or introspect a package manager and does not admit additional driver methods.

The Runtime driver accepts a test harness around the public Port. The control surface belongs only to the Test wrapper and never enters production:

```ts
type AnalyticalModelRuntimeHarness = Readonly<{
  runtime: AnalyticalModelRuntime;
  control: Readonly<{
    waitForIssue(): Promise<Readonly<{
      run_id: string;
      input: CategoryDemandInputV1;
      cancellation_signal: AbortSignal;
      deadline_at: string;
    }>>;
    fulfill(candidate: unknown): void;
    reject(reason: unknown): void;
    issueCount(): number;
  }>;
}>;

declare function runAnalyticalModelRuntimeContract(
  createHarness: () => Promise<AnalyticalModelRuntimeHarness>,
): Promise<void>;
```

E supplies a fully deterministic Runtime/Adapter double. C later wraps its real Consumer Adapter around a C-private controllable predictor double, allowing the same shared lifecycle/race suite to run without a real model or production test hook. Separate C real-SDK/product evidence remains required.

Every harness constructs `runtime` through the public
`defineAnalyticalModelRuntime({ binding, predictor })` seam. `control` governs
only that injected predictor's Promise and observations; it does not replace
Runtime admission, one-shot state, timer/abort arbitration, output admission, or
result/provenance construction.

## Contract Suite Layout and Ownership

Exact planned Test-owned files are:

- `tests/contract/model-pack-contract-enabler/model-pack-package.contract.test.ts`
- `tests/contract/model-pack-contract-enabler/analytical-model-runtime.contract.test.ts`
- `tests/integration/model-pack-contract-enabler/contracts-inactive.integration.test.ts`
- `tests/fixtures/model-pack-contract-enabler/model-pack-fixtures.ts`
- `tests/fixtures/model-pack-contract-enabler/model-pack-package-driver.ts`
- `tests/fixtures/model-pack-contract-enabler/analytical-model-runtime-driver.ts`

One existing regression path was conditionally Test-owned for the completed
closed-graph correction and is now byte-frozen:

- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
  — the eight exact approved E entries were appended to the existing
  `approvedTsconfig.files` array used by `TEST-XCLI-021`; the resulting 3,096
  lines and SHA-256
  `b5c43e3bf65faab5e75c60a481c8c22aa966690c56b22a465622ab2a18dc433f`
  are frozen for this correction.

The package driver receives a factory exposing only consumer-visible manifest/Artifact observation and prediction behavior. The Runtime driver receives a factory for the business Port plus a controllable local settlement double. Neither driver imports Provider/Consumer private implementation. E runs each against deterministic doubles. P later runs the package driver unchanged after real SDK installation; C later runs the Runtime driver unchanged against the real Consumer Adapter after P. Driver modifications are contract changes.

`TEST-MPC-009` installs forbidden-effect observers before the first dynamic
imports of the production contract and Port. On command-local Node v26.0.0,
native `getSourceSync` calls the captured original `readFileSync`, which still
calls the patched exported `openSync` to obtain the module. The Test wrapper may
delegate and separately record only an outer `readFileSync` plus its nested
`openSync` when both resolve to the same target and that target is exactly one
of:

- `packages/contracts/model-pack.ts`;
- `packages/ports/analytical-model-runtime.ts`.

The paired exclusion is active only while awaiting the corresponding first
dynamic imports. The observed `readFileSync` target set and nested `openSync`
target set must each equal exactly the two approved source files. After those
imports settle, even the same targets are no longer excluded. An `openSync`
call is excluded only while synchronously nested under an allowed
`readFileSync`; a non-nested call is forbidden even during the import window.
Those paired records are toolchain-source-load observations and are excluded
from the product filesystem-effect count. Every other `readFileSync` or
`openSync` target, every late same-path call, every third target, and every
`readFile`, `stat`, `statSync`, `existsSync`, or `open` call in the observed
window remains a forbidden filesystem effect. Network, process, predictor,
registration, Profile, and CLI observers retain their existing zero-effect
rules. The helper-health proof must independently detect each non-excluded
filesystem method/target, a non-nested `openSync`, and a third or late target,
and must prove both exact observed target sets. It may not depend on a
production hook, source-string scan, source copy, custom loader/callback,
registry, bypass, eager import, blanket observer disable, platform abstraction,
or new dependency.

## Conditional Root Graph Delta

After causal RED and Controller release, `tsconfig.json` may append exactly the two production and six Test-owned files listed above, preserving all existing compiler options and file entries. No glob/include/workspace is introduced.

The existing `TEST-XCLI-021` oracle must mirror that exact approved delta by
appending, in the same order, only:

```text
packages/contracts/model-pack.ts
packages/ports/analytical-model-runtime.ts
tests/contract/model-pack-contract-enabler/model-pack-package.contract.test.ts
tests/contract/model-pack-contract-enabler/analytical-model-runtime.contract.test.ts
tests/integration/model-pack-contract-enabler/contracts-inactive.integration.test.ts
tests/fixtures/model-pack-contract-enabler/model-pack-fixtures.ts
tests/fixtures/model-pack-contract-enabler/model-pack-package-driver.ts
tests/fixtures/model-pack-contract-enabler/analytical-model-runtime-driver.ts
```

No other `approvedTsconfig` value, `TEST-XCLI-021` assertion, Local Analysis
behavior, Test identity, graph entry, compiler option, package assertion, or
configuration-file assertion may change.

`tools/harness/validation/run` may append exactly:

```text
node --test tests/contract/model-pack-contract-enabler/*.test.ts
node --test tests/integration/model-pack-contract-enabler/*.test.ts
```

It preserves the existing canonical PATH/toolchain, preflight, syntax/typecheck/current suites, fail-fast order, streamed output, and unconditional removal of the real-model gate. E adds no real-model mode.

## Activation and Rollback Boundary

E has no active binding instance and no Profile write. A future active Profile must be a separate Change and bind one exact Pack/Runtime/Adapter/Profile. Installation or import is never activation. The future Application/A composition obtains and supplies the current Controller-authoritative status for the preflight of each Run; `revoked` prevents readiness, and successful results retain the exact `released` value that admitted them. E adds no freshness or durable revocation machinery. Rollback changes composition only; it never rewrites or deletes user inputs, forecasts, provenance, failure records, or prior evidence.

## Rejected Alternatives

- Real SDK/Builder/Provider placeholder in E: crosses ownership and fakes P evidence.
- Runtime registry or universal interface: no approved current consumer and forbidden by ADR 0003.
- Live MLflow/filesystem locator, local-root resolver, or release-status lookup in shared contracts: violates E's pure supplied-observation boundary.
- Package/lock/workspace refactor: unnecessary for the current native TypeScript graph.
- One combined package/Runtime suite: obscures Provider versus Consumer conformance ownership.
- Calling the model twice inside one Run to police determinism: violates one-prediction semantics; determinism is proved across separate Runs by the unchanged suite.
- Active/inactive Profile schema or self-registration hook in E: activation belongs exclusively to A.
- Permission-admission bypass, second serializer/parser, or test-only factory seam: weakens the fixed local-only grant solely to manufacture an unreachable duplicate preflight oracle.
- Treating native source-loader reads as product filesystem effects: makes the
  inactive oracle reject the mechanism required to import the approved target;
  narrowly exclude/observe only the paired native `readFileSync` plus nested
  `openSync` chains for the two exact source files in Test code.
- A production loader, filesystem seam, callback, registry, source copy, eager
  import rewrite, blanket observer disablement, platform abstraction, or new
  dependency: changes product design to fix a Test/toolchain distinction and
  weakens the inactive boundary.
- Relaxing `TEST-XCLI-021`, adding a glob/include/workspace, or rewriting its
  closed-object oracle: unnecessary; append the same eight already approved E
  entries to its mirrored list and preserve all other assertions.
