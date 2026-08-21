# TASK-003B Worker Handoff — Run Artifact Semantic Writer

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Change: `xanthil-cli-local-analysis-slice`

## Gate and Scope

- Spec Gate: PASS.
- Product Core remains `118/118` GREEN.
- Corrected test helpers are `2/2` GREEN.
- Focused TASK-003 target is a valid expected RED: `84` total, `61` pass, `23` fail, zero cancelled/skipped/todo. Every failure is downstream of current Application calling `beginRun({run_id})` without the newly frozen complete `initial_manifest`; no helper, syntax, dependency, or environment failure exists.
- Goal: make Application the sole semantic writer for complete in-progress, failed/cancelled, and succeeded Run Manifests while preserving all previously accepted runtime/tool/cancellation behavior.
- Non-goals: no Adapter implementation, Port method-name change, test edit, Product Core change, dependency/manifest/install, CLI/Profile/Pi/model/network work, or durable schema change.

## Routing and Ownership

- Role: fresh `juaner_worker`.
- Risk/difficulty: R2 shared command/state contract, standard after Controller/Test closure.
- Write risk: low; one existing `.mjs` file and one focused Node test execution.
- Allowed write only: `packages/application/local-analysis.mjs`.
- Frozen/forbidden: `packages/ports/local-analysis.mjs`, Product Core, every test/fixture, all Adapters, apps/profiles, OpenSpec, root manifests/lockfiles/dependencies, project-control, and every other path.
- You are not alone in the repository. Preserve all existing work and do not revert passing behavior.

## Exact Run Artifact Commands

Application must call only these closed commands and validate every closed result:

- `beginRun({run_id,initial_manifest})` -> exactly `{run_id}`
- `commitConfirmedContract({run_id,contract})` -> exactly `{committed:true,descriptor:{path:'analysis-contract.json',byte_size,sha256}}`
- `appendAsset({run_id,asset})` -> exactly `{appended:true,descriptor}`
- `replaceManifest({run_id,next_manifest})` -> exactly `{replaced:true}`
- `commitSuccess({run_id,next_manifest,evidence,summary,evidence_document})` -> exactly `{committed:true,success_manifest_is_last:true}`
- `readTerminalRun({run_id})` remains unused by this execution path and unchanged.

Reject missing, null, unknown, mismatched-run, checksum/descriptor, or false-success results. Do not retain or infer an implicit Artifact current run.

## Initial Manifest and Contract Commit

Before `beginRun`:

1. Construct the complete exact in-progress Run Manifest already represented by private `run`: schema/version, UUIDv7, analysis kind, status, start time, runtime/model provenance, exact contract path/SHA, canonical Source descriptor/read time, and `artifacts=[]`; no ended time, Evidence, or terminal detail.
2. Validate it through `createLocalAnalysisDomain().validateRunManifest`.
3. Pass it unchanged as `initial_manifest` and validate the exact `{run_id}` response.
4. Preserve one-attempt `RUN_COLLISION`; no retry, terminal write, runtime execute, or collided-run mutation.
5. Commit the confirmed contract with explicit run ID. Validate exact descriptor path/size/SHA against canonical UTF-8 `JSON.stringify(contract)` bytes and the initial manifest's contract checksum before runtime execution.

Contract-persist failure after a run was allocated maps to the frozen `contract_persist/ARTIFACT_WRITE_FAILED` terminal only when safe; no generic runtime mapping or success claim.

## Assets and Manifest Projection

- Pass explicit `run_id` on every `appendAsset`.
- Validate each exact append result and persisted descriptor against the Application-owned asset bytes/ID/category/path/media type/checksum before adding it to private committed-descriptor state.
- Keep committed descriptors private and unique. The approved manifest order is exactly `Q-001,S-001,O-001,O-002,DOC-SUMMARY,DOC-EVIDENCE`, independent of callback append order `Q-001,O-001,S-001,O-002`.
- Any failed or cancelled `next_manifest` contains every and only successfully appended Q/S/O descriptor available at terminalization, sorted by approved manifest order. It contains no Evidence reference or successful Markdown descriptors.
- Preserve cancellation quiescence: close admission, abort/cancel, wait independent runtime-turn settlement, then construct/validate/replace exactly one cancelled manifest. Python-validation cancellation after Q-001/O-001 append must retain exactly those two descriptors.
- A post-analysis validation failure after all four Q/S/O appends retains exactly all four descriptors.

## Successful Finalization

After verified runtime Finding, Evidence, and Markdown:

1. Encode Evidence as canonical UTF-8 `JSON.stringify(evidence)` bytes and compute `{path:'evidence.json',sha256}`.
2. Compute closed Artifact descriptors for `summary.md` and `evidence.md` from their exact UTF-8 bytes using IDs/categories/media types `DOC-SUMMARY/summary/text/markdown` and `DOC-EVIDENCE/evidence_document/text/markdown`.
3. Construct the complete succeeded `next_manifest` from the initial manifest, exact `ended_at`, Evidence reference, and exactly six descriptors in approved manifest order.
4. Validate Evidence/Markdown as already implemented, then validate `next_manifest` through Product Core before any success publication.
5. Call the exact run-explicit `commitSuccess` command. Accept success only from the exact closed success result; return the complete succeeded manifest as `result.run` only after the Adapter reports success-last.

Application computes semantic fields and checksums; the future Adapter only persists/verifies them. Do not add a test mode, fault selector, new public method, retry, ambient clock/root, or Adapter-specific value.

## Failure and Cancellation

- `terminalFailure` and cancellation pass `{run_id,next_manifest}` and validate exact replace results.
- Preserve stable stage/error mapping, shared AbortSignal, active-stage cancellation, 30/300 budgets, terminal immutability, collision behavior, and no retry.
- If terminal persistence itself fails, retain the original authoritative failure and make no success claim.
- No late callback, Asset append, Evidence/Markdown, or success event occurs after a terminal transition.

## Validation Budget

- Syntax/static checks, any number, limited to `packages/application/local-analysis.mjs`:
  - `node --check packages/application/local-analysis.mjs`
  - `rg` limited to the owned file
- Final focused GREEN command, maximum **one** Worker execution:
  - `node --test --test-name-pattern='^TASK-003' tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- No helper/partial/equivalent retry, unit/TASK-004/full suite, install/build, model, network, or test command/edit.

If the one target fails, stop `REVISION_SCOPE_ESCALATION`; do not rerun or edit tests.

## Handoff Evidence

- Changed path exactly the one allowed Application module.
- Source mapping for initial manifest, command-result closure, contract descriptor, explicit run IDs, retained partial descriptors, terminal projection, six-asset success manifest, and preserved quiescence.
- Syntax PASS.
- Focused `84/84` PASS, zero fail/cancelled/skipped/todo, command count `1/1`.
- No SDK/filesystem/environment/dependency/test-only leak and no high-write/temp/build artifact.
- Do not start TASK-004; Controller independently accepts first.
