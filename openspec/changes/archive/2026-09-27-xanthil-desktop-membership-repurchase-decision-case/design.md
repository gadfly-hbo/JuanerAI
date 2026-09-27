# Design: Xanthil Desktop Membership-Repurchase Decision Case

## Candidate002 independent F1/F2 repair

Candidate003 continuation repair (AC-XDESK-009-04): a request retains its
admitted Application identity across every import await. After initial admission,
chooser return, repeated admission, source read, inspection and confirmation,
Main must reject a completed Project switch before the next effect or success
publication. In particular a second admission's await does not preserve the
pre-await identity check. Ready receipt replay also needs the same identity
before returning its old Project projection. A source read already begun is
not claimed undone; its later stale result cannot repopulate Main's selection
cache or publish success. Real A/B Application/SQLite tests control only the
existing native chooser/Profile/source seams and preserve both Project stores.
No new public method, persistent state or concurrency framework is introduced.

AC-XDESK-009-04: Main validates the public envelope, then calls a private
Application import-admission check before a native chooser or source read.
Admission uses the real current Project/Session/Revision, integrity, Draft state
and row version. Re-preview additionally binds the existing inspection token;
confirmation also binds the evaluated configuration and issue decisions. A
chooser's asynchronous return is followed by the same admission check and a
same-Application check before reading. The existing post-read Application
checks remain authoritative against later changes. Cancellation invalidates
Main's old selection and reports CANCELLED; it does not restore an old token.

Ready confirmation replay is not authorized by a Main cache. The Application
reads the current Store-verified immutable confirmed CSV bytes, reproduces the
existing semantic fingerprint, and delegates to the Store's exact committed
receipt. New commands, conflicting payloads, wrong ownership and newly damaged
evidence still reject; native source files are not reread. This adds no public
IPC method, persistent field, receipt type, or source capability. A source read
already completed before a later state change is not claimed never to exist.

AC-XDESK-008-07: the existing four-field failure surface identifies the specific
closed error, states absence of successful confirmation without asserting all
earlier effects were zero, preserves existing evidence and gives a safe explicit
next action. Unsupported storage is not initialized/migrated/overwritten. A
generic FORBIDDEN means a state/source refusal, not an unimplemented capability.
Persisted failed/cancelled Assistance attempts show their actual terminal reason,
no usable successful Draft, retained authority, manual recovery and irreversible
prior transmission; they are not confused with pre-admission provider refusal.
Raw paths, infrastructure errors and unobserved model identity remain hidden.
The same four obligations apply to durable failed/cancelled local Runs: actual
terminal reason, no new acceptable Finding, preserved confirmation/history and
an explicit new Run only after checking the cause. These are the three existing
failure entry points: immediate closed IPC error, persistent Run, persistent
Assistance. Transport uncertainty remains RESULT_PENDING with writes disabled
and reopen/no-resend guidance, never a fabricated failure or success receipt.
The package producer allowlist adds only the actual new correction attempts;
all producer identity, source/result/hash, ASAR and evidence checks stay exact.

## v0.8 current work return and late cancellation cleanup

AC-001-04 navigation uses the current Session projection: an existing Run keeps
the existing return-to-local-processing affordance after its terminal result,
while status remains idle. This closes the observation/click race without a
restart, Session conversion, new selection, or another Run. No-Run/no-Attempt
still has no return target. Rendering this navigation never changes authority.

Normal Main initializes 1366x768 content with useContentSize, inside the accepted
UI viewport contract. This replaces the implicit Electron 800x600 default; it
does not impose minimum native dimensions or change any security preference.
The production-package test reads this initial size before any test resize.

If a Pi SDK factory resolves after its caller was cancelled, the Adapter issues
no prompt or observed identity lookup. It aborts/settles/disposes that late
session within the existing 30-second local cleanup bound; cleanup rejection
is contained because the sanitized cancellation already settled. It cannot
escape as an unhandled rejection, revive the Attempt, or start a retry.

## Current v0.8 additive-export compatibility exception

Engineering Controller impact decision permits exactly two legacy oracle updates for the already-approved U4 additive Runtime, not new public capability: `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.ts` TASK-003 PORT-DEFINITIONS admits the three existing definers plus literal `defineDecisionAssistanceRuntime`; `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts` TASK-010 R3 TEST-XCLI-011 admits `createPiAgentAnalysisRuntime` plus literal `createPiDecisionAssistanceRuntime`. Exact-set checks still reject unknown exports. Original three-Port positive/negative loops and old Pi runtime keys, readiness, zero-prompt/provider/persistence, mutual exclusion and cancellation remain unchanged; TEST-XCLI-022 is unchanged. These are narrow conditional test-path exceptions to the historical read-only compatibility policy, not a blanket baseline rewrite.

Time order remains explicit: Port oracle was edited and CF003 executed before this impact decision; that earlier deviation is retained, not retrospectively authorized. CF001/003 raw failures and preparation002 UNKNOWN metadata remain in the original evidence root. Subsequent regression verifies compatibility without representing oracle correction as product RED.

## Current v0.8 final CF / P5 mapping

Engineering Controller decision: `technical-decision-001/u4-v08-final-root-mapping-decision-001.md` in the original device evidence root. Keep the original 43 TypeScript roots and compiler options. The final appendix follows the original P5 25-path order, omits the nonexistent separate schema file (schema remains inside Store), maps the private analytics process helper to existing `adapters/analytics-duckdb/process.ts`, and appends the existing Main module-format regression after the other 24 mapped roots. Assistance is explicitly included; total 68. No empty modules, dependency, manifest, lock or configuration-inventory changes.

Final compatibility admits only exact P4 or this final P5. Distinct intermediate tuples become negative cases, not additional accepted states. The independent CF root and runner checks retain causal RED then GREEN. The canonical runner restores four Console phases followed by full Desktop unit/contract/integration/E2E, with no phase selector or automatic package build. GUI consumes independently frozen package evidence; normal no-debug/native chooser/user acceptance remain separate. Existing CVR failure/version/no-provider assertions and TEST-XCLI-022 remain, while intermediate-only positive recognition is retired and preserved in prior source snapshots.


## Current v0.8 U4 optional Assistance and final verification

Global UI summaries consume only the current projection. A persisted disclosure means "按逐次披露记录", not proof of transmission; its corresponding Attempt supplies admission/Running/terminal/observed identity. Empty history remains "无". The existing status rail/footer/return control use one read-only summary to distinguish local calculation and each Running Assistance action's existing stage, and switching views never cancels or starts work. Full payload text and confirmation/refusal controls remain reachable at both approved viewports, including longer allowed synthetic context. These are truthful rendering/return-path corrections, not Provider execution evidence or a new layout.

Reopen guard for candidate-only creation: where the current form has no manual
save receipt, all non-candidate route, reason, preference and defer fields remain
their original null values. An adoption receipt cannot authenticate mutations to
those fields. The regression uses actual SQLite mutation then read-only Project
admission and verifies byte-preserving rejection. Same-clock adoption ordering
continues to use receipt ordinals; later explicit saves retain their own exact
fingerprint rather than treating a matching timestamp as authority.

U4 recovery slice (AC-XDESK-008-05): a fresh Application opening a healthy committed Project marks each persisted Running Assistance Attempt Failed/interrupted in one receipt-bearing transaction, with no Runtime resend or Draft. Reopening the terminal Attempt is a read-only no-op. The abandoned executor's late response cannot replace that terminal state. A live Application cannot reconcile its own active Attempt. This extends the already approved private `reconcileInterrupted` target union, not the public request or persistent schema.

U4 aggregate disclosures (AC-XDESK-006-02/03/05): `explain_evidence` requires current Review; `draft_candidates` additionally binds the latest exact accepted Finding. The versioned allowlist contains schema/action labels, method id/version, exact user-authored Case context, and `{artifact_id,metrics}` from the verified committed Finding's deterministic aggregate; the candidate action additionally includes that accepted Finding's identity, judgment, supporting/refuting statements, limitations and evidence references. Metrics retain only revision-local pseudonymous group IDs. No source names, rows, source paths, group map, reports, scripts or Runtime internals are serialized. `aggregate_refs` is exactly the single bound aggregate artifact ID. The full user context requires the second free-text confirmation in both actions. Disclosure refuses stale current references before any Runtime call.

U4 adoption (AC-XDESK-006-07): only explicit disposal may update the matching Case fields, Review explanation, or candidates of the current undisposed Draft form. Candidate adoption creates sequence one only when no form exists; an existing disposed form is immutable and requires the already-approved explicit manual editing entry before a later adoption. Only the candidate array changes: route/preference/other disposition fields and all Finding/Case/Run/acceptance/Closure authority remain unchanged. All new identities remain native `crypto.randomUUID()`. Store admission validates same-owner Succeeded Attempt → matching-kind adopted Draft → canonical successful disposal receipt and exact current adopted content/IDs; a later explicit save retains its exact fingerprint authority. Receipt ordinal, not equal clock timestamps, determines the latest writer. Timestamps are compatibility checks only. The fixed same-user/non-adversarial schema does not authenticate or reconstruct an unpersisted initial random form-ID generation relation, nor full overwritten text history; no derived entity IDs or new lineage layer is introduced.

U3 candidate002 is independently accepted within its scope; its FAIL/repair
history remains intact. U4 activates only the previously approved Assistance
methods and final CF/P5 obligations. Continuous Worker correction replaces the
historical serial dispatch/count text below, not product or safety boundaries.

First vertical specification (AC-XDESK-006-01/04/05/08): given an exact current
owner/version/action/model request, prepare returns canonical whitelisted text,
hash, categories, references, irretractability and unknown cost without invoking
Runtime. A process-local token binds that complete preview to the live input.
Refusal records only immutable disclosure metadata and its command receipt;
it creates no Attempt/Draft/Run and calls no Runtime method. Acceptance containing
user text requires the second confirmation. Changed input/hash/token/owner fails
before writes. Missing Runtime never blocks manual work or fabricates provenance.
The existing real Application/Store and public IPC seams, with only the approved
external Runtime double, provide causal RED/GREEN; no Provider is authorized.
Subsequent verticals retain exact payload admission, one terminal winner,
300-second deadline/retry zero, isolated Draft disposition and explicit manual
fallback. Full current regression and independent validation remain required.

## Current v0.8 U3 acceptance-to-completion package

### Candidate001 independent findings: current bounded repair

The candidate001 FAIL and original evidence remain unchanged. F1–F3 export
corrections preserve both Engineering Controller export decisions: Main claims
the normalized command ID/owner/report intent synchronously before its first
await. An overlapping identical intent returns RESULT_PENDING; a changed intent
returns COMMAND_CONFLICT without chooser or write. A known pre-write refusal or
cancel releases the live claim; post-write uncertainty remains blocked until an
exact committed receipt can be read. No queue, automatic retry or destination
state is introduced.

New-command preflight verifies the committed report's exact owner and current
revision before native selection, including for marked damaged exports. Private
prepare now takes command_id in addition to owner/report/format. Store retains
only a WeakMap binding the issued preparation object to command/owner/report/
format/hash/length. Main passes that same object back with the actual readback
descriptor. Record verifies the issued identity and unchanged bytes, not a
regenerated Review projection. An intervening legitimate Review save therefore
does not erase the successful native effect. Forged/cloned/mutated preparations,
different commands/owners/formats and stale current revisions are refused; exact
committed receipt replay remains independent of an old process's object identity.
This private identity never crosses preload/Renderer or persists in SQLite.

F4 displays committed decision-form dispositions and defer dates in existing
Stage6 history. The editor initializes from the latest persisted date; repeated
defer preserves it, editing changes it and clearing explicitly records null.
Old forms remain visible, immutable and distinct from Closure/completion.

F5 admission restores the narrow explanation invariant: absent a latest matching
evidence-explanation save, sequence-one explanation must be empty and a later
revision must exactly preserve its predecessor's copied explanation. A case-field
save does not authorize a new explanation. Real Review save, nested Draft copy
and later case-field edits remain valid. No new schema or generic lineage system.

Current implementation closes this package through existing Core, Application,
Store, Main and Renderer consumers. Historical U2 exclusions below stay bound
to U2 candidate002, not the now-authorized U3 result. No U4 capability is active.

### Closed U3 operations and authority

- `acceptFinding` appends an exact same-owner Finding acceptance and receipt;
  it does not complete a Case. Application alone supplies the UUID, timestamp
  and canonical request fingerprint, excluding generated metadata/command ID.
- `saveForm(evidence_explanation)` is Review-only. Completed case/evidence
  edits are refused with no row-version or receipt change. A new Draft copies
  user text as editable context, but never old computation authority.
- Decision-form draft may be incomplete; saved candidate comparison requires
  at least two distinct stable UUIDv4 candidates and all five meaningful texts.
  An optional preferred candidate needs a reason. The insufficient-evidence
  route requires a reason and no preferred candidate. Decline/defer/more-evidence
  preserve Review and do not create acceptance, Closure or final report.
- Completed can prepare a new decision form only when a same-owner exact
  acceptance has no Closure. Existing current authority remains the old closure;
  therefore `current_acceptance_id` is not used to suppress the new acceptance.
  Existing Closure-referenced forms and final bytes are never edited. Store
  checks ownership/version and this predicate again inside its transaction.
- `completeCase` requires the exact acceptance plus latest saved valid form.
  It independently verifies fixed committed Run/source/method/code artifacts,
  produces the final pair exclusively in staging, fsyncs, refuses an existing
  final target (even empty), publishes, then commits Closure/report/pointers/
  receipt/Completed once. Lost COMMIT resolves only its exact receipt on a new
  connection; unreadable outcome blocks resend. Precommit orphan files remain
  unadopted. Completed rerun failure or pending new Finding does not demote old
  accepted authority; a later explicit acceptance and completion creates history.

### Private report preparation and two-format native export

`readReportContext` reads only committed same-owner fixed allowlisted artifacts
and returns the closed Port material (manifest, contract/binding/IR text and
primary SQL/Python code text), after containment/shape/length/hash verification.
It does not run code, use current tools, scan orphans, or expose original CSV,
IDs, group names or absolute source paths to Renderer.

Engineering Controller decisions `u3-v08-export-contract-decision-001` and
`u3-v08-export-projection-clarification-001` bind this unreleased 0.1.0 contract.
The twenty public requests remain unchanged. Same `exportReport` uses native
destination selection for `.md` or `.html`; its closed output is either
`{status:"written",report_id,file_name,media_type,sha256,byte_length}` with
`text/markdown;charset=utf-8` or `text/html;charset=utf-8`, or exactly
`{status:"already_recorded",report_id}`. The latter reports an old successful
receipt, never that an external file currently exists. Receipt preflight occurs
before native selection/write. Changing owner/report/operation conflicts;
direct record with another descriptor also conflicts.

Healthy final export returns verified immutable stored bytes. Review or damaged
report export is a one-shot frozen read projection: verified source content and
clearly distinguished readable business facts, with UNACCEPTED / INTEGRITY_BLOCKED
and explicit omission of corrupt bytes. Prepared export hash is not falsely
called the immutable source report hash. Main writes exclusively, fsyncs and
independently reads exact selected bytes before receipt recording. No destination
path persists. Failed/unknown write/readback retains actual bytes and no success
receipt; the live Main attempt blocks automatic resend. No cleanup or silent
replacement is performed. Reopen cannot assert external target existence.

### Current GUI and C3 coverage

The existing six-stage UI now supplies manual interpretation, explicit acceptance,
two decision routes, four non-closure actions and separate completion/export.
Report business content uses native headings/tables; verified technical text is
secondary. One native report-history select defaults to actual current report,
renders one version at a time, and preserves four unique allowlisted fragment
targets with keyboard focus. Selecting old report content never writes state.
Formation-time labels remain distinct from live acceptance/closure/export facts.

C3 retains the exact C2 TypeScript file list/options and dependency assets. It
expands canonical execution to all current IPC/Store tests and explicit current
U1/U2/U3 Application selections. Three Assistance-bearing Application tests stay
pending U4 (not waived); final CF/P5 and human native/no-debug acceptance remain.
Ordinary capture uses non-overwriting inputs, actual argv/cwd/env and complete
native/stdout/stderr/numeric child exit. A returned outer capture is not a child
health PASS; dependent builds require explicit successful child completion.

The scoped U2 candidate002 is independently accepted. Its historical exclusions
below describe that candidate, not the current U3.1–U3.3 engineering package.
Existing public requests, the sixteen-table schema, Run3.0 and product/UI
requirements remain unchanged. U4, final user acceptance and Git delivery are
not activated here.

The first vertical loop consumes an exact same-owner committed Finding through
acceptFinding. Application supplies a generated acceptance UUID, canonical
business-request fingerprint and clock timestamp to its private Store method.
Store independently validates them, current revision/version and physical
integrity, then appends one acceptance and command receipt in one transaction.
Acceptance preserves Review and the draft report; it never creates a closure,
final report or Completed state (AC-XDESK-007-01/05). Same-command replay returns
the original acceptance even though newly generated metadata differs. Foreign,
stale, missing-Finding and conflicting commands cannot write. Lost COMMIT uses
the existing exact fresh-connection receipt resolution, not a retry.

Subsequent loops activate the already-approved manual evidence/decision forms,
explicit completeCase, immutable final report and native export. Saving a valid
route remains separate from acceptance and completion. Non-closure actions name
their object: not adopting this candidate, deferring the decision, or requesting
more evidence. Current-only writes and historical read-only navigation remain
enforced; Completed reruns cannot downgrade existing accepted authority.

## Current v0.8 U2 data-to-Finding package

### Candidate001 independent-review repair: F1–F5

SQLite/schema/ownership admission remains fail-closed. Damage confined to an
already referenced immutable source/report/Run preserves the damaged bytes and
readable committed history. A current, non-Running revision with intact Session
directories can create one clean Draft; none of its old snapshot, confirmation,
Finding, acceptance, report or output pointers are inherited. Stale/foreign
commands cannot use this recovery permission. Invalid database structure is not
recoverable through this operation and no file is scanned, adopted or repaired.

