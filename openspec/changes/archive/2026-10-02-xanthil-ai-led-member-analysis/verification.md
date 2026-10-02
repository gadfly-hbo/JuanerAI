> Current archive disposition (2026-10-02): [Engineering Acceptance with E2 waiver](engineering-acceptance.md) authorizes this delivery/archive. E1 independently passed; E2 remains open in [follow-up](e2-follow-up.md). Human experience remains deferred. Earlier status and unchecked items below are historical and have not been relabeled PASS. See [completion](completion.md).

# Change004 — engineering checkpoints

Current integrated offline result and HANDOFF_BACK are in the final section. Earlier sections are immutable historical checkpoints.

2026-10-02, Mac mini. Authority: [decision001](engineering-decisions.md), C1–C6;
[spec](spec.md), [current design](design.md), [remaining tasks](tasks.md).
This is the first offline part of A. It is not A/P1 completion, independent
validation, Engineering Acceptance, user Product/UI Acceptance or Git delivery.

## Completed result and reused seams

- Existing `startAnalysis` accepts a closed internal v2 command carrying an explicit
  plan. It verifies confirmed owner, snapshot, selection, scenario and source bytes
  before effects. Existing IPC v1 stays closed. The existing personal Profile
  already composes this Application, execution Adapter and stores; no second core.
- Same real DuckDB/Python factory: M1-only retains valid mapping but executes no
  group aggregation in either engine. M1+M2 independently calculates exact group
  contributions. Tests observe actual SQL input and Python executed lines; selected
  SQL is the executed suffix and the saved Python asset is the executed code.
- The same seven-method Run store handles explicit Run4/evidence4 and exact Run3.
  Plan hash, method code identity, selected assets, both output envelopes, source
  descriptors and original confirmation bytes are checked. Physical files alone
  do not create SQLite success visibility.
- Existing admit/publish/settle, aggregate/Finding/report tables, optimistic guards,
  receipt replay, immutable file helpers and report projection carry the result.
  Draft reports contain plan identity and both evidence links. Zero denominator is
  unavailable/Inconclusive; genuine zero remains 0/1; fully empty input blocks.
- One explicit state.sqlite 100→110 transaction preserves existing row values and
  receipt order, adds the [exact P1 DDL](schema110.sql), admits the plan and commits
  its start receipt together. Ordinary old reads do not migrate. Run3 remains
  usable on schema110. No down-migration; unknown schema refuses without repair.
  Real process death before migration commit creates a hot journal and SQLite
  recovery restores the exact original database bytes. Lost COMMIT response
  resolves through the existing receipt with one Run/report.
- Planned drafts cannot enter old single-Finding acceptance before the approved
  combined review is implemented. User review/acceptance remains explicit.

## Test result and causal evidence

Persistent root: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/implementation-001`.
Each run directory contains full `command.json`, `inputs.json` plus source copies,
`output.log`, and `result.json` with the actual exit and timestamps. No failure
was overwritten. `run.py` records the allowlisted command-local environment.

| Evidence directory | Result | Meaning |
| --- | --- | --- |
| `red-001` → `green-001` | exit1 → exit0 | Healthy real imports/engines; actual M1 SQL originally executed group aggregation, then omitted it. |
| `red-002` → `green-002` | exit1 → exit0 | Missing identity refusals and unavailable-zero behavior, then 18 tests passing. |
| `red-003` → `green-003` | exit1 → exit0 | Confirmed Project healthy; valid planned Application command initially INVALID_REQUEST, then connected Run4/Finding/draft success. |
| `red-004` → `connected-006` | exit1 → exit0 | Planned draft initially entered legacy acceptance; now rejects without acceptance writes. |
| `focused-final` | **exit0, 44 pass, 0 fail** | P1-PLAN-01..05, P1-CHAIN-01..02, P1-COMPAT-01. Includes real independent engines, selected assets, period/zero/empty/invalid cases, foreign output identity, late-result cancellation, reopen tamper, preserved old rows/files, migration crash, replay and unknown schema. |
| `regression-002` | **exit0, 502 pass, 0 fail** | Existing analysis/store/IPC contracts and Application/storage integration, including legacy three judgments and real native crash windows. |
| `typecheck-final` | **exit0** | Installed TypeScript strict noEmit, including new fixtures/tests and existing consumers. |

Other retained failures are ordinary corrections, not causal RED claims:
`typecheck-001` found misplaced migration readback and stale Port/report types;
`connected-005` exposed wrong argument use of an existing fault-injection helper;
`regression-001` had 500/502 passing: the legacy zero-active Inconclusive leaf and
its parent failed. The new shared judgment was corrected to check active counts
as well as the v2 unavailable marker. Existing tests and assertions were unchanged.

Actual commands:

```sh
node --test --test-concurrency=1 tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts
node --test --test-concurrency=1 tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts tests/contract/xanthil-desktop/xanthil-desktop-ipc.contract.test.ts tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

