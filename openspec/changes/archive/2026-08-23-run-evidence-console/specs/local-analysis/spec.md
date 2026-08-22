# Delta: local-analysis

## Modified Requirement: REQ-XCLI-016 — Activation, Compatibility, Rollback, and Retirement

### Modified Acceptance Criteria

- **AC-XCLI-016-04:** Session resume, run list/delete/repair, retention automation, real data, additional formats, Web Research, Workflows, Desktop, enterprise behavior, SQLite, Trace Platform, Ontology, Knowledge, Memory, Domain Packs, Model Packs, Decisions, recommendations, or Actions remain unavailable. A separately approved `run-evidence-console` capability MAY provide a read-only consumer of existing immutable local-analysis Artifact `1.0` Runs; it does not alter any local-analysis producer behavior, Artifact format, current Port, Runtime, Profile, or CLI contract.

## Rationale

This is the exact accepted `REC-CONTRACT-001` delta. No other local-analysis behavior is changed.

## Modified Requirement: REQ-XTS-001 — Closed Native TypeScript Graph

### Modified Acceptance Criteria

- **AC-XTS-001-01:** The graph preserves exactly the original eight production and 13 test/helper `.ts` paths enumerated in the accepted baseline, and adds only these 14 Run & Evidence Console `.ts` paths: `apps/console/xanthil-console.ts`; `packages/application/run-evidence-query.ts`; `packages/product-core/run-evidence.ts`; `packages/ports/run-evidence-reader.ts`; `adapters/storage-local/run-evidence-reader.ts`; `profiles/personal/console.ts`; `tests/unit/run-evidence-console/run-evidence.unit.test.ts`; `tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts`; `tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts`; `tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts`; `tests/fixtures/run-evidence-console/run-evidence-fixtures.ts`; `tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts`; `tests/fixtures/run-evidence-console/console-harness.ts`; and `tests/fixtures/run-evidence-console/coverage-map.ts`. The original local-analysis former `.mjs` paths remain absent; no new Console `.mjs` owner or other Xanthil `.mjs` owner exists; and the CSV and separate runner self-test `.mjs` are not renamed.

## Modified Requirement: REQ-XTS-002 — Exact Strict No-Emit Toolchain

### Modified Acceptance Criteria

- **AC-XTS-002-03:** The one root `tsconfig.json` preserves exactly its accepted strict options and original explicit 21 `files` entries, then appends only the 14 Console paths named in this Change's modified AC-XTS-001-01. It has no glob or `include`, bridge, skip-lib, emit, lint-like, extend, reference, or alternate-project option.

## Additional Rationale

This is the exact accepted `REC-CONTRACT-002` delta. It authorizes neither a toolchain option change nor any path outside the stated 14-path inventory.
