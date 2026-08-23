# Xanthil CLI Local Analysis Specification

## Capability Contract

- Source Changes: `CHG-xanthil-cli-local-analysis-slice`; `CHG-xanthil-typescript-migration`; `CHG-run-root-identity-reuse-fix`; `CHG-runtime-provenance-neutralization`
- Capability: `local-analysis`
- Accountable user: Data Analyst
- Delivery path: `greenfield_fast_path`
- Contract version: `1.0`
- Product result: evidence-backed analytical Findings only; this Change does not create a `Decision`, `Action Recommendation`, `Automated Decision`, `Action`, or `Outcome`.

The normative words SHALL, SHALL NOT, MUST, and MUST NOT define the accepted current behavior. The fixture, formulae, and reference values below are deterministic test semantics for this synthetic example, not claims about a real business operation.

## Exact Current Run Provenance Contract

Every new Run Manifest has `schema_version: "2.0"` and these exact closed provenance values in the approved Personal composition:

```json
{
  "product": { "id": "xanthil", "version": "1.0.0" },
  "runtime": { "id": "pi", "version": "0.84.2" },
  "adapter": { "id": "agent-pi", "version": "1.0.0" },
  "profile": { "id": "personal" },
  "model": { "provider": "minimax-cn", "model_id": "MiniMax-M3" }
}
```

`product`, `runtime`, and `adapter` each contain exactly `id` and `version`; `profile` contains exactly `id`; `model` contains exactly `provider` and `model_id`. IDs/providers/model IDs are non-empty stable identifiers and versions are semantic versions. There is no `profile.version`, no model duplication under `runtime`, and no Pi-named key in schema `2.0`.

## Frozen Acceptance Scenario

The approved entry question is:

> Do recent member operations show a problem?

For the first acceptance scenario, Discovery SHALL turn that question into this confirmable analysis:

- question: `Between 2026-08-08 and 2026-08-14, did the window-local repurchase-member rate decline versus 2026-08-01 through 2026-08-07?`
- objective: compare the recent and baseline window-local repurchase-member rates using only fixture version `member-orders-v1`;
- baseline window: inclusive dates `2026-08-01` through `2026-08-07`;
- recent window: inclusive dates `2026-08-08` through `2026-08-14`;
- analytical grain: one row per distinct synthetic order;
- population: members with at least one distinct order inside the applicable window;
- primary metric: window-local repurchase-member rate, equal to members with at least two distinct orders in the window divided by active members in that same window;
- comparison: recent repurchase-member rate minus baseline repurchase-member rate in percentage points;
- supported-signal rule: the Finding that the repurchase-member rate declined is `supported` exactly when the recent rate is less than the baseline rate; no materiality or statistical-significance threshold applies;
- output: one Finding with supporting Evidence, limitations, Summary, and reproducible assets.

The Data Analyst MUST explicitly confirm this Analysis Contract before execution. This fixed first scenario does not support in-session semantic editing: an `edit` interaction cancels the pending proposal without execution or a replacement proposal. A later semantic-edit loop requires a separately approved Application revision because the current public handle exposes only `discover()`, `confirm(proposal)`, and `cancel()`. Silence, model inference, an empty interaction, or continuing the conversation is not confirmation.

## Canonical Synthetic Fixture

The fixture contract is `member-orders-v1.csv`, UTF-8 without BOM, comma-delimited, LF line endings, with one trailing LF and the exact bytes below. Its SHA-256 is `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`.

```csv
order_id,member_id,ordered_on
ORD-001,M-001,2026-08-01
ORD-002,M-001,2026-08-02
ORD-003,M-002,2026-08-01
ORD-004,M-002,2026-08-03
ORD-005,M-003,2026-08-02
ORD-006,M-003,2026-08-04
ORD-007,M-004,2026-08-03
ORD-008,M-004,2026-08-05
ORD-009,M-005,2026-08-06
ORD-010,M-006,2026-08-07
ORD-011,M-001,2026-08-08
ORD-012,M-002,2026-08-08
ORD-013,M-003,2026-08-09
ORD-014,M-004,2026-08-10
ORD-015,M-005,2026-08-11
ORD-016,M-006,2026-08-12
ORD-017,M-007,2026-08-13
ORD-018,M-008,2026-08-14
ORD-019,M-009,2026-08-13
ORD-020,M-009,2026-08-14
```

Closed fixture semantics:

| Column | Rule |
|---|---|
| `order_id` | non-empty, unique, pattern `ORD-[0-9]{3}`; order identity |
| `member_id` | non-empty, pattern `M-[0-9]{3}`; descriptive synthetic member reference only |
| `ordered_on` | strict ISO calendar date `YYYY-MM-DD`; authoritative business date for window membership |

The canonical fixture has exactly 20 data rows, three columns in the stated order, and no missing values, duplicate `order_id`, extra column, extra row, or invalid date. File mtime is not data time. Any byte or semantic mismatch fails preflight; the product MUST NOT silently clean or reinterpret the fixture.

