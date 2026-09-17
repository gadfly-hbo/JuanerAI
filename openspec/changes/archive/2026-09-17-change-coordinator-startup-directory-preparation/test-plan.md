> Archive note (R378, 2026-09-17): the complete original text below is the
> frozen Spec-stage record, including its historical pending/NOT_RUN status.
> Current completion and limits are in [the archive acceptance record](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).

# Test Plan: Change Coordinator Startup Directory Preparation

## Status

- Current: `TEST_DESIGN_NOT_STARTED`
- Production is frozen until Controller Spec Gate PASS, isolated Test Design,
  healthy controls, and causal RED are accepted.
- No selector, count, hash, RED, GREEN, regression, or host PASS is claimed.

## 1. Existing Test Surface

The isolated Test role may change only
`tools/harness/change-coordinator/mode-activation.test.mjs`. It adds startup
directory leaves beside the existing Host Loop tests and adapts only the setup
needed by `TEST-MA-HOST-003`. It reuses real temporary directories, a real
temporary Unix socket, the actual `serveTrustedHostLoop` entry, same-file
controlled builtin/OS observations, independent snapshots, and current cleanup.

No new helper module, fixture framework, dependency, production path, real
fixed-path mutation, sudo, launchctl, provider/network access, or standalone
`mkdir` surrogate is permitted. Test Design freezes exact leaf names, selectors,
Node executable/version, command/cwd/environment, timeout, pre-change hashes,
ordered results, and complete output before RED.

## 2. Required Causal RED Frontier

- **RED-SDP-001 — real listener cannot start with a missing directory:** invoke
  the actual current listener with its existing numeric runtime GID and one
  extra controlled-startup argument. Current JavaScript ignores that extra
  argument. Its existing `net.createServer` is retained, while the listen path
  is mapped to a real temporary Unix socket whose real parent is absent. Current
  production therefore fails at listen rather than creating the parent. After
  implementation the same call consumes the frozen fourth argument and must
  reach the existing canonical read-only status response. The causal assertion
  is safe pre-listen preparation, not an accepted injected result, standalone
  filesystem helper, protocol change, fake server, owner emulation failure, or
  fixture failure.

The safe-existing real listener/status path and `TEST-MA-HOST-003` must first
pass as health controls. Test Design records the actual causal RED cause and
does not force already-correct socket conflict or protocol behavior to fail.

## 3. Permanent Intent Matrix

| Intent | REQ/AC | Observable proof through the actual listener entry |
|---|---|---|
| `INTENT-SDP-EXISTING` | 001-01..03; 002-01..03 | safe existing target reaches real socket/status; zero target/ancestor mutation calls; before/after identities equal |
| `INTENT-SDP-CREATE` | 003-01..03,05; 005-01 | exact absence causes one non-recursive 0700 create; pre-mutation root owner/ACL/runtime-write predicate and fd binding pass; bound object becomes root:wheel 0755; socket/status succeeds |
| `INTENT-SDP-REPEAT` | 003-04; 005-01 | after closing the prior server and establishing exact absence again, a fresh invocation repeats creation and status without retained memory |
| `INTENT-SDP-PARENT` | 001-02; 004-01 | accepted root:daemon 0775 parent passes unchanged; wrong type/link/identity/mode/ACL, runtime search denial, or runtime write allowance rejects |
| `INTENT-SDP-TARGET` | 002-01..03; 004-01 | symlink/file/socket, wrong owner/group/mode, unsafe/unknown ACL, access mismatch, realpath mismatch, or observation error rejects without mutation |
| `INTENT-SDP-RACE` | 002-02; 003-01..03,05; 004-01 | EEXIST and independently scheduled observed parent/target device-inode drift reject; evidence is explicitly bounded to configured-runtime and finite observation points |
| `INTENT-SDP-FAILURE` | 004-01..04 | each closed diagnostic code is forced; preparation failure gives no listener or Host Loop call; post-create failures retain target; protected fixtures equal |
| `INTENT-SDP-SOCKET` | 001-03; 004-02; 005-02 | occupied socket and second instance retain existing rejection; no unlink/stale cleanup; created directory remains |
| `INTENT-SDP-HALF-CLOSE` | 005-03 | existing `TEST-MA-HOST-003` still returns exactly one asynchronous canonical status frame |

