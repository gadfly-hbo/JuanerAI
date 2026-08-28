# Coordinator Regression Pre-DISPATCH Blocker 001

> Evidence ID: `EVD-D1A-008`
>
> Observed: 2026-08-28
>
> Verdict: `BLOCKED_BEFORE_DISPATCH`

## Required path

The activated execution policy requires the signed automatic sequence to pass `Regression and Retirement` before Candidate creation, final validation, Validator, branch push, PR, and Handoff. The Mac mini Host Loop is the sole execution path for this Product Change; bypassing it is forbidden.

## Production mismatch

The production Core and validation gateway are not callable as one complete path at the `REGRESSION` phase:

1. `tools/harness/change-coordinator/coordinator.mjs:131` constructs two internal validation definitions as only `{validation_scope}` and calls `validation.execute` with `state.repository.baseline_sha`.
2. `tools/harness/change-coordinator/production.mjs:334-347` rejects any definition without a non-empty `argv`, absolute `cwd`, positive integer `timeout_ms`, and valid `subject_sha`; it also requires `argv[0]` to equal the pinned Node executable.
3. Therefore the first `AFFECTED_SUITE` call throws `INPUT_INVALID` before returning a Gateway result. The Host Loop cannot advance to `STAGE` or Candidate creation.
4. The hard-coded `subject_sha` is the pre-Change baseline even though regression occurs after Worker edits and before Candidate commit. A signed DISPATCH validation entry cannot repair either defect because the `REGRESSION` branch constructs its own definitions and does not read `payload.validations`.

This is a production composition/Coordinator contract defect, not a missing Desktop test, package, or application implementation.

## Reproduction boundary

No DISPATCH was submitted to reproduce the failure against durable state because the code-level precondition is deterministic and submitting would consume the sole global WIP pointer, run Spec/Test/Worker effects, then strand the Change at a known-unexecutable Gate. The active pointer was re-read as `EMPTY` after all three baseline checkouts were aligned to `9bdb1c6eaa40ff027c2eb7ae7845dd719a2790c9`.

## Scope and authority disposition

Repair requires changes to `tools/harness/change-coordinator/**` and its frozen execution/validation contract. Those paths are outside `CHG-xanthil-desktop-session-bootstrap`; the user explicitly limited authorization to that Change and prohibited unapproved Runtime/shared-contract expansion.

The Controller therefore does not:

- sign or submit the Desktop DISPATCH;
- bypass the Host Loop with direct agents or an alternate worktree;
- reinterpret an exception or baseline-bound validation as Regression PASS;
- add Coordinator files to the Desktop Change;
- install the frozen Desktop dependencies;
- start OpenSpec, Test, Worker, Validator, real data/model calls, or Model Pack work.

## Release condition

`BLK-D1A-008` can close only after a separately authorized, governed Coordinator repair proves in production composition that:

1. both affected-suite and Test Asset Retirement definitions are closed and executable through the pinned validation gateway;
2. regression evidence binds the actual post-Worker subject rather than the pre-Change baseline;
3. failure returns a durable fail-closed Coordinator state instead of an uncaught ingress-level error;
4. the repaired exact head passes focused causal RED/GREEN, canonical regression, independent Validator, integration, Mac mini deployment/readback, and an `EMPTY` pointer canary;
5. the Desktop authority package is regenerated against the repaired integration SHA and all three MacBook/Mac mini/Host Loop baselines plus WIP freshness are re-read.
