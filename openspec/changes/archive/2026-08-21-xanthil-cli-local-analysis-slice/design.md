# Design: Xanthil CLI Local Analysis Slice

## Status and Decision Scope

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Design status: proposed for Controller Spec Gate
- Risk: R2 because this slice crosses Agent Runtime, analytical execution, data egress, persistent closed contracts, cancellation, and rollback boundaries
- Delivery path: `greenfield_fast_path`
- Structure authority: approved `XCLI-STRUCTURE-001`, all 13 A decisions
- Compatibility: greenfield version `1.0`; no migration, backfill, dual-read, replay, or historical consumer

This design closes product and contract behavior. TASK-007 has already established and received Controller acceptance for the frozen dependency manifest/lock/install stack; this design grants no future dependency drift and does not itself authorize new schemas, tests, implementation, model calls, or activation.

## Architecture and Dependency Direction

```text
Data Analyst
    <-> apps/cli (terminal rendering, input, Ctrl-C)
        -> packages/application (Analysis Gate and single run writer)
            -> packages/product-core (fixture semantics, metric oracle, Finding rules)
            -> packages/ports
                <- adapters/agent-pi
                <- adapters/analytics-duckdb
                <- adapters/storage-local
        <- profiles/personal (composition only)
```

Rules:

- `apps/cli` owns terminal interaction only and calls one Application use case.
- Application owns stage order, contract validation, run identity, tool authorization, asset allocation, terminal transition, and consistency finalization.
- Product Core owns only infrastructure-independent fixture validation, the complete first-scenario Analysis Proposal validation, metric definitions, supported-signal rule, Finding validation, and closed product error semantics.
- Ports use business-oriented values. They contain no Pi SDK objects, DuckDB connections, SQL-engine results, Python process handles, filesystem handles, paths selected by the model, process exit structures, or provider credential types.
- `packages/contracts` may use the runtime API of exact `typebox@1.3.7` to define and validate the closed JSON boundaries. TypeBox schema objects do not cross into Product Core or become Port values.
- Adapters translate SDK, engine, subprocess, and filesystem behavior into the Port contracts.
- The personal Profile is the only location that selects the Pi, DuckDB/Python, and local Artifact Adapters.
- SQLite is not introduced. Run lifecycle is a local Artifact contract, not a general operational-state store.

## Use-Case Sequence

```text
1. CLI -> Application: start approved local-analysis example
2. Application: preflight fixture, run root, supported versions, Pi/model readiness
3. Application -> Agent Runtime Port: open one in-memory session with built-ins disabled
4. CLI -> Application -> session: approved vague question
5. session -> Application: proposed Analysis Contract using metadata only
6. Application -> CLI: validated proposal
7. Data Analyst -> CLI: explicit confirm, reject, EOF/interrupt, or unsupported edit cancellation
8. on confirm, Application: allocate UUIDv7 and create in_progress run atomically
9. Application -> same session: confirmed snapshot and three approved tools
10. session -> tools -> Application -> Analysis Port: profile, SQL calculate, Python validate
11. Application -> Artifact Port: append numbered assets and update indexes
12. Application/Product Core: compare both calculations to the reference oracle
13. session: bounded narrative Finding proposal from verified structured values
14. Application/Product Core: validate Finding, Evidence, Markdown, and all references
15. Application -> Artifact Port: atomically commit succeeded terminal records
16. CLI: render success only after terminal commit
```

No fixture row content is read and no run exists during steps 1–7. Rejection, EOF/interrupt, and `edit` each terminate the pending interaction; this first fixed scenario has no semantic-edit loop. R4 retains the in-memory embedded SDK realization for both Discovery and Execution, including the three native Application callbacks.

After confirmation, the entire execution attempt has a hard 300-second personal-Profile v0.1 technical budget, inclusive of model, tool, validation, and Artifact-finalization time. Each analytical call has the nested 30-second budget. These values control resource use only; they are not business metric thresholds.

## Analysis Contract Snapshot

`analysis-contract.json` is a closed JSON object; `additionalProperties` is false at every object level. Arrays preserve declared order and do not accept duplicate IDs.

| Field | Type and rule |
|---|---|
| `schema_version` | exact string `1.0` |
| `run_id` | UUIDv7; equals directory and all other run records |
| `confirmed_at` | UTC RFC 3339 timestamp |
| `original_question` | exact approved entry question |
| `question` | exact frozen clarified question |
| `objective` | exact frozen objective |
| `source_ids` | exact non-empty array `["SRC-001"]` |
| `time_windows` | exact ordered objects for `baseline` then `recent`, each with inclusive `start_date` and `end_date` |
| `metrics` | exact ordered metric definitions `order_count`, `active_member_count`, `repeat_purchaser_count`, `repurchase_member_rate`, `repurchase_member_rate_delta_pp`; each contains `metric_id`, `display_name`, `definition`, `grain=synthetic_order`, window-local population, and unit |
| `signal_rule` | exact comparison `recent_repurchase_member_rate_lt_baseline`; no materiality or statistical-significance threshold |
| `output_requirements` | exact required Finding, Evidence, Summary, canonical SQL/Python, and structured-output declarations |
| `constraints` | synthetic fixture only; no raw-row model egress; approved tools only; no network tool, generic code, filesystem, Decision, recommendation, or Action |

Dates are calendar dates, not timestamps. Missing values are prohibited rather than represented by `null`. The snapshot is one-to-one with the run and is immutable after its first atomic commit.

## Run Manifest Contract

`run.json` is a closed, status-discriminated JSON union. Common fields are:

| Field | Type and rule |
|---|---|
| `schema_version` | exact `1.0` |
| `run_id` | UUIDv7 |
| `analysis_kind` | exact `analyst_assistant` |
| `status` | `in_progress | succeeded | failed | cancelled` |
| `started_at` | UTC RFC 3339 |
| `runtime` | required `xanthil_version`, `pi_adapter_version`, and `pi_version`; semantic version strings; no install path |
| `model` | required `provider` and `model_id`; `thinking_level` appears only if Pi explicitly reports it; no credential or endpoint |
| `contract` | exact relative path `analysis-contract.json` and lowercase SHA-256 |
| `sources` | one or more closed source descriptors; first slice exactly one |
| `artifacts` | ordered unique Artifact descriptors; may be empty only while in progress or on a failed/cancelled attempt before an asset commit |

Source descriptor fields are `source_id`, `kind=csv`, normalized workspace-relative `path`, lowercase `sha256`, non-negative integer `byte_size`, UTC RFC 3339 `read_at`, and `fixture_version=member-orders-v1`. `path` is relative to the workspace root, never to the run directory, and must resolve to the approved regular file without `..` or symlink escape.

Artifact descriptor fields are `artifact_id`, closed `category=query | script | output | summary | evidence_document`, run-relative `path`, IANA `media_type`, non-negative integer `byte_size`, and lowercase `sha256`. ID/path rules are:

- `Q-[0-9]{3}` -> `queries/<id>.sql`;
- `S-[0-9]{3}` -> `scripts/<id>.py`;
- `O-[0-9]{3}` -> `outputs/<id>.<approved-extension>`;
- human files use stable IDs `DOC-SUMMARY` and `DOC-EVIDENCE` and fixed root paths;
- core JSON records are referenced by their dedicated fields and are not duplicated in `artifacts`.

Controller media-type clarification, 2026-08-20: exact values are `application/sql` for `Q-*.sql`, `text/plain` for `S-*.py` because no Python-specific subtype is registered in the IANA standards tree, `application/json` for `O-*.json`, and `text/markdown` for `summary.md`/`evidence.md`. A succeeded reference run indexes exactly `Q-001`, `S-001`, `O-001`, `O-002`, `DOC-SUMMARY`, and `DOC-EVIDENCE`; an empty Artifact array is valid only while in progress or for a failed/cancelled attempt that committed no assets.

Status variants:

| Status | Required additions | Forbidden additions |
|---|---|---|
| `in_progress` | none | `ended_at`, `evidence`, `terminal_detail` |
| `succeeded` | `ended_at`; `evidence` with exact path `evidence.json` and SHA-256 | `terminal_detail` |
| `failed` | `ended_at`; `terminal_detail` with `stage`, stable `error_code`, optional sanitized `message` | `evidence` |
| `cancelled` | `ended_at`; `terminal_detail` with `stage` and no error code | `evidence` |

`ended_at` is UTC RFC 3339 and cannot precede `started_at`. No JSON `null` is valid. Optional means absent. The status transitions are only `in_progress -> succeeded | failed | cancelled`; terminal records are immutable.

## Evidence Index Contract

`evidence.json` exists only for `succeeded` and is a closed object with:

- `schema_version`: exact `1.0`;
- `run_id`: same UUIDv7;
- `findings`: non-empty ordered array;
- `evidence_items`: non-empty ordered array.

A Finding has exactly:

- `finding_id`: unique run-local `F-[0-9]{3}`;
- `statement`: bounded analytical statement;
- `status`: `supported | contradicted | inconclusive`;
- `evidence_ids`: non-empty unique references for supported or contradicted; may be empty only for an inconclusive Finding whose limitation states why no probative Evidence exists;
- `limitations`: non-empty array of non-empty strings.

An Evidence Item has exactly:

