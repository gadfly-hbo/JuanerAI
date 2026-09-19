# JuanerAI Engineering Constitution

## Product

JuanerAI is the commercial project family. Xanthil is its first product; existing functionality and reusable foundations remain preserved. The pending Xanthil Desktop and Model Pack development plans were withdrawn by the user on 2026-09-18 and remain void. `docs/planning/README.md` is the current product-planning entry; it points to the approved Blueprint v1.0 base and the current v1.1 correction package. The first-slice UI Contract must directly reuse the accepted PX-2026-004/006 Xanthil product UI mode and its visible capability inventory rather than invent a replacement UI. Domain Packs, Model Packs, runtimes, data capabilities, and governance components are reusable JuanerAI modules rather than Xanthil-private infrastructure.

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

The approved Blueprint v1.0 base and current v1.1 first-slice package are referenced from `docs/planning/README.md`. Review 002 applies only to the superseded v1.0 UI-adoption input. Before revising the retained clickable draft, the v1.1 package must pass a fresh Product Plan Development-Readiness Gate. Every product Change must then produce or revise a change-scoped high-fidelity clickable UI Contract and receive the user's UI Gate PASS before OpenSpec creation or `juaner_spec` dispatch. The UI Contract must make the workflow and visible acceptance surface directly evaluable by a non-technical user; backend, Runtime, Adapter, or infrastructure scope does not bypass this Gate. A review PASS authorizes only the next stated planning or UI-contract Gate; it does not authorize OpenSpec, dependency installation, production implementation, external data access, provider calls, or schema creation.

Cold-start documents and empty module boundaries do not authorize product implementation, dependency installation, external data access, or schema creation.

## Product Plan Development-Readiness Gate

Every new or materially revised product plan that is intended to guide development must pass an independent development-readiness review before it is declared ready, frozen as product input, or dispatched to `juaner_spec`.

After drafting the plan, the Controller dispatches a fresh read-only support Agent with an implementation-worker perspective. This Reviewer is not `juaner_worker`, receives no TDD_READY or implementation authority, and must not write OpenSpec, tests, or production code. Give it only the product plan and formal attachments, the JuanerAI authority documents explicitly referenced by the plan, and the review brief. Do not give it the Controller's unstated rationale or use external project repositories to rescue missing plan content; any required external lookup is itself a plan gap unless the user explicitly authorized that read-only study.

The Reviewer returns:

1. `What I Would Build`: the product behavior, boundary, and acceptance endpoint in its own words;
2. `Required Guessing`: business rules, states, defaults, Gates, errors, failure or cancellation behavior, data authority, Runtime, contracts, ownership, or acceptance details it would have to invent;
3. `External Study Required`: any repository, document, or historical context needed beyond the supplied package;
4. `Untestable Requirements`: behavior that cannot yet produce clear positive, negative, or real-scenario acceptance evidence;
5. `Correctly Deferred`: implementation details explicitly and safely left to OpenSpec, Design, or a later Change;
6. `Required Plan Additions`: the minimum text or attachment needed to remove each material gap;
7. `Verdict`: `PASS` or `NEEDS_CLARIFICATION`.

PASS requires an accurate restatement of the intended product and no load-bearing guess about behavior, boundaries, authority, or acceptance. Exact paths, TypeScript names, serialization schemas, and resource limits may remain deferred when the product semantics and stop line are complete. `NEEDS_CLARIFICATION` returns to the Controller; after a material correction, a fresh Reviewer repeats the Gate.

Reviewer PASS does not approve product intent, replace explicit user decisions, or transfer the Controller's product, architecture, contract, integration, or acceptance authority.

## Architecture

- Keep Product Core and Application independent from infrastructure SDKs.
- Express external capabilities as business-oriented Ports.
- Put Pi, databases, files, Semantica, model providers, search, and network integrations in Adapters.
- Confine Pi-specific types, events, errors, tool structures, and session structures to the Pi Adapter. Product Core, Application, Domain Packs, Model Packs, business Ports, Profiles, other Adapters, and public/versioned contracts expose only JuanerAI business or standard platform types.
- Select Adapters only in a deployment Profile or composition root.
- Treat SQLite operational state and DuckDB analytical data as different responsibilities.
- Keep Ontology, Knowledge, and Memory as distinct domain capabilities even if one infrastructure product implements several of them.
- Treat Data and Ontology as foundational authorities, Hypothesis and Strategy as governed long-term assets, Domain Pack and Model Pack as executable capability packages, and Knowledge and Memory as background capabilities rather than independent products. Read `docs/architecture/asset-and-model-capability-architecture.md` before changing these roles, asset promotion, or their authority relationships.
- CLI, desktop, console, and future APIs call Application capabilities; they do not become the business core.
- Cross-language and cross-module communication uses versioned contracts.
- Enterprise-ready means preserving the minimum Product Core, Application, Port, Adapter, Profile, versioned-contract, and provenance boundaries needed to keep future replacement possible. It does not authorize enterprise identity, tenancy, policy, isolation, storage, audit, deployment, migration, concurrency, or recovery behavior in a personal/local Change. Review both missing preparation and premature enterprise implementation.

