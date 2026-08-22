# Contract Change Request: REC-CONTRACT-005

## Summary

Align Console `1.0` terminal projection with the current mainline local-analysis compatibility contract after Runtime provenance neutralization: legacy Artifact `1.0 in_progress` is rejected as `RUN_READ_FAILED`; only exact terminal `failed` and `cancelled` Runs yield `verified_non_success`.

## Current Conflict

The archived Console `AC-REC-003-02` labelled an admitted `in_progress` Run as an `abandoned candidate`. After `origin/main` accepted and merged Runtime provenance neutralization, local-analysis `AC-XCLI-016-02` and its shared terminal-read validator explicitly reject legacy `1.0 in_progress` without terminal projection. Delivery-time merge validation was therefore RED only for the two old Console `in_progress` expectations.

## Accepted Contract Delta

- `failed` and `cancelled` remain the only `verified_non_success` statuses.
- Legacy Artifact `1.0 in_progress` returns the existing exact rejected envelope with `RUN_READ_FAILED`.
- The `abandoned candidate` label is removed from the runtime View and public status-detail type.
- Console continues to accept only Artifact `1.0`; this decision does not add Manifest `2.0` viewing.
- Production reuses the mainline `validateReadableTerminalRunManifest` boundary. No Console-private decoder, shared codec, Runtime abstraction, registry, migration, repair, write path, dependency, or new product capability is introduced.

## Compatibility and Validation

- The existing Console fixture retains an explicit test-only Artifact `1.0` projection because its reused local-analysis producer fixture now represents current writes as Manifest `2.0`.
- Existing success, failed, cancelled, checksum, reference, UTF-8, closed-runtime, provenance, read-order, filesystem-safety, and no-write assertions remain unchanged.
- The two existing `in_progress` assertions change from positive terminal projection to exact `RUN_READ_FAILED`; no test asset is added or retired.
- Required fresh evidence is the focused Console suite, root typecheck, TEST-XCLI-021, canonical offline validation, static checks, and clean merge diff.

## Controller Decision

- status: accepted
- rationale: the user explicitly approved REC-CONTRACT-005 on 2026-08-23 to align Console `1.0` with current mainline terminal-read semantics and avoid a duplicate Artifact validator.