## Metric and Reference Oracle

For a window `w`:

- `member_order_count(member, w) = count(distinct order_id)` for that member among valid rows whose `ordered_on` is inside the inclusive window;
- `active_member_count(w) = count(distinct member_id where member_order_count(member, w) >= 1)`;
- `repeat_purchaser_count(w) = count(distinct member_id where member_order_count(member, w) >= 2)`;
- `repurchase_member_rate(w) = repeat_purchaser_count(w) / active_member_count(w)`;
- `repurchase_member_rate_delta_pp = (repurchase_member_rate(recent) - repurchase_member_rate(baseline)) * 100`.

Division is valid only when `active_member_count(w) > 0`. Membership is window-local: orders in the other window do not contribute to a member's count in `w`. Exact integer counts are compared exactly. Rates are calculated as exact rational values without intermediate rounding and displayed to one decimal percentage point. The reference oracle is:

| Value | Exact result | Display |
|---|---:|---:|
| baseline order count | 10 | `10` |
| baseline active-member count | 6 | `6` |
| baseline repeat-purchaser count | 4 | `4` |
| baseline repurchase-member rate | exact `4/6 = 2/3` | `66.7%` |
| recent order count | 10 | `10` |
| recent active-member count | 9 | `9` |
| recent repeat-purchaser count | 1 | `1` |
| recent repurchase-member rate | exact `1/9` | `11.1%` |
| recent-minus-baseline delta | exact `-5/9 * 100` percentage points | `-55.6 pp` |
| supported-signal comparison | `1/9 < 4/6` | met |
| reference Finding status | `supported` | `supported` |

The Finding SHALL state only that the window-local repurchase-member rate declined in this synthetic fixture. Its limitations MUST explicitly state that the sample is tiny and synthetic, the metric is window-local, and the analysis provides no causal or business-impact claim. It SHALL NOT infer cause, member harm, statistical significance, business impact, a course of action, or behavior outside the two windows.

## Requirements

### REQ-XCLI-001 — Eligible CLI Entry and Closed Preflight

The personal Profile SHALL expose one interactive `xanthil` Analyst Assistant entrypoint for the approved repository workspace and SHALL validate fixture identity, explicit model selection, closed Runtime readiness/provenance, run-root safety, and contract-version support before presenting a confirmable Analysis Contract.

- **AC-XCLI-001-01:** Given the approved workspace, exact fixture, writable safe run root, supported contracts, approved Node runtime, explicit `minimax-cn/MiniMax-M3`, and Pi Adapter readiness reporting runtime `pi/0.84.2`, Adapter `agent-pi/1.0.0`, and observed model `minimax-cn/MiniMax-M3`, starting `xanthil` reaches Discovery without creating `.xanthil/runs/<run_id>/`. Activation of the model default remains subject to the existing R4 real acceptance gate.
- **AC-XCLI-001-02:** Before Session opening, Discovery, Proposal, model call, or run creation, preflight validates the unchanged run-root/fixture/contract boundaries and one deeply frozen closed Runtime readiness result. Missing, malformed, extra, unavailable, version-mismatched, or requested-model-mismatched readiness reports the existing stable preflight reason, makes no model/provider call, creates no run, and performs no source or global-configuration write.

### REQ-XCLI-002 — Discovery and Explicit Analysis Gate

Within one Pi-backed in-memory session, Discovery SHALL narrow the approved vague question into the frozen Analysis Contract without running analytical tools or reading fixture row content, and Application SHALL require explicit user confirmation before execution.

- **AC-XCLI-002-01:** For the approved entry question, Discovery presents every frozen question, objective, source, window, grain, population, metric, comparison rule, output, and constraint field with no missing or model-invented default.
- **AC-XCLI-002-02:** Before explicit confirmation, no run directory,
  analytical source-row read, SQL, Python, execution tool, Evidence, or
  completed result exists; only approved fixture metadata may be supplied to
  the model. The local preflight identity/semantic read required by
  AC-XCLI-001-02 has no analytical result and never egresses rows or bytes.
- **AC-XCLI-002-03:** An explicit confirmation produces one immutable `analysis-contract.json` snapshot for one execution attempt. Rejection, EOF, interrupt, or the unsupported semantic-edit interaction cancels the pending proposal, calls the current handle's idempotent `cancel()`, creates no replacement proposal or run, and cannot execute the earlier proposal.
- **AC-XCLI-002-04:** EOF or user cancellation before confirmation exits without a run or success claim.

### REQ-XCLI-003 — Run Identity and Attempt Grain

After confirmation, Application SHALL create exactly one run for one confirmed Analysis Contract execution attempt, identified by a UUIDv7 `run_id` and stored only at `.xanthil/runs/<run_id>/`.