- `evidence_id`: unique run-local `E-[0-9]{3}`;
- `description`: non-empty string;
- `source_ids`: non-empty unique references;
- `artifact_ids`: non-empty unique references to indexed `Q-`, `S-`, or `O-` assets;
- optional `result_reference`: closed object with `artifact_id` and an RFC 6901 JSON Pointer into a structured `O-` asset.

The JSON Pointer field name is `json_pointer`. It accepts the empty pointer or any valid sequence of `/`-prefixed reference tokens with only RFC 6901 `~0` and `~1` escapes.

The reference run uses `F-001`. Application validates every local reference, checksum, source association, formula result, limitation, and Markdown projection before success. `supported` does not mean authoritative truth; it means the stated Finding is supported under the confirmed synthetic contract.

## Human Documents and Assets

The repository-owned acceptance workspace is `examples/member-analysis/`; its canonical source is `examples/member-analysis/member-orders-v1.csv`, seen by the use case as workspace-relative `member-orders-v1.csv`. No other example or fixture path is approved for product activation.

The successful layout is:

```text
.xanthil/runs/<run_id>/
├── run.json
├── analysis-contract.json
├── evidence.json
├── summary.md
├── evidence.md
├── queries/Q-001.sql
├── scripts/S-001.py
└── outputs/
    ├── O-001.json
    └── O-002.json
```

- `Q-001.sql` is repository-owned canonical read-only SQL for the metric oracle.
- `S-001.py` is repository-owned canonical deterministic Python validation for the same oracle using an independent implementation path.
- `O-001.json` is the closed SQL calculation result.
- `O-002.json` is the closed Python validation result.
- JSON outputs contain only metric IDs and numeric results, not source rows.
- `summary.md` and `evidence.md` are generated from or checked against confirmed/verified structures and are indexed like other human assets.

`O-001.json` and `O-002.json` share one closed result object. `additionalProperties` is false at every level; missing and `null` values are invalid. Fields are:

- `schema_version`: exact `1.0`;
- `run_id`: the run UUIDv7;
- `source_id`: exact `SRC-001`;
- `source_sha256`: the verified fixture SHA-256;
- `calculation_kind`: `sql` for O-001 or `python_validation` for O-002;
- `baseline` and `recent`: closed objects containing `window_id`, inclusive `start_date`, inclusive `end_date`, integer `order_count`, integer `active_member_count`, integer `repeat_purchaser_count`, and exact `repurchase_member_rate` as a closed reduced-rational object with integer `numerator` and positive integer `denominator`;
- `repurchase_member_rate_delta_pp`: exact recent-minus-baseline percentage-point difference as a closed reduced-rational object with signed integer `numerator` and positive integer `denominator`;
- `signal`: closed object containing exact `comparison=recent_lt_baseline` and `status=supported | contradicted | inconclusive`.

The reference rates are stored as baseline `2/3`, recent `1/9`, and delta `-500/9` percentage points. The two outputs must match in every field except `calculation_kind`. Exact rational values are authoritative; Markdown one-decimal formatting is a projection.

Canonical source text is version-controlled production logic after implementation approval; the model cannot supply or edit it. Exact text and output schemas are frozen by tests derived from the formulas and closed fields in the specification, not by an unreviewed model response.

## Port Contracts

### Public Entry Modules and Runtime Surface

Controller technical addendum, 2026-08-20: the following entry modules and minimum public surface are frozen for Test Design and implementation. This addendum makes the already-approved seams executable; it does not add product behavior or broaden scope.

| Entry module | Minimum public surface |
|---|---|
| `packages/product-core/local-analysis.mjs` | `createLocalAnalysisDomain()` returning the pure business-rule and closed-contract operations, including `validateAnalysisProposal(proposal)`, used by Application and CLI |
| `packages/ports/local-analysis.mjs` | `defineAgentAnalysisRuntime`, `defineLocalAnalysisExecution`, `defineRunArtifactStore`; each validates and freezes one business-oriented implementation object without importing infrastructure |
| `packages/application/local-analysis.mjs` | `createLocalAnalysisApplication(dependencies)`; the instance exposes `start({ question, source })`, whose handle exposes `discover()`, `confirm(proposal)`, and idempotent `cancel()` |
| `adapters/agent-pi/local-analysis.mjs` | `createPiAgentAnalysisRuntime` |
| `adapters/analytics-duckdb/local-analysis.mjs` | `createDuckDbPythonLocalAnalysisExecution` |
| `adapters/storage-local/local-analysis.mjs` | `createLocalRunArtifactStore` |
| `apps/cli/xanthil.mjs` | `runXanthil({ input, output, application })` |
| `profiles/personal/local-analysis.mjs` | `createPersonalLocalAnalysisProfile({ workspaceRoot, runRoot, provider, modelId })` with no ambient-model fallback |

The baseline Agent Analysis Runtime implementation object exposes `openSession`;
the returned session exposes ordered `discover`, `execute`, and idempotent
`cancel` operations. The baseline Local Analysis Execution implementation
object exposes `profileApprovedFixture`, `calculateMemberRepurchaseMetrics`,
and `validateMemberRepurchaseMetrics`; the baseline Run Artifact implementation
object exposes `beginRun`, `commitConfirmedContract`, `appendAsset`,
`replaceManifest`, `commitSuccess`, and `readTerminalRun`. TASK-010 R3
normatively adds the preflight methods and signal/result refinements in its
later Design Addendum; this historical baseline is not an exclusivity claim.

Controller technical addendum, 2026-08-20 — Run Artifact command payloads and semantic-writer correction:

- Every Run Artifact command is run-explicit and stateless across run identity; an Adapter instance may serve multiple attempts without an implicit “current run”. The exact mutating commands are `beginRun({run_id,initial_manifest,cancellation_signal})`, `commitConfirmedContract({run_id,contract,cancellation_signal})`, `appendAsset({run_id,asset,cancellation_signal})`, `replaceManifest({run_id,next_manifest,cancellation_signal})`, and `commitSuccess({run_id,next_manifest,evidence,summary,evidence_document,cancellation_signal})`; terminal inspection remains `readTerminalRun({run_id})` and is not an admitted attempt write.
- `initial_manifest` is the complete Product-Core-validated closed `in_progress` Run Manifest. It already contains the same UUIDv7, start time, runtime/model provenance, exact confirmed-contract path/checksum, canonical Source descriptor, and `artifacts=[]`; it contains no `ended_at`, Evidence reference, or terminal detail. `beginRun` atomically creates the run directory and this exact `run.json`, or reports `RUN_COLLISION` without changing prior bytes. A partial reservation manifest is not a supported durable schema.
- `commitConfirmedContract` writes the exact closed confirmed snapshot as `analysis-contract.json` and returns its persisted descriptor/checksum evidence. The bytes are canonical UTF-8 `JSON.stringify(value)` bytes. Its checksum must equal the contract descriptor already present in `initial_manifest`; mismatch fails before changing `run.json`.
- `appendAsset` requires the same `run_id` plus the closed Application-assigned asset and returns the persisted Artifact descriptor. No command derives run identity from prior calls or ambient state.
- `replaceManifest` requires the same `run_id` plus one complete Product-Core-valid next manifest. It atomically replaces only `run.json`; it cannot assemble missing semantic fields, infer business time/status, or mutate a terminal manifest.
- `commitSuccess` receives the complete Product-Core-validated `succeeded` `next_manifest` from Application, plus the closed Evidence Index object and the two validated Markdown strings. Application computes and validates the exact Evidence reference and the `DOC-SUMMARY`/`DOC-EVIDENCE` Artifact descriptors in `next_manifest`; existing Q/S/O descriptors come from prior `appendAsset` results. The Adapter verifies byte sizes and checksums against the supplied manifest, writes `evidence.json`, `summary.md`, and `evidence.md`, then atomically publishes `run.json` last. It does not add fields, choose timestamps, assemble a status, or infer provenance.
- Command results are also closed: `beginRun` returns exactly `{run_id}`; `commitConfirmedContract` returns exactly `{committed:true,descriptor:{path:'analysis-contract.json',byte_size,sha256}}`; `appendAsset` returns exactly `{appended:true,descriptor}` where `descriptor` is the persisted closed Artifact descriptor; `replaceManifest` returns exactly `{replaced:true}`; `commitSuccess` returns exactly `{committed:true,success_manifest_is_last:true}`; and `readTerminalRun` returns exactly `{manifest,assets}` with the persisted supported terminal manifest and exact indexed asset bytes/descriptors. `assets` is ordered exactly like `manifest.artifacts`; every entry contains the descriptor fields plus exact persisted `bytes`. A succeeded reference read therefore returns all six Q/S/O/Markdown assets, while a failed or cancelled read returns every successfully appended asset retained in that terminal manifest. Missing, null, unknown, unindexed, reordered, or checksum-disagreeing result fields fail closed at Application or the unchanged Port contract driver.
- Application passes `run_id` and the shared attempt signal on every mutating Artifact command, validates the initial and final manifests through Product Core, and returns success only after `commitSuccess` has durably published the exact succeeded manifest. Pre-deadline failure/cancellation may use a complete `next_manifest` through `replaceManifest`; R3 deadline never does. The model and analytical Adapters never receive the Artifact Port.
- Every failed or cancelled `next_manifest` retains, in approved manifest order, the descriptors of assets whose `appendAsset` calls already succeeded before the terminal transition. It never drops an already-persisted asset from the terminal index, indexes an uncommitted asset, or adds successful Evidence/Markdown references.
- Test-private doubles and the real filesystem suite reject missing, unknown, mismatched, or cross-run command fields. Concurrent or interleaved calls for two run IDs cannot contaminate identity or bytes. No test-only fault selector is added to these production commands.

