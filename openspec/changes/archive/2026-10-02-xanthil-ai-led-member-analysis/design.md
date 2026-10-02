# Change004 engineering design — integrated A/B implementation

Status: **APPROVED WITH ADJUSTMENTS** by [decision001](engineering-decisions.md).
Current implementation status is [verification](verification.md). Execution authority
comes from the explicit dispatch and decisions001–004. Input and scope: [proposal](proposal.md),
[intake](intake.md). Test sequence and evidence: [tasks](tasks.md).

### Material contract request summary

This document uses the applicable fields of
[CONTRACT_CHANGE_REQUEST](../../../../docs/templates/CONTRACT_CHANGE_REQUEST.template.md)
for C1–C6 in place, without six duplicate forms. Current contract/source and reason
are in §1; each proposed shape, failure rule and acceptance reference follows in
§§2–7; compatibility/activation/rollback are in §§3/7/8; positive, negative and
integration checks are in tasks.md.

| Affected domain | Material impact |
| --- | --- |
| Analysis Core/Application/Port/DuckDB/Python | C1 plan consumption, result and Run versions; no new business metrics |
| Operational storage/Profile | C2 opt-in schema/identity; C4 persistent resource admission; C6 atomic review |
| Task Application/Pi/IPC/Desktop | C3 bounded unfinished-task protocol; same selected Runtime and model lease |
| Reports/Decision/Expected/history | C5 immutable review/comment sources and guardrails; C6 whole formal commit |

Boundary classification: proposed **in-boundary engineering deltas** implementing
already-approved P1 behavior. Legacy contract shapes remain explicit and readable;
new persistence is not backward-writable by old builds. No backfill of business
facts, test retirement, new data/Provider permission or paid-resource authority.
Controller decision status: **Decision001–003 recorded; Controller owns the file**.
User boundary decision for these proposals: not applicable while they remain
within intake. F1/F2/F4 real activation remains unapproved and blocked.

## 1. Observed seams

