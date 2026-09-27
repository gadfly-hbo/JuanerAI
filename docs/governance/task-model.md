# Task Model

## Sources of Truth

| Concern | Source |
|---|---|
| long-lived engineering rules | AGENTS.md and .ai-coding/ |
| product language | CONTEXT.md |
| current behavior | openspec/specs/ |
| proposed behavior change | openspec/changes/<change-id>/ |
| executable correctness | tests/ |
| role dispatch | approved domain brief or future Task Bus |
| final result | verification.md, Engineering Acceptance, required user Product Acceptance, and archive |

## Mapping

One OpenSpec Change may contain several implementation Tasks. A future Task Bus item implements or validates a bounded subset of those Tasks and references the same Change, Requirement, and Test IDs.

Task Bus state never overrides the approved spec. A handoff never approves
itself. Engineering Controller approval never converts missing executable
evidence into PASS; a risk waiver requires the user's explicit decision.

## Engineering-Worker-Validator

- Product Manager freezes product intent, UI, business boundaries, and product acceptance criteria.
- Engineering Controller freezes engineering contracts, paths, validations, budgets, and task sequence inside those boundaries.
- Worker receives a scoped brief and returns evidence.
- Validator independently checks the frozen artifact and returns a verdict.
- Engineering Controller records Engineering Acceptance, requests changes, or blocks; the user separately owns Product Acceptance and boundary/risk decisions.

## Activation

AgentOps Task Bus is not initialized during this cold start. Activation requires repository lifecycle readiness, project-local routing, ignore policy, approved domains, and a first approved OpenSpec Change. No self-referential Engineering Controller Task is created.
