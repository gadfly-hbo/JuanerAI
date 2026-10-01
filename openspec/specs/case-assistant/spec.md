# Accepted Case Assistant and Provider Settings baseline

Accepted 2026-09-30 by the user after candidate010 / DMG011 delivery. Source and final acceptance: [Change002 archive](../../changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/acceptance.md). Read this baseline alongside the retained Desktop and local-analysis specifications. The requirement body below retains the accepted Change, with only the Fork/Subagent Preview statements reconciled with the [accepted collaboration baseline](../case-collaboration/spec.md); chronological candidate/evidence and formerly pending acceptance notes describe history, superseded by the archive acceptance record. Bare Provider input filenames resolve within that archive. This publication grants no new Provider, data or product authority.

---

# Case Assistant — incremental behavior specification

Normative inputs: frozen product plan §4–12 and UI Contract UI-00–20, both under
`docs/planning/2026-09-28/`. Existing canonical Desktop/local-analysis requirements
remain unchanged except Quick's approved Case-bound capability and readonly
built-in Skill/Prompt. User-directed Fork/Subagent now follow the accepted
[collaboration baseline](../case-collaboration/spec.md); unrelated capabilities stay Preview.

## Validator correction acceptance (candidate-003 work)

These restore existing acceptance without changing persistent schemas or authority.
- V01 / REQ-CA-004/005 / AC-04 / UI-11–14: opening edit, reject or adopt captures
  the reviewed Session/draft/version. A later projection cannot substitute another
  target; changed identity/version blocks submission and requires fresh review.
- V02 / REQ-CA-003 / AC-06 / UI-09: Stop reaches Application independently of
  pending start/send responses; show stopping immediately and prevent more input.
  A delayed earlier start/send/read response cannot restore Running/Waiting after
  the Stop result or admit another model turn/tool. The confirmation modal closes
  on authorized submission so mouse and keyboard can reach Stop while awaiting it.
- V03 / REQ-CA-003 / AC-06/09: failure saving the first user event after Attempt
  creation settles that Attempt Failed, with no runtime/formal effect. The user
  can explicitly start a new Attempt after the transient storage error clears.
- V04 / REQ-CA-001/006 / UI-01: top Professional switch reads the associated
  source and opens stage 6 after first link, reopen or another professional Case;
  switching back preserves Quick history and draft.
- V05 / REQ-CA-002 / UI-05/10: authorization compares selected history/report
  identities as sets, independent of click order; unselected history stays excluded.
- V06 / REQ-CA-004 / AC-13 / UI-12: valid ISO timestamps with explicit timezone
  are accepted and normalized to UTC milliseconds; impossible calendar/time/offset
  values and timezone-free input reject; cancelling edits preserves prior bytes.
- Recovery / REQ-CA-003/005 / AC-06/08/09: real process exit/crash with Running
  or Waiting history reopens Interrupted with no automatic runtime execution.
  Unreadable COMMIT outcome blocks mutations until verified reopen/receipt;
  replay remains exactly once. Add coverage without inventing RED if already correct.

Focused seams: existing Core unit, real Application + SQLite integration, Store
contract and packaged native UI suites. Preserve original assertions; synthetic
transport only. Each correction records causal RED before implementation; final
package, native and canonical evidence bind new immutable IDs.

## REQ-CA-001 Source and independent Session (AC-01,07,09; UI-01–04,15,17)

Input is an existing Project and explicit professional Session/Case/revision.
Return a linked Quick Session only with a verified current Completed revision,
accepted Finding, valid Closure and final report; otherwise show each missing
prerequisite and professional return. Never convert a professional Session.
Read-only history remains available after the source changes. New revision makes
old drafts ineligible; rebind creates a new Attempt, excluding old model,
evidence, finding, report and receipt context. Only individually reauthorized
user-authored constraints may cross revision. Mode switch alone preserves state.

## REQ-CA-002 Exact authorization (AC-02,04; UI-05–08,19)

