# Deployment Profiles

## Personal

Current target:

- Xanthil CLI.
- local composition root;
- Pi Agent Runtime Adapter;
- SQLite candidate for operational state;
- DuckDB candidate for analytical data;
- local artifact storage;
- Semantica Adapter subject to feasibility validation;
- single local workspace and user trust boundary.

Only the profile direction is approved. Concrete configuration and runtime contracts remain pending.

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

