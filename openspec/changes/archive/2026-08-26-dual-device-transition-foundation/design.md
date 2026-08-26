# Design: Dual-device Transition Foundation — Reduced V1

## Design Summary

Reduced V1 is one inactive Coordinator module, not a general workflow platform:

```text
signed Controller command
-> one Mac mini active_change_id pointer
-> one process-owned short operation mutex
-> serial Foundation mechanics and formal Agent settlements
-> exact Candidate commit and validation
-> branch push/readback and Candidate freeze
-> PR create-or-reuse/readback
-> fixed-reference Handoff
-> AWAITING_CONTROLLER
-> signed RELEASE
-> clean ff-only Mac mini main sync
-> CLOSED
-> pointer clear
```

MacBook owns product/contract decisions, PR review, `changes_requested`, Acceptance, squash merge, archive, and RELEASE. Mac mini owns only current-Change execution and delivery to a review-ready PR.

## Module and Public Surface

`coordinator.mjs` exports one factory and one immutable schema version. The returned Coordinator exposes exactly four asynchronous interfaces:

```text
applyControllerCommand({ command_body, signature_bytes })
run({ change_id })
settlement({ change_id, settlement })
status({ change_id })
```

- `applyControllerCommand` is the only Controller command entrance.
- `run` advances internal mechanical work or returns one `AGENT_ACTION`.
- `settlement` accepts only external Agent lifecycle/result facts; it never accepts Git, Ledger, validation, PR, Handoff, or state-write receipts.
- `status` is strictly read-only and returns the pointer, current state/version/hash, phase, pending action, Candidate/delivery references, and bounded diagnostics.

No stage, recovery, revision, cleanup, publish, or Gate-advance method is public. The production mutating CLI is not a writer or a Coordinator constructor: after Activation it may only submit canonical signed command bytes to the Activation-owned trusted host-loop ingress, and before that ingress exists it remains unavailable. It cannot open the state root, obtain verifier/gateway dependencies, or invoke mutation interfaces directly. Local or authenticated-SSH callers may query `status` read-only.

## Closed Result and Error Contract

Successful calls return only the operation/outcome-discriminated `CoordinatorResultV1` union frozen in `Revision Closure: Closed interface and evidence schemas`; it has no generic nullable action/reason payload.

Input, authentication, and precondition rejection uses one sanitized error with exactly one of these codes and performs no protected effect:

```text
INPUT_INVALID
COMMAND_SIGNATURE_INVALID
COMMAND_EXPIRED
COMMAND_REPLAY_CONFLICT
WIP_AUTHORITY_INVALID
STATE_CONFLICT
OPERATION_BUSY
SCOPE_MISMATCH
SETTLEMENT_INVALID
CANDIDATE_IDENTITY_MISMATCH
RECOVERY_AMBIGUOUS
RELEASE_NOT_READY
```

After a command has been admitted, a material execution ambiguity transitions the current Change to `BLOCKED` when state and Ledger persistence are both safe. If the Ledger itself cannot be proven appended, the Coordinator preserves a local paused diagnostic and returns the Ledger failure without claiming a durable `BLOCKED` event.

## Controller Command and Verifier Contract

Controller command kinds are exactly:

```text
DISPATCH / REVISION / RESUME / RELEASE
```

`ControllerCommandBodyV1` is canonical JSON with exactly these top-level fields:

```text
{
  schema_version: '1.0',
  command_id,
  key_id,
  repository: {
    canonical_root,
    origin: 'origin',
    integration_branch: 'main'
  },
  change_id,
  command_kind,
  payload,
  scope: {
    allowed_paths,
    forbidden_paths
  },
  worktree: {
    branch,
    root,
    baseline_sha
  },
  expected_state_version,
  expected_state_hash,
  nonce,
  issued_at,
  expires_at,
  idempotency_id,
  receipt_digest,
  evidence_refs
}
```

Paths in each scope array are canonical repository-relative exact paths or one trailing `/**` prefix, sorted and unique; forbidden wins over allowed. V1 has no runtime conditional-path release: a path is allowed by the signed DISPATCH/unchanged REVISION scope or forbidden. The separately governed conditional canonical-runner append for this Foundation Change is a Controller workflow Gate before a future DISPATCH package, not another Coordinator command. `nonce` is canonical padded base64 of 32 random bytes. Times are canonical millisecond UTC and satisfy `issued_at <= now <= expires_at` with a maximum five-minute window. Git SHAs are lowercase 40-hex and SHA-256 values are lowercase 64-hex. `evidence_refs` is a sorted unique array of `{ kind, id, sha256, subject_sha }`; `receipt_digest` hashes the exact signed MacBook decision/run receipt referenced by that command.

The canonical UTF-8 bytes of the complete body are signed. Only `signature_bytes` is outside the signed body. Canonicalization recursively orders object keys, preserves array order, uses minimal JSON escaping, emits no whitespace/BOM/trailing LF, and rejects duplicate keys, non-JSON values, unsafe numbers, lone surrogates, or noncanonical input bytes.

The deterministic `ControllerCommandVerifier` boundary receives only canonical body bytes, signature bytes, and the body `key_id`; it returns `{ verified_key_id, body_sha256 }` or rejects. Foundation production code does not accept a public key or trust path from environment, command payload, ordinary CLI argument, repository file, state file, or Mac mini-writable file.

Mode Activation supplies the sole production trust provider and proves real signing, forged-command rejection, root-owned trust/ACL/effective-write properties, rotation, and revocation. Foundation uses deterministic verifier doubles only and never creates or installs a real key.

Payloads are closed by kind:

```text
DISPATCH -> {
  acceptance_ids, roles, validations,
  delivery_base: 'main', auto_repair_limit: 1,
  expected_pointer_sha256
}
REVISION -> {
  changes_requested_ref, revision_of_candidate_sha,
  resume_phase: 'TEST_RED'
}
RESUME -> {
  resume_target: { macro_state, phase }
}
RELEASE -> {
  squash_sha, acceptance_ref, merge_ref, archive_ref,
  origin_main_sha, macbook_main_sha
}
```

`roles` is ordered exactly `juaner_spec`, `juaner_test`, `juaner_worker`, `juaner_validator`, each with exact agent/model/reasoning/sandbox/write paths and brief/input/output-schema hashes. `validations` contains exact ID/argv/cwd/environment/timeout/subject definitions. `expected_pointer_sha256` equals the exact canonical initialized empty-pointer bytes. REVISION must equal the current DISPATCH body for repository/change/scope/worktree. `revision_of_candidate_sha` is the exact current Frozen Candidate when one exists and is `null` for a pre-Candidate implementation/Test defect; both variants bind expected state/version/hash and enter `EXECUTING/TEST_RED`. RESUME must equal `state.resume_target`. RELEASE references the same Handoff/PR/Frozen Candidate and its evidence refs resolve the named Controller facts.

An exact replay of the same verified canonical command and `idempotency_id` returns the original result. Reuse of `command_id`, nonce, or idempotency ID with different canonical bytes is a replay conflict.

`expected_state_version` and `expected_state_hash` are both exactly `null` only for DISPATCH against the initialized empty pointer; its `expected_pointer_sha256` binds that precondition instead. Every other command requires a nonnegative current state version and the SHA-256 of the exact current `state.json` bytes.

DISPATCH admission uses this exact non-self-referential order while the one mutex is held:

1. verify the signed command and recheck the exact initialized empty-pointer bytes/hash;
2. atomically publish and exactly read back `active_change_id == DISPATCH.change_id`; this successful pointer readback is the Change-admission linearization point and immediately reserves the sole Global-WIP slot;
3. only after that readback, write/read back complete `READY` `state.json` containing `admission:{command_id,body_sha256,idempotency_id}`;
4. compute `ready_state_sha256` from those complete read-back bytes; that hash is never embedded in `state.json`; and
5. append/read back on Evidence Ref the matching `CONTROLLER_COMMAND` whose detail binds the three admission fields and computed `ready_state_sha256`.

A crash before successful pointer publication admits no Change and this operation has written neither READY bytes nor an admission event. Pointer-write/readback loss is resolved only by an exact pointer readback: the unchanged initialized null bytes prove publication did not occur; the exact requested Change proves the slot was reserved but, without the later complete state/event tuple, is an incomplete admission; unavailable, malformed, different, or otherwise ambiguous bytes are a pointer conflict and never prove empty. After pointer publication, a crash before READY, after READY but before the admission event, or during admission-event readback can never make the slot empty. Restart/status preserves the pointer and exposes the incomplete/conflicting admission fail closed; `run` performs no effect, and the exact same DISPATCH enters or returns existing `BLOCKED` with reason `DISPATCH_ORPHAN_READY` and `MANUAL_CONTROLLER_STOP` when state and Ledger persistence are provable, otherwise the existing manual local-pause rule applies. It does not auto-finish READY/event admission, clear or replace the pointer, or replay a stale `run`. A different Change DISPATCH seeing any non-null pointer is rejected before state/Evidence inspection. Only a fully consistent pointer + READY state + admission event converges idempotently for the exact same DISPATCH. No path infers WIP=0, enumerates another Change, or creates a fifth recovery boundary.

## WIP Pointer and Durable State

The one initialized Mac mini state root contains:

```text
active-change.json
changes/<change_id>/state.json
changes/<change_id>/handoff.json
ledger-work/<change_id>/ledger.jsonl
local-pause.json
```

`active-change.json` is canonical JSON exactly:

```text
{ schema_version: '1.0', active_change_id: string | null }
```

It is the sole Global-WIP authority and its successful non-null publication/readback is DISPATCH admission. Absence, invalid bytes/schema, more than one logical pointer, or conflict with current `state.json` or the same-Change Ledger is `WIP_AUTHORITY_INVALID`/`BLOCKED`; no code infers an empty slot from absence or history. A non-null pointer reserves the slot even when READY state or the admission event is missing, incomplete, conflicting, or unreadable. `status` never reports that case as `EMPTY`, healthy `ACTIVE`, or replayable `ORPHAN_READY`; it returns the existing fail-closed invalid/blocked diagnostic when safely available, otherwise `WIP_AUTHORITY_INVALID`. The retained closed STATUS schema does not authorize filling an incomplete pointer-first admission. `run` cannot advance it. Evidence Ref or Ledger enumeration across Changes is not a WIP authority.

`CoordinatorStateV1` is canonical JSON exactly:

```text
{
  schema_version: '1.0',
  change_id,
  state_version,
  macro_state,
  phase,
  admission: {
    command_id, body_sha256, idempotency_id
  },
  authorization_cycle: {
    command_id,
    command_kind: 'DISPATCH' | 'REVISION',
    auto_repair_attempt: 0 | 1
  },
  repository: { baseline_sha, branch, worktree_root },
  pending_agent: PendingAgentV1 | null,
  candidate: CandidateV1 | null,
  delivery: DeliveryV1 | null,
  last_controller_command_id,
  blocked_reason: BlockedReasonV1 | null,
  evidence: {
    remote_tip, last_event_id, last_event_hash, last_readback_sha256
  },
  resume_target: {
    macro_state: 'READY' | 'EXECUTING' | 'DELIVERING',
    phase
  } | null
}
```

```text
CandidateV1 = {
  sha, parent, tree, branch,
  validation_refs,
  validator_head: git_sha | null,
  frozen: boolean
}

DeliveryV1 = {
  remote_head,
  canonical_diff_sha256,
  pull_request: {
    number, url, base: 'main', head_branch, head_sha,
    review_ready: true
  } | null,
  handoff_sha256: sha256 | null,
  delivery_id: string | null
}
```

`validation_refs` is sorted/unique and every receipt binds the Candidate SHA. `candidate.frozen` may become true only after local/remote/Validator equality. `delivery.pull_request` remains null until exact PR readback and `handoff_sha256` remains null until later Handoff readback.

`admission` is required in every state for the admitted Change, is copied unchanged from the verified original DISPATCH, and never contains `ready_state_sha256`. REVISION changes `authorization_cycle` but not `admission`. The authoritative DISPATCH `CONTROLLER_COMMAND` detail is the durable location of the computed READY-state hash.

The state hash is SHA-256 of the exact `state.json` bytes and is not duplicated inside the state. Every mutating interface compares both `state_version` and byte hash before effect and atomically persists/readbacks the next canonical state. No in-memory object, file age, Ledger scan, Git branch, PR, or historical event may substitute for the pointer/state pair.

`resume_target` is non-null only when a safely persisted no-code/no-Test continuation point is known. A block caused by failed Gate, implementation/Test change, scope/contract ambiguity, or uncertain effect has `resume_target: null` and cannot be RESUME-authorized. Signed RESUME must equal the stored target exactly.

## Six Macro States and Internal Phases

The only lifecycle states are:

```text
READY
EXECUTING
DELIVERING
AWAITING_CONTROLLER
BLOCKED
CLOSED
```

The only internal phases are:

```text
READY:       WORKTREE
EXECUTING:   SPEC | TEST_RED | WORKER_GREEN | REGRESSION
DELIVERING:  STAGE | CANDIDATE_COMMIT | FINAL_VALIDATION | VALIDATOR |
             BRANCH_PUSH | CANDIDATE_FREEZE | PR | HANDOFF
```

`AWAITING_CONTROLLER`, `BLOCKED`, and `CLOSED` have no active phase. Mechanical substeps, Agent stages, Test Asset Retirement, recovery attempts, and Controller decisions never become states or phases.

Normal macro transitions are:

```text
empty pointer + signed DISPATCH -> READY
READY -> EXECUTING -> DELIVERING -> AWAITING_CONTROLLER
AWAITING_CONTROLLER/BLOCKED + signed REVISION -> EXECUTING/TEST_RED
safe interrupted phase + signed RESUME -> stored macro state/phase
AWAITING_CONTROLLER + signed RELEASE -> CLOSED -> pointer clear
any admitted ambiguity/failure -> BLOCKED
```

## One Short Operation Mutex

`applyControllerCommand`, `run`, and `settlement` use one process-owned mutex. The trusted host later activated on Mac mini owns the sole Coordinator process for this state root; process exit releases the mutex automatically. There is no file lock, Change lock, stale-owner timestamp, liveness probe, owner stealing, or stale-lock recovery protocol.

The mutex is held only while:

- reading the current pointer/state version and hash;
- performing one bounded mechanical Git/GitHub/Ledger operation plus deterministic readback; and
- persisting/readback of that operation's result and next state.

It is released before returning an `AGENT_ACTION`, while waiting for an Agent settlement or Controller command, and immediately after a bounded operation completes. A contender that cannot acquire it returns `OPERATION_BUSY` and performs no concurrent state/effect write. It never fabricates a durable `BLOCKED` record merely because the mutex is busy.

## Minimal Gateway Seams

Foundation owns ordering. Gateways expose typed bounded operations and no arbitrary command escape.

The Git gateway has exactly eleven methods, below the frozen budget of twelve:

```text
inspectRepository
createOrReuseWorktree
inspectWorktree
stageExact
readStaged
commitCandidate
readCommit
pushBranch
readRemoteBranch
canonicalDiff
syncMainFfOnly
```

