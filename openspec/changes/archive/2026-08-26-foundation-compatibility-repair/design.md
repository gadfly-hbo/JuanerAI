# Design: Foundation Compatibility Repair

## Design Decision

This is a conformance-only patch to the existing Coordinator core. The released Dual-device Transition Foundation canonical specification and archived Design remain the sole normative authority. This Design introduces no new contract, mechanism, state, event, Gateway, lock, recovery path, or external effect.

The implementation seam remains:

```text
canonical signed command / exact run or settlement request
-> existing input and verifier checks
-> existing one operation mutex
-> existing pointer/state CAS and readback
-> existing restricted Agent/Git/Ledger/PR/Handoff operations
-> existing result and stop disposition
```

## Frozen Baseline

- repository Head: `713350494df4fa1af587cb7bfef392aa1c06f067`
- production target: `tools/harness/change-coordinator/coordinator.mjs`
- Test target: `tools/harness/change-coordinator/coordinator.test.mjs`
- frozen Adapter: `tools/harness/change-coordinator/adapters.mjs`
- canonical spec baseline SHA-256: `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`

## FCR-1 — Generic Canonical Change Admission

The current DISPATCH branch has an implementation-only equality check for `CHG-dual-device-transition-foundation`. Remove only that specialization.

Admission continues to require, in existing order:

1. canonical closed command bytes, including a Change ID that already satisfies the published schema;
2. deterministic verifier success for the exact signed body;
3. repository, scope, worktree, time, nonce, receipt, evidence, and pointer bindings;
4. exact initialized empty-pointer hash for a first DISPATCH;
5. pointer publication/readback before READY state and admission Ledger evidence; and
6. rejection of any different Change while `active_change_id` is non-null.

No new Change-ID grammar, default Change ID, Change scan, Ledger scan, branch scan, alias, or compatibility fallback is introduced. The second-Change negative remains effect-free before state/Ledger/Worktree activity.

## FCR-2 — Closed `AWAITING_CONTROLLER` Revision Admission

The existing accepted `BLOCKED + VALIDATOR_SECOND_FAIL` revision remains available. A second admissible source state is added for an exact review return:

```text
AWAITING_CONTROLLER
+ current candidate exists and is frozen
+ candidate SHA == validator Head == remote Head == PR Head
+ revision_of_candidate_sha == current candidate SHA
+ canonical signed changes_requested evidence
+ exact current state version/hash
+ same repository/change/worktree/branch/baseline/scope as accepted DISPATCH
-> EXECUTING / TEST_RED
```

The revision payload remains the existing closed shape. `resume_phase` is exactly `TEST_RED`; `WORKER_GREEN` is not an alternate revision entrance. The existing accepted signed DISPATCH remains route, Spec-input, Acceptance-ID, validation, and scope authority; accepting a REVISION does not replace or widen it.

`changes_requested_ref`, `receipt_digest`, and the existing canonical `evidence_refs` are carried inside the verified signed body. For an `AWAITING_CONTROLLER` revision, the evidence subject is the exact Frozen Candidate. Missing, empty, wrong-subject, or unverifiable decision evidence is rejected through existing input/signature/state/scope outcomes before a state write or Agent request.

On success the Coordinator atomically writes/readbacks only the existing next state:

- `macro_state: EXECUTING`;
- `phase: TEST_RED`;
- `pending_agent: null`;
- `blocked_reason: null` and `resume_target: null`;
- incremented `state_version`;
- new `authorization_cycle` with the REVISION command ID, kind `REVISION`, and `auto_repair_attempt: 0`; and
- updated `last_controller_command_id`.

The durable current Candidate and delivery identities remain available as the predecessor for FCR-3. A wrong Candidate, state/hash, repository, scope, Worktree, branch, baseline, receipt, or evidence subject rejects before mutation. No Spec or Acceptance change is expressible through this path.

## FCR-3 — Candidate Ancestry and Same-branch Publication

### Local Candidate predecessor

At the next STAGE/CANDIDATE_COMMIT cycle, derive one local predecessor from durable state:

```text
expected_parent = state.candidate?.sha ?? state.repository.baseline_sha
```

- With no prior Candidate, the first Candidate parent is the baseline.
- After automatic repair or any signed REVISION, the next Candidate parent is the exact durable current Candidate.

Before commit, reuse the existing operations in this order:

1. `inspectWorktree` with exact branch and `expected_head == expected_parent`;
2. `stageExact` with the signed path set and `expected_head == expected_parent`;
3. `readStaged` and require exact staged receipt equality;
4. `commitCandidate` with `expected_parent` and the read-back index tree; and
5. `readCommit` and require SHA/parent/tree/branch identity.

A baseline parent after a prior Candidate, old Worktree Head mismatch, incomplete staged identity, or commit/readback mismatch uses the existing Candidate/worktree manual-stop disposition. It does not retry with a different parent.

