# TASK-005 Worker Handoff — Pi Agent Runtime Adapter

Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK_005_CORRECTION_002` accepted by Controller  
Route: R2/complex, fresh `juaner_worker`, `gpt-5.6-terra` high

## Objective

Implement the minimum Pi-backed Agent Analysis Runtime Adapter required by the approved Spec and Design. Keep all Pi SDK values and lifecycle behavior inside the Adapter. Make the frozen TASK-005 Adapter tests GREEN without changing any test, contract, manifest, dependency, Profile, Application, or Product Core file.

This is implementation work under the approved Change and the standing delegation authority in `AGENTS.md`. It does not authorize a real provider prompt, credential read, model call, network access, or activation of TASK-006/TASK-009.

## Ownership and Stop Line

Allowed writes only:

- `adapters/agent-pi/local-analysis.mjs`

The containing directory may be created if absent. Conditional writes: none.

Forbidden writes include every other path, specifically:

- `tests/**`, fixtures, helpers, snapshots, and assertions;
- `packages/**`, `apps/**`, `profiles/**`, other `adapters/**`;
- `openspec/**`, `.juanerai/**`, documentation, examples, source data;
- `package.json`, `package-lock.json`, `node_modules/**`, npm configuration;
- global Pi configuration, credentials, environment files, session files, and user directories.

You are not alone in the repository. Preserve all existing work and do not revert or normalize unrelated files. Tests are frozen executable constraints; approved Spec and Design remain authoritative. Return `CONTRACT_DRIFT_TASK_005` for a real contradiction, not for implementation difficulty.

## Required Reading Before Code

Read completely:

- `AGENTS.md`
- `.codex/agents/juaner_worker.toml`
- `Orchestration.md`
- `docs/governance/agent-model-routing.md`
- `.ai-coding/policies/testing.md`
- `.ai-coding/definition-of-done.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/specs/local-analysis/spec.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/design.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/tasks.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-plan.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-task-005-replan-001.md`
- `openspec/changes/xanthil-cli-local-analysis-slice/test-task-005-correction-002.md`
- the frozen TASK-005 fixture, contract, and integration tests;
- only the project-local Pi/TypeBox package source and declarations needed for this Adapter.

Before writing code, return a concise constraint matrix mapping each implementation invariant to positive and negative executable evidence. Confirm the single owned file is sufficient, identify exact failure codes, and report any true contract or SDK-surface blocker. Do not write before this matrix is complete.

## Frozen Public Surface

Export exactly one named factory:

`createPiAgentAnalysisRuntime({provider,model_id})`

The only internal construction seam is the optional second closed argument:

`createPiAgentAnalysisRuntime({provider,model_id},{sdkSessionFactory})`

The second argument contains exactly `sdkSessionFactory`, is construction-only, and never becomes a Product/Profile option, environment switch, test mode, output substitute, or hardcoded business branch. The returned value is only the existing Agent Analysis Runtime Port implementation and contains no Pi SDK value.

Constructor, `openSession`, returned session methods, descriptors, callbacks, requests, statuses, events, and results are closed, frozen where specified, and reject missing, null, unknown, reordered, duplicate, non-frozen, or wrong-valued fields before effects. Use the exact business Port surface already frozen in Design and asserted by the tests; do not add convenience exports or test-only inspection APIs.

## Adapter-owned SDK Construction Contract

`sdkSessionFactory(request)` receives exactly the frozen closed request described in Design:

- `requested_model={provider,model_id}`;
- one fixed Adapter-owned `system_prompt` with no ambient content;
- the ordered three translated custom tools: `profile_approved_fixture`, `calculate_member_repurchase_metrics`, `validate_member_repurchase_metrics`;
- the exact closed policy disabling built-ins, persistence, discovery, retry, compaction, model-catalog network, and prompt-template expansion.

Each translated tool has exactly `name`, `label`, `description`, `parameters`, `executionMode`, and `execute`. Use project-local TypeBox for the closed empty parameter schema. Translate the Pi call ID, exact empty arguments, and signal to the corresponding business descriptor, validate its bounded result, and expose only canonical JSON text content plus empty details. Do not expose assets, rows, paths, raw provider values, messages, errors, or SDK objects.

Validate the returned frozen facade exactly:

- `subscribe` and idempotent zero-argument unsubscribe;
- synchronous `setActiveTools` returning the exact frozen active-name status;
- `prompt` returning only frozen `{settled:true}` after the accepted `agent_settled` lifecycle;
- synchronous `getActualModel` returning only exact frozen `{provider,model_id}` after realization;
- idempotent async `abort` and `waitForIdle` exact statuses;
- idempotent synchronous `dispose` exact status and post-dispose closure.

Reject non-frozen statuses, extra fields, wrong values, invalid arguments, listener failures, and every non-dispose call after disposal before another effect. Do not retain raw causes on returned/thrown business errors.

## Production Pi Factory

When the second argument is omitted, use only the project-local `@earendil-works/pi-coding-agent@0.84.2` ESM surface. Import and verify the SDK surface without reading credentials, but lazily realize `ModelRuntime` and `AgentSession` only on the first `prompt`.

Before the first prompt, `subscribe` stores the bounded listener, `setActiveTools` stores the phase list, and pre-prompt cancel/dispose completes without creating a Pi session, enumerating credentials, reading auth/model/session files, or contacting a provider.

On first real prompt only:

- create `ModelRuntime` with `{allowModelNetwork:false,refreshOnCreate:false}`;
- resolve exactly the requested provider/model;
- use an inert ResourceLoader with the fixed system prompt and no extensions, skills, prompt templates, themes, context files, append content, paths, or discovery;
- use `SessionManager.inMemory()` and `SettingsManager.inMemory(...)` with retry and compaction disabled;
- call `createAgentSession` with explicit runtime/model, no built-in tools, only the exact three approved custom tools, the inert loader, and no scoped alternative model;
- bind the stored listener, apply the stored active-tool list, and issue the same prompt with template expansion disabled.

The single realized Pi session spans Discovery and Execution and is disposed exactly once. Do not use global Pi, CLI/RPC, cwd/home fallback, ambient model selection, provider fallback, catalog network, on-disk persistence, or resource discovery. The deterministic injected factory and production factory must traverse the same Adapter lifecycle and business parsing logic.

## Session Protocol and Fail-closed Semantics

Implement the Design's closed state machine:

`created -> discovery_running -> discovered -> execution_running -> completed`

with one-way `failed` or `cancelled` terminal transitions after quiescence. Discovery uses no active tools and accepts only one closed Analysis Contract proposal from the authoritative final assistant text. Execution enables exactly the ordered three tools, accepts their exact correlated start/end pairs only after each callback settles, and accepts only one closed `{finding}` result. Both turns require the exact final sequence `message_end(stop) -> agent_end(willRetry:false) -> agent_settled`, then verify the actual model equals the requested model.

Stream deltas are bounded non-authoritative progress only. Reject malformed/duplicate/extra JSON, missing or duplicate final output, retries, compaction/continuation, forbidden tools, bad ordering/correlation, early tool end, late callback/result/event admission, model mismatch, invalid phase transitions, and raw SDK/provider values. Do not hardcode proposal, Finding, or metric results.

`session.execute` accepts exactly `{confirmed_contract,cancellation_signal,deadline_seconds}` with required integer `0..300`. Product uses `300`; direct `0` after Discovery performs no Execution prompt or tool admission and completes exactly:

`close admission -> unsubscribe once -> await abort -> await waitForIdle -> dispose once -> TIMEOUT`

Cancellation, timeout, and mapped runtime failure close admission before quiescence. A callback rechecks phase/cancellation after its business promise settles. No retry, timer/clock/test seam, late acceptance, or second SDK effect is allowed. Terminal success/failure/cancellation disposes once; post-completion cancel is idempotent and does not call the disposed facade.

Map only to stable sanitized codes required by Design/tests:

- `MODEL_UNAVAILABLE`
- `MODEL_EXECUTION_FAILED`
- `TOOL_POLICY_VIOLATION`
- `PROTOCOL_FAILURE`
- `CANCELLED`
- `TIMEOUT`

Messages, stacks, and returned objects must not contain raw SDK causes, credentials, provider payloads, prompts, transcripts, session IDs, install paths, or sensitive values.

## Evidence and Mutation Coverage

The frozen focused target contains exactly 92 top-level leaves:

- one test-private scenario/helper health leaf that remains GREEN;
- 91 Adapter leaves that currently RED only because `adapters/agent-pi/local-analysis.mjs` is absent;
- the final correction adds independent 6 non-frozen result-status, 6 extra-field result-status, 6 post-dispose non-dispose-call, and 2 tool-settlement/late-callback leaves.

Implementation must satisfy every leaf independently; do not collapse behavior into a test-name or injected-factory special case.

## Write Risk and Validation Budget

Write risk: medium and contained to one new Adapter module. The authorized focused tests use only the deterministic construction factory plus production-default pre-prompt readiness/cancel checks. They must not open a real Pi session, read credentials, contact a provider, invoke a model, create persistent sessions, or write outside test-owned memory/state.

Allowed before the final target:

- any number of syntax checks on the single owned `.mjs` file;
- narrow read-only source/static inspection;
- no partial/equivalent TASK-005 test target and no helper target.

Final focused GREEN command: maximum one Worker execution:

`node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`

Expected result: exactly `92` tests, `92` pass, `0` fail, `0` cancelled, `0` skipped, `0` todo.

Do not run unit, TASK-003, TASK-004, TEST-XCLI-013, TEST-XCLI-021, E2E, full suite, build/install/update, Pi CLI, provider/model, network, or credential probes. If the one focused execution fails, stop immediately with `REVISION_SCOPE_ESCALATION_TASK_005`; do not edit after the failure, rerun, or execute a partial equivalent. Controller owns any revision decision and regression run.

## Return to Controller

Return exactly:

- the pre-code constraint matrix and whether any contract/SDK blocker was found;
- changed file and source locations for the public factory, injected construction path, production lazy factory, lifecycle validation, phase parser, cancellation/deadline quiescence, and error mapping;
- syntax/static evidence;
- exact focused command result and budget `1/1`;
- evidence that all 92 leaves were scheduled independently;
- confirmation of no test/spec/manifest/dependency/other production write;
- confirmation of no real SDK session, credential read, provider/model/network call, global/session-file write, retry, or raw-data leak;
- one final status: `TASK_005_READY_FOR_CONTROLLER_REVIEW`, `REVISION_SCOPE_ESCALATION_TASK_005`, `CONTRACT_DRIFT_TASK_005`, or `ROUTING_ESCALATION_REQUIRED_TASK_005`.

Do not start TASK-006 or Validator. Controller retains integration, acceptance, and next-Gate authority.
