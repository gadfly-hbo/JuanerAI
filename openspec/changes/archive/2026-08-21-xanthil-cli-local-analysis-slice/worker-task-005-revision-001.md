# TASK-005 Worker Revision 001 — Observable Runtime Gaps

Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK_005_REVISION_001_FINAL`  
Starting implementation SHA-256: `47773e4b8e724a393b40685ecdba4df3a6301e46c475970658859a9dac4df614`  
Corrected focused RED: `92 total / 78 pass / 14 fail / 0 cancelled / 0 skipped / 0 todo`

## Objective

Revise the existing Pi Agent Runtime Adapter to close exactly the fourteen observable production gaps below and make all 92 frozen TASK-005 leaves GREEN. This is the first implementation revision after the Worker obeyed the original failure stop line.

The Test corrections changed only causal/observable evidence. They did not change the approved Spec, Design, facade surface, Product Port, model, dependency, data boundary, or production scope.

## Ownership and Frozen Paths

Allowed write only:

- `adapters/agent-pi/local-analysis.mjs`

Every test/fixture, OpenSpec document other than this Controller-owned brief, board, manifest, lockfile, dependency, `node_modules`, Profile, Application, Product Core, Port, CLI, other Adapter, source data, credential/config/session path, and global Pi path is frozen.

Preserve concurrent work and do not revert any Test correction. Do not inspect function source, function names, `constructor.name`, prototype identity, raw error text/cause/stack, mutation names, test names, or fixture internals to branch production behavior. Do not add test-only exports, markers, timers, fault switches, or hardcoded business outputs.

## Required Pre-edit Review

Re-read completely:

- `AGENTS.md`
- `/Users/huangbo/Dev/AgentOps/coding-system/policies/WORKER_DELIVERY_GOVERNANCE.md`
- the original `worker-task-005-handoff.md`
- `test-task-005-correction-003.md` through `test-task-005-correction-006.md`
- approved TASK-005 Design/Test Plan and the final frozen tests/fixtures;
- the existing owned Adapter and only the project-local SDK declarations/source needed for the production lazy facade.

Before editing, return a fourteen-row root-cause/fix/evidence matrix. Confirm the starting SHA, one-file scope, no contract blocker, and final budget. Any genuine contradiction stops as `CONTRACT_DRIFT_TASK_005_REVISION_001`.

## Frozen Fourteen-gap Revision Contract

### 1. Open-session model error precedence

For a closed `openSession` envelope whose required `model` is missing/null/malformed/ambient, return sanitized `MODEL_UNAVAILABLE` before generic envelope `PROTOCOL_FAILURE`. Unknown envelope fields, missing tool arrays, or other shape defects remain their approved protocol/tool-policy errors. No SDK factory/facade effect may occur for invalid open input.

### 2. Invalid unsubscribe construction result must quiesce

If `subscribe(listener)` returns a non-function, fail with `PROTOCOL_FAILURE` before `setActiveTools` or prompt. The already-created facade must still be closed exactly once through `abort -> waitForIdle -> dispose`; there is no unsubscribe call because no callable unsubscribe exists. Do not leave a live facade or retry construction.

### 3. Facade/model result classification

For `getActualModel()`:

- missing/null/non-object/non-frozen/extra-field/wrong field type is `PROTOCOL_FAILURE`;
- only an exact frozen closed `{provider,model_id}` identity that differs from the requested identity is `MODEL_EXECUTION_FAILED`.

Apply the same structural-before-value rule to all facade statuses. No raw cause or identity value appears in the error.

### 4. Validate the prompt result, not its declaration form

Remove all `AsyncFunction`, `constructor.name`, source, prototype, and identity checks from facade construction. Call `prompt` once, verify its immediate return is Promise/thenable behavior before awaiting it, then validate the awaited frozen closed `{settled:true}` status. A synchronous plain status is `PROTOCOL_FAILURE` followed by exact failure quiescence. A normal function returning the approved Promise is valid.

### 5–8. Complete terminal sequence and late-event closure

For both turns, success requires exactly one final assistant `message_end(stop)`, then exactly one `agent_end(willRetry:false)`, then exactly one `agent_settled`, with the prompt status accepted only after the complete sequence. Missing any stage is `PROTOCOL_FAILURE`.

After `agent_settled`, atomically close event/result admission for the turn before accepting the prompt result. Any synchronously delivered post-settlement final/tool event records a protocol/tool-policy failure and prevents success. Do not reset, replace, or lose the per-turn failure flag during prompt settlement, cleanup, or phase transition.

### 9–10. Non-frozen and extra actual-model identity

Close the two explicit structural variants under item 3. Both must quiesce and return `PROTOCOL_FAILURE`, not `MODEL_EXECUTION_FAILED`.

### 11–12. Cancellation wins races

Once cancellation closes admission, the in-flight Discovery promise rejects `CANCELLED` even if its facade prompt later resolves/rejects. The in-flight Execution promise and translated tool callback also reject `CANCELLED`, not `TOOL_POLICY_VIOLATION` or generic model failure, when the session/cancellation signal is already cancelled.

Recheck cancellation before and after each awaited prompt/business callback and before mapping a caught error. Preserve the exact single sequence `unsubscribe -> abort -> waitForIdle -> dispose`; late events/results are discarded and no second cleanup/effect occurs.

### 13–14. Production-default pre-prompt cancellation

Fix the production facade unsubscribe closure so its zero-argument check observes the unsubscribe call's own arguments rather than a captured outer `subscribe` argument. A normal zero-argument function or equivalent closed implementation is required.

Both production-default lazy open/cancel leaves must return the exact idempotent session cancellation acknowledgement with zero auth/model/session files and without realizing `ModelRuntime`, `AgentSession`, credentials, provider, or network.

## Retained Requirements

All 78 already-GREEN leaves remain mandatory, including:

- exact export/surfaces and closed construction request/policy;
- complete injected offline Discovery/Execution happy path;
- translated three-tool ordering, correlation, settlement, and bounded outputs;
- all corrected causal admission assertions;
- non-frozen/extra status and post-dispose method closure;
- zero deadline and invalid deadline fail-closed behavior;
- terminal phase re-entry rejection and idempotent completed cancel;
- production lazy readiness/isolation and sanitized no-leak failures.

Do not regress any of them to fix the fourteen RED leaves.

## Write Risk and Validation Budget

Write risk remains medium and contained to one Adapter module. Tests use only deterministic in-memory facade behavior and production-default pre-prompt cancel. No real Pi prompt/session, credential, provider/model, network, persistent session, global config, install, or ambient filesystem effect is authorized.

Allowed before final target:

- any number of `node --check adapters/agent-pi/local-analysis.mjs` syntax checks;
- narrow read-only/static inspection;
- no helper, partial/equivalent target, unit/TASK-003/TASK-004/TEST-XCLI-013/TEST-XCLI-021/E2E/full-suite/build/install/runtime probe.

One new final focused budget `1/1`:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected: exactly `92 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo`.

If it fails, make no post-failure edit or rerun and return `REVISION_SCOPE_ESCALATION_TASK_005_R1` with the retained complete failure output/root causes. Controller alone may authorize another revision.

## Return

Return:

- fourteen-row pre-edit matrix and no-blocker conclusion;
- changed source locations for each correction class;
- syntax/static evidence;
- exact focused counts and budget `1/1`;
- confirmation that all 92 leaves scheduled and the prior 78 stayed GREEN;
- one-file scope and no forbidden writes/effects confirmation;
- no real Pi session/credential/provider/model/network/persistence/retry/raw leak confirmation;
- `TASK_005_READY_FOR_CONTROLLER_REVIEW_R1`, `REVISION_SCOPE_ESCALATION_TASK_005_R1`, `CONTRACT_DRIFT_TASK_005_REVISION_001`, or `ROUTING_ESCALATION_REQUIRED_TASK_005_R1`.

Do not start TASK-006 or Validator.
