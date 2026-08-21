# TASK-010 R3 User-Cancellation Linearization Clarification 001

## Status and Authority

**SPEC_READY — Controller Spec Gate candidate.** The user approved
`XCLI-TASK010-CANCEL-LINEARIZATION-001`, Option A (success-linearization
wins). On Controller Spec Gate PASS, this clarification is the sole normative
authority for the user-cancellation portions of R3-REQ-002 and R3-REQ-003. It
clarifies, rather than replaces, `spec-task-010-validator-remediation-r3.md`.
Where their user-cancellation wording differs, this document controls. The
prior decision record is retained for provenance only and is not a competing
normative choice.

## Objective, Scope, and Non-Goals

The objective is to make cancellation observable and convergent at every
pending Artifact boundary without claiming that already-issued physical I/O
can be undone. The delivery objective is one deterministic Application RED
and the smallest Application-only repair after TDD_READY. The learning
objective is limited to proving terminal linearization and deadline precedence
with virtual scheduling; it creates no new product capability.

This clarification adds no schema field/status, Port/API method or input,
Adapter mechanism, retry, cleanup, repair, model, tool, source, dependency,
or external call. `in_progress`, `succeeded`, `failed`, and `cancelled` remain
the closed lifecycle. Existing R3 data, security, activation, rollback, and
retirement constraints remain unchanged.

## R3-CL-001 — User Cancellation Closes Future Normal Admission

On user `cancel()` after confirmation and before deadline expiry, Application
SHALL immediately close normal admission and request Runtime cancellation. It
SHALL NOT initially abort the one absolute-deadline signal. A normal
publication/Runtime/analysis unit that has not been admitted at that instant
SHALL NOT start.

An Artifact unit that was admitted before user cancellation is already-issued
physical work. It MAY settle or physically linearize while the signal remains
live, but its settlement SHALL NOT reopen normal admission or start a
subsequent normal unit. `confirm()` and `cancel()` SHALL converge to one
terminal result, subject to R3-CL-003's `commitSuccess` exception and
R3-CL-004's deadline winner.

## R3-CL-002 — Pending begin/Contract/Asset Settlement

If user cancellation occurs during an already-admitted `beginRun`,
`commitConfirmedContract`, or `appendAsset`:

1. Application SHALL wait only until that unit settles or the unchanged
   absolute deadline expires.
2. It SHALL NOT admit another normal unit: respectively no contract/Runtime/
   asset/success after `beginRun`; no Runtime/asset/success after contract;
   and no later Runtime continuation/asset/success after asset.
3. If `beginRun` has made a run visible, or either later unit was pending in an
   already visible run, Application SHALL admit exactly one exceptional
   cancelled-terminal `replaceManifest` after the issued unit settles and
   before deadline expiry. That terminal admission is solely to close that
   visible `in_progress` run and SHALL NOT be treated as normal continuation.
4. The resulting cancelled manifest is authoritative; `confirm()` and
   `cancel()` SHALL converge to the same cancelled result. A late contract or
   asset is neither Evidence nor success.

Application SHALL NOT resolve a user cancellation while an already-issued
`beginRun` has settled into a visible `in_progress` run without either that
cancelled terminal or R3-CL-004's timeout result. No background repair,
second run, retry, cleanup, or unbounded user-cancel wait is authorized.

## R3-CL-003 — Pending commitSuccess: Success Linearization Wins

If user cancellation occurs after `commitSuccess` has been admitted with its
still-live deadline signal and before its final succeeded `run.json`
linearizes, Application SHALL NOT concurrently admit a cancelled-terminal
`replaceManifest`. It SHALL await only that issued `commitSuccess` settlement
or the unchanged absolute deadline.

- If the final succeeded `run.json` linearizes first, `succeeded` is the sole
  authoritative terminal state. `confirm()` and `cancel()` SHALL converge to
  the same succeeded result, and no cancelled manifest SHALL be written.
- If the issued `commitSuccess` settles without success linearization before
  deadline expiry, Application SHALL admit exactly one cancelled-terminal
  `replaceManifest`; `confirm()` and `cancel()` SHALL converge to that
  cancelled result.
- Candidate `evidence.json`, `summary.md`, or `evidence.md` written before
  final `run.json` remain non-success candidates under R3-REQ-003 and do not
  alter either branch.

This rule is intentionally limited to an already-admitted `commitSuccess`.
It grants no normal post-cancel success admission and introduces no Adapter
ordering, compare-and-swap, cancellation, or persistence capability.

## R3-CL-004 — Deadline Is the Absolute Winner

At absolute deadline expiry, existing R3 behavior controls every row above:
Application closes admission, aborts the shared signal, requests Runtime abort
without awaiting permanently pending work, selects logical `TIMEOUT`, and
starts no terminal or other publication unit. `confirm()` and `cancel()` SHALL
converge to `TIMEOUT`. A late issued Artifact result, including a late
`commitSuccess` result, SHALL be discarded by Application and SHALL NOT regain
an Application success result or trigger a terminal write.

This does not assert impossible cancellation of already-issued physical I/O;
the Adapter's R3 publication-unit and abort rules continue to govern its
atomic boundary.

## Acceptance Criteria and Test Obligation

Existing `AC-XCLI-013-01` and `AC-XCLI-013-02` receive the following
observable clarification; no AC identifier is added:

1. TEST-XCLI-017 SHALL retain deterministic pending `beginRun`,
   `commitConfirmedContract`, and `appendAsset` cases. Each proves immediate
   no-next-normal-admission, a live signal before expiry, exactly one
   cancelled terminal after the gated issued unit settles, and convergence of
   `confirm()`/`cancel()` to the cancelled result.
2. TEST-XCLI-017's existing unconditional pending-`commitSuccess`
   cancelled/no-success case is superseded. It SHALL split into two
   deterministic branches: (a) gated final success linearization, proving
   `confirm()`/`cancel()` converge to succeeded and no cancelled terminal is
   admitted; (b) gated settlement without success linearization, proving one
   cancelled terminal and convergence to cancelled. Both retain no-new-normal-
   admission assertions.
3. Existing deadline cases remain mandatory and separately prove signal abort,
   `TIMEOUT`, no new terminal write, and late-result discard for every pending
   Artifact boundary, including `commitSuccess`.
4. Tests SHALL use the existing private virtual scheduler and deterministic
   pending doubles. They SHALL NOT use wall-clock timing, a production seam,
   retries, cleanup, or direct Artifact mutation to manufacture ordering.

The corrected Test result is causal RED only if current Application fails the
new behavior because it lacks the required admission/convergence logic, not
because of a test harness, Adapter, fixture, or unrelated component failure.

## Task Mapping, Worker Boundary, Validation, and Rollback

This maps solely to existing TASK-010 R3 remediation, `R3-REQ-002`,
`R3-REQ-003`, `AC-XCLI-013-01`, `AC-XCLI-013-02`, and TEST-XCLI-017. After
Controller records the corrected causal RED and `TDD_READY`, only
`packages/application/local-analysis.mjs` is released to the configured
Worker. Analytics and Pi remediation are already GREEN and frozen; Adapters,
Ports, Profile, Product Core, CLI, fixtures, tests, manifests/dependencies,
credentials, model routing, and project-control remain forbidden to that
Worker.

Validation remains corrected focused integration coverage, complete frozen
regression, the existing formal MiniMax-M3 run, and a fresh independent
Validator PASS. Activation is unchanged R3 composition activation. Rollback
disables the composition and never repairs, deletes, or rewrites an existing
run. This clarification retires with the parent Change archive.
