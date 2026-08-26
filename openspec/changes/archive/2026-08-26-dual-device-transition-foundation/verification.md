# Verification: Dual-device Transition Foundation

## Current Read Model

- Current lifecycle: `CONTRACT_CORRECTION_008_SPEC`
- Spec verdict: `SPEC_READY`
- Controller verdict: `CC008_SPEC_READY_REPEAT_PENDING`
- Baseline: `5236867c75b2166946dd9d2b81f19f0bd10d4f2e`
- Branch: `work/macbook/dual-device-transition-foundation`
- Spec role: formal `juaner_spec`
- Scope written by Spec: `openspec/changes/dual-device-transition-foundation/**` only
- Product/Test/implementation/dependency/activation writes by Spec: none; existing unaccepted Test/production files remain untouched
- RED/GREEN/Regression/Retirement/Validator/Acceptance/Archive: TDD_READY coverage invalidated / focused GREEN rejected / broader regression and later Gates not claimed
- Next Gate: fresh independent complete-diff/lean Controller Spec review. Production, Tests, host keys/trust path, runner, Mode Activation, and H/P/C/A remain frozen

## Frozen Inputs Read

- repository authorities named in Exploration;
- unique approved dual-device mode planning input;
- existing harness/Git entrypoints and current package/toolchain graphs;
- current project Agent configuration/routing;
- archived R2 OpenSpec style and required templates.

The worktree contained pre-existing Controller-owned changes in `.juanerai/project-control/**`; this Spec neither owns nor modifies them.

## Spec Completeness Matrix

This table preserves the CC006 formal-Spec self-read. It is not a current completeness verdict: the repeated Controller review and the CC007 trust-anchor conflict below invalidate every “exact/closed” claim whose missing facts they name.

| Evidence | Current result | Source |
|---|---|---|
| Foundation/R2 classification | present; greenfield forbidden; retrospective mandatory | proposal, exploration |
| objectives, scope, paths, non-goals | present and closed | proposal |
| public CLI/library/dependency/error seams | exact seven-method/command surface; sole factory returns seven explicit dependencies including runtime; no hidden channel | design |
| manifest/state/lock/WIP | exact StateV1, sole operation mutex, long-held Change lock, stable local/remote Evidence enumeration admission; no project-control digest/owner epoch | design + REQ-001/002 |
| formal roles/Gates | exact eight delegated Gate definitions, serial cooperative settlement, durable automatic advance, reserved Controller decisions only | design + REQ-003 |
| Controller records | exact dispatch/conditional/block/post-handoff variants, Ledger mapping/state effect/idempotency; no synthesized Gate/implementation | design + REQ-001/002 |
| revision/cleanup input | exact Revision root-cause/RED/budget/self-hash contract and Closure record/evidence/SHA/tree proof | design + REQ-002 |
| append-only independent Ledger | all 17 event detail/outcome/evidence/prior-next variants; native Git history, canonical reconstruction/idempotency/readback | design + REQ-004 |
| interruption/retry/recovery | PREPARED/OBSERVED receipts, original IDs/effects, races/linearization/bounds/dirty stop closed | exploration + design + REQ-005 |
| candidate staging/commit | exact staged index tree feeds commit expected tree, then Candidate tree/status readback | design + REQ-006 |
| final validation/publish/PR | generation invalidation, exact Handoff prior-tip order, terminal returned IDs, delivery evidence, no merge | design + REQ-007 |
| inactivity and deferred Activation | explicit | proposal + REQ-008 |
| positive/negative/failure/interruption Tests | planned with independent leaves | test-plan |
| Test Asset Retirement | planned ledger and Gate | test-asset-retirement |
| REQ -> AC -> TEST -> TASK | complete planned mapping | traceability |
| mandatory retrospective | artifact present; final facts pending | retrospective |

## Ponytail Revision 001 Disposition

| Finding | Disposition |
|---|---|
| dual public control planes | deleted five public stage methods/commands; retained seven boundary methods; Worktree/Gate/Candidate/validate/publish are internal to `runUntilStop` |
| duplicate JSONL hash chain | deleted `previous_record_sha256` and `record_sha256`; Git commit SHA/parent, canonical bytes, contiguous sequence and remote-tip readback remain |
| duplicate owner epoch | deleted; ownership uses writer device, lock/process-run ID, state/version and evidence tip with durable handoff |
| cleanup state contradiction | deleted `CLEANUP_READY`; `prepareCleanup` is pure read-only report |
| project-control digest | deleted; Dispatch identity/self-hash/baseline plus durable Ledger dispatch remain, and digest is explicitly non-authoritative |
| oversized Test matrix | reduced planned Test identities from 15 to 12 and remapped every AC; removed tests for deleted mechanisms while preserving normal/failure/interruption/dirty/scope/Ledger/remote/PR readback coverage |

- Package line count before revision: 1,469.
- Package line count after revision: 1,408.
- Net deletion: 61 lines.

## Controller Repeat Lean Review and Spec Gate

Historical result before Test intake; superseded for release purposes by the later `TEST_CONFLICT` below.

- Verdict: `PASS`.
- Ponytail result: `Lean already. Ship.`
- The removed stage methods, record-level hash chain, owner epoch, project-control digest, and cleanup state remain absent.
- Implementability Revision 002 adds only the required cooperative Codex-host settlement protocol to the existing sole `runUntilStop` entry; it adds no Agent runner, gateway, queue, daemon, poller, role, or second control plane.
- The Foundation contract remains Global WIP = 1, inactive until Mode Activation, and bounded to the approved implementation/Test paths.
- Controller release: `juaner_test` may start; Worker, live external canaries, Mode Activation, and H/P/C/A remain unauthorized.

## Implementability Revision 002

| Finding | Disposition |
|---|---|
| injected Agent dependency had no production attachment | removed `agent` from dependencies/adapters/tests; `runUntilStop` now accepts required null-or-closed `agent_settlement` |
| Agent request could not reach the real Mac mini host | null settlement persists/readbacks `invocation_requested` and returns exact STOPPED/DISPATCH_AGENT next action |
| child start/result provenance was underspecified | STARTED then RESULT must match correlation, child identity, route/sandbox/hashes/state version and be durably recorded; exact duplicates converge, all other conflicts block |
| Activation seam was deferred to an unspecified gateway | Mode Activation now requires the concrete Mac mini loop from null settlement through real named-child STARTED/fixed RESULT to next-state readback |
| Test surface referenced an Agent gateway | replaced with deterministic host-settlement fixtures; validation remains injected and no real Agent/model runs in Foundation |

- Package line count before implementability revision: 1,408.
- Package line count after implementability revision: 1,459.
- Lean delta: +51 lines, limited to the executable host-settlement contract, fixtures, Activation canary, mappings, and revision evidence; no new runtime surface or role was added.

## Contract Correction 003 — TEST_CONFLICT

The fresh Test intake stopped before Test writes or causal RED. Root cause: three public-interface facts were still left to invention even though the seven-method surface was frozen.

| Conflict | Bounded correction |
|---|---|
| Dispatch named Gates but not their executable contract | defined exact closed `GateDefinitionV1`, eight IDs/order, states, authority, role/result/validation/evidence/verdict/failure action; matching durable internal Gates advance with no MacBook round trip |
| Controller method had no record schema or state effect | defined exact `ControllerRecordV1`, dispatch/conditional/block/post-handoff vocabulary, Ledger mapping, record-only facts, idempotency and `authorizeRevision` exclusivity |
| Adapter composition/methods were prose only | froze sole `createCoordinatorAdapters(options)` export and exact filesystem/Git/PR/validation/clock/ID interfaces; same Git driver targets its `.git` Adapter and the deterministic double |
| failure call logs could not be asserted | froze read-only rejected-admit/check behavior and exact empty revision/controller/cleanup plus semantic failure codes |

- Package line count before Contract Correction 003: 1,459.
- Package line count after Contract Correction 003: 1,685.
- Correction delta: +226 lines; all added detail closes the three TEST_CONFLICT interfaces and their existing mappings, with no public method, role, path, dependency, Agent runner, Test identity, or live effect added.
- Mapping target remains 8 REQ / 45 AC / 12 planned Test identities / 14 tasks / 7 public methods.

## Controller Repeated Spec Gate After TEST_CONFLICT

- Verdict: `PASS`.
- Ponytail result: `Lean already. Ship.`
- The eight delegated Gate rows are closed, ordered, and executable through the sole `runUntilStop` entry without MacBook per-Gate acknowledgements.
- `ControllerRecordV1` is limited to Change-boundary Ledger facts; it cannot synthesize internal Gate PASS, authorize revision, merge, archive project-control, or start another Change.
- `createCoordinatorAdapters(options)` is the sole Adapter export, and its Git contract is sufficient for the same deterministic/temporary-repository driver without introducing a second orchestration surface.
- Controller release: the existing `juaner_test` correction may resume; production, Worker, live canaries, Mode Activation, and H/P/C/A remain unauthorized.

## Test Intake and Replan Status

- Initial Test intake: causal module-absence RED observed, but `TDD_READY` not accepted because Candidate/final/publish success behavior and the production Git Adapter driver were not exercised.
- Contract correction: Test returned `TEST_CONFLICT`; Contract Correction 003 closed the missing Gate, Controller-record, and Adapter contracts, and the repeated Spec Gate passed.
- First Test correction: `TDD_READY NOT_ACCEPTED`. The scripted evidence receipts did not preserve valid/equal Git commit and remote-tip SHAs, PR readback did not preserve the upsert body digest, filesystem doubles did not durably retain state across calls, CLI inputs named a repository other than the temporary fixture, and early Ledger failure injection bypassed the claimed post-failure assertions.
- Complexity disposition: Test design/runtime-double topology was underestimated. The Controller authorizes one bounded Test replan at Sol/high; the four Test-owned paths remain unfrozen and Worker remains blocked.
- Release condition: helper health must independently prove state persistence, valid Git/PR receipts, exact fault injection point, temporary CLI repository/state roots, and full happy/fail-closed behavior before a new `TDD_READY` claim.

## Contract Correction 004 — Formal Test Replan TEST_CONFLICT

The formal Test replan returned a new `TEST_CONFLICT`; this is not accepted RED or TDD_READY. Controller verified that strict successful `authorizeRevision` still required Test to invent RevisionPackage values.

| Conflict | Bounded correction |
|---|---|
| Revision root cause and budget were field names only | froze three root-cause values, exact counter/key mapping, current `used_before`, and one-unit consumption against Dispatch limits |
| causal RED shape was absent | froze one closed acceptance/test/validation/failure/subject object and required later RED evidence equality |
| Revision self-hash was ambiguous | froze removal of only `package_sha256` plus recursive key ordering, JSON emission/rejection rules, UTF-8 bytes, and canonical input equality |
| Closure and conditional/stop positive fixtures still had value gaps | froze EvidenceRef kinds/order, conditional rule/decision binding, stop gate/reason mapping, and Closure record/SHA/tree/device evidence equality |