Existing readProjection may select a committed revision in the same Project /
Session / Case chain; session.current_revision_id still names the actual current
revision. Historical projections have every capability false and reads never
write integrity receipts. All current-only mutations enforce that pointer at
Application and Store boundaries. Renderer follows previous_revision_id and can
return directly to current; it does not create a second revision axis.

The Run file Store exclusively writes each result but leaves initial run.json
bytes unchanged. Same-live-Store progress descriptors are ephemeral; every next
operation rechecks actual files, hashes, lengths, ordering and the original
physical manifest hash. A new Store/process cannot resume that ephemeral state.
The existing private in_progress_manifest_sha256 is the original physical hash,
not a hash of unpublished progress. Only one final succeeded/failed/cancelled
manifest can replace initial run.json. Prefix failure, deadline, cancellation,
lost COMMIT and terminal immutability retain their existing obligations.

The Controller's evidence-review contract decision001 authorizes one required
reports[].review_content field: null, or exactly {markdown_text, evidence}.
Each evidence element is exactly {evidence_ref, title, media_type, content};
media_type is text/plain or application/json. Only same-owner committed Run
duckdb-result, python-result, run-summary and run-evidence may appear, in that
order, after containment/hash/byte-length/Run validation. No source CSV, raw
identity/group or absolute path is forwarded. Invalid report/Run references
produce null rather than regenerated or unverified body content. Existing
twenty methods, request shapes, schema and Run3.0 remain unchanged.

Generated Markdown/HTML and summary/evidence carry actual context, source hashes,
method/version/code identity, exact metrics and scoped back-links. Renderer uses
plain React text and native details for technical blocks, never HTML execution.
Primary Finding tables show both periods, denominators/units, exact differences,
M2 applicability/contributions and understandable limits; technical JSON is
secondary. Four ordinary #evidence-<run_id>-<artifact_id> fragment targets focus
and expand only their verified read-only content. No new protocol or dependency.

### Current I2/A2 and C2 closure

The active Application factory has exactly store, analysisExecution,
runEvidenceStore, clock and deadlineScheduler. The analytic Port has exactly
describeImplementation/calculate/verify; the independent file authority has
beginRun/recordDuckDbResult/recordPythonResult/succeedRun/failRun/cancelRun/
readTerminalRun. No Assistance dependency or inactive fallback is constructed.
Normal Profile receives the Main-owned packaged toolchainDeployment descriptor
path and validates its closed contents, absolute executables and actual versions.
An unavailable descriptor disables analysis before admission, not manual Session
work. No PATH search or replacement install is permitted.

Application owns canonical request identity, fresh IDs/times, confirmation,
execution and deadline scheduling. SQLite remains the sole committed Finding
authority; immutable Run3.0 terminal evidence is a distinct publication point.
Only genuinely matching independent results may publish Review, aggregate,
Finding and draft report together. Cancel/timeout/interruption/retry and lost
COMMIT preserve original terminal/history authority; no orphan success adoption.
Existing A2 database admission checks canonical semantic JSON, method/result
provenance, exact receipt/version/owner relations and supported row tuples before
writable opening. Physical reference damage remains visible history with one
integrity-blocked receipt; it is never silently repaired. Case fields remain
editable only in Draft/Ready and not during Running.

C2 extends the actual C1 appendix by four exact consumer paths, in order:
packages/product-core/xanthil-desktop-decision-case.ts,
adapters/analytics-duckdb/process.ts,
adapters/analytics-duckdb/xanthil-desktop-decision-case.ts,
tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts.
The Desktop-private process helper reuses the bounded spawn pattern but adds
stdin and confirmed child reaping; old CLI helper behavior is unchanged. It is
not a new public process framework. The full DDL stays inside the existing Store,
with no empty schema module. C2 retains all C1 checks, adds active U2 selections,
full Core units and applicable analytic contracts. U3/U4-only tests remain
retained for their real consumers, not silently retired or counted as passed.
Strict compiler options, dependencies and final CF/P5 obligations do not change.

Real packaged GUI covers explicit choices/consents, invalidation, confirmation,
local dual execution, unaccepted Finding and committed restart/new-Draft history.
Native chooser is a test-side dialog boundary; final normal no-debug/manual
chooser and user Product Acceptance remain separate obligations.

### Configuration-bound import preview (Controller decision 001)

The same `selectImportFiles` keeps its initial `CV & RevisionGuard` chooser
request and adds exactly `CV & RevisionGuard & {inspection_token,configuration}`
for re-preview. `configuration` is exactly column_mapping, comparison_period,
current_period, currency, time_zone, valid_statuses and selected_group_mode from
ConfirmationInput, with no consent, row/count or path payload. Main reuses its
latest token-bound capability pair and re-reads the bytes, not another chooser.
Private `inspectImportFiles` receives the same request plus `source_files` only.

ImportInspection additionally returns `evaluation`, exactly `{status:"unconfigured"}`
after initial selection, or `{status:"evaluated",configuration}` after a valid
re-preview. Unconfigured metadata is not zero-issue approval and cannot confirm.
Before mapping, period minimum/maximum are explicitly null and observed/selected
statuses are empty under the unconfigured discriminator, not asserted zero issues.
Column candidates are the actual source headers, never guessed selections. A
null required mapping is allowed as an incomplete UI selection but rejected by
the evaluated business preview; optional group remains null for mode none.
Each evaluated token binds owner/row-version/source bytes/configuration/counts;
latest replaces previous, and confirmation re-reads bytes and checks every
selection/treatment/count before its immutable publication. Bad/stale/foreign
tokens never revive a prior consent. Renderer invalidates issue/plan consent on
selection change. No extra method, persistent entity, schema or data egress.

The Engineering Controller authorized U2.1–U2.4 as one existing-scope result.
The first pure Core seam `parseDesktopCsv(Uint8Array)` returns exact headers and
rows or sanitized VALIDATION_FAILED, without mutation/I/O. It accepts the
REQ004 UTF-8/BOM/RFC4180/LF-or-CRLF contract and never trims, folds or numerically
converts IDs/statuses. This real consumer activates the existing planned Core
path; it is not an empty module to satisfy a layout list. Subsequent business
validation, snapshot confirmation, independent calculations and two-point
publication retain the frozen product/schema contract. No U3/U4 activation.

Original U1 owner-crash tests directly compose real Application/Store; actual
Profile entry is separately evidenced by independent Profile probes and the
real packaged GUI. Current U1 PASS is scoped automated U1/C1, not manual/final
Product Acceptance. Its prior FAIL/UNKNOWN and build/preimage limitations remain.

## Current U1.2 continuous-engineering repair (v0.8)

### Current complete-U1 C1 checkpoint (Engineering Controller decision)

The current C1 graph explicitly includes the 19 actual U1 Desktop paths, in the
same order as the historical C1 appendix minus two never-created layout-only
files: `packages/product-core/xanthil-desktop-decision-case.ts` and
`adapters/storage-local/xanthil-desktop-schema.ts`. Approved business validation
is in Application/public request contracts and the full approved DDL is private
to the existing Store. Do not create empty modules or split DDL without a real
consumer merely to satisfy that superseded path layout. This mapping changes no
Requirement, persistent schema or dependency. Original 43 TypeScript entries,
strict options, exact manifest/build/lock and final-P5 obligations remain.

The fixed offline runner now retains all prior phases and explicitly selects
coverage-map, current IPC/B1/U1, Store U1, Application U1 and native U1.5 storage
reopening; it contains no phase selector, future Run or GUI success claim.
Independent TEST-XCLI-021 and runner literals verify this actual C1 identity,
ordered path/command closure, missing/extra/mixed negatives and stop-on-failure.
Native U1.5 tests kill only their own real SQLite/Session writer at proved
boundaries and retain uncommitted directories, then exercise real Profile
reopening. Existing healthy behavior can be baseline GREEN; it is not fabricated
RED. Final normal no-debug/native chooser acceptance and final CF/full-P5 remain
separate unmet obligations. C1 does not expose U2 functionality.

### U1 review F1: non-empty alternative-explanation members

AC-XDESK-003-01 preserves `[]` and exact meaningful string content/order. A member
must contain a character outside Unicode `White_Space`; this is a predicate,
not trimming, filtering or an additional invisible-character prohibition.
The existing public case-fields validator is called independently by Application
and Store before create/save effects. Invalid requests use its existing
`INVALID_REQUEST` contract. Sixteen-table reopening rejects malformed stored
members as `INTEGRITY_BLOCKED` before writable admission, leaving bytes intact;
no DDL change, migration or repair receipt is introduced. Renderer preserves
multiline input, identifies blank items accessibly and prevents submission until
the user corrects them or explicitly clears the collection. Historic candidate001
accepted these invalid values; its failure remains, not retrospectively PASS.

### v0.8 U1 Session result (U1.3 + U1.4 + real package)

After candidate003 independent U1.2 PASS, the Engineering Controller sized one
usable Session result: create/list/open/read, case_fields save/wait, and the same
packaged Renderer. The Controller first asked to defer openSession by the old
M1.3/M1.4 table, then corrected that engineering split under adopted v0.8. The
intermediate removal/reintroduction and actual evidence remain historical; no
product permission, test assertion or resource budget was reset. This current
section supersedes the micro-stage activation rows below only for this U1 result.
No new public
method, schema, model or Run capability is introduced. The existing Store private
createSession input is closed as command + four proposed IDs + created_at +
input_fingerprint; Application owns UUIDv4 generation, clock and canonical
operation_kind/business-request hash. The request omits command_id/generated
IDs/time, trims the two names and preserves all case fields and array order.
Store independently validates the closed input and fingerprint.

Success is the committed projection, not a synthetic committed flag. Stage the
three empty directories, fsync them and their parents, refuse every existing
final target (including empty directory/symlink), then rename with no await
between final lstat and rename under the approved sole-writer boundary. This
does not claim an adversarial OS no-replace primitive. One BEGIN IMMEDIATE
inserts Session, sequence1 Draft and receipt; precommit failure leaves no row
and retains isolated/orphan directories. Lost COMMIT reads the same receipt on
a new connection; unreadable state blocks resend until healthy Project reopen.
List/open use committed rows, never directory discovery or orphan cleanup.

U1 admission reads the complete schema and all sixteen tables, accepts M1.2
unchanged plus only initial professional Session/Case/Draft and matching
create_session, case_fields save_form and mark_integrity_blocked receipts. Row
versions match the exact supported save/mark count and current request provenance;
later states or unrelated business rows remain FORBIDDEN before writable admission. Existing
U1.2 earlier-build refusal evidence stays frozen; current tests evolve to the
next U2 boundary rather than falsely requiring the now-current tuple refused.
No future import/Run/Assistance capability is exposed by projections.

Private saveForm takes command/completed_at/input_fingerprint. Application owns
the canonical ordered case-fields request, excluding command ID/time; Store
validates independently. One SQLite transaction guards owner/current row_version,
updates the same Draft and writes its command receipt. Duplicate same command
returns current committed projection; a changed fingerprint conflicts. Lost
COMMIT uses a new read connection, otherwise RESULT_PENDING blocks all resend
until explicit healthy Project reopen. waitForProjection is a single committed
owner/receipt-token read, never polling or an automatic retry. Directory damage
preserves fields/history; Application explicitly records one integrity transition
and capabilities disable writes. No new revision, migration or Run is created.

Renderer uses the existing public API, explicit labels and truthful local status.
Create/save freeze the submitted request; pending outcomes disable create/save
and require Project reopen. Quick remains effect-free Preview; six professional
stages, keyboard and runtime security remain. Existing native-dialog automation
argument was ignored by Main: the test harness now supplies a synthetic directory
only at Electron dialog.showOpenDialog in the test process, leaving production
Main/preload/Profile/Store unchanged. This proves subsequent real persistence,
not manual chooser operation. Normal no-debug/native/manual final acceptance
remains outstanding. Prior packages and failed results remain independently
addressable before rebuild; current app.asar emitted Main/preload/Renderer,
configuration and four package files bind the actual GUI execution.

### Independent review repair / internal initialization decision

Candidate002's independent recheck confirmed the original seven counterexamples
repaired but found three collateral gaps. Same-contract restoration pairs
Assistance actual_provider/actual_model nullness across all four statuses,
checks every business-date spelling against actual Gregorian normalization,
and reads all sixteen tables plus FK diagnostics in SQLite integer-safe bigint
mode before classifying later tuples. Calendar tests include non-leap/century/
month-length and timestamp-form negatives and valid leap/adjacent controls;
integer tests retain FORBIDDEN for valid later signed-int64 values rather than
relabeling them integrity damage. These are no schema-version/migration or
future business-writer permissions; prior incompatible synthetic files remain.
The same-root nullable-route review follows AC-XDESK-007-02/04/05 and structure
section13: draft/not_adopted/deferred/more_evidence are non-closure dispositions
and allow NULL route with existing candidate content preserved; saved does not.
Explicit NULL-safe DDL branches enforce this without relying on SQL UNKNOWN.
This does not implement U3 or relax later Application acceptance/completion guards.

Candidate001's 26 checks and historical UNKNOWN remain; independent review
found F1–F7, so that candidate is not accepted. The Engineering Controller
approved the following minimal INTERNAL Port amendment for this same U1.2:
Application -> Store `openProject` has exactly `contract_version`, `command_id`,
`proposed_project_id`, `display_name`, `initialized_at`, `input_fingerprint`.
Application/Profile/Main external requests and factory dependencies are unchanged.
Application validates lowercase UUIDv4 command/proposed Project identities,
trims the nonempty display name and supplies its injected clock's canonical UTC
millisecond timestamp. Fingerprint is lowercase SHA-256 of UTF-8 canonical JSON:
`{"operation_kind":"initialize_project","request":{"contract_version":"1.0","display_name":"<normalized name>"}}`.
No command ID, proposed generated ID or timestamp participates. Store independently
validates the closed six-field envelope, canonical IDs/timestamp and fingerprint;
first Project.created_at and receipt.completed_at use that supplied timestamp.
Reopen validates input but retains stored Project identity/name and adds no receipt.

No absent database may adopt any pre-existing WAL, SHM or journal, including
symlink/irregular entries. Complete read-only admission reads all sixteen tables;
M1.2 allows exactly one valid initialized Project and its matching initialization
receipt, and no business-child rows. Later rows/operation kinds are FORBIDDEN;
damaged initialized identities, provenance or result/owner references are
INTEGRITY_BLOCKED. Native SQLITE_BUSY/LOCKED is STORE_BUSY, without waiting/retry,
including native recovery. All of this precedes ordinary writable admission.

DDL restoration keeps the same full schema/version, not a migration: group-map
column permits NULL or a JSON object; Failed/Cancelled require nonnull enumerated
reasons; period CHECK rejects invalid/equal-length-overlapping dates; noninitial
receipts require complete owner suffixes. Cross-row mapped/none consistency is
not a SQLite CHECK and introduces no trigger: the future U2 same-transaction
Application/Store write path must enforce it before adoption. Current M1.2
refuses all such later rows. Tests pair valid none/NULL and mapped/object rows,
and distinguish this semantic obligation from SQL-enforceable constraints.
Existing incompatible synthetic databases are rejected without rewrite/deletion.
Only the implemented DecisionCase Store factory is exported at M1.2; the later
Run factory is absent until its own causal behavior loop, not a throwing stub.

The adopted v0.8 policy and explicit execution resumption replace historical
serial dispatch/count-only stops below, not their evidence or product meaning.
This result-sized repair uses the existing public Store open/list, Application,
Profile and IPC seams. No schema, product/UI or dependency change is selected.

AC-XDESK-011-06 / structure-decision Database runtime is the minimal contract:
an existing selected Project must pass contained regular-file/header/sidecar
checks before SQLite, exact read-only schema/integrity inspection, and a fresh
identity/inspection recheck before business writes. Unsupported inputs produce
SCHEMA_UNSUPPORTED without mutation; recognized integrity/recovery failures
produce INTEGRITY_BLOCKED. Only a recognized product rollback-journal candidate
may enter native recovery, then the same read-only preflight. No repair SQL,
schema adoption, migration, scanning, external effects or fallback is allowed.
Successful M1.2 opens retain their real Project and empty Session projection;
later valid Session tuples remain FORBIDDEN until their own approved loop.
Fresh database identity, exact schema, Project row and initialization receipt
commit together; an initialization fault rolls back all of them. Containment
checks precede even child-directory creation, so a symlink cannot redirect
preparation outside the selected Project.

Tests first correct the byte-container and missing same-owner FK expectations
against the already frozen contracts, then establish causal RED through the
real Store for rejected header/sidecar/schema inputs and prohibited writes.
The crash fixture must prove uncommitted pages reached disk and a real hot
journal before testing native rollback; journal absence is not itself required
when SQLite has invalidated it. Historical hotness remains UNKNOWN. New evidence
uses fresh non-overwriting inputs/full outputs/numeric exits in the existing
root. Affected GREEN and type/regression checks follow the implementation;
none of these author checks substitute for independent final validation.

## Status

- Design state: X_B2_EVIDENCE_CONTEXT_SPEC_AUTHOR_COMPLETE_001; the bounded
  one-attempt X evidence-context contract is complete; independent affected-
  delta ponytail review and Spec Gate remain pending
- Product/UI decisions: frozen
- Dependency/structure decisions: 12 of 12 approved and mapped
- P4: PASS retained; successful dependency/tool operations are not replayed
- Next action: independent affected-delta ponytail review and Spec Gate; no new
  X validation before actual PASS
- Current stop, retained without reinterpretation:
  FINAL_REGRESSION_FAIL / TEST_ENVIRONMENT_CONTRACT_BLOCKED; the prior GUI,
  regression and package evidence is not relabeled, and acceptance remains open
- Route record: configured Spec role `gpt-5.6-sol`; requested R2 `xhigh`.
  Dispatch metadata does not make the effective model/reasoning independently
  observable to this role, so no stronger runtime claim is made.

## Active X B2 evidence-context correction

The user's directed 2026-09-26 authorization creates one transport-only
exception: `X-U1.1-FIRST-PACKAGE/evidence-context-001` adds command-local
`JUANERAI_TEST_EVIDENCE_DIR`, byte-equal to its own absolute attempt directory,
to the unchanged ten-field environment. This alone supersedes the old
ten-B2-ID and generic attempt-name limits. `test-plan.md` owns the exact
envelope, evidence and stop rules; no other command, runner, Test, fixture,
product behavior or acceptance meaning changes.

