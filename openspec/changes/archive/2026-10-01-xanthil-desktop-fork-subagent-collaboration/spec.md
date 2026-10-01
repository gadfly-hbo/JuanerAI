# Change 003 engineering behavior slices

Authority: approved FS-R01–08 / AC-FS-01–10 and engineering-decision-001.md.

## F1 — Local Fork creation (AC-FS-01/02/07/08; UI-FS-01–04)

Input: qualified root, exact creation preview, user-selected saved prefix cutoff,
optional explicit history/report/aggregate selection, task, command identity and confirmation.
Fork requires an existing saved parent message cutoff even when history selection is
empty; null or unknown cutoff refuses without any durable/model effects. Only selected
items at or before that cutoff may be inherited. Subagent task entry may omit cutoff.
Output: one durable child relation/session with immutable source/formal baseline
and exact selected context; no Attempt or model call. Repeating the same command
returns the same identity; conflicting intent refuses. A child cannot create children.
Read legacy histories without migration. First child creation and exact 1.0→1.1
migration commit together, preserving legacy records and original source bytes.
Decision003 also permits migration in confirmed v1.1 explicit-close transaction.
Invalid/stale preview, source/formal change, parent closed or model occupancy refuses.
Cancel consumes no durable state. Test seam: real Application + local Store with
existing synthetic Completed Case, then production Main native window path.

F1 native seam: production Main receives `open_child_window` for a committed
child of the current project, opens/focuses exactly one secure BrowserWindow bound
to that child. Creation/open never calls a model; OS-open failure keeps the saved
child available for explicit retry. Real isolated preload and sender/frame checks
are exercised; substituting the Main handler is not this proof.

## F2 — Independent bounded Fork Attempt (AC-FS-02–04/07/08; UI-FS-05–07)

Input: saved child, current valid source/formal baseline, explicit text and chosen
own history/results (default none), exact preview then free-text confirmation.
Output: same execution loop/limits; explicit question enters Waiting; validated
complete sourced result and Succeeded commit atomically. Each result is immutable
and versioned. Missing/excluded source references and malformed output fail without
result/return/formal writes. Advice/draft is protocol failure, never Waiting.
Inherited grant bounds all tools and payloads; unselected data/report/history cannot
be fetched indirectly. Readonly complete insufficient-evidence opinion is valid.
Stop/close fences publication; no implicit retry or model history. Runtime boundary
is existing turn Port with child contract 1.1; root prompt/behavior stays 1.0.

R1/R2 readback: a second actual Attempt includes R1 only when explicitly selected;
R2 has a new immutable identity/version and may cite the exact R1 hash. Foreign
or duplicate selection refuses before any model call. Returning R1 after R2 still
targets R1. If success committed before Stop, read back Succeeded and its result;
do not overwrite it or report a false cancellation/storage failure.

## F3 — Return and review (AC-FS-04/06–09; UI-FS-07/09–12)

Input: original child/parent, exact saved result ID/version/hash and command ID;
manual Fork return, then confirmed parent adoption or decline. Return commits one
pending delivery; review commits one terminal disposition and (only on adoption)
one MODEL material together. Cancel has no effects. Replays retain identities;
conflicting commands/terminal dispositions refuse. Current source/formal baseline
and open parent guard every fresh commit. No model, root Attempt, draft, formal
Decision/Outcome, Evidence/Finding, or report writes. Successful execution remains
separate from delivery failure. Unknown COMMIT reads back before mutation/retry.

## F4 — Parent material selection (AC-FS-02/06/08; UI-FS-05/11–12)

Input: root new Attempt preview with explicitly chosen adopted material IDs;
none selected by default. Resolve immutable result/version/hash and review from
this parent, require current source/formal baseline, disclose exact MODEL content.
Output: only selected material enters the confirmed payload. Pending, declined,
foreign and stale materials refuse; no automatic Attempt from adoption. Existing
root runtime/draft/formal adoption path remains unchanged.

UI-FS-05/11 readable authorization: render the exact prepared payload's selected
MODEL materials directly in the parent dialog, including full content, references,
limitations/unknowns, result/version/hash, child/Attempt/source and human adoption.
Empty selection explicitly sends none. Current UI state cannot substitute a newer
selection for that frozen preview. JSON remains supplementary audit detail.

UI Contract §§1/5: populated child history/result choices each have a named native
checkbox, readable content and separated provenance/status/version. Long IDs wrap;
fieldset and descendants fit the inspector, with bounded vertical scrolling and
keyboard access to every checkbox. Preserve both viewports, source and Stop access.

## F5 — Close and publication fences (AC-FS-08/09; UI-FS-12/13)

