# Traceability: Change Coordinator Runtime Installation Closure

## Contract Mapping

| Requirement | Acceptance Criteria | Canonical authority | Test intent | Task | Future code path | Current result |
|---|---|---|---|---|---|---|
| REQ-RIC-001 | 001-01..03 | AC-MA-003-02 | SOURCE-NEW5, SOURCE-REJECT | 010..012, 020, 030 | `install-host-loop` runtime source admission | NOT_RUN |
| REQ-RIC-002 | 002-01..03 | AC-MA-007-04 | PRIOR-ABSENT, PRIOR-OLD4, PRIOR-NEW5, PRIOR-INVALID | 010..012, 020, 030 | `install-host-loop` backup | NOT_RUN |
| REQ-RIC-003 | 003-01..04 | AC-MA-007-04/05 | MANIFEST-NAMES, MANIFEST-SOURCE, MANIFEST-BYTES, three prior intents | 010..012, 020, 030 | `install-host-loop` rollback | NOT_RUN |
| REQ-RIC-004 | 004-01..03 | AC-MA-003-02, AC-MA-007-04/05, MASTER_PLAN A2/A3/A4 | PROTECTION plus regression/host disposition | 021, 031..033, 040..042 | protected paths unchanged | NOT_RUN |

All intent names are prefixed `INTENT-RIC-` in `test-plan.md`. The isolated Test
role assigns final executable leaf names without changing this mapping.

## RED to Delivery Mapping

| RED | Missing behavior | GREEN owner | Required retained controls |
|---|---|---|---|
| RED-RIC-001 | exact new5 source is rejected by old four-name inventory | TASK-RIC-020 | source regularity/symlink/size, installed byte/hash/authority, module-load isolation |
| RED-RIC-002 | Test-owned existing-format manifest child source path is not bound to the manifest-derived runtime backup location | TASK-RIC-020 | independent layout/path/hash oracle, legal positive rollback control, actual-byte hash, name-set, owner/mode/ACL, existing rollback failure semantics |

## Protected Scope

| Surface | Required disposition |
|---|---|
| `HOST_INSTALL_TARGETS` and non-runtime target rules | byte/behavior unchanged |
| Coordinator/adapters/host-loop/production/snapshot modules | no source change; snapshot is copied only as package content |
| Git executable/dylib/traversal | unchanged; existing tests remain controls |
| State/pointer/Ledger/Handoff/canary/Git history | existing preservation contract unchanged |
| trust/credentials/service/socket/revocation/timeouts | unchanged; controlled local evidence remains distinct from host proof |
| canonical/archived OpenSpec and accepted M2 evidence | unchanged historical authority |
| provider/network/host/Desktop/Git publication | forbidden or A4-deferred, not executed by this Change |

## Evidence Chain

`TASK-RIC-001..003 -> TASK-RIC-010..012 -> TASK-RIC-020..021 ->
TASK-RIC-030..033 -> TASK-RIC-040..042`.

No later result exists yet. Old Mode Activation/M2 PASS evidence remains
historical/reusable only under A3 and is not a result for the new identities.
