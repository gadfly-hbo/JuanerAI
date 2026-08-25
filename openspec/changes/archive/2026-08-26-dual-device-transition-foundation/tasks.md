# Tasks: Dual-device Transition Foundation — Reduced V1

## Current Status

- Reduced Spec package: drafted by `juaner_spec`.
- Current verdict: `FINAL_HARD_SAFETY_CORRECTION_READY_FOR_CONTROLLER_READBACK`, not Spec Gate PASS.
- Test, Worker, Validator, integration, Mode Activation, and H/P/C/A: locked/not started.
- Historical implementation/Test/GREEN evidence: preserved but not released for reduced V1.

## Ordered Task Plan

| Task | Owner / release Gate | Exact output | Maps |
|---|---|---|---|
| `TASK-DTF-R1-001` Reduced OpenSpec rewrite | `juaner_spec`; current bounded run | Proposal, Specification, Design, Tasks, Test Plan, Traceability, Test Asset Retirement, plus appended verification read model; OpenSpec only | all REQ |
| `TASK-DTF-R1-002` Independent reduced-Spec and overdesign review | fresh read-only Reviewer + Controller; blocked until R1-001 | verify 4/6/7/1/4 surfaces, load-bearing implementability, no reopened decision, no old machinery, and complete REQ/AC/Test mapping; return PASS or clarification | all REQ |
| `TASK-DTF-R1-003` Deterministic Test boundary preflight | fresh `juaner_test`; blocked until Controller Spec Gate PASS | helper health for canonical JSON/signature doubles, test-only factory, one-host-loop composition negatives, orphan READY/local pause, closed schemas, Evidence Ref remote readbacks, and bounded host-independent temporary Git; no production writes | REQ-001,002,004,005,007 |
| `TASK-DTF-R1-004` Derive reduced causal RED | same Test role after healthy preflight | rewrite only four Test-owned files; prove F1-F8 plus the reduced 4/6/7/1/4 contract with positive/negative/boundary/failure/forbidden-effect leaves | all REQ |
| `TASK-DTF-R1-005` Freeze TDD_READY | Controller; after causal RED | exact Test hashes, commands, environment, leaf count, AC mapping, RED cause, retirement ledger, and frozen Worker write set | all REQ |
| `TASK-DTF-R1-006` Implement reduced Foundation | fresh `juaner_worker`; blocked until TDD_READY | minimum inactive core, test-only construction seam, orphan/local-pause logic, closed schemas, sole-authority Ledger publication, and deterministic diff producer in four production/reference paths only; preserve frozen Tests/OpenSpec | REQ-001..007 |
| `TASK-DTF-R1-007` Focused GREEN | Worker evidence + Controller readback | focused Coordinator/CLI/temporary-Git suites and exact hashes; no historical count reuse; no live effects | all REQ |
| `TASK-DTF-R1-008` Conditional canonical runner integration | Worker only after focused GREEN and Controller release | append only the exact accepted reduced-V1 test commands to `tools/harness/validation/run` if needed; otherwise record no change | REQ-007 |
| `TASK-DTF-R1-009` Regression and Test Asset Retirement | Controller; Test-only return if needed | full affected regression, `REGRESSION/TEST_ASSET_RETIREMENT` validation result, complete asset reconciliation, and PASS required | REQ-002,004,005,007 |
| `TASK-DTF-R1-010` Exact Candidate and fresh Validator | current pre-Activation Git/governance workflow then fresh `juaner_validator`; after R1-009 | Controller stages/commits through the existing workflow, runs final validation, and dispatches Validator on that exact Candidate SHA; the inactive Coordinator is not used to create/push/freeze it | all REQ |
| `TASK-DTF-R1-011` Controller integration and archive | Controller/user current Git authority; after fresh Validator PASS | existing Git workflow pushes/creates or updates PR, handles review/changes_requested, Acceptance, squash merge, archive, and authorized manual dual-main ff-only synchronization; inactive Coordinator mechanics are not used | all REQ |
| `TASK-DTF-R1-012` Mode Activation | separate approved Change only | compose the sole production Mac mini host loop, trusted ingress/transports, real trust/key/ACL/SSH/GitHub canaries, and prove unattended DISPATCH-to-review-ready-PR plus later RELEASE | REQ-001,007 |

