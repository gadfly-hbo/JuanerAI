# Change004 engineering decisions

2026-10-02 · Mac mini Engineering Controller.

Applies to the concrete C1–C6 design returned by the configured worker in
`worker/design-001`. This is the in-boundary impact decision under the sole
execution policy, not another user approval or Spec Gate. Product/UI and the
user's development-start instruction remain as bound in intake.

## Decision 001 — Proceed with the first real plan-consumption loop

**C1 approved.** Closed versioned scenario/plan, planned execution/result v2 and
Run/Evidence v4, with exact legacy dispatch, are necessary to make method and
parameter choices executable and traceable. M1-only must avoid group execution
in both independent engines. Keep valid group mapping available separately.
Positive-denominator zero remains a valid zero rate; zero denominator becomes
explicitly unavailable on the new path. Selected M2 with a zero-denominator
period must retain the approved not-applicable semantics, not publish a group
comparison as sufficient. No legacy bytes are upgraded or rewritten.

**C2 approved with simplification.** Use one explicit P1 state.sqlite activation
version (100→110 / schema1.1) for the complete Change. Do not add a second 110→120
migration just because A and B are internal delivery steps. Final closed DDL
and readback cover the P1 records necessary for this same approved stage; table
creation does not imply that unfinished UI/behavior is enabled. Document the
exact DDL and constraints before first activation. Prefer existing durable
records/helpers whenever they carry the required meaning; do not duplicate
full source/evidence bodies across new tables. The proposed identity/ownership,
uniqueness, revision guards and no-down-migration rules are approved. New task
activation is explicit; ordinary old history reads do not migrate. Both legacy
flows and records remain usable in the new build. Preserve original values and
prove interrupted migration recovery on synthetic Projects before acceptance.

**C3 approved.** The membership task Application/business protocol remains
scenario-specific, within the existing Pi Adapter and same Profile/model lease.
Do not weaken Completed Assistant eligibility or expose Pi internals. A new task
entry does not create an alternative analysis core. One task owns one Case; quick
and professional views refer to it without duplicating a Case or migrating the
type of a legacy Session. F1 is a closed outbound projection with group materials
local; real recipient/payload activation remains unapproved.

**C4 approved with lifecycle clarification.** Resource profiles are explicit
required configuration; no production defaults, invented hard-money cap or
user-budget values. Tests may supply clearly synthetic finite values. Reserve
before effects and retain unknown inflight usage across failure/reopen. Logical
Stop fences new work immediately, but do not release the global model lease
while the issued runtime operation is still active. Release once the operation
has settled or the Adapter confirms cancellation; distinguish a UI stopped
state from physical completion. This preserves one actual model work slot,
including Waiting, without a queue or silent concurrency. Any unresolved effect
remains visibly unresolved; no optimistic zero-charge settlement.

**C5 approved with NO_CHANGE clarification.** Preserve version-bound comments,
immutable factual sections, source references and human edits. Dependencies and
guardrails/inapplicability remain independent, with legacy Expected compatibility.
An equal-value scope update itself causes no new revision/Run/Attempt or new
resource reservation. A previously authorized comment-classification call may
already have consumed resources; NO_CHANGE never erases that history or promises
the entire preceding conversation was free.

**C6 approved for bounded implementation and proof.** The single attached-DB
transaction is permitted for the specifically approved combined human review.
Keep same-filesystem, DELETE journal, FULL sync and integrity preconditions;
do not silently convert unrelated storage or change legacy mutation paths.
Closed sidecar provenance/migration (100/101→102) is permitted when required by
the first explicit P1 formal choice. Prepare invisible immutable files, commit
all formal database effects and the unique receipt together, then read back
uncertain outcomes. Prove cross-database interruption/recovery and uniqueness
on owned synthetic Projects; a mechanism description is not crash evidence.
If its proof fails, return the actual counterexample before an alternate design.

## Execution and verification