The old X adapters remain immutable. After affected Spec Gate PASS, formal Test
may create only the evidence-local freeze/preflight source and the attempt-local
capture helper/outer adapter named in `path-contract.md`. Controller freezes and
statically reviews their identities before use. They prepare and transport the
same one command; they are not a tracked Test change or new capture mechanism.

Historical attempts, failures and consumed 1/1 budgets remain immutable. The
new validation is 0/1 until `/bin/sh` launches and 1/1 thereafter even if it
fails. Failure preserves evidence and stops; PASS satisfies no later Gate.

## Active U1.1 GUI behavior Gate resumption

The user's explicit 2026-09-26 authorization resumes only the original U1.1
ordinary GUI behavior Gate. The product objective, accepted UI, 91 AC,
twenty-method IPC surface, dependencies, data/security boundaries and old
budgets remain frozen. The exact clickable UI Contract is
`docs/planning/2026-09-18/clickable-ui-contract-v1.1/` at sorted-manifest
SHA-256 `39964927d40f756e93bafc8ae8bedd93482a40778316cc22aaad6b2ebad10a67`;
the user UI Gate remains PASS in the 17633-byte execution package at SHA-256
`72504be4fe0b6c32cf120a62ac43a0b41d2125f6c2bebc8ef86a90dd6204fb92`.
This delta's delivery and learning objective is only to classify the seven
already-authored initial GUI leaves against the current healthy package as
leaf-specific causal RED or baseline GREEN, never to reinterpret a health
failure as product behavior.

The current package oracle is
`technical-decision-001/incremental-contract-execution-001/U1.1/B-PACKAGE-MAIN-MODULE-FORMAT-U1.1/first/package-readback-001.json`
(3583 bytes / SHA-256
`4a11c9ad7170808daee0cbd34538cdb7f1187559df4bf3a0931e7b54103f702f`).
The focused contract GREEN and
`G-MAIN-MODULE-FORMAT-STARTUP-U1.1/first` synthetic startup PASS recorded in
the 3787-byte receipt at SHA-256
`4481fece7bade6c902d68dda4362645c6a67a7d59fe19ff6d3d5c6e58c306dfe`
are prerequisites only. They do not prove ordinary GUI behavior and are not
rerun, renamed or substituted for any old H-GUI/B2 result.

The H-GUI, AC-XDESK-012-04, GUI-RUNTIME-SAFETY and five
AC-XDESK-001-01..05 bodies/support/mapping already exist. After affected Spec
Gate PASS, formal Test makes no tracked Test edit: this supersedes the earlier
fresh-GUI-Test authoring wording, and Test binds
`R-GUI-RUNTIME-AC012-04-U1.1/first`,
`R-GUI-RUNTIME-SAFETY-U1.1/first` and
`R-GUI-001-01-U1.1/first` through `R-GUI-001-05-U1.1/first` to the current
readback under their existing exact argv, cwd, twelve-field clean environment,
180000 ms capture, synthetic data, leaf assertions and non-overwriting evidence
IDs. Admission shared Test correction 2/2 and B2 Test-content 2/2 remain
exhausted; the later historical `0/2 at entry` wording is not a present pool.
A Test/control/capture/identity/cleanup defect is INVALID/TEST_CONFLICT and
stops without Test repair or another app start.

The two safety leaves are classified first. Any safety RED requires
Controller-recorded scoped TDD_READY before a safety Worker, followed by the
existing distinct safety regression, typecheck, new package/readback, H-GUI
control and same-leaf GREEN/baseline-regression chain. Only safety GREEN admits
the five visible leaves in numeric order. Their failed union alone may receive
a separate visible-UI TDD_READY and Worker, followed by the distinct B2
regression, typecheck, new package/readback, H-GUI control, runtime regression
and five-leaf GREEN/baseline-regression chain. If no leaf is RED, no GUI Worker
or replacement package runs. All seven leaves must be GREEN against one
unchanged checkpoint before the existing six final B1/IPC/B2 regressions and
`X-U1.1-FIRST-PACKAGE`; Test Asset Retirement, normal no-debug acceptance,
independent Validator and final acceptance remain later Gates.

No dependency/install, Provider/data access, active business route, product/UI/
Requirement/IPC/schema/Runtime change, migration, diagnostic/probe, unlisted app
restart, Git, board, archive or release is authorized. Failure preserves package,
source and evidence and stops without retry, overwrite, relabel or fallback.
This Spec return claims neither ponytail PASS nor affected Spec Gate PASS.

## Active packaged Main module-format repair

The user's targeted 2026-09-25 authorization releases only a cause-specific
repair for the packaged Main entry. It does not revise the accepted UI,
business behavior, any Requirement or any of the 91 AC. In particular, the
existing obligations in AC-XDESK-001-01 and AC-XDESK-012-03/-04 remain the
acceptance owners; this section closes only a prerequisite needed for the real
packaged entry to reach their already-approved public seam.
For this repair only, this section supersedes later historical/retained wording
that forbids the exact focused Test, Main config/manifest paths, package or
startup identities named here; no other prior scope or budget is reopened.

The exact frozen UI input remains
`docs/planning/2026-09-18/clickable-ui-contract-v1.1/`, whose sorted per-file
manifest re-reads as SHA-256
`39964927d40f756e93bafc8ae8bedd93482a40778316cc22aaad6b2ebad10a67`.
The user UI Gate remains PASS in
`docs/planning/2026-09-19/xanthil-desktop-first-product-change-execution-package-v1.0.md`
(17633 bytes, SHA-256
`72504be4fe0b6c32cf120a62ac43a0b41d2125f6c2bebc8ef86a90dd6204fb92`).
This repair neither revises nor contradicts that UI Contract.

The frozen diagnostic input is
`technical-decision-001/gui-startup-state-probes-001/modal-content-observation-003/controller-receipt-001.md`
(5429 bytes, SHA-256
`e0b5c637a3a652b1d5eb6a788722b577ee337d7eadce43463c5cfdba2d697ab1`).
It records one exact packaged executable at SHA-256
`52591945c62a357a093d45bab2a13ef95636e5e16c40ea960e428123ce58365e`,
one `app.asar` at SHA-256
`940ca2f2384c4f3a4b127716b2205766eea8602e67076d81e9e93361244a4efe`,
and the human-visible native exception `ReferenceError: exports is not defined
in ES module scope` at packaged `.vite/build/main.js:1:23`. The matching
4199-byte package readback is SHA-256
`f883fd1b1cb205b2ce2bff7addeeb3a8f2c147ae75aedaadb26b9ba38bec7c97`;
it freezes the 3433-byte Main entry at SHA-256
`6ab8609059efd78850e7c7a5d3c62b19c3755ac2d1c5f04336895277a35c2c1a`.
That entry begins with a CommonJS `exports` use while the packaged descriptor
declares `type: module` and resolves `main` to `.vite/build/main.js`. These
facts identify the immediate mechanism but remain diagnostic-only until the
formal Test establishes the causal RED below.

### Objective and non-goals

The product objective remains the accepted Xanthil Desktop first slice. The
delivery objective is only that the real packaged executable resolve the Main
entry named by its own packaged descriptor and load that entry without a
module-format exception, far enough for the unchanged `U1.1 H-GUI-CONTROL`
leaf to observe exactly one first local window and `#root`. The learning
objective is to distinguish this descriptor/emitted-entry incompatibility from
package-identity, harness, fixture, negative-control or later GUI failures.

Non-goals are Main business/lifecycle/source changes, preload or Renderer
changes, any IPC/public-contract change, a dependency or lock change, another
package, a second app or fallback entry, an old-state migration, real data,
Provider/model access, UI/91-AC acceptance, release/signing/deployment, Git,
board work or repair of any later failure exposed after module loading.

### Packaging invariant and implementation freedom

The packaged descriptor and the emitted file it names form one closed Main
startup contract:

1. the descriptor resolves exactly one local Main entry inside the package;
2. that entry's emitted module format is loadable under the descriptor's actual
   module interpretation by the packaged Electron Main process;
3. no alternate entry, loader shim, fallback, dev server or second package is
   selected when the first entry fails; and
4. the unchanged Main source, preload, Renderer, security options, local-path
   behavior and public IPC surface remain byte-for-byte outside this repair.

The Worker may satisfy this invariant by the minimum compatible output/entry
configuration within the two allowed paths in `path-contract.md`. The design
does not prescribe an output extension or bundler-format setting when more than
one safe implementation can meet the invariant. The root `type: module` rule,
all package scripts and metadata other than a conditionally necessary `main`
value, every dependency/version/source and `package-lock.json` are frozen. The
fresh packaged descriptor/readback and real startup result, not a source-string
scan or configuration-name assertion, decide compatibility.

### Test-first evidence and failure semantics

After complete-package ponytail review and affected Spec Gate PASS, one formal
Test role adds the future package-producer tuple and one focused permanent
contract test authorized in `path-contract.md`. That test reads, never mutates,
the frozen 1349-byte root/package descriptor (SHA-256
`61a57aa2c5afabdc57e7ace59534dd41122e25fd5ba3f6388be4c6d7bcec3971`),
the frozen 3433-byte emitted Main entry, the 4199-byte package readback and the
frozen package identity. It may reuse the existing read-only
`readFrozenProductionPackageIdentity` and
`assertFrozenProductionPackageIdentity` helpers for readback/source evidence
and the fresh on-disk four-file identity check, or perform the smaller
equivalent read itself. It must still check the actual descriptor and Main
bytes. It reproduces
the descriptor/entry pair in an isolated ephemeral loader directory and
executes the exact Main bytes with the real Node module loader under the
descriptor's real module rule and the minimum closed synthetic Electron
boundary needed to prove full Main load. The exact stub mechanism is a Test
implementation choice. It does not launch Electron, import product source,
scan source text or treat the native popup as an assertion.

The test first proves a known-compatible descriptor/entry specimen reaches its
closed boundary, then proves a deliberately mismatched specimen is rejected
with `ReferenceError: exports is not defined in ES module scope`. It finally
expects the real frozen descriptor/entry pair to reach the same boundary. A
valid `R-MAIN-MODULE-FORMAT-CONTRACT-U1.1/first` RED therefore has healthy
positive and negative controls, exact input/readback hashes, selected/executed/
PASS/fail 1/1/0/1 and the exact module-format exception from the actual frozen
Main bytes. Any control, input, loader, cleanup or different-cause failure is
`TEST_CONFLICT / INVALID_RED`, not RED and not Worker authority. The prior
human screenshot remains diagnostic corroboration only; no native popup,
package run or synthetic app start is consumed by RED.

Only a valid Controller-recorded causal RED may produce scoped `TDD_READY` for
one Worker. The Worker does not run a package, app or test. After exact-diff
review, the Controller may release at most one non-overwriting package command,
`B-PACKAGE-MAIN-MODULE-FORMAT-U1.1/first`. The new readback must freshly bind
the package command/result, four-file package identity, packaged descriptor,
its declared/resolved Main entry and the entry bytes actually placed in the
package. Reuse of an old descriptor, entry hash or readback is invalid.

The focused contract test then runs once against that fresh pair as
`G-MAIN-MODULE-FORMAT-CONTRACT-U1.1/first`; it must report 1/1/1/0 with both
controls healthy and exactly one closed-boundary Main start. Only that PASS may
release the sole synthetic real-package startup validation,
`G-MAIN-MODULE-FORMAT-STARTUP-U1.1/first`, using the unchanged H-GUI leaf and
new readback. Startup GREEN requires selected/executed/PASS/fail 1/1/1/0,
healthy fixture/readback controls, successful wrong-executable rejection,
exactly one first local window, local `file:` Renderer and `#root`, plus
exact-owned process cleanup.

The two GREEN checks prove only Main module-format/startup health for this
repaired package. Package failure consumes the package allowance; contract
GREEN failure stops before Electron; startup failure consumes the sole startup
allowance. A repeated module-format failure is `GREEN_FAIL`; a different later
failure is `STARTUP_VALIDATION_FAIL / UNKNOWN_NEXT_DEFECT`; control, identity,
capture or cleanup uncertainty is `INVALID_VALIDATION / UNKNOWN`. Every case
stops without retry or another repair round.

### Boundaries, activation, rollback and retirement

All inputs remain synthetic/local. No credential, real business data, source
row, database, Provider, network or external business effect is admitted. The
trusted-local Personal Profile, Chromium sandbox, context isolation, no-Node
Renderer and closed IPC boundaries remain unchanged.

Activation is limited to the affected Spec Gate PASS, valid formal RED,
Controller-scoped TDD_READY, one exact Worker diff, one package, focused
contract GREEN and one startup GREEN in that order. It does not activate an
ordinary GUI leaf, full regression, Validator, acceptance or archive. Rollback
is preservation of the preimage,
failed evidence and last known package followed by a stop; no reset, evidence
overwrite, fallback package, configuration widening or automatic retry is
authorized. The one focused contract file is permanent regression coverage.
The one Test fixture tuple is a permanent input while the new package readback
remains the current package consumed by startup or later approved GUI evidence;
the final Test Asset Retirement Gate must retain or remove each according to
actual consumers. No helper, loader framework or second test asset is
introduced.

| Bounded task | Existing acceptance owner | Owner and observable endpoint |
|---|---|---|
| MMF-TEST | AC-XDESK-001-01; AC-XDESK-012-04 prerequisite | Test: one focused loader test, one producer tuple and exact causal RED without launching the app |
| MMF-WORKER | AC-XDESK-012-03/-04 prerequisite | Worker: minimum Main output/entry configuration diff in the frozen two-path maximum |
| MMF-PACKAGE | AC-XDESK-012-03 | Controller: one package and fresh descriptor/resolved-entry readback |
| MMF-GREEN | AC-XDESK-001-01; AC-XDESK-012-04 prerequisite | Controller: loader contract GREEN, then one unchanged H-GUI startup GREEN |
| MMF-RETIRE | test-asset-retirement policy | Controller: reconcile the focused test, tuple and live consumers before Validator freeze |

All D1/D2, D3/D4, package, GUI, observation and correction counts recorded
before this authorization remain historical and unchanged. The new RED,
package and startup identities are separate targeted allowances; they do not
rename, replay, reset or convert any prior failure, UNKNOWN or PASS.

## Active GUI package producer consistency closure

This section is the complete technical delta authorized by
`technical-decision-001/gui-package-producer-consistency-authority-001.md`
(3911 bytes, SHA-256
`1f6313ecfb0271be8063eb1f6955db0c1ccdbd6d77b614276f8ca2c104c3f55e`).
It closes only the producer-identity conflict recorded in
`technical-decision-001/packaged-entry-repair-package-pass-gui-contract-stop-001.md`
(6881 bytes, SHA-256
`d731b0d4d6e847ec6657dc4dcd082a2dcb93c99a437cb5680c2d96f04213afd8`).
It changes no Requirement, any of the 91 AC, UI/product behavior, public IPC,
security setting, package identity, dependency, Runtime, assertion, retry or
success criterion. The exact clickable UI Contract and recorded user UI Gate
PASS named below remain frozen product inputs and are not revised.

The product objective remains the accepted Xanthil Desktop first slice. The
delivery objective is only to let the existing package-readback seam recognize
the honest immutable producer tuple
`(B-PACKAGE-GUI-ENTRY-REPAIR-U1.1, first)` before the still-unrun existing
`H-GUI-CONTROL-ENTRY-REPAIR-U1.1/first` health invocation. The learning
objective is to separate an absent producer allowlist entry from package or GUI
health: a static identity check may prove the new readback is lawfully mapped,
but only the later bounded GUI invocation can observe launch/root health.

The package attempt is already consumed 1/1 and passed package-entry repair
health only. Its non-overwriting `package-readback-001.json` is 4199 bytes /
SHA-256
`f883fd1b1cb205b2ce2bff7addeeb3a8f2c147ae75aedaadb26b9ba38bec7c97`.
The existing harness already requires the mapped tuple, verifies the readback
bytes, binds the producer `command.json` and `result.json` command/attempt, and
checks their successful exits before package comparison or Electron launch.
The minimum design is therefore one additional literal element in the existing
closed `guiPackageReadbackProducers` array in
`tests/fixtures/xanthil-desktop/desktop-fixtures.ts`:

```ts
Object.freeze({ commandId: 'B-PACKAGE-GUI-ENTRY-REPAIR-U1.1', attempt: 'first' })
```

No registry, resolver, framework, fallback, relabeling or second identity
record is introduced. The three existing producer tuples, four-file relative
path list, command/result/readback binding, rejection of every unmapped or
wrong producer pair, and the existing in-memory wrong-executable-identity
negative control remain unchanged.

After complete-package ponytail review and affected Spec Gate PASS, one formal
Test role may make only that one tuple insertion and may establish its static
parse/identity health without launching Electron. The Controller must confirm
the complete fixture diff is exactly one tuple, the honest readback names that
tuple, and a different pair remains outside the closed array. Only after those
checks may the unchanged GUI health command consume its still-unused 0/1
allowance. Its argv, clean environment, approved readback input, timeout,
capture, assertion, wrong-identity negative control and exact-owned cleanup do
not change. Failure consumes the allowance and stops without retry; success is
GUI package health only and does not turn prior UNKNOWN into product RED/GREEN
or unlock an ordinary GUI leaf.

The tuple's sole current consumer is the still-unrun
`H-GUI-CONTROL-ENTRY-REPAIR-U1.1/first` health invocation. It is a changed
tracked fixture asset and must be recorded in the Test Asset Retirement ledger
with that consumer. The final Test Asset Retirement Gate must reassess the
tuple if no later live consumer remains; this creates no registry/framework and
does not authorize deletion before equivalent required evidence and the Gate's
retirement proof exist. Activation is the Controller-recorded affected Spec
Gate PASS followed by the exact one-tuple Test correction and static identity
PASS. Rollback is evidence preservation and stop; do not remove an old tuple,
repackage, relabel evidence, reset history or replay a consumed operation.

