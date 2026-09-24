# Change State Machine

| State | Required Output | Exit Condition |
|---|---|---|
| REQUEST | raw intent | intent recorded |
| EXPLORE | scope, risks, unknowns | affected area understood |
| PROPOSAL | product Change brief | goal and product boundaries testable |
| UI_CONTRACT | change-scoped clickable UI Contract | proposed user flow and visible states are directly evaluable |
| USER_UI_GATE | exact UI Contract identity and user verdict | PASS |
| PRODUCT_INPUT_FREEZE | product goal, scope, UI, business semantics, acceptance criteria, non-goals, prohibitions, and upper stop lines | Product Manager freeze and user approval recorded |
| ENGINEERING_INTAKE | repository/WIP readback, feasibility, engineering package plan, and receiver receipt | Engineering Controller confirms exact input and current stop point |
| SPECIFICATION | delta spec with REQ and AC IDs | behavior unambiguous |
| DESIGN | design.md | interfaces and failure semantics covered |
| TASK_PLAN | tasks.md | requirements mapped to work |
| SPEC_GATE | Engineering Controller verdict | PASS |
| TEST_DESIGN | test-plan.md | AC coverage defined |
| RED | executable failing tests | EXPECTED_RED |
| TDD_READY | frozen tests, causal RED, environment health, allowed paths, and Engineering Controller verdict | PASS before Worker dispatch |
| IMPLEMENTATION | approved source change | target behavior implemented |
| GREEN | target test evidence | PASS |
| REGRESSION | related quality evidence | required checks PASS |
| TEST_ASSET_RETIREMENT | reconciled lifecycle ledger and Engineering Controller verdict, when test assets changed | PASS or not applicable |
| VERIFY | verification.md and traceability | READY_FOR_ACCEPTANCE |
| ENGINEERING_ACCEPT | Engineering Controller review of Gates, evidence, risks, and Validator | approved |
| PRODUCT_ACCEPT | user verdict when required by frozen product input | approved or not applicable |
| ARCHIVE | main spec updated, Change archived | baseline represents current behavior |

The Product Manager owns REQUEST through PRODUCT_INPUT_FREEZE. The Mac mini
Engineering Controller owns ENGINEERING_INTAKE through engineering delivery and
asks the user directly for out-of-bound decisions. A compatible engineering
contract gap returns locally to SPECIFICATION/DESIGN and repeats affected Gates.

Responsibility adoption is not ENGINEERING_INTAKE completion or execution
resume. An already active Change retains its task, state, history, budgets, and
stop line until the receiver receipt and any separate user resume decision.

BLOCKED preserves evidence and names one concrete release condition. UI,
product, spec, test, implementation, or contract conflict returns to its owning
earlier state. Validator PASS never skips ENGINEERING_ACCEPT or PRODUCT_ACCEPT.
