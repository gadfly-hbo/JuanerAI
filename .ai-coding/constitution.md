# AI Engineering Constitution

## Purpose

JuanerAI uses OpenSpec-based SDD/TDD as its development control system. AI may execute quickly but may not define correctness while implementing.

## Invariants

- Human intent and approved specifications define correct behavior.
- Observable behavior has an approved Change before production implementation.
- Tests derive from approved Acceptance Criteria.
- Expected RED precedes production implementation.
- Implementation changes production code rather than weakening tests.
- Replaceable infrastructure satisfies Port contract tests.
- Independent verification precedes acceptance unless a documented risk waiver applies.
- Evidence precedes completion claims.
- Archive updates the current behavior baseline.

## Architecture Invariant

Product Core and Application depend inward on domain language and Ports. Infrastructure depends on those Ports. Product surfaces and deployment Profiles assemble capabilities but do not redefine business rules.

## Safety Invariant

Every Decision, Action Recommendation, automated Decision, Action, and Outcome remains distinguishable and traceable. External effects require explicit authorization and fail-closed behavior.

