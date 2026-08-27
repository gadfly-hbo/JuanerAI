# Design: Mode Activation

## Minimal Composition

```text
MacBook product intake + one Product Plan Reviewer (D1-A)
-> frozen Artifact Package + signed receipt
-> Ed25519-signed Controller command
-> best-effort Codex Remote courier for the exact Brief/task/signed envelope
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

## Best-effort Remote Courier

Codex Remote is only a best-effort courier for a Controller-selected Brief, task, or already signed submit envelope. It is not a message bus, exactly-once authority, transport receipt/outbox/queue/replay platform, Foundation component, or business-evidence authority. Controller signature protects authorization and exact content; the root-owned Host Loop executes; existing Foundation pointer, State, Ledger, and PR facts alone prove business effects.

Before invoking the fixed local CLI, the courier proves the Controller-selected Remote route, exact repository top-level/origin, fixed CLI identity, and raw envelope SHA-256. It does not reinterpret the command, sign, reserialize, select recovery, infer admission, or write business state. Missing, late, or ambiguous Remote output never triggers automatic retry or SSH failover. The Controller reads pointer, State, Ledger, and when applicable PR: an admitted Change continues from durable state; a clearly not-admitted command permits only a new explicit Controller decision; any conflict or inconsistency is `BLOCKED`.

SSH remains a fallback only for installation, rollback, emergency diagnosis, or an explicit Controller backup submission. No courier behavior adds a Foundation interface, state, event, Gateway, lock, or recovery boundary.

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

Both work locally and through the Controller-selected best-effort Codex Remote courier. `ssh myhost /usr/local/bin/juanerai-coordinator <submit|status>` is reserved for installation, rollback, emergency diagnosis, or explicit backup submission. Unknown commands, extra fields, oversized input, multiple frames, environment injection, unavailable socket, and malformed output fail with the frozen sanitized exit mapping. Remote or SSH transport identity never becomes Controller signing authority.

The LaunchDaemon plist, installed runtime files, trust/config/credential files, purpose bindings, owner/mode/ACL receipts, and service PID/executable hashes are read back before Activation. A second instance cannot bind the sole root-owned socket and exits without state/effect writes. This singleton property is process ownership, not a second Coordinator mutex.

## Agent Host Execution

For each exact `AGENT_ACTION`, the host loop verifies action/state/role/agent/model/reasoning/sandbox/allowed-path/brief/input/output-schema/subject/idempotency hashes against installed artifacts. It launches one fresh Codex child with exact cwd, model, reasoning, sandbox, role instructions, output schema, and no ambient route defaults. A real observed child identity is required before STARTED. RESULT is accepted only after artifact readback/hash and post-run allowed-path inventory. Start failure and interruption use only the canonical Foundation settlement variants. The host never submits `NOT_STARTED`; that remains Coordinator-authored before REQUESTED.

If exact route capacity, Codex authentication, child identity, artifact readback, or scope proof is unavailable, the host returns the matching canonical START_FAILED/INTERRUPTED fact or stops. It never substitutes a parent-authored result, lower model, broader sandbox, another role, or default prompt.

## Production Gateways

`production.mjs` composes the frozen Foundation Core `coordinator.mjs` SHA-256 `4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55` with real implementations of the existing verifier, state, eleven-method Git, four-method Ledger, PR, validation, Handoff, clock, IDs, and the same single mutex contracts. No arbitrary command, URL, ref, credential, path, or callback is exposed. The canonical Foundation repository contract is already GREEN at spec SHA-256 `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`; Mode Activation treats it as mandatory regression evidence and never changes `coordinator.mjs`.

Repository authority requires the exact same-process signature-verified condition `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'`. Production independently requires the second fixed match `config.github_repository == 'gadfly-hbo/JuanerAI'` before any Git transport, Ledger, PR, or Handoff effect. Host configuration may locate the checkout and credentials and enforce that second match, but cannot grant or replace signed repository authority. No repository field is added to State, no repository is inferred from `change_id`, and a restart that has only a digest or host configuration but no accepted signed authority remains `BLOCKED / MANUAL_CONTROLLER_STOP`.

GitHub transport uses two root-owned, repository-limited credentials with separate configuration slots and call sites:

- the branch-push credential is preferably a write-enabled repository deploy key and is available only to the exact Git transport child for the current signed `work/mac-mini/<slug>` ref; the adapter exposes no force/delete/main target, and the existing protected-`main` ruleset has no deploy-key bypass;
- the PR API credential is a fine-grained PAT or GitHub App credential with only Metadata read, Contents read, and Pull Requests write. It is available only to current-PR query/create/update/readback/ready calls. It has no Contents write, so the permission model does not authorize merge.

The host composition never gives either credential to Agent children or CLI callers and never supplies the PR API credential to Git transport or the branch-push credential to the PR API. Negative canaries prove cross-use is unavailable; merge/approve/close/delete/Issue/Project methods are absent; direct `main` push is rejected by the ruleset; force/delete are unavailable; and another repository/Change cannot be addressed. Before Activation-ready, PR no-merge authority is proved by reliable provider permission metadata or a deterministic no-merge-side-effect method; no real product PR merge endpoint is called. Any metadata, permission, ruleset, or negative-canary mismatch blocks Activation rather than widening a credential.

Branch push uses the existing Git Gateway only. It first reads the exact local `refs/heads/<branch>` and requires that object ID to equal the Candidate SHA, then reads the exact remote predecessor and requires equality with `expected_remote_head`, pushes the exact Candidate object as `refs/heads/<branch>:refs/heads/<branch>`, and reads back `remote Head == Candidate SHA`. A local-ref mismatch, remote-predecessor mismatch, missing ref, non-exact readback, or ambiguity stops before push or enters the existing branch-push ambiguity boundary; no force, alternate refspec, or new Gateway is permitted.

Ledger remains `refs/heads/evidence/agent-runs` and `ledger/<change_id>.jsonl`; PR remains base `main`, exact head branch, create-or-reuse/update/readback/ready only. Secret-bearing process output is redacted before bounded receipt creation. Gateway ambiguity follows only the existing four readback boundaries and existing BLOCKED/local-pause disposition.

## Deferred First-product Positive Evidence

Mode Activation adds no Canary interface and never directly invokes a production adapter. Without a disposable Change, only these `CAN-MA-07/08` production-positive effects are deferred to the separately user-authorized first real product Change:

1. append the Change's Evidence Ref record and read back the exact remote bytes/hash;
2. push the exact product branch through the purpose-bound deploy key and read back the remote Head;
3. create or update the exact product PR through the purpose-bound PR credential and read back its base/head/ready identity.

The existing Foundation and root-owned Host Loop execute those effects in their normal order after durable DISPATCH admission. No direct gateway call, one-off canary harness, alternate credential path, or new recovery boundary is authorized. Each effect must return the existing exact identity/readback proof; unavailable, ambiguous, conflicting, or mismatched evidence enters `BLOCKED`, performs no Acceptance, and does not infer success. All other trust, host, credential-isolation, ruleset, forged-signature, deterministic lifecycle, rollback, and security-negative obligations remain pre-Activation requirements.

## Deterministic Git and Canonical Diff

MacBook's current canonical executable is Git `2.54.0` at `/Users/huangbo/Dev/Env/homebrew/bin/git`, SHA-256 `6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab`. Mac mini currently exposes `/usr/bin/git` `2.50.1`, SHA-256 `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93`; it is ineligible.

Before host installation, the Controller freezes one executable artifact and its pinned dynamic libraries as unchanged bytes. The same executable runs on both devices as Git `2.54.0` and produces the same executable SHA-256 on both. Mac mini installs those bytes at their dedicated non-system absolute paths recorded in root-owned config; neither `install_name_tool` nor any other byte rewrite is allowed, and root-executed Git cannot substitute for the runtime execution proof. The installer closes UID `501` access across every ancestor required to search for and execute the fixed Git or load a pinned library: each ancestor/artifact owner, mode, ACL, and effective-write result is backed up, read back after install, and restored/read back on rollback. Any added ACL grants only search/execute traversal, never directory listing, write, or ownership. UID `501` itself must execute the fixed path and read back Git `2.54.0` plus the frozen executable SHA; inability at any ancestor blocks. Host code starts from an empty environment, invokes absolute executables with `shell:false`, admits only the Foundation environment/config/argv contract, and rejects PATH/HOME/config/attribute/diff/textconv/replace/graft/alternate/shallow contamination. `/usr/bin/git` is never overwritten or selected.

