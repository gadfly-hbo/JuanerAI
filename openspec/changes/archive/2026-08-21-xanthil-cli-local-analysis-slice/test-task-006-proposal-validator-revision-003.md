# TASK-006 Proposal Validator Test Revision 003

Date: 2026-08-21  
Owner: Controller  
Role: same configured `juaner_test`

Revision 002 fixed exact `Error.message` matching but its predicate still accepts an Error with an own `cause`. The frozen failure contract permits only the stable code and forbids a nested cause.

Change only the same negative helper in `tests/unit/xanthil-local-analysis/local-analysis.unit.test.mjs`: retain `error instanceof Error` and exact `error.message === expectedCode`, and additionally require that the Error has no own `cause` property. Preserve every test, label, oracle, leaf, graph assertion, and other byte except mechanical predicate formatting.

After the restored absent-Core baseline, run syntax and exactly one complete focused expected RED. Return hash, exact counts, and `TDD_READY_TASK006_PROPOSAL_VALIDATOR_R3`. No other path or command is authorized.
