# Xanthil Desktop Membership-Repurchase Decision Case Specification

## Accepted capability and provenance

- Capability: `xanthil-desktop-decision-case`.
- Source Change: [xanthil-desktop-membership-repurchase-decision-case](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/proposal.md).
- Accountable user: non-technical membership-operations analyst.
- Engineering Acceptance and user Product Acceptance: 2026-09-27, recorded in the
  [preserved verification history](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/verification.md).
- Scope: Personal/macOS arm64 local first slice, development package 0.1.0.
  Acceptance does not grant real Provider/data access or public distribution.

This baseline carries the accepted twelve Requirements and Acceptance Criteria
without changing product meaning. Original author status, historical refusals,
failures, UNKNOWN and narrow user risk dispositions remain in the archive.
Preparing this baseline does not claim remote integration.

References bind the preserved structure decision and current accepted amendments
at the top of the archived design and path contract. Intermediate-build/Spec Gate/
TDD_READY text records historical rollout obligations; it does not re-enable
retired tuples or reinstate superseded execution approvals. The final configuration
is the exact P5/CF 68-root mapping in the [local-analysis baseline](../local-analysis/spec.md).
Future execution follows the sole product-change execution policy.

Normative SHALL and SHALL NOT statements retain the accepted behavior and boundaries.

## REQ-XDESK-001 — Present the accepted real Desktop shell

The Personal Desktop Profile SHALL expose one real macOS entry that presents
the accepted PX-2026-004/006 dual-mode shell and the complete professional
six-stage workbench for the membership-repurchase path.

- **AC-XDESK-001-01:** A normal launch of the packaged arm64 application shows
  Xanthil identity, Quick/Professional switch, Project context, Session rail,
  main workspace, right Inspector/drawer, and bottom status; it is not a
  browser-hosted substitute or placeholder.
- **AC-XDESK-001-02:** Professional mode exposes New analysis, Data preparation,
  Local processing/model-exposure Gate, Evidence-based analysis, Report, and
  Execution feedback/Decision Closure in the accepted hierarchy.
- **AC-XDESK-001-03:** Quick, Fork, Subagent, and general Skill/Prompt actions
  are visibly Preview; invoking them creates no task, child result, persistence,
  provider call, report version, or success claim.
- **AC-XDESK-001-04:** Mode switching does not convert a Session or cancel work;
  search distinguishes modes; closing the drawer leaves the main path usable
  and keeps active status plus return affordance visible.
- **AC-XDESK-001-05:** At 1440x900 and 1366x768 the professional path, mode
  switch, search, drawer, disclosure, confirmation, chooser, and dialogs are
  keyboard-operable with visible focus, modal focus containment, and focus
  restoration.

## REQ-XDESK-002 — Publish an all-or-unavailable Product Session

Application SHALL make a professional Product Session usable only after its
committed SQLite records and the exact 010_draw, 020_clean, and 060_reports
directories all exist.

- **AC-XDESK-002-01:** A successful create returns one stable Session ID, mode
  professional, one Case ID, one sequence-1 Draft revision, and three complete
  directories under the selected Project.
- **AC-XDESK-002-02:** Session creation opens no Runtime session, performs no
  model/network call, and succeeds without a configured model.
- **AC-XDESK-002-03:** Failure before the database commit returns one sanitized
  creation failure; list/open exposes no partial Session and no import, Run,
  Attempt, report, or provider effect is admitted for it.
- **AC-XDESK-002-04:** Retry uses command-receipt semantics: same command and
  fingerprint returns the same committed Session, a conflicting fingerprint is
  rejected, and a new explicit create uses a new identity.
- **AC-XDESK-002-05:** A lost/exceptional COMMIT response reads the same receipt;
  committed returns the same success, definitely absent returns failure, and
  unreadable state displays 结果待核对 and blocks resend.
- **AC-XDESK-002-06:** Closing and reopening the application reconstructs the
  committed Session, current revision, history, evidence and report references
  without scanning orphan directories or reviving a Pi session. During the
  incremental batch, a later build opens every earlier supported Project with
  the same IDs/bytes and without migration, default filling, or a new receipt;
  an earlier build encountering later valid records refuses the whole Project
  as `FORBIDDEN` before business write/reconciliation and preserves it intact.

