# Traceability: Foundation Compatibility Repair

## Current Evidence Status

- Spec package: complete for Controller review
- Test/RED/TDD_READY/Worker/GREEN/Regression/Retirement/Validator/Acceptance/Archive: not released and not run
- Normative delta: none
- Canonical authority: `openspec/specs/dual-device-transition-foundation/spec.md`

## FCR / Canonical AC / Test / Task Map

| FCR objective | Existing canonical ACs only | Planned Test | Planned tasks | Observable evidence |
|---|---|---|---|---|
| `FCR-1` generic Change admission with WIP one | AC-DTF-001-02; AC-DTF-002-02; AC-DTF-002-08 | `TEST-FCR-001` | TASK-FCR-004..009 | valid non-Foundation Change reaches pointer-first READY; second Change rejects before effect |
| `FCR-2` exact review REVISION | AC-DTF-003-01; AC-DTF-004-07 | `TEST-FCR-002` | TASK-FCR-004..009 | exact Frozen-Candidate review return enters TEST_RED/zero budget; every binding mutation fails closed |
| `FCR-3` later Candidate and publication chain | AC-DTF-004-01; AC-DTF-004-03; AC-DTF-004-04; AC-DTF-004-07; AC-DTF-005-01; AC-DTF-005-03; AC-DTF-005-04 | `TEST-FCR-003` | TASK-FCR-004..009 | baseline/old-Candidate parent rules; null delivery uses first push plus post-readback without pre-read; non-null delivery requires exact old-Head pre-read; non-force same branch/PR, immutable history and ambiguity stop |
| `FCR-4` settlement and Coordinator-only NOT_STARTED | AC-DTF-002-05; AC-DTF-002-06; AC-DTF-005-01 | `TEST-FCR-004` | TASK-FCR-004..009 | four settlement variants and enums; settlement NOT_STARTED rejects; pre-request failure records NOT_STARTED without action |

## Canonical AC Coverage Readback

The conformance manifest references exactly these existing AC identities and no others:

```text
AC-DTF-001-02
AC-DTF-002-02
AC-DTF-002-05
AC-DTF-002-06
AC-DTF-002-08
AC-DTF-003-01
AC-DTF-004-01
AC-DTF-004-03
AC-DTF-004-04
AC-DTF-004-07
AC-DTF-005-01
AC-DTF-005-03
AC-DTF-005-04
```

No Requirement or Acceptance Criterion is defined, rewritten, added, deleted, published, or replaced by this Change.

## Path and Ownership Map

| Lifecycle owner | Writable path | Forbidden writes |
|---|---|---|
| Spec | `openspec/changes/foundation-compatibility-repair/**` | all production, Test, canonical, governance and project-control paths |
| Test | `tools/harness/change-coordinator/coordinator.test.mjs` | production, fixtures, adapters, CLI, runner, README, dependencies, OpenSpec/canonical, governance, project-control |
| Worker | `tools/harness/change-coordinator/coordinator.mjs` | Test, fixtures, adapters, CLI, runner, README, dependencies, OpenSpec/canonical, governance, project-control |
| Validator | none; read-only | every write |
| Controller | lifecycle evidence and integration only under separately satisfied Gates | no contract rewrite to fit implementation |

## Invalidation Rules

- Any canonical spec byte change invalidates this conformance-only package and blocks archive.
- Any new Test ID, FCR objective, task, write path, dependency, interface, field, state, event, Gateway, lock, or recovery boundary requires Controller review; a normative need blocks for user decision.
- Any Test correction changes the frozen Test hash and requires repeated causal RED/TDD_READY.
- Any Worker edit changes the Candidate and invalidates prior GREEN/Validator evidence.
- Any Head change after Validator invalidates the verdict.
- Historical failures and prior Candidate/Validator/Ledger facts are preserved; current evidence is added as a new section, never overwritten.

## Archive Mapping

At archive, this traceability file and the Change-local conformance manifest move together. No row is merged into the canonical spec. Archive completion requires a byte-for-byte hash readback of the canonical spec against `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
