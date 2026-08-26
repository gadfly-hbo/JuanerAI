# Mode Activation Specification

`SHALL`, `MUST`, and `SHALL NOT` are normative. Unknown identities, bytes, routes, paths, credentials, receipts, or effects fail closed.

## REQ-MA-001 — Frozen Foundation and Controller Authority

Mode Activation SHALL activate, but not alter, the released Foundation and SHALL keep MacBook as sole decision authority and Mac mini as sole current-Change executor.

- **AC-MA-001-01:** The Foundation surface remains exactly `applyControllerCommand`, `run`, `settlement`, and `status`; macro states remain exactly six, Ledger event classes seven, Git Gateway methods eleven, operation mutex one, and automatic recovery boundaries four. Any required delta blocks this Change.
- **AC-MA-001-02:** Global write-capable WIP remains exactly one, with `active-change.json.active_change_id` the sole runtime authority; no Issue/Project, queue, polling, next-Change automation, or cross-Change parallelism exists.
- **AC-MA-001-03:** D1-A runs one MacBook Product Plan Reviewer before DISPATCH, allows at most one bounded Controller semantic correction plus targeted readback, then binds the frozen package/review/disposition into signed receipt/evidence refs. Mac mini still runs one fresh `juaner_spec`; no post-DISPATCH Reviewer route is reachable.
- **AC-MA-001-04:** MacBook alone owns PR review, `changes_requested`, archive decision, Acceptance, squash merge, post-merge readback, RELEASE, project-control, and the first product-Change authorization.

## REQ-MA-002 — Ed25519 Trust and Secret Safety

Mode Activation SHALL establish one real, rotatable, revocable Controller signing trust whose private authority cannot be supplied or replaced by Mac mini callers.

- **AC-MA-002-01:** MacBook signs complete canonical command/receipt bytes with a real Ed25519 private key stored outside Git as user-owned `0600`; only signature bytes are outside the signed body.
- **AC-MA-002-02:** Mac mini loads trust only from `/private/etc/juanerai/controller-trust.json`; parent/file ownership, modes, ACL, canonical schema, key type, fingerprint, validity, and effective non-root write denial are read back before service start and on reload.
- **AC-MA-002-03:** Payload, environment, CLI, repository, state, runtime-user-writable file, or Agent output cannot inject trust. Forged, expired, replay-conflicting, unknown-key, revoked-key, wrong-scope, or wrong-state commands reject before protected effects.
- **AC-MA-002-04:** Rotation proves bounded old/new overlap and then revocation; a command newly signed by the revoked key fails effect-free. Ambiguous trust state stops the host.
- **AC-MA-002-05:** No real key/token/secret bytes, full prompt, raw model output, signature bytes, or environment dump enter Git, Tests, logs, Ledger, briefs, Handoff, or receipts; evidence retains only permitted IDs, fingerprints, hashes, and sanitized outcomes.

## REQ-MA-003 — Sole Trusted Host Loop and SSH/CLI Boundary

Mode Activation SHALL install exactly one production physical writer and make every ordinary mutation caller a signed-byte client only.

- **AC-MA-003-01:** One root-owned LaunchDaemon process owns production composition, verifier, state root, gateways, socket, and all three mutation interfaces under the existing one mutex. A second process cannot bind the socket or mutate state.
- **AC-MA-003-02:** The Mac mini runtime user cannot replace trust/config/service/runtime files or open the mutation state root. Root-owned owner/mode/ACL and effective-write canaries must pass.
- **AC-MA-003-03:** Production CLI exposes only bounded stdin `submit` and read-only `status`, locally or through authenticated SSH. It cannot construct a Coordinator, import production composition, open state, inject dependencies/trust, call `run`/`settlement`, or execute arbitrary shell/Git/GitHub actions.
- **AC-MA-003-04:** The host loop is event-driven and advances only the active Change until existing WAITING/BLOCKED/AWAITING_CONTROLLER/CLOSED outcomes. Restart without complete durable route/scope/validation identity enters existing BLOCKED/manual-stop semantics; it never defaults missing authority.
- **AC-MA-003-05:** Logs contain only bounded operation/change/state/outcome/timing/receipt hashes. Malformed transport, unavailable socket, process failure, or redaction uncertainty follows the stable exit/fail-closed mapping without fabricating progress.

## REQ-MA-004 — Exact Agent Actions and Existing Coordinator Mechanics

The host loop SHALL launch only the exact formal Agent action returned by Foundation and SHALL not duplicate Foundation mechanics.

- **AC-MA-004-01:** Every child binds exact correlation, role, agent, model, reasoning, sandbox, paths, phase, state version, brief/input/output hashes, subject, and idempotency identity; no lower model, default route, broader sandbox, or parent substitute is allowed.
- **AC-MA-004-02:** STARTED requires an observed child identity. RESULT requires output artifact and hash readback plus allowed-path inventory. START_FAILED and INTERRUPTED use only canonical variants; `NOT_STARTED` is never a host settlement.
- **AC-MA-004-03:** Worktree, Git, Ledger, validation, PR, and Handoff operations remain Foundation-owned existing gateway calls. Host loop does not issue or accept mechanical receipts in settlement.
- **AC-MA-004-04:** The normal path automatically reaches exact Candidate freeze, review-ready PR, fixed Handoff, and `AWAITING_CONTROLLER` without per-Gate MacBook intervention.
- **AC-MA-004-05:** Each DISPATCH/REVISION authorization cycle allows at most one same-scope Validator automatic repair after finding-specific causal RED. A second FAIL or any contract/architecture/scope/path/dependency/permission/host ambiguity blocks.

