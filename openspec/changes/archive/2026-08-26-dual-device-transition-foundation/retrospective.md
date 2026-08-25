# Retrospective: Dual-device Transition Foundation — Reduced V1

## Identity and Outcome

- Change: `CHG-dual-device-transition-foundation`
- Change class: foundation/bootstrap + R2 boundary change
- accepted development baseline: `5236867c75b2166946dd9d2b81f19f0bd10d4f2e`
- archive path: `openspec/changes/archive/2026-08-26-dual-device-transition-foundation/`
- canonical spec: `openspec/specs/dual-device-transition-foundation/spec.md`
- exact-Candidate Validator verdict: external PR/Candidate-bound receipt; never embedded into the tree it validates
- Controller Acceptance and squash merge: external GitHub/Controller receipts; never preclaimed by this archive
- Mode Activation: explicitly excluded and hard-stopped at `MODE_ACTIVATION_INTAKE_GATE`

## Delivered Value

The Foundation provides an inactive, deterministic contract for MacBook Controller plus Mac mini Change Coordinator with Global WIP=1. It freezes four Coordinator interfaces, six macro states, seven Ledger event classes, one short process mutex and four high-value ambiguity boundaries. A verified same-process DISPATCH can drive Worktree, Spec, Test RED, Worker GREEN, Regression, final validation, Validator, exact Candidate commit/push/freeze, PR and Handoff. A restart without complete route authority stops at `BLOCKED / MANUAL_CONTROLLER_STOP`; it never invents a default route.

Foundation contains no real key, trust installation, ACL/permission/SSH change, trusted host loop, live Agent launch, live GitHub credential canary, product Change, main push/merge authority, queue, daemon, cross-Change parallelism, Issue/Project scheduler or generic recovery platform.

## Final In-tree Evidence

| Evidence | Result | Authority |
|---|---|---|
| Reduced Spec closure | 7 Requirements / 51 AC / 12 Test identities; final F2/F3 hard-safety readback closed | `spec.md`, `traceability.md`, `verification.md` |
| causal RED | final Handoff durability leaf failed because production skipped `state.writeState` | project-control `HOFRED`, verification |
| target GREEN | Coordinator/CLI/Git combined **171/171 PASS** | frozen four-file Test hashes |
| safety selection | authentication/WIP/Ledger/Head/RELEASE **49/49 PASS** | Controller rerun |
| per-file regression | Coordinator **126/126**, CLI **27/27**, Git **18/18** | node:test receipts |
| canonical regression | `tools/harness/validation/run` exit `0` | Controller runner receipt |
| Test Asset Retirement | `PASS — USER-AUTHORIZED NON-SAFETY WAIVER` | `test-asset-retirement.md` |
| current/archived spec identity | SHA-256 `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69` on both paths | Controller readback |
| live runtime/external proof | excluded from Foundation | Mode Activation intake |

Production/reference SHA-256 at evidence freeze:

- `coordinator.mjs`: `556deacf5265e2f6d8153585061e2cbbf878ae77509cd852f7c8dc47cdb65869`
- `cli.mjs`: `aa61b6005a58827824dfed6c2642050d53d2ebdd98cb86a10147a547df810510`
- `adapters.mjs`: `05e7598ccc185eaf3b0ef27e9662c121efac76837debf83caedb2c5c0183568c`
- `README.md`: `b804df7c1f18a8bf068859d894aee06589e36aca32102e727cf6d0c555e28243`

## Effort and Rework

- The original design expanded toward a production-grade general scheduler: seven public operations, nineteen states, seventeen events, two locks, broad PREPARED/OBSERVED recovery and full trust lifecycle.
- Scope reduction retained the high-value safety invariants and removed the general platform. The complete correction history remains in project-control and `verification.md`; it is evidence, not current authority.
- Two final dual-axis reviewers were the last Standards/Spec reviewers. Their findings became bounded Test/Worker inputs; no further Standards/Spec review was started.
- Test corrections were repeatedly bounded to causal contradictions and the enumerated safety classes. The final Test identity count remained twelve and the final tracked Test file count remained four.
- One same-Worker prompt admission failed before execution and is recorded as `START_FAILED`; the bounded retry succeeded without scope change.
- The final safety blocker was caught after an apparent 171/171 GREEN: Handoff identity conflict claimed a durable `BLOCKED` state while skipping its write. One Test leaf and one production special-case removal closed it.

## Good Friction

- Exact Candidate/Validator/remote/PR Head binding prevented aggregate GREEN from substituting for delivery identity.
- Pointer-first admission and remote Ledger readback made WIP and evidence failures fail closed.
- Targeted Controller probes found dirty-main, fake Git version/common-dir, result-shape and false-state-persistence defects that broad suites initially missed.
- The hard stop prevented non-safety details from reopening another Test/Worker contract loop after the final safety closure.
- The archive authorization Gate prevented an authority-structure move from being hidden inside Candidate preparation.

