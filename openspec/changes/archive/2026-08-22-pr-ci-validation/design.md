# Design

## Minimal shape

One declarative workflow file is sufficient.

```text
pull_request(base=main)
  -> Canonical validation (ubuntu-latest, one workflow/ref slot)
  -> checkout PR merge/input -> fixed Node/npm
  -> download + SHA-256 verify fixed DuckDB zip
  -> temporary bin: node, npm, duckdb
  -> npm ci -> canonical offline runner -> one PR status
```

The workflow has no custom action, script file, service, cache, artifact,
report, persistence, retry, fallback, matrix, or background process.

## Workflow mechanics

`pull_request.branches: [main]` supplies the base-branch filter and GitHub's
normal opened/reopened/synchronize lifecycle. One job, `Canonical validation`,
runs on `ubuntu-latest`. `concurrency.group` combines `github.workflow` and
`github.ref`, and `cancel-in-progress: true` gives a newer PR run precedence
over its own older run. This concurrency affects only GitHub job scheduling; it
does not create a JuanerAI concurrency contract.

`actions/checkout@v6` checks out GitHub's event-selected PR merge/input
revision. `actions/setup-node@v7` installs exact Node `26.0.0`. A following
version assertion and exact npm `11.12.1` installation/assertion make version
drift a fail-fast CI failure, rather than a fallback decision.

The workflow allocates a directory below `RUNNER_TEMP`, verifies the DuckDB zip
with `sha256sum --check --status`, extracts it only after success, and constructs
a private bin containing the selected `node`, `npm`, and `duckdb`. It supplies
that directory through the sole supported override,
`JUANERAI_TOOLCHAIN_BIN`. The canonical runner then replaces its child PATH and
performs its existing own checks, including `python3 >=3.9`.

## Security and network boundary

The `GITHUB_TOKEN` is constrained to `contents: read`; no step uses GitHub
write APIs. The workflow defines no secrets, environment token forwarding,
artifact upload, cache, or deployment. Its allowed network boundary is exactly
the GitHub Actions action/runtime retrieval required by the two approved
official actions, the public npm registry needed for exact npm and locked
`npm ci` dependencies, and the fixed public official DuckDB Release asset.
These downloads contain tools/dependencies, not product or customer data.

The DuckDB checksum is hard-coded from the official release metadata before
download and checked locally. No dynamic latest-version, redirect-selected
version, third-party mirror, ambient DuckDB, package manager DuckDB, or checksum
fetch is permitted. Actions are frozen to the explicitly approved references
`actions/checkout@v6` and `actions/setup-node@v7`; changing either reference is
a new security/supply-chain decision.

The workflow does not authorize a Pi/model/provider call. The canonical runner
unsets the real-model gate as its existing contract requires. Logs are GitHub
CI logs only; the workflow does not intentionally log secrets or create
repository-owned result files.

## Failure behavior and rollback

All setup/download/install/validation steps are sequential and fail-fast.
Native step output remains available in GitHub's job log. There is no retry,
diagnostic upload, cleanup protocol, alternate toolchain, or partial-success
state; an external transport failure or checksum mismatch is simply a failed
check. A cancelled older concurrency run is superseded by its newer peer, not
treated as a passing validation.

The activation point is merge of the workflow to `main`. Rollback removes this
one file in a subsequent governed Change, after which GitHub no longer admits
future checks from it. The temporary runner directory dies with the hosted
runner; there is no JuanerAI data to migrate or recover.

## Compatibility and boundaries

The existing `tools/harness/validation/run`, project dependencies, lockfile,
direct local commands, and pull-request template remain unchanged. The workflow
does not configure required checks or alter merge eligibility; branch protection
remains a separate governance decision. CI outcome is review evidence, not a
Controller acceptance, product decision, or execution authority.
