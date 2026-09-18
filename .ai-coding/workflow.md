# Change Workflow

## Standard Path

1. Request: capture raw intent; write no product code.
2. Explore: read relevant product, spec, architecture, source, tests, and contracts.
3. Proposal: state why, goal, scope, non-goals, risks, and dependencies.
4. UI Contract: build or revise a change-scoped clickable contract in the accepted product UI mode. It exposes the complete user workflow, visible states, failures, cancellation, retry/recovery, applicable data/provider disclosures, and acceptance endpoints without requiring source-code inspection.
5. User UI Gate: bind the exact UI Contract version/path and record the user's `PASS`. `NEEDS_REVISION` returns to Step 4.
6. Execution Package Freeze: MacBook creates the complete bounded package, commits and pushes its work branch, reads back the exact remote branch/commit/tree/package hash, and stops writing that branch.
7. New Mac mini Session Dispatch: after transfer authorization, MacBook creates one new Codex task on the saved Mac mini JuanerAI project and sends the frozen package as the initial message. Record the new task/thread, host, project, repository, and delivery status. A pending task remains in this step; failed or ambiguous delivery becomes `BLOCKED_SESSION_DISPATCH`.
8. Specification: the new Mac mini execution task dispatches `juaner_spec` and defines atomic Requirements and observable Acceptance Criteria from the approved UI Contract and product decisions.
9. Design: define boundaries, contracts, failures, security, compatibility, and rollback.
10. Tasks: map every Task to Requirements, tests, allowed paths, and the approved UI Contract.
11. Spec Gate: Controller-delegated coordinator verdict within the frozen package is `PASS`.
12. Test Design: derive test cases from Acceptance Criteria and approved UI states.
13. RED: prove failures are caused by missing target behavior.
14. Implementation: make the minimum approved production change.
15. GREEN and Refactor: pass target tests; refactor only after GREEN.
16. Regression and Quality: run the approved risk-based command set.
17. Test Asset Retirement: for Changes that touched test assets, reconcile their lifecycle ledger and pass `docs/governance/test-asset-retirement.md`.
18. Verify: independently check spec, UI Contract conformance, scope, architecture, traceability, and evidence.
19. Accept: MacBook Controller or user approves according to risk.
20. Archive: merge the delta into openspec/specs and preserve Change history.

## Product UI-First Gate

Every formal product Change completes Steps 4 and 5 before OpenSpec creation or
`juaner_spec` dispatch. The UI Contract must reuse the accepted product UI mode
and make the Change directly evaluable by a non-technical user. A generic
platform, backend, runtime, adapter, or infrastructure Change may not bypass
this Gate; if its product effect cannot be represented in the UI Contract, the
Proposal is not ready. A material post-PASS change to the workflow or visible
acceptance surface invalidates the prior verdict and returns to Step 4.

Documentation-only governance work that changes no product behavior is not a
formal product Change and stays on the reduced R0 path below.

## Dedicated Mac mini Session Gate

Step 7 always creates a new execution task for a newly authorized batch. Bind
it directly to the saved Mac mini JuanerAI project checkout and the repository
named by the package unless the user or package explicitly requires a managed
worktree; do not infer a destination from the most recent task, foreground
task, or ambient UI state. Put the complete transfer instruction in the new
task's initial message so creation and transfer are one operation. Use an
existing task only when the user names that exact task.

The dispatch receipt must prove the new task identity, Mac mini host, saved
project, expected repository, frozen branch/commit/tree, package path/hash, and
active/ready status. Session creation authority does not authorize host
operations, dependency installation, provider calls, repository writes, or a
production role before the package's first local Gate. If automatic creation or
delivery is unavailable, preserve the frozen branch and package and request the
single manual create/open-and-forward fallback; never silently route to another
task.

This Gate is prospective. A batch already delivered and active when the rule is
adopted remains in its current task; do not create a duplicate task for it.

## Lightweight Paths

Documentation-only work may use a reduced R0 flow with scope review and evidence. A pure refactor requires a verified pre-change GREEN baseline. An emergency fix requires an immediate regression test and mandatory later specification backfill.