### Second-revision refinements to existing tasks

- R1-003/R1-004 SHALL add independent helper/mutation leaves for ingress-only CLI retirement, active-slot-first admission and every pointer/state/event crash window, every blocked/local-pause reason, the four high-value manual-stop outcomes, STATUS/error/Agent/validation/gateway discriminants, and authoritative Ledger first/subsequent/partial receipts. No new Test identity is created.
- R1-006 SHALL implement those closed schemas and byte/receipt rules inside the already-frozen four production/reference files and eleven Git plus four Ledger gateway methods, with no READY/event write before slot publication and no high-value gateway call after durable ambiguity. It SHALL NOT add a public operation, state, event, mutex, recovery boundary, gateway method, replay envelope, platform mechanism, or Contract Correction.
- R1-009 SHALL reject any retained Test assertion for direct production CLI mutation, pointer-last admission, admission auto-completion after an incomplete active slot, stale `run` replay after high-value ambiguity, a missing reason/action leaf, a generic gateway reason, local Ledger authority, or an untyped partial-result path.

## Test-owned Exact Paths

- `tools/harness/change-coordinator/coordinator.test.mjs`
- `tools/harness/change-coordinator/cli.test.mjs`
- `tools/harness/change-coordinator/git.integration.test.mjs`
- `tools/harness/change-coordinator/fixtures.mjs`

Test SHALL NOT write production, README, runner, OpenSpec, project-control, Agent configuration, governance, product code, Git workflow, dependencies, or live external state. After TDD_READY, these files are byte-frozen except a Controller-authorized Test-only correction or retirement return.

## Worker-owned Exact Paths

- `tools/harness/change-coordinator/coordinator.mjs`
- `tools/harness/change-coordinator/cli.mjs`
- `tools/harness/change-coordinator/adapters.mjs`
- `tools/harness/change-coordinator/README.md`
- conditionally `tools/harness/validation/run`, for the exact accepted command append only

Worker SHALL NOT write Tests, OpenSpec, project-control, dependencies, existing Git scripts, governance/Agent activation, product paths, GitHub workflows, or live external state.

## Gate Ordering

```text
R1-001 reduced Spec
-> R1-002 independent review + Controller Spec Gate PASS
-> R1-003 helper health
-> R1-004 causal RED
-> R1-005 TDD_READY
-> R1-006 minimum Worker implementation
-> R1-007 focused GREEN
-> R1-008 conditional runner append
-> R1-009 regression + Test Asset Retirement PASS
-> R1-010 exact Candidate + fresh Validator PASS
-> R1-011 current pre-Activation Controller acceptance/integration/archive/manual dual-main ff-only synchronization
-> separate R1-012 Mode Activation
```

No historical Spec/GREEN/Validator result releases a changed Test, production, or Candidate SHA. Test changes return to TDD_READY; production/Candidate changes return to affected GREEN/regression/retirement review and a fresh exact-SHA Validator.

## Stop Lines

- Any need to edit an unlisted path or change authority, scope, schema, compatibility, ownership, dependency, permission, external effect, the 4/6/7/1/4 counts, canonical diff contract, repair bound, PR responsibility, or RELEASE semantics returns to Spec/Controller.
- Any parent-authored formal-role artifact or settlement without actual child-start/identity evidence is invalid.
- Any new per-Gate Controller acknowledgement, public stage method, state/phase/event, second lock, Evidence Ref WIP enumeration, generic recovery transaction, embedded binary diff, generic Git/GitHub surface, daemon/queue, or multi-Change abstraction is rejected.
- A Validator finding outside frozen implementation scope, inability to form causal RED, or second FAIL in one DISPATCH/REVISION authorization cycle enters `BLOCKED`.
- Dirty/mismatched Worktree or Candidate, wrong remote/PR/Validator Head, Ledger conflict, ambiguous recovery, failed RELEASE sync/readback, or scope mismatch cannot be waived by later success.
- Foundation does not run Test/Worker/Validator/Mode Activation in this Spec phase, start H/P/C/A, write project-control, create live refs/PRs/Worktrees, change host trust, commit, push, merge, archive, or delete.