Controller technical addendum, 2026-08-20 — TASK-004 concrete Adapter construction:

- `createDuckDbPythonLocalAnalysisExecution` accepts exactly one closed configuration object `{workspaceRoot}`. `workspaceRoot` is an absolute existing directory supplied by the composition root; there is no current-directory, environment, home-directory, or repository fallback. Every approved relative Source path is resolved beneath this root with real-path containment and regular-file checks before reading. The Adapter owns the frozen canonical SQL/Python bytes and invokes only the separately version-checked `duckdb` CLI and Python standard-library runtime; callers and models cannot supply executable names, query/script text, module paths, environment, output paths, or engine options.
- `createLocalRunArtifactStore` accepts exactly one closed configuration object `{runRoot}`. `runRoot` is an absolute existing safe directory supplied by the composition root; there is no current-directory, environment, home-directory, or `.xanthil` fallback. All run directories, core filenames, temporary files, and numbered assets are derived only from validated Application IDs and fixed mappings beneath this root.
- Both factories reject missing, null, relative, unknown-field, non-directory, symlink-escaping, or unsafe configuration before a read/write/process effect. Test-owned real Adapter suites create isolated system-temporary workspace/run roots and place only the canonical fixture there. Production code never discovers `tests/**` or uses a test fixture path.
- Adapter contract tests exercise the exact same business operations as the deterministic doubles. The Local Analysis real half proves actual DuckDB CLI and Python standard-library execution, exact independent results/canonical bytes, source mutation/containment, cancellation/deadline, forbidden-input closure, and sanitized errors. The Artifact real half proves real files and bytes, collision, fixed paths, append-only create-if-absent, atomic core replacement/final-success ordering, terminal immutability, containment/symlink rejection, and injected write-boundary failure using only test-private filesystem fault control; no fault selector enters the production factory or Port.

Controller technical addendum, 2026-08-20 — TASK-003 executable Port protocol:

- `createLocalAnalysisApplication` receives one closed dependency object
  containing `agentRuntime`, `localAnalysisExecution`, `runArtifactStore`,
  explicit `model={provider,model_id}`, `clock`, and the TASK-010 R3
  composition-owned `deadlineScheduler`. Missing, unknown, null, ambient, or
  non-approved model configuration fails before `openSession`; `start()`
  remains exactly `start({question,source})` and never selects a model.

R4 changes only this Application-owned frozen model identity to
`{provider:'minimax-cn',model_id:'MiniMax-M3'}`. The same value is required by
dependency validation, compared to runtime `actual_model`, and written as run
provenance. No Application parsing, business semantic, Port, lifecycle, or
other model-selection logic changes. Mimo is rejected as a no-fallback negative
identity, not an alternate default.
- The Discovery proposal is a transient closed Application value. It presents the frozen original/clarified question, objective, `SRC-001` fixture metadata, two windows, five metric definitions, signal rule, output requirements, and constraints. Confirmation compares this complete value exactly. The persisted `analysis-contract.json` is then constructed from the already-frozen snapshot fields with added `run_id` and `confirmed_at`; transient fixture display metadata is not a new persistent field.
- `createLocalAnalysisDomain()` additionally exposes exactly `validateAnalysisProposal(proposal)`. It accepts one positional transient Proposal and returns the same valid input reference. It does not mutate, freeze, clone, default, coerce, read/write, observe time/environment, import infrastructure, or expose a second export, options, dependency, mode, proof surface, or alternate scenario. The complete Proposal is a closed plain object with exactly `schema_version`, `original_question`, `question`, `objective`, `source_ids`, `fixture`, `time_windows`, `metrics`, `signal_rule`, `output_requirements`, and `constraints`. It validates the exact first-scenario values and order: version `1.0`; approved original and clarified questions; frozen objective; exactly `['SRC-001']`; fixture `{source_id:'SRC-001',version:'member-orders-v1',kind:'csv',path:'member-orders-v1.csv',sha256:'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0',byte_size:530,columns:['order_id','member_id','ordered_on'],date_coverage:{start_date:'2026-08-01',end_date:'2026-08-14'}}`; and ordered windows `{window_id:'baseline',start_date:'2026-08-01',end_date:'2026-08-07'}` then `{window_id:'recent',start_date:'2026-08-08',end_date:'2026-08-14'}`.
- The ordered `metrics` array is exactly the five closed values from the Analysis Contract Snapshot: `order_count`/`Order count`/`count(distinct order_id)`/`synthetic_order`/`orders_in_the_applicable_window`/`orders`; `active_member_count`/`Active-member count`/`count(distinct member_id with at least one distinct order in the window)`/`synthetic_order`/`members_with_orders_in_the_applicable_window`/`members`; `repeat_purchaser_count`/`Repeat-purchaser count`/`count(distinct member_id with at least two distinct orders in the window)`/`synthetic_order`/`members_with_orders_in_the_applicable_window`/`members`; `repurchase_member_rate`/`Repurchase-member rate`/`repeat_purchaser_count / active_member_count`/`synthetic_order`/`members_with_orders_in_the_applicable_window`/`ratio`; and `repurchase_member_rate_delta_pp`/`Repurchase-member rate delta`/`(recent repurchase_member_rate - baseline repurchase_member_rate) * 100`/`synthetic_order`/`members_with_orders_in_the_applicable_window`/`percentage_points`. `signal_rule` is exactly `{comparison:'recent_repurchase_member_rate_lt_baseline',supported_status:'supported'}`. `output_requirements` is exactly `{finding:true,evidence:true,summary:true,canonical_sql:true,canonical_python_validation:true,structured_outputs:['O-001','O-002']}`. `constraints` is exactly `{synthetic_fixture_only:true,raw_row_model_egress:false,approved_tools_only:['profile_approved_fixture','calculate_member_repurchase_metrics','validate_member_repurchase_metrics'],network_tools:false,generic_code_or_filesystem:false,decision_recommendation_or_action:false}`. Unsupported `schema_version` fails exactly `CONTRACT_VERSION_UNSUPPORTED`; every other missing, null, non-plain, extra, wrong, reordered, or wrong-cardinality/nested-semantics value fails exactly `VALIDATION_FAILED`, with no raw value or nested cause exposed.
- `openSession` receives `discovery_tools=[]` and exactly three ordered execution-tool descriptors. Each descriptor is a frozen closed object `{tool_name, invoke}`. `tool_name` is one approved name and `invoke` is an Application-owned callback accepting only `{correlation_id, arguments}`; `correlation_id` is a non-empty run-local unique string and `arguments` is exactly `{}` for this fixture-specific Change. The callback closes over the approved source, confirmed contract, shared cancellation signal, call-order state, and Artifact writer. It does not accept model-selected path, SQL, Python, command, environment, endpoint, output location, deadline, or retry fields.
- `session.execute` accepts exactly `{confirmed_contract,cancellation_signal,deadline_seconds}`. `deadline_seconds` is required and must be an integer in the closed range `0..300`; missing, null, non-integer, negative, above `300`, or unknown input fields map to sanitized `PROTOCOL_FAILURE` before any Execution prompt, tool admission, or other effect from that call, and the Adapter never defaults a missing value to `300`. Product Application supplies exactly `300`. A test-owned direct Agent Runtime Port call may supply exactly `0` only after successful Discovery; this means the Execution deadline is already exhausted before any Execution prompt or tool admission and follows the exact immediate-timeout sequence defined below. For `1..300`, the confirmed runtime turn invokes the three registered callbacks in exact order: `profile_approved_fixture`, `calculate_member_repurchase_metrics`, then `validate_member_repurchase_metrics`. Application rejects early, repeated, out-of-order, malformed, unknown, late, or post-terminal invocation before an Adapter call. The runtime turn completes only after the callbacks resolve and returns exactly `{actual_model,finding}`. `actual_model` is the closed `{provider,model_id}` identity actually used; `finding` is the closed Finding proposal already defined by the Product Core contract. Application never runs all three analytical operations after the runtime has already returned.
- `preflightApprovedFixture` returns exactly
  `{source_id,kind,path,sha256,byte_size,fixture_version,read_at}` from its
  actual pre-Discovery identity byte read. `profileApprovedFixture` returns
  exactly the closed object
  `{source_id,fixture_version,row_count,columns,date_coverage}` after its
  post-confirmation recheck/read; it does not replace the persisted `read_at`.
  `columns` is the exact ordered `order_id,member_id,ordered_on` array;
  `date_coverage` is the closed `{start_date,end_date}` object for
  `2026-08-01` through `2026-08-14`; `row_count` is `20`.
  `calculateMemberRepurchaseMetrics` and
  `validateMemberRepurchaseMetrics` use one isomorphic closed envelope
  `{result,canonical_asset}`. `result` is the already-defined closed aggregate
  result plus exact `calculation_kind=sql|python_validation`. `canonical_asset`
  is the closed `{artifact_id,category,path,media_type,bytes}` value: exact
  `Q-001/query/queries/Q-001.sql/application/sql` for calculate and exact
  `S-001/script/scripts/S-001.py/text/plain` for validate; `bytes` is a
  non-empty `Uint8Array` containing repository-owned canonical code.
  Application validates each envelope, writes `canonical_asset` unchanged,
  derives and writes `O-001/O-002` from the verified `result`, and returns only
  the bounded `result` through the callbacks. Canonical bytes never originate
  from or return to the model.
