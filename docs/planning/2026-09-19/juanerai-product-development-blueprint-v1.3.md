# JuanerAI Product Development Blueprint v1.3

## Document control

| Field | Value |
|---|---|
| Version | `1.3` |
| Change type | Compatible consolidation of four core views; product route, target users, frozen first slice, value endpoint and core acceptance boundary are unchanged |
| Product authority | Current explicit user decisions and this approved development blueprint |
| Core reference | JuanerAI Whitepaper v3.3.4, `JUANERAI_WHITEPAPER.md` |
| Whitepaper SHA-256 | `429a58a6772aacf162b49d66e86b36dc2c5f0b068af7e25b1554206ec7703f4b` |
| Whitepaper source size | `252757` bytes |
| Source date | 2026-09-19 |
| User decision | On 2026-09-19 the user requested formal adoption of the four discussed core views, including IR, as a refinement of the Blueprint and a standing reference for future development |
| Current status | `APPROVED_CURRENT / DEVELOPMENT_READINESS_REVIEW_001_PASS` |
| Development-readiness | Fresh read-only [Review 001](reviews/blueprint-v1.3-development-readiness-review-001.md) `PASS`; no required additions |
| Supersedes as current entry | [Blueprint v1.2](juanerai-product-development-blueprint-v1.2.md) |
| Historical effect | v1.0/v1.1/v1.2 remain immutable history; retained first-slice attachments and approved amendments continue to govern that batch |

This document is the highest product-development execution guideline for
JuanerAI. It translates the Whitepaper's product and commercialization direction into development
sequence, Change-selection rules, Gates and evidence. It does not itself
authorize an OpenSpec Change, dependency installation, implementation, provider
call, real-data use, user study, release or cross-device handoff.

## 1. Authority, versioning and Whitepaper adoption

### 1.1 Distinct document roles

- The **JuanerAI Whitepaper** is the core reference for product definition,
  commercial direction, capability landscape and recommended architecture.
- The **JuanerAI Product Development Blueprint** is the highest guideline for
  development execution. It decides what is developed next, the product phase,
  vertical-slice boundary, evidence required to advance and the Gates that must
  be satisfied.
- OpenSpec, Design, Tests and implementation refine an approved Blueprint
  decision. They do not select a different product route by themselves.

### 1.2 Whitepaper-to-Blueprint update rule

Whitepaper changes enter JuanerAI development only through this sequence:

```text
Whitepaper update
-> user explicitly notifies the JuanerAI development context
-> Controller freezes the exact source version and fingerprint
-> Controller compares it with the current Blueprint
-> each material item is classified as adopted, deferred or not applicable
-> the user approves the proposed Blueprint revision
-> a fresh Product Plan Development-Readiness Review returns PASS
-> the approved Blueprint is integrated into JuanerAI project rules
-> later Changes use the new Blueprint
```

A Whitepaper update never silently changes a frozen Change, replays prior
authority or proves that a capability is implemented. A Blueprint update does
not activate a Change until that Change separately passes its UI, specification,
test, implementation and validation Gates.

### 1.3 Blueprint versioning

- A compatible addition that leaves the product route, target users, first
  vertical slice, value endpoint and core acceptance boundary unchanged
  increments the minor version.
- A non-semantic correction increments the patch version.
- A change to any of those load-bearing product decisions increments the major
  version.
- New versions preserve prior versions as immutable decision history.

Whitepaper v3.3.4 retains the v3.3.3 personal-to-team-to-enterprise route and
explicitly states that OSM/PIM does not modify frozen development scope. Its
adoption was Blueprint v1.2. v1.3 consolidates the four agreed views without
changing those decisions or adopting a newer Whitepaper.

## 2. Product purpose, users and stop lines

JuanerAI helps data-driven decision users make better decisions by connecting
Data -> Decision -> Action -> Outcome with evidence, provenance, authorization
and responsibility. Xanthil Desktop Free is the first market and development
entry. JuanerAI Workspace and Enterprise extend the same product core to team
and organization scopes.

The initial user is a non-technical business or analysis professional. The
product must be understandable and operable without reading source code, JSON,
SQL, Python, hashes, terminals or logs.

The following rules apply to every product phase:

1. The actual product UI is the user-facing product and final user-acceptance
   surface. CLI output, tests, logs and Validator evidence support technical
   proof but cannot replace UI acceptance.
2. UI is established first as a change-scoped product contract. Simulated
   states are labeled and never claim real computation, persistence, Runtime or
   integration behavior.
3. Final acceptance exercises real integrated behavior through the supported
   public product entry point; fixture replay cannot substitute for it.
4. Completed JuanerAI source, tests, accepted OpenSpec, TypeScript migration,
   CLI/local-analysis, Model Pack contract-enabler and architecture boundaries
   remain reusable.
5. The withdrawn 2026-08-27 and 2026-08-28 Desktop and Model Pack plans remain
   `VOID`; this Blueprint does not reactivate their sequence or permissions.
