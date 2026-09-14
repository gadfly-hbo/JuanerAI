# Design: Change Coordinator Production Delivery Chain

> Archive history (2026-09-14): Controller accepted the applicable local repair under R242/R248 and authorized mechanical archive in R258. Historical Gate/task/evidence text below is preserved, not a current pending verdict. S09/A2 remains USER_WAIVED / NOT_VERIFIED; target-host deployment, EMPTY/D1 and BLK-D1A-008 remain pending. This archive does not authorize Desktop or a product DISPATCH.

<!-- R216_SPEC_BEGIN -->
## R216 — F1 unpublished Ledger evidence-object builder

This bounded addendum closes only the R214-approved local F1 interface decision under existing Design 8.2, `REQ-M2-005 / AC-M2-005-03`, Foundation `REQ-DTF-005 / AC-DTF-005-07`, and the existing Ledger append publication contract. It adds one Test-reachable local production entry in the existing `tools/harness/change-coordinator/production.mjs`; it does not add a Requirement, Acceptance Criterion, persistent schema, public Core method, Ledger method, transport, recovery boundary, or second Git abstraction. `proposal.md` remains unchanged because its existing allowed production and Test paths already contain this corrective slice.

### Exact local interface

`production.mjs` SHALL export exactly:

```text
createUnpublishedLedgerEvidenceCommitBuilder({
  repositoryRoot, stateRoot, gitExecutable, runtime_uid, runtime_gid
}) -> Object.freeze({ construct })

construct({
  prepared_receipt: LedgerPreparedAppendReceiptV1,
  prepared_bytes: Uint8Array
}) -> Promise<LocalLedgerEvidenceCommitResultV1>
```

Both argument objects are closed ordinary enumerable data objects with exactly the listed own string keys and no accessor, non-enumerable, symbol, inherited, or additional field. Constructor roots are canonical non-root absolute UTF-8 paths without NUL/CR/LF; `gitExecutable` is exactly the existing pinned production Git path; uid/gid are non-negative safe integers and, when the current process is not root, exactly the actual process uid/gid. Constructor rejection is `throw Error('INPUT_INVALID')` and has no effect.

`prepared_receipt` retains its exact existing fourteen-field `LedgerPreparedAppendReceiptV1` shape and value rules. `remote_ref` is the exact existing Evidence ref; `expected_tip` is null or a nonzero lowercase 40-hex Git SHA; `authoritative_path` must parse exactly as `ledger/<change_id>.jsonl`, where the recovered `change_id` satisfies the existing safe Change-ID rule, and must equal the path rederived from that ID. The hash, length, event, sequence, offset, record-length, and idempotency fields retain their existing types. At call entry, before any `await` or effect, the builder snapshots the descriptor-qualified receipt values into a closed plain data object and copies `prepared_bytes` into a new Buffer; all validation, writes, hashes and commands use only those snapshots. The private writer supplies its actual retained `prepared.receipt` and `prepared.bytes`; caller mutation after entry cannot alter the construction.

The byte snapshot must satisfy all three existing bindings `new_byte_length === byteLength`, `new_bytes_sha256 === SHA256(bytes)`, and `prepared_bytes_sha256 === SHA256(bytes)`. `record_offset === prior_byte_length`, `record_offset + record_length === new_byte_length`, and the prefix `bytes[0:prior_byte_length]` must hash to `prior_bytes_sha256`. The exact tail `bytes[record_offset:new_byte_length]` is one nonempty canonical UTF-8 JSON event followed by exactly one LF, with no BOM, CR, blank line or embedded LF; parsing and canonical reserialization of the object without its framing LF must reproduce those exact bytes. Its `change_id` equals the path-derived Change ID; `event_id`, `event_hash`, `sequence`, and `idempotency_id` equal the receipt; and `event_hash` equals SHA-256 of canonical event data with only `event_hash` removed. Null predecessor or a nonnull predecessor with no authoritative target requires the empty prefix, the SHA-256 of empty bytes, length/offset zero and sequence `1`. A nonempty prefix satisfies the existing Ledger framing and last-record rules, and the appended sequence is exactly its last sequence plus one. These are local receipt/append bindings, not a duplicate Core event-class/detail/business validator. A malformed request or any mismatch wholly decidable from the snapshots is `throw Error('INVALID_RECEIPT')` before filesystem or Git effects.

The success value is the closed transient, non-persistent object:

```text
UnpublishedLedgerEvidenceCommitV1 = {
  publication_status:'UNPUBLISHED',
  parent_tip:null|git_sha,
  commit_sha:git_sha,
  tree_sha:git_sha,
  authoritative_path:string,
  ledger_blob_sha:git_sha,
  ledger_bytes_sha256:sha256,
  ledger_byte_length:integer,
  changed_paths:[authoritative_path],
  preserved_entries_sha256_before:sha256,
  preserved_entries_sha256_after:sha256
}
```

The result union reuses existing Gateway result vocabulary and adds no local ambiguity state:

```text
LocalLedgerEvidenceCommitResultV1 =
  {kind:'OK',value:UnpublishedLedgerEvidenceCommitV1,receipt_sha256:sha256} |
  {kind:'CONFLICT',reason:'READBACK_MISMATCH',observed_identity:null|git_sha} |
  {kind:'UNAVAILABLE',reason:'PROCESS_FAILED',partial_receipt:null}
```

`receipt_sha256` is the existing canonical hash of the exact success value. The value never contains `remote_ref`, `push_status`, `linearized`, credential, remote URL, or an ACK/remote receipt and is never remote authority.

### Fixed construction and physical proof

The implementation derives only `<stateRoot>/ledger-work/<change_id>/ledger.jsonl` and its sibling `index`, uses the existing `atomicWrite`, `executeProcess`, exact production Git environment plus only the derived `GIT_INDEX_FILE`, fixed cwd `repositoryRoot`, and the admitted uid/gid. It accepts no ref, path, argv, environment, runner, filesystem, parser, result, clock, receipt, or callback injection. Git commands are fixed by this algorithm:

1. atomically write and read back the exact prepared-byte snapshot at the derived local working file;
2. for null predecessor, initialize the isolated index with `read-tree --empty`; otherwise prove the predecessor with the same commit-header rules as existing `createLedgerObjectReader`, derive its one physical tree, and `read-tree <parent_tree>`;
3. obtain recursive raw entries with `ls-tree -r -z --full-tree <parent_tree>`, construct and validate the preserved-entry view, inspect the exact target, and bind the physical predecessor path bytes to the prepared prefix as specified below;
4. `hash-object -w <derived-ledger-file>`, prove the returned nonzero 40-hex blob exists as a blob, and `cat-file blob <blob>` byte-compare it to `prepared_bytes`;
5. `update-index --add --cacheinfo 100644 <blob> <authoritative_path>`, then `write-tree`;
6. physically reread the new tree, exact target entry, target blob, and recursive preserved-entry view; require the exact target to be `100644 blob <ledger_blob_sha>`, exact bytes/hash/length, exact one changed path, and byte-identical preserved views;
7. `commit-tree <tree> [-p <expected_tip>] -m 'JuanerAI evidence <event_id>'`, then prove by `cat-file -t` and `cat-file commit` that the object is one commit with exactly that tree, exactly zero parents for null predecessor or one exact parent otherwise, and the exact message.

Every child completion uses the exact existing `createLedgerObjectReader` process-completion rule: `code:0`, `signal:null`, empty stderr, `timed_out:false`, and `overflowed:false`. `read-tree --empty`, `read-tree <tree>`, and `update-index ...` require zero stdout bytes. `rev-parse <tip>^{tree}`, `hash-object -w`, `write-tree`, and `commit-tree` each require exactly one nonzero lowercase 40-hex OID plus one LF. `cat-file -t` recognizes exactly one of `commit\n`, `tree\n`, `blob\n`, or `tag\n`; a successful assertion still accepts only its expected commit/tree/blob type. Target `ls-tree -z --full-tree <tree> -- <authoritative_path>` requires either zero bytes or exactly `100644 blob <oid> TAB <authoritative_path> NUL`; recursive `ls-tree` uses the record grammar below. No output is trimmed into validity.

Predecessor `cat-file commit` and final `cat-file commit` apply the existing object-reader header checks: UTF-8 headers before one header/body separator; exactly one first `tree <oid>` header; every `parent` header a nonzero 40-hex OID distinct from the commit itself; exactly one syntactically valid author and committer header; and no malformed `tree`, `parent`, `author`, or `committer` header. The predecessor supplies the physically derived tree and may have any valid parent count. The new commit has exactly the constructed tree, zero parent headers when `expected_tip` is null or one exact `parent <expected_tip>` otherwise, and body bytes exactly `JuanerAI evidence <event_id>\n` after the separator.

Failure priority is closed. Snapshot/shape/binding errors decidable before effects throw the input error above. A thrown/start error, nonzero, signal, stderr, timeout, overflow, missing/unreadable object or filesystem/atomic-write/readback failure returns `UNAVAILABLE / PROCESS_FAILED` before parsing stdout. A completed control command whose empty/OID stdout is malformed, or whose `cat-file -t` stdout is not exactly one recognized `commit\n`, `tree\n`, `blob\n`, or `tag\n` line, cannot establish an object and returns `UNAVAILABLE`. Any recognized but non-expected type—including `tag\n`—establishes a physical type disagreement and returns `CONFLICT / READBACK_MISMATCH`. Once exact command completion and identity exist, malformed physical commit/tree-entry bytes or any parent/tree/path/blob/byte/message disagreement also returns `CONFLICT`; `observed_identity` is the proven new tree SHA only when that exact tree is available, otherwise null. Neither result is publishable.

For the preserved view, parse every NUL-terminated recursive `ls-tree` record as exact raw bytes `mode SP type SP oid TAB path NUL`, require a nonempty raw path and nonzero 40-hex OID, and accept only `100644 blob`, `100755 blob`, `120000 blob`, or `160000 commit`. Reject duplicate raw paths, sort records by unsigned lexicographic raw full-path bytes, exclude only the record whose raw path equals the exact UTF-8 authoritative-path bytes, and concatenate the remaining complete records including their terminal NUL. Do not decode/re-encode path bytes. For a null predecessor the before view is empty bytes. An exact target entry is admissible before construction only as `100644 blob`; any leaf whose path is an ancestor or descendant of the target, or an exact target with another mode/type, is a target conflict. For an absent target, the prepared prefix must be empty. For an existing target, `cat-file blob <old_oid>` bytes must equal the prepared prefix exactly, including its hash/length and existing Ledger framing/last-record sequence; this is the physical predecessor binding. The after view must have one exact regular-blob target and no ancestor/descendant conflict. The two returned preserved hashes are SHA-256 of the respective canonical concatenations, and success additionally requires the concatenations themselves to be byte-identical. This is recursive leaf preservation, not a top-level `ledger` tree-OID comparison and not a general tree API.

Construction may leave the derived local working file, isolated index/lock artifacts, or unreferenced blob/tree/commit objects after a failure. It never updates a local or remote ref and promises no transaction, cleanup, durability, or rollback of those permitted local partial effects. It must never return `OK`, call protected transport, form a push refspec, or cache a publishable identity from an invalid, failed, uncertain, empty, zero, or unproved result.

### Private-writer reuse and two-stage activation

The existing private `createLedgerGateway` constructs this builder from its already bound `repositoryRoot`, `stateRoot`, fixed Git and uid/gid. Its existing `commitAndPush({prepared_receipt,idempotency_id})` signature remains unchanged. After its existing prepared-state/idempotency equality check, it calls `construct` with the exact retained receipt/byte snapshots only when `prepared.publication === null`. A non-OK result leaves that slot null, is not cached, and stops the current call before protected push; a later caller retry of the same existing `commitAndPush` may reach construction again because the slot is still null. One `OK` stores that exact local value. Every later same-identity call in that prepared cycle then skips construction and reuses the identical commit/tree/local proof for protected push or existing response-loss handling; a later `prepareAppend` creates a new prepared cycle with publication null. The builder itself performs no automatic retry and has no cache, convergence, recovery or idempotency state. Protected credential checks, SSH arguments, remote ref, push/readback, response-loss convergence, four Ledger methods, and Core consumption remain governed by the existing contract. On acknowledged transport the writer combines the cached local value with the prepared receipt into the complete existing `LedgerEvidenceCommitReceiptV1`, including both preserved-entry hashes; the local value is not substituted for that remote receipt.

Activation has two non-overlapping source states. First, Test freezes the final contract and proves the export is absent. `TDD_READY-ENTRY` permits only mechanical extraction of the current local work/index/object body into the named factory and delegation from the private writer. The extracted body retains the old unchecked child-result, trimmed-output and omitted-preservation behavior; its temporary direct result is exactly the old internal `{tree,commit}` publication strings needed by the private caller, not a fabricated final `OK`. It is explicitly nonconforming, non-releaseable, and provides no legacy flag or alternate runtime. Controller source review must prove the old private body was removed rather than duplicated and that private construction occurs only through this body.

Before faulting it, the frozen Test calls this mechanical body on a valid real repository and independently reads its returned commit/tree/path/blob/parent to prove it can produce a physically healthy publication even though it lacks the final union and preservation fields. Then the same frozen body receives a real derived-index lock after an independently healthy Git/index control. The causal F1 behavior RED must independently prove that a failed child nevertheless caused the body to return/cache a physically bad publication: an empty/unresolvable OID, a tree missing the target, lost non-target entries, wrong parent/tree/path/blob/bytes, or another concrete violated physical fact. Merely receiving `{tree,commit}` instead of the future result union is not the behavior RED. A second, separately recorded TDD_READY may authorize the minimum final correction in that same body only after both health and bad-publication facts are preserved. If no approved real failure can yield that physical contradiction while old behavior remains intact, work stops at the Test/Spec Gate with that exact frontier; implementation-first evidence is forbidden.

This addendum makes no F2 normative change. F2 remains the existing Core/State/strict Port contract and its two independent payload oracles and six crash-window evidence obligations. `StatusDiagnosticsV1` has eleven fields and `pointer_status:'INVALID'` requires a genuinely persisted sixteen-field `LocalPauseDiagnosticV1`. When no safe diagnostic exists, the existing result is the exact `CoordinatorErrorV1` `{schema_version:'1.0',operation:'status',outcome:'REJECTED',error_code:'WIP_AUTHORITY_INVALID',change_id:null|string}`, not a STATUS outcome with null pause. F3 remains withdrawn. A2/S09 remains `USER_WAIVED / NOT_VERIFIED` only for its already mapped privileged leaves; no local F1 or ordinary F2 evidence is waived. A3 reuse remains version-bound to its recorded K1/K2/true-hour/WVEB identities.
<!-- R216_SPEC_END -->

<!-- R174_STATE_FIRST_WRITE_BEGIN -->
## R174 — trusted-local State pause first-write seam

This bounded supplement refines the existing `REQ-M2-006 / AC-M2-006-01,02,04,07,08` implementation and evidence path; it adds no Requirement or Acceptance Criterion identity. `production.mjs` SHALL export the same synchronous `createFileState(stateRoot)` factory already used by fixed production composition. Its input remains one trusted-caller-owned canonical absolute local root and its output remains the existing six-method State gateway (`readPointer`, `writePointer`, `readState`, `writeState`, `readLocalPause`, `writeLocalPause`) with the existing request, `GatewayResultV1`, byte, hash, receipt, and sixteen-field `LocalPauseDiagnosticV1` contracts. The factory gains no input validator, option object, filesystem/process/verifier/credential callback, constructor side effect, wrapper, or new module. `createProductionComposition({})` remains empty-object/fixed-Host/non-injectable; Product Core and its exports remain byte-frozen.

Only `writeLocalPause({expected_sha256:null,next_bytes})` when the target pause file is physically absent gains first creation. It uses the existing `atomicWrite` publication and exact readback before returning the existing `OK` bytes/hash/receipt. The closed behavior table is:

