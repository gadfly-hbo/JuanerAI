# TASK-006 Worker Revision 001 — CLI Boundary and Confirmation Order

Date: 2026-08-21  
Change: `xanthil-cli-local-analysis-slice`  
Gate: `TDD_READY_TASK006_REVISION_005`  
Role: fresh configured `juaner_worker`

## Dispatch route

- Risk: `R1`; one reversible CLI file against eight frozen executable failures, with no shared-contract or external-effect authority.
- Difficulty: `standard`; all root causes, expected classifications, and causal order are closed.
- Route: configured `juaner_worker`, `gpt-5.6-terra`, medium reasoning.
- Upgrade trigger: any remaining focused failure not explained by these three corrections.
- Duration: this CLI revision and one focused GREEN only.
- Rollback: reject the revision and retain the unaccepted three-path candidate for Controller disposition.

## Sole allowed write

- `apps/cli/xanthil.mjs`

Profile, CSV, tests/helpers, OpenSpec, Core, Application, Ports, Adapters, manifests/dependencies, board, credentials/global Pi, other Changes, and external paths are frozen.

## Exact corrections

1. Outer invocation classification: validate that the outer value is a plain symbol-free object with exactly `input`, `output`, and `application` keys without using nested non-nullness to classify the outer shape. Then apply the existing surface validators in the frozen order so a present `undefined`/`null` Application yields `CLI_APPLICATION_INVALID`, malformed output yields `CLI_OUTPUT_INVALID`, and malformed input yields `CLI_INPUT_INVALID`. Do not accept missing/extra/inherited/symbol outer fields.
2. Proposal boundary: separate the `await handle.discover()` error-mapping boundary from the Product Core validation boundary. Application-thrown/rejected Discovery errors continue through the frozen sanitized `failure(error)` mapping. Any throw from `domain.validateAnalysisProposal(proposal)` rejects exactly `CLI_APPLICATION_INVALID`; do not inspect or forward its raw message/cause and do not duplicate Proposal semantics.
3. Confirmation causality: after consuming explicit `confirm`, invoke `handle.confirm(proposal)` exactly once and attach its settlement observation before writing the single progress event; write progress before awaiting/acting on confirmation completion. Thus a progress writer failure observes one completed Application call and stops without input/cancel/terminal work. Preserve the existing one-next-event race, cancellation, mapped confirm failure, late-success discard, and no-unhandled-rejection behavior.

Make no other behavior or refactor change.

## Validation budget

- Any number of `node --check apps/cli/xanthil.mjs` calls.
- Exactly one complete focused command: `node --test --test-name-pattern='^TASK-006' tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`.
- No partial/helper/full-suite/Profile/CSV/Core/Application/Pi/model/network/dependency command.

Expected result is exactly `153/153` PASS, zero fail/cancelled/skipped/todo. Return CLI hash, concise correction evidence, exact counts, and `TASK_006_REVISION_001_READY_FOR_CONTROLLER_REVIEW`, or stop immediately with `REVISION_SCOPE_ESCALATION_TASK_006_R1`. Do not start TASK-008, real Pi, or Validator.
