# Test Plan

- Status: Test Correction GREEN, refrozen, independently revalidated, accepted, archived
- Risk/evidence: R2, negative-first, real public CLI/filesystem seam
- Frozen initial Test write path:
  `tools/harness/project-board/status-cli.test.mjs`
- Frozen Worker write path after TDD_READY:
  `tools/harness/project-board/status-cli.mjs`

## Harness Preflight

After Spec Gate PASS, the Test Agent shall:

1. run the unchanged base test independently and prove the Node test
   environment is healthy;
2. construct an isolated temporary repository-shaped fixture, copying the
   current project-board modules and valid v1 status/event/brief records;
3. execute the copied `status-cli.mjs` as a child process at its public CLI
   boundary;
4. prove fixture writes never target `.juanerai/project-control/` in the real
   repository;
5. use real filesystem shapes for failures, not mocks, source-string scans,
   hidden production switches, or injected test-only behavior;
6. prove the test filesystem honors readable/non-writable directory permissions
   before relying on a permission failure; report BLOCKED rather than skip or
   infer a pass if it does not.

The exact test count, file identity, and command were frozen by the Test Agent
and independently reproduced by the Controller. The focused file contains nine
cases. The initial RED/Worker hash was
`dc3ba93f54c1cd80ac4355701b4f5e1cb2c25e7161634d0db0f888aa410b8065`;
the current post-archive correction hash is
`2c655075b0bb224850eacd2b21695a35d9d62bb4fa35e4553087822a33e07243`.
Frozen command:

```bash
node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs
```

## Planned Executable Tests

### PBSA-TEST-001 — Existing v1 contracts remain valid

- Run the unchanged `project-control.test.mjs`.
- Validate existing status, event, and brief records with closed v1 validators.
- Negative leaf: unknown fields and invalid brief references still fail closed.
- Maps: PBSA-AC-003, PBSA-AC-015.

### PBSA-TEST-002 — Complete status publication is atomic

- Positive: run `replace` with a valid complete v1 snapshot; exit is `0` and
  the final status validates and equals the candidate apart from specified
  update metadata behavior.
- Boundary: the fixed final path contains one complete JSON document with final
  newline after success.
- Failure: make the fixture project-control directory readable but non-writable
  while preserving its prior status file; prior status bytes remain
  authoritative, exit is nonzero, no event file is added, and stderr contains
  no event-append warning. Restore permissions in unconditional cleanup.
- Maps: PBSA-AC-007, PBSA-AC-008, PBSA-AC-012.

### PBSA-TEST-003 — Invalid status rejects before write

- Exercise invalid `replace` input and an invalid `set` or `milestone` status
  value.
- Assert nonzero exit and byte-for-byte unchanged status, event listing/content,
  and briefs.
- Maps: PBSA-AC-004.

### PBSA-TEST-004 — Invalid event rejects before status write

- Invoke a status mutation with a valid status change but unsupported
  `--event-type`.
- This is the primary pre-write-order causal RED against the restored code:
  the current code publishes status before constructing/validating that
  event.
- Assert nonzero exit, unchanged status/brief/event bytes, and no stable append
  warning.
- Separately invoke event-only with an invalid type and assert no record change.
- Maps: PBSA-AC-005, PBSA-AC-006.

### PBSA-TEST-005 — Invalid brief rejects before write

- Invoke `brief` with an unsupported candidate status.
- Assert nonzero exit and byte-for-byte unchanged brief, status, and events.
- Maps: PBSA-AC-006.

### PBSA-TEST-006 — Real status-associated event failure is isolated

- In the isolated fixture, keep the event destination readable for the initial
  status read but make it non-writable so the real append operation fails while
  the status directory remains writable. Restore permissions in unconditional
  cleanup.
- Invoke at least one public status command; `set` is the required representative
  and `replace`/`milestone` may be parameterized without adding concurrency.
- Assert status is a valid updated v1 snapshot, no event exists, exit is `0`,
  stdout stays unchanged, and stderr bytes equal exactly once:
  `{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n`.
