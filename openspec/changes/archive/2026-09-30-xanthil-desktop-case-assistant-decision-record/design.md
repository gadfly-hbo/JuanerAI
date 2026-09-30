# Engineering design and material contract impact

Status: accepted by Mini Engineering Controller on 2026-09-29, before dependent code.
This is an incremental boundary-sensitive Change, not greenfield_fast_path.

## Actual baseline reuse

| Existing executable boundary | Reuse / exact delta |
|---|---|
| `packages/contracts/xanthil-desktop-ipc.ts` OwnerRef, DesktopProjection, DecisionCandidateInput | Keep v1 methods/shapes; separate versioned Case Assistant API leaf with explicit source OwnerRef; no Pi types. |
| `packages/application/xanthil-desktop-decision-case.ts` createXanthilDesktopDecisionCaseApplication/readProjection/openSession | Existing verified professional projection remains source; add a separate business use case composed by Profile, not an alternative analysis implementation. |
| `packages/product-core/xanthil-desktop-decision-case.ts` canonicalDesktopJson, final report/evidence rules | Reuse canonical encoding, accepted source semantics; add draft validation/report increment rendering in a new Core leaf. |
| `packages/ports/xanthil-desktop-decision-case.ts` DesktopDecisionCaseStore | Preserve closed method set and current Adapter contracts; new CaseAssistantStore and CaseAssistantRuntime leaves own only new behavior. |
| `adapters/storage-local/xanthil-desktop-decision-case.ts` readProjection/readReportExport + state.sqlite | Keep exact original schema/identity verification. New adjacent operational DB; original source remains verified and never rewritten by Assistant. |
| `adapters/agent-pi/local-analysis.ts` DecisionAssistanceRuntime | Keep one-shot assistance unchanged. New scenario-specific Pi Adapter uses already-installed 0.84.2 core/ai through explicit local resolution, no CLI, registry or fallback. |
| `profiles/personal/xanthil-desktop.ts` composition/openProject + deployment checks | Reuse selected native Project, toolchain and analysis composition; attach Assistant application with explicit nullable configuration, default unauthorized. |
| `apps/desktop/main.ts`, `preload.ts`, `renderer.tsx`, `styles.css` | Keep sender policy, native dialog/export ownership and professional behavior/core. The shared shell and professional presentation must conform to the approved clickable UI; retaining the old visual shell was incorrect. New bounded IPC channel and Quick component, stage-6 entry/return. |
| `tests/fixtures/xanthil-desktop/desktop-fixtures.ts` and desktop-contract-drivers.ts | Reuse synthetic members/orders, real confirmed+completed Case flow and exact byte identities; add Assistant fixtures, never copy archived intermediate code. |
| Existing Desktop/local-analysis contract/integration/e2e suites | Retain baseline assertions; update only explicit Preview/brand expectations affected by UI-00/Quick delta with equivalent negative assertions for forbidden capabilities. |

Current state.sqlite has exact sqlite_schema inspection, application_id 1480870705,
user_version 100, schema_version 1.0; product_sessions.mode is professional-only.
Completed revision rows and source report pointers participate in integrity
reconstruction. Therefore adding optional tables, Quick rows or modifying report
pointers there would violate the accepted exact-schema contract.

## Summary / current contract

The first Change has immutable Completed analysis revisions, final report files,
professional-only Sessions, three one-shot assistance types and no formal
Decision Record/Expected Outcome. No baseline schema migration exists.

## Proposed contract and shape

### Operational persistence and publication

Add `.xanthil/desktop/case-assistant.sqlite` version 1 in the same explicitly
selected native Project. This is a scenario-owned operational Adapter, not a
second source of analysis facts. New database tables represent:

- metadata: schema/application identity and exact Project identity;
- sessions: independent Quick ID/title, source OwnerRef, timestamps/archived flag;
- attempts: immutable authorization snapshot, selected formal baseline, status,
  exact limits, usage and terminal reason; one live attempt per Quick Session;
- events: append-only product messages, normalized tools and actual model payloads;
- drafts: immutable field versions, source/attempt/formal baseline and disposition;
- decisions: append-only Case/source chain entries bundling formal Decision and
  Expected Outcome identities/fields/actor/time/source;
- reports: immutable Markdown/HTML bodies and byte hashes, original final report
  reference plus formal decision/outcome reference, sequence;
- heads: one current formal pointer per Case/source revision;
- receipts: command ID + operation/fingerprint + result for exact idempotency.

All three formal objects and their report bodies are in this one SQLite commit;
there is no file rename/database dual-write publication gap. A report is a stored
business artifact with verified bytes and hash, not a renderer-generated claim.
Export uses Main's native destination capability and deterministic stored bytes;
old final report remains exported through the existing path. HTML escapes all
user/model content. Superseded state is derived without modifying source rows.

The Assistant store receives an already integrity-checked source projection
through Application's existing Desktop store. For admission/adoption it attaches
original state.sqlite, begins IMMEDIATE, and rechecks Project/Session ownership,
current revision, state Completed, accepted Finding, Closure and final report
identities against that verified projection. SQLite reserves the attached
original DB as well as the Assistant DB: existing original writers must wait or
fail BUSY before changing current_revision_id. No await or callback occurs
between in-transaction identity read and commit. Therefore a new revision commit
wins either before the read (reject) or after Assistant publication (a later
source change), never inside its validation/publication gap. A real two-connection
contention/race test must prove this assumption before dependent adoption code.
Only Assistant tables are written; no original DB page/report/file is changed.