6. Research Demos are requirement and design references only. Their code,
   lifecycle status and PASS evidence never become production implementation or
   acceptance by reference.

## 2.1 Four core views — 四个核心视图

These views are the Blueprint's decision-making summary, not four new products
or four extra approval Gates. Read them together when selecting a Change,
reviewing scope, assigning architectural responsibility or revising priorities.

| View | Question it answers | Canonical detail |
|---|---|---|
| Product capability landscape — 产品能力全景 | What must the complete product eventually cover? | Section 4: six lines plus two cross-cutting capabilities |
| Phased vertical-slice delivery — 产品演进与纵切路线 | Which complete user outcome comes next, and what proves progress? | Sections 5 and 8: phase route and evidence-led selection |
| System architecture — 系统架构与模块职责 | Which front-end, shared business and execution modules own the behavior? | Section 10: logical module map, dependencies and IR compilation chain |
| Competitive value — 核心竞争力与价值验证 | Why would the user choose and keep using JuanerAI? | Section 11: differentiated capability hypotheses and comparative evidence |

The combined rule is: **cover the full approved capability landscape, deliver
it through small end-to-end user outcomes, preserve module ownership, and test
whether the result creates differentiated value**. A feature inventory alone,
a technically elegant module alone or a Demo PASS alone cannot select a Change.
IR is explicit across these views, not a fifth view or an isolated compiler
project. Section 8 incorporates their use into the existing proposal.

## 3. OSM/PIM dual business lines and the unified workbench

Whitepaper v3.3.4's dual business lines are adopted as product positioning and
Change-classification context:

| Business line | Responsibility | Result boundary |
|---|---|---|
| OSM — Objective & Strategy Management System | Own goals, measures, gaps, strategy combinations, actions and business review | Completing an action does not prove a goal was achieved; an improving metric does not by itself prove strategy incrementality |
| PIM — Problem & Insight Management | Organize questions, requirement clarification, analysis framing, investigation, evidence judgment, bounded insight and follow-up | A bounded judgment may complete without an Objective; an insight or recommendation does not authorize an action |

Xanthil Desktop provides one work experience for both lines. OSM and PIM reuse
the same Analysis Core, DAME methods, Contract/Context/Binding/IR chain,
Semantic Context Runtime, data execution, evidence and governance. They do not
create two analysis engines, two workbenches, two Runtime stacks or parallel
copies of shared business objects.

The first membership-repurchase vertical slice is a **PIM problem-driven,
hypothesis-first personal workflow**. It does not require an OSM Objective or
Gap. This classification does not change its approved behavior or scope.

OSM may enter a later bounded scenario when an actual consumer needs a
goal-gap-strategy loop. Full OSM is not a prerequisite for Desktop personal
value, PIM investigation or the current first slice.

## 4. View 1 — Product capability landscape

The Whitepaper's six lines plus two cross-cutting capabilities are the full
coverage commitment. They are not eight products, architecture layers or serial
phases; the DAME six method families and Whitepaper 6+1 architecture are different
classifications. The following paths guide sequencing, not pre-authorized Changes.
The phase numbers refer to section 5.

| Area | Target product behavior and completion evidence | Staged path and representative research references |
|---|---|---|
| C1. OSM/PIM business lines | Users can investigate a problem without a mandatory Objective, or pursue a governed goal-gap-strategy-action-review loop; analysis and evidence connect both without duplicate authority. | Phase 1 PIM case; phase 2 clarification and reusable investigation; OSM through a bounded goal scenario in phases 2–4 as demand warrants, then organization use. PX-030/042; PX-029/033/048. |
| C2. Three analysis modes | Hypothesis-first, deep research and autonomous exploration each complete a bounded investigation and can explicitly compose; discovery remains a candidate until evidence judgment. | Phase 1 hypothesis-first; phase 2 independent research/exploration slices, then explicit composition. PX-004, PX-009/010/012. |
| C3. Product matrix and growth | Non-technical personal use, repeat value, team review and enterprise operation each work in their own supported scope, with adoption/value evidence rather than downloads alone. | Phases 1–5: Desktop Free → repeated use → Workspace → one enterprise pilot → Enterprise. CLI companion and Packs reuse the core. PX-006/021/051/058. |
| C4. Methods and capability expansion | Description, diagnosis, causal analysis, prediction, exploration and optimization have scenario-appropriate methods, applicability checks and verified results; Domain Packs compose expertise and Model Packs supply governed models. | Phase 1 bounded comparison/contribution; phase 2 onward grow all six families through consumer slices; local model use and enterprise Serving have separate Gates. PX-038/039, PX-016/028, PX-005/046. |
| C5. Decision and value validation | Users distinguish evidence, bounded judgment, strategy candidates, risk/resource comparison, approval, actual action, independent receipt, outcome and attributable effect or uncertainty. | Phase 1 judgment/candidates without execution; phases 2–3 reusable decisions/review; phases 4–5 bounded authorized action and outcome review; phase 6 only conditional automation. PX-034/037/049/050/059. |
| C6. Asset accumulation and evolution | A Case can be reused; eligible Hypothesis/Strategy or other typed candidates pass their Owner/Gates into immutable versions; Teach corrections are tested, published and explicitly adopted by later tasks. | Phase 1 preserved Case; phase 2 reuse and bounded correction/promotion; phase 3 controlled sharing/migration; phases 4–5 organization evolution. PX-002/015/035/036/054. |
| A. Data, semantics and execution | Business intent binds to permitted, versioned context and physical data, becomes executable/verifiable IR, and retains truthful computation, provenance, comparison and supported recovery. | Minimum chain in phase 1; richer bindings, IR reuse and semantic/method composition in phase 2; authorized organization sources in phases 3–5. PX-014/031/032/038/041/045. |
| B. Trust and human responsibility | Evidence, counterevidence, uncertainty, citations, applicable judgment layers, Agent evaluation, privacy, authorization and independent proof are visible and enforceable. | Minimum trust from phase 1; extend applicable checks with each new mode, method and responsibility, not only at Enterprise. PX-040/043/047/053. |

