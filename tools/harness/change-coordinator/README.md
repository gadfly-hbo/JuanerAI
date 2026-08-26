# Change Coordinator Foundation

Inactive Foundation seam. Its Coordinator exposes exactly four interfaces: `applyControllerCommand`, `run`, `settlement`, and read-only `status`. The production CLI exposes only signed-byte `submit` ingress and read-only `status`; before a separately authorized Activation installs trusted ingress, a well-formed submission closes as `INGRESS_UNAVAILABLE`. It does not start agents, poll, merge, delete, or dispatch a next Change. Mode Activation is required before any live device workflow uses it.

The host supplies an admitted dispatch and observes named-child settlements through `run`; the Coordinator only persists and validates the resulting facts. Stop on any scope, ledger, candidate, or handoff mismatch.
