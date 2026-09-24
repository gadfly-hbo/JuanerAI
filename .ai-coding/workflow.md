# Change Workflow

## Standard Path

1. Request: Product Manager captures raw intent; write no product code.
2. Explore: Product Manager reads relevant product inputs and retained capabilities.
3. Product Proposal: state why, product goal, vertical scope, non-goals, risks, and deferred returns.
4. UI Contract: make the complete user workflow and visible acceptance surface directly evaluable.
5. User UI Gate: bind the exact UI Contract and record the user's PASS.
6. Product Input Freeze: freeze goal, scope, UI, business semantics, acceptance criteria, prohibitions, and upper stop lines; do not pre-freeze ordinary engineering mechanics.
7. Engineering Intake: Engineering Controller verifies repository, WIP, input identity, feasibility, retained evidence, and current stop point, then prepares the engineering package.
8. Specification: Spec defines atomic Requirements and observable Acceptance Criteria from the approved product input.
9. Design: define engineering boundaries, contracts, failures, security, compatibility, rollback, paths, commands, environment, and validation plan.
10. Tasks: map every Task to Requirements, tests, allowed paths, budgets, and stop lines.
11. Spec Gate: Engineering Controller approves the complete package.
12. Test Design: derive test cases from Acceptance Criteria.
13. RED and TDD_READY: prove failures are caused by missing target behavior, then record the Engineering Controller's TDD_READY verdict before Worker dispatch.
14. Implementation: make the minimum approved production change.
15. GREEN and Refactor: pass target tests; refactor only after GREEN.
16. Regression and Quality: run the approved risk-based command set.
17. Test Asset Retirement: for Changes that touched test assets, reconcile their lifecycle ledger and pass `docs/governance/test-asset-retirement.md`.
18. Verify: independently check spec, scope, architecture, traceability, and evidence.
19. Engineering Accept: Engineering Controller records the engineering verdict; Validator PASS alone is not acceptance.
20. Product Accept: when required, the Engineering Controller asks the user directly and records the separate product verdict.
21. Archive and Delivery: within granted Git authority, update the baseline, preserve Change history, integrate, and read back the result.

## Product UI-First Gate

Every behavior-changing product Change completes the UI Contract and User UI
Gate before Engineering Intake/OpenSpec. A generic platform, backend, runtime,
adapter, or infrastructure label does not bypass this Gate. A material change
to the approved user flow returns to UI Contract and the user.

An engineering contract gap that preserves the frozen product and upper
boundaries returns locally to Specification/Design. The Engineering Controller
repeats affected Gates and tests; it does not ask the Product Manager for an
ordinary technical amendment.

## Lightweight Paths

Documentation-only work may use a reduced R0 flow with scope review and evidence. A pure refactor requires a verified pre-change GREEN baseline. An emergency fix requires an immediate regression test and mandatory later specification backfill.
