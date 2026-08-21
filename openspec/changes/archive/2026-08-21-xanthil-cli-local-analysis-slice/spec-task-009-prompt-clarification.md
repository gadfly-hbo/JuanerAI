# TASK-009 Prompt-Contract Clarification R3.1

## Status

**SPEC_READY_TASK009_PROMPT_R3_1**. This is a bounded repair specification for the
real-Pi acceptance failure and the Test role's
`TEST_CONFLICT_TASK009_PROMPT`. It changes no Requirement, Acceptance
Criterion, model, tool, fixture, result, data boundary, or identifier set.
It does not claim a test result or authorize a provider call.

## Decision and Seam Analysis

The Agent Analysis Runtime Port receives Application-owned closed
`discovery_context` and `finding_context`; the Pi Adapter serializes them into
user envelopes. The Adapter owns only the frozen transport-policy system prompt
and Pi translation. It MUST NOT reproduce, synthesize, default, or hardcode a
Proposal, Finding, metric result, fixture fact, or business constraint.

Two seams were considered:

| Seam | Decision | Reason |
|---|---|---|
| Application -> business Port -> Adapter carries distinct closed contexts | **Selected** | Application already owns the approved scenario, confirmation and Product-Core validation. Every Runtime implementation receives the same business input without Pi leakage. |
| Adapter contains a copied fixed business contract | Rejected | It duplicates authority, allows drift from Product Core/Application, makes a replaceable Adapter business-owner, and violates Ports-and-Adapters dependency direction. |

The Product Core exact Proposal/Finding validators and the prohibition on
Adapter hardcoding are compatible. The model must transform the supplied
business context into an independently shaped structured output; Product Core
then accepts or rejects it. The Adapter may not manufacture an otherwise-valid
output.

## Closed Inputs, Output Mappings, and Canonical Serialization

`Application` constructs both contexts from its existing authoritative
first-scenario values immediately before the relevant call. They are transient
and never enter the persisted confirmed contract. The Port calls are exactly:

```js
session.discover({ discovery_context })
session.execute({ confirmed_contract, finding_context, cancellation_signal, deadline_seconds })
```

`discovery_context` is deeply frozen, closed, and shaped as `protocol`,
`source`, `comparison`, `delivery`, not as a Proposal. `protocol` is exact
`{schema_version:'1.0',response_kind:'analysis_proposal'}`. `source` contains
the exact approved `SRC-001` identity, version, kind, path, hash, byte size,
ordered columns, and date coverage. `comparison` contains the original and
clarified questions, objective, ordered windows, ordered metrics, and signal
rule. `delivery` contains output requirements, constraints, and exact ordered
`proposal_field_order`: `schema_version`, `original_question`, `question`,
`objective`, `source_ids`, `fixture`, `time_windows`, `metrics`, `signal_rule`,
`output_requirements`, `constraints`. Each nested value retains its approved
field/array order; all are Application/Product-Core authoritative.

The Discovery output is one Proposal, not an echo: version maps from protocol;
question/objective/windows/metrics/signal map from comparison; source IDs are
`[source.source_id]`; fixture projects source in existing fixture-field order;
and requirements/constraints map from delivery. Fields appear in
`proposal_field_order`. Adapter forwards the model output and Application uses
the existing Product Core validator.

`finding_context` is separately deeply frozen, closed, and shaped as
`protocol`, `identity`, `interpretation`, not as `{finding}`. `protocol` is
exact `{schema_version:'1.0',response_kind:'finding_envelope'}`. `identity` is
exact `{finding_id:'F-001',evidence_ids:['E-001']}`. `interpretation` contains
the exact canonical statement, `required_status:'supported'`, ordered required
limitations `['tiny and synthetic','window-local','no causal or business-impact claim']`,
and ordered prohibited categories `causal`, `statistical_significance`,
`member_harm`, `recommendation`, `action`, `decision`, `prescriptive`,
`real_world`. The Execution output is exactly `{finding}` and maps identity,
status, statement, evidence IDs and limitations from this context; it becomes
valid only after bounded tool results support the confirmed signal.

