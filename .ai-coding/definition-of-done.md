# Definition of Done

Use `docs/governance/product-change-execution-policy.md`; completion does not
grant external, Git or release authority.

A behavior-changing Change is engineering-complete when:

- Approved product input, applicable UI Contract and user UI approval are bound.
- Current behavior specs cover the delivered acceptance points and necessary
  contracts; ambiguity was resolved before affected implementation.
- Behavior-scoped causal RED precedes implementation; target tests are GREEN.
- Applicable type/build, regression, contract, real-path, architecture and
  safety checks pass or have a justified explicit non-applicability.
- Scope, compatibility, failures, forbidden effects and important design
  decisions remain inside approved boundaries.
- Changed test assets preserve required coverage and removal/retention evidence.
- Acceptance -> test/code/result links support every material delivery claim;
  historical failures, UNKNOWN, residual risk and missing evidence are honest.
- Independent evaluation of the complete fixed candidate passes, or the user
  explicitly accepts a named risk waiver that is not called Validator PASS.
- Mini records Engineering Acceptance; applicable authorized archive preserves
  the current behavior baseline and Change history.

Required user Product Acceptance is separate and must precede transitions that
depend on it. Product completion, merge and deployment are not implied by
engineering verification.

Spec Gate, TDD_READY dispatch approval and a standalone Test Asset Retirement
Gate are not prerequisites in the adopted continuous path. Their old records
are preserved. Pure refactors require pre/post GREEN/equivalence; documentation
and role-instruction changes use proportionate consistency/scope review without
inventing product RED or UI acceptance.