Installed command-local bin:
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001/dependency-preflight-001/toolchain-001/bin`.
Node26.0.0, DuckDB1.5.2, Python3.14.4, TypeScript5.9.3. The existing deterministic
local analysis deadlines are reused; no new real task/model resource default exists.
No dependency installation, credential access or Provider call occurred.

## Fixed candidate and evidence preservation

- HEAD `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`; tree
  `74e042fa0680a22ba29fd68e87f67f8ca6428301`; unchanged branch
  `work/mac-mini/change-004-ai-led-analysis`.
- Working candidate: `candidate-manifest.json` and immutable `candidate/` copies
  under implementation-001, with full worker write-set, byte lengths and SHA-256.
  It includes spec/design/tasks/DDL, code, tests, fixture and tsconfig. No commit.
- `evidence-manifest.json` inventories raw evidence; `readback.json` records an
  independent reread after test writes stop. Actual persistent synthetic Projects,
  migration child/input/output and connected checkpoints are retained in focused
  run directories. Earlier legacy tests clean their reproducible temp Projects;
  their full commands, inputs and outputs remain preserved.
- Owning device/owner: Mac mini / this worker. Receiver: same-device Engineering
  Controller. Local readable/hash-verified; Controller receipt and cross-device
  backup remain UNKNOWN. This is local evidence, not Git-preserved delivery.
- Configured role/model/effort: juaner_worker, gpt-6-astra/high, from the parent
  runtime attestation bound in intake. Workspace-write, approval never. No runtime
  change, agent/task launch, branch switch, board or Controller file edit.
- No existing test asset was edited/removed/skipped. New tests extend current
  fixture helpers. Frozen product inputs, accepted/archive specs, intake and
  engineering-decisions.md remain outside the write-set.

## Precise gaps and next A continuation

1. Current plan entry is internal Application v2 on a confirmed professional Case.
   The normal unfinished Quick/task protocol, blank-task interaction and renderer
   entry are not wired. A task relation binds the same Case; it is not a delivered
   coordinator. No claim of SC-01 end-to-end UI acceptance.
2. C3/C4 is next: explicit required resource profile; grant/epoch/reservation and
   cumulative unknown usage; same existing model lease through actual settlement
   or confirmed cancellation after logical Stop; closed F1 data projection and
   synthetic Pi transport. Reserved schema110 relations reject nonempty rows until
   their closed validators/consumers exist. Real unconfigured activation remains
   unavailable. No invented resource numbers or business defaults.
3. B remains: comments and source/version binding, impact-driven revision, NO_CHANGE
   preserving earlier classification spending, Expected extensions, three human
   outcomes and attached-DB formal review/sidecar102 interruption proof. No second
   state.sqlite schema120 activation is planned.
4. Grant-epoch fault tests, all P1 task/IPC tests, final daily/canonical validation,
   packaging/native UI, real AI quality and the user's later UX evaluation have not
   run at this checkpoint. No independent final validation or full-stage acceptance.
   No prototype/browser rejection was bypassed.
5. Graph discovery was denied by approval policy never; the earlier denial is
   retained in design-001/discovery-limit.txt. Local read-only discovery was used.

**Return point:** same worker at C3/C4 spec → behavioral RED → GREEN, reusing the
verified result chain and shared model access. No new user or Spec Gate is needed.
Mini can record this engineering checkpoint in its own state. No diagnosed
non-convergence, additional authority request or user decision is pending here.


## Stage A checkpoint — physical settlement and connected task, 2026-10-02

**Status: fixed engineering checkpoint; A and P1 remain incomplete.** Authority:
intake, decisions001 C1–C6 and decision002. No new user decision is needed.
The Controller CLI interruption was runtime recovery, not a user stop. Its receipt
remains at `controller/worker-stage-a-001/controller-interruption.json` under the
same Change artifact root. Prior model-request consumption remains **UNKNOWN**.
No prior logs, failures, first-loop code or interruption evidence were reset.

### Result and actual consumers

The normal Desktop membership entry now calls the closed Main/Preload channel,
Personal Profile and task Application, uses schema110 task/grant/Attempt/usage
records, existing confirmed snapshots, Pi Adapter and the same LocalModelAccess,
then the real plan-controlled DuckDB/Python/Run-store/Finding/draft-report chain.
All activation tests are explicitly synthetic; default real activation is closed.
Only selected files enter preparation. Text consent starts unchecked. The early
verified finding survives explanation failure; explicit retry reuses the valid
grant and result, while reservations and unknown issued usage remain cumulative.
Same Case is available in professional view, with legacy mutation/outbound paths
closed for activated membership tasks. B formal review is not implemented.

The completed repair separates logical terminal status from physical ownership:

- Completed Assistant and child Stop/close/timeout immediately fence publication;
  the original issued Promise retains the lease through late resolve/reject.
- Professional helper close/cancel/timeout retains the same physical slot.
- Stored-Xiaomi Pi cancellation waits for its actual prompt; facade cleanup waits
  for issued-prompt settlement or confirmed idle, never an elapsed cleanup timer.
  SDK abort is a notification. Waiting remains occupied, with no queue or retry.
- Active membership Project switching refuses BUSY before implicit close.
- Main VM fixtures load the real membership handler, and React emission loads the
  real component. The exact additive IPC inventory and foreign-sender refusal
  remain asserted; all original twenty-method and isolation assertions remain.

### Execution and retained failures

Persistent Stage A root on Mac mini:
`/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-a-20261001T232433Z`.
Every run preserves `command.json` (argv/cwd/allowlisted env), `inputs.json` and
source copies, full `output.log`, and `result.json` (exit/timestamps). The runner
uses the already approved pinned toolchain; no install or ambient credential env.

| Run | Actual result / scope |
| --- | --- |
| `focused-a` | 76 pass, exit0: task/protocol/structural UI and first-loop tests before recovery. |
| `build-a`, `affected-types` | Initial Stage A offline build/typecheck pass. |
| `affected-regression` | 689 pass / 10 fail, exit1: additive IPC/VM/component registration failures retained. |
| `red-shared-physical-002` → `green-shared-physical-003` | Causal MODEL_BUSY failure → pass with real installed Pi synthetic transport and Completed Assistant. Earlier fixture-health failure `red-shared-physical` retained separately. |
| `red-project-navigation` → `checkpoint-regression-001` P1-A-DESKTOP-01 | Causal active Project-switch failure → pass; same Profile/Main/store consumer. |
| `red-professional-physical-001` → `green-professional-physical-002` | Causal premature helper lease release → pass. |
| `red-pi-physical-001` → `green-pi-physical-002` | Three causal failures → three pass: stored Pi delayed done/error and facade cleanup timeout. |
| `green-collateral-001` | 46 pass / 2 fail, exit1: test used wrong membership error envelope and old initial-entry labels. Corrected to the closed contract/approved default entry. |
| `checkpoint-regression-001` | 251 pass / 2 fail, exit1: all new task tests and repaired IPC/VM cases pass; two old child tests expected immediate lease release. This is retained intermediate evidence, not a whole-suite PASS. |
| `checkpoint-regression-002` | **101 pass, 0 fail, exit0**: final affected Pi/provider/helper contracts and child lifecycle/provider integration. Corrected child assertions retain all no-result/no-delivery/no-formal-effect checks. |
| `checkpoint-types-002` | **exit0**, strict installed TypeScript including affected tests/consumers. |
| `checkpoint-build-002` | **exit0**, actual offline Main/Preload/Renderer Vite builds and built membership IPC assertion. Existing CJS import.meta and deprecated option warnings retained. |

The 251 successful intermediate tests include delayed resolve/reject for legacy
Stop, close and timeout; Waiting/success; Main renderer-loss fences; legacy
eligibility/grants/source isolation; actual membership grant, reserve/issue/settle
faults, source drift, stop/late return, reopen and retained cumulative usage.
Final reruns target the subsequently changed Adapter and child-test paths. Counts
above are not summed as unique coverage. No repeated broad 699-test run was needed.
The final source snapshot binds these runs with their own source manifests.

Earlier Stage A RED/GREEN and diagnostic failures remain in the same root,
including preparation fixture correction, authority error-code correction,
settlement pre/post GREEN (not claimed causal RED), and the explicitly interrupted
busy-poll invocation. No failure is silently reclassified as success.

### Test-asset changes and limits

No tests were removed or skipped. Exact IPC inventories add only the membership
API/channel. VM imports map the actual handler and real compiled component; no
business stub replaces them. Default Quick labels now assert membership entry and
the retained Completed Assistant navigation. The separate legacy Assistant React
suite still verifies its original association/collaboration surface. The two child
Stop/timeout cases assert the occupied child identity before releasing their test
transport, then retain the original null-occupant assertion after settlement;
this is the specific decision002 semantic correction. Professional F2 tests gain
an occupancy assertion before settling their delayed runtime. All business,
source, eligibility, formal-write and sender negatives are retained.

Static rendering and regex wiring are limited evidence, not user interaction or
human UX acceptance. Full canonical/package/native/security validation remains for
the completed candidate; current evidence includes affected IPC/CSP/sandbox/sender
checks, not a new installed-artifact security or release claim. No prototype was
opened, served or executed. No Provider, real credentials/business data, install,
service, Git delivery, subagent or project-control write occurred.

### HANDOFF_BACK — fixed checkpoint

- Change/task: Change004, same Stage A worker context. Device/local owner: Mac mini,
  juaner_worker. Model/effort: gpt-6-astra/high as independently attested by Controller
  in intake; workspace-write/never retained. No model switch or fallback.
- Branch/base: `work/mac-mini/change-004-ai-led-analysis`,
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, tree
  `74e042fa0680a22ba29fd68e87f67f8ca6428301`. No commit made.
- Fixed implementation/input manifest: Stage A root
  `checkpoint-physical-001/candidate.json` and `source/` copies.
  Evidence index: `checkpoint-physical-001/evidence.json`; exact bytes/SHA-256 and
  worker readback receipt: `checkpoint-physical-001/receipt.json`.
- Evidence class: persistent raw evidence and canonical engineering source.
  Controller-owned intake/decisions and frozen product input are reference inputs,
  not worker edits. Project-control and unrelated WIP are excluded from ownership.
- Receiver: Mac mini Engineering Controller, same-device paths. Worker independently
  read back copied bytes/hashes; Controller readback remains pending. No cross-device
  backup or independent validation is claimed.
- Resource/permission blocker: none for this checkpoint. Model consumption before
  recovery UNKNOWN. Full actual command logs, including failures, remain available.
- Current unmet A acceptance: durable reusable scenario selection/version readback
  for repeated tasks (CAP-01/SC-06); ask only missing facts; readable CNY/rate/delta/
  time primary UI with expert technical details; actual component+IPC interaction
  evidence for prepare/consent/authorize/continue/stop/reopen; consistent persistent
  grant revocation on expiry/source change, including idle admission.
- Exact return point: [tasks](tasks.md), A continuation. Start configuration reuse
  with a repetition/version-drift RED using the actual normal consumer. Then finish
  the remaining A faults/UI interactions; B final review/comments follow.
- This checkpoint needs no new Spec Gate or user authorization. A/P1 completion,
  independent Validator, engineering acceptance, user UX/product acceptance and
  Git delivery remain separate and are not claimed.

## A continuation — configuration/fences and native startup blocker (2026-10-02)

The Controller accepted and independently hash-read `checkpoint-physical-001`
(184 source/4741 evidence files, no mismatch) as a bounded checkpoint. It remains
historical evidence, not A/P1 acceptance. Decision002 is Controller-owned and was
not edited. Current raw root is
`/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-ab-20261002T010119Z`.
Each command directory retains `command.json`, exact `inputs/`/`inputs.json`, full
`output.log` and `result.json`. Synthetic fixture values are test-only.

### Connected changes and traceability

| Acceptance / tests | Actual consumer and result | Evidence directories |
| --- | --- | --- |
| CAP-01, SC-06, UI-P1-02/03; P1-A-CONFIG-01/02 | Existing schema110 config + prepared receipt; Store/Application + closed Main config-reference operations; new task reads exact persisted version, real DuckDB/Python Run4 binds it; changed semantics/mapping/methods refuse, explicit new version preserves original | `red-config-001` exit1 (2 causal failures), `green-config-002` exit0; extended engine test in `affected-a-005`; mapping/method assertions in `config-regression-006` |
| UI-P1-01–06/08–10; UI-P1-A-READ-01 | Actual workspace renders saved-version selection, known fields reused, expert editing, CNY yuan/percent/percentage-point delta/readable time; raw details expanded explicitly | `red-ui-readability-001` exit1, `green-ui-readability-002` exit0, `affected-a-005` exit0. SSR/structural evidence only |
| SC-08/09, CAP-05; P1-A-GRANT-FENCE-01/02 | Idle expiry/source drift persists revoke/epoch before refusal; post-issued source change fences late question while retaining usage | `red-grant-fence-001` exit1 (3 causal failures), `green-grant-fence-002` exit0 |
| P1-A-GRANT-FENCE-03 | Real Store before/after fence-commit response fault; restored source cannot admit new Attempt; explicit stop completes readback | `red-grant-fault-003` exit1 (before-commit failure; after-commit already GREEN), `green-grant-fault-004` exit0 |
| P1-A-GRANT-FENCE-04 | Real Pi synthetic transport pending past expiry: durable revoke happens while physical lease remains occupied, late output cannot publish | `red-expiry-timer-002` exit1, `green-expiry-timer-003` exit0 |
| P1-A-GRANT-FENCE-05 | Changed authorization bytes at actual Application entry revoke old grant and prevent Continue; no usage/effect | `red-authorize-drift-001` exit1, `green-authorize-drift-002` exit0 (all 7 grant cases) |
| UI-P1-A-INTERACT | Test builds actual workspace, Preload and closed Main handler with owned synthetic Profile/Project, consent/authorize/continue/stop/reopen interactions | `native-a-001` and `native-a-diagnostic-002` exit1 **before product Main; zero interaction assertions executed** |

Production paths: `packages/application/member-task.ts`, `packages/product-core/member-task.ts`,
`packages/ports/member-task.ts`, `packages/contracts/member-task.ts`,
`adapters/storage-local/{member-task,desktop-state}.ts`,
`apps/desktop/{member-task-main,member-task-workspace}.tsx` (Main is `.ts`).
No new migration/ontology relation, approved resource values or real activation.
The updated [spec](spec.md) and [design](design.md) retain C1–C6 boundaries.

### Regression, repairs and limits

- `affected-a-004`: 132 tests, 131 passed/1 failed, exit1. The retained normal
  Desktop assertion required cumulative usage to remain visible. Restored that
  sidebar visibility; exact resource JSON remains expert-only. Assertion unchanged.
  Plan/chain/runtime/IPC suites in this run passed; they were not broadly rerun.
- `affected-a-005`: 34/34 current task integration + structural UI tests, exit0.
  Includes real repeated-task engines, source/outbound/authority negatives,
  shared physical slot, reservation faults, stop/reopen and the seven grant cases.
  Native component interactions are excluded from this count.
- `types-a-004`: exit2, missing synthetic transport parameter type in new native
  fixture. Added `text:string`; `types-a-005` passes. Final test-only assertion
  expansion passes `types-a-006` (exit0) and focused `config-regression-006`
  (2/2, exit0). These two repeated cases are not added to the 34-test count.
- `build-a-005`: exit0, actual offline Main/Preload/Renderer builds. Retained
  existing bundler import.meta/deprecation warnings. No server, package or install.
- `red-expiry-timer-001`: fixture health failure, **not causal RED**. Its 200ms
  synthetic grant expired before transport entry, so waiting for entry hung.
  Interrupted that owned test invocation (exit130), retained output/input/receipt.
  Corrected test-only grant to 2000ms and bounded the test; the subsequent causal
  RED proves the absent timer fence. No production resource defaults changed.
- No test/assertion was removed or weakened. Added regression for mapping/method
  immutability to the existing configuration case. Native fixtures/tests are
  registered in TypeScript and retained despite startup failure. No skipped native
  test or fake interaction PASS substitutes for the missing evidence.
- Daily deterministic, canonical, complete security/adapter/001–003 regression,
  current package/native evidence and final integrated candidate freeze remain
  outstanding. The earlier accepted checkpoint cannot identify a new package.

### Exact native blocker and in-boundary return

`native-a-diagnostic-002/output.log` records installed Electron pid82819 launched
with the built product-test Main and owned synthetic user-data directory. Before
product Main, it exited with `signal=SIGABRT`; Playwright cleanup reports
`Error: kill EPERM`. The first non-debug invocation failed the same startup.
No component/IPC/interaction assertion executed. `native-startup-probe-003`
successfully runs that binary in Node mode (Electron44.4.3/Node24.21.0), exit0,
with `task_name_for_pid: (os/kern) failure (5)` on stderr; product Main error file
is absent. This narrows failure to native startup, **not a proven exact cause**.
GUI permission/sandbox/signing cause remains UNKNOWN. Do not claim Node mode
proves a working native route.

The retained test is
`tests/e2e/xanthil-desktop/member-task-native.e2e.test.ts`, with actual product
component and IPC composition in `tests/fixtures/member-task/native-{main,renderer}.tsx`
(Main is `.ts`). Proposed next action: Mini diagnose/run this same fixed fixture
through the independently permitted native product route; the worker repairs any
resulting component/IPC failures in the existing package. No alternative browser,
server, security disablement, elevation, prototype execution or install is proposed.
Correction under Decision003: A-focused-interactions-before-B was Controller
packaging, not a human user requirement. Decision003 supersedes that dependency.
B had not started at this snapshot; unaffected offline B now continues while
native startup remains unresolved. No additional native retry/route or security
change is authorized, and A acceptance is not granted.

### HANDOFF_BACK — bounded blocker snapshot

- Device/owner/receiver: Mac mini, juaner_worker → Mac mini Engineering Controller;
  same-device artifact paths are available. No cross-device backup claimed.
- Runtime: gpt-6-astra/high per Controller's actual-runtime attestation, unchanged;
  workspace-write/never. Consumption before prior CLI recovery remains UNKNOWN.
- Branch/base unchanged: `work/mac-mini/change-004-ai-led-analysis`,
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`,
  tree `74e042fa0680a22ba29fd68e87f67f8ca6428301`; no Git mutation.
