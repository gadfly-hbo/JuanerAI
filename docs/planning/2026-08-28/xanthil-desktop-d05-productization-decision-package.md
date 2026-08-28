# Xanthil Desktop D0.5 Productization Decision Package

> Package ID: `D05-XD-001`
> Status: fresh Development-Readiness Review 002 PASS; overall user approval recorded 2026-08-28; D1-A only
> Date: 2026-08-28
> Change class: first-Desktop foundation/boundary planning; no execution authority

## 1. Product result and source hierarchy

The first production program preserves the accepted dual-mode product experience while keeping all business state behind Xanthil Application use cases.

Authority order for this package is:

1. JuanerAI constitution, architecture, security, current approved product plan, and current OpenSpec;
2. this D0.5 package after user approval;
3. PX-2026-004 for professional-mode interaction evidence;
4. PX-2026-006 v0.2 for quick-mode and independent-conversation evidence;
5. Demo implementation details only as non-authoritative examples.

The first phase targets macOS Apple Silicon and Windows 11 x64. Intel macOS, Windows ARM64, Linux, enterprise deployment, and mobile are not first-phase promises.

## 2. D05-01 — Desktop technology and packaging

### Recommendation

Use Electron with TypeScript, React, Vite, and Electron Forge. The exact versions and checksums are frozen in the first Change, not in this plan.

- The renderer is a sandboxed local UI with `nodeIntegration: false`, `contextIsolation: true`, a restrictive CSP, blocked unexpected navigation/window creation, and no remote code.
- A preload exposes one method per approved Application command/query. It never exposes raw Electron IPC, filesystem, shell, child-process, database, Runtime, or network objects.
- The Electron main process owns window lifecycle and composes the Desktop Profile. Xanthil Application remains the semantic writer; the renderer does not own business transitions.
- Electron Forge produces platform-native distributables. First-phase release uses manually promoted signed artifacts; auto-update is deferred.

### Why this option

It reuses the repository's TypeScript/Node direction and Pi Adapter with the smallest language/runtime impedance. Electron's official guidance recommends Forge for packaging, and its security guidance requires context isolation, renderer sandboxing, narrow IPC, navigation controls, and current framework versions. The tradeoff is a larger packaged runtime and a continuing Electron/Chromium security-update obligation.

### Rejected for the first phase

- Tauri: smaller bundles, but it introduces Rust and a second native command layer before Xanthil has a stable Desktop Application interface.
- Native Swift + Windows native UI: duplicates the product surface and makes equivalent behavior harder to prove.
- Browser/PWA: cannot satisfy the local filesystem, packaged Python, offline, and desktop lifecycle requirements without another privileged local service.

### External evidence

- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron security checklist: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron packaging and Forge: <https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging>

## 3. D05-02 — Desktop process and module seams

```text
sandboxed renderer
  -> typed preload command/query interface
  -> Electron main / Desktop Profile
  -> Xanthil Application
  -> business Ports
  -> local storage, Python, Pi, and future Adapters
```

The Desktop shell is an experience surface, not a second business core. Application commands return closed business results. Progress is read through Application-owned observations; UI events never become authoritative merely because they occurred in the renderer.

Long-running Agent work runs outside the renderer. A later Runtime Change may use an Electron utility process or a separate Node child process behind the existing scenario-owned Runtime Port, but Electron process objects and message ports do not enter Product Core, Application, or public contracts.

## 4. D05-03 — Local Python technical boundary

### Environment and packaging

- Use CPython 3.13 as the first compatibility line; each release pins an exact maintained patch version.
- Manage Python source dependencies with `pyproject.toml` plus a committed `uv.lock`; builds run with the lock frozen.
- Package a one-folder PyInstaller sidecar separately on macOS and Windows. Do not use the user's system Python and do not download packages at product runtime.
- Build each platform on that platform. PyInstaller explicitly does not provide cross-platform builds.

### Process topology and IPC

