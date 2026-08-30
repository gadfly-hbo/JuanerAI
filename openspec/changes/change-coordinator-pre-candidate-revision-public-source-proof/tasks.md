# Tasks: Change Coordinator Pre-candidate Revision Public-source Proof

## Current Status

- Change: `CHG-change-coordinator-pre-candidate-revision-public-source-proof`
- Authority package: `PCRR-PSP-R2-ROUTE-001`
- Current Gate: Test evidence and retirement `PASS`; Validator pending
- Completed Gates: mandatory ponytail review, Controller Spec Gate, Test evidence/order/scope Gate, isolated candidate validation, and Test Asset Retirement Gate
- Worker route: explicitly waived and forbidden
- Integration authority: absent

## Ordered Tasks

| Task | Owner / release Gate | Output | Maps |
|---|---|---|---|
| `TASK-PCRR-PSP-001` | Controller before Spec Gate | read back authority, clean baseline, both adoption identities, excluded blocks/residue, path ceilings, no-Worker waiver, and integration stop | all ACs |
| `TASK-PCRR-PSP-002` | Spec support | complete seven-file package without claims of Gate or Test execution | all ACs |
| `TASK-PCRR-PSP-003` | Controller | apply any required complexity review, then issue Spec Gate PASS or return the package to Spec | all ACs |
| `TASK-PCRR-PSP-004` | fresh `juaner_test` after Spec Gate PASS | helper health plus exact physical Test preimage and frozen adoption-input readback | AC-001-01..03; AC-003-01 |
| `TASK-PCRR-PSP-005` | same Test role | edit only the eighteen existing physical leaves while preserving every other physical byte | AC-002-01..04 |
| `TASK-PCRR-PSP-006` | Controller | extract the exact preimage/postimage delta, apply it uniquely to the frozen Test inheritance blob in an untracked isolation directory, then freeze the derived blob and run order/executable/scope checks | AC-001-02..03; AC-002-01..04; AC-003-01 |
| `TASK-PCRR-PSP-007` | Controller | Test Asset Retirement Gate over the complete Test diff and lifecycle ledger | AC-003-02 |
| `TASK-PCRR-PSP-008` | fresh `juaner_validator` after evidence freeze | sole independent read-only verdict against the exact isolated adoption candidate | all ACs |
| `TASK-PCRR-PSP-009` | Controller only after Validator PASS | acceptance decision; any integration remains a separately authorized action | AC-001-03; AC-003-03 |

There is no Worker task. Discovery of a production defect does not insert one; it stops this Change for Controller decision.

Tasks 001..007 are complete. Task 008 is the sole next release; Task 009 remains locked.

## Gate Order

```text
SPEC_DRAFT
-> Controller authority/hash/scope readback
-> Spec Gate PASS
-> fresh Test preflight and exact physical preimage freeze
-> eighteen-leaf physical order/identity correction only
-> Controller exact-delta extraction and isolated application to frozen inheritance blob
-> Controller line-by-line order Gate
-> exact candidate-tree validation
-> Test Asset Retirement Gate PASS
-> evidence/hash freeze
-> one fresh independent Validator PASS
-> Controller Acceptance decision
-> separately authorized integration, if any
```

No Gate is inferred. Any Test edit invalidates the Test hash and repeats the Controller order, executable, and retirement checks. Any candidate-tree mismatch invalidates all executable evidence. Validator `FAIL` or `BLOCKED` stops.

## Test Ownership and Path

Fresh Test may write only:

- `tools/harness/change-coordinator/coordinator.test.mjs`

Before writing, Test must confirm the physical file is SHA-256 `0476bd89c8a54ff9df5c378e9de0b9c0fbcbfd8b94433e14366b522c297e3198`. Test edits only the eighteen existing leaves and preserves every other physical byte. It does not remove the excluded residue or rewrite the file from the frozen inheritance blob. The Controller alone extracts the exact physical delta and applies it in `/private/tmp` or equivalent untracked isolation to SHA-256 `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582`. Ambiguous application or residue overlap is `BLOCKED`. `fixtures.mjs` is forbidden, not conditional.

## Planned Validation Commands

Run from the isolated candidate tree whose production/Test identities are frozen:

```text
node --check tools/harness/change-coordinator/coordinator.test.mjs
node --check tools/harness/change-coordinator/coordinator.mjs
node --test --test-name-pattern='TEST-PCRR-004/005' tools/harness/change-coordinator/coordinator.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
git diff --check
```

Controller independently observed matrix `63/63`, focused Coordinator `290/290`, related production `31/31`, Git integration `40/40`, syntax PASS, canonical validation exit `0`, and `git diff --check` PASS. The frozen isolated candidate uses production SHA-256 `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927` and derived Test SHA-256 `c429a21b3c6e1693cb58d44f12e4d4e3444b40c6724289a43805ed38dfb72ef1`.

## Root-cause Returns

| Finding | Return | Production |
|---|---|---|
| helper/environment failure | Test preflight / environment restoration | frozen |
| invalid ordering assertion or Test construction | Test Design | frozen |
| second same-kind Test correction | Controller root-cause review | frozen |
| production failure or candidate mismatch | Controller decision; this Change blocks | immutable |
| fixture/third path/contract/schema/helper need | owning earlier Gate / user decision | immutable |
| Validator FAIL/BLOCKED | Controller stop | immutable |

An invalid or incomplete first Test return SHALL return to Test Design. A second same-kind correction returns to Controller root-cause review.

## Integration Stop

No task here authorizes stage, commit, push, PR, merge, archive, branch deletion, or canonical-spec merge. If later authorized, the Controller must prove the staged production blob equals the frozen production adoption identity and the staged Test blob equals the final Validator-bound Test identity; whole-file staging from the mixed physical worktree is forbidden.
