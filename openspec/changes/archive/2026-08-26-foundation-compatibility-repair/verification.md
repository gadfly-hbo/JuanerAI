# Verification: Foundation Compatibility Repair

## Current Read Model

- Change: `CHG-foundation-compatibility-repair`
- Baseline/Head read: `713350494df4fa1af587cb7bfef392aa1c06f067`
- Branch read: `work/macbook/foundation-compatibility-repair`
- Current verdict: `REGRESSION_AND_TEST_ASSET_RETIREMENT_PASS`
- Controller Spec Gate: `PASS` on 2026-08-26
- Test/RED, one-file Worker/GREEN, bounded Test causality correction, Regression and Test Asset Retirement are complete; Candidate/Validator/Acceptance/Archive remain locked and not run
- Normative delta: none
- Next Gate: Controller exact-scope Candidate preparation, followed by one fresh exact-Candidate Validator

## Frozen Input Hashes

| Input | SHA-256 at Spec readback |
|---|---|
| canonical Foundation spec | `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69` |
| Coordinator production baseline | `82ff43a6112953ee586f5973acd7c2f2d669d3fec16c396ef725f536a8ee1326` |
| Coordinator Test baseline | `17da2da0b81717acd53923613212aa12806a52b8ab5713f06226ba6ba0180a05` |
| frozen Adapter baseline | `05e7598ccc185eaf3b0ef27e9662c121efac76837debf83caedb2c5c0183568c` |

These hashes are Spec-stage observations, not RED/GREEN or Candidate evidence.

## Source Conformance Findings

Read-only baseline inspection confirmed four bounded incompatibilities:

| FCR | Baseline observation | Closed repair seam |
|---|---|---|
| FCR-1 | DISPATCH contains an equality check for the Foundation Change ID | remove specialization; retain existing canonical and WIP admission |
| FCR-2 | REVISION accepts only `BLOCKED + VALIDATOR_SECOND_FAIL` | add exact `AWAITING_CONTROLLER` Frozen-Candidate path; keep existing path |
| FCR-3 | Candidate commit uses baseline unconditionally and publication lacks later predecessor closure | derive existing state predecessors and use current inspect/stage/commit/push/readback/PR seams |
| FCR-4 | settlement accepts `NOT_STARTED` and legacy failure/interruption enums | close four variants/enums; Coordinator authors pre-request NOT_STARTED only |

No fifth incompatibility is authorized by this Change. Other observed or later-discovered defects are not silently added.

## Spec Consistency Matrix

| Check | Current result |
|---|---|
| required OpenSpec artifacts present | PASS at Spec readback |
| FCR-1..4 each maps to Test and Tasks | PASS at Spec readback |
| referenced canonical ACs restricted to authorized list | PASS at Spec readback |
| Test write path exactly one file | PASS at Spec readback |
| Worker write path exactly one file | PASS at Spec readback |
| adapters/fixtures/CLI/runner/dependencies/governance/project-control/canonical specs frozen | PASS at Spec readback |
| public interfaces, macro states, events, gateways, locks and recovery boundaries unchanged by design | PASS at Spec readback |
| archive rule keeps canonical spec byte-identical | PASS at Spec readback |
| executable RED/GREEN/regression evidence | PASS; dated evidence appended below |
| exact-Candidate Validator evidence | NOT RUN; later Gate |

## Controller Spec Gate — 2026-08-26

- Read back all seven Change-package files and confirmed the four authorized incompatibilities are individually mapped to requirements, Test leaves and implementation tasks.
- Confirmed Test scope is exactly `tools/harness/change-coordinator/coordinator.test.mjs` and Worker scope is exactly `tools/harness/change-coordinator/coordinator.mjs`.
- Confirmed canonical Foundation bytes remain unchanged at SHA-256 `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69` and this Change declares no normative delta.
- Confirmed FCR-3 distinguishes first publication from later publication: null `delivery.remote_head` retains the existing first push plus post-push readback; non-null `delivery.remote_head` requires exact predecessor readback before the existing non-force push.
- Mandatory `ponytail-review` disposition: `Lean already. Ship.`
- Controller verdict: `PASS`. This releases only Test/RED; every downstream Gate remains locked pending its own evidence.

## Planned Evidence Matrix

| Gate | Required current evidence | Status |
|---|---|---|
| Spec Gate | Controller mandatory `ponytail-review` plus complete package/path/mapping/contract readback | PASS |
| RED | `TEST-FCR-001..004`, exact hash/count/command and causal failures | PASS |
| TDD_READY | healthy helpers, one-file Test diff, lifecycle ledger, exact Worker scope | PASS |
| GREEN | same focused command passes after one-file Worker diff and bounded causal Test correction | PASS |
| Regression | affected suite/canonical runner and scope/forbidden-effect checks | PASS |
| Retirement | complete one-file test-asset reconciliation and ponytail disposition | PASS |
| Validator | fresh read-only exact-Candidate review with canonical hash equality | locked |
| Acceptance/archive | Controller evidence, integration Head, archived manifest, unchanged canonical bytes | locked |

