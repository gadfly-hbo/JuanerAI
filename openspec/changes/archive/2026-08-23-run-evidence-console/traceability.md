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
| REC-CONTRACT-004 | exact runtime output, result-envelope/provenance static proof, and deferred nested View static closure | accepted; TEST-REC-001 retains runtime/result-envelope/provenance proof, TEST-REC-004/005 retain checksum propagation, and nested/status compile-time-only guards have no Console `1.0` consumer |

Traceability rows identify evidence ownership only. Gate status and executable counts are recorded solely in `verification.md`.

The exact 35-file TypeScript graph has one evidence owner: existing `TEST-XCLI-021` under REC-CONTRACT-003. `TEST-REC-010` retains only its AC coverage map, test-asset lifecycle ledger, forbidden scope/import, typecheck, and canonical-validation evidence.

## PR #10 CHANGES_REQUESTED Repair Trace

Reviewed baseline: `69ed340116f7daf73e7b5304dae35897eb01541a`. The repair reuses existing TEST identities and public seams; it adds no Requirement, AC, schema, Port, Profile, Runtime, helper, fixture, or coverage-map identity.

| Review item | REQ / AC | Causal regression | Code boundary | Current result |
|---|---|---|---|---|
| retained non-success descriptor metadata was removed before rendering | REQ-REC-003 / AC-REC-003-02; REQ-REC-007 / AC-REC-007-02 | TEST-REC-009 loopback process + HTTP page | `apps/console/xanthil-console.ts` | escaped descriptor values visible; retained bytes remain undisplayed |
| prototype-chain names resolved as dangling output properties | REQ-REC-004 / AC-REC-004-02 | TEST-REC-003 `/toString` and `/constructor` leaves through Core `admit` | `packages/product-core/run-evidence.ts` | absent own properties reject as `RUN_REFERENCE_INVALID` |
| same-inode/same-size mutation was not observably rejected | REQ-REC-002 / AC-REC-002-01; REQ-REC-005 / AC-REC-005-03 | TEST-REC-005 real Personal Profile read with repeated in-read metadata mutation | `adapters/storage-local/run-evidence-reader.ts` | changed `mtime`/`ctime` rejects as `RUN_READ_FAILED` |
| governance skill was outside the coherent product Change | Change path scope | PR diff against `origin/main` | `.agents/skills/git-commit-push/SKILL.md` | exact `origin/main` content; absent from final PR diff |

Gate state is `GREEN_AWAITING_INDEPENDENT_VALIDATOR`. Focused/typecheck/canonical evidence does not replace the required fresh Validator verdict for the repaired pushed head.

## Fixed-head `8427c0ac` Validator Repair Trace

Reviewed baseline: `8427c0ac1a31bc6a0e77f951d40536de5833d3cb`. This bounded follow-up adds no Requirement, AC, schema, public seam, helper, fixture, TEST identity, or acceptance behavior.

| Review item | REQ / AC | Causal regression | Code / evidence boundary | Current result |
|---|---|---|---|---|
| an inherited numeric `Array.prototype` property resolved as a JSON Pointer array element | REQ-REC-004 / AC-REC-004-02 | TEST-REC-003 sets `Array.prototype[0]` inside `try/finally` and resolves `/items/0` against an empty array | `packages/product-core/run-evidence.ts` | array and object tokens both require an own JSON-document property; rejection is `RUN_REFERENCE_INVALID` |
| coverage metadata omitted the accepted owners for observable instability and retained non-success descriptors | REQ-REC-005 / AC-REC-005-03; REQ-REC-003 / AC-REC-003-02 | TEST-REC-010 checks the exact two coverage leaves; existing TEST-REC-005 and TEST-REC-009 execute the behaviors | `tests/fixtures/run-evidence-console/coverage-map.ts`, Test Plan, and retirement ledger | TEST-REC-005 maps AC-REC-005-03; TEST-REC-009 maps AC-REC-003-02 |

Gate state remains `GREEN_AWAITING_INDEPENDENT_VALIDATOR`. The Validator verdict for `8427c0ac` is superseded for the repaired pushed head, and GitHub Canonical validation must rerun for that new head.

## Independent Validator PASS Gate

The independent read-only Validator returned `PASS` against fixed implementation/evidence head `a06e8df3bf568da6379140d520782cbe96dcda81`. The inherited-array-index own-property finding is closed by TEST-REC-003 under AC-REC-004-02, and the coverage/traceability ownership finding is closed by the reconciled TEST-REC-005 → AC-REC-005-03 and TEST-REC-009 → AC-REC-003-02 mappings. The complete focused Console suite is `82/82` PASS and root typecheck is PASS.

GitHub Canonical validation run [32610573916](https://github.com/gadfly-hbo/JuanerAI/actions/runs/32610573916) is `SUCCESS` for the same fixed SHA. Earlier `CHANGES_REQUESTED` verdicts and the `69ed340`, `8427c0ac`, `77/77`, and `81/81` evidence remain historical records above; none is substituted for this fixed-head verdict.

Current Gate state is `INDEPENDENT_VALIDATOR_PASS — AWAITING_MACBOOK_FINAL_REVIEW`. Mac mini does not merge PR #10.
