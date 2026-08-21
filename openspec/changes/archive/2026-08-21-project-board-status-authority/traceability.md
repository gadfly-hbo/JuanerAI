# Traceability

- Current state: corrected hash independently revalidated; real complete-state
  suite 12/12; Controller accepted and archived
- Result cells include the final fresh Revalidation PASS

## Requirement Traceability

| Requirement | Acceptance Criteria | Planned Tests | Tasks | Candidate Code | Result |
|---|---|---|---|---|---|
| PBSA-REQ-001 sole current-state authority | PBSA-AC-001..003 | PBSA-TEST-001, PBSA-TEST-006, PBSA-TEST-009 | PBSA-TASK-001..004,007..009 | unchanged `project-control.mjs`, `server.mjs`, `index.html`; focused CLI test | PASS |
| PBSA-REQ-002 pre-write admission | PBSA-AC-004..006 | PBSA-TEST-003, PBSA-TEST-004, PBSA-TEST-005 | PBSA-TASK-003..009 | `status-cli.mjs` | PASS |
| PBSA-REQ-003 status publication | PBSA-AC-007..008 | PBSA-TEST-002 | PBSA-TASK-003..009 | unchanged `atomicWriteJson`; `status-cli.mjs` orchestration | PASS |
| PBSA-REQ-004 event failure contract | PBSA-AC-009..012 | PBSA-TEST-002, PBSA-TEST-006, PBSA-TEST-007, PBSA-TEST-008 | PBSA-TASK-003..009 | `status-cli.mjs` | PASS |
| PBSA-REQ-005 sole writer/read-only boundary | PBSA-AC-013..014 | PBSA-TEST-010 | PBSA-TASK-001,003,004,007..009 | unchanged server/browser; scoped diff | PASS |
| PBSA-REQ-006 compatibility/activation/rollback | PBSA-AC-015..016 | PBSA-TEST-001,010 | PBSA-TASK-001,003,007..009 | v1 regression and scoped diff | PASS |

## Acceptance-Criterion Coverage

| AC | Observable proof | Forbidden effect proof | State |
|---|---|---|---|
| PBSA-AC-001 | show returns status fields despite differing event status | event does not replace status | PASS |
| PBSA-AC-002 | show returns published status after missing event | no matching event required | PASS |
| PBSA-AC-003 | unchanged v1 valid/invalid fixtures | no field/schema addition | PASS |
| PBSA-AC-004 | invalid status exits nonzero | no status/event/brief byte change | PASS |
| PBSA-AC-005 | invalid event on status mutation exits nonzero | status not published; no event/brief change | PASS |
| PBSA-AC-006 | invalid event-only/brief exits nonzero | no record change | PASS |
| PBSA-AC-007 | final status is one complete validated snapshot | no partially serialized final status | PASS |
| PBSA-AC-008 | status publication failure preserves prior authority | no event attempt/warning | PASS |
| PBSA-AC-009 | status succeeds with exact warning after real event failure | no rollback, event, retry-visible duplicate, or nonzero exit | PASS |
| PBSA-AC-010 | brief succeeds with exact warning after real event failure | status unchanged; no rollback/event | PASS |
| PBSA-AC-011 | event-only failure returns zero with exact warning | status/brief unchanged | PASS |
| PBSA-AC-012 | status failure nonzero | no event warning or event write | PASS |
| PBSA-AC-013 | server/browser read-only regression | no browser/server record write | PASS |
| PBSA-AC-014 | scoped implementation/test inspection | no second writer/concurrency/timeout/retry/background behavior | PASS |
| PBSA-AC-015 | base validators, show, server/browser remain GREEN | no fixture migration/schema change | PASS |
| PBSA-AC-016 | allowed-path diff | no forbidden path change | PASS |

## Base PB-REQ-004 Supersession Map

| Base phrase | Replacement interpretation |
|---|---|
| “atomic, validated CLI” | Complete candidates validate pre-write; status and brief retain single-file atomic replacement. |
| “Material mutations SHALL append history” | A valid material mutation makes one post-publication best-effort append attempt; successful append is not a success prerequisite. |
| “reject invalid inputs without partial writes” | Invalid candidate rejection remains pre-write and fail-closed. Event I/O failure after publication is not invalid input and cannot undo the completed file. |
| snapshot, phase, milestone, event, brief changes | All remain supported with the command-specific pipelines in Design. |

All other base requirements remain unchanged. This Change removes no base test
and makes no claim that the unfinished base Change is accepted or archived.

## Scope Traceability

| Role | Frozen write set | Gate |
|---|---|---|
| Spec Agent | this Change package except approved structure ledger | current authorized phase |
| Test Agent | `tools/harness/project-board/status-cli.test.mjs` | after Spec Gate PASS |
| Worker | `tools/harness/project-board/status-cli.mjs` | after TDD_READY |
| Validator | none; read-only | after implementation/evidence freeze |
| Controller | Change/evidence and supported project-board lifecycle updates | role-owned transitions |

Conditional helper/base-test paths require explicit return and revised approval.
All live records, schemas, server/browser/README, base Change, dependencies,
governance, product code, and Git operations are forbidden for this Change.
