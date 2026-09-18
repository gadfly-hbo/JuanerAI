# Change State Machine

| State | Required Output | Exit Condition |
|---|---|---|
| REQUEST | raw intent | intent recorded |
| EXPLORE | scope, risks, unknowns | affected area understood |
| PROPOSAL | pre-OpenSpec product Change brief | goal and boundaries testable |
| UI_CONTRACT | change-scoped clickable UI Contract and state/closure matrix | complete proposed user flow, user-visible states, failures, cancellation, retry/recovery, and acceptance endpoints are directly exercisable |
| USER_UI_GATE | exact UI Contract version/path/hash and user-verdict reference | PASS |
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

Every product Change passes `UI_CONTRACT` and `USER_UI_GATE`; a backend,
runtime, adapter, or infrastructure label does not bypass them. These are
MacBook Controller states completed before the production execution package is
forwarded to Mac mini. `juaner_spec` and OpenSpec creation remain locked until
the exact UI Contract receives the user's PASS. A material change to the
approved product workflow or visible acceptance surface returns to
`UI_CONTRACT` and requires a new `USER_UI_GATE` verdict.

BLOCKED preserves evidence and names one concrete release condition. UI, spec,
test, implementation, or contract conflict returns to the owning earlier state.
