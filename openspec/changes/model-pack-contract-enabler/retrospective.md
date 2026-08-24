# Change Retrospective

## Identity and Outcome

- Change: `CHG-model-pack-contract-enabler`
- Change class: boundary change; R2 / complex root-cause
- accepted baseline: `2b2889029d6a0947027096acc0c541a7751fdd4f`
- archive path: pending
- final Validator verdict: pending; Validator 001, 002, 003, and 004 are historical `FAIL`
- Controller acceptance: blocked

## Intended Value

- user outcome: establish the shared inactive Model Pack package and scenario Runtime contracts that future Provider and Consumer Changes can target independently.
- intended delta: exact v1 contracts, one scenario-specific Runtime Port, deterministic shared drivers/suites, human contract documentation, and exact inert graph integration.
- reused baselines: JuanerAI business/Adapter boundaries, ADR 0003, native TypeScript and `node:test`, canonical offline validation, fail-closed contract admission, and existing Local Analysis regression authority.
- non-goals: Provider/SDK/Builder/Consumer implementation, Profile or CLI activation, real Artifact/model/data/network/MLflow access, dependency installation, registry/fallback/hot switching, persistence, and downstream H/P/C/A completion.

## Evidence Summary

| Evidence | Expected | Current Result | Source |
|---|---|---|---|
| Requirements and AC closure | five Requirements and 30 ACs with executable coverage | 11 material leaves reopened by Validator 004 | `traceability.md`, `verification.md` |
| expected RED | every material frozen invariant fails causally before implementation | nine Validator 002 leaves and two aggregate parents produced exact RED | `test-plan.md`, `verification.md` |
| target GREEN | focused, affected, and canonical evidence PASS | standard matrix PASS but 11 independent probes block semantic GREEN | `verification.md` |
| contract/regression | exact package/Runtime/inactive behavior plus affected baseline | five package/Runtime rule families remain open | `verification.md` |
| real runtime or external proof | none in E | correctly absent | `proposal.md` |
| independent validation | fresh read-only PASS | Validator 001, 002, 003, and 004 FAIL | `verification.md` |

## Effort and Rework

- Spec clarifications after Gate: multiple bounded Test-oracle clarifications; no product semantic expansion.
- Test corrections for the same behavior: more than two; complexity stop line crossed.
- Worker revisions or replans: more than two bounded returns inside the same two production files; complexity stop line crossed.
- model/reasoning upgrades: R2 automatic role routes only; no matrix waiver.
- broad existing-test migrations: one exact eight-entry append in existing `TEST-XCLI-021`; no broad migration.
- Validator FAIL rounds: `4`.
- environment or tooling incidents: Node v26 paired source-loader observer conflict; resolved as Test/toolchain mechanics without production mechanism.

## Good Friction

- Test/Worker isolation preserved assertions and prevented production from repairing evidence.
- Frozen hashes and clean committed Heads made both Validator failures reproducible and separated historical GREEN from acceptance authority.
- Independent public probes detected semantic gaps that full standard suites and canonical validation did not expose.
- The inactive boundary prevented the shared-contract Change from silently activating a Provider, Consumer, Profile, CLI, model, or external effect.

## Avoidable Friction

| Friction | Root Cause | Earliest Preventive Gate | Evidence |
|---|---|---|---|
| decimal ordering used IEEE-754 conversion | exact decimal semantics were not covered beyond safe integer precision | Test Design preflight | Validator 001 |
| malformed status and closed call shape were incompletely mutated | broad shape coverage omitted nested and outer-boundary leaves | Test Design preflight | Validator 001 |
| identity/control/length bounds lacked independent boundaries | Test matrix did not reconcile every normative validation rule to a leaf | Test Design / TDD_READY | Validator 002 |
| public accessor exceptions leaked raw diagnostics | carrier coverage exercised values but not adversarial property access | Test Design / security boundary review | Validator 002 |
| standard GREEN was treated as complete before independent semantic mutation review | executable count was used without a rule-by-rule public-boundary reconciliation | TDD_READY / Retirement Gate | both Validator failures |

