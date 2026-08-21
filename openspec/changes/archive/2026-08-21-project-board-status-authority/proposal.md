# Project Board Status Authority

- Change ID: `project-board-status-authority`
- Change class: R2 boundary change
- Difficulty: standard
- Lifecycle state: corrected, independently revalidated, accepted, and archived 2026-08-21
- Owner: Controller; role-scoped work is dispatched only at its gate

## Why

The restored project-board v1 implementation correctly publishes one complete
current snapshot, but its CLI still reports failure when a later,
non-authoritative event append fails. That result conflicts with the approved
authority boundary: `.juanerai/project-control/status.json` is the sole current
state, while `events/*.json` is best-effort history.

The base `project-board-observability` Change also states in PB-REQ-004 that
material mutations append history and reject invalid input without partial
writes. This replacement Change explicitly narrows that statement: validation
and the authoritative status or display-only brief write remain fail-closed,
but failure of the separate best-effort event write is warning-only and cannot
invalidate an already completed write.

The cancelled PB-ATOMIC design never activated. Its retrospective shows that
stronger machinery addressed unsupported concurrent Controllers rather than a
real board requirement. No migration from that design is therefore needed.

## Goal

Freeze and prove the smallest v1 behavior correction:

1. validate complete mutation candidates before any write;
2. publish `status.json` by same-directory temporary file and atomic rename;
3. attempt one best-effort event append only after the status or brief write
   succeeds;
4. keep a successful status or brief write successful when that append fails,
   while emitting one stable warning;
5. preserve `status.json` as the only current-state source read by CLI, server,
   and browser.

## Scope

- `set`, `milestone`, and `replace` status mutations through
  `status-cli.mjs`.
- `brief` display-record mutation through `status-cli.mjs`, with its existing
  brief meaning unchanged.
- `event` as an event-only best-effort command.
- Exact CLI exit and stderr behavior for validation, status/brief publication,
  and event append failures.
- Focused public-CLI tests using isolated temporary project-control fixtures.
- Regression of the v1 validators, `show`, loopback read-only server, and
  read-only browser boundary.

## Out of Scope

- Concurrent Controllers or any other writer; ordering or conflict behavior
  between concurrent calls is unsupported and untested.
- New persistent fields, schemas, directories, identifiers, databases,
  dependencies, network behavior, or Xanthil product behavior.
- Making events authoritative, complete, replayable, or required for current
  state.
- Changing event naming, retention, ordering, or the 50-event display limit.
- Changing decision-brief v1 fields or granting a brief authority to approve a
  decision.
- Changing server routes, browser capabilities, or document-read boundaries.
- Data migration. The cancelled design produced no live authority to migrate.
- A canonical validation runner or TypeScript migration.

## Existing Behavior Reuse and Intended Delta

Reused unchanged:

- v1 `validateStatus`, `validateEvent`, and `validateBrief` contracts;
- `atomicWriteJson` same-directory temporary-file plus rename behavior;
- `appendEvent`, `createEvent`, and event filename behavior;
- `readProjectControl`, server, browser, and decision-brief semantics;
- existing project-board tests and all accepted base observations.

Intended production delta: only `status-cli.mjs` shall preconstruct and validate
the relevant event before a mutation write, and shall convert a later event
append error into the exact warning and success semantics specified here.

## Risk, Evidence, and Dependencies

Risk is R2 because the Change freezes persistence authority, publication, and
failure semantics. Difficulty is standard because the prior design never
activated, inputs are approved, the delta is local, and one production file is
sufficient. The required Spec route is Sol high under
`docs/governance/agent-model-routing.md`.

The Change uses the existing Node.js runtime and no new dependency. Required
evidence is R2 negative-first evidence at the real CLI process/filesystem seam:
candidate rejection before write, single-file atomic replacement, publication
failure isolation, real event-path failure after a successful status or brief
write, event-only failure, exact warning bytes and exit codes, current-state
display, v1 regression, and read-only server/browser regression.

## Path Contract

### Allowed after the applicable gate

- Controller/specification: `openspec/changes/project-board-status-authority/**`
- Test Agent after Spec Gate PASS:
  `tools/harness/project-board/status-cli.test.mjs`
- Worker after TDD_READY: `tools/harness/project-board/status-cli.mjs`
- Validator: read-only repository access after implementation and evidence are
  frozen

### Conditional

- `tools/harness/project-board/project-control.test.mjs` may be changed only by
  a Controller-approved Test correction proving that the new focused test file
  cannot preserve an existing v1 assertion. It is not part of the initial Test
  write set.
- `tools/harness/project-board/project-control.mjs` may be changed only after a
  Contract Change Request and revised Spec Gate demonstrate that the frozen
  CLI-only production delta cannot satisfy an approved Acceptance Criterion.

### Forbidden in this Change

- `.juanerai/project-control/**`, including status, events, briefs, and schemas
- `tools/harness/project-board/README.md`, `server.mjs`, `index.html`, and the
  launcher
- `openspec/changes/project-board-observability/**`
- the retrospective, `AGENTS.md`, architecture/governance documents, manifests,
  dependencies, Git state, databases, network integrations, and all product
  code
- removal, weakening, or replacement of any existing base test

The Controller owns Change documents and lifecycle state. Test, Worker, and
Validator roles return evidence rather than editing project-control records.

## Activation and Rollback

Activation is the accepted `status-cli.mjs` behavior after Spec Gate, causal
RED, TDD_READY, GREEN and regression evidence, independent verification, and
Controller/user acceptance. There is no flag, file conversion, or data
migration.

Rollback restores the preceding `status-cli.mjs` behavior. Existing v1 status,
event, and decision-brief files remain readable; no persistent rollback action
is required.

## Admission Gate

PBSA-PACKAGE-001 all A was approved and the Controller issued Spec Gate PASS
and TDD_READY. Test and Worker scopes have completed with frozen GREEN
evidence. The final-state correction received fresh independent revalidation,
and the real `health=complete` pre-archive suite passed 12/12. Controller has
accepted the Change and authorized archive.