- `native-blocker-001/source/` and `source-delta.json` bind this continuation's
  owned changed/new source to the accepted prior checkpoint. `evidence.json`
  identifies full current raw evidence; `receipt.json` records independent worker
  byte/hash readback. Controller readback of this new return remains pending.
  This is a blocker snapshot, **not** the final integrated P1 candidate freeze.
- Remaining A: actual component/IPC prepare/consent/authorize/continue/stop/reopen
  verification and any repairs, then A scope review. Config/UI projection and
  persistent fence tests above passed; human UX remains the user's later work.
- Remaining B: all approved C5 comments/expression/period/NO_CHANGE and C6 explicit
  human review/three formal exits/attached-state atomicity and process-death proof;
  full integrated regression, package evidence and final candidate freeze.
- Real activation/configuration remains unapproved/unconfigured and closed.
  Real model quality, native UX and full P1 outcomes remain UNKNOWN. No Provider,
  credential/business-data access, host service, installation, publication, board,
  frozen product, Controller decision or intake edit occurred. No independent
  validation, Engineering Acceptance or user Product Acceptance is claimed.

## Decision003 continuation — offline B in progress

Controller independently read back the immutable `native-blocker-001` snapshot:
5682 reads, 171727624 bytes, no mismatches. It remains untouched. Decision003
supersedes the former Controller A-interaction-before-B packaging dependency;
the earlier attribution to a human user instruction was incorrect. No native
retry, alternate route or sandbox/security change has been made.

Current raw root:
`/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-b-20261002T014435Z`.
Every run retains full command/env/input copies/output/exit. Tests extend the same
real task integration; no old assertion is removed. Current completed loops:

| Test | Causal RED | GREEN and scope |
| --- | --- | --- |
| P1-B-COMMENT-01 | `red-comment-001` exit1 | `green-comment-002`: real Main/Application/SQLite exact report-bound local save, no calls/formal effects |
| P1-B-EXPRESSION-01 | `red-expression-001`, `red-comment-intent-003` exit1 | `green-comment-intent-004`: actual Pi closed classification, appended report, exact immutable originals/Run/evidence |
| Comment UI | `red-comment-ui-005` exit1 | `green-comment-ui-006`: actual component render + actual IPC backend tests, **not native interaction evidence** |
| P1-B-COMMENT-BOUNDARY-01 | `red-comment-boundary-007` exit1 | `green-comment-boundary-008`: consent cannot expose raw column names; original negatives retained |
| P1-B-COMMENT-STOP-01 | existing fence pre/post GREEN | `green-comment-boundary-008`: late expression cannot publish; physical lease remains held until settlement |
| P1-B-PERIOD-01 | `red-period-nochange-001` exit1 | `red-period-change-004` includes its GREEN; equal normalized values cause no mutation and retain actual classification spending |
| P1-B-PERIOD-02 | `red-period-change-004` exit1 | `green-period-change-005`: same Case/new revision/config, old grant closed, actual DuckDB/Python new result, original report unchanged |
| Period UI/history | `red-period-ui-006` exit1 (missing history projection) | `green-period-ui-007`: real historical projections and rendered period controls |
| P1-B-REPORT-FAIL-01 | `red-report-save-009` exit1 (extra model call) | `green-report-save-010`: persisted response reused for explicit report-save retry, no new Attempt/reservation/call |

`green-period-nochange-002` and `red-period-change-003` retain an intermediate
implementation error: numeric task row version passed to the legacy string-only
canonical hash. Corrected the private token input to its decimal string; the later
causal RED isolates the absent changed-period behavior. No business rule changed.
`green-report-save-010`: all seven B tests passed. `types-b-001/002/003` passed;
affected A/runtime regressions and later final checks are recorded in subsequent
run directories. C6, additional B negatives, complete offline regression and final
integrated candidate freeze are still in progress. A/P1 acceptance remains unclaimed.

## C6 connected offline checkpoint — 2026-10-02

This section supersedes the historical “C6 in progress” status above. The normal
membership A→comments/periods→human review path is implemented and tested offline.
It is **not complete integrated P1**: the retained post-completion main/child
material/ledger consumer is missing. Controller Decision004, received during this
bounded return, closes its contract and authorizes the next implementation.
Native startup remains unresolved under Decision003; no further native attempt
was made. No Engineering Acceptance, independent validation or user acceptance.

### Acceptance → spec → actual consumer → evidence

All run directories below are under `worker/stage-b-20261002T014435Z` at the
existing Change artifact root. Each has exact `command.json`, source input copies
and hashes, complete `output.log` and `result.json`; exit codes are the child
command's recorded codes, not the wrapper's exit. No real Provider was invoked.

| Acceptance / tests | Actual consumer | RED → GREEN / current result |
| --- | --- | --- |
| SC-11/12, UI-P1-11/12; P1-B-REVIEW-01 | Main closed IPC → Application review → SQLite immutable versions | `red-review-001` → `green-review-002`; `red-review-work-only-003` → `green-review-work-only-004` |
| SC-12 three outcomes; P1-B-FORMAL-01/02 | real Finding acceptance/form/Closure/Completed/final report; attached sidecar Decision/Expected | `red-formal-analysis-005` → `green-formal-analysis-007`; `red-formal-choice-008` → `green-formal-choice-010` |
| C6 all-or-none; P1-B-ATOMIC-01 | before/after each DB effect and COMMIT, immutable files prepared before transaction | `atomic-faults-011` pass; rollback/readback/retry produces one exact receipt |
| C6 process death; P1-B-ATOMIC-02 | real child SIGKILL, DELETE/FULL attached SQLite, actual hot-journal recovery | `atomic-crash-012` failed insufficient hot-journal exposure; `green-atomic-readback-014` passes without weakening assertions |
| C6 unknown outcome; P1-B-ATOMIC-03/04 | Application locks submission until readback; Store refuses missing committed sidecar | `red-atomic-readback-013` → `green-atomic-readback-014` (3/3) |
| C6 optimistic heads and idempotency | real competing child processes, same intent/conflicting input, invalid fields/stale review | `formal-concurrency-negative-023` 2/2 |
| SC-12 supported comparison/Expected | exact evidence refs, complete candidates, one reasoned preference, separate guardrails/dependencies | `legacy-comparison-031` 2/2 including actual 101→102 preservation |
| Closed review and provenance | Core validation → Application/Store → sidecar readback | `red-review-shape-021` → `green-review-shape-022`; `red-sidecar-026` → `green-sidecar-027` |
| Exact time/history | preserve original review time; normalize validated formal time | `red-formal-time-024` → `green-formal-time-025` |
| SC-03 human edits; SC-12 grant closure | expression carries unchanged-source human edits; formal commit revokes grant without clearing usage | `red-human-preservation-029` → `green-human-preservation-030` 2/2 |
| UI-P1-07/11/12/13 | real TSX review/comment/period components, closed Main IPC, actual SQLite effects | `red-review-ui-015` → `green-review-ui-016`; `review-interaction-017` pass |
| UI-P1-A prepare/consent/authorize/continue/stop/reopen | real TSX handlers via controlled-hook probe and actual Main handler, same task/config/ledger | `a-component-interaction-019` pass; portable event evidence only |
| 001–003 preservation / C6 old-reader refusal | actual 101 rows/files preserved; frozen earlier Store code refuses 102 without mutation | `legacy-comparison-031`, `old-reader-036` pass |
| Completed source C3/C4 | actual C6 M1+M2 result → old Assistant → real Pi Adapter with synthetic transport | **`red-legacy-boundary-039` remains RED**; Decision004 consumer still due |

Spec is `spec.md` C5/C6 and expression/grant clauses. Production is
`packages/product-core/member-review.ts`, `packages/application/member-task.ts`,
`adapters/storage-local/{member-task,desktop-state,case-assistant}.ts`,
`apps/desktop/{member-task-main,member-task-workspace}.tsx` (Main is `.ts`), plus
closed contracts and Pi comment protocol. Tests extend
`tests/integration/xanthil-desktop/member-task.integration.test.ts`; crash fixture
is `tests/fixtures/xanthil-desktop/member-formal-crash.ts`. They inspect actual
rows/files/effects, not self-reported methods. Main/Preload/Renderer remain the
existing product shell; no prototype route was opened.