“Complete” applies to the approved supported scenarios, with positive, negative
and real integrated acceptance evidence; it does not mean solving all possible
business problems. None of the rows is marked production-complete by this
revision. The dated Whitepaper and research references describe research
coverage, not current production acceptance; section 10.1 lists reusable
foundations separately.

### 4.1 Coverage cannot silently disappear

At each product-phase review and Blueprint revision, the Controller accounts
for all eight areas in the existing plan: accepted behavior and evidence,
remaining target, next candidate phase/slice, dependencies and revisit point.
A deferred item keeps its target and a named revisit condition (for example,
current-slice acceptance or phase-2 review); “later if needed” without a return
point is insufficient. Current evidence gaps remain explicit rather than
filled by Demo counts, source-file presence or interface names.

The paths above are planning allocations, not a fixed backlog or a promise to
build every capability in the next Change. Feedback may reorder or reshape
their slices. Removing a previously approved target capability requires an
explicit user-approved Blueprint revision. This rule uses existing planning
records; it creates no separate capability registry, board or lifecycle.

Each selected Change identifies applicable areas and briefly explains the
remaining deferrals/non-applicability. New methods, Packs, Runtime, storage or
governance machinery must serve its concrete outcome. Full landscape coverage
and demand-led vertical delivery constrain each other.

## 5. View 2 — Phased vertical-slice delivery

| Phase | Product outcome | Evidence required before advancing |
|---|---|---|
| 0. Minimum shared definitions | Establish only the identities, versions, Contract, Context/Binding, IR, Decision Case, provenance and Adapter boundaries required by the selected personal vertical slice. | The Case persists, reopens, preserves history and expresses precise references. |
| 1. Xanthil Desktop Free personal value | One non-technical professional completes one real local task from data and question to evidence, bounded judgment, decision candidates and a reopenable Case. | Technical acceptance through the actual Desktop UI, followed by a separately approved real-user and authorized-real-data value-validation plan. |
| 2. Repeated personal value | Add the smallest capabilities that let users return: Case reuse, templates, supported formats, personal asset retrieval, periodic reruns or an evidenced adjacent workflow. | Real repeated-use, retention and collaboration-demand evidence under a predeclared validation plan. |
| 3. JuanerAI Workspace | Add controlled personal-asset migration, sharing, comments, review, versioning, basic permissions and team value reporting. | Real multi-person review and reuse, correct permission/history isolation, team-value evidence and tested willingness to adopt or pay. |
| 4. One enterprise scenario pilot | Use bounded enterprise data, semantic binding, human approval, execution receipt and feedback in one measurable scenario. OSM is included only when the scenario needs goal-gap-strategy ownership. | An approved baseline, Owner, data/authorization boundary, guardrails, takeover and exit conditions, plus a reviewable value report. |
| 5. JuanerAI Enterprise | Expand identity, audit, deployment, connections, model and OSM governance, multiple teams and decision domains on proved pilot value. | Separate acceptance for each organization, data domain and Runtime environment, plus sustained value and risk evidence. |
| 6. Conditional limited-domain automation | Expand action authority only in sufficiently validated, explicit domains. | Independent authorization, monitoring, stop/revoke, human takeover and applicable rollback or compensation. |

CLI remains a professional companion. Domain Packs, DAME methods and Model
Packs are horizontal capabilities introduced by real consumer demand. Model
Pack local consumption and enterprise Serving keep separate Gates and do not
become prerequisites for personal Desktop value.

### 5.1 Delivery method and feedback

Use outcome-led development, vertical slices and iterative discovery: one
understandable user job crosses the UI, business logic and necessary execution
boundaries; it produces usable evidence before broader investment. Do not build
all front ends, then all shared modules, then all back ends as separate phases.
Architecture evolves within the approved responsibility boundaries.

