# JuanerAI Orchestration

JuanerAI uses CDI, Controller-Domain Isolation, the 总控域隔离工程法. OpenSpec owns approved behavior; CDI owns authority, domain boundaries, handoff, and integration.

## Product Manager, Engineering Controller, and User

The MacBook Codex session is the Product Manager. It owns product clarification,
CONTEXT.md, product planning, vertical scope, UI Contracts, business semantics,
product acceptance criteria, and product-input freeze.

The Mac mini Codex session is the Engineering Controller. After receiving the
approved product input, it owns feasibility, engineering architecture and
contracts within approved boundaries, OpenSpec Gates, task slicing, assignment,
engineering state, integration review, engineering acceptance, and authorized
Git delivery/archive.

The user is the final decision authority and directly controls the Engineering
Controller. Product ambiguity, scope or boundary expansion, extra budget,
residual risk, missing permission, and unknown or unsafe effects go directly to
the user in the current Mini task. Product Manager participation is optional
support requested by the user, not an engineering Gate.

## Domains

| Domain | Owns | Does Not Own |
|---|---|---|
| product-governance | product docs, terminology, UI Contract, product decisions | engineering implementation or ordinary technical contracts |
| experience | Xanthil Desktop, compatibility-preserved CLI, operator Console, and later user surfaces | Product Core or infrastructure SDK behavior |
| core | packages/product-core, application, ports, contracts | concrete infrastructure |
| capability-packs | Domain Pack and Model Pack SDKs and package-private logic | product-wide contracts |
| runtime-data | adapters and deployment profiles | product intent or business rules |
| quality | tests and deterministic Harness checks | production implementation or final approval |

Domains are boundaries, not permanent assignees or repositories. A Product Module may later move to a separate repository only through an approved architecture Change.

## Role Isolation

- Spec role may write approved OpenSpec and design artifacts, not production implementation.
- Test role may write tests derived from approved Acceptance Criteria, not production implementation or approved specs.
- Worker may write only production paths named in an approved brief, not tests or specs unless explicitly granted for a low-risk exception.
- Validator is independent and read-only, runs approved checks, and returns evidence plus PASS, FAIL, or BLOCKED.
- Engineering Controller accepts compatible in-boundary engineering contract
  changes and engineering handoffs. A boundary-changing contract requires a
  user decision. Neither action grants product acceptance.

The configured project agents are juaner_spec, juaner_test, juaner_worker, and juaner_validator. Their models, reasoning effort, sandbox, activation states, and override rules are owned by docs/governance/agent-model-routing.md and .codex/agents/.

## Dispatch Rule

Dual-device product Changes follow the current execution mode and authority
boundary in `docs/governance/product-change-execution-policy.md`. Engineering
Controller-organized semi-automatic role progression is distinct from signed Host Loop
execution; changing mode does not waive the role or product Gates below.

Decompose by vertical user value first, then give each role or domain a bounded slice. Every dispatch includes:

- Change and Requirement IDs.
- Goal and non-goals.
- Allowed, conditional, and forbidden paths.
- Frozen inputs and expected outputs.
- Contract and terminology references.
- Dependencies and stop lines.
- Required positive and negative evidence.
- Write-risk and validation budget.
- Handoff format.

Use docs/templates/DOMAIN_HANDOFF.template.md. A Worker returns docs/templates/HANDOFF_BACK.template.md.

## Task Sources

OpenSpec tasks.md is the implementation plan for one Change. AgentOps Task Bus, when explicitly activated, is the execution handoff ledger.

Task Bus work must reference an approved Change and may not redefine Requirements. The Task Bus is currently inactive: no task is created until the repository lifecycle, routing, ignore policy, and first approved Change are ready.

## Cross-Domain Changes

Shared engineering contracts are owned by the Engineering Controller inside approved
product, architecture, security, data, permission, and external-effect
boundaries. A domain that discovers contract drift stops the dependent branch
and submits docs/templates/CONTRACT_CHANGE_REQUEST.template.md. The Engineering
Controller closes an in-boundary correction through Spec/Design and affected
Gates; a boundary change goes directly to the user.

Parallel work requires frozen contracts and non-overlapping write paths. Same-worktree implementation is serial by default. Independent validation uses a fresh role context and a frozen implementation reference.
Independence is established by role, context, permissions, and fixed inputs; it
does not require a different physical device.

## Acceptance

The Engineering Controller reviews scope, terminology, contracts, data safety,
expected RED, GREEN evidence, regression, traceability, risks, and independent
verification before Engineering Acceptance. Tests and Validator PASS are
evidence, not approval. The user's Product Acceptance is a separate verdict and
is never inferred from Engineering Acceptance.
