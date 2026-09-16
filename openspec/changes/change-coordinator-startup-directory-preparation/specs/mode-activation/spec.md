# Mode Activation Delta: Startup Directory Preparation

`SHALL`, `MUST`, and `SHALL NOT` are normative. Unknown path identity,
metadata, ACL, access, race, or readback fails closed.

## ADDED Requirements

### REQ-SDP-001 — One Fixed Pre-listen Duty

The sole trusted Host Loop SHALL prepare or validate exactly
`/private/var/run/juanerai` on every start before listening on the unchanged
`/private/var/run/juanerai/change-coordinator.sock`.

- **AC-SDP-001-01 — Real entry and order:** The duty SHALL execute through
  `serveTrustedHostLoop` after validated runtime identity is available and
  before server creation/listen. Failure SHALL produce no listener success, no
  Host Loop method call, and no protected business action.
- **AC-SDP-001-02 — Fixed scope:** The duty SHALL accept no caller-selected
  path and SHALL NOT recursively create or modify an ancestor. `/private`,
  `/private/var` as `root:wheel 0755`, and the accepted `root:daemon 0775`
  `/private/var/run` SHALL be validated and remain unchanged. Their ACLs SHALL
  contain no mutating allow grant, and the configured runtime identity SHALL
  have search but no write access to every ancestor.
- **AC-SDP-001-03 — Preserved service contract:** The socket path, owner/group/
  mode, single-instance and occupied-socket rejection, status/submit protocol,
  LaunchDaemon plist, `RunAtLoad`, `KeepAlive`, and throttle policy SHALL remain
  unchanged. No socket is automatically unlinked or treated as stale.

### REQ-SDP-002 — Safe Existing Directory Is Read-only Input

A pre-existing fixed target SHALL be used only when it is the same safely bound
directory throughout validation.

- **AC-SDP-002-01 — Complete predicate:** The target SHALL be a non-symlink
  directory whose physical path is exact, whose authority is `root:wheel
  0755`, whose ACL has no `allow` entry granting `write`, `append`, `delete`,
  `delete_child`, `add_file`, `add_subdirectory`, `writeattr`, `writeextattr`,
  `writesecurity`, or `chown`, and for which the configured runtime identity
  has search access but no write access.
- **AC-SDP-002-02 — No-follow identity:** Path `lstat`, directory no-follow
  descriptor `fstat`, parent device/inode, target device/inode, realpath,
  metadata, ACL, and access observations SHALL agree before acceptance. Wrong
  type, link, unknown/error, or any drift SHALL reject the start.
- **AC-SDP-002-03 — No repair:** On the existing-target branch, the Host Loop
  SHALL NOT call create, remove, rename, `chmod`, `chown`, ACL mutation, or any
  recursive operation for the target or ancestors. Rejection SHALL leave the
  observed object and protected state unchanged.

### REQ-SDP-003 — Bound Creation Only After Exact Absence

The Host Loop MAY create the fixed target only when the initial `lstat` of that
exact target returns `ENOENT` after the parent chain has passed validation.

- **AC-SDP-003-01 — Absence and contention:** Ancestor or later `ENOENT` is an
  error. The parent SHALL retain the same device/inode and safety predicate
  immediately before one non-recursive `mkdir`. `EEXIST` or another observed
  contender SHALL be classified as a race and SHALL NOT be adopted or repaired
  in that invocation.
- **AC-SDP-003-02 — Created-object authority:** The invocation SHALL capture and
  no-follow-open the object it created before any metadata mutation. The first
  path and descriptor observations MUST agree on a non-link root-owned directory
  of exact mode `0700`, with no mutating ACL grant and configured-runtime write
  denied. Only the bound descriptor MAY then apply `root:wheel 0755`; it SHALL
  grant no ACL. The final object SHALL satisfy `AC-SDP-002-01`, including
  configured-runtime search allowed and write denied.
- **AC-SDP-003-03 — Stable final readback:** Parent and target identities,
  target type/physical path/owner/group/mode/ACL, and runtime access SHALL be
  re-read after creation and immediately before listener creation. A mismatch
  SHALL reject and SHALL NOT continue on a replacement object.
- **AC-SDP-003-04 — Repeated lifecycle:** After any successful start has ended,
  a later invocation facing a newly and distinctly absent fixed target SHALL
  perform the same checks and creation; success SHALL not depend on a prior
  manual `mkdir` or retained process memory.
- **AC-SDP-003-05 — Bounded threat claim:** Configured-runtime credentials SHALL
  initialize supplementary groups with the same validated numeric runtime UID
  later supplied to `setuid`, use the configured runtime GID for both
  `initgroups` extra group and `setgid`, and prove that exact subject cannot
  write any ancestor. No separate username SHALL enter the startup/probe input.
  Identity checks SHALL reject observed races but SHALL NOT be claimed to prevent an
  unrelated daemon-group or privileged writer from substituting a qualifying
  root-owned object, nor a privileged replacement after the final observation.
  A broader protected-subject contract is outside this Change.

### REQ-SDP-004 — Fail-closed Retained Diagnostics

Directory preparation SHALL fail closed without turning startup failure into a
recovery workflow.

- **AC-SDP-004-01 — Failure matrix:** Unsafe parent/target metadata or ACL,
  runtime search denial or write allowance, wrong type/link, unknown `lstat`,
  create/open/metadata/ACL/access/readback failure, or object/parent identity
  race SHALL prevent listener success and all protected business actions.