Technical acceptance, personal usefulness, repeated value, team demand and
enterprise value are distinct evidence levels (section 9). They need not turn
every small Change into a new long-duration market study. Discovery and design
may proceed alongside approved validation; advancing a product phase or claiming
value still requires its stated evidence. Research, real-user study and real
data access retain separate permission boundaries.

## 6. UI-first product delivery

Every product Change that changes observable product behavior follows:

```text
product goal and supported user task
-> change-scoped high-fidelity clickable UI Contract
-> user UI Gate
-> OpenSpec, Design and Tasks
-> Spec Gate
-> Test Design and expected RED
-> implementation
-> GREEN and regression
-> independent validation
-> user acceptance through the real integrated UI
```

The accepted PX-2026-004/006 Xanthil product mode remains the Desktop baseline.
It includes the quick/professional shell, professional six-stage workbench,
Project/Session/Run and child-conversation navigation, Composer, Skill, Prompt,
Fork, Subagent, report entry, right-side context/evidence/task/provenance
surface, global command access and accepted accessibility behavior.

Visible capability does not mean production activation. A capability outside
the selected Change stays explicitly `Preview` or unavailable and cannot
fabricate persistence, model calls, child work, reports or recovery. Later
activation reuses the accepted interaction semantics through a new change-scoped
UI Contract and UI Gate; it does not invent a replacement product shell.

The binding first-slice UI and state attachments remain:

- [Xanthil Desktop UI Contract v1.0](../2026-09-18/xanthil-desktop-ui-contract-v1.0.md),
  27091 bytes, SHA-256
  `424da902b0f7fcb3cca2ef9e7bf7a85a1e6fe9aead9ffa287f476f469daa6b1a`;
- [Xanthil Desktop UI Contract v1.1](../2026-09-18/xanthil-desktop-ui-contract-v1.1.md)
- [PX-2026-004/006 Adoption Map v1.0](../2026-09-18/xanthil-ui-reference-adoption-map-v1.0.md)
- [Child-Conversation, Adoption and Closure Matrix v1.0](../2026-09-18/xanthil-ui-state-and-closure-matrix-v1.0.md)
- [Accepted UI Reference Plates](../2026-09-18/attachments/xanthil-ui-reference/README.md)

UI Contract v1.1 is an amendment and remains read with the frozen v1.0 base;
it is not a self-contained replacement. The fingerprints above prevent a later
reader from silently substituting a different base while applying v1.1.

## 7. Current first vertical slice

The first vertical slice remains unchanged:

> A non-technical membership-operations analyst uses the Desktop UI to import
> authorized local member and order data, state and confirm a repurchase
> hypothesis, review the analysis plan, run real local computation, inspect
> supporting and refuting evidence, reach a bounded judgment, compare decision
> candidates or record insufficient evidence, and save, reopen, rerun and
> export the Decision Case.

Its first technical acceptance remains deliberately narrow: macOS, UTF-8
`members.csv` and `orders.csv`, `CNY`, `Asia/Shanghai`, one repurchase comparison
method, one optional segment-contribution method, no action execution and no
Outcome claim.

The approved [Session and Runtime Boundary v1.0](../2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md)
continues to govern Product Session, Case revision, Analysis Run, Assistance
Attempt, Pi Runtime, `010_draw`, `020_clean`, `060_reports`, model disclosure,
save/reopen and recovery behavior.

Blueprint v1.3 does not expand, cancel, restart or reorder the current first
production Change. Its execution package, accepted amendments, unpassed Gates
and evidence limits remain authoritative for that batch. Current technical
work must finish under its frozen scope before a later Change claims the next
product outcome.

### 7.1 Frozen current-Change binding

The current production batch is fixed by
[Execution Package v1.0](./xanthil-desktop-first-product-change-execution-package-v1.0.md):

- Package ID: `PKG-XANTHIL-DESKTOP-001`;
- Change ID: `xanthil-desktop-membership-repurchase-decision-case`;
- frozen file: 17633 bytes, SHA-256
  `72504be4fe0b6c32cf120a62ac43a0b41d2125f6c2bebc8ef86a90dd6204fb92`;
- introduction commit: `bb667a6886023c984d7faf8d7a992f4120f2e978`;
- controlling effect: its product outcome, allowed/conditional/forbidden paths,
  role sequence, evidence requirements and Gates continue to control, subject
  only to the subsequently approved, preserved amendments indexed in
  [the planning entry](../README.md).

At the v1.2 source checkpoint, the latest confirmed Mini receipt had adopted
`672f2b23d60248f817fe0b845761f61a125dbf37`, reported P1/P2/P3 PASS and stopped
before Spec Gate at `BLOCKED_CONTRACT_DECISION_REQUIRED`. The user then approved
[Technical Decision Amendment 001](./xanthil-desktop-technical-decision-amendment-001.md),
8078 bytes, SHA-256
`54490c4b677c94d791812fc0a00b43f6400ee6ef9a381b1034c43ec083d2e838`,
to permit the original Mini task to close the minimum compatible dual-CSV,
no-model Run adaptation through the existing Spec/Design/Gates. Intake of that
amendment remained pending at this checkpoint. Spec Gate, P4, Test/RED, Worker,
Validator and product acceptance were not PASS.

