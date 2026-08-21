# Verification

Status: **REVALIDATION PASS / REAL COMPLETE-STATE GREEN / CONTROLLER ACCEPTED / ARCHIVED**.

PBSA-PACKAGE-001 all A was explicitly approved by the user in the Codex CLI on
2026-08-21. Causal RED, implementation, GREEN, and Controller regression are
complete through the first acceptance attempt. The post-archive regression
exposed a test-fixture collision; prior final GREEN, Validator, acceptance, and
archive claims are withdrawn until correction and fresh verification complete.

## Dispatch and Route Record

- Role requested: project `juaner_spec`.
- Classification: R2 persistence-authority/publication/failure boundary;
  difficulty standard.
- Required route from `docs/governance/agent-model-routing.md`: Sol high.
- The configured Spec route refused the dispatch. The Controller substituted a
  bounded Sol-high Spec run rather than lowering the R2 floor or bypassing the
  Spec role work product.
- Scope duration: this package draft only, ending at `SPEC_READY`.
- Upgrade trigger: not used. A conflict in approved authority, schema, or
  required behavior returns to Controller/user rather than escalating by
  guesswork.
- Rollback: delete or revise only the unapproved package draft; no executable or
  live state was changed by this role.

Test route record:

- The configured `juaner_test` route was dispatched after Spec Gate PASS.
- Classification: R2 persistence/publication/failure semantics; required route
  Terra high.
- The configured Terra-medium role returned `ROUTE_REFUSAL` before reading or
  writing the repository.
- Controller dispatched a bounded Terra-high Test substitute with the same
  role, path, and gate limits; it stopped after frozen causal RED evidence.
- No route floor, scope, assertion, or role isolation was waived.

Worker route record:

- The configured `juaner_worker` route was dispatched after TDD_READY.
- Classification: R2 persistence/publication/failure semantics; required route
  Terra high.
- The configured Terra-medium role returned `ROUTE_REFUSAL` before reading or
  writing the repository.
- Controller dispatched a bounded Terra-high Worker substitute with the same
  one-file production brief. It changed only `status-cli.mjs` and stopped after
  GREEN.
- No route floor, Worker path, test assertion, or contract was waived.

Validator route record:

- The configured `juaner_validator` route was dispatched after evidence
  freeze.
- Classification: R2 persistence/publication/failure semantics; required route
  fresh read-only Sol high.
- The configured Sol-medium role returned `ROUTE_REFUSAL` before reading or
  writing the repository.
- Controller dispatched a fresh Sol-high read-only Validator substitute. It
  made no repository or live-board write and returned PASS.
- No route floor, evidence requirement, independence, or acceptance authority
  was waived.

## Authoritative Inputs Reviewed

- Approved `structure-confirmation.md` (overall APPROVED), left unchanged.
- The 2026-08-21 PB-ATOMIC cancellation retrospective.
- Restored HEAD versions of `project-control.mjs`, `status-cli.mjs`, and
  project-board `README.md`.
- Base unfinished `project-board-observability` Proposal, Specification,
  Design, Tasks, Test Plan, Traceability, and Verification.
- `AGENTS.md`, `docs/governance/change-complexity-control.md`,
  `docs/governance/agent-model-routing.md`, `.ai-coding/policies/testing.md`,
  and `.ai-coding/definition-of-done.md`.

## Inspected Executable Inputs

- Inspected repository HEAD: `e406c1d88af5dd587daff15ebb850ba8628cbe2d`.
- Inspected the restored HEAD copies of `project-control.mjs`,
  `status-cli.mjs`, and project-board `README.md`.
- Read-only inspection found no live PB-ATOMIC authority directory. The
  cancelled package, schemas, and tests are absent from the active tree as
  stated by the Controller brief.

This identifies Spec inputs only; it is not an implementation freeze or
acceptance evidence.

## Spec Closure Read Model

| Gate item | Candidate decision | State |
|---|---|---|
| current-state authority | fixed v1 `status.json` only | PASS |
| base supersession | PB-REQ-004 narrowed only for best-effort event I/O after publication | PASS |
| admission | parse and validate complete status/brief/event candidates before write | PASS |
| status publication | same-directory temporary file; final rename is publication point | PASS |
| publication failure | nonzero; prior status applies; event not attempted | PASS |
| post-publication event failure | one attempt; zero exit; exact warning; no rollback | PASS |
| event-only failure | one attempt; zero exit; exact warning; no authoritative effect | PASS |
| warning contract | `{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n` | PASS |
| writer/concurrency | Controller/status-cli only; concurrent calls unsupported and untested | PASS |
| brief/server/browser | brief display-only; server/browser read-only and otherwise unchanged | PASS |
| compatibility | no field/schema/layout/dependency/migration change | PASS |
| activation/rollback | accepted code behavior; restore prior CLI behavior; v1 stays readable | PASS |
| testability | real filesystem failure through isolated public CLI fixture | PASS |
| path scope | one focused test file and one production CLI file after their gates | PASS |

