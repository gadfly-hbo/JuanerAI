# Test Plan: Change Coordinator Production Delivery Chain

> Archive history (2026-09-14): Controller accepted the applicable local repair under R242/R248 and authorized mechanical archive in R258. Historical Gate/task/evidence text below is preserved, not a current pending verdict. S09/A2 remains USER_WAIVED / NOT_VERIFIED; target-host deployment, EMPTY/D1 and BLK-D1A-008 remain pending. This archive does not authorize Desktop or a product DISPATCH.

<!-- R216_SPEC_BEGIN -->
## R216 — isolated F1/F2 corrective Test Design obligations

This addendum applies existing `TEST-M2-002`, `TEST-M2-011`, and the retained Foundation STATUS tests to the R216 design. It authorizes no Test write or execution. The isolated Test role must freeze exact preimages, counts, selectors, independent oracles, suffixes, and dispositions before either RED. Candidate Test writes are only one bounded F1 group plus necessary imports in existing `tools/harness/change-coordinator/production-delivery-chain.test.mjs`, and one bounded F2 group plus necessary imports in existing `tools/harness/change-coordinator/coordinator.test.mjs`. `fixtures.mjs`, mode/CLI/WVEB/Git tests, production source, and all other Test assets remain frozen unless a concrete mismatch is returned to Controller as `CONTRACT_CHANGE_REQUIRED`.

### F1 fixed leaves and two causal REDs

The permanent F1 group uses these currently unused leaves under the existing Ledger owner:

| Leaf | Frozen purpose |
|---|---|
| `TEST-M2-002 / R216-L01` | dynamic module-entry contract for `createUnpublishedLedgerEvidenceCommitBuilder`; absent export is the only entry RED and becomes an export/frozen-factory regression after extraction |
| `TEST-M2-002 / R216-L02` | real empty-parent, nonempty-parent/path-absent, and existing-target append positives with independent receipt-prefix/tail/object/byte/tree/parent/message/preserved-entry oracle |
| `TEST-M2-002 / R216-L03` | real `GIT_INDEX_FILE` lock and missing-predecessor/process failure after a healthy mechanical-publication control; neither yields publishable success or any ref/remote effect |
| `TEST-M2-002 / R216-L04` | real parent target-mode/ancestor/descendant collision, old-blob/prefix disagreement and reachable physical readback disagreement, with exact conflict/unavailable separation and permitted local partial effects |
| `TEST-M2-002 / R216-L05` | closed constructor/request invalidity, private-writer one-construction/same-publication reuse, success-only protected-transport gating, complete preserved-hash receipt propagation, and no full-factory/credential/ref/env/callback exposure |

Before production changes, Test dynamically imports the healthy production module and requires the named property to be a function. Failure because that property is absent is `RED-R216-F1-ENTRY`; no suffix is executed or reported as behavior evidence. Node/module, pinned Git, current-user temporary root, actual uid/gid, SHA/object parsing, and independent recursive raw-entry oracle controls must pass. `TDD_READY-ENTRY` permits only the mechanical extraction in Tasks below.

After mechanical extraction, Controller compares the old private construction-region preimage with the extracted shared body and proves that delegation did not duplicate it or add final validation. This comparison is a temporary source checkpoint, not a permanent Test helper or behavior PASS. Without Test edits, `R216-L01` must pass and `R216-L02..L05` become reachable. Before any fault, direct invocation of the mechanical shared body may return the old internal `{tree,commit}` rather than the final result union; the Test independently reads those real objects and must prove a healthy target blob/tree/parent/message and unchanged non-target entries. Return-shape difference is not the behavior RED.

The same extracted body is then invoked with a physically valid parent, receipt and bytes while a Test-owned real `<derived-index>.lock` blocks index mutation; a separate isolated index in the same repository proves fixed Git and fixture health. `RED-R216-F1-BEHAVIOR` requires a physical contradiction: despite the actual failed child, the old body returns or the private wiring caches an empty/unresolvable commit/tree, a tree without the target, lost non-target entries, wrong parent/path/blob/bytes, or another independently read bad publication fact. It is causal only if entry, mechanical healthy publication and fault controls passed. This RED plus all already-frozen final suffixes is the only F1 basis for the second TDD_READY.

Final F1 GREEN must use the same shared production entry and prove:

- null predecessor binds an empty prior prefix/hash/length and sequence one, creates a zero-parent commit from an explicitly empty index, and changes only the exact target;
- a nonempty predecessor whose target is absent requires the same empty-prefix/sequence-one binding; one whose regular target exists proves its old physical blob equals the exact prepared prefix and that the canonical final appended event/change/event-hash/sequence/idempotency fields equal the fourteen-field receipt;
- the independent oracle snapshots the admitted receipt/bytes, reads parent commit/tree, old and new target blobs, new tree and new commit using real pinned Git, computes prefix/tail hashes, framing, canonical event hash and raw preserved bytes without calling the production parser, and matches every exact success field and receipt hash;
- physically creatable parent trees with a target directory, ancestor leaf, descendant leaf, symlink/executable/gitlink target, or old-blob/prefix disagreement never return `OK`;
- a genuine derived index lock and a genuine missing predecessor produce exact `UNAVAILABLE / PROCESS_FAILED / partial_receipt:null`; invalid closed data or byte/hash/length/record/path binding throws the exact pre-effect error; local work/index/unreferenced object residue is permitted and inventoried, while local refs, remote refs, transport-call sentinel, State, Agent, validation, Candidate, PR and Handoff remain unchanged/zero;
- static bounded source evidence proves the private writer creates the builder from fixed local bindings and snapshots/passes only retained receipt/bytes when `prepared.publication` is null. Non-OK stays uncached and the current call forms no push/refspec; a later caller retry may invoke construction again because the slot remains null, but the builder performs no internal retry. After one `OK`, every same-prepared-identity call skips construction and reuses that exact publication. Both preservation hashes enter the complete existing remote receipt. This is wiring evidence, not a dynamic private-factory, credential, SSH, push, ACK, or linearization claim.

The evidence matrix distinguishes three classes. Test-controlled valid physical inputs are empty parent, nonempty parent/path absent, regular existing target, non-target entries and canonical receipt/bytes. Required actual fault executions are derived index lock, nonexistent predecessor/object, physically creatable target/ancestor/descendant/type conflict, old-blob/prefix mismatch, and a real local filesystem obstacle; each runs only after its matching healthy control. Natural pinned Git cannot stably force `signal`, timeout, output overflow, syntactically malformed successful OID/type/commit/`ls-tree` output, duplicate corrupt tree records, or content-addressed objects changing after creation without a forbidden seam. Those branches receive final source-contract review and incidental evidence only, recorded `NOT_DYNAMICALLY_FORCED`, never fabricated PASS or a new waiver. A malformed fixture, pre-entry rejection, Test-authored commit presented as producer output, local bare writer substitute, source evaluation, monkey patch, environment override, public legacy mode, full Ledger export, or remote action is invalid evidence.

### F2 retained contract evidence, not a new interface

F2 adds no production entry and no normative behavior. The bounded `coordinator.test.mjs` group must use actual `createCoordinatorCore`, real `createFileState` temporary files, existing strict four-field Ledger Port behavior, deterministic existing signature verification, and public signed DISPATCH/`status`/`run`; it must not use `createTestCoordinator`, `primeState`, full production composition, fixed socket, or a Test seed.

The group freezes both complete STATUS payload oracles already located at the two current payload consumers: one exact EMPTY pointer result and one exact READY/ACTIVE result. `StatusDiagnosticsV1` has exactly eleven fields: `pointer_status`, `active_change_id`, `macro_state`, `phase`, `state_version`, `state_hash`, `pending_action`, `candidate`, `delivery`, `orphan_ready`, and `local_pause`. The independently read `local_pause`, when nonnull, is the separate exact sixteen-field `LocalPauseDiagnosticV1`; no Evidence-ref field is added to STATUS. The oracle independently recomputes canonical State bytes/hash and verifies exact nullability/projection. Read-only STATUS performs zero State/pause/Ledger append/Worktree/Agent/validation/Candidate/PR/Handoff writes and does not take the mutation mutex.

