# Tasks

## Gate and Ownership Rules

- Controller owns this Change, scope, Spec Gate, TDD_READY, integration,
  acceptance, archive, and project-board lifecycle updates.
- Spec Agent may write only this Change package and stops at `SPEC_READY`.
- Test Agent starts only after Controller Spec Gate PASS and owns only the
  frozen test path.
- Worker starts only after causal RED and Controller TDD_READY and owns only the
  frozen production path.
- Validator starts only after implementation and evidence are frozen and is
  read-only.
- Existing tests may not be removed, weakened, or edited to conceal a failure.

## Work Items

- [x] **PBSA-TASK-001 — Confirm structure and cancelled-work state**
  - Owner: Controller/user decision, consumed by Spec Agent
  - Inputs: approved `structure-confirmation.md`, cancellation retrospective,
    restored HEAD implementation
  - Output: one approved authority boundary and no migration obligation
  - Paths: read-only outside this Change
  - Maps: PBSA-REQ-001, PBSA-REQ-005, PBSA-REQ-006

- [x] **PBSA-TASK-002 — Draft complete replacement Change package**
  - Owner: Spec Agent
  - Output: proposal, delta spec, design, tasks, test plan, traceability, and
    verification read model
  - Allowed: `openspec/changes/project-board-status-authority/**`, excluding
    modification of approved `structure-confirmation.md`
  - Maps: PBSA-REQ-001..006

- [x] **PBSA-TASK-003 — Controller item-by-item Spec Gate**
  - Owner: Controller
  - Check: approved decisions, PB-REQ-004 supersession, warning bytes, failure
    table, admission/publication order, testability, scope, activation, rollback
  - Write: Change documents only if corrections are required
  - Release condition: explicit Spec Gate PASS in `verification.md`
  - Evidence: PBSA-PACKAGE-001 all A approved by the user; Controller issued
    item-by-item Spec Gate PASS on 2026-08-21
  - Maps: PBSA-REQ-001..006

- [x] **PBSA-TASK-004 — Derive executable tests and establish causal RED**
  - Owner: `juaner_test`, only after PBSA-TASK-003 PASS
  - Allowed: `tools/harness/project-board/status-cli.test.mjs`
  - Forbidden: production, live project-control, existing base test changes,
    dependencies, server/browser implementation
  - Evidence: healthy test harness, frozen test identity/command/count, new behavior
    fails for the intended reason, existing base tests stay GREEN
  - Result: 9 focused cases frozen at SHA-256
    `dc3ba93f54c1cd80ac4355701b4f5e1cb2c25e7161634d0db0f888aa410b8065`;
    combined run 12 total, 8 pass and 4 causal RED; base 3/3 GREEN
  - Reopened evidence: after lifecycle archive legitimately set current health
    to `complete`, PBSA-TEST-009's hard-coded historical `complete` fixture no
    longer differed from current state. Test Correction must dynamically select
    a valid different history status without changing the assertion or product.
  - Correction result: dynamic different-status fixture frozen at SHA-256
    `2c655075b0bb224850eacd2b21695a35d9d62bb4fa35e4553087822a33e07243`;
    Controller independently reproduced 12/12 GREEN
  - Maps: PBSA-TEST-001..010; PBSA-REQ-001..006

- [x] **PBSA-TASK-005 — Controller TDD_READY review**
  - Owner: Controller
  - Check: causal RED, public CLI/filesystem seam, negative coverage, unchanged
    assertions, exact Worker path
  - Write: evidence documents only
  - Release condition: explicit TDD_READY; no unresolved Test correction
  - Result: Controller independently reproduced the frozen 8/4 result and
    issued TDD_READY on 2026-08-21; Worker path remains exactly one file

- [x] **PBSA-TASK-006 — Implement minimum CLI failure correction**
  - Owner: `juaner_worker`, only after PBSA-TASK-005
  - Allowed: `tools/harness/project-board/status-cli.mjs`
  - Forbidden: tests, helpers, schemas, live records, docs outside returned
    evidence, dependencies, server/browser/product code
  - Output: pre-write event construction/validation and one narrowly scoped
    event-append warning boundary
  - Result: only `status-cli.mjs` changed; production SHA-256
    `c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`
  - Maps: PBSA-REQ-002..004

- [x] **PBSA-TASK-007 — GREEN and regression evidence**
  - Owner: Controller integrates Worker evidence and runs/finalizes the approved
    validation matrix
  - Write: Change evidence only; no behavior correction is authorized here
  - Required: focused tests, base v1 tests, show, read-only server/browser,
    static scope, no live record mutation
  - Result: frozen combined suite 12/12 GREEN; HTTP and Playwright read-only
    regressions PASS; project-control tree hash unchanged across browser checks
  - Correction result: production hash unchanged and corrected suite 12/12
    GREEN; prior HTTP/browser evidence is unaffected by the test-only change
  - Maps: PBSA-TEST-001..010; PBSA-REQ-001..006

- [x] **PBSA-TASK-008 — Independent verification**
  - Owner: `juaner_validator`, fresh read-only context
  - Input: frozen implementation, tests, file identities, commands, outputs,
    scope diff
  - Verdict: PASS, FAIL, or BLOCKED with evidence
  - Prior result: first Sol-high PASS invalidated when the frozen test hash
    changed; a new fresh read-only verdict is required
  - Final result: fresh Sol-high Revalidator returned REVALIDATION PASS and
    independently ran both normal and forced-`complete` suites 12/12
  - Maps: PBSA-REQ-001..006

- [x] **PBSA-TASK-009 — Acceptance and archive**
  - Owner: Controller/user according to project policy
  - Prerequisites: Validator PASS or authorized waiver, traceability complete,
    activation evidence consistent, no forbidden diff
  - Output: acceptance, merge delta into current spec, archive Change, and
    update project board through the Controller-only CLI
  - Reopened: the first archive attempt was withdrawn after the final
    `health=complete` state exposed PBSA-TEST-009's fixture collision
  - Final result: corrected hash revalidated; real `health=complete` suite
    12/12; Controller accepted and reauthorized archive

## Stop Lines

Return to Spec/Design if satisfying an AC needs a new schema, helper contract,
writer, retry, background work, server/browser change, or conditional path.
Return to Test Design if implementation would require changing an assertion or
failure fixture. Apply the governance complexity stop line on a second
clarification/correction/Worker return for the same behavior.
