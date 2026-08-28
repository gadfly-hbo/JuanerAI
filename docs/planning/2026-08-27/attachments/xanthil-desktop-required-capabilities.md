# Xanthil Desktop Data Analyst Required Capabilities

> Status: frozen product input; product Change authority not granted
> Product endpoint: complete these five capabilities before Model Pack product work starts
> Boundary: product semantics and acceptance only; no Change, Schema, dependency, test, implementation, data access, or model call is authorized

## 1. Required product journey

The Data Analyst starts from a business question and finishes with a reviewable, evidence-backed report plus explicitly separated execution feedback:

```text
Business requirement
  -> Data preparation
  -> local Data cleaning and aggregate Evidence
  -> Evidence-based Analysis (循证分析): Hypothesis -> Evidence -> Refutation
  -> Report candidate and human lock
  -> Action Recommendation / task / Execution Receipt / Outcome feedback
  -> separate Hypothesis and Strategy writeback proposals
```

The five required capabilities are one product journey, not five unrelated tools. A later Change may deliver them as bounded vertical slices. `DA_REQUIRED_COMPLETE` is reached when their integrated development acceptance succeeds with packaged macOS replay, hosted Windows build/smoke and deterministic cross-platform contracts, independent verification, and explicit user acceptance. Final installed Windows 11 x64 acceptance and platform signing belong to `JUANERAI_PUBLIC_RELEASE_GATE`, not this development Gate.

[`pi-xanthil-business-function-transfer-matrix.md`](pi-xanthil-business-function-transfer-matrix.md) is the complete transfer decision for D0 and D1. These requirements do not depend on reading the pi-xanthil repository, and no unlisted pi-xanthil function is implicitly required.

## 2. Shared product records

The plan requires these semantic records without freezing their executable shape:

| Record | Minimum product meaning |
|---|---|
| business requirement | question, user, objective, decision boundary, exclusions, expected output |
| Data source inventory | source identity, owner, time, location boundary, classification, grain, fields, freshness |
| Data snapshot | immutable identity for the admitted source or derived dataset used by a Run |
| Ontology snapshot | immutable identity/version/hash for the meanings used by a Run |
| preparation plan | extraction, validation, transformation, aggregation, expected outputs, local/LLM admission |
| Evidence | source snapshot, transformation/query or method, result, quality, limitations, supporting/refuting role |
| Analysis Plan | Hypotheses, observable expectations, Evidence needs, refutation conditions, stop conditions |
| Run lineage | Project, Session, parent/Fork relationship, snapshots, Runtime/model, Skills/Prompts, result state |
| Report candidate | Findings, Evidence references, refutations, limitations, Recommendations, provenance |
| locked report | immutable user-approved report version; not a Decision or Action authorization by itself |
| feedback record | Recommendation, authorization if any, task, Execution Receipt, Outcome, attribution, uncertainty |

Identity, serialization, persistence, retention, concurrency, permissions, and exact status vocabularies belong to later approved Changes.

## 3. Data preparation

### Product behavior

Data preparation combines the pi-xanthil-derived business-requirement and data-preparation intent in a Xanthil-owned workflow:

1. capture the business problem, intended decision support, non-goals, target output, time boundary, and accountable user;
2. inventory candidate source data and distinguish source/raw data from prepared and aggregate data;
3. inspect metadata and approved previews without silently reading or transmitting prohibited detail;
4. propose a preparation plan with field meanings, grain, join/key assumptions, validations, transformations, aggregation, and stop conditions;
5. require explicit confirmation before executing the plan;
6. produce a versioned prepared-data summary and Data snapshot with complete lineage.

### Required negative behavior

- Unknown fields, grain, identity, time meaning, currency, units, classification, or permissions remain Pending; the product does not invent defaults.
- A changed source after confirmation invalidates the pending plan or Run; it does not silently continue on new bytes.
- Preparation cannot be reported successful when required validations, outputs, or lineage are missing.
- Viewing metadata or aggregate preview does not grant permission to send data to an LLM.

## 4. Data cleaning and deterministic aggregate computation

### Product behavior

Data cleaning covers pi-xanthil-derived extraction and aggregate-computation functions. The intended boundary is:

```text
source/raw or prepared local detail
  -> approved local Python processing
  -> validated aggregate Data and Evidence bundle
  -> separately admitted LLM context, if the user and data contract allow it
```

The local processor must make extraction, validation, transformation, aggregation, code or query identity, input/output snapshots, quality results, warnings, and failures observable. The user sees the planned and actual operations before relying on the result.

Raw rows, row identities, credentials, source paths, prohibited free text, and unapproved prepared detail do not enter an LLM context. Aggregate output is not automatically safe: it still passes the declared privacy, minimum-group, sensitive-field, and purpose checks frozen by the future Change.

### Technical-input Gate

