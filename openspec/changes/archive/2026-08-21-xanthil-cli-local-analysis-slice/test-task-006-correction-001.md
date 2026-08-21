# TASK-006 Test Correction 001 — Executable Closure and Real Composition Behavior

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: Controller semantic review of the initial `64`-leaf TASK-006 expected RED

## Objective

Preserve the healthy missing-seam RED and close the remaining executable gaps before any Worker dispatch. The correction must prove the frozen public contracts causally; titles, key-name inspection, or missing-module counts alone are insufficient.

## Ownership

Allowed writes remain exactly:

- `tests/fixtures/xanthil-local-analysis/**`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

All production, OpenSpec except this Controller-owned brief/verification record, manifests/lock/dependencies, board, credentials, global Pi, and other paths are frozen. Preserve all initial TASK-006 leaves and every accepted upstream assertion. TEST-XCLI-013 real provider activation remains excluded.

## Required corrections

### CLI protocol closure

Add independent top-level leaves and effect assertions for the Design clauses not executable in the initial package:

- the second `Symbol.asyncIterator` request fails closed and does not repeat Application work;
- iterator surface missing/extra/non-callable `next`, synchronous `next` result, synchronous throw, unknown symbol/config, and non-frozen event each map to the exact boundary failure before unapproved effects;
- at least the non-question terminal event variants reject extra fields, and duplicate/late terminal input is not consumed or allowed to cause a second cancel/write;
- exact `ready`, complete frozen `proposal`, `awaiting_confirmation`, `progress`, and terminal values are closed/frozen and appear in causal order;
- every resolved success/failure/cancellation value asserted in this package is a frozen closed value, not merely deep-equal content;
- a scalar non-`undefined` writer result maps exactly to `OUTPUT_WRITE_FAILED`; a malformed output surface maps exactly to `CLI_OUTPUT_INVALID` without accepting either code as equivalent;
- when confirmation settles first, CLI stops reading input; when EOF/interrupt wins, the existing late-success discard evidence remains authoritative.

Expand the Application-handle matrix sufficiently to prove exact callable `discover`, `confirm`, and `cancel` with no missing, non-callable, extra, inherited, or symbol surface accepted. Avoid redundant representatives only when one exact validator path is genuinely identical and the effect assertions prove it.

### Personal Profile behavior

The positive Profile leaf must call the public composed `application.start` with the exact approved question/source, receive the exact closed handle, and cancel it before Discovery so no real Pi prompt/provider/model call or run allocation occurs. Assert no source-row, run/artifact, credential/session-file, provider/network, cwd/home/environment, or output effect in this pre-prompt path to the degree observable through approved public/filesystem guards. This public behavior, together with the unchanged concrete Adapter contract suites, is the approved evidence for real composition; do not add inspection exports or dependency injection.

Also add the missing non-directory root cases and any plain/inherited/symbol configuration cases required by the exact Profile envelope. Keep every filesystem effect inside test-owned temporary roots and clean only those roots.

## Validation budget

- Any number of syntax checks on changed test/helper `.mjs` files.
- At most two new helper-health executions if the helper changes.
- Exactly one new complete `^TASK-006` focused RED after static leaf inventory is frozen; no partial final, retry, production run, full suite, install, or second final run.

Return exact leaf inventory and pass/fail/cancelled/skipped/todo counts, missing-seam split, effect evidence, changed paths/hashes, and `TDD_READY_TASK_006_CORRECTION_001` or a genuine `TEST_CONFLICT_TASK_006`. Do not start Worker or Validator.
