# Definition of Done

A behavior-changing Change is Done only when:

- The exact Product Input Package, UI Contract, and user UI Gate PASS are recorded.
- Proposal, scope, non-goals, Requirements, and Acceptance Criteria are approved.
- Design covers architecture, data, failures, security, compatibility, and rollback as applicable.
- Tasks map to Requirements, tests, and allowed paths.
- Spec Gate passes.
- Test plan and required tests map to Acceptance Criteria.
- Expected RED is executed and explained.
- TDD_READY is recorded before Worker dispatch.
- Implementation is within scope.
- Target tests are GREEN.
- Required regression, lint, typecheck, build, architecture, and security checks pass or are explicitly not applicable.
- A Change that touched test assets has a PASS Test Asset Retirement Gate with a reconciled lifecycle ledger.
- Traceability covers REQ -> AC -> TEST -> TASK -> CODE -> RESULT.
- Independent verification passes or an authorized risk waiver is recorded.
- Real user-visible paths are verified against the frozen UI Contract; synthetic
  or backend-only evidence does not stand in for a required UI check.
- Engineering Acceptance is recorded by the Engineering Controller.
- Required user Product Acceptance is separately recorded; Validator PASS and
  Engineering Acceptance are not substitutes.
- Delta specification is merged into the current behavior baseline and the Change is archived.

Claims without executable evidence are not completion. Engineering completion
does not claim product acceptance, Git permission, release, or deployment that
was not explicitly granted.