This Spec return claims neither ponytail PASS nor affected Spec Gate PASS.

## Active packaged-entry local-path prerequisite repair

This section is the complete technical delta authorized by
`technical-decision-001/gui-package-entry-local-path-repair-authority-001.md`
(6176 bytes, SHA-256
`f0416bf80bf4d4f6669730615def5d371edce53dff71f50c02e019f6c38cef6f`).
It supersedes only the next packaged-entry health action. It changes no
Requirement, any of the 91 AC, UI assertion, public IPC shape, dependency,
schema, Runtime, security setting, product retry or accepted success criterion.
The exact clickable UI Contract remains
`docs/planning/2026-09-18/clickable-ui-contract-v1.1/` at sorted manifest
SHA-256 `39964927d40f756e93bafc8ae8bedd93482a40778316cc22aaad6b2ebad10a67`;
the recorded user UI Gate remains PASS in the exact execution package at
SHA-256
`72504be4fe0b6c32cf120a62ac43a0b41d2125f6c2bebc8ef86a90dd6204fb92`.
This repair does not contradict or revise that frozen UI input.

### Objective, scope and learning

The product objective remains the accepted Xanthil Desktop first slice. The
delivery objective of this prerequisite is narrower: the frozen packaged Main
entry must resolve its preload and Renderer to local package files and reach
the existing one-first-window `H-GUI-CONTROL` seam. The learning objective is
to distinguish this deterministic entry defect from the prior missing
Chromium endpoint without claiming that it was the prior failure's sole cause.

The frozen B2 `app.asar` is 231569 bytes / SHA-256
`caa5255e0464b9f0810e9035e60390091b131f0919e3ecb7cb789de35aacbd7c`.
Its emitted `.vite/build/main.js` is 5996 bytes / SHA-256
`02abaa3b3a0929304e89526e623c61750320c9539a7ac93756030ce1685e4c10`.
That exact entry evaluates an invalid URL base for the preload before
`BrowserWindow` construction; its Renderer expression has the same invalid
base. This is a packaged-entry health defect, not product RED.

In scope is one formal Test health check, one formal Worker changing only the
two local-path expressions in `apps/desktop/main.ts`, one static exact-diff
review, at most one repackage, and at most one new frozen-package execution of
the unchanged permanent `H-GUI-CONTROL` assertion. Non-goals are any tracked
Test change, new helper/framework/dependency, Vite/Forge/config change, second
app, product behavior implementation, GUI assertion expansion, Provider/data
access, broader regression, diagnostic replay, Git/board work, or another
attempt after either bounded post-Worker command is consumed.

### Executable seam and production design

The formal Test uses one task-local `.mjs` with only Node standard library. It
executes the exact frozen emitted CommonJS Main bytes, unmodified, in a closed
`node:vm` context. Its Electron boundary admits only `electron` and `node:url`,
uses a successful single-instance/ready path, captures `BrowserWindow` options
and `loadFile`, rejects any unexpected import, and performs a known-good and a
known-invalid internal control before executing the real bundle. It does not
scan emitted strings, launch Electron, import product source, or assert a UI or
business result. Health requires one constructed window, a preload path equal
to the frozen local `.vite/build/preload.js`, and exactly one `loadFile` path
equal to the frozen local `.vite/renderer/main_window/index.html`. The current
bundle is expected to fail this invariant with `ERR_INVALID_URL` before window
construction. A control/input/VM/import failure is `TEST_CONFLICT`, not the
approved defect.

After independent Test review, the user-approved one-time product-behavior
`TDD_READY` prerequisite waiver may release exactly one formal Worker. This is
not `TDD_READY`, product RED, GUI admission, or authority for a later Worker.
The Worker changes only the two path-resolution expression nodes currently at
`apps/desktop/main.ts` lines 166 and 192. Each expression must preserve the
existing direct-source ESM base while selecting the emitted CommonJS entry
filename as its runtime base when that binding exists; the transformed
`import.meta.url` fallback must not be evaluated in the packaged CommonJS
branch. The resulting values must be the absolute local packaged preload and
Renderer paths. No import, statement, lifecycle, handler, option, public
shape, or other byte is changed.

The static review compares the full file against the frozen 7906-byte /
SHA-256 `15923cc98370762aec437cb64ead87587144328944389786767b40a721c9081a`
preimage and must find exactly those two expression replacements. It also
confirms unchanged `contextIsolation:true`, `sandbox:true`,
`nodeIntegration:false`, `devTools:false`, `webSecurity:true`, IPC
registration/sender policy, single-instance behavior, navigation/window/
permission denials, lifecycle and one `loadFile` call. Any additional change
stops before packaging.

### Boundaries, failure semantics and lifecycle

The check uses only frozen synthetic/local files and no credentials, real
business data, network, Provider, database or external effect. The repair does
not widen the trusted-local Personal Profile boundary. The preload remains
context-isolated/sandboxed; no Renderer Node capability or generic IPC is
introduced.

The post-Worker package and GUI commands are health evidence only. Package,
capture, input-readback or identity failure is `INVALID_HEALTH`; an unchanged
`H-GUI-CONTROL` failure is `INVALID_HEALTH / UNKNOWN`; neither is product RED
or GUI `TDD_READY`. Success proves only that the newly frozen package passes
the existing local preload/Renderer/one-first-window seam. It does not
retroactively prove a sole historical cause or unlock the ordinary GUI leaves.
D1/D2 and D3/D4 remain exhausted 2/2, and every historical error, package and
UNKNOWN verdict remains immutable.

Activation is the Controller-recorded PASS of the one new package identity and
one new `H-GUI-CONTROL` health command after static review. Rollback is
evidence preservation and stop: do not reset source/history, overwrite the old
package, replay a command, or fall back to a second app. A failed repackage or
health validation consumes its one allowance. The task-local Test script is
temporary evidence retained under the existing artifact root; no tracked Test
asset is added or retired, while the existing `H-GUI-CONTROL` stays permanent.

| Step | Owner | Release/result |
|---|---|---|
| PE-TEST | one formal `juaner_test` | healthy controlled packaged-entry failure; never product RED |
| PE-WORKER | one formal `juaner_worker` under the explicit one-time waiver | only two `main.ts` expressions |
| PE-STATIC | Controller | exact-diff PASS before any package command |
| PE-PACKAGE | frozen existing capture | at most one new non-overwriting package/readback |
| PE-GUI-HEALTH | unchanged existing GUI test/harness | at most one new health result, then stop |

Controller alone records task/traceability/verification transitions and the
affected Gate. This Spec return claims neither ponytail PASS nor Spec Gate PASS.

## Active U1.1 first-package bootstrap design

This section is the current M1.1/C1a bootstrap execution design. It supersedes
older generic U1.1 command-order wording, but does not replace any final
contract, Requirement, AC, UI or retained result. The complete-package review
and Spec Gate decide whether it may enter Test.

### One production object chain

There is one chain, with no second entry, phase selector or test app:

```text
normal Electron Main entry
  -> existing createXanthilDesktopIpcHandlers({senderPolicy})
  -> exactly twenty xanthil-desktop:v1:<method> ipcMain handlers
  -> normal preload contextBridge exposes xanthilDesktopApi
  -> normal Renderer mount passes that same window.xanthilDesktopApi object
     to the actual exported XanthilDesktopApp
  -> Forge/Vite packages that Main/preload/Renderer/index/styles graph
  -> playwright-core opens that exact arm64 .app
```

The delegated internal decision is that the context-isolated global key is
exactly `xanthilDesktopApi`, matching the already frozen public export. The
preload invokes only `xanthil-desktop:v1:<method>` and never exposes
`ipcRenderer`, a channel string, Electron object, path, bytes, callback or
generic invoke. The Renderer reads exactly `window.xanthilDesktopApi` and
`XanthilDesktopApp` accepts exactly `{api:XanthilDesktopApi}`. This additive
internal wiring preserves every existing consumer and changes no public
business shape.

### Minimum real-source loader, with independent controls

The B1 Test driver runs under the approved absolute Node with the one frozen
flag `--experimental-strip-types`. It dynamically imports the exact production
`.ts` files; it does not copy or rewrite Main, preload or IPC. Before import it
uses Node's built-in synchronous `node:module.registerHooks` API once. The
resolve hook maps only the bare `electron` specifier to a process-local
Test-owned ESM boundary record and delegates every other specifier unchanged.
That record substitutes only Electron's external app/window/IPC/contextBridge
surface. It neither implements a handler nor changes a production export. A
known positive synthetic module must resolve through the hook and a known
negative unrelated/transitive target must remain rejected before production is
loaded. Absence of `registerHooks`, failure of either control, a syntax error,
or any non-exact/transitive import failure is INVALID health, never RED.

The hook is installed inside
`tests/fixtures/xanthil-desktop/desktop-contract-drivers.ts` before its existing
`loadDesktopModule('apps/desktop/main.ts')` call. Therefore the retained
`U1.1 M1.1 all-method inactive refusal...` assertion continues to import and
exercise the same real Main under the approved Electron boundary. It does not
depend on ambient Electron and needs no product flag. Its new affected
regression command is fixed in `test-plan.md`; the old successful R/G command
and result remain immutable.

Node does not directly strip TSX. B2 therefore uses the already pinned
`typescript@5.9.3` `transpileModule` with `target:ESNext`, `module:ESNext`,
`jsx:react-jsx`, `verbatimModuleSyntax:true`, `isolatedModules:true` and
`reportDiagnostics:true`. It transpiles the exact bytes of
`apps/desktop/renderer.tsx` to one fresh Test-owned evidence child; emitted
bytes and the source digest are recorded. Because that child is outside the
repository, the driver resolves only the closed approved bare set `react` and
`react/jsx-runtime` to their installed root package bytes; its own
`react-dom/server` import is the installed real package. The sole substituted
bare module is `react-dom/client`, whose `createRoot` is the approved DOM-mount
boundary; every other specifier is delegated and an unexpected bare or runtime
relative import fails health. Component proof installs that benign mount
capture before importing, then server-renders the exported component with real
React. Mount proof inspects the capture. Thus component and mount regression
both load the same final `renderer.tsx` after the normal mount exists; the mount
side effect cannot become an unclassified component-loader error.
A known valid TSX probe must compile/render and a known invalid TSX probe must
produce diagnostics without import. Failure is INVALID health. This is a
single-file supported transpilation seam, not a loader framework, Vite page or
fake component.

### B1 leaf DAG

Every node below is a separately selected top-level Test. A successor is not
executed until its predecessor is GREEN.

1. `B1-BRIDGE` imports the actual preload. It asserts public export
   `xanthilDesktopApi`; exactly the twenty frozen method keys and functions; one
   call per method sends the exact same frozen request to exactly
   `xanthil-desktop:v1:<method>` and returns the exact structured-clone sentinel;
   `contextBridge.exposeInMainWorld` is called once with key
   `xanthilDesktopApi` and the identical object; no generic or raw Electron
   member exists. Its only production write is `apps/desktop/preload.ts`.
2. `B1-ENTRY` imports the actual Main normal entry after bridge GREEN. It
   asserts one successful single-instance admission, one `app.whenReady`
   startup, exactly twenty `ipcMain.handle` registrations, and behavioral
   identity between every registered callback and the existing exported
   factory's inactive handler for accepted and rejected frames. It asserts one
   BrowserWindow loads only the packaged local `main_window` entry with the
   actual preload. Its only production write is `apps/desktop/main.ts`.
3. `B1-SAFETY` reimports the same Main source in fresh controlled module
   instances. It asserts failed single-instance admission quits before handler
   or window creation; second-instance focuses the existing window without a
   second window; `contextIsolation:true`, `sandbox:true`,
   `nodeIntegration:false`, `devTools:false`, `webSecurity:true`; only the
   recorded main frame/sender is accepted; navigation is prevented, new windows
   return `{action:'deny'}`, permission check/request is false, no external
   shell/devtools/HMR/network path runs, and close/activate lifecycle creates no
   extra authority. Its only production write is `apps/desktop/main.ts`.

After these leaves pass, the unchanged retained IPC assertion runs once as an
affected regression with the same direct-import driver/hook. Its exact 20
methods, 114 observed sender/envelope cases, 94 accepted-sender observations,
20 rejected senders and zero-effect `FORBIDDEN` semantics stay unchanged.

### B2 leaf DAG and C1a package

1. `B2-COMPONENT` loads the actual `XanthilDesktopApp` export using the healthy
   TSX seam. Real server rendering receives an exact twenty-method recording
   API. The export must render Xanthil Desktop, Project/Session navigation,
   workspace, Inspector/auxiliary drawer, status, quick/professional modes,
   global search, the six exact professional labels `新建分析`, `数据准备`,
   `本地处理`, `循证分析`, `报告`, `执行反馈`, and Skill/Prompt/Fork/Subagent
   with honest Preview/development-incomplete presentation. Every API call count
   remains zero. The only production write is `apps/desktop/renderer.tsx`; no
   normal mount is authorized by this leaf.
2. `B2-MOUNT` runs only after component GREEN. With the controlled DOM root and
   mount boundary it asserts one `#root` lookup, one `createRoot`, and one render
   whose element type is the identical exported `XanthilDesktopApp` and whose
   only prop is the identical `window.xanthilDesktopApi`. Initial mount makes no
   API call. The actual index has one root, only relative local script/style,
   and CSP exactly `default-src 'self'; script-src 'self'; style-src 'self';
   img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none';
   base-uri 'none'; form-action 'none'; frame-ancestors 'none'`. This leaf may
   write `renderer.tsx`, `index.html`, `styles.css` plus only the already
   approved C1a root/build/toolchain/runner prerequisites enumerated in
   `path-contract.md`.

The component Worker must not implement the hidden mount leaf. The mount Worker
may add only the normal production mount and build prerequisites; it may not add
interactive/business behavior. After both leaves are GREEN, exact configuration
oracle (2 selected), runner control (9 selected), typecheck and Forge package
health must pass. The package readback freezes byte length and SHA-256 for the
executable, `app.asar`, `Info.plist`, and
`toolchain-deployment.json`, plus their sorted aggregate. Package or control
failure is INVALID and cannot release GUI work.

### GUI admission and failure semantics

The fresh GUI Test role authors the already-required
`U1.1 GUI-RUNTIME-SAFETY` top-level behavior body, only its support in the
existing GUI harness/fixture files, and its coverage mapping. This is behavior
Test authority, not merely health/control authoring. The role also authors the
package identity/control health needed to admit the leaf. It preserves all five
existing AC-XDESK-001-01..05 titles/assertions and the retained
AC-XDESK-012-04 assertion, writes no production path, and grants no Worker path
until one exact assertion has healthy causal RED and scoped TDD_READY.

Every GUI checkpoint uses that checkpoint's independently frozen existing
`package-readback-001.json` directly as its expected identity; there is no
second manifest, aggregate record or committed identity constant. The formal
GUI Test/evidence author completes that readback after the producing package
capture and before the checkpoint health invocation. The Controller
independently matches it to the package command/result and frozen source inputs,
then freezes the readback path, byte length and SHA-256 together with those
referenced command/input/result files in every consuming command's
`inputs.json`. Neither role may overwrite or relabel a prior readback or
command capture. A changed package requires its already-scheduled new package
checkpoint and new readback; an unchanged package continues to use the prior
readback. The GUI Test must not read the package under observation to calculate
or repair an expected byte length, digest or aggregate.

The GUI harness loads the supplied readback path and expected readback SHA-256
from the one command-local environment input, verifies the readback bytes before
parsing, validates its producing-command/source identity and exact
four-file manifest/aggregate fields, and verifies the actual package's
four byte lengths and SHA-256 values plus the recomputed aggregate inside
`launchFrozenProductionApp`, before it dynamically imports `playwright-core`
or calls `_electron.launch`. Consequently the health leaf and every later GUI
behavior launch against that package traverse the same identity preflight.
After the readback itself passes byte/schema/source validation, the health
negative copies its expected identity in memory, changes only the expected
executable digest to a deliberately wrong value, recomputes the clone's
aggregate by the frozen algorithm, and passes that internally coherent wrong
identity through the same launch helper. It must reject on actual package
identity before Playwright import or Electron launch. The positive call uses
the unchanged readback, compares the actual files, then opens the real package
and observes exactly one first window and production root. Health then admits
two real-package safety leaves before
visible UI behavior:

- the unchanged `AC-XDESK-012-04` leaf proves the same packaged app runs with
  chromiumSandbox true, no UI-contract simulation, and no Renderer `require`
  or `process`;
- `U1.1 GUI-RUNTIME-SAFETY [AC-XDESK-009-01..04,
  AC-XDESK-012-04]` proves the actual top window exposes exactly the
  twenty named functions and no `ipcRenderer`/generic member, an isolated child
  frame has no bridge, one safe inactive top-frame request returns the frozen
  sanitized result, one malformed request is effect-free, `window.open` and an
  external navigation leave one window and the same local URL, geolocation is
  denied, and an external fetch is blocked by CSP with zero observed external
  request. It does not open a chooser or activate a business route.

B1's controlled Electron/config GREEN is necessary setup but cannot satisfy
either packaged safety leaf. A safety failure releases only the exact boundary
that failed: Main for sender/window/navigation/permission lifecycle; preload
for bridge/subframe/method exposure; `index.html` plus only the responsible
renderer Vite config for CSP/local-resource failure; the responsible existing
Forge/Main/Vite config only when the frozen package proves a configuration
defect. No UI assertion can widen that set.

Only after both runtime-safety leaves are GREEN do the five existing titles
`AC-XDESK-001-01` through `-05` run separately, one selected test per command,
against the same checkpoint readback and actual package identity. They cover the
persistent frame, six stages, honest Preview, mode/search close with no Session,
and drawer/modal/focus at 1440x900 and 1366x768. The B2 readback serves the
initial health, runtime and visible leaves until a Worker changes package
inputs; the post-safety readback serves post-safety health/runtime and any first
visible leaves that follow that Worker; the post-visible-UI readback serves its
health, both runtime regressions and all five visible GREEN/regression leaves.
The helper is data-driven, so later scheduled checkpoints require no Test-code
edit merely to accept a different package identity.

