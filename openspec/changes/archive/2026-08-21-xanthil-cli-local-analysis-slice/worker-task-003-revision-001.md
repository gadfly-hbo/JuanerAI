# TASK-003 Revision Contract 001

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Origin: TASK-003 Worker focused GREEN returned `78/81` PASS and stopped after its sole authorized execution

This is the first bounded correction to `worker-task-003-handoff.md`. The original contract remains authoritative except for the new validation budget below. Fix exactly the three independently diagnosed deltas; do not refactor passing behavior or broaden scope.

## Accepted Failure Evidence

Worker syntax checks passed and the sole focused target execution produced exactly three failures:

1. UUID collision was caught and remapped to `runtime:VALIDATION_FAILED`; the frozen behavior is the original fail-closed `RUN_COLLISION`, with one allocation attempt, no retry, and no runtime/Analysis execution.
2. Cancellation while `validateMemberRepurchaseMetrics` was active wrote terminal `{stage:'runtime'}`; the frozen terminal stage is `{stage:'analysis_python'}`.
3. An invalid calculated Port metric result was accepted past the calculate callback and later surfaced as a generic runtime validation failure; it must fail Product Core validation before publication or derived Artifact writes and terminalize as `validation/VALIDATION_FAILED`.

These are production behavior gaps in `packages/application/local-analysis.mjs`, not test or contract conflicts.

## Allowed and Forbidden Paths

- Allowed write: `packages/application/local-analysis.mjs`.
- `packages/ports/local-analysis.mjs` is frozen because its focused cases already pass.
- Forbidden: every other path, including tests/fixtures, Product Core, contracts, Adapters, CLI, profiles, manifests, dependencies, OpenSpec other than this Controller-owned revision file, and project-control.
- Preserve all existing passing behavior and other agents' work.

## Exact Corrections

### 1. Collision identity

- Detect/preserve `RUN_COLLISION` from `runArtifactStore.beginRun` before a run is considered allocated.
- Reject with a message/code matching `RUN_COLLISION`; do not produce a failed/cancelled terminal write against the collided run.
- Do not retry, regenerate, call runtime execute, or call an Analysis operation.
- Do not preserve arbitrary Adapter errors generally; only the frozen collision identity receives this pre-allocation treatment.

### 2. Active cancellation stage

- Maintain an internal business-stage marker whose value is updated before each cancellable confirmed operation.
- While Python validation is active, idempotent `cancel()` must write exactly one cancelled terminal with `terminal_detail:{stage:'analysis_python'}`.
- Preserve the already-passing runtime cancellation stage and shared AbortSignal semantics.
- The marker is private state, not a public field or test-only surface.

### 3. Immediate result validation

- After receiving the calculate envelope and before any Q-001/O-001 append or callback result publication, validate the aggregate result through Product Core closed-result authority. Use the approved Finding validator or another existing Product Core public operation without adding a Product Core method or duplicating a caller-independent oracle.
- A malformed result such as a negative count must fail as `validation/VALIDATION_FAILED`, before success and before the invalid result is exposed to the runtime/model.
- Preserve exact valid SQL/Python envelope flow, equivalence, asset ordering, and bounded callback return values.
- Do not weaken the later Python-result equivalence or final Finding validation.

## Validation Budget

- Syntax/static commands, any number, limited to `packages/application/local-analysis.mjs`:
  - `node --check packages/application/local-analysis.mjs`
  - `rg` limited to that file
- New revision focused GREEN command, maximum **one** Worker execution:
  - `node --test --test-name-pattern='^TASK-003' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

No partial pattern, equivalent retry, unit, full target, install, build, network, model, or test edit is authorized. Failure of the revision execution returns `REVISION_SCOPE_ESCALATION` and stops immediately.

## Acceptance Evidence

- Application syntax PASS.
- Focused target `81/81` PASS, zero fail/cancelled/skipped/todo; revision command count `1/1`.
- Source mapping identifies the collision preservation, stage marker, and immediate Product Core validation.
- Changed paths for this revision contain only `packages/application/local-analysis.mjs`.

## Stop Lines

- Test/Spec contradiction: `TEST_CONFLICT`.
- Need to change Ports, Product Core, tests, public APIs, dependencies, or any fourth behavior: `REVISION_SCOPE_ESCALATION`.
- Do not start TASK-004; Controller acceptance remains required.
