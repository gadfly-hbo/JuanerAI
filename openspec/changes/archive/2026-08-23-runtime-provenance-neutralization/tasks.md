# Tasks

## Gate Order

Spec package -> mandatory complete-diff `ponytail-review` -> Spec deletes findings if any -> Controller Spec Gate -> Test role -> healthy causal RED -> TDD_READY -> Worker -> GREEN/regression -> Test Asset Retirement Gate -> frozen evidence -> fresh read-only Validator -> Controller acceptance -> merge delta/current spec -> archive.

No task below authorizes the next role before its named Gate.

## TASK-RPN-001 — Freeze the R2 Decision Package

- Owner: Spec role
- Maps: every modified `REQ/AC` in the delta
- Write set: this Change directory only
- Result: Proposal, delta Specification, Design, Tasks, Test Plan, traceability, activation/rollback, path scope, and verification read model agree with no open load-bearing decision

## TASK-RPN-002 — Mandatory Simplicity Review and Spec Gate

- Owner: Controller using `ponytail-review` on the complete OpenSpec diff; findings return to Spec
- Review target: every schema field, validator, readiness value, compatibility branch, test asset, and task has a current consumer and maps to the approved objective
- Required deletions: any registry, generic provenance service, new Port method, migration/repair/scan, user option, second Runtime, retained rollback reader, duplicate model field, or speculative enterprise machinery
- Exit: Controller records Spec Gate PASS or returns an exact decision/contract blocker

## TASK-RPN-003 — Derive Tests and Establish Causal RED

- Owner: `juaner_test`, only after Spec Gate
- Allowed/forbidden paths: exact Test policy in `proposal.md`
- Maps: RPN-T01 through RPN-T12 in `test-plan.md`
- Required result: helper/environment/coverage health; independently scheduled positive/negative/version/compatibility cases; causal RED against production baseline; exact hashes/commands/counts; Test Asset Lifecycle Ledger; frozen Worker write set
- Constraint: production, dependencies, current spec, user runs, and real provider/model remain frozen

## TASK-RPN-004 — TDD_READY Gate

- Owner: Controller
- Required evidence: current production is the cause of RED; no broken helper or environment; each mutation/operation/version is independently represented; test types consume production seams; retirement ledger is complete; no assertion is weakened
- Exit: record TDD_READY and release only the frozen Worker paths, or return to Test/Spec with the exact cause

## TASK-RPN-005 — Implement the Minimum Boundary Delta

- Owner: `juaner_worker`, only after TDD_READY
- Allowed/conditional/forbidden paths: exact Worker policy in `proposal.md`
- Maps: all modified Requirements/ACs
- Required result: current `2.0` validator/type; bounded readable-terminal validator; changed preflight response; SDK `VERSION` observation; Profile identity flow; Application ownership/equality/terminal copies; current-only mutation and exact dual terminal read
- Constraint: no test edit, package change, second Runtime, registry/fallback, new Port method, migration/repair, user-directory inspection, real provider/model, or unrelated refactor

## TASK-RPN-006 — GREEN, Regression, and Retirement Gate

- Owner: Controller reviews Worker evidence; Test role owns any test-only correction
- Commands/evidence: focused Unit/Contract/Integration/E2E groups, both affected Adapter contracts, unchanged Local Analysis Execution contract, `npm run typecheck`, canonical offline runner, scope/architecture/data/secret scans, exact counts, byte-preservation snapshots
- Test assets: reconcile lifecycle ledger, run complete test-diff `ponytail-review`, record Test Asset Retirement Gate PASS before freeze
- Exit: all Requirements/ACs have executable GREEN evidence and implementation/test hashes are frozen

## TASK-RPN-007 — Independent Verification

- Owner: fresh `juaner_validator`, read-only
- Start: implementation, tests, traceability, verification read model, and retirement evidence frozen
- Required verdict: PASS, FAIL, or BLOCKED with independently executed evidence for schema, ownership, compatibility, rollback, architecture, scope, security, and regression
- Constraint: Validator does not implement, approve, or edit evidence

## TASK-RPN-008 — Acceptance and Archive

- Owner: Controller
- Start: Validator PASS or explicit authorized waiver
- Result: record acceptance, merge only the approved delta into current `local-analysis` spec, archive the complete Change, update the Controller-owned project board, and verify verdict/baseline/archive/board consistency
- Git integration: commit/push/PR/merge only under separate active user/workflow authority
