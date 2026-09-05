# Test Plan: Worktree Validation Execution Boundary

> M1 closure record — 2026-09-05: Controller accepts the Validator004-frozen WVEB component; this package is mechanically archived under the current M1-only user authorization. Production/Test and normative semantics are unchanged. Integration/live-main remain pending until readback. Historical Gate/identity/authorization statements below remain stage-bound. Current recovery: [NEXT_ACTION](../../../../docs/planning/2026-09-05/automation-repair/NEXT_ACTION.md); [Acceptance](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-acceptance-001.md).

## Current execution checkpoint — R015

2026-09-05: VALIDATOR004_PASS / CONTROLLER_VERDICT_ACCEPTED / S04_S05_CLOSED_RETURNED / B0_OPEN. [Validator004 Gate](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-validator-004-gate.md) binds fresh sixAC source/runtime/consumer/lifecycle/Retirement review,387/387 focused,757/757 regression,canonical1410PASS/1expected real-Pi skip, exact20/20 frozen inputs and no non-Controller baseline drift. No substantive findings. Test f1b6e89c5c45415ff71ef493e15e2af51f1e050b0c78da0d05b2995cad988a4d; snapshot a4415cc8de12743bad8f1dc30cd3d1411530e90a5ea2564a76c75300cf01d210; production 57b32d5b471f32b8c611f138579fcea3502c81d348d7be30e4077bf49b273240. HEAD unchanged/index empty; worktree blobs not committed.