- **AC-XCLI-003-01:** The generated UUIDv7 equals the directory name and the `run_id` in all core JSON records; user text and display titles do not participate in identity or path construction.
- **AC-XCLI-003-02:** An existing target directory or identity collision fails closed without reading, merging, truncating, or overwriting the existing directory.
- **AC-XCLI-003-03:** A user retry after any terminal result creates a new `run_id`; no product-level automatic retry or in-place retry occurs.

### REQ-XCLI-004 — Approved Source Boundary

The analysis SHALL read only the exact repository-owned fixture through its approved source descriptor and SHALL preserve its snapshot identity without copying source rows into run Artifacts.

- **AC-XCLI-004-01:** The source descriptor records Application-assigned
  `source_id`, `kind=csv`, normalized workspace-relative path, exact SHA-256,
  byte count, the Source Adapter-observed RFC3339 instant of the actual
  pre-Discovery approved-source identity/semantic byte read, and
  `fixture_version=member-orders-v1`. It records no absolute path, file mtime,
  confirmation time, model time, or later analytical recheck time as business
  read time.
- **AC-XCLI-004-02:** Path traversal, absolute paths, workspace-external
  resolution, symlink escape, unapproved files, extra sources, post-preflight
  source mutation, malformed CSV, or fixture checksum mismatch terminates fail
  closed before a supported Finding. The Source Adapter repeats physical
  identity validation immediately before the analytical read; mutation maps
  `SOURCE_CHANGED` and produces no supported Finding. The source descriptor
  was already validly persisted from the preflight observation in the required
  initial manifest and is not rewritten.
- **AC-XCLI-004-03:** No source-row copy, credential, environment value, Pi transcript, unrelated workspace content, project-control record, or real/user/enterprise data is written to the run.

### REQ-XCLI-005 — Deterministic Metric Calculation and Validation

Controlled analytical execution SHALL compute the frozen metric set with a canonical read-only SQL asset and independently validate the results with a canonical deterministic Python asset before any supported Finding is finalized.

- **AC-XCLI-005-01:** On the canonical fixture, SQL and Python results independently equal every exact reference count, rate, delta, and `supported` status in the reference oracle.
- **AC-XCLI-005-02:** A disagreement between SQL, Python, the source checksum, or the reference oracle terminates with `VALIDATION_FAILED` and cannot emit successful Evidence or Summary.
- **AC-XCLI-005-03:** Zero active-member denominators, missing values, duplicate order IDs, invalid dates, or rows outside the contract's approved schema cannot be silently ignored; they fail validation or yield `inconclusive` only where an explicitly approved non-canonical test contract calls for that outcome.
- **AC-XCLI-005-04:** Counts are exact, calculations use no intermediate rounding, and human display follows the frozen one-decimal formatting rule.

### REQ-XCLI-006 — Least-Capability Analytical Tools

During Execution, the model SHALL receive only dedicated tools for approved-source profiling, frozen metric calculation, and independent metric validation. No generic shell, filesystem, edit, write, arbitrary SQL, arbitrary Python, network, Web Research, package, extension, or action tool SHALL be exposed.

- **AC-XCLI-006-01:** The Pi session starts with built-in tools disabled and exposes only the three approved analytical capabilities with Application-validated inputs and bounded outputs.
- **AC-XCLI-006-02:** A request for a forbidden or unknown tool is rejected as `TOOL_POLICY_VIOLATION`, stops further model/tool work, and produces no successful Finding.
- **AC-XCLI-006-03:** The model cannot select a path, source, query text, script text, output path, provider endpoint, process command, environment variable, or package; Application supplies the approved values and allocates all asset IDs.

### REQ-XCLI-007 — Replaceable Agent Runtime Boundary and Readiness Provenance

Application SHALL access Pi through the existing business-oriented Agent Analysis Runtime Port whose contract covers explicit model selection, closed runtime/Adapter/model readiness, one in-memory Discovery/Execution session, approved tool invocation, streamed user-visible events, timeout, cancellation, and sanitized failure mapping without exposing Pi SDK, CLI, process, or session-persistence types.

