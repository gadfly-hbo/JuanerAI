> Current archive disposition (2026-10-02): [Engineering Acceptance with E2 waiver](engineering-acceptance.md) authorizes this delivery/archive. E1 independently passed; E2 remains open in [follow-up](e2-follow-up.md). Human experience remains deferred. Earlier status and unchecked items below are historical and have not been relabeled PASS. See [completion](completion.md).

# Change004 work and evidence

## Current A/B engineering checkpoint

- [x] Read intake/current-user override, approved product/UI/acceptance/decisions,
  Review003, applicable architecture and accepted Desktop/Assistant/collaboration.
- [x] Inspect actual calculation, Application, store, report, runtime and model-lease seams.
- [x] Inspect installed tools and run proportionate existing offline baseline.
- [x] Prepare [proposal](proposal.md) and concrete [C1–C6](design.md) for Mini.
- [x] Mini closed C1–C6 in engineering-decisions.md; same worker resumed.
- [x] First real connected loop: spec → causal RED → GREEN → affected regression/typecheck.
- [x] Preserve command/input/output identities and actual failures in implementation-001.
- [x] Continue C3/C4 and the unaffected C5/C6 offline loops under Decision003.
- [x] Implement Decision004 retained Completed main/manual-child origin policy and original ledger.

Current checkpoint includes real comments, period revisions, review drafts, all three human outcomes, attached formal commit and crash proof. The retained Completed-source causal RED is now GREEN with explicit positive main/child consumers. Native and independent acceptance remain outstanding.
See [verification](verification.md) for exact candidate, real failures, passes and gaps.
No full A/P1, Validator or product acceptance is claimed.

## First implementation loop — exact result and tests

C1/C2 fields and schema110 DDL are specified in this Change. Implemented result: **confirmed synthetic two-CSV membership
task input → selected plan → real DuckDB/Python → same-plan verified draft report**.
Use the actual Application/Store consumer early; do not stop at a plan serializer.
This is the first part of A; C3/C4 and the normal quick entry immediately follow.

Stable focused test IDs (actual runs and limits in verification.md):

| Test ID and proposed file | Required assertion and causal sensitivity | Acceptance |
| --- | --- | --- |
| P1-PLAN-01, `tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts` | Same approved mapped-group CSV pair, plan `[M1]`: real primary and verifier execute M1 only; `m2=not_selected`. Capture actual SQL sent to DuckDB and executed Python branch independently of returned metadata. Fail if SQL retains grouped UNION or Python accumulates groups. | SC-02, CAP-02 |
| P1-PLAN-02, same file | `[M1,M2]` on same snapshot computes anonymous contributions, each exact and sums to overall revenue delta; both algorithms agree, input identities unchanged. | SC-02, CAP-02/03 |
| P1-PLAN-03, same file | Change valid equal disjoint periods on a deliberately distinguishable fixture: inspect actual arguments/read range and exact changed results in both engines; reuse scenario version. | SC-04, CAP-01/03 |
| P1-PLAN-04, same file | Unknown method/version, wrong dependencies/order, M2 without mapping, Contract/Binding/config/source/verifier mismatch reject at admission or pre-execution with zero subprocesses/publications. | SC-07/10, CAP-02/03 |
| P1-PLAN-05, same file | One-period zero: unavailable rate and rate delta, finite other metrics, Inconclusive; all-filtered-empty: blocked and no Finding/report; positive-denominator zero rate stays `0/1`. Independent expected values. | SC-05, CAP-03 |
| P1-CHAIN-01, `tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts` | Real Application + SQLite + Run store + engines publish verified draft whose report/Finding/evidence/two result files/materialized assets all bind the same scenario/plan/input. No acceptance/Closure/Decision. Reopen reads exact committed identity. | SC-01/02, CAP-03/06 |
| P1-CHAIN-02, same file | Tamper at each of admission, execution and publication: wrong plan/result/source or cancellation; grant epoch follows in C3/C4; no success visibility; old report remains exact. Equal numeric outputs with wrong identity still reject. | SC-07/09/12, CAP-03/09 |
| P1-COMPAT-01, same file | Old fixture/project schema100 and Run3.0 read unchanged; only explicit P1 command migrates; supported migration preserves old row values/files; invalid schema and earlier-reader/new-schema refusal write nothing. | CAP-08/09 |

