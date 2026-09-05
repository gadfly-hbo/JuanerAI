# Design: Worktree Validation Execution Boundary

> M1 closure record — 2026-09-05: Controller accepts the Validator004-frozen WVEB component; this package is mechanically archived under the current M1-only user authorization. Production/Test and normative semantics are unchanged. Integration/live-main remain pending until readback. Historical Gate/identity/authorization statements below remain stage-bound. Current recovery: [NEXT_ACTION](../../../../docs/planning/2026-09-05/automation-repair/NEXT_ACTION.md); [Acceptance](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-acceptance-001.md).

> Controller Gate update — 2026-09-05: `SPEC_GATE_PASS / TEST_AUTHORIZATION_PENDING / MANUAL_CONTROLLER_STOP`. Complete-package correctness and ponytail reviews passed; see [Gate 001](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-spec-gate-001.md). The Spec-return statements below record the pre-Gate snapshot, not the current Controller disposition. Test Correction 010 and all subsequent execution remain locked; B0 is not closed.

## 0. Current clarification and stop

This six-file clarification closes the remaining caller-owned input-admission contract identified after Worker Revision 002: primitive scalar type admission, the six current-realm Array descriptor boundaries, and lexical root admission before real-identity classification. It retains `REQ-WVEB-001`, `AC-WVEB-001..006`, the Request, twenty-four-field receipt, snapshot-hash and receipt-hash field sets and algorithms, environment contract, timeout race, dependencies, path boundaries, role permissions, and L1/L2-only scope.

Worker Revision 002 and its focused/regression/canonical results are valid historical partial-GREEN evidence for the prior closed-input, scope, bigint, and timeout defects. Validator 001 `FAIL` predates that revision but remains the latest completed independent verdict; it is not an assertion that the current blobs still contain every defect observed at its stage. Worker Revision 002 does not close the newly confirmed admission defects, establish current Test Asset Readiness or Retirement, provide a fresh Validator verdict, or authorize release. The Change therefore remains `MANUAL_CONTROLLER_STOP`. This role returns only `SPEC_READY / PENDING_CONTROLLER_SPEC_GATE`; Test Correction 010, a renewed `TDD_READY`, Worker Revision 003, a new Validator, Acceptance, integration, archive, and the L3 successor remain locked.

The unchanged `proposal.md` records the original intake and initial draft state. Historical Validator 001 `FAIL`, prior Corrections 005..007, earlier RED/Readiness/TDD_READY, Worker Revision 002 GREEN, regression, canonical, retirement, ponytail, and retrospective records remain historical evidence and are not rewritten as the current release result.

## 1. Boundary and dependency direction

The Change has exactly two production layers:

```text
production.mjs private collector and validation.execute
  -> worktree-snapshot-contract.mjs pure evaluator
```

The pure evaluator observes only supplied values. It imports no Git, filesystem, child-process, environment, clock, network, Coordinator, State, Ledger, credential, callback, or authority facility. `production.mjs` is the only production consumer. The Test imports the evaluator and exported factory independently; it is not a production consumer.

The existing `validation.execute` gateway method is retained. No public Coordinator method or other gateway method is added. The collector is not exported.

## 2. L1 pure snapshot contract

### 2.1 Export and top-level input

The new module exports:

```js
evaluateWorktreeSnapshotObservationV1({
  schema_version: '1.0',
  subject,
  observation,
})
```

The top-level object is a plain object with exactly those three fields. `subject` and `observation` are the exact closed objects below. Missing, extra, accessor, array, non-plain, or differently versioned input is `INPUT_INVALID`.

Every object described as plain and closed in L1 or L2 uses the same data-object rule. Its prototype is exactly `Object.prototype`; `Reflect.ownKeys` contains exactly the frozen string-key set and no symbol or extra key; every required field is its own enumerable data property; and no admitted field is a getter or setter. Writable and configurable descriptor flags are not authority and may be either value, so frozen or otherwise read-only data objects remain valid. Validation examines descriptors before reading field values, ensuring a rejected accessor is never invoked.

### 2.2 `WorktreeSubjectV1`

`subject` is exactly:

```text
{
  kind: 'WORKTREE',
  repository_root,
  worktree_root,
  branch,
  head_sha,
  common_git_dir,
  allowed_paths,
  forbidden_paths
}
```

Rules:

