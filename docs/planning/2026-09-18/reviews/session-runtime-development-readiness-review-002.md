# Session/Runtime Development-Readiness Review 002

## Review control

| Field | Value |
|---|---|
| Scope | Complete corrected Blueprint/UI package plus Session and Runtime Boundary v1.0 |
| Reviewer | New fresh independent read-only support Agent with implementation-worker perspective |
| Route | `gpt-6-astra / high` |
| R2 trigger | Persistence, recovery, Agent Runtime and provider-call lifecycle |
| External study | None |
| Repository writes by Reviewer | None |
| Verdict | `PASS` |

## 1. What I Would Build

The first real slice is the macOS professional-mode membership-repurchase Case
inside the accepted Xanthil dual-mode shell. Quick mode, Fork, Subagent and
general Skill/Prompt remain visible Preview capabilities and cannot claim real
execution.

One real local Project can create at least one professional Product Session.
Each first-slice Session contains exactly one Decision Case. The Session ID is
stable; Case revision is the sole business revision; Analysis Runs and
Assistance Attempts have separate identities and bind to the exact Session and
Case revision.

A Session becomes usable only after its durable record and `010_draw`,
`020_clean` and `060_reports` are complete. A failed creation exposes no usable
partial Session, and retry cannot merge an ambiguous identity. `060_reports`
has no `030_reports` alias. `.xanthil/runs/<run_id>/` remains the immutable Run
evidence boundary and is not converted into Session storage.

The deterministic professional flow imports the approved local sources,
creates immutable snapshots, applies the fixed analysis and independent
recomputation, then separates Finding review, Finding acceptance, Decision
Closure and `完成分析案例`.

All three optional external-model actions are Assistance Attempts:

- `帮我整理问题` may run before `020_clean` only after exact disclosure and
  confirmation of the permitted text, period-label and column-name payload; no
  `010_draw`, raw row/file/path/identifier or automatic local attachment may be
  sent.
- `帮我解释证据` and `帮我起草候选` require their Case/Finding guard and the
  approved exact versioned `020_clean` subset.
- One active Assistance Attempt per Case revision is mutually exclusive with a
  running Analysis Run. Success produces only a Draft; failure/cancellation
  preserves authoritative state and the complete manual path. Settlement alone
  never changes computation, Finding, report, Closure, Case or Run state.

Session creation performs no provider call and requires no model. Closing and
reopening restores product state and history without restoring a Pi SDK
session. Real technical acceptance must use the public macOS Desktop entry and
real filesystem/process evidence; Demo state, fixture replay, mocked
persistence and a running page are insufficient.

## 2. Required Guessing

None. Review 001's three material gaps are closed:

| Review 001 gap | Corrected rule |
|---|---|
| Whether question organization requires an aggregate | It does not; its narrow disclosed payload and no-`010_draw` boundary are explicit. Later evidence/candidate assistance requires the approved aggregate subset. |
| Product Session versus Case revision | One first-slice Session contains one Case; Session identity is stable and Case revision is the sole business revision. |
| Assistance versus Analysis Run | Assistance Attempt has independent identity, eligibility, mutual exclusion, Draft result, failure/cancellation and history rules; it cannot occupy or mutate Analysis Run authority. |

UI Contract v1.1 explicitly carries these corrections, so an implementer does
not have to choose between incompatible older statements.

## 3. External Study Required

None. The supplied package defines product behavior, boundaries and acceptance.
Later source inspection may determine the minimum reuse implementation but may
not fill product gaps from Research Demos.

## 4. Untestable Requirements

None that block the next planning Gate. The package supports clear positive and
negative acceptance for early question assistance, later aggregate-backed
assistance, zero-network refusal, raw-data blocking, execution mutual
exclusion, zero authority mutation, directory completeness, retry identity,
manual completion, close/reopen and Pi-session non-revival.

No test was executed by this Reviewer and this review does not claim that the
current implementation satisfies the new behavior.

## 5. Correctly Deferred

TypeScript/IPC names, serialization, SQLite tables/indexes, directory staging
and cleanup mechanism, migrations, retention/deletion, resource limits,
packaging versions and exact Desktop composition may remain for the structure
decision, OpenSpec and Design.

A second Runtime, persistent Pi-session recovery, registry, fallback, hot
switching and a universal Runtime abstraction remain separate future Changes.

## 6. Required Plan Additions

None that block development readiness. A separately authorized OpenSpec must
translate these rules into traceable Requirements and Acceptance Criteria and
must complete the required structure decision before freezing persistent
Session schemas or filesystem contracts.

## 7. Verdict: PASS

The corrected package distinguishes Product Session, Case revision, Analysis
Run, Assistance Attempt and Pi Runtime Session and closes directory, exposure,
manual-path, history, recovery and real Desktop acceptance behavior without
load-bearing implementation guesses.

This PASS confirms only product-plan development readiness. It does not
authorize OpenSpec, production implementation, dependency installation, schema
creation, real provider calls or real data access.
