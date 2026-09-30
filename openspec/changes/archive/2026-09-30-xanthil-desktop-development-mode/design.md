# Desktop development supplement — minimal engineering design

Authority: [confirmed intake](intake.md), DEV-01–07; adopted policy v0.8.
Base 6126112aa6ae167145b9ee38c84f6a648458e0e5 on work/mac-mini/desktop-development-mode.
DMG011 and archived product/UI inputs remain immutable. UI references: accepted
2026-09-18 clickable-ui-contract-v1.1 and 2026-09-28 Case Assistant UI Contract.
Only an explicit development label is added. No Application, Pi or IPC schema delta.

## Behaviors and decisions before implementation

1. DEV-01/03: `desktop:start` uses installed Forge/Vite and the formal Main,
   Preload and Renderer. A compile-time development endpoint is admitted only
   when unpackaged and exactly http://127.0.0.1:5173/. Packaged Main ignores
   development environment. Wrong endpoint fails closed before creating a window.
   Main/Preload compile once per start (`watch:null`), so edits require Ctrl-C and
   the same start command. Renderer HMR never submits operations from effects.
   The entry mounts only once per document; Fast Refresh updates the retained tree. Full reload fallback
   is suppressed for unsafe updates; the console requests explicit restart.
2. DEV-02/03: unpackaged development uses a dedicated root selected explicitly by
   JUANERAI_DESKTOP_DEV_ROOT (absolute) or a separate Xanthil Development directory.
   userData/sessionData/logs and Projects live underneath it. Project chooser
   rejects paths outside Projects and symlink escapes. Source import/export are
   confined to this development root. No automatic production key/config load:
   provider settings keep the existing capability with a separately compiled, fixed
   development-only Keychain namespace. Production defaults and protocol stay unchanged.
   See the retained credential refinement below for the superseded initial choice.
3. DEV-03: only exact endpoint and current Main frame can call existing IPC.
   Keep sandbox, isolation, webSecurity and denied permission/navigation/window
   policies. Vite binds IPv4 loopback, strict port, exact Host and Origin checks,
   no public directory, a minimal renderer/dependency file surface; development
   CSP permits only the local HMR connection and required Vite inline preamble.
   Packaged CSP remains unchanged. No arbitrary file or repository serving.
4. DEV-04: daily deterministic unit/contract/integration suites run without
   package creation; native development test explicitly runs the formal entry.
   Existing packaged module/GUI, resource, signature and installation tests remain
   separately callable. Keep every old assertion and disclose selection/mapping.
5. DEV-05/07: fixed source/build/runtime/input identities plus real local business
   evidence distinguish acceptance from a changing HMR session. Installed-artifact
   checks remain separate and impact-based; accepted Changes may share a release.

## Verification and effects

Seams already authorized by intake: native startup/current-frame IPC; real local
Application/Profile/SQLite/DuckDB/Python; renderer HMR; ordinary and artifact test
entrypoints. Causal source/config tests precede code; real native execution is
required evidence, never replaced by config tests. Native runner supplies only
synthetic native chooser paths, no business doubles, provider or key.

Initial loopback health passed. Two feasibility launches failed before Electron
attachment; first probe incorrectly used --version and was repaired with a real
sandboxed window entry. Neither failure is causal RED. Stop GUI retries in this
sandbox and return the bounded formal native command for Controller execution.
Raw evidence: R/engineering/feasibility-001 and feasibility-002.

No conditional path required at design time. No dependency, persistent schema,
public contract, Git mutation or independent validation is authorized here.

### Credential refinement before dependent implementation

Controller review correctly identifies that disabling model settings would change
normal product capability. Development instead composes the existing settings and
Pi Application path with a separately compiled helper, fixed development-only
service `com.juanerai.xanthil.development.xiaomi-token-plan-cn` and account `api-key`.
Production helper/defaults remain byte-source compatible outside this conditional.
The development helper cannot select production via environment/input. Explicit
user-entered development credentials use the normal settings flow; this package
never invokes a Provider, reads production credentials or fills a real key.
Native verification must use an empty new development state and no model request.
This supersedes design item 2's temporary unavailable-settings choice.

### Native correction: preserve the active React tree (DEV-01/06)

Input: a compatible Renderer edit during a selected professional Session, including
an unsaved draft or a submitted local-analysis command awaiting its IPC response.
Output: Fast Refresh updates the existing tree; mode, project, Session, stage,
draft and busy state remain. Exactly one submitted command reaches the real
Application. Failure must remain visible; no reselect/reopen or automatic retry.
The module entry mounts only once per document. Retaining the root alone is
insufficient: entry-level render of a new component identity runs before the
refresh runtime performs its queued family update (16 ms debounce in the installed
plugin runtime). The retained native-001 failure is causal UI RED.

Test-only pacing wraps the registered startAnalysis IPC handler, calls the real
handler unchanged once, then holds only delivery of its actual response for at
most 30 seconds. Application/store/DuckDB/Python continue unchanged. HMR must
preserve disabled submission and the active Session while this response is held;
release resumes the same promise. An additional unsaved form draft and completed
report view are asserted across HMR. No shipping pacing seam or model invocation.

DEV-02/06: create a synthetic protected Project through the real personal Profile
outside the development root, freeze its files, select it through the actual
native chooser boundary and assert FORBIDDEN plus identical before/after hashes.
Do not discover/copy user projects. This proves the boundary against synthetic
protected data, not historical real-project or installed-app integrity.

DEV-05/07: before host execution, retain independently read-back copies/hashes of
the candidate source, synthetic inputs and emitted Main/Preload. Host verifies
these identities before launch and after building. Newly generated business
outputs cannot be pre-hashed; freeze the expected assertions before execution,
and independently read/hash actual durable outputs as they are produced.

### Observed result and artifact applicability (evidence closure)

Controller native-002 completed on the freeze-002 execution manifest (exit 0).
The three compatible HMR surfaces retained active professional mode/project/Session,
stage, form/busy state and Main PID/document. One submitted startAnalysis produced
one successful Run and one start_analysis receipt; the test held response delivery,
not the real core. Export and fixed-source restart/reopen passed. The real chooser
rejected the synthetic protected Project outside the dev root; both protected
files matched before/after and author readback. This is author verification evidence,
not independent acceptance. Original native-001 failure remains immutable evidence.

The one engineering package was built before the Renderer entry correction. Its
package-native-001 result binds that earlier bundle, which has different Renderer
bytes. Main/Preload, packaged development denial, CSP/security and package resources
have not changed since that smoke; production first-mount behavior is separately
covered by current B2 and entry regression. This correction introduces no additional
artifact-specific behavior requiring a rebuild under DEV-04/05; no current full
bundle equivalence or release/installation acceptance is claimed. A later release
must build its actual final source and run the retained artifact obligations.
