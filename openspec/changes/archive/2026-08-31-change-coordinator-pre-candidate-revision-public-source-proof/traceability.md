# Traceability: Change Coordinator Pre-candidate Revision Public-source Proof

## Current Status

- Current verdict: `ACCEPTED_AND_MERGED_AWAITING_ARCHIVE_MERGE`
- Current Gate: independent Validator, Acceptance, and selective integration `PASS`; archive candidate ready, archive merge pending
- Validator: independent `PASS`; Acceptance: explicit; integration: PR #25 squash commit `aae20f2cf4ecf01b80c823f2ac7d7bae68c52dbb`; archive: not yet merged
- Production: immutable adoption candidate; no Worker authority

## Requirement / Test / Task / Code / Result Map

| Requirement / AC | Test evidence | Tasks | Code/evidence seam | Current result |
|---|---|---|---|---|
| `PCRR-PSP-AC-001-01` exact production identity and exclusions | candidate manifest/hash readback | 001, 004, 006, 008 | read-only `coordinator.mjs` adoption blob | PASS; exact blob merged |
| `PCRR-PSP-AC-001-02` physical Test delta and derived adoption blob | physical pre/post delta plus isolated apply/hash readback | 001, 004..008 | eighteen leaves in `coordinator.test.mjs` only | PASS; exact blob merged |
| `PCRR-PSP-AC-001-03` isolated candidate tree and no whole-file adoption | candidate-tree manifest plus scope review | 004, 006, 008, 009 | clean baseline plus two exact blobs | PASS; tree `3dfcb008…206a` merged |
| `PCRR-PSP-AC-002-01` authentic Test/Worker public FAIL sources | existing `TEST-PCRR-004/005`, 18 leaves | 005, 006, 008 | four public methods | 63/63 and Validator PASS |
| `PCRR-PSP-AC-002-02` source status before clone and exact source identity | same 18 leaves plus line-order Gate | 005, 006, 008 | existing status and Test setup | Controller line-order and Validator PASS |
| `PCRR-PSP-AC-002-03` exactly one mutation and second public identity | same 18 leaves plus line-order Gate | 005, 006, 008 | existing `primeState` after source status | Controller line-order and Validator PASS |
| `PCRR-PSP-AC-002-04` rejection, unchanged final status, zero effects, fixed counts | matrix 63/63; focused 290/290 | 005..008 | existing revision/effect assertions | PASS and merged unchanged |
| `PCRR-PSP-AC-003-01` no Worker and closed paths | scope/diff/dispatch readback | 001, 004..008 | no production write | PASS |
| `PCRR-PSP-AC-003-02` retirement and sole Validator | lifecycle ledger and fresh verdict | 007, 008 | Test diff / read-only candidate | retirement and Validator PASS |
| `PCRR-PSP-AC-003-03` stop and integration non-authorization | Controller decision/readback | 001, 006, 009 | lifecycle evidence | separate Acceptance/integration approvals completed; archive locked |

## Canonical Baseline Anchors

| PSP obligation | Existing Foundation anchors |
|---|---|
| four public methods and read-only status | `AC-DTF-001-01`; `AC-DTF-001-05`; `AC-DTF-001-08` |
| exact settlement and failed Agent preservation | `AC-DTF-002-05`; `AC-DTF-002-07` |
| signed same-scope pre-Candidate REVISION | `AC-DTF-003-01`; `AC-DTF-003-04`; `AC-DTF-003-06` |
| forbidden side effects and no new vocabulary | `AC-DTF-007-04..06` |

The terminated PCRR Test IDs and hunks identify inherited evidence bytes only. Normative authority comes from the current user package, Constitution, canonical baseline, and this new delta.

## Path and Ownership Map

| Owner | Writable path | Everything else |
|---|---|---|
| Spec | `openspec/changes/change-coordinator-pre-candidate-revision-public-source-proof/**` | read-only/forbidden |
| Test after Spec Gate | `tools/harness/change-coordinator/coordinator.test.mjs` | forbidden, including `fixtures.mjs` and production |
| Worker | none; no dispatch | forbidden |
| Validator | none | read-only |
| Controller | Gates and later decisions only | no integration without separate authority |

## Evidence Invalidation Rules

- Any material OpenSpec correction repeats Controller package review and Spec Gate.
- Any Test edit changes the frozen Test identity and repeats line-order, executable, scope, and Test Asset Retirement Gates.
- Any production byte change invalidates the no-Worker waiver and blocks this Change.
- Any mismatch from production SHA-256 `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927` invalidates all adoption evidence.
- Any candidate tree using the physical mixed production or Test file invalidates all executable evidence.
- Any physical Test change outside the eighteen leaves, ambiguous delta application, or overlap with the excluded residue invalidates Test release.
- Any matrix/focused count change, new Test ID/helper/fixture, or weakened leaf invalidates Test release.
- Any candidate-tree or evidence change after Validator dispatch invalidates the verdict.
- Historical terminated verdicts remain preserved and cannot become current authority.

## Archive Mapping

Fresh Validator PASS, explicit Acceptance, and separately authorized integration completed. The existing canonical anchors fully cover the adopted runtime behavior, so the canonical spec remains 129 lines at SHA-256 `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`; the archive delta is zero bytes. This candidate is located at `openspec/changes/archive/2026-08-31-change-coordinator-pre-candidate-revision-public-source-proof/`, using the actual preparation date. It remains `AWAITING_ARCHIVE_MERGE`, not `ARCHIVED`.