Within that transaction recheck draft version/disposition and head equality.
Matching prior command receipt returns its original result, even if a later
version exists. Conflicting fingerprint rejects. Sequence derives from current
head, not Quick Session-local counters. Concurrent adoption serializes, one
winner; stale drafts are computed from source/head differences and remain
readable. Report version numbering continues after source final report; decision
version chain starts at 1. A revision rebind never silently carries prior data.

SQLite failure before commit rolls back. Exceptional commit response reads the
same receipt on a fresh connection: matching receipt returns success, confirmed
absence yields failure, unreadable outcome yields RESULT_PENDING and disables
mutations pending verified reopen. Broken schema, symlinks, wrong Project,
malformed rows, missing baseline source, hash mismatch, or unverifiable store
refuse admission/publication; preserve history, do not repair silently.

### Business Ports and public IPC

A separate `case-assistant` v1 contract leaf defines source, authorization,
messages/tools, draft fields, decision/report projection and closed command
variants. No path or arbitrary SQL reaches Renderer or Runtime. Main validates
sender and exact command shape, then calls Application. The Runtime Port is a
bounded turn over business context and allowed tool responses; it returns advice,
question, authorized tool request or structured draft plus observed usage and
provider/model provenance. It receives no Store/write capability. Tool execution
is owned by Application and carries an AbortSignal and explicit source scope.

Store operations are business-named: open/list/read linked Session, append Attempt
and audit events, save/dispose draft, settle Attempt, adopt decision, read report.
The Store implements atomicity/replay; Application owns authority and semantics.
New errors map to visible cause, preserved Case authority and safe recovery.

### Authorization, execution, budget and lifecycle

Profile supplies exact Provider/Model authorization and numeric limits, or null.
Production default remains null. Offline tests inject a synthetic runtime and
limits; this does not authorize a production Provider or establish defaults.
Authorization binds exact source, formal baseline, initial text, selected history,
report summaries, aggregate identity/fields/scope, tool list and Skill/Prompt.
Application records exact serialized actual payload before each issued turn.
Tool payload can only contain authorized projections, never the full Desktop
projection (which includes local metadata and unselected history).

Reserve a configured maximum cost for a model turn before issuing it; refuse if
remaining authorized budget cannot cover that reservation. Runtime config must
bound the request's output/input and have a computable maximum monetary charge;
missing bound fails closed. Observed actual cost/usage must be finite, nonnegative
and within reservation, otherwise terminate and retain the audit discrepancy.
No hidden retry or alternate Provider. Turns, active execution milliseconds and
cost are independently bounded. Waiting pauses active timing; exact waiting
expiry is disclosed, scheduled and checked before reply. A terminal attempt has
no new turn/tool admission. Abort races are checked after each await; late
response cannot publish a new draft. Already-completed valid drafts remain
reviewable subject to current source/head and retained authorization.

Close Session and application shutdown interrupt live attempts; restart settles
orphan Running/Waiting attempts as Interrupted before a new start. New Attempt
starts a fresh in-memory Pi execution path. Continue selects and discloses local
history explicitly, preserving its formal baseline; current-head conflict needs
explicit rebase and exclusion of old-baseline draft/model/receipt context.

## Compatibility, activation and rollback

- Backward compatible original DB and professional API; no migrations/backfill
  or default-filled original records. Existing old app can still operate original
  Project and simply does not display Assistant additions. If it creates a newer
  analysis revision, new app detects staleness on next read/adoption.
- Assistant DB initializes only on an explicit associated-Session action after
  verified Project open. Merely opening an old Project creates no Assistant data.
- Production Profile defaults to unavailable Provider, no implicit external call.
  Installed pi packages may be resolved within Adapter for offline feasibility;
  manifest/lock changes or installation are outside this decision.
- Rollback selects earlier application; preserve adjacent DB and all new history.
  Never delete or downgrade new records; reactivation validates version/Project.
- No test or production schema touches a real user Project during development.
- No retirement of original SDK path, storage, reports or tests is proposed.

## Affected domains

Core: formal semantics/rendering. Application: permissions, lifecycle and adoption.
Ports/contracts: new scenario leaves. Storage: adjacent DB transaction and bytes.
Pi: bounded core/ai turn. Profile: nullable composition. Desktop: approved UI.
No new architecture family, Provider, dependency graph, data class or external
side effect is added beyond the approved product package.

## Validation required for decision

Positive: real source→Quick→question→readonly tool→draft→human adoption→reopen→
report export and professional return, with original DB/report hashes unchanged.
Negative: malformed/forbidden tools, missing/changed auth/caps, stop/wait/close,
late results, draft invalid/reject/cancel, stale revision/head, cross-Case data,
conflicting command reuse, mid-transaction failure and uncertain commit response.
Integration: native SQLite lock/read contention, competing Sessions, source
new-revision race, no half object sets, immutable original bytes and all histories.
Existing Desktop and local-analysis contract/regression suites remain required.

## Boundary classification

In-boundary engineering contract decision for approved product behavior.
No user boundary expansion. Real Provider/egress/cost execution remains separately
prohibited. If installed runtime cannot enforce a computable charge reservation
or the SQLite locking proof fails, stop the affected path and return evidence to
Mini before revising the contract; do not ship best-effort hard limits/atomicity.

## Engineering Controller decision

Accepted for the authorized offline Change 002 implementation. The additional
operational SQLite file preserves the existing exact-schema contract and keeps
the new records under the same Project and Application authority; it does not
introduce a second analysis truth or a new product architecture. The separate
business Port/IPC leaf is justified by the approved new Session/Attempt and
human-adoption semantics. Existing one-shot assistance remains unchanged.

