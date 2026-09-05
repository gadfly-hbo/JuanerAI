# Change Retrospective

## Identity and Outcome

- Retrospective ID: `RETRO-WVEB-TEST-MATRIX-READINESS-001`
- Change: `change-coordinator-worktree-validation-execution-boundary`
- Change class: R2 production validation-boundary change
- baseline Head: `33f04a35d13abe64f4394d54eec166b58cb44716`
- branch: `work/macbook/change-coordinator-worktree-validation-execution-boundary`
- current Test: `tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs`, 773 lines, 59,116 bytes, SHA-256 `a7b108393b5194c58087c7323bead4406467fb73fb9e183fb684fbc6a3222b45`
- current focused result: exactly 154 leaves; `150 PASS / 4 FAIL / 0 skip / 0 todo`
- final Validator verdict: pending; Validator has not been dispatched
- Controller acceptance: pending
- integration and archive: pending; no stage, commit, push, PR, merge, Acceptance, or archive is authorized or complete

## Intended Value

- user outcome: retain a deterministic Test matrix that distinguishes Test-fixture defects from the four remaining production implementation defects before any bounded Worker revision.
- intended delta: document why the earlier Test Asset Readiness result did not detect misbound mutations, which controls stopped a false GREEN, and which evidence must be rebound before work resumes.
- reused baselines: the approved WVEB seven-file OpenSpec package, `RGE-VALIDATION-BOUNDARY-RESLICE-001`, the frozen 154-leaf Test, and the two allowed production paths.
- non-goals: changing the product contract, OpenSpec, Test, production, global governance, role prompts, templates, canonical environment, or any integration state.

## Evidence Summary

| Evidence | Expected | Current result | Source |
|---|---|---|---|
| Test identity | one frozen 154-leaf Test | PASS: 773 lines, 59,116 bytes, SHA-256 `a7b108393b5194c58087c7323bead4406467fb73fb9e183fb684fbc6a3222b45` | `worktree-validation-execution-boundary.test.mjs` |
| corrected fixture bindings | every mutation changes its intended field on the intended entry type while preserving all unrelated closed shape | PASS: 32 FILE-semantic leaves bind the actual `FILE` entry; 9 entry-shape/path leaves retain the intentional `MISSING` entry; 2 genuine symlink leaves retain the `SYMLINK` entry | Controller line-by-line audit and Correction 003 diff |
| focused Test | fixture failures disappear without weakening the production frontier | PASS for Test Design: `150/154`; exactly four production failures remain | Controller independent focused run after Correction 003 |
| existing Coordinator regression | no unrelated regression | PASS: `358/358` | Controller independent run |
| Project Board | current records retain their closed contract | PASS: `12/12` | Controller independent run |
| Test Asset Retirement | no temporary, duplicate, skipped, or unowned Test asset remains | PASS; ponytail result `Lean already. Ship.` | Controller retirement Gate |
| canonical offline validation | canonical environment available | `BLOCKED`: the worktree lacks `node_modules/@earendil-works/pi-coding-agent/package.json`; no dependency was installed and no PASS was claimed | prior post-Worker environment Gate |
| independent validation | fresh read-only Validator verdict | pending | no Validator dispatched |

## Frozen Production Residue

Both production files are unaccepted, uncommitted residue and remain read-only until a separately authorized bounded Worker revision:

| Path | SHA-256 | Current disposition |
|---|---|---|
| `tools/harness/change-coordinator/worktree-snapshot-contract.mjs` | `18ccf50fb8a7c552f80b65b5c470218c738799756efd9830ebdf199afdaa41c0` | incomplete production residue; not GREEN or accepted |
| `tools/harness/change-coordinator/production.mjs` | `b86c8a531ca391b7264b628f1e2bd11cb5d47680d2e442d9b84b1b2000462248` | incomplete production residue; not GREEN or accepted |

The remaining failures are frozen-contract implementation gaps, not product-contract ambiguity and not Test defects:

1. exact empty child environment and full receipt;
2. nonempty regular-file snapshot success;
3. nonempty executable-file snapshot success;
4. nonempty symlink snapshot success.

## Test Corrections and Controller Gates