Read docs/architecture/ before changing boundaries, persistence, package formats, runtime behavior, or deployment profiles.

Before proposing a new Agent Runtime, Model Pack runtime, Runtime Port, or Runtime-selecting Profile, read `docs/adr/0003-business-runtime-port-strategy.md`. A second Runtime remains a separate OpenSpec Change; this direction does not authorize a registry, fallback, hot switching, or universal Runtime interface.

## Change Workflow

Dual-device product Changes follow the long-term semi-automatic default,
delegated stage checks and authority boundaries in
`docs/governance/product-change-execution-policy.md`.

Observable behavior changes follow:

Request -> Explore -> Proposal -> UI Contract -> User UI Gate -> Specification -> Design -> Tasks -> Spec Gate -> Test Design -> RED -> Implementation -> GREEN -> Regression -> Independent Verification -> Acceptance -> Archive.

Each non-trivial change belongs to openspec/changes/<change-id>/ and declares allowed, conditional, and forbidden paths. Use greenfield_fast_path only when there is no compatibility, migration, replay, or irreversible-side-effect obligation; it still requires closed contracts, security boundaries, negative tests, activation, rollback, and real verification.

## Git and Multi-device Development

`origin/main` is the integration authority and local `main` is a read-only mirror. Before changing tracked files, work on `work/macbook/<slug>` or `work/mac-mini/<slug>`; use `tools/harness/git/start-work <slug>` when starting from `main`. One device owns a work branch at a time. Integrate through a GitHub pull request with squash merge, then fast-forward local `main`. Read `docs/governance/git-development-workflow.md` before starting, handing off, merging, or resolving cross-device conflicts.

## Reuse and Complexity Control

Before sizing a post-bootstrap Change, or when the same behavior reaches a second Spec clarification, Test correction, or Worker revision or replan, read `docs/governance/change-complexity-control.md`. Xanthil Changes also read `docs/governance/xanthil-first-slice-reuse-baseline.md`. Crossing the stop line returns the Change to Controller root-cause review; it never waives gates or evidence.

Before Spec Gate, the Controller must run `ponytail-review` on the complete OpenSpec diff when the Spec role used high/xhigh reasoning, a non-core or governance Change introduces durable machinery, enterprise readiness is used to justify present scope, or a correction expands the design. Findings return to Spec for deletion; material complexity beyond the approved goal requires explicit plain-language user approval before Test dispatch. Follow `docs/governance/change-complexity-control.md`.

## Testing

- Derive tests from Requirement and Acceptance Criteria IDs.
- Establish an expected RED caused by missing behavior before production implementation.
- Keep test-writing and implementation permissions logically separate.
- Preserve assertions and negative cases during implementation.
- Require contract tests for every replaceable Adapter.
- Use executable evidence before claiming completion.

Read .ai-coding/policies/testing.md and .ai-coding/definition-of-done.md for the applicable gate.

When a Change adds, changes, or removes tests, fixtures, helpers, doubles, mocks, snapshots, coverage maps, or harness code, read `docs/governance/test-asset-retirement.md` at Test Design and again after GREEN/regression. The Controller must pass its Test Asset Retirement Gate before freezing evidence for Validator dispatch.

## Roles

- Controller owns product intent, architecture, terminology, shared contracts, task boundaries, integration, acceptance, and user communication.
- In semi-automatic batches, the Mac mini coordinator exercises the delegated in-scope technical decision authority in `docs/governance/product-change-execution-policy.md#in-scope-technical-decision-authority`; MacBook retains decisions outside that boundary and final acceptance.
- Worker implements only an approved brief and allowed paths.
- Validator uses an independent read-only context and returns evidence and a verdict; it does not implement or approve.
- Test author and implementation worker remain logically isolated.

### Standing Delegation Authority

The user grants standing authority to dispatch the configured project subagents when their lifecycle Gate is satisfied. Agent invocation and formal lifecycle-role activation are distinct: the Controller may call any configured role for bounded support, while only a role activated with the approved production brief and lifecycle authority may write formal Change artifacts or advance a Gate.

The MacBook Controller prepares and reviews the complete package and may use configured roles for bounded support; those support calls do not constitute production execution, create lifecycle evidence, or grant Change-write authority. After the user authorizes package transfer, MacBook publishes the frozen package branch, creates a dedicated new Codex task on the saved Mac mini JuanerAI project, and supplies the package as its initial message. It never selects an existing task by recency or ambient UI state; automatic dispatch failure stops for the one-time manual create/open-and-forward fallback. The new Mac mini execution task activates the formal Spec, Test, Worker, and Validator stages. On the MacBook, user wording such as “启动” or “授权启动” a Change starts package preparation and handoff unless the user explicitly changes the dual-device execution policy.

