# Development supplement — author verification

## Scope and current result

Base `6126112aa6ae167145b9ee38c84f6a648458e0e5`, tree
`1df703c3dc96cb79396e447df6016d008297aa45`. Worker implements DEV-01–07's
engineering package; native-002 evidence is closed and the final candidate is
prepared for independent Validator review. No independent verdict,
engineering/product acceptance, archive or Git-delivery claim is made.

Source/code decisions are in [design.md](design.md), approved acceptance in
[Controller intake](intake.md), practical commands in
[DEVELOPMENT.md](../../../../tools/desktop/DEVELOPMENT.md).

Evidence root R is `/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-development-mode`,
owned by Mac mini. Worker evidence is `R/engineering`; Controller evidence remains
Controller-owned. Actual loaded model/effort: `gpt-6-astra` / `high`, confirmed by
`R/controller/worker-actual-context.json`. Sandbox remains workspace-write, approval
never. No model/provider/dependency installation, Git mutation or subagent used.

## DEV mapping

| Acceptance | Code/tests | Evidence / current limit |
|---|---|---|
| DEV-01 | Main/development.ts; Vite Main/Preload hooks; development-start; Renderer retained root; development-build.test; native/lifecycle runners | red-start-001 → green-start-001; forge-build-001 actual merged watcher RED → forge-build-002 GREEN. lifecycle-001 host PASS; native-001 HMR UI reset; native-002 corrected three-surface HMR/restart/reopen PASS |
| DEV-02 | Main native selection; development.ts; compiled development Keychain helper; development-main.test; development-mode.test | red-isolation-001, red-development-credentials-001; main-boundary-002; credentials-boundary-001; regression-002. native-002 actual synthetic protected Project chooser/hash PASS; no user-project lookup |
| DEV-03 | exact compiled endpoint/packaged denial/current-frame checks; Vite HTTP/WS/file boundary; production CSP unchanged | security-001/server-diagnostic-001/002 retained; server-002 real HTTP GREEN; red-anchor-001 → regression-002; main-boundary-002; package-002. Controller package-native-001 PASS on its fixed package |
| DEV-04 | scripts/test-daily; retained artifact tests; exact tuple tests | red-test-entry-001, red-default-test-001; daily-001 fixture failures → daily-002 688/688; regression-001 tuple failures → tuples-001 and regression-002; validation-runner-001 15/15 |
| DEV-05 | sole policy adopted v0.8 section before legacy Host Loop, testing policy, deployment profiles | documentation-only alignment; no fabricated RED; earlier DMG011 unchanged |
| DEV-06 | development-native.mjs real UI/Main/SQLite/DuckDB/Python + synthetic chooser; package-smoke; lifecycle | Controller native-001 real business succeeded but HMR UI reset; native-002 three HMR surfaces, real business/export/reopen and protected Project PASS; lifecycle/package host PASS retained |
| DEV-07 | launch guide, this record, HANDOFF_BACK, fixed manifest | freeze-004 complete source/intake/build/runtime/evidence supplied for independent review; independent verdict/Git authority stay Controller/user responsibilities |

`regression-002` runs `node tools/desktop/test-daily.mjs --all`, which runs the
canonical `tools/harness/validation/run --portable` with its existing version,
offline gate and phase checks, then deterministic component/server/build additions.
Result: **2191 tests, 2190 pass, 1 existing real-model skip, 0 fail**; typecheck PASS.
`validation-runner-001`: 15/15. `credentials-boundary-001`: 1/1; compiled helper
contains development service and no production service, rejects namespace input
before any Keychain operation. No real Provider was invoked.

## Retained package/native acceptance surfaces

Historical requirement wording is not rewritten. DEV intake explicitly permits
changing prospective engineering launch/test mechanics. These surfaces remain:

