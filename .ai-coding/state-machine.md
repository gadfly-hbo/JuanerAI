# Change State Machine

| State | Required Output | Exit Condition |
|---|---|---|
| REQUEST | raw intent | intent recorded |
| EXPLORE | scope, risks, unknowns | affected area understood |
| PROPOSAL | pre-OpenSpec product Change brief | goal and boundaries testable |
| UI_CONTRACT | change-scoped clickable UI Contract and state/closure matrix | complete proposed user flow, user-visible states, failures, cancellation, retry/recovery, and acceptance endpoints are directly exercisable |
| USER_UI_GATE | exact UI Contract version/path/hash and user-verdict reference | PASS |
| EXECUTION_PACKAGE_FREEZE | complete bounded Mac mini execution package on a published work branch, with exact branch, commit, tree, package path/hash, permissions, stop lines, role sequence, and receipt contracts | remote branch readback matches the frozen package commit and MacBook stops writing that branch |
| MAC_MINI_SESSION_DISPATCH | one newly created Mac mini Codex task bound to the saved JuanerAI project, with the frozen package as its initial message and a recorded task/thread, host, project, repository, and delivery receipt | the new task is active/ready on Mac mini and has received the exact package identity |
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
frozen and dispatched. After the user authorizes package transfer, MacBook
completes `EXECUTION_PACKAGE_FREEZE`, creates a dedicated new Mac mini task, and
uses the package as that task's initial message. Dispatch never selects an
existing task by recency or ambient UI state. An existing task may be used only
when the user identifies it explicitly. Session creation or delivery failure
enters `BLOCKED_SESSION_DISPATCH`; the manual fallback is for the user to
create/open the Mac mini task and forward the same frozen package once.

`juaner_spec` and OpenSpec creation remain locked until the exact UI Contract
has the user's PASS and `MAC_MINI_SESSION_DISPATCH` has completed. A material
change to the approved product workflow or visible acceptance surface returns
to `UI_CONTRACT` and requires a new `USER_UI_GATE` verdict. One new execution
task owns one execution batch; normal in-batch stage progression and exception
handling remain in that task rather than creating another task per Gate.

Within a semi-automatic stage, eligible execution mistakes use
`docs/governance/product-change-execution-policy.md#bounded-execution-self-correction`.
Successful bounded correction returns to the interrupted check in the same
state; it creates no new lifecycle state or Gate waiver. Ineligible errors,
unknown effects, no progress or an exhausted budget enter BLOCKED and return
to MacBook with the existing stage records and preserved evidence.

BLOCKED preserves evidence and names one concrete release condition. UI, spec,
test, implementation, or contract conflict returns to the owning earlier state.
