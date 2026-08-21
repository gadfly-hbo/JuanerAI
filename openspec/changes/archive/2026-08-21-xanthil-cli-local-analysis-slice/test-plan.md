# Test Plan: Xanthil CLI Local Analysis Slice

## Status and Test Gate

Status: **SPEC-PHASE TEST INTENT ONLY**.

This plan creates or runs no new executable test, dependency mutation, model call, or production behavior. Existing Controller evidence, including accepted TASK-005 deterministic Pi Adapter evidence and accepted TASK-007, remains authoritative. After Controller Spec Gate PASS for the TASK-006 CLI/Profile/example contract, `juaner_test` must derive its executable CLI/Profile/example tests, demonstrate a healthy test environment, and establish `EXPECTED_RED` caused only by absent or incorrect TASK-006 behavior. TEST-XCLI-013 remains deferred to credential-gated TASK-009; no real Pi prompt/provider proof is implied here.

The first test stack is frozen and TASK-007 accepted: JavaScript `.mjs`, Node's built-in `node:test`, root private ESM `package.json`/npm lockfile, npm `11.12.1`, exact project-local dependencies, and no TypeScript/compiler/build step. No repeat install or manifest/lock/dependency change is authorized; any future change requires separate authority.

Every test must cite its `TEST-XCLI-NNN` ID and all covered `AC-XCLI-NNN-NN` IDs. During implementation, assertions and negative cases are frozen. A correction returns to Test Design unless the approved brief explicitly allows it.

## Evidence Levels

| Level | Purpose | Real boundary required? | Model call? |
|---|---|---:|---:|
| L1 unit | pure fixture, metric, lifecycle, closed-contract, Finding, and Application rules | no | no |
| L2 Port contract | unchanged behavioral suite against deterministic double and every concrete Adapter | concrete Adapter half where available | no for deterministic halves; no model call for Pi protocol half |
| L3 integration | real filesystem, DuckDB/Python, Xanthil CLI/Application composition, and project-local embedded Pi SDK readiness | yes | only the specifically marked real-model case |
| L4 E2E | interactive accepted scenario and forbidden-side-effect observation | full personal Profile | yes, approved synthetic fixture only |
| L5 independent verification | frozen commands, scope, architecture, security, traceability, and Artifact inspection | as authorized | repeat only if credential/data boundary permits |

Mocks/doubles may isolate Pi/provider nondeterminism but cannot replace Product Core calculation, real Artifact semantics, or the real Adapter half of a contract suite. Narrative variability is never the calculation oracle.

A claimed negative matrix is executable only when every distinct mutation is scheduled and reported independently. Parameterized top-level leaves or named `t.test` subtests are acceptable, but one representative mutation cannot stand in for a terminal-event, tool/correlation, facade-result, failure-mapping, cancellation/timeout, or session-phase class. Each case must assert its own sanitized result and the relevant prompt, tool, retry, callback, unsubscribe, abort, idle, dispose, and late-admission effect counts.

## Planned Test Suites

### TEST-XCLI-001 — Canonical Fixture and Metric Oracle (L1)

- ACs: `AC-XCLI-004-01`, `AC-XCLI-004-02`, `AC-XCLI-005-01`, `AC-XCLI-005-03`, `AC-XCLI-005-04`
- Positive: exact fixture bytes produce the exact SHA-256, 20 rows, valid closed columns, baseline 10 orders/6 active members/4 repeat purchasers/rate `4/6 = 2/3`, recent 10 orders/9 active members/1 repeat purchaser/rate `1/9`, delta `-500/9 pp`, and decline comparison met.
- Boundary: inclusive window endpoints are counted; repeat status uses two distinct orders inside the same window; cross-window orders never combine; exact rational comparison precedes one-decimal display rounding.
- Negative: mutate one byte, row, header, row order, delimiter, line ending, date, order/member ID, missing value, duplicate order ID, or extra field and assert fail-closed semantics rather than cleaning.

