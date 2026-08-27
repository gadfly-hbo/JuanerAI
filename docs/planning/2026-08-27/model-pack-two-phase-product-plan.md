# JuanerAI Model Pack Two-Phase Product Plan — Desktop Revision

> Status: frozen product input; independent Development-Readiness Review PASS; explicit user approval recorded 2026-08-27; Model Pack start authority not granted
> Date: 2026-08-27
> Start condition: Xanthil `DA_REQUIRED_COMPLETE` plus a new explicit user command
> Boundary: no OpenSpec Change, training, dependency, Schema, Runtime, SDK, model/data call, service, deployment, test, or project-control authority

## 1. Product decision

The existing two-phase Model Pack direction is retained:

1. **Phase one:** use local MLflow OSS for training/evaluation/Registry evidence, accept and lock one exact model release, build an installable JuanerAI Model Pack, prove it in an independent Consumer, and complete product acceptance in Xanthil Desktop through a separate deterministic analytical-model Runtime.
2. **Phase two:** run the same released Model Pack through MLflow OSS Model Serving behind a thin Xanthil Enterprise Backend Adapter while preserving the phase-one business contract and provenance.

The sequence changes: Model Pack product work starts only after the Xanthil Desktop Data Analyst required workflow reaches `DA_REQUIRED_COMPLETE`. Continued CLI development and a CLI/Personal Consumer are removed from the current plan.

## 2. Product role

A Model Pack is a versioned executable business-model package with:

- stable identity, semantic version, artifact checksum, and JuanerAI contract version;
- declared business purpose and prohibited uses;
- closed typed business inputs and outputs;
- model identity, Runtime and dependency needs;
- training/source provenance, evaluation evidence, limitations, confidence, and deterministic/stochastic properties;
- data, file, model, and network permissions;
- compatibility, license, revocation, rollback, and retirement information.

It is not a model file, algorithm script, MLflow Registry entry, training repository, provider service, Decision, Knowledge base, or Hypothesis/Strategy asset. MLflow is phase-one production infrastructure; MP1–MP9 is JuanerAI product governance; Xanthil Desktop is the product Consumer.

## 3. Relationship to the Asset and Model Capability Architecture

| Role | Relationship to Model Pack |
|---|---|
| Data Authority | supplies identified training/evaluation/inference snapshots and future actuals; Pack does not own them |
| Ontology Authority | supplies governed business meanings for inputs, outputs, measures, categories, dates, units, and supported actions |
| Hypothesis Asset | may be referenced or supported by a Pack result only through run-scoped Evidence and later asset governance |
| Strategy Asset | may use Pack Evidence in applicability/effect evaluation but is not created or authorized by the Pack |
| Domain Pack | may declare the domain method/workflow that consumes a Model Pack; package identities remain separate |
| Knowledge Capability | may retrieve documentation/material; cannot satisfy Pack or data contract checks |
| Memory Capability | may retain user/Session context; cannot become model input or authority without explicit Data admission |

A Model Pack output is identified analytical Evidence or a prediction. A separate user/policy Decision and Action contract is always required before business effect.

## 4. Start Gate and dependency on Xanthil

Model Pack intake is forbidden until all are true:

1. Xanthil Desktop static Demo was accepted and productized;
2. Data preparation, local cleaning/aggregation, Free analysis, report output, and execution feedback passed integrated macOS/Windows acceptance;
3. `DA_REQUIRED_COMPLETE` received explicit user acceptance;
4. the local Data and Ontology snapshot contracts needed by Model Pack can be referenced without inventing a parallel contract;
5. the user explicitly authorizes Model Pack product work after seeing the completed Xanthil result.

This ordering prevents the model supply chain from defining the analyst product, data semantics, or Desktop workflow. It does not imply the Xanthil Agent Runtime and Model Pack Runtime are the same.

## 5. Retained first scenario

The first scenario remains 28-day product-category demand forecasting. The planning analyst needs category/day forecasts for:

- `order_count`;
- `net_order_amount`;
- a lower and upper nominal 80% interval for both targets;
- stable Pack/model/input/Runtime provenance;
- comparison with the frozen seasonal-naive baseline and key-category regression protection.

The exact re-adopted scenario, data, rolling-origin, WAPE, interval, threshold, real-actuals, and fail-closed semantics live in:

- historical frozen base: [`../2026-08-23/attachments/model-pack-first-scenario-contract.md`](../2026-08-23/attachments/model-pack-first-scenario-contract.md);
- current Desktop replacement: [`attachments/model-pack-desktop-consumer-delta.md`](attachments/model-pack-desktop-consumer-delta.md).

These files form one current product contract. The delta replaces only the historical CLI/Personal consumer and authority-map relationship. Exact algorithms, MLflow version/topology, package encoding, paths, commands, and dependencies remain future OpenSpec/Design decisions.

## 6. Phase one — local released Model Pack

### 6.1 Product chain

```text
approved product/data/evaluation brief
  -> local training and evaluation
  -> MLflow Run/Evaluation/Artifact/Signature/Registry exact version
  -> Controller candidate review
  -> immutable model lock
  -> JuanerAI model release input
  -> ModelPackBuilder
  -> versioned installable Model Pack
  -> independent Consumer verification
  -> Xanthil Desktop installation and local inference
  -> future-actuals product acceptance
```

### 6.2 MP1–MP9 lifecycle

The current plan re-adopts the complete product semantics of [`../2026-08-23/attachments/model-pack-release-lifecycle-gates.md`](../2026-08-23/attachments/model-pack-release-lifecycle-gates.md):

- `MP1 planned`;
- `MP2 assigned`;
- `MP3 training_evaluating`;
- `MP4 handoff_ready`;
- `MP5 controller_review`;
- `MP6 changes_requested`;
- `MP7 candidate_accepted`;
- `MP8 model_locked`;
- `MP9 model_released`.

Re-adoption preserves stage separation, single execution ownership, data/evaluation evidence, bounded revision, Controller acceptance, immutable lock, release checks, and `ModelPackBuilder` input Gate. It does not import external repository paths, commands, workers, historical artifacts, or current model state.

`MP9 model_released` is not SDK completion, independent Consumer acceptance, Xanthil Desktop acceptance, or phase-one completion.

### 6.3 Supply-side minimum

Phase one supplies:

- a reproducible baseline and accepted candidate under the frozen data/evaluation contract;
- exact MLflow Run, Registry version, Artifact, Signature, checksum, dependencies, and limitations;
- an immutable release input approved for `ModelPackBuilder`;
- an installable Pack that has no training-workspace or absolute-path dependency;
- one Adapter-independent package contract suite;
- an independent Consumer that verifies installation, compatibility, local input, single predict, output, repeatability, provenance, cancellation/deadline, and fail-closed behavior without MLflow service or training workspace.

### 6.4 Xanthil Desktop Consumer

Xanthil Desktop installs and verifies the same Pack and calls one scenario-specific `AnalyticalModelRuntime`. The user confirms the Pack and Data snapshot, sees its use and prohibitions, runs local inference, reviews the 28-day result and limitations, and can reference it as Evidence in the existing Project/Session/report workflow.

The Desktop does not absorb MLflow, training, Registry, or Builder behavior. Provider/supply implementation does not modify Product Core, the analyst workflow, or Desktop presentation to make an incompatible Pack appear valid.

### 6.5 Phase-one product endpoint

Phase one is complete only when:

1. one real representative model passes MP1–MP9 under the frozen first-scenario contract;
2. the exact release produces an installable versioned Pack;
3. the independent Consumer verifies the Pack outside the training environment;
4. Xanthil Desktop on macOS and Windows installs the same Pack, validates it, and performs local inference through `AnalyticalModelRuntime`;
5. the Desktop records Pack/model/input/Runtime provenance and distinguishes prediction from Decision/Action;
6. contract mismatch, incompatible Data/Ontology, permission, revocation, cancellation, deadline, changed input, invalid output, and Runtime failure fail closed;
7. Controller-held future actuals are opened only at the authorized Gate and the same released Pack meets the frozen product thresholds;
8. all applicable Change, TDD, regression, independent verification, user acceptance, and archive Gates complete.

Supply-side success alone or synthetic/fixture-only Desktop consumption does not complete phase one.

### 6.6 Phase-one non-goals

- training/experiment UI inside Xanthil Desktop;
- generic model registry, marketplace, hot switching, fallback, multi-model routing, or automatic upgrade;
- external serving, cloud, enterprise identity, or Frontend direct model calls;
- a universal `ModelRuntime` shared with Agent execution;
- automatic Hypothesis/Strategy promotion, Decision automation, or Action execution;
- changing the Data Analyst required workflow to fit the Provider;
- inheriting an external repository, model, version, Artifact, status, or command as JuanerAI authority.