## Current Evidence and Limits

Spec evidence remains document/source inspection and static contract drafting.
Test evidence now additionally includes a real public-CLI/filesystem causal
RED in isolated temporary repositories. No live project-control record was
written by Test. The OpenSpec CLI is not available in the environment, so no
`openspec validate` result is claimed.

Static package checks passed:

- all ten current package files exist and are non-empty;
- PBSA-REQ-001..006 occur in both the delta specification and traceability;
- PBSA-AC-001..016 occur in the specification, test plan, and traceability;
- PBSA-TEST-001..010 occur in the test plan and traceability;
- PBSA-TASK-001..009 occur in Tasks;
- the exact warning code occurs consistently in Specification, Design, Test
  Plan, and this verification read model;
- all seven prohibited legacy-design vocabulary items are absent from the new
  package documents; the approved structure ledger was excluded from this
  check and left unchanged;
- every Markdown code fence is paired;
- the package contains the approved structure ledger, eight lifecycle/spec
  documents, and the Test-owned evidence document; no executable or persistent
  shape is stored in the package.

The restored implementation shows the intended causal RED targets by
inspection only:

- status event construction/validation currently occurs after status rename;
- status-, brief-, and event-only append errors currently reach the outer
  nonzero error handler;
- current `atomicWriteJson` already validates then uses same-directory
  temporary write and rename;
- current `readProjectControl` reads current state from `status.json`.

These observations guide Test Design but are not RED, GREEN, or validation
evidence.

## Pending Evidence Matrix

| Evidence | Owner/gate | State |
|---|---|---|
| item-by-item Spec Gate | Controller | PASS |
| healthy executable test harness and exact test freeze | Test Agent after Spec Gate | PASS |
| causal RED for pre-validation and warning/exit behavior | Test Agent | PASS |
| minimum production change | Worker after TDD_READY | PASS |
| focused GREEN and base v1 regression | Controller/Worker evidence | PASS |
| public show and current-state authority | Controller validation | PASS |
| read-only server/browser regression | Controller validation | PASS |
| allowed/forbidden path diff | Controller | PASS |
| independent read-only verdict | Validator | REVALIDATION PASS |
| acceptance, activation, merge, archive | Controller/user | ACCEPTED / ARCHIVE AUTHORIZED |

## Residual Risks for Spec Gate

- The exact warning intentionally suppresses the underlying append error. This
  is appropriate for a stable minimal CLI contract but provides no diagnostic
  detail; adding diagnostics later requires a separate approved contract.
- Filesystem calls have no timeout. This Change neither adds nor promises an
  execution-time bound.
- Concurrent Controllers remain unsupported. If that becomes a real product
  need, it requires a new structure decision rather than extension of this
  Change.
- Browser regression depends on an available existing browser environment; its
  absence must be reported as missing evidence, not a pass.

## Controller Spec Gate

Controller completed an item-by-item review on 2026-08-21. The package matches
the approved structure ledger: fixed v1 `status.json` authority, existing
single-file atomic rename, one post-publication best-effort event attempt,
single supported Controller writer, unchanged read-only browser, no migration,
and no transaction-era structure. Requirements, 16 AC, 10 planned tests, nine
tasks, path ownership, activation, rollback, and base PB-REQ-004 narrowing are
internally traceable. The restored v1 production files are byte-identical to
HEAD, `node --test tools/harness/project-board/project-control.test.mjs` passes
3/3, `status-cli show` succeeds, and `git diff --check` passes. These are
baseline/rollback checks, not RED or GREEN evidence for this Change.

The user then explicitly approved `PBSA-PACKAGE-001` all A on 2026-08-21. The
Controller therefore issues **SPEC GATE PASS** for PBSA-REQ-001..006 and
PBSA-AC-001..016. Test Design and causal RED are authorized only within
`tools/harness/project-board/status-cli.test.mjs`. Production remains locked
until Controller TDD_READY.

