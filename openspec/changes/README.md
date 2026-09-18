# OpenSpec Changes

Each non-trivial observable change receives one directory named by a stable change slug.

Before creating that directory for a product Change, freeze the exact
change-scoped clickable UI Contract and the user's UI Gate PASS under
`.ai-coding/state-machine.md`. The Proposal references both artifacts. Backend,
Runtime, Adapter, and infrastructure scope does not bypass this prerequisite.

Required artifacts:

- proposal.md
- design.md
- tasks.md
- test-plan.md
- traceability.md
- verification.md
- specs/<capability>/spec.md

Each Change declares Why, Goal, Scope, Out of Scope, Requirements, Acceptance Criteria, risk, dependencies, allowed paths, forbidden areas, activation, rollback, and evidence level.

The pending Xanthil Desktop and Model Pack plans are withdrawn under `docs/planning/README.md`. Wait for the user's whitepaper-based development adjustment before selecting a new product Change. Existing accepted Changes and baseline specifications remain valid; withdrawal is not acceptance or archive of unfinished work.

Completed Changes move under archive/ only after acceptance and merge into openspec/specs/.