## Avoidable Friction

| Friction | Root cause | Future control |
|---|---|---|
| platform-shaped initial scope | exceptional recovery was treated as a V1 completion requirement | normal path automatic; exceptional path stops with evidence |
| repeated Test/Worker corrections | early tests encoded implementation shortcuts or mutually inconsistent outcomes | require same-input causality and exact GatewayResult shape before TDD_READY |
| green aggregate rejected by direct probes | selected call assertions did not prove actual adapter/state semantics | retain direct negative probes for the five hard safety classes |
| route reconstruction drift | durable digest was mistaken for full role/scope authority | same-process verified DISPATCH only; restart without full authority manual-stops |
| Handoff false persistence | one Test simultaneously forbade state write and expected durable BLOCKED | require write plus readback for every durable state claim |

## Complexity Stop-line Audit

- stop line crossed: yes, during the original platform-shaped Foundation and repeated contract/test correction cycles
- trigger: state/event/recovery/trust surfaces materially exceeded a personal two-device, Global-WIP-one workflow
- root-cause class: over-generalization and exceptional-path automation
- return Gate: `PAUSED_FOR_SCOPE_REDUCTION`, then Reduced V1 Spec-only/Test/Worker gates
- re-slicing decision: preserve one Foundation Change but reduce it to normal-path automation plus fail-closed manual stop
- quality evidence preserved: all old specs, findings, RED/GREEN attempts, Controller decisions and Agent run events remain in archive/project-control history

## Reusable Outputs

| Asset | Future trigger | Reuse rule |
|---|---|---|
| Reduced Coordinator contract and canonical spec | Mode Activation or later Coordinator change | reuse unchanged; authority/schema/scope drift requires a new approved Change |
| four production/reference modules | trusted host-loop composition | no real host activation until the Mode Activation policy and canaries are approved |
| four Test/fixture modules | every Coordinator or Git-adapter change | retain exact safety negatives and temporary-Git isolation |
| Worktree/Candidate/PR/Handoff identity matrix | every delivery change | no freeze or handoff unless all exact Heads agree |
| Agent lifecycle records | every Agent run | preserve REQUESTED/STARTED/RESULT/START_FAILED/INTERRUPTED/NOT_STARTED evidence |
| Test Asset Retirement ledger | every Test change | reconcile consumers and risk ownership; do not infer deletion from GREEN |

## Lessons

| Lesson | Classification | Target | Approval needed |
|---|---|---|---|
| Normal-path automation plus reliable manual stop is the maintainable personal V1 boundary | workflow | Mode Activation run policy | user confirmation before activation |
| Aggregate GREEN is an index; exact state, adapter and negative readbacks are proof | validation | Validator/Controller briefs | no new design approval |
| Candidate-bound external receipts avoid self-referential in-tree Validator claims | evidence | PR/Validator handoff template | user confirmation with Mode Activation package |

## Process and Tooling Debt

| Debt | Impact | Owner / release condition |
|---|---|---|
| real Controller signing/trust/forgery canary absent by design | production authenticity not activated | Mode Activation: real key/trust and forged/replay rejection |
| trusted Mac mini host loop absent by design | Foundation remains inert | Mode Activation: sole-writer launch/settlement canary |
| live GitHub PR/Handoff adapter canary absent by design | deterministic proof only | Mode Activation: exact head/base/readback with no merge authority |
| unused exported `fixtures.mjs` helper `already` | one line of non-safety test debt | later explicitly authorized test-only cleanup; not coverage |

## Next Baseline and Stop Line

- Behavior to reuse after integration: Global WIP=1; one active Change; independent Worktree; exact Agent sequence; one bounded Validator repair; exact Candidate/PR/Handoff; MacBook-only Acceptance/merge/archive/RELEASE.
- Decisions not to reopen in Mode Activation: no Issue/Project scheduler, no cross-Change parallelism, no default route, no generic replay platform, no main push/merge from Mac mini.
- Next work item: user-provided product-Change development-flow simplification, translated by Controller into Mode Activation run policy, Agent Brief and Dispatch template.
- Mandatory stop: after Foundation squash merge, archive-tree confirmation and dual-main synchronization, remain at `MODE_ACTIVATION_INTAKE_GATE`; do not activate or dispatch a product Change.

## Completion Boundary

- [x] In-tree Spec, Test, production, Regression, retirement, traceability and archive facts are current and evidence-backed.
- [x] Historical failures and reviews remain preserved without becoming current authority.
- [x] No real trust, host, SSH, permission, GitHub credential or product effect is represented as complete.
- [x] Exact-Candidate Validator and Controller Acceptance are external Candidate/PR receipts, preventing a self-referential tree mutation.
- [x] Deferred Mode Activation canaries and the one non-safety helper risk are explicit.
