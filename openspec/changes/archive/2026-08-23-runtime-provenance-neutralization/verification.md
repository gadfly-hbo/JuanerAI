# Verification Read Model

## Current Verdict

`ARCHIVE_COMPLETE` — Fresh Validator 002 PASS is accepted, the approved delta is published into the current `local-analysis` capability specification, and the complete nine-file Change history is archived at `openspec/changes/archive/2026-08-23-runtime-provenance-neutralization/`. The project board is complete at phase `8/8`; post-archive canonical regression exits zero. No Git commit or push was performed.

## Frozen References

- Change: `CHG-runtime-provenance-neutralization`
- Capability: `local-analysis`
- Risk: R2 boundary change
- Difficulty: complex, fully decided
- Spec route: user-authorized default agent using `gpt-5.6-sol` / high for this single Spec run
- Test route: user-authorized default agent using `gpt-5.6-terra` / high for this single Test run
- Worker route: user-authorized default agent using `gpt-5.6-terra` / high for this single Worker run
- Validator route: user-authorized fresh default agent using `gpt-5.6-sol` / high under a strict read-only brief for this single Validator run
- Implementation/rollback baseline: `1ba80d419e79f08f0002d17840c7cad92edc103c`
- Branch: `work/macbook/runtime-provenance-neutralization`
- Current behavior authority: `openspec/specs/local-analysis/spec.md`
- Owned Spec write set: `openspec/changes/runtime-provenance-neutralization/**`
- Concurrent excluded state: Controller-owned `.juanerai/project-control/**`

## Baseline Evidence

| Evidence | Current observation | Status |
|---|---|---|
| supplied canonical baseline | exit `0` at accepted tree; Unit `250`, Contract `198`, Integration `243`, E2E `131` plus one gated skip, project board `12` | supplied baseline GREEN; not rerun by Spec role |
| current Product Core | Run validator accepts only `1.0` and Pi-named runtime keys | causal gap inspected |
| current Agent Runtime Port | methods exactly `preflightModel`, `openSession`; preflight returns model only | causal gap inspected |
| current Pi readiness | observes model but not loaded SDK `VERSION` | causal gap inspected |
| installed SDK namespace | local `VERSION` export observed as `0.84.2`; no model/provider call | feasibility observed |
| current Application | hard-coded schema `1.0` and Pi-named provenance; no Profile dependency | causal gap inspected |
| current Storage | one manifest validator path serves mutation and terminal read | causal gap inspected |
| current Profile config | exactly `workspaceRoot`, `runRoot`, `provider`, `modelId` | preserved |
| current test seams | affected identities/fixtures mapped in `exploration.md` and `test-plan.md` | inspected |
| user run directories | not inspected | prohibited/preserved |
| real provider/model | not invoked | prohibited/preserved |

## Decisions Closed

- New Run Manifest writes are exact schema `2.0` with neutral `product`, `runtime`, `adapter`, `profile`, and top-level `model` nodes.
- Analysis Contract and Evidence Index remain independent schema `1.0` contracts.
- Existing `preflightModel` returns closed runtime/adapter/model readiness; no Port method is added.
- Application owns Xanthil constants and semantic writing; Profile supplies only internal identity; Adapter owns/observes runtime, Adapter, and model provenance.
- Pi SDK version comes from the loaded SDK `VERSION` export.
- New mutations are `2.0` only; terminal read supports exact `1.0|2.0`; legacy bytes are never changed; legacy `in_progress` and unknown versions fail closed.
- Rollback preserves all artifacts and does not promise old-reader support for `2.0`.

## Package Completeness

| Artifact | State |
|---|---|
| `exploration.md` | complete producer/validator/consumer and decision mapping |
| `proposal.md` | complete goal/scope/non-goals/path/activation/rollback/evidence policy |
| `specs/local-analysis/spec.md` | atomic observable delta with exact changed and unchanged baseline wording |
| `design.md` | complete ownership, schema, Port, storage, compatibility, failure, security, and rollback design |
| `tasks.md` | complete Gate/role/path sequence; no early authorization |
| `test-plan.md` | complete positive/negative/version/compatibility/forbidden-side-effect intent and RED/GREEN plan |
| `traceability.md` | complete modified REQ/AC -> test group -> task -> planned seam/result mapping |
| `verification.md` | current read model; no future evidence claimed |
| `retrospective.md` | mandatory stop-line/Validator-FAIL retrospective; final outcome fields remain pending |

## Controller Spec Gate — 2026-08-22

