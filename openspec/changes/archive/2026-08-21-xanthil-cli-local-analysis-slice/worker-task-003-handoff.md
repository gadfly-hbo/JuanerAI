# TASK-003 Worker Handoff

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

This is the complete immutable implementation contract for TASK-003. The corrected focused RED has been accepted by the Controller. Do not broaden behavior, edit tests, add dependencies, or run another target. A contradiction or missing approved contract returns the stop signal named below.

## Authority and Preconditions

- Spec Gate: PASS.
- TASK-002 Product Core: Controller ACCEPTED; independent unit regression is `118/118` PASS.
- TASK-003 helper health: `2/2` PASS across the focused helper checks.
- TASK-003 expected RED: `81/81` focused leaves fail only because the two authorized public modules do not yet exist: `packages/ports/local-analysis.mjs` and `packages/application/local-analysis.mjs`.
- Approved model identity is exactly `{provider:'xiaomi-token-plan-cn',model_id:'mimo-v2.5-pro'}`. No ambient or fallback model is allowed.

## Ownership

- Allowed writes only:
  - `packages/ports/local-analysis.mjs`
  - `packages/application/local-analysis.mjs`
- Conditional writes: none.
- Forbidden: every other path, including tests/fixtures, Product Core, contracts, Adapters, CLI, profiles, root manifests/lockfiles, dependencies, OpenSpec, project-control, and documentation.
- You are not alone in the repository. Preserve all existing work and do not revert or rewrite files outside the two owned paths.

## Required Public Surface

`packages/ports/local-analysis.mjs` exports exactly:

- `defineAgentAnalysisRuntime(implementation)`
- `defineLocalAnalysisExecution(implementation)`
- `defineRunArtifactStore(implementation)`

Each definer accepts only the exact business methods frozen in `design.md`, rejects missing/extra/non-function members, returns a frozen closed implementation object, and imports no infrastructure SDK.

`packages/application/local-analysis.mjs` exports exactly:

- `createLocalAnalysisApplication(dependencies)`

The returned instance exposes only `start({question,source})`. The start handle exposes only `discover()`, `confirm(proposal)`, and idempotent `cancel()`.

## Closed Application Dependency Contract

The dependency object contains exactly `agentRuntime`, `localAnalysisExecution`, `runArtifactStore`, `model`, and `clock`. Validate and close it before use. `model` is exactly the approved `{provider,model_id}` value above; missing, null, unknown-field, ambient-provider, or wrong-model configurations fail before `openSession` or run allocation. `clock` is the injected time source; do not read environment configuration or add a fallback model.

Application and Ports may import Node built-ins and `packages/product-core/local-analysis.mjs`; they must not import Pi, DuckDB, Python, filesystem, database, network, process environment, TypeBox, or Adapter types.

## Execution Protocol

1. Preflight validates the exact start input and canonical fixture descriptor before opening a runtime session. Traversal, absolute paths, hash/version changes, and unknown source fields fail with no runtime, Analysis, Artifact, or row-read effects.
2. `openSession` receives explicit `model`, `discovery_tools=[]`, and exactly three ordered, frozen, closed descriptors `{tool_name,invoke}` for:
   - `profile_approved_fixture`
   - `calculate_member_repurchase_metrics`
   - `validate_member_repurchase_metrics`
