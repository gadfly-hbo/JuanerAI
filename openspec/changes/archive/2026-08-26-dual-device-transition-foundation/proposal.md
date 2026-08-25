# Proposal: Dual-device Transition Foundation — Reduced V1

## Decision

- Change: `CHG-dual-device-transition-foundation`
- Planning node: `Transition Foundation`
- Baseline: `5236867c75b2166946dd9d2b81f19f0bd10d4f2e`
- Branch: `work/macbook/dual-device-transition-foundation`
- Class: Foundation/bootstrap and R2 durable-boundary Change; `greenfield_fast_path` is forbidden.
- Controller: MacBook Integration Controller.
- Execution coordinator: Mac mini Change Execution Coordinator.
- Global write-capable WIP: exactly `1`.
- Current final-correction target: `FINAL_HARD_SAFETY_CORRECTION_READY_FOR_CONTROLLER_READBACK`; this Proposal does not claim Spec Gate PASS.

## Reduced Outcome

Transition Foundation V1 establishes one inactive, deterministic Coordinator contract that can later, only after Mode Activation, execute one signed and already-authorized Change from DISPATCH to a review-ready pull request. The reduced Foundation keeps the safety-critical authority, Candidate, recovery, and delivery invariants while deleting the old platform-shaped surface.

The public contract is exactly four interfaces:

1. `applyControllerCommand`;
2. `run`;
3. `settlement`;
4. `status`.

The durable lifecycle has exactly six macro states:

```text
READY / EXECUTING / DELIVERING / AWAITING_CONTROLLER / BLOCKED / CLOSED
```

The Ledger has exactly seven event classes, the Coordinator uses one process-owned short operation mutex, and automatic crash recovery is limited to four named high-value boundaries. No old count, schema, state, event, lock, or recovery mechanism is preserved for compatibility.

## Why This Is a Foundation/bootstrap Change

The repository has formal roles, Git governance, and validation entrypoints, but it does not yet have an accepted single-Change execution transaction connecting signed Controller authority, the Mac mini state root, role settlements, exact Candidate publication, PR readback, Handoff, and RELEASE. These are cross-cutting state, concurrency, recovery, signing, and Git/GitHub boundaries, so this remains R2 Foundation work even after reduction.

The prior package crossed the complexity stop line: seven public operations, nineteen lifecycle states, seventeen fine-grained Ledger events, two locks, universal `PREPARED/OBSERVED` recovery, Evidence Ref WIP enumeration, and embedded binary diffs produced an unaccepted implementation and tests. Reduced V1 removes that machinery rather than treating old GREEN as authority.

## Objectives

- Preserve MacBook Controller authority, Mac mini execution ownership, and Global WIP=1.
- Make `active_change_id` in the one initialized Mac mini state root the only WIP authority and the DISPATCH admission linearization point: publish/read back the non-null slot before READY or admission-event writes; missing, incomplete, corrupt, or conflicting admission is `BLOCKED / MANUAL_CONTROLLER_STOP`, never inferred empty or automatically completed.
- Automatically execute the normal path from a signed DISPATCH through Worktree setup, formal roles, Candidate commit and validation, bounded Validator repair, push/freeze, PR create-or-reuse/readback, Handoff, and `AWAITING_CONTROLLER`.
- Bind local Candidate Head, remote branch Head, Validator Head, PR Head, Handoff references, and canonical diff hash to one Frozen Candidate.
- Preserve immutable Agent/validation/Controller evidence without creating a general event or transaction platform.
- Close RELEASE, including clean ff-only Mac mini `main` synchronization and the exact `CLOSED` plus uncleared-pointer continuation.
- Freeze one physical-writer topology: after Activation, `applyControllerCommand`, `run`, and `settlement` execute only inside the Activation-owned trusted Mac mini host loop and share its one short in-process mutex; a production mutating CLI can only submit canonical signed bytes to that ingress or remain unavailable. `status` remains read-only.
- Make `refs/heads/evidence/agent-runs` the sole durable Ledger byte authority; any local Ledger file is only the unpublished exact append working copy or a local pause diagnostic and cannot advance a Gate.
- Keep real trust provisioning, SSH transport/access control, host-loop activation, production GitHub credentials, and live canaries in a separate Mode Activation Change.

