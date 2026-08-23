# Contract Change Request: REC-CONTRACT-003

## Summary

Permit the Test role to update the existing `TEST-XCLI-021` expected root TypeScript file graph so it enforces the already accepted REC-CONTRACT-002 contract: preserve the original 21 paths and append exactly the approved 14 Run & Evidence Console paths.

## Current Conflict

- Path: `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`.
- Test: `TEST-XCLI-021`.
- Current assertion: deep equality against the former exact 21-file `tsconfig.json` object.
- Accepted normative contract: this Change's modified `AC-XTS-001-01` and `AC-XTS-002-03` preserve those 21 entries/options and append exactly the 14 REC-CONTRACT-002 paths.

The new Console implementation is `17/17` GREEN and root typecheck passes, but canonical regression is `244` PASS / `1` FAIL because this frozen assertion still encodes the superseded 21-only graph. The failure contains exactly the accepted 14 additions and no other configuration drift.

## Proposed Test Delta

- Authorize only `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` for the Test role.
- Change only the expected `files` value used by `TEST-XCLI-021`: original 21 entries followed by the exact accepted 14 entries, in their frozen order.
- Preserve every compiler-option assertion and all engine, dependency, no-emit, absent-legacy-path, and other assertions in `TEST-XCLI-021` unchanged.
- Do not edit any current local-analysis production path, writer, Artifact shape, Port, Runtime, Profile, CLI, or producer behavior.
- Do not edit the frozen Run Evidence Console tests or the six-file implementation candidate.

## Compatibility and Test-Asset Lifecycle

This is a test expectation correction for an already accepted additive contract, not a new product behavior or producer-contract change. `TEST-XCLI-021` remains a permanent regression asset and continues to own the exact root TypeScript configuration contract; no test, fixture, helper, or assertion category is retired.

## Validation

- Targeted: canonical `TEST-XCLI-021` passes and still rejects a missing original entry, missing Console entry, extra entry, reorder, or compiler-option change through exact deep equality.
- Focused: all Run Evidence Console tests remain GREEN.
- Typecheck: root strict no-emit typecheck remains GREEN over exactly 35 files.
- Regression: `tools/harness/validation/run` passes with the exact canonical toolchain.
- Scope: only the one named existing test path changes; production and all other current local-analysis paths remain frozen.

## Controller Decision

- status: accepted
- rationale: the user explicitly approved `REC-CONTRACT-003` on 2026-08-23. The Test role may update only the expected `files` list in existing `TEST-XCLI-021` to preserve the original 21 entries and append exactly the accepted 14 Console entries. All other assertions and every production path remain frozen.