- `appendAsset` receives the explicit `run_id` and an Application-assigned closed asset value containing its approved ID, category, path, media type, and bytes. The Artifact Adapter computes and returns the persisted descriptor; the model never calls the Artifact Port. Successful finalization receives Application's complete validated succeeded manifest, writes validated Evidence and Markdown, and publishes that manifest last.
- R3 supersedes the historical immediate-abort cancellation rule: one shared
  `AbortSignal` covers Runtime, analytical calls, and every mutating Artifact
  command. User cancellation closes normal admission and requests Runtime
  cancellation but does not abort that deadline signal first; a cancelled
  manifest is admissible only after Runtime settles before deadline. Deadline
  abort closes all admission and writes no terminal manifest. The 30-second
  analytical budgets remain Application-supplied; the 300-second total budget
  surrounds the complete post-confirmation attempt.

These descriptors are business Port values, not Pi SDK `ToolDefinition`, TypeBox schema, provider message, or extension objects. The Pi Adapter later translates each descriptor into the installed SDK's custom-tool registration shape and translates SDK call IDs/parameters/signals back into this protocol. No SDK type or custom-tool implementation enters Application, Product Core, or `packages/ports`.

Deterministic doubles, contract-suite drivers, fault injectors, static scope checks, and dependency/readiness test helpers belong under the approved test paths. Production modules SHALL NOT export `verify*Contract`, `inspect*Surface`, test-mode selectors, fixture-oracle substitutes, or other APIs whose only consumer is the test suite.

Controller-requested TASK-005 technical addendum, 2026-08-20 — internal Pi SDK construction seam:

- The only business-facing export remains `createPiAgentAnalysisRuntime`. Its production call is exactly `createPiAgentAnalysisRuntime({provider,model_id})`, and it returns only the existing Agent Analysis Runtime Port implementation. The personal Profile, Application, and Ports cannot pass or receive Pi SDK values. There is no global-package, CLI, RPC, environment-switch, test-mode, or ambient-model fallback.
- The same factory has one optional construction-only dependency-injection argument: `createPiAgentAnalysisRuntime({provider,model_id},{sdkSessionFactory})`. The dependency object is closed and contains exactly the one function `sdkSessionFactory`; it is never forwarded by a product surface or composition Profile. Omitting it selects the production implementation backed by the project-local `@earendil-works/pi-coding-agent@0.84.2` ESM export; the deterministic test implementation is passed only by Adapter contract tests. These are the seam's only two implementations. This argument is not a test mode, output substitute, product/Profile option, environment switch, or hardcoded deterministic branch. It replaces only SDK session construction: both implementations cross the same Adapter phase, prompt, tool, event, result, timeout, cancellation, model-verification, and error-mapping logic.
- `sdkSessionFactory(request)` receives one frozen closed request with exactly `requested_model`, `system_prompt`, `custom_tools`, and `policy`. `requested_model` is exactly `{provider,model_id}` from the first argument. `system_prompt` is Adapter-owned fixed analysis instruction text and contains no ambient file/context content. `custom_tools` is the exact ordered three-item Pi registration translation for `profile_approved_fixture`, `calculate_member_repurchase_metrics`, and `validate_member_repurchase_metrics`; every item has exactly `name`, `label`, `description`, `parameters`, `executionMode`, and `execute`. `parameters` is a TypeBox closed empty object (`additionalProperties:false`), `executionMode` is `sequential`, and `execute(toolCallId,params,signal)` accepts a non-empty Pi call ID and exact `{}`, rejects an aborted/closed phase, invokes the corresponding business descriptor as `{correlation_id:toolCallId,arguments:{}}`, validates the bounded business result, and returns only Pi text content containing canonical `JSON.stringify(result)` plus empty `details`. It never returns canonical asset bytes, raw rows, credentials, paths, or SDK/provider objects.
- `policy` is exactly `{allowed_tool_names,initial_active_tool_names,builtin_tools,session_persistence,resource_discovery,retry,compaction,model_catalog_network,prompt_template_expansion}`. The values are the three approved names in order, `[]`, `[]`, `"memory"`, `{extensions:false,skills:false,prompts:false,themes:false,context_files:false}`, `false`, `false`, `false`, and `false`, respectively. Missing, null, reordered, duplicate, or unknown fields fail before SDK session creation.
- `sdkSessionFactory(request)` binds only the requested provider/model and returns `Promise<facade>`, where `facade` is frozen and has exactly `subscribe`, `setActiveTools`, `prompt`, `getActualModel`, `abort`, `waitForIdle`, and `dispose`. Every method rejects missing or extra arguments before an effect, and the Adapter rejects missing, unknown, null, non-frozen, or wrong-valued result fields. No method returns a Pi object.
  - `subscribe(listener)` is synchronous, accepts exactly one function, and returns exactly one zero-argument `unsubscribe` function. `listener(event)` is called with exactly one frozen event from the bounded internal union below and must return `undefined`; any throw or non-`undefined` result is `PROTOCOL_FAILURE`. `unsubscribe()` is idempotent, accepts no arguments, returns `undefined`, and prevents later listener admission.
  - `setActiveTools(names)` is synchronous and accepts exactly one frozen array: `[]` in Discovery or the exact ordered three approved names in Execution. It calls Pi `setActiveToolsByName(names)`, then reads the Pi active-tool inventory and returns exactly the frozen closed observed status `{active_tool_names:[...]}`; Application rejects a result differing from the approved phase policy.
  - `prompt(text,{expandPromptTemplates:false})` accepts exactly one non-empty Adapter-owned string and the exact frozen options object, and returns `Promise<{settled:true}>`. It resolves only after the accepted prompt run and its `agent_settled` event complete; it returns no message, transcript, model, usage, or provider value. Rejection is sanitized by the Adapter.
  - `getActualModel()` is synchronous, accepts no arguments, and, after SDK realization, returns exactly the frozen closed `{provider,model_id}` projected from the active Pi model. Before the first prompt realizes an SDK session it fails with sanitized `MODEL_UNAVAILABLE` rather than reporting the requested identity as actual. The Adapter checks it after each settled prompt.
  - `abort()` accepts no arguments, is idempotent, and returns `Promise<{aborted:true}>` after the underlying abort request settles. `waitForIdle()` accepts no arguments, is idempotent, and returns `Promise<{idle:true}>` only when no turn, tool, retry, continuation, or callback result remains admissible. R3 does not require Application to await either on hard deadline; it closes admission and discards late completion.
  - `dispose()` is synchronous, accepts no arguments, is idempotent, and returns exactly the frozen `{disposed:true}` after unsubscribing and releasing the underlying session once. After disposal, only repeated `dispose()` may return the same status; every other facade method fails closed without an SDK effect.
