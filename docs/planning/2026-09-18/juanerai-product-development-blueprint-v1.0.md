# JuanerAI Product Development Blueprint v1.0

> Historical base notice (2026-09-18): v1.0 remains the approved first
> blueprint. Its product-mode and PX-2026-004/006 adoption statements are
> amended by [Blueprint v1.1](./juanerai-product-development-blueprint-v1.1.md)
> and the binding
> [Xanthil UI adoption map](./xanthil-ui-reference-adoption-map-v1.0.md).
> Review 002 no longer authorizes clickable UI work against v1.0 alone.

## Document control

| Field | Value |
|---|---|
| Version | `1.0` |
| Product authority | JuanerAI Whitepaper v3.3.3, subject to current explicit user decisions and JuanerAI governance Gates |
| Whitepaper SHA-256 | `9344f07cff450239a0ac33423a239f0dc47c9ac0aa48de8e86253e2b143300ff` |
| User decision | Approved as the first blueprint version on 2026-09-18 |
| Development status | Product direction approved; UI Contract development-readiness Review 002 PASS; high-fidelity clickable UI Contract and user UI Gate are next |
| Replaces | No prior plan. The withdrawn 2026-08-27 and 2026-08-28 Desktop and Model Pack plans remain `VOID` historical references. |

## 1. Versioning policy

This document is an immutable versioned product input.

- `1.0` is the first approved JuanerAI product-development blueprint.
- A compatible addition that does not change the route, target user, first-slice value endpoint, or core acceptance boundary increments the minor version, for example `1.1`.
- A non-semantic correction to wording, links, or formatting increments the patch version, for example `1.0.1`.
- A change to the product route, target user, first vertical slice, value endpoint, or core acceptance boundary increments the major version, for example `2.0`.
- A later version records its changes and does not rewrite the meaning or approval history of an earlier version.

## 2. Product authority and stop lines

JuanerAI helps people move from Data to Decision to Action to Outcome while preserving evidence, provenance, authorization, and responsibility. Xanthil Desktop Free is the first product entry.

The following rules govern this blueprint:

1. The user is a non-technical business or analysis professional. The product must be understandable and operable without reading source code, JSON, SQL, Python, hashes, terminals, or logs.
2. The actual Desktop UI is the product surface and the final user-acceptance surface. CLI behavior, tests, logs, and Validator evidence support technical proof but cannot replace UI acceptance.
3. UI is developed first as a product contract, not added after backend implementation.
4. A static or simulated UI must label every simulated state. It may freeze product behavior but cannot claim that computation, persistence, sandboxing, or integration exists.
5. Final acceptance must exercise real integrated behavior from the Desktop public entry point. A page that replays fixtures or reports backend success without consuming the real result does not pass.
6. The 2026-08-27 and 2026-08-28 Desktop and Model Pack plans are void. Their approvals, D1-D5 sequence, `member-orders-v2`, D0.5/D1-A, Fork/Subagent scope, and Model Pack release order do not reactivate through this blueprint.
7. Completed JuanerAI source, tests, accepted OpenSpec, TypeScript migration, local-analysis, Model Pack contract-enabler, and architecture boundaries remain reusable.

## 3. Product development route