### Failures, repairs and test preservation

- `green-formal-analysis-006` retained an implementation hash-input error
  (review_version numeric in legacy string-only canonical JSON); fixed private
  provenance serialization. `green-formal-choice-009` retained a missing fixture
  DatabaseSync import. Neither is labeled causal RED.
- `atomic-crash-012` already proved all-or-none but exposed only one hot journal.
  The >=2 hot-journal assertion remains. The synthetic crash hook sets local
  SQLite cache_size=1 to force page spill under the same DELETE/FULL contract;
  `green-atomic-readback-014` proves actual recovery. No production journal or
  durability weakening, simulated crash or orphan adoption.
- `a-component-interaction-018` addressed a nonexistent fixture button; corrected
  only the probe selector. `red-formal-source-020` expected the wrong refusal
  code; source drift already correctly refused SOURCE_CHANGED. Corrected that
  assertion; no causal implementation claim is made for it.
- `types-b-006` caught legacy union narrowing and a fixture import;
  `types-b-008` caught a fixture callback request type. Fixed without casts that
  suppress the product contract; `types-b-007`, `types-integrated-035` and
  `types-boundary-041` pass.
- `daily-integrated-028`: 866 tests, 863 pass, 3 fail. Diagnostic run overlapped
  source/test edits; it is not fixed-candidate evidence. Failures exposed two
  human-preservation/grant issues plus a stale VM module registration. All are
  retained, including their subsequent causal focused RED/GREEN.
- `dock-fixture-032` repaired VM registration but exposed a real settings-probe
  close bug. `red-profile-probe-033` proves it; `green-profile-probe-034` passes
  31 affected tests. Profile now observes Application business model work rather
  than the general shared slot (which also holds a settings probe). It does not
  release the slot or alter business grant, eligibility or formal effects.
- `daily-fixed-037`: 869 tests, 867 pass, 2 fail; both exact Application method
  inventories omitted the new private `hasModelWork`. Updated both exact arrays;
  `application-inventory-040` passes 3/3. All former method/close/isolation
  assertions remain. This is not a daily PASS.
- `canonical-boundary-043` failed two exact TypeScript tuple assertions. Added
  the explicit seven-file Change004 appendix while preserving every accepted old
  tuple, compiler/package identity and omission/order/extra-field negatives.
  `configuration-inventory-044` retained the final stale current-tuple label;
  `configuration-inventory-045` passes all six affected checks. No package,
  dependency or compiler setting changed in this repair.
- `red-legacy-boundary-038` was a missing synthetic clock fixture; 039 is the
  healthy causal failure. Its original exact negative assertion remains intact.
  It records eligible=true, blockers=[], one synthetic Pi call carrying M2 group
  aggregates, old membership grant revoked and membership calls unchanged at 2.
  The full payload is local synthetic evidence in
  `red-legacy-boundary-039/member-task-KsUgcW/legacy-boundary-receipt.json`.
- No tests were removed, silently skipped or retired. New authority is represented
  by a closed membership-review provenance union, not fake legacy Draft/Attempt.
  Old-source draft_id assertions explicitly narrow the legacy branch and remain.

### Build, runtime and remaining limits

`types-boundary-041` passed. `build-boundary-042` passed real offline
Main/Preload/Renderer builds, with existing import.meta/inlineDynamicImports
warnings retained. This is neither an Electron launch nor a distributable package
or installation result. No current package identity or native/UI pass is claimed.
Canonical portable outcome is recorded below after that invocation finishes.

Current material gap is [the retained-source counterexample](contract-impact-p1-completed-source.md).
Decision004 chooses the same original task ledger and separate explicit main/child
grants with a closed origin/material policy. That approved consumer implementation
is not in this checkpoint. No new Controller decision or user approval is needed
for it. Keep real activation closed; do not hide this failure by removing completed
eligibility. Native route/root cause and real-model quality remain UNKNOWN.

### HANDOFF_BACK — completed-source-boundary-001

- Change/package: Change004, bounded offline B checkpoint preceding Decision004
  consumer repair. Not the complete integrated candidate or a final Validator input.
- Device/local owner: `bendandebabadeMac-mini.local`, Darwin arm64,
  `bendandebaba`; worker → Mac mini Engineering Controller on the same device.
- Model/effort: gpt-6-astra/high per Controller runtime attestation; not independently
  introspected in this worker turn. Current permissions workspace-write/never.
  Pre-recovery model request consumption remains UNKNOWN, not reset.
- Branch/base unchanged: `work/mac-mini/change-004-ai-led-analysis`,
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`,
  tree `74e042fa0680a22ba29fd68e87f67f8ca6428301`. No Git write/delivery.
- Toolchain is the existing `dependency-preflight-001/toolchain-001/bin` under
  the retained Mac mini desktop preflight artifact root. Each command.json records
  its full path/environment. Node26/npm11.12.1/DuckDB1.5.2/Python3.14.4/TS5.9.3;
  no install, credentials, Provider or business-data access.
- Freeze locator: current stage's `completed-source-boundary-001/`. `candidate.json`
  binds copied source; `evidence.json` indexes full current raw files; dependency
  manifest binds Controller/approved input copies separately. `receipt.json` gives
  byte/hash reread counts and identities. Receiver readback is pending until Mini
  performs it; worker byte/hash reread is not independent product validation.
- Prior `native-blocker-001` and `checkpoint-physical-001` remain immutable and
  linked by their existing identities; this same-device evidence is not Git
  preservation or cross-device backup. No missing raw evidence is known.
- NEXT_ACTION is in tasks.md: after this bounded return implement Decision004,
  close its causal RED with configured main/child positive and refusal cases, run
  affected/current verification and freeze the complete integrated result. Native
  remains outstanding under Decision003; human experience belongs to the user.
- No board, intake, Controller decision, frozen input or accepted/archive spec
  was edited. Ordinary private repairs converged. No resource/permission waiver,
  Engineering Acceptance, independent Validator or user Product Acceptance claim.

### Final bounded regression outcome

`canonical-boundary-046`: `tools/harness/validation/run --portable`, exit1,
2026-10-02T03:03:15Z–03:05:50Z. Across its reported suites: **2359 tests,
2357 passed, 1 failed, 1 pre-existing real-Pi gated skip**. The only failure is
`P1-B-LEGACY-BOUNDARY-01` (one synthetic request, expected zero); the same causal
counterexample survives the full portable run. All 400 Desktop contract tests
passed; Desktop integration is 399/400. Syntax, current typecheck, local-analysis,
Model Pack contracts, board read/test fixtures, run-evidence, Desktop unit and
legacy integration checks passed in this invocation. The real-Pi gate remained
unset as required; its existing skip is not a new test retirement.

Portable explicitly excludes Electron binary execution, packaged Main, packaged
GUI and native/manual acceptance. It did not execute the blocked prototype. No
additional unchanged broad rerun is useful before the approved Decision004 code
repair. Daily-fixed-037 remains a recorded failure whose two inventory defects
were fixed and covered by 040 and this canonical run; it is not relabeled PASS.
Build-boundary-042 identifies the current executable-source build (the later
changes only repair test inventories and engineering records). Final daily and
complete package/native evidence remain due on the integrated fixed candidate.

## Integrated offline candidate — Decision004, 2026-10-02

This section supersedes earlier **current/next** wording; historical checkpoints,
failures and their identities remain unchanged. The offline A+B source package is
connected, including retained Completed main/Fork/Subagent consumers. Native startup,
independent engineering review and human product/UX acceptance remain outstanding.

Current stage: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-d004-20261002T0325Z`.
Every invocation retains `command.json`, full `output.log`, `result.json` (child
exit, not wrapper exit) and source/test `inputs.json` plus copies. Synthetic Projects,
actual SQLite files, independent engine assets and fault inputs remain under each
run. Installed pinned tools and command-local environment are recorded exactly.

### Result and material deltas

- Decision004: actual Run4-derived Completed provenance, explicit closed retained
  authorization and exact authorization hash; main and each manual child reserve
  and charge the **original membership ledger**. Same110/102 relations, no new
  runtime/migration/default/allowance. Profile composes actual consumers.
- Initial prompt, selected report/history, every tool response, returned result,
  MODEL adoption and parent reuse enforce the closed P1 totals projection. Local
  raw groups, IDs, headers, paths and human report fields remain local. Both Fork
  and Subagent positive paths use actual synthetic Pi protocol, real stores and
  the shared physical slot. Unconfigured real activation remains closed.
- Source/config/expiry/stop/close/reopen fence admission and late publication.
  Unknown issued usage remains reserved; logical terminal state does not release
  an unsettled physical turn. Completion and prior formal records never reopen.
- First explicit retained P1 source write activates existing102 even after
  analysis-only completion. Failure rolls back; old101 rows stay exact; the actual
  frozen base reader refuses102. No fake Completed source or legacy Draft authority.
- Expression comments now replace the primary visible expression, with exact
  original factual sections in expandable evidence/history. Repeated shortening
  replaces earlier expression; old versions, numbers, source/Run and human edits
  remain. Synthetic replies demonstrate this mechanism, not model quality.
- Actual component events open the same professional Case and call real Main IPC
  for prepare/consent/start/continue/stop/reopen and human review. Retained main
  confirmation shows original cumulative/remaining resources before unchecked
  consent. P1 formal history is read-only in both views; report detail includes
  separate dependencies and guardrail applicability/reasons. Non-P1 revisions
  and manual003 remain covered.

### Current execution evidence