Confirmed actual parent close synchronously aborts pending starts, child work and
local publications before awaiting persistence. All its direct children close;
active Attempts become Interrupted. Committed results survive, delivery cannot
publish after the close fence. Child close affects only that child. Closed state
and epochs persist in collaboration sidecar; previews cannot survive close/reopen.
Explicit reopen reads history only and does not restore model grants or auto-return.
Navigation/focus never invokes close. Native close cancellation changes nothing.
Legacy 1.0 root close still invalidates pending/unused previews and permits a
fresh prepare afterward; it does not introduce durable lifecycle state on read.
Main close handling cancels the native close event until confirmation and awaited
Application persistence finish. Cancel leaves the window and work intact. Failure
keeps the window visible; successful root close then destroys its owned children.
Failed close retains the owning Application so explicit native retry persists the
same family. Selecting a closed root in the existing conversation list explicitly
reopens its history; it does not reopen children, restore a grant or run a model.

## F6 — Shared local model admission (AC-FS-03; UI-FS-06)

One lease across root/child, professional helpers and settings includes pending
credential/start work and Waiting. Concurrent start/child creation refuses with
visible occupant; no queue or implicit stop. Explicit Stop releases once after
fencing late work. Profile shares the gate even without stored credentials or
with explicit activation. Local child creation checks occupancy without reading
credentials or acquiring model authority. Existing settings lease remains owner.

## S1 — Bounded Subagent and local recovery (FS-R05; AC-FS-05/08/09)

Input: explicit task-based child creation, optional selected context and its own
confirmed bounded Attempt. Questions genuinely enter Waiting and retain the lease.
A complete result commits with Succeeded, then automatic local delivery runs once
for that exact result, without a parent Attempt or another model turn. Failure,
Stop, timeout, budget exhaustion and interruption publish no complete result.
Delivery failure preserves success and records failed delivery when storage is
available; explicit retry only performs the local checked return. Close/reopen
between success and delivery invalidates the original automatic continuation.
Reopening or restarting never auto-runs or auto-returns historical results. Local
recovery needs current source and open parent, but no restored model grant/provider.


F1–F4 regression boundary / UI-FS-13: an active associated child requires the
existing close/cancel confirmation. A global connection probe, pending save or
legacy consumer without an active child does not introduce that confirmation;
actual native close revokes its pending authority using the retained cleanup path.
No new visible workflow or timeout allowance is introduced.

## Independent review corrections F1–F5

Candidate001 is historical FAIL. UI-FS13 exposes explicit current-parent close with
cancel/confirm, preserving unrelated families and history. Main renderer loss
(child/root render-process-gone or destruction) immediately fences owned pending,
Running/Waiting work and stale authorization; late output cannot publish. Normal
close/reopen remains supported. C5 creation checks shared admission synchronously
inside the final real Store transaction before any migration/receipt/child effect.
The Store receives a process-local business admission assertion, not provider types
or new durable/public authority. Busy refusal has zero writes and model calls.
F4 verifies actual manually formed candidates, selected history/aggregate/report,
Fork comparison and Subagent refutation with exact references and MODEL-only review.
F5 uses captured owned writer processes killed before/after the three real COMMITs:
createChild migration, finishChild, reviewResult adopted. A fresh reader/retry must
observe atomic records, idempotency, Interrupted recovery and no automatic model or
return. Existing fault/lost-COMMIT tests remain complementary. F6 remains permission
blocked under decision002. No new product requirement or contract beyond C1–C5.


### Checkpoint007 destruction correction (AC-FS-09 / UI-FS-13 / C5)

Main must retain the webContents identity while the window is alive. A destroyed
BrowserWindow may no longer expose that property. Both native close and renderer
loss must synchronously revoke the captured sender, persist the selected family
once, and finish owned window teardown without accessing a destroyed handle.
Duplicate events stay idempotent; a real persistence failure stays retryable and
never becomes successful close. This is a private lifecycle correction, not a new
authority or persistence contract. Test cleanup must await captured-process exit;
TERM/KILL fallback only addresses that handle and remains a failed test.


### Candidate002 F1 — legacy parent explicit close (AC-FS-09 / UI-FS-13)

Input: an existing schema100 parent with saved history and no children, the current
epoch, and the existing v1.1 explicit close confirmation. Reads, opening/listing
history and cancellation preserve schema100 and exact database bytes. Confirmed
close must report closed, revoke pre-close authorizations/previews and pending work,
and refuse fresh prepare/create/start until explicit reopen. Closure survives a new
Application instance. Reopen restores access to history and fresh preparation only;
old grants remain invalid and no model or return starts automatically. Other parent
history and formal records remain unchanged. Legacy v1.0 close semantics and existing
schema101 family closure remain covered by their retained regression tests.

Independent probe002 is causal RED for this existing visible requirement. A permanent
real Application/Store/v1.1-handler test records the same legacy branch. Decision003 accepts
the C1 activation extension: confirmed v1.1 close atomically migrates to existing101
and persists close/interruption. Ordinary untouched100 shutdown and v1.0 close do
not migrate. Pre-COMMIT failure preserves exact100; lost-COMMIT readback must prove
the exact lifecycle and interruption before success; unresolved safety fences stay
closed until explicit resolution. Retry never repeats a committed close epoch.
