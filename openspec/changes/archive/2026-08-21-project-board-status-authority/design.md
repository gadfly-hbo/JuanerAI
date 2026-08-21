# Design

- Status: accepted and archived; final-state fixture corrected and revalidated
- Risk/difficulty: R2 / standard
- Production delta: `tools/harness/project-board/status-cli.mjs` only

## Authority Model

```text
Codex CLI decision authority
          |
          v
Controller -> status-cli.mjs -> status.json -> server/browser current state
                         |       (sole current-state authority)
                         +-----> events/*.json
                                 (best-effort history only)
                         +-----> decision-briefs/*.json
                                 (display-only context only)
```

The existing v1 schemas, paths, server, and browser remain unchanged. A status
event describes an observation after a mutation but never commits, confirms,
or reconstructs that mutation. A decision brief can change display state, but
formal approval remains in the Codex CLI conversation.

## Command Pipeline

### Status commands: `set`, `milestone`, `replace`

1. Parse the command and all required flags or input JSON.
2. Read and validate the current status when the command requires it.
3. Construct the complete candidate status, including update metadata.
4. Construct the complete candidate event.
5. Validate both candidates. Failure exits nonzero with no write.
6. Publish status through the existing same-directory temporary-file plus
   atomic-rename helper.
7. If publication fails, exit nonzero. Do not attempt the event.
8. If publication succeeds, attempt the already validated event once.
9. Event success returns success silently. Event failure emits the exact stable
   warning once and returns success.

### Brief command

1. Parse flags and brief ID; read and validate the existing brief and current
   status used only to populate the event.
2. Construct and validate the complete candidate brief and event.
3. Publish the brief with the existing atomic JSON helper.
4. On publication failure, exit nonzero and do not attempt the event.
5. On publication success, attempt the event once and apply the same warning
   contract if it fails.

The brief remains display-only. “Successful brief write” means only that its
v1 display record was replaced; it does not mean a user decision was approved.

### Event command

1. Parse flags and read current status only to populate `status_after`.
2. Construct and validate the complete event.
3. Attempt append once.
4. Success returns success silently. Failure emits the exact warning once and
   returns success. No status or brief write occurs.

## Publication and Failure State Table

| Point | Status/brief effect | Event effect | Exit | stderr |
|---|---|---|---:|---|
| Parse or candidate validation fails | none | none | nonzero | existing deterministic validation/argument error |
| Status/brief write fails before rename | prior file remains applicable | not attempted | nonzero | existing publication error; no event warning |
| Status/brief rename succeeds, event succeeds | complete new file applies | one new event | 0 | no event warning |
| Status/brief rename succeeds, event fails | complete new file remains applicable | no event | 0 | exactly one stable event warning |
| Event-only append succeeds | none | one new event | 0 | no event warning |
| Event-only append fails | none | no event | 0 | exactly one stable event warning |

The exact warning bytes are:

```text
{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n
```

The newline shown as `\n` is one final LF byte. The warning intentionally
omits underlying error details to remain stable across filesystems and
platforms and to avoid exposing paths. This Change does not add a diagnostic
channel or log.

## Admission, Issued Work, and Linearization

- Admission: parsing and complete candidate validation have succeeded.
- Issued work before publication: one status or brief atomic-write operation.
- Status physical and Application-visible publication point: successful rename
  over the fixed `status.json` path.
- Brief display publication point: successful rename over its fixed v1 brief
  path; this grants no decision authority.
- Issued work after publication: exactly one event append attempt.
- Late settlement: the CLI has no timeout/cancellation and awaits each issued
  operation. There is no detached work.
- Partial candidate output: only the fixed final v1 path is read as status or
  brief state. A temporary artifact is non-authoritative and ignored.
- Exceptional write: none. Failure never causes rollback, compensation,
  fallback status, or another event attempt.
- Absolute bound: one supported invocation, one publication attempt when
  applicable, then one event attempt only after publication success. Filesystem
  completion time is not bounded by this Change.

Concurrent Controllers and direct writers are unsupported, so no contract is
made for contender winners, overlapping rename order, or convergence. Tests
must not add such a scenario.

## Implementation Shape

The minimum implementation keeps all existing project-control helpers. In
`status-cli.mjs`, construct the event before calling the mutation writer and
place the one `appendEvent` call behind a small warning boundary that catches
only append failure. The outer `main().catch(...)` continues to own argument,
validation, read, and publication failures and retains nonzero exit behavior.

The warning boundary must not wrap status/brief publication. Doing so would
incorrectly convert authoritative/display publication failure into success.
It also must not catch candidate construction/validation errors, because those
are invalid commands rather than best-effort I/O loss.

No change is required in `project-control.mjs`; changing it is conditional on a
revised Spec Gate because broad helper-level swallowing could affect server or
other callers.

## Testability

Tests execute the public CLI in an isolated temporary repository-shaped
fixture containing copies of the unchanged project-board modules and valid v1
records. Making the fixture `events` directory readable but non-writable
allows `readProjectControl()` to succeed and then induces a real filesystem
append failure without a production test seam or mock. Status publication
failure is induced independently by making the fixture project-control
directory readable but non-writable while leaving its prior status intact.
The harness must prove that its filesystem honors both restrictions before it
uses either result; otherwise the evidence is BLOCKED rather than skipped.

Each failure test snapshots relevant files before invocation and checks exit,
exact stderr, final validated files, and forbidden writes. The live
`.juanerai/project-control/` tree is never a test target.

## Security and Data Boundaries

The Change adds no external access, credential, product data, or secret path.
Stable warnings disclose no filesystem path or platform error. Server Host,
Origin, method, document-path, and loopback restrictions remain unchanged.
Browser state remains unable to write project-control records or approve a
decision.

## Compatibility, Activation, and Rollback

No persistent shape changes. Existing v1 files remain valid. There is no data
migration, feature switch, mixed format, or repair step.

Activation is accepted code behavior after all gates. Rollback restores the
prior `status-cli.mjs`; it does not rewrite status, events, or briefs. A status
that succeeded while its event failed remains a valid v1 current snapshot
under both versions.

## Rejected Alternatives

- Treat event failure as command failure: rejected because it contradicts the
  event's non-authoritative meaning after status publication.
- Write the event before status: rejected because history cannot admit or
  commit current state.
- Retry, queue, or backfill events: rejected because best-effort history has no
  completeness promise and this would add lifecycle behavior.
- Change `atomicWriteJson` or schemas: rejected because the approved delta can
  be implemented at the CLI orchestration boundary.
- Support concurrent writers: rejected as outside the approved board contract.