Resume the same engineering worker. Update only the affected proposed design
and tasks to reflect these decisions. First implement P1-PLAN-01 through the
early P1-CHAIN path using minimum sufficient spec → causal RED → GREEN, including
real DuckDB/Python, source/plan identity, zero/empty cases and legacy compatibility.
Do not stop at serializer tests or claim full A/P1 delivered. Then continue the
approved A/B dependency sequence within these decisions; private corrections do
not return for per-command permission. Worker returns concise evidence at the
first connected result so Controller can update the existing board.

Allowed/conditional/forbidden roots and effects are the intake's. Preserve old
tests and retain failures. No production Provider call, credentials/business
data, dependency installation, publishing, merge, archive, installation or
product acceptance is granted here. Human experience work stays with the user.
The complete fixed candidate later receives fresh independent validation.

## Decision 002 — Shared model slot across the retained Assistant

The Stage A cross-entry test demonstrates that the retained Completed Assistant
can release `LocalModelAccess` after logical Stop while its issued Runtime turn
is still pending. A membership task can then acquire the same physical slot.
Correcting that path is within C4 and the approved shared-slot compatibility
boundary. It does not change old eligibility, authorization scope or formal
effects, and needs no new product decision.

The current Application races the Runtime turn against abort/timeout, and both
`settle` and `closeSession` can release the lease. The race ending is not proof
that the Runtime turn ended. Track the original issued turn separately from the
logical loop. Fence publication immediately on Stop, timeout or close; release
the lease only when no physical turn remains and the task is terminal. A normal
Waiting state retains its lease. Use the same condition on all release paths,
including late resolution and rejection, without an unhandled Promise rejection
or double release. Keep the public stop operation responsive. Private tracking
and helper names remain the worker's choice.

Required evidence: the existing cross-entry causal RED becomes GREEN; delayed
Runtime resolution and rejection after Stop keep the slot occupied until they
settle; Waiting and normal success still work; timeout, close and Renderer loss
cannot release early or publish late. Retain applicable old Assistant and child
eligibility, grant, source and isolation assertions. Verify the actual Pi Adapter's
turn Promise semantics; do not equate an abort notification with confirmed
physical cancellation. No real Provider call is authorized for this proof.

## Decision 003 — Continue implementation with native verification unresolved

The Stage A native interaction attempt built its Main/Preload/Renderer inputs,
but Electron exited with SIGABRT before product Main; the diagnostic also records
kill EPERM and a macOS task-name lookup failure. Evidence is under
`worker/stage-ab-20261002T010119Z/native-a-001` and
its sibling `native-a-diagnostic-002` and `native-startup-probe-003` directories.
This is an unresolved launch/verification limitation,
not an interaction PASS or evidence that product behavior failed.

Retain the test and exact failed inputs. Do not change sandbox/security settings,
use a different host/browser route to evade a denial, or reinterpret the blocked
prototype as permitted. Native verification remains due on the fixed integrated
candidate through a properly permitted route. No permission is added here.

Continue the already authorized, unaffected A corrections and B implementation
using the existing offline toolchain and synthetic data. The missing native check
does not make B's code/spec/tests depend on another user start approval. Keep A
and full P1 acceptance unclaimed; carry this exact verification gap and return
point into the final candidate for independent review and the user decision
needed if it remains unresolved. Complete authorized implementation before
requesting additional execution permission.

## Decision 004 — Retained entry consumes the P1 origin policy and ledger

The concrete `contract-impact-p1-completed-source.md` and causal
`red-legacy-boundary-039` establish a P1-origin material leak through the retained
Completed Assistant. The approved product decisions §2 and §6, stage plan §3/§5,
and UI-P1-13 expressly preserve post-review Assistant and manual 003 capability.
Disabling that eligibility is therefore not an implementation substitute.
This is Mini's in-boundary C3/C4 impact decision; no new product/data permission.