Implementation must first prove attached-database lock behavior with actual
SQLite connections and the installed Pi core/ai path with synthetic transport.
Dependent atomic-adoption/runtime claims remain unverified until those proofs
pass. Do not weaken hard bounds or silently install/promote dependencies if a
proof fails; return the concrete technical issue to Controller.

Keep all original source validation, source/report immutability, exact command
replay, simultaneous Session conflict and rollback tests stated above. Export
must exercise stored report bytes through the existing native destination
boundary. Default production configuration remains unauthorized. This decision
does not authorize real Provider execution, egress, expenses, new dependencies,
product acceptance, Git publication/integration or release.

## User decision

Not applicable to the proposed in-boundary choices; original authorized intake
and frozen product inputs remain the only product authority.

### Controller decision — manual formal revision, accepted 2026-09-29

Controller explicitly accepted `revise` and `cancel_revision` in the existing
Case Assistant v1 boundary for plan §5.4 / AC-13 / UI-12,14 / Gate F. Input is a
Session plus the exact current formal Decision id. Copy that immutable record's
fields into a new pending draft with `manual_base_id`, retaining the original
source and authorizing Attempt provenance; bind the current formal head. No new
model Attempt or payload is admitted. Cancel disposes only that pending human
revision. Adoption still uses complete fields, original valid task authority,
current eligible source, and formal-head CAS. A cross-Session formal origin is
allowed only through the persisted current Decision -> source draft -> original
Attempt chain. No input can substitute authority. Cancellation/reopen creates no
formal Decision, Outcome or report version.


### Controller decision — packaged existing Pi closure, accepted 2026-09-29

The actual Forge Vite default excludes all node_modules; native-006 binds SDK
resolution to the real package and fails ENOENT before a model call. Controller
accepts preserving the existing installed production closure in the package.
`@electron/packager/dist/prune.js` uses Galactus `collectKeptModules` and
`copy-filter.js` filters non-production modules during copying; no npm command,
installation, lifecycle script or source node_modules mutation occurs. Forge
ignore therefore permits .vite, package.json and node_modules, with prune true;
rebuild onlyModules remains empty. Offline and ignore-scripts flags are explicit.
Package/lock versions and dependency declarations are unchanged. The new package
must prove exact installed/lock identities, dev dependency exclusion and an actual
packaged Pi synthetic stream. Historical package-fixed-001 and native-006 remain.

### Conditional validation/build wiring, implemented 2026-09-29

The intake's conditional root is exercised only for the existing `forge.config.cjs`,
`tsconfig.json`, `tools/harness/validation/run` and existing exact test fixtures.
Controller accepted the exact Change002 TypeScript tuple on 2026-09-29: P5 remains
an allowed historical tuple, all old intermediate/selector negatives remain, and
Change002 appends an explicit ordered inventory with missing/reordered/unknown
configuration negatives. No wildcard approval or dependency change is introduced.
Canonical full validation builds the test-only synthetic Main bundle and runs
Desktop native files with `--test-concurrency=1`, because two GUI processes must
not compete for macOS focus. The helper is excluded from the packaged app.
The original AC-XDESK-001-03 leaf and its exact coverage map now describe the
approved readonly Skill/Prompt and effect-free Fork/Subagent Preview delta.


### Validator correction implementation details (2026-09-29)

Existing acceptance and all schema/IPC/authority decisions above remain unchanged.
V01 review dialogs capture the exact Session and a cloned draft (id, version and
reviewed fields). Compare that snapshot with the active projection and source/head
eligibility before edit/reject/adopt; changed review identity blocks the command
and asks for fresh review. Requests carry the captured identity. Store still owns
transactional version/head checks. This is private UI state, not new authority.

V03 tracks whether initial Attempt persistence completed. If the first user-event
write fails, settle the saved Attempt Failed before returning the original error;
no runtime is started. A fresh explicit Attempt is the recovery path after the
single transient fault. V06 accepts the editor's explicit ISO timezone format,
checks calendar/time/offset fields before Date normalization, and returns UTC
milliseconds without changing the caller's editing object or stored schema.

Recovery probes extend existing contracts: actual child Application processes in
Running/Waiting are gracefully closed or killed, then a new Application reopens
real SQLite history as Interrupted with no runtime call. For adoption, inject one
lost COMMIT response before or after the actual commit and fail the first fresh
receipt connection. Both retain RESULT_PENDING mutation blocking, then verified
reopen/receipt and same-command replay produce exactly one formal object set.
No production recovery change was needed for these probes.

V02 uses a private response epoch to drop pre-Stop start/send/poll responses. Stop
has an independent in-flight guard; it invalidates older requests before dispatch
and reads issued during Stop after the terminal result. It releases the obsolete
ordinary action lock without allowing that action's delayed finally/error handler
to affect a newer request. Authorization is unchanged; only the submitted dialog
closes immediately. V04 reuses openAssistantSource for the top mode switch and
retains the linked Quick projection. V05 compares exact history/report ID sets,
not array order; any actual added/removed selection still requires authorization.

## Candidate004 private deployment supplement

The Controller accepted explicit Main activation/private in-memory credentials and
revised billing to positive Token Plan Credits on existing stored shapes. The
accepted authority,exact private input/output/failure contract,quota semantics and
source references are in [provider-install-supplement-001.md](provider-install-supplement-001.md).
No schema,public IPC,Runtime Port,professional assistance or dependency change.
Package007/internal004 reuses the existing relocatable profile/resources and fixed
production dependency closure. Candidate004 freezes offline safety/install evidence;
real execution remains separately gated by exact user data/budget/command approval.

