# Proposal: Change Coordinator Pre-candidate Revision Public-source Proof

## Identity and Current Gate

- Change: `CHG-change-coordinator-pre-candidate-revision-public-source-proof`
- Authority package: `PCRR-PSP-R2-ROUTE-001`
- Repository baseline: `64536195f69364f731375ecc19980a9f5e62c004`
- Change class: R2 Test-evidence-only adoption correction; no production behavior or contract delta
- Current verdict: `TEST_EVIDENCE_FROZEN_PENDING_VALIDATOR`
- `greenfield_fast_path`: forbidden

This Change adopts only an immutable production candidate whose pre-Candidate REVISION behavior is already GREEN but unaccepted, then repairs the order and identity strength of eighteen existing public-source Test leaves. It does not reopen `change-coordinator-pre-candidate-revision-routing` (PCRR) or any of the four terminated Candidate Changes. Those Changes are historical evidence only.

Controller completed the mandatory ponytail review and full-package readback; Spec Gate is `PASS`. The bounded Test delta, isolated adoption candidate, executable evidence, and Test Asset Retirement Gate are `PASS` and frozen. No Validator, Acceptance, or integration result is claimed by this package.

## Objective

For each of nine persisted-state mutations on both the Test and Worker routes, prove that the mutation is derived only after the authentic blocked source has been established and read through the public Coordinator surface:

```text
DISPATCH -> run -> STARTED -> RESULT/FAIL
-> public status of the authentic source
-> clone -> exactly one mutation -> primeState
-> public status of the mutated state
-> signed REVISION rejection
-> unchanged final public status and zero forbidden effects
```

The final Test evidence must bind the public source and mutated source by exact state, state version, and state hash. It must not rely on a settlement return alone, clone private state before the source status, or compare only the final status payload.

## Frozen Adoption Identities

### Production

The sole production adoption candidate is clean repository baseline plus only the PCRR production hunks:

- path: `tools/harness/change-coordinator/coordinator.mjs`
- SHA-256: `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927`
- lines: `196`
- bytes: `55,683`

The current physical file is mixed and non-authoritative:

- SHA-256: `6fc85ffe89e94ec36272b86e5a2088d8c7c0527daca29cbd06f486d9d22a801f`
- lines: `207`
- bytes: `57,443`

The production candidate excludes exactly these four non-PCRR blocks:

1. terminated Candidate validation-definition expansion;
2. terminated Candidate `testRouteSeed` validation expansion;
3. the independently retained ALC readback one-line hunk, which is not owned by this Change; and
4. the terminated CICV DISPATCH Ledger idempotency-detail hunk.

No role may adopt, copy, stage, or validate the current physical production file as if it were the production candidate.

### Test

The frozen Test inheritance candidate excludes the pre-PCRR `TEST-DTF-R1-005` two-line net DTF/CICV residue:

- path: `tools/harness/change-coordinator/coordinator.test.mjs`
- SHA-256: `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582`
- lines: `1,743`
- bytes: `160,122`

The current physical Test is termination evidence and must not be adopted whole:

- SHA-256: `0476bd89c8a54ff9df5c378e9de0b9c0fbcbfd8b94433e14366b522c297e3198`
- lines: `1,745`
- bytes: `160,396`

Fresh Test edits only the eighteen existing state-mutation leaves in the current physical `coordinator.test.mjs`; every other physical byte, including the excluded residue, must remain unchanged. The Controller captures the exact Test preimage and postimage, extracts only that order/identity delta, and applies it in `/private/tmp` or an equivalent untracked isolation directory to the frozen inheritance candidate. The resulting blob, not the physical file, becomes the final Test adoption candidate. If the delta cannot be applied uniquely or touches the excluded residue, the Change is `BLOCKED`.

## Scope and Ownership

### Spec write scope

- `openspec/changes/change-coordinator-pre-candidate-revision-public-source-proof/**`

### Eventual Test write scope

- `tools/harness/change-coordinator/coordinator.test.mjs`

### Read-only adoption input

- the exact production candidate identified above at `tools/harness/change-coordinator/coordinator.mjs`
- the canonical `openspec/specs/dual-device-transition-foundation/spec.md`
- the approved retrospective `docs/retrospectives/2026-08-29-coordinator-test-worker-iteration-routing.md`
- the terminated PCRR package as historical evidence only

### Forbidden paths

- `tools/harness/change-coordinator/fixtures.mjs` without exception;
- every production, adapter, composition, host-loop, integration-Test, Candidate-Test, governance, role, template, project-control, canonical-spec, dependency, configuration, and product path outside this Change directory and the one eventual Test path;
- the terminated PCRR and Candidate Change directories.

## No-Worker Waiver

The explicit no-Worker waiver is part of the frozen Change authority: production behavior is already GREEN, the production candidate bytes are immutable, and this Change changes Test evidence only. No `juaner_worker` dispatch, production edit, or TDD production RED is permitted.

The waiver ends immediately if evidence requires any production change, production Test seam, helper/fixture change, additional path, or contract expansion. That condition is `BLOCKED` for Controller decision; it does not release a Worker.

## Non-goals

- no new helper, fixture, public method, State or Event field, blocked reason, action, Gateway, dependency, retry, recovery, network effect, persistent authority, source seam, or Test ID;
- no Candidate, validation-ordering, publication, PR, Handoff, archive, release, host, or activation change;
- no Test-count inflation: the matrix remains `63/63` and the focused Coordinator suite remains `290/290` when executed successfully;
- no adoption of the full physical production or Test files;
- no branch, stage, commit, push, PR, merge, archive, or integration authority.

## Risk and Evidence Level

R2 evidence is required because the proof protects signed correction admission, original authority, persisted state identity, and forbidden side effects across Test and Worker routes. The final proof must be executable through the four existing public methods and must be independently verified from the exact frozen adoption candidates.

## Stop Line

Stop for Controller decision if any of the following is required or observed:

- a production defect or any change to the frozen production candidate;
- `fixtures.mjs`, another Test/support path, or a third evidence path;
- a new contract, source seam, helper, field, method, Gateway, dependency, retry, recovery, network, or persistent authority;
- inability to reconstruct either frozen adoption candidate exactly;
- a count other than matrix `63/63` or focused `290/290` after the final Test bytes are frozen;
- a second same-kind Test correction;
- Validator `FAIL` or `BLOCKED`.

This Change grants no integration authority. Even after Validator PASS, Acceptance and any selective staging or commit remain separate Controller decisions.