This status is a frozen planning checkpoint, not a live remote claim. The
planning index carries later confirmed handoffs. Blueprint v1.3 neither marks
the batch complete nor changes its paths, permissions, lifecycle evidence or
acceptance endpoint.

## 8. How the next Change is selected

The next Change is selected from the smallest unmet user outcome in the current
product phase, not from a Whitepaper feature inventory.

```text
current phase and last accepted evidence
-> unmet user outcome or acceptance blocker
-> smallest vertical product behavior that can close it
-> full-landscape gaps, applicable areas and reusable foundations
-> responsible modules and differentiated-value hypothesis
-> visible UI acceptance endpoint
-> evidence that decides continue, correct, defer or stop
```

Each Change proposal must identify:

1. current product phase and last accepted evidence;
2. target user and one complete job;
3. OSM/PIM line and analysis mode, when applicable;
4. visible value endpoint and explicit non-goals;
5. applicable data/execution and trust boundaries;
6. evidence required before any later phase or Change is selected;
7. research Demos used as references and the content actually adopted;
8. completed foundations reused and any real consumer need for a new method,
   Pack, Runtime or shared contract;
9. the four-view alignment: capability coverage and deferred return points
   (section 4), phase/user outcome (section 5), affected modules and preserved
   boundaries (section 10), and supported competitive hypothesis with required
   evidence (section 11).

Use these fields within the existing proposal and reviews, not as four new
documents or Gates. A necessary reliability/security correction may support
trust or usability without inventing a new market differentiator.

Selection follows these rules:

- An acceptance or usability blocker in the current first slice is corrected
  before claiming repeated personal value.
- After technical acceptance, real-user/real-data value validation remains a
  separate, explicitly approved activity. Its findings may reorder later
  Changes without rewriting the accepted technical evidence.
- If the first personal workflow is usable, the default next product outcome is
  repeated personal value, not Workspace, full OSM, a second Runtime or a
  general platform.
- Workspace begins only after real collaboration demand is observed. An
  enterprise pilot begins only after its one scenario, value baseline and
  authorization boundary are approved.

### 8.1 Default second vertical candidate

Subject to completion and acceptance of the current first slice, the default
candidate is a repeated-use PIM vertical:

> The user reopens an existing membership-repurchase Decision Case, imports a
> new authorized period snapshot, creates a new Case revision, reruns the
> approved analysis, compares evidence and judgment changes with the previous
> revision, and produces a new versioned report while preserving the old
> revision and provenance.

Save/reopen/rerun already belong to the first slice. The proposed increment is
a new-period binding, explicit new revision, comparison and versioned delivery;
it does not reimplement the first slice's persistence or Run foundations.

This candidate is intended to test why the user returns, whether Decision Case
history is truly reusable and whether periodic analysis has more value than a
one-off report. PX-2026-021 report/template reuse and PX-2026-051 periodic
refresh may be studied as bounded design references. They are not adopted code,
acceptance evidence or automatic scope.

The candidate is not an authorized Change. Before it starts, the Controller
must use current acceptance and value evidence, produce its change-scoped UI
Contract, obtain the user UI Gate and follow the normal OpenSpec/TDD lifecycle.

### 8.2 Later PIM, OSM and analysis-mode expansion

- If unclear requirements are the largest evidenced obstacle, PIM requirement
  clarification and analysis-framework co-creation may extend
  the personal workflow after a specific user need is selected. PX-2026-030 and
  PX-2026-042 are references, not implementation authority.
- Autonomous exploration and deep research are later selectable analysis modes,
  not mandatory siblings of the first hypothesis-first slice. PX-2026-009,
  PX-2026-010 and PX-2026-012 remain research references.
- OSM goal-gap-strategy behavior begins through a bounded approved scenario,
  using relevant PX-2026-029/033/048 evidence only as reference. It does not
  retroactively require an Objective for ordinary PIM Cases.

## 9. Evidence for product and commercial progression

Functional scope and commercial value are proved separately:

| Evidence layer | Question | Examples |
|---|---|---|
| Technical product evidence | Does the real product complete the supported task correctly and recover safely? | Real Desktop path, deterministic results, persistence/reopen, failure and cancellation, provenance, Validator evidence |
| Personal value evidence | Can an authorized real user understand, complete and trust the task? | Task completion, first-value time, user review of evidence, explicit usefulness confirmation, controlled data-exposure behavior |
| Repeated value evidence | Does the user return and reuse product assets? | Qualified repeated tasks, Case/template reuse, periodic rerun, 4/12-week observations and collaboration demand |
| Team value evidence | Can multiple people review and reuse work correctly? | Shared Case completion, review, permission/history isolation, team adoption and willingness-to-pay evidence |
| Enterprise value evidence | Does one bounded enterprise scenario create reviewable value without exceeding risk authority? | Baseline, action/receipt/outcome separation, attributable effect or explicit uncertainty, guardrails and value report |