- Mandatory complete-diff `ponytail-review`: `Lean already. Ship.`; `net: -0 lines possible`. Every new field, validator purpose, readiness value, compatibility path, task, and planned assertion group has a current consumer; no deletion finding was returned.
- Product contract: PASS. The exact schema `2.0` nodes/values, independent schema `1.0` Analysis Contract/Evidence, and unchanged user journey match the approved decisions.
- Ownership and architecture: PASS. Product Core validates, Application alone composes semantics, Profile supplies internal identity, Pi Adapter declares/observes readiness, and Storage/CLI only validate or transport. No second Runtime, registry, new Port method, vendor branch, dependency, or architecture drift is authorized.
- Compatibility and rollback: PASS. Mutations are current-`2.0` only; `readTerminalRun` is the sole exact terminal `1.0|2.0` reader; legacy bytes remain unchanged; legacy `in_progress` and unknown versions fail closed; rollback preserves artifacts without a retained-reader promise.
- Testability and evidence: PASS. Existing production seams, the SDK module hook, both affected Adapter contracts, four executable layers, exact byte snapshots, and the 22 existing TEST identities can express every changed AC without a real provider/model call.
- Scope and static integrity: PASS. Every delta REQ/AC identity exists in the current capability authority, all frozen Test/Worker paths exist, the complete Change package has no trailing whitespace, and no open decision remains.
- Gate result: PASS. `juaner_test` may change only the Test-role paths in `proposal.md` to derive tests and establish a healthy causal RED. Production, dependencies, current spec, project board, user artifacts, and real provider/model calls remain frozen.

## TDD_READY Review — Test Corrections

- Test Correction 001 cause: incomplete Test Design. The first return combined legacy-key mutations, omitted exact legacy terminal reads and the full mutator/version matrix, left a stale CLI version mutation, and did not provide the new internal Profile dependency to direct Application tests. The bounded Test role corrected those defects without changing production or conditional paths.
- Controller reproduction after Correction 001: `npm run typecheck` exit `0`; coverage-map test `1/1` PASS; RPN-T03 exact legacy `1.0` terminal reads `3/3` PASS and current `2.0` reads `0/3` causal RED; RPN-T04 mutation matrix `15/20` controls PASS and the five legacy-`in_progress` mutation admissions causal RED; all seven delivered SHA-256 hashes matched the Test return.
- Complexity stop line: triggered because a second Test correction is required. Root cause is `invalid, tautological, or incomplete test`, not missing product authority, structure, environment, or production behavior. Risk class remains R2 and production stays frozen.
- Test Correction 002 release condition: remove whitespace-based identifier rejection and mutable-Profile rejection that the approved contract does not require; construct exact legacy `1.0` current-validator/CLI candidates rather than hybrid `1.0`/`2.0` records; pass frozen `{id:"personal"}` to every direct Application construction; consolidate duplicate current lifecycle validator positives; then rerun typecheck, coverage-map, focused causal RED, scope/hash/count, and lifecycle-ledger checks.
- Retrospective: required before Change completion because the complexity stop line was crossed.

## Controller TDD_READY Gate — 2026-08-22

- Test Correction 002 scope: PASS. The Test role changed only seven approved paths. No conditional Test path, production path, dependency, current spec, project-board path, user run directory, or real provider/model call was used.
- Static/helper health: PASS. `npm run typecheck` exited `0`; the coverage-map test resolved `1/1`; `git diff --check` exited `0`.
- Exact compatibility RED: PASS. RPN-T03 independently scheduled all three exact legacy `1.0` terminal states and all three current `2.0` terminal states: legacy reads passed `3/3`, while current reads failed `3/3` with `ARTIFACT_WRITE_FAILED` because the baseline validator does not admit schema `2.0`.
- Exact mutation RED: PASS. RPN-T04 scheduled five Artifact mutators against four states each. The fifteen current/unknown/malformed controls passed, while the five legacy-`in_progress` cases failed only because the baseline admitted mutation instead of rejecting it. Full before/after tree and byte assertions remain present.
- Product/readiness/Application RED: PASS. Current-manifest, closed readiness, SDK `VERSION`, internal Profile, semantic composition, terminal propagation, and exact CLI legacy/current-result cases fail at the missing approved production boundaries. RPN-T07 reaches the missing Application/Profile dependency before its later readiness assertions on the baseline; this is an unavoidable chained RED across the same newly required dependency, not a helper or environment defect. The frozen test reaches the readiness assertions once the approved Profile seam exists; no test-owned compatibility workaround is authorized.
- Negative-case authority: PASS. Correction 002 removed unapproved whitespace-only identifier and mutable-Profile constraints. Unit and E2E legacy candidates are exact schema `1.0`, not hybrid records. Unknown `3.0`, malformed/closed-shape, independent legacy-key, and model/Profile/readiness cases remain independently represented.
- Post-Test scheduled counts: Unit `279`, Contract `198`, Integration `285`, E2E `134`. The expected Unit RED result is `271` pass / `8` fail; exact focused Contract, Integration, and E2E failures are causal to the frozen production gaps. The real-model E2E remains gated and was not invoked.
- Frozen Test hashes:
  - Unit `de9cf1ebe12f2432b5fead4cf2f9c790dd8c5518a92af09cdc61fe834ceb28ae`;
  - Contract `ae2269e194fcc564ccc7ed20b5a1091fe603ea4a1142b9c5e0ff5b49d83a90c4`;
  - Integration `2b03ef97a98ee661e3d7b296297e3f77bd02f72e33d436e0159125114640e71e`;
  - E2E `b6f9eb8d1891173609b67fce91158bea378512f56611455dabc66aee0b724878`;
  - Port-contract fixture `ca1bf8f25fcbd4bc780200ddd894d39c306c684fa87eb4ce8483f4d01c87194c`;
  - coverage-map fixture `93ef25966e0d6bef23a6ffebdfee6fce161dc03470696637bc694c8e0a0f422c`;
  - Pi SDK failure fixture `dc988bba78423c7b44c4aa20d227564ba8ebac01cf43d8351a7aad443832c26d`.