Approve the proposed closed additive P1 source-origin/material policy, consumed
by all affected retained Assistant and manual collaboration paths. Choose the
**same originating P1 task's persistent usage and inflight reservation ledger**.
A post-completion entry does not reset consumption or silently create another
resource allowance. Retained Assistant and every child still require their own
explicit purpose/source/material/recipient/operation/expiry-bound authorization;
there is no inheritance of the old task grant or a sibling's grant. Formal
completion leaves the original task grant revoked and the Case Completed. New
explicit authorization for a retained capability neither reopens the Case nor
repeats formal effects. It must visibly bind the originating task ledger and
remaining resources. Only an explicit authorized resource extension may increase
the allowance, retaining all earlier usage and unknown reservations.

Use the existing required finite P1 resource configuration and closed material
projection. Missing, unknown or incompatible P1-origin configuration denies model
issue before credentials/transport; ordinary legacy authorization is insufficient.
An explicitly configured synthetic profile must exercise successful completed
Assistant and manual child use, so closed real activation is not a permanently
disabled feature. No production defaults, real activation or F1 group disclosure
are approved. Keep P1 groups local. Enforce the origin policy at admission, prompt
assembly, tool results, selected report/history and returned/model-only material
where it could otherwise launder prohibited content. Bind exact source versions
and lineage; unknown origin or drift refuses instead of treating it as legacy.

Preserve non-P1 001–003 behavior and their own exact grants. Preserve manual-only,
single-level, sequential collaboration, MODEL-only adoption and the same physical
model slot. Charge/reserve at the actual Application effect boundary, retain
unknown issued usage across Stop/failure/reopen, and never release a still-issued
physical turn. A stopped/closed grant cannot be revived by another entry.

The worker owns the smallest necessary spec/design and versioned business-shape
updates within the existing Core/Application/Port/Adapter/Profile seams. Reuse
current110/102 relations; no new runtime, generic policy framework, schema120 or
fake legacy source/Attempt/Draft. Record the concrete additive authorization and
origin shapes, actual consumers and rollback/readback before their dependent
implementation. Ordinary private choices do not need another Controller turn.
If those existing relations cannot represent the approved semantics, return that
specific persistent-contract impact before another migration or scope change.

Required proof includes the retained causal leak RED becoming GREEN, successful
explicit synthetic P1 main/child grants with exact ledger attribution, missing or
changed configuration/source rejection, selected-report/history and child-return
laundering refusal, no inherited authorization, durable usage/unknown reservation,
Stop/late-result and shared-slot contention, plus unchanged non-P1 001–003 tests.
The original RED's fixed call-count assertion may be extended to distinguish
unauthorized rejection from the newly authorized positive path; preserve its
material/usage counterexample and all negative intent. No new disclosure, resource
reset or user-facing capability removal may be hidden in a test update.

Continue the same engineering worker after its current bounded return. Finish
unaffected deterministic/configuration-inventory regressions within the declared
scope. An exact new approved TypeScript include tuple may be added for this Change
while preserving all older accepted tuples and their rejection cases; this does
not authorize dependency/package version or unrelated configuration changes.
Native verification remains governed by Decision003. Final complete candidate
and evidence still require independent Validator review.

### Decision004 storage clarification — explicit P1-origin writes use102

The new source-origin/authorization shape must never be stored under a sidecar
version that old100/101 readers accept. The existing100/101→102 activation is
approved for the first explicit P1-origin retained-entry write (such as its new
source link or grant), as well as the C6 formal-choice write. This is the same
closed102 schema and same preserved legacy rows/files, not an added migration.
Activate and validate before persisting the new shape; interrupt/failure cannot
leave102-origin rows labeled100/101. Do not activate merely to list/read old
history or inspect a source. Model admission still requires its own explicit
P1 grant/configuration; storage activation grants no disclosure or execution.
Test actual frozen old-reader refusal and unchanged old100/101 records, plus
failure/reopen around this explicit activation. Exact private wiring remains
inside the approved Decision004 package.