Use existing `desktop-fixtures.ts`, `desktop-contract-drivers.ts`, real adapter
factory and `completedU2Analysis` setup logic where applicable; extend private
fixtures rather than copy their authority. The new full-task scenario starts blank,
never from a manufactured Completed Case. Only test-specific values are introduced.

RED order: first P1-PLAN-01 plus fixture-health controls; its expected failure is
missing planned M1-only execution (currently grouped execution is unconditional).
Do not classify invalid import/toolchain errors as RED. Then minimum GREEN,
P1-PLAN-02/03 and P1-CHAIN-01 early, followed by refusal/zero/identity/compatibility
leaves, each behavior's spec and causal RED before its production change.
Where old behavior already passes a required boundary, retain it as pre/post GREEN.

For actual execution evidence, test wrappers delegate to installed DuckDB/Python
and preserve exact stdin/assets; Python test-only branch tracing observes executed
group logic. The test must detect an intentionally wrong always-M2 branch, not
merely trust `executed_methods` returned by production. Do not replace either
algorithm with a mock or share the primary calculation as the verifier.

Focused commands after tests exist (approved toolchain PATH and evidence variables
as below):

```sh
node --test --test-concurrency=1 tests/contract/xanthil-desktop/member-analysis-plan.contract.test.ts tests/integration/xanthil-desktop/member-analysis-chain.integration.test.ts
node --test --test-concurrency=1 tests/contract/xanthil-desktop/xanthil-desktop-analysis.contract.test.ts tests/contract/xanthil-desktop/xanthil-desktop-store.contract.test.ts tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

## A continuation — connected unfinished task

- [x] Real Profile/Main/Preload/renderer consumer, explicit preparation, unchecked
  text consent, separate grant/Attempt, synthetic Pi, real SQLite/DuckDB/Python.
- [x] Plan-controlled M1/M2 and first verified finding/draft; later explanation
  failure preserves the result and explicit continue avoids repeating calculation.
- [x] Closed payload/tool refusals, persistent cumulative reservations, fault tests,
  stop fence, same-global-slot contention, reopened database usage retention.
- [x] C4 physical settlement across Completed Assistant, child, professional helper
  and Pi paths; abort/timeout does not free issued work. Legacy regression repaired.
- [x] Active membership Project switching refuses BUSY; ordinary mode navigation
  preserves task identity. Confirmed close/renderer loss use existing fences.
- [x] CAP-01/SC-06 persisted configuration selection/readback and real repeated-task
  engine consumption; same-version drift refuses and explicit new version retains
  history. Normal selection reuses known fields; component interaction remains below.
- [x] Chinese CNY amounts, percentages/percentage-point deltas and readable durations;
  raw values/JSON in expert expansion. Actual React render checks pass; native
  interaction/viewport evidence remains below.
- [x] Portable actual-component handlers + real Main IPC exercise prepare/consent/
  authorize/continue/stop/reopen (`a-component-interaction-019`). Native DOM, focus
  and viewport evidence remain outstanding; this is not human UX acceptance.
- [x] Persist expiry/source-change fences on idle/active paths, late response and
  changed authorization bytes; failed fence writes prevent restored-source retry.
  Seven focused grant-fault cases pass with retained causal failures.
- [ ] Retain native product startup blocker (SIGABRT before Main, cleanup EPERM)
  for integrated verification. Decision003 supersedes the Controller's former
  A-interaction-before-B packaging dependency; continue unaffected offline B now.
  No A acceptance is granted. Final candidate freeze follows integrated P1.
  Real activation remains closed without approved config.

## B continuation — comments and explicit human result

- [x] C5 RED/GREEN: exact comment version/scope/author/consent; expression-only
  changes preserve factual/evidence identity and human edits, produce no new Run.
- [x] Valid period edit previews impact then new revision/plan/grant/Run/report;
  same values NO_CHANGE; unsupported filters/causality refuse without work.
- [x] Expected guardrails/dependencies and inapplicability remain distinct through
  suggestions, editing, validation, formal save, history and export.
- [x] C6 RED/GREEN: three human exits, precise review capture, legal Closure,
  one combined storage commit; no model formal-write tools.
- [x] Real SQLite faults before/after each formal write and commit prove all-or-none;
  response-loss readback returns one exact receipt; unreadable locks resubmission.
  Reopen/retry preserves draft and intent. Stale review/formal head and payload
  conflicts reject; concurrent submission yields one formal result.
- [x] Exact supported schema migration/rollback-journal recovery and older-reader
  refusal; old sessions/rows/report bytes unchanged; old CLI/Completed Assistant
  and 003 eligibility, separate grants and MODEL-only adoption remain covered.
- [x] Normal membership entry integrates T1→T3/T4→human review with actual engines
  and storage. Controlled-hook component events call actual Main IPC. This is
  portable event evidence, not native interaction or user experience acceptance.
- [x] Decision004 retained main/manual child use distinct explicit grants in the
  originating membership ledger. Actual Pi prompts/tool results/selected material
  stay totals-only; missing config, unsafe text/history/results, changed source,
  expiry and revoked grants refuse. Original Completed/formal history stays exact.
- [x] Actual child return → explicit MODEL adoption → parent issue consumes the
  original ledger; selected professional view reads the same Case. Source link
  activates existing102 atomically; frozen old reader refuses it.
- [x] Expression revision replaces the visible primary text and retains exact
  immutable factual sections, references and human edits; repeated revisions do
  not accumulate generic commentary. Completed P1 formal records display read-only.

## Applicable verification and test preservation

During loops run affected Core, Adapter contract and real Application/Store
integration. At complete candidate run installed typecheck, affected Main/Preload
closed IPC/sender/isolation tests, Pi protocol/transport contracts, daily deterministic
regression (`node tools/desktop/test-daily.mjs --all`) and canonical
`tools/harness/validation/run` with its actual package/evidence prerequisites.
Do not enable real-model gates. Main/Preload/security changes require explicit
affected package checks; a daily pass is not package/native/install acceptance.
Do not reuse Change003 package identity as a Change004 proof.

Native UI and viewport/focus checks must use a separately permitted product route;
the blocked prototype is not opened or served. Human UX/prototype rehearsal is
not dispatched. No Provider, credentials, installation or host activity is implied
by a test dependency; report a genuine missing permission to Mini.

Test-asset retirement: no tests were retired or deleted. Existing VM/component
fixtures and exact additive-IPC inventories were updated. The default Quick label
assertions follow approved membership entry; legacy Assistant rendering remains
covered separately. Subagent Stop/timeout assertions now wait for physical
settlement before expecting a free lease, retaining all business negatives.
Exact edits and retained failures are recorded in verification.md.
Future tests extend coverage; legacy exact-schema and zero-format assertions stay
on legacy paths, with version-specific new tests. Any helper/assertion change must
state the contract delta and retained positive/negative coverage in verification.
No weakening, silent skip or age-based deletion. Independent final Validator is
Mini's later dispatch; this author does not perform it.

## Baseline and checkpoint handoff

Historical design-only baseline: design-001, 12 existing focused tests passed.
Current implementation evidence and HANDOFF_BACK fields: [verification](verification.md).
The prior proposed design handoff is preserved unchanged in design-001; it no longer
states the current work status. No Controller/board/intake/decision file was edited.

**NEXT_ACTION:** Controller reads `stage-d004-20261002T0325Z/integrated-offline-001`
and dispatches a fresh read-only Validator against the complete offline candidate.
Current permitted daily/canonical portable, affected component/IPC/legacy/type and
fresh engineering-package checks passed as recorded in verification. Decision003's
native startup gap remains; no retry is authorized. No A/P1/product acceptance,
Git delivery or runtime activation is claimed. No new dispatch permission is needed.

## Current F1–F4 correction package

- [x] F1 general material rule through actual Pi, new/retained/child and reused material consumers; retain safe text/ratio/period positives and old negatives.
- [x] F2 default exact evidence summary, pending known-field and distinct guardrail suggestions, missing-only normal flow and full editing; preserve explicit unknowns and human edits.
- [x] F3 shared persisted-receipt formal status, three exits, initial/history/mismatch/unknown readback.
- [x] F4 truthful save projection/null, exact comment identity/consent retention, pinned human draft through failure/response loss/readback and explicit continuation.
- [x] Behavior RED/GREEN, final affected daily/portable canonical/legacy/security/Adapter/engine/persistence checks, strict typecheck and fresh offline engineering package.
- [x] Preserve old source freezes/failures and prepare new complete `corrected-offline-001` manifests with current Controller inputs as dependencies.
- [ ] Fresh independent Validator and Controller conclusions; E1 independent read-only persistence evidence still outstanding.
- [ ] E2 native startup/UI/package-GUI/full native canonical evidence (Decision003 no retry remains binding).
- [ ] User human Product/UI acceptance; real activation/configuration and real model quality are not supplied by this engineering work.

Exact commands, failures, source/package/evidence identities and return point are in
the final section of [verification](verification.md). This is author correction
completion, not A/P1 acceptance, Git delivery or release.


## Historical bounded second correction (Validator002)

- [x] F1 punctuation/encoding lexical boundaries and exact safe ratio/date/business payload preservation; actual new/retained and reused material coverage.
- [x] F4 exact reviewed identity, stale-handler submit fencing, expression/new-head sequence, in-flight edits and all three real Main/SQLite outcomes.
- [x] Causal RED before both repairs, affected regressions/typecheck and fresh current-source offline engineering package; unchanged broad history explicitly reused.
- [x] Preserve previous failures/candidates/packages and prepare complete new corrected-offline-002 source/evidence freeze with current dependencies.
- [ ] Fresh independent Validator and Controller conclusions; E1/E2 and user human acceptance remain outstanding.

See the final verification section for exact commands, identities and return point.

## Historical bounded third correction (Validator003)

- [x] F1 complete slash-expression inspection: numeric/date exemptions cannot hide later path segments; hidden/extensionless and encoded paths use the same shared rule. Accepted safe payload text remains unchanged.
- [x] Retain causal actual-Pi and Application REDs, including returned/history/adopted material; retain every earlier positive and negative assertion. No test retirement.
- [x] Affected regression 375 PASS / 0 FAIL / 0 SKIP; typecheck exit0; current-source static engineering package PASS. F2/F3/F4 implementation unchanged.
- [x] Prepare complete corrected-offline-003 source/dependency/evidence/prior manifests, binding review003 and idle CLI recovery; preserve all historical snapshots and failures.
- [ ] Controller readback and fresh independent Validator; E1 independent persistence and E2 native checks remain BLOCKED. Human Product/UI acceptance remains outstanding.

NEXT_ACTION: same-device Controller reads the new receipt referenced in verification.md.
This bounded correction adds no acceptance, Git, Provider or native execution authority.


## Historical fourth correction (Validator004)

- [x] F1 unit/percent/parenthesized-label ratios reach actual Pi unchanged; complete-expression path refusal and all prior adversarial tests remain.
- [x] Causal RED (28 failures), minimum GREEN (229 pass), affected regression (338 pass / 0 fail / 0 skip), typecheck and one current-source static package passed.
- [x] Actual Application question/reply/report/comment and retained main/selected-history positives; shared selected report/tool/result/adopted-material positive and unsafe-adjacency checks. Old tests preserved byte-for-byte before appended cases.
- [x] Save exact commands, input copies, outputs, exits, failures and source checks in stage-fixes4-20261002T083739Z; no worker complete-freeze script/manifests per current dispatch.
- [ ] Controller mechanical complete freeze/readback and fresh independent Validator; E1/E2 remain BLOCKED, user experience and acceptance remain outstanding.

NEXT_ACTION: Controller freezes the saved source/evidence using its adopted script.


## Current fifth correction (Validator005)

- [x] Recognize complete annotated operands before fragment splitting; preserve harmless spacing/width variants and original payload bytes.
- [x] Causal RED: 5 failures in 7 tests. Full actual Runtime contract suite: 273/0/0. Focused shared consumers: 39/0/0. Typecheck and one static current package passed.
- [x] Retain prior tests verbatim; add bounded independent-boundary/combined whitespace matrices, unsafe adjacency and real Application/history positives. Preserve every raw failure and input/output/exit.
- [x] Save stage-fixes5-20261002T090727Z and concise verification; no complete worker freeze.
- [ ] Controller mechanical freeze/readback, fresh independent Validator; E1/E2 and user-owned acceptance remain outstanding.


## Delivery/archive disposition — 2026-10-02

- [x] Record review006's bounded implementation PASS; preserve overall BLOCKED and original report.
- [x] Record review007 independent persistence158/0/0: E1 closed. Record review008 targeted4/0/0; no complete canonical/native/package PASS inferred.
- [x] Reference Controller Engineering Acceptance with explicit user E2 waiver and perform authorized mechanical archive/current-spec publication.
- [ ] E2 native interaction, cleanup and current-package GUI/full native canonical evidence: OPEN, deferred under the named waiver.
- [ ] User experience/Product UI evaluation: deferred to the user, not completed.

Git integration belongs to Controller. No installation, release or Provider activation is performed here. Prior unchecked historical tasks remain as recorded.
