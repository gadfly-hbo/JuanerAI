# Traceability: Foundation Compatibility Repair

## Current Evidence Status

- Spec Gate, Test/RED, TDD_READY, Worker/GREEN, Regression and Test Asset Retirement: complete
- Prior Candidate `419746cc45deeb21ebe2688bf1151b48919cedab`: preserved with fresh exact-Candidate Validator `FAIL`
- Bounded safety revision: complete through GREEN/Regression/Retirement; replacement Candidate and Validator pending
- Acceptance and lifecycle Archive Gate: not complete
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

The table above records the initial FCR scope. A later explicit user authorization allowed one bounded safety revision on exactly two Test files (`coordinator.test.mjs`, `git.integration.test.mjs`) and two production files (`coordinator.mjs`, `adapters.mjs`). It is not a standing scope expansion; all other paths remain frozen except Controller-owned lifecycle evidence and project-control records.

## Safety Revision Evidence Mapping — 2026-08-26

| Existing objective | Preserved obligation | Permanent regression evidence |
|---|---|---|
| `FCR-1` | non-empty product Change identity and Global WIP one | empty `change_id` rejects before Worktree or Agent effects |
| `FCR-2` | exact, non-empty review decision evidence | empty `changes_requested_ref` / evidence identity rejects before revision effects |
| `FCR-4` | settlement subject equals the pending Agent request | wrong-subject `START_FAILED` rejects before `AGENT_RUN` or State persistence |
| `FCR-3` | later publication binds the exact prior remote Head without force | Coordinator supplies `expected_remote_head`; real Git mismatch prevents push and preserves the remote |

These leaves remain under the existing `TEST-FCR-001..004` identities. No new FCR objective, Test ID, requirement, AC, interface, Gateway, state, event, Schema, lock, or recovery mechanism was created.

## Invalidation Rules

- Any canonical spec byte change invalidates this conformance-only package and blocks archive.
- Any new Test ID, FCR objective, task, write path, dependency, interface, field, state, event, Gateway, lock, or recovery boundary requires Controller review; a normative need blocks for user decision.
- Any Test correction changes the frozen Test hash and requires repeated causal RED/TDD_READY.
- Any Worker edit changes the Candidate and invalidates prior GREEN/Validator evidence.
- Any Head change after Validator invalidates the verdict.
- Historical failures and prior Candidate/Validator/Ledger facts are preserved; current evidence is added as a new section, never overwritten.

## Archive Mapping

This traceability file and the Change-local conformance manifest were physically moved together into the dated archive package before Candidate creation. No row is merged into the canonical spec. The move is packaging evidence, not Acceptance or lifecycle Archive Gate completion. Final completion requires integration and a byte-for-byte hash readback of the canonical spec against `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
