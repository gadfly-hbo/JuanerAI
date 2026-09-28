# Deployment Profiles

## Personal

Current approved local-analysis composition:

- Xanthil CLI.
- local composition root;
- Pi Agent Runtime Adapter;
- DuckDB/Python Local Analysis Adapter;
- local artifact storage;
- single local workspace and user trust boundary.

The accepted first Xanthil Desktop Change also composes SQLite operational state, immutable local evidence and DuckDB/Python independent calculation through its Desktop Profile. CLI behavior remains preserved. Semantica and enterprise deployment remain deferred; Windows activation is not implied by macOS evidence.

The approved [internal-install supplement](../../openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/internal-install-supplement-001.md) adds a relocatable internal Apple Silicon app: the Profile resolves a v2 toolchain descriptor relative to packaged Resources, verifies the bundled runtime inventory and observed versions, and admits only explicitly selected external writable Projects. The v1 absolute descriptor remains supported for existing development deployments. Inventory hashes detect inconsistency; they are not publisher authentication, Developer ID signing or notarization. Actual target-Mac installation acceptance is separate from local build/tests.

## Runtime Selection

Runtime selection follows `docs/adr/0003-business-runtime-port-strategy.md`. A Profile or composition root supplies one selected Runtime Adapter to Application for the complete Run and Session; Application does not select, switch, or fall back by Runtime name. Adding a second Runtime requires the approved contract and provenance gates before Profile activation.

## Enterprise

Deferred target:

- service or container product surfaces;
- PostgreSQL operational state;
- enterprise analytical, object, graph, and vector stores selected by workload;
- isolated Agent Runtime;
- centralized configuration and secrets;
- SSO, RBAC, tenant/workspace isolation, audit, and policy;
- controlled action connectors;
- deployment, migration, backup, recovery, observability, and rollback.

## Parity

Personal and enterprise Profiles share Product Core and Application behavior. They do not pretend infrastructure with different transactional, analytical, consistency, security, or availability semantics is identical.

Every Profile must pass the applicable Port contract suites. Enterprise activation additionally requires production-like integration and recovery evidence.