- **AC-SDP-004-02 — Created object remains:** Once this invocation's `mkdir`
  succeeds, any later preparation or listener failure SHALL leave the fixed
  directory in place. The Host Loop SHALL NOT remove, rename, recursively
  inspect, repair, or retry it and SHALL NOT claim startup success.
- **AC-SDP-004-03 — Bounded diagnostics:** Failure SHALL use a closed sanitized
  code through the existing `HOST_FAILED` diagnostic envelope: exactly
  `STARTUP_DIRECTORY_INPUT_INVALID`, `STARTUP_DIRECTORY_PARENT_INVALID`,
  `STARTUP_DIRECTORY_TARGET_INVALID`, `STARTUP_DIRECTORY_CREATE_FAILED`,
  `STARTUP_DIRECTORY_RACE`, or `STARTUP_DIRECTORY_READBACK_FAILED`. ACL text,
  usernames, environment, credentials, arbitrary OS error text, and protected
  business content SHALL NOT be emitted.
- **AC-SDP-004-04 — Forbidden recovery effects:** Preparation SHALL NOT alter
  State, pointer, WIP, Ledger, Handoff, task/Agent records, trust, credentials,
  Git, socket contents, or launchd policy and SHALL NOT replay, clean, retry, or
  add a fifth recovery boundary.

### REQ-SDP-005 — Executable Evidence at the Correct Boundary

The Change SHALL be accepted only from evidence that distinguishes local
controlled behavior from target-host authority.

- **AC-SDP-005-01 — Local positives:** The actual listener entry with a real
  temporary Unix socket SHALL prove safe-existing, distinctly-missing, and a
  later distinctly-missing-again invocation each reaches the existing
  canonical read-only status result.
- **AC-SDP-005-02 — Local negatives and protection:** Local evidence SHALL
  independently cover every rejection class in `AC-SDP-004-01`, existing
  socket/second-instance conflict, identity mutation at each material boundary,
  pre-mutation root-owned `0700`/ACL/runtime-write provenance, exact diagnostic
  mapping, no existing-object mutation, created-object retention, no listener
  or Host Loop method call on preparation failure, and protected-fixture
  equality. It SHALL NOT infer a universal post-listen close/no-method property.
- **AC-SDP-005-03 — Existing listener regression:** `TEST-MA-HOST-003` SHALL
  continue to prove one asynchronous canonical half-close status response via
  the real listener. Any necessary setup adaptation SHALL preserve that test's
  protocol oracle rather than replace it with a mock listener.
- **AC-SDP-005-04 — Evidence level:** Injected temporary filesystem/metadata/
  ACL/access evidence SHALL remain local controlled evidence. Actual Mac mini
  root, configured runtime user, launchd, fixed socket path, stop/start, and
  reboot evidence SHALL remain `NOT_VERIFIED` until separately authorized host
  validation.

### REQ-SDP-006 — Activation, Rollback, and Return Point

The startup delta SHALL preserve the existing Mode Activation and original M3
authority boundaries.

- **AC-SDP-006-01 — Exact package:** Activation SHALL bind the accepted
  integration SHA, exact five-module runtime package with only the approved
  `host-loop.mjs` delta, applicable Test hashes/results, Retirement disposition,
  Validator verdict, and an exact host operation package. It SHALL NOT reuse
  R302 authority or restore installer/C1 development.
- **AC-SDP-006-02 — Host positive and failure point:** Host acceptance SHALL
  prove safe-existing and safely created fixed-directory starts, socket/status,
  real owner/group/mode/ACL and runtime search/write behavior, plus an
  independently authorized stop/start or reboot readback. A missing-directory
  setup SHALL never delete contents or a socket. Unavailable safe preconditions
  remain `NOT_VERIFIED` and block acceptance. Evidence SHALL state whether an
  authorized stop/start or a real reboot actually occurred and SHALL NOT label
  one as proof of the other.
- **AC-SDP-006-03 — Rollback and preservation:** Deployment rollback SHALL use
  only a later separately approved exact package operation binding the recorded
  predecessor/manifest and explicit rollback action under the original plan.
  This Change SHALL NOT automatically execute or revive the old blocked
  installer. Any authorized operation SHALL preserve State, pointer, WIP,
  Ledger, Handoff, evidence, and Git history. If separately restored bytes
  cannot start with the observed directory state, the endpoint SHALL be service
  stopped and `MANUAL_CONTROLLER_STOP`, not invented repair or success.
- **AC-SDP-006-04 — Return:** Local acceptance SHALL return to original M3 exact
  package preparation. Host acceptance SHALL return to the same
  `SERVICE_BEFORE`/complete-environment window, then original D1. Neither local
  nor host evidence alone closes `BLK-D1A-008`, D1, M4, or authorizes Desktop or
  a product DISPATCH.

## MODIFIED Requirement

### AC-RIC-004-01 — One named startup-directory exception

`AC-RIC-004-01` is superseded only for the startup behavior of
`/private/var/run/juanerai`: the Host Loop now has the bounded duty in
`REQ-SDP-001..006`. `HOST_INSTALL_TARGETS`, installer behavior, all other
non-runtime directory rules, Git/dylib, State, pointer, Ledger, Handoff, canary
evidence, Git history, trust/credentials, socket policy, revocation,
timeout/retry, and the four recovery boundaries remain unchanged.
