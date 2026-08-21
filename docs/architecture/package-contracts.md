# Capability Package Contracts

## Domain Pack

A Domain Pack will eventually declare:

- stable identity and semantic version;
- supported JuanerAI contract version;
- business domain and capability description;
- required data and Ontology concepts;
- skills, tools, workflows, and analysis methods;
- input and output contracts;
- permissions and external access;
- data and content provenance;
- license and redistribution terms;
- verification and evaluation evidence;
- compatibility and retirement policy.

## Model Pack

A Model Pack will eventually declare:

- stable identity, semantic version, and artifact checksum;
- supported JuanerAI contract version;
- business purpose and prohibited use;
- typed inputs and outputs;
- runtime and dependency requirements;
- training or source provenance where applicable;
- evaluation metrics, limitations, and confidence semantics;
- data, model, and network permissions;
- deterministic or stochastic execution properties;
- verification, rollback, and retirement policy.

## Governance

- Manifests use a closed, versioned schema once approved.
- Package identity is distinct from display name and filesystem path.
- Capability negotiation is explicit; unknown versions fail closed.
- Package code cannot gain permissions merely because it is installed.
- Package outputs are evidence or recommendations until a separate Decision and Action contract authorizes effects.
- Contract tests verify every package surface.

No package schema or default field value is frozen during cold start.

