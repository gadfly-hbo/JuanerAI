# Traceability

| Requirement | AC | Test | Task | Candidate code | Result |
|---|---|---|---|---|---|
| CVR-REQ-001 | AC-001, AC-002 | TEST-001, TEST-002 | CVR-004, CVR-006 | `tools/harness/validation/run` | GREEN |
| CVR-REQ-002 | AC-003, AC-004 | TEST-001, TEST-002 | CVR-004, CVR-006 | `tools/harness/validation/run` | GREEN |
| CVR-REQ-003 | AC-005, AC-006 | TEST-003, TEST-004 | CVR-004, CVR-006 | `tools/harness/validation/run` | GREEN |
| CVR-REQ-004 | AC-007 | TEST-004 | CVR-004, CVR-006 | `tools/harness/validation/run` | GREEN |

Existing suite commands are reused unchanged; their current counts and real-leaf skip are regression evidence, not additional Requirements.

Initial RED hash `5e573959f29137b9f1b5e580d314c1b0a6b230c741a8b2b2f65f805168ee83c9`
is superseded before Worker dispatch: TEST-001 observed one syntax invocation
although its fixture contains six `.mjs` files. Corrected Test identity is
`tools/harness/validation/run.test.mjs` SHA-256
`f4f08a4dec49f7c0c5821dd78632c83573d13a776bb6246359e3bb5dce523071`;
4/4 corrected leaves remain causal RED and production may unlock only at the
one approved runner path.

Worker candidate SHA-256
`99affa347cb0767a34510dc55ae87ebbda6b1753dc8186e754ee601de973bb34`
made the focused suite 4/4 GREEN, but its strict DuckDB comparison rejects the
accepted local output `v1.5.2 (Variegata) 8a5851971f`. Full regression is
blocked; Spec and Test identities are reopened with production frozen. The
first clarification freezes DuckDB-only first-token handling in AC-003/004;
the corrected Test identity is SHA-256
`d1ef4b6944c022589cf0995b6bc5fede7fd87a0fb210bf591ab3b96c693d8f66`.
Against the frozen Worker candidate, TEST-002 passes while TEST-001/003/004
fail causally before their positive/validation paths because DuckDB still uses
whole-string comparison. The same one-file Worker scope is TDD_READY.

Final production SHA-256 is
`62e1533bb7137df697795024f2fc7299df6fe64349c0e8d3bf1f78a41bb71334`;
the frozen focused suite is 4/4 GREEN. The canonical runner completed unit
250/250, contract 198/198, integration 243/243, default E2E 131 pass plus the
one intentionally skipped real leaf, and project-board 12/12, all with zero
failures. Historical counts remain evidence only.