| Physical pause target / expectation | Required result and effect |
|---|---|
| absent / `null` | first-create through existing atomic writer, exact readback, then `OK` |
| present / `null` | existing `CONFLICT / CAS_CONFLICT`, `observed_identity` equal to the old-byte SHA-256, no overwrite |
| present / wrong non-null hash | existing `CONFLICT / CAS_CONFLICT`, old identity preserved, no overwrite |
| present / correct non-null hash | existing replacement behavior and exact readback unchanged |
| absent / non-null hash | existing `ABSENT`, no create |
| non-`ENOENT` read or filesystem obstacle | existing `UNAVAILABLE`, never converted to absence or success |

This branch is private to pause-file first creation. Shared `casWrite`, read, and `atomicWrite`, all pointer/State methods, path layout, file bytes, and every other source region remain unchanged. A failure after rename has published bytes but before successful readback does not gain a rollback guarantee. The Foundation's sole trusted Coordinator process, single state root, and one process mutex remain the complete concurrency context: no file lock, multiwriter protocol, retry, journal, transaction, durability claim, new recovery boundary, State schema, reason, lifecycle, clear/supersede, or STATUS behavior is added.

The public Core connection evidence belongs to existing Coordinator test `#56`: a valid signed DISPATCH enters through `createCoordinatorCore` plus `makeTestDependencies`, with only Ledger `PRIOR_TIP_READ` failing, and delegates only `readLocalPause`/`writeLocalPause` to the real `createFileState` result. It must preserve the original command/body/idempotency identity, exact sixteen diagnostic fields, the public result's existing null `state`/`state_version`/`state_hash` fields, zero Ledger prepare/commit and Worktree effects, plus real pause bytes/readback. Those null result fields do not erase the already-published READY State at the existing State boundary: its observed bytes/version/hash remain preserved and diagnostic-bound. In this supplemental connection that State boundary remains the declared Test double; only pause-file persistence/readback is real-filesystem proof. Other Ports remain declared doubles; this is not full Host/composition/credential/PR proof. It MUST NOT seed/prime State, bypass admission, replace other State methods, remove or rewrite READY State, or be relabeled as the `run`-owned `TEST-M2-011 / 011-L08,L09` contract.

TDD is two causally separate steps: freeze one `coordinator.test.mjs` block and its independent export/temp-filesystem controls; prove only missing export as the reachability RED; permit an export-only `production.mjs` change whose removal restores the exact preceding bytes; pass temp-filesystem health; then, while first-write behavior is still absent, prove `expected OK`, actual `ABSENT`, and no file as the behavior RED. Only a second bounded TDD_READY may permit the pause-private branch. The same frozen assertions then cover the complete table and Core connection before GREEN. No permanent skip, source rewrite, copied State algorithm, fake runtime result, or implementation-first Test is permitted.
<!-- R174_STATE_FIRST_WRITE_END -->

## 1. Design Summary

Current status: `SPEC_READY / CONTROLLER_GATE_PENDING_R109`.

This Change is intended to complete the existing serial Coordinator rather than add an orchestrator:

```text
signed six-field definitions
-> exact purpose admission and eight-field derivation
-> actual post-Worker WorktreeSubjectV1
-> Regression affected suite
-> Regression Test Asset Retirement
-> content-bound exact stage
-> Candidate commit/readback                         K1
-> Candidate Final Validation
-> closed Validator artifact and bounded repair
-> push/readback/freeze
-> cumulative canonical diff/path readback
-> stable delivery ID -> PR/readback
-> remote Ledger evidence selection -> Handoff
-> HANDOFF_READY/readback -> AWAITING_CONTROLLER     K2
```

The design retains four public Coordinator methods, six macro states, seven event classes, one process mutex, four recovery boundaries, and one current Change. F01-R is fail-closed without new machinery. The approved repair input and CCR002 execution-content producer are specified below; neither is implemented or activated by this draft.

## 2. Canonical Values and Collections

Unless a baseline contract is stricter:

- canonical JSON recursively sorts object keys, preserves array order, uses minimal JSON escaping, and has no whitespace, BOM, or trailing LF;
- SHA-256 is lowercase 64-hex; Git object identity is lowercase 40-hex. The only nullable Git parent scalar in this Change is `readCommit` success `parent:null` after section 5.1 physically proves a zero-parent root; every nonroot `readCommit` parent and every Candidate parent remains lowercase full 40-hex;
- a closed object has exactly the named own enumerable data fields, `Object.prototype`, no symbol/accessor/extra field, and is descriptor-qualified before values are consumed;
- a closed array has the current-realm `Array.prototype`, dense own enumerable data indices, the built-in non-enumerable data `length`, and no symbol/accessor/hole/extra key;
- every path collection is sorted uniquely by raw UTF-8 bytes, not locale order;
- a string path must encode and decode UTF-8 to identical bytes. Non-round-trippable Git names are unsupported and fail closed;
- collection ordering below is semantic and participates in receipt hashes.

Schema names ending in `V1` are the first version of this M2 extension and use `schema_version:'1.0'` where that field is shown. Old incomplete or placeholder shapes are not compatibility variants.

## 3. Signed Definitions and Purpose Map

### 3.1 Signed definition

`SignedValidationDefinitionV1` is exactly:

```text
{
  id,
  argv,
  cwd,
  environment,
  timeout_ms,
  subject
}
```

All six values are signed inside the complete DISPATCH body. `argv` is a non-empty closed string array, `cwd` is an absolute primitive string, `environment` is the accepted closed empty object, `timeout_ms` is a positive safe integer, and `subject` is exactly `WORKTREE` or `CANDIDATE` as admitted below.

The complete validations array has length three and contains each ID once:

| Signed `id` | Signed `subject` | Derived `validation_kind` | Derived `validation_scope` | Order |
|---|---|---|---|---:|
| `regression-affected-suite` | `WORKTREE` | `REGRESSION` | `AFFECTED_SUITE` | 1 |
| `regression-test-asset-retirement` | `WORKTREE` | `REGRESSION` | `TEST_ASSET_RETIREMENT` | 2 |
| `final-validation-candidate` | `CANDIDATE` | `FINAL_VALIDATION` | `CANDIDATE` | 3 |

Input array order is not consulted for lookup or execution. Admission builds a map by exact ID, rejects a duplicate/unknown/missing/cross-subject entry, and then emits the fixed order above.

### 3.2 Execution definition and derivation proof

`ExecutionValidationDefinitionV1` is exactly:

```text
{
  id,
  validation_kind,
  validation_scope,
  subject,
  argv,
  cwd,
  environment,
  timeout_ms
}
```

Derivation copies the five signed values other than `id` plus `id` itself without normalization and inserts only the table's kind and scope. The definition hash is:

```text
command_definition_sha256 = SHA256(canonical_json(execution_definition))
```

The six-field signed body hash, eight-field definition hash, DISPATCH body hash, and Ledger command/event identities remain distinct. Ledger context links them; none is relabeled as another.

## 4. Subjects and the Closed Execute Union

### 4.1 WORKTREE branch retained

`WorktreeSubjectV1`, its snapshot algorithm, exact collector order, scope rules, empty-index rule, seven outcome tuples, environment isolation, timeout race, and twenty-four-field receipt remain byte-for-byte the accepted WVEB contract.

The former WVEB phrase “Candidate ... is INPUT_INVALID” is local to this branch: either Regression definition accepts only `WorktreeSubjectV1`. Candidate fields in a Regression request remain invalid.

### 4.2 Candidate subject

`CandidateSubjectV1` is exactly:

```text
{
  kind: 'CANDIDATE',
  repository_root,
  worktree_root,
  branch,
  head_sha,
  common_git_dir,
  allowed_paths,
  forbidden_paths,
  candidate_sha,
  candidate_tree
}
```

It reuses WVEB primitive/root/branch/Head/scope/data-object rules. Additionally:

- `head_sha === candidate_sha`;
- `candidate_tree` is a Git SHA;
- `readCommit(candidate_sha)` proves that tree and branch;
- pre- and post-observation prove Worktree Head/branch/common-dir, empty index, and no tracked/untracked/ignored differences;
- definition cwd is realpath-contained in the Worktree.

Only `final-validation-candidate / FINAL_VALIDATION / CANDIDATE / CANDIDATE` accepts this subject. The exact execute request remains `{definition,subject}`. No `subject_sha` compatibility field exists.

### 4.3 Twenty-four-field receipt branch table

`ValidationExecutionReceiptV1` remains exactly:

```text
{
  validation_id,validation_kind,validation_scope,status,verdict,failure_code,
  command_definition_sha256,receipt_sha256,subject_kind,subject_sha,
  repository_root,worktree_root,branch,head_sha,common_git_dir,execution_cwd,
  scope_sha256,worktree_snapshot_sha256,candidate_sha,candidate_tree,
  stdout_sha256,stderr_sha256,validator_head,idempotency_id
}
```

| Field | WORKTREE / REGRESSION | CANDIDATE / FINAL_VALIDATION |
|---|---|---|
| `subject_kind` | `WORKTREE` | `CANDIDATE` |
| `subject_sha` | `head_sha` | `head_sha == candidate_sha` |
| root/worktree/branch/Head/common-dir | exact request identity | exact request identity |
| `execution_cwd` | definition cwd except nullable pre-snapshot mismatch | definition cwd except nullable pre-observation mismatch |
| `scope_sha256` | non-null canonical scope hash | non-null canonical scope hash |
| `worktree_snapshot_sha256` | non-null after valid pre-snapshot; nullable only pre-snapshot mismatch | always null; Candidate identity is commit/tree/clean readback |
| `candidate_sha` | null | exact non-null Candidate SHA |
| `candidate_tree` | null | exact non-null Candidate tree |
| `validator_head` | null | null |
| `idempotency_id` | definition ID | definition ID |

The seven legal tuples are unchanged:

```text
COMPLETED/PASS/null
COMPLETED/FAIL/NONZERO_EXIT
START_FAILED/null/PROCESS_START_FAILED
START_FAILED/null/SUBJECT_MISMATCH
INTERRUPTED/null/TIMEOUT
INTERRUPTED/null/SIGNAL_EXIT
INTERRUPTED/null/SUBJECT_MISMATCH
```

`receipt_sha256` hashes canonical JSON of the other twenty-three fields. The outer Gateway receipt hashes the complete twenty-four-field value. `RECEIPT_INVALID` is a consumer error, never a producer tuple.

## 5. K1 Worktree Content and Exact Stage

### 5.1 Fresh inspection

Candidate preparation retains the accepted Git signature and result without adding fields:

```text
inspectWorktree({canonical_root,worktree_root,expected_branch,expected_head})
  -> {worktree_root,branch,head_sha,common_git_dir,status_entries,clean}
```

The Adapter uses the pinned Git executable, `shell:false`, and exactly this isolated environment for every command in sections 5 and 10.1:

```text
{
  LC_ALL:'C',LANG:'C',TZ:'UTC',GIT_CONFIG_NOSYSTEM:'1',
  GIT_CONFIG_GLOBAL:'/dev/null',GIT_ATTR_NOSYSTEM:'1',
  GIT_PAGER:'cat',PAGER:'cat',GIT_TERMINAL_PROMPT:'0',
  GIT_NO_REPLACE_OBJECTS:'1'
}
```

After the accepted root/common-dir/config/replace-ref safety checks, Candidate inspection executes in `worktree_root`, in this order:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse --git-common-dir
git status --porcelain=v1 -z --untracked-files=all --no-renames
git status --porcelain=v1 -z --untracked-files=all --ignored=matching --no-renames
git diff --cached --quiet <expected_head> --
```

The two status streams obey WVEB's NUL record grammar and exact equality rule after separating ignored records. No `!!` is admitted. Main statuses map only ` M -> MODIFIED`, ` D -> DELETED`, ` T -> TYPE_CHANGED`, and `?? -> UNTRACKED`; every staged, unmerged, rename/copy, ignored, unsupported, malformed, duplicate, absolute/dot/dot-dot/backslash, NUL, or invalid/non-round-trippable UTF-8 path rejects. Paths are decoded only after validation, sorted uniquely by raw bytes, and emitted as the accepted exact `status_entries` records with `mode:null` and `object_sha:null`; these nullable fields are not content evidence. The index probe must exit zero with empty stdout/stderr. Candidate preparation requires `clean:false`, at least one actual path, and Coordinator filtering of each actual path through the signed allowed/forbidden rules. Scope rules are never emitted as paths.

The authoritative content observation is not `inspectWorktree`. Each real Regression execution uses the existing production WVEB collector/evaluator and returns its accepted `worktree_snapshot_sha256`. Both Regression receipts must contain the same snapshot. `production.mjs` remains the only production importer/caller of that evaluator.

#### 5.1.1 Bounded root representation in `readCommit`

CCR004 overrides the inherited Foundation full-40 `parent` scalar rule only for the existing `readCommit({canonical_root,sha})` success value. Its request, four success keys, GatewayResult variants, reason ownership, and receipt hashing remain unchanged:

```text
readCommit({canonical_root,sha})
  -> GatewayResultV1<{sha,parent:git_sha|null,tree,branch}>
```

For the parent decision, the Adapter must successfully read the requested physical commit object bytes with exact `git cat-file commit <sha>` under section 5.1's pinned executable, isolated environment, and `shell:false`, but with the existing `readCommit` command `cwd` fixed to `canonical_root`; `worktree_root` is not added to the request. It inspects only the complete Git commit header block needed to identify its literal top-level `tree <40-hex>` and `parent <40-hex>` header lines. A successful object whose physical header contains zero `parent` lines is the only case that returns `parent:null`. If at least one parent line exists, the existing nonroot meaning remains: `parent` is the actual nonzero full 40-hex parent selected by the existing read contract, and it must not equal `sha`. This bounded exception neither adds a parents collection nor changes how an already-supported nonroot or merge object is treated.

A failed `git rev-parse <sha>^`, empty output, graph-derived zero-parent report, missing object, wrong object type, command failure/stderr, malformed or incomplete commit bytes/header, malformed tree/parent identity, an all-zero parent OID, self-parent, permission failure, or any uncertain observation is not physical root proof and must take the existing Gateway failure path. It must never be wrapped as `OK`/`ALREADY_APPLIED` with `parent:null` or a fabricated nonroot value. The returned `sha`, `tree`, and `branch` retain their existing exact checks, and the unchanged outer receipt hashes canonical JSON of the same four-key value, including literal JSON null only for that proven root.

This is historical-baseline readability only. Before `commitCandidate`, Coordinator may consume `readCommit(expected_parent)` to prove the baseline SHA/tree/branch; a null parent is admissible only for that read baseline. `expected_parent` itself remains the accurate non-null full 40-hex current Head supplied to Candidate creation.

### 5.2 Purpose-bound stage fence and exact commands

`production.mjs` remains the sole production importer/caller of the WVEB evaluator. It may export one purpose-bound `createCandidateStageGateway({gitExecutable})` so Test can exercise the real production stage contract; the returned frozen object has exactly `stageExact` and `readStaged`. It accepts no filesystem/process/callback/State/Ledger/credential/network/clock/retry injection. `createProductionComposition({})` supplies its configured pinned executable.

`stageExact` request is exactly:

```text
{
  canonical_root,
  subject: WorktreeSubjectV1,
  expected_worktree_snapshot_sha256,
  paths
}
```

It verifies the fresh snapshot equals the expected value, retains the pre-stage content observation, stages `paths` through literal NUL-safe path transport, then proves index and filesystem equality. Its exact result is:

```text
{
  staged_paths,
  staged_paths_sha256,
  index_tree
}
```

`readStaged` retains the accepted Git signature and result:

```text
readStaged({canonical_root,worktree_root})
  -> {staged_paths,index_tree,staged_paths_sha256}
