# FAIL — candidate-007

The corrected shell and principal layouts follow the approved visual standard. **Four material defects remain.** The historical overall PASS is not reused.

## Material findings

### 1. Previous Case remains actionable after “New professional session”

**Requirement:** AC-01, UI-01/17: displayed records and actions must belong to the selected Case.

**Evidence:** [newSession](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/apps/desktop/renderer.tsx:201) clears `projection` but retains `formal`; the associated effect returns without clearing it when no Session exists. Independent rendering confirmed that this state displays the previous Case’s formal record and an enabled revision button.

**Impact:** Open an adopted Case, select “新建专业会话”, then stage 6: the empty workspace can create a revision draft for the previous Case.

**Recheck:** Clear or identity-check retained formal state. Exercise new Session, switching Cases, delayed reads, and legitimate return to the original Case.

### 2. Failed reply persistence disables the waiting deadline

**Requirement:** AC-06 and Product Plan §6.2: failures must terminate safely; waiting deadlines must remain effective.

**Evidence:** [send](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/packages/application/case-assistant.ts:219) sets `busy`, clears the timer, then appends the user event without recovery around that append. An independent Application probe injected `SQLITE_BUSY` for the reply: the Attempt remained `Waiting` after its deadline, and retry returned `FORBIDDEN`.

**Impact:** A recoverable storage failure leaves the conversation stuck until explicit Stop or application closure. No formal write occurred in the probe.

**Recheck:** Inject failure while saving a subsequent reply using real SQLite; verify terminal/recoverable state, deadline enforcement, preserved history, zero unintended calls/writes, and explicit continuation.

### 3. Professional report previews replace the approved readable report with serialization

**Requirement:** AC-12/13, UI-16/17, and the [approved report interaction](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/docs/planning/2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/app.js:558), which presents labeled business fields for current and historical reports.

**Evidence:** The actual [packaged report screenshot](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/evidence/ui-fidelity-native-green-001-gui/report-selection-1440x900.png) shows Markdown followed by serialized IDs and record fields. [Professional rendering](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/apps/desktop/renderer.tsx:550) displays this directly; [export generation](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/adapters/storage-local/case-assistant.ts:284) produces the same serialization inside HTML `<pre>`.

**Impact:** The Professional report/history path does not provide the approved business-readable presentation. Quick mode’s structured report dialog does not repair that path.

**Recheck:** Present complete labeled decision/outcome fields for current and superseded reports, retain provenance and historical bytes, and inspect preview/export at both viewport sizes.

### 4. Adopted drafts still state that no report version exists

**Requirement:** UI-14/16 and AC-12: adoption success and report creation must be unambiguous.

**Evidence:** The [draft footer](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-007/source/apps/desktop/case-assistant-workspace.tsx:112) unconditionally says “未生成报告版本；采纳后才追加正式对象”. Independent rendering using retained adopted data confirmed this appears alongside “已采纳” and an existing formal report.

**Impact:** Successful adoption presents contradictory business state.

**Recheck:** Verify pending, adopted, rejected, cancelled revision, and reopened states show accurate report status without changing stored history.

These include retained Change002 defects; their presence before this correction does not exclude them from the complete-candidate review.

## Evidence and positive results

- Inspected all four originals before author explanations/tests, then packaged Quick, Professional entry/adopted, draft, authorization, Stop, report, and reachability images.
- Shared header, centered modes, vertical six stages, actual-data cards, Assistant entry, colors, proportions, and primary actions conform in the inspected views.
- At 1280×720, lower draft fields and revision controls are scroll-accessible; no material clipping was established.
- Independently ran **4 Core/IPC tests: PASS**, plus in-memory authorization, budget, forbidden-tool, revision-change, multi-turn, and delayed-Stop checks.
- Verified raw canonical totals: **2172 PASS, 0 FAIL, 1 real-gate SKIP, 15 groups**; installation evidence records **3 native + 1 LaunchServices PASS**.
- Reviewed causal UI RED, GREEN, and test changes. The U2 locator correction retains its Running/same-Run assertions. No retirement or assertion weakening was found in the correction delta.

## Identity and limitations

Verified **665 source files, 10,821 indexed evidence files, 15-path delta, 49 production bindings, 6 packaged emitted assets, and 144 dependency manifests**.

- Manifest: **220704 bytes**, SHA-256 `05923500dda4743cb32169a998f7e2197bfc75b9ad8fe84fc1cfa24a59e716e3`
- Package: **010 / internal006**
- DMG: **231671978 bytes**, SHA-256 `e3adc1d2b6134e39a2756456a4e314ea3d4dc1590b4994ccebb7ff241bceb058`

No files were changed, and no host app, provider, credential, dependency, or Git operation was performed. Native results were inspected rather than rerun. Historical Pi evidence supports only unchanged layers. Current model/effort requires Controller rollout attestation; **read-only/never** was enforced.

**Advisory:** None beyond the material findings. No additional host execution is needed to establish this FAIL. Repairs require a new fixed candidate and the affected rechecks above. This review grants no Product Acceptance.