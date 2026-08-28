# Xanthil Desktop Current-baseline Attestation

> Attestation ID: `D05-XD-BASELINE-001`
> Observed baseline: `2a59fc7cc964ee7d966e91339eb475cb81d02b77`
> Date: 2026-08-28
> Purpose: close the ADR 0002 prerequisite for D0.5 planning only

## Disposition

The TypeScript migration required by ADR 0002 is complete at the observed baseline. It is not part of `CHG-xanthil-desktop-session-bootstrap` and does not block that candidate from entering D1-A after D0.5 user approval.

## Repository evidence

- `CHG-xanthil-typescript-migration` is archived at `openspec/changes/archive/2026-08-22-xanthil-typescript-migration/` with `ARCHIVE_COMPLETE`, fresh Validator 004 PASS, Controller acceptance, current-spec publication, and post-archive canonical regression exit `0` recorded in `verification.md`.
- `openspec/specs/local-analysis/spec.md` names `CHG-xanthil-typescript-migration` as a source Change and publishes the accepted native-TypeScript requirements.
- The current production graph under `packages/`, `adapters/`, `profiles/`, and `apps/` uses `.ts` for the migrated Xanthil owners; no former migrated `.mjs` owner is present.
- The current baseline contains `tsconfig.json` and the exact TypeScript toolchain in the root package/lock contract.
- On 2026-08-28 the Controller ran `tools/harness/validation/run` on the D0.5 branch from this baseline; typecheck, deterministic suites, and project-control checks exited `0`. No real model/provider gate was enabled.

## Boundary

This attestation establishes only that the mandatory language migration precedes the proposed second business slice. It does not approve Electron, persistence, Python, Runtime, schema, dependencies, tests, implementation, DISPATCH, or the first Product Change.
