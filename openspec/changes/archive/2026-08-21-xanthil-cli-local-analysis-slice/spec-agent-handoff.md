# Domain Handoff: Xanthil CLI Local Analysis Specification

## Change and Goal

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Current state: Proposal accepted as the working basis; `XCLI-STRUCTURE-001` approved all 13 A decisions
- Requirements: to be assigned by the Spec role using `REQ-XCLI-NNN` and `AC-XCLI-NNN-NN`
- One concrete outcome: return one complete, internally consistent OpenSpec decision package that is ready for Controller Spec Gate review

## Non-Goals

- Do not write production code, tests, fixtures, package manifests, lockfiles, or schemas outside the Change documentation package.
- Do not call Pi, a model provider, network services, or external data.
- Do not redefine the approved product slice or reopen confirmed structural decisions without reporting a concrete contradiction.
- Do not activate Test, Worker, Validator, or Task Bus work.

## Boundary

- Domain: product-governance / specification
- Owned write paths:
  - `openspec/changes/xanthil-cli-local-analysis-slice/specs/**`
  - `openspec/changes/xanthil-cli-local-analysis-slice/design.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/tasks.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/test-plan.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/traceability.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/verification.md`
- Conditional paths: `openspec/changes/xanthil-cli-local-analysis-slice/proposal.md` only to repair an evidenced inconsistency, reported explicitly to the Controller
- Read-only frozen inputs:
  - `openspec/changes/xanthil-cli-local-analysis-slice/exploration.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/structure-confirmation.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/spec-agent-handoff.md`
- Forbidden paths: every production, test, project-control, shared architecture, product glossary, global Pi, other Change, Desktop, Console, enterprise, and external-repository path

## Inputs and Outputs

| Direction | Contract | Authority |
|---|---|---|
| input | approved `XCLI-INTAKE-001` product slice | user decision recorded in Proposal and project control |
| input | approved `XCLI-STRUCTURE-001` durable layout and lifecycle | structure decision ledger |
| input | Pi 0.84.2 SDK/CLI capability evidence | exploration.md; feasibility evidence, not product dependency approval |
| output | atomic Requirements and observable Acceptance Criteria | Spec role proposal; Controller approves at Spec Gate |
| output | architecture, closed contract design, failure/security/lifecycle semantics | Spec role proposal; Controller-owned contracts |
| output | requirement-mapped Tasks, test intent, traceability skeleton, verification plan | Spec role proposal; no executable tests yet |

## Constraints

- Shared terms: `CONTEXT.md`; use `Decision`, `Action Recommendation`, `Action`, and `Outcome` only with their defined meanings. The slice produces analytical Findings, not those downstream concepts.
- Architecture: Experience -> Application -> Product Core; Application -> Ports <- Adapters; personal Profile selects Adapters.
- Security and data boundary: only repository-owned non-sensitive synthetic CSV; selected model may receive this fixture for this Change; no real data, credentials, unrelated workspace data, Web Research, or arbitrary network tools.
- Frozen structure: UUIDv7 run identity; one confirmed Analysis Contract per execution attempt; `run.json`, `analysis-contract.json`, `evidence.json`, `summary.md`, `evidence.md`, numbered assets; Application single writer; terminal immutability; closed v1 contracts; no migration/backfill.
- Failure: fail closed; no success claim for failed/cancelled/incomplete runs; new run for retry.
- Dependency: SDK embedding is preferred, RPC is rollback; neither dependency installation nor package-manager choice is authorized yet. Design must recommend a closed choice or return the exact decision blocker.
- Stop line: no Test Design execution, RED, implementation, model call, dependency installation, or persistent runtime schema before Controller Spec Gate PASS.
- Write risk: documentation-only within owned Change paths.
- Validation budget: Markdown/static consistency checks only; do not invent project build commands.

## Agent Route

- Role: Spec
- Risk: R2 — cross-module Ports, data egress, persistent closed contracts, cancellation and rollback
- Difficulty: complex
- Model: `gpt-5.6-sol`
- Reasoning effort: high
- Routing rationale: approved R2 Spec route from `docs/governance/agent-model-routing.md`
- Upgrade trigger: one upgrade to Sol/xhigh only for demonstrated missed contract interactions or unresolved internal inconsistency; missing authority or evidence returns BLOCKED
- Override duration: this bounded Spec package dispatch only
- Rollback to role default: `juaner_spec` Terra/medium after this dispatch

## Required Package

1. `specs/<capability>/spec.md` with atomic `REQ-XCLI-NNN` and `AC-XCLI-NNN-NN` identifiers.
2. `design.md` covering dependency direction, Pi Adapter surface, tool policy, data flow, approved durable structures, error/cancellation mapping, activation, rollback, and retirement.
3. `tasks.md` mapping every Task to Requirements, tests-to-be-authored, and frozen path permissions.
4. `test-plan.md` deriving positive, negative, boundary, failure, contract, integration, and E2E intent from AC IDs without writing executable tests.
5. `traceability.md` with complete REQ -> AC -> planned TEST -> TASK mapping and code/result placeholders.
6. `verification.md` naming executable evidence levels and leaving pre-implementation results honestly pending.

## Evidence Required

- Positive: every material approved behavior appears in at least one atomic Requirement and Acceptance Criterion.
- Negative: forbidden tool, path, data, egress, success-claim, overwrite, version, and lifecycle behavior is explicit and testable.
- Contract: replaceable Pi, analytical execution, and Artifact boundaries have contract-suite intent without leaking SDK/filesystem/process types into Product Core or Application.
- Regression: named intent only; actual commands remain pending until the stack and manifests are approved.
- Completeness: no unknown field, enum, metric formula, reference result, dependency version, or runtime behavior is silently invented. Return one complete blocker package if an item cannot be safely frozen from approved evidence.

## Handoff Back

Return `SPEC_READY`, `BLOCKED`, or `ROUTING_ESCALATION_REQUIRED` with changed files, decision summary, open risks, validation performed, and exact Controller actions needed. Other agents share this workspace; preserve their changes and do not revert or overwrite unrelated work.
