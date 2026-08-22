# Traceability

## Delta Matrix

| Requirement / AC | Executable evidence owner | Task | Planned production seam / result |
|---|---|---|---|
| `REQ-XCLI-001`, `AC-XCLI-001-01` | RPN-T05, T08, T10; `TEST-XCLI-009/011/013/019` | RPN-003, 005, 006, 007 | Profile/Application/Pi readiness reaches Discovery with no pre-confirm run |
| `AC-XCLI-001-02` | RPN-T05, T06, T07; `TEST-XCLI-006/009/011` | RPN-003, 005, 006, 007 | closed readiness, SDK version/model failures, zero forbidden effects |
| `REQ-XCLI-007`, `AC-XCLI-007-01` | RPN-T05, T11; `TEST-XCLI-006/011/022` | RPN-003, 005, 006, 007 | `packages/ports`, Pi Adapter and contract double; method set unchanged |
| `AC-XCLI-007-03` | RPN-T05, T07; `TEST-XCLI-006/009/011` | RPN-003, 005, 006, 007 | closed readiness; requested/preflight/execution model equality |
| `AC-XCLI-007-04` | RPN-T06; `TEST-XCLI-011` | RPN-003, 005, 006, 007 | loaded SDK `VERSION`, Adapter constants, existing local-only readiness |
| `REQ-XCLI-009`, `AC-XCLI-009-01` | RPN-T01, T08, T09, T10; `TEST-XCLI-004/008/009/010/013/018` | RPN-003, 005, 006, 007 | Application current writer; Run `2.0`; Analysis/Evidence `1.0` |
| `AC-XCLI-009-03` | RPN-T08, T10; `TEST-XCLI-009/010/013/019` | RPN-003, 005, 006, 007 | product/Profile/readiness ownership; Storage/CLI transport only |
| `AC-XCLI-012-02` | RPN-T09; `TEST-XCLI-005/017/018` | RPN-003, 005, 006, 007 | evidence/Markdown unchanged; provenance resolves via same-run manifest |
| `REQ-XCLI-015`, `AC-XCLI-015-01` | RPN-T01, T06, T08, T09, T10; `TEST-XCLI-004/005/009/010/011/013/017/018/019` | RPN-003, 005, 006, 007 | exact source/semantic/product/runtime/adapter/profile/model/run lineage |
| `REQ-XCLI-016`, `AC-XCLI-016-02` | RPN-T03, T04; `TEST-XCLI-004/008/016/018` | RPN-003, 005, 006, 007 | exact terminal `1.0|2.0` read; legacy structure/tree/bytes unchanged |
| `AC-XCLI-016-03` | RPN-T04, T11; `TEST-XCLI-008/016/018/019/022` | RPN-003, 005, 006, 007 | every mutator current-only; rollback preserves artifacts; no migration |
| `AC-XTS-003-02` | RPN-T12; complete four-layer counts/identity diff | RPN-003, 006, 007 | prior assertions retained; exact new counts frozen at Test Design |

## Negative and Forbidden-Side-Effect Coverage

| Invariant | Required independent evidence |
|---|---|
| closed neutral shape | each old Pi key, missing/extra/null field, invalid ID/version, `profile.version`, model extra/duplication rejected |
| observation authority | SDK `VERSION` module-hook cases; requested/preflight and preflight/execution model mismatches |
| no vendor orchestration | unchanged Port methods/exports plus Application architecture scan; no registry/fallback/switch method |
| current-only mutation | each of five Artifact mutators rejects legacy/unknown/malformed state and preserves full byte snapshot |
| bounded legacy read | each terminal status for exact `1.0` and `2.0`; legacy `in_progress`/unknown/malformed rejected |
| non-migration | returned legacy object retains old keys; run bytes/tree equal before/after; no new file/temp/backfill/repair output |
| schema independence | new Run `2.0`; same-run Analysis Contract/Evidence remain exact `1.0`; Markdown shape unchanged |
| public propagation | success/failure/cancelled current provenance; CLI rejects legacy/unknown as a current Application result |
| safety/scope | no user-directory scan, data/fixture/package/dependency/real-model change, credential output, or project-board write by Test/Worker |

## Reused Unchanged Contract

Every unchanged `REQ-XCLI-*`/`AC-XCLI-*` maps through the existing `coverage-map.ts` and `TEST-XCLI-001..022` matrix. RPN-T12 requires the complete matrix to remain GREEN, including the unchanged Local Analysis Execution Adapter contract. `REQ-XTS-001`, `002`, `004`, `005` and unchanged `AC-XTS-003-*` remain covered by the current TypeScript graph and canonical runner.

## Lifecycle Trace

`TASK-RPN-001` creates this package. `TASK-RPN-002` owns mandatory simplicity review and Spec Gate. `TASK-RPN-003/004` own executable constraints and TDD_READY with production frozen. `TASK-RPN-005` owns only the frozen production delta. `TASK-RPN-006` owns GREEN/regression/retirement evidence. `TASK-RPN-007` independently verifies the frozen result. `TASK-RPN-008` alone accepts, merges the current spec, archives, and reconciles the project board.
