# Test handoff — Revision 002 TDD_READY

Revision 001 is superseded. Controller Spec Gate remains PASS. Risk remains R2; the Test routing floor is Terra-high, but the configured `juaner_test` role is fixed Terra-medium. This constraint is recorded, not waived; Controller Sol-xhigh must review the frozen evidence.

## Frozen assets and map

- Test path: `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
- Pre-test SHA-256: `f94895a0a55a2886cc26bce4aad4c2a912bc7242ebf8ccf0ad4a280e828c6723`
- Revision-002 test SHA-256: `14acd3cfd279453a900a65b82be9291eee41a0cac44470388d0d89be9e3821f2`
- Current Adapter SHA-256: `b846c6b6c20535f156ff699c3666d9768984ec23705f4d939032935efa1f654b`

| AC | Permanent TEST-XCLI-008 evidence |
| --- | --- |
| AC-RRIF-001-01 | New mode-`0300` leaf proves a test-owned root is owner-write/searchable by known-file write/remove, then requires factory + frozen `{ ready: true }` preflight. It restores `0700` in `finally`. |
| AC-RRIF-001-02 | Existing unsafe-root leaf remains. New isolated Node 26 child replaces the root synchronously on the second configured-path `lstatSync`; it requires exact `RUN_ROOT_UNSAFE` and an empty recreated root. |
| AC-RRIF-001-03 | The complementary child calls the real second `openSync`, then synchronously replaces the pathname and returns that original fd. It requires frozen `{ ready: true }`; the affected 198-test Artifact Port contract suite guards public surface. |

The child is inline test-private code. It runs from the repository cwd in a fresh Node 26 process with `--experimental-test-module-mocks`, mocks only the Adapter's required `node:fs` bindings, and delegates each non-intercepted operation to Node's actual filesystem implementation. It uses no production seam, polling, sleep, retry, fixture, helper, or standalone tracked file. `--no-warnings` suppresses only Node's experimental warning so a future healthy child can retain its exact `stderr === ''` assertion.

## Frozen commands and causal RED

Canonical local toolchain: Node `v26.0.0`, npm `11.12.1`, DuckDB `v1.5.2`.

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin node --test --test-name-pattern='AC-RRIF-001' tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts
```

Current result: exit 1; tests 2, pass 0, fail 2.

1. Mode `0300`: the known-file write/remove succeeds, proving test fixture permission health; the current `O_RDONLY` construction then rejects exactly `ARTIFACT_WRITE_FAILED`. This is missing compatibility behavior, not a permission or fixture failure.
2. Linearization child: both synchronous interception boundaries execute. Before live acquisition: `lstatCalls=2`, `mutations=1`, recreated root is empty, but preflight resolves instead of returning `RUN_ROOT_UNSAFE` (`outcome` is `undefined`). After live acquisition: `lstatCalls=2`, but `openCalls=1` rather than required `2`, so the second live acquisition and its mutation boundary cannot occur. Both failures are caused by missing Adapter behavior.

The child freezes `openCalls=2` for both cases: construction pins one descriptor and compliant preflight performs the second live acquisition. It freezes `mutations=1` in both cases. The before case asserts exact error before its open-count assertion, so its causal failure reports missing `RUN_ROOT_UNSAFE` first.

Healthy unchanged boundaries:

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin node --test --test-name-pattern='maps per-start missing, replaced, symlink, and non-directory run roots to RUN_ROOT_UNSAFE without writing' tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin node --test tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts
```

Actual results: existing unsafe-root leaf exit 0, 1/1 pass; Artifact Port contract exit 0, 198/198 pass. No real model, network data, or credential was used.

## Test Asset Retirement initial ledger

| Asset | Class | Evidence owner / purpose | Disposition |
| --- | --- | --- | --- |
| Existing unsafe-root TEST-XCLI-008 leaf | permanent regression | existing missing/replaced/symlink/non-directory and zero-write boundary | retain |
| Mode-`0300` TEST-XCLI-008 leaf | permanent compatibility regression | AC-RRIF-001-01 | retain |
| Inline child module-mock code and linearization leaf | permanent test-private regression | AC-RRIF-001-02..03 and real Adapter linearization boundaries | retain inline |

No test asset is retired. `git diff --check` passes and the only test diff is the authorized integration file. The post-GREEN Controller Test Asset Retirement Gate must reconcile this ledger and perform its required simplification review.

## Frozen Worker brief

Production write remains restricted to `adapters/storage-local/local-analysis.ts`. Do not change tests, fixtures, helpers, harnesses, workflows, Ports, Profiles, contracts, packages, or project-control. Run the focused Revision-002 command and 198-test Artifact Port contract command after implementation. Any request to change the test boundary, public contract, workflow, or make a second remote proof is `SCOPE_ESCALATION` / Controller review.
