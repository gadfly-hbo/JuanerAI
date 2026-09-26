# JuanerAI Context

JuanerAI is a product family centered on turning data into traceable business decisions and outcomes. This glossary defines product language only; implementation details belong elsewhere.

## Product Family

**JuanerAI**:
The highest-level commercial project and product family.
_Avoid_: using JuanerAI as a synonym for Xanthil

**JuanerAI Whitepaper**:
The product-definition and commercialization charter and the core reference for the Product Development Blueprint. A Whitepaper revision changes development only after explicit user notification and adoption through an approved, reviewed Blueprint revision.
_Avoid_: executable roadmap, implementation authorization, proof of completion

**Product Development Blueprint**:
JuanerAI's highest product-development execution guideline. Its four core views connect capability coverage, phased vertical delivery, module responsibility and competitive-value evidence. Blueprint v2.0 is approved; v1.0–v1.3 remain history. Its Whitepaper v4.0 adoption preserves the frozen first slice and advances Personal decision records, outcome follow-up and explicit next-Case adoption before demand-led Team and Enterprise expansion.
_Avoid_: Whitepaper copy, OpenSpec, automatic Change authorization

**Xanthil**:
The first JuanerAI commercial product. Xanthil Desktop is the unified user workbench for PIM and applicable OSM workflows; it reuses JuanerAI's shared analysis, execution and governance capabilities. The name itself grants no execution authority.
_Avoid_: JuanerAI platform, Pi wrapper, CLI-first product

**Personal / Team / Enterprise**:
Product forms and governance scopes, separate from intelligence maturity and action permissions. Xanthil Personal uses the Desktop Free entry; Xanthil Team carries the former Workspace product direction; JuanerAI Enterprise adds enterprise responsibilities. Strategic naming does not rename existing packages or expand a frozen Change.
_Avoid_: three execution cores, automatic infrastructure or migration authorization

**Product Module**:
A reusable JuanerAI capability that may begin as a monorepo module and later become an independently versioned subproject.
_Avoid_: microservice, separate repository

## Users

**Data Analyst**:
A specialist who investigates data and communicates evidence-backed findings and recommendations.
_Avoid_: BI operator

**Decision User**:
A professional individual, team or enterprise user who relies on data to choose, defer or decline business action; authority to execute remains separate.
_Avoid_: dashboard viewer

## Business Lines and Analysis Modes

**OSM (Objective & Strategy Management System)**:
The business line that owns goals, measures, gaps, strategy combinations, actions and business review. It may request analysis but does not own analysis methods, semantic binding or Runtime implementation.
_Avoid_: dashboard, mandatory precondition for every analysis, second analysis core

**PIM (Problem & Insight Management)**:
The business line that organizes questions, requirement clarification, analysis framing, investigation, evidence judgment, bounded insight and follow-up. A PIM Case may complete without an OSM Objective or Gap.
_Avoid_: new Runtime, parallel workbench, automatic action authority

**Hypothesis-first Analysis**:
An analysis mode that states falsifiable candidate explanations and tests supporting and refuting evidence before accepting a Finding.
_Avoid_: predetermined conclusion, PIM as a whole

**Deep Research**:
An analysis mode that develops a bounded question through governed multi-source evidence and citation verification.
_Avoid_: unrestricted browsing, source-free synthesis

**Autonomous Exploration**:
An analysis mode that identifies candidate anomalies, structures or opportunities for later confirmation without silently promoting them to accepted Findings or Objectives.
_Avoid_: automatic truth, automatic target creation

**Analysis Plan IR (Intermediate Representation)**:
The structured execution-and-verification contract for an analysis, constrained by its Analysis Contract and permitted versioned Context/Binding. It expresses how the task is executed, checked and delivered; the user inspects its meaning through readable UI. Business-analysis compilation turns business intent into this enforceable plan and its executable materialization.
_Avoid_: CPU machine language, prompt, generated SQL alone, cosmetic JSON, automatic execution authority

## Decision Loop

These are v2.0 product meanings. They do not retroactively change frozen first-slice states, contracts or acceptance; analysis completion is not Decision Loop completion.

**Evidence-based Analysis (循证分析)**:
An analyst-led investigation that keeps Hypotheses, supporting and refuting Evidence, alternatives, uncertainty, Forks, and bounded Subagent contributions traceable before a Finding is accepted.
_Avoid_: Free analysis, 自由分析, unconstrained analysis

**Decision Loop**:
The traceable process from a problem and evidence through an accountable decision, applicable authorized action, actual observation and evaluation to governed improvement adopted by a later Case. Pure analysis may stop at bounded insight.
_Avoid_: reporting pipeline, mandatory action for every Case, analysis completion

