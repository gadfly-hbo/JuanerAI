# Xanthil Local Analysis Specification

## Change004 scoped amendment

For the explicit membership plan/version path, [the membership-task baseline](../member-analysis-task/spec.md) specifies M1-only versus M1+M2 execution, independent DuckDB/Python verification, period/zero/empty semantics and plan/result provenance. no second runtime, fallback or Provider permission is introduced.

## Capability Contract

- Source Changes: `CHG-xanthil-cli-local-analysis-slice`; `CHG-xanthil-typescript-migration`; `CHG-run-root-identity-reuse-fix`; `CHG-runtime-provenance-neutralization`
- Capability: `local-analysis`
- Accountable user: Data Analyst
- Delivery path: `greenfield_fast_path`
- Contract version: `1.0`
- Product result: evidence-backed analytical Findings only; this Change does not create a `Decision`, `Action Recommendation`, `Automated Decision`, `Action`, or `Outcome`.

The fixture, formulae, and reference values below are deterministic test semantics for this synthetic example, not claims about a real business operation.

## Exact Current Run Provenance Contract

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

### REQ-XCLI-009 — Closed Run Manifest `2.0` and Independent Artifact Contracts



- **AC-XCLI-009-02:** Core files are committed by same-directory temporary file plus atomic rename; assets receive new `Q-`, `S-`, or `O-` IDs and are never updated in place.
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

Execution SHALL fail closed on runtime, model, source, tool, analysis, validation, or Artifact failure; SHALL accept user cancellation.

- **AC-XCLI-013-01:** Each mapped failure terminates once with its stable stage/code, stops new model/tool work, preserves only already committed numbered diagnostic assets, and returns no success claim.
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

- **AC-XCLI-015-01:** `run.json` schema `2.0`, `analysis-contract.json` schema `1.0`, and `evidence.json` schema `1.0` jointly resolve each Finding to exact fixture bytes, the Adapter-observed source read time, inclusive business-date windows, canonical SQL and Python assets, outputs, Application-owned Xanthil `1.0.0`, Profile-owned `personal`, Pi Adapter-declared `agent-pi/1.0.0`, preflight-observed explicit `minimax-cn/MiniMax-M3`, and the same `run_id`.
- **AC-XCLI-015-02:** Recalculation from the recorded fixture identity and assets reproduces the reference oracle independently of narrative text, Pi transcript, filesystem mtime, ambient model default, or a live model call.

### REQ-XCLI-016 — Activation, Bounded Compatibility, Rollback, and Retirement



- **AC-XCLI-016-01:** Before activation, executable tests prove expected RED then GREEN at unit, Port contract, integration, and E2E levels, required regression/quality checks pass, and independent verification passes or an authorized waiver is recorded.
## Stable Failure Vocabulary

Preflight failures create no run and use one of: `FIXTURE_NOT_FOUND`, `FIXTURE_MISMATCH`, `SOURCE_BOUNDARY_VIOLATION`, `RUNTIME_UNAVAILABLE`, `MODEL_UNAVAILABLE`, `RUN_ROOT_UNSAFE`, or `CONTRACT_VERSION_UNSUPPORTED`. A post-confirmation run-allocation collision also creates no new run and uses `RUN_COLLISION`.

Post-confirmation failed runs use the stage set `contract_persist | runtime | source_read | analysis_sql | analysis_python | validation | artifact_finalize | execution` and the closed error-code set `ARTIFACT_WRITE_FAILED | SOURCE_CHANGED | SOURCE_BOUNDARY_VIOLATION | SOURCE_INVALID | MODEL_EXECUTION_FAILED | TOOL_POLICY_VIOLATION | ANALYSIS_EXECUTION_FAILED | VALIDATION_FAILED | TIMEOUT | CONTRACT_VERSION_UNSUPPORTED | INTERNAL_ERROR`. Cancellation uses the stage active when cancellation was accepted. Free-text diagnostic messages are optional, sanitized, non-authoritative, and not stable API.

## Compatibility Boundaries