- After product intent, all required product or structure decisions, and the exact user-approved UI Contract are available, the Mac mini execution coordinator must dispatch `juaner_spec` to draft or revise the complete OpenSpec package before Spec Gate.
- After Spec Gate PASS, the Controller must dispatch `juaner_test` to derive executable tests and establish expected RED before production implementation.
- After TDD_READY, the Controller must dispatch `juaner_worker` to make the minimum production change inside the frozen allowed paths.
- After implementation and evidence are frozen, the Controller must dispatch `juaner_validator` in an independent read-only context before acceptance.
- Each role returns evidence to the Controller. Dispatch does not transfer product authority, approve a Gate, or unlock the next role early.
- The Controller must not replace a required role dispatch with direct execution. An explicit user waiver, an unavailable role, or a genuine authority/evidence blocker must be recorded with the affected Gate and release condition.

This section is persistent delegation authority across sessions. A new user command is required only to waive a role, change authority or scope, change the designated execution device, override routing, or proceed despite a blocker. Product approval, UI acceptance, OpenSpec authorization, and lifecycle progression never implicitly change the designated execution device.

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

## Development Material Preservation

- Store source, permanent tests, product plans, OpenSpec, designs, formal decisions, and acceptance conclusions in their canonical repository locations on a normal work branch. They are preserved only after Git integration appropriate to their lifecycle; an uncommitted working-tree copy is not a preserved project asset.
- Store raw logs, complete command output, exit results, frozen inputs, and diagnostic source needed for acceptance, attribution, or resumption under one device-local persistent artifact root organized by Change or task ID. Continue an already approved evidence location instead of creating a second authority. Record the actual root and owning device in the handoff; keep shared rules device-independent.
- Use `/private/tmp` only for reproducible material that carries no acceptance, recovery, or historical-attribution duty. When a temporary probe becomes evidence, copy rather than move its source, inputs, and results to persistent storage after writes stop; record byte length and SHA-256, read the copy back independently, and retain historical failures. A digest without an accessible file is not a completed handoff.
- Use the existing project status, `NEXT_ACTION`, or handoff record for the unmet acceptance point, exact return point, and evidence locator. `docs/templates/HANDOFF_BACK.template.md` carries the required device, identity, and receiver-availability fields. Keep credentials and unapproved sensitive data out of evidence; same-device persistence is not a cross-device backup.

## Scope and Contracts

- Domain-private changes stay inside the approved domain.
- Shared types, package manifests, APIs, schemas, events, identities, persistence, and deployment contracts require approval before implementation. The delegated Mac mini coordinator may approve eligible technical deltas under the execution policy; this does not expand dependency or external-operation permissions.
- Contract drift stops dependent implementation and returns to Spec/Design. Eligible technical deltas are resolved locally under that policy; out-of-scope decisions use docs/templates/CONTRACT_CHANGE_REQUEST.template.md and return to MacBook.
- Unknown business facts, fields, enum values, labels, IDs, thresholds, defaults, and model behavior remain pending rather than invented.

## Validation and Completion

Use `tools/harness/validation/run` as the canonical default offline validation command. It establishes the approved command-local toolchain, runs the accepted deterministic suites, and always removes the real-model test gate; it has no real-model mode. Any actual provider/model invocation requires separate explicit user authorization and a Change-specific command. Every Change must still name its applicable focused validation commands and evidence level before implementation.

No Change is complete without approved specification, expected RED, GREEN tests, required regression and quality checks, scope verification, traceability, independent verification or an explicit risk-based waiver, acceptance, and OpenSpec archive.

## Human Project Board

The human project board is a read-only observability surface. Formal user decisions remain in the Codex CLI conversation; the board may present decision briefs and local browser notes but never submits approvals, starts agents, executes commands, or grants authority.

The Controller owns `.juanerai/project-control/` and updates it at meaningful lifecycle transitions: Change start, phase transition, task completion, blocker discovery, user-decision request or resolution, RED/GREEN/verification changes, acceptance, and archive. Workers and validators return evidence to the Controller rather than writing project-control state unless their approved brief explicitly grants that path.

For semi-automatic remote batches, follow the stage-recording and board-update timing in `docs/governance/product-change-execution-policy.md`; the board is the last confirmed handoff, not a live remote-state claim.

Use `node tools/harness/project-board/status-cli.mjs` for state changes. `status.json` is the sole current-state authority and is atomically replaced; `events/` is best-effort non-authoritative history, and `decision-briefs/` is display-only context. The Controller is the only supported writer; concurrent Controller writes are outside the board contract. A board display never overrides OpenSpec, tests, Task Bus state, repository evidence, or an explicit user decision in the CLI.