- Restore an empty event directory, invoke `show`, and assert the updated status
  is current with no matching event required.
- This is causal RED because the restored code exits nonzero after the real
  append error.
- Maps: PBSA-AC-002, PBSA-AC-009.

### PBSA-TEST-007 — Real brief-associated event failure is isolated

- Use the same real event-destination failure with a valid brief display-state
  update.
- Assert updated brief validates, status bytes are unchanged, no event exists,
  exit is `0`, and stderr equals the exact warning once.
- Maps: PBSA-AC-010.

### PBSA-TEST-008 — Real event-only failure is warning-only

- Use the same real event-destination failure with a valid `event` command.
- Assert status and brief bytes are unchanged, no event exists, exit is `0`,
  and stderr equals the exact warning once.
- This is causal RED because the restored code exits nonzero.
- Maps: PBSA-AC-011.

### PBSA-TEST-009 — Current state is sourced only from status

- Prepare a valid status and valid event with a different `status_after`.
- Invoke `show` and assert `result.status` equals status while the differing
  event is present only in `result.events`.
- Repeat after TEST-006's missing-event case.
- Maps: PBSA-AC-001, PBSA-AC-002.

### PBSA-TEST-010 — Read-only and scope regression

- Re-run public server checks for health, aggregate state, and constrained
  document read.
- Reject POST and other mutating methods, invalid Host/Origin, traversal,
  invalid brief/reference, and unknown route; compare fixture record bytes
  before and after to prove no write.
- Re-run the established browser smoke for repository, static, unavailable,
  and stale states; confirm the browser presents no project-control write,
  execute, start-agent, or decision-approval action. Use the existing browser
  environment; add no dependency. Environment absence is BLOCKED evidence, not
  an inferred pass.
- Inspect the frozen diff and assert only the allowed production/test/Change
  paths changed and no cancelled-design machinery or new persistent shape was
  introduced.
- Maps: PBSA-AC-013, PBSA-AC-014, PBSA-AC-015, PBSA-AC-016.

## Coverage Shape

| Boundary | Positive | Negative | Boundary | Failure / forbidden side effect |
|---|---|---|---|---|
| v1 validation | TEST-001 | TEST-003..005 | TEST-001 | no record write |
| status publication | TEST-002 | TEST-003..004 | TEST-002 | publication failure in TEST-002; event isolation in TEST-006 |
| event history | TEST-009 | TEST-004 | exact warning in TEST-006..008 | no rollback, no retry-visible duplicate, no authority effect |
| brief display | TEST-007 | TEST-005 | unchanged v1 fields | status unchanged on event failure |
| CLI exit/stderr | normal branches in TEST-002 | validation nonzero | exact one-line bytes | publication nonzero; event I/O zero-with-warning |
| server/browser | TEST-010 reads | TEST-010 rejects | loopback/constrained docs | zero project-control writes |

## RED and Assertion Policy

Expected RED must be caused by the restored behavior at TEST-004, TEST-006,
TEST-007, and TEST-008. All harness health and unchanged base tests must be
GREEN concurrently. Test code is frozen before Worker dispatch. Any assertion
change during implementation returns to Test Design; Worker may not weaken or
replace it.

No test shall exercise concurrent Controllers, timing races, retry, timeout,
cancellation, background work, or live project-control mutation.

## Final-State Fixture Correction

The first post-archive regression produced 11/12 because PBSA-TEST-009 set the
historical event's `status_after` to the fixed value `complete`, while the
legitimate archived board status had also become `complete`. The test's
precondition, not the production behavior, was false. Test Correction is
limited to selecting a valid `status_after` that differs from the copied
current status. It SHALL preserve the assertions that `show.status` equals
`status.json`, the event remains history-only, and the two status values differ.
No production change or assertion weakening is authorized.

The Test Agent and Controller independently ran the frozen command after the
correction: 12/12 GREEN, including base 3/3 and focused 9/9. Production remains
at SHA-256
`c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`.
