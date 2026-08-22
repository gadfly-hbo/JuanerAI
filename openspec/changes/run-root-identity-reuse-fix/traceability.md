# Traceability

| Requirement | AC | Test / evidence | Task | Code | Expected result |
|---|---|---|---|---|---|
| REQ-RRIF-001 | AC-RRIF-001-01 | Existing TEST-XCLI-008 valid-root path | 2–6 | `adapters/storage-local/local-analysis.ts` | An unchanged root preflights with the existing result. |
| REQ-RRIF-001 | AC-RRIF-001-02 | Existing TEST-XCLI-008 replaced/missing/symlink/non-directory paths; PR #4 causal Ubuntu RED; temporary-proof Ubuntu GREEN | 2–6 | `adapters/storage-local/local-analysis.ts` | Same-path replacement rejects `RUN_ROOT_UNSAFE` with no Artifact write. |
| REQ-RRIF-001 | AC-RRIF-001-03 | Existing TEST-XCLI-008, public Store surface comparison, persistence/scope diff, Validator review | 3–6 | `adapters/storage-local/local-analysis.ts` | No public lifecycle API or persisted root-identity state is added. |

Existing AC-XCLI-001-01, AC-XCLI-001-02, and AC-XCLI-007-01 remain mapped to TEST-XCLI-008 unchanged. This delta adds no replacement TEST identity and does not change their baseline acceptance meaning.
