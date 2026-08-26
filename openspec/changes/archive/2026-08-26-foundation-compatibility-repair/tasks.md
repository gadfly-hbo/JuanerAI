# Tasks: Foundation Compatibility Repair

## Current Status

- Change: `CHG-foundation-compatibility-repair`
- Prior Candidate `419746cc45deeb21ebe2688bf1151b48919cedab` and its fresh Validator `FAIL` remain preserved historical evidence.
- Current verdict: `SECURITY_REVISION_REGRESSION_AND_TEST_ASSET_RETIREMENT_PASS`.
- Current Gate: Controller evidence closure and replacement Candidate preparation; Acceptance, integration and Mode Activation remain locked.

## Authorized Safety Revision Addendum — 2026-08-26

After the prior Candidate failed exact-Candidate validation, the user authorized one strictly bounded safety revision. This addendum records that later scope; it does not alter FCR-1..4, the canonical AC mapping, or the canonical Spec.

- Test wrote only `tools/harness/change-coordinator/coordinator.test.mjs` and `tools/harness/change-coordinator/git.integration.test.mjs`.
- Production wrote only `tools/harness/change-coordinator/coordinator.mjs` and `tools/harness/change-coordinator/adapters.mjs`.
- Frozen Test SHA-256: `b1f3bed829a6160747a9fe6514f7946b167594e9ca50ab043b3339094421f696`, `9374395e1ca8477e6baf6bed28071d21afe1e97c4b3a74f799f89c96b4c23cd4`.
- Production SHA-256: `2d221ce17a5c33d603320391daabf99f7cb80d85efe419dec2b6170399fb4a7b`, `9a3859c835f144a49d7b457f01271454686132b3e370ecd4881507083f8221be`.
- Current verification: focused `174/174 PASS`; full change-coordinator `201/201 PASS`; project-board `12/12 PASS`; canonical runner exit `0`.
- No interface, state, event, Gateway, Schema, lock, recovery mechanism, dependency or canonical contract changed. Only one new exact-Candidate Validator is allowed; another safety `FAIL` stops.

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

The complete Change directory was physically packaged under this dated archive location before Candidate creation under explicit user authorization. That move did not itself pass Acceptance or the lifecycle Archive Gate. Its `specs/dual-device-transition-foundation/spec.md` is a conformance manifest and is not merged, copied, or transformed into `openspec/specs/dual-device-transition-foundation/spec.md`. Final Archive Gate completion still requires exact-Candidate Validator `PASS`, integration, and canonical-spec SHA-256 `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.

## Stop Lines

- no weakening or deleting unrelated current Foundation tests;
- no Test modification by Worker and no production modification by Test;
- no fifth write path, dependency, schema, public interface, state, event, Gateway, lock, recovery, or compatibility mode;
- no force/delete/replacement publication and no historical evidence rewrite;
- no claim of Mode Activation, product Change authority, Acceptance, integration, or archive before its actual Gate.