## Candidate005 deployment closure

The Main Vite config leaves @earendil-works/pi-coding-agent external, preserving
Pi's installed ESM import.meta/resource identity. Bundling it into CJS caused the
confirmed native fileURLToPath(undefined) failure. No Adapter/Port/schema/public
authority change. Package008/internal005 uses the same installed dependency closure.
The runner explicitly expands details before exact visible payload equality and
records fixed check identifiers without raw real-provider errors.

Controller's current user authorization and matching plan003 receipt enabled the
actual bounded production Pi journey, which passed including Stop, tool, draft,
adoption and unconfigured reopen. Full offline canonical and DMG/install results
are recorded in verification.md; final independent and user acceptance stay separate.


## UI fidelity correction implementation (2026-09-29)

UI-FIDELITY-001–003 is a presentation correction to the frozen standard. The one
64px brand/header row centers the segmented mode switch. Project, global search
and auxiliary context access stay in that row; the retained compact work status
footer preserves the first Change's background-work return capability. Professional
stages move into the 245px left navigation (220px at the smaller viewport); existing
Project/session access remains below the stages. Stage6 uses current verified
Finding evidence/limitations, accepted Finding identities and actual report version
for its four cards. The large Assistant entry and formal summary use existing
AssistantProjection. Right-side Case control and report buttons read existing
versions; original analysis report/export remains in stage5. Completed Closure is
expandable; incomplete Closure editing remains open and executable as before.

Quick uses the reference 260px/310px rail widths at 1440, the approved cream/navy
message hierarchy, orange primary actions, compact source banner, two-column draft
fields and fixed composer. Authorization groups source/model, positive limits and
data boundaries without changing any payload, confirmation, history-equality or
admission check. No reference fake data/controller is imported. No public, storage,
Profile, Runtime or safety contract changes are needed. One-shot visible names use
UI-18's 帮我整理问题 / 帮我解释证据 / 帮我起草候选; their business operations and
separate per-call disclosures remain unchanged.

### UI correction final implementation boundary

U2's local DOM observer now honors the auxiliary icon's accessible label. This
changes test observation only; real Running identity/SQLite checks and timeout stay
fixed. Native1280 focus/bounds evidence confirms the retained scroll areas expose
bottom draft fields and revision creation. Package010/internal006 reuses the exact
Main/Profile/Runtime/Store and dependency closure from internal005; three UI files
are the complete production delta. Actual results and image comparisons are in the
current verification section. Final author status is READY_FOR_INDEPENDENT_REVIEW.

## Controller impact decision — UI review findings VUI-01–04, 2026-09-29

The fresh independent candidate007 review is FAIL with four concrete approved-acceptance defects. Controller authorizes correction within existing Change002 product and safety boundaries: Case-owned UI state identity/clearing; safe reply-persistence failure and waiting-deadline handling; business-readable current/history report presentation and newly generated Markdown/HTML; truthful draft adoption/report status. Candidate007 and internal006 remain immutable failed history. This is not a new product/UI scope and does not require another approval of the frozen original.

Compatibility decision: no database/schema migration, no changes to existing IDs, formal facts, authority, native export ownership or external interfaces. Previously persisted reports and exported historical bytes/hashes remain immutable and readable; renderer may present the linked authoritative FormalDecision in labeled fields without rewriting historical reports. Newly adopted reports may use readable labeled Markdown/HTML in the existing report contract, preserving complete fields, provenance, escaping and deterministic hashes. Old reports retain original stored/exported bytes; do not silently regenerate or mutate history. The worker must verify mixed old/new report histories, byte preservation and no new formal objects when merely viewing/exporting.

Application recovery remains inside existing statuses and explicit continuation semantics: no hidden retry/provider invocation, no extended deadline or fabricated success. Real SQLite failure probes and Stop/deadline races must prove safe termination/recovery and preserved history. Conditional Application/Store/Core/affected tests paths are authorized for these repairs. New public/persistent structural or safety changes remain outside this decision. No actual provider calls, credentials, dependency installation, Git or archive authority is granted.


### VUI01–04 implementation under the Controller decision

Professional formal state is cleared on new Session and before each asynchronous
read. A projection guard compares project, professional Session, Case and revision
in both the linked Session source and verified source owner. The same guard applies
to the body and right control pane, so an old response cannot leave old actions
active while a different or empty workspace is selected.

Reply persistence remains inside the Waiting deadline. Source checking and the user
event append share one failure boundary; failure settles Failed and preserves the
original error. A prior Stop/deadline abort wins. Successful persistence alone
clears the waiting timer and admits the next runtime turn. Recovery is an explicitly
authorized fresh Attempt; no retry, deadline extension or new status is introduced.

A pure Core presentation function lists all stored Decision/Expected Outcome and
provenance fields. Store uses it only when generating a newly adopted report; HTML
escapes values and Markdown escapes markup. Professional preview binds each report
to its own immutable FormalDecision by report/decision/source identities, with an
unavailable-state message when missing. Current decision is never a fallback. Old
report bytes/hashes and native export authority are unchanged. Draft footer text
derives adoption/report identity or rejection/cancellation state rather than always
claiming no report exists. No principal layout or public/persistent contract change.


### VUI01–04 final author evidence

