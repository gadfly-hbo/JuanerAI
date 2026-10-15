# Complete R1–R4 independent technical review

**Formal Validator verdict: BLOCKED (role/sandbox conformance).**

**Candidate technical assessment: PASS for the authorized offline, synthetic, opt-in scope.** No material candidate correctness, approved-boundary, contract, architecture or required offline-evidence defect was found. This technical assessment is not an unconditional Validator PASS, Engineering Acceptance, Product Acceptance, CI, Git or release authority.

Review context: fresh native `/root/r1r4_native_validator_final`, explicitly dispatched as `juaner_validator`; no authoring of the candidate, its specs or its tests, no helper agents, no CLI role substitution. Complete R1/R2/R3/R4 and approved D1–D8 A were reviewed, including overlapping baseline changes and all WIP.

## Material formal limitation

**F-ROLE-01 — required enforced read-only sandbox is absent.** `docs/governance/agent-model-routing.md` fixes the independent role to gpt-6.1-sol/high/read-only; `.codex/agents/juaner_validator.toml` likewise declares `sandbox_mode="read-only"`. Native dispatch/role metadata declares gpt-6.1-sol/high. The active developer-provided effective permissions explicitly state `danger-full-access`, approval policy `never`, network enabled. No independent host telemetry exposing actual model inference settings is available beyond native role/dispatch metadata. Neither the role file nor read-only conduct proves a read-only sandbox was loaded.

Impact: the required formal independent-role conformance cannot be claimed, even though technical checks completed. No model fallback, effort change, permission change or waiver was applied. The failed historical CLI001 HTTP400 is not a candidate failure and was not retried. Recheck: obtain the required native role with supported effective read-only sandbox readback, or the user must explicitly decide a named exception; neither is implied by this report. A conforming reviewer can reuse still-applicable evidence after checking identity and independently exercising affected key paths; no unrelated engineering stage is required.

## Acceptance-first derivation

The review first read INDEPENDENT-REVIEW-BRIEF-001, the original approved route-B request/full audit/common handoff and adopted D1–D8 A. Before author code/tests/results, expectations were recorded in `acceptance-first-expectations-001.md`:

- R1: complete authorized source catalog and actual fixed-SDK native read/continuation; full data remains available for local calculations. Every final projected request, including after compaction and each candidate, admits system/schema/history/tail/protocol/images/output reserve. Unknown production policy is not silently supplied.
- R2: stop/error/known-zero/partial usage and physical UNKNOWN remain distinct; late facts do not rewrite frozen results or refund unknown usage. Agent native recovery and structured truncation refusal differ; fallback/retry/recovery share one extra allowance, with every physical summary/request metered in the same Task. Saved effect, model return and saved Outcome remain separate.
- R3: business tools use bounded model projections and authorized readable original material; exploration correction retains exact local input and one correction without echoing inspection. Output failure after a completed effect preserves that effect, invocation and consumption. Real IR and independent proof, not model assertions, determine results.
- R4: actual per-purpose authorized main/fallback recipients, candidate capabilities/window/protocol, shared allowance and actual used-model identity; no blind retry/fallback for unsafe context or unknown effects.
- Preparation: confirmed complete named Task1.4 snapshots precede readable receipts; exact task/revision/owner/epoch/source/config/hash fencing, four fixed views, strict reopens, proposalOnly draft/ready/adoption separation, no automatic recovery.
- Compatibility: retain `required_calculations.execution_plan`, `finish_result.result` and their actual consumers; opt-in new Tasks only, strict unchanged legacy versions/history, no migration/backfill/replay/clearing UNKNOWN. Unsupported or corrupt state fails closed.

Required policy/testing/DoD/test-retirement, business Ports/Adapters, ADR0003/data/security, canonical shared AGENT-RUNTIME, accepted v1.3 UI Contract/approval and common UI/device baseline were read. Root DESIGN.md is absent, as already disclosed by this Change; the approved Contract/common baseline supplies the applicable unchanged shell and affected diagnostic behavior.

## Independent identity checks

