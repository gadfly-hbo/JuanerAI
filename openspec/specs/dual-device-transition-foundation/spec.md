# Dual-device Transition Foundation — Reduced V1 Specification

## Capability Contract

- Change: `CHG-dual-device-transition-foundation`
- Mode: inactive Foundation only
- Controller: MacBook Integration Controller
- Coordinator: Mac mini Change Execution Coordinator
- Global write-capable WIP: exactly `1`
- Public interfaces: exactly `4`
- Macro states: exactly `6`
- Ledger event classes: exactly `7`
- Mutexes: exactly `1` process-owned short operation mutex
- Automatic recovery boundaries: exactly `4`

`SHALL`, `SHALL NOT`, `MUST`, and `MUST NOT` are normative. Unknown or noncanonical commands, fields, paths, states, phases, events, effects, receipts, settlements, Heads, hashes, or authority fail closed. Reduced V1 has no compatibility obligation to the old seven-operation, nineteen-state, seventeen-event, dual-lock, universal-recovery contract.

## Stable Fail-closed Contract

Before an admitted effect, input/schema/path validation precedes command authentication, WIP/state/version admission, scope/Gate admission, effect issuance, deterministic readback, Ledger append/readback, and state persistence. Failure at an earlier step SHALL prevent every later effect.

Invalid or forged input SHALL return only the stable sanitized error named in Design and SHALL NOT mutate pointer, state, Worktree, Candidate, Ledger, PR, Handoff, `main`, product, project-control, host, or Agent state. An admitted execution ambiguity SHALL enter `BLOCKED` only when the local state and durable Ledger write are themselves provable. Ledger failure SHALL NOT be reported as a durable `BLOCKED` event.

## Canonical Controller Repository Identity

For all four signed command kinds `DISPATCH`, `REVISION`, `RESUME`, and `RELEASE`, `ControllerCommandBodyV1.repository` SHALL be exactly the following closed four-field object:

```text
{
  repository_id: 'gadfly-hbo/JuanerAI',
  canonical_root,
  origin: 'origin',
  integration_branch: 'main'
}
```

All four fields are required and are part of the complete canonical UTF-8 body signed as one byte string. Exact-schema validation SHALL reject a missing, extra, renamed, aliased, or noncanonical field and any `repository_id` other than `gadfly-hbo/JuanerAI` before protected effects. This current canonical four-field definition replaces the historical archived Design's three-field `ControllerCommandBodyV1.repository` definition. The historical three-field shape SHALL NOT be accepted as a compatibility form. This correction adds no State field, event, Gateway, lock, recovery boundary, or alternate command shape.

## Requirements

### REQ-DTF-001 — Controller Authority, WIP, and Public Surface

The Foundation SHALL expose one inactive four-interface Coordinator and enforce MacBook Controller / Mac mini execution ownership with Global WIP exactly one.