- Start one short-lived sidecar process for one approved deterministic processing Run; no persistent Python daemon and no interpreter sharing between Sessions.
- Spawn the exact packaged executable with an argument array and `shell: false`, a Session-scoped working directory, a minimal environment allowlist, and hidden console on Windows.
- Use framed UTF-8 JSON messages over stdin/stdout with a versioned, closed request/result contract. Data files travel by pre-authorized relative locator plus identity/hash, not as raw rows in IPC or logs.
- Stderr is diagnostic evidence with secret/path redaction and a bounded byte budget; it is never a successful business result.

### Initial resource and cancellation policy

- At most one Python processing Run is active application-wide. The Python Change may accept one additional visible queued Run; a third request is rejected immediately as capacity-full with no Run identity and no filesystem side effect. This value is a product default, not an implementer-selected bound.
- The first synthetic scenario has a hard 60-second wall deadline, a hard 512 MiB process-tree memory ceiling, a hard 16 MiB combined stdout/stderr byte ceiling, and a 512 MiB final admitted-output ceiling. The wall, process-tree memory, and stream ceilings terminate the Run when crossed. The output ceiling is checked before admission; because it is not an OS disk quota, temporary bytes may transiently exceed it and still cannot become Evidence.
- The memory ceiling must be enforced for the whole process tree on both supported operating systems, not inferred from one-process sampling. If the Python Change cannot prove a macOS and Windows mechanism, it returns to Controller instead of downgrading the ceiling to observation.
- Application cancellation closes stdin and requests cooperative termination. After a hard five-second grace period the supervisor terminates the exact process tree and proves no descendant remains. A cancellation that linearizes before the terminal result wins; a terminal result already committed wins and cannot be relabelled cancelled by a late UI event.
- `cancelled`, `deadline_exceeded`, `resource_limit_exceeded`, `process_failed`, `protocol_failed`, and `output_rejected` are distinct product terminal classes; exact serialized error names remain Spec work.
- Any non-success terminal cannot admit aggregate Evidence. The Run's partial output directory is moved to a non-discoverable quarantine record for bounded diagnostics; it is never promoted, retried in place, or deleted automatically by the first Python Change.

### Security and capability boundary

The sidecar contains only Controller-approved deterministic operations. It exposes no generic Python, SQL, shell, file-browser, package-install, subprocess, plugin, or network command. The Application resolves and validates the Project/Session root, rejects absolute or escaping locators and symlinks, and passes only closed relative locators; the packaged operation revalidates before reading only the approved `010_draw` input and writing only the Run's temporary area under `020_clean`.

Filesystem locators, request vocabulary, deadlines, process-tree termination, and byte ceilings are technically enforced and receive negative tests. The no-network/no-subprocess rule is a trusted packaged-code and dependency-surface rule, verified by a closed dispatcher, dependency/import audit, negative command tests, and an actually disconnected success run; it is not an OS network sandbox and does not claim to contain arbitrary hostile Python. User-authored Python is out of scope.

### External evidence

- uv cross-platform lockfile: <https://docs.astral.sh/uv/concepts/projects/layout/>
- PyInstaller platform-specific builds: <https://pyinstaller.org/en/stable/usage.html#supporting-multiple-operating-systems>
- Node child-process cancellation and Windows behavior: <https://nodejs.org/api/child_process.html>

## 5. D05-04 — Persistence and local layout

### First-phase authority split

- Versioned closed JSON manifests and immutable artifacts under the chosen Project root are the canonical first-phase operational record.
- DuckDB belongs only to deterministic analytical data inside a Session's `020_clean`; it does not own Project, Session, conversation, Gate, report, or feedback lifecycle.
- SQLite is not introduced in the first phase. A later measured need for cross-Project querying or higher write concurrency may add SQLite as a new Adapter or rebuildable index through a separate boundary Change.

### Candidate Project layout

```text
<project-root>/.xanthil/
  project.json
  sessions/<session-id>/
    session.json
    010_draw/
    020_clean/
    060_reports/
```

The path is not identity. Project, Session, Run, Fork, Subagent task, Evidence, and Report use generated UUIDv7 identities; display names and slugs never participate in identity or path construction.

### Project bootstrap contract

