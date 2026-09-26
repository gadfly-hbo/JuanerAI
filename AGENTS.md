# JuanerAI Engineering Constitution

## Product

JuanerAI is the commercial project family. Xanthil is its first product; existing functionality and reusable foundations remain preserved. The pending Xanthil Desktop and Model Pack development plans were withdrawn by the user on 2026-09-18 and remain void. `docs/planning/README.md` is the current product-planning entry; it points to the approved [Product Development Blueprint v2.0](docs/planning/2026-09-26/juanerai-product-development-blueprint-v2.0.md), JuanerAI's highest product-development execution guideline. JuanerAI Whitepaper v4.0 is its core product reference and the commercialization charter; Whitepaper changes enter development only after the user explicitly notifies JuanerAI, approves a versioned Blueprint revision, that revision passes a fresh Product Plan Development-Readiness Gate, and the result is integrated here. Blueprint v1.0–v1.3 remain immutable history.

OSM owns goals, measures, gaps, strategies, actions and business review. PIM owns questions, requirement clarification, analysis framing, investigation, evidence judgment and insight follow-up. Xanthil Desktop is their unified workbench; both reuse one analysis and execution core. The Blueprint's six product lines plus two cross-cutting capabilities are a Change-coverage map, not eight products or serial build phases.

The first-slice UI Contract must directly reuse the accepted PX-2026-004/006 Xanthil product UI mode and its visible capability inventory rather than invent a replacement UI. Domain Packs, Model Packs, runtimes, data capabilities, and governance components are reusable JuanerAI modules rather than Xanthil-private infrastructure.

The product intent is to help data analysts and enterprise decision users move through Data -> Decision -> Action -> Outcome. It should produce actionable, traceable decisions rather than stop at BI reports or dashboards.

## Authority

Use this precedence when sources conflict:

1. Current explicit user approval.
2. This file, the project constitution, and the current approved Product Development Blueprint; the Blueprint owns product-development execution sequence and Change selection.
3. Approved OpenSpec specification.
4. Approved design.
5. Tests derived from the approved specification.
6. Task plan.
7. Existing implementation.
8. Chat history.

Product terminology is owned by CONTEXT.md. Product route and Change-selection rules are owned by the current Blueprint referenced from `docs/planning/README.md`. Cross-domain orchestration is owned by Orchestration.md.

## Product and Engineering Authority

Use the role names below; the unqualified word `Controller` does not name a
current authority in the semi-automatic dual-device path.

- The **MacBook Product Manager** owns Whitepaper and Research Demo
  interpretation, the Blueprint, product proposals and vertical slices, UI
  Contracts, user-visible behavior, business meaning, product acceptance
  criteria, product prohibitions, and product-planning records. It freezes
  product inputs but does not pre-freeze ordinary implementation contracts,
  paths, commands, environments, or validation mechanics.
- The **Mac mini Engineering Controller** receives approved product inputs and
  owns feasibility, result-sized engineering packages and contract decisions,
  continuous OpenSpec/SDD and TDD, regression, independent Validator,
  engineering acceptance and state, and authorized Git delivery/integration/archive.
- The **user** is the final decision authority. The Engineering Controller asks
  the user directly about product ambiguity, scope expansion, new architecture
  or safety boundaries, extra budget, residual-risk acceptance, missing
  permissions, and unsafe or unknown effects. MacBook participation is optional
  product support requested by the user, not a technical approval hop.

Product acceptance and engineering acceptance are separate. A Validator PASS
or Engineering Acceptance never substitutes for the user's required product/UI
acceptance. The full boundary and handoff rules live only in
`docs/governance/product-change-execution-policy.md`.

## Startup Stop Line

The approved Blueprint v2.0 and its retained first-slice attachments are referenced from `docs/planning/README.md`. It preserves the frozen first production Change; the later sequence is Decision Record and Expected Outcome → outcome follow-up → explicit adoption in the next Case, not authorized Changes. Close each slice's product decisions under §7 before Product Input Freeze. Every product Change must bind an applicable change-scoped high-fidelity clickable UI Contract and the user's UI Gate PASS before engineering execution. Reuse a still-valid approved Contract; obtain affected user approval for new or materially changed visible behavior. The Contract must make the workflow and acceptance surface directly evaluable by a non-technical user; a backend, Runtime, Adapter or infrastructure label does not bypass this obligation. A Blueprint or development-readiness PASS authorizes only its stated planning result, not OpenSpec, dependencies, implementation, external data, provider calls or schema creation.

Cold-start documents and empty module boundaries do not authorize product implementation, dependency installation, external data access, or schema creation.