It also retains and rebinds all six existing `TEST-DTF-R1-002` pointer-first crash-window meanings: missing pointer, corrupt pointer, READY State missing, READY admission event missing, admission readback ambiguous, and pointer/State/Ledger conflict. Each retains Change-B rejection and zero forbidden effects. Test Design must move each fault to the actual existing strict `readRemote`/Ledger-record/readback boundary used by corrected status and run, and replace old incorrect STATUS expectations and old “same dependency exactly twice” wiring assertions with exact request/result observations for that compliant chain. It must not lock the product to the old short `readRemoteAppend({change_id})`, duplicate a read merely to preserve a count, weaken/merge a failure meaning, or manufacture a pause. Only a genuinely persisted `LocalPauseDiagnosticV1` permits a STATUS payload with `pointer_status:'INVALID'`; when no safe diagnostic exists, status returns exact existing `CoordinatorErrorV1` fields `schema_version:'1.0'`, `operation:'status'`, `outcome:'REJECTED'`, `error_code:'WIP_AUTHORITY_INVALID'`, and the existing nullable `change_id`, while Change B remains rejected at the same authority boundary.

The F2 causal RED set additionally proves: strict READY read uses existing complete Ledger signatures rather than a short compatibility call; a fresh Core over the same real State/Ledger cannot run READY without the original signed tuple and stops through the existing authority boundary; exact re-admission of that tuple remains healthy; a real previously persisted diagnostic is projected byte/ID-equivalently after restart; and `createTrustedHostLoop(...).readStatus()` forwards the same real-Core STATUS while launcher/route/artifact/inventory sentinels remain uncalled. A fresh OS child supplies a separate restart evidence level without turning the Port double into production Ledger proof.

F2 production REDs must be failures of those final payload/strict-request/restart assertions on the current real Core, never post-OK result mutation or an invented permissive Port. They may be frozen and run in the same Test stage as F1, but no F2 change is authorized by `TDD_READY-ENTRY`. Only the second TDD_READY may include its minimum `coordinator.mjs` correction.

### Regression, activation and retirement

After final focused F1/F2 GREEN, use the fixed R213 order: module/source health; CLI; complete M2 exactly once; complete Coordinator once including the two payload oracles, six crash windows, old `#56`, PSP/PCRR/revision and first-write protection; Git once; ordinary mode excluding the true-hour leaf; WVEB once; canonical validation and scoped diff. Reuse of R152 K1, R158 K2, the true-hour evidence, and R203 WVEB remains A3 version-bound; the final current full-M2 and affected suites must cover the changed source. If the final diff crosses protected admission/reauthentication/append or process behavior, Controller expands the affected sequence before claiming evidence.

`R216-L01..L05` and the bounded F2 group are permanent regression consumers. The temporary old-body/extracted-body comparison is evidence-only and is not retained as a compatibility implementation, fixture, snapshot, source-rewrite helper, or alternate runtime. Every formal entry/behavior/GREEN run must retain its pre/post filesystem, ref and object inventory, independent physical readbacks, exact source/Test identities, complete inner and outer stdout/stderr, session record, exit/code/signal/timeout disposition, and frozen evidence references. Test Asset Retirement may remove only Test-owned, recoverable scratch roots/locks/objects from non-formal control executions after confirming they are not cited evidence; it must not delete or truncate any formal inventory, log, session, exit record, artifact or freeze binding. This is not a new cleanup Gate or Git-object garbage-collection requirement. A2/S09 privileged leaves remain `USER_WAIVED / NOT_VERIFIED`; ordinary local F1, F2, complete M2, Coordinator, CLI, Git, mode, WVEB and canonical evidence are not waived.
<!-- R216_SPEC_END -->

<!-- R174_STATE_FIRST_WRITE_BEGIN -->
## R174 — original #56 real-file State coverage

This is an additive Test Design obligation for existing `REQ-M2-006 / AC-M2-006-01,02,04,07,08`; it creates no new REQ/AC or parent Test ID and does not reopen `TEST-M2-011 / 011-L08,L09`. The only Test write is necessary imports plus one locally bounded block in existing `tools/harness/change-coordinator/coordinator.test.mjs`. Existing #56, all original 186/5/71 and PCRR assertions, helpers, fixtures, production-delivery tests, registrations, counts, and timeouts remain unchanged; exact new leaf selectors/counts/timeouts are the isolated Test role's responsibility within the finite obligations below.

Preflight SHALL independently prove module-entry health and an owned real temporary canonical absolute filesystem root before treating product behavior as RED. The block imports the same production `createFileState`, never copies/evaluates/rewrites its source, and freezes all suffix assertions before production changes; the isolated Test role owns the exact import form. While the export is absent, only the entry assertion is causal RED and all factory-dependent suffixes are `NOT_REACHED`. The export-only Worker step must leave the factory body byte-identical; after its source Gate, temporary-filesystem health must pass before the real absent/null call is required to fail as `expected OK`, actual `ABSENT`, and target not created. That is the only first-write behavior RED and it precedes the second TDD_READY.

The unchanged frozen block then requires seven behavior groups:

1. absent target plus null expectation creates through the real factory and returns exact existing `OK` bytes/hash/receipt; independent file readback and a fresh factory's `readLocalPause` agree;
2. present target plus null expectation returns `CONFLICT / CAS_CONFLICT`, reports the old-byte SHA-256, and preserves target and non-target sentinel;
3. present target plus wrong non-null hash preserves the same conflict/no-overwrite behavior;
4. present target plus correct non-null hash retains exact replacement/readback behavior;
5. absent target plus non-null hash retains `ABSENT` and creates nothing;
6. a real type or filesystem obstacle that yields non-`ENOENT` remains `UNAVAILABLE`, never absence/success; assertions promise unchanged target only for pre-publication failure, not rollback after rename;
7. a supplementary real-factory connection for existing Coordinator `#56` uses `createCoordinatorCore` plus `makeTestDependencies` and a valid signed `applyControllerCommand` DISPATCH, with only Ledger `PRIOR_TIP_READ` failing and only the real factory's pause methods delegated. It observes unchanged command/body/idempotency identity, exact sixteen diagnostic fields, the public result's existing null `state`/`state_version`/`state_hash` fields, zero Ledger prepare/commit and Worktree effects, and real pause readback. The already-published READY State at the existing State boundary keeps its observed bytes/version/hash and remains diagnostic-bound. That boundary stays the declared Test double in this supplemental connection; only pause-file persistence/readback is real-filesystem proof. Other Ports are explicit doubles; no seed/prime, admission bypass, other-State-method replacement, or READY-State rewrite is allowed.

The block is permanent regression with no retirement candidate. GREEN does not close B1-B5 or prove production Host/credentials/external effects. After it and original #56 pass, the fixed return remains health -> CLI -> full M2 once -> the same Coordinator suite -> Git -> ordinary mode using A3's hour evidence -> WVEB -> canonical -> diff -> Test Asset Retirement -> fresh independent Validator -> M3 -> M4. A2 remains `USER_WAIVED / NOT_VERIFIED` only where already recorded.
<!-- R174_STATE_FIRST_WRITE_END -->

> Current R109 Specification return (2026-09-09): R047/R059/R063 and S21/R085 remain historical authority for unaffected contracts. R104 C1-C3 map only to original `010-L01,L05`, `010-L13`, and `011-L08,L09`. The user-approved R107 C2 object-reader contract is now frozen in the same package. Status is `SPEC_READY / CONTROLLER_GATE_PENDING_R109`; Production and Test remain frozen. A2 is unchanged and does not cover C2.

## 1. Status and Test Authority

- Current status: `SPEC_READY / CONTROLLER_GATE_PENDING_R109`
- Test owner after Spec Gate: fresh `juaner_test`
- Expected evidence: causal RED before any production write, then K1/K2 GREEN, affected regression, canonical offline validation, and Test Asset Retirement PASS
- Live Agent/model/provider/network/GitHub/host/product effects: forbidden

