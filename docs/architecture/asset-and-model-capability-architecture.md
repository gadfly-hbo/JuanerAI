# Asset and Model Capability Architecture

## Purpose

JuanerAI uses four product roles instead of a peer “four-library” map. The roles define authority, lifecycle, and consumption; they do not prescribe storage products, schemas, navigation, or deployment.

## Product roles

| Role | Members | Owns | Does not own |
|---|---|---|---|
| foundational authority | Data, Ontology | source-to-evidence lineage; governed business meaning | decisions, reusable explanations, reusable actions |
| long-term asset | Hypothesis, Strategy | governed templates, immutable versions, applicability, evidence/effect history | source truth, Ontology meaning, run state |
| executable capability pack | Domain Pack, Model Pack | versioned methods, tools, workflows, or model execution contracts | business authority, automatic asset promotion, Decision authority |
| background capability | Knowledge, Memory | material organization/retrieval and retained context | independent product identity, foundational fact authority |

“Foundational” describes epistemic precedence, not storage ownership. Imported data remains attributable to its originating authority. Derived analytical data is authoritative only under its approved transformation contract and never silently replaces its source.

## Authority and consumption flow

```text
Data snapshot + Ontology snapshot
  -> deterministic computation, Agent analysis, or Model Pack execution
  -> run-scoped Evidence and Hypothesis instances
  -> human or approved policy Gate
  -> run-scoped Root Cause or Decision
  -> Strategy instances and Action Recommendations
  -> separate authorization
  -> Action, Execution Receipt, and Outcome
  -> Hypothesis evidence ledger and Strategy effect ledger
  -> explicit candidate/version governance for any reusable asset update

Knowledge Capability: organizes and retrieves material across the flow
Memory Capability: retains non-authoritative user/Session/workflow context
```

## Foundational authorities

### Data

Data authority has two levels:

- originating source data keeps its external or enterprise authority, identity, source time, and access boundary;
- derived analytical datasets and evidence bundles gain authority only through an approved transformation contract, input snapshot, code or query identity, output identity, quality result, and lineage.

Raw or prepared detail remains local unless a later approved data-egress contract allows otherwise. Local deterministic processing and permission to enter an LLM context are separate decisions.

### Ontology

Ontology is the governed meaning of business concepts and analysis meta-concepts. A Run binds an immutable Ontology version or content hash; no component silently falls back to `latest` or invents a local semantic copy. An authoring tool, graph projection, or inferred suggestion is not authoritative until the publication Gate completes.

## Long-term assets

### Hypothesis

- A Hypothesis template is reusable and falsifiable, with applicability, exclusions, and evidence requirements.
- A Hypothesis instance is immutable and belongs to one Run, Data snapshot, Ontology snapshot, and Workspace scope.
- A Root Cause is a run-specific conclusion accepted at a Root Cause Gate. It is not a global fact or automatic template update.
- The Hypothesis evidence ledger records supporting, refuting, and inconclusive evidence. It never doubles as a Strategy effectiveness ledger.

### Strategy

- A Strategy template is reusable action knowledge with applicability, exclusions, parameter bounds, risk, reversal, ownership, and evaluation requirements.
- A Strategy instance is an immutable proposal for one confirmed context and target scope.
- An Action Recommendation is not authorization. A task is not execution. An Execution Receipt proves what happened but not that the Strategy worked.
- The Strategy effect ledger records execution, comparison design, outcome, attribution, and uncertainty at the required evidence level.

Hypothesis and Strategy templates may connect through a stable, versioned diagnostic or cause-type identity owned by the asset domain. That identity may reference Ontology concepts but does not reuse their identity or redefine their meaning.

## Asset promotion and writeback

The default promotion path is fail-closed:

```text
run-scoped result
  -> optional asset candidate (draft)
  -> business review
  -> asset-governance review
  -> immutable new version
  -> explicit activation
```

- LLMs, Agents, Subagents, Model Packs, Knowledge retrieval, Memory, and execution feedback may propose or support a draft; none can activate or silently mutate an asset.
- Historical cases are evidence, not templates.
- Existing versions remain immutable. Corrected or improved knowledge produces a new version with lineage.
- Workspace-local learning does not become cross-Workspace authority without an explicit scope and promotion decision.
- A Root Cause Gate and a Strategy execution Gate remain independent. Rejecting a Strategy does not unlock or erase an already accepted run-specific Root Cause.

Exact roles, signatures, persistence, enums, and executable contracts belong to a later approved product Change. This architecture freezes the semantics and stop line, not those implementation details.

## Executable capability packs

Domain Packs and Model Packs consume declared Data and Ontology inputs. A Domain Pack may supply approved methods, skills, workflows, and supporting material. A Model Pack crosses a separate deterministic analytical-model Runtime and produces an identified result with Pack identity, model version, input snapshot, Runtime provenance, evaluation evidence, limits, and confidence semantics.

Neither Pack owns the Data or Ontology it consumes. A Pack result can support Evidence, Hypothesis ranking, or Strategy evaluation, but it is not a Decision, Root Cause, active asset, or Action authorization.

## Background capabilities

Knowledge Capability may ingest, organize, retrieve, index, and project provenance-bearing material. Memory Capability may retain user, Session, workflow, and Agent context. They remain separate capabilities because their trust, lifecycle, deletion, and consumption semantics differ.

They are not independent products in the JuanerAI product map. A UI may surface search results, context, provenance, or history inside an approved workflow without creating “Knowledge” or “Memory” product areas.

## Technical neutrality

- Operational records, analytical computation, canonical artifacts, graph projections, vector indexes, and artifact files remain distinct responsibilities.
- A projection or index must be rebuildable from its declared authority and verified by source version or hash.
- One infrastructure product may implement several Ports only after each behavioral contract is validated independently.
- No universal CRUD service, universal Runtime, shared database schema, or automatic synchronization mechanism follows from this architecture.

## Supersession rule

Any product plan, ownership map, attachment, or future brief that uses “four libraries,” “four libraries on one machine,” or presents Ontology, Knowledge, Memory, Hypothesis, and Strategy as peer products is historical unless a current plan explicitly re-adopts its narrower behavior. Existing approved behavior and executable contracts remain authoritative until an independently approved Change revises them.
