# JuanerAI Context

JuanerAI is a product family centered on turning data into traceable business decisions and outcomes. This glossary defines product language only; implementation details belong elsewhere.

## Product Family

**JuanerAI**:
The highest-level commercial project and product family.
_Avoid_: using JuanerAI as a synonym for Xanthil

**Xanthil**:
The first JuanerAI commercial product, planned in CLI, desktop, and enterprise editions.
_Avoid_: JuanerAI platform, Pi wrapper

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

## Semantic Capabilities

**Ontology**:
The governed model of business entities, relationships, states, constraints, and available actions.
_Avoid_: database schema, knowledge graph

**Knowledge**:
Provenance-bearing facts and interpretations available for analysis and decision support.
_Avoid_: source data, memory

**Memory**:
Retained user, session, workflow, or agent context that can inform later work but is not authoritative business truth.
_Avoid_: knowledge base, audit log

## Capability Packs

**Domain Pack**:
A versioned industry capability package containing approved analysis methods, data expectations, skills, tools, workflows, and supporting knowledge.
_Avoid_: plugin, prompt bundle

**Model Pack**:
A versioned executable business-model package with declared inputs, outputs, runtime needs, provenance, evaluation evidence, and compatibility.
_Avoid_: model file, algorithm script