## REQ-XDESK-003 — Keep Case revision as the sole revision axis

Each first-slice Session SHALL own exactly one Case, and Case revision SHALL be
the only business revision axis.

- **AC-XDESK-003-01:** A Session starts with one sequence-1 Draft revision.
  There is no Session revision or multi-Case control.
- **AC-XDESK-003-02:** Changing source snapshot, mapping, periods, valid-status
  filters, issue treatment, group mapping, H1 plan input, or other
  computation-affecting input creates the next Draft revision and leaves the
  prior revision unchanged.
- **AC-XDESK-003-03:** Revision states are exactly Draft, Ready, Review,
  NeedsAttention, and Completed; each transition satisfies the guards in this
  specification and updates the row version rather than creating another
  business revision axis.
- **AC-XDESK-003-04:** Current Finding, acceptance, Closure, and report pointers
  are null or one same-revision record; advancing a pointer never deletes or
  rewrites history.
- **AC-XDESK-003-05:** A Completed revision stays Completed during a rerun,
  failure, cancellation, or new pending Finding. Input editing remains
  unavailable until a new Draft revision is created.

## REQ-XDESK-004 — Confirm and publish the authorized double-CSV snapshot

Desktop SHALL admit exactly one UTF-8 members.csv and one UTF-8 orders.csv for
CNY and Asia/Shanghai, and SHALL publish their immutable local snapshot only
after all blocking guards and explicit confirmations pass.

- **AC-XDESK-004-01:** CSV parsing accepts comma separation, one unique non-empty
  header row, RFC 4180 double-quote escaping, LF or CRLF, and an optional UTF-8
  BOM; invalid UTF-8, malformed quoting, unequal columns, or duplicate/empty
  headers rejects the whole file.
- **AC-XDESK-004-02:** Required mappings are member ID, optional member group,
  order ID, order member ID, paid time, amount, order status, and currency.
  IDs/statuses are exact case-sensitive strings: no trim, case-fold, or numeric
  conversion; leading zeroes remain significant.
- **AC-XDESK-004-03:** Empty/duplicate required IDs, unknown member references,
  non-CNY/mixed currency, unconfirmed mapping, and invalid/ambiguous time are
  blocking. Amount is a positive decimal with at most two fractional digits,
  converted without rounding to 1 through 9223372036854775807 fen; values
  outside that physical range are blocking.
- **AC-XDESK-004-04:** paid_at is ISO 8601. Offset values convert to
  Asia/Shanghai; offset-free values must resolve to exactly one instant there.
  Comparison/current periods are non-overlapping local-midnight [start,end)
  ranges of equal positive calendar-day length. Valid statuses are a non-empty
  explicit selection. No valid row after those filters is blocking.
- **AC-XDESK-004-05:** Reviewable rows are outside both periods, excluded by
  status, missing optional group, preserve leading/trailing whitespace in exact
  IDs/statuses, contain unmapped extra columns, or use equal paid_at resolved by
  the order-ID tie-break. The UI shows each count and exact treatment; one
  revision-scoped acceptance is invalidated by a later mapping/filter/period/
  treatment change.
- **AC-XDESK-004-06:** Snapshot publication requires the exact authority
  confirmation 我有权将这两份本地数据用于本次分析 and records its time, display
  names, hashes, mapping, included/excluded counts, confirmed definitions,
  Contract, Binding, and IR. It does not claim legal ownership or broader use.
- **AC-XDESK-004-07:** The confirmed source bytes are copied byte-for-byte to
  the two structure-decision paths. Import performs zero Runtime/provider
  egress and persists no external absolute path; traversal, symlink escape,
  mutation between confirmation and copy, or post-publication hash mismatch
  fails closed.

## REQ-XDESK-005 — Produce verified deterministic repurchase evidence

Each Analysis Run SHALL be one product-owned deterministic attempt bound to one
exact revision, confirmation, snapshot, Profile, method/code identity, and
deadline. DuckDB SQL is primary and Python independently recomputes the result
before any Finding.

- **AC-XDESK-005-01:** For each period, Active Member means at least one valid
  order; Repeat Member means at least two; Repurchase Rate is Repeat/Active;
  Repeat Revenue is the sum of every member's second and later valid orders
  sorted by paid_at then unsigned lexicographic UTF-8 order-ID bytes.
