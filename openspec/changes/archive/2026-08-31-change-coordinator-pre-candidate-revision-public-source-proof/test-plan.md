# Test Plan: Change Coordinator Pre-candidate Revision Public-source Proof

## Status and Isolation

- Status: bounded Test delta, Controller order/scope/executable Gate, Test Asset Retirement Gate, and independent Validator `PASS`; accepted selective candidate merged by PR #25.
- Test owner after Spec Gate: one fresh `juaner_test`.
- Only write path: `tools/harness/change-coordinator/coordinator.test.mjs`.
- Production candidate: frozen and read-only.
- `fixtures.mjs`: forbidden without exception.
- Worker: not dispatched.
- Live Agent, model, provider, network, GitHub, credential, host, project-control, publication, and integration effects: forbidden.

## Minimal Test Feasibility Matrix

| Layer | Question | Required evidence | Failure meaning |
|---|---|---|---|
| preflight/helper observer health | Can the existing deterministic harness construct the four-method Coordinator and observe DISPATCH/run/settlement/status without relying on the target assertion? | helper health and existing public-route observers pass independently | environment, helper, or Test construction defect; return to Test Design |
| frozen production behavior | Does the exact 196-line production adoption candidate retain the already-GREEN signed pre-Candidate REVISION behavior? | inherited GREEN is an input; final validation must bind the exact production blob in the isolated candidate tree | production candidate mismatch or defect; stop for Controller decision, no Worker |
| current Test evidence-order defect | Do the nine state mutations currently clone/mutate before public status proves the authentic source? | source inspection and first Test readback identify the missing source-status-before-clone and exact identity assertions | Test evidence defect only; production remains immutable |
| final public-method proof | Does every one of the eighteen leaves establish authentic public source, mutate only afterward, bind the mutated public identity, reject REVISION, and preserve final status/effects? | exact order audit plus executable matrix `63/63` and focused `290/290` from the frozen candidate tree | an invalid or incomplete Test SHALL return to Test Design; a second same-kind correction triggers Controller root-cause review |

This Change has no production RED requirement. The intended production behavior is already GREEN; the missing artifact is admissible Test evidence. A failing production assertion is not a release to Worker.

## Physical Delta and Inherited Test Contract

Before Test writes, the current physical Test must match:

- SHA-256 `0476bd89c8a54ff9df5c378e9de0b9c0fbcbfd8b94433e14366b522c297e3198`
- `1,745` lines
- `160,396` bytes

Test edits only the eighteen existing leaves. All other physical bytes remain identical. The Controller extracts the exact physical preimage/postimage delta and applies it in `/private/tmp` or equivalent untracked isolation to:

- SHA-256 `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582`
- `1,743` lines
- `160,122` bytes

The delta must apply uniquely, must not touch the excluded two-line residue, and must produce one frozen final Test adoption blob. No worktree, stage, or commit is used for extraction or isolated application. The final blob retains the existing `TEST-PCRR-004/005` parent and all 62 leaves. It adds no Test ID, subtest, fixture, helper, double, mock, snapshot, coverage entry, source scan, skip, todo, only marker, or temporary tracked asset.

## Eighteen-leaf Matrix

| Mutation | Test route | Worker route | Required public source |
|---|---:|---:|---|
| wrong blocked reason | 1 | 1 | authentic route-specific FAIL then status |
| wrong route macro | 1 | 1 | authentic route-specific FAIL then status |
| non-null Candidate | 1 | 1 | authentic route-specific FAIL then status |
| non-null delivery | 1 | 1 | authentic route-specific FAIL then status |
| persisted repository root | 1 | 1 | authentic route-specific FAIL then status |
| persisted repository branch | 1 | 1 | authentic route-specific FAIL then status |
| persisted baseline | 1 | 1 | authentic route-specific FAIL then status |
| persisted admission identity | 1 | 1 | authentic route-specific FAIL then status |
| stale assignment claim | 1 | 1 | authentic route-specific FAIL then status |
| total | 9 | 9 | 18 leaves |

## Required Leaf Assertions

Before clone/mutation, each leaf proves:

