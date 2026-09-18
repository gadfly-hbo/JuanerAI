# Xanthil UI Child-Conversation, Adoption and Closure Matrix v1.0

## Document control

| Field | Value |
|---|---|
| Parent | [Xanthil Desktop UI Contract v1.1](./xanthil-desktop-ui-contract-v1.1.md) |
| Status | Corrected formal attachment for fresh development-readiness review |
| Scope | Clickable UI Contract semantics; no production execution authority |

## 1. Child-conversation state table

The clickable first Case uses one professional source Session with one
illustrative Fork and one illustrative Subagent. The same visible rules apply
in quick mode.

| Situation | Fork | Subagent | Source Session and recovery |
|---|---|---|---|
| No Session | Entry is visible but not unlocked | Entry is visible but not unlocked | Clicking either shows `缺少：先创建 Session` and creates nothing |
| Session exists, aggregate snapshot not approved | Visible, locked | Visible, locked | Hint shows `缺少：批准本次聚合数据范围` |
| Approved aggregate exists, no successful source analysis for the current revision | Visible, locked | Visible, locked | Hint shows `缺少：完成一次当前修订的循证分析` |
| Current source revision has approved aggregate scope and one successful analysis | Unlocked | Unlocked | The unlock is scoped to that exact source revision and approved aggregate identity |
| Create child | Freeze source Session ID, source revision ID and approved aggregate subset; open independent history | Freeze the same identities plus bounded task; open independent task history | No raw row, raw file or future aggregate is inherited |
| Attempt to add raw data or another unapproved aggregate | Creation or expansion is blocked; existing child is unchanged | Creation or expansion is blocked; existing child is unchanged | Return action opens the source data Gate. Confirming a changed scope creates a new Draft source revision; it does not mutate the child |
| Child running and source revision changes | Mark child `来源已变化 · 结果不可回流`; settle no result identity in the source | Mark child `来源已变化 · 结果不可回流`; any late success remains child-local and cannot auto-reflow | Child remains readable as history. A new child must be created from the new revision |
| Child has result, not yet reflowed, and source revision changes | Disable reflow and mark result stale | Disable auto/retry reflow and mark result stale | No pending card appears; create a new child from the new revision |
| Pending result exists and source revision changes | Pending card becomes `来源修订已过期`; adoption disabled | Same | Card remains readable; it never migrates to the new revision |
| Task failure or cancellation | No result identity and no pending card | No result identity and no pending card | Source remains usable; retry creates a new child attempt bound to the same current revision |
| Repeated valid reflow | Exactly one pending card | Automatic/retry reflow produces exactly one pending card | Identity is the child result identity; duplicate cards, evidence and report versions are forbidden |

Locked entries remain focusable and clickable so the missing step is visible.
They are never silently disabled.

## 2. Adoption-effect table

Reflow only delivers a sourced pending result. `采纳` is a user decision about
whether that supplemental result enters the current review workspace.

| Case situation | Adoption effect | Authority that cannot be replaced | Required next state/action |
|---|---|---|---|
| Current revision is Draft or Ready | Adoption is unavailable because no reviewable Finding exists | Snapshot, mapping, method and judgment | Complete a successful analysis first |
| Review; Finding not yet accepted | Add the result as supplemental support, refutation, alternative explanation or limitation; refresh the reviewable Finding draft and report draft | Deterministic values, fixed method, judgment rule and source identities | User reviews the changed Finding, then may accept it |
| Review; Finding already accepted; no Decision Closure | Preserve the accepted Finding and its report draft as current; append a new reviewable Finding version plus a new report draft marked `待复核`; disable completion until the user accepts or rejects that supplemental revision | Prior accepted Finding, its acceptance and current report remain append-only | Accepting the new Finding makes its draft current and marks the prior draft superseded; rejecting it marks the new Finding/report draft rejected and leaves the prior accepted Finding/report current |
| Review; child result contradicts deterministic computation | Show it only as a sourced inconsistency/alternative explanation; it cannot overwrite computed values or judgment | Primary/independent result, mismatch rules and accepted evidence | User may request more evidence or decline; no direct completion from the contradictory result |
| Source revision differs from the child's frozen revision | Adoption disabled; card marked stale | All current-revision evidence and state | Create a new child from the current revision |
| Case Completed | Adoption disabled on the Completed revision | Accepted Finding, Decision Closure, final report and Completed state | `基于此案例创建新修订` creates a new Draft; a new child must be run for that revision |

