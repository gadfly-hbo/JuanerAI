# Change 003 — collaboration engineering design

Status: **ACCEPTED with C3 corrected** by [Engineering decision 001](engineering-decision-001.md).
Dependent engineering work is authorized within [intake](intake.md). Controller decision,
product acceptance, and independent candidate validation remain distinct.

## 1. Inputs, identity and scope

- Baseline verified locally: `5a8fe7b38ebdb1c2a8d49dcb5bdc5fa9d4bc3041`, tree
  `e5c40042ff5d75606afa208ba4b8ac8b9d4cac50`, branch `work/mac-mini/change-003-fork-subagent`.
- Approved [product plan](../../../../docs/planning/2026-09-30/xanthil-fork-subagent-product-plan-v1.0.md)
  FS-R01–08 / AC-FS-01–10 and [UI Contract](../../../../docs/planning/2026-09-30/xanthil-fork-subagent-ui-contract-v1.0.md)
  UI-FS-01–14 govern behavior. [Freeze](../../../../docs/planning/2026-09-30/xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md),
  [Review002](../../../../docs/planning/2026-09-30/reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md),
  and intake distinguish product approval, publication and engineering authority.
- Full product/UI originals, clickable HTML/JS/CSS/README/verification, Blueprint views,
  research adoption and applicable accepted specs were read. Prototype examples, budgets,
  localStorage and window simulation are not production contracts.
- [Execution policy v0.8](../../../../docs/governance/product-change-execution-policy.md),
  architecture, Session/Runtime boundary and test-retirement rules apply. Preserve
  Change001/002, other Preview capabilities, branding and approved attachments.
- One result-sized package: Fork first, then Subagent; both required. No second Runtime,
  generic scheduler, recursive dispatch, enterprise isolation, tool expansion, new Case,
  data authority or formal publication from children.
- Intake, engineering decisions and project-control are Controller-owned. Worker
  changes only the authorized engineering paths; frozen product inputs remain immutable.

## 2. Actual current contract and reuse

| Existing code | Reuse and necessary delta |
|---|---|
| [Application](../../../../packages/application/case-assistant.ts) `createCaseAssistantApplication` | Reuse source/preview/Attempt/payload audit, five readonly tools, Waiting answers, budgets and Stop. Add child context and success/publication guards here; do not create a second execution loop. Existing advice success and draft save are insufficient for a complete child result. |
| [Core](../../../../packages/product-core/case-assistant.ts), [contracts](../../../../packages/contracts/case-assistant.ts), [Ports](../../../../packages/ports/case-assistant.ts) | Keep `DecisionFields`, root draft/formal semantics, strict keys and neutral types. Add bounded collaboration records/commands and result validation. Existing `adopt` means formal Decision/Outcome/report publication and MUST NOT be used for child-material adoption. |
| [Store](../../../../adapters/storage-local/case-assistant.ts) | Reuse `case-assistant.sqlite`, canonical body hashes, receipts, `BEGIN IMMEDIATE`, attached source checks and uncertain-COMMIT readback. Its exact schema identity / metadata 1.0 / user_version 100 currently reject extra tables; an additive migration needs an explicit supported identity. No `state.sqlite` schema change. |
| [Pi Adapter](../../../../adapters/agent-pi/case-assistant.ts), [stored-config transport](../../../../adapters/agent-pi/xiaomi-local.ts) | Both paths currently permit question/advice/tool/draft. Reuse installed Pi, isolated one-turn Agent, no SDK tools, request/cost bounds and sanitization. Add only a child-result response contract and context-specific prompt selection. Pi session history stays private and is never recovered. |
| [Personal Profile](../../../../profiles/personal/xanthil-desktop.ts), [Provider Application](../../../../packages/application/provider-settings.ts), [model-access Port](../../../../packages/ports/provider-settings.ts) | One Profile and one global model lease shared by root, children, three helpers and settings. Current `acquire` locks before credential read and holds through Waiting; retain this, add non-secret occupancy detail for UI and creation admission. Child windows must not compose their own settings/runtime/store instances. |
| [Main](../../../../apps/desktop/main.ts), [handler](../../../../apps/desktop/case-assistant-main.ts), [Preload](../../../../apps/desktop/preload.ts) | Current sender guard accepts only `mainWindow`; close interrupts the whole Profile. Add Main-owned child windows and per-window authorization/close routing. Keep isolated preload, sandbox, CSP, navigation/open-window denial and root-only professional/settings mutations. |
| [workspace](../../../../apps/desktop/case-assistant-workspace.tsx), [renderer](../../../../apps/desktop/renderer.tsx), [styles](../../../../apps/desktop/styles.css) | Reuse shell, modal focus, selected-session/response epochs and independent Stop path. Incremental tree, child surface, result/review/material controls follow the approved clickable layout; no new visual system. |
| [completed fixture](../../../../tests/fixtures/case-assistant/completed-case.ts) and [contract drivers](../../../../tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts) | Reuse real CSV → DuckDB/Python → Finding/acceptance/Closure. Current helper finishes with zero candidates; add a separate collaboration fixture using existing manual candidate/form APIs and sourced synthetic fields before completion. Preserve the old insufficient-evidence fixture. |

