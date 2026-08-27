# Deployment Profiles

## Personal

Current approved local-analysis composition:

- Xanthil CLI.
- local composition root;
- Pi Agent Runtime Adapter;
- DuckDB/Python Local Analysis Adapter;
- local artifact storage;
- single local workspace and user trust boundary.

SQLite operational state and a Semantica Adapter remain future Personal candidates. Any additional configuration or Runtime contract requires its own approved Change.

The current product-planning direction is Xanthil Desktop for macOS and Windows, but no Desktop Profile or packaging/runtime composition is active. Continued CLI product development is paused while the approved CLI composition remains current executable behavior. A future Desktop Change must name the reused Application/Port contracts, Desktop-specific deltas, current-CLI compatibility, activation, rollback, and real Windows acceptance environment before Profile activation.

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
