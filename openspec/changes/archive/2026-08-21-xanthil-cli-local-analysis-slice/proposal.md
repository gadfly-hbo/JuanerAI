# Proposal: Xanthil CLI Local Analysis Slice

## Identity and Status

- Change: `CHG-xanthil-cli-local-analysis-slice`
- State: `PROPOSAL`
- Risk: R2 until data-egress, tool-capability, and persistent-run contracts are frozen; expected to reduce to R1 for implementation if the approved synthetic-only boundary holds
- Difficulty: complex
- Delivery path: `greenfield_fast_path`
- Accountable product user: Data Analyst
- Product authority: user approval of `XCLI-INTAKE-001` on 2026-08-20

## Why

Xanthil CLI must prove that Pi can support a professional analysis workflow rather than merely generate SQL or act as a generic coding Agent. The detailed v0.1 plan is intentionally broader than one safe implementation batch. A thin vertical slice is needed to validate the Analysis Gate, controlled analytical execution, Evidence, reproducibility, and Pi Adapter boundary before adding automated Workflows or real-data integrations.

## Goal

Deliver one local, Assistant-only user journey in which a Data Analyst starts Xanthil in a synthetic member-analysis workspace, narrows a vague business question into an explicit Analysis Contract, runs controlled read-only analysis, and receives a reproducible evidence-backed result.

## User Journey

```text
synthetic member-analysis workspace
  -> start `xanthil`
  -> ask whether recent member operations show a problem
  -> review/confirm Analysis Contract
  -> Xanthil profiles and analyzes the approved data
  -> Xanthil validates calculations and uncertainty
  -> Xanthil returns Summary and Evidence
  -> Xanthil writes reproducible run Artifacts
```

## Scope

- One interactive Analyst Assistant entrypoint.
- A two-stage `DISCOVERY -> Analysis Gate -> EXECUTION` flow within one logical Pi-backed Runtime session; its concrete Pi realization is isolated behind the Agent Runtime Port.
- One repository-owned non-sensitive synthetic member dataset with specification-owned metric semantics and reference outcomes.
- Controlled local CSV inspection and read-only SQL/Python analytical execution.
- Evidence links from each material analytical finding to source identity, source snapshot, transformation/query, and output.
- Local run Artifacts with an explicitly versioned, closed contract.
- Provider/model provenance without credential capture.
- Timeout, cancellation, bounded execution, fail-closed tool policy, and explicit failed/cancelled states.
- A Pi Agent Runtime Adapter selected by the personal Profile.
- Executable unit, contract, integration, and end-to-end evidence derived from approved Acceptance Criteria.

## Out of Scope

- Hypothesis-Driven, Deep Research, and Autonomous Exploration Workflows.
- Web Research, arbitrary network tools, external databases, or third-party data connectors.
- Real, sensitive, personal, confidential, or enterprise source data.
- Excel, JSON, Parquet, charts, session resume, and model switching as product promises.
- Decision, Action Recommendation, Automated Decision, Action, or Outcome behavior.
- SQLite operational state, workflow checkpoints, retry orchestration, or a general Trace Platform.
- Desktop, Console, server, enterprise Profile, Ontology, Knowledge, Memory, RAG, Domain Pack, or Model Pack implementation.
- Multi-Agent orchestration, automatic model routing, Pi fork, or pi-xanthil shared-core extraction.
- Independent repository creation or cross-repository writes.

## First Acceptance Scenario

Given an approved synthetic member-analysis workspace and an explicitly selected available Pi model, when the analyst starts `xanthil`, asks the agreed member-operations question, and confirms the proposed Analysis Contract, then Xanthil must:

1. use only the approved fixture and allowed analytical tools;
2. calculate the specification-owned reference metrics correctly;
3. distinguish supported, unsupported, and uncertain findings;
4. produce Summary and Evidence whose material claims trace to reproducible analysis assets;
5. record run status plus runtime/model/data provenance without secrets;
6. avoid forbidden network, destructive, workspace-external, and business-action effects.

The Specification will freeze the fixture, question, confirmation exchange, metric formulae, expected values, output contract, and positive/negative/failure Acceptance Criteria.

## Product Semantics

- `Analysis Contract` is the confirmed task boundary for one analysis run; its exact contract remains to be specified.
- The result is an analytical finding supported by Evidence. It is not an authoritative business fact or a `Decision`.
- An incomplete, failed, cancelled, or evidence-insufficient run cannot be represented as a completed supported finding.
- Memory and Pi session history do not become authoritative Evidence or audit records.

Any new shared term that becomes part of product language must be accepted by the Controller and added to `CONTEXT.md`; filesystem names or implementation types alone do not define product terminology.

## Architecture Direction

- `apps/cli/` owns terminal interaction only.
- `packages/application/` coordinates the analysis use case.
- `packages/product-core/` owns infrastructure-independent analysis rules only where the Specification demonstrates a real rule.
- `packages/ports/` defines business-oriented agent execution, analytical data, and Artifact capability contracts as needed.
- `adapters/agent-pi/` translates Xanthil agent behavior to Pi without leaking Pi SDK types.
- analytical and Artifact Adapters remain separate.
- `profiles/personal/` selects concrete Adapters.
- SDK embedding is preferred after Design validation; Pi RPC is the rollback integration surface.

