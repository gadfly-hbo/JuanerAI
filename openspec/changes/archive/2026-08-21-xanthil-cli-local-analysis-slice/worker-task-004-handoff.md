# TASK-004 Worker Handoff — Real Local Analysis and Run Artifact Adapters

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate, Route, and Goal

- Spec Gate: PASS.
- TASK-002 Product Core: Controller accepted, `118/118` unit GREEN.
- TASK-003/TASK-003B Ports and Application: Controller accepted, `84/84` focused GREEN and `118/118` unit regression GREEN.
- TASK-004 expected RED: `71/71` fail, zero cancelled/skipped/todo; exact split is `32` leaves at the absent Analysis Adapter and `39` leaves at the absent Artifact Adapter. Helper health is `2/2` PASS. No dependency, fixture, syntax, or environment failure exists.
- Goal: implement the two frozen concrete Adapters against actual DuckDB/Python processes and the actual local filesystem, without changing their already-approved Ports, Application behavior, or tests.
- Non-goals: no Pi/Agent Adapter, CLI/Profile/composition, example data, model/network call, dependency installation, root manifest/lockfile, new schema, test API, fault selector, migration, or general-purpose database/filesystem abstraction.
- Classification: R2/complex because this batch combines subprocess confinement, filesystem containment, atomic publication, cancellation, persistence, and recovery boundaries.
- Route: bounded Worker context at `gpt-5.6-terra` high for this dispatch. If the work cannot be reconciled in the frozen paths, stop; do not broaden scope or silently retry.

## Ownership

- Allowed writes only:
  - `adapters/analytics-duckdb/local-analysis.mjs`
  - `adapters/storage-local/local-analysis.mjs`
- Conditional writes: none.
- Forbidden: every test/fixture; `packages/**`; `adapters/agent-pi/**`; `apps/**`; `profiles/**`; example/source data; OpenSpec and project-control; root manifests/lockfiles; dependencies and `node_modules`; global Pi/configuration; every other path.
- You are not alone in the repository. Preserve all existing work, do not revert another agent's edits, and do not alter approved assertions to obtain GREEN.

## Required Reading Before Code

Read completely:

- `AGENTS.md`
- `.codex/agents/juaner_worker.toml`
- `Orchestration.md`
- `docs/governance/agent-model-routing.md`
- `.ai-coding/policies/testing.md`
- `.ai-coding/definition-of-done.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/specs/local-analysis/spec.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/design.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/tasks.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-plan.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-task-004-handoff.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-task-004-artifact-protocol-addendum.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-task-004-revision-001.md`
- the unchanged TASK-004 contract/integration tests and their fixture helpers.

The tests are executable constraints, but the approved Spec and Design remain authoritative. A true mismatch returns `CONTRACT_DRIFT`; the Worker does not edit either side.

## Analysis Adapter Contract

Implement exactly one named export:

`createDuckDbPythonLocalAnalysisExecution({workspaceRoot})`

The factory returns only:

- `profileApprovedFixture`
- `calculateMemberRepurchaseMetrics`
- `validateMemberRepurchaseMetrics`

Required behavior:

1. The constructor configuration is closed and synchronously rejects missing, null, relative, unknown-field, non-directory, symlink-root, or unsafe-root input before a source read or process effect. There is no cwd, environment, home, repository, or test-fixture fallback.
2. Every Port command is closed. It accepts only the frozen Application values, the shared `AbortSignal`, and required integer `deadline_seconds` in `0..30`. A direct value `0` returns sanitized `TIMEOUT` before process/result work. Missing, non-integer, below-zero, above-30, unknown, model-supplied SQL/Python/command/env/output, or already-aborted input fails closed.
3. Resolve the approved relative source path under `workspaceRoot`, then enforce real-path containment and regular-file identity. Reject traversal, absolute source paths, symlink escape, non-regular files, malformed or mutated fixture bytes, and wrong hash/size/version before analytical output.
4. `profileApprovedFixture` returns only the exact bounded profile metadata frozen in Design: source identity/version, row count `20`, ordered columns, and date coverage. It returns no row, absolute path, process object, or engine detail.
5. Own the frozen canonical read-only SQL and Python-validator bytes in this Adapter. Invoke only the locally version-checked `duckdb` CLI and Python standard library; callers cannot select an executable, query/script, module, option, working output path, or environment. Do not create analytical output files in the workspace.
6. DuckDB and Python independently compute the approved aggregate oracle. Return exact closed `{result,canonical_asset}` envelopes with `calculation_kind=sql|python_validation`, exact canonical Q-001/S-001 metadata, and non-empty canonical bytes. Do not leak rows, paths, stdout/stderr envelopes, process handles, or unknown fields.
7. Use one attempt only. Observe cancellation and the bounded deadline, terminate owned process work when needed, wait for settlement, sanitize all error output, and never retry or expose raw commands/runtime details.
8. Use Node built-ins plus the installed system runtimes only. No npm package or manifest change is authorized.

## Run Artifact Adapter Contract

Implement exactly one named export:

`createLocalRunArtifactStore({runRoot})`

The factory returns only:

- `beginRun`
- `commitConfirmedContract`
- `appendAsset`
- `replaceManifest`
- `commitSuccess`
- `readTerminalRun`

Required behavior:

1. The constructor configuration is closed and synchronously rejects missing, null, relative, unknown-field, non-directory, symlink-root, or unsafe-root input before a write. There is no cwd, environment, home, repository, or `.xanthil` fallback.
2. Every command is closed and carries explicit `run_id`; the store has no implicit current run. Validate UUIDv7 identity, containment, symlinks, regular-file targets, supported schemas/status transitions, and fixed ID/path/media mappings. Interleaved runs cannot contaminate identity or bytes.
3. `beginRun({run_id,initial_manifest})` validates the complete in-progress manifest, atomically creates exactly `<runRoot>/<run_id>/run.json`, and returns exactly `{run_id}`. A collision returns `RUN_COLLISION` and preserves all prior bytes. No partial reservation manifest is supported.
4. `commitConfirmedContract({run_id,contract})` writes canonical UTF-8 `JSON.stringify(contract)` bytes at fixed `analysis-contract.json`, verifies the manifest checksum, and returns exactly `{committed:true,descriptor:{path,byte_size,sha256}}`.
5. `appendAsset({run_id,asset})` accepts only the fixed Application-assigned Q/S/O/Markdown mappings, writes exact bytes create-if-absent without overwrite, and returns exactly `{appended:true,descriptor}`. Caller-selected paths and mismatched mappings/checksums fail closed.
6. `replaceManifest({run_id,next_manifest})` accepts a complete Product-Core-valid next manifest, atomically replaces only `run.json`, returns exactly `{replaced:true}`, preserves the prior valid file on write/rename failure, and never changes a terminal run.
7. `commitSuccess({run_id,next_manifest,evidence,summary,evidence_document})` verifies the supplied succeeded manifest and every descriptor/checksum, writes canonical `evidence.json`, `summary.md`, and `evidence.md`, then publishes `run.json` last. A post-validation Markdown obstruction must fail sanitized and leave the previous in-progress `run.json` byte-identical. Return exactly `{committed:true,success_manifest_is_last:true}` only after durable success publication.
8. `readTerminalRun({run_id})` is read-only and returns exactly `{manifest,assets}` for a supported terminal run. Assets follow `manifest.artifacts` order and contain the exact descriptor plus persisted bytes; success returns all six approved assets, while failed/cancelled returns every retained appended asset. Reject missing, unindexed, reordered, non-regular, or checksum-disagreeing bytes.
9. Core writes use same-directory unpredictable temporary files, close/flush as supported, and atomic rename. Assets are append-only. Do not expose arbitrary overwrite, delete, list, repair, test-fault, cleanup, or caller-path capabilities.

Importing inward Product Core validation is allowed if needed; changing Product Core or duplicating its business-authoritative schema as a new public contract is not.

## Positive and Negative Evidence

The unchanged `^TASK-004` target must prove all `71` leaves GREEN, including:

- exact constructor exports and surfaces;
- real canonical fixture profile;
- real DuckDB calculation and real Python validation with independent exact agreement;
- aggregate-only/no-leak envelopes;
- closed inputs, source mutation/containment, abort, deadline, and sanitized analytical failures;
- exact real filesystem tree and bytes;
- run/asset collisions, path containment, symlink/non-regular rejection;
- atomic replacement preservation and success-manifest-last;
- retained partial assets, six-asset terminal reads, terminal immutability, read-only behavior, and cross-run isolation.

## Write Risk and Validation Budget

- Write risk: high but contained. The authorized test target creates and removes only test-owned system-temporary roots and launches only the approved local DuckDB/Python processes. Production implementation must never clean an ambient or unresolved path.
- Pre-code: build a concise constraint matrix for both files, including positive leaf, negative leaf, and failure mapping; report any true contract gap before writing.
- Syntax/static checks on the two owned `.mjs` files: any number.
- Final focused GREEN command: maximum **one** Worker execution:
  - `node --test --test-name-pattern='^TASK-004' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No partial/equivalent test target, helper target, TASK-003, unit, E2E, full suite, install/build, model, network, or repeated focused execution.
- If the one focused execution fails, stop with `REVISION_SCOPE_ESCALATION` and return exact failed leaves/root causes. Do not rerun, edit tests, or cross the allowed paths.

## Handoff

Return:

- changed files, exactly within the two allowed Adapter paths;
- Requirement/TEST mapping and source locations for both factories;
- syntax/static evidence;
- focused result with exact tests/pass/fail/cancelled/skipped/todo counts and command budget `1/1`;
- real DuckDB/Python and real filesystem evidence summary;
- containment, atomicity, terminal immutability, cancellation/deadline, sanitized-error, no-retry, no-leak, and no-ambient-fallback evidence;
- dependency/install/model/network confirmation;
- write-risk/temp-root report;
- `TASK_004_READY_FOR_CONTROLLER_REVIEW`, `REVISION_SCOPE_ESCALATION`, `CONTRACT_DRIFT`, or `ROUTING_ESCALATION_REQUIRED`.

Do not start TASK-005 or Validator. Controller independently reviews and advances the Gate.