- Package line count before Contract Correction 004: 1,701.
- Package line count after Contract Correction 004: 1,739.
- Correction delta: +38 lines; no public method, state, Gate, Controller event, Git method, Test identity, dependency, path, schema version, or control plane was added.
- Mapping target remains 8 REQ / 45 AC / 12 planned Test identities / 14 tasks / 7 public methods.

## Unexecuted Evidence

No executable result exists yet. Exact commands, hashes, counts, RED cause, GREEN, canonical regression, Test Asset Retirement verdict, Candidate SHA, Validator verdict, and Controller acceptance must be added by their owning later Gates. Absence is not a failure of the Spec; claiming them early would be false evidence.

## Controller Repeated Spec Gate After Contract Correction 004

- Verdict: `PASS`.
- The Revision Package now has one closed positive construction: three root-cause values, exact causal-RED fields, exact budget counter/key/consumption mapping, same Frozen Candidate/Change/branch/Worktree binding, sorted admitted subsets, and one canonical self-hash rule.
- The adjacent positive Controller seams are executable without new authority: Evidence references have a closed vocabulary/order, conditional and stop decisions have exact bindings/reasons, and cleanup remains a read-only report over ordered Acceptance/merge/archive plus PR/ref/tree/two-device convergence evidence.
- Lean review: the correction adds no public method, state, Gate, Controller event, Git method, dependency, path, schema version, ownership token, integrity chain, control ref, project-control v2, parallel Change, Agent runner, or cleanup action.
- Counts remain 8 Requirements / 45 ACs / 12 Test identities / 14 tasks / 7 public methods / 8 delegated Gates / 8 Controller events / 16 Git methods; `git diff --check` passes.
- Controller release: the same fresh `juaner_test` may resume only the four Test-owned paths and consume Contract Correction 004. Production, Worker, live canaries, Mode Activation, and H/P/C/A remain unauthorized.

## Residual Risks After Contract Correction 004 Review

- The Change still introduces necessary durable state/recovery/publication machinery; the repeat lean review confirmed the duplicate control/ownership/integrity mechanisms remain removed, and Test/Validator must prevent their reintroduction.
- Foundation now freezes a concrete cooperative host-settlement loop and removes the Agent dependency entirely. Mode Activation cannot proceed until the Mac mini Codex host proves the real named-child next_action/STARTED/RESULT loop.
- PR behavior is proven with a deterministic double only in Foundation. Live GitHub branch/PR readback is an Activation prerequisite and never merge authority.
- Local state and Evidence Ref are new durable boundaries; Test and Validator must exercise write/readback/corruption/conflict paths, not only happy paths.
- Existing project-control changes must remain outside every role diff and must not be mistaken for Coordinator evidence.
- Contract Correction 003 is intentionally explicit; Test and Validator must prove its Gate and Adapter rows remain executable without becoming a second orchestration surface.
- Revision canonicalization and budget mapping now have one exact positive construction; Controller must confirm Test can consume it without reopening the schema.

## Controller Accepted TDD_READY

- Verdict: `TDD_READY PASS`; the four Test-owned files are byte-frozen at the hashes below. Worker may not change them.
- Independent preflight: all four files pass `node --check`; repository-wide `git diff --check` passes; no `skip`, `todo`, or `only` marker exists; no production, README, runner, dependency, Agent configuration, product path, live ref, PR, model, or network effect was created.
- Helper health passes before production import: state/lock persistence, valid equal 40-hex evidence commit/tip receipts, exact PR body digest, exact late-call fault injection, bounded OS-temp repository/bare origin, and safe teardown.
- `node --test tools/harness/change-coordinator/coordinator.test.mjs` exits 1 after the helper and 45-AC owner checks pass; every executable behavior identity is blocked only by missing `coordinator.mjs` (`ERR_MODULE_NOT_FOUND`).
- `node --test tools/harness/change-coordinator/cli.test.mjs` exits 1 after the real temp Git/state helper passes; the only failure is missing `cli.mjs` (`ENOENT`).
- `node --test tools/harness/change-coordinator/git.integration.test.mjs` exits 1 after the deterministic normal/conflict/mismatch/interruption driver and temp Evidence Git preparation pass; the only failure is missing `adapters.mjs` (`ERR_MODULE_NOT_FOUND`).
- The suite contains exactly 12 formal `TEST-DTF-001..012` identities plus one non-identity helper preflight. It covers the closed Dispatch/Gate/Controller/Revision/Closure contracts, serial settlements, one Validator auto-revision, Ledger integrity/failure/writer handoff, recovery, Candidate/final/publish failures, canonical CLI/environment/signal/no-shell behavior, and the same normal/negative 16-method Git driver for double and production Adapter.

| Test asset | Lines | SHA-256 |
|---|---:|---|
| `tools/harness/change-coordinator/coordinator.test.mjs` | 788 | `05126d998da2e2c01cb54942b3e744f7980bd62f126309fb24774539d1d936db` |
| `tools/harness/change-coordinator/cli.test.mjs` | 193 | `a332665cf60ecd72b39e4c5bbd639b061f8ccb3891075cb66551b622b0852b01` |
| `tools/harness/change-coordinator/git.integration.test.mjs` | 253 | `3ec33611c0ed4a40d879ae2829d8784eb8b976c808e54653d177b356250f7dfc` |
| `tools/harness/change-coordinator/fixtures.mjs` | 417 | `1dde9819c07a3028b232539b9f89ff2e0cd4cf5fe7f6d75f95a1a6332fc40049` |

- Toolchain: Node `v26.0.0`; Git `2.54.0`.
- Controller release: `juaner_worker` may implement only `coordinator.mjs`, `adapters.mjs`, `cli.mjs`, and `README.md`. The canonical runner remains conditional until focused GREEN. Mode Activation and H/P/C/A remain unauthorized.

## Controller TDD_READY Review After Contract Correction 004

- Result: `TDD_READY NOT_ACCEPTED`; this is a Test correction, not a new `TEST_CONFLICT`.
- Independently reproduced evidence: helper health passes; syntax and whitespace checks pass; the three focused commands exit nonzero only because `coordinator.mjs`, `cli.mjs`, and `adapters.mjs` are absent.
- Contract mismatch: the positive DISPATCHED fixture still emits EvidenceRef kind `dispatch`, while Contract Correction 004 freezes exact kind `DISPATCH`.
- CLI evidence gap: current leaves do not prove canonical raw input bytes, exact empty `base_environment` at the spawned boundary, or deterministic signal handling with no orphan child.
- Adapter evidence gap: the production temporary-Git driver proves only the happy path; the frozen conflict, remote-Head/evidence-tip mismatch, and interruption variants can still be bypassed.
- Recovery assertion is too broad to prove the frozen interrupted-state outcome.
- Controller release: one bounded correction of these named Test invariants is authorized on the same four Test-owned files. OpenSpec, production, runner, project-control, Worker, Mode Activation, and H/P/C/A remain frozen.

## Contract Correction 005 — Production/Test Interface TEST_CONFLICT

The latest formal Test Agent returned `TEST_CONFLICT`; this supersedes the prior release state without deleting its evidence. Existing Test and production files are unaccepted and were not modified by Spec.

| Conflict | Bounded correction |
|---|---|
| `commitExact.expected_tree` had no legal producer | kept all 16 Git methods; `readStaged` now returns exact `{ tree, entries }`, and Coordinator passes that tree to commit then verifies Candidate parent/tree/branch/status |
| runtime identity reached Coordinator through a hidden Symbol | factory now returns exactly seven enumerable dependencies including closed data-only `{ repository_root, state_root, device, process_run_id }`; Symbols/hidden keys/ambient/global channels are forbidden |
| state/writer authority across CLI calls was implicit | every call canonically hydrates active manifest/state/lock from `runtime.state_root`; runtime roots must match manifest, and lock/Ledger writer identity comes only from runtime |

- Package line count before Contract Correction 005: 1,791.
- Package line count after Contract Correction 005: 1,815.
- Correction delta: +24 lines; Git methods remain 16 and no public method, state, Gate, Controller event, Test identity, permission, dependency package, path, schema version, or control plane was added.
- Prior TDD_READY/implementation release is invalid for the changed contract. Repeated Spec Gate, corrected Test evidence, and repeated TDD_READY are required before Worker resumes.

## Controller Repeated Spec Gate After Contract Correction 005

- Result: `PASS / SPEC_READY`.
- Scope: the correction changes only the existing internal dependency and Git receipt contracts. It adds no public Coordinator method, Git method, state, Gate, Controller event, permission, path, dependency package, control plane, product effect, Mode Activation, or H/P/C/A authority.
- Interface consistency: `createCoordinatorAdapters` now returns exactly seven enumerable dependencies, including the closed data-only `runtime`; hidden/Symbol/ambient/global channels are forbidden. The Git surface remains 16 methods, and `readStaged.tree` is the sole legal producer for `commitExact.expected_tree`.
- Lifecycle consistency: all public calls canonically hydrate from `runtime.state_root`; runtime roots/device/process identity bind state, lock, and Ledger writer authority. Candidate preparation binds staged tree, commit input, commit readback, branch, and clean status.
- Mapping: 8 Requirements, 45 Acceptance Criteria, 12 Test identities, and 14 Tasks remain unique and mapped.
- Static checks: `git diff --check` and the complete Change trailing-whitespace scan passed. The optional external OpenSpec CLI could not be executed because no local binary was installed and the package fetch did not complete; this is recorded as not run, not as a PASS.
- Release: Test may restart only on its four owned assets. Existing Test hashes, TDD_READY, and production GREEN evidence remain invalidated until new causal RED is accepted.

## Controller Accepted Corrected RED and Repeated TDD_READY

- Verdict: `TDD_READY PASS_AFTER_CONTRACT_CORRECTION_005`.
- Test scope: only `coordinator.test.mjs`, `cli.test.mjs`, `git.integration.test.mjs`, and `fixtures.mjs` changed. Production, OpenSpec authority, runner, project-control, Mode Activation, and H/P/C/A remained frozen during Test execution.
- Test integrity: four-file syntax, repository whitespace, helper preflight, exact 12 Test identities, no skip/todo/only marker, and the corrected Symbol-own-key assertion all pass. The suite contains 69 explicit nested behavior leaves plus bounded table rows.
- Causal RED: Coordinator exits 1 with 82/124 passing, CLI exits 1 with 0/2 passing, and Git integration exits 1 with 4/20 passing. Failures bind explicit runtime/dependency closure, canonical hydration/writer identity, Revision/Closure success and mutation rules, Ledger idempotency, staged index tree, Candidate/final-command readback, PR/handoff ordering, atomic state/lock/liveness, and exact Git receipt behavior. Helper and fixture boundaries pass first; no Test-owned exception remains.

| Test asset | Lines | SHA-256 |
|---|---:|---|
| `tools/harness/change-coordinator/coordinator.test.mjs` | 1,096 | `737d088b24bf115fc8181af2c62865fa56346db1796551f819de039a973ce41c` |
| `tools/harness/change-coordinator/cli.test.mjs` | 199 | `a8450e89fd2ebff9d8b367b8cb0620438a9f36fdca45e5b309b3dddb2bab19fd` |
| `tools/harness/change-coordinator/git.integration.test.mjs` | 379 | `ea5d67febdb51afaf97681269998542c861da90e052fe6594db629eb3acf3f97` |
| `tools/harness/change-coordinator/fixtures.mjs` | 476 | `b718fd8c242aa5bd975f223d4ebdd0df00dcff01a8013dfff561b8e00a76bb22` |

