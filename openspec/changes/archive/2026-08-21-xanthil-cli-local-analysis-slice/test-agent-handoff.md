# Test Agent Handoff

## Change and Goal

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Task: `TASK-001`
- Requirements: `REQ-XCLI-001` through `REQ-XCLI-016`; 51 approved Acceptance Criteria
- Gate input: Controller Spec Gate **PASS** recorded in `verification.md` on 2026-08-20
- One concrete outcome: derive executable `.mjs` tests from the approved ACs and return `TDD_READY` only after a healthy Node test environment demonstrates `EXPECTED_RED` caused by missing Xanthil product behavior.

## Non-Goals

- Do not implement production behavior, product contracts, Adapters, CLI code, Profiles, examples, manifests, lockfiles, or dependencies.
- Do not call a model, mutate global Pi configuration, access real/user/enterprise data, or weaken/defer an approved assertion to manufacture RED.
- Do not edit the approved Specification, Design, Tasks, Test Plan, Traceability, Verification, architecture, governance, project-control, or this handoff.
- Do not expand beyond the approved local synthetic CSV Analyst Assistant slice.

## Boundary

- Domain: quality / isolated Test role
- Allowed paths:
  - `tests/unit/xanthil-local-analysis/**`
  - `tests/contract/xanthil-local-analysis/**`
  - `tests/integration/xanthil-local-analysis/**`
  - `tests/e2e/xanthil-local-analysis/**`
  - `tests/fixtures/xanthil-local-analysis/**`
- Conditional paths: none
- Forbidden paths: every production path; all `openspec/**`; `.juanerai/**`; root `package.json` and `package-lock.json`; global Pi files; credentials; other repositories

## Inputs and Outputs

| Direction | Contract | Authority |
|---|---|---|
| input | `specs/local-analysis/spec.md` | approved observable behavior and exact fixture/oracle |
| input | `design.md` | frozen public seams, closed contracts, failure/data/security semantics |
| input | `test-plan.md` | approved `TEST-XCLI-001..022` intent and commands |
| input | `tasks.md` | `TASK-001` ownership and write boundary |
| input | `traceability.md` | complete AC-to-Test-to-Task mapping |
| input | `verification.md` | Spec Gate PASS and remaining stop lines |
| output | executable Node `node:test` `.mjs` suites and test-private fixtures/helpers | Test role; assertions freeze after Controller accepts TDD_READY |
| output | final handoff response using `docs/templates/HANDOFF_BACK.template.md` structure | Test role evidence; Controller decides TDD_READY |

## Constraints

- Shared terms: use `Finding`, `Evidence`, `Summary`, `Analysis Contract`, `Run`, and the exact repurchase-member vocabulary from `CONTEXT.md` and the approved Spec. Do not introduce `Decision`, recommendation, `Action`, or real-business claims.
- Confirmed public seams: CLI/Application interaction; Agent Analysis Runtime Port; Local Analysis Execution Port; Run Artifact Port. These seams were approved through `XCLI-STRUCTURE-001` and Controller Spec Gate. Tests observe public contracts and forbidden side effects, not private implementation details.
- Fixture/oracle: exact 20-row `member-orders-v1.csv`, SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`; baseline `10 / 6 / 4 / 4/6`; recent `10 / 9 / 1 / 1/9`; exact delta `-500/9 pp`; decline supported with no materiality/significance threshold.
- Security and data boundary: synthetic fixture only; no raw-row model egress; no secrets/environment/global Pi/project-control content; no generic shell/filesystem/arbitrary SQL/Python/network/action tool surface.
- Technical budgets: 30 seconds per analytical call and 300 seconds per post-confirmation attempt. Use controllable clocks; do not wait in real time.
- Dependencies: Node built-in `node:test` and `.mjs` only for this dispatch. Root manifest/lockfile creation, npm install, Pi package resolution, real Pi calls, and dependency-backed execution are not authorized.
- RED validity: first prove test/fixture helper health independently. A target RED must name the missing public behavior or module and cannot be caused by syntax errors, broken fixtures, unavailable credentials, an unapproved dependency, or a test-only self-failure.
- Stop lines: return `TEST_CONFLICT` on ambiguity/contradiction; return `ROUTING_ESCALATION_REQUIRED` if the R2 route is inadequate. Do not edit approved inputs or production to repair either condition.
- Write risk: low and reversible, restricted to new/changed files under the five named test paths. Do not delete or overwrite unrelated user files.
- Validation budget: run the four planned `node --test` target groups plus `node --check` for changed test `.mjs` files; avoid unrelated repository-wide commands and all model/network calls.

## Agent Route

- Role: JuanerAI Test Agent
- Risk: R2
- Difficulty: complex
- Model: `gpt-5.6-terra`
- Reasoning effort: high
- Routing rationale: the suite freezes cross-module public behavior, three replaceable Adapter contracts, durable run semantics, security negatives, cancellation/timeout, and 51 AC mappings.
- Upgrade trigger: one return of `ROUTING_ESCALATION_REQUIRED` with concrete missed interaction or reasoning evidence; missing authority or dependencies are blockers, not escalation triggers.
- Override duration: this single `TASK-001` dispatch through `TDD_READY`, `TEST_CONFLICT`, `BLOCKED`, or `ROUTING_ESCALATION_REQUIRED`.
- Rollback to role default: after this dispatch returns, restore Test role route to Terra/medium; no silent retry or mid-run switching.

## Evidence Required

- Positive: independent fixture/hash/oracle helper health; tests encode the approved success journey, exact values, lifecycle, Evidence/Markdown projections, activation, rollback, and offline reproduction behavior.
- Negative: forbidden tools, paths, data, egress, secrets, statuses, versions, fields, mutations, retries, causal/prescriptive claims, and out-of-scope surfaces are rejected or absent.
- Boundary/failure: inclusive dates, distinct orders, window-local membership, exact rational arithmetic, zero denominator, collisions, source mutation, timeouts, cancellation, crash/atomicity, terminal immutability, unsupported versions, and Adapter disagreement.
- Contract: unchanged suites are prepared for the Agent Analysis Runtime, Local Analysis Execution, and Run Artifact Port doubles and concrete Adapters; tests do not depend on private implementation structure.
- RED: exact commands, exit codes, failing test names, missing behavior/module diagnosis, and proof that production/OpenSpec paths remained unchanged.
- Coverage: a complete `REQ -> AC -> TEST file/test name` inventory with all 51 ACs represented; explicitly identify any real-Pi/dependency case that cannot execute in this no-install dispatch and the dependency-free deterministic constraint that remains executable.

## Handoff Back

Use `docs/templates/HANDOFF_BACK.template.md` in the final response. Report changed files, AC coverage, healthy baseline evidence, exact RED commands/results, write-risk, drift, risks, deferred dependency/real-model areas, and Controller decisions needed. Return `TDD_READY` only when the RED is valid; the Controller, not the Test role, records the gate.
