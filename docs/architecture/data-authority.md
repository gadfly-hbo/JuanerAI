# Data Authority

## Authority Classes

| Class | Authority | Key Rule |
|---|---|---|
| source data | originating enterprise or external system | imported copies retain source, time, and lineage |
| analytical dataset | approved transformation contract | derived data never silently replaces its source |
| Ontology | governed semantic definition | entity, relationship, state, and action meaning requires approval |
| Knowledge | provenance-bearing fact or interpretation | confidence and origin remain visible |
| Memory | user, session, workflow, or agent context | never treated as authoritative business fact |
| model result | identified Model Pack and input snapshot | prediction is not a Decision |
| Decision | accountable user or approved policy | evidence, constraints, and authority are recorded |
| Action | authorized business operation | execution is distinct from recommendation |
| Outcome | observed post-action evidence | attribution and uncertainty remain explicit |
| audit record | append-only governance evidence | product state cannot rewrite history silently |

## Storage Responsibilities

- SQLite is the candidate personal operational store for run state, configuration metadata, and other transactional records once specified.
- DuckDB is the candidate personal analytical engine for datasets and analytical queries once specified.
- Local files are candidate artifact storage, not an implicit database.
- Enterprise PostgreSQL is a candidate operational-state Adapter.
- Enterprise analytics, graph, vector, and object storage are separate decisions.

## Provenance Minimum

Any product conclusion intended to support a Decision must be traceable to source identity, source time, transformation or query, relevant Ontology version, Domain Pack and Model Pack versions, model/provider where applicable, and the run that produced it.

## Pending

Retention, deletion, encryption, residency, classification, access-control, dataset grain, identity, migration, and recovery policies require the detailed Xanthil and enterprise plans.