- `createOrReuseWorktree` must read back branch, baseline/common Git directory, and clean status.
- `stageExact` accepts only an exact path array and uses `--` semantics; broad add is unavailable.
- `readStaged` returns the full staged entries and index tree used by `commitCandidate`.
- `pushBranch` accepts only the current Change branch, normal non-force update; it cannot address `main`, delete, or force.
- `syncMainFfOnly` implements only RELEASE's fetch/prune, clean-main check, ff-only move to the signed squash SHA, and local/`origin/main` readback. It cannot push or merge.

The Ledger gateway exposes current-Change append plus exact remote readback only. `refs/heads/evidence/agent-runs` is the sole durable Ledger byte authority. `ledger-work/<change_id>/ledger.jsonl` is recreated from the expected remote bytes for one unpublished append attempt and is never consulted as business authority. The gateway reads/fetches expected tip and prior bytes, prepares the exact append, creates the evidence commit, performs a normal non-force push, then reads back remote ref, commit, and appended record bytes. Exact remote readback is the linearization point; only afterward may state persist the receipt. It exposes no all-Change enumeration and never decides WIP. The PR gateway exposes current-Change query/create-or-reuse/update/readback/mark-ready-for-review only. It has no close, approve, merge, delete, label, Issue, Project, or arbitrary GitHub operation. The validation gateway executes exact argv/cwd/environment/timeout definitions and returns bounded receipts. The Handoff gateway atomically writes/readbacks one canonical Handoff.

Foundation tests use deterministic gateways and OS temporary repositories/bare remotes. Production credentials, real GitHub transport, and host permissions are Activation-owned.

## Automatic Normal Path

After a signed DISPATCH is accepted, `run` serially advances without per-Gate MacBook intervention:

```text
create or reuse the current Change Worktree
-> read back branch, baseline, and clean status
-> fresh juaner_spec
-> fresh juaner_test and causal RED
-> fresh juaner_worker and GREEN
-> Regression, including Test Asset Retirement
-> exact stage and staged-tree readback
-> Candidate commit and readback
-> final validation on exact Candidate
-> fresh juaner_validator on exact Candidate
-> normal branch push and remote-Head readback
-> Candidate freeze
-> PR create or reuse and PR-Head readback
-> final Handoff write/readback
-> AWAITING_CONTROLLER
```

Spec, Test, Worker, and Validator use fresh isolated role contexts and the exact DISPATCH route/sandbox/write scope. Foundation executes Worktree, Git, Ledger, validation, PR, and Handoff mechanics directly through the restricted gateways. The host loop only launches named Agents and returns settlements; it does not redo Foundation mechanics.

## Agent Action and Settlement

When an Agent role is due, `run` first appends/readbacks `AGENT_RUN/REQUESTED`. Pending state, returned action, and later settlement share exactly this binding:

```text
AgentBindingV1 = {
  correlation_id, role, agent, model, reasoning, sandbox, allowed_paths,
  phase, state_version, brief_sha256, input_sha256, output_schema_sha256,
  subject_sha, idempotency_id
}
PendingAgentV1 = AgentBindingV1 & { request_event_id }
AgentActionV1 = AgentBindingV1 & { action_kind:'LAUNCH_AGENT' }
AgentSettlementBindingV1 = AgentBindingV1
```

`run` persists `PendingAgentV1` with the durable REQUESTED event ID and returns exactly the matching `AgentActionV1`. It never starts the Agent itself. The only intentional differences are the pending record's `request_event_id` and the action's `action_kind`; no route/hash/subject/idempotency field is omitted.

The host calls `settlement` with exactly one closed variant:

```text
STARTED = AgentSettlementBindingV1 & {
  stage: 'STARTED', observed_child_id
}
RESULT = AgentSettlementBindingV1 & {
  stage: 'RESULT', observed_child_id,
  status: 'PASS' | 'FAIL', artifact_path, artifact_sha256
}
START_FAILED = AgentSettlementBindingV1 & {
  stage: 'START_FAILED',
  failure_code: 'SPAWN_REJECTED' | 'ROUTE_UNAVAILABLE' |
                'SANDBOX_UNAVAILABLE' | 'START_TIMEOUT'
}
INTERRUPTED = AgentSettlementBindingV1 & {
  stage: 'INTERRUPTED', observed_child_id: string | null,
  reason_code: 'USER_INTERRUPTED' | 'HOST_INTERRUPTED' |
               'AGENT_EXITED' | 'RESULT_UNREADABLE'
}
```

`REQUESTED`, `STARTED`, `RESULT`, `START_FAILED`, and `INTERRUPTED` are immutable `AGENT_RUN` stages. Foundation writes `NOT_STARTED` only when a role was evaluated but its dispatch preconditions were not met and no child request was issued; it never aliases that stage to `REQUESTED`, `START_FAILED`, or `RESULT`.

Every settlement must match the outstanding correlation, child identity where applicable, route, hashes, phase, state version, and subject. Exact replay is idempotent. Missing STARTED, wrong/late/duplicate-different/ambiguous settlement, parent-authored substitute, route downgrade, unreadable artifact, or subject mismatch cannot advance and becomes `BLOCKED` when safely recordable.

## Validation and Bounded Automatic Repair

Test RED must name the frozen Acceptance Criterion and fail causally because the required behavior is missing. Worker GREEN, Regression, Test Asset Retirement, final validation, and Validator evidence remain separate receipts. Test Asset Retirement is recorded as `VALIDATION_RESULT` with `validation_kind: 'REGRESSION'` and `validation_scope: 'TEST_ASSET_RETIREMENT'`; it is not a state, phase, or event class.

Each accepted DISPATCH begins an authorization cycle with `auto_repair_attempt: 0`. Each accepted signed REVISION begins a new authorization cycle and resets it to `0`. RESUME and RELEASE never reset it.

A Validator FAIL may automatically return to `EXECUTING/TEST_RED` only when all findings are reliably classified as implementation defects inside the current frozen Change, Worktree, branch, baseline, Spec, Acceptance Criteria, allowed paths, dependencies, permissions, and host boundary. Before requesting the new Test role, Foundation atomically changes `auto_repair_attempt` from `0` to `1` and records the Validator finding hash and revision link. Test must then produce a finding-specific causal RED before Worker is requested.

Any contract/architecture/scope/path/dependency/permission/host change, ambiguous classification, inability to form causal RED, Agent start/result ambiguity, wrong Candidate evidence, or a second Validator FAIL enters `BLOCKED`. Automatic repair is not a signed REVISION and cannot reset or widen its authorization cycle.

Signed REVISION binds the same Change/Worktree/branch/baseline/Spec/Acceptance/scope and begins at `TEST_RED`. Signed RESUME is only for a recorded safe phase requiring no code/Test change; it cannot skip a failed Gate, widen scope, change semantics, or reset the repair budget.

## Seven-class Ledger

The only event classes are:

```text
CONTROLLER_COMMAND
AGENT_RUN
VALIDATION_RESULT
CANDIDATE_COMMITTED
BRANCH_PUSHED
HANDOFF_READY
BLOCKED
```

Each canonical append-only record contains:

```text
{
  schema_version: '1.0', event_id, sequence, event_class, idempotency_id,
  change_id, occurred_at, state_version, subject_sha, detail, event_hash
}
```

`sequence` starts at one and increments by one. `event_hash` is SHA-256 over canonical bytes excluding only itself. Exact JSONL bytes, contiguous sequence, the Evidence Ref Git commit parent history, and remote record readback provide append integrity; no second record-level hash chain is added. Existing records are never overwritten. The Ledger contains no full prompt, raw model output, private key, credential, raw sensitive data, or environment dump.