## 7. Phase two — enterprise serving

### 7.1 Goal

Phase two runs the same accepted Pack and contract through MLflow OSS Model Serving. Xanthil Enterprise Frontend calls Xanthil Enterprise Backend; the Backend validates the business request and delegates through a thin `MLflowServingAdapter`. The Frontend never calls MLflow directly.

### 7.2 Entry conditions

- phase one complete with stable Pack identity, manifest, checksum, local execution, and future-actuals evidence;
- an explicitly approved enterprise user/scenario and data boundary;
- frozen identity, authorization, tenancy, network, timeout, retry/idempotency, concurrency, rate limit, observability, audit, deployment, rollback, and disaster/recovery contracts;
- verified parity requirements between local and serving execution;
- explicit user authorization for a separate enterprise Change.

### 7.3 Product behavior

- Backend validates Pack identity/version/checksum, contract compatibility, permission, revocation, request identity, and input snapshot;
- Adapter maps JuanerAI business request/response and stable business errors to MLflow Serving without leaking serving payloads into Product Core or Frontend;
- service/Adapter/model Runtime identity and provenance remain visible;
- retry and idempotency prevent duplicate effect and ambiguous results;
- observed drift, limitation, timeout, or serving mismatch never becomes silent local fallback;
- the result remains prediction/Evidence until separate Decision and Action authority applies.

### 7.4 Phase-two endpoint

The same released Pack produces contract-equivalent product results locally and through the approved service within frozen tolerances; security, failure, audit, rollback, and operational evidence pass; the Frontend has no direct MLflow dependency; and independent verification plus user acceptance complete.

## 8. Runtime and package boundaries

- Deterministic Model Pack inference uses `AnalyticalModelRuntime`, not `AgentAnalysisRuntime` or Pi SDK types.
- A Profile or composition root selects the local or serving Adapter; Product Core/Application do not branch on MLflow or vendor names.
- No registry, automatic fallback, hot switching, or universal Runtime follows from two Adapters.
- Package contract, Builder input, Runtime behavior, local/serving parity, and contract suites are Integration Controller authority.
- Provider-private training/build implementation and Desktop Consumer implementation remain separate ownership surfaces.
- A Pack is a supply-chain input: installation never grants undeclared file, data, model, network, or execution permission.

## 9. Data, safety, and provenance

- training, evaluation, inference, and future-actuals datasets keep separate identities, purposes, checksums, access, and leakage controls;
- input rows and sensitive fields do not enter LLM context merely because local Model Pack inference is allowed;
- logs, artifacts, errors, and reports contain no secrets, credentials, prohibited rows, or training-workspace paths;
- every result identifies Pack, model, input snapshot, Ontology version, Runtime, Adapter/Profile, and Run;
- a prediction never becomes observed Outcome; future actuals remain separately governed Data;
- Model Pack evidence cannot activate a Hypothesis/Strategy asset or authorize Action.

## 10. Product decisions deferred to Model Pack intake

The first Model Pack Change cannot start until these are frozen from current evidence:

1. exact training/evaluation data delivery, identity, permissions, quality, and privacy review;
2. algorithm/candidate objective and accepted dependency/MLflow versions;
3. Pack package format, language/runtime, dependency installation, signing, and revocation mechanics;
4. executable `ModelPackBuilder` input and package contracts;
5. scenario-specific `AnalyticalModelRuntime` behavior, cancellation, deadline, errors, provenance, and contract suite;
6. local Desktop installation/update/rollback and macOS/Windows packaging;
7. exact Provider, independent Consumer, Desktop Consumer, activation, and rollback Change topology;
8. future-actuals custody, opening Gate, and product-acceptance procedure;
9. phase-two enterprise scenario and controls, which remain a later independent decision.

These are not implementer choices. Model Pack intake remains blocked until `DA_REQUIRED_COMPLETE`, explicit start authorization, and these product/technical inputs are available.

## 11. Success and stop line

This plan is development-ready only as a product decision package after its independent Review and explicit user approval. It intentionally stops before the first Model Pack Change. Reviewer PASS, plan freeze, `DA_REQUIRED_COMPLETE`, MP1 planning, or an existing MLflow/model artifact never authorizes training, dependency installation, data access, Pack creation, Runtime work, Desktop consumption, service deployment, or a provider call.
