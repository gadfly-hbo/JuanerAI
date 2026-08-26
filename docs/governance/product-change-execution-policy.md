# Product Change Execution Policy

This document is the sole durable policy authority for the activated JuanerAI
dual-device product-Change mode. Other project documents link here without
restating the policy.

## Authority and Global WIP

The MacBook Controller is the sole decision authority and the Mac mini is the
sole current-Change executor. Global WIP is exactly 1.
`active-change.json.active_change_id` is the sole WIP authority. Task-tracker
records, scheduling facilities, Ledger, Evidence Ref, branches, PRs, and scans
are observational only and never infer an empty slot.

The Controller alone owns product semantics, the signed authority package, PR
review, `changes_requested`, archive decision, Acceptance, squash merge,
RELEASE, project-control, and authorization of future work. The host can act
only on the currently signed Change.

## D1-A Intake

Before DISPATCH, D1-A requires one fresh read-only Product Plan Reviewer. The
Reviewer receives only the plan, formal attachments, explicitly cited JuanerAI
authority, and its seven-part review brief. Findings are classified as
`SPEC_BLOCKER`, `TEST_REQUIRED`, `IMPLEMENTATION_DETAIL`,
`ACTIVATION_OR_HOST_VALIDATION`, or `NON_BLOCKING_FOLLOWUP`.

The Controller may make at most one bounded semantic correction and then does
a targeted readback. It does not automatically launch a second Reviewer. There
is no post-DISPATCH Reviewer route. The final Artifact Package and review,
correction, disposition, and receipt hashes are frozen before signature.

## Signed Automatic Execution

A valid signed DISPATCH binds the exact repository, Change, Worktree, baseline,
branch, scope, role routes, validation definitions, archive target, external
prerequisites, and stop lines. After DISPATCH the existing Coordinator advances
without per-Gate human acknowledgement:

```text
Worktree -> Spec -> Test RED -> Worker GREEN -> Regression and Retirement
-> Candidate -> final validation -> Validator -> branch push/readback
-> Candidate freeze -> PR/readback -> Handoff -> AWAITING_CONTROLLER
```

The four project roles remain fresh and isolated. The host launches only the
exact `AGENT_ACTION`; Git, Ledger, validation, PR, Handoff, and state mechanics
remain inside the existing Coordinator interfaces.

Each DISPATCH or signed REVISION authorization cycle permits at most one
same-scope Validator automatic repair, and only after finding-specific causal
RED. A second Validator FAIL enters `BLOCKED`. Any contract, architecture,
scope, path, dependency, permission, credential, host, identity, or evidence
ambiguity also enters `BLOCKED` and never widens authority by default.

## Review, Archive, Release, and Final Stop

The first Handoff stops at `AWAITING_CONTROLLER` and does not archive. After PR
review the Controller alone may sign an archive REVISION binding the current
Frozen Candidate and exact active, archive, and canonical paths. The Mac mini
performs only that mechanical same-scope archive, creates a descendant
Candidate on the same branch and PR, and repeats final validation, Validator,
and Handoff. It never decides archive or Acceptance.

After Controller Acceptance, squash merge, archive readback, and MacBook-main
readback, signed RELEASE allows only the existing clean ff-only Mac mini main
synchronization, durable CLOSED state, and pointer-clear-last sequence. RELEASE
does not merge, push main, clear evidence, or authorize a new Change.

Successful activation ends only at
`ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. A separate
explicit user authorization and a completed new D1-A intake are required before
the first or any next product Change.

## Fail-closed Recovery and Rollback

Candidate commit, branch push, Ledger append, and final PR/Handoff remain the
only four automatic readback boundaries. Unresolved ambiguity becomes
`MANUAL_CONTROLLER_STOP`; restart never invents route, scope, state,
credential, or recovery authority.

Rollback stops ingress and restores the exact recorded installation or absence
while preserving the active pointer, Coordinator state, Ledger, Handoff,
canary evidence, and Git history. It never resets history, clears WIP, deletes
evidence, or claims success without readback.
