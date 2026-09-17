# Mode Activation Specification

`SHALL`, `MUST`, and `SHALL NOT` are normative. Unknown identities, bytes, routes, paths, credentials, receipts, or effects fail closed.

## REQ-MA-001 — Frozen Foundation and Controller Authority

Mode Activation SHALL activate, but not alter, the released Foundation and SHALL keep MacBook as sole decision authority and Mac mini as sole current-Change executor.

- **AC-MA-001-01:** The Foundation surface remains exactly `applyControllerCommand`, `run`, `settlement`, and `status`; macro states remain exactly six, Ledger event classes seven, Git Gateway methods eleven, operation mutex one, and automatic recovery boundaries four. Any required delta blocks this Change.
- **AC-MA-001-02:** Global write-capable WIP remains exactly one, with `active-change.json.active_change_id` the sole runtime authority; no Issue/Project, transport message bus, receipt/outbox/queue, exactly-once authority, polling, automatic replay, next-Change automation, or cross-Change parallelism exists.
- **AC-MA-001-03:** D1-A runs one MacBook Product Plan Reviewer before DISPATCH, allows at most one bounded Controller semantic correction plus targeted readback, then binds the frozen package/review/disposition into signed receipt/evidence refs. Mac mini still runs one fresh `juaner_spec`; no post-DISPATCH Reviewer route is reachable.
- **AC-MA-001-04:** MacBook alone owns PR review, `changes_requested`, archive decision, Acceptance, squash merge, post-merge readback, RELEASE, project-control, and the first product-Change authorization.

## REQ-MA-002 — Ed25519 Trust and Secret Safety

Mode Activation SHALL establish one real, rotatable, revocable Controller signing trust whose private authority cannot be supplied or replaced by Mac mini callers.

- **AC-MA-002-01:** MacBook signs complete canonical command/receipt bytes with a real Ed25519 private key stored outside Git as user-owned `0600`; only signature bytes are outside the signed body.
- **AC-MA-002-02:** Mac mini loads trust only from `/private/etc/juanerai/controller-trust.json`; parent/file ownership, modes, ACL, canonical schema, key type, fingerprint, validity, and effective non-root write denial are read back before service start and on reload.
- **AC-MA-002-03:** Payload, environment, CLI, repository, state, runtime-user-writable file, or Agent output cannot inject trust. Forged, expired, replay-conflicting, unknown-key, revoked-key, wrong-scope, or wrong-state commands reject before protected effects.
- **AC-MA-002-04:** Rotation proves bounded old/new overlap and then revocation; a command newly signed by the revoked key fails effect-free. Ambiguous trust state stops the host.
- **AC-MA-002-05:** No real key/token/secret bytes, full prompt, raw model output, signature bytes, or environment dump enter Git, Tests, logs, Ledger, briefs, Handoff, or receipts; evidence retains only permitted IDs, fingerprints, hashes, and sanitized outcomes.

## REQ-MA-003 — Sole Trusted Host Loop and SSH/CLI Boundary

Mode Activation SHALL install exactly one production physical writer and make every ordinary mutation caller a signed-byte client only.