- The user chooses an existing writable local directory with the native folder picker. That directory is the Project root; the product never silently adopts its parent, home directory, CLI run root, or a cloud/remote location it cannot prove supports the required atomic rename contract.
- A root without `.xanthil` may create a new Project. Application builds a same-filesystem `.xanthil.creating-<operation-id>` tree with a closed `project.json`, validates and syncs it, then atomically renames it to `.xanthil`. The Project is visible only after exact identity/version readback.
- If `.xanthil` already contains a supported valid `project.json`, the operation opens that Project and never creates a second identity. Repeating the same create/open operation is idempotent.
- Concurrent creators race only at the atomic rename. The winner's manifest becomes authority. The loser may open it only when exact readback proves the same accepted operation identity; otherwise it returns `Project already exists` and permits only cancel, reopen the existing Project, or choose another root.
- Missing/unwritable/unavailable roots fail without creating a Project. Malformed, incomplete, identity-conflicting, or unsupported-newer manifests are read-only blocked with no automatic repair or downgrade write. The visible next actions are cancel, choose another root, or install a compatible/newer Xanthil build; recovery/export is not falsely offered in the first Change.

### Session creation, recovery, and single-writer rule

Xanthil Desktop is a single application instance per OS user. A second launch sends its open request to the existing instance and focuses it; it never becomes a second writer. One Application-owned mutation queue exists per open Project, with one active and one pending Project mutation. A third mutation is rejected immediately as `Project busy` with no identity or filesystem side effect. Different Projects may be open in the same application instance.

Session creation builds a same-filesystem temporary directory containing all three required directories and a closed `session.json`, validates and syncs it, checks cancellation once immediately before publication, then atomically renames it to the final Session ID. The rename is the physical linearization point. Exact readback is the semantic publication point at which Application may emit `Session created`. Repeating the same operation identity returns the same result; a different operation never overwrites an existing Session identity.

Cancellation wins only before the publication rename. If rename already succeeded, closing a window or receiving a late cancel/response cannot undo or relabel the Session; the next readback reveals the created Session. If the process stops before rename, the temporary tree never appears as a Session. On the next startup, Application moves each verified in-root incomplete creation tree to `.xanthil/recovery/session-provisioning/<recovery-id>/` while holding the Project mutation slot. Quarantine is non-discoverable, retained for inspection, never completed automatically, and not automatically deleted in the first Change. The user sees `Session creation interrupted` and may continue by creating a new Session; an explicit quarantine cleanup workflow is deferred.

The first phase retains local records until explicit user deletion. In-app deletion and automatic retention expiry are not part of the first Change. External removal is detected as unavailable state and is never silently recreated. Existing CLI Runs remain read-only compatibility evidence and are neither moved nor rewritten.

Exact manifest fields, temp names, sync mechanics, and serialized errors remain behind the accompanying Structure/OpenSpec Gate. Root ownership, one-instance writer admission, queue bounds, rename/readback linearization, quarantine, and failure outcomes above are product decisions and are not implementer choices.

## 6. D05-05 — Project, Session, Run, Fork, and Subagent Runtime

- A Project is a durable local business-work context.
- A Session is a durable user-visible analytical work thread with an immutable `quick` or `professional` mode chosen at creation.
- A Run is one execution attempt. Retry always creates a new Run identity.
- A Conversation is a durable dialogue grain inside one Session. The main dialogue, each Fork dialogue, and each Subagent dialogue have separate Conversation identities; none is a child Session.
- A Fork is a child Conversation from an immutable parent Conversation message/checkpoint. It remains in the same fixed-mode Session, inherits only the explicitly approved `020_clean` snapshot subset, and never receives `010_draw`.
- A Subagent task has its own task identity and owns one separately visible Conversation in the same Session. It has explicit input snapshot, allowed data/tools, stop condition, and output contract. It is not a Decision authority.

The current Pi-backed `AgentAnalysisRuntime` direction is retained; D0.5 does not create a second Runtime, registry, fallback, or universal Runtime interface. Product Session persistence is owned by Xanthil, not by a Pi session object. Main, Fork, and Subagent conversations receive separate Runtime contexts and separate Run identities while preserving one selected Runtime identity for each Session lifetime.