## REQ-MA-005 — Pinned Git and Exact Delivery Identity

Mode Activation SHALL make dual-device Candidate review reproducible from exact Git objects and raw bytes.

- **AC-MA-005-01:** Both devices use Git exactly `2.54.0` with the same frozen executable SHA-256 and resolved absolute executables. Mac mini's `/usr/bin/git` `2.50.1` is rejected and never overwritten.
- **AC-MA-005-02:** Git runs from the Foundation empty-environment/config/argv contract with `shell:false`; ambient PATH/HOME/config, attributes, external diff/textconv, replace/graft/alternate/shallow inputs are rejected.
- **AC-MA-005-03:** Both devices hash unnormalized canonical-diff stdout bytes for the same baseline/Candidate; version, executable hash, argv, environment, object IDs, and stdout SHA-256 must match.
- **AC-MA-005-04:** Candidate freeze and Handoff require `local Candidate == remote branch == Validator Head == PR Head`; any mismatch prevents PR/Handoff progress.

## REQ-MA-006 — Restricted GitHub Authority and Immutable Evidence

Mode Activation SHALL use two purpose-isolated minimum-permission repository credentials together with structural adapter and branch-protection negatives.

- **AC-MA-006-01:** Mac mini uses two separate root-owned repository-limited credentials: a branch-push credential, preferably a write-enabled repository deploy key, only for Git transport; and a PR API fine-grained PAT or GitHub App credential with only Metadata read, Contents read, and Pull Requests write. The PR credential has no Contents write. MacBook credentials are never copied or delegated.
- **AC-MA-006-02:** Host composition binds each credential to its exact adapter purpose and never gives either to an Agent, CLI, log, Ledger, or the other transport. Git operations can only normally push the exact current `work/mac-mini/<slug>` branch; PR operations can only query/create-or-reuse/update/read back/mark ready the same PR against base `main`. Merge, approve, close, delete, force, branch delete, Issues, Projects, other repositories, and arbitrary API/refs are structurally unavailable.
- **AC-MA-006-03:** Protected `main` has no branch-push-credential bypass and rejects a negative push canary. The PR API credential successfully creates/updates/reads the current PR but the merge endpoint rejects it because Contents write is absent. Cross-use of either credential is unavailable. If provider metadata, permission readback, ruleset policy, or any negative canary cannot prove these properties, Activation is blocked.
- **AC-MA-006-04:** Ledger remains append-only on the sole Evidence Ref, preserves historical FAIL/Candidate/PASS facts, and advances only after exact remote bytes/hash readback. Secret-bearing transport output is sanitized before evidence creation.

## REQ-MA-007 — Signed Revision, Archive, Release, and Rollback

Mode Activation SHALL preserve MacBook decision ownership through review, archive, integration, release, and rollback.

- **AC-MA-007-01:** Exact signed REVISION from `AWAITING_CONTROLLER` binds the Frozen Candidate, current state/version/hash, unchanged repository/Change/Worktree/branch/baseline/scope, and signed `changes_requested` evidence, then enters `EXECUTING/TEST_RED`; wrong bindings reject effect-free.
- **AC-MA-007-02:** First Handoff does not archive. MacBook's signed archive REVISION alone releases the exact active/archive/canonical paths. Mac mini mechanically archives, creates a new Candidate whose parent is the current Candidate, fast-forwards the same branch/PR, reruns final validation/fresh Validator, and produces a new Handoff.
- **AC-MA-007-03:** Mac mini never decides archive, Acceptance, merge, or RELEASE. A valid RELEASE runs only existing clean ff-only main synchronization, CLOSED persistence, and pointer-clear-last ordering.
- **AC-MA-007-04:** Install records exact prior bytes/absence/owner/mode/ACL and creates a root-owned backup manifest. Rollback stops ingress, restores exact prior host state or absence, revokes credential/key, and preserves pointer/state/Ledger/Handoff/canary evidence.
- **AC-MA-007-05:** Any unresolved high-value effect or rollback readback is `BLOCKED / MANUAL_CONTROLLER_STOP`; no automatic fallback, overwrite, evidence deletion, pointer clear, or fifth recovery boundary is allowed.

## REQ-MA-008 — Canary, Retirement, Evidence, and Final Gate

Activation SHALL be accepted only from exact-SHA dual-device evidence and SHALL stop before product work.

- **AC-MA-008-01:** All fourteen canaries in `test-plan.md` pass against the exact Candidate and installed host configuration; each receipt names subject SHA, host, command definition hash, sanitized result hash, and time.
- **AC-MA-008-02:** Test Asset Retirement classifies every added/changed/removed Test, fixture, helper, mock, and harness asset; the Controller Gate and fresh Validator confirm no temporary, duplicate, orphaned, skipped, or ownerless asset remains.
- **AC-MA-008-03:** Verification records exact repository/code/config/tool executable hashes, service owner/mode/ACL/effective-write, dual-main/canonical-diff equality, PR/Candidate/Handoff/archive identities, scope inventory, secret scan, backup, rollback, and residual prerequisites without overwriting historical failures.
- **AC-MA-008-04:** Any failed security canary blocks Activation and prevents product DISPATCH. After Acceptance, archive, squash merge, dual-device synchronization, RELEASE-readiness proof, and service readback, state is only `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`.
- **AC-MA-008-05:** The first product Change requires a separate explicit user authorization and a completed D1-A intake; Mode Activation does not emit or imply it.
