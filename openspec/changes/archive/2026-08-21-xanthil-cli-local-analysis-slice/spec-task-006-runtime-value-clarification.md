# TASK-006 Spec Clarification — Runtime Values, Complete Manifests, and Boundary Failures

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Trigger: second-return read-only Test self-audit after Correction 001

## Objective

Close the remaining runtime-value and failure-mapping semantics as one final TASK-006 contract package before Test Correction 002. Preserve the structured CLI/Profile design, existing Application/Port contracts, personal-only fixed scenario, and all accepted upstream evidence. Do not add a new product capability or production/test implementation.

## Allowed Spec writes

Only the current Change's `design.md`, `test-plan.md`, `tasks.md`, and `traceability.md`; update the capability Spec only if a normative Requirement/AC statement truly needs clarification. No new Requirement, AC, Test, or Task ID is expected.

Production, tests, fixtures, manifests/lock/dependencies, board, credentials, global Pi, external repositories, and real provider/model actions are forbidden.

## Required decisions

### 1. Direct input event protocol

Confirm that iterator `next()` resolves directly to one frozen closed input Event, not a JavaScript `{value,done}` IteratorResult wrapper. An object such as `{value:event,done:false}` is therefore an invalid event/extra-field result. The first legal event remains the approved `question`; `eof` or `interrupt` before that question has no handle to cancel and must fail as `CLI_INPUT_INVALID` with zero Application/output effect. After the question creates the handle, the already-frozen pre/post-confirm cancellation rules apply.

### 2. No mutation versus frozen CLI values

Resolve the apparent conflict with this minimal rule:

- CLI never calls `Object.freeze` on, mutates, or otherwise changes any caller-owned input/output/Application object or any value returned by Application.
- CLI validates the complete incoming Application proposal/result, creates its own deep clone for every user-visible output event and resolved result, and recursively freezes that CLI-owned clone. The original Application value remains referentially distinct, byte/deep-equal, and unchanged/unfrozen if supplied that way.
- The CLI-owned event/result envelopes and every nested value they expose are closed and deeply frozen. Identity preservation is not part of the public contract.

State this explicitly so Test can prove both sides without requiring the existing Application to return pre-frozen values.

### 3. Complete Application result arms

Freeze that CLI accepts success, failed-run, and cancelled-run results only when `run` is a complete Product-Core-valid closed Run Manifest for that terminal status. Success additionally requires exact closed metrics and Finding matching the canonical oracle, `F-001`, source identity, Evidence, and limitations. A partial, extra-field, wrong-version/status/run/source/artifact/evidence/terminal-detail value fails closed and never renders success.

Define whether CLI uses Product Core validation directly or equivalent exact validation without widening its public surface. No minimal/partial Run object is valid evidence.

### 4. Application error ingress and mapping

Freeze the exact deterministic mapping for errors thrown/rejected by `start`, `discover`, and `confirm`:

- recognized preflight codes map to `stage:'preflight'` and the same code;
- recognized post-confirmation `{stage,code}` pairs map to the same stable pair;
- `RUN_COLLISION` without a run maps to the approved no-run stage/code pair;
- cancellation remains governed by explicit cancel/result semantics, not arbitrary raw error text;
- an unknown/malformed/raw cause maps to one exact sanitized fallback pair, recommended `{stage:'execution',code:'INTERNAL_ERROR'}`;
- no raw message, cause, stack, path, credential, provider payload, transcript, or source row is exposed.

Specify how the same mapped value appears in the failure terminal and resolved no-run/failed-run result, and when a boundary rejection rather than resolved failure is required.

### 5. Writer failure causal points

Confirm that a `write` throw or any non-`undefined` return at `ready`, `proposal`, `awaiting_confirmation`, `progress`, or terminal rejects exactly `{code:'OUTPUT_WRITE_FAILED'}`, stops further input reads and Application calls from that point, emits no later event, and does not fabricate/alter an Application run. Invalid writer shape is instead pre-effect `{code:'CLI_OUTPUT_INVALID'}`. A completed Application effect cannot be undone merely because its later terminal write fails.

## Test/Task projection

Update Test Plan and Tasks so Correction 002 must:

- replace minimal succeeded/failed/cancelled fixtures with complete valid manifests;
- prove cloned/deep-frozen CLI output/result and original Application-value non-mutation;
- schedule independent invalid proposal/result-arm, error-mapping, writer-stage, outer/input/output/Application closed-envelope, first-event, and direct-event mutations;
- remove every disjunctive `A || B` error-code assertion where the contract now selects one code;
- preserve Profile/example coverage, adding only the few remaining closed public-surface checks;
- retain one helper-health budget and exactly one complete focused RED, excluding real TEST-XCLI-013.

## Return

Return `SPEC_READY_TASK_006_RUNTIME_VALUES` or a genuine `SPEC_CONFLICT_TASK_006_RUNTIME_VALUES`, exact changed files/hashes, the closed decisions, static ID/trace checks, and confirmation of no forbidden writes/actions. Do not start Test, Worker, or Validator.