Both devices reconstruct the Foundation canonical diff from the same baseline/Candidate objects and hash raw stdout bytes without decode, trim, newline conversion, or reserialization. Version, executable hash, argv, environment, object IDs, and stdout hash must match. Any mismatch blocks PR Acceptance and RELEASE.

## Normal, Revision, Archive, and Failure Paths

Normal execution is exactly:

```text
signed DISPATCH -> pointer admission -> Worktree -> fresh Spec -> Test RED
-> Worker GREEN -> Regression + Test Asset Retirement -> exact Candidate
-> final validation -> fresh Validator -> push/readback -> freeze
-> PR/readback -> Handoff -> AWAITING_CONTROLLER
```

This positive production path begins only with the separately user-authorized first real product Change. Mode Activation never submits a disposable valid DISPATCH; it proves the path with deterministic Foundation/runtime tests plus installed trust, host, courier-integrity, and fail-closed negative evidence.

Each DISPATCH or signed REVISION cycle permits at most one automatic Validator repair, only for clearly same-scope implementation defects after finding-specific causal RED. A second FAIL or any contract/scope/path/dependency/permission/host ambiguity enters BLOCKED.

The first PR Candidate does not archive. Mode Activation has one bootstrap-only exception: after reviewing that PR, the MacBook Controller mechanically moves the exact active package to the frozen archive path, publishes byte-equal canonical specification bytes, reads back active absence plus archive/canonical identity, and creates a descendant Candidate on the same branch and PR. Because no product Change is active yet, this route uses neither Foundation REVISION nor an active pointer, DISPATCH, Test RED, Worker, or Mac mini archive action. It does not transfer archive or Acceptance authority. Once Activation completes, the exception expires permanently: every product Change uses the signed archive REVISION, Mac mini mechanical archive, descendant Candidate, repeated final validation/Validator, and Handoff route frozen by Foundation.

Unexpected outcomes perform at most the existing deterministic readback. When Remote output is missing, the Controller reads the existing pointer, State, Ledger, and PR authorities: admitted continues from durable state, clearly not admitted permits a new explicit decision, and conflicting or inconsistent facts are `BLOCKED / MANUAL_CONTROLLER_STOP`. Unresolved Candidate, push, Ledger, PR/Handoff, identity, trust, credential, or host ambiguity is likewise blocked; later `run` and the courier do not reissue it. No transport receipt, outbox, queue, automatic replay, or fifth recovery boundary is added.

## Install, Backup, and Rollback

Installation first records absence or byte hash/owner/mode/ACL for every conditional host target and every Git/dynamic-library ancestor needed by UID `501`, writes a root-owned backup manifest, stages unchanged bytes beside targets, applies only the minimum search/execute ACL traversal grants, validates hashes and effective permissions, atomically replaces, proves real UID `501` fixed-Git execution, loads the one service, and performs readback. It never modifies Git bytes with `install_name_tool`, substitutes root-executed Git for the runtime proof, grants directory listing/write/ownership, or modifies `/private/etc/ssh/**`, system Git, global user Git/Codex configuration, repository dependencies, or GitHub branch protection.

Rollback stops and unloads the host loop, disables mutating socket ingress, restores exact backed-up trust/config/service/runtime/Git-library bytes or their recorded absence, restores every recorded ancestor/artifact owner/mode/ACL and reads them back, revokes both Activation credentials and the superseded Controller key, and preserves state/Ledger/Handoff/canary evidence. It does not clear an active pointer, delete evidence, reset Git history, or claim a safe rollback when readback is ambiguous.

## Completion Boundary

Every non-deferred obligation in the fourteen-canary matrix, scope and secret scans, Test Asset Retirement, exact-Candidate Validator, archive/canonical readback, squash merge, dual-device synchronization, service readback, PR no-merge proof, credential negatives, and rollback rehearsal must pass without a production-valid DISPATCH. Completion records `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`; no product DISPATCH is emitted. The separately authorized first real product DISPATCH supplies the durable positive Remote/real-signature proof and the three deferred `CAN-MA-07/08` effects; Acceptance is forbidden until all three exact readbacks succeed.
