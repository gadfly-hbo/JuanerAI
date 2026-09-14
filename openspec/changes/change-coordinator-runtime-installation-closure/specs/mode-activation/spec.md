# Mode Activation — Runtime Installation Closure Delta

## Status and Precedence

- Change: `change-coordinator-runtime-installation-closure`
- Baseline: `openspec/specs/mode-activation/spec.md`
- Class: R2 boundary Change
- Current verdict: `SPEC_READY / CONTROLLER_SPEC_GATE_PENDING`

This delta refines existing `AC-MA-003-02` and `AC-MA-007-04/05`. Unknown
runtime sets, manifest identities, backup sources, bytes, or readbacks fail
closed. Unaffected Mode Activation Requirements remain authoritative.

## ADDED Requirements

### REQ-RIC-001 — Exact Current Runtime Source

The host installer SHALL install only the complete current Coordinator runtime
module closure and SHALL preserve all existing source and authority checks.

- **AC-RIC-001-01 — Exact five-file source:** The runtime source directory
  SHALL contain exactly `adapters.mjs`, `coordinator.mjs`, `host-loop.mjs`,
  `production.mjs`, and `worktree-snapshot-contract.mjs`. All five SHALL be
  actual regular non-symlink files whose bytes are read, hashed, installed, and
  read back under the existing owner/mode/ACL/effective-write rules.
- **AC-RIC-001-02 — Legacy is not a source:** The former exact four-file set
  without `worktree-snapshot-contract.mjs` SHALL be accepted only as a
  pre-existing installed state or legal backup input, never as a new-install
  source. Missing, extra, mixed, linked, non-regular, unreadable, empty, or
  oversized source content SHALL fail closed before a successful runtime
  replacement.
- **AC-RIC-001-03 — Closed local graph:** A successful temporary-root install
  SHALL contain byte-equal copies of all five source modules, and an independent
  Node load of installed `production.mjs` SHALL resolve its installed snapshot
  dependency without executing host-loop main or reading real host
  configuration, credentials, services, or network.

### REQ-RIC-002 — Exact Legal Predecessor Backup

The installer SHALL classify and back up only the exact legal prior runtime
state, without synthesizing or normalizing it.

- **AC-RIC-002-01 — Closed predecessor union:** The prior runtime target SHALL
  be exactly one of `ABSENT`, the strict legacy four-file set, or the strict
  current five-file set. `ABSENT` exists only when the initial `lstat` of the
  runtime target itself returns `ENOENT`; an `ENOENT` from a child, backup, or
  later operation after a present target was observed is a failure, never
  absence. A wrong type, symlink, missing/extra/mixed inventory, unsafe child,
  unreadable content, or invalid authority SHALL fail closed and SHALL NOT be
  overwritten to satisfy the current list.
- **AC-RIC-002-02 — Actual bytes and metadata:** For a present legal set, the
  existing manifest child records SHALL enumerate exactly that set and bind
  each exact child name to backup path, actual predecessor bytes and SHA-256,
  owner, mode, and ACL. A legacy backup SHALL contain no synthesized snapshot
  child. `ABSENT` SHALL remain recorded absence.
- **AC-RIC-002-03 — Existing format only:** The legal set SHALL be determined
  from the exact existing `prior.directory_files` records. No schema/version
  change, compatibility registry, discovery mechanism, optional field, or
  second backup format is permitted.

### REQ-RIC-003 — Manifest-bound Exact Runtime Restore

Rollback SHALL reconstruct the runtime predecessor named by the qualified
existing manifest and SHALL never treat count or content resemblance as backup
source authority.

- **AC-RIC-003-01 — Exact manifest inventory:** Before runtime replacement,
  rollback SHALL require unique child names whose complete sorted set is exactly
  legacy four or current five. Count-only equality, duplicates, renamed entries,
  extra entries, and mixed sets SHALL fail with the existing backup/manifest
  failure behavior and SHALL NOT report success.
- **AC-RIC-003-02 — Backup source identity:** Each child `backup_path` SHALL be
  exactly derived from the admitted manifest directory, the runtime target's
  existing backup-directory identity, and that exact child name. The derived
  path SHALL name a regular non-symlink root-owned backup file under existing
  safety rules. Another path SHALL be rejected even when it supplies the same
  bytes or hash.
- **AC-RIC-003-03 — Hash binds restored bytes:** Rollback SHALL hash actual bytes
  read from each admitted backup file and require equality with the recorded
  child hash before staging. Successful restore readback SHALL hash actual
  restored target bytes and require the same equality while restoring recorded
  owner/mode/ACL. Metadata, name, count, or a recorded hash without actual byte
  equality SHALL NOT establish success.
- **AC-RIC-003-04 — Exact outcome:** `ABSENT` SHALL return to absence proved by
  an actual `lstat` of the exact runtime target returning `ENOENT`; legacy four
  SHALL return to byte- and metadata-exact four with no snapshot residue;
  current five SHALL return to byte- and metadata-exact five. A disagreement or
  ambiguous readback SHALL preserve existing `BLOCKED /
  MANUAL_CONTROLLER_STOP` semantics and SHALL NOT return `rolled_back:true`.

### REQ-RIC-004 — Preserved Installation and Evidence Boundary

The closure SHALL remain a private runtime-directory correction inside the
existing Mode Activation installation/rollback boundary.

- **AC-RIC-004-01 — Protected behavior:** `HOST_INSTALL_TARGETS`, every
  non-runtime directory rule, Git/dylib bytes and traversal, State, pointer,
  Ledger, Handoff, canary evidence, Git history, trust/credentials, service and
  socket policy, revocation, timeout/retry, and recovery boundaries SHALL remain
  unchanged. No global transaction, zero-side-effect promise, fallback, or
  fifth recovery boundary is added.
- **AC-RIC-004-02 — Controlled local evidence:** Repository tests MAY inject the
  existing OS boundary around real temporary files and controlled metadata,
  service, socket, and sudo observations. They SHALL distinguish those results
  from real Mac mini root/runtime-user/launchd/fixed-Git proof, which remains
  `NOT_VERIFIED` until separately authorized A4 host validation.
- **AC-RIC-004-03 — Activation stop:** Local GREEN, regression, Retirement, and
  independent validation SHALL return to original M3 exact package preparation.
  They SHALL NOT imply an integration SHA, host deployment, `BLK-D1A-008`
  closure, M3/M4 completion, or Desktop authorization.

## MODIFIED Requirements

### AC-MA-003-02 — Complete protected runtime

The existing protected runtime-files obligation includes the exact five-file
current runtime closure in `REQ-RIC-001`. The runtime user write-denial and all
root-owned owner/mode/ACL canaries remain unchanged.

### AC-MA-007-04 and AC-MA-007-05 — Runtime predecessor compatibility

For the runtime directory only, exact prior bytes/absence/owner/mode/ACL means
the closed `ABSENT | legacy4 | current5` union and the manifest-bound restore in
`REQ-RIC-002/003`. All other host targets and rollback ordering retain the
canonical contract. Unknown or ambiguous runtime backup/readback remains the
existing blocked/manual-stop outcome; no automatic fallback, overwrite,
evidence deletion, pointer clear, or new recovery boundary is authorized.

## Current Gate

`SPEC_READY / CONTROLLER_SPEC_GATE_PENDING`. No Test, RED, implementation,
GREEN, host evidence, or acceptance is claimed.