- all eight fields are required and no other field is allowed;
- `repository_root`, `worktree_root`, and `common_git_dir` are primitive strings of 1..4096 UTF-8 encoded bytes, contain no NUL, and are absolute lexical-normal forms: `/` alone is valid; otherwise there is no trailing slash, repeated slash, `.` segment, or `..` segment. A nonconforming input string is `INPUT_INVALID` and is never normalized into an admitted value. Only after lexical admission may a real filesystem/identity disagreement become `SUBJECT_MISMATCH`;
- `branch` is a UTF-8 string of 1..255 encoded bytes matching `work/mac-mini/<slug>`, where `<slug>` is one or more lowercase ASCII alphanumeric groups separated by single hyphens; a `work/macbook/...` development branch is never an execution subject;
- `head_sha` is a primitive string and exactly forty lowercase hexadecimal ASCII bytes; primitive type is checked before regex or any other consumption;
- `allowed_paths` and `forbidden_paths` are arrays of strings and MUST equal the signed subject scope as ordered, unique arrays; neither array is normalized, reordered, inferred, or sorted by the evaluator or production collector;
- each scope array is an actual Array whose prototype is exactly the executing module's current-realm built-in `Array.prototype`; its own keys are exactly dense string indices `0` through `length - 1` plus the built-in non-enumerable data-property form of `length`; every index is an own enumerable data property, with no hole, symbol key, extra string key, getter, or setter. Index and length writability/configurability are not authority, so valid frozen and read-only arrays are allowed;
- prototype and descriptor qualification is completed before reading an input array method, iterating it, consuming an item, or serializing it. A custom or null prototype is rejected rather than copied, repaired, normalized, or consumed;
- each scope item encodes to 1..4096 UTF-8 bytes and is either one repository-relative exact path or one repository-relative prefix ending in the single suffix `/**`;
- a scope item has no leading slash, trailing slash other than `/**`, empty segment, `.` segment, `..` segment, NUL, backslash, second glob, or other wildcard;
- each array is unique by raw UTF-8 bytes; the same rule in both arrays is a scope conflict and is rejected;
- a valid narrower forbidden rule may overlap a broader allowed prefix; when matching an inventory path, any forbidden match wins;
- the canonical UTF-8 JSON bytes of `{allowed_paths,forbidden_paths}` using recursively lexicographically sorted object keys, array order unchanged, JSON escaping, and no whitespace MUST be at most 1 MiB.

`scope_sha256` is lowercase hexadecimal SHA-256 of those canonical scope bytes.

### 2.3 `SnapshotObservationV1`

`observation` is exactly:

```text
{
  repository_root_realpath,
  worktree_root_realpath,
  common_git_dir_realpath,
  branch,
  head_sha,
  status_stdout,
  ignored_status_stdout,
  index_probe: {exit_code,signal,stdout,stderr},
  entries: [{path_bytes,parent_realpath,before,content,after}]
}
```

Rules:

- all nine fields are required and no other field is allowed;
- the three realpaths are absolute, canonical UTF-8 strings of 1..4096 encoded bytes with no NUL;
- observed `branch` and `head_sha` use the subject grammar;
- `status_stdout`, `ignored_status_stdout`, and index-probe `stdout`/`stderr` are `Uint8Array` values; each of the two status streams is at most 1 MiB;
- `index_probe` is a plain exact four-field object; `exit_code` is either a safe integer or `null`, `signal` is either `null` or a non-empty string, and both output byte arrays MUST be empty;
- `entries` obeys the same current-realm built-in `Array.prototype`, dense own enumerable data-index, and built-in `length` descriptor rule as the subject scope arrays. Its qualification precedes input method lookup, iteration, entry consumption, or serialization. Its length exactly equals the number of records in `status_stdout`; that count is naturally bounded by the 1 MiB status limit and receives no second limit;
- each entry is a plain exact five-field object; `path_bytes` is a `Uint8Array` of 1..4096 raw bytes and is never decoded for hashing, sorting, or identity; `parent_realpath` is an absolute canonical UTF-8 string of 1..4096 encoded bytes;
- `before` and `after` are each exactly `{kind:'MISSING'}` or `{kind:'PRESENT',type,mode,dev,ino,size,mtime_ns,ctime_ns}`; a present `type` is exactly one of `FILE`, `SYMLINK`, `DIRECTORY`, `SOCKET`, `FIFO`, `BLOCK_DEVICE`, `CHARACTER_DEVICE`, or `OTHER`;
- in every present stat, `mode`, `dev`, `ino`, `size`, `mtime_ns`, and `ctime_ns` are primitive JavaScript `bigint` values exactly as returned by `lstat({bigint:true})`; each MUST be nonnegative, and a Number, string, boxed bigint, or mixed representation is `INPUT_INVALID`;
- pre/post comparison uses strict bigint equality for each of those six fields with no Number or string conversion and no coercion; regular-file execute-bit normalization tests `(mode & 0o111n) !== 0n` and emits the existing `100755` or `100644` ASCII mode bytes;
- `content` is exactly `{kind:'FILE',sha256}`, `{kind:'SYMLINK',target_sha256}`, or `{kind:'MISSING'}`; each hash is sixty-four lowercase hexadecimal ASCII bytes.