- **AC-DTF-001-01:** The public Coordinator library SHALL expose only `applyControllerCommand`, `run`, `settlement`, and `status`; internal stage, Gate-advance, recovery, revision, publish, cleanup, raw Git, and raw GitHub operations SHALL be uncallable. A production mutating CLI SHALL only submit canonical signed bytes to the Activation-owned host-loop ingress or remain unavailable, plus query read-only `status` locally or through authenticated SSH. It SHALL NOT construct a production Coordinator, expose `run`/`settlement` mutation commands, open the state root, inject verifier/gateways, or preserve Tests asserting those bypasses.
- **AC-DTF-001-02:** The one initialized Mac mini `active-change.json` with exact field `active_change_id` SHALL be the only WIP authority. A missing, malformed, conflicting, or multiply interpreted pointer SHALL block; no Ledger/Evidence Ref/branch/PR scan SHALL infer WIP=0.
- **AC-DTF-001-03:** `applyControllerCommand` SHALL accept only `DISPATCH`, `REVISION`, `RESUME`, or `RELEASE` whose complete canonical body contains every field frozen in Design as amended by the canonical four-field repository definition above and is signed as one byte string; only signature bytes may be outside that body. Invalid repository identity/schema, binding, time, nonce, replay identity, state version/hash, receipt digest, evidence, or signature SHALL fail before protected effect.
- **AC-DTF-001-04:** Foundation SHALL use only a deterministic verifier contract and SHALL reject any public key or trust source injected through command payload, environment, ordinary CLI argument, repository/state file, or Mac mini-writable path. Real keys and production trust are Activation-only.
- **AC-DTF-001-05:** `applyControllerCommand`, `run`, and `settlement` SHALL serialize state/effect writes through exactly one process-owned short operation mutex; `status` SHALL be read-only. The mutex SHALL be released while awaiting a future Agent settlement or Controller command, and no file lock, long Change lock, stale-lock protocol, or automatic stealing SHALL exist.
- **AC-DTF-001-06:** The Coordinator SHALL not poll, schedule, auto-admit, or launch the next Change and SHALL not use GitHub Issues/Projects, daemon, queue, background worker, project-control v2, or cross-Change parallelism.
- **AC-DTF-001-07:** Mode Activation's one trusted Mac mini host-loop process SHALL be the sole production physical writer: it SHALL own the production verifier/state-root/gateway composition, execute all three mutation interfaces under the same one mutex, and reject any ordinary caller or CLI attempt to inject trust/gateways or open mutation state. Tests SHALL use a separate test-only deterministic factory absent from that CLI surface.
- **AC-DTF-001-08:** Inputs and outcome-specific results SHALL be the closed Design unions. `status` SHALL return only `STATUS {payload:StatusDiagnosticsV1}` with exact nullability and `PendingActionV1`. All contract/domain pre-effect rejection SHALL return `CoordinatorErrorV1`, not throw, and SHALL follow the exact ingress/CLI exit mapping. Gateway failures SHALL use only `GatewayReasonV1` in its permitted variants; post-admission failure SHALL use BLOCKED/local pause rather than masquerade as REJECTED.

### REQ-DTF-002 — Six-state Serial Execution and Agent Evidence

The Coordinator SHALL automatically and serially execute one admitted Change through the exact six-state lifecycle and formal role order.