This plan specifies Test Design; it authorizes no Test write. The Test role must first freeze exact file hashes, stable Test IDs/count, commands, runtime, helper-health result, RED frontier, and Worker production paths.

The user-approved `DECISION-M2-REPAIR-EVIDENCE-001` remains frozen in Design 7.3. The user-approved CCR002 producer remains frozen in Design 7.4, and user-approved CCR003 adds only the shared Host launcher and existing Handoff factory reachability in Design 6.4 and 10.3. No Test asset, RED execution, implementation, host activation, or external action is authorized by this plan.

## 2. Evidence Layers

| Layer | Real behavior required | Controlled boundary allowed | Invalid substitute |
|---|---|---|---|
| L1 schema/derivation | public signed DISPATCH admission and exact request/receipt objects | deterministic signature verifier | calling private validators only; source strings as outcome proof |
| L2 Adapter contracts | real files, NUL-safe paths, real temporary Git, purpose-bound stage factory, real Node validation children, canonical Ledger bytes in a local bare remote, and the shared production `createLedgerObjectReader(...).read(...)` over real commit/tree/path/blob objects | test-owned temporary roots and local remote transport; Test supplies only its real repository root, fixed Git executable, and actual runtime uid/gid | constant PASS Git/validation, decoded human patch headers, manual Git outside the public chain, a Test-owned Ledger producer, or a Core-only receipt double presented as production Adapter proof |
| L3 production Core | actual `applyControllerCommand`, `run`, `settlement`, `status` sequence with real State and K1/K2 mechanics | bounded Agent launcher/artifact and GitHub PR boundary substitutes conforming to the production contract | helper-only phase priming as the positive chain; bypassing public methods; replacing Core |
| host/artifact | actual shared launcher input/schema/stdin/PID/error/close/parse/inventory/re-read/settlement on a real temporary root; output-schema-bound Validator transfer; immutable-base/derived repair input; and the section 7.4 proof contract | deterministic offline fixture executable and current-user temporary roots; controlled Agent answer; A2 records only the mapped privileged proof leaves as USER_WAIVED/NOT_VERIFIED | courier-only evidence for launcher duties; host-authored Head/finding; request-derived report fields; repair declaration/status-only PASS; JSONL/final hashes as execution-content identity; fake owner/permission/process results; or ordinary launcher results presented as privileged proof |
| Handoff producer | exported existing `createHandoffGateway(stateRoot)` with real temporary filesystem, canonical bytes, actual target/replacement/readback, same supplied formatted ID, and failure/no-success effects; static source relation confirms reuse of the existing fsync/rename `atomicWrite` | current-user temporary state root | Test writes the Handoff itself; claims runtime observation of an unexposed fsync; constant receipt; missing-ID fallback; composition trust/config injection; mocked filesystem/rename/readback |

The local Ledger boundary must publish/read exact JSONL through a real temporary Git ref and commit/tree/path readback. It may avoid the real network, but it is not an in-memory always-OK receipt double.

## 3. Causal RED Set

The Test role schedules each missing behavior independently. A broad K1/K2 failure does not replace the leaves below.

| RED ID | Missing current behavior | Required current-production failure frontier | Unrelated health required |
|---|---|---|---|
| `RED-M2-001` | exact three-definition admission and six-to-eight derivation | DISPATCH currently accepts placeholder/unknown definitions or Regression sends a scope-only object; assertion fails at admission/first `validation.execute` request | signature, pointer, public method, and accepted WVEB controls pass |
| `RED-M2-002` | two complete Regression receipts and remote Ledger readback | first/second Regression request or receipt/detail is incomplete and cannot reach STAGE | both WVEB definitions independently execute successfully through real child |
| `RED-M2-003` | legal dirty tree, fresh lossless paths, content-bound exact stage | current STAGE rejects dirty Worker output or stages scope rules; failure occurs before an exact Candidate | real Git add/commit/readback helper controls pass |
| `RED-M2-004` | closed Candidate Final Validation branch | `final-validation-candidate` is rejected by the current WORKTREE-only factory or current Coordinator sends `{subject_sha}` | accepted WORKTREE branch remains GREEN |
| `RED-M2-005` | Validator artifact Head/classification, shared Host launcher reachability, and one eligible repair | current host omits artifact structure or the exported shared launcher; the dedicated reachability leaf fails on the absent factory, while launcher-dependent suffixes are `NOT_REACHED` | generic Agent STARTED/RESULT controls, real offline fixture process/file controls, and PSP revision controls pass |
| `RED-M2-006` | complete Ledger union, path evidence, stable PR/Handoff identity, actual production Handoff producer reachability, and shared production Ledger object-reader proof | dedicated real-Git leaves fail only at the actual missing approved behavior: exact `path_raw_stdout` Buffer/`path_byte_length`, Core's independent path-byte consumption, absent Handoff export, or absent `createLedgerObjectReader`; parser/mutation/restart and wrong-tree suffixes that cannot reach a complete healthy prefix are `NOT_REACHED` | independent real-Git raw patch/path byte oracles; a real commit A/tree A/valid Ledger blob and separate existing tree B; Buffer/length/hash/explicit-receipt controls; temporary atomic-file controls; and existing four readback-boundary controls pass |

RED is invalid if caused by syntax error, unavailable Node/Git, bad fixture, malformed test-only remote, source rewrite, arbitrary throw, timeout flake, or assertion against an unapproved field.

CCR003 has exactly two new causal reachability frontiers. Before Worker, one leaf dynamically imports `host-loop.mjs` and fails only because `createHostAgentLauncher` is absent; one leaf dynamically imports `production.mjs` and fails only because `createHandoffGateway` is not exported. The complete ordinary launcher and Handoff producer suffix assertions must already be registered, reviewed, and frozen, but are reported `NOT_REACHED` while their entry is absent. They are not multiplied into causal RED counts. After those entries exist, the same frozen suffixes must execute without Test edits; their result is required GREEN/regression evidence. Original R044 reachable failures and unfinished assets keep their original causal or pending classification and cannot be hidden behind the two reachability REDs.

## 4. Planned Test Assets and IDs

### 4.1 Existing Test files

- `coordinator.test.mjs`: retain every existing TEST-DTF/PCRR assertion; add public-chain definition, receipt, failure, repair, evidence, and no-side-effect leaves.
- `git.integration.test.mjs`: retain existing eleven-method and raw canonical-diff evidence; add literal exact-path stage/readback/content-drift and cumulative changed-path contract leaves.
- `mode-activation.test.mjs`: retain host isolation/route evidence; add the closed shared-launcher reachability and ordinary/Validator actual process path, exact error frontiers, the separately invoked real-hour `012-L06`, and approved repair-Test-only input/proof behavior, rejecting host synthesis and ordinary-role use.
- `fixtures.mjs`: replace only obsolete placeholder validation definitions/short receipts/events with the exact closed M2 forms needed by retained tests. Existing event/state/public constants and unrelated fixtures remain.
- `worktree-validation-execution-boundary.test.mjs`: byte-identical retain. It continues to own WORKTREE/WVEB behavior and its cross-subject rejection cases.

### 4.2 One M2 integration Test

`production-delivery-chain.test.mjs` is one planned permanent integration asset with these stable parent IDs:

| Test ID | Owner |
|---|---|
| `TEST-M2-001` | definition admission and derivation |
| `TEST-M2-002` | Regression receipts and Ledger |
| `TEST-M2-003` | dirty-tree inventory and exact stage |
| `TEST-M2-004` | Candidate commit/readback and K1 |
| `TEST-M2-005` | Candidate Final Validation branch |
| `TEST-M2-006` | Validator artifact and PASS |
| `TEST-M2-007` | one causal repair/new Candidate |
| `TEST-M2-008` | ineligible/second Validator FAIL stops |
| `TEST-M2-009` | canonical diff/changed paths/freeze |
| `TEST-M2-010` | delivery ID, PR, Handoff, AWAITING_CONTROLLER |
| `TEST-M2-011` | Ledger/local-pause/four-boundary failure closure |
| `TEST-M2-012` | concurrency, cancellation, late settlement, forbidden effects |