- **AC-XCLI-007-01:** The project-local Pi SDK Adapter and an in-memory contract double pass the same Agent Analysis Runtime contract suite with exactly the existing methods `preflightModel` and `openSession`; the suite includes the closed readiness response plus every previously accepted Discovery, confirmation, Execution, forbidden-tool, event-ordering, timeout, cancellation, and failure-mapping behavior.
- **AC-XCLI-007-02:** Discovery and post-confirmation Execution use the same in-memory Pi-backed session; Pi history is neither authoritative Evidence nor required to reproduce calculations.
- **AC-XCLI-007-03:** `preflightModel` returns exactly deeply frozen `{runtime:{id,version},adapter:{id,version},model:{provider,model_id}}`; Application persists the preflight-observed model only after it equals the requested model, and after SDK operations settle it requires execution-observed `session.model` equality with that preflight observation. Any structural or equality mismatch fails closed with the existing sanitized product error and cannot produce success.
- **AC-XCLI-007-04:** The Pi Adapter uses only the project-local Pi SDK `0.84.2`, reads runtime version from that loaded SDK namespace's exact `VERSION` export, self-declares runtime ID `pi` and Adapter `agent-pi/1.0.0`, and retains every existing local-only refresh, explicit model, inert-resource, disabled-tool/extension, in-memory persistence, and no-retry rule. A missing, malformed, or non-`0.84.2` SDK `VERSION` fails as `RUNTIME_UNAVAILABLE` before Session/provider work.
- **AC-XCLI-007-05:** Before Port return, the Adapter accepts only a complete JSON object or exactly one leading complete `<think>...</think>` prefix followed by one complete JSON object, and detects duplicate object members at every nesting level while parsing; every other wrapper, malformed/multiple/non-object JSON, duplicate member, empty/non-stop result, stream defect, timeout, cancellation, or lifecycle error fails closed without raw diagnostic leakage.
- **AC-XCLI-007-06:** Discovery has no tool event; Execution admits exactly the three native Application callbacks once and in order with exact `{}` arguments. Application/Product Core own object-order-insensitive business semantic validation and canonical serialization; Adapter does not alter business values or manufacture output.

### REQ-XCLI-008 — Replaceable Analytical Execution Boundary

Application SHALL access source profiling, SQL calculation, and Python validation through a Local Analysis Execution Port with source identity, bounded execution, cancellation, provenance, and sanitized failure semantics independent of DuckDB, Python process, filesystem, and subprocess types.

- **AC-XCLI-008-01:** The DuckDB/Python Adapter and a deterministic contract double pass the same Local Analysis Execution contract suite for approved input, canonical assets, exact outputs, limits, cancellation, source mutation, malformed input, and failure mapping.
- **AC-XCLI-008-02:** SQL is read-only and bound to the approved fixture; no extension installation/loading, attach, copy, export, arbitrary file function, database mutation, or external connection is possible.
- **AC-XCLI-008-03:** Python executes only the repository-owned canonical validator selected by Application; model-supplied code, imports beyond its approved standard-library set, filesystem discovery, environment access, subprocess creation, and network use are not capabilities of the Port.

### REQ-XCLI-009 — Closed Run Manifest `2.0` and Independent Artifact Contracts

Application SHALL be the single semantic writer of a closed Run Manifest schema `2.0` containing `run.json`, while `analysis-contract.json` and `evidence.json` retain their independent exact schema `1.0` contracts; all current core files, Markdown, and numbered append-only assets remain governed by the accepted Artifact lifecycle.

- **AC-XCLI-009-01:** Every new `run.json` uses schema `2.0` and the exact closed top-level provenance nodes in this specification; the same run's `analysis-contract.json` and conditional `evidence.json` continue to use schema `1.0`, and their closed field sets plus the successful file/asset inventory remain unchanged.
- **AC-XCLI-009-02:** Core files are committed by same-directory temporary file plus atomic rename; assets receive new `Q-`, `S-`, or `O-` IDs and are never updated in place.
- **AC-XCLI-009-03:** Application writes product `xanthil/1.0.0` from Application-owned constants, runtime/Adapter/model from the closed preflight observation, and profile `personal` from Profile composition; Storage and CLI only validate, persist, return, or transport those values and never invent or normalize them.
- **AC-XCLI-009-04:** On terminal transition, all retained files become immutable to Xanthil; later display and verification are read-only.

### REQ-XCLI-010 — Status-Discriminated Lifecycle

The Run Manifest SHALL use only `in_progress`, `succeeded`, `failed`, or `cancelled`, allow only the three transitions from `in_progress` to one terminal state, and prevent incomplete work from appearing successful.

- **AC-XCLI-010-01:** `in_progress` has `started_at` and no `ended_at`, Evidence reference, or terminal detail; `succeeded` has `ended_at` and a verified Evidence reference but no terminal detail.
- **AC-XCLI-010-02:** `failed` has `ended_at`, failed stage, stable error code, and optional sanitized message but no Evidence reference; `cancelled` has `ended_at` and cancellation stage but no Evidence reference or completed conclusion.
- **AC-XCLI-010-03:** Terminal-to-any-state and terminal-file mutation attempts fail closed; process death before a terminal commit may leave `in_progress`, which later inspection may label only as an `abandoned candidate`, never as failed or succeeded.

### REQ-XCLI-011 — Evidence-Backed Findings

A successful run SHALL contain a closed Evidence Index in which every material Finding is `supported`, `contradicted`, or `inconclusive` and traces through Evidence Items to approved sources and reproducible numbered assets.