```

Inside one `stageExact` call, production executes the accepted WVEB pre-observation and requires its exact snapshot to equal `expected_worktree_snapshot_sha256`. Its normalized raw-byte path/type/mode/content records are retained in memory, not hashed under a new protocol and not returned. The admitted `paths` must equal that observation's complete raw-byte-sorted path set. The physical stage command is exactly:

```text
git --literal-pathspecs add --pathspec-from-file=- --pathspec-file-nul
stdin = each admitted raw path followed by one NUL, in sorted order
```

It then executes, in order:

```text
git diff --cached --name-status -z --no-renames <head_sha> --
git diff --cached --raw -z --full-index --no-abbrev --no-renames <head_sha> --
git write-tree
git diff --quiet --no-ext-diff --
git status --porcelain=v1 -z --untracked-files=all --no-renames
git status --porcelain=v1 -z --untracked-files=all --ignored=matching --no-renames
```

The name-status result admits only A/M/D/T, has exactly the input path set, and produces `staged_paths`. The raw result must describe the same path/status set. For every non-deleted raw entry, production runs exact `git cat-file blob <index_object_sha>` and hashes the returned bytes under the existing WVEB file/symlink content rule; deleted entries use WVEB `MISSING`. The resulting path/type/mode/content records must equal the retained pre-stage records exactly. `git diff --quiet` must exit zero with empty outputs, and the two post-status streams must contain exactly the staged first-column A/M/D/T entries, no second-column difference, `??`, `!!`, or other entry. `index_tree` must differ from the expected parent's tree. Any disagreement returns failure without commit or cleanup.

`readStaged` independently repeats the cached name-status/raw/write-tree portion, including the exact raw command with `--full-index --no-abbrev --no-renames`, and returns only the accepted three fields. `--no-abbrev` is mandatory so both object IDs in every raw record are full lowercase 40-hex values, including the full zero OID for an absent side; truncated, malformed, or mismatched identity still fails closed. Coordinator requires `stageExact` and `readStaged` paths/hash/tree to be exactly equal. `staged_paths_sha256` remains SHA-256 of canonical JSON of the sorted string paths. The removed `JUANERAI_M2_STAGE_CONTENT_V1`, `pre_stage_content_sha256`, and `post_stage_content_sha256` have no consumer and are not part of this Change.

### 5.3 One public-call stage-to-commit sequence

Normal K1 does not publish or return between STAGE and Candidate commit. One `run` call enters with read-back State at `DELIVERING/STAGE`, holds the existing process mutex, and performs:

```text
fresh inspectWorktree and empty-index proof
-> verify both remotely read Regression receipts and equal snapshot
-> stageExact
-> readStaged exact equality
-> readCommit(expected_parent) exact SHA/tree/branch baseline proof; its parent is null only for a physically proven historical root, otherwise full 40-hex
-> internal CANDIDATE_COMMIT step with the same in-memory tree/path identity
-> commitCandidate(expected_parent,expected_tree,tree-bound idempotency)
-> Candidate commit/Head/tree/branch/common-dir/index/clean readback
-> CANDIDATE_COMMITTED remote append/readback
-> State write/readback at DELIVERING/FINAL_VALIDATION
-> return ADVANCED
```

`CANDIDATE_COMMIT` remains an allowed internal phase label but is not a normal persisted/returnable intermediate in this M2 chain. The application-visible transition is STAGE to FINAL_VALIDATION only after the complete event and State readbacks. The mutex prevents another public mutation only; it is not evidence against an external Git writer.

An external change before or during stage fails the snapshot or record comparison. A coordinated index/worktree replacement after `stageExact` and before `readStaged` fails that readback. After `readStaged`, a final `write-tree == expected_tree` is only an observation; it does not close the interval before an ordinary index-reading `git commit`. Therefore `commitCandidate` never asks Git to choose content from the mutable index. It passes the already verified `expected_tree` as the explicit tree argument to `git commit-tree`, then compare-and-swaps the current branch from `expected_parent` to that exact commit. A later index or worktree replacement can make final readback fail, but cannot change the committed tree.

If the process stops after physical stage and before K1 publication, State still reads STAGE but the independently verified in-memory tree/path identity is lost. When the next `run` observes the surviving non-empty index or an already moved Head, it cannot distinguish a prior invocation's staged index, unreachable commit object, successful ref move, or later external drift by reading those objects themselves. It therefore enters `CANDIDATE_COMMIT_AMBIGUOUS / MANUAL_CONTROLLER_STOP`, never resumes commit, restages, cleans, rolls back, or publishes Candidate event/State. A normal fresh entry at STAGE with `HEAD == expected_parent` and an empty index remains legal: it re-reads the two remote Regression receipts, freshly proves their common snapshot against the Worktree, and performs the first physical stage. A still-running `commitCandidate` call retains the independent expected identity and may use the accepted Candidate boundary: exact same-operation parent/tree/branch/idempotency success converges and exact branch absence at the same parent may continue once. No stage recovery boundary, State field, persistent transaction, OS lock, or fifth recovery mechanism is added.

### 5.4 Candidate identity and K1 publication

Candidate idempotency is deterministic:

```text
candidate_idempotency_id = 'candidate-' + SHA256(canonical_json({
  schema_version:'1.0',change_id,authorization_cycle_command_id,
  expected_parent,expected_tree
}))
```

`commitCandidate` receives that identity and the in-memory stage-verified `expected_tree`, never the DISPATCH identity reused across repair Candidates. Coordinator supplies these exact UTF-8 message bytes:

```text
JuanerAI Candidate

JuanerAI-Idempotency-ID: <candidate_idempotency_id>
```

including the final LF. With the section 5.1 executable, environment, `cwd`, and `shell:false`, the Adapter starts with the first two commands below. Only inside the same uninterrupted invocation that retains the independently verified `expected_tree` and candidate identity, if their Head already differs from `expected_parent`, it branches to `git cat-file commit <head>`, `git rev-parse <head>^`, and `git rev-parse <head>^{tree}` and returns success only when that current branch Head has the exact expected parent/tree/message/idempotency; this is the existing Candidate convergence readback, not a new commit. A restarted Coordinator never calls this convergence path with an expected value derived from observed Git objects. If Head equals `expected_parent`, it continues the remaining commands exactly:

```text
git rev-parse HEAD
git branch --show-current
git write-tree
git commit-tree <expected_tree> -p <expected_parent>
  stdin = exact message_bytes
git cat-file commit <candidate_sha>
git update-ref refs/heads/<branch> <candidate_sha> <expected_parent>
git rev-parse HEAD
git rev-parse <candidate_sha>^
git rev-parse <candidate_sha>^{tree}
git branch --show-current
```

The first three observations must equal `expected_parent`, the admitted branch, and `expected_tree` before `commit-tree`. The canonical commit object read by `cat-file` must have exactly one parent, the explicit tree, and the exact message/idempotency trailer before the ref compare-and-swap. `update-ref` is the only branch-moving command and its old-value argument is mandatory. An ordinary `git commit`, amend, merge parent, index-derived tree selection, ref force, checkout, reset, or cleanup is unavailable.

There are three distinct stop intervals:

1. Before `commit-tree`, an index/worktree content or cleanliness mismatch is `WORKTREE_DIRTY_CONFLICT`; a parent/branch/common-dir identity mismatch is `CANDIDATE_IDENTITY_CONFLICT`. No commit object or branch movement exists.
2. After `commit-tree` but before a successful `update-ref`, an interruption or CAS failure may leave only an unreachable, non-authoritative commit object and is `CANDIDATE_COMMIT_AMBIGUOUS`. It publishes no Candidate event or State. An exact branch absence may continue once only inside the still-running invocation with its retained independent expected tree/SHA/identity; process restart always takes the manual stop above.
3. After successful `update-ref`, the branch contains only the commit whose tree is the still-running invocation's independent `expected_tree`. That invocation may converge by exact readback after response loss; branch/ref ambiguity remains `CANDIDATE_COMMIT_AMBIGUOUS`, while proven index/worktree/common-dir/clean drift is `CANDIDATE_IDENTITY_CONFLICT`. On restart neither a matching trailer nor a tree/diff read from observed Head restores the lost independent Regression/stage proof, so no convergence occurs. No stop can be relabeled as a pre-commit rejection, and none authorizes an event, State, push, PR, or Handoff.

The exact success/readback remains `{sha,parent,tree,branch}` and uses the already-accepted Candidate boundary for same-operation idempotency proof. Message/trailer validation belongs inside `commitCandidate`'s Git Adapter readback; neither `readCommit` nor the Coordinator gains a message field. `commitCandidate` success always returns the accurate non-null full 40-hex `expected_parent`, and its physical commit object must have exactly one parent. Coordinator re-reads the four-field Candidate commit plus Worktree/index and rejects `parent:null`, then requires Head `sha`, same branch/common-dir, no status, empty staged paths, `tree == index_tree == expected_tree`, and `parent == expected_parent`. The section 5.1 root exception applies only when reading a historical zero-parent baseline and cannot enter Candidate success, `CANDIDATE_COMMITTED`, Candidate State, or Candidate convergence. Thus an external index writer in the final observation-to-commit interval cannot influence selected commit content; it can only cause the final index/clean proof to stop after the exact-tree commit exists.

On restart with State still at STAGE, this manual-stop rule applies when physical stage is evidenced by a surviving non-empty index or when Head has already moved and the in-memory `expected_tree` is gone. No observed Head/tree/diff/trailer is promoted into the missing expected value. Even a valid parent/branch and internally consistent idempotency trailer cannot prove equality to the two Regression receipts' earlier content identity. The exact response is the existing Candidate ambiguity manual stop, with zero Candidate event/State/push/PR/Handoff and no Git cleanup or retry. State STAGE alone is not an ambiguity marker: unchanged `expected_parent` plus an empty index follows the normal fresh-entry proof and first-stage sequence in section 5.3.

`CANDIDATE_COMMITTED.detail` is exactly:

```text
{
  candidate_sha,parent,tree,branch,
  staged_paths,staged_paths_sha256,worktree_snapshot_sha256
}
```

After remote event readback, Candidate State is the accepted `CandidateV1` with `validation_refs:[]`, `validator_head:null`, and `frozen:false`.

## 6. Validation Evidence Receipt Union

### 6.1 Legacy twelve-field role receipt

`RoleValidationReceiptV1` is exactly:

```text
{
  validation_id,validation_kind,validation_scope,status,verdict,failure_code,
  command_definition_sha256,receipt_sha256,subject_sha,
  candidate_sha,validator_head,idempotency_id
}
```

It is limited to:

| Agent phase | kind / scope | Candidate and Validator fields |
|---|---|---|
| `TEST_RED` | `TEST_RED / ACCEPTANCE_CRITERION` | both null |
| `WORKER_GREEN` | `WORKER_GREEN / WORKER_OUTPUT` | both null |
| `VALIDATOR` | `VALIDATOR / VALIDATOR_REVIEW` | both equal exact Candidate SHA |

For Agent-derived evidence, `validation_id` is the correlation ID; `command_definition_sha256` is SHA-256 of canonical `AgentBindingM2V1`, including the applicable repair-only nested evidence or proof; `idempotency_id` is the binding idempotency ID; and `receipt_sha256` hashes the other eleven fields. A RESULT status maps to `COMPLETED/PASS/null` or `COMPLETED/FAIL/null`; host interruption/start failure maps through the existing Agent stop contract and does not invent a successful role receipt. An ordinary Test PASS is a role-output verdict, not the product-under-test verdict. A repair-Test PASS is produced only by section 7.4's Host-owned mechanical proof, never by the Agent plan or its logs.

### 6.2 Closed union

`ValidationEvidenceReceiptV1` is exactly one of:

- `RoleValidationReceiptV1` for the three rows above; or
- `ValidationExecutionReceiptV1` for `REGRESSION/AFFECTED_SUITE`, `REGRESSION/TEST_ASSET_RETIREMENT`, or `FINAL_VALIDATION/CANDIDATE`.

Field-count and kind/scope discrimination occur before consumption. A 12-field Regression, a 24-field Test/Worker/Validator, a projected/truncated 24-field receipt, or any extra-field receipt is invalid.

### 6.3 Role output to Ledger pipeline

For every Agent action, the accepted host route first compares every signed binding field, resolves the content-addressed brief/input/output-schema paths, reads their actual bytes, and requires each hash before launch. Ordinary actions receive the exact schema path and exact `brief + two LF + input` stdin. The repair Test alone uses section 7.3's derived-input verification and fixed effective input. On close, the host reads the actual output path, enforces its size/path/hash boundary, obtains the role status as specified below, records changed-path inventory, and later re-reads the same artifact bytes/hash before RESULT:

- Spec, ordinary Test, and Worker retain the existing closed output schema and `parsed.status` producer. Repair Test alone uses section 7.4's closed plan/proof union and Host-owned status producer. Every other non-Validator RESULT remains unparsed outside the host.
- Validator alone uses section 7.2's `parsed.verdict` and parsed artifact RESULT branch.

Coordinator compares the complete settlement to `PendingAgentV1`, then appends/readbacks the complete `AGENT_RUN/RESULT`. Only after that remote readback does it mechanically derive the twelve-field role receipt from the exact Agent binding, RESULT status, subject, Candidate/Validator nullability, and fixed kind/scope; it recomputes `command_definition_sha256` and `receipt_sha256`, appends/readbacks the adjacent `VALIDATION_RESULT`, and only then changes State or requests another role. The AGENT_RUN record owns artifact path/hash/output-schema identity; the adjacent receipt owns the normalized role verdict. Both remote records are required evidence and neither projects away the other.

Unreadable/missing/nonmatching artifact bytes, wrong output-schema binding, changed-path inventory mismatch, or wrong child/binding produces the existing INTERRUPTED/RESULT_UNREADABLE path and no PASS receipt. A well-formed ordinary role FAIL produces its complete failure AGENT_RUN and FAIL receipt before the matching stop. Repair RESULT/receipt is legal only after section 7.4's proof artifact is atomically published and read back.

### 6.4 Purpose-bound shared Host launcher

`host-loop.mjs` exports exactly one new purpose-bound construction entry:

```text
createHostAgentLauncher({resultRoot,prepareResultRoot})
  -> launch_agent({action,route})