If the Test role can express the continuous public chain in an existing focused integration file without hiding it among unit helpers, it may return this new path as an unnecessary retirement candidate before writing. It may not split the chain into several new frameworks/files.

## 5. Detailed Coverage

### `TEST-M2-001` — Definition admission and derivation

Positive:

- signed definitions in arbitrary input order admit exactly once each;
- execution order is affected Regression, Retirement, then Candidate final;
- each execution definition preserves signed argv/cwd/environment/timeout/subject and has the expected eight-field canonical hash.

Independent negative/boundary leaves:

- each required ID missing;
- each ID duplicated;
- unknown ID;
- each of three wrong subject values;
- extra/missing/accessor/non-enumerable/symbol definition field;
- invalid argv/cwd/environment/timeout under inherited admission rules;
- array position permutation changes no mapping;
- six-field hash substituted for eight-field hash rejects.

Forbidden effects: every admission rejection proves pointer/State/Ledger/Git/validation/Agent/PR/Handoff counts zero.

### `TEST-M2-002` — Two Regression receipts and Ledger

Positive:

- actual allowed dirty tree yields one exact WorktreeSubject using fresh Head/common-dir/scope;
- a legal physical zero-parent baseline is read at the existing `canonical_root` cwd through the unchanged four-key `readCommit` result with `parent:null`, accurate SHA/tree/branch, and a recomputed unchanged Gateway receipt; a physical nonroot read returns its actual nonzero full 40-hex parent distinct from the commit SHA;
- the real affected-suite child and real Retirement child each return the complete twenty-four-field PASS receipt;
- both snapshots, subjects, scope hashes, output hashes, inner/outer receipts, and remote Ledger records agree;
- first repair iteration uses prior Candidate as Worktree Head.

Negative/failure leaves:

- first receipt non-PASS prevents second child and STAGE;
- second receipt non-PASS prevents STAGE;
- mismatched ID/kind/scope/Head/common-dir/scope/snapshot/receipt hash;
- content mutation between the two children;
- Ledger wrong record bytes/hash/sequence/change/state/subject/idempotency;
- Ledger unavailable versus ambiguous produces local pause versus manual stop, never false durable progress.
- `readCommit` missing/wrong-type/malformed/truncated physical object bytes, command/stderr/permission failure, graph-only zero-parent output, failed `<sha>^`, all-zero parent OID, or self-parent is never converted into `parent:null` or fabricated nonroot success; the existing Gateway failure and zero dependent Candidate effects remain observable. Command observation fixes `cwd` to the existing `canonical_root` request field and proves no `worktree_root` request expansion.

### `TEST-M2-003` — Dirty-tree inventory and exact stage

Positive matrix uses actual files named:

- ordinary modified file;
- added/untracked file;
- deleted tracked file;
- executable/type change when supported by Git;
- `space name.mjs`;
- `unicodé-测试.mjs`;
- names beginning with `:` or containing `*`, `?`, `[`, and `]` as literal filesystem names.

The Test independently observes the exact section 5 command sequence and stdin bytes. For both `stageExact` and `readStaged`, its command observation and independent raw oracle invoke exactly `git diff --cached --raw -z --full-index --no-abbrev --no-renames <head_sha> --`; they require both object IDs in every record to be lowercase full 40-hex, the full zero OID on an absent side, and exact equality with the independently read index blob identity. It also proves raw-byte sort, scope filtering, literal NUL-safe stage arguments, full staged list/hash/tree, WVEB pre-stage record versus index-blob equality, no unstaged/untracked/ignored remainder, and commit content equality. Truncated, malformed, or mismatched OIDs remain negative failures. No `JUANERAI_M2_STAGE_CONTENT_V1` or Coordinator-visible pre/post content hash is expected.

Negative/boundary leaves:

- empty Worker diff;
- dirty index before Regression/STAGE;
- allowed rule with no actual path is not staged;
- actual path outside allowed or inside forbidden scope;
- conflict/unmerged/rename/copy/ignored/unsupported status;
- malformed/absolute/dot/dot-dot/backslash/NUL or invalid UTF-8 path observation through a controlled Adapter contract input, not a requirement that Git create impossible names;
- duplicate or unsorted path receipt;
- same path content replaced between second Regression and stage;
- content changed while staging;
- the same path's index and worktree are synchronously replaced with new content after `stageExact` and before `readStaged`;
- the same replacement after `readStaged` and after the last index observation but before `commit-tree`: prove the explicit tree commit cannot select replacement bytes, then final index/clean readback stops after commit without Candidate event/State;
- post-stage unstaged or untracked remainder;
- staged paths equal but index tree differs;
- index tree equals parent tree.

Every pre-`commit-tree` failure proves zero commit/push/PR/Handoff and no cleanup/rollback mutation. The deliberate final-observation race may create the exact-tree commit before post-commit identity stop; it must prove zero Candidate event/State/push/PR/Handoff and no claim that no commit object exists.

### `TEST-M2-004` — Candidate identity and K1

Positive uses one public `run` from persisted STAGE through real `commit-tree <verified-tree>`, exact message/idempotency trailer, old-parent `update-ref` CAS, and readback, with no intermediate State write/return. It proves parent/tree/message/branch/Head/common-dir/empty-index/clean readback plus complete `CANDIDATE_COMMITTED` remote record and exact State at `FINAL_VALIDATION`.

Negative leaves independently mutate parent, explicit tree argument, message trailer, branch, commit SHA, Worktree Head, common-dir, staged tree, clean/index readback, Candidate event bytes, and Candidate State fields. They separately supply Candidate `parent:null`, all-zero parent, self-parent, zero parent headers, multiple parent headers, and a wrong full-40 parent, and require every Candidate success/event/State/convergence/readback path to reject unless the physical Candidate has exactly one nonzero parent distinct from the Candidate SHA and equal to the exact non-null expected parent. They observe exact argv/stdin and forbid ordinary `git commit`, amend, merge parent, index-derived selection, or non-CAS ref movement. A fresh STAGE entry with unchanged parent and empty index follows Design 5.3 exactly: re-read both Regression receipts, re-prove their common snapshot, perform `stageExact`, require the independent `readStaged` equality, then read the expected parent through the physical-byte `readCommit` contract before `commitCandidate`; a proven root baseline may have `readCommit.parent === null` while `expected_parent` remains that root's full 40-hex SHA. Process termination after physical stage but before `commit-tree` leaves persisted STAGE; restart detects the non-empty index and stops without commit/restage/cleanup. A still-running ambiguous response after `commit-tree` but before ref CAS may leave only an unreachable object and permits one exact-absence continuation; a process restart with unchanged parent/staged index stops because no durable invocation marker exists. After successful ref CAS, only the same still-running invocation retaining independent `expected_tree` may converge after response loss. A restart that sees the moved Head must manual-stop even when parent/tree/message/trailer are internally consistent; a self-consistent commit whose tree differs from the earlier Regression-validated content is the explicit negative. Every restart ambiguity proves zero Candidate event/State/push/PR/Handoff and no cleanup/retry.

### `TEST-M2-005` — Candidate execute branch

Positive:

- exact Candidate subject and final definition run one real Node child against a clean Candidate;
- receipt has exactly 24 fields and the Candidate branch nullability/table;
- zero, nonzero, process-start failure, ordinary signal, timeout, and post-child Candidate mutation use the seven fixed tuples;
- stdout/stderr and receipt hashes use actual raw bytes;
- pre/post Head/tree/branch/common-dir/index/worktree checks are real.

Descriptor/type/combination admission negatives, all `INPUT_INVALID` with no receipt or child:

- Candidate with either Regression definition;
- Worktree with final definition;
- Candidate fields added to Worktree subject;
- Worktree fields omitted from Candidate subject;
- internally unequal Candidate `head_sha` and `candidate_sha`;
- extra/missing/accessor fields.

