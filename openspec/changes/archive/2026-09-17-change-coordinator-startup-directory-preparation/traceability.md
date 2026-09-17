> Archive note (R378, 2026-09-17): the complete original text below is the
> frozen Spec-stage record, including its historical pending/NOT_RUN status.
> Current completion and limits are in [the archive acceptance record](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).

# Traceability: Change Coordinator Startup Directory Preparation

## Requirement Matrix

| Requirement | Acceptance Criteria | Test intents | Tasks | Production owner | Current result |
|---|---|---|---|---|---|
| `REQ-SDP-001` | 001-01..03 | EXISTING, CREATE, PARENT, SOCKET | 010..012, 020..021, 030..031 | `host-loop.mjs` listener preflight | NOT_RUN |
| `REQ-SDP-002` | 002-01..03 | EXISTING, TARGET, RACE, FAILURE | 010..012, 020..021, 030 | `host-loop.mjs` existing-target branch | NOT_RUN |
| `REQ-SDP-003` | 003-01..05 | CREATE, REPEAT, RACE, FAILURE | 010..012, 020..021, 030 | `host-loop.mjs` missing-target branch | NOT_RUN |
| `REQ-SDP-004` | 004-01..04 | PARENT, TARGET, RACE, FAILURE, SOCKET | 010..012, 020..021, 030..031 | `host-loop.mjs` failure boundary | NOT_RUN |
| `REQ-SDP-005` | 005-01..04 | all `INTENT-SDP-*` | 010..012, 030..032, 040..041 | `mode-activation.test.mjs` | NOT_RUN |
| `REQ-SDP-006` | 006-01..04 | local matrix plus later HOST-SDP | 040..052 | existing package/host authority | NOT_RUN |
| modified `AC-RIC-004-01` | named directory exception only | PARENT, TARGET, FAILURE, SOCKET | 001..003, 031, 041 | no additional path | NOT_RUN |

All intent names are prefixed `INTENT-SDP-` in `test-plan.md`. Test Design owns
exact Test IDs and leaf count after Spec Gate; it must preserve these intent
bindings and record any one-to-many split.

## Causal Chain

| RED frontier | Missing current behavior | Worker task | Required GREEN and controls |
|---|---|---|---|
| `RED-SDP-001` | actual fixed listener reaches `listen` with a missing parent and cannot create/validate it | `TASK-SDP-020` | missing -> bound safe create -> real temporary socket/status; existing safe and half-close health; complete race/failure/protection matrix |

## Source and Authority Bindings

- Product semantics: R341 `plan-delta.md`, accepted R340 proposed contract, and
  R341 independent Readiness PASS.
- Carrier only: R342 `entry.md`; it changes no product or lifecycle contract.
- Reused canonical authority: `REQ-MA-003`, `REQ-MA-007/008`,
  `REQ-RIC-004`, archived Mode Activation/RIC designs, and the product Change
  execution policy.
- Frozen source identity at Spec intake: deployed-equal five-module R274 set;
  `host-loop.mjs` SHA-256
  `d9470869397877c4de3c3afa8aa4f24485f959aa5c04063b133ccf0d0f1d4c49`.
- Planned production path: only
  `tools/harness/change-coordinator/host-loop.mjs`.
- Planned Test path: only
  `tools/harness/change-coordinator/mode-activation.test.mjs`.
- Runtime probe identity: one validated numeric `runtime_uid` binds both
  `initgroups` and `setuid`; one `runtime_gid` binds both the extra group and
  `setgid`. No new startup username input or identity lookup exists.

## Protected Baseline

`HOST_SOCKET_PATH`, socket authority/protocol, `TEST-MA-HOST-003`, launchd
policy, repair-path `regularRootOwned` rules, `HOST_INSTALL_TARGETS`, installer,
the other four runtime modules, State/pointer/WIP/Ledger/Handoff, trust,
credentials, Git, the four recovery boundaries, K1/K2/hour, R329, P5/EMPTY, and
S09/A2 retain their existing owners and dispositions. No row in this package
promotes them to new PASS evidence.

## Fixed Role Order

`TASK-SDP-001..003 -> TASK-SDP-010..012 -> TASK-SDP-020..021 ->
TASK-SDP-030..032 -> TASK-SDP-040..042 -> TASK-SDP-050..052`.

No later result exists. Spec drafting authorizes no Test, production, Git,
integration, deployment, host operation, acceptance, D1, M4, or Desktop action.

## Accepted evidence mapping — R378 (2026-09-17)

The earlier NOT_RUN table is the retained Spec-intake snapshot. The mapping
below records completed evidence without reclassifying waived/unverified items.

| Requirement | Accepted evidence and limit |
|---|---|
| REQ-SDP-001 | R344 real-listener RED → R349 final startup matrix; R367 safely-created host startup and R371 maintenance-assisted safe-existing startup, accepted by R368/R372. |
| REQ-SDP-002 | R349 existing-target, identity/ACL/access, race and forbidden-side-effect matrix; R371 retained RUN directory and safely-existing startup. No automatic socket removal is implemented or claimed. |
| REQ-SDP-003 | R348 F1/F2 causal RED → R349 minimum fix and 173-leaf startup matrix; R367 actual creation/startup. No new reboot observation is claimed. |
| REQ-SDP-004 | R349 negative/race/failure/protection matrix; R367 real residual-socket STOP retained. Subsequent manual cleanup required distinct R369 authority. |
| REQ-SDP-005 | R349 six complete runs, exact Test/source/spec binding and Retirement PASS; R350 independent read-only acceptance. Production and Test remain logically isolated. |
| REQ-SDP-006 | R350 local acceptance → R351 PR31 → R363/R364 replacement → R367/R371 and Controller host acceptance → R374/R376 full environment and D1 observation, accepted at R377. Final docs-integration D1 identity still pending. |
| Modified AC-RIC-004-01 | Canonical receives the exact approved delta. No other repair-boundary rule, installer, recovery behavior, socket contract, credential policy or runtime module is changed by this archive. |

Exact identities, evidence locations, original failures and applicability limits
are recorded in [verification.md](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).