| Item | Retained command / current evidence surface |
|---|---|
| AC-XDESK-012-01 | pinned dependency/lock/engine checks in canonical portable + TEST-XCLI-021; lock unchanged |
| AC-XDESK-012-02 | exact historical configuration tuples plus exact authorized development tuple; omission/reorder/extra dependency negatives retained |
| AC-XDESK-012-03 | `desktop:package` unchanged; current explicit `development-package.mjs` produces one engineering app in R, verifies descriptor/Main/Preload/resources/CSP (`package-002`) |
| AC-XDESK-012-04 | `desktop:test:artifact` retains packaged module, first-Change GUI, Case Assistant native and Provider Settings native files unchanged; development business evidence uses formal Main/native runner; Controller package-native-001 PASS |
| AC-XDESK-012-05 | original manual installed-artifact acceptance remains attached to DMG011. New development evidence does not replace it or claim installation; no release/installation is requested here |
| AC-XDESK-012-06 | canonical portable + current daily additions: regression-final-001, no model gate; four Console suites retained |
| AC-XDESK-012-07 | Personal/macOS development only; stop leaves Projects/evidence intact; no migration/deletion/recovery change |
| AC-XDESK-009-01 | original packaged GUI tests retained; Main boundary test checks settings; package-002 CSP; Controller package-native-001 PASS |
| AC-XDESK-009-02 | packaged navigation/window/permissions/devtools guards unchanged; compiled packaged denial tested; Controller package-native-001 PASS |
| AC-XDESK-009-03 | Preload API unchanged; all original IPC contract assertions retained and GREEN |
| AC-XDESK-009-04 | retained owner/version/command guards plus current-frame URL admission; main-boundary-002 and full contract regression |
| AC-XDESK-009-05 | Application unchanged; all deterministic integration/business negatives retained and GREEN |
| AC-XDESK-009-06 | duplicate command regression retained; no effectful HMR submission; native-001 same-Run/receipts held but UI reset; native-002 pending actual response and active-state check PASS |
| AC-XDESK-LA-004-01 | exact canonical toolchain preflight retained |
| AC-XDESK-LA-004-02 | full historical canonical phase list remains; daily wrapper selects existing portable mode; validation-runner-001 |
| AC-XDESK-LA-004-03 | native output/exit/fail-fast/model-gate removal retained; validation-runner-001 |
| AC-XDESK-LA-004-04 | packaged identity/Main-format test retained explicitly in desktop:test:artifact; new supplement engineering package identity and native smoke separately bound |
| INSTALL-001 | `tools/desktop/internal-install.test.mjs`: bundled real runtime calculation/reopen retained; no v2 runtime layout change here |
| INSTALL-002 | same file: traversal/hash/extra file/escaped-link rejection retained |
| INSTALL-003 | same file and internal-install.e2e: relocatable runtime/Project ownership retained; engineering v1 smoke is not relocatable release evidence |
| INSTALL-004 | `tools/desktop/internal-signature.test.mjs` and internal-install.e2e retained for delivery; this single engineering app strict/deep codesign passed in package-seal-001 |
| PS-06/07 and Case Assistant native acceptance | original Provider Settings/Case Assistant native tests remain in desktop:test:artifact; production namespace/Pi/Application unchanged; isolated dev helper adds no provider execution proof |

Full installed runtime/signature mutation/LaunchServices/manual installation
acceptance is not rerun on old DMG011. This supplement ships no DMG, does not
install an app and does not change the v2 runtime/resource layout. Its one v1
engineering smoke app intentionally omits a production Keychain helper so native
smoke cannot read production keys. It is explicitly not a replacement release
candidate. A future release must run the retained relevant artifact checks.

## Failures, corrections and coverage preservation

- feasibility-001 wrongly used --version with Playwright attachment; feasibility-002
  used a real minimal sandboxed window but still exited before attachment. Controller
  independently ran that source successfully on host. Neither is causal product RED.
- Early RED source checks are wiring assertions only. Actual installed Forge revealed
  the watch:null merge defect in forge-build-001; the post-merge config hook resolves
  it. Native-001 later provided causal HMR UI failure, repaired and verified in native-002.