```

The construction object is closed with exactly those two fields. `resultRoot` is a primitive absolute normalized path (`path.resolve(resultRoot) === resultRoot`), is not `/`, contains no NUL or line break, and round-trips through UTF-8. It is trusted composition input, not a signed field or a value that socket, CLI, environment, Agent, or runtime output may override. `prepareResultRoot` is a function and the returned `launch_agent` is frozen. No filesystem, spawn, parser, artifact reader, inventory, clock, timer, timeout, receipt, proof, retry, or fallback field is accepted.

Each launcher call is closed as exactly `{action,route}`. The existing durable-route binding remains authoritative. For artifact naming only, `action.correlation_id` must be a non-empty primitive UTF-8-round-trippable path segment: it is neither `.` nor `..`, `path.basename(correlation_id) === correlation_id`, and it contains no `/`, backslash, NUL, or line break. The launcher requires:

```text
route.output_artifact_path === path.join(resultRoot, correlation_id + '.json')
path.dirname(route.output_artifact_path) === resultRoot
```

and rejects any normalized escape. It does not derive or repair route identity. The exact operation order before a child is observable is:

```text
closed call/root/correlation/output-path validation
-> capture one action deadline = monotonic now + 60 * 60 * 1000 ms
-> read/hash exact brief bytes
-> read/hash exact base/effective input bytes under sections 6.3 and 7.3
-> read/hash exact output-schema bytes
-> await prepareResultRoot({resultRoot})
-> require returned value === undefined
-> require realpath(resultRoot) === resultRoot and a real directory
-> lstat the exact output path: either ENOENT under that same physical parent, or an existing regular non-symlink whose realpath and physical parent are exact
-> spawn the configured route executable once
-> require a positive safe-integer PID
-> write exact stdin and expose {observed_child_id,completed}
```

Input/schema rejection therefore precedes directory preparation and spawn. After preparation and before spawn, an existing output path is admitted only when `lstat` reports a regular non-symlink, `realpath(output_artifact_path) === output_artifact_path`, and its physical parent equals the exact physical `resultRoot`; a nonexistent output path is admitted only when `lstat` reports ENOENT and its already checked parent is that same physical root. A preexisting symlink, non-regular file, changed/escaping parent, or other read error is `START_FAILED / SPAWN_REJECTED`, so the child is never started through a known unsafe artifact entry. The preparation callback receives only the frozen closed `{resultRoot}` value; it may complete or throw and may not return route, uid/gid, artifact, parser, identity, receipt, verdict, proof, or other business output. Production closes over trusted `config.runtime_gid` and supplies the unchanged preparation sequence:

```text
mkdir(AGENT_RESULT_ROOT,{recursive:true,mode:0770})
chown(AGENT_RESULT_ROOT,0,config.runtime_gid)
chmod(AGENT_RESULT_ROOT,0770)
```

Production then constructs the factory with the fixed `AGENT_RESULT_ROOT`; `createSameProcessRouteAuthority` continues to emit that same root in `output_artifact_path`, and `main` supplies the returned launcher to `createTrustedHostLoop`. There is no current-user fallback. Test may use a newly created current-user temporary root and a real local prepare function, with route uid/gid equal to the current user, but it runs the same artifact reads, argv/cwd/fixed environment, stdin, actual child/error/close, output parsing, Validator branch, inventory, Host Loop second artifact/inventory readback, and settlement implementation.

All process behavior after spawn remains shared. Stdout and stderr retain the existing aggregate 16 MiB bound. After the child closes and before any artifact parse or RESULT construction, the launcher repeats the exact expected artifact checks and requires all of: `realpath(output_artifact_path) === output_artifact_path`; `dirname(output_artifact_path) === resultRoot`; `dirname(realpath(output_artifact_path)) === realpath(resultRoot) === resultRoot`; and `lstat(output_artifact_path)` is a regular file rather than a symlink or other file kind. A missing file, changed link/parent, or normalized/physical escape at that point is an after-STARTED `RESULT_UNREADABLE`. The later Host Loop read/hash and inventory check uses that same exact expected path and repeats the identity/hash agreement before settlement; a replacement or mismatch remains `RESULT_UNREADABLE`. These pre-spawn and post-close checks close the known artifact entry and readback points; they add no lock, general safe-file abstraction, new file platform, or claim that an uncooperative external writer is impossible between checks.

The deadline captured before input reads is shared by pre-spawn work, the Agent child, and when applicable the sequential section 7.4 proof work; no phase or Agent close resets it. If it is exhausted before spawn, no child starts. Once a child exists, the single remaining-duration timer records `deadline_fired`, makes one `SIGTERM` request to the current child, and waits for actual close; it neither guarantees close nor adds escalation. For an ordinary launch, `deadline_fired` has precedence over the later close tuple and artifact: after real close it settles as existing `INTERRUPTED / AGENT_EXITED` even if a SIGTERM handler exits zero and the close event reports `signal:null`; the ordinary valid-output RESULT branch is then unreachable. The launcher records no alternate timer mode and accepts no clock hook.

The existing Host Loop maps failures by the first observable lifecycle frontier:

| Frontier | Exact existing settlement |
|---|---|
| invalid construction | synchronous `INPUT_INVALID`; no action or settlement |
| invalid launcher call/root/correlation/output path; artifact input/schema read/hash failure; deadline exhausted before spawn; preparation throw/non-undefined result/physical-root mismatch; pre-spawn existing/nonexistent output-path identity failure; synchronous spawn throw; invalid PID | `START_FAILED / SPAWN_REJECTED`; no STARTED or child receipt |
| durable route/reasoning unavailable before launcher | existing `START_FAILED / ROUTE_UNAVAILABLE` |
| child `error`, output artifact physical-path/read/hash/parse failure, Validator shape failure, inventory failure, or Host Loop second artifact/inventory mismatch after STARTED | `INTERRUPTED / RESULT_UNREADABLE` |
| ordinary child closes by signal without a fired deadline, or closes after `deadline_fired` regardless of reported code/signal/artifact | existing `INTERRUPTED / AGENT_EXITED` |
| ordinary child closes without signal or deadline and yields valid output | existing RESULT status/artifact/inventory flow; no new result enum |
| repair section 7.4 signal, fired deadline, wrong exit/TAP, or later proof failure after STARTED | specialized existing `INTERRUPTED / RESULT_UNREADABLE`; this repair rule takes precedence over the ordinary `AGENT_EXITED` row |

The real one-hour evidence is one separately invoked offline `TEST-M2-012/012-L06` leaf. Its fixture process records the actual received SIGTERM through a real OS-temporary file, stays alive until that request, handles SIGTERM, and may therefore exit zero with the close event reporting `signal:null`. The Test measures at least `3_600_000` monotonic milliseconds from launcher admission to the signal, proves settlement occurs only after close, and requires exact existing `INTERRUPTED / AGENT_EXITED` with no RESULT/PASS despite any valid-looking artifact. It uses no fake clock, shortened constant, direct timer callback, source scan, provider, production root, or privileged identity. A Test-runner watchdog or operator cleanup may stop a hung Test process for resource safety, but such a stop is Test management only and makes `012-L06` `NOT_VERIFIED`; it cannot count as the product SIGTERM/close result.

This evidence proves the shared local launcher and Host Loop behavior. Static production assembly proves only that `main` uses the same factory with fixed root/preparation. Neither proves deployed production execution, fixed-root ownership, uid/gid transition, OS isolation, real Codex/provider compatibility, or the A2-waived sealed-proof/K2 positive.

## 7. Validator Artifact and Settlement

### 7.1 Artifact schemas

`EvidenceRefV1` remains exactly `{kind,id,sha256,subject_sha}`.

`ValidatorFindingV1` is exactly:

```text
{
  finding_id,
  classification,
  requirement_ids,
  acceptance_ids,
  paths,
  summary,
  evidence_refs
}
```

`classification` is exactly one of:

```text
IMPLEMENTATION_IN_SCOPE
CONTRACT
ARCHITECTURE
SCOPE
PATH
DEPENDENCY
PERMISSION
HOST
IDENTITY
EVIDENCE
UNKNOWN
```

All strings are non-empty primitives. Primitive ID/path arrays are sorted uniquely by raw UTF-8 bytes; evidence-ref arrays are sorted uniquely by canonical-JSON UTF-8 bytes. Findings are sorted uniquely by `finding_id`; each note collection is sorted uniquely by `note_id`. Paths use the signed path grammar, and an `IMPLEMENTATION_IN_SCOPE` finding requires at least one path with every path inside allowed and outside forbidden scope. Requirement IDs, Acceptance IDs, and evidence refs are also non-empty for an eligible repair finding.

`ValidatorNoteV1` is exactly `{note_id,summary,evidence_refs}`. `ValidatorArtifactV1` is exactly:

```text
{
  schema_version:'1.0',
  change_id,
  candidate_sha,
  validator_head,
  verdict:'PASS'|'FAIL',
  findings:[ValidatorFindingV1],
  risks:[ValidatorNoteV1],
  unverified:[ValidatorNoteV1],
  open_questions:[ValidatorNoteV1]
}
```

PASS requires `findings:[]`; FAIL requires at least one finding. The three note arrays are always present and may be empty only because the artifact explicitly contains a validated empty array.

### 7.2 RESULT union

Ordinary non-Validator RESULT remains the accepted AgentSettlementBinding plus exactly:

```text
{stage:'RESULT',observed_child_id,status,artifact_path,artifact_sha256}
```

Validator RESULT adds exactly one field:

```text
{...,validator_artifact:ValidatorArtifactV1}
```

Repair Test RESULT is the only other branch and adds exactly one field to the ordinary shape:

```text
{...,repair_proof:RepairProofSummaryV1}
RepairProofSummaryV1 = {
  schema_version:'1.0',kind:'REPAIR_TEST_HOST_PROOF',
  execution_content_sha256,proof_receipt_sha256,
  test_files:[RepairTestFileIdentityV1]
}
```

It is legal only for the section 7.3 repair binding and is copied unchanged into its complete AGENT_RUN. No ordinary Test, Spec, Worker, or Validator settlement admits this field. This is the minimum durable summary needed for Coordinator to bind later Regression/STAGE content without an artifact-reading Gateway; the full proof bytes remain owned by the Host artifact.

The subsequent repair Worker RESULT is the only Worker extension and adds exactly one different field:

```text
{...,repair_delivery:RepairWorkerDeliveryV1}
RepairWorkerDeliveryV1 = {
  schema_version:'1.0',kind:'REPAIR_WORKER_DELIVERY',
  repair_proof:RepairProofBindingV1,
  post_worker_worktree_snapshot_sha256
}
```

Host accepts it only for the matching repair-Worker binding. Before Worker launch and again after its leader, pipes, and process group close, Host reads the protected proof artifact, revalidates its full bytes/hash/schema/receipt/summary, and requires every Worktree Test path/byte length/hash to match. Worker inventory delta is limited to its frozen production paths. Host then computes the actual post-Worker snapshot with the accepted WVEB collector/algorithm and emits that hash. Coordinator requires both repair Regression receipts and the still-running STAGE snapshot to equal `post_worker_worktree_snapshot_sha256`; this closes the handoff from proof Test A to delivered Test A without a new file-reading Gateway. A Test A-to-B substitution anywhere before those snapshots mismatches; later Regression-to-stage drift remains governed by section 5.

Before launch, the host resolves and hashes the existing content-addressed brief, input, and output-schema paths exactly as the accepted route requires and passes the same schema path to Codex. On child close it reads the actual output artifact bytes. Every ordinary non-Validator retains the existing `parsed.status` behavior and ordinary RESULT shape; repair Test and repair Worker use only the two explicit extensions above. For `juaner_validator` only, it requires canonical JSON bytes with the exact `ValidatorArtifactV1` shape and sets the completed status from `parsed.verdict` when exit code is zero; it does not look for a nonexistent `parsed.status`. A nonzero exit remains FAIL, and any unreadable, noncanonical, schema/hash/path/shape-invalid output is `RESULT_UNREADABLE`, not a controlled PASS.

Before sending settlement, the host re-reads the same actual artifact through its existing restricted artifact path, requires the same byte hash observed at child close, revalidates `ValidatorArtifactV1`, and adds the parsed object only to Validator RESULT. Coordinator requires all pending Agent binding fields including `output_schema_sha256`, canonicalizes the forwarded artifact, requires that byte hash equal `artifact_sha256`, repeats the closed artifact and Candidate/Head/verdict checks, and only then creates receipt/Ledger evidence. No controlled `completed.status`, request-derived Head, generic artifact Gateway, or ordinary non-Validator parsed RESULT can substitute for this path.

All of these ordinary and Validator child-close branches run inside section 6.4's one shared launcher. The factory changes only trusted root preparation reachability; it does not move artifact parsing, Validator validation, inventory, RESULT construction, or Host Loop re-read into a callback or a Test-only implementation.

### 7.3 Approved repair-Test derived evidence

`DECISION-M2-REPAIR-EVIDENCE-001` was explicitly approved in `m2-spec-repair-evidence-approval-001.md`. It adds only the repair-Test branch below. The signed `juaner_test` role input bytes and `input_sha256` remain immutable base authority; no derived object replaces that hash and no new content-addressed artifact is published.

The eligible source is exactly the attempt-zero Validator FAIL pair already read back from the canonical remote Ledger: one complete `AGENT_RUN/RESULT` carrying the validated artifact identity followed immediately by its complete `VALIDATION_RESULT` role receipt. `RepairTestDerivedEvidenceV1` is exactly:

```text
{
  schema_version:'1.0',
  kind:'REPAIR_TEST_DERIVED_EVIDENCE',
  change_id,
  candidate_sha,
  candidate_tree,
  authorization_cycle_command_id,
  source_execution_attempt:0,
  repair_execution_attempt:1,
  scope_sha256,
  validator_artifact_sha256,
  validator_receipt_sha256,
  validator_agent_result_event_ref:LedgerRefV1,
  validator_receipt_event_ref:LedgerRefV1,
  findings:[ValidatorFindingV1]
}
```

`scope_sha256` is SHA-256 of canonical JSON of exactly `{allowed_paths,forbidden_paths}` from the signed current DISPATCH authority. The Candidate fields equal current State/readback. The artifact hash, receipt hash, two refs, and findings equal the selected remote records and parsed artifact byte-for-byte; the refs resolve at one fixed tip and the receipt record is the immediate successor of the RESULT. `findings` is the complete non-empty sorted artifact array, not a subset or projection. Coordinator is the sole producer. It serializes the object as canonical JSON with no trailing LF and requires the derived bytes, complete base64-bearing binding, Action, Pending, and each corresponding canonical AGENT_RUN record to fit their existing byte bounds; it then computes:

```text
derived_input_sha256 = SHA256(derived_input_bytes)
derived_input_byte_length = derived_input_bytes.length
derived_input_bytes_base64 = canonical padded base64(derived_input_bytes)
```

`RepairEvidenceBindingV1` is exactly:

```text
{
  schema_version:'1.0',
  kind:'REPAIR_TEST_EVIDENCE',
  derived_input_sha256,
  derived_input_byte_length,
  derived_input_bytes_base64
}
```

The ordinary fourteen-field `AgentBindingV1` remains exact and unchanged. `RepairProofBindingV1` is exactly:

```text
{
  schema_version:'1.0',kind:'REPAIR_TEST_HOST_PROOF_REF',
  artifact_path,artifact_sha256,execution_content_sha256,
  proof_receipt_sha256,test_files:[RepairTestFileIdentityV1]
}
```

`AgentBindingM2V1` is the closed union of: the ordinary object; a repair-Test object containing those same fourteen fields plus exactly `repair_evidence:RepairEvidenceBindingV1`; or the sole subsequent repair-Worker object containing those same fourteen fields plus exactly `repair_proof:RepairProofBindingV1`. Repair Test is legal only for `role == agent == 'juaner_test'`, `phase:'TEST_RED'`; repair Worker only for `role == agent == 'juaner_worker'`, `phase:'WORKER_GREEN'`; both require current `auto_repair_attempt == 1` and `subject_sha == derived.candidate_sha`. Every other action forbids both nested fields. Coordinator derives the Worker proof binding only from the remotely read-back repair Test AGENT_RUN summary/path/hash and receipt; it does not read the artifact. The repair Test retains `input_sha256 == signed roles[].input_sha256`. Its correlation and idempotency IDs are deterministic hashes of exactly `{schema_version:'1.0',change_id,candidate_sha,authorization_cycle_command_id,repair_execution_attempt,derived_input_sha256,state_version}`, with distinct `repair-test-correlation-` and `repair-test-request-` prefixes. Repair Worker correlation/idempotency IDs use distinct `repair-worker-correlation-` and `repair-worker-request-` prefixes over SHA-256 of exactly `{schema_version:'1.0',change_id,candidate_sha,authorization_cycle_command_id,repair_execution_attempt,repair_proof_sha256:SHA256(canonical_json(repair_proof)),state_version}` where `state_version` is the State read back after the Test RESULT/receipt transition. Restart therefore rebuilds rather than substitutes the same Worker request.

The host resolves and reads the signed base bytes `B` from the existing content-addressed `input_sha256` path. It decodes `D` from the nested canonical base64 and requires canonical base64 round-trip, byte length/hash, exact UTF-8 canonical JSON reserialization, the closed derived schema, the current action identities, and exact finding order. It then constructs the only legal effective input bytes:

```text
H = UTF8('\n\n--- JUANERAI_REPAIR_TEST_EVIDENCE_V1 ' +
         decimal(D.length) + ' ' + SHA256(D) + ' ---\n')
