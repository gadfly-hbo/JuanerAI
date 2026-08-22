# Test Plan

## Test Intent

Prove a zero-intentional-behavior-change cutover, not a second implementation of the accepted product suite. Existing tests remain the behavior oracle. Only the toolchain/path mechanics in `TEST-XCLI-021`, `TEST-XCLI-022`, and the existing canonical-runner self-test change.

## Role Isolation

The Test role owns the 13 Xanthil test/helper renames, strict test-side typing, production-derived type imports, the bounded negative-invocation helper, import/URL mechanics, the two approved mechanics leaves, and `tools/harness/validation/run.test.mjs`. Production, manifest, lock, config, and runner implementation remain frozen at `a0ab053` during Test Design and RED.

The Worker receives frozen test hashes and cannot change tests/helpers. Any test defect or cross-boundary ambiguity returns to Test Design or Spec; assertions are never weakened during implementation.

## Healthy Expected RED

After the Test role completes only its allowed write set:

1. Native Node syntax checks over all 13 migrated test/helper `.ts` files SHALL pass.
2. `node --test tests/unit/xanthil-local-analysis/coverage-map.test.ts` SHALL pass, proving the accepted AC map and renamed test-file references are coherent while production remains frozen.
3. The focused command

   `node --test --test-name-pattern='TEST-XCLI-021|TEST-XCLI-022' tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`

   SHALL fail against frozen production/toolchain because the exact dev dependencies, `tsconfig.json`, scripts, production `.ts` graph, and new validation mechanics are absent. The failure SHALL be caused by those missing approved mechanics, not a broken helper, missing canonical environment, altered business assertion, or model/provider call.
4. The updated runner self-test SHALL expose the missing runner order/typecheck/native-`.ts` behavior against the frozen runner while its fixture command health is independently GREEN.
5. An isolated `/private/tmp` scratch SHALL mechanically copy the real production modules and 13 migrated test/helper files, then compile with the exact approved TypeScript/Node-types versions. `@ts-nocheck` is permitted only on the scratch production copies so their intentionally missing production diagnostics do not mask test diagnostics; the copied modules' actual signatures and inference are non-authoritative diagnostic scaffolding. The isolated test-side check SHALL exit zero with no diagnostic attributable to a test/helper file, and all scratch files SHALL be discarded. No repository production or test file receives a suppression, and only the final post-Worker strict 21-file typecheck establishes authoritative GREEN.

Native syntax/coverage health plus the causal missing-production/toolchain RED are valid Test health even though the final strict 21-file typecheck cannot be GREEN before Worker supplies the production-owned interfaces. TDD_READY additionally requires the isolated test-side type-health proof above. The Test role freezes exact commands, hashes, observed causal failures, scratch assumptions, identity sets, and expected assertion counts before TDD_READY.

## GREEN Matrix

| Evidence | Command/observation | Required result |
|---|---|---|
| exact toolchain leaves | focused `TEST-XCLI-021|TEST-XCLI-022` command | PASS |
| native syntax | canonical runner syntax phase | all retained `.mjs` and Xanthil `.ts` pass |
| strict static checking | `npm run typecheck` | exit 0, no emit |
| Unit | `node --test tests/unit/xanthil-local-analysis/*.test.ts` | baseline assertion count `250` |
| Contract | `node --test tests/contract/xanthil-local-analysis/*.test.ts` | baseline assertion count `198`; every accepted Adapter contract unchanged |
| Integration | `node --test tests/integration/xanthil-local-analysis/*.test.ts` | baseline assertion count `243` |
| E2E | `node --test tests/e2e/xanthil-local-analysis/*.test.ts` with gate removed | baseline `131` PASS plus one gated skip; no provider call |
| project board | existing two `.mjs` project-board tests | baseline `12`, unchanged |
| canonical offline regression | `tools/harness/validation/run` and `npm test` | both exit 0 and represent the same runner |
| runner contract | `node --test tools/harness/validation/run.test.mjs` | `CVR-TEST-001..004` all PASS |

Counts are frozen baseline evidence and SHALL change only if the Test role proves that TypeScript/native Node changes TAP accounting without changing the underlying assertion/test identity set; such a discrepancy is a stop line for Controller review, not an automatic exception.

## Parity and Negative Evidence

- Extract and compare the exact `TEST-XCLI-001..022` identity set before and after; no identity is added, removed, or renamed.
- Extract and compare the accepted `AC-XCLI-*` identity set and coverage-map resolution; no accepted AC changes.
- Compare runtime `Object.keys()` for all eight public seams to the exact namespaces in `proposal.md`.
- Preserve all mutation leaves for invalid contracts, forbidden tools/egress, Pi failures, source mutation, Artifact collisions/faults, cancellation/deadline races, terminal immutability, and no-retry behavior.
- Prove TypeBox/runtime validators still reject invalid runtime data and no static type replaces a trust-boundary check.
- Prove trust-entry inputs admit `unknown` and refine internally, while admitted operational Port methods remain strongly typed.
- Prove tests import or derive production contracts and repository production/tests contain no duplicated business interface, `any`, suppression directive, or broad assertion cast; the sole narrow conversion matches the owner and consumers in `design.md`, and any scratch-only production `@ts-nocheck` is absent from the repository.
- Prove Pi imports/types appear only in the Pi Adapter and Pi SDK package declarations/node_modules.
- Prove no Xanthil `.mjs`, `.js`, `dist`, `build`, emitted declaration, source map, loader, or compatibility wrapper remains or is created.
- Prove the CSV SHA-256 and bytes are unchanged.
- Prove the runner unsets the real-model gate and no real Pi/model/provider call occurs.
- Prove the diff is confined to the role-specific allowed paths.

## Final Independent Verification

A fresh read-only Validator reruns the focused leaves, typecheck, four layers, canonical offline runner, and runner self-test; inspects public namespaces, Pi type confinement, file/artifact absence, traceability, path scope, frozen hashes, and rollback feasibility; and returns PASS, FAIL, or BLOCKED.
