# TASK-006 Proposal Validator Test Revision 002

Date: 2026-08-21  
Owner: Controller  
Role: same configured `juaner_test`

## Review finding

The negative helper currently calls `assert.throws(operation, /^CODE$/)`. Node matches that regular expression against an Error representation containing an `Error:` prefix, so the assertion rejects the approved `Error('CODE')` even though `error.message` is exactly the frozen code.

## Required correction

Change only `tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`. In the existing negative helper, replace the regular-expression matcher with an exact predicate over the thrown Error's `message`. It must accept only an actual `Error` whose `message === expectedCode`; it must not accept a raw string, substring, prefix/suffix, alternate code, cause, or missing throw. Preserve the same 132 tests, labels, Proposal oracle, mutation leaves, complete-graph no-freeze assertion, public-seam loading, and all other source bytes except mechanical formatting required by this matcher change.

## Validation budget

After Controller confirms the unaccepted Core candidate has been removed:

- Any number of `node --check` calls on the unit file.
- Exactly one complete focused expected RED: `node --test --test-name-pattern='TEST-XCLI-003' tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`.
- No full unit, production, helper, contract, integration, E2E, CLI, Pi, model, network, or dependency command.

Expected result remains `132` tests, `0` pass, `132` fail, with every failure caused only by the absent public Core operation. Return the new hash, exact counts, and `TDD_READY_TASK006_PROPOSAL_VALIDATOR_R2`, or a genuine conflict. Production remains locked until Controller acceptance.
