# Traceability: Mode Activation

| Requirement | Acceptance Criteria | Canary/Test owner | Tasks | Delivery evidence |
|---|---|---|---|---|
| `REQ-MA-001` | `AC-MA-001-01..04` | `CAN-MA-02`, `CAN-MA-14`, Foundation regression | `001-003`, `007`, `021` | Foundation byte hashes, deterministic product-ID/WIP evidence, policy/role diff, Reviewer guard, final stop state |
| `REQ-MA-002` | `AC-MA-002-01..05` | `CAN-MA-01`, `CAN-MA-14` | `005`, `008`, `012-017` | installed current-key/trust mathematical proof, forged-host rejection, key fingerprint only, trust owner/mode/ACL/effective-write, rotation/revocation, secret scan |
| `REQ-MA-003` | `AC-MA-003-01..05` | `CAN-MA-04`, `CAN-MA-05`, `CAN-MA-14` | `005`, `008`, `013-017` | service/socket/PID/executable hashes, Remote route/repository/fixed-CLI/envelope proof, missing-output authority readback, SSH fallback boundary, restart/log negatives |
| `REQ-MA-004` | `AC-MA-004-01..05` | `CAN-MA-03..06`, `CAN-MA-11..12` | `004-011`, `014-017` | Agent bindings/settlements, scope inventory, Candidate/Validator evidence |
| `REQ-MA-005` | `AC-MA-005-01..04` | `CAN-MA-03`, `CAN-MA-06`, `CAN-MA-14` | `005`, `008-009`, `012`, `015-017` | dual executable/version/env/argv/object/raw-byte hash receipts |
| `REQ-MA-006` | `AC-MA-006-01..04` | `CAN-MA-05`, `CAN-MA-07..08`, first authorized product Change | `005`, `008-009`, `012-017`, `021` | credential identity/purpose isolation, ruleset and PR no-merge proof before Activation-ready; deferred exact Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback before first-product Acceptance |
| `REQ-MA-007` | `AC-MA-007-01..05` | `CAN-MA-09..10`, `CAN-MA-13..14` | `005`, `008-009`, `012-020` | signed revision hashes, ancestry/PR archive, release, backup/rollback receipts |
| `REQ-MA-008` | `AC-MA-008-01..05` | `CAN-MA-01..14`, retirement Gate, first authorized product Change | `010-021` | non-deferred canary matrix, retired-inconclusive record, retirement PASS, replacement-Candidate/Validator evidence, archive/main/service readback, exact stop state, closed three-effect deferral and no-Acceptance blocker |

## Path-to-Owner Mapping

- Spec Agent: only `openspec/changes/mode-activation/**` before Spec Gate.
- Test Agent: only `cli.test.mjs`, `git.integration.test.mjs`, and new `mode-activation.test.mjs` after Spec Gate.
- Worker: only Proposal's exact later repository paths after TDD_READY; archive paths remain unavailable until signed archive REVISION.
- MacBook Controller: local signer/key/receipts, Reviewer, PR/archive/Acceptance/merge/RELEASE/first-product decision.
- Mac mini administrator: conditional root-owned installation and rollback only after explicit Gate.
- Validator: read-only exact Candidate and host evidence.
- Canary execution: existing Foundation/Host Loop entrypoints only; no direct production-adapter invocation or new Canary interface.

Any CODE or RESULT outside these mappings is scope drift and blocks Acceptance.