Discovery attempted the supplied `JuanerAI-change003-mini` graph first. The tool
returned `MCP tool call requires approval, but approval policy is never`; no graph
result was obtained and the stale general graph was not used. Local readonly code
inspection supplied the facts above. This is not an index-freshness PASS or a Git exception.

## 3. Minimum behavior specification

All rows prohibit automatic Provider calls outside explicit Attempt authorization,
raw rows/files, cross-Case access, recursive execution, and edits to formal data.

| Behavior / acceptance | Input → success | Failure / forbidden effects | Contract |
|---|---|---|---|
| Create / AC01, UI01–04 | Root ID, expected source/formal baseline, type, task, cutoff and selected saved items → one durable child plus immutable context; open independent window | Ineligible source, non-root, global model occupancy, changed preview or invalid selection refuses; cancel writes nothing; no Attempt/model/new Case/raw copy | C1, C2, C5 |
| Authorize/run / AC02–04, UI05–08 | Child ID, exact context choices/text, configured caps and explicit free-text confirmation → new Attempt using disclosed payload; Waiting answer stays in same Attempt | Missing/stale grant, unselected material, extra tool/output keys, wrong source or busy refuses; no implicit history, fallback or queue | C2, C3, C5 |
| Complete / AC04–05, UI07–09 | Valid complete result from active authorized Attempt → immutable result version and Succeeded together | Stop/deadline/source failure before publication, malformed/referenced-outside-scope output or failed save → no success result; partial text remains history | C1, C3, C4 |
| Return / AC04–05/07–09, UI07–10/12–13 | Fork user-selected result or live successful Subagent → one original-parent pending item; explicit local retry reads/commits same result | Parent closed, stale source/permission or unknown commit blocks; return error does not relabel task failure; no model call or duplicate | C1, C4 |
| Review / AC06–08, UI10–12/14 | Confirm exact pending version/source, adopt or decline with optional reason → one terminal review; adopt also exposes one MODEL/user-adopted parent material | Cancel unchanged; stale/conflicting review rejected; decline cannot turn into adopt; no drafts/formal/report updates | C1, C4 |
| Parent continuation / AC02/06/08, UI05/11–12 | Explicitly selected adopted materials + new root preview/Attempt → exact material bytes/provenance included; later root draft uses original formal flow | Pending/declined/stale/unselected material excluded; adoption itself never sends or starts parent | C2, C3 |
| Close/recover / AC05/08–09, UI12–13 | Confirmed child/root close → interrupt applicable active work, invalidate previews; explicit reopen → history and local recovery controls | Cancel unchanged; navigation never closes; startup never resumes model or auto-return; late callbacks cannot revive state | C4, C5 |
| Preserve baseline / AC07/10, UI14 | Existing six stages, helpers, root drafts/formal versions/export remain usable | Child creation/result/return/review cannot alter source revision, evidence, Finding, Closure, original messages/drafts, DR/EO or report bytes | All |

## C1. Durable identity and additive persistence

### Shape and ownership