| Correction | Input / output | Controller Gate | Disposition |
|---|---|---|---|
| `WVEB-TEST-CORRECTION-001` | `90353b9b4d0c640ddc79cd6202a9905ea7b74554992651b7c9e36f2841be8c21` to `40639d7ce4260f91bd07ea1280c914724754159ba3b416d7329f05b035659cfe`; 126 leaves | `TEST_DESIGN / ROOT_CAUSE_REVIEW_REQUIRED` | mutation decomposition and repository-wide consumer proof were incomplete; production stayed locked |
| `WVEB-TEST-CORRECTION-002` | `40639d7ce4260f91bd07ea1280c914724754159ba3b416d7329f05b035659cfe` to `61ad579d2ed6cd600191c7a94461d1010595636373714d81833b1f49dce07d44`; 154 leaves | historical `TEST_ASSET_READINESS_PASS` and `TDD_READY` | superseded for Worker release after the frozen Worker run exposed 11 fixture failures plus 4 production failures |
| `WVEB-TEST-CORRECTION-003` | `61ad579d2ed6cd600191c7a94461d1010595636373714d81833b1f49dce07d44` to `a7b108393b5194c58087c7323bead4406467fb73fb9e183fb684fbc6a3222b45`; 154 leaves | `TEST_DESIGN_PASS / TEST_ASSET_READINESS_PASS`, Change remains `MANUAL_CONTROLLER_STOP` | all 11 fixture failures removed; exactly 4 production failures remain; no Worker or Validator release |

The historical `TEST_ASSET_READINESS_PASS` remains an accurate record of what the earlier Gate concluded, but it no longer authorizes a Worker. Any later `TDD_READY` must bind the corrected Test identity and receive fresh user confirmation.

## Root Cause

1. The fixture intentionally placed a `MISSING` entry at `entries[0]` so its entry order differed from the porcelain byte order. Thirty-two mutations that required `FILE` stat, content, or stable before/after semantics nevertheless addressed the positional index `entries[0]`.
2. On a `MISSING` entry, some mutations were no-ops because the targeted FILE-only property did not exist. Others first introduced an invalid closed shape, so they failed at input-shape validation rather than reaching the declared before/after consistency frontier.
3. The earlier Test Asset Readiness review checked the number of leaves, independent registration, assertion structure, oracle separation, and named frontiers, but did not verify for every leaf that the mutation changed the target value, selected the intended entry type, and left the preceding closed shape valid.
4. The Worker correctly kept the Test frozen. Running the real implementation against that frozen Test exposed the contradiction and triggered `MANUAL_CONTROLLER_STOP`, preventing an incorrect GREEN and preventing the Test from being weakened during implementation.
5. After Correction 003, the eleven Test-fixture failures disappeared. The remaining four failures belong to the already frozen production contract and must not be reclassified as a product-contract failure or a Test problem.

## Effort and Rework

- Spec clarifications after Gate: one approved boundary-testability clarification established the minimal production factory and post-Worker evidence timing.
- Test corrections for the same behavior: three; Corrections 002 and 003 followed explicit Controller root-cause/stop-line review.
- Worker revisions or replans: one initial Worker implementation attempt; it stopped without Test modification when the fixture contradiction became executable.
- model/reasoning changes: none inside the three corrections; the same approved Test-role route was retained.
- broad existing-test migrations: none.
- Validator FAIL rounds: none; Validator remains pending.
- environment/tooling incidents: canonical validation remains blocked by the absent approved dependency closure in this worktree.

## Good Friction

- Logical separation between Test and Worker prevented the implementation role from editing assertions to obtain GREEN.
- The frozen Test, exact hashes, and named failure frontier made it possible to separate 11 fixture failures from 4 production failures.
- The third-correction stop line required a Controller binding manifest before another Test write.
- Exact focused counts, existing regression, Project Board, diff, retirement, branch, index, and retention checks prevented a partial Test repair from being overstated as product completion.

## Avoidable Friction

| Friction | Root cause | Earliest preventive Gate | Evidence |
|---|---|---|---|
| 32 FILE mutations addressed a positional MISSING entry | mutation ownership was expressed by array position instead of the entry's semantic type | initial Test Design | Correction 003 binding manifest |
| no-op mutations survived Readiness | review checked assertion presence but not before/after mutation inequality | Test Asset Readiness Gate | Worker run: missing-field mutations returned the valid control result |
| race leaves failed at closed-shape validation | the mutated entry did not support the intended stat fields | Test Asset Readiness Gate | Worker run: `INPUT_INVALID` appeared before the expected `SUBJECT_MISMATCH` frontier |
| historical Readiness was treated as Worker-ready until real execution | post-Worker factory evidence was correctly deferred, but the pre-Worker mutation witness was incomplete | Controller `TDD_READY` review | 139/154 post-Worker result and immediate stop |

## Complexity Stop-Line Audit

