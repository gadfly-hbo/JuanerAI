# JuanerAI Engineering Constitution

## Product

JuanerAI is the commercial project family. Xanthil is its first product and is planned as CLI, desktop, and enterprise editions. Domain Packs, Model Packs, runtimes, data capabilities, and governance components are reusable JuanerAI modules rather than Xanthil-private infrastructure.

The product intent is to help data analysts and enterprise decision users move through Data -> Decision -> Action -> Outcome. It should produce actionable, traceable decisions rather than stop at BI reports or dashboards.

## Authority

Use this precedence when sources conflict:

1. Current explicit user approval.
2. This file and the project constitution.
3. Approved OpenSpec specification.
4. Approved design.
5. Tests derived from the approved specification.
6. Task plan.
7. Existing implementation.
8. Chat history.

Product terminology is owned by CONTEXT.md. Cross-domain orchestration is owned by Orchestration.md.

## Startup Stop Line

Before creating the first behavior-changing Xanthil Change, ask the user for the promised detailed Xanthil plan. Review that plan and resolve its product goal, MVP scope, non-goals, first acceptance scenario, data boundaries, and technical constraints before implementation.

Cold-start documents and empty module boundaries do not authorize product implementation, dependency installation, external data access, or schema creation.

## Architecture

- Keep Product Core and Application independent from infrastructure SDKs.
- Express external capabilities as business-oriented Ports.
- Put Pi, databases, files, Semantica, model providers, search, and network integrations in Adapters.
- Select Adapters only in a deployment Profile or composition root.
- Treat SQLite operational state and DuckDB analytical data as different responsibilities.
- Keep Ontology, Knowledge, and Memory as distinct domain capabilities even if one infrastructure product implements several of them.
- CLI, desktop, console, and future APIs call Application capabilities; they do not become the business core.
- Cross-language and cross-module communication uses versioned contracts.

Read docs/architecture/ before changing boundaries, persistence, package formats, runtime behavior, or deployment profiles.

## Change Workflow

Observable behavior changes follow:

Request -> Explore -> Proposal -> Specification -> Design -> Tasks -> Spec Gate -> Test Design -> RED -> Implementation -> GREEN -> Regression -> Independent Verification -> Acceptance -> Archive.

Each non-trivial change belongs to openspec/changes/<change-id>/ and declares allowed, conditional, and forbidden paths. Use greenfield_fast_path only when there is no compatibility, migration, replay, or irreversible-side-effect obligation; it still requires closed contracts, security boundaries, negative tests, activation, rollback, and real verification.

## Reuse and Complexity Control

Before sizing a post-bootstrap Change, or when the same behavior reaches a second Spec clarification, Test correction, or Worker revision or replan, read `docs/governance/change-complexity-control.md`. Xanthil Changes also read `docs/governance/xanthil-first-slice-reuse-baseline.md`. Crossing the stop line returns the Change to Controller root-cause review; it never waives gates or evidence.

## Testing

- Derive tests from Requirement and Acceptance Criteria IDs.
- Establish an expected RED caused by missing behavior before production implementation.
- Keep test-writing and implementation permissions logically separate.
- Preserve assertions and negative cases during implementation.
- Require contract tests for every replaceable Adapter.
- Use executable evidence before claiming completion.

Read .ai-coding/policies/testing.md and .ai-coding/definition-of-done.md for the applicable gate.

## Roles

- Controller owns product intent, architecture, terminology, shared contracts, task boundaries, integration, acceptance, and user communication.
- Worker implements only an approved brief and allowed paths.
- Validator uses an independent read-only context and returns evidence and a verdict; it does not implement or approve.
- Test author and implementation worker remain logically isolated.

### Standing Delegation Authority

The user grants standing authority to dispatch the configured project subagents when their lifecycle Gate is satisfied. Do not request per-dispatch confirmation for work already inside the approved Change, role boundary, model-routing policy, and path scope.

- After product intent and all required product or structure decisions are available, the Controller must dispatch `juaner_spec` to draft or revise the complete OpenSpec package before Spec Gate.
- After Spec Gate PASS, the Controller must dispatch `juaner_test` to derive executable tests and establish expected RED before production implementation.
- After TDD_READY, the Controller must dispatch `juaner_worker` to make the minimum production change inside the frozen allowed paths.
- After implementation and evidence are frozen, the Controller must dispatch `juaner_validator` in an independent read-only context before acceptance.
- Each role returns evidence to the Controller. Dispatch does not transfer product authority, approve a Gate, or unlock the next role early.
- The Controller must not replace a required role dispatch with direct execution. An explicit user waiver, an unavailable role, or a genuine authority/evidence blocker must be recorded with the affected Gate and release condition.

This section is persistent delegation authority across sessions. A new user command is required only to waive a role, change authority or scope, override routing, or proceed despite a blocker.

Use Orchestration.md and docs/templates/ for multi-domain or multi-agent work.

Read docs/governance/agent-model-routing.md before spawning a project subagent or changing its model, reasoning effort, sandbox, concurrency, or role boundary.

## Data and Safety

- Preserve source, lineage, time, transformation, model, decision, action, and outcome provenance.
- Memory is context, not an authoritative business fact.
- External data and third-party model calls require an approved data boundary.
- Secrets, raw sensitive data, and credentials stay out of prompts, logs, traces, fixtures, and artifacts unless an approved contract explicitly permits them.
- An action recommendation is not an executed action. Automated action requires a separate policy, authorization, idempotency, audit, and recovery contract.
- Pi is treated as a trusted-local runtime in the personal profile, not as an enterprise security boundary.

Read docs/architecture/data-authority.md and docs/architecture/security-boundaries.md before data, model, agent-tool, action, or enterprise work.

## Scope and Contracts

- Domain-private changes stay inside the approved domain.
- Shared types, package manifests, APIs, schemas, events, identities, persistence, and deployment contracts require Controller approval before implementation.
- Contract drift produces docs/templates/CONTRACT_CHANGE_REQUEST.template.md and blocks dependent work.
- Unknown business facts, fields, enum values, labels, IDs, thresholds, defaults, and model behavior remain pending rather than invented.

## Validation and Completion

Use `tools/harness/validation/run` as the canonical default offline validation command. It establishes the approved command-local toolchain, runs the accepted deterministic suites, and always removes the real-model test gate; it has no real-model mode. Any actual provider/model invocation requires separate explicit user authorization and a Change-specific command. Every Change must still name its applicable focused validation commands and evidence level before implementation.

No Change is complete without approved specification, expected RED, GREEN tests, required regression and quality checks, scope verification, traceability, independent verification or an explicit risk-based waiver, acceptance, and OpenSpec archive.

## Human Project Board

The human project board is a read-only observability surface. Formal user decisions remain in the Codex CLI conversation; the board may present decision briefs and local browser notes but never submits approvals, starts agents, executes commands, or grants authority.

The Controller owns `.juanerai/project-control/` and updates it at meaningful lifecycle transitions: Change start, phase transition, task completion, blocker discovery, user-decision request or resolution, RED/GREEN/verification changes, acceptance, and archive. Workers and validators return evidence to the Controller rather than writing project-control state unless their approved brief explicitly grants that path.

Use `node tools/harness/project-board/status-cli.mjs` for state changes. `status.json` is the sole current-state authority and is atomically replaced; `events/` is best-effort non-authoritative history, and `decision-briefs/` is display-only context. The Controller is the only supported writer; concurrent Controller writes are outside the board contract. A board display never overrides OpenSpec, tests, Task Bus state, repository evidence, or an explicit user decision in the CLI.
