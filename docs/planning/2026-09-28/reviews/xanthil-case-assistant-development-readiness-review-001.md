# Xanthil Case Assistant Development-Readiness Review 001

## Review control

- Date: 2026-09-28
- Candidate: initial draft of `xanthil-case-assistant-product-plan-v1.0.md` plus its incremental and clickable UI Contracts
- Reviewer: fresh read-only support Agent, implementation-worker perspective
- Inputs: only the formal product package and the JuanerAI authority/baseline files enumerated in the review brief
- Verdict: `NEEDS_CLARIFICATION`
- Historical rule: this result is retained after correction and is not converted to PASS

## 1. What I Would Build

The reviewer understood the intended core as an independent Quick Case Assistant bound to a Professional Case. After the user confirms source revision, model, data, read-only tools and budget, a bounded multi-turn Agent reads approved business views, asks questions and produces a structured draft. Only an Application command triggered by the user may append a Decision Record, Expected Outcome and report version. Stop, failure, rejection and stale source produce no formal write; Continue creates a new Attempt. Product history persists while Case records remain authoritative. Fork and Subagent remain Preview.

## 2. Required Guessing

### R1 — Professional baseline conflict

The draft renamed the three existing one-shot actions and changed the six-stage labels while claiming the stages were unchanged. The accepted baseline actually names `帮我整理问题`, `帮我解释证据` and `帮我起草候选`, with stages 5 `Report` and 6 `Execution feedback`. Engineering would have to guess whether this was an error or an unprovided approved revision.

### R2 — Admission, adoption and later revision were not closed

The draft did not define exact eligible Case states, how a Completed Case and final report behave after adoption, whether multiple Sessions create independent decisions or revisions, how a confirmed decision is changed, or how unconfirmed edits exit. The Expected Outcome also omitted the planned future result source required by Blueprint v2.0 §6.2.

### R3 — Task authorization did not close historical-context exposure

The draft authorized categories while omitting exact treatment of later user free text, the precise `020_clean` subset, old-revision conversation/tool content and out-of-scope report history. “Continue reuses history” conflicted with the prohibition on reading an unauthorized revision.

### R4 — Waiting-user budget behavior was missing

The draft did not say whether waiting consumes the time cap, whether Stop remains available, or how waiting ends after exit/restart.

### R5 — Clickable attachment did not cover key promises

The initial prototype did not provide real field editing/cancel/validation, the three decision branches, rejection confirmation, a user-operated wait/answer step, stale-diff/rebind behavior, missing Provider/budget states, adoption failure, or correct multi-Attempt history. Several required Decision/Outcome fields were not visible.

### R6 — First-slice acceptance evidence was not bound

The package asserted that the first Change was complete but did not cite its archived engineering/product acceptance records. The implementer should not have to infer product acceptance from a commit alone.

## 3. External Study Required

No external product or repository study was needed. The missing accepted-first-slice record and any authority for a professional-baseline change had to be supplied inside the formal package.

## 4. Untestable Requirements

Before correction, no unique expected behavior existed for eligible Case states, adoption/revision/report effects, new text and old-revision history exposure, or waiting-user budget semantics. UI Gate B/D/E and part of C could not be executed from the supplied attachment.

## 5. Correctly Deferred

Private TypeScript names, storage schemas and indexes, Pi Adapter organization and SDK migration, non-semantic streaming/performance parameters, concrete limits after the product semantics are closed, and offline fixture/evidence mechanics could remain engineering decisions.

## 6. Required Plan Additions

1. Align the six stages and three one-shot actions with the accepted baseline.
2. Add an admission/adoption/revision matrix, planned result source and unconfirmed-edit behavior.
3. Define free-text, exact subset, history and revision-rebind authorization.
4. Define waiting-user timing, Stop, exit and restart semantics.
5. Make the clickable UI exercise editing, all three choices, missing authorization, stale recovery, adoption failure and Attempt history.
6. Bind the applicable first-slice engineering and Product Acceptance records.

## 7. Verdict

`NEEDS_CLARIFICATION`

The core goal and safety direction were clear, but the package still required load-bearing guesses and a fresh Reviewer after material correction.
