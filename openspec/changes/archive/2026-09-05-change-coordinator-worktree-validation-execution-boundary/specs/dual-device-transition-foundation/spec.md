# Dual-device Transition Foundation — Worktree Validation Execution Boundary Delta

> M1 closure record — 2026-09-05: Controller accepts the Validator004-frozen WVEB component; this package is mechanically archived under the current M1-only user authorization. Production/Test and normative semantics are unchanged. Integration/live-main remain pending until readback. Historical Gate/identity/authorization statements below remain stage-bound. Current recovery: [NEXT_ACTION](../../../../../../docs/planning/2026-09-05/automation-repair/NEXT_ACTION.md); [Acceptance](../../../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-acceptance-001.md).

> Controller Gate update — 2026-09-05: `SPEC_GATE_PASS / TEST_AUTHORIZATION_PENDING / MANUAL_CONTROLLER_STOP`. Complete-package correctness and ponytail reviews passed; see [Gate 001](../../../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-spec-gate-001.md). The Spec-return statements below record the pre-Gate snapshot, not the current Controller disposition. Test Correction 010 and all subsequent execution remain locked; B0 is not closed.

## Status and Baseline

- Change: `CHG-change-coordinator-worktree-validation-execution-boundary`
- Authority package: `RGE-VALIDATION-BOUNDARY-RESLICE-001`
- Intake text SHA-256: `bd9647f750ea765c438150cb441f134181838c8db58d01fef405d43677a173ec`
- Baseline authority: `openspec/specs/dual-device-transition-foundation/spec.md`
- Change class: R2 boundary Change
- Current Change state: `MANUAL_CONTROLLER_STOP`
- Spec-return disposition (before Controller Gate 001): `SPEC_READY / PENDING_CONTROLLER_SPEC_GATE` for the bounded 379-leaf admission clarification under `WVEB-R2-ROUTE-001`; current Controller disposition is `SPEC_GATE_PASS / TEST_AUTHORIZATION_PENDING`

This delta closes only L1 snapshot observation and L2 production validation execution. The current clarification adds no Requirement or Acceptance Criterion: it makes the existing fail-closed contract explicit for primitive scalar admission, six caller-owned current-realm Arrays, and lexical-root versus real-identity classification. L3 Coordinator Regression orchestration, Ledger adoption, Candidate, Final Validation, and Regression-to-STAGE remain deferred.

## ADDED Requirements

### REQ-WVEB-001 — Closed Worktree Validation Execution Boundary

Foundation SHALL expose one pure `WORKTREE` snapshot observation contract and SHALL use it only from the existing production validation gateway boundary to bind an exact pre-execution worktree snapshot, at most one validation process, an exact post-execution worktree snapshot, and one closed receipt. Unknown or extra fields, values, paths, definitions, subjects, observations, outcomes, effects, or authority SHALL fail closed.

