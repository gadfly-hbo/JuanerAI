# Test Plan

- PB-TEST-001 validates committed records and rejects unknown fields, versions, enums, and invalid references.
- PB-TEST-002 proves atomic replacement preserves the prior file after invalid input.
- PB-TEST-003 verifies GET health, UI, aggregate state, and referenced-document reads.
- PB-TEST-004 rejects POST, invalid Host/Origin, path traversal, unknown briefs, and invalid references.
- PB-TEST-005 verifies repository, static, unavailable, and stale UI states.
- PB-TEST-006 verifies the board exposes no submit-to-Codex action.
- PB-TEST-007 verifies CLI set, milestone, event, brief, show, and replace behavior.
- PB-TEST-008 verifies keyboard, dialogs, reduced motion, desktop, mobile, light, and dark presentation.

Execution is complete. Controller browser validation passed 27 checks with no
page errors, and the fresh read-only Validator independently reproduced the
current repository, brief, constrained-document, HTTP, and browser boundaries.
PB-TEST-007 is interpreted with the accepted
`project-board-status-authority` narrowing: a post-publication best-effort event
append failure is warning-only and does not undo a successful status or brief
write.
