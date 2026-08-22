# Testing Policy

- Prefer domain unit tests for pure rules, integration tests for real component boundaries, contract tests for every Port Adapter, and E2E tests for core Decision Loops.
- Test the observable result and forbidden side effects, not implementation details.
- Every material Acceptance Criterion has positive, negative, boundary, and failure-path coverage as applicable.
- RED is valid only when the test environment is healthy and the target behavior is absent.
- Mocks may isolate an external boundary but may not replace the core behavior being proved.
- Adapter contract suites run unchanged against each implementation.
- Data, permission, identity, action, persistence, concurrency, recovery, and audit changes require negative-first evidence.
- A test change during implementation is a conflict requiring return to Test Design unless the approved task explicitly includes the correction.
- Test assets follow `docs/governance/test-asset-retirement.md`; passing or aging alone never authorizes deletion.
