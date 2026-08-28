# Xanthil Desktop First-Phase Product Plan

> Status: frozen product input; D0.5 package approved; amended by user-approved `D05-XD-PRG-001`; first Product Change authority is conditional on D1-A prerequisite closure
> Date: 2026-08-27
> Platforms: macOS + Windows
> Boundary: this plan creates no OpenSpec Change, implementation, dependency, Schema, test, model/data call, deployment, or project-control authority

## 1. Product decision

Xanthil pauses continued CLI product development and becomes desktop-first. Its first Desktop product is a Data Analyst assistant that carries a user from Data preparation through evidence-bound analysis, report output, and execution feedback. It preserves the reusable Product Core/Application/Port/Adapter/Profile and evidence discipline fixed by the first local-analysis slice, while replacing CLI presentation and historical first-Change sequencing with a macOS and Windows Desktop experience.

The first delivery was a static product-manager Demo reviewed against [`attachments/xanthil-desktop-static-demo-brief.md`](attachments/xanthil-desktop-static-demo-brief.md). The user accepted the dual-mode UI on 2026-08-28, which opened D0.5 productization planning but did not itself authorize a Product Change.

## 2. Product-source hierarchy

| Source | Role | Boundary |
|---|---|---|
| Codex app | mandatory UI and interaction language | reference application shell, hierarchy, density, navigation, Inspector, commands, status, and keyboard behavior; do not copy trademarks or pixel-clone |
| pi-xanthil | historical Data Analyst business-function provenance | the current package's [transfer matrix](attachments/pi-xanthil-business-function-transfer-matrix.md) is the exhaustive D0/D1 scope authority; no external repository lookup is required; pi-xanthil UI, internal types, state numbers, repository, paths, and implementation are not product authority |
| Xanthil/JuanerAI | brand, business semantics, safety, architecture, contracts | always wins for product meaning, data authority, Gates, reuse, and implementation boundaries |

The Desktop uses Xanthil names, content, and brand assets. Internal reducer states, SDK events, provider errors, and test controls belong in technical evidence or Inspector views only when a user needs them; they do not define the primary workflow.

The five required areas and their transferred sub-capabilities are complete in this package. A future authorized read-only study of pi-xanthil may provide design evidence, but it cannot add product scope, fill a missing requirement, or override the transfer matrix without a new user product decision and plan revision.

## 3. Users and product value

### Primary user

The first user is a Data Analyst working locally with approved business data. The user needs to:

- translate a business question into a confirmable analysis scope;
- prepare and clean data without losing authority, meaning, or privacy boundaries;
- explore competing explanations and actively test refutations;
- use Forks and bounded Subagents without losing lineage or control;
- distinguish deterministic calculation, model narrative, evidence, uncertainty, recommendation, execution, and effect;
- deliver a reproducible report and learn from later feedback.

### Product promise

Xanthil helps the analyst move from Data to a traceable decision-support artifact and feedback loop. It does not promise that every analysis yields a cause, that an LLM never emits false text, or that a recommendation is automatically authorized or effective. It makes unsupported claims, missing evidence, boundaries, and uncertainty observable and prevents them from silently becoming accepted Findings or active assets.

## 4. First-phase endpoints

### Endpoint D0 — static Demo acceptance

The user can review a synthetic Xanthil Desktop application shell and complete the intended five-area journey through static/simulated interactions. The Demo makes information hierarchy, key states, human Gates, failures, Inspector content, and cross-platform desktop intent concrete.

Acceptance result is `approved_for_productization_planning`, `changes_requested`, or `rejected`. Approval does not authorize production development.

### Endpoint D1 — Data Analyst required workflow

On both macOS and Windows, one approved synthetic Project/Session completes:

```text
Data preparation
  -> local cleaning/aggregation
  -> Evidence-based Analysis (循证分析) with Hypothesis/Evidence/Refutation
  -> report review and lock
  -> execution feedback and separate asset writeback proposals
```

The detailed positive and negative acceptance is frozen in [`attachments/xanthil-desktop-required-capabilities.md`](attachments/xanthil-desktop-required-capabilities.md). D1 is complete only at `DA_REQUIRED_COMPLETE`.

### Endpoint D2 — Model Pack start Gate