- Release: only the same bounded Worker revision may resume, and only on `coordinator.mjs`, `adapters.mjs`, `cli.mjs`, and `README.md`. A second Worker revision/replan is not authorized. The canonical runner remains conditional on Controller-verified focused GREEN.

## Device-handoff Test Conflict and Corrected RED

- Worker conflict: the prior corrected happy path still attempted `recordControllerEvent(DISPATCHED)` from the Mac mini execution Coordinator, while Correction 005 requires Controller records to be written only from `runtime.device: 'macbook'`. Worker correctly stopped rather than weakening device ownership.
- Test correction: one fresh MacBook Controller view and one Mac mini execution view now share the same deterministic filesystem/Git/Evidence/state closures but communicate only through the seven public methods and canonical hydration. No production bypass or hidden property was introduced.
- Negative authority proof: Mac mini Controller-record writes and MacBook execution calls each return `COORDINATOR_DEVICE_MISMATCH`; the exact device-isolation leaf independently passes.
- Corrected causal RED: helper health and device isolation pass. The first shared-state handoff then fails in production at canonical cross-instance Controller-record hydration with `COORDINATOR_STATE_CONFLICT`; dependent happy paths stop at that real prerequisite. Current totals are Coordinator 24/50, CLI 0/1, and Git 16/20. Remaining direct Git failures are hidden factory-option admission and trailing-LF staged content digest.
- New frozen hashes: Coordinator Test `737d088b24bf115fc8181af2c62865fa56346db1796551f819de039a973ce41c`; CLI Test `a8450e89fd2ebff9d8b367b8cb0620438a9f36fdca45e5b309b3dddb2bab19fd`; Git integration `ea5d67febdb51afaf97681269998542c861da90e052fe6594db629eb3acf3f97`; fixtures `b718fd8c242aa5bd975f223d4ebdd0df00dcff01a8013dfff561b8e00a76bb22`.
- Repeated decision: `TDD_READY PASS`. The same bounded Worker revision may resume on the same four production paths; runner remains frozen until focused GREEN.

## Revision-subject Test Conflict and Corrected RED

- Worker conflict: after the first Validator FAIL, the Test fixture still emitted baseline-bound Test/Worker settlements even though the same Worktree remains bound to the current Frozen Candidate. Worker stopped instead of weakening the exact-current-subject check.
- Test correction: `resultSettlement` now accepts an explicit subject SHA. Each driven RESULT reads the current subject through the public `check` method immediately before settlement; the initial pass remains baseline-bound and the automatic revision pass is Candidate-bound.
- Negative proof: the first automatic revision explicitly rejects a baseline-bound Test RESULT with `COORDINATOR_GATE_FAILED`, then accepts the same RESULT only when bound to the current Candidate. The second Validator FAIL is also Candidate-bound.
- Controller independent rerun: Coordinator 110/125, CLI 0/1, Git integration 16/20. Helper/device/automatic-revision subject paths pass. The remaining failures are production gaps in Controller-event Ledger hydration/readback, cleanup read-only behavior, JSONL/writer fail-closed checks, CLI admission, hidden factory options, and staged trailing-LF content digest.
- Integrity: all four Test files pass `node --check`; repository `git diff --check` passes; no skip/todo/only marker or new Test identity exists.

| Test asset | Lines | SHA-256 |
|---|---:|---|
| `tools/harness/change-coordinator/coordinator.test.mjs` | 1,118 | `d5b558105a00e30f58a0a3f5bee69236495395bbcd8d004bd15bbc8a830be001` |
| `tools/harness/change-coordinator/cli.test.mjs` | 199 | `a8450e89fd2ebff9d8b367b8cb0620438a9f36fdca45e5b309b3dddb2bab19fd` |
| `tools/harness/change-coordinator/git.integration.test.mjs` | 379 | `ea5d67febdb51afaf97681269998542c861da90e052fe6594db629eb3acf3f97` |
| `tools/harness/change-coordinator/fixtures.mjs` | 476 | `e7976cf3a98bc9a49847c021ac503dd03c7dadbc5a4fbefee929fed4601f2640` |

- Repeated decision: `TDD_READY PASS_AFTER_REVISION_SUBJECT_CORRECTION`. The same bounded Worker revision may resume only on the four production paths. The canonical runner remains frozen until Controller-verified focused GREEN.

## Cleanup Read-effect Test Conflict and Corrected RED

- Worker conflict: the cleanup zero-effect assertion matched the substring `commit` and therefore misclassified the contract-required read-only `git.readCommit` tree proof as a mutation.
- Contract decision: no Spec or Git-interface change. `prepareCleanup` must retain independent Candidate/merged commit-tree readback. The Test classifier now names actual mutation methods instead of matching substrings.
- Controller independent rerun: Coordinator 125/125. Both incomplete and complete Closure leaves pass while preserving zero mutation calls and the independent `readCommit` proof. CLI remains 0/1 and Git integration 16/20 on production-only gaps.
- Integrity: the other three Test assets are byte-identical; all Test syntax, no-skip/todo/only, and repository whitespace checks pass.

| Test asset | Lines | SHA-256 |
|---|---:|---|
| `tools/harness/change-coordinator/coordinator.test.mjs` | 1,136 | `16d0f95a7d2af2118ed9afe6d9c90f7c670ac53e97f85cd7ad61dc78c4e110cc` |
| `tools/harness/change-coordinator/cli.test.mjs` | 199 | `a8450e89fd2ebff9d8b367b8cb0620438a9f36fdca45e5b309b3dddb2bab19fd` |
| `tools/harness/change-coordinator/git.integration.test.mjs` | 379 | `ea5d67febdb51afaf97681269998542c861da90e052fe6594db629eb3acf3f97` |
| `tools/harness/change-coordinator/fixtures.mjs` | 476 | `e7976cf3a98bc9a49847c021ac503dd03c7dadbc5a4fbefee929fed4601f2640` |

- Repeated decision: `TDD_READY PASS_AFTER_CLEANUP_CLASSIFIER_CORRECTION`. The same bounded Worker revision may resume only on the four production paths; canonical runner remains conditional.

## Controller Dual-axis Code Review — GREEN Rejected

- Standards review: `FAIL`, six findings. High-risk findings cover non-NUL-safe path inventory/type ambiguity, absent expected-version CAS, unbounded child termination after timeout, and non-atomic Ledger append cleanup. Root `README.md` was also changed outside the allowed Foundation path.
- Spec review: `FAIL`, eight blocking findings. Dispatch nested schemas, Controller records, Agent settlements, Revision/Closure, Candidate revision parent/index evidence, state progression, Ledger idempotency, and Final Handoff ordering/contents are missing or partial.
- Direct public probes independently confirmed the shallow admission defect: re-signed manifests with negative timeout, extra Role/Gate/Permissions fields, wrong Gate state, or empty intent goal were all admitted and persisted. DISPATCHED records with extra detail, wrong evidence kind, or wrong evidence subject were also accepted.
- Test result consequence: Coordinator 125/125, CLI 2/2, and Git 20/20 remain historical execution facts for the reviewed tree, but no longer establish contract GREEN. The accepted Test freeze is invalidated and production/runner are frozen.
- Root-cause classification: incomplete Test coverage against an already explicit frozen design, plus production defects inside that contract. No user/product/Schema/permission decision is missing; no contract expansion is authorized.
- Release condition: a Test-only correction must create causal fail-closed evidence for every named review gap, pass helper/ownership/retirement preflight, and receive a repeated Controller TDD_READY before the same bounded Worker may resume.

## Review-driven Corrected RED and Repeated TDD_READY

- Test scope: the formal `juaner_test` changed only the four Test-owned paths. Production, OpenSpec authority, project-control, root README, canonical runner, Mode Activation, and H/P/C/A remained frozen during Test execution.
- Coverage disposition: all eight Spec findings and the four high-risk Standards findings now have causal executable leaves. This includes recursive Dispatch/Controller/Settlement/Revision/Closure closure; exact lifecycle states; same-owner concurrent settlement CAS; current-Head revision commit and complete staged inventory; canonical Handoff ordering/content; NUL-safe opaque path and symlink/submodule rejection; bounded SIGTERM escalation; and clean Ledger retry after commit failure.
- Controller independent execution: Coordinator exits 1 with 119/224 passing and 105 causal failures; CLI exits 1 with 4/8 passing and 4 causal failures; Git integration exits 1 with 19/26 passing and 7 causal failures. The same-owner STARTED race deterministically returns one fulfilled and one rejected call instead of byte-identical convergence.
- Integrity: all four Test files pass `node --check`; `git diff --check` passes; exactly 12 `TEST-DTF-*` identities remain; no skip/todo/only marker exists; no Test conflict or new public contract was introduced.

| Test asset | Lines | SHA-256 |
|---|---:|---|
| `tools/harness/change-coordinator/coordinator.test.mjs` | 1,513 | `39ace71d882d056d8405bbe1ee752bd54764303db94fe210b843cc5477a5083a` |
| `tools/harness/change-coordinator/cli.test.mjs` | 207 | `d7b8d8e0d50d6c4c04ec5186f889b701330f0068b9dce9490af61840f77259b0` |
| `tools/harness/change-coordinator/git.integration.test.mjs` | 475 | `356fca48478763a29c2ddcc4739825a8c67cd8f92a82d2473bf43137e35f61b5` |
| `tools/harness/change-coordinator/fixtures.mjs` | 493 | `4447ba341104fbc07cf8a170412d490dd0edf579d42f453fe734b96204624293` |

- Repeated decision: `TDD_READY PASS_AFTER_CONTROLLER_REVIEW_CORRECTION`. The same bounded Worker revision may resume only on `coordinator.mjs`, `adapters.mjs`, `cli.mjs`, and `tools/harness/change-coordinator/README.md`; it must also restore the out-of-scope root `README.md` to baseline bytes. Test assets and `tools/harness/validation/run` are frozen until Controller-verified focused GREEN.

## Final Handoff Test-order WORKER_CONFLICT

- Worker stopped before functional production edits because the frozen Coordinator Test simultaneously required the first `candidate_frozen` Ledger append to occur after the first PR readback and before `final_handoff`, PR upsert, and that same first PR readback.
- Controller confirmed the contradiction is in the Test, not the contract. Frozen Design exact order is branch push/readback, canonical `handoff.json`, `candidate_pushed`, `candidate_frozen`, `final_handoff`, PR upsert/readback, final Git/Evidence/clean readbacks, then `AWAITING_CONTROLLER`.
- The prior repeated TDD_READY is invalidated. The same Test Agent may make one minimum deletion/rewrite of the obsolete post-PR `candidate_frozen` leaf; production, Spec, project-control, root README, runner, and all other Test bytes remain frozen until a new hash is reviewed.

