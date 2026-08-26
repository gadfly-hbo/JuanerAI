# Design: Mode Activation

## Minimal Composition

```text
MacBook product intake + one Product Plan Reviewer (D1-A)
-> frozen Artifact Package + signed receipt
-> Ed25519-signed Controller command
-> authenticated SSH submit/status
-> Mac mini CLI client
-> root-owned Unix socket
-> one launchd-supervised trusted host-loop process
-> existing createCoordinatorCore(production dependencies)
-> existing four interfaces / six states / seven events / one mutex
-> exact Agent actions and existing restricted gateways
-> Candidate / Validator / remote / PR equality
-> Handoff / AWAITING_CONTROLLER
```

The host loop is Activation-owned composition, not a new Foundation interface, state, event, lock, queue, or recovery boundary. It is event-driven: a signed command or Agent result causes bounded `applyControllerCommand`, `run`, or `settlement` calls until the existing Coordinator returns WAITING, BLOCKED, AWAITING_CONTROLLER, or CLOSED. It never polls for a next Change.

## D1-A Intake

Before DISPATCH, MacBook freezes product behavior, boundaries, acceptance, paths, dependency policy, archive target, and stop lines. One fresh read-only Product Plan Reviewer returns the existing seven sections and classifies findings as `SPEC_BLOCKER`, `TEST_REQUIRED`, `IMPLEMENTATION_DETAIL`, `ACTIVATION_OR_HOST_VALIDATION`, or `NON_BLOCKING_FOLLOWUP`.

At most one bounded semantic correction is allowed. The Controller then performs targeted readback; it does not automatically launch a second Reviewer. The signed intake receipt binds package/review/correction/disposition hashes. After DISPATCH, Mac mini still launches one fresh `juaner_spec` to create the actual OpenSpec. No post-DISPATCH Reviewer route exists.

## Real Controller Trust

MacBook creates one real Ed25519 private key outside the repository. Signing accepts only canonical Controller command or receipt bytes and emits signature bytes separately. The private key path is fixed in the local signer config, mode `0600`, owned by the MacBook user; signer output and errors never contain key bytes.

Mac mini `/private/etc/juanerai/controller-trust.json` is canonical JSON containing schema version, active/revoked key IDs, Ed25519 public-key material, fingerprints, and validity windows. It and its parent are `root:wheel`, non-group/non-world-writable, have no write-granting ACL, and fail an effective-write probe executed as the runtime user. Command payload, environment, CLI flags, repository files, state, and runtime-user-writable files cannot supply trust.

Rotation installs a new trusted key before use, proves old and new valid in the overlap, switches the Controller, then marks the old key revoked. Revocation canary proves a newly signed old-key command is rejected before pointer/state/Ledger/Worktree/PR effects. Trust readback failure or ambiguous ownership is `BLOCKED / MANUAL_CONTROLLER_STOP`.

No real key, token, private material, full command, signature bytes, prompt, raw model output, or environment dump is stored in Test fixtures, Agent briefs, logs, Ledger, Handoff, or repository artifacts. Tests generate ephemeral keys at runtime and retain only fingerprints/hashes.

## Sole Host Loop and CLI

`launchd` supervises exactly one root-owned LaunchDaemon label and one Unix socket. Root owns the trust, two purpose-bound GitHub credentials, state root, socket, installed runtime, and service definition. The logged-in Mac mini user cannot open the mutation state root or replace trust/config/credentials. The host loop drops Agent child processes to the configured Mac mini user and gives them only the exact Worktree and route; it retains production Coordinator/gateway composition.

`cli.mjs` is a transport client only. It does not import `production.mjs`, construct a Coordinator, open the state root, or accept verifier/gateway/trust/state-root injection. It accepts only:

- `submit`: one bounded canonical signed-command transport on stdin;
- `status`: no mutation body and one read-only response.

Both work locally and through `ssh myhost /usr/local/bin/juanerai-coordinator <submit|status>`. Unknown commands, extra fields, oversized input, multiple frames, environment injection, unavailable socket, and malformed output fail with the frozen sanitized exit mapping. SSH credentials authenticate transport only; they never become Controller signing authority.

The LaunchDaemon plist, installed runtime files, trust/config/credential files, purpose bindings, owner/mode/ACL receipts, and service PID/executable hashes are read back before Activation. A second instance cannot bind the sole root-owned socket and exits without state/effect writes. This singleton property is process ownership, not a second Coordinator mutex.

## Agent Host Execution

For each exact `AGENT_ACTION`, the host loop verifies action/state/role/agent/model/reasoning/sandbox/allowed-path/brief/input/output-schema/subject/idempotency hashes against installed artifacts. It launches one fresh Codex child with exact cwd, model, reasoning, sandbox, role instructions, output schema, and no ambient route defaults. A real observed child identity is required before STARTED. RESULT is accepted only after artifact readback/hash and post-run allowed-path inventory. Start failure and interruption use only the canonical Foundation settlement variants. The host never submits `NOT_STARTED`; that remains Coordinator-authored before REQUESTED.

If exact route capacity, Codex authentication, child identity, artifact readback, or scope proof is unavailable, the host returns the matching canonical START_FAILED/INTERRUPTED fact or stops. It never substitutes a parent-authored result, lower model, broader sandbox, another role, or default prompt.