Well-shaped admitted requests with real pre-observation mismatch return the complete `START_FAILED/null/SUBJECT_MISMATCH` receipt and start no child: observed wrong Candidate SHA/tree/Head, dirty or staged Candidate, wrong observed root/branch/common-dir, escaped/non-contained real execution cwd, or untrustworthy Git readback. Mutation after a valid pre-observation and child attempt returns `INTERRUPTED/null/SUBJECT_MISMATCH` with its mandatory post-observation. These receipt cases are not labeled `INPUT_INVALID`. Accepted WVEB focused suite must remain byte-identical and GREEN.

### `TEST-M2-006` — Validator artifact and PASS

Positive uses the real host child-close and restricted artifact-read path with actual canonical artifact bytes and the exact content-addressed signed output schema. It proves Validator completion reads `parsed.verdict` rather than nonexistent `parsed.status`, host read/hash/shape/forward, Coordinator canonical-byte/hash/schema/binding equality, complete AGENT_RUN and 12-field Validator receipt, only Final/Validator Candidate refs, and advance to branch push. A controlled `completed.status:'PASS'` without those actual bytes is a forbidden substitute.

The CCR003 reachability leaf first proves the missing exported `createHostAgentLauncher` is the only new interface RED. Its already-frozen suffix then constructs the production factory with a newly created current-user temporary root and a real local prepare function, and routes an offline deterministic executable through the actual shared implementation. It independently captures the exact schema argv, cwd, fixed environment and raw stdin `brief || two LF || base/effective input`; records the actual positive PID; waits for actual error/close; verifies complete output bytes, ordinary `parsed.status` and Validator `parsed.verdict` branches, Git inventory, Host Loop second artifact/inventory readback, and settlement. It also proves exact root/correlation/output containment before spawn; after preparation, the exact output entry's two legal states (ENOENT under the same physical root, or existing regular non-symlink with exact realpath/parent); rejection before child of a preexisting symlink/non-regular/escaped-parent entry; and after close before parse the repeated artifact realpath, physical parent, regular-file kind, and subsequent same-path Host Loop re-read/hash agreement. It makes no external-writer exclusion claim. Construction `INPUT_INVALID/no settlement`, per-call `START_FAILED/SPAWN_REJECTED`, ordinary post-STARTED artifact `RESULT_UNREADABLE`, ordinary signal/deadline `AGENT_EXITED`, and repair-specific post-STARTED signal/deadline `RESULT_UNREADABLE` are distinct assertions.

Negative leaves cover missing/extra/noncanonical artifact fields, wrong artifact hash, wrong schema hash, wrong change/Candidate/validator Head, status/verdict mismatch, PASS with findings, FAIL without findings, malformed arrays, duplicate IDs, invalid classification, missing evidence/AC/path binding, and host-modified/defaulted note arrays. Each stops before push.

### `TEST-M2-007` — One causal repair

The approved portion uses a valid attempt-zero Validator FAIL containing multiple sorted `IMPLEMENTATION_IN_SCOPE` findings within signed paths. It will prove the exact remote RESULT/adjacent receipt source, fixed tip refs, full findings, current Change/Candidate/tree/cycle/attempt and scope hash; independently canonicalize the actual derived bytes, padded base64, length/hash, and framed effective stdin while proving the signed Test base bytes/hash stay identical and no artifact-root file is published.

The normative causal positive uses the real purpose-bound Host operation, actual temporary Candidate Git objects, actual final Test bytes, the configured test Node and fixed `/usr/bin/sandbox-exec`. Under A2, only its privileged fixed-root/runtime-uid/profile execution and dependent repair K2 positive are recorded `USER_WAIVED / NOT_VERIFIED`; they are not current TDD_READY blockers and must not be replaced by the ordinary shared-launcher evidence. Each leaf below keeps that split rather than treating the whole positive as currently runnable:

- **Runnable contract/negative evidence:** exact complete Agent plan bytes are preserved as plan only; an Agent-authored result branch, PASS string, JSONL, TAP declaration, or post-close hash cannot settle. Closed schema, eligibility, budget, wrong-binding, failure, and local process/file negatives remain mandatory where they do not require the waived identity.
- **Normative, A2-mapped positive:** the Host independently materializes every regular Candidate blob plus the captured final Test overlay, recomputes Git/Test/content identities, seals the privileged root, and runs exactly RED then control for every finding in separate real scratch directories. The privileged fixed-root/runtime-uid/profile leaf is `USER_WAIVED / NOT_VERIFIED`, not runnable PASS evidence.
- **Normative, A2-mapped positive:** actual RED exits 1 for the exact selected assertion ID and actual control exits 0 for its exact selected ID; the Host artifact carries exact argv, PID, cwd/env, executable/profile identities, content hash, stdout/stderr bytes/hashes, and exit tuple. The actual privileged execution leaf remains `USER_WAIVED / NOT_VERIFIED`.
- **Normative, A2-mapped positive and dependent repair K2:** the Host publishes a distinct proof artifact below the protected non-runtime-writable result root only after proof children close and real temporary cleanup/absence readback; compatible repair RESULT summary, AGENT_RUN, adjacent receipt, proof-bound Worker request/delivery, matching Regression/STAGE snapshot, new Candidate, and Handoff follow only in that order. The exact protected-proof positive and its dependent repair K2 suffix remain `USER_WAIVED / NOT_VERIFIED`; their contracts and runnable non-privileged negatives remain required.

Unprivileged local probes may establish only the runnable negatives: real `lstat`/mode/owner reads reject an invalid current-user substitute for required root ownership, and available real sandbox children reject forbidden reads/writes/process/network where they do not require the waived identity. They do not make the privileged proof PASS. No privileged environment, install, provider, network, production host, fake owner/permission/Core/filesystem result, or renewed VM prerequisite is introduced by this Change. M3 may repeat root/path/profile checks only under separate deployment authority; it does not retroactively replace or erase A2.

Independent forbidden-history leaves first make old Agent logs appear valid, then require the new proof:

1. Test A executes and emits old valid-looking logs, then final Test B replaces A. If B's mapped RED/control does not meet the contract, Host rerun over captured B fails and the old A history cannot pass. If B does meet it, only the newly generated B-bound proof may pass. Replacing B after proof makes the proof-bound Worker pre/post check or post-Worker-snapshot-to-Regression comparison fail before Candidate.
2. Production is modified for an Agent execution and restored. The old logs cannot pass; Host execution uses only the independently materialized immutable Candidate tree. A Candidate-bound RED/control mismatch fails, while a pass is attributable only to the new Candidate-bound execution, not detection of the earlier history.

Further negatives cover wrong/missing/extra finding mapping, duplicate IDs, inventory/path/bytes/hash drift, symlink/submodule/escaping path, blob identity, seal mode/owner/readback, executable/runtime-root/profile hash, inherited env, dependency escape, process/network/write escape, malformed/truncated/overflow TAP or outputs, syntax/import/hook error, wrong exit/signal, timeout/SIGTERM/late close, cleanup failure, half artifact, wrong proof path/hash/receipt/binding, restart, and late/wrong-State settlement. Static path/capability failure before STARTED proves `START_FAILED/ROUTE_UNAVAILABLE`; every dynamic proof failure after STARTED proves `INTERRUPTED/RESULT_UNREADABLE`. Every leaf proves budget remains consumed after transition, no Worker, no repair retry/resume, no proof RESULT/receipt/Handoff, and correct failure-evidence versus local-pause behavior.

### `TEST-M2-008` — Ineligible and second Validator failures