Initial scheduling is finite and visible: at most two Agent Runs are active app-wide, at most one Run is active per Conversation, and at most one Subagent task is active per source Session. The accepted waiting queue is FIFO with capacity eight app-wide. An accepted queued task receives an identity and can be cancelled; a ninth waiting request is rejected immediately as capacity-full with no task/Run identity and no retry. App exit with queued or active work requires explicit cancel-and-exit or keep-running refusal; cancel-and-exit terminalizes queued work as cancelled and applies the same bounded process-tree termination to active work. No background daemon survives application exit in the first phase.

After crash or forced termination, in-flight work is marked interrupted and can be re-run only as a new Run. It is not automatically resumed.

Return semantics are frozen:

- A child terminal result that commits before cancellation wins; cancellation that commits first produces no result. Runtime late events cannot reverse either terminal.
- Fork return is manual and idempotent. One deterministic contribution identity is derived from the child terminal result; repeated return creates or resolves to the same pending contribution.
- Successful Subagent output returns automatically. Only a return transport failure/timeout exposes retry, and retry reuses the same contribution identity rather than rerunning the task.
- Return creates a provenance-bearing pending contribution against the parent revision observed at return. Adoption is a separate user decision that can affect Evidence, conclusions, and a new report draft.
- If the parent revision changes before adoption, the contribution remains pending and requires explicit reconfirmation against the current revision. The first committed adoption or rejection wins; repeated identical commands are idempotent and conflicting late commands are rejected. A successful adoption creates new derived records/versions and never rewrites prior Evidence or report versions.
- Failed or cancelled child work creates no result Evidence and no return card.

The selected Session Runtime identity remains fixed for parent, Fork, and Subagent conversations, while each has an isolated Runtime context and separate Run identity. Exact Runtime contract delta, scheduler implementation, event message shapes, and persistence schema belong to the later approved Runtime Change, but the grain, bounds, queue-full result, and race winners above are not implementer choices.

## 7. D05-06 — Skill and Prompt authority

The first phase consumes only Controller-approved bundled Skill and Prompt snapshots. Each Run records identity, semantic version, content SHA-256, declared purpose, allowed capability/data boundary, and compatibility. Editing, marketplace installation, remote publication, self-modification, and automatic upgrades are deferred. A changed bundled Skill or Prompt is a new version; historical Runs keep their original references.

## 8. D05-07 — Reports, feedback, and writeback

- A Report has a stable identity and immutable numbered versions. Adoption after a report creates a new draft; it never rewrites or retroactively expands an older version.
- Locking makes one version immutable and user-approved. It is not a Decision, Action authorization, or asset promotion.
- Recommendation, authorization, task, Execution Receipt, Outcome, attribution, and uncertainty remain separate records.
- The first Change is read-only for reusable Hypothesis and Strategy assets. Later D5 work may create explicit draft candidates only; promotion and activation remain separate Gates.

Executable report and feedback contracts are deferred until their own vertical Changes. Their user semantics are not deferred.

## 9. D05-08 — Provider, network, and data egress

The first Change and the local-Python Change use synthetic data and no real model/provider. No source/raw data, raw path, credential, environment, or unapproved prepared detail enters a model context. Any real provider or external network use requires a separate explicit user authorization, exact aggregate/evidence allowlist, purpose, retention/logging rule, and Change-specific negative evidence.

## 10. D05-09 — Cross-platform acceptance

### Evidence tiers

- macOS Apple Silicon job builds and launches the packaged app and sidecar on macOS.
- GitHub Actions `windows-2025` builds the Windows distributable, sidecar, and deterministic suites. This proves a Windows build environment, not end-user Windows 11 acceptance.
- Platform artifacts carry versions and checksums. macOS and Windows sidecars are built independently from the same locked source and contract tests.
- `CI build` proves compilation/packaging only; `packaged smoke` proves a built artifact starts and executes the Change's focused scenario on a host; `real-host acceptance` proves the user-visible and filesystem/process behavior on a controlled supported OS. No lower tier may be reported as a higher tier.

### Phase-by-phase matrix

