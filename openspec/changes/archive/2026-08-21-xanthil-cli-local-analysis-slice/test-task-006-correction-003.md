# TASK-006 Test Correction 003 — Final Method-Specific Error Map

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: Controller review of Correction 002's otherwise healthy `150`-leaf RED

## Scope

This replan closes exactly one incomplete bullet from `test-task-006-correction-002.md`. Allowed write is only:

- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

All helpers, integration/Profile/example tests, production, OpenSpec except this Controller record, manifests/dependencies, credentials/global Pi, board, and other paths are frozen.

## Exact changes

Preserve the existing recognized-start and recognized-confirm leaves. In the `mappedApplicationError` top-level matrix:

1. move `RUN_COLLISION` from `discover` to `confirm`, proving the no-run run-allocation error maps exactly to `{stage:'preflight',code:'RUN_COLLISION'}`;
2. add a recognized `discover` preflight error such as `MODEL_UNAVAILABLE`, mapping exactly to `{stage:'preflight',code:'MODEL_UNAVAILABLE'}`;
3. add an unknown/raw `start` cause, mapping exactly to `{stage:'execution',code:'INTERNAL_ERROR'}`;
4. add a malformed `discover` stage/code pair, mapping exactly to `{stage:'execution',code:'INTERNAL_ERROR'}`;
5. retain the unknown/raw `confirm` fallback leaf.

Each leaf must assert the exact frozen terminal/result pair, call/effect phase, no raw leakage, no proposal/success, and no later Application/input effect. Do not add another helper, abstraction, error code, phase, or representative matrix.

## Validation budget

- Any number of `node --check` on the one changed E2E file.
- No helper-health execution because the helper is frozen and unchanged.
- Exactly one complete existing `^TASK-006` focused RED command, no partial run or retry.

Return the final leaf count, exact missing-seam split, E2E hash, and `TDD_READY_TASK_006_CORRECTION_003` or `REPLAN_BLOCKED_TASK_006`. Do not start Worker or Validator.
