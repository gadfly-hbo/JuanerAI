# TASK-006 Proposal Validator Test Revision 001

Date: 2026-08-21  
Owner: Controller  
Role: configured `juaner_test`

## Review finding

The first Test return correctly established all frozen invalid leaves, but its positive leaf checked `Object.isFrozen` only for the Proposal root, `fixture`, and `metrics`. The approved same-reference/no-freeze contract applies to the complete caller-owned Proposal graph. The current assertion would not detect an implementation that freezes another nested object or array such as `source_ids`, `fixture.date_coverage`, a window, a metric item, `signal_rule`, `output_requirements.structured_outputs`, or `constraints.approved_tools_only`.

## Required correction

Change only `tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`. Extend the existing positive leaf so every caller-supplied object and array reachable from the Proposal is asserted unfrozen after validation. Keep the same unique `expectedAnalysisProposal()` oracle, same invalid leaves, same public-seam loading discipline, and same TEST/AC identity. Do not add production behavior or edit any other path.

## Revised validation budget

- Any number of `node --check` calls on the changed unit file.
- Exactly one complete focused expected RED rerun using the already selected `TEST-XCLI-003` command.
- No helper-health, full unit, production, CLI, integration, contract, E2E, Pi, model, network, or dependency command.

Return the new file hash, exact counts, and `TDD_READY_TASK006_PROPOSAL_VALIDATOR_R1`, or report a genuine conflict. Worker remains locked until Controller independently accepts the revised source and RED.