### TEST-XCLI-002 — Finding and Interpretation Rules (L1)

- ACs: `AC-XCLI-005-02`, `AC-XCLI-005-03`, `AC-XCLI-011-01`, `AC-XCLI-011-03`, `AC-XCLI-012-01`
- Positive: verified reference values authorize only `F-001` with `supported` and the bounded window-local repurchase-rate decline statement.
- Boundary: any exact `recent < baseline` result supports the decline statement, equality or increase contradicts it, and no materiality or statistical-significance threshold is applied.
- Negative: calculation disagreement; omission of tiny-synthetic-sample, window-local, or no-causal/business-impact limitations; causal inference; real-world generalization; prescription; `Decision`; recommendation; or `Action` wording is rejected.
- Failure: zero denominator or an unapproved contract variation cannot divide, guess, or silently use a default.

### TEST-XCLI-003 — Discovery and Analysis Gate (L1/L3)

- ACs: `AC-XCLI-002-01` through `AC-XCLI-002-04`
- Positive: the vague question produces a complete proposal with exact source, windows, grain, population, formulas, decline comparison, output, and constraints; explicit confirmation passes the exact snapshot into Execution.
- Product Core prerequisite: `validateAnalysisProposal(proposal)` returns the exact approved unfrozen Proposal reference without mutation/freezing/default/I/O. Independently mutate every top-level and nested Proposal family—plainness/null/missing/extra, schema version, question/objective, source/fixture identity, windows, all five metric fields/order/cardinality, signal, output requirements, and constraints/tool order—and assert `CONTRACT_VERSION_UNSUPPORTED` only for version and `VALIDATION_FAILED` otherwise.
- Negative: silence, empty input, ambiguous acknowledgement, rejection, EOF, interrupt, or semantic edit does not confirm. This fixed scenario acknowledges `edit_not_supported`, awaits cancellation, and returns no replacement proposal; a semantic re-proposal loop is deferred to a separately gated Application revision.
- Side effects: before confirmation there is no run directory, source-row read, SQL, Python, analytical tool call, Evidence, or completed result; cancellation/EOF exits cleanly.

### TEST-XCLI-004 — Closed Analysis, Run, and Version Contracts (L1)

- ACs: `AC-XCLI-003-01`, `AC-XCLI-009-01`, `AC-XCLI-010-01`, `AC-XCLI-010-02`, `AC-XCLI-016-02`
- Positive: each of the four valid status variants accepts exactly its required fields and a valid UUIDv7 shared across records/path.
- Negative: unknown/missing/null fields, unknown enum/version, wrong ID/path/hash/media type, invalid timestamp order, wrong status discriminator, evidence on non-success, terminal detail on success, or `ended_at` while in progress fails closed.
- Compatibility: only exact supported `1.0` reads; no coercion, migration, backfill, or auto-upgrade path is invoked.

### TEST-XCLI-005 — Evidence Index and Reference Integrity (L1)

- ACs: `AC-XCLI-011-01` through `AC-XCLI-011-03`, `AC-XCLI-012-02`, `AC-XCLI-012-03`, `AC-XCLI-015-01`
- Positive: `F-001 -> E-* -> SRC-001 + Q/S/O-*` resolves within one run; optional JSON Pointer resolves; all hashes and results match.
- Negative: duplicate, malformed, foreign, dangling, cyclicly fabricated, unindexed, wrong-category, or checksum-mismatched references fail; supported/contradicted Findings require Evidence; all Findings require limitations.
- Authority: Markdown disagreement never overrides JSON/verified results.

### TEST-XCLI-006 — Agent Analysis Runtime Port Contract (L2)