- The bounded `listener(event)` union is exactly: `{type:"message_update",assistantMessageEvent:{type:"text_delta",delta}}`; `{type:"message_end",message:{role:"assistant",content,stopReason}}`, where `content` is an ordered array of closed `{type:"text",text}` blocks and `stopReason` is the Pi terminal string; `{type:"tool_execution_start",toolCallId,toolName,args}`; `{type:"tool_execution_end",toolCallId,toolName,result,isError}`; `{type:"agent_end",willRetry}`; or `{type:"agent_settled"}`. String IDs/names/deltas/text are non-empty where used, `args` is exact `{}`, `result` is exactly the bounded translated custom-tool result, `isError`/`willRetry` are booleans, and every object is closed. The production implementation projects only these fields from Pi events and discards raw messages, thinking, usage, session, provider, and SDK fields before calling the listener.
- The production `sdkSessionFactory` eagerly imports and verifies the project-local Pi ESM surface. R3 `preflightModel` creates exactly one local `ModelRuntime` with `{allowModelNetwork:false,refreshOnCreate:false}`, performs exactly one `runtime.refresh({allowNetwork:false})`, and resolves exact `getModel(provider,model_id)` before Session opening; it creates no AgentSession or provider/model network call. `openSession` then builds one inert `ResourceLoader`, `SessionManager.inMemory()`, and `SettingsManager.inMemory({retry:{enabled:false,maxRetries:0},compaction:{enabled:false}})`, and creates exactly one AgentSession from the cached explicit runtime/model with `noTools:"all"`, the exact custom tools, inert loader, in-memory managers, and no scoped alternative model. It binds its listener before Discovery; Execution synchronously applies and reads the active-tool inventory. That one realized session spans Discovery and Execution and is never replaced. The inert loader returns no extensions, skills, prompts, themes, Agent context files, append-system-prompt content, or resource paths. R3 retires the old TEST-XCLI-011 zero-local-credential-read assertion; the replacement assertion is no provider/model network call, no session persistence, no ambient model, and no credential value in prompt/result/log/trace/Artifact.
- One facade instance spans both turns. Discovery requires phase `created`, keeps the active tool list empty, and prompts once with an Adapter-owned instruction plus canonical JSON containing only the approved question and already-approved non-row metadata. It accepts exactly one final assistant text value that parses as the complete closed Analysis Contract proposal; token/delta boundaries, thinking content, and prose outside that JSON are not contract semantics. Execution requires the accepted Discovery result and the confirmed contract, enables exactly the three tools, prompts once with Adapter-owned instructions plus canonical JSON of the confirmed contract, and accepts exactly one final assistant text value that parses as `{finding}` with the already-approved closed Finding. The Adapter returns `{actual_model,finding}` only after the turn settles, all three correlated tools completed once in order, and `getActualModel()` still exactly matches the requested identity. It never hardcodes a proposal, Finding, or metric result in production.
- The accepted per-prompt terminal event sequence is one final Pi `message_end` whose `message.role` is `assistant` and `stopReason` is `stop`, followed by one `agent_end` with `willRetry:false`, followed by one `agent_settled`. The authoritative result text is the ordered concatenation of only the final assistant message's text content blocks; streamed `message_update/text_delta` events may be mapped as bounded non-authoritative progress but are never reparsed as a result. Discovery admits no `tool_execution_*` event. Execution admits exactly three `tool_execution_start`/`tool_execution_end` pairs in approved order with matching `toolCallId`, `toolName`, arguments, and non-error completion, and only after each matching translated `execute` promise settles. Missing, reordered, duplicate, post-settlement, `isError:true`, or unmatched terminal/tool events are protocol or tool-policy failure as applicable. Routine start/turn/message events that carry no accepted output may be ignored; retry, compaction, queued continuation, bash, extension, or additional terminal activity is forbidden.
- The Adapter owns raw terminal transport syntax before Port return: it removes only the closed leading think prefix, requires exactly one JSON object, and detects duplicate object members at every nesting level while parsing. It may translate only bounded text deltas and the final parsed business value. It rejects malformed JSON, unknown/extra response fields, missing or duplicate final assistant results, failed/length/aborted stop reasons, early/out-of-order/repeated/unknown tool execution, bad/duplicate correlation, malformed or late events, retry/compaction activity, tool output after closure, or an actual-model mismatch. Application/Product Core owns object-order-insensitive business semantic validation and canonical serialization, not raw duplicate detection. Raw messages, thinking, transcript history, Pi session ID, provider payload, SDK error/cause, credential material, and install paths are never returned or persisted.
- Adapter session phases are closed as `created -> discovery_running -> discovered -> execution_running -> completed`, with cancellation from any non-completed phase moving once to `cancelled` after quiescence and any mapped failure moving once to `failed` after quiescence. A second Discovery, Execution before successful Discovery, repeated Execution, or any operation after failed/cancelled state returns the approved sanitized protocol/cancellation outcome without another prompt. `cancel()` after `completed` is an idempotent acknowledgement with `was_confirmed:true`; it neither changes the already-returned result nor calls the disposed SDK facade.
- R3 external deadline closes event/tool-result admission, unsubscribes and
  requests abort without awaiting permanent work, and returns logical
  `TIMEOUT`; it creates no terminal Artifact write. The direct
  `deadline_seconds=0` Adapter boundary still performs its local
  `unsubscribe -> abort -> waitForIdle -> dispose -> TIMEOUT` protocol, but it
  is not the Application hard-deadline scheduler. `cancel()` is idempotent; no
  automatic retry occurs. Construction/model readiness maps to
  `MODEL_UNAVAILABLE`; provider/turn failure or wrong actual model maps to
  `MODEL_EXECUTION_FAILED`; forbidden tool behavior maps to
  `TOOL_POLICY_VIOLATION`; malformed SDK lifecycle/result maps to
  `PROTOCOL_FAILURE`; all messages are stable codes without raw causes.
- TEST-XCLI-006 supplies the deterministic facade and proves no SDK/provider
  turn. R3 TEST-XCLI-011 omits injection and proves production-default
  `preflightModel` plus `openSession` creates the cached-runtime/single-session
  path: no provider/model network call, session persistence, ambient selection,
  or credential exposure. Necessary local credential read is permitted. It now
  supersedes the legacy unrealized-Session/readiness assertion. TEST-XCLI-021
  proves package/version/ESM; TEST-XCLI-013 is the real prompt/provider proof.

Rejected seam: injecting a provider transport, credential store, `ModelRuntime`, or several individual Pi constructors would permit more of the real SDK graph to run offline, but it would expose auth/catalog/stream internals, require a wide shallow dependency surface, and make tests depend on Pi implementation details unrelated to the Agent Analysis Runtime contract. The selected single session factory keeps that complexity behind one deep Adapter boundary while preserving the production-default SDK path and the unchanged business Port.

### Agent Analysis Runtime Port

The Port models one in-memory Analysis Assistant session, not generic chat or an SDK wrapper. It accepts:

- explicit provider/model identity;
- approved Discovery instructions and fixture metadata;
- an Application-owned allowlist of tool descriptors;
- an Application-provided cancellation signal and event sink;
- the confirmed contract only after the Analysis Gate.

It provides:

- one session with ordered Discovery then Execution turns;
- structured Analysis Contract proposal output;
- approved tool invocation requests with correlation IDs;
- bounded user-visible text/event deltas;
- final structured Finding proposal;
- explicit actually-used provider/model identity;
- sanitized `unavailable | model_failure | policy_violation | timeout | cancelled | protocol_failure` outcomes.

Contract invariants:

- built-in Pi tools are disabled;
- an unknown tool cannot be forwarded;
- tool results return only through the correlated approved call;
- cancellation is idempotent and prevents later calls/events from becoming accepted product output;
- event order is stable per session, while token/chunk boundaries are not product semantics;
- no Pi session ID, SDK class, message object, raw provider payload, credential, transcript, CLI flag, process handle, or filesystem session is a Port value.

The same business contract intent runs against the Pi Adapter implementation and an in-memory Runtime double. TEST-XCLI-006 keeps the Adapter behavior real while replacing only SDK construction with the deterministic injected facade; that lifecycle is not a real Pi session or SDK turn. Under R3, TEST-XCLI-011 exercises production-default local-only `preflightModel` and then `openSession`, which creates the one AgentSession from the cached Runtime/model; it asserts no provider/model network call, persistence, ambient selection, or credential exposure, while permitting necessary local credential read. TEST-XCLI-013 is the real prompt/provider path after deterministic GREEN. The Adapter consumes the bounded internal event projection and verifies the actually-used model. Pi session persistence is disabled for this Change.

### TASK-009 Prompt-Contract Clarification

Controller accepts `spec-task-009-prompt-clarification.md` R3.1 as the normative
closure for the real-Pi prompt boundary. Discovery does not pass only a vague
question or a complete Proposal to echo: Application passes a deeply frozen,
business-named closed `discovery_context` with `protocol`, `source`,
`comparison`, and `delivery` groups through the Runtime Port. It maps to, but
does not share the shape of, the model-produced Analysis Proposal. Execution
passes a separate closed `finding_context` with `protocol`, `identity`, and
`interpretation` groups alongside the confirmed contract. Neither transient
context is persisted. Existing Product Core Proposal/Finding validators remain
the acceptance authority; Adapter constructs neither output nor business fact.

R3 freezes the validation authority split. Application/Product Core owns exact
fixture/hash, questions, metrics, signal rule, output/constraint meaning,
Finding/Evidence identity and limitation/prohibited-claim semantics. The Pi
Adapter validates only deeply frozen closed transport shape/order/types,
safe-relative source paths, SHA syntax, and ID syntax/uniqueness before
serialization. R3.1 disposes every C1 mutation individually; it defines no
generic context category enum. A syntactically
valid but business-wrong context is not an Adapter responsibility; it is
prevented by Application construction and Product Core integration/domain
validation. No old-shape fallback is permitted.

The exact fixed system-prompt text and exact `XANTHIL_DISCOVERY_V1` /
`XANTHIL_EXECUTION_V1` envelopes are frozen in the clarification. The prompt
contains only transport policy: Discovery calls no tools; Execution calls each
currently admitted tool once, in admitted order, with exact `{}`, and waits for
success before terminal JSON. Tool-call assistant intermediates are not
terminal JSON. Application-owned context carries all business facts and output
mappings. `JSON.stringify` without replacer or spacing is the frozen canonical
serialization; insertion order is normative.
Full definitions, negative cases, egress boundary, rollback, and Test/Worker
gate are in the clarification. This changes no Requirement/AC/model/tool/
fixture/result contract.

### Local Analysis Execution Port

The Port offers exactly three operations:

1. `profileApprovedFixture`: validates source identity and returns only schema, row count, date coverage, and closed-value validation.
2. `calculateMemberRepurchaseMetrics`: executes the canonical SQL and returns closed repurchase metric results plus canonical query bytes for Artifact recording.
3. `validateMemberRepurchaseMetrics`: executes the canonical Python validator and returns closed repurchase metric results plus canonical script bytes for Artifact recording.

All inputs identify the already-approved source and confirmed contract by Application values; no operation accepts model-supplied path, SQL, Python, command, module, environment, endpoint, or output location. Each call has a hard 30-second personal-Profile v0.1 technical deadline and cancellation. Outputs are bounded to the small closed result contract; source rows never return through the tool.

For executable deadline evidence, `deadline_seconds` is a required integer in the closed range `0..30`. Application supplies exactly `30` in product execution. A test-owned direct Port call may supply `0`, which means the deadline is already exhausted and must return sanitized `TIMEOUT` before spawning DuckDB/Python or reading result bytes; values below `0`, above `30`, non-integers, or missing values fail closed as invalid Port input.

