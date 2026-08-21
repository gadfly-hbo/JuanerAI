# TASK-009 Embedded Pi Runtime R4

## Status

**SPEC_READY_TASK009_EMBEDDED_RUNTIME_R4 — Controller Spec Gate required.**
R4 rejects the explored CLI-subprocess direction and preserves the project-local
embedded Pi SDK `0.84.2`, one in-memory AgentSession, and native custom tools.
It authorizes no production, test, dependency, credential, or global-Pi edit.

## Evidence and Decision

Frozen Node 26/project-local SDK `0.84.2` with `minimax-cn/MiniMax-M3`, inert
ResourceLoader/no extensions, and native tools completed both turns in one
in-memory session: Discovery had zero tool events; Execution had exactly the
three approved start/end pairs, ordered `profile_approved_fixture`,
`calculate_member_repurchase_metrics`, `validate_member_repurchase_metrics`,
with non-empty IDs and exact `{}` args; both stopped normally. A closed leading
think-prefix removal produced a semantically exact Proposal. A dynamic Finding
response template derived from Application context produced an exact Finding;
one retry-disabled repeat also succeeded. CLI cannot bridge the in-process
callbacks and is only non-normative exploration evidence.

## Scope and Non-goals

Scope: MiniMax candidate identity; embedded local snapshot/readiness; dynamic
Discovery/Finding response templates; think normalization; object-order
semantics; focused tests/evidence. No CLI/RPC, tool bridge, generic schema,
extension, built-in, model fallback, retry, catalog network refresh, or
Adapter-owned business constant is added.

## Requirements and Acceptance Criteria

### R4-REQ-001 — Embedded Runtime and Candidate

The Pi Adapter SHALL use only local SDK `0.84.2`, `ModelRuntime.create` with
`{allowModelNetwork:false,refreshOnCreate:false}`, then exactly one first-prompt
`refresh({allowNetwork:false})`, inert ResourceLoader, in-memory session,
retry disabled, built-ins/extensions disabled, explicit
`{provider:'minimax-cn',model_id:'MiniMax-M3'}`, and actual-model verification
after each settled turn.

- **R4-AC-001-01:** Construction evidence proves explicit MiniMax identity,
  `create` internal refresh disabled plus one local-only reproducible explicit
  no-network refresh,
  no extensions/skills/prompts/themes/context files, no built-ins/persistence,
  retry disabled, and no Pi type across the Port.
- **R4-AC-001-02:** Discovery and Execution use the same in-memory session;
  Discovery has zero tool events; Execution has exactly one successful native
  start/end pair per approved callback in approved order, non-empty correlation
  IDs, and exact `{}` arguments.
- **R4-AC-001-03:** Missing model snapshot, construction failure, actual-model
  mismatch, stream ending without finish reason, non-stop terminal, malformed
  lifecycle, timeout, or cancellation fails closed through existing sanitized
  semantics, without retry/fallback.

### R4-REQ-002 — Closed Output Transport

Each terminal response is either one complete JSON object or exactly one
complete leading `<think>...</think>` prefix then one complete JSON object.
Think content is discarded. Fences, commentary, repeated/non-leading/
unterminated think tags, malformed/multiple/non-object JSON, duplicate object
members at every nesting level, empty response, and non-stop terminal results
fail closed in the Adapter before Port return.

- **R4-AC-002-01:** Valid plain and one-prefix responses reach Application as
  the same parsed object, with no retained think content.
- **R4-AC-002-02:** Rejections expose only sanitized product failure data;
  never raw model/provider/SDK text, credential, environment, session, or
  transcript.

### R4-REQ-003 — Dynamic Closed Response Templates

Application supplies closed contexts. Adapter dynamically derives each closed
response template from its context/mapping. Discovery maps only Proposal fields.
Finding maps exactly `finding_id`, `statement`, `status`, `evidence_ids`, and
`limitations`, plus `copy_response_template_values_exactly_after_tools_succeed:true`.

- **R4-AC-003-01:** Discovery requires the Proposal template. Execution first
  requires all three native tools to succeed in order, then requires exactly
  the Finding template values/shape.
- **R4-AC-003-02:** Adapter source contains no fixture hash/path, metric/result,
  Finding/Evidence ID, limitation, signal rule, or literal business response
  value; all originate only in Application context.
- **R4-AC-003-03:** Missing/extra/wrong-type/wrong-value/business-semantic
  response members remain invalid through Application/Product Core; Adapter
  never manufactures, repairs, defaults, or adds members.

### R4-REQ-004 — Semantic Order and Activation

Object-member order is non-semantic; approved array order remains semantic.
Adapter owns raw terminal syntax and duplicate-member detection before parsing.
Application/Product Core own object-order-insensitive business semantic
validation and canonical serialization only. MiniMax-M3 becomes the Profile default only after
focused RED/GREEN, full regression, real `TEST-XCLI-013` success, Validator
PASS, and Controller acceptance; Mimo has no automatic fallback.

- **R4-AC-004-01:** Semantically equal objects differing only by member order
  have identical acceptance; array-order/business mismatches remain invalid.
- **R4-AC-004-02:** Before all activation gates no result calls MiniMax a proven
  default; failure leaves Change inactive without retry, fallback, global Pi
  mutation, or Artifact change.

## Boundaries, Failure, Rollback, Test Intent

Application/Core own business values, validation, and artifacts; Adapter owns
SDK translation, native callback bridging, transport policy, event projection,
model verification, and sanitization. Only approved synthetic metadata and
bounded aggregates may reach MiniMax. Stream defects including `Stream ended
without finish_reason` remain `MODEL_EXECUTION_FAILED`; do not use
`supportsFinishReason:false` or retry.

Rollback disables composition only and preserves Artifacts. Test replaces CLI
R4 cases with RED for embedded construction/snapshot, tool ordering, stream
failure, closed think/JSON handling, dynamic templates, business-value absence,
object-order equivalence, no retry/fallback, and real synthetic E2E success.
After TDD_READY Worker paths are Adapter, Application, and Profile MiniMax
selection. Application is authorized only to replace its frozen
`modelIdentity` with `{provider:'minimax-cn',model_id:'MiniMax-M3'}` and keep
dependency validation, runtime `actual_model`, and run provenance consistent.
It shall not change parse, business semantics, Port shapes, or other logic.
Ports remain frozen; all other paths remain
forbidden.
