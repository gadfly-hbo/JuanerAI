# JuanerAI Product Development Blueprint v1.1 Amendment

## Document control

| Field | Value |
|---|---|
| Base | [JuanerAI Product Development Blueprint v1.0](./juanerai-product-development-blueprint-v1.0.md) |
| Version | `1.1` |
| Change type | Compatible product-mode correction; product route, target user and first-slice value endpoint are unchanged |
| Trigger | User instruction to reuse the accepted PX-2026-004/006 Xanthil UI rather than invent a replacement, including the full visible capability set |
| Status | User UI Gate accepted; Session/Runtime Review 002 `PASS`; first production OpenSpec and execution-package transfer authorized |
| Binding attachment | [Xanthil UI Reference Adoption Map v1.0](./xanthil-ui-reference-adoption-map-v1.0.md) |
| State/closure attachment | [Xanthil UI Child-Conversation, Adoption and Closure Matrix v1.0](./xanthil-ui-state-and-closure-matrix-v1.0.md) |
| Visual attachment | [Xanthil Accepted UI Reference Plates v1.0](./attachments/xanthil-ui-reference/README.md) |
| Session/Runtime attachment | [Xanthil Desktop Session and Runtime Boundary v1.0](./xanthil-desktop-session-runtime-boundary-v1.0.md) |

This amendment is read with Blueprint v1.0. It replaces only the v1.0 statements
identified below. All unchanged product, data, Runtime, governance and stop-line
rules remain in force.

## 1. Corrected UI-first principle

The accepted PX-2026-004/006 product mode is the starting UI contract. The
Controller may simplify the first business case, labels and amount of example
content, but may not replace the accepted shell with a newly invented wizard,
dashboard or unrelated information architecture.

The first clickable UI Contract must visibly retain:

- quick and professional modes;
- the complete PX-2026-004 professional six-stage workbench;
- Project, Session, recent/background Run and child-conversation navigation;
- the quick-mode conversation and Composer;
- Skill, Prompt, Fork, Subagent and report entry points;
- the independent Fork/Subagent conversations and their return paths;
- the right-side context/evidence/task/capability/provenance surface;
- visible local-data and model-exposure boundaries;
- hypothesis, evidence, refutation, report, version and execution-feedback
  states;
- global search/command access and the accepted accessibility behavior.

This is a UI-contract obligation, not an instruction to activate every
capability in the first production Change.

## 2. Replacement for v1.0 phase-2 deferral language

Blueprint v1.0 deferred Fork/Subagent and complete quick/pro switching as if
they could disappear from the first product UI. That wording is replaced by:

- The accepted quick/pro modes and capability entries remain visible from the
  first clickable UI Contract.
- The professional membership-repurchase path is the first real integrated
  vertical slice.
- Quick-mode real execution, Fork execution, Subagent execution, general Skill
  management and general Prompt management may remain clearly labeled
  `Preview` after the clickable UI Gate and require separate production Changes.
- A visible Preview must never fabricate a real result, persistence, model call,
  child task, report version or recovery claim.
- Later activation reuses the frozen interaction semantics; it does not require
  another UI reinvention.

## 3. First vertical slice unchanged in value, corrected in surface

The v1.0 product endpoint remains:

> A non-technical membership-operations analyst uses the Desktop UI to import
> authorized local member and order data, state and confirm a repurchase
> hypothesis, review the analysis plan, run real local computation, inspect
> supporting and refuting evidence, reach a bounded judgment, compare decision
> candidates or record insufficient evidence, and save, reopen, rerun and export
> the Decision Case.

It is now presented through the accepted professional-mode six-stage Xanthil
workbench:

1. New analysis / business question;
2. Data preparation;
3. Local processing and aggregate exposure Gate;
4. Evidence-based analysis;
5. Report;
6. Execution feedback / Decision Closure.

The first slice does not create a seventh product mode or a replacement six-step
wizard. Detailed Case/Run rules, import taxonomy, model-exposure rules and
failure recovery remain owned by UI Contract v1.0 except where UI Contract v1.1
changes their presentation.

## 4. Corrected research-Demo adoption statement

Replace Blueprint v1.0 section 8's PX-2026-004/006 bullets with the binding
[adoption map](./xanthil-ui-reference-adoption-map-v1.0.md).

In summary:

- directly adopt the accepted UI composition and interaction model;
- adapt the complex retail example to the narrower first Decision Case;
- retain all named and unnamed accepted capability modules in the clickable UI;
- separate UI visibility from first-slice production activation;
- never treat Demo code or PASS as production evidence.

## 5. Corrected Gate sequence

The Gate sequence is now:

```text
Blueprint v1.0 approved
-> explicit PX-2026-004/006 correction
-> Blueprint/UI Contract v1.1 amendments + adoption map
-> fresh development-readiness review
-> revise the retained clickable draft using the accepted Xanthil UI
-> user UI Gate
-> later OpenSpec/Spec Gate/TDD/implementation through the separately authorized execution package
```

Review 002 applies only to the earlier v1.0 UI input and is not authority to
continue that draft. No OpenSpec, production code, dependency installation,
provider call, real data access, schema work, commit, push or release is
authorized by this amendment.

The 2026-09-18 user UI Gate acceptance closes the product-mode and interaction
review only. It does not claim that persistent Desktop Sessions, production
directory creation, provider calls, or other simulated capabilities already
exist, and it does not by itself authorize production development.

The user then confirmed `060_reports` and accepted the proposed separation of
durable Product Session, immutable Analysis Run and implementation-private Pi
session. The binding Session/Runtime attachment defines the resulting
first-slice product requirement and was sent through a fresh
development-readiness review before the package could be declared ready for a
separately authorized OpenSpec Change.

After Review 001, the user explicitly retained the original LLM-backed
`帮我整理问题` action under a strict no-`010_draw` payload rule, chose one Decision
Case per first-slice Product Session with Case revision as the only business
revision, and separated optional Assistance Attempts from Analysis Runs. Those
corrections are binding in the Session/Runtime attachment and require fresh
Review 002.

Fresh Session/Runtime Development-Readiness Review 002 returned `PASS`. On
2026-09-19 the user separately authorized the first production OpenSpec Change
and preparation and transfer of its bounded Mac mini execution package. The
package at
`docs/planning/2026-09-19/xanthil-desktop-first-product-change-execution-package-v1.0.md`
now governs OpenSpec execution. This amendment alone still does not authorize
dependency installation, provider calls, real data use, schema creation,
production implementation or release.