- ACs: `AC-XCLI-006-01` through `AC-XCLI-006-03`, `AC-XCLI-007-01` through `AC-XCLI-007-03`, `AC-XCLI-013-02`, `AC-XCLI-013-03`
- Preserve the unchanged business `runAgentRuntimeContract` intent against the deterministic in-memory Runtime implementation and the Pi Adapter implementation. For the Adapter half only, pass the frozen deterministic test `sdkSessionFactory`; this dependency drives the bounded facade contract but is neither a real Pi session nor a provider substitute and performs no SDK prompt, credential, network, or model call.
- Positive: observe and assert the exact frozen construction request/policy at the injected boundary; assert Application provides two closed deeply frozen authoritative contexts through the business Runtime Port, their shapes are not respectively an Analysis Proposal or `{finding}`, the Adapter emits the exact frozen system-prompt text plus `XANTHIL_DISCOVERY_V1` and `XANTHIL_EXECUTION_V1` canonical JSON strings defined in `spec-task-009-prompt-clarification.md`, and neither Adapter string duplicates a first-scenario fixture/date/metric/result/Proposal/Finding fact outside its supplied business value. Assert context-to-output mappings, prompt-policy Discovery zero tool calls and Execution exactly-one-each-currently-admitted-tool calls in admitted order with `{}` before terminal JSON, explicit model binding, three sequential closed-empty-argument custom tools, correlation mapping, bounded tool-result JSON, complete Proposal and `{finding}` terminal parsing independent of token/chunk boundaries, actual-model verification, and only existing business values. These assertions prove Adapter translation, not real Pi option acceptance or a real SDK turn.
- Mutation-sensitive negative evidence independently schedules the exact R3.1 C1 disposition table in `spec-task-009-prompt-clarification.md`: keep direct Adapter rejection for closed-shape/order/type/frozen defects, source extra/absolute/traversal, output-requirements extra, constraints missing, malformed/duplicate IDs, and missing required interpretation fields; replace valid-wrong SHA with malformed SHA syntax and valid `F-999` with malformed ID; move only signal business mismatch, limitations business reorder, and prohibited-category business meaning to existing Application integration exact approved-context deep-equality evidence. No generic context category enum is invented. The existing prompt-policy/event/tool-execution matrices remain independently required.
- Failure-mapping, cancellation/timeout, and phase evidence are also independent: construction and prompt failures assert exact sanitized mappings and retry/effect counts; in-flight prompt and tool cancellation assert late-completion rejection and ordered quiescence; second Discovery, repeated Execution, and calls after completed/failed/cancelled assert exact no-new-prompt/tool counts. After successful Discovery, a direct `session.execute({confirmed_contract,cancellation_signal,deadline_seconds:0})` must return sanitized `TIMEOUT` only after the observed order `unsubscribe -> abort -> waitForIdle -> dispose`, with each cleanup effect exactly once and zero Execution prompt, tool callback, model result, retry, accepted late event, timer, or unhandled work. Missing, null, non-integer, negative, above-`300`, or unknown Execution input fields independently map to `PROTOCOL_FAILURE` before an Execution prompt/effect; no missing value defaults to `300`.
- The direct `0` Port call is the only fast Adapter timeout evidence and adds no clock, timer, sleep, fault, or test-mode seam. TEST-XCLI-015 separately proves Product Application supplies exactly `300` and owns the real end-to-end timer/cancellation path.

### TEST-XCLI-007 — Local Analysis Execution Port Contract (L2)

- ACs: `AC-XCLI-004-01`, `AC-XCLI-004-02`, `AC-XCLI-005-01` through `AC-XCLI-005-04`, `AC-XCLI-008-01` through `AC-XCLI-008-03`, `AC-XCLI-013-03`
- Run unchanged against a deterministic implementation and real DuckDB/Python Adapter.
- Positive: profile returns bounded metadata, SQL and Python independently return the exact closed result, and canonical asset bytes are returned for Application indexing.
- Negative: model/path/query/script/env/command input, arbitrary SQL/Python, file/network/extension/attach/copy/export/mutation, source change, malformed fixture, or oversized/unknown result is unavailable or rejected.
- Failure/boundary: deadline and cancellation stop accepted work; errors expose no engine/process/file-handle types.

