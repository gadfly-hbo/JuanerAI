# Agent and Model Routing

## Status

JuanerAI has four project-scoped custom Codex Agents under .codex/agents/. The primary Codex session is the Controller and is not wrapped in another custom Agent.

Model routing has two levels: the configured role default and the R2 route. R2 changes model reasoning only; it does not change role duties, lifecycle Gates, sandbox, write scope, execution order, or user authority.

On 2026-09-19 the user approved ordinary tasks at `high` and R2 tasks at
`xhigh` (极高), replacing the former medium/high policy for future dispatches.
Historical dispatch and validation records retain their actual settings.

## Route Matrix

| Role | Custom Agent | Default | R2 | Sandbox | Starts When |
|---|---|---|---|---|---|
| Controller | primary session | gpt-5.6-sol / high | gpt-5.6-sol / high | parent session policy | user intent or gate decision |
| Spec Agent | juaner_spec | gpt-5.6-sol / high | gpt-5.6-sol / xhigh | workspace-write | product intent exists; before Spec Gate |
| Test Agent | juaner_test | gpt-5.6-terra / high | gpt-5.6-terra / xhigh | workspace-write | Spec Gate PASS |
| Worker | juaner_worker | gpt-5.6-terra / high | gpt-5.6-terra / xhigh | workspace-write | TDD_READY |
| Validator | juaner_validator | gpt-5.6-sol / high | gpt-5.6-sol / xhigh | read-only | implementation and evidence frozen |

The Controller's current session never switches model automatically. A new Controller session uses the project default, gpt-5.6-sol / high. Automatic R2 routing applies only to Spec, Test, Worker, and Validator Agents dispatched later by the Controller.

## Configuration and Effective Dispatch

The four role TOMLs retain their model, sandbox and instructions but omit
`model_reasoning_effort`. The ordinary default is
`agents.default_subagent_reasoning_effort = "high"` in `.codex/config.toml`.
The Controller explicitly selects `reasoning_effort: "high"` for ordinary
tasks or `reasoning_effort: "xhigh"` for R2 tasks. It keeps the configured role
model rather than supplying a model override.

This uses [Codex's documented precedence](https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents):
a value fixed in a custom role file takes precedence over a spawn value;
omitting the effort from that file preserves the effort resolved from the
explicit spawn request, then the `[agents]` default, then the parent.
Do not pin effort in a role file and assume a dispatch parameter can override it.

Before dispatch, confirm the receiving session exposes the named role and
permits the selected effort. A committed configuration is not evidence that
an already-open session has reloaded it. If the session still exposes a fixed
old effort or lacks `xhigh`, stop for a bounded configuration reload/resumption;
do not silently downgrade, substitute a generic role, or probe by launching
production work before its Gate. Record actual dispatched settings in the
existing role evidence, not a new routing state system.

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
3. Selects explicit `high` unless an R2 trigger applies, then explicit `xhigh`, and confirms the named role permits that setting in the current session.
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

The project configuration supplies the ordinary reasoning default; role files fix only their model, sandbox and instructions. The Controller may automatically select R2 from the approved matrix without asking the user for each dispatch. The user is asked only when product authority, risk acceptance, scope, contract, external effect, or another real Gate requires a decision.

Every R2 override records the reason, evidence, evaluation target, duration, trigger, and rollback. The project board shows the actual dispatched model and reasoning when a role is active, then returns to the configured default after the run. Sandbox, write scope, role separation, Gate order, and user authority remain authoritative at both routing levels.

For semi-automatic remote batches, the execution coordinator records this routing
metadata locally and follows `product-change-execution-policy.md` for delegated
stage checks and the project board's confirmed-handoff update timing.