## Product Plan Development-Readiness Gate

Every new or materially revised product plan intended to guide development must pass an independent development-readiness review before it is declared ready, frozen as product input, or handed to engineering. Reuse an applicable completed review; ordinary internal engineering changes do not repeat it.

After drafting the plan, the Product Manager dispatches a fresh read-only support Agent with an implementation-worker perspective. This Reviewer is not the engineering agent, receives no implementation authority, and must not write OpenSpec, tests, or production code. Give it only the product plan and formal attachments, the JuanerAI authority documents explicitly referenced by the plan, and the review brief. Do not give it the Product Manager's unstated rationale or use external project repositories to rescue missing plan content; any required external lookup is itself a plan gap unless the user explicitly authorized that read-only study.

The Reviewer returns:

1. `What I Would Build`: the product behavior, boundary, and acceptance endpoint in its own words;
2. `Required Guessing`: business rules, states, defaults, Gates, errors, failure or cancellation behavior, data authority, Runtime, contracts, ownership, or acceptance details it would have to invent;
3. `External Study Required`: any repository, document, or historical context needed beyond the supplied package;
4. `Untestable Requirements`: behavior that cannot yet produce clear positive, negative, or real-scenario acceptance evidence;
5. `Correctly Deferred`: implementation details explicitly and safely left to OpenSpec, Design, or a later Change;
6. `Required Plan Additions`: the minimum text or attachment needed to remove each material gap;
7. `Verdict`: `PASS` or `NEEDS_CLARIFICATION`.

PASS requires an accurate restatement of the intended product and no load-bearing guess about behavior, boundaries, authority, or acceptance. Exact paths, TypeScript names, serialization schemas, and resource limits may remain deferred when the product semantics and stop line are complete. `NEEDS_CLARIFICATION` returns to the Product Manager; after a material correction, a fresh Reviewer repeats the Gate.

Reviewer PASS does not approve product intent, replace explicit user decisions,
or transfer Product Manager, Engineering Controller, or user authority.

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

Before selecting a product Change, revising priorities, or reviewing scope and module responsibility, read Blueprint v2.0's four core views (sections 4, 5–6, 9 and 10), pending product decisions (section 7), and selection rule (section 8). In the existing proposal, connect the user outcome, six-plus-two coverage and deferred return points, affected modules, competitive-value hypothesis and required evidence. Preserve the full approved capability landscape while delivering its smallest unmet outcomes; these views add no separate Gate or execution authority.

Dual-device product Changes follow the continuous-engineering default,
adoption conditions and authority boundaries in
`docs/governance/product-change-execution-policy.md`.

Observable behavior changes follow the split state machine in
`.ai-coding/state-machine.md`: Product Manager work ends at Product Input
Freeze; Engineering Controller work begins at confirmed Engineering Intake and
continues through behavior-scoped SDD/TDD and independent verification, Engineering
Acceptance, required user Product Acceptance, and authorized archive.

Each non-trivial change belongs to openspec/changes/<change-id>/ and declares allowed, conditional, and forbidden paths. Use greenfield_fast_path only when there is no compatibility, migration, replay, or irreversible-side-effect obligation; it still requires closed contracts, security boundaries, negative tests, activation, rollback, and real verification.

## Git and Multi-device Development

`origin/main` is the integration authority and local `main` is a read-only mirror. Before changing tracked files, work on `work/macbook/<slug>` or `work/mac-mini/<slug>`; use `tools/harness/git/start-work <slug>` when starting from `main`. One device owns a work branch at a time. Integrate through a GitHub pull request with squash merge, then fast-forward local `main`. Read `docs/governance/git-development-workflow.md` before starting, handing off, merging, or resolving cross-device conflicts.

## Reuse and Complexity Control

Before sizing a Change or diagnosing repeated non-convergent work, read `docs/governance/change-complexity-control.md`; Xanthil Changes also read `docs/governance/xanthil-first-slice-reuse-baseline.md`. Check actual complexity and risk within existing engineering/review work, not a reasoning-level-triggered approval stage. Material scope or safety expansion requires the user's decision; ordinary corrections follow the sole execution policy's progress-based stop-loss.

## Testing

- Derive tests from Requirement and Acceptance Criteria IDs.
- Establish an expected RED caused by missing behavior before production implementation.
- One engineering agent may maintain authorized tests, code and necessary engineering design; final evaluation remains independent from all candidate authors.
- Preserve assertions and negative cases during implementation.
- Require contract tests for every replaceable Adapter.
- Use executable evidence before claiming completion.