Independent pre-consumption leaves cover every classification enum other than `IMPLEMENTATION_IN_SCOPE`, mixed classifications, out-of-scope path, missing requirement/AC/evidence, wrong Head, unknown classification, wrong/nonadjacent remote pair, and noncanonical derived bytes; they prove no budget use and no Test/Worker. Eligible repair proves exact source/derived readback precedes `0 -> 1`, the deterministic request uses the post-transition State version, and REQUESTED/Pending/Action follow once. Post-consumption proof/start/restart/late/substitution failures prove budget stays one, no retry/resume or Worker, durable failure/BLOCKED Ledger plus State only when all normal readbacks succeed, and prior phase plus local pause when Ledger authority is unavailable. Attempt-one Validator FAIL retains exact `VALIDATOR_SECOND_FAIL / REVISION` and no reset on new Agent/run/RESUME/RELEASE/restart.

### `TEST-M2-009` — Diff paths, push, and freeze

Positive independently captures both real Git stdout byte streams. It retains the existing `raw_stdout` Buffer assertions in `git.integration.test.mjs` and proves `path_raw_stdout` is the exact NUL stdout Buffer; each declared length and full hash is recomputed from the corresponding raw bytes. It independently constructs the specified fresh seven-key receipt value with only the two already-qualified Buffer copies encoded to canonical padded base64, then recomputes `receipt_sha256` without Buffer `toJSON`, getters, or coercion. It parses the path Buffer only as complete A/M/D/T NUL status/path pairs, applies exact UTF-8/path rules, sorts uniquely by raw UTF-8 bytes, and proves element-for-element equality with `changed_paths`. A direct healthy empty-diff observation proves two empty Buffers, zero lengths, both SHA-256(empty) values, and `changed_paths:[]` without weakening the later nonzero Candidate/publication invariant. First Candidate increment equals cumulative baseline diff; repair Candidate demonstrates parent increment differs from baseline cumulative paths. Push/readback and local/remote/Validator equality precede freeze.

Consumer mutations independently alter each raw Buffer/byte, declared length, full hash, explicit receipt preimage/result, producer version/executable/environment/argv/common-dir, path argv, status token, NUL framing/truncation, UTF-8/path bytes, duplicate record, and returned path set/order/type while recomputing only the wrapper hash that is not the targeted authority. The frozen suffix includes an arbitrary nonzero wrong path hash; a zero-only check is not sufficient once that target is reachable. Further negatives cover baseline/Candidate/tree/Head, remote predecessor, force/delete indication, and post-freeze Worktree write attempt. Each reached first failure authorizes no PR/Handoff or later effect.

### `TEST-M2-010` — Delivery, PR, and Handoff

Positive proves exactly two cumulative canonicalDiff observations: Freeze first and Handoff only after PR readback. Each independently satisfies TEST-009's complete byte/hash/path contract. In one uninterrupted process the Test observer compares the two Gateway completion values field-for-field while also proving production Core adds no cache or new authority. In a fresh-Core restart between Freeze and Handoff, the Test discards all process-local observations, reloads only existing State/Ledger/Git authority, reruns the fixed producer on the same immutable baseline/Candidate, requires the second raw hash to equal stored `delivery.canonical_diff_sha256`, independently recomputes the unchanged delivery preimage from the second `changed_paths`, and requires the resulting full delivery ID to equal the persisted pre-PR `delivery_id`, which is also used unchanged as idempotency identity. The Test explicitly does not assert that old path bytes/hash/receipt were durably stored. It then observes the same idempotency on PR and Handoff, performs one PR create-or-reuse/readback through the controlled boundary, reads exact remote Ledger bytes, selects all required attempt evidence, writes/reads exact Handoff bytes, appends/reads HANDOFF_READY, and reaches AWAITING_CONTROLLER.

For R104 C1, original `010-L01,L05` restarts with no accepted-dispatch memory at post-Freeze `DELIVERING / PR`, calls unchanged `applyControllerCommand` with the original complete signed DISPATCH, and observes `ALREADY_APPLIED` over the unchanged current macro-state/version/hash with original DISPATCH idempotency and body-byte SHA as `original_receipt_sha256`. It proves byte-for-byte zero pointer/State/Ledger/local-pause/Git/PR/Handoff/Agent change, then uses later `run` to reach PR/HANDOFF. The same test independently reads and fixes one fresh real Ledger tip/tree/path/byte stream, without populating `State.evidence.remote_tip`, and proves its last complete DISPATCH-or-REVISION record exactly owns current authorization-cycle provenance; a matching arbitrary marker or later conflicting cycle fails. Mutations cover expired material, wrong signature/key/body/nonce/idempotency, wrong State admission/repository/scope/phase/cycle, missing/ambiguous/conflicting Ledger records, hash-only material, and any pre-existing local pause. Each returns the specified pre-effect error with zero effects; local-pause bytes remain identical and later `run` cannot bypass it. A second fresh restart at `DELIVERING / HANDOFF` is covered without adding another recovery rule.

For R104 C2, original `010-L13` keeps two explicitly different proofs. Its Core-owned matrix continues to use the Test-owned Ledger double only for receipt/path/base64/byte/slice/hash/ref/current-delivery rejection. Its production-Adapter negative dynamically imports the approved `createLedgerObjectReader({repositoryRoot,gitExecutable,runtime_uid,runtime_gid})`, uses the returned frozen `{read}` object, and supplies exactly `{remote_ref,expected_tip,tip,tip_tree,change_id}`. The Test creates a real commit A whose physical commit bytes name tree A and whose `ledger/<change_id>.jsonl` is a valid non-empty blob; it separately creates an existing tree B unequal to A, independently reads commit A/tree A/path/blob bytes as its oracle, and passes `tip_tree:B`. The shared production reader must run only `cat-file -t` and physical `cat-file commit` for this wrong-tree negative, then immediately return the existing `GatewayResultV1<LedgerRemoteReadReceiptV2>` `CONFLICT / READBACK_MISMATCH` with `observed_identity:treeA`; it must not run `ls-tree` or `cat-file blob`. A separate positive executes the complete fixed four-command sequence and verifies the path/blob receipt. The same refusal is forwarded at the controlled Test-owned remote-observation boundary into Core; the original State remains unchanged, with no Handoff, `HANDOFF_READY`, successful State/delivery progress, or repeated PR. The Test must observe and verify any permitted existing persisted manual-diagnostic change rather than require all local-pause bytes to remain unchanged. This leaf is the causal `RED-M2-006` interface frontier while the export is absent; its complete wrong-tree suffix is frozen and `NOT_REACHED`, then must execute unchanged after implementation. Successfully read malformed commit/tree/path/blob or Ledger framing is `CONFLICT / READBACK_MISMATCH`; subprocess start/error/nonzero/signal/stderr/timeout/output overflow, missing object, or permission failure is `UNAVAILABLE / PROCESS_FAILED` with exactly `partial_receipt:null` and cannot infer path absence, root parent, or conflict. Null `tip`/`tip_tree` is tested separately as zero-Git `OK/file_present:false`; a physically absent path is `OK/file_present:false`; an existing empty blob is `CONFLICT`, not absent. The frozen Test evidence also dynamically proves the real shared reader behavior and statically verifies that private production `readRemote` and `readRemoteAppend` call that same reader only after the unchanged credential/authority checks; this static wiring evidence is not an actual privileged/remote full-factory run, leaves that execution unverified, adds no A2 waiver, and does not change M3 authority. Test must not replace this with a Core double, source scan alone, privileged credential path, real remote, full private Ledger factory export, parser/spawn injection, or new deadline mechanism.

The CCR003 producer reachability leaf dynamically proves the existing factory export is absent before Worker; producer-dependent suffixes remain `NOT_REACHED` at that point. The frozen suffix later calls the exported existing `createHandoffGateway` with a real new temporary state root, independently computes canonical Handoff bytes and full SHA-256, observes the exact `<root>/changes/<change_id>/handoff.json` target, actual target creation/replacement bytes and reread equality, and the exact same `delivery-[0-9a-f]{64}` delivery/idempotency ID in the result. A separate static source check confirms that this exported factory still calls the one existing `atomicWrite` implementation containing file fsync, rename, directory fsync, and reread; because no filesystem seam is added, the dynamic Test does not claim direct observation or fault injection of each internal fsync. Gateway negatives cover only its minimum boundary ownership: invalid/noncanonical JSON bytes, missing/unsafe Change ID, missing/unequal/malformed delivery/idempotency ID, wrong full hash, unsafe target containment, actual filesystem failure available from the real temporary root, and final byte mismatch where naturally reproducible. Full `HandoffV1`, Ledger, Candidate, PR, evidence, and note-array invalidity is tested at Core before the gateway call. Every failure proves no gateway success/HANDOFF_READY/State progress. The Test does not write the file itself or inject filesystem behavior.

