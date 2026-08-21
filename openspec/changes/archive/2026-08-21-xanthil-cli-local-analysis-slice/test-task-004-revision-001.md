# TASK-004 Test Revision Contract 001

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20  
Origin: Controller review of `TEST_READY_FOR_TASK_004`

The first TASK-003B/TASK-004 RED package is not yet accepted. Fix exactly the three combined evidence gaps below. Do not expand the general harness or production scope.

## Accepted Evidence Preserved

- Syntax PASS.
- Helper health `2/2` PASS.
- TASK-003 focused: `84` total, `61` pass, `23` expected RED, no skip/cancel/todo; all failures originate at the old Application Artifact payload.
- TASK-004 focused: `71/71` expected RED; exact split `32` missing Analysis Adapter and `39` missing Artifact Adapter; no other failure.
- Existing constructor, real DuckDB/Python, containment, collision, atomic replacement, terminal, and cross-run leaves remain frozen unless directly adjusted by the three deltas.

## Allowed Paths

- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs`
- Everything else is forbidden, including production, OpenSpec except this Controller-owned contract, manifests/dependencies, unit/E2E, and project-control.

## Three Required Deltas

### 1. Retained partial assets

- A failed/cancelled complete `next_manifest` retains the descriptors of every asset whose append already succeeded, in the approved manifest order, with no uncommitted or success-only Evidence/Markdown entry.
- Add executable TASK-003B evidence for cancellation during Python validation: Q-001 and O-001 have already appended, so the cancelled manifest indexes exactly their descriptors and excludes S-001/O-002/docs/Evidence.
- Add real Artifact evidence that a failed/cancelled terminal after one or more appends retains those exact descriptors and that `readTerminalRun` returns the same indexed bytes.

### 2. Exact terminal read assets

- Update the stateless double/driver so `readTerminalRun({run_id})` returns assets in exact `manifest.artifacts` order, each with descriptor fields plus persisted `bytes`.
- A succeeded reference read returns exactly six entries in order `Q-001,S-001,O-001,O-002,DOC-SUMMARY,DOC-EVIDENCE`, including exact Markdown bytes.
- Empty assets remain valid only for a terminal manifest whose `artifacts=[]`; no unindexed or reordered file may appear.

### 3. Real success-last failure window

- Add one real filesystem failure case occurring during `commitSuccess` after valid Q/S/O appends and after input validation, using only a test-owned filesystem obstruction such as a pre-existing non-regular Markdown target.
- The call must fail sanitized, and the pre-existing `run.json` must remain byte-identical `in_progress`; it must not expose a succeeded manifest or Evidence reference. Inspect the real files, not an event double.
- No production fault option/selector or ambient path is allowed.

## Validation Budget

- Syntax checks: any number on the three paths.
- Helper health: maximum one new execution.
- TASK-003 focused: maximum one new execution; expected valid RED caused only by current Application old payload.
- TASK-004 focused: maximum one new execution; expected valid RED caused only by the two absent Adapter modules.
- No partial/equivalent retry, production edit, unit/E2E/full suite, install/build, model, or network command.

If any final target has another root cause or the three deltas cannot be encoded without contract invention, stop `TEST_DESIGN_BLOCKED`.

## Handoff

Return changed paths, the new/adjusted leaf names, syntax/helper results, both focused counts/root splits, scope/write-risk, and `TEST_READY_FOR_TASK_003B_AND_TASK_004` only if all three deltas are executable.