- `CONTROLLER_COMMAND` records verified DISPATCH/REVISION/RESUME/RELEASE body hash, key ID, signature hash, receipt digest, evidence references, and MacBook decision/run receipt; after the active slot is published/read back, DISPATCH additionally binds exact admission identity plus the computed read-back READY-state hash.
- `AGENT_RUN` carries exactly the six stages defined above plus correlation/route/artifact references.
- `VALIDATION_RESULT` carries the exact validation kind/scope, execution status, nullable verdict/failure code legal pairing, command-definition/receipt hashes, subject and required Candidate/Validator Head bindings.
- `CANDIDATE_COMMITTED` carries Candidate SHA/parent/tree/branch and exact staged-path digest.
- `BRANCH_PUSHED` carries local/remote/Validator Heads and freeze status.
- `HANDOFF_READY` carries Handoff hash plus fixed Candidate/PR references.
- `BLOCKED` carries bounded reason and evidence references; it never claims an unavailable Ledger write succeeded.

MacBook signed decision/run receipts enter only `CONTROLLER_COMMAND`; no second Controller event system is created. Ledger readback may detect a pointer conflict, but Ledger enumeration does not decide Global WIP.

## Candidate, Canonical Diff, PR, and Handoff

Candidate entry requires exact GREEN, Regression including Test Asset Retirement, clean expected Worktree Head, current state/version, and a complete scope inventory. Foundation stages only exact admitted paths, requires staged entries/tree equal that inventory with no remainder, creates one non-amend Candidate commit, and reads back SHA/parent/tree/branch/cleanliness.

Final validation and fresh Validator both bind the exact Candidate. Freeze requires:

```text
local Candidate Head == remote branch Head == Validator Head
```

After freeze, Mac mini cannot write code or Git state in the Candidate branch/Worktree. It may only perform restricted PR delivery plus Ledger/Handoff persistence. PR base is exactly `main`; head is the Frozen Candidate branch; readback must prove `PR Head == Frozen Candidate Head` and review-ready state.

Canonical diff bytes are generated from the fixed baseline/Candidate objects with Git exactly `2.54.0` and this argument-array invocation:

```text
git
  --no-pager
  -c color.ui=false
  -c core.quotePath=true
  -c diff.algorithm=myers
  -c diff.mnemonicPrefix=false
  -c diff.noprefix=false
  diff
  --binary
  --full-index
  --no-ext-diff
  --no-textconv
  --no-renames
  --src-prefix=a/
  --dst-prefix=b/
  <baseline_sha>..<candidate_sha>
  --
```

The producer begins from an empty environment and admits exactly `LC_ALL=C`, `LANG=C`, `TZ=UTC`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_ATTR_NOSYSTEM=1`, `GIT_PAGER=cat`, `PAGER=cat`, `GIT_TERMINAL_PROMPT=0`, and `GIT_NO_REPLACE_OBJECTS=1`. It invokes a resolved absolute Git executable with `shell:false`, requires exact output `git version 2.54.0`, and records executable SHA-256, canonical repository cwd, common Git-dir, Worktree root, environment, and argv before hashing. The gateway rejects `.git/info/attributes`, grafts, shallow state, object alternates, replace refs, configured external diff/textconv, and the exact local-config namespaces `diff.*`, `core.attributesFile`, `core.pager`, `pager.*`, `interactive.diffFilter`, `submodule.*`, and `include.*`. No ambient `PATH`, HOME/config, pager, hook, locale, alternate-object, or wrapper input is admitted. The diff hash is lowercase SHA-256 of stdout raw bytes exactly as emitted, including all LF bytes and with no decoding, newline conversion, trimming, reserialization, or base64 wrapper. Both devices must match executable SHA/version, admitted environment, argv, baseline, Candidate, and raw-byte hash; each host-local cwd/Git-dir/Worktree must resolve to the recorded repository/worktree identities but its absolute spelling is not a diff input or cross-device equality field. Any mismatch is fail-closed.

`HandoffV1` stores no embedded binary diff. It contains only:

```text
{
  schema_version, change_id, baseline_sha,
  candidate_sha, candidate_tree, branch, remote_head,
  changed_paths, canonical_diff_sha256,
  canonical_diff_contract_id: 'JUANERAI_GIT_DIFF_V1',
  validation_receipts, validator_verdict, validator_head,
  ledger_refs,
  pull_request: { number, url, base: 'main', head_branch, head_sha },
  delivery_id, idempotency_id,
  risks, unverified, open_questions
}
```

PR readback succeeds before Handoff generation. Only after Handoff write/readback and `HANDOFF_READY` append/readback may state become `AWAITING_CONTROLLER`. Mac mini then stops. MacBook begins at PR review and alone owns `changes_requested`, Acceptance, squash merge, archive, and RELEASE.

## Four Recovery Boundaries

Only these boundaries receive automatic recovery:

1. **Candidate commit:** read current Head and commit object once. Exact parent/tree/branch/idempotency match converges; proven unchanged parent plus exact staged tree permits the already-bounded identical continuation. If that one readback cannot prove exact success or exact absence, enter `BLOCKED / MANUAL_CONTROLLER_STOP`.
2. **Branch push:** read remote Head once. Exact Candidate converges; proven prior Head permits the already-bounded identical normal-push continuation. If that one readback cannot prove exact success or exact absence, enter `BLOCKED / MANUAL_CONTROLLER_STOP`.
3. **Ledger append:** read the expected event ID/hash and predecessor once. Exact bytes/hash converges; proven absence at the unchanged predecessor permits the already-bounded identical append continuation. Conflict, truncation, or unresolved ambiguity enters `BLOCKED / MANUAL_CONTROLLER_STOP` when the durable block is provable, otherwise the existing Evidence Ref local-pause rule applies without a false durable-block claim.
4. **Final Handoff/PR:** query once by repository + base `main` + head branch. One PR with Frozen Candidate Head converges; definite absence permits the already-bounded same-idempotency continuation. An identical Handoff converges only when its canonical hash and every Candidate/PR reference match. Multiple PRs, base/head mismatch, Handoff mismatch, or unresolved ambiguity enters `BLOCKED / MANUAL_CONTROLLER_STOP`.

For every boundary, the original idempotency key and intended object identity are reused only inside the already-bounded pre-BLOCKED continuation; no replacement ID or alternate object is allocated. After unresolved ambiguity is durably `BLOCKED`, a subsequent `run` returns the same manual-stop result without invoking the ambiguous gateway or duplicating its effect. No durable replay envelope, post-BLOCKED replay CAS, recovery operation, or generic transaction machinery exists. Automatic Validator repair is normal execution, not a fifth recovery boundary.

## RELEASE Ordering and Idempotence

A first valid RELEASE requires `AWAITING_CONTROLLER`, pointer equality to the same Change, exact current state version/hash, the Frozen Candidate/PR, and a signed receipt for Acceptance, squash merge, archive, `origin/main`, and MacBook-main synchronization.

Foundation then executes through `syncMainFfOnly`:

```text
fetch origin --prune
-> prove the Mac mini main Worktree clean
-> prove the signed squash SHA equals origin/main
-> ff-only local main to that SHA
-> read back local main == origin/main == signed squash SHA
```

It never pushes or merges `main` and never modifies the frozen Candidate Worktree. MacBook local-main status is trusted only as the signed RELEASE receipt; Mac mini does not claim to read the other host directly.

After successful sync/readback:

```text
append/read back the RELEASE CONTROLLER_COMMAND once
-> write/read back CLOSED
-> clear/read back active_change_id last
```

Idempotent continuation is exact:

- `AWAITING_CONTROLLER` plus the identical already-recorded RELEASE continues to `CLOSED` and pointer clear without a duplicate command event.
- `CLOSED` plus pointer still naming this Change clears only the pointer.
- `CLOSED` plus an empty pointer returns `ALREADY_APPLIED`.
- Any different Change, command body, receipt digest, state version/hash, squash SHA, or idempotency ID fails closed.

Failed fetch/clean/ff-only/readback leaves the pointer set and enters `BLOCKED`; it grants no next Change.

## Concurrency and Publication Answers

- Admission event: one verified DISPATCH whose atomic non-null pointer publication/readback reserves the initialized empty slot before READY state or admission-event writes.
- Issued work: at most one Agent action or one bounded mechanical operation with one idempotency key.
- Local linearization: atomic state/pointer replace and exact readback while the process mutex is held.
- Candidate linearization: exact commit object readback.
- Remote branch linearization: normal push plus remote-Head readback.
- Delivery linearization: PR readback, Handoff readback, and `HANDOFF_READY` Ledger readback before `AWAITING_CONTROLLER`.
- Race winner: the first mutex holder whose expected state version/hash remains current. Other callers return busy/conflict and issue no effect.
- Late settlement: never advances a changed correlation or state.
- Exceptional writes: only the same-Change paused diagnostic and, when proven, append-only `BLOCKED`; no product-tree write while frozen.
- Bound: one deterministic readback and at most one identical retry at each of the four named recovery boundaries. All other ambiguity stops.

## Foundation / Mode Activation Boundary

Foundation implements and deterministically tests the four interfaces, six states, internal phases, pointer/state contract, signed-body canonicalization and verifier seam, operation mutex, restricted gateways, seven event classes, four recovery boundaries, exact Candidate/diff/Handoff/PR/RELEASE behavior, and no-live-effect negatives.

Mode Activation separately owns:

- real MacBook signing key and Mac mini production trust provider;
- root-owned trust files, ACL/effective-write checks, rotation/revocation;
- SSH and remote Controller invocation;
- the sole trusted Mac mini host loop and real formal Agent launches;
- production GitHub credentials/transport and current-Change PR canaries;
- unattended signed-DISPATCH-to-review-ready-PR proof, Candidate freeze/Handoff, and one same-scope automatic Validator repair.

Foundation is inert on merge: no startup import, daemon, queue, scheduler, poller, project-control writer, Agent launcher, live GitHub connection, or product behavior is activated. H/P/C/A remain forbidden until a separate accepted Mode Activation and later explicit lifecycle authorization.

## Revision Closure: Composition, Schemas, and Disposition

### One production composition

Foundation owns closed `CoordinatorCoreDependenciesV1` contracts and `createCoordinatorCore(dependencies)`. Only the later Mode Activation composition root may supply the production verifier, single state root, Git/GitHub/Ledger/validation/Handoff gateways, and `TrustedHostIngressV1.submitCommand(canonical_signed_bytes)`. That root invokes all three mutation interfaces inside its one process and one mutex. Ordinary callers supply bytes only. Test support owns a separate `createTestCoordinator(DeterministicTestDependenciesV1)` factory; neither that type nor any verifier/gateway parameter is reachable from the production mutating CLI.

`GatewayReasonV1` is exactly `EXPECTED_IDENTITY_ABSENT | CAS_CONFLICT | REMOTE_CONFLICT | READBACK_MISMATCH | FORBIDDEN_TARGET | DIRTY_WORKTREE | NON_FAST_FORWARD | REMOTE_AMBIGUOUS | INVALID_RECEIPT | UNAVAILABLE | PROCESS_FAILED`. Closed gateway results are:

```text
OK<T>              { kind:'OK', value:T, receipt_sha256 }
ALREADY_APPLIED<T> { kind:'ALREADY_APPLIED', value:T, receipt_sha256 }
ABSENT              { kind:'ABSENT', reason:'EXPECTED_IDENTITY_ABSENT',
                      expected_identity }
