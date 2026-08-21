# TASK-005 Spec Clarification — Executable Runtime Deadline Boundary

Status: **FROZEN FOR SPEC REVISION**  
Controller: Codex  
Date: 2026-08-20

## Trigger and Second-Return Self-Audit

The second TASK-005 Test return is not accepted. It schedules 12 Adapter leaves and obtains a clean missing-module RED, but several leaves still claim a matrix while exercising only one mutation:

| Claimed leaf | Actual assertion observed by Controller | Missing executable constraint |
|---|---|---|
| factory/facade closed surface | injected factory throws once; empty facade once | malformed method/status/async/unsubscribe/listener/post-dispose cases |
| terminal-event mutations | only `agent_end.willRetry=true` | missing/reordered/duplicate/late terminals, wrong role/stop reason, malformed/multiple final JSON, compaction/continuation |
| tool/correlation mutations | only first start event changes tool name | order, duplicate/correlation/args/start-end/error/settlement/late cases and proof of zero unapproved descriptor admission |
| actual-model/redaction | only one wrong-model value | construction/turn checkpoints and raw event/result/error leakage cases |
| listener/facade no-retry | only empty facade | listener throw, wrong statuses, prompt failure, exact retry/effect counts |
| cancellation/timeout quiescence | only pre-prompt cancel twice | in-flight prompt/tool cancellation, late completion rejection, timeout, ordered unsubscribe/abort/idle/dispose |
| session phase closure | execute-before-Discovery then cancel | second Discovery, repeated Execution, after completed/failed/cancelled, exact no-new-prompt/tool counts |

The Test role therefore demonstrated scheduling but not the frozen semantic matrix. More importantly, the timeout omission exposed a real Design gap rather than a Test-only mistake: product Application supplies `deadline_seconds=300`, but the Agent Runtime contract does not define an executable immediate-deadline boundary. Waiting 300 seconds is not a bounded deterministic test, and adding a clock/fault argument would expand the production seam.

No production implementation has started. The existing first and second RED results remain historical evidence only. Controller rejects another same-shape Test revision or silent retry.

## Exact Spec Clarification Requested

Revise only `design.md` and `test-plan.md` unless `tasks.md` requires one strictly corresponding wording correction. Preserve all Requirements, AC/Test/Task IDs, product behavior, dependency stack, SDK seam, model, and path ownership.

Freeze the Agent Runtime Execution deadline as follows:

1. `session.execute({confirmed_contract,cancellation_signal,deadline_seconds})` requires an integer `deadline_seconds` in the closed range `0..300`.
2. Product Application continues to supply exactly `300`; this clarification does not change the personal-Profile budget.
3. A test-owned direct Agent Runtime Port call may supply exactly `0`. It means the total Execution deadline is already exhausted after successful Discovery and before any Execution prompt or tool admission.
4. `0` returns sanitized `TIMEOUT` only after closing admission, unsubscribing acceptance, calling the facade's idempotent `abort()`, awaiting `waitForIdle()`, and disposing once. No Execution prompt, tool callback, model result, retry, or late event is accepted.
5. Missing, null, non-integer, negative, above `300`, or unknown input fields fail closed as `PROTOCOL_FAILURE` before a prompt/effect. Do not default a missing value to `300` inside the Adapter contract.
6. This direct zero-boundary is the only fast timeout seam. Do not add injected clock/timer/sleep/fault/test-mode options to the Adapter, facade, business Port, Product Core, Application, or Profile.
7. TEST-XCLI-006 must independently prove this zero-deadline quiescence. TEST-XCLI-015 may later prove the Application supplies the real `300` budget and owns the end-to-end timer/cancellation path.

Also correct any Test Plan wording that permits one broad label to stand in for a negative matrix. Each distinct terminal, tool/correlation, facade-result, failure-mapping, cancellation/timeout, and session-phase class must have mutation-sensitive executable evidence; parameterized top-level leaves or named `t.test` subtests are acceptable if each schedules and reports independently.

## Scope and Evidence

- Allowed writes: `openspec/changes/xanthil-cli-local-analysis-slice/design.md`, `test-plan.md`, and only if strictly needed `tasks.md`.
- Forbidden: tests, production, manifests, dependencies, node_modules, board, verification, traceability, Proposal/Spec Requirements, global Pi, credentials, network, and model calls.
- Inspect only project-local Pi declarations/implementation as read-only evidence.
- Return exact changed paragraphs, ID/fence/scope checks, SHA-256, and `SPEC_READY_TASK_005_DEADLINE` or `SPEC_CONFLICT`.
- Do not dispatch Test/Worker/Validator.
