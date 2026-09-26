# Change State Machine

Authority, adoption and stop behavior are defined only in
`docs/governance/product-change-execution-policy.md`. This is a human lifecycle
view; it does not change any runtime schema, old State/pause/Ledger or board data.

| State | Meaning / completion condition |
|---|---|
| REQUEST / EXPLORE / PROPOSAL | product result, scope and acceptance are clear |
| UI_CONTRACT / USER_UI_GATE | applicable UI Contract and required user approval bound |
| PRODUCT_INPUT_FREEZE | approved product semantics, acceptance, references and prohibitions fixed |
| ENGINEERING_INTAKE | Mini confirms original task, inputs, live worktree, scope, permissions, resource limits and stop point |
| IMPLEMENTATION | one engineering agent continuously owns behavior spec -> causal RED -> minimal GREEN -> necessary refactor; real runtime and affected checks run early |
| REGRESSION | applicable quality/regression complete; coverage retirement reconciled in existing evidence |
| VERIFY | independent read-only evaluation of complete fixed candidate; material findings return to the engineering loop |
| ENGINEERING_ACCEPT | Mini checks blockers, candidate identity, authority and acceptance obligations |
| PRODUCT_ACCEPT | user's required product verdict, or explicit non-applicability |
| ARCHIVE | authorized delivery/integration and current behavior baseline preserved |

SPECIFICATION, DESIGN, TASK_PLAN, TEST_DESIGN, RED and GREEN may describe internal
work or historical evidence; they are not approval boundaries. SPEC_GATE,
TDD_READY and TEST_ASSET_RETIREMENT in old records remain historical, not
requirements to recreate in adopted continuous work. Do not rewrite old records
or migrate state data merely to change the workflow.

Product preparation belongs to MacBook. Mini is the sole writer of current
engineering state. Record material results/transitions, not every inner test run.
Independent validation uses new fixed inputs after repair; it does not repeat
unaffected product preparation or create fresh role/command allowances.

BLOCKED names a concrete missing decision/evidence/safe route. Routine errors
stay in the engineering loop; repeated non-progress goes to Mini diagnosis.
True user/permission/resource stops are never removed by a role or state rename.
Receipt, engineering acceptance, Product Acceptance and Git permission remain
distinct.
