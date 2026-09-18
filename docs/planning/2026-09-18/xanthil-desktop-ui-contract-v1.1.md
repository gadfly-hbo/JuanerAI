# Xanthil Desktop UI Contract v1.1 Amendment

## Document control

| Field | Value |
|---|---|
| Base | [Xanthil Desktop UI Contract v1.0](./xanthil-desktop-ui-contract-v1.0.md) |
| Parent plan | [JuanerAI Product Development Blueprint v1.1](./juanerai-product-development-blueprint-v1.1.md) |
| Version | `1.1` |
| Status | Fresh Review 005 `PASS`; clickable simulated UI accepted by the user at the UI Gate on 2026-09-18 |
| Binding UI reference | [Xanthil UI Reference Adoption Map v1.0](./xanthil-ui-reference-adoption-map-v1.0.md) |
| Binding state attachment | [Child-Conversation, Adoption and Closure Matrix v1.0](./xanthil-ui-state-and-closure-matrix-v1.0.md) |
| Self-contained visual reference | [Accepted UI Reference Plates v1.0](./attachments/xanthil-ui-reference/README.md) |
| Session/Runtime boundary | [Xanthil Desktop Session and Runtime Boundary v1.0](./xanthil-desktop-session-runtime-boundary-v1.0.md) |
| First real path | Professional-mode membership-repurchase Decision Case |

This amendment is read with UI Contract v1.0. It replaces v1.0 sections 5,
10, 11, 12 and 13 where they conflict with this text. The detailed user,
import, method, model-exposure, Case/Run, integrity and failure-recovery rules in
v1.0 remain binding.

## 1. Accepted product shell

The clickable UI Contract must start from the accepted Xanthil UI mode, not a
new visual or navigation invention.

Persistent frame:

- top bar: Xanthil identity, quick/professional switch, Project context,
  background-run return entry, global search and right-drawer control;
- left rail: current-mode Sessions, nested Fork/Subagent conversations, recent
  or background Runs, status badges and the new-Session action;
- main workspace: the complete professional workbench or quick conversation,
  depending on the selected mode;
- right surface: context, evidence, child tasks, Skill/Prompt, data scope,
  provenance and report versions as appropriate to the current mode;
- bottom status: local/offline state, selected mode, model-visible boundary,
  active Run and last stable state.

The visual direction follows the accepted Demo: calm desktop workbench, light
layered surfaces, compact business density, thin boundaries, small status chips
and a single Xanthil accent. The prototype may improve wording, spacing and
accessibility, but it may not replace the accepted product mode with a generic
dashboard, marketing site or custom wizard.

## 2. Mode and Session contract

- Both `快速模式` and `专业模式` are visible in the clickable UI Contract.
- First entry defaults to quick mode; the prototype may remember the last mode
  only as an explicitly simulated behavior.
- A Session is created in the currently selected mode and its type is fixed.
- Switching mode changes the work area and visible Session list; it does not
  convert, upgrade or downgrade an existing Session.
- Global search may find both types and shows a mode badge.
- Switching mode does not cancel a running task; the other mode shows a visible
  background-status pill with a return action.
- For the first product UI Gate, the professional example is the authoritative
  complete flow. Quick mode demonstrates the accepted shell and capability
  placement with simulated interactions.

## 3. Professional mode: first-slice active path

Professional mode uses the full PX-2026-004 six-stage workbench. The
PX-2026-006 professional placeholder is forbidden as a substitute.

| Stage | First-slice presentation | Binding v1.0 rules retained |
|---|---|---|
| 1. New analysis | Name the analysis Case and state the repurchase question in business language | No provider/Runtime/JSON/code requirement; manual path always available |
| 2. Data preparation | Select `members.csv` and `orders.csv`, review quality, map business fields, confirm authority, periods, CNY and Asia/Shanghai | Full import taxonomy, exact-string rules, issue handling and immutable snapshot rules |
| 3. Local processing | Show extract/validate/aggregate steps, output summary and an explicit aggregate/model-exposure Gate | Primary and independent method agreement, cancellation, deadline, mismatch and zero false artifacts |
| 4. Evidence-based analysis | Show H1, support, refutation/alternative explanation, limitation, bounded judgment and optional assisted explanation | Fixed first-slice method and judgment rules; model output cannot decide the method or judgment |
| 5. Report | Show the reviewable Finding, evidence links, limitations, candidate comparison or insufficient-evidence closure, export and history | Finding acceptance remains separate from Decision Closure; draft/final/superseded triggers follow the binding state matrix; export preserves provenance |
| 6. Execution feedback | Prepare a valid candidate comparison or insufficient-evidence choice, with decline/defer/request-more-evidence remaining non-closing actions; then use a separate `完成分析案例` action | Only the separate completion action appends one of the two valid Decision Closures and enters Completed; no external Action or Outcome claim |

