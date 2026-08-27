# JuanerAI Orchestration

JuanerAI uses CDI, Controller-Domain Isolation, the 总控域隔离工程法. OpenSpec owns intent and behavior; CDI owns authority, domain boundaries, handoff, and integration.

## Controller

Codex is the Controller. The Controller owns product clarification, CONTEXT.md, architecture, cross-domain contracts, OpenSpec gates, task slicing, assignment, integration review, acceptance, archive, and user communication.

Controller work with sufficient authority and evidence is completed directly. A self-assigned Task is not used to replace Controller judgment or independent validation.

## Domains

| Domain | Owns | Does Not Own |
|---|---|---|
| product-governance | product docs, terminology, OpenSpec, architecture, shared decisions | product implementation |
| experience | apps/cli, apps/console, future user surfaces | Product Core or infrastructure SDK behavior |
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
- Controller is the only role that accepts contract changes and the final handoff.

The configured project agents are juaner_spec, juaner_test, juaner_worker, and juaner_validator. Their models, reasoning effort, sandbox, activation states, and override rules are owned by docs/governance/agent-model-routing.md and .codex/agents/.

## Dispatch Rule

Activated dual-device product Changes use the signed authority package and
execution boundary in `docs/governance/product-change-execution-policy.md`.

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

Shared contracts are Controller-owned. A domain that discovers contract drift stops the dependent branch and submits docs/templates/CONTRACT_CHANGE_REQUEST.template.md.

Parallel work requires frozen contracts and non-overlapping write paths. Same-worktree implementation is serial by default. Independent validation uses a fresh role context and a frozen implementation reference.

## Acceptance

The Controller reviews scope, terminology, contracts, data safety, expected RED, GREEN evidence, regression, traceability, risks, and independent verification. Tests are evidence, not approval.
