# M1/B0 — Validator003 FAIL and bounded Controller disposition

## Current verdict and authority

2026-09-05: `VALIDATOR003_FAIL / CONTROLLER_FAIL_ACCEPTED / B0_OPEN / TEST_DESIGN_RETURN_PENDING_AUTHORIZATION`.

Current user “批准” authorized one fresh temporary sol/high read-only Validator003, not repair or integration. /root/wveb_validator_003 was actually dispatched/read back running and has completed. Configured role was not modified; temporary exception ended. Validator did not author the Test/implementation. [Brief](../m1-validator-003-brief.md) and [19-input dispatch manifest](/private/tmp/juanerai-validator003-controller.rAhAXv/dispatch-package.json) bind this review. Historical approvals were not replayed.

Controller accepts FAIL after checking source/contract, full run results and independently rerunning the public L1 probe. Exactly one confirmed root cause remains in this verdict. No Test/Worker is dispatched; production and Test stay frozen. No change to M0–M4 or B0–B5.

## F1 — valid descendants of root "/" rejected (P1 / original B0)

Frozen requirements: [delta spec:54](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/specs/dual-device-transition-foundation/spec.md:54) explicitly admits lexical root "/"; [design:120](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/design.md:120) requires parent at/below worktree root on a component boundary. Existing AC001/004/005 own snapshot/containment and error-frontier behavior. This is not a request to introduce root support or change the contract.

Both private helpers use target===root || target.startsWith(root + "/"):
- [L1 isContainedParent:230](../../../../../tools/harness/change-coordinator/worktree-snapshot-contract.mjs:230).
- [production contained:386](../../../../../tools/harness/change-coordinator/production.mjs:386), used for collector-parent and execution-cwd checks.

For root "/", the descendant prefix becomes "//", incorrectly rejecting "/tmp". Public L1 probe supplied complete closed input, matching identities/status/index, valid single FILE entry and independent full hash oracle:
- ordinary-root nonempty control: expected/actual OK, full oracle match;
- "/" empty control: expected/actual OK;
- "/" with nonempty inventory and parent "/tmp": expected OK, actual REJECTED/SUBJECT_MISMATCH;
- changing only worktree root identity to "/" with valid descendant parent reproduces the same rejection.

Evidence: [current probe result](/private/tmp/juanerai-validator003.AD6ohq/l1-independent-probe-current-v3.json), [probe source](/private/tmp/juanerai-validator003.AD6ohq/l1-independent-probe.mjs), [Controller independent rerun](/private/tmp/juanerai-validator003-controller.rAhAXv/controller-output-review.json).
Controller replay used exact current probe SHA256 `98dd46c6e4084a022462e30853da660891e21af2550b566d08ff75beb532bc02`.

Evidence boundary: L1 public runtime counterexample is reproduced. Production's identical private predicate and its callers were independently source-audited; no Git worktree at actual filesystem "/" was created or executed. Do not overstate this as a live root-repository L2 run. Existing L2 "/" tests prove lexical admission via an identity trap, not successful root descendants.

Coverage gap: [existing L1 "/" positives:1525](../../../../../tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs:1525) use empty observations; [L2:1551](../../../../../tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs:1551) uses the documented identity trap. [Test Plan:140](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/test-plan.md:140) explicitly prescribes empty-snapshot success. Therefore382GREEN does not exercise nonempty root containment. Current tests are not weakened or retired; this is missing evidence plus a frozen-contract implementation defect.

## Completed reusable evidence

- Worker004's kind getter fix independently confirmed with normal oracle control: old Validator002 snapshot invokes each getter once; current before/after/content each reject INPUT_INVALID with callbacks0. [Preimage probe](/private/tmp/juanerai-validator003.AD6ohq/l1-independent-probe-validator002-preimage.json), current probe above.
- All19 input identities match before/after every run and final readback. Test382 unique IDs/names/order and retained379/original279 prefixes unchanged. [Inventory](/private/tmp/juanerai-validator003.AD6ohq/inventory-check.json).
- Full source/consumer audit:20 candidates, sole production consumer production.mjs. Collector has no direct evaluator call; gateway owns pre/post evaluations. [Consumer inventory](/private/tmp/juanerai-validator003.AD6ohq/consumer-inventory.json).
- Process source audit and actual C148/N085 replay: one spawn, one timer winner marks timedOut and sends SIGKILL; no retry/grace/replacement; close precedes post-snapshot. [Source evidence](/private/tmp/juanerai-validator003.AD6ohq/source-audit.json).
- Independent Test Asset Retirement review found no orphan, unresolved retirement, unauthorized deletion or tracked temporary evidence among retained382 assets. Retirement PASS addresses lifecycle, not the newly missing root coverage.

