# Test Plan: Mode Activation

## Evidence Level

R3 negative-first evidence is required. Deterministic repository tests precede host effects. Host canaries run only after TDD_READY, repository GREEN/regression, exact Candidate freeze, external prerequisites, backup, and explicit administrator approval. Activation canaries SHALL NOT submit a production-valid DISPATCH, occupy Global WIP, add a Canary interface, or directly invoke a production adapter. Only the named `CAN-MA-07/08` production-positive effects are deferred to the separately authorized first real product Change.

## Commands to Freeze at Test Design

The Test role must freeze exact absolute Node/Git/Codex executables, cwd, argv arrays, admitted environment, timeout, expected count, and subject SHA. Intended command families are:

```text
node --test tools/harness/change-coordinator/cli.test.mjs
node --test tools/harness/change-coordinator/mode-activation.test.mjs
node --test tools/harness/change-coordinator/git.integration.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
```

The fresh Test role may write only `mode-activation.test.mjs` and `git.integration.test.mjs`. `cli.test.mjs` is unchanged regression-only. The Foundation `coordinator.test.mjs` and fixtures are frozen regression-only and are not allowed Test write paths.

The historical pre-repair `mode-activation.test.mjs` SHA-256 is `3155bbad4eddad0015dc10529f6744c4dd1bfd6a272d248e51bb6a5b997d7442`. It belongs to rejected Candidate `10ba759eefe3d4ff3bae08d5775882e28422fad8` and does not prove the bounded repair. A fresh Test role must freeze new hashes after establishing exactly these two, and no additional, causal RED causes:

| RED cause | Required failing observation | AC / Canary / Task mapping |
|---|---|---|
| `RED-MA-GIT-RUNTIME-ACL` | installer cannot prove unchanged Git/library bytes are executable by real UID `501` through every ancestor with search/execute-only ACLs, complete backup/readback/rollback, and no listing/write/ownership or root-Git substitution | `AC-MA-005-01..03`, `AC-MA-007-04..05`; `CAN-MA-14`; `MA-TASK-012`, `MA-TASK-014` |
| `RED-MA-LOCAL-REF-CANDIDATE` | production branch transport can push without first proving exact local `refs/heads/<branch> == Candidate`, exact remote predecessor, and post-push remote `== Candidate` | `AC-MA-005-04`, `AC-MA-006-02..03`; `CAN-MA-06..07`; `MA-TASK-012`, `MA-TASK-016` |

## Closed Preconditions and Regression-only Evidence

| Boundary | Current disposition | Required regression evidence |
|---|---|---|
| Foundation repository identity | `GREEN`, not causal RED and not a `coordinator.mjs` task | canonical spec `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`; `coordinator.mjs` `4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55`; `coordinator.test.mjs` `de93ab87043ff945f4759e4854f52b80429bc1bdc327784ae7623f56440b4696`; fixtures `48b1265a4d8c15179c8b9f2384d5f0d9477a877a61176ff79816f43c354b83d8`; focused `180/180` PASS; canonical runner exit `0`; TAR PASS; exact same-process `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` plus independent `config.github_repository == 'gadfly-hbo/JuanerAI'` |
| Mode Activation bootstrap archive | Controller mechanic after first PR review, not production RED or Worker implementation | static contract/path regression proves exact MacBook-owned active-to-archive/canonical move and same-PR descendant; no Foundation REVISION, active pointer, DISPATCH, Mac mini archive, or archived-history rewrite |

## Fourteen Activation Canaries

