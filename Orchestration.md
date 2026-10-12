# JuanerAI Orchestration

OpenSpec owns specified behavior; domain boundaries organize code ownership.
The sole execution authority is `docs/governance/product-change-execution-policy.md`.
Its adoption and stopped-task conditions apply; this document does not activate
a product task or the inactive signed Host Loop.

## Responsibilities

MacBook is Product Manager: product intent, terminology, Blueprint, vertical
scope, UI, acceptance criteria and product-input freeze. Mini's engineering main
Agent is Engineering Controller and directly owns intake, engineering work
packages, spec/design, tests, implementation, corrections, important technical
decisions, single engineering state, acceptance and authorized delivery.
The user decides product ambiguity, boundary changes, extra actual resources,
permissions, residual risk and required Product Acceptance directly in Mini.

## Domains

| Domain | Owns | Does not own |
|---|---|---|
| product-governance | product docs, terminology, UI and product decisions | ordinary engineering decisions |
| experience | Desktop, compatibility-preserved CLI and user surfaces | infrastructure SDK behavior |
| core | Product Core, Application, Ports and contracts | concrete infrastructure |
| capability-packs | Domain/Model Pack SDKs and private logic | unapproved product-wide contracts |
| runtime-data | Adapters and deployment Profiles | product intent |
| quality | tests and deterministic checks | final product or engineering approval |

Domains are code/subject boundaries, not mandatory agent stages. One engineering
agent may own the authorized cross-domain slice. Repository or module extraction
still needs an approved architecture decision.

## Roles and Work Packages

- The Mini engineering main Agent continuously owns necessary engineering
  spec/design, tests, implementation, debugging and affected verification.
- `juaner_validator` is fresh, independent and read-only; candidate authors
  cannot perform final validation.
- These are the only two Mini engineering roles. Do not dispatch Worker/Spec/Test
  or generic implementation helpers. MacBook product review remains unchanged.
- Mini decides important in-boundary contracts and organizes delivery; it does
  not approve each ordinary correction or duplicate the full Validator review.

Each package names the result/acceptance references, non-goals, allowed roots,
conditional/forbidden paths, input identities, approved effects/toolchain,
necessary verification, resource limits and stop conditions. Use existing
DOMAIN_HANDOFF and HANDOFF_BACK fields only as applicable; link evidence rather
than copying it. Models and configuration are owned by `agent-model-routing.md`.

## Execution and Cross-domain Decisions

Use a small behavior loop: persisted minimum sufficient spec -> causal RED -> minimal
GREEN -> necessary refactor, then the next behavior. Correct private interfaces
and stale fixtures in that loop. Material public/persistent/authority contracts
get targeted impact review; user-boundary changes go directly to the user.
Only affected work stops. CONTRACT_CHANGE_REQUEST is for material decisions,
not routine private adjustments.

OpenSpec tasks.md remains the Change plan. AgentOps Task Bus stays inactive
unless separately authorized; no additional task ledger is introduced.
The main Agent is the single engineering author and state writer; Validator is
read-only. At ordinary milestones report progress and continue the approved
next action, rather than ending the task. Use the sole policy's end-of-turn check.

## Validation and Delivery

Validator first derives key expectations from approved acceptance, then reviews
the complete fixed candidate and actual evidence. It distinguishes material
blockers from advisory tidying under the sole execution policy. Test retirement
and scope/architecture checks occur in this same review.
Mini records Engineering Acceptance, required user Product Acceptance and
authorized Git delivery separately. No machine crossing is needed for reviewer
independence, and MacBook technical sign-off is not required.

Adopted v0.9 Mini engineering uses daily affected checks and authorized
work-branch checkpoints/pushes, with one formal Change PR/integration closeout.
Follow the sole policy's Mac mini Trial and User Acceptance section for the
Mini-local candidate, runtime entry readback and required user acceptance;
trial feedback is not formal completion.