| Phase | Product outcome | Evidence required before advancing |
|---|---|---|
| 0. Minimum shared definitions | Establish only the identity, version, Contract, Context/Binding, IR, Decision Case, provenance, and Adapter boundaries required by the first vertical slice. | The first Case can persist, reopen, preserve history, and express precise references. |
| 1. Xanthil Desktop Free | One non-technical professional completes one real local analysis task from data and question to evidence, judgment, decision candidates, and a reopenable Case. | Technical acceptance through the actual Desktop UI, followed by a separately approved real-user and authorized-real-data validation plan. |
| 2. Repeated personal value | Add templates, supported formats, personal asset retrieval, periodic reruns, and only then reconsider report locking, feedback drafts, Fork/Subagent, or a second Agent Runtime. | Repeated-use, retention, and collaboration-demand evidence. |
| 3. JuanerAI Workspace | Add sharing, comments, review, versioning, basic permissions, and controlled migration of personal assets. | Real multi-person review and reuse, correct permission/history isolation, and team-value evidence. |
| 4. One enterprise scenario pilot | Use bounded enterprise data, semantic binding, human approval, execution receipt, and feedback in one measurable scenario. | An approved baseline, Owner, data and authorization boundary, guardrails, takeover, exit conditions, and a reviewable value report. |
| 5. JuanerAI Enterprise | Expand enterprise identity, audit, deployment, connections, model governance, OSM governance, teams, and decision domains. | Separate acceptance for every organization, data domain, and runtime environment. |
| 6. Conditional limited-domain automation | Expand action authority only for sufficiently validated and explicitly bounded domains. | Independent authorization, monitoring, stop/revoke, human takeover, and applicable rollback or compensation. |

Domain Packs, DAME methods, and Model Packs are horizontal capabilities introduced by an actual consumer need. Model Pack local consumption and enterprise Serving retain separate Gates and are not prerequisites for the first personal slice.

## 4. UI-first delivery policy

Every product vertical follows this order:

1. Freeze the product goal, supported user task, non-goals, data boundary, and acceptance endpoint.
2. Produce a complete, high-fidelity, clickable UI Contract using explicitly labeled synthetic data and simulated execution.
3. Obtain the user's UI Gate decision on information architecture, language, workflow, visible states, errors, recovery, and final artifact.
4. Only after UI Gate approval, create or finalize the implementation OpenSpec and pass Spec Gate.
5. Establish executable UI and contract RED before production implementation.
6. Implement the real Electron/React/TypeScript Desktop state flow first, then integrate file, calculation, storage, and Runtime capabilities behind the frozen UI contract.
7. Mark every temporary stub as simulated; exclude all stubs and fixture replay from final acceptance.
8. Run technical validation and independent Validator review.
9. The user accepts the technical slice by operating the real integrated Desktop UI.
10. Real-user value validation and public release remain separate later Gates.

## 5. Existing JuanerAI foundation alignment

### Reuse

- TypeScript Product Core, Application, Port, Adapter, and Profile boundaries.
- The current Pi-backed `AgentAnalysisRuntime` seam.
- DuckDB/Python local analysis and independent validation patterns.
- Run Artifact and Run Evidence storage/query foundations.
- Cancellation, deadline, provenance, immutable artifact, and fail-closed behavior already protected by tests.
- The separate `AnalyticalModelRuntime` and Model Pack contract-enabler, retained for later scenarios.
- OpenSpec, TDD, independent validation, dual-device Git, data-safety, and evidence-preservation governance.

### Extend for the first slice

- A production Desktop application and non-technical UI.
- Real local file import, preview, quality review, semantic mapping, and immutable source snapshots.
- User-facing Analysis Contract, Context/Binding, and editable analysis plan.
- A versioned Decision Case with save, reopen, rerun, history, and export.
- Controlled local worker execution, model-exposure confirmation, operational persistence, and integrity recovery.

### Explicitly deferred

- OSM, Workspace, enterprise IAM/multi-tenancy, full four-library infrastructure, all DAME methods, mandatory Domain Pack use, Model Pack activation, Fork/Subagent, a second Agent Runtime, arbitrary user code, automated action, real Outcome, Windows, additional file formats, marketplace, and billing.

## 6. Runtime and technical direction

### Desktop

- Use Electron, React, and TypeScript as the recommended first Desktop stack.
- The Renderer has no Node.js authority.
- Main process and controlled local workers communicate through versioned contracts.
- Exact Vite/Forge versions, licensing, packaging, and platform security checks are Design decisions before implementation.

### Agent Runtime

