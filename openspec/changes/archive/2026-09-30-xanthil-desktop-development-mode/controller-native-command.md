# Bounded Controller native correction run

## Executed handoff: native-002 PASS (retained command)

Controller executed this command after Worker released source and `.vite`/build ownership.
The native-002 result is PASS; no repeat is requested. The following is its retained
execution recipe. No editor,
launcher, daily test or other build may write these paths during the run.
`freeze-002` is the corrected candidate; `freeze-001` and native-001 remain history.
Use the existing approved Node26 toolchain in PATH and JUANERAI_TOOLCHAIN_BIN.
R is the existing desktop-development-mode artifact root; no installation needed.

```sh
JUANERAI_DEV_CANDIDATE="$R/engineering/freeze-002/execution-inputs.json" \
JUANERAI_DEV_EVIDENCE="$R/controller/native-002/native" \
  npm run desktop:test:native
```

Controller first creates only `$R/controller/native-002` for command/stdout/stderr/
exit capture; `native` must not exist. Preserve native-001 including failure.json,
hmr.png and the one successful analysis/two reports. Do not reuse its project.

Effects: owned loopback 127.0.0.1:5173; existing Forge/Vite generation under `.vite`
and `build`; cached development-only helper; real sandboxed Electron and existing
Main/Preload/Application/SQLite/DuckDB/Python; new isolated data/cache/Projects under
this run. No Provider, production key, installation, Git or historical data lookup.
Before launch the runner checks independently frozen source/CSV/emitted-code hashes,
then builds and checks the emitted code again. It captures the actual transformed
Renderer and copies/checks the synthetic CSV inputs before launch.

The runner creates a synthetic protected Project through the real Profile outside
its development root. Its first real UI chooser selection must return FORBIDDEN;
the complete protected file inventory and sentinel hashes must remain identical.
No arbitrary original-project sentinel environment option remains.

Three HMR checks retain professional mode, project, active Session and stage:

1. Unsaved business-background draft and form state survive compatible refresh.
2. A real submitted startAnalysis reaches the unchanged formal handler. Only its
   actual IPC response delivery is held (maximum 30 seconds); real calculation and
   storage keep running. During refresh/restore the same response remains pending,
   the submission stays disabled, and one command/Run/receipt exists. Then release
   that same promise and finish the actual analysis and report workflow.
3. The completed professional report view and export action survive refresh/restore
   with unchanged Main PID, document and database receipts; no reselect/reopen is
   used to repair HMR. Export, stop, explicit restart and durable reopen follow.

Temporary edits are limited to the Renderer development label and Main/Preload
comments; finally restores exact bytes. The run records failures and preserves its
new project. Business outputs get identities after real execution; their bytes are
not claimed to exist before execution. Expected assertions and inputs are frozen
before the host run. Return full outputs/exit and files to this same Worker.

## Already passed: retain, do not rerun for this correction

- `$R/controller/package-native-001/native/result.json`: isolated real packaged
  window, hostile development environment/root ignored, file URL/CSP/security,
  unchanged bytes of the one engineering package. No new copy or DMG needed.
- `$R/controller/lifecycle-001/native/result.json`: documented launcher startup,
  owned SIGINT shutdown and restart twice; port released each time.
- `$R/controller/protected-readback-001.json`: 45 frozen files and DMG011 unchanged.

These results retain their original candidate bindings. The renderer entry fix
preserves packaged first-mount behavior (affected B2 mount/contract GREEN) and does
not affect packaged development denial, launcher, Main, Preload, resources or
security. Do not represent the old engineering app as containing the corrected
Renderer. No MacBook, installed-app or historical user-project mutation claim.

Next: native-002 evidence is closed in verification.md and HANDOFF_BACK.md. Controller
dispatches the independent Validator on the final freeze-004 candidate.
This handoff is neither completion nor independent PASS nor Git authority.