## Controller TDD_READY

The Test Agent froze nine focused public-CLI cases at SHA-256
`dc3ba93f54c1cd80ac4355701b4f5e1cb2c25e7161634d0db0f888aa410b8065`.
The unchanged base suite passed 3/3. The Controller independently ran the
frozen combined command and reproduced **12 total: 8 pass, 4 fail, 0 skipped,
0 cancelled**. Permission probes proved that each temporary `0555` destination
rejected writes with `EACCES` or `EPERM`.

The four failures are causal and complete for the production brief:

- PBSA-TEST-004 proves an invalid event candidate is validated only after the
  current CLI has already changed status;
- PBSA-TEST-006 proves a successful status publication followed by real event
  failure incorrectly exits 1;
- PBSA-TEST-007 proves the same incorrect exit for a successful brief write;
- PBSA-TEST-008 proves event-only append failure incorrectly exits 1.

All other focused behavior and the unchanged base tests are GREEN. Tests use a
copied public CLI in isolated repository-shaped temporary directories, do not
mutate live project-control records, and contain no mocks, production hooks,
source scans, FIFO, or concurrency behavior. The Controller therefore issues
**TDD_READY**. Worker is authorized to change only
`tools/harness/project-board/status-cli.mjs`; the frozen test file and all other
production paths remain locked.

## Worker Result and Controller GREEN

The bounded Worker changed only
`tools/harness/project-board/status-cli.mjs`. It prevalidates the complete
status or brief and event candidates before publication, then routes only the
single post-publication `appendEvent` call through the exact stable warning
boundary. The same boundary covers event-only append I/O. Publication,
argument, read, and validation errors still reach the outer nonzero handler.
No helper, schema, retry, timeout, concurrency, background work, or persistent
shape was added.

Frozen identities:

- production `status-cli.mjs` SHA-256:
  `c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`;
- test `status-cli.test.mjs` SHA-256 at initial Worker GREEN:
  `dc3ba93f54c1cd80ac4355701b4f5e1cb2c25e7161634d0db0f888aa410b8065`.

Controller executed:

```bash
node --check tools/harness/project-board/status-cli.mjs
node --check tools/harness/project-board/status-cli.test.mjs
node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs
node tools/harness/project-board/status-cli.mjs show
git diff --check
```

The combined Node suite passed **12/12**, with 0 fail, skip, cancel, or todo.
That includes the unchanged base suite's 3/3 and all nine frozen CLI cases.
`show` returned current phase `project_board_status_authority_implementation`,
health `active`, 50 displayed events, and six briefs.

HTTP regression against the existing loopback server passed: health,
aggregate control, referenced document, and HEAD returned 200; POST returned
405; invalid Host 400; invalid Origin 403; traversal and invalid reference 400;
unknown route 404. A real Playwright Chromium session loaded the repository
state, opened a decision brief and its constrained document, reported zero
console warnings/errors, and observed only GET requests. The rendered surface
states that decisions remain in Codex CLI; it exposes no approval, command,
or agent-start action. The complete `.juanerai/project-control/` tree digest
was identical before and after HTTP/browser validation:
`442ad64fc3770592416b800041702da5d87bdcccada3adeb89f5314f3a3e136c`.

Static scope confirms `project-control.mjs`, its base test, server, browser,
README, package manifest, and lockfile are byte-identical to HEAD. The only
Worker production diff is `status-cli.mjs`; the only Test addition is the
frozen focused test. Controller-owned live board transitions and the earlier
user-approved cancellation governance/retrospective are separately attributed
workspace changes, not Worker or Test scope.

## Final-State Test Correction

The first post-archive run legitimately copied `health=complete`, colliding
with PBSA-TEST-009's fixed historical `status_after=complete`. Only the
inequality assertion failed; `show` and production behavior were correct.
Controller withdrew PBSA archive/acceptance and returned to Test Design.

The R2 Test Correction role retained every authority assertion and changed
only the fixture value selection: current `complete` selects historical
`active`; every other current health selects historical `complete`. It
reproduced the collision in an isolated complete-state repository and made no
production or live-board write. Controller independently inspected the one-line
fixture change and reran the combined suite: **12/12 GREEN**, base 3/3 and PBSA
9/9. Current frozen identities are:

- production unchanged:
  `c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`;
- corrected test:
  `2c655075b0bb224850eacd2b21695a35d9d62bb4fa35e4553087822a33e07243`.

