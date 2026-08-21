# Change Complexity Control

Use this workflow when sizing a post-bootstrap Change, selecting its evidence level, or responding to repeated Spec, Test, or Worker corrections. It controls process complexity; it does not waive the OpenSpec, RED, GREEN, regression, Validator, acceptance, or archive gates.

## Classify Before Proposal

| Class | Meaning | Expected Path |
|---|---|---|
| R0 support | Documentation, inventory, or reversible mechanical work with no observable runtime or contract change | Reduced documented flow with scope and evidence review |
| Ordinary capability | Reuses current contracts, persistence, runtime, model, data, and security boundaries; changes one bounded user behavior | Small delta spec -> focused RED -> one Worker -> affected contracts/regression -> fresh Validator |
| Boundary change | Changes a durable schema, Port, external data source, Adapter, model/runtime, security boundary, concurrency, recovery, atomicity, permission, or external effect | Full Change path with explicit boundary decisions and R2/R3 evidence |
| Foundation/bootstrap | Establishes a first product slice or several system-wide baselines at once | Full path plus early feasibility probes, explicit reuse outputs, and mandatory retrospective |

Record the class and rationale in Proposal and every role handoff. Difficulty does not lower the risk class.

## Ordinary Change Baseline

An ordinary Change starts from current behavior in `openspec/specs/` and identifies only its intended delta. It should:

1. Name the reused capability, Port, fixture/double, error, persistence, runtime, and security contracts.
2. State the smallest observable behavior change and its non-goals.
3. Add or modify only the AC and tests needed for that delta.
4. Preserve unrelated baseline tests and contract drivers.
5. Release one bounded Worker write set after causal RED.
6. Run focused tests, every affected Adapter contract suite, risk-based regression, and a fresh read-only Validator.

The target is one Spec package, one Test return, one Worker implementation, and one Validator verdict. This is an operating target, not evidence by assertion.

## Overdesign Review Before Spec Gate

The Controller MUST run `ponytail-review` on the complete OpenSpec diff before
Spec Gate when any of these triggers applies:

- the Spec role used high or xhigh reasoning instead of its default medium;
- a non-core, internal, support, or governance Change introduces persistence,
  transactions, concurrency, recovery, retry, audit, a new protocol, multiple
  runtime modes, or background work;
- a personal, local, single-user, single-writer, or read-only scope invokes team
  or enterprise needs to justify present behavior;
- a Requirement, Acceptance Criterion, configuration option, abstraction, or
  test asset has no current consumer or approved acceptance scenario;
- a Test, Worker, or Validator finding expands the design instead of completing
  the approved objective; or
- a bounded feature begins to require broad existing-test migration or a
  dedicated complex test framework.

For every triggered review:

1. Apply `ponytail-review` to the complete Proposal, Specification, Design,
   Tasks, and Test Plan diff.
2. Map every Requirement, design mechanism, and test asset to the current
   objective, a current consumer, and an approved acceptance scenario.
3. Return findings without current necessity to Spec for deletion before Test
   dispatch.
4. When material complexity beyond the approved goal may still be necessary,
   stop and tell the user in plain language: the original goal, the added
   mechanism, who needs it now, its development/test/maintenance cost, and the
   simpler alternative.
5. Preserve that additional complexity only after explicit user approval.

Enterprise readiness is a two-sided review. Preserve the minimum Core,
Application, Port, Adapter, Profile, versioned-contract, and provenance
boundaries needed to keep future replacement possible. Defer enterprise-only
identity, tenancy, policy, isolation, storage, audit, deployment, migration,
concurrency, and recovery behavior to an explicitly approved enterprise Change.
The review checks both missing preparation and premature implementation.

This review removes unnecessary complexity only. It does not waive or delete
security, correctness, or R2/R3 controls required by the approved scope.

## Complexity Stop Line

For an ordinary Change, any item below stops automatic forward dispatch and returns control to the Controller:

- a second post-Gate Spec clarification for the same behavior;
- a second Test correction for the same AC or invariant;
- a second Worker revision or replan;
- an isolated feature unexpectedly requires broad migration of existing tests;
- the implementation unexpectedly crosses more Ports, Adapters, persistent structures, or security boundaries than Proposal declared;
- the same task needs a second model/reasoning upgrade;
- current verdict, traceability, test output, or frozen hashes contradict each other;
- a real external result requires an unapproved retry, reliability threshold, fallback, or diagnostic policy.

The stop line is a root-cause trigger. It never authorizes weaker tests, an incomplete fix, or acceptance without evidence.

## Root-Cause Return

Classify the stop before any new dispatch:

| Cause | Required Return |
|---|---|
| missing user/product decision | user decision brief, then Spec |
| ambiguous or missing behavior contract | Spec/Design |
| missing durable structure meaning | structure confirmation, then Spec |
| invalid, tautological, or incomplete test | Test Design with production frozen |
| production defect inside frozen contract | bounded Worker revision |
| unexpected cross-domain impact | Contract Change Request and re-slicing |
| environment/toolchain drift | restore approved environment; do not change behavior |
| external/model stochasticity | apply the pre-approved reliability policy; otherwise return to Spec/user |
| slice too large | split into independently verifiable vertical deltas |
| evidence/read-model conflict | Controller evidence correction before the next Gate |

Record the cause, evidence, owner, release condition, and whether the Change class must be raised.

## Concurrency and Publication Questions

Before Spec Gate for timeout, cancellation, retry, queues, persistence, atomic rename, or external actions, answer all of these:

- What event admits work?
- Which work is already issued when cancellation or expiry occurs?
- What is the physical and Application-visible linearization point?
- Which contender wins each race?
- What happens to late settlement or partial candidate output?
- Do concurrent public calls resolve, reject, or converge to one result?
- Which exceptional terminal or recovery writes remain permitted?
- What is the absolute bound, and what aborts it?

A status enum without these answers is not a closed concurrency contract.

## Test Design Preflight

Before TDD_READY, confirm:

- helper and environment health pass independently of missing product behavior;
- every material invariant has positive, negative, boundary, failure, and forbidden-side-effect leaves where applicable;
- independent mutations are independently scheduled rather than represented only by a broad title;
- doubles exercise the public boundary and do not replace the core behavior under test;
- wall-clock metadata, source-string scans, or production test seams are not used as substitutes for observable behavior;
- the current production fails for the intended missing behavior and all unrelated baseline checks remain healthy;
- the exact test hash, command, expected count, environment entrypoint, and Worker write set are frozen.

## Evidence Read Model

`verification.md` is the current read model. It keeps the current verdict, frozen references, evidence matrix, residual risks, next Gate, and links to detailed events. Historical attempts belong in an event ledger or bounded evidence files.

At every material transition:

1. Update the current verdict first.
2. Append or link the evidence event.
3. Update traceability and the project board.
4. Verify all three agree before dispatching the next role.

Before archive, prove that the top verdict, final Validator verdict, Controller acceptance, baseline hash, archive path, and project-board references agree.

## Retrospective Trigger

A retrospective is mandatory for:

- every foundation/bootstrap Change;
- any Change that crosses the complexity stop line;
- a failed independent Validator that reopens Spec or Test Design;
- a production or governance-tool incident exposing a missing safety contract;
- a user correction that should become persistent project behavior.

Use `docs/templates/CHANGE_RETROSPECTIVE.template.md`. Store product-specific reuse facts separately from this cross-Change workflow.

## Completion Criterion

Complexity control is complete when the Change class is explicit, reused baselines and intended delta are named, every stop-line event has a root-cause return, and the next role receives one bounded executable brief. A heavy first slice is acceptable; repeated unclassified repair loops are not.
