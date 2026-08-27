# Agent and Model Routing

## Status

JuanerAI has four project-scoped custom Codex Agents under .codex/agents/. The primary Codex session is the Controller and is not wrapped in another custom Agent.

Model routing has two levels: the configured role default and the R2 route. R2 changes model reasoning only; it does not change role duties, lifecycle Gates, sandbox, write scope, execution order, or user authority.

## Route Matrix

| Role | Custom Agent | Default | R2 | Sandbox | Starts When |
|---|---|---|---|---|---|
| Controller | primary session | gpt-5.6-sol / high | gpt-5.6-sol / high | parent session policy | user intent or gate decision |
| Spec Agent | juaner_spec | gpt-5.6-sol / medium | gpt-5.6-sol / high | workspace-write | product intent exists; before Spec Gate |
| Test Agent | juaner_test | gpt-5.6-terra / medium | gpt-5.6-terra / high | workspace-write | Spec Gate PASS |
| Worker | juaner_worker | gpt-5.6-terra / medium | gpt-5.6-terra / high | workspace-write | TDD_READY |
| Validator | juaner_validator | gpt-5.6-sol / medium | gpt-5.6-sol / high | read-only | implementation and evidence frozen |

The Controller's current session never switches model automatically. A new Controller session uses the project default, gpt-5.6-sol / high. Automatic R2 routing applies only to Spec, Test, Worker, and Validator Agents dispatched later by the Controller.

## R2 Triggers

A Change automatically uses the R2 subagent route when it directly modifies any of these boundaries:

- backend databases, schemas, migrations, transactions, persistence, or data recovery;
- low-level Agents, Agent Runtimes, scheduling, routing, tool calls, settlement, state, or memory;
- security, permissions, authentication, secrets, or sensitive data;
- cross-module public contracts, file formats, events, API compatibility, or version migration;
- concurrency, locks, transactions, idempotency, cancellation, retries, or crash recovery;
- irreversible data operations or real external writes;
- core analysis algorithms, statistical computation, prediction, scoring, or Model Pack correctness;
- cross-module architecture changes among Core, Port, Adapter, Runtime, or Profile;
- complex root-cause problems for which existing evidence shows the default route is insufficient.

The default route continues to apply to:

- ordinary UI, CLI, or documentation changes;
- single-module business logic;
- calls through existing database, Agent, or model interfaces;
- small bug fixes that do not change underlying contracts;
- ordinary test additions or local refactoring.

Missing product decisions, scope authority, contracts, permissions, environment, or required evidence is `BLOCKED`. R2 never substitutes for missing authority or evidence and must not be used to continue guessing.

## Automatic Controller Algorithm

Before every subagent dispatch, the Controller:

1. Confirms the role's lifecycle start condition and required frozen inputs.
2. Checks the approved scope against the R2 triggers.
3. Selects the role default unless an R2 trigger applies.
4. Records the role, route, model, reasoning, trigger, evidence, duration, and rollback in the dispatch brief.
5. Uses a bounded task context for an R2 override; it does not copy unrestricted conversation history merely to preserve convenience.
6. Accepts the result or returns it to the owning earlier Gate.

Subagents do not switch models mid-run. If a dispatched route is inadequate, the role returns `ROUTING_ESCALATION_REQUIRED` with evidence and stops. Missing authority or evidence returns `BLOCKED` rather than a stronger route.

## Separation

The Test Agent is a generator of executable constraints. It writes tests before implementation and proves expected RED.

The Validator is an evaluator. It starts after implementation, remains read-only, rechecks the frozen result, and issues PASS, FAIL, or BLOCKED.

The Test Agent asks, "What executable test proves this approved behavior is missing?"

The Validator asks, "Does the delivered system, evidence, scope, and architecture actually satisfy the approved behavior?"

The same subagent thread may not act as both Test Agent and Validator for one Change.

## Concurrency

The project permits at most three concurrent subagent threads in addition to the primary Controller. The normal Change path is sequential:

Spec -> Test -> Worker -> Validator.

Parallel subagents are used only for independent read-heavy investigation or non-overlapping implementations with frozen contracts. Shared-worktree write-heavy work remains serial.

## Overrides

Role configuration is the default. The Controller may automatically select R2 from the approved matrix without asking the user for each dispatch. The user is asked only when product authority, risk acceptance, scope, contract, external effect, or another real Gate requires a decision.

Every R2 override records the reason, evidence, evaluation target, duration, trigger, and rollback. The project board shows the actual dispatched model and reasoning when a role is active, then returns to the configured default after the run. Sandbox, write scope, role separation, Gate order, and user authority remain authoritative at both routing levels.
