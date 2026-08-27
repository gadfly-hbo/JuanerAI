# Data Authority

## Authority Hierarchy

JuanerAI distinguishes foundational authority from governed assets, derived outputs, background context, and accountable business authority. “Data + Ontology are foundational authorities” does not mean that JuanerAI owns an imported source system or that every stored copy is equally authoritative.

### Foundational authorities

| Class | Authority | Key Rule |
|---|---|---|
| source data | originating enterprise or external system | imported copies retain source, time, and lineage |
| analytical dataset | approved transformation contract | derived data never silently replaces its source |
| Ontology | governed semantic definition | entity, relationship, state, and action meaning requires approval |

### Governed long-term assets

| Class | Authority | Key Rule |
|---|---|---|
| Hypothesis Asset | approved immutable asset version and its evidence ledger | run-specific hypotheses and root causes do not silently update reusable assets |
| Strategy Asset | approved immutable asset version and its effect ledger | recommendations, tasks, receipts, and outcomes remain distinct from the reusable template |

### Derived, background, and accountable records

| Class | Authority | Key Rule |
|---|---|---|
| Knowledge material | identified source and provenance | retrieval or interpretation never overrides Data or Ontology |
| Memory context | user, Session, workflow, or Agent context | never treated as authoritative business fact |
| model result | identified Model Pack and input snapshot | prediction is not a Decision |
| Decision | accountable user or approved policy | evidence, constraints, and authority are recorded |
| Action | authorized business operation | execution is distinct from recommendation |
| Outcome | observed post-action evidence | attribution and uncertainty remain explicit |
| audit record | append-only governance evidence | product state cannot rewrite history silently |

## Storage Responsibilities

- SQLite is a candidate personal operational store for run state, configuration metadata, asset records, and other transactional records once specified.
- DuckDB is a candidate personal analytical engine for datasets, evidence bundles, and analytical queries once specified.
- Local files are candidate artifact storage, not an implicit database.
- Enterprise PostgreSQL is a candidate operational-state Adapter.
- Enterprise analytics, graph, vector, and object storage are separate decisions.

These candidates are not selected dependencies or approved schemas. A graph, index, cache, or online tool is a projection or Adapter unless an approved contract explicitly gives it another role.

## Provenance Minimum

Any product conclusion intended to support a Decision must be traceable to source identity, source time, transformation or query, relevant Ontology version, referenced Hypothesis and Strategy asset versions, Domain Pack and Model Pack versions, model/provider where applicable, and the Run that produced it.

Any reusable asset update must additionally identify the source Runs and evidence or effect ledger entries, the prior asset version, the proposed scope, and the explicit promotion decision. Context recall, retrieval ranking, or model confidence is never sufficient promotion authority.

## Pending

Retention, deletion, encryption, residency, classification, access-control, dataset grain, identity, migration, and recovery policies require the detailed Xanthil and enterprise plans.