S04/S05 re-passed the ORIGINAL complete WVEB independent verification point and CLOSED_RETURNED to M1 Acceptance/integration preparation. B0–B5 remain OPEN; B0 still needs Acceptance/merge/archive/live-main. Current bounded cycle ENDS at verdict/receipt: no Acceptance/Git integration/M2/host/Desktop/external action now. Full delivery chain not yet proved. L1 slash-root actual runtime plus L2 ordinary-root actual tempGit/runtime and slash private predicate/call-site source remain distinct; no actual filesystem-root L2 runtime claim. Normative Spec unchanged, prior FAIL/RED/PASS preserved for their inputs. Recovery [NEXT_ACTION/R015](../../../../docs/planning/2026-09-05/automation-repair/NEXT_ACTION.md#progress-receipt-r015).

## Preserved pre-Worker005 evidence and contract snapshot

The following sections retain prior-cycle identities, results and authorization wording as historical evidence. Current execution status is R015 above; historical pending/locked/current labels do not override it or change normative requirements.

## Current authorized S05 continuation

2026-09-05 current user authorizes the bounded Test012→Worker005→freshValidator004 cycle, each behind its own Gate, with one-use temporary terra/high, terra/high, sol/high roles. [Cycle/Test012 brief](../../../../docs/planning/2026-09-05/automation-repair/m1-s05-cycle-test-012-brief.md) freezes N217..N221, retained382 prefix, public L1 causalRED and explicit L2 real-temp/source evidence split. Spec semantics and prior Gates retained; production frozen until new Test-bound TDD_READY. Endpoint independent WVEB verdict/receipt only, no Git integration/M2. R012 below is preserved prior stop; this paragraph records current authority, not completed Test results.

## Current Controller supplement — S04 / Test011

2026-09-05 user approved bounded Test supplementation after Validator002 FAIL. Existing descriptor-first and zero-callback semantics, REQ-WVEB-001 and AC001/005 remain unchanged; Spec Gate001 is retained. [Test011 brief and exact manifest](../../../../docs/planning/2026-09-05/automation-repair/m1-test-correction-011-brief.md) bind N214 before.kind, N215 after.kind, N216 content.kind, each independently scheduled with a valid oracle control and zero-callback proof. Retain the complete current379 Test byte-prefix; planned total382. This supplements only the prior Correction010 manifest/count and execution cursor; it does not relax any assertion, add a public contract or grant Worker authority. Prior379 and earlier279 text below describe their respective historical stages.

Current status: Test011/Worker004 history and current382 Test identity remain frozen. Validator003 independently confirms getter fix and382/752/canonical/Retirement PASS, but returns FAIL for one F1 / descendant-containment case absent from the empty-snapshot slash positives. [Validator003 Gate](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-validator-003-gate.md) and NEXT_ACTION/R012 own the bounded Test Design return; no new leaf manifest, Test writes, Worker or contract amendment authorized this turn. Existing normative/historical plan below unchanged.

## Retained Correction010 contract and history

> Controller Gate update — 2026-09-05: `SPEC_GATE_PASS / TEST_AUTHORIZATION_PENDING / MANUAL_CONTROLLER_STOP`. Complete-package correctness and ponytail reviews passed; see [Gate 001](../../../../docs/planning/2026-09-05/automation-repair/reviews/m1-spec-gate-001.md). The Spec-return statements below record the pre-Gate snapshot, not the current Controller disposition. Test Correction 010 and all subsequent execution remain locked; B0 is not closed.

## Status and asset boundary

- Current Change state: `MANUAL_CONTROLLER_STOP`.
- Current physical Test: SHA-256 `19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`, 1,326 lines, 111,031 bytes, exactly 279 stable IDs (`C001..C166` and `N001..N113`). It is the immutable input to this clarification and has no current Test-write or renewed Worker authority.
- Worker Revision 002 historically passed focused `279/279`, Coordinator `358/358`, Board `12/12`, and canonical `1410 PASS / 0 FAIL / 1 expected real-Pi skip`. Those results remain partial-GREEN evidence for the prior contract only. Current Test Asset Readiness has not passed, Test Asset Retirement is not closed, and no fresh Validator covers the scalar/array/root admission defects now clarified.
- Validator 001 `FAIL` predates Worker Revision 002 but remains the latest completed independent verdict. It is preserved with prior Corrections 005..007 and earlier RED/Readiness/TDD_READY/PASS evidence; it does not assert that the current blobs still contain every defect observed at that Validator stage, and no later partial GREEN becomes Acceptance without fresh independent revalidation.
- This six-file revision is `SPEC_READY / PENDING_CONTROLLER_SPEC_GATE`. It changes no Requirement/AC ID, receipt, hash, timeout, dependency, path boundary, or L3 authority and authorizes no Test or production write.
- Test Correction 010 is the next possible Test adoption only after Controller correctness review, mandatory ponytail review, Spec Gate, and separate authorization. A renewed `TDD_READY`, Worker Revision 003, fresh Validator, Acceptance, integration, archive, and successor release remain locked.
- Sole planned Test path: `tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs`.
- Existing Tests, fixtures, helpers, doubles, and snapshots are read-only.
- The planned Test is a permanent regression asset owned by `REQ-WVEB-001` / `AC-WVEB-001..006`; temporary repositories, scripts, probes, and evidence live only under the operating-system temporary directory and are removed by Test cleanup.

Except for the narrow Test-only project-local `typescript@5.9.3` AST oracle approved by `WVEB-STRUCTURAL-ORACLE-PARSER-001`, the suite uses only Node's built-in Test APIs and standard library. That exception parses and queries the exact dynamically bound `production.mjs` source plus the repository-wide `.mjs` consumer inventory defined below; it owns no runtime fact, never enters production, and cannot replace dynamic evidence or independent Validator review. The suite imports public exports normally. It does not rewrite source, patch modules, inject Git/filesystem/process callbacks, or use skip, todo, only, arbitrary throw, or a legacy short receipt as evidence.

The production factory has no observation injection. L1 alone constructs synthetic `SnapshotObservationV1` values. L2 derives expected inventory/snapshot/receipt bytes independently from a real temporary Git worktree and compares them with production output while inducing only real Git, filesystem, cwd, identity, and Node-process conditions.

## Exact Test Correction 010 adoption contract

The per-ID mutations and positive-oracle assignments are frozen by the [formal 379 attachment](../../../../docs/planning/2026-09-05/automation-repair/attachments/wveb-379-candidate.md). The adoption is exact and additive:

```text
279 retain: C001..C166 and N001..N113, same IDs, registration order, bodies, helpers, and evidence purposes
+ 28 scalar leaves: N114..N141
+ 42 array leaves: N142..N183
+ 30 root leaves: N184..N213
= 379 total leaves

replace = 0
delete = 0
renumber or merge = 0
registration order = current 279 order, then N114..N141, N142..N183, N184..N213
```

The 28 scalar leaves mutate `definition.cwd` (`N114..N126`) and `subject.head_sha` (`N127..N141`) exactly as listed in the formal 379 attachment: null; present undefined; Number; boolean; bigint; Symbol; boxed valid string; plain object; one-element array containing the valid string; function; `toString` returning a valid string; `toString` returning an object with `valueOf` returning the valid string; and `Symbol.toPrimitive` returning the valid string. Head additionally covers a 40-digit primitive bigint and `toString` returning an invalid Head. Each is an independent `INPUT_INVALID`, no-receipt, no-child, zero-callback leaf; already-correct production cases may PASS and are not forced into the causal RED count.

The 42 array leaves cover, independently for L1 `allowed_paths`, `forbidden_paths`, and `entries`, and L2 `argv`, `allowed_paths`, and `forbidden_paths`: null prototype; hook-free custom prototype; prototype data-method hook; prototype getter-method hook; existing index 0 changed only to non-enumerable; valid frozen array; and valid read-only non-frozen array. Method hooks use `every` for all L1 arrays and L2 `argv`, and `Symbol.iterator` for L2 scope arrays. Getter-hook leaves count both getter and returned-method calls, both of which must remain zero. Negative cases reject at admission; positive frozen/read-only cases use independent L1 snapshot or real L2 execution oracles.

The 30 root leaves cover `.`, `..`, repeated slash, trailing slash, and valid `/` independently for `repository_root`, `worktree_root`, and `common_git_dir` at both L1 and L2. Negative strings preserve the same normalized target but must return `INPUT_INVALID` without normalization. L1 `/` uses a matching empty observation and independent empty-snapshot oracle. L2 `/` proves lexical admission and then uses another valid root as an ordering trap to produce a complete pre-snapshot `SUBJECT_MISMATCH` receipt; it does not claim successful validation execution.

Every mutation starts from a proved-valid control, changes one target field or descriptor only, and verifies strict value/descriptor identity for everything else. Expected values are computed from Test-owned normal values before installing a hostile prototype or callback. Tests never spread, map, iterate, serialize, or copy the mutated array to build expected values. Callback counts are zero before and after the public call. L2 negative leaves additionally prove no receipt, no child sentinel, and unchanged temporary-worktree Head, index, and status. L2 frozen/read-only positive leaves run a real child and assert the full twenty-four-field `COMPLETED/PASS/null` receipt.

## Historical retained evidence allocation

Correction 007 and its 279-leaf structural-evidence adoption are historical inputs retained byte-for-byte by the 279-retain rule. Its single-read `productionAst`, repository-wide AST inventory, `C164`, signal-resistant-child, admission, scope, bigint, timeout, sole-consumer, and compatibility evidence remain owned by their existing stable IDs. This clarification does not reopen or replace them.

The public L2 closed-input matrix covers each of these five strict data-object surfaces independently: factory input, execute request, `WorktreeSubjectV1`, eight-field definition, and empty environment. For each applicable surface it includes separate symbol-extra, non-enumerable-extra, required-field-non-enumerable, getter, setter-only, non-plain, missing, extra-enumerable, and wrong-value/type leaves. Empty environment has no required-field mutation, but separately rejects symbol, non-enumerable, accessor, inherited/non-plain, and enumerable fields. Every accessor leaf proves the accessor callback is never invoked.

For each of `allowed_paths` and `forbidden_paths`, separate public L2 leaves cover closed-array symbol key, extra string key, hole, accessor index, wrong element type, item underflow/overflow, leading slash, trailing slash, empty segment, dot segment, dot-dot segment, NUL, backslash, second `/**`, and every other wildcard form. Separate leaves cover raw-byte duplicate items, cross-array identical-rule conflict, and the combined canonical scope size over 1 MiB. Every invalid leaf is its own stable-ID subtest and returns `INPUT_INVALID` with no receipt, no validation-child sentinel, and no later Test-observable state effect.

The admission ordering trap starts from an otherwise contract-valid request whose absolute root is syntactically valid but deliberately nonexistent or inaccessible. If admission incorrectly reaches identity, snapshot, Git, or process handling, that trap yields a distinct and diagnosable non-`INPUT_INVALID` result. Each leaf changes one contract mutation relative to that trap control; when the mutated field is itself one root, another root carries the trap. The public result and unchanged sentinels establish the public failure frontier, but they do not directly observe or claim a count of internal read-only filesystem or Git system calls. A separate source-structure check and the independent Validator establish that strict shape and complete scope validation precede all `realpath`, Git, snapshot, and child operations.

The public L2 timeout matrix retains ordinary close-before-timeout zero/nonzero/signal cases and adds a real signal-resistant Node child. Before reporting ready, that child records its unique PID and installs recording handlers for every catchable signal supported by the host/runtime: signal names from `os.constants.signals` are de-duplicated by number, `SIGKILL` and `SIGSTOP` are excluded, and every remaining name for which `process.on(name, handler)` succeeds is recorded; the ready record MUST include `SIGTERM`. Each handler synchronously records the delivered signal in Test-owned temporary evidence outside the subject worktree, and the child then remains alive.

The unchanged-worktree timeout leaf requires production to settle before an independent Test watchdog rescues anything; the watchdog firing is an unconditional Test failure, and any kill it performs occurs only from `finally` cleanup of the exact recorded PID. The leaf proves exactly one ready child/PID, no recorded `SIGTERM` or other catchable termination signal, the child has closed before receipt, the PID is no longer alive, complete stdout/stderr hashes from the exact Test-owned raw bytes, completed unchanged post-snapshot evidence, and exactly `INTERRUPTED/null/TIMEOUT`. A paired signal-resistant leaf mutates the subject before waiting and proves that the post-snapshot runs after close by requiring the higher-priority `INTERRUPTED/null/SUBJECT_MISMATCH` result while retaining the pre-snapshot SHA.

Structural Test evidence supplements, and never replaces, those real-child L2 leaves. It reads the bounded production child-lifecycle source without rewriting it and proves one literal `SIGKILL` send site in the timeout-winner path; no `SIGTERM`, grace/second timer, fallback signal, replacement child, retry/recovery, process-group interface, or caller-configured signal policy; and only the two frozen linearization exits: close observed before the timeout callback, or the timeout callback observed before close. Independent Validator evidence MUST repeat that source review and rerun the public signal-resistant child cases. No process, filesystem, Git, or OS-tracing observer seam is introduced.

### AST structural oracle for `N086..N094`

The sole WVEB Test file MAY use the project-local `typescript` package already directly locked at exactly `5.9.3`; it MUST assert `ts.version === '5.9.3'`. This is Test evidence tooling only. It adds no dependency and changes neither `package.json` nor any lockfile, production module, runtime, composition, or public surface.

On each Test process run, the oracle resolves only the exact absolute repository path for `tools/harness/change-coordinator/production.mjs`, reads that path exactly once, dynamically computes and records `{absolute_path,byte_length,sha256}` from that one read, decodes it as UTF-8 with exact byte round-trip, and parses the same in-memory bytes with TypeScript only to construct one shared JavaScript `SourceFile`. Every structural leaf in that run queries that same frozen source record and `SourceFile`; no leaf rereads or reparses production. Historical Controller-frozen production byte lengths and SHA-256 values are external identity credentials at pre-Worker, post-Worker, and Validator stages only. The Test MUST NOT encode them as permanent expected values or require the dynamically observed hash to equal a historical pre-Worker hash. A path/read mismatch, UTF-8 round-trip mismatch, parser-version mismatch, syntax diagnostic, zero match, multiple match, or inability to locate a required enclosing structure uniquely is a fail-closed Test failure.

The parser MUST NOT transpile, emit, evaluate, execute, import for side effects, rewrite, normalize, or format the source. Each structural leaf records its exact node kind, enclosing declaration/function, cardinality, source range, and structural predicate. `N086..N094` use this AST oracle for their already-frozen structural claims. Another leaf may use it only when that leaf's evidence owner is the syntax or structure of this exact `production.mjs`; public outcomes, child behavior, filesystem state, Git state, hashes, receipts, and other runtime facts remain outside the AST oracle.

`C148/N085` remains the real signal-resistant-child public L2 dynamic evidence owner. AST success cannot satisfy, replace, skip, weaken, or rescue that leaf, and neither `C148/N085` nor the AST result replaces the fresh independent Validator's source review. The parser, AST, source bytes, and query results are never passed to production or runtime and create no parser, observer, filesystem, process, Git, callback, or other authority injection.

### Repository-wide sole-consumer AST inventory for `C164`

The sole-consumer claim remains permanent Test evidence. From the exact current repository root, the Test spawns the fixed Git executable with argument vectors equivalent to `git -C <root> ls-files --cached -z -- '*.mjs'` and `git -C <root> ls-files --others --exclude-standard -z -- '*.mjs'`. It consumes the two stdout streams as NUL-delimited raw path bytes, rejects a nonzero exit, signal, stderr, unterminated record, absolute path, empty component, dot/dot-dot component, backslash, NUL, or path escaping the root, combines and de-duplicates exact raw path identities without locale or text normalization, retains only raw names ending in ASCII `.mjs`, and sorts only with `Buffer.compare` for deterministic traversal. A raw path must decode as UTF-8 and round-trip to the identical bytes before it can be supplied as a TypeScript filename; a collision after decoding or lexical resolution is ambiguous and fails closed.

Every enumerated `.mjs` candidate is read at most once and parsed once with project-local `typescript@5.9.3`; the `production.mjs` inventory entry MUST reuse the exact shared `productionAst` bytes and `SourceFile` rather than reread or reparse it. Unreadable bytes, failed UTF-8 round-trip, syntax diagnostics, duplicate/ambiguous identity, or unresolved repository containment fails the inventory. Classification is exact: basenames ending `.test.mjs` are Test assets; `tools/harness/change-coordinator/fixtures.mjs` is the named fixture; prefixes `.juanerai/`, `.agents/`, `.ai-coding/`, `.codex/`, `docs/`, `openspec/`, `tools/harness/project-board/`, and `tools/harness/validation/` are named nonproduction/governance/harness categories; `tools/harness/change-coordinator/worktree-snapshot-contract.mjs` is the provider; and every other `.mjs` path remains a production candidate. These exclusions classify evidence only and do not skip the read/parse fail-closed checks.

For each parsed candidate, the inventory recognizes only a relative module specifier beginning `./` or `../` in (a) a static `ImportDeclaration`, (b) an `ExportDeclaration` re-export with a module specifier, or (c) `import()` with exactly one string literal or no-substitution template literal argument. It performs exact POSIX lexical resolution from the importing file's repository-relative directory, with no extension/index/package lookup, symlink following, URL/query/hash interpretation, case folding, or text normalization. Nonliteral dynamic imports and absolute, URL, bare-package, or otherwise nonrelative specifiers cannot count as snapshot-module matches. Any relative specifier whose resolution escapes the repository, is ambiguous, or cannot be resolved uniquely fails closed.

The exact target is `tools/harness/change-coordinator/worktree-snapshot-contract.mjs`. The inventory must find exactly one resolving production module-reference site in exactly one production-consumer path, and that path must be `tools/harness/change-coordinator/production.mjs`; zero or multiple sites or production-consumer paths fail. Test assets are excluded from the production-consumer count, and any target match in another excluded nonproduction/governance/harness path fails rather than being hidden by classification. `C164` MUST call this repository-wide inventory and assert the exact result. A `production.mjs`-only AST query cannot satisfy sole-consumer evidence, and the broad recursive text `.includes()` helper must not remain, even unused.

The historical Correction 007 boundary remains frozen inside the retained 279 leaves. Test Correction 010 may append only N114..N213 and their local construction/self-check support in the sole Test file. It adds no new file, fixture, double, snapshot, process/filesystem/Git observer, OS tracing, production seam, dependency, public method, gateway method, State/Event, or runtime authority. It preserves every existing stable-ID body, including `C148/N085` and `C164`, and both production files. Test Asset Readiness must prove the complete 379-leaf identity against the then-current worktree before any later Test-bound `TDD_READY` can be considered.

## Historical causal RED gates

The two independent causal REDs below were established historically and remain preserved evidence. The historical 166-leaf Readiness identity retained their purposes through Correction 004; later corrections produced exactly 279 stable IDs. Test Correction 010 MUST preserve all 279 IDs, bodies, registration order, helpers, and evidence purposes, and append only N114..N213 plus their local support. A new TDD_READY, if later authorized, binds only a Controller-accepted 379-leaf Test identity and its honest scalar/array/root causal frontier.

| RED | Causal missing behavior | Required assertion | Disallowed substitute |
|---|---|---|---|
| `RED-WVEB-001` | `worktree-snapshot-contract.mjs` and `evaluateWorktreeSnapshotObservationV1` do not exist | normal ESM import fails because the approved pure production module/export is absent | syntax error, arbitrary failing assertion, Test-local evaluator, copied production logic |
| `RED-WVEB-002` | `createValidationGateway` is not exported and the existing private gateway accepts `{definition,subject_sha}` and emits a short receipt | normal ESM import/API assertion fails specifically on the missing exported factory; after that export exists, the exact WORKTREE request and 24-field receipt assertions remain causally RED until implemented | source rewriting, private-function extraction, Coordinator change, accepting the old request/receipt |

The Test role records the exact Test file SHA-256, command, runtime, exit status, and relevant error for each RED. Environment health is proved separately with a minimal Node built-in Test probe and fixed Git version/path probe so missing behavior, not tool failure, causes RED.

Focused commands after the named Test leaves exist:

```text
node --test --test-name-pattern='RED-WVEB-001' tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
node --test --test-name-pattern='RED-WVEB-002' tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
node --test tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
```

## Independent oracle

Test owns a small independent oracle inside the sole Test file. It constructs byte preimages directly with `Buffer`, sorts raw `path_bytes` with `Buffer.compare`, canonicalizes only the frozen JSON values in Test code, and hashes them with `node:crypto`. It MUST NOT import production canonicalization, path matching, status parsing, entry serialization, or hash helpers. At least one fixture orders raw paths differently from text/locale order and at least one path contains non-ASCII UTF-8 bytes, proving no locale or decoded-path sort controls the result.

The oracle asserts exact `scope_sha256`, `raw_inventory_sha256`, `worktree_snapshot_sha256`, `command_definition_sha256`, and `receipt_sha256` bytes. Changing each delimiter, header, identity field, raw status byte, `XY`, normalized mode, content hash, array order, or entry order independently must change or reject the expected result.

## Test cases

### `TEST-WVEB-001` — L1 valid snapshot and exact hashes

- valid empty inventory and valid mixed file, executable file, symlink, and tracked deletion inventories using primitive nonnegative bigint for all six present-stat fields;
- entry input order differs from raw-byte path order but produces the oracle hash;
- file mode uses `(mode & 0o111n) !== 0n` and normalizes to `100755` when any execute bit is set and otherwise `100644`; symlink uses `120000`; deletion uses `MISSING/000000/MISSING`;
- `scope_sha256` preserves signed array order, `raw_inventory_sha256` hashes exact status bytes, and snapshot identity binds both roots, branch, Head, common Git dir, scope, raw inventory, and every entry record;
- repeated equal input returns the same exact four-field value and correct entry count.

### `TEST-WVEB-002` — L1 closed-shape and mutation matrix

Each mutation is an independent leaf with a known-good control:

- top-level, subject, observation, index, entry, stat, and content missing/extra/wrong-type/symbol/non-enumerable/accessor/non-plain fields return `INPUT_INVALID`;
- root/common-dir/branch byte limits, wrong branch family, Head grammar, path byte limits, invalid hash grammar, status limits, and canonical scope over 1 MiB return the contract's closed rejection;
- duplicate, absolute, dot, dot-dot, backslash, empty, malformed, unterminated, renamed/two-path, or bad-`XY` status records return `SUBJECT_MISMATCH`;
- any ignored `!!`, ignored-stream disagreement with the main ordinary records, dirty/error/signaled/noisy index probes, status-entry count mismatch, duplicate/unmatched/extra entries, out-of-scope paths, forbidden-wins paths, and direct scope conflict return `SUBJECT_MISMATCH`;
- repository/Worktree/common-dir realpath, branch, or Head mismatch returns `SUBJECT_MISMATCH`;
- parent realpath escape, unsupported/special/directory leaf, status/content mismatch, followed symlink representation, and each independently changed before/after identity field return `SUBJECT_MISMATCH`;
- each of `mode`, `dev`, `ino`, `size`, `mtime_ns`, and `ctime_ns` independently rejects a Number representation and independently rejects a negative bigint as `INPUT_INVALID`; a mixed present-stat representation is never accepted;
- no mutation throws, performs I/O, observes environment/clock/network, or invokes a supplied callback because no callback field is admitted.
- `subject.allowed_paths`, `subject.forbidden_paths`, and `observation.entries` independently reject null/custom prototypes, inherited data-method hooks, inherited getter-method hooks, and non-enumerable own index 0 before any callback or input method is invoked; valid frozen and valid read-only non-frozen arrays produce the independent expected snapshot.
- each subject root independently rejects `.`, `..`, repeated slash, and trailing slash as `INPUT_INVALID`; `/` remains a valid lexical root and succeeds when observation identity and the independent empty-snapshot oracle match.

### `TEST-WVEB-003` — Factory, request, definitions, and receipt

Using a real temporary Git repository plus a linked `work/mac-mini/<slug>` worktree and real Node executable:

- factory input, execute request, subject, definition, and environment each receive independent stable-ID leaves for every applicable closed-object shape, descriptor, missing/extra, and value/type mutation; each leaf returns only `INPUT_INVALID`, contains no receipt, does not invoke an accessor, creates no child sentinel, and leaves all Test-observable downstream state unchanged;
- `allowed_paths` and `forbidden_paths` each receive the complete independent closed-array and item-grammar leaf set, plus independent uniqueness, cross-array conflict, and combined-size leaves; each uses the ordering trap and produces only the same `INPUT_INVALID`/no-receipt/no-child/no-state-effect vector;
- `definition.argv`, `subject.allowed_paths`, and `subject.forbidden_paths` independently receive the seven exact prototype/descriptor/readonly cases N163..N183; negative cases invoke zero inherited callbacks and positive frozen/read-only cases complete one real child with the full twenty-four-field `COMPLETED/PASS/null` receipt;
- `definition.cwd` and `subject.head_sha` receive N114..N141 as exact primitive-type/order mutations. Every invalid value is `INPUT_INVALID` with no receipt or child and zero conversion callbacks, including cases whose current production already rejects correctly;
- all three subject roots receive the exact L2 lexical cases N199..N213. Non-lexical strings are `INPUT_INVALID` before identity work; `/` passes lexical admission and is then distinguished by a separate valid-root ordering trap that yields the complete pre-snapshot `SUBJECT_MISMATCH` receipt without claiming validation success;
- the ordering trap distinguishes admission rejection from later identity/snapshot failure without asserting an internal read-only syscall count; bounded source structure and independent Validator review own the stronger before-`realpath`/Git/snapshot/process ordering proof;
- both exact validation definitions execute successfully against a clean valid subject after production GREEN; before Worker, the corresponding downstream assertions remain executable and may be causal RED for missing production bigint support;
- the existing three-field OK envelope contains `value` with exactly the twenty-four receipt fields, exact subject/scope/snapshot/output values, null Candidate/tree/Validator fields, and independent command/inner-receipt/outer-envelope hashes;
- on pre-snapshot `START_FAILED/null/SUBJECT_MISMATCH`, every request-derived identity comes from the admitted definition/subject and canonical subject scope; besides the tuple's null verdict and always-null Candidate/tree/Validator fields, only `execution_cwd` and `worktree_snapshot_sha256` have conditional nullability, and no-child output hashes use empty bytes;
- a zero exit yields only `COMPLETED/PASS/null`; nonzero yields only `COMPLETED/FAIL/NONZERO_EXIT`; missing absolute Node executable yields only `START_FAILED/null/PROCESS_START_FAILED`; ordinary self-signal and timeout yield their exact interrupted tuples;
- a real ready Node child with one recorded PID and handlers for every host/runtime-supported catchable signal cannot keep the producer pending: production settles before watchdog rescue, no catchable signal is recorded, close precedes receipt, the PID is dead, and exact output hashes plus post-snapshot evidence produce only the timeout tuple or higher-priority post-snapshot-mismatch tuple;
- no-child outcomes hash empty stdout/stderr, and no producer path emits `RECEIPT_INVALID`.
- the Node child is spawned from an environment object with zero own fields: a parent sentinel is absent in the child; the Test may remove only a present `__CF_USER_TEXT_ENCODING` platform-injected key from the observed child keys and then requires the remaining key set to be empty.

### `TEST-WVEB-004` — Real collection ordering and fail-closed changes

Against fresh real temporary Git worktrees, independent leaves prove:

- wrong repository root, Worktree root, `work/macbook/...` or wrong Mac mini branch, Head, common Git dir, and cwd outside or symlink-escaping the Worktree fail before the validation child sentinel is created;
- exact allowed scope succeeds; a dirty path outside allowed scope, any forbidden match, ignored file, and staged index fail with `START_FAILED/null/SUBJECT_MISMATCH` and zero child;
- every malformed signed-scope leaf is rejected as `INPUT_INVALID` with no receipt, no child sentinel, and unchanged Test-observable state; the nonexistent/inaccessible absolute-root trap makes accidental identity/snapshot progression diagnosable without claiming direct observation of read-only syscall counts;
- a real validation child that creates, removes, rewrites, chmods, or replaces a scoped path proves post-snapshot `INTERRUPTED/null/SUBJECT_MISMATCH`, preserves the pre-snapshot SHA, and is launched only once;
- child physical mutation remains present, proving the boundary did not roll it back, while the returned receipt grants no second validation or downstream effect;
- unchanged worktree success and failure cases retain their process tuple rather than being rewritten as subject mismatch.

### `TEST-WVEB-005` — Production consumption and authority isolation

- Test independently derives the expected scope, raw inventory, snapshot, command, output, inner-receipt, and outer-envelope hashes from the actual temporary Git worktree and compares them with `createValidationGateway` output;
- L2 mismatch cases change only real Git/filesystem/process conditions; no Test passes, replaces, mutates, or intercepts the collector's `SnapshotObservationV1`;
- `C164` calls the deterministic repository-wide tracked-plus-untracked, exclude-standard, NUL-safe TypeScript AST inventory and proves `production.mjs` is the only production consumer of `worktree-snapshot-contract.mjs`; Test/nonproduction categories are classified by the exact rules above and cannot conceal another match;
- collector and fixed Git path remain unexported; returned gateway has only `execute`;
- bounded source structure proves strict shape and complete dual-scope validation is ordered before `realpath`, Git, snapshot, and child operations;
- `N086..N094` and only other structure-owned applicable leaves use the exact-file/content-bound `typescript@5.9.3` AST oracle; each query must identify one unambiguous source structure or fail closed;
- bounded child-lifecycle AST structure proves exactly one literal timeout-winner `SIGKILL` send site, no other signal/timer/fallback/replacement/configuration path, and only close-before-timeout or timeout-before-close linearization exits; this supplements and does not replace `C148/N085` public L2 real-child evidence or independent Validator review;
- factory/request cannot inject Git, filesystem, process, State, Ledger, credential, clock, callback, network, environment, retry, or recovery behavior;
- real temporary Git and Node observations use no mock in place of the behavior being proved.

### `TEST-WVEB-006` — Compatibility, scope, and successor lock

- existing `createProductionComposition({})` still admits only `{}` and constructs validation through the exported factory without a second production implementation;
- module export inventory and repository diff prove no public Coordinator method, other gateway method, State/Event/Ledger/Candidate contract, dependency, or forbidden path changed;
- no L3 assertion is represented as passing WVEB evidence; the successor remains documentary-locked pending WVEB Acceptance, merge, archive, and live-main readback.

## Coverage matrix

| AC | Primary Tests | Positive | Negative/boundary/failure | Forbidden-side-effect proof |
|---|---|---|---|---|
| `AC-WVEB-001` | `TEST-WVEB-001`, `002` | exact valid hashes | closed shape, grammar, status, race, type mutations | pure interface admits no effects |
| `AC-WVEB-002` | `TEST-WVEB-004`, `005`, `006` | real collector/evaluator path | identity, strict shape, complete scope, and authority-field rejection | public traps plus source order; only production consumer; no exported collector |
| `AC-WVEB-003` | `TEST-WVEB-003` | both definitions and 24 fields | independent factory/request/subject/definition/environment/scope leaves | `INPUT_INVALID`; no receipt/child/observable later effect |
| `AC-WVEB-004` | `TEST-WVEB-003`, `004`, `005` | close-before-timeout and timeout-before-close | start, resistant timeout, ordinary signal, pre/post mismatch | real PID termination plus one structural `SIGKILL` site; no retry/rollback |
| `AC-WVEB-005` | `TEST-WVEB-002`, `003`, `004`, `005` | clean in-scope subject | L1 malformed/special/race; L2 shape/scope/index/ignored/identity/process mutation | dynamic trap/sentinel/state readback plus structural pre-effect order |
| `AC-WVEB-006` | `TEST-WVEB-005`, `006` | unchanged composition caller | export/import/diff boundary | no L3 or successor authority |

## GREEN, regression, and retirement

After this clarification passes Controller correctness review, mandatory ponytail review, and Spec Gate, Test Correction 010 still requires separate authorization. Before its first write, the Controller freezes the exact 279-retain plus N114..N213 append-only manifest. Before any renewed TDD_READY, the Controller must prove exactly 379 stable IDs; byte-identical original 279 IDs, bodies, helpers, purposes, and registration order; exact N114..N213 ordering and mutation/oracle mapping; no replace/delete/renumber/merge; both production files unchanged during Test work; Test Asset Readiness; Test Asset Retirement; and applicable regressions. The evidence freeze records the accepted Test identity, command/results/environment, complete leaf inventory and causal RED set, each run's dynamically observed production `{absolute_path,byte_length,sha256}`, TypeScript `5.9.3`, repository inventory and import-resolution result, and Controller-frozen external production identities for the applicable stage. Historical or current physical Test and production identities alone authorize no Worker.

After the later bounded Worker return, run the focused suite from the newly frozen Test/production tree, then the canonical offline validation command:

```text
node --test tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
tools/harness/validation/run
git diff --check -- openspec/changes/change-coordinator-worktree-validation-execution-boundary tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs tools/harness/change-coordinator/worktree-snapshot-contract.mjs tools/harness/change-coordinator/production.mjs
```

The Controller must inspect complete outputs, verify only the one new Test asset exists, reconcile it as permanent regression coverage, run `ponytail-review` on the complete Test-asset diff, and record Test Asset Retirement `PASS` before evidence freeze. Any tracked temporary helper/fixture, skip/todo/only marker, duplicate leaf without a distinct mutation, or unowned Test path is a retirement failure returned to Test with production frozen.

## Stop conditions

The first Test Correction 010 write requires completed Controller correctness review, mandatory ponytail review, Controller Spec Gate `PASS`, specific Test authorization, and Controller freeze of the append-only 379-leaf manifest. Test Asset Readiness, Test Asset Retirement, applicable regressions, the accepted new Test identity, and separate user re-confirmation bound to that identity are later prerequisites for renewed `TDD_READY`, not prerequisites for the first Test write. Any change to the retained 279 IDs, order, bodies, helpers, or evidence purposes; any missing/reordered/merged N114..N213 leaf; or any second Test path, fixture, production edit/seam, dependency, receipt/hash/timeout change, or runtime authority is an immediate contract blocker. The applicable retrospective and new Validator dispatch remain later Controller Gates. A parser outside the sole Test, transpile/emit/eval/source rewrite, OS tracing, process-group authority, relaxed assertion, Coordinator change, configurable signal/grace policy, retry/recovery, or widened runtime authority returns to Controller root-cause review.