## Final Handoff Test-order Correction and Repeated TDD_READY

- Correction: deleted only the six-line obsolete leaf requiring `candidate_frozen` after PR readback. The comprehensive ordering leaf remains and enforces the frozen Design order through final readbacks and `AWAITING_CONTROLLER`.
- Controller independent execution: Coordinator exits 1 with 118/223 passing and 105 causal production failures. Unchanged CLI remains 4/8 and Git integration 19/26; no contradictory ordering failure remains.
- Integrity: `coordinator.test.mjs` is 1,507 lines with SHA-256 `4a4a405a19b8e4761e62443071c65128aa023ecf1cf35574588cb953b78c8208`; the other three Test hashes remain unchanged; syntax, 12 identities, no skip/todo/only, and whitespace checks pass.
- Repeated decision: `TDD_READY PASS_AFTER_FINAL_HANDOFF_TEST_ORDER_CORRECTION`. The same bounded Worker revision may resume on the four production/reference paths and exact root README baseline restoration only. The runner remains frozen until focused GREEN.

## Final Handoff Failure-semantics Complexity Root-cause Return

- Second Worker stop: the happy-order leaf correctly requires durable `candidate_frozen` before PR upsert, while the PR failure rows incorrectly required that same immutable Ledger fact not to exist after upsert/readback failure. The frozen 16-method Git/PR interfaces intentionally expose no history rollback/delete operation.
- Root cause: Test duplication conflated two distinct concepts: the append-only `candidate_frozen` event records a Candidate fact before PR; final local freeze/delivery is the later atomic `AWAITING_CONTROLLER` transition after PR and final readbacks.
- Frozen disposition: PR-stage failure preserves prior candidate events but must not write `AWAITING_CONTROLLER`, release the lock, or return delivery. Branch-push/Ledger failure remains fail-closed at its own earlier boundary.
- Current partial production evidence is not a Gate claim: Worker reported Coordinator 210/223 with the two contradictory PR leaves as the remaining causal leaves, Git integration 26/26, and CLI not yet rerun. Production is frozen until Test-only consolidation, repeated causal execution, and repeated TDD_READY.

## Complexity Root-cause Consolidation, TDD_READY, and Focused GREEN

- Test correction: PR-stage failure now preserves the already durable `candidate_pushed`, `candidate_frozen`, and `final_handoff` history while proving no `AWAITING_CONTROLLER`, no lock release, and no delivered result. The happy exact-order leaf is unchanged.
- Final frozen Test hash: `coordinator.test.mjs` is 1,511 lines at `ee1efbf0d05370e538d030cf3e74f3f8b7f566cd2d1b71822b468d4b2476a1b9`; CLI, Git, and fixtures hashes remain `d7b8d8e0...`, `356fca48...`, and `4447ba34...` respectively.
- Controller independent GREEN: Coordinator 223/223, CLI 8/8, Git integration 26/26; zero fail/cancel/skip/todo. Worker independently reproduced the same totals and all frozen Test hashes.
- Production hashes: `coordinator.mjs` `02d932d273d676106f3f7a186a24e6a7fb892ddc55d7c6f667efaa988d269c34`; `adapters.mjs` `05768e305648dcfe816b3053ae12aa595790304810cd4dd18ad32d475f51b330`; `cli.mjs` `563cb9ee2f70e389fb8969f2458605513da60e7ef92899a966ee0088f609ccb9`; harness README `24775c196763c925fa22ade55f11cc659ac49f981ccb9a1783bcb32acb7379c2`.
- Static/scope: three production syntax checks and `git diff --check` pass; root README is byte-identical to baseline; canonical runner is unchanged; no commit, push, PR, live GitHub, Mode Activation, or H/P/C/A effect occurred.
- Gate: focused GREEN only. The exact tree is frozen for repeated dual-axis Controller review before runner release, regression, retirement, Candidate, or Validator.

## Repeated Dual-axis Review — Focused GREEN Rejected

- Standards axis: `FAIL`. Hard findings are a production-only artifact hash bypass; partial single-instance settlement queue rather than complete admission/state CAS; remote Ledger success without local-state interruption convergence; and noncanonical/shallow durable JSON hydration. Readability duplication/1215-line coordinator remains an optional but material audit-cost concern.
- Spec axis: `FAIL`. Hard findings include stale Final Validate reuse after revision; second Validator FAIL not entering `BLOCKED_HANDOFF`; unconditional state transitions without their Ledger evidence; incomplete Ledger record/idempotency validation; missing CAS/ambiguous recovery; incomplete Handoff evidence; unusable conditional-path release; no merged-commit tree proof; and exact Dispatch/result drift.
- Controller independently confirmed at least three executable code counterexamples not represented by the green suite: `prepareCleanup` reads only the Frozen Candidate commit rather than the merge commit; conditional/stop Controller reason mapping accepts arbitrary nonempty values; and run serialization does not cover every state-mutating call/instance.
- Consequence: Coordinator 223/223, CLI 8/8, and Git 26/26 remain historical execution facts only. TDD_READY coverage and focused GREEN are invalidated; runner release, regression, retirement, Candidate, and Validator remain blocked.
- Complexity stop: before another Test/Worker cycle, a read-only Spec implementability Gate must prove every repair fits the frozen seven dependencies, 16 Git methods, public methods, paths, schema/vocabulary, authority, and no-live-effect boundary. Any required contract/scope/schema/ownership change returns for user decision.

## Implementability Gate — SPEC_CONFLICT / User Decision Required

- Result: `SPEC_CONFLICT`. Complete repair is not deterministic within the frozen contract.
- Required correction 1: permit exactly `state_root/coordinator-operation-lock/owner.json` as the sole short-lived admission/operation mutex, implemented through existing filesystem methods. This closes atomic Global WIP admission and cross-instance state-operation serialization without adding a dependency or public Coordinator method.
- Required correction 2: add one read-only Git method that enumerates Change IDs on the Evidence Ref, increasing the exact Git surface from 16 to 17. This is required to detect a different active Change not already named by local state.
- Required correction 3: freeze exact `StateV1`, every Ledger event-detail/outcome/evidence/prior-next-state variant and non-Gate transition evidence, `HandoffV1`, and operation-discriminated result payloads including `state_version`. This closes recovery reconstruction, canonical hydration, Gate ordering, Handoff completeness, and currently contradictory generic result requirements.
- Not changed by the proposed correction: seven dependency keys, seven public Coordinator methods/CLI commands, lifecycle state and event vocabularies, MacBook/Mac mini authority, Global WIP=1, product/Agent paths, live effects, GitHub Issue policy, runner, Mode Activation, or H/P/C/A.
- Decision brief: `.juanerai/project-control/decision-briefs/DTF-CC006-001.json`. No further Agent or implementation work is authorized until resolution.

## Contract Correction 006 User Decision

- Decision: `APPROVED` at `2026-08-25T04:57:58.096Z`.
- Authorized only: the exact operation-lock path using existing filesystem methods; one read-only Evidence Ref Change enumeration Git method, making 17 exact Git methods; and exact internal `StateV1`, Ledger event-detail/transition evidence, `HandoffV1`, and operation-discriminated result payload schemas including `state_version`.
- Unchanged: seven dependencies, seven public Coordinator methods/CLI commands, lifecycle state/event vocabulary, authority, Global WIP=1, product/Agent paths, live effects, GitHub Issue policy, runner, Mode Activation, and H/P/C/A.
- Release: formal Spec correction only. Test and Worker remain blocked until a repeated independent Spec Gate PASS.

## Contract Correction 006 — Formal Spec Closure

- Formal Spec result: `SPEC_READY`; this is not Controller Spec Gate PASS.
- Scope: only `openspec/changes/dual-device-transition-foundation/**` changed. Existing Test/production/project-control/root README/runner bytes and every live external boundary were untouched by Spec.
- Mutex closure: exactly `state_root/coordinator-operation-lock/owner.json`, using the existing filesystem lock methods, is the sole short-lived mutating-call mutex. Its owner, local linearization, stale/ambiguous rules, and separation from the long-held Change lock are exact.
- Global-WIP closure: exact read-only `git.enumerateEvidenceChanges({ repository_root, origin, evidence_ref })` raises Git from 16 to 17 methods. Its sorted output, terminal/active derivation, full Ledger validation, corrupt/ambiguous failure, and no-ref-mutation behavior are exact.
- Durable-state closure: exact `StateV1` fields plus per-state gate cursor, pending Agent, revision/budget, validation receipt/Candidate generation, conditional release, Controller record, Handoff, and PREPARED/OBSERVED recovery invariants are normative. Canonical hydration reconstructs them from immutable Ledger/Git facts and rejects shallow JSON.
- Ledger closure: all 17 existing event names now have exact outcome, evidence kinds, detail schema, prior/next state, subject/generation, idempotency, and recovery meaning. No event/state/role/permission was added.
- Handoff/result closure: `HandoffV1` is computed before terminal append and therefore contains the prior tip/IDs; the exact `RunResultV1` carries later terminal IDs/final tip. All seven methods have operation-discriminated payloads and `state_version`; Check facts and read-only Cleanup `RELEASED` eligibility have one location.
- Review-gap closure: any revision/new Candidate invalidates old-generation Final Validate evidence; second Validator FAIL/BLOCKED enters `BLOCKED_HANDOFF`; conditional release has one durable same-state receipt; revised Candidate parent is the Frozen Candidate; cleanup reads both Candidate and merge commits; exact budgets/evidence-level/reason mappings and ambiguous commit/remote-success recovery are closed; Agent artifacts and Handoff are computed through canonical production boundaries without a production-only Test seam.
- Preserved boundaries: seven dependency keys, seven public methods/commands, 19 lifecycle states, 17 Ledger events, eight delegated Gates, eight Controller events, four roles, allowed/conditional/forbidden paths, Global WIP=1, MacBook/Mac mini authority, no product/live/GitHub Issue/runner/Mode Activation/H/P/C/A effect.
- Mapping target remains 8 Requirements / 45 ACs / 12 Test identities / 14 tasks. Test identities/assets are not added by CC006; Test must revise the existing four assets only after Controller Spec Gate PASS.
- Optional OpenSpec CLI: not run because no repository-local executable was available in the prior/current environment; no network fetch or installation was attempted. Static consistency evidence is recorded below after final checks.

### CC006 Static Consistency Evidence

- Package lines: `1,959 -> 2,191`; exact CC006 delta `+232`.
- Interface counts: 7 public methods/commands; 7 dependency keys; 9 filesystem methods; 17 Git methods; 2 PR methods; 1 validation method; 19 lifecycle states; 17 Ledger events; 8 delegated Gates; 8 Controller events.
- Mapping counts: 8 Requirements / 45 unique ACs / 12 Test identities / 14 tasks.
- Scope/trailing-space checks: `git diff --check` and repository-wide trailing-whitespace scan passed; all ten OpenSpec files end with LF.
- Current-contract scan: every nonhistorical Git-interface reference says 17; the five 16-method references in this file and the historical Test ledger are explicitly preserved pre-CC006 evidence.
- OpenSpec CLI: unavailable/not run; no install, network fetch, Test, production command, Agent dispatch, commit, push, PR, runner, Mode Activation, or H/P/C/A effect was performed.

