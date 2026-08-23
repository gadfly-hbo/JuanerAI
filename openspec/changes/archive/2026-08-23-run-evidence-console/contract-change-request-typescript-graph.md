# Contract Change Request: REC-CONTRACT-002

## Summary

Permit this Change to extend the root strict TypeScript file graph with the exact approved Run & Evidence Console production and test files. Keep every compiler option, runtime mode, script, dependency, existing local-analysis path, and no-emit behavior unchanged.

## Current Contract

- Source: `openspec/specs/local-analysis/spec.md`, AC-XTS-001-01 and AC-XTS-002-03; root `tsconfig.json`.
- Meaning and behavior: the complete accepted Xanthil TypeScript graph contains exactly eight production and 13 test/helper files, and the root `tsconfig.json` selects exactly those 21 paths.

The current `tsconfig.json` confirms that closed list. None of the approved new `run-evidence-console` module or test paths can be added without changing this shared toolchain contract. Leaving the list unchanged would allow Node to execute new `.ts` files while `npm run typecheck` silently excludes them, which cannot satisfy the required strict evidence gate.

## Proposed Contract

- Meaning and behavior: preserve the existing 21-file local-analysis graph unchanged and add only the exact Run & Evidence Console production, test, fixture, helper, and contract-driver paths frozen by this Change at Spec Gate.
- Shape: keep the one root `tsconfig.json` and its explicit `files` array. Append the approved paths; do not switch to a glob or `include`, create an alternate project, or add a build/emission configuration.
- Failure semantics: `npm run typecheck` remains fail-fast strict no-emit checking. Any new Console `.ts` path absent from the frozen explicit list, any extra unapproved path, or any compiler-option/toolchain drift fails scope/validation. Existing local-analysis typecheck and runtime behavior remain unchanged.

## Reason and Evidence

The approved module boundary requires new native TypeScript production and test files. The root toolchain deliberately checks an explicit closed graph, so the only architecture-consistent choices are to extend that list or leave the new capability outside static verification. The latter conflicts with the current Definition of Done and the proposed Console AC-REC-007-03.

This request is narrower than a TypeScript strategy change. It reuses the current Node direct-runtime, one root strict no-emit project, exact dependency versions, import rules, and canonical validation entrypoint. The user approved the following exact appended paths on 2026-08-23:

```text
apps/console/xanthil-console.ts
packages/application/run-evidence-query.ts
packages/product-core/run-evidence.ts
packages/ports/run-evidence-reader.ts
adapters/storage-local/run-evidence-reader.ts
profiles/personal/console.ts
tests/unit/run-evidence-console/run-evidence.unit.test.ts
tests/contract/run-evidence-console/run-evidence-reader.contract.test.ts
tests/integration/run-evidence-console/run-evidence-reader.integration.test.ts
tests/e2e/run-evidence-console/xanthil-console.e2e.test.ts
tests/fixtures/run-evidence-console/run-evidence-fixtures.ts
tests/fixtures/run-evidence-console/run-evidence-reader-contract.ts
tests/fixtures/run-evidence-console/console-harness.ts
tests/fixtures/run-evidence-console/coverage-map.ts
```

No other path may be appended. The Test/Worker lifecycle task may append only these paths at its authorized step; this accepted request itself changes no toolchain file.

## Affected Domains

| Domain | Impact |
|---|---|
| product-governance | additive delta to AC-XTS-001-01 and AC-XTS-002-03 for this accepted capability only |
| root toolchain | append exact approved paths to `tsconfig.json`; no option, script, version, dependency, runtime, or emission change |
| local-analysis | existing 21 paths, contracts, namespaces, behavior, and evidence remain unchanged |
| run-evidence-console | every approved production/test/helper file becomes part of strict no-emit checking |

## Compatibility

- backward compatible: yes for existing local-analysis source, tests, runtime, public namespaces, and Artifacts.
- migration or backfill: none; this changes no product data or emitted artifact.
- activation: exact path inventory is frozen at Spec Gate, then Test establishes causal RED with the accepted `tsconfig.json` delta inside its allowed toolchain-test scope before production implementation.
- rollback: remove only the unactivated/retired Console paths from the explicit `files` array together with the Console modules; keep the original 21 entries unchanged.
- retirement: the Console paths leave the graph only when the capability is retired and its tracked files are removed under an approved Change.

## Validation

- positive: root `npm run typecheck` checks every existing local-analysis path and every exact approved Console production/test/helper path with the unchanged strict options and emits nothing.
- negative: omitting one approved Console path, adding an unapproved path, changing compiler options, adding a second config, or permitting emit fails the focused toolchain/scope evidence.
- integration: the canonical offline runner reaches the unchanged `npm run typecheck` phase and then the existing local-analysis regression; focused Console commands run the new tests without changing the runner's existing suite ownership.

## Controller Decision

- status: accepted
- rationale: the user explicitly approved `REC-CONTRACT-002` on 2026-08-23, limited to appending the exact listed Console production/test/helper paths later at the authorized Test/implementation step. The existing 21 entries, all compiler options, scripts, dependencies, no-emit behavior, and existing behavior remain frozen. The independent R2 Spec routing-floor condition was subsequently satisfied by the Controller's bounded Sol/high escalation.
