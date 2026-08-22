---
status: accepted
date: 2026-08-22
---

# Use business Runtime Ports for coexisting runtimes

## Context

Xanthil Personal currently uses a Pi-backed Agent Analysis Runtime. Future Agent scenarios may need capabilities that are not part of the current in-memory Pi slice, such as persistent sessions, sandboxing, and plugin-oriented orchestration. Deterministic Model Pack inference has different lifecycle and evidence needs again.

Two opposite mistakes would damage the architecture: allowing Pi SDK concepts to become JuanerAI business contracts, or building a universal multi-Runtime platform before a second approved scenario exists. Runtime replacement and Runtime coexistence therefore need an explicit long-term direction without authorizing present implementation.

## Decision

1. JuanerAI supports multiple coexisting Runtime implementations. Adding a Runtime does not retire Pi; Xanthil Personal may continue selecting the Pi Adapter.
2. DeepSeek Harness is one possible future Agent Runtime Adapter for an approved scenario that needs persistent sessions, sandboxing, or plugin-oriented orchestration. It is not a selected dependency or active integration.
3. Deterministic Model Pack inference uses an independent `AnalyticalModelRuntime` Port and does not depend directly on an Agent Harness.
4. Each business domain owns the business-oriented Runtime Port needed by its scenario. Infrastructure SDK types, events, errors, tools, and session objects remain inside the implementing Adapter.
5. A Run and its Session bind to one Runtime identity for their complete lifetime. Mid-Run or mid-Session Runtime switching is forbidden.
6. A Profile or composition root selects the Runtime Adapter. Application receives the selected business Port and does not branch on Runtime vendor or product names.
7. Before introducing a second production Runtime, the Change must freeze an Adapter-independent contract suite and define runtime identity, Runtime version, Adapter version, Profile, and observed model provenance. The current Pi-specific provenance shape is not silently generalized.
8. The current slice does not create a Runtime registry, automatic fallback, hot switching, or a `UniversalAgentRuntime`.
9. Current work protects the existing seams: Pi-specific types, events, errors, tool structures, and session structures do not enter Product Core, Application, Model Packs, or public contracts.
10. A second Runtime requires its own OpenSpec Change after the first Pi-backed slice is stable. That Change owns the scenario, Port compatibility or delta, activation, rollback, contract tests, provenance schema, and Profile composition.

The compressed rule is:

> Freeze replaceable seams now; add Runtimes later for approved business scenarios. Do not prebuild a multi-Runtime platform or let Pi-specific structures enter JuanerAI business contracts.

## Interface Test

A new Runtime may implement an existing business Port only when it genuinely satisfies the same complete interface: behavior, lifecycle, ordering, failures, cancellation, tools, provenance, and security semantics. Passing names or structurally similar methods are insufficient. The unchanged Adapter-independent contract suite is the replacement proof.

If a new scenario needs materially different persistent-session, sandbox, plugin, model, or orchestration semantics, the owning domain defines or revises its business Port through the separate OpenSpec Change. It does not widen a generic Runtime interface for hypothetical reuse.

## Current Mapping

| Business scenario | Business Port | Adapter or candidate | Status |
|---|---|---|---|
| Xanthil Personal local analysis | `AgentAnalysisRuntime` | Pi Adapter | current and retained |
| future persistent/sandboxed/plugin Agent scenario | scenario-owned Agent Runtime Port | DeepSeek Harness Adapter is one candidate | future OpenSpec required |
| deterministic Model Pack inference | `AnalyticalModelRuntime` | scenario-selected analytical model Adapter | future contract required |

## Consequences

- Pi remains a valid Personal Profile choice while other Profiles or scenarios may select different Adapters.
- Application and Product Core remain stable when a conforming Adapter changes.
- Agent orchestration and deterministic analytical-model execution do not inherit each other's dependencies or lifecycle accidentally.
- Runtime provenance becomes a prerequisite for a second Runtime rather than a speculative schema added to the first slice.
- Runtime-specific persistence, sandbox, plugin, fallback, migration, and recovery behavior remain absent until an approved scenario requires them.

This ADR changes no current product behavior, Port, artifact schema, Profile composition, dependency, or runtime. It records the direction and the stop line for a future Change.