### 2.4 Status, index, scope, and entry correlation

The main status bytes are parsed as Git porcelain-v1 NUL records produced with `--no-renames`. Every record is exactly two ASCII `XY` bytes, one ASCII space, then 1..4096 raw non-NUL path bytes and a terminating NUL. The only admitted `XY` values are ` M`, ` D`, ` T`, and `??`; all staged, unmerged, renamed/copied, malformed, unsupported, empty, unterminated, duplicate, absolute, dot/dot-dot, or backslash paths are `SUBJECT_MISMATCH`.

The ignored status stream uses the same record grammar and may repeat the ordinary records from the main status stream. It MUST contain no `!!` record, and after separating any `!!` records its remaining complete record bytes MUST equal `status_stdout` exactly and in the same order. Any `!!`, disagreement, extra record, missing record, or malformed bytes are `SUBJECT_MISMATCH`.

The index probe represents `git diff --cached --quiet <head_sha> --`. It is clean only when `exit_code === 0`, `signal === null`, and both byte outputs are empty. Every other result is `SUBJECT_MISMATCH`.

Entries and status records form a byte-for-byte bijection. There is one entry for every main-status path and none extra; entry ordering is not trusted. Every path MUST match at least one allowed scope rule and no forbidden rule. Exact rules match identical raw UTF-8 bytes; prefix rules match only descendants after the prefix's `/` boundary. A forbidden match wins.

The observation realpaths, branch, and Head MUST equal the corresponding subject identities. Each `parent_realpath` MUST remain at or below `worktree_root_realpath` on a path-component boundary and MUST correspond to the status path's parent after collector realpath resolution; an escaped symlink parent is `SUBJECT_MISMATCH`.

`before` and `after` MUST be exactly equal. Present `SOCKET`, `FIFO`, `BLOCK_DEVICE`, `CHARACTER_DEVICE`, `DIRECTORY`, or `OTHER` leaf entries are rejected. A directory is only a traversal container and never an inventory entry. The admitted leaf forms are:

| Status | Stable leaf | `type` bytes | `mode` bytes | `content_identity` bytes |
|---|---|---|---|---|
| ` M`, ` T`, or `??` | regular file | `FILE` | `100755` if any execute bit is set, else `100644` | `content.sha256` |
| ` M`, ` T`, or `??` | symbolic link | `SYMLINK` | `120000` | `content.target_sha256` |
| ` D` | missing before/content/after | `MISSING` | `000000` | `MISSING` |

Any status/content/type mismatch, changed identity, followed symlink leaf, or unsupported leaf is `SUBJECT_MISMATCH`.

### 2.5 Hashing

`raw_inventory_sha256` is lowercase hexadecimal SHA-256 of `status_stdout` exactly as observed, without decoding or normalization.

For each correlated entry, form this byte record, where `NUL` is one zero byte and all non-path values are the ASCII bytes defined above:

```text
path_bytes + NUL + XY + NUL + type + NUL + mode + NUL + content_identity + NUL
```

Sort complete entries by raw `path_bytes` using Buffer lexicographic order before appending their records. Duplicate raw paths are rejected rather than tie-broken.

The snapshot preimage is exactly:

```text
ASCII('JUANERAI_WORKTREE_SNAPSHOT_V1') + NUL
+ UTF8(repository_root_realpath) + NUL
+ UTF8(worktree_root_realpath) + NUL
+ UTF8(branch) + NUL
+ ASCII(head_sha) + NUL
+ UTF8(common_git_dir_realpath) + NUL
+ ASCII(scope_sha256) + NUL
+ ASCII(raw_inventory_sha256) + NUL
+ each sorted entry record
```

`worktree_snapshot_sha256` is lowercase hexadecimal SHA-256 of that complete preimage.

### 2.6 Result

The only results are:

