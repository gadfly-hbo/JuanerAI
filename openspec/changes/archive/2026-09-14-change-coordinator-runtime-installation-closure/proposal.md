# Proposal: Change Coordinator Runtime Installation Closure

> Archive history (2026-09-14): Controller accepted the applicable local repair under R242/R248 and authorized mechanical archive in R258. Historical Gate/task/evidence text below is preserved, not a current pending verdict. S09/A2 remains USER_WAIVED / NOT_VERIFIED; target-host deployment, EMPTY/D1 and BLK-D1A-008 remain pending. This archive does not authorize Desktop or a product DISPATCH.

## Status

- Change ID: `change-coordinator-runtime-installation-closure`
- Change class: R2 boundary Change (installation persistence, rollback, and permissions)
- Milestone: original M3 / `BLK-D1A-008`
- Current verdict: `SPEC_READY / CONTROLLER_SPEC_GATE_PENDING`
- Product authority: R243 finite semantics and two-path scope approved at R244;
  temporary Spec carrier approved at R245 entry

This package is a draft for Controller review. It does not claim Spec Gate PASS,
RED, implementation, deployment, or host validation.

## Problem

The production composition imports `worktree-snapshot-contract.mjs`, but the
host installer admits and copies only the other four runtime modules. Merely
adding that fifth name would make the same shared directory inventory reject a
legitimate installed four-file predecessor and would make its backup impossible
to restore. The runtime installation package is therefore not yet a closed,
rollback-safe M3 artifact.

## Objectives

- Product objective: preserve the already accepted local Coordinator while
  making its runtime package installable as the exact module closure it uses.
- Delivery objective: change only the existing installer runtime-directory
  admission, backup, and restore rules, with permanent coverage in the existing
  Mode Activation installer tests.
- Learning objective: prove locally which exact predecessor set was present,
  which bytes and metadata were backed up, and whether rollback reconstructs
  that same set without treating controlled local evidence as Mac mini proof.

## Proposed Change

1. New installation sources admit exactly five regular, non-symlink files:
   `adapters.mjs`, `coordinator.mjs`, `host-loop.mjs`, `production.mjs`, and
   `worktree-snapshot-contract.mjs`.
2. The installed runtime predecessor is classified only as `ABSENT`, exact
   legacy four-file runtime, or exact current five-file runtime. The legacy set
   is an upgrade/restore input only, never a new-install source.
3. Backup records the actually classified set using the existing manifest
   structure and actual bytes/hash/owner/mode/ACL. It never synthesizes the
   snapshot module for a legacy predecessor.
4. Rollback validates the exact manifest name set, each backup path's derived
   source identity, and each hash against bytes actually read before restoring
   the recorded set. `ABSENT` returns to absence; legacy four returns to exact
   four with no snapshot residue; current five returns to exact five.

## Scope

### Future production write path after all Gates

- `tools/harness/change-coordinator/install-host-loop`

Only the runtime-directory new-source list, predecessor classification,
backup/restore selection, and necessary private parameter passing may change.

### Future Test write path after Spec Gate

- `tools/harness/change-coordinator/mode-activation.test.mjs`

Only `TEST-MA-INSTALL-001`, `TEST-MA-INSTALL-002`, and their necessary local
same-file setup/assertions may change. Exact leaves, selectors, counts, runtime,
and budgets are frozen by the isolated Test role.

### Non-goals and forbidden effects

- no change to `HOST_INSTALL_TARGETS`, the manifest schema/version, public
  installer request/receipt, service/socket/trust/credential behavior, retry,
  timeout, revocation, or recovery-boundary count;
- no change to Coordinator, adapters, host loop, production composition,
  snapshot implementation, Git executable/dylib installation, State, Ledger,
  Handoff, canonical specs, archived Changes, dependencies, configuration, or
  project-control;
- no arbitrary-version discovery, general compatibility registry, migration,
  concurrent installer protocol, journal, new rollback mechanism, or global
  atomicity/zero-side-effect guarantee;
- no real host, sudo, provider, network, installation, deployment, Desktop,
  credential, or Git publication action under this Change package.

## Observable Acceptance Endpoint

Against `createHostInstaller(osBoundary)` and real temporary files, the exact
five-file source installs, the installed production module graph can be loaded
without running `host-loop` main or reading real configuration, and each legal
predecessor (`ABSENT`, old4, new5) is restored after the existing rollback path.
Unknown/mixed/damaged inventories and substituted or hash-drifted manifest
backup sources fail closed and never report successful rollback. Existing
owner/mode/ACL/effective-write, service, Git closure, and preservation controls
remain intact. Real root/runtime-user/service/Mac mini proof remains explicitly
`NOT_VERIFIED` until the separately authorized A4 host work.

## Compatibility, Activation, and Rollback

This is bounded compatibility for one already installed legacy runtime shape.
It does not make legacy four a supported new package and does not register
versions. Activation occurs only after Spec Gate, causal RED, TDD_READY, minimal
Worker GREEN, applicable regression/Retirement, fresh independent validation,
Controller acceptance, and later authorized integration/deployment. Rollback
uses the existing Mode Activation operation and manifest; it gains no new
authority and preserves the canonical `AC-MA-007-04/05` stop semantics.

## Gate

Controller must review all seven files, run the required complete-diff
`ponytail-review`, and record Spec Gate PASS before Test dispatch. Any need for
another production/Test path, schema field, host authority, or broader recovery
promise returns `BLOCKED` to Controller.
