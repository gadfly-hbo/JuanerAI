# Proposal: Mode Activation

## Identity and Decision

- Change ID: `CHG-mode-activation`
- Directory: `openspec/changes/mode-activation/`
- Baseline: `fec08a5300869d9f8411c406c2f4efd79af95467`
- Branch: `work/macbook/mode-activation`
- Class: R3 security, external-effect, release, rollback, and host-authority Change
- Controller: MacBook Integration Controller
- Execution host: Mac mini `myhost`
- `greenfield_fast_path`: forbidden
- Current result: `SPEC_READY_CONTROLLER_REGATE_REQUIRED`, not Controller Spec Gate PASS

This Change activates the current canonical Dual-device Transition Foundation without further changing it. The Foundation repository-identity contract correction is already GREEN and is a frozen prerequisite, not a Mode Activation production task. Activation installs one real Controller trust boundary, one trusted Mac mini host loop, a fixed local CLI with best-effort Codex Remote courier ingress, production gateway composition, and the evidence needed to prove route, repository, exact-envelope, trust, host, and deterministic lifecycle safety. It does not submit a production-valid DISPATCH or occupy Global WIP; it stops before authorization of the first product Change.

## Frozen Authority

1. Current canonical `openspec/specs/dual-device-transition-foundation/spec.md`, SHA-256 `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`, which replaces only the historical archived Design's three-field repository definition; the archive remains immutable.
2. The accepted Foundation repository-identity correction: `coordinator.mjs` `4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55`, `coordinator.test.mjs` `de93ab87043ff945f4759e4854f52b80429bc1bdc327784ae7623f56440b4696`, and `fixtures.mjs` `48b1265a4d8c15179c8b9f2384d5f0d9477a877a61176ff79816f43c354b83d8`, with focused `180/180` PASS, canonical runner exit `0`, Test Asset Retirement PASS, and no archived-history edit.
3. The four frozen Mode Activation planning inputs supplied to this Spec run, including D1-A and the Remote courier brief, plus the latest explicit Controller/courier decision.
4. `AGENTS.md`, `CONTEXT.md`, `Orchestration.md`, and applicable governance/security policy.

Foundation remains exactly four public interfaces, six macro states, seven Ledger event classes, eleven Git Gateway methods, one process-owned operation mutex, and four automatic recovery boundaries. Any required change to those items, their closed schemas, or their ownership is `BLOCKED / CONTRACT_CHANGE_REQUIRED` and is not part of this Change.

## Objectives

### Product objective

Make the personal dual-device execution mode trustworthy and usable while keeping the MacBook as the only decision authority and Mac mini as the only current-Change executor.

### Delivery objective

Prove that a separately authorized product-valid signed DISPATCH can automatically reach exact Candidate freeze, a review-ready PR, fixed-reference Handoff, and `AWAITING_CONTROLLER`; permit at most one same-scope Validator automatic repair per DISPATCH/REVISION cycle; fail closed on every ambiguity. Activation itself proves this capability through deterministic/runtime evidence and security negatives, not by admitting a disposable Change. Only the production-positive Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback obligations of `CAN-MA-07/08` are deferred to that first real product Change.

### Learning objective

Prove that one personal Global WIP and the existing Foundation are sufficient. Do not create a general scheduler, queue, multi-project platform, or new recovery framework.

## Scope

### Current Spec write scope

- `openspec/changes/mode-activation/**`

### Remaining bounded-repair repository paths

- Test write scope: `tools/harness/change-coordinator/mode-activation.test.mjs` and `tools/harness/change-coordinator/git.integration.test.mjs` only.
- Worker write scope: `tools/harness/change-coordinator/install-host-loop` and `tools/harness/change-coordinator/production.mjs` only.
- Regression-only, no-write inputs include `cli.test.mjs`, the current canonical Foundation spec, `coordinator.mjs`, `coordinator.test.mjs`, `fixtures.mjs`, and all already implemented Mode Activation files.

The MacBook Controller bootstrap archive is a later mechanical repository action after first PR review, not Worker production implementation. No dependency or lockfile change is allowed.

### Archive-only paths, conditionally released by the Mode Activation bootstrap exception

- active source: `openspec/changes/mode-activation/**`
- exact target: `openspec/changes/archive/2026-08-26-mode-activation/**`
- canonical publication: `openspec/specs/mode-activation/spec.md`

They are not Worker-writeable in the initial implementation cycle. After first PR review, the MacBook Controller alone mechanically moves the active package to the exact archive target, publishes the exact canonical specification, reads both back, and creates a descendant Candidate on the same branch and PR. This one bootstrap exception uses the current pre-Activation Git workflow: it requires no Foundation REVISION, active pointer, DISPATCH, or Mac mini archive execution. It never applies to a product Change. After Activation, every product Change retains the signed archive REVISION and Mac mini mechanical archive route frozen by Foundation and `docs/governance/product-change-execution-policy.md`.

### Conditional host paths

These writes occur only after repository RED/GREEN/regression and an administrator-approved installation Gate:

- MacBook private key and signer config under `/Users/huangbo/Library/Application Support/JuanerAI/controller/`; private bytes are `0600`, user-owned, and never enter Git.
- Mac mini trust/config/credential files: `/private/etc/juanerai/controller-trust.json`, `/private/etc/juanerai/host-loop.json`, `/private/etc/juanerai/github-branch-push-key`, and `/private/etc/juanerai/github-pr-api-credential`, with root ownership and effective-write checks. The two GitHub transport credentials are purpose-bound and cannot substitute for each other.
- Mac mini service and entrypoints: `/Library/LaunchDaemons/com.juanerai.change-coordinator.plist`, `/usr/local/bin/juanerai-coordinator`, and `/usr/local/libexec/juanerai-change-coordinator/` containing only the frozen Candidate runtime files.
- Mac mini state/socket/log locations: `/private/var/db/juanerai/change-coordinator/`, `/private/var/run/juanerai/change-coordinator.sock`, and `/private/var/log/juanerai/change-coordinator.log`.
- A dedicated non-system Git `2.54.0` executable on Mac mini whose bytes and SHA-256 exactly match the MacBook canonical executable, plus its unchanged pinned dynamic-library bytes. `/usr/bin/git` is never overwritten or substituted. The installer grants runtime UID `501` search/execute-only ACL access across every otherwise-inaccessible ancestor required to execute that fixed Git and load those libraries, without directory listing, write, or ownership authority.

