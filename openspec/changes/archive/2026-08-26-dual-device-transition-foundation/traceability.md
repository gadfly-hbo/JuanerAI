# Traceability: Dual-device Transition Foundation — Reduced V1

## Current Evidence Status

Every planned Test below is `NOT_RELEASED / NOT_RUN`. The reduced package has no accepted RED, TDD_READY, GREEN, Regression, Test Asset Retirement, Candidate, Validator, Acceptance, archive, or Mode Activation evidence. Historical tests/results remain preserved separately and do not satisfy these mappings.

## Requirement / Acceptance / Test / Task Map

| Requirement / AC | Planned Test IDs | Planned tasks | Intended observable evidence |
|---|---|---|---|
| REQ-001 / AC-001-01 | R1-001, R1-011, R1-012 | R1-002..006,009 | exactly four library interfaces; production CLI only submits signed bytes/queries read-only status; direct core/state/trust/gateway/run/settlement CLI paths and their historical assertions are absent |
| REQ-001 / AC-001-02 | R1-002 | R1-003,004,006 | initialized `active_change_id` pointer admits null/same Change and blocks missing/corrupt/conflict; no enumeration authority |
| REQ-001 / AC-001-03..04 | R1-001 | R1-003,004,006,012 | complete-body canonical signature binding, replay/time/state/evidence negatives, no caller trust injection; real trust deferred |
| REQ-001 / AC-001-05 | R1-002 | R1-003,004,006 | one process mutex; one winner; bounded hold; wait-time release; no file/Change/stale lock |
| REQ-001 / AC-001-06 | R1-011, R1-012 | R1-002,004,006 | no polling/queue/daemon/Issues/Projects/project-control-v2/parallel Change |
| REQ-001 / AC-001-07..08 | R1-001, R1-002, R1-011, R1-012 | R1-003,004,006,012 | sole writer unchanged; STATUS-only diagnostics, exact PendingAction/nullability, CoordinatorError return/exit behavior and GatewayReason legality |
| REQ-002 / AC-002-01 | R1-002, R1-003 | R1-003,004,006 | exact six states and exact internal phases; removed names reject |
| REQ-002 / AC-002-02..04 | R1-002, R1-003, R1-005 | R1-003,004,006 | pointer-first DISPATCH admission, complete state/event identity, Worktree create-or-reuse/readback, complete automatic formal-role path, Coordinator-core mechanics inside the sole host loop |
| REQ-002 / AC-002-05..06 | R1-003, R1-005 | R1-003,004,006 | exact Agent correlation/route/hash/child/subject and six distinct stages, duplicate idempotence |
| REQ-002 / AC-002-07 | R1-003, R1-005, R1-012 | R1-004,006,009 | failed/dirty/missing/ambiguous evidence blocks with no skip or fabricated PASS |
| REQ-002 / AC-002-08 | R1-002, R1-009 | R1-003,004,006 | active-slot publication/readback linearizes admission before READY/event; every post-slot crash/readback-loss retains WIP; incomplete admission blocks/manual-stops; exact complete replay converges and every Change B rejects |
| REQ-003 / AC-003-01..02 | R1-004 | R1-004,006 | signed same-scope REVISION cycle reset; DISPATCH/REVISION one-attempt budget; RESUME/RELEASE no reset |
| REQ-003 / AC-003-03..04 | R1-004, R1-007 | R1-004,006,009,010 | reliable in-scope findings, causal RED before Worker, out-of-scope/ambiguous/second FAIL blocks |
| REQ-003 / AC-003-05 | R1-004, R1-009 | R1-004,006 | exact unchanged safe-phase RESUME; code/Test/semantic change requires REVISION |
| REQ-003 / AC-003-06 | R1-004, R1-005, R1-009, R1-010 | R1-003,004,006,009 | every reason has one action; four unresolved high-value ambiguities manual-stop with no later run/gateway replay; Evidence-unavailable local pause alone retains exact-request replay; safe-only RESUME and same-scope REVISION |
| REQ-004 / AC-004-01 | R1-006, R1-011 | R1-004,006,007,010 | exact scope inventory/stage/index tree/non-amend commit/readback/clean Candidate |
| REQ-004 / AC-004-02..03 | R1-006, R1-007, R1-009 | R1-004,006,007,010 | final validation and fresh Validator on Candidate; local=remote=Validator before freeze; exact publish order |
| REQ-004 / AC-004-04 | R1-008, R1-011 | R1-004,006,007 | current-Change PR only; base/head/readiness readback; merge/close/delete/main effects unavailable |
| REQ-004 / AC-004-05..06 | R1-008 | R1-003,004,006,007 | fixed-reference Handoff; no embedded diff; exact Git 2.54.0 raw-byte reconstruction/hash across temporary clones |
| REQ-004 / AC-004-07 | R1-003, R1-008 | R1-006,007,010,011 | PR + Handoff + HANDOFF_READY readbacks precede AWAITING; Mac mini stop and MacBook review ownership |
| REQ-004 / AC-004-08 | R1-008, R1-011 | R1-003,004,006,007 | empty-env exact producer receipt and raw bytes match across clones; all host/clone-local inputs reject |
| REQ-005 / AC-005-01..02 | R1-005 | R1-003,004,006,009 | exactly seven event classes; canonical one-LF JSONL; DISPATCH admission/READY hash; six exact Agent details and validation status/failure combinations; no sensitive content |
| REQ-005 / AC-005-03..04 | R1-009 | R1-003,004,006,009 | each commit/push/Ledger/Handoff-PR boundary: exact readback convergence, proven-absence bounded continuation, unresolved ambiguity BLOCKED/manual-stop, later run effect-free; no fifth boundary or replay platform |
| REQ-005 / AC-005-05..06 | R1-005, R1-009, R1-012 | R1-004,006,009 | exact local-pause operation/request/idempotency/action, identical existing-call replay, clear/supersede/manual-stay, and no false durable claim |
| REQ-005 / AC-005-07..08 | R1-001, R1-005, R1-009 | R1-003,004,006,009 | sole remote path, path-safe Change grammar, JSONL framing, null-tip/first/subsequent rules, four typed Ledger receipts and all partial stages; only exact remote bytes linearize |
| REQ-006 / AC-006-01 | R1-010 | R1-004,006,010,011 | exact AWAITING/pointer/state/Frozen Candidate/PR and signed Acceptance/merge/archive/main receipt admission |
| REQ-006 / AC-006-02..03 | R1-010, R1-011 | R1-004,006,010,011 | fetch/prune + clean + ff-only + local/origin readback; one RELEASE event; CLOSED then pointer clear |
| REQ-006 / AC-006-04 | R1-010 | R1-004,006,010 | identical replay convergence across AWAITING/event/CLOSED/pointer-clear crash windows |
| REQ-006 / AC-006-05..06 | R1-010, R1-012 | R1-004,006,010 | mismatch/dirty/non-ff/readback failure retains WIP; no push/merge/cross-host inspection claim |
| REQ-007 / AC-007-01 | R1-001..012 | R1-003..010 | deterministic Foundation contract evidence only, using doubles/temp Git |
| REQ-007 / AC-007-02..03 | R1-012 | R1-002,011,012 | real trust/SSH/host-loop/GitHub work separate; unattended end-to-end Activation acceptance not downgraded |
| REQ-007 / AC-007-04 | R1-012 | R1-003,004,006,007,009,010 | no live/repository/project-control/product/host/Git/Agent/Mode/H/P/C/A effect |
| REQ-007 / AC-007-05..06 | R1-011, R1-012 + Controller review | R1-002,004,006 | no dependency/platform/extra surface; any required widening returns BLOCKED |
| REQ-007 / AC-007-07 | R1-012 | R1-001..012 | Foundation lifecycle uses current pre-Activation Git/governance; only later Mode Activation uses new host-loop/DISPATCH/PR/Handoff/RELEASE mechanics |

