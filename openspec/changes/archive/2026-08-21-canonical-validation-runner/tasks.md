# Tasks

| Task | Owner and gate | Output / allowed path | Maps |
|---|---|---|---|
| CVR-001 Explore | Controller, complete | unchanged `exploration.md` | REQ-001..004 |
| CVR-002 Lean Spec | Spec, complete when approved | Change documents only | REQ-001..004 |
| CVR-003 Spec Gate | User + Controller; first clarification complete | DuckDB-only first-token handling frozen; no new user decision | all |
| CVR-004 Test/RED | `juaner_test`; complete after DuckDB correction | Actual suffix reproduced; 1 pass / 3 causal fail | TEST-001..004 |
| CVR-005 TDD_READY | Controller, reissued | New frozen hash; same one-file Worker scope | all |
| CVR-006 Implement | `juaner_worker`; complete after one revision | One executable POSIX runner; DuckDB-only first-token handling | REQ-001..004 |
| CVR-007 GREEN/regression | Controller, complete | Focused 4/4 plus full offline runner exit 0 | all |
| CVR-008 Verify/accept/archive | Validator + Controller, complete | independent PASS; activation, current spec, and archive | all |

Test, Worker, and Validator do not run a real model/provider call or write
`.juanerai/project-control/`. Controller lifecycle updates remain permitted by
AGENTS.md and do not change project-board schema/behavior. Any need to touch a
manifest, dependency, existing suite, second implementation file, persisted
result, or real-call path returns to Controller re-slicing.
