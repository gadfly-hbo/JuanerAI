# Hypothesis and Strategy Asset Promotion and Writeback Gates

> Status: frozen product input; no asset writeback or activation authority
> Scope: product semantics only; no roles, Schema, storage, API, or implementation is created

## 1. Object boundaries

| Object | Scope | Meaning |
|---|---|---|
| Hypothesis template | reusable asset version | falsifiable explanation pattern with applicability and evidence requirements |
| Hypothesis instance | one Run | immutable parameterization bound to Data, Ontology, Workspace, observation window, and Evidence |
| Root Cause | one Run | Hypothesis instance accepted by the Root Cause Gate; not a global fact |
| Strategy template | reusable asset version | parameterized action pattern with applicability, exclusions, risk, reversal, and evaluation contract |
| Strategy instance | one confirmed context | immutable Action Recommendation candidate bound to Root Cause, target scope, constraints, and evaluation plan |
| task | authorized delegation | records assigned work; not execution or effect |
| Execution Receipt | one execution | records what occurred; not proof of effectiveness |
| Outcome | post-Action evidence | records observed result, attribution method, and uncertainty |

## 2. Separate Gates

### Root Cause Gate

The reviewer sees the confirmed problem, Data and Ontology snapshots, competing Hypotheses, supporting and refuting Evidence, missing Evidence, applicability limits, and uncertainty. Approval locks a run-specific Root Cause. Rejection returns the Run for more analysis or closes it as inconclusive. It does not authorize a Strategy or update a reusable asset.

### Strategy Gate

The reviewer sees the confirmed Root Cause, target scope, proposed Strategy instance, parameter choices, capacity, cost, risk, exclusions, reversal, owner, and evaluation plan. Approval creates only the authorized task or Action boundary named by a later approved contract. Rejection creates no task and does not erase the Root Cause.

## 3. Separate ledgers

- The Hypothesis evidence ledger records Evidence that supports, refutes, or leaves a Hypothesis inconclusive. Strategy outcome alone does not prove the original Root Cause.
- The Strategy effect ledger records the Strategy instance, authorization, execution, comparison design, Outcome, attribution, uncertainty, and evidence grade. An Execution Receipt alone does not prove effectiveness.
- The same Run may reference both ledgers, but the records and update rules remain distinct.

## 4. Candidate and promotion path

```text
run-scoped result
  -> user chooses whether to propose reusable learning
  -> draft candidate with source Run and scope
  -> business review
  -> asset-governance review
  -> immutable version
  -> explicit activation
```

Required product invariants:

- no silent writeback;
- no automatic activation by an LLM, Agent, Subagent, Skill, Prompt, Model Pack, Knowledge retrieval, Memory recall, task completion, or Outcome;
- no in-place mutation of an active version;
- historical cases remain evidence, not templates;
- Workspace-local learning remains local unless a separate promotion decision approves broader scope;
- unknown scope, conflicting Evidence, missing provenance, or missing authority keeps the candidate draft or rejected;
- a new version preserves its predecessor and complete lineage.

Exact review roles and signatures remain a productization decision. At minimum, business applicability and asset-governance completeness must be independently visible and neither may be inferred from the candidate author's identity.

## 5. Read-only first use

The first productized vertical slice may consume a frozen Scenario Asset Snapshot without supporting candidate creation or promotion. A report records the actual Hypothesis and Strategy asset identities and versions it used. User report approval is not implicit permission to write back.

## 6. Failure and cancellation

- Missing Data/Ontology snapshot, Evidence identity, asset version, scope, or review authority fails closed.
- Cancelling a Run leaves no active asset update. A previously saved draft remains visibly draft and retains its source linkage.
- Conflicting concurrent candidates do not overwrite one another; conflict resolution and merge semantics require a later explicit contract.
- Projection, search, or index lag blocks use when the consumer cannot verify the source asset version or hash; it never falls back to an unverified latest value.
