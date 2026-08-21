# Project Board Status Authority Delta Specification

## Delta and Precedence

This specification changes only the project-board v1 CLI publication and
failure contract. It supersedes the base
`project-board-observability` PB-REQ-004 phrase “Material mutations SHALL append
history and reject invalid inputs without partial writes” as follows:

- a valid material mutation shall make one event append attempt after its
  status or brief write succeeds;
- an append failure means history is absent, not that the completed status or
  brief write failed;
- invalid status, event, or brief candidates still fail before any write;
- all other PB-REQ-004 behavior and PB-REQ-001..003/PB-REQ-005 remain
  unchanged.

## PBSA-REQ-001 — Sole Current-State Authority

`.juanerai/project-control/status.json` SHALL remain the sole current-state
authority. It SHALL retain the closed `1.0` status schema and one-snapshot
grain. `show`, `readProjectControl()`, the loopback server, and the browser
SHALL obtain current phase, health, objective, next action, blockers,
milestones, agents, metrics, evidence, risks, and update metadata from that
validated status record.

`events/*.json` SHALL remain best-effort, non-authoritative history. An event's
`status_after`, time, actor, or summary SHALL NOT replace or override any field
of current status. Decision briefs SHALL remain display-only context and SHALL
NOT approve or resolve a decision outside the Codex CLI conversation.

### PBSA-AC-001

Given a valid v1 status and any valid event whose `status_after` differs, when
current project control is shown, then the current state equals the status file
and the event appears only as history.

### PBSA-AC-002

Given an earlier successful status publication whose subsequent event append
failed, when the event path is available again and `show` runs, then the
published status is current even though no matching event exists.

### PBSA-AC-003

The v1 status, event, and brief field sets and validators remain byte-contract
compatible with existing valid files; no new persistent field or schema is
accepted.

## PBSA-REQ-002 — Pre-Write Admission and Validation

A supported mutation is admitted only after the CLI command, required flags,
external JSON input if any, complete candidate status or brief, and candidate
event have been parsed and validated. For an event-only command, admission
requires the complete candidate event to validate.

Validation failure SHALL occur before any temporary or final status, event, or
brief file is written. It SHALL emit the existing error form on stderr and
return a nonzero process exit code. It SHALL NOT emit the event-append warning.

### PBSA-AC-004

Invalid complete status input to `replace`, or a `set`/`milestone` candidate
that violates the v1 status contract, returns nonzero and leaves status,
events, and briefs byte-for-byte unchanged.

### PBSA-AC-005

An invalid explicit event type or other invalid event candidate on a status
mutation returns nonzero before status publication and leaves status, events,
and briefs byte-for-byte unchanged.

### PBSA-AC-006

An invalid event-only candidate returns nonzero and writes no event or other
record. An invalid brief candidate returns nonzero and changes neither the
brief nor any status or event record.

## PBSA-REQ-003 — Single-File Status Publication

After admission, a status mutation SHALL write the complete validated status
to a uniquely named temporary file in the same directory as `status.json`,
then atomically rename that file over the fixed `status.json` path. Successful
rename is both the physical and Application-visible publication point. Before
that point the previous status remains authoritative; after it the complete
new status is authoritative.

The implementation SHALL NOT use an event as a prerequisite, publication
marker, fallback, or source for current state.

### PBSA-AC-007

Successful `set`, `milestone`, or `replace` publication exposes one complete
validated v1 status at the fixed path and never exposes a partially serialized
status as current state.

### PBSA-AC-008

If temporary-file creation, serialization, write, or rename fails before the
publication point, the CLI returns nonzero, the prior `status.json` remains
authoritative, and no event append is attempted. A non-authoritative temporary
artifact left by an operating-system failure is never read as current state;
safe cleanup is permitted but is not a success condition.

## PBSA-REQ-004 — Best-Effort Event Failure Contract

After a status or brief publication succeeds, the CLI SHALL issue exactly one
event append attempt. It SHALL NOT retry the append. If the append succeeds,
the command succeeds with no warning. If it fails, the already completed
status or brief write remains valid and the command SHALL:

- write exactly one UTF-8 line to stderr, including its final newline:
  `{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n`;
- write no underlying filesystem path, platform error text, stack, timestamp,
  event identifier, or other variable content as part of that failure;
- return process exit code `0`;
- perform no rollback, replacement, or compensating write.

An event-only command SHALL validate first and issue exactly one event append
attempt. Failure has the same exact warning and exit-code `0`, and SHALL have no
effect on `status.json` or decision briefs.

### PBSA-AC-009

At the public `set`, `milestone`, or `replace` CLI seam, a real filesystem
failure at the event destination after successful status rename yields exit
code `0`, exactly the specified warning once, an updated valid status, and no
new event.

### PBSA-AC-010

At the public `brief` CLI seam, a real filesystem failure at the event
destination after successful brief rename yields exit code `0`, exactly the
specified warning once, the updated valid display brief, unchanged status,
and no new event.

### PBSA-AC-011

At the public `event` CLI seam, a real filesystem failure at the event
destination yields exit code `0`, exactly the specified warning once, and
byte-for-byte unchanged status and briefs.

### PBSA-AC-012

If status publication fails, the command returns nonzero and emits no
`PROJECT_BOARD_EVENT_APPEND_FAILED` warning, proving that no event append was
issued after the failed publication.

## PBSA-REQ-005 — Sole Writer and Unsupported Concurrency

The Controller through `status-cli.mjs` SHALL be the sole supported writer of
project-control status, event, and brief records. The server and browser SHALL
remain read-only.

Only one supported CLI mutation is in flight. Behavior for concurrent
Controllers, direct filesystem writers, or overlapping CLI mutations is
outside this contract and SHALL NOT be tested or inferred. There is therefore
no supported contender, race winner, convergence promise, or cross-call
ordering rule.

For the one supported call, already-issued work consists only of the current
status or brief write after admission, followed on success by one event append
attempt. The CLI has no timeout or cancellation input. It waits for the issued
filesystem operation to settle, applies PBSA-REQ-003/004, and issues nothing
else.

### PBSA-AC-013

Server and browser regression proves GET/HEAD-only project-control access,
rejection of mutating browser methods and invalid read inputs, and no record
changes caused by browser use.

### PBSA-AC-014

The implementation and tests introduce no supported second writer, concurrent
mutation case, timeout, cancellation, retry, or background write.

## PBSA-REQ-006 — Compatibility, Activation, and Rollback

The Change SHALL add no migration. Activation SHALL be the accepted CLI code
behavior after all normal gates. Rollback SHALL restore the prior
`status-cli.mjs` behavior without rewriting project-control records. Existing
valid v1 status, events, and briefs SHALL remain readable before activation,
after activation, and after rollback.

### PBSA-AC-015

Existing v1 validator tests, committed-record reads, `show`, server reads, and
browser rendering regressions remain GREEN without fixture migration or schema
change.

### PBSA-AC-016

Static scope evidence shows that production changes are limited to
`status-cli.mjs`, test additions are limited to the approved focused test path,
and no forbidden persistent layout, schema, dependency, server, browser, base
Change, or product path changed.