The D0.5 package at `../../2026-08-28/xanthil-desktop-d05-productization-decision-package.md` is the dedicated local-Python technical proposal received for productization review. No Change that introduces or changes Python execution may start until the user approves that package and the later Python Change freezes its executable contracts against:

- the first-slice Product Core/Application/Port/Adapter/Profile boundaries;
- TypeScript-first direction and the approved Python exception boundary;
- process isolation, environment and dependency ownership;
- filesystem, network, resource, cancellation, deadline, artifact, and cleanup behavior;
- cross-platform macOS and Windows support;
- deterministic validation and data-egress enforcement.

This product input fixes the behavior and data boundary. The approved D0.5 package may additionally fix the Python topology and resource/cancellation terminals; executable process and IPC contracts still belong to the later Python Change.

### Required negative behavior

- Processing failure, partial output, validation mismatch, cancellation, deadline, or source mutation cannot yield admitted aggregate Evidence.
- LLM refusal or unavailability does not prevent deterministic local preparation and Evidence inspection from being reported accurately.
- The product never hides arbitrary shell, Python, SQL, or filesystem execution behind a generic tool contract.

## 5. Evidence-based Analysis (循证分析)

Evidence-based Analysis is the core Data Analyst capability. The analyst can explore competing explanations and branch the investigation, but Data, Ontology, Evidence, permission, provenance, and human Gates always remain in force.

### 5.1 Hypothesis → Evidence → Refutation

Every material analytical claim belongs to one of three explicit stages:

1. **Hypothesis:** a falsifiable, run-scoped statement with applicability and observable expectations;
2. **Evidence:** supporting, refuting, or inconclusive Evidence linked to the exact Data/Ontology snapshots and method;
3. **Refutation:** an active attempt to disprove the Hypothesis, examine alternatives, identify missing Evidence, and state remaining uncertainty.

Correlation, decomposition, prediction, and causal claims remain distinct. A high model score or persuasive narrative does not turn correlation into causality.

### 5.2 Fork

- A Fork starts from an explicit parent point and inherits only the selected immutable snapshots and confirmed context.
- It receives a distinct Run identity and preserves parent/child lineage.
- A Fork may change Hypotheses or method but cannot silently mutate the parent.
- Comparing or bringing a Fork result back to the parent is an explicit user decision with conflicts visible; automatic merge is deferred.

### 5.3 Subagent

- A Subagent receives a bounded analytical role, inputs, allowed tools/data, stop condition, and output contract.
- It cannot authorize data egress, broaden scope, activate assets, make a Decision, or execute an Action.
- The parent analysis treats its result as a provenance-bearing contribution requiring Evidence review, not as authority.
- Cancellation, failure, or disagreement remains visible and does not get repaired by an undisclosed replacement result.

The approved D0.5 package fixes product-level Conversation grain, Runtime binding, queue bounds, overflow, terminal, return, and adoption race semantics. Exact orchestration implementation, persistence schema, process selection, event messages, and Runtime Port delta require the later Structure/OpenSpec Gates.

### 5.4 Offline evidence-bound mode

The user phrase “不联网零幻觉” is made testable as **offline evidence-bound mode**:

- no network or external provider access is admitted;
- every factual analytical claim must reference admitted Evidence or be labeled unsupported/inconclusive;
- unavailable Evidence produces a gap or stop, not an invented answer;
- deterministic results remain distinguishable from model narrative;
- citations resolve to the exact local artifact, snapshot, calculation, or approved asset version;
- the system does not claim that an LLM is metaphysically incapable of hallucination; it prevents unsupported model text from becoming an accepted product Finding.

### 5.5 Skill and Prompt management

- The user can identify which versioned Skill and Prompt configuration a Run used.
- Skills and Prompts declare purpose, allowed capability, data boundary, provenance, and compatibility.
- Editing produces a new version; a Run retains its original reference.
- A Skill or Prompt may shape analysis but cannot override Data/Ontology authority, Evidence requirements, asset Gates, or permissions.
- Marketplace, automatic installation, self-modification, and cross-user publication are deferred.

## 6. Report output

### Product behavior

The report candidate includes:

- confirmed business question, scope, Data and Ontology snapshots;
- supported, refuted, and inconclusive Hypotheses;
- Evidence references and deterministic calculations;
- alternative explanations and refutation attempts;
- Findings, limitations, uncertainty, and prohibited interpretations;
- Action Recommendations clearly distinguished from Decisions and Actions;
- referenced Hypothesis/Strategy assets, Domain/Model Packs, Skills, Prompts, Runtime/model, and Fork/Subagent lineage where applicable;
- data-egress statement and reproducibility information.

The user reviews and either locks, rejects, or returns the report for revision. A locked report is immutable; revisions create a new candidate/version. Report approval is not asset promotion, Strategy authorization, or Action execution.

### Required negative behavior