- No generic dual-read dispatcher, version registry, migration marker, normalization layer, or background scan is authorized.

- Existing failure codes/stages and their boundary mappings remain unchanged.


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

- **AC-XTS-001-04:** No `allowJs`, `checkJs`, broad include, skip-lib escape,
  dual source owner, `tsx`, or root compiler emit is introduced. The separate
  approved Desktop Forge/Vite Main/preload/Renderer output and build configs
  are the narrow packaging exception, not a general bundler/migration allowance.



#### Accepted Desktop graph compatibility criteria



- **AC-XDESK-LA-001-03:** Pi SDK types/imports remain inside agent-pi;
  Electron/React types remain in Desktop/build configuration; node:sqlite
  remains inside the Desktop storage Adapter.
- **AC-XDESK-LA-001-04:** Product Core, Application, business Ports, CLI/Console
  and persisted business contracts expose only business or standard platform
  values. Desktop owns exact no-model Run 3.0 separately: local-analysis still
  writes 2.0/reads terminal 1.0 and 2.0, Console still selected-directory reads
  1.0 only, and neither gains a dispatcher, scan, migration or rewritten Run.

### REQ-XTS-002 — Exact Strict No-Emit Toolchain

- **AC-XTS-002-01:** Retain npm 11.12.1, Node engine >=22.19.0,
  TypeBox 1.3.7, TypeScript 5.9.3 and @types/node 22.19.19. Approved additions
  are React/React DOM 19.3.0, Electron 44.4.3, Vite 8.3.0,
  Forge CLI/plugin-vite 7.11.2,
  @types/react and @types/react-dom 19.3.0, and playwright-core 1.63.0.
  Package identity is private `xanthil-desktop` / Xanthil / 0.1.0.
  There is no exports/bin/publication contract or generic start/build command.
- **AC-XTS-002-04:** Native syntax and root no-emit typechecking remain
  separately executable in the approved command-local environment and create
  no persistent compiler output. Desktop packaging is separate and cannot be
  substituted for a successful typecheck.

#### Accepted Desktop toolchain compatibility criteria

- **AC-XDESK-LA-002-03:** No nested lock, SQLite npm package, Maker, publisher,
  updater, hidden test/install networking or additional test runner exists.
- **AC-XDESK-LA-002-04:** The generated local package toolchain descriptor
  contains only approved DuckDB/Python paths and versions. It is absent from
  Git, Project data, Renderer values, provider payloads and reports.

### REQ-XTS-003 — Accepted Behavior and Boundary Parity



- **AC-XTS-003-03:** Product Core validators, Port definers, and existing public trust entries accept `unknown` where runtime admission is authoritative and refine internally to seam-owned types. Admitted operational Port/use-case methods and valid results remain strongly typed. TypeScript SHALL NOT replace, bypass, weaken, or pre-satisfy TypeBox, Product Core, Adapter, Port-result, closed-object, error, or security runtime validation; the same invalid runtime inputs fail closed with the same observable semantics.
- **AC-XTS-003-04:** Pi SDK imports and Pi-owned types remain confined to the Pi Adapter. Product Core, Ports, Application, other Adapters, Profile, CLI, tests, and fixtures expose only Xanthil/business or standard platform types at their boundaries.
- **AC-XTS-003-05:** Tests import or derive contracts from production seams and declare no test-owned duplicate business type or interface; approved runtime value fixtures remain unchanged. Runtime-negative values cross validation entries as `unknown` without `any`, repository suppression directives, or broad assertion casts. The only permitted narrow checked conversion is the single Port-contract-fixture helper with the exact runtime check and negative consumers specified in the archived `design.md`.

### REQ-XTS-004 — Canonical Offline Validation

The canonical entrypoint remains one fail-fast offline proof; the accepted
Desktop extension appends all required Console and Desktop phases without a
runtime phase selector or implicit package build in its default full mode.
The explicitly requested `--portable` CI mode is a partial offline regression,
not a third product tuple or a replacement for full CF/native acceptance.

