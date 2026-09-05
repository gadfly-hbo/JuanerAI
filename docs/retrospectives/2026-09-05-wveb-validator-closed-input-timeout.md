# Change Retrospective — closed input and timeout

## Identity and outcome

Current continuation: Validator003 completed FAIL for one / descendant-containment defect on unchanged Worker004 blobs. Original kind getter repair independently confirmed; fresh382/752/canonical and Retirement PASS retained. [Validator003 Gate](../planning/2026-09-05/automation-repair/reviews/m1-validator-003-gate.md) contains the finite finding and return; NEXT_ACTION/R012, M1/B0/S04 with necessary S05. Earlier current/pending wording below is preserved stage history, not present authority.

- ID: `RETRO-WVEB-VALIDATOR-CLOSED-INPUT-TIMEOUT-001`; Change: change-coordinator-worktree-validation-execution-boundary; class: boundary/R2.
- This completes the existing pre-fresh-Validator retrospective required by [Spec Gate001](../planning/2026-09-05/automation-repair/reviews/m1-spec-gate-001.md). It does not replace the earlier RETRO-WVEB-TEST-MATRIX-READINESS-001 or create a new repair.
- Baseline HEAD: `33f04a35d13abe64f4394d54eec166b58cb44716`; current repaired blobs and exact Test in [Worker003 Gate](../planning/2026-09-05/automation-repair/reviews/m1-worker-revision-003-gate.md).
- Latest completed independent verdict remains historical Validator001 FAIL. Fresh Validator, Controller Acceptance, integration and archive are pending. No accepted repaired baseline/archive path yet.

## Intended value

Close the evidence/process gaps that allowed a partial GREEN to appear complete, preserve the minimal validation boundary needed by the automatic delivery chain, and return to fixed M1/B0. Reuse public L1 snapshot, public L2 validation execution, Test-owned oracle, exact receipt and existing lifecycle. Non-goals: new runtime/observer/parser, broad Test migration, new workflows or global rules; no L3/host/Desktop/external execution.

## Evidence summary and root cause

| Evidence | Finding / resolution | Source |
|---|---|---|
| Validator001 closed inputs | Object.keys-style acceptance omitted symbol/hidden/accessor fields and permitted callbacks; malformed scope reached identity work rather than immediate INPUT_INVALID. Enumerable-key shape is not a closed data-object contract. | [Preserved pre-clarification record, lines513 onward](../planning/2026-09-05/automation-repair/reviews/m1-spec-clarification-001.diff:513) |
| Validator001 timeout | SIGTERM could be caught; waiting for close without guaranteed direct-child termination left validation pending. Approved closure is one timer-winner SIGKILL, await close, then post-snapshot; no grace/retry/process group. | same preserved record; Test C148/N085 |
| Historical WR002 | Its63 causalREDs becameGREEN, focused279/coordinator358/board12/canonical1410+1expectedskip. This fixed the earlier stage, not every later admission predicate. | [Controller evidence](/private/tmp/wveb-wr002-controller-kxUUnQ/controller-evidence.json) |
| Later admission gaps | cwd/head lacked primitive guards; six arrays lacked consistent prototype/descriptor qualification; root lexical vs identity frontier required explicit contract. Fixed existing379 plan, not unbounded adversarial expansion. | [Spec Gate001](../planning/2026-09-05/automation-repair/reviews/m1-spec-gate-001.md), [Test010 Gate](../planning/2026-09-05/automation-repair/reviews/m1-test-correction-010-gate.md) |
| Test construction S02 | Intermediate hidden-index helper checks contradicted intended mutation. Returned to same Test role with production frozen; corrected control/mutation/oracle witnesses, then independently accepted322PASS/57causalRED. | Test010 Gate; intermediate failure retained |
| Current WR003 | Only five private checks in two files; immutable379 now379GREEN, related749GREEN, canonical1410PASS/1expectedskip, post-GREENRetirementPASS. No fresh Validator yet. | Worker003 Gate and linked complete logs |