Retain existing `AssistantSession` as the durable Quick conversation identity.
A child is a new assistant Session plus a required collaboration relation, inserted
in one transaction. Existing root Session JSON stays byte-identical. Absence of a
relation means a legacy/root session, not an inferred child. Professional Session
directories and Case/revision are reused by reference; no professional Session or
`010_draw`/`020_clean`/`060_reports` copy is created for a child.

Proposed **case-assistant store 1.1**, application_id unchanged, user_version 101:
retain all existing tables and add only these five named tables. Each record has
canonical body/hash validation, closed keys and owner/reference validation.

| Table | Key and contents | Invariants |
|---|---|---|
| `collaboration_children` | child_session_id PK/FK to sessions; parent_session_id FK; kind fork/subagent; immutable body/hash | One root parent, same Project/Case/revision; body fixes creation source snapshot, nullable formal head, task, cutoff, selected parent item content/IDs/Attempt/state, selected report summaries and aggregate grant. Parent cannot itself be a child. No rebinding/update/delete. |
| `collaboration_lifecycle` | session_id PK/FK; open/closed, integer epoch and body/hash | Root/child close and reopen change epoch, not business revision. Root row is added only when collaboration needs it. Legacy root without row is open/epoch 0. Closure never deletes history. |
| `collaboration_results` | result_id PK; child_session_id FK; attempt_id UNIQUE/FK; version; body/hash; UNIQUE(child_session_id,version) | At most one complete result per successful Attempt; versions allocated within transaction, monotonic per child; immutable full text, references, limits/unknowns, source/baseline/context hash and execution provenance. New Attempt never overwrites R1. |
| `collaboration_returns` | result_id PK/FK; parent_session_id FK; body/hash | One delivery record per result: unreturned/failed/returned, sanitized failure and first committed return time. Only returned projects into parent pending/review history. Parent identity cannot change. No background outbox or retry worker. |
| `collaboration_reviews` | result_id PK/FK; parent_session_id FK; body/hash | Immutable adopted/declined disposition, reviewed result hash/version and source stamp, confirmation time, optional reason. Adopted row contains unique material_id, MODEL/user-adopted label and result reference; declined has no material. Parent material is a projection of this committed row plus immutable result, not a second copy/table. |

Relationships across legacy hashed bodies (source ownership, root-ness, Attempt
authorization) are checked inside the same transaction; use explicit FKs/UNIQUE
for structural identities. No cascades, triggers, generic property store or new
retention/deletion policy. Existing receipts hold new operation-namespaced
fingerprints for create, finish, return, review and close/reopen. Fingerprints
include exact intent/owner/target/content, not retry time or regenerated IDs.
Same command/different intent → `COMMAND_CONFLICT`; identical replay returns
the committed identity without new effects, even if it is now historical/stale.

### Compatibility, migration, activation and rollback

1. New Store recognizes **exact** 1.0 and 1.1 schemas; no permissive unknown-column
   mode. Read/list of an untouched 1.0 project does not migrate it. Root-only
   legacy writes continue under their existing schema until collaboration is used.
2. First confirmed collaboration mutation upgrades this sidecar in the same
   `BEGIN IMMEDIATE` transaction as its first records. Verify old schema, project,
   hashes and references first; create five tables/indexes, replace only metadata's
   version constraint/table as necessary, set user_version, commit together.
   A failure leaves 1.0 with no child, or a verified complete 1.1 commit; no
   discoverable partial child. Do not edit old body/hash bytes or receipt results.
3. Unknown/malformed/future schema, extra trigger, cross-owner references or
   tampered body refuses before business writes. Lost migration COMMIT is resolved
   by reopening and checking exact schema plus create receipt, not rerunning DDL
   blindly. A concurrent writer gets immediate busy; no queued mutation.
4. `state.sqlite`, source files, Run bundles and report bytes are unchanged by
   migration. New records stay in the same assistant database so child completion,
   return and review need no second writable database transaction coordinator.
5. Old binaries intentionally reject the new assistant schema; they cannot safely
   operate child-bearing assistant data. This is forward-readable by the new
   build, **not downgrade compatibility**. Unused 1.0 projects remain old-readable.