- **AC-XDESK-005-02:** Money/count arithmetic uses checked signed-64-bit
  `bigint`; every parse, multiplication, sum, delta, group sum, and
  reconciliation rejects overflow as CALCULATION_FAILED before publication.
  SQLite binds/reads exact integers; canonical JSON/IPC serializes integers as
  bounded decimal strings and ratios as reduced signed-numerator/positive-
  denominator decimal-string pairs with zero `0/1`. Display rounding never
  enters equality validation.
- **AC-XDESK-005-03:** M1 reports current minus comparison for counts, rates,
  and revenue. Relative change is (current-comparison)/comparison and is
  not_applicable when the comparison value is zero.
- **AC-XDESK-005-04:** When a group column is selected, M2 reports each
  revision-local pseudonymous group's current Repeat Revenue minus comparison
  Repeat Revenue and the group deltas sum exactly to total change. Without a
  group selection, M2 is exactly not_applicable. M2 is never causal.
- **AC-XDESK-005-05:** With agreeing implementations, judgment is Confirmed when
  both periods have at least one Active Member and current rate is lower;
  Rejected when both are nonzero and current is equal/higher; Inconclusive when
  either is zero. No significance/sample threshold or causal claim is added.
- **AC-XDESK-005-06:** Mismatch, calculation failure, cancellation, deadline,
  interruption, or integrity failure produces no aggregate reference, Finding,
  or successful report and is not relabeled Inconclusive.
- **AC-XDESK-005-07:** Success publishes one canonical aggregate under
  020_clean, the exact terminal Desktop Run 3.0 bundle under `.xanthil/runs`,
  and one same-revision Finding through the two-point protocol in
  [structure-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/structure-decision.md): terminal `run.json` is physical evidence
  linearization, then one SQLite commit is Application visibility. A durable
  terminal bundle without that commit stays immutable and unreferenced; it is
  never adopted, rewritten as failed, or exposed. UI values and identities
  come from committed verified authorities, never a fixture timer.

## REQ-XDESK-006 — Gate each optional Assistance Attempt by exact disclosure

Each assisted action SHALL require a new action-specific disclosure and exact
payload confirmation, and settlement SHALL create at most one untrusted Draft.

- **AC-XDESK-006-01:** organize_question is eligible on a usable Session before
  aggregate creation. Its payload contains only action/schema labels, exact
  user-authored question/title/context/alternative text, selected comparison
  and current period labels, and the fixed aggregate column names; free text is
  shown byte-for-byte and requires a second sensitive-content confirmation.
  Question, hypothesis display title, business context, and ordered alternative
  explanations are the same durable Case fields for manual save, Draft edit/
  adoption, projection, and reopen; an empty optional context/list is preserved
  rather than inferred.
- **AC-XDESK-006-02:** explain_evidence requires Review and contains only the
  approved versioned aggregate subset, revision-local pseudonymous segment
  aggregates, method label, and confirmed user context.
- **AC-XDESK-006-03:** draft_candidates requires Finding acceptance and contains
  only the accepted Finding, its limitations, referenced aggregate evidence,
  and confirmed user context.
- **AC-XDESK-006-04:** Every disclosure shows requested provider/model, included
  categories, exact canonical payload, SHA-256, irretractability statement, and
  cost information when available. Input/revision/provider/model change makes
  it stale and requires a new disclosure.
- **AC-XDESK-006-05:** No payload automatically contains 010_draw, raw rows or
  file bytes, absolute paths, member/order IDs, original group values,
  credentials, unselected logs, report files, future artifacts, Pi sessions,
  or transcripts. Those identifiers remain authorized only inside selected
  local source bytes in Main/Application process-local inspection state, their
  immutable local snapshots, calculation input
  memory/stdin, the local group-pseudonym map, and credential-free synthetic
  fixture inputs; they are prohibited from outbound capture, product history,
  Renderer IPC, logs, reports, Run/aggregate output, screenshots, and evidence.
  Refusal creates no Attempt and zero network activity.
- **AC-XDESK-006-06:** One accepted disclosure admits at most one Attempt bound
  to its Session/revision/action/Profile/Runtime/Adapter/requested model.
  Observed provider/model is recorded only after an actual response; Pi details
  never cross the Adapter.
