# TASK-006 Test Correction 002 — Final Complete Runtime-Value Evidence

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: Controller PASS on the runtime-value revised Spec Gate after second-return Test self-audit

## Objective and finality

Perform one consolidated final Test correction in the same frozen test ownership. Replace causally invalid fixtures/assertions and encode every runtime-value clause now made exact by Design. This is a replanned work unit after Controller/Spec resolution, not permission for an open-ended repair loop. Failure or another substantive omission returns `REPLAN_BLOCKED_TASK_006`; do not silently add another run.

## Allowed paths

Only:

- `tests/fixtures/xanthil-local-analysis/**`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

Production, OpenSpec, manifests/lock/dependencies, board, global Pi/config/credentials, and every other path are frozen. Preserve all accepted upstream tests and all still-causal TASK-006 leaves. Real TEST-XCLI-013 remains excluded.

## Mandatory correction matrix

### Complete Application values

- Replace every minimal succeeded, failed, and cancelled run fixture with a complete Product-Core-valid terminal Run Manifest built from the existing authoritative test fixtures.
- Positive success/failed/cancelled arms assert exact full run equality, exact emitted terminal mapping, and exact returned arm.
- Add independently registered mutations for null/primitive/non-plain, missing/extra field, wrong version/status/run ID/source/checksum/artifact/evidence/terminal detail, success metrics/Finding mismatch, and in-progress/non-terminal results. Each must reject exactly `CLI_APPLICATION_INVALID`, emit no success, and cause no later read/Application call.
- Add invalid `discover()` proposal mutations covering the same closed/frozen semantic proposal validator sufficiently to prove missing/extra/wrong values fail `CLI_APPLICATION_INVALID` before proposal/awaiting/confirm output.

### Clone/freeze ownership

- CLI-created output events and resolved values, including all nested exposed values, are referentially distinct recursively frozen deep clones.
- Original caller and Application proposal/run/metrics/finding values remain referentially unchanged, deep-equal, unfrozen when supplied unfrozen, and unmutated. Do not require the producer to pre-freeze them and do not assert identity preservation across the CLI boundary.
- The canonical CLI-owned source descriptor passed to `application.start` is exact, closed, and frozen; caller fields cannot override it.

### Input and envelope closure

- `next()` resolves directly to Event. `{value,done}` or any IteratorResult wrapper, null/primitive/non-plain event, synchronous return/throw, rejected Promise, malformed/extra/unfrozen event, second iterator, duplicate/late event, and first-event EOF/interrupt each have the exact frozen code/effect behavior.
- Close outer, input, output, and Application/handle plain-object boundaries for own string/symbol, inherited, null-prototype, missing, extra, and non-callable surfaces. Replace every disjunctive `A || B` assertion with the single Design-selected code.

### Application errors and writer stages

- Independently cover recognized start/discover preflight errors, no-run `RUN_COLLISION`, recognized post-confirmation stage/code, and unknown/malformed/raw start/discover/confirm causes. Assert the identical sanitized terminal/result pair and no raw leakage.
- For writer throw and scalar/Promise return, independently inject failure at `ready`, `proposal`, `awaiting_confirmation`, `progress`, and terminal. Assert exact `OUTPUT_WRITE_FAILED`, no later event/read/Application call, and no compensation/mutation of any already completed run. Invalid writer surface is instead exact pre-effect `CLI_OUTPUT_INVALID`.
- Preserve confirmation-winning input cessation and EOF/interrupt-winning late-success discard evidence.

### Profile/example completion

- Preserve public Profile `application.start` plus pre-Discovery cancel evidence and exact root/config mutations.
- Add only remaining frozen/plain/symbol closure for the composed `{application}` and `application` public surface where observable without inspection APIs.
- Preserve the sole canonical CSV inventory/bytes/oracle proof without new example artifacts.

## Validation budget

- Any number of `node --check` runs on changed test/helper `.mjs` files.
- Exactly one helper-health run after all helpers/fixtures are frozen.
- Exactly one complete focused `^TASK-006` expected RED after static inventory; no partial final, retry, production target, full suite, install, or second final command.

Return changed paths/hashes, replaced/new leaf inventory, exact test counts and seam split, negative-effect evidence, and `TDD_READY_TASK_006_CORRECTION_002` or `REPLAN_BLOCKED_TASK_006`. Do not start Worker or Validator.