Negative leaves cover:

- missing PR idempotency or changed ID on retry;
- multiple PRs, wrong base/branch/Head/review-ready state;
- delivery ID derived from PR/Handoff/hash/time or replaced after response loss;
- a third canonicalDiff call, Handoff before PR readback, second-observation raw hash mismatch, changed path list producing a different persisted delivery ID, changed producer/request/object identity after restart, or reliance on retained process memory;
- missing/duplicate/conflicting/cross-cycle/stale receipt;
- missing or mismatched Agent-result/receipt event-ref pair for Test, Worker, or Validator evidence;
- repair Test binding whose derived source refs do not resolve to the attempt-zero failed Validator pair;
- same fixed validation ID in another authorization cycle selected as current;
- same subject with two non-identical records for one attempt/role slot;
- role RESULT followed by the wrong receipt event, a non-adjacent receipt, or no role receipt;
- prior-cycle or attempt-zero FAIL selected as the final PASS;
- Regression receipt inserted into Candidate refs;
- wrong Ledger tip/tree/path/offset/record hash;
- `prior_bytes_base64` accepted in place of canonical `ledger_bytes_base64`;
- default empty changed paths, risks, unverified, open questions, or Ledger refs;
- wrong diff contract ID;
- Handoff containing future HANDOFF_READY/self-reference;
- Handoff bytes/hash/delivery mismatch;
- State entering AWAITING_CONTROLLER before all readbacks.

S21 Test retirement/rebinding is limited to directly affected original009 assertions and their minimum existing helper/oracle code in `tools/harness/change-coordinator/git.integration.test.mjs`, plus directly affected original009/010 registrations and minimum existing helper/oracle code in `tools/harness/change-coordinator/production-delivery-chain.test.mjs`; no other Test path is authorized. Retain the accepted `Buffer.isBuffer(raw_stdout)` and raw-byte SHA assertions, add the same exact path-Buffer/length/full-hash and explicit byte-normalized receipt checks, and amend only assertions made inaccurate by the new path fields/consumer. Do not retain a compatibility duplicate, renumber unrelated leaves, weaken `009-L10`'s `EVIDENCE_CONFLICT`/two reads/zero Handoff or `010-L01`'s actual PR/Handoff ambiguity mapping, or add a parser seam. Preserve every unaffected assertion byte-for-byte where practicable.

The isolated Test return first freezes both Test preimages/hashes/counts/IDs, every downstream suffix, and independent real-Git byte/oracle health. Its pre-Worker causal RED must fail at the actual missing result interface or Core behavior with production frozen. A suffix is reported `NOT_REACHED` whenever the current result cannot provide a complete healthy prefix; Test must not forge a supposedly healthy producer to call that suffix causal. The arbitrary nonzero path-hash mutation is causal only if the real healthy producer/result and every earlier Core check are demonstrably reached before that mutation; otherwise it remains frozen `NOT_REACHED` until Worker, when the same assertion becomes required GREEN evidence. Controller Readiness/rebind is required before original Worker009 resumes. R082 and earlier PASS/FAIL remain bound to their old Test/production identities and are not promoted.

### `TEST-M2-011` — Failure evidence and four boundaries

For branch push, Ledger append, and final PR/Handoff boundaries, prove exact success convergence, exact absence one same-identity continuation, ambiguity/conflict exhaustion, and no later gateway replay. For Candidate commit, success/absence convergence is legal only in the same uninterrupted invocation retaining independent `expected_tree`; restart after surviving stage or a moved Head manual-stops and never derives identity from the observed object. Also prove a normal validation/identity failure is not granted recovery.

For one failure at each K1/K2 phase, run two variants:

1. Ledger available: failure event, BLOCKED event, BLOCKED State and returned event identity all read back;
2. Ledger unavailable: prior State remains, exact local pause is read back, no BLOCKED event/macro-state or phase progress is claimed.

Also exercise original `011-L08,L09`: after a Regression failure receipt and `BLOCKED` event with business disposition `REGRESSION_FAILURE / REVISION` are remotely durable, force the following State CAS/write-readback to fail. Assert the public result and exact existing diagnostic are `POINTER_STATE_CONFLICT / MANUAL_CONTROLLER_STOP`; the diagnostic operation/request hash binds the original public `run`, its event fields bind the real commit tip/event ID/event hash, and its State fields bind the original version/hash. Never use `STATE_WRITE_FAILED` or claim BLOCKED State success. Independently fail local-pause write and readback and require existing unpersisted BLOCKED transport with `local_pause_id:null`. Later `run`, fresh restart, and C1 reauthentication must not retry/clear/bypass, duplicate an event, begin REVISION/Agent work, or cause Candidate/delivery effects.

### `TEST-M2-012` — Concurrency, timeout, cancellation, and forbidden effects

- concurrent public mutators: one current mutex/CAS winner; all others busy/conflict, zero effects;
- mutex released while waiting Agent, retained during the sequential Regression operation and same-call stage-to-commit fence, without claiming an absolute wall-clock bound;
- first Regression failure starts no second child;
- signed validation timeout proves only one SIGKILL trigger followed by close/post-observation; Git/filesystem observation has no approved absolute deadline;
- the existing host one-hour deadline is shared by the Agent and sequential repair proof children; timeout proves one SIGTERM request to the current child, not guaranteed completion, and adds no new timeout value, escalation, retry, or recovery boundary;
- START_FAILED, INTERRUPTED, wrong child/correlation/Head/state/schema, and late RESULT cannot advance;
- partial index/commit/push/Ledger/PR/Handoff acknowledgements are not visible authority;
- after freeze, code/Git writes reject while permitted current-Change evidence/delivery writes remain;
- no queue/daemon/second lock/state/event/gateway/recovery mechanism appears;
- no product, project-control, provider, network, real GitHub, host install, main write, archive, RELEASE, or Desktop effect occurs.

`012-L06` is a separate long-running offline leaf, not part of the ordinary focused command. It uses the shared factory and a deterministic fixture executable that records actual SIGTERM receipt in an OS-temporary file, remains alive until the real product deadline, handles SIGTERM, and may then exit zero with `close(code:0,signal:null)`. The assertion uses monotonic elapsed time and requires at least 3,600,000 ms before the recorded signal, exactly one recorded SIGTERM, no early RESULT, settlement only after the real close, and exact existing `INTERRUPTED / AGENT_EXITED`. A valid-looking artifact and zero exit after `deadline_fired` must not reach ordinary RESULT/PASS. It does not patch clocks/timers, shorten the constant, call the timeout callback, or infer behavior from source. The Test runner has no shorter product timeout. If a bounded external watchdog/operator cleanup is needed because the fixture fails to close, the leaf is terminated for resource safety and recorded `NOT_VERIFIED`, never PASS or product timeout evidence.

## 6. REQ/AC Coverage Matrix

| Requirement / ACs | Primary Tests | Evidence classes |
|---|---|---|
| `REQ-M2-001 / AC-M2-001-01..05` | 001, 002 | positive, admission negatives, derivation/hash, zero effect |
| `REQ-M2-002 / AC-M2-002-01..07` | 002, 003, 004 | real dirty tree/Git, path/content races, Candidate boundary |
| `REQ-M2-003 / AC-M2-003-01..05` | 005, 006 | WORKTREE retention, Candidate branch, tuple/nullability, refs |
| `REQ-M2-004 / AC-M2-004-01..07` | 006, 007, 008 | artifact/schema/Head; approved derived bytes; sealed-content Host proof; pre/post-budget stops; second failure |
| `REQ-M2-005 / AC-M2-005-01..08` | 002, 004, 006, 007, 009, 010 | seven events, receipt union, remote bytes, diff/PR/Handoff |
| `REQ-M2-006 / AC-M2-006-01..08` | 008, 011, 012 | durable block vs pause, recovery, concurrency, offline boundary |

