# Permission Model

The sole execution policy controls adoption and every boundary below. Scoped
write means only the approved roots and task effects, never arbitrary authority.

| Artifact / decision | MacBook Blueprint Agent / Product Manager | Mini engineering main Agent | Validator | User |
|---|---|---|---|---|
| Blueprint direction, capability targets and priorities | maintain; recommend next Change | preserve; detect gaps | verify applicability | approve changes |
| Change product proposal, clickable UI/UI Contract, scope and acceptance | optional user-requested support | prepare; obtain user confirmation; freeze approved input | verify | approve product/UI and changes |
| product terminology / CONTEXT.md | maintain | preserve meaning; detect conflict | verify | decide conflict |
| engineering spec/design and private contracts | read | scoped write; decide important impact | read | decide upper-boundary changes |
| tests, fixtures and helpers | read | scoped write; preserve acceptance | inspect/run authorized checks | decide risk waiver |
| production source | read | scoped write | no write | exceptional authority |
| material public/persistent/authority contract | read | decide in-boundary change before dependent implementation | verify | decide boundary expansion |
| current engineering state / acceptance | read | sole writer / accept | evidence/verdict only | risk decision |
| Product Acceptance | explain | record, never infer | evidence | approve |

Ordinary private corrections do not require a new write exception. Important
contract decisions still precede dependent implementation. Preserve other
writers' work, assertions and test coverage; author and final evaluator remain
separate.

External messages, deployment, production data, dependency installation,
destructive operations and cross-repository writes require explicit authority
beyond ordinary source scope. Git permission and stopped-task resumption are
not implied by these role definitions.
