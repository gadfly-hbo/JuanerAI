# Test Asset Retirement: Dual-device Transition Foundation — Reduced V1

## Current Status

- Reduced-V1 Test Design: not released/not run.
- Post-GREEN retirement Gate: not run.
- No Test hash, RED, TDD_READY, GREEN, Regression, or retirement verdict is current.
- Owner after Spec Gate PASS: `juaner_test` for Test assets; Controller freezes TDD_READY and owns the post-GREEN Gate; fresh `juaner_validator` independently rechecks the exact Candidate.
- Policy: `docs/governance/test-asset-retirement.md`.

## Preserved Historical Rejected Evidence

The following facts are preserved exactly as historical evidence from the rejected old contract. They SHALL NOT be used as reduced-V1 Test release, GREEN, Regression, retirement, or Validator evidence.

| Historical asset | Lines | Historical SHA-256 | Historical disposition |
|---|---:|---|---|
| `coordinator.test.mjs` | 1,511 | `ee1efbf0d05370e538d030cf3e74f3f8b7f566cd2d1b71822b468d4b2476a1b9` | rejected old-contract focused-green asset; not frozen for reduced V1 |
| `cli.test.mjs` | 207 | `d7b8d8e0d50d6c4c04ec5186f889b701330f0068b9dce9490af61840f77259b0` | rejected old seven-command asset; not frozen for reduced V1 |
| `git.integration.test.mjs` | 475 | `356fca48478763a29c2ddcc4739825a8c67cd8f92a82d2473bf43137e35f61b5` | rejected old Evidence-enumeration/17-method asset; not frozen for reduced V1 |
| `fixtures.mjs` | 493 | `4447ba341104fbc07cf8a170412d490dd0edf579d42f453fe734b96204624293` | rejected old-contract helper asset; not frozen for reduced V1 |

- Historical environment: Node `v26.0.0`; Git `2.54.0`.
- Historical focused execution: Coordinator `223/223`, CLI `8/8`, and Git integration `26/26`.
- Historical disposition: focused GREEN rejected by repeated dual-axis review; TDD_READY coverage invalidated; Regression, retirement, Candidate, and Validator were not released.
- Historical Tests were based on 12 old `TEST-DTF-001..012` identities. Reduced V1 uses new `TEST-DTF-R1-001..012` identities and does not silently reuse old mappings or hashes.

Historical failures, corrections, review findings, and PASS/FAIL claims remain in `verification.md`. This file does not overwrite or reinterpret them.

## Reduced-V1 Planned Lifecycle Ledger

| Asset / planned identities | Class | Reduced contract consumer | Planned disposition |
|---|---|---|---|
| `coordinator.test.mjs` / R1-001..010,012 | permanent regression | four interfaces, pointer/state/mutex, serial Agent flow, repair, Ledger, Candidate/delivery/recovery/RELEASE | retain while reduced Coordinator is supported |
| `cli.test.mjs` / R1-001,002,010,011,012 | permanent regression | canonical signed-byte submission to the Activation-owned ingress, read-only local/authenticated-SSH `status`, canonical result/error/exit/signal/no-shell contract, and rejection of direct mutation/state/trust/gateway access | retain while CLI exists |
| `git.integration.test.mjs` / R1-002,006,008..011 | permanent regression | same-driver temporary Git proof for Worktree/stage/commit/diff/push/recovery/ff-only sync | retain while Git gateway exists |
| `fixtures.mjs` pointer/state/mutex/clock/ID helpers | permanent regression helper | deterministic concurrency/state/replay and exact crash-window scheduling | retain only while named suites import it |
| `fixtures.mjs` verifier/Agent/Ledger/validation/PR/Handoff doubles | permanent regression doubles | canonical signatures, settlements, evidence, recovery, forbidden-call logs | retain only while named suites import them |
| runtime OS temporary repositories/bare remotes | temporary runtime-only evidence | local Git behavior and two-clone canonical-diff reproduction | bounded test process only; never track or cite as durable artifact |
| ad hoc diagnostic probe, if needed | temporary untracked evidence | toolchain/Test diagnosis only | `/private/tmp` only; remove before evidence freeze; never substitute for RED/GREEN |

Any new helper/export/double/Test identity requires a named current AC, distinct failure/mutation owner, tracked consumer, and final disposition before TDD_READY. Spec/Test SHALL not preserve an old interface/state/event/lock/recovery mechanism merely to reuse an old asset.