6. Rollback disables collaboration admission in a compatible build while retaining
   readable 1.1 history and existing root behavior. A binary downgrade must preserve
   the newer sidecar and report it unsupported; no down-migration, snapshot restore,
   data deletion or archive rewriting. Actual deployment/rollback is not this turn's authority.
7. Engineering migration proof uses new synthetic projects only, including 1.0
   fixtures produced through the old contract. No existing user project is opened
   or migrated during this package's tests.

## C2. Exact context, source and authorization

Creation resolves selected IDs from saved parent data, never caller-supplied
history text. A Fork cutoff is an exact saved message/receipt position; selection
is limited to the UI's “截至该位置” prefix including that selected position.
Store ordering, not timestamps or a rendered list index, decides membership.
Internal payload/status audit events are not selectable conversation messages.
Inheritance is labeled reference history, never appended as new child messages.
Parent messages appended after creation neither expand the snapshot nor stale it.

The immutable source stamp includes owner/current revision, row version,
Finding/acceptance/Closure IDs, aggregate ID/hash/fields/scope, original final
report identity/hash and current formal head (including explicit null). Selected
formal report summaries bind their own report/decision identity and hash. Creation
does not require a non-null formal decision beyond the approved root eligibility.

Child data/report checkboxes are real restrictions: an unselected aggregate,
Evidence/Finding body, candidate body or report summary must not reappear through
payload construction or readonly tools. Keep the complete source stamp locally
for validation; build the outbound view only from authorized categories/subset.
An excluded tool object yields a refusal, not additional source data. Source IDs
and provenance shown in the preview do not themselves grant the object's body.

Every prepare/start, later Send, model/tool admission, result publication, return,
review and parent material selection validates the fixed source and formal head.
Repeat checks after awaited preflight and immediately at publication. At Store
publication attach the existing source database, hold the original source lock
with `BEGIN IMMEDIATE`, and compare the exact current pointers/row version;
recheck relevant aggregate/report identities and same-transaction formal head.
Do not rely only on the current Application's cached projection.

Previews bind session/parent lifecycle epochs, exact selection/content, source
stamp, task, config generation, limits and builtin Skill/Prompt identity. Keep
these as unused ephemeral authority until one confirmed start consumes them.
Close, process exit or changed selection/config invalidates them, including
prepares and starts currently awaiting storage/credential reads. No persisted
preview or Pi session is usable authority after restart.

Fork's next Attempt defaults to no own-history selections. Allow exact saved
user/model/readonly receipts and prior complete result versions, with origin
Attempt and status; incomplete text is explicitly labeled and cannot acquire a
successful-result ID. Original parent inheritance is redisclosed every time.
Subagent retries after failure/stop require new preview/Attempt for its bounded
task; no automatic continuation. Waiting Send records just the confirmed visible
answer under the current Attempt; any scope expansion requires a new Attempt.

Adopted parent materials likewise default unselected. Exact selected material
content and provenance enter the new parent payload, including MODEL attribution;
never attach all returned results or whole child histories. Stale items remain
readable history and cannot be selected, adopted or sent. Rebinding goes through
the root's existing current-source flow and creates a new child; only individually
reauthorized user-authored constraints may cross revision.

**Authority distinction for Controller decision:** execution-preview invalidation
on close/restart prevents another model request; it does not erase the authority
provenance of an already committed successful result. Otherwise FS-R08's explicit
post-reopen local return could never succeed. Local return/review checks current
source/data eligibility and original-parent lifecycle, and requires the explicit
local action where specified; it neither acquires a credential nor makes Provider
availability a prerequisite. A changed/revoked data qualification blocks it.
Model start/send also require current config availability/generation. This adds
no persistent permission system or way to revive a revoked source grant.

## C3. Public/Runtime contract delta

Keep existing v1.0 root request shapes and semantics. Introduce a closed **v1.1
Case Assistant envelope/projection** for collaboration-aware consumers on the
existing bounded handler; reject unknown version/operation/extra keys. Root v1.0
list/read never misclassifies a child as a legacy root; v1.0 mutators targeting a
child refuse. No v1.0 formal method can write on a child's behalf.