## Planned Test Identity Status

| Test ID | Status | Release condition |
|---|---|---|
| `TEST-DTF-R1-001` | NOT_RELEASED / NOT_RUN | independent reduced Spec Gate PASS, then healthy Test preflight |
| `TEST-DTF-R1-002` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-003` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-004` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-005` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-006` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-007` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-008` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-009` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-010` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-011` | NOT_RELEASED / NOT_RUN | same |
| `TEST-DTF-R1-012` | NOT_RELEASED / NOT_RUN | same |

## Ownership and Invalidation

- Test writes only the four Test-owned paths in `tasks.md`; Worker writes only the four production/reference paths and a separately released conditional runner append.
- Any Test change invalidates TDD_READY and later evidence.
- Any production/Candidate change invalidates affected GREEN, Regression, final validation, Candidate freeze, Handoff/PR, and Validator evidence.
- Any canonical diff contract, Git version, Candidate, or baseline change invalidates the diff hash and Handoff.
- Any command/verifier/Activation trust change requires contract review and cannot be hidden in Test/Worker.
- Historical old-contract GREEN/FAIL/PASS facts remain verification history, not current mapping evidence.

## Current Reduced V1 Execution Status — 2026-08-26

This section supersedes only the earlier `NOT_RELEASED / NOT_RUN` status. The Requirement/AC/Test/Task mapping above remains unchanged.

| Test identity | Current evidence |
|---|---|
| `TEST-DTF-R1-001` | GREEN in final 171/171; exact four-interface/command/auth/trust-injection negatives retained |
| `TEST-DTF-R1-002` | GREEN; complete normal path, pointer-first admission and WIP crash-window evidence retained |
| `TEST-DTF-R1-003` | GREEN; exact Agent action/settlement/lifecycle evidence retained |
| `TEST-DTF-R1-004` | GREEN; signed REVISION/RESUME and one bounded causal repair retained |
| `TEST-DTF-R1-005` | GREEN; seven Ledger classes, remote authority and durable ordering retained |
| `TEST-DTF-R1-006` | GREEN; exact stage/commit/final-validation/regression retirement receipts retained |
| `TEST-DTF-R1-007` | GREEN; exact Candidate/Validator/remote/PR/Handoff identity plus durable Handoff-conflict block retained |
| `TEST-DTF-R1-008` | GREEN; eleven-method Git boundary, raw Git 2.54.0 diff and ff-only main-sync evidence retained |
| `TEST-DTF-R1-009` | GREEN; four ambiguity boundaries, no later replay, and no false durable claim retained |
| `TEST-DTF-R1-010` | GREEN; RELEASE sync/evidence/CLOSED/pointer-last and replay windows retained |
| `TEST-DTF-R1-011` | GREEN; closed dependency/method budgets and forbidden surface retained |
| `TEST-DTF-R1-012` | GREEN; CLI/status/Foundation-vs-Activation stop-line retained |

- Final Test hashes and per-file counts are frozen in `test-asset-retirement.md` and `verification.md`.
- Focused result: **171/171 PASS**. Existing safety-counterexample selection: **49/49 PASS**. Canonical repository validation: exit `0`.
- Test Asset Retirement: `PASS — USER-AUTHORIZED NON-SAFETY WAIVER`; the unused one-line `already` helper is a visible deferred risk, not coverage.
- Production and Test evidence remain Candidate-relative until the exact Candidate commit is created. A fresh Validator must bind its verdict to that exact Candidate SHA; this section does not pre-claim Validator PASS or Controller Acceptance.