- **AC-XDESK-006-07:** Success produces only the normalized labeled Draft type
  permitted for that action. User edit/adopt/reject is a separate command;
  exact Draft targets/content are Case question/title/context/alternatives,
  one evidence-explanation text, or the closed candidate array. Adoption and
  rejection persist their generated/edited content and disposition and survive
  reopen; candidate adoption creates or updates only an undisposed Draft form.
  Adoption may update only the allowed form fields and cannot change data,
  method, calculation, Finding/judgment, acceptance, preferred candidate,
  Closure, Case state, or Run state.
- **AC-XDESK-006-08:** Provider failure, validation failure, cancellation,
  deadline, or interruption after admission writes one sanitized terminal
  Attempt with no Draft, leaves all local authority intact, and permits only
  manual continuation or a new disclosure/new Attempt. Stale payload and
  missing/not-ready Runtime reject before admission and network, create no
  fabricated Attempt identity, preserve the disclosure, and leave the same
  manual continuation.

## REQ-XDESK-007 — Separate Finding acceptance, closure, report, and export

Application SHALL represent verified Finding, acceptance, saved decision form,
Decision Closure, Case completion, report version, and export as distinct
observable facts.

- **AC-XDESK-007-01:** An agreeing successful Run creates a Review Finding and
  draft report containing results/denominators, supporting evidence,
  refutation/alternative explanations, limitations, judgment, and evidence
  back-links; it does not infer acceptance.
- **AC-XDESK-007-02:** 接受本次分析结果 appends one acceptance for the exact
  Finding. Decline, defer, or request-more-evidence appends/preserves its
  non-closure form disposition and does not complete the Case.
- **AC-XDESK-007-03:** Candidate comparison requires at least two candidates;
  each has stable UUIDv4 identity, title, evidence basis, risk/refutation,
  applicability conditions, and future validation metric. Manual add/edit/
  duplicate/remove and assisted adoption persist the same closed shape; a
  duplicate gets a new identity. Zero or one may be preferred, and preference
  requires a reason.
- **AC-XDESK-007-04:** Insufficient-evidence requires a non-empty reason and no
  preferred candidate. Saving either valid route keeps the revision in Review.
- **AC-XDESK-007-05:** 完成分析案例 is enabled only for one exact accepted
  Finding and valid saved route; it atomically appends a Closure, advances the
  current references, publishes a final report, and leaves the revision
  Completed. Final never claims Action or Outcome.
- **AC-XDESK-007-06:** Every changed report is a new immutable version. A failed
  rerun never alters an earlier accepted Finding, Closure, final report, or
  Completed projection.
- **AC-XDESK-007-07:** UTF-8 Markdown and self-contained HTML include the
  approved provenance set. Review exports are marked UNACCEPTED;
  integrity-blocked exports are marked INTEGRITY_BLOCKED and omit damaged
  bytes. Export is a projection and creates no new business conclusion.

## REQ-XDESK-008 — Enforce one terminal winner and fail-closed recovery

Application SHALL preserve the last durable authority across concurrency,
cancellation, deadlines, process interruption, and integrity failure.

- **AC-XDESK-008-01:** At most one Run and at most one Assistance Attempt are
  Running for a revision, and they are mutually exclusive. The first durable
  BEGIN IMMEDIATE admission wins; conflict is immediate, effect-free, and not
  queued.
- **AC-XDESK-008-02:** Run and Attempt deadlines are 300 seconds. DuckDB/Python
  calls are each 30 seconds and capped by remaining outer time. Product retry
  count is zero.
- **AC-XDESK-008-03:** Cancellation/deadline/success/failure compete for one
  terminal transition. Before success publication Application rechecks
  deadline and accepted cancellation; late results create no aggregate,
  Finding, report, or Draft.
- **AC-XDESK-008-04:** At deadline no new tool call starts and issued local
  subprocesses are terminated/bounded. Cancellation does not claim to retract
  a provider payload already sent.
- **AC-XDESK-008-05:** On reopen, each committed Running Run/Attempt becomes
  Failed/interrupted exactly once with the proper projection. A terminal Run
  directory not referenced by a committed Succeeded row remains an inert
  physical candidate; no subprocess, Pi session, Run, provider request, or Run
  directory is resumed, resent, scanned, adopted, or rewritten.
