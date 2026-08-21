# JuanerAI Human Project Board Specification

## Contract Identity

- Capability: `project-board`
- Contract version: `1.0`
- Source Changes: `project-board-observability` and
  `project-board-status-authority`
- Surface: local repository-backed human observability

The project board is a read-only human surface. Formal decisions remain in the
Codex CLI conversation. This specification incorporates the accepted PBSA
narrowing of base PB-REQ-004.

## PB-REQ-001 — Durable State and Current Authority

`.juanerai/project-control/status.json` SHALL be the sole current-state
authority. It SHALL contain one complete closed-schema v1 snapshot. Restarting
the CLI or loopback server SHALL render the last valid status snapshot.

`events/*.json` SHALL be immutable after creation but best-effort and
non-authoritative. Missing history SHALL NOT make a valid current status
unavailable, and an event's `status_after` SHALL NOT override status fields.
`decision-briefs/*.json` SHALL remain display-only context. Unsupported,
unknown, malformed, or invalid v1 records SHALL fail closed.

Acceptance mapping: PB-AC-001; PBSA-AC-001..003.

## PB-REQ-002 — Read-Only Browser and Server Boundary

The server SHALL bind to loopback and expose only GET/HEAD reads needed for the
HTML board, health, aggregate project-control state, and constrained referenced
documents. It SHALL reject invalid Host, Origin, method, brief identifier,
reference index, path traversal, and unknown routes.

Browser requests SHALL NOT modify project-control files, execute commands,
start agents, approve decisions, access arbitrary paths, or reach external
systems. Browser notes and exports SHALL remain local and non-authoritative.

Acceptance mapping: PB-AC-002; PBSA-AC-013..015.

## PB-REQ-003 — Human Comprehension

The board SHALL present current phase, health, milestones, objective, next
action, blockers, agents, metrics, evidence, risks, history, and decision
context from validated records. Repository-backed, static, unavailable, and
stale states SHALL remain distinguishable. Decision briefs SHALL direct formal
choices to Codex CLI and SHALL NOT claim that the board submitted a choice.

Acceptance mapping: PB-AC-003, PB-AC-005.

## PB-REQ-004 — Controller Mutation Admission and Publication

The Controller through `tools/harness/project-board/status-cli.mjs` SHALL be the
only supported writer. Only one supported mutation is in flight; concurrent
Controllers and direct filesystem writers are outside this contract.

For `set`, `milestone`, and `replace`, the CLI SHALL parse required input,
construct and validate the complete status and event candidates, then publish
status through a uniquely named same-directory temporary file and atomic rename
over `status.json`. Successful rename is the current-state publication point.
If validation or publication fails, the command SHALL return nonzero, preserve
the prior status, issue no event append, and emit no event-append warning.

For `brief`, the CLI SHALL construct and validate the complete brief and event
candidates before atomically replacing the display brief. A brief write grants
no decision authority. For `event`, the complete event candidate SHALL validate
before append is attempted.

Acceptance mapping: PB-AC-004; PBSA-AC-004..008, PBSA-AC-012.

## PB-REQ-005 — Best-Effort Event Failure

After a successful status or brief publication, the CLI SHALL make exactly one
event append attempt. It SHALL NOT retry, roll back, compensate, replace the
published file, or detach background work. An event-only command SHALL likewise
make one append attempt after validation.

If append succeeds, the command SHALL return success silently. If append I/O
fails, the command SHALL return exit code 0 and write exactly one UTF-8 stderr
line, including its final LF:

```text
{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n
```

The warning SHALL NOT contain the underlying path, platform error, stack,
timestamp, or event identifier. Filesystem operations have no timeout contract.

Acceptance mapping: PBSA-AC-009..012.

## PB-REQ-006 — Compatibility, Activation, and Rollback

The v1 status, event, and brief field sets, validators, paths, server, browser,
and dependency set SHALL remain compatible. This contract adds no migration,
transaction log, revision, hash chain, baseline, staging area, projection
recovery, concurrency protocol, retry queue, timeout, or background writer.

Activation is the accepted CLI behavior. Rollback restores the preceding
`status-cli.mjs` implementation without rewriting status, events, or briefs.
Existing valid v1 records SHALL remain readable before activation, after
activation, and after rollback.

Acceptance mapping: PBSA-AC-014..016.

## Authority and Evidence

The board never overrides explicit Codex CLI decisions, approved OpenSpec,
tests, repository evidence, Task Bus state, or Controller acceptance. The
accepted executable baseline is the base validator suite plus the PBSA focused
public-CLI suite. HTTP and real-browser regression remain required for changes
to the server, browser, persistence authority, or decision-display boundary.