The earliest misses were initial Spec/Test Design predicate decomposition and Readiness frontier validation. Counts alone did not prove hidden fields, callback timing or terminal liveness; source/AST evidence also could not replace real signal-resistant-child and full receipt evidence. Conversely a historical Validator FAIL cannot be asserted to prove the same bug still exists in later blobs.

## Effort and rework

- Historical Corrections005..007 and WR002 retained; latest pass consists of one six-file Spec clarification, one append-only Test010 with bounded S02 self-check correction, and one two-file WR003.
- One completed Validator FAIL is carried forward; no new independent verdict manufactured.
- Routes remained R2. Temporary sol/high Spec and terra/high Test/Worker were individually approved because configured custom roles fixed medium effort; no config edits or automatic route escalation.
- No broad existing-test migration: original279 bytes and order retained;100 approved additions only.
- S03 was an execution-policy conflict with an older read-only restriction, not a production/Test defect. Worker stopped before edits; after risk explanation and explicit user “同意授权”, same Worker applied the patch and Controller re-passed379GREEN. S03 CLOSED_RETURNED to M1/B0.

## Good and avoidable friction

| Control / friction | Earliest preventive point / lesson |
|---|---|
| Test/Worker separation and exact frozen identities | Stopped assertion weakening and distinguished construction failure from causalRED; retain through Validator |
| Valid control plus single intended mutation and independent expected receipt | Test Readiness must establish actual frontier, not only test title/count; S02 returned to this exact checkpoint |
| Real resistant child, ready PID, watchdog-as-failure, finally cleanup | Timeout Spec/Test Design must name terminal winner and settlement, not just timeout status |
| Historical source hashes in permanent structural tests and broad text inventory | Earlier evidence lifecycle needed current source binding; retained productionAst/C164 now own dynamic source/sole-consumer proof, with no new parser outside Test |
| Changing local priorities after each finding | Approved MASTER_PLAN/R006 fixes M/B ownership, closure and return point; no hypothetical additions to379 or M0–M4 |
| Policy denial after prior approval | Surface informed post-denial authorization in the same brief; never bypass a denial or reclassify it as codeRED |

## Complexity stop-line audit

Stop line crossed: repeated Test/Worker corrections and failed Validator. Causes explicitly split into contract clarification, Test construction, frozen-contract production defect and policy/environment authorization. Owners: Controller/Spec, Test, Worker, Controller/user respectively. Return Gates: Spec Gate, Test Readiness, same Worker379GREEN, then post-GREENRetirement and fresh Validator. No re-slicing needed for WR003; only two existing production paths. Earlier FAIL/RED/PASS logs remain historical and discoverable, not overwritten.

## Reusable outputs and pending debt

| Asset / debt | Reuse or release condition |
|---|---|
| Immutable379 and lifecycle ledger | Permanent AC001..006 regression; Test010Gate + Worker003Gate; retain afterGREEN |
| Current L1/L2 evaluator/factory and full receipts | New Validator verifies fixed blobs; L3 must not infer compatibility without M2 contract closure |
| M0–M4 / NEXT_ACTION fixed receipts | Existing approved project plan is sole recovery cursor; this retrospective adds no state system |
| Fresh Validator model-route mismatch | Configured sol/medium cannot satisfy fixed R2high via custom tool; temporary read-only sol/high exception requires user decision, not another code repair |
| B1–B5 / host readiness | Already scheduled M2/M3; WVEBGREEN does not close these or authorize Desktop |

Lessons here are references to existing approved controls, not new persistent workflow rules. No global instruction, template, skill, memory, runtime or governance contract was modified. Any future global learning change requires separate user approval.

## Next-change baseline and completion

M1/B0 remains active. After fresh Validator and Controller Acceptance/integration/archive/live-main, proceed to M2's already-listed contracts and full public lifecycle evidence; no early L3 unlock. M3 host readiness and M4 Desktop startup decision remain separate from actual product dispatch.

- [x] Pre-Validator facts match current Worker003/verification evidence; pending acceptance/archive explicitly pending.
- [x] Reusable assets and preserved failure evidence linked.
- [x] No unapproved durable behavior/process rules introduced.
- [x] Code/route/deployment debt not claimed solved by this document.
- [x] Original next checkpoint and deferred M2/M3/M4 work explicit.

