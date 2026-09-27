# Xanthil UI Reference Adoption Map v1.0

## Document control

| Field | Value |
|---|---|
| Purpose | Freeze how the accepted PX-2026-004 and PX-2026-006 UI product mode is reused by the first JuanerAI vertical slice |
| Status | Controller draft based on explicit user correction; input to the fresh development-readiness review |
| Source repository | `/Users/huangbo/Dev/Projects/research` |
| Source repository HEAD at study time | `4fcf0fed9ac8be73203d937d91bd2f9e33381711` |
| Source condition | The research worktree contained unrelated user changes. No research file was modified. The hashes below freeze the exact bytes studied. |
| Product boundary | UI and interaction reference only; Demo code and Demo PASS are not production implementation or production acceptance |
| Self-contained visual input | [Accepted UI Reference Plates v1.0](./attachments/xanthil-ui-reference/README.md) |
| Binding state input | [Child-Conversation, Adoption and Closure Matrix v1.0](./xanthil-ui-state-and-closure-matrix-v1.0.md) |

## 1. Source ledger

The Controller read the formal product discussion, frozen Demo Brief, handoff,
UI mappings, state checklists, README, HTML, CSS, JavaScript, synthetic data and
representative accepted screenshots for both Demos.

The representative screenshots required for independent review and UI building
are copied into the formal attachment above. A builder does not need research
repository access to recover the accepted product hierarchy.

| Source | Role | SHA-256 |
|---|---|---|
| `explorations/PX-2026-004-xanthil-uidemo/PRODUCT_BRIEF.md` | Accepted professional-mode product intent and decision history | `5459ac377bdbea7ba0d009903bd06f018940b08ea34449bd617e92b74d80928a` |
| `explorations/PX-2026-004-xanthil-uidemo/DEMO_BRIEF.md` | Frozen professional-mode flows, states and acceptance | `f3c2664d7725279f1fc05b0512c801f3a687dca6169b5b25c1b839333a0568db` |
| `explorations/PX-2026-004-xanthil-uidemo/demo/CODEX_UI_MAPPING.md` | Workbench, navigation, Inspector and accessibility mapping | `20f57a17232e65f77955c15df32f4dacf14a6d70f3c1c277445b83c361a3899e` |
| `explorations/PX-2026-004-xanthil-uidemo/demo/PI_XANTHIL_MAPPING.md` | Business capability to professional-mode UI mapping | `20438336efa625e0d295c920f8f87157f397cca26d3d6ccdcf4f7cb298a587dd` |
| `explorations/PX-2026-004-xanthil-uidemo/demo/index.html` | Accepted professional-mode screen composition | `efa572d52458009ccce0573593c05c41213febc837fb3266e105039265e0c990` |
| `explorations/PX-2026-004-xanthil-uidemo/demo/app.js` | Accepted simulated interaction and fail-closed behavior | `90ab6e4b24899a753fabb47ca60659534393d0534daafcd3261e29895b1e754d` |
| `explorations/PX-2026-006-xanthil-dual-mode/PRODUCT_BRIEF.md` | Accepted dual-mode, Session and capability decisions | `d152f1ca17fab7f8e0f6458b679b65cdb9ded55fb061362d4c569cf056d51464` |
| `explorations/PX-2026-006-xanthil-dual-mode/DEMO_BRIEF.md` | Frozen quick-mode and Fork/Subagent flows | `f6c4c2f0c931648eeecae70a9b10e8b188178b8659fc19788d6124fe9a27a571` |
| `explorations/PX-2026-006-xanthil-dual-mode/HANDOFF.md` | Correct authority split between PX-004 and PX-006 | `43d6b0a1b31ac33f1408482e508e8f4f5acf4505d432ce932e6c9283a88e5fa5` |
| `explorations/PX-2026-006-xanthil-dual-mode/demo/UI_MAPPING.md` | Exact quick-mode UI and state mapping | `903702949299ad07c7b207d25a6a36fb9112002a8136178537d0651bb6270735` |
| `explorations/PX-2026-006-xanthil-dual-mode/demo/index.html` | Accepted dual-mode shell and capability locations | `2a4f823aa7a5365472861b5735e47b57f7d32a5a584ed85aa7b780c9cf175053` |
| `explorations/PX-2026-006-xanthil-dual-mode/demo/app.js` | Accepted Session, child-conversation, reflow and report semantics | `446bbac17ca195bbd4c9fca5c95d3982b3e21a48bd6e9ed08cfe808584fc2fa9` |