User-facing `自由分析` is replaced everywhere by `循证分析`.

## 4. Quick mode and Composer capabilities

Quick mode keeps the PX-2026-006 conversation-first composition and has no
professional six-stage bar. The Composer capability row contains:

- Skill;
- Prompt;
- Fork;
- Subagent;
- Generate report.

The clickable UI Contract must let the user inspect and exercise these as
clearly labeled simulated interactions. Production activation status is shown
per capability; a non-activated capability is `Preview`, not silently disabled
or presented as working.

### 4.1 Skill

- Open an explicit picker with name, version and applicable scope.
- Provide one first-slice bundled membership-analysis selection and at least one
  visibly unavailable example to prove the state treatment.
- Selecting a Skill never authorizes model exposure, changes the deterministic
  method, or claims a general Skill runtime/marketplace exists.

### 4.2 Prompt

- Open an explicit picker with name, version and purpose.
- Explain that Prompt affects optional assistance wording, not source data,
  computed values, judgment, acceptance or closure.
- Every assisted call still uses the v1.0 exact-payload disclosure and manual
  fallback.

### 4.3 Fork

- Entry is visible near the Composer and states its exact unlock requirements:
  Session exists, the current revision's aggregate scope is approved, and one
  successful source analysis exists for that revision.
- A Fork opens an independent child conversation with its own title, history,
  source Session, inherited approved-data subset and return path.
- Raw rows/files are never inherited. An attempted scope expansion is blocked
  and points back to an explicit source-Session confirmation.
- A result remains in the Fork until the user chooses `回流到来源对话`.
- Reflow creates exactly one sourced pending-result card. Repeating reflow does
  not duplicate a card, evidence identity or report version.
- Source-revision change, scope expansion, stale-result and recovery behavior
  follow the binding state matrix; an old child is preserved as read-only
  history and never migrates to the new revision.

### 4.4 Subagent

- Entry is visible near the Composer and uses the same exact revision-scoped
  unlock requirements as Fork.
- A Subagent opens an independent task conversation with source, bounded task,
  inherited approved-data subset, running status and return path.
- Success automatically reflows exactly one pending result. After success the
  child shows `已回流`, not a redundant manual button.
- A reflow failure/timeout retains the result in the child, shows no false
  result in the source and exposes an idempotent `重试回流`.
- A task failure or cancellation creates no result identity or pending-result
  card and leaves the source Session usable.
- Source-revision change, scope expansion, stale-result and retry behavior
  follow the binding state matrix.

### 4.5 Reflow is not adoption

Every pending result displays source type/ID, source revision, reflow method and
actions to view, adopt or decline. Reflow alone never changes accepted evidence,
judgment or report. Adoption effects, prohibited authority changes, stale and
Completed behavior, required Finding review and report-version consequences are
fully defined in the binding state matrix.

## 5. Right-side surface

The right side is not optional source material to be redesigned away. It
combines the accepted Inspector and auxiliary-drawer purposes:

- current Project/Session/conversation context;
- data and model-visible boundary;
- hypothesis and evidence details;
- child-task status;
- selected Skill and Prompt;
- source snapshot/aggregate/report provenance;
- report versions and superseded state;
- optional technical identities and logs.

The main path must remain understandable when the drawer is closed. Opening it
must never be required merely to discover a blocking error or the next recovery
action.

## 6. Case simplification rule

The first UI uses the v1.0 membership-repurchase Case and exact data/method
boundary. It simplifies only the narrative density:

- one primary H1;
- one supporting comparison;
- one alternative explanation or limitation;
- one illustrative Fork result and one illustrative Subagent result in the
  simulated UI;