## Controller Repeated CC006 Spec Gate — NEEDS_CLARIFICATION

- Independent complete-document review result: `NEEDS_CLARIFICATION`; CC006 is not Controller Spec Gate PASS and Test remains frozen.
- Blocking cross-device boundary: `recordControllerEvent` requires MacBook writer identity while hydrating and CAS-updating the one canonical Mac mini machine-local StateV1/operation mutex. The current dependencies and manifest define neither a remote invocation nor a replica/convergence protocol. Decision brief: `.juanerai/project-control/decision-briefs/DTF-CC007-001.json`.
- Bounded no-choice Spec corrections also remain: exact initial StateV1 version; complete prepared-effect recovery union retaining original IDs/bytes/parent/next-state; per-event writer/result/start-failure/operation/step mappings; closed result reason/state/subject/record pairings; deterministic Validator finding artifact to automatic Revision derivation; Handoff full-diff and actual-command readback references; and first-Change terminal-to-next-Dispatch active-pointer turnover.
- End-to-end WIP finding: ARCHIVED is currently record-only, `prepareCleanup` never clears WIP, and a later different Dispatch therefore has no legal admission path. The already-approved rule permits the minimum fix: a new valid Dispatch authorizes atomic turnover only after the previous Change's exact terminal archive, dual-device convergence, clean Worktree and no-lock proof; this adds no method, state, event, deletion, polling, or automatic start.
- Current `RecoveryStateV1` omits record ID, sequence, canonical bytes, expected parent and intended next state that the Ledger append transaction claims to persist before an effect; absent-effect restart therefore cannot replay the original immutable operation without guessed replacement IDs.
- The existing 8/45/12/14 and 7-dependency/7-public-method/17-Git-method counts remain valid. No product, Test, production, runner, Mode Activation, Git or H/P/C/A effect was performed by this review.

## Contract Correction 007 User Decision

- Decision: `APPROVED_OPTION_A` at `2026-08-25T05:56:13.814Z`.
- MacBook initiates a bounded authenticated one-shot remote invocation; `record-controller` executes on the Mac mini against the one canonical Mac mini repository/state root and operation mutex.
- `runtime.device: 'macbook'` and the Ledger writer identify the authenticated Controller-origin authority, while the physical process uses the Mac mini state root. Mac mini cannot synthesize the Controller package or decision; exact remote-call input/output and identity evidence must be frozen and later proven by Mode Activation.
- No State replica, shared filesystem, database, daemon, queue, RPC service, new dependency, public method, lifecycle state/event, product path, live Foundation effect or automatic next Change is authorized.
- The same Spec correction may close the no-choice findings already listed by the repeated review, including exact recovery/event/result/Handoff/Validator schemas and terminal-to-next-Dispatch atomic turnover. Test and Worker remain frozen until an independent repeated Spec Gate PASS.

## Contract Correction 007 — Formal Spec Result: SPEC_CONFLICT

- Result: `SPEC_CONFLICT`; no corrected contract is claimed and the Controller Spec Gate cannot repeat yet.
- Load-bearing conflict: Option A requires Mac mini `record-controller` to distinguish a genuine MacBook-authored package from a package synthesized by the Mac mini. The existing seven dependencies expose only caller/composition-supplied plain data and effects; they contain no non-overridable Controller trust anchor or authenticated peer fact.
- Circular sources rejected: a public key or fingerprint inside the Dispatch, Controller input, ordinary environment, or current plain `runtime` can be replaced together with a locally generated key/signature by the invoking Mac mini process. Dispatch self-hash, `runtime.device: 'macbook'`, Ledger writer identity, repository/state-root equality, process-run ID, and a remote shell invocation prove binding or location only; none authenticates MacBook origin.
- External SSH source not silently assumed: an SSH authorized key, forced-command file, OS account policy, keychain, or host attestation could supply the missing root, but none is a current Foundation canonical source or existing dependency method. Foundation cannot read/validate its ownership, permissions, selected key, forced command, peer principal, rotation, or single-key failure semantics. Deferring the real call to Mode Activation does not permit deterministic Foundation tests to pretend that a caller-provided environment value is authenticated.
- Hard-coded key not invented: pinning a key in `coordinator.mjs` would require an exact approved public key, provisioning owner, rotation/revocation rule, missing/multiple-key behavior, and a safe positive-test strategy. Those are new authority facts not present in DTF-CC007-001 and cannot be chosen by Spec. A repository test private key or production-only verification seam would let Mac mini forge authority or violate the canonical production-boundary test rule.
- Consequently the Spec cannot honestly freeze the requested signature canonical bytes, domain separator, replay protection, exact remote-call success result, or forced-command/SSH Activation canary as an implementable authority contract. The remaining no-choice State bootstrap/turnover, Recovery, 17-event/result, Validator, Handoff, and causal-Test findings remain identified but were not partially rewritten around a false trust premise.
- Minimum release decision: name one canonical Controller verification/attestation source that (1) is owned/provisioned by MacBook/Controller or an approved host administrator, (2) cannot be supplied or replaced by the Mac mini invocation, (3) is readable/verifiable through an approved existing or explicitly widened boundary, and (4) has exact repository/change/schema/key-ID binding, permissions, absence/multiple-key, rotation/revocation, and deterministic Test rules. If satisfying this requires a new filesystem path, Adapter method, dependency key, or Activation-owned bootstrap artifact, that expansion must be explicitly approved rather than hidden inside Option A.
- Scope/effects: only this verification history/read model changed. No Test, production, runner, project-control, dependency, Git state, remote call, Agent, Mode Activation, or H/P/C/A action was performed.

## Controller Trust-boundary Read-only Inspection

- MacBook already has one dedicated SSH transport key for `myhost`; public fingerprint is `SHA256:ks0okdg0f3YAJsGQrLKllWmHOKDp2CT9OFUPOYWZdsk`. Private key content was not read or emitted.
- A bounded read-only SSH probe authenticated successfully as `bendandebaba` on `bendandebabadeMac-mini.local`; `/Users/bendandebaba/JuanerAI` was clean `main` at baseline `5236867c75b2166946dd9d2b81f19f0bd10d4f2e`.
- Mac mini `.ssh` is mode `0700` and `authorized_keys` is mode `0600`, both owned by `bendandebaba`; the sole key matches the MacBook fingerprint but has no forced-command/restrict option. This proves the existing transport works, not that a local Mac mini invocation cannot spoof Coordinator authority.
- `/private/etc/juanerai/controller-trust.json` is absent. Recommended decision `DTF-CC008-001 A` would let Mode Activation create a dedicated MacBook-only Ed25519 signing private key and install its public trust record at that exact root-owned, read-only Mac mini path. Foundation would use existing filesystem reads plus Node standard crypto, fixed-path deterministic doubles, and no new dependency/public method; no key is created and no permission is changed before approval and Mode Activation.
- Option B is an explicit weaker-authentication waiver; it is not equivalent evidence.

## Contract Correction 008 User Decision

- Decision: `APPROVED_OPTION_A` at `2026-08-25T06:34:32.450Z`.
- Mode Activation, not Foundation, will generate a dedicated MacBook-only Ed25519 signing private key and install its public trust record at exactly `/private/etc/juanerai/controller-trust.json` on the Mac mini.
- The Mac mini trust directory/file must be root-owned and not writable by the Coordinator account. The private key never leaves the MacBook host, repository, Ledger, logs, prompts, Handoff or test fixtures.
- Foundation may freeze and implement fixed-path read-only trust loading, Node standard-library signature verification, canonical `ControllerInvocationV1`, repository/change/schema/key-ID binding, replay protection, absence/multiple-key/permission failure, deterministic ephemeral-key doubles and the deferred host permission/real-call canary.
- No dependency key, public method, lifecycle state/event, product path or live Foundation effect is added. Foundation must not generate the real key, create `/private/etc/juanerai`, change host permissions, modify SSH or claim Activation readiness.

## Contract Correction 008 — Formal Spec Closure

- Formal result: `SPEC_READY`; this is not Controller Spec Gate PASS and releases no Test/Worker.
- Trust source: exactly `/private/etc/juanerai/controller-trust.json`, compiled rather than caller-configured. Existing `filesystem.readCanonicalJson` gains exact null-or-trust policy/metadata receipt; filesystem remains 9 methods and dependencies remain 7.
- Host policy: parent `root:root/0755`; one-link regular file `root:root/0444`; no symlink/alias/race; stable lstat/open-no-follow/fstat read and 65536-byte bound. Any absence/type/owner/group/mode/link/change/no-follow failure stops before mutex/effect.
- Trust schema: one canonical ACTIVE Ed25519 SPKI key or fail-closed REVOKED/no-key record; key ID is SPKI SHA-256, repository/operation/schema/domain and self-hash are exact, revoked history is retained, and multiple active keys are invalid. Runtime/device/environment/Dispatch never supplies the key.
- Invocation: exact domain-separated canonical `ControllerInvocationV1` binds key/nonce/time/Change/repository/baseline/manifest/operation/state/tip/subject/idempotency/decision; Ed25519 verifies before the Mac mini mutex. Exact replay returns the original result; reused identity with different bytes conflicts; invalid/expired/future/wrong binding fails.
- Physical boundary: MacBook streams one signed argument; one Mac mini process verifies and updates the unique Mac mini state root/Ledger, returns one canonical result, and exits. Foundation uses only in-memory ephemeral Test keys/synthetic trust metadata. Real key/path/permission/SSH/remote-call and rotation canaries remain Mode Activation; no private/raw signature/nonce bytes persist.
- Exactness closure: version-0 bootstrap and atomic terminal pointer turnover; PREPARED/OBSERVED effect intents preserving original IDs/bytes/parent/tip/next-state; all 17 event writer/outcome/evidence/detail/prior-next/operation/step/reason/origin variants and START_FAILED mapping; closed seven-result pairings; exact Validator artifact/automatic Revision; and Handoff full diff plus actual validation definitions/receipts.
- Frozen counts remain 8 Requirements / 45 AC / 12 Test identities / 14 Tasks; 7 dependency keys / 7 public methods+commands / 17 Git methods / 19 states / 17 Ledger events / 8 Gates / 8 Controller events. No real key/path/permission/SSH, Test, production, runner, project-control, Git, Mode Activation, or H/P/C/A effect occurred.

## Required Next Evidence

1. Formal Spec-only closure of the approved trust source, one-shot remote-call protocol and already named exact-schema gaps.
2. Fresh independent complete-diff Spec/lean review and Controller Spec Gate PASS.
3. Corrected Test helper health, causal RED and repeated Controller TDD_READY.
4. Bounded Worker handoff with exact files, focused GREEN, scope and no live effects.
5. Conditional canonical-runner append, full regression and Test Asset Retirement PASS.
6. Frozen Candidate plus fresh read-only Validator verdict on that exact SHA.
7. Completed retrospective, Controller acceptance, archive/integration and dual-device main convergence, still without Mode Activation.

