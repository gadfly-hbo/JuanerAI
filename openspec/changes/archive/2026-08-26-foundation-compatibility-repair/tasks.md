# Tasks: Foundation Compatibility Repair

## Current Status

- Change: `CHG-foundation-compatibility-repair`
- Current Gate: Spec package complete for Controller review
- Current verdict: `SPEC_READY`, not Spec Gate PASS
- Production and Test remain frozen until their owning Gates

## Ordered Task Plan

| Task | Owner / release Gate | Exact output | Maps |
|---|---|---|---|
| `TASK-FCR-001` Baseline and authority freeze | Controller before Spec Gate | exact baseline/branch/status; canonical spec hash; frozen planning references; allowed/forbidden paths | FCR-1..4 |
| `TASK-FCR-002` Complete conformance-only OpenSpec | `juaner_spec` | required package, zero normative delta manifest, exact path/Test/Task mapping | FCR-1..4 |
| `TASK-FCR-003` Mandatory lean and Spec Gate readback | Controller | run `ponytail-review` on the complete seven-file package; read back paths, FCR/AC/Test/Task mapping, zero normative delta and frozen boundaries; decide Spec Gate | FCR-1..4 |
| `TASK-FCR-004` Test preflight and lifecycle ledger | fresh `juaner_test`, after Spec Gate PASS | helper/environment health; one-file test plan; test-asset classification; exact initial test hash and command | FCR-1..4 |
| `TASK-FCR-005` Causal RED | same Test role | `TEST-FCR-001..004` fail only for the four baseline incompatibilities; all rejection and forbidden-effect leaves executable | FCR-1..4 |
| `TASK-FCR-006` Freeze TDD_READY | Controller | exact Test hash, count, RED cause, command, baseline and Worker one-file scope | FCR-1..4 |
| `TASK-FCR-007` Minimum Coordinator repair | fresh `juaner_worker`, after TDD_READY | one-file production diff in `coordinator.mjs`; focused GREEN; no Test/spec/frozen-path edits | FCR-1..4 |
| `TASK-FCR-008` Regression and retirement | Controller/Test as governed | focused suite, affected regression, Test Asset Retirement reconciliation and ponytail disposition | FCR-1..4 |
| `TASK-FCR-009` Exact-Candidate verification | fresh read-only `juaner_validator` | fixed Head, complete diff/scope, Test hash, commands, negative evidence, canonical-spec hash and verdict | FCR-1..4 |
| `TASK-FCR-010` Controller integration and archive | Controller only, after PASS and Acceptance | review/PR/squash/integration under current workflow; archive this Change manifest; prove canonical spec byte-identical | FCR-1..4 |

## Test-owned Exact Path

- `tools/harness/change-coordinator/coordinator.test.mjs`

Test may read but must not modify fixtures, adapters, CLI, runner, README, dependencies, governance, project-control, production, or canonical specs. It must reuse existing harness facilities and may not add a new test framework or support file.

## Worker-owned Exact Path

- `tools/harness/change-coordinator/coordinator.mjs`

Worker must not modify Test, adapters, fixtures, CLI, runner, README, dependencies, governance, project-control, OpenSpec, or canonical specs. Worker does not commit, push, create a PR, merge, archive, start an Agent, or activate a host.

## Gate Ordering

```text
SPEC_READY
-> Controller mandatory ponytail-review and complete Spec Gate readback/PASS
-> Test preflight
-> causal RED for FCR-1..4
-> Controller TDD_READY
-> one-file Worker repair
-> focused GREEN
-> affected regression
-> Test Asset Retirement Gate
-> exact-Candidate fresh Validator
-> Controller review/Acceptance/integration
-> archive manifest with canonical spec byte-identical
```

No later Gate may be inferred from completion of an earlier task.

## Required Commands and Evidence

Planned focused commands:

```text
node --check tools/harness/change-coordinator/coordinator.test.mjs
node --check tools/harness/change-coordinator/coordinator.mjs
node --test tools/harness/change-coordinator/coordinator.test.mjs
tools/harness/validation/run
git diff --check
```

The Controller freezes exact commands, environment, hashes, test count, Candidate SHA, and any approved risk-based regression adjustment before Validator dispatch. Network, provider, real GitHub, real key, real Agent, and host canaries are forbidden.

## Archive Rule

At archive, move this complete Change directory under the normal dated archive location. Its `specs/dual-device-transition-foundation/spec.md` is a conformance manifest and moves with the Change. It is not merged, copied, or transformed into `openspec/specs/dual-device-transition-foundation/spec.md`. The canonical spec must retain SHA-256 `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69` unless the Controller stops for a separately authorized normative Change.

## Stop Lines

- no weakening or deleting unrelated current Foundation tests;
- no Test modification by Worker and no production modification by Test;
- no fifth write path, dependency, schema, public interface, state, event, Gateway, lock, recovery, or compatibility mode;
- no force/delete/replacement publication and no historical evidence rewrite;
- no claim of Mode Activation, product Change authority, Acceptance, integration, or archive before its actual Gate.