## Existing Dirty-worktree Observation

At Spec start, `.juanerai/project-control/status.json` was modified and three project-control event files were untracked. They are outside this Change, were not read as authority for FCR behavior, and were not modified. Controller must distinguish and preserve them during later scope review.

## Residual Risks for Controller Review

1. Candidate local parent and remote publication predecessor can differ after a pre-push Validator auto-repair. Test must prove the closed split: null `delivery.remote_head` uses the existing first push and post-readback with no pre-read; non-null `delivery.remote_head` requires exact old-Head pre-read before the existing non-force push.
2. An `AWAITING_CONTROLLER` REVISION must prove decision evidence using only existing signed-body fields. Test must reject missing/wrong Candidate-subject evidence without inventing a new field or evidence kind.
3. Coordinator-authored `NOT_STARTED` must be limited to a real pre-request dispatch failure. Test must prove it never appears after REQUESTED or as a host settlement substitute.
4. Frozen `adapters.mjs` means all repair behavior must be expressible through its existing methods and normal non-force Git semantics. Any need to alter Adapter signatures or behavior is a blocker.

## Evidence Honesty

This file records source/document readback, the passed Spec Gate, and the dated RED/GREEN/Regression/Test Asset Retirement evidence below. It does not yet claim Candidate, Validator, integration, Acceptance, archive, Mode Activation, or product Change authority. Later evidence must be appended as new dated sections while preserving earlier records.

## Test/RED and TDD_READY — 2026-08-26

- Pre-edit healthy baseline: `node --test tools/harness/change-coordinator/coordinator.test.mjs` -> `131/131 PASS`.
- Frozen Test write scope: only `tools/harness/change-coordinator/coordinator.test.mjs`.
- Frozen Test SHA-256: `7595f63eecbec4c1b958fef6a3dbd6a738266a8bad3285fc60fd200a29d1482f`.
- RED command: `node --test tools/harness/change-coordinator/coordinator.test.mjs`.
- RED result: `152` tests, `138` pass, `14` fail, `0` skipped/todo. Node's count includes the four failing parent groups; the causal failures are exactly 10 FCR leaves. All pre-existing 131 tests remain passing.
- Causal failures: generic signed product Change admission; exact `AWAITING_CONTROLLER` Frozen-Candidate REVISION; later-Candidate STAGE/commit predecessor binding; published-branch predecessor readback and mismatch stop; canonical START_FAILED/INTERRUPTED unions; legacy/invalid settlement rejection; Coordinator-authored exact pre-request `NOT_STARTED`.
- Static checks: `node --check tools/harness/change-coordinator/coordinator.test.mjs` PASS; `git diff --check` PASS.
- AC mapping remains exactly `TEST-FCR-001..004` to the 13 canonical AC identities frozen above.
- Test Asset lifecycle: the four FCR groups are permanent regressions; no fixture, helper, temporary asset, skip, todo, or retired tracked asset was added.
- Production Coordinator, Adapter and canonical Spec hashes remain at their Spec-stage baselines.
- Controller verdict: `TDD_READY`. Worker scope is exactly `tools/harness/change-coordinator/coordinator.mjs`; Test, Adapter, fixtures, CLI, OpenSpec, project-control, runner, dependencies and every other path remain frozen for Worker.

## Worker Pre-start Permission Stop — 2026-08-26

- Two fresh Worker attempts reached the same pre-edit safety boundary before any production write.
- The write reviewer requires an explicit user authorization naming both security-relevant compatibility corrections: generic signed product Change admission and `AWAITING_CONTROLLER -> REVISION` for the exact Frozen Candidate. The prior bare `授权` was not accepted as sufficiently specific by that reviewer.
- No Worker production edit was made and no workaround was attempted.
- Production Coordinator SHA-256 remains `82ff43a6112953ee586f5973acd7c2f2d669d3fec16c396ef725f536a8ee1326`.
- Frozen Test SHA-256 remains `7595f63eecbec4c1b958fef6a3dbd6a738266a8bad3285fc60fd200a29d1482f`; the trustworthy RED and `TDD_READY` decision remain valid.
- Gate disposition: `BLOCKED` pending one exact user authorization. GREEN and all downstream Gates remain locked.

## Required Acceptance Retrospective

Because this repair follows discovery of released Foundation nonconformance, the final verification record must include a bounded retrospective before archive. It records why Foundation-only Test data escaped into admission, why review REVISION and later Candidate-chain scenarios were missed, why legacy settlement shapes survived, which exact mutation/scenario would have caught each defect, actual rework and evidence, and whether the two one-file scopes held. It may recommend separately authorized follow-up, but it must not change governance, skills, canonical specs, production, Tests, project-control, or host configuration.

