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
  checks for core Decision Loops.
- Derive assertions from approved acceptance, not implementation details.
  Cover material positive, negative, boundary, failure and forbidden effects.
- Environment/import/locator/fixture failures are not product RED. Establish
  helper health and disclose masked assertions; final checks execute every
  required assertion.
- Mocks may isolate unrelated external systems but cannot replace the core
  behavior being proved.
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
