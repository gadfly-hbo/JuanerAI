# Engineering decision 003 — explicit close of a legacy parent

Owner: Mac mini Engineering Controller. Date: 2026-10-01.
Decision: **ACCEPTED**, limited to the C1 extension below. This is an in-boundary
material engineering contract decision, not new product or data authority.

## Basis

Approved FS-R08 / AC-FS-09 / UI-FS-13 require an effective explicit parent close
and explicit reopen. The Controller reviewed design.md's
`CONTRACT_CHANGE_REQUEST — C1 explicit close on schema100`, decision001 C1/C5,
and independent Validator candidate002 findings and probe002. The actual native
schema100 close returned success but left `open:true, epoch:0` and admitted
`prepare_child`; the permanent real-handler RED reproduces that exact failure.
Candidate001 and candidate002 remain immutable historical FAIL candidates.

## Accepted narrow change

Extend decision001 C1's first-collaboration-creation activation trigger to include
the user's **confirmed v1.1 explicit session close**. Reuse the exact accepted
100-to-101 migration and lifecycle table. In one transaction, activate that schema,
persist the selected root closed at its initial epoch, and interrupt its applicable
active work. Do not create a child, child-creation receipt, result, return, review,
formal record or report merely to close a parent. Other families retain their
history and state.

Read, list, opening untouched history, prepare, and cancel must not activate the
schema. Preserve root v1.0 close and ordinary native/Application shutdown behavior
for untouched schema100 projects. A private explicit-intent distinction through
the existing handler/Application/Store seam is permitted; no new public IPC field,
schema version, table, file, runtime or user decision surface is approved.

Revoke grants, previews and pending admission synchronously before storage waits.
The durable closed state must reject new operations in a fresh Application;
explicit reopen permits new authorization without restoring old grants, invoking
a model or automatically returning results.

Before-COMMIT failure leaves the exact prior schema and no partial migration.
Unknown COMMIT is resolved through exact schema/lifecycle readback, with local
safety fences retained until resolved. Do not report a clean durable close without
evidence. Explicit retry must not duplicate effects or advance an already committed
close epoch again. Preserve historical body/hash/source/report bytes apart from
the already required interruption of active assistant attempts.

## Compatibility and verification

A confirmed new close can now activate schema101 even before a child exists.
Old binaries then reject that sidecar under the existing compatibility contract.
There is no downgrade compatibility, down-migration, backfill, user-database restore,
blanket migration or installed-application change. This refines the activation of
an already accepted schema to satisfy the approved persistent close behavior.

Required checks: schema100 read/list/open/prepare/cancel byte preservation; explicit
close and fresh-process readback; stale authorization/preview/pending refusal
across close and reopen; other-family and v1.0 compatibility; schema101 regression;
pre-COMMIT rollback and lost-COMMIT readback/idempotency; current type/offline/package
checks; real native close and unchanged probe002 assertions on the new fixed package.
Use only task-owned synthetic projects and processes. Preserve all prior failures.

The same engineering worker may update the affected design/spec/tests and implement
this decision. Freeze the next complete candidate only after authorized checks and
host verification. Independent Validator must reassess this contract and its effects.
Real Keychain F6 remains NOT RUN(permission); no Provider, credential, business-data,
dependency, Git, archive, Engineering Acceptance or Product Acceptance authority is
added by this decision.