Missing, malformed, stale or mismatched readback/source identity, a
package-file or aggregate mismatch, or any attempt to manufacture expected
identity from the observed package is INVALID health and stops before a product
verdict or Electron launch. An executed failed product assertion after healthy
control is causal RED for that leaf only. A passed leaf is baseline GREEN and
grants no write. A skipped or predecessor-blocked leaf is UNREACHED. Loader,
fixture, compilation,
typecheck, package, launch, identity, timeout or control failure is INVALID and
stops without product verdict. The GUI Worker receives only the union of paths
mapped to actually failed leaves. Main/preload/config are forbidden for the five
UI leaves and are available only through the safety mapping above. After any
affected change, rerun its B1/B2 assertion, typecheck, a fresh package, GUI
health and both packaged safety leaves before continuing to visible UI.

After packaged safety and all five UI leaves are GREEN, run B1 bridge, entry,
native safety and retained IPC plus both B2 assertions once as final affected
regression. This is behavior regression, not replay of unchanged preparation:
H-B1/H-B2, install/P4 and an unchanged package build are not repeated. Any
regression failure stops before the final runner and cannot be hidden by GUI
PASS.

All U1.1 syntax and map health evidence is checkpoint-qualified: B1, B2 and GUI
use distinct `H-SYNTAX-<group>-U1.1-<n>` and
`H-MAP-<group>-U1.1-FIRST-PACKAGE` identities. Safety-Worker and visible-UI
typechecks also use distinct IDs. The post-safety runtime assertions use their
existing G IDs with `green` for an initially failed leaf or `regression` for an
initially passing leaf; a later visible-UI package uses the two distinct
`REG-UI-GUI-RUNTIME-*` IDs with `regression`. B2 component GREEN followed by
the mount-affected component regression keeps its existing G ID because
`green` and `regression` are already distinct attempts. `test-plan.md` owns the
complete static scheduled-checkpoint map and unchanged argv/count/env/timeout
contract. These identities add no check, behavior, runner phase or capture
field and never rename or overwrite historical evidence.

## Incremental internal interface tuples

Incremental Contract Amendment 001 applies the old interface freeze to the
final contract and expressly permits the following finite monotone internal
subsets. These are ordinary revisions of the same exports and production app,
not overloads selected at runtime. Exact-shape `define*` functions validate the
method set for the current tuple; extra or missing keys fail. An implementation
must not cast a subset to a later interface.

| Tuple | Application methods | Store methods | Other Ports and dependency keys |
|---|---|---|---|
| I1 / U1 | `openProject`, `listSessions`, `openSession`, `createSession`, `saveForm` with `case_fields` only, `readProjection`, `waitForProjection` | `openProject`, `listSessions`, `createSession`, `saveForm` with `case_fields` only, `readProjection`, `waitForProjection`, `markIntegrityBlocked` | Application/compose keys exactly `{store,clock}`; normal Profile deployment exactly `{clock}` and constructs only Store; assistance absent, not `undefined` in a final-shaped object |
| I2 / U2 | I1 plus `createDraftRevision`, `inspectImportFiles`, `confirmRevision`, `startAnalysis`, `cancelAnalysis`, `reconcileInterrupted` | I1 plus `createDraftRevision`, `readConfirmedSnapshot`, `publishConfirmation`, `admitAnalysis`, `publishAnalysisSuccessCandidates`, `settleAnalysis`, `requestAnalysisCancellation`, `reconcileInterrupted` | add complete three-method `DesktopLocalAnalysisExecution`, complete seven-method `DesktopRunEvidenceStore`; Application/compose keys exactly `{store,analysisExecution,runEvidenceStore,clock,deadlineScheduler}`; normal Profile deployment exactly `{toolchainDeployment,clock,deadlineScheduler}` and assistance is internally unavailable/null |
| I3 / U3 | I2 plus `acceptFinding`, `completeCase`, `prepareReportExport`, `recordReportExport`; widen existing `saveForm` to all three final branches | I2 plus `acceptFinding`, `completeCase`, `readReportExport`, `recordReportExport`; widen `saveForm` to all branches | same Port/dependency set as I2; Main gains the final export writer |
| I4 / U4/final | I3 plus `prepareAssistanceDisclosure`, `decideAssistanceDisclosure`, `startAssistance`, `cancelAssistance`, `disposeAssistanceDraft` | I3 plus `recordDisclosure`, `admitAssistance`, `settleAssistance`, `requestAssistanceCancellation`, `disposeAssistanceDraft` | add complete three-method `DecisionAssistanceRuntime`; restore exact final six keys `{store,analysisExecution,runEvidenceStore,assistanceRuntime,clock,deadlineScheduler}` and final normal Profile deployment `{toolchainDeployment,assistanceConfig,clock,deadlineScheduler}` |

U1 itself has five finite prefixes, so no later U1 behavior is implemented
before its RED. The public surface is always the final twenty-method union;
"active" below means the named public union tag may cross Main into the exact
Application method. Every other method/tag follows the ordered inactive-route
refusal and reaches no future dependency.

| Prefix / repository tuple | Active public methods or union tags | Exact Application methods | Exact Store methods | Exact Main/Profile/dependency closure |
|---|---|---|---|---|
| M1.1 / C1a | none | none | none | Main exactly `{senderPolicy}`; final preload/IPC/Renderer shell; all twenty methods reach only sender/frame, their method-specific minimal envelope, then inactive refusal |
| M1.2 / C1b | `selectProject`, `listSessions`, `readProjection` | `openProject`, `listSessions`, `readProjection` | `openProject`, `listSessions`, `readProjection`, `markIntegrityBlocked` only on the named integrity-read path | Main exact I1 `{productionProfile,nativeDialogs,senderPolicy}`; Profile deployment `{clock}` constructs only Store and Application `{store,clock}` |
| M1.3 / C1b | M1.2 plus `createSession` | M1.2 plus `createSession` | M1.2 plus `createSession` | no new dependency or public tag |
| M1.4 / C1b | M1.3 plus `openSession`, `saveForm(kind:"case_fields")`, `waitForProjection`; these are the seven U1 operations | M1.3 plus `openSession`, `saveForm` with only `case_fields`, `waitForProjection` | M1.3 plus `saveForm` with only `case_fields`, `waitForProjection`; `openSession` is implemented only through `listSessions` then `readProjection` | no new dependency; later `saveForm` tags remain inactive |
| M1.5 / C1 | unchanged from M1.4 | unchanged from M1.4 | unchanged from M1.4 | owner-crash, native hot-journal, full package, same-app close/reopen, Preview/security and UI proof only |

These prefixes are compile-time source revisions only; none is a public
protocol version or persisted stage. No prefix adds a hidden owner resolver,
Port, cache, phase selector, overload, or future business parser.

At I1, Desktop Ports export exactly `DesktopDecisionCaseStore` and
`defineDesktopDecisionCaseStore`; storage exports only
`createLocalDesktopDecisionCaseStore`. I2 adds, under the already frozen names,
`DesktopLocalAnalysisExecution`, `DesktopRunEvidenceStore`, their two `define*`
functions, `createDuckDbPythonDesktopLocalAnalysisExecution`,
`createLocalDesktopRunEvidenceStore`, and Product Core's
`validateDesktopRunManifest`. I4 adds `DecisionAssistanceRuntime`,
`defineDecisionAssistanceRuntime`, and `createPiDecisionAssistanceRuntime`.
Application, Profile, Main, preload, Renderer and IPC export the same names
listed in the final contract below from their first included tuple. Type-only
business values may be declared before their behavior, but no future effecting
method or factory is advertised.

Main dependencies are exact and monotone: I1 is
`{productionProfile,nativeDialogs,senderPolicy}` where `nativeDialogs` exposes
only Project selection; I2 is
`{productionProfile,nativeDialogs,sourceReader,senderPolicy}` where dialogs add
the two-file import chooser; I3/I4 use the final
`{productionProfile,nativeDialogs,sourceReader,exportWriter,senderPolicy}`.
Private helper objects are exact-shape checked. Renderer and environment never
select a tuple, Adapter, double, or phase.

The public IPC contract is final from C1a: all twenty named version-1 methods,
channels, request/result envelopes and the complete projection. Main first
checks packaged sender and top frame. It then checks the method-specific
minimal envelope: every request requires exactly a supported
`contract_version`; a canonical UUIDv4 `command_id` is additionally required
only for a command-bearing method in the frozen request table. The six
non-effecting requests `listSessions`, `openSession`, `selectImportFiles`,
`prepareAssistanceDisclosure`, `readProjection`, and `waitForProjection` have
no command ID. For an inactive method or inactive `saveForm` tag, Main validates
only that sender/frame and minimal envelope, then returns `FORBIDDEN` with the
development-incomplete message, exact no-effect statement, preserved authority
and next action. It does not validate or parse the future business payload,
invoke a native helper, construct an Adapter, call Application/provider, write
a receipt, or mutate a record. An active method performs the full exact
method/union validator and Application owner/state validation after the same
minimal-envelope step. I1 `saveForm` fully validates and forwards only
`kind:"case_fields"`; both other tags are refused before their branch fields
are parsed. I3 removes those branch refusals. I4 removes every development-only
route refusal; ordinary business/security refusals remain.

The private storage admission signal is one unexported exact discriminant
`{admitted:false,reason:"requires_later_build"}` carrying no row, path, SQL or
future data. The Adapter converts it to its unexported admission exception;
Profile/Application translate only that exception to the existing public
`FORBIDDEN`. It is never persisted, projected, logged with data, or exposed as
a Port/query method. All other Store errors keep their final vocabulary.

## Whole U1 normal-path static closure

Every C1/I1 call below has a real provider. A row marked “refused” is reachable
only through a valid-envelope inactive route and cannot reach a future provider.

| Caller → callee | Exact value/dependency and translation | Reads/writes | Provider in C1/I1 |
|---|---|---|---|
| `XanthilDesktopApp` → `xanthilDesktopApi.selectProject` | version-1 request; no path value | UI intent only | preload's real named wrapper |
| preload → `ipcRenderer.invoke(xanthil-desktop:v1:selectProject)` | structured-clone request/result only | none | packaged preload/IPC |
| Main → `senderPolicy` | packaged sender + top-frame before any other effect | sender/frame metadata | exact I1 policy helper |
| Main → minimal-envelope guard | exact version for every method; command UUID only for command-bearing methods; malformed envelope fails | none | private method table in Main |
| Main → `nativeDialogs.selectProjectDirectory` | opaque Main-held directory capability plus display name; cancel is no effect | native chooser only | exact I1 dialog helper |
| Main → `productionProfile.openProject` | `{contract_version,projectDirectoryCapability,display_name,command_id}` | selected Project only | normal Personal Profile |
| Profile → `createLocalDesktopDecisionCaseStore` | exact `{projectRoot}` derived from capability; path never crosses IPC | selected Project metadata | storage-local Adapter |
| Store open → raw preflight | containment, SQLite header, application_id 1480870705, user_version 100, DELETE journal/WAL and integrity rules | header/sidecars; zero write except recognized native hot-journal rollback | node:sqlite/filesystem Adapter |
| Store open → schema/admission | full sixteen-table schema; read-only tuple-A1 predicates; unsupported rows refuse whole Project before business write/reconcile | all table/reference/receipt kinds read; no business write on refusal | storage-local Adapter |
| Profile → `createXanthilDesktopDecisionCaseApplication` | exact I1 `{store,clock}` | none | Application factory |
| Application → Store `openProject` | exact six-field internal request including Application initialized_at/input_fingerprint; proposed UUID/name only for absent DB, existing stored identity wins | initialize full schema/project/receipt or read existing | Store I1 method; current U1.2 decision above |
| Application → Store `listSessions` during open | exact stored `project_id`; the returned real summaries become `ProjectOpenValue.sessions` | `product_sessions`, cases/current revision | Store `listSessions`; no default or cache |
| Main → result translator | domain/Application failure to exact `DesktopResult`; no raw error/path | none | Main private translator |
| Renderer → list/open/create Session | final public requests; full validation | projection/list/session state | preload→Main→real I1 Application methods |
| Application `listSessions` → Store | exact `{project_id}` | `product_sessions`, cases/current revision | Store `listSessions` |
| Application `openSession` → Store | call `listSessions({project_id})` with the already-authoritative scoped Project ID, select the exact `session_id`, form OwnerRef from that same scoped Project ID plus the summary's authoritative `session_id/case_id/current_revision_id`, then call `readProjection` | all sixteen tables read, later tables proven empty | existing Store `listSessions` then `readProjection`; no hidden owner resolver/cache or widened `SessionSummary` |
| Application `createSession` → Core guards | exact professional request; UUIDv4 session/case/revision/operation IDs; clock | no I/O in Core/Application | private pure guards + platform UUID/clock |
| Application → Store `createSession` | final exact input | stage/fsync/rename three directories, then one SQLite transaction + receipt | Store I1 method |
| Renderer → `saveForm(case_fields)` | exact branch and row guard | local form state only before submit | full IPC validator + I1 Main admission |
| Application → Store `saveForm` | exact command, `{form_id:null}` | update current Draft case fields/row version + receipt | Store I1 method |
| Application read/wait projection → Store | first use `listSessions({project_id})` inside the already-authoritative Project scope to validate the requested Session/Case/current revision, then call `readProjection` or `waitForProjection` with the unchanged OwnerRef | every table read; future arrays empty only after read | existing Store list/read/wait methods; no new Port or owner field |
| Store integrity read → `markIntegrityBlocked` | only final authorized U1 integrity rule and generated command UUID | one row/receipt when applicable | Store I1 method |
| Renderer render | complete hierarchy; inactive capabilities false; Preview controls effect-free | no authority inference | real React Renderer |
| close/relaunch → same chain | no debug selector; same chosen Project | committed IDs/row versions/receipt/directory state | same packaged `.app` |
| any other public route | sender/frame + envelope, then sanitized `FORBIDDEN` | zero chooser/source/Adapter/provider/receipt/record effect | Main refusal; future methods unreachable |
| Forge/Vite packaging | P5 manifest/build config, C1 tsconfig graph, local resources/CSP/sandbox | `.vite`/`out` only | approved Forge/Vite toolchain |
| U1 tests | direct public seams and native controls; no fake Application/Store | isolated synthetic Project only | C1 test paths in path-contract.md |

The U1 read chain is fail-closed and has no second owner authority. After Store
`openProject` succeeds, Profile/Application scopes the Project to the returned
stored `project_id` and uses that exact identity for Store `listSessions`; it
never uses the caller-proposed Project ID for that read. Store validates every
returned Session's same-Project
Session/Case/current-revision chain and the latest receipt identity incorporated
in the Project projection token. A dangling or cross-owner Case, revision, or
receipt/result reference is `INTEGRITY_BLOCKED`, not an omitted Session or a
default value. An absent stored Project is `NOT_FOUND`. Store
`SCHEMA_UNSUPPORTED`, `INTEGRITY_BLOCKED`, `STORE_BUSY`, `RESULT_PENDING`, and
`INTERRUPTED` read failures pass through Application under those same existing
codes; Store never emits `STALE_REVISION`. Raw SQLite/filesystem/path details
never cross Main. Only after both
reads succeed does Profile return `ProjectOpenValue` with the exact Store
Project and real ordered summaries.

`openSession` first calls Store `listSessions({project_id})`; absence of the
requested `session_id` is `NOT_FOUND`. Application constructs `OwnerRef` only
from the already-authoritative scoped `project_id` passed to `listSessions` and
that summary's stored `session_id`, `case_id`, and `current_revision_id`; the
public `SessionSummary` shape is unchanged. It then calls Store `readProjection`
with that exact value. Direct `readProjection` and `waitForProjection` likewise
call Store `listSessions` first: missing Project/Session is `NOT_FOUND`, while a
found Session whose authoritative `case_id/current_revision_id` differs from the
requested OwnerRef returns the public Application code `STALE_REVISION` before
the target Store read. The projection read revalidates the composite owner
chain, current revision, and latest same-owner command-receipt/result reference
used by its `projection_token`. If the exact Session matched the list but the
target Store read returns `NOT_FOUND` because the current revision changed in
that interval, Application translates only that already-matched race to public
`STALE_REVISION`; it does not add that code to the Store vocabulary. Persisted
dangling/cross-owner receipt, Case, or current references are
`INTEGRITY_BLOCKED`. The remaining Store read codes pass through exactly as in
the Project-open chain. No Main/Renderer cache, fabricated owner, hidden
resolver, retry, fallback, public-shape change, or new Port participates in any
of these reads.

The C1 import closure is therefore Product Core, Application, IPC, Desktop
Store Port/schema/Adapter, Profile, Main/preload/Renderer, React/Electron,
build configs, and the exact C1 test subset. It contains no analytics helper,
Desktop Analysis Adapter, Run store construction, assistance contract, Pi
factory, import source reader, or export writer. Their public routes cannot
reach payload validation or construction.

## Historical execution-stage architecture blocker — superseded

The following correctly described the contract before Incremental Contract
Amendment 001 and remains historical evidence only.

The public contracts below are already frozen for every production build, not
only final acceptance. In particular, `createXanthilDesktopDecisionCaseApplication`
and `composePersonalXanthilDesktopProfile` have the exact six-key dependency
object below, while normal `createPersonalXanthilDesktopProfile(...).openProject`
constructs the three mandatory production Ports and the optional Pi Runtime.
The four Port interfaces and all `define*` exact-shape functions are also whole
interfaces; the amendment did not authorize prefix interfaces or transitional
factory overloads.

U1 nevertheless must start with the accepted real UI and end with the same
production app creating, saving, closing, and reopening a real Session. A
buildable U1 Profile/Application must therefore supply Analysis, Run-evidence,
and Assistance dependencies before the U2/U4 Test loops that are supposed to
establish causal RED for those behaviors. There is no authorized implementation:

- absent keys or partial interfaces violate the exact public contract;
- throwing or always-failing placeholder methods are fake/stub behavior and no
  approved public "development unavailable" result exists;
- full implementations release future business functions before their Test
  loop and collapse the required one-observable-behavior scope;