- **AC-DTF-002-01:** The only macro states SHALL be `READY`, `EXECUTING`, `DELIVERING`, `AWAITING_CONTROLLER`, `BLOCKED`, and `CLOSED`. The only phases SHALL be `WORKTREE`; `SPEC`, `TEST_RED`, `WORKER_GREEN`, `REGRESSION`; and `STAGE`, `CANDIDATE_COMMIT`, `FINAL_VALIDATION`, `VALIDATOR`, `BRANCH_PUSH`, `CANDIDATE_FREEZE`, `PR`, `HANDOFF`, grouped exactly as Design specifies.
- **AC-DTF-002-02:** A valid signed DISPATCH against exact initialized empty-pointer bytes SHALL atomically publish/read back the non-null active Change slot before creating/readback of one `READY` state; only a complete pointer + READY + admission-event identity permits `run` to create or reuse the exact Change Worktree and read back branch, baseline, common repository, and clean status before requesting Spec.
- **AC-DTF-002-03:** The normal path SHALL be Worktree -> fresh Spec -> fresh Test/causal RED -> fresh Worker/GREEN -> Regression including Test Asset Retirement -> exact Candidate -> final validation -> fresh Validator -> push/readback/freeze -> PR/readback -> Handoff -> `AWAITING_CONTROLLER`, with no per-Gate MacBook acknowledgement on the normal path.
- **AC-DTF-002-04:** `run` SHALL execute Worktree, Git, Ledger, validation, PR, and Handoff mechanics directly through restricted gateways. When an Agent is due it SHALL persist/readback `AGENT_RUN/REQUESTED` and return one exact `AGENT_ACTION`; it SHALL never launch an Agent or accept a mechanical action receipt from the host loop.
- **AC-DTF-002-05:** `settlement` SHALL accept only closed STARTED, RESULT, START_FAILED, or INTERRUPTED facts matching the outstanding correlation, child identity, role/route/sandbox, hashes, state version, phase, and subject. Exact replay SHALL be idempotent; missing STARTED, late/wrong/ambiguous/conflicting facts, parent-authored substitutes, route downgrade, or unreadable artifacts SHALL not advance.
- **AC-DTF-002-06:** `AGENT_RUN` SHALL distinguish exactly `REQUESTED`, `STARTED`, `RESULT`, `START_FAILED`, `INTERRUPTED`, and `NOT_STARTED`. `NOT_STARTED` SHALL mean no request was issued because a dispatch precondition failed and SHALL NOT be represented as another stage or Gate progress.
- **AC-DTF-002-07:** Any failed Gate, dirty or changed subject, missing evidence/readback, Agent start/result ambiguity, or unauthorized effect SHALL preserve available evidence and enter `BLOCKED`; it SHALL NOT skip phases, fabricate PASS, or continue to delivery.
- **AC-DTF-002-08:** DISPATCH SHALL verify/recheck exact empty-pointer bytes, atomically publish/read back `active_change_id == change_id` as its admission linearization point, then write/read back READY state containing only `{command_id,body_sha256,idempotency_id}`, compute but not embed its complete byte hash, and append/read back the matching durable `CONTROLLER_COMMAND`. Before successful pointer publication it SHALL write no READY/admission event. Every post-pointer crash/readback-loss window reserves Global WIP: missing/incomplete/conflicting state or event SHALL expose existing BLOCKED/manual-stop semantics, `status` SHALL never report empty/healthy active, `run` SHALL perform no effect, identical DISPATCH SHALL not auto-finish admission, and every different Change DISPATCH SHALL reject without cross-Change enumeration. Only the exact complete pointer/state/event tuple converges idempotently.

### REQ-DTF-003 — Revision, Resume, and One Bounded Validator Repair

The Coordinator SHALL allow correction only inside one frozen authorization cycle and SHALL return every authority ambiguity to MacBook.

- **AC-DTF-003-01:** A signed REVISION SHALL bind the same Change, Worktree, branch, baseline, Spec, Acceptance Criteria, scope, and expected state/version/hash, reference MacBook `changes_requested` evidence, start a new authorization cycle, reset `auto_repair_attempt` to `0`, and enter `EXECUTING/TEST_RED`. It SHALL bind the current Frozen Candidate when present and SHALL use `revision_of_candidate_sha:null` for a pre-Candidate implementation/Test defect.
- **AC-DTF-003-02:** Each DISPATCH or signed REVISION authorization cycle SHALL permit at most one automatic Validator repair. The repair SHALL atomically change `auto_repair_attempt` from `0` to `1` before requesting the finding-specific Test role; automatic repair itself, RESUME, and RELEASE SHALL never reset the counter.
- **AC-DTF-003-03:** Automatic repair SHALL require every Validator finding to be reliably classified as an implementation defect inside the unchanged Change/Worktree/branch/baseline/Spec/Acceptance/scope/dependency/permission/host boundary, and the new Test result SHALL establish a causal RED for that finding before Worker is requested.
- **AC-DTF-003-04:** A contract, architecture, scope, path, dependency, permission, or host change; an ambiguous finding; inability to form causal RED; wrong Head/evidence; Agent ambiguity; or a second Validator FAIL SHALL append available failure evidence and enter `BLOCKED` for MacBook decision.
- **AC-DTF-003-05:** Signed RESUME SHALL bind the same Change/Worktree/scope and exact expected state version/hash and name one stored safe resume phase requiring no code/Test change. It SHALL NOT skip a failed Gate, widen scope, change product/contract semantics, or reset repair budget; any required code/Test change SHALL use signed REVISION.
- **AC-DTF-003-06:** Every Worktree/mechanical, Agent START_FAILED/INTERRUPTED/evidence, Spec/Test/Worker/Regression/Retirement/final-validation/Validator, four-boundary, RELEASE, authority/contract/scope/architecture/dependency/permission/host, Evidence, pointer, and local-pause reason SHALL appear once in the closed Design table and map to exactly one existing action. Candidate/Git-push/Ledger/PR-Handoff ambiguity unresolved after one deterministic readback SHALL be `BLOCKED / MANUAL_CONTROLLER_STOP`, and later `run` SHALL not reissue it. `IDENTICAL_COMMAND_REPLAY` remains only for the existing exact stored public-request local-pause rule; RESUME SHALL remain safe no-code/no-Test only.