- **AC-XCLI-011-01:** The reference run contains Finding `F-001` with status `supported`, the bounded window-local repurchase-rate decline statement, the three required limitations, and references only to declared Evidence IDs.
- **AC-XCLI-011-02:** Every Evidence Item has a unique `E-` ID, description, at least one approved source ID, and at least one indexed calculation or output asset; every referenced ID resolves within the same run and checksum verification passes.
- **AC-XCLI-011-03:** Unsupported material claims, missing/foreign/dangling references, checksum mismatch, a Finding without limitations, or Evidence that does not reproduce the claim blocks success.

### REQ-XCLI-012 — Human Summary and Evidence Views

For a successful run, Application SHALL produce human-readable `summary.md` and `evidence.md` from, or validate them against, the confirmed Analysis Contract and Evidence Index; neither Markdown file is an independent source of authority.

- **AC-XCLI-012-01:** `summary.md` states the confirmed question, `supported` result, exact reference metrics, bounded interpretation, and limitations, and does not include unsupported causal, prescriptive, real-world, or business-action language.
- **AC-XCLI-012-02:** `evidence.md` resolves `F-001` through its Evidence Items to source identity, time windows, SQL, Python validation, outputs, and checksums; product/runtime/Adapter/Profile/model provenance resolves from the same-run `run.json` rather than being duplicated into `evidence.json` or Markdown.
- **AC-XCLI-012-03:** Any inconsistency between Markdown and the machine-readable contracts causes finalization to fail; failed, cancelled, or in-progress runs cannot expose completed Summary/Evidence as a success response.

### REQ-XCLI-013 — Failure, Timeout, and Cancellation

Execution SHALL fail closed on runtime, model, source, tool, analysis, validation, or Artifact failure; SHALL accept user cancellation; and SHALL bound individual analytical calls to 30 seconds and the post-confirmation execution attempt to 300 seconds. These are personal-Profile v0.1 technical budgets, not business thresholds.

- **AC-XCLI-013-01:** Each mapped failure terminates once with its stable stage/code, stops new model/tool work, preserves only already committed numbered diagnostic assets, and returns no success claim.
- **AC-XCLI-013-02:** Ctrl-C after run creation immediately closes future
  normal-work admission and requests Runtime cancellation without initially
  aborting the shared attempt signal. An already-admitted `beginRun`, confirmed
  contract commit, or asset append may settle before the unchanged absolute
  deadline, but no next normal unit starts; if a run is visible, Application
  then writes exactly one `cancelled` terminal and `confirm()`/`cancel()`
  converge to it. An already-admitted `commitSuccess` is not raced by a
  cancelled replacement: if its final succeeded `run.json` linearizes before
  the deadline, both calls converge to `succeeded`; if it settles without
  success, Application writes exactly one `cancelled` terminal and both calls
  converge to it. Cancellation before run creation follows AC-XCLI-002-04.
- **AC-XCLI-013-03:** An analytical-call timeout at 30 seconds maps to
  `TIMEOUT` at its analytical stage. Immediately before `beginRun`, a scheduler
  is armed for the 300-second confirmation-relative attempt deadline. It
  actively closes Application admission and aborts the shared attempt signal;
  Runtime, tool, Analysis, and admitted Artifact operations receive that
  signal. Application does not await a permanently pending operation: it
  discards every late completion, including a late `commitSuccess` result,
  attempts no terminal persistence after deadline, and makes `confirm()` and
  `cancel()` converge once to logical `TIMEOUT` at `execution`.
- **AC-XCLI-013-04:** There is no automatic product retry. An already-aborted
  signal admits no Artifact write and deadline starts no next publication unit.
  `beginRun` linearizes as complete directory plus initial `run.json` or no
  visible run; individual contract/asset/replacement files linearize at final
  atomic publication; `commitSuccess` linearizes success only at final
  succeeded `run.json`. Prior fully published Evidence/Markdown candidates may
  remain unindexed if deadline wins, but no reader/CLI exposes them as success.
  Xanthil makes no compensating success claim, background repair/write, or
  next-startup edit.

### REQ-XCLI-014 — Data Egress and Secret Boundary

Only the selected model provider MAY receive the confirmed contract, synthetic fixture metadata, and bounded aggregate tool results needed for this Change. Raw fixture rows SHALL remain behind analytical tools even though the synthetic fixture is approved for model egress.

- **AC-XCLI-014-01:** Runtime evidence shows that no network-capable tool is exposed and the only intended external connection is the explicit Pi-mediated call to `minimax-cn/MiniMax-M3` through the project-local embedded Pi SDK with inert resource discovery.
- **AC-XCLI-014-02:** Credentials, secrets, environment values, raw provider/SDK/assistant text, unrelated files, real/user/enterprise data, global Pi settings, and project-control records do not enter prompts, tool outputs, logs, traces, fixtures, or run Artifacts.
- **AC-XCLI-014-03:** Any attempted forbidden data access or egress is rejected before transmission, terminates fail closed, and is covered by negative evidence; local Pi execution is never described as a security sandbox.