| Runs under current stage | Actual outcome | Meaning |
| --- | --- | --- |
| red-entry-001 → green-entry-002 | exit1 → exit0 | Original unauthorized retained P1 issue denied; original leak RED in prior039 preserved |
| red-main-child-003 → green-main-child-004 | exit1 → exit0 | Explicit finite P1 profile enables real retained main/child consumers |
| red-fences-007 → green-fences-008 | exit1 → exit0, 4 pass | Persistent close revocation plus stop/unknown usage/physical slot/material boundaries |
| red-expression-009 → green-expression-010 | exit1 → exit0, 3 pass | Genuine primary expression replacement and preserved human edits |
| red-completed-012 → green-completed-013 | exit1 → exit0, 2 pass | Ordinary authorize cannot reopen Completed; stale source refuses |
| red-ledger-ui-014 → green-ledger-ui-015 | exit1 → exit0 | Readable retained resource projection |
| connected-017 | exit0, 196 pass | Member/legacy Assistant/collaboration/runtime/component affected checks; pre-final input snapshot |
| profile-boundary-018 | exit0, 8 pass | Real Profile/Main/C6/retained consumer; actual Adapter refusals before transport |
| red-sidecar-origin-019 → green-sidecar-origin-020 | exit1 → exit0, 2 pass | Explicit retained source link activates102; Waiting reservation |
| final-faults-022 | exit0, 3 pass | Reopened Application usage, actual late source-byte drift, changed finite config |
| consumer-023 → consumer-025 | exit1 → exit0, 2 pass | Same-Case professional event; MODEL adoption and real parent issue |
| red-history-ui-026 → green-history-ui-027 | exit1 → exit0, 10 pass | P1 immutable formal history, unchanged legacy revision/readback |
| daily-028 | **exit0, 2390 pass, 0 fail, 1 existing gated skip** | `tools/desktop/test-daily.mjs --all`, including canonical `--portable`, contracts/integration/security/resource/Adapter replacement/001–003 and development tests |
| activation-029 | exit0, 1 pass | Actual frozen reader, migration interruption, old-row preservation and reopened102 |
| red-main-disclosure-031 → green-final-ui-032 | exit1 → exit0, 8 pass | Real confirmation dialog + actual IPC prepare/consent/start; A/B component regression and activation test |
| red-history-fields-038 → green-history-fields-039 | exit1 → exit0, 10 pass | Actual shared report detail retains dependencies and guardrail reason; legacy rendering remains |
| both-children-041 | exit0, 2 pass | Main + Fork and Main + Subagent, distinct grants, return/adopt/reuse, unchanged formal effects |
| types-complete-043 | exit0 | Strict current TypeScript, including final test extensions |
| build-final-033 | exit0 | Actual offline Main/Preload/renderer build before last detail-only correction |
| package-fixed-042 | **exit0** | Fresh current-source Main/Preload/renderer build and engineering package; local asar byte identity, CSP, toolchain resources and ad-hoc signature verification |

Daily ran 04:12:39–04:16:09 UTC. Its input snapshot binds that invocation, not later
UI assertions. Subsequent changes are the main authorization/detail presentation
and scoped test extensions; their affected component/IPC/legacy/type checks and
fresh package build above bind the final source. No unchanged broad suite was
repeated. Daily's existing real-Pi gate stayed unset; no new skip was introduced.
Its bounded existing loopback Vite security fixture started and closed within the
test; no blocked prototype, persistent service or alternate native route was used.

Current package identity:
`package-fixed-042/engineering-package/package-identity.json` and its new `.app`
under the same directory. `package-035` is retained prior evidence and is not the
final package identity. Packaging repacked installed Electron locally, created an
artifact-owned ad-hoc seal with no Keychain identity/entitlements/security policy
change, and verified resources. It did not launch Electron, install, release or
verify native behavior. Existing import.meta/inlineDynamicImports build warnings
are preserved. Full canonical/native/package-GUI validation was not run because
it depends on the unresolved Decision003 route; portable PASS does not replace it.

### Failures and test preservation

All earlier failures remain. In current007, timestamp construction used two clock
reads, one fixture confused configuration availability with physical occupancy,
and a poison fixture attempted an event after terminal state; those were repaired
without reducing assertions. The close-grant failure itself was causal. Current011
passed expiry but source-tamper cleanup hit strict readback; it now restores exact
synthetic source before inspecting retained usage. Current021 was a TS7023 fixture
return annotation error, fixed and checked by024 and final043. Current023 exposed
null task handling on a second closed projection;025 proves the actual consumer
repair. Current037 passed because professional report sections already contained
the fields; it is **not** causal RED. Narrowing to the actual report detail component
produced038;039 proves its repair.

No test was deleted, retired or newly skipped. Earlier VM/module inventories,
physical-stop semantic corrections and current configuration tuple edits remain
as recorded above. One expression assertion changed from `startsWith(original)`
to retaining the exact original factual content: the approved visible behavior
requires the new expression first, not an appended generic paragraph. All old
version/Run/evidence/human-edit checks remain, with a second revision test. The
frozen old reader fixture is exact base `c413bee3` source, 44804 bytes, SHA-256
`93e19f9c212520de5738eb0c1f68d7efdc5ae8ea4a4c85323fbd1c246c5d6b04`;
the test verifies that identity before changing import locators for execution.
The component probe controls React hooks and uses a synthetic settings context;
actual business component handlers and Main/Application/SQLite run. It supplies
no DOM, native focus/viewport or human experience proof.

### Acceptance → spec/test/code/result readback

All entries refer to this Change's [spec](spec.md) and [design](design.md), without
editing frozen acceptance or claiming it passed independent/user evaluation.

| Approved obligation | Concrete consumers | Test/evidence |
| --- | --- | --- |
| SC-01/06; CAP-01/04; UI01–05/08 | member-task Application/Store, saved config, Main/Preload/Workspace, same professional Case | P1-A-ENTRY/PREPARE/DESKTOP/CONFIG, UI-P1-A-INTERACTION-02; daily028, final032 |
| SC-02/05/07; CAP-02/03; UI06 | plan admission, DuckDB and independent Python, Run4/Finding/report chains | P1-PLAN-01..05, P1-CHAIN-01/02, M2; original causal engine RED and daily028 |
| SC-03; CAP-06/08; UI07/13 | version-bound comment, actual Pi classification, expressionReport, report renderer, human review refresh | P1-B-COMMENT/EXPRESSION/HUMAN/REPORT-FAIL;009→010, daily028 |
| SC-04; CAP-01/03/08; UI11 | scope preview, equal-value refusal of effects, new revision/plan/Run via both engines | P1-B-PERIOD-01/02; daily028; prior classification spending retained |
| SC-08/09; CAP-05/09; UI09/10 | grant epoch, original usage/reservations, shared lease, Adapter physical settlement | P1-A-GRANT-FENCE/STOP/WAIT/RESUME/REOPEN/SHARED, P1-C4, D00402/04/05/08–11; daily028/022 |
| SC-10; CAP-04/05 | closed Main/Adapter/Core tool protocols, same-source outbound, local protected text | contract negatives, P1-A-BOUNDARY/M2, B-COMMENT-BOUNDARY, D00403/07;018/daily028 |
| SC-11; CAP-07; UI12 | explicit human review, legal comparison/insufficiency, separate Expected guardrails, three formal outcomes | P1-B-FORMAL/REVIEW/CLOSURE/NEGATIVE, UI-P1-B-INTERACTION; daily028,032,038→039 |
| SC-12; CAP-07/08 | same-filesystem attached DELETE/FULL transaction, unique intent receipt, readback lock | P1-B-ATOMIC-01..05, FORMAL-BOUNDARY, SIDECAR; daily028 includes real process death/hot-journal recovery |
| CAP-08/09; UI13; Decision004 | true Completed eligibility, distinct main/Fork/Subagent grants, original ledger, selected MODEL reuse, immutable formal history, explicit102 | original leak039→002; D00401..12 and UI-D004;041/032/039, unchanged001–003 in daily028 |

### HANDOFF_BACK — complete offline fixed candidate

- Freeze: `integrated-offline-001/` in the current stage. `candidate.json` binds all
  source copies, tracked/untracked owned changes and engineering records;
  `dependencies.json` attributes frozen product/Controller inputs separately.
  `write-set.json` distinguishes worker files, Controller coverage/board/intake/
  decisions, and frozen product material. `receipt.json` binds manifests, branch,
  bytes/hashes and worker byte reread. This reread is not author-independent validation.
- Evidence: raw evidence remains in the existing single Change root. Current
  `evidence.json` indexes all current-stage raw outputs/artifacts (including failed
  runs and earlier package). Prior immutable checkpoints and Controller receipts
  are linked by exact byte/hash identity, not rewritten. No known raw loss.
- Device/owner/receiver: `bendandebabadeMac-mini.local`, Darwin arm64,
  `bendandebaba`; worker → same-device Mac mini Engineering Controller. Accessible
  local paths; new Controller receiver readback pending. Cross-device backup UNKNOWN.
- Identity: branch `work/mac-mini/change-004-ai-led-analysis`, HEAD
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, tree
  `74e042fa0680a22ba29fd68e87f67f8ca6428301`, unchanged. No Git write/delivery.
- Settings: configured juaner_worker, **gpt-6-astra/high**, Controller-attested
  turn_context per intake; worker did not independently introspect model/effort.
  Workspace-write/never, cwd `/Users/bendandebaba/JuanerAI`. Pre-recovery model
  consumption remains UNKNOWN; no reset, model switch, fallback or agent launch.
- Coverage: Controller's four files in `controller/coverage-update-001/receipt.json`
  are preserved and attributed, including the 40-ID register and Change snapshot.
  This is implementation/test evidence for the approved increment, not a delivered
  capability/Engineering Acceptance update; the worker does not write that map.
- Complete remaining limits: Decision003 native startup root cause/route UNKNOWN;
  actual native close/reopen/focus/viewport and packaged GUI execution outstanding;
  full native canonical gate outstanding; actual model quality/cost and F1/F2/F4
  production configuration unapproved/UNKNOWN; UX01–07 and business value UNKNOWN;
  independent Validator, Controller Engineering Acceptance and later user Product
  Acceptance outstanding. No install/release/archive, real Provider, credentials
  or business-data exercise occurred. Synthetic values are test-only.
- No new in-boundary contract decision or user permission is requested. Private
  repairs converged; no unresolved offline causal failure is being relabeled PASS.
  NEXT_ACTION: Controller reads this fixed candidate and dispatches fresh read-only
  Validator; retain the precise native gap for integrated final verification.

## Current correction handoff — Validator F1–F4 (2026-10-02)

Status: **author correction package complete, independent re-review pending**.
This supersedes the prior engineering checkpoint only as the current candidate;
`integrated-offline-001` and its historical receipts remain immutable. No
Engineering Acceptance or user Product/UI Acceptance is claimed.

Evidence stage (Mac mini, local owner bendandebaba):
`/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes-20261002T050756Z`.
New fixed candidate: `corrected-offline-001/receipt.json` in that stage. Its
candidate/dependency/evidence/prior/run/write-set manifests bind all owned tracked
and untracked source, current Controller dependencies, raw commands, environment,
input copies, stdout/stderr, exits, failures and prior immutable checkpoints.
Freeze follows settled writers; manifest outputs are outside the indexed inputs.
Byte/hash reread is author evidence, not independent validation.

