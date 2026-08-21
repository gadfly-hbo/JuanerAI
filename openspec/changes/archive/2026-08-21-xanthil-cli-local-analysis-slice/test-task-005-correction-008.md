# TASK-005 Test Correction 008 — Completed-state Semantics

Date: 2026-08-20  
Trigger: Correction 007 returned `92 / 91 pass / 1 RED`; Controller compared the final assertion with the approved closed session state machine  
Authority: approved Design: `completed` is terminal; cancel from non-completed may transition to `cancelled`; cancel after completed is acknowledgement-only and does not change the completed result/state

## Decision

The final RED is a test/double contract defect, not a production defect. Do not dispatch Worker Revision 002.

After successful Execution, the session is `completed`. A later `cancel()` returns idempotent `{cancelled:true,was_confirmed:true}` but does not change the state to `cancelled` and does not touch the disposed facade. A subsequent `execute()` is an invalid repeated operation from `completed` and must return `PROTOCOL_FAILURE`, not `CANCELLED`.

## Exact Corrections

Allowed write only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`

Make two isomorphic corrections in this file:

1. Update the final `runAgentRuntimeContract` assertion after completed cancel to require `PROTOCOL_FAILURE`.
2. Update `createAgentRuntimeDouble` to model the approved closed phase semantics rather than one boolean:
   - successful Discovery enters `discovered`;
   - Execution is accepted only from `discovered`, then enters `completed` on success;
   - cancel from a non-completed, non-cancelled state enters `cancelled`;
   - cancel after `completed` is acknowledgement-only and leaves `completed` unchanged;
   - cancel after `cancelled` is idempotent;
   - execute from `cancelled` returns `CANCELLED`; execute from `completed` or another wrong phase returns `PROTOCOL_FAILURE`.

Preserve all existing return values, event records, tool calls, cancellation-signal behavior, and other negative mappings. Do not edit the production Adapter or any contract/integration test.

## Proof

Before writing, verify the production Adapter SHA remains `9ed2e048a9451d462d6484cf72c1b1c685f4207f2a7bb685742ded27132a3bf8`.

Allowed executions:

1. syntax check on the owned fixture;
2. exactly one helper-health command:
   `node --test --test-name-pattern='^contract helper health' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`
3. exactly one complete TASK-005 focused command:
   `node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected: helper `1/1 PASS`; focused `92/92 PASS`, zero fail/cancelled/skipped/todo. No partial production target, second run, or post-run edit.

Return exact fixture semantics, Adapter hash equality, syntax/helper/focused evidence, scope confirmation, and `TEST_CORRECTED_GREEN_TASK_005` or `TEST_CONFLICT_TASK_005_CORRECTION_008`.