The existing `CANDIDATE_COMMITTED` event records the new Candidate plus its parent/tree/branch/staged-path digest. The prior Candidate commit, prior Validator and validation events, and prior Ledger records are never overwritten or deleted.

### Remote predecessor and fast-forward update

Candidate ancestry and remote publication identity are distinct existing identities:

- local Git parent: the durable Candidate that preceded this commit;
- remote predecessor for an update: the durable prior published `delivery.remote_head`.

This distinction is necessary for a Validator auto-repair before the first branch push: the repaired commit has the failed local Candidate as parent while durable `delivery.remote_head` remains null. That case retains the existing first normal-push plus post-push readback path and does not call `readRemoteBranch` before push. For a PR `REVISION` from `AWAITING_CONTROLLER`, durable `delivery.remote_head` is the exact old Frozen Candidate.

When durable `delivery.remote_head` is non-null, call `readRemoteBranch` before push and require exact equality to that old Head, then pass the same predecessor through the existing push request. When durable `delivery.remote_head` is null, preserve the existing first-publication path: no pre-push absence proof and no pre-push `readRemoteBranch`; perform the existing normal push and its post-push readback. Only the existing non-force, non-delete push may run. Post-push readback always requires the new Candidate SHA. Conflict, non-fast-forward, unavailable, or ambiguous readback follows the existing branch-push manual-stop boundary and must prevent PR/Handoff progress.

### Same PR and new Handoff

- If durable delivery already identifies a PR, `queryCurrent` and `readback` must resolve that same repository/base/head-branch/PR identity with the new Candidate Head. A missing, multiple, replaced, wrong-base, or wrong-head PR blocks; no replacement PR is created.
- Before the first PR exists, the existing create-or-reuse path remains available after successful first remote publication.
- A later Handoff is generated and read back against the new Candidate/remote/Validator/PR identities using the existing Handoff gateway and event class.
- Prior Candidate, Validator, branch-push, PR/Handoff, and Ledger history remains immutable evidence.

No update-PR method is added: a normal fast-forward update of the same head branch updates the existing PR, and existing query/readback proves the new Head.

## FCR-4 — Canonical Agent Settlement and Coordinator `NOT_STARTED`

`settlement` accepts exactly the four already published variants:

```text
STARTED
RESULT
START_FAILED
INTERRUPTED
```

The exact repair is:

- `START_FAILED.failure_code` is one of `SPAWN_REJECTED`, `ROUTE_UNAVAILABLE`, `SANDBOX_UNAVAILABLE`, or `START_TIMEOUT`;
- `INTERRUPTED` carries `reason_code` in `USER_INTERRUPTED`, `HOST_INTERRUPTED`, `AGENT_EXITED`, or `RESULT_UNREADABLE`, and `observed_child_id` is string or null;
- old `SPAWN_FAILED`, `POLICY_DENIED`, `CAPACITY_UNAVAILABLE`, `PROCESS_INTERRUPTED`, `TIMEOUT`, `HOST_LOST`, and `interruption_code` inputs reject;
- `NOT_STARTED` always rejects as a settlement.

When an existing Agent-dispatch precondition fails before `AGENT_RUN/REQUESTED` is written and before an `AGENT_ACTION` can be returned, the Coordinator may append/read back the existing `AGENT_RUN/NOT_STARTED` detail with `reason_code: PRECONDITION_FAILED`, no correlation ID, and no child identity, then follow the already selected stop disposition. The causal Test uses failed Worktree verification before the Spec request. It must prove there was no REQUESTED event, no returned action, and no host settlement.

No stage, field, event class, blocked reason, action, or Agent binding is added.

## Failure and Side-effect Ordering

All four repairs retain fail-closed ordering:

```text
shape/canonical/signature
-> pointer and current state/version/hash
-> repository/scope/worktree/candidate/evidence admission
-> one bounded existing effect
-> deterministic existing readback
-> existing Ledger/state persistence
```

Every negative Test checks both the returned stable rejection/stop and forbidden effects. A failed pre-effect check cannot write pointer/state, request an Agent, stage/commit/push, create/update a PR, or write Handoff. A publication ambiguity cannot retry after durable manual stop.

## Data and Security Boundaries

No business data, prompt, raw model output, credential, secret, private key, environment dump, or live external receipt is introduced. All evidence uses deterministic doubles and bounded identities already supported by the Foundation Test harness. Real trust and host validation remain Mode Activation work.

## Activation and Rollback

The repaired module remains inactive. Rollback is the exact Git-level reversal of this Change under current governance; it cannot alter canonical specification bytes or erase prior evidence. Any rollback needing a second implementation shape or compatibility mode is outside this Change.

## Implementability Stop Line

The repair is implementable in the frozen Test and Coordinator files. If Test or Worker finds that conformance requires changing Adapter behavior, fixtures, CLI, runner, dependency, canonical spec, command schema, state, event, Gateway, lock, recovery, authority, or host configuration, return `BLOCKED` to the Controller instead of extending this Design.