Prepare a local authorization preview with exact initial text, explicit source,
Provider/Model, data categories, exact 020_clean artifact/hash/field/aggregate
scope, selected historical items and report summaries, business tools, turn,
active-time, waiting-deadline and monetary caps, built-in Skill/Prompt versions.
Start requires a matching unchanged preview, task confirmation and separate
free-text confirmation; missing selection/caps/Provider grant rejects with no
runtime call. Any source/provider/model/category/tool or budget expansion creates
a new preview and new Attempt. Each later Send is the exact visible text; no
implicit clipboard, attachment, file path, log or unselected local history.
Persist every actual model payload locally before issuing it. Audit is process
history, never business authority. Single-shot assistance retains its own gate.

## REQ-CA-003 Bounded collaboration (AC-03,06,09; UI-07–10)

A selected runtime can return advice, a question, a bounded business-tool request
or a structured draft; only Application executes authorized tools and validates
results. Allow only verified Case/evidence/finding/limitations/candidates,
approved aggregate subset and selected report summaries. No raw sources,
arbitrary file/SQL/Shell/Web/other Case or Session, writes, forks or subagents.
This Runtime-tool prohibition remains: user-directed root creation under the
[collaboration baseline](../case-collaboration/spec.md) does not authorize model-autonomous
creation, recursive dispatch or a child creating another child.
The runtime result contains exactly Provider, Model, measured cost and output. Question/advice contains exactly kind and text; draft exactly kind and fields, with the existing closed Decision/Outcome field schema. A tool request contains exactly kind, authorized tool name and source revision; extra fields are rejected before tool work or another model turn. Tool receipts show business action, object/revision, time, readonly marker,
status and exact outbound result. Out-of-scope/invalid requests are refused.

Before every model turn and tool admission recheck source, authorization,
terminal state and budgets. Stop closes admission immediately, aborts runtime,
and wins over late output; already-issued readonly work may leave a terminal
receipt but no draft/formal publication after stop. Active model time excludes
waiting; waiting has an explicit independently advancing deadline and allows
Stop. Exhaustion, timeout, provider/validation failure, application/session close
terminate Attempt. Reopen marks all surviving Running/Waiting attempts
Interrupted; never restores a Pi session. Continue always creates a new Attempt
with individually disclosed selected history and the same explicit formal
baseline until a rebase is requested. A complete valid earlier draft can remain
reviewable after interruption; incomplete output cannot become a draft.

## REQ-CA-004 Draft and human control (AC-04,05,12,13; UI-11–13)

A draft contains choice (existing candidate / no action / defer), rationale,
owner, confirmation time, accepted Evidence/Finding references, compared
alternatives, limitations/unknowns; Expected Outcome contains sourced baseline,
observed object/metric, expected direction/range/uncertainty, observation window,
guardrails, future result source/owner and assessment arrangement/owner. No
invented DecisionCandidate is accepted. Defer requires trigger/owner; no action
or defer may use an inapplicable Outcome with reason/reassessment trigger/owner.
Validate all semantics and reference membership. Advice cannot substitute for a
draft. Field editing covers all fields; save creates an attributed draft version,
cancel leaves prior bytes. Reject confirmation persists rejection/time/reason
but no formal change. Cancellation of pending formal revision creates no formal/report version; its draft disposition remains auditable.

## REQ-CA-005 Atomic adoption and history (AC-07–09,11,13; UI-14–17)

Input is an explicit human command ID, draft identity/version, source revision,
expected current formal decision (possibly none), actor and confirmation time.
Revalidate authorization, completeness, current Completed source and formal
baseline in the publication transaction. Exactly one successful commit appends
Decision Record, Expected Outcome and report bodies/version, advances the Case
formal pointer and marks the draft adopted. Duplicate identical command returns
that result; conflicting reuse rejects. Failure rolls back all three objects;
unreadable commit outcome blocks retry until a verified reopen/receipt read.

