# JuanerAI Dual-device Module and Path Ownership Matrix — Revised Planning

> Status: frozen product input; planning only; no execution authority
> Date: 2026-08-27
> Boundary: ownership does not create a Change, path, module, Schema, dependency, or write permission

## 1. Ownership principles

- `origin/main` is integration authority; local `main` is a read-only mirror.
- MacBook hosts the Integration Controller and owns product intent, architecture, shared contracts, Xanthil Desktop consumer experience, final integration, and user communication. Under the activated Product Change execution policy, this semantic/path ownership does not make the MacBook the current-Change implementation executor.
- Mac mini is the default implementation device for a later approved Model Pack Provider, Pack-private production logic, and non-Xanthil-private shared infrastructure Adapters.
- One branch and one writing device own a task at a time. Cross-device work uses GitHub branches and PRs; no shared working-directory coordination is assumed.
- Product authority is not inferred from the device that implements a module.
- macOS and Windows are product platforms. MacBook/Mac mini development ownership does not itself prove Windows compatibility; the productization plan must name a real Windows build and acceptance environment before implementation.

## 2. Revised product-role ownership

| Product role | MacBook responsibility | Mac mini responsibility | Controller-only authority |
|---|---|---|---|
| Data Authority | Xanthil Desktop data contract, preparation/cleaning experience, consumer admission, report/feedback linkage | later approved shared/provider-side data Adapter implementation | source/derived authority rules, egress, shared snapshot/evidence contracts |
| Ontology Authority | Desktop consumption and user-visible semantic confirmation | later approved Semantica or shared Ontology Adapter implementation | publication authority, version/hash contract, compatibility and fail-closed rules |
| Hypothesis Asset | run-scoped analysis, evidence/refutation, asset reference and candidate UX | later approved shared asset infrastructure implementation | template/instance/root-cause semantics, lifecycle, promotion, scope, ledgers |
| Strategy Asset | Recommendation, review, task/receipt/outcome, effect feedback UX | later approved shared asset infrastructure implementation | template/instance/Action boundaries, Strategy Gate, effect-ledger semantics |
| Domain Pack | Xanthil consumption experience | later approved SDK/package-private implementation | package contract, acceptance, activation, retirement |
| Model Pack | Xanthil Desktop Consumer and evidence/report integration | Provider, ModelPackBuilder-private implementation, Pack SDK production, independent Consumer | product/data/evaluation contract, MP7–MP9 decisions, package/Runtime contracts, activation |
| Knowledge Capability | in-workflow search/material/provenance UX | later approved shared Knowledge Adapter implementation | trust, provenance, permissions, and non-authority rules |
| Memory Capability | Project/Session context and history UX | later approved shared Memory Adapter implementation | context scope, retention, deletion, privacy, and non-authority rules |

Knowledge and Memory remain separate capability contracts but do not receive independent product-roadmap or top-level UI ownership. The retired phrase “four libraries on one machine” has no current authority.

## 3. Xanthil Desktop ownership

MacBook owns future approved changes to:

- Desktop application shell and product experience;
- Project, Session, central workspace, Inspector, command entry, run/status presentation, and cross-platform product behavior;
- Xanthil Product Core/Application and scenario-owned business Ports;
- Desktop Profile/composition root and Xanthil-private Adapters;
- Data preparation/cleaning, Evidence-based Analysis (循证分析), report, feedback, and asset-candidate consumer behavior;
- Model Pack Desktop Consumer and local/serving product integration;
- Xanthil tests, fixtures, Design, acceptance, and activation/rollback evidence.

This does not grant MacBook ownership of Provider-private model training/build implementation, Semantica internals, shared Pack-private SDK logic, or a future enterprise infrastructure implementation.

Continued CLI feature work is not a current owned stream. Existing CLI code/spec/tests remain protected compatibility surfaces until a separately approved Change names a delta, retirement, or coexistence rule.

## 4. Model Pack Provider ownership

After `DA_REQUIRED_COMPLETE` and explicit Model Pack authorization, Mac mini may own approved Provider-private work for:

- local MLflow training/evaluation/Registry integration;
- candidate Artifact and release-input production;
- `ModelPackBuilder` private implementation;
- installable Pack SDK contents;
- independent Consumer supply-side validation;
- Provider-private fixtures, evaluation reports, and release evidence.

