# TASK-006 Test Handoff — CLI, Personal Profile, and Canonical Example

Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`  
Prerequisites: TASK-002, TASK-003/TASK-003B, TASK-004, TASK-005 deterministic evidence, and TASK-007 accepted  
Route: R2/complex Test role, `gpt-5.6-terra` high

## Objective

Derive a complete mutation-sensitive executable test package for TASK-006 and establish expected RED before any CLI/Profile/example production implementation. Cover only the approved personal local Profile and canonical synthetic example. Do not run a real Pi prompt or provider/model call.

## Role and Ownership

Use a fresh Test role logically isolated from implementation. Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/**`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

Conditional writes: none. Production (`apps/**`, `profiles/**`, `examples/**`, `packages/**`, `adapters/**`), Spec/Design/Tasks/Test Plan, manifests/lockfiles/dependencies, board, credentials, global Pi, and every other path are frozen.

Preserve all existing TASK-002..005 and TASK-007 assertions. Do not change the real-Pi deferred leaf into an active provider test. Do not weaken, skip, rename out of target, or make tests branch on missing modules.

## Required Reading

Read completely:

- `AGENTS.md`, Test role configuration, `Orchestration.md`, routing governance, testing policy, and Definition of Done;
- approved capability Spec, Design, Tasks, Test Plan, Traceability, and current Verification;
- current Product Core, Ports, Application, all three Adapters, public-seam helper, canonical fixture oracle, and all existing integration/E2E tests;
- only the approved product plan sections needed for the first CLI experience.

Before writing, return a test inventory and contract-gap audit. If an exact user-visible output/event schema, confirmation/edit loop, Profile configuration surface, Ctrl-C protocol, or canonical example byte contract is insufficiently frozen to write closed assertions, return `TEST_CONFLICT_TASK_006` with the minimum Design clarification. Do not invent event names, UI fields, prompts, defaults, paths, exit codes, labels, or error text.

## Frozen Production Surfaces Under Test