Minimum added commands (names may be privately refined before tests):

- `prepare_child` / `create_child`: source-bound local creation preview and
  command ID; `read_collaboration` / `open_child_window` read/focus the exact child.
- v1.1 `prepare` / `start` / `send` / `stop`: explicit history/result/material
  selections and common bounded execution, not a new model tool.
- `return_result`: original parent, child, result ID/version/hash, command ID.
- `review_result`: exact returned target/source stamp, adopted/declined,
  confirmed boolean, optional reason and command ID. Parent actor follows the
  existing single local user boundary; do not invent identity/role management.
- `close` / `reopen`: explicit lifecycle transitions with expected epoch;
  read/focus/navigation never calls reopen implicitly after explicit parent close.

Store Port exposes semantic child creation, successful result publication,
return, review and lifecycle operations, not SQL or generic CRUD. Result/material
IDs are UUIDs and version is a bounded positive integer; IPC carries no paths,
credentials or Pi types. Projection separates Attempt status, delivery status,
review disposition and derived source validity; do not overload `Succeeded` to
mean returned/adopted.

Extend the existing Runtime business request with a discriminated collaboration
variant carrying an explicit contract version and task purpose. Legacy root
requests keep their original shape and prompt. The child variant uses the same
`turn` Port and selected Pi Adapter but a versioned builtin child-result prompt;
no user Prompt editing or extra Skill installation. Its strict response union is:

```text
question {kind, text}
| tool {kind, tool: one of the five existing names, revision_id}
| result {kind, summary, references[], limitations[], unknowns[]}
```

`result` requires nonempty summary, nonempty combined limitations/unknowns,
and at least one verifiable authorized source reference. References are closed
typed identities for existing Case/revision, Evidence/Finding, candidate,
aggregate, selected report or selected history/material, with exact version/hash
where applicable. An “依据不足” result may cite the authorized Case/task context
and explain the missing evidence; it need not invent an Evidence ID or conclusion.
Lists contain nonempty text/unique valid references; invented/foreign/unselected
references and extra fields reject. Application assigns result identity/version,
MODEL label and actual execution provenance; the model cannot choose these.

Child `advice` and `draft` are protocol failures: no complete result, draft,
return, fabricated question or Waiting state. Only an explicit model `question`
enters Waiting. Previously saved partial text remains honestly labeled history.
No repair or automatic retry. Question/tool behavior retains existing bounds.
Root `result` rejects; root advice/draft behavior is unchanged.
Adapter and Application both enforce the applicable union. The production
stored-config and installed-Pi synthetic paths must exercise the same prompt and
business envelope rules; no test-only child implementation.

## C4. Transactions, cancellation and recovery

### Publication points

1. **Create:** Session + child relation + lifecycle + receipt commit together.
   Window creation follows commit. If the OS window fails, retain the completely
   created local child with a visible reopen action; report window-open failure,
   not a failed/half database creation. No authorization/Attempt is inferred.
2. **Finish:** one transaction checks active Attempt, epochs, source/head,
   authorization, budget and cancellation, then inserts immutable result/version,
   unreturned delivery row, finish receipt and Succeeded Attempt together. No
   success is published merely because parsing, a message append or a model turn
   completed. Invalid output/definite rollback has no result; retain actual reason.
3. **Return:** separate transaction validates result + succeeded origin + current
   source/head + open parent, then marks its one delivery returned and writes
   receipt. Fork only on manual selection; Subagent once immediately after verified
   live success. Parent pending item derives from that commit. A local failure keeps
   the successful result, with sanitized delivery failure recorded if possible;
   never downgrade an already returned row on a late failure callback.
4. **Review:** transaction rechecks exact returned version/hash, review target,
   source/head and parent epoch; inserts one immutable terminal review and receipt.
   For adoption the same row defines the material; no period exists with a review
   but missing material or a material without review. Decline is terminal. Same
   target/same disposition replay is effect-free; opposite disposition or changed
   intent refuses. Receipt replay is a history read, not reapproval of stale data.