The DuckDB side binds only the approved CSV as a relation and rejects non-read-only or non-canonical execution. Extensions, attach, copy/export, secret managers, external access, arbitrary file functions, persistence, and mutations are disabled or absent. The Python side runs only the canonical validator with a minimal approved standard-library import set, an explicit fixture handle supplied by the Adapter, cleared nonessential environment, fixed working context, no user/model arguments, no subprocess capability, and no network capability in its contract. Pi remains OS-authorized local code; these restrictions are least-capability product controls, not an enterprise sandbox claim.

The same contract suite runs against the real DuckDB/Python Adapter and a deterministic double.

### Run Artifact Port

The Port provides business operations to:

- begin a UUIDv7 run at the fixed workspace run root;
- atomically commit the confirmed contract and initial manifest;
- append an Application-assigned numbered asset if absent;
- atomically replace the non-terminal manifest with another valid non-terminal/terminal manifest;
- atomically commit successful Evidence and Markdown before the succeeded manifest;
- read a supported terminal run for display or verification without mutation.

It does not expose arbitrary read/write/delete/list/repair operations. It validates resolved containment, collision, regular-file type, fixed names, ID/path mapping, checksums, version, status transition, and terminal immutability. Core writes use a same-directory unpredictable temporary file, flush/close as supported, and atomic rename. A failed atomic write retains the prior valid file and maps to `ARTIFACT_WRITE_FAILED`. Assets are create-if-absent and never overwritten.

The same contract suite runs against the local filesystem Adapter and an in-memory deterministic double.

## Pi Adapter and Dependency Choice

The closed integration recommendation is direct JavaScript ESM SDK embedding, not RPC, using project dependency `@earendil-works/pi-coding-agent` exact version `0.84.2` and Node.js `>=22.19.0`. Reasons:

- the approved first-stack direction is production JavaScript `.mjs` on Node.js without a TypeScript compiler or build step;
- the SDK directly supports custom tools, built-in-tool exclusion, events, explicit model selection, abort, and in-memory sessions;
- it avoids a second process protocol and makes the business Port mapping testable without parsing CLI/RPC transport.

The reproducible first-stack contract is:

- one root `package.json` with `private` set to `true`, `type` set to `module`, `packageManager` set to `npm@11.12.1`, and `engines.node` set to `>=22.19.0`;
- one root npm `package-lock.json` generated for that manifest and committed as the sole JavaScript lockfile;
- production JavaScript uses `.mjs`; tests use Node's built-in `node:test` runner; there is no TypeScript compiler, transpiler, bundler, or separate build step for this slice;
- exact direct npm dependencies are only `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`; no other direct package is authorized;
- DuckDB CLI exact `1.5.2` and Python `>=3.9` standard library are version-checked external personal-Profile runtime prerequisites, not npm dependencies;
- the Python validator uses only the standard library and requires no ambient Python package.

The exact accepted root manifest content is:

```json
{
  "private": true,
  "type": "module",
  "packageManager": "npm@11.12.1",
  "engines": {
    "node": ">=22.19.0"
  },
  "dependencies": {
    "@earendil-works/pi-coding-agent": "0.84.2",
    "typebox": "1.3.7"
  }
}
```

Versions are exact strings without ranges. No script, devDependency, optionalDependency, workspace, compiler, bundler, or build field is required for this slice. The accepted TASK-007 lockfile is the npm `11.12.1` resolution of exactly this root manifest.

The globally installed Pi is feasibility evidence only and SHALL NOT satisfy the production dependency. TASK-007 created and verified the frozen root manifest, lockfile, and project-local dependency tree under explicit authority and is Controller accepted. This acceptance authorizes neither a repeat install nor any future manifest, lockfile, version, or dependency change; such drift requires separate authority.

RPC is the rollback integration surface, not a simultaneous implementation. The Controller may switch to RPC only through a Design addendum if direct dependency resolution, engine compatibility, or contract testing demonstrates an SDK blocker. The addendum must freeze executable discovery, exact version check, JSON/RPC framing, process lifecycle, stderr/redaction, cancellation/kill, and equivalent contract-suite evidence. No silent runtime fallback from SDK to RPC is allowed.

## Tool Policy

Discovery tool allowlist: empty. Application may provide the approved fixture filename, column names, fixture version, SHA-256 identity, and date coverage as metadata; no source-row access occurs.

Execution tool allowlist presented through Pi:

- `profile_approved_fixture` -> Application -> Local Analysis Execution Port operation 1;
- `calculate_member_repurchase_metrics` -> operation 2;
- `validate_member_repurchase_metrics` -> operation 3.

Application validates session phase, tool name, zero or closed arguments, call count, source identity, contract identity, deadline, result size, and correlation before invoking an Adapter. The model cannot call the Artifact Port. No Pi built-in tool, generic command, file read/write/edit, arbitrary SQL/Python, HTTP, Web Research, extension, package, or business-action tool exists in either phase.

An unknown, early, late, repeated-after-terminal, malformed, or forbidden call maps to `TOOL_POLICY_VIOLATION`, cancels remaining runtime work, and fails the run if it exists.

## Data Flow and Egress

```text
canonical fixture bytes
  -> Local Analysis Adapter (rows remain local)
  -> aggregate profile/metric results
  -> Application validation
  -> selected Pi model through approved tool-result channel
  -> structured Finding proposal
  -> Application/Product Core validation
  -> local Artifact Adapter
```

Discovery model input: system instructions, user question, and approved non-row metadata. Execution model input: confirmed contract and bounded aggregate tool results. Raw rows are not sent, even though the synthetic fixture was approved for model egress; this establishes a narrower first contract and avoids normalizing unnecessary egress.

The only intended external connection is the selected provider/model through Pi. No tool has network capability. Credentials remain in Pi's approved mechanism and are never read into Application, prompts, events accepted for persistence, tests, or Artifacts. Provider/model identity is provenance; credential identity/value is not.

## Error and Cancellation Mapping

Preflight errors occur before Discovery and use the applicable stable codes in the specification. They make no model call and create no run. `RUN_COLLISION` occurs only after confirmation during run allocation; it creates no new run, leaves the collided directory byte-identical, and returns to the CLI without Execution.

After confirmation, mapping is:

| Source condition | Stage | Stable code / terminal state |
|---|---|---|
| initial contract/run write fails | `contract_persist` | no unsafe success; `ARTIFACT_WRITE_FAILED` if a valid run can be terminally committed, otherwise orphan/in-progress diagnostic only |
| fixture changed or escaped | `source_read` | `SOURCE_CHANGED` or `SOURCE_BOUNDARY_VIOLATION` |
| fixture semantic invalidity | `source_read` | `SOURCE_INVALID` |
| Pi/provider failure after readiness | `runtime` | `MODEL_EXECUTION_FAILED` |
| unknown/forbidden tool | active runtime stage | `TOOL_POLICY_VIOLATION` |
| DuckDB/canonical SQL failure | `analysis_sql` | `ANALYSIS_EXECUTION_FAILED` |
| Python validator failure | `analysis_python` | `ANALYSIS_EXECUTION_FAILED` |
| calculations disagree/reference fails | `validation` | `VALIDATION_FAILED` |
| per-tool or total deadline | active stage or `execution` | `TIMEOUT` |
| Evidence/Markdown/final write fails | `artifact_finalize` | `ARTIFACT_WRITE_FAILED` if safe terminal commit remains possible; otherwise prior valid state only |
| Ctrl-C after run creation | active stage | `cancelled` |
| unexpected sanitized product error | active stage | `INTERNAL_ERROR` |

On Ctrl-C, CLI asks Application to cancel; Application idempotently closes tool admission, signals Pi and active analytical work, discards later model output, and asks the Artifact Port to commit `cancelled`. No success is printed until a `succeeded` manifest is durably committed. A second Ctrl-C or process death may prevent terminalization and leave `in_progress`; later startup may report `abandoned candidate` read-only, but cannot mutate or infer terminal state.

There is no automatic retry. A new user attempt gets a new run ID.

## Atomicity and Crash Semantics

- Application is the only semantic writer and orders every commit.
- A run becomes visible after the initial `analysis-contract.json` and valid `in_progress` manifest are atomically placed in a newly created collision-free directory.
- Assets are appended only after successful analytical calls and indexed by a later manifest commit.
- Successful finalization writes/validates outputs, `evidence.json`, `summary.md`, and `evidence.md`, then commits the `succeeded` manifest last.
- A crash can leave unindexed temporary files, indexed partial assets, or `in_progress`. None authorizes success. Temporary files are ignored by contract readers and are not automatically repaired in this Change.
- Failed/cancelled terminalization retains already committed and indexed assets for diagnostics but has no successful Evidence reference or completed conclusion.
- Terminal trees are immutable to Xanthil. No deletion, cleanup, retention automation, or repair operation is added.

## TASK-006 CLI, Profile, and Example Contract

This section is the stable semantic contract for TASK-006. It deliberately separates structured interaction events from decorative terminal copy. `apps/cli/xanthil.mjs` exports exactly `runXanthil({input,output,application})`; no other export, CLI flag, command parser, source option, Profile option, Adapter, provider, model, root, tool, environment, or output-location option exists.

### Closed invocation and input

