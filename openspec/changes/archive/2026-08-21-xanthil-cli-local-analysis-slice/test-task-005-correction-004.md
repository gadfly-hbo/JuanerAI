# TASK-005 Test Correction 004 — Fail-closed Effect Count

Date: 2026-08-20  
Trigger: Correction 003 full focused run returned `92 tests / 74 pass / 18 fail`; all five causal admission corrections passed, while the corrected `wrong-set-active-tools-status` leaf exposed one stale effect count  
Authority: approved fail-closed facade-status validation and the retained Correction 003 evidence

## Decision

Correct exactly one assertion in the existing `wrong setActiveTools status` leaf: expected `prompt` count changes from `1` to `0`.

The Adapter must validate the synchronous `setActiveTools` status before issuing the Discovery prompt. Once the returned frozen closed status is observably wrong, fail-closed behavior requires zero prompt effects followed by the existing quiescence sequence. Requiring `prompt=1` contradicts that ordering.

No other fixture, leaf name, expected error code, effect count, admission assertion, implementation behavior, or product contract changes. The other seventeen focused failures remain frozen production RED.

## Role, Scope, and Proof

Use the existing Test correction role. Allowed write only:

- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`

Every other path, including the fixture and production Adapter, is frozen.

Before writing, confirm the exact stale assertion and the Adapter SHA-256 retained from Correction 003. Then:

- change only this one expected count;
- run `node --check` on the owned file;
- run the full focused command exactly once:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected corrected RED: exactly 92 scheduled, 75 pass, 17 fail, zero cancelled/skipped/todo; the corrected status leaf passes, and all seventeen failures are production Adapter gaps already identified by Correction 003. Do not run helper or partial targets. Do not edit after the focused run.

Return exact line semantics, Adapter before/after hash equality, syntax and focused evidence, full remaining failure inventory, scope confirmation, and either `TDD_READY_TASK_005_REVISION_001` or `TEST_CONFLICT_TASK_005_CORRECTION_004`.
