# Contract Change Request: REC-CONTRACT-004

## Summary

Record the Controller-approved Console `1.0` evidence boundary: serialized runtime output, the TypeScript reader-result envelope, and neutral provenance remain exact and closed. Complete TypeScript closure for Artifact-derived nested View values is deferred; this is not a relaxation of Artifact admission or runtime projection.

## Current Conflict

`AC-REC-003-03` previously coupled the prohibition on `optional/unknown record shape` to every public nested View value. That wording made static exactness of `sources`, `time_windows`, `metrics`, `findings`, `evidence`, retained assets, and status-specific detail a Console `1.0` Acceptance Criterion. The approved reader already rejects unknown Artifact machine-content fields during admission and constructs a closed serialized output, but completing every nested TypeScript representation would add type-only expansion beyond the two remaining correctness repairs.

## Accepted Contract Delta

- Runtime admission remains closed: unknown, missing, null, malformed, or otherwise invalid Artifact machine content is rejected under its existing error classification.
- Runtime projection remains closed: no unadmitted or unknown field is emitted in the reader result or Console rendering.
- The TypeScript reader-result envelope and the exact neutral provenance object remain closed `1.0` contracts. The result vocabulary, provenance field names, and provenance value roles do not become optional or vendor-specific.
- TypeScript exactness for nested Artifact-derived View values—`sources`, `time_windows`, `metrics`, `findings`, `evidence`, retained assets, and status-specific detail—is not a `1.0` Acceptance Criterion. Strengthening those nested static types is deferred to a separate Change with its own product and compatibility decision.
- This delta preserves Pi/vendor neutrality and Pi Adapter isolation. It neither defines a Runtime abstraction nor introduces a Runtime registry, fallback, shared Artifact codec, framework, size cap, module, or path.

## Remaining Authorized Correctness Work

Only these two behavior repairs remain authorized:

1. A Finding with an empty `statement`, empty `limitations`, or empty limitation text is rejected as `RUN_READ_FAILED`.
2. A manifest-indexed asset whose declared `byte_size` differs from its stable pre-read metadata is rejected as `RUN_CHECKSUM_MISMATCH` through the real Profile path, before opening the asset.

## Validation and Test-Asset Effect

- Retain runtime exact-key checks, the TypeScript result-envelope/provenance proof, and the two causal correctness RED cases.
- Remove or defer compile-time guards whose only purpose is exact TypeScript closure of the named nested/status View values.
- The existing Test Asset Retirement record is historical only. A fresh reconciliation after GREEN must confirm that removed static-only guards have no retained `1.0` consumer and that the two retained correctness cases do.

## Controller Decision

- status: accepted
- rationale: user approval on 2026-08-23 explicitly keeps exact runtime output, result envelope, and provenance while deferring nested Artifact View TypeScript closure; it authorizes no behavior beyond the two listed error-classification repairs.
