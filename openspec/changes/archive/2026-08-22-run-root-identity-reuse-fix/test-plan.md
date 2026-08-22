# Test Plan

## Assets and Mapping

`tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` is the sole Test write path. Existing `TASK-010 R3 TEST-XCLI-008 [AC-XCLI-001-01, AC-XCLI-007-01] maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing` remains permanent regression coverage. Test adds only the two leaves below, under the existing `TEST-XCLI-008` identity; no shared helper, production seam, or test framework path is added.

| AC | Existing TEST | Positive / negative observable proof |
|---|---|---|
| AC-RRIF-001-01 | TEST-XCLI-008 new mode-`0300` leaf | Create the test-owned root, set `0300`, construct Store, and assert `preflightRunRoot()` returns frozen `{ready:true}`. Restore permissions in `finally` before cleanup. Run on macOS and Ubuntu. |
| AC-RRIF-001-02 | Existing TEST-XCLI-008 plus new child-process leaf | Existing pre-call replacement remains. New isolated child imports Adapter after `--experimental-test-module-mocks` mock setup: on second `node:fs` `lstatSync` (the preflight configured-path observation), it captures the original stat, synchronously replaces the root pathname, then returns that stale stat. The uncorrected implementation accepts; the live-descriptor implementation must reject exactly `RUN_ROOT_UNSAFE` with no run/Artifact write. |
| AC-RRIF-001-03 | New child-process leaf plus public-surface/persistence scope review | A complementary child mock intercepts the per-preflight live `openSync`: it calls the real open for the original directory, synchronously replaces the pathname, then returns that original fd. `fstat` must still match the pinned root and preflight returns `{ready:true}`, proving the declared after-linearization result. Scope inspection proves no Port/lifecycle/persistence addition. |

## Causal RED and GREEN

The uncorrected Adapter's prior GitHub Ubuntu `242/243` is causal only for replacement before a preflight call; the later `243/243` is regression evidence for that case only. Neither proves mode-`0300` compatibility or a replacement interleaved inside preflight. New Test RED must first prove the module mock executes in a fresh Node 26 child with `--experimental-test-module-mocks`, that `node:fs` is mocked before Adapter import, and that each synchronous mutation occurs at its declared boundary. It may mock only the filesystem boundary; it does not replace the Adapter/core behavior.

The child fixture SHALL use Node 26's `mock.module('node:fs', { exports: { ...actualExports, lstatSync, openSync } })` under `--experimental-test-module-mocks`. It mocks `lstatSync` for before-acquisition and `openSync` for after-acquisition, while delegating all other filesystem functions to their actual implementations. Invocation counters and mutation-trigger assertions SHALL prove that the before-acquisition `lstatSync` and after-acquisition live `openSync` interception each executed exactly once; the latter must fail RED on the current candidate when it makes no second live open, preventing a false pass. If the experimental API cannot preserve required exports or imported-binding interception, the Test role returns `BLOCKED`; polling, timing sleeps, retries, and a production hook are prohibited.

Focused commands must be frozen by Test before TDD_READY. At minimum they name the exact leaf through the project-approved Node test invocation and the affected existing Artifact Port contract command. `tools/harness/validation/run` is the required canonical offline regression command. No model invocation is allowed.

## Test-asset retirement ledger

Existing `TEST-XCLI-008`: permanent regression, retained. Mode-`0300` leaf: permanent compatibility regression. Child module-mock fixture: permanent test-private linearization code, retained inline in its owning integration file; it is not a standalone tracked helper. No retirement is authorized before post-GREEN ledger review.