- CLI module: `apps/cli/xanthil.mjs`
- exact export: `runXanthil({input,output,application})`
- personal composition module: `profiles/personal/local-analysis.mjs`
- exact export: `createPersonalLocalAnalysisProfile(...)` as frozen by Design/current public seam
- canonical example root: `examples/member-analysis/`
- exact source bytes: `examples/member-analysis/member-orders-v1.csv`, repository fixture identity SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`, 530 bytes

Do not add CLI flags, RPC, resume/list/delete/repair, retry, automatic action, alternate source/model/Profile, cwd/home/env fallback, generic command parsing, additional example files, or output persistence.

## Required Executable Evidence

Create independent top-level leaves, not one broad journey, for at least these causal classes where the approved contract provides an exact assertion:

### CLI construction and closed input

- module exports only `runXanthil` and returns no SDK/Adapter internals;
- input envelope is closed; missing/null/unknown input, invalid async input, invalid output writer, invalid Application surface, and caller-supplied model/path/run root/tool/provider options fail before Application work;
- only the approved question and explicit gate responses are admitted;
- unavailable commands `resume`, `list`, `delete`, `repair`, `decision`, `recommend`, and `action` fail before `application.start`.

### Discovery and Analysis Gate

- the approved question is sent once to Application;
- the complete validated proposal is presented before confirmation;
- before confirmation there is no run, analytical call, success, or terminal output;
- exact explicit confirmation calls `confirm` once with the unchanged full proposal;
- empty response, EOF, rejection, and Ctrl-C before confirmation cancel/exit without confirmation or success;
- semantic edit does not execute the old proposal and follows only the approved re-proposal behavior. If that loop's exact Application call contract is not frozen, stop with a contract gap rather than inventing one.

### Completion, failure, and cancellation rendering

- success becomes visible only after Application returns a succeeded manifest/result;
- deterministic success exposes the exact oracle, `F-001`, source checksum, limitations, and bounded Evidence/Summary references without raw rows/session/provider payloads;
- failed/cancelled/in-progress values cannot render a success claim;
- Ctrl-C after confirmation invokes idempotent Application cancellation and admits no late success;
- stable errors are sanitized; no credential, environment, absolute path, raw SDK/provider cause, transcript, source row, or project-control content reaches output.

Assert causal call/output ordering. Do not invent decorative copy where only semantic inclusion/order is approved.

### Personal Profile composition

- exact one export and closed configuration;
- explicit absolute existing safe `workspaceRoot`, explicit absolute existing/safe or approved non-created `runRoot` contract, exact provider `xiaomi-token-plan-cn`, exact model `mimo-v2.5-pro`;
- composes the Application with the project-local Pi Adapter, DuckDB/Python Adapter, and local Artifact Adapter only;
- composition itself reads no source rows, creates no run/root/artifact, opens no Pi prompt/session, reads no credentials, and makes no provider/network call;
- missing/null/relative/unknown/unsafe/symlink roots, ambient model/provider, alternate Adapter injection, cwd/home/env fallback, and extra surface fail before effects.

If the current Design does not expose an observable safe way to prove exact Adapter selection without a new production inspection API, use behavior at the public seam or report a gap; do not add test-only production exports.

### Canonical example

- exact path, bytes, byte count, SHA-256, header/order/date/schema semantics, and reference oracle;
- Profile/CLI source descriptor sees only workspace-relative `member-orders-v1.csv`;
- no second CSV, hidden fallback fixture, generated copy, real/user data marker, alternate version, or extra example activation;
- no run directory or output is created by import/composition alone.

### Out-of-scope and activation boundaries

- no Desktop, Console, enterprise Profile, RPC, SQLite, Trace Platform, Ontology, Knowledge, Memory, Packs, Web Research, Workflow, Decision/recommendation/Action, retention, migration, resume/list/delete/repair surface;
- activation remains the personal Profile only and rollback is entrypoint/composition disablement, not data deletion.

## Test Quality Rules

- Every distinct failure/mutation needs its own top-level registered leaf and exact effect assertions.
- Test-private doubles/harnesses may live only under the allowed fixture path and must exercise public surfaces.
- Helpers must have an independent positive health leaf before relying on them for RED.
- Tests must not use source-text matching as behavior evidence, except bounded repository absence/path inventory where no runtime surface exists.
- No sleeps, real timers, real provider, credential reads, network, global config, ambient home/cwd, or persistent user path.
- Test-owned filesystem effects use isolated system temporary roots and clean only those explicit roots.

## Expected RED and Budget

The currently absent seams are:

- `apps/cli/xanthil.mjs`
- `profiles/personal/local-analysis.mjs`
- `examples/member-analysis/member-orders-v1.csv`

The test environment and all upstream production modules are GREEN. Establish RED only from missing/incorrect TASK-006 behavior, with all leaves registered before dynamic seam imports can reject.

Allowed validation:

- syntax checks on changed test/helper `.mjs` files: any number;
- helper-health target: maximum two executions, only if a helper is added/changed;
- one final TASK-006 focused RED command, chosen and frozen by the Test role before execution; it must include all new TASK-006 integration/E2E leaves and exclude real TEST-XCLI-013 provider activation;
- no production target, full suite, install/build, real Pi/provider/model, credential, network, or second final run.

The final RED must report exact tests/pass/fail/cancelled/skipped/todo counts and root-cause split by missing CLI/Profile/example seam. A skipped real-Pi leaf is separately authorized historical deferral and must not be counted as TASK-006 evidence; prefer a name pattern that excludes it.

## Return

Return:

- pre-write inventory and any exact contract gap;
- changed test/helper files only;
- top-level leaf inventory mapped to TEST/AC IDs and positive/negative boundaries;
- syntax/helper evidence and budgets;
- one final focused RED with exact counts and missing-seam split;
- confirmation of no production/Spec/manifest/dependency/board/global/credential/model/network writes or calls;
- `TDD_READY_TASK_006` or `TEST_CONFLICT_TASK_006`.

Do not start the TASK-006 Worker or Validator. Controller owns the next Gate.
