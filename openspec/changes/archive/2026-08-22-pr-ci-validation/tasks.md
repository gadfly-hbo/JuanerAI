# Tasks

| Task | Owner and gate | Allowed output | Maps |
|---|---|---|---|
| PRCI-001 Explore | Controller + Spec, complete | OpenSpec package only | REQ-001..003 |
| PRCI-002 Spec Gate | Controller; complete | approved frozen Requirements, ACs, test path decision, and Worker scope | all |
| PRCI-003 Test/RED | `juaner_test`, complete | `tools/harness/validation/ci-workflow.test.mjs` | TEST-001..004 |
| PRCI-004 TDD_READY | Controller, complete | frozen RED evidence/hash and one-file Worker brief | all |
| PRCI-005 Implement | `juaner_worker`, complete | `.github/workflows/ci.yml` only | REQ-001..003 |
| PRCI-006 GREEN/regression | Controller, complete | focused test GREEN; local canonical runner, scope checks, and Test Asset Retirement Gate PASS | all |
| PRCI-007 Verify/accept/archive | `juaner_validator` PASS + Controller, complete | independent read-only verdict, acceptance, current-spec publication, archive | all |

The Test Agent must not modify `.github/**`, dependencies, the canonical
runner, or existing test drivers. The Worker must not modify tests or OpenSpec.
Any need for an additional workflow/file, package/dependency change, external
workflow run, mutable release lookup, broader permission, caching/artifact,
branch-protection/API write, retry/fallback, or non-`main` trigger returns to
Controller at Spec/Design rather than extending this task.