## Current disposition — offline candidate reviewed (2026-10-02)

The Controller has received `worker/stage-fixes5-20261002T090727Z/corrected-offline-005` under the sole Mac mini evidence root `/Users/bendandebaba/JuanerAI-artifacts/change-004`. Receipt SHA-256 `c20455d7f53b1eab9dbb13cf30f12dfa54ebaa260b32a0bd56dd6ec25ac759b4`; source candidate `080a55f9abb23d8e1b358b96a6b6e410ef0707b095cfc2bc734a2b52b9e3009a`. Author work is saved, final invocation exited 0, no agent or test command remains active. Controller performed mechanical source/evidence freeze and a separate 2500-read/646671004-byte readback with zero mismatches; this is identity evidence, not acceptance.

Independent `controller/validator-review-006/last-message.txt`, SHA-256 `9716fa6decb9f3e346e27aa4d40522874e9a5714861db6b53aa8c82860e4a45b`, reports bounded F1 implementation PASS and no remaining material implementation blocker in its review. F2/F3/F4 retain their prior independent conclusions on unchanged code. The overall verdict remains **BLOCKED**. Author final 273 contract and 39 focused integration tests, type check and static current package passed. Historical regression is reused only for unchanged scope; the counts are not additive. The final package identity and all raw evidence are bound by the fixed receipt.

**Engineering Acceptance is withheld.** E1: the read-only Validator could not create its synthetic SQLite fixture (`mkdtemp EPERM`) and did not reach persistence assertions. E2: native Electron previously terminated before Main with SIGABRT and cleanup EPERM; root cause remains UNKNOWN. Neither denial has been bypassed. Author persistence results and in-memory component probes retain their stated limits. Current review does not prove native interaction, real Provider quality/cost, user Product Acceptance, installation/release or archive. The user explicitly deferred their own experience review; this is not a request to repeat it before development.

**NEXT_ACTION:** obtain the user's explicit, scoped execution-permission decision for the remaining automated engineering verification. Proposed scope: independent test execution with the product source kept read-only; allow only required synthetic fixture/evidence/build-output writes and local Electron test startup/cleanup. Continue on this Mac mini with the pinned existing offline toolchain and exact candidate. Determine and attest the permitted sandbox and generated-write roots before execution; a permission decision is not evidence that the route works. Do not access real credentials, real business data or Providers, install dependencies, alter system security, change host/browser route, or publish/install the application. This paragraph proposes an exception; it does not grant it.

The return points are the selected persistence tests in `tests/integration/xanthil-desktop/member-task.integration.test.ts` (the denied command selected P1-A-CONNECTED-01, P1-B-ATOMIC-02 and P1-D004-01), the retained native test `tests/e2e/xanthil-desktop/member-task-native.e2e.test.ts`, and then the applicable required canonical/native/package verification on the same fixed candidate. Any newly observed product defect returns to the configured engineering agent and independent revalidation. Retain all previous failures. If permission remains unavailable, preserve BLOCKED and do not archive or claim acceptance.

The complete six-plus-two coverage map, scoped delta, 40 stable IDs and remaining gaps are updated in `docs/planning/capability-coverage/`; no new target has been marked accepted. These Controller status/coverage updates follow the reviewed source freeze and are separately preserved in `controller/offline-handoff-001` and `controller/coverage-update-003`. No product source/test byte changed after review. Material remains on this device with uncommitted work; Git integration and cross-device backup are not claimed.

## Permission resolution — isolated verification approved (2026-10-02)

The user explicitly replied “批准” to the Controller request for isolated synthetic test writes and local Electron startup/cleanup with product source read-only. This resolves the execution-permission question in Current disposition; it does not waive tests or grant Engineering/Product Acceptance. Existing data/Provider, dependency, Git, installation/release and system-security boundaries remain.