Controller readback of this document completes the existing retrospective prerequisite only. It does not close B0 or waive fresh independent validation.

## Validator002 / Test011 bounded follow-up

Validator002 demonstrated validStat/validContent reading kind before descriptor admission. Existing accessor tests targeted ino/sha256, so379PASS and asset Retirement did not establish the discriminator contract. Return cause: incomplete Test coverage plus a production defect within unchanged AC001/005; owner Test then bounded Worker, not Spec redesign or a new matrix. Current user approved exactly three Test additions and a temporary terra/high Test role. Controller accepted new382 inventory with original379 preserved and three callback-zero causalREDs. A first appended-helper async omission failed parsing; same Test fixed it and full independent replay confirmed the intended frontier. The syntax log is retained and is not causalRED.

At the Test011 checkpoint: no main-plan drift or new durable mechanism; reuse public evaluator, existing Test-owned oracle and one helper with three consumers. S04 remained open until minimum snapshot fix, full quality/final Retirement and fresh Validator return to the original M1/B0 point. That Test proof did not close B0 or authorize Worker. This records the existing complexity-stop-line disposition, not new global workflow rules or reopened broad investigation.

At Worker004/R011: current user approved the new Test-bound TDD_READY and one temporary terra/high Worker. Only validStat/validContent admission ordering changed; no broader guard framework, additional tests, public contract or dependency. Actual three causalREDs becameGREEN and full quality/final Retirement passed. Temporary Worker ended, configuration unchanged. S04 still awaits the original freshValidator acceptance point; obtain one-use sol/high read-only replacement approval and revalidate frozen inputs. This updates the existing retrospective prerequisite, not a new repair route or an independent PASS.

## Validator003 bounded follow-up

One confirmed F1: / is valid by frozen contract but both private containment checks append another slash, rejecting canonical descendants. Existing L1 slash positives chose empty inventory; L2 tests intentionally proved admission then identity trap. Root cause is incomplete Test Design plus existing-contract production defect, not contract ambiguity or a reason to revise the master plan. Controller independently reproduced valid-control/nonempty-root oracle mismatch. Original getter callback defect is independently fixed and must not be reopened.

Return only through bounded root-containment Test evidence/causalRED, then own TDD_READY, minimum two existing containment checks, required quality/finalRetirement and a fresh independent original M1/B0 Gate. Test Design must state feasible L2 evidence boundaries without actual filesystem-root Git writes or new production seams. Current approval covered Validator only: no Test/Worker dispatched. S05 is a necessary dependency at S04's original acceptance point, not a separate main route. No other new blocking finding; no new durable governance rule or generic investigation.

## S05 Test012 / Worker005 bounded follow-up

Current user authorized one bounded Test→Worker→freshValidator cycle with fixed return to original M1/B0 verification and no integration. Exactly five Test leaves appended with all382 old bytes intact. Initial N218 used ordinary-root equality instead of approved slash equality; same Test corrected only this manifest deviation, and Controller accepted387/386PASS/oneN217 causalRED. No new defect or main route arose from that construction correction.

Worker005 changed only two existing private containment predicates, retaining equality and ordinary-root component boundaries while admitting slash descendants. Controller387/757/canonical1410+1expectedskip, exact outside-region scope, originalgetter/root oracle probes and finalRetirement all passed. No new helper/seam/AST/mocking framework or actual-root Git operation. Explicit L1-runtime/L2-source-plus-ordinary-runtime evidence split remains unchanged. Original complete freshValidator004 is next under current cycle authority; S04/S05 are not yet CLOSED_RETURNED and B0 remains open. New substantive finding would stop this cycle for user decision. No new retrospective task or durable governance rule.

At Validator004/R015: fresh independent sixAC/source/runtime/Retirement verdict PASS, confirmed by Controller complete-log/probe/40-file receipt and20-input/1239-baseline readback. No new substantive finding. S04/S05 re-passed their original complete WVEB point and CLOSED_RETURNED to M1 Acceptance/integration preparation; no B0 closure or M2 unlock. The current bounded cycle ended with all roles stopped. Reuse these verified capabilities and continue at the original next Gate only; no additional investigation or repair route.