After D1 is accepted, the Controller may request explicit authorization to start Model Pack product work. Model Pack does not start merely because the plan or D1 Gate exists.

## 5. Required capabilities

### 5.1 Data preparation

Xanthil combines business-requirement intake with source/raw/prepared/aggregate data preparation. The user confirms the question, decision boundary, source inventory, grain, field meanings, time, transformations, validations, outputs, egress, and stop conditions before execution.

### 5.2 Data cleaning

Extraction, validation, transformation, and aggregate computation occur locally through an approved Python boundary. Source/raw and unapproved prepared detail do not enter an LLM. Admitted aggregate Evidence still requires privacy and purpose checks.

The D0.5 package at [`../2026-08-28/xanthil-desktop-d05-productization-decision-package.md`](../2026-08-28/xanthil-desktop-d05-productization-decision-package.md) supplies the user-approved local-Python technical proposal and product-level process, dependency, IPC, persistence, resource, cancellation, and security boundaries. It passed fresh Development-Readiness Review 002; executable contracts belong to the later Python Change.

### 5.3 Evidence-based Analysis (循证分析)

Evidence-based Analysis is the core capability:

- run-scoped Hypotheses must be falsifiable;
- supporting, refuting, inconclusive, and missing Evidence remain visible;
- refutation and alternative explanations are required before an accepted Finding;
- a Fork preserves immutable parent/child lineage;
- a Subagent is bounded, non-authoritative, observable, and cancellable;
- offline evidence-bound mode admits no network and no unsupported factual Finding;
- every Run identifies the exact Skills and Prompts used without allowing them to override authority or promote assets.

### 5.4 Report output

The analyst reviews a report candidate containing Data/Ontology snapshots, Findings, competing Hypotheses, Evidence and refutations, limitations, uncertainty, Recommendations, provenance, Fork/Subagent contributions, and data-egress statement. Locking creates an immutable report version, not a Decision, Action, or asset-promotion event.

### 5.5 Execution feedback

The product separately records Recommendation, authorization, task, execution, Execution Receipt, Outcome, attribution, and uncertainty. The required phase may use a manual analytical-verification task; it does not introduce an external business-action connector. Feedback can propose draft Hypothesis or Strategy learning but cannot activate it.

## 6. Asset and Model Capability Architecture

The Desktop consumes the permanent architecture in [`../../architecture/asset-and-model-capability-architecture.md`](../../architecture/asset-and-model-capability-architecture.md):

- Data + Ontology are foundational authorities;
- Hypothesis + Strategy are governed long-term assets;
- Domain Pack + Model Pack are executable capability packages;
- Knowledge + Memory are distinct background capabilities, not independent products.

### Desktop presentation consequences

- There is no peer “four libraries” top-level navigation.
- Data and Ontology version/authority appear where the user verifies inputs and Evidence.
- Hypothesis and Strategy appear as run work and reusable asset references; lifecycle administration is not automatically a first-phase product area.
- Knowledge retrieval and Memory/context appear within Project, Session, search, history, and Inspector experiences without becoming standalone products.
- Domain/Model Pack identity appears where a Run consumes the Pack, not as a generic knowledge source.

### Writeback

The required contract is [`attachments/asset-promotion-and-writeback-gates.md`](attachments/asset-promotion-and-writeback-gates.md). The first productized slice may remain read-only for reusable assets. If it exposes writeback, it may create only an explicit draft candidate with source Run and scope; promotion, activation, conflict, and cross-Workspace behavior require their own approved contract.

## 7. Reuse of the first local-analysis slice

### Reused direction

- Product Core owns closed business values and validation without infrastructure SDKs.
- Application sequences business use cases, Gates, Run semantics, cancellation/deadline admission, and terminal meaning.
- business Ports isolate analytical data, execution, artifacts, Runtime, assets, Knowledge, and Memory as their approved scenarios require.
- Pi, Python/DuckDB, files, databases, Semantica, model providers, and future infrastructure remain Adapters.
- a Desktop Profile/composition root selects Adapters; Desktop is an experience surface over Application.
- Application remains the single semantic writer; Adapters do not invent business status, provenance, or success.
- exact source preflight, physical recheck, immutable terminal evidence, no hidden repair, and stable failure meaning remain baseline principles.

