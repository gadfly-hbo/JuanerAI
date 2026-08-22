# Change Retrospective

## Identity and Outcome

- Change: `CHG-runtime-provenance-neutralization`
- Change class: boundary change, R2 evidence
- accepted baseline: `1ba80d419e79f08f0002d17840c7cad92edc103c`
- archive path: `openspec/changes/archive/2026-08-23-runtime-provenance-neutralization/`
- final Validator verdict: `PASS 002`; first independent verdict `FAIL 001` remains historical evidence
- Controller acceptance: `ACCEPTED` by explicit user `验收`

## Intended Value

- user outcome: replace Pi-named Run Manifest keys with one neutral, closed, versioned provenance contract without changing the Personal analysis journey.
- intended delta: current schema `2.0` writes, exact terminal `1.0|2.0` read compatibility, neutral Runtime readiness, internal Profile identity, and unchanged Analysis Contract/Evidence schema `1.0`.
- reused baselines: Product Core/Application/Port/Adapter/Profile boundaries, Personal Pi/model selection, existing Artifact lifecycle, error vocabulary, 22 TEST identities, synthetic fixture/oracle, and canonical offline runner.
- non-goals: second Runtime, registry/fallback, new Port method, migration/normalization/backfill/repair, dependency or external Profile option, user-run inspection, and real provider/model use.

## Evidence Summary

| Evidence | Expected | Current Result | Source |
|---|---|---|---|
| Requirements and AC closure | exact neutral schema/ownership/compatibility decisions | Spec Gate PASS; no decision reopened | `proposal.md`, `design.md`, delta spec |
| expected RED | every approved new invariant fails causally before implementation | initial RED missed regex-matchable non-SemVer and readable-terminal negatives | `verification.md` |
| target GREEN | four layers plus strict typecheck | Correction 003 and bounded Worker Revision 001 now GREEN | `verification.md` |
| contract/regression | affected Adapter contracts and canonical offline runner PASS | Controller and Validator 002 independently PASS | `verification.md` |
| real runtime or external proof | loaded local SDK `VERSION`; no real model | local module observation covered; real model correctly not invoked | RPN-T05/T06 |
| independent validation | fresh read-only PASS | verdict 002 PASS; FAIL 001 conditions fully closed | `verification.md` |

## Effort and Rework

- Spec clarifications after Gate: `0`
- Test corrections for the same behavior: `3` including the current Validator-required return
- Worker revisions or replans: `1` completed as a two-file bounded SemVer correction
- model/reasoning upgrades: bounded R2 role substitutions authorized once per lifecycle role
- broad existing-test migrations: none
- Validator FAIL rounds: `1`
- environment or tooling incidents: none

## Good Friction

- Spec Gate froze exact ownership, compatibility, non-migration, and path boundaries before tests or production.
- Test/Worker separation prevented production changes from weakening assertions.
- The fresh Validator used an independent semantic probe rather than treating a fully GREEN standard suite as sufficient evidence.
- Frozen hashes and before/after status proved the Validator was read-only and localized the failure to contract coverage rather than environment drift.

## Avoidable Friction

| Friction | Root Cause | Earliest Preventive Gate | Evidence |
|---|---|---|---|
| incomplete operation/version matrix in first Test return | candidate list was not reconciled against every approved state and operation | Test Design preflight | Test Corrections 001/002 |
| regex-matchable invalid SemVer omitted | `malformed` was represented only by an obvious short form, not an independently valid-looking counterexample | Test Design / TDD_READY | Validator P1 semantic probe |
| readable validator and negative read matrix omitted | traceability named Unit + Artifact read evidence but delivered tests exercised only positive Storage reads | TDD_READY traceability audit | Validator P1 evidence finding |
| first retirement/GREEN verdict frozen too early | Controller reviewed ownership and consumers but did not reconcile every Test Plan row against an executable test title/case | Test Asset Retirement Gate | Validator FAIL 001 |

## Complexity Stop-Line Audit

- stop line crossed: yes
- trigger: second and third Test corrections for the same durable schema behavior; failed independent Validator reopens Test Design
- root-cause class: invalid/incomplete test plus production defect inside the frozen contract
- return Gate: Test Design Correction 003, renewed TDD_READY, and bounded Worker revision; all three completed
- re-slicing decision: no re-slice; contract, six-file production boundary, risk class, and user outcome remain unchanged
- quality evidence preserved: original RED/GREEN outputs, all prior hashes, Validator read-only evidence, and standard regression results remain recorded as historical evidence, not acceptance proof

## Reusable Outputs

| Asset | Authority/Path | Future Trigger | Reuse Rule |
|---|---|---|---|
| contract | delta spec and `design.md` | another durable provenance schema | reuse ownership and exact compatibility questions; do not infer a registry |
| contract test | RPN-T02/T03/T04 | versioned read/write split | include regex-matchable invalid versions and every read/mutation state |
| fixture/oracle | existing synthetic local-analysis fixtures | same accepted analysis slice | retain; no real/user data substitution |
| test double/harness | `port-contracts.ts` and SDK module hook | Runtime readiness changes | exercise public Port and loaded namespace, not source strings |
| Worker handoff pattern | six frozen production paths | bounded shared-boundary correction | keep tests/CLI/dependencies locked unless executable RED proves need |
| Validator check | invalid-SemVer public probe plus executable-plan reconciliation | any schema/version Change | independently probe at least one value that passes a naive regex but violates the named standard |

## Lessons

| Lesson | Classification | Target | Approval Needed |
|---|---|---|---|
| Durable version tests must include a standard-invalid value that still looks version-shaped. | workflow | future Change Test Design checklist; current evidence only until acceptance | no new product authority; persistent governance edit would require a separate approved change |
| TDD_READY and Retirement review must reconcile every Test Plan seam/state to an executable case, not only a traceability label. | workflow | Controller review practice | no new product authority; persistent governance edit would require a separate approved change |

## Process and Tooling Debt

| Debt | Impact | Owner | Separate Change Required | Release Condition |
|---|---|---|---|---|
| no automated Test Plan-to-executable matrix checker | manual reconciliation can miss a named seam/state | Controller | yes, only if repeated evidence justifies it | not required for this Change; manual Correction 003 and fresh validation suffice |

## Next-Change Baseline

- behavior that must be reused: current-only schema writes, exact bounded terminal dual-read, neutral provenance ownership, and real loaded-SDK version observation.
- decisions that must not be reopened implicitly: no registry/fallback/new Port method/migration; Profile config remains four fields; Analysis Contract/Evidence remain `1.0`.
- expected ordinary Change shape: exact standard-version counterexamples at public seams, explicit read/mutation state matrix, causal RED, one bounded implementation, and fresh validation.
- remaining risks: no release-blocking item remains; real Pi/provider acceptance and user-run inspection remain intentionally outside this Change.
- explicitly deferred work: any second Runtime, generic compatibility machinery, persistent process automation, user artifact migration, and real model acceptance.

## Completion Criterion

- [x] Final facts match verification, traceability, baseline, archive, and project board.
- [x] Reusable assets have discoverable pointers.
- [x] Durable behavior changes received explicit learning approval.
- [x] Tooling/code debt is not misrepresented as solved by documentation.
- [x] The next action and deferred work are explicit.