### REQ-DTF-004 — Exact Candidate, PR, and Fixed-reference Handoff

The Coordinator SHALL bind all delivery evidence to one exact Candidate and stop at a review-ready PR.

- **AC-DTF-004-01:** Candidate entry SHALL require current GREEN, Regression including Test Asset Retirement, allowed-path inventory, expected clean Head, and current state/version/hash. Foundation SHALL stage only the exact path list, read back complete staged entries/index tree, create one non-amend commit, and require exact SHA/parent/tree/branch/clean readback.
- **AC-DTF-004-02:** Final validation and a fresh read-only Validator SHALL bind the exact Candidate SHA. Candidate freeze SHALL require `local Candidate Head == remote branch Head == Validator Head`; any mismatch SHALL block and SHALL NOT create or update a PR.
- **AC-DTF-004-03:** The order SHALL be final Validator PASS -> normal current-Change branch push -> remote Head readback -> Candidate freeze -> PR create-or-reuse -> PR Head/readiness readback -> Handoff. After freeze Mac mini SHALL perform no Candidate Worktree/branch code or Git write.
- **AC-DTF-004-04:** Mac mini PR authority SHALL be limited to current-Change query/create-or-reuse/update/readback/mark-ready-for-review with base `main`, exact head branch, and `PR Head == Frozen Candidate Head`; merge, approve, close, delete, push-main, or another Change's PR SHALL be structurally unavailable.
- **AC-DTF-004-05:** Handoff SHALL contain fixed baseline/Candidate/tree/branch/remote/PR/Ledger references, exact changed paths, actual validation receipts, Validator verdict and Head, canonical diff hash/contract ID, risks, unverified items, and open questions. It SHALL NOT embed the binary diff.
- **AC-DTF-004-06:** Both devices SHALL reconstruct canonical diff bytes with Git `2.54.0`, the exact argument-array/config/environment contract in Design, and raw stdout SHA-256 without normalization. Any byte/hash mismatch SHALL fail closed.
- **AC-DTF-004-07:** State SHALL enter `AWAITING_CONTROLLER` only after PR readback, Handoff write/readback, and durable `HANDOFF_READY` readback all bind the Frozen Candidate. Mac mini SHALL then stop; MacBook alone owns PR review, changes_requested, Acceptance, squash merge, and archive.
- **AC-DTF-004-08:** The canonical-diff producer SHALL start from an empty environment, admit only the exact variables in Design, use a resolved absolute Git `2.54.0` executable and exact cwd/Git-dir/Worktree/argv, reject clone-local attributes/config/diff/textconv/replace/graft/alternate/shallow inputs, read back an environment receipt, and hash unnormalized raw stdout bytes with SHA-256; device mismatch SHALL fail closed.

### REQ-DTF-005 — Seven-class Ledger and Four Recovery Boundaries

The Coordinator SHALL preserve immutable same-Change evidence while limiting automatic recovery to four explicit boundaries.

