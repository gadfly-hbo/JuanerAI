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
- Current result: `SPEC_READY`, not Controller Spec Gate PASS

This Change activates the already released Dual-device Transition Foundation without changing it. It installs one real Controller trust boundary, one trusted Mac mini host loop, a fixed local CLI with best-effort Codex Remote courier ingress, production gateway composition, and the evidence needed to prove route, repository, exact-envelope, trust, host, and deterministic lifecycle safety. It does not submit a production-valid DISPATCH or occupy Global WIP; it stops before authorization of the first product Change.

## Frozen Authority

1. `openspec/specs/dual-device-transition-foundation/spec.md` and `openspec/changes/archive/2026-08-26-dual-device-transition-foundation/design.md`.
2. The accepted `Foundation Compatibility Repair` at baseline `fec08a5300869d9f8411c406c2f4efd79af95467`.
3. The four frozen Mode Activation planning inputs supplied to this Spec run, including D1-A and the Remote courier brief, plus the latest explicit Controller/courier decision.
4. `AGENTS.md`, `CONTEXT.md`, `Orchestration.md`, and applicable governance/security policy.

Foundation remains exactly four public interfaces, six macro states, seven Ledger event classes, eleven Git Gateway methods, one process-owned operation mutex, and four automatic recovery boundaries. Any required change to those items, their closed schemas, or their ownership is `BLOCKED / CONTRACT_CHANGE_REQUIRED` and is not part of this Change.

## Objectives

### Product objective

Make the personal dual-device execution mode trustworthy and usable while keeping the MacBook as the only decision authority and Mac mini as the only current-Change executor.

### Delivery objective

Prove that a separately authorized product-valid signed DISPATCH can automatically reach exact Candidate freeze, a review-ready PR, fixed-reference Handoff, and `AWAITING_CONTROLLER`; permit at most one same-scope Validator automatic repair per DISPATCH/REVISION cycle; fail closed on every ambiguity. Activation itself proves this capability through deterministic/runtime evidence and security negatives, not by admitting a disposable Change.

### Learning objective

Prove that one personal Global WIP and the existing Foundation are sufficient. Do not create a general scheduler, queue, multi-project platform, or new recovery framework.

## Scope

### Current Spec write scope

- `openspec/changes/mode-activation/**`

### Later repository allowed paths

- `AGENTS.md`
- `Orchestration.md`
- `docs/governance/change-complexity-control.md`
- `docs/governance/product-change-execution-policy.md`
- `docs/templates/PRODUCT_CHANGE_AUTHORITY_PACKAGE.template.md`
- `.codex/agents/juaner_spec.toml`
- `.codex/agents/juaner_test.toml`
- `.codex/agents/juaner_worker.toml`
- `.codex/agents/juaner_validator.toml`
- `.agents/skills/juanerai-macbook/SKILL.md`
- `.agents/skills/juanerai-mini/SKILL.md`
- `tools/harness/change-coordinator/README.md`
- `tools/harness/change-coordinator/adapters.mjs`
- `tools/harness/change-coordinator/cli.mjs`
- `tools/harness/change-coordinator/controller-cli.mjs`
- `tools/harness/change-coordinator/production.mjs`
- `tools/harness/change-coordinator/host-loop.mjs`
- `tools/harness/change-coordinator/install-host-loop`
- `tools/harness/change-coordinator/com.juanerai.change-coordinator.plist`
- `tools/harness/change-coordinator/cli.test.mjs`
- `tools/harness/change-coordinator/git.integration.test.mjs`
- `tools/harness/change-coordinator/mode-activation.test.mjs`

The canonical Foundation core files `coordinator.mjs`, `coordinator.test.mjs`, and `fixtures.mjs` are read-only reuse inputs. No dependency or lockfile change is allowed.

### Archive-only paths, conditionally released by signed archive REVISION

- active source: `openspec/changes/mode-activation/**`
- exact target: `openspec/changes/archive/2026-08-26-mode-activation/**`
- canonical publication: `openspec/specs/mode-activation/spec.md`

They are not Worker-writeable in the initial implementation cycle. MacBook may release them only after first PR review through a signed same-scope archive REVISION; Mac mini performs only the frozen mechanical move/publication/readback.

### Conditional host paths

These writes occur only after repository RED/GREEN/regression and an administrator-approved installation Gate:

- MacBook private key and signer config under `/Users/huangbo/Library/Application Support/JuanerAI/controller/`; private bytes are `0600`, user-owned, and never enter Git.
- Mac mini trust/config/credential files: `/private/etc/juanerai/controller-trust.json`, `/private/etc/juanerai/host-loop.json`, `/private/etc/juanerai/github-branch-push-key`, and `/private/etc/juanerai/github-pr-api-credential`, with root ownership and effective-write checks. The two GitHub transport credentials are purpose-bound and cannot substitute for each other.
- Mac mini service and entrypoints: `/Library/LaunchDaemons/com.juanerai.change-coordinator.plist`, `/usr/local/bin/juanerai-coordinator`, and `/usr/local/libexec/juanerai-change-coordinator/` containing only the frozen Candidate runtime files.
- Mac mini state/socket/log locations: `/private/var/db/juanerai/change-coordinator/`, `/private/var/run/juanerai/change-coordinator.sock`, and `/private/var/log/juanerai/change-coordinator.log`.
- A dedicated non-system Git `2.54.0` executable on Mac mini whose SHA-256 exactly matches the MacBook canonical executable; `/usr/bin/git` is never overwritten.

### Forbidden paths and effects

- all product source, product Tests, dependencies, lockfiles, `.github/**`, `.juanerai/project-control/**`, `CONTEXT.md`, and unrelated docs;
- `tools/harness/change-coordinator/coordinator.mjs`, `coordinator.test.mjs`, and `fixtures.mjs`;
- `/private/etc/ssh/**`, branch protection mutation, arbitrary SSH setup, global Git/Codex config, and system `/usr/bin/git` replacement;
- GitHub Issues/Projects, workflow mutation, merge/approve/close/delete authority, push to `main`, force push, branch deletion, or next-Change dispatch;
- any key/token/secret content in Git, Tests, logs, Ledger, Handoff, Agent brief, receipt, or prompt;
- any transport message bus, receipt schema, outbox, queue, exactly-once authority, automatic replay, second lock, scheduler, poller, cross-Change concurrency, general gateway, compatibility mode, or fifth recovery boundary.

## Device Ownership

- MacBook owns product-semantic intake, the one Product Plan Reviewer, Ed25519 private key, signed receipts/commands, PR review, `changes_requested`, archive decision, Acceptance, squash merge, post-merge readback, RELEASE, and any later product-Change authorization.
- Mac mini owns root-controlled trust and host-loop installation, current-Change Worktree/Agent/Git/Ledger/PR/Handoff mechanics, host canaries, and RELEASE's bounded ff-only local-main synchronization.
- Repository branch ownership follows `docs/governance/git-development-workflow.md` and transfers only through a clean pushed handoff. No simultaneous dual-device branch writes are permitted.

## External Prerequisites

The following are reviewable prerequisites, not facts the implementation may invent:

1. Administrator approval on Mac mini for root-owned trust/config/credential files, backup, LaunchDaemon install, service load/unload, and rollback; current `sudo -n` is unavailable.
2. A Mac mini Git `2.54.0` artifact that is executable there and has the same executable SHA-256 as the MacBook canonical Git. Current Mac mini has only `/usr/bin/git` `2.50.1`; installation must not overwrite it.
3. A Mac mini Node runtime compatible with the frozen host code and validation route; current login-shell Node is `v25.9.0`, while the MacBook/canonical validation toolchain is `v26.0.0`.
4. Two separate repository-limited Mac mini credentials: a write-enabled repository deploy key used only by Git transport for the current branch, and a fine-grained PAT or GitHub App credential used only by the PR API with Metadata read, Contents read, and Pull Requests write. The PR credential has no Contents write, so it cannot authorize the merge endpoint. Protected `main` must have no deploy-key bypass. Mac mini's current `gh` authentication is invalid. The MacBook's authenticated `gadfly-hbo` credential and its `gist/read:org/repo/workflow` scopes must not be copied or treated as either Mac mini credential.
5. A working Controller-selected Codex Remote route to the exact Mac mini project for best-effort daily courier use, existing authenticated SSH reachability to `myhost` only for install, rollback, emergency diagnosis, or explicit backup submission, and an installed Mac mini Codex runtime capable of the exact frozen agent/model/sandbox routes.

Missing or failed prerequisites keep Activation `BLOCKED`; they do not authorize fallback credentials, ambient PATH, weaker hashes, or manual bypass.

## Activation and Stop Line

Merge alone does not authorize a product Change. Activation becomes operational only after all fourteen canaries, Test Asset Retirement, exact Candidate Validator PASS, archive/canonical publication, squash merge, dual-main synchronization, host configuration readback, and rollback evidence pass without admitting a disposable valid DISPATCH. It then stops at `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. The first positively accepted production signed DISPATCH occurs only in the separately user-authorized first real product Change; its pointer, State, Ledger, and later PR facts are also the durable positive proof of Remote delivery and real-signature acceptance.
