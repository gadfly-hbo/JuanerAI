# Dual-device Transition Foundation — Pre-candidate Revision Public-source Proof Delta

## Status and Baseline

- Change: `CHG-change-coordinator-pre-candidate-revision-public-source-proof`
- Authority package: `PCRR-PSP-R2-ROUTE-001`
- Baseline authority: `openspec/specs/dual-device-transition-foundation/spec.md`
- Existing anchors: `AC-DTF-001-01`, `AC-DTF-001-05`, `AC-DTF-001-08`, `AC-DTF-002-05`, `AC-DTF-002-07`, `AC-DTF-003-01`, `AC-DTF-003-04`, `AC-DTF-003-06`, `AC-DTF-007-04..06`

This delta adds no runtime behavior or public/durable vocabulary. It defines the exact adoption identity and executable Test evidence required before already-GREEN pre-Candidate REVISION behavior may be considered for Acceptance.

## Requirements

### PCRR-PSP-REQ-001 — Selective immutable adoption

The Change SHALL adopt only the exact frozen production behavior and Test inheritance bytes, never the mixed physical files or terminated Change authority.

- **PCRR-PSP-AC-001-01 — Production identity:** The production adoption candidate SHALL be `tools/harness/change-coordinator/coordinator.mjs` at SHA-256 `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927`, 196 lines, and 55,683 bytes, reconstructed from clean baseline `64536195f69364f731375ecc19980a9f5e62c004` plus only the PCRR hunks. It SHALL exclude the terminated Candidate validation-definition block, terminated Candidate `testRouteSeed` validation block, independently retained ALC readback one-line hunk, and terminated CICV DISPATCH Ledger idempotency-detail hunk. The 207-line physical production file SHALL NOT be adopted whole.
- **PCRR-PSP-AC-001-02 — Test identity:** Fresh Test SHALL edit only the eighteen existing state-mutation leaves in the current physical `tools/harness/change-coordinator/coordinator.test.mjs`; every other physical byte, including the pre-PCRR `TEST-DTF-R1-005` two-line net DTF/CICV residue, SHALL remain unchanged. The Controller SHALL extract the exact physical preimage/postimage delta and, without a worktree, stage, or commit, apply it in `/private/tmp` or an equivalent untracked isolation directory to the frozen inheritance blob at SHA-256 `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582`, 1,743 lines, and 160,122 bytes. The derived blob SHALL be the final Test adoption candidate. Ambiguous application, residue overlap, `fixtures.mjs`, a second Test path, or whole adoption of the 1,745-line physical Test SHALL block.
- **PCRR-PSP-AC-001-03 — Candidate tree:** Final executable evidence SHALL bind an isolated candidate tree containing the exact production adoption blob, the final Test blob, and clean-baseline bytes for every other path. A physical-worktree run alone SHALL NOT prove adoption. Any later staged production/Test blobs SHALL match the Validator-bound identities exactly; this Requirement itself grants no stage, commit, push, PR, merge, archive, or integration authority.

### PCRR-PSP-REQ-002 — Authentic public source before isolated mutation

The eighteen named state-mutation leaves SHALL prove both the authentic blocked source and the mutated rejection source through the existing four public Coordinator methods in a strict order.

- **PCRR-PSP-AC-002-01 — Real source:** On each Test and Worker route, every leaf SHALL use a real signed DISPATCH, public `run`, public STARTED settlement, and public `RESULT/FAIL` settlement. Test SHALL produce existing `TEST_CAUSAL_RED_UNAVAILABLE / MANUAL_CONTROLLER_STOP`; Worker SHALL produce existing `WORKER_GREEN_FAILURE / REVISION`.
- **PCRR-PSP-AC-002-02 — Source-status barrier:** Immediately after FAIL and before any private-state clone, mutation, `primeState`, or REVISION construction, the leaf SHALL call public `status` and prove exact equality of state, state version, and state hash with the authentic settlement result. Only after that assertion MAY it clone state.
- **PCRR-PSP-AC-002-03 — Mutated-status binding:** The leaf SHALL apply exactly one named state mutation, call existing `primeState` once, then call public `status` and prove exact equality with the primed mutated state/version/hash before constructing a signed REVISION against that public identity.
- **PCRR-PSP-AC-002-04 — Rejection and no effect:** The signed REVISION SHALL reject. Final public status, including outer state/version/hash and payload, SHALL remain exactly equal to the mutated status. State, Ledger, Agent, Worktree, stage, commit, push, validation, PR, and Handoff effects SHALL remain unchanged. The named mutations are exactly wrong blocked reason, wrong route macro, non-null Candidate, non-null delivery, persisted repository root, persisted repository branch, persisted baseline, persisted admission identity, and stale assignment claim across both routes. The existing matrix SHALL remain 63/63 and the focused suite 290/290; no Test ID or leaf is added.

### PCRR-PSP-REQ-003 — Test-evidence-only lifecycle and stop

The Change SHALL close evidence without reopening production implementation or transferring integration authority.

- **PCRR-PSP-AC-003-01 — No Worker:** The production candidate SHALL remain immutable and no Worker SHALL be dispatched. A production defect, candidate mismatch, fixture/third-path need, or contract/schema/helper/source-seam expansion SHALL stop for Controller decision rather than release Worker or widen scope.
- **PCRR-PSP-AC-003-02 — Retirement and independent check:** The Controller SHALL freeze the final Test blob, isolated candidate-tree manifest, exact commands/counts, line-order readback, and PASS Test Asset Retirement Gate before dispatching exactly one fresh read-only Validator. Validator `FAIL` or `BLOCKED` SHALL stop.
- **PCRR-PSP-AC-003-03 — Correction and integration stop:** Fresh Test first-round completion is an operating target, not a hard result budget. An invalid or incomplete Test SHALL return to Test Design with production frozen; a second same-kind correction SHALL return to Controller root-cause review. No Spec/Test/retirement/Validator result grants Acceptance, stage, commit, push, PR, merge, archive, release, or future-Change authority.

## Current Gate

This package passed mandatory ponytail review, Controller Spec Gate, the bounded Test evidence/order/scope Gate, isolated candidate validation, and Test Asset Retirement. The sole fresh Validator remains pending. It claims no Validator result, Acceptance, integration, archive, or release.
