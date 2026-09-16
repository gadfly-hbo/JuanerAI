# Proposal: Change Coordinator Startup Directory Preparation

## Status

- Change ID: `change-coordinator-startup-directory-preparation`
- Change class: R2 boundary Change (root-owned startup path, permissions, and
  launch lifecycle)
- Milestone: original M3 / `BLK-D1A-008`, item 5
- Current verdict: `SPEC_GATE_PASS / TEST_ENTRY_PENDING`
- Product input: R341 approved plan delta and independent Readiness `PASS`;
  R342 supplies only the temporary Spec carrier authorization

Controller accepted this package at R342 after complete review and bounded
corrections. It does not claim RED, implementation, deployment, host validation,
D1, or M4 completion. The R342 review and freeze identify this Gate.

## Problem and Objective

The sole root-owned Host Loop listens on
`/private/var/run/juanerai/change-coordinator.sock`, but its current listener
entry assumes `/private/var/run/juanerai` already exists. A one-time manual
`mkdir` therefore does not close the launch-lifecycle prerequisite.

The only objective is to make that same trusted listener entry, on every
start, safely validate the fixed directory or create it when it is distinctly
absent, before binding the unchanged socket. A safe pre-existing directory is
used without mutation. An unsafe, ambiguous, raced, or unreadable path rejects
the start before any protected business action.

## Scope

### Future production write path after all Gates

- `tools/harness/change-coordinator/host-loop.mjs`

Only the fixed startup-directory preparation, its private bounded OS boundary,
and the call immediately before the existing socket listener may change.

### Future Test write path after Spec Gate

- `tools/harness/change-coordinator/mode-activation.test.mjs`

Only new startup-directory leaves, their same-file controlled OS setup, and
the necessary adaptation of `TEST-MA-HOST-003` may change. Test Design freezes
the exact leaves, commands, hashes, counts, and causal RED.

### Explicitly forbidden paths and effects

- no change to `install-host-loop`, the LaunchDaemon plist, the other four
  runtime modules, canonical or archived specifications, Foundation/Core,
  CLI, helper, dependency, persistent schema, State, pointer, WIP, Ledger,
  Handoff, trust, credentials, Git, provider, project-control, or old C1 work;
- no new daemon, watchdog, retry, queue, cleanup pass, installer route,
  registry, protocol, recovery boundary, or persistent receipt;
- no recursive ancestor repair, no modification of `/private`,
  `/private/var`, or the accepted `root:daemon 0775` `/private/var/run`, and no
  repair, replacement, deletion, `chmod`, `chown`, or ACL mutation of an
  already existing `/private/var/run/juanerai`;
- no removal of a socket believed stale, no automatic task replay, and no
  change to the existing single-instance, `KeepAlive`, timeout, K1/K2/hour,
  R329, P5/EMPTY, S09/A2, or four-recovery-boundary contracts.

## Canonical Delta

This Change supersedes canonical `AC-RIC-004-01` only where that criterion says
every non-runtime directory/service/socket rule remains unchanged: the one
fixed runtime socket parent now has the startup preparation duty specified in
`REQ-SDP-001..006`. `HOST_INSTALL_TARGETS`, installer behavior, the socket
path/policy, every other directory rule, and every other protected item in
`AC-RIC-004-01` remain unchanged.

## Observable Acceptance Endpoint

Through the actual `serveTrustedHostLoop` listener entry, controlled local
evidence proves all three positive starts: a safe existing directory, a
distinctly absent directory safely created, and a later start after the
directory is distinctly absent again. Each reaches the existing real temporary
Unix socket and canonical read-only `status` response. Negative evidence covers
parent/target type, owner, group, mode, ACL, configured-runtime search/write
access with supplementary groups initialized from the same numeric runtime UID,
`ENOENT` classification, pre-mutation
root-owned `0700` provenance, create/readback failures, observed identity races,
and existing socket/second-instance conflicts. Preparation rejection proves no
listener creation, no Host Loop method call, no protected-state mutation, and
no repair of an existing object. The Change does not generalize that guarantee
to failures after listener preparation. A directory created by that failed
invocation is left in place for diagnosis.

Local evidence does not prove real Mac mini root, runtime identity, launchd,
reboot, or fixed-path behavior. Those remain `NOT_VERIFIED` until the separately
authorized exact host operation package.

## Compatibility, Activation, and Rollback

Safe existing installations and the socket/CLI contract are compatible. No
data migration or backfill exists. After Spec Gate, the order remains isolated
Test Design and causal RED, TDD_READY, minimum Worker, GREEN and affected
regression, Test Asset Retirement, fresh Validator, Controller acceptance,
integration, exact package/deployment and failure rollback, then target-host
acceptance. Only then does work return to the same `SERVICE_BEFORE` and complete
environment window, followed by original D1 and M4 processing.

This Change authorizes no executable rollback route. A later separately
approved exact package operation may bind the recorded predecessor/manifest
and explicit rollback action under the original plan; it may not automatically
invoke or revive the old blocked installer. If separately restored bytes cannot
start because the directory is absent, the operation stops at the recorded
service failure/manual-stop point and does not invent repair or claim recovery.

## Gate

Because this Spec used the R2 high route and changes a permission/startup
boundary, Controller reviews all seven files and runs complete-diff
`ponytail-review` before Spec Gate. Any need for another production/Test path,
plist or installer change, persistent contract, automatic cleanup, broader
authority, or an unclosed safe positive path returns `BLOCKED` to Controller.
