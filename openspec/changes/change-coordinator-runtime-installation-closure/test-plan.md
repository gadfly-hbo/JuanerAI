# Test Plan: Change Coordinator Runtime Installation Closure

## Status

- Current: `TEST_DESIGN_NOT_STARTED`
- Production is frozen until Spec Gate PASS, isolated Test Design, healthy
  controls, and causal RED are accepted.
- No execution count, selector, hash, RED, or PASS is claimed by this draft.

## 1. Existing Test Surface

The isolated Test role modifies only the existing
`mode-activation.test.mjs` blocks `TEST-MA-INSTALL-001` and
`TEST-MA-INSTALL-002`, plus necessary local setup/assertions in that file. It
reuses `createHostInstaller(osBoundary)`, real temporary files, the current
temporary-root translation, metadata/service/socket/sudo controls, independent
filesystem snapshots, and existing cleanup. No new helper module, fixture,
mock framework, dependency, real installer execution, or privileged call is
permitted.

Before RED, Test Design freezes exact leaf names, anchored selectors, command,
Node executable/version, timeout/budget, pre-change hashes, ordered expected
results, and complete output capture. Existing unrelated assertions are health
controls and remain unchanged.

## 2. Required Causal RED Intent Frontiers

These are required missing-behavior frontiers, not a predeclared count of Test
leaves or actual RED causes. The isolated Test role freezes the executable
leaves, demonstrates which are causal RED on the frozen source, and records the
actual causes without forcing already-correct controls to fail.

- **RED-RIC-001 — current closure rejected:** a real temporary source containing
  exactly the five frozen runtime module bytes is rejected by current
  production at runtime-directory inventory admission. Health first proves all
  five source files are regular, non-symlink, byte-readable, independently
  hashed, and that the installed production import would require the snapshot
  member. The failure must be the runtime set mismatch, not Git, service,
  socket, ACL, owner, or fixture failure.
- **RED-RIC-002 — backup source substitution accepted:** Test constructs an
  explicitly Test-owned existing-format manifest and real temporary backup
  files; it does not claim those bytes were produced by production backup. An
  independent oracle proves the manifest directory, expected derived runtime
  backup directory/path, exact names, and actual file hashes. A legal positive
  rollback control succeeds from that exact Test-owned layout. The mutation
  changes a child `backup_path` to a same-content file outside the derived
  runtime backup directory; current rollback accepts it or reaches runtime
  replacement. The missing behavior is source identity, not content hashing.

Any already correct old4, absence, hash-drift, symlink, owner/mode/ACL, service,
or preservation behavior may remain a passing control. Test must not fabricate
additional RED counts or weaken a control to force failure.

Production backup is proved separately through real `install` calls: exact new5
is the only new-install source, while `ABSENT`, old4, and new5 are each prepared
as a physical predecessor and independently checked in the produced manifest
and rollback outcome. Old4 must never be used as a new-install health
prerequisite after new5-only source enforcement.

## 3. Required Permanent Intent Matrix

| Intent | REQ/AC | Observable proof |
|---|---|---|
| `INTENT-RIC-SOURCE-NEW5` | 001-01,03 | exact five installs byte-equal; installed `production.mjs` resolves installed snapshot in an isolated Node load |
| `INTENT-RIC-SOURCE-REJECT` | 001-02 | old4-as-source, missing snapshot, extra, symlink and non-regular source reject before successful runtime replacement |
| `INTENT-RIC-PRIOR-ABSENT` | 002-01,02; 003-04 | real install backup from an absent predecessor plus late failure exercises rollback and actual target-absence readback |
| `INTENT-RIC-PRIOR-OLD4` | 002-01..03; 003-01..04 | exact old bytes/hash/metadata are recorded and restored as exact four; snapshot absent |
| `INTENT-RIC-PRIOR-NEW5` | 002-01..03; 003-01..04 | exact five actual bytes/hash/metadata are recorded and restored |
| `INTENT-RIC-PRIOR-INVALID` | 002-01 | mixed, missing, extra, linked, wrong-type or damaged prior runtime rejects without normalizing/overwriting it |
| `INTENT-RIC-MANIFEST-NAMES` | 003-01 | same count with wrong/duplicate/renamed members rejects; no `rolled_back:true` |
| `INTENT-RIC-MANIFEST-SOURCE` | 003-02 | outside/substituted `backup_path`, including same-content substitution, rejects before runtime replacement |
| `INTENT-RIC-MANIFEST-BYTES` | 003-03,04 | backup byte drift and restored readback drift reject; recorded hash alone is insufficient |
| `INTENT-RIC-PROTECTION` | 004-01,02 | existing non-runtime, Git/dylib, metadata, ACL/write-denial, service/socket, preserves and forbidden-write assertions remain healthy |

Runtime-state rejection asserts only the runtime target and named protected
fixtures appropriate to that frontier. It does not invent a whole-installer
zero-side-effect guarantee or suppress the existing service-unload ordering.

## 4. Module-load Isolation

The module-closure child receives only the temporary installed path. It may
import `production.mjs` and return a bounded success marker/hash inventory. It
must not import/execute `host-loop` main, call installer main, read real
`/private` or credential/config paths, invoke launchctl/sudo/GitHub/provider,
or use the network. Test records child argv/cwd/environment, stdout/stderr,
exit/signal, and the five independent byte hashes.

## 5. GREEN and Regression Order

1. Run exact RED leaves and controls unchanged for GREEN.
2. Run complete `TEST-MA-INSTALL-001/002` under the frozen selector.
3. Run complete ordinary Mode Activation suite excluding the separately proven
   real-hour leaf; preserve the existing A2 skips and do not relabel them PASS.
4. Run any installation-module connection check required by actual diff.
5. Run canonical `tools/harness/validation/run` and the scoped diff check.
6. Reconcile Test Asset Retirement, then freeze evidence for a fresh independent
   Validator.

The Test role freezes the exact executable commands and expected ordered counts
before RED. A changed shared initializer, helper, runtime import, environment,
or protected assertion expands only the evidence proven affected under A3; it
does not automatically erase K1/K2/hour baselines.

## 6. Evidence Levels and Stop Lines

- R2 local executable: temporary filesystem bytes, child load, exact failures,
  exit/signal, metadata controls, and readback.
- R3 applicable regression: ordinary Mode Activation, canonical validation,
  diff/scope, Retirement, and fresh Validator on frozen identities.
- Host-only `NOT_VERIFIED`: actual root/runtime UID/ACL/service/socket/fixed-Git
  execution, installation, rollback, EMPTY canary, and D1 readback.

Return to Spec/Controller if a new schema/field/error/public interface, another
production/Test file, global atomicity promise, or host/external action is
needed. Return to Test Design if a helper/oracle/selector is defective. Worker
may not edit tests.

## 7. Test Asset Lifecycle

Every new or changed installer leaf is planned as `permanent regression`, owned
by the mapped `REQ-RIC/AC-RIC` consumer. Reused temporary-root setup remains a
retained shared consumer asset. Child-load scratch directories/process outputs
are temporary runtime evidence and are removed by existing test cleanup; no
tracked scratch artifact is added. No retirement candidate is presently
planned. The Controller repeats the Retirement Gate after GREEN/regression.
