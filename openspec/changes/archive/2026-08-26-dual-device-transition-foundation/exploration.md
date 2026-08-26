# Exploration: Dual-device Transition Foundation

## Intake

- Change: `CHG-dual-device-transition-foundation`
- Unique planning input: `/Users/huangbo/Documents/Codex/2026-08-24/github-issue-prd-issue-bug-prd/outputs/juanerai-controller-executor-dual-device-mode-draft.md`
- Explored baseline/HEAD: `5236867c75b2166946dd9d2b81f19f0bd10d4f2e`
- Branch: `work/macbook/dual-device-transition-foundation`
- Device/role: MacBook / formal `juaner_spec`
- Class/route: Foundation plus persistence/recovery/external effects; R2 / complex; Spec route Sol high as dispatched by the Controller.
- Lifecycle: Explore complete; no Test, Worker, Validator, H, P, C, A, live Agent, live PR, or mode activation started.

## Authorities Read

- `AGENTS.md`, `CONTEXT.md`, and `Orchestration.md`.
- `.ai-coding/policies/testing.md` and `.ai-coding/definition-of-done.md`.
- `docs/governance/change-complexity-control.md`, `test-asset-retirement.md`, `agent-model-routing.md`, and `git-development-workflow.md`.
- `.codex/config.toml` and all four project Agent configurations for current role identity/routing facts.
- `openspec/changes/README.md`, the archived R2 Model Pack Change, and the retrospective template for package style and Gate completeness.
- `tools/harness/README.md`, `tools/harness/validation/run`, `tools/harness/git/start-work`, `tools/harness/git/bootstrap`, `package.json`, and `tsconfig.json`.
- The unique approved dual-device mode planning input named above.

Official Codex subagent documentation was consulted only as a non-normative feasibility check after local CLI/config inspection. It confirms that current local Codex clients create custom subagents through a parent Codex session responding to direct instructions; the local `codex exec --help` exposes no option that directly selects `juaner_spec`, `juaner_test`, `juaner_worker`, or `juaner_validator`. This exploration therefore does not invent a direct role-launch flag. The planning input and repository authority remain normative.

## Current Baseline Facts

- `tools/harness/git/start-work` requires the current Worktree to be clean, fetches `origin`, fast-forwards local `main`, and switches the current Worktree to a new branch. It does not create an additional Worktree, manage freeze/revision/recovery, or preserve a current Change Worktree for Controller review.
- `tools/harness/git/bootstrap` records only device identity and local Git defaults. It has no Global WIP, Change manifest, lock, Ledger, or candidate state.
- `tools/harness/validation/run` is a shell fail-fast runner with a closed command list, approved command-local toolchain, and unconditional real-model gate removal. An exact append is sufficient; no runner replacement is needed.
- The repository already uses Node ESM, `node:test`, and standard-library process/filesystem facilities. New package dependencies and TypeScript graph changes are unnecessary.
- Project Agent definitions freeze names, role instructions, default models, reasoning, and sandboxes. The Coordinator must consume those roles without editing their files or silently lowering the route.
- The current human project board is MacBook-only, has one authoritative `status.json`, best-effort event files, and no concurrent writer contract. It cannot be reused as the automatic Agent Run Ledger and must not be written by Mac mini.
- No `refs/heads/evidence/agent-runs`, Coordinator state directory, Transition Worktree manager, or automated PR handoff exists in the explored source.
- The working tree already contains Controller-owned `.juanerai/project-control/**` changes. They are outside this role's write scope and are preserved unchanged.

## Reuse Decisions

- Reuse the existing Git authority: `origin/main`, `work/<device>/<slug>`, squash-only integration, no force-push, and explicit branch/Worktree deletion approval.
- Reuse project Agent names and routing policy; do not introduce another role taxonomy or custom Agent configuration.
- Reuse the canonical validation runner through one exact conditional append.
- Reuse Node standard library and `node:test` patterns. Do not add a queue, database, service, daemon, workflow engine, lock server, or package.
- Reuse stable JSON, SHA-256, atomic same-directory replace, Git commits/refs, and normal non-force pushes as sufficient durable primitives.
- Reuse the Test Asset Retirement policy rather than inventing an automatic test-deletion system.

## Closed Foundation Delta

The smallest complete delta is one deep Coordinator module, one thin CLI, one adapter composition module, one colocated README, and focused tests/doubles:

```text
Dispatch / Revision / Controller record
    -> one Coordinator library + CLI
    -> one createCoordinatorAdapters(options) composition
    -> local manifest/exact state plus one operation mutex and one Change lock under explicit state_root
    -> one current Change Worktree
    -> exact delegated Gate table + cooperative host settlement
    -> exact Candidate state machine
    -> injected Git gateway
    -> append-only evidence Worktree/ref
    -> injected PR gateway
    -> structured handoff or fail-closed stop
```

No product or governance activation file imports or calls this module in Foundation.

## State-root and Evidence-ref Decision

- The Coordinator receives repository/state roots and writer identity through the factory's explicit closed `runtime`, and requires them to match the Dispatch. Production composition resolves the state root before factory creation; tests always supply temporary roots. No hidden property or ambient/global lookup hydrates state.
- Local state is machine-local operational state, not a new repository contract and not `project-control v2`.
- The isolated Evidence Worktree is a sibling supplied by the manifest and is bound only to `refs/heads/evidence/agent-runs`.
- Ledger files use `changes/<change_id>/agent-runs.jsonl` on that ref. One normal Git commit appends one logical record; normal non-force push provides remote persistence. A remote-tip change rejects the write and requires recovery/ownership reconciliation.
- Git commit objects/parent history, contiguous JSONL sequence, canonical-byte readback, and remote-tip comparison detect truncation, rewrite, and conflicts. No second record-level hash chain is needed, and none of these integrity facts replaces Controller authority.

## Agent Host Settlement Boundary

The Foundation closes Agent orchestration without inventing a custom-Agent CLI flag or leaving an unspecified gateway:

- `runUntilStop` accepts exactly `{ change_id, agent_settlement }`;
- when settlement is `null` and a role is due, it persists/readbacks `invocation_requested` and returns a closed named-child `next_action`;
- the Mac mini Codex Coordinator host uses the existing subagent mechanism, observes the real child start/result, and returns closed STARTED then RESULT settlements through the same method;
- START_FAILED and INTERRUPTED are equally closed settlements; wrong/late/duplicate/ambiguous facts are fail-closed or exactly idempotent;
- Foundation uses deterministic host-settlement fixtures and no real Agent/model;
- Mode Activation proves `run -> next_action -> real child STARTED -> fixed RESULT -> next state/readback` before live Change dispatch.

This is the concrete attachment seam. It preserves formal role isolation and avoids an Agent runner, injected Agent dependency, hand-written substitution, model downgrade, or false Gate progress.

## Delegated Gate and Controller Decision Decision

- The Dispatch freezes eight exact ordered `GateDefinitionV1` entries covering Spec Gate through final Validator. Agent result, validation, subject SHA, Ledger bytes, and remote readback must all match before automatic progress.
- These internal execution Gates do not need MacBook per-Gate writes. This is required for one `runUntilStop` loop to reach Final Handoff without a hidden advance method.
- `CONTROLLER_DECISION_REQUIRED` is reserved for Change-boundary contract/scope/permission/stop-line/changes-requested/Acceptance/merge/archive/next-Change decisions.
- One closed `ControllerRecordV1` records dispatch, conditional-path release/block, stop-line, and post-handoff facts. It cannot fabricate Gate PASS or implementation; CHANGES_REQUESTED remains record-only and `authorizeRevision` is the sole revision transition.
- The sole Adapter factory's exact seven-key return, 17 Git methods, and explicit runtime are the shared production/double seam. The sole added Git method is a read-only, closed Evidence Ref Change enumeration used for cross-local/remote Global WIP; the identical driver proves it and staged index behavior only against an OS temporary repository and bare `origin`.

## Concurrency and Publication Answers

- Admission event: one valid Dispatch Package for the exact baseline and an empty Global-WIP slot.
- Already-issued work: at most one role invocation or one Git/validation/PR side effect identified by an idempotency key.
- Local linearization: successful atomic state-file replace after required Ledger persistence; lock acquisition linearizes at exclusive lock-directory creation.
- Remote Ledger linearization: successful normal push followed by remote-tip and record readback.
- Candidate linearization: Candidate commit SHA returned by Git after exact index readback and clean-worktree proof.
- Delivery linearization: PR branch/head/body readback succeeds, terminal Ledger records read back remotely, frozen state is atomically written, and the write lock is released. Before all of these, state is not `AWAITING_CONTROLLER`.
- Race winner: the first valid lock owner and current state/version wins. Any stale expected state, lock owner, local Head, remote Head, evidence tip, idempotency result, or Agent correlation rejects without issuing the next effect.
- Late settlement: a result from a no-longer-current Agent correlation is recorded as late/interrupted evidence when possible but cannot advance a Gate.
- Concurrent public calls: one acquires the lock and proceeds; the other returns `COORDINATOR_LOCK_HELD` or `COORDINATOR_STATE_CONFLICT`. They never both issue an effect.
- Exceptional writes: only append-only interruption/block evidence and local recovery metadata are allowed after a failure; no product-tree mutation is allowed while frozen.
- Bounds: every external call receives a dispatch-frozen timeout and retry count. Only idempotent fetch/read/readback and a failed-before-acceptance push/PR upsert may use the declared bounded retry. Agent runs, commit, state transitions, merge, deletion, and ambiguous external writes are never blindly retried.