### TEST-XCLI-008 — Run Artifact Port Contract (L2)

- ACs: `AC-XCLI-003-01` through `AC-XCLI-003-03`, `AC-XCLI-009-01` through `AC-XCLI-009-04`, `AC-XCLI-010-01` through `AC-XCLI-010-03`, `AC-XCLI-013-01`, `AC-XCLI-013-04`, `AC-XCLI-016-02`, `AC-XCLI-016-03`
- Run unchanged against an in-memory implementation and the real local filesystem Adapter.
- Positive: collision-free begin, fixed paths, atomic core commits, append-only assets, valid transitions, supported terminal read, and success-manifest-last ordering.
- Negative: collision, traversal, absolute/escaping symlink, wrong ID/path, overwrite, delete/list/repair, invalid transition, terminal mutation, unknown version, or unapproved filename fails without changing prior valid state.
- Crash/failure: injected failure at each write/rename boundary never yields false success; temporary/unindexed/in-progress state is non-success.

### TEST-XCLI-009 — CLI/Application Preflight and Confirmation Integration (L3)

- ACs: `AC-XCLI-001-01`, `AC-XCLI-001-02`, `AC-XCLI-002-01` through `AC-XCLI-002-04`, `AC-XCLI-003-01`, `AC-XCLI-003-02`
- Core-first gate: CLI leaves remain RED at the absent CLI seam, but no TASK-006 Worker implementation starts until the new TEST-XCLI-003 Product Core validator unit leaves are RED, the Core-only revision is GREEN, and Controller accepts that evidence. The original TASK-006 Worker then resumes unchanged with its preserved execution budget and calls the frozen public validator rather than duplicating Proposal semantics.
- Positive: closed `runXanthil({input,output,application})` accepts only the frozen direct-event async iterator and synchronous writer; it invokes `validateAnalysisProposal` before exposing/confirming a proposal, emits deeply frozen CLI-owned `ready`, a complete deeply frozen proposal clone, `awaiting_confirmation`, then one progress event after explicit confirmation and a success terminal only after a complete Product-Core-valid succeeded manifest. It creates one UUIDv7 run only after confirmation; Application originals remain distinct, byte/deep-equal, unfrozen, and unchanged.
- Final Test Correction 002: replace every minimal succeeded/failed/cancelled fixture with a complete Product-Core-valid terminal manifest; independently schedule invalid proposal/result-arm (`CLI_APPLICATION_INVALID`), direct-event versus IteratorResult, first-event, outer/input/output/Application envelope, clone/deep-freeze/non-mutation, deterministic `start`/`discover`/`confirm` error mapping, and every writer-stage mutation. Each leaf asserts one exact code—never `A || B`—and no later effect after a writer failure.
- Negative table: every missing/null/unknown/wrong-type outer/input/output/Application field; second iterator; synchronous/rejected/throwing `next`; IteratorResult wrapper; malformed/unfrozen/late/duplicate event; pre-question eof/interrupt with zero output/Application effect; writer throw/non-undefined return at ready/proposal/awaiting-confirmation/progress/terminal and output-after-terminal; unapproved question or unavailable command; missing/mutated/external/symlink fixture; unsafe/unwritable run root; unsupported version; exact preflight and `RUN_COLLISION` mapping; recognized post-confirmation pair and unknown fallback mapping; reject/edit/eof/interrupt before confirmation; and the exact post-confirmation race in which eof/interrupt wins over a late success. Assert exact cancellation/failure return/rejection shape, idempotent awaited `handle.cancel`, no run before confirmation, discarded late success, no model call when preflight fails, and no global/source write.

### TEST-XCLI-010 — Deterministic Full-Use-Case Integration (L3)

