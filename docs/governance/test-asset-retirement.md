# Test Asset Retirement

Use this policy for every Change that adds, changes, or removes tracked tests, fixtures, helpers, doubles, mocks, snapshots, coverage maps, or test harness code. It governs test assets only; it does not authorize product-source cleanup or a full-repository dead-code program.

## Principle

A passing test is not a deletion signal. Keep every test that protects a current Requirement, Acceptance Criterion, contract, regression, boundary, failure, or forbidden side effect. Retire only assets whose evidentiary purpose has ended or moved elsewhere.

Temporary diagnostic probes belong in `/private/tmp` by default. They may help diagnosis but do not replace the tracked tests and frozen evidence required for RED, GREEN, regression, or traceability.

## Lifecycle Ledger

At TDD_READY, the Test role classifies every added, changed, or planned-retirement test asset:

| Class | Meaning | Required disposition |
|---|---|---|
| permanent regression | protects a current REQ/AC, contract, regression, boundary, failure, or forbidden side effect | retain with its current evidence owner |
| temporary evidence | diagnostic probe or intermediate mechanics with no lasting behavior obligation | keep outside the repository by default; remove any tracked copy before verification |
| retirement candidate | replaced duplicate, obsolete format/path check, correction intermediate, or asset without a retained consumer | remove before verification or return a blocker |

The ledger records the path or TEST ID, class, REQ/AC or diagnostic purpose, retained consumer or successor, and planned final disposition. A causal RED normally becomes permanent regression coverage after GREEN; completing the implementation does not make it temporary.

## Test Asset Retirement Gate

After GREEN and required regression, and before implementation/evidence freeze for independent verification, the Controller:

1. Reconciles the lifecycle ledger with the complete test-asset diff.
2. Runs `ponytail-review` over that complete diff as the first simplification audit and records every finding or `Lean already. Ship.`.
3. Confirms each permanent asset has a current evidence owner and distinct risk, boundary, mutation, or failure purpose.
4. Confirms each removed test is either diagnostic-only and absent from formal traceability, or names the retained TEST/path that continues to cover the same REQ/AC and material mutation.
5. Confirms every retained fixture, helper, double, mock, snapshot, coverage entry, and harness path has a retained consumer.
6. Inspects `skip`, `todo`, `only`, temporary/scratch/correction markers, obsolete formats and paths, and equivalent AC/input/assertion combinations. These are review signals, not automatic deletion rules; an approved gate or distinct risk may justify retention.
7. Records the final ledger, retirement decisions, affected commands and counts, ponytail disposition, and `PASS` or `FAIL` verdict.

If cleanup is required, production stays frozen and the Controller returns only the named test paths to the Test role. After removal, rerun the affected test and regression commands, then repeat this Gate. The Worker does not edit tests to obtain a retirement PASS.

## Retirement Proof

A deletion is safe only when current executable evidence remains complete. For each removed asset, prove one of:

- a retained test continues the same REQ/AC and material mutation coverage;
- a retained consumer no longer needs the removed fixture/helper because the consumer was updated within the approved test-only scope; or
- the asset was diagnostic-only, never part of accepted coverage or traceability, and no tracked consumer remains.

Coverage percentage, age, a passing result, or a filename alone is insufficient proof. A test that enforces the absence of a retired path remains permanent when that absence is a current approved contract.

## Independent Verification

For a Change that touched test assets, the Validator treats the retirement Gate as required frozen input. It independently checks the ledger against the tree, traceability, consumers, and executable evidence.

The Validator returns FAIL to the Test Asset Retirement Gate when any of these remains:

- tracked temporary evidence or an unresolved retirement candidate;
- a removed behavior test without a retained coverage successor;
- a fixture, helper, double, mock, snapshot, coverage entry, or harness path without a retained consumer;
- equivalent tests with no distinct current evidence purpose; or
- a test that only describes a retired implementation, format, error, or toolchain and maps to no current approved contract.

The Validator remains read-only and reports the exact asset, missing owner or successor, and recheck condition.

## Initial Mechanism Boundary

This first version uses the lifecycle ledger, existing `ponytail-review`, Controller Gate, and Validator checklist. It creates no dedicated tombstone-review Skill, automatic deletion, persistent registry, background scan, or repository-wide cleanup authority. Reassess a dedicated tool or Skill only after several Changes provide repeated, classifiable misses that the manual Gate cannot reliably catch.
