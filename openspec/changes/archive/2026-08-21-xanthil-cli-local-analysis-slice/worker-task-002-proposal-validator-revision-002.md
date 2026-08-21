# TASK-002 Proposal Validator Worker Revision 002

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK006_PROPOSAL_VALIDATOR_R3`  
Role: fresh configured `juaner_worker`

## Dispatch route

- Risk: `R1`; the shared Interface is already frozen and this is one reversible implementation file with no caller, persistence, dependency, or external-effect authority.
- Difficulty: `standard`; exact semantics and 132 executable leaves are closed.
- Route: configured `juaner_worker`, `gpt-5.6-terra`, medium reasoning.
- Upgrade trigger: one focused semantic failure or unrelated Core regression attributable to the implementation.
- Duration: this Core GREEN revision only.
- Rollback: reject candidate and keep CLI/Profile/example locked.

## Allowed write and objective

Modify only `packages/product-core/local-analysis.mjs` to add exactly `createLocalAnalysisDomain().validateAnalysisProposal(proposal)` as frozen in revised `design.md` and `worker-task-002-proposal-validator-revision.md`. All tests and every other production/document/configuration/external path are frozen.

The operation validates the entire exact first-scenario Proposal, returns the same valid reference, exposes no new module export, and performs no mutation, freeze, clone, default, coercion, cache, log, I/O, time/environment inspection, infrastructure access, mode, option, or test seam. A clean closed Proposal whose sole drift is `schema_version` throws exactly `Error('CONTRACT_VERSION_UNSUPPORTED')`; every other invalidity throws exactly `Error('VALIDATION_FAILED')`, with no own `cause` and no raw value. Reuse existing private Core validation style.

Do not reproduce the prior candidate's temporary `{...proposal}` or any other shallow/deep clone for version classification. Classify a version-only drift by reading and comparing the approved non-version fields directly.

## Validation budget

1. Any number of `node --check packages/product-core/local-analysis.mjs` calls.
2. Exactly one focused GREEN: `node --test --test-name-pattern='TEST-XCLI-003' tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`.
3. Only after focused GREEN, exactly one full Core unit regression: `node --test tests/unit/xanthil-local-analysis/*.test.mjs`.

Stop on any unexpected failure. No contract/integration/E2E/CLI/Profile/Pi/model/network/dependency command is authorized. Return file hash, exact counts, and `GREEN_TASK002_PROPOSAL_VALIDATOR_R2`; do not resume TASK-006 or start Validator.
