# TASK-005 Test Revision 001 — Schedule the Frozen Negative Protocol Matrix

Status: **FROZEN FOR TEST CORRECTION**  
Controller: Codex  
Date: 2026-08-20

## Decision

The first TASK-005 Test return is **not accepted as TDD_READY**. Its helper is healthy and its two Adapter leaves fail only at the missing module, but the executable suite does not schedule most of the already-frozen negative behavior. A clean missing-module RED is necessary but not sufficient when one broad happy-path leaf can remain RED without proving the contract will constrain the Worker after the module exists.

This is a Test Design coverage correction, not a Spec/contract change. Production remains locked.

## Preserved Evidence

- Preserve the three allowed test paths and every accepted pre-existing assertion.
- Preserve the project-local dependency stack and existing TEST-XCLI-021 GREEN evidence without rerunning or changing it.
- Preserve the selected deterministic `{sdkSessionFactory}` seam, seven-method facade, exact construction request/policy, production-default lazy path, and all Requirement/AC/Test IDs.
- Preserve the first helper result and first focused RED as historical evidence; do not overwrite or reinterpret them as final TDD_READY.

## Required Correction

Use independently scheduled `TASK-005` leaves, not one happy-path leaf or label-only assertions, to cover at minimum:

1. **Helper full-lifecycle health:** the test-owned facade completes valid Discovery and Execution, invokes all three translated tools, projects both final results, and exercises subscribe/unsubscribe, both active-tool states, both prompts, actual-model reads, and idempotent disposal without the production Adapter. It must remain independent of expected production behavior and contain no SDK/credential/network/model access.
2. **Exact valid request and happy path:** retain the current request/policy/custom-tool assertions plus the unchanged `runAgentRuntimeContract`; assert exact call order and one facade instance across both turns.
3. **Factory/facade closed surface:** injected factory throw/reject, malformed/non-frozen/extra/missing facade member, wrong sync/async or wrong/extra/missing status field, invalid unsubscribe/listener behavior, and calls after disposal map fail closed without raw cause or retry.
4. **Terminal event protocol:** missing/reordered/duplicate/late `message_end`, `agent_end`, or `agent_settled`; multiple final assistant results; malformed/extra JSON; wrong role/stop reason; retry/compaction/continuation activity. At least one mutation-sensitive case must fail for each distinct rejection class rather than only asserting a label.
5. **Tool policy and correlation:** any Discovery tool event; Execution early/unknown/extra/reordered/duplicate/late tool; bad/duplicate call ID; non-empty args; mismatched start/end; `isError:true`; tool event before callback settlement; late callback/result. Prove the business descriptor is not invoked when admission fails.
6. **Actual model and leakage:** wrong provider/model at construction or after either settled turn; raw message/thinking/session/provider/credential/install-path/SDK error or cause in events/results/errors. Assert only stable sanitized business codes escape.
7. **Failure mapping and no retry:** construction/model unavailable, prompt/turn failure, tool-policy failure, protocol failure, and listener/facade failure each map to the approved stable code; assert prompt/factory/tool counts show no automatic retry.
8. **Cancellation/timeout quiescence:** hold an in-flight prompt or tool promise, cancel/expire, and prove admission closes before late completion; unsubscribe occurs, then `abort`, then `waitForIdle`, then one dispose; repeat cancel is idempotent, no late event/result is accepted, and no unhandled asynchronous work remains.
9. **Session phase closure:** Execution before Discovery, second Discovery, repeated Execution, and operations after failed/cancelled/completed state produce the approved sanitized result without another prompt or tool call.
10. **Production-default lazy readiness:** retain TEST-XCLI-011 positive isolated-config case, but independently schedule constructor/openSession closed-input negatives and pre-prompt cancel/dispose/no-auth-file effects so one early failure cannot mask the entire readiness matrix. Do not realize a Pi session or call `discover`/`execute`.

The deterministic facade helper may be extended with test-owned scenario/event/fault controls. Those controls stay strictly under test paths and must not be mirrored as production flags or APIs. Do not encode production implementation order as an oracle beyond the frozen Design sequence.

## Scope and Stop Line

Allowed writes remain exactly:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`;
- optional test-private helper files under `tests/fixtures/xanthil-local-analysis/`;
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`;
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`.

Everything else remains forbidden, including production, OpenSpec other than this Controller-owned revision, manifests, dependencies, board, credentials, network, model calls, global Pi, other tests, and user data.

No new field, status, error code, production export, dependency, threshold, or product behavior may be invented. A genuine ambiguity returns `TEST_CONFLICT_TASK_005_R1`.

## Revision Validation Budget

- Syntax checks: any number.
- Focused helper-health executions: maximum two.
- One final corrected focused RED execution:
  - `node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No equivalent partial final-target probing, TEST-XCLI-021 rerun, unrelated regression/full suite, production execution, install, real SDK session, credential read, network, or model call.

The final inventory must list every scheduled leaf by category. All helper leaves must PASS. Every Adapter leaf must be scheduled and RED only because `adapters/agent-pi/local-analysis.mjs` is absent or lacks frozen behavior, with zero skipped/cancelled/todo. If a helper or non-Adapter dependency fails, stop `TEST_DESIGN_BLOCKED_TASK_005_R1`.

Return `TDD_READY_TASK_005_R1` only with the corrected leaf inventory, exact command/counts/root-cause split, scope evidence, and zero forbidden effects. Do not start Worker or Validator.