- Test Asset Lifecycle Ledger: all seven changed assets are permanent regression coverage. The four layer files retain RPN-T01 through RPN-T12 consumers; `port-contracts.ts` retains Agent Runtime and Artifact Port consumers; `coverage-map.ts` retains the current AC/`TEST-XCLI-001..022` identity consumer; `pi-sdk-failure-sdk.ts` retains the RPN-T06 loaded-SDK `VERSION` consumer. There is no tracked temporary probe, ownerless helper, retirement candidate, or deleted baseline case.
- Frozen Worker write set: `packages/product-core/local-analysis.ts`, `packages/ports/local-analysis.ts`, `packages/application/local-analysis.ts`, `adapters/agent-pi/local-analysis.ts`, `adapters/storage-local/local-analysis.ts`, and `profiles/personal/local-analysis.ts`. `apps/cli/xanthil.ts` remains locked: the executable CLI RED is caused by Product Core current-manifest validation, so no CLI-owned semantic or transport change is demonstrated.
- Gate result: TDD_READY PASS. The Worker may make only the minimum production delta in the six frozen paths. Tests, fixtures, conditional CLI, dependencies, current spec/archive, governance, project board, user artifacts, and real provider/model calls remain frozen to the Worker.

## Worker Delivery and Controller GREEN Gate Attempt — 2026-08-23 Asia/Shanghai

- Route and isolation: PASS. The user explicitly authorized a bounded default `gpt-5.6-terra` / high agent to act as the R2 Worker because the configured custom Worker is fixed below the R2 floor. It modified only the six released production paths and did not edit tests, fixtures, OpenSpec, the Controller board, CLI, dependencies, current spec/archive, user artifacts, or any other path.
- Product Core: current schema `2.0` validation and a separate exact terminal `1.0|2.0` readable validator are present. Legacy `thinking_level` remains readable only under the exact legacy rule; current model/provenance nodes are closed; legacy `in_progress`, malformed, and unknown versions fail closed.
- Port/Application/Profile: `preflightModel` keeps the same method name and now returns neutral closed `RuntimeReadiness`; method sets remain unchanged. Application owns `xanthil/1.0.0`, receives the internal closed Profile identity, validates deeply frozen readiness and requested/preflight/execution model equality, and propagates the same provenance through all terminal copies. Personal Profile still accepts exactly the original four external config fields and supplies frozen `{id:"personal"}` internally.
- Pi/Storage Adapters: the Pi Adapter observes `VERSION` from the same loaded SDK namespace, requires exact `0.84.2`, declares `pi` and `agent-pi/1.0.0`, and returns one deeply frozen cached readiness value. Storage uses current validation for every mutator and the bounded readable-terminal validator only for `readTerminalRun`; it adds no scan, normalization, migration, backfill, or repair behavior.
- CLI decision: PASS. `apps/cli/xanthil.ts` remained unchanged. Its existing Product Core validation path transports current schema `2.0` and rejects legacy/unknown values when presented as a current Application result, so the conditional path was correctly not released.
- Focused Controller reproduction: Unit `279/279`; Contract `198/198`; Integration `285/285`; E2E `133` PASS plus the one existing Controller-gated real-Pi skip, `0` failures. The real provider/model was not invoked.
- Static and canonical regression: `npm run typecheck` passed as the first phase of `tools/harness/validation/run`; the canonical runner exited `0`, including coverage-map identity resolution and project-board `12/12`. `git diff --check` passed.
- Frozen Test integrity: all seven TDD_READY SHA-256 hashes remain byte-for-byte identical to the values recorded above. No assertion was weakened or changed by the Worker.
- Frozen production hashes:
  - Product Core `efd09d91870af5729b9cb8548c2aed401b99879d4830b32199e01cfe9746b95d`;
  - Ports `486f8ce818e8e6123f35f00f18d52c76f0230d01cba2bb2df28846b17e3a3e1a`;
  - Application `694c66815574f465fe980a9c7d20490f661119f9ba32515caffc80091bd5dfcf`;
  - Pi Adapter `539977305cc511723c78aa4903a3a0898db47835b0731af9639ea1f474d8fbf8`;
  - Storage Adapter `0a36a9b5512db60c9d5f8f54a02d487ba383b93e2fbba39b8e316a77caaa1dab`;
  - Personal Profile `443426470ba05b0cef81a2ba845c32ced03ec2ed4aa770a0f60a090e0a9f2727`.
