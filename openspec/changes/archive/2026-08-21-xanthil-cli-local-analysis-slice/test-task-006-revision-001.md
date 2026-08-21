# TASK-006 Test Revision 001 — Closed CLI/Profile Contract

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: Controller PASS on the revised TASK-006 CLI/Profile contract after the initial Test role returned `TEST_CONFLICT_TASK_006` without writes or RED execution

## Authority and objective

Resume the same logically isolated Test role under `test-task-006-handoff.md`. Derive the complete mutation-sensitive executable TASK-006 package and establish one healthy expected RED against missing CLI, Personal Profile, and canonical example behavior. This revision resolves the seven previously reported gaps; it does not widen the original test ownership or authorize production work.

## Frozen contract deltas

- CLI exports only `runXanthil({input,output,application})` and accepts the exact structured one-shot async event protocol in `design.md`.
- Input events are only the approved `question`, `confirm`, `reject`, `edit`, `eof`, and `interrupt` closed frozen values in their legal states.
- Output is the exact synchronous `write(event) -> undefined` surface and exact ordered `ready`, `proposal`, `awaiting_confirmation`, `progress`, and terminal event union.
- Resolved and rejected return values, stable stage/code mapping, output/input failures, post-terminal closure, and the post-confirmation single-event race are exactly those in `design.md`.
- The fixed scenario's `edit` event awaits `handle.cancel()` and returns cancellation reason `edit_not_supported`; no re-proposal or Application public-surface revision belongs to TASK-006.
- Profile exports only `createPersonalLocalAnalysisProfile({workspaceRoot,runRoot,provider,modelId})`, requires both roots to be existing physical absolute non-symlink directories with the additional run-root restrictions, and returns exactly frozen `{application}`.
- CLI owns the exact immutable workspace-relative canonical source descriptor and the caller connects Profile to CLI through the documented two-call composition.
- The example inventory is exactly `examples/member-analysis/member-orders-v1.csv`, 530 bytes, SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`; no README, hidden file, second CSV, generated copy, or instruction file is authorized.

## Ownership and stop lines

Allowed writes remain only:

- `tests/fixtures/xanthil-local-analysis/**`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

All production, OpenSpec, manifest/lock/dependency, board, credential, global Pi, and other paths are frozen. Preserve every accepted upstream assertion. TEST-XCLI-013 remains deferred to credential-gated TASK-009 and must be excluded from TASK-006 focused evidence; no real Pi session, prompt, provider, network, or model call is authorized.

## Validation budget and return

- Any number of `node --check` runs on changed test/helper `.mjs` files.
- At most two helper-health runs only if a helper changes.
- Exactly one complete focused TASK-006 RED run after all leaves are statically registered; no partial final, retry, production target, install, or second final run.
- Report exact leaf inventory, TEST/AC mapping, pass/fail/cancelled/skipped/todo counts, and missing/incorrect seam root-cause split.

Return `TDD_READY_TASK_006` or a genuine new `TEST_CONFLICT_TASK_006`. Do not start Worker or Validator.