- **AC-DTF-005-01:** Ledger event classes SHALL be exactly `CONTROLLER_COMMAND`, `AGENT_RUN`, `VALIDATION_RESULT`, `CANDIDATE_COMMITTED`, `BRANCH_PUSHED`, `HANDOFF_READY`, and `BLOCKED`. Records SHALL be canonical, append-only, contiguous-sequence, individually hashed, idempotent JSONL at the one frozen Evidence Ref path, framed by exactly one LF, remotely read back before dependent progress, and never overwrite historical FAIL/Candidate/PASS facts. Git commit parent history SHALL provide append integrity; no second record-level hash chain is allowed.
- **AC-DTF-005-02:** `CONTROLLER_COMMAND` SHALL contain verified command/receipt/evidence digests including MacBook signed decision/run receipts; `AGENT_RUN` SHALL contain the six stages; Test Asset Retirement SHALL be `VALIDATION_RESULT` with `validation_kind: REGRESSION` and `validation_scope: TEST_ASSET_RETIREMENT`. No prompt, raw model output, secret, private key, credential, sensitive data, or environment dump SHALL be durable.
- **AC-DTF-005-03:** Automatic recovery SHALL exist only for Candidate commit, branch push, Ledger append, and Final Handoff/PR. Each SHALL perform one deterministic readback and converge on exact identity; only proven exact absence may use its already-bounded same-idempotency continuation. If that readback establishes neither exact success nor exact absence, the boundary is exhausted and SHALL enter `BLOCKED / MANUAL_CONTROLLER_STOP`.
- **AC-DTF-005-04:** Candidate parent/tree/branch conflict, remote Head conflict, Ledger predecessor/bytes/hash conflict, multiple or mismatched PRs, Handoff mismatch, or any unresolved ambiguous effect SHALL enter `BLOCKED / MANUAL_CONTROLLER_STOP`. A subsequent `run` SHALL return the same manual stop without invoking the ambiguous gateway, and no stale-run replay envelope, replacement ID, force update, alternate object, generic transaction state, or fifth recovery boundary SHALL be introduced.
- **AC-DTF-005-05:** Every other interruption/failure SHALL preserve available state and evidence and wait for explicit signed RESUME/REVISION/RELEASE correction or Controller action. Automatic Validator repair SHALL remain normal execution, not recovery.
- **AC-DTF-005-06:** If Ledger append/readback is unavailable, Foundation SHALL atomically persist/read back the exact local-pause operation/request-hash/idempotency/next-action identity but SHALL NOT claim a durable `BLOCKED` event, Gate, delivery, or release. Only identical public-request replay after external restoration plus exact remote readback and state-receipt persistence may clear it; a repeated outage may explicitly supersede it, while conflict/manual-stop remains until approved resolution.
- **AC-DTF-005-07:** `refs/heads/evidence/agent-runs` and `ledger/<path-safe-change-id>.jsonl` SHALL be the sole durable Ledger byte authority. Exact change grammar, first/subsequent tip rules, canonical JSONL framing, preserved other-tree entries, and typed remote-read/prepared-append/commit-push/remote-readback receipts SHALL match Design. Remote ref+commit+tree+path+record-byte readback is the only linearization point; exact publication converges, confirmed absence permits one same-identity attempt, and conflict/ambiguity follows the existing Ledger boundary/local-pause mapping.
- **AC-DTF-005-08:** Pending Agent/action/settlement SHALL share `AgentBindingV1`; each of six AGENT_RUN details SHALL have exact allowed fields. The seven Ledger details and validation kind/scope/status/verdict/failure/Head combinations SHALL be the closed Design unions; DISPATCH `CONTROLLER_COMMAND` SHALL bind admission plus computed READY hash. No local bytes, partial receipt, unpushed commit, push acknowledgement, or lost response SHALL be authoritative state.

### REQ-DTF-006 — Signed RELEASE and Pointer-clear Idempotence

The Coordinator SHALL close the current Change only from signed, read-back integration evidence and SHALL clear WIP last.

