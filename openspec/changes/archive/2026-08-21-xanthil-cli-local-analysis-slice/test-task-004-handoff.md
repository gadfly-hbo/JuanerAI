# TASK-004 Test Design Handoff

Status: **FROZEN FOR TEST AUTHOR**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate and Goal

- Spec Gate: PASS.
- TASK-002 Product Core: ACCEPTED, `118/118` unit GREEN.
- TASK-003 Ports/Application: ACCEPTED, `81/81` focused GREEN.
- Goal: replace the placeholder concrete-Adapter checks with an executable TASK-004 suite that establishes meaningful RED for the absent Local Analysis and Run Artifact Adapter modules.
- Non-goal: no production implementation, dependency/manifest change, Pi/CLI/Profile work, model call, or product-contract expansion.
- Route: Test role, R2/complex, continuing the already-escalated Sol/high Test context because the work combines subprocess, filesystem containment, atomicity, cancellation, and prior protocol-test corrections. The route lasts only for TASK-004 Test Design; failure returns to Controller and does not auto-escalate again.

## Ownership

- Allowed writes:
  - `tests/fixtures/xanthil-local-analysis/**`
  - `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`
  - `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- Conditional writes: none.
- Forbidden: all production, Product Core/Application/Ports, OpenSpec, root manifests/lockfiles, dependencies, project-control, unit/E2E tests, example/product fixture paths, global Pi, network, model calls.
- Preserve every existing assertion and the accepted TASK-003 focused behavior. Do not weaken or relabel old tests merely to isolate TASK-004.

## Frozen Constructors

Use the TASK-004 addendum in `design.md`:

- `createDuckDbPythonLocalAnalysisExecution({workspaceRoot})`
- `createLocalRunArtifactStore({runRoot})`

Both configs are closed, require an absolute existing safe directory, and have no cwd/environment/home/repository fallback. Real tests use isolated system-temporary directories and clean them in `finally`/test teardown.

## Local Analysis Real Adapter Evidence

Create independently scheduled `TASK-004` leaves that, once implemented, prove:

- exact factory export only; missing/null/relative/unknown/non-directory/unsafe workspace config fails before process or source effect;
- canonical 530-byte fixture is copied from the test-owned canonical bytes into an isolated workspace at `member-orders-v1.csv`;
- `profileApprovedFixture` returns exact bounded metadata only;
- actual DuckDB CLI calculation and actual Python standard-library validation each return the frozen exact oracle, exact `calculation_kind`, and non-empty canonical Q-001/S-001 bytes with approved ID/category/path/media type;
- SQL/Python outputs independently agree field-for-field except `calculation_kind`; neither result contains source rows, absolute paths, process/engine handles, stdout/stderr structures, or unknown fields;
- mutation/hash mismatch, traversal, absolute path, symlink escape, non-regular file, malformed fixture, unknown input fields, model-supplied SQL/Python/command/env/output, already-aborted signal, and an immediately exhausted valid deadline fail closed with stable sanitized errors;
- the Adapter does not create source/workspace output files and does not read test paths by convention.

Use the independent fixture oracle already owned by tests. Do not assert against production-generated expected output. Canonical SQL/Python byte expectations may be frozen as test-owned exact bytes only if they derive from the approved formulas and security constraints rather than copying a Worker implementation after the fact.

## Run Artifact Real Adapter Evidence

Create independently scheduled `TASK-004` leaves that inspect the actual temporary filesystem and prove:

- exact factory export only; missing/null/relative/unknown/non-directory/unsafe run-root config fails before write;
- one UUIDv7 `beginRun` creates only `<runRoot>/<run_id>/` and an in-progress `run.json`; all paths remain contained and no absolute path enters business records;
- confirmed contract and every fixed asset are written with exact bytes, fixed filenames, matching descriptors/checksums, create-if-absent append-only semantics, and no caller-selected path;
- duplicate run and duplicate asset collisions fail without changing prior bytes; traversal/non-UUID IDs, wrong asset mappings, symlink escape, and pre-existing non-regular targets fail closed;
- core replacement preserves the prior valid file on a failed write boundary; test-private filesystem arrangements may provoke a real rename/write failure, but no production fault flag/config is allowed;
- `commitSuccess` writes validated Evidence and Markdown, indexes exactly the six approved artifacts, and makes the succeeded manifest visible last;
- failed/cancelled replacement is non-success, terminal records/files are immutable, and supported terminal reads are read-only; overwrite/delete/list/repair capabilities are absent;
- cleanup is restricted to the exact test-owned temporary roots.

Tests must parse the real file bytes/tree in original order and include negative mutations that would make the assertion fail. An in-memory double alone is health evidence, not the real Adapter result.

## Test Structure and RED Quality

- Give every new leaf a `TASK-004` prefix so the focused target is exact.
- Keep helper-health cases independent and passing without either production Adapter.
- Each focused RED leaf must fail because exactly one authorized Adapter seam is missing or lacks approved behavior; no syntax/helper/dependency/environment failure is acceptable.
- With modules absent, categorize the focused failures by `analysisAdapter` versus `artifactAdapter`; prove all intended leaves were scheduled.
- Do not encode fixed temporary paths, fixed random run IDs as production-generation expectations, ambient executable locations, arbitrary sleeps, external network, or model calls.
- Do not add test-only production APIs. Any filesystem fault arrangement remains under test paths.

## Environment Evidence

Controller read-only prerequisite evidence already passes:

- Node `v26.0.0` (requires `>=22.19.0`)
- npm `11.12.1`
- Python `3.9.6` (requires `>=3.9`)
- DuckDB CLI `v1.5.2`

TASK-004 requires no root npm dependency. Do not create `package.json`, `package-lock.json`, or `node_modules`.

## Validation Budget

- Syntax checks on changed test `.mjs` files: any number.
- Test helper-health pattern against touched contract/integration files: maximum two executions while authoring.
- Accepted TASK-003 regression target: maximum one execution after edits.
- Final TASK-004 focused RED target: maximum one execution:
  - `node --test --test-name-pattern='^TASK-004' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No unit/E2E/full suite, install/build, model, network, or equivalent retry target.

If the final TASK-004 target does not schedule all declared leaves, if a helper fails, or if failures are not exclusively the two absent Adapter modules, stop with `TEST_DESIGN_BLOCKED`; do not edit production.

## Handoff

Return:

- changed test paths;
- leaf inventory and mapping to `TEST-XCLI-007`, `TEST-XCLI-008`, `TEST-XCLI-012`, `TEST-XCLI-015` through `TEST-XCLI-018` as applicable;
- syntax and helper-health evidence;
- accepted TASK-003 regression evidence;
- final focused RED counts, exact missing-module split, zero unscheduled/cancelled/skip/todo unless an existing explicitly authorized skip is outside the focused pattern;
- temp/write-risk summary and confirmation that no production/OpenSpec/manifest/dependency path changed;
- `TEST_READY_FOR_TASK_004` or one explicit stop signal.
