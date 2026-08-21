# Change Workflow

## Standard Path

1. Request: capture raw intent; write no product code.
2. Explore: read relevant product, spec, architecture, source, tests, and contracts.
3. Proposal: state why, goal, scope, non-goals, risks, and dependencies.
4. Specification: define atomic Requirements and observable Acceptance Criteria.
5. Design: define boundaries, contracts, failures, security, compatibility, and rollback.
6. Tasks: map every Task to Requirements, tests, and allowed paths.
7. Spec Gate: Controller approves the complete package.
8. Test Design: derive test cases from Acceptance Criteria.
9. RED: prove failures are caused by missing target behavior.
10. Implementation: make the minimum approved production change.
11. GREEN and Refactor: pass target tests; refactor only after GREEN.
12. Regression and Quality: run the approved risk-based command set.
13. Verify: independently check spec, scope, architecture, traceability, and evidence.
14. Accept: Controller or user approves according to risk.
15. Archive: merge the delta into openspec/specs and preserve Change history.

## Xanthil First-Change Gate

Before Step 2 for the first behavior-changing Xanthil Change, request and review the user's detailed Xanthil plan. A generic platform or runtime Change may not be used to bypass this gate.

## Lightweight Paths

Documentation-only work may use a reduced R0 flow with scope review and evidence. A pure refactor requires a verified pre-change GREEN baseline. An emergency fix requires an immediate regression test and mandatory later specification backfill.

