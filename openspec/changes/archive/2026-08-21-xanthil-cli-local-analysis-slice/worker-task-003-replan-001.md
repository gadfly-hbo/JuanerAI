# TASK-003 Replan 001 — Cancellation Quiescence Barrier

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Replans: TASK-003 after the initial candidate (`78/81`) and Revision 001 (`80/81`) both stopped within their validation budgets

This is a new bounded recovery work unit, not another appended retry on either prior Worker run. Controller second-return self-audit found one remaining root cause and no additional acceptance blocker in the 80 passing focused behaviors.

## Root Cause Decision

Revision 001 correctly closes tool admission, aborts the shared signal, records the active Python stage, and asks the runtime session to cancel. It then commits the cancelled manifest before the already-running `session.execute` turn has fully settled. The test-controlled Python validation resumes after abort; its callback/runtime microtasks can therefore be observed after the durable terminal commit.

The approved invariant is stronger: cancellation terminalization is the last semantic writer event after the admitted in-flight runtime/tool work has quiesced. A late callback/result is discarded; it cannot append an asset or create a runtime/tool/Analysis event after the terminal manifest.

## Lifecycle Classification

- Change/Requirement: `xanthil-cli-local-analysis-slice`; `REQ-XCLI-006`, `REQ-XCLI-010`, `REQ-XCLI-013`.
- Risk: R2 state-machine/cancellation ordering, but the remaining work unit is one diagnosed private synchronization seam.
- Difficulty: standard after Controller root-cause audit.
- Write risk: low; one existing `.mjs` file, no dependency/build/DB/fixture/network/model call.
- Role: fresh `juaner_worker` context; prior Worker runs remain closed and are not resumed.

## Ownership

- Allowed write only: `packages/application/local-analysis.mjs`.
- Frozen: `packages/ports/local-analysis.mjs` and the 80 passing focused behaviors.
- Forbidden: tests/fixtures, Product Core, contracts, Adapters, CLI, profiles, manifests/lockfiles, dependencies, OpenSpec other than this Controller-owned replan, project-control, and every other path.
- Preserve other agents' work. Do not revert or refactor unrelated code.

## Required Production Change

Introduce one private runtime-turn quiescence barrier in Application:

1. Keep a reference to the exact in-flight `session.execute(...)` promise/settlement independent of the outer `confirm()` result.
2. On cancellation, synchronously close descriptor admission and abort the shared signal, then call the session's idempotent `cancel()` exactly once.
3. Before calling `runArtifactStore.replaceManifest` for `cancelled`, await settlement of the in-flight runtime turn when one exists. Its expected cancellation/rejection is absorbed only by the cancellation path; non-cancellation error semantics outside cancellation remain unchanged.
4. Ensure this wait cannot depend on the cancellation promise itself and cannot form a `confirm <-> cancel` promise cycle.
5. Only after runtime/tool callback quiescence may Application commit the single cancelled terminal manifest using the already-correct active stage.
6. After cancellation acceptance, no callback result is validated, published to the runtime as accepted product output, appended as an Artifact, finalized as success, or allowed to create a runtime/tool/Analysis/asset event after the terminal commit.

The exact implementation may use a private execution-turn promise plus `try/finally`/settlement handling. It must not add delays, polling, retries, public fields, new dependencies, test hooks, or Adapter assumptions.

## Frozen Passing Deltas

Do not alter the already-passing Revision 001 corrections:

- one-attempt pre-allocation `RUN_COLLISION` identity and no collided-run write;
- exact active `analysis_python` cancellation stage;
- immediate Product Core validation of calculate results as `validation/VALIDATION_FAILED` before invalid publication/assets;
- Ports closed definers, dynamic UUIDv7, explicit model, descriptor order/admission, result/asset envelopes, 30/300 budgets, stable failures, success-last, and all other focused behavior.

## Validation Budget

- Syntax/static checks, any number, limited to the owned file:
  - `node --check packages/application/local-analysis.mjs`
  - `rg` limited to `packages/application/local-analysis.mjs`
- One final focused GREEN command, maximum **one** execution in this fresh replan:
  - `node --test --test-name-pattern='^TASK-003' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

No partial selector, equivalent retry, unit/full suite, install, build, network, model call, or test edit is authorized. Any failure stops as `REPLAN_BLOCKED`; do not rerun or create another repair.

## Evidence and Handoff

- Map the quiescence reference, cancellation ordering, and cycle avoidance to source lines.
- Syntax PASS.
- Focused target `81/81` PASS with zero fail/cancelled/skipped/todo; command count `1/1` for this replan.
- Changed path exactly `packages/application/local-analysis.mjs`.
- High-write commands: none. Report no unapproved temp/build/dependency artifacts.
- Do not start TASK-004. Controller performs independent source review and verification.

## Stop Lines

- Test/Spec contradiction: `TEST_CONFLICT`.
- Need for any second behavior, public contract, additional path, test change, dependency, or another execution: `REPLAN_BLOCKED`.