Adoption never changes source data, mapping, approved exposure, calculation,
judgment, Finding acceptance, Decision Closure, Case completion or action
authorization without the explicit follow-up action named above.

## 3. Report and Decision Closure mapping

### 3.1 Report lifecycle

| Trigger | Report state | Case state |
|---|---|---|
| First agreeing successful Run enters Review | Create `draft v1` from the reviewable Finding | Review |
| Finding accepted | Keep the current report `draft`; record which Finding version is accepted | Review |
| Valid child result adopted before Finding acceptance | Refresh the current draft against the changed reviewable Finding | Review |
| Valid child result adopted after Finding acceptance | Keep the accepted Finding's draft current; create the next draft version as `待复核` | Review with new Finding pending review; completion disabled |
| Pending supplemental Finding accepted | Make its draft current and mark the prior current draft superseded | Review |
| Pending supplemental Finding rejected | Mark its draft rejected; keep the prior accepted Finding's draft current and unsuperseded | Review |
| User completes a valid Decision Closure | Promote the current report to `final`; bind the accepted Finding and Closure identities | Completed |
| User reruns a Completed revision | Keep the earlier final report current while the new Run is pending | Completed |
| Rerun succeeds and a new Finding is later accepted and closed | Create a new final report version; preserve the prior final as superseded history | Completed |
| Completed user wants to adopt new child evidence or edit inputs | No mutation of the Completed revision or final report | Create a new Draft revision |

`Final` means the report records the accepted Finding plus a valid Decision
Closure. It does not mean an external Action was executed or an Outcome occurred.

### 3.2 Execution-feedback actions

| Visible action | Exact meaning | Case/report effect | Completion allowed? |
|---|---|---|---|
| `设为优先验证` / `取消优先` | Optionally mark exactly one of at least two valid DecisionCandidates as `优先验证`, or leave all unpreferred; record the reason when one is preferred | Updates the Draft candidate comparison only; report stays draft | No; this action alone is not a Closure |
| `保存候选比较` | Confirm at least two valid candidates after review; each retains evidence basis, risk/refutation, applicability and future validation metric; zero or one may be preferred | Saves a valid candidate-comparison Draft and enables `完成分析案例` when the Finding is accepted; report stays draft | No; close/reopen before completion remains Review |
| `不采纳此候选` | Reject the selected candidate, not the Finding | Candidate remains in history as not selected; report stays draft | No; choose another candidate or explicitly use the insufficient-evidence route |
| `暂缓决策` | Record that no Decision Closure is made now | Preserve Review and the current draft; optional reason/date is history only | No |
| `需要补证` | Create a supplemental-investigation request linked to the limitation or pending question | Preserve Review and draft; show the request in evidence/task context | No |
| `选择：证据不足 / 暂不选择` | Prepare the v1.0 insufficient-evidence Closure choice with a non-empty reason; no candidate may remain preferred | Saves the Closure choice and enables `完成分析案例` when the Finding is accepted; report stays draft | No; close/reopen before completion remains Review |
| `完成分析案例` | Confirm the accepted Finding plus either a valid saved candidate comparison or a valid insufficient-evidence choice | Append the selected Decision Closure and completion record, promote the current report to final, and enter Completed | Yes; this is the only action that completes the Case |

There is no generic `拒绝` action whose target is ambiguous. The UI labels the
object being declined: child result, candidate or Finding draft. Declining a
child result or candidate is not a Decision Closure by itself.

## 4. UI Gate assertions

- Every locked child entry states its missing step.
- Any source-revision change visibly invalidates child reflow/adoption without
  deleting child history.
- Adoption never silently changes accepted evidence, closure or completion.
- Only the two v1.0 Decision Closure routes can complete the Case.
- Saving a candidate comparison or insufficient-evidence choice does not
  complete the Case. Only the separate `完成分析案例` action appends the Closure,
  promotes the current report to final and enters Completed.
- A Completed revision is never rewritten by rerun, child result or edit.