- ACs: `AC-XCLI-003-03`, `AC-XCLI-004-01`, `AC-XCLI-005-01`, `AC-XCLI-006-01`, `AC-XCLI-010-01`, `AC-XCLI-011-01`, `AC-XCLI-012-01`, `AC-XCLI-012-02`, `AC-XCLI-015-01`, `AC-XCLI-015-02`
- Use deterministic Agent Runtime plus real analytical and Artifact Adapters.
- Prove exact stage order, same session, exactly three allowed capabilities, independent calculation, final `F-001`, complete layout, checksums, provenance, Markdown, and terminal success.
- Recalculate from persisted fixture identity/assets without model/session history and obtain the oracle.

### TEST-XCLI-011 — Embedded Pi SDK Adapter Integration and Readiness (L3)

- ACs: `AC-XCLI-001-01`, `AC-XCLI-001-02`, `AC-XCLI-007-01` through `AC-XCLI-007-03`, `AC-XCLI-014-01`, `AC-XCLI-014-02`, `AC-XCLI-015-01`
- R3 supersedes the historical lazy/no-credential-read readiness rule. Omit
  real provider/model calls and prove production-default local-only preflight
  plus one Session through `createPiAgentAnalysisRuntime`; necessary local
  credential read is permitted, but no credential value may be exposed.
  Recorders prove no global configuration, session persistence, provider/model
  network call, ambient selection, raw transcript/event result, or injected
  production facade.
- A focused R4 embedded-SDK group records explicit `minimax-cn/MiniMax-M3`, `ModelRuntime.create({allowModelNetwork:false,refreshOnCreate:false})`, exactly one first-prompt local-only `refresh({allowNetwork:false})` before `getModel`, inert ResourceLoader, in-memory session, disabled built-ins/extensions, retry disabled, actual-model verification, and every stream/abort/timeout/cancellation failure mapping. Adapter contract RED proves closed think/JSON syntax and duplicate-member rejection with independent representative top-level and nested cases. Application tests prove reordered objects are semantically equivalent and wrong business values reject. It also proves Discovery zero tools, Execution exact native callback ordering/IDs/`{}` arguments, and dynamic response templates.
- R4 Test fixtures/helpers use only `minimax-cn/MiniMax-M3` as the approved positive identity. `xiaomi-token-plan-cn/mimo-v2.5-pro` remains only an explicit rejected/no-fallback negative identity; both are never accepted as defaults.
- TEST-XCLI-006 remains the deterministic Port behavioral suite; TEST-XCLI-021 proves actual project-local `0.84.2` resolution and compatible stack. TEST-XCLI-013 alone realizes the real embedded SDK session and proves the selected provider/model after explicit credential readiness.

### TEST-XCLI-012 — Real DuckDB/Python Integration (L3)

- ACs: `AC-XCLI-005-01` through `AC-XCLI-005-04`, `AC-XCLI-008-01` through `AC-XCLI-008-03`
- Execute the canonical fixture through real DuckDB and the canonical Python validator; assert identical exact results and canonical Q/S/O assets.
- Inspect/deny mutation, extensions, attach, copy/export, external/file access, model-supplied code, environment, subprocess, and network capability.
- Inject timeout, cancellation, malformed output, and implementation disagreement and assert sanitized failures.

### TEST-XCLI-013 — Real Pi-Backed End-to-End Acceptance (L4)

- ACs: `AC-XCLI-001-01`, `AC-XCLI-002-01`, `AC-XCLI-002-03`, `AC-XCLI-005-01`, `AC-XCLI-006-01`, `AC-XCLI-007-02`, `AC-XCLI-011-01`, `AC-XCLI-012-01`, `AC-XCLI-015-01`, `AC-XCLI-016-01`
- With explicit `minimax-cn/MiniMax-M3`, real E2E requires one complete succeeded synthetic run with semantic Proposal/Finding, exact native tool ordering, oracle, Evidence, and sanitized provenance. A stream defect or other failure remains fail closed; test repetition is evidence only, never a product retry.
- Capture only sanitized evidence that the embedded prompt path used the approved closed contexts, exact system prompt and Discovery/Execution envelopes, local Pi SDK `0.84.2`, inert resource discovery, and no raw row, credential, global setting, raw SDK/assistant text, or Adapter-copied business contract. The test must not assert token chunks or stochastic prose beyond the existing Product Core Proposal/Finding contracts.
- Calculation assertions come from deterministic assets, not exact prose or token chunks.
- Capture only sanitized provider/model/tool/Artifact evidence; inspect that no forbidden side effect occurred.

