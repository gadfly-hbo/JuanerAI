# CI reliability and feedback

The approved engineering workflow repair makes local and CI validation agree,
fails early on stale harness contracts, avoids full product runs only for proven
non-runtime documentation, and exposes failures while commands run. It also
repairs the UUID-collision privacy oracle and reduces repeated synthetic fixture
construction without removing production database validation or safety coverage.

This is developer tooling and test maintenance, with no product behavior or UI
change and no new UI Gate. Existing product acceptance remains unchanged.

Allowed: `.github/workflows/ci.yml`, `tools/harness/validation/**`, this Change,
affected canonical/CI specifications, the explicitly assigned Desktop tests and
fixtures, and parent-owned workflow/testing guidance. No production code,
dependencies, lock changes, archived records, board/Host Loop, credentials,
remote device mutations, provider calls or new framework. This worker has no Git
writes; the package grants no Git publication authority. Parent delivery retains
the user's separate conversation authorization.

Following the candidate-002 cloud timeout, the bounded test partition also
includes `member-task-retained.integration.test.ts`,
`tests/fixtures/xanthil-desktop/member-task-test-support.ts` and their explicit
`tsconfig.json`/runner-fixture inventory entries. It changes test organization,
not product behavior, assertion strength, dependency pins or CI resource limits.
The independent complete-tsconfig tuple in
`tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
receives only the same exact CI-maintenance appendix; existing approved tuples
and rejection cases remain unchanged.

Acceptance is defined in [spec.md](spec.md). The current result and evidence are
kept once in [verification.md](verification.md). Independent review and parent
acceptance remain separate from author checks. No Blueprint capability delta.
