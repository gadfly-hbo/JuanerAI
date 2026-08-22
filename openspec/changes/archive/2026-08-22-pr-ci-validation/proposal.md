# PR Canonical Validation CI

- Change ID: `pr-ci-validation`
- Class: R1 ordinary capability — one bounded Git/CI governance behavior that
  reuses the accepted canonical validation command and changes no product,
  persistence, Port, Adapter, runtime, data, or security contract.
- Status: approved at Spec Gate

## Product, delivery, and learning objectives

**Product objective.** Preserve a trustworthy integration path for JuanerAI so
PR reviewers can see whether the repository's accepted offline validation
baseline passed before deciding to merge.

**Delivery objective.** Add one GitHub Actions workflow that runs a single
Ubuntu job for every pull request targeting `main`. The job assembles the exact
toolchain required by `tools/harness/validation/run` and exposes one PR check.

**Learning objective.** Establish whether the already accepted local canonical
validation command is reproducible on a clean GitHub-hosted Ubuntu runner. It
does not evaluate a model, provider, product runtime, or external data.

## Current acceptance scenario

When a reviewer opens, reopens, or pushes an update to a pull request whose
base branch is `main`, GitHub starts one `Canonical validation` job. It checks
out the pull-request merge/input ref, installs Node `26.0.0` and npm
`11.12.1`, downloads the official DuckDB `1.5.2` Linux amd64 CLI asset and
verifies its SHA-256, prepares the temporary toolchain bin, runs `npm ci`, and
runs `tools/harness/validation/run` with `JUANERAI_TOOLCHAIN_BIN` set to that
bin. The resulting one job status is visible on the PR.

## Scope

- Add `.github/workflows/ci.yml` only as production behavior.
- Trigger only `pull_request` events whose base branch is `main`.
- Use one `ubuntu-latest` job and one workflow/ref concurrency group with
  `cancel-in-progress: true`.
- Use `actions/checkout@v6`, `actions/setup-node@v7`, explicit
  `permissions: { contents: read }`, Node `26.0.0`, npm `11.12.1`, the runner
  Python `>=3.9`, and DuckDB `1.5.2`.
- Download only the fixed official DuckDB release asset and verify its supplied
  SHA-256 before extracting it to a runner-temporary bin.
- Reuse `tools/harness/validation/run` unchanged; pass its one approved
  toolchain override.

## Non-goals

- `push`, `workflow_dispatch`, schedules, matrices, cache, artifacts,
  coverage, deploys, GitHub API writes, branch-protection changes, PR mutation,
  secrets, real-model calls, or external business-data access.
- Any package/lock/dependency update, canonical-runner change, CI retry or
  fallback behavior, product/runtime/contract change, or persistent report.
- CI for branches other than PRs targeting `main`.

## Reused baseline and dependencies

- The current capability `openspec/specs/canonical-validation/spec.md` defines
  `tools/harness/validation/run` as the canonical offline command, its exact
  preflight, inherited-real-model-gate removal, and failure semantics.
- `package-lock.json` supplies deterministic dependency resolution for
  `npm ci`; this Change does not alter it.
- GitHub-hosted Ubuntu supplies the runner, Python, Actions execution, and PR
  check UI. Those are external execution dependencies, not JuanerAI runtime
  dependencies.
- The fixed DuckDB asset is the official DuckDB GitHub Release v1.5.2 Linux
  amd64 zip and its official Release API `digest` value. Source URL and digest
  are recorded in the specification; the workflow makes no release/API lookup.

## Paths and ownership

| Classification | Paths |
|---|---|
| Spec-author write | `openspec/changes/pr-ci-validation/**` |
| Worker allowed after TDD_READY | `.github/workflows/ci.yml` |
| Test conditional after Spec Gate | `tools/harness/validation/ci-workflow.test.mjs` only, if the Test Agent can prove the declarative contract without a YAML framework or unrelated harness change |
| Forbidden | all other `.github/**`; `tools/harness/validation/run`; package manifests/lockfiles; product source; existing tests; docs outside this Change; `.juanerai/project-control/**`; secrets; deployment and branch-protection configuration |

The Controller alone may update project-board lifecycle state under the
existing constitution; it is not this Change's deliverable.

## Activation, rollback, and retirement

Activation occurs when the approved workflow is merged to `main`; GitHub then
registers its PR check for later qualifying PRs. A rejected workflow is
inactive because it is not merged. Rollback is a follow-up removal of only
`.github/workflows/ci.yml`; no data, schema, dependency, cache, or external
state must be reversed. This Change creates no retirement candidate. Any
future CI replacement or branch-protection rule is a separate Change.

## Risk, stop lines, and evidence level

R1 is appropriate because the workflow is reversible and does not introduce a
JuanerAI product/security boundary, but it does introduce a read-only external
CI execution and supply-chain download. Required evidence is causal declarative
RED, focused GREEN, YAML/action review, a local canonical-runner regression,
scope check, and fresh read-only Validator review. No real GitHub workflow or
provider/model call is authorized before acceptance.

Return to Controller re-slicing if implementation needs a second workflow,
workflow trigger type, package/dependency change, cache/artifact, broader
permission, non-`main` trigger, dynamic checksum/source lookup, CI retry or
fallback, a branch-protection/API write, or a change to the canonical runner.