- Scope/non-goal proof: no package/lock or CLI diff; no new file, Port method, registry, Runtime, fallback, migration/repair path, external Profile option, DuckDB/Python change, user-directory inspection, or real-model call. Pi-specific current constants and SDK types remain inside the Pi Adapter; Product Core contains Pi-named keys only in the explicitly bounded legacy validator.
- Superseded result: the standard GREEN/regression commands passed, but fresh Validator semantic probes exposed a production defect and missing permanent tests. This attempt does not authorize acceptance or evidence freeze.

## Test Asset Retirement Gate Attempt — 2026-08-23 Asia/Shanghai

- Complete test-asset diff reviewed: four layer files plus `port-contracts.ts`, `coverage-map.ts`, and `pi-sdk-failure-sdk.ts`; no test asset was added, removed, renamed, or changed outside the frozen seven paths.
- Lifecycle reconciliation: all seven remain permanent regression assets with the consumers recorded at TDD_READY. `port-contracts.ts` is consumed by Contract, Integration, E2E, and CLI harness paths; `coverage-map.ts` is consumed by the exact identity test and integration graph checks; `pi-sdk-failure-sdk.ts` is consumed through the existing hook/child path and the RPN-T06 integration cases.
- Marker/duplication review: no added `skip`, `todo`, `only`, scratch, temporary, or correction marker. The sole E2E skip is the unchanged explicit real-Pi acceptance gate. Independently scheduled version, status, mutation, Profile, readiness, and CLI cases protect distinct current boundaries; none is ownerless or safely replaceable by a retained equivalent.
- Complete-diff `ponytail-review`: `Lean already. Ship.`; `net: -0 lines possible`.
- Retirement disposition: retain all seven assets; no tracked temporary evidence, retirement candidate, removed-case successor obligation, or Test-only correction exists.
- Superseded result: the complete delivered diff had no deletable or ownerless asset, but Validator found required permanent negative assets absent. The retirement Gate is reopened and cannot PASS until Test Correction 003 adds the missing evidence, GREEN/regression is re-established, and the complete revised test diff is reviewed again.

## Independent Validator Verdict 001 — FAIL — 2026-08-23 Asia/Shanghai

- Route/integrity: a fresh user-authorized bounded default `gpt-5.6-sol` / high Validator used a strict read-only brief. Before/after `git status --short` was unchanged; all six production and seven Test hashes matched the frozen values; no file or external state was modified.
- P1 production defect: `packages/product-core/local-analysis.ts` and `packages/application/local-analysis.ts` use a permissive semantic-version regex that accepts `01.0.0` and other SemVer-invalid forms. An independent public Product Core probe returned `ACCEPTED_INVALID_SEMVER` for current schema `2.0` with `product.version: "01.0.0"`. This violates closed current provenance validation and malformed-readiness rejection.
- P1 evidence defect: RPN-T03 has real Storage positive terminal `1.0|2.0` reads and byte preservation, but no direct Unit call to `validateReadableTerminalRunManifest`. The executable suite also lacks explicit `readTerminalRun` rejection plus byte/tree preservation for legacy `1.0 in_progress`, malformed, and unknown-version records. RPN-T02 tests obvious short versions such as `1.0` but no regex-matchable non-SemVer candidate.
- Independent standard evidence: `npm run typecheck` exit `0`; Unit `279/279`; Contract `198/198`; Integration `285/285`; E2E `133` PASS plus one expected real-Pi skip; canonical offline runner exit `0`, including wildcard Unit `280/280`, coverage map, and project-board `12/12`; `git diff --check` PASS. These results prove environment health but do not override the P1 semantic probe and missing matrix.
- Scope/architecture: otherwise PASS. Diff scope remains exactly six production plus seven Test assets outside expected Controller OpenSpec/board state. No CLI/package/lock/DuckDB/Python/dataset/current-spec/architecture/dependency change; method sets and layer ownership remain correct; no registry, fallback, migration, normalization, backfill, repair, scan, second Runtime, user-directory inspection, or real provider call.
- Test Asset Retirement: otherwise structurally sound; all delivered assets have consumers and no temporary/skip/todo/only/ownerless asset exists. Verdict remains reopened because required permanent negative assets are missing, not because any delivered asset should be retired.
- Recheck condition: add permanent public-seam tests for regex-matchable invalid SemVer and the complete readable-terminal negative matrix; freeze new counts/hashes and prove causal RED for the semantic-version defect; minimally correct Product Core/Application strict semantic-version admission; rerun focused GREEN, canonical regression, scope/hash checks, and the complete Retirement Gate; then dispatch a fresh read-only Validator.
- Verdict: FAIL. User acceptance cannot proceed.