CONFLICT            { kind:'CONFLICT', reason:'CAS_CONFLICT'|'REMOTE_CONFLICT'|
                      'READBACK_MISMATCH'|'FORBIDDEN_TARGET'|'DIRTY_WORKTREE'|
                      'NON_FAST_FORWARD', observed_identity:null|string }
AMBIGUOUS<P>        { kind:'AMBIGUOUS', reason:'REMOTE_AMBIGUOUS'|
                      'INVALID_RECEIPT'|'READBACK_MISMATCH', partial_receipt:P }
UNAVAILABLE<P>      { kind:'UNAVAILABLE', reason:'UNAVAILABLE'|'PROCESS_FAILED',
                      partial_receipt:null|P }
```

Only `ABSENT`, `CONFLICT`, `AMBIGUOUS`, and `UNAVAILABLE` carry a reason; successful variants never do. Non-Ledger methods use `P=null`; Ledger operations use the exact partial receipt below. Methods accept only their named typed request and never arbitrary argv, URL, ref, path, credential, verifier, or callback. The verifier is `verify({command_body_bytes, signature_bytes}) -> VERIFIED { body, verified_key_id, body_sha256, signature_sha256 } | REJECTED { error_code }`. Production ownership and the test-only constructor are fixed here; real transport, access control, keys, and credentials remain Activation work.

State signatures are `readPointer() -> GatewayResultV1<PointerBytesV1>`, `writePointer({expected_sha256,next_bytes}) -> GatewayResultV1<PointerBytesV1>`, `readState({change_id}) -> GatewayResultV1<StateBytesV1>`, `writeState({change_id,expected_version,expected_sha256,next_bytes}) -> GatewayResultV1<StateBytesV1>`, `readLocalPause() -> GatewayResultV1<LocalPauseBytesV1>`, and `writeLocalPause({expected_sha256,next_bytes}) -> GatewayResultV1<LocalPauseBytesV1>`.

The eleven Git request/result signatures are exact:

`canonical_root`, `worktree_root`, `main_worktree_root`, and `common_git_dir` are canonical absolute-path strings; `change_id`, `branch`, and `idempotency_id` are non-empty strings; every `*_sha`, `*_head`, `parent`, and `tree` is a lowercase 40-hex Git SHA except `expected_remote_head`/`prior_remote_head`, which may be `null`; every `*_sha256` is lowercase 64-hex; `paths`/`staged_paths` are sorted unique canonical repository-relative strings; `message_bytes` is an immutable byte array. `status_entries` is a sorted array of `{path:string,mode:null|string,object_sha:null|git_sha,status:'ADDED'|'MODIFIED'|'DELETED'|'RENAMED'|'TYPE_CHANGED'|'UNTRACKED'|'CONFLICT'|'IGNORED'}`. No other scalar representation is accepted.

```text
inspectRepository({canonical_root,origin:'origin',integration_branch:'main'})
  -> GatewayResultV1<{canonical_root,common_git_dir,origin_url_sha256,
                      integration_head,git_version,git_executable_sha256}>
createOrReuseWorktree({canonical_root,change_id,branch,worktree_root,
                       baseline_sha,idempotency_id})
  -> GatewayResultV1<{worktree_root,branch,head_sha,baseline_sha,
                      common_git_dir,clean}>
inspectWorktree({canonical_root,worktree_root,expected_branch,expected_head})
  -> GatewayResultV1<{worktree_root,branch,head_sha,common_git_dir,
                      status_entries,clean}>
