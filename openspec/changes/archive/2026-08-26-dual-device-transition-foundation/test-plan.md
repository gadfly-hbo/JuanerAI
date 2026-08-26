# Test Plan: Dual-device Transition Foundation — Reduced V1

## Status and Isolation

- Status: planned only; no Test asset is released or run by this Spec package.
- Current verdict: `FINAL_HARD_SAFETY_CORRECTION_READY_FOR_CONTROLLER_READBACK`, not Spec Gate PASS.
- Historical 223/223 Coordinator, 8/8 CLI, and 26/26 Git results belong to the rejected old contract and are not RED, GREEN, Regression, or Validator evidence for reduced V1.
- Test owner after a future Spec Gate PASS: fresh `juaner_test`.
- Production remains frozen during Test Design and RED.
- Boundaries: deterministic doubles and OS temporary local Git/bare remotes only; no live origin/GitHub, real Agent/model/provider, SSH, project-control, host trust, product data, or network.
- Toolchain/dependencies: current repository Node, `node:test`, Git, and standard library only; no install or dependency change.

## Preflight and Causal RED

Before scheduling RED, Test SHALL independently prove:

- canonical JSON, hash, verifier, clock, and ID helpers are healthy;
- initialized pointer/state fixtures detect missing/corrupt/conflicting WIP rather than infer empty;
- the process-mutex double serializes one operation and releases while waiting;
- temporary repositories/bare remotes, exact path staging, index-tree/commit/readback, canonical diff raw bytes, and bounded teardown are healthy;
- Agent settlement, Ledger, validation, PR, Handoff, and RELEASE doubles preserve identity and expose forbidden-call logs;
- no helper imports or setup touches production, live host paths, current repo Git state, or external services.

RED is valid only when a named reduced-V1 AC fails causally because production lacks or violates that behavior while helper health and unrelated baseline checks remain healthy. Import absence, stale old Test assertions, or an intentionally broken fixture is not sufficient.

## Planned Test Identities

| Test ID | Primary contract | REQ coverage |
|---|---|---|
| `TEST-DTF-R1-001` | exact four-interface surface, signed command canonical body/verifier, stable errors | REQ-001 |
| `TEST-DTF-R1-002` | `active_change_id`, six states/phases, state version/hash, one process mutex, read-only status | REQ-001,002 |
| `TEST-DTF-R1-003` | automatic normal path and fresh formal Agent request/settlement stages | REQ-002 |
| `TEST-DTF-R1-004` | signed REVISION/RESUME and one-per-cycle Validator repair with causal RED | REQ-003 |
| `TEST-DTF-R1-005` | seven-class append-only Ledger, Agent/Controller/validation details, honest Ledger failure | REQ-002,005 |
| `TEST-DTF-R1-006` | exact scope/stage/index-tree/Candidate commit/final validation | REQ-004 |
| `TEST-DTF-R1-007` | fresh Validator identity, branch push/readback, Candidate freeze | REQ-003,004 |
| `TEST-DTF-R1-008` | canonical Git diff bytes/hash, PR create-or-reuse/readback, fixed-reference Handoff | REQ-004 |
| `TEST-DTF-R1-009` | four explicit recovery boundaries and all other ambiguity-to-BLOCKED paths | REQ-005 |
| `TEST-DTF-R1-010` | signed RELEASE, ff-only main sync/readback, CLOSED/pointer-clear idempotence | REQ-006 |
| `TEST-DTF-R1-011` | exact CLI/gateway composition, Git method budget, no raw/forbidden operations | REQ-001,004,006,007 |
| `TEST-DTF-R1-012` | inactivity/scope/forbidden effects, Test Asset Retirement, Activation stop line | REQ-005,007 |

## Required Coverage Matrix

Every row below requires independent positive, negative, boundary, failure, and forbidden-effect leaves where applicable. Broad end-to-end titles do not replace the named mutations.

### Authority, WIP, surface, and mutex

- **Positive:** exact four interfaces; canonical complete-body DISPATCH verification; valid empty pointer; exact active-slot publication/readback before READY/event writes; exact complete-admission replay; one caller acquires mutex; `status` returns pointer/state/version/hash without writes.
- **Negative:** missing/extra/noncanonical command fields; body/signature/key/repository/Change/scope/worktree/state/version/hash/nonce/time/idempotency/receipt/evidence mismatch; public-key injection through every forbidden source; extra public/interface/CLI command.
- **Boundary:** crash before slot publication; pointer write/readback loss; pointer reserved before READY; READY before admission event; admission-event readback ambiguity; complete same-Change admission vs every conflicting Change B DISPATCH; state version/hash at zero/current/stale; mutex held across exactly one bounded effect/readback/persist and released before Agent/Controller wait.
- **Failure:** verifier unavailable, atomic pointer/state/event readback mismatch, incomplete admission status/run, competing mutating calls, exact replay after time expiry vs replay identity with different bytes.
- **Forbidden effect:** no Worktree/Agent/Git/Ledger/PR/Handoff/state change after rejected command or busy mutex; no second lock or WIP enumeration.

