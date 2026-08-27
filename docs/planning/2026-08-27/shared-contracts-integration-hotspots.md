# JuanerAI Shared Contracts and Integration Hotspots — Revised Planning

> Status: frozen product input; planning semantics only; no executable contract authority
> Date: 2026-08-27
> Boundary: no executable Port, type, Schema, manifest, fixture, test, path, or Change is created

## 1. Shared-contract rule

A contract is shared only when two independently owned modules must agree on the same business identity, behavior, lifecycle, authority, or failure meaning. Similar fields, one storage product, or possible future reuse is insufficient.

The Integration Controller owns shared-contract intent and compatibility. Each later Change freezes only the smallest executable contract required by its approved scenario. Unknown fields, defaults, enums, statuses, limits, paths, serialization, and error codes remain Pending.

## 2. Current authority versus planning candidates

The current executable authority remains approved OpenSpec, existing Product Core/Application/Ports, and tests. The table below is a future planning map, not a declaration that these contracts exist.

| Candidate ID | Contract seam | Minimum planning semantics | Producer / consumer |
|---|---|---|---|
| `DA-C01` | Data source and snapshot | source authority, identity, time, checksum/version, grain, schema/meaning reference, classification, access, lineage | source/preparation Adapters -> Xanthil Application |
| `DA-C02` | preparation and egress admission | confirmed plan, transformations, validation, local/LLM admission, source recheck, cancellation/failure | Desktop/Application -> local processor/LLM Adapter |
| `EV-C01` | Evidence bundle | Data/Ontology snapshots, method/query/code identity, result, quality, limitations, supporting/refuting role, locator/hash | deterministic processor/Pack/Agent -> analysis/report |
| `ON-C01` | Ontology snapshot | workspace/scope, immutable version/hash, publication authority, compatibility, no-latest fallback | Ontology Provider -> Xanthil/Pack consumers |
| `RUN-C01` | Project/Session/Run/Fork lineage | identities, parent point, inherited snapshots, terminal meaning, cancellation, provenance | Xanthil Application -> Desktop/artifact store |
| `AG-C01` | Agent contribution | bounded role/input/tools/data/stop/output, Runtime provenance, cancellation/failure, non-authority | Agent Runtime -> parent analysis |
| `SP-C01` | Skill/Prompt reference | identity/version, purpose, permissions/data boundary, compatibility, immutable Run binding | configuration capability -> Run/report |
| `HA-C01` | Hypothesis asset reference/candidate | template/version/scope, instance binding, evidence ledger, draft source, no silent promotion | asset capability <-> analysis/report |
| `SA-C01` | Strategy asset reference/candidate | template/version/scope, instance binding, effect ledger, draft source, no Action authority | asset capability <-> report/feedback |
| `RP-C01` | report review and lock | candidate/version, Evidence/limitations/provenance, review decision, immutable lock, no Action authority | Xanthil Application -> Desktop/artifact store |
| `FB-C01` | execution feedback | Recommendation, authorization, task, receipt, Outcome, attribution, uncertainty, two-ledger proposals | feedback source -> Xanthil/Application/assets |
| `MP-C01` | Model Pack package | identity/version/checksum/contract, purpose/prohibitions, input/output, Runtime, permissions, provenance, evaluation, compatibility/revocation | Provider/SDK -> independent/Desktop Consumer |
| `MP-C02` | ModelPackBuilder input | exact MP9 release identity, Artifact/Signature/checksum, contract, Runtime/dependencies, evidence, release decision | MP9 release -> Builder |
| `MP-C03` | AnalyticalModelRuntime | preflight, snapshot confirmation/recheck, single predict, cancellation/deadline, output validation, errors, provenance | Xanthil Application -> local/serving Adapter |
| `MP-C04` | local/serving parity | same Pack and business contract, tolerance, error/provenance mapping, no silent fallback | local Consumer <-> enterprise serving |

Knowledge and Memory retain scenario-specific Port contracts where needed, but they are background capabilities. There is no `KnowledgeProduct`, `MemoryProduct`, generic CRUD, or universal context contract in this map.

## 3. Authority invariants across contracts