### REQ-XCLI-015 — Complete Neutral Provenance Without Credential Capture

Every successful run SHALL record the source snapshot, confirmed semantics, transformations, validation, product, runtime, Adapter, Profile, provider/model, lifecycle time, run identity, and Artifact checksums needed to reproduce each material calculation without persisting credentials, relying on Pi memory, or naming Pi in a schema key.

- **AC-XCLI-015-01:** `run.json` schema `2.0`, `analysis-contract.json` schema `1.0`, and `evidence.json` schema `1.0` jointly resolve each Finding to exact fixture bytes, the Adapter-observed source read time, inclusive business-date windows, canonical SQL and Python assets, outputs, Application-owned Xanthil `1.0.0`, Profile-owned `personal`, Pi Adapter-declared `agent-pi/1.0.0`, loaded-SDK-observed runtime `pi/0.84.2`, preflight-observed explicit `minimax-cn/MiniMax-M3`, and the same `run_id`.
- **AC-XCLI-015-02:** Recalculation from the recorded fixture identity and assets reproduces the reference oracle independently of narrative text, Pi transcript, filesystem mtime, ambient model default, or a live model call.

### REQ-XCLI-016 — Activation, Bounded Compatibility, Rollback, and Retirement

Run Manifest `2.0` SHALL activate only in the Personal local Profile after all gates pass; all new writes and mutations SHALL be current-`2.0` only; terminal read SHALL support only exact terminal `1.0` and exact terminal `2.0`; rollback and retirement SHALL preserve all user-owned Artifacts.

- **AC-XCLI-016-01:** Before activation, executable tests prove expected RED then GREEN at unit, Port contract, integration, and E2E levels, required regression/quality checks pass, and independent verification passes or an authorized waiver is recorded.
- **AC-XCLI-016-02:** `readTerminalRun({run_id})` accepts exact `succeeded`, `failed`, and `cancelled` Run Manifests for schema `1.0` and `2.0`; it returns the exact parsed legacy `1.0` structure with legacy keys intact, verifies indexed assets, and leaves the complete directory tree and `run.json` bytes unchanged. Legacy `1.0 in_progress`, unknown versions, and malformed records fail closed without normalization, backfill, rewrite, repair, or read-as-terminal behavior.
- **AC-XCLI-016-03:** `beginRun`, `commitConfirmedContract`, `appendAsset`, `replaceManifest`, and `commitSuccess` admit only a current schema `2.0` run and leave legacy/unknown bytes untouched on rejection. Rollback disables new activation and preserves every artifact; the previous implementation is not promised to read schema `2.0`, and no retained reader or migration machinery is added.
- **AC-XCLI-016-04:** Session resume, run list/delete/repair, retention automation, real data, additional formats, Web Research, Workflows, Desktop, enterprise behavior, SQLite, Trace Platform, Ontology, Knowledge, Memory, Domain Packs, Model Packs, Decisions, recommendations, or Actions remain unavailable. A separately approved `run-evidence-console` capability MAY provide a read-only consumer of existing immutable local-analysis Artifact `1.0` Runs; it does not alter any local-analysis producer behavior, Artifact format, current Port, Runtime, Profile, or CLI contract.

### REQ-RRIF-001 — Physical Run Root Continuity

For the lifetime of each `createLocalRunArtifactStore({runRoot})` result, each `preflightRunRoot()` has one physical-root identity linearization point: acquisition of a private identity-only descriptor for the configured path. The preflight result concerns the directory object acquired at that point; it makes no assertion about a later pathname replacement. Complete decision and evidence history is preserved at `openspec/changes/archive/2026-08-22-run-root-identity-reuse-fix/`.

- **AC-RRIF-001-01:** If that acquisition obtains the same directory object accepted at Store construction, zero-argument `preflightRunRoot()` returns the existing frozen `{ready:true}` result, including when the root grants owner write/search but not read permission (mode `0300`) on the approved macOS and Ubuntu personal runtimes.
- **AC-RRIF-001-02:** If the configured path is missing, symlinked, non-directory, or resolves at acquisition to a directory object other than the Store's construction object—including removal/replacement before acquisition and immediate same-path recreation with device/inode reuse—`preflightRunRoot()` rejects exactly `RUN_ROOT_UNSAFE` before session, Discovery, model, run, or Artifact effects; it creates no run and writes no Artifact.
- **AC-RRIF-001-03:** A replacement that occurs only after successful live-path descriptor acquisition does not retroactively alter that preflight result. The Run Artifact Store Port/public Store surface, Artifact data/lifecycle, and persisted run data remain unchanged; this Requirement adds no public lifecycle operation or persistent root-identity record.

## Stable Failure Vocabulary