- Missing or conflicting Evidence blocks the affected Finding or makes it inconclusive.
- A cancelled, failed, or incomplete Run cannot be labeled successful because a Markdown or chart artifact exists.
- The report cannot hide refuting Evidence, material limitations, failed Subagents, or Data/Ontology version mismatch.

## 7. Execution feedback

### Product behavior

The product keeps these events separate:

```text
Action Recommendation
  -> Decision or authorization (when applicable)
  -> task
  -> actual execution
  -> Execution Receipt
  -> observed Outcome
  -> attribution and uncertainty review
```

The first required workflow may use a manual analytical-verification task rather than an external business-action connector. It must still prove that task creation, completion claim, receipt, observed result, and effectiveness conclusion are different records.

Feedback can propose:

- a Hypothesis evidence-ledger entry;
- a Strategy effect-ledger entry;
- a draft asset candidate.

It cannot silently update or activate an asset. The complete promotion contract is in `asset-promotion-and-writeback-gates.md`.

### Required negative behavior

- A task marked complete without a valid receipt does not count as execution.
- A valid receipt without outcome Evidence does not prove effectiveness.
- A before/after change without an approved attribution method is labeled observational and uncertain.
- Recommendation rejection creates no task and does not erase the analytical Finding.

## 8. First productized vertical acceptance scenario

The current plan selects the existing closed synthetic `member-orders-v2` scenario in `../../2026-08-23/attachments/xanthil-first-change-scenario-contracts.md` as the mandatory first integrated Desktop productized vertical baseline. It is completed across the ordered Phase-One Changes; it is not the acceptance scenario for the earlier Session-bootstrap foundation Change. After this plan is approved, only an explicit user product decision and corresponding plan revision may replace it; a Spec author, implementer, platform constraint, or Demo result cannot silently select another fixture or oracle.

The first vertical acceptance must demonstrate in Xanthil Desktop:

1. capture and confirm the frozen member-repurchase business requirement;
2. inventory and locally prepare the exact fixture without data egress;
3. execute the frozen overall and decomposition calculations with independent deterministic validation;
4. compare the four frozen Hypotheses and show supporting/refuting/inconclusive semantics without causal overclaim;
5. create a Fork that tests one alternative explanation while leaving the parent immutable;
6. display one bounded synthetic Subagent contribution as non-authoritative Evidence input;
7. produce and lock a report that cites the exact oracle and permits only the frozen analytical-verification Recommendations;
8. create a manual verification task only after explicit approval, record a synthetic Execution Receipt and later aggregate Outcome, and keep receipt/effect separate;
9. propose separate draft Hypothesis/Strategy writebacks without activation;
10. reload the Project/Session and preserve visible lineage and terminal meaning under the approved persistence contract;
11. complete equivalent user-visible behavior against the supported macOS and Windows contracts, with packaged macOS replay and hosted Windows build/smoke before public-release preparation.

The future Change reuses the exact `member-orders-v2` source fixture and oracle unchanged. Any additional synthetic feedback/Outcome fixture, error vocabulary, UI automation, persistence, and executable contracts must be frozen by that Change and cannot alter the source oracle or turn descriptive contribution into causality.

## 9. Integrated completion Gate

`DA_REQUIRED_COMPLETE` requires all of the following:

- the approved static Demo product surface has been translated into production Design;
- all five capabilities pass their positive, negative, cancellation, and recovery acceptance;
- the first vertical scenario passes packaged macOS replay plus hosted Windows build/smoke and deterministic cross-platform contracts;
- local detail-to-aggregate-to-LLM boundaries are executable and fail closed;
- Evidence, Fork, Subagent, report, feedback, and asset-candidate lineage are visible and reproducible;
- no first-phase behavior depends on continued CLI product development;
- no Knowledge or Memory independent product has been introduced;
- independent validation and explicit user acceptance complete under the Change workflow.

`DA_REQUIRED_COMPLETE` means the Xanthil Desktop required workflow is functionally development-complete and internally accepted. It does not mean final Windows product acceptance, signed/notarized distribution, public release, or production-release readiness. Those claims require a later user-authorized `JUANERAI_PUBLIC_RELEASE_GATE` against one frozen Release Candidate.

Only after `DA_REQUIRED_COMPLETE` may the Controller request authorization to start Model Pack product work. The Gate does not itself start Model Pack.

## 10. Deferred from the required phase

- pi-xanthil functions not listed in the five required areas;
- automatic business Action execution and external connectors;
- enterprise identity, tenancy, policy, deployment, migration, concurrency, recovery, and audit infrastructure;
- generic asset-library administration platform or marketplace;
- FAISS or other vector retrieval without measured scale/quality need;
- automatic Fork merge, autonomous Subagent swarms, self-modifying Skills/Prompts, and background scheduling;
- cross-Workspace asset promotion;
- Model Pack production, installation, inference, or serving before `DA_REQUIRED_COMPLETE`.