## Worker/GREEN and Bounded Test Causality Correction — 2026-08-26

- The authorized Worker changed only `tools/harness/change-coordinator/coordinator.mjs` for FCR-1 through FCR-4. Production SHA-256 is `e0280f2660932ddedcd4ce59818dd6d0121fc203ee7d9a1e66d5c841f08b3a5e`.
- The first post-Worker run produced `146/152 PASS`; Controller readback isolated exactly three Test causality conflicts and did not request another production change.
- The final authorized Test correction changed only `tools/harness/change-coordinator/coordinator.test.mjs`: occupied-slot second-Change rejection, the deterministic admission idempotency identity, and a real admitted READY identity before the Worktree `NOT_STARTED` precondition failure.
- Controller independently read back all three corrections and confirmed Adapter SHA-256 `05e7598ccc185eaf3b0ef27e9662c121efac76837debf83caedb2c5c0183568c`, canonical Spec SHA-256 `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`, and production SHA-256 remained unchanged during the Test-only correction.
- Frozen final Test SHA-256 is `c38e8cea7ec8567b8007b7e954edbf5fcd92b61310357db72a30450d4118c637`.
- `node --check tools/harness/change-coordinator/coordinator.test.mjs`: PASS.
- `node --check tools/harness/change-coordinator/coordinator.mjs`: PASS.
- `git diff --check`: PASS.
- `node --test tools/harness/change-coordinator/coordinator.test.mjs`: `152/152 PASS`, `0` fail/skip/todo.
- Controller verdict: `GREEN`. No additional Worker work or completion criterion was added.

## Regression and Test Asset Retirement — 2026-08-26

- `node --test tools/harness/change-coordinator/*.test.mjs`: `197/197 PASS`, `0` fail/skip/todo.
- `node --test tools/harness/project-board/*.test.mjs`: `12/12 PASS`, `0` fail/skip/todo.
- `tools/harness/validation/run`: exit `0`.
- Project-control was atomically changed from `TEST_CONFLICT / WORKER_BLOCKED` to `REGRESSION` through the canonical CLI and read back with event `EVT-20260826062918734-L80SK3`; the obsolete blocker was cleared and Test/Worker were both recorded complete.
- Test lifecycle ledger: `TEST-FCR-001`, `TEST-FCR-002`, `TEST-FCR-003`, and `TEST-FCR-004` are permanent regression assets, owned by the FCR requirements and their current admission, review-return, Candidate-chain, and Agent-settlement safety boundaries.
- The old foreign-Change assertion was corrected in place to retain its current Global WIP no-side-effect obligation. No tracked Test was deleted, and no fixture, helper, double, mock, snapshot, coverage entry, or support file was added.
- Review found no `.skip`, `.todo`, `.only`, scratch asset, temporary evidence, obsolete path, or unowned test support asset in the complete Test diff.
- Mandatory `ponytail-review` disposition: `Lean already. Ship.`
- Test Asset Retirement verdict: `PASS`. Nothing is scheduled for deletion before Validator.

## Acceptance Retrospective Evidence — 2026-08-26

- Foundation-only admission escaped because the prior implementation and one old Test leaf both treated a single example Change ID as authority instead of testing an arbitrary valid product Change against the active-slot invariant. The retained FCR-1 empty-slot product admission plus occupied-slot second-Change mutation would have caught it.
- PR review return escaped because prior coverage tested the blocked second-Validator path but not the distinct exact Frozen-Candidate `AWAITING_CONTROLLER -> REVISION -> TEST_RED` path. FCR-2 now covers the positive binding and repository, Worktree, branch, baseline, scope, freeze, Validator, remote, PR and Candidate mismatches.
- Later Candidate publication escaped because prior coverage assumed every Candidate parent and branch publication predecessor was the baseline/empty remote. FCR-3 now exercises a durable prior Candidate, exact old remote Head, non-force update, mismatch stop, first publication, and same-PR reuse.
- Legacy settlement shapes survived because prior tests admitted `NOT_STARTED` through the host settlement union and did not enumerate the canonical START_FAILED/INTERRUPTED variants. FCR-4 now covers the closed variants, extra/legacy rejection, and Coordinator-only pre-request `NOT_STARTED`.
- Actual tracked repair remained within the two frozen paths: one production file and one Test file. Adapter, CLI, fixtures, runner, dependency, schema, public interface, macro state, Ledger event, Gateway, lock, recovery, canonical Spec, and host configuration were not expanded.
- Rework evidence is the final frozen hashes and executable counts above. No follow-up contract or platform expansion is authorized by this retrospective.
