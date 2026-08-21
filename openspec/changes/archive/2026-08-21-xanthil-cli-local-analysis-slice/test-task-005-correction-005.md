# TASK-005 Test Correction 005 — Opaque Facade Observability

Date: 2026-08-20  
Trigger: Controller observability audit after `TDD_READY_TASK_005_REVISION_001` candidate (`92 / 75 pass / 17 RED`)  
Authority: approved Design facade surface and independent read-only Spec/Test causal review

## Decision

Five remaining RED leaves contain assertions that require reflection, source inspection, raw-error parsing, or knowledge hidden inside the opaque facade. Correct these test oracles before Worker Revision 001. This is not a product or Design change. The Adapter must continue to validate the approved closed facade and sanitize every failure.

## Exact Corrections

### 1. Non-function unsubscribe rejects before prompt and cleans up

`subscribe(listener)` exposes its return value synchronously. If it is not a function, the Adapter must fail with `PROTOCOL_FAILURE` before `setActiveTools` or `prompt`.

Refactor only the existing `non-function unsubscribe return` leaf so it accepts rejection at `openSession` or at the start of Discovery, but proves the rejection is before the prompt. It must assert exact effects:

- `factory:1`
- `subscribe:1`
- `setActiveTools:0`
- `prompt:0`
- `getActualModel:0`
- `unsubscribe:0` because there is no callable unsubscribe
- `abort:1`
- `waitForIdle:1`
- `dispose:1`

No SDK facade may remain live after the invalid construction result.

### 2. Sync-prompt mutation must actually violate the Promise result surface

The current wrapper is a normal function that returns the underlying Promise unchanged; it is observationally equivalent to an `async` declaration and is valid. Change only that fixture mutation so the wrapper invokes the underlying prompt once but returns a frozen plain `{settled:true}` object synchronously instead of its Promise. The leaf retains `PROTOCOL_FAILURE` and its cleanup/effect-count expectations. The Adapter must validate the returned value's Promise behavior, not `constructor.name`, function source, prototype, or identity.

### 3–4. Opaque wrapper rejection maps as ordinary prompt failure

For the current `listener non-undefined return` and `listener throw` mutations, the Adapter-owned listener itself returns `undefined` and does not throw. A private facade wrapper then returns non-undefined or throws a raw cause, so the only Adapter-visible signal is `prompt` rejection. Change only these two leaves' expected code from `PROTOCOL_FAILURE` to sanitized `MODEL_EXECUTION_FAILED` and retain all cleanup/effect assertions.

The happy deterministic lifecycle remains the evidence that the Adapter listener returns `undefined`. Malformed listener input remains covered by the independent invalid-event/terminal/tool leaves. Do not add a marker, parse error text, inspect causes, or expose a new seam.

### 5. Raw-prompt ledger counts the wrapped underlying call, not Adapter invocation

The `prompt-raw-rejection` wrapper throws before calling the underlying deterministic facade, so its ledger correctly records `prompt:0` even though the Adapter invoked the wrapper. Change only this leaf's expected prompt effect count from `1` to `0`. Retain `MODEL_EXECUTION_FAILED` and the required `unsubscribe:1`, `abort:1`, `waitForIdle:1`, `dispose:1` quiescence counts.

## Role and Scope

Use the existing independent Test correction role. Allowed writes only:

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`

Production, integration tests, Spec/Design/Tasks/Test Plan, manifests, dependencies, board, and all other paths are frozen. Preserve exactly 92 top-level TASK-005 leaves; no skip/todo/only, conditional suppression, renamed-out pattern, test-only production API, raw-error discriminator, or Adapter edit.

## Proof Budget

Before execution, statically report the exact five corrections and verify the production Adapter SHA-256 is unchanged from `47773e4b8e724a393b40685ecdba4df3a6301e46c475970658859a9dac4df614`.

Allowed:

- syntax checks on the two owned test files;
- no helper or partial target;
- one full focused command:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Return exact counts and the complete remaining production RED inventory. Expected direction is that the two opaque-wrapper leaves become GREEN, while non-function unsubscribe, true sync result, and raw-prompt quiescence remain RED until implementation is corrected. Zero cancelled/skipped/todo is mandatory. Stop without post-run edits or reruns.

Return `TDD_READY_TASK_005_REVISION_001_FINAL` only if every remaining RED is an observable production gap; otherwise return `TEST_CONFLICT_TASK_005_CORRECTION_005` with the exact new conflict.