Use a process-local named profile for this validation: filesystem root readable, only `/Users/bendandebaba/JuanerAI-artifacts/change-004/controller/validator-permitted-001` writable. Test TMPDIR is inside that root; no permanent global or role configuration is edited. The Controller permission probe confirms artifact write succeeds while opening Core, test and AGENTS files for write is denied (zero source bytes written); exact invocation/results are saved in that root. Independent Validator must repeat this probe in its actual loaded session before product tests. Local network access is available for Electron testing; this adds no external product-data or Provider authority.

The configured `juaner_validator` remains independent and source-read-only; the new explicit user permission is a temporary exception for synthetic fixture/build/evidence writes and owned local native process startup/cleanup. Preserve gpt-6-astra/high and approval_policy=never, attest actual loaded permissions, and limit writes to the isolated root. Resume the existing author-independent context for E1/E2 and required checks; return all failures honestly, retain prior evidence, and do not auto-expand permission if this route fails.

## Verification result — approved isolated execution (2026-10-02)

The approved execution used the same independent Validator context `01a0fb65-7773-7680-bfee-3cf7e1ebe412`, gpt-6-astra/high/never. Actual turn metadata and the successful source-write-denial probe are saved under `controller/validator-permitted-001`. A process-local permission profile kept original product sources and dependencies read-only and allowed only the named artifact root writes; no global or role config was edited. The effective runtime represents this as workspace-write with general temporary roots excluded. All 184 candidate sources remained equal to corrected-offline-005 before and after execution.

**E1 PASS:** independent execution of the complete membership integration suite passed 158 tests, 0 failures and 0 skips. This includes actual synthetic analytical/persistence paths, five SIGKILL/hot-journal recovery points, original-ledger Fork/Subagent authorization and return/adoption, and F1–F4 persistence/readback checks. Review007 SHA-256 `29d778feb5b9261e189afd47f397ee0df215a876298e4a631d8cd291a6eb295a`; raw command/results in `controller/validator-permitted-001/validation-007/persistence-001/`.

**E2 remains BLOCKED:** the authorized native attempt built Main, Preload and Renderer, then Electron PID34623 exited SIGABRT. Test exit1; no window/IPC interaction or Main entry was established. Playwright's cleanup kill and Validator's process enumeration were denied. Playwright observed the exit and temporary cleanup; Controller's later exact-PID ps readback found PID34623 absent. That is Controller evidence, not an independent certification of every descendant. No further launch or alternate browser/host route was used.

Controller's bounded read-only host diagnostics matched the PID and crash timestamp. The saved crash stack reaches `_RegisterApplication`/`NSApplication` initialization; saved kernel/launchd logs explicitly deny this Electron process Mach access to `com.apple.windowserver.active`, `com.apple.coreservices.launchservicesd` and other desktop services. This establishes a concrete sandbox/service incompatibility in the attempted route; it does not prove that it is the only cause or that any permission change will make the test pass. Raw crash, filtered unified logs, extraction and exact-PID readback are under `controller/validator-permitted-001/controller-native-*` and `controller-process-readback.json`. No system-security setting was changed. Supported profile controls were checked against [official permissions documentation](https://learn.chatgpt.com/docs/permissions) and [developer commands](https://learn.chatgpt.com/docs/developer-commands); no supported narrow GUI-service override was established for this invocation.

Canonical portable execution on a source copy first stopped on two dependency-layout constraints. The untouched remaining portable groups passed 1764 tests with zero failures and one existing real-model-gated skip. A byte-identical dependency copy then allowed independent targeted recheck: 4 matching tests passed, zero failed, exit0 (two original failures and two matching configuration checks). Targeted result SHA-256 `09dba88aed76cb7509b6753fb1c38b8a0d3a278d10b2dfea4bb97fbf95dc4750`. Historical failures remain; these component results do not constitute a complete canonical command PASS. No test/source/dependency version was changed or installed. Full native/package validation also lacks the current package's required registered-producer GUI readback.

