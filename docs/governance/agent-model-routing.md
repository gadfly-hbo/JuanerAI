# Agent and Model Routing

## Status

JuanerAI has four project-scoped custom Codex Agents under .codex/agents/. The
MacBook Product Manager and Mac mini Engineering Controller are primary Codex
sessions and are not wrapped in custom Agents. Only the Engineering Controller
dispatches the four engineering roles after confirmed product intake.

Model routing has two levels: the configured role default and the R2 route. R2 changes model reasoning only; it does not change role duties, lifecycle Gates, sandbox, write scope, execution order, or user authority.

The user-approved 2026-09-19 high/xhigh routing from the retained WIP rules
remains effective for future dispatches. Historical role records retain their
actual settings; this responsibility change dispatches no product role.

## Route Matrix

| Role | Custom Agent | Default | R2 | Sandbox | Starts When |
|---|---|---|---|---|---|
| Product Manager | MacBook primary session | project default | project default | parent session policy | product discussion, planning, UI Gate, or product-input freeze |
| Engineering Controller | Mac mini primary session | project default | project default | parent session policy | confirmed engineering intake or engineering/user decision |
| Spec Agent | juaner_spec | gpt-5.6-sol / high | gpt-5.6-sol / xhigh | workspace-write | frozen UI Contract, user UI Gate PASS, and confirmed engineering intake; before Spec Gate |
| Test Agent | juaner_test | gpt-5.6-terra / high | gpt-5.6-terra / xhigh | workspace-write | Spec Gate PASS |
| Worker | juaner_worker | gpt-5.6-terra / high | gpt-5.6-terra / xhigh | workspace-write | TDD_READY |
| Validator | juaner_validator | gpt-5.6-sol / high | gpt-5.6-sol / xhigh | read-only | implementation and evidence frozen |

The primary sessions never switch model automatically. Automatic R2 routing
applies only to Spec, Test, Worker, and Validator Agents dispatched later by
the Engineering Controller.

## Configuration and Effective Dispatch

The four role TOMLs retain model, sandbox, and instructions but omit
`model_reasoning_effort`. The ordinary project default remains
`agents.default_subagent_reasoning_effort = "high"` in `.codex/config.toml`.
The Engineering Controller explicitly selects `reasoning_effort: "high"` or,
for R2, `reasoning_effort: "xhigh"`, keeping the configured role model. Do not
pin effort in a role file and assume a dispatch parameter overrides it.

Before dispatch, confirm the receiving session exposes the named role and
permits the selected effort. A committed configuration does not prove an open
session reloaded it. If it still exposes a fixed old effort or lacks `xhigh`,
stop for bounded configuration reload/resumption; do not silently downgrade,
substitute a generic role, or probe by launching work before its Gate. Record
actual settings in the existing role evidence, not a new routing state system.

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

## Automatic Engineering Controller Algorithm

Before every subagent dispatch, the Engineering Controller:

1. Confirms the role's lifecycle start condition and required frozen inputs.
2. Checks the approved scope against the R2 triggers.
3. Selects explicit `high`, or `xhigh` for R2, and confirms the named role permits it in the current session.
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

The project permits at most three concurrent engineering subagent threads in addition to the primary Engineering Controller. The normal Change path is sequential:

Spec -> Test -> Worker -> Validator.

Parallel subagents are used only for independent read-heavy investigation or non-overlapping implementations with frozen contracts. Shared-worktree write-heavy work remains serial.

## Overrides

Project configuration supplies ordinary reasoning; role files fix model,
sandbox, and instructions. The Engineering Controller may
automatically select R2 from the approved matrix without asking the user for
each dispatch. It asks the user for product ambiguity, scope/boundary expansion,
risk acceptance, extra budget, missing permission, or unknown external effect;
ordinary in-boundary engineering contracts do not require a user or MacBook
approval hop.

Every R2 override records the reason, evidence, evaluation target, duration, trigger, and rollback. The project board shows the actual dispatched model and reasoning when a role is active, then returns to the configured default after the run. Sandbox, write scope, role separation, Gate order, and user authority remain authoritative at both routing levels.

For semi-automatic remote batches, the Engineering Controller records this
routing metadata locally and follows `product-change-execution-policy.md` for
stage checks and project-board updates.
