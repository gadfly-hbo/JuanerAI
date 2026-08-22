# Exploration

## Authorities Read

The exploration used the project constitution and terminology/orchestration documents, ADR 0002, the accepted current `local-analysis` spec, every architecture document, the Xanthil reuse and complexity-control baselines, the first-slice retrospective, testing/Done policy, model routing, current production/tests/fixtures, root npm metadata, Pi/TypeBox package declarations, and the canonical runner plus its self-test. Archived intermediate revisions were not used.

## Repository Baseline

- Branch: `work/macbook/xanthil-typescript-migration`
- Clean implementation baseline: `a0ab053`
- Pre-existing concurrent writes: Controller-owned `.juanerai/project-control/**`; excluded from this role and Change implementation.
- Canonical environment evidence: Node `26.0.0`, npm `11.12.1`, DuckDB `1.5.2`, Python `>=3.9`.
- Fresh baseline evidence supplied by the Controller: canonical runner exit `0`; Unit `250`, Contract `198`, Integration `243`, E2E `131` PASS plus one gated skip; project-board `12`; runner self-test `4/4`.

## Closed Xanthil Graph

### Production — 8 one-for-one renames

1. `packages/product-core/local-analysis.mjs` -> `.ts`
2. `packages/ports/local-analysis.mjs` -> `.ts`
3. `packages/application/local-analysis.mjs` -> `.ts`
4. `adapters/agent-pi/local-analysis.mjs` -> `.ts`
5. `adapters/analytics-duckdb/local-analysis.mjs` -> `.ts`
6. `adapters/storage-local/local-analysis.mjs` -> `.ts`
7. `profiles/personal/local-analysis.mjs` -> `.ts`
8. `apps/cli/xanthil.mjs` -> `.ts`

Dependency direction is unchanged: Application imports Core and Ports; the personal Profile composes Application and the three concrete Adapters; CLI calls Application; only the Pi Adapter imports Pi/TypeBox.

### Tests and helpers — 13 one-for-one renames

Executed tests:

1. `tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs` -> `.ts`
2. `tests/unit/xanthil-local-analysis/coverage-map.test.mjs` -> `.ts`
3. `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs` -> `.ts`
4. `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs` -> `.ts`
5. `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs` -> `.ts`

Fixtures/helpers:

6. `tests/fixtures/xanthil-local-analysis/cli-profile-harness.mjs` -> `.ts`
7. `tests/fixtures/xanthil-local-analysis/coverage-map.mjs` -> `.ts`
8. `tests/fixtures/xanthil-local-analysis/fixture-oracle.mjs` -> `.ts`
9. `tests/fixtures/xanthil-local-analysis/pi-sdk-failure-child.mjs` -> `.ts`
10. `tests/fixtures/xanthil-local-analysis/pi-sdk-failure-hook.mjs` -> `.ts`
11. `tests/fixtures/xanthil-local-analysis/pi-sdk-failure-sdk.mjs` -> `.ts`
12. `tests/fixtures/xanthil-local-analysis/port-contracts.mjs` -> `.ts`
13. `tests/fixtures/xanthil-local-analysis/public-seams.mjs` -> `.ts`

The CSV remains byte-identical. `tools/harness/validation/run.test.mjs` is a separate focused harness test and may remain `.mjs`.

## Current Contract Evidence

- Product Core owns runtime closed-object, fixture, metric, Finding, manifest, Evidence, security, terminal, reproduction, Markdown, and Proposal validation.
- Ports expose exactly the three accepted business capabilities and method sets named in `proposal.md`.
- Application owns orchestration, UUIDv7 attempt identity, confirmation, single semantic writing, admission, cancellation/deadline races, and terminal meaning.
- Concrete Adapters retain physical Pi, DuckDB/Python, and filesystem operations.
- TypeBox is used only inside the Pi Adapter for the Adapter-owned empty tool schema. Static TypeScript cannot replace these runtime checks.
- Pi `0.84.2` ships ESM JavaScript with declarations, its package uses TypeScript `5.9.3`, and declaration resolution is compatible with `.ts` specifiers. Pi types have no accepted consumer outside the Pi Adapter.

## Transitional Test Leaves

`TEST-XCLI-021` currently freezes the no-devDependency/no-tsconfig root contract. `TEST-XCLI-022` currently freezes `.mjs` test paths and absence of TypeScript. Those toolchain/mechanics expectations must change. Every other assertion in those test files, and every business/failure/security/cancellation/deadline/atomicity/provenance assertion in the full matrix, remains unchanged.

The stable Xanthil TEST identity set remains `TEST-XCLI-001` through `TEST-XCLI-022`; the accepted current AC identity set remains unchanged. The migration adds no business TEST or AC identity.

## Feasibility and Risks

- Native Node `.ts` execution is feasible in the approved canonical Node `26.0.0` environment without a loader or emitted files.
- Strict typing may reveal ambiguous inferred values. The permitted response is a type annotation or existing-runtime-contract type, not a runtime behavior correction. A semantic discrepancy is a stop line.
- The largest risk is accidental assertion or runtime drift during mechanical renames. Identity-set, assertion-count, public-namespace, contract, and full regression parity are therefore activation evidence.
- The root engine remains `>=22.19.0` by explicit approval; this Change does not redefine the canonical environment or widen the runtime matrix.

## Open Decisions

None. The file-count discrepancy was resolved by executable inventory: 21 files total, including the Unit coverage-map test.
