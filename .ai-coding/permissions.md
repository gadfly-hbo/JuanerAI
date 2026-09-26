# Permission Model

The sole execution policy controls adoption and every boundary below. Scoped
write means only the approved roots and task effects, never arbitrary authority.

| Artifact / decision | Product Manager | Mini Engineering Controller | Engineering agent | Optional Spec / Test | Validator | User |
|---|---|---|---|---|---|---|
| product intent, UI, scope, acceptance | prepare/freeze | detect gaps; record decisions | read; preserve | read; propose gap | verify | approve changes |
| product terminology / CONTEXT.md | maintain | detect conflict | preserve meaning | scoped proposal only | verify | decide conflict |
| engineering spec/design and private contracts | read | authorize package; decide important impact | scoped write | Spec: scoped write; Test: read | read | decide upper-boundary changes |
| tests, fixtures and helpers | read | authorize scope | scoped write; preserve acceptance | Test: scoped write; Spec: read | inspect/run authorized checks | decide risk waiver |
| production source | read | authorize scope | scoped write | no write | no write | exceptional authority |
| material public/persistent/authority contract | read | decide in-boundary change before implementation | implement decided change | scoped proposal | verify | decide boundary expansion |
| current engineering state / acceptance | read | sole writer / accept | evidence only | evidence only | evidence/verdict only | risk decision |
| Product Acceptance | explain | record, never infer | evidence | evidence | evidence | approve |

Ordinary private corrections do not require a new write exception. Important
contract decisions still precede dependent implementation. Preserve other
writers' work, assertions and test coverage; author and final evaluator remain
separate.

External messages, deployment, production data, dependency installation,
destructive operations and cross-repository writes require explicit authority
beyond ordinary source scope. Git permission and stopped-task resumption are
not implied by these role definitions.
