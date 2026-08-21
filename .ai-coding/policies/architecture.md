# Architecture Policy

- Dependencies point from surfaces and infrastructure toward Application Ports and Product Core contracts.
- Product Core contains business concepts and rules, not SDK types, SQL, filesystem paths, subprocess commands, HTTP clients, or deployment choices.
- Ports name business capabilities and semantics. Generic execute_sql, execute_shell, or call_http Ports are not business boundaries.
- Adapters translate between an external system and a Port, including error and lifecycle semantics.
- Profiles are the only composition roots.
- SQLite and DuckDB have separate Ports where their semantics differ.
- Ontology, Knowledge, and Memory remain separate contracts.
- Cross-module contracts are versioned, closed where practical, and verified by contract tests.
- New package or service boundaries require an approved Change and dependency-direction review.