### Six-state automatic path and Agent stages

- **Positive:** DISPATCH -> READY/WORKTREE -> EXECUTING/SPEC/TEST_RED/WORKER_GREEN/REGRESSION -> DELIVERING phases -> AWAITING_CONTROLLER; fresh Spec/Test/Worker/Validator correlations; exact STARTED then RESULT progression.
- **Negative:** unknown state/phase or old state/event name; skipped/reversed phase; RESULT without STARTED; wrong/late/duplicate-different settlement; wrong child/role/model/reasoning/sandbox/path/hash/version/subject; parent-authored artifact; route downgrade.
- **Boundary:** `NOT_STARTED` only before REQUESTED; START_FAILED and INTERRUPTED distinct; exact duplicate settlement idempotent; operation mutex released while awaiting settlement.
- **Failure:** Worktree create/reuse/readback, Agent artifact readback, validation receipt, or Ledger append failure prevents next phase.
- **Forbidden effect:** host loop cannot report mechanical results or redo Git/Ledger/PR/Handoff; Foundation cannot launch Agent or require per-Gate MacBook acknowledgement.

### Revision, Resume, and automatic repair

- **Positive:** new DISPATCH and signed REVISION each start `auto_repair_attempt=0`; first reliably in-scope Validator FAIL consumes `0 -> 1`, invokes finding-specific Test, proves causal RED, then Worker/regression/new Candidate/new Validator; signed RESUME restores one unchanged safe phase.
- **Negative:** widened path/scope, changed baseline/Spec/AC/dependency/permission/host, missing changes_requested evidence, wrong Frozen Candidate when one exists, non-null Candidate on a pre-Candidate revision, ambiguous finding classification, noncausal RED, wrong Head, RESUME that needs code/Test work, automatic repair attempting to reset its own budget.
- **Boundary:** exactly one automatic repair per DISPATCH or signed REVISION cycle; RESUME/RELEASE do not reset; second Validator FAIL blocks; signed REVISION does reset.
- **Failure:** Agent START_FAILED/INTERRUPTED, malformed Validator result, mixed in/out-of-scope findings, changed Candidate between finding and RED.
- **Forbidden effect:** no automatic scope expansion, contract correction, dependency/host change, unsigned revision, or second automatic attempt.

### Ledger and evidence

- **Positive:** exactly seven event classes; canonical append/readback; contiguous sequence plus Evidence Ref Git parent/readback integrity without a record hash chain; exact idempotent replay; MacBook receipt in CONTROLLER_COMMAND; all six AGENT_RUN stages; Test Asset Retirement as REGRESSION/TEST_ASSET_RETIREMENT.
- **Negative:** eighth/old event class, wrong event detail/stage/subject/state version/hash/predecessor, rewrite/truncate/reorder, duplicate key with different bytes, secret/raw prompt/model/key/credential/environment content.
- **Boundary:** first event with null predecessor; historical FAIL then later PASS both retained; pointer conflict can be diagnosed from same-Change Ledger but no cross-Change enumeration is authoritative.
- **Failure:** local append, persistence, remote/readback, hash, predecessor, or conflict failure; exact already-present event convergence.
- **Forbidden effect:** unavailable Ledger cannot be claimed as durable BLOCKED/Gate/delivery/release evidence.

### Candidate, validation, diff, PR, and Handoff

- **Positive:** exact admitted status inventory -> exact `stage -- paths` -> staged entries/index tree -> non-amend Candidate -> clean readback; final validation and fresh Validator on same SHA; normal branch push/readback; freeze; unique PR/readback; Handoff/readback; AWAITING_CONTROLLER.
- **Negative:** forbidden/unknown/symlink/submodule/conflict/ignored/intent-to-add/out-of-root path; broad add; staged remainder/tree mismatch; wrong parent/branch/Head/tree; final validation or Validator wrong SHA; remote or PR Head mismatch.
- **Boundary:** local/remote/Validator Heads equal exactly before freeze; after freeze, read-only Git object inspection is allowed but Candidate Worktree/branch writes are forbidden; PR base exactly `main` and head exactly the current Change branch.
- **Failure:** commit ambiguous, push ambiguous, multiple PRs, PR definite absence/bounded continuation, PR response lost, Handoff existing with same vs different hash/reference, HANDOFF_READY append/readback failure; unresolved ambiguity after one readback is manual stop and cannot be replayed by later `run`.
- **Forbidden effect:** no force/delete/push-main/merge/approve/close; no another-Change PR; no embedded binary diff; no AWAITING_CONTROLLER before all readbacks.