WVAT, first-value time, retention and conversion are candidate measures defined
before the applicable validation. Blueprint v1.3 does not invent universal
sample sizes or success thresholds. Download counts, chat volume, Demo PASS,
automatic reruns and technical Validator PASS do not substitute for real-user
or commercial evidence.

## 10. View 3 — System architecture and module responsibility

### 10.1 Retained foundations and current technical direction

The following remain reusable foundations:

- TypeScript Product Core, Application, Port, Adapter and Profile boundaries;
- the Pi-backed `AgentAnalysisRuntime` seam;
- DuckDB/Python local analysis and independent recomputation patterns;
- Run Artifact and Run Evidence storage/query foundations;
- cancellation, deadline, provenance, immutable publication and fail-closed
  behavior protected by tests;
- the separate `AnalyticalModelRuntime` and Model Pack contract-enabler;
- OpenSpec, TDD, independent validation, dual-device Git, data-safety and
  evidence-preservation governance.

The first slice continues to require the production Desktop, real local file
import and snapshots, user-facing Contract/Context/Binding/plan, versioned
Decision Case, controlled local execution, model-exposure confirmation,
operational persistence and recovery.

Electron, React and TypeScript remain the Desktop direction. Renderer authority
stays sandboxed; Main and controlled workers communicate through versioned
contracts. DuckDB remains analytical execution, SQLite operational state and
indexes, and immutable files the authority for source, Contract/Binding/IR,
code, evidence and Case/Run versions according to the approved structure
decisions.

Phase 1 retains Pi as the only active Agent Runtime Adapter. Pi may assist with
explicit drafts but does not own business methods, semantics, final judgment,
candidate selection or action authority. Provider/model selection stays in the
Profile, and the deterministic manual path remains usable when external model
exposure is declined or unavailable. A second Runtime remains a separate
Change; this Blueprint does not authorize a registry, fallback, hot switching
or universal Runtime interface.

### 10.2 Front end, shared business layer and back end

This is a **logical responsibility map**, not a microservice plan, network
boundary or mandate to deploy a “middle platform.” Personal Desktop can compose
these responsibilities locally. It groups Whitepaper chapters 13–14's business,
experience, analysis, asset, execution and infrastructure layers plus governance
without replacing the repository's architecture contracts.

```text
Front end: Xanthil Desktop | CLI companion | later team/enterprise surfaces
                              ↓ Application use cases
Shared business: OSM / PIM ── shared Analysis Core + DAME
                              │ Contract → Context/Binding → IR
                 Semantic context capabilities + typed asset/Pack lifecycles
                              ↓ business Ports
Back end:        Agent / analytical-model / local-code Adapters
                 data + operational state + immutable artifacts + connectors
Profile/composition root selects Adapters; trust and provenance span the flow.
```

| Logical module | Responsibility and owner boundary |
|---|---|
| Experience / Application | Accepted quick/professional workbench; Project/Session/Case/Run, Composer, plan/evidence/report review, Skill/Prompt/Fork/Subagent visibility and applicable approvals. Application coordinates business use cases; UI and CLI are not the business core. Preview and activation follow section 6. |
| OSM and PIM | OSM owns goal/measure/gap/strategy/action/review; PIM owns question/clarification/investigation/judgment/follow-up. Decision–action–feedback names their collaboration, not a new competing authority domain or duplicate state machine. |
| Analysis Core / DAME | Three analysis modes, Contract and IR semantics, method selection/composition, hypothesis/evidence/refutation and bounded judgment. DAME methods supply applicability and verification; Agent output is not final authority. |
| Semantic Context capabilities | Context Request/Resolve, permitted versioned Context Bundle, semantic Binding, IR materialization, enrichment and provenance. A cross-cutting business responsibility implemented through approved Ports/Adapters, not a new vendor-specific Runtime SDK dependency in Core. |
| Data and asset responsibilities | Data and Ontology are foundational authorities; Hypothesis and Strategy are governed long-term assets; Knowledge and Memory are separate background capabilities. Typed candidate routing and Owner promotion preserve these distinctions. “Four libraries” does not make them peer products or require four storage services. |
| Capability packages | Domain Packs declare domain requirements, methods/rules/workflows and applicability. Model Packs bind governed executable model capability. Neither owns business truth, final decisions or automatic asset activation. |
| Execution Adapters | Pi-backed Agent execution, separate deterministic analytical-model execution, and controlled SQL/Python/local-code execution. Business-oriented Ports isolate SDK types; Agent Runtime is not Analysis Core, an authorization boundary or Model Pack's deterministic runtime. |
| Data / storage / integration Adapters | Analytical DuckDB, operational SQLite, immutable artifacts/snapshots; optional graph/vector/search projections are rebuildable, not authority. LLM, search, enterprise-source and action connectors each obey their approved disclosure, failure and permission contracts. |
| Model supply and management | ModelEvol is the referenced training/lifecycle supply; MLflow provides model/tracking/registry/serving mechanisms; Model Pack Controller retains candidate acceptance, lock, product release and acceptance authority. These target integrations do not authorize installation or production activation. |
| Cross-cutting trust | Applicable validation/judgment, counterevidence, uncertainty, citation checks, privacy, policy, human approvals, provenance, evaluation and governed Teach. Trust applies to the whole chain; it is not postponed until enterprise identity or audit infrastructure is built. |