## Controller Renewed TDD_READY Gate — Test Correction 003 — 2026-08-23 Asia/Shanghai

- Return classification: PASS. Validator FAIL 001 required an incomplete-Test correction first and then a production correction inside the already frozen R2 contract. No product decision, risk class, architecture, dependency, path family, schema, compatibility rule, or user outcome changed.
- Test scope: PASS. Correction 003 changed only `tests/unit/xanthil-local-analysis/local-analysis.unit.test.ts` and `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`; the other five approved Test assets remain byte-for-byte unchanged. Production, CLI, OpenSpec/current spec, project board, dependencies, user artifacts, and real provider/model calls remained frozen to Test.
- Strict-version causal RED: PASS. Product Core rejects all prior malformed controls but admits exactly three new SemVer-invalid values: core numeric leading zero `01.0.0`, numeric prerelease leading zero `0.84.2-01`, and dotted numeric prerelease leading zero `1.0.0-alpha.01`. Application readiness admits exactly the two scheduled invalid runtime/adapter values before Session or Artifact allocation. These five failing leaves are caused by the permissive production regex, not by helpers or environment.
- Read compatibility controls: PASS. The public `validateReadableTerminalRunManifest` is directly exercised for the exact `1.0|2.0 × succeeded|failed|cancelled` matrix and returns the caller object without structural change. It rejects current/legacy `in_progress`, unknown `3.0`, and malformed records. Real `readTerminalRun` independently rejects legacy `1.0 in_progress`, unknown, and malformed manifests with full artifact byte/tree snapshots unchanged; all six exact terminal positive reads remain GREEN.
- Controller reproduction: `npm run typecheck` exited `0`; coverage-map `1/1` PASS; `git diff --check` PASS. Focused Unit RPN-T02/T03 scheduled `42` cases with `38` PASS / `4` FAIL, consisting only of the three strict-version leaves plus their parent. Focused Integration RPN-T03/T07 scheduled `16` cases with `14` PASS / `2` FAIL, consisting only of the two strict-version readiness leaves. Full Unit reproduces only those three leaf failures plus their parent; full Integration reproduces only the two scheduled readiness failures.
- Superseding frozen Test hashes:
  - Unit `4de508aaa0e2e2e4ba94f37ae2004d6ca004ab907cc730fb129c47fe2debf15c`;
  - Contract `ae2269e194fcc564ccc7ed20b5a1091fe603ea4a1142b9c5e0ff5b49d83a90c4`;
  - Integration `8c5eb24c075044bbd84c6549493649047f5c3edb0ddcbc24fd8ef3a8db8478c3`;
  - E2E `b6f9eb8d1891173609b67fce91158bea378512f56611455dabc66aee0b724878`;
  - Port-contract fixture `ca1bf8f25fcbd4bc780200ddd894d39c306c684fa87eb4ce8483f4d01c87194c`;
  - coverage-map fixture `93ef25966e0d6bef23a6ffebdfee6fce161dc03470696637bc694c8e0a0f422c`;
  - Pi SDK failure fixture `dc988bba78423c7b44c4aa20d227564ba8ebac01cf43d8351a7aad443832c26d`.
