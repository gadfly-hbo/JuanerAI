# Infrastructure and Governance Notes

## Current State

- Cold-start structure only.
- No dependencies installed.
- No runtime, database, Semantica, model, or OpenSpec CLI version selected.
- No enterprise deployment implementation authorized.
- Task Bus inactive.

## Current Direction

- OpenSpec/SDD/TDD is the primary development framework.
- CDI scopes multi-domain work.
- Pi is an Agent Runtime Adapter.
- Personal and enterprise deployment use separate Profiles.

## Risks

- Pi's local trust model is not an enterprise sandbox.
- Semantica personal embedding behavior is unverified.
- SQLite, DuckDB, and PostgreSQL responsibilities could be conflated without explicit Ports.
- Governance can become document-heavy before the first user-valued slice.

## Next Gate

Receive and review the detailed Xanthil plan before product implementation.