The scoped implementation above is bound to package011/internal007 and actual
host016 results:23 Assistant native PASS, install3 +LaunchServices1 PASS, canonical
2182PASS/0FAIL/1 real-gateSKIP. No further implementation change followed host return.
Old report bytes/hashes remain unchanged; only newly generated report formatting
uses the labeled sections. Full current scope and visual capture limitations are in
verification.md and vui-final-readback-001/review.md. Candidate008 is author-ready
for the same independent read-only reviewer, not accepted.


## Provider Settings increment — minimal deployment design / first loop

The confirmed intake grants the private credential Port, closed settings IPC,
configuration generation and activity exclusion. Initial seam decisions use that
authority; no extra product approval is required. TypeScript owns all state,
validation, authorization and composition. A minimal Swift Security.framework
helper is conditional OS binding only; no package install or generic command API.

Credential Port is Main/private: inspect or read local credential, replace, remove.
Renderer receives only fixed provider/model, saved/unavailable/invalid status, last
test outcome and active state. Its settings messages are a closed list (status,
test, cancel, save, delete) with exact fields; no service/account/path selection or
plaintext-read response. New input is held only while editing/testing/saving, then
cleared on edit cancellation, close and saved success. Test proof is a Main-held
opaque capability bound to input and generation; renderer cannot invent proof.

OS bridge protocol is one bounded JSON message on stdin and one bounded JSON reply
on stdout to the private parent pipe. No secret in argv/env/stderr. Helper uses one
compile-time service/account, local non-synchronizable Keychain item; replacement
is SecItemUpdate (no delete-before-add). Only numeric OS status and fixed codes
escape the Adapter. Startup uses noninteractive access; explicit user recovery can
allow the normal OS access prompt, with30s parent timeout. Interrupted/unknown
mutation must be read back before any new runtime admission. No text fallback.

A new read of the same credential must not invalidate existing prepared work; a
verified save/delete advances the in-process generation and invalidates unstarted
authorizations. Main owns the activity gate across configuration tests, starts,
sends, live Running/Waiting and one-shot execution. Actual source/payload checks
stay in their existing Applications. Profiles receive private runtime capability,
not environment fallback; Pi-specific authentication/model details stay in Adapter.
No new persistent business schema or independent settings database.

Connection probe: installed Pi model path, exactly Reply with OK., empty system
context/tools/history, one request,128 max output tokens,30s absolute time, no retry
or JSON repair. These finite per-click bounds do not impose a total subscription
quota. Production tasks retain finite disclosed existing per-task bounds. Probe
output is not a business draft and is not stored. Actual provider tests are hosted
by Controller under existing authorization; worker never receives the real key.

First feasibility app is a new task-root copy of immutable internal007 with a
synthetic-service bridge under Contents/MacOS, helper signed before app sealing.
No production bridge/runtime activation is claimed from it. A compile-time probe
service prevents reading/changing any user's configured credential. Native test
checks absence before creating, exact private readback/replacement, another helper
process/relocated app read and owned-item removal. System denial is retained as an
actual host limitation; no change to the user's default Keychain/search list/lock.
Further OS permission/unknown commit and final normal production startup evidence
remain required after this thin path. Principal approved shell stays unchanged.


### PS implementation contract — 2026-09-30, host017 consumed

Host017 reached exact PS01 missing-entry causal RED and nine real OS checks PASS.
Main now composes a single local settings Application and the fixed Security helper.
Fixed production service `com.juanerai.xanthil.xiaomi-token-plan-cn`, account `api-key`;
no slot/path selector in IPC. Helper lives in Contents/MacOS, separately adhoc signed
before existing outer seal. It receives bounded JSON via stdin, returns bounded
private stdout; Main never logs raw stdout/stderr. No user/default Keychain mutation.

Settings requests are closed read/refresh/cancel/test/save/delete operations.
Only newly entered keys cross Renderer→Main. Test success yields an opaque proof
bound to input hash and generation; save requires both unchanged bytes and proof.
Close/change/cancel invalidates proof. Mutation is judged by actual readback even
when OS reply is uncertain. Unavailable read blocks activation. Confirmed save
(including same key) invalidates unstarted authorization. No Project schema changes.

Application-local `LocalModelAccess` carries only availability/generation/admission.
The shared service acquires its lock synchronously before Keychain read. Case
Assistant holds it through Running/Waiting and releases at terminal settlement;
pending Start Stop/close cancels admission before Attempt publication. One-shot
helpers bind preview and accepted disclosure IDs to generation in memory, acquire
before preflight/admission and release after asynchronous terminal processing.
Old disclosure rows stay immutable; reopening requires fresh model authorization.
Runtime credential is private to Profile/Adapter, held only during admitted work.

Normal stored mode uses fixed Xiaomi Pi0.84.2 Agent/ModelRuntime, same endpoint/model,
no alternate routing or ambient auth. Case per-Attempt bounds:8 turns,300s execution,
120s per wait,60s per turn,12000 input bytes,2048 output tokens; existing positive
Credits reservation shapes retained. Probe:exact fixed text,128 output/30s/one call.
Three one-shot helpers retain exact canonical payload, own confirmation, no tools,
one request,2048 output/30s; old non-desktop Runtime path remains unchanged.
SDK raw errors are classified in Adapter memory and discarded; UI receives codes.
This changes the normal credential/runtime composition and therefore requires NEW
real proof; historical plan005 is not proof of this new integration.