| Fresh run | Actual evidence | Full result / stdout |
|---|---|---|
| focused |382/382 PASS, exit0, no fail/skip/cancel/todo | [result](/private/tmp/juanerai-validator003.AD6ohq/focused.result.json), [stdout](/private/tmp/juanerai-validator003.AD6ohq/focused.stdout.log) |
| related |752/752 PASS, exit0, no fail/skip/cancel/todo | [result](/private/tmp/juanerai-validator003.AD6ohq/related.result.json), [stdout](/private/tmp/juanerai-validator003.AD6ohq/related.stdout.log) |
| canonical |1410PASS/0FAIL/1expected real-Pi skip, exit0 | [result](/private/tmp/juanerai-validator003.AD6ohq/canonical.result.json), [stdout](/private/tmp/juanerai-validator003.AD6ohq/canonical.stdout.log) |
| diff-check |exit0 | [result](/private/tmp/juanerai-validator003.AD6ohq/diff-check.result.json) |

Controller read all stdout/stderr, reconciled nested summaries, verified output hashes and before/after identities: [output review](/private/tmp/juanerai-validator003-controller.rAhAXv/controller-output-review.json). All stderr empty, no failure rows. Canonical's sole skip is TEST-XCLI-013, separately authorized real-Pi acceptance absent. Suites overlap; do not sum as unique coverage. Environment command-local approved PATH and real-Pi gate unset, no install/model/external action.

## Frozen scope and no-write proof

HEAD `33f04a35d13abe64f4394d54eec166b58cb44716`, branch work/macbook/change-coordinator-worktree-validation-execution-boundary, index empty; these are worktree blobs, not repaired committed head:
- snapshot SHA256 `f87236c901d1993a5627124ad16dd7c07f90ecb10764b09a4ba8348ec0a96520`;
- Test SHA256 `0d208b95d67305c53935358975f1505a58c7383112c2f454b95009fcbf9fbabb`;
- production SHA256 `6ae12f06221694eb29063fa7e01b87e3287ccec60ddaa38b6a8033cc47ba8f05`.

[Controller1229-file scope check](/private/tmp/juanerai-validator003-controller.rAhAXv/post-validator-scope.json):19/19 frozen inputs unchanged; only declared Controller board running status/event changed. Validator created only isolated temporary probes/logs and suite fixtures. No product/Test/spec/config/Git/project-control write, no dependency/agent/external action.

## Fixed return, finite blocking list and stop

One new finding F1 maps to existing B0 root/containment behavior, not B6 or a new product goal. Necessary dependency S05 is recorded under M1/B0 at S04's original complete WVEB independent-verification point:
- owner: Controller Test Design scope/coverage decision → Test → bounded Worker → fresh Validator, each own Gate;
- minimum: current unique Test path covers "/" with nonempty inventory and descendant parent plus relevant component-boundary controls; preserve all382 bytes/IDs/assertions. Production remains frozen until new causalRED/Readiness and Test-bound TDD_READY;
- future production candidate: only the two existing private containment helpers, not generic path framework or broader admission refactor;
- closure: causal public evidence → minimum fix → focused/related/canonical/scope/finalRetirement → fresh independent WVEB PASS;
- exact return: original M1/B0 independent acceptance, then existing Controller Acceptance/integration/archive/live-main, not M2 directly.

This is an earlier Test Design coverage miss and frozen-contract production defect, not contract ambiguity, asset-retirement failure or toolchain blocker. No Spec semantic redesign indicated. Test Design must explicitly state feasible L2 evidence limits; do not invent real-root execution, add production seams or enlarge scope to obtain a test. If that cannot be satisfied inside existing boundaries, stop for a specific decision before dispatch.

S04 getter correction itself is verified, but its recorded closure requires the whole original WVEB independent point; it stays OPEN awaiting S05 resolution and that PASS. S01–S03 remain CLOSED_RETURNED. 本轮未关闭阻塞；B0–B5 remain open. No repair authorization inferred from this Validator approval. Next user decision is bounded root-containment Test supplementation/causalRED, production frozen; no role dispatch now.

M1 remaining: this single finding → fresh Validator → Acceptance/merge/archive/live-main. M2/B1–B5 contracts/full chain, M3 host readiness/D1, M4 decision remain fixed. Historical Validator001/002 FAIL, Test011 causalRED and Worker004 component PASS retained. Recovery [NEXT_ACTION/R012](../NEXT_ACTION.md#progress-receipt-r012).