No executable Port, schema, package-manager, or dependency version is approved by this Proposal alone.

## Data Boundary

- Data class: public-to-project, non-sensitive synthetic fixture.
- Source authority: repository fixture contract.
- Allowed egress: selected model provider may receive fixture content and derived analysis for this Change only.
- Forbidden egress: credentials, secrets, unrelated workspace data, user data, enterprise data, logs from unrelated runs, and project-control records.
- Lineage minimum: fixture identity/version or checksum, source time/snapshot, executed transformation/query, provider/model, and run identity.
- Artifact writes: only the approved run location inside the active workspace.

Later support for real local data or Web Research requires a separate data-flow decision and cannot inherit this synthetic-fixture approval.

## Failure and Lifecycle Direction

- Preflight failure creates no successful run claim.
- Tool, model, validation, or Artifact failure terminates fail-closed and identifies the failed stage.
- User cancellation stops further model/tool work and cannot produce a completed conclusion.
- Automatic retry is excluded unless Design proves it is bounded, observable, and side-effect safe; the default is no product-level automatic retry.
- Partial diagnostic Artifacts may be retained only under the closed run contract and must be visibly non-complete.
- Activation is limited to the personal local Profile and the approved synthetic example.
- Rollback disables the Xanthil entrypoint/Adapter composition without modifying source fixtures or user-owned completed Artifacts.
- Retirement and compatibility are trivial for the first greenfield version, but version identifiers must exist before any persistent run contract is activated.

## Success Evidence

- Exact reference calculations pass deterministically outside the LLM.
- The Pi Adapter passes the same frozen Agent Runtime contract expected of a replaceable implementation.
- A real Pi-backed integration run uses the synthetic fixture and records the selected provider/model.
- Negative tests prove forbidden tools, paths, data classes, network access, and success claims fail closed.
- The end-to-end run produces Artifacts that can reproduce every material calculation.
- Independent validation confirms scope, dependency direction, data boundary, and evidence.

## Dependencies and Gates

1. Specification must freeze Requirements and Acceptance Criteria.
2. Design must resolve SDK versus RPC, package/dependency authorization, tool boundary, Artifact/run structure, and failure mapping.
3. The persistent structure must pass `agentharness-structure-grill` before implementation.
4. The complete Proposal, Specification, Design, Tasks, and validation commands must pass Spec Gate.
5. Test design must establish expected RED before production implementation.
6. A real model call is permitted only after explicit model selection and credential readiness, using the approved synthetic fixture.

## Path Boundary

### Allowed now

- `openspec/changes/xanthil-cli-local-analysis-slice/**`
- `.juanerai/project-control/**` through Controller-owned board updates

### Candidate production and test paths after Spec Gate

- `apps/cli/**`
- `packages/application/**`
- `packages/product-core/**` only for demonstrated infrastructure-independent rules
- `packages/ports/**`
- `packages/contracts/**`
- `adapters/agent-pi/**`
- `adapters/analytics-duckdb/**`
- `adapters/storage-local/**`
- `profiles/personal/**`
- `tests/unit/**`
- `tests/contract/**`
- `tests/integration/**`
- `tests/e2e/**`
- approved repository fixture/example paths named by Design

### Conditional

- root package/workspace manifests and lockfiles: only after package-manager and dependency approval
- `CONTEXT.md`, `docs/architecture/**`, and `docs/adr/**`: Controller-only changes if the Design requires accepted shared terminology or boundary updates
- `docs/product/**`: Controller-owned alignment with the approved Change

### Forbidden

- `apps/console/**`
- enterprise Profile or enterprise integration paths
- Semantica, SQLite, Ontology, Knowledge, Memory, Domain Pack, Model Pack, and action execution implementation
- `openspec/changes/project-board-observability/**`
- `/Users/huangbo/Desktop/**` and any other repository
- global Pi settings, credentials, extensions, packages, or model configuration

## Risks

| Risk | Level | Treatment |
|---|---|---|
| Model receives more data than the product contract allows | High | Synthetic-only scope, narrow tool results, negative egress tests, explicit provider/model record |
| Generic Pi tools escape the analysis boundary | High | No implicit built-ins; explicit tool allowlist and contract tests |
| LLM variability hides calculation defects | High | Deterministic reference oracle and separation of calculation from narrative judgment |
| Global Pi install is mistaken for a reproducible dependency | Medium | Pin an approved project dependency or use a version-checked RPC Adapter |
| Persistent run layout becomes accidental API | Medium | Closed schema plus structure review before implementation |
| Full v0.1 scope leaks into first Change | Medium | Explicit forbidden scope and scope verification |
| Pi model configuration drift | Medium | R4 evaluates explicit `minimax-cn/MiniMax-M3` through the project-local embedded SDK; activation requires real succeeded evidence and never relies on an ambient default or automatic fallback |

## Proposal Exit Condition

The Proposal is ready to advance to Specification and Design when the Controller confirms that it faithfully records the approved `XCLI-INTAKE-001` package. It does not authorize dependency installation, tests, production implementation, model calls, or external data access.