E = B || H || D
child stdin = brief_bytes || UTF8('\n\n') || E
```

Decimal length is minimal base-10 with no sign or leading zero except `0`; `D` is non-empty. The signed base bytes are neither decoded, normalized, rewritten, nor separately republished. `input_sha256`, the exact derived bytes/hash, and this fixed framing uniquely determine `E`; there is no exposed `effective_input_sha256` and Coordinator never needs a base-byte reader. The host is the sole component that reads `B` and constructs the actual `E`. Ordinary Test stdin remains `brief || two LF || B` and cannot carry this header.

### 7.4 CCR002 purpose-bound mechanical repair proof

`DECISION-M2-REPAIR-RUNTIME-CONTENT-002` is approved for this design only. It adds one internal Host Loop operation after the repair Test Agent closes; it adds no public method, Gateway, Runtime, persistent State/event, recovery boundary, second Agent, monitor, or general validation service. Existing Agent JSONL and command/output history may remain diagnostic history but are excluded from causal admission and every proof hash.

#### 7.4.1 Two distinct artifacts and exact ownership

The one signed `juaner_test` `output_schema_sha256` is immutable across attempt 0 and attempt 1. Its content-addressed schema is `TestOutputArtifactM2V1`, the closed union of: the existing ordinary Test output branch unchanged; `RepairTestPlanArtifactV1`; or `RepairTestResultArtifactV1`. Attempt 0 and every non-repair Test admit only the ordinary branch. In attempt 1, the Agent may write only the plan branch to the existing exact path `/private/var/run/juanerai/agent-results/<correlation_id>.json`; only the Host may later produce the result branch at the protected path. No schema/hash is exchanged or republished when repair begins, and a producer/attempt using the wrong branch is `RESULT_UNREADABLE`.

```text
RepairTestPlanArtifactV1 = {
  schema_version:'1.0',kind:'REPAIR_TEST_PLAN_V1',
  status:'READY_FOR_MECHANICAL_PROOF',change_id,candidate_sha,candidate_tree,
  authorization_cycle_command_id,repair_execution_attempt:1,
  derived_input_sha256,
  test_files:[RepairTestFileIdentityV1],checks:[RepairCausalCheckV1]
}
RepairTestFileIdentityV1 = {path,byte_length,sha256}
RepairCausalCheckV1 = {
  finding_id,requirement_ids,acceptance_ids,
  test_path,test_file_sha256,red_test_id,control_test_id
}
```

The arrays are non-empty, closed, sorted uniquely under section 2, and contain exactly one check for every triggering finding and no other finding. Every requirement/AC array equals that finding's complete source binding; both test IDs are non-empty and globally unique; `test_path` resolves to exactly one listed file whose hash matches. Test files are precisely the final allowed Test paths changed relative to the immutable Candidate, are outside production and forbidden paths, and collectively equal the Host's complete post-close changed-path inventory. The Agent plan is a request for proof, not proof or PASS. An Agent-emitted proof branch, a plan whose `status` is PASS, or Agent-created content beneath the Host proof directory is `RESULT_UNREADABLE`.

The existing root-owned Host Loop is the sole producer of `RepairTestResultArtifactV1`. It never rewrites or relabels the Agent plan. After validating and embedding the plan's exact bytes, it publishes a separate root-owned file at `/private/var/run/juanerai/repair-proof-results/<correlation_id>.json`; only that path/hash enters repair RESULT `artifact_path/artifact_sha256`. `/private`, `/private/var`, `/private/var/run`, `/private/var/run/juanerai`, and `repair-proof-results` must each resolve without symlinks and be root-owned and non-writable by the runtime uid/gid; the final directory is `0750` and final file `0440`, group runtime. The Agent's `0770` result directory is never an ancestor of Host proof bytes. The final artifact is canonical JSON with no trailing LF and is exactly:

```text
RepairTestResultArtifactV1 = {
  schema_version:'1.0',kind:'REPAIR_TEST_RESULT_V1',status:'PASS',
  change_id,candidate_sha,candidate_tree,authorization_cycle_command_id,
  repair_execution_attempt:1,derived_input_sha256,execution_content_sha256,
  agent_plan_byte_length,agent_plan_sha256,agent_plan_bytes_base64,
  test_files:[RepairTestFileBytesV1],
  proof_environment:RepairProofEnvironmentV1,
  causal_red:[RepairCausalProofV1],proof_receipt_sha256
}
RepairTestFileBytesV1 = {path,byte_length,sha256,bytes_base64}
RepairProofEnvironmentV1 = {
  runtime_uid,runtime_gid,cwd,
  node_executable,node_executable_sha256,node_version,
  git_executable,git_executable_sha256,
  runtime_read_roots:[RepairRuntimeReadRootV1],
  sandbox_executable,sandbox_executable_sha256,
  environment
}
RepairCausalProofV1 = {
  finding_id,requirement_ids,acceptance_ids,test_path,test_file_sha256,
  red:RepairProofExecutionV1,control:RepairProofExecutionV1
}
RepairRuntimeReadRootV1 = {path,snapshot_sha256}
RepairProofExecutionV1 = {
  execution_kind,test_id,argv,environment,scratch_id,observed_child_id,
  execution_content_sha256,
  sandbox_profile_byte_length,sandbox_profile_sha256,sandbox_profile_bytes_base64,
  stdout_byte_length,stdout_sha256,stdout_bytes_base64,
  stderr_byte_length,stderr_sha256,stderr_bytes_base64,
  exit_code,signal,timed_out
}
```

All base64 is canonical padded base64 and round-trips to the declared complete bytes/hash/length. Proof-environment `environment` is exactly `{LANG:'C',LC_ALL:'C',TZ:'UTC'}`; each execution `environment` adds exactly its distinct absolute `TMPDIR`. `signal` is null or a primitive signal string, `exit_code` is null or an integer, and `timed_out` is boolean. `proof_receipt_sha256` hashes canonical JSON of the other fields. `artifact_sha256` hashes the complete final bytes including that receipt. The artifact remains within the existing 1 MiB artifact limit.

The trusted Host validates the complete artifact, atomically writes/re-reads its protected path, and emits the exact `RepairProofSummaryV1` copied from its contents. Coordinator does not read or pretend to parse the artifact: it checks the repair RESULT branch, binding, fixed protected-path grammar, artifact hash, and summary shape, copies the complete RESULT into AGENT_RUN, and derives the ordinary twelve-field Test receipt. The M2 privileged offline integration Test reads the actual root-owned Host artifact and independently recomputes its schema, bytes, hashes, receipt, summary, and executions; M3 later repeats protected-path readback on the deployed target. Handoff selects the complete AGENT_RUN/summary/path/hash plus receipt and neither projects nor re-signs the proof. Thus downstream durable evidence is the Host-validated summary plus the immutable artifact identity, not an unimplemented Coordinator file reader.

#### 7.4.2 Immutable execution content

Only after the Agent child and its output pipes have closed, the Host captures every planned Test file once with no-follow regular-file opens and matching pre/post descriptor metadata, exact bytes/hash/length, and complete inventory equality. It then builds one private randomly named proof root below `/private/var/run/juanerai/repair-proof/`, outside the signed Worktree and the Agent's writable roots. Using the configured pinned Git executable with the section 5 environment plus `GIT_NO_REPLACE_OBJECTS:'1'`, it reads `git ls-tree -r -z --full-tree <candidate_sha>` and each regular blob by object ID. It rejects symlinks, submodules, non-UTF-8/duplicate/escaping paths, more than 65,536 entries, more than 1 GiB total bytes, and any blob whose recomputed Git object identity, Candidate commit/tree, or section 7.3 identity differs. It materializes the complete Candidate tree with no `.git`, then overlays the captured Test bytes only.

The Host owns every proof-root directory/file. On an activated Host directories are root-owned `0550`, ordinary files root-owned `0440`, and Candidate executable files root-owned `0550`, all with the configured runtime group and no runtime/Agent write bit; every ancestor through `/private/var/run/juanerai` is root-owned and runtime-nonwritable. Before execution it requires each directory to be a real directory with the exact owner/group/mode, no symlink, and realpath containment, without constraining normal directory link count; each ordinary or Candidate executable file additionally requires `nlink === 1` to reject hard links while retaining the same owner/group/mode, no-symlink, and containment checks. The execution identity is:

```text
execution_content_sha256 = SHA256(canonical_json({
  schema_version:'1.0',candidate_sha,candidate_tree,
  test_files:[{path,byte_length,sha256}]
}))
```

The Candidate commit/tree is the content-addressed identity of every production byte in the sealed root; the final artifact carries every overlaid Test byte. A prior Agent command cannot affect this identity. An old Agent descendant may not write the root because it is outside the Agent sandbox and has no filesystem write permission; any failed sealing/readback is `RESULT_UNREADABLE`, not a weaker proof.

#### 7.4.3 One real sandboxed execution mechanism

The Host uses only fixed `/usr/bin/sandbox-exec` as this proof's OS isolation mechanism and the already root-owned absolute `node_executable` and `git_executable` from Host configuration. Before Agent STARTED it admits each only after realpath/regular-file/root-owner/non-runtime-writable checks, hashes its actual bytes, records Node version, validates the protected ancestor roots and runtime-read-root algorithm, and proves it can create the isolated process group; failure is existing `START_FAILED/ROUTE_UNAVAILABLE` with budget already consumed. After route admission, Host creates a distinct process group; after the leader and pipes close it requires the group to contain no descendant before reading the plan or beginning proof. The same preflight and no-descendant check applies to the later proof-bound Worker. A surviving member after STARTED yields `INTERRUPTED/RESULT_UNREADABLE` and no proof/Worker RESULT; there is no monitor or retrospective history claim.

This is a local-macOS, purpose-bound compatibility choice: `sandbox-exec`/SBPL is deprecated and not a documented third-party API, so mere profile construction is never M2 or activation evidence. The production contract still requires the exact executable/profile, root-owned inputs, runtime uid/gid, inherited-child restrictions, sealed-root read-only access, scratch-only writes, original-Worktree/proof-root write denial, and network denial. Under A2, the actual privileged preflight and dependent production proof/full K2 positive remain `USER_WAIVED / NOT_VERIFIED` and are not current TDD_READY or acceptance blockers; no fake owner, mock, early rejection, ordinary shared-launcher result, or M3 claim may relabel them PASS. M3 may later repeat these checks only under its separate explicit deployment authority and does not retroactively change the A2 record.

The profile is not left as a prose-selected or Mach-O dependency-discovery allowance. The only platform read closures are exactly `/System/Library` and `/usr/lib`, which cover dyld-cache system libraries even when the displayed load path has no regular file. For each configured executable outside `/usr/bin`, its one package root is mechanically `dirname(dirname(realpath(executable)))` and is admissible only when the executable is exactly `<root>/bin/<basename>`, the root and every ancestor are root-owned/runtime-nonwritable, and a no-symlink WVEB-style recursive file snapshot proves every entry root-owned/runtime-nonwritable. An executable in `/usr/bin` adds no package root. The sorted unique zero-to-two roots and their complete snapshot hashes are recorded as `runtime_read_roots`; no other dependency/config/user path is inferred. Host renders exactly this SBPL template, replacing angle-bracket tokens with JSON string escaping after rejecting controls/NUL/newline and emitting root clauses in raw UTF-8 byte order:

```text
(version 1)
(deny default)
(allow process-fork)
(allow signal (target self))
(allow sysctl-read)
(allow mach-lookup)
(allow file-read-metadata)
(allow file-read-data
  (subpath <SEALED_ROOT>)
  (subpath <SCRATCH>)
  (subpath "/System/Library")
  (subpath "/usr/lib")
  (subpath <RUNTIME_READ_ROOT_1>) ... (subpath <RUNTIME_READ_ROOT_N>))
(allow file-write* (subpath <SCRATCH>))
(allow process-exec (literal <NODE_EXECUTABLE>) (literal <GIT_EXECUTABLE>))
(deny network*)
```

Tokens are absolute realpaths without controls/NUL/newline, root clauses follow raw UTF-8 byte order, and each run's exact rendered profile is written root-owned `0440` below the protected proof root and enters that `RepairProofExecutionV1` as complete bytes/hash/length. No imported profile, wildcard file-data read, runtime-selected extra path, second isolation mechanism, or fallback is legal.

The Host creates a different empty private scratch directory for every RED and control run. It spawns, as the configured runtime uid/gid with `shell:false`, stdin ignored and stdout/stderr piped:

```text
/usr/bin/sandbox-exec -f <exact-host-owned-profile>
<configured-node-executable>
--test --test-isolation=none --test-reporter=tap
--test-name-pattern=<anchored escaped exact test_id>
<sealed-root>/<test_path>
```

The fixed profile denies by default and denies network; permits data reads only from the sealed root, scratch, the two fixed system closures, and the zero-to-two recorded executable package roots; permits process execution only for the exact configured Node and Git executables; and permits writes only below that run's scratch directory. The child cwd is the sealed root and receives exactly the environment recorded above, with no inherited `HOME`, `PATH`, `NODE_OPTIONS`, credentials, sockets, or original Worktree path. Bare-package/native-addon/untracked dependency lookup outside the sealed Candidate is forbidden; if an exact Test cannot run inside these frozen closures, the proof fails `RESULT_UNREADABLE` and any dependency expansion is `CONTRACT_CHANGE_REQUIRED`.

For each finding, fixed byte-order executes RED then control in separate scratch directories. The purpose-bound Host TAP parser requires the anchored RED ID to be the only selected non-skipped test, exit 1, null signal, no timeout, one `not ok`, and Node assertion/test-code-failure diagnostics; it requires the anchored control ID to be the only selected non-skipped test, exit 0, null signal, no timeout, and one `ok`. Syntax/import/hook/harness/infrastructure errors, another selected test, missing diagnostics, malformed/truncated TAP, or a declaration in the Agent plan cannot pass. Both executions carry the same `execution_content_sha256`, exact argv, complete output bytes, exit tuple, and observed PID in the Host artifact.

#### 7.4.4 Deadline, cleanup, and RESULT linearization

Section 6.4 captures the one-hour action deadline before its three artifact reads. Route admission, Agent launch, snapshot construction, all `2 * findings.length` proof children, parsing, cleanup, and publication consume that same deadline; closing the Agent does not reset it. All Agent/proof stdout plus stderr share the existing 16 MiB bound. On timeout or overflow the Host records the fired deadline, makes the existing single SIGTERM request to the current child, and waits for close; it gains no escalation or completion claim. A static route/capability failure before STARTED is `START_FAILED/ROUTE_UNAVAILABLE`; after STARTED, spawn error, any signal or fired deadline regardless of the eventual close tuple, wrong exit/TAP, content/inventory drift, sandbox denial, output/artifact bound, or late/wrong binding is the repair-specific `INTERRUPTED/RESULT_UNREADABLE`. That repair rule takes precedence over section 6.4's ordinary `AGENT_EXITED` rule and never yields proof PASS. The ordinary real-hour `012-L06` evidence proves only the shared deadline/SIGTERM/close behavior and does not stand in for a section 7.4 proof run.

After all children close, the Host removes and reads back absence of every scratch and sealed proof root, then removes and reads back absence of the raw Agent plan after retaining its exact bytes in memory. Cleanup failure forbids a final artifact and yields `INTERRUPTED/RESULT_UNREADABLE`; no RESULT, receipt, Worker, or recovery retry is synthesized. Only after successful cleanup does the Host atomically create/read back the root-owned proof artifact at the distinct protected Host path, validate all bytes/hashes/schema/binding again, and emit the repair RESULT plus summary. A failed atomic create/readback removes its protected temporary file and emits no RESULT. A settlement after timeout, wrong correlation, changed State/binding, or already-settled request remains rejected by the existing late-settlement rules. These temporary paths are not a fifth recovery boundary and are never resumed after Host/process restart.

### 7.5 Repair budget and publication order

The sole repair path is now:

1. append and remotely read back the complete attempt-zero Validator FAIL `AGENT_RUN/RESULT` and adjacent `VALIDATION_RESULT`;
2. at one canonical remote Ledger tip prove Head, scope, adjacency, eligibility, and section 7.3 source bytes, then derive and round-trip `D`;
3. atomically persist/read back `auto_repair_attempt:0 -> 1` with no other transition;
4. from the post-transition State version deterministically rebuild the same repair correlation/idempotency IDs and binding, append/read back repair Test REQUESTED, then persist/read back its Pending/Action;
5. launch exactly one Test Agent; accept only its complete plan; perform section 7.4's Host proof and compatible RESULT;
6. Coordinator verifies and remotely appends/reads back that complete attempt-one AGENT_RUN, `repair_proof` summary, protected Host artifact identity, and adjacent twelve-field Test receipt with the same repair binding;
7. request Worker only after those readbacks, carrying the exact `RepairProofBindingV1`. Host performs the pre/post Test-byte checks, requires the Worker's process group empty and inventory delta inside production scope, and returns `RepairWorkerDeliveryV1`. Both repair Regression receipts and the still-running STAGE comparison must equal its exact post-Worker WVEB snapshot hash; mismatch stops before stage/Candidate. Continue Candidate, Final Validation, Validator, publication, PR, and Handoff only from that identical Test content.

Ineligible, mixed, unknown, wrong-Head, wrong-scope, incomplete/noncanonical source evidence stops before step 3 and consumes no budget. Every failure, timeout, restart, cleanup problem, late result, or substitution at or after step 3 leaves the budget consumed and requests no Worker; restart reconstructs only already-published identities/readbacks and never resumes an unproven temporary proof execution. An attempt-one Validator FAIL remains `VALIDATOR_SECOND_FAIL / REVISION` with no reset. Durable failure/BLOCKED still requires normal failure/BLOCKED Ledger and BLOCKED State readbacks; unavailable Ledger preserves the prior phase plus exact local pause and claims no durable BLOCKED state.

The attempt-one Handoff must include the attempt-zero Validator FAIL source pair, complete findings, derived-evidence identity, Host proof AGENT_RUN/summary/artifact hash and Test receipt, then the complete attempt-one Worker/Regression/Retirement/Candidate/Final/Validator chain. The Candidate tree must contain the same Test file identities as the proof summary; old Agent logs or a post-proof A-to-B replacement cannot satisfy it. Missing or conflicting proof bytes/hash, Test identity, source refs, binding, or attempt identity forbids Handoff.

## 8. Ledger Record and Remote-byte Authority

### 8.1 Record

`LedgerRecordV1` remains exactly:

```text
{
  schema_version:'1.0',event_id,sequence,event_class,idempotency_id,
  change_id,occurred_at,state_version,subject_sha,detail,event_hash
}
```

`state_version` is the real state identity supporting the event. `subject_sha` is the actual Worktree Head, Candidate SHA, or command-bound current subject; it is never all-zero. `event_hash` hashes canonical JSON excluding only itself. One canonical record plus exactly one LF forms its bytes.

The seven exact detail variants are:

```text
CONTROLLER_COMMAND = {
  command_kind,command_id,body_sha256,signature_sha256,verified_key_id,
  receipt_digest,evidence_refs,
  admission:null|{command_id,body_sha256,idempotency_id},
  ready_state_sha256:null|sha256
}

