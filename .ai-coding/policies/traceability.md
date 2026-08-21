# Traceability Policy

Every Change uses stable identifiers:

- CHG-<slug> for the Change.
- REQ-<DOMAIN>-NNN for Requirements.
- AC-<DOMAIN>-NNN-NN for Acceptance Criteria.
- TEST-<DOMAIN>-NNN for tests.
- TASK-NNN for implementation tasks.

verification.md maps:

| Requirement | Acceptance | Test | Task | Code | Result |
|---|---|---|---|---|---|

Block acceptance when a Requirement lacks a test, a test lacks an approved Requirement, code lacks a Task, an Acceptance Criterion is unverified, or evidence contradicts the claimed result.

Runtime product traceability separately preserves Data source -> transformation -> analysis/model -> Decision -> authorization -> Action -> Outcome.

