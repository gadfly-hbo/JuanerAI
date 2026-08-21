# TASK-005 Test Replan 001 — Mutation-Sensitive Pi Adapter RED

Status: **FROZEN FOR FRESH TEST ROLE**  
Controller: Codex  
Date: 2026-08-20

## Gate and Route

- TASK-005 revised Spec Gate and Runtime deadline clarification: PASS.
- The first Test return had only broad happy-path leaves. Revision 001 scheduled categories but still implemented one representative mutation behind each broad title. Neither return is accepted as TDD_READY.
- The Controller completed the required second-return self-audit in `spec-task-005-deadline-clarification.md` and rejected another same-context repair.
- Fresh Test context required. Classification remains R2/complex; route is upgraded once from the configured medium run to `gpt-5.6-terra` high because the observed failure is reasoning/coverage insufficiency, not missing authority.
- This is the single automatic route upgrade for TASK-005 Test Design. A failed replan returns to Controller; it does not silently retry or escalate again.

## Ownership

Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`;
- focused test-private helpers under `tests/fixtures/xanthil-local-analysis/` if needed;
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`;
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`.

Forbidden: production, every OpenSpec file, manifests/lock/node_modules, other tests, board, credentials, global Pi/config, network/provider/model calls, real SDK session, and all other paths. Preserve all accepted non-TASK-005 assertions and the existing Test-owned work unless this replan must correct it.

## Required Test Architecture

Build one test-owned scenario driver that can emit an explicit valid lifecycle or one named mutation and records factory/facade/prompt/tool/callback/cleanup/late-admission effects. It is a deterministic construction dependency only, never a fake provider or production option.

Register mutation cases as independent top-level `test(...)` leaves, typically through case arrays defined before module loading. Do not create subtests only after importing the absent Adapter: every intended leaf must be scheduled during RED and independently appear in the test count. A leaf title names exactly the mutation it performs; no title may claim a class or list that its body does not mutate and assert.

Each negative leaf must assert:

- the exact sanitized result/code;
- the relevant prompt/tool/callback/retry/cleanup counts;
- zero forbidden admission/effect;
- no raw cause/credential/provider/SDK/install-path leakage.

## Minimum Independent Leaf Inventory

Preserve one full Discovery+Execution helper-health leaf and one exact happy-path Adapter leaf. Add at least these independently scheduled Adapter mutations:

### Factory and facade

1. factory rejects with a raw secret-bearing cause -> `MODEL_UNAVAILABLE`, one factory call, no retry/leak;
2. facade missing one required method;
3. facade has an extra method;
4. facade or required returned status is non-frozen;
5. non-function unsubscribe or listener non-`undefined`/throw;
6. wrong `setActiveTools` status;
7. wrong `prompt` status or sync/async shape;
8. wrong/extra `getActualModel`, `abort`, `waitForIdle`, or `dispose` status, with the mutated method named by the leaf;
9. a non-dispose call after disposal.

Parameter arrays may generate one top-level leaf per method/status mutation; one method cannot stand in for all seven.

### Terminal lifecycle

Independently mutate at least:

1. missing `message_end`;
2. assistant message with wrong role;
3. wrong stop reason;
4. malformed final JSON;
5. duplicate/multiple final assistant result;
6. missing `agent_end`;
7. `willRetry:true`;
8. missing `agent_settled`;
9. reordered terminal events;
10. post-settlement late final event;
11. compaction or queued-continuation/retry activity.

### Tool policy and correlation

Independently mutate at least:

1. any Discovery tool event;
2. unknown tool name;
3. approved tools reordered;
4. duplicate tool call;
5. duplicate or empty correlation ID;
6. non-empty arguments;
7. start/end call-ID or tool-name mismatch;
8. `isError:true`;
9. tool end before translated callback settles;
10. tool event or callback completion after terminal closure.

For every pre-admission mutation, explicitly prove the corresponding business descriptor was not invoked.

### Model, failures, cancellation, timeout, and phases

Independently cover:

1. wrong actual model after Discovery;
2. wrong actual model after Execution;
3. prompt/turn rejection with raw cause -> `MODEL_EXECUTION_FAILED`, no retry/leak;
4. listener/protocol failure -> `PROTOCOL_FAILURE`, no retry/leak;
5. in-flight Discovery prompt cancellation with late event rejection and ordered cleanup;
6. in-flight Execution tool cancellation with late callback/result rejection and ordered cleanup;
7. after successful Discovery, exact `deadline_seconds:0` -> no Execution prompt/tool, `unsubscribe -> abort -> waitForIdle -> dispose`, each once, then `TIMEOUT`;
8. each invalid Execution deadline/input class from Design -> pre-effect `PROTOCOL_FAILURE`; use independent top-level leaves or one top-level leaf per exact mutation;
9. Execution before Discovery;
10. second Discovery;
11. repeated Execution after success;
12. calls after failed state;
13. calls after cancelled state;
14. cancel after completed remains idempotent without a second dispose.

### Production-default TEST-XCLI-011

Retain separate top-level leaves for:

1. exact lazy positive open/cancel with isolated `PI_CODING_AGENT_DIR` and zero auth/session files;
2. each closed factory-config invalid class;
3. each closed `openSession` invalid class;
4. idempotent pre-prompt cancel and zero persistence.

Do not call `discover`/`execute` on the production-default path and do not claim a Pi session exists.

## Validation Budget and Stop Line

- Syntax checks: any number.
- Focused test-owned helper-health: maximum two executions.
- One final replan focused RED:
  - `node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No equivalent partial final probes, TEST-XCLI-021/unrelated regression/full-suite rerun, install, production execution, real SDK session, credential read, network, or model call.

All helper leaves must PASS. Every declared Adapter leaf must schedule and fail only at the absent `adapters/agent-pi/local-analysis.mjs` seam or missing frozen behavior; zero skipped/cancelled/todo. Before returning, statically compare the actual leaf titles and bodies to this minimum inventory and report the exact per-category counts.

Return `TDD_READY_TASK_005_REPLAN_001`, `TEST_CONFLICT_TASK_005_REPLAN_001`, or `REPLAN_BLOCKED_TASK_005`. Do not start Worker or Validator.