## 2. Authority split

1. PX-2026-004 is the authority for the complete professional-mode experience:
   the six-stage workbench, data Gate, evidence-based analysis, report and
   execution feedback.
2. PX-2026-006 is the authority for quick mode, the global quick/pro switch,
   fixed-type Sessions, independent Fork/Subagent conversations, reflow versus
   adoption, background-task visibility and the auxiliary drawer.
3. The professional page inside PX-2026-006 is only a switch-positioning
   placeholder. It never replaces the full PX-2026-004 professional UI.
4. The user-facing term is `循证分析`. Historical `自由分析` labels in PX-004
   mean the same capability and are changed only in the new UI Contract.
5. JuanerAI authority documents and later approved OpenSpec own production
   contracts, Runtime, persistence, security, packaging and acceptance. DOM
   objects, Mock IDs and timers in the Demos are not production contracts.

## 3. Complete product-mode inventory

The user explicitly said that Fork, Subagent and Skill were examples, not an
exhaustive list. The first clickable UI Contract therefore retains the complete
accepted product-mode inventory below.

| Product area | Accepted reference | Clickable UI Contract v1.1 | First production vertical slice |
|---|---|---|---|
| Desktop shell | PX-004 three-pane workbench; PX-006 dual-mode top bar | Directly adopt the top bar, left Project/Session rail, central workspace, right Inspector/drawer and bottom status area | Same shell; real macOS public entry is later technical acceptance |
| Quick / professional modes | PX-006 top switch and fixed Session type | Both modes visible and switchable; no Session upgrade or downgrade | Professional path is the first real end-to-end path; quick mode may remain visibly labeled Preview until separately activated |
| Project and Session tree | PX-004 Project/Session hierarchy; PX-006 per-mode lists and cross-mode search | Directly adopt, including child-conversation nodes and state badges | One Project and one professional Session need real persistence first; no hidden alternate navigation |
| Professional workflow | PX-004 complete six stages | Directly adopt; change only the business case and rename `自由分析` to `循证分析` | Active first slice: new analysis, data preparation, local processing, Gate, evidence-based analysis, report, execution feedback |
| Quick-mode conversation | PX-006 message thread and Composer without fixed stages | Directly adopt as a switchable simulated product surface | Retained in the UI; real execution is later unless separately authorized |
| Local file and data boundary | Both Demos; PX-006 `010_draw` / `020_clean` / `060_reports` drawer | Directly adopt the visible local/raw, approved aggregate and report boundaries; adapt labels to the first-slice snapshot/Case language where necessary | Real import, immutable snapshot and approved model-exposure behavior are active; the Demo directory names are not automatically production schemas |
| Local processing and aggregate Gate | PX-004 stages 2-3; PX-006 inline run and approval cards | Directly adopt the visible run, approval, blocked and recovery interaction | Real local computation and independent recomputation are active after later OpenSpec/TDD |
| Hypothesis, evidence and refutation | PX-004 hypothesis cards and Inspector | Directly adopt; simplify to the first-slice H1 plus one bounded alternative/limitation | Active and real; no unsupported conclusion may appear |
| Fork | PX-006 independent Fork conversation | Keep visible and clickable in the simulated UI Contract, including inherited-scope display, return path, manual reflow and a unique pending-result card | Visible as Preview in the initial real slice unless a later approved Change activates it; never fake real execution |
| Subagent | PX-006 independent task conversation | Keep visible and clickable in the simulated UI Contract, including running/success/failure/cancel, automatic reflow, retry only after reflow failure and no false result identity | Visible as Preview in the initial real slice unless a later approved Change activates it |
| Reflow and adoption | PX-006 | Directly adopt: reflow delivers a sourced pending result; adoption is a separate user decision that alone can affect evidence/report versions | Contract retained for later activation; no automatic evidence or report mutation |
| Skill | PX-004 Inspector/composer and PX-006 explicit picker | Keep the Composer entry, selected name/version/scope and picker. Use one first-slice built-in analysis skill plus a clearly unavailable example | The built-in first-slice method may be presented as a product capability; a general Skill runtime/marketplace is deferred |
| Prompt | PX-004 Inspector/composer and PX-006 explicit picker | Keep the Composer entry, selected name/version and disclosure that it affects assistance, not deterministic method or judgment | General prompt management is deferred; optional assistance follows the model-exposure contract |
| Report | PX-004 report page; PX-006 inline draft/final/version chain | Keep report, evidence back-links, print/export, draft/final and superseded-version presentation | Real Case export is active; production authority for report lifecycle follows the first-slice Case contract |
| Execution feedback | PX-004 stage 6 | Keep the stage and visible decisions: accept, reject, defer, request more evidence and return to analysis | No automated action or Outcome claim; the first slice records a Decision Closure only |
| Inspector / auxiliary drawer | PX-004 context/evidence/tasks/Skill-Prompt tabs; PX-006 directories/subset/provenance/reports | Directly adopt both contextual views as one right-side surface whose content follows the selected mode and conversation | Real provenance and technical details are active; advanced child-task panels can remain Preview |
| Global search / command access | PX-004 command palette; PX-006 cross-mode Session search | Directly adopt searchable Sessions and keyboard entry; Demo-only failure shortcuts stay out of normal product UI | Search can initially cover current local Cases; no Demo guide commands in production |
| Recent and background runs | PX-004 recent-run list; PX-006 background pill and return entry | Directly adopt running/succeeded/failed/cancelled states and return-to-task behavior | One active Run per revision; later concurrency does not need to be invented now |
| Failure closure and recovery | Both Demos | Preserve visible blocked, insufficient, falsified, failed, cancelled, stale and superseded states; use the v1.0 failure matrix for the first case | Active and real for the first slice; no false artifact, evidence or completion state |
| Accessibility and viewports | Both Demo acceptance suites | Preserve keyboard access, visible focus, modal focus containment/restoration, ARIA semantics, 1440x900 and 1366x768 behavior | Must be re-proven in the production stack; Demo PASS is not transferable |
| macOS / Windows visual context | PX-004 window-context switch; PX-006 desktop shell | The clickable Contract may demonstrate both window contexts, clearly simulated | First production acceptance remains macOS; Windows is visible product direction, not falsely claimed support |