### TEST-XCLI-014 — Tool, Data, Path, Egress, and Secret Negative Matrix (L1/L2/L3)

- ACs: `AC-XCLI-001-02`, `AC-XCLI-004-02`, `AC-XCLI-004-03`, `AC-XCLI-006-01` through `AC-XCLI-006-03`, `AC-XCLI-014-01` through `AC-XCLI-014-03`
- Attempt generic Pi built-ins, shell, read/write/edit, arbitrary SQL/Python, network/Web Research, package/extension, action tools, path traversal, absolute/external/symlink paths, extra sources, source-row return, real/user/enterprise data markers, credentials/env/global settings/project-control reads, and unexpected provider destinations.
- Assert rejection before access/transmission where observable, fail-closed terminal semantics where a run exists, no successful Finding, and no sensitive value in prompt/event/log/trace/test/Artifact evidence.
- Verify documentation/UI makes no sandbox or enterprise-security claim.

### TEST-XCLI-015 — Failure, Timeout, Cancellation, and No Retry (L1/L2/L3)

- ACs: `AC-XCLI-002-04`, `AC-XCLI-010-02`, `AC-XCLI-013-01` through `AC-XCLI-013-04`
- Inject every stable post-confirmation error at each allowed stage and assert exact stage/code, one terminal attempt, no Evidence reference, and no success.
- Using only the already-approved Application-level time control, prove Application supplies exactly `30` seconds to each analytical call and exactly `300` as the Agent Runtime Execution deadline, owns the end-to-end post-confirmation timer/cancellation path, and never interprets either value as a business threshold. This adds no clock/timer/fault/test-mode seam to the Agent Runtime Adapter, facade, business Port, Product Core, Application surface, or Profile.
- Ctrl-C before confirmation creates no run; after creation it stops admission, aborts runtime/analysis, discards late events, and commits cancelled when possible.
- Assert no automatic or same-run retry; a user retry allocates a new UUIDv7.

### TEST-XCLI-016 — Atomicity, Crash, and Terminal Immutability (L2/L3)

- ACs: `AC-XCLI-009-02`, `AC-XCLI-009-04`, `AC-XCLI-010-03`, `AC-XCLI-013-04`
- Fault-inject before/after temp write, close, rename, asset create, Evidence write, Markdown write, and terminal manifest write.
- Assert the prior file remains valid, success manifest is last, incomplete trees never claim success, terminal trees reject all writes, and next startup reports only read-only `abandoned candidate` for leftover in-progress state.
- Assert no cleanup, recovery, repair, or deletion is silently performed.

### TEST-XCLI-017 — Provenance and Offline Reproduction (L1/L3)

- ACs: `AC-XCLI-011-02`, `AC-XCLI-012-02`, `AC-XCLI-015-01`, `AC-XCLI-015-02`
- Resolve one successful run from `F-001` through every ID/hash to the exact source snapshot, date windows, Q/S/O assets, runtime/model identity, and run ID.
- With Pi/model unavailable and no transcript, rerun recorded deterministic calculations against the matching fixture and reproduce all metrics.
- Negative: absolute path, mtime dependence, missing version/hash, ambient model identity, cross-run reference, or credential field fails validation.

### TEST-XCLI-018 — Markdown Projection Consistency (L1/L3)