- a second shell, test entry, runtime phase selector, or injected production
  double is expressly forbidden.

Manifest/tsconfig tuple changes alone could not solve that public-contract
dependency. The activated amendment and the exact tuples above now provide the
missing authority; downstream execution remains gated.

## Architecture

    Non-technical user
      <-> React Renderer
          <-> version-1 named preload methods
              <-> Electron Main transport and native chooser
                  -> Desktop Decision Case Application
                      -> Product Core rules
                      -> DesktopDecisionCaseStore port
                          <- storage-local node:sqlite + immutable files
                      -> DesktopLocalAnalysisExecution port
                          <- analytics-duckdb DuckDB/Python adapter
                      -> DesktopRunEvidenceStore port
                          <- storage-local Desktop manifest 3.0
                      -> additive DecisionAssistanceRuntime
                          <- Pi Adapter
                  <- Personal Desktop Profile

Dependency direction remains inward: Product Core imports no Application,
Port, Adapter, Electron, React, SQLite, filesystem, DuckDB, Python, Pi, or build
type. Application imports Core and business Ports. Adapters import Ports/Core.
The Profile alone selects concrete Adapters. Main/Renderer are product entries,
not business authorities.

## Closed shared-contract seam

Technical Decision Amendment 001 and the coordinator decision authorize one
additive Desktop-only Run Manifest with `schema_version: "3.0"`. Product Core,
Port, local adapter, and Profile ownership remain inside existing approved
Desktop files. The manifest truthfully carries two immutable snapshot sources,
deterministic DuckDB/Python provenance, and `model_usage: "none"`.

This is physical-root coexistence, not a generic Run platform. The current
local-analysis store still writes 2.0 and reads terminal 1.0/2.0; the current
Console selected-directory reader still reads only 1.0. Both reject 3.0 using
their existing unsupported-version behavior. The Desktop store accepts only
3.0 by exact run ID. No consumer scans the shared root, no old path is widened,
and no dispatcher, migration, adoption, repair, or version registry exists.

## Deep module boundaries

### Product Core

packages/product-core/xanthil-desktop-decision-case.ts owns:

- CSV value and business-rule validation after bytes are supplied;
- exact member/order mapping, period, valid-status, amount/date, M1/M2, and
  judgment rules;
- Case revision transitions and current-reference invariants;
- assistance eligibility, payload category allowlists, and Draft adoption
  authority;
- candidate/form/acceptance/Closure/report guards;
- canonical business JSON and stable product error mapping.
- the closed Desktop Run 3.0 manifest/result shapes, lifecycle validation,
  canonical decimal-string/rational rules, and checked signed-64-bit bounds.

It is pure and creates no file, database, process, Runtime, or UI effect.

### Application

packages/application/xanthil-desktop-decision-case.ts is the one semantic writer.
It owns use-case sequencing, command fingerprints, row-version/state guards,
deadline/cancellation arbitration, and the transition requested from the store.
It never exposes a generic write/update method.

Its named use cases cover:

- open Project, list/open Session, create Session, create next Draft revision;
- inspect selected files and confirm/publish one revision;
- start/cancel/reconcile Analysis Run;
- prepare/record disclosure, start/cancel Assistance Attempt, dispose Draft;
- accept Finding, save form/disposition, complete Case;
- publish/read/export report and project a complete reopen view.

### Business Ports

packages/ports/xanthil-desktop-decision-case.ts declares only:

1. DesktopDecisionCaseStore: named create/confirm/admit/terminal/publication/read
   operations that implement the exact SQLite/file protocol. It has no raw SQL,
   arbitrary path, table, key/value, transaction callback, or generic save.
2. DesktopLocalAnalysisExecution: one closed implementation/provenance
   description, one double-CSV membership-repurchase calculation, and one
   independent verification operation with exact business input/result,
   cancellation signal, and deadline.
3. DesktopRunEvidenceStore: begin one Desktop 3.0 bundle, append only the named
   immutable artifacts, terminalize once, and read one terminal bundle by exact
   UUIDv7. It exposes no arbitrary path, scan, delete, adopt, repair, version
   dispatch, or transaction callback.

The seven Run method names, closed argument/result shapes, and stable failures
are defined once in Exact Application and four-Port contracts below and are
normative here.

All methods reject unexpected lifecycle/order/bytes without repair. There is no
generic append, path argument, manifest patch, list, or read-in-progress method.
Product Core exports the single closed `validateDesktopRunManifest` validator;
the adapter may call it but cannot broaden it.

The existing `packages/ports/local-analysis.ts` remains compatibility authority
for `RunArtifactStore` and is unchanged for Run evidence. Its separately
approved additive `DecisionAssistanceRuntime` has:

- preflightSelection(requested neutral provider/model);
- executeAssistance(action, canonical payload bytes, cancellation signal,
  deadline seconds);
- cancel.

Existing AgentAnalysisRuntime, LocalAnalysisExecution, their definition
functions, and accepted implementation shapes do not change.

### Adapters

adapters/storage-local/xanthil-desktop-decision-case.ts owns Project-root
containment, node:sqlite connections, the exact DDL imported from
xanthil-desktop-schema.ts, immutable file publication, fsync/rename, hashes,
command receipts, reopen validation, and sanitized storage failures. It never
interprets the next business transition.

The same Desktop adapter file exports `createLocalDesktopRunEvidenceStore`.
It stages a complete static bundle beneath `.xanthil/runs`, exclusively renames
it to the UUIDv7 directory, uses temp-file/fsync/rename for later named files,
and writes terminal `run.json` last. It accepts only closed Desktop 3.0 values
already validated by Core and reads only an exact run ID. It does not import or
alter the old local-analysis or Console reader factories.

adapters/analytics-duckdb/xanthil-desktop-decision-case.ts owns the new
double-CSV DuckDB primary and Python independent implementations. It uses one
private subprocess/deadline/cancellation helper extracted from the existing
analytics Adapter; current fixture-specific public behavior remains unchanged.
SQL/Python code identity is captured in the Run/aggregate provenance.

adapters/agent-pi/local-analysis.ts adds the DecisionAssistanceRuntime factory
inside the existing Pi boundary. It translates Pi sessions, events, errors,
tools, and actual model observations to neutral results. It receives only
already-confirmed payload bytes and returns one normalized untrusted Draft or
sanitized failure. It has no storage, source-reader, report, or product-state
capability.

### Personal Desktop Profile

profiles/personal/xanthil-desktop.ts:

- reads the packaged toolchain-deployment.json;
- validates the exact DuckDB/Python executable paths and versions;
- composes Desktop store, deterministic analysis, Desktop Run evidence, and
  optional Pi assistance;
- enforces the one-instance Application writer boundary;
- returns one Desktop application surface to Main.

`composePersonalXanthilDesktopProfile(dependencies)` is the lower-level public
composition function and accepts the three mandatory business Ports plus
explicit `null` or one `DecisionAssistanceRuntime` for contract/integration
tests.
`createPersonalXanthilDesktopProfile(deployment)` is the normal production
factory. It supplies the storage/analysis/Run/Pi Adapters itself and returns a
closed Project opener; Main calls only that normal factory. The lower-level
composition seam is used directly by contract/integration tests, never by a
second Electron entry or package. No production Main/preload/IPC method,
environment switch, arbitrary transport, or Renderer/debug setting can select
an offline Runtime double.

The current profiles/personal/local-analysis.ts is unchanged.

### Electron surface

apps/desktop/main.ts owns application single-instance admission, BrowserWindow,
native Project/file/save choosers, process lifecycle, CSP/navigation/permission
denial, IPC transport, and mapping sanitized Application projections to
Renderer.

Native selections are process-scoped capabilities. Absolute Project/source/
export paths stay within Main and the scoped storage Adapter; the Renderer sees
display names, counts, identities, and business projections only. Reopen
requires the user to choose the Project again; there is no global recent-
Project database.

apps/desktop/preload.ts exposes the exact closed version-1 methods. Renderer
contains presentation and local form state only. Reload reconstructs from
Application and cannot infer/repair authority.

## Public contracts and factories

The following is the exact final acceptance seam. During the batch, only the
explicit internal subsets in “Incremental internal interface tuples” are
advertised; public IPC remains final from C1a. I4/CF restores this section
without an intermediate-only overload, type, branch, or dependency key. No implementation exports a
generic command, raw row, SQL callback, path, Electron event, provider SDK
value, or untyped record.

| Owner | Required public exports |
|---|---|
| Product Core | closed domain/form/result/Run types and validators, including `validateDesktopRunManifest` |
| Desktop Ports | `DesktopDecisionCaseStore`, `DesktopLocalAnalysisExecution`, `DesktopRunEvidenceStore` and `defineDesktopDecisionCaseStore`, `defineDesktopLocalAnalysisExecution`, `defineDesktopRunEvidenceStore` |
| local-analysis Port | additive `DecisionAssistanceRuntime` and `defineDecisionAssistanceRuntime`; every existing export remains unchanged |
| Application | `XanthilDesktopDecisionCaseApplication` and `createXanthilDesktopDecisionCaseApplication(dependencies)` |
| IPC contract | `XANTHIL_DESKTOP_CONTRACT_VERSION`, all named request/value/projection/result types below, `XanthilDesktopApi`, and `validateXanthilDesktopRequest` |
| local storage | `createLocalDesktopDecisionCaseStore(config)` and `createLocalDesktopRunEvidenceStore(config)` |
| analytics | `createDuckDbPythonDesktopLocalAnalysisExecution(config)` |
| Pi Adapter | `createPiDecisionAssistanceRuntime(config, injection?)`; `config` is exactly `{provider,model_id}` with two non-empty strings; optional direct test injection is exactly `{sdkSessionFactory}` with one callable, has the same closed factory-only status as the existing Pi seam, and is never passed by a Profile/Main/IPC value |
| Personal Profile | `composePersonalXanthilDesktopProfile(dependencies)` and `createPersonalXanthilDesktopProfile(deployment)` |
| Main/preload/Renderer | `createXanthilDesktopIpcHandlers(dependencies)`, `xanthilDesktopApi`, and `XanthilDesktopApp` for contract/UI tests; normal entry invokes those same exports |

All `define*` functions exact-shape validate and freeze the supplied
implementation. All factories take one closed object and reject extra/missing
keys. `createXanthilDesktopDecisionCaseApplication` takes exactly `{store,
analysisExecution,runEvidenceStore,assistanceRuntime,clock,deadlineScheduler}`;
`assistanceRuntime` is exactly `null|DecisionAssistanceRuntime`.
`createLocalDesktopDecisionCaseStore` and
`createLocalDesktopRunEvidenceStore` each take exactly `{projectRoot}`;
`createDuckDbPythonDesktopLocalAnalysisExecution` takes exactly
`{duckdbExecutable,duckdbVersion,pythonExecutable,pythonVersion}` after Profile
verifies the packaged descriptor. `createPersonalXanthilDesktopProfile` takes
exactly `{toolchainDeployment,assistanceConfig,clock,deadlineScheduler}` where
`assistanceConfig` is explicit `null` or the exact Pi config above, and returns
`{openProject}`. Its `openProject` accepts exactly
`{contract_version:"1.0",projectDirectoryCapability,display_name,command_id}`,
constructs the three mandatory production Ports and optional Pi Runtime for
that Main-held capability,
opens/reconciles the Project,
and returns `{application, value:ProjectOpenValue}`. It accepts no injected
Port/factory. The lower-level `compose*` factory takes exactly `{store,
analysisExecution,runEvidenceStore,assistanceRuntime:null|DecisionAssistanceRuntime,clock,
deadlineScheduler}`, performs no I/O by itself, and returns the scoped
`XanthilDesktopDecisionCaseApplication`.

`clock` is exactly a zero-argument function returning a valid `Date`; Application
calls it at each named admission/decision/terminal/publication boundary and
serializes the instant to the frozen millisecond UTC form. `deadlineScheduler`
is exactly `{schedule({at_epoch_ms,callback}):{cancel()}}`: epoch is a finite
safe-integer millisecond value, callback is a zero-argument function,
`cancel()` is idempotent and returns `undefined`. The scheduler only signals a
deadline; it creates no business record and never chooses the terminal winner.

### Common public values

- `ContractVersion` is only `"1.0"`; IDs are canonical UUIDs as frozen in
  structure-decision.md; timestamps, dates, decimals, rationals, enums, and
  canonical JSON use that document's exact forms.
- `OwnerRef` is exactly `{project_id, session_id, case_id, revision_id}`.
  `RevisionGuard` is OwnerRef plus `expected_row_version` (positive decimal
  string). `RevisionCommand` is `{contract_version:"1.0"}` plus RevisionGuard
  plus UUIDv4 `command_id`.
- Renderer creates one command_id with native `crypto.randomUUID()` for one
  explicit user intent and retains the complete immutable request until its
  terminal `DesktopResult`; duplicate transport delivery reuses those exact
  bytes/ID, while a new user intent uses a new ID. Main/Application never
  replace a caller command ID. Internal settle/reconcile commands are generated
  once by Application and retained with their admitted work identity.
- `CaseFieldsInput` is exactly `{question_text, hypothesis_display_title,
  business_context, alternative_explanations}`. The first three are strings;
  alternatives is an ordered string array.
- `DecisionCandidateInput` is exactly `{candidate_id:UUIDv4,title,
  evidence_basis,risk_or_refutation,applicability_conditions,
  future_validation_metric}`. Renderer uses native Web Crypto UUIDv4 for a new
  or duplicated manually authored candidate; Application validates canonical
  form/revision-local non-collision. Assistance candidate IDs remain
  Application-generated after Runtime validation.
- `SaveFormInput` is the closed union:
  `{kind:"case_fields", fields:CaseFieldsInput}`;
  `{kind:"evidence_explanation", evidence_explanation_text:string}`; or
  `{kind:"decision_closure", candidates:DecisionCandidateInput[], route:null|
  "candidate_comparison"|"insufficient_evidence", insufficient_reason:null|
  string, preferred_candidate_id:null|UUIDv4, preferred_reason:null|string,
  disposition:"draft"|"saved"|"not_adopted"|"deferred"|"more_evidence",
  defer_until:null|YYYY-MM-DD}`.
- `AssistanceDraftContent` is exactly one untagged content object selected by
  the owning Draft kind: `CaseFieldsInput` for `question_fields`;
  `{evidence_explanation_text:string}` for `evidence_explanation`; or
  `{candidates:DecisionCandidateInput[]}` for `candidates`. Request content
  must match the stored Draft kind; no discriminator or unknown key is added.
- `RuntimeAssistanceDraftContent` has the same question/evidence shapes; its
  candidate shape omits `candidate_id`. Application validates Runtime output,
  generates UUIDv4 IDs, and only then supplies persisted
  `AssistanceDraftContent` to Store.
- Every IPC result is exactly `{ok:true, value:T}` or
  `{ok:false, error:{code,message,what_did_not_happen,preserved_authority,
  recovery_action}}`. All five error values are non-empty strings; `code` is
  one stable public code listed below. No thrown/raw error crosses preload.

### Exact read projection

`DesktopProjection` has exactly these top-level keys:
`contract_version`, `projection_token`, `project`, `session`, `revision`,
`confirmation`, `snapshot`, `runs`, `disclosures`, `attempts`,
`assistance_drafts`, `findings`, `acceptances`, `forms`, `closures`, `reports`,
and `capabilities`. Arrays are oldest-first; `project` is non-null after a
successful Project open; `session`, `revision`, `confirmation`, and `snapshot`
are explicit structured-clone `null` until selected/created. No top-level key
is omitted.

| Value | Exact keys |
|---|---|
| project | project_id, display_name, schema_version, write_state (exactly `ready`) |
| session | session_id, project_id, display_name, mode, case_id, current_revision_id, created_at |
| revision | revision_id, revision_sequence, state, case_name, question_text, hypothesis_display_title, business_context, alternative_explanations, evidence_explanation_text, previous_revision_id, snapshot_id, confirmation_id, current_finding_id, current_acceptance_id, current_closure_id, current_report_id, integrity_state, created_at, updated_at, row_version |
| confirmation | confirmation_id, snapshot_id, `column_mapping` with the eight named nullable/non-null mappings, comparison_period, current_period, currency, time_zone, valid_statuses, issue_treatments, selected_group_mode, hypothesis_id, method_id, method_version, authority_confirmed_at, issues_confirmed_at, plan_confirmed_at |
| snapshot | snapshot_id; members/orders each `{display_name,sha256,byte_length}`; included/excluded member/order counts; treatment_basis; confirmed_at |
| run item | run_id, profile_id, method_id, method_version, code_identity, run_contract_version, status, started_at, deadline_at, ended_at, terminal_reason, aggregate_id, evidence_available |
| disclosure item | disclosure_id, action_kind, categories, aggregate_refs, payload_sha256, requested_provider, requested_model, decision, free_text_confirmed_at, decided_at, created_at |
| attempt item | attempt_id, disclosure_id, action_kind, profile_id, runtime_id, runtime_version, adapter_id, adapter_version, requested_provider, requested_model, actual_provider, actual_model, status, started_at, deadline_at, ended_at, terminal_reason, draft_id |
| assistance draft item | draft_id, attempt_id, draft_kind, generated_content, edited_content, disposition, target_form, decided_at, created_at |
| finding item | finding_id, run_id, aggregate_id, judgment, metrics, supporting_evidence, refutation, limitations, evidence_refs, method_id, method_version, created_at |
| acceptance item | acceptance_id, finding_id, action, accepted_at |
| form item | form_id, form_sequence, candidates, route, insufficient_reason, preferred_candidate_id, preferred_reason, disposition, disposition_at, defer_until, created_at, updated_at |
| closure item | closure_id, acceptance_id, form_id, route, completed_at |
| report item | report_id, finding_id, acceptance_id, closure_id, version_sequence, state, markdown_sha256, markdown_byte_length, html_sha256, html_byte_length, source, evidence_refs, created_at |
| capabilities | can_create_draft_revision, can_select_import, can_confirm_revision, can_start_analysis, can_cancel_analysis, can_prepare_assistance, can_start_assistance, can_cancel_assistance, can_dispose_assistance_draft, can_accept_finding, can_save_case_fields, can_save_evidence_explanation, can_save_decision_closure, can_complete_case, can_export_report; each boolean |

