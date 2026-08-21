# TASK-006 Test Handoff — Product Core Proposal Validator

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Gate: revised Proposal-validator Spec Gate PASS  
Role: configured `juaner_test`

## Dispatch route

- Risk: `R1`. The shared Product Core Interface decision is already frozen by the revised Spec Gate; this dispatch only derives reversible executable constraints inside two bounded test paths and cannot alter the Interface or runtime.
- Difficulty: `standard`. The proposal oracle, public seam, failure codes, mutation families, write paths, and single expected-RED target are closed.
- Route: configured `juaner_test`, `gpt-5.6-terra`, medium reasoning, workspace-write with the narrower allowed-path contract below.
- Upgrade trigger: one evidence-backed reasoning failure such as omitted frozen mutation families, incomplete leaf registration, or a RED not caused solely by the missing Core operation.
- Duration: this one Test/RED gate only.
- Rollback: reject the Test result and return to this handoff; production and the original TASK-006 Worker remain locked.

## Objective

Add a bounded executable unit contract for `createLocalAnalysisDomain().validateAnalysisProposal(proposal)` and establish expected RED caused only by that absent Product Core operation. Do not alter existing TASK-006 CLI/Profile/example tests or any production file.

## Allowed writes

Only:

- `tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`
- `tests/unit/xanthil-local-analysis/coverage-map.test.mjs` only if the existing mechanical coverage map requires the new case marker

All fixtures, integration/E2E/contract tests, production, OpenSpec, manifests/dependencies, board, global Pi/config/credentials, and other paths are frozen. Reuse the existing authoritative `expectedAnalysisProposal()` fixture; do not create a second proposal oracle.

## Required executable leaves

- positive exact Proposal returns the same reference, remains deep-equal, unfrozen if supplied unfrozen, and is not mutated, cloned, defaulted, or coerced;
- null/primitive/array/non-plain, missing and extra top-level fields;
- unsupported `schema_version` as the sole `CONTRACT_VERSION_UNSUPPORTED` case;
- original/clarified question and objective;
- `source_ids` type/cardinality/order/value;
- fixture identity, kind/path/hash/byte size, columns order/cardinality, and date coverage;
- windows type/cardinality/order and each ID/start/end value;
- metrics type/cardinality/order and each of the six exact fields for all five metrics;
- signal rule;
- output requirement flags and structured output order/cardinality;
- constraints flags and approved-tool order/cardinality;
- nested missing/null/extra/non-plain mutations across each invariant family.

Every invalid case except version must assert exactly `VALIDATION_FAILED`. Each mutation must be an independently scheduled top-level leaf or named top-level parameterized case and must load the public Core seam inside the test body so every leaf registers before the missing operation fails. No title-only class or broad representative may replace a frozen family.

## Validation budget

- Any number of `node --check` calls on changed unit test files.
- No helper-health execution unless coverage-map helper code changes; if it does, one helper-health run is allowed.
- Exactly one complete focused expected RED command selected before execution and matching every new Proposal-validator leaf; no partial final, retry, full unit suite, production target, or TASK-006 CLI target.

Expected RED is only the missing `validateAnalysisProposal` operation. Report exact tests/pass/fail/cancelled/skipped/todo counts and confirm all leaves register. Return `TDD_READY_TASK006_PROPOSAL_VALIDATOR` or a genuine `TEST_CONFLICT_TASK006_PROPOSAL_VALIDATOR`. Do not start a Worker or Validator.
