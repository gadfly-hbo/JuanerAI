# Security Boundaries

## Personal Profile

The user and local process initially share one trust boundary. Pi, local extensions, project instructions, files, and tools may execute with the user's OS permissions. The product must make this boundary visible and keep tool capability narrow.

## Enterprise Profile

The Agent Runtime is untrusted relative to enterprise control and data planes. Enterprise deployment requires external enforcement for:

- identity, SSO, RBAC, and tenant/workspace isolation;
- runtime sandbox or container isolation;
- tool allowlists and capability grants;
- secret delivery and redaction;
- network egress policy;
- data classification, residency, retention, and deletion;
- action authorization and separation of duties;
- immutable audit and trace evidence;
- budgets, timeout, cancellation, idempotency, retry, and recovery.

## Decision and Action Boundary

Analysis and model output may support a Decision but do not authorize an Action. An Action Recommendation remains non-effecting. Automated Decision and Action execution are R3 changes requiring explicit policy, negative tests, audit, recovery, and human approval.

## Package Boundary

Domain Packs, Model Packs, agent extensions, skills, and tools are supply-chain inputs. Future installation must verify origin, version, checksum, declared permissions, compatibility, license, and revocation status.

## Data Egress

Enterprise data is local-only by default. Sending data, schema, metadata, embeddings, prompts, traces, or artifacts to a third party requires an approved data-flow contract.

