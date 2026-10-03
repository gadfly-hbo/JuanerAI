# Testing Policy

Authority and stop conditions come from
`docs/governance/product-change-execution-policy.md`.

- Before each behavior's implementation, state its minimum sufficient spec and
  acceptance reference, write the test, and run a causal expected RED. Then
  implement minimal GREEN and refactor only while GREEN.
- Pure refactors use pre/post GREEN and relevant equivalence evidence;
  documentation-only work does not fabricate RED.
- Prefer domain unit tests for pure rules, real-boundary integration tests,
  unchanged Port contract suites for replaceable Adapters, and real user-path
  checks for core Decision Loops. For affected user entry, UI, recovery and CI
  inputs, apply the sole policy's Continuous SDD and TDD section within these
  checks, not a separate test phase.
- Derive assertions from approved acceptance, not implementation details.
  Cover material positive, negative, boundary, failure and forbidden effects.
- Environment/import/locator/fixture failures are not product RED. Establish
  helper health and disclose masked assertions; final checks execute every
  required assertion.
- Mocks may isolate unrelated external systems but cannot replace the core
  behavior being proved.
- Apply the sole policy's CI reliability rules to validation-tool changes:
  exercise the actual entry and selection/failure paths, retain deterministic
  false-positive regressions, and measure optimized fixtures before/after.
  A lighter documentation check never claims product regression coverage.
- The engineering agent may update tests/fixtures with implementation within
  its authorized roots. Preserve assertions and negative coverage; use the
  appropriate decision before changing product or material contract meaning.
  Routine test correction does not return to a separate Test Design Gate.
- Apply `docs/governance/test-asset-retirement.md` within normal development
  and independent review. Test edits/removals must remain visible and supported
  by retained coverage; no separate retirement approval.
- Validator derives key cases from acceptance first, independently exercises
  key real and failure paths, and checks that tests can detect relevant errors.
  Passing author tests alone is not independent proof.

Desktop daily tests run without implicitly packaging. Keep native development
checks and package/resource/runtime/signature/install checks explicit, with each
applicable acceptance item mapped in the Change verification. Formal business
acceptance uses a fixed source/build/runtime/input identity; a live HMR session
is not a fixed candidate. Apply the sole policy's installed-artifact distinction.