- **AC-XDESK-008-06:** First-result Run failure enters NeedsAttention; existing
  success/acceptance/Completed state never downgrades. Assistance settlement
  never changes Case or Run state. Retry always has a new identity.
- **AC-XDESK-008-07:** All thirteen accepted UI failure classes plus partial
  Session creation, forbidden egress, store busy, schema rejection, and
  Assistance terminal failures state what happened/did not, what remains safe,
  and one permitted next action; no false Session, Finding, Draft, report,
  Closure, or completion appears.

## REQ-XDESK-009 — Isolate Renderer and expose only closed IPC

Electron SHALL keep presentation inside a sandboxed Renderer and all local
authority behind versioned Main/Application commands.

- **AC-XDESK-009-01:** Packaged Renderer uses local resources,
  nodeIntegration=false, contextIsolation=true, sandbox=true, and CSP without
  unsafe-eval; require, process, Node modules, raw Electron APIs, and arbitrary
  network are unavailable.
- **AC-XDESK-009-02:** Navigation, new windows, permission requests, external
  URL opening, devtools/HMR, remote code, and unapproved protocols are denied in
  the packaged path.
- **AC-XDESK-009-03:** Preload exposes only the named version-1 business methods
  and their exact request/result/projection keys enumerated in [design.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/design.md) and
  standard structured-clone request/projection
  values; no raw ipcRenderer, channel selector, Electron event, path/file
  handle, shell/process object, SQL, or generic read/write/execute method exists.
  All twenty named methods and the complete projection shape exist from C1a;
  an intermediate internal subset never becomes a partial public protocol.
- **AC-XDESK-009-04:** Main validates sender and top frame, contract version,
  exact keys/types, command ID, owner tuple, state guard, and authorization
  before each effect. Unknown/extra/missing/stale/cross-owner input is rejected
  without partial local or provider effects. In an intermediate build, sender,
  top frame, version and envelope are checked first; a valid-envelope inactive
  route then returns the existing sanitized `FORBIDDEN` development-incomplete
  result without parsing its future payload or reaching chooser/source/Adapter/
  provider/receipt/record. Active routes retain full validation. U1 forwards
  only `saveForm(kind:"case_fields")`; later tags follow that same refusal.
- **AC-XDESK-009-05:** Application independently revalidates product identity,
  ownership, row version, state guard, and command fingerprint; transport
  validation never becomes business authority.
- **AC-XDESK-009-06:** Renderer reload or duplicate delivery cannot duplicate a
  Session, revision confirmation, Run/Attempt, Draft disposition, acceptance,
  Closure, or report version.

## REQ-XDESK-010 — Reuse current local-analysis seams without contract drift

Desktop SHALL add only the narrow business capabilities required for this Case
and SHALL keep current CLI, Run Artifact, provider/model, and public Port
contracts compatible.

- **AC-XDESK-010-01:** Existing AgentAnalysisRuntime,
  LocalAnalysisExecution, RunArtifactStore, createLocalAnalysisApplication,
  createPersonalLocalAnalysisProfile, and apps/cli/xanthil.ts behavior and
  signatures remain unchanged and all 22 TEST-XCLI cases pass.
- **AC-XDESK-010-02:** Desktop SHALL publish only the closed 3.0 manifest and
  files in [structure-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/structure-decision.md) through `DesktopRunEvidenceStore` in the
  approved Desktop Core/Port/storage paths. Existing local-analysis writes 2.0
  and reads terminal 1.0/2.0; existing Console selected-directory reads 1.0
  only and returns RUN_CONTRACT_UNSUPPORTED for 3.0. Their schemas, factories,
  APIs, behavior, and artifacts remain unchanged; no registry, scan, migration,
  fake model/fixture provenance, or omitted evidence boundary is allowed.
- **AC-XDESK-010-03:** The existing analytics Adapter is changed only to extract
  one private bounded subprocess/deadline/cancellation helper. The old factory
  and fixture-specific calculation remain behaviorally identical; the new
  Desktop adapter owns the double-CSV algorithm.
