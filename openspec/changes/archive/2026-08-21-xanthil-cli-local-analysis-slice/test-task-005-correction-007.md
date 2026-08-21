# TASK-005 Test Correction 007 — Terminal Mutation Delivery

Date: 2026-08-20  
Trigger: Worker Revision 001 returned `92 / 86 pass / 6 fail`; Controller source-level localization proved five failures were fixture/oracle delivery defects  
Authority: approved terminal event sequence, deterministic facade contract, and retained R1 output  
Second-revision self-audit: complete; only one observable production gap remains after these corrections

## Decision

Correct exactly five test-evidence defects. Do not change the terminal protocol, expected error codes, cleanup effects, business results, production source, or the one remaining production RED.

## Exact Corrections

### A. Event suppression must preserve explicit `null`

In the deterministic facade `emit` helper, the current expression uses nullish fallback from `eventMutator(...)` to the original event. Therefore an explicit `null` returned by the three missing-event mutations is replaced by the original event and nothing is actually suppressed.

Change only this dispatch logic so:

- no mutator means the original event;
- mutator result `undefined` may retain the original event if that remains the helper convention;
- explicit `null` means suppress the event and return;
- an event object or array is delivered unchanged through the existing listener path.

This must make `missing-message-end`, `missing-agent-end`, and `missing-agent-settled` genuinely omit their named event. Their existing leaves, `PROTOCOL_FAILURE`, zero business admissions, and quiescence effects remain unchanged.

### B. Late final event must hit the phase exercised by its leaf

The `late-terminal-event` mutation currently injects only when `promptCount===2`, while its terminal-mutation leaf executes Discovery (`promptCount===1`). Make the mutation inject the same late `message_end` immediately after `agent_settled` for the exercised Discovery turn. Do not add a second prompt or change the leaf to Execution. The existing leaf must prove post-settlement event closure with zero business admissions and `PROTOCOL_FAILURE`.

### C. Wrong actual-model wrapper ledger includes its underlying call

The `wrong-get-actual-model-status` wrapper calls the underlying facade `getActualModel()` once before returning an invalid extra-field identity. The Adapter is permitted and required to make that one facade call; the invalid structure becomes observable only in its return value.

Refactor only this leaf out of any shared effect template as needed and expect exactly `getActualModel:1`, retaining `PROTOCOL_FAILURE`, prompt/cleanup counts, and every other assertion. Do not permit a second Adapter call.

## Expected Remaining Production RED

After these five corrections, the only expected RED is the offline full contract happy driver after a completed cancel: its final post-cancel `session.execute(...)` expects `CANCELLED`, while the Adapter currently checks the ordinary phase guard first and returns `PROTOCOL_FAILURE`.

Do not change this assertion. It is the single Worker Revision 002 target.

## Role, Scope, and Budget

Use the existing independent Test correction role. Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`

Production Adapter SHA must remain `9ed2e048a9451d462d6484cf72c1b1c685f4207f2a7bb685742ded27132a3bf8`. Integration tests and every other path are frozen.

Run syntax checks on the two owned files, then one complete focused target only:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected corrected RED: exactly `92 total / 91 pass / 1 fail / 0 cancelled / 0 skipped / 0 todo`. No helper, partial target, second run, or post-run edit.

Return static A/B/C proof, Adapter hash equality, exact focused result, the single remaining failure, scope/effect confirmation, and `TDD_READY_TASK_005_REVISION_002` or `TEST_CONFLICT_TASK_005_CORRECTION_007`.
