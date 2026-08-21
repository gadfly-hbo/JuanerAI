# TASK-005 Test Correction 002 — Final Approved Mutation Closure

Status: **FROZEN — USER-APPROVED FINAL TEST CORRECTION**  
Controller: Codex  
User decision: `XCLI-TASK005-TEST-OVERRIDE-001` approved  
Date: 2026-08-20

## Authority and Stop Line

The user explicitly authorizes one and only one fresh Terra/high Test correction after `REPLAN_BLOCKED_TASK_005`. This overrides the exhausted automatic Test routing/final-command budget only for the exact 20 missing mutation leaves below.

This does not authorize production implementation, a TDD waiver, new product behavior, a contract or seam change, manifests/dependencies, real Pi session creation, credential access, network/provider/model calls, global Pi/config changes, other tests, Validator, acceptance, or archive.

No further automatic Test correction is authorized. If this correction does not return the exact healthy RED below, stop and return to the Controller.

## Preserved Baseline

Preserve the existing 72 scheduled TASK-005 leaves exactly:

- one full-lifecycle test-owned helper-health PASS;
- 55 TEST-XCLI-006 Adapter leaves;
- 16 TEST-XCLI-011 production-default lazy-readiness leaves.

The accepted historical command result is `72 total / 1 PASS / 71 RED`, with every RED caused only by missing `adapters/agent-pi/local-analysis.mjs`. Do not weaken, delete, merge, relabel, skip, or replace these leaves. Do not rerun that historical command before the correction is complete.

The public seam remains `createPiAgentAnalysisRuntime` and the frozen optional `{sdkSessionFactory}` boundary. Test-only scenario controls remain under `tests/fixtures/xanthil-local-analysis/**` and never become production options or implementation-coupled inspection APIs.

## Exact 20 New Top-Level Leaves

Register each case as its own top-level `test(...)` at module evaluation before any Adapter import. Each title names only its actual mutation. Each body must exercise the public Adapter seam, assert the exact sanitized result, assert relevant effect counts, reject raw cause leakage, and remain mutation-sensitive.

### A. Non-frozen required facade results — 6 leaves

Return the otherwise exact required result as a non-frozen object for each method independently:

1. `setActiveTools -> {active_tool_names}`;
2. `prompt -> Promise<{settled:true}>`;
3. `getActualModel -> {provider,model_id}`;
4. `abort -> Promise<{aborted:true}>`;
5. `waitForIdle -> Promise<{idle:true}>`;
6. `dispose -> {disposed:true}`.

Each must map to sanitized `PROTOCOL_FAILURE`; it may not be accepted because its field values happen to be correct. Cleanup/effect counts must match the frozen failure point and no automatic retry occurs.

### B. Extra-field facade results — 6 leaves

Return the otherwise exact frozen result with one unknown field for each method independently:

1. `setActiveTools` extra status field;
2. `prompt` extra status field;
3. `getActualModel` extra identity field;
4. `abort` extra status field;
5. `waitForIdle` extra status field;
6. `dispose` extra status field.

Each must map to sanitized `PROTOCOL_FAILURE` with exact no-retry/cleanup counts. One method is not representative of another.

### C. Non-dispose calls after disposal — 6 leaves

After the facade has been disposed, independently attempt exactly one of:

1. `subscribe`;
2. `setActiveTools`;
3. `prompt`;
4. `getActualModel`;
5. `abort`;
6. `waitForIdle`.

The test-owned facade must fail closed without an SDK/provider effect, second session, accepted event/result, or raw cause. Repeated `dispose` remains the already-frozen sole allowed post-disposal method and is not a new mutation leaf.

These cases test the facade contract through the Adapter construction boundary; do not expose the raw facade as a production result or add a production `inspect*` method. The scenario driver may arrange the post-disposal call and surface its violation to the Adapter as a deterministic protocol failure.

### D. Tool settlement and terminal closure — 2 leaves

1. Emit `tool_execution_end` before the translated business callback promise settles. Assert `TOOL_POLICY_VIOLATION` or the exact approved protocol mapping, zero acceptance of the premature result, ordered cleanup, no retry, and no successful Execution result.
2. Resolve a held business callback only after terminal admission has closed. Assert the late callback/result is discarded, cannot emit an accepted tool result or Finding, cleanup occurs exactly once, and the returned outcome is the approved sanitized cancellation/protocol result without raw leakage.

The body must actually hold/release the callback promise around the relevant event/terminal boundary. A reordered event without a held callback, or a title without an observed late completion, does not satisfy either leaf.

## Exact Expected RED

After adding exactly these 20 leaves, the final focused inventory must be:

- total TASK-005 leaves: `92`;
- helper PASS: `1`;
- Adapter RED: `91`;
- fail root: only `ERR_MODULE_NOT_FOUND` for `/Users/huangbo/JuanerAI/adapters/agent-pi/local-analysis.mjs`;
- skipped/cancelled/todo: `0/0/0`.

Because the Adapter is absent, every new Adapter leaf must still schedule before its body-level module load fails. If the count is not exactly 92, the correction has drifted and must stop.

## Ownership

Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`;
- focused test-private helpers under `tests/fixtures/xanthil-local-analysis/` if strictly needed;
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`;
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs` only if required to preserve/repair the existing 16 TEST-XCLI-011 leaves; no new TEST-XCLI-011 behavior is requested.

Every other path is forbidden. The Test role is not alone in the shared worktree and must not revert or overwrite unrelated work.

## Validation Budget

- Syntax checks on changed test `.mjs`: any number.
- One focused helper-health execution after edits.
- One final focused RED execution only:
  - `node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No partial/equivalent final-target probes, no prior-final rerun, no TEST-XCLI-021 or unrelated regression/full suite, no install, production execution, real SDK session, credential read, network, or model call.

Before the final command, statically report the preserved `72` plus exact new `6+6+6+2` top-level leaf inventory and confirm all 92 register before Adapter import. Consume the final command only after that checkpoint is internally satisfied.

Return `TDD_READY_TASK_005_CORRECTION_002` only with exact syntax/helper/final counts, per-category leaf titles, single-root RED evidence, scope evidence, and zero forbidden effects. Otherwise return `FINAL_TEST_CORRECTION_BLOCKED_TASK_005`. Do not start Worker or Validator.