```text
{kind:'OK',value:{scope_sha256,raw_inventory_sha256,worktree_snapshot_sha256,entry_count}}
{kind:'REJECTED',reason:'INPUT_INVALID'|'SUBJECT_MISMATCH'}
```

`entry_count` is the exact correlated record count. Result objects contain no extra field and the evaluator does not throw for a caller-supplied contract rejection.

## 3. L2 private production collector

`production.mjs` imports and calls the evaluator. Its collector is private and has no injection seam. It uses the existing `PINNED_PRODUCTION_GIT_PATH` and starts each Git process with an exact environment object having zero own fields, never inheriting, merging, or passing through a parent or caller environment.

Before any realpath or identity operation, production applies the L1 lexical root rule independently to `repository_root`, `worktree_root`, and `common_git_dir`. A non-primitive, out-of-range, relative, NUL-bearing, trailing-slash (except `/`), repeated-slash, dot-segment, or dot-dot-segment value is `INPUT_INVALID` with no receipt. For an admitted lexical root, a realpath/canonical identity failure or disagreement remains `SUBJECT_MISMATCH`; `/` is not rejected merely because it is the filesystem root.

For an admitted subject it executes these observation commands with the exact worktree cwd and no extra argument:

1. `status --porcelain=v1 -z --untracked-files=all --no-renames`;
2. the same command with trailing `--ignored=matching`;
3. `diff --cached --quiet <head_sha> --`;
4. `branch --show-current`;
5. `rev-parse HEAD`;
6. `rev-parse --path-format=absolute --git-common-dir`.

It resolves `repository_root`, `worktree_root`, `common_git_dir`, and execution cwd by realpath and proves exact subject identity and cwd containment before the pre-snapshot. For every main-status record it resolves the parent, performs `lstat before`, then either streams a regular file through SHA-256 or hashes raw `readlink` target bytes without following the leaf, then performs `lstat after`. Missing deletion is collected as the three matching `MISSING` forms. File bytes do not enter the evaluator and there is no file-size limit.

Any Git failure, noncanonical identity, containment failure, parse mismatch, unstable leaf, or rejected evaluator observation is a subject mismatch. Observation uses no network and no retry.

The collector accepts no `SnapshotObservationV1` or observation callback from execute, factory, host config, environment, or Test. Only the collector constructs the observation passed to the pure evaluator.

## 4. L2 production execution contract

### 4.1 Factory and request

`production.mjs` exports `createValidationGateway({nodeExecutable})`. The factory input is a strict plain closed data object with exactly one own enumerable data field; `nodeExecutable` is one absolute path string. Missing/extra, symbol, non-enumerable, accessor, non-plain, or non-absolute input is `INPUT_INVALID`. The returned frozen object contains exactly the existing `execute` method.

`createProductionComposition({})` retains an exact zero-field plain input, reads the root-owned host configuration, and constructs production validation by calling this same exported factory with the configured Node executable. No alternate factory or Test-only production path is permitted.

`execute` accepts exactly this strict plain closed data object:

```text
{definition, subject: WorktreeSubjectV1}
```

There is no `subject_sha`, Candidate, cross-subject, compatibility, or extra field.

`definition` is a strict plain closed data object with exactly:

```text
{id,validation_kind,validation_scope,subject,argv,cwd,environment,timeout_ms}
```

It MUST equal one of these tuples:

| `id` | `validation_kind` | `validation_scope` | `subject` |
|---|---|---|---|
| `regression-affected-suite` | `REGRESSION` | `AFFECTED_SUITE` | `WORKTREE` |
| `regression-test-asset-retirement` | `REGRESSION` | `TEST_ASSET_RETIREMENT` | `WORKTREE` |

The request, its `subject`, its `definition`, and the definition's `environment` all obey the shared strict data-object rule in section 2.1. The empty environment therefore has prototype `Object.prototype` and `Reflect.ownKeys(environment).length === 0`; symbol, non-enumerable, accessor, inherited-authority, or ordinary extra fields are invalid. `WorktreeSubjectV1.allowed_paths` and `forbidden_paths` independently pass the complete L1 closed-array, item grammar, raw-byte uniqueness, cross-array conflict, and combined 1 MiB canonical-scope limit before any `realpath`, Git, snapshot, or validation-process operation. Production does not normalize, repair, reorder, or partially accept scope.

