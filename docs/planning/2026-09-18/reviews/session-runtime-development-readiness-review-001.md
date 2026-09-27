# Session/Runtime Development-Readiness Review 001

## Review control

| Field | Value |
|---|---|
| Scope | Complete Blueprint/UI package plus Session and Runtime Boundary v1.0 |
| Reviewer | Fresh independent read-only support Agent with implementation-worker perspective |
| Route | `gpt-6-astra / high` |
| R2 trigger | Persistent Product Session/filesystem completeness/recovery and Agent Runtime/provider-call lifecycle |
| External study | None |
| Repository writes by Reviewer | None |
| Verdict | `NEEDS_CLARIFICATION` |

## 1. What I Would Build

The first real slice is a macOS professional-mode membership-repurchase Case
inside the accepted Xanthil dual-mode shell. It creates one durable local
Product Session, exposes it only after its persistent record and
`010_draw`/`020_clean`/`060_reports` are complete, preserves it across close and
reopen, and keeps Product Session, immutable per-attempt Run and Pi SDK session
as separate identities.

The user imports the approved local files without raw-data model exposure,
runs the fixed deterministic method and independent recomputation, reviews
evidence/refutation/limitations, accepts a Finding, then separately completes a
valid Decision Closure. Existing Application/Port/Pi, DuckDB/Python and Run
evidence boundaries are reused; `.xanthil/runs/<run_id>/` remains separate from
the Product Session store. Session creation makes no provider call. Demo state,
mocked persistence and a running page are not production acceptance.

These major boundaries are understandable, but three cross-document rules
still require an implementer to choose product behavior.

## 2. Required Guessing

### R1 — New-Case model assistance conflicts with the aggregate prerequisite

The supplement requires a versioned `020_clean` artifact and confirmation of
its exact subset before any assisted call. UI Contract v1.0 still exposes
`帮我整理问题` on New Case or Confirm Plan using user text, period labels and
aggregate column names before import or aggregate creation. UI Contract v1.1
retains that earlier model-exposure section unchanged.

An implementer would have to cancel or defer the action, or invent a text-only
model exception. That changes user flow and data-exposure authority.

Evidence: [Session/Runtime Boundary §5](../xanthil-desktop-session-runtime-boundary-v1.0.md#5-pi-and-model-call-lifecycle),
[UI Contract v1.0 §7](../xanthil-desktop-ui-contract-v1.0.md#7-model-exposure-interaction),
[UI Contract v1.1 introduction](../xanthil-desktop-ui-contract-v1.1.md).

### R2 — Product Session revision and Case revision are not related

The supplement binds a Run to the current Product Session revision. The base UI
contract assigns Draft/Ready/Review/Completed, input-change invalidation and one
active Run to a Case revision. It does not say whether the first slice is one
Case per Session, whether Session revision and Case revision are the same, or
whether they are separate linked version axes.

An implementer would have to decide which identity owns approved data scope,
Run binding and recovery, and what advances when Case inputs change.

Evidence: [Session/Runtime Boundary §§1–2](../xanthil-desktop-session-runtime-boundary-v1.0.md#1-three-different-identities),
[UI Contract v1.0 §8](../xanthil-desktop-ui-contract-v1.0.md#8-state-history-and-integrity-presentation).

### R3 — Assisted-call lifecycle versus Analysis Run is undefined

The supplement describes a bounded Pi-assisted Run, while the base Analysis Run
begins at Ready, computes the analysis, and produces a Finding. The optional
assisted actions occur at New Case, Review and after Finding acceptance.

An implementer would have to decide whether an assisted call is an Analysis
Run, a stage inside one, or another attempt type; whether it occupies the
one-active-Run limit; and how success, failure and cancellation are recorded
without changing Finding, report or Case state.

Evidence: [Session/Runtime Boundary §5](../xanthil-desktop-session-runtime-boundary-v1.0.md#5-pi-and-model-call-lifecycle),
[UI Contract v1.0 §§7–8](../xanthil-desktop-ui-contract-v1.0.md#7-model-exposure-interaction).

## 3. External Study Required

None. The Controller must close these semantics inside the formal package.
External Demo or repository study must not rescue missing plan content.
Implementation-time inspection of the existing CLI/Application contracts is a
later engineering exploration, not authority to choose the missing behavior.

## 4. Untestable Requirements

The current package cannot produce one expected result for:

- whether New Case assistance without an aggregate succeeds or is refused;
- which revision changes and owns prior approval after Case edits/reopen; or
- what execution record, concurrency guard and state effect an assisted call
  has on success, failure or cancellation.

Directory completeness, zero model activity on Session creation, raw-data
blocking and restart recovery are otherwise testable without selecting a
specific database or staging mechanism.

## 5. Correctly Deferred

Specific schemas, indexes, serialization, IPC types, directory publication
mechanism, migration/retention policy, resource limits and packaging versions
may remain for the structure decision, OpenSpec or Design after the product
semantics close.

A second Runtime, persistent Pi-session recovery, registry, fallback and hot
switching are correctly deferred under ADR 0003. The package does not promote
Demo PASS to production evidence.

## 6. Required Plan Additions

1. State the aggregate prerequisite for each assisted action and explicitly
   replace the conflicting New Case rule.
2. Define the first-slice Project/Product Session/Case association and revision
   authority, including input changes, confirmation invalidation, Run binding
   and reopen recovery.
3. Add a short assisted-execution lifecycle table covering its relation to an
   Analysis Run, eligibility, activity limit, success/failure/cancellation
   record and effects on Finding, report and Case state.

These are product and authority rules, not requests for TypeScript names or a
persistent schema.

## 7. Verdict: NEEDS_CLARIFICATION

The principal Session/directory/Runtime boundary is clear, but R1–R3 still
require load-bearing product choices. Correct the package, then use a new fresh
Reviewer. This review does not authorize OpenSpec or production implementation.
