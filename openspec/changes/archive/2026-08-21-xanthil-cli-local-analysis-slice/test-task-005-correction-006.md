# TASK-005 Test Correction 006 — Sync Prompt RED Capture

Date: 2026-08-20  
Trigger: Correction 005 returned `92 / 78 pass / 14 fail`; the true sync-result mutation was installed, but its leaf did not capture an earlier conforming-code failure point  
Authority: Correction 005 and approved opaque facade/Promise result surface

## Decision

Correct exactly the `sync prompt shape` test control flow without changing its contract:

- obtain the runtime and deterministic scenario without opening a session outside the rejection assertion;
- put `runtime.openSession(...)` and, if it succeeds, `session.discover(...)` inside one `assert.rejects` operation;
- continue to require sanitized `PROTOCOL_FAILURE`;
- retain exact final effects proving the correct implementation reaches one subscribe, one `setActiveTools`, one wrapped prompt invocation, then one unsubscribe/abort/waitForIdle/dispose quiescence;
- ensure the fixture-owned discarded underlying prompt Promise is explicitly consumed with a rejection handler so it cannot become an unhandled background failure.

This structure allows the current implementation's unauthorized `AsyncFunction` reflection to remain a clean RED via effect-count mismatch, while the revised implementation must validate the actual synchronous non-Promise result at the approved call boundary. It does not permit open-time function-source/prototype/constructor checks.

## Scope and Proof

Use the same Test correction role. Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`

All other paths remain frozen. Preserve exactly 92 top-level leaves and the other thirteen production RED assertions.

Run syntax checks on the two owned files, then exactly one full focused command and nothing else:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected final corrected RED: `92 total / 78 pass / 14 fail / 0 cancelled / 0 skipped / 0 todo`, with the sync-prompt leaf failing only on the production effect/lifecycle gap and every other failed leaf unchanged. No run-after-edit cycle, partial target, helper, or production edit.

Return `TDD_READY_TASK_005_REVISION_001_FINAL` or a precise new `TEST_CONFLICT_TASK_005_CORRECTION_006`.
