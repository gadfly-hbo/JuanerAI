# Xanthil Desktop Static Demo Product Brief

> Status: frozen product input; Demo result pending
> Boundary: static product-manager Demo only; no product implementation authority

## Goal

Before choosing the desktop application technology or starting productization, produce and review a static, locally viewable Xanthil Desktop Demo that makes the Data Analyst required workflow and information architecture concrete.

The Demo acceptance decision answers only: “Is this the right product surface, workflow, hierarchy, and interaction intent to productize?” It does not prove runtime feasibility, production quality, accessibility compliance, cross-platform packaging, real data handling, model quality, or backend integration.

## Design-source hierarchy

1. **Codex app — mandatory UI and interaction baseline.** Use its application shell, spatial hierarchy, sidebar, Project and Session organization, central conversation/task workspace, right Inspector, dialogs and drawers, command entry, component density, typography, color, borders, radii, icon style, run status, and keyboard interaction as the primary design language.
2. **pi-xanthil — historical business-function provenance only.** The current [`pi-xanthil-business-function-transfer-matrix.md`](pi-xanthil-business-function-transfer-matrix.md) exhaustively states the D0/D1 functions to represent. The Demo maker does not need to inspect the external repository. Do not copy its UI or product shell.
3. **Xanthil — brand and product semantics.** Use Xanthil names, content, data-analysis language, and brand assets. Do not copy Codex trademarks or make a pixel-level clone.

When sources conflict, Codex app UI language wins for presentation and interaction; JuanerAI current product authority wins for business semantics and safety.

The matrix and this brief are sufficient product inputs for the static Demo. An external pi-xanthil lookup cannot add a screen, state, function, or acceptance requirement; any proposed addition returns to the Controller and requires an explicit plan decision.

## Required static product flow

The Demo must let a reviewer navigate one coherent Project and Session through these five required areas:

1. **Data preparation:** business requirement, source-data inventory, prepared and aggregated-data state.
2. **Data cleaning:** extraction and aggregate computation plan, with an explicit boundary that local detail is processed locally and only admitted aggregate evidence may enter an LLM context.
3. **Evidence-based Analysis (循证分析):** hypothesis → evidence → refutation, alternative branches/Forks, bounded Subagent contributions, evidence references, Skills, Prompts, limitations, and offline evidence-bound state.
4. **Report output:** report candidate, evidence citations, limitations, provenance, review, and lock state.
5. **Execution feedback:** recommendation, authorization boundary, task/receipt/outcome distinction, and separate Hypothesis/Strategy writeback proposals.

The central workspace shows the human task and next decision. The Inspector may show evidence, data/ontology snapshots, lineage, model/runtime identity, asset references, audit, and technical details. Internal state-machine numbers and raw SDK events do not drive the primary interface.

## Minimum screens and states

- application shell with Projects, Sessions, command entry, run status, and keyboard-focus intent;
- Project overview and Session workspace;
- data source/preparation state and data-boundary explanation;
- free-analysis main state with multiple hypotheses, supporting evidence, refuting evidence, and an inconclusive path;
- Fork lineage and bounded Subagent contribution view;
- evidence Inspector with source, time, transformation, Ontology version, and run linkage;
- report candidate and locked-report comparison;
- recommendation, execution receipt, outcome, and two-ledger feedback view;
- blocking states for unavailable data, unconfirmed plan, insufficient evidence, and prohibited egress;
- empty and error states expressed in business language.

## Demo behavior boundary

- Static navigation and simulated interactions are allowed; every simulated action must be visually identified as Demo behavior.
- All content is synthetic. No real data, model, provider, network, credential, production service, or external write is permitted.
- The Demo does not choose Electron, Tauri, native shells, webview packaging, persistence, state management, database, Python integration, or Runtime architecture.
- The Demo may be plain HTML or another throwaway static format. Its code is disposable evidence, not a production foundation.

## Acceptance

The user reviews the Demo and gives one of:

- `approved_for_productization_planning`;
- `changes_requested`, with bounded product or interaction findings;
- `rejected`, with the product direction returned to discussion.

Approval freezes the product surface and journey as Design input. It does not authorize a product Change. After approval, the Controller separately prepares the productization decision package, including desktop technology, reuse of the first-slice architecture, data-cleaning technical input, boundaries, first vertical acceptance, activation, and rollback.
