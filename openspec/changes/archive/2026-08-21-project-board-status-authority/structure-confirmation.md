# Project Board Status Authority — Approved Structure Ledger

- Scope: JuanerAI local human project board
- Date: 2026-08-21
- Decision source: explicit user cancellation of the unactivated
  `project-board-atomic-transactions` design
- Overall status: **APPROVED**
- Change class: bounded governance-tool contract correction

## Decision Ledger

| Seq | Topic | Recommendation and reason | User decision | Consistency | Status | Evidence |
|---|---|---|---|---|---|---|
| PBSA-001 | Purpose and assurance level | Keep the board a local, non-audit-grade observability tool; audit-grade transaction machinery is disproportionate to its role. | Approved: non-audit-grade, single-Controller observability tool. | 一致 | Confirmed | User instruction, 2026-08-21 |
| PBSA-002 | Current-state authority and grain | One complete validated snapshot at `.juanerai/project-control/status.json` is the sole current-state authority. Its grain is one current board state for JuanerAI. | Approved exactly. | 一致 | Confirmed | User instruction, 2026-08-21 |
| PBSA-003 | Status identity and publication | The fixed path is the identity. Validate the complete v1 status, write a same-directory temporary file, then atomically rename it over `status.json`. | Approved exactly. | 一致 | Confirmed | User instruction; existing status v1 schema and `atomicWriteJson` |
| PBSA-004 | Event meaning and failure | `events/*.json` is best-effort, non-authoritative history. Event failure emits a warning and never rolls back or invalidates a successful status replacement. Events cannot override current status. | Approved exactly. | 一致 | Confirmed | User instruction, 2026-08-21 |
| PBSA-005 | Writer and concurrency | Controller through `status-cli.mjs` is the only supported writer. Concurrent Controller writes, multi-writer ordering, conflict arbitration, and linearization are outside the contract. | Approved exactly. | 一致 | Confirmed | User instruction, 2026-08-21 |
| PBSA-006 | Read boundaries | `readProjectControl()`, the loopback server, and the browser read `status.json` as current state. The browser remains read-only and cannot approve, execute, or write. Decision briefs remain display-only context. | Approved; existing brief boundary remains unchanged. | 一致 | Confirmed | User instruction; `AGENTS.md`; base board contract |
| PBSA-007 | Removed structures | Remove the unactivated transaction, revision, hash-chain, embedded baseline, staging, compatibility-projection, projection-recovery, and FIFO concurrency contracts, schemas, code, and tests. | Approved exactly. | 一致 | Confirmed | User instruction; live tree contains no `transactions/` directory |
| PBSA-008 | Compatibility and migration | No transaction migration or recovery is required because revision 1 never activated. Existing v1 status, events, briefs, and their schemas remain; the cancelled decision brief is display-only history and may be marked superseded. | Approved by cancellation instruction; no live authority transition exists. | 一致 | Confirmed | Read-only live-tree inspection, 2026-08-21 |
| PBSA-009 | Validation scope | Retain focused proof for validated single-file atomic status replacement, invalid-input rejection, event-failure isolation, read-only browser behavior, and current-state display. | Approved exactly. | 一致 | Confirmed | User instruction, 2026-08-21 |
| PBSA-010 | Phase classification | This is a supporting governance ReadModel correction, not a Xanthil product capability, audit log, database, or cross-domain contract. | Approved by stated board positioning. | 一致 | Confirmed | `CONTEXT.md`; user instruction |

## Unchanged Existing Semantics

- Status, event, and decision-brief v1 field schemas remain unchanged.
- `updated_at` and `updated_by` continue to describe the current status
  snapshot; event actor/time describe only that non-authoritative history item.
- Decision approvals remain authoritative only in the Codex CLI conversation.
- No network, database, dependency, product-data, secret, retention, deletion,
  compaction, or external-action behavior is added.

## Rollback and Activation

Rollback of PB-ATOMIC is deletion of its unactivated code, schemas, tests, and
active Change package, followed by restoration of the v1 board implementation.
The replacement Change activates only after its minimal event-warning behavior
passes the normal Test, Worker, Validator, and acceptance gates. Until then,
the restored v1 implementation remains the executable baseline.

## Authorized Scope Now

This ledger authorizes rollback of the unaccepted PB-ATOMIC work and drafting
of the complete `project-board-status-authority` OpenSpec package. It does not
authorize Test Design or production implementation for the replacement Change
before its Spec Gate passes.