- server checks reached every positive/negative HTTP assertion, then stalled in
  Vite's dependency crawl/close. Explicit known dependency prebundling with
  noDiscovery/holdUntilCrawlEnd=false produced server-002 clean shutdown.
- Daily failures were exact old script expectations, a /var vs /private/var emitted
  fixture URL mismatch, added presentation-helper import and VM import binding.
  Corrected fixtures still execute real components/Main and preserve assertions.
- `summarizeDesktopWork` moved verbatim to a private module so React Fast Refresh
  sees a stable non-component export. No business semantics changed.
- No test removed, skipped, assertion weakened or negative case deleted. Exact
  scripts/appendix expectations now describe the approved supplement; historical
  tuples remain independently tested. `tools/harness/validation/run` is unchanged.
- package-001 failed API lookup before making any app. Correct installed `api.package`
  built the single app in package-002 from the reused local Electron ZIP. Initial
  strict signature observation failed; existing inside-out ad-hoc sealer, with a
  bounded v1 engineering-smoke option, sealed that same app in package-seal-001.
  Default v2 release sealing remains unchanged. No second app or DMG was built.
- Capture before the final runs retained raw commands/output/exits but did not always
  snapshot every input at execution. Do not treat a later hash as retroactive binding.
  Final regression and subsequent checks have source snapshots/inputs.json. Earlier
  worker tool-call history remains in R/worker-001/stdout.jsonl; failures are retained.

## Native correction and affected checks (successor to freeze-001)

- Controller native-001 is retained causal product RED: one real successful local
  analysis and two reports, same Main/document/receipts, but React returned to empty
  Quick view. Export timed out because the professional UI was lost. The locator
  and professional report assertion were preserved and strengthened.
- Installed plugin runtime queues refresh after module evaluation (16 ms debounce).
  Actual Vite output in native-preflight-001/renderer-transformed.js demonstrates
  entry render precedes component/export registration and refresh scheduling.
  The entry now mounts once; Fast Refresh updates registered families thereafter.
- hmr-entry-red-001 was a harness SyntaxError (transpiler added export {}), not RED.
  Corrected harness hmr-entry-red-002 fails causally with 2 renders versus 1.
  hmr-entry-green-001 passes after the mount guard. Packaged first mount asserted.
- hmr-affected-001: 10 development checks and 2 actual Forge/entry checks PASS;
  5 of 42 contract checks failed because this direct command omitted its required
  B2 evidence environment. Those five failures occurred before their product assertions. Corrected
  command hmr-contract-002 supplies the owned evidence path: all 42 PASS.
  hmr-typecheck-001 PASS. No test assertion removed or weakened.
- native-preflight-001 executes the native runner's actual synthetic protected
  Project setup using the personal Profile/store and reads its SQLite sentinel
  inventory; PASS. It also captures actual Vite transformation order. This is
  preflight, not GUI rejection or state-preservation evidence.
- Native runner now verifies separately frozen source, CSV and Main/Preload before
  host effects and after its build. It captures copied CSV and protected Project
  hashes before Electron launch. Actual output files are read/hashed after their
  creation. No post-hoc hash is used to claim pre-execution binding.
- Native tests add draft preservation, pending actual startAnalysis IPC response
  preservation (30-second maximum response-delivery pacing only), one submitted
  command/Run/receipt, and the active final report/export view. Calculation,
  Application and store remain real. No production timing seam or model call.
- Arbitrary original-project sentinel lookup is replaced with a real synthetic
  protected Project outside the dev root, actual chooser rejection, and full
  before/after file hashes. Existing dev-root/symlink negatives stay intact.
- Policy change is precise relocation of the new fixed-code acceptance section
  before the inactive Host Loop heading, within adopted continuous v0.8. Historical
  Host Loop rules are unchanged. Documentation changes have no fabricated RED.