Canonical JSON is ECMAScript `JSON.stringify` without replacer or spacing;
the stated insertion order is normative. The exact fixed system prompt,
including line breaks, is:

```text
You are Xanthil Local Analysis Runtime v1.
Follow only the current XANTHIL_DISCOVERY_V1 or XANTHIL_EXECUTION_V1 user envelope and admitted tool results.
During Discovery, do not call tools.
During Execution, call each currently admitted tool exactly once in admitted order with exactly {}, wait for all successful results, then return the terminal JSON object.
Return exactly one terminal JSON object for the envelope required_response; do not emit prose, Markdown, code fences, or extra keys.
Do not request, infer, disclose, or use data outside the envelope and admitted tools.
Do not make a Decision, recommendation, or Action.
```

It contains no fixture, date, metric, result, Proposal, Finding, tool name, or
other business fact. A tool-call assistant intermediate is not terminal JSON
and is permitted only by the Execution sentence above. The sole Discovery user
string is:

```text
XANTHIL_DISCOVERY_V1\n<JSON.stringify({phase:'discovery',discovery_context,required_response:{kind:'analysis_proposal',return_only_json:true,proposal_field_order:[...]}})>
```

The Discovery envelope order is `phase`, `discovery_context`,
`required_response`; required-response order is `kind`, `return_only_json`,
`proposal_field_order`. Execution uses the confirmed contract, finding context,
and bounded callback results only. Its sole user string is:

```text
XANTHIL_EXECUTION_V1\n<JSON.stringify({phase:'execution',confirmed_contract,finding_context,required_response:{kind:'finding_envelope',return_only_json:true,finding_field_order:['finding'],tool_use_policy:{discovery:'no_tools',execution:'each_admitted_tool_once_in_admitted_order_with_empty_object'}}})>
```

The Execution envelope order is `phase`, `confirmed_contract`,
`finding_context`, `required_response`; required-response order is `kind`,
`return_only_json`, `finding_field_order`, `tool_use_policy`; its order is
`discovery`, `execution` with exactly the stated values. The three approved
custom tools remain the only Execution capabilities and retain their existing
order and closed `{}` arguments.

## Authority Boundary for Context Validation

Application/Product Core owns every exact first-scenario business semantic:
fixture identity and approved hash, question/objective, source/date/metric
meaning, exact signal-rule strings, output-requirements and constraints meaning,
`F-001` identity, exact statement, Evidence semantic association, limitation
meaning/order, and prohibited-claim meaning. Application constructs the two
contexts only from those values; Product Core remains the authoritative Proposal
and Finding validator. Integration/Application evidence, not direct Adapter
tests, proves those exact semantics and the model-output mapping.

The Adapter validates only transport/security closure before serialization. At
every nesting level it rejects non-plain values, mutable values, missing/extra
keys, wrong insertion order, wrong primitive/container type, and `null`. It verifies a safe relative `source.path`
(reject absolute path and traversal), SHA-256 lexical syntax, identifier
patterns, and uniqueness of ID arrays. It verifies generic closed protocol /
response-kind / phase / required-response / tool-policy enum values and exact
envelope construction. It does not compare a syntactically valid value to any
first-scenario business constant.

R3.1 resolves every C1 mutation exactly once:

| C1 mutation | Disposition | Exact C2 action |
|---|---|---|
| source secret-like extra field | `KEEP_AS_ADAPTER_TEST` | reject extra key |
| source absolute path | `KEEP_AS_ADAPTER_TEST` | reject absolute path |
| source traversal path | `KEEP_AS_ADAPTER_TEST` | reject traversal |
| valid but wrong source hash | `REPLACE_WITH_TRANSPORT_MUTATION` | mutate to non-64-lowercase-hex SHA |
| comparison extra field | `KEEP_AS_ADAPTER_TEST` | reject extra key |
| signal rule wrong shape | `KEEP_AS_ADAPTER_TEST` | reject wrong type/closed shape |
| signal rule business mismatch | `MOVE_TO_APPLICATION_INTEGRATION` | retain exact approved-context deep-equality assertion |
| delivery output-requirements extra field | `KEEP_AS_ADAPTER_TEST` | reject extra key |
| delivery constraints missing field | `KEEP_AS_ADAPTER_TEST` | reject missing key |
| proposal field order mutation | `KEEP_AS_ADAPTER_TEST` | reject reordered fields |
| finding identity extra field | `KEEP_AS_ADAPTER_TEST` | reject extra key |
| syntactically valid `F-999` | `REPLACE_WITH_TRANSPORT_MUTATION` | mutate to malformed finding ID |
| duplicate evidence ID | `KEEP_AS_ADAPTER_TEST` | reject non-unique ID array |
| interpretation extra field | `KEEP_AS_ADAPTER_TEST` | reject extra key |
| missing limitations field | `KEEP_AS_ADAPTER_TEST` | reject missing key |
| limitations business reorder | `MOVE_TO_APPLICATION_INTEGRATION` | retain exact approved-context deep-equality assertion |
| unknown prohibited-category meaning | `MOVE_TO_APPLICATION_INTEGRATION` | retain exact approved-context deep-equality assertion |

There is no independently defined non-business context category enum in this
Change; Adapter MUST NOT invent one. This is not a product-behavior relaxation:
Application supplies only approved context and Product Core rejects invalid
Proposal/Finding output after the model turn.

## Boundaries, Failure, Activation, Rollback, and Retirement

Discovery egress is limited to the fixed system instruction, the closed
`discovery_context`, and no tool result. Execution egress is limited to the
fixed system instruction, confirmed contract, closed `finding_context`, and
bounded aggregate tool results.
Raw CSV rows, canonical SQL/Python bytes, artifacts, credentials, environment,
global Pi settings, project-control state, paths outside the workspace-relative
fixture identifier, and Pi transcript/history remain forbidden.

Missing, null, non-plain, mutable, extra, reordered, wrong-typed,
transport/security-invalid, or non-canonical context; invalid context/output
mapping; altered system prompt, prefix, or envelope; an unknown phase;
prose/multiple/malformed final JSON; or a Proposal/Finding rejected by Product Core maps through sanitized `PROTOCOL_FAILURE` or
`MODEL_EXECUTION_FAILED`/Application validation semantics as applicable. No
fallback prompt, ambient resource, retry, copied proposal, or copied Finding is
permitted.

Activation, rollback, and retirement remain exactly as approved: this is only a
repair to the personal-Profile direct SDK path; no new configuration, model,
command, migration, persistence, RPC fallback, or compatibility surface is
introduced. Rollback disables that composition; it does not alter fixtures or
existing artifacts. Retirement does not delete or rewrite artifacts.

## Delivery and Validation Gate

The Test role first adds/adjusts only
`tests/contract/xanthil-local-analysis/**`,
`tests/integration/xanthil-local-analysis/**`, and required matching
`tests/fixtures/xanthil-local-analysis/**` helpers. It observes both business
Runtime implementations receiving the same closed contexts, exact system
prompt/Discovery/Execution strings, all negative closure cases above, and no
Adapter business-contract copy. It must establish focused RED caused by absent
Application/Port/Adapter propagation, not by a model or credential.

Test C2 must implement the table exactly. It must not add a redundant context
semantic suite: existing Application integration keeps exact deep-equality of
the approved contexts for the three moved business cases. It must retain/
complete direct Adapter closure and egress cases above, then return focused RED
caused by absent transport implementation.

Only after Controller records `TDD_READY_TASK009_PROMPT_R3_1` may a Worker modify
the minimum production paths:

- `packages/application/local-analysis.mjs` — construct/freeze/pass both
  authoritative contexts;
- `packages/ports/local-analysis.mjs` — close the changed business Runtime
  method inputs without Pi values;
- `adapters/agent-pi/local-analysis.mjs` — validate/serialize the business
  inputs and apply the exact fixed transport policy.

Product Core, CLI, Profile, analytics/storage
Adapters, fixture, dependency files, global Pi configuration, and all other
paths are forbidden. GREEN requires the focused deterministic contract,
existing regressions, then the credential-gated TEST-XCLI-013 real acceptance
under the already approved provider/model. It must not claim that stochastic
narrative is a calculation oracle.
