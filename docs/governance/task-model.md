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
| final result | verification.md, Controller acceptance, and archive |

## Mapping

One OpenSpec Change may contain several implementation Tasks. A future Task Bus item implements or validates a bounded subset of those Tasks and references the same Change, Requirement, and Test IDs.

Task Bus state never overrides the approved spec. A handoff never approves itself. Controller approval never converts missing executable evidence into PASS without an explicit waiver.

## Master-Worker-Validator

- Master/Controller freezes intent, contract, boundaries, and task sequence.
- Worker receives a scoped brief and returns evidence.
- Validator independently checks the frozen artifact and returns a verdict.
- Controller accepts, requests changes, or blocks.

## Activation

AgentOps Task Bus is not initialized during this cold start. Activation requires repository lifecycle readiness, project-local routing, ignore policy, approved domains, and a first approved OpenSpec Change. No self-referential Controller Task is created.