| ID | Required positive evidence | Required negative/forbidden-effect evidence |
|---|---|---|
| `CAN-MA-01` | installed current-key/trust readback plus mathematical verification that the Controller signature matches exact inert canonical bytes, without calling Foundation admission | a forged signature submitted through the fixed host path rejects before pointer/State/Ledger/Worktree/PR; deterministic tests cover expired, replay-conflicting, wrong-scope/state, unknown, revoked, rotation-overlap, and post-revocation negatives without production WIP |
| `CAN-MA-02` | deterministic Foundation tests prove a canonical non-Foundation product Change ID reaches pointer-first READY admission and that product IDs are not Foundation-special-cased; production positive admission is deferred | deterministic WIP tests prove a second Change while pointer non-null rejects without pointer/State/Ledger/Worktree or cross-Change effects |
| `CAN-MA-03` | Worktree create/reuse reads exact baseline, branch, common Git-dir, clean status, and scope | wrong/dirty/extra path blocks before Agent/Candidate |
| `CAN-MA-04` | host launches only exact AGENT_ACTION and returns STARTED/RESULT with matching child/artifact hashes | route/hash/sandbox/path mismatch and parent substitute do not advance |
| `CAN-MA-05` | Foundation alone performs Git/Ledger/validation/PR/Handoff mechanics | host settlement cannot submit mechanical receipts or duplicate an effect |
| `CAN-MA-06` | exact local `refs/heads/<branch>` equals Candidate before push, remote predecessor equals `expected_remote_head`, post-push remote branch equals Candidate, and Validator/PR/Handoff bind the same SHA | local-ref, predecessor, post-push, Validator, PR, or Handoff drift blocks before push or freeze/Handoff through existing boundaries |
| `CAN-MA-07` | mandatory Foundation regression proves same-process verified `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` and production independently proves `config.github_repository == 'gadfly-hbo/JuanerAI'`; installed purpose bindings, verified deploy-key/ruleset metadata, structural negatives, and reliable permission metadata or a deterministic no-merge-side-effect method prove PR no-merge authority; product-branch push/readback and PR create/update/readback are deferred to the first authorized real product Change | config/State/`change_id` cannot supply signed repository authority and restart without accepted authority blocks; never call merge on a real product PR; deploy key push-main, cross-use, Agent/CLI exposure, approve/close/delete/Issue/Project/other repo/force/delete paths reject; any deferred-result absence, ambiguity, conflict, or mismatch is BLOCKED with no Acceptance |
| `CAN-MA-08` | deterministic append-only/contiguous/identity safety passes before Activation-ready; production Evidence Ref append and exact remote bytes/hash readback are deferred to the first authorized real product Change | hash/predecessor/path/readback conflict stops; no false durable BLOCKED on Ledger outage; any deferred-result absence, ambiguity, conflict, or mismatch is BLOCKED with no Acceptance |
| `CAN-MA-09` | exact signed `AWAITING_CONTROLLER` REVISION returns same Change/Worktree to TEST_RED | wrong Candidate/scope/evidence/state/hash rejects effect-free |
| `CAN-MA-10` | automatic repair and ordinary product-Change PR/archive REVISION create descendant Candidates; Mode Activation's MacBook bootstrap archive independently creates its descendant on the same branch/PR | bootstrap Foundation REVISION/active pointer/Mac mini archive, baseline re-parent, non-FF, replacement PR, or historical evidence overwrite blocks |
| `CAN-MA-11` | STARTED, RESULT, START_FAILED, and INTERRUPTED match canonical variants | old enums and `NOT_STARTED` settlement reject; Coordinator-only NOT_STARTED requires no REQUESTED/action |
| `CAN-MA-12` | first same-scope Validator FAIL obtains causal RED, Worker fix, new Candidate, and second verdict | second FAIL or boundary ambiguity enters BLOCKED and does not reset repair budget |
| `CAN-MA-13` | after first PR review MacBook mechanically archives/publishes byte-exact Mode Activation bytes in a new same-PR descendant without Foundation REVISION or active pointer; accepted later product RELEASE performs clean ff-only sync, CLOSED, pointer-clear-last | no initial archive, Mac mini/bootstrap REVISION/bootstrap pointer, autonomous product archive/Acceptance/merge/RELEASE, dirty/non-FF/wrong archive refs reject |
| `CAN-MA-14` | D1-A Reviewer guard, fixed Handoff, Controller-selected Remote route, exact signed repository/origin/fixed CLI, envelope SHA-256, service restart, complete Git/library ancestor ACL backup/readback/rollback, real UID `501` Git `2.54.0`/SHA execution, dual raw-byte diff hash, missing-output authority readback, and final stop Gate all read back | Git/library byte rewrite, `install_name_tool`, root-Git substitution, directory listing/write/ownership grant, extra Reviewer/role, transport-as-business-evidence, SSH outside install/rollback/emergency/explicit backup, raw secret log, missing authority default, automatic Remote retry/replay, evidence deletion, automatic next Change, or rollback ambiguity fail closed |