Never rewrite Completed revision, original Closure, original report bytes or
analysis completion/action/outcome status. New report references original final
report and contains the adopted fields/provenance; old versions stay readable
and exportable, superseded status is derived. One current Case/source chain;
first competing draft wins, others are stale. Revising current formal record
copies all fields to a new draft baseline and appends only on confirmation. The human revision stores its exact formal origin and original authorizing Attempt, with no new model Attempt or implicit historical payload. Cancel affects only this pending human draft; prior formal objects, reports and original draft history remain unchanged.
Current-record and source-revision differences are readable; no Expected Outcome
mutation or future actual observation exists in this Change.

## REQ-CA-006 Desktop and Preview honesty (AC-10–12; UI-00–20)

Reuse accepted shell and clickable attachment hierarchy: branded header,
Quick/Professional switch, linked Session left rail, conversation/draft center,
authorization/source/capability/tools/reports inspector. Return opens source
stage 6 and displays formal objects, actor/time/source/report. Preserve all six
stages and three one-shot actions. Never imply Provider connected when disabled.
User-directed Fork/Subagent follow the accepted [collaboration baseline](../case-collaboration/spec.md).
Prompt remains readonly, with one built-in Skill; other Preview prohibitions remain.
All controls have labels, keyboard operation and visible focus; modal focus is
contained/restored, Escape cancels safe dialogs, errors identify recovery and
whether Case changed. At 1440×900 and 1280×720 critical actions remain reachable;
streaming updates preserve focus. A late read from a previously selected Session or an unmounted Quick view cannot replace the newly selected projection; rejecting that response has no persistence or runtime effect. Offline fixtures clearly disclose synthetic
state/no real model call; default product remains unauthorized until configured.

## Scoped real-provider activation / internal-install supplement

ACTIVATE-001/002/003,RUNNER-001 and INSTALL-CA-001 acceptance bindings and smallest
input/output/success/failure/forbidden-effect contracts are specified in
[provider-install-supplement-001.md](../../provider-install-supplement-001.md),under
product plan§7.3 and Controller material engineering decision001. Positive budget
invariants and all existing Case/Assistant authority rules remain. Candidate004
provides offline and installed proof only. Actual provider behavior remains NOT RUN
until the separate exact-data/numeric-budget/dedicated-command approval is granted.

### Candidate005 current execution status

The prior NOT RUN statement describes candidate004's historical freeze. Current
user authority permits total Token Plan usage without a total Credits ceiling;
plan003 retains the authorized stricter per-run bounds. Controller executed its
exact command/receipt with synthetic inputs and production installed Pi; the real
journey PASS is bound in verification.md. ACTIVATE-004 additionally requires the
Main build to retain Pi's installed ESM identity; ACTIVATE-005 verifies the packaged
production transport offline. No behavior or authorization assertions are relaxed.
Final independent review and Product/UI Acceptance remain pending.


## UI fidelity correction — UI-FIDELITY-001–003

Acceptance: frozen UI Gate v1.0, UI-00–05/07–18 and its original four images;
Controller ui-fidelity-review-001 reopens the candidate006 visual scope.

Input: existing DesktopProjection and AssistantProjection, current selected mode,
source revision, stage, draft and report. Output: one branded header with a centered
Quick/Professional segmented switch; Quick three-column workspace; Professional
left vertical six-stage navigation, stage-6 four summary cards, prominent Assistant
entry, formal record and right Case-control/report pane. Counts and identities come
from these projections, including empty/unavailable states. Reference fixture values
are not production constants. The orange/cream/navy visual hierarchy, dimensions and
spacing follow the frozen attachment at 1440x900; key actions remain reachable at
1280x720. Native screenshots are reviewed against original images, not declared
faithful by DOM assertions alone.

