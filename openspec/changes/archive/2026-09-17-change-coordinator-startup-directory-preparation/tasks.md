> Archive note (R378, 2026-09-17): the complete original text below is the
> frozen Spec-stage record, including its historical pending/NOT_RUN status.
> Current completion and limits are in [the archive acceptance record](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).

# Tasks: Change Coordinator Startup Directory Preparation

## Status and Fixed Order

- Current: `SPEC_GATE_PASS / TEST_ENTRY_PENDING` (Controller R342)
- Sequence: complete Spec review/ponytail/Gate -> isolated Test Design/health/
  RED -> TDD_READY -> minimum Worker -> GREEN/affected regression/Retirement ->
  fresh Validator/Controller acceptance -> integration/exact package ->
  separately authorized host validation -> original `SERVICE_BEFORE` and D1.

## 1. Specification Gate

- [x] `TASK-SDP-001` — Controller reviews all seven files against R341/R342,
  canonical `AC-MA-003-01..05`, `AC-RIC-004-01..03`, and the exact two future
  write paths.
- [x] `TASK-SDP-002` — Controller runs `ponytail-review` over the complete
  OpenSpec diff and returns any mechanism without a current AC/Test consumer to
  Spec for deletion.
- [x] `TASK-SDP-003` — Controller records Spec Gate PASS or one complete bounded
  clarification. No Test/Worker starts before PASS.

## 2. Isolated Test Design and RED

- [ ] `TASK-SDP-010` — Fresh `juaner_test` freezes exact same-file leaves,
  the closed five-method OS boundary, exact ACL and same-numeric-UID
  supplementary-group access probes, commands, selectors, counts, hashes,
  budgets, cleanup, and lifecycle ledger for `INTENT-SDP-*`.
- [ ] `TASK-SDP-011` — Prove Test environment health with safe-existing
  listener/status and unchanged `TEST-MA-HOST-003` before interpreting RED.
- [ ] `TASK-SDP-012` — Execute and capture causal `RED-SDP-001` on frozen
  production, plus passing controls and complete forbidden-side-effect
  snapshots. Controller records TDD_READY only from valid evidence.

## 3. Minimum Production Change

- [ ] `TASK-SDP-020` — Fresh `juaner_worker` changes only `host-loop.mjs` to add
  the fixed private startup boundary and invoke it before the existing listener,
  using bound FileHandle metadata operations and the fixed credential probe,
  without changing repair-path `regularRootOwned`, plist, socket protocol, or
  any other runtime module.
- [ ] `TASK-SDP-021` — Worker returns exact diff/path inventory and source
  identity. Any Test edit, second production path, interface/schema/dependency,
  installer/plist need, or inability to achieve the positive path blocks.

## 4. GREEN, Regression, and Retirement

- [ ] `TASK-SDP-030` — Run the unchanged causal leaf for GREEN and the complete
  startup intent matrix, including retention/race/protection assertions.
- [ ] `TASK-SDP-031` — Run affected Host Loop/Mode Activation regression,
  canonical offline validation, scope/diff, and secret checks with exact output
  and identities. Preserve K1/K2/hour and S09/A2 dispositions.
- [ ] `TASK-SDP-032` — Controller reconciles the test-asset lifecycle ledger,
  runs Test Asset Retirement `ponytail-review`, removes any temporary/orphaned
  asset through Test-only return, reruns affected commands, and records PASS.

## 5. Independent Verification and Acceptance

- [ ] `TASK-SDP-040` — Freeze seven specs, production/Test bytes, commands,
  outputs, scope inventory, Retirement disposition, and evidence read model.
- [ ] `TASK-SDP-041` — Dispatch fresh read-only `juaner_validator` to inspect
  every REQ/AC, race/failure/protection leaf, exact paths, and evidence-level
  boundary against the frozen head.
- [ ] `TASK-SDP-042` — Controller resolves Validator findings within the
  existing correction limits and records local acceptance or BLOCKED. Local
  PASS returns only to original M3 exact package preparation.

## 6. Integration, Deployment, and Return

- [ ] `TASK-SDP-050` — Under separate authority, integrate and freeze the exact
  five-module package, predecessor/rollback manifest identity, service and
  directory preflight, interruption, write set, ordered commands, readbacks,
  and failure landing points. Do not reuse R302.
- [ ] `TASK-SDP-051` — Under separately authorized host operation, deploy/start
  and prove real safe-existing and safely-created directory paths,
  owner/group/mode/ACL/runtime search-write, socket/status, stop/start or reboot,
  and all preservation checks. Never delete contents or a socket.
- [ ] `TASK-SDP-052` — On failure, do not invoke rollback unless a later
  separately approved exact package operation binds the predecessor/manifest
  and explicit rollback action under the original plan; never revive the old
  blocked installer automatically. Stop at `MANUAL_CONTROLLER_STOP` if service
  cannot safely start. Record stop/start and real reboot evidence distinctly.
  On PASS, return to the same `SERVICE_BEFORE`/complete-environment window and
  then original D1; do not infer `BLK-D1A-008`, M4, or Desktop completion.

## Archive completion record — R378 (2026-09-17)

The original checkboxes above preserve the R342 Spec-stage record. They are not
the current completion state. The following evidence disposition supersedes only
those historical status fields; it does not change the approved task contracts.

| Tasks | Actual completion and evidence |
|---|---|
| 001–003 | R342 complete seven-file Spec Gate and ponytail review accepted. |
| 010–012 | R344 isolated Test source/health and valid real-listener causal RED accepted; TDD_READY bound the frozen Test. The observed listener error was EACCES, not an invented ENOENT result. |
| 020–021 | Minimum Worker changed only host-loop.mjs. R347 found F1/F2; R348 established both causal REDs, followed by the bounded R349 production correction. |
| 030–032 | R349 helper 1/1, health 2/2, causal GREEN 2/2, startup matrix 173/173, ordinary mode 273 PASS/19 A2 skips, canonical 1410 PASS/1 provider skip. Retirement PASS after the isolated R346 cleanup; R349 final identities supersede earlier intermediate passes. |
| 040–042 | R349 frozen source/Test/spec and complete logs; fresh independent R350 Validator PASS and Controller local acceptance, within the recorded evidence levels. |
| 050 | R351 exact integration through PR #31 and host package; R363 single-file deployment and stopped readback accepted at R364. Original predecessor and failure history retained. |
| 051 | R367 safely-created startup plus status and planned stop; residual socket correctly stopped further execution. Separately authorized R369 manual maintenance was completed at R371: one precise old-socket unlink followed by safe-existing startup and status. R368/R372 Controller acceptances preserve this limitation; this is maintenance-assisted stop/start, not automatic residual recovery or reboot proof. |
| 052 | No unapproved rollback or old-installer revival. R374/R376 complete environment, live origin, repository and fresh-WIP windows accepted at R375/R377; the startup and baseline branches returned to original D1. |

The task's prohibition on automatic deletion remains unchanged. The separately
approved operator maintenance is not production behavior and is not evidence
that an occupied/nonempty target passes the startup gate.

Current archive disposition: ACCEPTED_FOR_ARCHIVE / D1_FINALIZATION_PENDING.
R378 authorizes the documentation-only archive and canonical merge. Final D1
release and M4 remain contingent on the final integration identity and its
required baseline/readback evidence; Desktop is not authorized. See
[verification.md](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).