| Change | macOS Apple Silicon | Windows hosted CI | Real Windows 11 x64 | Allowed completion claim |
|---|---|---|---|---|
| Session bootstrap | signed/development-packaged create, collision, crash quarantine, close/reopen, fixed-mode selector | distributable build plus automated packaged smoke for the same contract | required before Validator/Acceptance: install and replay create/open, atomic fault cases, second-launch routing, selector, close/reopen | fixed-mode local Project/Session bootstrap on both supported platforms |
| Local data preparation | packaged Python/DuckDB deterministic scenario, limits, cancellation, quarantine, offline | Windows sidecar build and automated contract/process tests | required before Change Acceptance for path, process-tree, memory/stream limits, cancellation, quarantine, offline run | bounded local preparation on both platforms; no model/provider claim |
| Evidence analysis through feedback | focused packaged scenario for each Change | build and focused automation | real-host replay is required for every platform-sensitive behavior added by that Change; a non-platform-sensitive contract-only Change may cite the last unchanged host baseline only when D1-A explicitly proves no host surface changed | only the behavior accepted by that Change |
| Phase-one activation | full integrated journey and signed rollback | release build verification | full installed `member-orders-v2` journey and signed rollback | `DA_REQUIRED_COMPLETE` candidate only after both real-host journeys pass |

The owner and availability of the real Windows host and signing/notarization credentials must be recorded in the signed authority package before DISPATCH of the first affected Change. If unavailable, D1-A may complete but DISPATCH is blocked; CI evidence cannot waive this prerequisite.

### Integrated product evidence

A controlled Windows 11 x64 VM or physical host must install and run the packaged app. Integrated phase acceptance replays Session provisioning, reload, cancellation/process-tree termination, file/path rules, Python processing, keyboard/focus, and the exact integrated `member-orders-v2` scenario. If that host is unavailable, Windows acceptance and `DA_REQUIRED_COMPLETE` remain blocked.

The same acceptance runs on a supported Apple Silicon Mac. CI screenshots or a browser-only Demo do not substitute for a packaged Electron run.

GitHub currently documents `windows-2025` hosted runners, while PyInstaller requires per-platform builds:

- <https://docs.github.com/en/actions/reference/runners/github-hosted-runners>
- <https://pyinstaller.org/en/stable/index.html>

## 11. D05-10 — Activation and rollback

- Desktop installs alongside the current CLI. It does not replace the `xanthil` CLI command, reuse the CLI run root for writes, or migrate historical Runs.
- First-phase activation is an explicit Desktop Profile flag/install channel after signed/notarized artifact verification and platform acceptance. Auto-update is deferred.
- Rollback disables/uninstalls the Desktop build while preserving its Project data. The previous signed build may be reinstalled; no downgrade writes to a newer manifest schema are permitted.
- A failed activation never rewrites CLI history or declares Desktop records compatible without readback.
- Signing/notarization certificates and a real Windows acceptance host are external prerequisites, not repository assumptions.

## 12. D05-11 — First Product Change candidate

### Candidate identity

`CHG-xanthil-desktop-session-bootstrap`

### Smallest user-observable result

On packaged macOS and real Windows 11 Desktop builds, a user opens or creates a synthetic Project, selects quick or professional mode, creates a fixed-mode Session, sees the three required directories provisioned as one completeness Gate, closes the app, reopens it, and observes the same Project/Session identity and immutable mode.

The persistent top selector controls which mode workspace is shown; it never converts the active Session. Selecting the other mode while viewing a Session switches to that mode's most recently opened Session in the same Project. If none exists, it shows that mode's empty home and opens/preselects the new-Session flow only after the user chooses `New Session`; creation is never implicit. The prior Session remains durable and any background state remains visible through its normal status. A newly created Session defaults to the currently selected mode and records that mode immutably.

This Change does not claim that quick-mode analysis or the professional six-stage workbench is implemented. It must not present PX-2026-006's professional placeholder as a finished product surface. The Session landing state is explicitly `not_started`, with no fake Run, Evidence, report, Fork, or Subagent result.

### Exact reuse

- TypeScript-first Product Core/Application/Port/Adapter/Profile direction.
- UUIDv7 identity and retry-as-new-attempt principle from current `local-analysis`.
- source/path fail-closed discipline, no hidden repair, immutable terminal evidence, and readback-before-success principles.
- current CLI behavior and historical Runs remain unchanged compatibility surfaces.