### Forbidden paths and effects

- all product source, product Tests, dependencies, lockfiles, `.github/**`, `.juanerai/project-control/**`, `CONTEXT.md`, and unrelated docs;
- `tools/harness/change-coordinator/coordinator.mjs`, `coordinator.test.mjs`, and `fixtures.mjs`;
- `/private/etc/ssh/**`, branch protection mutation, arbitrary SSH setup, global Git/Codex config, system `/usr/bin/git` replacement, `install_name_tool`, fixed-Git byte rewriting, or root-executed Git substitution for the UID `501` runtime proof;
- GitHub Issues/Projects, workflow mutation, merge/approve/close/delete authority, push to `main`, force push, branch deletion, or next-Change dispatch;
- any key/token/secret content in Git, Tests, logs, Ledger, Handoff, Agent brief, receipt, or prompt;
- any new Canary interface, direct production-adapter invocation, disposable Change, transport message bus, receipt schema, outbox, queue, exactly-once authority, automatic replay, second lock, scheduler, poller, cross-Change concurrency, general gateway, compatibility mode, fifth recovery boundary, repository State field, or repository identity inferred from `change_id`.

## Device Ownership

- MacBook owns product-semantic intake, the one Product Plan Reviewer, Ed25519 private key, signed receipts/commands, PR review, `changes_requested`, the Mode Activation bootstrap-only mechanical archive/canonical publication, archive decision for later product Changes, Acceptance, squash merge, post-merge readback, RELEASE, and any later product-Change authorization.
- Mac mini owns root-controlled trust and host-loop installation, current-Change Worktree/Agent/Git/Ledger/PR/Handoff mechanics, host canaries, and RELEASE's bounded ff-only local-main synchronization.
- Repository branch ownership follows `docs/governance/git-development-workflow.md` and transfers only through a clean pushed handoff. No simultaneous dual-device branch writes are permitted.

## External Prerequisites

The following are reviewable prerequisites, not facts the implementation may invent:

1. Administrator approval on Mac mini for root-owned trust/config/credential files, backup, LaunchDaemon install, service load/unload, and rollback; current `sudo -n` is unavailable.
2. A Mac mini Git `2.54.0` artifact with unchanged executable and pinned dynamic-library bytes, including executable SHA-256 equal to the MacBook canonical Git. The installer must back up, apply, read back, and roll back the owner/mode/ACL of every required ancestor and artifact; UID `501` must receive only the minimum search/execute access needed to run the fixed executable and load its libraries, with no listing/write/ownership grant, and must itself prove Git `2.54.0` plus the frozen executable SHA. Current Mac mini has only `/usr/bin/git` `2.50.1`; installation must not overwrite or select it.
3. A Mac mini Node runtime compatible with the frozen host code and validation route; current login-shell Node is `v25.9.0`, while the MacBook/canonical validation toolchain is `v26.0.0`.
4. Two separate repository-limited Mac mini credentials: a write-enabled repository deploy key used only by Git transport for the current branch, and a fine-grained PAT or GitHub App credential used only by the PR API with Metadata read, Contents read, and Pull Requests write. Production repository authority requires same-process verified `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` and the independent second match `config.github_repository == 'gadfly-hbo/JuanerAI'`; restart without accepted authority blocks. The PR credential has no Contents write, so it cannot authorize the merge endpoint. Protected `main` must have no deploy-key bypass. Mac mini's current `gh` authentication is invalid. The MacBook's authenticated `gadfly-hbo` credential and its `gist/read:org/repo/workflow` scopes must not be copied or treated as either Mac mini credential.
5. A working Controller-selected Codex Remote route to the exact Mac mini project for best-effort daily courier use, existing authenticated SSH reachability to `myhost` only for install, rollback, emergency diagnosis, or explicit backup submission, and an installed Mac mini Codex runtime capable of the exact frozen agent/model/sandbox routes.

Missing or failed prerequisites keep Activation `BLOCKED`; they do not authorize fallback credentials, ambient PATH, weaker hashes, or manual bypass.

## Activation and Stop Line

Merge alone does not authorize a product Change. Before the next final implementation Candidate, the two remaining causal RED causes in `MA-TASK-012`, `014`, `016`, and `017` plus every non-deferred pre-Candidate obligation must close; Foundation repository identity remains mandatory regression evidence, not RED. After first PR review, MacBook Controller performs the bootstrap-only archive/canonical publication mechanically. Activation becomes operational only after every non-deferred obligation in the fourteen-canary matrix, Test Asset Retirement, exact Candidate Validator PASS, that Controller archive/readback and same-PR descendant, squash merge, dual-main synchronization, host configuration readback, rollback evidence, and PR-credential no-merge proof pass without admitting a disposable valid DISPATCH. No-merge authority must be proved through reliable permission metadata or a deterministic method with no merge side effect; a real product PR merge endpoint is never called. Activation then stops at `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. The separately user-authorized first real product Change alone executes the three deferred `CAN-MA-07/08` positive effects through the existing Foundation/Host Loop route; any missing, ambiguous, or mismatched readback is `BLOCKED` and forbids Acceptance.