## Reduced V1 Draft Read Model — 2026-08-25

This section is append-only current-generation evidence. All preceding verification history, including rejected GREEN, Controller review failures, Contract Corrections 003—008, prior `SPEC_READY` claims, and unresolved old-package findings, remains unchanged historical evidence. Nothing above is rewritten into a reduced-V1 PASS.

### Current Result

- Role: formal `juaner_spec`.
- Change: `CHG-dual-device-transition-foundation`.
- Generation: Transition Foundation Reduced V1.
- Authority: frozen reduced-V1 plan plus approved artifact disposition.
- Lifecycle result: Spec draft complete; independent reduced-Spec review has not run.
- Verdict: `SPEC_READY_FOR_INDEPENDENT_REVIEW`.
- Spec Gate PASS: not claimed.
- Test/Worker/Validator/Mode Activation/H/P/C/A: locked/not started.
- Production/Test/project-control/runner/Git/host state: not modified by this run.

### Exact Modified Documents

1. `openspec/changes/dual-device-transition-foundation/proposal.md`
2. `openspec/changes/dual-device-transition-foundation/design.md`
3. `openspec/changes/dual-device-transition-foundation/specs/dual-device-transition-foundation/spec.md`
4. `openspec/changes/dual-device-transition-foundation/tasks.md`
5. `openspec/changes/dual-device-transition-foundation/test-plan.md`
6. `openspec/changes/dual-device-transition-foundation/traceability.md`
7. `openspec/changes/dual-device-transition-foundation/test-asset-retirement.md`
8. `openspec/changes/dual-device-transition-foundation/verification.md` — this appended section only; preceding history preserved byte-for-byte.

Read-only `exploration.md` and `retrospective.md` were preserved unchanged.

### Old to Reduced Surface

| Old package | Reduced V1 current documents |
|---|---|
| 7 public operations | exactly 4 interfaces: `applyControllerCommand`, `run`, `settlement`, `status` |
| 19 lifecycle states | exactly 6 macro states |
| 17 fine-grained Ledger events | exactly 7 event classes |
| operation lock plus long Change lock | exactly 1 process-owned short operation mutex |
| universal `RecoveryStateV1/PREPARED/OBSERVED` | exactly 4 explicit recovery boundaries |
| Evidence Ref all-Change WIP enumeration | initialized local `active_change_id` pointer authority; Evidence Ref is current-Change Ledger persistence only |
| embedded binary diff | fixed baseline/Candidate Git objects plus raw-byte SHA-256 under `JUANERAI_GIT_DIFF_V1` |
| auto-expanding repair | at most 1 same-scope repair per DISPATCH or signed REVISION authorization cycle |
| real trust lifecycle in Foundation | deterministic verifier contract; real trust/host canaries deferred to Mode Activation |

### Cross-document Consistency Readback

- **WIP:** MacBook Controller, Mac mini Coordinator, Global WIP=1, and the initialized `active_change_id` pointer are consistent in Proposal, Design, Spec, Test Plan, Traceability, and Tasks. Missing/corrupt/conflicting pointer is fail-closed; no Ledger enumeration infers empty.
- **Interfaces:** all current normative documents freeze the same four interfaces and reject old/bypass control methods.
- **States/phases:** all current normative documents use only `READY`, `EXECUTING`, `DELIVERING`, `AWAITING_CONTROLLER`, `BLOCKED`, `CLOSED`; internal phases do not add lifecycle states.
- **Events:** all current normative documents use only `CONTROLLER_COMMAND`, `AGENT_RUN`, `VALIDATION_RESULT`, `CANDIDATE_COMMITTED`, `BRANCH_PUSHED`, `HANDOFF_READY`, `BLOCKED`. Test Asset Retirement is REGRESSION validation scope, not state/phase/event.
- **Mutex:** one process-owned short operation mutex is held only across bounded read/effect/readback/persist and released for Agent/Controller waits; no file/Change/stale-lock mechanism remains.
- **Agent evidence:** REQUESTED, STARTED, RESULT, START_FAILED, INTERRUPTED, and NOT_STARTED are distinct; Foundation mechanics stay inside restricted gateways and the host loop only launches formal Agents and returns settlements.
- **Automatic path/PR:** signed DISPATCH automatically advances through Worktree, Spec, causal RED, Worker GREEN, Regression, Candidate/final validation/Validator, push/freeze, current-Change PR create-or-reuse/readback, Handoff, then `AWAITING_CONTROLLER`. MacBook begins at PR review.
- **Bounded repair:** each DISPATCH or signed REVISION cycle starts at `auto_repair_attempt=0`; one reliably in-scope finding may consume `0 -> 1` only with causal Test RED; ambiguity/out-of-scope/second FAIL is `BLOCKED`; RESUME/RELEASE do not reset.
- **Candidate/Handoff:** local Candidate Head, remote branch Head, Validator Head, and PR Head bind the same Frozen Candidate. Handoff contains fixed references and canonical diff hash, never embedded binary bytes.
- **Canonical diff:** Design freezes Git `2.54.0`, exact argv/config/environment, `shell:false`, and SHA-256 of unnormalized raw stdout bytes; Spec and Test Plan map mismatch to fail-closed evidence.
- **Recovery:** Candidate commit, branch push, Ledger append, and Final Handoff/PR are the only automatic recovery boundaries; every other ambiguity preserves evidence and returns to Controller.
- **RELEASE:** signed receipt, clean fetch/prune + ff-only Mac mini main sync/readback, one command event, `CLOSED`, pointer clear last, and the exact uncleared-pointer continuation are consistent across Design, Spec, Test Plan, Traceability, and Tasks.
- **Foundation/Activation:** deterministic Foundation contracts and temporary local Git remain separate from real keys/trust/ACL/SSH/host-loop/GitHub credentials/live canaries. The unattended signed-DISPATCH-to-review-ready-PR Activation endpoint and one-repair bound are not downgraded.
- **Stop lines:** Test/Worker/Validator/Mode Activation/H/P/C/A, production/Test/project-control/runner/Git/host writes, live external effects, commits/pushes/PRs/merge/archive/deletion, scope widening, and old platform machinery remain prohibited at this Gate.

### Static Spec Evidence

- Reduced current normative package: 7 Requirements / 43 unique Acceptance Criteria / 12 planned reduced Test identities / 12 ordered tasks.
- Current rewritten seven non-history documents: 1,129 lines total before this verification append.
- Requirement, AC, Test, and Task identity scans found one definition for every declared identity and no duplicates.
- Old mechanism scan found references only in explicit historical/rejected/non-goal text; no old public operation, state, event, lock, Evidence-enumeration WIP, embedded-diff, or universal-recovery mechanism is current authority.
- Trailing-whitespace scan found none; all seven rewritten non-history documents end with LF.
- No OpenSpec CLI, Test command, production import/check, canonical runner, Agent, Validator, Git status/diff/commit, network, host, or external canary was run. This is static Spec evidence only.

### Preserved Historical Test Evidence

`test-asset-retirement.md` preserves the rejected historical hashes exactly:

- Coordinator 1,511 lines / `ee1efbf0d05370e538d030cf3e74f3f8b7f566cd2d1b71822b468d4b2476a1b9` / historical `223/223`;
- CLI 207 lines / `d7b8d8e0d50d6c4c04ec5186f889b701330f0068b9dce9490af61840f77259b0` / historical `8/8`;
- Git integration 475 lines / `356fca48478763a29c2ddcc4739825a8c67cd8f92a82d2473bf43137e35f61b5` / historical `26/26`;
- fixtures 493 lines / `4447ba341104fbc07cf8a170412d490dd0edf579d42f453fe734b96204624293`.

These remain rejected old-contract facts. All reduced Test identities are `NOT_RELEASED / NOT_RUN`.

### Remaining Load-bearing Ambiguity

None identified inside the frozen reduced-V1 authority. The production trust provider, sole trusted host process, real Agent launches, GitHub credentials/transport, host permissions, rotation/revocation, and live canaries are intentionally specified as Mode Activation responsibilities rather than Foundation guesses. Any future need to change authority, scope, schema, compatibility, ownership, dependency, permission, recovery boundary, or external effect returns `BLOCKED` to the Controller.

### Next Gate

Fresh independent reduced-Spec and overdesign review, followed by Controller decision. Test remains locked until explicit Spec Gate PASS.

`SPEC_READY_FOR_INDEPENDENT_REVIEW`

## Reduced V1 Execution-contract Revision Read Model — 2026-08-25

This section supersedes only the current Reduced V1 read model above; all earlier attempts, rejected evidence, Contract Corrections, Test results, and review history remain historical facts and were not rewritten.

### Current Revision Result

- Authority: frozen Reduced V1, artifact disposition, first independent review, and the bounded F1-F8 revision dispatch.
- Exact modified documents: `proposal.md`, `design.md`, `specs/dual-device-transition-foundation/spec.md`, `tasks.md`, `test-plan.md`, `traceability.md`, `test-asset-retirement.md`, and this current verification section.
- Derived current normative counts: **7 Requirements / 51 unique Acceptance Criteria / 12 planned Test identities / 12 ordered Tasks**.
- Frozen surfaces remain **4 interfaces / 6 macro states / 7 Ledger event classes / 1 mutex / 4 recovery boundaries**. No interface, macro state, event class, mutex, or recovery platform was added.
- Independent fresh review has not run; Spec Gate PASS, Test release, implementation, Validator, Mode Activation, and H/P/C/A are not claimed.

### F1-F8 Closure Readback

| Finding | Exact revised sections | Closure |
|---|---|---|
| F1 | Proposal `Objectives`; Design `Module and Public Surface`, `One Short Operation Mutex`, `Revision Closure: One production composition`; Spec AC-001-01/05/07; Tasks R1-003/004/006/012; Test Plan `F1-F8 Required Causal Leaves`; Traceability AC-001-07..08 | one Activation-owned physical writer, one mutex, ingress-only production CLI, read-only status, causal bypass negatives |
| F2 | Design `Controller Command and Verifier Contract`, `Revision Closure: Closed interface and evidence schemas`; Spec AC-002-08; Test R1-002/009; Traceability AC-002-08 | READY identity is durable, orphan is restart/status-visible, run refuses, identical DISPATCH completes pointer, conflict pauses manually |
| F3 | Design `Validation and Bounded Automatic Repair`, `Revision Closure: Closed stop disposition and local pause`; Spec AC-003-01/05/06 and AC-005-06; Test R1-004/005/009/010; Traceability AC-003-06 | closed reason-to-one-action table, legal pre-Candidate REVISION, safe-only RESUME, fixed atomic local-pause lifecycle, no false durable BLOCKED |
| F4 | Design `Minimal Gateway Seams`, `Revision Closure: One production composition`; Spec AC-001-04/07; Tasks R1-003/006/012; Test R1-001/011/012 | closed core construction, Activation production composition, separate test-only factory, ordinary callers cannot inject trust/gateways |
| F5 | Design `Closed Result and Error Contract`, `Agent Action and Settlement`, `Seven-class Ledger`, `Revision Closure: Closed interface and evidence schemas`; Spec AC-001-08/005-08; Test all R1-001..012; Traceability AC-001-07..08 and AC-005-07..08 | closed four-interface/result/status, Agent/settlement/stage, validation, seven-detail, error/reason/idempotency unions |
| F6 | Proposal `Acceptance Endpoint`; Tasks R1-010/011/012; Spec AC-007-07; Test R1-012; Traceability AC-007-07 | Foundation integration uses current pre-Activation Git/governance and does not consume its inactive mechanics |
| F7 | Design `Candidate, Canonical Diff, PR, and Handoff`; Spec AC-004-08; Test R1-008/011; Traceability AC-004-08 | empty environment, exact allowed variables/executable/version/cwd/Git-dir/Worktree/argv/readback, clone-local input rejection, raw SHA-256 boundary |
| F8 | Design `WIP Pointer and Durable State`, `Minimal Gateway Seams`, `Revision Closure: Ledger append publication`; Spec AC-005-07/08; Tasks R1-003/006; Test R1-005/009; Traceability AC-005-07..08 | Evidence Ref is sole durable byte authority; remote exact readback linearizes; local working copy/local pause never advances a Gate; all retry/conflict/ambiguity leaves named |