The current `member-orders-v1` executable contract, Pi in-memory Session, CLI interaction handle, run manifest, Artifact set, fixed provider/model, and CLI Profile are not silently generalized or reused as Desktop Session contracts.

### Required delta

- one Desktop Session domain record and Application create/open/list behavior;
- one narrow local Workspace Store Port and file Adapter;
- one Desktop Profile and Electron experience surface;
- versioned Project/Session manifests and atomic three-directory provisioning;
- macOS and Windows packaging/test seams;
- traceability to the accepted dual-mode Session semantics.

### Classification and evidence level

This is a foundation/boundary Change because it introduces a Desktop runtime/dependency, persistent identity/layout, crash recovery, IPC, packaging, and cross-platform activation seam. It uses the R2 role route, full OpenSpec path, early build/atomicity feasibility probes, Structure Gate, causal RED, platform contract tests, packaged-app smoke tests, real macOS and Windows 11 host evidence, fresh Validator, and retrospective.

### First-Change non-goals

- no Python, DuckDB, Pi/model invocation, real data, network, analysis, Fork, Subagent, Skill/Prompt execution, report, feedback, or asset writeback;
- no professional-mode six-stage implementation and no quick-mode analysis implementation;
- no SQLite, auto-update, migration, deletion UI, enterprise capability, or Model Pack;
- no Demo code copy.

### Candidate path families

Exact allowed paths are frozen only after D1-A and Spec drafting. Expected families are `apps/desktop/**`, bounded Desktop Session modules under `packages/**`, one local-storage Adapter, one Desktop Profile, exact tests/fixtures, package/build configuration, and the Change's OpenSpec artifacts. Root manifest/build changes remain Controller-owned and cannot overlap another Change.

## 13. Planned Change/PR order

Global WIP remains one. Each Change is a separate reviewed PR and archive cycle.

1. `CHG-xanthil-desktop-session-bootstrap` — Desktop shell, fixed-mode Session, atomic local persistence, packaged macOS/Windows smoke.
2. `CHG-xanthil-desktop-local-data-preparation` — exact `member-orders-v2` admission, bundled Python/DuckDB processing, aggregate Evidence, cancellation/recovery, no provider.
3. `CHG-xanthil-desktop-evidence-analysis` — professional evidence-based analysis plus quick explicit analysis trigger, retained Pi Runtime seam, Hypothesis/Evidence/Refutation.
4. `CHG-xanthil-desktop-independent-conversations` — Fork/Subagent independent conversations, scheduling, return/adoption, provenance, interruption.
5. `CHG-xanthil-desktop-report-lock` — report draft/version/review/lock and reproducibility.
6. `CHG-xanthil-desktop-feedback-drafts` — manual task/receipt/outcome separation and draft-only asset candidates.
7. `CHG-xanthil-desktop-phase-one-activation` — integrated macOS + Windows acceptance, signed artifacts, rollback, and `DA_REQUIRED_COMPLETE` user Gate.

The order is dependency intent, not blanket authorization. A later D1-A may combine or split a Change only when the user-visible result remains bounded and the complexity-control rule permits it.

`member-orders-v2` is the first **integrated productized vertical** completed by the whole Phase-One sequence. It is not the acceptance scenario of Session bootstrap and does not pull Python, analysis, Runtime, report, or feedback behavior into Change 1.

## 14. Gate result

After independent Development-Readiness Review 002 PASS, the user approved this package and the Structure Decision Ledger S01-S23 as one whole on 2026-08-28. The approval authorized only D1-A intake for `CHG-xanthil-desktop-session-bootstrap`. The separate fresh D1-A Product Plan Reviewer required by `product-change-execution-policy.md` then returned one bounded dependency/RED-order blocker; the Controller applied the policy's single bounded correction and completed targeted readback. D1-A semantics are now ready after prerequisites, but integration, exact dependency policy, real Windows host, signing/notarization, and the post-merge Mac mini baseline still block any signed DISPATCH. The D0.5 review does not replace D1-A review.

Spec, tests, implementation, dependencies, executable manifests, Port/schema/IPC contracts, and dispatch remain locked until their own Gates. The current D0.5 branch is MacBook Controller planning state only and creates no Mac mini WIP or active Change.