- **AC-WVEB-001 — Closed pure algorithm:** `tools/harness/change-coordinator/worktree-snapshot-contract.mjs` SHALL export only the worktree snapshot evaluation required by this Change: `evaluateWorktreeSnapshotObservationV1({schema_version:'1.0',subject,observation})`. Its input, observation metadata, byte limits, path/scope grammar, status/index/entry correlation, race checks, and result SHALL be the closed contracts in Design. It SHALL perform no I/O and SHALL derive `scope_sha256`, `raw_inventory_sha256`, and `worktree_snapshot_sha256` by the exact V1 byte algorithm. Malformed contract input SHALL return only `{kind:'REJECTED',reason:'INPUT_INVALID'}`; a well-shaped but untrustworthy subject observation SHALL return only `{kind:'REJECTED',reason:'SUBJECT_MISMATCH'}`.
- **AC-WVEB-002 — Sole production consumer and authority isolation:** `tools/harness/change-coordinator/production.mjs` SHALL be the only production importer and caller of the pure evaluator. It SHALL keep the collector private; use the existing fixed `PINNED_PRODUCTION_GIT_PATH`, deterministic empty child environment, exact Git commands, and lstat/hash/readlink/lstat collection sequence in Design; and SHALL accept no Git, filesystem, process, State, Ledger, credential, callback, clock, network, or authority injection. `createValidationGateway({nodeExecutable})` SHALL be exported with the exact one-field factory input and return only the existing `execute` method. `createProductionComposition({})` SHALL retain its zero-field, root-owned-host-config surface and SHALL call that same factory.
- **AC-WVEB-003 — Exact WORKTREE request, definitions, and receipt:** `validation.execute` SHALL accept only `{definition,subject}` with no missing or extra field. `subject` SHALL be the exact `WorktreeSubjectV1`; `definition` SHALL be exactly one of the two closed eight-field WORKTREE definitions in Design. Invalid request shape, Candidate or cross-subject data, a missing field, or an extra field SHALL produce `INPUT_INVALID` with no receipt and before Git or process work. Every admitted request SHALL terminate with the exact twenty-four-field `ValidationExecutionReceiptV1`, including a receipt hash over the canonical JSON of the other twenty-three fields, and no compatibility receipt.
- **AC-WVEB-004 — Identity, snapshot, process, post-snapshot, receipt order:** Execution SHALL order identity and cwd containment, pre-snapshot, at most one child process, terminal observation, post-snapshot, then receipt. A pre-snapshot subject mismatch SHALL start no child. An unchanged post-snapshot SHALL preserve only the closed process outcome; a changed or untrustworthy post-snapshot SHALL preserve the pre-snapshot SHA and return only `INTERRUPTED/null/SUBJECT_MISMATCH`. Producer status, verdict, and failure-code tuples SHALL be exactly the seven combinations in Design. There SHALL be no retry, recovery, or second child.
- **AC-WVEB-005 — Fail-closed mutations and zero downstream effects:** Root, Worktree, branch, Head, common-Git-dir, cwd containment, scope, ignored inventory, index, status/entry correlation, malformed raw path, parent-symlink escape, unsupported leaf type, before/after identity, or process-created worktree mutation mismatch SHALL fail closed as specified. Rejection or a non-PASS receipt SHALL authorize zero later validation acceptance, Ledger, State, STAGE, Candidate, Final Validation, push, PR, Handoff, or rollback effect. L1 synthetic contract mutation evidence SHALL prove malformed raw status/NUL, special-leaf, and before/after rejection. L2 SHALL use only real temporary-Git/filesystem/Node conditions and compare production hashes with an independent oracle; it SHALL NOT inject an observation or require Git to emit malformed bytes.
- **AC-WVEB-006 — Composition compatibility and successor lock:** Existing public Coordinator methods, gateway method names, composition caller shape, State/Event/Ledger/Candidate contracts, and all forbidden paths SHALL remain unchanged. The snapshot module SHALL not become a Test-only bypass: `production.mjs` SHALL import and call it as its only production consumer. `change-coordinator-regression-to-stage` SHALL remain locked until WVEB Acceptance, merge, archive, and live `main` readback.

## Canonical L1 Snapshot Observation Contract

The approved closed observation type is `SnapshotObservationV1`. The exact pure call is:

```text
evaluateWorktreeSnapshotObservationV1({
  schema_version:'1.0',
  subject:{
    kind:'WORKTREE',repository_root,worktree_root,branch,head_sha,
    common_git_dir,allowed_paths,forbidden_paths
  },
  observation:{
    repository_root_realpath,worktree_root_realpath,common_git_dir_realpath,
    branch,head_sha,status_stdout,ignored_status_stdout,
    index_probe:{exit_code,signal,stdout,stderr},
    entries:[{path_bytes,parent_realpath,before,content,after}]
  }
})
```

`observation` is exactly `SnapshotObservationV1`. `status_stdout`, `ignored_status_stdout`, index stdout/stderr, and every `path_bytes` are `Uint8Array`. `before` and `after` are exactly `{kind:'MISSING'}` or `{kind:'PRESENT',type:'FILE'|'SYMLINK'|'DIRECTORY'|'SOCKET'|'FIFO'|'BLOCK_DEVICE'|'CHARACTER_DEVICE'|'OTHER',mode,dev,ino,size,mtime_ns,ctime_ns}`. `content` is exactly `{kind:'FILE',sha256}`, `{kind:'SYMLINK',target_sha256}`, or `{kind:'MISSING'}`.

The six caller-owned arrays are L1 `subject.allowed_paths`, `subject.forbidden_paths`, and `observation.entries`, plus L2 `definition.argv`, `subject.allowed_paths`, and `subject.forbidden_paths`. Each MUST satisfy `Array.isArray(value) === true` and have prototype exactly equal to the executing module's current-realm built-in `Array.prototype`. Own keys MUST be exactly dense indices `"0".."length-1"` plus the built-in non-enumerable data-property form of `length`; every index MUST be an own enumerable data property, with no hole, symbol, extra string key, getter, or setter. Writability and configurability are not authority, so valid frozen and read-only arrays remain admitted. Prototype and descriptor qualification MUST occur before input method lookup, iteration, item consumption, canonicalization, or serialization; rejected inputs MUST NOT be copied, repaired, normalized, or invoke inherited/caller conversion or iteration callbacks.