- **AC-MA-003-01:** One root-owned LaunchDaemon process owns production composition, verifier, state root, gateways, socket, and all three mutation interfaces under the existing one mutex. A second process cannot bind the socket or mutate state.
- **AC-MA-003-02:** The Mac mini runtime user cannot replace trust/config/service/runtime files or open the mutation state root. Root-owned owner/mode/ACL and effective-write canaries must pass.
- **AC-MA-003-03:** Production CLI exposes only bounded stdin `submit` and read-only `status`, locally or through a Controller-selected best-effort Codex Remote courier that proves the exact route, repository/origin, fixed CLI, and envelope SHA-256. SSH is limited to install, rollback, emergency diagnosis, or explicit backup submission. Neither transport can construct a Coordinator, import production composition, open state, inject dependencies/trust, call `run`/`settlement`, execute arbitrary shell/Git/GitHub actions, expose a Canary interface, or directly invoke a production adapter.
- **AC-MA-003-04:** The host loop is event-driven and advances only the active Change until existing WAITING/BLOCKED/AWAITING_CONTROLLER/CLOSED outcomes. Production requires same-process verified `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'` and the independent second match `config.github_repository == 'gadfly-hbo/JuanerAI'`. Restart without that accepted authority or complete durable route/scope/validation identity enters existing BLOCKED/manual-stop semantics; config, State, digest, or `change_id` never supplies or infers missing signed authority, and no repository State field is added.
- **AC-MA-003-05:** Logs contain only bounded operation/change/state/outcome/timing/evidence hashes. Remote output and transport status are not business evidence. On missing or ambiguous Remote output, the Controller reads existing pointer, State, Ledger, and when applicable PR: admitted continues from durable state, clearly not admitted permits a new explicit decision, and conflict/inconsistency is `BLOCKED`; no automatic retry, SSH failover, transport receipt schema, or fabricated progress is allowed.

## REQ-MA-004 — Exact Agent Actions and Existing Coordinator Mechanics

The host loop SHALL launch only the exact formal Agent action returned by Foundation and SHALL not duplicate Foundation mechanics.

- **AC-MA-004-01:** Every child binds exact correlation, role, agent, model, reasoning, sandbox, paths, phase, state version, brief/input/output hashes, subject, and idempotency identity; no lower model, default route, broader sandbox, or parent substitute is allowed.
- **AC-MA-004-02:** STARTED requires an observed child identity. RESULT requires output artifact and hash readback plus allowed-path inventory. START_FAILED and INTERRUPTED use only canonical variants; `NOT_STARTED` is never a host settlement.
- **AC-MA-004-03:** Worktree, Git, Ledger, validation, PR, and Handoff operations remain Foundation-owned existing gateway calls. Host loop does not issue or accept mechanical receipts in settlement.
- **AC-MA-004-04:** After the separately user-authorized first real product DISPATCH is durably admitted, the normal path automatically reaches exact Candidate freeze, review-ready PR, fixed Handoff, and `AWAITING_CONTROLLER` without per-Gate MacBook intervention. Activation proves this deterministic/runtime capability without submitting a disposable production-valid DISPATCH or occupying WIP.
- **AC-MA-004-05:** Each DISPATCH/REVISION authorization cycle allows at most one same-scope Validator automatic repair after finding-specific causal RED. A second FAIL or any contract/architecture/scope/path/dependency/permission/host ambiguity blocks.

## REQ-MA-005 — Pinned Git and Exact Delivery Identity

Mode Activation SHALL make dual-device Candidate review reproducible from exact Git objects and raw bytes.

- **AC-MA-005-01:** Both devices use Git exactly `2.54.0` with unchanged frozen executable and pinned dynamic-library bytes, the same executable SHA-256, and resolved absolute executables. Mac mini's `/usr/bin/git` `2.50.1` is rejected and never overwritten; `install_name_tool`, byte rewriting, and root-Git substitution are forbidden. Installer backup/readback/rollback covers owner/mode/ACL/effective-write for every required artifact and ancestor, grants runtime UID `501` only search/execute traversal without listing/write/ownership, and requires real UID `501` execution to prove version and SHA; inability blocks.
- **AC-MA-005-02:** Git runs from the Foundation empty-environment/config/argv contract with `shell:false`; ambient PATH/HOME/config, attributes, external diff/textconv, replace/graft/alternate/shallow inputs are rejected.
- **AC-MA-005-03:** Both devices hash unnormalized canonical-diff stdout bytes for the same baseline/Candidate; version, executable hash, argv, environment, object IDs, and stdout SHA-256 must match.
- **AC-MA-005-04:** Before the existing branch-push effect, production reads exact local `refs/heads/<branch>` and requires it equals Candidate SHA, requires the remote predecessor equals `expected_remote_head`, pushes only that exact Candidate SHA to the same target ref, then reads back `remote Head == Candidate SHA`. Candidate freeze and Handoff additionally require `local Candidate == Validator Head == PR Head`; any mismatch stops before push or prevents freeze/PR/Handoff progress, without a new Gateway.