Preflight failures create no run and use one of: `FIXTURE_NOT_FOUND`, `FIXTURE_MISMATCH`, `SOURCE_BOUNDARY_VIOLATION`, `RUNTIME_UNAVAILABLE`, `MODEL_UNAVAILABLE`, `RUN_ROOT_UNSAFE`, or `CONTRACT_VERSION_UNSUPPORTED`. A post-confirmation run-allocation collision also creates no new run and uses `RUN_COLLISION`.

Post-confirmation failed runs use the stage set `contract_persist | runtime | source_read | analysis_sql | analysis_python | validation | artifact_finalize | execution` and the closed error-code set `ARTIFACT_WRITE_FAILED | SOURCE_CHANGED | SOURCE_BOUNDARY_VIOLATION | SOURCE_INVALID | MODEL_EXECUTION_FAILED | TOOL_POLICY_VIOLATION | ANALYSIS_EXECUTION_FAILED | VALIDATION_FAILED | TIMEOUT | CONTRACT_VERSION_UNSUPPORTED | INTERNAL_ERROR`. Cancellation uses the stage active when cancellation was accepted. Free-text diagnostic messages are optional, sanitized, non-authoritative, and not stable API.

## Compatibility Boundaries

- No generic dual-read dispatcher, version registry, migration marker, normalization layer, or background scan is authorized.
- Legacy read support is limited to explicit `readTerminalRun({run_id})`; no CLI list/inspect/resume/repair feature is added.
- Existing failure codes/stages and their boundary mappings remain unchanged.
- Exact legacy `1.0` validation preserves the currently accepted legacy model rule; new `2.0` writes use only the exact two-field model object above.

## Explicit Non-Requirements

- No general-purpose chat, coding-agent, SQL console, Python console, or file-analysis promise.
- No real-data correctness, privacy, isolation, retention, or enterprise claim.
- No causal inference, forecasting, member-level judgment, operational recommendation, or action execution.
- No dependency installation, manifest change, schema file, executable test, production implementation, model call, or global Pi mutation is authorized by this document before the applicable gate.
- No second Runtime, Runtime registry/discovery/fallback/hot switching, universal Runtime Port, new Port method, or vendor-name branch in Application.
- No Profile configuration field, `profile.version`, package/lock/dependency change, SDK/package manifest lookup, or model/provider change.
- No data, fixture, DuckDB/Python, Evidence schema, Analysis Contract schema, Markdown content, enterprise, migration, repair, retention, recovery, or action behavior.
- No user run-directory inspection and no real model/provider call.

## Native TypeScript Delivery Requirements

The requirements below were accepted by `CHG-xanthil-typescript-migration`. They change the implementation language and offline verification contract without changing any Xanthil business, data, security, runtime, failure, persistence, or user-visible behavior above. Complete decision and evidence history is preserved at `openspec/changes/archive/2026-08-22-xanthil-typescript-migration/`.

### REQ-XTS-001 — Closed Native TypeScript Graph

The complete accepted Xanthil production and test graph SHALL remain one-for-one native `.ts` without a compatibility period or runtime namespace change.

- **AC-XTS-001-01:** The graph preserves exactly the original eight production and 13 test/helper `.ts` paths enumerated in the accepted baseline, and adds only these 14 Run & Evidence Console `.ts` paths: `apps/console/xanthil-console.ts`; `packages/application/run-evidence-query.ts`; `packages/product-core/run-evidence.ts`; `packages/ports/run-evidence-reader.ts`; `adapters/storage-local/run-evidence-reader.ts`; `profiles/personal/console.ts`; `tests/unit/run-evidence-console/run-evidence.unit.test.ts`; `tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts`; `tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts`; `tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts`; `tests/fixtures/run-evidence-console/run-evidence-fixtures.ts`; `tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts`; `tests/fixtures/run-evidence-console/console-harness.ts`; and `tests/fixtures/run-evidence-console/coverage-map.ts`. The original local-analysis former `.mjs` paths remain absent; no new Console `.mjs` owner or other Xanthil `.mjs` owner exists; and the CSV and separate runner self-test `.mjs` are not renamed.
- **AC-XTS-001-02:** Every relative import/URL in the closed Xanthil graph resolves to its final explicit `.ts` target, and canonical Node executes each of the four `.test.ts` layers without a loader, compiler, or emitted JavaScript.
- **AC-XTS-001-03:** Runtime module namespaces contain exactly the accepted exports named in the archived `proposal.md`; the three Port method sets and dependency direction remain unchanged. Existing Product Core, Port, and Application seams own their shared type-only interfaces. Adapter, Profile, and CLI types remain module-local unless an existing production or test type import has a current consumer for an export. No new module/package/file exists solely for types, and type-only exports add no runtime namespace export.
- **AC-XTS-001-04:** No `allowJs`, `checkJs`, `.mjs` wrapper, dual source owner, loader, `tsx`, bundler, alternate runtime, JavaScript/declaration/source-map emit, `dist`, `build`, or generated migration artifact exists.