## Native-002 closure and package provenance

Worker read command/stdout/stderr/exit, source-readback.json, frozen execution input
manifest, native runtime, state snapshots, IPC refusal, database records and actual
files. Exit 0; all current execution input hashes initially matched freeze-002.
Only documentation changes follow that native run. Final freeze binds the original
native manifest and the documentation delta rather than relabeling old evidence.

- Draft HMR: unsaved business background, professional mode, selected synthetic
  project/Session and stage 1 form values/disabled flags all equal before/after.
- In-flight HMR: startAnalysis command 5178825b-5ab5-424b-ad3d-6ab95798ee3f reached
  the real formal handler once. While its actual response was held, busy state and
  stage 3 persisted. Delivery then resumed without timing out. Exactly one
  start_analysis receipt and successful Run 01a0f231-8603-7106-a424-1c77a213b695.
- Report HMR: stage 5, professional mode, Session and final report 2 remained visible;
  same Main PID 93459/document and business receipts. Report screenshot inspected.
- Export: 43,140 bytes, SHA-256
  e94b1aabdc4c9ac29b216189866e689867b472572b8370034d763bf2e50cab12.
  Explicit restart/reopen retained the Run, two report versions and durable records.
- Protected synthetic Project: actual chooser returned FORBIDDEN; state.sqlite and
  synthetic sentinel inventories/hashes remained identical, including author readback.
- Runtime: runner Node 26.0.0; native Electron 44.4.3 with embedded Node 24.21.0,
  Chrome 152.0.7977.130; real DuckDB/Python via frozen toolchain descriptor. Runtime
  JSON and build/source hashes are retained. No Provider/model or production key.
- Existing CJS import.meta/deprecation warnings and explicit-restart notice remain
  in stderr. Exit 0 and actual Main/Preload execution passed; no warning was hidden.

Package-native-001 is evidence for the earlier engineering bundle, not a byte-identical
bundle of the final source. Its app.asar SHA-256 is
c78481ff5e6892c85a155f1b38a455fb5e1de35d764b5607d9d955badbe487c9.
The later Renderer root guard changes that bundle's Renderer output. Main/Preload,
packaged-mode denial, security/CSP, packaging and resource source stayed unchanged;
production initial mounting was rechecked by B2 and the entry regression. Author
impact assessment: no additional artifact-specific acceptance gap for this bounded
development supplement. Package/lifecycle are not rebuilt or rerun. This does not
claim current full-bundle or release acceptance; a future release must bind and
check its own final package. Validator may independently assess this applicability.

## Final candidate / remaining authority

Final current canonical portable + daily regression ran once as regression-final-001:
**2192 tests, 2191 PASS, 1 existing real-model gate skip, 0 FAIL; typecheck PASS**.
Counts bind its retained full output/source snapshot; no test/source changes followed.
Freeze-003 contains the final Worker files plus read-only approved intake, current
tracked/untracked attribution, source copies, current emitted Main/Preload/runtime
identities, original native-002 execution manifest, and raw evidence identities.
Native-001 and all earlier failures remain accessible through retained manifests.

No MacBook or installed app was inspected. Controller protected-readback-001 proves
its 45 frozen inputs and DMG011 unchanged; no historical user-project mutation claim.
The protected-project proof uses only the explicitly authorized synthetic Project.
No source/test change, GUI retry, package/lifecycle repeat, Git/board/archive write
or new agent occurred during evidence closure. Only Worker engineering docs/evidence
were updated. Independent Validator, Controller acceptance and authorized delivery
remain outstanding. Return the fixed candidate to Controller now; no Validator wait.

Freeze bookkeeping note: freeze-003 stopped before candidate inventory because its
copy assertion compared differing source/destination path fields. Bytes were copied;
no product failure. The incomplete directory and script are retained. Freeze-004
uses byte-length/SHA comparison and includes that failure evidence; no tests rerun.