Stop closes admission synchronously when Application receives it, before awaiting
storage or a pending start/send. AbortController plus session/parent epochs guard
await continuations. Immediately before synchronous Store publication and COMMIT,
check cancellation/epoch, terminal status and deadline again, with no intervening
await. That checked COMMIT is the success winner. If Stop/close/expiry is accepted
first, late output cannot create a result, return or revive Running. If success
already committed, later Stop cannot erase that historical success; parent close
still fences any return not yet committed. UI click time is not durable completion.

Automatic Subagent return additionally captures the current process/parent epoch.
Close then reopen cannot let an old automatic callback become a fresh return.
If parent close wins between finish and return, successful result remains for
explicit local retry after parent reopen and current qualification check. A return
that already committed remains historical; close does not delete it. Fork's older
valid result remains returnable even while a later Attempt is stopped/failed.

Treat COMMIT exceptions as unknown until independent connection readback checks
the command fingerprint and exact result relationships. Verified committed returns
that result once; verified absent is definite failure. Unreadable → `RESULT_PENDING`,
block affected writes (existing project-wide sidecar mutation block is sufficient),
keep source/history and require verified reopen. No optimistic UI success and no
new command to bypass the block. New Store recovery checks schema/hashes/receipts
before unblocking. Crash can leave either whole commit or none, never half-state.

On application recovery, surviving Running/Waiting attempts become Interrupted;
all unused execution previews disappear. Saved Subagent success without returned
delivery projects as `待回流恢复`, requiring explicit local retry, whether delivery
previously failed or crash happened before its first attempt. Returned/reviewed
records read back as-is. No Pi restore, automatic return, scheduler or model retry.

## C5. Windows, closure and global model exclusion

Main owns a small map of live child window IDs to project/parent/child IDs and
window generation. It creates at most one live window per child and focuses an
existing one without reload/recovery. Renderer routes are display locators;
caller-provided IDs/URL are never window authority. A child may read its fixed
source/parent relation and operate its own bounded Attempt/result only. It cannot
invoke link/create-child, parent review/formal mutation, project selection,
professional writes, export or settings mutation through inherited APIs. Root
performs its own review and existing professional actions. Invalid/foreign frame,
destroyed window, forged sibling or old-project sender refuses before effects.

Children reuse the approved three-column shell/brand, source links, exact
authorization, histories, Stop and result cards. Native window-open failure offers
the visible exact reopen action. Keep existing security preferences for every
window; retain deny-by-default external navigation, popups and permissions.
Opening source/parent focuses/navigates the root; it never stops a child.

- Child native close with Running/Waiting or pending start asks `关闭并停止`.
  Cancel has no lifecycle effect. Confirm synchronously fences work, then persists
  Interrupted/epoch invalidation before completing the close. If persistence is
  uncertain, keep the window/recovery notice; do not present a confirmed clean close.
- Explicit root `关闭父会话` confirms interruption of that root and all unfinished
  direct children and invalidates their previews/prepares. Other root histories
  remain untouched. This is distinct from switching root, mode or source view.
- Native root confirmation is required for active associated child work. A connection
  probe, pending credential save or legacy root consumer alone uses its existing
  revocation/close path without a collaboration confirmation (F1–F4/UI-FS13).
- Closing the main application window/quit invalidates all hosted model work;
  handle active confirmation and owned child windows centrally, not once per
  callback. Crashes/renderer destruction fence that window's work in Main without
  trusting a Renderer unload callback. Restart recovery handles lost persistence.
- A root's explicit reopen requires current qualification before local return;
  expired history can still be inspected without receiving fresh execution rights.

Extend the existing `LocalModelAccess` occupancy snapshot to expose only safe
owner/action information for the visible busy/Stop route. There is one process
lease from pending start/credential read through Running/Waiting to terminal
settlement; settings test/save/delete and all three helpers contend on the same
lease. Creation checks occupancy initially and immediately before its local
publication; no credential acquisition/model call is needed for creation. No
check-then-await gap may admit child creation while a model owner has appeared.
Child start always acquires the shared lease again; it never relies on an earlier
idle preview. Root/child Stop remains callable while a start/send is pending.