ACL/access tests use the closed semantic permission set from `AC-SDP-002-01`.
Each independent mutation/failure injection is independently scheduled; a
single broad loop title is not evidence unless every case has an exact label,
expected phase/code, and object/protected-state assertion.

## 4. Forbidden-side-effect Oracle

Before each negative, Test snapshots the controlled ancestors, target if
present, socket placeholder, State/pointer/WIP/Ledger/Handoff fixtures, and
listener/Host Loop call counters. The oracle proves:

- existing targets and all ancestors retain type, device/inode, owner/group,
  mode, ACL receipt, contents, and names;
- preparation rejection performs no server creation/listen, socket unlink,
  recursive walk, retry, Agent/task replay, or protected business method;
- pre-create failures add no target; post-create failures retain the target and
  perform no delete/rename/repair; and
- arbitrary OS error text and ACL text do not appear in the bounded diagnostic.

The oracle does not claim a global host zero-side-effect transaction or a
universal post-listen close/no-method rule: the approved newly created directory
may remain, and existing listener failure semantics remain outside the
preparation transaction.

The frozen controlled boundary shape is exactly `lstat`, `realpath`, `mkdir`,
`open`, and `exec`; its FileHandle exposes only `stat`, `chown`, `chmod`, and
`close`. Filesystem calls translate fixed paths to real temporary objects.
`exec` emulates only the exact `/bin/ls -led` ACL observation and the exact
constant Node credential/access probe from Design 2, including the same numeric
runtime UID for `initgroups` and `setuid`, the same GID for `initgroups` and
`setgid`, sorted supplementary groups, bounded outputs, exit/signal/timeout, and
malformed-result negatives. A separate username input is forbidden. Test
independently reads the real temporary objects/socket and does not use a
boundary success value as the acceptance oracle.

## 5. GREEN and Regression Order

1. Run the exact causal RED leaf and frozen health controls unchanged for GREEN.
2. Run the complete startup intent matrix and `TEST-MA-HOST-003`.
3. Run the complete ordinary Mode Activation suite affected by imports/setup;
   preserve existing A2 skips and do not relabel K1/K2/hour or S09 evidence.
4. Run the canonical `tools/harness/validation/run` and scoped diff/path checks.
5. Reconcile Test Asset Retirement, freeze identities/evidence, and dispatch a
   fresh read-only Validator.

If a shared initializer, builtin patch, or listener signature affects further
leaves, Test Design names the exact affected consumers and regression command;
it does not migrate unrelated tests by default.

## 6. Evidence Levels and Stop Lines

- R2 local executable evidence: actual listener entry, real temporary Unix
  socket, real temporary filesystem objects, injected metadata/ACL/access,
  failure/race scheduling, protocol bytes, and protected snapshots.
- R3 applicable evidence: affected Mode Activation regression, canonical
  validation, scope/secret checks, Retirement, and fresh Validator on frozen
  identities.
- Host-only `NOT_VERIFIED`: fixed-path root/wheel/daemon identity, actual
  runtime UID/groups, ACL/access probes, launchd stop/start/KeepAlive, socket,
  reboot, installation, rollback, complete environment, and D1.

Return to Spec/Controller if implementation needs another production/Test file,
plist/installer change, a new external command/dependency/protocol, target
cleanup, or a weaker positive contract. Return to Test Design for a defective
oracle, setup, selector, or count. Worker may not edit tests.

## 7. Test Asset Lifecycle

Every accepted startup leaf and the adapted `TEST-MA-HOST-003` remain
`permanent regression`, each owned by the mapped `REQ-SDP/AC-SDP` consumer.
Same-file boundary setup remains only if it has a retained consumer and does not
replace the actual listener. Temporary directories, sockets, descriptors, and
captured process output are runtime evidence removed by test cleanup; no tracked
scratch artifact is added. No retirement candidate is planned. Controller
repeats the Test Asset Retirement Gate after GREEN/regression.
