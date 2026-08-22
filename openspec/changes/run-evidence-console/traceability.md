# Traceability: Xanthil Run & Evidence Console

## Requirement-to-Delivery Map

| REQ | Acceptance Criteria | Planned Tests | Tasks | Intended code boundary |
|---|---|---|---|---|
| REQ-REC-001 | 001-01..04 | 004, 008, 009 | 002, 004, 005 | Experience, Application, Profile |
| REQ-REC-002 | 002-01..03 | 001, 004, 005, 008 | 002, 003, 004 | Core, Port, local Adapter |
| REQ-REC-003 | 003-01..03 | 002, 006, 007, 009 | 002, 003, 005 | Core, Application, Experience |
| REQ-REC-004 | 004-01..03 | 003, 004, 005, 006, 008, 009 | 002, 003, 004, 005 | Core, Port, local Adapter, Experience |
| REQ-REC-005 | 005-01..04 | 004, 005, 007, 008, 009, 010 | 002, 004, 005, 006 | Adapter, Profile, Experience, controlled-workspace/static-closure scope checks |
| REQ-REC-006 | 006-01..03 | 004, 010 | 002, 003, 004, 006 | all new seams |
| REQ-REC-007 | 007-01..05 | 009, 010 | 001, 002, 004, 005, 006, 007 | Profile/Experience/toolchain, Controller gates |

Reader admission reuses the existing Run Manifest and Evidence Index validators unchanged. The exact persisted confirmed-contract snapshot is validated only inside new reader Product Core as Artifact-`1.0` admission; it is not a new producer/shared contract.

## Reopened Repair Trace

| REQ | AC | TEST | TASK | CODE | RESULT |
|---|---|---|---|---|---|
| REQ-REC-001 | 001-01..04 | TEST-REC-004, 008, 009 | TASK-REC-002, 004, 005 | `apps/console/xanthil-console.ts`, `packages/application/run-evidence-query.ts`, `profiles/personal/console.ts` | `verification.md` frozen evidence |
| REQ-REC-002 | 002-01..03 | TEST-REC-001 (separate non-`1.0` mutation for each named machine document), 004, 005, 008 | TASK-REC-002, 003, 004 | `packages/product-core/run-evidence.ts`, `packages/ports/run-evidence-reader.ts`, `adapters/storage-local/run-evidence-reader.ts` | `verification.md` frozen evidence |
| REQ-REC-003 | 003-01..03 | TEST-REC-001, 002, 006, 007, 009 | TASK-REC-002, 003, 005 | `packages/product-core/run-evidence.ts`, `packages/application/run-evidence-query.ts`, `apps/console/xanthil-console.ts` | `verification.md` frozen evidence |
| REQ-REC-004 | 004-01..03 | TEST-REC-003, 004, 005, 006, 008, 009 | TASK-REC-002, 003, 004, 005 | `packages/product-core/run-evidence.ts`, `adapters/storage-local/run-evidence-reader.ts`, `apps/console/xanthil-console.ts` | `verification.md` frozen evidence |
| REQ-REC-005 | 005-01..04 | TEST-REC-004, 005, 007, 008, 009, 010 | TASK-REC-002, 004, 005, 006 | `adapters/storage-local/run-evidence-reader.ts`, `profiles/personal/console.ts`, `apps/console/xanthil-console.ts` | `verification.md` frozen evidence |
| REQ-REC-006 | 006-01..03 | TEST-REC-004, 010 | TASK-REC-002, 003, 004, 006 | `packages/application/run-evidence-query.ts`, `packages/product-core/run-evidence.ts`, `packages/ports/run-evidence-reader.ts`, `adapters/storage-local/run-evidence-reader.ts`, `profiles/personal/console.ts` | `verification.md` frozen evidence |
| REQ-REC-007 | 007-01..05 | TEST-REC-009, 010 | TASK-REC-001, 002, 004, 005, 006, 007 | `apps/console/xanthil-console.ts`, `profiles/personal/console.ts` | `verification.md` frozen evidence |

## Baseline and Contract Trace

| Baseline authority | Reused invariant | This Change treatment |
|---|---|---|
| REQ-XCLI-009 | immutable closed Artifact `1.0`, read-only later display/verification | consume unchanged; new reader is separate |
| REQ-XCLI-010 | status-discriminated lifecycle | success/non-success projection is derived, never reclassified |
| REQ-XCLI-011/012 | local Evidence graph and Markdown non-authority | independently resolve/verify; no semantic override |
| REQ-XCLI-013 | incomplete candidates never claim success | reject/label non-success, no repair |
| REQ-XCLI-014/015 | secret/data boundary and provenance | display only persisted allowed descriptors; no source/provider access |
| REQ-XCLI-016 | exact version, rollback/retirement preservation | only AC-016-04 Console item changes via delta |
| REC-CONTRACT-001 | remove global Console prohibition only | recorded in Change delta, producer untouched |
| REC-CONTRACT-002 | exact 14-path TypeScript graph addition | accepted; local delta modifies AC-XTS-001-01 and AC-XTS-002-03; append only at authorized Test/implementation step |
| REC-CONTRACT-003 | TEST-XCLI-021 21-plus-14 graph expectation correction | accepted; TEST-XCLI-021 is the sole exact graph evidence owner |

Traceability rows identify evidence ownership only. Gate status and executable counts are recorded solely in `verification.md`.

The exact 35-file TypeScript graph has one evidence owner: existing `TEST-XCLI-021` under REC-CONTRACT-003. `TEST-REC-010` retains only its AC coverage map, test-asset lifecycle ledger, forbidden scope/import, typecheck, and canonical-validation evidence.
