# JuanerAI Context

JuanerAI is a product family centered on turning data into traceable business decisions and outcomes. This glossary defines product language only; implementation details belong elsewhere.

## Product Family

**JuanerAI**:
The highest-level commercial project and product family.
_Avoid_: using JuanerAI as a synonym for Xanthil

**Xanthil**:
The first JuanerAI commercial product. Its current product direction is desktop-first for macOS and Windows, with future enterprise capability; continued CLI product development is paused.
_Avoid_: JuanerAI platform, Pi wrapper, CLI-first product

**Product Module**:
A reusable JuanerAI capability that may begin as a monorepo module and later become an independently versioned subproject.
_Avoid_: microservice, separate repository

## Users

**Data Analyst**:
A specialist who investigates data and communicates evidence-backed findings and recommendations.
_Avoid_: BI operator

**Decision User**:
An enterprise user who relies on data to choose or authorize business action.
_Avoid_: dashboard viewer

## Decision Loop

**Decision Loop**:
The traceable progression from Data through Decision and Action to Outcome.
_Avoid_: reporting pipeline

**Data**:
Recorded internal or external evidence used in analysis, with source and lineage.
_Avoid_: truth, knowledge

**Decision**:
A selected course of action supported by evidence, constraints, and an accountable decision maker or policy.
_Avoid_: insight, prediction

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
An observed result attributed to an Action with stated evidence and uncertainty.
_Avoid_: output, completion

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