Only worktree `/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`, branch `work/mac-mini/pi-r1-r4-repair`, baseline HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d` was used. HEAD alone is not the candidate.

- Original 87-file manifest/snapshot aggregate: `a5f0a8c11c3b4760b92953c7ce198d2ad2fff336d85b54b7651ad984804b8fd4`. All 87 frozen snapshot files independently match their declared bytes/hashes.
- Current technical 57-file subset: `ed924bdf32acdff1819dea501a6617bb36a478d42ffb8e9010fe49cc544a530c`; all technical source/contracts/tests/package/lock/vendor bytes match the fixed candidate.
- Known pre-existing metadata difference: status.json is 6329 bytes/SHA `4e3fc4475c9f55ee9016c1d1917fb638f33b2590d205baabb817fe2fed80b16c`, plus interruption event `20261015024127130-EVT-20261015024127130-96QIQZ.json`. They were inspected as attributed metadata, preserved and never reset/excluded as whole-file technical changes.
- Current original-87-path aggregate before/after: `b33a7924d6a422a55ea5c481f38793e181e0d1a0a81ca85971789b48ccba5c4f`. Complete current 88-file aggregate including the interruption event: `b9b796ee8c0cb624fc7640c37f32c2b08f2c2b692b69bb5cfb9d192b6cf1a16a`.
- Before/after content drift: none. Git status unchanged during review; no committed/staged/unstaged/added technical content was omitted. No Git mutation was performed.
- Actual ESM resolution is this worktree's `node_modules/pi-agent-runtime/dist/index.js`. Archive .3 is 146131 bytes/SHA `e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce`; all 51 installed files exactly equal archive bytes, no file symlink substitution. SDK is not a mutable source link or patched install.
- Semantic lock comparison changes only root and SDK entries; 764 other entries are identical. Historical .2/.4.3 packages remain. Pi core/ai are exact 0.86.1, SDK OpenAI edge is 6.40.0.

Evidence: `fresh-validator-before-001.json`, `fresh-validator-after-001.json`, `fresh-installation-001.json`, `fresh-snapshot-lock-001.json`.

## Independent execution

Exact argv, cwd and command-local environments are persisted in `commands-executed-001.json`; the table below is a readable summary. Cwd is the exact worktree above. Approved command-local PATH/toolchain is `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/toolchain-bin:/usr/bin:/bin`; observed Node v26.0.0 resolves to the approved task toolchain. Provider gate was unset. JUANERAI_TEST_EVIDENCE_DIR points to this `independent-full-002` root. Final browser/CI/preparation/persistence probes also set TMPDIR here. All model responses/credentials/data were synthetic; localhost and existing headless Chrome only.

| Evidence log (same name .exit) | Exact test command suffix / probe | Result |
|---|---|---|
| fresh-key-native-001 | `node --experimental-strip-types --test --test-name-pattern='PREP-J\|R1-WIRE\|R2-WIRE\|R1-SELECTED-READ\|R4-PURPOSE\|R4-CODEC\|R2-UNKNOWN-TOOL-02\|R2-DIAGNOSTIC-READ\|R2-NATIVE-RECOVERY\|R2-CODEC-PHYSICAL\|R2-STRUCTURED' tests/integration/xanthil-desktop/open-analysis-autonomous-native-session.integration.test.ts` (regex alternatives use literal pipe, without shell backslash) | 47 PASS, 0 FAIL/SKIP, exit0 |
| fresh-preparation-guards-001 | same node options, pattern `PREP-\|R3-CANDIDATE\|R1-CODE03`, application integration file | 29 PASS, exit0 |
| fresh-collateral-ui-002 | same node options, pattern `R2-BROWSER-DIAGNOSTIC\|READ-CARRIER-004\|R3-SHARED-WIRE\|R3-COLLAB-PROOF-02\|R3-SAVED-PLAN-READ\|R3-FACT-COLLECTION`, native integration file, existing Chrome executable | 20 PASS, exit0 |
| fresh-persistence-contracts-001 | same node options, pattern `READ-CARRIER\|R2-STORE\|R2-AUDIT`, shared-runtime-state integration file | 18 PASS, exit0 |
| fresh-ci-inputs-001 | `node --test tools/harness/validation/prepare-ci-install.test.mjs`, original approved node-gyp archive input | 17 PASS, exit0 |
| fresh-typecheck-001 | `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` | exit0 |
| fresh-independent-counterexamples-001 | own diagnostic .mjs, independently inspected/re-executed earlier independent probe source with only diagnostic destination changed | 3 counterexamples PASS, exit0 |
| independent-ui-768-001 | new independent diagnostic .mjs using normal Personal Profile/server/client/browser entry | 1366×768 and 1440×900 PASS, exit0 |

Total current focused test executions: 131 PASS/0 FAIL/0 SKIP, plus the independent diagnostic counterexamples and exact-viewport probe; counts are not a replacement for path judgment.

Key real paths observed:

- PREP-J05: actual Personal Profile → Application → Adapter → fixed .3 persistent Session → explicit Preview adoption → revision2 declared IR → real calculation and independent verification → goal review/report → saved Outcome value7 → HTTP/client/renderer/reopen. 8 physical model requests, 4 tools; original preparation remains in history, no new-scope draft inheritance.
- PREP-J01/J03/J04: business waiting, two candidate graph batches, and complete unique SOURCE semantics reassembled by actual native offset/limit reading. Draft retention is not formal framework/Outcome/adoption.
- PREP-J02: write-before rejection, committed-but-ACK-lost, model unknown after tool, cancel before/after save; actual SQLite/fixed SDK remain real, only business persistence Port fault-injected. No false ready/Outcome, preserved known7/3 and unknown4096 reservation, no replay/refund.
- Final schema/window and unknown-policy refusal happen before product physical reserve/credentials/send; long-cell current-tail200k rejection and authorized1M success are distinct outcomes.
- Both real Pi codecs were exercised offline; main/fallback candidate identity/authorization/window and shared extra allowance, Agent summaries/recovery, structured retained/report truncation refusal, no unknown-effect replay.
- Independent synthetic tool wrote a real task-local effect once; overlimit projection and thrown projection separately stopped further model requests while audit kept completed/rejected-or-failed, actual effect and known11/5 usage. Independent owner mutation and stopped-owner saves rejected with persisted original intact.
- Actual Chrome through standard HTTP/bootstrap/client showed quota and physical UNKNOWN safely. Independent required-height probe used different partial13/4 counters and verified 4096 reserve, disabled recovery, actual drawer visibility, no page errors and refresh zero additional calls. Screenshots were visually inspected; affected Chinese diagnostics are readable in the accepted shell.

The tests close their task-owned browser/server/workspace in finally blocks. Subsequent process readback found no running task-owned Chrome/node probe under this diagnostic root. No production service was started or modified.

## Execution-footprint disclosure

The first `fresh-collateral-ui-001` command set the persistent evidence root but omitted command-local TMPDIR. Inherited `os.tmpdir()` is `/var/folders/sr/3yqhm2kn4zsfxhnhmr67yjg40000gn/T`; Playwright temporary-profile containment under the approved diagnostic root therefore cannot be certified for that historical run. It exited0 and its browser/server finally blocks completed. No unrelated host cleanup was attempted. The run is retained, not relabeled or erased. Final collateral evidence is `fresh-collateral-ui-002`, re-executed with TMPDIR explicitly inside this root; the independent exact-viewport probe also used that setting. Do not claim that every earlier temporary browser footprint was root-contained. This is reviewer execution conduct/provenance, not a defect in the fixed product candidate.

## SDD/TDD, retained tests and evidence applicability

Persisted proposal/product-reference, equivalent `spec.md`, tasks, verification, original design and preparation design are present. R1/R2/R3/R4, READ-CARRIER, PREP, D1–D8 and original V01–V17 form explicit acceptance/spec/test/evidence links. Necessary storage/activation/rollback parameters are specified, with host byte/count limits clearly distinguished from token safety.

Raw causal failure logs were inspected alongside before-image source and permanent assertions: Store1.1-versus1.4, missing business save, unbounded unique semantics, waiting-parent business omission, native valid-candidate Context seal, strict historical Preview-owner reopening, earlier final-wire/output/diagnostic and retained-JSON cases. Fifteen preparation RED before-image manifests independently hash-match. The valid failures are behavior-caused; documented invalid handles, wrong source identity, missing legacy declaration/goal-review, syntax/import/locator and no-matching-test attempts are not counted as RED. PREP-J05 and additional codec/native-recovery coverage are coverage increments, not fabricated historical RED. GREEN was re-exercised. No candidate source was modified to recreate RED.

Test retirement audit compared all seven changed test files against baseline, test-name inventory and assertion AST calls. The one renamed R1-CODE03 test retains actual filtered local execution-input assertions and adds no-inspection/hash-locator output assertions. Existing names/negative cases are otherwise retained. Non-null/type/Reflect-access corrections preserve runtime assertions; direct schema-error helper calls no longer pass the obsolete incomplete invocation shape. Historical approved tuple constants remain; the sole new SDK tuple and exact hashes have rejection tests. The two Chrome cases are conditional on an existing executable and were actually run; there is no new only/todo or hidden skipped required path. No separate retirement Gate/ledger is required.

Author canonical002 raw output was independently parsed: 17 groups exit0, 4611 total /4610 PASS /0 FAIL /1 real-Provider SKIP. All 29 quality-input files still match current bytes; fixed install/source/lock/input applicability was verified. This evidence, plus unchanged prior independent full001 collateral (including full24-step graph/IR/proof/Outcome, exploration and read-late/receipt boundaries), is reused only within matching scope. Current persistence/carrier checks additionally reran late/forged/mismatched/audit-fault paths. Canonical syntax/type/portable regression are valid local evidence. CI workflow and executable invocation/source pins were inspected, and current CI-input negatives rerun. No hosted CI was run or claimed; no dependency download/install or packaged Desktop build was performed.

## Architecture, scope and compatibility

Changes preserve Application/Core → business Ports ← Adapters, with Profile composition. Pi/SDK types stay inside Pi Adapter. Native Session/read/offset-limit/compaction/queue/recovery remain SDK mechanisms; business source/semantic/IR/proof/Outcome and authorization remain product-owned. Named preparation content uses existing Task JSON, not a general repository, second Session engine or automatic recovery. Effect/output/usage observations remain separate.

The complete diff retains both `required_calculations.execution_plan` and `finish_result.result`, exact current-identity/allowed-reference consumers and strict old history. New Task1.4/preparation capability and material/output policy are opt-in, fixed per configuration; ordinary production composition does not silently enable synthetic admission parameters. Old tasks are not rebound. No source, tests, specs, contracts, handoffs, board, package bytes or Git state were changed by this reviewer.

## Advice (nonblocking)

1. Existing append-only tasks/proposal/design sections retain old NEXT_ACTION/unchecked/history labels before current appendices. Current acceptance and matrix007 disambiguate them; consolidate current pointers during authorized closeout to reduce reader mistakes.
2. Author R2 browser test calls its narrow screenshot1366 but uses height900. This review independently checked1366×768 successfully; retaining that exact required viewport in permanent author evidence would prevent future ambiguity.
3. Existing production overhead/margin/image UNKNOWN and default activation stop must remain prominent; the offline technical result must never be described as production readiness.

## Retained limits and affected return point

Production admission overhead/margin/image remain UNKNOWN. Synthetic512/8192 and historical961743 observed bytes do not prove production token safety. Historical final1-token cause remains UNKNOWN; no HTTP/length cause was invented. Large tool arguments and retained recovery fields can still hit final guards; safe refusal is not guaranteed success for every maximum combination.

No real Provider/credentials/business data, historical Task migration/recovery/replay, production activation/service update, other product/host operations, deployment, installed/packaged Desktop/native acceptance, hosted CI, commit/push/merge/release or user Product Acceptance was performed. No exception from another Change applies here. Technical evidence is Mini-local WIP/evidence, not Git-integrated preservation or cross-device backup.

There is no candidate repair request from this review. Formal closeout returns to the primary at F-ROLE-01. Preserve the exact candidate, failures, UNKNOWN, initial temp-footprint limitation and all evidence. If technical bytes/input/environment change, independently recheck affected and collateral paths; do not carry an invalidated PASS. Only the primary owns project state and Engineering Acceptance. The user retains Product/risk/Git/release authority.