**Current state: engineering verification BLOCKED by E2 and incomplete full canonical/native/package evidence.** No new material product defect was established. Engineering Acceptance, user Product Acceptance, archive and Git delivery remain unclaimed. User experience remains deferred as explicitly requested. Evidence is available on this Mac mini only; work remains uncommitted and cross-device backup is UNKNOWN.

**NEXT_ACTION:** retain the fixed candidate and source-read-only validation boundary; establish a supported native execution environment that permits the required macOS desktop services, then run the remaining native interaction/cleanup and current-package/full canonical checks. The existing user approval for isolated test writes and local Electron startup persists; do not request the same approval again. A different host, browser, disabled sandbox, broader safety boundary or real-provider activation is not inferred from it. Preserve all failed attempts and distinguish execution-environment repair from product-code correction.

Final independent supplement008 exited0; report `controller/validator-permitted-001/validation-008/last-message.txt` SHA-256 `2931d404bd1d7b449f51a3a4a845c2e1c391021b6595bb342c70b5bc90b66610`. Both original layout failures are closed by 4/4 matching checks; all original dependencies,184 candidate sources and1905 copied source files remained unchanged. E1 PASS and E2 BLOCKED stand. No Validator/test command remains active. Controller host-service denial diagnosis was collected separately and is not represented as Validator execution.

## User delivery decision — E2 deferred (2026-10-02)

User: “放行E2，后续再修，交付change004”. Mini records [Engineering Acceptance with E2 waiver](engineering-acceptance.md) and the open [E2 follow-up](e2-follow-up.md). This later explicit instruction supersedes the prior delivery stop for this fixed candidate. Historical Validator BLOCKED and native failures remain unchanged. Human experience remains deferred; Git delivery and mechanical archive are now authorized. No install/release or real Provider permission is added.


## 2026-10-02 delivery CI timeout correction

Independent delivery review009 passed at HEAD `6a035185f6eaa6afeb6380bef1b6f646e5ba4f11`: 153 delivery files,177 preserved production/test/config files and32 frozen product inputs matched; CI contracts62/62. Report SHA-256 `9f9b70688addca1ad4c3253c600811a555bb4863c32a403b4ad59299b1bf4be9`, under the existing evidence root `controller/validator-permitted-001/delivery-review-009`.

[PR59](https://github.com/gadfly-hbo/JuanerAI/pull/59) initial [hosted run36995989555](https://github.com/gadfly-hbo/JuanerAI/actions/runs/36995989555) stopped portable-regression at180seconds, exit124. Completed test groups had no assertion failures; unfinished groups were not proved. This failure is separate from the user's E2 waiver.

The Controller selected a finite1080second allowance only for the exact portable-regression label, within the unchanged20minute job cap. All other stages remain180seconds; TERM, five-second kill grace, full commands/tests, log reservation and separate streams/exact exits remain. No product, dependency, runtime or permission expansion. Two same-context worker attempts produced the isolated fixed source and specification but then made no tool progress; both were stopped at a boundary with no test child running. The Controller authored only the two-file CI correction; the original author-independent Validator remains responsible for its final review.

Causal configuration RED observed180s versus required1080s; it is not a product RED. GREEN: all93 affected CI contract tests passed, zero failures/skips. New executable cases cover every current label, near-match/unknown labels, exits0/17/124, signal/grace, exact streams and one wrapper invocation. Four isolated mutations (job cap, global allowance, signal, label) each failed. Existing assertions/tests were retained. Evidence: `controller/delivery-ci-timeout-author-004` under the sole Change004 artifact root, with RED/GREEN streams/results, mutation results and frozen file identities. Hosted completion and independent review of this delta are still pending at this record. E1 PASS, E2 BLOCKED-with-user-waiver and deferred human Product Acceptance remain unchanged.