### Controller Residual Readback Closure

- F5 now names `AgentSettlementBindingV1`, all four exact settlement variants, the complete Coordinator result payload union and allowed operation outcomes, `CoordinatorErrorCodeV1`/`CoordinatorReasonV1`/`NextActionV1`, validation kind/scope/status/verdict/failure enums, `ValidationReceiptV1`, and exact request/result signatures for all eleven existing Git methods. The placeholder phrases `all route/hash bindings` and `fields required by their names` are absent.
- Tasks and Test Plan now use the exact current verdict `SPEC_REVISION_READY_FOR_FRESH_REVIEW` without claiming Spec Gate PASS.
- Gate Ordering R1-011 now uses the current pre-Activation Controller acceptance/integration/archive/manual dual-main ff-only workflow. Signed RELEASE remains a behavior implemented by Foundation and proven only after separate Mode Activation; this Foundation Change does not consume it for its own integration.
- Counts and frozen surfaces remain 7/51/12/12 and 4/6/7/1/4 respectively.

### Remaining Ambiguity and Next Gate

No remaining execution-contract ambiguity is identified inside this bounded revision. Real trust, ingress transport/access control, SSH, credentials, host installation, and live canaries remain intentionally owned by a separately authorized Mode Activation and are not Foundation guesses. Fresh independent Reviewer is the next permitted action; Test remains locked until explicit Controller Spec Gate PASS.

`SPEC_REVISION_READY_FOR_FRESH_REVIEW`

## Reduced V1 Second Strictly Bounded Spec Revision Read Model — 2026-08-25

This section supersedes only the immediately preceding current-revision read model. All earlier Spec attempts, review findings, Contract Corrections, Test results, and PASS/FAIL history remain unchanged historical facts.

### Current Second-revision Result

- Authority: frozen Reduced V1, artifact disposition, the fresh independent rereview, and the second bounded F1/F2/F3/F5/F8 revision dispatch.
- Exact modified documents: `proposal.md`, `design.md`, `specs/dual-device-transition-foundation/spec.md`, `tasks.md`, `test-plan.md`, `traceability.md`, `test-asset-retirement.md`, and this appended verification section.
- Current counts are **7 Requirements / 51 unique Acceptance Criteria / 12 planned Test identities / 12 ordered Tasks** with complete Requirement/AC-to-Test/Task rows in `traceability.md`.
- Frozen surfaces remain **4 interfaces / 6 macro states / 7 Ledger event classes / 1 process-owned short mutex / 4 recovery boundaries**. No public interface, macro state, Ledger event class, mutex, recovery boundary, gateway method, platform mechanism, or Contract Correction was added.
- Fresh rereview has not run on this revision. Spec Gate PASS, Test release/run, TDD_READY, implementation, GREEN, Regression, Candidate, Validator, integration, Acceptance, archive, Mode Activation, and H/P/C/A are not claimed.

### Open-finding Closure Readback

| Finding | Exact current sections | Second-revision closure |
|---|---|---|
| F1 | Design `Module and Public Surface` and `One Short Operation Mutex`; Spec AC-001-01/05/07; Test Plan `F1-F8 Required Causal Leaves` and `Second-revision independent leaf schedule`; Traceability AC-001-01/05/07..08; Test Asset Retirement `Current Disposition` and `Reduced-V1 Revision Consumers` | production mutation exists only inside the Activation-owned trusted host loop; the retained CLI is signed-byte ingress submission plus read-only status and cannot construct/open/inject/invoke mutation state; old bypass assertions have no current consumer |
| F2 | Design `Controller Command and Verifier Contract`, `WIP Pointer and Durable State`, and `Closed interface and evidence schemas`; Spec AC-002-08; Test Plan F2 schedule; Traceability AC-002-08 | READY persists immutable DISPATCH admission, hashes complete readback bytes without embedding its own hash, durably reads the command event before publishing the pointer last, and closes every pre-event/post-event/pointer-readback-loss identical/conflicting restart outcome |
| F3 | Design `Closed stop disposition and local pause` and `Four Recovery Boundaries`; Spec AC-003-06/005-06; Test Plan F3 schedule; Traceability AC-003-06 and AC-005-05..06 | every named blocked and local-pause reason has exactly one of the five existing actions; validation start/interruption maps by kind; exact original public-request replay, atomic diagnostic restart/clear/supersede/manual-stay, safe-only RESUME, same-scope REVISION, and no false durable BLOCKED are closed |
| F5 | Design `One production composition`, `Closed interface and evidence schemas`, `Agent bindings and six details`, and `Validation receipts and Ledger details`; Spec AC-001-08/005-08; Test Plan F5 schedule; Traceability AC-001-07..08 and AC-005-01..02/07..08 | STATUS/nullability/pending actions, return/error/exit transport, shared Agent bindings and exact stages/settlements, validation enums/legal tuples, seven Ledger details, closed GatewayReason variants, and exact existing 11 Git plus four Ledger request/result signatures are implementable without placeholder inference |
| F8 | Design `Ledger append publication`; Spec AC-005-01/07/08; Test Plan F8 schedule; Traceability AC-005-01..02/07..08 | sole remote ref/path, path-safe Change grammar, canonical JSONL bytes, initial/existing/subsequent tip rules, exact four receipt types and partial stages, preserved tree entries, and remote ref+commit+tree+path+record readback as the only linearization point are frozen; local files/commits/push acknowledgements cannot advance state or Gate |

### Frozen F4/F6/F7 Normative Readback

The following pre/post SHA-256 values are identical; the second revision did not change their normative bytes:

- F4 Design production-composition ownership paragraph: `82669c89c09d2b38d1082ea1361b3aa9ebbf4300eaf750013735fce3b6186bdc`; Spec AC-001-04/ownership span: `c00d05de956caadd6a6d1ebb742e77e7cfb2e6f10987c6f0f67fee8d45ac9184`.
- F6 Proposal `Acceptance Endpoint`: `808f2d4a73c60154a90b29ac718aa19c39b51d93afc4883aea690b4568fa36a0`; Tasks R1-010..012: `85e5c9a581f9df2f7d2422d52090adce1d547e1ea0c60f9bbb6f9c92549e67dc`; Spec AC-007-07: `30a2a0cb2c5cb8c49d2a3839a0dc6a0ca579929c53c53b74e08f8d30fb198b73`.
- F7 Design canonical-diff contract: `232a673b6e1c68af3e881f7cc81dd3e9fe24234184b440d8989075ea0538d99e`; Spec AC-004-08: `e478759f6b7c9b7e80b87e5d37c15e3f4bad66af7721c005e4803b3c104ad609`; Test Plan canonical-diff section: `2af825d289904f1c520a7ee275dbb494a374a8b325cc445a61a5d884af94ee0b`.

### Static Scope and Stop-line Evidence

- Static scans found no current `all route/hash bindings`, `fields required by their names`, TODO/TBD placeholder, unspecified Controller-action escape, pre-revision current verdict, or direct production run/settlement CLI contract.
- Baseline/readback SHA-256 values remained identical for the four production/reference files (`02d932d273d676106f3f7a186a24e6a7fb892ddc55d7c6f667efaa988d269c34`, `05768e305648dcfe816b3053ae12aa595790304810cd4dd18ad32d475f51b330`, `563cb9ee2f70e389fb8969f2458605513da60e7ef92899a966ee0088f609ccb9`, `24775c196763c925fa22ade55f11cc659ac49f981ccb9a1783bcb32acb7379c2`), four Test/fixture files (`ee1efbf0d05370e538d030cf3e74f3f8b7f566cd2d1b71822b468d4b2476a1b9`, `d7b8d8e0d50d6c4c04ec5186f889b701330f0068b9dce9490af61840f77259b0`, `356fca48478763a29c2ddcc4739825a8c67cd8f92a82d2473bf43137e35f61b5`, `4447ba341104fbc07cf8a170412d490dd0edf579d42f453fe734b96204624293`), canonical runner (`338b36ab9dc8fefadac70c9781d9b66eedca5d843cd75534d553ab4c30e04c53`), and project-control status (`70242ee24910628b4399af18ea181bf7e4fc469f072aa1c3b870e80284cbcb8b`).
- No OpenSpec CLI, Test, Worker, Validator, Agent, production import/check, runner, Git write/status/diff, network/host action, Mode Activation, or H/P/C/A was run. This is static Spec-only evidence.
- F4/F6/F7 remain closed and frozen; only F1/F2/F3/F5/F8 execution-contract text and their existing Test/Task/trace/retirement consumers were refined.

### Remaining Ambiguity and Next Gate

No remaining load-bearing ambiguity is identified inside this bounded revision. Any implementation need for a new public interface, macro state, event class, mutex, recovery boundary, gateway method, platform mechanism, authority/scope/dependency/permission change, or Contract Correction returns `BLOCKED` to the Controller. The next permitted action is a fresh independent review; Test remains locked until an explicit Controller Spec Gate PASS.

`SECOND_SPEC_REVISION_READY_FOR_FRESH_REVIEW`

## Reduced V1 Final Hard-safety Correction Read Model — 2026-08-25

This section supersedes only the immediately preceding current-revision read model. All earlier Spec attempts, independent findings, Contract Corrections, Test results, and PASS/FAIL history remain unchanged historical facts.

### Current Final-correction Result

- Authority: frozen Reduced V1, the second independent review, and the user-approved final F2/F3 hard-safety correction dispatch.
- Exact modified documents: `proposal.md`, `design.md`, `specs/dual-device-transition-foundation/spec.md`, `tasks.md`, `test-plan.md`, `traceability.md`, `test-asset-retirement.md`, and this appended verification section.
- Current counts remain **7 Requirements / 51 unique Acceptance Criteria / 12 planned Test identities / 12 ordered Tasks**; every changed AC retains at least one planned Test and Task consumer in `traceability.md`.
- Frozen budgets remain **4 interfaces / 6 macro states / 7 Ledger event classes / 1 process-owned short mutex / 4 recovery boundaries / 11 Git gateway methods / 4 Ledger gateway methods**.
- No Spec Gate PASS, Test release/run, TDD_READY, implementation, GREEN, Regression, Candidate, Validator, independent review, integration, Acceptance, archive, Mode Activation, or H/P/C/A is claimed.

