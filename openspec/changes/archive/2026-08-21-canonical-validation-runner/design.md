# Design

## Shape

One POSIX shell file is sufficient; no Node orchestrator is needed. The shell derives the repository root from its own location, selects the default bin or the one explicit override, replaces PATH before any tool resolution, checks versions, then invokes existing commands in fixed order with `XANTHIL_REAL_PI_ACCEPTANCE` removed.

```text
caller -> run -> fixed PATH + preflight -> existing offline commands
                                      \-> first failure exits nonzero
```

Commands stream to the caller. There is no machine-readable protocol, saved result, background process, parallelism, timeout, retry, or recovery flow.

## Preflight and plan

Node/npm/DuckDB are selected from the selected bin; Python is `/usr/bin/python3` under the canonical PATH. Node, npm, Python, and dependencies retain their approved trim/prefix checks. DuckDB alone takes the first non-empty whitespace-delimited token of trimmed normal `duckdb --version` output, removes one optional leading `v`, and compares it to `1.5.2`. Thus actual accepted output `v1.5.2 (Variegata) 8a5851971f` passes; no token or a different token fails. This is output handling for one inspected command, not a generic semver/parser or error protocol. Pi SDK and TypeBox compare root `package.json` declarations with installed package metadata. Failures are ordinary nonzero shell failures and prevent all checks.

The runner uses the accepted direct suite groups unchanged:

1. `node --check` for each repository `.mjs` outside `node_modules`;
2. `node --test tests/unit/xanthil-local-analysis/*.test.mjs`;
3. `node --test tests/contract/xanthil-local-analysis/*.test.mjs`;
4. `node --test tests/integration/xanthil-local-analysis/*.test.mjs`;
5. `node --test tests/e2e/xanthil-local-analysis/*.test.mjs`;
6. `node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`.

The Worker may use shell-safe deterministic file expansion/discovery but shall not turn counts, a file registry, or future test classes into a new contract. Each test command receives the real gate unset. No credentials are inspected, logged, or passed to a new external call.

## Compatibility

No manifest or package script changes. Direct commands remain valid. After
acceptance the Controller-only activation may add narrow discoverability
references to `tools/harness/README.md` and the `Validation and Completion`
section of `AGENTS.md`; no other documentation path is unlocked. Rollback
removes the runner and those two references only. The `.mjs` production
baseline remains unchanged, so no TypeScript exception is introduced.
