# Ports and Adapters

## Dependency Direction

Experience -> Application -> Product Core

Application -> Ports <- Adapters

Profiles assemble Experience, Application, and Adapters.

## Port Families

The following are capability families, not blanket approval for new interfaces. Current interfaces exist only where an approved specification defines them:

- analytical data access;
- operational state and run lifecycle;
- artifact storage;
- Ontology access;
- Hypothesis asset access;
- Strategy asset access;
- Knowledge access;
- Memory access;
- Agent execution;
- model execution;
- LLM access;
- policy decision;
- audit and trace emission;
- action execution;
- outcome observation.

Each Port must be named in business terms and define lifecycle, error, cancellation, idempotency, authorization, and provenance semantics relevant to its capability.

The families reflect different business semantics, not peer products. Data and Ontology are foundational authorities; Hypothesis and Strategy are governed long-term assets; Knowledge and Memory are background capabilities. Keeping separate Ports does not authorize separate product surfaces, universal CRUD, or a shared persistence model.

## Runtime Seams

Runtime Ports follow `docs/adr/0003-business-runtime-port-strategy.md`. Each owning domain defines the smallest business interface its approved scenario needs. Agent Harness SDKs implement Agent Runtime Ports through Adapters; deterministic Model Pack inference uses a separate `AnalyticalModelRuntime` Port. No infrastructure Runtime type becomes a shared business contract merely to support future replacement.

## Adapter Rules

- Pi implements Agent execution behavior. Pi-specific types, events, errors, tool structures, and session structures stay inside the Pi Adapter; every cross-module interface outside it uses JuanerAI business or standard platform types.
- SQLite stores personal operational state; it is not an analytical engine abstraction.
- DuckDB serves local analytical workloads; it is not interchangeable with operational state.
- PostgreSQL may replace enterprise operational state but does not automatically replace DuckDB analytics.
- Semantica may implement Ontology, Knowledge, or Memory Ports only after each contract is independently validated.
- Asset Adapters may project Hypothesis or Strategy relationships into a graph, search index, or Knowledge view, but the projection does not become the asset authority and cannot activate a version.
- Local files and enterprise object stores implement Artifact Storage through the same behavioral contract where their semantics genuinely match.

## Composition

Only profiles/<profile>/ selects concrete Adapters. Business code cannot inspect environment variables to select infrastructure.

## Contract Gate

No executable Port or Adapter contract is created until the detailed product scenario establishes needed behavior. Every approved Adapter later runs the same relevant contract suite.