- **AC-DTF-006-01:** First RELEASE SHALL require `AWAITING_CONTROLLER`, pointer equality to the same Change, exact expected state version/hash, Frozen Candidate/PR identity, and a signed receipt referencing Acceptance, squash merge, archive, `origin/main`, and MacBook local-main synchronization.
- **AC-DTF-006-02:** RELEASE SHALL execute fetch `origin --prune`, prove the Mac mini main Worktree clean, require signed squash SHA equal `origin/main`, perform ff-only local-main synchronization, and read back `local main == origin/main == squash SHA`. It SHALL not push or merge `main` or modify the Frozen Candidate Worktree.
- **AC-DTF-006-03:** After sync/readback, Foundation SHALL append/readback the RELEASE `CONTROLLER_COMMAND` once, write/readback `CLOSED`, and only then clear/readback `active_change_id`.
- **AC-DTF-006-04:** Identical RELEASE replay SHALL converge exactly: recorded RELEASE in `AWAITING_CONTROLLER` continues closure; `CLOSED` with pointer still naming the Change clears only the pointer; `CLOSED` with empty pointer returns `ALREADY_APPLIED`. No duplicate command event or business effect is allowed.
- **AC-DTF-006-05:** Different Change/body/receipt/state/hash/squash SHA/idempotency identity, dirty main, non-fast-forward, fetch/readback failure, or Head mismatch SHALL fail closed with the pointer retained and no next-Change authority.
- **AC-DTF-006-06:** Mac mini SHALL treat MacBook local-main state only as signed RELEASE-receipt evidence and SHALL not claim to directly inspect the other host.

### REQ-DTF-007 — Foundation/Activation Separation and Forbidden Effects

Foundation SHALL remain inert and deterministic; real dual-device authority and live external effects SHALL be activated separately.

- **AC-DTF-007-01:** Foundation SHALL implement/test only the four interfaces, six states and phases, pointer/state contract, canonical signed-body/verifier seam, one operation mutex, restricted gateways, seven event classes, four recovery boundaries, Candidate/diff/PR/Handoff/RELEASE ordering, and fail-closed negative cases using deterministic doubles and temporary local Git.
- **AC-DTF-007-02:** Real signing keys, production trust provider, root-owned trust/ACL/effective-write, SSH, real host loop/Agent launches, production GitHub credentials/transport, live PR canaries, rotation, and revocation SHALL belong only to a separately authorized Mode Activation Change.
- **AC-DTF-007-03:** Mode Activation acceptance SHALL prove unattended signed DISPATCH to review-ready PR, exact Candidate freeze and Handoff, with at most one same-scope automatic Validator repair. It SHALL NOT be downgraded to manual per-Gate operation, MacBook-created PR, segmented-only proof, or no-repair behavior.
- **AC-DTF-007-04:** Foundation tests/imports SHALL create no live branch/ref/Worktree/PR, Agent/model/network/provider call, key/trust/host change, project-control write, product/Profile/contract effect, push/merge/main write, Acceptance, archive, deletion, or H/P/C/A dispatch.
- **AC-DTF-007-05:** Foundation SHALL add no dependency, Agent runner, daemon, queue, Issue/Project integration, general Git/GitHub gateway, project-control v2, cross-Change WIP enumeration, multi-Change/device/project abstraction, universal recovery platform, embedded diff, second lock, extra interface/state/phase/event class, or speculative compatibility layer.
- **AC-DTF-007-06:** Any required authority, scope, schema, compatibility, ownership, dependency, permission, recovery, or external-effect change SHALL return `BLOCKED` to the Controller rather than being invented by Spec/Test/Worker.
- **AC-DTF-007-07:** This Foundation Change's Spec/Test/Worker/Validator/Candidate/PR/review/squash merge/archive and dual-main synchronization SHALL use the current pre-Activation Git and governance workflow. No task SHALL require the inactive signed DISPATCH, host loop, automatic Candidate/PR/Handoff, or RELEASE mechanics before the separately authorized Mode Activation proves them.

## Current Gate

The revised reduced package is eligible only for fresh independent Spec review. This document claims no Spec Gate PASS, Test release, RED, GREEN, Regression, Retirement PASS, Candidate, Validator result, Acceptance, archive, Mode Activation, or H/P/C/A authority.