- Data/Ontology snapshots are immutable for one Run or inference attempt.
- Evidence references exact snapshots and method identity; narrative cannot substitute for Evidence.
- Hypothesis and Strategy instances are run/context scoped; long-term versions use explicit draft/review/activation.
- Model Pack output is Evidence/prediction, not Decision or active asset.
- Memory context and Knowledge retrieval cannot satisfy missing Data/Ontology/Pack identity.
- Recommendation, Decision, task, execution, receipt, Outcome, and effectiveness remain distinct.
- requested config and observed Runtime/model/Adapter state remain distinct.
- any unavailable, unknown, mismatched, revoked, or stale authority fails closed; no latest, local-copy, or empty-success fallback.

## 4. Integration hotspots

### P0 — Integration Controller exclusive

- `CONTEXT.md`, `AGENTS.md`, ADRs, permanent architecture, and current planning index;
- root manifests, workspaces, exports, canonical build/validation entrypoints;
- shared contract/type locations and their contract suites;
- Data/Ontology/Hypothesis/Strategy/Pack identity and compatibility;
- Profile/composition activation and rollback;
- cross-platform acceptance and final user evidence.

These paths cannot be shared between concurrent product Changes.

### P1 — Xanthil Desktop

- Project/Session/Run/Fork identity and persistence;
- local Python process/data boundary;
- Agent Runtime/Subagent behavior and provenance;
- report/feedback terminal semantics;
- static-Demo-to-production Design traceability;
- macOS/Windows packaging and equivalent behavior;
- compatibility with current CLI behavior and historical Runs.

### P1 — Model Pack Provider/Consumer

- package and Builder-input identity/checksum/Signature;
- Data/Ontology compatibility and input snapshot;
- local dependency/runtime packaging across macOS and Windows;
- Provider-private implementation versus shared package contract;
- independent Consumer versus Xanthil Desktop Consumer evidence;
- future-actuals custody and release/acceptance identity;
- local/serving parity and no-fallback behavior.

### P2 — background capabilities and projections

- Knowledge/Memory trust and privacy boundaries;
- asset, Evidence, and provenance projections into Semantica/graph/search;
- projection version/hash, lag, rebuilding, and fail-closed consumption;
- retention, deletion, index rebuilding, and cross-Workspace scope.

P2 does not mean unimportant; it means no executable shared contract is created until a required scenario reaches it.

## 5. Contract sequencing

### Xanthil required workflow

The likely dependency direction is:

```text
DA-C01/DA-C02 + ON-C01
  -> EV-C01
  -> RUN-C01 + AG-C01 + SP-C01
  -> HA-C01/SA-C01 read/reference subset
  -> RP-C01
  -> FB-C01
  -> optional draft-candidate subset of HA-C01/SA-C01
```

This is a planning dependency, not a required number of Changes. The static Demo and D0.5 productization package determine the smallest approved slice.

### Model Pack

After `DA_REQUIRED_COMPLETE` and explicit authorization:

```text
MP-C01 package + MP-C02 Builder input + MP-C03 Runtime planning
  -> Provider model lifecycle/release
  -> Builder and Pack SDK
  -> independent Consumer
  -> Xanthil Desktop Consumer
  -> activation and future-actuals acceptance
  -> later MP-C04 enterprise parity
```

Provider work may not start from an incomplete contract and then force the Consumer to adopt it.

## 6. Contract-drift stop line

Any task stops and returns to the Controller when it needs to:

- add, remove, or reinterpret shared identity, enum, lifecycle, error, permission, provenance, or compatibility;
- make Knowledge/Memory a product authority or merge multiple authority classes;
- change Data/LLM admission, Ontology binding, Evidence meaning, asset promotion, Decision/Action boundary, or Model Pack contract;
- modify a root/shared path outside its frozen allowance;
- weaken a negative contract test or replace actual evidence with a claim;
- add a new Runtime, Profile, fallback, registry, storage authority, or cross-platform exception.

The task produces the repository Contract Change Request and remains blocked. It does not widen scope or “temporarily” update shared contracts.

## 7. Not approved

- any candidate contract's executable name, field, Schema, path, serialization, status enum, error code, default, limit, or test;
- generic Data/Ontology/asset/Knowledge/Memory APIs;
- shared database, event bus, registry, projection worker, Runtime platform, or SDK;
- a product Change, dependency, data access, model/provider call, training, deployment, or migration;
- concurrent implementation topology before D0.5 or Model Pack intake freezes exact scopes.