Success: mode/stage/report navigation preserves selected Quick/source identity and
all existing capabilities. Failure or missing prerequisites retain precise refusal,
manual recovery and default inactive Provider. Project/session access, original
Closure/editor, all six stage operations, one-shot disclosures, report history/export,
keyboard/dialog focus and Stop remain reachable. No new public/persistent contract,
authority, provider request or business write is introduced by visual navigation.
Existing authorization, draft review identity, cancellation, adoption and recovery
assertions remain mandatory. Historical real Pi proof applies only to unchanged
runtime layers; it does not prove the regenerated DMG's visual acceptance.

Causal regressions first exercise the unchanged packaged internal005: (001) brand
and centered mode switch share the same header row; (002) six stage controls occupy
a vertical left navigation and retain source return; (003) stage6 exposes four real
summary values and the Case-control/report pane. Screenshot comparisons cover Quick
unapproved, authorization, Waiting/Stop, pending draft, Professional entry/adopted
and report selection. No screenshot golden is generated from the defective app.

Retained AC-XDESK-001-04: during a real local analysis, mode switch, auxiliary
drawer open/close and return must preserve the same Running identity. The U2
in-page observer must locate the approved icon button by its accessible label;
visible glyph text is not the control's name. All five Running commits and real
SQLite completion assertions remain required. At 1280x720, keyboard focus must
scroll the stage6 revision control fully above the fixed status footer, without
creating a revision until explicit activation. This is test observation and
reachability coverage only; no production or contract change is required.

## VUI01–04 correction contract (Controller decision 2026-09-29)

- VUI01 / AC-01, UI-01/17: Professional actions/readouts use only formal data whose
  Project, professional Session, Case and revision match the selected projection.
  Empty/new Session and identity transitions clear formal state; delayed old reads
  cannot restore it. Returning to the original Case may load its own immutable data.
  Navigation alone creates no Session, draft, decision, report or model request.
- VUI02 / AC-06, Plan6.2: a reply append failure safely terminates the Attempt as
  Failed without another runtime/tool admission. Waiting deadline remains active
  throughout source checking and reply persistence; Stop/expiry wins against late
  completion. Preserve prior events, do not auto retry, and allow a fresh explicit
  authorized continuation. No deadline extension or schema/status expansion.
- VUI03 / AC-12/13, UI-16/17: Professional current/history previews show complete
  labeled Decision/Outcome fields and provenance from the report's own immutable
  FormalDecision. A missing/mismatched relation must refuse that preview, never use
  the current decision as fallback. New adoption emits deterministic, escaped,
  readable Markdown/HTML in the existing report shape. Stored old report bytes and
  hashes, and their exports, stay exact; viewing/exporting creates no formal objects.
- VUI04 / UI-14/16, AC-12: pending, adopted, rejected, cancelled manual revision and
  reopened drafts describe their own report result accurately. An adopted draft
  identifies its associated report version; rejected/cancelled/pending drafts never
  imply that an older existing report disappeared. No stored history is rewritten.

Principal approved UI layout remains unchanged. These private corrections use the
Controller's existing compatibility decision; no public API, schema, provider,
dependency or authority change is introduced. Each defect gets causal RED before
implementation, then focused/native/current-history/export and offline regression.


## Provider Settings increment — PS-01–08 engineering contract

Authority: provider-settings-ui-gate-v1.md and provider-settings-intake-v1.md
CONFIRMED2026-09-30; exact frozen seven-file product input002. Existing Change and
continuous policy remain adopted. Original Case/one-shot authorization, histories,
reports and first-Change manual work remain authoritative.