### Acceptance → spec/test/code/result

| Blocker / accepted reference | Current consumer and result | Causal evidence / final coverage |
| --- | --- | --- |
| F1 / CAP05, SC10, Decision004 | `product-core/member-task.outbound` rejects general absolute/home/dot-relative/relative-file/encoded paths, drive/UNC/file URI forms. Existing Pi admission uses the same rule. `application/member-task.execute` checks returned question/report/comment text before publication. Original selected-file IDs/columns/groups/credentials refusals remain. | `f1-red-001` 14 behavior failures → `f1-green-002`; `f1-relative-red-019` 2 → `f1-relative-green-020` 47 pass; `f1-return-red-013` 2 published-output failures → `f1-return-green-015` 2 pass. Actual new-task question, Waiting supplement, comments, retained main/Fork/Subagent, selected history/report, returned/adopted old material and reuse tested in `member-task.integration.test.ts`, daily final. |
| F2 / UI Contract §3.2, CAP06/07 | `MembershipHumanReview` defaults to readable exact current report/Finding/Run/config summary even before draft creation. Known baseline/evidence/metric/dependencies/guardrails are pending local suggestions. Unknown Owner/target/causes/effect stay unknown; explicit inapplicability stays distinct. Normal missing fields precede expandable full editing. Human edits are preserved and suggestions rejectable. No new persistence authority. | `f2-red-007` missing summary and `f2-default-red-023` missing pre-draft summary → `focused-final-028`; source-plan mismatch refuses suggestion, default values and rejection/human edit tests, existing three-exit and legal Closure tests preserved. |
| F3 / UI12/13 | `formalReviewStatus` is shared by side panel and review. It matches persisted review/intent/report/acceptance/Closure receipts. Initial, three exits, unreadable/unknown response, mismatched head and earlier report/revision/history remain distinct. Unknown submission is fenced until real readback. | `f3-red-005` 3 contradictory statuses → `f3-green-006`; actual Main response-loss/readback and exact mismatch tests in `f3-readback-018`, daily final. |
| F4 / SC12, UI07/12 | Workspace actions return confirmed projection or null. Comment fields/author/scope/report/version/consent clear only after exact persistence and no later edit. Review dirty source is pinned; failed/lost saves and polling retain edits. Explicit same-source readback continuation preserves text; no silent optimistic rebase. | `f4-red-003` 3 draft-loss failures → `f4-green-004`; `f4-review-red-014` actual response-loss remount → `f4-review-green-016`; `f4-resume-red-026` → `focused-final-028`. Real Main/SQLite confirmed, rejected, failed and response-loss component handler tests; `f4-confirm-025`; daily final. |

P1 final reports appear through both Completed source and formal history. New
selected-report positive tests exposed duplicate identical IDs (`f1-reuse-021/022`).
The existing main/child selector deduplicates identical IDs only for P1 sources;
unknown IDs still fail. Actual selected report material is rebuilt from the closed
verified overall metrics, never whole report text. Both child kinds pass in
`focused-final-028`, including readable old result envelopes rehashed to distinguish
material refusal from corrupted-file refusal. Non-P1 behavior is unchanged.

### Final commands and outcomes

All commands use the existing pinned command-local toolchain via `run.py`; complete
argv, PATH, timestamps, input hashes/copies and exit are in each command directory.
The runner's own shell exit is not the test exit; `result.json.exit_code` is used.

| Directory | Actual command after pinned `node` | Outcome |
| --- | --- | --- |
| `focused-final-028` | `--test --test-name-pattern='F1 retained.*initial\|F4 real IPC review\|F2\|F3\|UI-P1-B-INTERACTION' tests/integration/xanthil-desktop/member-task.integration.test.ts` | exit0, 11 pass |
| `types-final-030` | `node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` | exit0 |
| `daily-final-029` | `tools/desktop/test-daily.mjs --all` | exit0; 2446 pass, 0 fail, 1 real-Pi gate skip across summaries. Includes canonical `tools/harness/validation/run --portable`, affected contracts/integration/security/IPC/egress/resources, actual independent engines, Adapter/physical lease and legacy001–003, formal crash/reopen/unknown persistence, deterministic UI handlers, offline development build checks. |
| `package-final-031` | this stage's `package-offline.mjs` | exit0; current installed Electron repack, fresh Main/Preload/Renderer, exact asar Main/Preload bytes, CSP, toolchain descriptor and artifact-owned ad-hoc signature checks. No launch/install/release. |

Package identity: `package-final-031/engineering-package/package-identity.json`,
SHA-256 `c503dfd97f93071c0f29ca4d0b0fefdf85d78facbcf888bc48d4d2d9fdb0ccef`.
Current `Contents/Resources/app.asar`: 122559459 bytes,
SHA-256 `8a40d4da9a28d04b4e605ee40683cc0adb0a41ff473f5727ec47019347a5a7ff`.
The full `.app` remains under that directory's `out/Xanthil-darwin-arm64/`.
This is a new package identity; old package identities are historical only.

### Failures, assertion preservation and limits

No old test or acceptance assertion was retired. Three D004 negative tests are
parameterized with their original `member_id` case plus both reproduced path roots.
Additional tests extend coverage; no production default/resource limit/schema was
introduced. The portable component probe executes actual TSX handlers with controlled
hooks and real Main IPC/SQLite where stated; it is not DOM/native/UX evidence.

All failures retained: causal runs listed above; `f2-green-008` / `types-009` JSX
syntax error (not causal RED); `f2-green-010` found pending guardrail suggestion
conflicting with explicit inapplicability, corrected without weakening assertion;
`followup-024` used the wrong fixture SQL column (`hash` instead of `sha256`), corrected
before claiming material results. A newly written child-preview expectation was
corrected: local preview has no model admission; the actual child authorization and
transport remain tested/refusing. It was not an old acceptance assertion. `runs.json`
contains every run including failed and superseded ones. Build deprecation and
CJS import.meta warnings are preserved; no new native conclusion is inferred.

### Identity, receiver, remaining gaps and exact return point

- Same branch `work/mac-mini/change-004-ai-led-analysis`, HEAD
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, tree
  `74e042fa0680a22ba29fd68e87f67f8ca6428301`. No Git mutation/delivery.
- Loaded responsibilities: juaner_worker continuous engineering. Supplied permissions:
  workspace-write / never; cwd `/Users/bendandebaba/JuanerAI`. Controller attests
  gpt-6-astra/high; independent model/effort runtime fields are unavailable here
  (UNKNOWN), no role/model/effort switch. Pre-recovery model consumption remains UNKNOWN.
- Receiver: Mac mini Engineering Controller, same-device paths above, historical
  device identifier `bendandebabadeMac-mini.local`; receiver's fresh readback pending.
  Same-device persistence is not a cross-device backup; backup status UNKNOWN.
- **E1 remains:** independent Validator persistence tests failed at read-only
  `mkdtemp` before assertions. This author's permitted synthetic persistence tests
  do not substitute for that independent evidence. Original report SHA
  `9e2f1af040f44cb0b3d8b50d6fc362ffb009836faa23d8d97aaa530895167e44` and raw
  `controller/validator-review-001/stdout.jsonl` remain available and bound.
- **E2 remains:** Decision003 native startup/root cause unresolved; no retry,
  alternate route, prototype execution or security change. Native UI, packaged GUI
  and full native canonical conclusions remain outstanding. Human experience is
  still the user's later evaluation.
- Real activation remains unconfigured/unapproved and closed; no Provider,
  credentials or business data accessed. Synthetic transport proves boundaries,
  not real model quality or cost (UNKNOWN).
- NEXT_ACTION: Controller reads `corrected-offline-001/receipt.json` and dispatches
  the fresh read-only author-independent Validator. Controller/frozen product/
  capability-coverage files were not edited and are attributed as dependencies.
  No acceptance, install/release/archive or further user Gate is claimed.


## Current second correction handoff — Validator002 F1/F4

Author correction complete; fresh independent re-review and acceptance remain pending.
Scope is limited to the two blockers in the full report
`controller/validator-review-002/last-message.txt`, verified SHA-256
`49f96b9e389e52337d39d1309922738e7173073274af1a3c6feed538cf917970`.
F2/F3 and the other F4 repairs are preserved. Earlier sections and freezes remain history.

