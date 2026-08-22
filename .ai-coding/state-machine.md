# Change State Machine

| State | Required Output | Exit Condition |
|---|---|---|
| REQUEST | raw intent | intent recorded |
| EXPLORE | scope, risks, unknowns | affected area understood |
| PROPOSAL | proposal.md | goal and boundaries testable |
| SPECIFICATION | delta spec with REQ and AC IDs | behavior unambiguous |
| DESIGN | design.md | interfaces and failure semantics covered |
| TASK_PLAN | tasks.md | requirements mapped to work |
| SPEC_GATE | Controller verdict | PASS |
| TEST_DESIGN | test-plan.md | AC coverage defined |
| RED | executable failing tests | EXPECTED_RED |
| IMPLEMENTATION | approved source change | target behavior implemented |
| GREEN | target test evidence | PASS |
| REGRESSION | related quality evidence | required checks PASS |
| TEST_ASSET_RETIREMENT | reconciled lifecycle ledger and Controller verdict, when test assets changed | PASS or not applicable |
| VERIFY | verification.md and traceability | READY_FOR_ACCEPTANCE |
| ACCEPT | risk-based approval | approved |
| ARCHIVE | main spec updated, Change archived | baseline represents current behavior |

BLOCKED preserves evidence and names one concrete release condition. Spec, test, implementation, or contract conflict returns to the owning earlier state.