- ACs: `AC-XCLI-012-01` through `AC-XCLI-012-03`
- Positive: Summary/Evidence include the exact question, values, Finding status, limitations, provenance, asset references, and checksums consistent with machine records.
- Negative: mutate a number, status, statement, reference, limitation, causal/prescriptive language, or completion label and block finalization.
- Failure-state UI must not render partial Markdown as a completed Summary/Evidence result.

### TEST-XCLI-019 — Activation, Version, Rollback, and Retirement (L1/L3)

- ACs: `AC-XCLI-016-01` through `AC-XCLI-016-03`
- Assert the sole Profile factory has the frozen four-field configuration, returns only `{application}`, composes behavior through the three concrete Adapters without test-only inspection exports, and has no source-row/read/run/root/Pi/credential/network effect before `runXanthil` confirmation. Assert feature composition exists only in personal Profile after gates, unknown versions fail closed, and no migration/backfill/dual-read exists.
- Disable composition as rollback/retirement and verify fixture plus terminal/incomplete runs remain byte-identical and readable only under supported contracts.
- Assert there is no silent SDK-to-RPC runtime fallback.

### TEST-XCLI-020 — Out-of-Scope Surface Absence (L1/L3)

- ACs: `AC-XCLI-014-03`, `AC-XCLI-016-04`
- Inspect CLI commands, Port capabilities, Profile composition, dependencies, changed paths, and runtime effects for the absence of resume/list/delete/repair, real data, extra formats, Web Research, Workflow, Desktop, Console, enterprise, SQLite, trace, semantic capabilities, packs, Decisions, recommendations, and Actions.
- Unexpected surface or path fails scope verification even if target tests pass.

### TEST-XCLI-021 — Reproducible Dependency and Engine Contract (L3)

- ACs: `AC-XCLI-001-01`, `AC-XCLI-007-01`, `AC-XCLI-008-01`, `AC-XCLI-016-01`
- Against the accepted TASK-007 root `package.json`, lockfile, and project-local install, verify root private ESM configuration, `packageManager=npm@11.12.1`, Node `>=22.19.0`, exact direct dependencies only `@earendil-works/pi-coding-agent@0.84.2` and `typebox@1.3.7`, DuckDB CLI exact `1.5.2`, Python `>=3.9` standard library, no ambient Python packages, and no global Pi resolution.
- Negative: remove/alter lock resolution, use incompatible Node/npm/DuckDB/Python, resolve ambient global Pi/Python packages, add another direct dependency, add TypeScript/compiler/build tooling, or change package-manager/lockfile and assert readiness fails.

### TEST-XCLI-022 — Regression, Architecture, Security, and Scope Command Set (L3/L5)

- ACs: `AC-XCLI-016-01`, `AC-XCLI-016-04`
- Planned target commands are `node --test tests/unit/xanthil-local-analysis/*.test.mjs`, `node --test tests/contract/xanthil-local-analysis/*.test.mjs`, `node --test tests/integration/xanthil-local-analysis/*.test.mjs`, and `node --test tests/e2e/xanthil-local-analysis/*.test.mjs`, plus `node --check` for each changed production/test `.mjs` file. Run architecture/dependency-direction, secret/sensitive-data, forbidden-path, and contract/traceability static checks as frozen during Test Design.
- There is no lint, typecheck, transpile, bundle, or build step in this slice. The accepted dependency install is reused without mutation; no repeat install, manifest edit, dependency change, or real-model command is smuggled into static validation.
- A skipped/not-applicable check requires an explicit risk reason and Controller approval; a passing target suite cannot override architecture, security, scope, or traceability failure.

## Coverage by Risk Class

