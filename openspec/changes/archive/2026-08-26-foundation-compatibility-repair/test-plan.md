# Test Plan: Foundation Compatibility Repair

## Status and Isolation

- Current status: planned only; no Test has been written or run for this Change.
- Test owner after Controller Spec Gate PASS: fresh `juaner_test`.
- Exact write path: `tools/harness/change-coordinator/coordinator.test.mjs`.
- Production, fixtures, adapters, CLI, runner, dependencies, governance, project-control, and canonical specs remain frozen during RED.
- All tests use existing deterministic harness facilities; no live Agent, GitHub, key, host, network, provider, or product effect is permitted.

## Preflight

Before writing RED, Test records:

1. helper health independent of missing FCR behavior;
2. baseline Head and hashes of Test, Coordinator, Adapter, and canonical spec;
3. current focused-suite result and count;
4. absence of skip/todo/only or temporary tracked probes introduced by this Change;
5. exact one-file Test diff and lifecycle classification; and
6. the four intended causal failure signatures.

An environment, helper, or frozen-fixture failure is not an FCR RED and returns `BLOCKED`.

## Planned Test Identities

| Test ID | Causal behavior | Canonical AC mapping |
|---|---|---|
| `TEST-FCR-001` | generic canonical product Change admission plus second-Change WIP rejection | AC-DTF-001-02, AC-DTF-002-02, AC-DTF-002-08 |
| `TEST-FCR-002` | exact `AWAITING_CONTROLLER` Frozen-Candidate signed REVISION plus binding negatives | AC-DTF-003-01, AC-DTF-004-07 |
| `TEST-FCR-003` | first/later Candidate ancestry and exact same-branch/PR publication history | AC-DTF-004-01, AC-DTF-004-03, AC-DTF-004-04, AC-DTF-004-07, AC-DTF-005-01, AC-DTF-005-03, AC-DTF-005-04 |
| `TEST-FCR-004` | four canonical settlements and Coordinator-only pre-request `NOT_STARTED` | AC-DTF-002-05, AC-DTF-002-06, AC-DTF-005-01 |

These Tests exercise existing canonical ACs. They do not create new ACs.

## TEST-FCR-001 — Generic Admission and WIP

### Positive causal leaf

Submit a complete canonical, verifier-accepted DISPATCH using a valid non-Foundation product Change ID. Assert pointer-first admission reaches the existing `APPLIED/READY` result and preserves the existing pointer/state/admission-event order.

Baseline RED cause: the current Foundation-only equality check rejects this otherwise valid Change.

### Negative and forbidden-side-effect leaves

- With the first valid product Change active, submit a different valid Change and require `WIP_AUTHORITY_INVALID` before another state, Ledger, Worktree, Agent, Git, PR, or Handoff effect.
- Retain existing malformed/canonical/signature/repository/scope/pointer negatives; the repair must not make them pass.
- Assert no Change enumeration, default ID, fallback admission, or second pointer write appears.

## TEST-FCR-002 — Review Revision

### Positive causal leaf

Prime an exact `AWAITING_CONTROLLER` state with one Frozen Candidate and matching Validator, remote branch, PR Head, delivery, accepted DISPATCH, state version/hash, and signed `changes_requested` evidence subject. Submit a same-repository/Change/Worktree/branch/baseline/scope REVISION naming that Candidate.

Require:

- existing command verification and CAS are reached;
- result is `APPLIED` with `EXECUTING/TEST_RED`;
- state version increments once;
- `authorization_cycle.command_kind == REVISION` and `auto_repair_attempt == 0`;
- prior Candidate and delivery predecessor identities remain durable;
- no Spec/Acceptance/route/scope replacement and no Agent request occurs in the command call.

Baseline RED cause: the current branch accepts only `BLOCKED + VALIDATOR_SECOND_FAIL`.

### Preserved existing path

Retain a positive leaf for `BLOCKED + VALIDATOR_SECOND_FAIL` returning to `TEST_RED` with the fresh zero repair budget.

### Negative and forbidden-side-effect leaves

Independently mutate Candidate SHA, frozen status, Validator/remote/PR Head, repository, Change, Worktree root, branch, baseline, allowed or forbidden scope, `resume_phase`, state version, state hash, receipt/signature, evidence presence, or evidence subject. Each mutation must reject or stop through an existing outcome before state write, Ledger/Agent request, Worktree, stage/commit/push, PR, or Handoff effect.

## TEST-FCR-003 — Candidate Chain and Publication

### First Candidate leaf

With no durable prior Candidate, require exact Worktree inspection/stage/readback, `commitCandidate.expected_parent == baseline_sha`, exact commit readback, and a complete existing `CANDIDATE_COMMITTED` detail.

### Later Candidate leaves

Exercise both:

1. a Candidate produced after one automatic Validator repair; and
2. a Candidate produced after an accepted signed REVISION.

For each, require the new commit parent to equal the exact durable prior local Candidate, never the baseline. Require `inspectWorktree`, `stageExact`, `readStaged`, `commitCandidate`, and `readCommit` to bind that predecessor and exact branch/tree.

For publication:

