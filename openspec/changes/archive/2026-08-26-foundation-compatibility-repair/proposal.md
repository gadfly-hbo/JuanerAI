# Proposal: Foundation Compatibility Repair

## Identity and Decision

- Change ID: `CHG-foundation-compatibility-repair`
- Change directory: `openspec/changes/foundation-compatibility-repair/`
- Baseline: `713350494df4fa1af587cb7bfef392aa1c06f067`
- Change class: ordinary R2 conformance repair against a released durable-boundary contract
- Mode: inactive Foundation only
- Current result: `SPEC_READY`; this is not Controller Spec Gate PASS
- `greenfield_fast_path`: forbidden

This Change corrects four implementation incompatibilities with the already published Dual-device Transition Foundation contract. It creates no new product behavior and no Foundation contract delta.

## Why

The published Reduced V1 Foundation is the authority, but the baseline implementation still:

1. admits only the Foundation Change ID rather than any canonical valid product Change ID;
2. rejects a same-Change signed `REVISION` from an exact `AWAITING_CONTROLLER` Frozen Candidate;
3. commits every Candidate against the baseline instead of the durable current Candidate and does not close the later fast-forward branch/PR path; and
4. accepts `NOT_STARTED` as a settlement and uses noncanonical `START_FAILED` and `INTERRUPTED` shapes.

Leaving these defects in place would make later Mode Activation unable to exercise the published contract. Repair is required before any real key, trust provider, host loop, SSH ingress, credential, or product Change may be activated.

## Objectives

### Product objective

Preserve the published JuanerAI Foundation behavior exactly. No product capability, user-visible semantic, authority allocation, or activation decision changes.

### Delivery objective

Produce one minimal Test-only RED set and one minimal Coordinator implementation repair for `FCR-1` through `FCR-4`, with fail-closed negative evidence and no write outside the two frozen later paths.

### Learning objective

Demonstrate whether the four mismatches can be closed by reusing the existing command validation, pointer/state CAS, Agent binding, Git/PR/Ledger gateways, six macro states, seven Ledger event classes, and four recovery boundaries. Any need for another mechanism blocks this Change.

## Scope

### Current Spec-agent write scope

- `openspec/changes/foundation-compatibility-repair/**`

### Later Test write scope

- `tools/harness/change-coordinator/coordinator.test.mjs`

### Later Worker write scope

- `tools/harness/change-coordinator/coordinator.mjs`

### Read-only reused inputs

- `openspec/specs/dual-device-transition-foundation/spec.md`
- `openspec/changes/archive/2026-08-26-dual-device-transition-foundation/design.md`
- `tools/harness/change-coordinator/adapters.mjs`
- existing frozen fixtures, runner, CLI, governance, project-control, and repository configuration

There are no conditional write paths.

## Out of Scope and Forbidden Areas

- no change to any canonical Requirement or Acceptance Criterion;
- no write to `openspec/specs/**` during implementation or archive;
- no write to `tools/harness/change-coordinator/adapters.mjs`;
- no fixture, helper, CLI, README, runner, dependency, governance, project-control, configuration, product, or host change;
- no new public interface, command kind, command field, settlement field, macro state, phase, Ledger event class, Gateway method, lock, recovery boundary, durable schema, or compatibility layer;
- no real key, trust provider, ACL, SSH, host loop, GitHub credential, live Agent/model/network/provider call, or Mode Activation;
- no commit, push, PR, merge, Acceptance, archive, release, deletion, or dual-device synchronization at this Spec Gate;
- no second Change admission, cross-Change enumeration, force push, branch deletion, PR replacement, or historical Ledger rewrite.

## Conformance Objectives

- `FCR-1`: remove the Foundation-only Change ID restriction while preserving canonical validation, pointer-first admission, and Global WIP exactly one.
- `FCR-2`: admit the existing blocked second-Validator-failure revision and the exact `AWAITING_CONTROLLER` Frozen-Candidate `changes_requested` revision, always returning to `EXECUTING/TEST_RED` with a fresh authorization cycle and repair budget zero.
- `FCR-3`: bind first and later Candidate ancestry, Worktree/stage/commit readbacks, remote predecessor, normal fast-forward branch publication, same-PR readback, and immutable history using only existing gateways and state.
- `FCR-4`: accept only the four canonical settlement variants and keep `NOT_STARTED` as a Coordinator-authored pre-request fact.

These identifiers are Change-local conformance objectives, not new canonical Requirements or Acceptance Criteria.

## Dependencies and Preconditions

- The baseline and branch must remain exactly the dispatched identities.
- Test must establish one causal RED group for each FCR before production modification.
- The complete existing Coordinator suite must remain healthy apart from the four intended RED groups.
- Test and Worker must remain logically isolated and use only their one exact write path.
- No new package or external service is permitted.

## Activation

Merge of this repair, if later accepted, remains inert. It does not create or start a host loop, trust provider, mutating CLI, daemon, scheduler, queue, Agent, network call, or product Change. Passing this Change may only satisfy the pre-Activation compatibility prerequisite; Mode Activation still requires separate explicit user authorization.

## Rollback

Before integration, rollback is the normal review rejection or revert of the exact Test/Coordinator diff while retaining evidence. After any later integration, rollback follows the existing Git governance workflow and must not rewrite canonical Foundation bytes or historical Ledger evidence. A rollback that would require a contract, schema, Gateway, state, event, lock, or recovery change is out of scope and returns to the Controller.

## Risk and Evidence Level

R2 evidence is required because the implementation governs signed authority, Global WIP, revision admission, Candidate ancestry, publication identity, and Agent lifecycle evidence. Required evidence is deterministic and local: causal RED, focused GREEN, full affected regression, Test Asset Retirement, complete scope diff, canonical-spec byte hash equality, and fresh exact-Candidate read-only Validator evidence.

## Stop Line

Return `BLOCKED` immediately if any FCR requires changing published semantics; adding a path, dependency, public surface, durable field, state, event, Gateway, lock, or recovery boundary; weakening a rejection or forbidden-side-effect assertion; modifying frozen files; or resolving Candidate/remote/PR identity by force, overwrite, replacement, or historical evidence loss.