The outer argument is a plain object with exactly the own string keys `input`, `output`, and `application`; it has no other own string or symbol keys, no `null`, and no inherited configuration. `input` is a plain object with no own keys except `Symbol.asyncIterator`. Calling that method exactly once returns an async iterator with exactly one callable own/inherited public method, `next()`. Every `next()` returns a Promise resolving **directly** to one frozen, closed input Event; it never resolves to a JavaScript IteratorResult wrapper. Therefore `{value:event,done:false}`, any `value`/`done` field, a synchronous throw, a non-Promise return, a non-frozen/malformed Event, a second iterator request, a duplicate terminal interaction, or an event after CLI terminalization rejects exactly `{code:'CLI_INPUT_INVALID'}`. A rejected `next()` Promise rejects exactly `{code:'INPUT_READ_FAILED'}`. Events are consumed in order and are one-shot. The CLI never reads terminal signals, stdin, cwd, home, environment, or raw command strings.

The only input events are:

| Event | Exact fields | Legal state and effect |
|---|---|---|
| question | `{type:'question',question:'Do recent member operations show a problem?'}` | only first; calls `application.start({question,source})` once |
| confirm | `{type:'confirm'}` | only while awaiting confirmation; calls `handle.confirm(proposal)` once |
| reject | `{type:'reject'}` | only while awaiting confirmation; awaits `handle.cancel()` |
| edit | `{type:'edit'}` | only while awaiting confirmation; this fixed scenario awaits `handle.cancel()` and reports `edit_not_supported`; it does not revise or re-submit a proposal |
| eof | `{type:'eof'}` | before confirmation awaits `handle.cancel()`; after confirmation follows cancellation causality below |
| interrupt | `{type:'interrupt'}` | before confirmation awaits `handle.cancel()`; after confirmation follows cancellation causality below |

The first Event MUST be the approved `question`; pre-question `eof` or `interrupt` has no handle to cancel and rejects exactly `{code:'CLI_INPUT_INVALID'}` with zero `output.write`, `application.start`, or other Application effect. No event admits empty input, an arbitrary line, an alternate question, `resume`, `list`, `delete`, `repair`, `decision`, `recommend`, `action`, semantic-field text, a source, or any caller-selected infrastructure. EOF is represented only by `{type:'eof'}` and Ctrl-C only by `{type:'interrupt'}`. `application` is a plain object with exactly callable `start`; each returned handle is accepted only when it is a plain object exposing exactly callable `discover`, `confirm`, and `cancel`. CLI never freezes, mutates, or otherwise changes caller-owned `input`, `output`, or `application` objects, or any value returned by Application; it rejects unknown/missing/null/wrong-type surfaces before `start`.

### Output, completion, and failure

`output` is a plain object with exactly callable `write`. `write(event)` is synchronous, returns exactly `undefined`, and accepts only the frozen closed CLI-owned events below. CLI validates each complete incoming Application proposal/result, creates a referentially distinct deep clone for every exposed output event and resolved result, and recursively freezes that clone; every nested exposed value is closed and deeply frozen. The original Application value remains byte/deep-equal, unchanged, and unfrozen if supplied unfrozen. Decorative text is not part of this contract.

| Ordered event | Exact closed fields | Meaning |
|---|---|---|
| `ready` | `{type:'ready',scenario:'member-analysis-v1'}` | interaction is ready; it is not a success/readiness claim about runtime, source, or a run |
| `proposal` | `{type:'proposal',proposal}` | the complete frozen transient Application proposal, after `discover()` validates it |
| `awaiting_confirmation` | `{type:'awaiting_confirmation'}` | a proposal is visible and execution is blocked |
| `progress` | `{type:'progress',stage:'execution_started'}` | emitted once, immediately after explicit confirmation and before awaiting `confirm` completion; it makes no completion claim |
| `terminal` success | `{type:'terminal',status:'succeeded',run_id,oracle:{baseline_rate:'2/3',recent_rate:'1/9',delta_pp:'-500/9'},finding_id:'F-001',source_sha256,limitations:['tiny and synthetic','window-local','no causal or business-impact claim'],evidence_path:'evidence.json',summary_path:'summary.md'}` | only after `confirm` resolves with a closed `run.status:'succeeded'` manifest matching those values |
| `terminal` failure | `{type:'terminal',status:'failed',stage,code}` | sanitized preflight/interaction/Application failure; no raw cause, path, SDK/provider payload, row, credential, environment, transcript, or project-control content |
| `terminal` cancellation | `{type:'terminal',status:'cancelled',reason:'rejected'|'edit_not_supported'|'eof'|'interrupted'}` | no success claim; a post-confirmation terminal run is not rendered as success |

After the input `question`, output order is `ready -> proposal -> awaiting_confirmation ->` exactly one of cancellation, or `progress -> terminal`. A preflight failure after the input `question` is `ready -> terminal(failed)`; no proposal or progress is emitted. `proposal` is the only output that contains an Analysis Contract proposal. The success terminal exposes only the listed aggregate oracle, IDs, checksum, limitations, and relative Evidence/Summary references; it exposes no raw rows or implementation internals.

A `write` throw or any non-`undefined` return at `ready`, `proposal`, `awaiting_confirmation`, `progress`, or any terminal event rejects exactly `{code:'OUTPUT_WRITE_FAILED'}`. At that point CLI performs no further input read or Application call, emits no later event, and does not fabricate, alter, or compensate an Application run; a completed Application effect remains completed if its later terminal write fails. A missing/null/unknown/non-callable writer is pre-effect `{code:'CLI_OUTPUT_INVALID'}`. Attempted output after a terminal is the same `OUTPUT_WRITE_FAILED` rejection.

`runXanthil` resolves only to one of these frozen closed values: `{status:'succeeded',run,metrics,finding}` after the success terminal; `{status:'failed',failure:{stage,code}}` for a no-run failure; `{status:'failed',run}` for an Application failed terminal run; `{status:'cancelled',reason}` before a run; or `{status:'cancelled',run}` after Application cancellation has a terminal run. CLI accepts a proposal only after calling `createLocalAnalysisDomain().validateAnalysisProposal(proposal)`, and accepts a success, failed-run, or cancelled-run Application result only when its `run` is a complete Product-Core-valid closed terminal Run Manifest for the stated status. CLI imports and invokes the existing `createLocalAnalysisDomain()` validation operations directly; it adds no Application public surface and does not duplicate or relax Product Core validation. For success, `metrics`, `finding`, the one `SRC-001` source identity, `F-001`, its Evidence references, and its three limitations must additionally be exact canonical values validated by Product Core; partial/extra-field/wrong-version/wrong-status/wrong-run/wrong-source/wrong-artifact/wrong-evidence/wrong-terminal-detail values reject exactly `{code:'CLI_APPLICATION_INVALID'}`, emit no success terminal, and cause no further input/Application call.

The failure `stage` is exactly `preflight | contract_persist | runtime | source_read | analysis_sql | analysis_python | validation | artifact_finalize | execution`; its `code` is exactly one of the stable preflight or post-confirmation codes in the Specification. `source_sha256` in a success terminal is exactly `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`; `run_id` equals the returned succeeded manifest identity. Errors thrown or rejected by `start`, `discover`, or `confirm` map deterministically: the recognized preflight codes `FIXTURE_NOT_FOUND | FIXTURE_MISMATCH | SOURCE_BOUNDARY_VIOLATION | RUNTIME_UNAVAILABLE | MODEL_UNAVAILABLE | RUN_ROOT_UNSAFE | CONTRACT_VERSION_UNSUPPORTED` become `{stage:'preflight',code}`; `RUN_COLLISION` without a run becomes `{stage:'preflight',code:'RUN_COLLISION'}`; a recognized post-confirmation error with a stable stage/code pair remains that same pair; and any unknown, malformed, or raw cause becomes exactly `{stage:'execution',code:'INTERNAL_ERROR'}`. The mapped value is identical in the failure terminal and no-run resolved failure. Explicit cancellation remains governed only by the approved cancel/result arms, not raw error text. No raw message, cause, stack, path, credential, provider payload, transcript, or source row is exposed. CLI rejects only closed `{code:'CLI_INPUT_INVALID'|'CLI_OUTPUT_INVALID'|'CLI_APPLICATION_INVALID'|'INPUT_READ_FAILED'|'OUTPUT_WRITE_FAILED'}` boundary failures.

Before confirmation, `eof`, `interrupt`, `reject`, and `edit` call and await `handle.cancel()` exactly once; repeat terminal inputs cause no second cancel. Immediately after `progress`, CLI races the pending `confirm(proposal)` Promise against exactly one next input event. If confirmation settles first, CLI stops reading input and renders its mapped terminal result. If that next event is `eof` or `interrupt`, CLI calls and awaits `handle.cancel()` exactly once, consumes no further input, and waits for the Application terminal outcome where it is available. Any other post-confirmation input event is `CLI_INPUT_INVALID`. CLI performs no Artifact write, replacement manifest, cleanup, or retry; it discards a late success and emits only the cancellation terminal. Input/writer failure or process death must not invent a succeeded or failed run/manifest.

### Personal Profile and source connection