### Canonical diff contract

- **Positive:** Git `2.54.0`, exact Design argv/config/environment, `shell:false`, fixed baseline/Candidate objects, and raw stdout SHA-256 reproduce identical bytes/hash on two temporary clones.
- **Negative:** Git version, config, locale, global/system/attribute boundary, baseline, Candidate, prefix, rename, textconv, external diff, decoded text, line ending, trimming, base64, or hashing input changed.
- **Boundary:** empty diff, text diff, binary file, path requiring quoting, mode change, deletion/addition; raw zero/last LF bytes preserved exactly.
- **Failure:** command nonzero, object missing, raw byte count/hash mismatch, cross-clone mismatch.
- **Forbidden effect:** canonical diff is read-only and Handoff stores only hash/objects, never the byte payload.

### Four recovery boundaries

- **Positive:** exact Candidate commit, remote branch Head, Ledger event, or PR/Handoff object readback converges without duplicate effect; proven absence permits one identical retry with original idempotency identity.
- **Negative:** wrong commit parent/tree/branch, unexpected remote Head, changed Ledger predecessor/bytes/hash, multiple/wrong-base/wrong-head PR, mismatched existing Handoff.
- **Boundary:** interruption before effect, after effect before readback, and after readback before state persist for each boundary.
- **Failure:** one deterministic readback remains ambiguous, evidence changes during readback, or object identity/absence cannot be proven: persist provable `BLOCKED / MANUAL_CONTROLLER_STOP`; subsequent `run` returns the same result without a gateway call.
- **Forbidden effect:** no stale `run` replay, replay envelope, post-BLOCKED retry/CAS, replacement IDs, force, alternate object, generic PREPARED/OBSERVED platform, recovery of any fifth boundary, or Agent replay.

### RELEASE and closure

- **Positive:** AWAITING + valid receipt -> fetch/prune -> clean Mac mini main -> signed squash equals origin/main -> ff-only -> readback -> one RELEASE event -> CLOSED -> pointer clear; all three replay continuation cases.
- **Negative:** wrong Change/body/receipt/state/hash/squash/idempotency, missing Acceptance/merge/archive/MacBook-main evidence, dirty main, non-fast-forward, origin mismatch.
- **Boundary:** identical RELEASE before command event, after event before CLOSED, after CLOSED before pointer clear, after pointer clear.
- **Failure:** fetch, clean check, ff-only, local/origin readback, Ledger append, state write, or pointer-clear readback failure.
- **Forbidden effect:** no push/merge main, no Candidate Worktree modification, no direct claim about MacBook local state, no pointer clear before CLOSED, no next Change on failure.

### Inactivity and Activation stop line

- **Positive:** deterministic imports/tests operate only on doubles/temp repositories and retain an inactive module; separate Activation test plan names real trust/SSH/host-loop/GitHub canaries.
- **Negative:** any startup hook, real path/key, network, current repository Git mutation, live PR/ref/Worktree, project-control/product/Profile/contract write, dependency, daemon/queue/Issue/Project, extra abstraction, or H/P/C/A action.
- **Boundary:** Foundation verifier/gateway contract is present; production trust/credential/host-loop implementation is absent until Activation.
- **Failure:** Mode Activation segmented proof or manual per-Gate flow does not satisfy unattended acceptance.
- **Forbidden effect:** Foundation GREEN/Validator/merge can never be reported as Mode Activation or first-product-Change authority.

## Planned Commands

Exact commands, hashes, counts, Node/Git versions, and environment SHALL be frozen by the future Test handoff. The expected focused entrypoints are planned, not run:

```sh
node --test tools/harness/change-coordinator/coordinator.test.mjs
node --test tools/harness/change-coordinator/cli.test.mjs
node --test tools/harness/change-coordinator/git.integration.test.mjs
```

After focused GREEN and an explicit Controller release, the canonical offline runner may be updated/run if required:

```sh
tools/harness/validation/run
```

## Evidence and Retirement

The Test handoff SHALL freeze exact Test file hashes, line/leaf counts, commands, environment, helper-health evidence, causal RED identity, production hashes, and scope status. GREEN SHALL rerun every focused suite, affected adapter/integration contract, recovery and forbidden-effect matrix, and applicable canonical regression.

`test-asset-retirement.md` owns the lifecycle ledger. Post-GREEN Test Asset Retirement SHALL be recorded as a `VALIDATION_RESULT` with `validation_kind: REGRESSION` and `validation_scope: TEST_ASSET_RETIREMENT`; it is not a state, phase, event class, or substitute for a fresh exact-Candidate Validator.

## F1-F8 Required Causal Leaves

These leaves refine the existing twelve Test identities; they do not create a thirteenth identity.