## REQ-MA-006 — Restricted GitHub Authority and Immutable Evidence

Mode Activation SHALL use two purpose-isolated minimum-permission repository credentials together with structural adapter and branch-protection negatives.

- **AC-MA-006-01:** Mac mini uses two separate root-owned repository-limited credentials: a branch-push credential, preferably a write-enabled repository deploy key, only for Git transport; and a PR API fine-grained PAT or GitHub App credential with only Metadata read, Contents read, and Pull Requests write. The PR credential has no Contents write. MacBook credentials are never copied or delegated.
- **AC-MA-006-02:** Host composition binds each credential to its exact adapter purpose, requires same-process verified `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'`, and independently requires fixed `config.github_repository == 'gadfly-hbo/JuanerAI'`; it never gives either credential to an Agent, CLI, log, Ledger, or the other transport. Config, State, and `change_id` cannot replace signed repository authority. Git operations can only normally push the exact current `work/mac-mini/<slug>` Candidate branch after local-ref and remote-predecessor binding; PR operations can only query/create-or-reuse/update/read back/mark ready the same PR against base `main`. Merge, approve, close, delete, force, branch delete, Issues, Projects, other repositories, and arbitrary API/refs are structurally unavailable.
- **AC-MA-006-03:** Protected `main` has no branch-push-credential bypass and all structural/cross-use/forbidden-target negatives remain pre-Activation requirements. Before Activation-ready, the PR API credential's no-merge authority SHALL be proved by reliable permission metadata or a deterministic no-merge-side-effect method; the system SHALL NOT call merge on a real product PR. Positive product-branch push/readback and exact PR create/update/readback are deferred only to the separately user-authorized first real product Change through the existing Foundation/Host Loop route. Any absent, ambiguous, conflicting, or mismatched result is `BLOCKED` and forbids Acceptance.
- **AC-MA-006-04:** Ledger remains append-only on the sole Evidence Ref and preserves historical FAIL/Candidate/PASS facts. Its production-positive append and exact remote bytes/hash readback are deferred only to the separately user-authorized first real product Change through the existing Foundation/Host Loop route; any absent, ambiguous, conflicting, or mismatched result is `BLOCKED` and forbids Acceptance. Secret-bearing transport output is sanitized before evidence creation.

## REQ-MA-007 — Signed Revision, Archive, Release, and Rollback

Mode Activation SHALL preserve MacBook decision ownership through review, archive, integration, release, and rollback.

- **AC-MA-007-01:** For every activated product Change, exact signed REVISION from `AWAITING_CONTROLLER` binds the Frozen Candidate, current state/version/hash, unchanged repository/Change/Worktree/branch/baseline/scope, and signed `changes_requested` evidence, then enters `EXECUTING/TEST_RED`; wrong bindings reject effect-free. Mode Activation itself never fabricates an active product Change to use this route.
- **AC-MA-007-02:** First Handoff does not archive. Mode Activation alone has a bootstrap exception: after first PR review, MacBook Controller mechanically archives the exact active package, publishes/readbacks the canonical specification, and creates a descendant Candidate on the same branch/PR without Foundation REVISION, active pointer, DISPATCH, or Mac mini execution. The exception expires at Activation; every product Change thereafter retains MacBook's signed archive REVISION and Mac mini mechanical archive/final-validation/Validator/Handoff route.
- **AC-MA-007-03:** Mac mini never decides archive, Acceptance, merge, or RELEASE. A valid RELEASE runs only existing clean ff-only main synchronization, CLOSED persistence, and pointer-clear-last ordering.
- **AC-MA-007-04:** Install records exact prior bytes/absence/owner/mode/ACL, including every Git/dynamic-library ancestor required by UID `501`, and creates a root-owned backup manifest. Rollback stops ingress, restores and reads back exact prior host bytes/absence/owner/mode/ACL, revokes credential/key, and preserves pointer/state/Ledger/Handoff/canary evidence.
- **AC-MA-007-05:** Any unresolved high-value effect or rollback readback is `BLOCKED / MANUAL_CONTROLLER_STOP`; no automatic fallback, overwrite, evidence deletion, pointer clear, or fifth recovery boundary is allowed.

