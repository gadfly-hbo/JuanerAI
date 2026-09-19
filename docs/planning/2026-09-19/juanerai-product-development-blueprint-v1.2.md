# JuanerAI Product Development Blueprint v1.2

## Document control

| Field | Value |
|---|---|
| Version | `1.2` |
| Change type | Compatible consolidation and adoption of Whitepaper v3.3.4; the product route, target users, first vertical slice, value endpoint and core acceptance boundary are unchanged |
| Product authority | Current explicit user decisions and this approved development blueprint |
| Core reference | JuanerAI Whitepaper v3.3.4, `JUANERAI_WHITEPAPER.md` |
| Whitepaper SHA-256 | `429a58a6772aacf162b49d66e86b36dc2c5f0b068af7e25b1554206ec7703f4b` |
| Whitepaper source size | `252757` bytes |
| Source date | 2026-09-19 |
| User decision | The user accepted the complete v1.2 direction on 2026-09-19 and authorized drafting, rule integration and Git submission subject to the required development-readiness Gate |
| Current status | `APPROVED_CURRENT / DEVELOPMENT_READINESS_REVIEW_002_PASS` |
| Development-readiness | [Review 001](reviews/blueprint-v1.2-development-readiness-review-001.md) `NEEDS_CLARIFICATION`; formal binding correction followed by fresh [Review 002](reviews/blueprint-v1.2-development-readiness-review-002.md) `PASS` |
| Supersedes as current entry | [Blueprint v1.0](../2026-09-18/juanerai-product-development-blueprint-v1.0.md) plus [Blueprint v1.1 Amendment](../2026-09-18/juanerai-product-development-blueprint-v1.1.md) |
| Historical effect | v1.0 and v1.1 remain immutable decision history; this document consolidates their still-valid rules and records the compatible v3.3.4 adoption |

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
adoption is therefore Blueprint v1.2, not v2.0.

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

## 4. Six product lines and two cross-cutting capabilities

The Whitepaper's six lines plus two cross-cutting capabilities are adopted as a
coverage map, not as eight products, architecture layers or serial development
phases.

| Coverage area | Development question |
|---|---|
| OSM/PIM business lines | Does the Change help a user reach a goal or investigate a problem, and who owns the resulting business state? |
| Three analysis modes | Is the task hypothesis-first, deep research, autonomous exploration or an explicit composition? |
| Product matrix and growth | Which personal, repeated-use, team, pilot or enterprise value stage does it advance? |
| Methods and capability expansion | Which DAME method, Domain Pack or Model Pack consumer need exists now? |
| Decision and value validation | How does evidence become a bounded decision, and how will later action or value be distinguished from task completion? |
| Asset accumulation and evolution | What remains a Case result, what may become a governed asset candidate, and which Owner/Gate controls promotion? |
| Data, semantics and execution | What source, Contract, Context/Binding, IR, computation, provenance and recovery boundary applies? |
| Trust and human responsibility | What evidence, uncertainty, privacy, approval and independent verification is required? |

Every proposed product Change identifies only the applicable areas and states
why the others are deferred or not applicable. Coverage classification does not
authorize horizontal platform work. A method, Pack, Runtime, storage component
or governance mechanism is introduced when a selected vertical slice requires
it, not merely because it appears in the Whitepaper landscape.

## 5. Product development route

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

Blueprint v1.2 does not expand, cancel, restart or reorder the current first
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
planning index carries later confirmed handoffs. Blueprint v1.2 neither marks
the batch complete nor changes its paths, permissions, lifecycle evidence or
acceptance endpoint.

## 8. How the next Change is selected

The next Change is selected from the smallest unmet user outcome in the current
product phase, not from a Whitepaper feature inventory.

```text
current phase and last accepted evidence
-> unmet user outcome or acceptance blocker
-> smallest vertical product behavior that can close it
-> applicable coverage areas and reusable foundations
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
   Pack, Runtime or shared contract.

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

This candidate is intended to test why the user returns, whether Decision Case
history is truly reusable and whether periodic analysis has more value than a
one-off report. PX-2026-021 report/template reuse and PX-2026-051 periodic
refresh may be studied as bounded design references. They are not adopted code,
acceptance evidence or automatic scope.

The candidate is not an authorized Change. Before it starts, the Controller
must use current acceptance and value evidence, produce its change-scoped UI
Contract, obtain the user UI Gate and follow the normal OpenSpec/TDD lifecycle.

### 8.2 Later PIM, OSM and analysis-mode expansion

- PIM requirement clarification and analysis-framework co-creation may extend
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
before the applicable validation. Blueprint v1.2 does not invent universal
sample sizes or success thresholds. Download counts, chat volume, Demo PASS,
automatic reruns and technical Validator PASS do not substitute for real-user
or commercial evidence.

## 10. Reusable foundation and technical direction

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

## 11. Research-Demo use

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

## 12. Current effect and next Blueprint checkpoint

With development-readiness Review 002 PASS and project-rule integration, v1.2
is the single current Blueprint entry. v1.0/v1.1 and their attachments remain
the decision and contract history for the first vertical slice.

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