`CAN-MA-01` and `CAN-MA-02` replace any requirement for Activation to accept a disposable valid production DISPATCH. The prior real-signed admission-precondition rejection canary is retired as inconclusive and SHALL NOT be retried: it intentionally produced no pointer, State, or Ledger fact, so lost Remote output cannot prove the rejection reason.

If Remote output is missing, the Controller reads existing pointer, State, Ledger, and when applicable PR. An admitted Change continues from durable state; clearly not admitted permits only a new explicit Controller decision; conflict or inconsistency is `BLOCKED`. Remote is a best-effort courier, not a message bus, exactly-once authority, receipt/outbox/queue/replay platform, or business-evidence authority. SSH remains limited to install, rollback, emergency diagnosis, or explicit backup submission.

## Deferred First-product Positive Evidence

The deferral is closed to exactly three effects: Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback. The separately user-authorized first real product Change exercises them only through the existing Foundation/Host Loop lifecycle after durable admission. No direct adapter call, one-off canary gateway, alternate credential path, or disposable Change is allowed. Every effect must read back its exact existing identity; unavailable, ambiguous, conflicting, or mismatched evidence is `BLOCKED` and forbids Acceptance. No other Canary obligation is deferred.

PR no-merge authority is not deferred. Before Activation-ready it must be proved through reliable permission metadata or a deterministic method with no merge side effect; no real product PR merge endpoint may be called.

## Test Asset Retirement Ledger

At TDD_READY, classify:

- `tools/harness/change-coordinator/mode-activation.test.mjs`: writable permanent R3 regression owner for the Git runtime ACL closure plus unchanged trust/host/bootstrap-contract policy.
- `tools/harness/change-coordinator/git.integration.test.mjs`: writable permanent owner for local-ref/Candidate binding plus retained Git `2.54.0`, raw-byte, configuration-isolation, and restricted publication regression.
- `tools/harness/change-coordinator/cli.test.mjs`: unchanged permanent CLI/transport/bypass regression owner.
- `tools/harness/change-coordinator/coordinator.test.mjs` and `fixtures.mjs`: frozen Foundation repository-identity regression; no Test edit.
- Runtime-generated keys, tokens, temporary repositories, sockets, logs, install roots, and canary commands: temporary evidence under an approved temporary root, never tracked.

After GREEN for exactly the two frozen RED causes and complete regression, the Controller reconciles the complete Test diff, runs `ponytail-review`, checks retained consumers and distinct risk ownership, scans `skip/todo/only/temp/scratch/correction`, removes every temporary/duplicate/orphaned asset, reruns affected commands, and records PASS/FAIL. Validator independently repeats the audit. No next final implementation Candidate is created before `MA-TASK-012`, `014`, `015`, `016`, and `017` evidence is complete; `MA-TASK-013` executes only after first PR review.

## Evidence Integrity

Every result binds test/canary ID, repository Candidate SHA, configuration and command-definition SHA-256, host identity, executable version/hash, sanitized stdout/stderr hash, exit/signal/timeout, start/end time, and relevant Candidate/PR/Ledger/Handoff refs. Real secret bytes and raw prompts/output are excluded. Remote output is only best-effort transport observation and does not require or authorize a new transport receipt schema. Historical FAIL/INTERRUPTED evidence remains immutable; `verification.md` is only the current read model.
