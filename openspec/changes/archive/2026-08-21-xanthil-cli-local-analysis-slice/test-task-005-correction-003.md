# TASK-005 Test Correction 003 — Causal Admission Evidence

Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: first TASK-005 Worker focused GREEN returned `92 tests / 69 pass / 23 fail`; Worker stopped without post-failure edits or reruns  
Authority: approved Design, frozen TASK-005 event/tool protocol, Controller review of the retained failure inventory and deterministic SDK scenario

## Decision

The first implementation run exposed two test-oracle defects covering six leaves. These six leaves do not provide executable evidence for the approved protocol as currently written. Correct them before issuing a Worker revision. The other seventeen failed leaves remain frozen implementation failures and must not be weakened, removed, skipped, renamed out of the focused target, or made tolerant.

No product, Design, Port, facade, event, or business contract changes. This correction changes only causal test evidence.

## Defect A — Wrong Discovery active-tool status is observationally identical

Current mutation `wrong-set-active-tools-status` calls the underlying facade with the correct Discovery input `[]` and returns the frozen status `{active_tool_names:[]}`. That value is exactly the required correct status, so no conforming Adapter can distinguish it from the normal deterministic facade result without inspecting function identity/source or adding a test-only discriminator.

Correct exactly this mutation so its returned closed frozen status is observably wrong for the same Discovery call, for example a non-empty approved tool-name array. Preserve the existing leaf title, expected `PROTOCOL_FAILURE`, phase, effect-count assertions, and all other scenarios.

## Defect B — End/late event validation occurs after approved callback admission

For the deterministic facade protocol, an approved turn emits `tool_execution_start`, then calls the translated `custom_tool.execute`, awaits the business descriptor, and only then emits `tool_execution_end`. An end-event call-ID/name/`isError` mutation therefore cannot be observed before the already-approved first descriptor callback is admitted. Likewise, a tool event injected after terminal settlement occurs only after all three approved callbacks completed. Requiring zero descriptor admissions for these later-event corruptions reverses the frozen causal order and is not implementable without deadlock, prediction, or a test-only branch.

Correct only the admission assertions for these five existing leaves:

- `duplicate tool call ID`: exact one admitted callback, the first approved `profile_approved_fixture` call with `correlation_id="call-001"` and exact empty arguments; rejection occurs when the next duplicated start is observed, before a second callback.
- `tool start/end call-ID mismatch`: exact one admitted first approved callback with original start correlation; rejection occurs at the mismatched end.
- `tool start/end tool-name mismatch`: exact one admitted first approved callback; rejection occurs at the mismatched end.
- `tool isError true`: exact one admitted first approved callback; rejection occurs at the error end.
- `tool event after terminal closure`: exact three admitted approved callbacks in frozen order; the late post-terminal start is rejected and must not admit a fourth callback.

Each leaf must continue to assert `TOOL_POLICY_VIOLATION`, one SDK factory, the same prompt/disposal boundary, exact bounded callback inputs, and no extra or out-of-order admission. All earlier-event mutation leaves must retain zero admissions.

## Test Role and Paths

Use a fresh Test role. Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`

Conditional writes: none. The integration test, all production files including `adapters/agent-pi/local-analysis.mjs`, Spec/Design/Tasks/Test Plan, manifests, dependencies, board, and every other path are frozen.

The Test role is not alone in the repository. It must preserve the Worker implementation byte-for-byte and must not fix implementation failures.

## Static and Execution Proof

Before running tests, statically prove:

- exactly the one indistinguishable status mutation and five admission assertions changed;
- all 92 TASK-005 leaves remain top-level registered with unchanged names;
- no skip/todo/conditional suppression was added;
- the remaining seventeen Worker failures retain their prior assertions and expected codes/effect counts.

Allowed execution:

- syntax checks on the two owned test files: any number;
- one test-private helper-health execution if required by the changed fixture;
- one final full focused command, no partial/equivalent production target:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected corrected RED:

- exactly 92 scheduled;
- helper remains PASS;
- the six corrected leaves no longer fail because of an impossible oracle;
- every remaining RED is attributable to a concrete missing/incorrect Adapter behavior, with exact leaf names and sanitized-code/effect differences reported;
- zero cancelled, skipped, or todo.

If any new mismatch, production write, helper failure, or contract ambiguity appears, stop with `TEST_CONFLICT_TASK_005_CORRECTION_003`. Do not edit production or run a second final target.

## Return

Return:

- exact changed lines/semantics and static 1+5 inventory;
- syntax/helper evidence and execution budgets;
- exact final counts and all remaining failed leaves grouped by production root cause;
- confirmation that the production Adapter and all forbidden paths were untouched;
- `TDD_READY_TASK_005_REVISION_001` or `TEST_CONFLICT_TASK_005_CORRECTION_003`.