Approved panel is implemented in React with native modal focus containment,
Escape/return focus, exact fixed test disclosure and separate Save. Read-only UI
status polling reads Main memory only; it performs no OS/probe/network operation.
Production single-shot fields show the fixed service; legacy synthetic fixtures
without the settings channel keep their test selection. Global entry works without
Project. No sample controller/data from approved HTML enters production.

### PS01 host018 correction contract

Mouse or keyboard activation records the invoking settings button explicitly.
Escape, Close, Done and unconfigured Cancel close the native dialog before returning
focus to that same connected element. No configuration/test is started by close.
Host018 supplies causal RED: original native focus-return assertion failed after
Escape. Preserve it and cover button/cancel and keyboard reopening.

The second host018 failure is test setup, not product RED: Playwright evaluate has
no dynamic-import callback. Load a test-only CommonJS hook with Electron's builtin
createRequire; imports in that real module share normal Main's installed Pi instance.
Keep all fixed payload and zero-network assertions. No production loader change.

### PS01 direct unconfigured callout entry

Acceptance: Provider input section2/PS01 and approved prototype. With no Project
or linked session, the visible unconfigured Case Assistant callout offers 配置模型.
Click opens the same global settings panel; closing returns focus to that control.
No test, credential readback to Renderer or task starts from opening. Keep the
existing header and linked-session entries. No new layout or business semantics.
Offline initial actual component rendering must contain an actionable callout;
next packaged native test must click it and prove shared panel/focus ownership.

### PS dedicated stored-configuration host journey

Ordinary Main without activation/env key. Controller passes a key from the already
approved Xiaomi CN entry to dedicated runner stdin only; worker never reads it.
Runner first refuses any preexisting fixed production Keychain slot. It enters
the new key in the actual password field, clicks one fixed probe, then Save.
Only test-owned key may be deleted; cleanup private read compares exact memory
key and preserves any foreign item. No .zcode import in application or runner.

Complete pristine four synthetic Projects plus plan/receipt are copied and hashed
before credential admission. Rehearsal and real run mutate distinct copies.
Installed SDK guard delegates real traffic to original ModelRuntime; no substitute
stream in real mode. It binds fixed probe/three exact disclosures/Case context,
only authorized current-attempt history and read_evidence result. Unauthorized
fetches, endpoint changes, repeated stages and quota overflow fail closed.
Rehearsal uses explicit no-socket fake fetch and is never real proof.

Run cap8 requests:probe1/Case4 (question-Stop, new question-answer-read_evidence-draft)
/helpers3. Probe128 output/30s; tasks2048 output; Case60s/helper30s; whole600s.
Input12000UTF8bytes and16384 conservative reserved input tokens/request. Total
145536 reserved tokens and48000000 Credits conservative cap, zero incremental
purchase/no PAYG. This bounded command is within existing unlimited-total Token
Plan user authority, not a new total subscription ceiling. No retry/JSON repair.
All4 consumers require actual original UI disclosure and explicit Send.
Configured normal LaunchServices/reopen and deletion preserve formal/history;
no claim of MacBook/user acceptance. Raw SDK/UI errors are suppressed; failures
retain fixed phase, class, safe code and runner source line only.

### PS regression adaptation after host020/021

Approved fixed Provider UI removes editable service/model inputs and disables
helper disclosure when unconfigured. U4 now first asserts those facts, zero
disclosures/Attempts/drafts and enabled manual save. A test-only Main settings-read
projection then simulates a previously configured UI; actual Application remains
unconfigured. This allows the original exact disclosure/refusal path and verifies
final send rechecks actual availability before Attempt or transport admission.
All fetch/socket effects are denied; no Keychain/config/runtime is injected.
Preserve long payload, hash, free-text checkbox, refusal/focus, accepted-but-unsent,
blocked Attempt, manual edit and all downstream checks.

Case native initial blocker wording follows current configuration semantics
请检查模型接入配置; disabled Start and the full later journey remain required.
This is test adaptation to approved PS semantics, not a production change or a
waiver of prior requirements.

Host runner Electron callback contract is (ElectronModule, suppliedArgument).
Stage arming must use argument two; passing the module is correctly refused by
the unchanged strict guard. A permanent offline callback-semantic regression
reproduces that diagnostic before correction; next real proof remains host-only.

## Provider Settings canonical compatibility correction (host022)

Acceptance PS-06/07 preserves the historical CLI MiniMax-M3 identity and its closed factory/preflight/no-fallback contract. Only the existing Desktop one-turn assistance factory may use the approved Xiaomi Token Plan CN / mimo-v2.6-pro credential callback; an SDK injection plus credential or a different credential-bound tuple is rejected before credential/SDK use. No new production behavior or contract is required: host022 failed a file-wide historical provider-name scan after the authorized Desktop branch was added. Adapt the source assertion to retain the CLI exclusion outside that named factory, assert the exact private Desktop guard, and exercise both factory boundaries plus source-mutation sensitivity.

Configuration input remains an exact triple of package manifest, TypeScript configuration and config inventory. Keep historical P4/P5/Change002 tuples unchanged; admit one additional exact Provider Settings appendix of ten approved TypeScript files. Missing/reordered/duplicate/extra files, altered compiler options, mixed tuples, dependency changes, and selectors stay rejected. Existing host022 failures are compatibility-oracle failures, not causal product RED. No test retirement or production/build/plan change; successful native/rehearsal/DMG/install evidence remains applicable after byte readback.

## Real stored-config helper correction after plan003