## REQ-MA-008 — Canary, Retirement, Evidence, and Final Gate

Activation SHALL be accepted only from exact-SHA dual-device evidence and SHALL stop before product work.

- **AC-MA-008-01:** The exactly two remaining causal RED causes frozen in `test-plan.md` and every non-deferred obligation in the fourteen-canary matrix pass against the next exact implementation Candidate and installed host configuration, without a production-valid DISPATCH; Foundation repository identity remains mandatory GREEN regression evidence, while the MacBook bootstrap archive is a post-first-PR-review Controller mechanic with static contract/path regression only. Each evidence record names subject SHA, host, command definition hash, sanitized result hash, and time. No new Canary interface, direct production-adapter invocation, or disposable Change is permitted.
- **AC-MA-008-02:** Test Asset Retirement classifies every added/changed/removed Test, fixture, helper, mock, and harness asset; the Controller Gate and fresh Validator confirm no temporary, duplicate, orphaned, skipped, or ownerless asset remains.
- **AC-MA-008-03:** Verification records exact repository/code/config/tool executable hashes, frozen Foundation identity GREEN/regression evidence, the actual frozen Test hashes, service and Git-closure owner/mode/ACL/effective-write/runtime-execution evidence, same-process signed repository authority plus fixed-config match, local-ref/Candidate/remote-predecessor binding, Remote route/fixed-CLI/envelope integrity, dual-main/canonical-diff equality, PR/Candidate/Handoff/archive identities, scope inventory, secret scan, backup, rollback, and residual prerequisites without overwriting historical Candidate or Validator failures. It records the retired inconclusive Remote canary as retired, not PASS or retryable evidence.
- **AC-MA-008-04:** Any failed non-deferred security canary blocks Activation and prevents product DISPATCH. After archive, squash merge, dual-device synchronization, RELEASE-readiness proof, service readback, and PR no-merge proof, state is only `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`; no canary may occupy WIP with a disposable valid DISPATCH, and no deferred production-positive obligation is falsely marked PASS.
- **AC-MA-008-05:** The first product Change requires a separate explicit user authorization and a completed D1-A intake; Mode Activation does not emit or imply it. That first real product DISPATCH, if admitted, supplies the deferred durable positive Remote/real-signature proof plus exact Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback. Any failed or ambiguous deferred step enters `BLOCKED` and prevents Acceptance.


## Accepted repair delta — change-coordinator-runtime-installation-closure (2026-09-14)

This approved delta supersedes only the named prior rules; all unaffected canonical requirements remain authoritative. The exact schemas, algorithms and execution tables in the [archived Design](../../changes/archive/2026-09-14-change-coordinator-runtime-installation-closure/design.md) remain normative. Historical gate statuses are retained only in the archived package. Local acceptance does not prove host activation, waived evidence or Desktop readiness.

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

## Accepted repair delta — change-coordinator-startup-directory-preparation (2026-09-17)

The following is the approved startup-directory delta. It supersedes only the
named prior rule; all other requirements remain unchanged. The archived
[design](../../changes/archive/2026-09-17-change-coordinator-startup-directory-preparation/design.md)
and [acceptance record](../../changes/archive/2026-09-17-change-coordinator-startup-directory-preparation/verification.md#archive-acceptance-and-evidence--r378-2026-09-17)
retain the exact contract, evidence levels and manual-maintenance limitation.
This merge grants no deployment or Desktop authority.

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