**Decision Case**:
A versioned business record beginning with a problem and preserving scope, responsibility, process and exact evidence references. It can contain successive analyses and remain valid without a decision or completed Loop; the frozen one-Session/one-Case contract remains unchanged.
_Avoid_: chat title, report wrapper, single Analysis Run

**Decision Record / Decision System of Record**:
The contemporaneous record of considered options, visible evidence, selection/non-action/deferral, rationale, responsibility and applicable expectation. The System of Record preserves its durable identity and revision history without becoming the authority for external transaction facts.
_Avoid_: correct-answer library, Memory, action permission, rewriting past reasons using later results

**Decision Graph / Decision Lineage**:
Versioned, sourced relationships connecting Cases, evidence, assets, choices and results; Lineage explains the information and responsibility behind a decision at that time. Relationships and summaries respect source permissions.
_Avoid_: new source of truth, graph-database requirement, duplicate independent evidence

**Data**:
Recorded internal or external evidence used in analysis, with source and lineage.
_Avoid_: truth, knowledge

**Decision**:
An accountable choice supported by the evidence and constraints available at the time, including non-action or deferral. Selection does not itself authorize execution.
_Avoid_: insight, prediction, action receipt

**Action Recommendation**:
A proposed business action that has not yet been authorized or executed.
_Avoid_: action, automated decision

**Automated Decision**:
A decision selected under an explicitly approved policy without per-instance human selection.
_Avoid_: recommendation, agent response

**Action**:
An authorized business operation intended to change a real business state.
_Avoid_: suggestion, tool call

**Outcome**:
An observed result with stated source, quality and uncertainty. Attribution to an action or strategy is a separate, evidence-dependent judgment and may remain unknown.
_Avoid_: generated output, action completion, automatic causal effect

**Expected Outcome / Future Actual**:
Expected Outcome records the pre-observation expectation, baseline, object, window, guardrails and evaluation arrangement. Future Actual is the sourced actual observation for the agreed object and window, with quality and maturity checked.
_Avoid_: desired target as guaranteed prediction, LLM-generated actuals, retrospective expectation, execution receipt as effect

**Outcome Evaluation**:
The bounded assessment separating execution conformity, actual observation, expectation calibration, strategy attribution and decision quality given contemporaneous information.
_Avoid_: observed improvement as proof of strategy increment, a bad result as proof of a bad original decision

**Recall / Reuse / Learning**:
Recall retrieves history; Reuse applies suitable existing material; Learning turns outcome evaluation into a correctly owned and validated versioned improvement explicitly adopted in a later Case. Adoption and changed analysis/choice show occurrence; independent later quality or effect evidence is needed to show effectiveness.
_Avoid_: saved summary as learning, approved candidate as actual adoption, adoption as proven benefit

## Foundational Authorities

**Data Authority**:
The authoritative chain from originating data through approved derived analytical evidence, preserving source, time, transformation, and lineage. JuanerAI does not become the owner of an external source merely by importing or analyzing it.
_Avoid_: truth, knowledge, LLM output

**Ontology Authority**:
The governed, versioned meaning of business entities, relationships, states, constraints, metrics, and available actions.
_Avoid_: database schema, knowledge graph, latest local copy

## Long-term Assets

**Hypothesis Asset**:
A governed, versioned, reusable, and falsifiable explanation pattern with applicability and evidence requirements. A run-specific hypothesis or accepted root cause does not automatically become a reusable Hypothesis Asset.
_Avoid_: prompt, one-off guess, root cause, model output

**Strategy Asset**:
A governed, versioned, reusable action pattern with applicability, exclusions, parameters, risk, reversal, and evaluation requirements. A recommendation, task, execution receipt, or observed outcome is not itself a Strategy Asset.
_Avoid_: action, task, SOP text, LLM recommendation

## Background Capabilities

**Knowledge Capability**:
The background capability that organizes, retrieves, relates, and presents provenance-bearing material for analysis and decision support without becoming an independent product or foundational authority.
_Avoid_: Knowledge product, source data, unified knowledge base

**Memory Capability**:
The background capability that retains user, Session, workflow, or agent context for later work but never promotes context into authoritative business fact by itself.
_Avoid_: Memory product, knowledge base, audit log, business truth

## Executable Capability Packs

**Domain Pack**:
A versioned industry capability package containing approved analysis methods, data expectations, skills, tools, workflows, and supporting knowledge.
_Avoid_: plugin, prompt bundle

**Model Pack**:
A versioned executable business-model package with declared inputs, outputs, runtime needs, provenance, evaluation evidence, and compatibility.
_Avoid_: model file, algorithm script, decision authority, knowledge base