Profile must supply this same exclusion for every executable configuration,
including explicit activation and synthetic integration compositions; optional
absence of `modelAccess` cannot leave the collaboration product path concurrent.
Use the existing admission abstraction, not a second lock per window or a queue.
On terminal/Stop release once, clear private credential access, fence all late
callbacks; no new task can obtain authority from the old callback's lease.
Provider already-issued traffic cannot be retracted; cancellation proves local
admission/publication exclusion, not remote reversal.

## 4. Validation, effects and decision request

The [tasks/validation outline](tasks.md) binds positive, negative, real SQLite,
installed Pi synthetic, native-window and regression evidence. No test was written
or run for the initial documentation-only proposal. Implementation evidence is recorded
in verification; acceptance of this design alone is not a test PASS.

### Affected domains

Core/Application/Ports/contracts: child identity, source authority, exact selection,
bounded result and publication. Storage Adapter: additive sidecar format and atomic
commands. Pi Adapter/Profile: task-specific output plus common runtime/model lease.
Desktop: Main-owned windows, scoped IPC, incremental approved UI. Quality: additive
coverage and narrow replacement of obsolete Fork/Subagent Preview assertions.

### Accepted decision and remaining proof

Engineering decision 001 accepts C1–C5 with the corrected C3 union above. There
is no unresolved product question. Physical migration/races, native closing and
full regression remain unverified until executable evidence is recorded. No added
Provider, credential, dependency, installed-app, external-system or Git authority.


## Independent review corrections within accepted C1–C5

The parent workspace exposes the approved family close control using its existing
Modal and action styles. Cancel changes nothing; confirmation sends the existing
versioned close command for the captured parent/epoch. Reopen stays explicit.
Main additionally fences renderer disappearance, destroyed webContents and closed
windows once, before awaiting persistence. Child loss closes that child; root loss
revokes its hosted profile. A lost renderer cannot retain IPC authority. Normal
confirmed close shares the existing durable close path and does not double-close.
Application family close includes pending child authorization IDs before its first
await, so delayed model admission cannot outrun persistence.

The Store's existing createChild Port receives a process-local synchronous
admission assertion. It runs in the actual SQLite transaction before receipt,
migration or child writes, then executes synchronously through COMMIT. Application
supplies the same global occupancy/pending/Running/Waiting check. This closes the
accepted C5 final-check race without a second lease, queue, persistent schema or
public IPC change. No new material decision is needed beyond decision001.

Review material remains a projection of one adopted review row and its exact
result; there is no separate material table. Process-boundary evidence therefore
checks both the stored row and the public material projection after recovery.

Native destruction retains the webContents identity captured before destruction;
Main never resolves that identity again through a destroyed BrowserWindow. The
same handler receives renderer-gone, destroyed and closed events, so both native
root teardown and direct child destruction preserve the existing close ordering.


## CONTRACT_CHANGE_REQUEST — C1 explicit close on schema100

Status: **ACCEPTED by engineering-decision-003.md**. Candidate002 and the frozen
request remain historical evidence. Decision003 authorizes this exact extension;
the original request text below is retained as the accepted rationale.

### Current contract and reason

Decision001 C1 limits exact assistant sidecar 100→101 activation to first
collaboration creation in its transaction; reads never migrate. Schema100 has no
lifecycle row. Current Store closeFamily therefore cannot persist a closed root
without children. Application then clears its process-local closed marker when
Store reports open. Independent native probe002 and permanent real handler test
`schema100-close-red-001` both return success with open=true/epoch0 after confirmed
v1.1 close. This violates AC-FS-09/UI-FS-13. Removing only that marker clearing
would still leave readback and fresh-process recovery open.

### Proposed contract (minimal C1 extension)

- Permit exact 100→101 activation on **confirmed v1.1 explicit session close** as
  well as first collaboration creation. Reuse the same five tables/schema guard;
  no schema102, extra database/file, new IPC field or repurposed legacy record.