- when `delivery.remote_head == null`, retain the existing first push plus post-push readback and assert no pre-push `readRemoteBranch` call;
- when `delivery.remote_head` is non-null, require a pre-push `readRemoteBranch` result exactly equal to that old Head;
- require the normal push to carry that predecessor and never force/delete;
- read back the new remote Head;
- when a prior PR exists, query/read back the same PR number/base/head branch with the new Head and do not call PR creation;
- when no prior PR exists, retain the existing bounded create-or-reuse path;
- produce the later Handoff only after new Candidate/Validator/remote/PR equality.

Baseline RED cause: current commit always uses baseline and current branch publication lacks the closed predecessor/update checks.

### Negative and forbidden-side-effect leaves

- A later Candidate attempt using baseline as parent blocks before commit.
- Old Worktree Head, wrong branch, staged-tree mismatch, or commit parent/tree/readback mismatch blocks without push/PR/Handoff.
- Wrong/absent/unavailable/ambiguous old remote Head blocks an already-published branch update before push.
- Automatic repair before the first push keeps the old local Candidate as the new commit parent while `delivery.remote_head` remains null; it must use the first-publication path without an absence read.
- Non-fast-forward or post-push wrong Head blocks before PR/Handoff and later `run` does not replay the ambiguous push.
- Missing/replaced/multiple/wrong-base/wrong-head prior PR blocks; it must not create a replacement.
- Assert old Candidate Git object, prior Validator/validation facts, and prior Ledger events remain represented; no overwrite/delete/force method or new event class is called.

## TEST-FCR-004 — Settlement and `NOT_STARTED`

### Canonical positive leaves

- Accept `STARTED` and `RESULT` only with the exact existing binding and shapes.
- For each `START_FAILED` code (`SPAWN_REJECTED`, `ROUTE_UNAVAILABLE`, `SANDBOX_UNAVAILABLE`, `START_TIMEOUT`), accept the closed settlement and follow the existing `AGENT_START_FAILED` stop action.
- For each `INTERRUPTED.reason_code` (`USER_INTERRUPTED`, `HOST_INTERRUPTED`, `AGENT_EXITED`, `RESULT_UNREADABLE`), test both legal child-identity nullability where applicable and follow the existing `AGENT_INTERRUPTED` stop action.

### `NOT_STARTED` causal leaf

Make Worktree verification fail before the Spec Agent request. Require one Coordinator-authored existing `AGENT_RUN/NOT_STARTED` detail with `PRECONDITION_FAILED`, no correlation or child identity, no `REQUESTED` event, no returned `AGENT_ACTION`, and the existing fail-closed stop disposition.

### Negative and forbidden-side-effect leaves

- Reject `NOT_STARTED` as settlement with pending state unchanged and no Ledger/state progress.
- Reject old failure codes, `interruption_code`, missing/extra fields, wrong child nullability, wrong binding, and unknown variants.
- No invalid settlement may clear pending Agent, advance phase, write result evidence, or issue any mechanical effect.

## Planned Execution and Evidence

RED and GREEN use the same focused command:

```text
node --test tools/harness/change-coordinator/coordinator.test.mjs
```

Also planned:

```text
node --check tools/harness/change-coordinator/coordinator.test.mjs
node --check tools/harness/change-coordinator/coordinator.mjs
tools/harness/validation/run
git diff --check
```

Evidence records exact command, exit code, Test count, failed/passed identities, output digest, Test/production hashes, baseline/Candidate Head, environment entrypoint, and scope diff. No result is claimed until actually run.

## Test Asset Retirement

All FCR causal Tests are planned permanent regressions because they protect current canonical ACs and safety boundaries. Test must reconcile the one modified file, all retained existing tests and helper imports, equivalent-case risk, and absence of temporary assets in this plan. Worker may not edit Test to obtain PASS.

The lifecycle ledger is kept in this Test Plan rather than a separate mechanism document:

| Asset / Test ID | Class | Current evidence owner | Planned disposition |
|---|---|---|---|
| `TEST-FCR-001` | permanent regression | FCR-1 and its mapped canonical ACs | retain after GREEN |
| `TEST-FCR-002` | permanent regression | FCR-2 and its mapped canonical ACs | retain after GREEN |
| `TEST-FCR-003` | permanent regression | FCR-3 and its mapped canonical ACs | retain after GREEN |
| `TEST-FCR-004` | permanent regression | FCR-4 and its mapped canonical ACs | retain after GREEN |
| temporary diagnostics, if needed | temporary evidence | diagnosis only | keep under `/private/tmp`; do not track |

Before Validator dispatch, Controller reconciles the complete Test diff against this ledger, runs `ponytail-review` on that diff, confirms distinct current consumers and retained helper/fixture consumers, checks skip/todo/only and temporary/equivalent cases, reruns affected commands after any Test-only correction, and records exact hashes/counts plus `PASS` or `FAIL`. Production remains frozen during any Test-only return.

## Stop Line

Test returns `BLOCKED` if causal RED requires a fixture/adapter/CLI/runner/dependency/canonical-spec edit, a new public or durable contract element, a weaker old assertion, a live effect, or an implementation-specific source scan instead of observable behavior.