- Superseding scheduled counts: Unit `293`, Contract `198`, Integration `290`, E2E `134`; the existing real-Pi E2E remains explicitly gated and was not invoked. Test-role full evidence was Unit `289` PASS / `4` FAIL, Contract `198/198`, Integration `288` PASS / `2` FAIL, and E2E `133` PASS plus one gated skip.
- Test Asset Lifecycle Ledger: all seven approved assets remain permanent regression coverage. Correction 003 added no new file, test-only production hook, temporary fixture, duplicate seam, skip/todo/only marker, or retirement candidate. Unit owns the direct domain/strict-version matrix; Integration owns Application side-effect ordering and real Storage byte/tree preservation. The other five assets retain their previously recorded consumers.
- Frozen bounded Worker revision write set: only `packages/product-core/local-analysis.ts` and `packages/application/local-analysis.ts`. Ports, Pi Adapter, Storage Adapter, Personal Profile, all Test assets, CLI, dependencies, current spec/archive, governance, project board, user artifacts, and real provider/model calls are locked to Worker.
- Required implementation: minimally enforce SemVer 2.0.0 for current provenance/readiness versions while preserving all already accepted exact versions and every frozen ownership/compatibility boundary. No new file, dependency, registry, fallback, shared compatibility service, Port method, or schema behavior is authorized.
- Gate result: TDD_READY PASS renewed. The bounded Worker revision may proceed.

## Bounded Worker Revision 001 and Controller GREEN Gate — 2026-08-23 Asia/Shanghai

- Route/scope: PASS. The already user-authorized R2 Worker changed only `packages/product-core/local-analysis.ts` and `packages/application/local-analysis.ts`. The other four production files, all seven Test assets, CLI, dependencies, OpenSpec/current spec, project board, user artifacts, and real provider/model paths remained frozen to Worker.
- Implementation: both owned files now use the same local full SemVer 2.0.0 syntax. It rejects leading-zero core numbers, leading-zero numeric prerelease identifiers, empty/dotted-invalid identifiers, and non-version-shaped values while retaining the approved `1.0.0` and `0.84.2` values. No dependency, new file, shared compatibility service, registry, fallback, Port method, schema behavior, migration, normalization, backfill, repair, or unrelated abstraction was introduced.
- Focused GREEN: Controller independently reproduced Unit RPN-T02/T03 `42/42`, including all strict-version leaves and direct readable-terminal controls; Integration RPN-T03/T07 `16/16`, including Application side-effect ordering and real Storage byte/tree preservation; and `npm run typecheck` exit `0`.
- Canonical regression: `tools/harness/validation/run` exited `0`. Wildcard Unit scheduled `294/294` including coverage map; Contract `198/198`; Integration `290/290`; E2E `133` PASS plus the one unchanged real-Pi gate skip; project board `12/12`. The runner cleared the real-Pi gate and no provider/model was invoked.
- Integrity: `git diff --check` PASS. All seven renewed Test hashes remain exactly those frozen at Correction 003. Production hashes after the bounded revision are:
  - Product Core `493ad62ba412cdfe738e3a7923b15bf1ce08c61b8841c4fe3dd908bb7f657859`;
  - Ports `486f8ce818e8e6123f35f00f18d52c76f0230d01cba2bb2df28846b17e3a3e1a`;
  - Application `6942f55e7ab45bacbd2ae4ced87b10e417f07da2d7ae3d7b5969e5ad727dba6d`;
  - Pi Adapter `539977305cc511723c78aa4903a3a0898db47835b0731af9639ea1f474d8fbf8`;
  - Storage Adapter `0a36a9b5512db60c9d5f8f54a02d487ba383b93e2fbba39b8e316a77caaa1dab`;
  - Personal Profile `443426470ba05b0cef81a2ba845c32ced03ec2ed4aa770a0f60a090e0a9f2727`.
- CLI/non-goal proof: `apps/cli/xanthil.ts`, package/lock files, DuckDB/Python/dataset, architecture/current spec, and validation runner have no diff. The implementation adds no second Runtime, user-run inspection, external Profile option, or real provider call.
- Gate result: GREEN PASS re-established. Production and Test assets are frozen at the hashes above for independent validation.

## Reopened Test Asset Retirement Gate — PASS — 2026-08-23 Asia/Shanghai

- Complete revised scope: the same four layer files plus `port-contracts.ts`, `coverage-map.ts`, and `pi-sdk-failure-sdk.ts`; no test asset was added, removed, renamed, or changed outside the approved seven paths.
- Lifecycle reconciliation: all seven are permanent regression assets with live consumers. Correction 003's Unit direct-validator/strict-version matrix and Integration Application/real-Storage matrix close Validator FAIL 001; the other five assets retain their frozen Port, SDK, CLI, and traceability consumers.
- Marker/ownership proof: no added temporary/scratch asset, test-only production hook, skip/todo/only marker, ownerless helper, duplicate seam, or retirement candidate. The one real-Pi E2E skip is unchanged and explicitly Controller-gated.
- Complete-diff `ponytail-review`: `Lean already. Ship.`; `net: -0 lines possible`.
- Disposition: PASS. Retain all seven permanent Test assets; there is no retirement or successor-cleanup action before validation.