For either tuple, `argv` is a non-empty array of strings and `argv[0]` exactly equals the factory `nodeExecutable`; `cwd` is a primitive absolute string and, after realpath, is the worktree root or its descendant on a component boundary; `environment` is the exact plain, closed object `{}` with zero own fields; and `timeout_ms` is a positive safe integer. `cwd` primitive type is checked before any path API. It retains its existing absolute-path and realpath-containment rules and gains neither the root lexical-normal rule nor another length limit. `head_sha` primitive type is likewise checked before regex, serialization, or any other consumption.

The three L2 input arrays—`definition.argv`, `subject.allowed_paths`, and `subject.forbidden_paths`—obey the same current-realm built-in `Array.prototype`, dense own enumerable data-index, built-in `length`, and frozen/read-only allowance as the three L1 arrays. Their prototype/descriptor qualification precedes method lookup, iteration, item consumption, canonicalization, or serialization. A rejected input invokes no inherited conversion, iterator, getter-method, returned method, `toString`, `valueOf`, or `Symbol.toPrimitive` callback.

The environment field grants no environment authority: production never inherits, merges, or passes through any parent or caller environment value. Any invalid factory input, request, subject, definition, environment, scalar, array, scope, or lexical root rejects with the stable `INPUT_INVALID` error, without a receipt and before any realpath, Git, snapshot, or validation-process work. In particular `../escape`, every other invalid scope item, and every non-lexical-normal root are admission failures, not `SUBJECT_MISMATCH` receipts.

### 4.2 Execution sequence

The sequence is fixed:

```text
request and definition validation
-> root/branch/Head/common-dir identity and cwd containment
-> pre-snapshot collection and evaluation
-> at most one real Node child process
-> terminal process observation
-> post-snapshot collection and evaluation
-> receipt
```

A pre-snapshot mismatch starts zero validation children. After a valid pre-snapshot, the exact Node executable is spawned once with `argv.slice(1)`, exact cwd, a newly constructed environment object having zero own fields, `shell:false`, and the definition timeout. Production MUST NOT inherit, merge, or pass through parent/caller environment fields. Process start, timeout, signal, exit code, stdout, and stderr are observed without retry or recovery. A post-snapshot is attempted after every terminal child attempt.

The timeout race has one linearization rule and one forced-termination action. If the child `close` callback is observed before the `timeout_ms` callback, production clears the pending timer and retains the ordinary exit or signal result. If the timeout callback runs first, production sets `timedOut` to true and sends exactly one `SIGKILL` to the one already-started child; it sends no prior `SIGTERM`, creates no grace period or second timer, sends no fallback signal, and starts no replacement child. Production then waits for that child's `close`, collects its terminal output, and performs the existing post-snapshot. With a trustworthy unchanged post-snapshot the tuple is exactly `INTERRUPTED/null/TIMEOUT`; a changed or untrustworthy post-snapshot still takes precedence as `INTERRUPTED/null/SUBJECT_MISMATCH`. No caller field configures the signal or timing policy.

On Darwin, Node may create `__CF_USER_TEXT_ENCODING` in the child environment even when the spawn request carried zero own environment fields. That named platform-injected key is not caller authority and is not part of the definition signature, execute request, receipt, snapshot hash, or receipt-hash contract. Authority-isolation evidence therefore places a sentinel in the parent, proves the sentinel is absent in the child, may explicitly observe and remove only `__CF_USER_TEXT_ENCODING` from the child key set, and then proves that no other keys remain. This is not an allowlist and does not permit any caller-supplied environment field.

The post observation MUST yield the same `scope_sha256` and `worktree_snapshot_sha256` as the pre observation. Otherwise the final outcome is `INTERRUPTED/null/SUBJECT_MISMATCH`, regardless of the child exit result. It retains the pre-snapshot SHA. The child may already have produced physical changes; the gateway does not roll them back and its receipt grants no downstream acceptance or effect.

### 4.3 `ValidationExecutionReceiptV1`

Every admitted request resolves the existing exact three-field gateway envelope `{kind:'OK',value,receipt_sha256}`. `value` is the execution receipt and contains exactly these twenty-four fields:

```text
validation_id
validation_kind
validation_scope
status
verdict
failure_code
command_definition_sha256
receipt_sha256
subject_kind
subject_sha
repository_root
worktree_root
branch
head_sha
common_git_dir
execution_cwd
scope_sha256
worktree_snapshot_sha256
candidate_sha
candidate_tree
stdout_sha256
stderr_sha256
validator_head
idempotency_id
```

Field rules:

- validation identity/kind/scope equal the admitted definition;
- `command_definition_sha256` is SHA-256 of canonical JSON of the exact eight-field definition;
- `subject_kind` is `WORKTREE`; `subject_sha` equals `head_sha`;
- repository, Worktree, branch, Head, and common-Git-dir equal the admitted subject; successful identity readback proves them, while a pre-snapshot mismatch receipt still copies those exact admitted request values;
- `execution_cwd` equals definition cwd when non-null;
- `scope_sha256` is always non-empty and is computed from the admitted subject's canonical scope; after a valid pre-snapshot it equals the evaluator result;
- `worktree_snapshot_sha256` equals the pre-snapshot result after a valid pre-snapshot;
- `candidate_sha`, `candidate_tree`, and `validator_head` are always `null`;
- `stdout_sha256` and `stderr_sha256` are SHA-256 of exact raw child output bytes; when no child starts they are SHA-256 of empty bytes;
- `idempotency_id` equals definition `id`;
- only a pre-snapshot `START_FAILED/null/SUBJECT_MISMATCH` receipt may have `execution_cwd` or `worktree_snapshot_sha256` null; when non-null they obey the rules above; after a valid pre-snapshot both MUST be non-null;
- on that pre-snapshot subject-mismatch outcome, all request-derived identity fields are populated: validation identity and command hash come from the admitted definition; subject kind, subject SHA, repository root, Worktree root, branch, Head, common Git dir, and scope hash come from the admitted request subject; output hashes are SHA-256 of empty bytes; and idempotency identity comes from the admitted definition. The tuple fixes `verdict` to null, the Candidate/tree/Validator fields remain always null, and only `execution_cwd` and `worktree_snapshot_sha256` have conditional nullability among the remaining identity fields;
- `receipt_sha256` is SHA-256 of canonical JSON of the other twenty-three fields using recursively lexicographically sorted object keys, array order unchanged, JSON escaping, and no whitespace.

The envelope `receipt_sha256` is independently SHA-256 of canonical JSON of the complete twenty-four-field receipt. It is not a twenty-fifth receipt field.

The producer allows exactly these status/verdict/failure tuples:

| `status` | `verdict` | `failure_code` | Meaning |
|---|---|---|---|
| `COMPLETED` | `PASS` | `null` | child exited zero and post-snapshot matched |
| `COMPLETED` | `FAIL` | `NONZERO_EXIT` | child exited nonzero and post-snapshot matched |
| `START_FAILED` | `null` | `PROCESS_START_FAILED` | spawn failed after valid pre-snapshot and post-snapshot matched |
| `START_FAILED` | `null` | `SUBJECT_MISMATCH` | identity or pre-snapshot was untrustworthy; zero child |
| `INTERRUPTED` | `null` | `TIMEOUT` | timeout terminal and post-snapshot matched |
| `INTERRUPTED` | `null` | `SIGNAL_EXIT` | non-timeout signal terminal and post-snapshot matched |
| `INTERRUPTED` | `null` | `SUBJECT_MISMATCH` | post-snapshot was untrustworthy or changed |

`RECEIPT_INVALID` belongs to a future receipt consumer and MUST NOT be produced here.

## 5. Evidence layers and compatibility

- L1: pure `SnapshotObservationV1` contract mutations, including malformed raw status/NUL bytes and synthetic before/after or special-leaf observations, with an independent raw-byte/hash oracle.
- L2: real temporary Git repository/worktree and real Node child-process conditions through exported `createValidationGateway`; Test derives its independent expected bytes and hashes from that real worktree and compares them with the production receipt, without injecting an observation.
- L3: future proof through the four public Coordinator methods; forbidden in this Change.

The public Coordinator surface and `createProductionComposition({})` caller contract remain unchanged. A legacy Coordinator call that does not yet supply the exact WORKTREE request is not repaired here. No source rewriting, skip, todo, arbitrary failure, Test-only evaluator path, or short receipt may stand in for L1/L2 evidence.

## 6. Failure and side-effect rule

`INPUT_INVALID` rejects before realpath, Git, snapshot, or process work and without a receipt. Every admitted execution returns one receipt in the existing OK envelope. Only `COMPLETED/PASS/null` with a valid unchanged post-snapshot is a successful producer result. Every other result is fail-closed. No result from this boundary performs or authorizes another validation, State or Ledger write, Regression-to-STAGE transition, Candidate or Final Validation operation, Git publication, PR, Handoff, retry, recovery, or rollback.