| Finding | Existing Test consumers | Required causal leaves |
|---|---|---|
| F1 sole writer/mutex | `TEST-DTF-R1-001`, `002`, `011`, `012` | canonical signed bytes submit only to trusted ingress; local/authenticated-SSH status is read-only; production CLI cannot construct Coordinator/open state/inject trust or expose run/settlement mutation commands; retirement proves those historical assertions absent |
| F2 active-slot admission | `TEST-DTF-R1-002`, `009` | crash before pointer publication; pointer write/readback loss; crash after slot reservation before READY; after READY before event; event/readback ambiguity; non-embedded READY hash; identical complete DISPATCH convergence; conflicting Change B rejection at every post-slot window; incomplete status/run manual stop |
| F3 disposition | `TEST-DTF-R1-004`, `005`, `009`, `010` | one independent leaf per BlockedReason and LocalPauseReason; exact five-action mapping; all four high-value unresolved ambiguities manual-stop after one readback with no later gateway call; local Evidence-unavailable original-operation replay preserved; pre-Candidate REVISION; safe-only RESUME; no false durable BLOCKED |
| F4 composition | `TEST-DTF-R1-001`, `011`, `012` | core constructor accepts only closed dependencies; production composition is Activation-owned; deterministic test factory works; caller-supplied verifier/key/trust/gateway is structurally rejected; gateway result/error union mutations fail closed |
| F5 closed schemas | `TEST-DTF-R1-001`..`012` | STATUS-only result and every nullable/pending-action mutation; CoordinatorError return/exit mapping; shared AgentBinding and six stage details; validation legal tuples; seven Ledger details; GatewayReason variant legality; unknown/missing/extra/wrong discriminants fail before progress |
| F6 pre-Activation integration | `TEST-DTF-R1-012` | plan/static checks prove R1-001..011 use current Git/governance flow and never require signed DISPATCH, inactive host loop, automatic PR/Handoff, or RELEASE; only R1-012 owns Activation proof |
| F7 diff producer | `TEST-DTF-R1-008`, `011` | two isolated clones produce identical raw bytes from empty env; every extra env/config/attribute/diff/textconv/replace/graft/alternate/shallow/wrapper input is rejected; executable/version/cwd/Git-dir/Worktree/argv receipt mismatch fails closed |
| F8 Ledger authority | `TEST-DTF-R1-005`, `009` | path grammar/collision rejection; exact first/subsequent JSONL bytes; absent-ref and existing-ref/new-path cases; prior-read/preparation/commit/push-loss/ref/commit/record/state/clear leaves; typed receipts; preserved tree; convergence/retry/conflict/ambiguity; no local artifact advances state/Gate |

### Second-revision independent leaf schedule

- **F1:** independently reject CLI imports of production core/test factory, state-root access, verifier/gateway arguments, and direct `run`/`settlement` commands; separately accept canonical signed-byte ingress submission and read-only local/authenticated-SSH STATUS output. Retirement scan must prove forbidden historical assertions have no current consumer.
- **F2:** schedule one fault at each ordered boundary: exact empty-pointer recheck, atomic pointer publication, pointer readback, READY write/readback, READY-byte hash, and command-event append/readback. Prove no READY/event before successful slot publication; every non-null pointer rejects Change B without enumeration; incomplete admission makes status fail closed and run effect-free; exact same DISPATCH converges only when pointer + READY + event are already complete and otherwise returns manual stop without filling gaps.
- **F3:** for Candidate commit, branch push, Ledger append, and Final Handoff/PR separately schedule exact-success readback, exact-absence bounded continuation, and still-ambiguous manual stop. After the manual stop, call `run` again and prove no gateway invocation or duplicate effect. Preserve separate safe Worktree/mechanical, Agent, Gate, Validator, RELEASE, authority/conflict and local-pause leaves; only Evidence-unavailable local pause retains exact stored public-request replay.
- **F5:** mutate every STATUS field/nullability and each PendingAction discriminant; require status to reject every non-STATUS outcome. Mutate every CoordinatorError field/code/operation and assert library return plus exit `0/2/3/70` mapping. Mutate each AgentBinding field and each REQUESTED/STARTED/RESULT/START_FAILED/INTERRUPTED/NOT_STARTED allowed-field set. For every legal validation kind/scope, schedule COMPLETED PASS/FAIL and START_FAILED/INTERRUPTED failure-code rules plus all illegal tuples. Mutate every GatewayReason against every gateway result kind and each of seven Ledger detail discriminants.
- **F8:** construct byte-exact empty, one-record and multi-record files; reject BOM/CR/blank/embedded-LF/missing-final-LF/double-final-LF. Schedule `tip:null` first ref, existing tip with absent Change path, subsequent append, unchanged other-tree-entry hash, and every `LedgerPartialReceiptV1` stage. Prove only remote ref+commit+tree+path+record readback linearizes and that local prepared bytes, local commit, push ACK or lost response cannot advance state.
