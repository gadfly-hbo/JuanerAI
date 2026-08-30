# Verification Read Model: Change Coordinator Pre-candidate Revision Public-source Proof

## Current Verdict

- Verdict: `ACCEPTED_AND_MERGED_AWAITING_ARCHIVE_MERGE`
- Current Gate: independent Validator, Acceptance, and selective integration `PASS`; archive candidate ready, archive merge pending
- Test execution: Controller independently verified
- Test Asset Retirement Gate: `PASS`
- Validator: independent read-only `PASS`
- Acceptance: explicit user Acceptance bound to the exact production/Test candidates
- Integration: PR #25 squash commit `aae20f2cf4ecf01b80c823f2ac7d7bae68c52dbb`, tree `3dfcb00881a54e3b14f717eef70c7dc8101e206a`
- Archive: candidate prepared under the actual date `2026-08-31`; merge/readback not reached
- Worker: explicitly waived and forbidden

## Frozen References

| Reference | SHA-256 | Lines | Bytes | Disposition |
|---|---:|---:|---:|---|
| repository clean baseline | `64536195f69364f731375ecc19980a9f5e62c004` | n/a | n/a | immutable assembly baseline |
| production adoption candidate | `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927` | 196 | 55,683 | frozen read-only adoption blob |
| current physical production | `6fc85ffe89e94ec36272b86e5a2088d8c7c0527daca29cbd06f486d9d22a801f` | 207 | 57,443 | mixed evidence; never adopt whole |
| Test inheritance candidate | `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582` | 1,743 | 160,122 | isolated delta-application base |
| current physical Test preimage | `0476bd89c8a54ff9df5c378e9de0b9c0fbcbfd8b94433e14366b522c297e3198` | 1,745 | 160,396 | Test edits only eighteen leaves; never adopt whole |
| current physical Test postimage | `a1a3f91d82f1c289efd1349dd1996987f02544385a906fee75d9542ffbe321c2` | 1,761 | 162,204 | exact eighteen-leaf delta plus unchanged excluded residue; never adopt whole |
| derived final Test adoption blob | `c429a21b3c6e1693cb58d44f12e4d4e3444b40c6724289a43805ed38dfb72ef1` | 1,759 | 161,930 | Validator-bound Test candidate |
| `fixtures.mjs` physical observer | `ccc6ac929b8ef2fc8178eae50973043eced7e52d6c72e720274edbd21c0b5151` | 286 | 32,560 | forbidden; not a candidate input |

The production and derived Test adoption hashes above are frozen Controller evidence. The physical Test pre/post delta applies uniquely to the inheritance blob; independently removing the excluded residue from the physical postimage produces the same `c429a2...` bytes.

## Exclusion Readback

Production adoption excludes:

1. terminated Candidate validation-definition expansion;
2. terminated Candidate `testRouteSeed` validation expansion;
3. independently retained ALC readback one-line hunk; and
4. terminated CICV DISPATCH Ledger idempotency-detail hunk.

Test inheritance excludes the pre-PCRR `TEST-DTF-R1-005` two-line net DTF/CICV residue. Test preserves that residue in the physical file. The Controller applies only the extracted eighteen-leaf delta to the frozen inheritance blob in an untracked isolation directory. Ambiguous application, residue overlap, or any additional physical edit blocks.

## Evidence Matrix

