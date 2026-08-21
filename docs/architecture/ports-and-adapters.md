# Ports and Adapters

## Dependency Direction

Experience -> Application -> Product Core

Application -> Ports <- Adapters

Profiles assemble Experience, Application, and Adapters.

## Candidate Port Families

The following are capability families, not approved interfaces:

- analytical data access;
- operational state and run lifecycle;
- artifact storage;
- Ontology access;
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

## Adapter Rules

- Pi implements Agent execution behavior; Product Core does not import Pi SDK types.
- SQLite stores personal operational state; it is not an analytical engine abstraction.
- DuckDB serves local analytical workloads; it is not interchangeable with operational state.
- PostgreSQL may replace enterprise operational state but does not automatically replace DuckDB analytics.
- Semantica may implement Ontology, Knowledge, or Memory Ports only after each contract is independently validated.
- Local files and enterprise object stores implement Artifact Storage through the same behavioral contract where their semantics genuinely match.

## Composition

Only profiles/<profile>/ selects concrete Adapters. Business code cannot inspect environment variables to select infrastructure.

## Contract Gate

No executable Port or Adapter contract is created until the detailed product scenario establishes needed behavior. Every approved Adapter later runs the same relevant contract suite.