- **AC-XDESK-010-04:** packages/ports/local-analysis.ts adds a separate
  DecisionAssistanceRuntime and definition function without changing the
  existing AgentAnalysisRuntime shape. The Pi Adapter adds one corresponding
  factory; Pi types remain confined to adapters/agent-pi.
- **AC-XDESK-010-05:** The Personal Desktop Profile selects Desktop storage,
  deterministic analysis, Desktop Run evidence, and optional Pi assistance.
  Its lower-level public composition factory accepts the business Ports for
  contract/test injection; the normal factory supplies Pi itself. No production
  Main/preload/IPC/environment/Renderer switch selects an offline double, and
  no second package/entry is built for injection.
  Product contracts carry requested and observed neutral provenance, not a
  hardcoded provider/model.
- **AC-XDESK-010-06:** No configured model, refusal, unavailability, failure,
  cancellation, or timeout leaves every question, evidence explanation,
  candidate, insufficient-evidence, acceptance, completion, and report step
  available through the same durable manual save/adopt/reject/reopen forms. No
  second Runtime/registry/fallback/hot switch exists.

## REQ-XDESK-011 — Persist only the closed SQLite/file structure

Storage SHALL implement exactly [structure-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/structure-decision.md) and no broader
persistence mechanism.

- **AC-XDESK-011-01:** state.sqlite uses node:sqlite DatabaseSync only inside
  storage-local, foreign_keys ON, DELETE journal, FULL synchronous,
  busy_timeout 0, extension loading disabled, parameterized statements,
  explicit transactions/close, and no user SQL.
- **AC-XDESK-011-02:** The database has exactly the sixteen named business
  tables, explicitly non-null primary identities, columns, enums, null/default
  rules, exact ordered owner FKs and matching parent UNIQUE keys, the two only
  deferred create-session FKs, unique keys, partial active indexes, exhaustive
  receipt operation/result kinds, and bounded supporting indexes in
  [structure-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/structure-decision.md). Cross-row lifecycle predicates remain named
  same-transaction Application checks; no trigger is introduced.
- **AC-XDESK-011-03:** Project 1:N Sessions, Session 1:1 Case, Case 1:N
  revisions and all same-owner child references are enforced. No FK cascades,
  delete/retention behavior, or cross-Project reference exists.
- **AC-XDESK-011-04:** File publication is stage, flush/fsync, hash/size
  validation, exclusive same-filesystem rename, then one SQLite transaction for
  records/current references/receipt. For ordinary artifacts DB commit is the
  visibility point. For Run success, immutable terminal 3.0 publication is the
  physical evidence point and the later SQLite commit is the sole
  Application-visibility point; the exact failure/unknown-outcome rules in
  [structure-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/structure-decision.md) apply without a cross-store coordinator.
- **AC-XDESK-011-05:** Existing artifact/final targets are never overwritten.
  The only active-file replacement is the checked, atomic, exactly-once
  in-progress-to-terminal `run.json` transition; terminal bytes are immutable.
  Pre-rename failure exposes no record; post-rename/pre-commit orphan bytes
  remain invisible and are never scanned, adopted, consumed, repaired, or
  automatically deleted.
- **AC-XDESK-011-06:** Greenfield schema is exactly 1.0. Unknown, malformed,
  newer, foreign-WAL, or integrity-failed databases permit sanitized diagnosis
  and reject business writes. Raw header/identity/version/journal-mode and
  sidecar checks occur before SQLite; ordinary recognized files then receive
  read-only schema/integrity preflight and bounded identity/race recheck before
  writable use. Rejection leaves bytes/directory entries identical. The sole
  exception is an exact XDK1 rollback-journal candidate in the trusted personal
  profile: SQLite may perform native hot-journal recovery, after which the same
  read-only preflight must pass; no custom recovery, migration, downgrade,
  default filling, or other rewrite occurs. After that preflight, each
  intermediate build reads all sixteen tables and refuses any later row/state/
  form/receipt/reference before business-write open or reconciliation. Native
  hot-journal rollback is separately attributed and is the only physical-write
  exception before this semantic admission check.
- **AC-XDESK-011-07:** Normal reads begin from committed SQLite rows and verify
  owner, locator containment, existence, length, and hash before dependent
  use. Damage preserves readable history, marks integrity_blocked, and admits
  only a new revision/snapshot or marked export.