- one bundled Skill and Prompt;
- one report and one Decision Closure.

It must not remove the dual-mode shell, capability row, child conversations,
Inspector/drawer, report/history or execution-feedback stage to achieve this
simplification.

The builder uses the self-contained accepted UI reference plates to verify
direct reuse. The plate README identifies the required hierarchy and permitted
case, wording, accessibility and Demo-tooling adaptations; no research-repo
lookup is required.

## 7. Simulation and activation labels

Every clickable-only state displays `合成数据 / UI Contract / 模拟执行` at the
window level and on any generated result. Capability status is explicit:

- `首纵切真实路径` for behavior intended to become the first integrated path;
- `Preview · 模拟` for quick-mode, Fork/Subagent or general capability behavior
  whose production activation is deferred;
- `不可用` plus a reason for unsupported capability or scope.

No timer, fixture, copied Demo result or in-memory object may be presented as
real computation, persistence, recovery, Runtime execution or provider use.

## 8. Required UI Gate scenarios

The v1.0 five scenarios remain, with these additions and corrections:

1. In professional mode, a non-technical user completes the full six-stage
   synthetic Case, including data Gate, evidence review, report, Decision
   Closure, close/reopen presentation and export discovery.
2. The user switches to quick mode and back without converting or losing the
   professional Session; global search distinguishes both mode types.
3. The user can locate Skill, Prompt, Fork, Subagent and report without verbal
   Controller guidance and can explain which are first-slice versus Preview.
4. The user opens one independent Fork and one independent Subagent
   conversation, returns to the source, observes manual versus automatic
   reflow, and verifies that reflow alone does not alter evidence/report.
5. The user observes Subagent failure/cancel, reflow failure/retry and repeated
   Fork reflow with no false or duplicate result.
6. The user can identify raw-local, approved aggregate/model-visible and report
   boundaries in both modes.
7. At 1440x900 and 1366x768, keyboard operation covers the primary professional
   path, mode switch, search, drawer and capability dialogs with visible focus,
   contained modal focus and correct restoration.
8. The built screen can be compared against every accepted UI reference plate;
   the required hierarchy and capability locations remain recognizable, and
   every deviation is one of the explicitly permitted adaptations.

PASS requires all v1.0 business/recovery scenarios and all eight corrected
product-mode scenarios. The user's visual and interaction judgment remains the
actual UI Gate.

## 9. Non-goals and stop line

Still outside this clickable step:

- production code, OpenSpec, dependencies, provider calls, real data, real
  Fork/Subagent/Skill/Prompt execution, persistent schemas, packaging or release;
- Model Pack activation, Semantica, Ontology Hub, Workspace, enterprise
  governance, automated Action or Outcome claims;
- treating the accepted Demo code as production code.

Unlike v1.0, quick/pro mode, Fork, Subagent, Skill and Prompt are not UI
non-goals. They are required visible parts of the clickable product contract,
with production activation controlled separately.

## 10. Next Gate

Review 002 is superseded for execution purposes because it reviewed the now
incorrect assumption that the Demo repository and excluded modules were not
binding UI input. Review 003 returned `NEEDS_CLARIFICATION`; its four gaps are
now addressed by the binding state matrix and self-contained visual plates.
Review 004 caught a remaining direct-completion mismatch; the matrix now
restores v1.0's separate `完成分析案例` action and freezes the corrected
supplemental-report rules. Fresh Review 005 returned `PASS`. The user accepted
the directly reused PX-2026-004/006 clickable UI on 2026-09-18. This UI Gate
acceptance freezes the product-mode reference for the next planning step; it
does not certify real Session persistence, filesystem creation, Runtime
execution, provider calls, or any other simulated behavior, and it does not
itself authorize OpenSpec or production development.

For production planning, the Session/Runtime attachment clarifies rather than
removes UI Contract v1.0's three assisted actions: `帮我整理问题` may call the LLM
before aggregate creation using only its disclosed text/label/column-name
payload and never `010_draw`; evidence explanation and candidate drafting
require the approved exact `020_clean` subset. Each call is an Assistance
Attempt separate from the Analysis Run and Case state machine.
