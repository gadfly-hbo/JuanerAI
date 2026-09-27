# Traceability Policy

Keep existing Change, Requirement, Acceptance, test and task identities stable.
For new identifiers, use the repository's CHG/REQ/AC/TEST/TASK conventions when
needed; do not rename historical assets solely for formatting.

In existing verification/tasks, link material acceptance claims to relevant
tests, code and actual results. Helpers and diagnostic tests may link through
the behavior or check they support; they do not need invented product Requirements.
Use references rather than a duplicate full matrix in every handoff.

Block acceptance for an unverified material claim, missing behavior coverage,
unexplained scope or evidence contradicting the claimed result. Formatting or
an optional column alone is not a blocker when the substantive chain is clear.
Never repair lost historical evidence by calling new output a historical PASS.

Runtime product provenance still preserves Data source -> transformation ->
analysis/model -> Decision -> authorization -> Action -> Outcome. This document
does not relax those product contracts.
