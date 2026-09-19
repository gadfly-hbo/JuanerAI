# JuanerAI Orchestration

JuanerAI uses CDI, Controller-Domain Isolation, the 总控域隔离工程法. OpenSpec owns intent and behavior; CDI owns authority, domain boundaries, handoff, and integration.

## Controller

Codex is the Controller. The Controller owns product clarification, CONTEXT.md, change-scoped clickable UI Contracts, user UI Gates, architecture, cross-domain contracts, OpenSpec gates, task slicing, assignment, integration review, acceptance, archive, and user communication.

Controller work with sufficient authority and evidence is completed directly. A self-assigned Task is not used to replace Controller judgment or independent validation.

## Domains

| Domain | Owns | Does Not Own |
|---|---|---|
| product-governance | product docs, terminology, OpenSpec, architecture, shared decisions | product implementation |
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
- The Mac mini coordinator may accept in-scope technical contract deltas under the execution policy; formal roles propose, test, implement or verify them within their separate permissions. MacBook Controller accepts the final handoff.

The configured project agents are juaner_spec, juaner_test, juaner_worker, and juaner_validator. Their models, reasoning effort, sandbox, activation states, and override rules are owned by docs/governance/agent-model-routing.md and .codex/agents/.

## Dispatch Rule

Dual-device product Changes follow the current execution mode and authority
boundary in `docs/governance/product-change-execution-policy.md`. Controller-
organized semi-automatic role progression is distinct from signed Host Loop
execution; changing mode does not waive the role or product Gates below.

Every product Change also requires the exact approved UI Contract and user UI
Gate PASS in the dispatch package. UI work and its user Gate occur on MacBook
before the package handoff; Spec does not begin and Mac mini does not invent or
revise the product UI contract.

After package-transfer authorization, MacBook freezes and publishes the exact
package, then creates a dedicated new Codex task on the saved Mac mini JuanerAI
project with the package as its initial message. Dispatch records the new task,
host, project, repository and package identities. It does not choose an
existing task by recency or ambient UI; creation or delivery failure stops for
the bounded manual create/open-and-forward fallback.

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

Shared contracts remain Controller-owned. Contract drift stops dependent implementation and returns to Spec/Design. Apply `docs/governance/product-change-execution-policy.md#in-scope-technical-decision-authority`: the delegated Mac mini coordinator resolves eligible deltas locally; decisions outside that authority return to MacBook with docs/templates/CONTRACT_CHANGE_REQUEST.template.md.

Parallel work requires frozen contracts and non-overlapping write paths. Same-worktree implementation is serial by default. Independent validation uses a fresh role context and a frozen implementation reference.

## Acceptance

The Controller reviews scope, terminology, contracts, data safety, expected RED, GREEN evidence, regression, traceability, risks, and independent verification. Tests are evidence, not approval.