Actual HEAD is
`c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, tree
`74e042fa0680a22ba29fd68e87f67f8ca6428301`; use these exact identities.

| Existing seam | Actual behavior and reuse |
| --- | --- |
| `packages/product-core/xanthil-desktop-decision-case.ts`: `prepareDesktopData`, `desktopConfirmationDocuments`, `validateDesktopCalculationResult`, `desktopMetricChanges`, `desktopJudgment` | CSV/meaning/period validation, fixed five-step IR, exact arithmetic and judgment. Mapping requires `selected_group_mode` to match group-column presence. Old result validator requires zero-active rate `0/1`; preserve legacy reader. |
| `packages/application/xanthil-desktop-decision-case.ts`: `confirmRevision`, `startAnalysis`, `executeAnalysis` | Publishes snapshot/Contract/Binding/IR, then sequential real calculate/verify/equality, aggregate/Finding/draft report. IR bytes are archived but not executed. Run has 300-second outer and 30-second process bounds under the old contract. |
| `packages/ports/xanthil-desktop-decision-case.ts`: `DesktopLocalAnalysisExecution`, `DesktopRunEvidenceStore`, `DesktopDecisionCaseStore` | Closed 3-method execution and 7-method evidence Ports; calculation request lacks plan identity. Store owns transactional admission/publication/settlement. Keep old request/response shapes exact. |
| `adapters/analytics-duckdb/xanthil-desktop-decision-case.ts`: `createDuckDbPythonDesktopLocalAnalysisExecution` | SQL `UNION ALL` computes groups even without selected M2; Python `grouped` comes from mapping. Independent Python parses raw snapshot itself. `process.ts` already owns bounded subprocess cancellation. |
| `adapters/storage-local/xanthil-desktop-decision-case.ts`: `createLocalDesktopDecisionCaseStore`, `createLocalDesktopRunEvidenceStore`, `analysisTransaction`, `completeCase` | Exact schema100/1.0; DELETE/FULL SQLite; snapshot and confirmation cross-check; Run3.0 physical terminal precedes DB visibility. File stage/fsync/exclusive publication and receipt replay are reusable. Validators reconstruct old confirmation/report identities, so adding a JSON field alone is insufficient. |
| `packages/application/case-assistant.ts`: `link`, `prepare`, `start`, `execute`, `settle`; `adapters/storage-local/case-assistant.ts`: `readSource`, `adopt`, `transaction` | `link/readSource` require Completed + acceptance + Closure + final. Attempt counters start at zero. `adopt` writes Decision/Expected/report/head/draft/receipt in assistant DB, attaching original DB to check source. It does not write original Finding acceptance/Closure. |
| `packages/product-core/case-assistant.ts`: `validateAssistantDecision`, `formalDecisionSections`; `packages/contracts/case-assistant.ts`: `OutcomeFields` | Reuse candidate/no-action/defer, source references, Owner, Expected and existing guardrails. No independent guardrail-inapplicability or dependency field exists. Do not drop guardrails into a dependency string. |
| `packages/application/provider-settings.ts`: `createLocalModelAccess`; `profiles/personal/xanthil-desktop.ts`: `modelAccess` composition | Existing shared lease covers Assistant, helpers, children and settings. New task must receive this same object, never create another gate. Existing Assistant numeric defaults are not a P1 resource profile. |
| `adapters/agent-pi/case-assistant.ts`: `createPiCaseAssistantRuntime`; `apps/desktop/case-assistant-main.ts`, Main/Preload | Reuse selected Pi SDK/transport, single-turn and abort mechanics, closed IPC and sender checks. Current output is read-only Assistant/child protocol; new task effects require a separately validated business protocol. |

Graph-first query to `JuanerAI-change004-mini` was denied:
`MCP tool call requires approval, but approval policy is never`. Local read-only
search was used; no reindex, permission change or claimed graph verification.

## 2. C1 — Versioned scenario, finite plan and actual dual-engine consumption

**Approved contract (decision001):** introduce membership scenario/plan v1.0, a distinct planned
execution request/result v2.0 and Desktop Run/Evidence v4.0. Retain old execution
request/result v1.0 and Run3.0 without inferred plan identity. Extend the same
Desktop execution/evidence capability with explicitly discriminated versions;
keep the named three/seven methods, not a method registry or universal IR.

Smallest spec (P1-R01; SC-01/02/04/05/07/10; CAP-01–03):

- Input: explicit immutable scenario version, confirmed selection/Binding, two
  immutable source descriptors, owner/revision/confirmation/snapshot, selected
  methods and mandatory independent-verification rule.
- Success: M1 or M1 then M2 → independent Python of the same selected methods →
  equality → verified Finding and report, all with the same immutable identities.
- Failure: unknown method/version/key, absent M1, wrong order/dependencies,
  unavailable M2, invalid parameters, missing verification or any identity mismatch
  refuses before the next protected effect. No hidden legacy fallback.
- Forbidden: M2 execution for M1-only, guessing meaning, causal claims, arbitrary
  SQL/code, automatic repair/trim, failure as insufficiency, invented defaults.

Scenario fields are only the approved membership definitions, CNY/Asia-Shanghai,
explicit mapping roles, status values **and their supplied business meaning**,
M1/M2 applicability, existing six quality treatments, independent verification,
maintainer and immutable version identity. Incomplete configuration is saved as
incomplete and cannot activate. A new version never silently rebinds an old task.
No generic Ontology schema or Pack manifest is introduced.

Plan closed shape: schema/version and ID; exact owner/revision/confirmation/snapshot;
scenario ID/version/hash, Contract hash and Binding hash; both source hashes/lengths;
selected ordered methods (`[M1]` or `[M1,M2]`); explicit selection parameters;
required verification (`python_independent`, exact equality); materialization
identity. Local serialized fields use existing canonical decimal strings/hash
conventions. IDs/hashes complement semantic checks; they do not replace them.

Decouple **mapping availability** from **method selection**. Keep the authorized
group binding intact for an M1-only plan; do not falsify it to `none`. Materialize
only the selected operations. For M1, DuckDB receives period/member ranking and
overall aggregation with no group aggregation query; Python branches on validated
plan methods and performs no group accumulation. For M1+M2, both separately
compute group contribution and verify exact reconciliation. Keep independent
parsers/algorithms; only closed plan validation/serialization may be shared.

Result v2.0 carries plan/materialization/source identity and method results:
`m2.status=not_selected` when omitted; mapping eligibility remains separately
inspectable in the plan/configuration. M2 without an eligible mapping rejects. Selected M2 with a zero-active period
returns not_applicable and never presents an empty comparison as sufficient. Selected M2 returns existing exact anonymous
contributions. A zero-active period has `repurchase_rate=not_applicable`; if either
period is zero, both rate-change values are `not_applicable`. Counts/revenue retain
valid values, judgment is limited insufficiency. Both-period filtered-empty
rejects before a result. A genuine zero rate with a positive denominator remains
`0/1`. Old result1.0 keeps its historical interpretation and bytes.

Three checks, implemented in the background:

1. Admission validates scenario, selection, supported plan and source/authority;
   no Run/process/model effects on rejection.
2. Immediately before execution, reread confirmed snapshot hashes, reconstruct
   the expected materialization from the exact plan, compare actual SQL/verifier
   assets and bounded arguments; run those bytes. Store them in the Run bundle.
3. Before physical terminal and DB visibility, independently validate both result
   envelopes, source/plan/code identities and exact method output equality; check
   current revision, grant generation, cancellation and deadline again.

Publication validators must dispatch by version across Core, Run store, aggregate,
Finding, projection and report-source readers. New report source includes plan and
scenario identity plus existing Run/Finding/confirmation/snapshot lineage. There
is no accepting new unknown fields in old validators or upgrading old bytes in place.

## 3. C2 — Persistence and task identity

**Approved contract (decision001):** exact opt-in state.sqlite 100→110 (schema1.1) for P1; no
migration on ordinary read/list/open or viewing legacy history. New task creation
is the activation command and records its receipt atomically with the migration
and same-Case binding. Existing IDs, user records and file bytes remain unchanged.
Unknown/tampered schemas and WAL files reject before business writes. Older builds
refuse the activated Project; no down-migration or automatic backup restoration.

Task has one stable Quick task/session identity, a distinct existing professional
Session/Case owner and current revision pointer. Creating a new task creates one
Case through the existing all-or-unavailable session machinery; switching view
does not convert Session mode or create another Case. Task execution status is
separate from the existing Case revision states. Old Quick sessions keep their
Completed-only source contract.

Minimal persistent relations proposed within state.sqlite:

| Relation | Required identity/invariant and consumer |
| --- | --- |
| `membership_configs` | `(config_id, version)` unique; immutable closed body/hash, maintainer; tasks pin one version. No automatic defaults/latest. |
| `membership_tasks` | `task_id` PK; unique associated professional Session/Case; owner FK; current revision, row version, admission epoch, open/closed, task status; one active Attempt per task. |
| `membership_plans` | immutable plan ID/body/hash, same-owner revision/confirmation/snapshot FK and config-version reference; execution never consumes an uncommitted plan. |
| `membership_grants` | immutable grant ID, task chain predecessor, exact scope/profile/text selections/expiry; revocation recorded monotonically; same task cumulative authority. |
| `membership_attempts` | Attempt ID, task/grant/epoch, status/timestamps and selected runtime provenance; no Pi session persistence. |
| `membership_usage` | unique admission/reservation ID and task/grant/Attempt-or-Run, dimension amounts, reserved/issued/settled-or-unresolved state; reserve before effect, settle once. No deletion/reset. |
| `membership_events` | task/Attempt/source, exact local outbound payload or sanitized tool result, consent references, time and disposition; no credentials/raw CSV. |
| `membership_comments` | exact report ID/version/hash + scope + author/text/consent + processing version/result; immutable original binding. |
| `membership_reviews` | review ID/version/content hash, task/owner, exact Finding/report/Closure proposal/formal baseline, human fields and disposition; no acceptance merely from persistence. |
| `membership_receipts` | command ID PK, exact intent fingerprint, result kind/IDs; unique review-version formal submission, replay or conflict. |

All bodies have closed versioned validators; indexed relational keys/FKs enforce
owner and uniqueness, JSON does not carry unchecked authority. No cascades,
retention/delete API or generic event-sourcing platform. Existing tables require
version-aware constraints/readback for v4 runs, new receipt operations and report
sources; reconstruct changed tables in one explicit migration while preserving
all legacy row values. Do not add permissive columns to schema100 and call it compatible.

The entire P1 uses one schema110 (1.1) activation. A and B add no separate migration. Reserved relations remain empty and reject rows until their consumer and closed validator are implemented. There is no migration from reading history.
The first loop consumes configs/tasks/plans/receipts; the remaining A relations
are used by its immediately following coordination loop before A delivery.
New task/config/plan/grant/Attempt/comment/review/command identities use UUIDv4;
analysis Run identity stays UUIDv7. Versions, epochs and counters are nonnegative
bounded decimal strings at the public boundary, checked integers in SQLite.
All same-owner FKs include project/session/case/revision in that order; config
version has a compound FK, and task-grant-usage relationships include task_id.
Immutable bodies carry hashes; current pointers use guarded row-version updates.
One partial unique index admits a live Attempt per task; reservation ID uniqueness
prevents duplicate charging; exact review version uniqueness prevents double formal
publication. No arbitrary indexes, triggers or default business values are added.

Mini can decide these identity, activation and compatibility choices now. The
implementation records exact DDL and validator hashes before activating each
recognized version, within this same design/decision rather than a new Spec Gate.
Any change to these material choices returns to Mini; ordinary SQL layout does not.

## 4. C3 — Bounded unfinished-task coordination and disclosure

**Approved contract (decision001):** add a scenario-specific membership-task Application and
business Port using the **existing Pi Adapter/runtime**. New closed IPC family
`membership-task/1.0` leaves legacy Desktop1.0/Assistant1.0/collaboration1.1 exact.
Do not relax `CaseAssistantStore.readSource` or forge a Completed AssistantSource.

Smallest spec (P1-R02/R04; SC-01/06/08–10; CAP-04/05/09): input is a task,
explicit config/plan scope, selected two-file capability and confirmed task grant.
Output is minimal questions, validated plan proposals, bounded business commands,
verified discoveries and pending reports. Draft may inspect only selected files;
Ready executes only admitted plans; Review reads verified outputs; stopped/failed/
Interrupted shows saved work until explicit continue. A successful path advances
without per-node confirmation. No acceptance/Closure/Decision/action/child command
is in the model protocol.

Finite commands: inspect selected source preparation, propose supported plan,
execute admitted plan plus independent verification, read current verified result,
assemble/revise pending report. Snapshot publication still requires local data
authority and approved meanings/treatments, captured together in the user grant.
The model cannot supply filesystem paths, SQL, executable code or arbitrary owners.
Application resolves capability/owner IDs from the current task and rechecks them.

Profile selects the same Pi implementation and shared `modelAccess` for all
consumers. A membership turn returns a closed question/plan/business-tool/report
proposal plus observed provider/model and bounded usage. SDK events, messages and
session objects remain inside Adapter. Preserve legacy protocol validators;
extract private transport only with pre/post GREEN. No Runtime selection/fallback.

Outbound projection is a whitelist of approved role/type/quality counts, fixed
semantic labels, exact authorized periods/status meanings, verified overall
aggregates and explicitly selected human text/report passages. Never serialize
entire `DesktopProjection`, `AssistantSource` or aggregate objects. Every actual
request **and tool result** is checked and durably recorded before transmission.
Local free text is not sent for classification without that text's explicit opt-in.
Unclassifiable custom semantic/report content stays local. Model-generated prose
cannot launder unselected human input or private labels into the next request.
Group aggregates/labels remain local under F1; do not invent suppression thresholds.
Deterministic report sections may show local M2 with clear model-visibility limits.

## 5. C4 — Persistent resources and admission fences

**Approved contract (decision001):** required explicit `TaskResourceProfile/1.0` and cumulative
task-chain ledger/reservations; no inherited Assistant limits as defaults.
Required dimensions: exact provider/model; model rounds; per-call and cumulative
output bounds; Attempt activity/wait bounds and cumulative activity/wait; local
analysis count and per-Run/per-process time bounds; finite grant deadline. Local
process bounds may not exceed the existing supported 30-second process and
300-second outer maxima; smaller task limits further constrain them. These maxima
are inherited safety ceilings, not selected production task defaults. Monetary hard cap is a discriminated
capability: supported only with enforceable reservation/accounting, otherwise
explicitly unknown cost with the actual reliable dimensions shown. Missing or
unapproved profile blocks real activation, including credential acquisition.

Smallest spec (D2/D5; SC-08/09; CAP-05/09): exact current grant and remaining
balances admit one reservation and effect; spent + outstanding reservations never
exceeds a configured cap. Reservation IDs bind payload hash and exact source.
New Attempt, comment, failure, revision or reopen never resets task totals.
Additional authorized grant may extend the chain but cannot erase prior spending.

Acquire the existing global model lease before credential/start work and retain
it through Waiting. No second occupancy gate, queue or autonomous retry. Persist
reservation + outbound payload + admission epoch before issuing work. Settle known
usage exactly once. Failure/Stop/timeout with uncertain consumption keeps the
outstanding reservation, visibly unknown, until reliable readback; never release
it as zero. Reserve a bounded worst case for clocks/output/cost supported by the
Adapter. Unsupported enforceability blocks that claimed cap; no fake hard limit.

Stop/confirmed close/reopen/expiry/material scope change advances or closes the
admission epoch. Fence synchronously before awaiting store work; compare the durable
epoch at every subsequent effect/publication. On persistence failure remain fenced
and show failure; do not restore authorization. Ordinary navigation does not fence.
Already-issued work may settle usage/history only. Late output cannot publish or
revive a task. Release the model lease only after the issued runtime physically settles or the Adapter confirms cancellation; logical fencing does not release it. Preserve outstanding charges. On App open mark live task work Interrupted and grants closed before
normal task admission; no Pi/session/subprocess resume.

Explicit continue after ordinary model failure first checks the existing grant;
if scope, source, expiry and balance still match, create a new Attempt without new
approval. Stop/close/reopen requires a new grant, with the same cumulative chain.
Only invalidated work repeats: reuse verified same-plan result after model failure,
retry local saving without a model, and use a new Run for an explicit failed-analysis
retry. No orphan terminal Run adoption or interpretation of failure as success.

## 6. C5 — Comments, report identity and Expected

**Approved contract (decision001):** immutable report/comment/review envelopes; versioned P1
Expected extension with dependencies separate from a discriminated guardrail
(`applicable` with text, or human-confirmed `not_applicable` with reason).
Keep existing OutcomeFields1.0 and all its required-field tests; do not backfill
guardrail/dependency business facts into legacy records.

Smallest spec (D3–D5; SC-03/04/11/12; CAP-06–08): comment input binds exact
report/version/hash, whole-report or identified section, author and text consent.
Expression revision appends a report retaining Run, plan, facts and evidence.
Generate prose separately from deterministic factual sections; model prose must
not replace authoritative metrics or references. Ambiguous impact asks only what
is missing; unselected text remains local. Human field edits retain ownership.

Lawful period change previews before/after and invalidations, creates revision,
plan and grant then real recomputation. Same normalized values return NO_CHANGE
without a new revision/Run/Attempt or reservation caused by that scope command.
Earlier authorized comment-classification usage remains spent. New cohort filters/causality
reject. Old comments/reports/decisions never rebind to latest or enter new context
automatically. Resource chain remains task-scoped across revisions.

Reuse existing candidate/no-action/defer and Expected validators via small pure
extensions for P1; preserve sourced baseline, object, direction/range/uncertainty,
window, result/assessment responsibility, applicable dependencies and independent
guardrails. Suggestions need evidence/config provenance and pending-human status.
Missing targets/Owners/guardrails stay missing. Refusing a suggestion preserves
human edits. Whole Expected inapplicability and guardrail inapplicability are
distinct; neither can silently drop required content.

## 7. C6 — One formal human review across the existing stores

**Approved contract (decision001):** one storage-local transaction capability for P1 human
review, spanning existing state.sqlite and case-assistant.sqlite using a single
SQLite connection with ATTACH, local same-filesystem databases, DELETE journals,
FULL synchronous, foreign-key/integrity checks and BEGIN IMMEDIATE. Check these
preconditions; WAL/unsupported storage refuses. This is a proposed mechanism,
not claimed crash proof. Do not sequentially invoke `acceptFinding`, `completeCase`
and `adopt`, or use compensation that exposes half a formal outcome.

Smallest spec (D4; SC-11/12; CAP-07): submit exact review ID/version/hash,
owner/revision/row version, plan/Run/Finding/report, saved legal Closure content,
formal head, outcome choice, applicable decision/Expected fields, human actor/time
and stable intent/command ID. UI captures these identities when review opens.
Cancellation, ordinary praise or model output creates no formal effects.

| Explicit outcome | Atomic formal effect |
| --- | --- |
| Record choice | Exact Finding acceptance + legal Closure + Completed/current references + Decision/Expected + appended final report + adopted review + unique receipt |
| Analysis only | Exact acceptance + legal Closure + Completed/current references + final report + receipt; no Decision/Expected |
| More evidence | Save issues/comment/valid work only; no acceptance, Closure, Completed or Decision |

Reuse existing pure candidate/Closure/decision validation and file publication.
Extract a narrow validation context for proposed Finding/candidates/Expected;
legacy callers retain their existing Completed-source guard. Do not construct
a falsely eligible AssistantSource to satisfy a legacy helper signature.
Comparison requires at least two complete candidates and at most one reasoned
preference; insufficiency requires reason and no preference. No fabricated option
or model authority is used to fill missing requirements.

Prepare immutable final file pair, fsync and exclusive publish first; it remains
an invisible candidate until the combined commit. In the one transaction recheck
source bytes/descriptors, plan, row version, current head, exact review content,
human confirmation, no live conflicting work and all required fields. Insert all
formal effects and a single authoritative receipt. Both DB readers must recognize
the new receipt/record origin and validate same-owner references. Cross-database
owner checks are explicit same-transaction checks, not imaginary cross-DB FKs.

Assistant sidecar uses the recognized 100/101→102 (schema1.2) step at the first
P1 formal choice or explicit P1-origin retained source write (Decision004). P1 draft/formal provenance is explicitly tagged as
membership review, with its task/review IDs; it must not fabricate a legacy model
Attempt or fake an old `AssistantDraft`. Extend formal-history/export readers
to the closed provenance union. Existing sidecar bodies and collaboration records
remain byte-identical. After valid completion the task can structurally qualify for old Completed
Assistant/manual 003 entry. Decision004 closes that boundary through explicit
P1-origin material/grant consumers and the same original ledger. Synthetic actual
Pi main/manual-child requests now exercise that path. No automatic
child/Attempt is introduced.

Commit uncertainty locks further submission and mutation. A new connection reads
the exact receipt and every referenced formal object: unique complete result
returns success; proven absent returns not-applied and permits same-intent retry;
unreadable stays RESULT_PENDING. Persist review draft before submission so restart
can find the same intent. Different payload for the same ID conflicts. Concurrent
equivalent submissions yield one result; competing stale review/head refuses.
Precommit crash leaves no formal effect; postcommit response loss reads it once.
Unreferenced files remain inert, never auto-scanned/adopted/deleted.

This changes the old no-cross-store-coordinator constraint for this one human
review capability only. Required proof includes faults before file publication,
between database writes, before/after commit, and recovery with both DB journals.
If actual local SQLite recovery cannot satisfy the contract, return the concrete
failure to Mini before an alternate persistence design; do not weaken SC-12.

## 8. Compatibility, rollback and validation

Read legacy schema100/assistant100/101 and old Runs/reports with exact validators;
activate only explicit P1 writes. Verify unknown/newer schema refusal with zero
business writes and unchanged bytes, old IDs/rows/files through migration, and
new readback through all histories. Migration failure must leave the prior valid
schema or recognized recovered new schema; never an accepted partial schema.

Rollback means disable new task admission and retain the compatible newer reader
for activated Projects. Unactivated Projects remain usable by the old build.
No down-migration, destructive restore or claim that an old binary can read new
data. Existing immutable terminal evidence and historical failures remain.

First loop C1/C2 proves real plan → both algorithms → verified draft report before
integrating model coordination. A integrates C3/C4 immediately afterward; B uses
C5/C6. First-loop test details and later build/contract/integration/regression
matrix are in [tasks](tasks.md). Resource accounting and combined commit require
real SQLite/process fault tests; synthetic model transport proves bounded
mechanisms only. Real-model quality, native interaction and user acceptance are
unverified; no prototype rehearsal is part of this dispatch.

## First-loop exact persistence and protocol refinement

Decision001 permits one 100→110 activation. The exact additional DDL is reproduced
in [schema110.sql](schema110.sql), mirrored by the private Adapter constant. The
only existing DDL change is analysis_runs.run_contract_version CHECK admitting
3.0 and 4.0. Migration rebuilds existing tables in one DELETE/FULL transaction,
retaining every column value and command receipt order; schema, plan admission and
start receipt commit together. No write occurs on ordinary open. FK and full row
readback precede commit. Unknown versions refuse. No down-migration.

The first loop used config/task/plan/run-plan relations. Stage A now consumes
prepared/grant/Attempt/usage receipts in the same schema110 and the normal Quick
view; C5/C6 consume comments/review rows through their closed commands. Human
formal authority is limited to the exact explicit review transaction. A task binds the existing professional Case.
Run4 embeds the immutable plan and copies original confirmation
bytes unchanged; aggregate/report sources bind plan_sha256. Existing SQLite
Finding/report tables carry the verified draft. Legacy formal acceptance of a
Run4 Finding is gated until C6 is implemented.

The internal Application startAnalysis v2 command adds execution_plan. The IPC v1
validator stays closed; later task protocol supplies this business command.
Application validates exact confirmed owner/snapshot/binding/parameters before
admission and persists the plan atomically. The same Profile selects the same
Application, execution and storage adapters. A changed period requires a new
confirmed revision; a plan cannot overwrite confirmed parameters in place.

NO_CHANGE refers only to the equal-value scope command; earlier authorized
comment classification usage is retained. User UX evaluation remains separate.

## Stage A connected continuation (decision001 C3/C4)

Preparation input is exactly the two Main-selected source capabilities, explicit
scenario/status meanings, period/mapping selection, M1 or M1+M2 and displayed
quality treatments. Inspection reuses the existing Desktop import consumer.
Success persists source hashes/configuration and the same Case identity, with no
snapshot, Run, model call or formal acceptance. Missing or changed input fails
before authorization; no period, meaning, treatment or resource default is inferred.
Reference: SC-01/02/07, UI-P1-01–06; C1–C4. The prepared fingerprint is the grant's
source/scope identity. Resource configuration is Main-owned and required; real
activation remains closed. Local tests provide finite synthetic profiles only.

Grant and Attempt are separate durable records. A grant pins the prepared
fingerprint, explicit Main resource profile, recipient and optional selected text.
It does not reserve or call a model by itself. Continue checks an unexpired grant,
acquires the shared physical lease, then persists an Attempt and reservations
before effects. Ordinary failure preserves a valid grant; stop/reopen revoke it.
Every model payload is reconstructed from the pinned preparation and verified
overall metrics, never prior prose, group aggregates or arbitrary tool arguments.
The only model tools are execute_plan and read_result. A verified local finding
and draft stay visible if the later explanation fails. Resume reuses that result.

Planned Run4 may carry an exact optional task_context (task/grant/epoch/reservation,
run deadline and subprocess ceiling). This is the C4 authority link, not another
schema activation. The original first-loop plan remains valid. Admission and
publication check the durable grant epoch/reservation, preventing a late local
result from publishing after logical Stop. Old Run3 admission remains unchanged.

Normal Desktop consumes the task Application through one closed Main-only IPC
channel. Main owns selected-file capabilities, checks main-frame sender and active
Project across asynchronous selection/read, and rereads selected bytes before
preparation/authorization. No Renderer path, runtime, resource override or arbitrary
operation crosses IPC. Profile composes the same Pi Adapter/shared model lease.
The default profile reports missing activation; only explicitly synthetic test
composition supplies a transport and finite limits. UI text consent starts false.
Quick/professional navigation keeps the same Case and does not call stop. Confirmed
window close and renderer loss call the existing lifecycle fence. C5/C6 controls use the implemented version-bound comments and human review. Native rendering/keyboard and human
experience evaluation are separate from offline React/IPC/build evidence.

### C4 shared physical settlement correction

Input: Stop, close or timeout while a legacy Assistant turn is issued. Output:
the logical Attempt becomes terminal immediately and late business publication is
fenced, while LocalModelAccess remains occupied until the issued runtime Promise
settles. Waiting retains the lease. Abort notification alone is not cancellation
confirmation. No new eligibility, grant or formal effect is introduced. The Pi
Adapter must include its issued synthetic transport in physical settlement.
Acceptance: C4, P1-A-SHARED-01; causal RED is red-shared-physical-002.

The same C4 condition applies to the retained professional Assistance consumer:
logical close/cancel/timeout fences drafts without releasing an issued runtime
operation. The existing F2 runtime gate now checks physical occupancy before
settlement; red-professional-physical-001 records the causal failure. Preflight
and admission that have not issued a model turn retain their prior close behavior.

The installed stored-Xiaomi Adapter and professional Pi facade must also preserve
physical settlement: neither their abort race nor a 30-second cleanup timer proves
an issued prompt ended. Keep their runtime Promise pending until that prompt
settles or the facade confirms idle. Logical Application cancellation stays
responsive. No retry, provider call or eligibility change is added. Offline
P1-C4 tests use installed Pi streams and a bounded synthetic facade; the causal
counterexamples are retained in red-pi-physical-001. Late unopened sessions still
never prompt and retain their existing bounded cleanup behavior.

### A explicit reusable configuration and grant fences

Preparation registers the explicit scenario in the existing `membership_configs`
relation and stores selection/methods in its existing prepared receipt. The Store
returns only complete, hash-matching preparation/config pairs. Application and the
closed `inspect_config`/`prepare_config` Main operations consume an explicit
id/version/hash reference and reread persisted values. There is no default/latest
selection or second config authority. Same-version selection or semantics drift
refuses; an explicit new version leaves the earlier receipt intact. Plan-only old
configurations remain readable but cannot be offered as complete reusable input.
Real repeated-task tests reach DuckDB/Python and Run4 using that persisted version.

The ordinary workspace offers saved versions and their readable scope; selection
removes the full mapping/period/status/maintainer form. Expert editing remains
available. Revenue uses CNY yuan, rates use percentages, rate deltas use percentage
points, and durations use readable units. Exact raw values remain in closed expert
details. Cumulative usage and history stay visible. SSR checks these projections;
native interaction is still blocked before product Main and is not claimed.

Expiry/source drift calls the existing durable epoch fence before admission or
publication, including changed authorization files and a timer while Pi is pending.
The in-memory pending-fence marker closes further admission if the store write
fails; explicit stop/readback can complete it. Reopen retains its existing durable
interruption fence. Neither a failed revoke nor a restored source silently renews
a grant. Issued work retains physical ownership and charged usage until settlement.
No persistence migration, authority expansion, automatic retry or resource default
is added. Decision001 C3/C4 and Decision002 remain the contract authority.

### C5/C6 implemented offline consumers

Closed `comment`/`process_comment` Main commands now consume existing schema110
comments. A comment pins exact report/version/hash/scope/author/consent. The Pi
comment purpose accepts only expression/periods/question/unsupported classification;
normal analysis refuses comment output. A recorded expression response is saved
before publication so an explicit local-save retry does not repeat model work.
New draft versions replace primary expression while retaining original factual bytes and exact source/evidence fields;
expression receipts distinguish them from the single original calculation report.
No previous comment/report prose enters outbound context. Raw column names are
now protected alongside raw identifiers, groups, filenames and forbidden paths.

`preview_periods` qualifies only the new date pairs against the same snapshot and
pins the old preparation, current report, task row and explicit next config version.
`apply_periods` returns NO_CHANGE without mutation or atomically creates a Draft
revision and preparation after fencing prior admission. New authorization consumes
the exact new selection through real engines. Earlier prepared receipts remain
valid historical owner/revision references; the workspace reads prior revisions.

The C6 slice uses `membership_reviews` for immutable draft versions and their
stable intent IDs. Source capture includes current Finding/Run/plan/report hashes,
Case row version and sidecar formal head. Incomplete fields remain drafts; final
validation uses the existing Closure and decision rules with a narrow fact/candidate
context, not a fabricated Completed Assistant source. Receipt disposition belongs
to the existing unique `(review_id,version)` membership receipt. Explicit more-
evidence saves work only. The two formal outcomes use the approved attached
transaction, then exact readback. Sidecar102 adds the closed membership-review
origin to actual decision/history/report consumers; it never creates legacy
Attempts or Drafts for P1. Native verification remains outstanding under Decision003
and does not block this offline source/test work.


### Current C6 storage and compatibility details

`appendMembershipReview` uses the existing acceptance, decision form, Closure,
report and command-receipt relations in one state transaction; it does not call
three separate public commands. Choice attaches the same-filesystem sidecar,
checks DELETE/FULL and integrity, migrates exact 100/101 to 102, then writes actual
Decision/Expected/report/head with membership-review origin. State remains110.
The one membership intent receipt commits with all effects and task grant closure.
Immutable candidate files are fsynced first and stay invisible unless referenced
by the commit. Failed files are never scanned, adopted or removed.

Review capture pins exact report/Finding/Run/plan/row/formal head. Closed nested
fields permit incomplete drafts but final validation reuses the existing complete
Closure and Decision rules. P1 Expected adds separate dependencies, explicit
Guardrails applicability and its reason. Legacy fields stay readable unchanged.
The legacy source-draft editor refuses a P1-origin record instead of inventing
an old model Attempt/Draft. P1 edits occur in immutable human review drafts before
formal submission. Formal-history/report readers validate the closed P1 origin
against the authoritative state review/receipt and exact fields.

Expression refresh carries the same Finding/Run/plan's last human fields into a
new review version; old versions remain exact. Period changes start a different
revision/source and do not silently rebind old formal fields. Final completion
revokes model admission in the same transaction without resetting usage.
Unknown commit/readback locks new submission until complete readback. Missing
committed sidecar is an integrity failure, never a reason to initialize a replacement.

Private close observation now asks actual business applications whether they
have work, rather than treating a Provider-settings probe as a business task.
It neither frees the shared physical lease nor changes grant/eligibility effects.

### Decision004 retained-entry continuation

[Impact brief](contract-impact-p1-completed-source.md) retains the counterexample.
Decision004 now requires the original task ledger, separate explicit main/child
grants and closed P1 material projection at all retained entry points. The actual
consumers now pass the original leak negative and explicit configured main/child
positive paths, including human MODEL adoption and parent reuse. Native verification
remains unresolved; Decision003 does not authorize any alternate route.

## Decision004 concrete consumer contract (recorded before implementation)

A Completed source derived from Run contract4 carries an additive closed local
`membership_origin {version,task_id,prepared_sha256}`. Store derives it from the
real task/revision and validated preparation; a missing/ambiguous relation refuses.
This is local provenance, never outbound raw identity. Non-P1 source shapes remain
unchanged. Application authorization gains `membership {version,task_id,source_sha256,
profile,purpose,session_id,created_at,expires_at,usage}`; its exact disclosure binds
source snapshot, selected text/material, recipient and tools in the existing
immutable authorization. Start remains explicit and consumes no sibling grant.

Profile composes one business-oriented retained-membership access helper from the
existing membership Store, original snapshot Store and Desktop Application. It
validates confirmed source bytes/config on prepare, issue and publication; rebuilds
outbound context from the existing closed totals/periods projection; rejects unsafe
selected text/history/results; replaces local reference identities with per-request
aliases, mapped back only after exact output validation. Every tool response uses
that same projection. Selected report summaries contain verified totals only,
never report bodies, groups, human fields or prior comments.
Only selected MODEL material is eligible. Missing/changed profile refuses before
transport. The adapter's explicit retained-membership mode stays synthetic-only.

Retained grants are real new rows in membership_grants with optional closed
`retained {session_id,authorization_id,authorization_sha256,source_sha256,purpose}`. A membership_attempt
row uses the actual retained Assistant Attempt id for ledger attribution; it is not
legacy formal authority. The task remains closed and Completed. A dedicated bounded
Store mutation validates this branch while ordinary task writes keep their existing
closed-state refusals. The same membership_usage reservations charge original
cumulative limits before effects. No allowance increase, migration or new authority
store. Stop/close/reopen/expiry revoke only the affected retained grant; the prior
membership grant stays revoked. Unknown issued work remains charged/reserved and
physical lease release still depends on actual turn settlement. Waiting is reserved
in the same ledger. Persisted exact grant/profile/epoch/source checks fence late
publication even when the physical turn cannot yet be cancelled.

Rollback retains110/102 rows and refuses unsupported new grant shapes. No older
reader is permitted to silently reinterpret retained grants as ordinary grants.
Readback validates their closed fields and actual task/config/attempt relationships.
Focused proof: original leak RED, configured main and child real Pi protocol with
same ledger, isolated grants, totals-only tools and selected-history/report/result
refusal, unknown usage/stop/expiry/drift/reopen, plus retained001–003 regressions.

The retained source link activates existing102 in its existing transaction before
P1-origin data is stored, even after analysis-only C6. Actual frozen c413bee3 reader
refuses102; injected activation failure rolls back and old101 records remain exact.
Profile supplies the same membership Store and existing Pi Adapter. No resource
default is introduced: legacy compatibility limits are derived solely from the
explicit finite synthetic P1 profile and never enlarge the original ledger.

Both retained authorization dialogs display original cumulative/remaining resource
values before unchecked text confirmation. Completed membership formal records are
read-only in Quick/professional history; legacy non-P1 revision remains supported.
Expression reports replace primary text and preserve exact original fact sections
inside an expandable evidence section. Report versions and human review edits stay
immutable. Final fixed-source tests and package limits are in verification.md.

### Validator F1–F4 correction design

Keep existing110/102 and closed IPC/persistent contracts. General path refusal is
one pure text rule called by the existing outbound validator, so actual Adapter
and Application consumers enforce it again on selected/history/returned material.
Review summary/suggestions are a local, derived presentation of the exact current
ReviewSource, prepared configuration and verified Finding. They never consume old
comments/model expression as authority. Existing review.fields persist only human
chosen edits; no new durable suggestion ontology or formal effect is added.
Component submit returns the confirmed projection or null, never a swallowed-failure success. Draft report identity
is captured locally and stays pinned through refresh/failure. Formal status shares
one exact persisted-record matching projection between main and side panel.

Correction implementation details: the default summary is derived before opening
an editable draft, using only the current verified report/Finding/Run and prepared
configuration. Opening/saving a review remains explicit. Inapplicable guardrails
keep their human reason and remain distinct from dependencies. A dirty review pins
its optimistic source; readback cannot remount it. A same-source newer saved draft
requires an explicit keep-edits action before another save. Confirmed comment saves
clear only their exact text/version/consent and only if no later edit occurred.

The same P1 final report can appear through both Completed source and formal
history. Selection deduplicates that identical persistent ID for P1 main/child
consumers; unknown IDs remain forbidden and non-P1 selection is unchanged. This
closes a private consumer issue found by the new selected-report positive test.
General material refusal includes recognizable relative file paths, encoded paths,
and paths returned as model questions, explanations or comment revisions. Return
validation precedes business publication; issued usage remains charged.

### Second correction: private lexical and confirmation identities

Keep outbound text unchanged. The shared local material predicate recognizes
extension boundaries next to punctuation and uses inspection-only numeric slash
spacing normalization; no classifier or filesystem action. All actual Pi and
returned/reused material paths continue using the same validator.

Replace the bare review checkbox boolean with its exact reviewed identity. Derive
checked/admissible from that identity and the current projection, and check it again
inside each submit handler. Keep a current admission ref so an old handler cannot
bypass a newer render or in-flight local edit. More-evidence is still an explicit
question-only exit and does not require Finding acceptance. Reuse existing optimistic
Main/SQLite review admission without adding persistent fields.

### Third correction: whole-expression inspection

Supersede the numeric slash spacing normalization above. Tokenize connected slash
segments without erasing separators or whitespace first. Only a complete numeric
expression (or the existing Chinese business-label ratio form) is exempt. A leading
root, empty segment, hidden name, extra nonnumeric segment or mixed path syntax
cannot borrow a numeric exemption. Relative paths are identified by segments, not
extensions. Normalize compatibility/percent encoding only in an inspection copy;
keep the original selected text and payload untouched. Use the existing outbound
validator at actual Pi and Application reuse/publication boundaries. Test these
public seams; no new service or durable shape is needed.

### Fourth correction: preserve ratio operand boundaries

The inspection copy may coalesce a quantity's percent/unit spacing and a Chinese
label's balanced Chinese unit annotation, only within a slash-free operand span.
Do not erase a slash or exempt a matching substring. Then validate the complete
slash expression with numeric quantities/units or Chinese labels as operands;
additional filesystem segments remain disallowed. Actual payload bytes never
change. Extend actual Pi and Application consumer tests with both safe operands
and matching unsafe adjacency; retain all prior adversarial cases.

### Fifth correction: recognize annotated operands before tokenization

Recognize balanced Chinese unit annotations with optional formatting spaces. A
complete pair of annotated operands may normalize its separator spacing in the
inspection copy, retaining that slash and every surrounding byte. This avoids
mistaking an annotation fragment for a root without broadening the existing
unannotated path grammar. Numeric/percent/unit spacing keeps its existing rule.
Generate bounded variants by changing each formatting boundary independently,
then combined spacing/width controls; verify original payload identity and unsafe
adjacency across actual Pi slots and focused Application consumers.