Dependency direction remains Experience → Application → Product Core, and
Application → Ports ← Adapters; Profile/composition root selects implementations.
All unactivated modules above are target responsibility, not proof of deployed
code. Existing foundations in section 10.1 are reuse inputs, not completion
claims for the full row.

Before changing these boundaries, use the canonical
[system context](../../architecture/system-context.md),
[Ports and Adapters](../../architecture/ports-and-adapters.md),
[asset/model authority map](../../architecture/asset-and-model-capability-architecture.md)
and [Runtime ADR 0003](../../adr/0003-business-runtime-port-strategy.md).
This view changes none of their ownership or active contracts. A second Runtime
or a materially changed Port remains a separate approved Change.

### 10.3 Business-analysis compilation and Analysis Plan IR

**IR (Intermediate Representation) is a structured execution-and-verification
contract, not CPU machine language, free-form prompt text or generated SQL
alone.** The product capability is business-analysis compilation: turn business
intent into a human-checkable, machine-executable and testable analysis.

```text
business question / applicable OSM Gap
→ draft Analysis Contract (why, decision purpose, scope, responsibility)
→ optional explicitly selected Domain Pack version + Context Request
→ permitted versioned Context Bundle + semantic Binding
→ confirmed Contract + Analysis Plan IR (how to execute, verify and deliver)
→ materialized query / code / model / research plan
→ constrained execution → validation, provenance and bounded judgment
→ Case/report; separately governed decision or typed asset candidate
```

The Analysis Core owns analysis semantics. Semantic Context capabilities resolve
references and physical bindings/materialization; execution Adapters execute
within the contract. PIM need not invent an Objective/Gap, and tasks that need
no Pack/model must not fabricate one.

The target IR can express scope, metric definition/grain/time/filter, data and
semantic snapshots, hypotheses and evidence requirements, versioned method
bindings and applicability, optional model identity, execution dependencies,
validation and human Gates, output and provenance, and allowed candidate
writeback. Exact schemas and supported fields belong to each approved Change;
this target inventory does not widen the frozen first-slice IR.

Non-technical users preview and revise the intended question, data, method,
evidence and acceptance through understandable UI, not JSON or source code.
The approved version binds the Run; changes create a new version through the
applicable approval, rather than silently rewriting historical intent or using
“latest” context. Execution must actually consume and enforce the IR; a cosmetic
JSON plan beside unconstrained code generation does not satisfy this capability.

Target evidence includes agreement between approved intent, executed plan and
result; rejection of missing/incompatible bindings and unauthorized scope;
traceable revision comparison; independently verified results; and safe failure
and supported recovery. Exact replay requires available matching inputs,
bindings, code/model and environment; otherwise report approximate reproduction
or inability to replay. Do not promise identical LLM output, generic resume or
recovery not included in the approved runtime contract.

Phase 1 uses only the chain required by the frozen slice. Phase 2 can extend
reusable bindings/methods and plan comparison through selected outcomes; later
phases extend scoped organization and asset integration. PX-014, PX-031/032 and
PX-038 are research references for IR, resolve/materialization and method
execution, respectively, not production contracts or accepted runtime behavior.

## 11. View 4 — Competitive value and evidence

These are **competitive hypotheses and product targets**, not verified
superiority, claims of invention, exclusive technology or permission to market
unbuilt capability. IR, semantic layers, Agents, natural-language analysis,
charts, SQL generation and integrations are not novel merely by existing.

