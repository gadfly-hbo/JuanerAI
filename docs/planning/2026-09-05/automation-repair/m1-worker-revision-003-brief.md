# M1 / B0 — Worker Revision 003

## TDD_READY and authority

Post-denial authorization, 2026-09-05: Controller informed the user that the proposed two-file patch changes validation admission/rejection order and that policy had denied the first write under the earlier read-only restriction. Controller explicitly requested lifting that restriction for the five existing private checks with the temporary terra/high Worker and frozen Test. User replied “同意授权”. This current informed approval authorizes retrying that exact bounded patch with the same Worker003, followed by the frozen validation commands. It supersedes the earlier read-only restriction only within this brief, not for external actions or broader files. S03 remains open until actual write and379 GREEN; the denial remains historical evidence.

2026-09-05 current user “批准” approves the Controller request to publish renewed TDD_READY bound to Test SHA below and one temporary terra/high Worker limited to the existing two production files. Controller releases `TDD_READY` now. This is new authority, not replay of WR002 or Test010 approval.

Spec Gate: [Gate 001](reviews/m1-spec-gate-001.md). Test Gate: [010](reviews/m1-test-correction-010-gate.md), independently reproduced 379 = 322 PASS / 57 causal RED, original279 all PASS; Readiness and pre-Worker asset review PASS. Main route [MASTER_PLAN](MASTER_PLAN.md) M1/B0; next acceptance is 379 GREEN, then affected regression/canonical/post-GREEN Retirement. B0 remains open.

## Workspace and frozen inputs

Work only in `/private/tmp/JuanerAI-coordinator-worktree-validation-execution-boundary`.
Branch work/macbook/change-coordinator-worktree-validation-execution-boundary; HEAD `33f04a35d13abe64f4394d54eec166b58cb44716`; index empty.
Read AGENTS.md and applicable governance, the complete current Change proposal/design/delta spec/test-plan/tasks, Test Gate 010 and the relevant source/Test before editing. Formal approved contract governs; do not infer from historical release text.

- Frozen Test: tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs; SHA `4dafee2331a10a53c370d75fc217914352d089267d0b9354b1d5b7596e890f98`; 1593 lines /132605 bytes.
- snapshot preimage SHA `43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0`.
- production preimage SHA `757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc`.
- Controller preimages and scope inventory: `/private/tmp/juanerai-worker003-controller.LfF46O`.

## Worker ownership and limits

You are not alone in this worktree. Preserve all preexisting changes and other agents' edits. Controller owns planning, verification, traceability and project-control. You own edits ONLY to:
1. tools/harness/change-coordinator/worktree-snapshot-contract.mjs
2. tools/harness/change-coordinator/production.mjs

No Test/fixture/helper/spec/board/config/dependency or third production file edits. No Git stage/commit/push/merge, remote effects, installs, live provider/model, real product DISPATCH, or agent delegation. Temporary execution logs under a unique /private/tmp directory are allowed. Use apply_patch for edits.

Implement only the approved five private admission fixes indicated by the 57 exact REDs in Test Gate:
- L1 closedArray: executing-realm Array.prototype, dense own enumerable data indices and built-in nonenumerable data length qualification before methods/iteration/item use; retain frozen/readonly positives and existing scope/item/size behavior.
- L2 closedStringArray: same prototype qualification before existing descriptor/item/method consumption.
- validateDefinition: primitive string cwd before path.isAbsolute; preserve existing absolute/containment contract, no new lexical/length constraint on cwd.
- validWorktreeSubject: primitive string head_sha before regex/serialization.
- private validSubjectPath: existing string/absolute/NUL/UTF8 length contract plus lexical-normal root rules, "/" valid, otherwise no trailing/repeated slash or dot/dotdot segments, before real identity handling.

No changes to shared closed(), other gateways, public shape, receipt/hash, timeout/environment, Candidate/Final Validation/L3. SIGKILL single-winner wait-close-post-snapshot behavior stays untouched. No coercion/normalization workaround, architectural abstraction or redesign.

If a frozen Test seems invalid or scope/contract change is needed: freeze production, return evidence to Controller; do not edit tests, silently widen scope, or dispatch another role.

## Route and evaluation

Boundary Change / R2 retained: low-level validation tool admission and safety boundary. Current configured juaner_worker is terra/medium; tool cannot override that custom role. Current user specifically permits temporary default-role instance gpt-5.6-terra / high, bounded context, same Worker isolation/write scope. Duration one WR003, rollback to configured terra/medium when complete; no config edits, no authority to reuse for Validator.

Evaluation: minimum two-file diff; exact frozen Test identity; 379 unique GREEN leaves (0 fail/skip/todo/cancel), including all negative postconditions and true-child timeout cases, not merely count.

Run focused with explicit TAP, command-local PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin and XANTHIL_REAL_PI_ACCEPTANCE unset:
`/Users/huangbo/Dev/Env/homebrew/bin/node --test --test-reporter=tap tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs`.
Keep full stdout/stderr and exit status in unique temporary evidence directory; don't overwrite RED history.

After focused GREEN, stop writes and return paths, hashes, diff summary, exact command/counts, logs, and any limitations. Controller independently runs frozen focused + full tools/harness/change-coordinator/*.test.mjs + both project-board tests + tools/harness/validation/run + diff/scope and post-GREEN Retirement before fresh Validator. Do not claim B0 or full chain complete.