`repository_root`, `worktree_root`, and `common_git_dir` MUST be primitive strings, absolute, NUL-free, 1..4096 UTF-8 bytes, and lexical-normal: `/` alone is valid; otherwise trailing slash, repeated slash, `.` segments, and `..` segments are invalid. Non-lexical input is `INPUT_INVALID` and MUST NOT be normalized into acceptance. Only a lexically admitted root whose real filesystem/canonical identity fails or disagrees is `SUBJECT_MISMATCH`.

For every present stat, `mode`, `dev`, `ino`, `size`, `mtime_ns`, and `ctime_ns` are exact nonnegative primitive JavaScript `bigint` values returned directly by `lstat({bigint:true})`. Number, string, boxed bigint, and mixed representations are invalid. Pre/post comparison is strict bigint equality for all six fields, and the executable mask is exactly `0o111n`. These representation rules do not add a snapshot field and do not change the existing normalized mode bytes or any snapshot-hash field or byte algorithm.

The only results are:

```text
{kind:'OK',value:{scope_sha256,raw_inventory_sha256,worktree_snapshot_sha256,entry_count}}
{kind:'REJECTED',reason:'INPUT_INVALID'|'SUBJECT_MISMATCH'}
```

The exact limits, scope/path grammar, status/index/entry correlation, normalized modes, race checks, canonical scope hashing, raw inventory hashing, and `JUANERAI_WORKTREE_SNAPSHOT_V1` NUL-framed snapshot byte algorithm in `design.md` are normative parts of this contract.

## Canonical L2 Execution Contract

The exact `validation.execute` request is `{definition,subject:WorktreeSubjectV1}`. `definition` has exactly `{id,validation_kind,validation_scope,subject,argv,cwd,environment,timeout_ms}` and admits only:

| `id` | `validation_kind` | `validation_scope` | `subject` |
|---|---|---|---|
| `regression-affected-suite` | `REGRESSION` | `AFFECTED_SUITE` | `WORKTREE` |
| `regression-test-asset-retirement` | `REGRESSION` | `TEST_ASSET_RETIREMENT` | `WORKTREE` |

`argv` is a non-empty string array whose first value exactly equals the factory Node executable; `cwd` is a primitive absolute string and, after realpath, a contained Worktree path; `environment` is exactly the plain, closed, zero-own-field object `{}`; and `timeout_ms` is a positive safe integer. `cwd` MUST be type-checked before a path API, but retains its existing absolute/containment rules and gains no root lexical-normal rule or additional length limit. `subject.head_sha` MUST be a primitive string before regex or any other consumption and then exactly forty lowercase hexadecimal ASCII characters. Invalid scalar types return `INPUT_INVALID`, no receipt, no child, and invoke no `toString`, `valueOf`, or `Symbol.toPrimitive` callback.

Production starts the exact Node with a newly constructed environment object having zero own fields and MUST NOT inherit, merge, or pass through parent or caller environment fields. Candidate, cross-subject, `subject_sha`, missing, extra, or other values are `INPUT_INVALID` before Git/process work and produce no receipt.

Every L2 factory input, execute request, subject, definition, and empty-environment object is a strict plain closed data object. Its prototype is exactly `Object.prototype`; `Reflect.ownKeys` is exactly the frozen string-field set with no symbol or extra key; every required field is an own enumerable data property rather than a getter or setter; and writable/configurable flags may be either value so frozen data remains valid. Descriptors are checked before values are read. L2 `argv` and both signed-scope arrays independently use the complete six-array rule above; the scopes retain their item grammar, uniqueness, cross-array conflict, and combined 1 MiB canonical-byte limit. All qualification occurs before realpath, Git, snapshot, process, or serialization. Invalid scope such as `../escape`, invalid array authority, or a non-lexical-normal root is `INPUT_INVALID`, produces no receipt, and reaches none of those operations.

Darwin/Node may create `__CF_USER_TEXT_ENCODING` in the child even though the spawn request carried zero environment fields. This named platform injection is not caller authority and is not part of the definition signature, execute request, receipt, snapshot hash, or receipt hash. Test may explicitly observe and remove only this named key before proving that no other child key remains, and SHALL separately prove that a parent sentinel is absent. This exception is not an open allowlist and does not permit caller environment fields.