## Independent Validator Verdict 002 — PASS — 2026-08-23 Asia/Shanghai

- Route/read-only integrity: a new user-authorized default `gpt-5.6-sol` / high agent received a fresh context and strict read-only brief. Branch/HEAD remained `work/macbook/runtime-provenance-neutralization` / `1ba80d419e79f08f0002d17840c7cad92edc103c`; before/after porcelain-status SHA-256 was identical at `96ea750598c71ad19a09b1be69194071661f7d6b5b644f79dbbb7f2e08c4cbf2`. It changed no repository or external state.
- Remediation probe: PASS. Public Product Core and Application seams accepted `1.0.0`, `0.84.2`, and a valid prerelease/build version; rejected `01.0.0`, `0.84.2-01`, `1.0.0-alpha.01`, empty/dotted-invalid prereleases, empty build metadata, underscore, `v` prefix, and whitespace suffix. Invalid Application readiness allocated neither Session nor Artifact.
- Independent regression: `npm run typecheck` exit `0`; `tools/harness/validation/run` exit `0`; Unit `294/294`, Contract `198/198`, Integration `290/290`, E2E `133` PASS plus exactly one existing real-Pi skip, and project board `12/12`. A separate compact Contract run also returned `198/198`; `git diff --check` PASS. The real-Pi gate was unset and no provider/model call occurred.
- Contract/ownership: PASS. Current writes are exact closed schema `2.0`; Analysis Contract/Evidence remain `1.0`; Product Core current/readable validators are separate; Application owns product semantics and validates frozen readiness/model equality; Profile exposes only internal identity; Pi observes the loaded SDK namespace `VERSION`; Storage alone uses readable-terminal admission and keeps all mutators current-only; CLI and Port method sets remain unchanged.
- Compatibility/evidence: PASS. Direct readable validation covers exact `1.0|2.0 × succeeded|failed|cancelled` plus current/legacy `in_progress`, unknown, and malformed negatives. Real Storage covers the full five-mutator × four-state rejection matrix, six exact positive terminal reads, three required negative reads, and before/after artifact byte/tree equality. RPN-T01 through RPN-T12, lifecycle consumers, and retirement claims reconcile; no new skip/todo/only or temporary/ownerless asset exists.
- Frozen integrity/scope: all six production and seven Test SHA-256 values match the Controller-frozen values. Outside expected Controller OpenSpec/project-control state, the diff is exactly those thirteen paths. There is no package/lock, CLI, current-spec, architecture/ADR, DuckDB/Python, dataset, dependency, or validation-runner diff and no second Runtime, registry, fallback, new Port method, migration, normalization, backfill, repair, scan, external Profile option, user-directory access, or real-model mechanism.
- Residual limitations: intentionally gated real Pi/provider acceptance was not run; user run directories were not inspected; Validator did not perform acceptance, current-spec merge, archive, board mutation, or rollback execution.
- Verdict: PASS. Validator FAIL 001 recheck conditions are fully closed and user acceptance may proceed. This verdict does not itself grant acceptance.

## Controller Acceptance and Publication — 2026-08-23 Asia/Shanghai

- User decision: explicit `验收` after Validator 002 PASS. The user accepts the frozen R2 scope, strict SemVer behavior, exact current-`2.0`/terminal-dual-read compatibility boundary, retained non-goals, and the stated residual limitations that real Pi/provider acceptance and user-run inspection were intentionally not performed.
- Controller verdict: ACCEPTED. All product decisions, Spec Gate, renewed TDD_READY, bounded Worker revision, GREEN/regression, Test Asset Retirement, and independent validation gates are complete with no waiver.
- Current specification publication: the approved delta was merged only into `openspec/specs/local-analysis/spec.md`. Its Requirement count remains `21`, Acceptance Criterion count remains `73`, neither set has duplicates, and `CHG-runtime-provenance-neutralization` is recorded as a source Change. Published SHA-256: `d9ebe12f7c146dcb1334e87161ec8f05724a1c2285294fe50ecbdf84d55613b8`.
- Publication scope: exact current provenance contract, modified REQ/AC wording, bounded compatibility rules, explicit non-requirements, and the TypeScript evidence-count replacement were merged. Every omitted Requirement, AC, stable failure, non-requirement, and Native TypeScript rule remains authoritative.
- Archive authorization: move the complete Change without deletion to `openspec/changes/archive/2026-08-23-runtime-provenance-neutralization/`, then complete the Controller board and post-archive consistency/regression checks. Production, Test, dependency, CLI, data, model, and user artifacts remain frozen during archive.
- Git integration: no commit or push was requested or performed.