Stage: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes2-20261002T071014Z`. New complete source/evidence freeze:
`corrected-offline-002/receipt.json` within that stage, with candidate, dependencies,
evidence, prior references, command outcomes and write-set manifests. Source/dependency
bytes and evidence receive a separate author hash/byte reread after all writers settle.
This is not author-independent validation. Current Controller coverage files are frozen
as dependencies, without requiring their historic coverage-update hash.

### Acceptance/spec → tests → code/result

- **F1, CAP05/SC10/Decision004:** `containsPath` in Product Core now recognizes a
  relative-file extension at a lexical boundary, including sentence/fullwidth punctuation,
  quoting, URI suffixes, Unicode names and extension suffix characters. Well-formed
  percent runs are inspected independently, so ordinary literal percentages cannot
  disable decoding. Numeric slash spacing is inspection-only; standalone division
  separators, dates and safe business text reach actual Pi byte-for-byte unchanged.
  Existing selected/returned/history/adopted consumers reuse the rule. No filesystem
  discovery, transport, Provider, credentials or resource expansion was introduced.
  Actual Adapter refuses before SDK/transport admission; synthetic negative transport
  counts remain zero. All other closed-material negatives remain.
- **F4, SC11/12/UI3.2:** `MembershipHumanReview` binds confirmation to exact task,
  owner, head/intent/source/fields, current report content, Finding, Run and preparation.
  Relevant change invalidates it immediately without an effect-delay dependency or
  revival when an old projection returns. Submit itself checks current admission and
  confirmation; stale handlers and local edits before rerender cannot bypass it.
  Unsaved edits and explicit same-source continuation remain. Choice/analysis need
  fresh acceptance; the question-only exit retains its distinct non-acceptance effect.
- Real TSX → Main → Application/SQLite tests execute report1 confirmation → actual
  synthetic Pi expression/report2 → open/read newer head → refused inherited approval
  → fresh confirmation → all three outcomes. Additional tests vary ID/version/hash/
  intent/fields/source/report bytes/Finding/configuration/owner, invoke old callbacks,
  and hold a real saved response while later human edits arrive. Local dirty fields
  persist and no old confirmation reappears.

### Raw RED/GREEN and final commands

Every run contains command/env/input copies and hashes/output/exit. Wrapper shell exit
is separate; results below use `result.json.exit_code`. All failed runs are retained.

| Run | Actual result | Meaning |
| --- | --- | --- |
| f1-red-001 → f1-green-002 | exit1, 26 failures → exit0, 77 pass | Actual new/retained Pi punctuation leaks and spaced ratio refusal, then lexical boundary/ratio correction |
| f1-encoding-red-006 → f1-green-007 | exit1, 6 failures → exit0, 85 pass | Literal percentage alongside encoding and file-extension suffixes; original negatives and exact safe payload positives preserved |
| f4-red-003 → f4-green-005 | exit1, 3 failures → exit0, 9 pass | Actual expression/new-head confirmation replay across three exits; existing save failures and confirmed-save behavior retained |
| f4-identity-red-004 → affected-008 | exit1, 2 failures → exit0 | Identity variations and pre-rerender stale handler admission; in-flight save/edit continuation added |
| affected-008 | **exit0, 242 pass, 0 fail, 0 skip** | Full affected membership task integration plus membership runtime/UI contracts and old Assistant runtime contracts, serial offline execution |
| types-009 | **exit0** | `node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` |
| package-final-010 | **exit0** | Fresh current-source engineering Main/Preload/Renderer package; asar byte checks, CSP, descriptor and artifact-owned ad-hoc seal, no launch |

Affected command:
`node --test --test-concurrency=1 tests/contract/xanthil-desktop/member-task-runtime.contract.test.ts tests/contract/xanthil-desktop/member-task-ui.contract.test.ts tests/contract/xanthil-desktop/case-assistant-runtime.contract.test.ts tests/integration/xanthil-desktop/member-task.integration.test.ts`.
Pinned toolchain and complete environment are in command.json, unchanged from prior stage.
No old tests were retired or assertions loosened. Existing F1 test cases are retained
and parameterized with punctuation/encoding inputs across new task, supplement,
comment, return, retained main/Fork/Subagent, history and readable adopted-material reuse.
The component probe is controlled-hook actual-handler evidence, not DOM/native or human UX.

**Reused unchanged evidence:** previous `stage-fixes-20261002T050756Z/daily-final-029`
2446 pass / 0 fail / 1 real-Pi gate skip (includes portable canonical), and that stage's
full prior regression history remain valid historical evidence for unaffected modules.
This count is not presented as a newly rerun full suite. The new affected suite includes
real independent calculations, period/zero cases, grants/reservations/lease, formal
transactions/crash/reopen and compatibility assertions. No native command was rerun.

Current package identity file: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes2-20261002T071014Z/package-final-010/engineering-package/package-identity.json`.
SHA-256 `7fcab18f821a6ce3a6505fe2261c40fde340c215bcaf3a93a176c41044765109`.
Current app.asar: 122560132 bytes; SHA-256 `24e9a6a57d726ad4884a6a89ff310cca7bc55cdc622f133fddd47e84b0e67c17`.
The full new .app is retained under `package-final-010/engineering-package/out/`.
Previous package-final-031 and corrected-offline-001 remain immutable and are bound
through prior manifests. No old package identity is claimed for new source.

### Remaining limits, identity and return point

- E1 independent read-only persistence execution remains BLOCKED at mkdtemp before
  assertions. Author tests do not replace independent Validator persistence evidence.
- E2 Decision003 native startup and native/package-GUI/full native canonical remain
  outstanding. No retry, alternate route, prototype use or security change. Human
  experience and Product Acceptance remain user-owned. Real activation stays closed;
  actual Provider quality/cost and pre-recovery consumption remain UNKNOWN.
- Same branch `work/mac-mini/change-004-ai-led-analysis`, HEAD
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, base tree
  `74e042fa0680a22ba29fd68e87f67f8ca6428301`; no Git writes or delivery.
- juaner_worker responsibilities remain loaded; workspace-write/never supplied;
  cwd `/Users/bendandebaba/JuanerAI`. gpt-6-astra/high remains Controller-attested;
  independent runtime model/effort fields are UNKNOWN, with no configuration switch.
- Same-device receiver: Mac mini Engineering Controller, local owner bendandebaba,
  historical device identifier bendandebabadeMac-mini.local. Exact paths above are
  readable locally; fresh receiver readback pending. Cross-device backup UNKNOWN.
- NEXT_ACTION: Controller readback of `corrected-offline-002/receipt.json`, then fresh
  author-independent Validator. No Engineering/Product Acceptance, native acceptance,
  Git delivery, installation, release or new approval Gate is claimed.


## Current third correction — Validator003 F1 (2026-10-02)

Evidence root: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes3-20261002T074849Z`.
Complete candidate: `corrected-offline-003/receipt.json` under that root; its
candidate/dependencies/evidence/prior/runs manifests bind exact bytes and all failures.
Review input: `controller/validator-review-003/last-message.txt`, SHA-256
`14a7051033f306f9843294e720a18f1d4279241a9d9adb58d6c5f929051d4519`, with sibling
`stdout.jsonl`. Prior corrected-offline-002 receipt remains
`0202d5fb5da416e8f74c4ba7c901bf4ac154eb2623add99ef32c6287508f3471` and its candidate
`3e0ecb4d953befd9ce92e348579d887e3b91086881dd4bb518dbced72ea96e4b`.

### Scope, behavior and traceability

CAP05/SC10, product decisions §3.1 and Decision004 → spec “Third Validator
correction” → design “whole-expression inspection” → `containsPath` in
`packages/product-core/member-task.ts` → F1-V3 actual Pi contracts and existing
F1/P1-D004 integration consumers. Production changed only this shared predicate.
It checks complete slash-connected expressions before numeric/date exemptions,
recognizes hidden and extensionless names without a suffix list, and inspects
compatibility/percent decoding without modifying accepted payload bytes. Tests
cover numeric-adjacent roots, punctuation, nested/malformed encoding, token
boundaries, safe ratios/dates and Chinese business-label notation.

Actual new/retained/history Pi admission rejects prohibited material with zero
transport calls; credential construction/model-runtime spies remain uncalled.
Application/SQLite tests cover new questions, supplements, comments, returned
reports/comments, retained main/manual child, selected reports/history and readable
returned/adopted material. Issued refusal preserves verified work and accounting.
The successful suite also covers source drift, grants, reservations, physical lease,
formal effects, exact UI confirmation and compatibility. F2/F3/F4 production bytes
are unchanged; their prior independent positives are preserved, not enlarged into
acceptance.

### Saved command outcomes (no rerun after recovery)

Each directory below contains exact command/env, complete output, exit, input
copies and input hashes. `run.py` itself returns normally even on a failing child;
`result.json.exit_code` is the recorded test exit.

| Directory | Outcome |
|---|---|
| red-contract-001 | exit1; 97 tests, 51 pass / 46 causal failures; healthy actual Pi imports |
| red-consumers-002 | exit1; 24 causal Application/SQLite failures |
| green-contract-003 | exit0; first 182 contract tests passed |
| red-boundaries-004 | exit1; 12 tests, 3 pass / 9 failures exposed incomplete numeric token boundaries |
| affected-005 | exit0; 375 pass / 0 fail / 0 skip |
| types-006 | exit0; installed TypeScript `tsc -p tsconfig.json --noEmit` |
| package-final-007 | exit0; current Main/Preload/Renderer build and static engineering package checks PASS |

Affected command: pinned Node `--test --test-concurrency=1` with
`member-task-runtime.contract.test.ts`, `member-task-ui.contract.test.ts`,
`case-assistant-runtime.contract.test.ts` and `member-task.integration.test.ts`.
All earlier assertions remain; only new cases were appended and existing material
matrices extended. No test was deleted, weakened, skipped or retired. Reuse unchanged
historical daily-final-029 (2446 pass / 0 fail / 1 real-Pi gate skip, including portable
canonical) and corrected-offline-002 evidence for unaffected modules. These are not
new full-suite or native runs. Current successful test/type/package input manifests
are checked against final production and test bytes; later differences are docs only.

Package identity: `package-final-007/engineering-package/package-identity.json`,
SHA-256 `cb0cb5819a65bbd2ba14164d470fbb096f616306675e9a62a81a8f14122f6826`.
`app.asar`: 122560462 bytes, SHA-256
`44fa8dcde2775430a0befc9d0090af8d4d29eea7faf4f325da9d441461289db2`.
The complete artifact-owned app is in `package-final-007/engineering-package/out/`.
Static descriptor, Main/Preload identity, CSP, resource and ad-hoc bundle checks
passed. No app launch, install, Provider, credentials, native retry or alternate route.

### Recovery, limitations and handoff

`controller/worker-validator-fixes-003/bounded-recovery.json` records SIGINT at an
idle CLI boundary after all commands finished. It is invocation recovery, not a
product-test failure; consumption/cost UNKNOWN. No successful command was repeated.
Historical stages and snapshots remain unchanged. Current Controller coverage,
intake, decisions and state are copied as dependencies, never edited by this worker.

E1 remains BLOCKED: independent read-only persistence probes stopped at mkdtemp
EPERM before assertions. Return point is Controller's fresh independent Validator;
author fixture writes/tests do not substitute for that evidence. E2 remains BLOCKED:
Decision003 native startup and native/package-GUI/full native canonical have no
new permitted route. Return point remains the recorded native blocker and Controller;
no retry or security change is inferred. Human experience/Product Acceptance remain
user-owned; real activation is closed/unconfigured, model quality/cost UNKNOWN.

Same branch `work/mac-mini/change-004-ai-led-analysis`, HEAD
`c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`, tree
`74e042fa0680a22ba29fd68e87f67f8ca6428301`; no Git writes/delivery.
Loaded responsibilities: juaner_worker; supplied sandbox/approval: workspace-write/never;
cwd `/Users/bendandebaba/JuanerAI`. gpt-6-astra/high is Controller-attested; independent
runtime model/effort fields UNKNOWN. No setting or role change.
Same-device receiver: Mac mini Engineering Controller, bendandebaba,
`bendandebabadeMac-mini.local` (intake identity); fresh receiver readback pending,
cross-device backup UNKNOWN. NEXT_ACTION: read corrected-offline-003 receipt and
manifests, then fresh author-independent Validator. No Engineering/Product Acceptance,
release, installation or self-validation claim.


## Current fourth correction — Validator004 F1 ratio regression

Stage: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes4-20261002T083739Z`.
Read full independent review004; report SHA-256
`01910667d87d6b03d2b96a83b07ccdc4d95f5c6799e99c877fba42ac3a9e22a4`.
Prior Controller-frozen corrected-offline-003 receipt verified as
`7797ec1ae947fe1ac92acc4ba9b4cfb90ab1060098b54b29173389364ac9efe1`.
Historical copies remain unchanged. Current dispatch assigns mechanical complete
freeze/readback to Controller; this worker creates no new complete freeze script or
candidate manifests. This supersedes the earlier worker-freeze return point.

