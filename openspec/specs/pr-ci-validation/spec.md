# PR Canonical Validation CI Specification

This R1 governance capability adds one read-only CI check. It reuses the
accepted `canonical-validation` capability and changes no Xanthil product
behavior, shared contract, persistence, runtime, or data model.

## PRCI-REQ-001 — Qualifying PR trigger and one check

`.github/workflows/ci.yml` SHALL trigger only on `pull_request` activity whose
base branch is `main`. The standard pull-request lifecycle therefore includes
opened, reopened, and synchronized (updated) PRs. It SHALL define exactly one
Ubuntu job named `Canonical validation`; that job is the sole status check
created by this workflow.

The workflow SHALL set `permissions` to `contents: read` and no broader
permission. It SHALL use same-workflow/ref concurrency and
`cancel-in-progress: true`, so a newer run for the same PR ref cancels the
older in-progress run. It SHALL NOT declare any `push`, manual-dispatch,
schedule, workflow-call, matrix, cache, artifact, coverage, deployment, or
GitHub write behavior.

### PRCI-AC-001

Given an opened, reopened, or synchronized PR with base `main`, GitHub admits
one `Canonical validation` Ubuntu job. Given a PR whose base is not `main`, or
a non-`pull_request` repository event, this workflow admits no job.

### PRCI-AC-002

The workflow declaration has exactly `contents: read` permission, one job, and
concurrency keyed by the workflow and ref with cancellation enabled. A later
run for that key supersedes an in-progress earlier run; it does not start a
second concurrent validation for that key.

## PRCI-REQ-002 — Fixed source, toolchain, and provenance

The job SHALL use `actions/checkout@v6` to check out GitHub's PR merge/input
revision and `actions/setup-node@v7` with exact Node `26.0.0`. It SHALL install
exact npm `11.12.1` and fail before dependency installation if Node or npm is
not the required version. It SHALL use the runner's `python3`, which the
canonical runner will reject unless it is `>=3.9`.

The job SHALL download exactly:

```text
https://github.com/duckdb/duckdb/releases/download/v1.5.2/duckdb_cli-linux-amd64.zip
```

It SHALL verify the downloaded zip before extraction with SHA-256
`fc9145affabca627431e73ddaf6b8117e5c192692480c13886f227be202d5d15`, then
install the extracted `duckdb` executable into a new runner-temporary bin. The
job SHALL construct that same bin with the selected Node and npm executables;
it SHALL not install DuckDB globally or use an ambient DuckDB executable.

The checksum provenance is the `digest` field for this named asset in the
official DuckDB GitHub Release v1.5.2 API response, observed 2026-08-22. Its
release page identifies tag `v1.5.2` and commit `8a58519`; the workflow itself
uses the fixed URL and fixed checksum, not a mutable release lookup.

### PRCI-AC-003

On a clean Ubuntu runner, the job selects Node `26.0.0`, npm `11.12.1`, and
only the verified official DuckDB Linux amd64 asset. Before checksum success,
the zip is neither extracted nor used. The temporary toolchain bin contains the
selected `node`, `npm`, and verified `duckdb` executables.

### PRCI-AC-004

If checkout, Node/npm setup/version verification, download, checksum,
extraction, temporary-bin construction, or the canonical runner's Python
preflight fails, the job exits nonzero and does not continue to a later step.
It does not select an alternate source/tool/version, retry, repair, write a
cache/artifact/report, or disclose a secret.

## PRCI-REQ-003 — Canonical offline validation execution

After the fixed toolchain succeeds, the job SHALL run `npm ci` against the
checked-out repository and then invoke exactly:

```text
JUANERAI_TOOLCHAIN_BIN=<assembled-temporary-bin> tools/harness/validation/run
```

It SHALL preserve the canonical runner as the authority for its own preflight,
offline suite ordering, inherited `XANTHIL_REAL_PI_ACCEPTANCE` removal, native
output, and exit semantics. The workflow SHALL not add a real-model flag,
provider configuration, secret, retry/fallback, test selection, alternate
validation command, or runner modification.

### PRCI-AC-005

With the verified toolchain and successful `npm ci`, the job runs the canonical
command with `JUANERAI_TOOLCHAIN_BIN` pointing only to its assembled temporary
bin. A zero command exit marks the sole job successful; a nonzero exit marks
it failed and keeps the runner's native output in the job log.

### PRCI-AC-006

Even if a caller/environment supplies `XANTHIL_REAL_PI_ACCEPTANCE`, the
canonical runner removes it from every validation child. The workflow makes no
model/provider invocation, business-data request, automated action, external
GitHub write, or persistent JuanerAI state change.
