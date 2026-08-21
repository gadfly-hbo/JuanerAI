# TASK-002 Worker Revision — Product Core Proposal Validator

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK006_PROPOSAL_VALIDATOR`  
Role: configured `juaner_worker`

## Dispatch route

- Risk: `R1`. The additive shared Interface contract and all product semantics were frozen by Controller and revised Spec Gate; this Worker receives one reversible production file and cannot change the Interface, tests, callers, persistence, dependencies, or external effects.
- Difficulty: `standard`. The exact canonical Proposal, public factory operation, error mapping, side-effect constraints, and executable leaf matrix are closed.
- Route: configured `juaner_worker`, `gpt-5.6-terra`, medium reasoning, workspace-write with the one-file path restriction below.
- Upgrade trigger: one evidence-backed reasoning failure, such as a focused semantic leaf remaining RED or unrelated existing Core regression caused by the implementation.
- Duration: this Core prerequisite GREEN only.
- Rollback: Controller rejects the return and keeps the original TASK-006 CLI/Profile/CSV Worker locked; no other production path may be changed to compensate.

## Objective

Make the minimum production change that adds exactly `createLocalAnalysisDomain().validateAnalysisProposal(proposal)` as frozen in `design.md`. The operation validates the complete first-scenario transient Proposal, returns the same valid input reference, and exposes no new top-level module export.

## Allowed write

Only:

- `packages/product-core/local-analysis.mjs`

All tests, OpenSpec, board, Application, Ports, Adapters, CLI, Profile, examples, fixtures, manifests/lockfiles/dependencies, credentials/global Pi, other Changes, and external paths are frozen.

## Implementation contract

- Reuse the existing private Core validation style and helpers; keep Proposal semantics local to Product Core.
- Validate the exact closed shape and canonical values in the revised `design.md`: questions/objective, source/fixture/date/columns, ordered windows, all five ordered six-field metrics, signal, output requirements, and constraints/approved tools.
- For a clean closed Proposal whose only invalidity is unsupported `schema_version`, throw exactly `Error('CONTRACT_VERSION_UNSUPPORTED')`. Every missing, null, primitive, array, non-plain, extra, wrong, reordered, wrong-cardinality, or nested semantic drift throws exactly `Error('VALIDATION_FAILED')` without raw values or causes.
- On success return the exact `proposal` reference. Do not mutate, freeze, clone, default, coerce, normalize, cache, log, read/write, inspect time/environment, import infrastructure, or introduce a mode/option/dependency/test seam.
- Add only the new method to the object returned by `createLocalAnalysisDomain()`; do not alter existing method behavior or exports.

## Validation budget

Run in this order and stop on any unexpected failure:

1. Any number of `node --check packages/product-core/local-analysis.mjs` calls.
2. Exactly one focused GREEN command: `node --test --test-name-pattern='TEST-XCLI-003' tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`.
3. Only after focused GREEN, exactly one full Product Core unit regression: `node --test tests/unit/xanthil-local-analysis/*.test.mjs`.

No contract/integration/E2E/CLI/Profile/real-Pi/model/network/dependency command is authorized. Return changed path/hash, exact focused and regression counts, and `GREEN_TASK002_PROPOSAL_VALIDATOR`, or stop with evidence. Do not resume TASK-006 or start Validator.