## TDD_READY Freeze Fields

Future Test handoff SHALL record for every tracked asset:

- exact path, line and scheduled-leaf counts, and SHA-256;
- mapped reduced REQ/AC/Test IDs and distinct positive/negative/boundary/failure/forbidden-effect purpose;
- imports/consumers, class, and planned final disposition;
- exact commands, environment, Node/Git versions, and temporary-root boundary;
- helper-health and causal RED results;
- production baseline/hash and current scope status; and
- absence of orphan/duplicate/temporary tracked assets and skip/todo/only/scratch markers.

No value above is prefilled from historical evidence.

## Post-GREEN Retirement Gate

Test Asset Retirement is not a lifecycle state, phase, or Ledger event class. Foundation records it only as:

```text
event_class: VALIDATION_RESULT
validation_kind: REGRESSION
validation_scope: TEST_ASSET_RETIREMENT
```

After focused GREEN, Controller SHALL:

1. reconcile the complete four-file Test diff with this ledger and traceability;
2. run the required complete-diff overdesign/ponytail review and record findings or exact lean verdict;
3. require a distinct current AC/failure/mutation consumer for every retained Test/helper/double;
4. prove every removed Test has an exact retained successor or was diagnostic-only and never formal evidence;
5. prove every exported helper/double has at least one tracked consumer;
6. inspect duplicates/equivalent rows, orphan imports, and skip/todo/only/scratch/temporary assets;
7. prove temporary cleanup is bounded to a resolved test-owned root;
8. rerun every affected focused/integration/canonical command after Test-only cleanup; and
9. freeze final hashes/counts/commands/successor map and record `PASS` or `FAIL` as the REGRESSION validation result.

Production remains frozen during a Test-only retirement return. Worker SHALL never edit Tests to obtain the Gate.

## Mandatory Retention and Deletion Rules

- Every causal RED leaf becomes permanent regression after GREEN.
- WIP-pointer corruption, mutex race, Agent stage identity, bounded repair, dirty/scope/Candidate/remote/PR mismatch, Ledger outage, four recovery boundaries, canonical raw-byte diff, RELEASE crash windows, and no-live-effect leaves remain distinct risks.
- The deterministic Git double and temporary real Git driver both remain while the gateway exists; neither substitutes for the other.
- Foundation/Activation stop-line tests remain permanent through Activation unless a later approved Spec changes the boundary.
- Old seven operations, nineteen states, seventeen events, two locks, `RecoveryStateV1/PREPARED/OBSERVED`, Evidence Ref WIP enumeration, embedded diff, unbounded repair, caller-injected trust, and generic Git/GitHub/platform helpers SHALL be removed from current Test authority. Their historical bytes/results remain preserved by Git/history and verification evidence, not by current assertions.
- No Test may touch the real trust path/key, require root, change SSH/ACL/permissions, call a real Agent/model/GitHub/origin, or persist ephemeral private/signature/nonce bytes.

## Validator Recheck

Fresh Validator SHALL compare the exact Candidate tree, Test hashes/imports, traceability, command receipts, retirement validation record, temporary-root safety, and forbidden-effect logs. Any orphan/temporary tracked asset, unresolved retirement candidate, missing successor, duplicate without distinct risk, unsafe cleanup, old-contract-only assertion, or wrong Candidate SHA returns FAIL to this Gate.

## Reduced-V1 Revision Consumers

The existing twelve planned Test identities remain the only consumers; no historical asset is revived and no thirteenth identity is added. Retirement reconciliation SHALL additionally prove that F1/F2/F3/F5/F8 leaves are present in those consumers while the closed F4/F6/F7 leaves remain unchanged. Any assertion that directly constructs the production Coordinator from CLI code, exposes `run` or `settlement` as a production CLI mutation command, opens the state root from the production CLI, injects verifier/gateways, treats a local Ledger copy as authority, or leaves BLOCKED recovery unspecified is an old-contract-only assertion and SHALL be retired or rewritten. The retained CLI surface is only ingress submission of canonical signed bytes plus read-only local/authenticated-SSH `status`; four Coordinator library interfaces remain a separate internal contract.