A bounded official-source scan on 2026-09-19 found adjacent capability claims
in [ThoughtSpot Spotter](https://www.thoughtspot.com/product/agents/spotter),
[Hex Threads](https://learn.hex.tech/docs/explore-data/threads) and
[Palantir AIP](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture).
These are vendor descriptions, not independent comparative tests. JuanerAI
must prove useful differentiation against the user's actual alternative,
which can also be an analyst, spreadsheets or a general-purpose AI workflow.

| Candidate advantage | User value and mechanism | Coverage / responsible modules | Evidence needed and staged focus |
|---|---|---|---|
| V1. Business-analysis compilation / 业务分析编译 | Turn an ambiguous request into an understandable, approved plan that constrains execution and can be checked and reused. IR is the execution/verification object, not just a code-generation intermediate. | C1/C2/C4, A/B; UI, Analysis Core, semantic context, execution Adapters | First-slice subset, then repeat use: intent–execution agreement, useful plan corrections, rejection of deviations, valid reuse/replay and user completion versus the chosen alternative. |
| V2. Falsifiable professional investigation / 可证伪的专业分析 | Test support, refutation, alternatives, applicability and uncertainty before a bounded Finding; reduce plausible but unsupported explanations. | C2/C4/C5, B; Analysis Core/DAME and evidence UI | Personal phase onward: independent correct/incorrect/inconclusive judgment cases, unsupported-cause rate together with coverage/abstention and task usefulness. No causal claim from correlation. |
| V3. From vague question to investigation / 从模糊需求到完整调查 | Non-technical users co-create a useful question/framework, then use hypothesis-first, research or exploration as appropriate instead of having to supply a perfect prompt. | C1/C2/C3; PIM, unified UI, Analysis Core | Selected personal slices: unassisted task completion, clarification burden, first-value time and usefulness against the user's current workflow. |
| V4. Executable domain expertise / 可执行的领域专业能力 | Reuse tested method combinations, business constraints and governed models, rather than only retrieving prose or sharing prompts. | C4, A/B; DAME, Domain Pack, Model Pack | Repeated-personal and later domain slices: applicability detection, independently correct results, reuse effort and quality on held-out tasks. One successful Demo is insufficient. |
| V5. Governed accumulating experience / 经过验证的经验积累 | Cases and typed evidence support reusable assets; Teach turns a correction into a tested, owned, versioned capability explicitly adopted next time. | C6, A/B; Case, asset Owners, Pack lifecycle and Teach | Repeated/team phases: reused Cases, reduced recurrence of known errors, retained history and accepted new versions without unauthorized activation or cross-workspace leakage. |
| V6. Decision-to-outcome learning / 决策到效果的可验证闭环 | Connect analysis, strategy choice, approval, actual receipt and outcome review so users can distinguish poor execution, ineffective strategy and unresolved attribution. | C1/C5/C6, B; OSM/PIM collaboration, action/outcome Adapters, typed assets | Bounded pilot onward; earlier judgment/candidates remain partial: independent receipt, baseline/comparison, attributable effect or explicit uncertainty, reviewable value and risk. Completion is not effectiveness. |
| V7. Accessible local-controlled experience / 非技术用户可用且数据可控 | An approachable Desktop and inspectable disclosure/history make trustworthy analysis usable without reading code or sending raw data by default. | C3, A/B; UI, Profile, disclosure/storage/execution boundaries | From phase 1: actual UI completion/time/effort, controlled outbound payload, understandable refusal/manual path and supported Case/report export. Local-first is an adoption proposition, not uniqueness or a complete security proof. |

No row is competitively validated by this revision. Reusable foundations and
research Demos are initial evidence inputs only. The initial market proposition
combines V1/V2/V3/V7 with scenario-specific V4; V5 tests compounding repeat value,
and V6 develops with authorized business action and outcome evidence. This is
a staged hypothesis, not an additional mandated feature bundle for phase 1.

The potential durable advantage is the **combination** of constrained
compilation, professional methods, falsifiable evidence and governed accumulated
experience—not any single UI control, framework or JSON format. Users choose
the product for better completed work, not for an architecture diagram.

Before an external superiority claim or a validation study, name the target
user/task, actual comparator and version, approved data, success/error/cost
measures, evidence window and acceptance thresholds in that study's plan.
Measure tradeoffs (for example, lower false conclusions alongside completion
and abstention); do not set unsupported universal thresholds here. Record
negative findings too. Evidence can reshape priorities; removing a target
capability follows section 4.1.

## 12. Research-Demo use

Research Demos are read selectively after a Change has a product question.
Every plan records the source, precise content adopted and content rejected or
deferred. Demo implementation, fixtures, identities, UI state numbering,
synthetic results and PASS status do not become production artifacts by
association.

The current first-slice references remain PX-2026-001/002 for hypothesis-first
AnalysisOps and real local integration principles, and PX-2026-004/006 for the
accepted Xanthil product UI. Semantica/PX-2026-003 is not part of the first
slice. Later references listed in section 8 are consulted only when the selected
Change requires them.

## 13. Current effect and next Blueprint checkpoint

With fresh development-readiness Review 001 PASS and project-rule integration,
v1.3 is the single current Blueprint entry. v1.0/v1.1/v1.2 remain immutable
history. The first-slice attachments and accepted amendments stay binding;
the four views refine subsequent product decisions without restarting that batch.

The immediate development route remains:

```text
complete the frozen first PIM/hypothesis-first Desktop Change
-> real integrated UI technical acceptance
-> separately approved real-user/value validation
-> select the smallest repeated-personal-value Change from actual evidence
-> prove collaboration demand before Workspace
-> prove one bounded enterprise scenario before Enterprise expansion
```

The next Blueprint revision is triggered by a user-notified Whitepaper update,
a proposed change to the product route or acceptance boundary, or evidence that
invalidates a load-bearing development assumption. Ordinary implementation
detail, Spec clarification or technical correction stays within its normal
Change and does not automatically revise the Blueprint.
