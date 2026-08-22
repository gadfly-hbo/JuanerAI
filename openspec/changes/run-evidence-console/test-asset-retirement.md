# Test Asset Retirement Gate: run-evidence-console

## Verdict

`HISTORICAL PASS — INVALIDATED BY THIRD VALIDATOR RETURN`

The Controller reconciled the complete test-asset diff after the second causal RED, repaired GREEN, REC-CONTRACT-003 regression, typecheck, and canonical validation. A later independent Validator found three missing Finding-content leaves, one incorrect permanent Profile checksum assertion, and incomplete nested/status-discriminated type guards. This PASS is retained as history but cannot authorize a new evidence freeze; Test Design and this Gate must be rerun after systematic correction and GREEN.

## Lifecycle Ledger

| Asset | Class | Evidence owner / consumer | Disposition |
|---|---|---|---|
| `tests/unit/run-evidence-console/run-evidence.unit.test.ts` | permanent regression | TEST-REC-001..003,010 | retain |
| `tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts` | permanent regression | TEST-REC-004 | retain |
| `tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts` | permanent regression | TEST-REC-005..008,010 | retain |
| `tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts` | permanent regression | TEST-REC-009 | retain |
| `tests/fixtures/run-evidence-console/run-evidence-fixtures.ts` | permanent regression | unit, integration, and E2E consumers | retain |
| `tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts` | permanent regression | unchanged TEST-REC-004 driver and double | retain |
| `tests/fixtures/run-evidence-console/console-harness.ts` | permanent regression | TEST-REC-009 process/HTTP lifecycle | retain |
| `tests/fixtures/run-evidence-console/coverage-map.ts` | permanent regression | TEST-REC-010 and Controller traceability/retirement audit | retain |
| `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` / TEST-XCLI-021 | permanent regression | exact accepted root TypeScript configuration, including REC-CONTRACT-003 correction | retain |

The duplicate exact-TypeScript-graph block was removed from TEST-REC-010 before repaired TDD_READY, reducing that test by 12 lines. Existing TEST-XCLI-021 is the retained successor: it preserves its prior assertions and exclusively verifies the accepted original 21 entries plus the exact 14 REC-CONTRACT-002 Console entries. No test asset file was removed.

## Ponytail Review

`Lean already. Ship.`

The previously approved cleanup removed the unused Console-harness callback and the duplicate TEST-REC-010 TypeScript-graph oracle. The current complete test diff contains no further duplicate behavior or unused asset: schema-shape and relationship-classification mutations, closed-type guards, manifest/identity/size atime probes, the contract driver, hostile-content loopback E2E, Artifact fixture helpers, coverage map, lifecycle ledger, and TEST-XCLI-021 each protect a distinct approved Requirement or Gate.

## Executable Evidence

Canonical command-local toolchain: Node `26.0.0`, npm `11.12.1`, DuckDB `1.5.2` through `JUANERAI_TOOLCHAIN_BIN`; only lockfile-pinned project packages were installed and no tracked/global toolchain state changed.

- Focused Console suite: `59/59` PASS (`12` top-level tests and `47` parameterized subtests).
- Root `npm run typecheck`: PASS.
- `tools/harness/validation/run`: PASS.
- REC-CONTRACT-003 successor TEST-XCLI-021: `1/1` PASS.
- All eight Console test/fixture/helper assets: `node --check` PASS.
- `git diff --check`: PASS.

## Historical Gate Decision

At this historical Gate, all retained assets had current consumers and distinct evidence purposes, and the removed TEST-REC-010 assertion had the passing TEST-XCLI-021 successor. The third Validator return invalidates the Gate because one permanent assertion contradicts the approved checksum contract and the named shape/type leaves are absent.
