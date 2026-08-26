# Test Plan: Mode Activation

## Evidence Level

R3 negative-first evidence is required. Deterministic repository tests precede host effects. Host canaries run only after TDD_READY, repository GREEN/regression, exact Candidate freeze, external prerequisites, backup, and explicit administrator approval. Activation canaries SHALL NOT submit a production-valid DISPATCH or occupy Global WIP; the first positive production admission belongs to the separately authorized first real product Change.

## Commands to Freeze at Test Design

The Test role must freeze exact absolute Node/Git/Codex executables, cwd, argv arrays, admitted environment, timeout, expected count, and subject SHA. Intended command families are:

```text
node --test tools/harness/change-coordinator/cli.test.mjs
node --test tools/harness/change-coordinator/mode-activation.test.mjs
node --test tools/harness/change-coordinator/git.integration.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
```

The existing Foundation suite is regression-only and must remain byte/behavior stable; it is not an allowed Test write path.

## Fourteen Activation Canaries

| ID | Required positive evidence | Required negative/forbidden-effect evidence |
|---|---|---|
| `CAN-MA-01` | installed current-key/trust readback plus mathematical verification that the Controller signature matches exact inert canonical bytes, without calling Foundation admission | a forged signature submitted through the fixed host path rejects before pointer/State/Ledger/Worktree/PR; deterministic tests cover expired, replay-conflicting, wrong-scope/state, unknown, revoked, rotation-overlap, and post-revocation negatives without production WIP |
| `CAN-MA-02` | deterministic Foundation tests prove a canonical non-Foundation product Change ID reaches pointer-first READY admission and that product IDs are not Foundation-special-cased; production positive admission is deferred | deterministic WIP tests prove a second Change while pointer non-null rejects without pointer/State/Ledger/Worktree or cross-Change effects |
| `CAN-MA-03` | Worktree create/reuse reads exact baseline, branch, common Git-dir, clean status, and scope | wrong/dirty/extra path blocks before Agent/Candidate |
| `CAN-MA-04` | host launches only exact AGENT_ACTION and returns STARTED/RESULT with matching child/artifact hashes | route/hash/sandbox/path mismatch and parent substitute do not advance |
| `CAN-MA-05` | Foundation alone performs Git/Ledger/validation/PR/Handoff mechanics | host settlement cannot submit mechanical receipts or duplicate an effect |
| `CAN-MA-06` | local Candidate, Validator, remote branch, PR Head, and Handoff all bind one SHA | any one-Head drift blocks before freeze/Handoff |
| `CAN-MA-07` | branch-push deploy key can normally push only the current branch; separate PR API credential with Metadata read, Contents read, and Pull Requests write can create/update/read only the current PR | PR credential merge fails for absent Contents write; deploy key push-main fails under the no-bypass ruleset; cross-use, Agent/CLI exposure, approve/close/delete/Issue/Project/other repo/force/delete paths reject |
| `CAN-MA-08` | Ledger append/readback is exact, append-only, contiguous, and remote-authoritative | hash/predecessor/path/readback conflict stops; no false durable BLOCKED on Ledger outage |
| `CAN-MA-09` | exact signed `AWAITING_CONTROLLER` REVISION returns same Change/Worktree to TEST_RED | wrong Candidate/scope/evidence/state/hash rejects effect-free |
| `CAN-MA-10` | automatic repair, ordinary PR REVISION, and archive REVISION create descendant Candidates and fast-forward the same branch/PR | baseline re-parent, non-FF, replacement PR, or historical evidence overwrite blocks |
| `CAN-MA-11` | STARTED, RESULT, START_FAILED, and INTERRUPTED match canonical variants | old enums and `NOT_STARTED` settlement reject; Coordinator-only NOT_STARTED requires no REQUESTED/action |
| `CAN-MA-12` | first same-scope Validator FAIL obtains causal RED, Worker fix, new Candidate, and second verdict | second FAIL or boundary ambiguity enters BLOCKED and does not reset repair budget |
| `CAN-MA-13` | MacBook-signed archive REVISION produces exact archive/canonical bytes in a new same-PR Candidate; accepted RELEASE performs clean ff-only sync, CLOSED, pointer-clear-last | no initial archive, autonomous mini archive/Acceptance/merge/RELEASE, dirty/non-FF/wrong archive refs reject |
| `CAN-MA-14` | D1-A Reviewer guard, fixed Handoff, Controller-selected Remote route, exact repository/origin/fixed CLI, envelope SHA-256, service restart, backup, rollback, dual raw-byte diff hash, missing-output authority readback, and final stop Gate all read back | extra Reviewer/role, transport-as-business-evidence, SSH outside install/rollback/emergency/explicit backup, raw secret log, missing durable route default, automatic Remote retry/replay, evidence deletion, automatic next Change, or rollback ambiguity fail closed |

`CAN-MA-01` and `CAN-MA-02` replace any requirement for Activation to accept a disposable valid production DISPATCH. The prior real-signed admission-precondition rejection canary is retired as inconclusive and SHALL NOT be retried: it intentionally produced no pointer, State, or Ledger fact, so lost Remote output cannot prove the rejection reason.

If Remote output is missing, the Controller reads existing pointer, State, Ledger, and when applicable PR. An admitted Change continues from durable state; clearly not admitted permits only a new explicit Controller decision; conflict or inconsistency is `BLOCKED`. Remote is a best-effort courier, not a message bus, exactly-once authority, receipt/outbox/queue/replay platform, or business-evidence authority. SSH remains limited to install, rollback, emergency diagnosis, or explicit backup submission.

## Test Asset Retirement Ledger

At TDD_READY, classify:

- `tools/harness/change-coordinator/mode-activation.test.mjs`: planned permanent R3 regression owner for trust/host/gateway/rollback policy.
- `tools/harness/change-coordinator/cli.test.mjs`: retained permanent CLI/transport/bypass regression owner.
- `tools/harness/change-coordinator/git.integration.test.mjs`: retained permanent Git `2.54.0`, raw-byte, configuration-isolation, and restricted publication owner.
- Runtime-generated keys, tokens, temporary repositories, sockets, logs, install roots, and canary commands: temporary evidence under an approved temporary root, never tracked.

After GREEN/regression the Controller reconciles the complete Test diff, runs `ponytail-review`, checks retained consumers and distinct risk ownership, scans `skip/todo/only/temp/scratch/correction`, removes every temporary/duplicate/orphaned asset, reruns affected commands, and records PASS/FAIL. Validator independently repeats the audit.

## Evidence Integrity

Every result binds test/canary ID, repository Candidate SHA, configuration and command-definition SHA-256, host identity, executable version/hash, sanitized stdout/stderr hash, exit/signal/timeout, start/end time, and relevant Candidate/PR/Ledger/Handoff refs. Real secret bytes and raw prompts/output are excluded. Remote output is only best-effort transport observation and does not require or authorize a new transport receipt schema. Historical FAIL/INTERRUPTED evidence remains immutable; `verification.md` is only the current read model.