## Acceptance Endpoint

Foundation acceptance, after later Test/Worker/Validator/Controller Gates, is deterministic proof that the inactive module implements the reduced contracts using doubles and temporary local Git repositories with no live effects. It is not dual-device mode activation.

This Foundation Change itself reaches those Gates, Candidate, PR review, squash merge, archive, and dual-main synchronization only through the current pre-Activation Git and governance workflow. It cannot depend on its own inactive signed-command, host-loop, automatic Candidate/PR/Handoff, or RELEASE mechanics.

Mode Activation has a separate, non-downgradable endpoint: an unattended signed DISPATCH must reach a review-ready PR with exact Candidate freeze and Handoff, allowing at most one same-scope automatic Validator repair in the current DISPATCH or signed REVISION authorization cycle.

## Reusable Seeds, Not Accepted Behavior

The current unaccepted tree may supply only these implementation/Test seeds:

- Worktree create/reuse/readback and exact status inspection;
- exact-path staging, index tree, Candidate commit, and local/remote Head readback;
- normal branch push with no force/main/delete path;
- PR create-or-reuse/readback without merge authority;
- canonical JSON, deterministic clocks/IDs, Agent correlation, and temporary Git fixtures.

Historical implementations, Test hashes, GREEN totals, and review findings remain risk evidence. They do not satisfy reduced V1 Requirements or release a later Gate.

## Scope

### Later Foundation implementation/Test paths

- `tools/harness/change-coordinator/coordinator.mjs`
- `tools/harness/change-coordinator/cli.mjs`
- `tools/harness/change-coordinator/adapters.mjs`
- `tools/harness/change-coordinator/README.md`
- `tools/harness/change-coordinator/coordinator.test.mjs`
- `tools/harness/change-coordinator/cli.test.mjs`
- `tools/harness/change-coordinator/git.integration.test.mjs`
- `tools/harness/change-coordinator/fixtures.mjs`
- `openspec/changes/dual-device-transition-foundation/**`

### Conditional later path

- `tools/harness/validation/run`: only an exact, Controller-released append after focused GREEN. No current modification is authorized.

### Forbidden paths and effects

- `.juanerai/project-control/**`, governance, Agent configuration, Git workflow, dependencies, product code, contracts, Profiles, existing product tests, host files, keys, credentials, or permissions;
- live origin/GitHub/SSH/model/provider/Agent invocation during Foundation tests;
- push or merge to `main`, PR approval/close/merge, branch/Worktree deletion, force-push, Acceptance, archive, or next-Change dispatch;
- H/P/C/A, Mode Activation, GitHub Issues/Projects, project-control v2, daemon, queue, background polling, multi-Change concurrency, or speculative multi-project/device abstractions.

Any need to widen scope, authority, schema, compatibility, dependency, permission, recovery boundary, or external effect returns `BLOCKED` to the Controller.

## Reduction Budget

| Old package | Reduced V1 |
|---|---|
| 7 public operations | 4 interfaces |
| 19 lifecycle states | 6 macro states |
| 17 fine-grained Ledger event types | 7 event classes |
| operation lock plus long Change lock | 1 process-owned short operation mutex |
| universal `RecoveryStateV1/PREPARED/OBSERVED` | 4 explicit recovery boundaries |
| Evidence Ref enumeration as WIP authority | local `active_change_id` pointer authority |
| embedded binary diff | fixed Git objects plus canonical raw-byte diff hash |
| auto-expanding repair | at most 1 same-scope repair per DISPATCH/REVISION cycle |
| real host trust lifecycle in Foundation | deterministic verifier contract; real host trust in Activation |

## Gate and Stop Line

The required order remains:

```text
Spec review
-> Test Design / causal RED
-> Worker / GREEN
-> Regression including Test Asset Retirement
-> exact Candidate and final validation
-> fresh Validator
-> Controller acceptance/integration/archive
-> separate Mode Activation
```

This Spec-only rewrite unlocks none of those later Gates. Test, Worker, Validator, Mode Activation, H/P/C/A, Git integration actions, and host changes remain locked.