No Worker is required or authorized. The first Validator verdict is stale
because the test identity changed; fresh read-only verification is required.

## First Fresh Independent Verification (Superseded by Test Correction)

The fresh Sol-high read-only Validator returned **PASS** for
PBSA-REQ-001..006 and PBSA-AC-001..016. It independently reproduced node
syntax checks, the frozen 12/12 GREEN suite, `show`, the two frozen hashes,
HTTP positive and negative paths, a clean Playwright read-only session, and
`git diff --check`. Its Playwright run observed zero console errors/warnings
and only two GET requests. Its own pre/post project-control tree digest was
stable at
`b24bdb36410a32af0188b644f78d7a6711c9c735062c8c36915319d2bb00e8e0`.

The Validator confirmed the Worker/Test path attribution and the absence of
transaction, revision, baseline, projection, new schema, new dependency, or
new persistent layout. It recorded only the already-approved residual limits:
stable warnings omit low-level diagnostics, filesystem operations have no
timeout, and concurrent Controllers are unsupported. It also noted that the
superseded non-authoritative `PB-ATOMIC-002` brief links to documents removed
with the cancelled Change; the server returns a controlled 404 for those
historical links. That display-only historical-context issue does not affect
PBSA current-state authority, mutation behavior, or release evidence and is
not expanded into this Change.

## First Acceptance (Withdrawn)

Controller accepts PBSA on 2026-08-21 under the user's approved
`PBSA-PACKAGE-001` all-A contract. PBSA-REQ-001..006 and PBSA-AC-001..016 are
closed; production and test hashes remain frozen; the exact warning and
single-Controller limitation are intentional accepted behavior. Activation is
the accepted `status-cli.mjs` behavior already present in the working tree.
The consolidated current project-board specification is published before the
Change directory is archived. No Git commit or push is implied.

## Withdrawn Archive Attempt

The initially accepted delta was merged into
`openspec/specs/project-board/spec.md`, and this Change moved to
`openspec/changes/archive/2026-08-21-project-board-status-authority/` on
2026-08-21. Immediately afterward, the required final regression failed
PBSA-TEST-009 because both the legitimate current health and its hard-coded
historical fixture were `complete`. Controller moved this Change back to the
active directory, invalidated its final evidence, and kept production locked.
The base `project-board-observability` archive remains valid. No Git commit or
push was performed.

## Fresh Revalidation After Test Correction

The configured Sol-medium Validator again returned `ROUTE_REFUSAL` with zero
reads/writes. A new fresh Sol-high read-only Revalidator then returned
**REVALIDATION PASS**. It independently verified the current production and
test hashes, node syntax, normal 12/12 suite, `show`, scope, and diff. In an
isolated repository whose valid current health was forced to `complete`, it
confirmed historical `active`, preserved inequality, and ran the complete
combined suite **12/12**. Its pre/post live project-control digest was stable:
`ab097de7504cdef844fbdb08b698e3e447c1e606a6c000ac880c8fd8cba25e2d`.

The Revalidator counted the focused file's nine cases and 54 assertions,
confirmed that none were removed or weakened, and found no production, helper,
schema, server, browser, dependency, or persistence-shape change. It therefore
reconfirmed PBSA-REQ-001..006 and PBSA-AC-001..016.

## Final Complete-State Check and Acceptance

After REVALIDATION PASS, Controller changed the real board to the legitimate
`health=complete` state while archive remained active and reran the exact
combined suite. It passed **12/12**, with 0 fail, skip, cancel, or todo;
`show` returned `project_board_status_authority_final_check`, `complete`, 50
displayed events, and six briefs. Frozen hashes remained:

- production:
  `c0832ccd8595267c01b787e44e2ee9590b272824c090590e00744f166fa26ea6`;
- corrected test:
  `2c655075b0bb224850eacd2b21695a35d9d62bb4fa35e4553087822a33e07243`.

Controller accepts the corrected PBSA Change on 2026-08-21 and reauthorizes
archive. The already-published current specification remains accurate because
the correction changed no observable product behavior. No Git commit or push
is implied.

## Final Archive

After the corrected hash received fresh REVALIDATION PASS and the real
`health=complete` suite passed 12/12, Controller moved this Change to
`openspec/changes/archive/2026-08-21-project-board-status-authority/`. The
accepted current contract remains
`openspec/specs/project-board/spec.md`. This final archive supersedes the
withdrawn first attempt documented above. No Git commit or push was performed.