stageExact({canonical_root,worktree_root,expected_head,paths})
  -> GatewayResultV1<{staged_paths,index_tree,staged_paths_sha256}>
readStaged({canonical_root,worktree_root})
  -> GatewayResultV1<{staged_paths,index_tree,staged_paths_sha256}>
commitCandidate({canonical_root,worktree_root,expected_parent,expected_tree,
                 message_bytes,idempotency_id})
  -> GatewayResultV1<{sha,parent,tree,branch}>
readCommit({canonical_root,sha})
  -> GatewayResultV1<{sha,parent,tree,branch}>
pushBranch({canonical_root,branch,candidate_sha,expected_remote_head,
            idempotency_id})
  -> GatewayResultV1<{prior_remote_head,remote_head,forced:false,deleted:false}>
readRemoteBranch({canonical_root,origin:'origin',branch})
  -> GatewayResultV1<{remote_head}>
canonicalDiff({canonical_root,common_git_dir,worktree_root,
               baseline_sha,candidate_sha})
  -> GatewayResultV1<{producer_receipt:CanonicalDiffProducerReceiptV1,
                      byte_length,stdout_sha256}>
syncMainFfOnly({canonical_root,main_worktree_root,squash_sha,
                expected_origin_main})
  -> GatewayResultV1<{prior_local_main,local_main,origin_main,
                      clean:true,fast_forward_only:true}>
```

`status_entries` uses the closed record enum above; `staged_paths` is the sorted string array and `index_tree` is a Git SHA. `CanonicalDiffProducerReceiptV1` contains exactly the executable/version/hash, environment, argv, repository identity and host-local path-resolution readbacks frozen above. The four Ledger signatures are exactly the typed forms under `Ledger append publication`; no shorter alternate form exists. PR signatures are `queryCurrent({repository,base:'main',head_branch})`, `createOrReuse({repository,base:'main',head_branch,head_sha,idempotency_id})`, and `readback({number,expected_head})`; validation is `execute({definition,subject_sha})`; Handoff is `writeReadback({expected_sha256,handoff_bytes})`. Each returns `GatewayResultV1` and none accepts a free-form command or transport handle.

### Closed interface and evidence schemas

Inputs are exact: `applyControllerCommand({command_body_bytes,signature_bytes})`; `run({change_id,expected_state_version,expected_state_hash})`; `settlement({change_id,expected_state_version,expected_state_hash,settlement})`; `status({change_id:null|string})`. Fields not named in a variant are forbidden.

```text
CoordinatorResultBaseV1 = {
  schema_version:'1.0',
  operation:'applyControllerCommand'|'run'|'settlement'|'status',
  change_id:null|string, state:null|MacroStateV1,
  state_version:null|integer, state_hash:null|sha256
}
APPLIED = Base & {outcome:'APPLIED',payload:{command_id:string,
           command_kind:'DISPATCH'|'REVISION'|'RESUME'|'RELEASE',
           operation_receipt_sha256:sha256}}
ADVANCED = Base & {outcome:'ADVANCED',payload:{
            from_state:null|MacroStateV1,from_phase:null|PhaseV1,
            to_state:MacroStateV1,to_phase:null|PhaseV1,
            operation_receipt_sha256:sha256}}
AGENT_ACTION = Base & {outcome:'AGENT_ACTION',payload:{action:AgentActionV1}}
WAITING = Base & {outcome:'WAITING',payload:{waiting_for:
          'AGENT_SETTLEMENT'|'CONTROLLER_COMMAND'|'EVIDENCE_REF',
          pending_correlation_id:null|string}}
AWAITING_CONTROLLER = Base & {outcome:'AWAITING_CONTROLLER',payload:{
  candidate_sha:git_sha,remote_head:git_sha,validator_head:git_sha,
  pr_number:positive_integer,pr_head:git_sha,handoff_sha256:sha256}}
BLOCKED = Base & {outcome:'BLOCKED',payload:{blocked_reason:BlockedReasonV1,
          next_action:NextActionV1,blocked_event_id:null|string,
          local_pause_id:null|string}}
CLOSED = Base & {outcome:'CLOSED',payload:{squash_sha:git_sha,
          pointer_cleared:boolean}}
ALREADY_APPLIED = Base & {outcome:'ALREADY_APPLIED',payload:{
                  idempotency_id:string,original_receipt_sha256:sha256}}
STATUS = Base & {operation:'status',outcome:'STATUS',
                 payload:StatusDiagnosticsV1}
```

Allowed outcomes are exact: `applyControllerCommand -> APPLIED|BLOCKED|ALREADY_APPLIED`; `run -> ADVANCED|AGENT_ACTION|WAITING|AWAITING_CONTROLLER|BLOCKED|CLOSED`; `settlement -> ADVANCED|WAITING|BLOCKED|ALREADY_APPLIED`; `status -> STATUS` only.

`PendingActionV1` is exactly `null | {kind:'AGENT_SETTLEMENT',correlation_id} | {kind:'CONTROLLER_COMMAND',allowed_command_kinds:sorted_unique_array<'REVISION'|'RESUME'|'RELEASE'>} | {kind:'IDENTICAL_REQUEST_REPLAY',operation:'applyControllerCommand'|'run'|'settlement',request_sha256,idempotency_id}`. `StatusDiagnosticsV1` is exactly `{pointer_status:'EMPTY'|'ACTIVE'|'ORPHAN_READY'|'INVALID',active_change_id:null|string,macro_state:null|MacroStateV1,phase:null|PhaseV1,state_version:null|integer,state_hash:null|sha256,pending_action:PendingActionV1,candidate:null|CandidateV1,delivery:null|DeliveryV1,orphan_ready:null|{command_id,body_sha256,idempotency_id,ready_state_sha256,controller_event_id,controller_event_hash},local_pause:null|LocalPauseDiagnosticV1}`. `EMPTY` requires all Change/state/Candidate/delivery/orphan/pause fields null; `ORPHAN_READY` requires READY/WORKTREE plus the recomputed orphan payload and identical-request pending action; `ACTIVE` requires a Change and state identity; `INVALID` requires a local-pause diagnostic and no inferred WIP=0. Reading status acquires no mutation mutex and writes nothing.

`CoordinatorErrorCodeV1` is exactly the twelve codes in `Closed Result and Error Contract`. The sole sanitized pre-effect rejection transport is `CoordinatorErrorV1 = {schema_version:'1.0',operation:'applyControllerCommand'|'run'|'settlement'|'status',outcome:'REJECTED',error_code:CoordinatorErrorCodeV1,change_id:null|string}`. Library calls return it and do not throw for contract, authentication, authorization, CAS, replay, or domain rejection. Production ingress/CLI emits exactly one canonical JSON line: non-BLOCKED Coordinator result including STATUS uses exit `0`, `CoordinatorErrorV1` uses exit `2`, and BLOCKED/local-pause result uses exit `3`. Malformed transport is `INPUT_INVALID`/exit `2`. An unexpected post-admission failure is never relabeled REJECTED: it follows the exact BLOCKED/local-pause disposition and Ledger rules; a process failure before such a result exits `70` without fabricating progress.

`NextActionV1 = 'IDENTICAL_COMMAND_REPLAY'|'RESUME'|'REVISION'|'RELEASE'|'MANUAL_CONTROLLER_STOP'`; `CoordinatorReasonV1 = CoordinatorErrorCodeV1 | BlockedReasonV1 | LocalPauseReasonV1`.

#### Agent bindings and six details

```text
AgentBindingV1 = {
  correlation_id, role, agent, model, reasoning, sandbox, allowed_paths,
  phase, state_version, brief_sha256, input_sha256, output_schema_sha256,
  subject_sha, idempotency_id
}
PendingAgentV1 = AgentBindingV1 & { request_event_id }
AgentActionV1 = AgentBindingV1 & { action_kind:'LAUNCH_AGENT' }
AgentSettlementBindingV1 = AgentBindingV1
```

The settlement variants are exactly the four already frozen under `Agent Action and Settlement`. The `AGENT_RUN` detail union is exact:

```text
REQUESTED     = AgentBindingV1 & {stage:'REQUESTED',request_event_id}
STARTED       = AgentBindingV1 & {stage:'STARTED',observed_child_id}
RESULT        = AgentBindingV1 & {stage:'RESULT',observed_child_id,
                 status:'PASS'|'FAIL',artifact_path,artifact_sha256}