### Not promoted into Desktop assumptions

- the CLI entry, command syntax, terminal output, or CLI/Profile harness;
- Pi-specific types, event structures, errors, tools, or Session objects;
- the historical fixed model, one in-memory Pi Session, time budgets, fixture, metric, state numbers, or `.mjs` exception as universal Desktop defaults;
- a claim that current CLI persistence, cancellation, Runtime, or Artifact contracts already satisfy Desktop, Fork, Subagent, report, feedback, or cross-platform requirements.

Every productization Change names the exact reused current contract, the intended delta, compatibility, activation, rollback, and tests. “Reuse the existing architecture” is not enough.

The first integrated productized vertical is not an implementer choice: it must use the re-adopted `member-orders-v2` source fixture and oracle named in the required-capabilities attachment. It is completed across the ordered Phase-One Changes and is not the acceptance scenario of the earlier Session-bootstrap foundation Change. Replacing that baseline requires an explicit user product decision and plan revision before a different integrated vertical can be drafted.

## 8. Desktop application shape

The planned product shell contains:

- Projects as durable business work contexts;
- Sessions as user-visible analytical work threads;
- a central conversation/task workspace for the current question, plan, analysis, and report;
- an Inspector for Data/Ontology snapshots, Evidence, provenance, Run/Fork lineage, asset/Pack versions, errors, and audit detail;
- command entry for discoverable product actions;
- visible run and blocking state;
- dialogs/drawers for confirmation, comparison, review, and scoped settings.

This shape is product intent, not a component or state-management specification. The accepted Demo opened the D0.5 technology decision; the candidate package selects Electron subject to its own Review and user Gate. The chosen technology must support macOS and Windows and preserve Application/business boundaries.

## 9. Data and LLM boundary

| Data state | Local deterministic processing | Local Model Pack inference | LLM context |
|---|---|---|---|
| source/raw detail | only under confirmed Data contract | deferred to a specific Pack input contract | prohibited by default |
| prepared detail | allowed locally under confirmed plan | later Pack-specific decision | prohibited by default |
| admitted aggregate Data | allowed | later Pack-specific decision | allowed only under explicit egress record and privacy checks |
| Evidence metadata/result | allowed | may be referenced | allowed when the declared contract permits it |
| credentials/secrets | prohibited from analytical artifacts | prohibited | prohibited |

Model/provider authorization is separate from data admission. A future real-model acceptance requires an explicit user authorization and Change-specific data boundary; the static Demo and plan use synthetic content only.

## 10. Staged sequence

| Stage | Product result | Entry Gate | Exit Gate |
|---|---|---|---|
| D0 static Demo | reviewable Desktop product surface | this plan's product input | user Demo decision |
| D0.5 productization decisions | desktop technology, reuse/delta, local Python technical boundary, first Change shape | Demo approved | user approves complete productization input |
| D1 foundation vertical | Project/Session shell and one reusable Application-led path | new Change explicitly authorized | scoped acceptance and archive |
| D2 Data preparation/cleaning | confirmed local data-to-aggregate path | required contracts approved | positive/negative/cancellation/recovery evidence |
| D3 Evidence-based Analysis (循证分析) | Hypothesis/Evidence/Refutation, Fork, bounded Subagent, offline evidence-bound mode, Skill/Prompt provenance | D2 accepted | scoped acceptance and archive |
| D4 Report output | candidate/review/lock and reproducibility | D3 accepted | scoped acceptance and archive |
| D5 Execution feedback | task/receipt/outcome distinction and draft writeback proposal | D4 accepted | integrated acceptance |
| `DA_REQUIRED_COMPLETE` | five-capability development journey accepted with macOS packaged replay and Windows hosted CI evidence | D1–D5 evidence complete | explicit user acceptance; not public-release readiness |
| Model Pack intake | revised two-phase plan may be activated | `DA_REQUIRED_COMPLETE` | separate user authorization |
| `JUANERAI_PUBLIC_RELEASE_GATE` | same frozen Release Candidate passes final Windows 11 x64 installed acceptance, macOS Developer ID signing/notarization, Windows Authenticode signing, and cross-platform install/rollback verification | explicit user command to prepare formal JuanerAI release | explicit public-release decision |