Mac mini does not own:

- the shared Model Pack package contract or `AnalyticalModelRuntime` contract;
- Xanthil Desktop Product Core/Application/experience;
- Data/Ontology authority definitions;
- Hypothesis/Strategy promotion or Decision/Action authority;
- MP7 candidate acceptance, MP8 lock, MP9 release, or final activation;
- phase-two enterprise product scope without a separate approved plan/Change.

## 5. Shared-contract and integration ownership

MacBook Integration Controller exclusively freezes or approves changes to:

- product terminology, ADRs, architecture, planning, and current authority indexes;
- shared Data/Ontology snapshot, Evidence, provenance, asset reference/candidate, Pack, Runtime, and cross-platform contracts;
- root package manifests, workspace/build configuration, shared exports, and canonical validation entrypoints;
- cross-domain contract suites and fixtures;
- Provider/Consumer compatibility and activation/rollback decisions;
- final acceptance evidence and user-decision briefs.

An implementation task that discovers a necessary shared-contract change stops and returns a Contract Change Request. It does not edit the shared surface as an incidental fix.

## 6. Candidate path families

No future path is created or approved by this document. If later Changes use the existing modular-monorepo direction, ownership defaults are:

| Candidate path family | Default owner | Rule |
|---|---|---|
| `products/xanthil/**` | MacBook | Desktop/Product Core/Application/Profile/consumer behavior |
| `packages/domain-pack-sdk/**` | Mac mini implementation, Controller contract | only after a Domain Pack Change |
| `packages/model-pack-sdk/**` | Mac mini implementation, Controller contract | only after Model Pack authorization and Structure/OpenSpec Gates |
| shared contract/index/build roots | Integration Controller | one PR at a time; no parallel writers |
| Xanthil-private Adapters | MacBook | exact exception path frozen per Change |
| shared/provider infrastructure Adapters | Mac mini | exact path frozen per Change; no business-contract ownership |
| tests/fixtures for shared contracts | Integration Controller | provider/consumer may consume but not weaken |
| device-local model/data/runtime state | owning device, untracked | never enters Git without an approved artifact/data contract |

## 7. Stage ownership

| Stage | Primary writing surface | Device |
|---|---|---|
| current documentation-governance revision | `CONTEXT.md`, `docs/adr/**`, `docs/architecture/**`, `docs/planning/**` | MacBook |
| D0 static Demo | separate approved research/demo workspace; no JuanerAI production paths | assigned by user outside this plan |
| D0.5 productization package | JuanerAI planning/Design/Change proposal after authorization | MacBook Controller |
| D1–D5 Xanthil Desktop | MacBook-owned exact product paths; implementation only through the activated current-Change workflow | Mac mini executor under `product-change-execution-policy.md`; MacBook Controller owns decisions and integration |
| Model Pack contract enabler | shared contract paths only | MacBook Controller |
| Provider/SDK/independent Consumer | exact Pack-private paths | Mac mini |
| Xanthil Desktop Consumer | exact Xanthil paths | MacBook |
| activation/integrated acceptance | scoped integration paths/evidence | MacBook Controller |
| phase-two serving Adapter | future separate decision | unassigned |

## 8. Conflict rules

- No MacBook Desktop and Mac mini Provider task writes the same root manifest, export index, shared type, schema, fixture, or contract test concurrently.
- Provider details do not leak into the package or Runtime contract; Consumer UI details do not become Provider requirements.
- Knowledge/Memory infrastructure does not absorb Data/Ontology/Hypothesis/Strategy business contracts because one tool can store them.
- An unplanned Windows issue that changes Runtime, packaging, data boundary, persistence, or shared contract is a Controller decision, not a platform-specific patch.
- Dirty worktrees, branch divergence, unknown device-local config, or ambiguous artifact ownership stop handoff; no stash, reset, force-push, or silent relocation is allowed.

## 9. Not approved

- any product Change or exact future allowed path;
- a four-library platform, generic CRUD service, shared database, registry, Runtime, marketplace, or control plane;
- Model Pack work before `DA_REQUIRED_COMPLETE` and explicit authorization;
- production dependency installation, data placement, training, model/provider call, schema, service, deployment, or Windows packaging mechanism;
- automatic cross-device dispatch, reuse, wakeup, validation, merge, or release.
