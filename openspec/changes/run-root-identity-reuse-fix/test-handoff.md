# Test handoff — TDD_READY

## Scope and frozen assets

- Approved Change / gate: `run-root-identity-reuse-fix`, Controller Spec Gate PASS.
- Test asset: `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
- SHA-256: `f94895a0a55a2886cc26bce4aad4c2a912bc7242ebf8ccf0ad4a280e828c6723`
- Frozen leaf (line 2303; unsafe-root assertion line 2317): `TASK-010 R3 TEST-XCLI-008 [AC-XCLI-001-01, AC-XCLI-007-01] maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing`
- Uncorrected Adapter SHA-256: `3e40eaf9cc0997ca5b708ac056ebd3e3132d4d9e9521af6ae7e103d1d027b170`

No test, fixture, helper, double, snapshot, coverage, or harness diff exists. `git diff --exit-code -- tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` exited 0.

## AC-to-test map

| Acceptance criterion | Existing test / proof |
| --- | --- |
| AC-RRIF-001-01 | Frozen leaf's initial valid root preflight returns frozen `{ ready: true }`. |
| AC-RRIF-001-02 | Frozen leaf removes each root, immediately recreates the `replaced` pathname, and requires exact `RUN_ROOT_UNSAFE`; it also checks recreated/symlink-target directories stay empty. Missing, symlink, and non-directory are retained negative paths. |
| AC-RRIF-001-03 | Existing Artifact Port contract suite verifies the frozen public Store surface; Worker path is constrained to the Adapter and scope review verifies no persistence/lifecycle change. |

## Frozen commands and actual local health evidence

Canonical local toolchain: Node `v26.0.0`, npm `11.12.1`, DuckDB `v1.5.2`.

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin node --test --test-name-pattern='maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing' tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts
```

Test Correction 001: the prior fully escaped title pattern was not valid as documented under Node 26 regular-expression parsing. This unique literal title fragment is the corrected reproducible command. Executed verbatim after this correction on the uncorrected Adapter: exit 0; tests 1, pass 1, fail 0, skipped 0. This is environment-health/regression evidence only: macOS did not reuse the released inode in this run, so it is not causal proof that replacement is handled.

Affected existing Artifact Store contract command:

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin node --test tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts
```

Actual result on the uncorrected Adapter: exit 0; tests 198, pass 198, fail 0, skipped 0.

## Expected RED evidence and attribution

Controller-captured GitHub-hosted Ubuntu evidence from PR #4 is the causal RED: Actions run `32575185495`, job `97036374334`, canonical integration suite `242/243` passed, with `Missing expected rejection` at this leaf (test line 2303; `assert.rejects` line 2317). The setup/toolchain and the other 242 integration tests completed, so this is not a dependency, syntax, runner, fixture, or general environment failure.

The conclusion that the failing loop member is `replaced` is a **source-based deduction**, not a log line naming the member: missing, symlink, and non-directory each hit explicit unsafe checks in `checkRunRoot()` (`lstatSync` failure, `isSymbolicLink()`, or `!isDirectory()`); only the same-path `replaced` member depends on equality of `realpath`, `dev`, and `ino`. On Linux, immediate recreation can reuse the released `(dev, ino)`, leaving the current unpinned comparison unable to reject. This is the missing behavior required by AC-RRIF-001-02.

## Test Asset Retirement initial ledger

| Asset | Class | Current evidence purpose / consumer | Final disposition |
| --- | --- | --- | --- |
| `TEST-XCLI-008` leaf at line 2303 | permanent regression | REQ-RRIF-001 / AC-RRIF-001-01..03 and existing unsafe-root/no-write contract | retain unchanged |

There are no added, changed, or retired test assets. The post-GREEN Controller retirement gate must reconcile this ledger against the complete diff; no Test-role cleanup is authorized.

## Frozen Worker brief

- Allowed production write: `adapters/storage-local/local-analysis.ts` only.
- Do not modify tests, fixtures, helpers, harnesses, workflows, Ports, Profiles, contracts, packages, or project-control.
- Run exactly the focused leaf and affected Artifact Port contract command above after the Adapter change.
- Any need to change a test/workflow/contract, or any second remote proof, is `SCOPE_ESCALATION` / Controller review. No real model, network data, or credentials are authorized.

## Routing record

R2 Test routing floor is Terra-high; the configured `juaner_test` role is fixed Terra-medium and cannot be overridden. This handoff uses the actual available route without lowering acceptance evidence; Controller Sol-xhigh must fully review it.
