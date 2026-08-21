# Canonical Validation Runner Specification

This is an R1 governance-tool capability. It changes no Xanthil product
behavior. Historic suite counts are evidence, never a success contract.

## CVR-REQ-001 — Public shell entrypoint and PATH

`tools/harness/validation/run` SHALL be an executable POSIX shell entrypoint.
No argument runs the sole offline plan; `--help` prints usage and exits zero
without preflight or test. Other arguments fail nonzero without running a
child.

It SHALL use `/Users/huangbo/Dev/Env/homebrew/bin` unless the single explicit
`JUANERAI_TOOLCHAIN_BIN` environment variable is set to a usable directory.
Before resolving a tool, it SHALL replace PATH for itself and descendants with
`<selected-bin>:/usr/bin:/bin`. It SHALL not search, extend, repair, install,
or otherwise use ambient PATH.

### CVR-AC-001

With an incompatible caller PATH, the entrypoint invokes tools through the
selected bin and no caller PATH component reaches a validation child.

### CVR-AC-002

An unusable override, missing selected Node executable, or unsupported
argument returns nonzero and starts no validation command.

## CVR-REQ-002 — Fail-fast preflight

Before validation, the entrypoint SHALL fail fast unless these installed
values match: Node `26.0.0`, npm `11.12.1`, DuckDB `1.5.2`, Pi SDK `0.84.2`,
and TypeBox `1.3.7`; Python SHALL satisfy `>=3.9`. Node, npm, Python, and
dependency handling use only trim and their known leading-version-prefix
handling. DuckDB alone SHALL take the first non-empty whitespace-delimited
token from trimmed normal `duckdb --version` output, remove one optional
leading `v`, then require exact `1.5.2`. A missing token or mismatch is a
preflight failure. This handles the accepted output
`v1.5.2 (Variegata) 8a5851971f`; it is not a generic semantic-version parser
or error protocol. Dependency checks SHALL compare the root manifest
declaration and installed package metadata. No validation command starts after
a preflight failure.

### CVR-AC-003

The accepted toolchain, including DuckDB output
`v1.5.2 (Variegata) 8a5851971f`, and direct dependency metadata pass preflight
and begin the offline plan.

### CVR-AC-004

One wrong tool or dependency value, including a missing or mismatched first
DuckDB token, stops before syntax or test execution and returns nonzero; it
does not install, repair, or select an alternative.

## CVR-REQ-003 — Offline validation plan and real-call exclusion

For every child command, the entrypoint SHALL remove
`XANTHIL_REAL_PI_ACCEPTANCE`, regardless of the caller environment. It has no
`--offline`, `--real-model`, authorization switch, provider selection, retry,
fallback, or external invocation behavior.

After preflight it SHALL run, sequentially and fail-fast, the existing
repository checks in this order: syntax for repository `.mjs` files outside
`node_modules`; unit tests; contract tests; integration tests; default E2E
tests; project-board tests. It SHALL derive repository-relative paths from the
runner location, not caller CWD, and invoke the existing tests unchanged.

### CVR-AC-005

With `XANTHIL_REAL_PI_ACCEPTANCE=1` inherited by the caller, the default E2E
child receives it unset and its real-model leaf remains skipped.

### CVR-AC-006

The accepted repository completes the checks in the stated order. A failed
syntax or test command streams its native output, stops later checks, and
propagates a nonzero result.

## CVR-REQ-004 — Transient, non-mutating operation

The entrypoint SHALL stream child stdout and stderr directly. All-success
returns zero; a preflight or validation failure returns nonzero. It SHALL not
create a report, JSONL protocol, summary, skip ledger, cache, log, schema,
database, project-board record, artifact directory, package change, dependency
change, or global-environment mutation.

### CVR-AC-007

A successful or failed run creates no runner-owned persistent result and does
not modify forbidden repository or global paths.
