# TASK-005 Spec Handoff — Real Pi Adapter, Offline SDK Seam

Status: **FROZEN FOR SPEC ROLE**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Trigger and Goal

- TASK-007 reproducible stack is Controller accepted: exact project-local Pi `0.84.2` and TypeBox `1.3.7`, lockfile v3, local ESM resolution, TEST-XCLI-021 `1/1` GREEN.
- TASK-005 existing focused RED is healthy: TEST-XCLI-006 and TEST-XCLI-011 fail only because `adapters/agent-pi/local-analysis.mjs` is absent.
- Pre-dispatch review found a real design/test contradiction: the current “same contract suite against Pi” invokes `discover()` and `execute()`, while the same Gate prohibits credentials and model calls. No approved SDK injection seam exists, so a Worker would have to call the provider, fake model behavior in production, or invent a test-only public mode.
- Goal: revise only the TASK-005 technical Design/Test/Task package to freeze a small internal SDK seam that lets tests drive the real Adapter translation deterministically without a provider call, while the production default path still uses the real project-local Pi SDK and the later TEST-XCLI-013 Gate remains the only real-model execution.
- This is not a product-scope, business Port, model-default, data-egress, credential, or RPC decision.

## Route and Ownership

- Role: fresh Spec role after a post-Gate contract-testability defect.
- Classification: R2/complex SDK construction, tool policy, event translation, cancellation, and testability seam.
- Route: `gpt-5.6-sol` high, bounded context. One draft; Controller independently re-runs the affected Spec Gate review.
- Allowed writes only:
  - `openspec/changes/xanthil-cli-local-analysis-slice/design.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/test-plan.md`
  - `openspec/changes/xanthil-cli-local-analysis-slice/tasks.md`
- Forbidden: normative capability Spec unless a true behavior contradiction is proven; tests, production, manifests/lock/node_modules, Proposal, traceability IDs, verification/project-control, credentials/global Pi, model/network calls, RPC, and every other path.

## Required Evidence

Read the installed project-local authoritative package metadata, declarations, and minimum implementation needed to establish:

- exact ESM exports/version;
- model resolution and `createAgentSession` construction inputs;
- custom tool definition/registration shape;
- built-in/default tool suppression and allowlisting;
- in-memory `SessionManager`/persistence behavior;
- prompt/event/cancel interfaces and actual-model identity access;
- resource/extension/context discovery controls needed to avoid ambient project/global capabilities;
- which operations would touch credentials/provider and therefore cannot run in offline tests.

Do not rely on global Pi, CLI/RPC behavior, online docs, or a model call.

## Required Design Result

Freeze one deep Adapter module with:

1. The external business factory remains `createPiAgentAnalysisRuntime`; Application/Ports receive only the existing Agent Analysis Runtime interface and no SDK types.
2. Production construction defaults to the exact project-local Pi SDK path; no global resolution or RPC fallback exists.
3. One small internal construction seam accepts dependencies rather than creating every SDK object invisibly. It must be usable by the production default and a test-owned SDK/session implementation; it is not a new business Port, CLI option, environment switch, test mode, fake-model branch, or extra product export.
4. The seam is closed and exact. Freeze its fields and lifecycle sufficiently for Test/Worker without leaking raw Pi objects through business results. Prefer one opaque facade/session factory over many shallow SDK passthrough methods.
5. Offline tests use the injected SDK/session implementation to exercise the real Adapter's model binding, Pi option construction, built-in/persistence suppression, tool translation, event/result mapping, cancellation, timeout, error redaction, and actual-model verification without credentials/network/provider calls.
6. TEST-XCLI-021 separately proves the actual project-local package/version/ESM resolution. Offline Adapter tests may not claim a real provider call. TEST-XCLI-013 remains the only real-model proof and stays skipped until explicit credential readiness.
7. Production default must configure only the three approved custom tools, no built-ins, no session persistence, no extension/skill/prompt/project-context discovery that broadens capability, explicit provider/model only, bounded events/results, and no raw transcript/SDK/provider/credential output.
8. Freeze Discovery and Execution request/response parsing and session phase behavior at the existing approved business contract, not at token/chunk wording. No deterministic proposal/finding may be hardcoded in production.
9. Cancellation and timeout must quiesce the SDK turn and reject late tool/events/results; errors map to the approved sanitized vocabulary without retry.

Compare at least two plausible seam placements privately, then write only the selected contract and a short rejection rationale. Optimize for a deep module: small construction interface, SDK complexity localized in the Adapter, same external business interface, and tests crossing the same Adapter interface as production.

## Test-Plan and Task Corrections

- Clarify TEST-XCLI-006/011 as Adapter translation/readiness tests using the test-owned SDK seam with no provider call, while actual SDK package resolution/version remains TEST-XCLI-021.
- Require positive and negative evidence for exact SDK construction options, custom-tool mapping/correlation, forbidden tools, malformed/out-of-order/late events, wrong actual model, raw-field redaction, timeout/cancellation quiescence, no retry, no persistence, and no ambient discovery.
- Preserve the unchanged business `runAgentRuntimeContract` intent, but do not require the test double to masquerade as a provider or the production Adapter to hardcode deterministic business outputs.
- Update TASK-005 work/exit evidence to reference the frozen internal seam and its real/default versus injected/offline evidence split.
- Do not change Requirement/AC/Test/Task IDs or expand the planned dependency/path scope.

## Handoff

Return changed paths, exact selected construction seam, official local SDK evidence locations, options/event/cancellation mappings, rejected alternative and rationale, Test/Task delta, remaining real-model Gate, static scope evidence, and `SPEC_READY_TASK_005_SEAM` or `SPEC_CONFLICT`.

Do not start Test/Worker/Validator. Controller performs the revised Spec Gate.