## Rejected Alternatives

- Extend `start-work`: rejected because it owns the current Worktree and would mix old-mode behavior with a larger stateful protocol.
- Add `project-control v2`, a control ref, or multi-Change schema: explicitly out of scope.
- Use `project-control/events` as Ledger: rejected because it is best-effort, MacBook-only, and non-authoritative.
- Put terminal Ledger commits on the Candidate branch: rejected because it would invalidate final validation and Validator SHA binding.
- Use a database/queue/daemon/background poller: rejected because Global WIP=1 and explicit Dispatch need none.
- Use GitHub Issues/Projects for state: explicitly forbidden.
- `git add .`, `git add -A`, force-push, reset/rebase, automatic merge, or automatic deletion: rejected by the approved safety contract.
- Treat a primary Codex response as a formal role result without child-start proof: rejected as false role/Gate evidence.
- Parallelize Changes or role writes: explicitly forbidden.

## Contract Correction 006 Implementability Closure

The repeated dual-axis review proved that three details could not be implemented safely inside the earlier generic wording: cross-instance admission lacked one linearization mutex; remote Global WIP could not enumerate a different Change; and local durable State/Ledger/Handoff/results were not closed enough for deterministic crash recovery. The user approved only those three corrections.

- Exactly `state_root/coordinator-operation-lock/owner.json` now serializes local mutating calls through the existing filesystem dependency; no service, control ref, owner epoch, or third lock exists.
- Exactly one read-only `enumerateEvidenceChanges` Git method raises the surface from 16 to 17 and returns sorted validated terminal/active facts at one remote evidence tip.
- Exact `StateV1`, event-detail/transition/idempotency/recovery, `HandoffV1`, and per-operation results now make remote-success/local-state-failure convergence and cleanup eligibility deterministic without new public methods, events, states, dependencies, permissions, or live effects.

The correction also closes existing intended behavior rather than expanding it: new Candidate/revision invalidates old final validation; a second Validator FAIL enters `BLOCKED_HANDOFF`; conditional path release has a durable same-state receipt; merged cleanup proves both Candidate and merged commit trees; and `RELEASED` is only a read-only cleanup report eligibility.

## Contract Correction 008 Trust and Exactness Closure

The CC007 review correctly stopped because plain runtime/environment/Dispatch data could not authenticate MacBook origin. User-approved CC008 supplies one non-caller-controlled source: Mode Activation installs the public half of a dedicated MacBook Ed25519 key at exact root-owned `/private/etc/juanerai/controller-trust.json`; Foundation only reads and verifies it.

- Reuse the existing filesystem dependency and `readCanonicalJson` method with one exact trust-policy/metadata receipt; no dependency or method is added.
- Verify fixed path, root uid/gid, `0755` directory, `0444` single-link regular file, no symlink/race, canonical one-active-key record, repository/operation/schema/domain binding and self-hash before signature acceptance.
- Sign a domain-separated canonical one-shot invocation binding Change/repository/manifest/state/tip/subject/time/nonce/idempotency/decision. Runtime device is only a verified-origin label.
- Generate only ephemeral in-memory Test keys. Real key/path/permission/SSH/remote-call and rotation canaries stay in Mode Activation.
- Close the prior no-choice bootstrap/turnover, recovery, event/result, Validator and Handoff gaps without changing the frozen counts or authority surface.

## Explore Verdict

`SPEC_READY` for independent Controller review; this is not Spec Gate PASS.

The approved plan closes every product, authority, state, ownership, publication, recovery, and non-goal decision required for this Foundation. Exact TypeScript is unnecessary because the repository Harness is ESM JavaScript; the exact public JavaScript/JSON seams are frozen in Design. No new Controller product decision is required before Spec Gate. Real Agent and GitHub production canaries are correctly deferred to Mode Activation and cannot be claimed by deterministic Foundation evidence.
