# Traceability: Mode Activation

| Requirement | Acceptance Criteria | Canary/Test owner | Tasks | Delivery evidence |
|---|---|---|---|---|
| `REQ-MA-001` | `AC-MA-001-01..04` | `CAN-MA-02`, `CAN-MA-14`, frozen Foundation regression | `001-003`, `007`, `015`, `021` | canonical Foundation `2633ad86...`, Core `4efc2f28...`, Test `de93ab87...`, fixtures `48b1265a...`, focused `180/180`, canonical exit `0`, TAR PASS, deterministic product-ID/WIP evidence, final stop state |
| `REQ-MA-002` | `AC-MA-002-01..05` | `CAN-MA-01`, `CAN-MA-14` | `005`, `008`, `012-017` | installed current-key/trust mathematical proof, forged-host rejection, key fingerprint only, trust owner/mode/ACL/effective-write, rotation/revocation, secret scan |
| `REQ-MA-003` | `AC-MA-003-01..05` | `CAN-MA-04`, `CAN-MA-05`, `CAN-MA-07`, `CAN-MA-14` | `005`, `008`, `015`, `017` | service/socket/PID/executable hashes, GREEN same-process `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` plus `config.github_repository == 'gadfly-hbo/JuanerAI'`, Remote route/fixed-CLI/envelope proof, missing-output authority readback, SSH fallback boundary, restart/log negatives |
| `REQ-MA-004` | `AC-MA-004-01..05` | `CAN-MA-03..06`, `CAN-MA-11..12` | `004-011`, `014-017` | Agent bindings/settlements, scope inventory, Candidate/Validator evidence |
| `REQ-MA-005` | `AC-MA-005-01..04` | `CAN-MA-03`, `CAN-MA-06..07`, `CAN-MA-14` | `005`, `008-009`, `012`, `014`, `016-017` | unchanged dual Git/library bytes, every-ancestor ACL/effective-write/rollback, real UID `501` version/SHA proof, local-ref/Candidate/predecessor/remote readback, env/argv/object/raw-byte hashes |
| `REQ-MA-006` | `AC-MA-006-01..04` | `CAN-MA-05`, `CAN-MA-07..08`, frozen Foundation regression, first authorized product Change | `005`, `008-009`, `015-017`, `021` | same-process `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` plus `config.github_repository == 'gadfly-hbo/JuanerAI'`, credential purpose isolation, local-ref/predecessor binding, ruleset and PR no-merge proof; deferred exact Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback before first-product Acceptance |
| `REQ-MA-007` | `AC-MA-007-01..05` | `CAN-MA-09..10`, `CAN-MA-13..14`, static archive contract/path regression | `005`, `008-009`, `013-014`, `017-020` | MacBook Controller bootstrap archive after first PR review, later product signed archive REVISION, same-PR ancestry, release, complete ACL backup/rollback receipts |
| `REQ-MA-008` | `AC-MA-008-01..05` | `CAN-MA-01..14`, two causal REDs, frozen Foundation/bootstrap regressions, retirement Gate, first authorized product Change | `010-021` | rejected `10ba759e`/fresh Validator BLOCKED history, exact two RED-to-GREEN evidence, Foundation identity GREEN, Controller-owned archive regression/mechanic, non-deferred canary matrix, retirement PASS, next exact Candidate/Validator, archive/main/service readback, exact stop state, closed three-effect deferral |

## Remaining Two-RED Mapping

| RED cause | Requirement / AC | Canary | Test and task owner | Required completion proof |
|---|---|---|---|---|
| `RED-MA-GIT-RUNTIME-ACL` | `REQ-MA-005`, `REQ-MA-007`; `AC-MA-005-01..03`, `AC-MA-007-04..05` | `CAN-MA-14` | fresh Test `MA-TASK-012`; Worker `MA-TASK-014` | unchanged bytes; every ancestor/artifact owner/mode/ACL/effective-write backup/readback/rollback; search/execute-only; real UID `501` version/SHA proof |
| `RED-MA-LOCAL-REF-CANDIDATE` | `REQ-MA-005`, `REQ-MA-006`; `AC-MA-005-04`, `AC-MA-006-02..03` | `CAN-MA-06..07` | fresh Test `MA-TASK-012`; Worker `MA-TASK-016` | local ref equals Candidate, remote equals expected predecessor before push, exact Candidate refspec, remote equals Candidate after push; no new Gateway |

## Closed Preconditions and Regression Ownership

| Boundary | Disposition | Owner and evidence |
|---|---|---|
| Foundation repository identity | `GREEN`; mandatory regression, not RED/Worker scope | frozen Foundation files under `MA-TASK-015`; exact signed-body repository ID plus fixed config second match; `180/180`, canonical exit `0`, TAR PASS |
| Mode Activation bootstrap archive | static contract/path regression before PR; mechanical action only after first PR review | MacBook Controller `MA-TASK-013`; no Worker production implementation, Foundation REVISION, active pointer, DISPATCH, Mac mini archive, or historical archive rewrite |

## Path-to-Owner Mapping

- Spec Agent: only `openspec/changes/mode-activation/**` before Spec Gate.
- Test Agent: only `mode-activation.test.mjs` and `git.integration.test.mjs` are writable after Spec Gate; `cli.test.mjs`, `coordinator.test.mjs`, and fixtures are regression-only.
- Worker: only `install-host-loop` and `production.mjs` after TDD_READY; `coordinator.mjs` and every archive/canonical path are frozen.
- MacBook Controller: local signer/key/receipts, Reviewer, PR, bootstrap-only Mode Activation mechanical archive/canonical publication, product-Change archive decisions, Acceptance/merge/RELEASE/first-product decision.
- Mac mini administrator: conditional root-owned installation and rollback only after explicit Gate.
- Validator: read-only exact Candidate and host evidence.
- Canary execution: existing Foundation/Host Loop entrypoints only; no direct production-adapter invocation or new Canary interface.

Any CODE or RESULT outside these mappings is scope drift and blocks Acceptance.