Projection JSON columns are decoded to the named arrays/objects; SQLite NULL is
projected as structured-clone `null`. Byte lengths/counts/row versions are
decimal strings. Project-relative locators, original group values, raw rows,
payload bytes after disclosure decision, and absolute paths are never projected.
`projection_token` is the committed row_version plus latest receipt identity,
opaque to Renderer and valid only for `waitForProjection` in the same Project.

### Exact Application and four-Port contracts

`XanthilDesktopDecisionCaseApplication` exposes exactly `openProject`, `listSessions`,
`openSession`, `createSession`, `createDraftRevision`, `inspectImportFiles`,
`confirmRevision`, `startAnalysis`, `cancelAnalysis`,
`prepareAssistanceDisclosure`, `decideAssistanceDisclosure`,
`startAssistance`, `cancelAssistance`, `disposeAssistanceDraft`,
`acceptFinding`, `saveForm`, `completeCase`, `prepareReportExport`,
`recordReportExport`, `readProjection`, `waitForProjection`, and
`reconcileInterrupted`. Inputs and outputs equal the IPC table below except for
five boundary translations: Profile calls `openProject` only after constructing
Project-scoped Ports from the Main-held capability; `inspectImportFiles`
replaces the chooser with
exactly two `{display_name,bytes}` values; `confirmRevision` additionally
receives the same two files re-read by Main from its token-bound capabilities;
`prepareReportExport` returns
`{report_id,file_name,media_type,bytes,sha256,byte_length}`; and
`recordReportExport` receives the original export command plus that descriptor
only after Main's native write and read-back hash succeed. The Profile, not the
Application, receives the opaque Project directory capability. Application
returns domain values or throws only a frozen `DesktopApplicationError` with a
stable public code; Main alone converts it to `DesktopResult`.

`DesktopDecisionCaseStore` has this exact method set. Every input is closed and
rejects extra keys. Exact open/read results are: `openProject` returns
`{opened:true,initialized,project_id,display_name,schema_version:"1.0",
projection_token}`; `listSessions` returns `SessionSummary[]`;
`readProjection`/`waitForProjection` return `DesktopProjection`;
`readConfirmedSnapshot` and `readReportExport` return the values in the table.
Each other database mutation returns `{committed:true,
result_kind,result_id,projection_token}` only after commit; the named physical
candidate publication returns its own descriptor result and performs no SQLite
visibility change:

- `openProject`, `listSessions`, `readProjection`, `waitForProjection`,
  `readConfirmedSnapshot`;
- `createSession`, `createDraftRevision`, `saveForm`, `publishConfirmation`;
- `admitAnalysis`, `publishAnalysisSuccessCandidates`, `settleAnalysis`,
  `requestAnalysisCancellation`;
- `recordDisclosure`, `admitAssistance`, `settleAssistance`,
  `requestAssistanceCancellation`, `disposeAssistanceDraft`;
- `acceptFinding`, `completeCase`, `markIntegrityBlocked`,
  `reconcileInterrupted`, `readReportExport`, and `recordReportExport`.

The exact method values are:

| Store method | Exact input after method-name expansion |
|---|---|
| openProject | `{contract_version:"1.0",command_id,proposed_project_id,display_name,initialized_at,input_fingerprint}`; Application supplies canonical time and business fingerprint per current U1.2 decision; absent database uses proposed UUID/name for initialization, while an existing valid Project returns its stored UUID/name and ignores the proposals after validation |
| listSessions | `{project_id}` |
| readProjection | `OwnerRef` |
| waitForProjection | `OwnerRef & {projection_token}` |
| readConfirmedSnapshot | `{...OwnerRef,confirmation_id}`; returns `{confirmation:{contract_bytes,binding_bytes,ir_bytes,contract_sha256,binding_sha256,ir_sha256},snapshot:{snapshot_id,members:{display_name,bytes,sha256,byte_length},orders:{display_name,bytes,sha256,byte_length}}}` only after locator/hash/length revalidation |
| createSession | `{command:CreateSessionRequest,ids:{session_id,case_id,revision_id,operation_id}}`; Store itself publishes the three empty Session directories before its transaction |
| createDraftRevision | `{command:CreateDraftRevisionRequest,ids:{revision_id}}` |
| saveForm | `{command:SaveFormRequest,ids:{form_id:null\|UUIDv4}}`; `form_id` is non-null only for `decision_closure` |
| publishConfirmation | `{command:ConfirmRevisionRequest,ids:{snapshot_id,confirmation_id,operation_id},source_files:{members:{display_name,bytes},orders:{display_name,bytes}},contract_bytes,binding_bytes,ir_bytes,counts,treatment_basis}`; Store rehashes the supplied bytes, publishes its own snapshot files, then commits descriptors/confirmation |
| admitAnalysis | `{command:StartAnalysisRequest,ids:{run_id},started_at,deadline_at,profile_id,method_id,method_version,code_identity}` |
| requestAnalysisCancellation | `CancelAnalysisRequest` |
| publishAnalysisSuccessCandidates | `{...RevisionGuard,run_id,operation_id,aggregate:{artifact_id,bytes,method_id,method_version,code_identity,columns,measurement_meanings,group_pseudonym_map},report:{report_id,markdown_bytes,html_bytes,source,evidence_refs}}`; while the Run is still Running, Store exclusively publishes its own aggregate and draft-report files and returns `{published:true,aggregatePublication,reportPublication}` without inserting rows/pointers/receipt |
| settleAnalysis | `{command:RevisionCommand,run_id,terminal}` where `terminal` is exactly `{status:"succeeded",runBundle,aggregatePublication,finding,reportPublication}` or `{status:"failed",reason}` or `{status:"cancelled",reason:"user_cancelled"}`; success descriptors must be Store-produced and are re-read/rehashed before commit |
| recordDisclosure | `{command:DecideAssistanceDisclosureRequest,disclosure_id,categories,aggregate_refs,payload_sha256,decided_at}` |
| admitAssistance | `{command:StartAssistanceRequest,ids:{attempt_id},runtimeSelection,started_at,deadline_at}` |
| requestAssistanceCancellation | `CancelAssistanceRequest` |
| settleAssistance | `{command:RevisionCommand,attempt_id,terminal}` where `terminal` is exactly `{status:"succeeded",draft_id,actual_provider,actual_model,draft_kind,generated_content}` or `{status:"failed",reason}` or `{status:"cancelled",reason:"user_cancelled"}` |
| disposeAssistanceDraft | `DisposeAssistanceDraftRequest` |
| acceptFinding | `AcceptFindingRequest & {acceptance_id,accepted_at}` |
| completeCase | `{command:CompleteCaseRequest,ids:{closure_id,report_id,operation_id},report:{markdown_bytes,html_bytes,source,evidence_refs},completed_at}`; Store publishes the final report pair itself before the closure transaction |
| markIntegrityBlocked | `{command_id,...OwnerRef,expected_row_version,reason_code}` |
| reconcileInterrupted | `{command_id,...OwnerRef,target_kind:"analysis_run"\|"assistance_attempt",target_id}` |
| readReportExport | `{...OwnerRef,report_id}`; returns `{report_id,suggested_file_name:"xanthil-report-<report_id>.html",media_type:"text/html;charset=utf-8",bytes,sha256,byte_length}` after HTML hash/length verification |
| recordReportExport | `{command:ExportReportRequest,descriptor:{display_name,media_type:"text/html;charset=utf-8",sha256,byte_length}}`; display_name is the selected non-empty basename ending `.html`, never a destination path |

Named `*Request` values are the exact expanded IPC request objects below,
including `contract_version`; Store verifies that version but never stores it
as a second business field. Every `bytes`, `*_bytes`, and source file value is
a `Uint8Array`; names are basenames, never paths. Only Store converts those
business bytes into the exact Project-relative locator/hash/decimal-byte-length
descriptors in structure-decision.md. Application/Core never manufacture a
publication descriptor or perform filesystem I/O. `contract`, `binding`, `ir`,
Finding, report, draft, and terminal values are their one closed Core types
defined in that document. There is no method-specific optional bag: nullable
fields are explicit, and `settle*` accepts only the stated union.
Reads return the exact projections above. Storage failures are only
`STORE_BUSY`, `SCHEMA_UNSUPPORTED`, `INTEGRITY_BLOCKED`, `RESULT_PENDING`,
`NOT_FOUND`, `COMMAND_CONFLICT`, or `INTERRUPTED` and expose no database/path.

`DesktopLocalAnalysisExecution` is exactly:

- `describeImplementation({})` returning `{method_id,method_version,
  code_identity,duckdb_version,python_version,primary_sql:RunBytes,
  python_verifier:RunBytes}`; these are the Adapter-owned packaged immutable
  implementation bytes/identities, not a path or generic asset reader;
- `calculate({run_id, expected_code_identity, contract,
  snapshot:{members_bytes,orders_bytes}, group_pseudonym_map,
  cancellation_signal, deadline_seconds})` returning the
  closed DuckDB calculation-output wrapper; and
- `verify({run_id, expected_code_identity, contract, snapshot:{members_bytes,orders_bytes},
  group_pseudonym_map, cancellation_signal, deadline_seconds})` returning the
  closed Python verification-output wrapper.

All reject extra keys; calculate/verify accept deadline_seconds integer 0..30
and require the described code identity. They fail only as
`SOURCE_CHANGED`, `TOOLCHAIN_UNAVAILABLE`, `CALCULATION_FAILED`, `CANCELLED`,
or `DEADLINE_EXCEEDED`. They never accept one another's output.

`DesktopRunEvidenceStore` has exactly seven methods. `RunBytes` is exactly
`{bytes:Uint8Array,sha256,byte_length}` with lowercase SHA-256 and bounded
decimal-string length; Store recalculates both descriptor values and rejects a
mismatch. Every cancellation_signal is the standard platform `AbortSignal`.
`DesktopTerminalRunBundle` is exactly
`{run_id,locator,manifest,manifest_sha256,descriptors}` where locator is the one
Project-relative Run directory, manifest is a Core-validated terminal 3.0
value, and descriptors are its exact ordered confirmation/source/artifact plus
optional evidence descriptors.

| Run method | Exact input | Exact result |
|---|---|---|
| beginRun | `{run_id,initial_manifest,confirmation_files:{contract:RunBytes,binding:RunBytes,ir:RunBytes},code_assets:{primary_sql:RunBytes,python_verifier:RunBytes},cancellation_signal}` | `{run_id,locator,in_progress_manifest_sha256}` |
| recordDuckDbResult | `{run_id,expected_in_progress_manifest_sha256,bytes:Uint8Array,cancellation_signal}` | `{descriptor,in_progress_manifest_sha256}` |
| recordPythonResult | `{run_id,expected_in_progress_manifest_sha256,bytes:Uint8Array,cancellation_signal}` | `{descriptor,in_progress_manifest_sha256}` |
| succeedRun | `{run_id,expected_in_progress_manifest_sha256,evidence_bytes:Uint8Array,summary_bytes:Uint8Array,evidence_document_bytes:Uint8Array,terminal_manifest,cancellation_signal}` | `DesktopTerminalRunBundle` |
| failRun | `{run_id,expected_in_progress_manifest_sha256,terminal_manifest,cancellation_signal}` | `DesktopTerminalRunBundle` |
| cancelRun | `{run_id,expected_in_progress_manifest_sha256,terminal_manifest,cancellation_signal}` | `DesktopTerminalRunBundle` |
| readTerminalRun | `{run_id}` | `DesktopTerminalRunBundle` |

`initial_manifest` is exactly the Core-validated in-progress 3.0 value with two
initial artifacts; each record method validates the expected active manifest,
publishes only its named output, rewrites only the active in-progress manifest,
and returns the new identity. `succeedRun` requires the four-artifact prefix and
publishes evidence/summary/evidence-document plus terminal run.json last;
fail/cancel allow only the durable prefix. All methods reject extra keys.
Stable Port failures are only `RUN_CONTRACT_UNSUPPORTED`,
`VALIDATION_FAILED`, `NOT_FOUND`, `INTEGRITY_BLOCKED`,
`RUN_ARTIFACT_FAILED`, or `CANCELLED`. The factory config is exactly
`{projectRoot}`. It exposes no path argument, generic file method, scan, list,
adoption, or repair.

`DecisionAssistanceRuntime` is exactly:

- `preflightSelection({requested_provider,requested_model})` returning
  `{runtime_id,runtime_version,adapter_id,adapter_version,requested_provider,
  requested_model,ready}`;
- `executeAssistance({action_kind,payload_bytes,payload_sha256,
  requested_provider,requested_model,cancellation_signal,deadline_seconds})`
  returning `{actual_provider,actual_model,draft_kind,draft_content}` with the
  matching closed `RuntimeAssistanceDraftContent`; and
- `cancel()` returning `{cancelled:true}`.

Deadline is integer 0..300. The Runtime has no source reader, report/store
method, transcript return, generic tool, or path. Its stable failures are
`PROVIDER_UNAVAILABLE`, `CANCELLED`, `DEADLINE_EXCEEDED`, `INTERRUPTED`, and
`VALIDATION_FAILED`. Pi-specific events/errors remain inside the Adapter.
When the composed Runtime is `null` or preflight returns `ready:false`,
startAssistance returns `PROVIDER_UNAVAILABLE` before Attempt admission and
network; the accepted disclosure remains visible and manual editing remains
available. A failure after durable admission settles exactly that Attempt.

## Closed IPC contract

packages/contracts/xanthil-desktop-ipc.ts owns immutable structured-clone
request/result/projection types. The named aliases below are structural
expansions, not a generic command protocol: intersection means the request has
exactly the union of those named keys and no others. `CV` is exactly
`{contract_version:"1.0"}`; `PC` is `CV & {command_id:UUIDv4}`; `PR` is
`{project_id:UUIDv4}`; `SR` is `PR & {session_id:UUIDv4}`; `OwnerRef`,
`RevisionGuard`, and `RevisionCommand` are defined above.

`validateXanthilDesktopRequest(method,value)` is the one public read-only IPC
request validator. For a method key from `XanthilDesktopApi`, its TypeScript
return is that existing method's exact request parameter type; this correlation
is derived from `XanthilDesktopApi`, not a second command map or generic invoke
protocol. At runtime an unknown method, missing/extra/wrong key, invalid
contract version, ID, enum, decimal string, or non-structured-clone value throws
before any effect with stable code `INVALID_REQUEST`; success returns the exact
validated immutable request value. Main uses this validator before Application
dispatch. Method-specific result validation remains inside the existing closed
Main/preload mapping and does not require another public validator export.

Supporting values are exact:

- `SessionSummary` is `{session_id,display_name,mode:"professional",case_id,
  current_revision_id,created_at}`.
- `ProjectOpenValue` is `{project:{project_id,display_name,schema_version:"1.0",
  write_state:"ready"},sessions:SessionSummary[]}`. An unsupported/malformed/
  integrity-failed existing database returns a sanitized failure instead; it is
  never projected as a recognized product Project.
- `ImportInspection` is `{inspection_token,members,orders,column_mapping,
  blocking_issues,reviewable_issues,period_controls,status_controls}`.
  Each file is `{display_name,sha256,byte_length,row_count,column_names}`;
  `column_mapping` has the eight named nullable candidate arrays from the
  confirmation projection; every issue is `{code,count,treatment_options}`;
  period controls are `{minimum_date,maximum_date,allowed_time_zone:
  "Asia/Shanghai",equal_duration_required:true}`; status controls are
  `{observed_statuses,selected_valid_statuses}`. Counts/lengths are decimal
  strings and no row value/path/raw identifier is present.
  The token is a process-local UUIDv4, not a persisted entity or authority.
- `ConfirmationInput` is exactly `{column_mapping,comparison_period,
  current_period,currency:"CNY",time_zone:"Asia/Shanghai",valid_statuses,
  issue_treatments,selected_group_mode:"none"|"mapped",hypothesis_id:
  "current_repurchase_rate_lower_than_comparison",method_id:
  "membership_repurchase_comparison",method_version:"1.0",
  authority_confirmed:true,issues_confirmed:true,plan_confirmed:true}`.
  Each period is `{start_date,end_date}`; each issue treatment is
  `{code,count,treatment}` in displayed order.
- `DisclosurePreview` is `{preview_token,action_kind,categories,
  aggregate_refs,payload_text,payload_sha256,requested_provider,
  requested_model,irretractability_notice,cost_notice:null|string,
  free_text_present}`. It is transient and never stored.
  `preview_token` is a process-local UUIDv4 bound to OwnerRef, row version,
  requested provider/model, exact payload bytes/hash, and action. Application
  retains only the latest preview per OwnerRef/action; replacement, Project
  close, or process exit invalidates it, and a decision consumes it. Accepted
  start rebuilds the payload from committed authority and requires the stored
  hash to match; restart therefore requires no persisted payload bytes.
- `ExportValue` is `{report_id,file_name,media_type,sha256,byte_length}` where
  file_name is the selected non-empty `.html` basename and media type exactly
  `text/html;charset=utf-8`; it contains neither bytes nor destination path.

Preload exposes exactly these methods with the exact request and success value:

| Method | Exact request | `DesktopResult` success value |
|---|---|---|
| selectProject | `PC` | `ProjectOpenValue` |
| listSessions | `CV & PR` | `SessionSummary[]` |
| openSession | `CV & SR` | `DesktopProjection` |
| createSession | `PC & PR & {display_name,case_name,fields:CaseFieldsInput}` | `DesktopProjection` |
| createDraftRevision | `RevisionCommand` | `DesktopProjection` |
| selectImportFiles | `CV & RevisionGuard` | `ImportInspection` |
| confirmRevision | `RevisionCommand & {inspection_token,confirmation:ConfirmationInput}` | `DesktopProjection` |
| startAnalysis | `RevisionCommand & {confirmation_id}` | `DesktopProjection` |
| cancelAnalysis | `RevisionCommand & {run_id}` | `DesktopProjection` |
| prepareAssistanceDisclosure | `CV & RevisionGuard & {action_kind,requested_provider,requested_model}` | `DisclosurePreview` |
| decideAssistanceDisclosure | `RevisionCommand & {preview_token,payload_sha256,decision:"accepted"|"refused",free_text_confirmed:boolean}` | `DesktopProjection` |
| startAssistance | `RevisionCommand & {disclosure_id}` | `DesktopProjection` |
| cancelAssistance | `RevisionCommand & {attempt_id}` | `DesktopProjection` |
| disposeAssistanceDraft | `RevisionCommand & {draft_id,disposition:"adopted"|"rejected",edited_content:null|AssistanceDraftContent}` | `DesktopProjection` |
| acceptFinding | `RevisionCommand & {finding_id}` | `DesktopProjection` |
| saveForm | `RevisionCommand & {form:SaveFormInput}` | `DesktopProjection` |
| completeCase | `RevisionCommand & {acceptance_id,form_id}` | `DesktopProjection` |
| exportReport | `PC & OwnerRef & {report_id}` | `ExportValue` |
| readProjection | `CV & OwnerRef` | `DesktopProjection` |
| waitForProjection | `CV & OwnerRef & {projection_token}` | `DesktopProjection` |

All bare string keys in this table use the exact types defined in the common
values/projection/structure sections. `listSessions`, `openSession`,
`selectImportFiles`, `prepareAssistanceDisclosure`, `readProjection`, and
`waitForProjection` are non-effecting and therefore have no command ID or
receipt. Native chooser cancellation returns `CANCELLED` and creates no
receipt. `selectProject` may initialize only an absent recognized target;
opening an existing Project is read/reconcile plus the bounded receipts already
defined. `XanthilDesktopApi` is exactly this twenty-method object.
For `decideAssistanceDisclosure`, `free_text_confirmed` must be `true` exactly
when the decision is accepted and the preview contains free text; otherwise it
must be `false`.

Main registers exactly one channel per method as
`xanthil-desktop:v1:<method>`. Each handler first validates sender/frame and
then the method-specific minimal envelope defined above. A valid-envelope
inactive method or inactive `saveForm` tag returns the sanitized `FORBIDDEN`
development-incomplete result at that point, without parsing its future
business payload or reaching any effect. An active method next applies its
complete exact request validator and then Application owner/state validation.
`selectProject`
alone invokes the directory chooser and production Profile opener;
`selectImportFiles` alone invokes the exact two-file chooser, reads bytes in
Main, and passes only names/bytes to Application. Main retains exactly the
latest selected capability pair per OwnerRef under the returned inspection
token; a later selection replaces it, successful confirmation consumes it,
and Project close/process exit discards it. On `confirmRevision`, Main resolves
the token, re-reads both capabilities, and Application requires owner/row
version and both hashes/bytes to match its process-local inspection cache before
snapshot publication. Restart therefore requires re-selection and mutation is
effect-free. `exportReport` alone prepares
bytes, invokes the save chooser, writes/flushes/reads back, then records the
export. All other handlers call the same-named Application method. Preload maps
the twenty fixed channels one-for-one and returns only the validated
`DesktopResult`; it exposes no channel name, ipcRenderer, capability, bytes, or
path.

`createXanthilDesktopIpcHandlers` takes exactly `{productionProfile,
nativeDialogs,sourceReader,exportWriter,senderPolicy}`. The three native-dialog
methods return opaque Main-only capabilities for one Project directory, exact
members/orders file pair, or one export target; `sourceReader` turns only the
two selected file capabilities into `{display_name,bytes}`;
`exportWriter.writeAndReadBack` accepts one target capability and prepared
bytes and returns only hash/byte-length verification; `senderPolicy` accepts
only the packaged top frame. None is exported through preload.
`XanthilDesktopApp` takes exactly `{api:XanthilDesktopApi}`; the normal Renderer
passes `xanthilDesktopApi`, and component tests may pass only another exact
twenty-method implementation.

There is no generic invoke, arbitrary channel, filesystem/path method, SQL,
shell/process command, callback carrying Electron events, or raw IPC value.
waitForProjection is a promise-based named read that returns structured-clone
business data only; it exposes no callback, Electron event, or channel.

Results are exactly one of:

- success with the method-specific immutable value; or
- failure with code, plain-language message, what_did_not_happen,
  preserved_authority, and one recovery_action.

Stable public failure codes are:

- INVALID_REQUEST, FORBIDDEN, NOT_FOUND, STALE_REVISION, COMMAND_CONFLICT;
- VALIDATION_FAILED, AUTHORITY_REQUIRED, ISSUE_CONFIRMATION_REQUIRED;
- BUSY, STORE_BUSY, RESULT_PENDING, SCHEMA_UNSUPPORTED, INTEGRITY_BLOCKED;
- SOURCE_CHANGED, TOOLCHAIN_UNAVAILABLE, CALCULATION_FAILED,
  VALIDATION_MISMATCH, RUN_ARTIFACT_FAILED, PUBLICATION_FAILED;
- PAYLOAD_STALE, PROVIDER_UNAVAILABLE, CANCELLED, DEADLINE_EXCEEDED,
  INTERRUPTED.

Raw SQLite, process, provider, Pi, Electron, and stack errors never cross IPC.

## Primary flows

### Open Project and create Session

1. Native chooser returns a Project capability held by Main/scoped storage.
2. Store validates containment and opens/creates only schema 1.0.
3. Renderer retains its command UUID for this user intent; Application
   allocates Project/Session/Case/revision/operation row IDs. On duplicate
   delivery Store checks the receipt/fingerprint before touching newly supplied
   server IDs and returns the original result.
4. Store stages the complete Session directory with three children, fsyncs,
   exclusively renames, then commits Project if needed, Session, first Draft,
   current revision, and command receipt in one transaction.
5. UI receives a usable projection only after commit.

A create failure follows the exact orphan/receipt/unknown-commit behavior in
structure-decision.md.

### Inspect and confirm input

1. Main obtains exactly one members.csv and orders.csv through a native chooser.
2. Main's selected-capability reader supplies names/bytes; Core parses/validates and
   returns display names, bytes, row/column counts, mappings, blocking/
   reviewable issues, period/status controls, and zero provider effect.
3. User confirms authority, each reviewable treatment, mapping, periods,
   status selection, H1, and plan.
4. On confirm, Main re-reads its token-bound capabilities; Application compares
   the cached and re-read bytes/hashes, rejects mutation, and Core creates
   canonical Contract/Binding/IR bytes.
5. Application calls `publishConfirmation` with those validated source and
   canonical bytes. Store alone stages/fsyncs/renames the snapshot directory,
   then one DB transaction advances the
   same revision to Ready and records its receipt/current references.

Any later computation edit creates a new Draft revision.

### Deterministic Analysis Run

1. Application reads the closed Adapter implementation description and uses
   its method/code/tool identities and code assets; no Core/Application file
   read or path is involved. It opens BEGIN IMMEDIATE admission through Store,
   checks no Running
   Run/Attempt, inserts Run plus receipt, commits, and starts the 300-second
   deadline only from its recorded start.
2. Application calls `readConfirmedSnapshot`; Store starts from committed rows,
   verifies locators/hashes/lengths, and returns only the exact source and
   Contract/Binding/IR bytes. Application builds the closed 3.0 manifest and
   calls Desktop Run `beginRun` with those confirmation bytes and the two
   Adapter-described code assets. The current local-analysis store is never used.
3. DuckDB and Python each receive the Store-returned snapshot bytes, same
   contract and pseudonym map, and at most 30 seconds/remaining
   budget; Python independently receives the same contract, not DuckDB output.
4. After each result, Application calls only its corresponding named Run record
   method. Core compares exact results, computes judgment and pure aggregate/
   draft-report/evidence bytes, and rejects mismatch.
5. Application calls `publishAnalysisSuccessCandidates` with aggregate/report
   bytes. Store alone stages and exclusively publishes the verified 020_clean
   and draft-report candidates and returns descriptors without SQLite
   visibility. Application gives those descriptors to Core evidence and calls
   `succeedRun`; the Run store verifies every hash/count, publishes its
   evidence/docs, and writes terminal 3.0 `run.json` last.
6. Application re-presents only the Store-produced descriptors and re-read
   terminal bundle to `settleAnalysis`. Only then may one SQLite transaction mark the Run
   Succeeded, set `run_contract_version`/`run_locator`, append Finding/draft
   report, advance current references/state, and write the receipt.
7. UI enters Review only after commit.

The database transaction never spans the external calculations. File
publication without the final DB commit is an inert unreferenced candidate;
Desktop list/open never scans or adopts it. A committed Succeeded row without a
verified terminal 3.0 bundle is invalid and reopens as an integrity block, not
as visible success.

### Assistance

1. Application validates action guard and builds the complete canonical payload
   from allowed categories.
2. Renderer displays requested provider/model, exact text/JSON, categories,
   hash, irretractability, and cost; free text has a second confirmation.
3. Refusal records the disclosure only and returns to manual editing without
   Runtime/network.
4. Acceptance is committed. startAssistance re-hashes live inputs; stale bytes
   reject effect-free. Missing/not-ready Runtime rejects before admission and
   network with no fabricated runtime identity.
5. A ready selection lets Store atomically admit one Attempt only when no
   Run/Attempt is Running.
6. Pi Adapter receives only canonical confirmed bytes. Terminal winner is
   persisted once.
7. Success creates a labeled pending Draft; adoption/rejection is a later
   command. No Assistance result changes Case or Run state.

### Finding, Closure, report, and export

1. Run success creates Review, a Finding, and a draft report.
2. acceptFinding appends acceptance only.
3. saveForm preserves Case fields, evidence explanation, candidate Draft, and
   explicit non-closure history according to its closed union.
4. completeCase revalidates the exact acceptance and saved route, stages the
   Markdown/HTML final report pair, then atomically appends Closure/final report
   and current references and keeps state Completed.
5. exportReport reads verified immutable report bytes and writes only to the
   path chosen by the native save dialog. Export is not a new Finding/Closure.

## Publication and unknown outcome

Ordinary artifact-producing operations use the exact order:

    validate -> stage -> flush/fsync -> exclusive rename -> BEGIN IMMEDIATE
    -> revalidate -> records/current references/receipt -> COMMIT -> success

DB COMMIT is the business-visibility point. Run success has one explicit
specialization: terminal 3.0 `run.json` is published after aggregate/report
candidates and is the physical evidence point; a later single SQLite commit is
the sole Application-visibility point. If that commit rolls back or a crash
precedes it, the terminal bundle remains immutable/unreferenced and the
existing Running row is terminalized only in SQLite as publication_failed or
interrupted, with no locator. Unknown COMMIT reads the exact row; unreadable
state yields RESULT_PENDING/结果待核对 and blocks resend. No terminal rewrite,
adoption, same-command retry, external file transaction, or two-phase
coordinator is claimed. All other orphans are inert.

## Concurrency, cancellation, deadline, and restart

- One Application writer serializes transition transactions.
- Partial indexes plus a same-transaction cross-table check enforce Run/Attempt
  exclusion.
- Duplicate commands never start work twice.
- Absolute deadline is checked before each call and again before publication.
- Cancellation closes normal publication and requests Adapter cleanup.
- Deadline stops new tool admission and terminates/bounds local children.
- First committed terminal result wins; late values are discarded.
- Reopen writes Running to Failed/interrupted once, with no external resume.
- Completed and prior accepted authority never downgrade.

## Data disclosure and provenance

| Data | Authority | Provider eligible |
|---|---|---|
| selected external files before confirmation | user-owned local source | never |
| 010_draw snapshot | immutable raw authority | never |
| 020_clean aggregate | verified deterministic artifact | exact approved subset for eligible actions |
| user-authored text | revision form | only exact disclosed bytes and second confirmation |
| `.xanthil/runs` Desktop 3.0 bundle | separate deterministic Run authority; adopted only by a committed Succeeded row | referenced metrics/categories only |
| 060_reports | immutable report projection | never automatic input |
| Pi session/events/transcript | Pi Adapter private | never persisted as product history |

Every assistance result records requested and observed Runtime/Adapter/model
separately. Deterministic analysis records neutral method/tool provenance,
fixed source order, and `model_usage: "none"`; provider/model/Runtime/Pi keys
are prohibited from its manifest.
Authorized local authority surfaces are narrowly distinguished from prohibited
surfaces. User-selected source files while held by Main/scoped storage or the
Application's process-local inspection cache, their
immutable `010_draw` snapshot copies, permanent synthetic CSV fixture inputs,
calculation-process stdin/in-memory bytes, and local
`group_pseudonym_map_json` necessarily may contain raw member/order identifiers
or original group values. Those surfaces remain local, are never provider
eligible, and test fixtures contain only synthetic identities and no secret or
real user data.

Credentials, real user data in tests/evidence, environment values, absolute
paths, raw rows, raw member/order identifiers, and original group values are
prohibited from disclosure previews/payloads, the Pi Adapter facade/transport
boundary, provider calls, persisted disclosure/Attempt/Draft history,
Renderer IPC/projections, logs/errors/traces, reports/exports, Run evidence,
aggregate files, screenshots, and acceptance evidence. Privacy tests capture
the exact outbound bytes at the Pi Adapter facade/transport seam and inspect
all those persisted/projected/report/log surfaces. They do not assert that the
authorized synthetic input CSV or its local snapshot lacks raw identifiers;
they separately prove those inputs are synthetic and credential-free.

## Build, local toolchain, and package

dependency-decision.md freezes P4/P5 manifest and config. The packaging helper
verifies JUANERAI_TOOLCHAIN_BIN and emits only the two approved tool entries.
The Profile rejects descriptor drift; it never searches or installs.

The final compatibility contract has two coherent states, exact P4 and exact
P5. During the approved batch only, the finite C1a/C1b/C1/C2/C3 states in
dependency-decision.md are additionally coherent. They keep the P5
manifest/build inventory and differ only by their exact ordered Desktop
tsconfig appendix and one literal focused runner command list. The runner has
no runtime phase branch or environment selector. TEST-XCLI-021 compares every
active state to independent literals and rejects mixed/partial values; it does
not read actual values as its oracle. CF deletes the intermediate cases and
restores P4/final-P5-only recognition. Lock checks, TEST-XCLI-022, old business
assertions and dependency identities never change.

The completed compatibility repair had no production component:

    refreshed Spec Gate PASS (complete)
      -> narrow Test: one existing file / TEST-XCLI-021 only (complete)
      -> focused TEST-XCLI-021 + TEST-XCLI-022 GREEN (complete)
      -> coordinator complete canonical baseline (PASS retained)
      -> four explicit unchanged Console suites (PASS retained)
      -> P4 PASS (retained)
      -> incremental U1.1 Test after new affected Gate PASS (pending)

The narrow Test result did not issue RED or TDD_READY. That one-file permission
is closed and is not reopened by recovery. No install, Electron installer,
P1/P2/P3 probe, full canonical baseline, or Console suite is replayed merely to
recover Product Test. Worker remains locked until the recovered Test completes
its frozen first matrix and establishes valid TDD_READY.

Forge/Vite builds one ASAR-backed unsigned arm64 .app with no makers. Production
loads relative local resources. BrowserWindow security, CSP, navigation/window/
permission denial, and sender validation are explicit code and test surfaces.

## Test and acceptance boundaries

TEST-XDESK group names are traceability labels, not a mandate for an additional
Core export, one production layer, one callable, or one Test file. Direct
pure-Core proof is limited to the already named
`validateDesktopRunManifest`; the CSV, calculation, Case-state, Assistance,
Closure, and forbidden-effect rules are observable through the exact
Application methods and business Ports above. Tests use those public calls with
real Core and real storage-local/SQLite/files/processes whenever the behavior
crosses those boundaries. Existing Test assets may allocate one logical group
across their unit, contract, and integration files without changing its AC
ownership or inventing a complete-scenario production interface.

Deterministic publication-failure evidence uses only scoped Test-process native
control around the real filesystem, `node:sqlite`, or owned-child boundary. The
control forwards unaffected operations, proves the named boundary was reached,
is restored before the Test leaf ends, and observes the public result plus
physical/committed authority. The particular platform hook or interception
technique is non-normative. This authorizes no production fault/debug switch,
fault Port, registry, public helper table, fake Core/Application/Store, or
arbitrary Profile/Main transport. COMMIT response loss still means the real
COMMIT is durable before its response becomes unavailable; real process-
interruption evidence still terminates the owned process.

Automated evidence has one package: the same frozen production `.app` is used
for automated packaged GUI checks and the separate normal no-debug launch.
There is no test-only Electron entry, second build, product injection API,
production selector, or arbitrary transport.

Offline contract/integration tests use real Core/Application/store/SQLite/files
and inject only a `DecisionAssistanceRuntime` double through the lower-level
composition factory. They drive success, failure, cancellation, stale payload,
and disclosure refusal, and create real committed synthetic Projects including
pending question/evidence/candidate Drafts and failed Attempts. After the test
writer closes the Project and all writers, the frozen production `.app` opens
those same Projects through its real Main/Profile/preload/IPC/Renderer and
proves the visible pending/failed state, edited adoption or rejection, manual
fallback, save, close, and reopen behavior. This is synthetic persisted-state
arrangement; it does not claim that production Main called a Provider.

The same production `.app` additionally proves disclosure preview/refusal,
unconfigured-provider unavailable behavior, deterministic analysis, native
Project/two-file/save choosers, exit/reopen, packaging, and security. The
separate Pi Adapter contract suite uses its direct factory injection seam to
prove neutral Adapter success/failure translation, but that is not packaged
injection or provider-quality evidence. Normal no-debug acceptance repeats the
real Main/Profile manual path with no test double. Real provider and provider
quality remain NOT RUN. Source-only, direct-IPC-only, dev-server, snapshot, or
fixture-replay evidence cannot replace an assertion required in the real
packaged Renderer.

## Activation, rollback, and compatibility

Activation is a Personal Desktop Profile composition after every lifecycle
Gate. Rollback disables that composition and preserves database/files. Schema
1.0 has no downgrade/migration. Existing CLI/Profile/Run behavior and all
baseline tests remain. Quick/Fork/Subagent/general Skill/Prompt stay Preview.
