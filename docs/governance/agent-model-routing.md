# Agent and Model Routing

## Status

JuanerAI has four project-scoped custom Codex Agents under .codex/agents/. The primary Codex session is the Controller and is not wrapped in another custom Agent.

## Routing

| Role | Custom Agent | Model | Reasoning | Sandbox | Starts When |
|---|---|---|---|---|---|
| Controller | primary session | gpt-5.6-sol | xhigh | parent session policy | user intent or gate decision |
| Spec Agent | juaner_spec | gpt-5.6-terra | medium | workspace-write | product intent exists; before Spec Gate |
| Test Agent | juaner_test | gpt-5.6-terra | medium | workspace-write | Spec Gate PASS |
| Worker | juaner_worker | gpt-5.6-terra | medium | workspace-write | TDD_READY |
| Validator | juaner_validator | gpt-5.6-sol | medium | read-only | implementation and evidence frozen |

## Selection Rationale

Medium reasoning is the normal starting point. Spec, Test, and Worker use Terra for standard bounded work. Validator keeps Sol because it independently evaluates correctness, but its default effort is also medium.

Sol, high, and xhigh are escalation resources rather than role identities. Luna is limited to non-authoritative R0 support work such as fixed-format transformation, mechanical inventory, or high-volume classification. It does not independently freeze a specification, author the load-bearing RED suite, implement an unfrozen change, or issue a final verdict.

Max reasoning is not part of normal automatic routing. It requires explicit Controller justification and representative evidence that xhigh is insufficient.

## Risk and Difficulty Classification

Risk sets the minimum route. Difficulty may raise the route but never lower the risk floor.

| Risk | Meaning | Normal Route |
|---|---|---|
| R0 | reversible, mechanical, non-authoritative support with no contract or runtime effect | Luna medium support run, or Controller handles directly |
| R1 | bounded work against approved inputs with no shared contract, sensitive-data, external-write, or irreversible effect | role default |
| R2 | cross-module behavior, persistence, shared contract, concurrency, recovery, permission, or complex root-cause work | Terra high or Sol high according to role |
| R3 | sensitive-data boundary, irreversible external effect, security policy, release/rollback authority, major risk waiver, or disputed final correctness | Sol xhigh |

Difficulty is `standard`, `complex`, or `blocked`:

- `standard`: frozen inputs, local scope, known validation, and one clear owner.
- `complex`: multiple modules, conflicting evidence, unclear root cause, difficult concurrency or recovery, or a prior reasoning-insufficiency failure.
- `blocked`: missing user decision, authority, source evidence, approved specification, contract resolution, or required environment. Blocked work stops; it is never upgraded merely to guess harder.

## Role Route Matrix

| Role | R1 Default | R2 Route | R3 Route |
|---|---|---|---|
| Spec | Terra medium | Sol high | Sol xhigh |
| Test | Terra medium | Terra high | Sol high or xhigh when the R3 boundary is directly tested |
| Worker | Terra medium | Terra high | Sol high; xhigh only when explicitly justified |
| Validator | Sol medium | Sol high | Sol xhigh |

## Automatic Controller Algorithm

Before every dispatch, the Controller:

1. Confirms the role's lifecycle start condition and required frozen inputs.
2. Classifies risk from observable scope and side effects.
3. Classifies difficulty without treating missing authority or evidence as difficulty.
4. Selects the role default, then raises it to the risk floor or one difficulty level when required.
5. Records role, risk, difficulty, model, reasoning, rationale, upgrade trigger, duration, and rollback in the dispatch brief.
6. Uses a bounded task context when a model or reasoning override is required; it does not copy unrestricted conversation history merely to preserve convenience.
7. Accepts the result, returns it to the owning earlier gate, or performs at most one automatic reasoning/model upgrade.

An automatic retry is allowed only when evidence shows insufficient reasoning, missed interactions, or underestimated complexity. A second failure returns to the Controller. Repair loops, repeated silent escalation, and mid-run model switching are forbidden.

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

Role configuration is the R1 default. The Controller may automatically select a route from the approved matrix without asking the user for each dispatch. The user is asked only when product authority, risk acceptance, scope, contract, external effect, or another real gate requires a decision.

Every override records the reason, evidence, evaluation target, duration, upgrade trigger, and rollback. The project board shows the actual dispatched model and reasoning when a role is active, then returns to the configured default after the run. Sandbox, write scope, role separation, gate order, and user authority remain authoritative at every model tier.