### REQ-XTS-002 — Exact Strict No-Emit Toolchain

The root SHALL use one exact, reproducible TypeScript toolchain for strict static checking while Node remains the direct runtime.

- **AC-XTS-002-01:** `package.json` remains private ESM with npm `11.12.1`, Node `>=22.19.0`, Pi `0.84.2`, and TypeBox `1.3.7`; its only scripts are `typecheck = tsc -p tsconfig.json --noEmit` and `test = tools/harness/validation/run`, and its exact dev dependencies are TypeScript `5.9.3` and `@types/node` `22.19.19`. It has no `exports`, `bin`, `start`, `build`, or publication contract.
- **AC-XTS-002-02:** The npm v3 lock root mirrors the exact runtime and dev dependencies, and the locked/installed direct package versions equal the manifest; no runtime dependency or package-manager version changes.
- **AC-XTS-002-03:** The one root `tsconfig.json` preserves exactly its accepted strict options and original explicit 21 `files` entries, then appends only the 14 Console paths named in this Change's modified AC-XTS-001-01. It has no glob or `include`, bridge, skip-lib, emit, lint-like, extend, reference, or alternate-project option.
- **AC-XTS-002-04:** Native syntax checks and `npm run typecheck` exit zero in the canonical environment and create no persistent output or generated artifact.

### REQ-XTS-003 — Accepted Behavior and Boundary Parity

Static migration SHALL preserve the entire accepted `local-analysis` behavior, runtime validation authority, architecture, and executable identity matrix.

- **AC-XTS-003-01:** The exact accepted `AC-XCLI-*` identity set and `TEST-XCLI-001` through `TEST-XCLI-022` identity set remain present and mutually resolved; no business AC or TEST identity is added, removed, or renamed.
- **AC-XTS-003-02:** All business, failure, security, cancellation, deadline, atomicity, terminal, and non-provenance assertions accepted by the TypeScript migration remain unchanged. The four layers retain the migration baseline cases and may add only the independently scheduled assertion groups required by `CHG-runtime-provenance-neutralization`; Test Design freezes the resulting exact counts before TDD_READY, and no unrelated assertion or TEST identity is removed, renamed, or weakened.
- **AC-XTS-003-03:** Product Core validators, Port definers, and existing public trust entries accept `unknown` where runtime admission is authoritative and refine internally to seam-owned types. Admitted operational Port/use-case methods and valid results remain strongly typed. TypeScript SHALL NOT replace, bypass, weaken, or pre-satisfy TypeBox, Product Core, Adapter, Port-result, closed-object, error, or security runtime validation; the same invalid runtime inputs fail closed with the same observable semantics.
- **AC-XTS-003-04:** Pi SDK imports and Pi-owned types remain confined to the Pi Adapter. Product Core, Ports, Application, other Adapters, Profile, CLI, tests, and fixtures expose only Xanthil/business or standard platform types at their boundaries.
- **AC-XTS-003-05:** Tests import or derive contracts from production seams and declare no test-owned duplicate business type or interface; approved runtime value fixtures remain unchanged. Runtime-negative values cross validation entries as `unknown` without `any`, repository suppression directives, or broad assertion casts. The only permitted narrow checked conversion is the single Port-contract-fixture helper with the exact runtime check and negative consumers specified in the archived `design.md`.

### REQ-XTS-004 — Canonical Offline Validation

The canonical validation entrypoint SHALL make native TypeScript and unchanged product regression one fail-fast offline proof.

- **AC-XTS-004-01:** `tools/harness/validation/run` executes in this exact order: frozen tool versions; exact declared/installed dependency versions; native `.mjs` and `.ts` syntax; strict no-emit typecheck; Unit; Contract; Integration; E2E; unchanged project-board regression.
- **AC-XTS-004-02:** A failed step streams its native output, stops every later step, returns nonzero, and creates no persistent validation result; successful execution returns zero.
- **AC-XTS-004-03:** The runner always removes `XANTHIL_REAL_PI_ACCEPTANCE`; the offline matrix performs no real Pi/model/provider call, and the existing real-model E2E remains one gated skip.
- **AC-XTS-004-04:** `npm test` invokes the canonical runner, while `npm run typecheck` remains a separately invokable check and a named runner phase. The separate existing runner self-test proves the new order and failure behavior.

### REQ-XTS-005 — Non-Destructive Rollback and Data Preservation

Rollback from the native TypeScript graph SHALL restore the accepted baseline without migrating or rewriting product data.

- **AC-XTS-005-01:** Rollback restores the eight production and 13 test/helper module paths, manifest, lock, absence of `tsconfig.json`, and runner behavior from clean commit `a0ab053`; it introduces no dual-read or compatibility mode.
- **AC-XTS-005-02:** Migration and rollback do not change CSV bytes, run schemas, source/artifact data, or user-owned `.xanthil/runs`, and require no data, schema, Artifact, replay, or backfill migration.