## Production Gateways

`production.mjs` composes the unchanged Core with real implementations of the existing verifier, state, eleven-method Git, four-method Ledger, PR, validation, Handoff, clock, IDs, and the same single mutex contracts. No arbitrary command, URL, ref, credential, path, or callback is exposed.

GitHub transport uses two root-owned, repository-limited credentials with separate configuration slots and call sites:

- the branch-push credential is preferably a write-enabled repository deploy key and is available only to the exact Git transport child for the current signed `work/mac-mini/<slug>` ref; the adapter exposes no force/delete/main target, and the existing protected-`main` ruleset has no deploy-key bypass;
- the PR API credential is a fine-grained PAT or GitHub App credential with only Metadata read, Contents read, and Pull Requests write. It is available only to current-PR query/create/update/readback/ready calls. It has no Contents write, so GitHub's merge endpoint must reject it.

The host composition never gives either credential to Agent children or CLI callers and never supplies the PR API credential to Git transport or the branch-push credential to the PR API. Negative canaries prove cross-use is unavailable; merge/approve/close/delete/Issue/Project methods are absent; direct `main` push is rejected by the ruleset; force/delete are unavailable; and another repository/Change cannot be addressed. Provider metadata, permission readback, or any negative-canary mismatch blocks Activation rather than widening a credential.

Ledger remains `refs/heads/evidence/agent-runs` and `ledger/<change_id>.jsonl`; PR remains base `main`, exact head branch, create-or-reuse/update/readback/ready only. Secret-bearing process output is redacted before bounded receipt creation. Gateway ambiguity follows only the existing four readback boundaries and existing BLOCKED/local-pause disposition.

## Deterministic Git and Canonical Diff

MacBook's current canonical executable is Git `2.54.0` at `/Users/huangbo/Dev/Env/homebrew/bin/git`, SHA-256 `6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab`. Mac mini currently exposes `/usr/bin/git` `2.50.1`, SHA-256 `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93`; it is ineligible.

Before host installation, the Controller freezes one executable artifact that runs on both devices as Git `2.54.0` and produces the same executable SHA-256 on both. Mac mini installs it at a dedicated non-system absolute path recorded in root-owned config. Host code starts from an empty environment, invokes absolute executables with `shell:false`, admits only the Foundation environment/config/argv contract, and rejects PATH/HOME/config/attribute/diff/textconv/replace/graft/alternate/shallow contamination. `/usr/bin/git` is never overwritten or selected.

Both devices reconstruct the Foundation canonical diff from the same baseline/Candidate objects and hash raw stdout bytes without decode, trim, newline conversion, or reserialization. Version, executable hash, argv, environment, object IDs, and stdout hash must match. Any mismatch blocks PR Acceptance and RELEASE.

## Normal, Revision, Archive, and Failure Paths

Normal execution is exactly:

```text
signed DISPATCH -> pointer admission -> Worktree -> fresh Spec -> Test RED
-> Worker GREEN -> Regression + Test Asset Retirement -> exact Candidate
-> final validation -> fresh Validator -> push/readback -> freeze
-> PR/readback -> Handoff -> AWAITING_CONTROLLER
```

Each DISPATCH or signed REVISION cycle permits at most one automatic Validator repair, only for clearly same-scope implementation defects after finding-specific causal RED. A second FAIL or any contract/scope/path/dependency/permission/host ambiguity enters BLOCKED.

The first PR Candidate does not archive. After MacBook review, MacBook alone signs an archive REVISION whose existing `changes_requested_ref` package binds `ARCHIVE_REQUIRED`, current Frozen Candidate, exact active/archive/canonical paths, and unchanged scope. Mac mini executes Test RED and Worker mechanical archive, then creates a new Candidate whose parent is the current Candidate, fast-forwards the same branch, updates the same PR, reruns final validation/Validator, and produces a new Handoff. Mac mini never decides archive or Acceptance.

Unexpected outcomes perform at most the existing deterministic readback. Unresolved Candidate, push, Ledger, PR/Handoff, identity, trust, credential, or host ambiguity is `BLOCKED / MANUAL_CONTROLLER_STOP`; later `run` does not reissue it. No fallback, replay platform, or fifth recovery boundary is added.

## Install, Backup, and Rollback

Installation first records absence or byte hash/owner/mode/ACL for every conditional host target, writes a root-owned backup manifest, stages new files beside targets, validates hashes, atomically replaces, loads the one service, and performs readback. It never modifies `/private/etc/ssh/**`, system Git, global user Git/Codex configuration, repository dependencies, or GitHub branch protection.

Rollback stops and unloads the host loop, disables mutating socket ingress, restores exact backed-up trust/config/service/runtime bytes or their recorded absence, revokes both Activation credentials and the superseded Controller key, and preserves state/Ledger/Handoff/canary evidence. It does not clear an active pointer, delete evidence, reset Git history, or claim a safe rollback when readback is ambiguous.

## Completion Boundary

All fourteen canaries, scope and secret scans, Test Asset Retirement, exact-Candidate Validator, archive/canonical readback, squash merge, dual-device synchronization, service readback, credential negatives, and rollback rehearsal must pass. Completion records `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`; no product DISPATCH is emitted.
