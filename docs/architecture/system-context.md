# System Context

## Product Loop

Enterprise internal/external Data
-> governed ingestion and lineage
-> Ontology-grounded analysis
-> evidence and model-supported Decision
-> Action Recommendation
-> authorized Action
-> observed Outcome
-> learning and updated context

## Product Planes

| Plane | Responsibility |
|---|---|
| experience | Xanthil CLI, future desktop, and operator Console |
| product core | business concepts, decision rules, and use cases |
| capability | Domain Packs and Model Packs |
| execution and data | agent, model, data, storage, semantic, and LLM Adapters |
| control | configuration, policy, identity, permissions, runs, logs, traces, and audit |
| deployment | personal and future enterprise composition Profiles |

## External Systems

- Enterprise source systems and approved external datasets.
- Model providers or local models.
- Pi Agent Runtime.
- Semantica and its selected persistence backends.
- Future business action systems.

External systems are never Product Core dependencies. Every interaction crosses an approved Port, data boundary, and failure contract.

## Current Boundary

Only the cold-start structure and Xanthil CLI direction are approved. No external integration, action connector, or automated decision behavior is active.