- stop line crossed: yes
- trigger: third same-kind Test correction following a Worker-discovered frozen-Test contradiction
- root-cause class: Test asset binding and Readiness evidence defect within the existing contract
- return Gate: retrospective completion, then a new user-confirmed `TDD_READY` bound to Test SHA-256 `a7b108393b5194c58087c7323bead4406467fb73fb9e183fb684fbc6a3222b45`
- re-slicing decision: none; the four residual defects remain a bounded two-production-file revision inside the approved WVEB contract
- quality evidence preserved: all three correction events, historical RED/Readiness evidence, frozen Worker residue, 154 leaves, exact four production failures, regressions, and retention identities remain available

## Reusable Outputs

| Asset | Authority/path | Future trigger | Reuse rule |
|---|---|---|---|
| corrected mutation matrix | `worktree-validation-execution-boundary.test.mjs` | separately authorized bounded Worker revision | use only the frozen `a7b108...` Test; do not reuse the earlier `TDD_READY` |
| entry-binding manifest | Correction 003 Controller evidence | any Test fixture whose semantic ordering intentionally differs from serialized/raw ordering | identify the target by semantic entry kind before validating a mutation; do not infer ownership from array position |
| four production frontiers | focused `150/154` output | Worker revision | change production only; the corrected Test remains frozen |
| retirement ledger | `test-plan.md` and Correction 003 Gate | Validator dispatch | the sole Test remains permanent coverage for `REQ-WVEB-001` / `AC-WVEB-001..006`; all OS-temporary assets must remain cleaned |

## Lessons and Pending Suggestions

These suggestions are not current rules, template changes, or implementation authority. Each requires a separate explicit user decision before any persistent workflow change:

| Lesson or suggestion | Classification | Possible target | Approval needed |
|---|---|---|---|
| A mutation-readiness review should witness `before != after` for the intended field and confirm all preceding shape invariants remain valid. | workflow suggestion | future Controller Test Asset Readiness checklist | yes |
| Fixtures whose raw serialization order differs from semantic order should publish a local Test-side binding map or use a semantic lookup rather than a positional index. | Test design suggestion | future Change-specific Test plans | yes |
| Post-Worker Test contradictions must supersede the prior Worker-release evidence while retaining that prior event as history. | workflow reference | Controller evidence read model | yes before any global/template edit |

No global governance file, role prompt, template, product contract, or production interface is modified or superseded by this retrospective.

## Current Git and Retention Baseline

- WVEB branch: `work/macbook/change-coordinator-worktree-validation-execution-boundary`
- WVEB Head: `33f04a35d13abe64f4394d54eec166b58cb44716`
- WVEB index: empty
- pre-retrospective WVEB NUL-safe inventory: 27 records; SHA-256 `b70fafde4bf5ab65033e27f51b2733af62fb78046240fda93dd1f7c28df02753`
- retained dirty checkout: 334 records; NUL-safe inventory SHA-256 `f7adb891a3cea22cb0196502bddc013062fe8f477c60702176348defea3d910c`
- frozen 331-path excluded-residue identity: `c79cc45869cca22925204c80eae2a49455c34429dbf8cead7263c3a89dd958d9`
- dirty-checkout mixed Coordinator file SHA-256: `6fc85ffe89e94ec36272b86e5a2088d8c7c0527daca29cbd06f486d9d22a801f`
- dirty-checkout mixed production file SHA-256: `d61222e8c2a0ae3c8104137d56b18afcdbf4ba813c16d3a222a26dd42705db46`

The retrospective adds one untracked path to the WVEB inventory. The subsequent separately authorized project-board outcome adds one event and updates the already-modified `status.json`; neither operation changes the retained dirty checkout.

## Next Gate

1. Controller reads back and freezes this retrospective.
2. Controller records the unique `RETROSPECTIVE_COMPLETED` outcome while keeping implementation locked.
3. The user separately decides whether to publish a new `TDD_READY` bound to the corrected Test and authorize a bounded Worker revision.
4. After production GREEN, canonical validation, regression, retirement, frozen evidence, and independent Validator remain required.
5. Acceptance, integration, and archive remain pending and require their normal separate Gates.

## Completion Criterion

- [x] Current Test, leaf count, focused result, production residue, three corrections, canonical blocker, Git, inventory, and retention facts are bound.
- [x] The mutation-binding root cause and the earlier Readiness miss are explicit.
- [x] Worker Test-freeze is recorded as a control that prevented false GREEN.
- [x] The four remaining failures are classified as production implementation gaps inside the frozen contract.
- [x] Persistent process changes are only pending suggestions requiring separate approval.
- [x] Validator, Acceptance, integration, and archive are explicitly pending.