An admitted request returns the existing OK envelope whose `value` is exactly this twenty-four-field execution receipt:

```text
{
  validation_id,validation_kind,validation_scope,status,verdict,failure_code,
  command_definition_sha256,receipt_sha256,subject_kind,subject_sha,
  repository_root,worktree_root,branch,head_sha,common_git_dir,execution_cwd,
  scope_sha256,worktree_snapshot_sha256,candidate_sha,candidate_tree,
  stdout_sha256,stderr_sha256,validator_head,idempotency_id
}
```

`subject_kind` is `WORKTREE`; `subject_sha` equals `head_sha`; `candidate_sha`, `candidate_tree`, and `validator_head` are null; `scope_sha256` is non-empty; and `receipt_sha256` is SHA-256 of canonical JSON of the other twenty-three fields. Only a pre-snapshot `START_FAILED/null/SUBJECT_MISMATCH` may have null `execution_cwd` or `worktree_snapshot_sha256`; both are non-null after a valid pre-snapshot. On that pre-snapshot outcome, all request-derived identity fields are populated: definition fields supply validation and command identity, subject fields supply WORKTREE/root/branch/Head/common-dir identity, canonical subject scope supplies `scope_sha256`, empty bytes supply stdout/stderr hashes, and definition `id` supplies idempotency identity. The tuple's verdict and the always-null Candidate/tree/Validator fields remain null; among the remaining identity fields, no field other than `execution_cwd` and `worktree_snapshot_sha256` gains nullability. The only producer tuples are:

```text
COMPLETED/PASS/null
COMPLETED/FAIL/NONZERO_EXIT
START_FAILED/null/PROCESS_START_FAILED
START_FAILED/null/SUBJECT_MISMATCH
INTERRUPTED/null/TIMEOUT
INTERRUPTED/null/SIGNAL_EXIT
INTERRUPTED/null/SUBJECT_MISMATCH
```

`RECEIPT_INVALID` is not a producer outcome. The private collector accepts no injected `SnapshotObservationV1`; the exact receipt values, outer envelope digest, pre/post ordering, collector commands, nullability, and mismatch precedence in `design.md` are normative.

At `timeout_ms`, the timeout callback sets `timedOut` and sends exactly one `SIGKILL` to the sole started child. Production sends no prior `SIGTERM` and adds no grace period, second timer, fallback signal, retry, recovery, replacement child, process-group interface, or caller configuration. A child `close` observed before the timeout callback retains the normal exit/signal result. A timeout callback observed first waits for that child's close and then yields `INTERRUPTED/null/TIMEOUT` only when the mandatory post-snapshot is trustworthy and unchanged; post-snapshot change or distrust retains higher precedence as `INTERRUPTED/null/SUBJECT_MISMATCH`.

## Canonical Contract Summary

The normative schemas, byte grammar, hashing algorithm, execution ordering, receipt field set, nullability, and outcome tuples are in this Change's `design.md` and are part of this delta. Tests and production SHALL NOT substitute source rewriting, normalized path text, decoded status paths, mock Git inventory, or a short/legacy receipt for those contracts.

## Current Gate

The Change remains `MANUAL_CONTROLLER_STOP`. This six-file clarification returns `SPEC_READY / PENDING_CONTROLLER_SPEC_GATE`; it does not claim Controller correctness review, mandatory ponytail review, or Spec Gate `PASS`, and it does not authorize Test Correction 010.

The current physical Test is SHA-256 `19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`, 1,326 lines, 111,031 bytes, with exactly 279 retained stable IDs. The current production identities are `43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0` for the snapshot evaluator and `757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc` for `production.mjs`. Worker Revision 002 historically produced focused `279/279`, Coordinator `358/358`, Board `12/12`, and canonical `1410 PASS / 0 FAIL / 1 expected real-Pi skip`; those are partial-GREEN evidence only because the current admission defects lack adopted tests and fixes. Current Test Asset Readiness has not passed, Test Asset Retirement is not closed, and no fresh Validator covers this clarified contract.

After Controller review, ponytail review, and Spec Gate, the exact Test adoption remains 279 retained leaves plus N114..N213, zero replace/delete, for 379 total leaves. Only a separately authorized Test Correction 010 may write that adoption. A new accepted Test identity and causal RED/Readiness/Retirement evidence are required before any renewed `TDD_READY` or bounded Worker Revision 003. No new Validator, Acceptance, integration, archive, or successor authority is claimed.