| Evidence | Required result | Current status | Release condition |
|---|---|---|---|
| authority/path/hash package | exact baseline, candidates, exclusions, no-Worker waiver, stop lines | PASS | frozen for Validator |
| mandatory ponytail review | complete seven-file package; no speculative mechanism or duplicated future rollback | `Lean already. Ship.` after one bounded contraction | Controller Spec Gate |
| helper/preflight health | independent construction and four-method observer health | PASS | frozen |
| production behavior | exact adoption candidate preserves already-GREEN behavior | PASS in exact isolated candidate tree | frozen |
| Test evidence-order defect | nine state mutations previously cloned/primed before source-status proof | corrected only in the shared state-mutation branch | frozen |
| physical-to-adoption delta | only eighteen leaves changed; all other physical bytes stable; delta applies uniquely to frozen inheritance | PASS; derived `c429a2...` | frozen |
| eighteen-leaf public proof | exact order and identity on Test + Worker routes | Controller line-by-line and executable PASS | frozen |
| matrix count | `63/63`, zero fail/skip/todo | PASS | frozen |
| focused count | `290/290`, zero fail/skip/todo | PASS | frozen |
| related retention regression | physical-worktree production `31/31`; Git integration `40/40` | PASS | frozen |
| canonical validation | exit 0 from approved offline harness | PASS on isolated candidate | frozen |
| Test Asset Retirement | reconciled lifecycle ledger and complete Test diff | PASS; `Lean already. Ship.` | frozen |
| independent verification | exact candidate, public proof, scope, counts, exclusions, and non-authorization | PASS | frozen independent verdict |
| selective integration | exact 20-path manifest, two candidate blobs, isolated validation, excluded residue continuity | PASS; PR #25 merged exact tree | frozen merge evidence |

## Required Controller Order Readback

The Controller must inspect all eighteen final leaves and record this exact strict order:

```text
settle FAIL < source status < clone < mutate < primeState
< mutated status < REVISION rejection < final status/effects
```

For both status calls, the state, version, and hash must bind the relevant authentic or mutated source. Final status equality covers outer identity and payload. Payload-only comparison is insufficient.

## Planned Commands

```text
node --check tools/harness/change-coordinator/coordinator.test.mjs
node --check tools/harness/change-coordinator/coordinator.mjs
node --test --test-name-pattern='TEST-PCRR-004/005' tools/harness/change-coordinator/coordinator.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
git diff --check
```

The matrix, focused suite, syntax checks, and canonical validation ran from `/private/tmp/pcrr-psp-candidate.YS3pO2`, assembled from baseline `64536195f69364f731375ecc19980a9f5e62c004` plus only the two frozen adoption blobs. A clean baseline-tree comparison reported exactly `coordinator.mjs` and `coordinator.test.mjs` different. The first canonical attempt failed only because a diagnostic `node_modules` symlink violated the canonical project-local dependency assertion; replacing it with an ordinary local copy and changing no candidate source produced exit `0`. Related `31/31` and `40/40` retention regressions ran in the physical worktree and do not substitute for candidate evidence.

## Test Asset Retirement Gate

The frozen retirement evidence shows:

- existing `TEST-PCRR-004/005` and all 62 leaves remain permanent regression assets;
- only eighteen existing leaves changed evidence order/identity assertions;
- no new Test ID, helper, fixture, double, mock, snapshot, coverage entry, or tracked diagnostic exists;
- the pre-PCRR two-line residue is unchanged in the physical Test and absent from the final adoption candidate;
- no duplicate/equivalent leaf lacks a distinct existing consumer;
- no skip/todo/only/temp/correction marker remains; and
- the complete Test diff simplification review returned `Lean already. Ship.` and the Controller Gate returned `PASS`.

## Final Check and Merge Evidence

One fresh Test role produced the bounded delta. Controller executable, line-order, scope, candidate-isolation, and retirement Gates froze the final Test blob and exact candidate tree. The fresh independent Validator returned `PASS`. The user then separately authorized Acceptance, exact selective staging, one integration commit, PR #25, and one squash merge. The merged tree is exactly `3dfcb00881a54e3b14f717eef70c7dc8101e206a`; production/Test Git OIDs remain `55ac2d06baac6c8b86e416551e4ab09215508bb3` and `fc85353da40da28a2be45a285c216b60f0c0b21d`; 331 terminated/mixed retention paths were excluded.

## Archive Non-authorization

The completed integration approvals do not authorize archive staging, commit, push, PR, merge, final `ARCHIVED` state, local-main synchronization, branch deletion, release, future Candidate work, or cleanup. Canonical mapping is complete with zero canonical bytes changed: replay/binding, settlement, and pre-Candidate REVISION behavior remain anchored by `AC-DTF-001-03`, `AC-DTF-002-05`, `AC-DTF-003-01/04/06`, and the closed Foundation Design disposition table.