PS-06/07: each approved single-shot helper still sends only its own disclosed payload, exactly once, and returns one untrusted pending draft matching the existing closed Core/App contract. Prompt output must describe the complete envelope, correct action-to-draft kind, all required field types (especially alternative_explanations as nonblank-string array), no extra IDs/authority and no prose/fence wrapper. The actual SDK system instruction will contain three explicit typed response templates plus instructions to select only the requested action, fill from disclosed facts and preserve uncertainty. This changes only the private Pi prompt; parser, schema, retries, tools, model, authorization and adoption remain unchanged. Causal offline test observes the actual installed-Pi outgoing system prompt and validates each template against the existing business validator before delivering a synthetic valid response through the real Profile/Application/SQLite path. Existing invalid-output tests remain.

Actual historical attribution limit: plan003 persisted organize_question Failed/validation_failed with no draft; receipts contain status/fingerprint only, not the rejected model response. Model returned47 output tokens, but exact failed field cannot be recovered. Do not invent those bytes or claim the prompt gap proves the precise historical cause. A second acceptance-evidence gap is runner assertion-before-projection-save and absent safe response-shape metadata. Correct that host-only observer to retain terminal projection and bounded type/key classification (known schema keys only, no model text/secret/raw SDK error) before assertion. Test its no-secret properties.

Continuation plan: new immutable plan004 (or next unused), new package015/internal011 and DMG009 after production prompt change. Four maximum real requests: fixed Reply with OK. probe1, each original helper1. No repeated real Case turn. Copy the complete plan003 adopted synthetic Case as a read-only baseline; bind its result/adoption and exact raw Project snapshot, then prove unchanged projection after ordinary configured launch and delete/reopen. Three helper fixtures remain separate synthetic Projects with exact disclosures. Preexecution snapshot all raw Projects/plan/receipt with byte readback. Bounds:4 requests,0 retries,probe128 output/30s,helpers2048 output/30s,16384 reserved input tokens/request,71808 total reserved tokens,23424000 Credits conservative cap,300s whole run,0 purchase/PAYG. Controller alone performs Keychain/native/real effects after complete synthetic rehearsal and affected/full offline regression. This is a bounded subset of existing unlimited-total TokenPlan authority, no new user gate.

Final private-interface correction: prompt constant remains unexported, as required by original Adapter export-set tests. The host plan reads this fixed literal from source already bound to emitted package bytes; no new runtime seam or public contract. Final artifacts are package016/internal012 and plan005; package015/plan004 retained but unexecuted, superseded after exact-export regression and complete build-resource binding correction. DMG target remains next unused009.

## Candidate JSON mode correction after actual plan005

PS-06/07 input is the unchanged exact candidate disclosure and current private helper system instruction. Only stored-config draft_candidates requests add response_format={type:json_object} through installed Pi0.84.2 onPayload before SDK transport. Probe, Case, organize_question, explain_evidence and historical CLI requests retain their prior wire options. Success still requires the complete single-turn response to pass the unchanged strict envelope and Core field validator; invalid syntax/schema fails without draft, retry, repair, fallback or formal write. No changed public/persistent/authority contract.