AGENT_RUN = one accepted complete REQUESTED|STARTED|RESULT|START_FAILED|
            INTERRUPTED|NOT_STARTED detail; Validator RESULT carries
            validator_artifact

VALIDATION_RESULT = ValidationEvidenceReceiptV1

CANDIDATE_COMMITTED = {
  candidate_sha,parent,tree,branch,
  staged_paths,staged_paths_sha256,worktree_snapshot_sha256
}

BRANCH_PUSHED = {
  candidate_sha,prior_remote_head,remote_head,validator_head,
  freeze_status:'FROZEN'|'NOT_FROZEN'
}

HANDOFF_READY = {handoff_sha256,candidate_sha,pr_number,pr_head,delivery_id}

BLOCKED = {blocked_reason,next_action,evidence_refs}
```

Record-level `change_id`, `state_version`, `subject_sha`, and `idempotency_id` are not duplicated or replaced by detail placeholders. RESULT detail retains the entire Agent binding plus artifact identity, not a short `{role,status,hash}` projection.

### 8.2 Remote read

The request is exactly:

```text
{remote_ref:'refs/heads/evidence/agent-runs',expected_tip:null|git_sha,change_id}
```

`LedgerRemoteReadReceiptV2` is exactly:

```text
{
  remote_ref,expected_tip,tip,tip_parent,tip_tree,authoritative_path,
  file_present,ledger_bytes_base64,prior_bytes_sha256,prior_byte_length,
  last_event_id,last_event_hash,last_sequence
}
```

`ledger_bytes_base64` is canonical padded base64 of the exact remote path bytes at `tip`. Decoding must round-trip to the identical base64, length/hash must match, and parsed record bytes must reserialize exactly. `file_present` is true iff the path exists; an existing empty path is invalid. An absent path has empty bytes/hash/length and null last identity. The uncontracted implementation field name `prior_bytes_base64` is forbidden after this delta.

`readRemoteAppend` retains the accepted remote ref/commit/tree/path/offset/length/hash receipt, but `record_bytes_sha256` SHALL hash exactly the appended record slice, not the whole Ledger file. Coordinator verifies that slice against `ledger_bytes_base64` before consuming the event.

The production Ledger Adapter is the sole producer of physical Git-object truth for both remote-read forms. Core independently verifies the closed receipt, ref/tip/tree/path, base64/bytes, lengths/hashes, JSONL, exact slices/refs, and current State/delivery consistency; it does not manufacture a second trust source. R109 closes production-proof reachability with one user-approved object reader in the existing Adapter file, without exposing the private transport/credential factory.

`production.mjs` exports exactly:

```text
createLedgerObjectReader({repositoryRoot,gitExecutable,runtime_uid,runtime_gid})
  -> frozen { read }

read({remote_ref,expected_tip,tip,tip_tree,change_id})
  -> GatewayResultV1<LedgerRemoteReadReceiptV2>