3. `discover()` calls the same session and accepts only the complete closed approved proposal. It creates no run or analytical/artifact effect.
4. `confirm(proposal)` requires exact equality to the discovered closed proposal. Reject edits, omissions, unknown fields, repeated confirmation, cancellation, or confirmation without successful Discovery.
5. On confirmation, generate one fresh real UUIDv7 attempt ID using Node crypto plus the injected clock. The ID must be fresh across attempts and consistent through one attempt. On collision, fail closed after the first allocation; do not retry.
6. Persist the confirmed contract constructed from the frozen proposal snapshot plus `run_id` and `confirmed_at`; exclude transient `fixture` display metadata.
7. Call `session.execute` exactly with `{confirmed_contract,cancellation_signal,deadline_seconds:300}`. During that same runtime turn, the runtime invokes the three descriptors in the exact order above.
8. Each `invoke` accepts exactly `{correlation_id,arguments:{}}`. Require a non-empty, run-local unique correlation ID. Reject malformed, unknown-argument, duplicate, early, out-of-order, late, and post-terminal calls before an unapproved Analysis or Artifact operation.
9. The profile callback calls `profileApprovedFixture` and returns only its verified closed bounded result.
10. The calculate callback calls `calculateMemberRepurchaseMetrics` with the approved source, run/contract, the shared signal, and exact `deadline_seconds:30`. It validates exact `{result,canonical_asset}`, appends unchanged Q-001, derives/appends canonical JSON O-001 from verified result, and returns only result to the runtime.
11. The validate callback uses the verified SQL result and calls `validateMemberRepurchaseMetrics` with the same signal and exact 30-second budget. It validates exact `{result,canonical_asset}`, enforces SQL/Python business equivalence except `calculation_kind`, appends unchanged S-001, derives/appends O-002, and returns only result.
12. Canonical assets are closed `{artifact_id,category,path,media_type,bytes}` values. Enforce exact Q-001 `query/queries/Q-001.sql/application/sql` and S-001 `script/scripts/S-001.py/text/plain`; bytes are non-empty `Uint8Array`. Canonical bytes never reach or originate from the model.
13. Runtime output is exactly `{actual_model,finding}`. Validate the actual model against the approved explicit identity and validate the closed Finding via Product Core. Reject invalid/extra output before success.
14. Build validated Evidence, summary Markdown, and evidence Markdown using Product Core rules; finalize with the Artifact Port. `commitSuccess` is the last writer operation and happens exactly once only after all prior validation and writes succeed.

## Lifecycle, Cancellation, and Failure

- Use one shared `AbortSignal` for `session.execute` and both analytical calls.
- `cancel()` is idempotent before and after confirmation. It closes descriptor admission, aborts once, calls session cancel once, rejects late runtime/callback output, and after run creation writes exactly one safe `cancelled` terminal manifest with `{stage}` and no `error_code`, evidence, or success claim.
- Enforce the 300-second post-confirmation budget with the injected clock without real waiting. Keep exact 30-second budgets on the two analytical calls.
- No retries anywhere, including UUID collision, runtime, Analysis, Artifact, deadline, or cancellation paths.
- Preserve the stable test-frozen mappings for runtime/model, source read, SQL, Python, validation, timeout, and Artifact finalization failures. Failed terminal state contains exact `{stage,error_code}` and never claims success/evidence.
- Terminal state is immutable. No Analysis, Artifact append, runtime output acceptance, or success occurs after cancellation/failure/success.

## Implementation Discipline

- Use Product Core as the authority for closed proposal, aggregate result, Finding, Evidence, lifecycle, and Markdown validation. Do not duplicate a caller-independent metric oracle as a substitute for validating Port results.
- Do not add public compatibility fields, defaults, retries, generic tools, test flags, fault injection, `verify*Contract`, `inspect*Surface`, or test-only exports.
- Do not leak Pi SDK call IDs, schemas, messages, provider objects, or tool-definition types into Ports/Application.
- Do not hard-code a fixed UUID. Do not use `Math.random()`.

## Validation Budget

Read-only inspection plus the following commands are authorized:

- Syntax/static checks, any number, limited to the two owned files:
  - `node --check packages/ports/local-analysis.mjs`
  - `node --check packages/application/local-analysis.mjs`
  - `rg` limited to those two files
- Final focused GREEN command, maximum **one** Worker execution:
  - `node --test --test-name-pattern='^TASK-003' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Unit, full contract/integration/E2E, install, build, network, model-call, and equivalent retry commands are forbidden. If the single focused command fails, stop immediately and return `REVISION_SCOPE_ESCALATION` with the exact failure; do not edit tests or rerun.

## Acceptance Evidence

- Both syntax checks PASS.
- The sole focused execution is `81/81` PASS with zero fail, cancelled, skipped, or todo; report command count `1/1`.
- Static scan confirms only the approved exports/import directions and no SDK, environment, filesystem, test-only, or dependency leakage.
- Handoff maps protocol, lifecycle, UUIDv7, model, validation, asset ordering, cancellation/deadline, and error behavior to source locations.
- Changed-path evidence contains only the two allowed files.

## Stop Signals

- Spec/test contradiction: `TEST_CONFLICT`.
- Need for any new field, public API, path, dependency, Adapter behavior, manifest, test change, or second target execution: `REVISION_SCOPE_ESCALATION`.
- Do not start TASK-004. Controller must independently inspect and accept TASK-003 first.
