# Proposal: Change Coordinator Worktree Validation Execution Boundary

> M1 closure record — 2026-09-05: Controller accepts the Validator004-frozen WVEB component; this package is mechanically archived under the current M1-only user authorization. Production/Test and normative semantics are unchanged. Integration/live-main remain pending until readback. Historical Gate/identity/authorization statements below remain stage-bound. Current recovery: [NEXT_ACTION](../../../../docs/planning/2026-09-05/automation-repair/NEXT_ACTION.md); [Acceptance](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-acceptance-001.md).

## Identity and Current Gate

- Change: `CHG-change-coordinator-worktree-validation-execution-boundary`
- Authority package: `RGE-VALIDATION-BOUNDARY-RESLICE-001`
- Intake text SHA-256: `bd9647f750ea765c438150cb441f134181838c8db58d01fef405d43677a173ec`
- Repository baseline: `33f04a35d13abe64f4394d54eec166b58cb44716`
- Change class: R2 boundary Change
- Current verdict: `SPEC_DRAFT_PENDING_CONTROLLER_REVIEW`
- `greenfield_fast_path`: forbidden

This Change closes only the reusable observation and execution boundary needed to validate a signed Mac mini worktree without granting Coordinator progression. It replaces the current validation gateway's SHA-only subject and short receipt at this boundary; it does not revive any terminated RGE or Candidate Change.

## Goal

Deliver two layers:

1. an I/O-free `WORKTREE` snapshot contract that validates an already-collected observation and derives deterministic scope, raw-inventory, and snapshot identities; and
2. the sole production consumer in `production.mjs`, which collects the exact Git/filesystem observation, runs one of two closed Node validation definitions at most once, performs a post-execution snapshot, and returns one exact execution receipt.

The acceptance endpoint is executable L1 mutation evidence plus L2 evidence against a real temporary Git worktree and real Node child process. This Change does not prove or authorize L3 Coordinator Regression orchestration.

## Scope and Ownership

### OpenSpec write scope

- `openspec/changes/change-coordinator-worktree-validation-execution-boundary/**`

### Eventual Test write scope

- `tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs`

### Eventual production write scope

- `tools/harness/change-coordinator/worktree-snapshot-contract.mjs`
- `tools/harness/change-coordinator/production.mjs`

### Conditional paths

- none

### Forbidden paths and behavior

- `tools/harness/change-coordinator/coordinator.mjs`, `adapters.mjs`, `fixtures.mjs`, and `host-loop.mjs`;
- every existing Test, including terminated RGE Tests;
- direct production-period edits to `openspec/specs/dual-device-transition-foundation/spec.md`;
- State, Event, Ledger, Candidate, Final Validation, and Regression-to-STAGE behavior;
- public Coordinator methods, gateway methods other than the existing `validation.execute`, dependencies, network, retry, recovery, and persistent authority;
- stage, commit, push, PR, Handoff, merge, Acceptance, archive, or release effects;
- project-control writes by Spec, Test, Worker, or Validator, and any rewrite of historical events or terminated records. The already-authorized Controller start records remain unchanged. The Controller retains only its existing `status-cli.mjs` authority at authorized lifecycle transitions; this Change adds no project-board method or authority.

## Non-goals

- L3 orchestration through `applyControllerCommand`, `run`, `settlement`, or `status`;
- adoption or production of a Candidate, Candidate tree, Validator Head, Ledger record, State transition, or STAGE admission;
- a generic snapshot framework, public collector, injected Git/filesystem/process capability, alternate Runtime, fallback, compatibility shape, or recovery loop;
- a file-content payload or file-size ceiling; production hashes regular files as streams and never passes their bytes into the pure contract;
- any real external or network effect.

## Architecture and Security Boundary

The new snapshot module is a pure standard-platform contract with no I/O, authority, environment, clock, or callbacks. `production.mjs` is its only production consumer and owns all observation and child-process effects. It retains the fixed `PINNED_PRODUCTION_GIT_PATH`, root-owned host configuration, and the existing zero-field `createProductionComposition({})` boundary. No product Core, Port, Adapter family, Profile, trust source, credential, State, or Ledger contract is added.

Malformed requests fail with `INPUT_INVALID` before Git or process work. A valid request whose worktree identity, scope, inventory, index, containment, or race evidence is untrustworthy produces only the closed `SUBJECT_MISMATCH` receipt outcome. Neither outcome authorizes any later validation, Ledger, State, STAGE, Candidate, push, PR, or Handoff effect.

## Evidence Level and Route

R2 is required because this Change closes a process-execution, filesystem-identity, Git-worktree, and cross-module receipt boundary. The frozen route is:

- Spec: `juaner_spec`, `gpt-5.6-sol/high`;
- after Spec Gate PASS, Test: `juaner_test`, `gpt-5.6-terra/high`;
- after valid TDD_READY, Worker: `juaner_worker`, `gpt-5.6-terra/high`;
- after implementation and evidence freeze, Validator: fresh read-only `juaner_validator`, `gpt-5.6-sol/high`.

One Test return and one implementation return are operating targets, not evidence budgets. A second same-kind correction returns to Controller root-cause review. The Controller must run the mandatory complete-diff `ponytail-review` before Spec Gate because this Spec used high reasoning and changes a governance execution boundary.

## Successor Lock and Rollback

`change-coordinator-regression-to-stage` may start only after this Change has Controller Acceptance, merge, archive, and live `main` readback. Until then, WVEB grants no L3 authority.

Before integration, rollback is deletion of only this Change's eventual new Test and snapshot module plus restoration of the bounded `production.mjs` diff. After integration, rollback requires a separately approved Change; no automatic retry, recovery, compatibility path, or history rewrite is authorized.

## Stop Line

Return to the Controller if closure requires another production or Test path, any public Coordinator or gateway method, a new schema/field/outcome beyond this package, a dependency, injected authority, network, retry/recovery, persistent state, or any L3/Candidate/Final Validation behavior. Contract ambiguity or a second same-kind Spec/Test/Worker correction also stops forward dispatch.