```

The constructor object is closed to those four fields. `repositoryRoot` and `gitExecutable` are primitive UTF-8-round-trippable normalized absolute paths with no NUL or line break; `repositoryRoot` is not the filesystem root and `gitExecutable` is exactly the existing `PINNED_PRODUCTION_GIT_PATH`. Both runtime identities are nonnegative safe integers. When the constructing process is not root, they must equal that process's actual uid and gid, so an ordinary Test cannot claim a root or other identity; the root production composition may pass only the already-validated configured runtime uid/gid. The constructor accepts no key, URL, ref, path, argv, environment, transport, spawn/process, filesystem, clock/timer, byte/result/receipt producer, parser, verifier, callback, cache, retry, State, or Ledger authority field. Invalid construction throws existing `INPUT_INVALID` before a read exists. The returned object is frozen and has exactly the `read` method.

The read object is closed to its five displayed fields. `remote_ref` is exactly `refs/heads/evidence/agent-runs`; `change_id` satisfies the existing safe grammar; `expected_tip` is null or a lowercase nonzero full 40-hex SHA; and `tip`/`tip_tree` are either both null or both lowercase nonzero full 40-hex SHAs. Short IDs, ref expressions, branches, caller-supplied path/bytes, zero OIDs, mixed nullability, accessors, symbols, or extras are `INPUT_INVALID` before Git. `expected_tip` remains an echoed expectation and is not promoted to the observed tip. `authoritative_path` is never input and is derived only as `ledger/<change_id>.jsonl`.

When `tip === tip_tree === null`, `read` executes no Git command and returns existing `OK` with `tip_parent:null`, `file_present:false`, canonical base64 of empty bytes, SHA-256/length of empty bytes, and null/null/zero last-record identity. This represents only the caller's already-observed empty remote result; the reader does not query or prove remote-ref absence.

For a non-null pair, `tip_tree` is an untrusted claim. `read` invokes the pinned executable with `shell:false`, the exact `exactGitEnvironment()` including `GIT_NO_REPLACE_OBJECTS:'1'`, the closed constructor cwd/uid/gid, the existing 60,000 ms per-process timer, and the existing combined stdout-plus-stderr limit of 1,048,576 bytes. Every successful command requires code zero, null signal, empty stderr, output within the bound, and actual close. The sequence and argv are fixed:

```text
git cat-file -t <tip>
git cat-file commit <tip>
git --literal-pathspecs ls-tree -z --full-tree <actual_tree> -- ledger/<change_id>.jsonl
git cat-file blob <blob_sha>  # only when the exact path entry exists
```

The first stdout must be exactly `commit\n`. The second is treated as raw commit bytes, not general text or a reusable parser API: it must contain one complete header/body separator, exactly one first top-level `tree <lowercase nonzero 40-hex>` header, only valid lowercase nonzero 40-hex `parent` headers distinct from the commit SHA when any are present, no duplicate tree or malformed/all-zero/self parent, plus the existing valid author and committer headers. Zero parent headers yields `tip_parent:null`; when one or more parent headers exist, `tip_parent` is the first physical parent under the existing nonroot/merge read semantics. This reader adds no new merge policy or parents collection. The physically read `actual_tree` must equal the full `tip_tree` claim before any path lookup. No current Head, movable ref, graph-only parent/tree query, prefix, replacement object, or caller claim may substitute.

The literal `ls-tree` stdout is either zero bytes, proving only that this path is absent from the proven tree, or exactly one NUL-terminated record `100644 SP blob SP <lowercase nonzero 40-hex> TAB <exact authoritative path> NUL`. Any other mode, type, object, path bytes, duplicate/trailing record, quoting, malformed framing, or output is a proven mismatch. Path absence returns `file_present:false` while retaining the non-null proven tip/parent/tree and the same empty-byte/hash/last-record representation; it is distinct from the null-tip case. For a present entry, the final command's stdout is the exact blob bytes. A present zero-byte blob is not path absence and is a mismatch. Present bytes must be non-empty, within the existing bound, end in exactly one LF-framed final record, contain no BOM/CR/blank record, round-trip as UTF-8 for the final record, and yield a final JSON object whose `event_id` is an existing non-empty primitive string, whose `event_hash` is a lowercase full 64-hex string, and whose `sequence` is a positive safe integer; these become the receipt's last-record fields. This minimum producer parsing derives the existing receipt and does not replace Core's independent validation of every canonical Ledger record, hash, sequence, schema, slice, reference, or current-delivery fact.

If successful Git output proves a wrong object type, malformed physical commit/tree/path/blob contract, wrong claimed tree, existing empty path, or invalid final-record framing/identity, `read` returns exactly `{kind:'CONFLICT',reason:'READBACK_MISMATCH',observed_identity}` without an `OK` value or receipt hash. `observed_identity` is the proven `actual_tree` once safely known, otherwise null; the public closed conflict contract permits no object or other shape. A spawn/error/nonzero/signal/stderr/timeout/output-overflow result, missing/unreadable local object, failure before the corresponding physical fact is proven, or other unavailable observation returns exactly `{kind:'UNAVAILABLE',reason:'PROCESS_FAILED',partial_receipt:null}`. It never becomes path absence, a fabricated root parent, or conflict inferred from uncertainty. No failure falls back to an earlier success or a second command path.

Only success constructs the existing thirteen-field `LedgerRemoteReadReceiptV2` from the fixed objects: request ref/expected tip, actual tip/parent/tree, derived path, actual presence, canonical padded base64 of the exact copied blob bytes, exact SHA-256/byte length, and last-record identity. The existing `ok` algorithm hashes canonical JSON of that complete value. The reader is stateless and performs no Git/ref/index/worktree/file/State/Ledger/local-pause/PR/Handoff/Agent write.

The private `createLedgerGateway` constructs this same reader once from its existing repository root, pinned Git, and configured runtime identities. Its public `readRemote({remote_ref,expected_tip,change_id})` retains exact input admission, first invalidates any prior in-memory prepared-read binding, then performs the unchanged root-owned `0640` authority-file check and protected root-group `ls-remote`. A null advertised tip is passed as the null pair. A non-null advertised tip must be a full nonzero SHA and is followed by the existing fixed local `git rev-parse <tip>^{tree}` observation under the configured runtime identity; process failure is `UNAVAILABLE/PROCESS_FAILED`. `readRemote` then passes only that fixed tip/tree and its original request fields to `reader.read`. Only reader `OK` becomes the public result and updates `lastRemoteRead`; conflict/unavailable returns unchanged and leaves no stale read eligible for `prepareAppend`. `readRemoteAppend` continues to call this same verified `readRemote`, then applies the unchanged prepared/expected-commit/event/record-slice checks. Authority-file ownership/mode/ancestor rules, SSH/host-key/ref/network policy, root-group transport identity, private append factory, fixed composition, and all write/readback recovery rules remain intact. Production and Test therefore share the real object proof, while only production owns protected remote observation and credentials.

Original `TEST-M2-010 / 010-L13` remains the exact producer-negative owner. It creates real commit A containing a valid non-empty authoritative Ledger blob and a separately real, existing tree B unequal to A's physical tree. An independent pinned-Git oracle fixes A's commit/tree/path/blob bytes. The Test passes `tip:A` with the untrusted claim `tip_tree:B` to the shared reader, requires its actual `CONFLICT/READBACK_MISMATCH` with `observed_identity` equal A's real tree, and forwards that exact returned failure—not a reconstructed or post-`OK` mutation—at the existing controlled Test-owned remote observation into the otherwise healthy public Core prefix. Core must then keep the original State, permit only its existing read-back manual diagnostic, make no Handoff call, append no `HANDOFF_READY`, perform no successful State/delivery progress, and not recreate the already-read PR. A separate shared-reader positive proves A/tree A/path/blob and every receipt byte/hash/type; separate controls distinguish null tip, real path absence, and existing empty file. The existing Test-owned Ledger cases retain Core-only wrong path/base64/byte/hash/slice/ref/current-delivery rejection. Random/nonexistent tree, format-only input, source scan, constant failure, Test-constructed conflict, final-OK mutation, three independent PASS fragments, privileged/real remote composition, or A2 cannot satisfy this leaf.

### 8.3 Ledger references

`LedgerRefV1` is exactly:

```text
{
  remote_ref,tip,tip_tree,authoritative_path,
  event_id,event_hash,sequence,record_offset,record_length,record_bytes_sha256
}
```

At Handoff preparation all refs use one fixed latest pre-Handoff remote tip/tree/path. Each offset/length slice must be one exact canonical record ending in LF and match event ID/hash/sequence. The later HANDOFF_READY event is intentionally absent from Handoff refs.

## 9. Candidate References and Handoff Evidence Selection

`CandidateValidationRefV1` is exactly:

```text
{
  event_id,event_hash,validation_id,validation_kind,
  receipt_sha256,subject_sha,candidate_sha,validator_head
}
```

Its only legal order is current-Candidate `FINAL_VALIDATION` then current-Candidate `VALIDATOR`. For Final Validation, `validator_head` is null; for Validator it equals Candidate. Regression and pre-Candidate Agent evidence never enter this State array.

### 9.1 Cycle, attempt, and role reconstruction from existing records

Coordinator selects no evidence by array position in a request, latest PASS, validation ID alone, subject alone, or locally constructed receipt. From the one canonical remote Ledger byte stream at the fixed pre-Handoff tip it performs this deterministic scan:

1. Find exactly one `CONTROLLER_COMMAND` whose detail `command_id` equals current State `authorization_cycle.command_id` and whose command kind equals that State's `DISPATCH` or `REVISION`. That record starts the current authorization cycle. A later DISPATCH/REVISION starts another cycle and therefore makes the older segment ineligible; the current cycle is the segment beginning at the last matching authorization command and ending at the fixed tip. RESUME/RELEASE records never start an execution attempt or reset its number.
2. Validate every intervening record's canonical bytes, sequence, event hash, Change ID, state version, subject, and idempotency before interpreting it. Unknown, malformed, noncontiguous, cross-Change, or contradictory records fail the whole selection.
3. Within the current cycle, attempt 0 begins at its first valid Test RED Agent REQUESTED record. DISPATCH may have its preceding Spec Agent chain; REVISION begins at Test RED. The required completion order is Test RED role pair, Worker GREEN role pair, affected Regression receipt, Retirement receipt, Candidate commit, Final Validation receipt, and Validator role pair. No role slot may be supplied by a record outside this order.
4. For Test, Worker, and Validator, group REQUESTED, STARTED, and RESULT by equality of every field of the selected `AgentBindingM2V1` branch, including correlation, idempotency, and the complete repair-only nested evidence/proof when present. The next same-Change Ledger record after RESULT must be exactly one twelve-field `VALIDATION_RESULT` whose `validation_id` equals correlation, `idempotency_id` equals binding idempotency, `command_definition_sha256` equals the canonical complete binding hash, subject/kind/scope/status/verdict agree, and receipt hash recomputes. The RESULT artifact path/hash and this receipt are jointly retained; the receipt does not independently contain or replace the artifact hash. Attempt-one repair Test additionally requires its Host `repair_proof` summary/path/hash and attempt-zero source refs; repair Worker requires the identical nested proof plus `repair_delivery`. No repair record is admissible without those exact branches and readbacks.
5. Each execution validation occupies its fixed slot by exact kind/scope/definition ID, twenty-four fields, subject, Candidate nullability, idempotency, receipt hash, and sequence. The immediately preceding/following lifecycle facts must place both Regressions before the Candidate event and Final Validation after it. Fixed validation IDs reused in another cycle or attempt do not match this slot by ID alone.
6. A Validator PASS ends the only attempt. One eligible attempt-zero Validator FAIL closes attempt 0; after section 7.3 source proof, the post-transition identity and section 7.4 Host proof govern the sole Test RED request in attempt 1. Attempt 1 repeats all six evidence roles against the new chain and ends in Validator PASS; a second attempt marker, missing repeat, out-of-order role, missing Host proof, or attempt-one FAIL cannot form Handoff evidence.

Exact replay converges only on the same event ID/hash/record bytes and does not add a duplicate slot. Two non-identical records for one slot, even with the same subject, validation ID, correlation, or PASS value, are conflicting. Records from prior authorization cycles, prior failed Candidates, or another Change remain in Ledger but are never silently promoted into the current successful slot. The attempt-zero failed Validator is retained only when it is the causal predecessor of the one approved repair attempt.

### 9.2 Fresh-Core delivery reauthentication

This is a narrow reauthentication at the existing post-Freeze recovery point, not a fifth boundary or general restart facility. It is available only for the active Change in `DELIVERING / PR` or `DELIVERING / HANDOFF`, with a frozen Candidate and complete existing delivery fields. The caller uses the unchanged public entry:

```text
applyControllerCommand({command_body_bytes,signature_bytes})
```

Those are the caller-retained original complete signed `DISPATCH` bytes/signature. Coordinator repeats canonical-body, signature/key, schema, nonce/idempotency, Change/repository/worktree/scope, and `expires_at` validation. It refuses reauthentication when an existing local-pause diagnostic is non-null; C3 cannot be bypassed by reauthentication followed by `run`, and refusal leaves the diagnostic byte-identical. It then reads pointer/State and performs one fresh authoritative Ledger read under section 8.2, fixing that returned tip/tree/path/bytes for this reauthentication; it does not require or write `State.evidence.remote_tip`. From those fixed bytes it proves: (1) pointer, Change/repository, `State.admission`, and supplied DISPATCH match exactly; (2) the exact original DISPATCH `CONTROLLER_COMMAND` matches command/body/signature/key/admission; (3) the last valid DISPATCH-or-REVISION `CONTROLLER_COMMAND` in the fixed fresh byte stream is exactly the record named by `State.authorization_cycle.{command_id,command_kind}`, its complete body/signature/key/receipt/evidence identities, record hash, and contiguous sequence position validate, and there is no later conflicting authorization-cycle command through that fixed tip; and (4) State/cycle, Candidate, delivery, fixed remote evidence, and PR-or-HANDOFF phase agree. For a current REVISION cycle, the still-valid signed original DISPATCH reestablishes admission/scope authority, while that exact last remotely durable verified REVISION record—not an arbitrary matching marker or caller-supplied hash—proves current-cycle provenance; no resubmitted REVISION is accepted or required by this narrow path. Old Core memory and hash-only material are never authority.

Success returns existing outcome `ALREADY_APPLIED` for the original DISPATCH over the unchanged current Base State: result macro-state, `state_version`, and `state_hash` equal the exact current State, and payload is `{idempotency_id:<original DISPATCH idempotency_id>,original_receipt_sha256:<full SHA-256 of the verified canonical original DISPATCH body bytes>}`. It restores only ephemeral Core authorization material needed by a later `run`. Reauthentication writes no pointer, State, Ledger, local pause, cache, file, branch, PR, Handoff, event, cycle, Agent record, or delivery effect. It does not run a phase; the caller later invokes normal `run` with current State version/hash, retaining all CAS, identity, ambiguity, and recovery rules.

Malformed input remains `INPUT_INVALID`; invalid signature/key remains the existing signature error; expired material remains `COMMAND_EXPIRED`; reused identity with different bytes remains `COMMAND_REPLAY_CONFLICT`; wrong Change/phase/State/admission/cycle or unavailable, missing, ambiguous, or conflicting Ledger proof returns `STATE_CONFLICT`. Every failure is a pre-effect `CoordinatorErrorV1` with zero writes/effects. No replacement authorization, refreshed expiry, new event, or automatic resume is permitted.

Every event reference below is constructed only by slicing the already-validated remote bytes at the fixed tip; its offset/length/hash must resolve back to the selected record. This prevents a locally well-shaped object from substituting for remote evidence.

`HandoffValidationEvidenceV1` is exactly:

```text
{
  authorization_cycle_command_id,
  execution_attempt:0|1,
  evidence_role:'TEST_RED'|'WORKER_GREEN'|'REGRESSION_AFFECTED_SUITE'|
                'REGRESSION_TEST_ASSET_RETIREMENT'|'FINAL_VALIDATION'|'VALIDATOR',
  subject_sha,
  candidate_sha:null|git_sha,
  agent_result_event_ref:null|LedgerRefV1,
  receipt_event_ref:LedgerRefV1,
  receipt:ValidationEvidenceReceiptV1
}
```

Selection order is execution attempt then the six-role order shown. Attempt zero is the initial execution under the signed authorization cycle. Without repair, Handoff includes the six successful current-chain entries. For the approved repair contract, attempt one is the only repair and Handoff includes all six attempt-zero facts through the failed Validator and all six attempt-one facts through PASS, including the Host proof-backed Test slot. The failed Validator remains `verdict:FAIL`, retains both remote event refs and the prior Candidate, and is never relabeled or used as final authority. No attempt-one record or repair Handoff is admissible before the specified proof/result/receipt remote readbacks.

Each `evidence_role` maps exactly to the same-named kind/scope branch: Test RED to `TEST_RED/ACCEPTANCE_CRITERION`, Worker GREEN to `WORKER_GREEN/WORKER_OUTPUT`, affected Regression to `REGRESSION/AFFECTED_SUITE`, Retirement to `REGRESSION/TEST_ASSET_RETIREMENT`, Final Validation to `FINAL_VALIDATION/CANDIDATE`, and Validator to `VALIDATOR/VALIDATOR_REVIEW`. Wrapper `subject_sha` and `candidate_sha` equal the enclosed receipt fields. Thus Candidate is null for the first four roles and exact for Final Validation and Validator.

For Test/Worker/Validator, `agent_result_event_ref` points to the corresponding complete `AGENT_RUN/RESULT` and `receipt_event_ref` points to the exact `VALIDATION_RESULT`; the role receipt is mechanically bound to the AgentBinding and artifact identity proven by those two records. Repair Test additionally requires the complete `repair_proof` summary and protected Host artifact identity in that RESULT, with exact Test identities matched by repair Regression/STAGE and the final Candidate tree. For execution validations `agent_result_event_ref` is null and `receipt_event_ref` points to the exact `VALIDATION_RESULT`. Missing AGENT_RUN, artifact identity, output-schema identity, repair summary, receipt event, or cross-binding is a failure. `ledger_refs` in Handoff is the sorted unique union of every non-null event ref in this collection, so neither half of role evidence is silently dropped.

## 10. Canonical Diff, Delivery Identity, PR, and Handoff

### 10.1 Canonical diff with paths

`CanonicalDiffResultV2` is exactly:

```text
{
  producer_receipt:CanonicalDiffProducerReceiptV2,
  raw_stdout,
  byte_length,
  stdout_sha256,
  path_raw_stdout,
  path_byte_length,
  changed_paths
}
```

`raw_stdout` retains the accepted exact Node `Buffer` byte value; `path_raw_stdout` uses the same minimum byte representation for the complete NUL-delimited stdout. Neither is decoded text, base64 at the result boundary, a generic typed array, a numeric-key object, or a coercible/`toJSON` projection. `byte_length` and `path_byte_length` are nonnegative safe integers equal to the respective Buffer lengths; `stdout_sha256` and `path_stdout_sha256` are SHA-256 of the complete respective bytes.

Because canonical JSON has no native byte value, the successful `GatewayResultV1.receipt_sha256` uses one explicit byte-normalized preimage. After the Adapter has the two actual Buffers and the closed producer/path values, it constructs a fresh seven-key value with the same keys as `CanonicalDiffResultV2`, but replaces only `raw_stdout` and `path_raw_stdout` with their canonical padded-base64 encodings; every other verified value is copied unchanged. The receipt is SHA-256 of canonical JSON of that fresh value. Core independently copies the two own data-descriptor Buffer values, derives the same two base64 strings with the standard encoder, constructs the same fresh preimage, and recomputes the receipt. Neither side canonicalizes a runtime Buffer, invokes its `toJSON`, reads an accessor, or accepts a caller-supplied base64 spelling. The preimage therefore binds every byte and all seven result fields without changing the accepted raw-Buffer contract. This supplement adds no independent size threshold: the existing canonical-diff process/output boundary remains authoritative.

The raw diff argv/environment/stdout contract remains `JUANERAI_GIT_DIFF_V1`. `CanonicalDiffProducerReceiptV2` retains every accepted V1 field and adds exactly:

```text
path_argv
path_stdout_sha256
```

`path_argv` is exactly the following argument array, using the same pinned executable, section 5.1 environment, `shell:false`, cwd, common-dir, baseline, Candidate, and safety checks as the raw producer:

```text
[
  '--no-pager',
  '-c','color.ui=false',
  '-c','core.quotePath=true',
  '-c','diff.algorithm=myers',
  '-c','diff.mnemonicPrefix=false',
  '-c','diff.noprefix=false',
  'diff','--name-status','-z','--no-ext-diff','--no-textconv','--no-renames',
  '<baseline_sha>..<candidate_sha>','--'
]
```

The two placeholders are substituted only with the already-admitted exact SHAs; no caller supplies argv. The raw patch command and path command each execute once within one Gateway call. Exit must be successful and stderr empty under the existing producer rules before a result exists. The path byte grammar is either the empty byte string, representing no records, or the exact repetition `ASCII(status) NUL path_bytes NUL`, where `status` is exactly one byte `A`, `M`, `D`, or `T`. A nonempty stream not ending in NUL, an odd token count, an empty status or path token, a multi-byte/unknown status, embedded NUL within a token, invalid UTF-8, non-round-tripping path bytes, or an unsafe/noncanonical path fails before `OK`. Each decoded path follows section 2's repository-relative path rule; duplicate path bytes fail even when paired with different statuses. Core first uses own data descriptors to qualify the closed Gateway envelope, seven-field value, producer receipt, arrays, primitive scalar types, and the two exact Buffers without invoking attacker-controlled getters, coercion, or serialization hooks. It copies the Buffer bytes before use. Independently of the Adapter's parse, it then recomputes `path_byte_length` and `path_stdout_sha256` from `path_raw_stdout`, parses every status/path record, sorts the complete decoded paths uniquely by raw UTF-8 bytes, and requires exact element-for-element equality with `changed_paths`. It likewise recomputes `byte_length` and `stdout_sha256` from `raw_stdout`, then recomputes the explicit byte-normalized Gateway receipt before consuming identity. An empty healthy command result uses two zero-length Buffers, both zero lengths, SHA-256 of the empty byte string for both streams, and `changed_paths:[]`; the later Candidate/publication nonzero-content rules remain separate and unchanged. `raw_stdout` continues to represent the unnormalized binary patch bytes from the unchanged canonical-diff argv.

Freeze and Handoff each call this Gateway exactly once, so the complete successful chain has exactly two cumulative observations and no patch-to-name-status parser or extra read. Each observation first passes the full internal byte/hash/path checks above. The Freeze observation is then checked against current baseline/Candidate/tree/branch/remote/Validator identity and its raw `stdout_sha256` is stored in the existing `DeliveryV1.canonical_diff_sha256`; its `changed_paths` participates in the unchanged section 10.2 delivery preimage, and the resulting pre-PR `delivery_id`/`idempotency_id` is persisted through the existing Delivery/PR path. Candidate gains no path field and Delivery gains no byte, length, path-hash, or path-list field.

At Handoff, the second observation must use the same exact request identities and fixed producer contract, pass the same internal checks, have `stdout_sha256 === state.delivery.canonical_diff_sha256`, and reproduce the existing delivery preimage from its own `changed_paths`; the recomputed full `delivery_id` must equal the already persisted `delivery_id`, which is also the required idempotency identity, before Handoff construction. A Test observer that receives both Gateway completions in one uninterrupted process compares the two complete values field-for-field, including exact Buffer bytes, both lengths, both full hashes, producer receipt, paths, and the explicit receipt preimage result; production Core does not add a cache or retain that first result as authority. After a fresh-Core restart, process memory is not evidence: Core reconstructs the second result from the same immutable baseline/Candidate objects and fixed executable/version/environment/argv/repository identities, then performs the persisted raw-hash and delivery-ID comparisons just stated. This proves the current reconstruction and its binding to the frozen immutable objects; it does not claim that the earlier path bytes, length, hash, receipt, or full result were durably stored. Requiring direct comparison with such a persisted earlier path receipt would need a new durable field or changed delivery preimage and is outside this supplement.

Adapter output/framing failure produces no `OK` and follows the existing Gateway-failure disposition. Any otherwise-successful Freeze envelope that fails Core verification enters existing `CANDIDATE_IDENTITY_CONFLICT / MANUAL_CONTROLLER_STOP`. At the second canonical-diff read, an internally invalid result or a valid result whose bytes/hash/paths recompute a different frozen delivery identity is contradictory evidence and enters existing `EVIDENCE_CONFLICT / MANUAL_CONTROLLER_STOP`, with exactly two diff reads and no Handoff gateway call; this retains `009-L10`. Only an actual PR query/create/readback ambiguity or mismatch, or an actual Handoff gateway/write/readback ambiguity or mismatch after its inputs pass, enters existing `FINAL_HANDOFF_PR_AMBIGUOUS / MANUAL_CONTROLLER_STOP`; this retains `010-L01` and the existing section 11 mapping. Neither path invokes a later effect beyond authority already read back at that phase.

### 10.2 Delivery identity

After remote Candidate Head and Validator Head equal the local Candidate and the cumulative diff is read back, derive:

```text
delivery_preimage = {
  schema_version:'1.0',
  change_id,
  authorization_cycle_command_id,
  baseline_sha,
  candidate_sha,
  candidate_tree,
  branch,
  remote_head,
  canonical_diff_sha256,
  changed_paths
}

