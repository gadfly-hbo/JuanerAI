# TASK-005 Test Handoff — Pi Adapter Construction Seam

Status: **FROZEN FOR TEST AUTHOR**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate and Goal

- Revised TASK-005 Spec Gate: PASS.
- TASK-002, TASK-003/TASK-003B, TASK-004, and TASK-007: Controller accepted.
- Project-local `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7` are installed and TEST-XCLI-021 is GREEN.
- Goal: translate the frozen internal `{sdkSessionFactory}` seam into executable TEST-XCLI-006/011 evidence and establish corrected expected RED caused only by the absent `adapters/agent-pi/local-analysis.mjs` behavior.
- Non-goal: no production edit, manifest/lock/dependency change, npm install, credential read, Pi/provider/model call, CLI/Profile work, OpenSpec edit, or Validator work.

## Route and Ownership

- Role: fresh `juaner_test` context, logically isolated from implementation.
- Classification: R2/complex because the suite closes an SDK lifecycle projection, sequential correlated tools, cancellation quiescence, lazy credential boundary, and negative protocol matrix.
- Route: project Test role at `gpt-5.6-terra` high. One bounded authoring attempt; a true contract conflict returns `TEST_CONFLICT_TASK_005`.
- Allowed writes only:
  - `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`;
  - optionally one or more focused test-private helpers under `tests/fixtures/xanthil-local-analysis/`;
  - `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`;
  - `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`.
- Forbidden: every production path, other tests, approved Spec/Design/Tasks/verification, root package files, `node_modules`, project-control, global Pi/config/credentials, network, model calls, real user data, and every other path.
- Preserve all accepted existing assertions. Modify only the Agent Adapter portions of TEST-XCLI-006/011 plus the minimum test-private support. Do not weaken TASK-002/003/004/007 evidence.

## Frozen Adapter Construction Contract

The only production export remains `createPiAgentAnalysisRuntime`.

- Production call: `createPiAgentAnalysisRuntime({provider,model_id})`.
- Adapter-contract call: `createPiAgentAnalysisRuntime({provider,model_id},{sdkSessionFactory})`.
- The optional closed second argument contains exactly the one function `sdkSessionFactory`. Reject missing/null/non-function/unknown fields and extra factory arguments before effect.
- The injection replaces SDK-session construction only. It cannot replace Adapter phases, prompts, tool translation, event/result parsing, model verification, timeout, cancellation, disposal, or error mapping. It is not a product mode, Profile/env option, fake provider, output oracle, or hardcoded deterministic branch.

At the injected boundary, assert one frozen request with exactly:

- `requested_model={provider,model_id}`;
- one non-empty Adapter-owned `system_prompt` with no ambient file/context/credential content;
- the exact ordered three custom tools and no built-ins;
- the exact closed `policy` and values from the revised `design.md`.

Each custom tool must have only the frozen `name`, `label`, `description`, TypeBox closed-empty `parameters`, `executionMode='sequential'`, and `execute`. Drive `execute(toolCallId,{},signal)` to prove exact business correlation, approved order, bounded result JSON/text projection, empty details, cancellation recheck, and rejection of missing/extra/malformed/late inputs. Canonical asset bytes, raw rows, paths, credentials, and SDK/provider objects must never cross this result.

## Deterministic Facade and TEST-XCLI-006

Build a test-owned deterministic `sdkSessionFactory`; do not mock the business Runtime Port and do not claim it is a real Pi session or SDK turn. Its facade has exactly the frozen seven methods and exact statuses:

- synchronous `subscribe(listener) -> unsubscribe`;
- synchronous `setActiveTools(names) -> {active_tool_names}`;
- `prompt(text,{expandPromptTemplates:false}) -> Promise<{settled:true}>`;
- synchronous `getActualModel() -> {provider,model_id}`;
- `abort() -> Promise<{aborted:true}>`;
- `waitForIdle() -> Promise<{idle:true}>`;
- synchronous `dispose() -> {disposed:true}`.

Use this facade for the Pi half of the unchanged `runAgentRuntimeContract`. Give every newly scheduled leaf a `TASK-005` prefix and independently cover:

1. one session, Discovery then Execution, exact two prompts, `[]` then the approved three active tools;
2. Discovery terminal sequence with no tool events and exact closed proposal parsing;
3. Execution with exactly three correlated start/end pairs and business callbacks in approved order, followed by exact closed `{finding}` parsing;
4. non-authoritative text deltas versus authoritative final assistant content; chunk boundaries cannot change the result;
5. actual-model checks after construction and settled turns;
6. closed argument/result/frozen-object enforcement for construction, all facade methods, events, tools, and terminal JSON;
7. missing/extra/reordered/duplicate/late/unknown events or tools, wrong correlation, `isError:true`, retry/compaction/continuation, wrong stop reason, multiple/malformed final JSON, listener failure, SDK/result leakage, and actual-model mismatch;
8. construction/model unavailability, model/turn failure, tool-policy violation, protocol failure, timeout, and cancellation mapping to the approved sanitized codes with no raw cause;
9. cancellation/timeout closes admission, unsubscribes, calls abort then idle, rejects late callbacks/events, disposes exactly once, and leaves no unhandled asynchronous work;
10. repeat Discovery/Execution, Execution before Discovery, and operations after terminal state fail closed without another prompt; `cancel()` remains idempotent.

Test oracles must be independent and mutation-sensitive. A helper-health case must pass without the production Adapter and prove the deterministic facade can produce one valid Discovery/Execution lifecycle.

## Production-Default Lazy Readiness and TEST-XCLI-011

Omit injection. This evidence is intentionally narrower than TEST-XCLI-006 and TEST-XCLI-013:

- load only the project-local Adapter/module and assert the single approved export;
- create the runtime and open one closed business session for exact `xiaomi-token-plan-cn/mimo-v2.5-pro` with `discovery_tools=[]` and the three approved descriptors;
- do not call `discover`, `execute`, facade `prompt`, or `getActualModel`;
- prove pre-prompt `cancel()` is idempotent with `was_confirmed:false` and that the lazy production path creates no Pi session, auth file, provider/network effect, or session persistence;
- use a test-owned isolated config root or child-process guard such as scoped `PI_CODING_AGENT_DIR`, restored/cleaned by the test, so the assertion never enumerates or reads the user's real credential directory;
- reject missing/null/unknown factory/openSession fields, wrong model, ambient fallback, eager construction, extra business surface/export, and non-idempotent pre-prompt cancellation.

TEST-XCLI-011 must not claim that real `ModelRuntime`/`createAgentSession` options were observed or that a Pi session/provider turn occurred. TEST-XCLI-006 proves exact construction intent through injection; TEST-XCLI-021 proves local package/version/ESM; TEST-XCLI-013 alone may later realize the real SDK session and prompt/provider path after explicit credential readiness.

Do not add `inspect*`, `verify*`, test-mode, proof-only, or raw-facade production exports.

## RED Quality and Validation Budget

- Syntax checks on changed test `.mjs`: any number.
- Test-private helper-health pattern: maximum two executions while authoring.
- Accepted TEST-XCLI-021 check: do not rerun; its existing Controller evidence remains authoritative.
- Accepted unrelated unit/TASK-003/TASK-004/full-suite targets: do not rerun in Test Design.
- Final TASK-005 focused RED: maximum one execution after helper health:
  - `node --test --test-name-pattern='^TASK-005|^TEST-XCLI-006|^TEST-XCLI-011' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- The focused pattern may include the existing TEST-XCLI-006/011 leaves, but every intended new TASK-005 leaf must schedule. No focused skip/cancel/todo is allowed.
- Valid expected RED is caused only by missing `adapters/agent-pi/local-analysis.mjs` or its missing approved behavior. Helper, syntax, dependency, engine, fixture, credential, network, model, or unrelated accepted-module failure invalidates the RED.
- If the final target exposes a test defect, contract ambiguity, unexpected SDK requirement, or broader production seam, stop with `TEST_DESIGN_BLOCKED_TASK_005`; do not edit production, docs, manifests, or retry an equivalent final target.

## Handoff

Return:

- changed test paths and exact new leaf inventory mapped to TEST-XCLI-006/011 and covered ACs;
- independent helper-health evidence;
- final focused command, counts, and missing-behavior split with zero skipped/cancelled/todo;
- confirmation that no real Pi session, credential read, network/provider/model call, install, production, manifest, OpenSpec, board, or global write occurred;
- `TDD_READY_TASK_005` or one explicit stop signal.

Do not start Worker or Validator.