| Risk/evidence class | Planned coverage |
|---|---|
| positive reference journey | TEST-XCLI-001, 010, 012, 013 |
| negative tool/path/data/egress | TEST-XCLI-006..009, 014, 020 |
| calculation boundary and oracle | TEST-XCLI-001, 002, 007, 012, 017 |
| closed persistent contracts | TEST-XCLI-004, 005, 008, 016, 019 |
| replaceable Port contracts | TEST-XCLI-006, 007, 008 |
| failure/cancellation/timeout | TEST-XCLI-006..008, 015, 016 |
| integration | TEST-XCLI-009..012, 017..019, 021 |
| real model E2E | TEST-XCLI-013 |
| regression/quality/scope | TEST-XCLI-020..022 |
| independent verification | rerun/inspect approved TEST-XCLI evidence after freeze |

## Expected RED Rules

`EXPECTED_RED` is valid only when:

1. Node's built-in test runner and the accepted TASK-007 frozen dependencies install/run from the approved clean root private ESM configuration;
2. unrelated baseline health checks pass;
3. each target failure points to absent Xanthil behavior, not missing credentials for deterministic tests, invalid fixture setup, broken test code, environment drift, or an unapproved dependency;
4. the real-model test may be skipped during RED only with an explicit reason, while its deterministic contract and E2E substitute still fail for missing behavior;
5. the Test role returns exact commands, observed failures, AC mapping, and unchanged production paths.

No new TASK-005 result is claimed in this document. TASK-005 deterministic
acceptance and the former TASK-006/TASK-009 planning statements are historical
evidence only; current Test-role work is controlled solely by the latest
Controller-approved gate, presently TASK-010 remediation is pending Spec Gate.

## TASK-010 Validator-FAIL Remediation R3 Test Design Intent

This section is pending Controller Spec Gate PASS. It changes no test yet and
uses existing Requirement/AC identifiers rather than inventing a second test
inventory.

`TEST-XCLI-009` integration RED must prove that missing/mutated/malformed or
escaping fixture, unsafe run root, and unavailable/mismatched runtime/model
reject before `openSession`, Discovery, Proposal, model prompt, run allocation,
or Artifact write. It must separately prove that the preflight local identity
read is not an analytical read and supplies neither rows nor bytes to Runtime.
The post-confirmation Source Adapter test must mutate the fixture after
preflight and observe exactly `SOURCE_CHANGED` and no Finding; the already
valid initial descriptor remains unchanged. A successful test clock proves
that `read_at` equals the preflight identity-read observation, not
`confirmed_at`, mtime, model time, or the later analytical recheck.

`TEST-XCLI-006` and `TEST-XCLI-013` contract/integration RED must use a
test-private virtual scheduler, never wall-clock waiting, for permanently
pending Runtime, native-tool callback/Analysis, and Artifact operations. They
must observe deadline admission closure, one shared aborted signal, user
cancellation only when Runtime settles before deadline and otherwise `TIMEOUT`,
no late Application result/asset/manifest effect,
and no retry/background repair. At deadline it must prove no terminal
replacement is attempted and an already-created run stays in-progress as an
abandoned candidate. Adapter contract doubles must also fail if a post-abort
operation mutates or a pending `beginRun` creates a late run.

Artifact RED independently proves R3 publication units: `beginRun` exposes a
complete directory plus initial manifest or no run; each contract/asset/replace
write is one final atomic publication; and `commitSuccess` may leave complete
unindexed Evidence/Markdown candidates but succeeds only when final succeeded
`run.json` publishes. Deadline before that final point must expose neither
success manifest nor CLI success; no next unit may start after abort. Pending
doubles guarantee no mutation; Application proves late Promise values cannot
recover admission without asserting impossible physical-I/O cancellation.

`TEST-XCLI-006` Agent Runtime contract RED must make requested model/tool names
differ from the facade's observed `session.model`/`getActiveToolNames()` value;
it accepts only the actual matching projection and rejects either mismatch.
It must not inspect Pi types or treat request echoes as observation. The
R3 readiness test proves one cached local-only runtime/model then one
same-session AgentSession, no provider/model network call or credential
exposure; necessary local credential read is permitted. Existing
R4 parser/template, no-extension, tool ordering, object-order, and no-fallback
cases remain required unchanged.