START_FAILED  = AgentBindingV1 & {stage:'START_FAILED',observed_child_id:null,
                 failure_code:'SPAWN_REJECTED'|'ROUTE_UNAVAILABLE'|
                 'SANDBOX_UNAVAILABLE'|'START_TIMEOUT'}
INTERRUPTED   = AgentBindingV1 & {stage:'INTERRUPTED',
                 observed_child_id:null|string,
                 reason_code:'USER_INTERRUPTED'|'HOST_INTERRUPTED'|
                 'AGENT_EXITED'|'RESULT_UNREADABLE'}
NOT_STARTED   = {stage:'NOT_STARTED',evaluation_id,role,agent,model,reasoning,
                 sandbox,allowed_paths,phase,state_version,brief_sha256,
                 input_sha256,output_schema_sha256,subject_sha,
                 reason_code:'PRECONDITION_FAILED',idempotency_id}
```

`NOT_STARTED` has no correlation or child identity because no request exists. Every other stage requires the exact common binding. Unknown or extra fields reject.

#### Validation receipts and Ledger details

```text
ValidationKindV1 = 'TEST_RED'|'WORKER_GREEN'|'REGRESSION'|
                   'FINAL_VALIDATION'|'VALIDATOR'
ValidationScopeV1 = 'ACCEPTANCE_CRITERION'|'WORKER_OUTPUT'|'AFFECTED_SUITE'|
                    'TEST_ASSET_RETIREMENT'|'CANDIDATE'|'VALIDATOR_REVIEW'
ValidationStatusV1 = 'COMPLETED'|'START_FAILED'|'INTERRUPTED'
ValidationVerdictV1 = 'PASS'|'FAIL'
ValidationFailureCodeV1 = 'PROCESS_START_FAILED'|'TIMEOUT'|'NONZERO_EXIT'|
                          'SIGNAL_EXIT'|'RECEIPT_INVALID'|'SUBJECT_MISMATCH'