Each primary Test must contain independent positive, negative/boundary, failure, and forbidden-side-effect leaves where applicable. The Test role records any not-applicable quadrant with a concrete reason; it may not leave a blank mapping.

## 7. Test Asset Lifecycle Ledger

| Asset | Pre-Test class | Current consumer / change | Planned final disposition |
|---|---|---|---|
| `coordinator.test.mjs` existing TEST-DTF/PCRR leaves | permanent regression | Foundation public lifecycle/revision/recovery | retain all; amend only assertions directly superseded by approved M2 contract, preserving IDs and evidence purpose |
| `git.integration.test.mjs` existing leaves | permanent regression | eleven Git methods and canonical raw diff | retain; add exact stage/path leaves |
| `mode-activation.test.mjs` existing leaves | permanent regression | host trust/route/isolation | retain; add Validator courier, repair-input framing, and actual fixed-profile Host proof isolation/preflight; forbid any general/direct Host Test route outside repair |
| `worktree-validation-execution-boundary.test.mjs` | permanent regression | accepted WVEB L1/L2 WORKTREE contract | byte-identical retain; no body/ID/helper change |
| `fixtures.mjs` valid baseline fixtures, including `ledgerDefault` | permanent helper | retained Coordinator tests; `ledgerDefault` only: existing Foundation/Reduced V1 four-method no-bytes controls and `TEST-DTF-R1-011` queue isolation | retain; replace only placeholder six-definition/short-receipt/event builders with exact closed forms; retain `ledgerDefault` only for those named existing consumers |
| other old placeholder one-definition and short receipt fixture forms, including the global validation short-success default | retirement candidate | no valid post-M2 consumer | replace with named exact builders; the isolated Test role must remove the global validation short-success default; no compatibility fixture retained unless a negative Test owns it locally |
| `production-delivery-chain.test.mjs` | planned permanent regression | continuous K1/K2 public chain | add only if required by Test preflight; otherwise record as not-created |
| local bare remotes/worktrees/artifacts/host children | temporary evidence | runtime setup only | OS temp only; remove in cleanup; never track/trace as permanent assets |
| new fixture framework, snapshot corpus, source-rewrite helper, mock Core | forbidden | none | do not create |

The retained `ledgerDefault` proves only call ordering, failure propagation, and local control for its named component consumers. It does not prove real Git objects, Ledger bytes, remote persistence, or the complete M2/K2 chain; no new consumer may be added, and the double may not replace real M2 gateway evidence. Other obsolete short-receipt forms remain retirement candidates.

There is no planned deletion of an existing behavior Test. A superseded assertion changes only where the old placeholder conflicts with the adopted contract, and its successor Test/AC must be named in the final ledger. Passing, age, or count is not retirement evidence.

## 8. Planned Commands

From the frozen Test/production tree, using the repository's configured Node and pinned Git without downloads:

```text
node --check tools/harness/change-coordinator/coordinator.mjs
node --check tools/harness/change-coordinator/production.mjs
node --check tools/harness/change-coordinator/adapters.mjs
node --check tools/harness/change-coordinator/host-loop.mjs
node --check tools/harness/change-coordinator/production-delivery-chain.test.mjs

node --test --test-name-pattern='RED-M2-' tools/harness/change-coordinator/production-delivery-chain.test.mjs
node --test --test-name-pattern='TEST-M2-00[1-4]' tools/harness/change-coordinator/production-delivery-chain.test.mjs
node --test --test-name-pattern='TEST-M2-00[5-9]|TEST-M2-01[0-2]' tools/harness/change-coordinator/production-delivery-chain.test.mjs
node --test --test-concurrency=1 --test-name-pattern='TEST-M2-012 / 012-L06:' tools/harness/change-coordinator/mode-activation.test.mjs
node --test tools/harness/change-coordinator/production-delivery-chain.test.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
node --test tools/harness/change-coordinator/git.integration.test.mjs
node --test --test-skip-pattern='^TEST-M2-012 / 012-L06:' tools/harness/change-coordinator/mode-activation.test.mjs
node --test tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
tools/harness/validation/run

git diff --check -- openspec/changes/change-coordinator-production-delivery-chain tools/harness/change-coordinator/coordinator.mjs tools/harness/change-coordinator/production.mjs tools/harness/change-coordinator/adapters.mjs tools/harness/change-coordinator/host-loop.mjs tools/harness/change-coordinator/coordinator.test.mjs tools/harness/change-coordinator/git.integration.test.mjs tools/harness/change-coordinator/mode-activation.test.mjs tools/harness/change-coordinator/fixtures.mjs tools/harness/change-coordinator/production-delivery-chain.test.mjs
```

If the new integration Test is not created, omit only its `node --check` and direct invocations and record the retained file/Test IDs that own the same continuous public chain. The ordinary affected `mode-activation.test.mjs` command uses Node's existing explicit exclusion filter shown above, so it runs every mode leaf except `012-L06`; an excluded long leaf is recorded `NOT_RUN_IN_THIS_COMMAND`, never PASS or skip evidence. The independent positive-name command runs only `012-L06`. Its exact output, elapsed time, signal/close evidence, and result are then merged with the ordinary mode output in the frozen evidence index; together they are the complete mode-activation evidence. The full M2 integration command does not own the mode file, and canonical `tools/harness/validation/run` does not invoke change-coordinator tests; neither silently reruns or substitutes for the long leaf. No production switch, Test-only product flag, new file, or shortened timeout is added. Canonical validation remains mandatory and its expected real-provider skip is not a failure.

## 9. Gate Sequence

0. The R107 C2 production-Ledger Test-access contract is user approved and frozen in this R109 package. Controller performs complete correctness and mandatory ponytail review of all seven files and either records Spec Gate PASS or returns one bounded revision. Until that PASS, no Test or downstream step is authorized; C1/C2/C3 text does not independently advance the Gate.
1. Test preflight freezes assets/IDs/hash/count/commands; proves helper, offline fixture executable, Node, pinned Git, current-user temporary roots, local bare remote, and retained WVEB health; and records A2's exact waived leaves separately. No privileged environment, install, fallback, provider, or production Host is a current prerequisite.
2. Execute and explain all reachable independent causal REDs with production frozen. For CCR003, only the absent Host factory and absent Handoff export are causal RED; for C2, absence of the approved object-reader export is the interface part of existing `RED-M2-006`. All frozen dependent suffixes, including `010-L13` wrong-tree refusal, are explicitly `NOT_REACHED` until their entry exists. Original finite R044 assets, controls, failures, and not-reached leaves retain their separate dispositions.
3. Controller validates RED causality, path scope, complete prewritten suffix assertions, Test Asset Readiness, A2 mapping, and the exact Worker write set. TDD_READY is non-circular only when the missing reachability is causal, every factory-independent control is healthy, and no Test edit is deferred until after production exposure.
4. Only TDD_READY permits one Worker to change the four production files.
5. Run K1 focused GREEN, every newly reachable shared-launcher and Handoff suffix, the separate true-hour `012-L06`, K2 focused GREEN for all runnable leaves, full M2, affected baseline suites, and canonical validation. A2-mapped privileged proof/K2 leaves remain `USER_WAIVED / NOT_VERIFIED`, not PASS; M3 evidence does not relabel them.
6. Reconcile the complete Test diff with this ledger; run complete-diff ponytail review; remove tracked temporary/unowned/duplicate assets; rerun affected commands.
7. Controller records Test Asset Retirement PASS before freezing implementation/evidence for independent Validator.

No Test result closes B1-B5 by file count or role declaration. Only the mapped real frontiers and evidence readbacks can close their corresponding acceptance points.