delivery_id = 'delivery-' + SHA256(canonical_json(delivery_preimage))
idempotency_id = delivery_id
```

Both are known before PR. Neither depends on PR number, Handoff bytes/hash, HANDOFF_READY, clock, or a generated replacement.

PR `createOrReuse` request is exactly the accepted five fields including `idempotency_id`; query/readback must converge on one current PR with base main, exact branch/Candidate Head, and review-ready state. Multiple/mismatched PRs exhaust the final boundary.

### 10.3 Handoff

`HandoffV1` is exactly:

```text
{
  schema_version:'1.0',change_id,baseline_sha,candidate_sha,candidate_tree,
  branch,remote_head,changed_paths,canonical_diff_sha256,
  canonical_diff_contract_id:'JUANERAI_GIT_DIFF_V1',
  validation_receipts,validator_verdict,validator_head,ledger_refs,
  pull_request:{number,url,base:'main',head_branch,head_sha},
  delivery_id,idempotency_id,risks,unverified,open_questions
}
```

`production.mjs` exports its existing `createHandoffGateway(stateRoot)` directly; it is not copied, wrapped in a generic filesystem service, or moved to a new module. `stateRoot` is one trusted primitive absolute normalized path. The returned frozen object has only `writeReadback`. Production `createProductionComposition({})` remains closed to the empty object, reads the fixed Host configuration, and passes only `config.state_root`; Test may pass a newly created current-user temporary state root. No trust/configuration object, filesystem/rename/readback callback, clock, retry, lock, journal, ID generator, or receipt producer is injectable.

The exact `writeReadback` request remains the closed `{expected_sha256,handoff_bytes}`. Before any write, the gateway performs only the minimum checks owned by this file boundary: `expected_sha256` is lowercase full 64-hex; `handoff_bytes` are non-empty canonical JSON bytes within the existing control-byte bound; `SHA256(handoff_bytes) === expected_sha256`; decoded `change_id` satisfies the exact safe Change ID grammar; and primitive `delivery_id === idempotency_id` matches the section 10.2 delivery format `^delivery-[0-9a-f]{64}$`. Complete `HandoffV1` field/union validation, Ledger-ref selection, evidence/Candidate/PR agreement, and note-array authority remain Core responsibility before the gateway call and are not moved or duplicated here. The only target is:

```text
path.join(stateRoot,'changes',handoff.change_id,'handoff.json')
```

with normalized parent containment under `stateRoot`. It invokes the same `atomicWrite`: prepare the parent, write one mode-0600 temporary file, fsync and close it, rename it to the target, fsync and close the parent directory, read the target, and require byte equality. Only then may it return the existing exact `GatewayResultV1`:

```text
OK {
  value:{handoff_sha256:SHA256(actual_reread_bytes),delivery_id:handoff.delivery_id},
  receipt_sha256:SHA256(canonical_json(value))
}
```

There is no missing-ID fallback to file hash. Closed-input, canonical/hash, Change/path, or ID mismatch throws `INPUT_INVALID` before a successful write. A filesystem, fsync, rename, or readback failure propagates as a gateway failure; it cannot synthesize `OK`, `HANDOFF_READY`, or later State. Coordinator applies the existing final-Handoff evidence/ambiguity disposition. The existing fourth readback boundary may converge only by the already specified same-identity readback; this export adds no file retry, lock, journal, crash-durability claim, fifth recovery boundary, or concurrent-writer protocol.

`validation_receipts` is the exact ordered `HandoffValidationEvidenceV1` collection. `ledger_refs` is the unique set of every referenced pre-Handoff event sorted by ascending `sequence`; duplicate sequence or event ID/hash is invalid. Validator verdict/Head and the three note arrays copy the validated final Validator artifact exactly. `changed_paths` comes from the cumulative Handoff canonical diff. All identities must agree with current State/readbacks.

The Handoff gateway verifies only the boundary fields listed above and returns only the exact file hash and same ID. It never derives an ID from file bytes and does not become a second Handoff/Core/Ledger validator. After file readback, Coordinator appends/reads `HANDOFF_READY` with that hash and ID, then atomically writes/readbacks `AWAITING_CONTROLLER`. This order removes the hash cycle.

## 11. Failure, Recovery, and Error Disposition

### 11.1 No progress without evidence

For a failing operation with an authoritative receipt:

1. append/read back the failure `VALIDATION_RESULT` or `AGENT_RUN` when applicable;
2. append/read back `BLOCKED` using the existing reason/action table when the outcome is a stop rather than eligible repair;
3. atomically persist/read back BLOCKED State; and
4. return the durable BLOCKED identity.

Only completion of all applicable steps establishes the durable BLOCKED transition. If failure evidence cannot be remotely proven, do not attempt the BLOCKED event or State. If the BLOCKED event is remotely proven but BLOCKED State write/readback is not, retain the prior State and record the exact local-pause diagnostic referencing that already-existing event. In either incomplete case, return a stop with no claim that the BLOCKED macro-state was durably reached and perform no dependent progress. A Ledger-unavailable case claims no invented BLOCKED event; a State-persistence failure may truthfully retain the already-read BLOCKED event only as unresolved evidence, not as phase transition authority.

For original `TEST-M2-011 / 011-L08,L09`, the business observation remains the durable Ledger pair `REGRESSION_FAILURE / REVISION`. If that failure receipt and its `BLOCKED` event are remotely read back but the following BLOCKED State CAS/write-readback fails, the current public result is `BLOCKED` with `blocked_reason:'POINTER_STATE_CONFLICT'`, `next_action:'MANUAL_CONTROLLER_STOP'`, the real durable `blocked_event_id`, and—only after exact local-pause write/readback succeeds—the local diagnostic ID. Its State version/hash remain the original pre-write State identity. The unchanged `LocalPauseDiagnosticV1` uses `operation:'run'`, `request_sha256` of the existing canonical public `run` request, `reason:'POINTER_STATE_CONFLICT'`, `next_action:'MANUAL_CONTROLLER_STOP'`, original State version/hash, and the real BLOCKED event's commit tip, event ID, and event hash in the existing fields. It does not describe or hash an invented internal State request. `STATE_WRITE_FAILED` is not a legal reason, enum, or substitute. If local-pause write or readback also fails, the existing unpersisted BLOCKED failure transport returns with `local_pause_id:null` and no claim that a diagnostic or State was persisted; no new result or diagnostic schema is introduced.

Later `run` or restart reads the unchanged original State plus diagnostic and manual-stops. It must not auto-write BLOCKED State, clear the diagnostic, append another failure/BLOCKED event, retry the State CAS, start REVISION, launch an Agent, or perform Candidate/delivery effects. Only a separately authorized Controller recovery may resolve the pointer/State conflict.

### 11.2 Existing reason/action mapping used by this delta

| Failure | Existing disposition |
|---|---|
| affected Regression non-PASS | `REGRESSION_FAILURE / REVISION` |
| Test Asset Retirement non-PASS | `TEST_ASSET_RETIREMENT_FAILURE / REVISION` |
| dirty/index/scope/path/content conflict | `WORKTREE_DIRTY_CONFLICT / MANUAL_CONTROLLER_STOP` |
| uncertain Candidate commit after readback | `CANDIDATE_COMMIT_AMBIGUOUS / MANUAL_CONTROLLER_STOP` |
| Final Validation non-PASS | `FINAL_VALIDATION_FAILURE / REVISION` |
| ineligible Validator finding | `VALIDATOR_OUT_OF_SCOPE_FAIL / MANUAL_CONTROLLER_STOP` |
| second Validator FAIL | `VALIDATOR_SECOND_FAIL / REVISION` (no automatic continuation) |
| baseline `readCommit` failure/unproven root, or Candidate/Head/parent/tree/freeze conflict | `CANDIDATE_IDENTITY_CONFLICT / MANUAL_CONTROLLER_STOP` |
| branch push ambiguity | `BRANCH_PUSH_AMBIGUOUS / MANUAL_CONTROLLER_STOP` |
| Ledger conflict/ambiguity | `LEDGER_APPEND_AMBIGUOUS / MANUAL_CONTROLLER_STOP`, or the existing Evidence Ref local pause when durability is unavailable |
| PR or Handoff ambiguity/mismatch | `FINAL_HANDOFF_PR_AMBIGUOUS / MANUAL_CONTROLLER_STOP` |
| missing/contradictory evidence | `EVIDENCE_CONFLICT / MANUAL_CONTROLLER_STOP` |
| contract/architecture/scope/dependency/permission/host change | corresponding existing `*_CHANGE_REQUIRED` or authority reason / `MANUAL_CONTROLLER_STOP` |

No source-local alias such as `REGRESSION_FAILED`, `STAGE_FAILED`, `FINAL_VALIDATION_FAILED`, or `HANDOFF_AMBIGUOUS` is a new public reason. Implementation maps to the canonical existing vocabulary.

### 11.3 Four readback boundaries

The existing exact rules remain:

1. Candidate commit: only the same uninterrupted invocation retaining independent `expected_tree` may read Head/commit once, converge exact success, or continue once on exact absence. A restarted STAGE with surviving physical stage or moved Head manual-stops; observed Git objects never regenerate the missing expected value.
2. Branch push: read remote Head once; exact Candidate converges, exact predecessor permits one same-identity normal push.
3. Ledger append: read remote ref/record once; exact record converges, exact absence at unchanged predecessor permits one same-identity append.
4. Final PR/Handoff: query/read once; exact PR/Handoff converges, definite absence permits one same-identity continuation.

Any other or exhausted ambiguity stops. Later `run` returns the same manual stop without calling the ambiguous Gateway. No fifth recovery boundary, replay envelope, reset, force operation, replacement ID, or generic transaction is introduced.

## 12. Concurrency, Cancellation, and Publication Answers

- **Admission:** only verified DISPATCH and pointer-first publication admit work; signed definitions are validated before publication.
- **Issued work:** at most one outstanding Agent action or one current bounded mechanical Gate. Regression owns two sequential validation children in fixed order; the second never starts if the first fails.
- **Mutex:** `applyControllerCommand`, `run`, and `settlement` serialize State/effect work. `status` remains read-only. A contender with stale CAS or no mutex loses without effect.
- **Wait:** the mutex is released while waiting for an Agent or Controller command. It is held through the sequential Regression operation and the purpose-bound stage-to-commit operation so two public calls cannot interleave those steps; no absolute wall-clock bound is claimed.
- **Timeout:** each validation child's signed timer fixes when production sends WVEB's one `SIGKILL`; it then waits for that child's close and performs the mandatory post-observation. Git/filesystem observations have no separately approved wall-clock timeout, so neither one validation nor the two-step Regression gate has a claimed absolute completion bound. The host's existing one-hour timer sends one `SIGTERM` to the single Agent child but has no approved escalation or guaranteed-close deadline; it likewise is not an absolute operation bound. Current command output adds no trusted repair execution-content evidence, timer, or execution subject. No new timeout value, grace, kill escalation, retry, or fallback policy is introduced here.
- **Cancellation:** START_FAILED proves no child; INTERRUPTED records uncertain child effects and stops. Mechanical interruption maps to the existing safe-pause/manual rules. Cancellation never authorizes retry outside the four boundaries.
- **Late settlement:** correlation, child, route, state version/hash, phase, output schema, and subject must still match. A late or conflicting fact cannot advance or overwrite the accepted fact.
- **Stage race:** the pre-stage snapshot, literal stage, post-stage content/index comparison, and no-remainder check select one tree. `git commit-tree <expected_tree>` makes actual commit content independent of later index bytes; compare-and-swap branch movement and final commit/index/worktree readback distinguish pre-commit rejection from a post-commit identity stop. No mutex or repeated observation is claimed to exclude an external writer.
- **Physical linearization:** atomic State/local-pause replace for local lifecycle; exact commit readback for Candidate; remote Head for branch; remote record bytes for Ledger; exact PR readback for PR; Handoff file readback plus HANDOFF_READY remote readback for delivery evidence.
- **Application-visible linearization:** a phase is visible only after its next State bytes are read back. `AWAITING_CONTROLLER` is visible only after the complete Handoff chain.
- **Partial output:** prepared index/commit, push acknowledgement, local Ledger bytes, PR response, or Handoff temp bytes have no authority before the named readback.
- **Exceptional writes:** same-Change local pause and, when remotely provable, append-only failure/BLOCKED plus State. After freeze, no Candidate worktree/branch code or Git write.

## 13. Path and Implementation Boundary

After future Spec Gate, Test RED, and TDD_READY, production eligibility is exactly the four existing files:

- `coordinator.mjs`: admission map, ordering, State/evidence consumers, repair and Handoff construction;
- `production.mjs`: closed Candidate validation, sole-evaluator purpose-bound stage/readback fence and its exact Git commands, the one shared purpose-bound Ledger object reader plus private protected transport, Ledger bytes, Handoff and composition;
- `adapters.mjs`: fresh Worktree path/identity inspection, Candidate commit/readback, and canonical-diff path observation;
- `host-loop.mjs`: Validator artifact validation/forwarding, approved repair-derived-input framing, and the sole purpose-bound sealed-content proof operation; ordinary RESULT remains unchanged except that repair Test points to the distinct Host-owned proof artifact.

There is no conditional production path. A need to change snapshot evaluator, State storage layout, CLI/host installation, dependency, test-only hook, or another module is a Controller blocker.

## 14. Offline Evidence Boundary

K1/K2 integration uses the real public Core, actual temporary files, real Git repository/worktree/bare remote, purpose-bound production stage and validation factories, real Node children, and exact Ledger bytes. The ordinary Host path uses section 6.4's shared launcher on a real current-user temporary root and deterministic offline fixture executable, including true input bytes, child lifecycle, parsing, inventory, Host Loop reread, and the separately managed real-hour `012-L06`. Handoff uses section 10.3's exported existing factory on a real temporary state root and actual atomic write/readback. Agent answers and true network/GitHub surfaces may use controlled contract substitutes, but Core/shared process/filesystem/Handoff/Git/Ledger results may not.

The production K2 repair contract still specifies real root ownership and non-writable ancestor chains, runtime uid/gid child, fixed `sandbox-exec` profile, sealed final Test/Candidate execution, protected proof artifact, proof-bound Worker, and complete readbacks. A2 leaves only the mapped privileged preflight, isolation/content proof, and dependent repair K2 positive as `USER_WAIVED / NOT_VERIFIED`; they do not block current TDD_READY or acceptance and must not be run, fabricated, or generalized into a broader waiver. All runnable schema/artifact/eligibility/budget/error/local Git/file/process/ordinary Host/Handoff and public-chain evidence remains required. The shared-launcher Test does not prove fixed production assembly dynamically: static source/shape checks show the fixed root and preparation are selected, while deployed Host execution, production uid/gid/root isolation, real provider, and the A2 subset remain separately unverified.

Test Design must freeze two independent reachability controls: absence of `createHostAgentLauncher` and absence of exported `createHandoffGateway` are causal RED for CCR003 only. Every registered suffix that cannot invoke those implementations is `NOT_REACHED`, never another RED or PASS. Factory-independent fixture/process/file/oracle controls must be healthy before TDD_READY, and the complete dependent assertions must already exist and be frozen. Worker may then add only the approved reachability/contract implementation in the two existing files; after reachability, the same assertions must run without Test edits and any failure is a GREEN blocker inside the frozen contract. Original R044 F01/F02/F04/F05 gaps remain independently due at the same Readiness Gate; neither factory RED licenses a production-first repair or postpones Test authoring.

R047, R059, and R063 remain historical authority for every unaffected contract. S21/R085 changes only section 10.1's exact path stdout Buffer/length and original009/010 references. R106 changes only sections 8.2, 9.2, and 11.1 for approved C1-C3; R109 closes only C2 inside section 8.2 with the approved shared object reader and original `010-L13` evidence path. It preserves section 10.2's delivery preimage, `DeliveryV1`, Candidate, public Core request shapes, two canonicalDiff observations, raw `JUANERAI_GIT_DIFF_V1`, PR/Handoff order, four recovery boundaries, and every unrelated contract. This package is `SPEC_READY / CONTROLLER_GATE_PENDING_R109`; no Test, behavior run, privilege, provider, network, production credential, product branch, real PR/Handoff, or deployment was exercised. M3/M4 boundaries remain unchanged.
