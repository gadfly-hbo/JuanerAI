# Test Plan

## Frozen Asset and Mapping

No test asset changes. `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`, existing leaf `TASK-010 R3 TEST-XCLI-008 [AC-XCLI-001-01, AC-XCLI-007-01] maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing`, is the permanent regression asset.

| AC | Existing TEST | Positive / negative observable proof |
|---|---|---|
| AC-RRIF-001-01 | TEST-XCLI-008 | An unchanged valid root preflights with the existing frozen `{ready:true}` result. |
| AC-RRIF-001-02 | TEST-XCLI-008 | Delete then immediately recreate the same configured pathname; `preflightRunRoot()` rejects `RUN_ROOT_UNSAFE`, and recreated directory remains empty. Existing missing/symlink/non-directory subcases stay GREEN and prove no write. |
| AC-RRIF-001-03 | TEST-XCLI-008 plus public-surface/persistence scope review | No Port/Store lifecycle member, persistent root record, marker, retry, or Artifact format change is present. |

## Causal RED and GREEN

The uncorrected Adapter is expected to fail only the `replaced` subcase of this existing leaf on clean GitHub-hosted Ubuntu because the original unpinned inode can be reused. The supplied PR #4 run `32575185495`, job `97036374334`, recorded integration `242/243`, missing expected rejection at integration line `2303` / assertion `2317`; it is causal R2 evidence. A local full canonical pass is allocation-dependent regression evidence, not a replacement for this RED.

Focused commands must be frozen by Test before TDD_READY. At minimum they name the exact leaf through the project-approved Node test invocation and the affected existing Artifact Port contract command. `tools/harness/validation/run` is the required canonical offline regression command. No model invocation is allowed.

## Test-asset retirement ledger

`TEST-XCLI-008`: permanent regression; protects unsafe-root replacement and zero-write boundary; retained unchanged. No new, changed, or retired test/fixture/helper/double/snapshot/coverage/harness asset exists, so the Test Asset Retirement Gate records no test-asset diff while retaining this causal asset.