## Archive Completion and Post-Archive Verification — 2026-08-23 Asia/Shanghai

- Archive movement: COMPLETE. The active path `openspec/changes/runtime-provenance-neutralization/` is absent. The archive path contains exactly `design.md`, `exploration.md`, `proposal.md`, `retrospective.md`, `specs/local-analysis/spec.md`, `tasks.md`, `test-plan.md`, `traceability.md`, and `verification.md`; no historical file was deleted.
- Current authority: `openspec/specs/local-analysis/spec.md` remains at SHA-256 `d9ebe12f7c146dcb1334e87161ec8f05724a1c2285294fe50ecbdf84d55613b8`, with `21` Requirements, `73` Acceptance Criteria, no duplicate identity, and the accepted source-Change/provenance/compatibility wording.
- Project board: `health=complete`, phase `runtime_provenance_r2_archive_complete` at `8/8`; all eight milestones are `completed`; Requirements `7/7`, Tests `12/12`, Tasks `8/8`, Decisions `5/5`; RPN evidence paths point to this archive.
- Post-archive canonical regression: `tools/harness/validation/run` exited `0`; Unit `294/294`, Contract `198/198`, Integration `290/290`, E2E `133` PASS plus the one unchanged real-Pi skip, and project board `12/12`. `npm run typecheck` passed inside the runner and the real-Pi gate remained cleared.
- Final integrity: `git diff --check` PASS. Dirty paths classify only as the six accepted production files, seven permanent Test assets, current capability spec, this nine-file archive, and Controller-owned project-control status/events. No package/lock, CLI, dependency, validation-runner, data, user-artifact, or real-model mutation exists.
- Final verdict: COMPLETE. The published current spec is authoritative and this archive is immutable historical evidence. No commit or push was performed.

## Complexity-Stop Retrospective

- Trigger: the Test phase required two corrections before TDD_READY. Correction 001 fixed incomplete matrix construction and missing dependencies; Correction 002 removed unapproved constraints, hybrid legacy candidates, and duplicate lifecycle positives.
- Root cause: the initial Test return did not reconcile every generated candidate against the approved schema/ownership decisions and did not enumerate the full operation-by-state matrix before execution. The second review caught those test-design defects before production was unlocked.
- Containment: production remained frozen throughout both corrections; no product decision, risk class, dependency, path boundary, or assertion authority changed. Final hashes, exact legacy candidates, full five-by-four mutation matrix, and lifecycle ledger were frozen before Worker dispatch.
- Reuse for later Changes: before accepting a future durable-schema Test return, Controller will compare every negative candidate to an explicitly approved constraint and require an exact version/status/operation matrix plus lifecycle ledger in the first return. This is a review checklist, not new persistent machinery.
- Validator update: the first retrospective conclusion was premature. Fresh validation exposed a remaining negative-matrix gap and the corresponding semantic-version production defect. The stop line therefore returns to Test Design for Correction 003, then permits one bounded Worker revision only after renewed TDD_READY. No product decision, risk-class increase, re-slice, or scope expansion is required.

## Residual Risks to Verify Later

- Product Core current/readable type separation must not accidentally admit legacy mutation.
- Storage must preserve legacy bytes even on all rejection paths.
- SDK `VERSION` validation must use the loaded namespace and stay testable without a provider call.
- Terminal spread/copy paths must retain exact preflight provenance.
- Existing Evidence/Markdown and Local Analysis Execution behavior must remain unchanged.
- Strict SemVer correction must preserve all exact accepted current and loaded-SDK version values without creating a second source of product semantics.

## Gate Status

- Product decisions: PASS
- Spec package coherence: PASS
- Open load-bearing ambiguity: none
- Mandatory simplicity review: PASS — no findings
- Spec Gate: PASS
- Test Design / RED: TDD_READY PASS renewed after Correction 003; superseding hashes/counts frozen
- Implementation: GREEN PASS re-established; six production hashes frozen
- Test Asset Retirement Gate: PASS after complete revised-diff review
- Independent validation: PASS 002; Validator FAIL 001 conditions fully closed
- User acceptance: PASS; current `local-analysis` spec published
- Archive: COMPLETE; current spec/archive/board/post-archive regression consistent
- Git integration: not performed; requires separate authorization