- Commit migration, the selected root's closed lifecycle (initial epoch1), and any
  applicable active-attempt interruption together. Other roots retain their
  current history and implicit open epoch0. Existing schema101 family-close rules
  remain unchanged. No child, receipt for child creation, result, delivery or
  formal/report record is created by close.
- Read/open/list/prepare/cancel never activate the schema. Legacy v1.0 close and
  ordinary Application/native shutdown on an untouched schema100 project retain
  their existing behavior and do not activate it. A private intent argument at the
  existing handler/Application/Store seam distinguishes the explicit v1.1 action;
  no new user control or authorization surface.
- Synchronous process fences revoke pre-close grants, previews and pending work
  before awaiting storage. Durable closed state also blocks fresh prepare/create/
  start after constructing a new Application. Explicit reopen increments epoch,
  permits fresh operations and never restores grants, invokes a model or returns
  historical results. Unrelated parent work remains unaffected.
- Before-COMMIT failure leaves exact schema100 with no partial migration. Do not
  acknowledge durable closure unless readback proves it. On uncertain COMMIT, use
  durable lifecycle readback before reporting/retrying; retain local safety fences
  while closure is unresolved. Retry cannot double-advance the epoch or duplicate
  effects. Preserve the existing explicit retry path and truthful failure state.

### Compatibility / migration / rollback

New builds still read exact schema100 without writing. The compatibility change is
that a confirmed new close can now activate schema101 before any child exists; an
old binary will then refuse it, as already specified for schema101. No backfill,
down-migration, restored user database or blanket project migration. Original
source/formal/history bytes are preserved except the already-required interruption
of active assistant attempts. Use only owned synthetic projects for verification.

An in-memory-only closure cannot satisfy persisted close/restart. Encoding lifecycle
in legacy session bodies, archived flags or command receipts would introduce a
different persistent meaning and jeopardize v1.0 compatibility. Reusing the accepted
lifecycle table is the smallest explicit contract extension.

### Affected domains and validation

Desktop handler passes private explicit-close intent; Application preserves
synchronous fencing and checks durable lifecycle; business Store Port/Adapter
implements the same atomic activation/close. Runtime, payloads, UI contract and
formal/business source authority are unchanged.

Permanent RED: `tests/integration/xanthil-desktop/case-collaboration-lifecycle.integration.test.ts`,
`F1 AC-FS-09 schema100 explicit v1.1 parent close persists...`; evidence
`worker/schema100-close-red-001` (exit1, actual open=true/epoch0, expected closed/epoch1).
Before the failing assertion, saved parent history, read/list/open/cancel byte
preservation and schema100 are proved. Later closed/restart/reopen assertions are
present but NOT yet executed successfully. Native independent probe002 remains
the actual normal-UI counterexample; neither evidence is relabeled as a fixture error.

After acceptance: add affected pending-preparation/start and stale-grant close/
reopen cases, legacy v1.0 and other-family regressions, migration pre-COMMIT failure
and lost-COMMIT readback/idempotency checks. Then focused GREEN/type/justified offline
regression, fresh bundle binding, complete permitted native matrix and unchanged
independent probe002 assertions with bindings updated only. No repeat F2–F5 review
unless affected evidence requires it. No candidate003 freeze before host GREEN.

### Boundary classification / decision requested

In-boundary **material persistent migration-trigger/compatibility change** under
decision001 C1 and the latest repair dispatch. No new product behavior, runtime,
permission, cost, external effect or data scope. Controller accepted
this exact C1 extension in decision003; dependent implementation is authorized. User decision: not required
for this in-boundary proposal; F6's existing permission obligation remains separate.


### Decision003 implementation readback

Explicit v1.1 close now carries the accepted private intent through the existing
Application/Store seam. The Store uses its existing migration and one close
transaction, with exact lifecycle/attempt readback after uncertain COMMIT. No
activation occurs from the default legacy/shutdown path. Durable lifecycle guards
root preparation/start; process epochs also fence parent-material preview awaits.
The eight added lifecycle tests and existing schema101/legacy regressions pass;
host checkpoint010 passes the full permitted matrix and original probe002 replay.
Complete candidate003 is frozen for independent recheck with F6 still permission-blocked.
