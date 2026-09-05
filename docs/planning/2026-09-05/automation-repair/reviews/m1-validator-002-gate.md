# M1/B0 — Validator002 FAIL / Controller disposition

2026-09-05. Current user “批准” authorized one temporary gpt-5.6-sol/high read-only fresh Validator. `/root/wveb_validator_002` actually ran, returned FAIL, and stopped. The temporary routing exception ends here; configured Validator remains sol/medium. No Test/Worker release, Acceptance or integration is granted by this record.

## Verdict and finite finding

Controller accepts **FAIL**, one confirmed High-severity root cause within original B0, demonstrated at three L1 positions. This is not a new product scope or an undecided contract. M0–M4 v1, B1–B5 and completed S01/S02/S03 remain unchanged.

`tools/harness/change-coordinator/worktree-snapshot-contract.mjs:92–101`: `validStat` and `validContent` read `value?.kind` to select expected keys before `closed` validates its descriptor. Approved Design §2.1, line42, requires descriptor inspection before field consumption and zero invocation of rejected accessors. AC-WVEB-001 and AC-WVEB-005 therefore remain unsatisfied.

The valid one-entry control matches an independently constructed V1 hash oracle. Mutating only the enumerable `kind` property into a getter on `before`, `after`, or `content` produces `REJECTED/INPUT_INVALID` but invokes the getter once in each case. Controller read the complete probe source and independently reran it with the same result, including `controlMatchesIndependentOracle: true`. Existing accessor cases at Test lines457/543/580 exercise `sha256` or `ino`, not the schema discriminator. The frozen379 suite consequently misses this contract violation; its PASS is retained, not promoted to acceptance.

- Reproducer: [/private/tmp/juanerai-wveb-validator002.yc0JyI/l1-kind-accessor-probe.mjs](/private/tmp/juanerai-wveb-validator002.yc0JyI/l1-kind-accessor-probe.mjs).
- Result: [l1-kind-accessor-probe.json](/private/tmp/juanerai-wveb-validator002.yc0JyI/l1-kind-accessor-probe.json), SHA256 `b44f2a1998a4ecc922e2f20f11d5730492e47299f8dc499610d82b28fb27d9c4`.
- Reproduce: `/Users/huangbo/Dev/Env/homebrew/bin/node /private/tmp/juanerai-wveb-validator002.yc0JyI/l1-kind-accessor-probe.mjs`.

## Independent verification retained

All suites used command-local PATH `/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin`, with `XANTHIL_REAL_PI_ACCEPTANCE` unset. All exits0, stderr empty; Controller read the complete outputs. Counts overlap and must not be added as unique coverage.

| Command | Actual result | Full output / SHA256 |
|---|---|---|
| `node --test --test-reporter=tap tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs` | 379/379 PASS;0 fail/cancel/skip/todo | [focused](/private/tmp/juanerai-wveb-validator002.yc0JyI/focused.stdout.tap); `760904bfb711722dbf6bfc25019738c53afec2db4d498609e62b259efff24faa` |
| `node --test --test-reporter=tap tools/harness/change-coordinator/*.test.mjs tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs` | 749/749 PASS;0 fail/cancel/skip/todo | [related](/private/tmp/juanerai-wveb-validator002.yc0JyI/related.stdout.tap); `b7519867b4c04fde306d46af5a22ae9e51aba9feb0d42953176cc04300f2573a` |
| `tools/harness/validation/run` | 1411 scheduled;1410 PASS/0 FAIL/1 expected real-Pi skip;0todo | [canonical](/private/tmp/juanerai-wveb-validator002.yc0JyI/canonical.stdout.log); `a988f9979021c03f4aaf215af3627259e04cda5f6e034075e7018cef018bcc00` |
| `git diff --check` | PASS; empty stdout/stderr | evidence directory git-diff-check.* |

Independent source/runtime review also confirmed L2 primitive admission, six-array qualification, lexical-root classification, real worktree collection, both definitions and24-field receipts. C148/N085 passed real resistant-child evidence; source has one timer/child, one timeout-winner SIGKILL, no grace/retry/replacement, and post-snapshot after settlement. Independent NUL-safe tracked+untracked TypeScript5.9.3 consumer inventory parsed20 candidates and found one production import in `production.mjs`.

Test Asset Retirement independently remains PASS as an asset-lifecycle conclusion: original111031-byte prefix intact,379 unique runtime IDs, helpers consumed, no skip/todo/only switch or tracked temporary asset. The missing discriminator cases are a Test Design/correctness gap, not an orphan/deletion finding. Future modified Test assets require their own Retirement recheck.

AC001/005: FAIL as above. AC002/003/004/006: examined component evidence supports their frozen requirements; no other finding returned. This does not imply a passing WVEB verdict or complete delivery chain.

## Frozen scope and Controller post-check

- HEAD `33f04a35d13abe64f4394d54eec166b58cb44716`, branch `work/macbook/change-coordinator-worktree-validation-execution-boundary`, empty index.
- Test `4dafee2331a10a53c370d75fc217914352d089267d0b9354b1d5b7596e890f98`.
- Snapshot `6d9e181923aaf71dfcbb30308468c251020fe7c55717ffacc58a6cd7755bfac0`.
- Production `6ae12f06221694eb29063fa7e01b87e3287ccec60ddaa38b6a8033cc47ba8f05`.
- Validator before/after20/20; Controller independently checked20/20 plus1217 baseline files, zero changed/added, before these post-verdict documentation writes. [Controller post-check](/private/tmp/juanerai-wveb-validator002-controller.i1GcGy/post-check.json); [dispatch manifest](/private/tmp/juanerai-wveb-validator002-controller.i1GcGy/dispatch-package.json).

Validator made no repository/Git mutation. Previous Worker delta remains the approved five checks in two production files. No L3, public Coordinator, State, Ledger, Candidate or Final Validation behavior was added. Original Validator001 FAIL and all historical RED/GREEN remain preserved for their own identities.

## Exact return / complexity stop-line disposition

The concrete cause is schema selection consuming a discriminator before descriptor admission; missed evidence targets non-discriminator fields. This explains the present FAIL without reopening the broad379 audit or inventing a new hostile-input matrix. Existing contract semantics already decide the expected behavior, so no product/architecture redesign is needed.

Record necessary dependency S04 under original M1/B0. Owner Controller→Test→Worker→fresh Validator, each gated. Next bounded decision is permission for Test Design supplementation and exact Test manifest/identity re-freeze, preserving the existing379 bodies/order/assertions; no new IDs/counts are assigned by this report. Minimum production target after causalRED is the two private L1 validators in the existing snapshot module; `production.mjs` need not change for this demonstrated cause. No third production file, public API, receipt/hash or timeout change is justified.

Fixed execution: bounded Test supplement with valid control and callback-zero causalRED for the three demonstrated positions → Controller Readiness/new Test identity/TDD_READY → minimum Worker fix → GREEN/full affected regression/canonical/Retirement → **fresh independent Validator at the original M1/B0 verification point**. Only after that PASS may normal Acceptance/merge/archive/live-main Gates proceed. S04 closes only after returning through that original verification point; B0 itself also requires the M1 integration endpoint.

Current stage stops here: production/Test remain frozen; no Test Correction011 or Worker004 dispatch, no historical role approval replay, no Git stage/commit/push/merge/archive or external action. Latest recovery cursor and fixed receipt: [NEXT_ACTION R008](../NEXT_ACTION.md#progress-receipt-r008). Await user decision on the bounded next Test stage; do not replan or enter M2.
