# Test Plan

## Test design boundary

The behavior is a GitHub workflow declaration. No real workflow, GitHub API
write, provider/model call, or remote download is authorized as test evidence.
After Spec Gate, the Test Agent may add exactly one public, dependency-free
Node test at `tools/harness/validation/ci-workflow.test.mjs`. It must read the
workflow as the public declaration and verify structured, bounded clauses; it
must not introduce a YAML parser/framework/dependency, test seam, workflow
implementation, or change to `tools/harness/validation/run`.

If a dependency-free test cannot distinguish the required declarative clauses
causally, the Test Agent returns BLOCKED rather than adding a parser or weakening
the contract. Because no test asset exists yet, Test Design must read
`docs/governance/test-asset-retirement.md` and initialize its required lifecycle
evidence before TDD_READY.

| Test | AC | Positive / negative observable proof |
|---|---|---|
| PRCI-TEST-001 | AC-001 | Missing workflow is causal RED; present declaration admits only `pull_request` with `main` base filter, one named Ubuntu job, and no forbidden trigger |
| PRCI-TEST-002 | AC-002 | exact read-only permission, one job, workflow/ref concurrency, and cancellation are required; broader permission/missing cancellation fails |
| PRCI-TEST-003 | AC-003, AC-004 | exact Actions/versions/fixed DuckDB URL/SHA and verify-before-extract temporary-bin sequence are required; altered checksum/source/version or absent verification fails |
| PRCI-TEST-004 | AC-005, AC-006 | `npm ci` precedes exactly the approved override invocation; real-model/provider/secret/retry/fallback/cache/artifact/API-write declarations fail |

The test's expected RED is the absent `.github/workflows/ci.yml`, with its own
fixture/environment health proven before reporting RED. Worker scope freezes to
one workflow file only after the Test Agent records the exact test hash, command,
failure output, and no-forbidden-side-effect evidence. The static contract test
is appropriate evidence for declarative CI shape; GitHub parses/runs the file
only after merge and is not substituted by a claimed local workflow execution.

## Focused and regression validation intent

- Focused: `node --test tools/harness/validation/ci-workflow.test.mjs` (only if
  the conditional test was approved and created).
- Syntax/scope: inspect `.github/workflows/ci.yml`, `git diff --check`, and
  `git diff --name-only` against the frozen base.
- Regression: `tools/harness/validation/run` using the already accepted local
  toolchain; its result remains evidence, not a test of the remote workflow.
- Independent Validator repeats relevant static/focused/local checks read-only.

No fixed historic test count, remote CI result, cache hit, external service
availability, or model result is an acceptance contract.