| Acceptance | Minimum input/output and success/failure | Forbidden effects / seam |
| --- | --- | --- |
| PS-01 | Global settings from both modes/no Project; approved modal, keyboard trap/Escape/return; empty input and stored mask | Never return saved plaintext to Renderer; actual packaged UI |
| PS-02 | Explicit test of input or saved credential; one fixed Reply with OK. request,30s deadline,128 output-token maximum, no tools/retry; successful proof binds exact input and operation generation | Edit/cancel/close invalidates proof; abort and ignore late results; no automatic save or business prompt |
| PS-03 | Main-owned local credential Port; Security.framework local non-synchronizable generic password; normal startup reads status, no network | No argv/env/log/file/Project/browser backup; no .zcode/import/cross-device copy; native Keychain and installed launch |
| PS-04 | Fixed classified auth/network/timeout/quota/Keychain/unverified-write errors; replace/delete successful only after exact private readback | Old stored credential preserved on definite failure; uncertain write blocks tasks until verified readback; no guessed success/retry |
| PS-05 | Single Main configuration generation; test/save/delete mutually exclusive with pending start/send/Running/Waiting and one-shot execution; stale prepared authorization refused | No task switches key midflight; cancel/Stop first, then explicit new preparation; preserve history and valid manual adoption |
| PS-06 | One local setting feeds Case Assistant and all3 existing single-shot helpers via Personal Profile and Pi Adapter, fixed Xiaomi model | Each original disclosure/payload remains separate; credential only in authentication, not model context; no Project restriction from test-only activation in normal path |
| PS-07 | Full prior safety/runtime/manual/immutable report behavior remains | No fallback, auto resume/call, tools expansion, schema or formal side effect from configuration |
| PS-08 | Unique internal DMG, signature/readonly identity and normal isolated installed launch/reopen; target MacBook user test reported separately | Mini evidence does not claim MacBook/user acceptance, Git, notarization or publishing |

First vertical loop: permanent PS-01 packaged normal-start entry test against
unchanged package011 must reach a missing-entry assertion (causal RED). Separate
thin native feasibility uses a unique synthetic-only Keychain service/account and
a copied diagnostic app with a signed minimal helper. It proves stdin/private-pipe
CRUD and relocated signed launch, not completed production configuration or PS-03
acceptance. Refuse an already-present probe item; delete only the probe item created
by this run. No worker Keychain operation or actual provider execution.

### PS-06/07 candidate native JSON output constraint

The stored-config draft_candidates one-shot request uses the installed Pi Adapter native JSON-object response option for the fixed Xiaomi model. It sends the same separately approved payload/system instruction with no additional data, tool, request, retry or fallback. Other consumer wire options remain unchanged. A returned full message must still satisfy the original strict envelope and candidate field schema; native JSON mode does not grant draft/adoption authority or bypass validation. Invalid output produces no draft/formal write. Evidence: actual installed SDK request-builder RED/GREEN and retained invalid/schema/admission tests, with remaining real endpoint acceptance explicitly host-pending.

Final PS-06/07 evidence status: actual plan006 confirms native JSON mode at the fixed Token Plan endpoint and a pending candidate after the unchanged strict validator. The two prior successful helper/Case segments are reused only with source applicability proof; earlier overall real failures remain failures. PS01–08 coverage and separate pending MacBook Product Acceptance are in current verification. No requirement, data/authority schema, fallback or retry expansion was made during closure.

### PS-02/03/04/05/06 lifecycle correction (F1–F4)

Every Main window, including later Dock activation, owns cancellation of its pending verification/proof and model work. Closing invalidates unused or still-preparing model authorization, interrupts active work, releases acquired private credentials, and forbids late preflight/admission/runtime completions from issuing another request or adopting output. A durably admitted one-shot Attempt closes as Failed/interrupted; an unadmitted start creates no Attempt. Existing local analysis, manual editing and persisted history remain available. Fresh Project opening and new explicit authorization may proceed; no automatic resume.

Case closeSession invalidates both unused previews and in-flight prepares for that Session. A fresh prepare after closeSession remains valid; whole-application close invalidates all previews. These are ephemeral private authorities, not new persistent/public fields.

Save must still possess its exact proof, configuration generation and cancellation epoch immediately before credential-store mutation, including after reading the prior key. Cancel/close before that effect keeps the old key. A write already issued is resolved by actual readback, without claiming rollback. Authentication rejection is retained for the rejected credential identity independently of network/timeout/quota or Keychain errors; only applicable successful verification or verified replacement clears it. An older configuration's late task failure cannot poison its replacement. Temporary failures alone do not permanently disable a previously valid key.