## Complexity Stop-Line Audit

- stop line crossed: yes
- trigger: repeated Test corrections and Worker returns for the same contract, two failed independent Validators, and current GREEN/traceability contradicted by public probes.
- root-cause class: incomplete Test Design plus production defects inside the already frozen contract; evidence/read-model conflict is Controller-owned.
- return Gate: Controller evidence correction, then bounded Test Design with both production files frozen; causal RED releases only the owning production path(s).
- re-slicing decision: no re-slice. All findings stay inside the declared package/Runtime public boundaries, add no field or mechanism, and require no new product, architecture, data, security, dependency, or cross-domain decision.
- quality evidence preserved: all prior RED/GREEN, hashes, clean Heads, Validator reports, retirement evidence, and standard regression results remain historical and are not rewritten as acceptance proof.

## Reusable Outputs

| Asset | Authority/Path | Future Trigger | Reuse Rule |
|---|---|---|---|
| contract | delta spec and `design.md` | P/C consume Model Pack v1 | consume read-only; drift requires a Contract Change Request |
| contract test | package and Runtime contract suites | any implementation of MP-C01..03 | reconcile every normative boundary to independent positive/negative/error-carrier leaves |
| fixture/oracle | deterministic E fixtures | P Provider and C Consumer conformance | retain synthetic/local-only authority; never substitute real data in E |
| test double/harness | package and Runtime drivers | P/C implementation Changes | reuse unchanged through public seams |
| Worker handoff pattern | one owning source path per causal leaf set | bounded frozen-contract repair | keep tests, graphs, docs, dependencies, and activation locked |
| Validator check | precision, error-precedence, control/identity, and accessor-failure probes | any closed serialization/admission contract | include adversarial values that remain plausible to naive validators |

## Lessons

| Lesson | Classification | Target | Approval Needed |
|---|---|---|---|
| Closed-contract Test Design must reconcile every normative validation sentence to at least one independently named executable boundary leaf. | workflow | Controller Test Design preflight practice | no persistent governance edit in this Change |
| Sanitized-carrier tests must include adversarial enumerable getter failures at synchronous public object boundaries. | workflow | future shared-contract Test plans | no persistent governance edit in this Change |
| Exact decimal bounds must be tested immediately above and below each normative threshold beyond IEEE-754 safe precision. | reference | Model Pack contract suites | no new product authority |

## Process and Tooling Debt

| Debt | Impact | Owner | Separate Change Required | Release Condition |
|---|---|---|---|---|
| no automated normative-rule-to-Test reconciliation | semantic gaps can hide behind complete Test/AC counts | Controller | yes, only if separately approved | not required; manual reconciliation and fresh Validator suffice |

## Next-Change Baseline

- behavior that must be reused: exact closed package/Runtime calls, sanitized carrier, stable error precedence, exact decimal comparisons, printable bounded identities/categories, inert composition, and strict E -> H -> P -> C -> A integration.
- decisions that must not be reopened implicitly: no Provider/Consumer/Profile/activation in E; no dependency, registry, fallback, persistence, real data/model/network/MLflow, or new runtime abstraction.
- expected ordinary Change shape: rule-by-rule public-boundary Test matrix, causal RED, one owning production return, full affected/canonical GREEN, retirement reconciliation, and fresh independent validation.
- remaining risks: 11 Validator 004 counterexamples require causal RED, bounded two-file implementation, retirement, and fresh validation; all earlier counterexamples remain GREEN.
- explicitly deferred work: P/C/A implementations and every real Artifact, SDK, model, data, or activation proof.

## Completion Criterion

- [ ] Final facts match verification, traceability, baseline, archive, and project board.
- [x] Reusable assets have discoverable pointers.
- [x] Durable product semantics were not changed by this retrospective.
- [x] Tooling/code debt is not misrepresented as solved by documentation.
- [x] The next action and deferred work are explicit.
