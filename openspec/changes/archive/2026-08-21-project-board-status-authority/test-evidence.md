# PBSA-TASK-004 — Test Design and Causal RED Evidence

- Role: bounded R2 Test Agent substitute (`gpt-5.6-terra`, high)
- Date: 2026-08-21
- Production changes: none
- Live project-control writes: none
- Public seam: a copied `status-cli.mjs` process in a fresh temporary,
  repository-shaped fixture. The fixture contains only copied board modules and
  copied valid v1 `status.json` / `INPUT-001.json` records; each test snapshots
  the corresponding live source bytes and asserts they did not change.

## Harness Health

Executed successfully before RED:

```bash
node --check tools/harness/project-board/status-cli.test.mjs
node --test tools/harness/project-board/project-control.test.mjs
```

The unchanged base suite passed **3/3**. It continues to validate committed v1
records and closed-field rejection.

Each permission fixture changes only its temporary directory to mode `0555`,
then first attempts a real probe write. A successful probe causes a hard
`BLOCKED` assertion; it did not occur. The test restores the original directory
mode in an unconditional `finally` block before fixture deletion. No mock,
source inspection assertion, production hook, concurrency, retry, or live
record target is used.

## Frozen Test Identity

- Test file: `tools/harness/project-board/status-cli.test.mjs`
- Test cases in that file: **9** (PBSA-TEST-002 through PBSA-TEST-009)
- Existing base file supplies PBSA-TEST-001; PBSA-TEST-010 remains the
  Controller-owned existing server/browser/scope regression run.
- Frozen focused command:

```bash
node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs
```

SHA-256 after the RED execution:

```text
dc3ba93f54c1cd80ac4355701b4f5e1cb2c25e7161634d0db0f888aa410b8065
```

Any assertion or fixture change requires return to Test Design; Worker may change only
`tools/harness/project-board/status-cli.mjs`.

## Causal RED Run

The frozen focused command produced **12 total: 8 pass, 4 fail, 0 skipped,
0 cancelled**. The 3 base tests were GREEN and the non-target focused cases
were GREEN. The four RED failures map directly to missing approved behavior:

| Test | Observed current behavior | Why this is causal RED |
|---|---|---|
| PBSA-TEST-004 | `set --event-type not-a-real-event` exits nonzero but `status.json` changes from `active` to `waiting_user`. | Current CLI publishes status before it constructs and validates its event candidate. The approved contract requires event admission before any status write. |
| PBSA-TEST-006 | A real non-writable `events/` directory allows the status rename and `show` reads the new status, but the CLI exits `1`. | The already-published status is correct, but append failure reaches the outer error handler instead of returning `0` with the exact stable warning. |
| PBSA-TEST-007 | A real non-writable `events/` directory allows the atomic brief replacement and leaves status unchanged, but the CLI exits `1`. | The same post-publication append error is incorrectly treated as brief-command failure. |
| PBSA-TEST-008 | A real non-writable `events/` directory leaves status and brief byte-identical, but the event-only command exits `1`. | The event-only append failure does not yet implement the approved warning-only success contract. |

The three append tests each require, after GREEN, exactly these stderr bytes:

```text
{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n
```

They also assert empty stdout, no event record, and the command-specific
status/brief result. The test did not assert any internal call order or mock
implementation detail.

## Recommendation

**Recommend TDD_READY.** The test environment is healthy, real filesystem
permission failure was proven, all RED cases arise from the approved missing
CLI behavior, and the required production repair remains within the frozen
single file path. Controller must independently review this evidence and issue
TDD_READY before dispatching Worker.

## Post-Archive PBSA-TEST-009 Fixture Correction

- Role: bounded R2 Test Correction substitute (`gpt-5.6-terra`, high)
- Date: 2026-08-21
- Production changes: none; `status-cli.mjs` remains SHA-256
  `c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`.
- Live project-control writes: none.

The original TEST-009 fixture fixed `historicalEvent.status_after` to
`complete`. After PBSA archive, the legitimate live source status also had
`health: complete`, so the test's required `assert.notEqual` correctly failed
despite `show` returning the validated status and historical event unchanged.
An isolated repository-shaped fixture with current status deliberately set to
`complete` reproduced that exact condition: `show` exited 0, both values were
`complete`, and only the fixture inequality would fail. This is a final-state
fixture collision, not a production behavior regression.

TEST-009 now derives a closed v1-valid historical value from the copied current
fixture: it uses `active` when the current health is `complete`, otherwise
`complete`. It retains all three authority assertions: shown status equals
`status.json`, the historical value differs, and the event is present only in
history. No assertion was deleted or weakened.

Correction verification:

```bash
node --check tools/harness/project-board/status-cli.test.mjs
node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs
git diff --check
```

All commands passed. The combined suite is **12/12**: base v1 **3/3** plus
focused PBSA CLI **9/9**, with 0 fail, skip, cancel, or todo. The corrected
focused-test SHA-256 is:

```text
2c655075b0bb224850eacd2b21695a35d9d62bb4fa35e4553087822a33e07243
```
