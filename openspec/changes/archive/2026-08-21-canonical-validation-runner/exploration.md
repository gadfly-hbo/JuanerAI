# Canonical Validation Runner — Controller Exploration

- Date: 2026-08-21
- Change class: ordinary, reversible governance-tool change (R1)
- Lifecycle state: returned to Spec after `CVR-PACKAGE-001` rejection
- Production/test authorization: none

## Approved Intent

The user approved this as the second of two sequential post-bootstrap
governance items. Its purpose is limited to eliminating repeated per-role PATH
assembly and tool-version ambiguity while providing one default offline
validation entrypoint. It remains separate from the completed project-board
Changes, any real-model execution workflow, and the deferred TypeScript
migration.

## Controller Revision Decision

The user rejected the first `CVR-PACKAGE-001` as over-designed. The revised
Spec must remove the real-model mode, JSONL/result protocol, complete-attempt
ledger, multi-class exit taxonomy, continue-after-failure behavior, and large
repository-shaped simulation framework. Those removed behaviors are not
compatibility obligations because the candidate package was never approved or
implemented.

## Observed Drift

The inherited interactive shell currently resolves:

```text
node  /Users/huangbo/.local/state/fnm_multishells/.../bin/node  v24.18.0
npm   /Users/huangbo/.local/state/fnm_multishells/.../bin/npm   11.16.0
```

The accepted first-slice command-local PATH is:

```text
/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin
```

It resolves the already-installed approved tools without installation or
global mutation:

```text
node     /Users/huangbo/Dev/Env/homebrew/bin/node    v26.0.0
npm      /Users/huangbo/Dev/Env/homebrew/bin/npm     11.12.1
duckdb   /Users/huangbo/Dev/Env/homebrew/bin/duckdb  v1.5.2
python3  /usr/bin/python3                            3.9.6
```

The frozen project manifest additionally declares npm 11.12.1, Node
`>=22.19.0`, Pi SDK 0.84.2, and TypeBox 1.3.7. The current approved local
installation contains those exact direct package versions. `pi` CLI is not on
the accepted minimal PATH and is not required by the embedded SDK validation
path.

## Reused Validation Baseline

Default deterministic suites already accepted:

- unit: 250/250;
- contract: 198/198;
- integration: 243/243;
- E2E default: 131 pass plus the single intentionally gated real-model skip;
- project-board base/focused: 12/12;
- Node syntax for every repository `.mjs` outside `node_modules`;
- exact fixture, package, architecture, and security baselines in the archived
  first-slice evidence.

The real-model leaf is named `TEST-XCLI-013 real Pi acceptance...` and runs
only when `XANTHIL_REAL_PI_ACCEPTANCE=1`. It uses the approved synthetic
fixture, embedded Pi SDK, and closed personal Profile. The default matrix must
remove that gate from child environments even if inherited from a caller.

## Candidate Minimum Shape for Spec

- One POSIX shell entrypoint, `tools/harness/validation/run`, that establishes
  a command-local canonical PATH before resolving tools.
- No separate production orchestrator unless the revised Spec proves the one
  shell entrypoint cannot meet the approved behavior.
- Fail-fast preflight for exact Node, npm, DuckDB, Pi SDK, and TypeBox versions,
  plus the existing Python `>=3.9` contract.
- Fixed default offline matrix: syntax, unit, contract, integration, default
  E2E, and project-board suites.
- Remove `XANTHIL_REAL_PI_ACCEPTANCE` from every validation child, including
  when inherited from the caller. The runner has no real-model mode.
- Stream the existing command output unchanged. Stop at the first failed
  preflight or validation command and return nonzero; successful completion
  returns zero.
- No persistent report, result schema, database, project-control write, install,
  dependency change, or global environment mutation.
- A single toolchain-bin override may be considered for another machine, but
  exact versions and canonical PATH shape must still fail closed; ambient PATH
  fallback or silent tool discovery would recreate the original problem.
- Approximately four focused public-entrypoint tests: accepted PATH/version
  success, version mismatch fail-fast, inherited real gate removal, and
  validation-command failure propagation.

## Decisions the Spec Package Must Close

1. canonical entrypoint name and minimal invocation behavior;
2. default toolchain root and whether one explicit override is allowed;
3. minimal version checks and fail-fast nonzero behavior;
4. exact offline command order and whether counts are current evidence or a
   permanently hard-coded contract;
5. unconditional offline real-gate sanitization and prohibition of every real
   model mode or call;
6. streamed child output, transient-only behavior, activation, and rollback;
7. approximately four focused public-entrypoint tests without a new test
   framework, production hook, or external call.

## Stop Lines

- Adding a persisted result manifest, versioned schema, database, or report
  directory requires structure confirmation before Spec Gate.
- Adding package scripts or changing manifest/lock dependencies requires
  explicit Controller approval and revised scope.
- Any real-model mode, provider call, retry, fallback, or related authorization
  protocol belongs to a separate Change and is forbidden here.
- The runner must not become a generic command executor, install manager,
  environment repair tool, result protocol, retry loop, or replacement for
  Change-specific evidence decisions.
