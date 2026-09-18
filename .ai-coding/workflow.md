# Change Workflow

## Standard Path

1. Request: capture raw intent; write no product code.
2. Explore: read relevant product, spec, architecture, source, tests, and contracts.
3. Proposal: state why, goal, scope, non-goals, risks, and dependencies.
4. UI Contract: build or revise a change-scoped clickable contract in the accepted product UI mode. It exposes the complete user workflow, visible states, failures, cancellation, retry/recovery, applicable data/provider disclosures, and acceptance endpoints without requiring source-code inspection.
5. User UI Gate: bind the exact UI Contract version/path and record the user's `PASS`. `NEEDS_REVISION` returns to Step 4.
6. Specification: define atomic Requirements and observable Acceptance Criteria from the approved UI Contract and product decisions.
7. Design: define boundaries, contracts, failures, security, compatibility, and rollback.
8. Tasks: map every Task to Requirements, tests, allowed paths, and the approved UI Contract.
9. Spec Gate: Controller approves the complete package.
10. Test Design: derive test cases from Acceptance Criteria and approved UI states.
11. RED: prove failures are caused by missing target behavior.
12. Implementation: make the minimum approved production change.
13. GREEN and Refactor: pass target tests; refactor only after GREEN.
14. Regression and Quality: run the approved risk-based command set.
15. Test Asset Retirement: for Changes that touched test assets, reconcile their lifecycle ledger and pass `docs/governance/test-asset-retirement.md`.
16. Verify: independently check spec, UI Contract conformance, scope, architecture, traceability, and evidence.
17. Accept: Controller or user approves according to risk.
18. Archive: merge the delta into openspec/specs and preserve Change history.

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

## Lightweight Paths

Documentation-only work may use a reduced R0 flow with scope review and evidence. A pure refactor requires a verified pre-change GREEN baseline. An emergency fix requires an immediate regression test and mandatory later specification backfill.