CAP05/SC10 and approved material semantics → spec “business ratio operands” → design
“preserve ratio operand boundaries” → shared `containsPath` in
`packages/product-core/member-task.ts` → F1-V4 contracts/integration. Only this
production predicate changed. Inspection keeps percent/unit spacing and balanced
Chinese label annotations with their operands, without removing any slash. Whole
numeric quantities/units remain required; path segments cannot borrow an exemption.
Accepted payload bytes remain exact. No runtime, schema, business field or authority
change. F2/F3/F4 production code is unchanged.

| Saved command directory | Actual outcome |
|---|---|
| red-001 | exit1; 82 tests: 54 pass / 28 causal failures rejecting safe business ratios |
| green-002 | exit0; 229 pass / 0 fail / 0 skip |
| affected-003 | exit0; 338 pass / 0 fail / 0 skip |
| types-004 | exit0; pinned TypeScript `tsc -p tsconfig.json --noEmit` |
| package-final-005 | exit0; one current-source static engineering package/build PASS |

Every command directory retains command/env, full output, result exit, input copies
and hashes. The runner's own exit is not the child exit; use result.json. Affected
Node command uses `--test --test-concurrency=1` and name pattern
`F1|P1-D004|P1-A-(CONNECTED|STOP|RESUME|WAIT|REOPEN|SOURCE)` on
`member-task-runtime.contract.test.ts` and `member-task.integration.test.ts`.
It covers all earlier F1 adversarial paths plus new unsafe adjacency, actual Pi
material slots with zero credential/model-construction/transport access on refused
inputs, Application/SQLite question/reply/report/comment and retained/history
positives, returned/adopted material, grants, lease, source drift and reopen.
Tests only append: scope-check.json proves both prior test files are byte-identical
prefixes. No deleted/weakened assertion or retired asset. final-input-check.json
verifies successful affected/type/package inputs against current non-OpenSpec files.

Reuse stage-fixes3 affected-005 375/0/0 for unchanged F2/F3/F4/formal/UI scope and
review004's bounded independent positives; reuse prior daily-final-029 2446/0/1
only for unchanged broader modules/portable canonical. These are historical evidence,
not newly rerun suites or independent author validation.

Package identity file: `package-final-005/engineering-package/package-identity.json`.
SHA-256 `8e3558a05dafb71eb74b6802a4f5072b138f31d61bee734c5daff0787dfaefa7`.
app.asar: 122560566 bytes, SHA-256
`b7f474a7c6c0ef3acf295fd3d32e36d9e369bda6a321ef69471661eed09080bb`.
Main/Preload/Renderer build, static descriptor/CSP/resource/byte and artifact-owned
ad-hoc bundle checks passed. No native launch, alternate route, Provider, credentials,
install, Git or Controller-owned file writes.

E1 remains BLOCKED: independent persistence assertions never ran past read-only
mkdtemp EPERM; author tests are not a replacement. E2 remains BLOCKED under
Decision003: native startup/UI/package-GUI/full native canonical remain outstanding,
with no retry authorized. Real activation remains closed; model quality/cost and
prior recovery consumption UNKNOWN. Human Product/UI acceptance remains user-owned.

Same-device receiver: Mac mini Engineering Controller, bendandebaba,
`bendandebabadeMac-mini.local` (intake identity). Loaded responsibilities juaner_worker;
workspace-write/never supplied; model/effort Controller-attested gpt-6-astra/high,
independent runtime fields UNKNOWN. Same cwd/branch/base; no setting change.
NEXT_ACTION: Controller mechanically freezes this saved stage/source, reads it back,
then dispatches fresh independent Validator. Cross-device backup UNKNOWN. No
Engineering/Product Acceptance or installation/release claim.


## Current fifth correction — Validator005 operand whitespace

Stage: `/Users/bendandebaba/JuanerAI-artifacts/change-004/worker/stage-fixes5-20261002T090727Z`.
Full review005 read and SHA checked:
`fa5dd238d4f3fd8c109657453b478843b8339febc1040de01f2cc3aa58f6addf`.
Prior corrected-offline-004 remains immutable; Controller performs the next complete
freeze/readback. No worker freeze script or complete candidate manifests were made.

CAP05/SC10 → spec “operand whitespace invariance” → design “recognize annotated
operands before tokenization” → shared containsPath → F1-V5 tests. Only production
change is `packages/product-core/member-task.ts` (production-scope.json). It recognizes
balanced Chinese label/unit annotations with optional spaces before splitting;
a complete annotated pair retains its slash while coalescing inspection spacing.
All surrounding path segments still undergo existing checks. Accepted payload bytes
are untouched; ordinary unannotated path grammar and F2/F3/F4 are unchanged.

Test generation changes each of eight annotation/separator boundaries independently,
then combined controls, using empty/ordinary/repeated/ideographic/nonbreaking spaces
and narrow/wide punctuation. Numeric percent/unit boundaries have their own matrix.
Actual Pi checks 11 new/retained/history/report/tool/result/adopted material slots.
Rooted, relative, hidden, extensionless, numeric-adjacent and encoded paths remain
covered; generated adjacent/embedded-path negatives have zero credential/model
construction and transport calls. Application/SQLite exercises exact selected text,
reply, returned report/comment, retained main and selected history. Old tests remain
byte-identical prefixes; test-preservation.json records that check. No assertion was
removed, weakened, skipped or retired.

| Command directory | Outcome |
|---|---|
| red-001 | exit1; 7 tests, 2 pass / 5 causal whitespace failures |
| contracts-002 | exit0; full member-task-runtime contract suite, 273 pass / 0 fail / 0 skip |
| consumers-003 | exit0; 39 pass / 0 fail / 0 skip |
| types-004 | exit0; pinned TypeScript tsc -p tsconfig.json --noEmit |
| package-final-005 | exit0; one static current-source package/build PASS |

Exact commands/env, input copies/hashes, full outputs and actual child exits are
retained in each directory. Consumer selection is
`F1-V[45]|F1 Application|F1 returned|F1 retained` on member-task.integration.test.ts;
no unrelated UI/formal persistence stages were repeated. final-input-check.json
confirms successful current non-OpenSpec input identities. Reuse historical338/0/0,
375/0/0 and2446/0/1 only for unchanged source/grant/lease, F2/F3/F4, legacy and broader
portable scope; those counts are not newly executed or independent author validation.

Package identity: `package-final-005/engineering-package/package-identity.json`, SHA
`1395539bad39479781990bc9bccbfcd4a3c37c927e14700194c3d837e817f756`.
app.asar:122560660 bytes, SHA
`d0e2b3efa4b45f98e91749cb847ad9af7b962b1622b04449366fa49d78789c8b`.
Static Main/Preload/Renderer build, descriptor/CSP/resource/byte and artifact-owned
bundle checks passed. No native launch, Provider, credentials, install or Git action.

E1 independent persistence execution remains BLOCKED before assertions at read-only
mkdtemp EPERM; author tests do not replace it. E2 Decision003 native startup/UI/package
GUI/full native canonical remains BLOCKED; no retry or alternate route. Real activation
is closed; model quality/cost and prior recovery consumption UNKNOWN. Human experience
and Product Acceptance remain user-owned. No Engineering/Product Acceptance claim.
Loaded responsibilities juaner_worker; supplied workspace-write/never unchanged;
gpt-6-astra/high Controller-attested, independent runtime fields UNKNOWN. Same cwd,
branch/base and same-device Mini Controller receiver; cross-device backup UNKNOWN.
NEXT_ACTION: Controller mechanically freezes saved source/evidence, reads it back,
then dispatches independent Validator. No pending worker command or new approval hop.


## Final independent evidence and delivery disposition — 2026-10-02

The Controller's [Engineering Acceptance](engineering-acceptance.md) records the
explicit user decision “放行E2，后续再修，交付change004”. This permits engineering
Git delivery and mechanical archive with the named E2 residual-risk waiver.
It supersedes earlier delivery stops; it does not rewrite independent verdicts.

Under `/Users/bendandebaba/JuanerAI-artifacts/change-004/controller/`:

| Exact report | Actual result and limit |
|---|---|
| validator-review-006/last-message.txt | No remaining material implementation blocker;273 runtime tests,220 exact payload checks,1364 refusals. Overall BLOCKED at that time on E1/E2. |
| validator-permitted-001/validation-007/last-message.txt | Independent membership persistence158/0/0 exit0, including hot-journal/crash recovery: E1 PASS. Native0/1 exit1, Electron PID34623 SIGABRT before Main/window/IPC; enumeration/kill EPERM. E2 BLOCKED. |
| validator-permitted-001/validation-008/last-message.txt | Targeted layout/configuration4/0/0 exit0; E1 PASS stands. Overall E2 BLOCKED; no complete canonical/native/package PASS. |

Review007's initial portable canonical attempt failed on two isolated layout
constraints; its1764/0/1 remainder and review008 targeted success are component
evidence, not a completed default canonical command. Counts overlap and are not
summed. Original failure/output/process records remain unchanged. The independent
reports precede the later Controller waiver; their withheld acceptance statements
are retained as historical conclusions. Current native diagnosis and exact repair/
reverification return points remain in [E2 follow-up](e2-follow-up.md).

Fixed candidate: corrected-offline-005, manifest SHA
`080a55f9abb23d8e1b358b96a6b6e410ef0707b095cfc2bc734a2b52b9e3009a`.
All184 source entries and32 frozen product files matched before archive. Afterward
all non-Change source/test/config bytes remain exact; only declared archive doc
updates/link rebasing and current-spec publication differ. Protected Controller
files remain byte-identical through the move. Exact mappings, before/after bytes,
report copies/hashes, source checks and link/equivalence checks are saved under
`worker/delivery-archive-001` in the same artifact root. No product suite was rerun
for this documentation-only work. Product experience remains deferred; actual
model quality/cost remain UNKNOWN. No installation/release or new runtime claim.

NEXT_ACTION: Controller reviews archive receipts and performs its separately
authorized Git integration. E2 follow-up remains OPEN. Worker has no Git/board/
coverage authority and performs no native or Provider action.