Read .ai-coding/policies/testing.md and .ai-coding/definition-of-done.md for the applicable gate.

When changing test assets, read `docs/governance/test-asset-retirement.md`. Preserve coverage and explain removals in existing verification; Validator checks this in the same review, without a separate retirement Gate or compulsory ledger.

## Roles

- Product Manager owns the frozen product input and product-planning communication.
- Engineering Controller owns engineering architecture and contracts within the
  approved product, architecture, security, data, permission, and external-effect
  boundaries, plus engineering Gates, integration, and engineering communication.
- Engineering agent (`juaner_worker`) owns necessary engineering spec/design, tests, implementation and corrections in the approved work package.
- Validator uses an independent read-only context and returns evidence and a verdict; it does not implement or approve.
- Candidate authors and final Validator remain separate; optional Spec/Test specialists are bounded support, not default stages.

### Standing Delegation Authority

After policy adoption, approved product/UI input and confirmed intake, the Engineering Controller dispatches `juaner_worker` for the result-sized package and reuses its context through ordinary corrections. After freezing the complete candidate and evidence, it dispatches `juaner_validator` in an independent read-only context. No per-dispatch user confirmation is needed inside the approved scope, resource and permission boundaries.

Use `juaner_spec` or `juaner_test` only for a concrete scoped support question; neither creates a Spec Gate, TDD_READY approval or automatic next dispatch. A contributing specialist cannot be the final Validator. A missing role or incompatible loaded configuration must be disclosed and resolved at a safe boundary, not bypassed by author self-review or a silently different role. Product permission, Git authority and old task stops are not granted by dispatch or by editing these instructions.

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
- Use the existing engineering status, `NEXT_ACTION`, or handoff record for the unmet acceptance point, exact return point, and evidence locator. `docs/templates/HANDOFF_BACK.template.md` carries the required device, identity, and receiver-availability fields. Keep credentials and unapproved sensitive data out of evidence; same-device persistence is not a cross-device backup.

## Scope and Contracts

- Domain-private changes stay inside the approved domain.
- Material public/compatibility, persistent-data, authority or irreversible-effect contract changes require an Engineering Controller impact decision before dependent implementation; upper-boundary changes require the user. Ordinary private details close within the engineering package through affected spec/test updates and verification.
- Use docs/templates/CONTRACT_CHANGE_REQUEST.template.md for a material contract decision, not every private parameter or fixture correction.
- Unknown business facts, fields, enum values, labels, IDs, thresholds, defaults, and model behavior remain pending rather than invented.

## Validation and Completion

Use `tools/harness/validation/run` as the canonical default offline validation command. It establishes the approved command-local toolchain, runs the accepted deterministic suites, and always removes the real-model test gate; it has no real-model mode. Any actual provider/model invocation requires separate explicit user authorization and a Change-specific command. Every Change must still name its applicable focused validation commands and evidence level before implementation.

No behavior-changing Change is engineering-complete without approved behavior and its current specification, causal RED,
GREEN tests, required regression and quality checks, scope verification,
traceability, independent verification or an explicit user-authorized risk
waiver, Engineering Acceptance, and the applicable OpenSpec archive. Product
completion additionally requires the user's product acceptance when the frozen
product input names that Gate.

## Human Project Board

The human project board is a read-only observability surface. Formal user decisions remain in the Codex CLI conversation; the board may present decision briefs and local browser notes but never submits approvals, starts agents, executes commands, or grants authority.

The Engineering Controller owns `.juanerai/project-control/` for the current
engineering Change and is its sole writer. It updates the board at meaningful
lifecycle transitions: Change start, phase transition, task completion,
blocker discovery, user-decision request or resolution, RED/GREEN/verification
changes, engineering acceptance, applicable product acceptance, and archive.
The Product Manager maintains product planning and is not a required writer for
remote engineering progress. Workers and validators return evidence to the
Engineering Controller rather than writing project-control state. Ordinary inner-loop test runs do not each require a board update.

Follow the stage-recording and board-update timing in `docs/governance/product-change-execution-policy.md`. Mini maintains the confirmed engineering snapshot at each material transition. A MacBook copy is only its last synchronized view, not a live remote-state claim or a second writable board.

Use `node tools/harness/project-board/status-cli.mjs` for state changes. `status.json` is the sole current-state authority and is atomically replaced; `events/` is best-effort non-authoritative history, and `decision-briefs/` is display-only context. The Engineering Controller is the only supported writer for the current Change; concurrent writers are outside the board contract. A board display never overrides OpenSpec, tests, Task Bus state, repository evidence, or an explicit user decision in the CLI.