- Phase 1 retains the Pi Adapter as the only Agent Runtime Adapter.
- Pi may draft a Contract, Candidate hypothesis, evidence explanation, or DecisionCandidate.
- Pi does not select the business method, own semantics, determine the final judgment, select the preferred candidate, or authorize an action.
- The Profile selects provider/model; product contracts do not hardcode a provider.
- If the user declines external model exposure or has no provider, the entire task remains possible through forms and deterministic local computation.
- DeepSeek Harness or any other second Runtime requires a separate OpenSpec Change. No registry, fallback, hot switching, or universal Runtime is introduced.

### Analytical execution and persistence

- DuckDB SQL is the primary calculation path.
- A Python implementation independently recomputes the same frozen method contract without sharing the SQL or its intermediate aggregates.
- SQLite is recommended only for Desktop operational state and indexes.
- Immutable files hold source snapshots, Contract/Binding/IR, code, evidence, and Case/Run versions.
- DuckDB remains analytical rather than operational storage.
- Persistent schemas, migrations, retention/deletion, and resource limits require a structure decision and OpenSpec before implementation.

## 7. First vertical slice

The first vertical slice is defined in [Xanthil Desktop UI Contract v1.0](./xanthil-desktop-ui-contract-v1.0.md).

Its product endpoint is:

> A non-technical membership-operations analyst uses the Desktop UI to import authorized local member and order data, state and confirm a repurchase hypothesis, review the analysis plan, run real local computation, inspect supporting and refuting evidence, reach a bounded judgment, compare decision candidates or record insufficient evidence, and save, reopen, rerun, and export the Decision Case.

The first technical acceptance is deliberately narrow:

- macOS;
- UTF-8 `members.csv` and `orders.csv`;
- `CNY`;
- `Asia/Shanghai`;
- one repurchase comparison method and one optional segment-contribution method;
- no action execution and no Outcome claim.

## 8. Research Demo adoption map

Research Demos are design and evidence inputs, not production implementations or acceptance.

### PX-2026-001/002: hypothesis-first AnalysisOps

Adopt:

- the unified human workbench as the product surface;
- hypothesis, scope, evidence standard, refutation, alternative explanation, and Human Owner judgment;
- symmetric comparison of multiple hypotheses and explicit supplemental investigation;
- immutable context/evidence/result identity and fail-closed transitions;
- the PX-2026-002 principle that a browser action must drive real local behavior, persistence, restart recovery, and the same Case identity rather than a page-only success state.

Do not adopt in the first slice:

- the full strategy execution and outcome-writeback loop;
- dual-library production infrastructure;
- Semantica or Ontology Hub;
- historical AnalysisOps commands, directory layout, or state numbering as public product UX.

### PX-2026-004/006: Xanthil UI

Adopt:

- PX-2026-004 as the primary Desktop workbench and guided-analysis interaction baseline;
- visible stages, hypothesis cards, evidence/refutation, fail-closed states, report/history, and recoverable errors;
- PX-2026-006's natural-language entry, inline capability cards, visible data-exposure boundary, and auxiliary evidence drawer.

Do not adopt in the first slice:

- static Demo code as production code;
- complete quick/pro mode switching;
- Fork/Subagent behavior;
- simulated timers, fixed reports, or fixture results as final evidence.

## 9. Gate sequence and current stop point

The approved route for the first slice is:

```text
Blueprint v1.0 approval
-> UI Contract v1.0 plan and development-readiness review
-> clickable UI Contract
-> user UI Gate
-> OpenSpec and Spec Gate
-> Test Design and expected RED
-> production UI state flow
-> real local capability integration
-> GREEN and regression
-> independent Validator
-> user acceptance through the real Desktop UI
-> separately approved real-user/value validation
-> separately approved public-release check
```

Current stop point: create the high-fidelity clickable UI Contract from the frozen plan, then obtain the user UI Gate decision. No OpenSpec, dependency installation, production implementation, real provider call, real user study, or public release is authorized by this blueprint alone.