## 4. First-slice case adaptation

The accepted interface is reused; only the case payload is reduced.

- Replace the broad retail narrative with one membership-repurchase Decision
  Case using one `members.csv`, one `orders.csv`, fixed `CNY` and
  `Asia/Shanghai`.
- Keep the professional six-stage structure. Do not replace it with a new
  wizard, dashboard or unrelated navigation model.
- Use one fixed primary hypothesis, one supporting comparison, one bounded
  alternative explanation or limitation, and only the evidence necessary to
  demonstrate support/refutation and closure.
- Keep one illustrative Fork and one illustrative Subagent in the clickable
  simulation so the accepted product mode can be evaluated. Their labels must
  say `模拟` or `Preview`; they do not imply first-slice production activation.
- Keep Skill and Prompt as explicit Composer capabilities. The first slice may
  provide one bundled selection and show other choices as unavailable rather
  than inventing a general management platform.
- Keep report, evidence links, version status and execution-feedback/closure
  presentation, while omitting automated action and Outcome claims.

## 5. Do not carry over

- Demo-only guide controls, failure toggles, macOS/Windows fake chrome controls
  and fixed timers as normal product controls.
- Demo HTML/CSS/JavaScript as production code or its in-memory objects as
  persistent schemas.
- Fixed synthetic results as technical acceptance evidence.
- Claims that Demo PASS proves filesystem integrity, Runtime behavior,
  persistence, concurrency, security, packaging or real model quality.
- The PX-006 professional placeholder as a substitute for PX-004.
- Any old D0.5/D1-A, Model Pack sequence or withdrawn Change authorization.

## 6. Gate effect

This map corrects the earlier v1.0 planning input that excluded quick/pro mode,
Fork and Subagent from the UI Contract. Review 002 remains historical evidence
for that earlier package and cannot authorize continued UI work.

The new clickable UI Contract may be revised only after a fresh independent
development-readiness review returns `PASS` for the v1.0 base documents plus
the v1.1 amendments and this attachment. A PASS authorizes only the clickable,
explicitly simulated UI Contract and user UI Gate.
