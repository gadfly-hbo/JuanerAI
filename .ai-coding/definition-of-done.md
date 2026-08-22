# Definition of Done

A behavior-changing Change is Done only when:

- Proposal, scope, non-goals, Requirements, and Acceptance Criteria are approved.
- Design covers architecture, data, failures, security, compatibility, and rollback as applicable.
- Tasks map to Requirements, tests, and allowed paths.
- Spec Gate passes.
- Test plan and required tests map to Acceptance Criteria.
- Expected RED is executed and explained.
- Implementation is within scope.
- Target tests are GREEN.
- Required regression, lint, typecheck, build, architecture, and security checks pass or are explicitly not applicable.
- A Change that touched test assets has a PASS Test Asset Retirement Gate with a reconciled lifecycle ledger.
- Traceability covers REQ -> AC -> TEST -> TASK -> CODE -> RESULT.
- Independent verification passes or an authorized risk waiver is recorded.
- Controller or user acceptance is recorded according to risk.
- Delta specification is merged into the current behavior baseline and the Change is archived.

Claims without executable evidence are not completion.