### F2/F3 Final Closure

| Finding | Exact current sections | Final hard-safety rule |
|---|---|---|
| F2 | Proposal `Objectives`; Design `Controller Command and Verifier Contract`, `WIP Pointer and Durable State`, `Seven-class Ledger`, and `Concurrency and Publication Answers`; Spec AC-002-02/08; Tasks `Second-revision refinements`; Test Plan `Authority, WIP, surface, and mutex`, F2 row/schedule; Traceability AC-002-02..04/08; Test Asset Retirement final reconciliation | atomic non-null active-slot publication/readback is the DISPATCH admission linearization point and precedes every READY/event write. Before it, no admission artifact is written. After it, every crash window retains Global WIP; Change B always rejects without enumeration. Missing/incomplete/conflicting admission is existing BLOCKED/manual-stop, status is fail-closed, run is effect-free, and identical DISPATCH cannot fill gaps. Only a complete pointer + READY + event tuple converges. |
| F3 | Design `Four Recovery Boundaries` and `Closed stop disposition and local pause`; Spec AC-003-06/005-03/04; Tasks `Second-revision refinements`; Test Plan `Four recovery boundaries`, F3 row/schedule; Traceability AC-003-06/005-03..04; Test Asset Retirement final reconciliation | Candidate commit, branch push, Ledger append, and Final Handoff/PR each retain one deterministic readback: exact success converges; exact absence permits only the already-bounded same-idempotency continuation; unresolved ambiguity enters `BLOCKED / MANUAL_CONTROLLER_STOP`. A later `run` returns the manual stop without invoking the gateway or duplicating the effect. No replay envelope or generic recovery mechanism exists. Evidence-unavailable local pause alone retains exact stored public-request replay. |

### Frozen F1/F4/F5/F6/F7/F8 Normative Readback

Pre/post SHA-256 values are identical for every frozen comparison unit:

- F1: Design public surface `75d25db172a2d552c0729e6e8fb5b3f8fa73438db91c89bc5485e8d28a5a723b`; Spec authority span `aa24741bb938b2979f6be6378f9d9d35a38fece29e88a251e45123fa2b2372da`; Test row/schedule `f08d310db014d76f3e9d0180e2b01f2d12afe0f8c08fb32ee9685c8444e95a0c`; retirement consumers `f09eb19a8c6bfd0b0d1cc68b626ad0bc2a5cf6521ac917be15037e9913c4d204`.
- F4: Design production composition `82669c89c09d2b38d1082ea1361b3aa9ebbf4300eaf750013735fce3b6186bdc`; Spec composition span `c00d05de956caadd6a6d1ebb742e77e7cfb2e6f10987c6f0f67fee8d45ac9184`.
- F5: Design result/error contract `bd0b91d309119f74f2cc297d252398087b0281b7b8b18d6cc79d678e09e20063`; closed schema span `121d9b4d95a4cdad2b922e56ab2cc45fbbfbbe878f4b06cffdee5cdc3c439415`; Spec span `1c238b63602cad69545a02111ff7dcfdbe051875eb1c06e94be8365ef087731a`; Test row/schedule `be8674b683b485ad030c71f7a2054dd90d796188ab25879078a5d11c93e062eb`.
- F6: Proposal endpoint `808f2d4a73c60154a90b29ac718aa19c39b51d93afc4883aea690b4568fa36a0`; Tasks R1-010..012 `85e5c9a581f9df2f7d2422d52090adce1d547e1ea0c60f9bbb6f9c92549e67dc`; Spec AC-007-07 `30a2a0cb2c5cb8c49d2a3839a0dc6a0ca579929c53c53b74e08f8d30fb198b73`.
- F7: Design canonical diff `232a673b6e1c68af3e881f7cc81dd3e9fe24234184b440d8989075ea0538d99e`; Spec AC-004-08 `e478759f6b7c9b7e80b87e5d37c15e3f4bad66af7721c005e4803b3c104ad609`; Test canonical-diff section `2af825d289904f1c520a7ee275dbb494a374a8b325cc445a61a5d884af94ee0b`.
- F8: Design Ledger publication `fc80b026b9368b99429e9aaf2858bdd82dfcbc9e987f5f002921620f541ffc5a`; Spec Ledger authority span `279166710fd51413e232e2a8a9591211337b716e9db4b2b3901649892c089ddc`; Test row/schedule `9694998a8a12500f154ab50a73b3a9d9b1493069f6337e9c9132ce954bfb87fe`.

The Reviewer's non-blocking F5/F8 follow-ups—immediate local-pause result wording, validation failure-code subsets, receipt field polish, and duplicate Agent-schema prose—remain deferred Test/Mode Activation checks and were not edited as normative contracts.

### Static Scope and Stop-line Evidence

- Current normative scans found no active pointer-last admission, event-before-pointer admission, high-value ambiguity mapped to `IDENTICAL_COMMAND_REPLAY`, post-BLOCKED stale-`run` gateway replay, replay envelope, fifth recovery boundary, generic recovery operation, or cross-Change enumeration authority.
- Baseline/readback hashes remained identical for production/reference (`02d932d273d676106f3f7a186a24e6a7fb892ddc55d7c6f667efaa988d269c34`, `05768e305648dcfe816b3053ae12aa595790304810cd4dd18ad32d475f51b330`, `563cb9ee2f70e389fb8969f2458605513da60e7ef92899a966ee0088f609ccb9`, `24775c196763c925fa22ade55f11cc659ac49f981ccb9a1783bcb32acb7379c2`), Test/fixture (`ee1efbf0d05370e538d030cf3e74f3f8b7f566cd2d1b71822b468d4b2476a1b9`, `d7b8d8e0d50d6c4c04ec5186f889b701330f0068b9dce9490af61840f77259b0`, `356fca48478763a29c2ddcc4739825a8c67cd8f92a82d2473bf43137e35f61b5`, `4447ba341104fbc07cf8a170412d490dd0edf579d42f453fe734b96204624293`), runner (`338b36ab9dc8fefadac70c9781d9b66eedca5d843cd75534d553ab4c30e04c53`), and this run's project-control baseline (`98ecc59385fe3c0c10fb77368c89c1145d0fd48b20ee287befefdb7ce0e0953b`).
- No OpenSpec CLI, Test, Worker, Validator, Reviewer, Agent, production import/check, runner, Git write/status/diff, network/host action, Mode Activation, or H/P/C/A was run. This is static Spec-only evidence.

### Remaining Blocking Ambiguity and Next Action

No remaining blocking ambiguity is identified inside the authorized F2/F3 correction. Any need for a new interface, state, event, mutex, recovery boundary, gateway method, durable authority, replay platform, queue/daemon/IPC, Contract Correction, or authority/scope/dependency/permission change returns `BLOCKED` to Controller. The next permitted action is one Controller final read-only check; this Spec role does not dispatch it.

`FINAL_HARD_SAFETY_CORRECTION_READY_FOR_CONTROLLER_READBACK`

## Reduced V1 GREEN, Regression, and Retirement Evidence — 2026-08-26

This section is the current implementation evidence. It preserves every earlier RED, rejected GREEN, review finding, correction and Spec-only result above as history.

### Final Test and production identity

- Test SHA-256: Coordinator `a4e06b4b37defe32f09f60450001278e11e6e6f0e3da58536931dfc540738af5`; CLI `28dcc5911c337bf7c3920bc8606657acced5292d5996dba8f77a9d30dd79a84a`; Git integration `b56712c825a5891ffb1be329c2f5714d9457468c402da1c854aa07111d44e358`; fixtures `ffe6774e23e591626d1a6cc046a483d4e78ee3dcf6ab87669344c8d16a634b76`.
- Production/reference SHA-256: Coordinator `556deacf5265e2f6d8153585061e2cbbf878ae77509cd852f7c8dc47cdb65869`; CLI `aa61b6005a58827824dfed6c2642050d53d2ebdd98cb86a10147a547df810510`; adapters `05e7598ccc185eaf3b0ef27e9662c121efac76837debf83caedb2c5c0183568c`; README `b804df7c1f18a8bf068859d894aee06589e36aca32102e727cf6d0c555e28243`.
- Environment: Node `v26.0.0`; canonical Git producer `2.54.0` at `/Users/huangbo/Dev/Env/homebrew/bin/git`.

### Final safety correction

Controller rejected the first 171/171 candidate because targeted source readback found `HANDOFF_IDENTITY_MISMATCH` returning a new `BLOCKED` version/hash without persisting that state. User authorized only `DTF-HANDOFF-STATE-DURABILITY-001`.

- Test-only revision changed only the existing Handoff mismatch leaf. Directed R1-007 was causally RED because `state.writeState` was not called.
- The same original Worker changed only `coordinator.mjs`, removing the early-return special case and reusing the existing `writeState` plus readback block path.
- Directed R1-007: **7/7 PASS**.
- Frozen focused suite: **171/171 PASS**.
- Existing safety-counterexample selection: **49/49 PASS**.
- Source readback confirms Handoff identity mismatch invokes the Handoff gateway once, writes `BLOCKED`, reads it back, and returns the persisted state identity. Failed write/readback still returns no durable state/version/hash claim.
- One Worker prompt-admission attempt was recorded as `START_FAILED`; it executed no code and wrote no repository file. The same authorized Worker succeeded on the bounded retry.

### Regression

- `node --test coordinator.test.mjs` -> **126/126 PASS**.
- `node --test cli.test.mjs` -> **27/27 PASS**.
- `node --test git.integration.test.mjs` -> **18/18 PASS**.
- Combined focused command -> **171/171 PASS**, zero fail/cancelled/skipped/todo.
- `tools/harness/validation/run` -> exit `0`, including repository typecheck, existing Xanthil/Model Pack suites, inactive boundary checks and project-control contract tests.
- `node --check` on the three `.mjs` production modules and all four Test/fixture modules passed; `git diff --check` passed.

### Test Asset Retirement

Controller reconciled the four tracked Test/fixture assets and recorded the complete Gate in `test-asset-retirement.md`. Ponytail found one unused one-line `already` helper export. The user's hard stop forbids reopening frozen Test for non-safety details, so it remains a visible Mode Activation/regression risk and is not represented as coverage. Verdict: `PASS — USER-AUTHORIZED NON-SAFETY WAIVER`.

### Gate result

Implementation GREEN, Regression, and the authorized retirement disposition are complete. No live key, trust path, ACL, SSH, host loop, real Agent, real GitHub/PR, `main` mutation, Mode Activation, or product Change was exercised by these tests. The next permitted step is exact-Candidate preparation followed by one fresh read-only Validator.

`REGRESSION_AND_TEST_ASSET_RETIREMENT_COMPLETE`