`profiles/personal/local-analysis.mjs` exports exactly `createPersonalLocalAnalysisProfile({workspaceRoot,runRoot,provider,modelId})`. Its argument is a closed plain object with exactly those four non-null fields. `workspaceRoot` is an absolute existing directory whose supplied path equals its physical `realpath`; `runRoot` meets the same rule, is not filesystem root, and is not equal to `workspaceRoot`. These exact checks define “safe” for this slice: neither field may be relative, nonexistent, non-directory, or traverse a symlink. R4 changes the guarded activation candidate to `provider` exactly `minimax-cn` and `modelId` exactly `MiniMax-M3`; missing, unknown, unsafe, or alternate values fail before any read, run/root creation, credential access, CLI/session realization, provider/network call, or cwd/home/environment fallback. Composition creates neither `runRoot` nor `.xanthil` directories.

The factory returns a frozen plain object with exactly `{application}`. `application` is constructed only from `createPiAgentAnalysisRuntime({provider:'minimax-cn',model_id:'MiniMax-M3'})`, `createDuckDbPythonLocalAnalysisExecution({workspaceRoot})`, `createLocalRunArtifactStore({runRoot})`, and the approved Application dependencies including its composition-owned clock. No injection or inspection export is added. Public behavior proves selection by the composed Application accepting the fixed scenario and by each concrete Adapter's unchanged contract suite; Profile tests must not inspect CLI/filesystem objects or add test-only production exports.

The single-scenario CLI, not Profile or Application configuration, owns the immutable source descriptor `{version:'member-orders-v1',kind:'csv',sha256:'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0',path:'member-orders-v1.csv'}` and passes it only to `application.start`. The composition caller connects the surfaces with `const {application}=createPersonalLocalAnalysisProfile(profileConfig); await runXanthil({input,output,application});`. `workspaceRoot` is the example directory; no absolute source path, cwd discovery, source override, alternate fixture, or extra product surface is introduced.

### Canonical example inventory and lifecycle

The entire activation inventory is exactly `examples/member-analysis/member-orders-v1.csv`; it has the literal CSV bytes in the Specification, exactly 530 bytes, and SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`. No README, instruction, hidden file, generated copy, second CSV, or activation metadata is required or permitted. Importing either public module and constructing a valid Profile creates no run, source-row read, Pi prompt/session realization, credential access, provider/network call, root/artifact, or output. Activation remains personal Profile plus this example only. Rollback disables that composition/entrypoint; retirement removes it from active composition after validation. Neither deletes nor rewrites the CSV or any existing Artifact.

Semantic editing is an explicit deferred product capability, not an Application revision in this package. If the Controller later approves it, the smallest revision is a new `revise(proposal,edit)` Application-handle operation with a closed edit schema, new-proposal identity/equality rules, no-run side-effect proof, and a separate Application Test Gate followed by a Worker gate limited to `packages/application/**` and any necessary `packages/ports/**`; TASK-006 must remain blocked from that new surface until it is GREEN.

## Activation, Rollback, and Retirement

Activation conditions:

1. Controller Spec Gate PASS on the complete package.
2. Accepted TASK-007 evidence for the frozen root `package.json`/`package-lock.json`, project-local npm install, and prerequisite versions; any later dependency change requires separate authority.
3. Test role derives executable tests and proves expected RED.
4. Worker implements only frozen paths without changing tests/specs.
5. GREEN unit, contract, integration, E2E, regression, typecheck, lint, build, architecture, security, and scope checks as applicable.
6. Real Pi-backed integration with the exact synthetic fixture and explicitly selected model; credentials ready but absent from evidence.
7. Independent Validator PASS or explicit authorized waiver.
8. Controller/user acceptance.

Activation is only the personal Profile composition for the approved example. There is no feature migration or ambient global enablement.

Rollback removes/disables the entrypoint and Pi Adapter composition. It does not alter the canonical source fixture, global Pi configuration, or any existing run. Readers fail closed on unsupported versions. RPC requires the Design addendum described above rather than automatic fallback.

Retirement disables the example after its validation. User-owned completed and incomplete run directories remain ordinary local files; Xanthil does not delete, migrate, backfill, repair, or rewrite them.

## Deferred and Forbidden Design Surface

- general arbitrary CSV analysis, extra fixture versions, formats, metrics, thresholds, or models;
- session resume, run listing/deletion/repair, retention, migration, backfill, dual-read, replay, or SQLite;
- generic SQL/Python/shell/filesystem tools;
- real or sensitive data, arbitrary model egress, Web Research, external databases, or connectors;
- Desktop, Console, server, enterprise Profile, multi-user identity, RBAC, tenant isolation, or sandbox claims;
- Ontology, Knowledge, Memory, RAG, Domain Pack, Model Pack, Trace Platform, Workflow, or multi-Agent behavior;
- `Decision`, `Action Recommendation`, `Automated Decision`, `Action`, or `Outcome` creation or execution.

Any new field, enum, default, status, directory, write entrypoint, source, tool, egress, dependency, or shared contract outside this design triggers a contract/structure addendum and stops dependent implementation.

## Historical TASK-010 Validator Remediation R2 Addendum — Superseded by R3

This retained R2 text is historical only and is superseded in full by
`spec-task-010-validator-remediation-r3.md`; it must not be used as a current
implementation or Test rule. R3 retains the product/schema scope but changes
deadline publication linearization and current runtime-readiness semantics.

Before `AgentAnalysisRuntime.openSession`, Application calls in exact order
`RunArtifactStore.preflightRunRoot()`,
`LocalAnalysisExecution.preflightApprovedFixture({source})`, then
`AgentAnalysisRuntime.preflightModel({model})`. Their closed results are,
respectively, `{ready:true}`;
`{source_id,kind,path,sha256,byte_size,fixture_version,read_at}`; and
`{provider,model_id}`. The fixture operation's one local exact-byte
identity/semantic read supplies `read_at`; Application copies it unchanged to
the complete initial manifest before `beginRun`. It is neither analytical
execution nor model egress and exports no bytes/handle. The post-confirmation
profile operation repeats physical validation before its analytical read, but
returns only the profile: it cannot overwrite persisted read provenance.

On confirmation acceptance, before `beginRun`, Application opens one attempt
epoch, creates one `AbortController`, and calls the composition-owned scheduler
once with frozen `{at_epoch_ms,callback}`. `at_epoch_ms` is a safe-integer Unix
epoch milliseconds deadline exactly 300000 ms after the confirmation clock;
`callback` is synchronous, zero argument, and returns `undefined`. Scheduler
returns frozen `{cancel}`; `cancel()` is no-argument, idempotent, returns
`undefined`, and Application calls it exactly once on each terminal path.
Expiry closes admission, aborts the one signal, requests Runtime cancellation
without awaiting a pending Promise, and selects logical `TIMEOUT`.

`beginRun`, `commitConfirmedContract`, `appendAsset`, and `commitSuccess`
receive that same signal and are admissible only while the epoch is open.
`replaceManifest` also receives that same signal and is admissible only before
deadline while un-aborted. For user cancellation Application closes normal work
admission and requests Runtime cancellation but does not initially abort the
deadline signal. If Runtime settles before deadline, it writes the one
cancelled manifest and cancels the scheduler; if not, deadline aborts the
signal, selects `TIMEOUT`, and starts no terminal write. After deadline
Application starts no Artifact call: a valid initial in-progress run remains an
abandoned candidate. Each Artifact operation has atomic abort semantics:
either it commits its full documented unit before abort wins, or commits
nothing; it never mutates after abort. Every Application continuation checks
its epoch both before a Port call and after await, so a late result cannot
write/publish. The Profile supplies an ordinary production timer; tests inject
a private virtual scheduler through the same closed dependency, not a product
mode.

`preflightModel` creates/caches exactly one R4 local-only `ModelRuntime` and
selected model pair using `create({allowModelNetwork:false,refreshOnCreate:false})`,
one `refresh({allowNetwork:false})`, then `getModel`; it creates no AgentSession
or network model call. `openSession` creates exactly one real AgentSession from
that cached pair, not another runtime/model. This supersedes the old
pre-prompt-zero-credential-read Test assertion; the replacement closed test
proves no network model call, ambient selection, session persistence, or
credential exposure. After that same session exists, Execution synchronously
uses `setActiveToolsByName`, reads `getActiveToolNames()`, and reads
`session.model` for provenance; observed values, never requests, are compared
to policy and mismatches fail closed. Pi objects/types/errors remain Adapter
private.

## Non-normative CLI Exploration Record

The explored Pi CLI/JSONL route is not a TASK-009 production direction because
it cannot bridge the approved in-process native callbacks. Its evidence is
retained only to explain diagnosis and has no effect on the embedded SDK
requirements, tests, activation, rollback, or Adapter implementation. The
normative R4 contract is exclusively `spec-task-009-cli-runtime-r4.md`.

## Current TASK-010 R3 Publication Design

`spec-task-010-validator-remediation-r3.md` is the sole current TASK-010
remediation rule. The preflight order and cached-runtime/single-session rule
are defined there. For Artifact safety, `beginRun` uses hidden staging and
atomically makes the full directory/initial `run.json` visible or makes no run
visible. Contract, asset, and replacement writes each linearize at their own
final atomic publication. In `commitSuccess`, Evidence and Markdown are
unindexed candidate files; only final succeeded `run.json` publication makes
them success-visible. Deadline stops future units, never terminalizes, and may
leave unindexed candidates in an abandoned in-progress run. They are neither a
new durable contract nor readable success output.