- real signed DISPATCH and the exact Test or Worker public route;
- STARTED and `RESULT/FAIL` settlement;
- Test route: `TEST_CAUSAL_RED_UNAVAILABLE / MANUAL_CONTROLLER_STOP`;
- Worker route: `WORKER_GREEN_FAILURE / REVISION`;
- immediate public status with exact equality to settlement `state`, `state_version`, and `state_hash`;
- existing status payload has the authentic blocked state, null phase, null Candidate/delivery, and cleared pending action.

After exactly one mutation and `primeState`, each leaf proves:

- second public status equals the primed mutated `state`, `state_version`, and `state_hash`;
- the existing payload reflects every publicly visible part of the mutation;
- REVISION is constructed from the second status identity and is rejected;
- final public status, including outer identity and payload, equals the second status exactly; and
- State/Ledger/Agent/Worktree/stage/commit/push/validation/PR/Handoff counters are unchanged after the rejection.

## Controller Source-order Gate

For all eighteen leaves, the Controller reads the final Test source line by line and records whether this strict order holds:

```text
settle FAIL < source status < clone < mutate < prime
< mutated status < REVISION rejection < final status/effects
```

The Gate fails if a helper hides the order, if any clone occurs before source status, if more than one mutation is applied, if the REVISION uses settlement/prime identity without the second public status binding, or if the final assertion compares payload only.

## Planned Commands

From the exact isolated candidate tree:

```text
node --check tools/harness/change-coordinator/coordinator.test.mjs
node --check tools/harness/change-coordinator/coordinator.mjs
node --test --test-name-pattern='TEST-PCRR-004/005' tools/harness/change-coordinator/coordinator.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
git diff --check
```

Controller independently read back matrix `63/63` and focused `290/290`, each with zero fail/skip/todo, from the exact isolated adoption candidate. Related physical-worktree retention regressions were production `31/31` and Git integration `40/40`; canonical validation on the isolated candidate exited `0` after replacing a diagnostic `node_modules` symlink with an ordinary project-local dependency copy.

The accepted staged candidate retained production SHA-256 `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927` / Git OID `55ac2d06baac6c8b86e416551e4ab09215508bb3` and Test SHA-256 `c429a21b3c6e1693cb58d44f12e4d4e3444b40c6724289a43805ed38dfb72ef1` / Git OID `fc85353da40da28a2be45a285c216b60f0c0b21d`. Its 20-path manifest was `2f4356b12ffee83f1a142f060ceb2c19d4c72875b5572e27637ff859954d8cb8`, its tree was `3dfcb00881a54e3b14f717eef70c7dc8101e206a`, and PR #25 merged that exact tree without adopting the 331 excluded retention paths.

## Test Asset Retirement Lifecycle Ledger

| Asset | Class | Consumer | Final disposition |
|---|---|---|---|
| existing `TEST-PCRR-004/005` parent | permanent regression | public-source authority matrix | retain |
| nine Test-route state-mutation leaves | permanent regression | authentic Test failure source and mutated-state rejection | retain |
| nine Worker-route state-mutation leaves | permanent regression | authentic Worker failure source and mutated-state rejection | retain |
| remaining 44 inherited request/preparation leaves | permanent regression | existing distinct authority/evidence/CAS failures | retain unchanged |
| new helper/fixture/Test ID | forbidden | none | do not create |
| temporary diagnostics | temporary evidence | diagnosis only | `/private/tmp` only; never trace or track |
| pre-PCRR `TEST-DTF-R1-005` two-line residue | excluded historical residue | none in this Change | unchanged in physical Test; absent from inheritance and final adoption candidate |

Controller reconciled the exact Test diff with this ledger, ran the complete-diff simplification review (`Lean already. Ship.`), checked consumers and equivalent assertions plus skip/todo/only/temp markers, and recorded Test Asset Retirement `PASS` before Validator freeze.

## Stop Lines

An invalid or incomplete Test SHALL return to Test Design. Any production edit, fixture/helper/third-path need, contract expansion, count inflation, ambiguous delta application, residue overlap, second same-kind Test correction, or Validator FAIL/BLOCKED stops for Controller decision.