Final hard-safety reconciliation SHALL also retire any F2 assertion that writes READY/admission evidence before the active slot is published/read back or auto-completes an incomplete reserved admission, and any F3 assertion that replays `run` after Candidate/push/Ledger/PR-Handoff ambiguity became durable BLOCKED. The retained successors must prove pointer-first WIP exclusion and manual stop with no later gateway call; exact public-request replay remains only for the unchanged Evidence-unavailable local-pause rule.

## Reduced V1 Post-GREEN Gate — 2026-08-26

This section supersedes only the earlier `not released/not run` status. Historical rejected hashes and findings above remain historical facts.

### Frozen assets and executable evidence

| Asset | Lines | Scheduled results | Final SHA-256 | Classification / owner |
|---|---:|---:|---|---|
| `coordinator.test.mjs` | 725 | 126/126 PASS | `a4e06b4b37defe32f09f60450001278e11e6e6f0e3da58536931dfc540738af5` | permanent regression; R1-001..010 safety, lifecycle, delivery, ambiguity and RELEASE owner |
| `cli.test.mjs` | 129 | 27/27 PASS | `28dcc5911c337bf7c3920bc8606657acced5292d5996dba8f77a9d30dd79a84a` | permanent regression; signed ingress/read-only status/bypass rejection owner |
| `git.integration.test.mjs` | 273 | 18/18 PASS | `b56712c825a5891ffb1be329c2f5714d9457468c402da1c854aa07111d44e358` | permanent integration regression; real temporary Git/raw diff/main-sync owner |
| `fixtures.mjs` | 194 | helper health included above | `ffe6774e23e591626d1a6cc046a483d4e78ee3dcf6ab87669344c8d16a634b76` | permanent deterministic doubles/helpers, subject to the recorded unused export below |

- Combined focused command: `node --test coordinator.test.mjs cli.test.mjs git.integration.test.mjs` -> **171/171 PASS**, zero fail/cancelled/skipped/todo.
- Existing safety-counterexample selection -> **49/49 PASS** for authentication, WIP, remote Ledger authority, Candidate/Validator/remote/PR/Handoff identity, and RELEASE pointer retention.
- Canonical `tools/harness/validation/run` -> exit `0`, including typecheck and existing product/governance regression suites.
- Environment: Node `v26.0.0`; canonical Git producer `/Users/huangbo/Dev/Env/homebrew/bin/git`, version `2.54.0`.
- The only final safety Test correction replaced the contradictory Handoff identity-mismatch leaf with one requiring successful `BLOCKED` write/readback and one Handoff call. Its causal RED was `state.writeState was not called`; GREEN uses the common production block path.

### Consumption, marker and temporary-root reconciliation

- All three Test modules import only tracked production or `fixtures.mjs` assets. Runtime Git repositories/remotes are created only under OS temporary roots and removed in `finally`; no generated repository, key, signature, nonce, live Agent, live GitHub result, or host mutation is tracked.
- No `test.skip`, `test.todo`, `test.only`, `t.skip`, `t.todo`, `t.only`, scratch file, or additional Test file exists in the eight-file harness.
- Current Tests contain no authority for the retired seven-operation, nineteen-state, seventeen-event, dual-lock, WIP-enumeration, embedded-diff, unbounded-repair, or generic-recovery designs. `LOCAL_PREPARED` remains only a negative observation proving that local bytes are not durable Ledger evidence.
- Export-consumer scan found one non-safety residual: `fixtures.mjs` exports `already`, but no tracked Test consumes it. All other exported helpers/constants have a tracked direct or helper-health consumer.

### Ponytail review

`fixtures.mjs:L53: delete: unused already helper has no tracked consumer. Nothing replaces it.`

`net: -1 lines possible.`

The frozen hard stop permits only the enumerated safety classes to reopen Test. Removing this non-safety one-line helper after the final Test freeze was therefore not authorized. It is retained as an explicit Mode Activation/regression risk record and is not cited as coverage.

### Verdict

`PASS — USER-AUTHORIZED NON-SAFETY WAIVER`

The executable coverage, temporary-root boundary, old-contract retirement, distinct current risk ownership, and final safety correction pass. The ordinary policy consumer rule would require removal of the unused `already` export; the user's higher-priority hard stop explicitly directs that a post-freeze non-safety detail be recorded rather than reopen Test. This waiver is visible to the fresh Validator and does not waive any authentication, WIP, Ledger durability, Head binding, RELEASE pointer, or unrecoverable-data defect.