```

`ValidationReceiptV1` is exactly `{validation_id,validation_kind,validation_scope,status,verdict:null|ValidationVerdictV1,failure_code:null|ValidationFailureCodeV1,command_definition_sha256,receipt_sha256,subject_sha,candidate_sha:null|git_sha,validator_head:null|git_sha,idempotency_id}`. `COMPLETED` requires verdict and null failure code; START_FAILED/INTERRUPTED require null verdict and one validation failure code. Legal kind/scope pairs are only `TEST_RED/ACCEPTANCE_CRITERION`, `WORKER_GREEN/WORKER_OUTPUT`, `REGRESSION/AFFECTED_SUITE`, `REGRESSION/TEST_ASSET_RETIREMENT`, `FINAL_VALIDATION/CANDIDATE`, and `VALIDATOR/VALIDATOR_REVIEW`. The first four require null Candidate/Validator Heads. FINAL_VALIDATION requires Candidate SHA and null Validator Head. VALIDATOR requires Candidate SHA and `validator_head == candidate_sha`. These validation failures never borrow Agent failure enums.

The seven Ledger `detail` variants are closed: `CONTROLLER_COMMAND {command_kind,command_id,body_sha256,signature_sha256,verified_key_id,receipt_digest,evidence_refs,admission:null|{command_id,body_sha256,idempotency_id},ready_state_sha256:null|sha256}`; `AGENT_RUN` is one of the six exact detail variants above; `VALIDATION_RESULT` is the complete `ValidationReceiptV1`; `CANDIDATE_COMMITTED {candidate_sha,parent,tree,branch,staged_paths_sha256}`; `BRANCH_PUSHED {candidate_sha,prior_remote_head,remote_head,validator_head,freeze_status:'FROZEN'|'NOT_FROZEN'}`; `HANDOFF_READY {handoff_sha256,candidate_sha,pr_number,pr_head,delivery_id}`; `BLOCKED {blocked_reason,next_action,evidence_refs}`. A DISPATCH command detail requires admission equal the READY state's three fields and non-null computed READY hash; all other command kinds require both fields null. Every detail inherits the record-level event/idempotency/change/state/subject fields. Controller receipt linkage occurs only in CONTROLLER_COMMAND.

### Closed stop disposition and local pause

Every `BlockedReasonV1` maps to exactly one action:

| Blocked reason | Next action |
|---|---|
| `SAFE_WORKTREE_INTERRUPTION`, `SAFE_MECHANICAL_INTERRUPTION`, `AGENT_START_FAILED` | `RESUME` |
| `WORKER_GREEN_FAILURE`, `REGRESSION_FAILURE`, `TEST_ASSET_RETIREMENT_FAILURE`, `FINAL_VALIDATION_FAILURE`, `VALIDATOR_FIRST_IN_SCOPE_FAIL`, `VALIDATOR_SECOND_FAIL` | `REVISION` |
| `RELEASE_SYNC_FAILED` | `RELEASE` |
| `DISPATCH_ORPHAN_READY`, `CANDIDATE_COMMIT_AMBIGUOUS`, `BRANCH_PUSH_AMBIGUOUS`, `LEDGER_APPEND_AMBIGUOUS`, `FINAL_HANDOFF_PR_AMBIGUOUS`, `AGENT_INTERRUPTED`, `AGENT_EVIDENCE_AMBIGUOUS`, `SPEC_FAILURE`, `TEST_CAUSAL_RED_UNAVAILABLE`, `VALIDATOR_OUT_OF_SCOPE_FAIL`, `WORKTREE_DIRTY_CONFLICT`, `CANDIDATE_IDENTITY_CONFLICT`, `AUTHORITY_CONFLICT`, `CONTRACT_CHANGE_REQUIRED`, `SCOPE_CHANGE_REQUIRED`, `ARCHITECTURE_CHANGE_REQUIRED`, `DEPENDENCY_CHANGE_REQUIRED`, `PERMISSION_CHANGE_REQUIRED`, `HOST_CHANGE_REQUIRED`, `POINTER_STATE_CONFLICT`, `EVIDENCE_CONFLICT` | `MANUAL_CONTROLLER_STOP` |

`DISPATCH_ORPHAN_READY` now means the active slot is reserved but the READY/admission-event tuple is absent, incomplete, or conflicting; it never authorizes automatic completion or pointer replacement. The four high-value ambiguity reasons are manual after their one deterministic readback; durable BLOCKED stores no stale `run` replay instruction. `AGENT_START_FAILED` is RESUME-safe only because START_FAILED proves no child began. `AGENT_INTERRUPTED` never permits RESUME or result replay because child effects may exist. Validation `START_FAILED` or `INTERRUPTED` maps by the already selected kind: TEST_RED to `TEST_CAUSAL_RED_UNAVAILABLE`; WORKER_GREEN to `WORKER_GREEN_FAILURE`; either REGRESSION scope to its corresponding `REGRESSION_FAILURE` or `TEST_ASSET_RETIREMENT_FAILURE`; FINAL_VALIDATION to `FINAL_VALIDATION_FAILURE`; and VALIDATOR to the applicable first, second, or out-of-scope Validator reason. A first in-scope Validator FAIL normally consumes the one automatic repair; the `VALIDATOR_FIRST_IN_SCOPE_FAIL` reason applies only when that automatic transition was not completed and MacBook must issue a same-scope REVISION. REVISION always binds the same Change/Worktree/branch/baseline/scope and enters TEST_RED. RESUME is allowed only for the stored no-code/no-Test target and cannot replay an ambiguous Agent result or skip a failed Gate.

Every `LocalPauseReasonV1` also maps exactly once: `EVIDENCE_REF_UNAVAILABLE -> IDENTICAL_COMMAND_REPLAY`; `EVIDENCE_REF_CONFLICT | ORPHAN_READY_CONFLICT | POINTER_STATE_CONFLICT -> MANUAL_CONTROLLER_STOP`.

`local-pause.json` contains exactly `LocalPauseDiagnosticV1 | null`. The non-null schema is `{schema_version:'1.0',diagnostic_id,change_id:null|string,reason:LocalPauseReasonV1,operation:'applyControllerCommand'|'run'|'settlement',request_sha256,request_idempotency_id,next_action:NextActionV1,command_id:null|string,event_id:null|string,expected_evidence_tip:null|git_sha,expected_event_hash:null|sha256,state_version:null|integer,state_hash:null|sha256,created_at,supersedes_diagnostic_id:null|string}`. It contains no request bytes, signature, credential, secret, prompt, or model output. The caller retains and resubmits the exact original public request; Coordinator recomputes its canonical request hash/idempotency identity and rejects any mismatch.

The file is atomically written/read back; a diagnostic ID is immutable across restart and projected by STATUS. After external Evidence Ref availability is restored, `EVIDENCE_REF_UNAVAILABLE` is cleared only by replaying the exact stored operation identity, exact remote event readback, and successful state-receipt persistence, followed by atomic null write/readback. If the same replay reaches a new Evidence-unavailable observation, a new diagnostic may supersede the old only after atomic write/readback and must name the old ID. Conflict/manual-stop diagnostics are neither cleared nor superseded automatically; they remain until an explicitly approved resolution is applied through an existing signed Controller command/public interface. Evidence unavailability cannot create a durable BLOCKED event or advance a Gate.

### Ledger append publication

The authoritative remote ref is exactly `refs/heads/evidence/agent-runs`. An accepted `change_id` matches `^CHG-[a-z0-9]+(?:-[a-z0-9]+){0,15}$`, is at most 128 UTF-8 bytes, and therefore contains no slash, dot segment, escape, uppercase alias, or path collision. Its sole authoritative tree path is `ledger/<change_id>.jsonl`; the unpublished local working copy remains `ledger-work/<change_id>/ledger.jsonl` and is never authoritative.

Each record is its canonical UTF-8 JSON bytes followed by exactly one LF. BOM, CR, blank lines and embedded LF are forbidden. The first record begins at byte offset zero; every non-empty file ends in exactly one LF. `event_hash` is computed over the canonical event object without `event_hash`; the stored canonical object includes that hash before its one framing LF. `record_offset` is the prior file byte length and `record_length` includes the framing LF.

Absent Evidence Ref is represented by `tip:null`, `commit:null`, `tree:null`, absent current path, SHA-256 of empty bytes, and length zero. The first append creates the first normal evidence commit with no parent and creates the ref by normal non-force push. Later appends require the exact remote tip and exact prior path bytes/hash. If the ref exists but this Change path does not, the ref tip/tree are non-null while prior path bytes are the same empty representation.

Existing Ledger gateway operations use only these receipts:

```text
LedgerRemoteReadReceiptV1 = {
  remote_ref, expected_tip:null|git_sha, tip:null|git_sha,
  tip_parent:null|git_sha, tip_tree:null|git_sha, authoritative_path,
  file_present:boolean, prior_bytes_sha256, prior_byte_length,
  last_event_id:null|string,last_event_hash:null|sha256,last_sequence:integer
}
LedgerPreparedAppendReceiptV1 = {
  remote_ref,expected_tip:null|git_sha,authoritative_path,
  prior_bytes_sha256,prior_byte_length,new_bytes_sha256,new_byte_length,
  event_id,event_hash,sequence,record_offset,record_length,
  idempotency_id,prepared_bytes_sha256
}
LedgerEvidenceCommitReceiptV1 = {
  remote_ref,parent_tip:null|git_sha,commit_sha,tree_sha,authoritative_path,
  changed_paths:[authoritative_path],preserved_entries_sha256_before,
  preserved_entries_sha256_after,prior_bytes_sha256,prior_byte_length,
  new_bytes_sha256,new_byte_length,event_id,event_hash,sequence,
  record_offset,record_length,idempotency_id,push_status:'ACKNOWLEDGED'|'RESPONSE_LOST'
}
LedgerRemoteAppendReceiptV1 = {
  remote_ref,tip,parent_tip:null|git_sha,commit_sha,tree_sha,
  authoritative_path,prior_bytes_sha256,prior_byte_length,
  new_bytes_sha256,new_byte_length,event_id,event_hash,sequence,
  record_offset,record_length,record_bytes_sha256,idempotency_id,
  linearized:true
}
LedgerPartialReceiptV1 = {
  stage:'PRIOR_TIP_READ'|'LOCAL_PREPARED'|'EVIDENCE_COMMIT_CREATED'|
        'PUSH_SENT'|'REMOTE_REF_READ'|'REMOTE_COMMIT_READ'|
        'REMOTE_RECORD_READ'|'STATE_RECEIPT_PERSISTED'|'LOCAL_PAUSE_CLEARED',
  expected_tip:null|git_sha,commit_sha:null|git_sha,event_id,event_hash,
  idempotency_id,receipt_sha256
}
```

Signatures remain the existing four: `readRemote({remote_ref:'refs/heads/evidence/agent-runs',expected_tip:null|git_sha,change_id}) -> GatewayResultV1<LedgerRemoteReadReceiptV1,LedgerPartialReceiptV1>`; `prepareAppend({remote_read_receipt_sha256,expected_tip:null|git_sha,prior_bytes,event_bytes}) -> GatewayResultV1<LedgerPreparedAppendReceiptV1,LedgerPartialReceiptV1>`; `commitAndPush({prepared_receipt:LedgerPreparedAppendReceiptV1,idempotency_id}) -> GatewayResultV1<LedgerEvidenceCommitReceiptV1,LedgerPartialReceiptV1>`; `readRemoteAppend({expected_commit,event_id,event_hash,idempotency_id}) -> GatewayResultV1<LedgerRemoteAppendReceiptV1,LedgerPartialReceiptV1>`. No gateway method is added.

The evidence commit changes only `ledger/<change_id>.jsonl`; the canonical sorted tree-entry bytes excluding that path must hash identically before and after as the two preserved-entry hashes. Exact remote ref + commit + tree + path + record bytes readback is the only linearization point. A local working copy, local prepared receipt, unpushed commit, push acknowledgement, or lost push response is non-authoritative. Exact already-published bytes converge; confirmed absence at the unchanged predecessor permits one same-identity attempt; conflict enters manual stop; remote ambiguity records the exact partial receipt and uses the existing Ledger append readback boundary. State progress and local-pause clear occur only after the linearized remote receipt is persisted/read back in state. These partial stages are typed observations, not new macro states, events, mutexes, gateway methods, or recovery boundaries.
