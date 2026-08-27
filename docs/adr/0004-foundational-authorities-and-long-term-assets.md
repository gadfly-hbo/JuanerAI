---
status: accepted
date: 2026-08-27
---

# Separate foundational authorities, long-term assets, capability packs, and background capabilities

JuanerAI replaces the former peer “four-library” product map with four different product roles: Data and Ontology are foundational authorities; Hypothesis and Strategy are governed long-term assets; Domain Pack and Model Pack are executable capability packages; Knowledge and Memory remain distinct background capabilities but are not independent products. This preserves the different authority and lifecycle of each concept while avoiding both a collection of peer database products and a single undifferentiated “knowledge base.”

## Considered options

1. Keep Data, Ontology, Knowledge, Memory, Hypothesis, and Strategy as peer products or libraries. This makes storage nouns look like equal product authorities and pushes infrastructure organization into the product map.
2. Merge them into one knowledge platform. This loses the distinction between source evidence, governed semantics, falsifiable explanations, reusable actions, and non-authoritative context.
3. Use the four-role architecture above. This keeps replaceable technical seams and explicit authority without turning every capability into a product.

JuanerAI selects option 3.

## Consequences

- Only Data and Ontology are called foundational authorities. Data authority preserves the originating system's ownership and the complete derived-evidence lineage; it does not claim that JuanerAI owns imported source truth.
- Hypothesis and Strategy have authoritative asset records, immutable versions, evidence or effect ledgers, and governance, but they remain revisable knowledge assets rather than foundational facts.
- A run-specific hypothesis, root cause, recommendation, task, execution receipt, model result, or outcome never silently becomes an active long-term asset.
- Knowledge and Memory retain separate business capability contracts even when one infrastructure product implements both. Removing their independent product status does not merge their semantics or authorize removal of existing seams.
- Domain Pack and Model Pack supply versioned executable capability. Their outputs are evidence or recommendations until separate Decision and Action authority applies.
- SQLite, DuckDB, Semantica, graph stores, vector indexes, files, model providers, and Agent runtimes are possible Adapters, stores, or projections. None becomes a product authority merely by holding several classes of information.
- Product navigation may expose asset or provenance views where a scenario needs them, but it does not present Knowledge or Memory as peer products by default.

This ADR records product and architecture direction only. It creates no Schema, Port, dependency, Runtime, storage selection, migration, OpenSpec Change, or implementation authority.