- **AC-XDESK-011-08:** SQLite is operational authority, source/aggregate/report
  files are immutable business artifacts, DuckDB/Python evidence is analytical
  authority, and `.xanthil/runs` retains independent versioned Run evidence.
  Desktop list/open starts from SQLite and accepts only a matching verified
  terminal 3.0 locator; no projection, orphan bundle, or old-version consumer
  silently substitutes for another authority.

## REQ-XDESK-012 — Build, prove, activate, and roll back the exact local app

The Change SHALL use only [dependency-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/dependency-decision.md) and [path-contract.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/path-contract.md) and SHALL
activate only after executable evidence through the actual packaged entry.

- **AC-XDESK-012-01:** P4 adopts the frozen 808-byte package.json and
  319836-byte package-lock.json with their specified hashes only after Spec
  Gate PASS; tool/install health is not RED. If the approved adoption exposes a
  stale root-configuration test oracle, the one-file correction follows the
  refreshed-Gate sequence in [path-contract.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/path-contract.md) and cannot count as product RED,
  TDD_READY, or P4 PASS.
- **AC-XDESK-012-02:** After each loop-scoped TDD_READY, the repository may move
  only through exact C1a, C1b, C1, C2, and C3 tuples in
  [dependency-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/dependency-decision.md). Each uses the frozen final P5 Main/config/scripts,
  `jsx:"react-jsx"`, and an exact ordered subset of the final appended 25
  TypeScript paths while retaining all 43 prior paths. Final CF is exactly the
  retained-43-plus-appended-25 graph and full validation phases. Dependency
  versions and lock never drift; every partial, mixed, extra, or unlisted tuple
  fails. Retirement removes intermediate oracle cases and replaces the focused
  runner list with the full list so released compatibility recognizes only
  exact P4 or final P5 and has no runtime phase selector.
- **AC-XDESK-012-03:** desktop:package produces only
  out/Xanthil-darwin-arm64/Xanthil.app with bundled local resources and the
  validated local toolchain descriptor; no Maker, archive, signing,
  notarization, updater, publisher, postinstall, or release artifact exists.
- **AC-XDESK-012-04:** Automated E2E launches the production packaged
  executable with playwright-core/node:test, Chromium sandbox enabled and CSP
  not bypassed, to prove production Main/Profile/Renderer/SQLite/filesystem/
  analysis, close/reopen, security, and offline/manual paths. Contract/
  integration tests may use real Application/store plus only an offline
  Runtime Port double to create closed synthetic Projects with pending Drafts
  or failed Attempts; after all writers close, that same frozen production
  executable opens them through real Main/Profile/preload/IPC/Renderer to prove
  visible edit/adopt/reject/manual fallback/reopen. No Runtime is injected into
  the package and no second package exists; this proves GUI handling of
  persisted state, not a production Provider call or provider quality.
- **AC-XDESK-012-05:** Separate normal acceptance opens the same frozen .app
  without debug arguments, uses native Project and two-file choosers, completes
  the full local path, saves, exits, and reopens. Dev server, browser page,
  source entry, mocked persistence, or substituted chooser is insufficient.
- **AC-XDESK-012-06:** Existing CLI and all affected baseline suites stay GREEN,
  including the four unchanged unit/contract/integration/E2E
  run-evidence-console suites. `tools/harness/validation/run` remains canonical,
  P5 appends those currently omitted Console phases before Desktop phases, and
  the runner removes the real-model gate. Actual provider/model invocation and
  provider quality remain NOT RUN without separate explicit authorization.
  TEST-XCLI-021 retains all old negative/business invariants while recognizing
  only the two exact configuration states in [dependency-decision.md](../../changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/dependency-decision.md);
  TEST-XCLI-022 remains unchanged.
- **AC-XDESK-012-07:** Activation is Personal/macOS arm64/professional path
  only. Rollback disables the Desktop entry/composition while preserving
  state.sqlite, Session files, reports, and Runs and performs no migration,
  downgrade, deletion, or automatic cleanup.

## Stable non-requirements

- No automatic Action or Outcome.
- No real provider-quality acceptance or real provider call.
- No product automatic retry or hidden repair.
- No Preview capability execution.
- No public distribution, enterprise claim, telemetry, user-data study,
  migration platform, generic persistence, or second Runtime.