Primary Xiaomi Structured Outputs documentation (https://mimo.mi.com/docs/en-US/quick-start/usage-guide/text-generation/structured-output, read 2026-09-30) lists mimo-v2.6-pro and json_object, with full-message parse and separate schema validation. Installed Pi api/openai-completions.js invokes and accepts mutation/replacement from onPayload before chat.completions.create. This establishes local request support; actual Token Plan endpoint acceptance remains an explicit host test, not inferred from the PAYG example. Endpoint/provider/model remain fixed.

Historical plan005 candidate finished stop with2554bytes/574outputtokens and invalidJSON; no raw response was retained, so fenced/prose/syntax subtype remains UNKNOWN. Two other helpers succeeded pending drafts. Add safe classification for future diagnostics only; do not reconstruct old output. Next real continuation is two requests: fixed probe plus candidate. Prior Case and successful helper histories are copied, hashed and reopened without resending.

### Final candidate JSON/Provider Settings result closure

Controller host025 and actual plan006 accepted the candidate-only native json_object request through installed Pi0.84.2 Xiaomi Token Plan CN / mimo-v2.6-pro. Both requests succeeded; all prior Case/helper histories remained exact after configured and deleted reopen. No further product contract/code change. The native format is an output constraint only: original strict envelope/schema validation remains required; no repair/retry/fallback. Full canonical2211PASS/0FAIL/1gateSKIP and signed DMG010 install/normalLaunchServices evidence now close author engineering execution. Composite real proof and residual MacBook acceptance are documented in verification/handoff, not treated as a single eight-request PASS. candidate009 is for fresh independent read-only review, no author acceptance.

## Provider Validator F1–F4 lifecycle correction contract

Controller disposition001 permits private lifecycle hooks/ephemeral epochs only. PS02/03/04/05/07: every Main window close cancels settings proof/probe and all model-work admission/execution owned by its Profile; later activate windows use the same cleanup. Pending prepare/authorization cannot repopulate after close. One-shot close invalidates in-memory previews/accepted authorization, aborts pending starts and Running work, releases private leases, and blocks every later runtime admission. Already committed Attempt is settled interrupted without draft; ordinary local analysis/manual/history behavior is preserved. A fresh window/Project/prepare can proceed after cleanup. No new IPC/persistent schema. Case closeSession invalidates existing and in-flight previews for that session; whole close invalidates all.

F3: capture proof/operation epoch before asynchronous old-Key read, recheck exact proof/generation/key/epoch immediately before store.save. Cancel/close before write means zero writes and old Key retained. Once write issued, inspect actual readback and report committed/unknown outcome honestly; no rollback fiction. F4: keep authentication rejection tied to credential identity independently of latest test error/state. Network/timeout/quota/Keychain failure and refresh cannot clear it. Applicable successful saved-key verification or verified replacement clears only the applicable invalid fact. Previously valid keys remain recoverable after temporary failures. Late task failure must not invalidate a replacement identity.

Tests first reproduce all four reported boundaries, then cover all three helpers/Case, delayed acquire/preflight/admission/prepare, active cancellation/late completion, subsequent window/prepare and private credential release. Native host uses synthetic in-memory credential store/request counters only, no real Provider or user Keychain. Current source changes require package018/DMG011 and current full offline canonical. Historical candidate009/DMG010/real results are immutable; reuse only unchanged Adapter/request semantics with explicit local-lifecycle applicability limits.


### Native lifecycle fixture launch correction after host027

The shipped executable did not dispatch an alternate Main script argument: host027 ran normal Main, and the fixture global was absent before its first invocation. Use the existing installed Electron44.4.3 default-app entry through Playwright1.63.0's default launcher (omit executablePath). Installed Playwright source adds its `-r` loader only on that path; installed Electron default_app parses the script argument and marks process.defaultApp before loading it. These exact local primary sources are retained in R/ps-lifecycle-bootstrap-seam-001.

The test fixture installs the same private-pipe and installed-SDK offline seams, verifies raw ASAR with Electron original-fs and virtual Main bytes with fs, then requires the unchanged packaged Main. Before any lifecycle invocation the native test requires the fixture marker, ready phase, cached Main, expected IPC registrations, exact ASAR/Main hashes, appPath, executable/version and defaultApp state. Missing installed executable or override is refused before any possible module download. No product hook, dependency or packaged source change.

This synthetic test uses the standalone installed Electron executable, with app.isPackaged=false, to exercise the exact production Main/renderer/SDK under controlled boundary delays. It is not normal shipped executable/LaunchServices evidence or a new toolchain deployment claim. The two host027 normal packaged tests passed; full canonical reruns all native tests, and the distinct signed DMG/install/LaunchServices stages still validate normal distribution. No assertion is removed from F1–F4.


### Native lifecycle fixture synchronization (host029)

Smallest fixture contract for F1–F4 / PS-02–06: given the current native window and a held old operation, perform a user window close; wait for that BrowserWindow `closed` and its Playwright Page `close`; only then emit Dock `activate`. Capture the newly created/loaded Page, require a different native window ID, exactly one live native window and the visible model entry. Release the old held operation only after reopen, preserving every late-proof/request/write/Attempt/draft/busy assertion. A missing close/new-window event fails within the explicit event timeout. No sleep, retry activation, production hook, credentials or network is introduced.


Production contracts and package018 unchanged. Test-only native event evidence remains host-pending; see verification.md host028/029 record.


### Host030 synthetic process lifetime boundary
Input: exact package018 Main under installed default Electron with held synthetic work. The test host alone subscribes to window-all-closed to keep that process available for later activate-created windows. This follows installed Electron44.4.3 electron.d.ts: absent subscription quits by default; explicit app.quit still quits. Output: actual native close/destroy/closed and a distinct later window; all F1–F4 late-proof/write/request/lease/commit assertions remain. Failure: missing event, changed package/host identity, early quit, or any existing behavior assertion fails. Forbidden effects: no preventDefault on close/before-quit/will-quit, hidden survivor window, product handler replacement, manual cancellation or production lifetime change. A passive before-quit counter must stay0 throughout window loops so app-level cleanup cannot rescue a broken per-window hook. Explicit app.close teardown remains effective. Test bounded180seconds, synthetic SDK requests capped30, zero network/real Keychain.
Acceptance: F1 later-window cleanup and F2–F4 invalidation within PS-02–06. This is a private test-host boundary, not a new same-process product requirement. The ordinary packaged application retains its existing quit/relaunch behavior; INSTALL-CA-001 app.close/new launch/history and normal LaunchServices remain independent unchanged coverage. Host029 verifies full window close but process shutdown; the earlier stale-page hypothesis was insufficient. No product edit is justified by this evidence.


### Host031 listener premise correction
The fixture records window-all-closed listeners on entry before host subscription, immediately before exact Main require, immediately after require, and at native bootstrap readback. Compare actual callback identities across Main loading, not an assumed count. Record only name, source length and SHA256; no listener source text/closures/credentials. Success requires the fixture keepalive to remain installed and Main to preserve the pre-existing callback list; current readback must preserve that list. Baseline artifacts are written before assertions. No listener is removed/replaced and no explicit Quit is intercepted. All F1–F4 behavior assertions and before-quit=0 remain. Host030 actual other-listener count1 disproves the author's unsupported zero-listener premise; source absence did not prove an empty runtime list. This is a fixture setup failure, not product RED; internal listener ownership remains unattributed until runtime evidence.


### Final lifecycle evidence closure — candidate010
Host031 measured-baseline native passed12 close/new-window transitions, before-quit0, no late work/proof/credential writes and fresh all4 admission; canonical15groups2238PASS/0FAIL/1gateSKIP. Normal packaged process quit/relaunch and LaunchServices independently pass. Package018/DMG011 unchanged after host. The five production lifecycle files and limits of historical real evidence are enumerated in current verification/handoff. The synthetic host lifetime is solely a test seam; no product persistence/UI/public/schema change was made. No new Provider calls. Complete candidate010 is for independent recheck, not author acceptance.