Stages do not pre-authorize a fixed number of Changes or allow concurrent work. After D0.5, the Controller chooses the smallest Change topology that preserves a usable vertical slice and the governance workflow.

## 11. Failure, cancellation, and recovery

The product must expose the business reason and allowed next action for at least:

- invalid, changed, unavailable, or prohibited Data;
- unknown or mismatched Ontology version;
- unconfirmed business requirement, preparation plan, analysis plan, report, or Strategy;
- local cleaning/aggregation failure or partial result;
- prohibited LLM egress or offline-network attempt;
- insufficient, conflicting, stale, or non-reproducible Evidence;
- Fork conflict, Subagent failure/cancellation, Skill/Prompt incompatibility, and Runtime/model failure;
- report rejection, cancellation, or unsuccessful lock;
- missing/conflicting Execution Receipt or Outcome evidence;
- asset/Pack version mismatch or projection lag.

No hidden retry, fallback, repair, latest-version substitution, partial-success claim, or silent writeback is allowed. Exact retry, resume, persistence, and recovery semantics are frozen per approved Change.

## 12. First-phase non-goals

- continued CLI product development or CLI/Desktop feature parity;
- independent Knowledge, Memory, or Ontology products;
- complete pi-xanthil function parity beyond the five required areas;
- Model Pack production or consumption before `DA_REQUIRED_COMPLETE`;
- automatic business Actions, generic action connectors, or effectiveness claims without Outcome evidence;
- universal asset-management platform, automatic cross-Workspace learning, or vector-search platform;
- enterprise identity, tenancy, isolation, policy, audit, storage, deployment, migration, concurrency, recovery, or administration;
- background autonomous agents, automatic Fork merge, self-changing Skills/Prompts, or hidden repair loops;
- a production promise of absolute “zero hallucination.”

## 13. D0.5 productization decision status

The D0.5 package passed fresh Review 002 and was approved as one whole on 2026-08-28. The following decisions are frozen product input rather than permission for an implementer to guess:

1. Desktop technology and packaging approach for macOS and Windows;
2. exact first product Change and which existing Runtime/Port/test contracts it reuses;
3. local Python technical proposal and its cross-platform, security, dependency, and lifecycle implications;
4. Project/Session persistence, identity, retention, deletion, recovery, and migration scope;
5. exact Fork/Subagent Runtime, concurrency, cancellation, sandbox, and merge boundaries;
6. exact Skill/Prompt administration surface and version authority;
7. first writeback scope: read-only asset snapshot only or draft candidate creation;
8. real-model/provider and data-egress contract, if any;
9. exact accessibility, keyboard, responsive, performance, resource, and packaging acceptance;
10. development activation and rollback from current CLI behavior to the first Desktop behavior without rewriting historical Runs;
11. `D05-XD-PRG-001`: final Windows real-host acceptance and both platform signing requirements are deferred to `JUANERAI_PUBLIC_RELEASE_GATE`, without weakening development test/CI evidence or permitting public distribution.

The current authorized artifacts are the D0.5 decision package, Structure Decision Ledger, baseline attestation, independent review, and project-control records. No OpenSpec Change, dependency, schema, test, implementation, provider/model call, or DISPATCH is authorized before D0.5 approval and the later D1-A/Gates.

## 14. Success definition

Xanthil Desktop first phase succeeds only when:

- the user has approved the static product surface and the later production Design matches it or records an approved delta;
- one Data Analyst completes the five-area journey on macOS and Windows;
- source/raw detail stays inside its approved local boundary and only admitted aggregate Evidence reaches an LLM context;
- Hypothesis, Evidence, Refutation, deterministic calculation, model narrative, Findings, Recommendation, execution, receipt, and Outcome remain distinguishable;
- Fork and Subagent contributions retain visible scope and lineage;
- locked reports and terminal Runs are reproducible and honest about limitations;
- asset writeback is explicit, draft-first, versioned, and fail-closed;
- no Knowledge/Memory independent product, hidden network call, silent fallback, automatic promotion, or automatic Action has appeared;
- all Change-level Gates, expected RED, GREEN, regression, independent verification, user acceptance, and archive complete.

This success does not include Model Pack. It unlocks only the right to request Model Pack start authorization under the separate plan.
