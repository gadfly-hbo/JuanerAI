# Traceability Policy

Keep existing Change, Requirement, Acceptance, test and task identities stable.
For new identifiers, use the repository's CHG/REQ/AC/TEST/TASK conventions when
needed; do not rename historical assets solely for formatting.

In existing verification/tasks, link material acceptance claims to relevant
tests, code and actual results. Helpers and diagnostic tests may link through
the behavior or check they support; they do not need invented product Requirements.
Use references rather than a duplicate full matrix in every handoff.

Link each Change's user story/acceptance to affected stable Blueprint capability
IDs in `docs/planning/capability-coverage/register.md`. Capability links supplement,
not replace, REQ/AC/Test identities. The register references existing plan,
implementation, real-path and acceptance evidence separately; delivery snapshots
preserve the full-map view and before/after scope. Follow the sole execution
policy's Blueprint Capability Coverage section, without a second traceability
ledger or retroactive edits to archived Changes.

Block acceptance for an unverified material claim, missing behavior coverage,
unexplained scope or evidence contradicting the claimed result. Formatting or
an optional column alone is not a blocker when the substantive chain is clear.
Never repair lost historical evidence by calling new output a historical PASS.

Runtime product provenance still preserves Data source -> transformation ->
analysis/model -> Decision -> authorization -> Action -> Outcome. This document
does not relax those product contracts.