- **AC-XTS-004-01:** `tools/harness/validation/run` retains tool/dependency
  health, native syntax, strict no-emit typecheck, existing local-analysis and
  Model Pack suites, and project-board regression. It includes all four
  unchanged Console unit/contract/integration/E2E commands before the full
  Desktop unit/contract/integration/packaged-E2E commands in the accepted final
  literal command list. No intermediate tuple or future leaf is marked passed.
- **AC-XTS-004-02:** A failed phase streams native output, stops later phases,
  returns nonzero and creates no success receipt. Successful execution returns
  zero. An external evidence capture is not a replacement runner outcome.
- **AC-XTS-004-03:** The runner always removes `XANTHIL_REAL_PI_ACCEPTANCE`;
  offline validation makes no real model/provider call and retains the one
  separately gated real-model skip.
- **AC-XTS-004-04:** npm test still invokes the canonical runner; npm run
  typecheck remains separately invokable and an actual runner phase. The
  existing runner self-test preserves order, exact configuration, fail-fast
  and no-provider assertions.

#### Accepted Desktop validation compatibility criteria

The user-authorized 2026-09-27 CI adaptation retains the default full command
list and every business assertion. Explicit `--portable` runs the same syntax,
strict types, CLI/Model Pack/board/Console, Desktop unit, portable contract and
integration suites. It omits only the frozen packaged-Main module-format leaf
and Desktop packaged GUI, and prints those, native/manual acceptance and
Electron binary health as `NOT RUN`. Electron package health in that mode proves
the exact installed registry package and its actual `index.js`, not a downloaded
platform executable; default full mode still checks the approved macOS binary.
The runner sets its own scope and cannot inherit a portable bypass. A missing
portable input or failing assertion still stops with its actual nonzero exit.
Separate macOS full/package/native evidence remains required for delivery.

Ephemeral Ubuntu installation uses the existing pinned tools and dependencies,
scripts off, no audit/fund, and no Git transport or credentials. Only the approved
node-gyp codeload archive's two transport fields (`resolved`, `integrity`) and
the same exact dependency's parent `@electron/rebuild` spec representation may
differ in a temporary installation view after the frozen raw bytes/SHA-256/SRI
match. The repository manifest/lock remain byte-identical; all other lock fields
and graph topology remain equal. The third field is required by npm11.12.1's
actual Arborist edge validation: a git parent spec rejects a remote child URL;
both representations must name the identical approved commit archive. Reversing
these three precise fields must recover the complete original lock object.
The raw archive and historical Git-repack SRI bind
different byte streams and are never substituted as equal evidence. Before any
suite, exact installed archive members/name/version must match (only npm's
documented ignore-file normalization applies). Existing output/install paths,
extra lock changes, archive mismatch or unexpected members fail closed without
overwrite, fallback, install scripts or automatic repair. No dependency upgrade,
Forge/rebuild/editor execution, native binary download or Linux product claim
is granted by this partial CI proof.

- **AC-XDESK-LA-004-01:** Validation proves exact approved tools, package
  name/version/source/integrity, local installation and required entry
  capability before product tests. Metadata alone is insufficient; a missing
  tool, entry or dependency is health failure, never causal product RED.
  Entrypoint discovery may use the package's actual supported interface.
- **AC-XDESK-LA-004-03:** Every phase preserves native output/numeric failure
  semantics, stops later phases on failure and removes the real-model gate.
- **AC-XDESK-LA-004-04:** Packaged E2E consumes the same frozen production app
  as separate normal no-debug/native-chooser acceptance. Boundary Runtime
  doubles may create closed synthetic persisted Projects for actual GUI
  tests; this does not inject a Runtime into the package, replace the normal
  local journey, or claim real-provider execution/quality.

### REQ-XTS-005 — Non-Destructive Rollback and Data Preservation

Rollback from the native TypeScript graph SHALL restore the accepted baseline without migrating or rewriting product data.

- **AC-XTS-005-02:** Migration and rollback do not change CSV bytes, run schemas, source/artifact data, or user-owned `.xanthil/runs`, and require no data, schema, Artifact, replay, or backfill migration.
